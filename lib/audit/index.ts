/**
 * Orkestrasi runAudit (blueprint 6.4 + docs/arsitektur-implementasi section 3).
 * Alur FINAL: 4 forensik paralel (allSettled) -> guard pass 1 (pra-adjudikator,
 * retry korektif 1x per agen, drop bila tetap melanggar) -> adjudikator pada
 * temuan tervalidasi + ringkasan snapshot -> guard pass 2 pada hasil tulis
 * ulang adjudikator + ringkasan (retry korektif 1x ke adjudikator, drop bila
 * tetap) -> hitung warna 6.1 pada himpunan temuan FINAL pasca-drop (usulan
 * adjudikator hanya masukan; penyimpangan dicatat metadata).
 *
 * PERSIST ke DB bukan tanggung jawab modul ini (wave 2). Kegagalan model
 * menyebar sebagai LLMUnavailable; jaring cache ada di lapisan API (wave 2).
 */
import { z } from "zod";
import { ulid } from "ulid";
import {
  AgentFinding,
  VerdictColor as VerdictColorSchema,
  type AgentId,
  type Verdict,
  type VerdictColor,
} from "../contracts";
import { RINGKASAN_LIVE } from "../copy";
import { periksaTemuan, periksaRingkasan } from "../registerGuard";
import { PROMPTS, ADJUDIKATOR, AGEN_FORENSIK } from "../prompts";
import { LLMUnavailable } from "../llm";
import {
  buildForensicPayload,
  buildRingkasanSnapshot,
  type KoperasiSnapshot,
} from "./snapshot";
import {
  buildGroundingIndex,
  periksaGrounding,
  type GroundingIndex,
} from "./grounding";
import { hitungWarna } from "./verdict";

// --- Skema I/O model ---------------------------------------------------------

const AgentFindingTanpaId = AgentFinding.omit({ id: true });
export type AgentFindingTanpaId = z.infer<typeof AgentFindingTanpaId>;

const ForensikOutput = z.object({ temuan: z.array(AgentFindingTanpaId) });
const AdjudikatorOutput = z.object({
  warna: VerdictColorSchema,
  ringkasan: z.string().max(200),
  temuan: z.array(AgentFindingTanpaId),
});

// --- Kontrak deps ------------------------------------------------------------

/** Transport chat berbentuk chatJSON; diinjeksi agar test memakai mock. */
export interface AuditChat {
  <S extends z.ZodType>(args: {
    system: string;
    user: string;
    schema: S;
    timeoutMs?: number;
  }): Promise<z.infer<S>>;
}

export interface RunAuditDeps {
  chat: AuditChat;
  /** Generator id temuan (ULID default); dapat dideterministikkan di test. */
  generateId?: () => string;
  now?: () => number;
  /**
   * Mode cepat (audit interaktif bendahara): LEWATI panggilan model adjudikator.
   * Temuan forensik tervalidasi langsung final; warna tetap dihitung server
   * (hitungWarna, yang memang selalu menang atas usulan model). Menghapus satu
   * ronde panggilan model sekuensial + retry-nya sehingga pohon pemeriksaan
   * bendahara selesai jauh lebih cepat. Jalur pemerintah tetap penuh (cepat off).
   */
  cepat?: boolean;
}

export interface TemuanDrop {
  tahap: "forensik" | "adjudikator";
  agent?: AgentId;
  judul: string;
  alasan: string[];
}

export interface AuditMetadata {
  agenGagal: AgentId[];
  /** Usulan warna adjudikator bila BERBEDA dari warna server; null bila sama. */
  warnaAdjudikator: VerdictColor | null;
  temuanDrop: TemuanDrop[];
  ringkasanDiganti: boolean;
}

export interface RunAuditResult {
  verdict: Verdict;
  metadata: AuditMetadata;
  durasiMs: number;
}

// --- Utilitas guard ----------------------------------------------------------

interface PartisiGuard {
  lolos: AgentFindingTanpaId[];
  gagal: Array<{ temuan: AgentFindingTanpaId; alasan: string[] }>;
}

function partisiGuard(
  temuan: AgentFindingTanpaId[],
  idx: GroundingIndex,
): PartisiGuard {
  const lolos: AgentFindingTanpaId[] = [];
  const gagal: PartisiGuard["gagal"] = [];
  for (const t of temuan) {
    const reg = periksaTemuan(t);
    const gnd = periksaGrounding(t, idx);
    const alasan = [
      ...(reg.ok ? [] : reg.alasan),
      ...(gnd.ok ? [] : gnd.alasan),
    ];
    if (alasan.length === 0) lolos.push(t);
    else gagal.push({ temuan: t, alasan });
  }
  return { lolos, gagal };
}

