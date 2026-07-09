import { describe, it, expect } from "vitest";
import { findSecrets } from "./scan-secrets.mjs";

// Samples assembled at runtime so this source file never contains a full literal
// token; the working-tree self-scan must stay clean.
const openai = "sk-" + "A".repeat(32);
const google = "AIza" + "Bc0".repeat(12);
const github = "ghp_" + "b".repeat(36);
const aws = "AKIA" + "ABCDEFGH12345678";
const jwt =
  "eyJ" + "aB0_-x".repeat(4) + "." + "cD1yz2".repeat(3) + "." + "sIg012abcXY";

describe("scan-secrets findSecrets", () => {
  it("detects an OpenAI-style key", () => {
    const r = findSecrets(`LLM_API_KEY=${openai}`);
    expect(r.some((x) => x.pattern === "openai-key")).toBe(true);
  });

  it("detects Google, GitHub, AWS keys and a JWT", () => {
    expect(
      findSecrets(google).some((x) => x.pattern === "google-api-key"),
    ).toBe(true);
    expect(findSecrets(github).some((x) => x.pattern === "github-token")).toBe(
      true,
    );
    expect(findSecrets(aws).some((x) => x.pattern === "aws-access-key")).toBe(
      true,
    );
    expect(findSecrets(jwt).some((x) => x.pattern === "jwt")).toBe(true);
  });

  it("detects a PEM private key block header", () => {
    const pem = "-----BEGIN " + "RSA PRIVATE KEY" + "-----";
    expect(findSecrets(pem).some((x) => x.pattern === "private-key")).toBe(
      true,
    );
  });

  it("never leaks the matched secret value in its output", () => {
    const r = findSecrets(`token=${openai}`);
    expect(JSON.stringify(r).includes(openai)).toBe(false);
  });

  it("does not false-positive on benign short 'sk-' words", () => {
    expect(findSecrets("a task-based disk with risky code")).toEqual([]);
  });

  it("reports 1-based line numbers", () => {
    const r = findSecrets(`clean line\nLLM_API_KEY=${openai}`);
    expect(r[0]?.line).toBe(2);
  });
});
