import { describe, it, expect } from "vitest";
import {
  sortKoperasi,
  filterKoperasi,
  nextSort,
  DEFAULT_DIR,
  kpiSubPersen,
  tersebarCount,
  deriveDistribusi,
  buildTren,
  sparklinePoints,
  sparklineFromSeri,
  formatDelta,
  bulanDari,
  periodeLabelDari,
  heroKalimat,
  fmtDeltaTetap,
  deltaKpi,
  deltaRingkasTeks,
  segmenLabel,
  worstWarna,
  trenChart,
} from "./overview";
import type { KoperasiRow } from "./overview";
import type { OverviewTrenPoint, TrenRun } from "./types";

const trp = (
  periode: string,
  hijau: number,
  kuning: number,
  merah: number,
  temuan: number,
): OverviewTrenPoint => ({ periode, hijau, kuning, merah, temuan });

const tp = (periode: string, temuan: number): OverviewTrenPoint => ({
  periode,
  hijau: 0,
  kuning: 0,
  merah: 0,
  temuan,
});

const DATA: KoperasiRow[] = [
  {
    id: "kop-sukamaju",
    nama: "Koperasi Desa Merah Putih Sukamaju",
    provinsi: "Jawa Barat",
    verdictWarna: "merah",
    temuanCount: 6,
  },
  {
    id: "kop-lembahsari",
    nama: "Koperasi Desa Merah Putih Lembah Sari",
    provinsi: "Sumatera Barat",
    verdictWarna: "merah",
    temuanCount: 4,
  },
  {
    id: "kop-cempakawangi",
    nama: "Koperasi Desa Merah Putih Cempaka Wangi",
    provinsi: "Lampung",
    verdictWarna: "kuning",
    temuanCount: 2,
  },
  {
    id: "kop-wanasaba",
    nama: "Koperasi Desa Merah Putih Wanasaba",
    provinsi: "Nusa Tenggara Barat",
    verdictWarna: "kuning",
    temuanCount: 2,
  },
  {
    id: "kop-batulicin",
    nama: "Koperasi Desa Merah Putih Batulicin",
    provinsi: "Kalimantan Selatan",
    verdictWarna: "kuning",
    temuanCount: 1,
  },
  {
    id: "kop-airmolek",
    nama: "Koperasi Desa Merah Putih Air Molek",
    provinsi: "Riau",
    verdictWarna: "kuning",
    temuanCount: 1,
  },
  {
    id: "kop-mekarsari",
    nama: "Koperasi Desa Merah Putih Mekarsari",
    provinsi: "Jawa Barat",
    verdictWarna: "hijau",
    temuanCount: 0,
  },
  {
    id: "kop-tirtayasa",
    nama: "Koperasi Desa Merah Putih Tirtayasa",
    provinsi: "Banten",
    verdictWarna: "hijau",
    temuanCount: 0,
  },
  {
    id: "kop-argomulyo",
    nama: "Koperasi Desa Merah Putih Argomulyo",
    provinsi: "Jawa Tengah",
    verdictWarna: "hijau",
    temuanCount: 0,
  },
  {
    id: "kop-sidodadi",
    nama: "Koperasi Desa Merah Putih Sidodadi",
    provinsi: "Jawa Timur",
    verdictWarna: "hijau",
    temuanCount: 1,
  },
  {
    id: "kop-karangasem",
    nama: "Koperasi Desa Merah Putih Karangasem",
    provinsi: "Bali",
    verdictWarna: "hijau",
    temuanCount: 0,
  },
  {
    id: "kop-mattirowalie",
    nama: "Koperasi Desa Merah Putih Mattiro Walie",
    provinsi: "Sulawesi Selatan",
    verdictWarna: "hijau",
    temuanCount: 0,
  },
];

