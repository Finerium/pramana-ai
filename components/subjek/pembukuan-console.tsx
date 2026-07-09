"use client";
import {
  useEffect,
  useState,
  type CSSProperties,
  type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import { COPY } from "@/lib/copy";
import { SUBJEK_COPY, JENIS_LABEL } from "@/lib/copy/subjek";
import { ThemeToggle } from "./theme";
import {
  fetchRecent,
  postTransaksi,
  postPinjaman,
  postRat,
  logout,
} from "./api";
import {
  emptyTransaksi,
  emptyPinjaman,
  validateTransaksi,
  validatePinjaman,
  deriveArah,
  formatRp,
  formatTanggal,
  isRawAmountValid,
  presetKonflik,
  presetPecah,
  presetKas,
  presetPlafon,
  SEED_SALDO,
  SEED_TRANSAKSI,
  SEED_PINJAMAN,
  SEED_ANGGOTA,
  type TransaksiForm,
  type PinjamanForm,
  type RatForm,
  type TransaksiEntry,
  type PinjamanEntry,
  type AnggotaOption,
} from "./logic";

const SANS = "var(--font-sans)";
const MONO = "var(--font-mono)";
type FieldEvent = ChangeEvent<
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
>;

// ---- style tokens (var()-based; .dark override handles theme) ---------------
const inputBase: CSSProperties = {
  width: "100%",
  minHeight: "46px",
  boxSizing: "border-box",
  fontFamily: SANS,
  fontSize: "15px",
  color: "var(--color-ink-strong)",
  background: "var(--color-surface-sunken)",
  border: "1px solid var(--color-border-strong)",
  borderRadius: "10px",
  padding: "11px 14px",
  outline: "none",
};
const dangerOverride: CSSProperties = {
  borderColor: "var(--color-danger)",
  background: "var(--color-danger-soft)",
};
const mkInput = (err: boolean): CSSProperties =>
  err ? { ...inputBase, ...dangerOverride } : inputBase;
const selectBase: CSSProperties = {
  ...inputBase,
  appearance: "none",
  WebkitAppearance: "none",
  paddingRight: "38px",
  cursor: "pointer",
};
const mkSelect = (err: boolean): CSSProperties =>
  err ? { ...selectBase, ...dangerOverride } : selectBase;
const textareaBase: CSSProperties = {
  ...inputBase,
  minHeight: "92px",
  resize: "vertical",
  lineHeight: 1.5,
};
const mkTextarea = (err: boolean): CSSProperties =>
  err ? { ...textareaBase, ...dangerOverride } : textareaBase;
const mkRpWrap = (err: boolean): CSSProperties => ({
  display: "flex",
  alignItems: "stretch",
  border:
    "1px solid " + (err ? "var(--color-danger)" : "var(--color-border-strong)"),
  borderRadius: "10px",
  overflow: "hidden",
  background: err ? "var(--color-danger-soft)" : "var(--color-surface-sunken)",
});
const mkTrack = (on: boolean): CSSProperties => ({
  width: "48px",
  height: "28px",
  minWidth: "48px",
  borderRadius: "999px",
  background: on ? "var(--color-primary)" : "var(--color-border-strong)",
  position: "relative",
  cursor: "pointer",
  border: "none",
  padding: 0,
  transition: "background .18s ease",
  flex: "none",
});
const mkThumb = (on: boolean): CSSProperties => ({
  position: "absolute",
  top: "3px",
  left: on ? "23px" : "3px",
  width: "22px",
  height: "22px",
  borderRadius: "50%",
  background: "var(--color-on-primary)",
  transition: "left .18s ease",
  boxShadow: "0 1px 3px rgba(0,0,0,0.35)",
});
const mkSeg = (active: boolean): CSSProperties => ({
  fontFamily: SANS,
  fontSize: "12px",
  fontWeight: 600,
  padding: "6px 14px",
  borderRadius: "7px",
  border: "none",
  cursor: "pointer",
  minHeight: "34px",
  background: active ? "var(--color-surface)" : "transparent",
  color: active ? "var(--color-ink-strong)" : "var(--color-muted)",
  boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
});
const mkChip = (synced: boolean): CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "11px",
  fontWeight: 600,
  borderRadius: "999px",
  padding: "4px 9px",
  whiteSpace: "nowrap",
  color: synced ? "var(--color-on-sync-soft)" : "var(--color-on-pending-soft)",
  background: synced ? "var(--color-sync-soft)" : "var(--color-pending-soft)",
});
const mkDot = (synced: boolean): CSSProperties => ({
  width: "6px",
  height: "6px",
  borderRadius: "50%",
  background: synced ? "var(--color-sync)" : "var(--color-pending)",
});

