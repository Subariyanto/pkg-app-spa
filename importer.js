// importer.js - parse Master PKG xlsm in browser via ExcelJS

function txt(v) {
  if (v == null) return '';
  if (typeof v === 'object') {
    if (v.richText) return v.richText.map(t => t.text).join('');
    if (v.result !== undefined) return String(v.result);
    if (v.text) return v.text;
    return '';
  }
  return String(v);
}
function trim(s) { return (s || '').toString().trim(); }

const FIELD_MAP = {
  3:  ['nama', 'nrg'],
  4:  ['nip', 'nuptk'],
  5:  ['no_karpeg', 'mapel_kelas'],
  6:  ['jenis_kelamin', 'jjm'],
  7:  ['tempat_lahir', 'tugas_tambahan_1'],
  8:  ['tanggal_lahir', 'tugas_tambahan_2'],
  9:  ['pendidikan', 'tugas_tambahan_3'],
  10: ['pangkat_gol', 'tugas_lembaga_lain'],
  11: ['tmt_gol_split', 'jjm_lembaga_lain'],
  12: ['tmt_guru', 'nama_penilai'],
  13: ['tgl_penilaian', 'nip_penilai'],
  17: ['nama_madrasah', 'alamat_madrasah'],
  19: ['nama_kamad', 'kecamatan'],
  20: ['nip_kamad', 'kabupaten'],
  22: ['nama_pengawas', 'tahun_pelajaran'],
};

const PERAN_SHEETS = [
  { code: 'GMP', sheet: 'PKKM_GMP', maxScore: 2 },
  { code: 'BK', sheet: 'PKKM_BK', maxScore: 2 },
  { code: 'TIK', sheet: 'PKKM-GTIK', maxScore: 2 },
  { code: 'WKKUR', sheet: 'PKKM-WKKur', maxScore: 4 },
  { code: 'WKSIS', sheet: 'PKKM-WKSis', maxScore: 4 },
  { code: 'WKSAR', sheet: 'PKKM-WKSarpras', maxScore: 4 },
  { code: 'WKHUM', sheet: 'PKKM-WKHumas', maxScore: 4 },
  { code: 'LAB', sheet: 'PKKM-LAB', maxScore: 2 },
  { code: 'PUS', sheet: 'PKKM-PUS', maxScore: 2 },
];

async function parseMaster(arrayBuffer) {
  if (typeof ExcelJS === 'undefined') {
    throw new Error('ExcelJS belum termuat. Pastikan online untuk load CDN.');
  }
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(arrayBuffer);
  const dataSheet = wb.getWorksheet('DATA');
  if (!dataSheet) throw new Error("Sheet 'DATA' tidak ditemukan");

  const guru = {};
  for (const [rowStr, [leftField, rightField]] of Object.entries(FIELD_MAP)) {
    const row = dataSheet.getRow(parseInt(rowStr));
    const leftVal = trim(txt(row.getCell(3).value));
    const rightVal = trim(txt(row.getCell(8).value));
    if (leftField === 'tmt_gol_split') {
      const d = trim(txt(row.getCell(3).value));
      const m = trim(txt(row.getCell(4).value));
      const y = trim(txt(row.getCell(5).value));
      if (d || m || y) guru.tmt_gol = `${d} ${m} ${y}`.trim();
    } else if (leftField && leftVal) {
      guru[leftField] = leftVal;
    }
    if (rightField && rightVal) {
      guru[rightField] = rightVal;
    }
  }

  const r1 = dataSheet.getRow(1);
  let jenis = 'sumatif';
  if (trim(txt(r1.getCell(2).value)).match(/V/i)) jenis = 'formatif';

  const penilaian = [];

  for (const def of PERAN_SHEETS) {
    const ws = wb.getWorksheet(def.sheet);
    if (!ws) continue;

    let currentKomp = null;
    let kompCounter = 0;
    const items = [];
    const counter = new Map();

    for (let r = 1; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const colB = trim(txt(row.getCell(2).value));
      const colC = trim(txt(row.getCell(3).value));
      const colD = trim(txt(row.getCell(4).value));

      const fullText = (colB + ' ' + colC + ' ' + colD).trim();
      const isPureSmallInt = (s) => /^\s*\d{1,2}\s*$/.test(s);
      const idxFromB = isPureSmallInt(colB) ? parseInt(colB) : null;
      const idxFromC = isPureSmallInt(colC) ? parseInt(colC) : null;
      const idxNum = idxFromB || idxFromC;
      const isKompHeader = /Kompetensi/i.test(fullText) && !isPureSmallInt(colB) && !isPureSmallInt(colC);

      if (isKompHeader) {
        kompCounter++;
        const candidate = [colB, colC, colD].find(t => /Kompetensi/i.test(t)) || fullText;
        const nama = candidate.replace(/Kompetensi\s*\d*\s*[:.]?\s*/i, '').replace(/\s+/g, ' ').trim().slice(0, 250);
        const lower = nama.toLowerCase();
        const seenNames = new Map();
        for (const it of items) seenNames.set(it._kompName, it.kompetensi_no);
        let foundNo = seenNames.has(lower) ? seenNames.get(lower) : (Math.max(0, ...items.map(i => i.kompetensi_no)) + 1) || 1;
        currentKomp = { no: foundNo, name: lower };
      } else if (idxNum && idxNum >= 1 && idxNum <= 99 && currentKomp) {
        const baseCol = 5;
        let skor = null;
        for (let s = 0; s <= def.maxScore; s++) {
          const v = trim(txt(row.getCell(baseCol + s).value));
          if (/x/i.test(v)) { skor = s; break; }
        }
        if (skor !== null) {
          const c = (counter.get(currentKomp.no) || 0) + 1;
          counter.set(currentKomp.no, c);
          items.push({
            _kompName: currentKomp.name,
            kompetensi_no: currentKomp.no,
            indikator_no: c,
            skor,
          });
        } else {
          const c = (counter.get(currentKomp.no) || 0) + 1;
          counter.set(currentKomp.no, c);
        }
      }
    }

    if (items.length > 0) {
      penilaian.push({
        role_code: def.code,
        jenis,
        tanggal: guru.tgl_penilaian || null,
        items: items.map(({ _kompName, ...rest }) => rest),
      });
    }
  }

  return { guru, penilaian };
}

