/**
 * P2-09: GOV_COPY me-mirror string beku 6.15 (impor melingkar index<->gov
 * dihindari). Test ini mengunci mirror = COPY supaya tidak bisa drift.
 */
import { describe, expect, it } from "vitest";
import { COPY } from "./index";
import { GOV_COPY } from "./gov";

describe("mirror string beku 6.15 di GOV_COPY", () => {
  it("nilai mirror identik dengan COPY", () => {
    expect(GOV_COPY["dt.sumber.tersimpan"]).toBe("Hasil pemeriksaan tersimpan");
    expect(GOV_COPY["dt.sumber.berjalan"]).toBe(COPY["audit.jalan"]);
    expect(GOV_COPY["dt.sumber.langsung"]).toBe(COPY["banner.live"]);
    expect(GOV_COPY["dt.sumber.gagal"]).toBe(COPY["audit.gagal"]);
    expect(GOV_COPY["login.err"]).toBe(COPY["login.err"]);
  });
});
