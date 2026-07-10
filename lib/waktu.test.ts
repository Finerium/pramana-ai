import { describe, expect, it } from "vitest";
import { tanggalJamWIB, tanggalWIB } from "./waktu";

describe("format waktu WIB (Asia/Jakarta)", () => {
  // Kasus bug nyata: audit dijalankan 01.42 WIB 11 Juli = 18.42 UTC 10 Juli.
  // Dulu (timeZone UTC) tampil "10 Juli"; WIB harus "11 Juli".
  it("instan larut malam WIB tetap di hari WIB, bukan mundur ke UTC", () => {
    const iso = "2026-07-10T18:42:00.000Z";
    expect(tanggalWIB(iso)).toBe("11 Juli 2026");
    expect(tanggalJamWIB(iso)).toBe("11 Juli 2026, 01.42 WIB");
  });

  it("siang hari WIB", () => {
    expect(tanggalWIB("2026-07-11T05:00:00.000Z")).toBe("11 Juli 2026");
  });

  it("iso invalid dikembalikan apa adanya", () => {
    expect(tanggalWIB("bukan-tanggal")).toBe("bukan-tanggal");
    expect(tanggalJamWIB("bukan-tanggal")).toBe("bukan-tanggal");
  });
});
