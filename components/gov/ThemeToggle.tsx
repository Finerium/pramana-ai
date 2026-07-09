"use client";
import { useSyncExternalStore } from "react";
import { GOV_COPY } from "@/lib/copy/gov";
import { bacaTema, terapkanTema, TEMA_EVENT, type Tema } from "./theme";

function subscribe(cb: () => void) {
  window.addEventListener(TEMA_EVENT, cb);
  return () => window.removeEventListener(TEMA_EVENT, cb);
}
const serverTema = (): Tema => "terang";

export function ThemeToggle() {
  const tema = useSyncExternalStore(subscribe, bacaTema, serverTema);

  const btn = (t: Tema, label: string) => {
    const aktif = tema === t;
    return (
      <button
        type="button"
        onClick={() => terapkanTema(t)}
        aria-pressed={aktif}
        className={aktif ? "gov-raised-sm" : undefined}
        style={{
          padding: "8px 16px",
          borderRadius: 999,
          fontWeight: 700,
          fontSize: 11.5,
          lineHeight: 1,
          background: aktif ? undefined : "transparent",
          color: aktif ? "var(--foreground)" : "var(--muted-foreground)",
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      role="group"
      aria-label={GOV_COPY["shell.tema.label"]}
      className="gov-well-sm"
      style={{ display: "flex", gap: 4, padding: 5, borderRadius: 999 }}
    >
      {btn("terang", GOV_COPY["shell.tema.terang"])}
      {btn("gelap", GOV_COPY["shell.tema.gelap"])}
    </div>
  );
}
