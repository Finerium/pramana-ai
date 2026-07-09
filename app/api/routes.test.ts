import { NextRequest } from "next/server";
import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { ulid } from "ulid";
import { createDb, resolveDbUrl, type Db } from "../../db/client";
import { seed } from "../../scripts/seed/index";
import {
  SESSION_COOKIE,
  sealSession,
  koperasiForAnggota,
  type SessionData,
} from "../../lib/auth";
import { resetRateLimit } from "../../lib/rateLimit";
import {
  latestRun,
  persistLiveRun,
  runLiveAudit,
} from "../../lib/audit/persist";
import type { RunAuditResult } from "../../lib/audit/index";

import { POST as login } from "./auth/login/route";
import { POST as logout } from "./auth/logout/route";
import { POST as onboarding } from "./onboarding/route";
import { GET as memberSummary } from "./member/summary/route";
import { GET as memberVerdict } from "./member/verdict/route";
import { GET as memberFindings } from "./member/findings/route";
import { POST as findingsRat } from "./findings/[id]/rat/route";
import { GET as memberFlow } from "./member/flow/route";
import { GET as memberVoice } from "./member/voice/route";
import { POST as vote } from "./vote/route";
import { POST as subjekTransaksi } from "./subjek/transaksi/route";
import { POST as subjekPinjaman } from "./subjek/pinjaman/route";
import { POST as subjekRat } from "./subjek/rat/route";
import { GET as subjekRecent } from "./subjek/recent/route";
import { GET as govOverview } from "./gov/overview/route";
import { GET as govKoperasi } from "./gov/koperasi/[id]/route";
import { POST as govAuditRun } from "./gov/audit/run/route";
import { GET as auditStatus } from "./audit/[id]/status/route";

type Role = SessionData["role"];
const SESS: Record<Role, SessionData> = {
  anggota: {
    userId: "usr-juri-anggota",
    role: "anggota",
    anggotaId: "ang-juri",
  },
  pemerintah: { userId: "usr-juri-pemerintah", role: "pemerintah" },
  pengurus: { userId: "usr-bendahara", role: "pengurus" },
};
const ROLES: Role[] = ["anggota", "pemerintah", "pengurus"];

let testDb: Db;
async function reseed(): Promise<void> {
  const { url, authToken } = resolveDbUrl();
  const { db } = createDb(url, authToken);
  await seed(db);
  testDb = db;
}

async function mkReq(
  session: SessionData | null,
  opts: { method?: string; body?: unknown; url?: string; ip?: string } = {},
): Promise<NextRequest> {
  const {
    method = "GET",
    body,
    url = "http://localhost/api/x",
    ip = "10.0.0.1",
  } = opts;
  const headers = new Headers();
  if (session)
    headers.set("cookie", `${SESSION_COOKIE}=${await sealSession(session)}`);
  headers.set("x-forwarded-for", ip);
  const init: { method: string; headers: Headers; body?: string } = {
    method,
    headers,
  };
  if (body !== undefined) {
    headers.set("content-type", "application/json");
    init.body = JSON.stringify(body);
  }
  return new NextRequest(url, init);
}

const P = (id: string) => ({ params: Promise.resolve({ id }) });

type EnvJson = {
  ok: boolean;
  data?: Record<string, unknown>;
  error?: { code: string; message: string };
};
const asEnv = async (res: Response): Promise<EnvJson> =>
  (await res.json()) as EnvJson;

async function voteCall(pilihan: string) {
  const res = await vote(
    await mkReq(SESS.anggota, {
      method: "POST",
      body: { keputusanId: "kpts-freezer", pilihan },
    }),
  );
  return {
    status: res.status,
    hasil: ((await res.json()) as EnvJson).data as {
      hasil: { setuju: number; tidak: number };
    },
  };
}

