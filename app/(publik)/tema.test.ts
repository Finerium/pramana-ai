import { describe, expect, it } from "vitest";
import {
  bacaTema,
  labelTema,
  temaBerikutnya,
  type Tema,
} from "../../components/landing/tema";

describe("temaBerikutnya", () => {
  it("cycles sistem -> terang -> gelap -> sistem", () => {
    expect(temaBerikutnya("sistem")).toBe("terang");
    expect(temaBerikutnya("terang")).toBe("gelap");
    expect(temaBerikutnya("gelap")).toBe("sistem");
  });
});

describe("bacaTema", () => {
  it("accepts explicit terang and gelap from storage", () => {
    expect(bacaTema("terang")).toBe("terang");
    expect(bacaTema("gelap")).toBe("gelap");
  });

  it("falls back to sistem for anything else", () => {
    const kasus: (string | null | undefined)[] = [
      "sistem",
      "",
      "dark",
      "TERANG",
      null,
      undefined,
    ];
    for (const raw of kasus) {
      expect(bacaTema(raw)).toBe("sistem");
    }
  });
});

describe("labelTema", () => {
  it("maps each theme to its Indonesian label", () => {
    const label: Record<Tema, string> = {
      sistem: "Sistem",
      terang: "Terang",
      gelap: "Gelap",
    };
    for (const t of Object.keys(label) as Tema[]) {
      expect(labelTema(t)).toBe(label[t]);
    }
  });
});
