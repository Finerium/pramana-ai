/**
 * Skema DB Pramana AI (blueprint 6.2). Nama tabel dan kolom BEKU; tipe internal
 * Drizzle bebas. Tanggal/waktu disimpan sebagai TEXT ISO agar seed deterministik
 * (tanpa drift timezone). FK aktif (lihat db/client.ts PRAGMA foreign_keys).
 * Indeks hot-path: transaksi(koperasiId,tanggal), temuan(auditRunId),
 * audit_run(koperasiId,periode); unique vote/pertanyaan_rat = penegak idempotensi.
 */
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("passwordHash").notNull(),
  role: text("role", {
    enum: ["anggota", "pemerintah", "pengurus"],
  }).notNull(),
  anggotaId: text("anggotaId").references(() => anggota.id),
  pengurusId: text("pengurusId").references(() => pengurus.id),
  createdAt: text("createdAt").notNull(),
});

export const koperasi = sqliteTable("koperasi", {
  id: text("id").primaryKey(),
  nama: text("nama").notNull(),
  desa: text("desa").notNull(),
  kabupaten: text("kabupaten").notNull(),
  provinsi: text("provinsi").notNull(),
  isDetailSeeded: integer("isDetailSeeded", { mode: "boolean" }).notNull(),
  saldoKas: integer("saldoKas").notNull(),
  ratStatus: text("ratStatus", {
    enum: ["belum", "terlaksana"],
  }).notNull(),
  ratTanggal: text("ratTanggal"),
  dibentukPada: text("dibentukPada").notNull(),
});

export const unitUsaha = sqliteTable("unit_usaha", {
  id: text("id").primaryKey(),
  koperasiId: text("koperasiId")
    .notNull()
    .references(() => koperasi.id),
  nama: text("nama").notNull(),
  jenis: text("jenis", {
    enum: [
      "sembako",
      "simpan_pinjam",
      "apotek",
      "klinik",
      "gudang",
      "logistik",
      "kantor",
    ],
  }).notNull(),
});

export const pengurus = sqliteTable("pengurus", {
  id: text("id").primaryKey(),
  koperasiId: text("koperasiId")
    .notNull()
    .references(() => koperasi.id),
  nama: text("nama").notNull(),
  jabatan: text("jabatan", {
    enum: ["ketua", "wakil", "sekretaris", "bendahara", "pengawas"],
  }).notNull(),
  alamat: text("alamat").notNull(),
});

export const anggota = sqliteTable("anggota", {
  id: text("id").primaryKey(),
  koperasiId: text("koperasiId")
    .notNull()
    .references(() => koperasi.id),
  nama: text("nama").notNull(),
  nik: text("nik").notNull(),
  noAnggota: text("noAnggota").notNull().unique(),
  alamat: text("alamat").notNull(),
  bergabungPada: text("bergabungPada").notNull(),
});

export const simpanan = sqliteTable("simpanan", {
  id: text("id").primaryKey(),
  anggotaId: text("anggotaId")
    .notNull()
    .references(() => anggota.id),
  jenis: text("jenis", {
    enum: ["pokok", "wajib", "sukarela"],
  }).notNull(),
  saldo: integer("saldo").notNull(),
});

export const pinjaman = sqliteTable("pinjaman", {
  id: text("id").primaryKey(),
  anggotaId: text("anggotaId")
    .notNull()
    .references(() => anggota.id),
  pokok: integer("pokok").notNull(),
  sisa: integer("sisa").notNull(),
  cicilanBulanan: integer("cicilanBulanan").notNull(),
  jatuhTempoBerikut: text("jatuhTempoBerikut").notNull(),
  disetujuiPada: text("disetujuiPada").notNull(),
  disetujuiOleh: text("disetujuiOleh")
    .notNull()
    .references(() => pengurus.id),
  dokumenLengkap: integer("dokumenLengkap", { mode: "boolean" }).notNull(),
});

