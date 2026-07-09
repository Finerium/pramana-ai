import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import pkg from "@/package.json";

export const dynamic = "force-dynamic";

async function dbStatus(): Promise<"up" | "down"> {
  try {
    const url = process.env.TURSO_DATABASE_URL || "file:./dev.db";
    const client = createClient(
      url.startsWith("file:")
        ? { url }
        : { url, authToken: process.env.TURSO_AUTH_TOKEN },
    );
    await client.execute("select 1");
    client.close();
    return "up";
  } catch {
    return "down";
  }
}

export async function GET() {
  const db = await dbStatus();
  // "unset" tanpa key; "up" setelah probe ringan sukses (diisi lib/llm pada
  // fase build); "down" selainnya, sesuai catatan 6.18.
  const llm: "up" | "down" | "unset" = process.env.LLM_API_KEY
    ? "down"
    : "unset";
  return NextResponse.json({
    ok: true,
    db,
    llm,
    demoMode: (process.env.DEMO_MODE ?? "true") === "true",
    version: pkg.version,
  });
}
