// auth.js - Sistem Aktivasi Supabase + Login + PIN Lock untuk PKG App SPA
// V5 Supabase (2026-08-20): Kode aktivasi di server (Supabase), data PKG di localStorage.
// Admin login via Supabase RPC (tabel pkg_admins).
// User login: 100% localStorage (username + password_hash FNV1a).
// 1 kode = 1 perangkat (device ID binding via localStorage).

(function () {
  'use strict';

  // --- CONSTANTS ---
  var KEY_PIN_HASH = 'pkg_v1_pin_hash';
  var KEY_PIN_SALT = 'pkg_v1_pin_salt';
  var KEY_UNLOCKED = 'pkg_v1_unlocked';

  // Activation & Account Keys
  var KEY_ACTIVATED = 'pkg_v1_activated';
  var KEY_ACTIVATION_CODE = 'pkg_v1_activation_code';
  var KEY_DEVICE_ID = 'pkg_device_id';

  var KEY_USER_ROLE = 'pkg_v1_user_role';
  var KEY_USER_USERNAME = 'pkg_v1_user_username';
  var KEY_USER_PASSWORD_HASH = 'pkg_v1_user_password_hash';
  var KEY_USER_FULLNAME = 'pkg_v1_user_fullname';
  var KEY_USER_MADRASAH = 'pkg_v1_user_madrasah';
  var KEY_USER_KABUPATEN = 'pkg_v1_user_kabupaten';

  var KEY_LOGGED_IN = 'pkg_v1_logged_in';

  // Trial keys & config
  var KEY_TRIAL_START = 'pkg_v1_trial_start';
  var KEY_TRIAL_MODE = 'pkg_v1_trial_mode';
  var TRIAL_DAYS = 3; // sesuai permintaan Pak Yanto: 3 hari

  // Admin session keys
  var KEY_ADMIN_LOGGED_IN = 'pkg_admin_session';
  var KEY_ADMIN_USERNAME = 'pkg_admin_username';
  var KEY_ADMIN_NAMA = 'pkg_admin_nama';
  var KEY_LOCAL_ADMIN_HASH = 'pkg_v1_local_admin_hash';
  var KEY_LOCAL_ADMIN_USER = 'pkg_v1_local_admin_user';

  // Admin login sekarang hanya lewat server (Cloudflare Worker) dengan session token.
  // TIDAK ada credential default hardcoded di client. Ini mencegah bocornya password admin ke repo public.

  // --- CRYPTO UTILS ---
  // SHA-256 via Web Crypto API (async, returns hex string)
  async function sha256(str) {
    var buf = new TextEncoder().encode(str);
    var hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  function fnv1aHash(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    var h2 = 0x811c9dc5;
    var s2 = (h >>> 0).toString(16).padStart(8, '0') + str;
    for (var j = 0; j < s2.length; j++) {
      h2 ^= s2.charCodeAt(j);
      h2 = Math.imul(h2, 0x01000193);
    }
    return (h >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
  }

  async function sha256(text) {
    if (window.crypto && window.crypto.subtle) {
      var buf = new TextEncoder().encode(text);
      var hash = await crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(hash))
        .map(function (b) { return b.toString(16).padStart(2, '0'); })
        .join('');
    }
    return fnv1aHash(text);
  }

  function randomSalt() {
    if (window.crypto && window.crypto.getRandomValues) {
      var arr = new Uint8Array(16);
      crypto.getRandomValues(arr);
      return Array.from(arr).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    }
    var s = '';
    for (var i = 0; i < 32; i++) s += Math.floor(Math.random() * 16).toString(16);
    return s;
  }

  // --- DEVICE ID (simple browser-generated) ---
  function getDeviceId() {
    var id = localStorage.getItem(KEY_DEVICE_ID);
    if (!id) {
      id = 'DEV-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 8).toUpperCase();
      localStorage.setItem(KEY_DEVICE_ID, id);
    }
    return id;
  }

  // --- PIN LOCK LOGIC ---
  async function setPin(pin) {
    if (!/^\d{4,6}$/.test(pin)) throw new Error('PIN harus 4-6 digit angka');
    var salt = randomSalt();
    var hash = await sha256(salt + ':' + pin);
    localStorage.setItem(KEY_PIN_SALT, salt);
    localStorage.setItem(KEY_PIN_HASH, hash);
    sessionStorage.setItem(KEY_UNLOCKED, '1');
  }

  async function verifyPin(pin) {
    var salt = localStorage.getItem(KEY_PIN_SALT);
    var stored = localStorage.getItem(KEY_PIN_HASH);
    if (!salt || !stored) return false;
    var hash = await sha256(salt + ':' + pin);
    return hash === stored;
  }

  function isPinSet() {
    return !!(localStorage.getItem(KEY_PIN_HASH) && localStorage.getItem(KEY_PIN_SALT));
  }

  function clearPin() {
    localStorage.removeItem(KEY_PIN_HASH);
    localStorage.removeItem(KEY_PIN_SALT);
    sessionStorage.removeItem(KEY_UNLOCKED);
  }

  function isUnlocked() {
    if (!isPinSet()) return true;
    return sessionStorage.getItem(KEY_UNLOCKED) === '1';
  }

  function unlock() { sessionStorage.setItem(KEY_UNLOCKED, '1'); }
  function lock() { sessionStorage.removeItem(KEY_UNLOCKED); }

  function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // --- AUTH STATUS CHECKS ---
  function isActivated() {
    return localStorage.getItem(KEY_ACTIVATED) === 'true';
  }

  function isLoggedIn() {
    return sessionStorage.getItem(KEY_LOGGED_IN) === 'true';
  }

  function isAdminLoggedIn() {
    return localStorage.getItem(KEY_ADMIN_LOGGED_IN) === 'true';
  }

  function getAdminInfo() {
    return {
      username: localStorage.getItem(KEY_ADMIN_USERNAME) || '',
      nama: localStorage.getItem(KEY_ADMIN_NAMA) || ''
    };
  }

  function getUserInfo() {
    return {
      role: localStorage.getItem(KEY_USER_ROLE) || 'kamad',
      username: localStorage.getItem(KEY_USER_USERNAME) || '',
      fullname: localStorage.getItem(KEY_USER_FULLNAME) || '',
      madrasah: localStorage.getItem(KEY_USER_MADRASAH) || '',
      kabupaten: localStorage.getItem(KEY_USER_KABUPATEN) || '',
      deviceId: getDeviceId()
    };
  }

  // --- TRIAL ENGINE ---
  // Mode trial aktif jika role = 'trial' atau penanda trial_mode = '1'.
  function isTrial() {
    var role = (localStorage.getItem(KEY_USER_ROLE) || '').toLowerCase();
    var trialFlag = localStorage.getItem(KEY_TRIAL_MODE) === '1';
    return trialFlag || role === 'trial';
  }

  function getTrialStartMs() {
    var s = localStorage.getItem(KEY_TRIAL_START);
    if (!s) {
      var now = Date.now();
      localStorage.setItem(KEY_TRIAL_START, String(now));
      return now;
    }
    return parseInt(s, 10) || Date.now();
  }

  function getTrialDaysLeft() {
    if (!isTrial()) return -1;
    var startMs = getTrialStartMs();
    var endMs = startMs + TRIAL_DAYS * 24 * 3600 * 1000;
    var diffMs = endMs - Date.now();
    if (diffMs <= 0) return 0;
    return Math.max(1, Math.ceil(diffMs / (24 * 3600 * 1000)));
  }

  function isTrialExpired() {
    if (!isTrial()) return false;
    var startMs = getTrialStartMs();
    var endMs = startMs + TRIAL_DAYS * 24 * 3600 * 1000;
    return Date.now() >= endMs;
  }

  // Mulai trial: set role = 'trial' + tandai mode & tanggal mulai.
  // opts (opsional): { username, fullname, madrasah, kabupaten, password }
  function startTrial(opts) {
    opts = opts || {};
    localStorage.setItem(KEY_TRIAL_MODE, '1');
    localStorage.setItem(KEY_TRIAL_START, String(Date.now()));
    localStorage.setItem(KEY_USER_ROLE, 'trial');
    // Trial dianggap teraktivasi agar lolos gate aktivasi (role 'trial' yg menentukan perilaku).
    localStorage.setItem(KEY_ACTIVATED, 'true');
    // Gunakan data dari form kalau ada, kalau tidak fallback ke akun demo.
    var uname = (opts.username || '').trim().toLowerCase();
    var pass = (opts.password || '').trim();
    if (uname) localStorage.setItem(KEY_USER_USERNAME, uname);
    if (opts.fullname) localStorage.setItem(KEY_USER_FULLNAME, opts.fullname);
    if (opts.madrasah) localStorage.setItem(KEY_USER_MADRASAH, opts.madrasah);
    if (opts.kabupaten) localStorage.setItem(KEY_USER_KABUPATEN, opts.kabupaten);
    if (pass) localStorage.setItem(KEY_USER_PASSWORD_HASH, fnv1aHash(pass));
    // Kalau masih kosong (belum ada akun), beri default demo.
    if (!localStorage.getItem(KEY_USER_USERNAME)) {
      localStorage.setItem(KEY_USER_USERNAME, 'trial');
      localStorage.setItem(KEY_USER_FULLNAME, 'Pengguna Trial');
      localStorage.setItem(KEY_USER_PASSWORD_HASH, fnv1aHash('trial123'));
    }
    return true;
  }

  // --- VIEWS & RENDER OVERLAYS ---

  // 1. Screen Aktivasi & Registrasi (kode divalidasi via Supabase)
  function renderActivationScreen() {
    var overlay = document.getElementById('pkg-auth-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'pkg-auth-overlay';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = '\
      <style>\
        #pkg-auth-overlay {\
          position: fixed; inset: 0; z-index: 3000;\
          background: linear-gradient(135deg, #1e40af 0%, #1f5d3a 100%);\
          display: flex; align-items: flex-start; justify-content: center; overflow-y: auto;\
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;\
          padding: 1rem;\
        }\
        .auth-card {\
          background: #fff; border-radius: 12px; padding: 2rem;\
          width: 100%; max-width: 480px;\
          box-shadow: 0 12px 40px rgba(0,0,0,.25);\
        }\
        .auth-logo { text-align: center; margin-bottom: 1.5rem; }\
        .auth-logo i { font-size: 3rem; color: #1f5d3a; }\
        .auth-logo h2 { margin: 0.5rem 0 0; color: #1f5d3a; font-size: 1.5rem; font-weight: bold; }\
        .auth-logo p { margin: 0; color: #666; font-size: 0.85rem; }\
        .form-group { margin-bottom: 1rem; }\
        .form-group label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.25rem; color: #333; }\
        .form-group input, .form-group select {\
          width: 100%; padding: 0.6rem; border: 2px solid #ddd; border-radius: 8px; outline: none; font-size: 0.95rem;\
        }\
        .form-group input:focus, .form-group select:focus { border-color: #1f5d3a; }\
        .btn-auth-submit {\
          width: 100%; background: #1f5d3a; color: white; border: 0;\
          padding: 0.75rem; border-radius: 8px; font-weight: 600; cursor: pointer;\
          font-size: 1rem; margin-top: 1rem; transition: background 0.2s;\
        }\
        .btn-auth-submit:hover { background: #143e26; }\
        .btn-auth-submit:disabled { background: #999; cursor: not-allowed; }\
        .auth-err { color: #c0392b; font-size: 0.85rem; min-height: 1.2rem; margin-bottom: 0.5rem; text-align: center; }\
        .auth-info { color: #1e40af; font-size: 0.85rem; min-height: 1.2rem; margin-bottom: 0.5rem; text-align: center; }\
        .device-info-text { font-size: 0.75rem; color: #888; text-align: center; margin-top: 1rem; }\
      </style>\
      <div class="auth-card">\
        <div class="auth-logo">\
          <i class="bi bi-shield-check"></i>\
          <h2>Aktivasi & Registrasi Akun</h2>\
          <p>PKG Pokjawasmad Kab. Jember (KMA 1503)</p>\
        </div>\
        <div class="auth-err" id="auth-reg-err"></div>\
        <div class="auth-info" id="auth-reg-info"></div>\
        \
        <div class="form-group">\
          <label>Kode Aktivasi (PKG-XXXX-XXXX)</label>\
          <input id="reg-code" type="text" placeholder="Masukkan kode dari Admin/Ketua Pokjawas" autocomplete="off" style="text-transform: uppercase;">\
        </div>\
        \
        <div class="form-group">\
          <label>Pilihan Peran (Role)</label>\
          <select id="reg-role">\
            <option value="pengawas">Pengawas - Pembina</option>\
            <option value="kamad">Kepala Madrasah (Kamad) - Penilai</option>\
            <option value="trial">Trial (3 Hari)</option>\
          </select>\
        </div>\
        \
        <div class="form-group">\
          <label>Nama Pengguna (Username untuk login)</label>\
          <input id="reg-username" type="text" placeholder="Contoh: kamad_sukowono" autocomplete="off" minlength="4">\
        </div>\
        \
        <div class="form-group">\
          <label>Nama Lengkap</label>\
          <input id="reg-fullname" type="text" placeholder="Nama Lengkap beserta gelar" autocomplete="off">\
        </div>\
        \
        <div class="form-group" id="group-madrasah">\
          <label>Nama Madrasah</label>\
          <input id="reg-madrasah" type="text" placeholder="Contoh: MTs Negeri 1 Jember" autocomplete="off">\
        </div>\
        \
        <div class="form-group">\
          <label>Kabupaten/Kota Asal</label>\
          <input id="reg-kabupaten" type="text" placeholder="Contoh: Kabupaten Jember" autocomplete="address-level2">\
        </div>\
        \
        <div class="form-group">\
          <label>Password</label>\
          <input id="reg-password" type="password" placeholder="Minimal 6 karakter" autocomplete="off">\
        </div>\
        \
        <div class="form-group">\
          <label>Konfirmasi Password</label>\
          <input id="reg-confirm" type="password" placeholder="Ulangi password" autocomplete="off">\
        </div>\
        \
        <button class="btn-auth-submit" id="btn-reg-submit">Aktifkan & Daftar Akun</button>\
        <div style="text-align:center; margin-top:.75rem; font-size:.85rem;">\
          <a id="link-to-trial" style="color:#c0392b; cursor:pointer; text-decoration:none; font-weight:600;">Belum punya kode? Coba versi Trial 3 hari</a>\
        </div>\
        \
        <div class="device-info-text">\
          Device ID: ' + getDeviceId() + '<br>\
          Satu Kode Aktivasi hanya berlaku untuk satu perangkat browser ini.\
        </div>\
        \
        <div style="text-align:center; margin-top:1rem; font-size:.85rem;">\
          <a id="link-to-login" style="color:#1f5d3a; cursor:pointer; text-decoration:none; font-weight:600;">Sudah Memiliki Akun? Login di sini</a>\
        </div>\
        <div style="text-align:center; margin-top:1.25rem; padding-top:1rem; border-top:1px dashed #ddd;">\
          <div id="trial-expired-msg" style="display:none; color:#c0392b; font-size:.85rem; margin-bottom:.75rem; font-weight:600;">\
            <i class="bi bi-exclamation-triangle"></i> Masa Trial (3 hari) sudah berakhir. Silakan aktivasi dengan kode resmi.\
          </div>\
          <button id="btn-start-trial" type="button" style="width:100%; background:#6c757d; color:white; border:0; padding:.65rem; border-radius:8px; font-weight:600; cursor:pointer; font-size:.95rem;">\
            <i class="bi bi-clock-history"></i> Coba Trial (3 Hari)\
          </button>\
          <div style="font-size:.75rem; color:#888; margin-top:.5rem;">Akses penuh 3 hari. Dokumen cetak berwatermark "TRIAL".</div>\
        </div>\
      </div>';

    var roleSel = document.getElementById('reg-role');
    var linkLogin = document.getElementById('link-to-login');
    if (linkLogin) {
      linkLogin.addEventListener('click', function () {
        var oldOverlay = document.getElementById('pkg-auth-overlay');
        if (oldOverlay) oldOverlay.remove();
        renderLoginScreen();
      });
    }

    var linkTrial = document.getElementById('link-to-trial');
    if (linkTrial) {
      linkTrial.addEventListener('click', function () {
        if (confirm('Ya, saya ingin mencoba versi Trial 3 hari?\n\nSelama masa trial:\n- Semua dokumen cetak/PDF/DOCX diberi watermark "TRIAL"\n- Berfungsi penuh selama 3 hari\n- Setelah habis, hubungi Admin untuk kode aktivasi penuh')) {
          startTrial();
          alert('Mode Trial 3 hari diaktifkan!\n\nUsername: trial\nPassword: trial123\n\nSemua dokumen cetak akan diberi watermark TRIAL selama masa trial.');
          location.hash = '#/';
          location.reload();
        }
      });
    }

    var btnTrial = document.getElementById('btn-start-trial');
    if (btnTrial) {
      btnTrial.addEventListener('click', function () {
        if (confirm('Mulai mode Trial? Akses penuh 3 hari, dokumen cetak ada watermark TRIAL. Setelah 3 hari harus aktivasi dengan kode resmi. Lanjutkan?')) {
          startTrial();
        }
      });
    }

    if (sessionStorage.getItem('pkg_trial_just_expired') === '1') {
      sessionStorage.removeItem('pkg_trial_just_expired');
      var _trialMsg = document.getElementById('trial-expired-msg');
      if (_trialMsg) _trialMsg.style.display = 'block';
    }

    var groupMadrasah = document.getElementById('group-madrasah');
    if (roleSel && groupMadrasah) {
      roleSel.addEventListener('change', function () {
        groupMadrasah.style.display = roleSel.value === 'pengawas' ? 'none' : 'block';
      });
    }

    document.getElementById('btn-reg-submit').addEventListener('click', async function () {
      var errEl = document.getElementById('auth-reg-err');
      var infoEl = document.getElementById('auth-reg-info');
      var btn = document.getElementById('btn-reg-submit');
      var code = document.getElementById('reg-code').value.trim().toUpperCase();
      var role = document.getElementById('reg-role').value;
      var username = document.getElementById('reg-username').value.trim().toLowerCase();
      var fullname = document.getElementById('reg-fullname').value.trim();
      var madrasah = document.getElementById('reg-madrasah').value.trim();
      var kabupaten = document.getElementById('reg-kabupaten').value.trim();
      var password = document.getElementById('reg-password').value;
      var confirm = document.getElementById('reg-confirm').value;

      errEl.textContent = '';
      infoEl.textContent = '';

      if (!code || !username || !fullname || !kabupaten || !password) {
        errEl.textContent = 'Harap isi semua kolom yang wajib!';
        return;
      }
      if (username.length < 4) {
        errEl.textContent = 'Username minimal 4 karakter!';
        return;
      }
      if (password.length < 6) {
        errEl.textContent = 'Password minimal 6 karakter!';
        return;
      }
      if (password !== confirm) {
        errEl.textContent = 'Konfirmasi password tidak cocok!';
        return;
      }

      // Kalau role = 'trial', langsung mulai trial tanpa perlu kode aktivasi.
      if (role === 'trial') {
        startTrial({ username: username, fullname: fullname, madrasah: madrasah, kabupaten: kabupaten, password: password });
        alert('Mode Trial 3 hari diaktifkan!\n\nSilakan login dengan akun yang barusan dibuat.\n\nSemua dokumen cetak/PDF/DOCX akan diberi watermark TRIAL selama masa trial.');
        location.hash = '#/';
        location.reload();
        return;
      }

      // Validasi format kode aktivasi: PKG-XXXX-XXXX (alphanumeric, no I/O/0/1)
      if (!validateCodeFormat(code)) {
        errEl.textContent = 'Format kode aktivasi tidak valid! Format: PKG-XXXX-XXXX';
        return;
      }

      // --- VALIDASI KODE KE SUPABASE ---
      if (!window.SupabaseSync || !window.SupabaseSync.hasConfig()) {
        errEl.textContent = 'Server aktivasi tidak terkonfigurasi. Hubungi Admin.';
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Memvalidasi kode...';
      infoEl.textContent = 'Mengecek kode ke server...';

      var deviceId = getDeviceId();
      var result = await window.SupabaseSync.activateCode(
        code,
        deviceId,
        fullname,
        username,
        madrasah,
        kabupaten,
        role,
        navigator.userAgent || ''
      );

      btn.disabled = false;
      btn.textContent = 'Aktifkan & Daftar Akun';

      // result bisa string atau object
      var status = (typeof result === 'string') ? result : (result && result.data) || result;

      if (status === 'ACTIVATED' || (result && result === 'ACTIVATED')) {
        // Simpan aktivasi & akun ke localStorage
        localStorage.setItem(KEY_ACTIVATED, 'true');
        localStorage.setItem(KEY_ACTIVATION_CODE, code);
        localStorage.setItem(KEY_USER_ROLE, role);
        localStorage.setItem(KEY_USER_USERNAME, username);
        localStorage.setItem(KEY_USER_PASSWORD_HASH, fnv1aHash(password));
        localStorage.setItem(KEY_USER_FULLNAME, fullname);
        localStorage.setItem(KEY_USER_MADRASAH, madrasah);
        localStorage.setItem(KEY_USER_KABUPATEN, kabupaten);

        alert('Aktivasi berhasil! Kode tervalidasi di server. Akun telah dibuat. Silakan login.');
        location.hash = '#/';
        location.reload();
      } else if (status === 'INVALID_CODE') {
        errEl.textContent = 'Kode aktivasi tidak ditemukan di server. Periksa kembali kode Anda.';
      } else if (status === 'ALREADY_USED') {
        errEl.textContent = 'Kode aktivasi ini sudah dipakai perangkat lain.';
      } else if (status === 'REVOKED') {
        errEl.textContent = 'Kode aktivasi telah dicabut (revoke) oleh Admin.';
      } else {
        errEl.textContent = 'Gagal aktivasi: ' + (status || 'kesalahan tidak diketahui') + '. Cek koneksi internet.';
      }
    });
  }

  // Validasi format kode: PKG-XXXX-XXXX (4 huruf/angka per segmen, exclude I,O,0,1)
  function validateCodeFormat(code) {
    return /^PKG-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(code);
  }

  // 2. Screen Login Akun (Username + Password) — 100% localStorage
  function renderLoginScreen() {
    var overlay = document.getElementById('pkg-auth-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'pkg-auth-overlay';
      document.body.appendChild(overlay);
    }

    // Clear session supaya back button tidak auto-login
    sessionStorage.removeItem(KEY_LOGGED_IN);

    var regName = localStorage.getItem(KEY_USER_FULLNAME) || '';

    overlay.innerHTML = '\
      <style>\
        #pkg-auth-overlay {\
          position: fixed; inset: 0; z-index: 3000;\
          background: linear-gradient(135deg, #1f5d3a 0%, #1e40af 100%);\
          display: flex; align-items: flex-start; justify-content: center; overflow-y: auto;\
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;\
          padding: 1rem;\
        }\
        .auth-card {\
          background: #fff; border-radius: 12px; padding: 2rem;\
          width: 100%; max-width: 400px;\
          box-shadow: 0 12px 40px rgba(0,0,0,.25);\
        }\
        .auth-logo { text-align: center; margin-bottom: 1.5rem; }\
        .auth-logo i { font-size: 3rem; color: #1e40af; }\
        .auth-logo h2 { margin: 0.5rem 0 0; color: #1e40af; font-size: 1.5rem; font-weight: bold; }\
        .auth-logo p { margin: 0; color: #666; font-size: 0.85rem; }\
        .form-group { margin-bottom: 1.25rem; }\
        .form-group label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.25rem; color: #333; }\
        .form-group input {\
          width: 100%; padding: 0.65rem; border: 2px solid #ddd; border-radius: 8px; outline: none; font-size: 1rem;\
        }\
        .form-group input:focus { border-color: #1f5d3a; }\
        .btn-auth-submit {\
          width: 100%; background: #1f5d3a; color: white; border: 0;\
          padding: 0.75rem; border-radius: 8px; font-weight: 600; cursor: pointer;\
          font-size: 1rem; transition: background 0.2s;\
        }\
        .btn-auth-submit:hover { background: #143e26; }\
        .btn-auth-submit:disabled { background: #999; cursor: not-allowed; }\
        .auth-err { color: #c0392b; font-size: 0.85rem; min-height: 1.2rem; margin-bottom: 0.5rem; text-align: center; }\
      </style>\
      <div class="auth-card">\
        <div class="auth-logo">\
          <i class="bi bi-shield-lock"></i>\
          <h2>Login Pengguna</h2>\
          <p>' + escapeHtml(regName ? 'Selamat datang, ' + regName : 'PKG Pokjawasmad Kab. Jember') + '</p>\
        </div>\
        <div class="auth-err" id="auth-login-err"></div>\
        <div class="form-group">\
          <label>Username</label>\
          <input id="login-username" type="text" placeholder="Username" autocomplete="off">\
        </div>\
        <div class="form-group">\
          <label>Password</label>\
          <input id="login-password" type="password" placeholder="Password" autocomplete="off">\
        </div>\
        <button class="btn-auth-submit" id="btn-login">Masuk</button>\
        <div style="text-align:center; margin-top:1rem; font-size:.85rem;">\
          <a id="link-to-activation" style="color:#1f5d3a; cursor:pointer; text-decoration:none; font-weight:600;">Belum Punya Akun? Aktivasi di sini</a>\
        </div>\
        <div style="text-align:center; margin-top:1.25rem; padding-top:1rem; border-top:1px dashed #ddd;">\
          <button id="btn-login-trial" type="button" style="width:100%; background:#6c757d; color:white; border:0; padding:.65rem; border-radius:8px; font-weight:600; cursor:pointer; font-size:.95rem;">\
            <i class="bi bi-clock-history"></i> Coba Trial (3 Hari)\
          </button>\
          <div style="font-size:.75rem; color:#888; margin-top:.5rem;">Akses penuh 3 hari dengan watermark "TRIAL" pada dokumen.</div>\
        </div>\
      </div>';

    var btn = document.getElementById('btn-login');
    var errEl = document.getElementById('auth-login-err');
    var userInput = document.getElementById('login-username');
    var passInput = document.getElementById('login-password');

    async function doLogin() {
      var username = userInput.value.trim().toLowerCase();
      var password = passInput.value;
      errEl.textContent = '';

      if (!username || !password) {
        errEl.textContent = 'Isi username dan password.';
        return;
      }

      // 1. Coba local admin fallback (SHA-256, cepat, tidak butuh internet)
      if (await tryLocalAdminLogin(username, password)) return;

      // 2. Coba login admin via Supabase (dengan timeout 5 detik)
      if (window.SupabaseSync && window.SupabaseSync.hasConfig && window.SupabaseSync.hasConfig()) {
        errEl.textContent = 'Memeriksa akun...';
        var timeout = new Promise(function (_, reject) {
          setTimeout(function () { reject(new Error('timeout')); }, 5000);
        });
        try {
          var res = await Promise.race([adminLogin(username, password), timeout]);
          if (res && res.ok) {
            localStorage.setItem(KEY_ADMIN_LOGGED_IN, 'true');
            localStorage.setItem(KEY_ADMIN_USERNAME, res.username || username);
            localStorage.setItem(KEY_ADMIN_NAMA, res.nama || username);
            // Simpan hash lokal untuk login offline berikutnya
            var pwdHash = await sha256(password);
            localStorage.setItem(KEY_LOCAL_ADMIN_USER, res.username || username);
            localStorage.setItem(KEY_LOCAL_ADMIN_HASH, pwdHash);
            var ov = document.getElementById('pkg-auth-overlay');
            if (ov) ov.remove();
            window.location.hash = '#/kelola-aktivasi';
            if (typeof window.render === 'function') window.render();
            return;
          }
        } catch (e) { /* timeout atau error, lanjut ke local */ }
        // 3. Supabase gagal → coba login lokal (localStorage)
        tryLocalLogin(username, password);
        return;
      }

      // Tidak ada Supabase → langsung login lokal
      tryLocalLogin(username, password);
    }

    async function tryLocalAdminLogin(username, password) {
      // TIDAK ADA fallback hardcoded. Admin login harus lewat server (Worker).
      // Fungsi ini sekarang hanya melayani admin yang sudah pernah login & tersimpan local session.
      var localAdminUser = localStorage.getItem(KEY_LOCAL_ADMIN_USER);
      var localAdminHash = localStorage.getItem(KEY_LOCAL_ADMIN_HASH);
      if (!localAdminUser || !localAdminHash) return false;
      var pwdHash = await sha256(password);
      if (username === localAdminUser && pwdHash === localAdminHash) {
        localStorage.setItem(KEY_ADMIN_LOGGED_IN, 'true');
        localStorage.setItem(KEY_ADMIN_USERNAME, localAdminUser);
        localStorage.setItem(KEY_ADMIN_NAMA, localAdminUser);
        var ov = document.getElementById('pkg-auth-overlay');
        if (ov) ov.remove();
        window.location.hash = '#/kelola-aktivasi';
        if (typeof window.render === 'function') window.render();
        return true;
      }
      return false;
    }

    function tryLocalLogin(username, password) {
      errEl.textContent = '';
      var storedUsername = localStorage.getItem(KEY_USER_USERNAME);
      var storedHash = localStorage.getItem(KEY_USER_PASSWORD_HASH);

      if (!storedUsername) {
        errEl.textContent = 'Belum ada akun terdaftar. Silakan aktivasi terlebih dahulu.';
        return;
      }
      if (username !== storedUsername) {
        errEl.textContent = 'Username tidak ditemukan.';
        return;
      }
      if (fnv1aHash(password) !== storedHash) {
        errEl.textContent = 'Password salah.';
        return;
      }

      sessionStorage.setItem(KEY_LOGGED_IN, 'true');
      var overlay2 = document.getElementById('pkg-auth-overlay');
      if (overlay2) overlay2.remove();
      if (typeof window.render === 'function') window.render();
    }

    btn.addEventListener('click', doLogin);
    passInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); doLogin(); }
    });

    var linkAct = document.getElementById('link-to-activation');
    if (linkAct) {
      linkAct.addEventListener('click', function () {
        localStorage.setItem('pkg_v1_force_activation', 'true');
        location.reload();
      });
    }

    var btnLoginTrial = document.getElementById('btn-login-trial');
    if (btnLoginTrial) {
      btnLoginTrial.addEventListener('click', function () {
        if (confirm('Mulai mode Trial? Akses penuh 3 hari, dokumen cetak ada watermark TRIAL. Setelah 3 hari harus aktivasi dengan kode resmi. Lanjutkan?')) {
          startTrial();
        }
      });
    }

    setTimeout(function () { if (userInput) userInput.focus(); }, 50);
  }

  // 3. PIN Lock Screen
  function renderLockScreen() {
    var old = document.getElementById('pkg-lock-overlay');
    if (old) old.remove();
    var overlay = document.createElement('div');
    overlay.id = 'pkg-lock-overlay';
    overlay.innerHTML = '\
      <style>\
        #pkg-lock-overlay {\
          position: fixed; inset: 0; z-index: 3000;\
          background: linear-gradient(135deg, #1f5d3a 0%, #06a04c 100%);\
          display: flex; align-items: flex-start; justify-content: center; overflow-y: auto;\
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;\
        }\
        #pkg-lock-card {\
          background: #fff; border-radius: 12px; padding: 2rem;\
          width: 90%; max-width: 360px;\
          box-shadow: 0 12px 40px rgba(0,0,0,.25);\
          text-align: center;\
        }\
        #pkg-lock-card .lock-icon {\
          font-size: 3rem; color: #1f5d3a;\
          width: 80px; height: 80px; line-height: 80px;\
          margin: 0 auto 1rem;\
          background: #d6efd9; border-radius: 50%;\
        }\
        #pkg-lock-card h2 { margin: 0 0 .25rem; color: #1f5d3a; font-size: 1.4rem; }\
        #pkg-lock-card .subtitle { color: #666; font-size: .9rem; margin-bottom: 1.5rem; }\
        #pkg-lock-card input {\
          width: 100%; font-size: 1.6rem; text-align: center; letter-spacing: .8rem;\
          padding: .6rem; border: 2px solid #d6efd9; border-radius: 8px;\
          margin-bottom: 1rem; outline: none;\
        }\
        #pkg-lock-card input:focus { border-color: #1f5d3a; }\
        #pkg-lock-card button.btn-primary {\
          width: 100%; background: #1f5d3a; color: white; border: 0;\
          padding: .65rem; border-radius: 8px; font-weight: 600; cursor: pointer;\
          font-size: 1rem;\
        }\
        #pkg-lock-card button.btn-primary:hover { background: #143e26; }\
        #pkg-lock-card .err { color: #c0392b; font-size: .85rem; min-height: 1.2rem; margin-bottom: .5rem; }\
        #pkg-lock-card .footer-link { margin-top: 1rem; font-size: .85rem; }\
        #pkg-lock-card .footer-link a { color: #1f5d3a; text-decoration: none; cursor: pointer; }\
        #pkg-lock-card .footer-link a:hover { text-decoration: underline; }\
      </style>\
      <div id="pkg-lock-card">\
        <div class="lock-icon"><i class="bi bi-shield-lock"></i></div>\
        <h2>Aplikasi Terkunci</h2>\
        <div class="subtitle">Masukkan PIN untuk melanjutkan</div>\
        <input id="pkg-pin-input" type="password" inputmode="numeric" pattern="\\d*" maxlength="6" autocomplete="off" placeholder="\u2022\u2022\u2022\u2022">\
        <div class="err" id="pkg-pin-err"></div>\
        <button class="btn-primary" id="pkg-pin-submit">Buka Aplikasi</button>\
        <div class="footer-link">\
          <a id="pkg-pin-forgot">Lupa PIN?</a>\
        </div>\
      </div>';
    document.body.appendChild(overlay);
    var input = document.getElementById('pkg-pin-input');
    var submit = document.getElementById('pkg-pin-submit');
    var err = document.getElementById('pkg-pin-err');
    var forgot = document.getElementById('pkg-pin-forgot');

    setTimeout(function () { input.focus(); }, 50);

    async function tryUnlock() {
      var pin = input.value.trim();
      if (!pin) { err.textContent = 'Masukkan PIN terlebih dahulu.'; return; }
      submit.disabled = true;
      var ok = await verifyPin(pin);
      submit.disabled = false;
      if (!ok) {
        err.textContent = 'PIN salah. Coba lagi.';
        input.value = ''; input.focus();
        return;
      }
      unlock();
      hideLockScreen();
      if (typeof window.render === 'function') window.render();
    }

    submit.addEventListener('click', tryUnlock);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); tryUnlock(); }
    });
    forgot.addEventListener('click', function () {
      var ok = confirm(
        'Tidak ada cara recovery PIN. Pilihan satu-satunya adalah RESET semua data, registrasi akun, dan PIN.\n\n' +
        'PASTIKAN sudah backup data terlebih dahulu.\n\n' +
        'Lanjutkan reset?'
      );
      if (!ok) return;
      var ok2 = confirm('Konfirmasi sekali lagi: HAPUS semua data PKG dan PIN dari browser ini?');
      if (!ok2) return;

      var keys = Object.keys(localStorage).filter(function (k) { return k.startsWith('pkg_v1_') || k.startsWith('pkg_device_'); });
      keys.forEach(function (k) { localStorage.removeItem(k); });
      sessionStorage.clear();
      alert('Semua data PKG, PIN, dan aktivasi sudah dihapus. Halaman akan di-reloaded.');
      location.reload();
    });
  }

  function hideLockScreen() {
    var o = document.getElementById('pkg-lock-overlay');
    if (o) o.remove();
  }

  // 4. Initial PIN setup
  function promptInitialPinSetup() {
    return new Promise(function (resolve) {
      var overlay = document.createElement('div');
      overlay.id = 'pkg-pin-setup-overlay';
      overlay.innerHTML = '\
        <style>\
          #pkg-pin-setup-overlay {\
            position: fixed; inset: 0; z-index: 3000;\
            background: rgba(0,0,0,.5);\
            display: flex; align-items: flex-start; justify-content: center; overflow-y: auto; padding: 1rem;\
          }\
          #pkg-pin-setup-card {\
            background: #fff; border-radius: 12px; padding: 1.75rem;\
            width: 92%; max-width: 420px;\
            box-shadow: 0 12px 40px rgba(0,0,0,.25);\
          }\
          #pkg-pin-setup-card h3 { margin: 0 0 .5rem; color: #1f5d3a; }\
          #pkg-pin-setup-card .desc { color: #555; font-size: .9rem; margin-bottom: 1rem; }\
          #pkg-pin-setup-card label { display: block; font-size: .85rem; font-weight: 600; margin-bottom: .25rem; color: #333; }\
          #pkg-pin-setup-card input {\
            width: 100%; font-size: 1.4rem; text-align: center; letter-spacing: .6rem;\
            padding: .5rem; border: 2px solid #d6efd9; border-radius: 8px;\
            margin-bottom: .9rem; outline: none;\
          }\
          #pkg-pin-setup-card input:focus { border-color: #1f5d3a; }\
          #pkg-pin-setup-card .row-btn { display: flex; gap: .5rem; margin-top: .75rem; }\
          #pkg-pin-setup-card button {\
            flex: 1; padding: .55rem; border-radius: 8px; font-weight: 600; cursor: pointer; border: 0;\
          }\
          #pkg-pin-setup-card .btn-primary { background: #1f5d3a; color: white; }\
          #pkg-pin-setup-card .btn-secondary { background: #e9ecef; color: #333; }\
          #pkg-pin-setup-card .err { color: #c0392b; font-size: .85rem; min-height: 1.1rem; }\
        </style>\
        <div id="pkg-pin-setup-card">\
          <h3><i class="bi bi-shield-lock"></i> Atur PIN Aplikasi</h3>\
          <div class="desc">Lindungi data PKG dengan PIN 4-6 digit. PIN akan diminta setiap kali aplikasi dibuka.</div>\
          <label>PIN baru (4-6 digit)</label>\
          <input id="pkg-pin-new" type="password" inputmode="numeric" pattern="\\d*" maxlength="6" placeholder="\u2022\u2022\u2022\u2022">\
          <label>Konfirmasi PIN</label>\
          <input id="pkg-pin-confirm" type="password" inputmode="numeric" pattern="\\d*" maxlength="6" placeholder="\u2022\u2022\u2022\u2022">\
          <div class="err" id="pkg-pin-setup-err"></div>\
          <div class="row-btn">\
            <button class="btn-secondary" id="pkg-pin-skip">Nanti Saja</button>\
            <button class="btn-primary" id="pkg-pin-save">Simpan PIN</button>\
          </div>\
        </div>';
      document.body.appendChild(overlay);
      var newInput = document.getElementById('pkg-pin-new');
      var confirmInput = document.getElementById('pkg-pin-confirm');
      var err = document.getElementById('pkg-pin-setup-err');
      var skipBtn = document.getElementById('pkg-pin-skip');
      var saveBtn = document.getElementById('pkg-pin-save');

      setTimeout(function () { newInput.focus(); }, 50);

      function close(result) {
        overlay.remove();
        resolve(result);
      }

      saveBtn.addEventListener('click', async function () {
        var a = newInput.value.trim();
        var b = confirmInput.value.trim();
        if (!/^\d{4,6}$/.test(a)) { err.textContent = 'PIN harus 4-6 digit angka.'; return; }
        if (a !== b) { err.textContent = 'Konfirmasi PIN tidak cocok.'; return; }
        try {
          await setPin(a);
          close(true);
        } catch (e) {
          err.textContent = e.message || 'Gagal menyimpan PIN.';
        }
      });
      skipBtn.addEventListener('click', function () { close(false); });
      [newInput, confirmInput].forEach(function (el) {
        el.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { e.preventDefault(); saveBtn.click(); }
        });
      });
    });
  }

  // Settings view for PIN
  function viewPengaturanPIN(view) {
    var isSet = isPinSet();
    var info = getUserInfo();
    view.innerHTML = '\
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">\
      <h4 class="mb-0"><i class="bi bi-shield-lock"></i> Pengaturan Akun & PIN</h4>\
    </div>\
    <div class="row g-3">\
      <div class="col-lg-6">\
        <div class="card h-100">\
          <div class="card-header"><i class="bi bi-person-badge"></i> Profil Pengguna</div>\
          <div class="card-body">\
            <table class="table table-sm table-borderless">\
              <tr><td><strong>Nama Lengkap:</strong></td><td>' + escapeHtml(info.fullname) + '</td></tr>\
              <tr><td><strong>Peran (Role):</strong></td><td><span class="badge bg-primary text-uppercase">' + escapeHtml(info.role) + '</span></td></tr>\
              <tr><td><strong>Madrasah:</strong></td><td>' + escapeHtml(info.madrasah) + '</td></tr>\
              <tr><td><strong>Kabupaten:</strong></td><td>' + escapeHtml(info.kabupaten) + '</td></tr>\
              <tr><td><strong>Device ID:</strong></td><td><code class="small">' + escapeHtml(info.deviceId) + '</code></td></tr>\
              <tr><td><strong>Kode Aktivasi:</strong></td><td><code class="small">' + escapeHtml(localStorage.getItem(KEY_ACTIVATION_CODE) || '-') + '</code></td></tr>\
            </table>\
          </div>\
        </div>\
      </div>\
      <div class="col-lg-6">\
        <div class="card h-100">\
          <div class="card-header"><i class="bi bi-gear"></i> Keamanan PIN</div>\
          <div class="card-body">\
            <p class="mb-2"><strong>PIN aktif:</strong> ' + (isSet ? '<span class="text-success">Ya, PIN terpasang.</span>' : '<span class="text-muted">Belum diatur.</span>') + '</p>\
            <p class="small text-muted mb-3">' + (isSet
              ? 'Aplikasi terkunci saat dibuka di tab baru.'
              : 'Aktifkan PIN for pengamanan ekstra.') + '</p>\
            ' + (isSet ? '\
              <button id="btn-change-pin" class="btn btn-sm btn-primary w-100 mb-2"><i class="bi bi-key"></i> Ganti PIN</button>\
              <button id="btn-remove-pin" class="btn btn-sm btn-outline-danger w-100"><i class="bi bi-shield-slash"></i> Hapus PIN</button>\
            ' : '\
              <button id="btn-set-pin" class="btn btn-sm btn-success w-100"><i class="bi bi-shield-plus"></i> Aktifkan PIN</button>\
            ') + '\
          </div>\
        </div>\
      </div>\
    </div>\
    <div class="alert alert-warning mt-3 small">\
      <i class="bi bi-exclamation-triangle"></i> <strong>Penting:</strong> Tidak ada cara recovery PIN.\
      Jika lupa PIN, harus reset data. Selalu lakukan backup berkala.\
    </div>';

    if (isSet) {
      document.getElementById('btn-change-pin').addEventListener('click', async function () {
        var old = prompt('Masukkan PIN saat ini untuk verifikasi:');
        if (!old) return;
        var ok = await verifyPin(old.trim());
        if (!ok) { alert('PIN saat ini salah.'); return; }
        var ok2 = await promptInitialPinSetup();
        if (ok2) alert('PIN berhasil diganti.');
      });
      document.getElementById('btn-remove-pin').addEventListener('click', async function () {
        var old = prompt('Masukkan PIN saat ini untuk verifikasi:');
        if (!old) return;
        var ok = await verifyPin(old.trim());
        if (!ok) { alert('PIN salah.'); return; }
        if (!confirm('Hapus PIN?')) return;
        clearPin();
        alert('PIN dihapus.');
        if (typeof window.render === 'function') window.render();
      });
    } else {
      document.getElementById('btn-set-pin').addEventListener('click', async function () {
        var ok = await promptInitialPinSetup();
        if (ok) {
          alert('PIN berhasil diaktifkan.');
          if (typeof window.render === 'function') window.render();
        }
      });
    }
  }

  // --- ADMIN LOGIN via server (Cloudflare Worker) ---
  // Admin login MURNI lewat server. Worker mengembalikan session token.
  // Tidak ada fallback credential default di client.
  async function adminLogin(username, password) {
    if (!window.SupabaseSync || !window.SupabaseSync.hasConfig()) {
      return { ok: false, message: 'Username/password salah.' };
    }
    return window.SupabaseSync.adminLogin(username, password);
  }

  function adminLogout() {
    localStorage.removeItem(KEY_ADMIN_LOGGED_IN);
    localStorage.removeItem(KEY_ADMIN_USERNAME);
    localStorage.removeItem(KEY_ADMIN_NAMA);
    if (window.SupabaseSync && window.SupabaseSync.adminLogout) {
      window.SupabaseSync.adminLogout(); // hapus session token juga
    }
  }

  function clearTrial() {
    localStorage.removeItem(KEY_TRIAL_START);
    localStorage.removeItem(KEY_TRIAL_MODE);
    localStorage.removeItem(KEY_USER_ROLE);
    localStorage.removeItem(KEY_USER_USERNAME);
    localStorage.removeItem(KEY_USER_PASSWORD_HASH);
    localStorage.removeItem(KEY_USER_FULLNAME);
    localStorage.removeItem(KEY_ACTIVATED);
    sessionStorage.removeItem(KEY_LOGGED_IN);
  }

  // --- INITIALIZATION ---
  async function init() {
    // 0. Bypass aktivasi kalau admin akses #/kelola-aktivasi (chicken-and-egg fix)
    var hash = window.location.hash || '';
    var isAdminRoute = hash.indexOf('kelola-aktivasi') >= 0;
    if (isAdminRoute) {
      // Skip aktivasi, biarkan app.js render halaman kelola-aktivasi
      var o = document.getElementById('pkg-auth-overlay');
      if (o) o.remove();
      return;
    }

    // 0a. Kalau diminta ke halaman aktivasi (dari link 'Buat Akun Baru')
    var forceActivation = localStorage.getItem('pkg_v1_force_activation') === 'true';
    if (forceActivation) {
      localStorage.removeItem('pkg_v1_force_activation');
      renderActivationScreen();
      return new Promise(function () {});
    }

    // 0t. Trial mode check — jika trial sudah expired, bersihkan & paksa aktivasi
    var _isTrialUser = localStorage.getItem(KEY_USER_ROLE) === 'trial';
    if (_isTrialUser && isTrialExpired()) {
      localStorage.removeItem(KEY_ACTIVATED);
      localStorage.removeItem(KEY_USER_ROLE);
      localStorage.removeItem(KEY_USER_USERNAME);
      localStorage.removeItem(KEY_USER_PASSWORD_HASH);
      localStorage.removeItem(KEY_USER_FULLNAME);
      localStorage.removeItem(KEY_USER_MADRASAH);
      localStorage.removeItem(KEY_USER_KABUPATEN);
      sessionStorage.removeItem(KEY_LOGGED_IN);
      sessionStorage.setItem('pkg_trial_just_expired', '1');
      renderActivationScreen();
      return new Promise(function () {});
    }

    // 0b. Kalau sudah punya akun terdaftar tapi belum aktivasi di device ini → langsung ke login
    var hasAccount = localStorage.getItem(KEY_USER_USERNAME);
    var skipActivation = localStorage.getItem('pkg_v1_skip_activation') === 'true';
    if (skipActivation || hasAccount) {
      localStorage.removeItem('pkg_v1_skip_activation');
      if (!isLoggedIn()) {
        // Trial user masih aktif → auto-login (tanpa input username/password)
        if (_isTrialUser && !isTrialExpired()) {
          sessionStorage.setItem(KEY_LOGGED_IN, 'true');
        } else {
          renderLoginScreen();
          return new Promise(function () {});
        }
      }
    }

    // 1. Cek Aktivasi
    if (!isActivated()) {
      renderActivationScreen();
      return new Promise(function () {});
    }

    // 2. Cek Login
    if (!isLoggedIn()) {
      renderLoginScreen();
      return new Promise(function () {});
    }

    // 3. Cek PIN Lock
    if (isPinSet() && !isUnlocked()) {
      renderLockScreen();
      return new Promise(function (resolve) {
        var check = setInterval(function () {
          if (isUnlocked() || !isPinSet()) {
            clearInterval(check);
            resolve();
          }
        }, 200);
      });
    }

    // Lolos semua gate
    var overlay = document.getElementById('pkg-auth-overlay');
    if (overlay) overlay.remove();
  }

  function logout() {
    // Kalau trial user, hapus state trial supaya tidak auto-login ulang
    if (isTrial()) {
      if (!confirm('Keluar dari mode Trial?\n\nAnda akan kembali ke halaman aktivasi.\nData PKG yang sudah diinput tetap tersimpan di browser.')) return;
      clearTrial();
      location.hash = '#/';
      location.reload();
      return;
    }
    sessionStorage.removeItem(KEY_LOGGED_IN);
    lock();
    location.reload();
  }

  // Expose ke global
  window.PKGAuth = {
    setPin: setPin,
    verifyPin: verifyPin,
    isPinSet: isPinSet,
    clearPin: clearPin,
    isUnlocked: isUnlocked,
    unlock: unlock,
    lock: lock,
    init: init,
    logout: logout,
    isActivated: isActivated,
    isLoggedIn: isLoggedIn,
    getUserInfo: getUserInfo,
    viewPengaturanPIN: viewPengaturanPIN,
    escapeHtml: escapeHtml,
    getDeviceId: getDeviceId,
    validateCodeFormat: validateCodeFormat,
    // Trial
    isTrial: isTrial,
    getTrialDaysLeft: getTrialDaysLeft,
    isTrialExpired: isTrialExpired,
    startTrial: startTrial,
    clearTrial: clearTrial,
    // Admin
    isAdminLoggedIn: isAdminLoggedIn,
    getAdminInfo: getAdminInfo,
    adminLogin: adminLogin,
    adminLogout: adminLogout,
  };

  // Auto boot sequence
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
