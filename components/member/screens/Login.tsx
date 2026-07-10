"use client";

/**
 * Login anggota (U8, F05), desain mobile. POST /api/auth/login lalu redirect
 * sesuai role dari respons. Hint box "Akun uji juri" (anggota utama + baris
 * kecil pemerintah & bendahara) dengan Isi otomatis. Query ?as= diterima tanpa
 * error: seam varian visual per persona (default mobile anggota).
 */
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { COPY } from "@/lib/copy";
import { MEMBER_COPY } from "@/lib/copy/member";
import { postJson } from "@/components/member/data";
import { Banner, rise } from "@/components/member/ui";
import { BelahKetupat } from "@/components/member/icons";
import { LoginVariant as GovLoginVariant } from "@/components/gov/login-variant";
import { LoginVariant as SubjekLoginVariant } from "@/components/subjek/login-variant";

type LoginResp = { role?: string; redirectTo?: string };

function tujuan(role?: string): string {
  if (role === "pemerintah") return "/pemerintah";
  if (role === "pengurus" || role === "subjek") return "/pembukuan";
  return "/beranda";
}

const INPUT: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  height: 50,
  padding: "0 14px",
  border: "1px solid var(--border)",
  borderRadius: 14,
  background: "var(--surface)",
  color: "var(--ink)",
  fontSize: 16,
};

export function Login() {
  const router = useRouter();
  const params = useSearchParams();
  const as = params.get("as");

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submitWith(alamatEmail: string, kataSandi: string) {
    if (busy) return;
    setBusy(true);
    setErr(false);
    try {
      const data = await postJson<LoginResp>("/api/auth/login", {
        email: alamatEmail.trim(),
        password: kataSandi,
      });
      router.push(data.redirectTo ?? tujuan(data.role));
    } catch {
      setBusy(false);
      setErr(true);
    }
  }

  async function submit() {
    return submitWith(email, pass);
  }

  // F-09: satu rute /login, tiga varian visual per persona; ketiga desain
  // login bundle dishipping. Varian membawa wrapper surface-nya sendiri.
  if (as === "pemerintah") {
    return (
      <GovLoginVariant
        onSubmit={(e, p) => void submitWith(e, p)}
        busy={busy}
        error={err ? COPY["login.err"] : null}
      />
    );
  }
  if (as === "bendahara") {
    return (
      <SubjekLoginVariant
        onSubmit={(e, p) => void submitWith(e, p)}
        busy={busy}
        error={err ? COPY["login.err"] : null}
      />
    );
  }

  function isiJuri() {
    setEmail("juri.anggota@pramana.id");
    setPass("PramanaJuri2026");
    setErr(false);
  }

  return (
    // Bingkai iPhone di desktop HANYA untuk varian anggota (aplikasi mobile).
    // Varian pemerintah + bendahara sudah return di atas: tetap desktop, tanpa
    // frame. Reuse .m-frame > .m-app > .m-shell (mobile.css); .m-fill = tinggi
    // penuh yang TUMBUH (min-height, bukan height tetap) agar konten terpusat
    // tanpa memotong bagian atas saat lebih tinggi dari badan ponsel; .m-shell
    // yang menggulir. Di ponsel nyata: full-bleed, nol bingkai.
    <div className="m-frame">
      <div className="m-app">
        <div className="m-shell">
          <main
            className="m-fill"
            style={{
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 24,
              padding: "88px 24px 48px",
              animation: "m-fadein 0.28s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                ...rise(0, 0.45),
              }}
            >
              <BelahKetupat size={36} color="var(--accent)" />
              <span
                style={{ fontSize: 31, fontWeight: 750, letterSpacing: -0.6 }}
              >
                {MEMBER_COPY["login.judul"]}
              </span>
              <span
                style={{
                  fontSize: 14.5,
                  color: "var(--muted)",
                  textAlign: "center",
                }}
              >
                {MEMBER_COPY["login.tagline"]}
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                background: "var(--surface)",
                border: "0.5px solid var(--border)",
                borderRadius: 22,
                padding: "22px 20px",
                boxShadow:
                  "0 1px 2px rgba(0,0,0,0.04),0 8px 24px rgba(0,0,0,0.05)",
                ...rise(0.06, 0.45),
              }}
            >
              <label
                style={{ display: "flex", flexDirection: "column", gap: 7 }}
              >
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>
                  {MEMBER_COPY["login.email"]}
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={MEMBER_COPY["login.email.ph"]}
                  style={INPUT}
                />
              </label>
              <label
                style={{ display: "flex", flexDirection: "column", gap: 7 }}
              >
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>
                  {MEMBER_COPY["login.sandi"]}
                </span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder={MEMBER_COPY["login.sandi.ph"]}
                  style={INPUT}
                />
              </label>
              {err ? <Banner tone="galat">{COPY["login.err"]}</Banner> : null}
              <button
                type="submit"
                style={{
                  height: 54,
                  borderRadius: 999,
                  background: "var(--accent)",
                  color: "var(--accent-on)",
                  fontSize: 17,
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                {busy ? MEMBER_COPY["login.busy"] : MEMBER_COPY["login.masuk"]}
              </button>
            </form>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                border: "1px dashed var(--border)",
                borderRadius: 18,
                padding: "15px 18px",
                ...rise(0.12, 0.45),
              }}
            >
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  color: "var(--muted)",
                }}
              >
                {MEMBER_COPY["login.hint.kicker"]}
              </span>
              <span
                style={{
                  font: "13px ui-monospace,Menlo,monospace",
                  color: "var(--ink)",
                  lineHeight: 1.6,
                }}
              >
                juri.anggota@pramana.id
                <br />
                PramanaJuri2026
              </span>
              <button
                type="button"
                onClick={isiJuri}
                style={{
                  minHeight: 44,
                  display: "flex",
                  alignItems: "center",
                  fontSize: 14.5,
                  fontWeight: 600,
                  color: "var(--accent)",
                }}
              >
                {MEMBER_COPY["login.hint.isi"]}
              </button>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  paddingTop: 4,
                }}
              >
                {MEMBER_COPY["login.hint.lain"]}
              </span>
              <span
                style={{
                  font: "11.5px ui-monospace,Menlo,monospace",
                  color: "var(--muted)",
                  lineHeight: 1.7,
                }}
              >
                juri.pemerintah@pramana.id / PramanaJuri2026
                <br />
                bendahara@pramana.id / PramanaBendahara2026
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 6,
                fontSize: 15,
                ...rise(0.18, 0.45),
              }}
            >
              <span style={{ color: "var(--muted)" }}>
                {MEMBER_COPY["login.belum"]}
              </span>
              <button
                type="button"
                onClick={() => router.push("/daftar")}
                style={{
                  minHeight: 44,
                  display: "inline-flex",
                  alignItems: "center",
                  fontWeight: 600,
                  color: "var(--accent)",
                }}
              >
                {MEMBER_COPY["login.daftar"]}
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
