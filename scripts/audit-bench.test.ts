import { describe, it, expect } from "vitest";
import { isHumanGated } from "./audit-bench";

describe("audit-bench isHumanGated", () => {
  it("is gated when LLM_API_KEY is absent or empty", () => {
    expect(isHumanGated({})).toBe(true);
    expect(isHumanGated({ LLM_API_KEY: "" })).toBe(true);
  });

  it("is not gated when a key is present", () => {
    expect(isHumanGated({ LLM_API_KEY: "sk-live-abc" })).toBe(false);
  });
});
