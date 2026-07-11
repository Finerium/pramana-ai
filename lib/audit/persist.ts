/**
 * Persistensi hasil audit live + orkestrasi live audit + query bersama
 * audit_run. Baris MARKER kegagalan (rawJson.status = "gagal_langsung")
 * menyalin verdictWarna+ringkasan run tersimpan terakhir (keputusan L-07;
 * skema 6.2 tak punya kolom status). Semua query verdict/temuan/tren/overview
 * WAJIB mengecualikan marker via bukanMarker.
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { ulid } from "ulid";
import { getDb, type Db } from "../../db/client";
import { anggota, auditRun, notifikasi, temuan } from "../../db/schema";
import { hasLlmKey } from "../env";
import { recordLlmSuccess } from "../api";
import { COPY } from "../copy";
import { chatJSON } from "../llm";
import { buildSnapshot } from "./buildSnapshot";
import { runAudit, type AuditChat, type RunAuditResult } from "./index";

/**
 * Timeout per panggilan model untuk audit LIVE. MiniMax-M2.7 SELALU menalar
 * (`<think>`) dan tak punya knob mematikannya (terverifikasi), sehingga satu
 * panggilan forensik/adjudikator dapat melampaui default 30s lib/llm. Dinaikkan
 * ke 110s: forensik berjalan paralel, audit jalan di after() latar (anggaran
 * fungsi Vercel 300s), dan cache tetap jaring bila tetap terlampaui.
 */
const AUDIT_CALL_TIMEOUT_MS = 110_000;

/** Predikat: baris audit_run BUKAN marker (gagal_langsung maupun berjalan). */
export const bukanMarker = sql`json_extract(${auditRun.rawJson}, '$.status') is not 'gagal_langsung' and json_extract(${auditRun.rawJson}, '$.status') is not 'berjalan'`;

export type AuditRunRow = typeof auditRun.$inferSelect;

/** Run tersimpan terbaru non-marker milik koperasi (periode lalu waktu, desc). */
export async function latestRun(
  db: Db,
  koperasiId: string,
): Promise<AuditRunRow | undefined> {
  const rows = await db
    .select()
    .from(auditRun)
    .where(and(eq(auditRun.koperasiId, koperasiId), bukanMarker))
    .orderBy(desc(auditRun.periode), desc(auditRun.dibuatPada))
    .limit(1);
  return rows[0];
}

/** Simpan run live sukses: audit_run source=live + temuan (transaksional). */
export async function persistLiveRun(
  db: Db,
  args: {
    auditRunId: string;
    koperasiId: string;
    periode: string;
    result: RunAuditResult;
  },
): Promise<void> {
  const { auditRunId, koperasiId, periode, result } = args;
  const now = new Date().toISOString();
  await db.transaction(async (tx) => {
    await tx.insert(auditRun).values({
      id: auditRunId,
      koperasiId,
      periode,
      source: "live",
      verdictWarna: result.verdict.warna,
      ringkasan: result.verdict.ringkasan,
      durasiMs: result.durasiMs,
      rawJson: JSON.stringify({
        verdict: result.verdict,
        metadata: result.metadata,
      }),
      dibuatPada: now,
    });
    const rows = result.verdict.temuan.map((t) => ({
      id: t.id,
      auditRunId,
      agent: t.agent,
      severity: t.severity,
      judul: t.judul,
      penjelasanAwam: t.penjelasan_awam,
      kenapaPenting: t.kenapa_penting,
      pertanyaanRat: t.pertanyaan_rat,
      buktiJson: JSON.stringify(t.bukti),
      tanggapanPengurus: null,
    }));
    if (rows.length !== 0) await tx.insert(temuan).values(rows);

    // Tutup loop ke anggota: verdict merah/kuning = ada yang perlu Anda
    // tanyakan, kirim notifikasi ke SEMUA anggota koperasi (badge belum-dibaca
    // di member/summary naik otomatis). Hijau = koperasi sehat, TANPA notif.
    // {n} = jumlah temuan NYATA run ini (bukan literal).
    const warna = result.verdict.warna;
    if (warna === "merah" || warna === "kuning") {
      const anggotaRows = await tx
        .select({ id: anggota.id })
        .from(anggota)
        .where(eq(anggota.koperasiId, koperasiId));
      const teks = COPY["notif.template"].replace(
        "{n}",
        String(result.verdict.temuan.length),
      );
      if (anggotaRows.length !== 0)
        await tx.insert(notifikasi).values(
          anggotaRows.map((a) => ({
            id: ulid(),
            anggotaId: a.id,
            teks,
            dibacaPada: null,
            dibuatPada: now,
          })),
        );
    }
  });
}

