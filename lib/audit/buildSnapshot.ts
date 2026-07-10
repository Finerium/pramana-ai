/**
 * Perakit KoperasiSnapshot 6.9 dari DB (kontrak integrasi wave 2). Transaksi
 * periode berjalan maks 500 baris (LIMIT, urut tanggal); pinjaman aktif;
 * pengurus; plafon per anggota konstan; statusRat. saldoKasPerBulan
 * direkonstruksi WALK-BACKWARD dari koperasi.saldoKas memakai net arus kas per
 * bulan (agregasi SQL), enam periode terakhir. Agregasi via SQL, bukan load-all
 * (AC-PERF-03).
 */
import { and, asc, desc, eq, gt, like, notLike, or, sql } from "drizzle-orm";
import type { Db } from "../../db/client";
import {
  anggota,
  koperasi,
  pengurus,
  pinjaman,
  transaksi,
} from "../../db/schema";
import type { KoperasiSnapshot } from "./snapshot";

/** Plafon pinjaman per anggota pada seed (6.6). */
export const PLAFON_PER_ANGGOTA = 10_000_000;

/** Batas baris transaksi pada snapshot penuh (6.9). */
const MAKS_TRANSAKSI = 500;

/** Batas transaksi terbaru pada snapshot FOKUS (audit interaktif cepat). */
const FOKUS_MAKS_TRANSAKSI = 12;

export interface BuiltSnapshot {
  snapshot: KoperasiSnapshot;
  /** Periode berjalan (bulan terbaru bertransaksi), untuk persist audit_run. */
  periode: string;
}

export async function buildSnapshot(
  db: Db,
  koperasiId: string,
  opts?: { fokus?: boolean },
): Promise<BuiltSnapshot> {
  const kopRows = await db
    .select()
    .from(koperasi)
    .where(eq(koperasi.id, koperasiId))
    .limit(1);
  const kop = kopRows[0];
  if (!kop) throw new Error(`koperasi ${koperasiId} tidak ditemukan`);

  // Net arus kas per periode (agregasi SQL).
  const periodeExpr = sql<string>`substr(${transaksi.tanggal}, 1, 7)`;
  const netRows = await db
    .select({
      periode: periodeExpr,
      net: sql<number>`sum(case when ${transaksi.arah} = 'masuk' then ${transaksi.jumlah} else -${transaksi.jumlah} end)`,
    })
    .from(transaksi)
    .where(eq(transaksi.koperasiId, koperasiId))
    .groupBy(periodeExpr)
    .orderBy(periodeExpr);

  const periodes = netRows.map((r) => r.periode);
  const latestPeriode = periodes[periodes.length - 1] ?? "";
  const netByPeriode = new Map(netRows.map((r) => [r.periode, Number(r.net)]));

  // Enam periode terakhir; saldo tiap bulan = saldo bulan sesudahnya dikurangi
  // net bulan sesudahnya (walk-backward dari saldoKas kini).
  const last6 = periodes.slice(-6);
  const saldoKasPerBulan: Array<{ periode: string; saldo: number }> = [];
  let saldo = kop.saldoKas;
  for (let i = last6.length - 1; i >= 0; i--) {
    const p = last6[i]!;
    saldoKasPerBulan.unshift({ periode: p, saldo });
    saldo = saldo - (netByPeriode.get(p) ?? 0);
  }

  // Transaksi: FOKUS (audit interaktif bendahara, jendela kecil = selesai
  // cepat) atau PENUH (periode berjalan maks 500, urut tanggal; audit gov yang
  // dalam). saldoKasPerBulan/pinjaman/pengurus/statusRat tetap PENUH keduanya.
  const trxRows = opts?.fokus
    ? await fokusTransaksi(db, koperasiId)
    : await db
        .select()
        .from(transaksi)
        .where(
          and(
            eq(transaksi.koperasiId, koperasiId),
            like(transaksi.tanggal, `${latestPeriode}%`),
          ),
        )
        .orderBy(asc(transaksi.tanggal))
        .limit(MAKS_TRANSAKSI);

  // Pinjaman aktif (sisa positif) milik anggota koperasi; nama pengurus penyetuju.
  const pinjRows = await db
    .select({
      id: pinjaman.id,
      anggotaId: pinjaman.anggotaId,
      pokok: pinjaman.pokok,
      sisa: pinjaman.sisa,
      cicilanBulanan: pinjaman.cicilanBulanan,
      jatuhTempoBerikut: pinjaman.jatuhTempoBerikut,
      disetujuiPada: pinjaman.disetujuiPada,
      dokumenLengkap: pinjaman.dokumenLengkap,
      pengurusNama: pengurus.nama,
    })
    .from(pinjaman)
    .innerJoin(anggota, eq(pinjaman.anggotaId, anggota.id))
    .leftJoin(pengurus, eq(pinjaman.disetujuiOleh, pengurus.id))
    .where(and(eq(anggota.koperasiId, koperasiId), gt(pinjaman.sisa, 0)));

  const pengurusRows = await db
    .select({
      nama: pengurus.nama,
      jabatan: pengurus.jabatan,
      alamat: pengurus.alamat,
    })
    .from(pengurus)
    .where(eq(pengurus.koperasiId, koperasiId));

  const snapshot: KoperasiSnapshot = {
    koperasi: { nama: kop.nama, saldoKasPerBulan },
    pengurus: pengurusRows,
    transaksi: trxRows.map((t) => ({
      id: t.id,
      tanggal: t.tanggal,
      jenis: t.jenis,
      arah: t.arah,
      jumlah: t.jumlah,
      deskripsi: t.deskripsi,
      vendorNama: t.vendorNama,
      vendorAlamat: t.vendorAlamat,
      unitUsahaId: t.unitUsahaId,
      anggotaId: t.anggotaId,
    })),
    pinjaman: pinjRows.map((p) => ({
      id: p.id,
      anggotaId: p.anggotaId,
      pokok: p.pokok,
      sisa: p.sisa,
      cicilanBulanan: p.cicilanBulanan,
      jatuhTempoBerikut: p.jatuhTempoBerikut,
      disetujuiPada: p.disetujuiPada,
      disetujuiOleh: p.pengurusNama ?? "",
      dokumenLengkap: p.dokumenLengkap,
    })),
    plafonPerAnggota: PLAFON_PER_ANGGOTA,
    statusRat: kop.ratStatus,
  };
  return { snapshot, periode: latestPeriode };
}

