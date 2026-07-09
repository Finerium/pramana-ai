import { describe, expect, it } from "vitest";
import type { Severity } from "@/lib/contracts";
import { hitungWarna } from "./verdict";
import { runAudit, type AuditChat, type RunAuditDeps } from "./index";
import type { KoperasiSnapshot } from "./snapshot";

const f = (severity: Severity) => ({ severity });

describe("hitungWarna (aturan warna 6.1)", () => {
  it("merah bila ada >= 1 temuan merah", () => {
    expect(hitungWarna([f("info"), f("kuning"), f("merah")])).toBe("merah");
  });

  it("kuning bila ada kuning tanpa merah", () => {
    expect(hitungWarna([f("info"), f("kuning")])).toBe("kuning");
  });

  it("hijau bila hanya info", () => {
    expect(hitungWarna([f("info")])).toBe("hijau");
  });

  it("hijau bila tidak ada temuan", () => {
    expect(hitungWarna([])).toBe("hijau");
  });

  it("info tidak mengubah warna kuning", () => {
    expect(hitungWarna([f("kuning"), f("info")])).toBe("kuning");
  });

  it("merah menang atas kuning dan info", () => {
    expect(hitungWarna([f("merah"), f("kuning"), f("info")])).toBe("merah");
  });
});

// --- Pipeline adversarial: warna dihitung ulang server-side (AC-LLM-03) ---

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

describe("runAudit menegakkan warna server-side (AC-LLM-03, B6)", () => {
  it("server menetapkan merah meski adjudikator mengusulkan hijau", async () => {
    const merah = bersih("merah", "Temuan merah");
    const d = deps(({ system }) => {
      if (system.includes("Adjudikator"))
        return {
          warna: "hijau",
          ringkasan: "Menurut adjudikator semuanya tampak baik.",
          temuan: [merah],
        };
      if (system.includes("Konflik Kepentingan")) return { temuan: [merah] };
      return { temuan: [] };
    });
    const { verdict, metadata } = await runAudit(snapshot, d);
    expect(verdict.warna).toBe("merah");
    expect(metadata.warnaAdjudikator).toBe("hijau");
  });

  it("kuning bila hanya temuan kuning", async () => {
    const kuning = bersih("kuning", "Temuan kuning");
    const d = deps(({ system }) => {
      if (system.includes("Adjudikator"))
        return {
          warna: "kuning",
          ringkasan: "Ada hal yang sebaiknya Anda tanyakan bulan ini.",
          temuan: [kuning],
        };
      if (system.includes("Konflik Kepentingan")) return { temuan: [kuning] };
      return { temuan: [] };
    });
    const { verdict } = await runAudit(snapshot, d);
    expect(verdict.warna).toBe("kuning");
  });

  it("hijau bila hanya temuan info", async () => {
    const info = bersih("info", "Catatan info");
    const d = deps(({ system }) => {
      if (system.includes("Adjudikator"))
        return {
          warna: "hijau",
          ringkasan: "Tidak ada hal yang perlu dikhawatirkan bulan ini.",
          temuan: [info],
        };
      if (system.includes("Konflik Kepentingan")) return { temuan: [info] };
      return { temuan: [] };
    });
    const { verdict } = await runAudit(snapshot, d);
    expect(verdict.warna).toBe("hijau");
  });

  it("warna dihitung ulang dari himpunan final setelah drop pass-2", async () => {
    const kuning = bersih("kuning", "Temuan kuning yang bersih");
    const merahVonis = {
      ...bersih("merah", "Temuan bermasalah"),
      kenapa_penting: "Ini korupsi.",
    };
    const d = deps(({ system }) => {
      if (system.includes("Adjudikator"))
        return {
          warna: "merah",
          ringkasan: "Ada dua hal yang perlu dijelaskan pengurus.",
          temuan: [merahVonis, kuning],
        };
      if (system.includes("Konflik Kepentingan")) return { temuan: [kuning] };
      return { temuan: [] };
    });
    const { verdict, metadata } = await runAudit(snapshot, d);
    // temuan merah melanggar register (kata vonis) -> didrop -> final kuning
    expect(verdict.warna).toBe("kuning");
    expect(verdict.temuan.some((t) => t.judul === "Temuan bermasalah")).toBe(
      false,
    );
    expect(metadata.temuanDrop.some((x) => x.tahap === "adjudikator")).toBe(
      true,
    );
    expect(metadata.warnaAdjudikator).toBe("merah");
  });
});
