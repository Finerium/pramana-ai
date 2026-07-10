import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { chatJSON, LLMUnavailable } from "./llm";

const schema = z.object({ nilai: z.number() });

/** Bangun Response OpenAI-compatible palsu. */
function res(content: string, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => ({ choices: [{ message: { content } }] }),
  } as unknown as Response;
}

const valid = () => res(JSON.stringify({ nilai: 42 }));
const brokenJson = () => res("ini bukan json {");
const wrongShape = () => res(JSON.stringify({ nilai: "bukan angka" }));

afterEach(() => {
  vi.useRealTimers();
});

describe("chatJSON (AC-LLM-01, AC-PERF-04)", () => {
  it("mengembalikan objek tervalidasi pada panggilan pertama yang sah", async () => {
    const fetch = vi.fn(async () => valid());
    const out = await chatJSON({ system: "s", user: "u", schema, fetch });
    expect(out.nilai).toBe(42);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("POST ke {BASE_URL}/chat/completions non-streaming dengan response_format json_object", async () => {
    const fetch = vi.fn().mockResolvedValue(valid());
    await chatJSON({ system: "s", user: "u", schema, fetch });
    const call = fetch.mock.calls[0]!;
    const init = call[1] as RequestInit;
    expect(String(call[0])).toMatch(/\/chat\/completions$/);
    const body = JSON.parse(init.body as string);
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(body.stream).toBeFalsy();
    expect(body.model).toBe("MiniMax-M2.7");
  });

  it("JSON invalid lalu retry korektif yang sah = sukses (tepat 2 panggilan)", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(brokenJson())
      .mockResolvedValueOnce(valid());
    const out = await chatJSON({ system: "s", user: "u", schema, fetch });
    expect(out.nilai).toBe(42);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("skema tidak cocok lalu retry korektif juga cacat = LLMUnavailable, tanpa retry tak berbatas", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(wrongShape())
      .mockResolvedValueOnce(wrongShape());
    await expect(
      chatJSON({ system: "s", user: "u", schema, fetch }),
    ).rejects.toBeInstanceOf(LLMUnavailable);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("retry korektif menyisipkan pesan koreksi ke percakapan", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(brokenJson())
      .mockResolvedValueOnce(valid());
    await chatJSON({ system: "s", user: "u", schema, fetch });
    const secondBody = JSON.parse(
      (fetch.mock.calls[1]![1] as RequestInit).body as string,
    );
    // percakapan retry lebih panjang dari panggilan awal (menyertakan koreksi)
    expect(secondBody.messages.length).toBeGreaterThan(2);
  });

  it("status 500 = LLMUnavailable tanpa retry", async () => {
    const fetch = vi.fn(async () => res("", 500));
    await expect(
      chatJSON({ system: "s", user: "u", schema, fetch }),
    ).rejects.toBeInstanceOf(LLMUnavailable);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("status 429 = LLMUnavailable tanpa retry", async () => {
    const fetch = vi.fn(async () => res("", 429));
    await expect(
      chatJSON({ system: "s", user: "u", schema, fetch }),
    ).rejects.toBeInstanceOf(LLMUnavailable);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("kesalahan jaringan = LLMUnavailable", async () => {
    const fetch = vi.fn(async () => {
      throw new Error("ECONNRESET");
    });
    await expect(
      chatJSON({ system: "s", user: "u", schema, fetch }),
    ).rejects.toBeInstanceOf(LLMUnavailable);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("menghormati timeout default 30 detik lewat AbortSignal", async () => {
    vi.useFakeTimers();
    const fetch = vi.fn(
      (_url: unknown, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => {
            const e = new Error("Aborted");
            e.name = "AbortError";
            reject(e);
          });
        }),
    );
    const p = chatJSON({
      system: "s",
      user: "u",
      schema,
      fetch: fetch as unknown as typeof globalThis.fetch,
    });
    const assertion = expect(p).rejects.toBeInstanceOf(LLMUnavailable);
    await vi.advanceTimersByTimeAsync(30_000);
    await assertion;
  });

  it("envelope bukan JSON = LLMUnavailable", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error("bukan json");
      },
    });
    await expect(
      chatJSON({ system: "s", user: "u", schema, fetch }),
    ).rejects.toBeInstanceOf(LLMUnavailable);
  });

  it("envelope tanpa konten teks = LLMUnavailable", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ choices: [] }),
    });
    await expect(
      chatJSON({ system: "s", user: "u", schema, fetch }),
    ).rejects.toBeInstanceOf(LLMUnavailable);
  });
});

// MiniMax-M2.7 membungkus keluaran dengan blok <think>...</think> dan/atau code
// fence ```json. chatJSON harus mengekstrak JSON bersih sebelum validasi (M3-1).
describe("chatJSON ekstraksi keluaran MiniMax M2.x (think + fence)", () => {
  it("mengurai JSON di balik blok <think>...</think>", async () => {
    const fetch = vi.fn(async () =>
      res('<think>Saya memikirkan jawabannya.</think>\n\n{"nilai": 7}'),
    );
    const out = await chatJSON({ system: "s", user: "u", schema, fetch });
    expect(out.nilai).toBe(7);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("mengurai JSON di dalam code fence ```json", async () => {
    const fetch = vi.fn(async () => res('```json\n{"nilai": 7}\n```'));
    const out = await chatJSON({ system: "s", user: "u", schema, fetch });
    expect(out.nilai).toBe(7);
  });

  it("mengurai kombinasi think + fence + teks pembungkus", async () => {
    const fetch = vi.fn(async () =>
      res(
        '<think>reasoning</think>\nBerikut hasilnya:\n```json\n{"nilai": 7}\n```\nsemoga membantu',
      ),
    );
    const out = await chatJSON({ system: "s", user: "u", schema, fetch });
    expect(out.nilai).toBe(7);
  });

  it("mengurai objek JSON seimbang dari teks pembungkus tanpa fence", async () => {
    const fetch = vi.fn(async () =>
      res('Jawaban saya adalah {"nilai": 7} sekian.'),
    );
    const out = await chatJSON({ system: "s", user: "u", schema, fetch });
    expect(out.nilai).toBe(7);
  });

  it("tidak salah memotong pada kurung di dalam string JSON", async () => {
    const s2 = z.object({ teks: z.string() });
    const fetch = vi.fn(async () => res('{"teks": "a } b { c"}'));
    const out = await chatJSON({ system: "s", user: "u", schema: s2, fetch });
    expect(out.teks).toBe("a } b { c");
  });
});
