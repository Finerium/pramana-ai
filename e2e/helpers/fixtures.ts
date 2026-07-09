/**
 * Base test terperluas (spec 14, AC-RES-01): setiap spec memakai `test` dari
 * sini. Fixture auto merekam uncaught pageerror dan unhandledrejection lintas
 * navigasi (via exposeFunction persisten) lalu MEMFAILKAN test bila ada.
 * Console error TIDAK difailkan global (beberapa alur menampilkan status HTTP
 * yang ditangani); clicksweep menegakkan nol console error secara lokal.
 */
import { test as base, expect } from "@playwright/test";

type ErrorSink = { pageErrors: string[]; consoleErrors: string[] };

export const test = base.extend<{ errorSink: ErrorSink }>({
  errorSink: [
    async ({ page }, use) => {
      const sink: ErrorSink = { pageErrors: [], consoleErrors: [] };
      const unhandled: string[] = [];

      page.on("pageerror", (e) => sink.pageErrors.push(String(e)));
      page.on("console", (m) => {
        if (m.type() === "error") sink.consoleErrors.push(m.text());
      });

      // exposeFunction persisten lintas navigasi; addInitScript memasang listener
      // di setiap dokumen baru sehingga rejection tidak hilang saat pindah halaman.
      await page.exposeFunction("__pwReportUnhandled", (reason: string) => {
        unhandled.push(reason);
      });
      await page.addInitScript(() => {
        window.addEventListener("unhandledrejection", (e) => {
          const w = window as unknown as {
            __pwReportUnhandled?: (r: string) => void;
          };
          w.__pwReportUnhandled?.(String((e as PromiseRejectionEvent).reason));
        });
      });

      await use(sink);

      expect(
        sink.pageErrors,
        `uncaught page error: ${sink.pageErrors.join(" | ")}`,
      ).toEqual([]);
      expect(
        unhandled,
        `unhandled promise rejection: ${unhandled.join(" | ")}`,
      ).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
