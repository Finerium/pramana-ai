import type { NextRequest } from "next/server";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { ulid } from "ulid";
import { getDb } from "../../../db/client";
import { anggota, koperasi, simpanan, users } from "../../../db/schema";
import { ApiError, ok, runRoute } from "../../../lib/api";
import { sealSession, setSessionCookie } from "../../../lib/auth";
import { COPY } from "../../../lib/copy";
import type { OnboardResp } from "../../../lib/contracts";

// Anggota baru pada purwarupa bergabung ke koperasi detail (kop-sukamaju).
const KOPERASI_ID = "kop-sukamaju";

const Body = z.object({
  nama: z.string().min(1),
  nik: z.string(),
  alamat: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  return runRoute(async () => {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      // Bila NIK yang bermasalah, beri pesan awam khusus NIK.
      const nikIssue = parsed.error.issues.some((i) => i.path[0] === "nik");
      throw new ApiError(
        "VALIDATION",
        nikIssue
          ? COPY["onboard.nik.err"]
          : "Mohon lengkapi data pendaftaran dengan benar.",
      );
    }
    const { nama, nik, alamat, email, password } = parsed.data;
    // NIK tersimulasi: 16 digit numerik.
    if (!/^[0-9]{16}$/.test(nik)) {
      throw new ApiError("VALIDATION", COPY["onboard.nik.err"]);
    }
    const { db } = getDb();
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing[0]) {
      throw new ApiError(
        "VALIDATION",
        "Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.",
      );
    }
    const kopRows = await db
      .select()
      .from(koperasi)
      .where(eq(koperasi.id, KOPERASI_ID))
      .limit(1);
    const kop = kopRows[0];
    if (!kop) throw new ApiError("INTERNAL", "Koperasi tujuan tidak tersedia.");

    // ponytail: noAnggota berurut dari jumlah anggota; upgrade ke sequence atomik
    // bila onboarding konkuren jadi nyata (UNIQUE noAnggota menjaga korektness).
    const countRows = await db
      .select({ n: sql<number>`count(*)` })
      .from(anggota)
      .where(eq(anggota.koperasiId, KOPERASI_ID));
    const noAnggota = `KDS-${String(Number(countRows[0]?.n ?? 0) + 1).padStart(4, "0")}`;
    const anggotaId = ulid();
    const userId = ulid();
    const bergabungPada = new Date().toISOString().slice(0, 10);

    await db.transaction(async (tx) => {
      await tx.insert(anggota).values({
        id: anggotaId,
        koperasiId: KOPERASI_ID,
        nama,
        nik,
        noAnggota,
        alamat,
        bergabungPada,
      });
      await tx.insert(users).values({
        id: userId,
        email,
        passwordHash: bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
        role: "anggota",
        anggotaId,
        pengurusId: null,
        createdAt: new Date().toISOString(),
      });
      await tx.insert(simpanan).values({
        id: ulid(),
        anggotaId,
        jenis: "pokok",
        saldo: 100_000,
      });
    });

    const res = ok<OnboardResp>({
      anggotaId,
      noAnggota,
      kartu: { nama, noAnggota, koperasi: kop.nama, bergabungPada },
    });
    const sealed = await sealSession({ userId, role: "anggota", anggotaId });
    setSessionCookie(res, sealed);
    return res;
  });
}
