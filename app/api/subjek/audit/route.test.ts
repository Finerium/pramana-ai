/**
 * Endpoint audit subjek: trigger 202 (POST) + polling status (GET) dengan
 * IDOR guard, grouping temuan per agen (grounding label bukti nyata), dan
 * jaring marker gagal_langsung yang membaca run tersimpan terakhir (cache).
 */
import { NextRequest } from "next/server";
import { describe, it, expect, beforeAll, vi } from "vitest";
import { createDb, resolveDbUrl } from "../../../../db/client";
import { seed } from "../../../../scripts/seed/index";
import {
  SESSION_COOKIE,
  sealSession,
  type SessionData,
} from "../../../../lib/auth";
import { runLiveAudit } from "../../../../lib/audit/persist";
import { POST as auditPost } from "./route";
import { GET as auditGet } from "./[id]/route";

const SESS: Record<string, SessionData> = {
  anggota: {
    userId: "usr-juri-anggota",
    role: "anggota",
    anggotaId: "ang-juri",
  },
  pemerintah: { userId: "usr-juri-pemerintah", role: "pemerintah" },
  pengurus: { userId: "usr-bendahara", role: "pengurus" },
};

async function mkReq(
  session: SessionData | null,
  method = "GET",
): Promise<NextRequest> {
  const headers = new Headers();
  if (session)
    headers.set("cookie", `${SESSION_COOKIE}=${await sealSession(session)}`);
  return new NextRequest("http://localhost/api/subjek/audit", {
    method,
    headers,
  });
}

const P = (id: string) => ({ params: Promise.resolve({ id }) });

type EnvJson = {
  ok: boolean;
  data?: Record<string, unknown>;
  error?: { code: string; message: string };
};
const asEnv = async (res: Response): Promise<EnvJson> =>
  (await res.json()) as EnvJson;

type AgenRow = { agent: string; jumlah: number; contohBukti: string | null };

describe("subjek/audit trigger + status", () => {
  beforeAll(async () => {
    vi.stubEnv("TURSO_DATABASE_URL", "file:./.vitest-subjek-audit.db");
    const { url, authToken } = resolveDbUrl();
    const { db } = createDb(url, authToken);
    await seed(db);
  });

  it("POST tanpa sesi -> 401; anggota/pemerintah -> 403", async () => {
    expect((await auditPost(await mkReq(null, "POST"))).status).toBe(401);
    expect((await auditPost(await mkReq(SESS.anggota!, "POST"))).status).toBe(
      403,
    );
    expect(
      (await auditPost(await mkReq(SESS.pemerintah!, "POST"))).status,
    ).toBe(403);
  });

  it("GET tanpa sesi -> 401; anggota -> 403", async () => {
    expect((await auditGet(await mkReq(null), P("x"))).status).toBe(401);
    expect((await auditGet(await mkReq(SESS.anggota!), P("x"))).status).toBe(
      403,
    );
  });

  it("POST pengurus -> 202 {auditRunId, status berjalan}", async () => {
    const res = await auditPost(await mkReq(SESS.pengurus!, "POST"));
    expect(res.status).toBe(202);
    const d = (await asEnv(res)).data!;
    expect(typeof d.auditRunId).toBe("string");
    expect(d.status).toBe("berjalan");
  });

  it("GET id tak dikenal -> berjalan tanpa verdict", async () => {
    const res = await auditGet(await mkReq(SESS.pengurus!), P("tidak-ada"));
    const d = (await asEnv(res)).data!;
    expect(d.status).toBe("berjalan");
    expect(d.verdict).toBeNull();
    expect(d.temuanPerAgen).toEqual([]);
  });

  it("GET run seed sukamaju -> selesai + temuan per agen + label bukti", async () => {
    const res = await auditGet(
      await mkReq(SESS.pengurus!),
      P("ar-sukamaju-2026-06"),
    );
    expect(res.status).toBe(200);
    const d = (await asEnv(res)).data!;
    expect(d.status).toBe("selesai");
    expect((d.verdict as { warna: string }).warna).toBe("merah");
    const agen = d.temuanPerAgen as AgenRow[];
    expect(agen.map((a) => [a.agent, a.jumlah])).toEqual([
      ["konflik_kepentingan", 1],
      ["anomali_transaksi", 2],
      ["kesehatan_finansial", 1],
      ["kepatuhan_proses", 2],
    ]);
    expect(agen[0]!.contohBukti).toBe(
      "Pembelian Rp 15.000.000 ke Toko Berkah, 14 Juni 2026",
    );
    for (const a of agen) expect(a.contohBukti).toBeTruthy();
  });

  it("GET run koperasi lain -> 403 (anti IDOR)", async () => {
    const res = await auditGet(
      await mkReq(SESS.pengurus!),
      P("ar-kop-lembahsari-2026-06"),
    );
    expect(res.status).toBe(403);
    expect((await asEnv(res)).error?.code).toBe("FORBIDDEN");
  });

  it("marker gagal_langsung -> verdict + temuan dari run tersimpan (cache)", async () => {
    await runLiveAudit("subjek-marker-1", "kop-sukamaju", {
      hasKey: () => false,
    });
    const res = await auditGet(
      await mkReq(SESS.pengurus!),
      P("subjek-marker-1"),
    );
    const d = (await asEnv(res)).data!;
    expect(d.status).toBe("gagal_langsung");
    expect((d.verdict as { warna: string }).warna).toBe("merah");
    const agen = d.temuanPerAgen as AgenRow[];
    expect(agen.find((a) => a.agent === "konflik_kepentingan")?.jumlah).toBe(1);
  });
});
