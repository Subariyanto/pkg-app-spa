// auth.js - PIN Lock untuk PKG App SPA
// Strategi: PIN 4-6 digit di-hash SHA-256, simpan di localStorage.
// Unlock state di sessionStorage (per tab/sesi browser).
// Tidak ada recovery PIN; lupa PIN = reset semua data.

(function () {
  'use strict';

  const KEY_PIN_HASH = 'pkg_v1_pin_hash';
  const KEY_PIN_SALT = 'pkg_v1_pin_salt';
  const KEY_UNLOCKED = 'pkg_v1_unlocked';

  async function sha256(text) {
    const buf = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  function randomSalt() {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  }

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

  // Lock screen: full-page overlay
  function renderLockScreen() {
    let overlay = document.getElementById('pkg-lock-overlay');
    if (overlay) return; // already shown
    overlay = document.createElement('div');
    overlay.id = 'pkg-lock-overlay';
    overlay.innerHTML = `
      <style>
        #pkg-lock-overlay {
          position: fixed; inset: 0; z-index: 3000;
          background: linear-gradient(135deg, #047a3a 0%, #06a04c 100%);
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
          font-size: 3rem; color: #047a3a;
          width: 80px; height: 80px; line-height: 80px;
          margin: 0 auto 1rem;
          background: #d6efd9; border-radius: 50%;
        }
        #pkg-lock-card h2 { margin: 0 0 .25rem; color: #047a3a; font-size: 1.4rem; }
        #pkg-lock-card .subtitle { color: #666; font-size: .9rem; margin-bottom: 1.5rem; }
        #pkg-lock-card input {
          width: 100%; font-size: 1.6rem; text-align: center; letter-spacing: .8rem;
          padding: .6rem; border: 2px solid #d6efd9; border-radius: 8px;
          margin-bottom: 1rem; outline: none;
        }
        #pkg-lock-card input:focus { border-color: #047a3a; }
        #pkg-lock-card button.btn-primary {
          width: 100%; background: #047a3a; color: white; border: 0;
          padding: .65rem; border-radius: 8px; font-weight: 600; cursor: pointer;
          font-size: 1rem;
        }
        #pkg-lock-card button.btn-primary:hover { background: #035a2a; }
        #pkg-lock-card .err { color: #c0392b; font-size: .85rem; min-height: 1.2rem; margin-bottom: .5rem; }
        #pkg-lock-card .footer-link { margin-top: 1rem; font-size: .85rem; }
        #pkg-lock-card .footer-link a { color: #047a3a; text-decoration: none; cursor: pointer; }
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
        'Tidak ada cara recovery PIN. Pilihan satu-satunya adalah RESET semua data dan PIN.\n\n' +
        'PASTIKAN sudah backup data terlebih dahulu (export JSON dari menu Backup).\n\n' +
        'Lanjutkan reset?'
      );
      if (!ok) return;
      const ok2 = confirm('Konfirmasi sekali lagi: HAPUS semua data PKG dan PIN dari browser ini?');
      if (!ok2) return;
      // Clear all PKG data
      const keys = Object.keys(localStorage).filter(k => k.startsWith('pkg_v1_'));
      for (const k of keys) localStorage.removeItem(k);
      sessionStorage.clear();
      alert('Semua data PKG dan PIN sudah dihapus dari browser ini. Halaman akan di-reload.');
      location.reload();
    });
  }

  function hideLockScreen() {
    const o = document.getElementById('pkg-lock-overlay');
    if (o) o.remove();
  }

  // First-run setup modal: prompt to set PIN
  // Returns Promise<boolean> - true if PIN set, false if user skipped
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
          #pkg-pin-setup-card h3 { margin: 0 0 .5rem; color: #047a3a; }
          #pkg-pin-setup-card .desc { color: #555; font-size: .9rem; margin-bottom: 1rem; }
          #pkg-pin-setup-card label { display: block; font-size: .85rem; font-weight: 600; margin-bottom: .25rem; color: #333; }
          #pkg-pin-setup-card input {
            width: 100%; font-size: 1.4rem; text-align: center; letter-spacing: .6rem;
            padding: .5rem; border: 2px solid #d6efd9; border-radius: 8px;
            margin-bottom: .9rem; outline: none;
          }
          #pkg-pin-setup-card input:focus { border-color: #047a3a; }
          #pkg-pin-setup-card .row-btn { display: flex; gap: .5rem; margin-top: .75rem; }
          #pkg-pin-setup-card button {
            flex: 1; padding: .55rem; border-radius: 8px; font-weight: 600; cursor: pointer; border: 0;
          }
          #pkg-pin-setup-card .btn-primary { background: #047a3a; color: white; }
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

  // Settings: ganti / hapus PIN. Returns view HTML.
  function viewPengaturanPIN(view) {
    const isSet = isPinSet();
    view.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h4 class="mb-0"><i class="bi bi-shield-lock"></i> Pengaturan PIN</h4>
    </div>
    <div class="row g-3">
      <div class="col-lg-6">
        <div class="card">
          <div class="card-header"><i class="bi bi-info-circle"></i> Status</div>
          <div class="card-body">
            <p class="mb-2"><strong>PIN aktif:</strong> ${isSet ? '<span class="text-success">Ya, PIN terpasang.</span>' : '<span class="text-muted">Belum diatur.</span>'}</p>
            <p class="small text-muted mb-0">${isSet
              ? 'Aplikasi akan terkunci saat dibuka di tab/sesi baru, atau saat Bapak klik tombol <strong>Logout</strong>.'
              : 'Aktifkan PIN untuk menambah lapisan keamanan kalau perangkat ini dipakai bersama orang lain.'}</p>
          </div>
        </div>
      </div>
      <div class="col-lg-6">
        <div class="card">
          <div class="card-header"><i class="bi bi-gear"></i> Aksi</div>
          <div class="card-body">
            ${isSet ? `
              <button id="btn-change-pin" class="btn btn-primary w-100 mb-2"><i class="bi bi-key"></i> Ganti PIN</button>
              <button id="btn-remove-pin" class="btn btn-outline-danger w-100"><i class="bi bi-shield-slash"></i> Hapus PIN</button>
            ` : `
              <button id="btn-set-pin" class="btn btn-success w-100"><i class="bi bi-shield-plus"></i> Aktifkan PIN</button>
            `}
          </div>
        </div>
      </div>
    </div>
    <div class="alert alert-warning mt-3 small">
      <i class="bi bi-exclamation-triangle"></i> <strong>Penting:</strong> Tidak ada cara recovery PIN.
      Kalau Bapak lupa PIN, satu-satunya pilihan adalah reset semua data PKG.
      Selalu lakukan <a href="#/backup-kabupaten">Backup</a> sebelum mengaktifkan PIN.
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
        const old = prompt('Masukkan PIN saat ini untuk verifikasi penghapusan:');
        if (!old) return;
        const ok = await verifyPin(old.trim());
        if (!ok) { alert('PIN salah.'); return; }
        if (!confirm('Hapus PIN? Aplikasi tidak akan terkunci lagi sampai PIN di-aktifkan ulang.')) return;
        clearPin();
        alert('PIN dihapus.');
        if (typeof window.render === 'function') window.render();
      });
    } else {
      document.getElementById('btn-set-pin').addEventListener('click', async () => {
        const ok = await promptInitialPinSetup();
        if (ok) {
          alert('PIN berhasil diaktifkan. Aplikasi akan terkunci di tab/sesi baru.');
          if (typeof window.render === 'function') window.render();
        }
      });
    }
  }

  // Inisialisasi: dipanggil di awal sebelum app render
  // Returns Promise yang resolve setelah app boleh dirender.
  async function init() {
    if (isPinSet() && !isUnlocked()) {
      renderLockScreen();
      // tunggu sampai unlocked
      return new Promise((resolve) => {
        const check = setInterval(() => {
          if (isUnlocked() || !isPinSet()) {
            clearInterval(check);
            resolve();
          }
        }, 200);
      });
    }
  }

  // Logout: lock + reload tampilan ke lock screen
  function logout() {
    if (!isPinSet()) {
      alert('PIN belum aktif. Aktifkan PIN dulu di menu Pengaturan PIN.');
      return;
    }
    lock();
    renderLockScreen();
  }

  // Expose
  window.PKGAuth = {
    setPin, verifyPin, isPinSet, clearPin,
    isUnlocked, unlock, lock,
    init, logout,
    renderLockScreen, hideLockScreen,
    promptInitialPinSetup,
    viewPengaturanPIN,
    escapeHtml,
  };

  // Auto-init pada DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
