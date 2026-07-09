import Link from "next/link";
import "@/components/landing/landing.css";
import { COPY, LANDING_COPY } from "@/lib/copy";
import { FACTS } from "@/lib/facts";
import { MotionController } from "@/components/landing/MotionController";
import { ScreenSlot } from "@/components/landing/ScreenSlot";
import { ThemeToggle } from "@/components/landing/ThemeToggle";

const C = LANDING_COPY;

type Warna = "hijau" | "kuning" | "merah";

/** Tanda verdict = bentuk CSS murni (dipasangkan label di sekitarnya). */
function Mark({
  warna,
  kind,
  w,
  h,
}: {
  warna: Warna;
  kind: "lingkaran" | "segitiga" | "belah";
  w: number;
  h?: number;
}) {
  const bg = `var(--${warna})`;
  if (kind === "lingkaran") {
    return (
      <span
        aria-hidden="true"
        style={{
          width: w,
          height: w,
          borderRadius: "50%",
          background: bg,
          flex: "none",
        }}
      />
    );
  }
  if (kind === "belah") {
    return (
      <span
        aria-hidden="true"
        style={{
          width: w,
          height: w,
          transform: "rotate(45deg)",
          background: bg,
          flex: "none",
        }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      style={{
        width: 0,
        height: 0,
        borderLeft: `${w / 2}px solid transparent`,
        borderRight: `${w / 2}px solid transparent`,
        borderBottom: `${h ?? w}px solid ${bg}`,
        flex: "none",
      }}
    />
  );
}

function Wordmark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
      <span
        style={{
          width: "18px",
          height: "18px",
          borderRadius: "6px",
          background: "var(--aksen)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "none",
        }}
      >
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "var(--aksen-teks)",
          }}
        />
      </span>
      <span
        style={{
          fontWeight: 800,
          fontSize: "16px",
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        {C.brand.nama}
      </span>
      <span
        style={{
          fontWeight: 600,
          fontSize: "9px",
          lineHeight: 1,
          fontFamily:
            "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, Menlo, monospace",
          letterSpacing: ".1em",
          color: "var(--tinta-3)",
          border: "1px solid var(--garis-kuat)",
          borderRadius: "5px",
          padding: "3px 5px",
        }}
      >
        {C.brand.badge}
      </span>
    </div>
  );
}

function Nav() {
  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 60,
        background: "color-mix(in srgb, var(--latar) 84%, transparent)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--garis)",
      }}
    >
      <div
        style={{
          maxWidth: "1216px",
          margin: "0 auto",
          padding: "0 clamp(18px, 4cqw, 40px)",
          height: "64px",
          display: "flex",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <Wordmark />
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <ThemeToggle />
          <Link
            href="/login"
            prefetch={false}
            data-cq="navcta"
            className="l-cta-aksen"
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: "40px",
              padding: "0 18px",
              borderRadius: "999px",
              fontWeight: 600,
              fontSize: "13px",
              lineHeight: 1,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            {COPY["landing.cta.anggota"]}
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section
      style={{
        position: "relative",
        padding: "clamp(64px, 8cqw, 118px) clamp(18px, 4cqw, 40px) 0",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: "1216px", margin: "0 auto" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "9px",
            height: "34px",
            padding: "0 15px",
            borderRadius: "999px",
            background: "var(--kartu)",
            boxShadow: "inset 0 0 0 1px var(--garis)",
          }}
        >
          <Mark warna="hijau" kind="lingkaran" w={7} />
          <Mark warna="kuning" kind="segitiga" w={9} h={7.5} />
          <Mark warna="merah" kind="belah" w={6} />
          <span
            style={{
              fontWeight: 600,
              fontSize: "10.5px",
              lineHeight: 1,
              fontFamily:
                "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, Menlo, monospace",
              letterSpacing: ".18em",
              color: "var(--tinta-2)",
            }}
          >
            {C.hero.badge}
          </span>
        </div>
        <h1
          style={{
            margin: "24px auto 0",
            maxWidth: "1060px",
            fontWeight: 800,
            fontSize: "clamp(38px, 6.6cqw, 96px)",
            lineHeight: 1.04,
            letterSpacing: "-0.035em",
            textWrap: "balance",
          }}
        >
          {COPY["landing.tagline"]}
        </h1>
        <p
          style={{
            margin: "26px auto 0",
            maxWidth: "640px",
            fontWeight: 400,
            fontSize: "clamp(15.5px, 1.35cqw, 18.5px)",
            lineHeight: 1.65,
            color: "var(--tinta-2)",
            textWrap: "pretty",
          }}
        >
          {C.hero.sub}
        </p>
        <div
          data-cq="herocta"
          style={{
            marginTop: "38px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/login"
            prefetch={false}
            className="l-cta-aksen"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: "52px",
              padding: "0 27px",
              borderRadius: "999px",
              whiteSpace: "nowrap",
              fontWeight: 600,
              fontSize: "15.5px",
              lineHeight: 1,
              textDecoration: "none",
            }}
          >
            {COPY["landing.cta.anggota"]}
          </Link>
          <Link
            href="/login?as=pemerintah"
            prefetch={false}
            className="l-pil-garis"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: "52px",
              padding: "0 27px",
              borderRadius: "999px",
              whiteSpace: "nowrap",
              fontWeight: 600,
              fontSize: "15.5px",
              lineHeight: 1,
              textDecoration: "none",
            }}
          >
            {COPY["landing.cta.pemerintah"]}
          </Link>
        </div>
        <div style={{ marginTop: "20px" }}>
          <Link
            href="/daftar"
            prefetch={false}
            style={{
              fontWeight: 600,
              fontSize: "14.5px",
              lineHeight: 1,
              color: "var(--aksen)",
              textDecoration: "underline",
              textUnderlineOffset: "4px",
            }}
          >
            {COPY["landing.cta.daftar"]}
          </Link>
        </div>
        <p
          style={{
            margin: "26px 0 0",
            fontWeight: 400,
            fontSize: "11.5px",
            lineHeight: 1.5,
            fontFamily:
              "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, Menlo, monospace",
            color: "var(--tinta-3)",
          }}
        >
          {COPY["landing.juri"]}
        </p>
      </div>
    </section>
  );
}

