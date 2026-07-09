/**
 * Mock LLM deterministik OpenAI-compatible untuk suite e2e (F14).
 * Server HTTP Node kecil, tanpa impor aplikasi, dijalankan sebagai webServer
 * Playwright terpisah (port 4545). Endpoint:
 *   POST /v1/chat/completions  -> balasan chat (mode "ok") atau HTTP 500 (mode "gagal")
 *   POST /control  {mode:"ok"|"gagal"}  -> setel mode
 *   POST /control/reset  -> nolkan penghitung hits
 *   GET  /control/stats  -> {hits}   (hanya menghitung panggilan /v1/chat/completions)
 *   GET  /control/health -> {ok:true} (kesiapan webServer)
 *
 * Deteksi agen dari isi system prompt (lib/prompts menyisipkan
 * "agent":"<id>" untuk forensik, dan "Adjudikator" untuk adjudikator).
 * Temuan konflik MERUJUK data snapshot: menyebut vendor + id transaksi yang
 * alamat penjualnya cocok alamat pengurus (loop lintas surface, AC-SUBJ-02).
 * Register 6.8: sapaan "Anda", tanpa em dash, tanpa emoji; pertanyaan_rat
 * diakhiri "?". Tanpa provider nyata: satu-satunya sumber jawaban model di e2e.
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

const ENV = process["env"];
const PORT = Number(ENV.MOCK_LLM_PORT ?? 4545);

type Mode = "ok" | "gagal";
const state = { mode: "ok" as Mode, hits: 0 };

// ---- util deterministik (tanpa ICU) ----------------------------------------
function rupiah(n: number): string {
  const abs = Math.abs(Math.trunc(n));
  const grouped = String(abs).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return "Rp " + (n < 0 ? "-" : "") + grouped;
}
function norm(s: unknown): string {
  return String(s ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
function alamatCocok(a: string, b: string): boolean {
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return false;
  return x === y || x.includes(y) || y.includes(x);
}

type Msg = { role: string; content: string };
type Snapshot = {
  koperasi?: { nama?: string };
  pengurus?: Array<{ nama?: string; jabatan?: string; alamat?: string }>;
  transaksi?: Array<{
    id: string;
    tanggal: string;
    jenis: string;
    arah?: string;
    jumlah: number;
    vendorNama?: string | null;
    vendorAlamat?: string | null;
  }>;
};

type Finding = {
  agent: string;
  severity: "info" | "kuning" | "merah";
  judul: string;
  penjelasan_awam: string;
  kenapa_penting: string;
  bukti: Array<{ jenis: string; id: string; label: string }>;
  pertanyaan_rat: string;
};

function detectAgent(system: string): string {
  if (/Adjudikator/i.test(system)) return "adjudikator";
  const m = system.match(
    /"agent":"(konflik_kepentingan|anomali_transaksi|kesehatan_finansial|kepatuhan_proses)"/,
  );
  return m ? m[1]! : "unknown";
}

/**
 * Temuan konflik kepentingan: satu temuan per transaksi pembelian yang alamat
 * penjualnya cocok alamat pengurus. Merujuk id + vendor transaksi (bukti loop).
 */
function konflikFindings(snap: Snapshot): Finding[] {
  const pengurus = snap.pengurus ?? [];
  const out: Finding[] = [];
  const seen = new Set<string>();
  for (const t of snap.transaksi ?? []) {
    if (t.jenis !== "pembelian") continue;
    if (!t.vendorAlamat || !t.vendorNama) continue;
    if (seen.has(t.id)) continue;
    const cocok = pengurus.find((p) => alamatCocok(t.vendorAlamat ?? "", p.alamat ?? ""));
    if (!cocok) continue;
    seen.add(t.id);
    const rp = rupiah(t.jumlah);
    out.push({
      agent: "konflik_kepentingan",
      severity: t.jumlah >= 10_000_000 ? "merah" : "kuning",
      judul: `Pembelian ${rp} ke ${t.vendorNama} beralamat sama dengan pengurus`.slice(0, 90),
      penjelasan_awam:
        `Pada ${t.tanggal} koperasi membeli senilai ${rp} dari ${t.vendorNama}. ` +
        `Alamat penjual sama dengan alamat pengurus, yaitu ${cocok.alamat}.`,
      kenapa_penting:
        "Uang koperasi adalah uang bersama seluruh anggota. Saat pembelian besar " +
        "mengalir ke pihak yang dekat dengan pengurus, Anda berhak memastikan harganya wajar.",
      bukti: [
        {
          jenis: "transaksi",
          id: t.id,
          label: `Pembelian ${rp} ke ${t.vendorNama}, ${t.tanggal}`,
        },
      ],
      pertanyaan_rat: `Bisakah pengurus menjelaskan alasan memilih ${t.vendorNama} untuk pembelian ${rp} ini?`,
    });
  }
  return out;
}

function forensicPayload(agent: string, userJson: string): { temuan: Finding[] } {
  let snap: Snapshot = {};
  try {
    snap = JSON.parse(userJson) as Snapshot;
  } catch {
    snap = {};
  }
  if (agent === "konflik_kepentingan") return { temuan: konflikFindings(snap) };
  // ponytail: agen lain kembalikan temuan kosong (deterministik, aman register).
  // Loop lintas surface hanya butuh temuan konflik yang merujuk transaksi baru;
  // upgrade: tambah deteksi pecah/kas/plafon bila skenario e2e memerlukannya.
  return { temuan: [] };
}

