/**
 * Logger terstruktur JSON (AC-OBS-01): {level, requestId?, code?, msg, ...}.
 * TANPA PII: pemanggil hanya mengirim field aman (requestId, code, nama error,
 * bukan email/nik/isi input). Error API selalu ter-log dengan code (lib/api).
 */
export type Level = "info" | "warn" | "error";

export interface LogFields {
  msg: string;
  requestId?: string;
  code?: string;
  [key: string]: unknown;
}

function emit(level: Level, fields: LogFields): void {
  const line = JSON.stringify({ level, ...fields });
  if (level === "error") process.stderr.write(line + "\n");
  else process.stdout.write(line + "\n");
}

export const logInfo = (fields: LogFields): void => emit("info", fields);
export const logWarn = (fields: LogFields): void => emit("warn", fields);
export const logError = (fields: LogFields): void => emit("error", fields);
