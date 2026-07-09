import { NextResponse } from "next/server";
import { getDb } from "../../../db/client";
import { demoMode, hasLlmKey } from "../../../lib/env";
import { llmProbeOk } from "../../../lib/api";
import pkg from "../../../package.json";

export const dynamic = "force-dynamic";

/**
 * Health flat {ok, db, llm, demoMode, version} (L-04, 6.3). TIDAK memanggil
 * provider (catatan 6.18): llm "unset" tanpa key, "up" bila ada memo probe
 * sukses (diset jalur live audit), selain itu "down".
 */
export async function GET() {
  let db: "up" | "down" = "down";
  try {
    await getDb().client.execute("select 1");
    db = "up";
  } catch {
    db = "down";
  }
  const llm: "up" | "down" | "unset" = !hasLlmKey()
    ? "unset"
    : llmProbeOk()
      ? "up"
      : "down";
  return NextResponse.json({
    ok: true,
    db,
    llm,
    demoMode: demoMode(),
    version: pkg.version,
  });
}
