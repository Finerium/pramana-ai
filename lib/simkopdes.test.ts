import { describe, expect, it } from "vitest";
import {
  anggotaRef,
  geraiLabel,
  koperasiRef,
  kodeWilayah,
  maskNik,
  maskTelepon,
  pengurusRef,
} from "./simkopdes";

describe("simkopdes display-ref (format kamus data resmi)", () => {
  it("koperasiRef berformat KOP- + 12 hex kapital", () => {
    expect(koperasiRef("kop-sukamaju")).toMatch(/^KOP-[0-9A-F]{12}$/);
  });

  it("anggotaRef & pengurusRef berformat 16 hex kapital", () => {
    expect(anggotaRef("ang-sari")).toMatch(/^[0-9A-F]{16}$/);
    expect(pengurusRef("png-budi")).toMatch(/^[0-9A-F]{16}$/);
  });

  it("deterministik: input sama -> ref sama (determinisme demo)", () => {
    expect(koperasiRef("kop-sukamaju")).toBe(koperasiRef("kop-sukamaju"));
    expect(anggotaRef("ang-sari")).toBe(anggotaRef("ang-sari"));
  });

  it("injektif praktis: id berbeda -> ref berbeda", () => {
    expect(koperasiRef("kop-sukamaju")).not.toBe(koperasiRef("kop-lembahsari"));
    expect(anggotaRef("ang-juri")).not.toBe(anggotaRef("ang-sari"));
  });

  it("maskNik menyamarkan tengah (32************01) untuk NIK 16 digit", () => {
    expect(maskNik("3201456789012301")).toBe("32************01");
    expect(maskNik("3201456789012301")).toHaveLength(16);
  });

  it("maskTelepon menyamarkan tengah (08******7890)", () => {
    expect(maskTelepon("081234567890")).toBe("08******7890");
  });

  it("kodeWilayah berformat PP.KK.CC.DDDD dengan PP kode BPS provinsi", () => {
    const kode = kodeWilayah("Jawa Barat", "Kab. Bandung", "Sukamaju");
    expect(kode).toMatch(/^\d{2}\.\d{2}\.\d{2}\.\d{4}$/);
    expect(kode.startsWith("32.")).toBe(true); // Jawa Barat = 32 (BPS)
  });

  it("kodeWilayah deterministik & beda desa -> kode beda", () => {
    expect(kodeWilayah("Bali", "Kab. Karangasem", "Karangasem")).toBe(
      kodeWilayah("Bali", "Kab. Karangasem", "Karangasem"),
    );
    expect(kodeWilayah("Jawa Barat", "Kab. Bandung", "Sukamaju")).not.toBe(
      kodeWilayah("Jawa Barat", "Kab. Bandung", "Mekarsari"),
    );
  });

  it("geraiLabel memetakan jenis unit usaha ke nama gerai resmi", () => {
    expect(geraiLabel("apotek")).toBe("Apotek Desa");
    expect(geraiLabel("klinik")).toBe("Gerai Klinik Desa");
    expect(geraiLabel("gudang")).toBe("Gerai Cold Storage");
  });
});
