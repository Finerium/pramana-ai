/**
 * Klien LLM OpenAI-compatible (MiniMax) per blueprint 6.4.
 * chatJSON: response_format json_object NON-streaming, validasi Zod, SATU retry
 * korektif pada keluaran tidak valid, lalu LLMUnavailable. TANPA provider
 * fallback (cache di lapisan audit adalah satu-satunya jaring pengaman).
 * Transport dapat diinjeksi agar test memakai mock tanpa jaringan.
 */
import { z } from "zod";

/**
 * Kegagalan tunggal lapisan LLM: timeout, jaringan, status 5xx/429, atau
 * keluaran yang tetap tidak valid setelah satu retry korektif.
 */
export class LLMUnavailable extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "LLMUnavailable";
  }
}

type FetchLike = typeof globalThis.fetch;

export interface ChatJSONArgs<S extends z.ZodType> {
  system: string;
  user: string;
  schema: S;
  timeoutMs?: number;
  /** Transport injectable; default globalThis.fetch. */
  fetch?: FetchLike;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Env 6.16 (default beku). Dibaca saat panggil agar test dapat menyetel env.
const DEFAULT_BASE_URL = "https://api.minimax.io/v1";
const DEFAULT_MODEL = "MiniMax-M2.7";

function baseUrl(): string {
  return process.env.LLM_BASE_URL || DEFAULT_BASE_URL;
}
function modelName(): string {
  return process.env.LLM_MODEL || DEFAULT_MODEL;
}
function apiKey(): string {
  return process.env.LLM_API_KEY || "";
}

const PESAN_KOREKSI =
  "Keluaran sebelumnya bukan JSON yang valid sesuai skema yang diminta. " +
  "Perbaiki dan kembalikan HANYA satu objek JSON valid sesuai skema, tanpa teks lain.";

/**
 * Satu panggilan transport. Mengembalikan string konten model. Melempar
 * LLMUnavailable untuk kegagalan transport: jaringan, timeout (AbortSignal),
 * status non-2xx (termasuk 5xx dan 429), atau envelope tanpa konten teks.
 */
async function panggilSekali(
  messages: ChatMessage[],
  timeoutMs: number,
  fetchImpl: FetchLike,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetchImpl(`${baseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey()}`,
      },
      body: JSON.stringify({
        model: modelName(),
        messages,
        response_format: { type: "json_object" },
        // ponytail: temperature 0 agar audit dapat direproduksi; naikkan bila
        // perlu variasi. Non-streaming (tanpa field stream) per 6.4.
        temperature: 0,
      }),
      signal: controller.signal,
    });
  } catch (e) {
    throw new LLMUnavailable("panggilan LLM gagal (jaringan atau timeout)", {
      cause: e,
    });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    throw new LLMUnavailable(`LLM merespons status ${res.status}`);
  }
  let envelope: unknown;
  try {
    envelope = await res.json();
  } catch (e) {
    throw new LLMUnavailable("respons LLM bukan JSON", { cause: e });
  }
  const content = (
    envelope as { choices?: Array<{ message?: { content?: unknown } }> }
  )?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new LLMUnavailable("respons LLM tanpa konten teks");
  }
  return content;
}

function parseValidasi<S extends z.ZodType>(
  raw: string,
  schema: S,
): { ok: true; value: z.infer<S> } | { ok: false } {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false };
  }
  const parsed = schema.safeParse(json);
  return parsed.success ? { ok: true, value: parsed.data } : { ok: false };
}

/**
 * chatJSON per 6.4. Validasi Zod; pada keluaran tidak valid lakukan SATU retry
 * korektif; jika tetap tidak valid, atau transport gagal, lempar LLMUnavailable.
 * Maksimum satu retry korektif (AC-PERF-04): tidak ada retry tak berbatas.
 */
export async function chatJSON<S extends z.ZodType>({
  system,
  user,
  schema,
  timeoutMs = 30_000,
  fetch: fetchImpl,
}: ChatJSONArgs<S>): Promise<z.infer<S>> {
  const transport = fetchImpl ?? globalThis.fetch;
  const messages: ChatMessage[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];

  const raw = await panggilSekali(messages, timeoutMs, transport);
  const pertama = parseValidasi(raw, schema);
  if (pertama.ok) return pertama.value;

  // Satu retry korektif. Kegagalan transport pada retry juga = LLMUnavailable.
  const raw2 = await panggilSekali(
    [
      ...messages,
      { role: "assistant", content: raw },
      { role: "user", content: PESAN_KOREKSI },
    ],
    timeoutMs,
    transport,
  );
  const kedua = parseValidasi(raw2, schema);
  if (kedua.ok) return kedua.value;

  throw new LLMUnavailable(
    "keluaran LLM tetap tidak valid setelah satu retry korektif",
  );
}
