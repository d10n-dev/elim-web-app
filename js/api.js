// ============================================================
// SIEO — api.js (Supabase REST API)
// ============================================================

const SUPA_URL  = 'https://sodwffpzgwocujsqrncd.supabase.co';
const SUPA_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvZHdmZnB6Z3dvY3Vqc3FybmNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NDkwNjAsImV4cCI6MjA5NzEyNTA2MH0.hMUyH2Td64AMstyh0j3HQGOMaIqRk8h2V_tfj6QiBK4';

// Ambil sesi utuh dari localStorage
function getSupaSesi() {
  try {
    const raw = localStorage.getItem('sieo_sesi');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch(e) { return null; }
}

// Ambil access token dari session Supabase
function getSupaToken() {
  const sesi = getSupaSesi();
  return sesi ? (sesi.access_token || null) : null;
}

// ============================================================
// AUTO-REFRESH TOKEN — dipanggil sebelum tiap request
// Refresh proaktif kalau token akan expire dalam < 5 menit
// ============================================================
let _refreshPromise = null; // cegah refresh dobel kalau ada request paralel

function pastikanTokenValid() {
  const sesi = getSupaSesi();
  if (!sesi || !sesi.refresh_token) return Promise.resolve(); // belum login, biarkan lewat

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = sesi.expires_at || 0;
  const akanExpireSoon = (expiresAt - now) < 300; // < 5 menit lagi

  if (!akanExpireSoon) return Promise.resolve();

  if (_refreshPromise) return _refreshPromise; // sudah ada proses refresh jalan

  _refreshPromise = fetch(`${SUPA_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPA_KEY },
    body: JSON.stringify({ refresh_token: sesi.refresh_token })
  })
    .then(r => r.json())
    .then(data => {
      if (data && data.access_token) {
        sesi.access_token  = data.access_token;
        sesi.refresh_token = data.refresh_token || sesi.refresh_token;
        sesi.expires_at    = data.expires_at || (Math.floor(Date.now()/1000) + (data.expires_in || 3600));
        localStorage.setItem('sieo_sesi', JSON.stringify(sesi));
      } else {
        // refresh_token juga sudah invalid -> paksa login ulang
        localStorage.removeItem('sieo_sesi');
        localStorage.removeItem('sieo_idtoken');
        window.location.href = '/login.html';
      }
    })
    .catch(() => { /* diamkan, biarkan request asli yang gagal & fallback 401 handle */ })
    .finally(() => { _refreshPromise = null; });

  return _refreshPromise;
}

// Header standar untuk semua request
function _headers(extra = {}) {
  const token = getSupaToken();
  return {
    'Content-Type': 'application/json',
    'apikey': SUPA_KEY,
    'Authorization': token ? `Bearer ${token}` : `Bearer ${SUPA_KEY}`,
    'Prefer': 'return=representation',
    ...extra
  };
}

// Wrapper fetch: pastikan token valid dulu, retry sekali kalau tetap 401/JWT expired.
// _retriedNet: internal flag, retry sekali kalau gagal di level jaringan (bukan JWT).
function dbFetch(url, options = {}, _retriedNet = false) {
  return pastikanTokenValid().then(() => {
    const opts = Object.assign({}, options, { headers: _headers(options.headers || {}) });
    return fetch(url, opts)
      .then(r => r.text().then(txt => {
        let data;
        try { data = txt ? JSON.parse(txt) : null; }
        catch (e) { throw new Error('Respons server tidak valid: ' + txt.slice(0, 200)); }

        const expired = data && (data.message === 'JWT expired' || data.code === 'PGRST301');
        if (expired) {
          return pastikanTokenValidPaksa().then(() => {
            const opts2 = Object.assign({}, options, { headers: _headers(options.headers || {}) });
            return fetch(url, opts2).then(r2 => r2.text()).then(t2 => {
              try { return t2 ? JSON.parse(t2) : null; }
              catch (e) { throw new Error('Respons server tidak valid setelah refresh token: ' + t2.slice(0, 200)); }
            });
          });
        }
        return data;
      }))
      .catch(err => {
        // Gagal di level jaringan (koneksi putus sesaat, device background, dll) —
        // retry sekali otomatis sebelum benar-benar dianggap gagal. Ini penting
        // di Android karena tab/app bisa sempat background pas user isi PIN.
        if (!_retriedNet) {
          return new Promise(resolve => setTimeout(resolve, 800))
            .then(() => dbFetch(url, options, true));
        }
        throw err; // sudah retry sekali, biar caller yang tangkap & tampilkan ke user
      });
  });
}

function pastikanTokenValidPaksa() {
  const sesi = getSupaSesi();
  if (!sesi || !sesi.refresh_token) {
    window.location.href = '/login.html';
    return Promise.resolve();
  }
  sesi.expires_at = 0; // paksa dianggap expired
  localStorage.setItem('sieo_sesi', JSON.stringify(sesi));
  return pastikanTokenValid();
}

// ============================================================
// REST HELPERS
// ============================================================

// GET dari tabel — params adalah object filter PostgREST
// contoh: dbGet('m_pelanggan', { status: 'eq.AKTIF' })
function dbGet(table, params = {}) {
  const q = new URLSearchParams(params).toString();
  const url = `${SUPA_URL}/rest/v1/${table}${q ? '?' + q : ''}`;
  return dbFetch(url, { method: 'GET' });
}

// POST — insert satu row
function dbInsert(table, data) {
  return dbFetch(`${SUPA_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { 'Prefer': 'return=representation' },
    body: JSON.stringify(data)
  });
}

// PATCH — update row berdasarkan filter
// contoh: dbUpdate('m_pelanggan', { status: 'eq.NONAKTIF' }, { status: 'AKTIF' })
function dbUpdate(table, filter, data) {
  const q = new URLSearchParams(filter).toString();
  return dbFetch(`${SUPA_URL}/rest/v1/${table}?${q}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

// DELETE
function dbDelete(table, filter) {
  const q = new URLSearchParams(filter).toString();
  return dbFetch(`${SUPA_URL}/rest/v1/${table}?${q}`, { method: 'DELETE' });
}

// RPC — panggil PostgreSQL function
// contoh: dbRpc('get_saldo_stok', { p_id_item: 'ITM001' })
function dbRpc(fnName, params = {}) {
  return dbFetch(`${SUPA_URL}/rest/v1/rpc/${fnName}`, {
    method: 'POST',
    body: JSON.stringify(params)
  });
}

// ============================================================
// INTERCEPTOR — cek session expired
// ============================================================
function cekAksesGAS(res) {
  if (res && res.message === 'JWT expired') {
    localStorage.removeItem('sieo_sesi');
    localStorage.removeItem('sieo_idtoken');
    window.location.href = '/login.html';
    return false;
  }
  return true;
}

// ============================================================
// LEGACY WRAPPER — agar halaman lama tidak langsung rusak
// apiGet dan apiPost masih bisa dipanggil tapi arahkan ke
// fungsi baru per action. Ganti isi ini bertahap per modul.
// ============================================================
const GAS_URL = null; // GAS tidak dipakai lagi

function apiGet(action, params = {}) {
  console.warn(`apiGet('${action}') belum dimigrasikan ke Supabase`);
  return Promise.resolve({ status: 'error', message: 'Belum dimigrasikan' });
}

function apiPost(action, data = {}) {
  console.warn(`apiPost('${action}') belum dimigrasikan ke Supabase`);
  return Promise.resolve({ status: 'error', message: 'Belum dimigrasikan' });
}