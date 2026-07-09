import { describe, expect, it } from "vitest";
import type { Severity } from "@/lib/contracts";
import { RINGKASAN_LIVE } from "../copy";
import { LLMUnavailable } from "../llm";
import { runAudit, type AuditChat, type RunAuditDeps } from "./index";
import type { KoperasiSnapshot } from "./snapshot";

const snapshot: KoperasiSnapshot = {
  koperasi: {
    nama: "Koperasi Uji",
    saldoKasPerBulan: [{ periode: "2026-06", saldo: 1 }],
  },
  pengurus: [],
  transaksi: [],
  pinjaman: [],
  plafonPerAnggota: 10_000_000,
  statusRat: "belum",
};

function deps(
  fn: (a: { system: string; user: string }) => unknown,
): RunAuditDeps {
  const chat = (async (a: { system: string; user: string }) =>
    fn(a)) as unknown as AuditChat;
  let n = 0;
  return { chat, generateId: () => `t${n++}`, now: () => 0 };
}

const bersih = (severity: Severity, judul: string) => ({
  agent: "konflik_kepentingan",
  severity,
  judul,
  penjelasan_awam: "Ada hal yang perlu Anda tanyakan kepada pengurus.",
  kenapa_penting: "Anggota berhak memastikan pengelolaan berjalan wajar.",
  bukti: [{ jenis: "transaksi", id: "trx-x", label: "rujukan data" }],
  pertanyaan_rat: "Bisakah pengurus menjelaskan hal ini?",
});

// Echo adjudikator: teruskan temuan yang diterima, warna diusulkan sesuai arg.
function echoAdjudikator(user: string, warna: string, ringkasan: string) {
  const masuk = JSON.parse(user) as { temuan: unknown[] };
  return { warna, ringkasan, temuan: masuk.temuan };
}

describe("runAudit kegagalan agen + guard retry (6.4/6.5)", () => {
  it("mencatat agen gagal di metadata dan tetap melanjutkan", async () => {
    const kuning = bersih("kuning", "Temuan kuning");
    const d = deps(({ system, user }) => {
      if (system.includes("Adjudikator"))
        return echoAdjudikator(
          user,
          "kuning",
          "Ada hal yang perlu ditanyakan.",
        );
      if (system.includes("Konflik Kepentingan"))
        throw new Error("agen konflik jatuh");
      if (system.includes("Anomali Transaksi")) return { temuan: [kuning] };
      return { temuan: [] };
    });
    const { verdict, metadata } = await runAudit(snapshot, d);
    expect(metadata.agenGagal).toContain("konflik_kepentingan");
    expect(verdict.warna).toBe("kuning");
  });

  it("melempar LLMUnavailable bila seluruh agen forensik gagal", async () => {
    const d = deps(({ system, user }) => {
      if (system.includes("Adjudikator"))
        return echoAdjudikator(user, "hijau", "x");
      throw new Error("semua agen jatuh");
    });
    await expect(runAudit(snapshot, d)).rejects.toBeInstanceOf(LLMUnavailable);
  });

  it("pass 1: retry korektif memperbaiki temuan yang melanggar (tanpa drop)", async () => {
    const kotor = {
      ...bersih("merah", "Perlu diperbaiki"),
      kenapa_penting: "Ini korupsi.",
    };
    const bersihMerah = bersih("merah", "Perlu diperbaiki");
    const d = deps(({ system, user }) => {
      if (system.includes("Adjudikator"))
        return echoAdjudikator(
          user,
          "merah",
          "Ada pembelian besar yang perlu dijelaskan.",
        );
      if (system.includes("Konflik Kepentingan"))
        return user.includes("Koreksi wajib")
          ? { temuan: [bersihMerah] }
          : { temuan: [kotor] };
      return { temuan: [] };
    });
    const { verdict, metadata } = await runAudit(snapshot, d);
    expect(verdict.warna).toBe("merah");
    expect(metadata.temuanDrop).toHaveLength(0);
  });

  it("pass 1: temuan tetap melanggar setelah retry didrop dan dicatat", async () => {
    const kotor = {
      ...bersih("merah", "Tetap melanggar"),
      kenapa_penting: "Ini korupsi.",
    };
    const d = deps(({ system, user }) => {
      if (system.includes("Adjudikator"))
        return echoAdjudikator(
          user,
          "hijau",
          "Tidak ada hal yang perlu dikhawatirkan.",
        );
      if (system.includes("Konflik Kepentingan")) return { temuan: [kotor] };
      return { temuan: [] };
    });
    const { verdict, metadata } = await runAudit(snapshot, d);
    expect(metadata.temuanDrop.some((x) => x.tahap === "forensik")).toBe(true);
    expect(verdict.warna).toBe("hijau");
  });

  it("ringkasan melanggar setelah retry diganti copy fallback", async () => {
    const kuning = bersih("kuning", "Temuan kuning");
    const d = deps(({ system, user }) => {
      if (system.includes("Adjudikator")) {
        const masuk = JSON.parse(user) as { temuan: unknown[] };
        // ringkasan selalu melanggar (kata vonis) di kedua panggilan
        return {
          warna: "kuning",
          ringkasan: "Pengurus melakukan penipuan.",
          temuan: masuk.temuan,
        };
      }
      if (system.includes("Konflik Kepentingan")) return { temuan: [kuning] };
      return { temuan: [] };
    });
    const { verdict, metadata } = await runAudit(snapshot, d);
    expect(metadata.ringkasanDiganti).toBe(true);
    expect(verdict.ringkasan).toBe(RINGKASAN_LIVE.kuning);
    expect(verdict.warna).toBe("kuning");
  });

  it("pass 1: retry transport gagal -> temuan melanggar didrop", async () => {
    const kotor = {
      ...bersih("merah", "Perlu diperbaiki"),
      kenapa_penting: "Ini korupsi.",
    };
    const d = deps(({ system, user }) => {
      if (system.includes("Adjudikator"))
        return echoAdjudikator(
          user,
          "hijau",
          "Tidak ada hal yang perlu dikhawatirkan.",
        );
      if (system.includes("Konflik Kepentingan")) {
        if (user.includes("Koreksi wajib")) throw new Error("retry jatuh");
        return { temuan: [kotor] };
      }
      return { temuan: [] };
    });
    const { verdict, metadata } = await runAudit(snapshot, d);
    expect(metadata.temuanDrop.some((x) => x.tahap === "forensik")).toBe(true);
    expect(verdict.warna).toBe("hijau");
  });

  it("pass 2: retry adjudikator transport gagal -> temuan melanggar didrop", async () => {
    const merahVonis = {
      ...bersih("merah", "Temuan bermasalah"),
      kenapa_penting: "Ini korupsi.",
    };
    const d = deps(({ system, user }) => {
      if (system.includes("Adjudikator")) {
        if (user.includes("Koreksi wajib")) throw new Error("retry adj jatuh");
        return {
          warna: "merah",
          ringkasan: "Ada hal yang perlu dijelaskan pengurus.",
          temuan: [merahVonis],
        };
      }
      return { temuan: [] };
    });
    const { verdict, metadata } = await runAudit(snapshot, d);
    expect(metadata.temuanDrop.some((x) => x.tahap === "adjudikator")).toBe(
      true,
    );
    expect(verdict.warna).toBe("hijau");
  });
});
