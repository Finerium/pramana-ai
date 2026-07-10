"use client";
import { useState, type CSSProperties } from "react";
import { COPY } from "@/lib/copy";
import { SUBJEK_COPY } from "@/lib/copy/subjek";
import { ThemeToggle } from "./theme";

/**
 * Varian visual login bendahara untuk konsol subjek. Layout dua panel
 * (split-screen): kiri editorial (framing) + kanan form dengan tab Masuk/Daftar.
 * TANPA rute sendiri: dipasang oleh halaman /login modul d saat integrasi
 * [F-09]. Props beku. Auth nyata via onSubmit; tab Daftar hanya mock klien
 * (validasi + sukses inline, tanpa backend). Membawa <style> scoped sendiri
 * agar tampil benar di mana pun dipasang (butuh token subjek.css pada inang).
 */
export type LoginVariantProps = {
  onSubmit: (email: string, password: string) => void;
  busy: boolean;
  error: string | null;
};

const SANS = "var(--font-sans)";
const MONO = "var(--font-mono)";

// ponytail: cermin SEED_SALDO (Rp 36.500.000, data seed nyata). Angka statik,
// bukan hitung ulang di klien; konsol nyata membaca saldo dari server.
const SALDO = "Rp 36.500.000";

const LEFT_PCT = "55%";
const RIGHT_PCT = "45%";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SCOPED_CSS = `
@keyframes subjekLoginSpin { to { transform: rotate(360deg); } }
.subjek-login-root .spin { animation: subjekLoginSpin .7s linear infinite; }
.subjek-login-root input:focus-visible, .subjek-login-root select:focus-visible, .subjek-login-root button:focus-visible { outline: 2px solid var(--color-ring); outline-offset: 2px; }
.subjek-login-root ::placeholder { color: var(--color-faint); opacity: 1; }
.subjek-login-root select option { color: var(--color-ink-strong); background: var(--color-surface); }
@media (max-width: 859px) {
  .subjek-login-root .sl-row { flex-direction: column; }
  .subjek-login-root .sl-left { flex-basis: auto; }
  .subjek-login-root .sl-left-inner { min-height: 0; justify-content: flex-start; padding: 40px 32px; gap: 20px; }
  .subjek-login-root .sl-right { flex-basis: auto; }
  .subjek-login-root .sl-hide-sm { display: none; }
}
@media (max-width: 560px) {
  .subjek-login-root .sl-left-inner { padding: 32px 22px; }
  .subjek-login-root .sl-right-inner { padding: 32px 22px; }
  .subjek-login-root .sl-reg-grid { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .subjek-login-root .spin { animation: none; }
  .subjek-login-root * { transition: none !important; }
}
`;

