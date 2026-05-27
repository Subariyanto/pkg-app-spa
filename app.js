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
          <li class="nav-item"><a class="nav-link" href="#/rekap"><i class="bi bi-table"></i> Rekap</a></li>
          <li class="nav-item"><a class="nav-link" href="#/import"><i class="bi bi-cloud-upload"></i> Import</a></li>
          <li class="nav-item"><a class="nav-link" href="#/instrumen"><i class="bi bi-list-check"></i> Instrumen</a></li>
          <li class="nav-item"><a class="nav-link" href="#/backup"><i class="bi bi-shield-check"></i> Backup</a></li>
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
  if (s0 === 'guru' && s1 === 'new') return viewGuruForm(view, null);
  if (s0 === 'guru' && s1 && s2 === 'edit') return viewGuruForm(view, s1);
  if (s0 === 'guru' && s1 && s2 === 'nilai' && s3) return viewNilai(view, s1, s3, query.jenis || 'sumatif');
  if (s0 === 'guru' && s1 && s2 === 'cetak' && s3) return viewCetak(view, s1, s3, query.jenis || 'sumatif');
  if (s0 === 'guru' && s1) return viewGuruDetail(view, s1);

  if (s0 === 'rekap') return viewRekap(view);
  if (s0 === 'instrumen') return viewInstrumen(view);
  if (s0 === 'import') return viewImport(view);
  if (s0 === 'backup') return viewBackup(view);

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

// === GURU LIST ==========================================================
function viewGuruList(view) {
  const { query } = parseHash();
  const q = query.q || '';
  const rows = PKGDB.listGuru(q);
  view.innerHTML = `
  <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
    <h4 class="mb-0"><i class="bi bi-people"></i> Data Guru <span class="badge bg-secondary">${rows.length}</span></h4>
    <a href="#/guru/new" class="btn btn-primary"><i class="bi bi-plus-lg"></i> Tambah Guru</a>
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
                <a class="btn btn-sm btn-outline-secondary" href="#/guru/${g.id}"><i class="bi bi-eye"></i></a>
                <a class="btn btn-sm btn-outline-primary" href="#/guru/${g.id}/edit"><i class="bi bi-pencil"></i></a>
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
                  <td><button class="btn btn-sm btn-link text-danger p-0" data-del-kh="${k.id}"><i class="bi bi-trash"></i></button></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="tab-pane fade" id="t-pkb">
      <div class="card">
        <div class="card-header">Rencana Pengembangan Keprofesian Berkelanjutan (PKB)</div>
        <form id="form-pkb" class="card-body">
          ${[1,2,3].map(i => {
            const p = pkb.find(x => x.prioritas === i) || {};
            return `
            <div class="mb-3 p-3 border rounded">
              <div class="fw-semibold mb-2">Prioritas ${i}</div>
              <div class="row g-2">
                <div class="col-md-4"><label class="form-label small">Kompetensi</label><input class="form-control" name="kompetensi_${i}" value="${e(p.kompetensi || '')}"></div>
                <div class="col-md-4"><label class="form-label small">Rencana Kegiatan</label><input class="form-control" name="rencana_${i}" value="${e(p.rencana || '')}"></div>
                <div class="col-md-4"><label class="form-label small">Target</label><input class="form-control" name="target_${i}" value="${e(p.target || '')}"></div>
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
        <div class="card kompetensi-card mb-3">
          <div class="card-header d-flex justify-content-between">
            <span><span class="badge bg-primary me-1">K${k.no}</span> ${e(k.nama)}</span>
            <span class="text-muted small">${k.items.length} indikator</span>
          </div>
          <div class="card-body p-0">
            ${k.items.map(it => `
              <div class="indikator-row">
                <div class="text-muted small" style="min-width: 1.8rem;">${it.indikator_no}.</div>
                <div class="flex-grow-1">${e(it.indikator)}</div>
                <div class="skor-pill" data-iid="${e(it.id)}">
                  ${Array.from({ length: maxScore + 1 }, (_, v) => `
                    <input type="radio" id="s_${e(it.id)}_${v}" name="skor_${e(it.id)}" value="${v}" ${skorMap[it.id] === v ? 'checked' : ''}>
                    <label for="s_${e(it.id)}_${v}" class="lbl-${v}">${v}</label>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}

      <div class="text-end">
        <a class="btn btn-light" href="#/guru/${g.id}">Kembali</a>
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
        refreshNilai();
        $('#save-status').textContent = 'Tersimpan';
        $('#save-status').className = 'save-status-saved';
      } catch (e) {
        $('#save-status').textContent = 'Gagal';
        $('#save-status').className = 'save-status-error';
      }
    });
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
function viewRekap(view) {
  const data = PKGDB.getRekap();
  view.innerHTML = `
  <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
    <h4 class="mb-0"><i class="bi bi-table"></i> Rekap PKG</h4>
    <button id="btn-csv" class="btn btn-sm btn-outline-success"><i class="bi bi-file-earmark-spreadsheet"></i> Export CSV</button>
  </div>
  <div class="card"><div class="table-responsive">
    <table class="table table-sm table-hover mb-0 align-middle">
      <thead class="table-light"><tr>
        <th>#</th><th>Nama / NIP</th><th>Madrasah</th><th>Mapel/Kelas</th><th>Peran</th><th>Jenis</th><th class="text-end">Nilai</th><th>Sebutan</th>
      </tr></thead>
      <tbody>
        ${data.length === 0 ? '<tr><td colspan="8" class="text-center text-muted py-4">Belum ada data</td></tr>' : ''}
        ${(() => {
          let i = 0;
          let rows = '';
          for (const g of data) {
            if (g.peran.length === 0) {
              i++;
              rows += `<tr>
                <td>${i}</td>
                <td><a href="#/guru/${g.id}">${e(g.nama)}</a><div class="small text-muted">${e(g.nip || '')}</div></td>
                <td>${e(g.nama_madrasah || '-')}</td>
                <td>${e(g.mapel_kelas || '-')}</td>
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
                  ` : ''}
                  <td>${e(p.role_label)}</td>
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

  $('#btn-csv').addEventListener('click', () => {
    const lines = ['No;Nama;NIP;Madrasah;Mapel/Kelas;Peran;Jenis;Nilai;Sebutan;Tanggal'];
    const esc = (v) => {
      if (v === null || v === undefined) return '';
      const s = String(v).replace(/"/g, '""');
      return /[;"\n\r]/.test(s) ? `"${s}"` : s;
    };
    let i = 0;
    for (const g of data) {
      if (g.peran.length === 0) {
        i++;
        lines.push([i, g.nama, g.nip, g.nama_madrasah, g.mapel_kelas, '', '', '', '', ''].map(esc).join(';'));
      } else {
        for (const p of g.peran) {
          i++;
          lines.push([i, g.nama, g.nip, g.nama_madrasah, g.mapel_kelas, p.role_label, p.jenis, p.nilai, p.sebutan, p.tanggal].map(esc).join(';'));
        }
      }
    }
    const blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `rekap-pkg-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('CSV diunduh');
  });
}

