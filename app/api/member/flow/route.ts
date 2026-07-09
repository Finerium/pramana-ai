import type { NextRequest } from "next/server";
import { and, eq, like, sql } from "drizzle-orm";
import { getDb } from "../../../../db/client";
import { temuan, transaksi } from "../../../../db/schema";
import { ok, runRoute } from "../../../../lib/api";
import { requireRole } from "../../../../lib/auth";
import { latestRun } from "../../../../lib/audit/persist";
import {
  JENIS_KE_KATEGORI,
  KATEGORI_KELUAR,
  KATEGORI_MASUK,
  type FlowResp,
} from "../../../../lib/contracts";

const KOPERASI_ID = "kop-sukamaju";

type Bukti = { jenis: string; id: string; label: string };

export async function GET(req: NextRequest) {
  return runRoute(async () => {
    await requireRole(req, "anggota");
    const { db } = getDb();

    let periode = new URL(req.url).searchParams.get("periode") ?? "";
    if (!/^\d{4}-\d{2}$/.test(periode)) {
      const mx = await db
        .select({ p: sql<string>`max(substr(${transaksi.tanggal}, 1, 7))` })
        .from(transaksi)
        .where(eq(transaksi.koperasiId, KOPERASI_ID));
      periode = mx[0]?.p ?? "2026-06";
    }

    // Agregasi SQL per jenis+arah (bukan load-all).
    const rows = await db
      .select({
        jenis: transaksi.jenis,
        arah: transaksi.arah,
        total: sql<number>`sum(${transaksi.jumlah})`,
      })
      .from(transaksi)
      .where(
        and(
          eq(transaksi.koperasiId, KOPERASI_ID),
          like(transaksi.tanggal, `${periode}%`),
        ),
      )
      .groupBy(transaksi.jenis, transaksi.arah);

    const masukMap = new Map<string, number>();
    const keluarMap = new Map<string, number>();
    let totalMasuk = 0;
    let totalKeluar = 0;
    for (const r of rows) {
      const kategori = JENIS_KE_KATEGORI[r.jenis] ?? "Lainnya";
      const total = Number(r.total);
      if (r.arah === "masuk") {
        masukMap.set(kategori, (masukMap.get(kategori) ?? 0) + total);
        totalMasuk += total;
      } else {
        keluarMap.set(kategori, (keluarMap.get(kategori) ?? 0) + total);
        totalKeluar += total;
      }
    }
    const masuk = KATEGORI_MASUK.map((k) => ({
      kategori: k,
      jumlah: masukMap.get(k) ?? 0,
    }));
    const keluar = KATEGORI_KELUAR.map((k) => ({
      kategori: k,
      jumlah: keluarMap.get(k) ?? 0,
    }));

    // Sorotan: bukti temuan run terbaru berjenis transaksi (dedup per transaksi).
    // ponytail: satu sorotan per transaksi; upgrade simpan banyak alasan bila UI
    // butuh lebih dari satu label per transaksi.
    const sorotan: FlowResp["sorotan"] = [];
    const run = await latestRun(db, KOPERASI_ID);
    if (run) {
      const trows = await db
        .select({ id: temuan.id, buktiJson: temuan.buktiJson })
        .from(temuan)
        .where(eq(temuan.auditRunId, run.id));
      const seen = new Set<string>();
      for (const t of trows) {
        const bukti = JSON.parse(t.buktiJson) as Bukti[];
        for (const b of bukti) {
          if (b.jenis !== "transaksi" || seen.has(b.id)) continue;
          seen.add(b.id);
          sorotan.push({ transaksiId: b.id, temuanId: t.id, label: b.label });
        }
      }
    }

    return ok<FlowResp>({
      periode,
      totalMasuk,
      totalKeluar,
      masuk,
      keluar,
      sorotan,
    });
  });
}
