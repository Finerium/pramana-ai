"use client";

/**
 * Profil anggota (pendukung). Kartu anggota, data diri (NIK ter-mask), pilih
 * tema (Sistem/Terang/Gelap), toggle notifikasi, Hubungi Pengawas, Keluar.
 * Identitas fallback seed (kontrak 6.10 tak membekukan endpoint profil).
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MEMBER_COPY, MEMBER_IDENTITY } from "@/lib/copy/member";
import { postJson } from "@/components/member/data";
import { useTemaPilihan, terapkanTema, type Tema } from "@/components/member/theme";
import { KartuAnggota } from "@/components/member/KartuAnggota";
import { BackLink, cardStyle, SectionLabel, rise, SHADOW_SM } from "@/components/member/ui";
import { IkonChevronKanan, IkonKeluar } from "@/components/member/icons";

const TEMA: { key: Tema; label: string }[] = [
  { key: "sistem", label: MEMBER_COPY["profil.tema.sistem"] },
  { key: "terang", label: MEMBER_COPY["profil.tema.terang"] },
  { key: "gelap", label: MEMBER_COPY["profil.tema.gelap"] },
];

export function Profil() {
  const router = useRouter();
  const tema = useTemaPilihan();
  const [notif, setNotif] = useState(true);

  async function keluar() {
    try {
      await postJson("/api/auth/logout", {});
    } catch {
      /* tetap arahkan ke login */
    }
    router.push("/login");
  }

  return (
    <main
      style={{
        minHeight: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: "0 20px 60px",
        animation: "m-fadein 0.28s ease",
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          margin: "0 -20px",
          padding: "64px 20px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          background: "color-mix(in srgb, var(--bg) 82%, transparent)",
          backdropFilter: "blur(18px) saturate(1.6)",
          WebkitBackdropFilter: "blur(18px) saturate(1.6)",
        }}
      >
        <BackLink label={MEMBER_COPY["profil.kembali"]} onClick={() => router.push("/beranda")} />
        <h1 style={{ margin: 0, fontSize: 25, fontWeight: 750, letterSpacing: -0.5 }}>{MEMBER_COPY["profil.judul"]}</h1>
      </header>

      <div style={rise(0.03)}>
        <KartuAnggota
          nama={MEMBER_IDENTITY.nama}
          noAnggota={MEMBER_IDENTITY.noAnggota}
          koperasiCaps={MEMBER_IDENTITY.koperasiCaps}
          bergabung={MEMBER_IDENTITY.bergabung}
          gap={18}
        />
      </div>

      <section style={{ display: "flex", flexDirection: "column", gap: 8, ...rise(0.09) }}>
        <SectionLabel style={{ paddingLeft: 16 }}>{MEMBER_COPY["profil.dataDiri"]}</SectionLabel>
        <div style={cardStyle({ borderRadius: 22, overflow: "hidden", boxShadow: SHADOW_SM })}>
          <RowKV k={MEMBER_COPY["profil.nama"]} v={MEMBER_IDENTITY.nama} />
          <RowKV k={MEMBER_COPY["profil.nik"]} v={MEMBER_IDENTITY.nikMasked} tnum top />
          <RowKV k={MEMBER_COPY["profil.alamat"]} v={MEMBER_IDENTITY.alamat} top />
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 8, ...rise(0.14) }}>
        <SectionLabel style={{ paddingLeft: 16 }}>{MEMBER_COPY["profil.tampilan"]}</SectionLabel>
        <div style={cardStyle({ borderRadius: 22, overflow: "hidden", boxShadow: SHADOW_SM })}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, minHeight: 56, padding: "8px 16px" }}>
            <span style={{ fontSize: 15 }}>{MEMBER_COPY["profil.tema"]}</span>
            <div role="group" aria-label="Pilih tema" style={{ display: "flex", background: "var(--bg)", borderRadius: 12, padding: 3, gap: 2 }}>
              {TEMA.map((t) => {
                const on = tema === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => terapkanTema(t.key)}
                    aria-pressed={on}
                    style={{
                      minHeight: 38,
                      padding: "0 13px",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 600,
                      background: on ? "var(--surface)" : "transparent",
                      color: on ? "var(--ink)" : "var(--muted)",
                      boxShadow: on ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <span style={{ fontSize: 12, color: "var(--muted)", paddingLeft: 16, lineHeight: 1.5 }}>{MEMBER_COPY["profil.tema.bantu"]}</span>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 8, ...rise(0.19) }}>
        <SectionLabel style={{ paddingLeft: 16 }}>{MEMBER_COPY["profil.lainnya"]}</SectionLabel>
        <div style={cardStyle({ borderRadius: 22, overflow: "hidden", boxShadow: SHADOW_SM })}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, minHeight: 56, padding: "8px 16px" }}>
            <span style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontSize: 15 }}>{MEMBER_COPY["profil.notif.judul"]}</span>
              <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{MEMBER_COPY["profil.notif.sub"]}</span>
            </span>
            <button
              type="button"
              onClick={() => setNotif((n) => !n)}
              role="switch"
              aria-checked={notif}
              aria-label={MEMBER_COPY["profil.notif.judul"]}
              style={{ width: 51, height: 31, borderRadius: 999, background: notif ? "var(--accent)" : "var(--border)", position: "relative", transition: "background 0.2s ease", flex: "none" }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: 2,
                  width: 27,
                  height: 27,
                  borderRadius: "50%",
                  background: "#ffffff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                  transition: "transform 0.2s ease",
                  transform: notif ? "translateX(20px)" : "translateX(0)",
                }}
              />
            </button>
          </div>
          <button
            type="button"
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, minHeight: 52, padding: "6px 16px", borderTop: "0.5px solid var(--border)", width: "100%", boxSizing: "border-box" }}
          >
            <span style={{ fontSize: 15 }}>{MEMBER_COPY["profil.hubungi"]}</span>
            <IkonChevronKanan size={14} style={{ stroke: "var(--muted)" }} strokeWidth={2.2} />
          </button>
        </div>
      </section>

      <section style={rise(0.24)}>
        <button
          type="button"
          onClick={keluar}
          style={{
            width: "100%",
            boxSizing: "border-box",
            minHeight: 52,
            background: "var(--surface)",
            border: "0.5px solid var(--border)",
            borderRadius: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontSize: 15,
            fontWeight: 650,
            color: "var(--merah)",
            boxShadow: SHADOW_SM,
          }}
        >
          <IkonKeluar size={16} style={{ stroke: "currentColor" }} strokeWidth={1.9} />
          {MEMBER_COPY["profil.keluar"]}
        </button>
      </section>
      <span style={{ textAlign: "center", fontSize: 12, color: "var(--muted)" }}>{MEMBER_COPY["profil.versi"]}</span>
    </main>
  );
}

function RowKV({ k, v, tnum, top }: { k: string; v: string; tnum?: boolean; top?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        minHeight: 52,
        padding: "6px 16px",
        borderTop: top ? "0.5px solid var(--border)" : undefined,
      }}
    >
      <span style={{ fontSize: 15, flex: "none" }}>{k}</span>
      <span className={tnum ? "tnum" : undefined} style={{ fontSize: 15, color: "var(--muted)", textAlign: "right", lineHeight: 1.4 }}>{v}</span>
    </div>
  );
}