// Apply parsed result into PKGDB (upsert by NIP)
async function importOne(arrayBuffer) {
  const { guru, penilaian } = await parseMaster(arrayBuffer);
  if (!guru.nama) throw new Error('Nama guru kosong di sheet DATA');

  const cleanGuru = {};
  const allowed = ['nama','nip','nuptk','nrg','no_karpeg','jenis_kelamin','tempat_lahir','tanggal_lahir','pendidikan','pangkat_gol','tmt_gol','tmt_guru','mapel_kelas','jjm','tugas_tambahan_1','tugas_tambahan_2','tugas_tambahan_3','tugas_lembaga_lain','jjm_lembaga_lain','nama_penilai','nip_penilai','jabatan_penilai','nama_kamad','nip_kamad','nama_madrasah','alamat_madrasah','tahun_pelajaran','semester'];
  for (const k of allowed) if (guru[k] !== undefined) cleanGuru[k] = guru[k];

  let existing = guru.nip ? PKGDB.findGuruByNIP(guru.nip) : null;
  let row;
  if (existing) {
    // Merge: keep old where new is empty
    const merged = { ...existing };
    for (const k of Object.keys(cleanGuru)) {
      if (cleanGuru[k] != null && cleanGuru[k] !== '') merged[k] = cleanGuru[k];
    }
    row = PKGDB.saveGuru(merged, existing.id);
  } else {
    row = PKGDB.saveGuru(cleanGuru);
  }

  const summary = [];
  for (const p of penilaian) {
    const pen = PKGDB.getOrCreatePenilaian(row.id, p.role_code, p.jenis);
    if (p.tanggal && /\d{4}-\d{2}-\d{2}/.test(p.tanggal)) {
      PKGDB.updatePenilaianMeta(pen.id, { tanggal: p.tanggal });
    }
    const inst = PKGDB.getInstrumen(p.role_code);
    const idMap = new Map();
    for (const ir of inst) idMap.set(`${ir.kompetensi_no}-${ir.indikator_no}`, ir.id);

    let saved = 0, skipped = 0;
    for (const it of p.items) {
      const iid = idMap.get(`${it.kompetensi_no}-${it.indikator_no}`);
      if (iid) { PKGDB.setSkor(pen.id, iid, it.skor); saved++; }
      else skipped++;
    }
    summary.push({ role: p.role_code, jenis: p.jenis, saved, skipped, total: p.items.length });
  }

  return { guruId: row.id, guruNama: row.nama, identitas: row, summary };
}

window.PKGImport = { parseMaster, importOne };
