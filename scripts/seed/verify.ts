/**
 * Verifikasi seed (AC-SEED-01, AC-DEMO-02): row-count + checksum sha256 per tabel
 * (deterministik => dua kali seed = checksum identik) plus timing seed ke
 * seed-verify.json. Membaca seed-timing.json (ditulis index.ts main) bila ada.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { createDb, resolveDbUrl } from "../../db/client";

const TABLES = [
  "users",
  "koperasi",
  "unit_usaha",
  "pengurus",
  "anggota",
  "simpanan",
  "pinjaman",
  "transaksi",
  "audit_run",
  "temuan",
  "pertanyaan_rat",
  "keputusan",
  "vote",
  "notifikasi",
];

export type VerifyResult = {
  generatedAt: string;
  seedMs: number | null;
  verifyMs: number;
  withinBudget: boolean;
  totalRows: number;
  tables: Record<string, { count: number; checksum: string }>;
};

export async function verifySeed(): Promise<VerifyResult> {
  const { url, authToken } = resolveDbUrl();
  const { client } = createDb(url, authToken);
  const t0 = Date.now();
  const tables: VerifyResult["tables"] = {};
  let totalRows = 0;
  for (const t of TABLES) {
    const r = await client.execute(`SELECT * FROM ${t} ORDER BY id`);
    const payload = JSON.stringify(r.rows);
    tables[t] = {
      count: r.rows.length,
      checksum: createHash("sha256").update(payload).digest("hex"),
    };
    totalRows += r.rows.length;
  }
  client.close();
  const verifyMs = Date.now() - t0;
  let seedMs: number | null = null;
  if (existsSync("seed-timing.json")) {
    try {
      seedMs = Number(
        JSON.parse(readFileSync("seed-timing.json", "utf8")).seedMs,
      );
    } catch {
      seedMs = null;
    }
  }
  return {
    generatedAt: new Date().toISOString(),
    seedMs,
    verifyMs,
    withinBudget: seedMs === null ? true : seedMs <= 60_000,
    totalRows,
    tables,
  };
}

async function main(): Promise<void> {
  const result = await verifySeed();
  writeFileSync("seed-verify.json", JSON.stringify(result, null, 2));
  process.stdout.write(
    `Verify: ${result.totalRows} baris, seedMs=${result.seedMs ?? "n/a"}, budget<=60s: ${result.withinBudget}\n`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((err) => {
    process.stderr.write(`Verify gagal: ${String(err)}\n`);
    process.exit(1);
  });
}
