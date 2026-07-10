import { describe, expect, it } from "vitest";
import type { EvidenceRef } from "@/lib/contracts";
import { buildGroundingIndex, periksaGrounding } from "./grounding";
import type { KoperasiSnapshot } from "./snapshot";

const snapshot: KoperasiSnapshot = {
  koperasi: { nama: "K", saldoKasPerBulan: [] },
  pengurus: [],
  transaksi: [
    {
      id: "trx-1",
      tanggal: "2026-06-01",
      jenis: "pembelian",
      arah: "keluar",
      jumlah: 1,
      deskripsi: "x",
    },
  ],
  pinjaman: [
    {
      id: "pnj-1",
      anggotaId: "a1",
      pokok: 1,
      sisa: 1,
      cicilanBulanan: 1,
      jatuhTempoBerikut: "2026-07",
      disetujuiPada: "2026-06",
      disetujuiOleh: "p1",
      dokumenLengkap: true,
    },
  ],
  plafonPerAnggota: 1,
  statusRat: "belum",
};

const idx = buildGroundingIndex(snapshot);

const temuan = (bukti: Array<{ jenis: EvidenceRef["jenis"]; id: string }>) => ({
  bukti: bukti.map((b) => ({ ...b, label: "l" })),
});

describe("periksaGrounding (anti-halusinasi bukti)", () => {
  it("meloloskan temuan yang seluruh buktinya ada di snapshot", () => {
    const g = periksaGrounding(
      temuan([
        { jenis: "transaksi", id: "trx-1" },
        { jenis: "pinjaman", id: "pnj-1" },
      ]),
      idx,
    );
    expect(g.ok).toBe(true);
  });

  it("menolak bukti transaksi dengan id yang tidak ada (dikarang model)", () => {
    const g = periksaGrounding(
      temuan([{ jenis: "transaksi", id: "trx-hantu" }]),
      idx,
    );
    expect(g.ok).toBe(false);
    if (!g.ok) expect(g.alasan.join(" ")).toContain("trx-hantu");
  });

  it("menolak bukti pinjaman dengan id yang tidak ada", () => {
    const g = periksaGrounding(
      temuan([{ jenis: "pinjaman", id: "pnj-hantu" }]),
      idx,
    );
    expect(g.ok).toBe(false);
  });

  it("membebaskan bukti turunan rasio/jadwal dari cek id baris", () => {
    const g = periksaGrounding(
      temuan([
        { jenis: "rasio", id: "rasio-likuiditas-2026-06" },
        { jenis: "jadwal", id: "jadwal-rat-2026" },
      ]),
      idx,
    );
    expect(g.ok).toBe(true);
  });

  it("menolak bila salah satu dari beberapa bukti tidak tergrounding", () => {
    const g = periksaGrounding(
      temuan([
        { jenis: "transaksi", id: "trx-1" },
        { jenis: "transaksi", id: "trx-hantu" },
      ]),
      idx,
    );
    expect(g.ok).toBe(false);
  });
});
