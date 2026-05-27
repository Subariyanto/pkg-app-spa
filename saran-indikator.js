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