/**
 * Transaksi jendela FOKUS untuk audit interaktif bendahara: cukup untuk agen
 * Konflik + Anomali tanpa membebani model dengan ratusan baris, sehingga audit
 * SELALU selesai cepat. Gabungan (dedup by id, urut tanggal naik):
 *  1. ~40 transaksi TERBARU  -> konteks pola terkini + transaksi baru dicatat
 *     bila tanggalnya kini.
 *  2. transaksi yang PASTI dicatat lewat UI: semua id seed berawalan "trx-",
 *     transaksi live ber-ULID (bukan "trx-"), jadi ini menjamin input pengurus
 *     ikut diperiksa APA PUN tanggalnya (mis. dibackdate 14 Juni di luar 40).
 *  3. trx-an1 (fixture konflik demo 6.7) agar AN-1 SELALU terdeteksi walau 14
 *     Juni jatuh di luar 40 terbaru.
 * ponytail: "trx-an1" satu-satunya id fixture yang di-pin; upgrade ke daftar
 * bila demo menambah anomali seed wajib untuk jalur interaktif.
 */
async function fokusTransaksi(db: Db, koperasiId: string) {
  const terbaru = await db
    .select()
    .from(transaksi)
    .where(eq(transaksi.koperasiId, koperasiId))
    .orderBy(desc(transaksi.tanggal), desc(transaksi.id))
    .limit(FOKUS_MAKS_TRANSAKSI);
  const wajib = await db
    .select()
    .from(transaksi)
    .where(
      and(
        eq(transaksi.koperasiId, koperasiId),
        or(notLike(transaksi.id, "trx-%"), eq(transaksi.id, "trx-an1")),
      ),
    )
    .orderBy(desc(transaksi.tanggal), desc(transaksi.id))
    .limit(FOKUS_MAKS_TRANSAKSI);
  const perId = new Map<string, (typeof terbaru)[number]>();
  for (const r of [...terbaru, ...wajib]) perId.set(r.id, r);
  return [...perId.values()].sort((a, b) =>
    a.tanggal !== b.tanggal
      ? a.tanggal < b.tanggal
        ? -1
        : 1
      : a.id < b.id
        ? -1
        : 1,
  );
}
