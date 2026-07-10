import type { NextRequest } from "next/server";
import { asc, desc, inArray, sql } from "drizzle-orm";
import { getDb } from "../../../../db/client";
import { auditRun, koperasi, temuan } from "../../../../db/schema";
import { ok, runRoute } from "../../../../lib/api";
import { requireRole } from "../../../../lib/auth";
import { bukanMarker, type AuditRunRow } from "../../../../lib/audit/persist";
import { RINGKASAN_LIVE } from "../../../../lib/copy";
import type {
  AgentId,
  GovOverview,
  VerdictColor,
} from "../../../../lib/contracts";
import { buildTren, urutkanAktivitas } from "../../../(gov)/_logic/overview";
import type { TrenRun } from "../../../(gov)/_logic/types";

// M3-D1 (keputusan terkunci): satu model MiniMax-M2.7 dipakai 4 forensik DAN
// adjudikator. Deviasi sengaja dari bundle (GLM-4.7/GLM-5.2). Badge UI = ini.
const MODEL_BADGE = "MiniMax-M2.7";

const RANK: Record<VerdictColor, number> = { merah: 0, kuning: 1, hijau: 2 };
const SEV_RANK: Record<string, number> = { merah: 0, kuning: 1, info: 2 };
const AGEN_ORDER: AgentId[] = [
  "konflik_kepentingan",
  "anomali_transaksi",
  "kesehatan_finansial",
  "kepatuhan_proses",
];

