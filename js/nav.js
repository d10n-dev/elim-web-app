// ============================================================
// SIEO — nav.js
// Render topbar + drawer navigasi terpusat di semua halaman.
// Bergantung pada utils.js (guardHalaman, getUserInfo, getRoleUser,
// logout) dan api.js (dbGet) yang HARUS di-load sebelum file ini.
//
// Cara pakai di setiap halaman (di dalam <body>, posisi paling atas):
//   <div id="navRoot"></div>
//   ...
//   <script src="../js/api.js"></script>
//   <script src="../js/utils.js"></script>
//   <script src="../js/nav.js"></script>
//   <script>
//     window.addEventListener('load', function () {
//       if (!guardHalaman()) return;
//       initNav('order');   // 'order' = key halaman aktif, lihat NAV_MENU
//       // ...kode halaman lainnya
//     });
//   </script>
// ============================================================

// ----------------------------------------------------------
// 0. BASE PATH — deteksi otomatis apakah file ini dibuka dari
// root (index.html) atau dari dalam folder /pages/. Semua href
// di NAV_MENU ditulis ABSOLUT dari root (mis. 'pages/order.html'),
// lalu di-resolve relatif terhadap lokasi index.html secara konsisten.
// ----------------------------------------------------------
const NAV_BASE = location.pathname.includes('/pages/') ? '../' : '';

// ----------------------------------------------------------
// 1. DEFINISI MENU
// key   : identifier unik halaman (dipakai initNav() utk highlight)
// label : teks tampil
// icon  : emoji
// href  : path ABSOLUT dari root repo (mis. 'pages/order.html', 'index.html')
// role  : null = semua role boleh akses; array = role yang diizinkan
// soon  : true = disabled, badge "SEGERA"
// ----------------------------------------------------------
const NAV_MENU = [
  {
    group: 'Operasional',
    items: [
      { key: 'order',        label: 'Order Masuk',    icon: '📝', href: 'pages/order.html' },
      { key: 'spk',           label: 'SPK',             icon: '🖨️', href: 'pages/spk.html' },
      { key: 'log_produksi',  label: 'Log Produksi',    icon: '📊', href: 'pages/log_produksi.html' },
      { key: 'stok_bj',       label: 'Stok BJ',         icon: '📦', href: 'pages/stok_bj.html' },
      { key: 'stok_bahan',    label: 'Stok Bahan',      icon: '🧱', href: 'pages/stok_bahan.html' },
      { key: 'stok_tinta_sparepart', label: 'Stok Tinta & Sparepart', icon: '🎨', href: 'pages/stok_tinta_sparepart.html' },
      { key: 'pengiriman',    label: 'Pengiriman',      icon: '🚚', href: 'pages/pengiriman.html' },
      { key: 'retur',         label: 'Retur',           icon: '↩️', href: 'pages/retur.html' },
    ]
  },
  {
    group: 'Keuangan',
    items: [
      { key: 'piutang',       label: 'Piutang & Faktur', icon: '🧾', href: 'pages/piutang.html' },
      { key: 'kas_kecil',     label: 'Kas Kecil',         icon: '💵', href: 'pages/kaskecil.html' },
      { key: 'antar_entitas', label: 'Antar-Entitas',     icon: '🔁', href: 'pages/antar_entitas.html' },
      { key: 'bank',          label: 'Bank',              icon: '🏦', href: 'pages/bank.html' },
      { key: 'pembelian', label: 'Pembelian',         icon: '🛒', href: 'pages/pembelian.html' },
      { key: 'laporan',   label: 'Laporan',           icon: '📈', href: 'pages/laporan.html' },
      { key: 'laporan kinerja',   label: 'Laporan kinerja',           icon: '📈', href: 'pages/laporan_kinerja_operator.html', role: ['MANAGER','DIREKTUR'] },
      { key: 'gajian', label: 'Gajian', icon: '💵', href: 'pages/gajian.html', role: ['MANAGER','DIREKTUR'] },
      { key: 'slip_karyawan', label: 'Slip Gaji Saya', icon: '🧾', href: 'pages/slip_karyawan.html' },
    ]
  },
  {
    group: 'Master',
    items: [
      { key: 'pelanggan', label: 'Pelanggan', icon: '🏢', href: 'pages/pelanggan.html' },
      { key: 'item',      label: 'Item',       icon: '📦', href: 'pages/item.html' },
      { key: 'bahan',     label: 'Bahan',      icon: '🧱', href: 'pages/bahan.html' },
      { key: 'tinta',     label: 'Tinta',      icon: '🎨', href: 'pages/tinta.html' },
      { key: 'sparepart', label: 'Sparepart',  icon: '🔧', href: 'pages/sparepart.html' },
      { key: 'bom',       label: 'BOM',        icon: '📋', href: 'pages/bom.html' },
      { key: 'operator',  label: 'Operator',   icon: '👤', href: 'pages/operator.html' },
    ]
  },
  {
    group: 'Sistem',
    items: [
      { key: 'user_management', label: 'User Management', icon: '👥', href: 'pages/user_management.html', role: ['DIREKTUR'] },
      { key: 'pin_setting', label: 'PIN Approval', icon: '🔐', href: 'pages/pin_setting.html', role: ['MANAGER','DIREKTUR'] },
    ]
  }
];

