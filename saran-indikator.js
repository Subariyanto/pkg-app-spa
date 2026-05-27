// Saran dokumen penggalian data per indikator (lebih detail dari per-kompetensi)
// Format: SARAN_INDIKATOR[role_code][komp_no][ind_no] = { metode, sumber, catatan }
// Fallback: kalau tidak ada per-indikator, pakai SARAN_DOKUMEN per kompetensi
window.SARAN_INDIKATOR = {
  GMP: {
    // === K1 Mengenal karakteristik peserta didik (4) ===
    1: {
      1: {
        metode: ['observasi', 'dokumen', 'wawancara'],
        sumber: 'Hasil asesmen diagnostik kognitif & non-kognitif; profil/biodata siswa; catatan observasi gaya belajar (visual/auditori/kinestetik); jurnal anekdotal; hasil tes minat/bakat',
        catatan: 'Cek bukti pemetaan gaya belajar individu. Tanya guru: "Sebut 3 siswa dengan gaya belajar berbeda dan strategi yang Bapak/Ibu pakai untuk masing-masing." Lihat apakah RPP merancang aktivitas berdiferensiasi.'
      },
      2: {
        metode: ['observasi'],
        sumber: 'Observasi langsung pembelajaran (1 JP penuh); jurnal partisipasi siswa; rekaman audio/video kelas; catatan rotasi giliran berbicara/menjawab',
        catatan: 'Hitung berapa siswa yang ditunjuk/diajak bicara dalam 1 JP. Apakah merata atau terfokus pada anak yang aktif/pintar? Lihat strategi penanganan siswa pasif.'
      },
      3: {
        metode: ['dokumen', 'wawancara'],
        sumber: 'Buku catatan kasus/buku BK kelas; jurnal anekdotal; catatan home visit; surat panggilan orang tua; rujukan ke BK; notulen konferensi kasus',
        catatan: 'Cek minimal 2-3 catatan kasus penyimpangan perilaku & cara guru mengidentifikasi penyebab. Tanya wali kelas/BK: bagaimana koordinasi dengan guru ini?'
      },
      4: {
        metode: ['dokumen', 'wawancara'],
        sumber: 'Hasil tes minat-bakat; angket minat siswa; portofolio prestasi siswa; catatan pembinaan ekskul; jurnal pengembangan potensi',
        catatan: 'Verifikasi guru tahu minat & bakat siswa-siswanya. Lihat bukti tindak lanjut: rekomendasi ke ekskul, lomba, pembinaan khusus.'
      },
    },
    // === K2 Menguasai teori belajar dan prinsip-prinsip pembelajaran (6) ===
    2: {
      1: {
        metode: ['observasi', 'dokumen'],
        sumber: 'RPP/Modul Ajar; LKPD; observasi pembelajaran; bahan ajar berdiferensiasi; rancangan kegiatan pembelajaran',
        catatan: 'Lihat di RPP/MA: ada tidak strategi diferensiasi konten/proses/produk? Saksikan kelas: apakah aktivitas bervariasi sesuai kemampuan?'
      },
      2: {
        metode: ['observasi'],
        sumber: 'Observasi langsung pembelajaran; rekaman pembelajaran; catatan asesmen formatif (kuis, exit ticket, thumbs up/down)',
        catatan: 'Saksikan apakah guru sering cek pemahaman (formative check) di tengah pembelajaran. Lihat penyesuaian aktivitas berikutnya berdasar respon siswa.'
      },
      3: {
        metode: ['observasi', 'wawancara'],
        sumber: 'RPP/Modul Ajar (rencana vs realisasi); jurnal pembelajaran; refleksi guru; observasi kelas',
        catatan: 'Setelah observasi, tanya guru: "Bagian mana yang berhasil/kurang berhasil tadi & kenapa?" Cek kemampuan guru menjelaskan keputusan pedagogisnya.'
      },
      4: {
        metode: ['observasi', 'dokumen'],
        sumber: 'RPP/Modul Ajar bagian apersepsi & motivasi; observasi pembelajaran; daftar variasi teknik motivasi (story telling, ice breaking, gamifikasi, problem-based)',
        catatan: 'Catat berapa teknik motivasi yang dipakai guru selama 1 JP. Apakah relevan dengan materi & tujuan? Apakah siswa terlibat?'
      },
      5: {
        metode: ['dokumen'],
        sumber: 'Silabus/CP-TP; ATP; RPP/Modul Ajar (lihat keterkaitan antar pertemuan); peta konsep; analisis materi prasyarat',
        catatan: 'Cek keterkaitan antar RPP: pertemuan 1-2-3 saling membangun atau lompat-lompat? Cek scaffolding berbasis kompetensi prasyarat.'
      },
      6: {
        metode: ['observasi', 'dokumen'],
        sumber: 'Catatan refleksi pembelajaran guru; jurnal pembelajaran; catatan tindak lanjut siswa yang belum tuntas; rancangan pembelajaran berikutnya',
        catatan: 'Cek bukti reflektif guru: apa yang dilakukan ketika ada siswa kurang paham? Lihat perubahan rencana di pertemuan berikutnya.'
      },
    },
    // === K3 Pengembangan kurikulum (6) ===
    3: {
      1: {
        metode: ['dokumen'],
        sumber: 'Silabus/CP-TP; ATP (Alur Tujuan Pembelajaran); analisis SKL-KI-KD/CP; dokumen kurikulum operasional madrasah',
        catatan: 'Cek silabus/ATP lengkap, sesuai struktur kurikulum (K-13/Kurmer), disahkan kamad. Verifikasi pemetaan TP-CP yang konsisten.'
      },
      2: {
        metode: ['dokumen'],
        sumber: 'RPP/Modul Ajar; silabus rujukan; kisi-kisi soal; LKPD',
        catatan: 'Pasangkan RPP/MA dengan silabus/ATP-nya. Cek konsistensi tujuan-kegiatan-asesmen. Lihat capaian KD/TP yang dirancang.'
      },
      3: {
        metode: ['dokumen'],
        sumber: 'Bahan ajar; modul; handout; PPT pembelajaran; LKPD; bank soal',
        catatan: 'Cek apakah materi disusun guru sendiri atau hanya copy buku. Lihat kelengkapan untuk mencapai TP/KD.'
      },
      4: {
        metode: ['dokumen', 'observasi'],
        sumber: 'Prota & Promes; jurnal mengajar; jadwal pembelajaran; ATP; daftar urutan TP/KD',
        catatan: 'Bandingkan urutan materi di Prota dengan jurnal mengajar aktual. Apakah konsisten? Cek logika urutan: dari dasar ke kompleks.'
      },
      5: {
        metode: ['dokumen'],
        sumber: 'RPP/Modul Ajar; analisis materi (referensi up-to-date); LKPD; bahan ajar; daftar buku rujukan',
        catatan: 'Cek 5 kriteria: (a) sesuai TP, (b) tepat & mutakhir (referensi <5 thn), (c) sesuai usia, (d) feasible di kelas, (e) kontekstual.'
      },
      6: {
        metode: ['dokumen', 'observasi'],
        sumber: 'RPP/Modul Ajar (bagian nilai); jurnal pembelajaran; observasi pembelajaran; bukti integrasi nilai cinta-empati-keteladanan',
        catatan: 'Cari di RPP & saksikan di kelas: apakah nilai cinta/empati/keteladanan terintegrasi dalam materi mapel (bukan ditambah-tambahkan)?'
      },
    },
    // === K4 Kegiatan Pembelajaran yang Mendidik (10) ===
    4: {
      1: {
        metode: ['observasi', 'dokumen'],
        sumber: 'RPP/Modul Ajar; observasi pembelajaran; jurnal pembelajaran; rekaman video',
        catatan: 'Bandingkan rancangan RPP dengan pelaksanaan di kelas. Catat % kesesuaian. Apakah tujuan pembelajaran tercapai sesuai indikator?'
      },
      2: {
        metode: ['observasi'],
        sumber: 'Observasi langsung; rekaman audio/video kelas; testimoni siswa; jurnal anekdotal',
        catatan: 'Lihat bahasa & tone guru saat memberi tugas/asesmen. Apakah membuat siswa stress atau termotivasi? Cek apakah ada penghakiman/labeling.'
      },
      3: {
        metode: ['observasi'],
        sumber: 'Observasi langsung pembelajaran; rekaman; catatan momen "kesalahan siswa" dan respon guru',
        catatan: 'Catat 2-3 momen ketika siswa salah jawab. Apakah guru langsung koreksi atau ajak siswa lain berdiskusi dulu? Cek growth mindset.'
      },
      4: {
        metode: ['dokumen', 'observasi'],
        sumber: 'RPP/Modul Ajar; observasi kontekstualisasi materi; LKPD; bahan ajar; rancangan studi kasus',
        catatan: 'Cek bukti contoh-contoh kontekstual di RPP & saat mengajar. Apakah materi dihubungkan dengan kehidupan sehari-hari siswa?'
      },
      5: {
        metode: ['observasi'],
        sumber: 'Observasi pembelajaran (berbagai kelas/jam); jurnal variasi metode; RPP/MA',
        catatan: 'Saksikan minimal 2 sesi berbeda. Catat metode yg dipakai (ceramah, diskusi, PBL, PjBL, role play, dll). Apakah variasi sesuai konteks?'
      },
      6: {
        metode: ['observasi'],
        sumber: 'Observasi langsung; rekaman pembelajaran; catatan time-on-task; jurnal manajemen kelas',
        catatan: 'Hitung % waktu produktif (siswa belajar/aktif) vs waktu mati. Cek manajemen transisi antar aktivitas. Apakah guru mendominasi atau memfasilitasi?'
      },
      7: {
        metode: ['observasi'],
        sumber: 'Observasi pembelajaran; rekaman; catatan jumlah & kualitas pertanyaan siswa; LKPD interaktif',
        catatan: 'Hitung jumlah pertanyaan siswa dalam 1 JP. Lihat ruang interaksi peer-to-peer (diskusi, kerja kelompok). Cek balance guru-siswa-siswa.'
      },
      8: {
        metode: ['observasi', 'dokumen'],
        sumber: 'RPP/Modul Ajar (urutan kegiatan); observasi pelaksanaan; jurnal pembelajaran',
        catatan: 'Cek alur sistematis: pendahuluan-inti-penutup. Apakah inti dibagi cek pemahaman bertahap (chunking) atau dijejalkan sekaligus?'
      },
      9: {
        metode: ['observasi', 'dokumen'],
        sumber: 'Daftar media/alat peraga yang dimiliki guru; RPP/MA; observasi penggunaan media; foto/screenshot media digital; bukti penggunaan TIK',
        catatan: 'Cek variasi media: cetak, audio, visual, digital, alat peraga konkret. Saksikan penggunaan riil di kelas, bukan sekadar terdaftar.'
      },
      10: {
        metode: ['observasi', 'dokumen'],
        sumber: 'RPP/Modul Ajar bagian aktivitas HOTS; LKPD berbasis problem/project; observasi diskusi reflektif; bukti kolaborasi siswa',
        catatan: 'Cari bukti deep learning: siswa diajak berpikir kritis (menganalisis, mengevaluasi), refleksi, dan kolaborasi (bukan hafalan).'
      },
    },
    // === K5 Memahami dan mengembangkan potensi (6) ===
    5: {
      1: {
        metode: ['dokumen'],
        sumber: 'Daftar nilai (formatif, sumatif, harian); analisis hasil belajar; rekap nilai per KD/TP; mapping individual progress',
        catatan: 'Cek apakah analisis hasil bukan sekadar daftar nilai, tapi ada interpretasi: siapa yang tinggi/rendah di KD apa, apa pola masalahnya.'
      },
      2: {
        metode: ['dokumen', 'observasi'],
        sumber: 'RPP/Modul Ajar berdiferensiasi; LKPD level berbeda; rancangan kelompok belajar; observasi diferensiasi',
        catatan: 'Cek bukti diferensiasi konten/proses/produk. Lihat variasi LKPD untuk siswa cepat vs lambat.'
      },
      3: {
        metode: ['observasi', 'dokumen'],
        sumber: 'RPP/Modul Ajar bagian HOTS; LKPD problem/project-based; observasi diskusi & presentasi; karya kreatif siswa',
        catatan: 'Saksikan momen siswa diminta berpikir kreatif/kritis (bukan hanya recall). Cek pertanyaan tingkat aplikasi-analisis-evaluasi.'
      },
      4: {
        metode: ['observasi'],
        sumber: 'Observasi langsung pembelajaran; rekaman; catatan interaksi guru-individu; jurnal pendampingan',
        catatan: 'Catat berapa siswa yang dihampiri/dibantu individual oleh guru selama tugas. Apakah merata? Lihat kualitas feedback individu.'
      },
      5: {
        metode: ['dokumen', 'wawancara'],
        sumber: 'Catatan asesmen diagnostik; portofolio siswa; jurnal anekdotal; data kesulitan belajar; rekomendasi BK',
        catatan: 'Cek apakah guru mampu menyebutkan nama siswa dan minat/bakat/kesulitan spesifiknya. Verifikasi dengan dokumen pendukung.'
      },
      6: {
        metode: ['observasi', 'dokumen'],
        sumber: 'RPP/Modul Ajar bagian pembiasaan; jurnal pembelajaran; observasi pembiasaan 7 Kebiasaan Anak Indonesia Hebat (bangun pagi, beribadah, gerakan, makan sehat, gemar belajar, bermasyarakat, tidur cepat)',
        catatan: 'Cari bukti pembiasaan rutin di kelas. Apakah konsisten atau hanya formalitas? Tanya 2-3 siswa kebiasaan apa yang dibangun guru.'
      },
    },
    // === K6 Komunikasi dengan peserta didik (5) ===
    6: {
      1: {
        metode: ['observasi'],
        sumber: 'Observasi pembelajaran; rekaman; catatan jenis pertanyaan (terbuka vs tertutup); analisis tingkat kognitif pertanyaan',
        catatan: 'Klasifikasi pertanyaan guru: pertanyaan terbuka (HOTS) vs tertutup (LOTS). Hitung rasio. Apakah memancing partisipasi atau mengintimidasi?'
      },
      2: {
        metode: ['observasi'],
        sumber: 'Observasi langsung; rekaman audio/video; catatan momen interupsi vs mendengarkan',
        catatan: 'Catat momen siswa bertanya/menjawab. Apakah guru memberi waktu (wait time) atau langsung interupsi? Cek bahasa tubuh saat mendengar.'
      },
      3: {
        metode: ['observasi'],
        sumber: 'Observasi pembelajaran; rekaman; catatan respon guru terhadap pertanyaan siswa; tinjauan akurasi konten',
        catatan: 'Cek apakah guru menjawab benar, akurat, dan up-to-date. Catat respons saat tidak tahu jawaban: jujur "nanti saya cek" atau ngeles?'
      },
      4: {
        metode: ['observasi', 'dokumen'],
        sumber: 'RPP/Modul Ajar bagian kerja kelompok; LKPD kolaboratif; observasi dinamika kelompok; jurnal kerja sama',
        catatan: 'Saksikan kerja kelompok: apakah ada pembagian peran jelas, peer learning, atau hanya 1-2 anak yang bekerja? Cek desain kolaboratif RPP.'
      },
      5: {
        metode: ['observasi'],
        sumber: 'Observasi pembelajaran; rekaman; catatan eye contact, nodding, parafrase guru saat siswa bicara',
        catatan: 'Cek bahasa nonverbal guru: kontak mata, anggukan, parafrase ulang jawaban siswa. Apakah semua jawaban diapresiasi (tidak hanya yang benar)?'
      },
    },
    // === K7 Penilaian dan evaluasi (5) ===
    7: {
      1: {
        metode: ['dokumen'],
        sumber: 'Kisi-kisi soal; instrumen penilaian (tes & non-tes); rubrik; bank soal; RPP/MA bagian asesmen',
        catatan: 'Cek konsistensi: indikator soal sesuai TP/KD di RPP? Variasi tipe (PG, esai, kinerja, produk, projek)? Lihat rubrik penskoran.'
      },
      2: {
        metode: ['dokumen'],
        sumber: 'Daftar nilai (formatif, sumatif, harian); jurnal penilaian sikap; rekap penilaian keterampilan; hasil ulangan; portofolio',
        catatan: 'Cek 3 ranah: sikap (observasi/jurnal), pengetahuan (tes), keterampilan (kinerja/produk). Apakah hasil dikomunikasikan ke siswa?'
      },
      3: {
        metode: ['dokumen'],
        sumber: 'Analisis butir soal; analisis hasil penilaian per KD; rekap remedial & pengayaan; rancangan tindak lanjut',
        catatan: 'Cek dokumen analisis: KD mana sulit untuk siswa, siapa yang remedial, siapa pengayaan. Lihat tindak lanjut konkretnya.'
      },
      4: {
        metode: ['dokumen', 'wawancara'],
        sumber: 'Catatan refleksi guru; jurnal pembelajaran; rancangan pembelajaran revisi; bukti perubahan strategi setelah masukan siswa',
        catatan: 'Cek dokumen refleksi yang menyebut masukan siswa. Tanya 2-3 siswa: pernahkah guru menanya pendapat tentang pembelajaran?'
      },
      5: {
        metode: ['observasi', 'dokumen'],
        sumber: 'Instrumen asesmen (apakah memotivasi); observasi asesmen di kelas; testimoni siswa; format refleksi siswa',
        catatan: 'Cek bahasa instrumen asesmen: apakah motivatif atau menakutkan? Apakah ada ruang refleksi siswa? Lihat tindak lanjut yang menumbuhkan.'
      },
    },
    // === K8 Bertindak sesuai norma agama, hukum, sosial, budaya nasional (3) ===
    8: {
      1: {
        metode: ['observasi', 'wawancara'],
        sumber: 'Observasi pembiasaan upacara/Pancasila; ucapan guru di kelas; testimoni siswa & rekan; integrasi nilai Pancasila di RPP',
        catatan: 'Cek bukti penghargaan Pancasila: di pembelajaran, upacara, perilaku sehari-hari. Apakah guru menanamkan toleransi & kebangsaan?'
      },
      2: {
        metode: ['wawancara', 'observasi'],
        sumber: 'Catatan kerjasama dengan rekan; testimoni rekan guru beragam; foto kegiatan bersama; bukti sikap guru lintas kelompok',
        catatan: 'Tanya 2-3 rekan guru lintas latar (suku/agama/gender): bagaimana sikap kerjasama guru ini? Cek apakah inklusif atau eksklusif.'
      },
      3: {
        metode: ['observasi', 'wawancara'],
        sumber: 'Observasi keseharian guru; catatan ibadah & sikap teladan; testimoni siswa; jurnal komitmen spiritual',
        catatan: 'Lihat keteladanan cinta: kepada Allah (ibadah), Rasul (sunnah), diri (kompetensi), sesama (akhlak), lingkungan (kepedulian). Tanya kamad.'
      },
    },
    // === K9 Pribadi dewasa & teladan (5) ===
    9: {
      1: {
        metode: ['observasi'],
        sumber: 'Observasi keseharian; testimoni siswa, orang tua, rekan; catatan etika berkomunikasi & berpenampilan',
        catatan: 'Cek penampilan, tutur kata, sopan santun guru. Tanya 3 siswa: bagaimana guru ini berbicara dengan kamu & teman?'
      },
      2: {
        metode: ['wawancara', 'dokumen'],
        sumber: 'Catatan undangan rekan untuk observasi; jurnal sharing pengalaman; notulen MGMP; testimoni rekan',
        catatan: 'Tanya rekan guru: pernahkah guru ini undang ke kelas? berbagi pengalaman? Cek dokumen MGMP/peer learning.'
      },
      3: {
        metode: ['observasi'],
        sumber: 'Observasi pembelajaran; catatan dinamika kelas; testimoni siswa tentang penghormatan; analisis partisipasi',
        catatan: 'Saksikan: apakah siswa menghormati & memperhatikan guru tanpa intimidasi? Cek partisipasi sukarela (bukan terpaksa).'
      },
      4: {
        metode: ['observasi', 'wawancara'],
        sumber: 'Observasi respon guru terhadap kritik siswa; jurnal kelas; testimoni siswa; rekaman pembelajaran',
        catatan: 'Cek momen siswa beri kritik/saran. Apakah guru defensif atau terbuka? Tanya siswa: berani ngga kasih masukan ke guru ini?'
      },
      5: {
        metode: ['observasi', 'wawancara'],
        sumber: 'Observasi pembimbingan siswa; testimoni siswa & orang tua; catatan mentoring; jurnal anekdotal',
        catatan: 'Cek konsistensi kasih sayang & kesabaran guru. Tanya orang tua/wali: bagaimana respons guru terhadap kebutuhan anak?'
      },
    },
    // === K10 Etos kerja & tanggung jawab (8) ===
    10: {
      1: {
        metode: ['observasi', 'dokumen'],
        sumber: 'Daftar hadir; jurnal mengajar (jam masuk-keluar); observasi langsung; jadwal pelajaran',
        catatan: 'Cek konsistensi waktu mulai & akhir mengajar. Lihat jurnal mengajar: ada catatan keterlambatan? Cocokkan dengan jadwal.'
      },
      2: {
        metode: ['wawancara', 'dokumen'],
        sumber: 'SOP guru meninggalkan kelas; jurnal pembelajaran; rancangan tugas mandiri siswa; catatan koordinasi piket',
        catatan: 'Tanya guru piket & rekan: ketika guru ini harus keluar, apa yang dipersiapkan untuk siswa? Cek bukti tugas pengganti.'
      },
      3: {
        metode: ['dokumen'],
        sumber: 'SK pembagian tugas mengajar (24 JP); jurnal mengajar; rekap kehadiran; surat ijin keluar',
        catatan: 'Verifikasi pemenuhan 24 JP wajib mengajar. Cek bukti ijin tertulis untuk kegiatan di luar jam (bukan asal pergi).'
      },
      4: {
        metode: ['dokumen'],
        sumber: 'Surat ijin/sakit dengan bukti (surat dokter, undangan); rekap absensi; daftar hadir kegiatan madrasah',
        catatan: 'Cek dokumentasi ijin: tepat waktu, ada alasan jelas, ada bukti pendukung. Apakah pola absensi profesional?'
      },
      5: {
        metode: ['dokumen'],
        sumber: 'Daftar tugas administratif (RPP, daftar nilai, laporan); checklist penyelesaian; jurnal harian',
        catatan: 'Cek tugas adm guru: RPP, jurnal, daftar nilai, raport. Apakah selesai tepat waktu sesuai deadline kamad/waka?'
      },
      6: {
        metode: ['observasi', 'wawancara'],
        sumber: 'Jadwal harian guru; catatan kegiatan jam kosong; bukti membaca/menulis/PKB; jurnal pribadi',
        catatan: 'Tanya guru: apa yang dilakukan saat jam kosong di sekolah? Cek apakah produktif (PKB, koreksi, persiapan) atau ngobrol.'
      },
      7: {
        metode: ['dokumen'],
        sumber: 'Daftar prestasi guru & siswa bimbingannya; SK penugasan; piagam/sertifikat; bukti kontribusi pengembangan madrasah',
        catatan: 'Cek bukti kontribusi konkret: jadi panitia, bimbing lomba, ide perbaikan madrasah, prestasi siswa di bawah bimbingannya.'
      },
      8: {
        metode: ['wawancara', 'observasi'],
        sumber: 'Wawancara guru langsung; testimoni siswa & rekan; jurnal pribadi; bahasa di sosmed (jika ada)',
        catatan: 'Tanya: "Apa yang membuat Bapak/Ibu bangga jadi guru?" Cek konsistensi semangat profesional di keseharian.'
      },
    },
    // === K11 Bersikap inklusif, objektif, tidak diskriminatif (4) ===
    11: {
      1: {
        metode: ['observasi', 'wawancara'],
        sumber: 'Observasi pembelajaran (rotasi giliran); jurnal kelas; testimoni siswa; daftar nilai & rekap perlakuan',
        catatan: 'Cek apakah guru memperlakukan semua siswa adil terlepas faktor personal (suku, ekonomi, prestasi). Tanya siswa: ada favoritisme?'
      },
      2: {
        metode: ['observasi', 'wawancara'],
        sumber: 'Observasi interaksi guru di ruang guru; testimoni rekan; foto kegiatan bersama; notulen rapat',
        catatan: 'Saksikan dinamika di ruang guru. Tanya 2-3 rekan: apakah guru ini inklusif, mau bantu, kontributif dalam diskusi?'
      },
      3: {
        metode: ['observasi'],
        sumber: 'Observasi pembelajaran; rekaman; catatan rotasi interaksi; daftar nilai diferensial',
        catatan: 'Catat siapa saja yang dipanggil/dibantu guru. Apakah merata atau hanya siswa pintar/aktif/sekelompok? Cek perlakuan ke siswa pendiam.'
      },
      4: {
        metode: ['observasi', 'dokumen'],
        sumber: 'Observasi iklim kelas; jurnal pembiasaan kebersamaan; foto/video kegiatan kolaboratif; testimoni siswa',
        catatan: 'Cek iklim sosial kelas: apakah hangat, peduli, ada rasa cinta antar siswa & guru? Apakah ada bullying yang tidak ditangani?'
      },
    },
    // === K12 Komunikasi dengan sesama guru, ortu, masyarakat (3) ===
    12: {
      1: {
        metode: ['dokumen', 'wawancara'],
        sumber: 'Notulen pertemuan ortu; rekap WA paguyuban; laporan home visit; bukti komunikasi formal/informal; raport',
        catatan: 'Cek bukti komunikasi rutin guru-ortu. Tanya 2-3 ortu: pernah dihubungi guru ini tentang anaknya? Topik apa?'
      },
      2: {
        metode: ['dokumen'],
        sumber: 'SK kepanitiaan kegiatan madrasah; daftar hadir kegiatan; foto kegiatan; bukti kontribusi di event masyarakat',
        catatan: 'Cek minimal 2-3 kegiatan setahun di luar pembelajaran. Lihat aktualisasi peran (panitia, narasumber, pendamping).'
      },
      3: {
        metode: ['observasi', 'wawancara'],
        sumber: 'Observasi interaksi sosial guru; jurnal pembiasaan nilai cinta; testimoni siswa & ortu; catatan layanan',
        catatan: 'Cek apakah guru menyebarkan nilai sehat & cinta dalam interaksi: salam, sapa, peduli kondisi orang lain.'
      },
    },
    // === K13 Penguasaan materi & pola pikir keilmuan (4) ===
    13: {
      1: {
        metode: ['dokumen', 'observasi'],
        sumber: 'RPP/Modul Ajar (bagian integrasi Quran-Hadits); bahan ajar; LKPD; observasi penyampaian materi',
        catatan: 'Cek bukti integrasi Quran-Hadits sesuai materi mapel (bukan ditempel-tempelkan). Lihat keaslian & kedalaman koneksi.'
      },
      2: {
        metode: ['dokumen'],
        sumber: 'Pemetaan SKL-KI-KD/CP-TP; analisis materi sulit; rancangan alokasi waktu; Prota & Promes',
        catatan: 'Cek dokumen pemetaan KD/TP yang sistematis. Lihat identifikasi materi sulit dan strategi penanganannya. Verifikasi alokasi waktu logis.'
      },
      3: {
        metode: ['dokumen', 'wawancara'],
        sumber: 'Bahan ajar; modul; PPT; sumber referensi up-to-date; uji konsep dengan guru',
        catatan: 'Tanya guru tentang konsep mendalam mapelnya. Cek up-to-date materi (referensi <5 thn). Lihat kemampuan menjelaskan analogi/contoh.'
      },
      4: {
        metode: ['observasi', 'dokumen'],
        sumber: 'RPP/MA bagian kontekstualisasi; LKPD problem real-life; observasi pembelajaran; bahan ajar',
        catatan: 'Cek kemampuan guru mengaitkan materi dengan konteks nyata siswa. Apakah deep learning (memahami substansi) atau hanya hafalan?'
      },
    },
    // === K14 Pengembangan keprofesian melalui tindakan reflektif (7) ===
    14: {
      1: {
        metode: ['dokumen', 'wawancara'],
        sumber: 'Form evaluasi diri (PKG/PKB); SKP; jurnal refleksi; rencana pengembangan diri; catatan refleksi mingguan',
        catatan: 'Cek dokumen evaluasi diri: spesifik & lengkap? Bukan hanya checklist tapi narasi pengalaman konkret. Lihat 2-3 contoh refleksi.'
      },
      2: {
        metode: ['dokumen'],
        sumber: 'Jurnal pembelajaran (mingguan/bulanan); catatan masukan kolega; hasil supervisi internal; portofolio kinerja',
        catatan: 'Cek jurnal pembelajaran rutin. Lihat masukan dari rekan/kamad/pengawas dalam 1 tahun terakhir. Verifikasi kualitas refleksi.'
      },
      3: {
        metode: ['dokumen'],
        sumber: 'Rencana PKB tahunan; SK kegiatan PKB; sertifikat 24 JP/tahun; rancangan tindak lanjut; portofolio PKB',
        catatan: 'Cek bukti perencanaan PKB berdasar refleksi diri (bukan asal ikut). Lihat tindak lanjut: hasil PKB diaplikasikan ke pembelajaran.'
      },
      4: {
        metode: ['observasi', 'dokumen'],
        sumber: 'RPP/MA setelah PKB; jurnal aplikasi pengetahuan baru; observasi pembelajaran (bukti penerapan); refleksi guru',
        catatan: 'Bandingkan RPP/MA sebelum & sesudah PKB. Saksikan praktik baru di kelas. Tanya guru: PKB terakhir apa & cara aplikasi.'
      },
      5: {
        metode: ['dokumen'],
        sumber: 'Karya ilmiah (PTK, best practice, makalah); sertifikat seminar/konferensi/diklat; publikasi (artikel, buku); paten/HAKI; karya inovasi pembelajaran',
        catatan: 'Cek bukti karya konkret 1-2 tahun terakhir: PTK, artikel, video pembelajaran, modul digital, dll. Verifikasi orisinalitas.'
      },
      6: {
        metode: ['dokumen', 'observasi'],
        sumber: 'Bukti penggunaan TIK: e-learning, LMS, video pembelajaran, blog, podcast, akun PKB digital; sertifikat pelatihan TIK',
        catatan: 'Cek pemanfaatan TIK untuk PKB & komunikasi profesional. Lihat akun pendidikan (Edmodo, Google Classroom, MGMP grup).'
      },
      7: {
        metode: ['observasi', 'dokumen'],
        sumber: 'Jurnal refleksi pembelajaran berbasis cinta; RPP/MA bagian kebiasaan hidup hebat; observasi integrasi nilai cinta',
        catatan: 'Cek apakah refleksi guru memuat dimensi cinta dan 7 Kebiasaan Anak Indonesia Hebat. Apakah otentik atau hanya kosmetik?'
      },
    },
  },
};

