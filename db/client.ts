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
  // Di-queue pertama pada koneksi persisten sehingga query berikutnya melihat FK ON.
  void client.execute("PRAGMA foreign_keys = ON");
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
