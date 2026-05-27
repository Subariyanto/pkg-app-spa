// laporan.js - Generator Laporan Madrasah & KKM untuk PKG App SPA
// Dependencies: db.js (PKGDB), instrumen.js (INSTRUMEN), docx.js (UMD), file-saver.js
// Output: HTML A4 (langsung print/PDF dari browser) + DOCX (download)

(function () {
  'use strict';

  // === KONFIG TETAP ====================================================
  const POKJAWAS = {
    nama: 'SUBARIYANTO, S.Pd, M.Pd.I.',
    nip: '197002122005011004',
    jabatan: 'Ketua Pokjawas Madrasah',
    wilayah: 'Kabupaten Jember',
  };

  const KEMENAG = {
    instansi: 'Kementerian Agama',
    kabupaten: 'Kabupaten Jember',
    provinsi: 'Provinsi Jawa Timur',
  };

  const TAHUN_DEFAULT = new Date().getFullYear();

  // Landasan hukum (default - bisa di-edit user di form)
  const LANDASAN_HUKUM_DEFAULT = [
    'Undang-Undang Nomor 14 Tahun 2005 tentang Guru dan Dosen',
    'Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional',
    'Peraturan Menteri Agama Nomor 38 Tahun 2018 tentang Penilaian Kinerja Guru pada Madrasah',
    'Peraturan Menteri Agama Nomor 90 Tahun 2013 tentang Penyelenggaraan Pendidikan Madrasah',
    'PermenpanRB Nomor 1 Tahun 2023 tentang Jabatan Fungsional',
    'Keputusan Menteri Agama Nomor 624 Tahun 2024 tentang Kurikulum Madrasah',
    'Keputusan Direktur Jenderal Pendidikan Islam Nomor 6673 Tahun 2019 tentang Petunjuk Teknis Penilaian Kinerja Guru pada Madrasah',
  ];

  // === HELPERS =========================================================
  const e = (s) => {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  };

  function fmtTanggalID(d) {
    if (!d) d = new Date();
    if (typeof d === 'string') d = new Date(d);
    const bln = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    return `${d.getDate()} ${bln[d.getMonth()]} ${d.getFullYear()}`;
  }

  function tahunAkademik(now) {
    now = now || new Date();
    const y = now.getFullYear();
    const m = now.getMonth(); // 0=Jan
    if (m >= 6) return `${y}/${y + 1}`;
    return `${y - 1}/${y}`;
  }

  function semesterAktif(now) {
    now = now || new Date();
    const m = now.getMonth();
    return (m >= 0 && m <= 5) ? 'Genap' : 'Ganjil';
  }

  function safeNum(n, def) { n = Number(n); return isNaN(n) ? (def || 0) : n; }

  function sebutanByNilai(n) {
    if (n == null || isNaN(n)) return '-';
    if (n > 90) return 'Amat Baik';
    if (n > 75) return 'Baik';
    if (n > 60) return 'Cukup';
    if (n > 50) return 'Sedang';
    return 'Kurang';
  }

  // === AGREGASI DATA ===================================================
  function getPenilaianGuruAtScope(scope, scopeValue) {
    // scope: 'madrasah' | 'kkm' | 'kabupaten'
    // Return: { gurus: [...], summary: {...}, perKomp: [...], perRole: [...] }
    const all = window.PKGDB.getRekap(); // [{...guru, peran:[{nilai, sebutan, role_label, jenis}]}]
    let gurus;
    if (scope === 'madrasah') {
      gurus = all.filter(g => (g.nama_madrasah || '').trim() === scopeValue);
    } else if (scope === 'kkm') {
      gurus = all.filter(g => (g.kkm || '').trim() === scopeValue);
    } else if (scope === 'kabupaten') {
      gurus = all.filter(g => (g.kabupaten || '').trim() === scopeValue);
    } else {
      gurus = all;
    }

    // Per guru: pakai sumatif jika ada, fallback formatif
    const rows = gurus.map(g => {
      const peranWithNilai = (g.peran || []).filter(p => p.nilai != null && p.nilai > 0);
      const sumatif = peranWithNilai.find(p => p.jenis === 'sumatif');
      const dipakai = sumatif || peranWithNilai[0] || null;
      return {
        guru: g,
        nilai: dipakai ? dipakai.nilai : null,
        sebutan: dipakai ? dipakai.sebutan : 'Belum dinilai',
        role_label: dipakai ? dipakai.role_label : '',
        role_code: dipakai ? dipakai.role_code : '',
        jenis: dipakai ? dipakai.jenis : '',
        penilaian_id: dipakai ? dipakai.id : null,
      };
    });

    // Summary
    const dinilai = rows.filter(r => r.nilai != null);
    const nilaiAvg = dinilai.length ? (dinilai.reduce((a, b) => a + b.nilai, 0) / dinilai.length) : 0;
    const sebutanCount = { 'Amat Baik': 0, 'Baik': 0, 'Cukup': 0, 'Sedang': 0, 'Kurang': 0, 'Belum dinilai': 0 };
    for (const r of rows) sebutanCount[r.sebutan] = (sebutanCount[r.sebutan] || 0) + 1;

    // Per kompetensi (rata-rata lintas guru)
    const perKomp = computeRataKompetensi(rows);

    // Per role (jumlah & rata-rata)
    const perRole = {};
    for (const r of rows) {
      const code = r.role_code || '-';
      const label = r.role_label || '(Belum dinilai)';
      const key = code + '|' + label;
      if (!perRole[key]) perRole[key] = { code, label, jumlah: 0, dinilai: 0, sumNilai: 0 };
      perRole[key].jumlah++;
      if (r.nilai != null) { perRole[key].dinilai++; perRole[key].sumNilai += r.nilai; }
    }
    const perRoleList = Object.values(perRole).map(x => ({
      ...x,
      rataRata: x.dinilai ? x.sumNilai / x.dinilai : 0,
    })).sort((a, b) => a.label.localeCompare(b.label));

    // Madrasah set (untuk KKM/Kabupaten)
    const madrasahSet = new Set(rows.map(r => r.guru.nama_madrasah).filter(Boolean));

    return {
      rows,
      summary: {
        total: rows.length,
        dinilai: dinilai.length,
        belum: rows.length - dinilai.length,
        rataRata: nilaiAvg,
        sebutanCount,
        madrasahCount: madrasahSet.size,
        madrasahList: Array.from(madrasahSet).sort(),
      },
      perKomp,
      perRole: perRoleList,
    };
  }

  function computeRataKompetensi(rows) {
    // Untuk tiap (role_code, kompetensi_no), hitung rata-rata persentase lintas guru
    const map = {};
    for (const r of rows) {
      if (r.penilaian_id == null) continue;
      const meta = window.PKGDB.getRoleMeta(r.role_code);
      if (!meta) continue;
      const instrumen = window.PKGDB.getInstrumen(r.role_code);
      const skorMap = window.PKGDB.getSkorMap ? window.PKGDB.getSkorMap(r.penilaian_id) : null;
      if (!skorMap) continue;
      const max = meta.max_score;
      const byKomp = {};
      for (const it of instrumen) {
        if (!byKomp[it.kompetensi_no]) byKomp[it.kompetensi_no] = { sum: 0, count: 0, nama: it.kompetensi_nama };
        const o = byKomp[it.kompetensi_no];
        o.sum += Number(skorMap[it.id]) || 0;
        o.count += 1;
      }
      for (const no of Object.keys(byKomp)) {
        const o = byKomp[no];
        const pct = o.count ? (o.sum / (o.count * max)) * 100 : 0;
        const key = `${r.role_code}_${no}`;
        if (!map[key]) map[key] = { role: r.role_code, role_label: r.role_label, no: Number(no), nama: o.nama, pcts: [] };
        map[key].pcts.push(pct);
      }
    }
    return Object.values(map).map(o => ({
      role: o.role,
      role_label: o.role_label,
      no: o.no,
      nama: o.nama,
      rataPct: o.pcts.length ? o.pcts.reduce((a, b) => a + b, 0) / o.pcts.length : 0,
      jumlah: o.pcts.length,
    })).sort((a, b) => (a.role || '').localeCompare(b.role || '') || a.no - b.no);
  }

  // === NARASI BAB ======================================================
  function narasiLatarBelakang(scope, scopeValue, summary) {
    const obj = scope === 'madrasah' ? `Madrasah ${e(scopeValue)}` :
                scope === 'kkm' ? `Kelompok Kerja Madrasah (KKM) ${e(scopeValue)}` :
                `Kabupaten ${e(scopeValue)}`;
    return `Penilaian Kinerja Guru (PKG) merupakan instrumen strategis dalam upaya peningkatan mutu pendidikan di lingkungan madrasah. PKG bukan sekadar formalitas administratif, melainkan sarana refleksi profesional bagi setiap guru untuk mengukur sejauh mana kompetensi pedagogik, kepribadian, sosial, dan profesional telah diaktualisasikan dalam proses pembelajaran. Hasil PKG menjadi dasar pengembangan keprofesian berkelanjutan (PKB) sekaligus bahan pertimbangan dalam pembinaan, pengembangan karir, serta pemberian penghargaan kepada guru. <br><br>
Dalam kerangka regulasi nasional, pelaksanaan PKG di madrasah didasarkan pada Peraturan Menteri Agama Nomor 38 Tahun 2018 tentang Penilaian Kinerja Guru pada Madrasah, yang menegaskan bahwa setiap guru madrasah, baik PNS maupun bukan PNS, wajib mengikuti penilaian kinerja secara berkala. Penilaian dilakukan dalam dua bentuk, yakni penilaian formatif pada awal tahun ajaran sebagai pemetaan awal kompetensi, dan penilaian sumatif pada akhir tahun ajaran sebagai gambaran capaian kinerja secara utuh. <br><br>
Laporan ini disusun sebagai dokumentasi resmi pelaksanaan PKG pada ${obj} untuk Tahun Pelajaran ${tahunAkademik()}. Pada periode ini, sebanyak <strong>${summary.total} orang guru</strong> menjadi sasaran penilaian, dengan capaian rata-rata nilai akhir sebesar <strong>${summary.rataRata.toFixed(2)}</strong> yang berada pada kategori <strong>${sebutanByNilai(summary.rataRata)}</strong>. Hasil ini diharapkan dapat memberikan gambaran objektif mengenai profil kompetensi guru, sekaligus menjadi landasan penyusunan program pembinaan yang lebih terarah dan berbasis data.`;
  }

  function narasiTujuan() {
    return `<ol style="margin:0; padding-left:1.5em;">
      <li>Mengukur capaian kompetensi guru pada ranah pedagogik, kepribadian, sosial, dan profesional sesuai standar yang ditetapkan dalam regulasi yang berlaku.</li>
      <li>Mengidentifikasi kekuatan dan area pengembangan setiap guru sebagai dasar penyusunan program Pengembangan Keprofesian Berkelanjutan (PKB).</li>
      <li>Memberikan umpan balik objektif kepada guru, kepala madrasah, dan pengawas dalam rangka peningkatan mutu pembelajaran.</li>
      <li>Menjadi bahan pertimbangan dalam pengambilan keputusan terkait pembinaan, penempatan tugas tambahan, kenaikan pangkat, serta pemberian penghargaan kepada guru.</li>
      <li>Mendokumentasikan pelaksanaan PKG sebagai salah satu indikator kinerja madrasah dan pengawas pembina.</li>
    </ol>`;
  }

  function narasiManfaat() {
    return `<p style="margin:0;">Bagi <strong>guru</strong>, laporan ini menjadi cermin profesional yang menunjukkan kondisi kompetensi pada periode penilaian. Bagi <strong>kepala madrasah</strong>, hasil PKG menjadi bahan pengambilan keputusan dalam pembinaan internal dan distribusi tugas. Bagi <strong>pengawas pembina</strong>, laporan ini menjadi dasar penyusunan program supervisi yang lebih tepat sasaran. Bagi <strong>Kementerian Agama Kabupaten</strong>, agregasi data PKG memberikan gambaran mutu guru madrasah secara wilayah, yang dapat digunakan untuk perencanaan diklat, distribusi sumber daya, dan kebijakan penjaminan mutu pendidikan.</p>`;
  }

  function narasiKonsepPKG() {
    return `<p>Penilaian Kinerja Guru (PKG) adalah proses pengukuran kinerja guru dalam menjalankan tugas pokok dan fungsinya. PKG mengacu pada empat kompetensi utama sebagaimana diatur dalam Undang-Undang Nomor 14 Tahun 2005 tentang Guru dan Dosen, yaitu kompetensi pedagogik, kepribadian, sosial, dan profesional. Bagi guru madrasah, dimensi penilaian diperluas dengan unsur kompetensi keagamaan dan tugas tambahan struktural sebagaimana diatur dalam PMA Nomor 38 Tahun 2018.</p>
    <p>PKG dilaksanakan oleh asesor terlatih, umumnya kepala madrasah dan pengawas pembina, dengan menggunakan instrumen baku yang mencakup observasi pembelajaran, telaah dokumen perencanaan dan penilaian, wawancara, serta studi dokumentasi. Skor pada setiap indikator kemudian diolah menjadi nilai akhir per kompetensi dan nilai akhir keseluruhan, dengan kategori sebutan: Amat Baik (&gt;90), Baik (&gt;75), Cukup (&gt;60), Sedang (&gt;50), dan Kurang (≤50).</p>`;
  }

  function narasiHasilPenilaian(data) {
    const s = data.summary;
    const persen = (k) => s.total ? ((s.sebutanCount[k] || 0) / s.total * 100).toFixed(1) : '0.0';
    return `<p>Hasil penilaian kinerja guru pada periode ini menunjukkan rata-rata nilai akhir sebesar <strong>${s.rataRata.toFixed(2)}</strong> dengan kategori <strong>${sebutanByNilai(s.rataRata)}</strong>. Dari ${s.total} orang guru sasaran, sebanyak ${s.dinilai} orang telah menyelesaikan penilaian, sedangkan ${s.belum} orang belum dinilai pada periode ini.</p>
    <p>Distribusi sebutan menunjukkan pola sebagai berikut: kategori <strong>Amat Baik</strong> sebanyak ${s.sebutanCount['Amat Baik'] || 0} guru (${persen('Amat Baik')}%), <strong>Baik</strong> ${s.sebutanCount['Baik'] || 0} guru (${persen('Baik')}%), <strong>Cukup</strong> ${s.sebutanCount['Cukup'] || 0} guru (${persen('Cukup')}%), <strong>Sedang</strong> ${s.sebutanCount['Sedang'] || 0} guru (${persen('Sedang')}%), dan <strong>Kurang</strong> ${s.sebutanCount['Kurang'] || 0} guru (${persen('Kurang')}%). Sebaran ini memberikan informasi awal tentang area mana yang membutuhkan pembinaan intensif dan area mana yang sudah dapat menjadi rujukan praktik baik (best practice) di lingkungan internal.</p>`;
  }

  function narasiKesimpulan(data, scope, scopeValue) {
    const s = data.summary;
    const sebutan = sebutanByNilai(s.rataRata);
    return `<p>Berdasarkan hasil penilaian kinerja guru pada ${e(scope === 'madrasah' ? 'Madrasah ' + scopeValue : scope === 'kkm' ? 'KKM ' + scopeValue : 'Kabupaten ' + scopeValue)} periode Tahun Pelajaran ${tahunAkademik()}, dapat disimpulkan beberapa hal berikut:</p>
    <ol>
      <li>Capaian rata-rata nilai akhir guru sebesar <strong>${s.rataRata.toFixed(2)}</strong> berada pada kategori <strong>${sebutan}</strong>.</li>
      <li>Dari ${s.total} guru sasaran, ${s.dinilai} guru (${s.total ? (s.dinilai / s.total * 100).toFixed(1) : '0.0'}%) telah diselesaikan penilaiannya, sementara ${s.belum} guru belum tuntas dinilai.</li>
      <li>Sebagian besar guru berada pada kategori ${[...Object.entries(s.sebutanCount)].filter(([k]) => k !== 'Belum dinilai').sort((a, b) => b[1] - a[1])[0][0]}, yang menunjukkan profil kompetensi kolektif pada periode ini.</li>
    </ol>`;
  }

  function narasiRekomendasi(data) {
    return `<ol>
      <li>Bagi guru dengan kategori <strong>Amat Baik</strong> dan <strong>Baik</strong>: pertahankan praktik pembelajaran berkualitas dan dorong untuk berperan sebagai mentor sejawat melalui program mentoring internal madrasah.</li>
      <li>Bagi guru dengan kategori <strong>Cukup</strong>: sertakan dalam program pendampingan terjadwal dengan fokus pada kompetensi yang skornya masih rendah, dengan pendekatan in-house training atau coaching klinis.</li>
      <li>Bagi guru dengan kategori <strong>Sedang</strong> dan <strong>Kurang</strong>: prioritaskan untuk mengikuti diklat kompetensi sesuai area lemah, dengan pemantauan tindak lanjut secara berkala oleh kepala madrasah dan pengawas pembina.</li>
      <li>Lakukan evaluasi distribusi tugas mengajar dan tugas tambahan agar selaras dengan profil kompetensi masing-masing guru.</li>
      <li>Selesaikan proses PKG bagi guru yang belum dinilai pada periode berikutnya, agar data agregat kompetensi madrasah/wilayah lebih representatif.</li>
    </ol>`;
  }

  // === RENDER HTML A4 ================================================
  function renderTabelHasilPerGuru(rows) {
    if (!rows.length) return `<p><em>Tidak ada data guru pada scope ini.</em></p>`;
    let html = `<table class="tbl"><thead><tr>
      <th style="width:30px;">No</th>
      <th>Nama Guru</th>
      <th>NIP</th>
      <th>Madrasah</th>
      <th>Peran/Tugas</th>
      <th style="width:60px;">Nilai</th>
      <th style="width:90px;">Sebutan</th>
    </tr></thead><tbody>`;
    rows.forEach((r, i) => {
      html += `<tr>
        <td style="text-align:center;">${i + 1}</td>
        <td>${e(r.guru.nama || '-')}</td>
        <td>${e(r.guru.nip || '-')}</td>
        <td>${e(r.guru.nama_madrasah || '-')}</td>
        <td>${e(r.role_label || '-')}</td>
        <td style="text-align:right;">${r.nilai != null ? r.nilai.toFixed(2) : '-'}</td>
        <td style="text-align:center;">${e(r.sebutan)}</td>
      </tr>`;
    });
    html += `</tbody></table>`;
    return html;
  }

  function renderTabelPerKomp(perKomp) {
    if (!perKomp.length) return `<p><em>Belum ada data skor terisi.</em></p>`;
    // Group by role
    const byRole = {};
    for (const k of perKomp) {
      const key = k.role_label || k.role || '-';
      if (!byRole[key]) byRole[key] = [];
      byRole[key].push(k);
    }
    let html = '';
    for (const role of Object.keys(byRole)) {
      html += `<div class="komp-block"><strong>${e(role)}</strong>`;
      html += `<table class="tbl"><thead><tr>
        <th style="width:30px;">No</th>
        <th>Kompetensi</th>
        <th style="width:80px;">Rata-rata (%)</th>
        <th style="width:90px;">Sebutan</th>
      </tr></thead><tbody>`;
      byRole[role].forEach(k => {
        html += `<tr>
          <td style="text-align:center;">${k.no}</td>
          <td>${e(k.nama || '-')}</td>
          <td style="text-align:right;">${k.rataPct.toFixed(2)}</td>
          <td style="text-align:center;">${e(sebutanByNilai(k.rataPct))}</td>
        </tr>`;
      });
      html += `</tbody></table></div>`;
    }
    return html;
  }

  function renderDistribusi(s) {
    const persen = (k) => s.total ? ((s.sebutanCount[k] || 0) / s.total * 100).toFixed(1) : '0.0';
    return `<table class="tbl"><thead><tr>
      <th>Kategori Sebutan</th>
      <th style="width:80px;">Jumlah</th>
      <th style="width:80px;">Persen</th>
    </tr></thead><tbody>
      <tr><td>Amat Baik (&gt;90)</td><td style="text-align:right;">${s.sebutanCount['Amat Baik'] || 0}</td><td style="text-align:right;">${persen('Amat Baik')}%</td></tr>
      <tr><td>Baik (&gt;75 - 90)</td><td style="text-align:right;">${s.sebutanCount['Baik'] || 0}</td><td style="text-align:right;">${persen('Baik')}%</td></tr>
      <tr><td>Cukup (&gt;60 - 75)</td><td style="text-align:right;">${s.sebutanCount['Cukup'] || 0}</td><td style="text-align:right;">${persen('Cukup')}%</td></tr>
      <tr><td>Sedang (&gt;50 - 60)</td><td style="text-align:right;">${s.sebutanCount['Sedang'] || 0}</td><td style="text-align:right;">${persen('Sedang')}%</td></tr>
      <tr><td>Kurang (≤50)</td><td style="text-align:right;">${s.sebutanCount['Kurang'] || 0}</td><td style="text-align:right;">${persen('Kurang')}%</td></tr>
      <tr style="background:#f5f5f5;"><td>Belum dinilai</td><td style="text-align:right;">${s.sebutanCount['Belum dinilai'] || 0}</td><td style="text-align:right;">${persen('Belum dinilai')}%</td></tr>
      <tr style="background:#e8f5e9; font-weight:600;"><td>TOTAL</td><td style="text-align:right;">${s.total}</td><td style="text-align:right;">100.0%</td></tr>
    </tbody></table>`;
  }

  // Build daftar isi otomatis dari sections
  function renderDaftarIsi(sections) {
    let html = `<h2 style="text-align:center;">DAFTAR ISI</h2><table class="toc">`;
    sections.forEach(s => {
      html += `<tr><td>${e(s.label)}</td><td style="text-align:right;">${e(s.page || '...')}</td></tr>`;
    });
    html += `</table>`;
    return html;
  }

  // === HALAMAN PENGESAHAN ============================================
  function renderPengesahanMadrasah(opts) {
    // opts: { nama_madrasah, nama_kamad, nip_kamad, nama_pengawas, nip_pengawas, kota, tanggal }
    const tgl = opts.tanggal || fmtTanggalID(new Date());
    return `<div class="page-break"></div>
    <h2 style="text-align:center; letter-spacing:2px;">HALAMAN PENGESAHAN</h2>
    <p style="text-align:center; margin-top:1em;">Laporan Penilaian Kinerja Guru (PKG)<br>
    <strong>${e(opts.nama_madrasah || '-')}</strong><br>
    Tahun Pelajaran ${tahunAkademik()}</p>
    <p style="margin-top:2.5em;">Telah diperiksa dan disahkan untuk digunakan sebagai dokumen resmi pelaksanaan Penilaian Kinerja Guru pada satuan pendidikan tersebut di atas.</p>
    <p style="text-align:right; margin-top:1.5em;">${e(opts.kota || 'Jember')}, ${e(tgl)}</p>
    <table style="width:100%; margin-top:1em; border:0;"><tr>
      <td style="width:50%; vertical-align:top; text-align:center;">
        <div>Mengetahui,<br><strong>Pengawas Madrasah</strong></div>
        <div style="height:90px;"></div>
        <div><strong><u>${e(opts.nama_pengawas || '....................')}</u></strong></div>
        <div>NIP. ${e(opts.nip_pengawas || '....................')}</div>
      </td>
      <td style="width:50%; vertical-align:top; text-align:center;">
        <div><strong>Kepala Madrasah</strong></div>
        <div style="height:90px;"></div>
        <div><strong><u>${e(opts.nama_kamad || '....................')}</u></strong></div>
        <div>NIP. ${e(opts.nip_kamad || '....................')}</div>
      </td>
    </tr></table>`;
  }

  function renderPengesahanKKM(opts) {
    // opts: { nama_kkm, nama_pengawas, nip_pengawas, kota, tanggal }
    const tgl = opts.tanggal || fmtTanggalID(new Date());
    return `<div class="page-break"></div>
    <h2 style="text-align:center; letter-spacing:2px;">HALAMAN PENGESAHAN</h2>
    <p style="text-align:center; margin-top:1em;">Laporan Penilaian Kinerja Guru (PKG)<br>
    <strong>Kelompok Kerja Madrasah (KKM) ${e(opts.nama_kkm || '-')}</strong><br>
    Tahun Pelajaran ${tahunAkademik()}</p>
    <p style="margin-top:2.5em;">Telah diperiksa dan disahkan untuk digunakan sebagai dokumen resmi pelaksanaan Penilaian Kinerja Guru pada wilayah binaan tersebut di atas.</p>
    <p style="text-align:right; margin-top:1.5em;">${e(opts.kota || 'Jember')}, ${e(tgl)}</p>
    <table style="width:100%; margin-top:1em; border:0;"><tr>
      <td style="width:50%; vertical-align:top; text-align:center;">
        <div>Mengetahui,<br><strong>Ketua Pokjawas Madrasah</strong><br>${e(KEMENAG.kabupaten)}</div>
        <div style="height:90px;"></div>
        <div><strong><u>${e(POKJAWAS.nama)}</u></strong></div>
        <div>NIP. ${e(POKJAWAS.nip)}</div>
      </td>
      <td style="width:50%; vertical-align:top; text-align:center;">
        <div><strong>Pengawas Madrasah</strong></div>
        <div style="height:90px;"></div>
        <div><strong><u>${e(opts.nama_pengawas || '....................')}</u></strong></div>
        <div>NIP. ${e(opts.nip_pengawas || '....................')}</div>
      </td>
    </tr></table>`;
  }

  // === COVER & KATA PENGANTAR ========================================
  function renderCoverMadrasah(opts) {
    return `<div class="cover">
      <div style="text-align:center; padding-top:2em;">
        <h1 style="margin:0; letter-spacing:3px;">LAPORAN</h1>
        <h1 style="margin:0; letter-spacing:3px;">PENILAIAN KINERJA GURU</h1>
        <h2 style="margin-top:0.5em;">(PKG)</h2>
      </div>
      <div style="text-align:center; margin-top:2.5em;">
        <p>Tahun Pelajaran ${tahunAkademik()}</p>
      </div>
      <div style="text-align:center; margin-top:5em;">
        <div style="width:140px; height:140px; border:2px solid #555; border-radius:50%; display:inline-block; line-height:140px;">LOGO</div>
      </div>
      <div style="text-align:center; margin-top:3em; font-size:1.1em;">
        <strong>${e(opts.nama_madrasah || 'NAMA MADRASAH')}</strong><br>
        ${e(opts.alamat_madrasah || '')}
      </div>
      <div style="text-align:center; margin-top:auto; padding-bottom:2em;">
        <strong>${e(KEMENAG.instansi)}</strong><br>
        <strong>${e(KEMENAG.kabupaten)}</strong><br>
        <strong>${e(KEMENAG.provinsi)}</strong><br>
        <strong>TAHUN ${TAHUN_DEFAULT}</strong>
      </div>
    </div>`;
  }

  function renderCoverKKM(opts) {
    return `<div class="cover">
      <div style="text-align:center; padding-top:2em;">
        <h1 style="margin:0; letter-spacing:3px;">LAPORAN</h1>
        <h1 style="margin:0; letter-spacing:3px;">PENILAIAN KINERJA GURU</h1>
        <h2 style="margin-top:0.5em;">(PKG)</h2>
        <p style="margin-top:0.5em; font-style:italic;">Tingkat Kelompok Kerja Madrasah</p>
      </div>
      <div style="text-align:center; margin-top:2em;">
        <p>Tahun Pelajaran ${tahunAkademik()}</p>
      </div>
      <div style="text-align:center; margin-top:5em;">
        <div style="width:140px; height:140px; border:2px solid #555; border-radius:50%; display:inline-block; line-height:140px;">LOGO</div>
      </div>
      <div style="text-align:center; margin-top:3em; font-size:1.1em;">
        <strong>KKM ${e(opts.nama_kkm || 'NAMA KKM')}</strong><br>
        ${e(opts.wilayah || KEMENAG.kabupaten)}
      </div>
      <div style="text-align:center; margin-top:auto; padding-bottom:2em;">
        <strong>${e(KEMENAG.instansi)}</strong><br>
        <strong>${e(KEMENAG.kabupaten)}</strong><br>
        <strong>${e(KEMENAG.provinsi)}</strong><br>
        <strong>TAHUN ${TAHUN_DEFAULT}</strong>
      </div>
    </div>`;
  }

  function renderKataPengantar(scope, scopeValue) {
    const obj = scope === 'madrasah' ? `Madrasah ${scopeValue}` :
                scope === 'kkm' ? `KKM ${scopeValue}` :
                `Kabupaten ${scopeValue}`;
    const penyusun = scope === 'madrasah' ? 'Kepala Madrasah' : 'Pengawas Madrasah';
    return `<div class="page-break"></div>
    <h2 style="text-align:center; letter-spacing:2px;">KATA PENGANTAR</h2>
    <p style="text-indent:2em;">Puji syukur kami panjatkan ke hadirat Allah SWT yang telah melimpahkan rahmat dan hidayah-Nya, sehingga penyusunan Laporan Penilaian Kinerja Guru (PKG) pada ${e(obj)} Tahun Pelajaran ${tahunAkademik()} dapat diselesaikan dengan baik. Shalawat serta salam senantiasa tercurah kepada Nabi Muhammad SAW beserta keluarga, sahabat, dan pengikutnya.</p>
    <p style="text-indent:2em;">Laporan ini disusun sebagai bentuk pertanggungjawaban pelaksanaan Penilaian Kinerja Guru sebagaimana diamanatkan dalam Peraturan Menteri Agama Nomor 38 Tahun 2018. Penyusunan laporan ini bertujuan memberikan gambaran objektif terhadap profil kompetensi guru, sekaligus menjadi dasar pembinaan dan pengembangan keprofesian berkelanjutan.</p>
    <p style="text-indent:2em;">Kami menyampaikan terima kasih kepada seluruh pihak yang telah berkontribusi dalam pelaksanaan PKG, terutama kepada para guru sebagai sasaran penilaian, asesor, kepala madrasah, pengawas pembina, serta jajaran Kementerian Agama yang memberikan dukungan teknis maupun administratif.</p>
    <p style="text-indent:2em;">Kami menyadari laporan ini masih jauh dari sempurna. Oleh karena itu, kritik dan saran konstruktif sangat kami harapkan demi penyempurnaan pelaksanaan PKG pada periode-periode berikutnya. Semoga laporan ini bermanfaat dan dapat menjadi rujukan dalam upaya peningkatan mutu pendidikan madrasah.</p>
    <p style="text-align:right; margin-top:2em;">Jember, ${fmtTanggalID(new Date())}</p>
    <p style="text-align:right;">${e(penyusun)},</p>`;
  }

  // === LANDASAN HUKUM ================================================
  function renderLandasanHukum(items) {
    items = items || LANDASAN_HUKUM_DEFAULT;
    let html = `<ol>`;
    for (const x of items) html += `<li>${e(x)}</li>`;
    html += `</ol>`;
    return html;
  }

  // === FULL HTML ASSEMBLER ===========================================
  function buildLaporanMadrasahHTML(scopeValue, opts) {
    const data = getPenilaianGuruAtScope('madrasah', scopeValue);
    const k = (opts.kamad || {});
    const cover = renderCoverMadrasah({ nama_madrasah: scopeValue, alamat_madrasah: k.alamat_madrasah });
    const kataPengantar = renderKataPengantar('madrasah', scopeValue);
    const sectionsForToc = [
      { label: 'KATA PENGANTAR', page: 'i' },
      { label: 'DAFTAR ISI', page: 'ii' },
      { label: 'HALAMAN PENGESAHAN', page: 'iii' },
      { label: 'BAB I PENDAHULUAN', page: '1' },
      { label: '   1.1 Latar Belakang', page: '1' },
      { label: '   1.2 Dasar Hukum', page: '2' },
      { label: '   1.3 Tujuan', page: '3' },
      { label: '   1.4 Manfaat', page: '3' },
      { label: '   1.5 Ruang Lingkup', page: '4' },
      { label: 'BAB II LANDASAN TEORI', page: '5' },
      { label: 'BAB III PROFIL MADRASAH', page: '7' },
      { label: 'BAB IV HASIL PENILAIAN', page: '9' },
      { label: 'BAB V PENUTUP', page: '15' },
      { label: 'LAMPIRAN', page: '17' },
    ];
    const daftarIsi = renderDaftarIsi(sectionsForToc);
    const pengesahan = renderPengesahanMadrasah({
      nama_madrasah: scopeValue,
      nama_kamad: k.nama || opts.nama_kamad,
      nip_kamad: k.nip || opts.nip_kamad,
      nama_pengawas: opts.nama_pengawas,
      nip_pengawas: opts.nip_pengawas,
      kota: opts.kota || 'Jember',
      tanggal: opts.tanggal,
    });
    const ruangLingkup = `<p>Laporan ini mencakup pelaksanaan Penilaian Kinerja Guru pada ${e(scopeValue)} untuk Tahun Pelajaran ${tahunAkademik()} semester ${semesterAktif()}, meliputi seluruh guru sasaran sebanyak ${data.summary.total} orang dengan beragam peran dan tugas tambahan.</p>`;
    const profilMadrasah = `
      <table class="tbl">
        <tr><td style="width:200px;">Nama Madrasah</td><td>: ${e(scopeValue)}</td></tr>
        <tr><td>Alamat</td><td>: ${e(k.alamat_madrasah || '....................')}</td></tr>
        <tr><td>Kepala Madrasah</td><td>: ${e(k.nama || opts.nama_kamad || '....................')}</td></tr>
        <tr><td>NIP Kepala Madrasah</td><td>: ${e(k.nip || opts.nip_kamad || '-')}</td></tr>
        <tr><td>Jenjang</td><td>: ${e(k.jenjang || '-')}</td></tr>
        <tr><td>Jumlah Guru Sasaran</td><td>: ${data.summary.total} orang</td></tr>
        <tr><td>Sudah Dinilai</td><td>: ${data.summary.dinilai} orang</td></tr>
        <tr><td>Belum Dinilai</td><td>: ${data.summary.belum} orang</td></tr>
      </table>`;

    const bab4 = `
      <h3>4.1 Rekapitulasi Hasil Penilaian per Guru</h3>
      ${renderTabelHasilPerGuru(data.rows)}
      <h3 style="margin-top:1em;">4.2 Distribusi Sebutan</h3>
      ${renderDistribusi(data.summary)}
      <h3 style="margin-top:1em;">4.3 Analisis per Kompetensi</h3>
      ${renderTabelPerKomp(data.perKomp)}
      <h3 style="margin-top:1em;">4.4 Pembahasan</h3>
      ${narasiHasilPenilaian(data)}
    `;

    const bab5 = `
      <h3>5.1 Kesimpulan</h3>
      ${narasiKesimpulan(data, 'madrasah', scopeValue)}
      <h3>5.2 Rekomendasi</h3>
      ${narasiRekomendasi(data)}
      <h3>5.3 Tindak Lanjut</h3>
      <p>Tindak lanjut hasil PKG akan diintegrasikan dengan program Pengembangan Keprofesian Berkelanjutan (PKB) tahun berjalan, supervisi akademik oleh kepala madrasah dan pengawas pembina, serta evaluasi distribusi tugas mengajar dan tugas tambahan.</p>
    `;

    const body = `
      ${cover}
      <div class="page-break"></div>
      ${kataPengantar}
      <div class="page-break"></div>
      ${daftarIsi}
      ${pengesahan}
      <div class="page-break"></div>
      <h2>BAB I PENDAHULUAN</h2>
      <h3>1.1 Latar Belakang</h3>
      <p>${narasiLatarBelakang('madrasah', scopeValue, data.summary)}</p>
      <h3>1.2 Dasar Hukum</h3>
      ${renderLandasanHukum(opts.landasan_hukum)}
      <h3>1.3 Tujuan</h3>
      ${narasiTujuan()}
      <h3>1.4 Manfaat</h3>
      ${narasiManfaat()}
      <h3>1.5 Ruang Lingkup</h3>
      ${ruangLingkup}
      <div class="page-break"></div>
      <h2>BAB II LANDASAN TEORI</h2>
      <h3>2.1 Konsep Penilaian Kinerja Guru</h3>
      ${narasiKonsepPKG()}
      <h3>2.2 Indikator Kinerja Guru</h3>
      <p>Indikator kinerja guru pada laporan ini mengacu pada instrumen baku PKG sebagaimana diatur dalam SK Dirjen Pendis Nomor 6673 Tahun 2019. Setiap peran (Guru Mapel, Guru BK, Guru TIK, Pustakawan, Laboran, Wakil Kepala) memiliki kompetensi dan indikator yang berbeda dengan rentang skor 0-2 atau 0-4.</p>
      <h3>2.3 Kategori Sebutan</h3>
      <p>Nilai akhir PKG dikategorikan dalam lima sebutan: <strong>Amat Baik</strong> (&gt;90), <strong>Baik</strong> (&gt;75), <strong>Cukup</strong> (&gt;60), <strong>Sedang</strong> (&gt;50), dan <strong>Kurang</strong> (≤50). Kategori ini menjadi dasar pengambilan keputusan dalam pembinaan, pengembangan karir, dan penghargaan guru.</p>
      <div class="page-break"></div>
      <h2>BAB III PROFIL MADRASAH</h2>
      <h3>3.1 Identitas Madrasah</h3>
      ${profilMadrasah}
      <div class="page-break"></div>
      <h2>BAB IV HASIL PENILAIAN</h2>
      ${bab4}
      <div class="page-break"></div>
      <h2>BAB V PENUTUP</h2>
      ${bab5}
      <div class="page-break"></div>
      <h2>LAMPIRAN</h2>
      <h3>Lampiran 1. Data Mentah Skor Indikator</h3>
      <p><em>Data lengkap skor per indikator tersedia pada aplikasi PKG dan dapat di-export terpisah melalui menu Rekap.</em></p>
    `;
    return wrapHTMLPrintable(body, `Laporan PKG ${scopeValue}`);
  }

  function buildLaporanKKMHTML(scopeValue, opts) {
    const data = getPenilaianGuruAtScope('kkm', scopeValue);
    const cover = renderCoverKKM({ nama_kkm: scopeValue, wilayah: opts.wilayah });
    const kataPengantar = renderKataPengantar('kkm', scopeValue);
    const sectionsForToc = [
      { label: 'KATA PENGANTAR', page: 'i' },
      { label: 'DAFTAR ISI', page: 'ii' },
      { label: 'HALAMAN PENGESAHAN', page: 'iii' },
      { label: 'BAB I PENDAHULUAN', page: '1' },
      { label: 'BAB II LANDASAN TEORI', page: '5' },
      { label: 'BAB III PROFIL KKM', page: '7' },
      { label: 'BAB IV HASIL PENILAIAN', page: '9' },
      { label: 'BAB V PENUTUP', page: '15' },
      { label: 'LAMPIRAN', page: '17' },
    ];
    const daftarIsi = renderDaftarIsi(sectionsForToc);
    const pengesahan = renderPengesahanKKM({
      nama_kkm: scopeValue,
      nama_pengawas: opts.nama_pengawas,
      nip_pengawas: opts.nip_pengawas,
      kota: opts.kota || 'Jember',
      tanggal: opts.tanggal,
    });
    const profilKKM = `
      <table class="tbl">
        <tr><td style="width:200px;">Nama KKM</td><td>: ${e(scopeValue)}</td></tr>
        <tr><td>Wilayah</td><td>: ${e(opts.wilayah || KEMENAG.kabupaten)}</td></tr>
        <tr><td>Pengawas Pembina</td><td>: ${e(opts.nama_pengawas || '....................')}</td></tr>
        <tr><td>NIP Pengawas</td><td>: ${e(opts.nip_pengawas || '-')}</td></tr>
        <tr><td>Jumlah Madrasah</td><td>: ${data.summary.madrasahCount} unit</td></tr>
        <tr><td>Jumlah Guru Sasaran</td><td>: ${data.summary.total} orang</td></tr>
        <tr><td>Sudah Dinilai</td><td>: ${data.summary.dinilai} orang</td></tr>
        <tr><td>Belum Dinilai</td><td>: ${data.summary.belum} orang</td></tr>
      </table>
      <h3 style="margin-top:1em;">Daftar Madrasah dalam KKM</h3>
      <ol>${data.summary.madrasahList.map(m => `<li>${e(m)}</li>`).join('')}</ol>
    `;

    const bab4 = `
      <h3>4.1 Rekapitulasi Hasil Penilaian per Guru</h3>
      ${renderTabelHasilPerGuru(data.rows)}
      <h3 style="margin-top:1em;">4.2 Distribusi Sebutan Tingkat KKM</h3>
      ${renderDistribusi(data.summary)}
      <h3 style="margin-top:1em;">4.3 Analisis per Kompetensi (Agregat KKM)</h3>
      ${renderTabelPerKomp(data.perKomp)}
      <h3 style="margin-top:1em;">4.4 Pembahasan</h3>
      ${narasiHasilPenilaian(data)}
    `;

    const bab5 = `
      <h3>5.1 Kesimpulan</h3>
      ${narasiKesimpulan(data, 'kkm', scopeValue)}
      <h3>5.2 Rekomendasi</h3>
      ${narasiRekomendasi(data)}
      <h3>5.3 Tindak Lanjut</h3>
      <p>Tindak lanjut hasil PKG tingkat KKM akan dikoordinasikan melalui rapat KKM, program PKB kolektif (in-house training, MGMP, KKG), dan supervisi terjadwal oleh pengawas pembina dengan dukungan Pokjawas Kabupaten.</p>
    `;

    const body = `
      ${cover}
      <div class="page-break"></div>
      ${kataPengantar}
      <div class="page-break"></div>
      ${daftarIsi}
      ${pengesahan}
      <div class="page-break"></div>
      <h2>BAB I PENDAHULUAN</h2>
      <h3>1.1 Latar Belakang</h3>
      <p>${narasiLatarBelakang('kkm', scopeValue, data.summary)}</p>
      <h3>1.2 Dasar Hukum</h3>
      ${renderLandasanHukum(opts.landasan_hukum)}
      <h3>1.3 Tujuan</h3>
      ${narasiTujuan()}
      <h3>1.4 Manfaat</h3>
      ${narasiManfaat()}
      <h3>1.5 Ruang Lingkup</h3>
      <p>Laporan ini mencakup pelaksanaan Penilaian Kinerja Guru pada ${data.summary.madrasahCount} madrasah anggota KKM ${e(scopeValue)} dengan total ${data.summary.total} guru sasaran untuk Tahun Pelajaran ${tahunAkademik()}.</p>
      <div class="page-break"></div>
      <h2>BAB II LANDASAN TEORI</h2>
      <h3>2.1 Konsep Penilaian Kinerja Guru</h3>
      ${narasiKonsepPKG()}
      <h3>2.2 Peran KKM dalam Penjaminan Mutu</h3>
      <p>Kelompok Kerja Madrasah (KKM) berperan sebagai wahana koordinasi, kolaborasi, dan peningkatan mutu antar madrasah dalam satu wilayah binaan. Melalui KKM, kepala madrasah, guru, dan pengawas dapat berbagi praktik baik, menyusun program PKB kolektif, serta memetakan profil mutu wilayah secara berkala.</p>
      <div class="page-break"></div>
      <h2>BAB III PROFIL KKM</h2>
      ${profilKKM}
      <div class="page-break"></div>
      <h2>BAB IV HASIL PENILAIAN</h2>
      ${bab4}
      <div class="page-break"></div>
      <h2>BAB V PENUTUP</h2>
      ${bab5}
      <div class="page-break"></div>
      <h2>LAMPIRAN</h2>
      <h3>Lampiran 1. Data Mentah Skor Indikator</h3>
      <p><em>Data lengkap skor per indikator tersedia pada aplikasi PKG dan dapat di-export terpisah melalui menu Rekap.</em></p>
    `;
    return wrapHTMLPrintable(body, `Laporan PKG KKM ${scopeValue}`);
  }

  function wrapHTMLPrintable(body, title) {
    return `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${e(title)}</title>
    <style>
      @page { size: A4; margin: 2.5cm 2cm 2cm 3cm; }
      body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color:#222; }
      h1, h2, h3 { page-break-after: avoid; }
      h2 { font-size: 14pt; margin-top: 1.5em; text-transform: uppercase; }
      h3 { font-size: 12pt; margin-top: 1em; }
      .cover { min-height: 24cm; display:flex; flex-direction:column; }
      .page-break { page-break-before: always; }
      .tbl { width:100%; border-collapse: collapse; margin: 0.5em 0; }
      .tbl th, .tbl td { border: 1px solid #888; padding: 5px 7px; vertical-align: top; }
      .tbl th { background:#f0f0f0; font-weight: 600; }
      .toc { width:100%; }
      .toc td { padding: 3px 0; border-bottom: 1px dotted #ccc; }
      .komp-block { margin-bottom: 1em; }
      ol, ul { padding-left: 1.5em; }
      p { text-align: justify; margin: 0 0 0.6em 0; }
      @media screen { body { background:#f5f5f5; } .doc { max-width: 21cm; margin: 1em auto; padding: 2.5cm 2cm 2cm 3cm; background:#fff; box-shadow: 0 2px 12px rgba(0,0,0,.12); } }
      @media print { .doc { max-width: none; padding: 0; } .no-print { display: none; } }
    </style></head><body>
    <div class="no-print" style="text-align:right; padding:8px; background:#fff; border-bottom:1px solid #ddd;">
      <button onclick="window.print()" style="padding:6px 14px; background:#047a3a; color:#fff; border:0; border-radius:4px; cursor:pointer;">🖨️ Cetak / Simpan PDF</button>
      <button onclick="window.close()" style="padding:6px 14px; background:#888; color:#fff; border:0; border-radius:4px; cursor:pointer; margin-left:6px;">Tutup</button>
    </div>
    <div class="doc">${body}</div>
    </body></html>`;
  }

  // === BUKA HTML DI TAB BARU =========================================
  function bukaTabHTML(html, judul) {
    const w = window.open('', '_blank');
    if (!w) {
      alert('Pop-up diblokir browser. Izinkan pop-up untuk situs ini agar laporan bisa dibuka.');
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    if (judul) w.document.title = judul;
  }

  // === DOCX (sederhana, mengikuti struktur yang sama) ================
  async function downloadDOCXMadrasah(scopeValue, opts) {
    const data = getPenilaianGuruAtScope('madrasah', scopeValue);
    const blob = await buildDOCX('madrasah', scopeValue, data, opts);
    saveBlob(blob, `Laporan_PKG_${slugify(scopeValue)}_${tahunAkademik().replace('/','-')}.docx`);
  }

  async function downloadDOCXKKM(scopeValue, opts) {
    const data = getPenilaianGuruAtScope('kkm', scopeValue);
    const blob = await buildDOCX('kkm', scopeValue, data, opts);
    saveBlob(blob, `Laporan_PKG_KKM_${slugify(scopeValue)}_${tahunAkademik().replace('/','-')}.docx`);
  }

  function slugify(s) {
    return String(s || 'laporan').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
  }

  function saveBlob(blob, filename) {
    if (window.saveAs) { window.saveAs(blob, filename); return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 200);
  }

  async function buildDOCX(scope, scopeValue, data, opts) {
    if (!window.docx) {
      throw new Error('Library docx belum siap. Pastikan koneksi internet aktif (CDN), kemudian refresh halaman.');
    }
    const D = window.docx;
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, PageBreak } = D;

    const center = AlignmentType.CENTER;
    const justify = AlignmentType.JUSTIFIED;
    const right = AlignmentType.RIGHT;

    const P = (text, optsP) => new Paragraph({
      alignment: optsP && optsP.align,
      spacing: { after: 120 },
      children: [new TextRun({ text: String(text || ''), bold: !!(optsP && optsP.bold), size: optsP && optsP.size, break: optsP && optsP.break })],
    });
    const H = (text, level) => new Paragraph({
      heading: level || HeadingLevel.HEADING_1,
      alignment: center,
      children: [new TextRun({ text, bold: true })],
    });
    const PB = () => new Paragraph({ children: [new PageBreak()] });

    function tableSimpleRows(rows) {
      const tableRows = rows.map((cells) => new TableRow({
        children: cells.map(c => new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: String(c || ''), size: 20 })] })],
          borders: tblBorder(),
        })),
      }));
      return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows });
    }
    function tblBorder() {
      const b = { style: BorderStyle.SINGLE, size: 4, color: '888888' };
      return { top: b, bottom: b, left: b, right: b };
    }

    // Cover
    const cover = [
      P('LAPORAN', { align: center, bold: true, size: 36 }),
      P('PENILAIAN KINERJA GURU (PKG)', { align: center, bold: true, size: 32 }),
      P('', {}),
      P(`Tahun Pelajaran ${tahunAkademik()}`, { align: center }),
      P('', {}), P('', {}), P('', {}),
      P(scope === 'madrasah' ? scopeValue : `KKM ${scopeValue}`, { align: center, bold: true, size: 28 }),
      P('', {}), P('', {}),
      P(KEMENAG.instansi, { align: center, bold: true }),
      P(KEMENAG.kabupaten, { align: center, bold: true }),
      P(KEMENAG.provinsi, { align: center, bold: true }),
      P(`TAHUN ${TAHUN_DEFAULT}`, { align: center, bold: true }),
      PB(),
    ];

    // Kata pengantar
    const obj = scope === 'madrasah' ? `Madrasah ${scopeValue}` : `KKM ${scopeValue}`;
    const kataPengantar = [
      H('KATA PENGANTAR'),
      P(`Puji syukur kami panjatkan ke hadirat Allah SWT yang telah melimpahkan rahmat dan hidayah-Nya, sehingga penyusunan Laporan Penilaian Kinerja Guru (PKG) pada ${obj} Tahun Pelajaran ${tahunAkademik()} dapat diselesaikan dengan baik.`, { align: justify }),
      P('Laporan ini disusun sebagai bentuk pertanggungjawaban pelaksanaan Penilaian Kinerja Guru sebagaimana diamanatkan dalam Peraturan Menteri Agama Nomor 38 Tahun 2018, sekaligus menjadi dasar pembinaan dan pengembangan keprofesian berkelanjutan.', { align: justify }),
      P('Kami menyampaikan terima kasih kepada seluruh pihak yang telah berkontribusi. Kritik dan saran konstruktif sangat kami harapkan demi penyempurnaan pelaksanaan PKG pada periode-periode berikutnya.', { align: justify }),
      P(`Jember, ${fmtTanggalID(new Date())}`, { align: right }),
      P(scope === 'madrasah' ? 'Kepala Madrasah,' : 'Pengawas Madrasah,', { align: right }),
      PB(),
    ];

    // Pengesahan
    let pengesahanRows;
    if (scope === 'madrasah') {
      pengesahanRows = [
        ['Mengetahui,\nPengawas Madrasah', 'Kepala Madrasah'],
        ['', ''], ['', ''], ['', ''],
        [`${opts.nama_pengawas || '....................'}\nNIP. ${opts.nip_pengawas || '....................'}`,
         `${(opts.kamad && opts.kamad.nama) || opts.nama_kamad || '....................'}\nNIP. ${(opts.kamad && opts.kamad.nip) || opts.nip_kamad || '....................'}`],
      ];
    } else {
      pengesahanRows = [
        [`Mengetahui,\nKetua Pokjawas Madrasah\n${KEMENAG.kabupaten}`, 'Pengawas Madrasah'],
        ['', ''], ['', ''], ['', ''],
        [`${POKJAWAS.nama}\nNIP. ${POKJAWAS.nip}`,
         `${opts.nama_pengawas || '....................'}\nNIP. ${opts.nip_pengawas || '....................'}`],
      ];
    }
    const pengesahan = [
      H('HALAMAN PENGESAHAN'),
      P(`Laporan Penilaian Kinerja Guru (PKG)`, { align: center }),
      P(scope === 'madrasah' ? scopeValue : `KKM ${scopeValue}`, { align: center, bold: true }),
      P(`Tahun Pelajaran ${tahunAkademik()}`, { align: center }),
      P('', {}),
      P('Telah diperiksa dan disahkan untuk digunakan sebagai dokumen resmi pelaksanaan Penilaian Kinerja Guru.', { align: justify }),
      P(`Jember, ${fmtTanggalID(new Date())}`, { align: right }),
      tableSimpleRows(pengesahanRows),
      PB(),
    ];

    // Bab I
    const lhItems = (opts.landasan_hukum || LANDASAN_HUKUM_DEFAULT);
    const bab1 = [
      H('BAB I PENDAHULUAN'),
      P('1.1 Latar Belakang', { bold: true }),
      P(stripHtml(narasiLatarBelakang(scope, scopeValue, data.summary)), { align: justify }),
      P('1.2 Dasar Hukum', { bold: true }),
      ...lhItems.map((x, i) => P(`${i + 1}. ${x}`)),
      P('1.3 Tujuan', { bold: true }),
      P(stripHtml(narasiTujuan()), { align: justify }),
      P('1.4 Manfaat', { bold: true }),
      P(stripHtml(narasiManfaat()), { align: justify }),
      PB(),
    ];

    // Bab II
    const bab2 = [
      H('BAB II LANDASAN TEORI'),
      P('2.1 Konsep Penilaian Kinerja Guru', { bold: true }),
      P(stripHtml(narasiKonsepPKG()), { align: justify }),
      P('2.2 Kategori Sebutan', { bold: true }),
      P('Nilai akhir PKG dikategorikan dalam lima sebutan: Amat Baik (>90), Baik (>75), Cukup (>60), Sedang (>50), dan Kurang (≤50).', { align: justify }),
      PB(),
    ];

    // Bab III
    let bab3rows;
    if (scope === 'madrasah') {
      const k = opts.kamad || {};
      bab3rows = [
        ['Nama Madrasah', scopeValue],
        ['Alamat', k.alamat_madrasah || '-'],
        ['Kepala Madrasah', k.nama || opts.nama_kamad || '-'],
        ['NIP Kepala Madrasah', k.nip || opts.nip_kamad || '-'],
        ['Jenjang', k.jenjang || '-'],
        ['Jumlah Guru Sasaran', `${data.summary.total} orang`],
        ['Sudah Dinilai', `${data.summary.dinilai} orang`],
        ['Belum Dinilai', `${data.summary.belum} orang`],
      ];
    } else {
      bab3rows = [
        ['Nama KKM', scopeValue],
        ['Wilayah', opts.wilayah || KEMENAG.kabupaten],
        ['Pengawas Pembina', opts.nama_pengawas || '-'],
        ['NIP Pengawas', opts.nip_pengawas || '-'],
        ['Jumlah Madrasah', `${data.summary.madrasahCount} unit`],
        ['Jumlah Guru Sasaran', `${data.summary.total} orang`],
        ['Sudah Dinilai', `${data.summary.dinilai} orang`],
        ['Belum Dinilai', `${data.summary.belum} orang`],
      ];
    }
    const bab3 = [
      H(scope === 'madrasah' ? 'BAB III PROFIL MADRASAH' : 'BAB III PROFIL KKM'),
      tableSimpleRows(bab3rows),
      PB(),
    ];

    // Bab IV
    const tableHeader = ['No', 'Nama', 'NIP', 'Madrasah', 'Peran', 'Nilai', 'Sebutan'];
    const tableRows = [tableHeader, ...data.rows.map((r, i) => [
      String(i + 1),
      r.guru.nama || '-',
      r.guru.nip || '-',
      r.guru.nama_madrasah || '-',
      r.role_label || '-',
      r.nilai != null ? r.nilai.toFixed(2) : '-',
      r.sebutan,
    ])];
    const distrRows = [
      ['Kategori', 'Jumlah', 'Persen'],
      ['Amat Baik (>90)', String(data.summary.sebutanCount['Amat Baik'] || 0), pct(data.summary, 'Amat Baik')],
      ['Baik (>75)', String(data.summary.sebutanCount['Baik'] || 0), pct(data.summary, 'Baik')],
      ['Cukup (>60)', String(data.summary.sebutanCount['Cukup'] || 0), pct(data.summary, 'Cukup')],
      ['Sedang (>50)', String(data.summary.sebutanCount['Sedang'] || 0), pct(data.summary, 'Sedang')],
      ['Kurang (≤50)', String(data.summary.sebutanCount['Kurang'] || 0), pct(data.summary, 'Kurang')],
      ['Belum dinilai', String(data.summary.sebutanCount['Belum dinilai'] || 0), pct(data.summary, 'Belum dinilai')],
      ['TOTAL', String(data.summary.total), '100.0%'],
    ];
    const bab4 = [
      H('BAB IV HASIL PENILAIAN'),
      P('4.1 Rekapitulasi Hasil Penilaian per Guru', { bold: true }),
      tableSimpleRows(tableRows),
      P('4.2 Distribusi Sebutan', { bold: true }),
      tableSimpleRows(distrRows),
      P('4.3 Pembahasan', { bold: true }),
      P(stripHtml(narasiHasilPenilaian(data)), { align: justify }),
      PB(),
    ];

    // Bab V
    const bab5 = [
      H('BAB V PENUTUP'),
      P('5.1 Kesimpulan', { bold: true }),
      P(stripHtml(narasiKesimpulan(data, scope, scopeValue)), { align: justify }),
      P('5.2 Rekomendasi', { bold: true }),
      P(stripHtml(narasiRekomendasi(data)), { align: justify }),
      P('5.3 Tindak Lanjut', { bold: true }),
      P('Tindak lanjut hasil PKG akan diintegrasikan dengan program PKB tahun berjalan, supervisi akademik, dan evaluasi distribusi tugas mengajar.', { align: justify }),
    ];

    const doc = new Document({
      sections: [{
        properties: { page: { margin: { top: 1440, right: 1134, bottom: 1134, left: 1701 } } },
        children: [
          ...cover, ...kataPengantar, ...pengesahan,
          ...bab1, ...bab2, ...bab3, ...bab4, ...bab5,
        ],
      }],
    });
    return await Packer.toBlob(doc);
  }

  function pct(s, k) {
    if (!s.total) return '0.0%';
    return ((s.sebutanCount[k] || 0) / s.total * 100).toFixed(1) + '%';
  }

  function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  // === VIEW: PICKER MADRASAH =========================================
  function viewLaporanMadrasahPicker(view) {
    const all = window.PKGDB.listGuru('');
    const madrasahMap = {};
    for (const g of all) {
      const m = (g.nama_madrasah || '').trim();
      if (!m) continue;
      if (!madrasahMap[m]) madrasahMap[m] = { count: 0 };
      madrasahMap[m].count++;
    }
    const list = Object.entries(madrasahMap).sort(([a], [b]) => a.localeCompare(b));
    if (list.length === 0) {
      view.innerHTML = `<div class="alert alert-warning"><i class="bi bi-exclamation-triangle"></i> Belum ada data guru. Tambah guru terlebih dahulu di menu <a href="#/guru">Data Guru</a>.</div>`;
      return;
    }
    view.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="mb-0"><i class="bi bi-building"></i> Laporan Madrasah</h4>
    </div>
    <div class="alert alert-info py-2 small"><i class="bi bi-info-circle"></i>
      Pilih madrasah untuk membuka generator laporan PKG (BAB I-V, Halaman Pengesahan, dengan output HTML A4 dan DOCX).
    </div>
    <div class="card">
      <div class="table-responsive">
        <table class="table table-sm table-hover mb-0 align-middle">
          <thead class="table-light"><tr>
            <th style="width:30px;">#</th><th>Nama Madrasah</th>
            <th class="text-center" style="width:80px;">Guru</th>
            <th style="width:160px;"></th>
          </tr></thead>
          <tbody>
            ${list.map(([nama, info], i) => `
              <tr>
                <td>${i + 1}</td>
                <td><strong>${e(nama)}</strong></td>
                <td class="text-center">${info.count}</td>
                <td class="text-end">
                  <a class="btn btn-sm btn-primary" href="#/laporan-madrasah-view/${encodeURIComponent(nama)}">
                    <i class="bi bi-file-earmark-text"></i> Buka
                  </a>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
  }

  function viewLaporanMadrasah(view, scopeValue) {
    if (!scopeValue) { view.innerHTML = `<div class="alert alert-danger">Madrasah tidak dipilih. <a href="#/laporan-madrasah">Kembali</a></div>`; return; }
    // Cari kamad untuk preset
    const kamadList = window.PKGDB.listKamad('');
    const kamad = kamadList.find(k => (k.nama_madrasah || '').trim() === scopeValue.trim()) || null;
    const data = getPenilaianGuruAtScope('madrasah', scopeValue);

    view.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <div>
        <h4 class="mb-0"><i class="bi bi-file-earmark-text"></i> Generator Laporan Madrasah</h4>
        <div class="text-muted small">${e(scopeValue)} &middot; ${data.summary.total} guru</div>
      </div>
      <a class="btn btn-sm btn-outline-secondary" href="#/laporan-madrasah"><i class="bi bi-arrow-left"></i> Kembali</a>
    </div>

    <div class="row g-3">
      <div class="col-lg-6">
        <div class="card">
          <div class="card-header"><i class="bi bi-person-vcard"></i> Identitas Penanda Tangan</div>
          <div class="card-body">
            <div class="mb-2"><label class="form-label small">Nama Kepala Madrasah</label>
              <input id="f-nama-kamad" class="form-control form-control-sm" value="${e(kamad ? kamad.nama : '')}"></div>
            <div class="mb-2"><label class="form-label small">NIP Kepala Madrasah</label>
              <input id="f-nip-kamad" class="form-control form-control-sm" value="${e(kamad ? kamad.nip : '')}"></div>
            <hr>
            <div class="mb-2"><label class="form-label small">Nama Pengawas Madrasah</label>
              <input id="f-nama-peng" class="form-control form-control-sm" value=""></div>
            <div class="mb-2"><label class="form-label small">NIP Pengawas Madrasah</label>
              <input id="f-nip-peng" class="form-control form-control-sm" value=""></div>
            <div class="mb-2"><label class="form-label small">Kota & Tanggal</label>
              <div class="d-flex gap-2">
                <input id="f-kota" class="form-control form-control-sm" value="Jember" style="max-width:140px;">
                <input id="f-tanggal" class="form-control form-control-sm" value="${e(fmtTanggalID(new Date()))}">
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-6">
        <div class="card mb-3">
          <div class="card-header"><i class="bi bi-bar-chart"></i> Ringkasan Data</div>
          <div class="card-body">
            <ul class="mb-0 small">
              <li>Total guru: <strong>${data.summary.total}</strong></li>
              <li>Sudah dinilai: <strong>${data.summary.dinilai}</strong> (${data.summary.total ? (data.summary.dinilai / data.summary.total * 100).toFixed(0) : 0}%)</li>
              <li>Rata-rata: <strong>${data.summary.rataRata.toFixed(2)}</strong> (${e(sebutanByNilai(data.summary.rataRata))})</li>
            </ul>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><i class="bi bi-file-earmark-arrow-down"></i> Generate</div>
          <div class="card-body">
            <p class="small text-muted mb-2">Pilih format output:</p>
            <button id="btn-html" class="btn btn-success me-2"><i class="bi bi-printer"></i> Buka HTML A4 (untuk Cetak/PDF)</button>
            <button id="btn-docx" class="btn btn-primary"><i class="bi bi-file-earmark-word"></i> Download DOCX</button>
          </div>
        </div>
      </div>
    </div>`;

    const getOpts = () => ({
      kamad: kamad || {},
      nama_kamad: document.getElementById('f-nama-kamad').value.trim(),
      nip_kamad: document.getElementById('f-nip-kamad').value.trim(),
      nama_pengawas: document.getElementById('f-nama-peng').value.trim(),
      nip_pengawas: document.getElementById('f-nip-peng').value.trim(),
      kota: document.getElementById('f-kota').value.trim(),
      tanggal: document.getElementById('f-tanggal').value.trim(),
    });

    document.getElementById('btn-html').addEventListener('click', () => {
      const html = buildLaporanMadrasahHTML(scopeValue, getOpts());
      bukaTabHTML(html, `Laporan PKG ${scopeValue}`);
    });
    document.getElementById('btn-docx').addEventListener('click', async () => {
      try {
        await downloadDOCXMadrasah(scopeValue, getOpts());
      } catch (err) {
        alert('Gagal generate DOCX: ' + (err && err.message ? err.message : err));
      }
    });
  }

  // === VIEW: PICKER KKM ==============================================
  function viewLaporanKKMPicker(view) {
    const all = window.PKGDB.listGuru('');
    const map = {};
    for (const g of all) {
      const k = (g.kkm || '').trim();
      if (!k) continue;
      if (!map[k]) map[k] = { gurus: 0, madrasah: new Set() };
      map[k].gurus++;
      if (g.nama_madrasah) map[k].madrasah.add(g.nama_madrasah);
    }
    const list = Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
    if (list.length === 0) {
      view.innerHTML = `<div class="alert alert-warning"><i class="bi bi-exclamation-triangle"></i> Belum ada KKM tercatat. Pastikan field <code>kkm</code> terisi pada Data Guru. <a href="#/guru">Data Guru</a>.</div>`;
      return;
    }
    view.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="mb-0"><i class="bi bi-diagram-3"></i> Laporan KKM</h4>
    </div>
    <div class="alert alert-info py-2 small"><i class="bi bi-info-circle"></i>
      Pilih KKM untuk membuka generator laporan PKG agregat tingkat KKM.
    </div>
    <div class="card">
      <div class="table-responsive">
        <table class="table table-sm table-hover mb-0 align-middle">
          <thead class="table-light"><tr>
            <th style="width:30px;">#</th><th>Nama KKM</th>
            <th class="text-center" style="width:90px;">Madrasah</th>
            <th class="text-center" style="width:80px;">Guru</th>
            <th style="width:160px;"></th>
          </tr></thead>
          <tbody>
            ${list.map(([nama, info], i) => `
              <tr>
                <td>${i + 1}</td>
                <td><strong>${e(nama)}</strong></td>
                <td class="text-center">${info.madrasah.size}</td>
                <td class="text-center">${info.gurus}</td>
                <td class="text-end">
                  <a class="btn btn-sm btn-primary" href="#/laporan-kkm-view/${encodeURIComponent(nama)}">
                    <i class="bi bi-file-earmark-text"></i> Buka
                  </a>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
  }

  function viewLaporanKKM(view, scopeValue) {
    if (!scopeValue) { view.innerHTML = `<div class="alert alert-danger">KKM tidak dipilih. <a href="#/laporan-kkm">Kembali</a></div>`; return; }
    const data = getPenilaianGuruAtScope('kkm', scopeValue);

    view.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <div>
        <h4 class="mb-0"><i class="bi bi-file-earmark-text"></i> Generator Laporan KKM</h4>
        <div class="text-muted small">KKM ${e(scopeValue)} &middot; ${data.summary.madrasahCount} madrasah &middot; ${data.summary.total} guru</div>
      </div>
      <a class="btn btn-sm btn-outline-secondary" href="#/laporan-kkm"><i class="bi bi-arrow-left"></i> Kembali</a>
    </div>

    <div class="row g-3">
      <div class="col-lg-6">
        <div class="card">
          <div class="card-header"><i class="bi bi-person-vcard"></i> Identitas Penanda Tangan</div>
          <div class="card-body">
            <div class="alert alert-success py-2 small mb-3">
              <i class="bi bi-check2-circle"></i> Mengetahui: <strong>${e(POKJAWAS.nama)}</strong> (NIP. ${e(POKJAWAS.nip)}), Ketua Pokjawas Madrasah ${e(KEMENAG.kabupaten)} (otomatis dari konfigurasi).
            </div>
            <div class="mb-2"><label class="form-label small">Nama Pengawas Madrasah</label>
              <input id="f-nama-peng" class="form-control form-control-sm" value=""></div>
            <div class="mb-2"><label class="form-label small">NIP Pengawas Madrasah</label>
              <input id="f-nip-peng" class="form-control form-control-sm" value=""></div>
            <div class="mb-2"><label class="form-label small">Wilayah</label>
              <input id="f-wilayah" class="form-control form-control-sm" value="${e(KEMENAG.kabupaten)}"></div>
            <div class="mb-2"><label class="form-label small">Kota & Tanggal</label>
              <div class="d-flex gap-2">
                <input id="f-kota" class="form-control form-control-sm" value="Jember" style="max-width:140px;">
                <input id="f-tanggal" class="form-control form-control-sm" value="${e(fmtTanggalID(new Date()))}">
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-6">
        <div class="card mb-3">
          <div class="card-header"><i class="bi bi-bar-chart"></i> Ringkasan Data KKM</div>
          <div class="card-body">
            <ul class="mb-0 small">
              <li>Madrasah: <strong>${data.summary.madrasahCount}</strong></li>
              <li>Total guru: <strong>${data.summary.total}</strong></li>
              <li>Sudah dinilai: <strong>${data.summary.dinilai}</strong> (${data.summary.total ? (data.summary.dinilai / data.summary.total * 100).toFixed(0) : 0}%)</li>
              <li>Rata-rata KKM: <strong>${data.summary.rataRata.toFixed(2)}</strong> (${e(sebutanByNilai(data.summary.rataRata))})</li>
            </ul>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><i class="bi bi-file-earmark-arrow-down"></i> Generate</div>
          <div class="card-body">
            <p class="small text-muted mb-2">Pilih format output:</p>
            <button id="btn-html" class="btn btn-success me-2"><i class="bi bi-printer"></i> Buka HTML A4 (untuk Cetak/PDF)</button>
            <button id="btn-docx" class="btn btn-primary"><i class="bi bi-file-earmark-word"></i> Download DOCX</button>
          </div>
        </div>
      </div>
    </div>`;

    const getOpts = () => ({
      nama_pengawas: document.getElementById('f-nama-peng').value.trim(),
      nip_pengawas: document.getElementById('f-nip-peng').value.trim(),
      wilayah: document.getElementById('f-wilayah').value.trim(),
      kota: document.getElementById('f-kota').value.trim(),
      tanggal: document.getElementById('f-tanggal').value.trim(),
    });

    document.getElementById('btn-html').addEventListener('click', () => {
      const html = buildLaporanKKMHTML(scopeValue, getOpts());
      bukaTabHTML(html, `Laporan PKG KKM ${scopeValue}`);
    });
    document.getElementById('btn-docx').addEventListener('click', async () => {
      try {
        await downloadDOCXKKM(scopeValue, getOpts());
      } catch (err) {
        alert('Gagal generate DOCX: ' + (err && err.message ? err.message : err));
      }
    });
  }

  // === EXPOSE ========================================================
  window.PKGLaporan = window.PKGLaporan || {};
  Object.assign(window.PKGLaporan, {
    POKJAWAS, KEMENAG, LANDASAN_HUKUM_DEFAULT,
    fmtTanggalID, tahunAkademik, semesterAktif, sebutanByNilai,
    getPenilaianGuruAtScope, computeRataKompetensi,
    narasiLatarBelakang, narasiTujuan, narasiManfaat,
    narasiKonsepPKG, narasiHasilPenilaian, narasiKesimpulan, narasiRekomendasi,
    buildLaporanMadrasahHTML, buildLaporanKKMHTML,
    bukaTabHTML, downloadDOCXMadrasah, downloadDOCXKKM,
    e,
  });

  // App expects these names at global scope (router calls them directly)
  window.viewLaporanMadrasahPicker = viewLaporanMadrasahPicker;
  window.viewLaporanMadrasah = viewLaporanMadrasah;
  window.viewLaporanKKMPicker = viewLaporanKKMPicker;
  window.viewLaporanKKM = viewLaporanKKM;
})();
