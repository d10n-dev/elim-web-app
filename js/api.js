// ============================================================
// SIEO — api.js (Supabase REST API)
// ============================================================

const SUPA_URL  = 'https://sodwffpzgwocujsqrncd.supabase.co';
const SUPA_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvZHdmZnB6Z3dvY3Vqc3FybmNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NDkwNjAsImV4cCI6MjA5NzEyNTA2MH0.hMUyH2Td64AMstyh0j3HQGOMaIqRk8h2V_tfj6QiBK4';

// Ambil access token dari session Supabase
function getSupaToken() {
  try {
    const raw = localStorage.getItem('sieo_sesi');
    if (!raw) return null;
    const sesi = JSON.parse(raw);
    return sesi.access_token || null;
  } catch(e) { return null; }
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

// ============================================================
// REST HELPERS
// ============================================================

// GET dari tabel — params adalah object filter PostgREST
// contoh: dbGet('m_pelanggan', { status: 'eq.AKTIF' })
function dbGet(table, params = {}) {
  const q = new URLSearchParams(params).toString();
  const url = `${SUPA_URL}/rest/v1/${table}${q ? '?' + q : ''}`;
  return fetch(url, { headers: _headers() }).then(r => r.json());
}

// POST — insert satu row
function dbInsert(table, data) {
  return fetch(`${SUPA_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: _headers(),
    body: JSON.stringify(data)
  }).then(r => r.json());
}

// PATCH — update row berdasarkan filter
// contoh: dbUpdate('m_pelanggan', { status: 'eq.NONAKTIF' }, { status: 'AKTIF' })
function dbUpdate(table, filter, data) {
  const q = new URLSearchParams(filter).toString();
  return fetch(`${SUPA_URL}/rest/v1/${table}?${q}`, {
    method: 'PATCH',
    headers: _headers(),
    body: JSON.stringify(data)
  }).then(r => r.json());
}

// DELETE
function dbDelete(table, filter) {
  const q = new URLSearchParams(filter).toString();
  return fetch(`${SUPA_URL}/rest/v1/${table}?${q}`, {
    method: 'DELETE',
    headers: _headers()
  }).then(r => r.json());
}

// RPC — panggil PostgreSQL function
// contoh: dbRpc('get_saldo_stok', { p_id_item: 'ITM001' })
function dbRpc(fnName, params = {}) {
  return fetch(`${SUPA_URL}/rest/v1/rpc/${fnName}`, {
    method: 'POST',
    headers: _headers(),
    body: JSON.stringify(params)
  }).then(r => r.json());
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