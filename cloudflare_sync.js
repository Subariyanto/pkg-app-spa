// cloudflare_sync.js — Sistem Aktivasi via Cloudflare Workers + D1
// Pengganti supabase_sync.js — API sama, backend beda
// V1 (2026-08-24): Migrasi dari Supabase ke Cloudflare Workers

(function () {
  'use strict';

  // Ganti URL ini setelah deploy Worker
  var WORKER_URL = 'https://pkg-backend.subariyantoss2.workers.dev';
  // Optional: admin token (set di Worker env ADMIN_TOKEN)
  var ADMIN_TOKEN = '';

  function hasConfig() {
    return !!WORKER_URL && WORKER_URL.indexOf('YOUR-SUBDOMAIN') === -1;
  }

  function headers() {
    var h = { 'Content-Type': 'application/json' };
    if (ADMIN_TOKEN) h['X-Admin-Token'] = ADMIN_TOKEN;
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
  async function adminLogin(username, password) {
    return postJson('admin-login', { username, password });
  }

  // --- ADMIN CREATE CODE ---
  async function adminCreateCode(nama, madrasah, kabupaten, role, catatan, adminUsername) {
    return postJson('admin/create-code', {
      nama: nama || null,
      madrasah: madrasah || null,
      kabupaten: kabupaten || null,
      role: role || null,
      catatan: catatan || null,
      admin_username: adminUsername || null
    });
  }

  // --- ADMIN LIST CODES ---
  async function adminListCodes(adminUsername) {
    var result = await getJson('admin/list-codes');
    if (result && result.ok && Array.isArray(result.data)) {
      // Map field names D1 → format yang diharapkan app.js
      return result.data.map(function (row) {
        var status = 'unused';
        if (row.revoked) status = 'revoked';
        else if (row.activated) status = 'activated';
        return {
          id: row.id,
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
    return postJson('admin/revoke-code', { id: codeId });
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
    return postJson('admin/delete-code', { id: codeId });
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
    // Return format sama dengan supabase_sync.js
    if (typeof result === 'string') return result;
    if (result && typeof result === 'object') {
      if (result.ok) return 'ACTIVATED';
      if (result.message) return result.message;
    }
    return 'UNKNOWN';
  }

  // --- CHECK CODE STATUS (without activating) ---
  async function checkCodeStatus(code) {
    return getJson('check-code?code=' + encodeURIComponent(code));
  }

  // --- EXPORT: expose (same API as SupabaseSync) ---
  window.SupabaseSync = {
    hasConfig: hasConfig,
    adminLogin: adminLogin,
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