// === Helper untuk Waka (K1-K4 identik antar 4 Waka, hanya K5 yang berbeda) ===
(function() {
  const wakaCommon = {
    1: { // Kepribadian dan Sosial (7 indikator)
      1: { metode:['observasi','wawancara'], sumber:'Testimoni warga madrasah; observasi keseharian; catatan kamad; jurnal akhlak; rekam jejak menjadi imam/khotib/tausyiah', catatan:'Tanya kamad, guru, & tendik: bagaimana akhlak waka ini? Apakah jadi rujukan/teladan? Cek konsistensi ucapan & perbuatan.' },
      2: { metode:['dokumen','wawancara'], sumber:'SK pengangkatan waka; laporan tugas; LPJ kegiatan; testimoni tim; catatan rapat', catatan:'Cek kelengkapan & kualitas LPJ. Tanya rekan kerja: apakah waka ini jujur, berkomitmen, dan berintegritas dalam menjalankan tugas?' },
      3: { metode:['observasi','wawancara'], sumber:'Notulen rapat; observasi rapat; testimoni tim; catatan komunikasi; jurnal koordinasi', catatan:'Saksikan 1 rapat yang dipimpin/dihadiri waka. Cek apakah terbuka menerima ide/kritik atau defensif.' },
      4: { metode:['observasi','wawancara'], sumber:'Catatan kasus krisis; testimoni tim; jurnal pengelolaan masalah; rekaman komunikasi', catatan:'Cek minimal 2-3 kasus sulit yg pernah dihadapi waka. Bagaimana cara mengendalikan diri & memimpin solusi?' },
      5: { metode:['dokumen','wawancara'], sumber:'Daftar hadir kegiatan masyarakat (PHBI, kerja bakti, takziah); foto kegiatan; SK kepanitiaan kemasyarakatan', catatan:'Cek bukti partisipasi waka dalam kegiatan sosial-kemasyarakatan minimal 2-3 kali setahun.' },
      6: { metode:['observasi','wawancara'], sumber:'Catatan respons waka terhadap masalah orang/tim; testimoni guru/tendik; jurnal kepedulian', catatan:'Tanya 2-3 guru/tendik: pernahkah waka ini menanyakan kondisi pribadi/keluarga? Apakah peduli atau hanya formal kerja?' },
      7: { metode:['dokumen'], sumber:'Daftar mitra/MoU madrasah; notulen pertemuan dengan komite/instansi; dokumentasi kerjasama; bukti dukungan eksternal yg diperoleh', catatan:'Cek hasil konkret: kerjasama yg menghasilkan ide, sumber belajar, atau pembiayaan tambahan untuk madrasah.' },
    },
    2: { // Kepemimpinan (10 indikator)
      1: { metode:['dokumen'], sumber:'Visi-misi madrasah; program kerja waka; analisis konsistensi program dengan visi; SK tugas waka', catatan:'Cocokkan program kerja waka dengan visi-misi. Apakah strategis menuju target visi atau sekadar rutinitas?' },
      2: { metode:['dokumen','wawancara'], sumber:'Program kerja dengan target SMART; KPI bidang waka; rencana kerja tahunan; testimoni tim', catatan:'Cek apakah target waka menantang & terukur (bukan asal aman). Tanya tim: apakah merasa ditantang untuk mencapai standar tinggi?' },
      3: { metode:['dokumen','observasi'], sumber:'Program PKB internal; learning organization activities; jurnal MGMP; bukti budaya belajar di madrasah', catatan:'Cari bukti waka mendorong budaya belajar guru/tendik: training internal, sharing, peer learning, mentoring.' },
      4: { metode:['observasi','wawancara'], sumber:'Observasi iklim madrasah; testimoni guru/siswa; foto kegiatan inovatif; jurnal budaya madrasah', catatan:'Saksikan iklim kerja: apakah kondusif untuk pembelajaran? Apakah ada inovasi yg lahir dari budaya tersebut?' },
      5: { metode:['observasi','wawancara'], sumber:'Observasi keseharian waka di lingkungan madrasah; testimoni tim; rekam jejak instructional leadership', catatan:'Cek apakah waka jadi teladan pembelajaran (bukan hanya pemimpin administratif). Saksikan interaksi dengan guru/siswa.' },
      6: { metode:['observasi','wawancara'], sumber:'Pidato/sambutan waka; jurnal motivasi tim; testimoni guru/tendik; momen kepemimpinan inspiratif', catatan:'Tanya tim: kapan waka pernah menginspirasi mereka? Cek konkretnya, bukan sekadar testimoni umum.' },
      7: { metode:['observasi','wawancara'], sumber:'Notulen rapat tim; observasi kerja kolaboratif; testimoni anggota tim; jurnal kebersamaan', catatan:'Saksikan dinamika tim. Apakah waka mampu membangun rasa percaya & kolaborasi atau cenderung otoriter?' },
      8: { metode:['dokumen','wawancara'], sumber:'Laporan capaian program; LPJ tahunan; testimoni hasil kerja keras; rekam jejak inisiatif', catatan:'Cek bukti kerja keras konkret: lembur, inisiatif tambahan, mengejar target. Hindari penilaian berdasar kesan saja.' },
      9: { metode:['dokumen'], sumber:'Bukti kontribusi waka pada kurikulum & pembelajaran; rancangan kegiatan akademik; rekomendasi perbaikan kurikulum', catatan:'Cek bukti kontribusi waka non-kurikulum pada pengembangan kurikulum (misal: ide, penyempurnaan kalender, dukungan logistik).' },
      10: { metode:['dokumen','wawancara'], sumber:'Program kesiswaan; SK pendamping siswa; rekap prestasi siswa; jurnal pendampingan', catatan:'Cek peran waka dalam pengembangan kapasitas siswa (bukan hanya bidang spesifiknya).' },
    },
    3: { // Pengembangan Sekolah (7 indikator)
      1: { metode:['dokumen'], sumber:'RKJM (jangka menengah 4 tahun); RKT (tahunan); RKAM; analisis SWOT; rapor mutu madrasah', catatan:'Cek dokumen perencanaan jangka panjang/menengah/pendek. Verifikasi konsistensi dengan visi & data SWOT.' },
      2: { metode:['dokumen'], sumber:'Struktur organisasi madrasah; SK pembagian tugas; tupoksi tertulis; analisis efektivitas struktur', catatan:'Cek struktur organisasi resmi & tupoksi setiap posisi. Apakah ramping/efisien atau gemuk/tumpang tindih?' },
      3: { metode:['dokumen'], sumber:'Realisasi program tahunan vs perencanaan; LPJ kegiatan; jurnal pelaksanaan; bukti capaian', catatan:'Bandingkan rencana vs realisasi. Cek alasan deviasi dan tindak lanjutnya. Hindari LPJ yg hanya formalitas.' },
      4: { metode:['dokumen'], sumber:'Rapor mutu (8 SNP); akreditasi; data prestasi madrasah trend 3 tahun; KPI pencapaian', catatan:'Cek tren peningkatan kinerja madrasah dalam 3 tahun. Apakah signifikan atau stagnan?' },
      5: { metode:['dokumen'], sumber:'Laporan monev rutin; instrumen monev; rapor monev; bukti pelaksanaan supervisi internal', catatan:'Cek dokumen monev terstruktur (bukan hanya laporan akhir). Verifikasi prosedur, instrumen, & jadwal monev.' },
      6: { metode:['dokumen'], sumber:'Tindak lanjut hasil monev; rancangan perbaikan; jurnal implementasi rekomendasi', catatan:'Cek bukti tindak lanjut konkret dari monev. Apakah temuan ditindaklanjuti atau hanya dilaporkan?' },
      7: { metode:['dokumen'], sumber:'Penelitian tindakan sekolah (PTS); jurnal/proceeding; sertifikat; karya ilmiah waka', catatan:'Cek minimal 1 PTS yang dilakukan waka dalam 2 tahun terakhir. Verifikasi orisinalitas & dampaknya.' },
    },
    4: { // Kewirausahaan (5 indikator)
      1: { metode:['dokumen','observasi'], sumber:'Daftar inovasi madrasah dalam 1 tahun; foto/dokumentasi inovasi; bukti pengembangan layanan; portofolio inovasi waka', catatan:'Cek minimal 2-3 inovasi konkret yg dilahirkan waka dalam 1 tahun. Hindari hal yg sudah jadi rutinitas.' },
      2: { metode:['wawancara','observasi'], sumber:'Wawancara langsung dengan waka; observasi semangat kerja; rekam jejak menyelesaikan tantangan', catatan:'Tanya waka tentang aspirasi 5 tahun ke depan. Cek apakah motivasi intrinsik atau hanya eksternal.' },
      3: { metode:['observasi','wawancara'], sumber:'Observasi rapat tim; testimoni guru/tendik; jurnal motivasi tim; rekam jejak coaching', catatan:'Tanya tim: bagaimana waka memotivasi mereka? Cek apakah lewat tekanan, contoh, atau coaching positif.' },
      4: { metode:['wawancara','dokumen'], sumber:'Catatan kasus krisis & solusi; testimoni penanganan masalah; jurnal problem-solving; LPJ saat masalah timbul', catatan:'Cek 2-3 kasus konkret saat waka menghadapi kendala. Bagaimana cara mencari solusi: kreatif atau menyerah?' },
      5: { metode:['dokumen','observasi'], sumber:'Penerapan prinsip wirausaha (inovasi, kemandirian, kreativitas); pengembangan unit usaha madrasah; kerjasama bisnis', catatan:'Cek apakah waka ikut menerapkan jiwa wirausaha: inisiatif unit usaha, sponsorship, atau pengembangan layanan berbasis kebutuhan pasar.' },
    },
  };
  // Replicate K1-K4 ke 4 Waka
  ['WKKUR', 'WKSIS', 'WKSAR', 'WKHUM'].forEach(role => {
    if (!window.SARAN_INDIKATOR[role]) window.SARAN_INDIKATOR[role] = {};
    Object.assign(window.SARAN_INDIKATOR[role], JSON.parse(JSON.stringify(wakaCommon)));
  });
})();

