// activation_device.js — Tahap 3: Device Identity & Cryptographic Key Management
//
// PRINSIP: 1 kode = 1 aktivasi = 1 perangkat = 1 device key
//
// Modul terpusat untuk:
// - Device ID management (crypto.randomUUID)
// - Web Crypto API key pair generation (ECDSA P-256)
// - IndexedDB private key storage (non-exportable)
// - Challenge-response signing
// - Activation local state management
// - Recovery detection (private key missing)
// - Periodic server verification (7-day interval)
// - Legacy device key enrollment (one-time migration)
//
// Private key: NEVER stored in localStorage, sessionStorage, or sent to server.
// Public key:  Sent to Supabase server during activation/enrollment.

(function () {
  'use strict';

  // === CONSTANTS ===
  var DB_NAME = 'pkg_device_security';
  var DB_VERSION = 1;
  var STORE_NAME = 'device_keys';
  var KEY_RECORD = 'primary_key';

  // localStorage keys
  var LS_ACTIVATION_ID = 'pkg_v1_activation_id';
  var LS_DEVICE_ID = 'pkg_v1_device_id';
  var LS_ACTIVATED = 'pkg_v1_activated';
  var LS_ACTIVATION_CODE = 'pkg_v1_activation_code';
  var LS_LAST_SERVER_VERIFY = 'pkg_v1_last_server_verify';
  var LS_DEVICE_KEY_ENROLLED = 'pkg_v1_device_key_enrolled';

  var VERIFY_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  // === STATE ===
  var _keyPair = null; // { privateKey: CryptoKey, publicKey: CryptoKey }
  var _publicKeyJwk = null; // exported public key as JWK for server

  // ====================================================================
  // INDEXEDDB — Private Key Storage
  // ====================================================================

  function openDB() {
    return new Promise(function (resolve, reject) {
      try {
        var req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = function (e) {
          var db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        };
        req.onsuccess = function (e) { resolve(e.target.result); };
        req.onerror = function (e) { reject(new Error('IndexedDB error: ' + e.target.error)); };
      } catch (e) {
        reject(new Error('IndexedDB not available: ' + e.message));
      }
    });
  }

  function storePrivateKey(cryptoKey) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_NAME, 'readwrite');
        var store = tx.objectStore(STORE_NAME);
        // Store the non-exportable CryptoKey object directly
        var req = store.put({ id: KEY_RECORD, privateKey: cryptoKey, created_at: Date.now() });
        req.onsuccess = function () { resolve(true); };
        req.onerror = function (e) { reject(new Error('Store error: ' + e.target.error)); };
      });
    });
  }

  function loadPrivateKey() {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_NAME, 'readonly');
        var store = tx.objectStore(STORE_NAME);
        var req = store.get(KEY_RECORD);
        req.onsuccess = function (e) {
          var result = e.target.result;
          if (result && result.privateKey) {
            resolve(result.privateKey);
          } else {
            resolve(null); // No key found
          }
        };
        req.onerror = function (e) { reject(new Error('Load error: ' + e.target.error)); };
      });
    });
  }

  function deletePrivateKey() {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_NAME, 'readwrite');
        var store = tx.objectStore(STORE_NAME);
        var req = store.delete(KEY_RECORD);
        req.onsuccess = function () { resolve(true); };
        req.onerror = function (e) { reject(new Error('Delete error: ' + e.target.error)); };
      });
    });
  }

  // ====================================================================
  // WEB CRYPTO — Key Pair Generation (ECDSA P-256)
  // ====================================================================

  async function generateKeyPair() {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error('Web Crypto API not available in this browser.');
    }

    var keyPair = await crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      false, // non-exportable
      ['sign', 'verify']
    );

    // Export public key as JWK for sending to server
    var publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);

    _keyPair = keyPair;
    _publicKeyJwk = publicJwk;

    // Store private key in IndexedDB (non-exportable CryptoKey)
    await storePrivateKey(keyPair.privateKey);

    return {
      privateKey: keyPair.privateKey,
      publicKey: keyPair.publicKey,
      publicJwk: publicJwk,
    };
  }

  // Load existing key from IndexedDB (on app startup)
  async function loadKeyPair() {
    if (_keyPair) return _keyPair;

    var privateKey = await loadPrivateKey();
    if (!privateKey) return null;

    // We have the private key but need to reconstruct the public key
    // Since the key is non-exportable, we can't re-derive public from private directly.
    // However, we stored the public key JWK in localStorage during activation.
    var publicJwkStr = localStorage.getItem('pkg_v1_public_key_jwk');
    var publicJwk = null;
    if (publicJwkStr) {
      try { publicJwk = JSON.parse(publicJwkStr); } catch (e) { publicJwk = null; }
    }

    // Import public key for verification capability
    var publicKey = null;
    if (publicJwk) {
      try {
        publicKey = await crypto.subtle.importKey(
          'jwk', publicJwk,
          { name: 'ECDSA', namedCurve: 'P-256' },
          false, ['verify']
        );
      } catch (e) { console.warn('[ActivationDevice] Failed to import public key:', e.message); }
    }

    _keyPair = { privateKey: privateKey, publicKey: publicKey };
    _publicKeyJwk = publicJwk;

    return _keyPair;
  }

  // ====================================================================
  // SIGN — Sign challenge with private key
  // ====================================================================

  async function signChallenge(challengeText) {
    var kp = await loadKeyPair();
    if (!kp || !kp.privateKey) {
      throw new Error('Private key not available. Device key enrollment may be needed.');
    }

    var data = new TextEncoder().encode(challengeText);
    var signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      kp.privateKey,
      data
    );

    // Convert ArrayBuffer to base64
    var bytes = new Uint8Array(signature);
    var binary = '';
    for (var i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // ====================================================================
  // VERIFY — Verify signature with public key (for admin UI)
  // ====================================================================

  async function verifySignature(challengeText, signatureBase64, publicJwk) {
    try {
      var publicKey = await crypto.subtle.importKey(
        'jwk', publicJwk,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false, ['verify']
      );

      // Decode base64 signature
      var binary = atob(signatureBase64);
      var bytes = new Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      var data = new TextEncoder().encode(challengeText);
      var isValid = await crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        publicKey,
        bytes.buffer,
        data
      );
      return isValid;
    } catch (e) {
      console.error('[ActivationDevice] Verify error:', e.message);
      return false;
    }
  }

  // ====================================================================
  // DEVICE ID
  // ====================================================================

  function getDeviceId() {
    var id = localStorage.getItem(LS_DEVICE_ID);
    if (!id) {
      if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        id = 'DEV-' + crypto.randomUUID();
      } else {
        // Fallback (very rare)
        id = 'DEV-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      }
      localStorage.setItem(LS_DEVICE_ID, id);
    }
    return id;
  }

  // ====================================================================
  // ACTIVATION STATE — Local persistence
  // ====================================================================

  function getActivationState() {
    return {
      activated: localStorage.getItem(LS_ACTIVATED) === 'true',
      activationId: localStorage.getItem(LS_ACTIVATION_ID) || null,
      deviceId: getDeviceId(),
      activationCode: null, // Don't store plaintext code anymore (Tahap 3 security)
      lastServerVerify: localStorage.getItem(LS_LAST_SERVER_VERIFY) || null,
      deviceKeyEnrolled: localStorage.getItem(LS_DEVICE_KEY_ENROLLED) === 'true',
    };
  }

  function setActivationActive(activationId, publicJwk) {
    localStorage.setItem(LS_ACTIVATED, 'true');
    localStorage.setItem(LS_ACTIVATION_ID, activationId);
    localStorage.setItem(LS_DEVICE_KEY_ENROLLED, 'true');
    if (publicJwk) {
      localStorage.setItem('pkg_v1_public_key_jwk', JSON.stringify(publicJwk));
    }
    localStorage.setItem(LS_LAST_SERVER_VERIFY, String(Date.now()));
  }

  function setActivationRevoked() {
    localStorage.setItem(LS_ACTIVATED, 'false');
    localStorage.setItem(LS_DEVICE_KEY_ENROLLED, 'false');
  }

  function clearActivation() {
    localStorage.removeItem(LS_ACTIVATED);
    localStorage.removeItem(LS_ACTIVATION_ID);
    localStorage.removeItem(LS_ACTIVATION_CODE);
    localStorage.removeItem(LS_LAST_SERVER_VERIFY);
    localStorage.removeItem(LS_DEVICE_KEY_ENROLLED);
    localStorage.removeItem('pkg_v1_public_key_jwk');
    // Also clear IndexedDB private key
    deletePrivateKey().catch(function (e) {
      console.warn('[ActivationDevice] Failed to delete private key:', e.message);
    });
  }

  // ====================================================================
  // RECOVERY DETECTION — Check if private key is missing
  // ====================================================================

  async function checkDeviceKeyIntegrity() {
    var state = getActivationState();

    if (!state.activated) {
      return { status: 'NOT_ACTIVATED', message: 'Perangkat belum diaktivasi.' };
    }

    var privateKey = await loadPrivateKey();

    if (!privateKey) {
      // Private key missing but activation flag is set → security issue
      return {
        status: 'DEVICE_KEY_MISSING',
        message: 'Data keamanan aktivasi pada perangkat ini tidak lengkap. Silakan hubungi Admin untuk melakukan pemulihan aktivasi.',
      };
    }

    // Check device ID consistency
    var storedDeviceId = localStorage.getItem(LS_DEVICE_ID);
    if (!storedDeviceId) {
      return {
        status: 'DEVICE_ID_MISSING',
        message: 'Device ID tidak ditemukan. Silakan hubungi Admin.',
      };
    }

    return { status: 'OK', message: 'Device key integrity verified.' };
  }

  // ====================================================================
  // PERIODIC SERVER VERIFICATION
  // ====================================================================

  function needsServerVerification() {
    var state = getActivationState();
    if (!state.activated) return false;

    var last = parseInt(state.lastServerVerify) || 0;
    var elapsed = Date.now() - last;

    // Also verify if key is marked enrolled but we haven't verified recently
    return elapsed > VERIFY_INTERVAL_MS;
  }

  async function performServerVerification() {
    if (!window.SupabaseSync || !window.SupabaseSync.isConfigured()) return;

    var state = getActivationState();
    if (!state.activated || !state.activationId) return;

    try {
      var r = await window.SupabaseSync.checkActivationStatus(state.activationId, state.deviceId);

      if (r.status === 'REVOKED') {
        setActivationRevoked();
        return { revoked: true, message: 'Aktivasi pada perangkat ini telah dinonaktifkan oleh Admin.' };
      }

      if (r.status === 'DEVICE_MISMATCH') {
        setActivationRevoked();
        return { revoked: true, message: 'Perangkat ini tidak sesuai dengan aktivasi yang terdaftar.' };
      }

      if (r.status === 'ACTIVE') {
        localStorage.setItem(LS_LAST_SERVER_VERIFY, String(Date.now()));
        return { revoked: false, verified: true };
      }

      if (r.status === 'NOT_FOUND') {
        setActivationRevoked();
        return { revoked: true, message: 'Data aktivasi tidak ditemukan di server.' };
      }
    } catch (e) {
      console.warn('[ActivationDevice] Server verification failed (offline?):', e.message);
      // Don't block on network error — app works offline
      return { revoked: false, verified: false, error: e.message };
    }

    return { revoked: false, verified: false };
  }

  // ====================================================================
  // LEGACY ENROLLMENT — For users activated in Tahap 1/2 without device key
  // ====================================================================

  async function tryLegacyEnrollment() {
    var state = getActivationState();

    if (!state.activated) return { enrolled: false, reason: 'NOT_ACTIVATED' };
    if (state.deviceKeyEnrolled) return { enrolled: false, reason: 'ALREADY_ENROLLED' };

    // Check if we already have a key in IndexedDB
    var existingKey = await loadPrivateKey();
    if (existingKey) {
      // Key exists but enrollment flag not set — try to enroll with server
      // This can happen if key was generated but enrollment RPC failed
    } else {
      // Generate new key pair
      try {
        await generateKeyPair();
      } catch (e) {
        return { enrolled: false, reason: 'KEYGEN_FAILED', message: e.message };
      }
    }

    var kp = await loadKeyPair();
    if (!kp || !kp.publicKey) {
      // Need to re-import public key
      var publicJwkStr = localStorage.getItem('pkg_v1_public_key_jwk');
      if (!publicJwkStr) {
        // We need to export the public key from the key pair
        // But the key is non-exportable... we need to regenerate
        // Actually, generateKeyPair() already exports public key as JWK and stores it
        // So if _publicKeyJwk is set, use it
        if (_publicKeyJwk) {
          // Already set by generateKeyPair()
        } else {
          return { enrolled: false, reason: 'NO_PUBLIC_KEY' };
        }
      }
    }

    var publicJwk = _publicKeyJwk || (function () {
      var s = localStorage.getItem('pkg_v1_public_key_jwk');
      try { return s ? JSON.parse(s) : null; } catch (e) { return null; }
    })();

    if (!publicJwk) {
      return { enrolled: false, reason: 'NO_PUBLIC_KEY' };
    }

    // Call enrollment RPC
    try {
      var r = await window.SupabaseSync.enrollDeviceKey(
        state.activationId,
        state.deviceId,
        publicJwk
      );

      if (r.status === 'ENROLLED') {
        localStorage.setItem(LS_DEVICE_KEY_ENROLLED, 'true');
        localStorage.setItem('pkg_v1_public_key_jwk', JSON.stringify(publicJwk));
        localStorage.setItem(LS_LAST_SERVER_VERIFY, String(Date.now()));
        return { enrolled: true };
      }

      if (r.status === 'ALREADY_ENROLLED') {
        // Server already has a key but local doesn't match → security issue
        localStorage.setItem(LS_DEVICE_KEY_ENROLLED, 'true');
        return { enrolled: false, reason: 'ALREADY_ENROLLED', message: 'Device key sudah terdaftar di server tetapi tidak cocok dengan perangkat ini.' };
      }

      if (r.status === 'DEVICE_MISMATCH') {
        setActivationRevoked();
        return { enrolled: false, reason: 'DEVICE_MISMATCH', message: 'Device ID tidak cocok dengan server.' };
      }

      if (r.status === 'NOT_ACTIVATED') {
        setActivationRevoked();
        return { enrolled: false, reason: 'NOT_ACTIVATED', message: 'Aktivasi sudah tidak aktif.' };
      }

      if (r.status === 'NOT_FOUND') {
        setActivationRevoked();
        return { enrolled: false, reason: 'NOT_FOUND', message: 'Data aktivasi tidak ditemukan.' };
      }

      return { enrolled: false, reason: r.status || 'UNKNOWN' };
    } catch (e) {
      return { enrolled: false, reason: 'NETWORK_ERROR', message: e.message };
    }
  }

  // ====================================================================
  // FULL ACTIVATION FLOW (Tahap 3)
  // ====================================================================

  async function performActivation(payload) {
    // payload: { code, nama_pengguna, username, madrasah, kabupaten, role, device_info }
    //
    // Returns: { ok: true } | { ok: false, reason, message }
    //
    // Steps:
    // 1. Get/create Device ID
    // 2. Generate ECDSA P-256 key pair (private in IndexedDB, public for server)
    // 3. Call activateCode RPC with device_id + public_key
    // 4. If ACTIVATED: store local state
    // 5. If fail: DO NOT store local activation (fail closed)

    // Step 1: Device ID
    var deviceId = getDeviceId();

    // Step 2: Generate key pair
    var keyResult;
    try {
      keyResult = await generateKeyPair();
    } catch (e) {
      return { ok: false, reason: 'KEYGEN_FAILED', message: 'Gagal membuat device key: ' + e.message };
    }

    // Step 3: Call RPC
    var rpcResult = await window.SupabaseSync.activateCode({
      code: payload.code,
      device_id: deviceId,
      nama_pengguna: payload.nama_pengguna || null,
      username: payload.username || null,
      madrasah: payload.madrasah || null,
      kabupaten: payload.kabupaten || null,
      role: payload.role || null,
      device_info: payload.device_info || (navigator.userAgent || '').slice(0, 200),
      device_public_key: keyResult.publicJwk,
    });

    // Step 4: Handle result
    if (rpcResult.ok) {
      // Store activation state locally
      // We need the activation_id from server. Since activate_pkg_code returns just 'ACTIVATED',
      // we need to also get the activation_id. Let's modify: after activation,
      // call check_activation_status to get the ID, or modify the RPC to return it.
      //
      // Actually, the RPC returns just 'ACTIVATED' text. We need the activation_id.
      // Option 1: Modify RPC to return the id (breaking change).
      // Option 2: After activation, query by device_id to get the id.
      //
      // Let's use option 2: the check_activation_status RPC already takes activation_id,
      // so we need a way to get it. Let's add a simple RPC or use the existing
      // check_activation_status with a lookup by device_id.
      //
      // Actually, let's modify activate_pkg_code to return the id as well.
      // But that changes the return type from TEXT to TABLE.
      // Alternative: store a hash of (device_id + code) as the local activation_id
      // reference, and have a separate RPC to look up the activation_id by device_id.
      //
      // Simplest: After activation succeeds, call a new RPC 'get_my_activation'
      // that takes device_id and code, returns the activation_id.
      //
      // For now, let's store a temporary reference and resolve the activation_id
      // during the next server verification or enrollment.
      // Actually, we can store the code hash locally and use it.
      //
      // Better approach: modify activate_pkg_code to return JSON with both status and id.
      // This is a breaking change but we control all sides.
      //
      // For now: we'll query get_my_activation after activation.
      var activationId = null;
      try {
        var lookupResult = await window.SupabaseSync.getMyActivation(deviceId, payload.code);
        if (lookupResult.ok) {
          activationId = lookupResult.activationId;
        }
      } catch (e) {
        console.warn('[ActivationDevice] Failed to get activation_id:', e.message);
      }

      setActivationActive(activationId || 'pending', keyResult.publicJwk);

      return { ok: true, activationId: activationId };
    }

    // Step 5: Fail closed — do not store local activation
    // Clean up the generated key if activation failed
    if (rpcResult.reason !== 'ALREADY_USED' && rpcResult.reason !== 'REVOKED') {
      // Only clean up on network error or invalid code
      // (on ALREADY_USED/REVOKED, the key might be reused on retry)
      // Actually, each activation attempt generates a new key pair.
      // If activation failed, clean up the key.
      await deletePrivateKey();
    }

    return { ok: false, reason: rpcResult.reason, message: rpcResult.message };
  }

  // ====================================================================
  // EXPORT
  // ====================================================================

  window.ActivationDevice = {
    // Device ID
    getDeviceId: getDeviceId,

    // Key management
    generateKeyPair: generateKeyPair,
    loadKeyPair: loadKeyPair,
    signChallenge: signChallenge,
    verifySignature: verifySignature,

    // Activation state
    getActivationState: getActivationState,
    setActivationActive: setActivationActive,
    setActivationRevoked: setActivationRevoked,
    clearActivation: clearActivation,

    // Integrity & recovery
    checkDeviceKeyIntegrity: checkDeviceKeyIntegrity,

    // Server verification
    needsServerVerification: needsServerVerification,
    performServerVerification: performServerVerification,

    // Legacy enrollment
    tryLegacyEnrollment: tryLegacyEnrollment,

    // Full activation flow
    performActivation: performActivation,

    // Constants
    VERIFY_INTERVAL_MS: VERIFY_INTERVAL_MS,
  };
})();
