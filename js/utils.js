// ============================================================
// SIEO — utils.js (Auth + UI Helpers)
// SUPA_URL dan SUPA_KEY didefinisikan di api.js — load api.js DULU
// ============================================================

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

// ============================================================
// AKSES MODUL GRANULAR — utk modul finansial sensitif (kas
// kecil, dst) yg dibatasi ke user TERTENTU, terlepas dari
// role dasar mereka. Direktur SELALU lolos semua modul.
// Dipakai: if (!(await punyaAksesModul('kas_kecil'))) { ... }
// ============================================================
async function punyaAksesModul(modul) {
  if (isDirektur()) return true;
  // MANAGER auto-lolos khusus modul 'pembelian' (bantu input), tanpa perlu grant manual.
  if (modul === 'pembelian' && isManager()) return true;
  // ADMIN auto-lolos modul 'kas_kecil' dan 'pembelian', tanpa perlu grant manual.
  // Modul finansial lain (bank, dst) tetap wajib grant per-email seperti semula.
  if ((modul === 'kas_kecil' || modul === 'pembelian') && getRoleUser() === 'ADMIN') return true;
  const info = getUserInfo();
  if (!info || !info.email) return false;
  try {
    const res = await dbGet('m_akses_modul', { email_user: 'eq.' + info.email, modul: 'eq.' + modul });
    return Array.isArray(res) && res.length > 0;
  } catch (e) {
    return false;
  }
}

// Cek apakah session masih valid
function sesiValid() {
  const sesi = getSesi();
  if (!sesi || !sesi.access_token) return false;
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
  // Role KARYAWAN cuma boleh akses halaman Slip Gaji Saya — dicek di
  // satu titik pusat ini (dipanggil semua halaman) supaya tidak perlu
  // ditambah manual di tiap file satu-satu.
  const role = getRoleUser();
  if (role === 'KARYAWAN') {
    const halamanIzin = 'slip_karyawan.html';
    const pathSekarang = window.location.pathname.split('/').pop();
    if (pathSekarang !== halamanIzin) {
      window.location.replace('/pages/' + halamanIzin);
      return false;
    }
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

// Logout
function logout() {
  hapusSesi();
  window.location.href = '/pages/login.html';
}

// ============================================================
// ID GENERATOR — mirip GAS generateId_
// Ambil max ID dari array data, prefix + padStart
// Contoh: generateIdLokal(data, 'PLE', 'id_pelanggan', 3)
// ============================================================
function generateIdLokal(dataArr, prefix, idKey, padLen) {
  const nums = dataArr
    .map(r => parseInt((r[idKey] || '').replace(prefix, '')) || 0)
    .filter(n => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return prefix + String(next).padStart(padLen, '0');
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
