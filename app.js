// app.js - hash router + views for PKG SPA

const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

// === HELPERS ============================================================
function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
const e = escapeHtml;

function toast(msg, type) {
  const div = document.createElement('div');
  div.className = `toast-fixed alert alert-${type || 'success'} shadow-sm`;
  div.innerHTML = `<i class="bi bi-${type === 'danger' ? 'exclamation-triangle' : 'check-circle'}"></i> ${e(msg)}`;
  document.body.appendChild(div);
  setTimeout(() => div.style.opacity = '0', 2400);
  setTimeout(() => div.remove(), 3000);
}

function parseHash() {
  const h = (location.hash || '#/').replace(/^#/, '');
  const [pathPart, queryPart] = h.split('?');
  const segments = pathPart.split('/').filter(Boolean);
  const query = {};
  if (queryPart) {
    for (const kv of queryPart.split('&')) {
      const [k, v] = kv.split('=');
      query[decodeURIComponent(k)] = decodeURIComponent(v || '');
    }
  }
  return { segments, query };
}

function navigate(path) {
  location.hash = path.startsWith('#') ? path : '#' + path;
}

function fmtDate(s) {
  if (!s) return '-';
  return s;
}

const NAMA_BLN = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const NAMA_BLN_SHORT = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

// === LAYOUT =============================================================
function renderShell() {
  const html = `
  <nav class="navbar navbar-expand-lg navbar-dark bg-primary mb-3 no-print">
    <div class="container-fluid">
      <a class="navbar-brand fw-bold" href="#/"><i class="bi bi-clipboard-check"></i> PKG 2025</a>
      <button class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#nav"><span class="navbar-toggler-icon"></span></button>
      <div class="collapse navbar-collapse" id="nav">
        <ul class="navbar-nav me-auto">
          <li class="nav-item"><a class="nav-link" href="#/"><i class="bi bi-house"></i> Beranda</a></li>
          <li class="nav-item"><a class="nav-link" href="#/guru"><i class="bi bi-people"></i> Data Guru</a></li>
          <li class="nav-item"><a class="nav-link" href="#/kamad"><i class="bi bi-person-badge"></i> Data Kamad</a></li>
          <li class="nav-item"><a class="nav-link" href="#/penilaian"><i class="bi bi-clipboard-check"></i> Penilaian</a></li>
          <li class="nav-item"><a class="nav-link" href="#/rekap"><i class="bi bi-table"></i> Rekap</a></li>
          <li class="nav-item"><a class="nav-link" href="#/import"><i class="bi bi-cloud-upload"></i> Import</a></li>
          <li class="nav-item"><a class="nav-link" href="#/instrumen"><i class="bi bi-list-check"></i> Instrumen</a></li>
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown"><i class="bi bi-file-earmark-text"></i> Laporan</a>
            <ul class="dropdown-menu">
              <li><a class="dropdown-item" href="#/laporan-madrasah"><i class="bi bi-building"></i> Laporan Madrasah</a></li>
              <li><a class="dropdown-item" href="#/laporan-kkm"><i class="bi bi-diagram-3"></i> Laporan KKM</a></li>
            </ul>
          </li>
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown"><i class="bi bi-shield-check"></i> Backup</a>
            <ul class="dropdown-menu">
              <li><a class="dropdown-item" href="#/backup"><i class="bi bi-building"></i> Backup Madrasah</a></li>
              <li><a class="dropdown-item" href="#/backup-kabupaten"><i class="bi bi-geo-alt-fill"></i> Backup Kabupaten / KKM</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item text-danger" href="#/backup-clear"><i class="bi bi-trash"></i> Hapus Semua Data</a></li>
            </ul>
          </li>
          <li class="nav-item"><a class="nav-link" href="#/panduan"><i class="bi bi-question-circle"></i> Panduan</a></li>
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown"><i class="bi bi-person-circle"></i> Akun</a>
            <ul class="dropdown-menu dropdown-menu-end">
              <li><a class="dropdown-item" href="#/pengaturan-pin"><i class="bi bi-shield-lock"></i> Pengaturan PIN</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item text-danger" href="#" id="nav-logout"><i class="bi bi-box-arrow-right"></i> Logout</a></li>
            </ul>
          </li>
        </ul>
        <span class="navbar-text small text-white-50">Kemenag Jember &middot; Pokjawas</span>
      </div>
    </div>
  </nav>
  <div class="container-fluid pb-5" id="view"></div>
  <footer class="text-center text-muted small py-3 no-print">
    Aplikasi PKG &middot; berbasis SK Dirjen Pendis No. 6673 Tahun 2019 &middot; data tersimpan di browser
  </footer>`;
  document.body.insertAdjacentHTML('afterbegin', html);
}

// === ROUTER =============================================================
function render() {
  const { segments, query } = parseHash();
  const view = $('#view');

  if (segments.length === 0) return viewBeranda(view);

  const [s0, s1, s2, s3] = segments;

  if (s0 === 'guru' && !s1) return viewGuruList(view);
  if (s0 === 'kamad') {
    if (!s1) return viewKamadList(view);
    if (s1 === 'new') return viewKamadForm(view, null);
    if (s2 === 'edit') return viewKamadForm(view, s1);
    return viewKamadDetail(view, s1);
  }
  if (s0 === 'guru' && s1 === 'new') return viewGuruForm(view, null);
  if (s0 === 'guru' && s1 && s2 === 'edit') return viewGuruForm(view, s1);
  if (s0 === 'guru' && s1 && s2 === 'nilai' && s3) return viewNilai(view, s1, s3, query.jenis || 'sumatif');
  if (s0 === 'guru' && s1 && s2 === 'cetak' && s3) return viewCetak(view, s1, s3, query.jenis || 'sumatif');
  if (s0 === 'guru' && s1) return viewGuruDetail(view, s1);

  if (s0 === 'rekap') return viewRekap(view);
  if (s0 === 'penilaian') return viewPenilaianHub(view);
  if (s0 === 'instrumen') return viewInstrumen(view);
  if (s0 === 'panduan') return viewPanduan(view);
  if (s0 === 'pengaturan-pin') return window.PKGAuth.viewPengaturanPIN(view);
  if (s0 === 'import') return viewImport(view);
  if (s0 === 'laporan-madrasah') return viewLaporanMadrasahPicker(view);
  if (s0 === 'laporan-madrasah-view' && s1) return viewLaporanMadrasah(view, decodeURIComponent(s1));
  if (s0 === 'laporan-kkm') return viewLaporanKKMPicker(view);
  if (s0 === 'laporan-kkm-view' && s1) return viewLaporanKKM(view, decodeURIComponent(s1));
  if (s0 === 'backup') return viewBackupMadrasah(view);
  if (s0 === 'backup-kabupaten') return viewBackupKabupaten(view);
  if (s0 === 'backup-clear') return viewBackupClear(view);

  view.innerHTML = `<div class="alert alert-warning">Halaman tidak ditemukan. <a href="#/">Beranda</a></div>`;
}

// === BERANDA ============================================================
function viewBeranda(view) {
  const stats = PKGDB.getStats();
  const recent = PKGDB.getRecentGuru(8);
  view.innerHTML = `
  <div class="row g-3 mb-4">
    <div class="col-md-3 col-6"><div class="card"><div class="card-body text-center">
      <div class="display-6 text-primary"><i class="bi bi-people"></i></div>
      <div class="h3 mb-0">${stats.guru}</div>
      <div class="text-muted small">Guru terdaftar</div>
    </div></div></div>
    <div class="col-md-3 col-6"><div class="card"><div class="card-body text-center">
      <div class="display-6 text-success"><i class="bi bi-clipboard-check"></i></div>
      <div class="h3 mb-0">${stats.penilaian}</div>
      <div class="text-muted small">Sesi penilaian</div>
    </div></div></div>
    <div class="col-md-3 col-6"><div class="card"><div class="card-body text-center">
      <div class="display-6 text-warning"><i class="bi bi-check2-circle"></i></div>
      <div class="h3 mb-0">${stats.selesai}</div>
      <div class="text-muted small">Sudah dinilai</div>
    </div></div></div>
    <div class="col-md-3 col-6"><div class="card"><div class="card-body text-center">
      <div class="display-6 text-info"><i class="bi bi-list-check"></i></div>
      <div class="h3 mb-0">${stats.indikator}</div>
      <div class="text-muted small">Total indikator</div>
    </div></div></div>
  </div>

  <div class="row g-3">
    <div class="col-lg-7">
      <div class="card">
        <div class="card-header"><i class="bi bi-grid-3x3-gap"></i> Peran / Instrumen Tersedia</div>
        <div class="card-body">
          <div class="row g-2">
            ${PKGDB.ROLES.map(r => `
              <div class="col-md-6 col-lg-4">
                <a href="#/instrumen?role=${encodeURIComponent(r.role_code)}" class="text-decoration-none text-dark">
                  <div class="card role-card h-100">
                    <div class="card-body">
                      <div class="role-icon text-primary"><i class="bi bi-person-badge"></i></div>
                      <div class="fw-semibold">${e(r.role_label)}</div>
                      <div class="small text-muted">${e(r.role_code)} &middot; skor 0-${r.max_score}</div>
                    </div>
                  </div>
                </a>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
    <div class="col-lg-5">
      <div class="card">
        <div class="card-header d-flex justify-content-between">
          <span><i class="bi bi-clock-history"></i> Aktivitas Terakhir</span>
          <a class="btn btn-sm btn-primary" href="#/guru/new"><i class="bi bi-plus-lg"></i> Tambah Guru</a>
        </div>
        <div class="list-group list-group-flush">
          ${recent.length === 0 ? '<div class="list-group-item text-muted text-center py-4">Belum ada data guru</div>' : ''}
          ${recent.map(r => `
            <a href="#/guru/${r.id}" class="list-group-item list-group-item-action">
              <div class="fw-semibold">${e(r.nama)}</div>
              <div class="small text-muted">${e(r.nama_madrasah || '-')} &middot; ${e(r.mapel_kelas || '-')}</div>
            </a>
          `).join('')}
        </div>
      </div>
    </div>
  </div>`;
}

// === KAMAD LIST =========================================================
function viewKamadList(view) {
  const { query } = parseHash();
  const q = query.q || '';
  const rows = PKGDB.listKamad(q);
  view.innerHTML = `
  <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
    <h4 class="mb-0"><i class="bi bi-person-badge"></i> Data Kepala Madrasah <span class="badge bg-secondary">${rows.length}</span></h4>
    <div class="d-flex gap-2">
      <button id="btn-sync" class="btn btn-outline-secondary btn-sm" title="Auto-import dari data guru yang sudah punya nama_kamad"><i class="bi bi-arrow-repeat"></i> Sync dari Data Guru</button>
      <a href="#/kamad/new" class="btn btn-primary"><i class="bi bi-plus-lg"></i> Tambah</a>
    </div>
  </div>
  <div class="card mb-3"><div class="card-body py-2">
    <input id="search" class="form-control form-control-sm" placeholder="Cari nama, NIP, atau madrasah..." value="${e(q)}">
  </div></div>
  <div class="card">
    <div class="table-responsive">
      <table class="table table-sm table-hover mb-0 align-middle">
        <thead class="table-light"><tr>
          <th>#</th><th>Nama Madrasah</th><th>Kepala Madrasah</th><th>NIP</th><th>Jenjang</th><th>Kontak</th><th></th>
        </tr></thead>
        <tbody>
          ${rows.length === 0 ? '<tr><td colspan="7" class="text-center text-muted py-4">Belum ada data. Klik "Tambah" atau "Sync dari Data Guru".</td></tr>' : ''}
          ${rows.map((k, i) => `
            <tr>
              <td>${i + 1}</td>
              <td><a href="#/kamad/${k.id}" class="fw-semibold">${e(k.nama_madrasah || '-')}</a><div class="small text-muted">${e(k.alamat_madrasah || '')}</div></td>
              <td>${e(k.nama || '-')}</td>
              <td class="small">${e(k.nip || '-')}</td>
              <td>${e(k.jenjang || '-')}</td>
              <td class="small">${e(k.no_hp || '-')}${k.email ? '<br>' + e(k.email) : ''}</td>
              <td class="text-end">
                <a class="btn btn-sm btn-outline-primary" href="#/kamad/${k.id}/edit" title="Edit"><i class="bi bi-pencil"></i></a>
                <button class="btn btn-sm btn-outline-danger" data-del-kamad="${k.id}" data-del-name="${e(k.nama || k.nama_madrasah)}" title="Hapus"><i class="bi bi-trash"></i></button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>`;

  $('#search').addEventListener('input', (ev) => {
    const v = ev.target.value;
    history.replaceState(null, '', '#/kamad' + (v ? `?q=${encodeURIComponent(v)}` : ''));
    viewKamadList(view);
    setTimeout(() => $('#search').focus(), 0);
  });

  $('#btn-sync').addEventListener('click', () => {
    const added = PKGDB.syncKamadFromGuru();
    if (added > 0) {
      toast(`${added} kamad ditambahkan dari data guru`);
      viewKamadList(view);
    } else {
      toast('Tidak ada kamad baru. Semua sudah tersinkron.', 'info');
    }
  });

  $$('[data-del-kamad]').forEach(b => {
    b.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const id = b.dataset.delKamad;
      const nm = b.dataset.delName;
      if (!confirm(`Hapus data kepala madrasah "${nm}"?\n\nData ini akan dihapus permanen dari device ini.`)) return;
      PKGDB.deleteKamad(id);
      toast('Kamad dihapus');
      viewKamadList(view);
    });
  });
}

// === KAMAD FORM =========================================================
function viewKamadForm(view, editId) {
  const isNew = !editId;
  const k = isNew ? {} : (PKGDB.getKamad(editId) || {});
  if (!isNew && !k.id) {
    view.innerHTML = '<div class="alert alert-warning">Kamad tidak ditemukan</div>';
    return;
  }
  const field = (name, label, type, opts) => {
    opts = opts || {};
    const val = k[name] !== undefined && k[name] !== null ? k[name] : '';
    if (type === 'select') {
      return `<label class="form-label">${label}</label><select class="form-select" name="${name}">
        <option value="">-</option>
        ${opts.options.map(o => `<option ${val === o ? 'selected' : ''}>${o}</option>`).join('')}
      </select>`;
    }
    if (type === 'textarea') {
      return `<label class="form-label">${label}</label><textarea class="form-control" name="${name}" rows="2">${e(val)}</textarea>`;
    }
    return `<label class="form-label">${label}${opts.required ? ' *' : ''}</label><input type="${type || 'text'}" class="form-control" name="${name}" value="${e(val)}" ${opts.required ? 'required' : ''}>`;
  };

  view.innerHTML = `
  <h4 class="mb-3"><i class="bi bi-person-${isNew ? 'plus' : 'gear'}"></i> ${isNew ? 'Tambah' : 'Edit'} Data Kepala Madrasah</h4>
  <form id="form-kamad" class="card">
    <div class="card-body">
      <h6 class="text-muted text-uppercase small mb-3">Madrasah</h6>
      <div class="row g-3 mb-4">
        <div class="col-md-8">${field('nama_madrasah', 'Nama Madrasah', 'text', { required: true })}</div>
        <div class="col-md-4">${field('jenjang', 'Jenjang', 'select', { options: ['RA', 'MI', 'MTs', 'MA', 'MAK'] })}</div>
        <div class="col-md-12">${field('alamat_madrasah', 'Alamat Madrasah', 'text')}</div>
        <div class="col-md-6">${field('kkm', 'KKM (Kelompok Kerja Madrasah)', 'text')}</div>
        <div class="col-md-6">${field('kabupaten', 'Kabupaten/Kota', 'text')}</div>
        <div class="col-md-4">${field('nsm', 'NSM', 'text')}</div>
        <div class="col-md-4">${field('npsn', 'NPSN', 'text')}</div>
        <div class="col-md-4">${field('akreditasi', 'Akreditasi', 'select', { options: ['A', 'B', 'C', 'Belum'] })}</div>
      </div>
      <h6 class="text-muted text-uppercase small mb-3">Identitas Kepala Madrasah</h6>
      <div class="row g-3 mb-4">
        <div class="col-md-6">${field('nama', 'Nama Lengkap', 'text', { required: true })}</div>
        <div class="col-md-6">${field('gelar', 'Gelar (mis. M.Pd, S.Ag)', 'text')}</div>
        <div class="col-md-4">${field('nip', 'NIP', 'text')}</div>
        <div class="col-md-4">${field('nuptk', 'NUPTK', 'text')}</div>
        <div class="col-md-4">${field('jenis_kelamin', 'Jenis Kelamin', 'select', { options: ['L', 'P'] })}</div>
        <div class="col-md-4">${field('tempat_lahir', 'Tempat Lahir', 'text')}</div>
        <div class="col-md-4">${field('tanggal_lahir', 'Tanggal Lahir', 'date')}</div>
        <div class="col-md-4">${field('pendidikan', 'Pendidikan Terakhir', 'text')}</div>
        <div class="col-md-4">${field('pangkat_gol', 'Pangkat / Gol', 'text')}</div>
        <div class="col-md-4">${field('tmt_kamad', 'TMT Sebagai Kamad', 'date')}</div>
        <div class="col-md-4">${field('periode', 'Periode (mis. 2024-2028)', 'text')}</div>
      </div>
      <h6 class="text-muted text-uppercase small mb-3">Kontak</h6>
      <div class="row g-3">
        <div class="col-md-4">${field('no_hp', 'No. HP / WhatsApp', 'text')}</div>
        <div class="col-md-4">${field('email', 'Email', 'email')}</div>
        <div class="col-md-4">${field('alamat_rumah', 'Alamat Rumah', 'text')}</div>
        <div class="col-md-12">${field('catatan', 'Catatan', 'textarea')}</div>
      </div>
    </div>
    <div class="card-footer text-end bg-white">
      <a href="${isNew ? '#/kamad' : '#/kamad/' + k.id}" class="btn btn-light">Batal</a>
      <button type="submit" class="btn btn-primary"><i class="bi bi-check-lg"></i> Simpan</button>
    </div>
  </form>`;

  $('#form-kamad').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const data = {};
    for (const [k2, v] of fd.entries()) data[k2] = v;
    const row = PKGDB.saveKamad(data, isNew ? null : editId);
    toast(isNew ? 'Kamad ditambahkan' : 'Perubahan disimpan');
    navigate('/kamad/' + row.id);
  });
}

// === KAMAD DETAIL =======================================================
function viewKamadDetail(view, id) {
  const k = PKGDB.getKamad(id);
  if (!k) {
    view.innerHTML = '<div class="alert alert-warning">Kamad tidak ditemukan. <a href="#/kamad">Kembali</a></div>';
    return;
  }
  // Cari guru di madrasah yang sama
  const guruDiMadrasah = PKGDB.listGuru().filter(g => (g.nama_madrasah || '').toLowerCase().trim() === (k.nama_madrasah || '').toLowerCase().trim());

  view.innerHTML = `
  <div class="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
    <div>
      <div class="small"><a href="#/kamad"><i class="bi bi-arrow-left"></i> Daftar Kamad</a></div>
      <h4 class="mb-1"><i class="bi bi-person-vcard"></i> ${e(k.nama || '-')}${k.gelar ? ', ' + e(k.gelar) : ''}</h4>
      <div class="text-muted">${e(k.nip || 'NIP -')} &middot; Kepala ${e(k.nama_madrasah || '-')}</div>
    </div>
    <div class="d-flex gap-2">
      <a href="#/kamad/${k.id}/edit" class="btn btn-outline-secondary btn-sm"><i class="bi bi-pencil"></i> Edit</a>
      <button id="btn-delete" class="btn btn-outline-danger btn-sm"><i class="bi bi-trash"></i> Hapus</button>
    </div>
  </div>

  <div class="row g-3">
    <div class="col-lg-7">
      <div class="card mb-3">
        <div class="card-header">Identitas</div>
        <div class="card-body">
          <dl class="row mb-0">
            <dt class="col-sm-4">Nama Lengkap</dt><dd class="col-sm-8">${e(k.nama || '-')}${k.gelar ? ', ' + e(k.gelar) : ''}</dd>
            <dt class="col-sm-4">NIP / NUPTK</dt><dd class="col-sm-8">${e(k.nip || '-')} / ${e(k.nuptk || '-')}</dd>
            <dt class="col-sm-4">Jenis Kelamin</dt><dd class="col-sm-8">${e(k.jenis_kelamin || '-')}</dd>
            <dt class="col-sm-4">Tempat, Tgl Lahir</dt><dd class="col-sm-8">${e(k.tempat_lahir || '-')}, ${e(k.tanggal_lahir || '-')}</dd>
            <dt class="col-sm-4">Pendidikan</dt><dd class="col-sm-8">${e(k.pendidikan || '-')}</dd>
            <dt class="col-sm-4">Pangkat / Gol</dt><dd class="col-sm-8">${e(k.pangkat_gol || '-')}</dd>
            <dt class="col-sm-4">TMT Sebagai Kamad</dt><dd class="col-sm-8">${e(k.tmt_kamad || '-')}</dd>
            <dt class="col-sm-4">Periode</dt><dd class="col-sm-8">${e(k.periode || '-')}</dd>
          </dl>
        </div>
      </div>
      <div class="card mb-3">
        <div class="card-header">Kontak</div>
        <div class="card-body">
          <dl class="row mb-0">
            <dt class="col-sm-4">No. HP / WA</dt><dd class="col-sm-8">${e(k.no_hp || '-')}</dd>
            <dt class="col-sm-4">Email</dt><dd class="col-sm-8">${e(k.email || '-')}</dd>
            <dt class="col-sm-4">Alamat Rumah</dt><dd class="col-sm-8">${e(k.alamat_rumah || '-')}</dd>
          </dl>
          ${k.catatan ? `<hr><div class="small text-muted"><strong>Catatan:</strong> ${e(k.catatan)}</div>` : ''}
        </div>
      </div>
    </div>
    <div class="col-lg-5">
      <div class="card mb-3">
        <div class="card-header">Madrasah</div>
        <div class="card-body">
          <dl class="row mb-0">
            <dt class="col-sm-5">Nama</dt><dd class="col-sm-7">${e(k.nama_madrasah || '-')}</dd>
            <dt class="col-sm-5">Jenjang</dt><dd class="col-sm-7">${e(k.jenjang || '-')}</dd>
            <dt class="col-sm-5">NSM / NPSN</dt><dd class="col-sm-7">${e(k.nsm || '-')} / ${e(k.npsn || '-')}</dd>
            <dt class="col-sm-5">Akreditasi</dt><dd class="col-sm-7">${e(k.akreditasi || '-')}</dd>
            <dt class="col-sm-5">Alamat</dt><dd class="col-sm-7">${e(k.alamat_madrasah || '-')}</dd>
          </dl>
        </div>
      </div>
      <div class="card">
        <div class="card-header">Guru di Madrasah Ini <span class="badge bg-secondary">${guruDiMadrasah.length}</span></div>
        <ul class="list-group list-group-flush small">
          ${guruDiMadrasah.length === 0 ? '<li class="list-group-item text-muted text-center py-3">Belum ada data guru</li>' : ''}
          ${guruDiMadrasah.map(g => `
            <li class="list-group-item d-flex justify-content-between">
              <a href="#/guru/${g.id}">${e(g.nama)}</a>
              <span class="text-muted">${e(g.mapel_kelas || '-')}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
  </div>`;

  $('#btn-delete').addEventListener('click', () => {
    if (confirm(`Hapus data kamad "${k.nama}"?`)) {
      PKGDB.deleteKamad(id);
      toast('Kamad dihapus');
      navigate('/kamad');
    }
  });
}

// === BULK IMPORT/TEMPLATE GURU & KAMAD =================================
const GURU_COLUMNS = [
  { key: 'nama', label: 'Nama Guru', width: 28, required: true },
  { key: 'nip', label: 'NIP', width: 22 },
  { key: 'nuptk', label: 'NUPTK', width: 20 },
  { key: 'nrg', label: 'NRG', width: 20 },
  { key: 'jenis_kelamin', label: 'Jenis Kelamin (L/P)', width: 14 },
  { key: 'tempat_lahir', label: 'Tempat Lahir', width: 18 },
  { key: 'tanggal_lahir', label: 'Tanggal Lahir (YYYY-MM-DD)', width: 18 },
  { key: 'pendidikan', label: 'Pendidikan Terakhir', width: 22 },
  { key: 'pangkat_gol', label: 'Pangkat/Gol', width: 16 },
  { key: 'tmt_gol', label: 'TMT Golongan', width: 16 },
  { key: 'tmt_guru', label: 'TMT Guru', width: 16 },
  { key: 'mapel_kelas', label: 'Mapel/Kelas', width: 22 },
  { key: 'jjm', label: 'JJM', width: 8 },
  { key: 'tugas_tambahan_1', label: 'Tugas Tambahan 1', width: 22 },
  { key: 'tugas_tambahan_2', label: 'Tugas Tambahan 2', width: 22 },
  { key: 'tugas_tambahan_3', label: 'Tugas Tambahan 3', width: 22 },
  { key: 'nama_madrasah', label: 'Nama Madrasah', width: 30 },
  { key: 'alamat_madrasah', label: 'Alamat Madrasah', width: 30 },
  { key: 'kkm', label: 'KKM (Kelompok Kerja Madrasah)', width: 22 },
  { key: 'kabupaten', label: 'Kabupaten/Kota', width: 18 },
  { key: 'tahun_pelajaran', label: 'Tahun Pelajaran', width: 14 },
  { key: 'semester', label: 'Semester (Ganjil/Genap)', width: 14 },
  { key: 'nama_kamad', label: 'Nama Kamad', width: 24 },
  { key: 'nip_kamad', label: 'NIP Kamad', width: 22 },
  { key: 'nama_penilai', label: 'Nama Penilai', width: 24 },
  { key: 'nip_penilai', label: 'NIP Penilai', width: 22 },
  { key: 'jabatan_penilai', label: 'Jabatan Penilai', width: 18 },
];

const KAMAD_COLUMNS = [
  { key: 'nama_madrasah', label: 'Nama Madrasah', width: 30, required: true },
  { key: 'jenjang', label: 'Jenjang (RA/MI/MTs/MA/MAK)', width: 14 },
  { key: 'nsm', label: 'NSM', width: 16 },
  { key: 'npsn', label: 'NPSN', width: 14 },
  { key: 'akreditasi', label: 'Akreditasi (A/B/C)', width: 12 },
  { key: 'kkm', label: 'KKM (Kelompok Kerja Madrasah)', width: 22 },
  { key: 'kabupaten', label: 'Kabupaten/Kota', width: 18 },
  { key: 'alamat_madrasah', label: 'Alamat Madrasah', width: 30 },
  { key: 'nama', label: 'Nama Kepala Madrasah', width: 28, required: true },
  { key: 'gelar', label: 'Gelar', width: 12 },
  { key: 'nip', label: 'NIP', width: 22 },
  { key: 'nuptk', label: 'NUPTK', width: 20 },
  { key: 'jenis_kelamin', label: 'Jenis Kelamin (L/P)', width: 14 },
  { key: 'tempat_lahir', label: 'Tempat Lahir', width: 18 },
  { key: 'tanggal_lahir', label: 'Tanggal Lahir (YYYY-MM-DD)', width: 18 },
  { key: 'pendidikan', label: 'Pendidikan', width: 22 },
  { key: 'pangkat_gol', label: 'Pangkat/Gol', width: 16 },
  { key: 'tmt_kamad', label: 'TMT Sebagai Kamad (YYYY-MM-DD)', width: 18 },
  { key: 'periode', label: 'Periode', width: 16 },
  { key: 'no_hp', label: 'No HP/WA', width: 16 },
  { key: 'email', label: 'Email', width: 22 },
  { key: 'alamat_rumah', label: 'Alamat Rumah', width: 28 },
  { key: 'catatan', label: 'Catatan', width: 28 },
];

async function downloadTemplateExcel(name, columns, sampleRow) {
  if (typeof ExcelJS === 'undefined') {
    toast('Library Excel belum termuat. Pastikan online.', 'danger');
    return;
  }
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Data');
  ws.columns = columns.map(c => ({ header: c.label, key: c.key, width: c.width }));
  // Header style
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047A3A' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  headerRow.height = 30;
  // Border + freeze
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  // Sample row(s)
  if (sampleRow) ws.addRow(sampleRow);
  // Add 50 empty rows (so user has space)
  for (let i = 0; i < 50; i++) ws.addRow({});
  // All-cells border
  ws.eachRow((row) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      };
    });
  });

  // Catatan sheet
  const ws2 = wb.addWorksheet('Petunjuk');
  ws2.columns = [{ header: 'Petunjuk Pengisian', key: 'p', width: 80 }];
  const tips = [
    'Isi data mulai baris ke-2 (baris 1 adalah header, jangan diubah).',
    'Kolom yang wajib diisi: ' + columns.filter(c => c.required).map(c => c.label).join(', ') + '.',
    'Format tanggal: YYYY-MM-DD (mis. 1980-05-15).',
    'Jenis Kelamin: L atau P.',
    'NIP & nama_madrasah jadi kunci unik (upsert) saat import. Jadi import ulang aman, tidak duplikat.',
    'Simpan file dalam format .xlsx, lalu klik tombol Import di aplikasi.',
  ];
  for (const t of tips) ws2.addRow({ p: t });
  ws2.getColumn(1).alignment = { wrapText: true, vertical: 'top' };

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `template-${name}-pkg.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Template terdownload');
}

