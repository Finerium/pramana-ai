"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { GovKoperasiDetail } from "@/app/(gov)/_logic/types";
import { AGENT_LABELS } from "@/lib/copy";
import { GOV_COPY } from "@/lib/copy/gov";
import { BENTUK } from "@/app/(gov)/_logic/verdict";
import {
  formatProfilLokasi,
  normalizeDetail,
  temuanRows,
  trenCells,
} from "@/app/(gov)/_logic/detail";
import { GovHeader } from "./GovHeader";
import { VerdictShape } from "./VerdictShape";

type Status = "memuat" | "default" | "kosong" | "gagal";
type Peri = "tersimpan" | "berjalan" | "langsung" | "gagal_langsung";

const PANEL = "gov-panel";
const POLL_MS = 2000;
const TIMEOUT_MS = 120000;

function tanggalPanjang(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

function Spinner({
  size = 14,
  onPrimary = false,
}: {
  size?: number;
  onPrimary?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border:
          "2px solid " +
          (onPrimary ? "var(--primary-foreground)" : "var(--border-hairline)"),
        borderTopColor: onPrimary ? "transparent" : "var(--primary)",
        animation: "prm-spin .9s linear infinite",
        display: "inline-block",
        flex: "none",
      }}
    />
  );
}

export function DetailClient({ id }: { id: string }) {
  const [status, setStatus] = useState<Status>("memuat");
  const [peri, setPeri] = useState<Peri>("tersimpan");
  const [data, setData] = useState<GovKoperasiDetail | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const deadline = useRef(0);

  const stopPoll = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  const muat = useCallback(async () => {
    setStatus("memuat");
    try {
      const res = await fetch(`/api/gov/koperasi/${id}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        setStatus("gagal");
        return;
      }
      const d = normalizeDetail(json.data);
      setData(d);
      setStatus(d.auditRun ? "default" : "kosong");
    } catch {
      setStatus("gagal");
    }
  }, [id]);

  useEffect(() => {
    // ponytail: fetch-on-mount; setState terjadi setelah await (bukan sinkron).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void muat();
    return stopPoll;
  }, [muat, stopPoll]);

  const poll = useCallback(
    async (runId: string) => {
      if (Date.now() > deadline.current) {
        stopPoll();
        // P2-08: refetch agar run tersimpan (bila ada) tampil bersama banner.
        await muat();
        setPeri("gagal_langsung");
        return;
      }
      try {
        const res = await fetch(`/api/audit/${runId}/status`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok || !json?.ok) return;
        const st = json.data.status as string;
        if (st === "selesai") {
          stopPoll();
          await muat();
          setStatus("default");
          setPeri("langsung");
        } else if (st === "gagal_langsung") {
          stopPoll();
          // P2-08: refetch; bila ada run tersimpan status flip ke default
          // sehingga banner gagal_langsung terlihat, bukan diam di kosong.
          await muat();
          setPeri("gagal_langsung");
        }
      } catch {
        /* pertahankan polling sampai deadline */
      }
    },
    [muat, stopPoll],
  );

  const jalankan = useCallback(async () => {
    if (peri === "berjalan") return;
    setPeri("berjalan");
    try {
      const res = await fetch("/api/gov/audit/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ koperasiId: id }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        setPeri("gagal_langsung");
        return;
      }
      const runId = json.data.auditRunId as string;
      deadline.current = Date.now() + TIMEOUT_MS;
      stopPoll();
      timer.current = setInterval(() => void poll(runId), POLL_MS);
    } catch {
      setPeri("gagal_langsung");
    }
  }, [peri, id, poll, stopPoll]);

  const berjalan = peri === "berjalan";
  const kosong = status === "kosong";
  const tampilKonten = status === "default" || status === "kosong";
  const nama = data?.profil.nama ?? "";

  return (
    <div
      style={{
        maxWidth: 1440,
        minWidth: 1240,
        margin: "0 auto",
        padding: "26px 48px 60px",
      }}
    >
      <GovHeader brandHref="/pemerintah" />

      <nav
        aria-label="Jejak navigasi"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          margin: "30px 0 18px",
          fontWeight: 600,
          fontSize: 12,
          lineHeight: 1,
        }}
      >
        <Link href="/pemerintah" style={{ textDecoration: "none" }}>
          {GOV_COPY["dt.breadcrumb.root"]}
        </Link>
        <span aria-hidden="true" style={{ color: "var(--muted-foreground)" }}>
          /
        </span>
        <span style={{ color: "var(--muted-foreground)" }}>{nama}</span>
      </nav>

      {status === "gagal" ? (
        <>
          <div
            role="alert"
            className="gov-well-sm"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              margin: "0 0 20px",
              padding: "14px 20px",
              borderRadius: 16,
              background: "var(--verdict-merah-surface)",
            }}
          >
            <VerdictShape bentuk={BENTUK.merah} size={12} />
            <div
              style={{
                fontWeight: 600,
                fontSize: 13,
                lineHeight: 1.5,
                color: "var(--verdict-merah)",
              }}
            >
              {GOV_COPY["dt.gagal.banner"]}
            </div>
            <div style={{ flex: 1 }} />
            <button
              type="button"
              onClick={() => void muat()}
              className="gov-primary"
              style={{
                padding: "11px 22px",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 12.5,
                lineHeight: 1,
              }}
            >
              {GOV_COPY["dt.gagal.cta"]}
            </button>
          </div>
          <div
            className={PANEL}
            style={{ padding: "64px 24px", textAlign: "center" }}
          >
            <div
              style={{
                fontWeight: 500,
                fontSize: 13,
                lineHeight: 1.5,
                color: "var(--muted-foreground)",
              }}
            >
              {GOV_COPY["dt.gagal.panel"]}
            </div>
          </div>
        </>
      ) : null}

      {status === "memuat" ? (
        <div
          aria-busy="true"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 40,
            justifyContent: "center",
          }}
        >
          <Spinner size={16} />
          <div
            style={{
              fontWeight: 600,
              fontSize: 12.5,
              lineHeight: 1,
              color: "var(--muted-foreground)",
            }}
          >
            {GOV_COPY["dt.memuat"]}
          </div>
        </div>
      ) : null}

      {tampilKonten && data ? (
        <>
          <div
            className={PANEL}
            style={{ display: "flex", gap: 28, padding: "26px 28px" }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1
                className="gov-disp"
                style={{
                  fontWeight: 800,
                  fontSize: 22,
                  lineHeight: 1.25,
                  letterSpacing: "-0.01em",
                  margin: 0,
                }}
              >
                {data.profil.nama}
              </h1>
              <div
                style={{
                  fontWeight: 500,
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  color: "var(--muted-foreground)",
                  marginTop: 8,
                }}
              >
                {formatProfilLokasi(data.profil)}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 16,
                  flexWrap: "wrap",
                }}
              >
                {data.profil.unitUsaha.map((u) => (
                  <span
                    key={u}
                    className="gov-well-sm"
                    style={{
                      padding: "8px 14px",
                      borderRadius: 999,
                      fontWeight: 600,
                      fontSize: 11.5,
                      lineHeight: 1,
                      color: "var(--muted-foreground)",
                    }}
                  >
                    {u}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ width: 400, flex: "none" }}>
              {status === "default" && data.auditRun ? (
                (() => {
                  const b = BENTUK[data.auditRun.verdict.warna];
                  return (
                    <>
                      <div
                        className="gov-well-sm"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "14px 18px",
                          borderRadius: 18,
                          background: b.surfaceVar,
                        }}
                      >
                        <VerdictShape bentuk={b} size={14} />
                        <div
                          className="gov-disp"
                          style={{
                            fontWeight: 800,
                            fontSize: 16,
                            lineHeight: 1,
                            color: b.colorVar,
                          }}
                        >
                          {b.label}
                        </div>
                        <div style={{ flex: 1 }} />
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 11,
                            lineHeight: 1,
                            color: b.colorVar,
                          }}
                        >
                          {GOV_COPY["dt.verdict.periode"]}
                        </div>
                      </div>
                      <div
                        style={{
                          fontWeight: 500,
                          fontSize: 13,
                          lineHeight: 1.6,
                          marginTop: 12,
                        }}
                      >
                        {data.auditRun.verdict.ringkasan}
                      </div>
                      <div
                        style={{
                          fontWeight: 500,
                          fontSize: 11.5,
                          lineHeight: 1.5,
                          color: "var(--muted-foreground)",
                          marginTop: 8,
                        }}
                      >
                        {GOV_COPY["dt.verdict.terakhir"]}{" "}
                        {tanggalPanjang(data.auditRun.dibuatPada)} ·{" "}
                        {data.temuan.length} temuan
                      </div>
                    </>
                  );
                })()
              ) : (
                <>
                  <div
                    className="gov-well-sm"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "14px 18px",
                      borderRadius: 18,
                      background: "var(--verdict-info-surface)",
                    }}
                  >
                    <VerdictShape bentuk={BENTUK.info} size={12} />
                    <div
                      className="gov-disp"
                      style={{
                        fontWeight: 800,
                        fontSize: 15,
                        lineHeight: 1,
                        color: "var(--muted-foreground)",
                      }}
                    >
                      {GOV_COPY["dt.kosong.chip"]}
                    </div>
                  </div>
                  <div
                    style={{
                      fontWeight: 500,
                      fontSize: 12.5,
                      lineHeight: 1.6,
                      color: "var(--muted-foreground)",
                      marginTop: 12,
                    }}
                  >
                    {GOV_COPY["dt.kosong.teks"]}
                  </div>
                </>
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: 20,
            }}
          >
            <button
              type="button"
              onClick={() => void jalankan()}
              aria-disabled={berjalan}
              className="gov-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 9,
                padding: "14px 26px",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 13,
                lineHeight: 1,
                opacity: berjalan ? 0.75 : 1,
              }}
            >
              {berjalan ? <Spinner onPrimary /> : null}
              {berjalan
                ? GOV_COPY["dt.jalankan.berjalan"]
                : kosong
                  ? GOV_COPY["dt.jalankan.pertama"]
                  : GOV_COPY["dt.jalankan"]}
            </button>

            {status === "default" && peri === "tersimpan" ? (
              <div
                className="gov-well-sm"
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "13px 20px",
                  borderRadius: 999,
                }}
              >
                <VerdictShape bentuk={BENTUK.info} size={10} />
                <span
                  style={{ fontWeight: 700, fontSize: 12.5, lineHeight: 1.4 }}
                >
                  {GOV_COPY["dt.sumber.tersimpan"]}
                </span>
                <span
                  style={{
                    fontWeight: 500,
                    fontSize: 12,
                    lineHeight: 1.4,
                    color: "var(--muted-foreground)",
                  }}
                >
                  {GOV_COPY["dt.sumber.arsipPrefix"]},{" "}
                  {data.auditRun
                    ? tanggalPanjang(data.auditRun.dibuatPada)
                    : ""}
                </span>
              </div>
            ) : null}

            {berjalan ? (
              <div
                role="status"
                className="gov-well-sm"
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "13px 20px",
                  borderRadius: 999,
                }}
              >
                <span
                  style={{ fontWeight: 600, fontSize: 12.5, lineHeight: 1.4 }}
                >
                  {GOV_COPY["dt.sumber.berjalan"]}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    borderRadius: 999,
                    background: "var(--background)",
                    overflow: "hidden",
                    minWidth: 120,
                  }}
                >
                  <div
                    style={{
                      width: "40%",
                      height: "100%",
                      borderRadius: 999,
                      background: "var(--primary)",
                      animation: "prm-slide 1.4s ease-in-out infinite",
                    }}
                  />
                </div>
              </div>
            ) : null}

            {status === "default" && peri === "langsung" ? (
              <div
                role="status"
                className="gov-well-sm"
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "13px 20px",
                  borderRadius: 999,
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "var(--primary)",
                    flex: "none",
                  }}
                />
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 12.5,
                    lineHeight: 1.4,
                    color: "var(--primary)",
                  }}
                >
                  {GOV_COPY["dt.sumber.langsung"]}
                </span>
              </div>
            ) : null}

            {status === "default" && peri === "gagal_langsung" ? (
              <div
                role="alert"
                className="gov-well-sm"
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "13px 20px",
                  borderRadius: 999,
                  background: "var(--verdict-merah-surface)",
                }}
              >
                <VerdictShape bentuk={BENTUK.merah} size={11} />
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 12.5,
                    lineHeight: 1.4,
                    color: "var(--verdict-merah)",
                  }}
                >
                  {GOV_COPY["dt.sumber.gagal"]}
                </span>
              </div>
            ) : null}
          </div>

          <div className={PANEL} style={{ padding: "20px 24px 22px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
              <div
                className="gov-disp"
                style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1 }}
              >
                {GOV_COPY["dt.tren.judul"]}
              </div>
              <div
                style={{
                  fontWeight: 500,
                  fontSize: 11.5,
                  lineHeight: 1,
                  color: "var(--muted-foreground)",
                }}
              >
                {GOV_COPY["dt.tren.sub"]}
              </div>
            </div>
            {status === "default" && data.tren.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(6,1fr)",
                  gap: 14,
                  marginTop: 16,
                }}
              >
                {trenCells(data.tren).map((c, i) => (
                  <div
                    key={`${c.bulanPenuh}-${i}`}
                    title={`Verdict ${c.bentuk.label}, ${c.bulanPenuh} 2026`}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 11,
                        lineHeight: 1,
                        color: "var(--muted-foreground)",
                        textAlign: "center",
                      }}
                    >
                      {c.bulan}
                    </div>
                    <div
                      className="gov-well-sm"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        marginTop: 8,
                        padding: "11px 8px",
                        borderRadius: 14,
                        background: c.bentuk.surfaceVar,
                      }}
                    >
                      <VerdictShape bentuk={c.bentuk} size={10} />
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 12,
                          lineHeight: 1,
                          color: c.bentuk.colorVar,
                        }}
                      >
                        {c.bentuk.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  fontWeight: 500,
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  color: "var(--muted-foreground)",
                  marginTop: 14,
                }}
              >
                {GOV_COPY["dt.tren.kosong"]}
              </div>
            )}
          </div>

          <div className={PANEL} style={{ padding: "8px 0 6px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 14,
                padding: "14px 24px 12px",
              }}
            >
              <div
                className="gov-disp"
                style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}
              >
                {GOV_COPY["dt.temuan.judul"]}
              </div>
              {status === "default" ? (
                <div
                  style={{
                    fontWeight: 500,
                    fontSize: 11.5,
                    lineHeight: 1.4,
                    color: "var(--muted-foreground)",
                  }}
                >
                  {data.temuan.length} temuan, {GOV_COPY["dt.temuan.sub.tail"]}
                </div>
              ) : null}
            </div>
            {status === "default" && data.temuan.length > 0 ? (
              <>
                <div
                  className="gov-disp"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2.4fr 1fr 0.7fr 0.6fr",
                    gap: 18,
                    padding: "4px 24px 10px",
                    fontWeight: 700,
                    fontSize: 10.5,
                    lineHeight: 1,
                    letterSpacing: "0.11em",
                    color: "var(--muted-foreground)",
                  }}
                >
                  <div>{GOV_COPY["dt.temuan.header.temuan"]}</div>
                  <div>{GOV_COPY["dt.temuan.header.agen"]}</div>
                  <div>{GOV_COPY["dt.temuan.header.tingkat"]}</div>
                  <div style={{ textAlign: "right", paddingRight: 14 }}>
                    {GOV_COPY["dt.temuan.header.bukti"]}
                  </div>
                </div>
                {temuanRows(data.temuan).map((row) => {
                  const f = row.finding;
                  const isRat =
                    f.pertanyaan_rat.includes("Rapat Anggota Tahunan") ||
                    f.judul.includes("Rapat Anggota Tahunan");
                  return (
                    <div
                      key={f.id}
                      style={{
                        borderTop: "1px solid var(--border-hairline)",
                        padding: "15px 24px",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "2.4fr 1fr 0.7fr 0.6fr",
                          gap: 18,
                          alignItems: "start",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 13.5,
                              lineHeight: 1.45,
                            }}
                          >
                            {isRat ? (
                              <abbr title={GOV_COPY["dt.rat.title"]}>
                                {f.judul}
                              </abbr>
                            ) : (
                              f.judul
                            )}
                          </div>
                          <div
                            style={{
                              fontWeight: 400,
                              fontSize: 12,
                              lineHeight: 1.55,
                              color: "var(--muted-foreground)",
                              marginTop: 5,
                            }}
                          >
                            {f.penjelasan_awam}
                          </div>
                        </div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 12.5,
                            lineHeight: 1.4,
                            color: "var(--muted-foreground)",
                            paddingTop: 2,
                          }}
                        >
                          {AGENT_LABELS.pemerintah[f.agent]}
                        </div>
                        <div>
                          <span
                            className="gov-well-sm"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 7,
                              padding: "7px 13px",
                              borderRadius: 999,
                            }}
                          >
                            <VerdictShape bentuk={row.bentuk} size={10} />
                            <span
                              style={{
                                fontWeight: 700,
                                fontSize: 11.5,
                                lineHeight: 1,
                                color: row.bentuk.colorVar,
                              }}
                            >
                              {row.bentuk.label}
                            </span>
                          </span>
                        </div>
                        <div
                          className="gov-num"
                          style={{
                            fontWeight: 600,
                            fontSize: 12.5,
                            lineHeight: 1.4,
                            textAlign: "right",
                            paddingRight: 14,
                            paddingTop: 2,
                          }}
                        >
                          {row.bukti}
                        </div>
                      </div>
                      {f.tanggapanPengurus ? (
                        <div
                          className="gov-well-sm"
                          style={{
                            marginTop: 12,
                            padding: "13px 18px",
                            borderRadius: 14,
                          }}
                        >
                          <div
                            className="gov-disp"
                            style={{
                              fontWeight: 700,
                              fontSize: 9.5,
                              lineHeight: 1,
                              letterSpacing: "0.13em",
                              color: "var(--muted-foreground)",
                            }}
                          >
                            {GOV_COPY["dt.tanggapan.label"]}
                          </div>
                          <div
                            style={{
                              fontWeight: 400,
                              fontSize: 12.5,
                              lineHeight: 1.6,
                              marginTop: 7,
                            }}
                          >
                            {f.tanggapanPengurus}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </>
            ) : status === "kosong" ? (
              <div style={{ padding: "40px 24px 44px", textAlign: "center" }}>
                <div
                  className="gov-disp"
                  style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}
                >
                  {GOV_COPY["dt.temuan.kosong.judul"]}
                </div>
                <div
                  style={{
                    fontWeight: 500,
                    fontSize: 12.5,
                    lineHeight: 1.6,
                    color: "var(--muted-foreground)",
                    marginTop: 8,
                  }}
                >
                  {GOV_COPY["dt.temuan.kosong.sub"]}
                </div>
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
