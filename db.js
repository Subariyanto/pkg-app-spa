// db.js - localStorage data layer for PKG SPA
// Schema mirrors the Express+SQLite version, but using arrays in localStorage.

const KEYS = {
  guru: 'pkg_v1_guru',
  kamad: 'pkg_v1_kamad',
  penilaian: 'pkg_v1_penilaian',
  skor: 'pkg_v1_skor',
  kehadiran: 'pkg_v1_kehadiran',
  pkb: 'pkg_v1_pkb',
  meta: 'pkg_v1_meta',
  instrumen_overrides: 'pkg_v1_instrumen_overrides',
  kompetensi_overrides: 'pkg_v1_kompetensi_overrides',
  penggalian: 'pkg_v1_penggalian_data',
};

function load(key, def) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : def;
  } catch (e) {
    console.error('localStorage load error:', key, e);
    return def;
  }
}

function save(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
    return true;
  } catch (e) {
    console.error('localStorage save error:', key, e);
    if (e.name === 'QuotaExceededError') {
      alert('Storage browser penuh. Lakukan Backup → Export, lalu hapus data lama.');
    }
    return false;
  }
}

function nextId(table) {
  const meta = load(KEYS.meta, {});
  const cur = meta[`next_${table}`] || 1;
  meta[`next_${table}`] = cur + 1;
  save(KEYS.meta, meta);
  return cur;
}

function nowLocal() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// === ROLES (derived from INSTRUMEN) =====================================
const ROLES = (() => {
  const seen = new Map();
  for (const it of window.INSTRUMEN) {
    if (!seen.has(it.role_code)) {
      seen.set(it.role_code, {
        role_code: it.role_code,
        role_label: it.role_label,
        max_score: it.max_score,
      });
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.role_code.localeCompare(b.role_code));
})();

function getRoleMeta(code) {
  return ROLES.find(r => r.role_code === code);
}

function getInstrumen(role) {
  const overInd = load(KEYS.instrumen_overrides, {});
  const overKomp = load(KEYS.kompetensi_overrides, {});
  return window.INSTRUMEN
    .filter(i => i.role_code === role)
    .map((it) => {
      const id = `${it.role_code}_${it.kompetensi_no}_${it.indikator_no}`;
      const kompKey = `${it.role_code}_${it.kompetensi_no}`;
      return {
        ...it,
        id,
        indikator: overInd[id] != null ? overInd[id] : it.indikator,
        kompetensi_nama: overKomp[kompKey] != null ? overKomp[kompKey] : it.kompetensi_nama,
        _isOverridden: !!(overInd[id] || overKomp[kompKey]),
        _origIndikator: it.indikator,
        _origKompetensi: it.kompetensi_nama,
      };
    })
    .sort((a, b) => a.kompetensi_no - b.kompetensi_no || a.indikator_no - b.indikator_no);
}

function setIndikatorOverride(id, newText) {
  const all = load(KEYS.instrumen_overrides, {});
  if (newText == null || newText === '') delete all[id];
  else all[id] = newText;
  save(KEYS.instrumen_overrides, all);
}

function setKompetensiOverride(roleCode, kompNo, newText) {
  const all = load(KEYS.kompetensi_overrides, {});
  const key = `${roleCode}_${kompNo}`;
  if (newText == null || newText === '') delete all[key];
  else all[key] = newText;
  save(KEYS.kompetensi_overrides, all);
}

function resetAllOverrides() {
  save(KEYS.instrumen_overrides, {});
  save(KEYS.kompetensi_overrides, {});
}

function countOverrides() {
  const a = Object.keys(load(KEYS.instrumen_overrides, {})).length;
  const b = Object.keys(load(KEYS.kompetensi_overrides, {})).length;
  return { indikator: a, kompetensi: b, total: a + b };
}

// Catatan Penggalian Data per indikator
// Stored as { [indikator_id]: { metode: ['observasi','dokumen','wawancara'], sumber: string, catatan: string, updated_at: ISO } }
function getPenggalian(id) {
  const all = load(KEYS.penggalian, {});
  return all[id] || null;
}
function setPenggalian(id, data) {
  const all = load(KEYS.penggalian, {});
  if (!data || (!data.catatan && !data.sumber && (!data.metode || data.metode.length === 0))) {
    delete all[id];
  } else {
    all[id] = { ...data, updated_at: new Date().toISOString() };
  }
  save(KEYS.penggalian, all);
}
function listPenggalian() {
  return load(KEYS.penggalian, {});
}
function countPenggalian() {
  return Object.keys(load(KEYS.penggalian, {})).length;
}

// === GURU ===============================================================
function listGuru(query) {
  const all = load(KEYS.guru, []);
  if (!query) return all.sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));
  const q = query.toLowerCase();
  return all
    .filter(g =>
      (g.nama || '').toLowerCase().includes(q) ||
      (g.nip || '').toLowerCase().includes(q) ||
      (g.nama_madrasah || '').toLowerCase().includes(q)
    )
    .sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));
}