function daftarKoreksi(gagal: PartisiGuard["gagal"]): string {
  return gagal
    .map((g) => `- "${g.temuan.judul}": ${g.alasan.join("; ")}`)
    .join("\n");
}

const ATURAN_KOREKSI =
  "Perbaiki tanpa mengubah fakta: gunakan bahasa yang bertanya bukan menuduh, " +
  'sapaan "Anda", tanpa em dash, tanpa emoji, dan pertanyaan_rat berupa kalimat ' +
  'tanya yang diakhiri "?". HAPUS temuan yang buktinya tidak ada dalam data; ' +
  "jangan mengarang id transaksi atau pinjaman, hanya gunakan id yang tercantum " +
  "pada snapshot.";

// --- Guard pass 1: temuan forensik per agen ---------------------------------

async function guardForensik(
  agen: AgentId,
  temuan: AgentFindingTanpaId[],
  userForensik: string,
  deps: RunAuditDeps,
  metadata: AuditMetadata,
  idx: GroundingIndex,
): Promise<AgentFindingTanpaId[]> {
  const awal = partisiGuard(temuan, idx);
  if (awal.gagal.length === 0) return awal.lolos;

  // Retry korektif satu kali untuk agen ini.
  let ulangTemuan: AgentFindingTanpaId[] | null = null;
  try {
    const koreksi =
      `${userForensik}\n\nKoreksi wajib pada temuan berikut:\n` +
      `${daftarKoreksi(awal.gagal)}\n${ATURAN_KOREKSI}\n` +
      'Ulangi SELURUH temuan Anda sebagai JSON {"temuan":[...]}.';
    const out = await deps.chat({
      system: PROMPTS[agen],
      user: koreksi,
      schema: ForensikOutput,
    });
    ulangTemuan = out.temuan.map((t) => ({ ...t, agent: agen }));
  } catch {
    ulangTemuan = null;
  }

  if (ulangTemuan === null) {
    // Retry transport gagal: pertahankan yang lolos semula, catat drop.
    for (const g of awal.gagal)
      metadata.temuanDrop.push({
        tahap: "forensik",
        agent: agen,
        judul: g.temuan.judul,
        alasan: g.alasan,
      });
    return awal.lolos;
  }

  const ulang = partisiGuard(ulangTemuan, idx);
  for (const g of ulang.gagal)
    metadata.temuanDrop.push({
      tahap: "forensik",
      agent: agen,
      judul: g.temuan.judul,
      alasan: g.alasan,
    });
  return ulang.lolos;
}

// --- runAudit ----------------------------------------------------------------

