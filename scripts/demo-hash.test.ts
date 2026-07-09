import { describe, it, expect } from "vitest";
import { combinedHash } from "./demo-hash";

describe("demo-hash combinedHash", () => {
  it("is a 64-char sha256 hex digest", () => {
    expect(combinedHash(["x"])).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic for identical input", () => {
    expect(combinedHash(["verdict", "findings"])).toBe(
      combinedHash(["verdict", "findings"]),
    );
  });

  it("differs when any part changes", () => {
    expect(combinedHash(["a", "b"])).not.toBe(combinedHash(["a", "c"]));
  });
});