// === K5 SPESIFIK PER WAKA ===
// WKKUR (3 indikator)
Object.assign(window.SARAN_INDIKATOR.WKKUR, {
  5: {
    1: { metode:['dokumen','wawancara'], sumber:'SK pembagian tugas mengajar; daftar guru & tendik; analisis beban kerja; matriks pendayagunaan SDM', catatan:'Cek pendayagunaan guru: linieritas mapel, beban 24 JP, distribusi tugas tambahan. Wawancarai 2-3 guru.' },
    2: { metode:['dokumen'], sumber:'Program akademik tahunan; kalender pendidikan; KOM/KTSP; jadwal pelajaran; LPJ pelaksanaan akademik', catatan:'Cek kelengkapan & efektivitas program akademik. Verifikasi konsistensi dengan visi-misi madrasah.' },
    3: { metode:['dokumen','wawancara'], sumber:'Program supervisi akademik; instrumen supervisi; jadwal supervisi; rekap hasil supervisi; tindak lanjut', catatan:'Cek siklus supervisi (rencana-pelaksanaan-evaluasi-tindak lanjut). Wawancarai 2-3 guru tentang manfaat supervisi yg dirasakan.' },
  },
});
// WKSIS (3 indikator)
Object.assign(window.SARAN_INDIKATOR.WKSIS, {
  5: {
    1: { metode:['dokumen','wawancara'], sumber:'Program kesiswaan; data minat-bakat siswa; SK pembina ekskul; rekap prestasi siswa; jurnal pengembangan kapasitas', catatan:'Cek pengelolaan siswa berbasis minat-bakat (bukan generik). Verifikasi distribusi pembinaan: akademik, non-akademik, life skill.' },
    2: { metode:['dokumen','observasi'], sumber:'SK layanan khusus (UKS, BK, perpustakaan, kantin sehat); SOP layanan; jurnal layanan; kepuasan pengguna', catatan:'Cek kelengkapan layanan khusus. Saksikan 1-2 layanan langsung. Apakah benar-benar mendukung pembelajaran?' },
    3: { metode:['dokumen','observasi'], sumber:'Tata tertib siswa; buku catatan pelanggaran; SK pembina disiplin; jurnal bimbingan disiplin; foto pembinaan', catatan:'Cek penegakan disiplin: konsisten atau tebang pilih? Verifikasi tindak lanjut pelanggaran berjenjang.' },
  },
});
// WKSAR (3 indikator)
Object.assign(window.SARAN_INDIKATOR.WKSAR, {
  5: {
    1: { metode:['dokumen','observasi'], sumber:'Inventaris sarpras (SIMAK BMN); jadwal penggunaan; rekap pemeliharaan; foto kondisi ruang; usulan pengadaan', catatan:'Cek pendayagunaan sarpras: pemanfaatan optimal atau idle? Verifikasi kondisi langsung: ruang kelas, lab, perpustakaan, toilet.' },
    2: { metode:['dokumen','observasi'], sumber:'SOP K3 madrasah; APAR, jalur evakuasi, P3K; pemeriksaan keamanan; jurnal incident; sertifikat hygiene kantin', catatan:'Verifikasi standar K3: APAR berfungsi, jalur evakuasi jelas, P3K terisi. Cek catatan kejadian & penanganannya.' },
    3: { metode:['dokumen','observasi'], sumber:'Sistem informasi madrasah (SIM); web/aplikasi madrasah; laporan data berbasis IT; bukti pengambilan keputusan berbasis data', catatan:'Cek pengelolaan data terdigitalisasi (bukan hanya manual). Apakah data dipakai untuk keputusan strategis?' },
  },
});
// WKHUM (3 indikator)
Object.assign(window.SARAN_INDIKATOR.WKHUM, {
  5: {
    1: { metode:['dokumen'], sumber:'Daftar mitra/MoU madrasah; rekap kerjasama; foto kegiatan kerjasama; LPJ program humas', catatan:'Cek minimal 3-5 mitra eksternal aktif. Verifikasi MoU & realisasi kerjasama (bukan sekadar tanda tangan).' },
    2: { metode:['dokumen'], sumber:'Bukti dukungan eksternal: ide (rancangan program), sumber belajar (donasi buku, kunjungan tamu), pembiayaan (CSR/sponsor)', catatan:'Cek konkret hasil pengelolaan hubungan eksternal: apa yg didapat madrasah dalam 1 tahun?' },
    3: { metode:['dokumen','observasi'], sumber:'Web madrasah; sosmed madrasah; brosur; press release; bulletin/majalah madrasah; dokumentasi event publikasi', catatan:'Cek aktivitas publikasi dalam 6 bulan terakhir. Apakah konsisten, berkualitas, & menjangkau publik luas?' },
  },
});

