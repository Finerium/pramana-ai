import { describe, it, expect } from "vitest";
import {
  verdictTokens,
  chipSeverity,
  temuanPerAgen,
  voteDots,
  suaraAggregate,
  deriveUang,
  deriveVerdict,
  kasBarsFallback,
  kasTurunPersen,
  flowBars,
  agentRows,
  keputusanTally,
} from "../../../components/member/derive";
import type { VerdictResp, MemberSummary } from "../../../lib/contracts";

describe("verdictTokens", () => {
  it("maps each verdict to its fill/on/cta tokens", () => {
    expect(verdictTokens("merah")).toEqual({
      bg: "--merah",
      on: "--merah-on",
      cta: "--merah",
    });
    expect(verdictTokens("kuning").cta).toBe("--ink");
    expect(verdictTokens("hijau")).toEqual({
      bg: "--hijau",
      on: "--hijau-on",
      cta: "--hijau",
    });
  });
});

describe("chipSeverity", () => {
  it("info uses neutral tint and Catatan label", () => {
    expect(chipSeverity("info")).toEqual({
      tint: "--border",
      tintInk: "--muted",
      label: "Catatan",
    });
    expect(chipSeverity("merah").label).toBe("Perlu Dijelaskan");
    expect(chipSeverity("kuning").label).toBe("Perlu Perhatian");
  });
});

describe("temuanPerAgen", () => {
  it("counts findings per agent id", () => {
    const f = [
      { agent: "anomali_transaksi" },
      { agent: "anomali_transaksi" },
      { agent: "kepatuhan_proses" },
    ] as Array<{ agent: Parameters<typeof temuanPerAgen>[0][number]["agent"] }>;
    const c = temuanPerAgen(f);
    expect(c.anomali_transaksi).toBe(2);
    expect(c.kepatuhan_proses).toBe(1);
    expect(c.konflik_kepentingan).toBe(0);
  });
});

describe("voteDots", () => {
  it("30 dots, 9 setuju then 3 tidak then belum", () => {
    const d = voteDots(9, 3, 30);
    expect(d).toHaveLength(30);
    expect(d.filter((x) => x === "setuju")).toHaveLength(9);
    expect(d.filter((x) => x === "tidak")).toHaveLength(3);
    expect(d.filter((x) => x === "belum")).toHaveLength(18);
    expect(d[0]).toBe("setuju");
    expect(d[9]).toBe("tidak");
    expect(d[12]).toBe("belum");
  });
  it("grows the grid if votes exceed total", () => {
    expect(voteDots(20, 15, 30)).toHaveLength(35);
  });
});

describe("suaraAggregate", () => {
  // temuanId memakai id seed nyata (tmn-anN). Server sudah menghitung baris
  // pertanyaan_rat anggota ini setelah persist (F10 "keranjang seluruh
  // anggota", blueprint B1: agregat AN-1 berubah 12 -> 13). Klien menampilkan
  // angka server apa adanya dan hanya menandai "milik Anda" dari set sesi;
  // TANPA +1 klien (anti hitung ganda, sejajar keputusanTally).
  const items = [
    { temuanId: "tmn-an1", judul: "A", jumlahAnggota: 12 },
    { temuanId: "tmn-an4", judul: "B", jumlahAnggota: 7 },
    { temuanId: "tmn-an2", judul: "C", jumlahAnggota: 5 },
  ];
  it("shows the server count verbatim and flags the member's own questions (no client +1)", () => {
    const out = suaraAggregate(items, new Set(["tmn-an2"]));
    const an2 = out.find((q) => q.temuanId === "tmn-an2")!;
    expect(an2.jumlahAnggota).toBe(5);
    expect(an2.milikAnda).toBe(true);
    const an1 = out.find((q) => q.temuanId === "tmn-an1")!;
    expect(an1.jumlahAnggota).toBe(12);
    expect(an1.milikAnda).toBe(false);
  });
  it("does not double-count once the server total already includes the member (12 -> 13, never 14)", () => {
    const out = suaraAggregate(
      [{ temuanId: "tmn-an1", judul: "A", jumlahAnggota: 13 }],
      new Set(["tmn-an1"]),
    );
    expect(out[0]!.jumlahAnggota).toBe(13);
    expect(out[0]!.milikAnda).toBe(true);
  });
  it("sorts by member count descending", () => {
    const out = suaraAggregate(items, new Set(["tmn-an2"]));
    expect(out.map((q) => q.temuanId)).toEqual([
      "tmn-an1",
      "tmn-an4",
      "tmn-an2",
    ]);
  });
});