function adjudikatorPayload(userJson: string): {
  warna: "hijau" | "kuning" | "merah";
  ringkasan: string;
  temuan: Finding[];
} {
  let temuan: Finding[] = [];
  try {
    const parsed = JSON.parse(userJson) as { temuan?: Finding[] };
    temuan = Array.isArray(parsed.temuan) ? parsed.temuan : [];
  } catch {
    temuan = [];
  }
  const adaMerah = temuan.some((t) => t.severity === "merah");
  const adaKuning = temuan.some((t) => t.severity === "kuning");
  const warna = adaMerah ? "merah" : adaKuning ? "kuning" : "hijau";
  const ringkasan =
    warna === "hijau"
      ? "Tidak ada hal yang perlu Anda tanyakan pada pemeriksaan bulan ini."
      : "Ada pembelian yang perlu Anda tanyakan kepada pengurus bulan ini.";
  return { warna, ringkasan, temuan };
}

function chatContent(messages: Msg[]): string {
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  // Ambil pesan user TERAKHIR (retry korektif menambah pesan user; mode ok
  // tak pernah retry, tetapi ini tetap benar bila terjadi).
  const users = messages.filter((m) => m.role === "user");
  const user = users.length ? users[users.length - 1]!.content : "";
  const agent = detectAgent(system);
  const payload =
    agent === "adjudikator" ? adjudikatorPayload(user) : forensicPayload(agent, user);
  return JSON.stringify(payload);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => resolve(data));
    req.on("error", () => resolve(data));
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const s = JSON.stringify(body);
  res.writeHead(status, { "content-type": "application/json" });
  res.end(s);
}

const server = createServer(async (req, res) => {
  const url = req.url ?? "";
  const method = req.method ?? "GET";

  if (url.startsWith("/control")) {
    if (method === "GET" && url.startsWith("/control/stats")) {
      return sendJson(res, 200, { hits: state.hits });
    }
    if (method === "POST" && url.startsWith("/control/reset")) {
      state.hits = 0;
      return sendJson(res, 200, { ok: true, hits: 0 });
    }
    if (method === "POST" && url === "/control") {
      const body = await readBody(req);
      try {
        const parsed = JSON.parse(body) as { mode?: Mode };
        if (parsed.mode === "ok" || parsed.mode === "gagal") state.mode = parsed.mode;
      } catch {
        /* abaikan body rusak */
      }
      return sendJson(res, 200, { ok: true, mode: state.mode });
    }
    // /control/health dan GET /control
    return sendJson(res, 200, { ok: true, mode: state.mode, hits: state.hits });
  }

  if (url.startsWith("/v1/chat/completions") && method === "POST") {
    state.hits += 1;
    const body = await readBody(req);
    if (state.mode === "gagal") {
      return sendJson(res, 500, { error: { message: "mock LLM dipaksa gagal" } });
    }
    let content = "{}";
    try {
      const parsed = JSON.parse(body) as { messages?: Msg[] };
      content = chatContent(parsed.messages ?? []);
    } catch {
      content = JSON.stringify({ temuan: [] });
    }
    return sendJson(res, 200, {
      id: "mock-" + Date.now(),
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: "mock-minimax",
      choices: [
        { index: 0, message: { role: "assistant", content }, finish_reason: "stop" },
      ],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    });
  }

  return sendJson(res, 404, { error: { message: "not found" } });
});

// --- self-check (ponytail): assert konflik merujuk id + register bersih -------
if (process.argv.includes("--selftest")) {
  const snap: Snapshot = {
    pengurus: [{ nama: "Budi", jabatan: "bendahara", alamat: "Jl. Melati No. 12, Sukamaju" }],
    transaksi: [
      {
        id: "trx-baru-123",
        tanggal: "2026-06-14",
        jenis: "pembelian",
        jumlah: 15_000_000,
        vendorNama: "Toko Berkah",
        vendorAlamat: "Jl. Melati No. 12, Sukamaju",
      },
    ],
  };
  const f = konflikFindings(snap);
  const denylist = /\b(korupsi|mencuri|maling|penipuan|menggelapkan|pelaku|kamu)\b/i;
  const emdash = /[‒–—―]/;
  if (f.length !== 1) throw new Error("selftest: harus satu temuan konflik");
  if (f[0]!.bukti[0]!.id !== "trx-baru-123")
    throw new Error("selftest: bukti harus merujuk id transaksi");
  if (f[0]!.severity !== "merah") throw new Error("selftest: 15jt harus merah");
  for (const t of f) {
    for (const teks of [t.judul, t.penjelasan_awam, t.kenapa_penting, t.pertanyaan_rat]) {
      if (denylist.test(teks)) throw new Error("selftest: kata vonis/sapaan terlarang: " + teks);
      if (emdash.test(teks)) throw new Error("selftest: em dash terlarang");
    }
    if (!t.pertanyaan_rat.trimEnd().endsWith("?"))
      throw new Error("selftest: pertanyaan_rat harus diakhiri '?'");
  }
  const adj = adjudikatorPayload(JSON.stringify({ temuan: f }));
  if (adj.warna !== "merah") throw new Error("selftest: adjudikator warna harus merah");
  process.stdout.write("mock-llm selftest OK\n");
  process.exit(0);
}

server.listen(PORT, () => {
  process.stdout.write(`mock-llm listening on http://localhost:${PORT}\n`);
});