function getGuru(id) {
  const all = load(KEYS.guru, []);
  return all.find(g => g.id === Number(id));
}

function findGuruByNIP(nip) {
  if (!nip) return null;
  const all = load(KEYS.guru, []);
  return all.find(g => (g.nip || '').trim() === nip.trim()) || null;
}

function saveGuru(data, existingId) {
  const all = load(KEYS.guru, []);
  if (existingId) {
    const idx = all.findIndex(g => g.id === Number(existingId));
    if (idx === -1) throw new Error('Guru not found');
    all[idx] = { ...all[idx], ...data, updated_at: nowLocal() };
    save(KEYS.guru, all);
    return all[idx];
  }
  const id = nextId('guru');
  const row = {
    id,
    ...data,
    created_at: nowLocal(),
    updated_at: nowLocal(),
  };
  all.push(row);
  save(KEYS.guru, all);
  return row;
}

function deleteGuru(id) {
  id = Number(id);
  save(KEYS.guru, load(KEYS.guru, []).filter(g => g.id !== id));
  // Cascade
  const pen = load(KEYS.penilaian, []).filter(p => p.guru_id !== id);
  save(KEYS.penilaian, pen);
  const allPenIds = new Set(pen.map(p => p.id));
  save(KEYS.skor, load(KEYS.skor, []).filter(s => allPenIds.has(s.penilaian_id)));
  save(KEYS.kehadiran, load(KEYS.kehadiran, []).filter(k => k.guru_id !== id));
  save(KEYS.pkb, load(KEYS.pkb, []).filter(p => p.guru_id !== id));
}

function deleteAllGuru() {
  // Hapus semua guru + semua data turunannya (penilaian, skor, kehadiran, pkb).
  // Data kamad TIDAK ikut terhapus.
  save(KEYS.guru, []);
  save(KEYS.penilaian, []);
  save(KEYS.skor, []);
  save(KEYS.kehadiran, []);
  save(KEYS.pkb, []);
}

// === KAMAD (Kepala Madrasah) ===========================================
function listKamad(query) {
  const all = load(KEYS.kamad, []);
  if (!query) return all.sort((a, b) => (a.nama_madrasah || '').localeCompare(b.nama_madrasah || ''));
  const q = query.toLowerCase();
  return all
    .filter(k =>
      (k.nama || '').toLowerCase().includes(q) ||
      (k.nip || '').toLowerCase().includes(q) ||
      (k.nama_madrasah || '').toLowerCase().includes(q)
    )
    .sort((a, b) => (a.nama_madrasah || '').localeCompare(b.nama_madrasah || ''));
}

function getKamad(id) {
  return load(KEYS.kamad, []).find(k => k.id === Number(id));
}

function saveKamad(data, existingId) {
  const all = load(KEYS.kamad, []);
  if (existingId) {
    const idx = all.findIndex(k => k.id === Number(existingId));
    if (idx === -1) throw new Error('Kamad not found');
    all[idx] = { ...all[idx], ...data, updated_at: nowLocal() };
    save(KEYS.kamad, all);
    return all[idx];
  }
  const id = nextId('kamad');
  const row = { id, ...data, created_at: nowLocal(), updated_at: nowLocal() };
  all.push(row);
  save(KEYS.kamad, all);
  return row;
}

