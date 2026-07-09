import type { NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { ulid } from "ulid";
import { getDb } from "../../../../db/client";
import { koperasi, transaksi } from "../../../../db/schema";
import { ApiError, ok, runRoute } from "../../../../lib/api";
import { koperasiForPengurus, requireRole } from "../../../../lib/auth";

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
    if (b.jenis === "pembelian" && (!b.vendorNama || !b.vendorAlamat)) {
      throw new ApiError(
        "VALIDATION",
        "Pembelian wajib menyertakan nama dan alamat penjual.",
      );
    }
    const arah: "masuk" | "keluar" = MASUK.has(b.jenis) ? "masuk" : "keluar";
    const transaksiId = ulid();
    const delta = arah === "masuk" ? b.jumlah : -b.jumlah;
    const { db } = getDb();

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