// === BK (17 kompetensi, 68 indikator) ===
window.SARAN_INDIKATOR.BK = {
  1: {
    1: { metode:['dokumen'], sumber:'Program tahunan & semester BK; rancangan layanan klasikal; need assessment (DCM/AUM); jurnal layanan', catatan:'Cek apakah perencanaan BK berbasis hasil need assessment & berpusat pada peserta didik (bukan generik).' },
    2: { metode:['dokumen'], sumber:'Pemetaan tahap perkembangan siswa; usia perkembangan; profil kebutuhan; rancangan layanan sesuai jenjang', catatan:'Verifikasi kesesuaian materi BK dengan tahap perkembangan kognitif/sosial-emosional siswa.' },
    3: { metode:['dokumen','wawancara'], sumber:'Profil sosio-ekonomi siswa; data keberagaman; rancangan layanan inklusif; jurnal layanan multikultural', catatan:'Cek apakah layanan BK mengakomodasi keragaman latar belakang. Tanya 2-3 siswa dari latar berbeda.' },
  },
  2: {
    1: { metode:['dokumen','observasi'], sumber:'RPL (Rencana Pelaksanaan Layanan); instrumen need assessment; jurnal layanan kebutuhan mental/emosional/fisik/gender', catatan:'Cek bukti layanan BK terdiferensiasi sesuai dimensi perkembangan. Saksikan 1 sesi layanan.' },
    2: { metode:['dokumen','wawancara'], sumber:'Instrumen tes minat-bakat; portofolio siswa; rekomendasi karier; jurnal pengembangan potensi', catatan:'Verifikasi pengembangan layanan berdasar bakat-minat-potensi tiap siswa, bukan layanan seragam.' },
    3: { metode:['dokumen','observasi'], sumber:'Layanan informasi karier; rekomendasi studi lanjut; jurnal konsultasi karier; tracer alumni', catatan:'Cek dukungan BK untuk perencanaan karier siswa kelas akhir. Verifikasi kelengkapan info studi lanjut.' },
  },
  3: {
    1: { metode:['dokumen'], sumber:'Program BK lingkungan Kemenag; analisis jenjang madrasah; KOM bidang BK', catatan:'Cek konsistensi program BK dengan karakter madrasah dan SNP layanan BK.' },
    2: { metode:['dokumen','wawancara'], sumber:'Program BK sesuai jenjang (MI/MTs/MA/RA/keagamaan/kejuruan); analisis konteks; testimoni siswa', catatan:'Verifikasi adaptasi layanan BK dengan jenjang spesifik & kekhususan madrasah.' },
    3: { metode:['dokumen','observasi'], sumber:'Layanan BK terintegrasi pembiasaan ibadah, sosial, gemar belajar; jurnal pembiasaan', catatan:'Cek bukti integrasi nilai keagamaan & kebiasaan hidup sehat dalam layanan BK.' },
  },
  4: {
    1: { metode:['observasi','wawancara'], sumber:'Observasi penampilan; testimoni siswa & rekan; foto-foto kegiatan; catatan kamad', catatan:'Cek kerapian, kebersihan, & kepantasan penampilan guru BK sebagai teladan.' },
    2: { metode:['observasi','wawancara'], sumber:'Observasi interaksi dengan siswa; testimoni siswa; rekaman sesi konseling (jika ada izin)', catatan:'Tanya 3 siswa: bagaimana cara guru BK berbicara? Apakah santun, jujur, & menumbuhkan rasa hormat?' },
    3: { metode:['observasi','dokumen'], sumber:'Jurnal pembiasaan toleransi; layanan BK lintas latar; testimoni siswa beragam latar', catatan:'Cek apakah guru BK menyebarkan toleransi: dalam kata, sikap, dan kurikulum layanan.' },
    4: { metode:['observasi','wawancara'], sumber:'Daftar hadir ibadah jamaah; observasi keseharian; testimoni siswa; jurnal pembiasaan ibadah', catatan:'Cek konsistensi guru BK dalam ibadah & dorongannya kepada siswa. Apakah keteladanan otentik?' },
  },
  5: {
    1: { metode:['dokumen'], sumber:'Rancangan layanan BK berbasis 4 dimensi manusia (moral-spiritual-sosial-individu); jurnal refleksi diri siswa', catatan:'Verifikasi keseimbangan 4 dimensi dalam layanan BK. Cek bukti refleksi diri siswa.' },
    2: { metode:['dokumen','observasi'], sumber:'Layanan pengembangan potensi positif; pembiasaan 7 Kebiasaan Anak Indonesia Hebat; jurnal pembiasaan', catatan:'Cek bukti pembiasaan 7 kebiasaan: bangun pagi, ibadah, gerakan, makan sehat, gemar belajar, bermasyarakat, tidur cepat.' },
    3: { metode:['dokumen','wawancara'], sumber:'Form masukan siswa; jurnal kebutuhan siswa; rancangan layanan responsif', catatan:'Cek apakah ada saluran masukan dari siswa (kotak saran, form digital, FGD). Verifikasi tindak lanjutnya.' },
    4: { metode:['dokumen'], sumber:'Layanan pengembangan toleransi & HAM; jurnal pembiasaan kebersamaan; foto kegiatan multikultural', catatan:'Cek konkret bukti pengembangan toleransi & HAM dalam layanan BK.' },
  },
  6: {
    1: { metode:['observasi','wawancara'], sumber:'Observasi keseharian; testimoni siswa & rekan; jurnal anekdotal kepribadian', catatan:'Cek kepribadian: jujur, sabar, ramah, konsisten. Tanya 3 sumber berbeda untuk validasi.' },
    2: { metode:['observasi','wawancara'], sumber:'Observasi layanan BK; testimoni siswa beragam latar; jurnal empati', catatan:'Cek empati guru BK terhadap keragaman & perbedaan individu. Apakah inklusif atau judgmental?' },
    3: { metode:['observasi','wawancara'], sumber:'Catatan kasus stress/frustrasi siswa; jurnal pendampingan; testimoni siswa krisis', catatan:'Cek toleransi tinggi guru BK saat menangani siswa stress/frustrasi. Verifikasi pendekatan kesabaran.' },
  },
  7: {
    1: { metode:['observasi','wawancara'], sumber:'Observasi sesi layanan klasikal; rekap partisipasi siswa; testimoni siswa; jurnal motivasi', catatan:'Cek kemampuan guru BK memotivasi partisipasi aktif siswa dalam layanan.' },
    2: { metode:['dokumen','observasi'], sumber:'RPL; jurnal pelaksanaan; observasi 1 sesi penuh; analisis efektivitas waktu', catatan:'Bandingkan rencana RPL dgn pelaksanaan. Cek efektivitas: tujuan tercapai dalam waktu yg ada?' },
    3: { metode:['observasi','dokumen'], sumber:'Observasi kemandirian guru BK; jurnal layanan disiplin; testimoni rekan', catatan:'Cek mandiri & disiplin guru BK. Apakah memimpin layanan secara penuh atau bergantung pada orang lain?' },
  },
  8: {
    1: { metode:['dokumen'], sumber:'Program BK kolaboratif; SK tim BK; daftar pihak terkait (kamad, walas, guru); jurnal koordinasi', catatan:'Cek perencanaan kolaboratif. Apakah BK melibatkan walas, guru mapel, & ortu sejak perencanaan?' },
    2: { metode:['dokumen','wawancara'], sumber:'Notulen rapat tim BK; jurnal kerjasama dgn walas/guru/kamad; bukti tindak lanjut', catatan:'Verifikasi kolaborasi nyata, bukan formalitas. Tanya walas: pernah dibantu BK menangani siswa?' },
    3: { metode:['dokumen'], sumber:'Laporan layanan BK ke kamad/walas/ortu; presentasi hasil layanan; bukti komunikasi terbuka', catatan:'Cek bukti komunikasi terbuka. Apakah hasil layanan dilaporkan rutin atau hanya saat dibutuhkan?' },
    4: { metode:['dokumen','wawancara'], sumber:'Catatan kasus dengan dukungan rekan guru; jurnal kolaborasi; testimoni guru lain', catatan:'Cek bukti nyata peran guru lain dlm layanan BK. Tanya 2 guru: pernah diminta bantu BK?' },
  },
  9: {
    1: { metode:['dokumen'], sumber:'Kartu anggota MGBK/ABKIN; SK pengurus organisasi profesi; sertifikat partisipasi konferensi/seminar BK', catatan:'Cek keaktifan dlm organisasi profesi BK. Minimal 1-2 kegiatan setahun.' },
    2: { metode:['dokumen','wawancara'], sumber:'Bukti konsultasi dgn rekan BK; sharing pengalaman MGBK; pemanfaatan jaringan profesi untuk solusi kasus', catatan:'Tanya guru BK: pernah memanfaatkan jaringan MGBK untuk konsultasi kasus? Lihat hasilnya.' },
  },
  10: {
    1: { metode:['dokumen'], sumber:'MoU dgn psikolog/dokter; daftar mitra organisasi profesi non-BK; jurnal hubungan antarprofesi', catatan:'Cek bukti hubungan dengan profesi lain (psikolog, dokter, psikiater). Verifikasi kontak aktif.' },
    2: { metode:['dokumen','wawancara'], sumber:'Bukti kerjasama dgn institusi/profesi lain; LPJ kolaborasi; testimoni mitra', catatan:'Cek minimal 1-2 kasus kolaborasi dgn profesi lain dlm 1 tahun. Verifikasi hasilnya.' },
    3: { metode:['dokumen','wawancara'], sumber:'Buku catatan rujukan/referal; surat rujukan ke psikolog/dokter; jurnal tindak lanjut', catatan:'Cek bukti referal yg dilakukan guru BK. Apakah ada SOP & follow-up?' },
  },
  11: {
    1: { metode:['dokumen'], sumber:'Instrumen non-tes buatan guru BK (wawancara, angket, inventori); validasi instrumen', catatan:'Cek orisinalitas & kualitas instrumen non-tes yg dibuat guru BK.' },
    2: { metode:['dokumen','observasi'], sumber:'Bukti aplikasi instrumen non-tes pada siswa; rekap hasil; analisis hasil', catatan:'Verifikasi aplikasi instrumen non-tes & cara guru BK menafsirkan hasilnya.' },
    3: { metode:['dokumen','wawancara'], sumber:'Deskripsi instrumen yg dipakai; manual penggunaan; alasan pemilihan instrumen', catatan:'Tanya guru BK: kenapa pakai instrumen X untuk kasus Y? Cek dasar pemikirannya.' },
    4: { metode:['dokumen'], sumber:'Daftar instrumen ITP/AUM/DCM; bukti penggunaan; rekap hasil; analisis kebutuhan layanan', catatan:'Cek pemilihan instrumen sesuai kebutuhan. Apakah variatif (ITP, AUM, DCM) atau monoton?' },
    5: { metode:['dokumen'], sumber:'Form perencanaan asesmen; jurnal pelaksanaan asesmen; rekap pengolahan & analisis data', catatan:'Cek siklus penilaian: rencana-laksanakan-olah-analisis. Verifikasi semua tahap dilakukan.' },
    6: { metode:['dokumen'], sumber:'Catatan pribadi siswa; catatan anekdot; portofolio karya siswa; hasil psikotes; rekap evaluasi belajar', catatan:'Cek dokumen koleksi data multidimensi. Apakah lengkap untuk pemetaan komprehensif?' },
    7: { metode:['dokumen','observasi'], sumber:'SOP kerahasiaan data BK; bukti sosialisasi asas BK; observasi penyimpanan data', catatan:'Cek perlindungan data siswa: lemari terkunci, password file digital, tidak menyebar info sembarangan.' },
  },
  12: {
    1: { metode:['dokumen','wawancara'], sumber:'Program BK dengan landasan teori; jurnal aplikasi prinsip BK; testimoni siswa', catatan:'Cek pemahaman guru BK tentang dasar teori BK & aplikasinya.' },
    2: { metode:['dokumen','wawancara'], sumber:'Profil profesi guru BK; CV & jejak karier; rancangan pengembangan diri', catatan:'Cek arah profesi & rencana pengembangan diri guru BK.' },
    3: { metode:['dokumen','observasi'], sumber:'Aplikasi dasar pelayanan BK dlm kegiatan harian; jurnal layanan harian', catatan:'Verifikasi praktik dasar BK: respons cepat, empati, kerahasiaan.' },
    4: { metode:['dokumen'], sumber:'Adaptasi program BK dgn kondisi madrasah; analisis konteks lokal; layanan responsif lingkungan', catatan:'Cek adaptasi program BK dgn karakter madrasah & masyarakat sekitarnya.' },
    5: { metode:['dokumen','observasi'], sumber:'Program BK dengan model/jenis layanan beragam; rancangan kegiatan pendukung', catatan:'Cek variasi pendekatan & jenis layanan BK. Hindari layanan monoton.' },
    6: { metode:['dokumen','observasi'], sumber:'Jurnal layanan klasikal/kelompok/individual; rekap format layanan; foto/video', catatan:'Verifikasi praktik 3 format layanan: klasikal, kelompok, individual. Cek frekuensi & efektivitas.' },
  },
  13: {
    1: { metode:['dokumen'], sumber:'Hasil need assessment; analisis kebutuhan layanan; pemetaan potensi siswa', catatan:'Cek analisis kebutuhan yg sistematis (bukan asumsi). Verifikasi instrumen & hasilnya.' },
    2: { metode:['dokumen'], sumber:'Program BK komprehensif (4 layanan: dasar-responsif-individu-sistem); rancangan keberlanjutan', catatan:'Cek struktur program BK komprehensif. Apakah mencakup 4 jenis layanan secara seimbang?' },
    3: { metode:['dokumen'], sumber:'RPL semester; jurnal layanan; rancangan pembiasaan', catatan:'Cek RPL: rinci, terjadwal, & menanamkan kebiasaan positif (bukan reaktif).' },
    4: { metode:['dokumen'], sumber:'RKAM bidang BK; rancangan sarana & biaya; LPJ keuangan BK', catatan:'Cek perencanaan sarana & biaya BK yg efisien. Verifikasi realisasi vs anggaran.' },
  },
  14: {
    1: { metode:['observasi','dokumen'], sumber:'Observasi sesi layanan; jurnal pelaksanaan; testimoni siswa; bukti perkembangan optimal', catatan:'Cek kualitas pelaksanaan layanan BK. Apakah siswa berkembang optimal setelah layanan?' },
    2: { metode:['dokumen','wawancara'], sumber:'Bukti kolaborasi dgn walas/guru/ortu/komunitas; jurnal kerjasama; LPJ kolaborasi', catatan:'Verifikasi kolaborasi multipihak. Tanya 2-3 mitra: bagaimana koordinasi BK?' },
    3: { metode:['dokumen','observasi'], sumber:'Layanan akademik (study skill); layanan karier; layanan personal-sosial; rekap layanan 4 area', catatan:'Cek 4 area layanan BK: akademik, karier, personal, sosial. Apakah seimbang?' },
    4: { metode:['dokumen'], sumber:'LPJ keuangan BK; rancangan sarana; jurnal pemeliharaan; laporan transparansi', catatan:'Cek pengelolaan keuangan & sarana BK. Apakah transparan & efisien?' },
  },
  15: {
    1: { metode:['dokumen'], sumber:'Form evaluasi proses layanan BK; instrumen evaluasi hasil; rekap evaluasi', catatan:'Cek evaluasi proses & hasil layanan secara berkala. Verifikasi metodologinya.' },
    2: { metode:['dokumen'],sumber:'Jurnal penyesuaian layanan; bukti adaptasi pendekatan; rancangan revisi RPL', catatan:'Cek bukti penyesuaian layanan berdasar evaluasi. Apakah responsif?' },
    3: { metode:['dokumen','wawancara'], sumber:'Laporan evaluasi layanan ke kamad/walas/ortu; presentasi hasil; testimoni penerima info', catatan:'Verifikasi komunikasi hasil evaluasi ke pihak terkait. Apakah jujur & terbuka?' },
    4: { metode:['dokumen'], sumber:'Revisi program BK berdasar evaluasi; rancangan pengembangan; jurnal perbaikan', catatan:'Cek tindak lanjut konkret dari hasil evaluasi. Apakah ada perbaikan program tahun berikutnya?' },
  },
  16: {
    1: { metode:['dokumen','wawancara'], sumber:'Refleksi diri kekuatan profesional; rancangan pengembangan; sertifikat pelatihan profesi', catatan:'Cek bagaimana guru BK memberdayakan kekuatan diri. Lihat bukti pengembangan keprofesian.' },
    2: { metode:['dokumen','wawancara'], sumber:'Refleksi diri keterbatasan; strategi peningkatan; jurnal pembelajaran', catatan:'Cek kesadaran diri akan keterbatasan & upaya minimasinya.' },
    3: { metode:['dokumen'], sumber:'Kode etik ABKIN; bukti praktik sesuai kode etik; jurnal etika layanan', catatan:'Cek pemahaman & praktik kode etik profesi. Verifikasi konsistensi.' },
    4: { metode:['observasi','wawancara'], sumber:'Observasi penanganan kasus berat; jurnal stabilitas emosi; testimoni rekan', catatan:'Cek objektivitas guru BK saat menangani kasus emosional. Apakah profesional atau larut?' },
    5: { metode:['dokumen'], sumber:'SOP alih tangan kasus; jurnal home visit; konferensi kasus; instrumen bimbingan; himpunan data', catatan:'Cek kelengkapan layanan pendukung BK. Verifikasi pelaksanaan & dokumentasinya.' },
    6: { metode:['dokumen','wawancara'], sumber:'Sertifikat profesi BK; rancangan pengembangan profesi; jurnal cinta profesi', catatan:'Cek penghayatan identitas profesional. Tanya: apa yg membuat bangga jadi guru BK?' },
    7: { metode:['observasi','wawancara'], sumber:'Catatan kasus mengutamakan kepentingan siswa; testimoni siswa & ortu; jurnal pengabdian', catatan:'Cek bukti mengutamakan kepentingan siswa di atas kepentingan pribadi.' },
  },
  17: {
    1: { metode:['dokumen'], sumber:'Daftar metode penelitian BK; jurnal kajian; rancangan penelitian sederhana', catatan:'Cek pemahaman jenis penelitian dlm BK (PTK, R&D, kuantitatif, kualitatif).' },
    2: { metode:['dokumen'], sumber:'Proposal penelitian BK; instrumen penelitian; rancangan metodologi', catatan:'Cek minimal 1 proposal/rancangan penelitian dalam 2 tahun.' },
    3: { metode:['dokumen'], sumber:'Laporan PTK BK; data lapangan; analisis hasil penelitian', catatan:'Verifikasi pelaksanaan minimal 1 penelitian sederhana dlm 2 tahun.' },
    4: { metode:['dokumen','wawancara'], sumber:'Bukti baca jurnal BK; aplikasi temuan jurnal ke layanan; jurnal best practice', catatan:'Cek pemanfaatan jurnal BK. Tanya: jurnal terakhir yg dibaca & cara aplikasinya?' },
  },
};
// === TIK (12 kompetensi, 65 indikator) ===
window.SARAN_INDIKATOR.TIK = {
  1: {
    1: { metode:['dokumen','observasi'], sumber:'Profil belajar siswa TIK; analisis karakteristik; jurnal pembimbingan; rekap kebutuhan TIK siswa', catatan:'Cek pemetaan karakteristik siswa terkait TIK: literasi digital, gaya belajar, kebutuhan khusus.' },
    2: { metode:['observasi'], sumber:'Observasi sesi pembimbingan; rekap partisipasi siswa; jurnal kelas TIK; foto/video', catatan:'Saksikan 1 sesi: apakah semua siswa dapat akses sama atau ada yg tertinggal?' },
    3: { metode:['dokumen','wawancara'], sumber:'Catatan pendampingan siswa lemah TIK; portofolio perkembangan; jurnal mentoring', catatan:'Cek bukti pendampingan siswa yg kurang TIK. Apakah ada perubahan setelah dibimbing?' },
    4: { metode:['observasi','wawancara'], sumber:'Observasi iklim kelas TIK; testimoni siswa minoritas/lemah; jurnal inklusi', catatan:'Cek apakah ada bullying/marginalisasi siswa lemah TIK & cara penanganannya.' },
    5: { metode:['dokumen','observasi'], sumber:'Profil belajar siswa TIK; jurnal layanan; rekap hasil bimbingan', catatan:'Verifikasi sistematisasi pemetaan karakteristik (bukan asumsi).' },
  },
  2: {
    1: { metode:['dokumen'], sumber:'Analisis kebutuhan TIK siswa; program tahunan/semester; silabus TIK; RPL bimbingan TIK; rancangan evaluasi', catatan:'Cek kelengkapan dokumen perencanaan TIK siswa.' },
    2: { metode:['dokumen','wawancara'], sumber:'Analisis kebutuhan TIK guru; jadwal fasilitasi; rancangan kegiatan; testimoni guru', catatan:'Cek bukti analisis kebutuhan TIK untuk guru lain. Verifikasi rancangan fasilitasinya.' },
    3: { metode:['dokumen','wawancara'], sumber:'Analisis kebutuhan TIK tendik; jadwal fasilitasi; bentuk kegiatan; testimoni tendik', catatan:'Cek bukti analisis & rancangan fasilitasi TIK untuk tendik (TU, perpustakaan, dll).' },
    4: { metode:['dokumen'], sumber:'Rancangan fasilitasi TIK madrasah: pembelajaran berbasis IT, e-asesmen, UBKD; SOP teknis', catatan:'Cek rancangan fasilitasi tingkat institusi (LMS, e-rapor, dst).' },
  },
  3: {
    1: { metode:['observasi','wawancara'], sumber:'Observasi sesi bimbingan TIK; testimoni siswa; jurnal kelas TIK; rekam keceriaan kelas', catatan:'Saksikan: apakah siswa antusias atau pasif? Cek strategi yg dipakai guru.' },
    2: { metode:['observasi','dokumen'], sumber:'RPL menantang; problem-based; LKPD eksploratif; testimoni siswa', catatan:'Cek pertanyaan/aktivitas yg memancing keingintahuan. Hindari tugas hafalan rutin.' },
    3: { metode:['dokumen','observasi'], sumber:'Jurnal format bimbingan klasikal/kelompok/individu; rekap variasi format', catatan:'Verifikasi variasi format. Apakah disesuaikan dgn kebutuhan?' },
    4: { metode:['observasi','dokumen'], sumber:'Instrumen cek pemahaman; quiz formatif; rekap pengecekan; jurnal kemajuan siswa', catatan:'Cek bukti pengecekan pemahaman bertahap (bukan langsung lompat ke materi baru).' },
    5: { metode:['observasi','dokumen'], sumber:'LKPD pengelolaan informasi (cari, olah, simpan, sajikan, sebar); produk siswa', catatan:'Cek 5 keterampilan TIK: search, process, store, present, share. Verifikasi karya siswa.' },
    6: { metode:['observasi'], sumber:'Observasi respon guru terhadap pertanyaan siswa; rekaman; testimoni siswa', catatan:'Cek apakah guru merespons setiap pertanyaan siswa dgn perhatian penuh.' },
    7: { metode:['dokumen'], sumber:'Instrumen penilaian proses & hasil; rekap nilai TIK; rubrik penilaian', catatan:'Cek penilaian proses (proses kerja) & hasil (produk akhir) bukan hanya tes pengetahuan.' },
  },
  4: {
    1: { metode:['observasi','wawancara'], sumber:'Observasi keseharian; testimoni siswa & rekan; jurnal kepribadian Pancasila', catatan:'Cek penghayatan & pengamalan Pancasila dlm tugas TIK & keseharian.' },
    2: { metode:['observasi','wawancara'], sumber:'Observasi semangat kebangsaan; testimoni rekan; foto kegiatan kebangsaan', catatan:'Cek rasa persatuan & kesatuan guru TIK dlm tim.' },
    3: { metode:['observasi','wawancara'], sumber:'Catatan kerjasama; testimoni rekan beragam latar; foto kebersamaan', catatan:'Cek kerjasama lintas latar belakang. Apakah inklusif atau eksklusif?' },
    4: { metode:['observasi','wawancara'], sumber:'Catatan saling menghormati antar guru; testimoni rekan', catatan:'Cek penghormatan kepada rekan tanpa memandang latar belakang.' },
    5: { metode:['observasi','wawancara'], sumber:'Observasi penampilan & tutur kata; testimoni siswa, ortu, rekan', catatan:'Cek sopan santun guru TIK dlm bicara, berpenampilan, & berperilaku.' },
    6: { metode:['observasi','wawancara'], sumber:'Catatan respons terhadap masukan siswa; testimoni siswa; jurnal kelas', catatan:'Tanya siswa: berani memberi masukan ke guru TIK? Cek penerimaannya.' },
    7: { metode:['observasi','wawancara'], sumber:'Catatan akhlak guru TIK; testimoni masyarakat madrasah; jurnal akhlak', catatan:'Cek konsistensi akhlak guru TIK selaras norma agama.' },
  },
  5: {
    1: { metode:['dokumen'], sumber:'Daftar tugas administratif TIK; checklist penyelesaian; jurnal harian', catatan:'Cek tugas adm: program TIK, jurnal bimbingan, laporan. Apakah tepat waktu?' },
    2: { metode:['observasi','wawancara'], sumber:'Jadwal harian; catatan waktu luang; jurnal kegiatan produktif', catatan:'Cek pemanfaatan jam non-mengajar. Apakah produktif (PKB, koreksi, persiapan)?' },
    3: { metode:['dokumen'], sumber:'Daftar prestasi TIK & siswa bimbingan; SK panitia; piagam; bukti kontribusi pengembangan IT madrasah', catatan:'Cek bukti kontribusi konkret guru TIK pada pengembangan madrasah (web, e-rapor, dst).' },
    4: { metode:['wawancara','observasi'], sumber:'Wawancara guru TIK langsung; testimoni rekan; jurnal pribadi', catatan:'Tanya: apa yg membuat bangga jadi guru TIK? Cek konsistensi semangat profesional.' },
  },
  6: {
    1: { metode:['observasi'], sumber:'Observasi pembimbingan TIK; rekap perlakuan kepada siswa; testimoni siswa', catatan:'Cek apakah guru TIK memperlakukan semua siswa adil tanpa pilih kasih.' },
    2: { metode:['observasi'], sumber:'Observasi rotasi interaksi guru-siswa; rekam interaksi; jurnal kelas', catatan:'Catat siapa yg sering dihampiri/dipanggil. Apakah merata?' },
    3: { metode:['observasi','wawancara'], sumber:'Observasi interaksi di ruang guru; testimoni rekan; foto kegiatan bersama', catatan:'Cek hubungan kerjasama & kepedulian guru TIK dgn rekan.' },
  },
  7: {
    1: { metode:['dokumen','wawancara'], sumber:'Notulen pertemuan ortu; rekap WA paguyuban; laporan home visit; jurnal komunikasi', catatan:'Cek bukti komunikasi rutin guru TIK dgn ortu siswa.' },
    2: { metode:['dokumen'], sumber:'SK kepanitiaan; daftar hadir kegiatan masyarakat/komunitas; foto kegiatan', catatan:'Cek partisipasi minimal 2-3 kegiatan setahun di luar pembimbingan.' },
    3: { metode:['observasi','wawancara'], sumber:'Catatan hubungan dengan masyarakat; testimoni warga sekitar; jurnal interaksi', catatan:'Cek bukti komunikasi guru TIK dgn masyarakat sekitar madrasah.' },
  },
  8: {
    1: { metode:['dokumen'], sumber:'Pemetaan kompetensi TIK; analisis kebutuhan TIK siswa; rancangan materi sesuai kebutuhan', catatan:'Cek pemetaan kompetensi yg sistematis (bukan asal copas silabus).' },
    2: { metode:['observasi','wawancara'], sumber:'Catatan kerjasama lintas latar belakang; testimoni rekan beragam; foto kebersamaan', catatan:'Cek kerjasama tanpa memandang suku/agama/gender.' },
    3: { metode:['observasi','dokumen'], sumber:'Materi bimbingan TIK terstruktur (konkret-abstrak, sederhana-kompleks); jurnal urutan materi', catatan:'Cek sistematisasi materi TIK. Apakah scaffolding dari mudah ke sulit?' },
    4: { metode:['dokumen','observasi'], sumber:'LKPD pengelolaan informasi multimedia; produk siswa beragam media; jurnal kreasi', catatan:'Cek variasi cara siswa mencari, mengolah, menyajikan informasi.' },
    5: { metode:['observasi','wawancara'], sumber:'Observasi respons pertanyaan siswa; akurasi konten; tinjauan keilmuan', catatan:'Cek akurasi & ketepatan jawaban guru TIK secara konsep.' },
    6: { metode:['observasi','dokumen'], sumber:'Materi TIK dikaitkan dgn kehidupan siswa & abad 21; jurnal kontekstualisasi', catatan:'Cek bukti kontekstualisasi materi TIK dgn skill abad 21 (collab, communication, critical thinking, creativity).' },
    7: { metode:['dokumen','observasi'], sumber:'RPL terkini; bahan ajar up-to-date (refrensi <3 thn); jurnal pembaruan materi', catatan:'Cek kebaruan informasi (TIK berkembang cepat). Refrensi tools terbaru?' },
    8: { metode:['observasi','wawancara'], sumber:'Demonstrasi penguasaan TIK guru; sertifikat literasi digital; portofolio karya digital', catatan:'Cek penguasaan teknologi: hardware, software, internet, AI, cloud, digital citizenship.' },
  },
  9: {
    1: { metode:['dokumen','observasi'], sumber:'Jadwal fasilitasi TIK ke guru; LPJ fasilitasi; testimoni guru penerima', catatan:'Cek bukti fasilitasi kepada guru lain. Apakah sesuai kebutuhan?' },
    2: { metode:['dokumen'], sumber:'Materi fasilitasi TIK untuk guru: RPP digital, media pembelajaran, e-asesmen, e-rapor', catatan:'Cek kelengkapan materi fasilitasi yg ditujukan untuk guru.' },
    3: { metode:['observasi','dokumen'], sumber:'Materi fasilitasi terstruktur; jurnal urutan materi; testimoni alur belajar', catatan:'Verifikasi sistematisasi materi fasilitasi (konkret-abstrak).' },
    4: { metode:['observasi','dokumen'], sumber:'RPL fasilitasi dgn variasi metode; jurnal aktivitas; foto/video', catatan:'Cek variasi metode fasilitasi: praktek, diskusi, project, refleksi.' },
    5: { metode:['dokumen','observasi'], sumber:'Pendekatan andragogi; modul fasilitasi orang dewasa; jurnal interaksi', catatan:'Cek pendekatan ke guru: andragogi (collaborative, problem-centered) bukan pedagogi siswa.' },
    6: { metode:['dokumen','observasi'], sumber:'Jurnal fasilitasi individu/kelompok; rekap jenis sesi', catatan:'Cek variasi format fasilitasi: 1-on-1 atau workshop.' },
    7: { metode:['observasi'], sumber:'Instrumen cek penguasaan; quiz formatif; jurnal kemajuan peserta', catatan:'Cek bukti pengecekan penguasaan peserta sebelum lanjut materi.' },
  },
  10: {
    1: { metode:['dokumen'], sumber:'Jadwal fasilitasi TIK ke tendik; LPJ; testimoni TU/perpustakaan/satpam', catatan:'Cek bukti fasilitasi ke tendik. Verifikasi kebutuhan & realisasi.' },
    2: { metode:['dokumen'], sumber:'Materi fasilitasi TIK untuk tendik: pengelolaan data sekolah, e-laporan, basic tools', catatan:'Cek materi fasilitasi yg sesuai kebutuhan tendik.' },
    3: { metode:['observasi','dokumen'], sumber:'Materi fasilitasi terstruktur; jurnal alur belajar; testimoni tendik', catatan:'Verifikasi sistematisasi materi fasilitasi tendik.' },
    4: { metode:['observasi'], sumber:'RPL fasilitasi tendik dgn variasi; jurnal aktivitas; foto', catatan:'Cek variasi metode fasilitasi tendik.' },
    5: { metode:['observasi'], sumber:'Pendekatan andragogi untuk tendik; jurnal interaksi', catatan:'Verifikasi pendekatan andragogi disesuaikan utk tendik.' },
    6: { metode:['dokumen'], sumber:'Jurnal fasilitasi individu/kelompok; rekap format', catatan:'Cek variasi format: 1-on-1 untuk TU sibuk, kelompok untuk yg banyak.' },
    7: { metode:['observasi'], sumber:'Cek penguasaan tendik; quiz; jurnal kemajuan', catatan:'Cek bukti pengecekan penguasaan tendik.' },
  },
  11: {
    1: { metode:['dokumen'], sumber:'Laporan evaluasi pembimbingan TIK siswa; instrumen evaluasi; rekap hasil', catatan:'Cek laporan evaluasi pembimbingan TIK siswa berkala.' },
    2: { metode:['dokumen'], sumber:'Laporan evaluasi fasilitasi TIK guru; testimoni guru; rekap dampak', catatan:'Cek laporan evaluasi fasilitasi guru. Verifikasi dampaknya.' },
    3: { metode:['dokumen'], sumber:'Laporan evaluasi fasilitasi TIK tendik; testimoni tendik; rekap dampak', catatan:'Cek laporan evaluasi fasilitasi tendik.' },
    4: { metode:['dokumen'], sumber:'Program tindak lanjut hasil evaluasi; rancangan perbaikan; jurnal implementasi', catatan:'Cek bukti tindak lanjut konkret dari hasil evaluasi.' },
  },
  12: {
    1: { metode:['dokumen'], sumber:'Form evaluasi diri awal tahun; SKP; rancangan pengembangan diri TIK', catatan:'Cek dokumen evaluasi diri awal tahun. Apakah spesifik & realistis?' },
    2: { metode:['dokumen'], sumber:'Catatan pelaksanaan pembimbingan TIK siswa; jurnal harian; rekap kegiatan', catatan:'Cek dokumen catatan harian pembimbingan. Apakah sistematis?' },
    3: { metode:['dokumen'], sumber:'Catatan pelaksanaan fasilitasi guru & tendik; jurnal harian; rekap kegiatan', catatan:'Cek dokumen catatan fasilitasi.' },
    4: { metode:['dokumen','wawancara'], sumber:'Hasil PKG terkini; rancangan perbaikan; jurnal mutu', catatan:'Cek bagaimana guru TIK memanfaatkan hasil PKG sebagai dasar perbaikan.' },
    5: { metode:['dokumen','observasi'], sumber:'Sertifikat PKB TIK; bukti aplikasi PKB ke kegiatan; portofolio karya', catatan:'Cek aplikasi pengalaman PKB ke pembimbingan & fasilitasi.' },
    6: { metode:['dokumen'], sumber:'Sertifikat PKB 2 thn terakhir (24 JP/thn); proceeding seminar/konferensi; karya digital', catatan:'Cek minimal 24 JP PKB/tahun. Verifikasi jenis kegiatan PKB.' },
  },
};

