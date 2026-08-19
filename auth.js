// auth.js - Sistem Aktivasi Aman, Registrasi Akun, Login, & PIN Lock untuk PKG App SPA
// V2 (2026-08-19): Server-authoritative activation via Supabase RPC.
// 1 kode = 1 aktivasi = 1 perangkat. Fail closed.
// Tidak ada lagi: ACTIVATION_SALT, ADMIN_MASTER_CODE, TRIAL_CODE, hardcoded admin,
// client-side code generation, checksum validation, best-effort activation.

(function () {
  'use strict';

  // --- CONSTANTS ---
  const KEY_PIN_HASH = 'pkg_v1_pin_hash';
  const KEY_PIN_SALT = 'pkg_v1_pin_salt';
  const KEY_UNLOCKED = 'pkg_v1_unlocked';

  // Activation & Account Keys
  const KEY_ACTIVATED = 'pkg_v1_activated';
  const KEY_ACTIVATION_CODE = 'pkg_v1_activation_code';
  const KEY_DEVICE_ID = 'pkg_v1_device_id';
  const KEY_DEVICE_BINDING = 'pkg_v1_device_binding';

  const KEY_USER_ROLE = 'pkg_v1_user_role'; // admin | pengawas | kamad
  const KEY_USER_USERNAME = 'pkg_v1_user_username';
  const KEY_USER_PASSWORD_HASH = 'pkg_v1_user_password_hash';
  const KEY_USER_FULLNAME = 'pkg_v1_user_fullname';
  const KEY_USER_MADRASAH = 'pkg_v1_user_madrasah';
  const KEY_USER_KABUPATEN = 'pkg_v1_user_kabupaten';

  const KEY_LOGGED_IN = 'pkg_v1_logged_in'; // sessionStorage

  // --- CRYPTO UTILS ---
  async function sha256(text) {
    if (window.crypto && window.crypto.subtle) {
      const buf = new TextEncoder().encode(text);
      const hash = await crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
    return fnv1aHash(text);
  }

  function fnv1aHash(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    let h2 = 0x811c9dc5;
    const s2 = (h >>> 0).toString(16).padStart(8, '0') + str;
    for (let i = 0; i < s2.length; i++) {
      h2 ^= s2.charCodeAt(i);
      h2 = Math.imul(h2, 0x01000193);
    }
    return (h >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
  }

  function randomSalt() {
    if (window.crypto && window.crypto.getRandomValues) {
      const arr = new Uint8Array(16);
      crypto.getRandomValues(arr);
      return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    let s = '';
    for (let i = 0; i < 32; i++) {
      s += Math.floor(Math.random() * 16).toString(16);
    }
    return s;
  }

  // --- DEVICE ID (crypto.randomUUID) ---
  function getDeviceId() {
    let id = localStorage.getItem(KEY_DEVICE_ID);
    if (!id) {
      if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        id = 'DEV-' + crypto.randomUUID();
      } else {
        id = 'DEV-' + randomSalt();
      }
      localStorage.setItem(KEY_DEVICE_ID, id);
    }
    return id;
  }

  // --- PIN LOCK LOGIC ---
  async function setPin(pin) {
    if (!/^\d{4,6}$/.test(pin)) throw new Error('PIN harus 4-6 digit angka');
    const salt = randomSalt();
    const hash = await sha256(salt + ':' + pin);
    localStorage.setItem(KEY_PIN_SALT, salt);
    localStorage.setItem(KEY_PIN_HASH, hash);
    sessionStorage.setItem(KEY_UNLOCKED, '1');
  }

  async function verifyPin(pin) {
    const salt = localStorage.getItem(KEY_PIN_SALT);
    const stored = localStorage.getItem(KEY_PIN_HASH);
    if (!salt || !stored) return false;
    const hash = await sha256(salt + ':' + pin);
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
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  // --- AUTH STATUS CHECKS ---
  function isActivated() {
    const activated = localStorage.getItem(KEY_ACTIVATED) === 'true';
    if (!activated) return false;

    // Verifikasi Device Binding (mencegah copy data ke device lain)
    const code = localStorage.getItem(KEY_ACTIVATION_CODE);
    const devId = getDeviceId();
    const binding = localStorage.getItem(KEY_DEVICE_BINDING);
    const expectedBinding = fnv1aHash(devId + ':' + code);

    return binding === expectedBinding;
  }

  function isLoggedIn() {
    return sessionStorage.getItem(KEY_LOGGED_IN) === 'true';
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

  // --- VIEWS & RENDER OVERLAYS ---

  // 1. Screen Registrasi & Aktivasi (Server-Authoritative, Fail Closed)
  function renderActivationScreen() {
    let overlay = document.getElementById('pkg-auth-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'pkg-auth-overlay';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <style>
        #pkg-auth-overlay {
          position: fixed; inset: 0; z-index: 3000;
          background: linear-gradient(135deg, #1e40af 0%, #1f5d3a 100%);
          display: flex; align-items: center; justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding: 1rem; overflow-y: auto;
        }
        .auth-card {
          background: #fff; border-radius: 12px; padding: 2rem;
          width: 100%; max-width: 480px;
          box-shadow: 0 12px 40px rgba(0,0,0,.25);
        }
        .auth-logo {
          text-align: center; margin-bottom: 1.5rem;
        }
        .auth-logo i { font-size: 3rem; color: #1f5d3a; }
        .auth-logo h2 { margin: 0.5rem 0 0; color: #1f5d3a; font-size: 1.5rem; font-weight: bold; }
        .auth-logo p { margin: 0; color: #666; font-size: 0.85rem; }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.25rem; color: #333; }
        .form-group input, .form-group select {
          width: 100%; padding: 0.6rem; border: 2px solid #ddd; border-radius: 8px; outline: none; font-size: 0.95rem;
        }
        .form-group input:focus, .form-group select:focus { border-color: #1f5d3a; }
        .btn-auth-submit {
          width: 100%; background: #1f5d3a; color: white; border: 0;
          padding: 0.75rem; border-radius: 8px; font-weight: 600; cursor: pointer;
          font-size: 1rem; margin-top: 1rem; transition: background 0.2s;
        }
        .btn-auth-submit:hover { background: #143e26; }
        .btn-auth-submit:disabled { background: #999; cursor: not-allowed; }
        .auth-err { color: #c0392b; font-size: 0.85rem; min-height: 1.2rem; margin-bottom: 0.5rem; text-align: center; }
        .auth-info { color: #1e40af; font-size: 0.85rem; min-height: 1.2rem; margin-bottom: 0.5rem; text-align: center; }
        .device-info-text { font-size: 0.75rem; color: #888; text-align: center; margin-top: 1rem; }
      </style>
      <div class="auth-card">
        <div class="auth-logo">
          <i class="bi bi-shield-check"></i>
          <h2>Aktivasi & Registrasi Akun</h2>
          <p>PKG Pokjawasmad Kab. Jember (KMA 1503)</p>
        </div>
        <div class="auth-err" id="auth-reg-err"></div>
        <div class="auth-info" id="auth-reg-info"></div>

        <div class="form-group">
          <label>Kode Aktivasi (PKG-XXXX-XXXX-XXXX-XXXX)</label>
          <input id="reg-code" type="text" placeholder="Masukkan kode dari Admin/Ketua Pokjawas" autocomplete="off" style="text-transform: uppercase;">
        </div>

        <div class="form-group">
          <label>Pilihan Peran (Role)</label>
          <select id="reg-role">
            <option value="pengawas">Pengawas - Pembina</option>
            <option value="kamad">Kepala Madrasah (Kamad) - Penilai</option>
          </select>
        </div>

        <div class="form-group">
          <label>Nama Pengguna (Username untuk login)</label>
          <input id="reg-username" type="text" placeholder="Contoh: kamad_sukowono" autocomplete="off" minlength="4">
        </div>

        <div class="form-group">
          <label>Nama Lengkap</label>
          <input id="reg-fullname" type="text" placeholder="Nama Lengkap beserta gelar" autocomplete="off">
        </div>

        <div class="form-group" id="group-madrasah">
          <label>Nama Madrasah</label>
          <input id="reg-madrasah" type="text" placeholder="Contoh: MTs Negeri 1 Jember" autocomplete="off">
        </div>

        <div class="form-group">
          <label>Kabupaten/Kota Asal</label>
          <input id="reg-kabupaten" type="text" placeholder="Contoh: Kabupaten Jember" autocomplete="address-level2">
        </div>

        <div class="form-group">
          <label>Password</label>
          <input id="reg-password" type="password" placeholder="Minimal 6 karakter" autocomplete="off">
        </div>

        <div class="form-group">
          <label>Konfirmasi Password</label>
          <input id="reg-confirm" type="password" placeholder="Ulangi password" autocomplete="off">
        </div>

        <button class="btn-auth-submit" id="btn-reg-submit">Aktifkan & Daftar Akun</button>

        <div class="device-info-text">
          Device ID: ${getDeviceId()}<br>
          Satu Kode Aktivasi hanya berlaku untuk satu perangkat browser ini.<br>
          <strong>Aktivasi memerlukan koneksi internet.</strong>
        </div>

        <div style="text-align:center; margin-top:1rem; font-size:.85rem;">
          <a id="link-to-login" style="color:#1f5d3a; cursor:pointer; text-decoration:none; font-weight:600;">Sudah Memiliki Akun? Login di sini</a>
        </div>
      </div>
    `;

    const roleSel = document.getElementById('reg-role');
    const linkLogin = document.getElementById('link-to-login');
    if (linkLogin) {
      linkLogin.addEventListener('click', () => {
        const oldOverlay = document.getElementById('pkg-auth-overlay');
        if (oldOverlay) oldOverlay.remove();
        renderLoginScreen();
      });
    }

    const groupMadrasah = document.getElementById('group-madrasah');
    if (roleSel && groupMadrasah) {
      roleSel.addEventListener('change', () => {
        groupMadrasah.style.display = roleSel.value === 'pengawas' ? 'none' : 'block';
      });
    }

    // === REGISTRASI DENGAN SERVER-AUTHORITATIVE ACTIVATION ===
    document.getElementById('btn-reg-submit').addEventListener('click', async () => {
      const errEl = document.getElementById('auth-reg-err');
      const infoEl = document.getElementById('auth-reg-info');
      const btn = document.getElementById('btn-reg-submit');
      const code = document.getElementById('reg-code').value.trim().toUpperCase();
      const role = document.getElementById('reg-role').value;
      const username = document.getElementById('reg-username').value.trim().toLowerCase();
      const fullname = document.getElementById('reg-fullname').value.trim();
      const madrasah = document.getElementById('reg-madrasah').value.trim();
      const kabupaten = document.getElementById('reg-kabupaten').value.trim();
      const password = document.getElementById('reg-password').value;
      const confirm = document.getElementById('reg-confirm').value;

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

      // === SERVER-AUTHORITATIVE ACTIVATION (FAIL CLOSED) ===
      btn.disabled = true;
      btn.textContent = 'Memverifikasi ke server...';
      infoEl.textContent = 'Menghubungi server aktivasi...';

      const devId = getDeviceId();
      const result = await window.SupabaseSync.activateCode({
        code: code,
        device_id: devId,
        nama_pengguna: fullname,
        username: username,
        madrasah: madrasah || null,
        kabupaten: kabupaten,
        role: role,
        device_info: navigator.userAgent || ''
      });

      if (!result.ok) {
        // FAIL CLOSED: tidak simpan aktivasi lokal
        btn.disabled = false;
        btn.textContent = 'Aktifkan & Daftar Akun';
        errEl.textContent = result.message || 'Aktivasi gagal.';
        return;
      }

      // === SERVER KONFIRMASI ACTIVATED → simpan aktivasi lokal ===
      const binding = fnv1aHash(devId + ':' + code);
      const passHash = fnv1aHash(password);

      localStorage.setItem(KEY_ACTIVATED, 'true');
      localStorage.setItem(KEY_ACTIVATION_CODE, code);
      localStorage.setItem(KEY_DEVICE_BINDING, binding);
      localStorage.setItem(KEY_USER_ROLE, role);
      localStorage.setItem(KEY_USER_USERNAME, username);
      localStorage.setItem(KEY_USER_PASSWORD_HASH, passHash);
      localStorage.setItem(KEY_USER_FULLNAME, fullname);
      localStorage.setItem(KEY_USER_MADRASAH, madrasah);
      localStorage.setItem(KEY_USER_KABUPATEN, kabupaten);

      alert('Aktivasi berhasil! Silakan login menggunakan akun yang baru saja dibuat.');
      location.hash = '#/';
      location.reload();
    });
  }

  // 2. Screen Login Akun (Username + Password)
  function renderLoginScreen() {
    let overlay = document.getElementById('pkg-auth-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'pkg-auth-overlay';
      document.body.appendChild(overlay);
    }

    const regName = localStorage.getItem(KEY_USER_FULLNAME) || '';
    const regMad = localStorage.getItem(KEY_USER_MADRASAH) || '';

    overlay.innerHTML = `
      <style>
        #pkg-auth-overlay {
          position: fixed; inset: 0; z-index: 3000;
          background: linear-gradient(135deg, #1f5d3a 0%, #1e40af 100%);
          display: flex; align-items: center; justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding: 1rem;
        }
        .auth-card {
          background: #fff; border-radius: 12px; padding: 2rem;
          width: 100%; max-width: 400px;
          box-shadow: 0 12px 40px rgba(0,0,0,.25);
        }
        .auth-logo {
          text-align: center; margin-bottom: 1.5rem;
        }
        .auth-logo i { font-size: 3rem; color: #1e40af; }
        .auth-logo h2 { margin: 0.5rem 0 0; color: #1e40af; font-size: 1.5rem; font-weight: bold; }
        .auth-logo p { margin: 0; color: #666; font-size: 0.85rem; }
        .form-group { margin-bottom: 1.25rem; }
        .form-group label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.25rem; color: #333; }
        .form-group input {
          width: 100%; padding: 0.65rem; border: 2px solid #ddd; border-radius: 8px; outline: none; font-size: 1rem;
        }
        .form-group input:focus { border-color: #1e40af; }
        .btn-auth-submit {
          width: 100%; background: #1e40af; color: white; border: 0;
          padding: 0.75rem; border-radius: 8px; font-weight: 600; cursor: pointer;
          font-size: 1rem; transition: background 0.2s;
        }
        .btn-auth-submit:hover { background: #17328c; }
        .auth-err { color: #c0392b; font-size: 0.85rem; min-height: 1.2rem; margin-bottom: 0.5rem; text-align: center; }
        .user-reg-info {
          font-size: 0.8rem; background: #f0f4ff; color: #1e40af; padding: 0.5rem; border-radius: 6px; margin-bottom: 1rem; text-align: center;
        }
      </style>
      <div class="auth-card">
        <div class="auth-logo">
          <i class="bi bi-person-lock"></i>
          <h2>Masuk Aplikasi</h2>
          <p>PKG Pokjawasmad Kab. Jember</p>
        </div>
        <div class="user-reg-info">
          Terdaftar: <strong>${escapeHtml(regName)}</strong> (${escapeHtml(regMad)})
        </div>
        <div class="auth-err" id="auth-login-err"></div>

        <div class="form-group">
          <label>Nama Pengguna (Username)</label>
          <input id="login-username" type="text" placeholder="Masukkan username" autocomplete="off" required>
        </div>

        <div class="form-group">
          <label>Password</label>
          <input id="login-password" type="password" placeholder="Masukkan password" autocomplete="off" required>
        </div>

        <button class="btn-auth-submit" id="btn-login-submit">Login Masuk</button>

        <div style="text-align:center; margin-top:1.25rem; font-size:.85rem;">
          <a id="link-to-aktivasi" style="color:#1e40af; cursor:pointer; text-decoration:none;">Buat Akun Baru / Reset Aktivasi</a>
        </div>
      </div>
    `;

    const inputUser = document.getElementById('login-username');
    const inputPass = document.getElementById('login-password');
    const errEl = document.getElementById('auth-login-err');

    setTimeout(() => inputUser.focus(), 50);

    function tryLogin() {
      const username = inputUser.value.trim().toLowerCase();
      const password = inputPass.value;

      if (!username || !password) {
        errEl.textContent = 'Harap isi semua kolom login!';
        return;
      }

      const storedUser = localStorage.getItem(KEY_USER_USERNAME);
      const storedPassHash = localStorage.getItem(KEY_USER_PASSWORD_HASH);

      // Cek kredensial lokal (tidak ada lagi hardcoded admin)
      if (username !== storedUser || fnv1aHash(password) !== storedPassHash) {
        errEl.textContent = 'Username atau Password salah!';
        return;
      }

      // Set logged in
      sessionStorage.setItem(KEY_LOGGED_IN, 'true');
      location.hash = '#/';
      overlay.remove();
      init().then(() => { if (window.rebuildShell) window.rebuildShell(); if (window.render) window.render(); });
    }

    document.getElementById('btn-login-submit').addEventListener('click', tryLogin);
    inputPass.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); tryLogin(); }
    });

    const linkAktivasi = document.getElementById('link-to-aktivasi');
    if (linkAktivasi) {
      linkAktivasi.addEventListener('click', () => {
        if (!confirm('Pindah ke halaman Aktivasi?\n\nJika Anda membuat akun baru, data akun lama di browser ini akan ditimpa.')) return;
        sessionStorage.removeItem(KEY_LOGGED_IN);
        const oldOverlay = document.getElementById('pkg-auth-overlay');
        if (oldOverlay) oldOverlay.remove();
        renderActivationScreen();
      });
    }
  }

  // 3. Lock screen: full-page overlay untuk PIN
  function renderLockScreen() {
    let overlay = document.getElementById('pkg-lock-overlay');
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.id = 'pkg-lock-overlay';
    overlay.innerHTML = `
      <style>
        #pkg-lock-overlay {
          position: fixed; inset: 0; z-index: 3000;
          background: linear-gradient(135deg, #1f5d3a 0%, #06a04c 100%);
          display: flex; align-items: center; justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        #pkg-lock-card {
          background: #fff; border-radius: 12px; padding: 2rem;
          width: 90%; max-width: 360px;
          box-shadow: 0 12px 40px rgba(0,0,0,.25);
          text-align: center;
        }
        #pkg-lock-card .lock-icon {
          font-size: 3rem; color: #1f5d3a;
          width: 80px; height: 80px; line-height: 80px;
          margin: 0 auto 1rem;
          background: #d6efd9; border-radius: 50%;
        }
        #pkg-lock-card h2 { margin: 0 0 .25rem; color: #1f5d3a; font-size: 1.4rem; }
        #pkg-lock-card .subtitle { color: #666; font-size: .9rem; margin-bottom: 1.5rem; }
        #pkg-lock-card input {
          width: 100%; font-size: 1.6rem; text-align: center; letter-spacing: .8rem;
          padding: .6rem; border: 2px solid #d6efd9; border-radius: 8px;
          margin-bottom: 1rem; outline: none;
        }
        #pkg-lock-card input:focus { border-color: #1f5d3a; }
        #pkg-lock-card button.btn-primary {
          width: 100%; background: #1f5d3a; color: white; border: 0;
          padding: .65rem; border-radius: 8px; font-weight: 600; cursor: pointer;
          font-size: 1rem;
        }
        #pkg-lock-card button.btn-primary:hover { background: #143e26; }
        #pkg-lock-card .err { color: #c0392b; font-size: .85rem; min-height: 1.2rem; margin-bottom: .5rem; }
        #pkg-lock-card .footer-link { margin-top: 1rem; font-size: .85rem; }
        #pkg-lock-card .footer-link a { color: #1f5d3a; text-decoration: none; cursor: pointer; }
        #pkg-lock-card .footer-link a:hover { text-decoration: underline; }
      </style>
      <div id="pkg-lock-card">
        <div class="lock-icon"><i class="bi bi-shield-lock"></i></div>
        <h2>Aplikasi Terkunci</h2>
        <div class="subtitle">Masukkan PIN untuk melanjutkan</div>
        <input id="pkg-pin-input" type="password" inputmode="numeric" pattern="\\d*"
               maxlength="6" autocomplete="off" placeholder="\u2022\u2022\u2022\u2022">
        <div class="err" id="pkg-pin-err"></div>
        <button class="btn-primary" id="pkg-pin-submit">Buka Aplikasi</button>
        <div class="footer-link">
          <a id="pkg-pin-forgot">Lupa PIN?</a>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const input = document.getElementById('pkg-pin-input');
    const submit = document.getElementById('pkg-pin-submit');
    const err = document.getElementById('pkg-pin-err');
    const forgot = document.getElementById('pkg-pin-forgot');

    setTimeout(() => input.focus(), 50);

    async function tryUnlock() {
      const pin = input.value.trim();
      if (!pin) { err.textContent = 'Masukkan PIN terlebih dahulu.'; return; }
      submit.disabled = true;
      const ok = await verifyPin(pin);
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
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); tryUnlock(); }
    });
    forgot.addEventListener('click', () => {
      const ok = confirm(
        'Tidak ada cara recovery PIN. Pilihan satu-satunya adalah RESET semua data, registrasi akun, dan PIN.\n\n' +
        'PASTIKAN sudah backup data terlebih dahulu.\n\n' +
        'Lanjutkan reset?'
      );
      if (!ok) return;
      const ok2 = confirm('Konfirmasi sekali lagi: HAPUS semua data PKG dan PIN dari browser ini?');
      if (!ok2) return;

      const keys = Object.keys(localStorage).filter(k => k.startsWith('pkg_v1_'));
      for (const k of keys) localStorage.removeItem(k);
      sessionStorage.clear();
      alert('Semua data PKG dan PIN sudah dihapus. Halaman akan di-reload.');
      location.reload();
    });
  }

  function hideLockScreen() {
    const o = document.getElementById('pkg-lock-overlay');
    if (o) o.remove();
  }

  // 4. Initial PIN setup
  function promptInitialPinSetup() {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.id = 'pkg-pin-setup-overlay';
      overlay.innerHTML = `
        <style>
          #pkg-pin-setup-overlay {
            position: fixed; inset: 0; z-index: 3000;
            background: rgba(0,0,0,.5);
            display: flex; align-items: center; justify-content: center;
          }
          #pkg-pin-setup-card {
            background: #fff; border-radius: 12px; padding: 1.75rem;
            width: 92%; max-width: 420px;
            box-shadow: 0 12px 40px rgba(0,0,0,.25);
          }
          #pkg-pin-setup-card h3 { margin: 0 0 .5rem; color: #1f5d3a; }
          #pkg-pin-setup-card .desc { color: #555; font-size: .9rem; margin-bottom: 1rem; }
          #pkg-pin-setup-card label { display: block; font-size: .85rem; font-weight: 600; margin-bottom: .25rem; color: #333; }
          #pkg-pin-setup-card input {
            width: 100%; font-size: 1.4rem; text-align: center; letter-spacing: .6rem;
            padding: .5rem; border: 2px solid #d6efd9; border-radius: 8px;
            margin-bottom: .9rem; outline: none;
          }
          #pkg-pin-setup-card input:focus { border-color: #1f5d3a; }
          #pkg-pin-setup-card .row-btn { display: flex; gap: .5rem; margin-top: .75rem; }
          #pkg-pin-setup-card button {
            flex: 1; padding: .55rem; border-radius: 8px; font-weight: 600; cursor: pointer; border: 0;
          }
          #pkg-pin-setup-card .btn-primary { background: #1f5d3a; color: white; }
          #pkg-pin-setup-card .btn-secondary { background: #e9ecef; color: #333; }
          #pkg-pin-setup-card .err { color: #c0392b; font-size: .85rem; min-height: 1.1rem; }
        </style>
        <div id="pkg-pin-setup-card">
          <h3><i class="bi bi-shield-lock"></i> Atur PIN Aplikasi</h3>
          <div class="desc">Lindungi data PKG dengan PIN 4-6 digit. PIN akan diminta setiap kali aplikasi dibuka.</div>
          <label>PIN baru (4-6 digit)</label>
          <input id="pkg-pin-new" type="password" inputmode="numeric" pattern="\\d*" maxlength="6" placeholder="\u2022\u2022\u2022\u2022">
          <label>Konfirmasi PIN</label>
          <input id="pkg-pin-confirm" type="password" inputmode="numeric" pattern="\\d*" maxlength="6" placeholder="\u2022\u2022\u2022\u2022">
          <div class="err" id="pkg-pin-setup-err"></div>
          <div class="row-btn">
            <button class="btn-secondary" id="pkg-pin-skip">Nanti Saja</button>
            <button class="btn-primary" id="pkg-pin-save">Simpan PIN</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      const newInput = document.getElementById('pkg-pin-new');
      const confirmInput = document.getElementById('pkg-pin-confirm');
      const err = document.getElementById('pkg-pin-setup-err');
      const skipBtn = document.getElementById('pkg-pin-skip');
      const saveBtn = document.getElementById('pkg-pin-save');

      setTimeout(() => newInput.focus(), 50);

      function close(result) {
        overlay.remove();
        resolve(result);
      }

      saveBtn.addEventListener('click', async () => {
        const a = newInput.value.trim();
        const b = confirmInput.value.trim();
        if (!/^\d{4,6}$/.test(a)) { err.textContent = 'PIN harus 4-6 digit angka.'; return; }
        if (a !== b) { err.textContent = 'Konfirmasi PIN tidak cocok.'; return; }
        try {
          await setPin(a);
          close(true);
        } catch (e) {
          err.textContent = e.message || 'Gagal menyimpan PIN.';
        }
      });
      skipBtn.addEventListener('click', () => close(false));
      [newInput, confirmInput].forEach(el => {
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); saveBtn.click(); }
        });
      });
    });
  }

  // Settings view for PIN
  function viewPengaturanPIN(view) {
    const isSet = isPinSet();
    const info = getUserInfo();
    view.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h4 class="mb-0"><i class="bi bi-shield-lock"></i> Pengaturan Akun & PIN</h4>
    </div>
    <div class="row g-3">
      <div class="col-lg-6">
        <div class="card h-100">
          <div class="card-header"><i class="bi bi-person-badge"></i> Profil Pengguna</div>
          <div class="card-body">
            <table class="table table-sm table-borderless">
              <tr><td><strong>Nama Lengkap:</strong></td><td>${escapeHtml(info.fullname)}</td></tr>
              <tr><td><strong>Peran (Role):</strong></td><td><span class="badge bg-primary text-uppercase">${escapeHtml(info.role)}</span></td></tr>
              <tr><td><strong>Madrasah:</strong></td><td>${escapeHtml(info.madrasah)}</td></tr>
              <tr><td><strong>Kabupaten:</strong></td><td>${escapeHtml(info.kabupaten)}</td></tr>
              <tr><td><strong>Device ID:</strong></td><td><code class="small">${escapeHtml(info.deviceId)}</code></td></tr>
            </table>
          </div>
        </div>
      </div>
      <div class="col-lg-6">
        <div class="card h-100">
          <div class="card-header"><i class="bi bi-gear"></i> Keamanan PIN</div>
          <div class="card-body">
            <p class="mb-2"><strong>PIN aktif:</strong> ${isSet ? '<span class="text-success">Ya, PIN terpasang.</span>' : '<span class="text-muted">Belum diatur.</span>'}</p>
            <p class="small text-muted mb-3">${isSet
              ? 'Aplikasi terkunci saat dibuka di tab baru.'
              : 'Aktifkan PIN untuk pengamanan ekstra.'}</p>
            ${isSet ? `
              <button id="btn-change-pin" class="btn btn-sm btn-primary w-100 mb-2"><i class="bi bi-key"></i> Ganti PIN</button>
              <button id="btn-remove-pin" class="btn btn-sm btn-outline-danger w-100"><i class="bi bi-shield-slash"></i> Hapus PIN</button>
            ` : `
              <button id="btn-set-pin" class="btn btn-sm btn-success w-100"><i class="bi bi-shield-plus"></i> Aktifkan PIN</button>
            `}
          </div>
        </div>
      </div>
    </div>
    <div class="alert alert-warning mt-3 small">
      <i class="bi bi-exclamation-triangle"></i> <strong>Penting:</strong> Tidak ada cara recovery PIN.
      Jika lupa PIN, harus reset data. Selalu lakukan backup berkala.
    </div>`;

    if (isSet) {
      document.getElementById('btn-change-pin').addEventListener('click', async () => {
        const old = prompt('Masukkan PIN saat ini untuk verifikasi:');
        if (!old) return;
        const ok = await verifyPin(old.trim());
        if (!ok) { alert('PIN saat ini salah.'); return; }
        const ok2 = await promptInitialPinSetup();
        if (ok2) alert('PIN berhasil diganti.');
      });
      document.getElementById('btn-remove-pin').addEventListener('click', async () => {
        const old = prompt('Masukkan PIN saat ini untuk verifikasi:');
        if (!old) return;
        const ok = await verifyPin(old.trim());
        if (!ok) { alert('PIN salah.'); return; }
        if (!confirm('Hapus PIN?')) return;
        clearPin();
        alert('PIN dihapus.');
        if (typeof window.render === 'function') window.render();
      });
    } else {
      document.getElementById('btn-set-pin').addEventListener('click', async () => {
        const ok = await promptInitialPinSetup();
        if (ok) {
          alert('PIN berhasil diaktifkan.');
          if (typeof window.render === 'function') window.render();
        }
      });
    }
  }

  // --- INITIALIZATION ---
  async function init() {
    // 0. Kalau diminta ke halaman aktivasi (dari link 'Buat Akun Baru')
    const forceActivation = localStorage.getItem('pkg_v1_force_activation') === 'true';
    if (forceActivation) {
      localStorage.removeItem('pkg_v1_force_activation');
      renderActivationScreen();
      return new Promise(() => {});
    }

    // 0b. Kalau sudah punya akun terdaftar tapi belum aktivasi di device ini → langsung ke login
    const hasAccount = localStorage.getItem(KEY_USER_USERNAME);
    const skipActivation = localStorage.getItem('pkg_v1_skip_activation') === 'true';
    if (skipActivation || hasAccount) {
      localStorage.removeItem('pkg_v1_skip_activation');
      if (!isLoggedIn()) {
        renderLoginScreen();
        return new Promise(() => {});
      }
    }

    // 1. Cek Aktivasi
    if (!isActivated()) {
      renderActivationScreen();
      return new Promise(() => {}); // Gated forever
    }

    // 2. Cek Login
    if (!isLoggedIn()) {
      renderLoginScreen();
      return new Promise(() => {}); // Gated forever
    }

    // 3. Cek PIN Lock
    if (isPinSet() && !isUnlocked()) {
      renderLockScreen();
      return new Promise((resolve) => {
        const check = setInterval(() => {
          if (isUnlocked() || !isPinSet()) {
            clearInterval(check);
            resolve();
          }
        }, 200);
      });
    }

    // Lolos semua gate
    const overlay = document.getElementById('pkg-auth-overlay');
    if (overlay) overlay.remove();
  }

  function logout() {
    sessionStorage.removeItem(KEY_LOGGED_IN);
    lock();
    location.reload();
  }

  // Expose ke global
  window.PKGAuth = {
    setPin, verifyPin, isPinSet, clearPin,
    isUnlocked, unlock, lock,
    init, logout,
    isActivated, isLoggedIn, getUserInfo,
    viewPengaturanPIN,
    escapeHtml,
    getDeviceId,
  };

  // Auto boot sequence
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
