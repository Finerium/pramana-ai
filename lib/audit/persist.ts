/**
 * Persistensi hasil audit live + orkestrasi live audit + query bersama
 * audit_run. Baris MARKER kegagalan (rawJson.status = "gagal_langsung")
 * menyalin verdictWarna+ringkasan run tersimpan terakhir (keputusan L-07;
 * skema 6.2 tak punya kolom status). Semua query verdict/temuan/tren/overview
 * WAJIB mengecualikan marker via bukanMarker.
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb, type Db } from "../../db/client";
import { auditRun, temuan } from "../../db/schema";
import { hasLlmKey } from "../env";
import { recordLlmSuccess } from "../api";
import { chatJSON } from "../llm";
import { buildSnapshot } from "./buildSnapshot";
import { runAudit, type AuditChat, type RunAuditResult } from "./index";

/** Predikat: baris audit_run BUKAN marker gagal_langsung. */
export const bukanMarker = sql`json_extract(${auditRun.rawJson}, '$.status') is not 'gagal_langsung'`;

export type AuditRunRow = typeof auditRun.$inferSelect;

/** Run tersimpan terbaru non-marker milik koperasi (periode lalu waktu, desc). */
export async function latestRun(
  db: Db,
  koperasiId: string,
): Promise<AuditRunRow | undefined> {
  const rows = await db
    .select()
    .from(auditRun)
    .where(and(eq(auditRun.koperasiId, koperasiId), bukanMarker))
    .orderBy(desc(auditRun.periode), desc(auditRun.dibuatPada))
    .limit(1);
  return rows[0];
}

/** Simpan run live sukses: audit_run source=live + temuan (transaksional). */
export async function persistLiveRun(
  db: Db,
  args: {
    auditRunId: string;
    koperasiId: string;
    periode: string;
    result: RunAuditResult;
  },
): Promise<void> {
  const { auditRunId, koperasiId, periode, result } = args;
  const now = new Date().toISOString();
  await db.transaction(async (tx) => {
    await tx.insert(auditRun).values({
      id: auditRunId,
      koperasiId,
      periode,
      source: "live",
      verdictWarna: result.verdict.warna,
      ringkasan: result.verdict.ringkasan,
      durasiMs: result.durasiMs,
      rawJson: JSON.stringify({
        verdict: result.verdict,
        metadata: result.metadata,
      }),
      dibuatPada: now,
    });
    const rows = result.verdict.temuan.map((t) => ({
      id: t.id,
      auditRunId,
      agent: t.agent,
      severity: t.severity,
      judul: t.judul,
      penjelasanAwam: t.penjelasan_awam,
      kenapaPenting: t.kenapa_penting,
      pertanyaanRat: t.pertanyaan_rat,
      buktiJson: JSON.stringify(t.bukti),
      tanggapanPengurus: null,
    }));
    if (rows.length !== 0) await tx.insert(temuan).values(rows);
  });
}

/**
 * Simpan marker kegagalan live (L-07): verdictWarna+ringkasan disalin dari run
 * tersimpan terakhir non-marker; periode ikut run tersebut. Marker dikecualikan
 * semua query hasil, hanya dipakai polling status.
 */
export async function persistFailureMarker(
  db: Db,
  args: { auditRunId: string; koperasiId: string; periode: string },
): Promise<void> {
  const last = await latestRun(db, args.koperasiId);
  await db.insert(auditRun).values({
    id: args.auditRunId,
    koperasiId: args.koperasiId,
    periode: last?.periode ?? args.periode,
    source: "live",
    verdictWarna: last?.verdictWarna ?? "kuning",
    ringkasan: last?.ringkasan ?? "",
    durasiMs: 0,
    rawJson: JSON.stringify({ status: "gagal_langsung" }),
    dibuatPada: new Date().toISOString(),
  });
}

/**
 * Orkestrasi live audit (F12, 6.4) untuk dijalankan latar (after()). Tanpa key
 * LLM: langsung marker gagal_langsung (nol panggilan provider, AC-DEMO-03).
 * Dengan key: buildSnapshot -> runAudit -> persist sukses; kegagalan apa pun
 * (LLMUnavailable dsb) -> marker. chat/hasKey injectable untuk test.
 */
export async function runLiveAudit(
  auditRunId: string,
  koperasiId: string,
  deps?: { chat?: AuditChat; hasKey?: () => boolean },
): Promise<void> {
  const { db } = getDb();
  const hasKey = deps?.hasKey ?? hasLlmKey;
  if (!hasKey()) {
    await persistFailureMarker(db, { auditRunId, koperasiId, periode: "" });
    return;
  }
  const chat: AuditChat = deps?.chat ?? ((a) => chatJSON(a));
  try {
    const { snapshot, periode } = await buildSnapshot(db, koperasiId);
    const result = await runAudit(snapshot, { chat });
    recordLlmSuccess();
    await persistLiveRun(db, { auditRunId, koperasiId, periode, result });
  } catch {
    await persistFailureMarker(db, {
      auditRunId,
      koperasiId,
      periode: "",
    }).catch(() => {});
  }
}