async function importFlatXlsx(file, columns) {
  if (typeof ExcelJS === 'undefined') throw new Error('Library Excel belum termuat');
  const buf = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const ws = wb.getWorksheet('Data') || wb.worksheets[0];
  if (!ws) throw new Error('Sheet tidak ditemukan');

  // Map header to column key
  const headerRow = ws.getRow(1);
  const colMap = {};
  headerRow.eachCell((cell, idx) => {
    const v = (cell.value || '').toString().trim();
    const found = columns.find(c => c.label === v || c.key === v);
    if (found) colMap[idx] = found.key;
  });
  if (Object.keys(colMap).length === 0) throw new Error('Header kolom tidak cocok dengan template. Pastikan pakai template yang benar.');

  const rows = [];
  ws.eachRow((row, rIdx) => {
    if (rIdx === 1) return;
    const obj = {};
    let hasData = false;
    row.eachCell((cell, cIdx) => {
      const key = colMap[cIdx];
      if (!key) return;
      let val = cell.value;
      if (val && typeof val === 'object') {
        if (val.text) val = val.text;
        else if (val.result !== undefined) val = val.result;
        else if (val.richText) val = val.richText.map(t => t.text).join('');
        else if (val instanceof Date) {
          const d = val;
          const pad = n => String(n).padStart(2, '0');
          val = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        }
      }
      val = (val == null) ? '' : String(val).trim();
      if (val) hasData = true;
      obj[key] = val;
    });
    if (hasData) rows.push({ rowNum: rIdx, data: obj });
  });
  return rows;
}

async function bulkImportGuru(rows) {
  const results = [];
  for (const r of rows) {
    try {
      if (!r.data.nama) {
        results.push({ row: r.rowNum, ok: false, error: 'Nama kosong' });
        continue;
      }
      const existing = r.data.nip ? PKGDB.findGuruByNIP(r.data.nip) : null;
      const saved = PKGDB.saveGuru(r.data, existing ? existing.id : null);
      results.push({ row: r.rowNum, ok: true, action: existing ? 'update' : 'new', nama: saved.nama, id: saved.id });
    } catch (err) {
      results.push({ row: r.rowNum, ok: false, error: err.message });
    }
  }
  return results;
}

async function bulkImportKamad(rows) {
  const results = [];
  const existing = PKGDB.listKamad();
  for (const r of rows) {
    try {
      if (!r.data.nama_madrasah) {
        results.push({ row: r.rowNum, ok: false, error: 'Nama Madrasah kosong' });
        continue;
      }
      // Upsert by nama_madrasah (case-insensitive)
      const key = r.data.nama_madrasah.toLowerCase().trim();
      const found = existing.find(k => (k.nama_madrasah || '').toLowerCase().trim() === key);
      const saved = PKGDB.saveKamad(r.data, found ? found.id : null);
      results.push({ row: r.rowNum, ok: true, action: found ? 'update' : 'new', nama: saved.nama, id: saved.id });
    } catch (err) {
      results.push({ row: r.rowNum, ok: false, error: err.message });
    }
  }
  return results;
}

function renderImportResult(target, results) {
  const ok = results.filter(r => r.ok).length;
  const fail = results.filter(r => !r.ok).length;
  target.innerHTML = `
  <div class="card mt-3">
    <div class="card-header d-flex justify-content-between">
      <span>Hasil Import Excel</span>
      <span class="small text-muted">${ok} sukses / ${fail} gagal</span>
    </div>
    <div class="table-responsive"><table class="table table-sm mb-0">
      <thead class="table-light"><tr><th>Baris</th><th>Status</th><th>Detail</th></tr></thead>
      <tbody>
        ${results.map(r => r.ok
          ? `<tr><td>${r.row}</td><td><span class="badge bg-${r.action === 'update' ? 'info' : 'success'}">${r.action === 'update' ? 'UPDATE' : 'BARU'}</span></td><td>${e(r.nama)}</td></tr>`
          : `<tr class="table-danger"><td>${r.row}</td><td><span class="badge bg-danger">GAGAL</span></td><td class="small">${e(r.error)}</td></tr>`
        ).join('')}
      </tbody>
    </table></div>
  </div>`;
}

function openImportDialog(title, columns, bulkFn, onDone) {
  const modalHtml = `
  <div class="modal fade" id="import-modal" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">${e(title)}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-info small">
            <i class="bi bi-info-circle"></i> Pastikan pakai <strong>file template Excel</strong> dari tombol "Template". Header kolom tidak boleh diubah.
          </div>
          <div class="mb-3">
            <label class="form-label">File Excel (.xlsx)</label>
            <input type="file" id="imp-file" class="form-control" accept=".xlsx">
          </div>
          <div id="imp-result"></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-light" data-bs-dismiss="modal">Tutup</button>
          <button type="button" class="btn btn-primary" id="btn-imp-go"><i class="bi bi-upload"></i> Import</button>
        </div>
      </div>
    </div>
  </div>`;
  // Cleanup any existing modal
  document.getElementById('import-modal')?.remove();
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  const modalEl = document.getElementById('import-modal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
  modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove(), { once: true });

  document.getElementById('btn-imp-go').addEventListener('click', async () => {
    const f = document.getElementById('imp-file').files[0];
    const result = document.getElementById('imp-result');
    if (!f) { result.innerHTML = '<div class="alert alert-warning">Pilih file Excel dulu.</div>'; return; }
    result.innerHTML = '<div class="alert alert-info"><i class="bi bi-hourglass"></i> Memproses...</div>';
    try {
      const rows = await importFlatXlsx(f, columns);
      if (rows.length === 0) { result.innerHTML = '<div class="alert alert-warning">File kosong, tidak ada baris data.</div>'; return; }
      const results = await bulkFn(rows);
      renderImportResult(result, results);
      if (typeof onDone === 'function') onDone(results);
    } catch (err) {
      console.error(err);
      result.innerHTML = `<div class="alert alert-danger"><i class="bi bi-exclamation-triangle"></i> ${e(err.message)}</div>`;
    }
  });
}

// === GURU LIST ==========================================================
function viewGuruList(view) {
  const { query } = parseHash();
  const q = query.q || '';
  const rows = PKGDB.listGuru(q);
  view.innerHTML = `
  <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
    <h4 class="mb-0"><i class="bi bi-people"></i> Data Guru <span class="badge bg-secondary">${rows.length}</span></h4>
    <div class="d-flex gap-2 flex-wrap">
      <button id="btn-tpl-guru" class="btn btn-outline-secondary btn-sm" title="Download template Excel"><i class="bi bi-file-earmark-excel"></i> Template</button>
      <button id="btn-imp-guru" class="btn btn-outline-success btn-sm" title="Import dari Excel"><i class="bi bi-upload"></i> Import</button>
      ${rows.length > 0 ? `<button id="btn-del-all-guru" class="btn btn-outline-danger btn-sm" title="Hapus semua data guru"><i class="bi bi-trash3"></i> Hapus Semua</button>` : ''}
      <a href="#/guru/new" class="btn btn-primary"><i class="bi bi-plus-lg"></i> Tambah Guru</a>
    </div>
  </div>
  <div class="card mb-3"><div class="card-body py-2">
    <input id="search" class="form-control form-control-sm" placeholder="Cari nama, NIP, atau madrasah..." value="${e(q)}">
  </div></div>
  <div class="card">
    <div class="table-responsive">
      <table class="table table-sm table-hover mb-0 align-middle">
        <thead class="table-light"><tr>
          <th>#</th><th>Nama / NIP</th><th>Madrasah</th><th>Mapel/Kelas</th><th>Tahun</th><th></th>
        </tr></thead>
        <tbody>
          ${rows.length === 0 ? '<tr><td colspan="6" class="text-center text-muted py-4">Belum ada data guru. Klik "Tambah Guru" atau gunakan menu Import.</td></tr>' : ''}
          ${rows.map((g, i) => `
            <tr>
              <td>${i + 1}</td>
              <td><a href="#/guru/${g.id}" class="fw-semibold">${e(g.nama)}</a><div class="small text-muted">${e(g.nip || '-')}</div></td>
              <td>${e(g.nama_madrasah || '-')}</td>
              <td>${e(g.mapel_kelas || '-')}</td>
              <td class="small">${e(g.tahun_pelajaran || '-')}</td>
              <td class="text-end">
                <a class="btn btn-sm btn-outline-secondary" href="#/guru/${g.id}" title="Lihat Detail"><i class="bi bi-eye"></i></a>
                <a class="btn btn-sm btn-outline-primary" href="#/guru/${g.id}/edit" title="Edit"><i class="bi bi-pencil"></i></a>
                <button class="btn btn-sm btn-outline-danger" data-del-guru="${g.id}" data-del-name="${e(g.nama)}" title="Hapus"><i class="bi bi-trash"></i></button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>`;

  $('#search').addEventListener('input', (ev) => {
    const v = ev.target.value;
    history.replaceState(null, '', '#/guru' + (v ? `?q=${encodeURIComponent(v)}` : ''));
    viewGuruList(view); // re-render
    setTimeout(() => $('#search').focus(), 0);
  });

  $$('[data-del-guru]').forEach(b => {
    b.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const id = b.dataset.delGuru;
      const nm = b.dataset.delName;
      // Cek apakah ada penilaian terkait
      const penilaianCount = PKGDB.listPenilaianByGuru(id).length;
      const warn = penilaianCount > 0
        ? `\n\n⚠️ Guru ini punya ${penilaianCount} penilaian aktif. Penilaian & skornya juga akan IKUT TERHAPUS.`
        : '';
      if (!confirm(`Hapus data guru "${nm}"?${warn}\n\nAksi ini tidak bisa dibatalkan.`)) return;
      PKGDB.deleteGuru(id);
      toast('Guru dihapus');
      viewGuruList(view);
    });
  });

  $('#btn-del-all-guru')?.addEventListener('click', () => {
    const total = rows.length;
    const stats = PKGDB.getStats();
    const msg = `⚠️ HAPUS SEMUA DATA GURU?\n\nAkan menghapus:\n- ${total} guru\n- ${stats.penilaian || 0} penilaian (semua skor & data terkait)\n- Data kehadiran & PKB seluruh guru\n\nData kepala madrasah TIDAK terhapus.\nAksi ini TIDAK BISA DIBATALKAN.\n\nKlik OK untuk lanjut, lalu konfirmasi sekali lagi.`;
    if (!confirm(msg)) return;
    const typed = prompt(`Untuk konfirmasi, ketik: HAPUS SEMUA`);
    if (typed !== 'HAPUS SEMUA') { toast('Dibatalkan, teks konfirmasi tidak cocok', 'warning'); return; }
    PKGDB.deleteAllGuru();
    toast(`${total} guru dan semua data terkait dihapus`);
    viewGuruList(view);
  });

  $('#btn-tpl-guru').addEventListener('click', () => {
    downloadTemplateExcel('guru', GURU_COLUMNS, {
      nama: 'Budi Santoso, S.Pd.', nip: '198501012010011001', nuptk: '1234567890123456',
      nama_madrasah: 'MA Negeri 1 Jember', jenjang: 'MA', mapel_kelas: 'Matematika - X IPA 1',
      tahun_pelajaran: '2025/2026',
    });
  });
  $('#btn-imp-guru').addEventListener('click', () => {
    openImportDialog('Import Data Guru dari Excel', GURU_COLUMNS, bulkImportGuru, () => {
      viewGuruList(view);
    });
  });
}

// === GURU FORM ==========================================================
function viewGuruForm(view, editId) {
  const isNew = !editId;
  const g = isNew ? {} : (PKGDB.getGuru(editId) || {});
  if (!isNew && !g.id) {
    view.innerHTML = '<div class="alert alert-warning">Guru tidak ditemukan</div>';
    return;
  }

  const field = (name, label, type, opts) => {
    opts = opts || {};
    const val = g[name] !== undefined && g[name] !== null ? g[name] : (opts.default || '');
    if (type === 'select') {
      return `<label class="form-label">${label}</label><select class="form-select" name="${name}">
        <option value="">-</option>
        ${opts.options.map(o => `<option ${val === o ? 'selected' : ''}>${o}</option>`).join('')}
      </select>`;
    }
    return `<label class="form-label">${label}${opts.required ? ' *' : ''}</label><input type="${type || 'text'}" class="form-control" name="${name}" value="${e(val)}" ${opts.required ? 'required' : ''}>`;
  };

  view.innerHTML = `
  <h4 class="mb-3"><i class="bi bi-person-${isNew ? 'plus' : 'gear'}"></i> ${isNew ? 'Tambah' : 'Edit'} Data Guru</h4>
  <form id="form-guru" class="card">
    <div class="card-body">
      <h6 class="text-muted text-uppercase small mb-3">Identitas</h6>
      <div class="row g-3 mb-4">
        <div class="col-md-8">${field('nama', 'Nama Guru', 'text', { required: true })}</div>
        <div class="col-md-4">${field('jenis_kelamin', 'Jenis Kelamin', 'select', { options: ['L', 'P'] })}</div>
        <div class="col-md-4">${field('nip', 'NIP', 'text')}</div>
        <div class="col-md-4">${field('nuptk', 'NUPTK', 'text')}</div>
        <div class="col-md-4">${field('nrg', 'NRG', 'text')}</div>
        <div class="col-md-4">${field('no_karpeg', 'No. Karpeg', 'text')}</div>
        <div class="col-md-4">${field('tempat_lahir', 'Tempat Lahir', 'text')}</div>
        <div class="col-md-4">${field('tanggal_lahir', 'Tanggal Lahir', 'date')}</div>
        <div class="col-md-6">${field('pendidikan', 'Pendidikan Terakhir', 'text')}</div>
        <div class="col-md-3">${field('pangkat_gol', 'Pangkat/Gol', 'text')}</div>
        <div class="col-md-3">${field('tmt_gol', 'TMT Golongan', 'text')}</div>
        <div class="col-md-3">${field('tmt_guru', 'TMT Sebagai Guru', 'text')}</div>
      </div>

      <h6 class="text-muted text-uppercase small mb-3">Tugas & Beban</h6>
      <div class="row g-3 mb-4">
        <div class="col-md-6">${field('mapel_kelas', 'Mata Pelajaran / Kelas', 'text')}</div>
        <div class="col-md-3">${field('jjm', 'JJM', 'number')}</div>
        <div class="col-md-3">${field('jjm_lembaga_lain', 'JJM Lembaga Lain', 'number')}</div>
        <div class="col-md-4">${field('tugas_tambahan_1', 'Tugas Tambahan 1', 'text')}</div>
        <div class="col-md-4">${field('tugas_tambahan_2', 'Tugas Tambahan 2', 'text')}</div>
        <div class="col-md-4">${field('tugas_tambahan_3', 'Tugas Tambahan 3', 'text')}</div>
        <div class="col-md-12">${field('tugas_lembaga_lain', 'Tugas di Lembaga Lain', 'text')}</div>
      </div>

      <h6 class="text-muted text-uppercase small mb-3">Madrasah & Penilai</h6>
      <div class="row g-3">
        <div class="col-md-8">${field('nama_madrasah', 'Nama Madrasah', 'text')}</div>
        <div class="col-md-4">${field('tahun_pelajaran', 'Tahun Pelajaran', 'text', { default: '2025/2026' })}</div>
        <div class="col-md-9">${field('alamat_madrasah', 'Alamat Madrasah', 'text')}</div>
        <div class="col-md-3">${field('semester', 'Semester', 'select', { options: ['Ganjil', 'Genap'] })}</div>
        <div class="col-md-6">${field('kkm', 'KKM (Kelompok Kerja Madrasah)', 'text')}</div>
        <div class="col-md-6">${field('kabupaten', 'Kabupaten/Kota', 'text')}</div>
        <div class="col-md-6">${field('nama_kamad', 'Kepala Madrasah', 'text')}</div>
        <div class="col-md-6">${field('nip_kamad', 'NIP Kamad', 'text')}</div>
        <div class="col-md-5">${field('nama_penilai', 'Nama Penilai', 'text')}</div>
        <div class="col-md-4">${field('nip_penilai', 'NIP Penilai', 'text')}</div>
        <div class="col-md-3">${field('jabatan_penilai', 'Jabatan Penilai', 'text')}</div>
      </div>
    </div>
    <div class="card-footer text-end bg-white">
      <a href="${isNew ? '#/guru' : '#/guru/' + g.id}" class="btn btn-light">Batal</a>
      <button type="submit" class="btn btn-primary"><i class="bi bi-check-lg"></i> Simpan</button>
    </div>
  </form>`;

  $('#form-guru').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const data = {};
    for (const [k, v] of fd.entries()) data[k] = v;
    const row = PKGDB.saveGuru(data, isNew ? null : editId);
    toast(isNew ? 'Guru ditambahkan' : 'Perubahan disimpan');
    navigate('/guru/' + row.id);
  });
}

// === GURU DETAIL ========================================================
function viewGuruDetail(view, id) {
  const g = PKGDB.getGuru(id);
  if (!g) {
    view.innerHTML = '<div class="alert alert-warning">Guru tidak ditemukan. <a href="#/guru">Kembali</a></div>';
    return;
  }
  const allPen = PKGDB.listPenilaianByGuru(id);
  const penilaian = allPen.map(p => {
    const n = PKGDB.hitungNilai(p.id, p.role_code);
    const total = PKGDB.getInstrumen(p.role_code).length;
    const terisi = PKGDB.countSkor(p.id);
    const meta = PKGDB.getRoleMeta(p.role_code) || {};
    return { ...p, terisi, total, role_label: meta.role_label || p.role_code, nilai: n.nilaiAkhir, sebutan: n.sebutan };
  });
  const kehadiran = PKGDB.listKehadiran(id);
  const pkb = PKGDB.listPKB(id);

  view.innerHTML = `
  <div class="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
    <div>
      <div class="small"><a href="#/guru"><i class="bi bi-arrow-left"></i> Daftar Guru</a></div>
      <h4 class="mb-1"><i class="bi bi-person-vcard"></i> ${e(g.nama)}</h4>
      <div class="text-muted">${e(g.nip || 'NIP -')} &middot; ${e(g.nama_madrasah || '-')} &middot; ${e(g.mapel_kelas || '-')}</div>
    </div>
    <div class="d-flex gap-2">
      <a href="#/guru/${g.id}/edit" class="btn btn-outline-secondary btn-sm"><i class="bi bi-pencil"></i> Edit</a>
      <button id="btn-delete" class="btn btn-outline-danger btn-sm"><i class="bi bi-trash"></i> Hapus</button>
    </div>
  </div>

  <ul class="nav nav-tabs mb-3" id="tabs">
    <li class="nav-item"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#t-penilaian">Penilaian</button></li>
    <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#t-kehadiran">Kehadiran</button></li>
    <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#t-pkb">PKB</button></li>
    <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#t-info">Identitas</button></li>
  </ul>

  <div class="tab-content">
    <div class="tab-pane fade show active" id="t-penilaian">
      ${penilaian.length > 0 ? `
        <div class="card mb-3">
          <div class="card-header">Ringkasan Penilaian</div>
          <div class="table-responsive">
            <table class="table table-sm mb-0 align-middle">
              <thead class="table-light"><tr><th>Peran</th><th>Jenis</th><th>Status</th><th class="text-end">Nilai</th><th>Sebutan</th><th>Tanggal</th><th></th></tr></thead>
              <tbody>
                ${penilaian.map(p => {
                  const cls = p.terisi === 0 ? 'badge-status-belum' : (p.terisi < p.total ? 'badge-status-sebagian' : 'badge-status-selesai');
                  return `
                    <tr>
                      <td>${e(p.role_label)}</td>
                      <td><span class="badge bg-secondary text-uppercase">${e(p.jenis)}</span></td>
                      <td><span class="badge ${cls}">${p.terisi}/${p.total}</span></td>
                      <td class="text-end fw-bold">${p.nilai.toFixed(2)}</td>
                      <td>${e(p.sebutan)}</td>
                      <td class="small">${e(p.tanggal || '-')}</td>
                      <td class="text-end">
                        <a class="btn btn-sm btn-primary" href="#/guru/${g.id}/nilai/${p.role_code}?jenis=${p.jenis}">Nilai</a>
                        <a class="btn btn-sm btn-outline-secondary" href="#/guru/${g.id}/cetak/${p.role_code}?jenis=${p.jenis}"><i class="bi bi-printer"></i></a>
                      </td>
                    </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>` : ''}

      <div class="card">
        <div class="card-header">Mulai / Lanjutkan Penilaian</div>
        <div class="card-body">
          <div class="row g-2">
            ${PKGDB.ROLES.map(r => `
              <div class="col-md-6 col-lg-4">
                <div class="border rounded p-3 h-100 d-flex flex-column">
                  <div class="fw-semibold">${e(r.role_label)}</div>
                  <div class="small text-muted mb-2">${e(r.role_code)} &middot; skor 0-${r.max_score}</div>
                  <div class="mt-auto d-flex gap-2">
                    <a class="btn btn-sm btn-primary flex-grow-1" href="#/guru/${g.id}/nilai/${r.role_code}?jenis=sumatif">Sumatif</a>
                    <a class="btn btn-sm btn-outline-primary flex-grow-1" href="#/guru/${g.id}/nilai/${r.role_code}?jenis=formatif">Formatif</a>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>

    <div class="tab-pane fade" id="t-kehadiran">
      <div class="card mb-3">
        <div class="card-header">Tambah / Ubah Kehadiran Bulanan</div>
        <form id="form-kehadiran" class="card-body row g-2">
          <div class="col-md-2"><label class="form-label small">Bulan</label>
            <select class="form-select form-select-sm" name="bulan" required>
              ${NAMA_BLN_SHORT.slice(1).map((m, i) => `<option value="${i + 1}">${m}</option>`).join('')}
            </select>
          </div>
          <div class="col-md-2"><label class="form-label small">Tahun</label><input type="number" class="form-control form-control-sm" name="tahun" value="${new Date().getFullYear()}" required></div>
          <div class="col"><label class="form-label small">Hari Efektif</label><input type="number" class="form-control form-control-sm" name="hari_efektif" value="0"></div>
          <div class="col"><label class="form-label small">Hadir</label><input type="number" class="form-control form-control-sm" name="hadir" value="0"></div>
          <div class="col"><label class="form-label small">Sakit</label><input type="number" class="form-control form-control-sm" name="sakit" value="0"></div>
          <div class="col"><label class="form-label small">Izin</label><input type="number" class="form-control form-control-sm" name="izin" value="0"></div>
          <div class="col"><label class="form-label small">Alpa</label><input type="number" class="form-control form-control-sm" name="alpa" value="0"></div>
          <div class="col"><label class="form-label small">Cuti</label><input type="number" class="form-control form-control-sm" name="cuti" value="0"></div>
          <div class="col"><label class="form-label small">Dinas</label><input type="number" class="form-control form-control-sm" name="dinas" value="0"></div>
          <div class="col-md-1 d-flex align-items-end"><button class="btn btn-sm btn-primary w-100"><i class="bi bi-plus-lg"></i></button></div>
        </form>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="table table-sm mb-0">
            <thead class="table-light"><tr><th>Bulan</th><th>Tahun</th><th>Efektif</th><th>Hadir</th><th>Sakit</th><th>Izin</th><th>Alpa</th><th>Cuti</th><th>Dinas</th><th>%</th><th></th></tr></thead>
            <tbody id="kh-tbody">
              ${kehadiran.length === 0 ? '<tr><td colspan="11" class="text-center text-muted py-3">Belum ada data</td></tr>' : ''}
              ${kehadiran.map(k => {
                const pct = k.hari_efektif ? ((k.hadir / k.hari_efektif) * 100).toFixed(1) + '%' : '-';
                return `<tr>
                  <td>${NAMA_BLN_SHORT[k.bulan]}</td><td>${k.tahun}</td><td>${k.hari_efektif}</td><td>${k.hadir}</td><td>${k.sakit}</td><td>${k.izin}</td><td>${k.alpa}</td><td>${k.cuti}</td><td>${k.dinas}</td><td>${pct}</td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-link text-primary p-0 me-2" data-edit-kh='${e(JSON.stringify(k))}' title="Edit"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-link text-danger p-0" data-del-kh="${k.id}" title="Hapus"><i class="bi bi-trash"></i></button>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="tab-pane fade" id="t-pkb">
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
          <span>Rencana Pengembangan Keprofesian Berkelanjutan (PKB)</span>
          <button type="button" id="btn-pkb-auto" class="btn btn-sm btn-outline-success" title="Isi otomatis dari kompetensi terlemah hasil penilaian"><i class="bi bi-magic"></i> Auto-Fill dari Hasil Penilaian</button>
        </div>
        <form id="form-pkb" class="card-body">
          ${[1,2,3].map(i => {
            const p = pkb.find(x => x.prioritas === i) || {};
            return `
            <div class="mb-3 p-3 border rounded" data-pkb-row="${i}">
              <div class="fw-semibold mb-2">Prioritas ${i}</div>
              <div class="row g-2">
                <div class="col-md-4"><label class="form-label small">Kompetensi</label><textarea class="form-control" name="kompetensi_${i}" rows="4">${e(p.kompetensi || '')}</textarea></div>
                <div class="col-md-4"><label class="form-label small">Rencana Kegiatan</label><textarea class="form-control" name="rencana_${i}" rows="4">${e(p.rencana || '')}</textarea></div>
                <div class="col-md-4"><label class="form-label small">Target</label><textarea class="form-control" name="target_${i}" rows="4">${e(p.target || '')}</textarea></div>
              </div>
            </div>`;
          }).join('')}
          <button class="btn btn-primary"><i class="bi bi-check-lg"></i> Simpan PKB</button>
        </form>
      </div>
    </div>

    <div class="tab-pane fade" id="t-info">
      <div class="card"><div class="card-body">
        <dl class="row mb-0">
          <dt class="col-sm-3">Nama</dt><dd class="col-sm-9">${e(g.nama || '-')}</dd>
          <dt class="col-sm-3">NIP / NUPTK / NRG</dt><dd class="col-sm-9">${e(g.nip || '-')} / ${e(g.nuptk || '-')} / ${e(g.nrg || '-')}</dd>
          <dt class="col-sm-3">Tempat, Tgl Lahir</dt><dd class="col-sm-9">${e(g.tempat_lahir || '-')}, ${e(g.tanggal_lahir || '-')}</dd>
          <dt class="col-sm-3">Pendidikan</dt><dd class="col-sm-9">${e(g.pendidikan || '-')}</dd>
          <dt class="col-sm-3">Pangkat / TMT Gol</dt><dd class="col-sm-9">${e(g.pangkat_gol || '-')} / ${e(g.tmt_gol || '-')}</dd>
          <dt class="col-sm-3">TMT Guru</dt><dd class="col-sm-9">${e(g.tmt_guru || '-')}</dd>
          <dt class="col-sm-3">Mapel/Kelas</dt><dd class="col-sm-9">${e(g.mapel_kelas || '-')} (JJM: ${e(g.jjm || 0)})</dd>
          <dt class="col-sm-3">Tugas Tambahan</dt><dd class="col-sm-9">${[g.tugas_tambahan_1, g.tugas_tambahan_2, g.tugas_tambahan_3].filter(Boolean).map(e).join(' &middot; ') || '-'}</dd>
          <dt class="col-sm-3">Madrasah</dt><dd class="col-sm-9">${e(g.nama_madrasah || '-')}</dd>
          <dt class="col-sm-3">Kepala Madrasah</dt><dd class="col-sm-9">${e(g.nama_kamad || '-')} (${e(g.nip_kamad || '-')})</dd>
          <dt class="col-sm-3">Penilai</dt><dd class="col-sm-9">${e(g.nama_penilai || '-')} (${e(g.nip_penilai || '-')}) &middot; ${e(g.jabatan_penilai || '-')}</dd>
          <dt class="col-sm-3">Tahun / Semester</dt><dd class="col-sm-9">${e(g.tahun_pelajaran || '-')} / ${e(g.semester || '-')}</dd>
        </dl>
      </div></div>
    </div>
  </div>`;

  $('#btn-delete').addEventListener('click', () => {
    if (confirm(`Hapus guru "${g.nama}" beserta seluruh penilaiannya?`)) {
      PKGDB.deleteGuru(id);
      toast('Guru dihapus');
      navigate('/guru');
    }
  });

  $('#form-kehadiran').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const fd = Object.fromEntries(new FormData(ev.target));
    PKGDB.upsertKehadiran(id, fd);
    toast('Kehadiran disimpan');
    viewGuruDetail(view, id);
    setTimeout(() => $('#tabs button[data-bs-target="#t-kehadiran"]').click(), 0);
  });

  $$('[data-del-kh]').forEach(b => {
    b.addEventListener('click', () => {
      if (confirm('Hapus data kehadiran?')) {
        PKGDB.deleteKehadiran(b.dataset.delKh);
        viewGuruDetail(view, id);
        setTimeout(() => $('#tabs button[data-bs-target="#t-kehadiran"]').click(), 0);
      }
    });
  });

  $$('[data-edit-kh]').forEach(b => {
    b.addEventListener('click', () => {
      try {
        const k = JSON.parse(b.dataset.editKh);
        const form = document.getElementById('form-kehadiran');
        form.querySelector('[name="bulan"]').value = k.bulan;
        form.querySelector('[name="tahun"]').value = k.tahun;
        form.querySelector('[name="hari_efektif"]').value = k.hari_efektif || 0;
        form.querySelector('[name="hadir"]').value = k.hadir || 0;
        form.querySelector('[name="sakit"]').value = k.sakit || 0;
        form.querySelector('[name="izin"]').value = k.izin || 0;
        form.querySelector('[name="alpa"]').value = k.alpa || 0;
        form.querySelector('[name="cuti"]').value = k.cuti || 0;
        form.querySelector('[name="dinas"]').value = k.dinas || 0;
        // Tombol simpan diubah label-nya supaya jelas mode edit
        const submitBtn = form.querySelector('button[type="submit"], button:not([type])');
        if (submitBtn) {
          submitBtn.innerHTML = '<i class="bi bi-check-lg"></i>';
          submitBtn.classList.remove('btn-primary');
          submitBtn.classList.add('btn-success');
          submitBtn.title = 'Simpan perubahan';
        }
        // Scroll ke form & focus
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        toast(`Edit data ${NAMA_BLN_SHORT[k.bulan]} ${k.tahun} — ubah lalu klik Simpan`);
      } catch (err) {
        toast('Gagal load data', 'danger');
      }
    });
  });

  $('#form-pkb').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const fd = Object.fromEntries(new FormData(ev.target));
    const items = [1,2,3].map(i => ({
      prioritas: i,
      kompetensi: fd[`kompetensi_${i}`],
      rencana: fd[`rencana_${i}`],
      target: fd[`target_${i}`],
    }));
    PKGDB.replacePKB(id, items);
    toast('PKB disimpan');
    viewGuruDetail(view, id);
    setTimeout(() => $('#tabs button[data-bs-target="#t-pkb"]').click(), 0);
  });

  $('#btn-pkb-auto').addEventListener('click', () => {
    const suggestions = computePKBSuggestions(id);
    if (!suggestions || suggestions.length === 0) {
      toast('Belum ada hasil penilaian. Isi penilaian dulu sebelum auto-fill PKB.', 'warning');
      return;
    }
    // Cek apakah form sudah terisi -> konfirmasi overwrite
    const formEl = document.getElementById('form-pkb');
    const fd = new FormData(formEl);
    const hasContent = [1,2,3].some(i => (fd.get(`kompetensi_${i}`) || fd.get(`rencana_${i}`) || fd.get(`target_${i}`)));
    if (hasContent && !confirm('Form PKB sudah terisi. Overwrite dengan saran otomatis?')) return;
    suggestions.slice(0, 3).forEach((s, idx) => {
      const i = idx + 1;
      formEl.querySelector(`[name="kompetensi_${i}"]`).value = s.kompetensi;
      formEl.querySelector(`[name="rencana_${i}"]`).value = s.rencana;
      formEl.querySelector(`[name="target_${i}"]`).value = s.target;
    });
    // Sisanya kosongkan kalau saran < 3
    for (let i = suggestions.length + 1; i <= 3; i++) {
      formEl.querySelector(`[name="kompetensi_${i}"]`).value = '';
      formEl.querySelector(`[name="rencana_${i}"]`).value = '';
      formEl.querySelector(`[name="target_${i}"]`).value = '';
    }
    toast(`${suggestions.length} prioritas terisi otomatis. Periksa lalu Simpan.`);
  });
}

