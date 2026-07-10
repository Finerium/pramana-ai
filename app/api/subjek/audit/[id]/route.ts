/**
 * GET /api/subjek/audit/[id]: status polling audit milik koperasi pengurus.
 * Balasan {status, verdict, temuanPerAgen}: verdict warna+ringkasan dihitung
 * server-side (baris audit_run), temuanPerAgen dari tabel temuan per agen
 * dengan satu contoh label bukti (grounding, bukan teks karangan klien).
 * Marker gagal_langsung: verdict + temuan dari run tersimpan terakhir (cache).
 * Anti IDOR: run milik koperasi lain dibalas FORBIDDEN.
 */
import type { NextRequest } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getDb, type Db } from "../../../../../db/client";
import { auditRun, temuan } from "../../../../../db/schema";
import { ApiError, ok, runRoute } from "../../../../../lib/api";
import { koperasiForPengurus, requireRole } from "../../../../../lib/auth";
import { latestRun } from "../../../../../lib/audit/persist";
import type { AgentId } from "../../../../../lib/contracts";

const AGEN_ORDER: AgentId[] = [
  "konflik_kepentingan",
  "anomali_transaksi",
  "kesehatan_finansial",
  "kepatuhan_proses",
];
const SEV_RANK: Record<string, number> = { merah: 0, kuning: 1, info: 2 };

type TemuanPerAgen = {
  agent: AgentId;
  jumlah: number;
  contohBukti: string | null;
};

function labelBuktiPertama(rawJson: string): string | null {
  try {
    const bukti = JSON.parse(rawJson) as Array<{ label?: unknown }>;
    const label = bukti?.[0]?.label;
    return typeof label === "string" && label ? label : null;
  } catch {
    return null;
  }
}

/** Kelompokkan temuan run per agen; contoh bukti dari temuan paling berat. */
async function temuanPerAgen(db: Db, runId: string): Promise<TemuanPerAgen[]> {
  // Bounded: satu run punya segelintir temuan (guard membatasi); limit 50.
  const rows = await db
    .select({
      agent: temuan.agent,
      severity: temuan.severity,
      buktiJson: temuan.buktiJson,
    })
    .from(temuan)
    .where(eq(temuan.auditRunId, runId))
    .orderBy(asc(temuan.id))
    .limit(50);
  return AGEN_ORDER.map((agent) => {
    const milik = rows.filter((r) => r.agent === agent);
    let teratas = milik[0];
    for (const r of milik) {
      if ((SEV_RANK[r.severity] ?? 9) < (SEV_RANK[teratas!.severity] ?? 9))
        teratas = r;
    }
    return {
      agent,
      jumlah: milik.length,
      contohBukti: teratas ? labelBuktiPertama(teratas.buktiJson) : null,
    };
  });
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  return runRoute(async () => {
    const s = await requireRole(req, "pengurus");
    const koperasiId = await koperasiForPengurus(s.userId);
    if (!koperasiId)
      throw new ApiError("FORBIDDEN", "Akun pengurus tidak terkait koperasi.");

    const { id } = await ctx.params;
    const { db } = getDb();
    const rows = await db
      .select()
      .from(auditRun)
      .where(eq(auditRun.id, id))
      .limit(1);
    const row = rows[0];
    if (!row)
      return ok({ status: "berjalan", verdict: null, temuanPerAgen: [] });

    // Anti IDOR: run harus milik koperasi pengurus sesi.
    if (row.koperasiId !== koperasiId)
      throw new ApiError(
        "FORBIDDEN",
        "Anda tidak memiliki akses ke sumber ini.",
      );

    let marker = false;
    try {
      marker =
        (JSON.parse(row.rawJson) as { status?: string })?.status ===
        "gagal_langsung";
    } catch {
      marker = false;
    }
    if (marker) {
      // Jaring cache: verdict + temuan dari run tersimpan terakhir non-marker.
      const last = await latestRun(db, koperasiId);
      return ok({
        status: "gagal_langsung",
        verdict: last
          ? { warna: last.verdictWarna, ringkasan: last.ringkasan }
          : null,
        temuanPerAgen: last
          ? await temuanPerAgen(db, last.id)
          : AGEN_ORDER.map((agent) => ({
              agent,
              jumlah: 0,
              contohBukti: null,
            })),
      });
    }

    return ok({
      status: "selesai",
      verdict: { warna: row.verdictWarna, ringkasan: row.ringkasan },
      temuanPerAgen: await temuanPerAgen(db, row.id),
    });
  });
}