describe("sortKoperasi default verdict desc (tie: temuan desc, lalu nama asc)", () => {
  it("menghasilkan urutan bundle", () => {
    const out = sortKoperasi(DATA, "verdictWarna", "desc").map((r) => r.id);
    expect(out).toEqual([
      "kop-sukamaju",
      "kop-lembahsari",
      "kop-cempakawangi",
      "kop-wanasaba",
      "kop-airmolek",
      "kop-batulicin",
      "kop-sidodadi",
      "kop-argomulyo",
      "kop-karangasem",
      "kop-mattirowalie",
      "kop-mekarsari",
      "kop-tirtayasa",
    ]);
  });
  it("temuan asc menempatkan hijau nol paling atas", () => {
    const out = sortKoperasi(DATA, "temuanCount", "asc").map(
      (r) => r.temuanCount,
    );
    expect(out[0]).toBe(0);
    expect(out[out.length - 1]).toBe(6);
  });
  it("nama asc urut alfabet Indonesia", () => {
    const out = sortKoperasi(DATA, "nama", "asc").map((r) => r.id);
    expect(out[0]).toBe("kop-airmolek");
  });
});

describe("nextSort toggling", () => {
  it("kolom sama membalik arah", () => {
    expect(
      nextSort({ key: "verdictWarna", dir: "desc" }, "verdictWarna"),
    ).toEqual({ key: "verdictWarna", dir: "asc" });
  });
  it("kolom baru memakai arah default", () => {
    expect(nextSort({ key: "verdictWarna", dir: "desc" }, "nama")).toEqual({
      key: "nama",
      dir: DEFAULT_DIR.nama,
    });
    expect(nextSort({ key: "nama", dir: "asc" }, "temuanCount")).toEqual({
      key: "temuanCount",
      dir: "desc",
    });
  });
});

describe("filterKoperasi nama + provinsi", () => {
  it("cocok provinsi", () => {
    expect(filterKoperasi(DATA, "jawa").length).toBe(4);
  });
  it("cocok nama, tanpa peduli huruf besar", () => {
    expect(filterKoperasi(DATA, "SUKAMAJU").map((r) => r.id)).toEqual([
      "kop-sukamaju",
    ]);
  });
  it("kosong mengembalikan semua", () => {
    expect(filterKoperasi(DATA, "  ").length).toBe(12);
  });
});

describe("derivasi KPI", () => {
  it("persen dibulatkan", () => {
    expect(kpiSubPersen(6, 12)).toBe("50 persen dari total");
    expect(kpiSubPersen(4, 12)).toBe("33 persen dari total");
    expect(kpiSubPersen(2, 12)).toBe("17 persen dari total");
  });
  it("temuan terbuka tersebar di 7 koperasi", () => {
    expect(tersebarCount(DATA)).toBe(7);
  });
  it("distribusi hijau/kuning/merah dengan persen", () => {
    const d = deriveDistribusi({
      jumlahKoperasi: 12,
      hijau: 6,
      kuning: 4,
      merah: 2,
      temuanTerbuka: 17,
    });
    expect(d.map((s) => s.warna)).toEqual(["hijau", "kuning", "merah"]);
    expect(d.map((s) => s.count)).toEqual([6, 4, 2]);
    expect(d.map((s) => s.persen)).toEqual([50, 33, 17]);
  });
});