const S: Record<string, CSSProperties> = {
  root: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    background: "var(--color-bg)",
    color: "var(--color-ink)",
    fontFamily: SANS,
  },
  topRule: { height: "3px", background: "var(--color-primary)", flex: "none" },
  row: { display: "flex", flex: "1 1 auto", minHeight: 0 },

  // ---- Panel kiri: editorial ledger ----
  left: {
    flexBasis: LEFT_PCT,
    flexGrow: 0,
    flexShrink: 1,
    minWidth: 0,
    position: "relative",
    overflow: "hidden",
    background:
      "radial-gradient(130% 90% at 100% 0%, color-mix(in oklab, var(--color-primary) 12%, transparent), transparent 58%), repeating-linear-gradient(var(--color-border) 0 1px, transparent 1px 36px), var(--color-surface-sunken)",
  },
  leftInner: {
    position: "relative",
    zIndex: 1,
    minHeight: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "32px",
    padding: "64px 60px",
  },
  brandRow: { display: "flex", alignItems: "center", gap: "11px" },
  emblem: {
    width: "26px",
    height: "26px",
    borderRadius: "7px",
    overflow: "hidden",
    border: "1px solid var(--color-border-strong)",
    flex: "none",
    display: "flex",
    flexDirection: "column",
  },
  emblemRed: { height: "50%", background: "var(--color-primary)" },
  emblemWhite: { height: "50%", background: "var(--color-surface)" },
  brandName: {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--color-muted)",
    letterSpacing: "0.01em",
  },
  kicker: {
    fontFamily: MONO,
    fontSize: "11.5px",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "var(--color-primary)",
    marginBottom: "20px",
  },
  headline: {
    fontSize: "40px",
    lineHeight: 1.12,
    fontWeight: 700,
    letterSpacing: "-0.025em",
    color: "var(--color-ink-strong)",
    margin: "0 0 20px",
    maxWidth: "16ch",
  },
  lead: {
    fontSize: "16px",
    lineHeight: 1.6,
    color: "var(--color-muted)",
    margin: 0,
    maxWidth: "46ch",
  },
  steps: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    maxWidth: "44ch",
  },
  step: { display: "flex", alignItems: "flex-start", gap: "13px" },
  stepNum: {
    flex: "none",
    width: "24px",
    height: "24px",
    borderRadius: "7px",
    background: "var(--color-primary-soft)",
    color: "var(--color-on-primary-soft)",
    fontFamily: MONO,
    fontSize: "12px",
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "1px",
  },
  stepText: { fontSize: "14.5px", lineHeight: 1.5, color: "var(--color-ink)" },
  ledgerCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px",
    flexWrap: "wrap",
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "14px",
    padding: "16px 20px",
    boxShadow:
      "0 1px 2px color-mix(in oklab, var(--color-ink) 4%, transparent)",
  },
  ledgerLeft: { display: "flex", flexDirection: "column", gap: "4px" },
  ledgerLabel: {
    fontFamily: MONO,
    fontSize: "10px",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--color-muted)",
  },
  ledgerVal: {
    fontFamily: MONO,
    fontWeight: 600,
    fontSize: "26px",
    color: "var(--color-ink-strong)",
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "-0.01em",
    lineHeight: 1.05,
  },
  ledgerSync: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--color-on-sync-soft)",
    background: "var(--color-sync-soft)",
    borderRadius: "999px",
    padding: "7px 13px",
    whiteSpace: "nowrap",
  },
  ledgerDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "var(--color-sync)",
  },

  // ---- Panel kanan: form ----
  right: {
    flexBasis: RIGHT_PCT,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    background: "var(--color-bg)",
    borderLeft: "1px solid var(--color-border)",
  },
  rightInner: {
    width: "100%",
    maxWidth: "472px",
    margin: "0 auto",
    padding: "40px 44px",
    display: "flex",
    flexDirection: "column",
    flex: "1 1 auto",
  },
  themeRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "24px",
  },
  miniMark: {
    fontSize: "10.5px",
    fontWeight: 600,
    color: "var(--color-on-primary-soft)",
    background: "var(--color-primary-soft)",
    borderRadius: "999px",
    padding: "4px 11px",
    letterSpacing: "0.02em",
  },
  formCard: {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "18px",
    padding: "28px",
    boxShadow:
      "0 12px 40px color-mix(in oklab, var(--color-ink) 6%, transparent)",
  },
  tabs: {
    display: "flex",
    gap: "4px",
    background: "var(--color-surface-sunken)",
    border: "1px solid var(--color-border)",
    borderRadius: "12px",
    padding: "4px",
    marginBottom: "24px",
  },
  formTitle: {
    fontSize: "21px",
    fontWeight: 700,
    color: "var(--color-ink-strong)",
    letterSpacing: "-0.02em",
    marginBottom: "5px",
  },
  formSub: {
    fontSize: "13.5px",
    color: "var(--color-muted)",
    lineHeight: 1.5,
    marginBottom: "22px",
  },
  field: { display: "flex", flexDirection: "column", gap: "7px" },
  fieldMt: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    marginTop: "16px",
  },
  fieldFull: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    gridColumn: "1 / -1",
  },
  regGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--color-ink)",
    display: "flex",
    gap: "6px",
    alignItems: "baseline",
  },
  reqMark: {
    fontSize: "10px",
    fontWeight: 600,
    color: "var(--color-on-primary-soft)",
    background: "var(--color-primary-soft)",
    borderRadius: "4px",
    padding: "1px 6px",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  selWrap: { position: "relative" },
  chev: {
    position: "absolute",
    right: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    color: "var(--color-muted)",
    fontSize: "11px",
  },
  errText: {
    fontSize: "12px",
    color: "var(--color-danger)",
    fontWeight: 500,
    display: "flex",
    gap: "7px",
    alignItems: "flex-start",
    lineHeight: 1.4,
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
    marginTop: "1px",
  },
  okIcon: {
    flex: "none",
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    background: "var(--color-sync)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "1px",
  },
  okCheck: {
    width: "4px",
    height: "8px",
    borderStyle: "solid",
    borderColor: "var(--color-on-primary)",
    borderWidth: "0 2px 2px 0",
    transform: "rotate(45deg)",
    marginTop: "-2px",
    display: "inline-block",
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
  successBox: {
    display: "flex",
    gap: "10px",
    alignItems: "flex-start",
    background: "var(--color-sync-soft)",
    border: "1px solid var(--color-sync)",
    borderRadius: "10px",
    padding: "12px 14px",
    fontSize: "13px",
    color: "var(--color-on-sync-soft)",
    marginBottom: "18px",
    lineHeight: 1.45,
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
    marginTop: "22px",
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
    border:
      "2px solid color-mix(in oklab, var(--color-on-primary) 40%, transparent)",
    borderTopColor: "var(--color-on-primary)",
    display: "inline-block",
  },
  footNote: {
    fontSize: "11.5px",
    color: "var(--color-faint)",
    lineHeight: 1.55,
    marginTop: "22px",
    textAlign: "center",
    maxWidth: "46ch",
    marginLeft: "auto",
    marginRight: "auto",
  },
};

const inputBase: CSSProperties = {
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
};
const inputErr: CSSProperties = {
  borderColor: "var(--color-danger)",
  background: "var(--color-danger-soft)",
};
const selectBase: CSSProperties = {
  ...inputBase,
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
  paddingRight: "38px",
  cursor: "pointer",
};

const inputStyle = (err?: string): CSSProperties =>
  err ? { ...inputBase, ...inputErr } : inputBase;
const selectStyle = (err?: string): CSSProperties =>
  err ? { ...selectBase, ...inputErr } : selectBase;
const tabStyle = (active: boolean): CSSProperties => ({
  flex: 1,
  fontFamily: SANS,
  fontSize: "14px",
  fontWeight: 600,
  padding: "11px 14px",
  minHeight: "44px",
  borderRadius: "9px",
  border: "none",
  cursor: "pointer",
  background: active ? "var(--color-surface)" : "transparent",
  color: active ? "var(--color-ink-strong)" : "var(--color-muted)",
  boxShadow: active
    ? "0 1px 2px color-mix(in oklab, var(--color-ink) 8%, transparent)"
    : "none",
  transition: "color .15s ease, background .15s ease",
});

type RegState = {
  nama: string;
  koperasi: string;
  email: string;
  jabatan: string;
  password: string;
  konfirmasi: string;
};
type RegErrors = Partial<Record<keyof RegState, string>>;

const EMPTY_REG: RegState = {
  nama: "",
  koperasi: "",
  email: "",
  jabatan: "",
  password: "",
  konfirmasi: "",
};

function validateReg(
  v: RegState,
  msg: (typeof SUBJEK_COPY.login.daftar)["validasi"],
): RegErrors {
  const e: RegErrors = {};
  if (!v.nama.trim()) e.nama = msg.nama;
  if (!v.koperasi.trim()) e.koperasi = msg.koperasi;
  if (!emailRe.test(v.email)) e.email = msg.email;
  if (!v.jabatan) e.jabatan = msg.jabatan;
  if (v.password.length < 8) e.password = msg.sandi;
  if (v.konfirmasi !== v.password || !v.konfirmasi)
    e.konfirmasi = msg.konfirmasi;
  return e;
}

function FieldErr({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <div style={S.errText}>
      <span style={S.errIcon}>!</span>
      {text}
    </div>
  );
}

export function LoginVariant({ onSubmit, busy, error }: LoginVariantProps) {
  const c = SUBJEK_COPY.login;
  const D = c.daftar;

  const [tab, setTab] = useState<"masuk" | "daftar">("masuk");

  // Masuk: auth nyata via onSubmit (tanpa validasi klien; parent yang otentikasi).
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Daftar: mock klien saja (validasi + sukses inline, tanpa fetch).
  const [reg, setReg] = useState<RegState>(EMPTY_REG);
  const [regErr, setRegErr] = useState<RegErrors>({});
  const [regOk, setRegOk] = useState(false);

  const chgReg =
    (k: keyof RegState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const val = e.target.value;
      setReg((r) => ({ ...r, [k]: val }));
      setRegErr((er) => {
        const n = { ...er };
        delete n[k];
        return n;
      });
      setRegOk(false);
    };

  const submitMasuk = (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    onSubmit(email.trim(), password);
  };

  const submitDaftar = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateReg(reg, D.validasi);
    setRegErr(errs);
    if (Object.keys(errs).length === 0) {
      setRegOk(true);
      setReg(EMPTY_REG);
    } else {
      setRegOk(false);
    }
  };

  return (
    <div className="subjek-login-root" style={S.root}>
      <style>{SCOPED_CSS}</style>
      <div style={S.topRule} />

      <div className="sl-row" style={S.row}>
        {/* ============ KIRI: editorial ledger ============ */}
        <div className="sl-left" style={S.left}>
          <div className="sl-left-inner" style={S.leftInner}>
            <div style={S.brandRow}>
              <div style={S.emblem} aria-hidden="true">
                <div style={S.emblemRed} />
                <div style={S.emblemWhite} />
              </div>
              <span style={S.brandName}>{SUBJEK_COPY.header.koperasi}</span>
            </div>

            <div>
              <div style={S.kicker}>{c.kicker}</div>
              <h1 style={S.headline}>{c.left.headline}</h1>
              <p style={S.lead}>{c.left.lead}</p>
            </div>

            <div className="sl-hide-sm" style={S.steps}>
              {c.left.langkah.map((t, i) => (
                <div key={i} style={S.step}>
                  <span style={S.stepNum}>{i + 1}</span>
                  <span style={S.stepText}>{t}</span>
                </div>
              ))}
            </div>

            <div className="sl-hide-sm" style={S.ledgerCard}>
              <div style={S.ledgerLeft}>
                <div style={S.ledgerLabel}>{c.left.saldoLabel}</div>
                <div style={S.ledgerVal}>{SALDO}</div>
              </div>
              <div style={S.ledgerSync}>
                <span style={S.ledgerDot} />
                {c.left.tersinkron}
              </div>
            </div>
          </div>
        </div>

        {/* ============ KANAN: form ============ */}
        <div className="sl-right" style={S.right}>
          <div className="sl-right-inner" style={S.rightInner}>
            <div style={S.themeRow}>
              <span style={S.miniMark}>{SUBJEK_COPY.header.simTag}</span>
              <ThemeToggle />
            </div>

            <div style={S.formCard}>
              <div style={S.tabs} role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "masuk"}
                  style={tabStyle(tab === "masuk")}
                  onClick={() => setTab("masuk")}
                >
                  {c.tab.masuk}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "daftar"}
                  style={tabStyle(tab === "daftar")}
                  onClick={() => setTab("daftar")}
                >
                  {c.tab.daftar}
                </button>
              </div>

              {tab === "masuk" ? (
                <form onSubmit={submitMasuk}>
                  <div style={S.formTitle}>{c.judul}</div>
                  <div style={S.formSub}>{c.sub}</div>

                  {error ? (
                    <div style={S.errBox} role="alert">
                      <span style={S.errIcon}>!</span>
                      <span>{error}</span>
                    </div>
                  ) : null}

                  <div style={S.field}>
                    <label style={S.label} htmlFor="subjek-email">
                      {c.lEmail}
                    </label>
                    <input
                      id="subjek-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={c.phEmail}
                      style={inputBase}
                      autoComplete="username"
                      inputMode="email"
                    />
                  </div>

                  <div style={S.fieldMt}>
                    <label style={S.label} htmlFor="subjek-sandi">
                      {c.lSandi}
                    </label>
                    <input
                      id="subjek-sandi"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={c.phSandi}
                      style={inputBase}
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

                  <button type="submit" style={S.btnBlock} disabled={busy}>
                    {busy ? <span className="spin" style={S.spinner} /> : null}
                    {busy ? c.memuat : c.masuk}
                  </button>
                </form>
              ) : (
                <form onSubmit={submitDaftar} noValidate>
                  <div style={S.formTitle}>{D.judul}</div>
                  <div style={S.formSub}>{D.sub}</div>

                  {regOk ? (
                    <div style={S.successBox} role="status">
                      <span style={S.okIcon}>
                        <span style={S.okCheck} />
                      </span>
                      <span>{D.sukses}</span>
                    </div>
                  ) : null}

                  <div className="sl-reg-grid" style={S.regGrid}>
                    <div style={S.field}>
                      <label style={S.label} htmlFor="reg-nama">
                        {D.lNama}
                        <span style={S.reqMark}>{SUBJEK_COPY.reqMark}</span>
                      </label>
                      <input
                        id="reg-nama"
                        value={reg.nama}
                        onChange={chgReg("nama")}
                        placeholder={D.phNama}
                        style={inputStyle(regErr.nama)}
                        autoComplete="name"
                      />
                      <FieldErr text={regErr.nama} />
                    </div>

                    <div style={S.field}>
                      <label style={S.label} htmlFor="reg-koperasi">
                        {D.lKoperasi}
                        <span style={S.reqMark}>{SUBJEK_COPY.reqMark}</span>
                      </label>
                      <input
                        id="reg-koperasi"
                        value={reg.koperasi}
                        onChange={chgReg("koperasi")}
                        placeholder={D.phKoperasi}
                        style={inputStyle(regErr.koperasi)}
                      />
                      <FieldErr text={regErr.koperasi} />
                    </div>

                    <div style={S.fieldFull}>
                      <label style={S.label} htmlFor="reg-email">
                        {D.lEmail}
                        <span style={S.reqMark}>{SUBJEK_COPY.reqMark}</span>
                      </label>
                      <input
                        id="reg-email"
                        value={reg.email}
                        onChange={chgReg("email")}
                        placeholder={D.phEmail}
                        style={inputStyle(regErr.email)}
                        autoComplete="email"
                        inputMode="email"
                      />
                      <FieldErr text={regErr.email} />
                    </div>

                    <div style={S.fieldFull}>
                      <label style={S.label} htmlFor="reg-jabatan">
                        {D.lJabatan}
                        <span style={S.reqMark}>{SUBJEK_COPY.reqMark}</span>
                      </label>
                      <div style={S.selWrap}>
                        <select
                          id="reg-jabatan"
                          value={reg.jabatan}
                          onChange={chgReg("jabatan")}
                          style={selectStyle(regErr.jabatan)}
                        >
                          {SUBJEK_COPY.opsi.jabatan.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                        <span style={S.chev} aria-hidden="true">
                          &#9662;
                        </span>
                      </div>
                      <FieldErr text={regErr.jabatan} />
                    </div>

                    <div style={S.field}>
                      <label style={S.label} htmlFor="reg-sandi">
                        {D.lSandi}
                        <span style={S.reqMark}>{SUBJEK_COPY.reqMark}</span>
                      </label>
                      <input
                        id="reg-sandi"
                        type="password"
                        value={reg.password}
                        onChange={chgReg("password")}
                        placeholder={D.phSandi}
                        style={inputStyle(regErr.password)}
                        autoComplete="new-password"
                      />
                      <FieldErr text={regErr.password} />
                    </div>

                    <div style={S.field}>
                      <label style={S.label} htmlFor="reg-konfirmasi">
                        {D.lKonfirmasi}
                        <span style={S.reqMark}>{SUBJEK_COPY.reqMark}</span>
                      </label>
                      <input
                        id="reg-konfirmasi"
                        type="password"
                        value={reg.konfirmasi}
                        onChange={chgReg("konfirmasi")}
                        placeholder={D.phKonfirmasi}
                        style={inputStyle(regErr.konfirmasi)}
                        autoComplete="new-password"
                      />
                      <FieldErr text={regErr.konfirmasi} />
                    </div>
                  </div>

                  <button type="submit" style={S.btnBlock}>
                    {D.daftar}
                  </button>
                </form>
              )}
            </div>

            <div style={S.footNote}>{c.foot}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
