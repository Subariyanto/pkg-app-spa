// supabase_sync.js — V2 Activation Security (RPC-based) — TAHAP 4: Monitoring & Audit
//
// PRINSIP: 1 kode = 1 aktivasi = 1 perangkat = 1 device key. Server is source of truth.
// Fail closed: kalau network error / Supabase tidak bisa dihubungi, aktivasi DITOLAK.
//
// TAHAP 4: +adminListAuditLogs, +adminStatsV2, +adminGetSuspiciousActivity,
//           +adminExportData, +adminExportAuditLog, +RATE_LIMITED handling.

(function () {
  'use strict';

  // === KONFIGURASI ===
  var SUPABASE_URL = 'https://veezuitkavznfipyyxln.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_pub_71VsVcheY13eLPXoUteZkg_hUtaJh8S';

  function isConfigured() {
    return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
  }

  function endpoint(path) {
    return SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/' + path;
  }

  function rpcHeaders() {
    return {
      apikey: SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    };
  }

  function authHeaders(accessToken) {
    return {
      apikey: SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + accessToken,
      'Content-Type': 'application/json',
    };
  }

  var MSG = {
    NETWORK: 'Aktivasi memerlukan koneksi internet. Server aktivasi tidak dapat dihubungi. Periksa koneksi internet lalu coba kembali.',
    INVALID: 'Kode aktivasi tidak valid. Silakan hubungi Admin.',
    ALREADY_USED: 'Kode aktivasi ini sudah digunakan dan terikat pada perangkat lain. Silakan hubungi Admin untuk mendapatkan kode aktivasi baru.',
    REVOKED: 'Kode aktivasi telah dinonaktifkan oleh Admin.',
    SERVER_ERROR: 'Server aktivasi mengalami gangguan. Coba kembali beberapa saat lagi.',
    SESSION_EXPIRED: 'Sesi Admin telah berakhir. Silakan login kembali.',
    RATE_LIMITED: 'Terlalu banyak percobaan aktivasi gagal. Tunggu 10 menit lalu coba kembali. Jika masalah berlanjut, hubungi Admin.',
    DEVICE_KEY_MISSING: 'Data keamanan aktivasi pada perangkat ini tidak lengkap. Silakan hubungi Admin untuk melakukan pemulihan aktivasi.',
    DEVICE_MISMATCH: 'Perangkat ini tidak sesuai dengan aktivasi yang terdaftar.',
  };

  // ====================================================================
  // USER ACTIVATION (anon, via RPC) — TAHAP 3: +device_public_key
  // ====================================================================

  async function activateCode(payload) {
    if (!isConfigured()) {
      return { ok: false, reason: 'NETWORK', message: MSG.NETWORK };
    }

    var code = (payload.code || '').toUpperCase().trim();
    if (!code) {
      return { ok: false, reason: 'INVALID_CODE', message: MSG.INVALID };
    }

    var body = {
      p_code: code,
      p_device_id: payload.device_id || '',
      p_nama_pengguna: payload.nama_pengguna || null,
      p_username: payload.username || null,
      p_madrasah: payload.madrasah || null,
      p_kabupaten: payload.kabupaten || null,
      p_role: payload.role || null,
      p_device_info: payload.device_info || (navigator.userAgent || '').slice(0, 200),
      p_device_public_key: payload.device_public_key || null,
    };

    try {
      var r = await fetch(endpoint('rpc/activate_pkg_code'), {
        method: 'POST',
        headers: rpcHeaders(),
        body: JSON.stringify(body),
        cache: 'no-store',
      });

      if (!r.ok) {
        console.warn('[SupabaseSync] activateCode HTTP error:', r.status);
        return { ok: false, reason: 'SERVER_ERROR', message: MSG.SERVER_ERROR };
      }

      var result = await r.text();
      result = result.replace(/"/g, '').trim();

      switch (result) {
        case 'ACTIVATED':    return { ok: true, reason: 'ACTIVATED' };
        case 'ALREADY_USED': return { ok: false, reason: 'ALREADY_USED', message: MSG.ALREADY_USED };
        case 'REVOKED':      return { ok: false, reason: 'REVOKED', message: MSG.REVOKED };
        case 'INVALID_CODE':return { ok: false, reason: 'INVALID_CODE', message: MSG.INVALID };
        case 'RATE_LIMITED':return { ok: false, reason: 'RATE_LIMITED', message: MSG.RATE_LIMITED };
        default:             return { ok: false, reason: 'SERVER_ERROR', message: MSG.SERVER_ERROR };
      }
    } catch (e) {
      console.error('[SupabaseSync] activateCode network error:', e.message);
      return { ok: false, reason: 'NETWORK', message: MSG.NETWORK };
    }
  }

  // ====================================================================
  // TAHAP 3: get_my_activation — Get activation_id after activation
  // ====================================================================

  async function getMyActivation(deviceId, code) {
    if (!isConfigured()) return { ok: false };
    try {
      var body = {
        p_device_id: deviceId,
        p_code: code.toUpperCase().trim(),
      };
      var r = await fetch(endpoint('rpc/get_my_activation'), {
        method: 'POST',
        headers: rpcHeaders(),
        body: JSON.stringify(body),
        cache: 'no-store',
      });
      if (!r.ok) return { ok: false };
      var rows = await r.json();
      if (!Array.isArray(rows) || rows.length === 0) return { ok: false };
      return {
        ok: true,
        activationId: rows[0].activation_id,
        status: rows[0].status,
        deviceKeyEnrolled: rows[0].device_key_enrolled,
      };
    } catch (e) {
      return { ok: false };
    }
  }

  // ====================================================================
  // TAHAP 3: enrollDeviceKey — Legacy one-time enrollment
  // ====================================================================

  async function enrollDeviceKey(activationId, deviceId, publicJwk) {
    if (!isConfigured()) return { ok: false, status: 'NETWORK', message: MSG.NETWORK };
    try {
      var body = {
        p_activation_id: activationId,
        p_device_id: deviceId,
        p_device_public_key: publicJwk,
      };
      var r = await fetch(endpoint('rpc/enroll_pkg_device_key'), {
        method: 'POST',
        headers: rpcHeaders(),
        body: JSON.stringify(body),
        cache: 'no-store',
      });
      if (!r.ok) return { ok: false, status: 'SERVER_ERROR', message: MSG.SERVER_ERROR };
      var result = await r.text();
      result = result.replace(/"/g, '').trim();
      return { ok: result === 'ENROLLED', status: result };
    } catch (e) {
      return { ok: false, status: 'NETWORK', message: MSG.NETWORK };
    }
  }

  // ====================================================================
  // TAHAP 3: checkActivationStatus — User-side revoke check
  // ====================================================================

  async function checkActivationStatus(activationId, deviceId) {
    if (!isConfigured()) return { ok: false, status: 'NETWORK' };
    try {
      var body = {
        p_activation_id: activationId,
        p_device_id: deviceId,
      };
      var r = await fetch(endpoint('rpc/check_activation_status'), {
        method: 'POST',
        headers: rpcHeaders(),
        body: JSON.stringify(body),
        cache: 'no-store',
      });
      if (!r.ok) return { ok: false, status: 'SERVER_ERROR' };
      var result = await r.text();
      result = result.replace(/"/g, '').trim();
      return { ok: true, status: result };
    } catch (e) {
      return { ok: false, status: 'NETWORK' };
    }
  }

  // ====================================================================
  // ADMIN: Supabase Auth (email/password login)
  // ====================================================================

  var _adminSession = null;

  async function adminLogin(email, password) {
    if (!isConfigured()) return { ok: false, message: 'Supabase tidak terkonfigurasi.' };
    try {
      var r = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email, password: password }),
      });
      var data = await r.json();
      if (!r.ok) {
        return { ok: false, message: data.error_description || data.message || 'Login gagal.' };
      }
      _adminSession = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user: data.user,
        expires_at: data.expires_at,
      };
      return { ok: true, access_token: data.access_token, user: data.user };
    } catch (e) {
      return { ok: false, message: 'Network error: ' + e.message };
    }
  }

  function adminLogout() { _adminSession = null; }
  function getAdminSession() { return _adminSession; }
  function isAdminLoggedIn() { return !!(_adminSession && _adminSession.access_token); }

  function isSessionExpired() {
    if (!_adminSession || !_adminSession.access_token) return true;
    try {
      var token = _adminSession.access_token;
      var payload = JSON.parse(atob(token.split('.')[1]));
      var exp = payload.exp;
      if (!exp) return false;
      return (Date.now() / 1000) > (exp - 30);
    } catch (e) { return false; }
  }

  function handleRpcError(r, errText) {
    if (r.status === 401 || r.status === 403) {
      adminLogout();
      return { ok: false, message: MSG.SESSION_EXPIRED, sessionExpired: true };
    }
    if (r.status === 429) {
      return { ok: false, message: MSG.RATE_LIMITED, rateLimited: true };
    }
    if (errText && errText.indexOf('UNAUTHORIZED') >= 0) {
      adminLogout();
      return { ok: false, message: MSG.SESSION_EXPIRED, sessionExpired: true };
    }
    return { ok: false, message: 'Error ' + r.status + (errText ? ': ' + errText.slice(0, 200) : '') };
  }

  // ====================================================================
  // ADMIN RPCs
  // ====================================================================

  async function adminCreateCode(payload) {
    if (!isAdminLoggedIn()) return { ok: false, message: 'Admin belum login.' };
    if (isSessionExpired()) { adminLogout(); return { ok: false, message: MSG.SESSION_EXPIRED, sessionExpired: true }; }
    try {
      var body = {
        p_nama_pengguna: payload.nama_pengguna || null,
        p_madrasah:      payload.madrasah || null,
        p_kabupaten:     payload.kabupaten || null,
        p_catatan:       payload.catatan || null,
        p_role:          payload.role || null,
      };
      var r = await fetch(endpoint('rpc/admin_create_activation_code'), {
        method: 'POST',
        headers: authHeaders(_adminSession.access_token),
        body: JSON.stringify(body),
        cache: 'no-store',
      });
      if (!r.ok) {
        var errText = await r.text();
        return handleRpcError(r, errText);
      }
      var rows = await r.json();
      if (!Array.isArray(rows) || rows.length === 0) {
        return { ok: false, message: 'Server tidak mengembalikan kode.' };
      }
      var row = rows[0];
      return {
        ok: true,
        code: row.code,
        code_id: row.code_id,
        code_hint: row.code_hint,
        status: row.status,
        created_at: row.created_at,
      };
    } catch (e) {
      return { ok: false, message: 'Network error: ' + e.message };
    }
  }

  async function adminListCodes(opts) {
    if (!isAdminLoggedIn()) return { ok: false, message: 'Admin belum login.' };
    if (isSessionExpired()) { adminLogout(); return { ok: false, message: MSG.SESSION_EXPIRED, sessionExpired: true }; }
    opts = opts || {};
    try {
      var body = {
        p_status: opts.status || null,
        p_role:   opts.role || null,
        p_search: opts.search || null,
        p_page:   opts.page || 1,
        p_limit:  opts.limit || 25,
      };
      var r = await fetch(endpoint('rpc/admin_list_activation_codes'), {
        method: 'POST',
        headers: authHeaders(_adminSession.access_token),
        body: JSON.stringify(body),
        cache: 'no-store',
      });
      if (!r.ok) {
        var errText = await r.text();
        return handleRpcError(r, errText);
      }
      var rows = await r.json();
      var codes = Array.isArray(rows) ? rows : [];
      var totalCount = 0;
      if (codes.length > 0 && codes[0].total_count !== undefined) {
        totalCount = parseInt(codes[0].total_count) || codes.length;
      }
      return { ok: true, codes: codes, total: totalCount };
    } catch (e) {
      return { ok: false, message: 'Network error: ' + e.message };
    }
  }

  async function adminActivationStats() {
    if (!isAdminLoggedIn()) return { ok: false, message: 'Admin belum login.' };
    if (isSessionExpired()) { adminLogout(); return { ok: false, message: MSG.SESSION_EXPIRED, sessionExpired: true }; }
    try {
      var r = await fetch(endpoint('rpc/admin_activation_stats'), {
        method: 'POST',
        headers: authHeaders(_adminSession.access_token),
        body: JSON.stringify({}),
        cache: 'no-store',
      });
      if (!r.ok) {
        var errText = await r.text();
        return handleRpcError(r, errText);
      }
      var rows = await r.json();
      if (!Array.isArray(rows) || rows.length === 0) {
        return { ok: true, stats: { total: 0, unused: 0, activated: 0, revoked: 0 } };
      }
      var row = rows[0];
      return {
        ok: true,
        stats: {
          total:     parseInt(row.total) || 0,
          unused:    parseInt(row.unused) || 0,
          activated: parseInt(row.activated) || 0,
          revoked:   parseInt(row.revoked) || 0,
        }
      };
    } catch (e) {
      return { ok: false, message: 'Network error: ' + e.message };
    }
  }

  async function adminGetCodeDetail(codeId) {
    if (!isAdminLoggedIn()) return { ok: false, message: 'Admin belum login.' };
    if (isSessionExpired()) { adminLogout(); return { ok: false, message: MSG.SESSION_EXPIRED, sessionExpired: true }; }
    try {
      var r = await fetch(endpoint('rpc/admin_get_code_detail'), {
        method: 'POST',
        headers: authHeaders(_adminSession.access_token),
        body: JSON.stringify({ p_code_id: codeId }),
        cache: 'no-store',
      });
      if (!r.ok) {
        var errText = await r.text();
        return handleRpcError(r, errText);
      }
      var rows = await r.json();
      if (!Array.isArray(rows) || rows.length === 0) {
        return { ok: false, message: 'Kode tidak ditemukan.' };
      }
      return { ok: true, detail: rows[0] };
    } catch (e) {
      return { ok: false, message: 'Network error: ' + e.message };
    }
  }

  async function adminRevokeCode(codeId, reason) {
    if (!isAdminLoggedIn()) return { ok: false, message: 'Admin belum login.' };
    if (isSessionExpired()) { adminLogout(); return { ok: false, message: MSG.SESSION_EXPIRED, sessionExpired: true }; }
    try {
      var r = await fetch(endpoint('rpc/admin_revoke_activation_code'), {
        method: 'POST',
        headers: authHeaders(_adminSession.access_token),
        body: JSON.stringify({ p_code_id: codeId, p_reason: reason || 'Manual revocation by admin' }),
        cache: 'no-store',
      });
      if (!r.ok) {
        var errText = await r.text();
        return handleRpcError(r, errText);
      }
      var result = await r.text();
      result = result.replace(/"/g, '').trim();
      if (result === 'REVOKED')         return { ok: true, result: 'REVOKED' };
      if (result === 'ALREADY_REVOKED') return { ok: false, message: 'Kode sudah dinonaktifkan sebelumnya.' };
      if (result === 'NOT_FOUND')       return { ok: false, message: 'Kode tidak ditemukan.' };
      return { ok: false, message: 'Response tidak dikenal: ' + result };
    } catch (e) {
      return { ok: false, message: 'Network error: ' + e.message };
    }
  }

  // ====================================================================
  // TAHAP 3: adminReplaceDevice — Revoke old + issue new code
  // ====================================================================

  async function adminReplaceDevice(activationId, reason, catatan) {
    if (!isAdminLoggedIn()) return { ok: false, message: 'Admin belum login.' };
    if (isSessionExpired()) { adminLogout(); return { ok: false, message: MSG.SESSION_EXPIRED, sessionExpired: true }; }
    try {
      var body = {
        p_activation_id: activationId,
        p_reason: reason || 'Lainnya',
        p_catatan: catatan || null,
      };
      var r = await fetch(endpoint('rpc/admin_replace_device'), {
        method: 'POST',
        headers: authHeaders(_adminSession.access_token),
        body: JSON.stringify(body),
        cache: 'no-store',
      });
      if (!r.ok) {
        var errText = await r.text();
        return handleRpcError(r, errText);
      }
      var rows = await r.json();
      if (!Array.isArray(rows) || rows.length === 0) {
        return { ok: false, message: 'Server tidak mengembalikan kode pengganti.' };
      }
      var row = rows[0];
      if (!row.new_code) {
        return { ok: false, message: 'Aktivasi tidak berstatus activated (status: ' + (row.old_status || 'unknown') + ')' };
      }
      return {
        ok: true,
        newCode: row.new_code,
        newCodeId: row.new_code_id,
        newCodeHint: row.new_code_hint,
      };
    } catch (e) {
      return { ok: false, message: 'Network error: ' + e.message };
    }
  }

  // ====================================================================
  // TAHAP 3: Device Challenge — Admin generates challenge
  // ====================================================================

  async function adminCreateChallenge(activationId) {
    if (!isAdminLoggedIn()) return { ok: false, message: 'Admin belum login.' };
    if (isSessionExpired()) { adminLogout(); return { ok: false, message: MSG.SESSION_EXPIRED, sessionExpired: true }; }
    try {
      var r = await fetch(endpoint('rpc/admin_create_device_challenge'), {
        method: 'POST',
        headers: authHeaders(_adminSession.access_token),
        body: JSON.stringify({ p_activation_id: activationId }),
        cache: 'no-store',
      });
      if (!r.ok) {
        var errText = await r.text();
        return handleRpcError(r, errText);
      }
      var rows = await r.json();
      if (!Array.isArray(rows) || rows.length === 0) {
        return { ok: false, message: 'Gagal membuat challenge.' };
      }
      return {
        ok: true,
        challengeId: rows[0].challenge_id,
        challenge: rows[0].challenge,
        expiresAt: rows[0].expires_at,
      };
    } catch (e) {
      return { ok: false, message: 'Network error: ' + e.message };
    }
  }

  // ====================================================================
  // TAHAP 3: Verify Device Challenge (user-side signs, admin verifies)
  // ====================================================================

  async function submitChallengeResponse(challengeId, signatureBase64) {
    if (!isConfigured()) return { ok: false, status: 'NETWORK' };
    try {
      var body = {
        p_challenge_id: challengeId,
        p_signature: signatureBase64,
      };
      var r = await fetch(endpoint('rpc/verify_device_challenge'), {
        method: 'POST',
        headers: rpcHeaders(),
        body: JSON.stringify(body),
        cache: 'no-store',
      });
      if (!r.ok) return { ok: false, status: 'SERVER_ERROR' };
      var result = await r.text();
      result = result.replace(/"/g, '').trim();
      return { ok: result === 'RECORDED', status: result };
    } catch (e) {
      return { ok: false, status: 'NETWORK' };
    }
  }

  // ====================================================================
  // TAHAP 4: adminStatsV2 — 8 stat cards (total, unused, activated, revoked,
  //          activated_today, activated_30d, replacements, failed_attempts)
  // ====================================================================

  async function adminStatsV2() {
    if (!isAdminLoggedIn()) return { ok: false, message: 'Admin belum login.' };
    if (isSessionExpired()) { adminLogout(); return { ok: false, message: MSG.SESSION_EXPIRED, sessionExpired: true }; }
    try {
      var r = await fetch(endpoint('rpc/admin_activation_stats_v2'), {
        method: 'POST',
        headers: authHeaders(_adminSession.access_token),
        body: JSON.stringify({}),
        cache: 'no-store',
      });
      if (!r.ok) {
        var errText = await r.text();
        return handleRpcError(r, errText);
      }
      var rows = await r.json();
      if (!Array.isArray(rows) || rows.length === 0) {
        return {
          ok: true,
          stats: {
            total: 0, unused: 0, activated: 0, revoked: 0,
            activatedToday: 0, activated30d: 0, replacements: 0, failedAttempts: 0
          }
        };
      }
      var row = rows[0];
      return {
        ok: true,
        stats: {
          total:            parseInt(row.total_codes) || 0,
          unused:           parseInt(row.unused_codes) || 0,
          activated:        parseInt(row.activated_codes) || 0,
          revoked:          parseInt(row.revoked_codes) || 0,
          activatedToday:   parseInt(row.activated_today) || 0,
          activated30d:      parseInt(row.activated_30d) || 0,
          replacements:     parseInt(row.device_replacements) || 0,
          failedAttempts:   parseInt(row.failed_attempts) || 0,
        }
      };
    } catch (e) {
      return { ok: false, message: 'Network error: ' + e.message };
    }
  }

  // ====================================================================
  // TAHAP 4: adminListAuditLogs — filter/search/pagination
  // ====================================================================

  async function adminListAuditLogs(opts) {
    if (!isAdminLoggedIn()) return { ok: false, message: 'Admin belum login.' };
    if (isSessionExpired()) { adminLogout(); return { ok: false, message: MSG.SESSION_EXPIRED, sessionExpired: true }; }
    opts = opts || {};
    try {
      var body = {
        p_action:    opts.action || null,
        p_date_from: opts.dateFrom || null,
        p_date_to:   opts.dateTo || null,
        p_search:    opts.search || null,
        p_page:      opts.page || 1,
        p_limit:     opts.limit || 25,
      };
      var r = await fetch(endpoint('rpc/admin_list_audit_logs'), {
        method: 'POST',
        headers: authHeaders(_adminSession.access_token),
        body: JSON.stringify(body),
        cache: 'no-store',
      });
      if (!r.ok) {
        var errText = await r.text();
        return handleRpcError(r, errText);
      }
      var rows = await r.json();
      var logs = Array.isArray(rows) ? rows : [];
      var totalCount = 0;
      if (logs.length > 0 && logs[0].total_count !== undefined) {
        totalCount = parseInt(logs[0].total_count) || logs.length;
      }
      return { ok: true, logs: logs, total: totalCount };
    } catch (e) {
      return { ok: false, message: 'Network error: ' + e.message };
    }
  }

  // ====================================================================
  // TAHAP 4: adminGetSuspiciousActivity — recent failed attempts
  // ====================================================================

  async function adminGetSuspiciousActivity(opts) {
    if (!isAdminLoggedIn()) return { ok: false, message: 'Admin belum login.' };
    if (isSessionExpired()) { adminLogout(); return { ok: false, message: MSG.SESSION_EXPIRED, sessionExpired: true }; }
    opts = opts || {};
    try {
      var body = {
        p_hours: opts.hours || 24,
        p_limit: opts.limit || 20,
      };
      var r = await fetch(endpoint('rpc/admin_get_suspicious_activity'), {
        method: 'POST',
        headers: authHeaders(_adminSession.access_token),
        body: JSON.stringify(body),
        cache: 'no-store',
      });
      if (!r.ok) {
        var errText = await r.text();
        return handleRpcError(r, errText);
      }
      var rows = await r.json();
      return { ok: true, activities: Array.isArray(rows) ? rows : [] };
    } catch (e) {
      return { ok: false, message: 'Network error: ' + e.message };
    }
  }

  // ====================================================================
  // TAHAP 4: adminExportData — export activation codes (NO secrets)
  // ====================================================================

  async function adminExportData(opts) {
    if (!isAdminLoggedIn()) return { ok: false, message: 'Admin belum login.' };
    if (isSessionExpired()) { adminLogout(); return { ok: false, message: MSG.SESSION_EXPIRED, sessionExpired: true }; }
    opts = opts || {};
    try {
      var body = {
        p_status: opts.status || null,
        p_role:   opts.role || null,
      };
      var r = await fetch(endpoint('rpc/admin_export_data'), {
        method: 'POST',
        headers: authHeaders(_adminSession.access_token),
        body: JSON.stringify(body),
        cache: 'no-store',
      });
      if (!r.ok) {
        var errText = await r.text();
        return handleRpcError(r, errText);
      }
      var rows = await r.json();
      return { ok: true, data: Array.isArray(rows) ? rows : [] };
    } catch (e) {
      return { ok: false, message: 'Network error: ' + e.message };
    }
  }

  // ====================================================================
  // TAHAP 4: adminExportAuditLog — export audit logs (NO secrets)
  // ====================================================================

  async function adminExportAuditLog(opts) {
    if (!isAdminLoggedIn()) return { ok: false, message: 'Admin belum login.' };
    if (isSessionExpired()) { adminLogout(); return { ok: false, message: MSG.SESSION_EXPIRED, sessionExpired: true }; }
    opts = opts || {};
    try {
      var body = {
        p_action:    opts.action || null,
        p_date_from: opts.dateFrom || null,
        p_date_to:   opts.dateTo || null,
      };
      var r = await fetch(endpoint('rpc/admin_export_audit_log'), {
        method: 'POST',
        headers: authHeaders(_adminSession.access_token),
        body: JSON.stringify(body),
        cache: 'no-store',
      });
      if (!r.ok) {
        var errText = await r.text();
        return handleRpcError(r, errText);
      }
      var rows = await r.json();
      return { ok: true, data: Array.isArray(rows) ? rows : [] };
    } catch (e) {
      return { ok: false, message: 'Network error: ' + e.message };
    }
  }

  // ====================================================================
  // TAHAP 4: checkServerHealth — lightweight server health check
  // ====================================================================

  async function checkServerHealth() {
    if (!isConfigured()) return { ok: false, status: 'offline' };
    try {
      // Lightweight request — just check if Supabase REST is reachable
      var r = await fetch(SUPABASE_URL + '/rest/v1/', {
        method: 'GET',
        headers: rpcHeaders(),
        cache: 'no-store',
        signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined,
      });
      if (r.ok || r.status === 404 || r.status === 406 || r.status === 400) {
        // 404/406 is expected for bare endpoint — server is alive
        return { ok: true, status: 'online' };
      }
      return { ok: false, status: 'degraded' };
    } catch (e) {
      return { ok: false, status: 'offline', message: e.message };
    }
  }

  // ====================================================================
  // DEVICE INFO PARSER
  // ====================================================================

  function parseDeviceInfo(ua) {
    if (!ua) return { browser: '-', os: '-', device: '-' };
    var browser = 'Unknown';
    var os = 'Unknown';
    var device = 'Desktop';

    if (ua.indexOf('Edg/') > -1) browser = 'Microsoft Edge';
    else if (ua.indexOf('OPR/') > -1 || ua.indexOf('Opera') > -1) browser = 'Opera';
    else if (ua.indexOf('Chrome/') > -1) browser = 'Google Chrome';
    else if (ua.indexOf('Firefox/') > -1) browser = 'Mozilla Firefox';
    else if (ua.indexOf('Safari/') > -1) browser = 'Safari';

    if (ua.indexOf('Windows') > -1) os = 'Windows';
    else if (ua.indexOf('Android') > -1) os = 'Android';
    else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) os = 'iOS';
    else if (ua.indexOf('Mac OS') > -1 || ua.indexOf('MacOS') > -1) os = 'macOS';
    else if (ua.indexOf('Linux') > -1) os = 'Linux';

    if (ua.indexOf('Mobile') > -1 || ua.indexOf('Android') > -1) device = 'HP/Mobile';
    else if (ua.indexOf('iPad') > -1 || ua.indexOf('Tablet') > -1) device = 'Tablet';
    else if (ua.indexOf('Windows') > -1 && ua.indexOf('Touch') > -1) device = 'Tablet/Touch';

    return { browser: browser, os: os, device: device };
  }

  // === EXPORT ===
  window.SupabaseSync = {
    isConfigured: isConfigured,
    // User activation (anon) — Tahap 3: +device_public_key
    activateCode: activateCode,
    getMyActivation: getMyActivation,
    enrollDeviceKey: enrollDeviceKey,
    checkActivationStatus: checkActivationStatus,
    submitChallengeResponse: submitChallengeResponse,
    // Admin auth
    adminLogin: adminLogin,
    adminLogout: adminLogout,
    getAdminSession: getAdminSession,
    isAdminLoggedIn: isAdminLoggedIn,
    isSessionExpired: isSessionExpired,
    // Admin RPCs — Tahap 2
    adminCreateCode: adminCreateCode,
    adminListCodes: adminListCodes,
    adminRevokeCode: adminRevokeCode,
    adminActivationStats: adminActivationStats,
    adminGetCodeDetail: adminGetCodeDetail,
    // Admin RPCs — Tahap 3
    adminReplaceDevice: adminReplaceDevice,
    adminCreateChallenge: adminCreateChallenge,
    // Admin RPCs — Tahap 4
    adminStatsV2: adminStatsV2,
    adminListAuditLogs: adminListAuditLogs,
    adminGetSuspiciousActivity: adminGetSuspiciousActivity,
    adminExportData: adminExportData,
    adminExportAuditLog: adminExportAuditLog,
    checkServerHealth: checkServerHealth,
    // Utils
    parseDeviceInfo: parseDeviceInfo,
    // Error messages
    MSG: MSG,
  };
})();
