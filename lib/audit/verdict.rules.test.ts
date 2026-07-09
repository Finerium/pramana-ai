import { describe, expect, it } from "vitest";
import type { Severity } from "@/lib/contracts";
import { hitungWarna } from "./verdict";

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
