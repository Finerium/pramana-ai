import type { NextRequest } from "next/server";
import { asc, desc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../../db/client";
import {
  anggota,
  koperasi,
  pinjaman,
  transaksi,
  unitUsaha,
} from "../../../../db/schema";
import { ApiError, ok, runRoute } from "../../../../lib/api";
import { koperasiForPengurus, requireRole } from "../../../../lib/auth";

export async function GET(req: NextRequest) {
  return runRoute(async () => {
    const s = await requireRole(req, "pengurus");
    const koperasiId = await koperasiForPengurus(s.userId);
    if (!koperasiId)
      throw new ApiError("FORBIDDEN", "Akun pengurus tidak terkait koperasi.");
    const { db } = getDb();

    const kopRows = await db
      .select({ saldoKas: koperasi.saldoKas, ratStatus: koperasi.ratStatus })
      .from(koperasi)
      .where(eq(koperasi.id, koperasiId))
      .limit(1);
    const kop = kopRows[0];
    if (!kop) throw new ApiError("NOT_FOUND", "Koperasi tidak ditemukan.");

    // Terbaru selalu di atas: entri bendahara (id ULID, bukan awalan seed
    // "trx-") mendahului seed. Dalam grup bendahara urut id desc (ULID =
    // time-ordered, terbaru dulu); seed urut tanggal desc. Grup memisah lebih
    // dulu, jadi kolom CASE campuran hanya dibanding sesama tipe.
    const trx = await db
      .select()
      .from(transaksi)
      .where(eq(transaksi.koperasiId, koperasiId))
      .orderBy(
        sql`(${transaksi.id} like 'trx-%')`,
        sql`case when ${transaksi.id} like 'trx-%' then ${transaksi.tanggal} else ${transaksi.id} end desc`,
        // Tiebreak stabil: seed dengan tanggal sama tetap deterministik (id desc,
        // seperti perilaku semula); tak berpengaruh pada grup ULID (id unik).
        desc(transaksi.id),
      )
      .limit(10);

    const pinj = await db
      .select({
        id: pinjaman.id,
        anggotaId: pinjaman.anggotaId,
        pokok: pinjaman.pokok,
        sisa: pinjaman.sisa,
        cicilanBulanan: pinjaman.cicilanBulanan,
        jatuhTempoBerikut: pinjaman.jatuhTempoBerikut,
        disetujuiPada: pinjaman.disetujuiPada,
        disetujuiOleh: pinjaman.disetujuiOleh,
        dokumenLengkap: pinjaman.dokumenLengkap,
      })
      .from(pinjaman)
      .innerJoin(anggota, eq(pinjaman.anggotaId, anggota.id))
      .where(eq(anggota.koperasiId, koperasiId))
      .orderBy(desc(pinjaman.disetujuiPada))
      .limit(5);

    // Perluasan aditif [L-08]: daftar anggota nyata untuk opsi form konsol (F-08).
    const anggotaList = await db
      .select({ id: anggota.id, nama: anggota.nama })
      .from(anggota)
      .where(eq(anggota.koperasiId, koperasiId))
      .orderBy(asc(anggota.nama));

    // Perluasan aditif [L-08]: unit usaha nyata agar form memetakan jenis -> id FK.
    const unitList = await db
      .select({
        id: unitUsaha.id,
        nama: unitUsaha.nama,
        jenis: unitUsaha.jenis,
      })
      .from(unitUsaha)
      .where(eq(unitUsaha.koperasiId, koperasiId))
      .orderBy(asc(unitUsaha.nama));

    return ok({
      saldoKas: kop.saldoKas,
      transaksi: trx,
      pinjaman: pinj,
      ratStatus: kop.ratStatus,
      anggota: anggotaList,
      unitUsaha: unitList,
    });
  });
}
