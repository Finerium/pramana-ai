/**
 * Lapisan envelope beku 6.3. Sukses {ok:true,data}; gagal
 * {ok:false,error:{code,message}} dengan code HANYA dari enam kode beku.
 * runRoute membungkus setiap handler: membuat requestId, menangkap ApiError
 * jadi envelope tepat, dan error tak terduga jadi INTERNAL (ter-log dengan
 * requestId, tanpa pesan mentah = tanpa PII).
 */
import { NextResponse } from "next/server";
import { logError } from "./logger";

export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "LLM_UNAVAILABLE"
  | "INTERNAL";

const STATUS: Record<ErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION: 400,
  LLM_UNAVAILABLE: 503,
  INTERNAL: 500,
};

const MSG_INTERNAL = "Terjadi kesalahan pada sistem. Silakan coba lagi.";

/** Error terstruktur yang runRoute terjemahkan ke envelope gagal. */
export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  constructor(code: ErrorCode, message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status ?? STATUS[code];
  }
}

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(
  code: ErrorCode,
  message: string,
  status?: number,
): NextResponse {
  return NextResponse.json(
    { ok: false, error: { code, message } },
    { status: status ?? STATUS[code] },
  );
}

/**
 * Memo status probe LLM untuk /api/health (catatan 6.18): health TIDAK
 * memanggil provider; ia hanya membaca apakah pernah ada panggilan model sukses
 * (diset jalur live audit). Sekali sukses = "up" sepanjang umur instance.
 * ponytail: memo per-instance in-memory; cukup untuk kelas demo, upgrade ke
 * store bersama bila health lintas-instance harus konsisten.
 */
let llmProbeOkFlag = false;
export function recordLlmSuccess(): void {
  llmProbeOkFlag = true;
}
export function llmProbeOk(): boolean {
  return llmProbeOkFlag;
}

/**
 * Bungkus handler: requestId per permintaan, envelope error konsisten, log
 * fail-closed. Handler membaca req/ctx langsung sehingga signature tetap cocok
 * dengan tipe route Next (dinamis maupun tidak).
 */
export async function runRoute(
  fn: (meta: { requestId: string }) => Promise<Response>,
): Promise<Response> {
  const requestId = crypto.randomUUID();
  try {
    return await fn({ requestId });
  } catch (e) {
    if (e instanceof ApiError) {
      logError({ requestId, code: e.code, msg: e.message });
      return fail(e.code, e.message, e.status);
    }
    // Kesalahan konfigurasi (mis. SESSION_SECRET production): pesan jelas dan
    // aman untuk dilog (tanpa PII), tetap dibalas INTERNAL ke klien.
    if (e instanceof Error && e.name === "ConfigError") {
      logError({ requestId, code: "INTERNAL", msg: e.message });
      return fail("INTERNAL", MSG_INTERNAL);
    }
    // Tak terduga: log nama error saja (bukan pesan mentah) agar tanpa PII.
    logError({
      requestId,
      code: "INTERNAL",
      msg: "unhandled error",
      err: e instanceof Error ? e.name : "unknown",
    });
    return fail("INTERNAL", MSG_INTERNAL);
  }
}
