/**
 * Perakit KoperasiSnapshot 6.9 dari DB (kontrak integrasi wave 2). Transaksi
 * periode berjalan maks 500 baris (LIMIT, urut tanggal); pinjaman aktif;
 * pengurus; plafon per anggota konstan; statusRat. saldoKasPerBulan
 * direkonstruksi WALK-BACKWARD dari koperasi.saldoKas memakai net arus kas per
 * bulan (agregasi SQL), enam periode terakhir. Agregasi via SQL, bukan load-all
 * (AC-PERF-03).
 */
import { and, asc, eq, gt, like, sql } from "drizzle-orm";
import type { Db } from "../../db/client";
import { anggota, koperasi, pengurus, pinjaman, transaksi } from "../../db/schema";
import type { KoperasiSnapshot } from "./snapshot";

/** Plafon pinjaman per anggota pada seed (6.6). */
export const PLAFON_PER_ANGGOTA = 10_000_000;

/** Batas baris transaksi pada snapshot (6.9). */
const MAKS_TRANSAKSI = 500;

export interface BuiltSnapshot {
  snapshot: KoperasiSnapshot;
  /** Periode berjalan (bulan terbaru bertransaksi), untuk persist audit_run. */
  periode: string;
}

export async function buildSnapshot(
  db: Db,
  koperasiId: string,
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

  // Transaksi periode berjalan (maks 500, urut tanggal).
  const trxRows = await db
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