// === LAB (6 kompetensi, 33 indikator) ===
window.SARAN_INDIKATOR.LAB = {
  1: {
    1: { metode:['observasi','wawancara'], sumber:'Observasi penanganan masalah; testimoni rekan; jurnal pengambilan keputusan', catatan:'Cek bukti perilaku arif & pemecahan masalah lab. Tanya rekan untuk validasi.' },
    2: { metode:['observasi','wawancara'], sumber:'Catatan kejujuran info; testimoni atasan; jurnal komunikasi resmi', catatan:'Cek konsistensi kejujuran dlm laporan resmi & komunikasi kedinasan.' },
    3: { metode:['observasi','wawancara'], sumber:'Observasi kemandirian kerja; testimoni rekan; jurnal kerja mandiri', catatan:'Cek apakah laboran/kepala lab mandiri atau bergantung supervisi terus.' },
    4: { metode:['observasi','wawancara'], sumber:'Observasi pengambilan keputusan; testimoni rekan; jurnal kepercayaan diri', catatan:'Cek rasa percaya diri dlm pengambilan keputusan lab.' },
    5: { metode:['dokumen','wawancara'], sumber:'Sertifikat pelatihan lab; rancangan pengembangan diri; jurnal belajar', catatan:'Cek bukti upaya peningkatan kemampuan diri di bidang lab.' },
    6: { metode:['observasi','wawancara'], sumber:'Catatan konsistensi tindakan; testimoni rekan; jurnal etika kerja', catatan:'Cek konsistensi tindakan dgn norma agama, hukum, sosial.' },
    7: { metode:['dokumen','observasi'], sumber:'Daftar hadir; jurnal kerja; observasi kepatuhan jadwal & aturan', catatan:'Cek disiplin waktu & taat aturan dlm pengelolaan lab.' },
    8: { metode:['observasi','wawancara'], sumber:'LPJ tugas; testimoni atasan; jurnal akuntabilitas', catatan:'Cek tanggung jawab terhadap tugas lab. Verifikasi LPJ.' },
    9: { metode:['observasi','wawancara'], sumber:'Catatan ketelitian kerja; jurnal pelaksanaan praktikum; testimoni guru', catatan:'Cek ketelitian dlm penanganan alat/bahan lab. Hindari kelalaian.' },
    10: { metode:['observasi','wawancara'], sumber:'Catatan inovasi pemecahan masalah lab; testimoni guru; jurnal kreativitas', catatan:'Cek bukti kreativitas dlm pemecahan masalah lab.' },
    11: { metode:['observasi','wawancara'], sumber:'Survey kepuasan pemakai lab; testimoni guru/siswa; jurnal layanan', catatan:'Cek orientasi kualitas layanan. Tanya guru/siswa kepuasannya.' },
  },
  2: {
    1: { metode:['observasi','wawancara'], sumber:'Refleksi diri; jurnal kekuatan-kelemahan; rancangan pengembangan', catatan:'Cek kesadaran diri akan kekuatan & kelemahan dlm tugas lab.' },
    2: { metode:['dokumen','wawancara'], sumber:'Catatan kerjasama dgn guru/laboran/teknisi; testimoni rekan; jurnal kolaborasi', catatan:'Cek bukti kerjasama efektif lintas pihak.' },
    3: { metode:['observasi','wawancara'], sumber:'Observasi komunikasi; testimoni rekan; jurnal komunikasi profesional', catatan:'Cek komunikasi santun, empati, & efektif dlm tugas lab.' },
  },
  3: {
    1: { metode:['dokumen'], sumber:'Program pengelolaan laboratorium; rancangan kegiatan tahunan; analisis kebutuhan', catatan:'Cek kelengkapan program. Verifikasi tujuan & rincian kegiatan.' },
    2: { metode:['dokumen'], sumber:'Jadwal kegiatan lab; sinkronisasi dgn jadwal pelajaran; rekap penggunaan', catatan:'Cek jadwal yg jelas & terpublikasi. Verifikasi tidak benturan.' },
    3: { metode:['dokumen'], sumber:'Rencana pengembangan lab; analisis SWOT; usulan pengadaan; rancangan modernisasi', catatan:'Cek rencana pengembangan jangka panjang lab.' },
    4: { metode:['dokumen'], sumber:'POS/SOP kerja lab: penggunaan alat, prosedur praktikum, handling bahan', catatan:'Cek kelengkapan POS lab. Apakah dipasang & diketahui pengguna?' },
    5: { metode:['dokumen'], sumber:'Laporan kegiatan lab semester/tahunan; LPJ; rekap pemakaian', catatan:'Cek kelengkapan & ketepatan waktu laporan kegiatan.' },
  },
  4: {
    1: { metode:['observasi','dokumen'], sumber:'Inventaris alat/bahan; checklist kondisi; jurnal pemantauan; foto kondisi', catatan:'Cek pemantauan rutin kondisi & keamanan alat/bahan. Verifikasi kelengkapan inventaris.' },
    2: { metode:['observasi','dokumen'], sumber:'Jurnal pemantauan praktikum; observasi sesi; rekap pengawasan', catatan:'Cek bukti pemantauan saat praktikum berlangsung.' },
    3: { metode:['dokumen'], sumber:'Laporan bulanan & tahunan kondisi lab; rekap pemakaian; analisis pemanfaatan', catatan:'Cek kelengkapan laporan periodik. Apakah memuat data konkret?' },
    4: { metode:['dokumen'], sumber:'Laporan kegiatan semester; LPJ keuangan; rekap pemakaian alat', catatan:'Verifikasi laporan semester yg sistematis & terverifikasi.' },
    5: { metode:['dokumen'], sumber:'Evaluasi program lab; rancangan perbaikan; jurnal tindak lanjut', catatan:'Cek bukti evaluasi program & tindak lanjut perbaikannya.' },
  },
  5: {
    1: { metode:['dokumen','wawancara'], sumber:'Sertifikat seminar/diklat lab; bahan bacaan terbaru; jurnal pembaruan', catatan:'Cek upaya mengikuti perkembangan pemanfaatan lab.' },
    2: { metode:['dokumen','observasi'], sumber:'Hasil inovasi lab; portofolio kajian; jurnal aplikasi inovasi', catatan:'Cek bukti penerapan inovasi/kajian lab dlm praktek.' },
    3: { metode:['dokumen'], sumber:'Rancangan kegiatan lab pendidikan & penelitian; LKPD inovatif', catatan:'Cek bukti rancangan kegiatan lab utk pembelajaran & penelitian.' },
    4: { metode:['dokumen','observasi'], sumber:'Jurnal pelaksanaan kegiatan lab; LKPD; produk siswa; foto kegiatan', catatan:'Cek pelaksanaan kegiatan lab. Verifikasi pemanfaatan riil.' },
  },
  6: {
    1: { metode:['dokumen'], sumber:'Panduan/petunjuk praktikum; manual lab; SOP penggunaan alat', catatan:'Cek kelengkapan panduan praktikum sesuai jenis lab.' },
    2: { metode:['dokumen'], sumber:'Ketentuan K3 lab; SOP keselamatan; instrumen K3', catatan:'Cek dokumen K3 lab. Apakah jelas & terpasang?' },
    3: { metode:['observasi','dokumen'], sumber:'Observasi praktek K3 di lab; APAR berfungsi; APD tersedia; P3K terisi', catatan:'Verifikasi langsung penerapan K3: APAR, APD, P3K, jalur evakuasi.' },
    4: { metode:['observasi','dokumen'], sumber:'SOP B3 (bahan berbahaya beracun); penyimpanan B3; logbook penggunaan B3', catatan:'Cek penanganan B3 sesuai SOP. Verifikasi penyimpanan & disposal.' },
    5: { metode:['observasi','dokumen'], sumber:'Inventaris B3 & alat keselamatan; jurnal pemantauan rutin; foto kondisi', catatan:'Cek pemantauan B3 rutin (mingguan/bulanan). Verifikasi kondisi alat keselamatan.' },
  },
};

