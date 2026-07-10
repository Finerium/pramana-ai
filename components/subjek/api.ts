/**
 * Klien endpoint konsol subjek (6.3): POST transaksi/pinjaman/rat, GET recent,
 * logout. Setiap pemanggilan mencoba endpoint nyata; bila belum tersedia atau
 * gagal, jatuh ke simulasi seed lokal sehingga konsol tetap hidup dan demo-proof
 * (CLAUDE.md aturan 7). Saat modul API /api/subjek/* mendarat, jalur live
 * otomatis menggantikan tanpa perubahan komponen.
 * ponytail: jaring fallback = satu-satunya cara verifikasi + demo tanpa API
 * hidup; jalur upgrade = endpoint nyata yang mem-persist ke DB (loop lintas
 * surface). Pemetaan bentuk live bersifat best-effort sampai integrasi.
 */
import type {
  AgentId,
  SubjekTransaksiInput,
  SubjekPinjamanInput,
  VerdictColor,
} from "@/lib/contracts";
import {
  SEED_RECENT,
  hitungSaldoBaru,
  type RecentData,
  type TransaksiForm,
  type PinjamanForm,
  type RatForm,
  type TransaksiEntry,
  type PinjamanEntry,
  type AnggotaOption,
} from "./logic";

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
// Lantai buatan agar state "Menyimpan..." + jahitan sinkron terlihat tanpa API
// hidup; latensi fetch nyata menggantikannya begitu /api/subjek/* mendarat.
const FALLBACK_MS = 700;

// P2-02: fallback seed TIDAK boleh menutupi penolakan auth. 401/403 = sesi
// salah/absen -> paksa ke /login, jangan render data simulasi.
function tolakAuth(status: number): boolean {
  if (status === 401 || status === 403) {
    if (typeof window !== "undefined") window.location.assign("/login");
    return true;
  }
  return false;
}

// Peta jenis unit usaha -> id baris DB untuk POST transaksi (form menyimpan
// jenis; API butuh unitUsahaId FK). Diperbarui dari /api/subjek/recent.
// ponytail: nilai awal = id fixture seed deterministik (AC-SEED-02).
let UNIT_ID_BY_JENIS: Record<string, string> = {
  sembako: "uu-gerai",
  simpan_pinjam: "uu-sp",
  apotek: "uu-apotek",
  gudang: "uu-gudang",
};

type Dict = Record<string, unknown>;
const asStr = (v: unknown, d = ""): string =>
  typeof v === "string" ? v : v == null ? d : String(v);
const asNum = (v: unknown, d = 0): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : d;
};

/** Error dari respons endpoint yang HADIR tetapi menolak (mis. 500/VALIDATION). */
export class SubjekApiError extends Error {}

/**
 * POST ke endpoint subjek. Mengembalikan data pada sukses; null HANYA saat
 * endpoint benar-benar tak terjangkau (fetch melempar / jaringan absen) supaya
 * konsol tetap hidup demo-proof; MELEMPAR SubjekApiError bila endpoint hadir
 * tetapi menolak, sehingga UI menampilkan kegagalan alih-alih sukses palsu.
 */
async function postJson(url: string, body: unknown): Promise<Dict | null> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return null; // jaringan absen: fallback demo
  }
  if (tolakAuth(res.status)) return null;
  const j = (await res.json().catch(() => null)) as {
    ok?: boolean;
    data?: Dict;
    error?: { message?: string };
  } | null;
  if (res.ok && j && j.ok) return j.data ?? {};
  throw new SubjekApiError(j?.error?.message ?? "Permintaan gagal diproses.");
}

function toTransaksiInput(f: TransaksiForm): SubjekTransaksiInput {
  const base: SubjekTransaksiInput = {
    jenis: f.jenis as SubjekTransaksiInput["jenis"],
    jumlah: parseInt(f.jumlah, 10),
    tanggal: f.tanggal,
    deskripsi: f.deskripsi,
  };
  if (f.jenis === "pembelian") {
    // Form menyimpan JENIS unit ("sembako"); API/FK butuh id baris (uu-gerai).
    const unitId = UNIT_ID_BY_JENIS[f.unitUsaha];
    if (unitId) base.unitUsahaId = unitId;
    base.vendorNama = f.vendorNama;
    base.vendorAlamat = f.vendorAlamat;
  }
  if (f.anggota) base.anggotaId = f.anggota;
  return base;
}
function toPinjamanInput(f: PinjamanForm): SubjekPinjamanInput {
  return {
    anggotaId: f.anggota,
    pokok: parseInt(f.pokok, 10),
    cicilanBulanan: parseInt(f.cicilan, 10),
    jatuhTempoBerikut: f.jatuhTempo,
    disetujuiOleh: f.disetujuiOleh,
    dokumenLengkap: f.dokumenLengkap,
  };
}