describe("buildTren agregasi nasional", () => {
  const ids = ["a", "b", "c"];
  const periods = ["2026-01", "2026-02"];
  const run = (
    koperasiId: string,
    periode: string,
    verdictWarna: TrenRun["verdictWarna"],
    temuanCount: number,
  ): [string, TrenRun] => [
    `${koperasiId}|${periode}`,
    { koperasiId, periode, verdictWarna, temuanCount },
  ];

  it("hitung sebaran verdict + total temuan per periode", () => {
    const map = new Map<string, TrenRun>([
      run("a", "2026-01", "kuning", 2),
      run("b", "2026-01", "merah", 4),
      // c tanpa run 2026-01, seluruhnya tanpa run 2026-02
    ]);
    const tren = buildTren(ids, periods, map);
    expect(tren).toHaveLength(2);
    expect(tren[0]).toEqual({
      periode: "2026-01",
      hijau: 1,
      kuning: 1,
      merah: 1,
      temuan: 6,
    });
    // periode tanpa run: semua koperasi jatuh ke hijau 0 temuan.
    expect(tren[1]).toEqual({
      periode: "2026-02",
      hijau: 3,
      kuning: 0,
      merah: 0,
      temuan: 0,
    });
  });

  it("hijau + kuning + merah selalu = jumlah koperasi", () => {
    const tren = buildTren(ids, periods, new Map());
    for (const p of tren) expect(p.hijau + p.kuning + p.merah).toBe(ids.length);
  });
});

describe("sparklinePoints", () => {
  it("deret naik: nilai terendah di dasar, tertinggi di puncak (y dibalik)", () => {
    const pts = sparklinePoints(
      [tp("2026-01", 1), tp("2026-02", 2), tp("2026-03", 3)],
      "temuan",
    );
    expect(pts).toEqual([
      { x: 0, y: 28 },
      { x: 50, y: 14 },
      { x: 100, y: 0 },
    ]);
  });

  it("deret datar ke garis tengah", () => {
    const pts = sparklinePoints([tp("2026-01", 5), tp("2026-02", 5)], "temuan");
    expect(pts).toEqual([
      { x: 0, y: 14 },
      { x: 100, y: 14 },
    ]);
  });

  it("satu titik dan deret kosong aman", () => {
    expect(sparklinePoints([tp("2026-01", 9)], "temuan")).toEqual([
      { x: 0, y: 14 },
    ]);
    expect(sparklinePoints([], "temuan")).toEqual([]);
  });

  it("opsi width/height dihormati", () => {
    const pts = sparklinePoints(
      [tp("2026-01", 0), tp("2026-02", 10)],
      "temuan",
      {
        width: 60,
        height: 10,
      },
    );
    expect(pts).toEqual([
      { x: 0, y: 10 },
      { x: 60, y: 0 },
    ]);
  });
});

describe("formatDelta", () => {
  it("tanda eksplisit tanpa em dash", () => {
    expect(formatDelta(3)).toBe("+3");
    expect(formatDelta(0)).toBe("0");
    expect(formatDelta(-2)).toBe("-2");
  });
});

describe("bulanDari / periodeLabelDari", () => {
  it("uraikan YYYY-MM ke bulan Indonesia", () => {
    expect(bulanDari("2026-06")).toEqual({
      nama: "Juni",
      singkat: "Jun",
      tahun: "2026",
    });
    expect(bulanDari("2026-01").nama).toBe("Januari");
    expect(periodeLabelDari("2026-06")).toBe("Juni 2026");
  });
});

describe("heroKalimat", () => {
  it("merah > 0 memakai sapaan Anda", () => {
    expect(heroKalimat({ hijau: 6, kuning: 4, merah: 2 })).toBe(
      "2 koperasi merah menunggu tindak lanjut Anda.",
    );
  });
  it("hanya kuning", () => {
    expect(heroKalimat({ hijau: 9, kuning: 3, merah: 0 })).toBe(
      "Tidak ada koperasi merah. 3 koperasi kuning dalam pemantauan.",
    );
  });
  it("semua hijau", () => {
    expect(heroKalimat({ hijau: 12, kuning: 0, merah: 0 })).toBe(
      "Seluruh koperasi dalam kondisi baik.",
    );
  });
});