// === PKB AUTO-FILL HELPER ===============================================
// Pilih kompetensi terlemah dari semua sesi penilaian guru, urutkan ascending,
// generate Kompetensi/Rencana/Target sesuai pola Kemenag.
function computePKBSuggestions(guruId) {
  const pens = PKGDB.listPenilaianByGuru(guruId);
  if (pens.length === 0) return [];
  const kompStats = []; // { role_code, role_label, komp_no, komp_nama, sum, maks, pct }
  for (const pen of pens) {
    const meta = PKGDB.getRoleMeta(pen.role_code);
    if (!meta) continue;
    const instrumen = PKGDB.getInstrumen(pen.role_code);
    const skorMap = PKGDB.getSkorMap(pen.id);
    // Group instrumen per kompetensi
    const grouped = {};
    for (const it of instrumen) {
      if (!grouped[it.kompetensi_no]) {
        grouped[it.kompetensi_no] = { komp_no: it.kompetensi_no, komp_nama: it.kompetensi_nama, items: [] };
      }
      grouped[it.kompetensi_no].items.push(it);
    }
    for (const k of Object.values(grouped)) {
      let sum = 0, count = 0;
      for (const it of k.items) {
        const s = skorMap[it.id];
        if (typeof s === 'number') { sum += s; count++; }
      }
      if (count === 0) continue; // skip kompetensi yg belum dinilai sama sekali
      const maks = k.items.length * meta.max_score;
      const pct = maks ? (sum / maks) * 100 : 0;
      kompStats.push({
        role_code: pen.role_code,
        role_label: meta.role_label,
        jenis: pen.jenis,
        komp_no: k.komp_no,
        komp_nama: k.komp_nama,
        sum, maks, pct,
      });
    }
  }
  if (kompStats.length === 0) return [];
  // Urutkan ascending pct (terlemah dulu)
  kompStats.sort((a, b) => a.pct - b.pct);
  // Ambil top-3 unique (role_code+komp_no)
  const seen = new Set();
  const top = [];
  for (const k of kompStats) {
    const key = `${k.role_code}_${k.komp_no}`;
    if (seen.has(key)) continue;
    seen.add(key);
    top.push(k);
    if (top.length >= 3) break;
  }
  return top.map((k, idx) => ({
    kompetensi: `${k.role_label} - K${k.komp_no}: ${k.komp_nama} (${k.pct.toFixed(1)}%)`,
    rencana: pkbRencanaFor(k),
    target: pkbTargetFor(k, idx),
  }));
}

function pkbRencanaFor(k) {
  // Pola umum berdasar role + nomor kompetensi
  const generic = [
    'Diklat Fungsional / Bimtek',
    'Workshop / Lokakarya',
    'MGMP / KKG / MGBK',
    'PKB Mandiri (baca, refleksi, jurnal)',
    'Mentoring / Coaching dengan rekan',
    'Penelitian Tindakan Kelas (PTK)',
  ];
  // Map khusus per role+komp untuk rencana yang lebih spesifik
  const specific = {
    'GMP_3': 'Workshop pengembangan ATP/RPP/Modul Ajar berbasis Kurikulum Merdeka',
    'GMP_4': 'Diklat metode pembelajaran (Project-Based, Problem-Based, Diferensiasi)',
    'GMP_7': 'Bimtek penyusunan instrumen asesmen, analisis butir, & rapor pendidikan',
    'GMP_13': 'Diklat penguatan materi mapel + integrasi nilai keislaman',
    'GMP_14': 'PKB mandiri: PTK + publikasi (artikel/best practice/PKB digital)',
    'GMP_2': 'Workshop teori belajar abad 21 + asesmen formatif',
    'GMP_5': 'Diklat pembelajaran berdiferensiasi & 7 Kebiasaan Anak Indonesia Hebat',
    'BK_11': 'Bimtek instrumen non-tes BK (ITP, AUM, DCM)',
    'BK_13': 'Workshop perancangan program BK komprehensif',
    'BK_14': 'Diklat implementasi layanan BK kolaboratif',
    'BK_17': 'Pelatihan PTK BK + publikasi ilmiah',
    'TIK_2': 'Bimtek perencanaan layanan TIK madrasah (siswa-guru-tendik)',
    'TIK_8': 'Diklat penguasaan TIK terkini (LMS, AI, cloud, digital citizenship)',
    'TIK_9': 'Pelatihan menjadi fasilitator TIK guru (TPACK, content creation)',
    'LAB_3': 'Workshop manajemen laboratorium (program, jadwal, POS)',
    'LAB_6': 'Diklat K3 Laboratorium & penanganan B3',
    'PUS_2': 'Bimtek monev penyelenggaraan perpustakaan',
    'PUS_3': 'Diklat klasifikasi DDC & katalogisasi terkini',
    'PUS_5': 'Workshop kajian minat baca & literasi',
    'WKKUR_5': 'Diklat manajemen kurikulum operasional madrasah',
    'WKSIS_5': 'Workshop pembinaan kesiswaan berbasis minat-bakat',
    'WKSAR_5': 'Bimtek manajemen sarpras & K3 madrasah',
    'WKHUM_5': 'Diklat humas madrasah & manajemen mitra eksternal',
  };
  const key = `${k.role_code}_${k.komp_no}`;
  if (specific[key]) return specific[key];
  return generic[(k.komp_no - 1) % generic.length];
}

function pkbTargetFor(k, prioritasIdx) {
  // Target naikkan persentase, plus output konkret
  const current = k.pct;
  let targetPct = Math.min(100, Math.ceil((current + 15) / 5) * 5); // naik ~15% bulatkan ke 5
  if (current >= 90) targetPct = 100;
  // Output konkret per kompetensi
  const outputs = {
    'GMP_3': '1 paket Modul Ajar lengkap + ATP + LKPD',
    'GMP_4': 'Penerapan minimal 3 model pembelajaran inovatif/semester',
    'GMP_7': 'Instrumen asesmen 3 ranah + analisis butir + rapor',
    'GMP_13': 'Bahan ajar terintegrasi keislaman, referensi <3 thn',
    'GMP_14': 'Minimal 1 PTK + 1 artikel/best practice/karya inovatif',
    'GMP_5': 'RPP berdiferensiasi + jurnal 7 Kebiasaan',
    'BK_11': 'Bank instrumen non-tes BK terkalibrasi',
    'BK_13': 'Program BK komprehensif 1 tahun',
    'BK_17': 'Minimal 1 PTK BK terpublikasi',
    'TIK_8': 'Sertifikat penguasaan tools TIK terbaru',
    'TIK_9': 'Modul fasilitasi TIK untuk guru/tendik',
    'LAB_6': 'SOP K3 lab + penataan B3 + sertifikat K3',
    'PUS_3': 'Sistem katalog DDC terdigitalisasi',
    'WKKUR_5': 'KOM/Dokumen 1 disahkan + supervisi 100% guru',
    'WKSAR_5': 'Inventaris sarpras updated + K3 standar',
  };
  const key = `${k.role_code}_${k.komp_no}`;
  const out = outputs[key] || 'Peningkatan kompetensi terukur via diklat/PKB';
  return `Skor naik ke ≥ ${targetPct}% (saat ini ${current.toFixed(1)}%). ${out}.`;
}

// === NILAI ==============================================================
function viewNilai(view, guruId, role, jenis) {
  const g = PKGDB.getGuru(guruId);
  if (!g) { view.innerHTML = '<div class="alert alert-warning">Guru tidak ditemukan</div>'; return; }
  const meta = PKGDB.getRoleMeta(role);
  if (!meta) { view.innerHTML = '<div class="alert alert-warning">Peran tidak ditemukan</div>'; return; }
  jenis = jenis === 'formatif' ? 'formatif' : 'sumatif';
  const pen = PKGDB.getOrCreatePenilaian(guruId, role, jenis);
  const instrumen = PKGDB.getInstrumen(role);

  const grouped = [];
  for (const it of instrumen) {
    let cur = grouped[grouped.length - 1];
    if (!cur || cur.no !== it.kompetensi_no) {
      cur = { no: it.kompetensi_no, nama: it.kompetensi_nama, items: [] };
      grouped.push(cur);
    }
    cur.items.push(it);
  }
  const skorMap = PKGDB.getSkorMap(pen.id);
  const nilai = PKGDB.hitungNilai(pen.id, role);
  const maxScore = meta.max_score;

  // Pre-calc komp totals for display
  const kompTotals = {};
  for (const k of grouped) {
    let sum = 0, count = 0;
    for (const it of k.items) {
      const s = skorMap[it.id];
      if (typeof s === 'number') { sum += s; count++; }
    }
    const maks = k.items.length * maxScore;
    const pct = maks ? (sum / maks) * 100 : 0;
    kompTotals[k.no] = { sum, count, maks, pct };
  }

  view.innerHTML = `
  <div class="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
    <div>
      <div class="small"><a href="#/guru/${g.id}"><i class="bi bi-arrow-left"></i> ${e(g.nama)}</a></div>
      <h5 class="mb-0">Penilaian ${e(meta.role_label)} <span class="badge bg-secondary text-uppercase ms-2">${jenis}</span></h5>
    </div>
    <div class="d-flex gap-2 align-items-center">
      <a class="btn btn-sm btn-outline-secondary" href="#/guru/${g.id}/cetak/${role}?jenis=${jenis}"><i class="bi bi-printer"></i> Cetak</a>
      <a class="btn btn-sm btn-${jenis === 'sumatif' ? 'primary' : 'outline-primary'}" href="#/guru/${g.id}/nilai/${role}?jenis=sumatif">Sumatif</a>
      <a class="btn btn-sm btn-${jenis === 'formatif' ? 'primary' : 'outline-primary'}" href="#/guru/${g.id}/nilai/${role}?jenis=formatif">Formatif</a>
    </div>
  </div>

  <div class="row g-3">
    <div class="col-lg-9">
      <div class="card mb-3">
        <div class="card-body row g-2">
          <div class="col-md-4"><label class="form-label small">Tanggal Penilaian</label><input id="meta-tanggal" type="date" class="form-control form-control-sm" value="${e(pen.tanggal || '')}"></div>
          <div class="col-md-8"><label class="form-label small">Catatan</label><input id="meta-catatan" class="form-control form-control-sm" value="${e(pen.catatan || '')}"></div>
        </div>
      </div>

      ${grouped.map(k => `
        <div class="card kompetensi-card mb-3" data-komp="${k.no}">
          <div class="card-header d-flex justify-content-between">
            <span><span class="badge bg-primary me-1">K${k.no}</span> ${e(k.nama)}</span>
            <span class="text-muted small">${k.items.length} indikator</span>
          </div>
          <div class="card-body p-0">
            ${k.items.map(it => {
              const pg = PKGDB.getPenggalian(it.id);
              const hasPg = !!pg;
              return `
              <div class="indikator-row">
                <div class="text-muted small" style="min-width: 1.8rem;">${it.indikator_no}.</div>
                <div class="flex-grow-1">
                  <a href="#" class="text-decoration-none text-body" data-pg-ind="${e(it.id)}" data-pg-text="${e(it.indikator)}" data-pg-role="${e(meta.role_label)}" data-pg-komp="${e(k.nama)}" title="Klik untuk lihat catatan penggalian data">${e(it.indikator)}</a>
                  ${hasPg ? ' <span class="badge bg-info text-dark" style="font-size:.65rem" title="Ada catatan penggalian data">📋 catatan</span>' : ''}
                </div>
                <div class="skor-pill" data-iid="${e(it.id)}">
                  ${Array.from({ length: maxScore + 1 }, (_, v) => `
                    <input type="radio" id="s_${e(it.id)}_${v}" name="skor_${e(it.id)}" value="${v}" ${skorMap[it.id] === v ? 'checked' : ''}>
                    <label for="s_${e(it.id)}_${v}" class="lbl-${v}">${v}</label>
                  `).join('')}
                </div>
              </div>`;
            }).join('')}
            <div class="px-3 py-2 bg-light border-top d-flex flex-wrap gap-3 justify-content-end small fw-semibold" data-komp-summary="${k.no}">
              <span>Total Skor: <span class="text-primary" data-fld="sum">${kompTotals[k.no].sum}</span></span>
              <span>Skor Maks: <span data-fld="maks">${kompTotals[k.no].maks}</span></span>
              <span>Skor Perolehan: <span class="badge bg-primary" data-fld="pct">${kompTotals[k.no].pct.toFixed(2)}%</span></span>
            </div>
          </div>
        </div>
      `).join('')}

      <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap mb-4">
        <a class="btn btn-light" href="#/guru/${g.id}"><i class="bi bi-arrow-left"></i> Kembali</a>
        <div class="d-flex gap-2">
          <button id="btn-clear-all" class="btn btn-outline-danger"><i class="bi bi-x-circle"></i> Reset Semua</button>
          <button id="btn-save" class="btn btn-primary"><i class="bi bi-check-lg"></i> Simpan</button>
        </div>
      </div>
    </div>

    <div class="col-lg-3">
      <div class="sticky-summary">
        <div class="card nilai-akhir-box mb-3"><div class="card-body text-center">
          <div class="small opacity-75">Nilai Akhir</div>
          <div class="display-5 fw-bold" id="nilai-akhir">${nilai.nilaiAkhir.toFixed(2)}</div>
          <div class="fw-semibold" id="sebutan">${e(nilai.sebutan)}</div>
        </div></div>
        <div class="card mb-3"><div class="card-body py-2">
          <div class="d-flex justify-content-between small"><span>Skala Skor</span><span class="badge bg-light text-dark">0 - ${maxScore}</span></div>
          <div class="d-flex justify-content-between small text-muted"><span>Status</span><span id="save-status" class="save-status-saved">Tersimpan</span></div>
          <div class="text-tiny text-muted mt-2"><i class="bi bi-info-circle"></i> Skor tersimpan otomatis saat dipilih.</div>
        </div></div>
        <div class="card"><div class="card-header small">Kompetensi</div>
          <ul class="list-group list-group-flush small">
            ${grouped.map(k => `<li class="list-group-item d-flex justify-content-between">
              <span class="text-truncate me-2" style="max-width:70%">${k.no}. ${e(k.nama)}</span>
              <span class="badge bg-light text-dark">${k.items.length}</span>
            </li>`).join('')}
          </ul>
        </div>
      </div>
    </div>
  </div>`;

  function refreshKompSummary(kompNo) {
    const k = grouped.find(x => x.no === kompNo);
    if (!k) return;
    let sum = 0, count = 0;
    for (const it of k.items) {
      const s = PKGDB.getSkorMap(pen.id)[it.id];
      if (typeof s === 'number') { sum += s; count++; }
    }
    const maks = k.items.length * maxScore;
    const pct = maks ? (sum / maks) * 100 : 0;
    const sel = `[data-komp-summary="${kompNo}"]`;
    const root = document.querySelector(sel);
    if (root) {
      root.querySelector('[data-fld="sum"]').textContent = sum;
      root.querySelector('[data-fld="maks"]').textContent = maks;
      root.querySelector('[data-fld="pct"]').textContent = pct.toFixed(2) + '%';
    }
  }

  function refreshNilai() {
    const n = PKGDB.hitungNilai(pen.id, role);
    $('#nilai-akhir').textContent = n.nilaiAkhir.toFixed(2);
    $('#sebutan').textContent = n.sebutan;
  }

  $$('input[type=radio][name^="skor_"]').forEach(r => {
    r.addEventListener('change', () => {
      const iid = r.name.replace(/^skor_/, '');
      $('#save-status').textContent = 'Menyimpan...';
      $('#save-status').className = 'save-status-saving';
      try {
        PKGDB.setSkor(pen.id, iid, r.value);
        // Find komp_no from instrumen
        const inst = window.INSTRUMEN.find(i => `${i.role_code}_${i.kompetensi_no}_${i.indikator_no}` === iid);
        if (inst) refreshKompSummary(inst.kompetensi_no);
        refreshNilai();
        $('#save-status').textContent = 'Tersimpan';
        $('#save-status').className = 'save-status-saved';
      } catch (e) {
        $('#save-status').textContent = 'Gagal';
        $('#save-status').className = 'save-status-error';
      }
    });
  });

  // Click on indikator text -> open Catatan Penggalian Data popup
  view.addEventListener('click', (ev) => {
    const pgBtn = ev.target.closest('[data-pg-ind]');
    if (!pgBtn) return;
    if (!view.contains(pgBtn)) return;
    ev.preventDefault();
    ev.stopPropagation();
    openPenggalianDialog({
      id: pgBtn.dataset.pgInd,
      indikator: pgBtn.dataset.pgText,
      roleLabel: pgBtn.dataset.pgRole,
      kompNama: pgBtn.dataset.pgKomp,
      onSaved: () => {
        // Update badge inline (re-render whole view supaya state radio juga ngga reset)
        const newPg = PKGDB.getPenggalian(pgBtn.dataset.pgInd);
        const span = pgBtn.parentElement;
        // remove existing badge then re-add if exists
        span.querySelectorAll('.badge.bg-info').forEach(b => b.remove());
        if (newPg) {
          span.insertAdjacentHTML('beforeend', ' <span class="badge bg-info text-dark" style="font-size:.65rem" title="Ada catatan penggalian data">📋 catatan</span>');
        }
      },
    });
  });

  $('#btn-save').addEventListener('click', () => {
    saveMeta();
    toast('Penilaian disimpan');
    setTimeout(() => navigate('/guru/' + g.id), 400);
  });

  $('#btn-clear-all').addEventListener('click', () => {
    if (!confirm('Reset semua skor di lembar penilaian ini? Tindakan tidak bisa dibatalkan.')) return;
    for (const k of grouped) for (const it of k.items) PKGDB.setSkor(pen.id, it.id, null);
    toast('Semua skor di-reset');
    viewNilai(view, guruId, role, jenis);
  });

  let metaSaveTimer = null;
  function saveMeta() {
    PKGDB.updatePenilaianMeta(pen.id, {
      tanggal: $('#meta-tanggal').value || null,
      catatan: $('#meta-catatan').value || null,
    });
  }
  $('#meta-tanggal').addEventListener('change', saveMeta);
  $('#meta-catatan').addEventListener('input', () => {
    clearTimeout(metaSaveTimer);
    metaSaveTimer = setTimeout(saveMeta, 600);
  });
}