/**
 * Simpan marker kegagalan live (L-07): verdictWarna+ringkasan disalin dari run
 * tersimpan terakhir non-marker; periode ikut run tersebut. Marker dikecualikan
 * semua query hasil, hanya dipakai polling status.
 */
export async function persistFailureMarker(
  db: Db,
  args: { auditRunId: string; koperasiId: string; periode: string },
): Promise<void> {
  const last = await latestRun(db, args.koperasiId);
  await db.insert(auditRun).values({
    id: args.auditRunId,
    koperasiId: args.koperasiId,
    periode: last?.periode ?? args.periode,
    source: "live",
    verdictWarna: last?.verdictWarna ?? "kuning",
    ringkasan: last?.ringkasan ?? "",
    durasiMs: 0,
    rawJson: JSON.stringify({ status: "gagal_langsung" }),
    dibuatPada: new Date().toISOString(),
  });
}

/** true bila marker "berjalan-<id>" masih ada (audit belum dibatalkan reset). */
async function markerHidup(db: Db, auditRunId: string): Promise<boolean> {
  try {
    const rows = await db
      .select({ id: auditRun.id })
      .from(auditRun)
      .where(eq(auditRun.id, "berjalan-" + auditRunId))
      .limit(1);
    return rows.length > 0;
  } catch {
    // DB blip: jangan batalkan persist yang sah (default anggap masih hidup).
    return true;
  }
}

/**
 * Orkestrasi live audit (F12, 6.4) untuk dijalankan latar (after()). Tanpa key
 * LLM: langsung marker gagal_langsung (nol panggilan provider, AC-DEMO-03).
 * Dengan key: buildSnapshot -> runAudit -> persist sukses; kegagalan apa pun
 * (LLMUnavailable dsb) -> marker. chat/hasKey injectable untuk test.
 *
 * cancelViaMarker (jalur subjek yang menyisipkan marker "berjalan-"): sebelum
 * persist, cek marker masih ada. Reset (/api/subjek/reset) menghapus baris
 * source=live termasuk marker; marker hilang = audit dibatalkan -> LEWATI
 * persist (tanpa run/temuan/notif hantu). Jalur gov TIDAK memakai marker
 * (cancelViaMarker undefined) -> persist normal, tidak terpengaruh.
 */
export async function runLiveAudit(
  auditRunId: string,
  koperasiId: string,
  deps?: {
    chat?: AuditChat;
    hasKey?: () => boolean;
    fokus?: boolean;
    cancelViaMarker?: boolean;
  },
): Promise<void> {
  const { db } = getDb();
  const hasKey = deps?.hasKey ?? hasLlmKey;
  const dibatalkan = async () =>
    deps?.cancelViaMarker === true && !(await markerHidup(db, auditRunId));
  try {
    if (!hasKey()) {
      if (await dibatalkan()) return;
      await persistFailureMarker(db, { auditRunId, koperasiId, periode: "" });
      return;
    }
    const chat: AuditChat =
      deps?.chat ??
      ((a) =>
        chatJSON({ ...a, timeoutMs: a.timeoutMs ?? AUDIT_CALL_TIMEOUT_MS }));
    try {
      // fokus:true (trigger bendahara) = snapshot kecil DAN lewati adjudikator
      // (mode cepat) supaya pohon pemeriksaan interaktif selesai jauh lebih cepat;
      // default false (gov) = snapshot penuh + adjudikator = audit dalam.
      const { snapshot, periode } = await buildSnapshot(db, koperasiId, {
        fokus: deps?.fokus,
      });
      const result = await runAudit(snapshot, { chat, cepat: deps?.fokus });
      recordLlmSuccess();
      if (await dibatalkan()) return;
      await persistLiveRun(db, { auditRunId, koperasiId, periode, result });
    } catch {
      if (await dibatalkan()) return;
      await persistFailureMarker(db, {
        auditRunId,
        koperasiId,
        periode: "",
      }).catch(() => {});
    }
  } finally {
    // Hapus marker "sedang diperiksa" apa pun hasilnya (sukses/gagal/tanpa key).
    // Indikator dashboard pemerintah berhenti begitu audit selesai.
    try {
      await db
        .delete(auditRun)
        .where(eq(auditRun.id, "berjalan-" + auditRunId));
    } catch {
      // ponytail: cleanup best-effort; gov route punya batas 5 menit anti-phantom.
    }
  }
}
