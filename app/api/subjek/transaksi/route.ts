import type { NextRequest } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { ulid } from "ulid";
import { getDb } from "../../../../db/client";
import { koperasi, transaksi, unitUsaha } from "../../../../db/schema";
import { ApiError, ok, runRoute } from "../../../../lib/api";
import {
  anggotaMilikKoperasi,
  koperasiForPengurus,
  requireRole,
} from "../../../../lib/auth";
import { hariIniWIB, tanggalIsoValid } from "../../../../lib/waktu";

const Body = z.object({
  jenis: z.enum([
    "pembelian",
    "penjualan",
    "setoran_simpanan",
    "penarikan_simpanan",
    "pencairan_pinjaman",
    "angsuran",
    "gaji",
    "operasional",
  ]),
  jumlah: z.number().int().positive(),
  tanggal: z.string().min(1),
  unitUsahaId: z.string().optional(),
  vendorNama: z.string().optional(),
  vendorAlamat: z.string().optional(),
  deskripsi: z.string().min(1),
  anggotaId: z.string().optional(),
});

// arah derived (6.3): masuk untuk setoran/penjualan/angsuran, selain itu keluar.
const MASUK = new Set(["setoran_simpanan", "penjualan", "angsuran"]);

export async function POST(req: NextRequest) {
  return runRoute(async () => {
    const s = await requireRole(req, "pengurus");
    const koperasiId = await koperasiForPengurus(s.userId);
    if (!koperasiId)
      throw new ApiError("FORBIDDEN", "Akun pengurus tidak terkait koperasi.");

    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success)
      throw new ApiError(
        "VALIDATION",
        "Data transaksi tidak lengkap atau tidak sah.",
      );
    const b = parsed.data;
    // Trust boundary: tanggal wajib YYYY-MM-DD valid dan rentang wajar (2020
    // s.d. hari ini WIB). String bebas / tanggal masa depan meracuni periode
    // snapshot audit dan urutan latestRun (sort leksikografis).
    if (
      !tanggalIsoValid(b.tanggal) ||
      b.tanggal < "2020-01-01" ||
      b.tanggal > hariIniWIB()
    ) {
      throw new ApiError(
        "VALIDATION",
        "Tanggal transaksi tidak sah. Gunakan tanggal yang benar, paling lama tahun 2020 dan tidak melebihi hari ini.",
      );
    }
    if (b.jenis === "pembelian" && (!b.vendorNama || !b.vendorAlamat)) {
      throw new ApiError(
        "VALIDATION",
        "Pembelian wajib menyertakan nama dan alamat penjual.",
      );
    }
    // Anti IDOR: anggota terkait wajib milik koperasi pengurus sesi.
    if (b.anggotaId && !(await anggotaMilikKoperasi(b.anggotaId, koperasiId))) {
      throw new ApiError(
        "VALIDATION",
        "Anggota tidak terdaftar di koperasi ini.",
      );
    }
    const arah: "masuk" | "keluar" = MASUK.has(b.jenis) ? "masuk" : "keluar";
    const transaksiId = ulid();
    const delta = arah === "masuk" ? b.jumlah : -b.jumlah;
    const { db } = getDb();

    // Validasi unitUsaha sebelum insert: id tak dikenal (atau milik koperasi
    // lain) harus VALIDATION, bukan 500 karena pelanggaran FK.
    if (b.unitUsahaId) {
      const unit = await db
        .select({ id: unitUsaha.id })
        .from(unitUsaha)
        .where(
          and(
            eq(unitUsaha.id, b.unitUsahaId),
            eq(unitUsaha.koperasiId, koperasiId),
          ),
        )
        .limit(1);
      if (!unit[0]) {
        throw new ApiError(
          "VALIDATION",
          "Unit usaha tidak terdaftar di koperasi ini.",
        );
      }
    }

    const saldoKasBaru = await db.transaction(async (tx) => {
      await tx.insert(transaksi).values({
        id: transaksiId,
        koperasiId,
        unitUsahaId: b.unitUsahaId ?? null,
        tanggal: b.tanggal,
        jenis: b.jenis,
        arah,
        jumlah: b.jumlah,
        deskripsi: b.deskripsi,
        vendorNama: b.vendorNama ?? null,
        vendorAlamat: b.vendorAlamat ?? null,
        anggotaId: b.anggotaId ?? null,
      });
      await tx
        .update(koperasi)
        .set({ saldoKas: sql`${koperasi.saldoKas} + ${delta}` })
        .where(eq(koperasi.id, koperasiId));
      const rows = await tx
        .select({ saldo: koperasi.saldoKas })
        .from(koperasi)
        .where(eq(koperasi.id, koperasiId))
        .limit(1);
      return rows[0]?.saldo ?? 0;
    });

    return ok({ transaksiId, saldoKasBaru });
  });
}
