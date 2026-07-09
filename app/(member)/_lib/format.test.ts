import { describe, it, expect } from "vitest";
import {
  fmtRp,
  fmtJt,
  fmtTanggal,
  fmtTanggalPanjang,
  waktuSalam,
  easeOutCubic,
  countAt,
  nikValid,
  nikDigits,
  fmtTanggalPendek,
  barWidth,
  kasHeight,
  isi,
} from "../../../components/member/format";

describe("fmtRp", () => {
  it("formats with dot thousands and Rp prefix", () => {
    expect(fmtRp(600000)).toBe("Rp 600.000");
    expect(fmtRp(15000000)).toBe("Rp 15.000.000");
    expect(fmtRp(0)).toBe("Rp 0");
    expect(fmtRp(1200000)).toBe("Rp 1.200.000");
  });
  it("handles negatives", () => {
    expect(fmtRp(-11000000)).toBe("-Rp 11.000.000");
  });
});

describe("fmtJt", () => {
  it("renders millions with comma decimal and jt suffix", () => {
    expect(fmtJt(47500000)).toBe("47,5 jt");
    expect(fmtJt(58000000)).toBe("58,0 jt");
    expect(fmtJt(36500000)).toBe("36,5 jt");
  });
});

describe("fmtTanggal", () => {
  it("formats ISO date to Indonesian long day", () => {
    expect(fmtTanggal("2026-07-05")).toBe("5 Juli 2026");
    expect(fmtTanggal("2026-06-14")).toBe("14 Juni 2026");
  });
  it("passes through already-formatted strings", () => {
    expect(fmtTanggal("5 Juli 2026")).toBe("5 Juli 2026");
  });
});

describe("fmtTanggalPanjang", () => {
  it("includes weekday (2026-07-09 is Thursday)", () => {
    expect(fmtTanggalPanjang(new Date("2026-07-09T08:00:00"))).toBe(
      "Kamis, 9 Juli 2026",
    );
  });
});

describe("waktuSalam", () => {
  it("buckets the hour", () => {
    expect(waktuSalam(6)).toBe("pagi");
    expect(waktuSalam(10)).toBe("pagi");
    expect(waktuSalam(11)).toBe("siang");
    expect(waktuSalam(14)).toBe("siang");
    expect(waktuSalam(15)).toBe("sore");
    expect(waktuSalam(18)).toBe("sore");
    expect(waktuSalam(19)).toBe("malam");
    expect(waktuSalam(23)).toBe("malam");
  });
});

describe("count-up easing", () => {
  it("easeOutCubic endpoints", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875, 3);
  });
  it("countAt lands exactly on target at p=1", () => {
    expect(countAt(600000, 1)).toBe(600000);
    expect(countAt(600000, 0)).toBe(0);
    expect(countAt(600000, 0.5)).toBe(525000);
  });
});

describe("nik", () => {
  it("validates 16 digits", () => {
    expect(nikValid("3208010101010042")).toBe(true);
    expect(nikValid("320801")).toBe(false);
    expect(nikValid("32080101010100420")).toBe(false);
    expect(nikValid("3208abcd01010042")).toBe(false);
  });
  it("strips non-digits and caps at 16", () => {
    expect(nikDigits("32-08 0101")).toBe("32080101");
    expect(nikDigits("12345678901234567890")).toBe("1234567890123456");
    expect(nikDigits("abc")).toBe("");
  });
});

describe("bar geometry", () => {
  it("barWidth floors at 3 percent", () => {
    expect(barWidth(43600000, 43600000)).toBe("100%");
    expect(barWidth(1300000, 43600000)).toBe("3%");
    expect(barWidth(7800000, 43600000)).toBe("18%");
  });
  it("kasHeight is proportional without floor", () => {
    expect(kasHeight(58000000, 58000000)).toBe("100%");
    expect(kasHeight(36500000, 58000000)).toBe("63%");
  });
});

describe("fmtTanggalPendek", () => {
  it("drops the year", () => {
    expect(fmtTanggalPendek("2026-07-05")).toBe("5 Juli");
    expect(fmtTanggalPendek("2026-06-14")).toBe("14 Juni");
  });
});

describe("isi", () => {
  it("fills named placeholders and leaves unknown tokens intact", () => {
    expect(isi("Turun {persen}%", { persen: 37 })).toBe("Turun 37%");
    expect(
      isi("Sudah diangsur {sudah} dari {total}", {
        sudah: "Rp 800.000",
        total: "Rp 2.000.000",
      }),
    ).toBe("Sudah diangsur Rp 800.000 dari Rp 2.000.000");
    expect(isi("{n} anggota menanyakan hal yang sama", { n: 12 })).toBe(
      "12 anggota menanyakan hal yang sama",
    );
    expect(isi("halo {x}", {})).toBe("halo {x}");
  });
});
