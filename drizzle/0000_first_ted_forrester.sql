CREATE TABLE `anggota` (
	`id` text PRIMARY KEY NOT NULL,
	`koperasiId` text NOT NULL,
	`nama` text NOT NULL,
	`nik` text NOT NULL,
	`noAnggota` text NOT NULL,
	`alamat` text NOT NULL,
	`bergabungPada` text NOT NULL,
	FOREIGN KEY (`koperasiId`) REFERENCES `koperasi`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `anggota_noAnggota_unique` ON `anggota` (`noAnggota`);--> statement-breakpoint
CREATE TABLE `audit_run` (
	`id` text PRIMARY KEY NOT NULL,
	`koperasiId` text NOT NULL,
	`periode` text NOT NULL,
	`source` text NOT NULL,
	`verdictWarna` text NOT NULL,
	`ringkasan` text NOT NULL,
	`durasiMs` integer NOT NULL,
	`rawJson` text NOT NULL,
	`dibuatPada` text NOT NULL,
	FOREIGN KEY (`koperasiId`) REFERENCES `koperasi`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_audit_run_koperasi_periode` ON `audit_run` (`koperasiId`,`periode`);--> statement-breakpoint
CREATE TABLE `keputusan` (
	`id` text PRIMARY KEY NOT NULL,
	`koperasiId` text NOT NULL,
	`judul` text NOT NULL,
	`deskripsi` text NOT NULL,
	`nominal` integer,
	`status` text NOT NULL,
	`dibukaPada` text NOT NULL,
	FOREIGN KEY (`koperasiId`) REFERENCES `koperasi`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `koperasi` (
	`id` text PRIMARY KEY NOT NULL,
	`nama` text NOT NULL,
	`desa` text NOT NULL,
	`kabupaten` text NOT NULL,
	`provinsi` text NOT NULL,
	`isDetailSeeded` integer NOT NULL,
	`saldoKas` integer NOT NULL,
	`ratStatus` text NOT NULL,
	`ratTanggal` text,
	`dibentukPada` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notifikasi` (
	`id` text PRIMARY KEY NOT NULL,
	`anggotaId` text NOT NULL,
	`teks` text NOT NULL,
	`dibacaPada` text,
	`dibuatPada` text NOT NULL,
	FOREIGN KEY (`anggotaId`) REFERENCES `anggota`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `pengurus` (
	`id` text PRIMARY KEY NOT NULL,
	`koperasiId` text NOT NULL,
	`nama` text NOT NULL,
	`jabatan` text NOT NULL,
	`alamat` text NOT NULL,
	FOREIGN KEY (`koperasiId`) REFERENCES `koperasi`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `pertanyaan_rat` (
	`id` text PRIMARY KEY NOT NULL,
	`temuanId` text NOT NULL,
	`anggotaId` text NOT NULL,
	`ditambahkanPada` text NOT NULL,
	FOREIGN KEY (`temuanId`) REFERENCES `temuan`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`anggotaId`) REFERENCES `anggota`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_pertanyaan_temuan_anggota` ON `pertanyaan_rat` (`temuanId`,`anggotaId`);--> statement-breakpoint
CREATE TABLE `pinjaman` (
	`id` text PRIMARY KEY NOT NULL,
	`anggotaId` text NOT NULL,
	`pokok` integer NOT NULL,
	`sisa` integer NOT NULL,
	`cicilanBulanan` integer NOT NULL,
	`jatuhTempoBerikut` text NOT NULL,
	`disetujuiPada` text NOT NULL,
	`disetujuiOleh` text NOT NULL,
	`dokumenLengkap` integer NOT NULL,
	FOREIGN KEY (`anggotaId`) REFERENCES `anggota`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`disetujuiOleh`) REFERENCES `pengurus`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `simpanan` (
	`id` text PRIMARY KEY NOT NULL,
	`anggotaId` text NOT NULL,
	`jenis` text NOT NULL,
	`saldo` integer NOT NULL,
	FOREIGN KEY (`anggotaId`) REFERENCES `anggota`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `temuan` (
	`id` text PRIMARY KEY NOT NULL,
	`auditRunId` text NOT NULL,
	`agent` text NOT NULL,
	`severity` text NOT NULL,
	`judul` text NOT NULL,
	`penjelasanAwam` text NOT NULL,
	`kenapaPenting` text NOT NULL,
	`pertanyaanRat` text NOT NULL,
	`buktiJson` text NOT NULL,
	`tanggapanPengurus` text,
	FOREIGN KEY (`auditRunId`) REFERENCES `audit_run`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_temuan_auditrun` ON `temuan` (`auditRunId`);--> statement-breakpoint
CREATE TABLE `transaksi` (
	`id` text PRIMARY KEY NOT NULL,
	`koperasiId` text NOT NULL,
	`unitUsahaId` text,
	`tanggal` text NOT NULL,
	`jenis` text NOT NULL,
	`arah` text NOT NULL,
	`jumlah` integer NOT NULL,
	`deskripsi` text NOT NULL,
	`vendorNama` text,
	`vendorAlamat` text,
	`anggotaId` text,
	FOREIGN KEY (`koperasiId`) REFERENCES `koperasi`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`unitUsahaId`) REFERENCES `unit_usaha`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`anggotaId`) REFERENCES `anggota`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_transaksi_koperasi_tanggal` ON `transaksi` (`koperasiId`,`tanggal`);--> statement-breakpoint
CREATE TABLE `unit_usaha` (
	`id` text PRIMARY KEY NOT NULL,
	`koperasiId` text NOT NULL,
	`nama` text NOT NULL,
	`jenis` text NOT NULL,
	FOREIGN KEY (`koperasiId`) REFERENCES `koperasi`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`passwordHash` text NOT NULL,
	`role` text NOT NULL,
	`anggotaId` text,
	`pengurusId` text,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`anggotaId`) REFERENCES `anggota`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`pengurusId`) REFERENCES `pengurus`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `vote` (
	`id` text PRIMARY KEY NOT NULL,
	`keputusanId` text NOT NULL,
	`anggotaId` text NOT NULL,
	`pilihan` text NOT NULL,
	FOREIGN KEY (`keputusanId`) REFERENCES `keputusan`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`anggotaId`) REFERENCES `anggota`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_vote_keputusan_anggota` ON `vote` (`keputusanId`,`anggotaId`);