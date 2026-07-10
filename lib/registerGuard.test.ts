import { describe, expect, it } from "vitest";
import {
  periksaTemuan,
  periksaRingkasan,
  type TemuanTeks,
} from "./registerGuard";

const dasar: TemuanTeks = {
  judul: "Pembelian besar ke toko yang beralamat sama dengan rumah pengurus",
  penjelasan_awam:
    "Pada 14 Juni koperasi membeli barang senilai besar dari sebuah toko. Alamat toko itu sama dengan alamat pengurus.",
  kenapa_penting:
    "Uang koperasi adalah milik bersama, sehingga anggota berhak memastikan pembelian ini wajar.",
  pertanyaan_rat: "Bisakah pengurus menjelaskan alasan memilih toko tersebut?",
};

function ubah(patch: Partial<TemuanTeks>): TemuanTeks {
  return { ...dasar, ...patch };
}

describe("registerGuard.periksaTemuan (6.5, AC-REG-01/02)", () => {
  it("menerima temuan yang bersih", () => {
    expect(periksaTemuan(dasar)).toEqual({ ok: true });
  });

  it("menolak kata vonis 'korupsi' sebagai pernyataan", () => {
    const r = periksaTemuan(ubah({ kenapa_penting: "Ini jelas korupsi." }));
    expect(r.ok).toBe(false);
  });

  it("menolak kata vonis 'mencuri' sebagai pernyataan", () => {
    const r = periksaTemuan(
      ubah({ penjelasan_awam: "Pengurus mencuri uang koperasi." }),
    );
    expect(r.ok).toBe(false);
  });

  it("menolak kata vonis 'pelaku' sebagai pernyataan", () => {
    const r = periksaTemuan(
      ubah({ penjelasan_awam: "Bendahara adalah pelaku utama." }),
    );
    expect(r.ok).toBe(false);
  });

  it("menerima pola edukatif 'berisiko ...' satu kemunculan", () => {
    const r = periksaTemuan(
      ubah({
        kenapa_penting:
          "Bila dibiarkan, pola seperti ini berisiko menggelapkan dana bersama.",
      }),
    );
    expect(r).toEqual({ ok: true });
  });

  it("menerima pola edukatif 'disebut ...' satu kemunculan", () => {
    const r = periksaTemuan(
      ubah({
        kenapa_penting:
          "Dalam aturan, perbuatan semacam ini disebut penipuan bila terbukti.",
      }),
    );
    expect(r).toEqual({ ok: true });
  });

  it("menolak dua kemunculan pola edukatif", () => {
    const r = periksaTemuan(
      ubah({
        kenapa_penting:
          "Hal ini disebut korupsi dan juga berisiko penipuan bagi anggota.",
      }),
    );
    expect(r.ok).toBe(false);
  });

  it("menolak pertanyaan_rat yang tidak diakhiri tanda tanya", () => {
    const r = periksaTemuan(
      ubah({ pertanyaan_rat: "Jelaskan alasan pembelian itu." }),
    );
    expect(r.ok).toBe(false);
  });

  it("menolak kata vonis di dalam pertanyaan_rat", () => {
    const r = periksaTemuan(
      ubah({ pertanyaan_rat: "Mengapa pelaku pembelian itu dibiarkan?" }),
    );
    expect(r.ok).toBe(false);
  });

  it("menolak kata vonis di judul", () => {
    const r = periksaTemuan(
      ubah({ judul: "Bendahara melakukan korupsi dana koperasi" }),
    );
    expect(r.ok).toBe(false);
  });

  it("menolak karakter em dash", () => {
    const r = periksaTemuan(
      ubah({
        penjelasan_awam: "Pembelian besar — perlu penjelasan pengurus.",
      }),
    );
    expect(r.ok).toBe(false);
  });

  it("menolak emoji", () => {
    const r = periksaTemuan(
      ubah({ judul: "Pembelian besar yang perlu ditanyakan \u{1F6A9}" }),
    );
    expect(r.ok).toBe(false);
  });

  it("menolak sapaan 'kamu'", () => {
    const r = periksaTemuan(
      ubah({ kenapa_penting: "Ini juga uang kamu di koperasi." }),
    );
    expect(r.ok).toBe(false);
  });

  it("menolak aksara non-Latin (Mandarin) di penjelasan_awam", () => {
    const r = periksaTemuan(
      ubah({ penjelasan_awam: "Pembelian ke 合作社 yang perlu dijelaskan." }),
    );
    expect(r.ok).toBe(false);
  });

  it("menolak istilah asing 'cooperativa' untuk koperasi", () => {
    const r = periksaTemuan(
      ubah({ penjelasan_awam: "Saldo kas cooperativa turun tajam bulan ini." }),
    );
    expect(r.ok).toBe(false);
  });

  it("tidak salah menolak kata 'kamus' yang memuat 'kamu'", () => {
    const r = periksaTemuan(
      ubah({
        penjelasan_awam:
          "Istilah ini tercatat di kamus koperasi sebagai pembelian antar pihak.",
      }),
    );
    expect(r).toEqual({ ok: true });
  });

  it("mengumpulkan beberapa alasan sekaligus", () => {
    const r = periksaTemuan(
      ubah({
        kenapa_penting: "Ini korupsi dan uang kamu.",
        pertanyaan_rat: "Jelaskan.",
      }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.alasan.length).toBeGreaterThan(1);
  });
});

describe("registerGuard.periksaRingkasan (6.5)", () => {
  it("menerima ringkasan yang bersih", () => {
    expect(
      periksaRingkasan(
        "Kas koperasi menurun dan ada pembelian besar yang perlu dijelaskan pengurus.",
      ),
    ).toEqual({ ok: true });
  });

  it("menolak ringkasan dengan kata vonis", () => {
    const r = periksaRingkasan("Pengurus melakukan penipuan terhadap anggota.");
    expect(r.ok).toBe(false);
  });

  it("menolak ringkasan dengan em dash", () => {
    const r = periksaRingkasan("Kas menurun — pembelian perlu dijelaskan.");
    expect(r.ok).toBe(false);
  });
});
