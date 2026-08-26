// cloudflare_sync.js — Sistem Aktivasi via Cloudflare Workers + D1 (SECURED)
// Pengganti supabase_sync.js — API sama, backend beda
// V2 (2026-08-26): Session token admin, bukan token statis.
//   - adminLogin() mengembalikan token sesi (dari Worker) dan menyimpannya.
//   - Semua panggilan /admin/* menyertakan token via header X-Admin-Token.
//   - Tanpa token, Worker menolak dengan 401. Hanya admin login yang bisa menerbitkan kode.

(function () {
  'use strict';

  // Ganti URL ini setelah deploy Worker
  var WORKER_URL = 'https://pkg-backend.subariyantoss2.workers.dev';

  var ADMIN_TOKEN_KEY = 'pkg_admin_token';

  function hasConfig() {
    return !!WORKER_URL && WORKER_URL.indexOf('YOUR-SUBDOMAIN') === -1;
  }

  function getToken() {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || '';
  }

  function headers() {
    var h = { 'Content-Type': 'application/json' };
    var t = getToken();
    if (t) h['X-Admin-Token'] = t;
    return h;
  }

  async function postJson(path, params) {
    if (!hasConfig()) {
      return { ok: false, message: 'Cloudflare Worker belum dikonfigurasi' };
    }
    try {
      var r = await fetch(WORKER_URL + '/' + path, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(params || {})
      });
      var ct = r.headers.get('content-type') || '';
      if (ct.indexOf('application/json') >= 0) {
        return await r.json();
      }
      var text = await r.text();
      return text;
    } catch (e) {
      console.error('CloudflareSync error:', path, e);
      return { ok: false, message: 'Gagal terhubung ke server. Periksa koneksi internet.' };
    }
  }

  async function getJson(path) {
    if (!hasConfig()) {
      return { ok: false, message: 'Cloudflare Worker belum dikonfigurasi' };
    }
    try {
      var r = await fetch(WORKER_URL + '/' + path, {
        method: 'GET',
        headers: headers()
      });
      var ct = r.headers.get('content-type') || '';
      if (ct.indexOf('application/json') >= 0) {
        return await r.json();
      }
      var text = await r.text();
      return text;
    } catch (e) {
      console.error('CloudflareSync error:', path, e);
      return { ok: false, message: 'Gagal terhubung ke server. Periksa koneksi internet.' };
    }
  }

  // --- ADMIN LOGIN ---
  // Mengembalikan { ok, username, nama, role, token }. Simpan token untuk panggilan berikutnya.
  async function adminLogin(username, password) {
    var result = await postJson('admin-login', { username: username, password: password });
    if (result && result.ok && result.token) {
      localStorage.setItem(ADMIN_TOKEN_KEY, result.token);
    }
    return result;
  }

  // --- ADMIN LOGOUT ---
  function adminLogout() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  }

  // --- ADMIN CREATE CODE ---
  async function adminCreateCode(nama, madrasah, kabupaten, role, catatan, adminUsername) {
    return postJson('admin/create-code', {
      nama: nama || null,
      madrasah: madrasah || null,
      kabupaten: kabupaten || null,
      role: role || null,
      catatan: catatan || null
    });
  }

  // --- ADMIN LIST CODES ---
  async function adminListCodes(adminUsername) {
    var result = await getJson('admin/list-codes');
    if (result && result.ok && Array.isArray(result.data)) {
      return result.data.map(function (row) {
        var status = 'unused';
        if (row.revoked) status = 'revoked';
        else if (row.activated) status = 'activated';
        return {
          id: String(row.id),
          code: row.code,
          code_full: row.code,
          code_hint: row.code,
          nama_pengguna: row.nama || '',
          nama: row.nama || '',
          madrasah: row.madrasah || '',
          kabupaten: row.kabupaten || '',
          role: row.role || '',
          catatan: row.catatan || '',
          status: status,
          device_id: row.device_id || '',
          created_at: row.created_at || '',
          created_by: row.created_by || ''
        };
      });
    }
    if (Array.isArray(result)) return result;
    return [];
  }

  // --- ADMIN REVOKE CODE ---
  async function adminRevokeCode(codeId, adminUsername) {
    var result = await postJson('admin/revoke-code', { id: codeId });
    if (result && result.ok) return 'REVOKED';
    if (result && result.message) return result.message;
    return 'FAILED';
  }

  // --- ADMIN EDIT CODE ---
  async function adminEditCode(codeId, adminUsername, nama, madrasah, kabupaten, role, catatan) {
    return postJson('admin/edit-code', {
      id: codeId,
      nama: nama || null,
      madrasah: madrasah || null,
      kabupaten: kabupaten || null,
      role: role || null,
      catatan: catatan || null
    });
  }

  // --- ADMIN DELETE CODE ---
  async function adminDeleteCode(codeId, adminUsername) {
    var result = await postJson('admin/delete-code', { id: codeId });
    if (result && result.ok) return 'DELETED';
    if (result && result.message) return result.message;
    return 'FAILED';
  }

  // --- ADMIN DELETE ALL CODES ---
  async function adminDeleteAllCodes(adminUsername) {
    return postJson('admin/delete-all-codes', {});
  }

  // --- ADMIN STATS ---
  async function adminStats(adminUsername) {
    return getJson('admin/stats');
  }

  // --- ACTIVATE CODE (user side) ---
  async function activateCode(code, deviceId, nama, username, madrasah, kabupaten, role, deviceInfo) {
    var result = await postJson('activate-code', {
      code: code,
      device_id: deviceId
    });
    if (typeof result === 'string') return result;
    if (result && typeof result === 'object') {
      if (result.ok) return 'ACTIVATED';
      if (result.message) return result.message;
    }
    return 'UNKNOWN';
  }

  // --- CHECK CODE STATUS (without activating) ---
  async function checkCodeStatus(code) {
    var result = await getJson('check-code?code=' + encodeURIComponent(code));
    if (result && result.ok) return result.status;
    if (typeof result === 'string') return result;
    if (result && result.message) return result.message;
    return 'INVALID_CODE';
  }

  // --- EXPORT: expose (same API as SupabaseSync) ---
  window.SupabaseSync = {
    hasConfig: hasConfig,
    adminLogin: adminLogin,
    adminLogout: adminLogout,
    adminCreateCode: adminCreateCode,
    adminListCodes: adminListCodes,
    adminRevokeCode: adminRevokeCode,
    adminEditCode: adminEditCode,
    adminDeleteCode: adminDeleteCode,
    adminDeleteAllCodes: adminDeleteAllCodes,
    adminStats: adminStats,
    activateCode: activateCode,
    checkCodeStatus: checkCodeStatus
  };
})();
