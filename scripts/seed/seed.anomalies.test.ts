/**
 * AC-SEED-02: anomali AN-1..AN-6 eksis persis di data seed (fixture test baca DB).
 * Plus koherensi KPI 6.7b, agregat sosial 6.7, akun seed, dan idempotensi
 * (AC-SEED-01): dua kali seed = row-count + checksum identik.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import bcrypt from "bcryptjs";
import type { Client, InValue } from "@libsql/client";
import { createDb } from "../../db/client";
import { seed } from "./index";
import {
  RINGKASAN_MERAH,
  SEED_AGREGAT,
  TEMUAN_SEED,
  URUTAN_TAMPIL,
} from "../fixtures/temuan-seed";
import { COPY } from "../../lib/copy";

const BUDI_ALAMAT = "Jl. Melati No. 12, Sukamaju";
let client: Client;
let dir: string;

async function one(
  sql: string,
  args: InValue[] = [],
): Promise<Record<string, unknown>> {
  const r = await client.execute({ sql, args });
  return (r.rows[0] ?? {}) as Record<string, unknown>;
}
async function all(
  sql: string,
  args: InValue[] = [],
): Promise<Record<string, unknown>[]> {
  const r = await client.execute({ sql, args });
  return r.rows as unknown as Record<string, unknown>[];
}
async function scalar(sql: string, args: InValue[] = []): Promise<number> {
  const row = await one(sql, args);
  return Number(Object.values(row)[0]);
}

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), "pramana-seed-"));
  const created = createDb(`file:${join(dir, "seed.db")}`);
  client = created.client;
  await seed(created.db);
});

afterAll(() => {
  client.close();
  rmSync(dir, { recursive: true, force: true });
});

describe("AN-1 konflik kepentingan (merah)", () => {
  it("trx-an1: pembelian Rp15.000.000, 14 Juni, Toko Berkah, alamat = bendahara", async () => {
    const t = await one("SELECT * FROM transaksi WHERE id = 'trx-an1'");
    expect(t.jumlah).toBe(15000000);
    expect(t.tanggal).toBe("2026-06-14");
    expect(t.vendorNama).toBe("Toko Berkah");
    expect(t.jenis).toBe("pembelian");
    expect(t.arah).toBe("keluar");
    expect(t.koperasiId).toBe("kop-sukamaju");
    const budi = await one("SELECT * FROM pengurus WHERE id = 'png-budi'");
    expect(budi.nama).toBe("Budi Santoso");
    expect(budi.jabatan).toBe("bendahara");
    expect(budi.alamat).toBe(BUDI_ALAMAT);
    expect(t.vendorAlamat).toBe(budi.alamat);
  });
});

describe("AN-2 anomali (kuning): 5 pinjaman 20 Juni, total 30jt", () => {
  it("trx-an2-1..5 pencairan + pj-an2-1..5 pinjaman @6jt, 2026-06-20", async () => {
    const trx = await all(
      "SELECT * FROM transaksi WHERE id IN ('trx-an2-1','trx-an2-2','trx-an2-3','trx-an2-4','trx-an2-5')",
    );
    expect(trx).toHaveLength(5);
    expect(trx.every((r) => r.jumlah === 6000000)).toBe(true);
    expect(trx.every((r) => r.tanggal === "2026-06-20")).toBe(true);
    expect(trx.every((r) => r.jenis === "pencairan_pinjaman")).toBe(true);
    const totalTrx = await scalar(
      "SELECT SUM(jumlah) FROM transaksi WHERE id LIKE 'trx-an2-%'",
    );
    expect(totalTrx).toBe(30000000);
    const pj = await all("SELECT * FROM pinjaman WHERE id LIKE 'pj-an2-%'");
    expect(pj).toHaveLength(5);
    expect(pj.every((r) => r.pokok === 6000000)).toBe(true);
    expect(pj.every((r) => r.disetujuiPada === "2026-06-20")).toBe(true);
  });
});

describe("AN-3 anomali (kuning): split purchase 3 x 4,9jt", () => {
  it("trx-an3-1..3 ke CV Sumber Rejeki, masing-masing < 5jt, dalam 5 hari", async () => {
    const rows = await all(
      "SELECT * FROM transaksi WHERE id LIKE 'trx-an3-%' ORDER BY tanggal",
    );
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.jumlah === 4900000)).toBe(true);
    expect(rows.every((r) => (r.jumlah as number) < 5000000)).toBe(true);
    expect(rows.every((r) => r.vendorNama === "CV Sumber Rejeki")).toBe(true);
    const days = rows.map((r) => String(r.tanggal));
    expect(new Set(days).size).toBe(3);
    for (const d of days) {
      expect(d >= "2026-06-09" && d <= "2026-06-13").toBe(true);
    }
  });
});

describe("AN-5 kepatuhan (kuning): pinjaman lampaui plafon, dokumen belum lengkap", () => {
  it("pj-an5: 12jt, dokumenLengkap false", async () => {
    const p = await one("SELECT * FROM pinjaman WHERE id = 'pj-an5'");
    expect(p.pokok).toBe(12000000);
    expect(p.dokumenLengkap).toBe(0);
  });
});

describe("AN-6 kepatuhan (info): RAT belum", () => {
  it("kop-sukamaju ratStatus belum", async () => {
    const k = await one("SELECT * FROM koperasi WHERE id = 'kop-sukamaju'");
    expect(k.ratStatus).toBe("belum");
  });
});

describe("audit_run seed Juni membawa AN-1..AN-6 (severity, urutan, ringkasan)", () => {
  it("run merah dengan 6 temuan berurutan URUTAN_TAMPIL + tanggapan AN-2", async () => {
    const run = await one(
      "SELECT * FROM audit_run WHERE koperasiId = 'kop-sukamaju' AND periode = '2026-06'",
    );
    expect(run.source).toBe("seed");
    expect(run.verdictWarna).toBe("merah");
    expect(run.ringkasan).toBe(RINGKASAN_MERAH);
    const temuan = await all(
      "SELECT * FROM temuan WHERE auditRunId = ? ORDER BY rowid",
      [run.id as string],
    );
    expect(temuan).toHaveLength(6);
    const byAnomali = new Map(
      URUTAN_TAMPIL.map((a, i) => [a, temuan[i]!] as const),
    );
    for (const f of TEMUAN_SEED) {
      const row = byAnomali.get(f.id)!;
      expect(row.severity).toBe(f.severity);
      expect(row.judul).toBe(f.judul);
      expect(row.pertanyaanRat).toBe(f.pertanyaan_rat);
      if (f.tanggapan_pengurus) {
        expect(row.tanggapanPengurus).toBe(f.tanggapan_pengurus);
      }
    }
    const an1 = byAnomali.get("an1")!;
    expect(an1.severity).toBe("merah");
    expect(an1.agent).toBe("konflik_kepentingan");
  });
});

describe("KPI dasbor pemerintah konsisten 6.7b", () => {
  it("12 koperasi, verdict Jun 6 hijau/4 kuning/2 merah, temuanTerbuka 17", async () => {
    expect(await scalar("SELECT COUNT(*) FROM koperasi")).toBe(12);
    const dist = await all(
      "SELECT verdictWarna, COUNT(*) c FROM audit_run WHERE periode = '2026-06' GROUP BY verdictWarna",
    );
    const map = new Map(dist.map((r) => [r.verdictWarna, Number(r.c)]));
    expect(map.get("hijau")).toBe(6);
    expect(map.get("kuning")).toBe(4);
    expect(map.get("merah")).toBe(2);
    const temuanTerbuka = await scalar(
      "SELECT COUNT(*) FROM temuan t JOIN audit_run a ON t.auditRunId = a.id WHERE a.periode = '2026-06'",
    );
    expect(temuanTerbuka).toBe(17);
  });

  it("tren sukamaju 6 run: hijau,hijau,hijau,kuning,kuning,merah", async () => {
    const runs = await all(
      "SELECT periode, verdictWarna FROM audit_run WHERE koperasiId = 'kop-sukamaju' ORDER BY periode",
    );
    expect(runs.map((r) => r.verdictWarna)).toEqual([
      "hijau",
      "hijau",
      "hijau",
      "kuning",
      "kuning",
      "merah",
    ]);
  });
});

describe("agregat sosial 6.7", () => {
  const idOf = async (anomali: (typeof TEMUAN_SEED)[number]["id"]) => {
    const run = await one(
      "SELECT id FROM audit_run WHERE koperasiId = 'kop-sukamaju' AND periode = '2026-06'",
    );
    const f = TEMUAN_SEED.find((x) => x.id === anomali)!;
    const t = await one(
      "SELECT id FROM temuan WHERE auditRunId = ? AND judul = ?",
      [run.id as string, f.judul],
    );
    return t.id as string;
  };

  it("pertanyaan_rat AN-1=12 (tanpa juri), AN-4=7, AN-2=5", async () => {
    const an1 = await idOf("an1");
    const an4 = await idOf("an4");
    const an2 = await idOf("an2");
    expect(
      await scalar("SELECT COUNT(*) FROM pertanyaan_rat WHERE temuanId = ?", [an1]),
    ).toBe(SEED_AGREGAT.an1);
    expect(
      await scalar("SELECT COUNT(*) FROM pertanyaan_rat WHERE temuanId = ?", [an4]),
    ).toBe(SEED_AGREGAT.an4);
    expect(
      await scalar("SELECT COUNT(*) FROM pertanyaan_rat WHERE temuanId = ?", [an2]),
    ).toBe(SEED_AGREGAT.an2);
    const juriOnAn1 = await scalar(
      "SELECT COUNT(*) FROM pertanyaan_rat WHERE temuanId = ? AND anggotaId = 'ang-juri'",
      [an1],
    );
    expect(juriOnAn1).toBe(0);
  });

  it("keputusan freezer terbuka: 9 setuju, 3 tidak, tanpa vote juri", async () => {
    const k = await one("SELECT * FROM keputusan WHERE id = 'kpts-freezer'");
    expect(k.status).toBe("terbuka");
    expect(k.nominal).toBe(8500000);
    expect(
      await scalar(
        "SELECT COUNT(*) FROM vote WHERE keputusanId = 'kpts-freezer' AND pilihan = 'setuju'",
      ),
    ).toBe(9);
    expect(
      await scalar(
        "SELECT COUNT(*) FROM vote WHERE keputusanId = 'kpts-freezer' AND pilihan = 'tidak'",
      ),
    ).toBe(3);
    expect(
      await scalar(
        "SELECT COUNT(*) FROM vote WHERE keputusanId = 'kpts-freezer' AND anggotaId = 'ang-juri'",
      ),
    ).toBe(0);
  });

  it("notifikasi belum dibaca untuk ang-juri dan ang-sari, n=5", async () => {
    const rows = await all(
      "SELECT * FROM notifikasi WHERE anggotaId IN ('ang-juri','ang-sari') AND dibacaPada IS NULL",
    );
    expect(rows).toHaveLength(2);
    const expected = COPY["notif.template"].replace("{n}", "5");
    expect(rows.every((r) => r.teks === expected)).toBe(true);
  });
});

describe("akun seed", () => {
  it("4 akun dengan hash bcrypt terverifikasi + binding benar", async () => {
    const juri = await one(
      "SELECT * FROM users WHERE email = 'juri.anggota@pramana.id'",
    );
    expect(juri.role).toBe("anggota");
    expect(juri.anggotaId).toBe("ang-juri");
    expect(
      bcrypt.compareSync("PramanaJuri2026", juri.passwordHash as string),
    ).toBe(true);
    const bend = await one(
      "SELECT * FROM users WHERE email = 'bendahara@pramana.id'",
    );
    expect(bend.role).toBe("pengurus");
    expect(bend.pengurusId).toBe("png-budi");
    expect(await scalar("SELECT COUNT(*) FROM users")).toBe(4);
  });

  it("ang-juri: simpanan total 600rb, pinjaman sisa 1,2jt cicilan 200rb", async () => {
    const total = await scalar(
      "SELECT SUM(saldo) FROM simpanan WHERE anggotaId = 'ang-juri'",
    );
    expect(total).toBe(600000);
    const p = await one(
      "SELECT * FROM pinjaman WHERE anggotaId = 'ang-juri' AND sisa = 1200000",
    );
    expect(p.cicilanBulanan).toBe(200000);
  });
});

describe("distribusi transaksi 6.7b", () => {
  it("total baris 320-450", async () => {
    const total = await scalar("SELECT COUNT(*) FROM transaksi");
    expect(total).toBeGreaterThanOrEqual(320);
    expect(total).toBeLessThanOrEqual(450);
  });

  it("net arus kas per bulan = delta saldo akhir beku; saldoKas Juni 36,5jt", async () => {
    const perBulan = await all(
      "SELECT substr(tanggal,1,7) periode, " +
        "SUM(CASE WHEN arah='masuk' THEN jumlah ELSE -jumlah END) net " +
        "FROM transaksi WHERE koperasiId='kop-sukamaju' GROUP BY periode ORDER BY periode",
    );
    const net = new Map(perBulan.map((r) => [String(r.periode), Number(r.net)]));
    const saldoAkhir: Record<string, number> = {
      "2026-01": 52000000,
      "2026-02": 54500000,
      "2026-03": 56000000,
      "2026-04": 58000000,
      "2026-05": 47500000,
      "2026-06": 36500000,
    };
    const bulan = Object.keys(saldoAkhir);
    for (let i = 1; i < bulan.length; i++) {
      const delta = saldoAkhir[bulan[i]!]! - saldoAkhir[bulan[i - 1]!]!;
      expect(net.get(bulan[i]!)).toBe(delta);
    }
    const kop = await one("SELECT saldoKas FROM koperasi WHERE id = 'kop-sukamaju'");
    expect(kop.saldoKas).toBe(36500000);
  });
});

describe("idempotensi AC-SEED-01", () => {
  it("seed dua kali = row-count + checksum identik", async () => {
    const tables = [
      "users",
      "koperasi",
      "anggota",
      "pengurus",
      "transaksi",
      "pinjaman",
      "simpanan",
      "audit_run",
      "temuan",
      "pertanyaan_rat",
      "keputusan",
      "vote",
      "notifikasi",
    ];
    const snapshot = async () => {
      const out: Record<string, string> = {};
      for (const t of tables) {
        const rows = await all(`SELECT * FROM ${t} ORDER BY id`);
        out[t] = `${rows.length}:${JSON.stringify(rows)}`;
      }
      return JSON.stringify(out);
    };
    const before = await snapshot();
    const { db } = createDb(`file:${join(dir, "seed.db")}`);
    await seed(db);
    const after = await snapshot();
    expect(after).toBe(before);
  });
});

describe("komposisi bulanan 6.7b", () => {
  it("setoran 30 + gaji 5 per bulan; total baris per bulan dalam rentang", async () => {
    const rentang: Record<string, [number, number]> = {
      "2026-01": [55, 65],
      "2026-02": [55, 65],
      "2026-03": [60, 70],
      "2026-04": [60, 70],
      "2026-05": [55, 65],
      "2026-06": [70, 85],
    };
    for (const [periode, [lo, hi]] of Object.entries(rentang)) {
      const total = await scalar(
        "SELECT COUNT(*) FROM transaksi WHERE substr(tanggal,1,7) = ?",
        [periode],
      );
      expect(total, `${periode} total`).toBeGreaterThanOrEqual(lo);
      expect(total, `${periode} total`).toBeLessThanOrEqual(hi);
      const setoran = await scalar(
        "SELECT COUNT(*) FROM transaksi WHERE substr(tanggal,1,7)=? AND jenis='setoran_simpanan'",
        [periode],
      );
      expect(setoran, `${periode} setoran`).toBe(30);
      const gaji = await scalar(
        "SELECT COUNT(*) FROM transaksi WHERE substr(tanggal,1,7)=? AND jenis='gaji'",
        [periode],
      );
      expect(gaji, `${periode} gaji`).toBe(5);
    }
  });

  it("buku pinjaman: 12 total, 9 aktif, 2 lunas, 1 tunggak > 30 hari", async () => {
    expect(await scalar("SELECT COUNT(*) FROM pinjaman")).toBe(12);
    expect(await scalar("SELECT COUNT(*) FROM pinjaman WHERE sisa = 0")).toBe(2);
    // tunggak: sisa>0 dan jatuh tempo lebih dari 30 hari sebelum 2026-06-30
    const tunggak = await scalar(
      "SELECT COUNT(*) FROM pinjaman WHERE sisa > 0 AND jatuhTempoBerikut < '2026-05-31'",
    );
    expect(tunggak).toBe(1);
    const aktif = await scalar(
      "SELECT COUNT(*) FROM pinjaman WHERE sisa > 0 AND jatuhTempoBerikut >= '2026-05-31'",
    );
    expect(aktif).toBe(9);
  });

  it("4 unit usaha sukamaju + 5 pengurus + 30 anggota", async () => {
    expect(
      await scalar("SELECT COUNT(*) FROM unit_usaha WHERE koperasiId='kop-sukamaju'"),
    ).toBe(4);
    expect(
      await scalar("SELECT COUNT(*) FROM pengurus WHERE koperasiId='kop-sukamaju'"),
    ).toBe(5);
    expect(
      await scalar("SELECT COUNT(*) FROM anggota WHERE koperasiId='kop-sukamaju'"),
    ).toBe(30);
    const kadesPengawas = await one(
      "SELECT * FROM pengurus WHERE jabatan='pengawas' AND koperasiId='kop-sukamaju'",
    );
    expect(String(kadesPengawas.nama)).toContain("Kepala Desa");
  });
});