describe("deriveUang", () => {
  const summary: MemberSummary = {
    uangAnda: {
      totalSimpanan: 600000,
      sisaPinjaman: 1200000,
      cicilanBerikut: { jumlah: 200000, tanggal: "2026-07-05" },
    },
    notifikasiBelumDibaca: 5,
  };
  it("derives instalment progress from seed fallback loan", () => {
    const u = deriveUang(summary);
    expect(u.diangsur).toBe(800000);
    expect(u.pinjamanAwal).toBe(2000000);
    expect(u.progressPct).toBe(40);
    expect(u.pokok + u.wajib + u.sukarela).toBe(600000);
    expect(u.cicilan).toEqual({ jumlah: 200000, tanggal: "2026-07-05" });
  });
});

describe("deriveVerdict", () => {
  const resp: VerdictResp = {
    auditRunId: "r1",
    periode: "2026-06",
    source: "seed",
    warna: "merah",
    ringkasan: "Kas menurun dan ada pembelian besar.",
    jumlahTemuan: { merah: 1, kuning: 4, info: 1 },
  };
  it("counts non-info findings for the notif and passes ringkasan through", () => {
    const v = deriveVerdict(resp);
    expect(v.n).toBe(5);
    expect(v.showNotif).toBe(true);
    expect(v.label).toBe("Perlu Dijelaskan");
    expect(v.ringkasan).toBe("Kas menurun dan ada pembelian besar.");
    expect(v.notif).toContain("5 hal");
    expect(v.tokens.bg).toBe("--merah");
  });
  it("hijau with zero findings hides the notif", () => {
    const v = deriveVerdict({
      ...resp,
      warna: "hijau",
      jumlahTemuan: { merah: 0, kuning: 0, info: 0 },
    });
    expect(v.n).toBe(0);
    expect(v.showNotif).toBe(false);
    expect(v.label).toBe("Sehat");
  });
});

describe("kas fallback", () => {
  it("three months with last month highlighted", () => {
    const bars = kasBarsFallback();
    expect(bars.map((b) => b.label)).toEqual(["April", "Mei", "Juni"]);
    expect(bars[0]!.val).toBe("58,0 jt");
    expect(bars[1]!.val).toBe("47,5 jt");
    expect(bars[2]!.val).toBe("36,5 jt");
    expect(bars[2]!.isLast).toBe(true);
    expect(bars[0]!.heightPct).toBe("100%");
  });
  it("computes the 37 percent drop", () => {
    expect(kasTurunPersen()).toBe(37);
  });
});

describe("flowBars", () => {
  it("scales widths to the largest category", () => {
    const bars = flowBars([
      { kategori: "Penjualan gerai", jumlah: 43600000 },
      { kategori: "Lainnya", jumlah: 1300000 },
    ]);
    expect(bars[0]).toEqual({
      label: "Penjualan gerai",
      amt: "Rp 43.600.000",
      widthPct: "100%",
    });
    expect(bars[1]!.widthPct).toBe("3%");
  });
});

describe("agentRows", () => {
  it("all done shows finding chips or the completion time", () => {
    const findings = [
      { agent: "konflik_kepentingan", severity: "merah" },
      { agent: "kepatuhan_proses", severity: "info" },
    ] as Array<{
      agent: Parameters<typeof temuanPerAgen>[0][number]["agent"];
      severity: string;
    }>;
    const rows = agentRows(findings as never, 4, false, [312, 18, 6, 4]);
    expect(rows).toHaveLength(4);
    const konflik = rows.find((r) => r.id === "konflik_kepentingan")!;
    expect(konflik.isDone).toBe(true);
    expect(konflik.showChip).toBe(true);
    expect(konflik.chip).toBe("1 temuan");
    const transaksi = rows.find((r) => r.id === "anomali_transaksi")!;
    expect(transaksi.showChip).toBe(false);
    expect(transaksi.showTime).toBe(true);
    expect(transaksi.metric).toContain("transaksi diperiksa");
  });
});

describe("keputusanTally", () => {
  it("adds the session vote onto the 9/3 baseline when the server has not recorded it", () => {
    expect(
      keputusanTally({ hasil: null, sudahMemilih: false }, "setuju"),
    ).toEqual({
      setuju: 10,
      tidak: 3,
    });
    expect(
      keputusanTally({ hasil: null, sudahMemilih: false }, "tidak"),
    ).toEqual({
      setuju: 9,
      tidak: 4,
    });
  });
  it("does not double-count once the server already recorded this member's vote", () => {
    // Full reload: server persisted the vote (sudahMemilih) and hasil already
    // includes it (10/3); the session still holds "setuju". Must stay 10/3.
    expect(
      keputusanTally(
        { hasil: { setuju: 10, tidak: 3 }, sudahMemilih: true },
        "setuju",
      ),
    ).toEqual({ setuju: 10, tidak: 3 });
  });
  it("passes the server result through when there is no session choice", () => {
    expect(
      keputusanTally(
        { hasil: { setuju: 10, tidak: 3 }, sudahMemilih: true },
        undefined,
      ),
    ).toEqual({ setuju: 10, tidak: 3 });
  });
});
