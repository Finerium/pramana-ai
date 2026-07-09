"use client";
import { useState } from "react";
import "@/styles/tokens/dashboard.css";
import { GOV_COPY } from "@/lib/copy/gov";
import { BENTUK } from "@/app/(gov)/_logic/verdict";
import { VerdictShape } from "./VerdictShape";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Varian visual login dasbor pemerintah (bundle dashboard). Tanpa rute sendiri;
 * halaman /login (unit d) memasangnya dan menyediakan onSubmit/busy/error nyata
 * (F-09). Props BEKU. Root membawa kelas `.gov` agar token + font mandiri.
 */
export function LoginVariant({
  onSubmit,
  busy,
  error,
}: {
  onSubmit: (email: string, password: string) => void;
  busy: boolean;
  error: string | null;
}) {
  const [email, setEmail] = useState("");
  const [sandi, setSandi] = useState("");

  const kirim = (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    onSubmit(email.trim(), sandi);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px 20px",
    borderRadius: 999,
    fontWeight: 500,
    fontSize: 13.5,
    lineHeight: 1,
    color: "var(--foreground)",
  };

  return (
    <div className="gov" style={{ position: "relative", overflow: "hidden" }}>
      <div aria-hidden="true" className="gov-panel" style={{ position: "absolute", top: -90, left: -70, width: 300, height: 300, borderRadius: "50%" }} />
      <div aria-hidden="true" className="gov-well" style={{ position: "absolute", bottom: -120, right: -60, width: 340, height: 340, borderRadius: "50%" }} />
      <div aria-hidden="true" className="gov-raised-sm" style={{ position: "absolute", top: "22%", right: "14%", width: 88, height: 88, borderRadius: "50%" }} />
      <div aria-hidden="true" className="gov-well-sm" style={{ position: "absolute", bottom: "18%", left: "12%", width: 52, height: 52, borderRadius: "50%" }} />

      <div style={{ position: "absolute", top: 26, right: 48 }}>
        <ThemeToggle />
      </div>

      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", position: "relative" }}>
        <div className="gov-panel" style={{ width: 410, padding: "38px 40px 34px", borderRadius: 28 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div aria-hidden="true" className="gov-raised-sm" style={{ width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="gov-well-sm" style={{ width: 22, height: 22, borderRadius: "50%" }} />
            </div>
            <div className="gov-disp" style={{ fontWeight: 800, fontSize: 24, lineHeight: 1, letterSpacing: "-0.01em", marginTop: 16 }}>{GOV_COPY["brand.nama"]}</div>
            <div style={{ fontWeight: 600, fontSize: 9.5, lineHeight: 1.5, letterSpacing: "0.15em", color: "var(--muted-foreground)", marginTop: 7 }}>{GOV_COPY["brand.subLogin"]}</div>
          </div>

          <form onSubmit={kirim} style={{ marginTop: 28 }}>
            <label htmlFor="gov-email" style={{ display: "block", fontWeight: 700, fontSize: 12, lineHeight: 1, marginBottom: 8 }}>{GOV_COPY["login.email.label"]}</label>
            <input id="gov-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={GOV_COPY["login.email.placeholder"]} className="gov-well" style={inputStyle} />

            <label htmlFor="gov-sandi" style={{ display: "block", fontWeight: 700, fontSize: 12, lineHeight: 1, margin: "18px 0 8px" }}>{GOV_COPY["login.sandi.label"]}</label>
            <input id="gov-sandi" type="password" autoComplete="current-password" value={sandi} onChange={(e) => setSandi(e.target.value)} placeholder={GOV_COPY["login.sandi.placeholder"]} className="gov-well" style={inputStyle} />

            {error ? (
              <div role="alert" className="gov-well-sm" style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, padding: "12px 16px", borderRadius: 14, background: "var(--verdict-merah-surface)" }}>
                <VerdictShape bentuk={BENTUK.merah} size={11} />
                <div style={{ fontWeight: 600, fontSize: 12.5, lineHeight: 1.5, color: "var(--verdict-merah)" }}>{error}</div>
              </div>
            ) : null}

            <button type="submit" aria-disabled={busy} className="gov-primary" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, marginTop: 22, padding: "15px 24px", borderRadius: 999, fontWeight: 700, fontSize: 13.5, lineHeight: 1, opacity: busy ? 0.8 : 1 }}>
              {busy ? <span aria-hidden="true" style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid var(--primary-foreground)", borderTopColor: "transparent", animation: "prm-spin .9s linear infinite", display: "inline-block" }} /> : null}
              {busy ? GOV_COPY["login.btn.memuat"] : GOV_COPY["login.btn"]}
            </button>
          </form>

          <div className="gov-well-sm" style={{ marginTop: 24, padding: "15px 18px", borderRadius: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="gov-disp" style={{ fontWeight: 700, fontSize: 9.5, lineHeight: 1, letterSpacing: "0.13em", color: "var(--muted-foreground)" }}>{GOV_COPY["login.hint.label"]}</div>
              <div style={{ flex: 1 }} />
              <button type="button" onClick={() => { setEmail(GOV_COPY["login.hint.email"]); setSandi(GOV_COPY["login.hint.sandi"]); }} style={{ fontWeight: 700, fontSize: 11.5, lineHeight: 1, color: "var(--primary)" }}>{GOV_COPY["login.hint.aksi"]}</button>
            </div>
            <div className="gov-num" style={{ fontWeight: 600, fontSize: 12, lineHeight: 1.7, marginTop: 8 }}>{GOV_COPY["login.hint.email"]}</div>
            <div className="gov-num" style={{ fontWeight: 600, fontSize: 12, lineHeight: 1.4, color: "var(--muted-foreground)" }}>{GOV_COPY["login.hint.sandi"]}</div>
          </div>
        </div>

        <div style={{ fontWeight: 500, fontSize: 11, lineHeight: 1.6, color: "var(--muted-foreground)", marginTop: 24, textAlign: "center" }}>
          {GOV_COPY["login.footer.baris1"]}
          <br />
          {GOV_COPY["login.footer.baris2"]}
        </div>
      </div>
    </div>
  );
}
