/** Kumpulan prompt agen (6.9): PROMPTS per AgentId + ADJUDIKATOR. */
import type { AgentId } from "@/lib/contracts";
import { NAMA as N_KONFLIK, PROMPT as P_KONFLIK } from "./konflik-kepentingan";
import { NAMA as N_ANOMALI, PROMPT as P_ANOMALI } from "./anomali-transaksi";
import {
  NAMA as N_KESEHATAN,
  PROMPT as P_KESEHATAN,
} from "./kesehatan-finansial";
import { NAMA as N_KEPATUHAN, PROMPT as P_KEPATUHAN } from "./kepatuhan-proses";

export { ADJUDIKATOR } from "./adjudikator";

export const NAMA_AGEN: Record<AgentId, string> = {
  konflik_kepentingan: N_KONFLIK,
  anomali_transaksi: N_ANOMALI,
  kesehatan_finansial: N_KESEHATAN,
  kepatuhan_proses: N_KEPATUHAN,
};

export const PROMPTS: Record<AgentId, string> = {
  konflik_kepentingan: P_KONFLIK,
  anomali_transaksi: P_ANOMALI,
  kesehatan_finansial: P_KESEHATAN,
  kepatuhan_proses: P_KEPATUHAN,
};

/** Urutan pemanggilan agen forensik (stabil). */
export const AGEN_FORENSIK: readonly AgentId[] = [
  "konflik_kepentingan",
  "anomali_transaksi",
  "kesehatan_finansial",
  "kepatuhan_proses",
];