function deleteKamad(id) {
  id = Number(id);
  save(KEYS.kamad, load(KEYS.kamad, []).filter(k => k.id !== id));
}

// Auto-import kamad dari data guru (kalau ada nama_kamad/nip_kamad/nama_madrasah)
function syncKamadFromGuru() {
  const gurus = load(KEYS.guru, []);
  const existing = load(KEYS.kamad, []);
  const seenByMadrasah = new Map(existing.map(k => [(k.nama_madrasah || '').toLowerCase(), k]));
  let added = 0;
  for (const g of gurus) {
    const mad = (g.nama_madrasah || '').trim();
    if (!mad || !g.nama_kamad) continue;
    const key = mad.toLowerCase();
    if (seenByMadrasah.has(key)) continue;
    const row = {
      id: nextId('kamad'),
      nama: g.nama_kamad,
      nip: g.nip_kamad || '',
      nama_madrasah: mad,
      alamat_madrasah: g.alamat_madrasah || '',
      jenjang: '',
      no_hp: '',
      email: '',
      catatan: '',
      created_at: nowLocal(),
      updated_at: nowLocal(),
    };
    existing.push(row);
    seenByMadrasah.set(key, row);
    added++;
  }
  save(KEYS.kamad, existing);
  return added;
}

// === PENILAIAN ==========================================================
function listPenilaianByGuru(guruId) {
  guruId = Number(guruId);
  return load(KEYS.penilaian, []).filter(p => p.guru_id === guruId);
}

function getOrCreatePenilaian(guruId, role, jenis) {
  guruId = Number(guruId);
  const all = load(KEYS.penilaian, []);
  let p = all.find(x => x.guru_id === guruId && x.role_code === role && x.jenis === jenis);
  if (p) return p;
  p = {
    id: nextId('penilaian'),
    guru_id: guruId,
    role_code: role,
    jenis,
    tanggal: null,
    catatan: null,
    created_at: nowLocal(),
    updated_at: nowLocal(),
  };
  all.push(p);
  save(KEYS.penilaian, all);
  return p;
}

function updatePenilaianMeta(penId, fields) {
  const all = load(KEYS.penilaian, []);
  const idx = all.findIndex(p => p.id === penId);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...fields, updated_at: nowLocal() };
    save(KEYS.penilaian, all);
  }
}

// === SKOR ===============================================================
function getSkorMap(penId) {
  const rows = load(KEYS.skor, []).filter(s => s.penilaian_id === penId);
  const m = {};
  for (const r of rows) m[r.instrumen_id] = r.skor;
  return m;
}

function setSkor(penId, instrumenId, skor) {
  const all = load(KEYS.skor, []);
  const idx = all.findIndex(s => s.penilaian_id === penId && s.instrumen_id === instrumenId);
  if (skor === null || skor === undefined || skor === '') {
    if (idx >= 0) {
      all.splice(idx, 1);
      save(KEYS.skor, all);
    }
    return;
  }
  if (idx >= 0) all[idx].skor = Number(skor);
  else all.push({ penilaian_id: penId, instrumen_id: instrumenId, skor: Number(skor) });
  save(KEYS.skor, all);
}

function countSkor(penId) {
  return load(KEYS.skor, []).filter(s => s.penilaian_id === penId).length;
}

