"use client";

/**
 * Lapisan data klien surface anggota. Produksi selalu fetch nyata ke endpoint
 * 6.3 (tanpa flag). Envelope kontrak: sukses {ok:true,data}; gagal
 * {ok:false,error:{code,message}}. 401 memicu redirect ke /login (guard ringan).
 */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function parseEnvelope<T>(res: Response): Promise<T> {
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* respons non-JSON */
  }
  const b = body as { ok?: boolean; data?: T; error?: { code?: string; message?: string } } | null;
  if (res.ok && b && b.ok === true) return b.data as T;
  const code = b?.error?.code ?? (res.status === 401 ? "UNAUTHORIZED" : "INTERNAL");
  const message = b?.error?.message ?? `Permintaan gagal (${res.status})`;
  throw new ApiError(code, message, res.status);
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "same-origin",
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  return parseEnvelope<T>(res);
}

export async function postJson<T>(url: string, payload: unknown): Promise<T> {
  return fetchJson<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload ?? {}),
  });
}

/** State pemuatan satu sumber. "gagal" membawa data terakhir yang baik bila ada. */
export type Muat<T> =
  | { status: "memuat" }
  | { status: "kosong" }
  | { status: "gagal"; data: T | null }
  | { status: "isi"; data: T };

export type UseResource<T> = { muat: Muat<T>; reload: () => void };

/**
 * Ambil satu sumber dan petakan ke Muat. isEmpty menandai respons sukses yang
 * kosong. 401 -> /login. Kegagalan lain -> gagal + data sukses terakhir (sesi).
 */
export function useResource<T>(
  url: string | null,
  opts?: { isEmpty?: (d: T) => boolean; emptyStatuses?: number[] },
): UseResource<T> {
  const router = useRouter();
  const [muat, setMuat] = useState<Muat<T>>({ status: "memuat" });
  const lastGood = useRef<T | null>(null);
  const isEmpty = opts?.isEmpty;
  const emptyStatuses = opts?.emptyStatuses;
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (url === null) return;
    let alive = true;
    fetchJson<T>(url)
      .then((data) => {
        if (!alive) return;
        lastGood.current = data;
        if (isEmpty && isEmpty(data)) setMuat({ status: "kosong" });
        else setMuat({ status: "isi", data });
      })
      .catch((err: unknown) => {
        if (!alive) return;
        if (err instanceof ApiError && err.status === 401) {
          router.push("/login");
          return;
        }
        if (
          err instanceof ApiError &&
          emptyStatuses &&
          emptyStatuses.includes(err.status)
        ) {
          setMuat({ status: "kosong" });
          return;
        }
        setMuat({ status: "gagal", data: lastGood.current });
      });
    return () => {
      alive = false;
    };
  }, [url, isEmpty, emptyStatuses, router, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { muat, reload };
}

/** prefers-reduced-motion, reaktif. Server render = false (animasi penuh awal). */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/* --------------------------------------------------------------------------
 * Toko sesi: pertanyaan yang ditambahkan ke RAT dan pilihan voting. Model
 * prototipe (base server + tambahan sesi anggota). sessionStorage supaya
 * bertahan antar navigasi klien; reset pada reload penuh. VoiceResp 6.3b tidak
 * memuat penanda "milik Anda" per pengguna, jadi sesi menjadi jembatannya.
 * ------------------------------------------------------------------------ */

function makeSetStore(key: string) {
  const listeners = new Set<() => void>();
  let cache: string | null = null;

  function read(): Set<string> {
    try {
      const raw = sessionStorage.getItem(key);
      return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      return new Set();
    }
  }
  function snapshot(): string {
    try {
      cache = sessionStorage.getItem(key) ?? "";
    } catch {
      cache = "";
    }
    return cache;
  }
  return {
    add(id: string) {
      const s = read();
      s.add(id);
      try {
        sessionStorage.setItem(key, JSON.stringify([...s]));
      } catch {
        /* penyimpanan tidak tersedia */
      }
      for (const l of listeners) l();
    },
    has(id: string) {
      return read().has(id);
    },
    subscribe(cb: () => void) {
      listeners.add(cb);
      window.addEventListener("storage", cb);
      return () => {
        listeners.delete(cb);
        window.removeEventListener("storage", cb);
      };
    },
    snapshot,
    readSet: read,
  };
}

const ratStore = makeSetStore("pramana-rat");

/** Tandai pertanyaan temuan sudah ditambahkan ke RAT pada sesi ini. */
export function tambahRat(temuanId: string) {
  ratStore.add(temuanId);
}

/** Set id temuan yang sudah ditambahkan (reaktif). */
export function useRatSet(): ReadonlySet<string> {
  useSyncExternalStore(ratStore.subscribe, ratStore.snapshot, () => "");
  return ratStore.readSet();
}

const voteKey = "pramana-vote";
const voteListeners = new Set<() => void>();

/** Simpan pilihan voting keputusan (setuju/tidak) untuk sesi ini. */
export function simpanVote(keputusanId: string, pilihan: "setuju" | "tidak") {
  try {
    const raw = sessionStorage.getItem(voteKey);
    const map = raw ? (JSON.parse(raw) as Record<string, "setuju" | "tidak">) : {};
    map[keputusanId] = pilihan;
    sessionStorage.setItem(voteKey, JSON.stringify(map));
  } catch {
    /* penyimpanan tidak tersedia */
  }
  for (const l of voteListeners) l();
}

function voteSubscribe(cb: () => void) {
  voteListeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    voteListeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}
function voteSnapshot(): string {
  try {
    return sessionStorage.getItem(voteKey) ?? "";
  } catch {
    return "";
  }
}

/** Pilihan voting sesi per keputusan (reaktif). */
export function useVotes(): Record<string, "setuju" | "tidak"> {
  const raw = useSyncExternalStore(voteSubscribe, voteSnapshot, () => "");
  try {
    return raw ? (JSON.parse(raw) as Record<string, "setuju" | "tidak">) : {};
  } catch {
    return {};
  }
}
