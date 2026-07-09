import { PembukuanConsole } from "@/components/subjek/pembukuan-console";

// Rute /pembukuan (role pengurus). Penjagaan role deny-by-default (AC-SUBJ-03)
// adalah lapisan middleware/sesi milik integrasi, bukan surface ini; konsol
// merender data seed sampai /api/subjek/recent (live) tersedia.
export default function PembukuanPage() {
  return <PembukuanConsole />;
}
