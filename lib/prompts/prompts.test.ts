import { describe, expect, it } from "vitest";
import { PROMPTS, ADJUDIKATOR, NAMA_AGEN } from "./index";

const FROZEN_OPENING =
  "satu dari empat pemeriksa spesialis Pramana AI yang mengaudit";
const FROZEN_RULE1 = "Anda bertanya, tidak pernah menuduh; tulis temuan";

describe("prompt forensik (6.9)", () => {
  it("keempat agen memuat baris pembuka + aturan bersama verbatim", () => {
    for (const p of Object.values(PROMPTS)) {
      expect(p).toContain(FROZEN_OPENING);
      expect(p).toContain(FROZEN_RULE1);
      expect(p).toContain("tanpa em dash, tanpa emoji");
      expect(p).toContain('{"temuan":[]}');
    }
  });

  it("nama agen disisipkan ke baris pembuka masing-masing", () => {
    expect(PROMPTS.konflik_kepentingan).toContain(
      NAMA_AGEN.konflik_kepentingan,
    );
    expect(PROMPTS.kesehatan_finansial).toContain(
      NAMA_AGEN.kesehatan_finansial,
    );
  });

  it("blok wilayah konflik menyebut pencocokan vendor terhadap pengurus", () => {
    expect(PROMPTS.konflik_kepentingan).toContain("vendorAlamat");
    expect(PROMPTS.konflik_kepentingan).toContain("vendorNama");
    expect(PROMPTS.konflik_kepentingan).toContain("10.000.000");
  });

  it("blok wilayah anomali menyebut pemecahan nilai dan baseline", () => {
    expect(PROMPTS.anomali_transaksi).toContain("5.000.000");
    expect(PROMPTS.anomali_transaksi.toLowerCase()).toContain("baseline");
  });

  it("blok wilayah kesehatan memakai analogi rumah tangga", () => {
    expect(PROMPTS.kesehatan_finansial).toContain("rumah tangga");
    expect(PROMPTS.kesehatan_finansial).toContain("30 persen");
    expect(PROMPTS.kesehatan_finansial).toContain("50 persen");
  });

  it("blok wilayah kepatuhan menyebut plafon dan kelengkapan dokumen", () => {
    expect(PROMPTS.kepatuhan_proses).toContain("plafonPerAnggota");
    expect(PROMPTS.kepatuhan_proses).toContain("dokumenLengkap");
    expect(PROMPTS.kepatuhan_proses).toContain("statusRat");
  });
});

describe("prompt adjudikator (6.9)", () => {
  it("memuat lima tugas kanonik dan skema keluaran", () => {
    expect(ADJUDIKATOR).toContain("Adjudikator");
    expect(ADJUDIKATOR.toLowerCase()).toContain("duplikasi");
    expect(ADJUDIKATOR.toLowerCase()).toContain("ringkasan");
    expect(ADJUDIKATOR).toContain('"warna"');
    expect(ADJUDIKATOR).toContain('"temuan"');
  });
});