const S: Record<string, CSSProperties> = {
  header: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    background: "var(--color-surface)",
    borderBottom: "1px solid var(--color-border)",
  },
  redbar: { height: "3px", background: "var(--color-primary)" },
  headerInner: {
    maxWidth: "1320px",
    margin: "0 auto",
    padding: "15px 32px",
    display: "flex",
    alignItems: "center",
    gap: "24px",
    flexWrap: "wrap",
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    flex: "1 1 300px",
    minWidth: 0,
  },
  emblem: {
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid var(--color-border-strong)",
    flex: "none",
    display: "flex",
    flexDirection: "column",
  },
  emblemRed: { height: "50%", background: "var(--color-primary)" },
  emblemWhite: { height: "50%", background: "var(--color-surface)" },
  title: {
    fontSize: "17px",
    fontWeight: 600,
    color: "var(--color-ink-strong)",
    letterSpacing: "-0.01em",
    lineHeight: 1.15,
  },
  simTag: {
    fontSize: "10.5px",
    fontWeight: 600,
    color: "var(--color-on-primary-soft)",
    background: "var(--color-primary-soft)",
    borderRadius: "999px",
    padding: "2px 9px",
    letterSpacing: "0.02em",
  },
  sub: { fontSize: "12.5px", color: "var(--color-muted)", marginTop: "2px" },
  saldoWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "2px",
  },
  saldoLabel: {
    fontFamily: MONO,
    fontSize: "10px",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--color-muted)",
  },
  saldoVal: {
    fontFamily: MONO,
    fontWeight: 600,
    fontSize: "30px",
    color: "var(--color-ink-strong)",
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "-0.01em",
    lineHeight: 1.1,
  },
  koperasiName: { fontSize: "11.5px", color: "var(--color-faint)" },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  syncChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--color-on-sync-soft)",
    background: "var(--color-sync-soft)",
    borderRadius: "999px",
    padding: "7px 13px",
  },
  syncDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "var(--color-sync)",
  },
  ghostBtn: {
    minHeight: "42px",
    padding: "0 16px",
    borderRadius: "10px",
    border: "1px solid var(--color-border-strong)",
    background: "var(--color-surface)",
    color: "var(--color-ink)",
    cursor: "pointer",
    fontSize: "13.5px",
    fontWeight: 600,
    fontFamily: SANS,
  },
  container: {
    maxWidth: "1320px",
    margin: "0 auto",
    padding: "28px 32px 56px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(0,1fr) 356px",
    gap: "24px",
    alignItems: "start",
  },
  colLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    minWidth: 0,
  },
  colRight: { display: "flex", flexDirection: "column", gap: "24px" },
  card: {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "16px",
    padding: "26px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
  },
  cardHead: { marginBottom: "20px" },
  cardTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "var(--color-ink-strong)",
    letterSpacing: "-0.01em",
  },
  cardDesc: {
    fontSize: "13px",
    color: "var(--color-muted)",
    marginTop: "5px",
    lineHeight: 1.5,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "18px",
  },
  field: { display: "flex", flexDirection: "column", gap: "7px" },
  fieldFull: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    gridColumn: "1 / -1",
  },
  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--color-ink)",
    display: "flex",
    gap: "6px",
    alignItems: "baseline",
  },
  reqMark: {
    fontSize: "10px",
    fontWeight: 600,
    color: "var(--color-on-primary-soft)",
    background: "var(--color-primary-soft)",
    borderRadius: "4px",
    padding: "1px 6px",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  optMark: { fontSize: "11px", fontWeight: 400, color: "var(--color-faint)" },
  helper: { fontSize: "12px", color: "var(--color-muted)", lineHeight: 1.45 },
  echo: {
    fontFamily: MONO,
    fontSize: "12.5px",
    color: "var(--color-ink)",
    fontWeight: 500,
    fontVariantNumeric: "tabular-nums",
  },
  errText: {
    fontSize: "12px",
    color: "var(--color-danger)",
    fontWeight: 500,
    display: "flex",
    gap: "7px",
    alignItems: "flex-start",
    lineHeight: 1.4,
  },
  errIcon: {
    flex: "none",
    width: "15px",
    height: "15px",
    borderRadius: "50%",
    background: "var(--color-danger)",
    color: "var(--color-on-primary)",
    fontSize: "11px",
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
  },
  okIcon: {
    flex: "none",
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    background: "var(--color-sync)",
    color: "var(--color-on-primary)",
    fontSize: "10px",
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "1px",
  },
  selWrap: { position: "relative" },
  chev: {
    position: "absolute",
    right: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    color: "var(--color-muted)",
    fontSize: "11px",
  },
  rpPrefix: {
    display: "flex",
    alignItems: "center",
    padding: "0 13px",
    fontFamily: MONO,
    fontSize: "15px",
    color: "var(--color-muted)",
    background: "var(--color-surface-raised)",
    borderRight: "1px solid var(--color-border)",
  },
  rpInput: {
    flex: 1,
    minWidth: 0,
    border: "none",
    background: "transparent",
    minHeight: "46px",
    fontFamily: MONO,
    fontSize: "16px",
    color: "var(--color-ink-strong)",
    fontVariantNumeric: "tabular-nums",
    padding: "11px 14px",
    outline: "none",
  },
  formActions: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "22px",
    flexWrap: "wrap",
  },
  btnGhost: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "46px",
    padding: "0 20px",
    fontFamily: SANS,
    fontSize: "15px",
    fontWeight: 600,
    color: "var(--color-ink)",
    background: "transparent",
    border: "1px solid var(--color-border-strong)",
    borderRadius: "11px",
    cursor: "pointer",
  },
  btnPrimarySm: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "44px",
    padding: "0 20px",
    fontFamily: SANS,
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--color-on-primary)",
    background: "var(--color-primary)",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
  },
  spinner: {
    width: "15px",
    height: "15px",
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.4)",
    borderTopColor: "var(--color-on-primary)",
    display: "inline-block",
  },
  successBox: {
    display: "flex",
    gap: "10px",
    alignItems: "flex-start",
    background: "var(--color-sync-soft)",
    border: "1px solid var(--color-sync)",
    borderRadius: "10px",
    padding: "12px 14px",
    fontSize: "13px",
    color: "var(--color-on-sync-soft)",
    lineHeight: 1.45,
    marginTop: "18px",
  },
  noteBox: {
    display: "flex",
    gap: "11px",
    alignItems: "flex-start",
    background: "var(--color-surface-sunken)",
    border: "1px dashed var(--color-border-strong)",
    borderRadius: "10px",
    padding: "12px 14px",
    fontSize: "12.5px",
    color: "var(--color-muted)",
    lineHeight: 1.55,
    marginBottom: "20px",
  },
  noteTag: {
    flex: "none",
    fontFamily: MONO,
    fontSize: "10px",
    fontWeight: 600,
    color: "var(--color-on-primary-soft)",
    background: "var(--color-primary-soft)",
    borderRadius: "5px",
    padding: "2px 7px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginTop: "1px",
  },
  presetGrid: { display: "flex", flexDirection: "column", gap: "10px" },
  presetBtn: {
    display: "flex",
    alignItems: "flex-start",
    gap: "11px",
    textAlign: "left",
    width: "100%",
    background: "var(--color-surface-sunken)",
    border: "1px solid var(--color-border)",
    borderRadius: "12px",
    padding: "13px 15px",
    cursor: "pointer",
    minHeight: "44px",
  },
  presetIdx: {
    flex: "none",
    fontFamily: MONO,
    fontSize: "11px",
    fontWeight: 700,
    color: "var(--color-on-primary-soft)",
    background: "var(--color-primary-soft)",
    borderRadius: "6px",
    padding: "2px 8px",
    marginTop: "1px",
  },
  presetLabel: {
    fontSize: "13px",
    fontWeight: 500,
    color: "var(--color-ink)",
    lineHeight: 1.4,
  },
  switchCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    background: "var(--color-surface-sunken)",
    border: "1px solid var(--color-border)",
    borderRadius: "12px",
    padding: "13px 15px",
  },
  switchTitle: {
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--color-ink-strong)",
  },
  switchSub: {
    fontSize: "12px",
    color: "var(--color-muted)",
    marginTop: "2px",
  },
  ratYearRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 2px 16px",
  },
  ratYearLabel: { fontSize: "13px", color: "var(--color-muted)" },
  ratYear: {
    fontFamily: MONO,
    fontSize: "18px",
    fontWeight: 600,
    color: "var(--color-ink-strong)",
    fontVariantNumeric: "tabular-nums",
  },
  daftarCard: {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "16px",
    padding: "26px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
    marginTop: "24px",
  },
  daftarHead: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "22px",
  },
  segWrap: {
    display: "inline-flex",
    gap: "4px",
    background: "var(--color-surface-sunken)",
    border: "1px solid var(--color-border)",
    borderRadius: "9px",
    padding: "3px",
  },
  listGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "32px",
  },
  subTitle: {
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--color-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    marginBottom: "8px",
  },
  entryLeft: { flex: 1, minWidth: 0 },
  entryTop: { display: "flex", alignItems: "baseline", gap: "9px" },
  entryJenis: {
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--color-ink-strong)",
  },
  entryDate: {
    fontFamily: MONO,
    fontSize: "11px",
    color: "var(--color-muted)",
    whiteSpace: "nowrap",
  },
  entryPihak: {
    fontSize: "12.5px",
    color: "var(--color-muted)",
    marginTop: "3px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  entryRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "6px",
    flex: "none",
  },
  entryRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "13px 0",
    borderBottom: "1px solid var(--color-border)",
  },
  entryAmount: {
    fontFamily: MONO,
    fontSize: "15px",
    fontWeight: 600,
    color: "var(--color-ink-strong)",
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
  },
  emptyBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "40px 20px",
    border: "1px dashed var(--color-border-strong)",
    borderRadius: "12px",
    gap: "8px",
  },
  emptyGlyph: {
    width: "40px",
    height: "48px",
    border: "1.5px solid var(--color-border-strong)",
    borderRadius: "6px",
    background: "var(--color-surface-sunken)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "5px",
    padding: "0 8px",
    opacity: 0.7,
    marginBottom: "2px",
  },
  emptyGlyphLine: {
    height: "3px",
    borderRadius: "2px",
    background: "var(--color-border-strong)",
    width: "100%",
  },
  emptyGlyphLineShort: {
    height: "3px",
    borderRadius: "2px",
    background: "var(--color-border-strong)",
    width: "55%",
  },
  emptyTitle: { fontSize: "14px", fontWeight: 600, color: "var(--color-ink)" },
  emptyDesc: {
    fontSize: "12.5px",
    color: "var(--color-muted)",
    maxWidth: "34ch",
    lineHeight: 1.5,
  },
  footNote: {
    fontSize: "12px",
    color: "var(--color-faint)",
    lineHeight: 1.55,
    marginTop: "22px",
    maxWidth: "82ch",
  },
};