// === PUS (11 kompetensi, 44 indikator) ===
window.SARAN_INDIKATOR.PUS = {
  1: {
    1: { metode:['dokumen'], sumber:'Visi-misi perpustakaan; SK Kepala Madrasah; lampiran rumusan visi', catatan:'Cek dokumen visi-misi disahkan kepala madrasah. Verifikasi konsistensi dgn visi madrasah.' },
    2: { metode:['dokumen'], sumber:'Naskah kebijakan pengembangan koleksi; rancangan pengadaan; SOP penambahan koleksi', catatan:'Cek dokumen kebijakan koleksi. Apakah memuat kriteria seleksi & pengembangan?' },
    3: { metode:['dokumen'], sumber:'Renstra perpustakaan jangka menengah & panjang; analisis SWOT; rencana strategis', catatan:'Cek renstra terpadu (5 tahun) dgn target SMART.' },
    4: { metode:['dokumen'], sumber:'Program kerja tahunan perpustakaan; rincian kegiatan; jadwal; anggaran', catatan:'Cek program tahunan: rinci, terjadwal, ada anggaran.' },
    5: { metode:['dokumen'], sumber:'Program literasi sekolah; rancangan kegiatan literasi; KPI literasi', catatan:'Cek program literasi sekolah yg sistematis & berkelanjutan.' },
  },
  2: {
    1: { metode:['dokumen'], sumber:'Instrumen monev penyelenggaraan; rancangan evaluasi; jadwal monev', catatan:'Cek instrumen monev kegiatan. Apakah valid & reliable?' },
    2: { metode:['dokumen'], sumber:'Laporan monev kegiatan periodik; rekap hasil; analisis temuan', catatan:'Cek laporan monev rutin. Verifikasi tindak lanjut temuan.' },
    3: { metode:['dokumen'], sumber:'Instrumen monev SDM perpustakaan; checklist kompetensi; rancangan evaluasi staf', catatan:'Cek instrumen evaluasi SDM (pustakawan, pembantu).' },
    4: { metode:['dokumen'], sumber:'Laporan monev SDM; rekap kompetensi; tindak lanjut pengembangan', catatan:'Cek laporan monev SDM & tindak lanjutnya.' },
    5: { metode:['dokumen'], sumber:'Instrumen monev anggaran; checklist realisasi; rancangan audit', catatan:'Cek instrumen monev keuangan perpustakaan.' },
    6: { metode:['dokumen'], sumber:'Laporan monev anggaran; LPJ keuangan; analisis efisiensi', catatan:'Cek laporan keuangan perpustakaan. Verifikasi transparansi.' },
  },
  3: {
    1: { metode:['dokumen'], sumber:'Laporan seleksi buku usulan 3 thn terakhir; rekap pengadaan', catatan:'Cek bukti seleksi sistematis usulan pengadaan buku.' },
    2: { metode:['dokumen'], sumber:'Laporan klasifikasi buku 3 thn terakhir; bukti pengkelasan; nomor klasifikasi', catatan:'Cek pekerjaan klasifikasi (DDC). Verifikasi konsistensi sistem.' },
    3: { metode:['dokumen'], sumber:'Laporan tajuk subyek 3 thn terakhir; daftar tajuk; konsistensi penomoran', catatan:'Cek dokumen tajuk subyek. Apakah baku & konsisten?' },
    4: { metode:['dokumen'], sumber:'Laporan katalog 3 thn terakhir; rekap entry; sistem pencarian', catatan:'Cek alat telusur (katalog manual atau digital). Verifikasi efisiensi.' },
    5: { metode:['dokumen'], sumber:'Laporan perawatan koleksi; jurnal pemeliharaan; foto koleksi', catatan:'Cek bukti perawatan rutin koleksi. Verifikasi kondisi buku.' },
  },
  4: {
    1: { metode:['dokumen'], sumber:'Laporan pengunjung manual & online 3 thn terakhir; rekap statistik kunjungan', catatan:'Cek statistik kunjungan. Apakah trend meningkat?' },
    2: { metode:['dokumen'], sumber:'Laporan peminjaman 3 thn terakhir; rekap buku populer; statistik peminjaman', catatan:'Cek data peminjaman. Verifikasi pola pemanfaatan koleksi.' },
    3: { metode:['dokumen'], sumber:'Laporan layanan rujukan manual & online; jurnal rujukan; testimoni pemustaka', catatan:'Cek bukti layanan rujukan. Apakah responsif?' },
  4: { metode:['dokumen'], sumber:'Laporan kegiatan pendidikan pemakai; jurnal orientasi; foto kegiatan', catatan:'Cek pendidikan pemakai (user education) untuk siswa baru.' },
  },
  5: {
    1: { metode:['dokumen'], sumber:'Naskah kajian minat baca; instrumen kajian; analisis hasil', catatan:'Cek kajian minat baca rutin. Verifikasi metodologi.' },
    2: { metode:['dokumen'], sumber:'Naskah kajian kepuasan pemustaka; survey; analisis', catatan:'Cek bukti kajian kepuasan. Verifikasi tindak lanjutnya.' },
    3: { metode:['dokumen'], sumber:'Naskah kajian keterpakaian perpus dlm pembelajaran; instrumen; hasil', catatan:'Cek kajian peran perpustakaan dlm pembelajaran.' },
    4: { metode:['dokumen'], sumber:'Naskah kajian literasi sekolah; instrumen literasi; analisis dampak', catatan:'Cek kajian literasi sekolah berkala.' },
  },
  6: {
    1: { metode:['dokumen'], sumber:'Dokumen promosi perpustakaan: poster, brosur, banner; sosmed perpus', catatan:'Cek bukti promosi perpustakaan. Verifikasi keberlanjutan.' },
    2: { metode:['dokumen'], sumber:'Laporan sosialisasi perpustakaan; jurnal kegiatan; foto kegiatan', catatan:'Cek laporan sosialisasi rutin. Verifikasi target audience.' },
    3: { metode:['dokumen'], sumber:'Laporan literasi perpustakaan; rekap kegiatan literasi; foto', catatan:'Cek laporan kegiatan literasi rutin. Verifikasi dampak.' },
    4: { metode:['dokumen'], sumber:'Makalah/tulisan tentang perpustakaan; artikel jurnal; blog perpustakaan', catatan:'Cek karya tulis pustakawan tentang perpustakaan/literasi.' },
  },
  7: {
    1: { metode:['dokumen'], sumber:'Sertifikat diklat/bimtek kepustakawanan; daftar pelatihan diikuti', catatan:'Cek minimal 1 sertifikat diklat profesi setahun.' },
    2: { metode:['dokumen'], sumber:'Sertifikat seminar/lokakarya/konferensi kepustakawanan; daftar event', catatan:'Cek partisipasi dlm event ilmiah profesi.' },
    3: { metode:['dokumen'], sumber:'Surat tugas/sertifikat magang/studi banding perpustakaan', catatan:'Cek bukti magang/studi banding di perpustakaan lain.' },
    4: { metode:['dokumen'], sumber:'Kartu anggota organisasi profesi (IPI/ATPUSI); SK pengurus jika ada', catatan:'Cek keaktifan dlm organisasi profesi pustakawan.' },
  },
  8: {
    1: { metode:['observasi','wawancara'], sumber:'Observasi pelayanan; testimoni pemustaka; jurnal layanan', catatan:'Cek perilaku sopan kepada pemustaka.' },
    2: { metode:['observasi','wawancara'], sumber:'Observasi penampilan; testimoni pemustaka; foto', catatan:'Cek penampilan rapi pustakawan saat bertugas.' },
    3: { metode:['observasi','wawancara'], sumber:'Observasi layanan; testimoni pemustaka beragam kebutuhan; jurnal layanan', catatan:'Cek apakah pelayanan sesuai kebutuhan pemustaka (siswa, guru, ortu).' },
  },
  9: {
    1: { metode:['observasi','wawancara'], sumber:'Kode etik pustakawan IPI; jurnal etika kerja; testimoni rekan', catatan:'Cek pemahaman & praktik kode etik kepustakawanan.' },
    2: { metode:['observasi','wawancara'], sumber:'LPJ tugas; testimoni atasan; jurnal akuntabilitas', catatan:'Cek tanggung jawab dlm tugas pustakawan.' },
    3: { metode:['observasi','wawancara'], sumber:'Catatan keputusan rapat & realisasinya; testimoni rekan', catatan:'Cek konsistensi pelaksanaan keputusan/kesepakatan.' },
  },
  10: {
    1: { metode:['dokumen'], sumber:'Daftar hadir; jurnal kerja; SOP jam kerja perpustakaan', catatan:'Cek kepatuhan jam kerja. Verifikasi daftar hadir.' },
    2: { metode:['dokumen'], sumber:'Surat ijin meninggalkan tugas; jurnal komunikasi atasan', catatan:'Cek bukti ijin tertulis saat meninggalkan tugas.' },
    3: { metode:['observasi','wawancara'], sumber:'Catatan ketepatan waktu tugas; testimoni atasan; jurnal target', catatan:'Cek ketepatan waktu penyelesaian tugas pustakawan.' },
  },
  11: {
    1: { metode:['observasi','wawancara'], sumber:'Observasi interaksi dgn atasan; testimoni atasan; jurnal komunikasi', catatan:'Cek penghormatan kepada atasan.' },
    2: { metode:['observasi','wawancara'], sumber:'Observasi interaksi dgn rekan; testimoni rekan; foto kebersamaan', catatan:'Cek penghormatan kepada rekan kerja.' },
    3: { metode:['observasi','wawancara'], sumber:'Catatan keterlibatan kegiatan bersama; foto; testimoni rekan', catatan:'Cek partisipasi aktif dlm aktivitas tim.' },
  },
};