/**
 * Sesi iron-session (6.4). Cookie "pramana_session" httpOnly, secure di
 * production, sameSite lax, umur 7 hari, payload {userId, role, anggotaId?}
 * ditandatangani SESSION_SECRET. requireRole = deny-by-default untuk setiap
 * route non-publik. Memakai sealData/unsealData langsung (bukan cookies() dari
 * next/headers) agar handler dapat diuji dengan invocation langsung.
 */
import { sealData, unsealData } from "iron-session";
import type { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { anggota, pengurus, users } from "../db/schema";
import { ApiError } from "./api";
import { isProduction, sessionSecret } from "./env";

export type Role = "anggota" | "pemerintah" | "pengurus";

export interface SessionData {
  userId: string;
  role: Role;
  anggotaId?: string;
}

export const SESSION_COOKIE = "pramana_session";
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 hari

/** Redirect login per role (6.3). */
export const REDIRECT: Record<Role, string> = {
  anggota: "/beranda",
  pemerintah: "/pemerintah",
  pengurus: "/pembukuan",
};

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(/; */)) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq) === name)
      return decodeURIComponent(part.slice(eq + 1));
  }
  return undefined;
}

/** Segel payload sesi jadi nilai cookie. */
export async function sealSession(data: SessionData): Promise<string> {
  return sealData(data, { password: sessionSecret(), ttl: TTL_SECONDS });
}

/** Baca sesi dari cookie permintaan; null bila tidak ada/rusak/kedaluwarsa. */
export async function getSession(req: Request): Promise<SessionData | null> {
  const raw = readCookie(req, SESSION_COOKIE);
  if (!raw) return null;
  try {
    const data = await unsealData<Partial<SessionData>>(raw, {
      password: sessionSecret(),
      ttl: TTL_SECONDS,
    });
    if (
      !data ||
      typeof data.userId !== "string" ||
      (data.role !== "anggota" &&
        data.role !== "pemerintah" &&
        data.role !== "pengurus")
    ) {
      return null;
    }
    return { userId: data.userId, role: data.role, anggotaId: data.anggotaId };
  } catch {
    return null;
  }
}

/**
 * Deny-by-default: tanpa sesi menjadi UNAUTHORIZED (401); role salah menjadi
 * FORBIDDEN (403). Mengembalikan sesi tervalidasi untuk role yang diminta.
 */
export async function requireRole(
  req: Request,
  role: Role,
): Promise<SessionData> {
  const s = await getSession(req);
  if (!s) {
    throw new ApiError("UNAUTHORIZED", "Anda perlu masuk untuk melanjutkan.");
  }
  if (s.role !== role) {
    throw new ApiError("FORBIDDEN", "Anda tidak memiliki akses ke sumber ini.");
  }
  return s;
}

/**
 * Scope koperasi untuk pengurus yang sedang masuk (users.pengurusId ->
 * pengurus.koperasiId). Dipakai route subjek yang beroperasi pada koperasi
 * pengurus itu sendiri. Null bila user bukan pengurus valid.
 */
export async function koperasiForPengurus(
  userId: string,
): Promise<string | null> {
  const { db } = getDb();
  const rows = await db
    .select({ koperasiId: pengurus.koperasiId })
    .from(users)
    .innerJoin(pengurus, eq(users.pengurusId, pengurus.id))
    .where(eq(users.id, userId))
    .limit(1);
  return rows[0]?.koperasiId ?? null;
}

/**
 * Scope koperasi untuk anggota yang sedang masuk (anggota.koperasiId).
 * Dipakai route member agar membaca koperasi milik anggota itu sendiri, bukan
 * konstanta ter-hardcode. Null bila anggotaId tak dikenal.
 */
export async function koperasiForAnggota(
  anggotaId: string,
): Promise<string | null> {
  const { db } = getDb();
  const rows = await db
    .select({ koperasiId: anggota.koperasiId })
    .from(anggota)
    .where(eq(anggota.id, anggotaId))
    .limit(1);
  return rows[0]?.koperasiId ?? null;
}

/**
 * True bila anggotaId benar milik koperasiId. Dipakai konsol subjek untuk
 * menolak anggota lintas-koperasi pada form transaksi/pinjaman (anti IDOR).
 */
export async function anggotaMilikKoperasi(
  anggotaId: string,
  koperasiId: string,
): Promise<boolean> {
  const { db } = getDb();
  const rows = await db
    .select({ id: anggota.id })
    .from(anggota)
    .where(and(eq(anggota.id, anggotaId), eq(anggota.koperasiId, koperasiId)))
    .limit(1);
  return rows.length > 0;
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: TTL_SECONDS,
  };
}

/** Pasang cookie sesi pada respons. */
export function setSessionCookie(res: NextResponse, sealed: string): void {
  res.cookies.set(SESSION_COOKIE, sealed, cookieOptions());
}

/** Hapus cookie sesi pada respons (logout). */
export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
}