// === INSTRUMEN VIEWER ===================================================
function viewInstrumen(view) {
  const { query } = parseHash();
  const focusRole = query.role || null;
  view.innerHTML = `
  <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
    <h4 class="mb-0"><i class="bi bi-list-check"></i> Instrumen PKG</h4>
    <a href="#/" class="btn btn-sm btn-outline-secondary"><i class="bi bi-arrow-left"></i> Kembali ke Beranda</a>
  </div>
  <div class="alert alert-info small">Total ${window.INSTRUMEN.length} indikator dari ${PKGDB.ROLES.length} peran. Klik kepala kartu untuk lihat detail.</div>
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
          ${grouped.map(k => `
            <div class="border-bottom p-3">
              <div class="fw-semibold mb-2"><span class="badge bg-primary me-1">K${k.no}</span> ${e(k.nama)}</div>
              <ol class="mb-0 small">${k.items.map(it => `<li>${e(it.indikator)}</li>`).join('')}</ol>
            </div>
          `).join('')}
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
function viewBackup(view) {
  const stats = PKGDB.getStats();
  view.innerHTML = `
  <h4 class="mb-3"><i class="bi bi-shield-check"></i> Backup &amp; Restore</h4>
  <div class="alert alert-warning small">
    <i class="bi bi-exclamation-triangle"></i>
    <strong>Penting:</strong> Data tersimpan di browser ini saja. Kalau Bapak ganti device atau clear browser, data hilang. Backup berkala &amp; restore di device lain pakai fitur ini.
  </div>

  <div class="row g-3">
    <div class="col-md-6">
      <div class="card h-100">
        <div class="card-header"><i class="bi bi-download"></i> Export (Backup)</div>
        <div class="card-body">
          <p class="small text-muted">Download seluruh data PKG (${stats.guru} guru, ${stats.penilaian} penilaian) sebagai 1 file JSON. Simpan di Google Drive / WhatsApp / email untuk arsip.</p>
          <button id="btn-export" class="btn btn-primary"><i class="bi bi-download"></i> Download Backup</button>
        </div>
      </div>
    </div>
    <div class="col-md-6">
      <div class="card h-100">
        <div class="card-header"><i class="bi bi-upload"></i> Import (Restore)</div>
        <div class="card-body">
          <p class="small text-muted">Upload file backup JSON. Mode <strong>Replace</strong> = ganti seluruh data. Mode <strong>Merge</strong> = gabung dengan data sekarang (dedup by NIP).</p>
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
      <div class="card border-danger">
        <div class="card-header text-danger"><i class="bi bi-trash"></i> Hapus Semua Data</div>
        <div class="card-body">
          <p class="small text-muted">Hapus seluruh data PKG di browser ini. Pastikan sudah backup dulu!</p>
          <button id="btn-clear" class="btn btn-outline-danger"><i class="bi bi-trash"></i> Hapus Semua</button>
        </div>
      </div>
    </div>
  </div>`;

  $('#btn-export').addEventListener('click', () => {
    const data = PKGDB.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `pkg-backup-${new Date().toISOString().slice(0,10)}.json`;
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
window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', () => {
  renderShell();
  render();

  // Service worker (PWA)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});
