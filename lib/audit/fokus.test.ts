/**
 * Snapshot FOKUS (audit interaktif cepat) + loop notifikasi ke anggota.
 * seed() = migrasi + wipe-and-reseed, jadi beforeAll membersihkan tulisan run
 * sebelumnya (termasuk audit_run/notifikasi uji) sehingga re-run bebas konflik.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq, isNull } from "drizzle-orm";
import { createDb, type Created } from "../../db/client";
import { seed } from "../../scripts/seed/index";
import { anggota, notifikasi } from "../../db/schema";
import { COPY } from "../copy";
import { buildSnapshot } from "./buildSnapshot";
import { persistLiveRun } from "./persist";
import type { RunAuditResult } from "./index";

const KOP = "kop-sukamaju";

let created: Created;
beforeAll(async () => {
  created = createDb("file:./.vitest-audit-fokus.db");
  await seed(created.db);
});
afterAll(() => created.client.close());

function mkResult(
  warna: "merah" | "kuning" | "hijau",
  n: number,
): RunAuditResult {
  const severity: "info" | "kuning" | "merah" =
    warna === "hijau" ? "info" : warna;
  return {
    verdict: {
      warna,
      ringkasan: "Ringkasan uji.",
      temuan: Array.from({ length: n }, (_, i) => ({
        id: `t-${warna}-${i}`,
        agent: "konflik_kepentingan" as const,
        severity,
        judul: "Temuan uji",
        penjelasan_awam: "Penjelasan.",
        kenapa_penting: "Alasan.",
        pertanyaan_rat: "Apakah ini benar?",
        bukti: [{ jenis: "transaksi" as const, id: "trx-an1", label: "x" }],
      })),
    },
    metadata: {
      agenGagal: [],
      warnaAdjudikator: null,
      temuanDrop: [],
      ringkasanDiganti: false,
    },
    durasiMs: 0,
  };
}

async function anggotaCount(): Promise<number> {
  const rows = await created.db
    .select({ id: anggota.id })
    .from(anggota)
    .where(eq(anggota.koperasiId, KOP));
  return rows.length;
}
async function unreadCount(): Promise<number> {
  const rows = await created.db
    .select()
    .from(notifikasi)
    .where(isNull(notifikasi.dibacaPada));
  return rows.length;
}

describe("buildSnapshot fokus (audit interaktif cepat, WAJIB trx-an1)", () => {
  it("jendela fokus lebih kecil dari penuh tapi selalu memuat trx-an1", async () => {
    const penuh = await buildSnapshot(created.db, KOP);
    const fokus = await buildSnapshot(created.db, KOP, { fokus: true });
    expect(fokus.snapshot.transaksi.length).toBeGreaterThan(0);
    expect(fokus.snapshot.transaksi.length).toBeLessThan(
      penuh.snapshot.transaksi.length,
    );
    // AN-1 tetap terdeteksi: trx-an1 (14 Juni) tak boleh hilang oleh windowing.
    expect(fokus.snapshot.transaksi.some((t) => t.id === "trx-an1")).toBe(true);
  });

  it("pertahankan PENUH: pinjaman, pengurus, saldoKasPerBulan, statusRat", async () => {
    const penuh = await buildSnapshot(created.db, KOP);
    const fokus = await buildSnapshot(created.db, KOP, { fokus: true });
    expect(fokus.snapshot.pinjaman).toEqual(penuh.snapshot.pinjaman);
    expect(fokus.snapshot.pengurus).toEqual(penuh.snapshot.pengurus);
    expect(fokus.snapshot.koperasi.saldoKasPerBulan).toEqual(
      penuh.snapshot.koperasi.saldoKasPerBulan,
    );
    expect(fokus.snapshot.statusRat).toBe(penuh.snapshot.statusRat);
  });
});

describe("persistLiveRun loop notifikasi ke anggota", () => {
  it("verdict merah -> notif ke SEMUA anggota, teks memuat {n} temuan nyata", async () => {
    const jumlahAnggota = await anggotaCount();
    const n = 3;
    const teks = COPY["notif.template"].replace("{n}", String(n));
    await persistLiveRun(created.db, {
      auditRunId: "uji-merah",
      koperasiId: KOP,
      periode: "2026-06",
      result: mkResult("merah", n),
    });
    const rows = await created.db
      .select()
      .from(notifikasi)
      .where(eq(notifikasi.teks, teks));
    expect(rows.length).toBe(jumlahAnggota);
    expect(rows.every((r) => r.dibacaPada === null)).toBe(true);
  });

  it("verdict kuning -> tetap kirim notif ke semua anggota", async () => {
    const jumlahAnggota = await anggotaCount();
    const before = await unreadCount();
    await persistLiveRun(created.db, {
      auditRunId: "uji-kuning",
      koperasiId: KOP,
      periode: "2026-06",
      result: mkResult("kuning", 2),
    });
    expect((await unreadCount()) - before).toBe(jumlahAnggota);
  });

  it("verdict hijau -> TANPA notif", async () => {
    const before = await unreadCount();
    await persistLiveRun(created.db, {
      auditRunId: "uji-hijau",
      koperasiId: KOP,
      periode: "2026-06",
      result: mkResult("hijau", 0),
    });
    expect(await unreadCount()).toBe(before);
  });
});
