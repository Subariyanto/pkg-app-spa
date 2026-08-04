// Saran dokumen penggalian data per peran + kompetensi
// Format: SARAN_DOKUMEN[role_code][komp_no] = { metode: [], sumber: 'list dokumen yg perlu digali', catatan: 'tips/petunjuk teknis' }
// Sumber: panduan PKG Kemenag + praktik pengawas madrasah
window.SARAN_DOKUMEN = {
  // === GURU MATA PELAJARAN / KELAS ===
  GMP: {
    1: {
      metode: ['observasi', 'dokumen', 'wawancara'],
      sumber: 'Daftar hadir siswa; jurnal/buku catatan kelas; profil/biodata peserta didik; hasil asesmen awal/diagnostik; catatan anekdotal; jurnal komunikasi orang tua; data inklusif (siswa berkebutuhan khusus); foto kegiatan kelas',
      catatan: 'Cek apakah guru mengenal nama, latar belakang, gaya belajar, dan kondisi sosial-emosional siswa. Tanya 3-5 nama siswa secara acak: kepribadian, kemampuan, minat, kesulitan belajarnya. Lihat bukti pemetaan kebutuhan belajar (assesmen diagnostik).'
    },
    2: {
      metode: ['observasi', 'dokumen'],
      sumber: 'RPP/Modul Ajar; jurnal mengajar; lembar kerja siswa; foto/video pembelajaran; daftar buku referensi; bukti penggunaan model/strategi pembelajaran',
      catatan: 'Periksa kesesuaian model pembelajaran dengan tujuan dan karakteristik siswa. Saksikan minimal 1 jam pelajaran. Cek variasi metode (ceramah, diskusi, problem-based, project-based, dll). Cek prinsip pembelajaran berdiferensiasi dan TPACK.'
    },
    3: {
      metode: ['dokumen', 'wawancara'],
      sumber: 'Silabus/CP-TP; ATP (Alur Tujuan Pembelajaran); Prota & Promes; RPP/Modul Ajar; kalender pendidikan; KTSP/Kurikulum Operasional Madrasah; LKPD; bahan ajar; soal ulangan/penilaian',
      catatan: 'Cek konsistensi antara CP, TP, ATP, dan RPP/MA. Pastikan KKM/KKTP ditetapkan. Verifikasi keterkaitan dengan kalender akademik. Cek penyesuaian dengan kondisi madrasah dan siswa.'
    },
    4: {
      metode: ['observasi', 'dokumen'],
      sumber: 'RPP/Modul Ajar; jurnal pembelajaran; observasi kelas (minimal 1 JP); foto/video kegiatan; LKPD; portofolio siswa; daftar media/alat peraga; rekaman umpan balik',
      catatan: 'Observasi langsung pembelajaran! Perhatikan: pembukaan-inti-penutup, manajemen waktu, interaksi guru-siswa, penggunaan media, kegiatan diferensiasi, refleksi & umpan balik di akhir.'
    },
    5: {
      metode: ['dokumen', 'wawancara'],
      sumber: 'Program pengayaan & remedial; daftar prestasi siswa (akademik & non-akademik); SK pembina ekskul/lomba; portofolio siswa; piagam/sertifikat siswa; rekap nilai; catatan bimbingan siswa',
      catatan: 'Cari bukti guru memfasilitasi pengembangan potensi: program ekskul yang dibimbing, pembinaan lomba, mentoring siswa berbakat. Wawancara 2-3 siswa: apakah pernah dibimbing/didorong oleh guru ini.'
    },
    6: {
      metode: ['observasi', 'wawancara'],
      sumber: 'Observasi langsung interaksi kelas; rekaman audio/video pembelajaran; testimoni siswa & rekan; jurnal komunikasi; catatan home visit',
      catatan: 'Saksikan bagaimana guru bertanya, mendengarkan jawaban siswa, memberi penguatan, mengelola siswa yang pasif/aktif. Tanya 2-3 siswa apakah merasa nyaman bertanya pada guru ini.'
    },
    7: {
      metode: ['dokumen', 'wawancara'],
      sumber: 'Kisi-kisi soal; instrumen penilaian (sikap/pengetahuan/keterampilan); daftar nilai; analisis hasil penilaian; rubrik; bank soal; rapor; bukti remedial & pengayaan; portofolio siswa',
      catatan: 'Cek kelengkapan 3 ranah: sikap (jurnal/observasi), pengetahuan (tes/non-tes), keterampilan (kinerja/produk). Lihat tindak lanjut: apakah hasil dianalisis & jadi dasar remedial/pengayaan?'
    },
    8: {
      metode: ['observasi', 'wawancara'],
      sumber: 'Catatan kepala madrasah; rekam jejak kehadiran; testimoni rekan; observasi keseharian (sopan santun, ibadah, ucapan); catatan pengawas/komite',
      catatan: 'Wawancara kamad, rekan guru, dan 2-3 siswa: bagaimana guru ini bersikap, beretika, beribadah. Cek konsistensi antara ucapan dan tindakan.'
    },
    9: {
      metode: ['observasi', 'wawancara'],
      sumber: 'Catatan kepala madrasah; daftar hadir/disiplin; testimoni siswa & orang tua; observasi penampilan & sikap; catatan kasus disiplin',
      catatan: 'Lihat kemandirian, keteladanan, kedewasaan dalam menyikapi masalah. Tanya kamad bagaimana guru ini menghadapi situasi sulit (konflik siswa/orang tua).'
    },
    10: {
      metode: ['dokumen', 'observasi', 'wawancara'],
      sumber: 'Daftar hadir guru (manual/digital); log book/jurnal mengajar harian; SK kepanitiaan kegiatan madrasah; sertifikat partisipasi diklat/seminar; bukti kegiatan ekstra (membina ekskul, mentoring); catatan kontribusi madrasah',
      catatan: 'Cek persentase kehadiran 6 bulan terakhir. Lihat keterlibatan dalam kegiatan madrasah di luar jam mengajar. Cek inisiatif: apakah guru ini menerima tugas tambahan dengan ikhlas?'
    },
    11: {
      metode: ['observasi', 'dokumen', 'wawancara'],
      sumber: 'Daftar siswa beragam (gender, agama, suku, kemampuan, sosio-ekonomi); jurnal kelas; testimoni siswa; observasi pembelajaran; foto kegiatan kelas',
      catatan: 'Periksa apakah guru memperlakukan semua siswa dengan adil tanpa pilih kasih. Lihat penanganan siswa berkebutuhan khusus, siswa kurang mampu, siswa berbeda latar belakang.'
    },
    12: {
      metode: ['dokumen', 'wawancara'],
      sumber: 'Notulen rapat; grup WA paguyuban orang tua; laporan bulanan; bukti kunjungan rumah (home visit); MoU/kerjasama madrasah; catatan dialog dengan komite',
      catatan: 'Cek bukti komunikasi dua arah dengan orang tua siswa: rekap WA, notulen pertemuan, laporan home visit. Tanya 2 orang tua apakah pernah dihubungi guru ini.'
    },
    13: {
      metode: ['dokumen', 'wawancara'],
      sumber: 'Ijazah & transkrip nilai (S1/S2 sesuai mapel); sertifikat profesi/sertifikasi guru; sertifikat diklat fungsional; RPP/MA; bahan ajar; bukti tulisan ilmiah (artikel/PTK/buku); hasil tes mapel siswa',
      catatan: 'Cek linieritas ijazah dengan mapel yang diampu. Untuk penguasaan materi: pegang RPP/MA, tanya guru tentang konsep di pertemuan ke-3. Cek hasil ulangan siswa: apakah konsisten?'
    },
    14: {
      metode: ['dokumen', 'wawancara'],
      sumber: 'Sertifikat PKB (Pengembangan Keprofesian Berkelanjutan); makalah/PTK/best practice; jurnal refleksi pembelajaran; sertifikat diklat/seminar 2 tahun terakhir; bukti partisipasi MGMP/KKG; karya inovatif (modul, video pembelajaran)',
      catatan: 'Cek minimal 24 JP pelatihan/tahun atau bukti PKB lain. Tanya guru: apa pelatihan terakhir yang diikuti & apa diterapkan ke kelas? Cek refleksi pembelajaran rutin (mingguan/bulanan).'
    },
  },
  // === GURU BIMBINGAN KONSELING ===
  BK: {
    1: { metode: ['dokumen'], sumber: 'Program tahunan & semester BK; rancangan layanan BK; instrumen need assessment; data peserta didik (DCM/AUM); buku saku konseling', catatan: 'Cek kelengkapan dokumen perencanaan layanan BK. Verifikasi pendekatan komprehensif: dasar, responsif, perencanaan individual, dukungan sistem.' },
    2: { metode: ['observasi', 'dokumen'], sumber: 'Jurnal layanan BK; RPL (Rencana Pelaksanaan Layanan); foto/video layanan klasikal; daftar hadir layanan; instrumen layanan', catatan: 'Saksikan layanan klasikal/kelompok minimal 1 sesi. Cek variasi teknik: bimbingan klasikal, kelompok, konseling individu, mediasi.' },
    3: { metode: ['dokumen', 'wawancara'], sumber: 'Buku catatan kasus; rekap home visit; konferensi kasus; rujukan ke psikolog/ahli; laporan layanan responsif', catatan: 'Cek kemampuan menangani kasus: minimal 5 catatan kasus terdokumentasi. Tanya kepala madrasah & wali kelas pengalaman koordinasi BK.' },
    4: { metode: ['dokumen'], sumber: 'Laporan evaluasi BK semester; rekap data konseli; analisis dampak layanan; tindak lanjut', catatan: 'Lihat ketersediaan evaluasi proses & hasil. Cek apakah ada perbaikan layanan berdasar evaluasi.' },
  },
  // === GURU TIK ===
  TIK: {
    1: { metode: ['dokumen', 'observasi'], sumber: 'Program kerja TIK madrasah; perencanaan layanan TIK; SOP penggunaan lab komputer; jurnal pemanfaatan TIK', catatan: 'Cek perencanaan layanan TIK menyeluruh: untuk siswa, guru, kepala madrasah, tendik.' },
    2: { metode: ['observasi', 'wawancara'], sumber: 'Daftar siswa yang dibimbing TIK; jurnal bimbingan; bukti hasil karya digital siswa; testimoni siswa', catatan: 'Verifikasi minimal 1 sesi bimbingan TIK. Cek hasil produk digital siswa.' },
  },
  // === GURU LAB ===
  LAB: {
    1: { metode: ['dokumen', 'observasi'], sumber: 'Inventarisasi alat & bahan lab; jadwal penggunaan lab; SOP keselamatan; daftar piket lab', catatan: 'Cek kelengkapan alat sesuai mata pelajaran. Verifikasi SOP K3 lab terpasang & dipahami.' },
    2: { metode: ['observasi', 'dokumen'], sumber: 'Jurnal kegiatan lab; LKPD praktikum; foto/video praktikum; laporan kegiatan lab semester', catatan: 'Saksikan minimal 1 sesi praktikum yang dipandu. Periksa pemanfaatan lab: berapa kali sebulan?' },
  },
  // === PUSTAKAWAN ===
  PUS: {
    1: { metode: ['dokumen', 'observasi'], sumber: 'Inventaris koleksi perpustakaan; daftar pengunjung & peminjam; tata tertib perpustakaan; struktur klasifikasi koleksi', catatan: 'Cek pengelolaan koleksi: katalogisasi, klasifikasi, daftar peminjaman. Lihat statistik kunjungan.' },
    2: { metode: ['dokumen', 'wawancara'], sumber: 'Program literasi; jadwal jam baca; rekap kegiatan literasi; bukti kerjasama dengan guru/wali kelas', catatan: 'Verifikasi program literasi rutin. Tanya guru/siswa keterlibatan pustakawan dalam pembiasaan literasi.' },
  },
  // === WAKA KURIKULUM ===
  WKKUR: {
    1: { metode: ['dokumen'], sumber: 'KTSP/Kurikulum Operasional Madrasah; SK Tim Pengembang Kurikulum; notulen rapat kurikulum; analisis konteks kurikulum', catatan: 'Cek dokumen 1 (KTSP/KOM) lengkap & disahkan kepala madrasah. Lihat analisis konteks (8 SNP).' },
    2: { metode: ['dokumen'], sumber: 'Jadwal pelajaran; pembagian tugas mengajar; kalender pendidikan; SK pembagian tugas; jam linier sesuai sertifikat pendidik', catatan: 'Verifikasi linieritas guru-mapel. Cek jumlah jam tatap muka minimal 24 JP.' },
    3: { metode: ['dokumen'], sumber: 'Program pelaksanaan ekstrakurikuler; SK Pembina ekskul; jadwal & jurnal ekskul; rekap kegiatan tahunan', catatan: 'Cek minimal pramuka wajib + ekskul pilihan. Lihat program kegiatan & evaluasinya.' },
    4: { metode: ['dokumen'], sumber: 'Program supervisi akademik internal; instrumen supervisi; rekap hasil supervisi; tindak lanjut supervisi', catatan: 'Verifikasi pelaksanaan supervisi guru oleh waka kurikulum & kamad. Lihat siklus supervisi: rencana-pelaksanaan-evaluasi-tindak lanjut.' },
  },
  // === WAKA KESISWAAN ===
  WKSIS: {
    1: { metode: ['dokumen'], sumber: 'Program kerja kesiswaan; SK OSIS; rencana kegiatan tahunan; tata tertib siswa', catatan: 'Cek struktur program kesiswaan: pembinaan, pengembangan, penghargaan & sanksi.' },
    2: { metode: ['dokumen', 'observasi'], sumber: 'Daftar prestasi siswa; piagam penghargaan; dokumentasi kegiatan; SK pendamping lomba', catatan: 'Verifikasi prestasi siswa 1 tahun terakhir & pendampingan/pembinaannya.' },
    3: { metode: ['dokumen'], sumber: 'Tata tertib madrasah; buku catatan pelanggaran; jurnal BK; surat panggilan orang tua', catatan: 'Cek pelaksanaan disiplin siswa & penanganan pelanggaran berjenjang.' },
  },
  // === WAKA SARPRAS ===
  WKSAR: {
    1: { metode: ['dokumen', 'observasi'], sumber: 'Inventaris sarana prasarana; jadwal pemeliharaan; daftar usulan pengadaan; laporan kondisi gedung', catatan: 'Cek inventaris terupdate. Verifikasi langsung kondisi: ruang kelas, perpustakaan, lab, toilet, halaman.' },
    2: { metode: ['dokumen'], sumber: 'RKAM (Rencana Kegiatan & Anggaran Madrasah); LPJ pengadaan; bukti pemeliharaan rutin; foto sebelum-sesudah', catatan: 'Cek perencanaan & realisasi pengadaan/pemeliharaan sesuai anggaran.' },
  },
  // === WAKA HUMAS ===
  WKHUM: {
    1: { metode: ['dokumen'], sumber: 'Program kerja humas; data komite madrasah; daftar mitra/MoU; brosur & web madrasah', catatan: 'Cek aktivitas komunikasi eksternal: dengan komite, instansi, masyarakat, alumni.' },
    2: { metode: ['dokumen', 'wawancara'], sumber: 'Notulen rapat komite; bukti kegiatan kerjasama; surat keluar-masuk humas; dokumentasi PPDB', catatan: 'Verifikasi peran humas di PPDB, hubungan komite, penanganan keluhan masyarakat.' },
  },
};