export async function runAudit(
  snapshot: KoperasiSnapshot,
  deps: RunAuditDeps,
): Promise<RunAuditResult> {
  const gen = deps.generateId ?? ulid;
  const now = deps.now ?? Date.now;
  const mulai = now();

  const metadata: AuditMetadata = {
    agenGagal: [],
    warnaAdjudikator: null,
    temuanDrop: [],
    ringkasanDiganti: false,
  };

  // Index grounding: himpunan id bukti sah dari snapshot (anti-halusinasi).
  const idx = buildGroundingIndex(snapshot);

  // 1. Empat forensik paralel (allSettled).
  const userForensik = buildForensicPayload(snapshot);
  const hasil = await Promise.allSettled(
    AGEN_FORENSIK.map((agen) =>
      deps.chat({
        system: PROMPTS[agen],
        user: userForensik,
        schema: ForensikOutput,
      }),
    ),
  );

  // Kumpul temuan sukses + guard pass 1.
  const tervalidasi: AgentFindingTanpaId[] = [];
  for (let i = 0; i < AGEN_FORENSIK.length; i++) {
    const agen = AGEN_FORENSIK[i]!;
    const r = hasil[i]!;
    if (r.status === "rejected") {
      metadata.agenGagal.push(agen);
      continue;
    }
    // Stamp agent id secara defensif (agen tidak boleh salah label).
    const temuanAgen = r.value.temuan.map((t) => ({ ...t, agent: agen }));
    const lolos = await guardForensik(
      agen,
      temuanAgen,
      userForensik,
      deps,
      metadata,
      idx,
    );
    tervalidasi.push(...lolos);
  }

  // Semua agen gagal: tidak ada dasar audit -> LLMUnavailable (cache di wave 2).
  if (metadata.agenGagal.length === AGEN_FORENSIK.length) {
    throw new LLMUnavailable("seluruh agen forensik gagal");
  }

  // 2. Adjudikator. Pada mode cepat DILEWATI: temuan forensik tervalidasi (sudah
  //    lolos guard pass 1) langsung final; warna dihitung server; ringkasan pakai
  //    fallback copy. Selain itu (jalur penuh): panggil adjudikator + guard pass 2.
  let warnaUsul: VerdictColor | null = null;
  let ringkasan = "";
  let temuanFinal: AgentFindingTanpaId[];

  if (deps.cepat) {
    temuanFinal = tervalidasi;
  } else {
    // Kegagalan transport menyebar sebagai LLMUnavailable (jaring = cache).
    const userAdj = JSON.stringify({
      temuan: tervalidasi,
      ringkasanSnapshot: buildRingkasanSnapshot(snapshot),
    });
    const adj = await deps.chat({
      system: ADJUDIKATOR,
      user: userAdj,
      schema: AdjudikatorOutput,
    });

    // 3. Guard pass 2 pada hasil tulis ulang adjudikator + ringkasan.
    warnaUsul = adj.warna;
    ringkasan = adj.ringkasan;
    const pass2 = partisiGuard(adj.temuan, idx);
    const ringkasanBermasalah = !periksaRingkasan(ringkasan).ok;

    if (pass2.gagal.length > 0 || ringkasanBermasalah) {
      // Retry korektif satu kali ke adjudikator.
      let adj2: z.infer<typeof AdjudikatorOutput> | null = null;
      try {
        const bagian: string[] = [userAdj, "Koreksi wajib."];
        if (pass2.gagal.length > 0)
          bagian.push(`Temuan yang melanggar:\n${daftarKoreksi(pass2.gagal)}`);
        if (ringkasanBermasalah)
          bagian.push("Ringkasan melanggar register; tulis ulang yang bersih.");
        bagian.push(ATURAN_KOREKSI);
        adj2 = await deps.chat({
          system: ADJUDIKATOR,
          user: bagian.join("\n"),
          schema: AdjudikatorOutput,
        });
      } catch {
        adj2 = null;
      }

      if (adj2) {
        warnaUsul = adj2.warna;
        ringkasan = adj2.ringkasan;
        const ulang = partisiGuard(adj2.temuan, idx);
        for (const g of ulang.gagal)
          metadata.temuanDrop.push({
            tahap: "adjudikator",
            agent: g.temuan.agent,
            judul: g.temuan.judul,
            alasan: g.alasan,
          });
        temuanFinal = ulang.lolos;
      } else {
        // Retry transport gagal: pakai temuan lolos pass pertama, catat drop.
        for (const g of pass2.gagal)
          metadata.temuanDrop.push({
            tahap: "adjudikator",
            agent: g.temuan.agent,
            judul: g.temuan.judul,
            alasan: g.alasan,
          });
        temuanFinal = pass2.lolos;
      }
    } else {
      temuanFinal = pass2.lolos;
    }
  }

  // 4. Hitung warna 6.1 pada himpunan FINAL (server menang atas usulan).
  const warna = hitungWarna(temuanFinal);
  metadata.warnaAdjudikator = warnaUsul !== warna ? warnaUsul : null;

  // Ringkasan: pakai adjudikator bila lolos guard, selain itu fallback copy.
  if (!periksaRingkasan(ringkasan).ok) {
    // ponytail: lib/copy tidak punya ringkasan merah-live (hanya kuning/hijau,
    // merah-live memakai teks kuning yang netral dan bersih register). Upgrade:
    // tambah RINGKASAN_LIVE.merah bila butuh kalimat khusus merah non-fixture.
    ringkasan =
      warna === "merah" ? RINGKASAN_LIVE.kuning : RINGKASAN_LIVE[warna];
    metadata.ringkasanDiganti = true;
  }

  const verdict: Verdict = {
    warna,
    ringkasan,
    temuan: temuanFinal.map((t) => ({ ...t, id: gen() })),
  };

  return {
    verdict,
    metadata,
    durasiMs: Math.max(0, Math.round(now() - mulai)),
  };
}