// === REKAP ==============================================================
// === PENILAIAN HUB ======================================================
function viewPenilaianHub(view) {
  const { query } = parseHash();
  const filterRole = query.role || '';
  const filterJenis = query.jenis || '';
  const filterStatus = query.status || '';
  const filterMadrasah = (query.madrasah || '').toLowerCase();
  const q = (query.q || '').toLowerCase();

  const allGuru = PKGDB.listGuru();
  const allPen = [];
  for (const g of allGuru) {
    const pens = PKGDB.listPenilaianByGuru(g.id);
    for (const p of pens) {
      const total = PKGDB.getInstrumen(p.role_code).length;
      const terisi = PKGDB.countSkor(p.id);
      const n = PKGDB.hitungNilai(p.id, p.role_code);
      const meta = PKGDB.getRoleMeta(p.role_code) || {};
      let status = 'belum';
      if (terisi > 0 && terisi < total) status = 'sebagian';
      else if (terisi >= total && total > 0) status = 'selesai';
      allPen.push({
        ...p,
        guru: g,
        role_label: meta.role_label || p.role_code,
        total, terisi, status,
        nilai: n.nilaiAkhir, sebutan: n.sebutan,
      });
    }
  }

  let filtered = allPen;
  if (filterRole) filtered = filtered.filter(p => p.role_code === filterRole);
  if (filterJenis) filtered = filtered.filter(p => p.jenis === filterJenis);
  if (filterStatus) filtered = filtered.filter(p => p.status === filterStatus);
  if (filterMadrasah) filtered = filtered.filter(p => (p.guru.nama_madrasah || '').toLowerCase().includes(filterMadrasah));
  if (q) filtered = filtered.filter(p =>
    (p.guru.nama || '').toLowerCase().includes(q) ||
    (p.guru.nip || '').toLowerCase().includes(q) ||
    (p.role_label || '').toLowerCase().includes(q)
  );
  filtered.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));

  const counts = {
    total: allPen.length,
    belum: allPen.filter(p => p.status === 'belum').length,
    sebagian: allPen.filter(p => p.status === 'sebagian').length,
    selesai: allPen.filter(p => p.status === 'selesai').length,
  };

  const madrasahList = Array.from(new Set(allGuru.map(g => g.nama_madrasah).filter(Boolean))).sort();

  view.innerHTML = `
  <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
    <h4 class="mb-0"><i class="bi bi-clipboard-check"></i> Penilaian PKG <span class="badge bg-secondary">${counts.total}</span></h4>
    <div class="d-flex gap-2 flex-wrap">
      ${counts.selesai > 0 ? `<button id="btn-pn-clean" class="btn btn-outline-warning btn-sm" title="Hapus semua sesi penilaian yang sudah SELESAI (sudah disupervisi)"><i class="bi bi-broom"></i> Hapus yang Selesai (${counts.selesai})</button>` : ''}
      <button id="btn-pn-new" class="btn btn-primary btn-sm"><i class="bi bi-plus-lg"></i> Mulai Penilaian Baru</button>
    </div>
  </div>

  <div class="row g-2 mb-3">
    <div class="col-md-3 col-6"><div class="card text-center"><div class="card-body py-2">
      <div class="small text-muted">Total Sesi</div><div class="h4 mb-0">${counts.total}</div>
    </div></div></div>
    <div class="col-md-3 col-6"><div class="card text-center"><div class="card-body py-2">
      <div class="small text-muted">Belum Diisi</div><div class="h4 mb-0 text-secondary">${counts.belum}</div>
    </div></div></div>
    <div class="col-md-3 col-6"><div class="card text-center"><div class="card-body py-2">
      <div class="small text-muted">Sebagian</div><div class="h4 mb-0 text-warning">${counts.sebagian}</div>
    </div></div></div>
    <div class="col-md-3 col-6"><div class="card text-center"><div class="card-body py-2">
      <div class="small text-muted">Selesai</div><div class="h4 mb-0 text-success">${counts.selesai}</div>
    </div></div></div>
  </div>

  <div class="card mb-3"><div class="card-body py-2">
    <div class="row g-2">
      <div class="col-md-3 col-6">
        <input id="f-q" class="form-control form-control-sm" placeholder="Cari guru / NIP / peran" value="${e(q)}">
      </div>
      <div class="col-md-2 col-6">
        <select id="f-role" class="form-select form-select-sm">
          <option value="">Semua Peran</option>
          ${PKGDB.ROLES.map(r => `<option value="${e(r.role_code)}" ${filterRole === r.role_code ? 'selected' : ''}>${e(r.role_label)}</option>`).join('')}
        </select>
      </div>
      <div class="col-md-2 col-6">
        <select id="f-jenis" class="form-select form-select-sm">
          <option value="">Semua Jenis</option>
          <option value="sumatif" ${filterJenis === 'sumatif' ? 'selected' : ''}>Sumatif</option>
          <option value="formatif" ${filterJenis === 'formatif' ? 'selected' : ''}>Formatif</option>
        </select>
      </div>
      <div class="col-md-2 col-6">
        <select id="f-status" class="form-select form-select-sm">
          <option value="">Semua Status</option>
          <option value="belum" ${filterStatus === 'belum' ? 'selected' : ''}>Belum Diisi</option>
          <option value="sebagian" ${filterStatus === 'sebagian' ? 'selected' : ''}>Sebagian</option>
          <option value="selesai" ${filterStatus === 'selesai' ? 'selected' : ''}>Selesai</option>
        </select>
      </div>
      <div class="col-md-3 col-12">
        <select id="f-madrasah" class="form-select form-select-sm">
          <option value="">Semua Madrasah</option>
          ${madrasahList.map(m => `<option value="${e(m)}" ${filterMadrasah === m.toLowerCase() ? 'selected' : ''}>${e(m)}</option>`).join('')}
        </select>
      </div>
    </div>
  </div></div>

  <div class="card">
    <div class="table-responsive">
      <table class="table table-sm table-hover mb-0 align-middle">
        <thead class="table-light"><tr>
          <th>#</th><th>Guru</th><th>Madrasah</th><th>Peran</th><th>Jenis</th><th>Status</th><th class="text-end">Nilai</th><th>Sebutan</th><th>Tanggal</th><th></th>
        </tr></thead>
        <tbody>
          ${filtered.length === 0 ? `<tr><td colspan="10" class="text-center text-muted py-4">${allPen.length === 0 ? 'Belum ada sesi penilaian. Klik "Mulai Penilaian Baru".' : 'Tidak ada hasil dgn filter ini.'}</td></tr>` : ''}
          ${filtered.map((p, i) => {
            const cls = p.status === 'belum' ? 'badge-status-belum' : (p.status === 'sebagian' ? 'badge-status-sebagian' : 'badge-status-selesai');
            return `<tr>
              <td>${i + 1}</td>
              <td><a href="#/guru/${p.guru.id}">${e(p.guru.nama)}</a><div class="small text-muted">${e(p.guru.nip || '-')}</div></td>
              <td class="small">${e(p.guru.nama_madrasah || '-')}</td>
              <td>${e(p.role_label)}</td>
              <td><span class="badge bg-secondary text-uppercase">${e(p.jenis)}</span></td>
              <td><span class="badge ${cls}">${p.terisi}/${p.total}</span></td>
              <td class="text-end fw-bold">${p.terisi > 0 ? p.nilai.toFixed(2) : '-'}</td>
              <td>${p.terisi > 0 ? e(p.sebutan) : '-'}</td>
              <td class="small">${e(p.tanggal || (p.updated_at ? p.updated_at.slice(0, 10) : '-'))}</td>
              <td class="text-end">
                <a class="btn btn-sm btn-primary" href="#/guru/${p.guru.id}/nilai/${p.role_code}?jenis=${p.jenis}">Lanjutkan</a>
                <a class="btn btn-sm btn-outline-secondary" href="#/guru/${p.guru.id}/cetak/${p.role_code}?jenis=${p.jenis}" title="Cetak"><i class="bi bi-printer"></i></a>
                <button class="btn btn-sm btn-outline-danger" data-del-pen="${p.id}" data-del-guru-name="${e(p.guru.nama)}" data-del-role="${e(p.role_label)}" data-del-jenis="${e(p.jenis)}" data-del-terisi="${p.terisi}" title="Hapus penilaian ini"><i class="bi bi-trash"></i></button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;

  function applyFilters() {
    const params = new URLSearchParams();
    const v = $('#f-q').value.trim(); if (v) params.set('q', v);
    const r = $('#f-role').value; if (r) params.set('role', r);
    const j = $('#f-jenis').value; if (j) params.set('jenis', j);
    const s = $('#f-status').value; if (s) params.set('status', s);
    const m = $('#f-madrasah').value; if (m) params.set('madrasah', m);
    location.hash = '#/penilaian' + (params.toString() ? '?' + params.toString() : '');
  }

  $('#f-q').addEventListener('input', () => {
    clearTimeout(window.__hubT);
    window.__hubT = setTimeout(applyFilters, 300);
  });
  $('#f-role').addEventListener('change', applyFilters);
  $('#f-jenis').addEventListener('change', applyFilters);
  $('#f-status').addEventListener('change', applyFilters);
  $('#f-madrasah').addEventListener('change', applyFilters);

  $('#btn-pn-new').addEventListener('click', () => openPenilaianBaruDialog());

  // Hapus per-baris
  $$('[data-del-pen]').forEach(b => {
    b.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const id = b.dataset.delPen;
      const nm = b.dataset.delGuruName;
      const role = b.dataset.delRole;
      const jenis = b.dataset.delJenis;
      const terisi = parseInt(b.dataset.delTerisi || '0');
      const warn = terisi > 0 ? `\n\n⚠️ Sesi ini sudah punya ${terisi} skor terisi. Skor akan ikut TERHAPUS.` : '';
      if (!confirm(`Hapus sesi penilaian:\n${nm} - ${role} (${jenis})${warn}\n\nAksi tidak bisa dibatalkan.`)) return;
      PKGDB.deletePenilaian(id);
      toast('Sesi penilaian dihapus');
      viewPenilaianHub(view);
    });
  });

  // Hapus semua yg selesai (sudah disupervisi)
  $('#btn-pn-clean')?.addEventListener('click', () => {
    const selesaiList = filtered.filter(p => p.status === 'selesai');
    const selesaiAll = allPen.filter(p => p.status === 'selesai');
    // Pakai filtered kalau ada filter aktif, kalau tidak pakai semua
    const isFiltered = filterRole || filterJenis || filterStatus || filterMadrasah || q;
    const target = isFiltered ? selesaiList : selesaiAll;
    const scope = isFiltered ? 'sesuai filter aktif' : 'di seluruh data';
    if (target.length === 0) { toast('Tidak ada sesi yang berstatus Selesai pada cakupan ini', 'warning'); return; }
    const sample = target.slice(0, 5).map(p => `• ${p.guru.nama} - ${p.role_label} (${p.jenis})`).join('\n');
    const more = target.length > 5 ? `\n… dan ${target.length - 5} sesi lainnya` : '';
    const msg = `Hapus ${target.length} sesi penilaian SELESAI ${scope}?\n\n${sample}${more}\n\nData skor untuk sesi-sesi ini akan ikut TERHAPUS. Aksi tidak bisa dibatalkan.`;
    if (!confirm(msg)) return;
    const typed = prompt('Untuk konfirmasi, ketik: HAPUS SELESAI');
    if (typed !== 'HAPUS SELESAI') { toast('Dibatalkan, teks konfirmasi tidak cocok', 'warning'); return; }
    PKGDB.deletePenilaianMany(target.map(p => p.id));
    toast(`${target.length} sesi penilaian dihapus`);
    viewPenilaianHub(view);
  });
}

