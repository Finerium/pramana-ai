import Link from "next/link";
import { GOV_COPY } from "@/lib/copy/gov";
import { ThemeToggle } from "./ThemeToggle";

/** Lencana logo emboss (raised di luar, pressed di dalam). */
function Lencana({ size = 42, dot = 16 }: { size?: number; dot?: number }) {
  return (
    <div
      aria-hidden="true"
      className="gov-raised-sm"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "none",
      }}
    >
      <div
        className="gov-well-sm"
        style={{ width: dot, height: dot, borderRadius: "50%" }}
      />
    </div>
  );
}

function Brand() {
  return (
    <>
      <Lencana />
      <div>
        <div
          className="gov-disp"
          style={{
            fontWeight: 800,
            fontSize: 19,
            lineHeight: 1,
            letterSpacing: "-0.01em",
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
            color: "var(--muted-foreground)",
            marginTop: 5,
          }}
        >
          {GOV_COPY["brand.sub"]}
        </div>
      </div>
    </>
  );
}

export function GovHeader({ brandHref }: { brandHref?: string }) {
  return (
    <header style={{ display: "flex", alignItems: "center", gap: 16 }}>
      {brandHref ? (
        <Link
          href={brandHref}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <Brand />
        </Link>
      ) : (
        <Brand />
      )}
      <div style={{ flex: 1 }} />
      <div
        className="gov-well-sm"
        style={{
          padding: "11px 18px",
          borderRadius: 999,
          fontWeight: 600,
          fontSize: 12,
          lineHeight: 1,
          color: "var(--muted-foreground)",
        }}
      >
        {GOV_COPY["shell.periode"]}
      </div>
      <ThemeToggle />
      <div
        className="gov-raised-sm"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "6px 16px 6px 6px",
          borderRadius: 999,
        }}
      >
        <div
          className="gov-disp gov-well-sm"
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 11,
            lineHeight: 1,
            color: "var(--muted-foreground)",
          }}
        >
          {GOV_COPY["shell.user.inisial"]}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 12, lineHeight: 1.1 }}>
            {GOV_COPY["shell.user.nama"]}
          </div>
          <div
            style={{
              fontWeight: 500,
              fontSize: 10,
              lineHeight: 1.1,
              color: "var(--muted-foreground)",
              marginTop: 3,
            }}
          >
            {GOV_COPY["shell.user.email"]}
          </div>
        </div>
      </div>
    </header>
  );
}
