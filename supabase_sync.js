// supabase_sync.js — relay aktivasi dari HP user ke admin laptop via Supabase.
//
// Kenapa: GithubSync (PAT) cuma di admin browser, jadi HP user tidak bisa
// update kolom "Dipakai Oleh" di codes.json. Solusinya: HP user POST ke
// Supabase pakai anon key (RLS: INSERT-only). Admin laptop polling SELECT,
// merge ke local codes, lalu push lewat GithubSync seperti biasa.
//
// Tabel: pkg_aktivasi_log (sama struktur dengan erhk-2026: aktivasi_log)
(function () {
  'use strict';

  // === KONFIGURASI ===
  // Project Yanto: erhk-2026 (region ap-southeast-1, Singapore).
  // Publishable key boleh di-deploy ke browser (RLS yang melindungi).
  var SUPABASE_URL = 'https://setskebswnhfokfsorfj.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_bVcuJGs0k97BC18BkkgeYA_IOgDT16h';
  var TABLE = 'pkg_aktivasi_log';

  function isConfigured() {
    return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
  }

  function endpoint(path) {
    return SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/' + path;
  }

  function headers(extra) {
    return Object.assign({
      apikey: SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    }, extra || {});
  }

  // Cek apakah kode sudah dipakai di device lain (real-time cross-device check).
  // Dipanggil di register.js sebelum terima kode.
  async function isCodeUsed(code) {
    if (!isConfigured() || !code) return false;
    try {
      var codeNorm = String(code).toUpperCase().trim();
      var url = endpoint(TABLE) + '?code=eq.' + encodeURIComponent(codeNorm) + '&limit=1';
      var r = await fetch(url, { headers: headers(), cache: 'no-store' });
      if (!r.ok) {
        console.warn('[SupabaseSync] isCodeUsed failed:', r.status);
        return false;
      }
      var rows = await r.json();
      return Array.isArray(rows) && rows.length > 0;
    } catch (e) {
      console.warn('[SupabaseSync] isCodeUsed error:', e.message);
      return false;
    }
  }

  // HP user → POST setelah aktivasi sukses.
  // Best-effort: kalau gagal, aktivasi tetap jalan.
  async function reportActivation(payload) {
    if (!isConfigured()) return { ok: false, reason: 'not-configured' };
    try {
      var body = {
        code: String(payload.code || '').toUpperCase(),
        nama: String(payload.nama || ''),
        username: payload.username ? String(payload.username) : null,
        madrasah: payload.madrasah ? String(payload.madrasah) : null,
        role: payload.role || 'kamad',
        device_info: payload.device_info || (navigator.userAgent || '').slice(0, 200),
        device_id: payload.device_id || null,
      };
      var r = await fetch(endpoint(TABLE), {
        method: 'POST',
        headers: headers({ Prefer: 'return=minimal' }),
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        var txt = await r.text();
        console.warn('[SupabaseSync] reportActivation failed:', r.status, txt);
        return { ok: false, reason: 'http-' + r.status };
      }
      return { ok: true };
    } catch (e) {
      console.warn('[SupabaseSync] reportActivation error:', e.message);
      return { ok: false, reason: 'network', error: e.message };
    }
  }

  // Admin laptop → SELECT semua row yang belum processed_at.
  async function fetchUnprocessed() {
    if (!isConfigured()) return [];
    try {
      var url = endpoint(TABLE) + '?processed_at=is.null&order=activated_at.asc&limit=200';
      var r = await fetch(url, { headers: headers() });
      if (!r.ok) {
        console.warn('[SupabaseSync] fetchUnprocessed failed:', r.status);
        return [];
      }
      return await r.json();
    } catch (e) {
      console.warn('[SupabaseSync] fetchUnprocessed error:', e.message);
      return [];
    }
  }

  // Mark row sebagai processed.
  async function markProcessed(ids) {
    if (!isConfigured() || !ids || !ids.length) return { ok: true, count: 0 };
    try {
      var inFilter = '(' + ids.map(function (x) { return '"' + x + '"'; }).join(',') + ')';
      var url = endpoint(TABLE) + '?id=in.' + encodeURIComponent(inFilter);
      var r = await fetch(url, {
        method: 'PATCH',
        headers: headers({ Prefer: 'return=minimal' }),
        body: JSON.stringify({ processed_at: new Date().toISOString() }),
      });
      if (!r.ok) {
        var txt = await r.text();
        console.warn('[SupabaseSync] markProcessed failed:', r.status, txt);
        return { ok: false, reason: 'http-' + r.status };
      }
      return { ok: true, count: ids.length };
    } catch (e) {
      console.warn('[SupabaseSync] markProcessed error:', e.message);
      return { ok: false, error: e.message };
    }
  }

  // Workflow lengkap untuk admin: pull unprocessed → merge ke local codes →
  // push ke gh-pages → mark processed di Supabase.
  async function syncAdminInbox() {
    if (!isConfigured()) return { merged: 0, pushed: false, processed: 0, errors: ['not-configured'] };
    var errors = [];
    var rows = await fetchUnprocessed();
    if (!rows.length) return { merged: 0, pushed: false, processed: 0, errors: errors };

    var list = window.PKGAuth ? window.PKGAuth.listActivationCodes() : [];
    var processedIds = [];
    var merged = 0;

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var codeNorm = String(row.code || '').toUpperCase().trim();
      if (!codeNorm) { processedIds.push(row.id); continue; }
      var idx = -1;
      for (var j = 0; j < list.length; j++) {
        if (String(list[j].code || '').toUpperCase() === codeNorm) { idx = j; break; }
      }
      var noteParts = [row.nama];
      if (row.username) noteParts.push('u: ' + row.username);
      if (row.madrasah) noteParts.push(row.madrasah);
      var noteText = noteParts.filter(Boolean).join(' · ') + ' · auto ' + new Date(row.activated_at).toLocaleDateString('id-ID');
      if (idx >= 0) {
        if (!list[idx].deviceId) {
          list[idx].deviceId = row.device_id || row.device_info || '';
          list[idx].fullname = row.nama || list[idx].fullname || '';
          list[idx].madrasah = row.madrasah || list[idx].madrasah || '';
          list[idx].status = 'Used';
          list[idx].dateUsed = row.activated_at ? new Date(row.activated_at).toLocaleString() : new Date().toLocaleString();
        }
        if (!list[idx].notes || list[idx].notes === '') {
          list[idx].notes = 'auto: ' + noteText;
        }
        merged++;
      }
      processedIds.push(row.id);
    }

    var pushed = false;
    if (merged > 0 && window.PKGAuth) {
      window.PKGAuth.saveActivationCodes(list);
      pushed = true;
    }
    var processed = 0;
    if (processedIds.length) {
      var r = await markProcessed(processedIds);
      if (r.ok) processed = r.count || processedIds.length;
      else errors.push('markProcessed: ' + (r.reason || r.error || 'unknown'));
    }
    return { merged: merged, pushed: pushed, processed: processed, errors: errors };
  }

  window.SupabaseSync = {
    isConfigured: isConfigured,
    isCodeUsed: isCodeUsed,
    reportActivation: reportActivation,
    fetchUnprocessed: fetchUnprocessed,
    markProcessed: markProcessed,
    syncAdminInbox: syncAdminInbox,
  };
})();
