/**
 * Migrasi bersih dari nol: terapkan SQL hasil `drizzle-kit generate` (db/migrations).
 * Dipanggil saat seed dan di test. Folder di-resolve relatif file ini agar
 * bebas dari cwd.
 */
import { migrate } from "drizzle-orm/libsql/migrator";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const defaultFolder = join(dirname(fileURLToPath(import.meta.url)), "migrations");

export async function runMigrations<TSchema extends Record<string, unknown>>(
  db: LibSQLDatabase<TSchema>,
  migrationsFolder: string = defaultFolder,
): Promise<void> {
  await migrate(db, { migrationsFolder });
}
