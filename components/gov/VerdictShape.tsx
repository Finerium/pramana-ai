import type { Bentuk } from "@/app/(gov)/_logic/verdict";

/** Ikon bentuk verdict (clip-path). Dekoratif; label teks menyertai di UI. */
export function VerdictShape({
  bentuk,
  size = 10,
}: {
  bentuk: Bentuk;
  size?: number;
}) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        background: bentuk.colorVar,
        clipPath: bentuk.clip === "none" ? undefined : bentuk.clip,
        borderRadius: bentuk.radius,
        flex: "none",
        display: "inline-block",
      }}
    />
  );
}
