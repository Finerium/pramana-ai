import { describe, expect, it } from "vitest";
import { TEMUAN_SEED } from "../../scripts/fixtures/temuan-seed";
import { runAudit, type AuditChat } from "./index";
import type { KoperasiSnapshot } from "./snapshot";

const an1 = TEMUAN_SEED.find((t) => t.id === "an1")!;

const an1Finding = {
  agent: an1.agent,
  severity: an1.severity,
  judul: an1.judul,
  penjelasan_awam: an1.penjelasan_awam,
  kenapa_penting: an1.kenapa_penting,
  bukti: an1.bukti,
  pertanyaan_rat: an1.pertanyaan_rat,
};

const snapshot: KoperasiSnapshot = {
  koperasi: {
    nama: "Koperasi Desa Merah Putih Sukamaju",
    saldoKasPerBulan: [
      { periode: "2026-04", saldo: 58_000_000 },
      { periode: "2026-05", saldo: 47_500_000 },
      { periode: "2026-06", saldo: 36_500_000 },
    ],
  },
  pengurus: [
    {
      nama: "Budi Santoso",
      jabatan: "bendahara",
      alamat: "Jl. Melati No. 12, Sukamaju",
    },
  ],
  transaksi: [],
  pinjaman: [],
  plafonPerAnggota: 10_000_000,
  statusRat: "belum",
};

// Mock deterministik bergaya fixture: agen konflik mengembalikan AN-1, agen
// lain kosong, adjudikator meneruskan temuan tervalidasi dengan warna merah.
const chat = (async ({ system, user }: { system: string; user: string }) => {
  if (system.includes("Adjudikator")) {
    const masuk = JSON.parse(user) as { temuan: unknown[] };
    return {
      warna: "merah",
      ringkasan:
        "Kas koperasi menurun dan ada satu pembelian besar yang perlu dijelaskan pengurus.",
      temuan: masuk.temuan,
    };
  }
  if (system.includes("Konflik Kepentingan")) {
    return { temuan: [an1Finding] };
  }
  return { temuan: [] };
}) as unknown as AuditChat;

describe("runAudit fixture deterministik (AC-LLM-02)", () => {
  it("hasil akhir memuat AN-1: konflik_kepentingan, merah, Toko Berkah, kecocokan alamat", async () => {
    const { verdict, durasiMs } = await runAudit(snapshot, {
      chat,
      generateId: (() => {
        let n = 0;
        return () => `temuan-${n++}`;
      })(),
      now: () => 0,
    });

    expect(verdict.warna).toBe("merah");

    const temuan = verdict.temuan.find(
      (t) => t.agent === "konflik_kepentingan",
    );
    expect(temuan).toBeDefined();
    expect(temuan!.severity).toBe("merah");
    expect(temuan!.id).toBeTruthy();

    const teks =
      temuan!.penjelasan_awam +
      " " +
      temuan!.bukti.map((b) => b.label).join(" ");
    expect(teks).toContain("Toko Berkah");
    // kecocokan alamat bendahara
    expect(teks.toLowerCase()).toContain("alamat");
    expect(teks).toContain("Melati");

    expect(durasiMs).toBeGreaterThanOrEqual(0);
  });
});