// --- Matrix role guard (AC-SEC-01/02, AC-SUBJ-03) ---------------------------
type Caller = (s: SessionData | null) => Promise<Response>;
const GUARDED: { name: string; role: Role; call: Caller }[] = [
  {
    name: "member/summary",
    role: "anggota",
    call: async (s) => memberSummary(await mkReq(s)),
  },
  {
    name: "member/verdict",
    role: "anggota",
    call: async (s) => memberVerdict(await mkReq(s)),
  },
  {
    name: "member/findings",
    role: "anggota",
    call: async (s) => memberFindings(await mkReq(s)),
  },
  {
    name: "findings/[id]/rat",
    role: "anggota",
    call: async (s) =>
      findingsRat(await mkReq(s, { method: "POST" }), P("tmn-an1")),
  },
  {
    name: "member/flow",
    role: "anggota",
    call: async (s) => memberFlow(await mkReq(s)),
  },
  {
    name: "member/voice",
    role: "anggota",
    call: async (s) => memberVoice(await mkReq(s)),
  },
  {
    name: "vote",
    role: "anggota",
    call: async (s) => vote(await mkReq(s, { method: "POST" })),
  },
  {
    name: "subjek/transaksi",
    role: "pengurus",
    call: async (s) => subjekTransaksi(await mkReq(s, { method: "POST" })),
  },
  {
    name: "subjek/pinjaman",
    role: "pengurus",
    call: async (s) => subjekPinjaman(await mkReq(s, { method: "POST" })),
  },
  {
    name: "subjek/rat",
    role: "pengurus",
    call: async (s) => subjekRat(await mkReq(s, { method: "POST" })),
  },
  {
    name: "subjek/recent",
    role: "pengurus",
    call: async (s) => subjekRecent(await mkReq(s)),
  },
  {
    name: "gov/overview",
    role: "pemerintah",
    call: async (s) => govOverview(await mkReq(s)),
  },
  {
    name: "gov/koperasi/[id]",
    role: "pemerintah",
    call: async (s) => govKoperasi(await mkReq(s), P("kop-sukamaju")),
  },
  {
    name: "gov/audit/run",
    role: "pemerintah",
    call: async (s) => govAuditRun(await mkReq(s, { method: "POST" })),
  },
  {
    name: "audit/[id]/status",
    role: "pemerintah",
    call: async (s) => auditStatus(await mkReq(s), P("x")),
  },
];

describe("role guard matrix (AC-SEC-01/02, AC-SUBJ-03)", () => {
  beforeAll(async () => {
    vi.stubEnv("TURSO_DATABASE_URL", "file:./.vitest-routes.db");
    await reseed();
  });

  for (const r of GUARDED) {
    it(`${r.name}: tanpa sesi -> 401 UNAUTHORIZED`, async () => {
      const res = await r.call(null);
      expect(res.status).toBe(401);
      expect((await asEnv(res)).error?.code).toBe("UNAUTHORIZED");
    });
    for (const role of ROLES) {
      if (role === r.role) {
        it(`${r.name}: role ${role} -> bukan 401/403`, async () => {
          const res = await r.call(SESS[role]);
          expect(res.status).not.toBe(401);
          expect(res.status).not.toBe(403);
        });
      } else {
        it(`${r.name}: role ${role} -> 403 FORBIDDEN`, async () => {
          const res = await r.call(SESS[role]);
          expect(res.status).toBe(403);
          expect((await asEnv(res)).error?.code).toBe("FORBIDDEN");
        });
      }
    }
  }
});

