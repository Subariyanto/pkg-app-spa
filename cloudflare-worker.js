// ============================================================
// Cloudflare Worker — PKG App SPA Backend (SECURED)
// Handles: admin login + activation codes (D1 SQLite)
// Deploy: https://workers.cloudflare.com
//
// KEAMANAN:
// - Admin login mengeluarkan SESSION TOKEN (HMAC-signed, kedaluwarsa 8 jam)
// - Semua route /admin/* WAJIB memiliki token valid. TIDAK ADA default "allow all".
// - Password disimpan sebagai SHA-256 hash (bukan plaintext) — sudah di repo, kami
//   ganti password default & hapus bocoran dari schema.
// - Rate limiting per IP untuk login & aktivasi.
// - CORS dibatasi ke origin yang diizinkan (bukan "*").
// - Kode aktivasi: 1 kode = 1 perangkat (device binding di server).
// ============================================================

// SHA-256 hash via Web Crypto API (available in Workers)
async function sha256(text) {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- HMAC helpers (untuk session token) ---
function b64urlEncode(str) {
  return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return decodeURIComponent(escape(atob(s)));
}
async function hmac(secret, data) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const SESSION_TTL_SECONDS = 8 * 3600; // 8 jam

function getAuthSecret(env) {
  // Wajib ada salah satu. Kalau kosong, admin tidak bisa login & semua /admin/* ditolak.
  return env.ADMIN_SECRET || env.ADMIN_TOKEN || '';
}

async function createSessionToken(env, username) {
  const payload = b64urlEncode(JSON.stringify({ u: username, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS }));
  const sig = await hmac(getAuthSecret(env), payload);
  return payload + '.' + sig;
}

async function verifySessionToken(env, token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = await hmac(getAuthSecret(env), payload);
  if (sig !== expected) return null; // timing-safe-ish; HMAC compare
  try {
    const data = JSON.parse(b64urlDecode(payload));
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch (e) {
    return null;
  }
}

// --- CORS terbatas ---
function allowedOrigins(env) {
  return (env.ALLOWED_ORIGIN || 'https://subariyanto.github.io,https://pkg.pokjawasjember.com,http://pkg.pokjawasjember.com')
    .split(',').map(s => s.trim()).filter(Boolean);
}
function corsHeaders(request, env) {
  const base = { 'Content-Type': 'application/json', 'Vary': 'Origin' };
  const origin = request.headers.get('Origin');
  if (origin && allowedOrigins(env).includes(origin)) {
    base['Access-Control-Allow-Origin'] = origin;
  }
  base['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS';
  base['Access-Control-Allow-Headers'] = 'Content-Type, X-Admin-Token';
  return base;
}

// --- Rate limiting sederhana (D1) ---
async function rateLimit(env, key, max, windowSeconds) {
  const now = Math.floor(Date.now() / 1000);
  const resetAt = now + windowSeconds;
  let row;
  try {
    row = await env.DB.prepare('SELECT cnt, reset_at FROM pkg_rate_limit WHERE rkey = ?').bind(key).first();
  } catch (e) { row = null; }
  if (!row || !row.reset_at || row.reset_at < now) {
    await env.DB.prepare(
      'INSERT INTO pkg_rate_limit (rkey, cnt, reset_at) VALUES (?, ?, ?) ON CONFLICT(rkey) DO UPDATE SET cnt = ?, reset_at = ?'
    ).bind(key, 1, resetAt, 1, resetAt).run();
    return { ok: true };
  }
  if (row.cnt >= max) return { ok: false };
  await env.DB.prepare('UPDATE pkg_rate_limit SET cnt = cnt + 1 WHERE rkey = ?').bind(key).run();
  return { ok: true };
}

function clientIp(request) {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/+/, '');
    const headers = corsHeaders(request, env);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    // Health check
    if (path === '' || path === 'health') {
      return json({ ok: true, service: 'pkg-backend', time: Date.now() }, 200, headers);
    }

    try {
      // --- ADMIN LOGIN ---
      // POST /admin-login { username, password }
      if (path === 'admin-login' && request.method === 'POST') {
        if (!getAuthSecret(env)) {
          return json({ ok: false, message: 'Admin auth belum dikonfigurasi. Hubungi Admin.' }, 500, headers);
        }
        const rl = await rateLimit(env, 'login:' + clientIp(request), 10, 300); // 10 percobaan / 5 menit
        if (!rl.ok) return json({ ok: false, message: 'Terlalu banyak percobaan. Coba lagi nanti.' }, 429, headers);

        const { username, password } = await request.json();
        if (!username || !password) return json({ ok: false, message: 'Username/password wajib diisi' }, 400, headers);

        const hash = await sha256(password);
        const admin = await env.DB.prepare(
          'SELECT username, nama, role FROM pkg_admins WHERE username = ? AND password_hash = ?'
        ).bind(username, hash).first();
        if (!admin) return json({ ok: false, message: 'Username/password salah' }, 401, headers);

        const token = await createSessionToken(env, admin.username);
        return json({ ok: true, username: admin.username, nama: admin.nama, role: admin.role, token }, 200, headers);
      }

      // --- ACTIVATE CODE (user side) ---
      // POST /activate-code { code, device_id }
      if (path === 'activate-code' && request.method === 'POST') {
        const rl = await rateLimit(env, 'act:' + clientIp(request), 20, 300); // 20 / 5 menit
        if (!rl.ok) return json({ ok: false, message: 'Terlalu banyak permintaan. Coba lagi nanti.' }, 429, headers);

        const { code, device_id } = await request.json();
        if (!code || !device_id) return json({ ok: false, message: 'Kode & device_id wajib' }, 400, headers);

        const row = await env.DB.prepare('SELECT * FROM pkg_activation_codes WHERE code = ?').bind(code.trim().toUpperCase()).first();
        if (!row) return json({ ok: false, message: 'Kode aktivasi tidak ditemukan' }, 404, headers);
        if (row.revoked) return json({ ok: false, message: 'Kode dicabut Admin' }, 403, headers);
        if (row.activated) {
          // Idempotent: device yang sama boleh login lagi, device lain ditolak.
          if (row.device_id === device_id) {
            return json({ ok: true, nama: row.nama, madrasah: row.madrasah, kabupaten: row.kabupaten, role: row.role }, 200, headers);
          }
          return json({ ok: false, message: 'Kode sudah dipakai di perangkat lain' }, 409, headers);
        }
        await env.DB.prepare(
          'UPDATE pkg_activation_codes SET activated = 1, activated_at = ?, device_id = ? WHERE id = ?'
        ).bind(new Date().toISOString(), device_id, row.id).run();
        return json({ ok: true, nama: row.nama, madrasah: row.madrasah, kabupaten: row.kabupaten, role: row.role }, 200, headers);
      }

      // --- CHECK CODE STATUS (without activating) — hanya status, tanpa info pribadi ---
      // GET /check-code?code=***
      if (path === 'check-code' && request.method === 'GET') {
        const code = url.searchParams.get('code');
        if (!code) return json({ ok: false, message: 'Kode kosong' }, 400, headers);
        const row = await env.DB.prepare('SELECT activated, revoked FROM pkg_activation_codes WHERE code = ?').bind(code.trim().toUpperCase()).first();
        if (!row) return json({ ok: false, status: 'invalid', message: 'Kode tidak ditemukan' }, 404, headers);
        let status = 'unused';
        if (row.revoked) status = 'revoked';
        else if (row.activated) status = 'activated';
        return json({ ok: true, status }, 200, headers);
      }

      // === ADMIN PROTECTED ROUTES ===
      // session dideklarasikan di sini agar terlihat oleh semua route admin/ di bawah
      let session = null;
      if (path.startsWith('admin/')) {
        if (!getAuthSecret(env)) {
          return json({ ok: false, message: 'Admin auth belum dikonfigurasi' }, 500, headers);
        }
        const token = request.headers.get('X-Admin-Token');
        session = await verifySessionToken(env, token);
        if (!session) {
          return json({ ok: false, message: 'Sesi admin tidak valid atau kedaluwarsa. Silakan login ulang.' }, 401, headers);
        }
        // session.username = admin yang login
      }

      // --- ADMIN CREATE CODE ---
      // POST /admin/create-code { nama, madrasah, kabupaten, role, catatan, admin_username }
      if (path === 'admin/create-code' && request.method === 'POST') {
        const { nama, madrasah, kabupaten, role, catatan } = await request.json();
        // Generate code: PKG-XXXX-XXXX (4+4 alphanumeric uppercase, no confusing chars)
        // Harus konsisten dengan validasi frontend: ^PKG-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I,O,0,1
        function seg() {
          let s = '';
          const arr = new Uint8Array(4);
          crypto.getRandomValues(arr);
          for (let i = 0; i < 4; i++) {
            s += chars[arr[i] % chars.length];
          }
          return s;
        }
        const code = 'PKG-' + seg() + '-' + seg();
        const result = await env.DB.prepare(
          'INSERT INTO pkg_activation_codes (code, nama, madrasah, kabupaten, role, catatan, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(code, nama || null, madrasah || null, kabupaten || null, role || null, catatan || null, session.u).run();
        return json({ ok: true, code, id: result.meta.last_row_id }, 200, headers);
      }

      // --- ADMIN LIST CODES ---
      // GET /admin/list-codes
      if (path === 'admin/list-codes' && request.method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT id, code, nama, madrasah, kabupaten, role, catatan, device_id, activated, activated_at, revoked, created_by, created_at FROM pkg_activation_codes ORDER BY created_at DESC'
        ).all();
        return json({ ok: true, data: results || [] }, 200, headers);
      }

      // --- ADMIN REVOKE CODE ---
      // POST /admin/revoke-code { id }
      if (path === 'admin/revoke-code' && request.method === 'POST') {
        const { id } = await request.json();
        await env.DB.prepare('UPDATE pkg_activation_codes SET revoked = 1 WHERE id = ?').bind(id).run();
        return json({ ok: true }, 200, headers);
      }

      // --- ADMIN EDIT CODE ---
      // POST /admin/edit-code { id, nama, madrasah, kabupaten, role, catatan }
      if (path === 'admin/edit-code' && request.method === 'POST') {
        const { id, nama, madrasah, kabupaten, role, catatan } = await request.json();
        await env.DB.prepare(
          'UPDATE pkg_activation_codes SET nama = ?, madrasah = ?, kabupaten = ?, role = ?, catatan = ? WHERE id = ?'
        ).bind(nama || null, madrasah || null, kabupaten || null, role || null, catatan || null, id).run();
        return json({ ok: true }, 200, headers);
      }

      // --- ADMIN DELETE CODE ---
      // POST /admin/delete-code { id }
      if (path === 'admin/delete-code' && request.method === 'POST') {
        const { id } = await request.json();
        await env.DB.prepare('DELETE FROM pkg_activation_codes WHERE id = ?').bind(id).run();
        return json({ ok: true }, 200, headers);
      }

      // --- ADMIN DELETE ALL UNUSED CODES ---
      // POST /admin/delete-all-codes
      if (path === 'admin/delete-all-codes' && request.method === 'POST') {
        const result = await env.DB.prepare('DELETE FROM pkg_activation_codes WHERE activated = 0 AND revoked = 0').run();
        return json({ ok: true, deleted: result.meta?.changes || 0 }, 200, headers);
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
        }, 200, headers);
      }

      return json({ ok: false, message: 'Endpoint tidak ditemukan: ' + path }, 404, headers);
    } catch (e) {
      return json({ ok: false, message: 'Server error: ' + e.message }, 500, headers);
    }
  }
};

function json(obj, status = 200, headers = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: Object.assign({ 'Content-Type': 'application/json' }, headers)
  });
}