function mapRecent(raw: unknown): RecentData {
  const d = (raw ?? {}) as Dict;
  const trxRaw = d.transaksi;
  const pinRaw = d.pinjaman;
  const angRaw = d.anggota;
  const transaksi: TransaksiEntry[] = Array.isArray(trxRaw)
    ? trxRaw.map((x, i) => {
        const t = x as Dict;
        return {
          id: asStr(t.id, "srv-t" + i),
          tanggal: asStr(t.tanggal),
          jenis: asStr(t.jenis, "operasional"),
          jumlah: asNum(t.jumlah),
          pihak: asStr(t.pihak ?? t.vendorNama ?? t.anggotaNama, "Koperasi"),
          sync: "tersinkron",
        };
      })
    : SEED_RECENT.transaksi;
  const pinjaman: PinjamanEntry[] = Array.isArray(pinRaw)
    ? pinRaw.map((x, i) => {
        const p = x as Dict;
        return {
          id: asStr(p.id, "srv-p" + i),
          anggota: asStr(p.anggota ?? p.anggotaNama, "Anggota"),
          pokok: asNum(p.pokok),
          cicilan: asNum(p.cicilan ?? p.cicilanBulanan),
          jatuhTempo: asStr(p.jatuhTempo ?? p.jatuhTempoBerikut),
          dokumenLengkap: Boolean(p.dokumenLengkap),
          sync: "tersinkron",
        };
      })
    : SEED_RECENT.pinjaman;
  const anggota: AnggotaOption[] =
    Array.isArray(angRaw) && angRaw.length
      ? angRaw.map((x) => {
          const a = x as Dict;
          return {
            value: asStr(a.value ?? a.id),
            label: asStr(a.label ?? a.nama),
          };
        })
      : SEED_RECENT.anggota;
  const unitRaw = d.unitUsaha;
  if (Array.isArray(unitRaw) && unitRaw.length) {
    const map: Record<string, string> = {};
    for (const x of unitRaw) {
      const u = x as Dict;
      const jenis = asStr(u.jenis);
      const id = asStr(u.id);
      if (jenis && id) map[jenis] = id;
    }
    if (Object.keys(map).length) UNIT_ID_BY_JENIS = map;
  }
  return {
    saldoKas: asNum(d.saldoKas, SEED_RECENT.saldoKas),
    transaksi,
    pinjaman,
    ratStatus: d.ratStatus === "terlaksana" ? "terlaksana" : "belum",
    ratTanggal: typeof d.ratTanggal === "string" ? d.ratTanggal : null,
    anggota,
  };
}

export async function fetchRecent(): Promise<RecentData> {
  try {
    const res = await fetch("/api/subjek/recent", { cache: "no-store" });
    if (tolakAuth(res.status)) return SEED_RECENT;
    const j = (await res.json()) as { ok?: boolean; data?: unknown };
    if (res.ok && j && j.ok) return mapRecent(j.data);
  } catch {
    /* seed fallback */
  }
  return SEED_RECENT;
}

export async function postTransaksi(
  form: TransaksiForm,
  saldo: number,
): Promise<{ transaksiId: string; saldoKasBaru: number }> {
  const local = () =>
    hitungSaldoBaru(saldo, form.jenis, parseInt(form.jumlah, 10));
  const data = await postJson("/api/subjek/transaksi", toTransaksiInput(form));
  if (data && data.transaksiId !== undefined)
    return {
      transaksiId: asStr(data.transaksiId),
      saldoKasBaru: asNum(data.saldoKasBaru, local()),
    };
  await delay(FALLBACK_MS);
  return { transaksiId: "lokal-" + Date.now(), saldoKasBaru: local() };
}