function openPenilaianBaruDialog() {
  const gurus = PKGDB.listGuru();
  if (gurus.length === 0) {
    if (confirm('Belum ada data guru. Tambah guru dulu?')) navigate('/guru/new');
    return;
  }
  document.getElementById('pn-modal')?.remove();
  const modalHtml = `
  <div class="modal fade" id="pn-modal" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header"><h5 class="modal-title">Mulai Penilaian Baru</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">Guru</label>
            <select id="pn-guru" class="form-select">
              <option value="">-- Pilih Guru --</option>
              ${gurus.map(g => `<option value="${g.id}">${e(g.nama)}${g.nama_madrasah ? ' - ' + e(g.nama_madrasah) : ''}</option>`).join('')}
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Peran</label>
            <select id="pn-role" class="form-select">
              ${PKGDB.ROLES.map(r => `<option value="${e(r.role_code)}">${e(r.role_label)} (skor 0-${r.max_score})</option>`).join('')}
            </select>
          </div>
          <div class="mb-2">
            <label class="form-label">Jenis</label>
            <div class="btn-group w-100" role="group">
              <input type="radio" class="btn-check" name="pn-jenis" id="pn-sum" value="sumatif" checked>
              <label class="btn btn-outline-primary" for="pn-sum">Sumatif</label>
              <input type="radio" class="btn-check" name="pn-jenis" id="pn-form" value="formatif">
              <label class="btn btn-outline-primary" for="pn-form">Formatif</label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-light" data-bs-dismiss="modal">Batal</button>
          <button class="btn btn-primary" id="pn-go"><i class="bi bi-arrow-right"></i> Lanjut</button>
        </div>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  const modalEl = document.getElementById('pn-modal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
  modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove(), { once: true });
  document.getElementById('pn-go').addEventListener('click', () => {
    const gid = document.getElementById('pn-guru').value;
    const role = document.getElementById('pn-role').value;
    const jenis = document.querySelector('input[name="pn-jenis"]:checked').value;
    if (!gid) { toast('Pilih guru dulu', 'danger'); return; }
    modal.hide();
    navigate(`/guru/${gid}/nilai/${role}?jenis=${jenis}`);
  });
}

// === REKAP ==============================================================
function viewRekap(view) {
  const { query } = parseHash();
  const tab = query.tab || 'pkg';
  const data = PKGDB.getRekap();
  // Helper: tugas dari data guru
  function tugasGuru(g) {
    const t = [g.tugas_tambahan_1, g.tugas_tambahan_2, g.tugas_tambahan_3].filter(s => s && String(s).trim()).map(s => String(s).trim());
    if (t.length > 0) return t.join(', ');
    return g.mapel_kelas ? 'Guru Mapel' : 'Guru';
  }

  view.innerHTML = `
  <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
    <h4 class="mb-0"><i class="bi bi-table"></i> Rekap</h4>
    <div class="d-flex gap-2 flex-wrap">
      <button id="btn-print" class="btn btn-sm btn-outline-secondary"><i class="bi bi-printer"></i> Cetak</button>
      <button id="btn-xlsx" class="btn btn-sm btn-success"><i class="bi bi-file-earmark-excel"></i> Export Excel</button>
      <button id="btn-csv" class="btn btn-sm btn-outline-success"><i class="bi bi-file-earmark-spreadsheet"></i> CSV</button>
    </div>
  </div>

  <ul class="nav nav-tabs mb-3">
    <li class="nav-item"><a class="nav-link ${tab === 'pkg' ? 'active' : ''}" href="#/rekap?tab=pkg"><i class="bi bi-clipboard-check"></i> Penilaian PKG</a></li>
    <li class="nav-item"><a class="nav-link ${tab === 'pkg-kkm' ? 'active' : ''}" href="#/rekap?tab=pkg-kkm"><i class="bi bi-diagram-3"></i> Penilaian KKM</a></li>
    <li class="nav-item"><a class="nav-link ${tab === 'pkg-kab' ? 'active' : ''}" href="#/rekap?tab=pkg-kab"><i class="bi bi-geo-alt-fill"></i> Penilaian Kabupaten</a></li>
    <li class="nav-item"><a class="nav-link ${tab === 'pkb' ? 'active' : ''}" href="#/rekap?tab=pkb"><i class="bi bi-mortarboard"></i> PKB Guru</a></li>
    <li class="nav-item"><a class="nav-link ${tab === 'pkb-madrasah' ? 'active' : ''}" href="#/rekap?tab=pkb-madrasah"><i class="bi bi-building"></i> PKB Madrasah</a></li>
    <li class="nav-item"><a class="nav-link ${tab === 'absen' ? 'active' : ''}" href="#/rekap?tab=absen"><i class="bi bi-calendar-check"></i> Absensi</a></li>
  </ul>

  <div id="rekap-content"></div>`;

  // Render tab body
  const content = document.getElementById('rekap-content');
  if (tab === 'pkb') renderRekapPKB(content, data);
  else if (tab === 'pkb-madrasah') renderRekapPKBMadrasah(content, data);
  else if (tab === 'pkg-kkm') renderRekapPKGScope(content, data, 'kkm');
  else if (tab === 'pkg-kab') renderRekapPKGScope(content, data, 'kabupaten');
  else if (tab === 'absen') renderRekapAbsen(content, data);
  else renderRekapPKG(content, data, tugasGuru);

  $('#btn-csv').addEventListener('click', () => {
    if (tab === 'pkb') exportRekapPKBCSV(data);
    else if (tab === 'pkb-madrasah') exportRekapPKBMadrasahCSV(data);
    else if (tab === 'pkg-kkm') exportRekapPKGScopeCSV(data, 'kkm');
    else if (tab === 'pkg-kab') exportRekapPKGScopeCSV(data, 'kabupaten');
    else if (tab === 'absen') exportRekapAbsenCSV(data);
    else exportRekapPKGCSV(data, tugasGuru);
  });
  $('#btn-xlsx').addEventListener('click', async () => {
    try {
      if (tab === 'pkb') await exportRekapPKBXLSX(data);
      else if (tab === 'pkb-madrasah') await exportRekapPKBMadrasahXLSX(data);
      else if (tab === 'pkg-kkm') await exportRekapPKGScopeXLSX(data, 'kkm');
      else if (tab === 'pkg-kab') await exportRekapPKGScopeXLSX(data, 'kabupaten');
      else if (tab === 'absen') await exportRekapAbsenXLSX(data);
      else await exportRekapPKGXLSX(data, tugasGuru);
      toast('Excel terdownload');
    } catch (err) {
      console.error(err);
      toast('Gagal export Excel: ' + err.message, 'danger');
    }
  });
  $('#btn-print').addEventListener('click', () => {
    const titleMap = { pkg: 'Rekap Penilaian PKG', pkb: 'Rekap PKB Guru', 'pkb-madrasah': 'Rekap PKB Madrasah', 'pkg-kkm': 'Rekap Penilaian PKG per KKM', 'pkg-kab': 'Rekap Penilaian PKG per Kabupaten', absen: 'Rekap Absensi Guru' };
    printRekapTab(titleMap[tab] || 'Rekap', content.innerHTML);
  });
}

// === RENDER TAB BODIES ==================================================
function renderRekapPKG(target, data, tugasGuru) {
  target.innerHTML = `
  <div class="card"><div class="table-responsive">
    <table class="table table-sm table-hover mb-0 align-middle">
      <thead class="table-light"><tr>
        <th>#</th><th>Nama / NIP</th><th>Madrasah</th><th>Mapel/Kelas</th><th>Peran/Tugas</th><th>Instrumen</th><th>Jenis</th><th class="text-end">Nilai</th><th>Sebutan</th>
      </tr></thead>
      <tbody>
        ${data.length === 0 ? '<tr><td colspan="9" class="text-center text-muted py-4">Belum ada data</td></tr>' : ''}
        ${(() => {
          let i = 0;
          let rows = '';
          for (const g of data) {
            const peranGuru = tugasGuru(g);
            if (g.peran.length === 0) {
              i++;
              rows += `<tr>
                <td>${i}</td>
                <td><a href="#/guru/${g.id}">${e(g.nama)}</a><div class="small text-muted">${e(g.nip || '')}</div></td>
                <td>${e(g.nama_madrasah || '-')}</td>
                <td>${e(g.mapel_kelas || '-')}</td>
                <td>${e(peranGuru)}</td>
                <td colspan="4" class="text-muted">Belum ada penilaian</td>
              </tr>`;
            } else {
              g.peran.forEach((p, j) => {
                i++;
                rows += `<tr>
                  <td>${i}</td>
                  ${j === 0 ? `
                    <td rowspan="${g.peran.length}"><a href="#/guru/${g.id}">${e(g.nama)}</a><div class="small text-muted">${e(g.nip || '')}</div></td>
                    <td rowspan="${g.peran.length}">${e(g.nama_madrasah || '-')}</td>
                    <td rowspan="${g.peran.length}">${e(g.mapel_kelas || '-')}</td>
                    <td rowspan="${g.peran.length}">${e(peranGuru)}</td>
                  ` : ''}
                  <td class="small">${e(p.role_label)}</td>
                  <td><span class="badge bg-secondary text-uppercase">${e(p.jenis)}</span></td>
                  <td class="text-end fw-bold">${p.nilai.toFixed(2)}</td>
                  <td>${e(p.sebutan)}</td>
                </tr>`;
              });
            }
          }
          return rows;
        })()}
      </tbody>
    </table>
  </div></div>`;
}

function renderRekapPKB(target, data) {
  // Build PKB rows: 1 row per guru per prioritas (1..3)
  let rowsHtml = '';
  let n = 0;
  let totalPKB = 0;
  for (const g of data) {
    const pkb = (PKGDB.listPKB(g.id) || []).sort((a, b) => (a.prioritas || 0) - (b.prioritas || 0));
    if (pkb.length === 0) {
      n++;
      rowsHtml += `<tr><td>${n}</td>
        <td><a href="#/guru/${g.id}">${e(g.nama)}</a><div class="small text-muted">${e(g.nip || '')}</div></td>
        <td class="small">${e(g.nama_madrasah || '-')}</td>
        <td colspan="4" class="text-muted">Belum ada PKB</td>
      </tr>`;
    } else {
      pkb.forEach((p, j) => {
        if (!p.kompetensi && !p.rencana && !p.target) return; // skip empty
        n++; totalPKB++;
        rowsHtml += `<tr>
          <td>${n}</td>
          ${j === 0 ? `
            <td rowspan="${pkb.length}"><a href="#/guru/${g.id}">${e(g.nama)}</a><div class="small text-muted">${e(g.nip || '')}</div></td>
            <td rowspan="${pkb.length}" class="small">${e(g.nama_madrasah || '-')}</td>
          ` : ''}
          <td class="text-center"><span class="badge bg-primary">P${p.prioritas}</span></td>
          <td class="small" style="max-width:280px; white-space:pre-wrap">${e(p.kompetensi || '-')}</td>
          <td class="small" style="max-width:280px; white-space:pre-wrap">${e(p.rencana || '-')}</td>
          <td class="small" style="max-width:280px; white-space:pre-wrap">${e(p.target || '-')}</td>
        </tr>`;
      });
    }
  }
  target.innerHTML = `
  <div class="alert alert-info py-2 small"><i class="bi bi-info-circle"></i> Total ${totalPKB} prioritas PKB tercatat dari ${data.length} guru.</div>
  <div class="card"><div class="table-responsive">
    <table class="table table-sm table-hover mb-0 align-middle">
      <thead class="table-light"><tr>
        <th>#</th><th>Nama / NIP</th><th>Madrasah</th><th>Prioritas</th><th>Kompetensi</th><th>Rencana Kegiatan</th><th>Target</th>
      </tr></thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="7" class="text-center text-muted py-4">Belum ada data PKB</td></tr>'}
      </tbody>
    </table>
  </div></div>`;
}

// === PKB MADRASAH (3 prioritas terlemah agregat per madrasah) ===========
function computePKBMadrasah(data, scope) {
  // scope: 'madrasah' (default) | 'kkm' | 'kabupaten'
  scope = scope || 'madrasah';
  // data = list guru dengan field peran (penilaian summary)
  // Group by scope
  const groupKey = (g) => {
    if (scope === 'kkm') return (g.kkm || '').trim() || '(Tanpa KKM)';
    if (scope === 'kabupaten') return (g.kabupaten || '').trim() || '(Tanpa Kabupaten)';
    return (g.nama_madrasah || '').trim() || '(Tidak ada madrasah)';
  };
  const byGroup = {};
  for (const g of data) {
    const key = groupKey(g);
    if (!byGroup[key]) byGroup[key] = [];
    byGroup[key].push(g);
  }
  const result = [];
  for (const groupName of Object.keys(byGroup).sort()) {
    const gurus = byGroup[groupName];
    // Agregat skor per kompetensi (role+komp_no) across all guru di madrasah
    const kompAgg = {}; // key: role_code|komp_no -> { role_code, role_label, komp_no, komp_nama, sumPct, count }
    for (const g of gurus) {
      const pens = PKGDB.listPenilaianByGuru(g.id);
      for (const pen of pens) {
        const meta = PKGDB.getRoleMeta(pen.role_code);
        if (!meta) continue;
        const instrumen = PKGDB.getInstrumen(pen.role_code);
        const skorMap = PKGDB.getSkorMap(pen.id);
        const groupedKomp = {};
        for (const it of instrumen) {
          if (!groupedKomp[it.kompetensi_no]) {
            groupedKomp[it.kompetensi_no] = { komp_no: it.kompetensi_no, komp_nama: it.kompetensi_nama, items: [] };
          }
          groupedKomp[it.kompetensi_no].items.push(it);
        }
        for (const k of Object.values(groupedKomp)) {
          let sum = 0, count = 0;
          for (const it of k.items) {
            const s = skorMap[it.id];
            if (typeof s === 'number') { sum += s; count++; }
          }
          if (count === 0) continue;
          const maks = k.items.length * meta.max_score;
          const pct = maks ? (sum / maks) * 100 : 0;
          const key = `${pen.role_code}|${k.komp_no}`;
          if (!kompAgg[key]) {
            kompAgg[key] = {
              role_code: pen.role_code,
              role_label: meta.role_label,
              komp_no: k.komp_no,
              komp_nama: k.komp_nama,
              sumPct: 0,
              count: 0,
              guruNames: new Set(),
            };
          }
          kompAgg[key].sumPct += pct;
          kompAgg[key].count += 1;
          kompAgg[key].guruNames.add(g.nama);
        }
      }
    }
    const stats = Object.values(kompAgg)
      .map(k => ({
        ...k,
        avgPct: k.count ? k.sumPct / k.count : 0,
        guruCount: k.guruNames.size,
        guruList: Array.from(k.guruNames).sort(),
      }))
      .filter(k => k.count > 0)
      .sort((a, b) => a.avgPct - b.avgPct)
      .slice(0, 3);
    result.push({
      madrasah: groupName,
      jumlahGuru: gurus.length,
      jumlahDinilai: gurus.filter(g => PKGDB.listPenilaianByGuru(g.id).some(p => PKGDB.countSkor(p.id) > 0)).length,
      prioritas: stats,
    });
  }
  return result;
}

function renderRekapPKBMadrasah(target, data) {
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const scope = params.get('scope') || 'madrasah';
  const list = computePKBMadrasah(data, scope);
  const totalGroup = list.length;
  const totalAdaPrioritas = list.filter(m => m.prioritas.length > 0).length;
  const scopeLabel = { madrasah: 'Madrasah', kkm: 'KKM', kabupaten: 'Kabupaten' }[scope] || 'Madrasah';
  const scopeIcon = { madrasah: 'bi-building', kkm: 'bi-diagram-3', kabupaten: 'bi-geo-alt-fill' }[scope] || 'bi-building';
  let html = '';
  let n = 0;
  for (const m of list) {
    if (m.prioritas.length === 0) {
      n++;
      html += `<tr>
        <td>${n}</td>
        <td><strong>${e(m.madrasah)}</strong><div class="small text-muted">${m.jumlahGuru} guru</div></td>
        <td colspan="5" class="text-muted small">Belum ada hasil penilaian guru di madrasah ini</td>
      </tr>`;
      continue;
    }
    m.prioritas.forEach((p, j) => {
      n++;
      const rencana = pkbRencanaFor({ role_code: p.role_code, role_label: p.role_label, komp_no: p.komp_no, komp_nama: p.komp_nama, pct: p.avgPct });
      const targetPct = Math.min(100, Math.ceil((p.avgPct + 15) / 5) * 5);
      const target_text = `Skor rata-rata madrasah naik ke ≥ ${targetPct}% (saat ini ${p.avgPct.toFixed(1)}%). Pelibatan ${p.guruCount} guru.`;
      const guruListAttr = e((p.guruList || []).join('\n'));
      const ctxLabel = `${m.madrasah} · P${j + 1} · ${p.role_label} K${p.komp_no}`;
      html += `<tr>
        <td>${n}</td>
        ${j === 0 ? `
          <td rowspan="${m.prioritas.length}"><strong>${e(m.madrasah)}</strong><div class="small text-muted">${m.jumlahGuru} guru &middot; ${m.jumlahDinilai} dinilai</div></td>
        ` : ''}
        <td class="text-center"><span class="badge bg-primary">P${j + 1}</span></td>
        <td class="small" style="max-width:280px; white-space:pre-wrap">${e(p.role_label)} - K${p.komp_no}: ${e(p.komp_nama)} (${p.avgPct.toFixed(1)}%)</td>
        <td class="small" style="max-width:280px; white-space:pre-wrap">${e(rencana)}</td>
        <td class="small" style="max-width:280px; white-space:pre-wrap">${e(target_text)}</td>
        <td class="small text-center"><a href="#" class="text-decoration-none" data-show-guru="${guruListAttr}" data-show-ctx="${e(ctxLabel)}" title="Klik untuk lihat daftar nama guru">${p.guruCount} <i class="bi bi-people"></i></a></td>
      </tr>`;
    });
  }
  target.innerHTML = `
  <div class="d-flex flex-wrap gap-2 align-items-center mb-3">
    <div class="btn-group btn-group-sm" role="group">
      <a class="btn ${scope === 'madrasah' ? 'btn-success' : 'btn-outline-success'}" href="#/rekap?tab=pkb-madrasah&scope=madrasah"><i class="bi bi-building"></i> Per Madrasah</a>
      <a class="btn ${scope === 'kkm' ? 'btn-success' : 'btn-outline-success'}" href="#/rekap?tab=pkb-madrasah&scope=kkm"><i class="bi bi-diagram-3"></i> Per KKM</a>
      <a class="btn ${scope === 'kabupaten' ? 'btn-success' : 'btn-outline-success'}" href="#/rekap?tab=pkb-madrasah&scope=kabupaten"><i class="bi bi-geo-alt-fill"></i> Per Kabupaten</a>
    </div>
    <div class="small text-muted ms-auto">Scope: <strong>${scopeLabel}</strong> &middot; ${totalAdaPrioritas} dari ${totalGroup} group punya prioritas</div>
  </div>
  <div class="alert alert-info py-2 small"><i class="bi ${scopeIcon}"></i> Rekomendasi PKB tingkat <strong>${scopeLabel}</strong>: 3 kompetensi terlemah agregat dari semua guru dalam scope ini. Isi field <code>${scope === 'madrasah' ? 'nama_madrasah' : scope}</code> di data Guru untuk grouping yang benar.</div>
  <div class="card"><div class="table-responsive">
    <table class="table table-sm table-hover mb-0 align-middle">
      <thead class="table-light"><tr>
        <th>#</th><th>${scopeLabel}</th><th>Prioritas</th><th>Kompetensi</th><th>Rencana Kegiatan</th><th>Target</th><th class="small">Jml Guru</th>
      </tr></thead>
      <tbody>
        ${html || '<tr><td colspan="7" class="text-center text-muted py-4">Belum ada data penilaian. Isi penilaian guru dulu untuk dapat rekomendasi.</td></tr>'}
      </tbody>
    </table>
  </div></div>`;

  // Wire click on Jml Guru -> popup nama guru
  target.addEventListener('click', (ev) => {
    const link = ev.target.closest('[data-show-guru]');
    if (!link) return;
    ev.preventDefault();
    const names = (link.dataset.showGuru || '').split('\n').filter(Boolean);
    const ctx = link.dataset.showCtx || '';
    showGuruListDialog(ctx, names);
  });
}

function showGuruListDialog(title, names) {
  document.getElementById('gl-modal')?.remove();
  const modalHtml = `
  <div class="modal fade" id="gl-modal" tabindex="-1">
    <div class="modal-dialog modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title"><i class="bi bi-people"></i> Daftar Guru Terlibat</h5>
          <button class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div class="small text-muted mb-2">${e(title)}</div>
          <div class="alert alert-light border"><strong>${names.length}</strong> guru terlibat di kompetensi ini:</div>
          <ol class="mb-0 small">${names.map(n => `<li class="mb-1">${e(n)}</li>`).join('')}</ol>
        </div>
        <div class="modal-footer">
          <button class="btn btn-light" data-bs-dismiss="modal">Tutup</button>
        </div>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  const modalEl = document.getElementById('gl-modal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
  modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove(), { once: true });
}

function exportRekapPKBMadrasahCSV(data) {
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const scope = params.get('scope') || 'madrasah';
  const scopeLabel = { madrasah: 'Madrasah', kkm: 'KKM', kabupaten: 'Kabupaten' }[scope] || 'Madrasah';
  const list = computePKBMadrasah(data, scope);
  const lines = [`No;${scopeLabel};Jml Guru;Jml Dinilai;Prioritas;Peran;No Kompetensi;Nama Kompetensi;Rata2 Skor (%);Rencana Kegiatan;Target;Jml Guru Terlibat;Daftar Guru`];
  let i = 0;
  for (const m of list) {
    if (m.prioritas.length === 0) {
      i++;
      lines.push([i, m.madrasah, m.jumlahGuru, m.jumlahDinilai, '', '', '', '', '', '', '', '', ''].map(csvEsc).join(';'));
      continue;
    }
    m.prioritas.forEach((p, j) => {
      i++;
      const rencana = pkbRencanaFor({ role_code: p.role_code, role_label: p.role_label, komp_no: p.komp_no, komp_nama: p.komp_nama, pct: p.avgPct });
      const targetPct = Math.min(100, Math.ceil((p.avgPct + 15) / 5) * 5);
      const target_text = `Skor rata-rata madrasah naik ke >= ${targetPct}% (saat ini ${p.avgPct.toFixed(1)}%)`;
      const guruStr = (p.guruList || []).join(', ');
      lines.push([i, m.madrasah, m.jumlahGuru, m.jumlahDinilai, j + 1, p.role_label, p.komp_no, p.komp_nama, p.avgPct.toFixed(2), rencana, target_text, p.guruCount, guruStr].map(csvEsc).join(';'));
    });
  }
  downloadCSV(`rekap-pkb-${scope}-${new Date().toISOString().slice(0, 10)}.csv`, lines);
}

async function exportRekapPKBMadrasahXLSX(data) {
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const scope = params.get('scope') || 'madrasah';
  const scopeLabel = { madrasah: 'Madrasah', kkm: 'KKM', kabupaten: 'Kabupaten' }[scope] || 'Madrasah';
  const list = computePKBMadrasah(data, scope);
  const headers = ['No', scopeLabel, 'Jml Guru', 'Jml Dinilai', 'Prioritas', 'Peran', 'No Komp', 'Nama Kompetensi', 'Rata2 (%)', 'Rencana Kegiatan', 'Target', 'Guru Terlibat', 'Daftar Guru'];
  const widths = [5, 30, 8, 10, 9, 22, 8, 35, 9, 40, 40, 10, 50];
  const rows = [];
  let i = 0;
  for (const m of list) {
    if (m.prioritas.length === 0) {
      i++;
      rows.push([i, m.madrasah, m.jumlahGuru, m.jumlahDinilai, '', '', '', '', '', '', '', '', '']);
      continue;
    }
    m.prioritas.forEach((p, j) => {
      i++;
      const rencana = pkbRencanaFor({ role_code: p.role_code, role_label: p.role_label, komp_no: p.komp_no, komp_nama: p.komp_nama, pct: p.avgPct });
      const targetPct = Math.min(100, Math.ceil((p.avgPct + 15) / 5) * 5);
      const target_text = `Skor rata-rata naik ke >= ${targetPct}% (saat ini ${p.avgPct.toFixed(1)}%)`;
      const guruStr = (p.guruList || []).join(', ');
      rows.push([i, m.madrasah, m.jumlahGuru, m.jumlahDinilai, j + 1, p.role_label, p.komp_no, p.komp_nama, Number(p.avgPct.toFixed(2)), rencana, target_text, p.guruCount, guruStr]);
    });
  }
  await buildXLSX(`rekap-pkb-${scope}-${new Date().toISOString().slice(0, 10)}.xlsx`, `PKB ${scopeLabel}`, headers, rows, widths);
}

// === REKAP PENILAIAN PKG per KKM / Kabupaten =============================
function computePKGScope(data, scope) {
  // scope: 'kkm' | 'kabupaten'
  const groupKey = (g) => {
    if (scope === 'kkm') return (g.kkm || '').trim() || '(Tanpa KKM)';
    return (g.kabupaten || '').trim() || '(Tanpa Kabupaten)';
  };
  const byGroup = {};
  for (const g of data) {
    const k = groupKey(g);
    if (!byGroup[k]) byGroup[k] = { name: k, gurus: [], madrasahSet: new Set() };
    byGroup[k].gurus.push(g);
    if (g.nama_madrasah) byGroup[k].madrasahSet.add(g.nama_madrasah);
  }
  const result = [];
  for (const name of Object.keys(byGroup).sort()) {
    const grp = byGroup[name];
    const allNilai = [];
    const sebutanCount = { 'Amat Baik': 0, 'Baik': 0, 'Cukup': 0, 'Sedang': 0, 'Kurang': 0, 'Belum dinilai': 0 };
    let dinilai = 0;
    let sumNilai = 0;
    const guruRows = [];
    for (const g of grp.gurus) {
      const peran = g.peran || [];
      // Ambil sumatif first, fallback formatif
      const peranWithNilai = peran.filter(p => p.nilai != null && p.nilai > 0);
      if (peranWithNilai.length === 0) {
        sebutanCount['Belum dinilai']++;
        guruRows.push({ guru: g, nilai: null, sebutan: 'Belum dinilai', role_label: '', jenis: '' });
        continue;
      }
      // Pakai sumatif kalau ada, kalau tidak formatif
      const sumatif = peranWithNilai.find(p => p.jenis === 'sumatif');
      const dipakai = sumatif || peranWithNilai[0];
      sumNilai += dipakai.nilai;
      dinilai++;
      allNilai.push(dipakai.nilai);
      sebutanCount[dipakai.sebutan] = (sebutanCount[dipakai.sebutan] || 0) + 1;
      guruRows.push({ guru: g, nilai: dipakai.nilai, sebutan: dipakai.sebutan, role_label: dipakai.role_label || '', jenis: dipakai.jenis || '' });
    }
    const rata = dinilai ? sumNilai / dinilai : 0;
    result.push({
      name,
      jumlahMadrasah: grp.madrasahSet.size,
      jumlahGuru: grp.gurus.length,
      dinilai,
      rata,
      sebutanCount,
      guruRows,
    });
  }
  return result;
}

function renderRekapPKGScope(target, data, scope) {
  const list = computePKGScope(data, scope);
  const scopeLabel = scope === 'kkm' ? 'KKM' : 'Kabupaten';
  const scopeIcon = scope === 'kkm' ? 'bi-diagram-3' : 'bi-geo-alt-fill';
  const fieldLabel = scope === 'kkm' ? 'kkm' : 'kabupaten';
  if (list.length === 0) {
    target.innerHTML = `<div class="alert alert-warning">Belum ada data guru. Tambah guru dulu di menu Data Guru.</div>`;
    return;
  }
  // Ringkasan keseluruhan
  let totalGuru = 0, totalDinilai = 0, totalSum = 0;
  for (const g of list) { totalGuru += g.jumlahGuru; totalDinilai += g.dinilai; totalSum += g.rata * g.dinilai; }
  const rataKeseluruhan = totalDinilai ? totalSum / totalDinilai : 0;

  let summaryRows = '';
  let detailHtml = '';
  list.forEach((g, idx) => {
    const sb = g.sebutanCount;
    summaryRows += `<tr>
      <td>${idx + 1}</td>
      <td><a href="#group-${idx}" class="text-decoration-none"><strong>${e(g.name)}</strong></a></td>
      <td class="text-center">${g.jumlahMadrasah}</td>
      <td class="text-center">${g.jumlahGuru}</td>
      <td class="text-center">${g.dinilai}</td>
      <td class="text-end"><strong>${g.rata.toFixed(2)}</strong></td>
      <td class="text-center small">${sb['Amat Baik'] || 0}</td>
      <td class="text-center small">${sb['Baik'] || 0}</td>
      <td class="text-center small">${sb['Cukup'] || 0}</td>
      <td class="text-center small">${sb['Sedang'] || 0}</td>
      <td class="text-center small">${sb['Kurang'] || 0}</td>
      <td class="text-center small text-muted">${sb['Belum dinilai'] || 0}</td>
    </tr>`;

    let detailRows = '';
    g.guruRows.forEach((row, j) => {
      const badge = row.sebutan === 'Belum dinilai' ? 'bg-secondary' :
        row.sebutan === 'Amat Baik' ? 'bg-success' :
        row.sebutan === 'Baik' ? 'bg-primary' :
        row.sebutan === 'Cukup' ? 'bg-info text-dark' :
        row.sebutan === 'Sedang' ? 'bg-warning text-dark' : 'bg-danger';
      detailRows += `<tr>
        <td>${j + 1}</td>
        <td>${e(row.guru.nama)}<div class="small text-muted">${e(row.guru.nip || '-')}</div></td>
        <td class="small">${e(row.guru.nama_madrasah || '-')}</td>
        <td class="small">${e(row.role_label || '-')}</td>
        <td class="small">${e((row.jenis || '').toUpperCase())}</td>
        <td class="text-end">${row.nilai != null ? row.nilai.toFixed(2) : '-'}</td>
        <td><span class="badge ${badge}">${e(row.sebutan)}</span></td>
      </tr>`;
    });
    detailHtml += `
      <div class="card mb-3" id="group-${idx}">
        <div class="card-header bg-light d-flex justify-content-between flex-wrap gap-2">
          <div><i class="bi ${scopeIcon}"></i> <strong>${e(g.name)}</strong></div>
          <div class="small">${g.jumlahMadrasah} madrasah &middot; ${g.dinilai}/${g.jumlahGuru} guru dinilai &middot; rata-rata <strong>${g.rata.toFixed(2)}</strong></div>
        </div>
        <div class="table-responsive">
          <table class="table table-sm table-hover mb-0 align-middle">
            <thead class="table-light"><tr><th>#</th><th>Guru</th><th>Madrasah</th><th>Peran</th><th>Jenis</th><th class="text-end">Nilai</th><th>Sebutan</th></tr></thead>
            <tbody>${detailRows || '<tr><td colspan="7" class="text-muted small text-center py-3">Tidak ada guru di scope ini</td></tr>'}</tbody>
          </table>
        </div>
      </div>`;
  });

  target.innerHTML = `
  <div class="alert alert-info py-2 small"><i class="bi ${scopeIcon}"></i>
    Rekap Penilaian PKG agregat per <strong>${scopeLabel}</strong> (${list.length} group, ${totalGuru} guru total, rata-rata keseluruhan: <strong>${rataKeseluruhan.toFixed(2)}</strong>). Pakai nilai sumatif (fallback formatif kalau sumatif belum ada). Isi field <code>${fieldLabel}</code> di Data Guru untuk grouping yang akurat.
  </div>
  <div class="card mb-3">
    <div class="card-header bg-success text-white"><i class="bi bi-bar-chart-fill"></i> Ringkasan per ${scopeLabel}</div>
    <div class="table-responsive">
      <table class="table table-sm mb-0 align-middle">
        <thead class="table-light"><tr>
          <th>#</th><th>${scopeLabel}</th><th class="text-center">Madrasah</th><th class="text-center">Guru</th><th class="text-center">Dinilai</th><th class="text-end">Rata-rata</th>
          <th class="text-center small text-success" title="Amat Baik">AB</th>
          <th class="text-center small text-primary" title="Baik">B</th>
          <th class="text-center small" title="Cukup">C</th>
          <th class="text-center small text-warning" title="Sedang">S</th>
          <th class="text-center small text-danger" title="Kurang">K</th>
          <th class="text-center small text-muted" title="Belum dinilai">-</th>
        </tr></thead>
        <tbody>${summaryRows}</tbody>
      </table>
    </div>
  </div>
  <h6 class="text-muted text-uppercase small mb-2 mt-4"><i class="bi bi-card-list"></i> Detail Per ${scopeLabel}</h6>
  ${detailHtml}
  `;
}

function exportRekapPKGScopeCSV(data, scope) {
  const list = computePKGScope(data, scope);
  const scopeLabel = scope === 'kkm' ? 'KKM' : 'Kabupaten';
  const lines = [`No;${scopeLabel};Madrasah;Nama Guru;NIP;Peran/Tugas;Jenis;Nilai;Sebutan`];
  let i = 0;
  for (const g of list) {
    for (const row of g.guruRows) {
      i++;
      lines.push([i, g.name, row.guru.nama_madrasah || '', row.guru.nama, row.guru.nip || '', row.role_label || '', (row.jenis || '').toUpperCase(), row.nilai != null ? row.nilai.toFixed(2) : '', row.sebutan].map(csvEsc).join(';'));
    }
  }
  // Tambah ringkasan di akhir
  lines.push('');
  lines.push(`RINGKASAN per ${scopeLabel};Madrasah;Guru;Dinilai;Rata-rata;Amat Baik;Baik;Cukup;Sedang;Kurang;Belum dinilai`);
  for (const g of list) {
    const sb = g.sebutanCount;
    lines.push([g.name, g.jumlahMadrasah, g.jumlahGuru, g.dinilai, g.rata.toFixed(2), sb['Amat Baik'] || 0, sb['Baik'] || 0, sb['Cukup'] || 0, sb['Sedang'] || 0, sb['Kurang'] || 0, sb['Belum dinilai'] || 0].map(csvEsc).join(';'));
  }
  downloadCSV(`rekap-pkg-${scope}-${new Date().toISOString().slice(0, 10)}.csv`, lines);
}