export const transaksi = sqliteTable(
  "transaksi",
  {
    id: text("id").primaryKey(),
    koperasiId: text("koperasiId")
      .notNull()
      .references(() => koperasi.id),
    unitUsahaId: text("unitUsahaId").references(() => unitUsaha.id),
    tanggal: text("tanggal").notNull(),
    jenis: text("jenis", {
      enum: [
        "setoran_simpanan",
        "penarikan_simpanan",
        "pencairan_pinjaman",
        "angsuran",
        "pembelian",
        "penjualan",
        "gaji",
        "operasional",
        "shu",
      ],
    }).notNull(),
    arah: text("arah", { enum: ["masuk", "keluar"] }).notNull(),
    jumlah: integer("jumlah").notNull(),
    deskripsi: text("deskripsi").notNull(),
    vendorNama: text("vendorNama"),
    vendorAlamat: text("vendorAlamat"),
    anggotaId: text("anggotaId").references(() => anggota.id),
  },
  (t) => [index("idx_transaksi_koperasi_tanggal").on(t.koperasiId, t.tanggal)],
);

export const auditRun = sqliteTable(
  "audit_run",
  {
    id: text("id").primaryKey(),
    koperasiId: text("koperasiId")
      .notNull()
      .references(() => koperasi.id),
    periode: text("periode").notNull(),
    source: text("source", { enum: ["seed", "live", "cache"] }).notNull(),
    verdictWarna: text("verdictWarna", {
      enum: ["hijau", "kuning", "merah"],
    }).notNull(),
    ringkasan: text("ringkasan").notNull(),
    durasiMs: integer("durasiMs").notNull(),
    rawJson: text("rawJson").notNull(),
    dibuatPada: text("dibuatPada").notNull(),
  },
  (t) => [index("idx_audit_run_koperasi_periode").on(t.koperasiId, t.periode)],
);

export const temuan = sqliteTable(
  "temuan",
  {
    id: text("id").primaryKey(),
    auditRunId: text("auditRunId")
      .notNull()
      .references(() => auditRun.id),
    agent: text("agent", {
      enum: [
        "konflik_kepentingan",
        "anomali_transaksi",
        "kesehatan_finansial",
        "kepatuhan_proses",
      ],
    }).notNull(),
    severity: text("severity", {
      enum: ["info", "kuning", "merah"],
    }).notNull(),
    judul: text("judul").notNull(),
    penjelasanAwam: text("penjelasanAwam").notNull(),
    kenapaPenting: text("kenapaPenting").notNull(),
    pertanyaanRat: text("pertanyaanRat").notNull(),
    buktiJson: text("buktiJson").notNull(),
    tanggapanPengurus: text("tanggapanPengurus"),
  },
  (t) => [index("idx_temuan_auditrun").on(t.auditRunId)],
);

export const pertanyaanRat = sqliteTable(
  "pertanyaan_rat",
  {
    id: text("id").primaryKey(),
    temuanId: text("temuanId")
      .notNull()
      .references(() => temuan.id),
    anggotaId: text("anggotaId")
      .notNull()
      .references(() => anggota.id),
    ditambahkanPada: text("ditambahkanPada").notNull(),
  },
  (t) => [
    uniqueIndex("uq_pertanyaan_temuan_anggota").on(t.temuanId, t.anggotaId),
  ],
);

export const keputusan = sqliteTable("keputusan", {
  id: text("id").primaryKey(),
  koperasiId: text("koperasiId")
    .notNull()
    .references(() => koperasi.id),
  judul: text("judul").notNull(),
  deskripsi: text("deskripsi").notNull(),
  nominal: integer("nominal"),
  status: text("status", { enum: ["terbuka", "ditutup"] }).notNull(),
  dibukaPada: text("dibukaPada").notNull(),
});

export const vote = sqliteTable(
  "vote",
  {
    id: text("id").primaryKey(),
    keputusanId: text("keputusanId")
      .notNull()
      .references(() => keputusan.id),
    anggotaId: text("anggotaId")
      .notNull()
      .references(() => anggota.id),
    pilihan: text("pilihan", { enum: ["setuju", "tidak"] }).notNull(),
  },
  (t) => [
    uniqueIndex("uq_vote_keputusan_anggota").on(t.keputusanId, t.anggotaId),
  ],
);

export const notifikasi = sqliteTable("notifikasi", {
  id: text("id").primaryKey(),
  anggotaId: text("anggotaId")
    .notNull()
    .references(() => anggota.id),
  teks: text("teks").notNull(),
  dibacaPada: text("dibacaPada"),
  dibuatPada: text("dibuatPada").notNull(),
});

export const schema = {
  users,
  koperasi,
  unitUsaha,
  pengurus,
  anggota,
  simpanan,
  pinjaman,
  transaksi,
  auditRun,
  temuan,
  pertanyaanRat,
  keputusan,
  vote,
  notifikasi,
};