export async function postPinjaman(
  form: PinjamanForm,
): Promise<{ pinjamanId: string }> {
  const data = await postJson("/api/subjek/pinjaman", toPinjamanInput(form));
  if (data && data.pinjamanId !== undefined)
    return { pinjamanId: asStr(data.pinjamanId) };
  await delay(FALLBACK_MS);
  return { pinjamanId: "lokal-" + Date.now() };
}

export async function postRat(form: RatForm): Promise<{ ratStatus: string }> {
  const body =
    form.status === "terlaksana"
      ? { status: form.status, tanggal: form.tanggal }
      : { status: form.status };
  const data = await postJson("/api/subjek/rat", body);
  return { ratStatus: asStr(data?.ratStatus, form.status) };
}

// ---- Audit Pramana (diagram tree konsol) ------------------------------------
// TANPA fallback simulasi: hasil pemeriksaan WAJIB nyata dari audit tersimpan.
// Gagal jaringan/ditolak = null; UI menampilkan keadaan gagal yang jujur.

export type SubjekAuditAgen = {
  agent: AgentId;
  jumlah: number;
  contohBukti: string | null;
};
export type SubjekAuditStatus = {
  status: "berjalan" | "selesai" | "gagal_langsung";
  verdict: { warna: VerdictColor; ringkasan: string } | null;
  temuanPerAgen: SubjekAuditAgen[];
  // Jumlah anggota koperasi yang menerima hasil ini bila verdict merah/kuning
  // (perlu penjelasan/perhatian); 0 bila hijau. Dihitung server-side dari DB.
  anggotaDinotif: number;
};

/** Satu baris riwayat pemeriksaan live (GET /api/subjek/riwayat). */
export type SubjekRiwayatItem = {
  id: string;
  dibuatPada: string;
  verdictWarna: VerdictColor;
  temuanCount: number;
};

export async function postAudit(): Promise<{ auditRunId: string } | null> {
  try {
    const data = await postJson("/api/subjek/audit", {});
    if (data && typeof data.auditRunId === "string")
      return { auditRunId: data.auditRunId };
  } catch {
    /* endpoint menolak: tanpa audit palsu */
  }
  return null;
}

export async function fetchAuditStatus(
  id: string,
): Promise<SubjekAuditStatus | null> {
  try {
    const res = await fetch(`/api/subjek/audit/${id}`, { cache: "no-store" });
    if (tolakAuth(res.status)) return null;
    const j = (await res.json()) as { ok?: boolean; data?: SubjekAuditStatus };
    if (res.ok && j && j.ok && j.data)
      return {
        ...j.data,
        anggotaDinotif:
          typeof j.data.anggotaDinotif === "number" ? j.data.anggotaDinotif : 0,
      };
  } catch {
    /* jaringan absen: polling berikutnya mencoba lagi */
  }
  return null;
}

/**
 * Riwayat pemeriksaan live koperasi (bounded, terbaru dulu). Gagal/absen =
 * array kosong; panel riwayat cukup menyembunyikan diri, bukan mengarang.
 */
export async function fetchRiwayat(): Promise<SubjekRiwayatItem[]> {
  try {
    const res = await fetch("/api/subjek/riwayat", { cache: "no-store" });
    if (tolakAuth(res.status)) return [];
    const j = (await res.json()) as {
      ok?: boolean;
      data?: { riwayat?: unknown };
    };
    const list = j?.data?.riwayat;
    if (res.ok && j && j.ok && Array.isArray(list))
      return list.map((x) => {
        const r = x as Dict;
        return {
          id: asStr(r.id),
          dibuatPada: asStr(r.dibuatPada),
          verdictWarna: (r.verdictWarna === "merah" ||
          r.verdictWarna === "kuning"
            ? r.verdictWarna
            : "hijau") as VerdictColor,
          temuanCount: asNum(r.temuanCount),
        };
      });
  } catch {
    /* seed/kosong: panel riwayat menyembunyikan diri */
  }
  return [];
}

/**
 * Reset demo: hapus entri + pemeriksaan live yang ditambah bendahara dan
 * kembalikan saldo ke baseline seed. True bila endpoint mengonfirmasi sukses.
 */
export async function postReset(): Promise<boolean> {
  try {
    const data = await postJson("/api/subjek/reset", {});
    return data !== null;
  } catch {
    return false;
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    /* best-effort; navigation happens regardless */
  }
}
