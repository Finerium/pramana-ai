/**
 * Aturan derivasi warna verdict (blueprint 6.1), dihitung server-side dan
 * MENANG atas usulan warna adjudikator. Deterministik dan murni.
 *
 * merah  : ada >= 1 temuan severity merah
 * kuning : ada >= 1 temuan kuning tanpa merah
 * hijau  : selain itu. Temuan info tidak mengubah warna.
 */
import type { Severity, VerdictColor } from "@/lib/contracts";

export function hitungWarna(
  temuan: ReadonlyArray<{ severity: Severity }>,
): VerdictColor {
  if (temuan.some((t) => t.severity === "merah")) return "merah";
  if (temuan.some((t) => t.severity === "kuning")) return "kuning";
  return "hijau";
}
