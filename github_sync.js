// github_sync.js — sinkronisasi codes.json ke gh-pages via GitHub API.
// Setup sekali (PAT), lalu setiap admin generate/revoke kode otomatis push ke gh-pages.
// Public users fetch dari raw.githubusercontent.com → kode valid di device manapun.
(function () {
  'use strict';

  var REPO_OWNER = 'Subariyanto';
  var REPO_NAME = 'pkg-app-spa';
  var REPO_BRANCH = 'gh-pages';
  var CODES_PATH = 'data/codes.json';

  var PAT_KEY = 'pkg_v1_gh_pat';

  function getPAT() {
    return localStorage.getItem(PAT_KEY) || '';
  }
  function setPAT(pat) {
    localStorage.setItem(PAT_KEY, String(pat || '').trim());
  }
  function clearPAT() {
    localStorage.removeItem(PAT_KEY);
  }
  function hasPAT() {
    return !!getPAT();
  }

  // RAW URL — public, tidak butuh auth, cache-busted dengan timestamp.
  function rawUrl() {
    return 'https://raw.githubusercontent.com/' + REPO_OWNER + '/' + REPO_NAME + '/' + REPO_BRANCH + '/' + CODES_PATH + '?t=' + Date.now();
  }
  function apiUrl() {
    return 'https://api.github.com/repos/' + REPO_OWNER + '/' + REPO_NAME + '/contents/' + CODES_PATH;
  }

  // Fetch codes.json publik (tanpa auth). Return null kalau tidak ada / error.
  async function readPublic() {
    try {
      var r = await fetch(rawUrl(), { cache: 'no-store' });
      if (!r.ok) return null;
      var data = await r.json();
      if (!data || !Array.isArray(data.codes)) return null;
      return data;
    } catch (e) {
      console.warn('[GithubSync] readPublic failed:', e.message);
      return null;
    }
  }

  // Helper: fetch SHA + remote codes terbaru dari gh-pages.
  async function fetchCurrentSha(headers) {
    var r = await fetch(apiUrl() + '?ref=' + REPO_BRANCH + '&t=' + Date.now(), { headers: headers, cache: 'no-store' });
    if (r.ok) {
      var j = await r.json();
      var remoteCodes = null;
      try {
        if (j.content && j.encoding === 'base64') {
          var decoded = decodeURIComponent(escape(atob(j.content.replace(/\n/g, ''))));
          var parsed = JSON.parse(decoded);
          if (parsed && Array.isArray(parsed.codes)) remoteCodes = parsed.codes;
        }
      } catch (e) { /* ignore decode errors */ }
      return { sha: j.sha || null, remoteCodes: remoteCodes };
    } else if (r.status === 404) {
      return { sha: null, remoteCodes: null };
    } else if (r.status === 401 || r.status === 403) {
      throw new Error('PAT tidak valid atau tidak punya permission "Contents: write" di repo. Silakan generate PAT baru.');
    } else {
      throw new Error('GET ' + r.status + ' ' + (await r.text()));
    }
  }

  // Write codes.json via GitHub API. Butuh PAT.
  async function writeAuth(codesArray, message) {
    var pat = getPAT();
    if (!pat) throw new Error('GitHub PAT belum diset. Setup di Admin → Kode Aktivasi → Sinkronisasi.');
    var headers = {
      Authorization: 'token ' + pat,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };

    var sha = null;
    try {
      var cur = await fetchCurrentSha(headers);
      sha = cur.sha;
    } catch (e) {
      throw e;
    }

    var payload = {
      codes: codesArray,
      updatedAt: new Date().toISOString(),
    };
    var contentB64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload, null, 2))));
    function buildBody(currentSha) {
      var body = {
        message: message || 'sync codes.json ' + new Date().toISOString(),
        content: contentB64,
        branch: REPO_BRANCH,
      };
      if (currentSha) body.sha = currentSha;
      return JSON.stringify(body);
    }

    var r = await fetch(apiUrl(), { method: 'PUT', headers: headers, body: buildBody(sha) });
    if (r.status === 409) {
      console.warn('[GithubSync] 409 Conflict, refetching SHA + retry...');
      try {
        var cur2 = await fetchCurrentSha(headers);
        sha = cur2.sha;
      } catch (e) {
        throw new Error('Konflik: gagal ambil SHA terbaru saat retry. ' + e.message);
      }
      r = await fetch(apiUrl(), { method: 'PUT', headers: headers, body: buildBody(sha) });
    }
    if (!r.ok) {
      var txt = await r.text();
      if (r.status === 401) throw new Error('PAT salah atau expired.');
      if (r.status === 403) throw new Error('PAT tidak punya scope "Contents: write" di repo ini.');
      if (r.status === 409) throw new Error('Konflik berulang: kode di gh-pages terus diubah dari device lain. Refresh halaman lalu coba lagi.');
      throw new Error('PUT gagal: ' + r.status + ' ' + txt);
    }
    return await r.json();
  }

  // Test PAT — coba fetch repo info.
  async function testPAT() {
    var pat = getPAT();
    if (!pat) return { ok: false, message: 'PAT belum diset.' };
    try {
      var r = await fetch('https://api.github.com/repos/' + REPO_OWNER + '/' + REPO_NAME, {
        headers: { Authorization: 'token ' + pat, Accept: 'application/vnd.github.v3+json' },
      });
      if (r.status === 401) return { ok: false, message: 'PAT salah atau expired.' };
      if (r.status === 404) return { ok: false, message: 'Repo tidak ditemukan atau PAT tidak punya akses.' };
      if (!r.ok) return { ok: false, message: 'Status ' + r.status };
      var j = await r.json();
      return { ok: true, message: 'OK — repo: ' + j.full_name + ' (' + (j.private ? 'private' : 'public') + ')' };
    } catch (e) {
      return { ok: false, message: 'Network error: ' + e.message };
    }
  }

  // Boot-time: fetch codes.json publik, simpan di window.REMOTE_CODES.
  async function refreshFromPublic() {
    var data = await readPublic();
    if (data && Array.isArray(data.codes)) {
      window.REMOTE_CODES = data.codes;
      window.REMOTE_CODES_UPDATED_AT = data.updatedAt || null;
      console.log('[GithubSync] loaded', data.codes.length, 'remote codes (updated:', data.updatedAt + ')');
    } else {
      window.REMOTE_CODES = [];
    }
    return data;
  }

  // Push current local codes ke gh-pages (kalau PAT terkonfigurasi).
  async function pushIfConfigured(codesArray, message) {
    if (!hasPAT()) return { synced: false, reason: 'no-pat' };
    try {
      await writeAuth(codesArray, message);
      window.REMOTE_CODES = codesArray.slice();
      window.REMOTE_CODES_UPDATED_AT = new Date().toISOString();
      return { synced: true };
    } catch (e) {
      console.error('[GithubSync] push failed:', e.message);
      return { synced: false, reason: 'error', error: e.message };
    }
  }

  // Debounce + serialize sync.
  var _syncTimer = null;
  var _syncInFlight = null;
  var _syncQueued = false;
  function scheduleSync() {
    if (!hasPAT()) return;
    if (_syncTimer) clearTimeout(_syncTimer);
    _syncTimer = setTimeout(async function () {
      _syncTimer = null;
      var localCodes = window.PKGAuth ? window.PKGAuth.listActivationCodes() : [];
      var remoteCodes = (typeof window !== 'undefined' && Array.isArray(window.REMOTE_CODES)) ? window.REMOTE_CODES : [];
      if (localCodes.length === 0 && remoteCodes.length > 0) {
        console.warn('[GithubSync] auto-sync diblokir: local kosong tapi remote ada', remoteCodes.length, 'kode. Pakai tombol "Tarik dari gh-pages" dulu.');
        return;
      }
      if (_syncInFlight) { _syncQueued = true; return; }
      try {
        _syncInFlight = pushIfConfigured(localCodes, 'sync codes after admin op');
        await _syncInFlight;
      } finally {
        _syncInFlight = null;
        if (_syncQueued) { _syncQueued = false; scheduleSync(); }
      }
    }, 800);
  }

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
