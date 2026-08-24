// ============================================================
// Cloudflare Worker — PKG App SPA Backend
// Handles: admin login + activation codes (D1 SQLite)
// Deploy: https://workers.cloudflare.com
// ============================================================

// SHA-256 hash via Web Crypto API (available in Workers)
async function sha256(text) {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Simple CORS headers
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
  'Content-Type': 'application/json'
};

// Simple admin token for basic auth (Cloudflare env var: ADMIN_TOKEN)
// This is a lightweight auth for the Worker itself — separate from admin login
function checkAdminToken(request, env) {
  const token = request.headers.get('X-Admin-Token');
  // If no ADMIN_TOKEN env set, allow all (Worker URL is secret enough)
  // If set, require matching token
  if (!env.ADMIN_TOKEN) return true;
  return token === env.ADMIN_TOKEN;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/+/, '');

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    // Health check
    if (path === '' || path === 'health') {
      return json({ ok: true, service: 'pkg-backend', time: Date.now() });
    }

    try {
      // --- ADMIN LOGIN ---
      // POST /admin-login { username, password }
      if (path === 'admin-login' && request.method === 'POST') {
        const { username, password } = await request.json();
        const hash = await sha256(password);
        const admin = await env.DB.prepare(
          'SELECT username, nama, role FROM pkg_admins WHERE username = ? AND password_hash = ?'
        ).bind(username, hash).first();
        if (!admin) return json({ ok: false, message: 'Username/password salah' });
        return json({ ok: true, username: admin.username, nama: admin.nama, role: admin.role });
      }

      // --- ACTIVATE CODE (user side) ---
      // POST /activate-code { code, device_id }
      if (path === 'activate-code' && request.method === 'POST') {
        const { code, device_id } = await request.json();
        const row = await env.DB.prepare(
          'SELECT * FROM pkg_activation_codes WHERE code = ?'
        ).bind(code).first();
        if (!row) return json({ ok: false, message: 'Kode aktivasi tidak ditemukan' });
        if (row.revoked) return json({ ok: false, message: 'Kode dicabut Admin' });
        if (row.activated) {
          if (row.device_id === device_id) {
            return json({ ok: true, nama: row.nama, madrasah: row.madrasah, kabupaten: row.kabupaten, role: row.role });
          }
          return json({ ok: false, message: 'Kode sudah dipakai di perangkat lain' });
        }
        await env.DB.prepare(
          'UPDATE pkg_activation_codes SET activated = 1, activated_at = ?, device_id = ? WHERE id = ?'
        ).bind(new Date().toISOString(), device_id, row.id).run();
        return json({ ok: true, nama: row.nama, madrasah: row.madrasah, kabupaten: row.kabupaten, role: row.role });
      }

      // --- CHECK CODE STATUS (without activating) ---
      // GET /check-code?code=XXX
      if (path === 'check-code' && request.method === 'GET') {
        const code = url.searchParams.get('code');
        const row = await env.DB.prepare(
          'SELECT * FROM pkg_activation_codes WHERE code = ?'
        ).bind(code).first();
        if (!row) return json({ ok: false, message: 'Kode tidak ditemukan' });
        return json({
          ok: true,
          activated: !!row.activated,
          revoked: !!row.revoked,
          nama: row.nama,
          madrasah: row.madrasah
        });
      }

      // === ADMIN PROTECTED ROUTES ===
      // All routes below require X-Admin-Token (if ADMIN_TOKEN env is set)
      if (!checkAdminToken(request, env)) {
        return json({ ok: false, message: 'Unauthorized' }, 401);
      }

      // --- ADMIN CREATE CODE ---
      // POST /admin/create-code { nama, madrasah, kabupaten, role, catatan, admin_username }
      if (path === 'admin/create-code' && request.method === 'POST') {
        const { nama, madrasah, kabupaten, role, catatan, admin_username } = await request.json();
        // Generate random 16-char hex code
        const code = Array.from(crypto.getRandomValues(new Uint8Array(8)))
          .map(b => b.toString(16).padStart(2, '0')).join('');
        const result = await env.DB.prepare(
          'INSERT INTO pkg_activation_codes (code, nama, madrasah, kabupaten, role, catatan, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(code, nama || null, madrasah || null, kabupaten || null, role || null, catatan || null, admin_username || null).run();
        return json({ ok: true, code, id: result.meta.last_row_id });
      }

      // --- ADMIN LIST CODES ---
      // GET /admin/list-codes
      if (path === 'admin/list-codes' && request.method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT id, code, nama, madrasah, kabupaten, role, catatan, device_id, activated, activated_at, revoked, created_by, created_at FROM pkg_activation_codes ORDER BY created_at DESC'
        ).all();
        return json({ ok: true, data: results || [] });
      }

      // --- ADMIN REVOKE CODE ---
      // POST /admin/revoke-code { id }
      if (path === 'admin/revoke-code' && request.method === 'POST') {
        const { id } = await request.json();
        await env.DB.prepare('UPDATE pkg_activation_codes SET revoked = 1 WHERE id = ?').bind(id).run();
        return json({ ok: true });
      }

      // --- ADMIN EDIT CODE ---
      // POST /admin/edit-code { id, nama, madrasah, kabupaten, role, catatan }
      if (path === 'admin/edit-code' && request.method === 'POST') {
        const { id, nama, madrasah, kabupaten, role, catatan } = await request.json();
        await env.DB.prepare(
          'UPDATE pkg_activation_codes SET nama = ?, madrasah = ?, kabupaten = ?, role = ?, catatan = ? WHERE id = ?'
        ).bind(nama || null, madrasah || null, kabupaten || null, role || null, catatan || null, id).run();
        return json({ ok: true });
      }

      // --- ADMIN DELETE CODE ---
      // POST /admin/delete-code { id }
      if (path === 'admin/delete-code' && request.method === 'POST') {
        const { id } = await request.json();
        await env.DB.prepare('DELETE FROM pkg_activation_codes WHERE id = ?').bind(id).run();
        return json({ ok: true });
      }

      // --- ADMIN DELETE ALL UNUSED CODES ---
      // POST /admin/delete-all-codes
      if (path === 'admin/delete-all-codes' && request.method === 'POST') {
        await env.DB.prepare('DELETE FROM pkg_activation_codes WHERE activated = 0 AND revoked = 0').run();
        return json({ ok: true });
      }

      // --- ADMIN STATS ---
      // GET /admin/stats
      if (path === 'admin/stats' && request.method === 'GET') {
        const total = await env.DB.prepare('SELECT COUNT(*) as c FROM pkg_activation_codes').first();
        const unused = await env.DB.prepare('SELECT COUNT(*) as c FROM pkg_activation_codes WHERE activated = 0 AND revoked = 0').first();
        const activated = await env.DB.prepare('SELECT COUNT(*) as c FROM pkg_activation_codes WHERE activated = 1').first();
        const revoked = await env.DB.prepare('SELECT COUNT(*) as c FROM pkg_activation_codes WHERE revoked = 1').first();
        return json({
          ok: true,
          total: total?.c || 0,
          unused: unused?.c || 0,
          activated: activated?.c || 0,
          revoked: revoked?.c || 0
        });
      }

      return json({ ok: false, message: 'Endpoint tidak ditemukan: ' + path }, 404);
    } catch (e) {
      return json({ ok: false, message: 'Server error: ' + e.message }, 500);
    }
  }
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: CORS
  });
}
