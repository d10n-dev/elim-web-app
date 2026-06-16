// ============================================================
// SIEO — utils.js (Supabase Auth + UI Helpers)
// ============================================================

const SUPA_URL = 'https://sodwffpzgwocujsqrncd.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvZHdmZnB6Z3dvY3Vqc3FybmNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NDkwNjAsImV4cCI6MjA5NzEyNTA2MH0.hMUyH2Td64AMstyh0j3HQGOMaIqRk8h2V_tfj6QiBK4';

// ============================================================
// AUTH HELPERS
// ============================================================

function getSesi() {
  try {
    const raw = localStorage.getItem('sieo_sesi');
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}

function setSesi(data) {
  localStorage.setItem('sieo_sesi', JSON.stringify(data));
}

function hapusSesi() {
  localStorage.removeItem('sieo_sesi');
  localStorage.removeItem('sieo_idtoken');
}

function getUserInfo() {
  const sesi = getSesi();
  if (!sesi) return null;
  return sesi.user_info || null;
}

function getNamaUser() {
  const info = getUserInfo();
  return info ? (info.nama || info.email) : 'User';
}

function getRoleUser() {
  const info = getUserInfo();
  return info ? (info.role || 'ADMIN') : null;
}

function isDirektur() { return getRoleUser() === 'DIREKTUR'; }
function isManager()  { return getRoleUser() === 'MANAGER'; }

// Cek apakah session masih valid
function sesiValid() {
  const sesi = getSesi();
  if (!sesi || !sesi.access_token) return false;
  // Cek expiry
  if (sesi.expires_at && Date.now() / 1000 > sesi.expires_at) return false;
  return true;
}

// Guard halaman — redirect ke login kalau tidak ada sesi
function guardHalaman() {
  if (!sesiValid()) {
    hapusSesi();
    window.location.href = '/pages/login.html';
    return false;
  }
  renderUserInfo();
  return true;
}

// Tampilkan nama + role di topbar
function renderUserInfo() {
  const info = getUserInfo();
  if (!info) return;
  const el = document.getElementById('userPill');
  if (el) el.textContent = `👤 ${info.nama || info.email} (${info.role || ''})`;
}

// Login via Google OAuth — redirect ke Supabase
function loginGoogle() {
  const redirectTo = encodeURIComponent('https://sieo.my.id/pages/login.html');
  window.location.href = 
    `${SUPA_URL}/auth/v1/authorize?provider=google&redirect_to=${redirectTo}`;
}

// Logout
function logout() {
  hapusSesi();
  window.location.href = '/pages/login.html';
}

// Handle callback dari Supabase OAuth
// Dipanggil di login.html setelah redirect balik
async function handleAuthCallback() {
  // Supabase taruh token di URL hash (#access_token=...&refresh_token=...)
  const hash = window.location.hash;
  if (!hash) return false;

  const params = new URLSearchParams(hash.substring(1));
  const accessToken  = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const expiresAt    = params.get('expires_at');

  if (!accessToken) return false;

  // Ambil data user dari Supabase
  const res = await fetch(`${SUPA_URL}/auth/v1/user`, {
    headers: {
      'apikey': SUPA_KEY,
      'Authorization': `Bearer ${accessToken}`
    }
  });
  const userData = await res.json();

  // Ambil data user dari tabel m_user (role, status)
  const resUser = await fetch(
    `${SUPA_URL}/rest/v1/m_user?email=eq.${encodeURIComponent(userData.email)}&select=*`,
    { headers: { 'apikey': SUPA_KEY, 'Authorization': `Bearer ${accessToken}` } }
  );
  const userRows = await resUser.json();
  const userDb = userRows && userRows[0] ? userRows[0] : null;

  // Simpan sesi
  setSesi({
    access_token:  accessToken,
    refresh_token: refreshToken,
    expires_at:    expiresAt ? parseInt(expiresAt) : null,
    user_info: {
      email: userData.email,
      nama:  userData.user_metadata?.full_name || userData.email,
      role:  userDb ? userDb.role : null,
      status: userDb ? userDb.status : 'PENDING'
    }
  });

  return userDb;
}

// ============================================================
// UI HELPERS
// ============================================================

function formatRupiah(angka) {
  return 'Rp ' + Number(angka).toLocaleString('id-ID');
}

function formatTanggal(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('id-ID');
}

function formatTanggalWaktu(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('id-ID');
}

function showAlert(elId, pesan, tipe = 'danger') {
  const el = document.getElementById(elId);
  if (el) el.innerHTML = `<div class="alert alert-${tipe} py-2">${pesan}</div>`;
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}