export async function GET(req: NextRequest) {
  return runRoute(async () => {
    await requireRole(req, "pemerintah");
    const { db } = getDb();

    const kopRows = await db.select().from(koperasi);
    const koperasiIds = kopRows.map((k) => k.id);

    // Semua run non-marker (himpunan kecil: 12 koperasi x <=6 bulan). Ambil run
    // terbaru per (koperasi, periode).
    const runs = await db
      .select()
      .from(auditRun)
      .where(bukanMarker)
      .orderBy(
        asc(auditRun.koperasiId),
        asc(auditRun.periode),
        desc(auditRun.dibuatPada),
      );
    const runByKopPeriode = new Map<string, AuditRunRow>();
    const periodeSet = new Set<string>();
    for (const r of runs) {
      periodeSet.add(r.periode);
      const key = `${r.koperasiId}|${r.periode}`;
      if (!runByKopPeriode.has(key)) runByKopPeriode.set(key, r);
    }
    const periodeTersedia = [...periodeSet].sort();

    // Periode aktif: query ?periode=YYYY-MM bila valid dan tersedia, jika tidak
    // periode terbaru.
    const q = new URL(req.url).searchParams.get("periode") ?? "";
    const periode =
      /^\d{4}-\d{2}$/.test(q) && periodeSet.has(q)
        ? q
        : (periodeTersedia[periodeTersedia.length - 1] ?? "");

    // Jumlah temuan per run via agregasi SQL (bukan load-all temuan).
    const runIds = [...runByKopPeriode.values()].map((r) => r.id);
    const countRows = runIds.length
      ? await db
          .select({ auditRunId: temuan.auditRunId, n: sql<number>`count(*)` })
          .from(temuan)
          .where(inArray(temuan.auditRunId, runIds))
          .groupBy(temuan.auditRunId)
      : [];
    const countByRun = new Map(
      countRows.map((c) => [c.auditRunId, Number(c.n)]),
    );

    // Tren nasional 6 bulan (agregasi murni dari titik run per periode).
    const trenRunMap = new Map<string, TrenRun>();
    for (const [key, r] of runByKopPeriode) {
      trenRunMap.set(key, {
        koperasiId: r.koperasiId,
        periode: r.periode,
        verdictWarna: r.verdictWarna,
        temuanCount: countByRun.get(r.id) ?? 0,
      });
    }
    const tren = buildTren(koperasiIds, periodeTersedia, trenRunMap);

    // Periode aktif: baris koperasi + KPI (fallback hijau/0 bila tak ada run).
    let hijau = 0;
    let kuning = 0;
    let merah = 0;
    let temuanTerbuka = 0;
    const activeRunByKop = new Map<string, AuditRunRow>();
    const koperasiOut = kopRows
      .map((k) => {
        const run = runByKopPeriode.get(`${k.id}|${periode}`);
        if (run) activeRunByKop.set(k.id, run);
        const verdictWarna: VerdictColor = run?.verdictWarna ?? "hijau";
        const temuanCount = run ? (countByRun.get(run.id) ?? 0) : 0;
        if (verdictWarna === "merah") merah++;
        else if (verdictWarna === "kuning") kuning++;
        else hijau++;
        temuanTerbuka += temuanCount;
        return {
          id: k.id,
          nama: k.nama,
          provinsi: k.provinsi,
          verdictWarna,
          temuanCount,
        };
      })
      .sort(
        (a, b) =>
          RANK[a.verdictWarna] - RANK[b.verdictWarna] ||
          a.nama.localeCompare(b.nama),
      );

    // Delta KPI vs periode sebelumnya (0 bila periode paling awal).
    const activeIdx = periodeTersedia.indexOf(periode);
    const prev = activeIdx > 0 ? tren[activeIdx - 1] : undefined;
    const kpiDelta = prev
      ? {
          hijau: hijau - prev.hijau,
          kuning: kuning - prev.kuning,
          merah: merah - prev.merah,
          temuanTerbuka: temuanTerbuka - prev.temuan,
        }
      : { hijau: 0, kuning: 0, merah: 0, temuanTerbuka: 0 };

    // Perlu perhatian: koperasi merah/kuning periode aktif; alasan = judul
    // temuan paling berat (fallback kalimat generik). koperasiOut sudah terurut
    // merah dulu lalu nama, jadi urutan panel mengikuti keparahan.
    const perluKop = koperasiOut.filter((k) => k.verdictWarna !== "hijau");
    const perluRunIds = perluKop
      .map((k) => activeRunByKop.get(k.id)?.id)
      .filter((id): id is string => id !== undefined);
    const judulRows = perluRunIds.length
      ? await db
          .select({
            auditRunId: temuan.auditRunId,
            judul: temuan.judul,
            severity: temuan.severity,
          })
          .from(temuan)
          .where(inArray(temuan.auditRunId, perluRunIds))
      : [];
    const topByRun = new Map<string, { judul: string; sev: number }>();
    for (const row of judulRows) {
      const sev = SEV_RANK[row.severity] ?? 9;
      const cur = topByRun.get(row.auditRunId);
      if (!cur || sev < cur.sev || (sev === cur.sev && row.judul < cur.judul)) {
        topByRun.set(row.auditRunId, { judul: row.judul, sev });
      }
    }
    const perluPerhatian = perluKop.map((k) => {
      const runId = activeRunByKop.get(k.id)?.id;
      const top = runId ? topByRun.get(runId) : undefined;
      return {
        id: k.id,
        nama: k.nama,
        verdictWarna: k.verdictWarna,
        alasan: top?.judul ?? RINGKASAN_LIVE.kuning,
      };
    });

    // Feed per agen: jumlah temuan periode aktif per agen (agregasi SQL).
    const activeRunIds = [...activeRunByKop.values()].map((r) => r.id);
    const agentRows = activeRunIds.length
      ? await db
          .select({ agent: temuan.agent, n: sql<number>`count(*)` })
          .from(temuan)
          .where(inArray(temuan.auditRunId, activeRunIds))
          .groupBy(temuan.agent)
      : [];
    const agentCount = new Map(agentRows.map((r) => [r.agent, Number(r.n)]));
    const agenFeed = {
      model: MODEL_BADGE,
      adjudikatorModel: MODEL_BADGE,
      agen: AGEN_ORDER.map((agent) => ({
        agent,
        temuan: agentCount.get(agent) ?? 0,
      })),
    };

    // Feed aktivitas AI Agent: run periode aktif (activeRunByKop, sudah non-marker
    // + terbaru per koperasi) dipetakan ke item feed, urut terbaru + dibatasi 7.
    // Reuse query yang sudah bounded, tanpa load-all tambahan.
    const namaById = new Map(kopRows.map((k) => [k.id, k.nama]));
    const aktivitas = urutkanAktivitas(
      [...activeRunByKop.values()].map((r) => ({
        koperasiId: r.koperasiId,
        nama: namaById.get(r.koperasiId) ?? r.koperasiId,
        verdictWarna: r.verdictWarna,
        temuanCount: countByRun.get(r.id) ?? 0,
        dibuatPada: r.dibuatPada,
      })),
    );

    return ok<GovOverview>({
      kpi: {
        jumlahKoperasi: kopRows.length,
        hijau,
        kuning,
        merah,
        temuanTerbuka,
      },
      koperasi: koperasiOut,
      periode,
      periodeTersedia,
      tren,
      perluPerhatian,
      agenFeed,
      kpiDelta,
      aktivitas,
    });
  });
}
