"use client";

/**
 * Daftar keanggotaan (F11, AC-E2E-03). Form nama+NIK+alamat+email+password;
 * validasi NIK 16 digit di klien DAN tampil onboard.nik.err dari server; sukses
 * -> kartu anggota digital (animasi rise) -> lanjut ke /beranda (sesi aktif dari
 * server).
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { COPY } from "@/lib/copy";
import { MEMBER_COPY } from "@/lib/copy/member";
import type { OnboardResp } from "@/lib/contracts";
import { postJson, ApiError } from "@/components/member/data";
import { fmtTanggal, nikDigits, nikValid } from "@/components/member/format";
import { Banner, BackLink, rise } from "@/components/member/ui";
import { BelahKetupat } from "@/components/member/icons";
import { KartuAnggota } from "@/components/member/KartuAnggota";

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

export function Daftar() {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [nik, setNik] = useState("");
  const [alamat, setAlamat] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [nikErr, setNikErr] = useState(false);
  const [busy, setBusy] = useState(false);
  const [kartu, setKartu] = useState<OnboardResp["kartu"] | null>(null);

  async function submit() {
    if (busy) return;
    if (!nikValid(nik)) {
      setNikErr(true);
      return;
    }
    setBusy(true);
    setNikErr(false);
    try {
      const data = await postJson<OnboardResp>("/api/onboarding", {
        nama,
        nik,
        alamat,
        email: email.trim(),
        password: pass,
      });
      setKartu(data.kartu);
    } catch (e) {
      setBusy(false);
      if (e instanceof ApiError && (e.code === "VALIDATION" || e.status === 400)) setNikErr(true);
    }
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 18,
        padding: "76px 24px 48px",
        animation: "m-fadein 0.28s ease",
      }}
    >
      {kartu ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 22 }}>
          <p style={{ margin: 0, fontSize: 16.5, lineHeight: 1.5, textAlign: "center", fontWeight: 600, ...rise(0, 0.5) }}>
            {COPY["onboard.sukses"]}
          </p>
          <div style={rise(0.1, 0.6)}>
            <KartuAnggota
              nama={kartu.nama}
              noAnggota={kartu.noAnggota}
              koperasiCaps={kartu.koperasi.toUpperCase()}
              bergabung={`Bergabung ${fmtTanggal(kartu.bergabungPada)}`}
            />
          </div>
          <button
            type="button"
            onClick={() => router.push("/beranda")}
            style={{ height: 54, borderRadius: 999, background: "var(--accent)", color: "var(--accent-on)", fontSize: 17, fontWeight: 600, textAlign: "center", ...rise(0.22, 0.5) }}
          >
            {MEMBER_COPY["daftar.kartu.masuk"]}
          </button>
          <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center", ...rise(0.3, 0.5) }}>
            <BelahKetupat size={9} color="var(--muted)" />
            <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{COPY["verifikasi.label"]}</span>
          </div>
        </div>
      ) : (
        <>
          <BackLink label={MEMBER_COPY["daftar.kembali"]} onClick={() => router.push("/login")} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <h1 style={{ margin: 0, fontSize: 27, fontWeight: 750, letterSpacing: -0.5 }}>{MEMBER_COPY["daftar.judul"]}</h1>
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5, color: "var(--muted)" }}>{MEMBER_COPY["daftar.koperasi"]}</p>
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
              boxShadow: "0 1px 2px rgba(0,0,0,0.04),0 8px 24px rgba(0,0,0,0.05)",
            }}
          >
            <Field label={MEMBER_COPY["daftar.nama"]} ph={MEMBER_COPY["daftar.nama.ph"]} value={nama} onChange={setNama} autoComplete="name" />
            <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>{MEMBER_COPY["daftar.nik"]}</span>
              <input
                inputMode="numeric"
                maxLength={16}
                value={nik}
                onChange={(e) => setNik(nikDigits(e.target.value))}
                placeholder={MEMBER_COPY["daftar.nik.ph"]}
                className="tnum"
                style={INPUT}
              />
            </label>
            {nikErr ? <Banner tone="galat">{COPY["onboard.nik.err"]}</Banner> : null}
            <Field label={MEMBER_COPY["daftar.alamat"]} ph={MEMBER_COPY["daftar.alamat.ph"]} value={alamat} onChange={setAlamat} autoComplete="street-address" />
            <Field label={MEMBER_COPY["daftar.email"]} ph={MEMBER_COPY["daftar.email.ph"]} value={email} onChange={setEmail} type="email" autoComplete="email" />
            <Field label={MEMBER_COPY["daftar.sandi"]} ph={MEMBER_COPY["daftar.sandi.ph"]} value={pass} onChange={setPass} type="password" autoComplete="new-password" />
            <button
              type="submit"
              style={{ height: 54, borderRadius: 999, background: "var(--accent)", color: "var(--accent-on)", fontSize: 17, fontWeight: 600, textAlign: "center" }}
            >
              {busy ? MEMBER_COPY["daftar.busy"] : MEMBER_COPY["daftar.kirim"]}
            </button>
          </form>
          <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
            <BelahKetupat size={9} color="var(--muted)" />
            <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{COPY["verifikasi.label"]}</span>
          </div>
        </>
      )}
    </main>
  );
}

function Field({
  label,
  ph,
  value,
  onChange,
  type,
  autoComplete,
}: {
  label: string;
  ph: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <span style={{ fontSize: 13.5, fontWeight: 600 }}>{label}</span>
      <input
        type={type ?? "text"}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={ph}
        style={INPUT}
      />
    </label>
  );
}
