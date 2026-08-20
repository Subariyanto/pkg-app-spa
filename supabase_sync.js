// supabase_sync.js — Sistem Aktivasi via Supabase (simpel)
// V3 (2026-08-20): Fix header Authorization, error handling untuk non-JSON response.
// Project: pkg-pokjawas (veezuitkavznfipyyxln.supabase.co)

(function () {
  'use strict';

  var SUPABASE_URL = 'https://veezuitkavznfipyyxln.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_71VsVcheY13eLPXoUteZkg_hUtaJh8S';

  function hasConfig() {
    return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
  }

  function rpcUrl(fn) {
    return SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/rpc/' + fn;
  }

  function rpcHeaders() {
    return {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    };
  }

  async function callRpc(fn, params) {
    if (!hasConfig()) {
      return { ok: false, message: 'Supabase belum dikonfigurasi' };
    }
    try {
      var body = params ? JSON.stringify(params) : '{}';
      var r = await fetch(rpcUrl(fn), {
        method: 'POST',
        headers: rpcHeaders(),
        body: body
      });
      // Handle non-JSON responses (RPC returns text like 'ACTIVATED', 'REVOKED', etc.)
      var ct = r.headers.get('content-type') || '';
      if (ct.indexOf('application/json') >= 0) {
        var data = await r.json();
        return data;
      } else {
        // Text response — return as-is
        var text = await r.text();
        return text;
      }
    } catch (e) {
      console.error('SupabaseSync RPC error:', fn, e);
      return { ok: false, message: 'Gagal terhubung ke server. Periksa koneksi internet.' };
    }
  }

  // --- ADMIN LOGIN ---
  async function adminLogin(username, password) {
    return callRpc('admin_login', {
      p_username: username,
      p_password: password
    });
  }

  // --- ADMIN CREATE CODE ---
  async function adminCreateCode(nama, madrasah, kabupaten, role, catatan, adminUsername) {
    return callRpc('admin_create_activation_code', {
      p_nama: nama || null,
      p_madrasah: madrasah || null,
      p_kabupaten: kabupaten || null,
      p_role: role || null,
      p_catatan: catatan || null,
      p_admin_username: adminUsername || null
    });
  }

  // --- ADMIN LIST CODES ---
  async function adminListCodes(adminUsername) {
    var result = await callRpc('admin_list_activation_codes', {
      p_admin_username: adminUsername || null
    });
    if (Array.isArray(result)) return result;
    if (result && result.message) return [];
    if (!result) return [];
    return [];
  }

  // --- ADMIN REVOKE CODE ---
  async function adminRevokeCode(codeId, adminUsername) {
    return callRpc('admin_revoke_activation_code', {
      p_code_id: codeId,
      p_admin_username: adminUsername || null
    });
  }

  // --- ADMIN STATS ---
  async function adminStats(adminUsername) {
    return callRpc('admin_activation_stats', {
      p_admin_username: adminUsername || null
    });
  }

  // --- ACTIVATE CODE (user side) ---
  async function activateCode(code, deviceId, nama, username, madrasah, kabupaten, role, deviceInfo) {
    var result = await callRpc('activate_pkg_code', {
      p_code: code,
      p_device_id: deviceId,
      p_nama: nama || null,
      p_username: username || null,
      p_madrasah: madrasah || null,
      p_kabupaten: kabupaten || null,
      p_role: role || null,
      p_device_info: deviceInfo || null
    });
    // RPC returns text: 'ACTIVATED' | 'INVALID_CODE' | 'ALREADY_USED' | 'REVOKED'
    if (typeof result === 'string') return result;
    // If it's an object (error), extract message
    if (result && typeof result === 'object') {
      if (result.message) return result.message;
      if (Object.keys(result).length === 0) return 'UNKNOWN';
    }
    return result;
  }

  // --- CHECK CODE STATUS (without activating) ---
  async function checkCodeStatus(code) {
    var result = await callRpc('check_code_status', {
      p_code: code
    });
    if (typeof result === 'string') return result;
    return result;
  }

  // --- EXPORT: expose ---
  window.SupabaseSync = {
    hasConfig: hasConfig,
    adminLogin: adminLogin,
    adminCreateCode: adminCreateCode,
    adminListCodes: adminListCodes,
    adminRevokeCode: adminRevokeCode,
    adminStats: adminStats,
    activateCode: activateCode,
    checkCodeStatus: checkCodeStatus
  };
})();