// === HITUNG NILAI =======================================================
function hitungNilai(penId, role) {
  const meta = getRoleMeta(role);
  if (!meta) return { nilaiAkhir: 0, sebutan: '-', kompPct: [] };
  const max = meta.max_score;
  const instrumen = getInstrumen(role);
  const skorMap = getSkorMap(penId);
  const byKomp = new Map();
  for (const it of instrumen) {
    if (!byKomp.has(it.kompetensi_no)) byKomp.set(it.kompetensi_no, { sum: 0, count: 0, nama: it.kompetensi_nama });
    const o = byKomp.get(it.kompetensi_no);
    o.sum += Number(skorMap[it.id]) || 0;
    o.count += 1;
  }
  const kompPct = [];
  for (const [no, o] of byKomp) {
    const maks = o.count * max;
    const pct = maks ? (o.sum / maks) * 100 : 0;
    kompPct.push({ no, nama: o.nama, pct, sum: o.sum, maks });
  }
  kompPct.sort((a, b) => a.no - b.no);
  const nilaiAkhir = kompPct.length ? kompPct.reduce((a, b) => a + b.pct, 0) / kompPct.length : 0;
  let sebutan = 'Kurang';
  if (nilaiAkhir > 90) sebutan = 'Amat Baik';
  else if (nilaiAkhir > 75) sebutan = 'Baik';
  else if (nilaiAkhir > 60) sebutan = 'Cukup';
  else if (nilaiAkhir > 50) sebutan = 'Sedang';
  return { nilaiAkhir: Math.round(nilaiAkhir * 100) / 100, sebutan, kompPct };
}

// === KEHADIRAN ==========================================================
function listKehadiran(guruId) {
  guruId = Number(guruId);
  return load(KEYS.kehadiran, [])
    .filter(k => k.guru_id === guruId)
    .sort((a, b) => a.tahun - b.tahun || a.bulan - b.bulan);
}

function upsertKehadiran(guruId, data) {
  guruId = Number(guruId);
  const all = load(KEYS.kehadiran, []);
  const idx = all.findIndex(k => k.guru_id === guruId && k.bulan === Number(data.bulan) && k.tahun === Number(data.tahun));
  const row = {
    id: idx >= 0 ? all[idx].id : nextId('kehadiran'),
    guru_id: guruId,
    bulan: Number(data.bulan),
    tahun: Number(data.tahun),
    hadir: Number(data.hadir) || 0,
    sakit: Number(data.sakit) || 0,
    izin: Number(data.izin) || 0,
    alpa: Number(data.alpa) || 0,
    cuti: Number(data.cuti) || 0,
    dinas: Number(data.dinas) || 0,
    hari_efektif: Number(data.hari_efektif) || 0,
  };
  if (idx >= 0) all[idx] = row;
  else all.push(row);
  save(KEYS.kehadiran, all);
}

function deleteKehadiran(id) {
  save(KEYS.kehadiran, load(KEYS.kehadiran, []).filter(k => k.id !== Number(id)));
}

// === PKB ================================================================
function listPKB(guruId) {
  guruId = Number(guruId);
  return load(KEYS.pkb, []).filter(p => p.guru_id === guruId).sort((a, b) => a.prioritas - b.prioritas);
}

function replacePKB(guruId, items) {
  guruId = Number(guruId);
  const all = load(KEYS.pkb, []).filter(p => p.guru_id !== guruId);
  for (const it of items) {
    if (it.kompetensi || it.rencana || it.target) {
      all.push({
        id: nextId('pkb'),
        guru_id: guruId,
        prioritas: Number(it.prioritas),
        kompetensi: it.kompetensi || null,
        rencana: it.rencana || null,
        target: it.target || null,
      });
    }
  }
  save(KEYS.pkb, all);
}

// === STATS ==============================================================
function getStats() {
  const guru = load(KEYS.guru, []).length;
  const kamad = load(KEYS.kamad, []).length;
  const penilaian = load(KEYS.penilaian, []).length;
  const skor = load(KEYS.skor, []);
  const penIds = new Set(skor.map(s => s.penilaian_id));
  return {
    guru,
    kamad,
    penilaian,
    selesai: penIds.size,
    indikator: window.INSTRUMEN.length,
  };
}

function getRecentGuru(limit) {
  return load(KEYS.guru, [])
    .sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''))
    .slice(0, limit || 8);
}

// === BACKUP / RESTORE ===================================================
function exportAll() {
  return {
    schema: 'pkg_v1',
    exported_at: new Date().toISOString(),
    data: {
      guru: load(KEYS.guru, []),
      kamad: load(KEYS.kamad, []),
      penilaian: load(KEYS.penilaian, []),
      skor: load(KEYS.skor, []),
      kehadiran: load(KEYS.kehadiran, []),
      pkb: load(KEYS.pkb, []),
      meta: load(KEYS.meta, {}),
      instrumen_overrides: load(KEYS.instrumen_overrides, {}),
      kompetensi_overrides: load(KEYS.kompetensi_overrides, {}),
      penggalian: load(KEYS.penggalian, {}),
    },
  };
}

