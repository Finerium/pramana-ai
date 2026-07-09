import { describe, it, expect } from "vitest";
import { BENTUK, severityToBentuk } from "./verdict";

describe("BENTUK verdict shapes (clip-path bundle verbatim)", () => {
  it("hijau lingkaran, kuning segitiga, merah belah ketupat, info persegi", () => {
    expect(BENTUK.hijau.clip).toBe("none");
    expect(BENTUK.hijau.radius).toBe("50%");
    expect(BENTUK.kuning.clip).toBe("polygon(50% 8%, 96% 92%, 4% 92%)");
    expect(BENTUK.merah.clip).toBe("polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)");
    expect(BENTUK.info.clip).toBe("none");
    expect(BENTUK.info.radius).toBe("2px");
  });
  it("label + token warna + surface per warna", () => {
    expect(BENTUK.merah.label).toBe("Merah");
    expect(BENTUK.merah.colorVar).toBe("var(--verdict-merah)");
    expect(BENTUK.merah.surfaceVar).toBe("var(--verdict-merah-surface)");
  });
  it("severity memetakan 1:1 ke bentuk", () => {
    expect(severityToBentuk("merah")).toBe("merah");
    expect(severityToBentuk("kuning")).toBe("kuning");
    expect(severityToBentuk("info")).toBe("info");
  });
});