async function exportRekapPKGScopeXLSX(data, scope) {
  const list = computePKGScope(data, scope);
  const scopeLabel = scope === 'kkm' ? 'KKM' : 'Kabupaten';

  // Kita pakai 2 sheet: Detail & Ringkasan
  if (typeof ExcelJS === 'undefined') throw new Error('ExcelJS library belum load');
  const wb = new ExcelJS.Workbook();
  wb.creator = 'PKG App';
  wb.created = new Date();

  const headerStyle = {
    font: { bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047A3A' } },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } },
  };
  const cellBorder = { top: { style: 'thin', color: { argb: 'FFCCCCCC' } }, bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } }, left: { style: 'thin', color: { argb: 'FFCCCCCC' } }, right: { style: 'thin', color: { argb: 'FFCCCCCC' } } };

  // Sheet 1: Ringkasan
  const wsR = wb.addWorksheet('Ringkasan');
  const ringHeaders = ['No', scopeLabel, 'Madrasah', 'Guru', 'Dinilai', 'Rata-rata', 'Amat Baik', 'Baik', 'Cukup', 'Sedang', 'Kurang', 'Belum dinilai'];
  const ringWidths = [5, 30, 12, 10, 10, 12, 12, 8, 8, 10, 10, 14];
  wsR.columns = ringHeaders.map((h, k) => ({ header: h, width: ringWidths[k] }));
  wsR.getRow(1).eachCell(c => Object.assign(c, headerStyle));
  wsR.getRow(1).height = 30;
  list.forEach((g, idx) => {
    const sb = g.sebutanCount;
    const row = wsR.addRow([idx + 1, g.name, g.jumlahMadrasah, g.jumlahGuru, g.dinilai, Number(g.rata.toFixed(2)), sb['Amat Baik'] || 0, sb['Baik'] || 0, sb['Cukup'] || 0, sb['Sedang'] || 0, sb['Kurang'] || 0, sb['Belum dinilai'] || 0]);
    row.eachCell(c => { c.border = cellBorder; });
  });
  wsR.views = [{ state: 'frozen', ySplit: 1 }];

  // Sheet 2: Detail
  const wsD = wb.addWorksheet('Detail');
  const detHeaders = ['No', scopeLabel, 'Madrasah', 'Nama Guru', 'NIP', 'Peran/Tugas', 'Jenis', 'Nilai', 'Sebutan'];
  const detWidths = [5, 25, 28, 28, 22, 22, 10, 10, 14];
  wsD.columns = detHeaders.map((h, k) => ({ header: h, width: detWidths[k] }));
  wsD.getRow(1).eachCell(c => Object.assign(c, headerStyle));
  wsD.getRow(1).height = 30;
  let rno = 0;
  for (const g of list) {
    for (const row of g.guruRows) {
      rno++;
      const r = wsD.addRow([rno, g.name, row.guru.nama_madrasah || '', row.guru.nama, row.guru.nip || '', row.role_label || '', (row.jenis || '').toUpperCase(), row.nilai != null ? Number(row.nilai.toFixed(2)) : '', row.sebutan]);
      r.eachCell(c => { c.border = cellBorder; });
    }
  }
  wsD.views = [{ state: 'frozen', ySplit: 1 }];

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rekap-pkg-${scope}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

function renderRekapAbsen(target, data) {
  let rowsHtml = '';
  let n = 0;
  let totalRows = 0;
  for (const g of data) {
    const kh = (PKGDB.listKehadiran(g.id) || []).sort((a, b) => (a.tahun - b.tahun) || (a.bulan - b.bulan));
    if (kh.length === 0) {
      n++;
      rowsHtml += `<tr><td>${n}</td>
        <td><a href="#/guru/${g.id}">${e(g.nama)}</a><div class="small text-muted">${e(g.nip || '')}</div></td>
        <td class="small">${e(g.nama_madrasah || '-')}</td>
        <td colspan="9" class="text-muted">Belum ada data absensi</td>
      </tr>`;
    } else {
      kh.forEach((k, j) => {
        n++; totalRows++;
        const pct = k.hari_efektif ? ((k.hadir / k.hari_efektif) * 100).toFixed(1) : '-';
        rowsHtml += `<tr>
          <td>${n}</td>
          ${j === 0 ? `
            <td rowspan="${kh.length}"><a href="#/guru/${g.id}">${e(g.nama)}</a><div class="small text-muted">${e(g.nip || '')}</div></td>
            <td rowspan="${kh.length}" class="small">${e(g.nama_madrasah || '-')}</td>
          ` : ''}
          <td class="text-center">${NAMA_BLN_SHORT[k.bulan] || k.bulan}</td>
          <td class="text-center">${k.tahun}</td>
          <td class="text-center">${k.hari_efektif || 0}</td>
          <td class="text-center">${k.hadir || 0}</td>
          <td class="text-center">${k.sakit || 0}</td>
          <td class="text-center">${k.izin || 0}</td>
          <td class="text-center">${k.alpa || 0}</td>
          <td class="text-center">${k.cuti || 0}</td>
          <td class="text-center">${k.dinas || 0}</td>
          <td class="text-end fw-semibold">${pct === '-' ? '-' : pct + '%'}</td>
        </tr>`;
      });
    }
  }
  target.innerHTML = `
  <div class="alert alert-info py-2 small"><i class="bi bi-info-circle"></i> Total ${totalRows} baris data kehadiran dari ${data.length} guru.</div>
  <div class="card"><div class="table-responsive">
    <table class="table table-sm table-hover mb-0 align-middle">
      <thead class="table-light"><tr>
        <th>#</th><th>Nama / NIP</th><th>Madrasah</th><th>Bulan</th><th>Tahun</th><th>Efektif</th><th>Hadir</th><th>Sakit</th><th>Izin</th><th>Alpa</th><th>Cuti</th><th>Dinas</th><th class="text-end">%</th>
      </tr></thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="13" class="text-center text-muted py-4">Belum ada data absensi</td></tr>'}
      </tbody>
    </table>
  </div></div>`;
}

// === EXPORT CSV =========================================================
function csvEsc(v) {
  if (v === null || v === undefined) return '';
  const s = String(v).replace(/"/g, '""');
  return /[;"\n\r]/.test(s) ? `"${s}"` : s;
}
function downloadCSV(filename, lines) {
  const blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast('CSV diunduh');
}
function exportRekapPKGCSV(data, tugasGuru) {
  const lines = ['No;Nama;NIP;Madrasah;Mapel/Kelas;Peran/Tugas;Instrumen;Jenis;Nilai;Sebutan;Tanggal'];
  let i = 0;
  for (const g of data) {
    const peranGuru = tugasGuru(g);
    if (g.peran.length === 0) {
      i++;
      lines.push([i, g.nama, g.nip, g.nama_madrasah, g.mapel_kelas, peranGuru, '', '', '', '', ''].map(csvEsc).join(';'));
    } else {
      for (const p of g.peran) {
        i++;
        lines.push([i, g.nama, g.nip, g.nama_madrasah, g.mapel_kelas, peranGuru, p.role_label, p.jenis, p.nilai, p.sebutan, p.tanggal].map(csvEsc).join(';'));
      }
    }
  }
  downloadCSV(`rekap-pkg-${new Date().toISOString().slice(0, 10)}.csv`, lines);
}
function exportRekapPKBCSV(data) {
  const lines = ['No;Nama;NIP;Madrasah;Prioritas;Kompetensi;Rencana Kegiatan;Target'];
  let i = 0;
  for (const g of data) {
    const pkb = (PKGDB.listPKB(g.id) || []).sort((a, b) => (a.prioritas || 0) - (b.prioritas || 0));
    if (pkb.length === 0 || !pkb.some(p => p.kompetensi || p.rencana || p.target)) {
      i++;
      lines.push([i, g.nama, g.nip, g.nama_madrasah, '', '', '', ''].map(csvEsc).join(';'));
      continue;
    }
    for (const p of pkb) {
      if (!p.kompetensi && !p.rencana && !p.target) continue;
      i++;
      lines.push([i, g.nama, g.nip, g.nama_madrasah, p.prioritas, p.kompetensi, p.rencana, p.target].map(csvEsc).join(';'));
    }
  }
  downloadCSV(`rekap-pkb-${new Date().toISOString().slice(0, 10)}.csv`, lines);
}
function exportRekapAbsenCSV(data) {
  const lines = ['No;Nama;NIP;Madrasah;Bulan;Tahun;Efektif;Hadir;Sakit;Izin;Alpa;Cuti;Dinas;Persentase'];
  let i = 0;
  for (const g of data) {
    const kh = (PKGDB.listKehadiran(g.id) || []).sort((a, b) => (a.tahun - b.tahun) || (a.bulan - b.bulan));
    if (kh.length === 0) {
      i++;
      lines.push([i, g.nama, g.nip, g.nama_madrasah, '', '', '', '', '', '', '', '', '', ''].map(csvEsc).join(';'));
      continue;
    }
    for (const k of kh) {
      i++;
      const pct = k.hari_efektif ? ((k.hadir / k.hari_efektif) * 100).toFixed(2) + '%' : '';
      lines.push([i, g.nama, g.nip, g.nama_madrasah, NAMA_BLN_SHORT[k.bulan] || k.bulan, k.tahun, k.hari_efektif, k.hadir, k.sakit, k.izin, k.alpa, k.cuti, k.dinas, pct].map(csvEsc).join(';'));
    }
  }
  downloadCSV(`rekap-absen-${new Date().toISOString().slice(0, 10)}.csv`, lines);
}

// === EXPORT XLSX (ExcelJS) ==============================================
async function buildXLSX(filename, sheetName, headers, rows, colWidths) {
  if (typeof ExcelJS === 'undefined') throw new Error('Library Excel belum termuat');
  const wb = new ExcelJS.Workbook();
  wb.creator = 'PKG App';
  wb.created = new Date();
  const ws = wb.addWorksheet(sheetName);
  ws.columns = headers.map((h, i) => ({ header: h, key: 'c' + i, width: colWidths?.[i] || 15 }));
  // Header style
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047A3A' } };
  ws.getRow(1).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  ws.getRow(1).height = 22;
  // Data
  for (const row of rows) {
    const obj = {};
    headers.forEach((_, i) => { obj['c' + i] = row[i] != null ? row[i] : ''; });
    ws.addRow(obj);
  }
  // Borders
  ws.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      cell.alignment = cell.alignment || { vertical: 'top', wrapText: true };
    });
  });
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
async function exportRekapPKGXLSX(data, tugasGuru) {
  const headers = ['No', 'Nama', 'NIP', 'Madrasah', 'Mapel/Kelas', 'Peran/Tugas', 'Instrumen PKG', 'Jenis', 'Nilai', 'Sebutan', 'Tanggal'];
  const widths = [5, 28, 22, 25, 22, 22, 22, 12, 10, 14, 12];
  const rows = [];
  let i = 0;
  for (const g of data) {
    const peranGuru = tugasGuru(g);
    if (g.peran.length === 0) {
      i++;
      rows.push([i, g.nama, g.nip || '', g.nama_madrasah || '', g.mapel_kelas || '', peranGuru, '', '', '', '', '']);
    } else {
      for (const p of g.peran) {
        i++;
        rows.push([i, g.nama, g.nip || '', g.nama_madrasah || '', g.mapel_kelas || '', peranGuru, p.role_label || '', (p.jenis || '').toUpperCase(), Number(p.nilai.toFixed(2)), p.sebutan || '', p.tanggal || '']);
      }
    }
  }
  await buildXLSX(`rekap-pkg-${new Date().toISOString().slice(0, 10)}.xlsx`, 'Rekap PKG', headers, rows, widths);
}
async function exportRekapPKBXLSX(data) {
  const headers = ['No', 'Nama', 'NIP', 'Madrasah', 'Prioritas', 'Kompetensi', 'Rencana Kegiatan', 'Target'];
  const widths = [5, 28, 22, 25, 10, 40, 40, 40];
  const rows = [];
  let i = 0;
  for (const g of data) {
    const pkb = (PKGDB.listPKB(g.id) || []).sort((a, b) => (a.prioritas || 0) - (b.prioritas || 0));
    const filled = pkb.filter(p => p.kompetensi || p.rencana || p.target);
    if (filled.length === 0) {
      i++;
      rows.push([i, g.nama, g.nip || '', g.nama_madrasah || '', '', '', '', '']);
      continue;
    }
    for (const p of filled) {
      i++;
      rows.push([i, g.nama, g.nip || '', g.nama_madrasah || '', p.prioritas || '', p.kompetensi || '', p.rencana || '', p.target || '']);
    }
  }
  await buildXLSX(`rekap-pkb-${new Date().toISOString().slice(0, 10)}.xlsx`, 'Rekap PKB', headers, rows, widths);
}
async function exportRekapAbsenXLSX(data) {
  const headers = ['No', 'Nama', 'NIP', 'Madrasah', 'Bulan', 'Tahun', 'Hari Efektif', 'Hadir', 'Sakit', 'Izin', 'Alpa', 'Cuti', 'Dinas', '% Hadir'];
  const widths = [5, 28, 22, 25, 10, 8, 12, 8, 8, 8, 8, 8, 8, 10];
  const rows = [];
  let i = 0;
  for (const g of data) {
    const kh = (PKGDB.listKehadiran(g.id) || []).sort((a, b) => (a.tahun - b.tahun) || (a.bulan - b.bulan));
    if (kh.length === 0) {
      i++;
      rows.push([i, g.nama, g.nip || '', g.nama_madrasah || '', '', '', '', '', '', '', '', '', '', '']);
      continue;
    }
    for (const k of kh) {
      i++;
      const pct = k.hari_efektif ? Number(((k.hadir / k.hari_efektif) * 100).toFixed(2)) : '';
      rows.push([i, g.nama, g.nip || '', g.nama_madrasah || '', NAMA_BLN_SHORT[k.bulan] || k.bulan, k.tahun, k.hari_efektif || 0, k.hadir || 0, k.sakit || 0, k.izin || 0, k.alpa || 0, k.cuti || 0, k.dinas || 0, pct]);
    }
  }
  await buildXLSX(`rekap-absen-${new Date().toISOString().slice(0, 10)}.xlsx`, 'Rekap Absensi', headers, rows, widths);
}