function importAll(json, mode) {
  // mode: 'replace' | 'merge'
  if (!json || json.schema !== 'pkg_v1' || !json.data) {
    throw new Error('Format backup tidak valid (schema bukan pkg_v1)');
  }
  const d = json.data;
  if (mode === 'merge') {
    // Merge: append, dedup by NIP for guru
    const existGuru = load(KEYS.guru, []);
    const byNip = new Map(existGuru.filter(g => g.nip).map(g => [g.nip, g]));
    const idMap = new Map(); // old id -> new id
    for (const g of (d.guru || [])) {
      if (g.nip && byNip.has(g.nip)) {
        idMap.set(g.id, byNip.get(g.nip).id);
        // keep existing, skip
      } else {
        const newId = nextId('guru');
        idMap.set(g.id, newId);
        existGuru.push({ ...g, id: newId });
      }
    }
    save(KEYS.guru, existGuru);
    // Re-map penilaian
    const penAll = load(KEYS.penilaian, []);
    for (const p of (d.penilaian || [])) {
      const newGuruId = idMap.get(p.guru_id);
      if (!newGuruId) continue;
      const exists = penAll.find(x => x.guru_id === newGuruId && x.role_code === p.role_code && x.jenis === p.jenis);
      if (exists) {
        // overwrite
        exists.tanggal = p.tanggal;
        exists.catatan = p.catatan;
      } else {
        penAll.push({ ...p, guru_id: newGuruId, id: nextId('penilaian') });
      }
    }
    save(KEYS.penilaian, penAll);
    // Skor: skip merge mode (complex re-map). Simpler: replace mode recommended.
    return { mode: 'merge', merged: d.guru?.length || 0 };
  }
  // Replace
  save(KEYS.guru, d.guru || []);
  save(KEYS.kamad, d.kamad || []);
  save(KEYS.penilaian, d.penilaian || []);
  save(KEYS.skor, d.skor || []);
  save(KEYS.kehadiran, d.kehadiran || []);
  save(KEYS.pkb, d.pkb || []);
  save(KEYS.meta, d.meta || {});
  save(KEYS.instrumen_overrides, d.instrumen_overrides || {});
  save(KEYS.kompetensi_overrides, d.kompetensi_overrides || {});
  save(KEYS.penggalian, d.penggalian || {});
  return { mode: 'replace', count: (d.guru || []).length };
}

function clearAll() {
  for (const k of Object.values(KEYS)) localStorage.removeItem(k);
}

// === REKAP ==============================================================
function getRekap() {
  const gurus = load(KEYS.guru, []).sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));
  const allPen = load(KEYS.penilaian, []);
  return gurus.map(g => {
    const pen = allPen.filter(p => p.guru_id === g.id);
    const peran = pen.map(p => {
      const n = hitungNilai(p.id, p.role_code);
      const meta = getRoleMeta(p.role_code) || {};
      return {
        ...p,
        role_label: meta.role_label,
        nilai: n.nilaiAkhir,
        sebutan: n.sebutan,
      };
    });
    return { ...g, peran };
  });
}

// Expose
window.PKGDB = {
  KEYS, ROLES,
  getRoleMeta, getInstrumen,
  setIndikatorOverride, setKompetensiOverride, resetAllOverrides, countOverrides,
  getPenggalian, setPenggalian, listPenggalian, countPenggalian,
  listGuru, getGuru, findGuruByNIP, saveGuru, deleteGuru, deleteAllGuru,
  listKamad, getKamad, saveKamad, deleteKamad, syncKamadFromGuru,
  listPenilaianByGuru, getOrCreatePenilaian, updatePenilaianMeta,
  getSkorMap, setSkor, countSkor,
  hitungNilai,
  listKehadiran, upsertKehadiran, deleteKehadiran,
  listPKB, replacePKB,
  getStats, getRecentGuru,
  exportAll, importAll, clearAll,
  getRekap,
};