const kartuMono = {
  fontWeight: 500,
  fontSize: "8px",
  lineHeight: 1.3,
  fontFamily:
    "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, Menlo, monospace",
  letterSpacing: ".08em",
  color: "var(--tinta-3)",
} as const;

function PhoneUI() {
  const p = C.preview.phone;
  return (
    <div
      style={{
        borderRadius: "34px",
        background: "var(--latar)",
        boxShadow: "inset 0 0 0 1px var(--garis)",
        overflow: "hidden",
        height: "566px",
        display: "flex",
        flexDirection: "column",
        padding: "12px 13px 10px",
        gap: "10px",
      }}
    >
      <div
        style={{
          width: "52px",
          height: "5px",
          borderRadius: "999px",
          background: "var(--garis)",
          margin: "0 auto",
          flex: "none",
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flex: "none",
        }}
      >
        <span
          style={{
            fontWeight: 600,
            fontSize: "10px",
            lineHeight: 1,
            fontFamily:
              "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, Menlo, monospace",
            color: "var(--tinta-2)",
          }}
        >
          {p.jam}
        </span>
        <span
          style={{ display: "inline-flex", alignItems: "flex-end", gap: "4px" }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "flex-end",
              gap: "1.5px",
            }}
          >
            <span
              style={{
                width: "2.5px",
                height: "4px",
                background: "var(--tinta-3)",
                borderRadius: "1px",
              }}
            />
            <span
              style={{
                width: "2.5px",
                height: "6px",
                background: "var(--tinta-3)",
                borderRadius: "1px",
              }}
            />
            <span
              style={{
                width: "2.5px",
                height: "8px",
                background: "var(--tinta-3)",
                borderRadius: "1px",
              }}
            />
          </span>
          <span
            style={{
              width: "18px",
              height: "9px",
              border: "1px solid var(--tinta-3)",
              borderRadius: "2.5px",
              display: "inline-flex",
              alignItems: "center",
              padding: "1px",
            }}
          >
            <span
              style={{
                width: "70%",
                height: "100%",
                background: "var(--tinta-3)",
                borderRadius: "1px",
              }}
            />
          </span>
        </span>
      </div>
      <div
        style={{
          fontWeight: 700,
          fontSize: "14px",
          lineHeight: 1.3,
          letterSpacing: "-0.01em",
          flex: "none",
        }}
      >
        {p.sapaan}
      </div>
      <div
        style={{
          background: "var(--permukaan)",
          borderRadius: "12px",
          padding: "10px 12px",
          flex: "none",
        }}
      >
        <p
          style={{
            margin: 0,
            fontWeight: 500,
            fontSize: "10px",
            lineHeight: 1.55,
            color: "var(--tinta-2)",
          }}
        >
          {COPY["notif.template"].replace("{n}", p.notifJumlah)}
        </p>
      </div>
      <div
        style={{
          background: "var(--merah-lembut)",
          boxShadow:
            "inset 0 0 0 1px color-mix(in oklch, var(--merah) 38%, var(--latar))",
          borderRadius: "18px",
          padding: "14px",
          display: "flex",
          flexDirection: "column",
          gap: "9px",
          flex: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <Mark warna="merah" kind="belah" w={9} />
          <span
            style={{
              fontWeight: 600,
              fontSize: "8.5px",
              lineHeight: 1,
              fontFamily:
                "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, Menlo, monospace",
              letterSpacing: ".14em",
              color: "var(--merah)",
            }}
          >
            {p.verdictEyebrow}
          </span>
        </div>
        <p
          style={{
            margin: 0,
            fontWeight: 700,
            fontSize: "13px",
            lineHeight: 1.45,
            letterSpacing: "-0.01em",
          }}
        >
          {p.verdictJudul}
        </p>
        <span
          style={{
            fontWeight: 400,
            fontSize: "9px",
            lineHeight: 1.4,
            fontFamily:
              "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, Menlo, monospace",
            color: "var(--tinta-3)",
          }}
        >
          {p.verdictMeta}
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            height: "34px",
            borderRadius: "999px",
            background: "var(--tinta)",
            color: "var(--latar)",
            fontWeight: 600,
            fontSize: "10.5px",
            lineHeight: 1,
          }}
        >
          {COPY["verdict.cta"]}
        </span>
      </div>
      <div
        style={{
          background: "var(--kartu)",
          boxShadow: "inset 0 0 0 1px var(--garis)",
          borderRadius: "14px",
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          flex: "none",
        }}
      >
        <span
          style={{
            fontWeight: 600,
            fontSize: "8px",
            lineHeight: 1,
            fontFamily:
              "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, Menlo, monospace",
            letterSpacing: ".14em",
            color: "var(--tinta-3)",
          }}
        >
          {p.temuanEyebrow}
        </span>
        <span style={{ fontWeight: 700, fontSize: "11.5px", lineHeight: 1.4 }}>
          {p.temuanJudul}
        </span>
        <span
          style={{
            fontWeight: 400,
            fontSize: "10px",
            lineHeight: 1.5,
            color: "var(--tinta-2)",
          }}
        >
          {p.temuanPenjelasan}
        </span>
        <div
          style={{
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            marginTop: "2px",
          }}
        >
          <span
            style={{
              fontWeight: 600,
              fontSize: "9.5px",
              lineHeight: 1,
              color: "var(--aksen)",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            {COPY["temuan.kenapa"]}
          </span>
        </div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            height: "30px",
            borderRadius: "999px",
            boxShadow: "inset 0 0 0 1px var(--garis-kuat)",
            fontWeight: 600,
            fontSize: "9.5px",
            lineHeight: 1,
            color: "var(--tinta)",
          }}
        >
          {COPY["temuan.tambah"]}
        </span>
      </div>
      <div style={{ flex: 1 }} />
      <div
        style={{
          borderTop: "1px solid var(--garis)",
          paddingTop: "8px",
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: "4px",
          flex: "none",
        }}
      >
        <span
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "var(--aksen)",
            }}
          />
          <span
            style={{
              fontWeight: 600,
              fontSize: "7.5px",
              lineHeight: 1,
              color: "var(--aksen)",
            }}
          >
            {p.tab[0]}
          </span>
        </span>
        <span
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "2px",
              background: "var(--tinta-3)",
              opacity: 0.6,
            }}
          />
          <span
            style={{
              fontWeight: 500,
              fontSize: "7.5px",
              lineHeight: 1,
              color: "var(--tinta-3)",
            }}
          >
            {p.tab[1]}
          </span>
        </span>
        <span
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span
            style={{
              width: 0,
              height: 0,
              borderLeft: "4px solid transparent",
              borderRight: "4px solid transparent",
              borderBottom: "7px solid var(--tinta-3)",
              opacity: 0.6,
            }}
          />
          <span
            style={{
              fontWeight: 500,
              fontSize: "7.5px",
              lineHeight: 1,
              color: "var(--tinta-3)",
            }}
          >
            {p.tab[2]}
          </span>
        </span>
        <span
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span style={{ display: "inline-flex", gap: "2px" }}>
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                boxShadow: "inset 0 0 0 1.5px var(--tinta-3)",
                opacity: 0.6,
              }}
            />
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                boxShadow: "inset 0 0 0 1.5px var(--tinta-3)",
                opacity: 0.6,
              }}
            />
          </span>
          <span
            style={{
              fontWeight: 500,
              fontSize: "7.5px",
              lineHeight: 1,
              color: "var(--tinta-3)",
            }}
          >
            {p.tab[3]}
          </span>
        </span>
      </div>
    </div>
  );
}

