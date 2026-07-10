"use client";
import { useRef, useState } from "react";
import "@/styles/tokens/dashboard.css";
import { GOV_COPY } from "@/lib/copy/gov";
import { BENTUK } from "@/app/(gov)/_logic/verdict";
import { VerdictShape } from "./VerdictShape";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Varian visual login dasbor pemerintah (bundle dashboard), layout DUA PANEL
 * split-screen. Tanpa rute sendiri; halaman /login (unit d) memasangnya dan
 * menyediakan onSubmit/busy/error nyata (F-09). Props BEKU. Root membawa kelas
 * `.gov` agar token + font mandiri. Panel kiri SELALU gelap (token --brand-*
 * :root); panel kanan ikut tema. Di bawah 900px stack: panel kiri jadi header
 * ringkas, konten berat disembunyikan, form turun ke bawah.
 */

// ponytail: cermin ringkasan overview seed Juni 2026; upgrade ke prop server
// bila login butuh angka live.
const RINGKASAN = { koperasi: 12, temuan: 17, hijau: 6, kuning: 4, merah: 2 };
const basis = (n: number) =>
  `0 0 ${((n / RINGKASAN.koperasi) * 100).toFixed(1)}%`;

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
  const [lihatSandi, setLihatSandi] = useState(false);
  const [ingat, setIngat] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const kirim = (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    onSubmit(email.trim(), sandi);
  };

  const isiOtomatis = () => {
    setEmail(GOV_COPY["login.hint.email"]);
    setSandi(GOV_COPY["login.hint.sandi"]);
  };

  const lupaSandi = () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(GOV_COPY["login.lupa.toast"]);
    // ponytail: setTimeout tanpa cleanup unmount; setState pasca-unmount no-op di
    // React 19, dan login jarang di-unmount saat toast tampil.
    toastTimer.current = setTimeout(() => setToast(null), 3600);
  };

  const inputBase: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: 999,
    fontWeight: 500,
    fontSize: 13.5,
    lineHeight: 1,
    color: "var(--foreground)",
    opacity: busy ? 0.6 : 1,
  };

  const kicker = (extra: React.CSSProperties): React.CSSProperties => ({
    fontWeight: 700,
    lineHeight: 1,
    color: "var(--brand-muted)",
    textTransform: "uppercase",
    ...extra,
  });

  const pilarSurface: React.CSSProperties = {
    flex: 1,
    padding: "13px 16px",
    borderRadius: 16,
    background: "var(--brand-surface)",
    borderTop: "1px solid var(--brand-edge-top)",
    boxShadow: "var(--brand-shadow-raised-sm)",
  };

  const pilar = (judul: string, sub: string) => (
    <div style={pilarSurface}>
      <div
        className="gov-disp"
        style={{
          fontWeight: 700,
          fontSize: 13,
          lineHeight: 1,
          color: "var(--brand-ink)",
        }}
      >
        {judul}
      </div>
      <div
        style={{
          fontWeight: 500,
          fontSize: 10.5,
          lineHeight: 1.4,
          color: "var(--brand-muted)",
          marginTop: 5,
        }}
      >
        {sub}
      </div>
    </div>
  );

  const angka = (nilai: number, label: string) => (
    <div>
      <div
        className="gov-num"
        style={{
          fontWeight: 700,
          fontSize: 34,
          lineHeight: 1,
          color: "var(--brand-ink)",
        }}
      >
        {nilai}
      </div>
      <div
        style={{
          fontWeight: 500,
          fontSize: 10.5,
          lineHeight: 1.4,
          color: "var(--brand-muted)",
          marginTop: 5,
        }}
      >
        {label}
      </div>
    </div>
  );

  const legendItem = (
    shape: React.CSSProperties,
    nilai: number,
    warna: string,
  ) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span aria-hidden="true" style={{ ...shape, background: warna }} />
      <span
        className="gov-num"
        style={{
          fontWeight: 700,
          fontSize: 10,
          lineHeight: 1,
          color: "var(--brand-muted)",
        }}
      >
        {nilai}
      </span>
    </span>
  );

  return (
    <div className="gov gov-login">
      {/* ===================== PANEL KIRI (selalu gelap) ===================== */}
      <section aria-label="Tentang Pramana" className="gov-login-aside">
        <div aria-hidden="true" className="gov-login-heavy">
          <div
            style={{
              position: "absolute",
              top: -120,
              left: -90,
              width: 360,
              height: 360,
              borderRadius: "50%",
              background: "var(--brand-surface)",
              boxShadow: "var(--brand-shadow-raised)",
              borderTop: "1px solid var(--brand-edge-top)",
              animation: "prm-napas 9s ease-in-out infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -140,
              right: -70,
              width: 420,
              height: 420,
              borderRadius: "50%",
              background: "var(--brand-well)",
              boxShadow: "var(--brand-shadow-pressed)",
              borderBottom: "1px solid var(--brand-edge-well)",
              animation: "prm-napas 12s ease-in-out 1.4s infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "30%",
              right: "16%",
              width: 96,
              height: 96,
              borderRadius: "50%",
              background: "var(--brand-surface)",
              boxShadow: "var(--brand-shadow-raised-sm)",
              borderTop: "1px solid var(--brand-edge-top)",
              animation: "prm-napas 7.5s ease-in-out .7s infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "16%",
              left: "9%",
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--brand-well)",
              boxShadow: "var(--brand-shadow-pressed)",
              borderBottom: "1px solid var(--brand-edge-well)",
              animation: "prm-napas 8.5s ease-in-out 2s infinite",
            }}
          />
        </div>

        {/* Lockup (selalu tampil, header ringkas saat stack) */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            gap: 15,
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: 46,
              height: 46,
              borderRadius: "50%",
              background: "var(--brand-surface)",
              borderTop: "1px solid var(--brand-edge-top)",
              boxShadow: "var(--brand-shadow-raised-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "none",
            }}
          >
            <div
              style={{
                width: 17,
                height: 17,
                borderRadius: "50%",
                background: "var(--brand-well)",
                boxShadow: "var(--brand-shadow-pressed)",
                borderBottom: "1px solid var(--brand-edge-well)",
              }}
            />
          </div>
          <div>
            <div
              className="gov-disp"
              style={{
                fontWeight: 800,
                fontSize: 20,
                lineHeight: 1,
                letterSpacing: "-0.01em",
                color: "var(--brand-ink)",
              }}
            >
              {GOV_COPY["brand.nama"]}
            </div>
            <div
              style={{
                fontWeight: 600,
                fontSize: 9.5,
                lineHeight: 1,
                letterSpacing: "0.15em",
                color: "var(--brand-muted)",
                marginTop: 6,
              }}
            >
              {GOV_COPY["brand.subLogin"]}
            </div>
          </div>
        </div>

        {/* Konten berat: lencana, headline, paragraf, kartu ringkasan */}
        <div
          className="gov-login-heavy"
          style={{
            position: "relative",
            zIndex: 1,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            maxWidth: 560,
            padding: "36px 0",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              alignSelf: "flex-start",
              padding: "8px 15px",
              borderRadius: 999,
              background: "var(--brand-well)",
              boxShadow: "var(--brand-shadow-pressed)",
              borderBottom: "1px solid var(--brand-edge-well)",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--brand-accent)",
                flex: "none",
              }}
            />
            <span
              className="gov-disp"
              style={kicker({ fontSize: 10, letterSpacing: "0.13em" })}
            >
              {GOV_COPY["login.lencana"]}
            </span>
          </div>

          <h1
            className="gov-disp"
            style={{
              fontWeight: 800,
              fontSize: 41,
              lineHeight: 1.16,
              letterSpacing: "-0.015em",
              margin: "22px 0 0",
              color: "var(--brand-ink)",
            }}
          >
            {GOV_COPY["login.headline"]}
          </h1>

          <p
            style={{
              fontWeight: 400,
              fontSize: 15,
              lineHeight: 1.7,
              color: "var(--brand-muted)",
              margin: "20px 0 0",
              maxWidth: 480,
            }}
          >
            {GOV_COPY["login.paragraf"]}
          </p>

          <div
            style={{
              marginTop: 32,
              padding: "22px 24px",
              borderRadius: 22,
              background: "var(--brand-surface)",
              borderTop: "1px solid var(--brand-edge-top)",
              boxShadow: "var(--brand-shadow-raised)",
              maxWidth: 440,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                className="gov-disp"
                style={kicker({ fontSize: 9.5, letterSpacing: "0.14em" })}
              >
                {GOV_COPY["login.ringkasan.judul"]}
              </div>
              <div style={{ flex: 1 }} />
              <span
                aria-hidden="true"
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "var(--brand-accent)",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 26, marginTop: 16 }}>
              {angka(RINGKASAN.koperasi, GOV_COPY["login.ringkasan.koperasi"])}
              <div style={{ width: 1, background: "var(--brand-edge-well)" }} />
              {angka(RINGKASAN.temuan, GOV_COPY["login.ringkasan.temuan"])}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div
                  role="img"
                  aria-label={GOV_COPY["login.ringkasan.dist"]}
                  style={{
                    display: "flex",
                    height: 26,
                    borderRadius: 999,
                    background: "var(--brand-well)",
                    boxShadow: "var(--brand-shadow-pressed)",
                    padding: 4,
                    gap: 3,
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      flex: basis(RINGKASAN.hijau),
                      borderRadius: 999,
                      background: "var(--brand-verdict-hijau)",
                    }}
                  />
                  <span
                    aria-hidden="true"
                    style={{
                      flex: basis(RINGKASAN.kuning),
                      borderRadius: 999,
                      background: "var(--brand-verdict-kuning)",
                    }}
                  />
                  <span
                    aria-hidden="true"
                    style={{
                      flex: 1,
                      borderRadius: 999,
                      background: "var(--brand-verdict-merah)",
                    }}
                  />
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 9 }}>
                  {legendItem(
                    { width: 8, height: 8, borderRadius: "50%" },
                    RINGKASAN.hijau,
                    "var(--brand-verdict-hijau)",
                  )}
                  {legendItem(
                    { width: 9, height: 8, clipPath: BENTUK.kuning.clip },
                    RINGKASAN.kuning,
                    "var(--brand-verdict-kuning)",
                  )}
                  {legendItem(
                    { width: 8, height: 8, clipPath: BENTUK.merah.clip },
                    RINGKASAN.merah,
                    "var(--brand-verdict-merah)",
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tiga kartu pilar */}
        <div
          className="gov-login-heavy"
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            gap: 10,
          }}
        >
          {pilar(
            GOV_COPY["login.pilar.agen.judul"],
            GOV_COPY["login.pilar.agen.sub"],
          )}
          {pilar(
            GOV_COPY["login.pilar.verdict.judul"],
            GOV_COPY["login.pilar.verdict.sub"],
          )}
          {pilar(
            GOV_COPY["login.pilar.hak.judul"],
            GOV_COPY["login.pilar.hak.sub"],
          )}
        </div>
      </section>

      {/* ===================== PANEL KANAN (ikut tema) ===================== */}
      <section aria-label="Masuk" className="gov-login-main">
        <div style={{ position: "absolute", top: 24, right: 32, zIndex: 10 }}>
          <ThemeToggle />
        </div>

        <div style={{ width: "100%", maxWidth: 372 }}>
          <h2
            className="gov-disp"
            style={{
              fontWeight: 800,
              fontSize: 25,
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
              margin: 0,
            }}
          >
            {GOV_COPY["login.judul"]}
          </h2>
          <p
            style={{
              fontWeight: 500,
              fontSize: 12.5,
              lineHeight: 1.5,
              color: "var(--muted-foreground)",
              margin: "9px 0 0",
            }}
          >
            {GOV_COPY["login.sub"]}
          </p>

          <form onSubmit={kirim} style={{ marginTop: 26 }}>
            <label
              htmlFor="gov-email"
              style={{
                display: "block",
                fontWeight: 700,
                fontSize: 12,
                lineHeight: 1,
                marginBottom: 8,
              }}
            >
              {GOV_COPY["login.email.label"]}
            </label>
            <input
              id="gov-email"
              type="email"
              autoComplete="email"
              value={email}
              readOnly={busy}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={GOV_COPY["login.email.placeholder"]}
              className="gov-well"
              style={{ ...inputBase, padding: "14px 20px" }}
            />

            <label
              htmlFor="gov-sandi"
              style={{
                display: "block",
                fontWeight: 700,
                fontSize: 12,
                lineHeight: 1,
                margin: "18px 0 8px",
              }}
            >
              {GOV_COPY["login.sandi.label"]}
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="gov-sandi"
                type={lihatSandi ? "text" : "password"}
                autoComplete="current-password"
                value={sandi}
                readOnly={busy}
                onChange={(e) => setSandi(e.target.value)}
                placeholder={GOV_COPY["login.sandi.placeholder"]}
                className="gov-well"
                style={{ ...inputBase, padding: "14px 78px 14px 20px" }}
              />
              <button
                type="button"
                onClick={() => setLihatSandi((v) => !v)}
                aria-label={
                  lihatSandi
                    ? GOV_COPY["login.sandi.sembunyiAria"]
                    : GOV_COPY["login.sandi.tampilAria"]
                }
                className="gov-control"
                style={{
                  position: "absolute",
                  top: "50%",
                  right: 8,
                  transform: "translateY(-50%)",
                  padding: "8px 13px",
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: 10.5,
                  lineHeight: 1,
                  color: "var(--muted-foreground)",
                }}
              >
                {lihatSandi
                  ? GOV_COPY["login.sandi.sembunyi"]
                  : GOV_COPY["login.sandi.tampil"]}
              </button>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 16,
              }}
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={ingat}
                onClick={() => setIngat((v) => !v)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span
                  aria-hidden="true"
                  className={ingat ? "gov-raised-sm" : "gov-well-sm"}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 8,
                    flex: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: ingat ? "var(--primary)" : undefined,
                    transition: "background .25s var(--ease-mewah)",
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    style={{
                      opacity: ingat ? 1 : 0,
                      transition: "opacity .2s ease",
                    }}
                  >
                    <polyline
                      points="2,6.5 5,9 10,3"
                      fill="none"
                      stroke="var(--primary-foreground)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 12,
                    lineHeight: 1,
                    color: "var(--foreground)",
                  }}
                >
                  {GOV_COPY["login.ingat"]}
                </span>
              </button>
              <div style={{ flex: 1 }} />
              <button
                type="button"
                onClick={lupaSandi}
                style={{
                  fontWeight: 700,
                  fontSize: 12,
                  lineHeight: 1,
                  color: "var(--primary)",
                }}
              >
                {GOV_COPY["login.lupa"]}
              </button>
            </div>

            {error ? (
              <div
                role="alert"
                className="gov-well-sm"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginTop: 16,
                  padding: "12px 16px",
                  borderRadius: 14,
                  background: "var(--verdict-merah-surface)",
                }}
              >
                <VerdictShape bentuk={BENTUK.merah} size={11} />
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 12.5,
                    lineHeight: 1.5,
                    color: "var(--verdict-merah)",
                  }}
                >
                  {error}
                </div>
              </div>
            ) : null}

            <button
              type="submit"
              aria-disabled={busy}
              className="gov-primary"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 9,
                marginTop: 22,
                padding: "15px 24px",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 13.5,
                lineHeight: 1,
                opacity: busy ? 0.8 : 1,
              }}
            >
              {busy ? (
                <span
                  aria-hidden="true"
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    border: "2px solid var(--primary-foreground)",
                    borderTopColor: "transparent",
                    animation: "prm-spin .9s linear infinite",
                    display: "inline-block",
                  }}
                />
              ) : null}
              {busy ? GOV_COPY["login.btn.memuat"] : GOV_COPY["login.btn"]}
            </button>
          </form>

          <div
            className="gov-well-sm"
            style={{ marginTop: 22, padding: "15px 18px", borderRadius: 16 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                className="gov-disp"
                style={{
                  fontWeight: 700,
                  fontSize: 9.5,
                  lineHeight: 1,
                  letterSpacing: "0.13em",
                  color: "var(--muted-foreground)",
                }}
              >
                {GOV_COPY["login.hint.label"]}
              </div>
              <div style={{ flex: 1 }} />
              <button
                type="button"
                onClick={isiOtomatis}
                style={{
                  fontWeight: 700,
                  fontSize: 11.5,
                  lineHeight: 1,
                  color: "var(--primary)",
                }}
              >
                {GOV_COPY["login.hint.aksi"]}
              </button>
            </div>
            <div
              className="gov-num"
              style={{
                fontWeight: 600,
                fontSize: 12,
                lineHeight: 1.7,
                marginTop: 8,
              }}
            >
              {GOV_COPY["login.hint.email"]}
            </div>
            <div
              className="gov-num"
              style={{
                fontWeight: 600,
                fontSize: 12,
                lineHeight: 1.4,
                color: "var(--muted-foreground)",
              }}
            >
              {GOV_COPY["login.hint.sandi"]}
            </div>
          </div>

          <div
            style={{
              fontWeight: 500,
              fontSize: 11.5,
              lineHeight: 1.6,
              color: "var(--muted-foreground)",
              marginTop: 20,
              textAlign: "center",
            }}
          >
            {GOV_COPY["login.footer.akses"]}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 26,
            left: 0,
            right: 0,
            fontWeight: 500,
            fontSize: 10.5,
            lineHeight: 1.5,
            color: "var(--muted-foreground)",
            textAlign: "center",
          }}
        >
          {GOV_COPY["login.footer.baris1"]}
        </div>
      </section>

      {toast ? (
        <div
          role="status"
          style={{
            position: "fixed",
            bottom: 26,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 120,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "13px 22px",
            borderRadius: 999,
            background: "var(--surface-fill)",
            borderTop: "1px solid var(--edge-top)",
            boxShadow: "var(--shadow-raised-lg)",
            animation: "prm-pop .5s var(--ease-mewah) both",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "var(--primary)",
              flex: "none",
            }}
          />
          <span style={{ fontWeight: 600, fontSize: 12.5, lineHeight: 1.4 }}>
            {toast}
          </span>
        </div>
      ) : null}
    </div>
  );
}
