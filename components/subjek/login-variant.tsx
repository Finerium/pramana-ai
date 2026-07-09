"use client";
import { useState, type CSSProperties } from "react";
import { COPY } from "@/lib/copy";
import { SUBJEK_COPY } from "@/lib/copy/subjek";
import { ThemeToggle } from "./theme";

/**
 * Varian visual login bendahara untuk konsol subjek. TANPA rute sendiri:
 * dipasang oleh halaman /login modul d saat integrasi [F-09]. Props beku.
 * Membawa <style> scoped sendiri agar tampil benar di mana pun dipasang
 * (butuh token subjek.css hadir pada halaman inang).
 */
export type LoginVariantProps = {
  onSubmit: (email: string, password: string) => void;
  busy: boolean;
  error: string | null;
};

const SANS = "var(--font-sans)";
const MONO = "var(--font-mono)";

const SCOPED_CSS = `
@keyframes subjekLoginSpin { to { transform: rotate(360deg); } }
.subjek-login-root .spin { animation: subjekLoginSpin .7s linear infinite; }
.subjek-login-root input:focus-visible, .subjek-login-root button:focus-visible { outline: 2px solid var(--color-ring); outline-offset: 2px; }
.subjek-login-root ::placeholder { color: var(--color-faint); opacity: 1; }
@media (prefers-reduced-motion: reduce) { .subjek-login-root .spin { animation: none; } .subjek-login-root * { transition: none !important; } }
`;

const S: Record<string, CSSProperties> = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    position: "relative",
    background: "var(--color-bg)",
    color: "var(--color-ink)",
    fontFamily: SANS,
  },
  topBar: {
    position: "absolute",
    top: "24px",
    left: 0,
    right: 0,
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 32px",
  },
  emblem: {
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid var(--color-border-strong)",
    flex: "none",
    display: "flex",
    flexDirection: "column",
  },
  emblemRed: { height: "50%", background: "var(--color-primary)" },
  emblemWhite: { height: "50%", background: "var(--color-surface)" },
  card: {
    width: "100%",
    maxWidth: "440px",
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "18px",
    overflow: "hidden",
    boxShadow: "0 16px 48px rgba(0,0,0,0.1)",
  },
  cardTop: { height: "4px", background: "var(--color-primary)" },
  body: { padding: "34px 34px 32px" },
  kicker: {
    fontFamily: MONO,
    fontSize: "11px",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--color-on-primary-soft)",
    marginBottom: "10px",
  },
  title: {
    fontSize: "24px",
    fontWeight: 700,
    color: "var(--color-ink-strong)",
    letterSpacing: "-0.02em",
    marginBottom: "6px",
  },
  sub: {
    fontSize: "13.5px",
    color: "var(--color-muted)",
    lineHeight: 1.5,
    marginBottom: "22px",
  },
  errBox: {
    display: "flex",
    gap: "10px",
    alignItems: "flex-start",
    background: "var(--color-danger-soft)",
    border: "1px solid var(--color-danger)",
    borderRadius: "10px",
    padding: "12px 14px",
    fontSize: "13px",
    color: "var(--color-danger)",
    marginBottom: "18px",
    lineHeight: 1.45,
  },
  errIcon: {
    flex: "none",
    width: "15px",
    height: "15px",
    borderRadius: "50%",
    background: "var(--color-danger)",
    color: "var(--color-on-primary)",
    fontSize: "11px",
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
  },
  field: { display: "flex", flexDirection: "column", gap: "7px" },
  fieldMt: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    marginTop: "16px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--color-ink)",
  },
  input: {
    width: "100%",
    minHeight: "46px",
    boxSizing: "border-box",
    fontFamily: SANS,
    fontSize: "15px",
    color: "var(--color-ink-strong)",
    background: "var(--color-surface-sunken)",
    border: "1px solid var(--color-border-strong)",
    borderRadius: "10px",
    padding: "11px 14px",
    outline: "none",
  },
  hintBox: {
    background: "var(--color-surface-sunken)",
    border: "1px solid var(--color-border)",
    borderRadius: "12px",
    padding: "15px 16px",
    marginTop: "20px",
    marginBottom: "22px",
  },
  hintLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12.5px",
    fontWeight: 600,
    color: "var(--color-ink)",
  },
  hintDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "var(--color-primary)",
  },
  hintCred: {
    fontFamily: MONO,
    fontSize: "12.5px",
    color: "var(--color-muted)",
    marginTop: "9px",
    lineHeight: 1.7,
  },
  hintBtn: {
    marginTop: "12px",
    minHeight: "38px",
    padding: "0 14px",
    borderRadius: "8px",
    border: "1px solid var(--color-border-strong)",
    background: "var(--color-surface)",
    color: "var(--color-ink)",
    cursor: "pointer",
    fontSize: "12.5px",
    fontWeight: 600,
    fontFamily: SANS,
  },
  btnBlock: {
    width: "100%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    minHeight: "48px",
    fontFamily: SANS,
    fontSize: "15px",
    fontWeight: 600,
    color: "var(--color-on-primary)",
    background: "var(--color-primary)",
    border: "none",
    borderRadius: "11px",
    cursor: "pointer",
  },
  spinner: {
    width: "15px",
    height: "15px",
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.4)",
    borderTopColor: "var(--color-on-primary)",
    display: "inline-block",
  },
  foot: { fontSize: "12px", color: "var(--color-faint)", marginTop: "22px" },
};

