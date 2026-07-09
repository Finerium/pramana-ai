import type { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getDb } from "../../../../db/client";
import { users } from "../../../../db/schema";
import { ApiError, ok, runRoute } from "../../../../lib/api";
import {
  REDIRECT,
  sealSession,
  setSessionCookie,
  type Role,
} from "../../../../lib/auth";
import {
  clientIp,
  recordLoginFailure,
  tooManyLogins,
} from "../../../../lib/rateLimit";
import { COPY } from "../../../../lib/copy";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  return runRoute(async () => {
    const ip = clientIp(req);
    if (tooManyLogins(ip)) {
      // ponytail: throttle transport-level. Pakai kode beku UNAUTHORIZED dengan
      // status 429 (AC-SEC-07) agar tetap dalam enam kode envelope 6.3.
      throw new ApiError(
        "UNAUTHORIZED",
        "Terlalu banyak percobaan masuk. Silakan coba lagi dalam satu menit.",
        429,
      );
    }
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      recordLoginFailure(ip);
      throw new ApiError("VALIDATION", COPY["login.err"]);
    }
    const { email, password } = parsed.data;
    const { db } = getDb();
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    const user = rows[0];
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      recordLoginFailure(ip);
      throw new ApiError("UNAUTHORIZED", COPY["login.err"]);
    }
    const role = user.role as Role;
    const sealed = await sealSession({
      userId: user.id,
      role,
      anggotaId: user.anggotaId ?? undefined,
    });
    const res = ok({ role, redirectTo: REDIRECT[role] });
    setSessionCookie(res, sealed);
    return res;
  });
}
