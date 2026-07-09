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
  SubjekTransaksiInput,
  SubjekPinjamanInput,
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

type Dict = Record<string, unknown>;
const asStr = (v: unknown, d = ""): string =>
  typeof v === "string" ? v : v == null ? d : String(v);
const asNum = (v: unknown, d = 0): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : d;
};

async function postJson(url: string, body: unknown): Promise<Dict | null> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = (await res.json()) as { ok?: boolean; data?: Dict };
    if (res.ok && j && j.ok) return j.data ?? {};
  } catch {
    /* fallback below */
  }
  return null;
}

function toTransaksiInput(f: TransaksiForm): SubjekTransaksiInput {
  const base: SubjekTransaksiInput = {
    jenis: f.jenis as SubjekTransaksiInput["jenis"],
    jumlah: parseInt(f.jumlah, 10),
    tanggal: f.tanggal,
    deskripsi: f.deskripsi,
  };
  if (f.jenis === "pembelian") {
    base.unitUsahaId = f.unitUsaha;
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

export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    /* best-effort; navigation happens regardless */
  }
}
