// utils.js — SIEO

function formatRupiah(angka) {
  return 'Rp ' + Number(angka).toLocaleString('id-ID');
}

function formatTanggal(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('id-ID');
}

function showAlert(elId, pesan, tipe = 'danger') {
  document.getElementById(elId).innerHTML =
    `<div class="alert alert-${tipe} py-2">${pesan}</div>`;
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ============================================================
// SESSION MANAGEMENT
// ============================================================

var SESI_KEY_ = 'sieo_sesi';

function simpanSesi(user) {
  var sesi = {
    email:   user.email,
    nama:    user.nama,
    role:    user.role,
    akses:   user.akses,
    loginAt: new Date().getTime()
  };
  localStorage.setItem(SESI_KEY_, JSON.stringify(sesi));
}

// Return object sesi atau null kalau tidak ada / expired (8 jam)
function getSesi() {
  try {
    var raw = localStorage.getItem(SESI_KEY_);
    if (!raw) return null;
    var sesi = JSON.parse(raw);
    if (new Date().getTime() - sesi.loginAt > 8 * 60 * 60 * 1000) {
      localStorage.removeItem(SESI_KEY_);
      return null;
    }
    return sesi;
  } catch(e) { return null; }
}

function hapusSesi() {
  localStorage.removeItem(SESI_KEY_);
}

// Cek akses modul — return true kalau level user >= levelMin
var LEVEL_URUT_ = ['NONE', 'VIEW', 'INPUT', 'APPROVE', 'FULL'];
function cekAkses(modul, levelMin) {
  var sesi = getSesi();
  if (!sesi) return false;
  var levelUser = (sesi.akses && sesi.akses[modul]) ? sesi.akses[modul] : 'NONE';
  return LEVEL_URUT_.indexOf(levelUser) >= LEVEL_URUT_.indexOf(levelMin);
}

// Guard halaman — panggil di awal setiap halaman protected
// modulRequired & levelMin opsional
function guardHalaman(modulRequired, levelMin) {
  var sesi = getSesi();
  if (!sesi) {
    window.location.href = '/elim-web-app/pages/login.html';
    return null;
  }
  if (modulRequired && levelMin) {
    if (!cekAkses(modulRequired, levelMin)) {
      alert('Akses ditolak. Anda tidak memiliki izin untuk halaman ini.');
      window.location.href = '/elim-web-app/index.html';
      return null;
    }
  }
  return sesi;
}

// Render nama + role + tombol Keluar di elemen #userInfo (topbar)
function renderUserInfo() {
  var sesi = getSesi();
  var el = document.getElementById('userInfo');
  if (!el || !sesi) return;
  el.innerHTML =
    '<span style="font-size:0.8rem; color:#adb9d6;">' +
      escHtml(sesi.nama) + ' &nbsp;|&nbsp; ' +
      '<span style="color:#e8521a; font-weight:600;">' + escHtml(sesi.role) + '</span>' +
    '</span>' +
    '<button onclick="logout()" style="margin-left:12px; background:transparent;' +
    ' border:1px solid #e8521a; color:#e8521a; border-radius:4px;' +
    ' padding:2px 10px; font-size:0.75rem; cursor:pointer;">Keluar</button>';
}

function logout() {
  if (confirm('Yakin ingin keluar?')) {
    hapusSesi();
    window.location.href = '/elim-web-app/pages/login.html';
  }
}