// ----------------------------------------------------------
// 2. RENDER TOPBAR
// ----------------------------------------------------------
function renderTopbar(pageTitle) {
  const info = (typeof getUserInfo === 'function') ? getUserInfo() : null;
  const nama = info ? (info.nama || info.email || 'User') : 'User';
  const role = info ? (info.role || '') : '';

  const html = `
    <div class="topbar">
      <div class="topbar-left">
        <div class="topbar-title">${escHtml(pageTitle)}</div>
        <div class="topbar-userline">
          <span class="u-name">${escHtml(nama)}</span>
          <span class="u-role">· ${escHtml(role)}</span>
          <button class="u-logout" onclick="konfirmasiLogout()">Logout</button>
        </div>
      </div>
      <div class="topbar-right">
        <div class="db-dot checking" id="navDbDot" title="Status Supabase"></div>
        <button class="nav-bell" id="navBell" onclick="toggleNotifNav(event)" aria-label="Notifikasi" style="display:none">🔔<span class="nav-bell-badge" id="navBellBadge" style="display:none"></span></button>
        <button class="btn-hamburger" onclick="bukaDrawer()" aria-label="Menu">☰</button>
      </div>
    </div>
  `;
  const root = document.getElementById('navRoot');
  if (root) root.insertAdjacentHTML('beforeend', html);
}

