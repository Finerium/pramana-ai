/**
 * Koneksi libSQL. Produksi: TURSO_DATABASE_URL + TURSO_AUTH_TOKEN bila terisi;
 * selain itu file:dev.db (dev/test). FK aktif via PRAGMA foreign_keys (Turso
 * default ON; file SQLite butuh pragma). Singleton lazy agar impor modul tidak
 * membuka koneksi (ramah serverless cold start dan test yang hanya perlu factory).
 */
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { schema } from "./schema";

export type Db = LibSQLDatabase<typeof schema>;
export type Created = { db: Db; client: Client };

export function resolveDbUrl(): { url: string; authToken?: string } {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (url && url.length > 0) {
    return authToken ? { url, authToken } : { url };
  }
  return { url: "file:dev.db" };
}

export function createDb(url: string, authToken?: string): Created {
  const client = createClient(authToken ? { url, authToken } : { url });
  // PRAGMA hanya untuk file SQLite lokal. Turso remote (libsql/hrana) menolak
  // busy_timeout (SQL_PARSE_ERROR) dan mengelola FK/konkurensi di sisi server;
  // .catch menjaga rejection tidak menjadi unhandled.
  if (url.startsWith("file:")) {
    // FK aktif (SQLite off by default); busy_timeout menahan lock lintas-proses
    // (server dev + vitest + tooling) alih-alih langsung SQLITE_BUSY.
    void client.execute("PRAGMA foreign_keys = ON").catch(() => {});
    void client.execute("PRAGMA busy_timeout = 5000").catch(() => {});
  }
  const db = drizzle(client, { schema });
  return { db, client };
}

let singleton: Created | null = null;

/** Koneksi bersama untuk route handlers (lazy, memoized). */
export function getDb(): Created {
  if (!singleton) {
    const { url, authToken } = resolveDbUrl();
    singleton = createDb(url, authToken);
  }
  return singleton;
}
