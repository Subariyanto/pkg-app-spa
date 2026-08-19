// github_sync.js — NEUTRALIZED (v2 activation security)
//
// Per spec section 13: github_sync.js TIDAK boleh lagi menjadi sumber otoritatif
// activation code. codes.json tidak digunakan sebagai daftar kode aktivasi.
// GitHub PAT tidak diperlukan oleh user.
//
// File ini dipertahankan agar tidak merusak referensi di file lain,
// tetapi semua fungsi aktivasi code sync dinonaktifkan (no-op / return kosong).
// Sumber kebenaran kode aktivasi: Supabase RPC (lihat supabase_sync.js).

(function () {
  'use strict';

  // Legacy constants — tidak digunakan lagi untuk aktivasi
  var REPO_OWNER = 'Subariyanto';
  var REPO_NAME = 'pkg-app-spa';
  var REPO_BRANCH = 'gh-pages';
  var CODES_PATH = 'data/codes.json';

  // PAT tidak lagi disimpan atau digunakan untuk distribusi kode aktivasi
  var PAT_KEY = 'pkg_v1_gh_pat_deprecated';

  function getPAT() {
    // DEPRECATED: tidak ada lagi PAT untuk aktivasi
    return '';
  }
  function setPAT() {
    // DEPRECATED: no-op
    console.warn('[GithubSync] PAT storage deprecated. Activation codes managed via Supabase RPC.');
  }
  function clearPAT() {
    // Clean up old PAT if exists
    localStorage.removeItem(PAT_KEY);
  }
  function hasPAT() {
    return false;
  }

  // readPublic — tidak digunakan lagi untuk validasi kode
  // Dipertahankan sebagai no-op agar tidak break caller lama
  async function readPublic() {
    // DEPRECATED: codes.json bukan source of truth lagi
    return null;
  }

  async function writeAuth() {
    // DEPRECATED: tidak ada lagi push codes.json
    throw new Error('GithubSync.writeAuth deprecated. Gunakan Supabase RPC untuk manajemen kode.');
  }

  async function testPAT() {
    return { ok: false, message: 'GitHub PAT deprecated. Kode aktivasi dikelola via Supabase RPC.' };
  }

  async function refreshFromPublic() {
    // DEPRECATED: tidak ada lagi remote codes fetch
    window.REMOTE_CODES = [];
    return null;
  }

  async function pushIfConfigured() {
    // DEPRECATED: no-op, return not-synced
    return { synced: false, reason: 'deprecated' };
  }

  function scheduleSync() {
    // DEPRECATED: no-op
  }

  // Export dengan interface yang sama agar tidak break referensi
  window.GithubSync = {
    REPO_OWNER: REPO_OWNER,
    REPO_NAME: REPO_NAME,
    REPO_BRANCH: REPO_BRANCH,
    CODES_PATH: CODES_PATH,
    getPAT: getPAT,
    setPAT: setPAT,
    clearPAT: clearPAT,
    hasPAT: hasPAT,
    readPublic: readPublic,
    writeAuth: writeAuth,
    testPAT: testPAT,
    refreshFromPublic: refreshFromPublic,
    pushIfConfigured: pushIfConfigured,
    scheduleSync: scheduleSync,
  };
})();
