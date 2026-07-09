/**
 * Logika tema landing (murni, tanpa DOM), dipakai toggle nav dan skrip
 * apply-tema pre-paint. Tiga status: sistem (ikut OS), terang, gelap.
 * localStorage key "pramana-tema" menyimpan status verbatim.
 */
export type Tema = "sistem" | "terang" | "gelap";

const URUTAN: Record<Tema, Tema> = {
  sistem: "terang",
  terang: "gelap",
  gelap: "sistem",
};

const LABEL: Record<Tema, string> = {
  sistem: "Sistem",
  terang: "Terang",
  gelap: "Gelap",
};

/** Status berikutnya saat toggle ditekan: sistem -> terang -> gelap -> sistem. */
export function temaBerikutnya(t: Tema): Tema {
  return URUTAN[t];
}

/** Baca nilai localStorage; hanya "terang"/"gelap" eksplisit, selain itu "sistem". */
export function bacaTema(raw: string | null | undefined): Tema {
  return raw === "terang" || raw === "gelap" ? raw : "sistem";
}

/** Label tampil pada pil toggle. */
export function labelTema(t: Tema): string {
  return LABEL[t];
}