const btnPrimary = (loading: boolean): CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "9px",
  minHeight: "46px",
  padding: "0 24px",
  fontFamily: SANS,
  fontSize: "15px",
  fontWeight: 600,
  color: "var(--color-on-primary)",
  background: "var(--color-primary)",
  border: "none",
  borderRadius: "11px",
  cursor: loading ? "default" : "pointer",
  opacity: loading ? 0.85 : 1,
});
const saldoBox = (pulse: boolean): CSSProperties => ({
  borderRadius: "8px",
  padding: "2px 8px",
  transition: "background .6s ease",
  background: pulse ? "var(--color-primary-soft)" : "transparent",
});

function ErrText({ msg }: { msg: string }) {
  return (
    <div style={S.errText}>
      <span style={S.errIcon}>!</span>
      {msg}
    </div>
  );
}

const SUBJEK_CSS = `
@keyframes subjekSpin { to { transform: rotate(360deg); } }
.subjek-root .spin { animation: subjekSpin .7s linear infinite; }
.subjek-root input:focus-visible, .subjek-root select:focus-visible, .subjek-root textarea:focus-visible, .subjek-root button:focus-visible { outline: 2px solid var(--color-ring); outline-offset: 2px; }
.subjek-root ::placeholder { color: var(--color-faint); opacity: 1; }
@media (prefers-reduced-motion: reduce) { .subjek-root .spin { animation: none; } .subjek-root * { transition: none !important; } }
`;

