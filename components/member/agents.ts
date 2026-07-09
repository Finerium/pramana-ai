"use client";

/**
 * Animasi panel Pengawas: empat pemeriksa berjalan bergiliran, angka hitung
 * naik. Meniru urutan prototipe (jeda antar agen, count-up per agen). Reduced
 * motion: langsung selesai penuh tanpa animasi/timer.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { AGENT_PANEL } from "@/lib/copy/member";
import { useReducedMotion } from "./data";

const TARGETS = AGENT_PANEL.map((a) => a.target);

export type AgentRunState = {
  agRun: boolean;
  agStep: number;
  agCounts: number[];
};

export function useAgentRun(
  autoStart = true,
): AgentRunState & { run: () => void } {
  const reduced = useReducedMotion();
  const [st, setSt] = useState<AgentRunState>({
    agRun: false,
    agStep: 0,
    agCounts: [0, 0, 0, 0],
  });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const rafs = useRef<number[]>([]);

  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    rafs.current.forEach(cancelAnimationFrame);
    rafs.current = [];
  }, []);

  const run = useCallback(() => {
    clear();
    if (reduced) {
      setSt({ agRun: false, agStep: 4, agCounts: [...TARGETS] });
      return;
    }
    setSt({ agRun: true, agStep: 0, agCounts: [0, 0, 0, 0] });
    const per = 1150;
    TARGETS.forEach((target, i) => {
      timers.current.push(
        setTimeout(() => {
          const t0 = performance.now();
          const step = (t: number) => {
            const p = Math.min(1, (t - t0) / 850);
            const e = 1 - Math.pow(1 - p, 3);
            setSt((s) => {
              const c = s.agCounts.slice();
              c[i] = Math.round(target * e);
              return { ...s, agCounts: c };
            });
            if (p < 1) rafs.current.push(requestAnimationFrame(step));
          };
          rafs.current.push(requestAnimationFrame(step));
        }, i * per),
      );
      timers.current.push(
        setTimeout(
          () => setSt((s) => ({ ...s, agStep: i + 1, agRun: i < 3 })),
          i * per + per - 100,
        ),
      );
    });
  }, [reduced, clear]);

  useEffect(() => {
    if (!autoStart) return;
    const t = setTimeout(run, 400);
    return () => {
      clearTimeout(t);
      clear();
    };
  }, [autoStart, run, clear]);

  return { ...st, run };
}
