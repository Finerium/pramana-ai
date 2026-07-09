/**
 * View-model murni surface anggota: mengubah respons API (kontrak 6.3b) menjadi
 * properti tampil siap render. Semua nilai turunan (progres cicilan, tren kas,
 * agregat suara) memakai fallback seed bila kontrak minimal tidak memuatnya;
 * fallback ditandai jelas dan sesuai data 6.7 agar layar utuh dan demo-proof.
 */
import type {
  VerdictResp,
  MemberSummary,
  VerdictColor,
  Severity,
  AgentId,
} from "@/lib/contracts";
import { VERDICT_LABELS, COPY, AGENT_LABELS } from "../../lib/copy";
import { SEVERITY_CHIP, AGENT_PANEL, MEMBER_COPY } from "../../lib/copy/member";
import { fmtJt, kasHeight, barWidth, fmtRp } from "./format";

function groupInt(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Token isi/teks/CTA untuk kartu verdict per warna. CTA kuning pakai --ink. */
export function verdictTokens(warna: VerdictColor): {
  bg: string;
  on: string;
  cta: string;
} {
  if (warna === "kuning") return { bg: "--kuning", on: "--kuning-on", cta: "--ink" };
  return { bg: `--${warna}`, on: `--${warna}-on`, cta: `--${warna}` };
}

/** Tint + teks + label chip per severity temuan. */
export function chipSeverity(sev: Severity): {
  tint: string;
  tintInk: string;
  label: string;
} {
  if (sev === "info")
    return { tint: "--border", tintInk: "--muted", label: SEVERITY_CHIP.info };
  return {
    tint: `--${sev}-tint`,
    tintInk: `--${sev}-tint-ink`,
    label: SEVERITY_CHIP[sev],
  };
}

/** Hitung jumlah temuan per agen (id enum 6.1). */
export function temuanPerAgen(
  findings: ReadonlyArray<{ agent: AgentId }>,
): Record<AgentId, number> {
  const c: Record<AgentId, number> = {
    konflik_kepentingan: 0,
    anomali_transaksi: 0,
    kesehatan_finansial: 0,
    kepatuhan_proses: 0,
  };
  for (const f of findings) c[f.agent] += 1;
  return c;
}

export type DotKind = "setuju" | "tidak" | "belum";

/** Grid titik voting: setuju dulu, lalu tidak, sisanya belum memilih. */
export function voteDots(setuju: number, tidak: number, total = 30): DotKind[] {
  const len = Math.max(total, setuju + tidak);
  const dots: DotKind[] = [];
  for (let i = 0; i < len; i++) {
    if (i < setuju) dots.push("setuju");
    else if (i < setuju + tidak) dots.push("tidak");
    else dots.push("belum");
  }
  return dots;
}

export type SuaraItem = { temuanId: string; judul: string; jumlahAnggota: number };

/**
 * Agregat pertanyaan: +1 dan tandai "milik Anda" bila anggota menambahkannya
 * pada sesi ini (model prototipe: base server + tambahan sesi). Urut jumlah
 * penanya turun.
 */
export function suaraAggregate(
  items: ReadonlyArray<SuaraItem>,
  addedIds: ReadonlySet<string>,
): Array<{ temuanId: string; judul: string; jumlahAnggota: number; milikAnda: boolean }> {
  return items
    .map((q) => {
      const milikAnda = addedIds.has(q.temuanId);
      return {
        temuanId: q.temuanId,
        judul: q.judul,
        jumlahAnggota: q.jumlahAnggota + (milikAnda ? 1 : 0),
        milikAnda,
      };
    })
    .sort((a, b) => b.jumlahAnggota - a.jumlahAnggota);
}

/** Rincian simpanan pokok/wajib/sukarela: fallback seed 6.7 (kontrak minimal). */
export const SIMPANAN_FALLBACK = { pokok: 100000, wajib: 350000, sukarela: 150000 };
/** Pinjaman awal untuk menghitung progres angsuran: fallback seed 6.7. */
export const PINJAMAN_AWAL_FALLBACK = 2000000;

export function deriveUang(s: MemberSummary) {
  const u = s.uangAnda;
  const pinjamanAwal = PINJAMAN_AWAL_FALLBACK;
  const diangsur = Math.max(0, pinjamanAwal - u.sisaPinjaman);
  const progressPct =
    pinjamanAwal > 0 ? Math.round((diangsur / pinjamanAwal) * 100) : 0;
  return {
    totalSimpanan: u.totalSimpanan,
    pokok: SIMPANAN_FALLBACK.pokok,
    wajib: SIMPANAN_FALLBACK.wajib,
    sukarela: SIMPANAN_FALLBACK.sukarela,
    sisaPinjaman: u.sisaPinjaman,
    diangsur,
    pinjamanAwal,
    progressPct,
    cicilan: u.cicilanBerikut,
  };
}

export function deriveVerdict(resp: VerdictResp) {
  const n = resp.jumlahTemuan.merah + resp.jumlahTemuan.kuning;
  return {
    warna: resp.warna,
    label: VERDICT_LABELS[resp.warna],
    ringkasan: resp.ringkasan,
    tokens: verdictTokens(resp.warna),
    n,
    showNotif: n > 0,
    notif: COPY["notif.template"].replace("{n}", String(n)),
  };
}

/**
 * Tren kas tiga bulan (fallback seed 6.7 + F-01: Mei Rp 47.500.000). Tidak ada
 * di FlowResp; konsisten temuan AN-4 (April 58 jt, Juni 36,5 jt).
 */
export const KAS_TREND_FALLBACK: ReadonlyArray<{ label: string; rupiah: number }> = [
  { label: "April", rupiah: 58000000 },
  { label: "Mei", rupiah: 47500000 },
  { label: "Juni", rupiah: 36500000 },
];

export function kasBarsFallback() {
  const max = Math.max(...KAS_TREND_FALLBACK.map((k) => k.rupiah));
  return KAS_TREND_FALLBACK.map((k, i) => ({
    label: k.label,
    val: fmtJt(k.rupiah),
    heightPct: kasHeight(k.rupiah, max),
    isLast: i === KAS_TREND_FALLBACK.length - 1,
  }));
}

/** Persen penurunan kas April ke bulan terakhir (37%). */
export function kasTurunPersen(): number {
  const first = KAS_TREND_FALLBACK[0]!.rupiah;
  const last = KAS_TREND_FALLBACK[KAS_TREND_FALLBACK.length - 1]!.rupiah;
  return first > 0 ? Math.round(((first - last) / first) * 100) : 0;
}

/** Nominal penurunan kas April ke bulan terakhir. */
export function kasTurunRupiah(): number {
  return (
    KAS_TREND_FALLBACK[0]!.rupiah -
    KAS_TREND_FALLBACK[KAS_TREND_FALLBACK.length - 1]!.rupiah
  );
}

/** Bar kategori arus: lebar diskalakan ke kategori terbesar. */
export function flowBars(items: ReadonlyArray<{ kategori: string; jumlah: number }>) {
  const max = items.length ? Math.max(...items.map((x) => x.jumlah)) : 0;
  return items.map((x) => ({
    label: x.kategori,
    amt: fmtRp(x.jumlah),
    widthPct: barWidth(x.jumlah, max),
  }));
}

export type AgentRow = {
  id: AgentId;
  nama: string;
  time: string;
  isDone: boolean;
  isActive: boolean;
  isPending: boolean;
  metric: string;
  showChip: boolean;
  chip: string;
  showTime: boolean;
};

/**
 * Baris panel Pengawas dari state animasi (agStep selesai, agRun aktif,
 * agCounts hitung berjalan). Selesai + ada temuan -> chip "n temuan"; selesai
 * tanpa temuan -> jam selesai.
 */
export function agentRows(
  findings: ReadonlyArray<{ agent: AgentId }>,
  agStep: number,
  agRun: boolean,
  agCounts: ReadonlyArray<number>,
): AgentRow[] {
  const perAgen = temuanPerAgen(findings);
  return AGENT_PANEL.map((a, i) => {
    const isDone = i < agStep;
    const isActive = agRun && i === agStep;
    const isPending = !isDone && !isActive;
    const count = agCounts[i] ?? 0;
    const nf = perAgen[a.id];
    return {
      id: a.id,
      nama: AGENT_LABELS.anggota[a.id],
      time: a.time,
      isDone,
      isActive,
      isPending,
      metric:
        isDone || isActive
          ? `${groupInt(count)} ${a.unit}`
          : MEMBER_COPY["beranda.pengawas.tunggu"],
      showChip: isDone && nf > 0,
      chip: `${nf} temuan`,
      showTime: isDone && nf === 0,
    };
  });
}