// ----------------------------------------------------------
// 3. RENDER DRAWER
// ----------------------------------------------------------
function renderDrawer(activeKey) {
  const role = (typeof getRoleUser === 'function') ? getRoleUser() : null;

  let groupsHtml = '';
  NAV_MENU.forEach(function (grp) {
    const visibleItems = grp.items.filter(function (it) {
      if (role === 'KARYAWAN') return it.key === 'slip_karyawan';
      if (!it.role) return true;
      return it.role.indexOf(role) !== -1;
    });
    if (visibleItems.length === 0) return;

    let itemsHtml = '';
    visibleItems.forEach(function (it) {
      const isActive = it.key === activeKey;
      const cls = ['nav-item'];
      if (isActive) cls.push('active');
      if (it.soon) cls.push('disabled');
      const badge = it.soon ? '<span class="nav-item-badge">SEGERA</span>' : '';
      const finalHref = it.href === '#' ? '#' : (NAV_BASE + it.href);
      itemsHtml += `
        <a href="${finalHref}" class="${cls.join(' ')}">
          <span class="nic">${it.icon}</span>
          <span>${escHtml(it.label)}</span>
          ${badge}
        </a>`;
    });

    groupsHtml += `
      <div class="nav-group-label">${escHtml(grp.group)}</div>
      ${itemsHtml}`;
  });

  const html = `
    <div class="nav-overlay" id="navOverlay" onclick="tutupDrawer()"></div>
    <div class="nav-drawer" id="navDrawer">
      <div class="nav-drawer-header">
        <a href="${NAV_BASE}index.html" style="text-decoration:none">
          <div class="brand">SIEO</div>
          <div class="brand-sub">PT. Elim Citra Offset</div>
        </a>
        <button class="nav-drawer-close" onclick="tutupDrawer()" aria-label="Tutup">✕</button>
      </div>
      <div class="nav-drawer-body">
        ${groupsHtml}
      </div>
      <div class="nav-drawer-footer">
        <button class="btn-logout-full" onclick="konfirmasiLogout()">Logout</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);
}

// ----------------------------------------------------------
// 4. DRAWER CONTROL
// ----------------------------------------------------------
function bukaDrawer() {
  const ov = document.getElementById('navOverlay');
  const dr = document.getElementById('navDrawer');
  if (ov) ov.classList.add('open');
  if (dr) dr.classList.add('open');
}

function tutupDrawer() {
  const ov = document.getElementById('navOverlay');
  const dr = document.getElementById('navDrawer');
  if (ov) ov.classList.remove('open');
  if (dr) dr.classList.remove('open');
}

function konfirmasiLogout() {
  if (confirm('Yakin ingin logout?')) {
    logout();
  }
}

// ----------------------------------------------------------
// 5. CEK KONEKSI SUPABASE (dot indicator di topbar)
// ----------------------------------------------------------
function cekKoneksiNav() {
  const dot = document.getElementById('navDbDot');
  if (!dot || typeof dbGet !== 'function') return;
  dbGet('m_item', { select: 'id_item', limit: 1 })
    .then(function (res) {
      if (Array.isArray(res)) {
        dot.className = 'db-dot online';
        dot.title = 'Supabase: Online';
      } else {
        throw new Error('unexpected response');
      }
    })
    .catch(function () {
      dot.className = 'db-dot offline';
      dot.title = 'Supabase: Offline';
    });
}

// ----------------------------------------------------------
// 6. ENTRY POINT
// Panggil initNav('key_halaman') setelah guardHalaman() sukses.
// pageTitle opsional — kalau tidak diisi, dicari otomatis dari NAV_MENU.
// ----------------------------------------------------------
function initNav(activeKey, pageTitleOverride) {
  let pageTitle = pageTitleOverride;
  if (!pageTitle) {
    for (const grp of NAV_MENU) {
      const found = grp.items.find(function (it) { return it.key === activeKey; });
      if (found) { pageTitle = found.label; break; }
    }
  }
  if (!pageTitle) pageTitle = 'SIEO';

  renderTopbar(pageTitle);
  renderDrawer(activeKey);
  cekKoneksiNav();
  setInterval(cekKoneksiNav, 60000);
  initNotifNav();
}
// ----------------------------------------------------------
// 7. LONCENG NOTIFIKASI — pekerjaan tertunda per role
// Sumber: RPC get_notif_pending() (role dibaca di server dari JWT).
// Cache 60 detik di sessionStorage (per email) supaya pindah halaman
// tidak memanggil RPC berulang; refresh saat app kembali aktif.
// Halaman lain bisa memaksa refresh: refreshNotifNav()
// ----------------------------------------------------------
const NOTIF_TTL_MS = 60000;
let _notifRows = [];
let _notifTs = 0;

function _notifKey() {
  const info = (typeof getUserInfo === 'function') ? getUserInfo() : null;
  return 'sieo_notif_' + (info && info.email ? info.email : 'anon');
}

function _notifFmtRp(n) {
  if (typeof formatRupiah === 'function') return formatRupiah(n);
  return 'Rp ' + Number(n || 0).toLocaleString('id-ID');
}

function _notifCss() {
  if (document.getElementById('navNotifCss')) return;
  const st = document.createElement('style');
  st.id = 'navNotifCss';
  st.textContent =
    '.nav-bell{position:relative;background:none;border:none;font-size:1.05rem;line-height:1;cursor:pointer;padding:.25rem .4rem;margin-right:.15rem;color:inherit;}' +
    '.nav-bell-badge{position:absolute;top:-3px;right:-4px;min-width:17px;height:17px;padding:0 4px;border-radius:9px;background:#e03131;color:#fff;font-family:var(--mono,monospace);font-size:.58rem;font-weight:700;line-height:17px;text-align:center;box-shadow:0 0 0 2px var(--navy,#1a2b4c);}' +
    '.nav-notif-panel{position:fixed;z-index:10050;right:8px;width:min(340px,calc(100vw - 16px));max-height:70vh;overflow-y:auto;background:#fff;border:1px solid var(--border,#dde2ea);border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.18);display:none;}' +
    '.nav-notif-panel.open{display:block;}' +
    '.nn-head{display:flex;justify-content:space-between;align-items:center;padding:.6rem .8rem;border-bottom:1px solid var(--border,#dde2ea);font-family:var(--mono,monospace);font-size:.72rem;font-weight:700;color:var(--navy,#1a2b4c);text-transform:uppercase;letter-spacing:.05em;}' +
    '.nn-head button{background:none;border:1px solid var(--border,#dde2ea);border-radius:5px;font-size:.72rem;padding:.1rem .45rem;cursor:pointer;}' +
    '.nn-item{display:flex;justify-content:space-between;gap:.6rem;align-items:center;padding:.65rem .8rem;border-bottom:1px solid var(--border,#eef1f5);text-decoration:none;color:var(--navy,#1a2b4c);}' +
    '.nn-item:last-child{border-bottom:none;} .nn-item:active,.nn-item:hover{background:#f4f7fc;}' +
    '.nn-item .nn-l{font-size:.8rem;font-weight:600;} .nn-item .nn-s{font-family:var(--mono,monospace);font-size:.65rem;color:var(--muted,#6b7a90);margin-top:.1rem;}' +
    '.nn-item .nn-n{font-family:var(--mono,monospace);font-size:.8rem;font-weight:700;background:#fdecea;color:#c0392b;border-radius:12px;padding:.1rem .55rem;white-space:nowrap;}' +
    '.nn-item.info .nn-n{background:#f0f2f6;color:var(--muted,#6b7a90);}' +
    '.nn-empty{padding:1rem .8rem;font-size:.8rem;color:var(--green,#1a7a3f);text-align:center;}' +
    '.nn-foot{padding:.4rem .8rem;font-family:var(--mono,monospace);font-size:.6rem;color:var(--muted,#6b7a90);border-top:1px solid var(--border,#eef1f5);}';
  document.head.appendChild(st);
}

function initNotifNav() {
  if (typeof dbRpc !== 'function') return;
  _notifCss();
  const panel = document.createElement('div');
  panel.className = 'nav-notif-panel';
  panel.id = 'navNotifPanel';
  document.body.appendChild(panel);
  document.addEventListener('click', function (e) {
    const p = document.getElementById('navNotifPanel');
    const b = document.getElementById('navBell');
    if (p && p.classList.contains('open') && !p.contains(e.target) && b && !b.contains(e.target)) p.classList.remove('open');
  });
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) muatNotifNav(false);
  });
  setInterval(function () { if (!document.hidden) muatNotifNav(false); }, 5 * 60000);
  muatNotifNav(false);
}

function muatNotifNav(force) {
  if (!force) {
    try {
      const c = JSON.parse(sessionStorage.getItem(_notifKey()) || 'null');
      if (c && Array.isArray(c.rows) && (Date.now() - c.ts) < NOTIF_TTL_MS) {
        _notifRows = c.rows; _notifTs = c.ts; renderNotifNav();
        return Promise.resolve();
      }
    } catch (e) { /* abaikan cache rusak */ }
  }
  // get_notif_kas_kecil (top-up kas kecil, Okt 2026) digabung; kalau RPC-nya belum ada → diabaikan
  const pKas = dbRpc('get_notif_kas_kecil', {})
    .then(function (r) { return Array.isArray(r) ? r : []; })
    .catch(function () { return []; });
  return Promise.all([dbRpc('get_notif_pending', {}), pKas])
    .then(function (hasil) {
      let res = hasil[0];
      if (!Array.isArray(res)) throw new Error('notif tidak tersedia');
      res = res.concat(hasil[1]);
      _notifRows = res; _notifTs = Date.now();
      try { sessionStorage.setItem(_notifKey(), JSON.stringify({ ts: _notifTs, rows: res })); } catch (e) {}
      renderNotifNav();
    })
    .catch(function () {
      // RPC belum ada / error → sembunyikan lonceng, jangan ganggu halaman
      const b = document.getElementById('navBell');
      if (b) b.style.display = 'none';
    });
}

function refreshNotifNav() {
  try { sessionStorage.removeItem(_notifKey()); } catch (e) {}
  return muatNotifNav(true);
}

function renderNotifNav() {
  const bell = document.getElementById('navBell');
  const badge = document.getElementById('navBellBadge');
  const panel = document.getElementById('navNotifPanel');
  if (!bell || !badge || !panel) return;
  bell.style.display = '';
  const nAksi = _notifRows.reduce(function (s, r) { return s + (r.level === 'AKSI' ? (Number(r.jumlah) || 0) : 0); }, 0);
  badge.textContent = nAksi > 99 ? '99+' : String(nAksi);
  badge.style.display = nAksi > 0 ? '' : 'none';
  bell.title = nAksi > 0 ? nAksi + ' pekerjaan menunggu' : 'Tidak ada pekerjaan tertunda';

  const items = _notifRows.map(function (r) {
    const info = r.level !== 'AKSI';
    return '<a class="nn-item' + (info ? ' info' : '') + '" href="' + NAV_BASE + escHtml(r.url || 'index.html') + '" onclick="tutupNotifNav()">' +
      '<div><div class="nn-l">' + escHtml(r.label) + '</div>' +
      '<div class="nn-s">' + (Number(r.nominal) ? _notifFmtRp(r.nominal) + ' · ' : '') + (info ? 'info' : 'perlu tindakan') + '</div></div>' +
      '<div class="nn-n">' + escHtml(String(r.jumlah)) + '</div></a>';
  }).join('');
  const jam = _notifTs ? new Date(_notifTs).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
  panel.innerHTML =
    '<div class="nn-head"><span>Pekerjaan Tertunda</span><button onclick="refreshNotifNav()">↻</button></div>' +
    (items || '<div class="nn-empty">Tidak ada pekerjaan tertunda ✓</div>') +
    '<div class="nn-foot">Diperbarui ' + jam + '</div>';
}

function toggleNotifNav(e) {
  if (e) e.stopPropagation();
  const p = document.getElementById('navNotifPanel');
  const b = document.getElementById('navBell');
  if (!p || !b) return;
  if (p.classList.contains('open')) { p.classList.remove('open'); return; }
  const r = b.getBoundingClientRect();
  p.style.top = (r.bottom + 6) + 'px';
  p.classList.add('open');
  if (Date.now() - _notifTs > NOTIF_TTL_MS) muatNotifNav(true);
}

function tutupNotifNav() {
  const p = document.getElementById('navNotifPanel');
  if (p) p.classList.remove('open');
}