export function LoginVariant({ onSubmit, busy, error }: LoginVariantProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const c = SUBJEK_COPY.login;

  return (
    <div className="subjek-login-root" style={S.wrap}>
      <style>{SCOPED_CSS}</style>
      <div style={S.topBar}>
        <div style={S.emblem}>
          <div style={S.emblemRed} />
          <div style={S.emblemWhite} />
        </div>
        <ThemeToggle />
      </div>

      <div style={S.card}>
        <div style={S.cardTop} />
        <div style={S.body}>
          <div style={S.kicker}>{c.kicker}</div>
          <div style={S.title}>{c.judul}</div>
          <div style={S.sub}>{c.sub}</div>

          {error && (
            <div style={S.errBox}>
              <span style={S.errIcon}>!</span>
              <span>{error}</span>
            </div>
          )}

          <div style={S.field}>
            <label style={S.label}>{c.lEmail}</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={c.phEmail}
              style={
                error
                  ? {
                      ...S.input,
                      borderColor: "var(--color-danger)",
                      background: "var(--color-danger-soft)",
                    }
                  : S.input
              }
              autoComplete="username"
            />
          </div>
          <div style={S.fieldMt}>
            <label style={S.label}>{c.lSandi}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={c.phSandi}
              style={
                error
                  ? {
                      ...S.input,
                      borderColor: "var(--color-danger)",
                      background: "var(--color-danger-soft)",
                    }
                  : S.input
              }
              autoComplete="current-password"
            />
          </div>

          <div style={S.hintBox}>
            <div style={S.hintLabel}>
              <span style={S.hintDot} />
              {COPY["subjek.login.hint"]}
            </div>
            <div style={S.hintCred}>
              {c.kredEmail}
              <br />
              {c.kredSandi}
            </div>
            <button
              type="button"
              style={S.hintBtn}
              onClick={() => {
                setEmail(c.kredEmail);
                setPassword(c.kredSandi);
              }}
            >
              {c.isiOtomatis}
            </button>
          </div>

          <button
            type="button"
            style={S.btnBlock}
            onClick={() => onSubmit(email, password)}
            disabled={busy}
          >
            {busy && <span className="spin" style={S.spinner} />}
            {c.masuk}
          </button>
        </div>
      </div>
      <div style={S.foot}>{c.foot}</div>
    </div>
  );
}
