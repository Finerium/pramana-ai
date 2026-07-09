/**
 * Seed deterministik + idempoten (6.7/6.7b, AC-SEED-01/02). Strategi: migrasi
 * bersih dari nol, lalu wipe-and-reseed dalam satu transaksi (hapus anak->induk,
 * sisip induk->anak) sehingga dua kali jalan = isi identik. FK tetap ON.
 */
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import { createDb, resolveDbUrl, type Db } from "../../db/client";
import { runMigrations } from "../../db/migrate";
import {
  anggota,
  auditRun,
  keputusan,
  koperasi,
  notifikasi,
  pengurus,
  pertanyaanRat,
  pinjaman,
  simpanan,
  temuan,
  transaksi,
  unitUsaha,
  users,
  vote,
} from "../../db/schema";
import { buildSeedData } from "./data";

// Urutan hapus: anak sebelum induk (FK aktif).
const DELETE_ORDER: SQLiteTable[] = [
  notifikasi,
  vote,
  keputusan,
  pertanyaanRat,
  temuan,
  auditRun,
  transaksi,
  pinjaman,
  simpanan,
  users,
  anggota,
  pengurus,
  unitUsaha,
  koperasi,
];

const CHUNK = 100;

async function insertAll(
  tx: {
    insert: Db["insert"];
  },
  table: SQLiteTable,
  rows: Record<string, unknown>[],
): Promise<void> {
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    if (slice.length > 0) await tx.insert(table).values(slice);
  }
}

export async function seed(db: Db): Promise<void> {
  await runMigrations(db);
  const data = buildSeedData();
  await db.transaction(async (tx) => {
    for (const table of DELETE_ORDER) await tx.delete(table);
    // sisip induk -> anak
    await insertAll(tx, koperasi, data.koperasi);
    await insertAll(tx, unitUsaha, data.unitUsaha);
    await insertAll(tx, pengurus, data.pengurus);
    await insertAll(tx, anggota, data.anggota);
    await insertAll(tx, users, data.users);
    await insertAll(tx, simpanan, data.simpanan);
    await insertAll(tx, pinjaman, data.pinjaman);
    await insertAll(tx, transaksi, data.transaksi);
    await insertAll(tx, auditRun, data.auditRun);
    await insertAll(tx, temuan, data.temuan);
    await insertAll(tx, pertanyaanRat, data.pertanyaanRat);
    await insertAll(tx, keputusan, data.keputusan);
    await insertAll(tx, vote, data.vote);
    await insertAll(tx, notifikasi, data.notifikasi);
  });
}

async function main(): Promise<void> {
  const { url, authToken } = resolveDbUrl();
  const { db, client } = createDb(url, authToken);
  const t0 = Date.now();
  await seed(db);
  const seedMs = Date.now() - t0;
  writeFileSync("seed-timing.json", JSON.stringify({ seedMs }, null, 2));
  const data = buildSeedData();
  client.close();
  process.stdout.write(
    `Seed selesai dalam ${seedMs} ms (${data.transaksi.length} transaksi, ${data.anggota.length} anggota, ${data.auditRun.length} audit_run).\n`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((err) => {
    process.stderr.write(`Seed gagal: ${String(err)}\n`);
    process.exit(1);
  });
}