function kpiMark(tanda: string) {
  if (tanda === "hijau") return <Mark warna="hijau" kind="lingkaran" w={8} />;
  if (tanda === "kuning")
    return <Mark warna="kuning" kind="segitiga" w={10} h={8.5} />;
  if (tanda === "merah") return <Mark warna="merah" kind="belah" w={7} />;
  return null;
}

function barisMark(warna: Warna) {
  if (warna === "hijau") return <Mark warna="hijau" kind="lingkaran" w={7} />;
  if (warna === "kuning")
    return <Mark warna="kuning" kind="segitiga" w={9} h={8} />;
  return <Mark warna="merah" kind="belah" w={7} />;
}

const barisCols = "1.7fr 1fr 0.95fr 0.5fr";

function DasborUI() {
  const d = C.preview.dasbor;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "3px",
            background: "var(--aksen)",
            flex: "none",
          }}
        />
        <span
          style={{
            fontWeight: 700,
            fontSize: "11.5px",
            lineHeight: 1,
            letterSpacing: "-0.01em",
          }}
        >
          {d.judul}
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontWeight: 500,
            fontSize: "8.5px",
            lineHeight: 1,
            fontFamily:
              "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, Menlo, monospace",
            letterSpacing: ".1em",
            color: "var(--tinta-3)",
            border: "1px solid var(--garis)",
            borderRadius: "5px",
            padding: "4px 7px",
          }}
        >
          {d.periode}
        </span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(92px, 1fr))",
          gap: "8px",
        }}
      >
        {d.kpi.map((k) => (
          <div
            key={k.label}
            style={{
              background: "var(--kartu)",
              boxShadow: "inset 0 0 0 1px var(--garis)",
              borderRadius: "11px",
              padding: "10px 12px",
            }}
          >
            {k.tanda === "none" ? (
              <div
                style={{
                  fontWeight: 800,
                  fontSize: "18px",
                  lineHeight: 1.1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {k.nilai}
              </div>
            ) : (
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: "18px",
                    lineHeight: 1.1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {k.nilai}
                </span>
                {kpiMark(k.tanda)}
              </div>
            )}
            <div style={{ marginTop: "4px", ...kartuMono }}>{k.label}</div>
          </div>
        ))}
      </div>
      <div>
        <div
          style={{
            fontWeight: 500,
            fontSize: "8px",
            lineHeight: 1,
            fontFamily:
              "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, Menlo, monospace",
            letterSpacing: ".12em",
            color: "var(--tinta-3)",
            marginBottom: "6px",
          }}
        >
          {d.distribusiLabel}
        </div>
        <div
          style={{
            height: "8px",
            borderRadius: "999px",
            overflow: "hidden",
            display: "flex",
            background: "var(--permukaan)",
          }}
        >
          <span style={{ width: "50%", background: "var(--hijau)" }} />
          <span style={{ width: "33.4%", background: "var(--kuning)" }} />
          <span style={{ width: "16.6%", background: "var(--merah)" }} />
        </div>
      </div>
      <div
        style={{
          background: "var(--kartu)",
          boxShadow: "inset 0 0 0 1px var(--garis)",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: barisCols,
            gap: "8px",
            padding: "8px 12px",
            fontWeight: 500,
            fontSize: "8px",
            lineHeight: 1,
            fontFamily:
              "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, Menlo, monospace",
            letterSpacing: ".1em",
            color: "var(--tinta-3)",
          }}
        >
          <span>{d.tabelHeader.koperasi}</span>
          <span>{d.tabelHeader.provinsi}</span>
          <span>{d.tabelHeader.verdict}</span>
          <span style={{ textAlign: "right" }}>{d.tabelHeader.temuan}</span>
        </div>
        {d.baris.map((b) => (
          <div
            key={b.koperasi}
            style={{
              display: "grid",
              gridTemplateColumns: barisCols,
              gap: "8px",
              padding: "9px 12px",
              borderTop: "1px solid var(--garis)",
              alignItems: "center",
              fontWeight: 400,
              fontSize: "10.5px",
              lineHeight: 1.35,
            }}
          >
            <span style={{ fontWeight: 600 }}>{b.koperasi}</span>
            <span style={{ color: "var(--tinta-2)" }}>{b.provinsi}</span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              {barisMark(b.warna)}
              <span style={{ fontWeight: 600, fontSize: "9px", lineHeight: 1 }}>
                {b.verdict}
              </span>
            </span>
            <span
              style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}
            >
              {b.temuan}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewProduk() {
  return (
    <section
      style={{
        position: "relative",
        padding:
          "clamp(52px, 6.5cqw, 92px) clamp(18px, 4cqw, 40px) clamp(64px, 8cqw, 110px)",
      }}
    >
      <div
        data-cq="devices"
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "1216px",
          margin: "0 auto",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        <div
          data-cq="phone"
          style={{
            flex: "none",
            width: "270px",
            marginRight: "-16px",
            transform: "translateY(26px)",
            zIndex: 2,
            position: "relative",
          }}
        >
          <div data-reveal>
            <div
              style={{
                background: "var(--kartu)",
                borderRadius: "42px",
                padding: "10px",
                boxShadow: "var(--bayang-kartu), inset 0 0 0 1px var(--garis)",
              }}
            >
              <ScreenSlot>
                <PhoneUI />
              </ScreenSlot>
            </div>
          </div>
        </div>

        <div style={{ flex: "0 1 850px", minWidth: 0 }}>
          <div data-reveal data-reveal-delay="140">
            <div
              style={{
                background: "var(--kartu)",
                borderRadius: "20px 20px 12px 12px",
                padding: "10px 10px 14px",
                boxShadow: "var(--bayang-kartu), inset 0 0 0 1px var(--garis)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "2px 0 7px",
                }}
              >
                <span
                  style={{
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    background: "var(--garis-kuat)",
                  }}
                />
              </div>
              <div
                style={{
                  borderRadius: "10px",
                  background: "var(--latar)",
                  boxShadow: "inset 0 0 0 1px var(--garis)",
                  overflow: "hidden",
                  padding: "14px 16px 16px",
                }}
              >
                <ScreenSlot>
                  <DasborUI />
                </ScreenSlot>
              </div>
            </div>
            <div
              style={{
                height: "13px",
                width: "106%",
                margin: "0 -3%",
                background: "var(--permukaan)",
                borderRadius: "0 0 14px 14px",
                boxShadow: "inset 0 0 0 1px var(--garis)",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  width: "88px",
                  height: "5px",
                  borderRadius: "0 0 6px 6px",
                  background: "var(--garis)",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div
        data-cq="captions"
        data-reveal
        data-reveal-delay="120"
        style={{
          maxWidth: "1216px",
          margin: "44px auto 0",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
        }}
      >
        {C.preview.captions.map((cap) => (
          <div
            key={cap.eyebrow}
            style={{
              borderTop: "1px solid var(--garis-kuat)",
              paddingTop: "14px",
            }}
          >
            <span
              style={{
                fontWeight: 600,
                fontSize: "10px",
                lineHeight: 1,
                fontFamily:
                  "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, Menlo, monospace",
                letterSpacing: ".16em",
                color: "var(--tinta-3)",
              }}
            >
              {cap.eyebrow}
            </span>
            <p
              style={{
                margin: "7px 0 0",
                fontWeight: 400,
                fontSize: "13.5px",
                lineHeight: 1.6,
                color: "var(--tinta-2)",
              }}
            >
              {cap.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function EyebrowLine({ teks }: { teks: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
      <span
        style={{
          fontWeight: 600,
          fontSize: "11px",
          lineHeight: 1,
          fontFamily:
            "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, Menlo, monospace",
          letterSpacing: ".18em",
          color: "var(--tinta-3)",
          flex: "none",
        }}
      >
        {teks}
      </span>
      <span style={{ height: "1px", background: "var(--garis)", flex: 1 }} />
    </div>
  );
}

const h2Style = {
  margin: "22px 0 0",
  maxWidth: "780px",
  fontWeight: 800,
  fontSize: "clamp(30px, 4.4cqw, 54px)",
  lineHeight: 1.08,
  letterSpacing: "-0.03em",
  textWrap: "balance",
} as const;

function Masalah() {
  return (
    <section
      style={{ padding: "clamp(72px, 9cqw, 130px) clamp(18px, 4cqw, 40px) 0" }}
    >
      <div style={{ maxWidth: "1216px", margin: "0 auto" }}>
        <EyebrowLine teks={C.masalah.eyebrow} />
        <h2 style={h2Style}>{C.masalah.judul}</h2>
        <p
          style={{
            margin: "18px 0 0",
            maxWidth: "620px",
            fontWeight: 400,
            fontSize: "15.5px",
            lineHeight: 1.65,
            color: "var(--tinta-2)",
            textWrap: "pretty",
          }}
        >
          {C.masalah.lede}
        </p>
        <div
          style={{
            marginTop: "clamp(36px, 5cqw, 60px)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "clamp(24px, 3cqw, 48px)",
          }}
        >
          {C.masalah.stat.map((s, i) => {
            const f = FACTS[s.factKey];
            return (
              <div
                key={s.factKey}
                data-reveal
                data-reveal-delay={
                  i === 0 ? undefined : i === 1 ? "110" : "220"
                }
                style={{
                  borderTop: "1px solid var(--garis-kuat)",
                  paddingTop: "18px",
                  display: "grid",
                  gridTemplateRows: "16px auto auto auto",
                  gap: "8px",
                }}
              >
                <span
                  style={
                    s.eyebrow
                      ? {
                          fontWeight: 600,
                          fontSize: "11px",
                          lineHeight: 1,
                          fontFamily:
                            "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, Menlo, monospace",
                          letterSpacing: ".14em",
                          color: "var(--tinta-3)",
                        }
                      : undefined
                  }
                >
                  {s.eyebrow}
                </span>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: "clamp(46px, 5.4cqw, 82px)",
                    lineHeight: 1,
                    letterSpacing: "-0.04em",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {f.tampil}
                </span>
                <span
                  style={{ fontWeight: 600, fontSize: "15px", lineHeight: 1.4 }}
                >
                  {s.label}
                </span>
                <span
                  style={{
                    fontWeight: 400,
                    fontSize: "10px",
                    lineHeight: 1.5,
                    fontFamily:
                      "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, Menlo, monospace",
                    letterSpacing: ".08em",
                    color: "var(--tinta-3)",
                    textTransform: "uppercase",
                  }}
                >
                  {`${f.sumber} · ${f.tanggal}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Wawasan() {
  const w = C.wawasan;
  const wawasanText = {
    margin: 0,
    fontWeight: 600,
    fontSize: "clamp(24px, 3.4cqw, 42px)",
    lineHeight: 1.25,
    letterSpacing: "-0.025em",
    color: "var(--tinta-2)",
    textWrap: "balance",
  } as const;
  return (
    <section
      style={{
        marginTop: "clamp(72px, 9cqw, 130px)",
        background: "var(--permukaan)",
        borderTop: "1px solid var(--garis)",
        borderBottom: "1px solid var(--garis)",
        padding: "clamp(64px, 8.5cqw, 118px) clamp(18px, 4cqw, 40px)",
        textAlign: "center",
      }}
    >
      <div data-reveal style={{ maxWidth: "880px", margin: "0 auto" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "22px",
          }}
        >
          <Mark warna="hijau" kind="lingkaran" w={7} />
          <Mark warna="kuning" kind="segitiga" w={9} h={7.5} />
          <Mark warna="merah" kind="belah" w={6} />
        </div>
        <p style={wawasanText}>{w.baris1}</p>
        <p
          style={{
            ...wawasanText,
            margin: "8px 0 0",
            fontWeight: 800,
            fontSize: "clamp(24px, 3.4cqw, 42px)",
            lineHeight: 1.25,
            color: "var(--tinta)",
          }}
        >
          {w.baris2}
        </p>
      </div>
    </section>
  );
}

const dgCard = {
  background: "var(--kartu)",
  borderRadius: "18px",
  padding: "20px 20px 22px",
  boxShadow: "inset 0 0 0 1px var(--garis), var(--bayang-diagram)",
} as const;

function chipMark(warna: Warna) {
  if (warna === "hijau") return <Mark warna="hijau" kind="lingkaran" w={9} />;
  if (warna === "kuning")
    return <Mark warna="kuning" kind="segitiga" w={11} h={9.5} />;
  return <Mark warna="merah" kind="belah" w={8} />;
}

function CaraKerja() {
  const ck = C.caraKerja;
  return (
    <section
      style={{ padding: "clamp(72px, 9cqw, 130px) clamp(18px, 4cqw, 40px) 0" }}
    >
      <div style={{ maxWidth: "1216px", margin: "0 auto" }}>
        <EyebrowLine teks={ck.eyebrow} />
        <h2 style={h2Style}>{ck.judul}</h2>
        <p
          style={{
            margin: "18px 0 0",
            maxWidth: "640px",
            fontWeight: 400,
            fontSize: "15.5px",
            lineHeight: 1.65,
            color: "var(--tinta-2)",
            textWrap: "pretty",
          }}
        >
          {ck.lede}
        </p>

        <div
          data-dg-root
          style={{ position: "relative", marginTop: "clamp(40px, 5cqw, 62px)" }}
        >
          <span
            data-dg="spine"
            data-cq="spine"
            aria-hidden="true"
            style={{
              display: "none",
              position: "absolute",
              left: "50%",
              top: "10px",
              bottom: "10px",
              width: "1.5px",
              marginLeft: "-0.75px",
              background: "var(--garis-kuat)",
            }}
          />

          <div
            data-cq="cards"
            style={{
              position: "relative",
              zIndex: 1,
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "16px",
            }}
          >
            {ck.pemeriksa.map((pm) => (
              <div key={pm.kode} data-dg="card" style={dgCard}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: "10.5px",
                      lineHeight: 1,
                      fontFamily:
                        "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, Menlo, monospace",
                      letterSpacing: ".14em",
                      color: "var(--tinta-3)",
                    }}
                  >
                    {pm.kode}
                  </span>
                  <span
                    style={{
                      marginLeft: "auto",
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "var(--aksen)",
                    }}
                  />
                </div>
                <div
                  style={{
                    marginTop: "12px",
                    fontWeight: 800,
                    fontSize: "16.5px",
                    lineHeight: 1.25,
                    letterSpacing: "-0.015em",
                  }}
                >
                  {pm.judul}
                </div>
                <p
                  style={{
                    margin: "8px 0 0",
                    fontWeight: 400,
                    fontSize: "13px",
                    lineHeight: 1.55,
                    color: "var(--tinta-2)",
                  }}
                >
                  {pm.teks}
                </p>
              </div>
            ))}
          </div>

          <div data-cq="connectors" aria-hidden="true">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                height: "30px",
              }}
            >
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  style={{ display: "flex", justifyContent: "center" }}
                >
                  <span
                    data-dg="vline"
                    style={{
                      width: "1.5px",
                      height: "100%",
                      background: "var(--garis-kuat)",
                    }}
                  />
                </span>
              ))}
            </div>
            <div style={{ position: "relative", height: "1.5px" }}>
              <span
                data-dg="hline"
                style={{
                  position: "absolute",
                  left: "12.5%",
                  right: "12.5%",
                  height: "1.5px",
                  background: "var(--garis-kuat)",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                height: "30px",
              }}
            >
              <span
                data-dg="mid"
                style={{
                  width: "1.5px",
                  height: "100%",
                  background: "var(--garis-kuat)",
                }}
              />
            </div>
          </div>

          <div
            data-dg="adj"
            style={{
              position: "relative",
              zIndex: 1,
              maxWidth: "470px",
              margin: "16px auto 0",
              background: "color-mix(in oklch, var(--aksen) 9%, var(--latar))",
              boxShadow:
                "inset 0 0 0 1px color-mix(in oklch, var(--aksen) 35%, var(--latar))",
              borderRadius: "20px",
              padding: "22px 24px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "var(--aksen)",
                  animation: "pulseDot 2.4s ease-in-out infinite",
                }}
              />
              <span
                style={{
                  fontWeight: 600,
                  fontSize: "10.5px",
                  lineHeight: 1,
                  fontFamily:
                    "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, Menlo, monospace",
                  letterSpacing: ".18em",
                  color: "var(--aksen)",
                }}
              >
                {ck.adjudikatorEyebrow}
              </span>
            </div>
            <p
              style={{
                margin: "10px 0 0",
                fontWeight: 400,
                fontSize: "13.5px",
                lineHeight: 1.6,
                color: "var(--tinta-2)",
              }}
            >
              {ck.adjudikatorTeks}
            </p>
          </div>

          <div
            data-cq="connectors"
            aria-hidden="true"
            style={{
              display: "flex",
              justifyContent: "center",
              height: "30px",
              marginTop: 0,
            }}
          >
            <span
              data-dg="last"
              style={{
                width: "1.5px",
                height: "100%",
                background: "var(--garis-kuat)",
              }}
            />
          </div>

          <div
            style={{
              position: "relative",
              zIndex: 1,
              marginTop: "16px",
              display: "flex",
              justifyContent: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            {ck.chip.map((c) => (
              <span
                key={c.warna}
                data-dg="chip"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  height: "42px",
                  padding: "0 17px",
                  borderRadius: "999px",
                  background: `var(--${c.warna}-lembut)`,
                  boxShadow: `inset 0 0 0 1px color-mix(in oklch, var(--${c.warna}) ${c.warna === "kuning" ? "45" : "40"}%, var(--latar))`,
                }}
              >
                {chipMark(c.warna)}
                <span
                  style={{ fontWeight: 700, fontSize: "13px", lineHeight: 1 }}
                >
                  {c.label}
                </span>
              </span>
            ))}
          </div>

          <p
            style={{
              position: "relative",
              zIndex: 1,
              margin: "20px 0 0",
              textAlign: "center",
              fontWeight: 400,
              fontSize: "11px",
              lineHeight: 1.6,
              fontFamily:
                "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, Menlo, monospace",
              color: "var(--tinta-3)",
            }}
          >
            {ck.catatan}
          </p>
        </div>
      </div>
    </section>
  );
}

function fiturMark(tanda: string) {
  if (tanda === "lingkaran") {
    return (
      <span
        aria-hidden="true"
        style={{
          display: "inline-block",
          width: "14px",
          height: "14px",
          borderRadius: "50%",
          border: "2px solid var(--aksen)",
        }}
      />
    );
  }
  if (tanda === "segitiga") {
    return (
      <span
        aria-hidden="true"
        style={{
          display: "inline-block",
          width: 0,
          height: 0,
          borderLeft: "9px solid transparent",
          borderRight: "9px solid transparent",
          borderBottom: "15px solid var(--aksen)",
        }}
      />
    );
  }
  if (tanda === "batang") {
    return (
      <span
        aria-hidden="true"
        style={{
          display: "inline-flex",
          alignItems: "flex-end",
          gap: "3px",
          height: "16px",
        }}
      >
        <span
          style={{
            width: "4.5px",
            height: "8px",
            background: "var(--aksen)",
            borderRadius: "1.5px",
          }}
        />
        <span
          style={{
            width: "4.5px",
            height: "16px",
            background: "var(--aksen)",
            borderRadius: "1.5px",
          }}
        />
        <span
          style={{
            width: "4.5px",
            height: "12px",
            background: "var(--aksen)",
            borderRadius: "1.5px",
          }}
        />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      style={{ display: "inline-flex", height: "16px", alignItems: "center" }}
    >
      <span
        style={{
          width: "11px",
          height: "11px",
          borderRadius: "50%",
          border: "2px solid var(--aksen)",
        }}
      />
      <span
        style={{
          width: "11px",
          height: "11px",
          borderRadius: "50%",
          border: "2px solid var(--aksen)",
          marginLeft: "-5px",
        }}
      />
    </span>
  );
}

function FiturInti() {
  const f = C.fitur;
  return (
    <section
      style={{ padding: "clamp(72px, 9cqw, 130px) clamp(18px, 4cqw, 40px) 0" }}
    >
      <div style={{ maxWidth: "1216px", margin: "0 auto" }}>
        <EyebrowLine teks={f.eyebrow} />
        <h2 style={h2Style}>{f.judul}</h2>
        <div
          style={{
            marginTop: "clamp(36px, 5cqw, 56px)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "clamp(20px, 2.5cqw, 32px)",
          }}
        >
          {f.kartu.map((k, i) => (
            <div
              key={k.judul}
              data-reveal
              data-reveal-delay={["", "90", "180", "270"][i] || undefined}
              style={{
                borderTop: "1px solid var(--garis-kuat)",
                paddingTop: "20px",
              }}
            >
              {fiturMark(k.tanda)}
              <h3
                style={{
                  margin: "14px 0 0",
                  fontWeight: 800,
                  fontSize: "17px",
                  lineHeight: 1.3,
                  letterSpacing: "-0.015em",
                }}
              >
                {k.judul}
              </h3>
              <p
                style={{
                  margin: "8px 0 0",
                  fontWeight: 400,
                  fontSize: "13.5px",
                  lineHeight: 1.6,
                  color: "var(--tinta-2)",
                }}
              >
                {k.teks}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const f = C.footer;
  return (
    <footer
      style={{
        marginTop: "clamp(72px, 9cqw, 130px)",
        background: "var(--permukaan)",
        borderTop: "1px solid var(--garis)",
      }}
    >
      <div
        style={{
          maxWidth: "1216px",
          margin: "0 auto",
          padding: "clamp(48px, 6cqw, 76px) clamp(18px, 4cqw, 40px) 0",
        }}
      >
        <div
          data-cq="footgrid"
          data-reveal
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr 1.2fr",
            gap: "44px",
          }}
        >
          <div>
            <Wordmark />
            <p
              style={{
                margin: "14px 0 0",
                maxWidth: "300px",
                fontWeight: 400,
                fontSize: "13.5px",
                lineHeight: 1.6,
                color: "var(--tinta-2)",
              }}
            >
              {f.tagline}
            </p>
            <p
              style={{
                margin: "16px 0 0",
                fontWeight: 400,
                fontSize: "11px",
                lineHeight: 1.6,
                fontFamily:
                  "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, Menlo, monospace",
                color: "var(--tinta-3)",
              }}
            >
              {COPY["landing.juri"]}
            </p>
          </div>
          <div>
            <span
              style={{
                fontWeight: 600,
                fontSize: "10px",
                lineHeight: 1,
                fontFamily:
                  "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, Menlo, monospace",
                letterSpacing: ".16em",
                color: "var(--tinta-3)",
              }}
            >
              {f.tim.eyebrow}
            </span>
            <p
              style={{
                margin: "12px 0 0",
                fontWeight: 600,
                fontSize: "14.5px",
                lineHeight: 1.5,
              }}
            >
              {f.tim.nama}
            </p>
            <p
              style={{
                margin: "4px 0 0",
                fontWeight: 400,
                fontSize: "13.5px",
                lineHeight: 1.6,
                color: "var(--tinta-2)",
              }}
            >
              {f.tim.sub}
            </p>
          </div>
          <div>
            <span
              style={{
                fontWeight: 600,
                fontSize: "10px",
                lineHeight: 1,
                fontFamily:
                  "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, Menlo, monospace",
                letterSpacing: ".16em",
                color: "var(--tinta-3)",
              }}
            >
              {f.ajang.eyebrow}
            </span>
            <p
              style={{
                margin: "12px 0 0",
                fontWeight: 600,
                fontSize: "14.5px",
                lineHeight: 1.5,
              }}
            >
              {f.ajang.nama}
            </p>
            <p style={{ margin: "10px 0 0" }}>
              <a
                href={f.ajang.repoHref}
                style={{
                  fontWeight: 600,
                  fontSize: "13.5px",
                  lineHeight: 1.5,
                  color: "var(--aksen)",
                  textDecoration: "underline",
                  textUnderlineOffset: "4px",
                }}
              >
                {f.ajang.repoLabel}
              </a>
            </p>
          </div>
        </div>
        <div
          aria-hidden="true"
          style={{ overflow: "hidden", marginTop: "clamp(36px, 5cqw, 64px)" }}
        >
          <div
            style={{
              textAlign: "center",
              fontWeight: 800,
              fontSize: "clamp(88px, 14cqw, 188px)",
              lineHeight: 0.92,
              letterSpacing: "-0.05em",
              color: "color-mix(in oklch, var(--tinta) 8%, var(--permukaan))",
              userSelect: "none",
              transform: "translateY(10%)",
            }}
          >
            {f.ghost}
          </div>
        </div>
        <div
          style={{
            borderTop: "1px solid var(--garis)",
            padding: "16px 0 22px",
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontWeight: 400,
              fontSize: "10.5px",
              lineHeight: 1.6,
              fontFamily:
                "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, Menlo, monospace",
              color: "var(--tinta-3)",
            }}
          >
            {f.legalKiri}
          </span>
          <span
            style={{
              fontWeight: 400,
              fontSize: "10.5px",
              lineHeight: 1.6,
              fontFamily:
                "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, Menlo, monospace",
              color: "var(--tinta-3)",
            }}
          >
            {f.legalKanan}
          </span>
        </div>
      </div>
    </footer>
  );
}

export default function Page() {
  return (
    <div id="pg" className="landing">
      <Nav />
      <main>
        <Hero />
        <PreviewProduk />
        <Masalah />
        <Wawasan />
        <CaraKerja />
        <FiturInti />
      </main>
      <Footer />
      <MotionController />
    </div>
  );
}
