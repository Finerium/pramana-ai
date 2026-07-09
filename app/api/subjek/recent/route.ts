import type { NextRequest } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db/client";
import { anggota, koperasi, pinjaman, transaksi } from "../../../../db/schema";
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

    const trx = await db
      .select()
      .from(transaksi)
      .where(eq(transaksi.koperasiId, koperasiId))
      .orderBy(desc(transaksi.tanggal), desc(transaksi.id))
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

    return ok({
      saldoKas: kop.saldoKas,
      transaksi: trx,
      pinjaman: pinj,
      ratStatus: kop.ratStatus,
      anggota: anggotaList,
    });
  });
}