const PIHAK_FALLBACK = "Koperasi";

export function PembukuanConsole() {
  const router = useRouter();

  const [saldo, setSaldo] = useState(SEED_SALDO);
  const [saldoPulse, setSaldoPulse] = useState(false);
  const [anggota, setAnggota] = useState<AnggotaOption[]>(SEED_ANGGOTA);

  const [trx, setTrx] = useState<TransaksiForm>(emptyTransaksi());
  const [trxErr, setTrxErr] = useState<
    Partial<Record<keyof TransaksiForm, string>>
  >({});
  const [trxLoading, setTrxLoading] = useState(false);
  const [trxSuccess, setTrxSuccess] = useState(false);
  const [trxNote, setTrxNote] = useState("");

  const [pin, setPin] = useState<PinjamanForm>(emptyPinjaman());
  const [pinErr, setPinErr] = useState<
    Partial<Record<keyof PinjamanForm, string>>
  >({});
  const [pinLoading, setPinLoading] = useState(false);
  const [pinSuccess, setPinSuccess] = useState(false);
  const [pinNote, setPinNote] = useState("");

  const [rat, setRat] = useState<RatForm>({ status: "belum", tanggal: "" });
  const [ratSuccess, setRatSuccess] = useState(false);

  const [trxList, setTrxList] = useState<TransaksiEntry[]>(SEED_TRANSAKSI);
  const [pinList, setPinList] = useState<PinjamanEntry[]>(SEED_PINJAMAN);
  const [listView, setListView] = useState<"terisi" | "kosong">("terisi");

  // Hidrasi dari /api/subjek/recent; fallback seed sudah menjadi state awal.
  useEffect(() => {
    let active = true;
    fetchRecent().then((r) => {
      if (!active) return;
      setSaldo(r.saldoKas);
      setTrxList(r.transaksi.slice(0, 10));
      setPinList(r.pinjaman.slice(0, 5));
      setAnggota(r.anggota);
      setRat({ status: r.ratStatus, tanggal: r.ratTanggal ?? "" });
    });
    return () => {
      active = false;
    };
  }, []);

  const anggotaLabel = (v: string) =>
    anggota.find((o) => o.value === v)?.label ?? "";
  const unitLabel = (v: string) =>
    SUBJEK_COPY.opsi.unit.find((o) => o.value === v)?.label ?? "";

  const trxAnggotaOptions: AnggotaOption[] = [
    { value: "", label: SUBJEK_COPY.opsi.anggotaTrxPlaceholder },
    ...anggota,
  ];
  const pinAnggotaOptions: AnggotaOption[] = [
    { value: "", label: SUBJEK_COPY.opsi.anggotaPinPlaceholder },
    ...anggota,
  ];

  const setTrxField =
    (k: keyof TransaksiForm, numeric = false) =>
    (e: FieldEvent) => {
      let v = e.target.value;
      if (numeric) v = v.replace(/[^\d]/g, "");
      setTrx((prev) => ({ ...prev, [k]: v }));
      setTrxErr((prev) => {
        const n = { ...prev };
        delete n[k];
        return n;
      });
      setTrxSuccess(false);
    };
  const setPinField =
    (k: keyof PinjamanForm, numeric = false) =>
    (e: FieldEvent) => {
      let v = e.target.value;
      if (numeric) v = v.replace(/[^\d]/g, "");
      setPin((prev) => ({ ...prev, [k]: v }));
      setPinErr((prev) => {
        const n = { ...prev };
        delete n[k];
        return n;
      });
      setPinSuccess(false);
    };

  const submitTrx = async () => {
    const errs = validateTransaksi(trx);
    if (Object.keys(errs).length) {
      setTrxErr(errs);
      setTrxSuccess(false);
      return;
    }
    setTrxLoading(true);
    setTrxErr({});
    setTrxSuccess(false);
    const captured = trx;
    const { transaksiId, saldoKasBaru } = await postTransaksi(captured, saldo);
    const amt = parseInt(captured.jumlah, 10);
    const pihak =
      captured.vendorNama ||
      anggotaLabel(captured.anggota) ||
      unitLabel(captured.unitUsaha) ||
      PIHAK_FALLBACK;
    const entry: TransaksiEntry = {
      id: transaksiId,
      tanggal: captured.tanggal,
      jenis: captured.jenis,
      jumlah: amt,
      pihak,
      sync: "menunggu",
    };
    setSaldo(saldoKasBaru);
    setSaldoPulse(true);
    setTrxList((prev) => [entry, ...prev].slice(0, 10));
    setTrxLoading(false);
    setTrxSuccess(true);
    setTrx(emptyTransaksi());
    setTrxNote("");
    setListView("terisi");
    setTimeout(
      () =>
        setTrxList((prev) =>
          prev.map((x) =>
            x.id === transaksiId ? { ...x, sync: "tersinkron" } : x,
          ),
        ),
      1500,
    );
    setTimeout(() => setSaldoPulse(false), 800);
  };

  const submitPin = async () => {
    const errs = validatePinjaman(pin);
    if (Object.keys(errs).length) {
      setPinErr(errs);
      setPinSuccess(false);
      return;
    }
    setPinLoading(true);
    setPinErr({});
    setPinSuccess(false);
    const captured = pin;
    const { pinjamanId } = await postPinjaman(captured);
    const entry: PinjamanEntry = {
      id: pinjamanId,
      anggota: anggotaLabel(captured.anggota) || "Anggota",
      pokok: parseInt(captured.pokok, 10),
      cicilan: parseInt(captured.cicilan, 10),
      jatuhTempo: captured.jatuhTempo,
      dokumenLengkap: captured.dokumenLengkap,
      sync: "menunggu",
    };
    setPinList((prev) => [entry, ...prev].slice(0, 5));
    setPinLoading(false);
    setPinSuccess(true);
    setPin(emptyPinjaman());
    setPinNote("");
    setListView("terisi");
    setTimeout(
      () =>
        setPinList((prev) =>
          prev.map((x) =>
            x.id === pinjamanId ? { ...x, sync: "tersinkron" } : x,
          ),
        ),
      1500,
    );
  };

  const submitRat = async () => {
    await postRat(rat);
    setRatSuccess(true);
  };

  const resetTrx = () => {
    setTrx(emptyTransaksi());
    setTrxErr({});
    setTrxSuccess(false);
    setTrxNote("");
  };
  const resetPin = () => {
    setPin(emptyPinjaman());
    setPinErr({});
    setPinSuccess(false);
    setPinNote("");
  };

  const fillTrx = (form: TransaksiForm, note: string) => {
    setTrx(form);
    setTrxErr({});
    setTrxSuccess(false);
    setTrxNote(note);
  };
  const fillPin = (form: PinjamanForm, note: string) => {
    setPin(form);
    setPinErr({});
    setPinSuccess(false);
    setPinNote(note);
  };

  const presets = [
    {
      idx: "1",
      label: COPY["subjek.preset.konflik"],
      onClick: () => fillTrx(presetKonflik(), SUBJEK_COPY.preset.noteKonflik),
    },
    {
      idx: "2",
      label: COPY["subjek.preset.pecah"],
      onClick: () => fillTrx(presetPecah(), SUBJEK_COPY.preset.notePecah),
    },
    {
      idx: "3",
      label: COPY["subjek.preset.plafon"],
      onClick: () =>
        fillPin(presetPlafon(anggota), SUBJEK_COPY.preset.notePlafon),
    },
    {
      idx: "4",
      label: COPY["subjek.preset.kas"],
      onClick: () => fillTrx(presetKas(), SUBJEK_COPY.preset.noteKas),
    },
  ];

  const doLogout = async () => {
    await logout();
    router.push("/login");
  };

  const showVendor = trx.jenis === "pembelian";
  const trxEchoOn = isRawAmountValid(trx.jumlah);
  const pinPokokEchoOn = isRawAmountValid(pin.pokok);
  const pinCicilanEchoOn = isRawAmountValid(pin.cicilan);
  const ratTerlaksana = rat.status === "terlaksana";
  const trxHasItems = listView === "terisi" && trxList.length > 0;
  const pinHasItems = listView === "terisi" && pinList.length > 0;

  const c = SUBJEK_COPY;

  return (
    <div
      className="subjek-root"
      style={{
        background: "var(--color-bg)",
        color: "var(--color-ink)",
        fontFamily: SANS,
        minHeight: "100vh",
        width: "100%",
      }}
    >
      <style>{SUBJEK_CSS}</style>
      <header style={S.header}>
        <div style={S.redbar} />
        <div style={S.headerInner}>
          <div style={S.brandRow}>
            <div style={S.emblem}>
              <div style={S.emblemRed} />
              <div style={S.emblemWhite} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <div style={S.title}>{COPY["subjek.header"]}</div>
                <span style={S.simTag}>{c.header.simTag}</span>
              </div>
              <div style={S.sub}>{COPY["subjek.sub"]}</div>
            </div>
          </div>

          <div style={S.saldoWrap}>
            <div style={S.saldoLabel}>{c.header.saldoLabel}</div>
            <div style={saldoBox(saldoPulse)}>
              <span style={S.saldoVal}>{formatRp(saldo)}</span>
            </div>
            <div style={S.koperasiName}>{c.header.koperasi}</div>
          </div>

          <div style={S.headerActions}>
            <span style={S.syncChip}>
              <span style={S.syncDot} />
              {COPY["subjek.sync"]}
            </span>
            <ThemeToggle />
            <button type="button" style={S.ghostBtn} onClick={doLogout}>
              {c.header.keluar}
            </button>
          </div>
        </div>
      </header>

      <div style={S.container}>
        <div style={S.grid}>
          {/* LEFT: forms */}
          <div style={S.colLeft}>
            {/* CATAT TRANSAKSI */}
            <section style={S.card}>
              <div style={S.cardHead}>
                <div style={S.cardTitle}>{c.trx.judul}</div>
                <div style={S.cardDesc}>{c.trx.deskripsi}</div>
              </div>

              {trxNote && (
                <div style={S.noteBox}>
                  <span style={S.noteTag}>{c.preset.tag}</span>
                  <span>{trxNote}</span>
                </div>
              )}

              <div style={S.formGrid}>
                <div style={S.field}>
                  <label style={S.label}>{c.trx.lJenis}</label>
                  <div style={S.selWrap}>
                    <select
                      value={trx.jenis}
                      onChange={setTrxField("jenis")}
                      style={mkSelect(false)}
                    >
                      {c.opsi.jenis.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <span style={S.chev}>{"▾"}</span>
                  </div>
                </div>

                <div style={S.field}>
                  <label style={S.label}>
                    {c.trx.lJumlah} <span style={S.reqMark}>{c.reqMark}</span>
                  </label>
                  <div style={mkRpWrap(!!trxErr.jumlah)}>
                    <span style={S.rpPrefix}>Rp</span>
                    <input
                      value={trx.jumlah}
                      onChange={setTrxField("jumlah", true)}
                      inputMode="numeric"
                      placeholder={c.trx.phJumlah}
                      style={S.rpInput}
                      aria-label={c.trx.ariaJumlah}
                    />
                  </div>
                  {trxEchoOn && (
                    <div style={S.echo}>
                      {c.trx.echoPrefix}
                      {formatRp(parseInt(trx.jumlah, 10))}
                    </div>
                  )}
                  {trxErr.jumlah && <ErrText msg={trxErr.jumlah} />}
                  {!trxEchoOn && <div style={S.helper}>{c.trx.helper}</div>}
                </div>

                <div style={S.field}>
                  <label style={S.label}>
                    {c.trx.lTanggal} <span style={S.reqMark}>{c.reqMark}</span>
                  </label>
                  <input
                    type="date"
                    value={trx.tanggal}
                    onChange={setTrxField("tanggal")}
                    style={mkInput(!!trxErr.tanggal)}
                    aria-label={c.trx.ariaTanggal}
                  />
                  {trxErr.tanggal && <ErrText msg={trxErr.tanggal} />}
                </div>

                <div style={S.field}>
                  <label style={S.label}>{c.trx.lUnit}</label>
                  <div style={S.selWrap}>
                    <select
                      value={trx.unitUsaha}
                      onChange={setTrxField("unitUsaha")}
                      style={mkSelect(!!trxErr.unitUsaha)}
                    >
                      {c.opsi.unit.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <span style={S.chev}>{"▾"}</span>
                  </div>
                  {trxErr.unitUsaha && <ErrText msg={trxErr.unitUsaha} />}
                </div>

                {showVendor && (
                  <div style={S.field}>
                    <label style={S.label}>
                      {c.trx.lVendorNama}{" "}
                      <span style={S.reqMark}>{c.reqMark}</span>
                    </label>
                    <input
                      value={trx.vendorNama}
                      onChange={setTrxField("vendorNama")}
                      placeholder={c.trx.phVendorNama}
                      style={mkInput(!!trxErr.vendorNama)}
                    />
                    {trxErr.vendorNama && <ErrText msg={trxErr.vendorNama} />}
                  </div>
                )}

                {showVendor && (
                  <div style={S.field}>
                    <label style={S.label}>
                      {c.trx.lVendorAlamat}{" "}
                      <span style={S.reqMark}>{c.reqMark}</span>
                    </label>
                    <input
                      value={trx.vendorAlamat}
                      onChange={setTrxField("vendorAlamat")}
                      placeholder={c.trx.phVendorAlamat}
                      style={mkInput(!!trxErr.vendorAlamat)}
                    />
                    {trxErr.vendorAlamat && (
                      <ErrText msg={trxErr.vendorAlamat} />
                    )}
                  </div>
                )}

                <div style={S.field}>
                  <label style={S.label}>
                    {c.trx.lAnggota} <span style={S.optMark}>{c.optMark}</span>
                  </label>
                  <div style={S.selWrap}>
                    <select
                      value={trx.anggota}
                      onChange={setTrxField("anggota")}
                      style={mkSelect(false)}
                    >
                      {trxAnggotaOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <span style={S.chev}>{"▾"}</span>
                  </div>
                </div>

                <div style={S.fieldFull}>
                  <label style={S.label}>
                    {c.trx.lDeskripsi}{" "}
                    <span style={S.reqMark}>{c.reqMark}</span>
                  </label>
                  <textarea
                    value={trx.deskripsi}
                    onChange={setTrxField("deskripsi")}
                    placeholder={c.trx.phDeskripsi}
                    style={mkTextarea(!!trxErr.deskripsi)}
                  />
                  {trxErr.deskripsi && <ErrText msg={trxErr.deskripsi} />}
                </div>
              </div>

              {trxSuccess && (
                <div style={S.successBox}>
                  <span style={S.okIcon}>{"\u2713"}</span>
                  <span>{c.trx.sukses}</span>
                </div>
              )}

              <div style={S.formActions}>
                <button
                  type="button"
                  style={btnPrimary(trxLoading)}
                  onClick={submitTrx}
                  disabled={trxLoading}
                >
                  {trxLoading && <span className="spin" style={S.spinner} />}
                  {trxLoading ? c.trx.memuat : COPY["subjek.simpan"]}
                </button>
                <button type="button" style={S.btnGhost} onClick={resetTrx}>
                  {c.trx.bersihkan}
                </button>
              </div>
            </section>

            {/* PERSETUJUAN PINJAMAN */}
            <section style={S.card}>
              <div style={S.cardHead}>
                <div style={S.cardTitle}>{c.pin.judul}</div>
                <div style={S.cardDesc}>{c.pin.deskripsi}</div>
              </div>

              {pinNote && (
                <div style={S.noteBox}>
                  <span style={S.noteTag}>{c.preset.tag}</span>
                  <span>{pinNote}</span>
                </div>
              )}

              <div style={S.formGrid}>
                <div style={S.field}>
                  <label style={S.label}>
                    {c.pin.lAnggota} <span style={S.reqMark}>{c.reqMark}</span>
                  </label>
                  <div style={S.selWrap}>
                    <select
                      value={pin.anggota}
                      onChange={setPinField("anggota")}
                      style={mkSelect(!!pinErr.anggota)}
                    >
                      {pinAnggotaOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <span style={S.chev}>{"▾"}</span>
                  </div>
                  {pinErr.anggota && <ErrText msg={pinErr.anggota} />}
                </div>

                <div style={S.field}>
                  <label style={S.label}>
                    {c.pin.lDisetujui}{" "}
                    <span style={S.reqMark}>{c.reqMark}</span>
                  </label>
                  <div style={S.selWrap}>
                    <select
                      value={pin.disetujuiOleh}
                      onChange={setPinField("disetujuiOleh")}
                      style={mkSelect(!!pinErr.disetujuiOleh)}
                    >
                      {c.opsi.jabatan.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <span style={S.chev}>{"▾"}</span>
                  </div>
                  {pinErr.disetujuiOleh && (
                    <ErrText msg={pinErr.disetujuiOleh} />
                  )}
                </div>

                <div style={S.field}>
                  <label style={S.label}>
                    {c.pin.lPokok} <span style={S.reqMark}>{c.reqMark}</span>
                  </label>
                  <div style={mkRpWrap(!!pinErr.pokok)}>
                    <span style={S.rpPrefix}>Rp</span>
                    <input
                      value={pin.pokok}
                      onChange={setPinField("pokok", true)}
                      inputMode="numeric"
                      placeholder={c.trx.phJumlah}
                      style={S.rpInput}
                      aria-label={c.pin.ariaPokok}
                    />
                  </div>
                  {pinPokokEchoOn && (
                    <div style={S.echo}>
                      {c.trx.echoPrefix}
                      {formatRp(parseInt(pin.pokok, 10))}
                    </div>
                  )}
                  {pinErr.pokok && <ErrText msg={pinErr.pokok} />}
                </div>

                <div style={S.field}>
                  <label style={S.label}>
                    {c.pin.lCicilan} <span style={S.reqMark}>{c.reqMark}</span>
                  </label>
                  <div style={mkRpWrap(!!pinErr.cicilan)}>
                    <span style={S.rpPrefix}>Rp</span>
                    <input
                      value={pin.cicilan}
                      onChange={setPinField("cicilan", true)}
                      inputMode="numeric"
                      placeholder={c.trx.phJumlah}
                      style={S.rpInput}
                      aria-label={c.pin.ariaCicilan}
                    />
                  </div>
                  {pinCicilanEchoOn && (
                    <div style={S.echo}>
                      {c.trx.echoPrefix}
                      {formatRp(parseInt(pin.cicilan, 10))}
                    </div>
                  )}
                  {pinErr.cicilan && <ErrText msg={pinErr.cicilan} />}
                </div>

                <div style={S.field}>
                  <label style={S.label}>
                    {c.pin.lJatuhTempo}{" "}
                    <span style={S.reqMark}>{c.reqMark}</span>
                  </label>
                  <input
                    type="date"
                    value={pin.jatuhTempo}
                    onChange={setPinField("jatuhTempo")}
                    style={mkInput(!!pinErr.jatuhTempo)}
                    aria-label={c.pin.ariaJatuhTempo}
                  />
                  {pinErr.jatuhTempo && <ErrText msg={pinErr.jatuhTempo} />}
                </div>

                <div style={S.field}>
                  <label style={S.label}>{c.pin.lDokumen}</label>
                  <div style={S.switchCard}>
                    <div>
                      <div style={S.switchTitle}>{c.pin.dokJudul}</div>
                      <div style={S.switchSub}>
                        {pin.dokumenLengkap ? c.pin.dokLengkap : c.pin.dokBelum}
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={pin.dokumenLengkap}
                      onClick={() =>
                        setPin((prev) => ({
                          ...prev,
                          dokumenLengkap: !prev.dokumenLengkap,
                        }))
                      }
                      style={mkTrack(pin.dokumenLengkap)}
                    >
                      <span style={mkThumb(pin.dokumenLengkap)} />
                    </button>
                  </div>
                </div>
              </div>

              {pinSuccess && (
                <div style={S.successBox}>
                  <span style={S.okIcon}>{"\u2713"}</span>
                  <span>{c.pin.sukses}</span>
                </div>
              )}

              <div style={S.formActions}>
                <button
                  type="button"
                  style={btnPrimary(pinLoading)}
                  onClick={submitPin}
                  disabled={pinLoading}
                >
                  {pinLoading && <span className="spin" style={S.spinner} />}
                  {pinLoading ? c.pin.memuat : COPY["subjek.pinjaman.simpan"]}
                </button>
                <button type="button" style={S.btnGhost} onClick={resetPin}>
                  {c.pin.bersihkan}
                </button>
              </div>
            </section>
          </div>

          {/* RIGHT: rail */}
          <div style={S.colRight}>
            <section style={S.card}>
              <div style={S.cardHead}>
                <div style={S.cardTitle}>{c.preset.judul}</div>
                <div style={S.cardDesc}>{c.preset.deskripsi}</div>
              </div>
              <div style={S.presetGrid}>
                {presets.map((p) => (
                  <button
                    key={p.idx}
                    type="button"
                    style={S.presetBtn}
                    onClick={p.onClick}
                  >
                    <span style={S.presetIdx}>{p.idx}</span>
                    <span style={S.presetLabel}>{p.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section style={S.card}>
              <div style={S.cardHead}>
                <div style={S.cardTitle}>{c.rat.judul}</div>
                <div style={S.cardDesc}>{c.rat.deskripsi}</div>
              </div>
              <div style={S.ratYearRow}>
                <span style={S.ratYearLabel}>{c.rat.tahunLabel}</span>
                <span style={S.ratYear}>{c.rat.tahun}</span>
              </div>
              <div style={S.switchCard}>
                <div>
                  <div style={S.switchTitle}>
                    {ratTerlaksana ? c.rat.sudahJudul : c.rat.belumJudul}
                  </div>
                  <div style={S.switchSub}>
                    {ratTerlaksana ? c.rat.sudahSub : c.rat.belumSub}
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={ratTerlaksana}
                  onClick={() => {
                    setRat((prev) => ({
                      ...prev,
                      status:
                        prev.status === "terlaksana" ? "belum" : "terlaksana",
                    }));
                    setRatSuccess(false);
                  }}
                  style={mkTrack(ratTerlaksana)}
                >
                  <span style={mkThumb(ratTerlaksana)} />
                </button>
              </div>
              {ratTerlaksana && (
                <div style={{ ...S.field, marginTop: "16px" }}>
                  <label style={S.label}>{c.rat.lTanggal}</label>
                  <input
                    type="date"
                    value={rat.tanggal}
                    onChange={(e) => {
                      const v = e.target.value;
                      setRat((prev) => ({ ...prev, tanggal: v }));
                      setRatSuccess(false);
                    }}
                    style={inputBase}
                    aria-label={c.rat.ariaTanggal}
                  />
                </div>
              )}
              {ratSuccess && (
                <div style={S.successBox}>
                  <span style={S.okIcon}>{"\u2713"}</span>
                  <span>{c.rat.sukses}</span>
                </div>
              )}
              <div style={S.formActions}>
                <button
                  type="button"
                  style={S.btnPrimarySm}
                  onClick={submitRat}
                >
                  {c.rat.tombol}
                </button>
              </div>
            </section>
          </div>
        </div>

        {/* DAFTAR ENTRI TERAKHIR */}
        <section style={S.daftarCard}>
          <div style={S.daftarHead}>
            <div>
              <div style={S.cardTitle}>{c.daftar.judul}</div>
              <div style={S.cardDesc}>{c.daftar.deskripsi}</div>
            </div>
            <div style={S.segWrap}>
              <button
                type="button"
                style={mkSeg(listView === "terisi")}
                onClick={() => setListView("terisi")}
              >
                {c.daftar.segTerisi}
              </button>
              <button
                type="button"
                style={mkSeg(listView === "kosong")}
                onClick={() => setListView("kosong")}
              >
                {c.daftar.segKosong}
              </button>
            </div>
          </div>

          <div style={S.listGrid}>
            <div>
              <div style={S.subTitle}>{c.daftar.subTrx}</div>
              {trxHasItems ? (
                <div>
                  {trxList.map((x) => {
                    const masuk = deriveArah(x.jenis) === "masuk";
                    const synced = x.sync === "tersinkron";
                    return (
                      <div key={x.id} style={S.entryRow}>
                        <div style={S.entryLeft}>
                          <div style={S.entryTop}>
                            <span style={S.entryJenis}>
                              {JENIS_LABEL[x.jenis] ?? x.jenis}
                            </span>
                            <span style={S.entryDate}>
                              {formatTanggal(x.tanggal)}
                            </span>
                          </div>
                          <div style={S.entryPihak}>{x.pihak}</div>
                        </div>
                        <div style={S.entryRight}>
                          <span style={S.entryAmount}>
                            {(masuk ? "+ " : "− ") + formatRp(x.jumlah)}
                          </span>
                          <span style={mkChip(synced)}>
                            <span style={mkDot(synced)} />
                            {synced ? c.daftar.tersinkron : c.daftar.menunggu}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={S.emptyBox}>
                  <div style={S.emptyGlyph}>
                    <span style={S.emptyGlyphLine} />
                    <span style={S.emptyGlyphLine} />
                    <span style={S.emptyGlyphLineShort} />
                  </div>
                  <div style={S.emptyTitle}>{c.daftar.kosongTrxJudul}</div>
                  <div style={S.emptyDesc}>{c.daftar.kosongTrxDesc}</div>
                </div>
              )}
            </div>

            <div>
              <div style={S.subTitle}>{c.daftar.subPin}</div>
              {pinHasItems ? (
                <div>
                  {pinList.map((x) => {
                    const synced = x.sync === "tersinkron";
                    return (
                      <div key={x.id} style={S.entryRow}>
                        <div style={S.entryLeft}>
                          <div style={S.entryTop}>
                            <span style={S.entryJenis}>{x.anggota}</span>
                            <span style={S.entryDate}>
                              {c.daftar.tempo} {formatTanggal(x.jatuhTempo)}
                            </span>
                          </div>
                          <div style={S.entryPihak}>
                            {c.daftar.pokok} {formatRp(x.pokok)} {"·"}{" "}
                            {c.daftar.cicilan} {formatRp(x.cicilan)}
                          </div>
                        </div>
                        <div style={S.entryRight}>
                          <span style={mkChip(x.dokumenLengkap)}>
                            {x.dokumenLengkap
                              ? c.daftar.dokLengkap
                              : c.daftar.dokBelum}
                          </span>
                          <span style={mkChip(synced)}>
                            <span style={mkDot(synced)} />
                            {synced ? c.daftar.tersinkron : c.daftar.menunggu}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={S.emptyBox}>
                  <div style={S.emptyGlyph}>
                    <span style={S.emptyGlyphLine} />
                    <span style={S.emptyGlyphLine} />
                    <span style={S.emptyGlyphLineShort} />
                  </div>
                  <div style={S.emptyTitle}>{c.daftar.kosongPinJudul}</div>
                  <div style={S.emptyDesc}>{c.daftar.kosongPinDesc}</div>
                </div>
              )}
            </div>
          </div>
        </section>

        <div style={S.footNote}>{c.footNote}</div>
      </div>
    </div>
  );
}
