/**
 * AC-DB-01: desain fisik DB nyata.
 * - Foreign key aktif: insert anak tanpa induk GAGAL.
 * - Indeks menutupi pola query panas: EXPLAIN QUERY PLAN untuk daftar transaksi
 *   paginated dan agregasi flow memakai indeks komposit (koperasiId, tanggal).
 * - Introspeksi: indeks + unique enforcer (vote, pertanyaan_rat) benar-benar ada.
 * Migrasi bersih dari nol dijalankan lewat runMigrations.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Client } from "@libsql/client";
import { createDb } from "./client";
import { runMigrations } from "./migrate";

let client: Client;
let dir: string;

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), "pramana-db-"));
  const created = createDb(`file:${join(dir, "test.db")}`);
  client = created.client;
  await runMigrations(created.db);
});

afterAll(() => {
  client.close();
  rmSync(dir, { recursive: true, force: true });
});

describe("foreign keys aktif", () => {
  it("menolak insert anak tanpa induk (anggota -> koperasi hantu)", async () => {
    await expect(
      client.execute({
        sql: "INSERT INTO anggota (id, koperasiId, nama, nik, noAnggota, alamat, bergabungPada) VALUES (?,?,?,?,?,?,?)",
        args: [
          "x1",
          "koperasi-hantu",
          "Uji",
          "1234567890123456",
          "A-999",
          "Alamat",
          "2026-01-01",
        ],
      }),
    ).rejects.toThrow();
  });

  it("PRAGMA foreign_keys menyala pada koneksi", async () => {
    const r = await client.execute("PRAGMA foreign_keys");
    expect(r.rows[0]?.foreign_keys).toBe(1);
  });
});

async function planDetail(sql: string): Promise<string> {
  const r = await client.execute("EXPLAIN QUERY PLAN " + sql);
  return r.rows.map((row) => String(row.detail)).join(" | ");
}

describe("indeks hot-path dipakai (EXPLAIN QUERY PLAN)", () => {
  it("daftar transaksi paginated per koperasi memakai indeks komposit", async () => {
    const detail = await planDetail(
      "SELECT * FROM transaksi WHERE koperasiId = 'kop-sukamaju' ORDER BY tanggal DESC LIMIT 50",
    );
    expect(detail).toMatch(/USING (COVERING )?INDEX/);
    expect(detail).toContain("idx_transaksi_koperasi_tanggal");
  });

  it("agregasi flow per periode memakai indeks komposit", async () => {
    const detail = await planDetail(
      "SELECT jenis, arah, SUM(jumlah) AS total FROM transaksi " +
        "WHERE koperasiId = 'kop-sukamaju' AND tanggal >= '2026-06-01' AND tanggal <= '2026-06-30' " +
        "GROUP BY jenis, arah",
    );
    expect(detail).toContain("idx_transaksi_koperasi_tanggal");
  });

  it("temuan per audit_run memakai indeks", async () => {
    const detail = await planDetail(
      "SELECT * FROM temuan WHERE auditRunId = 'ar-1'",
    );
    expect(detail).toContain("idx_temuan_auditrun");
  });

  it("audit_run per koperasi+periode memakai indeks", async () => {
    const detail = await planDetail(
      "SELECT * FROM audit_run WHERE koperasiId = 'kop-sukamaju' AND periode = '2026-06'",
    );
    expect(detail).toContain("idx_audit_run_koperasi_periode");
  });
});

describe("introspeksi schema", () => {
  it("indeks unik penegak idempotensi hadir (vote, pertanyaan_rat)", async () => {
    const r = await client.execute(
      "SELECT name FROM sqlite_master WHERE type = 'index'",
    );
    const names = r.rows.map((row) => String(row.name));
    expect(names).toContain("uq_vote_keputusan_anggota");
    expect(names).toContain("uq_pertanyaan_temuan_anggota");
  });

  it("UNIQUE(keputusanId, anggotaId) menolak vote ganda", async () => {
    await client.execute(
      "INSERT INTO koperasi (id, nama, desa, kabupaten, provinsi, isDetailSeeded, saldoKas, ratStatus, dibentukPada) VALUES ('k-uq','K','D','Kab','Prov',0,0,'belum','2025-01-01')",
    );
    await client.execute(
      "INSERT INTO anggota (id, koperasiId, nama, nik, noAnggota, alamat, bergabungPada) VALUES ('a-uq','k-uq','A','1234567890123456','A-1','Al','2025-01-01')",
    );
    await client.execute(
      "INSERT INTO keputusan (id, koperasiId, judul, deskripsi, nominal, status, dibukaPada) VALUES ('kp-uq','k-uq','J','D',null,'terbuka','2026-06-01')",
    );
    await client.execute(
      "INSERT INTO vote (id, keputusanId, anggotaId, pilihan) VALUES ('v1','kp-uq','a-uq','setuju')",
    );
    await expect(
      client.execute(
        "INSERT INTO vote (id, keputusanId, anggotaId, pilihan) VALUES ('v2','kp-uq','a-uq','tidak')",
      ),
    ).rejects.toThrow();
  });
});