// === PRINT ==============================================================
function printRekapTab(title, html) {
  const w = window.open('', '_blank');
  if (!w) { toast('Pop-up diblokir. Izinkan pop-up untuk cetak.', 'danger'); return; }
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>
    body{font-family:'Times New Roman',serif;font-size:10pt;color:#000;margin:1.2cm;}
    h2{text-align:center;margin:0 0 4px;}
    .meta{text-align:center;margin-bottom:14px;font-size:10pt;color:#444;}
    table{width:100%;border-collapse:collapse;margin-bottom:6px;}
    th,td{border:1px solid #333;padding:4px 6px;vertical-align:top;text-align:left;font-size:9pt;}
    th{background:#e8f5e9;}
    .badge{display:inline-block;padding:1px 5px;border:1px solid #888;border-radius:3px;font-size:8pt;}
    .small,.text-muted{color:#555;font-size:8pt;}
    .alert{display:none;}
    @media print{ button{display:none;} }
  </style></head><body>
  <h2>${title}</h2>
  <div class="meta">Dicetak: ${today}</div>
  ${html}
  <script>window.onload=()=>{setTimeout(()=>window.print(),200);}<\/script>
  </body></html>`);
  w.document.close();
}

// === PANDUAN PENGGUNAAN =================================================
function viewPanduan(view) {
  view.innerHTML = `
  <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
    <h4 class="mb-0"><i class="bi bi-question-circle"></i> Panduan Penggunaan Aplikasi PKG</h4>
    <button id="btn-print-panduan" class="btn btn-sm btn-outline-secondary"><i class="bi bi-printer"></i> Cetak</button>
  </div>

  <div class="alert alert-success py-2 small"><i class="bi bi-info-circle"></i>
    Aplikasi PKG ini berjalan <strong>offline-first</strong>. Data tersimpan di browser (localStorage) per perangkat. Pindah perangkat? Pakai menu Backup terlebih dahulu.
  </div>

  <div class="row g-3">
    <div class="col-lg-3">
      <div class="card sticky-summary">
        <div class="card-header"><i class="bi bi-bookmark"></i> Daftar Isi</div>
        <div class="list-group list-group-flush small" id="panduan-toc">
          <a class="list-group-item list-group-item-action" href="javascript:void(0)" data-target="sec-mulai">1. Mulai Cepat</a>
          <a class="list-group-item list-group-item-action" href="javascript:void(0)" data-target="sec-guru">2. Data Guru</a>
          <a class="list-group-item list-group-item-action" href="javascript:void(0)" data-target="sec-kamad">3. Data Kamad</a>
          <a class="list-group-item list-group-item-action" href="javascript:void(0)" data-target="sec-nilai">4. Penilaian</a>
          <a class="list-group-item list-group-item-action" href="javascript:void(0)" data-target="sec-rekap">5. Rekap</a>
          <a class="list-group-item list-group-item-action" href="javascript:void(0)" data-target="sec-laporan">6. Laporan Madrasah/KKM</a>
          <a class="list-group-item list-group-item-action" href="javascript:void(0)" data-target="sec-import">7. Import Excel</a>
          <a class="list-group-item list-group-item-action" href="javascript:void(0)" data-target="sec-instrumen">8. Instrumen</a>
          <a class="list-group-item list-group-item-action" href="javascript:void(0)" data-target="sec-backup">9. Backup &amp; Restore</a>
          <a class="list-group-item list-group-item-action" href="javascript:void(0)" data-target="sec-pwa">10. Install sebagai App (PWA)</a>
          <a class="list-group-item list-group-item-action" href="javascript:void(0)" data-target="sec-faq">11. FAQ &amp; Troubleshooting</a>
        </div>
      </div>
    </div>

    <div class="col-lg-9" id="panduan-content">
      <div class="card mb-3" id="sec-mulai">
        <div class="card-header bg-primary text-white"><i class="bi bi-rocket-takeoff"></i> 1. Mulai Cepat (5 langkah)</div>
        <div class="card-body">
          <ol>
            <li><strong>Tambah Data Guru</strong> di menu <em>Data Guru → + Tambah Guru</em>. Isi nama, NIP, madrasah, peran/jabatan, dan KKM (untuk grouping wilayah).</li>
            <li><strong>(Opsional) Tambah Data Kamad</strong> di menu <em>Data Kamad</em> agar nama Kepala Madrasah otomatis muncul di Halaman Pengesahan laporan.</li>
            <li><strong>Lakukan Penilaian</strong> di menu <em>Penilaian</em>: pilih guru → pilih peran → pilih jenis (Sumatif/Formatif) → isi skor per indikator. Auto-save aktif.</li>
            <li><strong>Lihat Rekap</strong> di menu <em>Rekap</em>. Tersedia tab PKG, KKM, Kabupaten, PKB, Absensi.</li>
            <li><strong>Generate Laporan</strong> di menu <em>Laporan → Madrasah / KKM</em>. Output HTML A4 (cetak/PDF) atau DOCX.</li>
          </ol>
        </div>
      </div>

      <div class="card mb-3" id="sec-guru">
        <div class="card-header"><i class="bi bi-people"></i> 2. Data Guru</div>
        <div class="card-body">
          <p>Menu untuk mengelola daftar guru sasaran penilaian.</p>
          <ul>
            <li><strong>Tambah:</strong> klik tombol <em>+ Tambah Guru</em>. Field penting: Nama, NIP, Nama Madrasah, KKM, Kabupaten, Peran (Guru Mapel/BK/TIK/Pustakawan/Laboran), Tugas Tambahan (Wakil Kepala bidang Kurikulum/Kesiswaan/Sarpras/Humas).</li>
            <li><strong>Edit:</strong> klik nama guru → tombol Edit. NIP unik per guru, sistem akan menolak duplikat.</li>
            <li><strong>Hapus:</strong> hati-hati — menghapus guru juga menghapus penilaian, kehadiran, dan PKB-nya.</li>
            <li><strong>Cari:</strong> kotak pencarian di atas bisa cari berdasarkan nama, NIP, atau nama madrasah.</li>
            <li><strong>Field KKM &amp; Kabupaten</strong> wajib terisi kalau ingin menggunakan menu Laporan KKM dan Rekap Kabupaten.</li>
          </ul>
        </div>
      </div>

      <div class="card mb-3" id="sec-kamad">
        <div class="card-header"><i class="bi bi-person-badge"></i> 3. Data Kamad (Kepala Madrasah)</div>
        <div class="card-body">
          <p>Menu terpisah untuk mengelola data Kepala Madrasah. Data ini dipakai sebagai default Halaman Pengesahan di Laporan Madrasah.</p>
          <ul>
            <li>Field: Nama, NIP, Nama Madrasah, Alamat Madrasah, Jenjang, No HP, Email, Catatan.</li>
            <li><strong>Sync dari Data Guru:</strong> jika field <code>nama_kamad</code> dan <code>nip_kamad</code> sudah terisi di data guru, sistem otomatis membuat record Kamad.</li>
            <li>Pencocokan Kamad ke Madrasah dilakukan berdasarkan <code>nama_madrasah</code> (case-insensitive).</li>
          </ul>
        </div>
      </div>

      <div class="card mb-3" id="sec-nilai">
        <div class="card-header"><i class="bi bi-clipboard-check"></i> 4. Penilaian</div>
        <div class="card-body">
          <p>Mengisi skor PKG per guru per peran.</p>
          <ul>
            <li><strong>Jenis penilaian:</strong> Sumatif (akhir tahun, dipakai untuk laporan utama) dan Formatif (awal tahun, sebagai pemetaan awal).</li>
            <li><strong>Skor:</strong> tergantung peran. Guru Mapel/BK/TIK/Pustakawan/Laboran skor 0-2. Wakil Kepala (Kurikulum/Kesiswaan/Sarpras/Humas) skor 0-4.</li>
            <li><strong>Auto-save:</strong> setiap perubahan skor tersimpan otomatis ke localStorage. Tidak perlu klik Simpan.</li>
            <li><strong>Catatan Penggalian Data:</strong> tombol info di tiap indikator menampilkan saran dokumen, observasi, dan wawancara untuk asesor.</li>
            <li><strong>Nilai Akhir:</strong> rata-rata persentase dari semua kompetensi dalam peran tersebut. Sebutan otomatis: &gt;90 Amat Baik, &gt;75 Baik, &gt;60 Cukup, &gt;50 Sedang, ≤50 Kurang.</li>
          </ul>
        </div>
      </div>

      <div class="card mb-3" id="sec-rekap">
        <div class="card-header"><i class="bi bi-table"></i> 5. Rekap</div>
        <div class="card-body">
          <p>Tabel agregat hasil penilaian, dengan beberapa tab:</p>
          <ul>
            <li><strong>Penilaian PKG:</strong> daftar semua guru dengan nilai akhir dan sebutan.</li>
            <li><strong>Penilaian KKM:</strong> agregat per KKM (jumlah madrasah, rata-rata, distribusi sebutan, detail per kamad).</li>
            <li><strong>Penilaian Kabupaten:</strong> agregat per kabupaten/kota.</li>
            <li><strong>PKB Guru:</strong> rekomendasi pengembangan keprofesian berkelanjutan per guru, 3 prioritas terlemah.</li>
            <li><strong>PKB Madrasah:</strong> agregat 3 prioritas terlemah per madrasah, klik jumlah guru untuk lihat daftar nama.</li>
            <li><strong>Absensi:</strong> rekap kehadiran bulanan per guru.</li>
          </ul>
          <p>Setiap tab punya tombol <strong>Cetak</strong>, <strong>Export Excel</strong>, dan <strong>CSV</strong>.</p>
        </div>
      </div>

      <div class="card mb-3" id="sec-laporan">
        <div class="card-header bg-success text-white"><i class="bi bi-file-earmark-text"></i> 6. Laporan Madrasah &amp; KKM</div>
        <div class="card-body">
          <p>Generator laporan formal lengkap (BAB I-V) untuk dokumentasi resmi.</p>
          <ol>
            <li>Buka menu <em>Laporan → Laporan Madrasah</em> atau <em>Laporan KKM</em>.</li>
            <li>Pilih madrasah/KKM dari daftar.</li>
            <li>Isi <strong>Identitas Penanda Tangan</strong> (nama Kepala Madrasah / Pengawas, NIP, kota, tanggal). Untuk Kamad, default-nya otomatis dari record Kamad.</li>
            <li>Klik salah satu tombol output:
              <ul>
                <li><strong>HTML A4</strong> → buka tab baru, langsung Cetak/Simpan PDF dari browser (Ctrl+P).</li>
                <li><strong>DOCX</strong> → download file Word, bisa diedit lebih lanjut.</li>
              </ul>
            </li>
          </ol>
          <p><strong>Struktur laporan:</strong> Cover, Kata Pengantar, Daftar Isi, Halaman Pengesahan, BAB I Pendahuluan (Latar Belakang/Dasar Hukum/Tujuan/Manfaat/Ruang Lingkup), BAB II Landasan Teori, BAB III Profil, BAB IV Hasil Penilaian (tabel per guru + distribusi sebutan + analisis per kompetensi + narasi), BAB V Penutup (Kesimpulan/Rekomendasi/Tindak Lanjut), Lampiran.</p>
          <p><strong>Tanda tangan:</strong></p>
          <ul>
            <li><em>Laporan Madrasah:</em> Kepala Madrasah → mengetahui Pengawas Madrasah.</li>
            <li><em>Laporan KKM:</em> Pengawas Madrasah → mengetahui Ketua Pokjawas Madrasah Kabupaten Jember (otomatis: SUBARIYANTO, S.Pd, M.Pd.I. / NIP. 197002122005011004).</li>
          </ul>
        </div>
      </div>

      <div class="card mb-3" id="sec-import">
        <div class="card-header"><i class="bi bi-cloud-upload"></i> 7. Import Excel</div>
        <div class="card-body">
          <p>Mengimpor data dari aplikasi PKG Excel/xlsm legacy:</p>
          <ul>
            <li><strong>Single import:</strong> upload satu file .xlsm → sistem ekstrak data guru, skor, dan kehadiran.</li>
            <li><strong>Batch import:</strong> upload banyak file sekaligus (misal seluruh madrasah binaan), proses paralel, summary di akhir.</li>
            <li>Mapping NIP otomatis: jika NIP sudah ada, data digabung; jika baru, dibuat record baru.</li>
            <li>Setelah import, cek di menu Data Guru &amp; Rekap untuk memastikan data masuk sesuai harapan.</li>
          </ul>
          <p class="text-muted small"><i class="bi bi-info-circle"></i> Format Excel mengikuti template SK Dirjen Pendis 6673/2019. Sheet, kolom, dan posisi cell harus sesuai template asli agar parser bekerja.</p>
        </div>
      </div>

      <div class="card mb-3" id="sec-instrumen">
        <div class="card-header"><i class="bi bi-list-check"></i> 8. Instrumen</div>
        <div class="card-body">
          <p>Viewer untuk melihat seluruh indikator PKG per peran (407 indikator total).</p>
          <ul>
            <li>Filter per peran lewat dropdown atau URL <code>#/instrumen?role=GMP</code>.</li>
            <li><strong>Override teks:</strong> klik tombol pensil untuk menyesuaikan redaksi indikator atau nama kompetensi tanpa mengubah file <code>instrumen.js</code>. Override tersimpan di localStorage.</li>
            <li>Tombol <em>Reset Override</em> mengembalikan semua teks ke versi default.</li>
          </ul>
        </div>
      </div>

      <div class="card mb-3" id="sec-backup">
        <div class="card-header bg-warning"><i class="bi bi-shield-check"></i> 9. Backup &amp; Restore</div>
        <div class="card-body">
          <p><strong>WAJIB lakukan backup berkala</strong> karena data tersimpan di browser (bisa hilang kalau cache dibersihkan, browser di-uninstall, atau ganti perangkat).</p>
          <ul>
            <li><strong>Backup Madrasah:</strong> export JSON satu madrasah, untuk arsip per satuan pendidikan.</li>
            <li><strong>Backup Kabupaten/KKM:</strong> export JSON seluruh data, untuk arsip lengkap atau pindah perangkat.</li>
            <li><strong>Restore:</strong> mode <em>Replace</em> (timpa data sekarang) atau <em>Merge</em> (gabung, dedup berdasarkan NIP).</li>
            <li><strong>Hapus Semua Data:</strong> reset total semua tabel. Tidak bisa di-undo, pastikan sudah backup dulu.</li>
          </ul>
          <p class="text-success"><i class="bi bi-lightbulb"></i> <strong>Tip:</strong> Simpan file backup ke Google Drive/cloud agar aman dan bisa diakses dari perangkat lain.</p>
        </div>
      </div>

      <div class="card mb-3" id="sec-pwa">
        <div class="card-header"><i class="bi bi-phone"></i> 10. Install sebagai App (PWA)</div>
        <div class="card-body">
          <p>Aplikasi ini bisa di-install di HP/laptop seperti aplikasi native, jalan offline.</p>
          <ul>
            <li><strong>Chrome/Edge desktop:</strong> klik ikon Install di address bar, atau menu ⋮ → Install "Aplikasi PKG".</li>
            <li><strong>Android:</strong> menu Chrome ⋮ → Add to Home screen.</li>
            <li><strong>iOS Safari:</strong> tombol Share → Add to Home Screen.</li>
            <li>Setelah terpasang, app jalan offline sepenuhnya. Update otomatis saat ada koneksi internet.</li>
          </ul>
        </div>
      </div>

      <div class="card mb-3" id="sec-faq">
        <div class="card-header"><i class="bi bi-question-square"></i> 11. FAQ &amp; Troubleshooting</div>
        <div class="card-body">
          <p><strong>Q: Datanya hilang setelah saya bersihkan cache browser, kenapa?</strong><br>
          A: localStorage termasuk dalam cache. Selalu lakukan Backup sebelum bersihkan cache atau reset browser.</p>

          <p><strong>Q: Menu Laporan KKM kosong padahal data guru sudah ada.</strong><br>
          A: Field <code>kkm</code> di Data Guru harus terisi. Buka menu Data Guru → Edit → isi field KKM (misal: "KKMA 04 Jember").</p>

          <p><strong>Q: Halaman Pengesahan masih kosong saat generate laporan.</strong><br>
          A: Untuk Laporan Madrasah, isi field <em>Nama/NIP Kepala Madrasah</em> dan <em>Nama/NIP Pengawas</em> di form generator. Default Kamad otomatis terisi kalau record Kamad ada di menu Data Kamad.</p>

          <p><strong>Q: Tombol HTML A4 tidak membuka tab baru.</strong><br>
          A: Browser memblokir popup. Klik ikon kunci/info di address bar → Allow popups untuk situs ini, lalu coba lagi.</p>

          <p><strong>Q: DOCX gagal di-download dengan pesan "Library docx belum siap".</strong><br>
          A: Pastikan koneksi internet aktif (CDN), lalu refresh halaman dengan Ctrl+Shift+R.</p>

          <p><strong>Q: Pindah perangkat, bagaimana caranya?</strong><br>
          A: Di perangkat lama, buka menu <em>Backup → Backup Kabupaten/KKM → Export</em>. Simpan file JSON. Di perangkat baru, buka aplikasi → menu <em>Backup → Restore</em> → mode Replace, upload file JSON.</p>

          <p><strong>Q: Bisa multi-user?</strong><br>
          A: Tidak. Aplikasi ini dirancang untuk satu pengawas/satu perangkat. Untuk multi-user, gunakan versi server (Express+SQLite) yang ada di repo internal.</p>

          <p><strong>Q: Aplikasi lambat saat data sangat banyak.</strong><br>
          A: localStorage dirancang untuk ratusan-ribuan record, bukan jutaan. Kalau total guru &gt;5000, pertimbangkan migrasi ke versi server.</p>

          <hr>
          <p class="text-muted small mb-0"><i class="bi bi-shield-lock"></i> <strong>Privacy:</strong> Semua data tersimpan lokal di browser Anda. Aplikasi ini tidak mengirim data ke server manapun. Update aplikasi otomatis dari GitHub Pages saat online.</p>
        </div>
      </div>
    </div>
  </div>`;

  document.getElementById('btn-print-panduan').addEventListener('click', () => {
    window.print();
  });

  // Smooth-scroll daftar isi tanpa intercept hash router
  document.querySelectorAll('#panduan-toc a[data-target]').forEach(a => {
    a.addEventListener('click', (ev) => {
      ev.preventDefault();
      const id = a.getAttribute('data-target');
      const target = document.getElementById(id);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

// === INSTRUMEN VIEWER ===================================================
function viewInstrumen(view) {
  const { query } = parseHash();
  const focusRole = query.role || null;
  const overCount = PKGDB.countOverrides();
  view.innerHTML = `
  <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
    <h4 class="mb-0"><i class="bi bi-list-check"></i> Instrumen PKG</h4>
    <div class="d-flex gap-2 flex-wrap">
      ${overCount.total > 0 ? `<button id="btn-reset-all" class="btn btn-sm btn-outline-warning" title="Hapus semua override editan"><i class="bi bi-arrow-counterclockwise"></i> Reset Semua Editan (${overCount.total})</button>` : ''}
      <a href="#/" class="btn btn-sm btn-outline-secondary"><i class="bi bi-arrow-left"></i> Kembali ke Beranda</a>
    </div>
  </div>
  <div class="alert alert-info small">
    Total ${window.INSTRUMEN.length} indikator dari ${PKGDB.ROLES.length} peran. Klik kepala kartu untuk lihat detail.
    <strong>Klik teks indikator</strong> untuk lihat/isi <strong>Catatan Penggalian Data</strong> (metode, sumber, tips).
    Tombol <i class="bi bi-pencil"></i> untuk edit nama kompetensi atau teks indikator (override per device).
    ${overCount.total > 0 ? `<br><strong>Editan aktif:</strong> ${overCount.kompetensi} kompetensi, ${overCount.indikator} indikator.` : ''}
  </div>
  ${PKGDB.ROLES.map(r => {
    const items = PKGDB.getInstrumen(r.role_code);
    const grouped = [];
    for (const it of items) {
      let cur = grouped[grouped.length - 1];
      if (!cur || cur.no !== it.kompetensi_no) {
        cur = { no: it.kompetensi_no, nama: it.kompetensi_nama, items: [] };
        grouped.push(cur);
      }
      cur.items.push(it);
    }
    const isOpen = focusRole === r.role_code;
    return `
    <div class="card mb-3" id="role-${r.role_code}">
      <div class="card-header d-flex justify-content-between" data-bs-toggle="collapse" data-bs-target="#col-${r.role_code}" style="cursor: pointer;">
        <span><i class="bi bi-chevron-down"></i> ${e(r.role_label)} <span class="text-muted small">(${e(r.role_code)} &middot; skor 0-${r.max_score})</span></span>
        <span class="badge bg-light text-dark">${items.length} indikator</span>
      </div>
      <div class="collapse${isOpen ? ' show' : ''}" id="col-${r.role_code}">
        <div class="card-body p-0">
          ${grouped.map(k => {
            const kompKey = `${r.role_code}_${k.no}`;
            return `
            <div class="border-bottom p-3">
              <div class="d-flex justify-content-between align-items-start mb-2 gap-2">
                <div class="fw-semibold flex-grow-1">
                  <span class="badge bg-primary me-1">K${k.no}</span> ${e(k.nama)}
                  ${k.items[0]?._origKompetensi !== k.nama ? '<span class="badge bg-warning text-dark ms-1" title="Sudah diedit">edited</span>' : ''}
                </div>
                <button class="btn btn-sm btn-outline-primary flex-shrink-0" data-edit-komp="${e(r.role_code)}" data-komp-no="${k.no}" data-komp-nama="${e(k.nama)}" data-komp-orig="${e(k.items[0]?._origKompetensi || k.nama)}" title="Edit nama kompetensi"><i class="bi bi-pencil"></i></button>
              </div>
              <ol class="mb-0 small" style="padding-left: 1.5rem;">${k.items.map(it => {
                const pg = PKGDB.getPenggalian(it.id);
                const hasPg = !!pg;
                return `
                <li class="mb-1 d-flex align-items-start gap-2">
                  <span class="flex-grow-1">
                    <a href="#" class="text-decoration-none text-body" data-pg-ind="${e(it.id)}" data-pg-text="${e(it.indikator)}" data-pg-role="${e(r.role_label)}" data-pg-komp="${e(k.nama)}" title="Klik untuk lihat catatan penggalian data">${e(it.indikator)}</a>
                    ${hasPg ? ' <span class="badge bg-info text-dark" title="Ada catatan penggalian data" style="font-size:.65rem">📋 catatan</span>' : ''}
                    ${it.indikator !== it._origIndikator ? ' <span class="badge bg-warning text-dark" title="Sudah diedit" style="font-size:.65rem">edited</span>' : ''}
                  </span>
                  <button class="btn btn-sm btn-link p-0 text-secondary" data-edit-ind="${e(it.id)}" data-ind-text="${e(it.indikator)}" data-ind-orig="${e(it._origIndikator)}" title="Edit indikator"><i class="bi bi-pencil"></i></button>
                </li>`;
              }).join('')}</ol>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;
  }).join('')}`;

  if (focusRole) {
    setTimeout(() => {
      const el = document.getElementById(`role-${focusRole}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  // Wire edit buttons via delegation (more robust against re-renders/collapse interference)
  view.addEventListener('click', (ev) => {
    const editKompBtn = ev.target.closest('[data-edit-komp]');
    if (editKompBtn) {
      ev.stopPropagation();
      ev.preventDefault();
      openEditKompetensiDialog({
        roleCode: editKompBtn.dataset.editKomp,
        kompNo: parseInt(editKompBtn.dataset.kompNo),
        currentText: editKompBtn.dataset.kompNama,
        origText: editKompBtn.dataset.kompOrig,
        onSaved: () => viewInstrumen(view),
      });
      return;
    }
    const editIndBtn = ev.target.closest('[data-edit-ind]');
    if (editIndBtn) {
      ev.stopPropagation();
      ev.preventDefault();
      openEditIndikatorDialog({
        id: editIndBtn.dataset.editInd,
        currentText: editIndBtn.dataset.indText,
        origText: editIndBtn.dataset.indOrig,
        onSaved: () => viewInstrumen(view),
      });
      return;
    }
    const pgBtn = ev.target.closest('[data-pg-ind]');
    if (pgBtn) {
      ev.stopPropagation();
      ev.preventDefault();
      openPenggalianDialog({
        id: pgBtn.dataset.pgInd,
        indikator: pgBtn.dataset.pgText,
        roleLabel: pgBtn.dataset.pgRole,
        kompNama: pgBtn.dataset.pgKomp,
        onSaved: () => viewInstrumen(view),
      });
      return;
    }
    if (ev.target.closest('#btn-reset-all') && overCount.total > 0) {
      ev.stopPropagation();
      ev.preventDefault();
      if (!confirm(`Hapus SEMUA override editan (${overCount.total} item)? Indikator & kompetensi akan kembali ke teks bawaan dari Master PKG.`)) return;
      PKGDB.resetAllOverrides();
      toast('Semua override direset');
      viewInstrumen(view);
    }
  }, { capture: true });
}

function openEditIndikatorDialog(opts) {
  document.getElementById('ind-modal')?.remove();
  const modalHtml = `
  <div class="modal fade" id="ind-modal" tabindex="-1">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header"><h5 class="modal-title">Edit Indikator</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
        <div class="modal-body">
          <div class="mb-2 small text-muted">ID: <code>${e(opts.id)}</code></div>
          <div class="mb-3">
            <label class="form-label small">Teks Bawaan (read-only)</label>
            <textarea class="form-control form-control-sm" rows="3" readonly>${e(opts.origText)}</textarea>
          </div>
          <div class="mb-2">
            <label class="form-label">Teks Indikator</label>
            <textarea id="ind-text" class="form-control" rows="4">${e(opts.currentText)}</textarea>
          </div>
          <div class="small text-muted"><i class="bi bi-info-circle"></i> Override disimpan di browser ini saja (per-device). Tidak mengubah data master.</div>
        </div>
        <div class="modal-footer d-flex justify-content-between">
          ${opts.currentText !== opts.origText ? '<button class="btn btn-outline-warning btn-sm" id="ind-revert"><i class="bi bi-arrow-counterclockwise"></i> Kembalikan ke Bawaan</button>' : '<span></span>'}
          <div>
            <button class="btn btn-light" data-bs-dismiss="modal">Batal</button>
            <button class="btn btn-primary" id="ind-save"><i class="bi bi-check-lg"></i> Simpan</button>
          </div>
        </div>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  const modalEl = document.getElementById('ind-modal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
  modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove(), { once: true });
  document.getElementById('ind-save').addEventListener('click', () => {
    const v = document.getElementById('ind-text').value.trim();
    if (!v) { toast('Teks tidak boleh kosong', 'danger'); return; }
    const newVal = v === opts.origText ? null : v; // restore default if same as original
    PKGDB.setIndikatorOverride(opts.id, newVal);
    toast(newVal == null ? 'Dikembalikan ke bawaan' : 'Indikator disimpan');
    modal.hide();
    if (typeof opts.onSaved === 'function') opts.onSaved();
  });
  document.getElementById('ind-revert')?.addEventListener('click', () => {
    if (!confirm('Kembalikan teks ke bawaan?')) return;
    PKGDB.setIndikatorOverride(opts.id, null);
    toast('Indikator dikembalikan');
    modal.hide();
    if (typeof opts.onSaved === 'function') opts.onSaved();
  });
}

function openEditKompetensiDialog(opts) {
  document.getElementById('kom-modal')?.remove();
  const modalHtml = `
  <div class="modal fade" id="kom-modal" tabindex="-1">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header"><h5 class="modal-title">Edit Nama Kompetensi K${opts.kompNo} (${e(opts.roleCode)})</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label small">Nama Bawaan (read-only)</label>
            <textarea class="form-control form-control-sm" rows="2" readonly>${e(opts.origText)}</textarea>
          </div>
          <div class="mb-2">
            <label class="form-label">Nama Kompetensi</label>
            <textarea id="kom-text" class="form-control" rows="3">${e(opts.currentText)}</textarea>
          </div>
          <div class="small text-muted"><i class="bi bi-info-circle"></i> Berlaku untuk seluruh indikator di kompetensi ini. Override per-device, tidak mengubah master.</div>
        </div>
        <div class="modal-footer d-flex justify-content-between">
          ${opts.currentText !== opts.origText ? '<button class="btn btn-outline-warning btn-sm" id="kom-revert"><i class="bi bi-arrow-counterclockwise"></i> Kembalikan ke Bawaan</button>' : '<span></span>'}
          <div>
            <button class="btn btn-light" data-bs-dismiss="modal">Batal</button>
            <button class="btn btn-primary" id="kom-save"><i class="bi bi-check-lg"></i> Simpan</button>
          </div>
        </div>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  const modalEl = document.getElementById('kom-modal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
  modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove(), { once: true });
  document.getElementById('kom-save').addEventListener('click', () => {
    const v = document.getElementById('kom-text').value.trim();
    if (!v) { toast('Nama tidak boleh kosong', 'danger'); return; }
    const newVal = v === opts.origText ? null : v;
    PKGDB.setKompetensiOverride(opts.roleCode, opts.kompNo, newVal);
    toast(newVal == null ? 'Dikembalikan ke bawaan' : 'Kompetensi disimpan');
    modal.hide();
    if (typeof opts.onSaved === 'function') opts.onSaved();
  });
  document.getElementById('kom-revert')?.addEventListener('click', () => {
    if (!confirm('Kembalikan nama kompetensi ke bawaan?')) return;
    PKGDB.setKompetensiOverride(opts.roleCode, opts.kompNo, null);
    toast('Kompetensi dikembalikan');
    modal.hide();
    if (typeof opts.onSaved === 'function') opts.onSaved();
  });
}

function openPenggalianDialog(opts) {
  document.getElementById('pg-modal')?.remove();
  const existing = PKGDB.getPenggalian(opts.id) || null;
  // Find role_code & komp_no & ind_no dari id (format: ROLE_komp_indikator)
  const parts = String(opts.id).split('_');
  const roleCode = parts[0];
  const kompNo = parseInt(parts[1]);
  const indNo = parseInt(parts[2]);
  // Prioritas: per-indikator > per-kompetensi
  const saranInd = (window.SARAN_INDIKATOR && window.SARAN_INDIKATOR[roleCode] && window.SARAN_INDIKATOR[roleCode][kompNo] && window.SARAN_INDIKATOR[roleCode][kompNo][indNo]) || null;
  const saranKomp = (window.SARAN_DOKUMEN && window.SARAN_DOKUMEN[roleCode] && window.SARAN_DOKUMEN[roleCode][kompNo]) || null;
  const saran = saranInd || saranKomp;
  const saranScope = saranInd ? 'indikator' : (saranKomp ? 'kompetensi' : null);
  // Pakai existing kalau ada, kalau tidak fallback ke saran (untuk pre-fill UX)
  const data = existing || (saran ? { metode: saran.metode || [], sumber: saran.sumber || '', catatan: saran.catatan || '' } : { metode: [], sumber: '', catatan: '' });
  const metode = Array.isArray(data.metode) ? data.metode : [];
  const has = (k) => metode.includes(k);
  const modalHtml = `
  <div class="modal fade" id="pg-modal" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title"><i class="bi bi-clipboard-data"></i> Catatan Penggalian Data</h5>
          <button class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div class="mb-2 small text-muted">${e(opts.roleLabel)} &middot; ${e(opts.kompNama)}</div>
          <div class="alert alert-light border mb-3">
            <div class="small text-muted mb-1">Indikator</div>
            <div class="fw-semibold">${e(opts.indikator)}</div>
          </div>
          <div class="mb-3">
            <label class="form-label">Metode Penggalian Data</label>
            <div class="d-flex flex-wrap gap-3">
              <div class="form-check"><input class="form-check-input" type="checkbox" id="pg-m-obs" value="observasi" ${has('observasi') ? 'checked' : ''}><label class="form-check-label" for="pg-m-obs">👁️ Observasi</label></div>
              <div class="form-check"><input class="form-check-input" type="checkbox" id="pg-m-doc" value="dokumen" ${has('dokumen') ? 'checked' : ''}><label class="form-check-label" for="pg-m-doc">📄 Studi Dokumen</label></div>
              <div class="form-check"><input class="form-check-input" type="checkbox" id="pg-m-wwc" value="wawancara" ${has('wawancara') ? 'checked' : ''}><label class="form-check-label" for="pg-m-wwc">🗣️ Wawancara</label></div>
              <div class="form-check"><input class="form-check-input" type="checkbox" id="pg-m-ang" value="angket" ${has('angket') ? 'checked' : ''}><label class="form-check-label" for="pg-m-ang">✍️ Angket</label></div>
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label">Sumber Data</label>
            <textarea id="pg-sumber" class="form-control" rows="3" placeholder="Mis. RPP, jurnal mengajar, hasil supervisi, dokumen kurikulum...">${e(data.sumber || '')}</textarea>
          </div>
          <div class="mb-2">
            <label class="form-label">Catatan Penggalian Data</label>
            <textarea id="pg-catatan" class="form-control" rows="6" placeholder="Tulis tips/petunjuk teknis: apa yang dicari, bukti yang diperlukan, pertanyaan kunci wawancara, dst.">${e(data.catatan || '')}</textarea>
          </div>
          ${existing && existing.updated_at ? `<div class="small text-muted mt-2"><i class="bi bi-clock-history"></i> Terakhir diubah: ${fmtDate(existing.updated_at)}</div>` : (saran ? `<div class="small text-success mt-2"><i class="bi bi-info-circle"></i> Pre-isi dari saran dokumen ${saranScope === 'indikator' ? 'spesifik <strong>per-indikator</strong>' : '<strong>per-kompetensi</strong>'}. Ubah/tambahkan sesuai kebutuhan, lalu Simpan.</div>` : '')}
        </div>
        <div class="modal-footer d-flex justify-content-between">
          ${existing && existing.updated_at ? '<button class="btn btn-outline-danger btn-sm" id="pg-clear"><i class="bi bi-trash"></i> Hapus Catatan</button>' : '<span></span>'}
          <div>
            <button class="btn btn-light" data-bs-dismiss="modal">Tutup</button>
            <button class="btn btn-primary" id="pg-save"><i class="bi bi-check-lg"></i> Simpan</button>
          </div>
        </div>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  const modalEl = document.getElementById('pg-modal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
  modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove(), { once: true });
  document.getElementById('pg-save').addEventListener('click', () => {
    const m = [];
    if (document.getElementById('pg-m-obs').checked) m.push('observasi');
    if (document.getElementById('pg-m-doc').checked) m.push('dokumen');
    if (document.getElementById('pg-m-wwc').checked) m.push('wawancara');
    if (document.getElementById('pg-m-ang').checked) m.push('angket');
    const data = {
      metode: m,
      sumber: document.getElementById('pg-sumber').value.trim(),
      catatan: document.getElementById('pg-catatan').value.trim(),
    };
    PKGDB.setPenggalian(opts.id, data);
    toast('Catatan penggalian disimpan');
    modal.hide();
    if (typeof opts.onSaved === 'function') opts.onSaved();
  });
  document.getElementById('pg-clear')?.addEventListener('click', () => {
    if (!confirm('Hapus catatan penggalian untuk indikator ini?')) return;
    PKGDB.setPenggalian(opts.id, null);
    toast('Catatan dihapus');
    modal.hide();
    if (typeof opts.onSaved === 'function') opts.onSaved();
  });
}

// === IMPORT =============================================================
function viewImport(view) {
  view.innerHTML = `
  <h4 class="mb-3"><i class="bi bi-cloud-upload"></i> Import dari Master PKG</h4>
  <ul class="nav nav-tabs mb-3">
    <li class="nav-item"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#tab-single">Satu File</button></li>
    <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-batch">Banyak File (Batch)</button></li>
  </ul>
  <div class="tab-content">
    <div class="tab-pane fade show active" id="tab-single">
      <div class="row g-3">
        <div class="col-lg-7">
          <div class="card">
            <div class="card-header">Upload 1 File Master PKG (.xlsm / .xlsx)</div>
            <form id="form-single" class="card-body">
              <div class="mb-3">
                <input type="file" class="form-control" name="file" accept=".xlsx,.xlsm" required>
                <div class="form-text">File Master PKG yang sudah diisi (identitas + skor PKKM_*).</div>
              </div>
              <button class="btn btn-primary"><i class="bi bi-upload"></i> Import</button>
            </form>
          </div>
          <div id="single-result" class="mt-3"></div>
        </div>
        <div class="col-lg-5"><div class="card">
          <div class="card-header"><i class="bi bi-info-circle"></i> Cara Kerja</div>
          <div class="card-body small">
            <ul class="mb-2">
              <li>Identitas dibaca dari sheet <code>DATA</code></li>
              <li>Skor dibaca dari sheet <code>PKKM_*</code> (tanda X di kolom skor)</li>
              <li>Upsert by NIP - import ulang aman, tidak duplikat</li>
              <li>Butuh internet pertama kali untuk load library Excel</li>
            </ul>
          </div>
        </div></div>
      </div>
    </div>
    <div class="tab-pane fade" id="tab-batch">
      <div class="row g-3">
        <div class="col-lg-7">
          <div class="card">
            <div class="card-header">Upload Banyak File Sekaligus</div>
            <form id="form-batch" class="card-body">
              <div class="mb-3">
                <input type="file" class="form-control" name="files" accept=".xlsx,.xlsm" multiple required>
                <div class="form-text">Pilih beberapa file (Ctrl/Shift+klik). Diproses berurutan.</div>
              </div>
              <button class="btn btn-primary"><i class="bi bi-cloud-upload"></i> Import Semua</button>
            </form>
          </div>
          <div id="batch-result" class="mt-3"></div>
        </div>
        <div class="col-lg-5"><div class="card">
          <div class="card-header"><i class="bi bi-lightbulb"></i> Tips</div>
          <div class="card-body small">
            <ul class="mb-0">
              <li>Pakai mode batch kalau Bapak punya banyak file Master PKG (mis. satu folder per madrasah)</li>
              <li>Kalau ada file gagal, cek apakah sheet <code>DATA</code> di file tersebut sudah diisi</li>
              <li>File yang berhasil tetap masuk DB walau ada file lain gagal</li>
              <li>Browser punya batas RAM; kalau ratusan file, bagi 50-an per upload</li>
            </ul>
          </div>
        </div></div>
      </div>
    </div>
  </div>`;

  $('#form-single').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const fileInput = ev.target.querySelector('input[type=file]');
    const file = fileInput.files[0];
    if (!file) return;
    const result = $('#single-result');
    result.innerHTML = '<div class="alert alert-info"><i class="bi bi-hourglass"></i> Memproses...</div>';
    try {
      const buf = await file.arrayBuffer();
      const r = await PKGImport.importOne(buf);
      result.innerHTML = `
        <div class="alert alert-success">
          <i class="bi bi-check-circle"></i> Berhasil import: <strong>${e(r.guruNama)}</strong>
          <a href="#/guru/${r.guruId}" class="btn btn-sm btn-outline-success ms-2">Buka Profil</a>
        </div>
        <div class="card mt-3">
          <div class="card-header">Ringkasan Skor</div>
          <div class="table-responsive"><table class="table table-sm mb-0">
            <thead class="table-light"><tr><th>Peran</th><th>Jenis</th><th>Tersimpan</th><th>Total</th><th>Skip</th></tr></thead>
            <tbody>
              ${r.summary.length === 0 ? '<tr><td colspan="5" class="text-center text-muted py-3">Tidak ada peran dengan skor terisi</td></tr>' : ''}
              ${r.summary.map(s => `<tr><td>${e(s.role)}</td><td><span class="badge bg-secondary text-uppercase">${e(s.jenis)}</span></td><td>${s.saved}</td><td>${s.total}</td><td>${s.skipped}</td></tr>`).join('')}
            </tbody>
          </table></div>
        </div>`;
      fileInput.value = '';
    } catch (err) {
      console.error(err);
      result.innerHTML = `<div class="alert alert-danger"><i class="bi bi-exclamation-triangle"></i> ${e(err.message)}</div>`;
    }
  });

  $('#form-batch').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const fileInput = ev.target.querySelector('input[type=file]');
    const files = Array.from(fileInput.files);
    if (!files.length) return;
    const result = $('#batch-result');
    result.innerHTML = `<div class="alert alert-info"><i class="bi bi-hourglass"></i> Memproses 0/${files.length}...</div>`;
    const results = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      result.querySelector('.alert').innerHTML = `<i class="bi bi-hourglass"></i> Memproses ${i + 1}/${files.length}: ${e(f.name)}`;
      try {
        const buf = await f.arrayBuffer();
        const r = await PKGImport.importOne(buf);
        const totalSkor = r.summary.reduce((a, b) => a + b.saved, 0);
        const totalSkipped = r.summary.reduce((a, b) => a + b.skipped, 0);
        results.push({ file: f.name, ok: true, guruId: r.guruId, guruNama: r.guruNama, nip: r.identitas.nip || '-', peran: r.summary.length, totalSkor, totalSkipped });
      } catch (err) {
        results.push({ file: f.name, ok: false, error: err.message });
      }
    }
    const okCount = results.filter(b => b.ok).length;
    result.innerHTML = `
      <div class="card">
        <div class="card-header d-flex justify-content-between">
          <span>Hasil Batch Import</span>
          <span class="small text-muted">${okCount} sukses / ${results.length - okCount} gagal</span>
        </div>
        <div class="table-responsive"><table class="table table-sm mb-0">
          <thead class="table-light"><tr><th>File</th><th>Status</th><th>Guru</th><th>NIP</th><th>Peran</th><th>Skor</th></tr></thead>
          <tbody>
            ${results.map(b => b.ok ? `
              <tr><td class="small">${e(b.file)}</td><td><span class="badge bg-success">OK</span></td><td><a href="#/guru/${b.guruId}">${e(b.guruNama)}</a></td><td class="small">${e(b.nip)}</td><td>${b.peran}</td><td>${b.totalSkor}${b.totalSkipped ? ` <span class="text-warning small">(skip ${b.totalSkipped})</span>` : ''}</td></tr>
            ` : `
              <tr class="table-danger"><td class="small">${e(b.file)}</td><td><span class="badge bg-danger">GAGAL</span></td><td colspan="4" class="small">${e(b.error)}</td></tr>
            `).join('')}
          </tbody>
        </table></div>
      </div>`;
    fileInput.value = '';
  });
}

// === BACKUP / RESTORE ===================================================
function viewBackupMadrasah(view) {
  const stats = PKGDB.getStats();
  view.innerHTML = `
  <h4 class="mb-1"><i class="bi bi-building"></i> Backup Madrasah</h4>
  <p class="text-muted small mb-3">Untuk kamad / pengawas: backup data PKG <strong>1 madrasah</strong> dari device ini, lalu kirim file ke pengawas KKM/Kabupaten.</p>
  <div class="alert alert-warning small">
    <i class="bi bi-exclamation-triangle"></i>
    <strong>Penting:</strong> Data tersimpan di browser ini saja. Kalau ganti device atau clear browser, data hilang. Backup berkala &amp; restore di device lain pakai fitur ini.
  </div>

  <div class="row g-3">
    <div class="col-md-6">
      <div class="card h-100">
        <div class="card-header bg-primary text-white"><i class="bi bi-download"></i> Export (Backup) Madrasah</div>
        <div class="card-body">
          <p class="small text-muted">Download seluruh data PKG di browser ini (${stats.guru} guru, ${stats.penilaian} penilaian) sebagai 1 file JSON. Simpan di Google Drive / WhatsApp / email untuk arsip atau kirim ke pengawas KKM.</p>
          <button id="btn-export" class="btn btn-primary"><i class="bi bi-download"></i> Download Backup</button>
        </div>
      </div>
    </div>
    <div class="col-md-6">
      <div class="card h-100">
        <div class="card-header bg-success text-white"><i class="bi bi-upload"></i> Import (Restore) Madrasah</div>
        <div class="card-body">
          <p class="small text-muted">Upload <strong>1 file</strong> backup JSON. Mode <strong>Replace</strong> = ganti seluruh data. Mode <strong>Merge</strong> = gabung dengan data sekarang (dedup by NIP).</p>
          <input type="file" id="restore-file" class="form-control mb-2" accept=".json">
          <div class="form-check mb-2">
            <input class="form-check-input" type="radio" name="mode" value="replace" id="mode-replace" checked>
            <label class="form-check-label small" for="mode-replace">Replace (ganti semua)</label>
          </div>
          <div class="form-check mb-2">
            <input class="form-check-input" type="radio" name="mode" value="merge" id="mode-merge">
            <label class="form-check-label small" for="mode-merge">Merge (gabung)</label>
          </div>
          <button id="btn-restore" class="btn btn-success"><i class="bi bi-upload"></i> Restore</button>
        </div>
      </div>
    </div>
    <div class="col-12">
      <div class="alert alert-info small mb-0">
        <i class="bi bi-info-circle"></i>
        Untuk <strong>menggabungkan banyak backup</strong> dari beberapa madrasah jadi rekap KKM/Kabupaten, gunakan menu <a href="#/backup-kabupaten" class="alert-link"><i class="bi bi-geo-alt-fill"></i> Backup Kabupaten / KKM</a>.
      </div>
    </div>
  </div>`;

  $('#btn-export').addEventListener('click', () => {
    const data = PKGDB.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const namaFile = (PKGDB.listKamad()[0]?.nama_madrasah || 'madrasah').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    a.href = url; a.download = `pkg-backup-${namaFile}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Backup didownload');
  });

  $('#btn-restore').addEventListener('click', async () => {
    const f = $('#restore-file').files[0];
    if (!f) { toast('Pilih file backup dulu', 'danger'); return; }
    const mode = document.querySelector('input[name="mode"]:checked').value;
    if (mode === 'replace' && !confirm('Mode REPLACE akan mengganti SELURUH data sekarang. Lanjutkan?')) return;
    try {
      const text = await f.text();
      const json = JSON.parse(text);
      const r = PKGDB.importAll(json, mode);
      toast(`Restore berhasil (mode: ${r.mode})`);
      navigate('/');
    } catch (err) {
      toast('Gagal restore: ' + err.message, 'danger');
    }
  });
}

function viewBackupKabupaten(view) {
  const stats = PKGDB.getStats();
  // Hitung scope info
  const allGuru = PKGDB.listGuru();
  const madrasahSet = new Set(allGuru.map(g => (g.nama_madrasah || '').trim()).filter(Boolean));
  const kkmSet = new Set(allGuru.map(g => (g.kkm || '').trim()).filter(Boolean));
  const kabSet = new Set(allGuru.map(g => (g.kabupaten || '').trim()).filter(Boolean));

  view.innerHTML = `
  <h4 class="mb-1"><i class="bi bi-geo-alt-fill"></i> Backup Kabupaten / KKM</h4>
  <p class="text-muted small mb-3">Untuk pengawas KKM / Ketua Pokjawas Kabupaten: gabung <strong>banyak file backup</strong> dari beberapa madrasah jadi 1 rekap KKM atau Kabupaten.</p>

  <div class="alert alert-info small">
    <i class="bi bi-info-circle"></i>
    Status data sekarang di browser ini: <strong>${madrasahSet.size}</strong> madrasah, <strong>${kkmSet.size}</strong> KKM, <strong>${kabSet.size}</strong> kabupaten, total ${stats.guru} guru.
  </div>

  <div class="row g-3">
    <div class="col-12">
      <div class="card border-success">
        <div class="card-header bg-success text-white"><i class="bi bi-files"></i> Gabung Backup dari Banyak Madrasah</div>
        <div class="card-body">
          <p class="small text-muted mb-2">
            Upload <strong>banyak file backup</strong> JSON sekaligus dari madrasah/KKM binaan. Sistem dedup guru by NIP, semua penilaian/skor/PKB ID di-remap. Aman: data yang sudah ada tidak dihapus.
          </p>
          <div class="alert alert-light small mb-2">Tip: kumpulkan file <code>pkg-backup-*.json</code> dari semua kamad/pengawas, taruh di 1 folder, lalu pilih semuanya di sini (<code>Ctrl+A</code> di dialog file).</div>
          <input type="file" id="merge-files" class="form-control mb-2" accept=".json" multiple>
          <div class="form-check mb-2">
            <input class="form-check-input" type="checkbox" id="merge-tag-source" checked>
            <label class="form-check-label small" for="merge-tag-source">Tandai data dengan asal file (audit trail)</label>
          </div>
          <button id="btn-merge" class="btn btn-success"><i class="bi bi-files"></i> Gabung Backup Terpilih</button>
          <div id="merge-result" class="mt-3"></div>
        </div>
      </div>
    </div>

    <div class="col-md-6">
      <div class="card h-100">
        <div class="card-header"><i class="bi bi-download"></i> Export Agregat (KKM / Kabupaten)</div>
        <div class="card-body">
          <p class="small text-muted">Setelah gabung dari banyak madrasah, download backup agregat untuk arsip pengawas KKM/Kabupaten. Filename otomatis pakai label scope.</p>
          <button id="btn-export-agg" class="btn btn-outline-primary"><i class="bi bi-download"></i> Download Backup Agregat</button>
        </div>
      </div>
    </div>
    <div class="col-md-6">
      <div class="card h-100">
        <div class="card-header"><i class="bi bi-arrow-right-circle"></i> Lanjut ke Rekap</div>
        <div class="card-body">
          <p class="small text-muted">Setelah gabung backup, buka menu Rekap untuk lihat 3 prioritas PKB per madrasah / KKM / kabupaten.</p>
          <a href="#/rekap?tab=pkb-madrasah&scope=madrasah" class="btn btn-sm btn-outline-success"><i class="bi bi-building"></i> Per Madrasah</a>
          <a href="#/rekap?tab=pkb-madrasah&scope=kkm" class="btn btn-sm btn-outline-success"><i class="bi bi-diagram-3"></i> Per KKM</a>
          <a href="#/rekap?tab=pkb-madrasah&scope=kabupaten" class="btn btn-sm btn-outline-success"><i class="bi bi-geo-alt-fill"></i> Per Kabupaten</a>
        </div>
      </div>
    </div>
  </div>`;

  $('#btn-merge').addEventListener('click', async () => {
    const files = Array.from($('#merge-files').files || []);
    if (files.length === 0) { toast('Pilih minimal 1 file backup', 'danger'); return; }
    const tagSource = $('#merge-tag-source').checked;
    const resultEl = document.getElementById('merge-result');
    resultEl.innerHTML = '<div class="alert alert-info small"><i class="bi bi-hourglass-split"></i> Memproses ' + files.length + ' file...</div>';
    try {
      const backups = [];
      for (const f of files) {
        try {
          const text = await f.text();
          const json = JSON.parse(text);
          if (tagSource) json._source_label = f.name;
          backups.push(json);
        } catch (err) {
          backups.push(null);
        }
      }
      const result = PKGDB.mergeBackups(backups, { tagSource });
      resultEl.innerHTML = `
        <div class="alert alert-success">
          <strong><i class="bi bi-check-circle"></i> Berhasil gabung ${result.files} file</strong>
          <ul class="mb-0 mt-2 small">
            <li>Guru ditambahkan: <strong>${result.guru_added}</strong>, dedup (sudah ada): <strong>${result.guru_dedup}</strong></li>
            <li>Kamad ditambahkan: <strong>${result.kamad_added}</strong></li>
            <li>Penilaian: <strong>${result.penilaian_added}</strong>, Skor: <strong>${result.skor_added}</strong></li>
            <li>Kehadiran: <strong>${result.kehadiran_added}</strong>, PKB: <strong>${result.pkb_added}</strong></li>
            ${result.errors.length ? `<li class="text-danger">Error: ${result.errors.join(', ')}</li>` : ''}
          </ul>
          <div class="mt-2">
            <a href="#/rekap?tab=pkb-madrasah&scope=madrasah" class="btn btn-sm btn-success"><i class="bi bi-building"></i> Rekap Per Madrasah</a>
            <a href="#/rekap?tab=pkb-madrasah&scope=kkm" class="btn btn-sm btn-success"><i class="bi bi-diagram-3"></i> Rekap Per KKM</a>
            <a href="#/rekap?tab=pkb-madrasah&scope=kabupaten" class="btn btn-sm btn-success"><i class="bi bi-geo-alt-fill"></i> Rekap Per Kabupaten</a>
          </div>
        </div>`;
      toast(`Gabung ${result.files} file berhasil`);
    } catch (err) {
      console.error(err);
      resultEl.innerHTML = '<div class="alert alert-danger small">Gagal gabung: ' + e(err.message) + '</div>';
    }
  });

  $('#btn-export-agg').addEventListener('click', () => {
    const data = PKGDB.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const allGuru = PKGDB.listGuru();
    const kabSet = new Set(allGuru.map(g => (g.kabupaten || '').trim()).filter(Boolean));
    const kkmSet = new Set(allGuru.map(g => (g.kkm || '').trim()).filter(Boolean));
    let label = 'agregat';
    if (kabSet.size === 1) label = 'kab-' + Array.from(kabSet)[0].replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    else if (kkmSet.size === 1) label = 'kkm-' + Array.from(kkmSet)[0].replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    a.href = url; a.download = `pkg-backup-${label}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Backup agregat didownload');
  });
}

function viewBackupClear(view) {
  const stats = PKGDB.getStats();
  view.innerHTML = `
  <h4 class="mb-1 text-danger"><i class="bi bi-trash"></i> Hapus Semua Data</h4>
  <p class="text-muted small mb-3">Tindakan ini akan menghapus seluruh data PKG di browser ini.</p>

  <div class="alert alert-danger">
    <h5 class="alert-heading"><i class="bi bi-exclamation-triangle"></i> Bahaya!</h5>
    <p class="mb-2">Akan dihapus permanen:</p>
    <ul class="mb-2">
      <li><strong>${stats.guru}</strong> data guru</li>
      <li><strong>${stats.penilaian}</strong> hasil penilaian + skor</li>
      <li>Data kamad, kehadiran, PKB, override instrumen, catatan penggalian</li>
    </ul>
    <p class="mb-0"><strong>Pastikan Bapak sudah download Backup dulu!</strong> Tindakan ini tidak bisa di-undo.</p>
  </div>

  <div class="d-flex gap-2">
    <a href="#/backup" class="btn btn-outline-primary"><i class="bi bi-download"></i> Download Backup Dulu</a>
    <button id="btn-clear" class="btn btn-danger"><i class="bi bi-trash"></i> Hapus Semua Data</button>
  </div>`;

  $('#btn-clear').addEventListener('click', () => {
    if (!confirm('YAKIN hapus semua data? Pastikan sudah backup. Tindakan ini tidak bisa dibatalkan.')) return;
    if (!confirm('Konfirmasi sekali lagi: HAPUS SEMUA?')) return;
    PKGDB.clearAll();
    toast('Semua data dihapus');
    navigate('/');
  });
}

// === CETAK ==============================================================
function viewCetak(view, guruId, role, jenis) {
  const g = PKGDB.getGuru(guruId);
  if (!g) { view.innerHTML = '<div class="alert alert-warning">Guru tidak ditemukan</div>'; return; }
  const meta = PKGDB.getRoleMeta(role);
  if (!meta) { view.innerHTML = '<div class="alert alert-warning">Peran tidak ditemukan</div>'; return; }
  jenis = jenis === 'formatif' ? 'formatif' : 'sumatif';
  const pen = PKGDB.getOrCreatePenilaian(guruId, role, jenis);
  const skorMap = PKGDB.getSkorMap(pen.id);
  const instrumen = PKGDB.getInstrumen(role);

  const grouped = [];
  for (const it of instrumen) {
    let cur = grouped[grouped.length - 1];
    if (!cur || cur.no !== it.kompetensi_no) {
      cur = { no: it.kompetensi_no, nama: it.kompetensi_nama, items: [], sum: 0, maks: 0 };
      grouped.push(cur);
    }
    cur.items.push(it);
  }
  for (const k of grouped) {
    for (const it of k.items) {
      const s = skorMap[it.id];
      if (typeof s === 'number') k.sum += s;
    }
    k.maks = k.items.length * meta.max_score;
  }
  const nilai = PKGDB.hitungNilai(pen.id, role);

  view.innerHTML = `
  <div class="no-print" style="text-align:right; padding:8px;">
    <button class="btn btn-primary btn-sm" onclick="window.print()"><i class="bi bi-printer"></i> Cetak / Simpan PDF</button>
    <a class="btn btn-light btn-sm" href="#/guru/${g.id}">Tutup</a>
  </div>
  <div id="cetak-area" style="font-family: 'Times New Roman', serif; font-size: 11pt; color:#000; background:white; padding: 1cm; max-width: 21cm; margin: 0 auto; box-shadow: 0 2px 8px rgba(0,0,0,.1);">
    <div style="text-align:center; margin-bottom: 12px;">
      <div><b>KEMENTERIAN AGAMA KABUPATEN JEMBER</b></div>
      <h3 style="margin:.4em 0;">INSTRUMEN PENILAIAN KINERJA ${e(meta.role_label.toUpperCase())}</h3>
      <div>Tahun Pelajaran ${e(g.tahun_pelajaran || '-')} &middot; Semester ${e(g.semester || '-')}</div>
      <div>Jenis: <b>${jenis.toUpperCase()}</b></div>
    </div>

    <table style="width:100%; margin-bottom:10px;">
      <tr><td style="width:30%; padding:2px 4px;">Nama Guru</td><td style="padding:2px 4px;">: <b>${e(g.nama)}</b></td></tr>
      <tr><td style="padding:2px 4px;">NIP / NUPTK</td><td style="padding:2px 4px;">: ${e(g.nip || '-')} / ${e(g.nuptk || '-')}</td></tr>
      <tr><td style="padding:2px 4px;">Mapel / Kelas</td><td style="padding:2px 4px;">: ${e(g.mapel_kelas || '-')}</td></tr>
      <tr><td style="padding:2px 4px;">Madrasah</td><td style="padding:2px 4px;">: ${e(g.nama_madrasah || '-')}</td></tr>
      <tr><td style="padding:2px 4px;">Tanggal Penilaian</td><td style="padding:2px 4px;">: ${e(pen.tanggal || '-')}</td></tr>
    </table>

    <table style="width:100%; border-collapse:collapse;">
      <thead><tr>
        <th style="border:1px solid #444; padding:4px; background:#f0f0f0; width:30px;">No</th>
        <th style="border:1px solid #444; padding:4px; background:#f0f0f0;">Indikator</th>
        <th style="border:1px solid #444; padding:4px; background:#f0f0f0; width:60px; text-align:center;">Skor</th>
      </tr></thead>
      <tbody>
        ${grouped.map(k => `
          <tr><td colspan="3" style="border:1px solid #444; padding:4px; background:#eef; font-weight:bold;">Kompetensi ${k.no}: ${e(k.nama)}</td></tr>
          ${k.items.map((it, idx) => `
            <tr>
              <td style="border:1px solid #444; padding:4px; text-align:center;">${idx + 1}</td>
              <td style="border:1px solid #444; padding:4px;">${e(it.indikator)}</td>
              <td style="border:1px solid #444; padding:4px; text-align:center;">${skorMap[it.id] !== undefined ? skorMap[it.id] : '-'}</td>
            </tr>
          `).join('')}
          <tr style="font-weight:bold;"><td colspan="2" style="border:1px solid #444; padding:4px; text-align:right;">Total Skor Kompetensi ${k.no}</td><td style="border:1px solid #444; padding:4px; text-align:center;">${k.sum} / ${k.maks} (${k.maks ? ((k.sum / k.maks) * 100).toFixed(1) : '0'}%)</td></tr>
        `).join('')}
      </tbody>
    </table>

    <table style="width:100%; margin-top:12px; border-collapse:collapse;">
      <tr><td style="width:60%; border:1px solid #444; padding:4px;"><b>Nilai Akhir</b></td><td style="border:1px solid #444; padding:4px; text-align:center;"><b>${nilai.nilaiAkhir.toFixed(2)}</b></td></tr>
      <tr><td style="border:1px solid #444; padding:4px;"><b>Sebutan</b></td><td style="border:1px solid #444; padding:4px; text-align:center;"><b>${e(nilai.sebutan)}</b></td></tr>
    </table>

    ${pen.catatan ? `<div style="margin-top:10px;"><b>Catatan:</b> ${e(pen.catatan)}</div>` : ''}

    <table style="width:100%; margin-top:30px;">
      <tr>
        <td style="width:50%; text-align:center; height:90px; vertical-align:top;">
          Guru yang Dinilai,<br><br><br><br>
          <b><u>${e(g.nama)}</u></b><br>
          NIP. ${e(g.nip || '-')}
        </td>
        <td style="width:50%; text-align:center; height:90px; vertical-align:top;">
          Penilai,<br><br><br><br>
          <b><u>${e(g.nama_penilai || '..............................')}</u></b><br>
          NIP. ${e(g.nip_penilai || '-')}
        </td>
      </tr>
    </table>
  </div>`;
}

// === BOOT ===============================================================
window.render = render;
window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', async () => {
  renderShell();

  // PIN gate: kalau PIN aktif tapi belum unlock, tampilkan lock screen.
  // PKGAuth.init() resolve setelah unlocked.
  if (window.PKGAuth) {
    await window.PKGAuth.init();
  }

  render();

  // Wire up tombol Logout di navbar (event delegation karena renderShell
  // dipanggil sekali saja, tapi link ada di shell).
  document.body.addEventListener('click', (ev) => {
    const t = ev.target.closest('#nav-logout');
    if (!t) return;
    ev.preventDefault();
    if (window.PKGAuth) window.PKGAuth.logout();
  });

  // Service worker (PWA) with auto-update
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(reg => {
      // Check for updates every 60 seconds while page is open
      setInterval(() => reg.update().catch(() => {}), 60000);
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateBanner();
          }
        });
      });
    }).catch(() => {});
    navigator.serviceWorker.addEventListener('message', (ev) => {
      if (ev.data && ev.data.type === 'SW_UPDATED') {
        showUpdateBanner();
      }
    });
  }
});

function showUpdateBanner() {
  if (document.getElementById('upd-banner')) return;
  const div = document.createElement('div');
  div.id = 'upd-banner';
  div.className = 'install-banner';
  div.innerHTML = `<i class="bi bi-arrow-clockwise"></i> <span class="flex-grow-1">Versi baru tersedia.</span><button id="btn-upd-reload">Muat Ulang</button>`;
  document.body.appendChild(div);
  document.getElementById('btn-upd-reload').addEventListener('click', () => {
    location.reload();
  });
}