describe("fmtDeltaTetap + deltaKpi", () => {
  it("nol menjadi tetap", () => {
    expect(fmtDeltaTetap(0)).toBe("tetap");
    expect(fmtDeltaTetap(3)).toBe("+3");
    expect(fmtDeltaTetap(-2)).toBe("-2");
  });
  it("kenaikan merah itu buruk (merah)", () => {
    const d = deltaKpi(1, true);
    expect(d).toMatchObject({
      teks: "+1",
      turun: false,
      warnaVar: "var(--verdict-merah)",
    });
  });
  it("penurunan hijau itu buruk (merah), panah turun", () => {
    const d = deltaKpi(-1, false);
    expect(d).toMatchObject({
      teks: "-1",
      turun: true,
      warnaVar: "var(--verdict-merah)",
    });
  });
  it("kenaikan hijau itu baik (hijau)", () => {
    expect(deltaKpi(2, false).warnaVar).toBe("var(--verdict-hijau)");
  });
  it("nol berwarna redup", () => {
    expect(deltaKpi(0, true)).toMatchObject({
      teks: "tetap",
      nol: true,
      warnaVar: "var(--muted-foreground)",
    });
  });
});

describe("deltaRingkasTeks", () => {
  it("dengan bulan sebelumnya (kuning tetap)", () => {
    expect(
      deltaRingkasTeks(
        { hijau: -1, kuning: 0, merah: 1, temuanTerbuka: 5 },
        "Mei",
      ),
    ).toBe("Dibanding Mei: merah +1, kuning tetap, temuan +5");
  });
  it("periode paling awal", () => {
    expect(
      deltaRingkasTeks(
        { hijau: 0, kuning: 0, merah: 0, temuanTerbuka: 0 },
        null,
      ),
    ).toBe("Awal periode pemantauan");
  });
});

describe("segmenLabel", () => {
  it("segmen sempit hanya angka", () => {
    expect(segmenLabel("merah", 2, 12)).toBe("2");
  });
  it("segmen lebar angka + warna", () => {
    expect(segmenLabel("hijau", 6, 12)).toBe("6 hijau");
    expect(segmenLabel("kuning", 4, 12)).toBe("4 kuning");
  });
});

describe("worstWarna", () => {
  it("merah menang", () =>
    expect(worstWarna({ merah: 2, kuning: 4 })).toBe("merah"));
  it("kuning tanpa merah", () =>
    expect(worstWarna({ merah: 0, kuning: 3 })).toBe("kuning"));
  it("hijau bila nol", () =>
    expect(worstWarna({ merah: 0, kuning: 0 })).toBe("hijau"));
});

describe("sparklineFromSeri", () => {
  it("deret naik y dibalik", () => {
    expect(sparklineFromSeri([1, 2, 3])).toEqual([
      { x: 0, y: 28 },
      { x: 50, y: 14 },
      { x: 100, y: 0 },
    ]);
  });
});

describe("trenChart geometri", () => {
  const tren = [
    trp("2026-01", 9, 3, 0, 5),
    trp("2026-02", 8, 4, 0, 8),
    trp("2026-03", 6, 4, 2, 17),
  ];
  it("satu titik per periode, x menaik", () => {
    const g = trenChart(tren, 2);
    expect(g.garis.hijau.split(" ")).toHaveLength(3);
    expect(g.kolomX[0]).toBeLessThan(g.kolomX[1] ?? 0);
    expect(g.kolomX[1] ?? 0).toBeLessThan(g.kolomX[2] ?? 0);
  });
  it("titik tidak meluber dari kotak vertikal", () => {
    const g = trenChart(tren, 2);
    for (const t of g.titik) {
      expect(t.y).toBeGreaterThanOrEqual(18);
      expect(t.y).toBeLessThanOrEqual(194);
    }
  });
  it("markerX menyorot periode aktif; balok temuan tertinggi = temuan terbesar", () => {
    const g = trenChart(tren, 2);
    expect(g.markerX).not.toBeNull();
    expect(g.bar).toHaveLength(3);
    const tertinggi = Math.max(...g.bar.map((b) => b.h));
    expect(g.bar[2]?.h).toBe(tertinggi);
  });
});