// --- Perilaku (reseed bersih tiap test) -------------------------------------
describe("perilaku endpoint", () => {
  beforeAll(() => {
    vi.stubEnv("TURSO_DATABASE_URL", "file:./.vitest-routes.db");
  });
  beforeEach(async () => {
    resetRateLimit();
    await reseed();
  });

  it("login benar -> 200 {role, redirectTo} + set-cookie", async () => {
    const res = await login(
      await mkReq(null, {
        method: "POST",
        body: { email: "juri.anggota@pramana.id", password: "PramanaJuri2026" },
      }),
    );
    expect(res.status).toBe(200);
    expect((await asEnv(res)).data).toMatchObject({
      role: "anggota",
      redirectTo: "/beranda",
    });
    expect(res.headers.get("set-cookie") ?? "").toContain(SESSION_COOKIE);
  });

  it("login salah -> 401 tanpa membocorkan detail", async () => {
    const res = await login(
      await mkReq(null, {
        method: "POST",
        body: { email: "juri.anggota@pramana.id", password: "salah" },
      }),
    );
    expect(res.status).toBe(401);
    expect((await asEnv(res)).error?.code).toBe("UNAUTHORIZED");
  });

  it("rate limit: percobaan ke-6 -> 429 (AC-SEC-07)", async () => {
    const bad = { email: "juri.anggota@pramana.id", password: "salah" };
    let last = 0;
    for (let i = 0; i < 6; i++) {
      const res = await login(
        await mkReq(null, { method: "POST", body: bad, ip: "77.77.77.77" }),
      );
      last = res.status;
    }
    expect(last).toBe(429);
  });

  it("onboarding NIK 15 digit -> VALIDATION onboard.nik.err", async () => {
    const res = await onboarding(
      await mkReq(null, {
        method: "POST",
        body: {
          nama: "Uji Baru",
          nik: "3".repeat(15),
          alamat: "Jl. Uji",
          email: "baru15@contoh.id",
          password: "rahasia123",
        },
      }),
    );
    expect(res.status).toBe(400);
    const j = await asEnv(res);
    expect(j.error?.code).toBe("VALIDATION");
    expect(j.error?.message).toContain("16 angka");
  });

  it("onboarding NIK 16 digit -> kartu + sesi anggota", async () => {
    const res = await onboarding(
      await mkReq(null, {
        method: "POST",
        body: {
          nama: "Uji Baru",
          nik: "3".repeat(16),
          alamat: "Jl. Uji",
          email: "baru16@contoh.id",
          password: "rahasia123",
        },
      }),
    );
    expect(res.status).toBe(200);
    const kartu = (await asEnv(res)).data?.kartu as {
      noAnggota: string;
      koperasi: string;
    };
    expect(kartu.noAnggota).toMatch(/^SKM-/);
    expect(kartu.koperasi).toContain("Sukamaju");
    expect(res.headers.get("set-cookie") ?? "").toContain(SESSION_COOKIE);
  });

  it("vote idempoten: setuju -> 10/3, ulang tetap 10/3 (B2)", async () => {
    const first = await voteCall("setuju");
    expect(first.status).toBe(200);
    expect(first.hasil.hasil).toEqual({ setuju: 10, tidak: 3 });
    const again = await voteCall("setuju");
    expect(again.hasil.hasil).toEqual({ setuju: 10, tidak: 3 });
    const flip = await voteCall("tidak");
    expect(flip.hasil.hasil).toEqual({ setuju: 10, tidak: 3 });
  });

  it("rat idempoten: agregat 12 -> 13, ulang tetap 13 (B1)", async () => {
    const first = await findingsRat(
      await mkReq(SESS.anggota, { method: "POST" }),
      P("tmn-an1"),
    );
    expect(first.status).toBe(200);
    expect((await asEnv(first)).data?.agregat).toBe(13);
    const again = await findingsRat(
      await mkReq(SESS.anggota, { method: "POST" }),
      P("tmn-an1"),
    );
    expect((await asEnv(again)).data?.agregat).toBe(13);
  });

  it("flow Juni: kategori kanonik + total dari DB nyata", async () => {
    const res = await memberFlow(
      await mkReq(SESS.anggota, {
        url: "http://localhost/api/member/flow?periode=2026-06",
      }),
    );
    const d = (await asEnv(res)).data as {
      totalMasuk: number;
      totalKeluar: number;
      masuk: { kategori: string; jumlah: number }[];
      keluar: { kategori: string; jumlah: number }[];
      sorotan: unknown[];
    };
    expect(d.totalMasuk).toBe(57_100_000);
    expect(d.totalKeluar).toBe(68_100_000);
    expect(d.masuk.find((m) => m.kategori === "Penjualan gerai")?.jumlah).toBe(
      51_600_000,
    );
    expect(d.keluar.find((k) => k.kategori === "Pembelian stok")?.jumlah).toBe(
      32_700_000,
    );
    expect(d.sorotan.length).toBe(2);
  });

  it("subjek transaksi mengubah saldoKas sesuai arah", async () => {
    const jual = await subjekTransaksi(
      await mkReq(SESS.pengurus, {
        method: "POST",
        body: {
          jenis: "penjualan",
          jumlah: 1_000_000,
          tanggal: "2026-07-01",
          deskripsi: "Penjualan uji",
        },
      }),
    );
    expect((await asEnv(jual)).data?.saldoKasBaru).toBe(37_500_000);

    const beli = await subjekTransaksi(
      await mkReq(SESS.pengurus, {
        method: "POST",
        body: {
          jenis: "pembelian",
          jumlah: 2_000_000,
          tanggal: "2026-07-01",
          deskripsi: "Pembelian uji",
          vendorNama: "UD Uji",
          vendorAlamat: "Pasar Uji",
        },
      }),
    );
    expect((await asEnv(beli)).data?.saldoKasBaru).toBe(35_500_000);
  });

  it("subjek transaksi pembelian tanpa vendor -> VALIDATION", async () => {
    const res = await subjekTransaksi(
      await mkReq(SESS.pengurus, {
        method: "POST",
        body: {
          jenis: "pembelian",
          jumlah: 1_000_000,
          tanggal: "2026-07-01",
          deskripsi: "Tanpa vendor",
        },
      }),
    );
    expect(res.status).toBe(400);
    expect((await asEnv(res)).error?.code).toBe("VALIDATION");
  });

  it("member/verdict: merah + jumlahTemuan seed", async () => {
    const res = await memberVerdict(await mkReq(SESS.anggota));
    const d = (await asEnv(res)).data as {
      warna: string;
      source: string;
      jumlahTemuan: { merah: number; kuning: number; info: number };
    };
    expect(d.warna).toBe("merah");
    expect(d.source).toBe("seed");
    expect(d.jumlahTemuan).toEqual({ merah: 1, kuning: 4, info: 1 });
  });

  it("member/findings: enam temuan, an1 pertama, belum ditambahkan", async () => {
    const res = await memberFindings(await mkReq(SESS.anggota));
    const d = (await asEnv(res)).data as {
      temuan: { id: string; severity: string }[];
      sudahDitambahkan: string[];
    };
    expect(d.temuan.length).toBe(6);
    expect(d.temuan[0]?.severity).toBe("merah");
    expect(d.sudahDitambahkan).toEqual([]);
  });

  it("member/voice: agregat terurut + keputusan belum memilih", async () => {
    const res = await memberVoice(await mkReq(SESS.anggota));
    const d = (await asEnv(res)).data as {
      pertanyaanAgregat: { jumlahAnggota: number }[];
      keputusan: { sudahMemilih: boolean; hasil: unknown }[];
    };
    expect(d.pertanyaanAgregat.map((p) => p.jumlahAnggota)).toEqual([12, 7, 5]);
    expect(d.keputusan[0]?.sudahMemilih).toBe(false);
    expect(d.keputusan[0]?.hasil).toBeNull();
  });

  it("member/summary: uang anggota juri", async () => {
    const res = await memberSummary(await mkReq(SESS.anggota));
    const d = (await asEnv(res)).data as {
      uangAnda: {
        totalSimpanan: number;
        sisaPinjaman: number;
        cicilanBerikut: { jumlah: number; tanggal: string } | null;
      };
      notifikasiBelumDibaca: number;
    };
    expect(d.uangAnda.totalSimpanan).toBe(600_000);
    expect(d.uangAnda.sisaPinjaman).toBe(1_200_000);
    expect(d.uangAnda.cicilanBerikut).toEqual({
      jumlah: 200_000,
      tanggal: "2026-07-05",
    });
    expect(d.notifikasiBelumDibaca).toBe(1);
  });

  it("koperasiForAnggota: ang-juri -> kop-sukamaju, tak dikenal -> null", async () => {
    expect(await koperasiForAnggota("ang-juri")).toBe("kop-sukamaju");
    expect(await koperasiForAnggota("tidak-ada")).toBeNull();
  });

  it("gov/overview: KPI seed (12 koperasi, 17 temuan)", async () => {
    const res = await govOverview(await mkReq(SESS.pemerintah));
    const d = (await asEnv(res)).data as {
      kpi: {
        jumlahKoperasi: number;
        hijau: number;
        kuning: number;
        merah: number;
        temuanTerbuka: number;
      };
      koperasi: unknown[];
    };
    expect(d.kpi.jumlahKoperasi).toBe(12);
    expect(d.kpi.merah).toBe(2);
    expect(d.kpi.kuning).toBe(4);
    expect(d.kpi.hijau).toBe(6);
    expect(d.kpi.temuanTerbuka).toBe(17);
    expect(d.koperasi.length).toBe(12);
  });

  it("gov/koperasi/[id]: tren 6 periode + temuan", async () => {
    const res = await govKoperasi(
      await mkReq(SESS.pemerintah),
      P("kop-sukamaju"),
    );
    const d = (await asEnv(res)).data as {
      auditRun: { verdictWarna: string } | null;
      temuan: unknown[];
      tren: { periode: string; warna: string }[];
    };
    expect(d.auditRun?.verdictWarna).toBe("merah");
    expect(d.temuan.length).toBe(6);
    expect(
      typeof (d.temuan[0] as { penjelasan_awam?: unknown }).penjelasan_awam,
    ).toBe("string");
    expect(
      (d.temuan[0] as { penjelasanAwam?: unknown }).penjelasanAwam,
    ).toBeUndefined();
    expect(d.tren.map((t) => t.warna)).toEqual([
      "hijau",
      "hijau",
      "hijau",
      "kuning",
      "kuning",
      "merah",
    ]);
  });

  it("live audit tanpa key -> marker gagal_langsung + status baca cache", async () => {
    await runLiveAudit("live-marker-1", "kop-sukamaju", {
      hasKey: () => false,
    });
    const res = await auditStatus(
      await mkReq(SESS.pemerintah),
      P("live-marker-1"),
    );
    const d = (await asEnv(res)).data as {
      status: string;
      auditRun: { source: string; verdictWarna: string } | null;
    };
    expect(d.status).toBe("gagal_langsung");
    expect(d.auditRun?.source).toBe("cache");
    expect(d.auditRun?.verdictWarna).toBe("merah");
    const last = await latestRun(testDb, "kop-sukamaju");
    expect(last?.source).toBe("seed");
  });

  it("persistLiveRun -> status selesai membaca run live", async () => {
    const result: RunAuditResult = {
      verdict: {
        warna: "kuning",
        ringkasan: "Ada beberapa hal untuk ditanyakan.",
        temuan: [
          {
            id: ulid(),
            agent: "anomali_transaksi",
            severity: "kuning",
            judul: "Uji temuan live",
            penjelasan_awam: "Penjelasan uji.",
            kenapa_penting: "Alasan uji.",
            bukti: [{ jenis: "transaksi", id: "trx-x", label: "Bukti uji" }],
            pertanyaan_rat: "Apakah ini perlu dijelaskan?",
          },
        ],
      },
      metadata: {
        agenGagal: [],
        warnaAdjudikator: null,
        temuanDrop: [],
        ringkasanDiganti: false,
      },
      durasiMs: 10,
    };
    await persistLiveRun(testDb, {
      auditRunId: "live-ok-1",
      koperasiId: "kop-sukamaju",
      periode: "2026-06",
      result,
    });
    const res = await auditStatus(await mkReq(SESS.pemerintah), P("live-ok-1"));
    const d = (await asEnv(res)).data as {
      status: string;
      auditRun: { source: string; verdictWarna: string } | null;
    };
    expect(d.status).toBe("selesai");
    expect(d.auditRun?.source).toBe("live");
    expect(d.auditRun?.verdictWarna).toBe("kuning");
  });

  it("audit/status id tak dikenal -> berjalan", async () => {
    const res = await auditStatus(await mkReq(SESS.pemerintah), P("tidak-ada"));
    expect((await asEnv(res)).data?.status).toBe("berjalan");
  });

  it("logout -> loggedOut true + hapus cookie", async () => {
    const res = await logout();
    expect((await asEnv(res)).data).toEqual({ loggedOut: true });
    expect(res.headers.get("set-cookie") ?? "").toContain(SESSION_COOKIE);
  });

  it("subjek pinjaman + rat + recent", async () => {
    const pinj = await subjekPinjaman(
      await mkReq(SESS.pengurus, {
        method: "POST",
        body: {
          anggotaId: "ang-g01",
          pokok: 3_000_000,
          cicilanBulanan: 300_000,
          jatuhTempoBerikut: "2026-08-10",
          disetujuiOleh: "png-budi",
          dokumenLengkap: true,
        },
      }),
    );
    expect(pinj.status).toBe(200);
    expect(typeof (await asEnv(pinj)).data?.pinjamanId).toBe("string");

    const rat = await subjekRat(
      await mkReq(SESS.pengurus, {
        method: "POST",
        body: { status: "terlaksana", tanggal: "2026-07-09" },
      }),
    );
    expect((await asEnv(rat)).data?.ratStatus).toBe("terlaksana");

    const recent = await subjekRecent(await mkReq(SESS.pengurus));
    const d = (await asEnv(recent)).data as {
      transaksi: unknown[];
      pinjaman: unknown[];
      anggota: unknown[];
    };
    expect(d.transaksi.length).toBeLessThanOrEqual(10);
    expect(d.pinjaman.length).toBeLessThanOrEqual(5);
    expect(d.anggota.length).toBe(30);
  });
});
