/**
 * Tipe respons API sisi klien surface anggota. Berakar pada kontrak 6.1/6.3b;
 * MemberFinding menambah tanggapanPengurus opsional (dirender bila ada, 6.10).
 */
import type { AgentFinding } from "@/lib/contracts";

export type MemberFinding = AgentFinding & { tanggapanPengurus?: string };
