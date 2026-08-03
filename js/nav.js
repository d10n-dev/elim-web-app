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
      { key: 'gajian', label: 'Gajian', icon: '💵', href: 'pages/gajian.html', role: ['DIREKTUR'] },
    ]
  },
  {
    group: 'Master',
    items: [
      { key: 'pelanggan', label: 'Pelanggan', icon: '🏢', href: 'pages/pelanggan.html' },
      { key: 'item',      label: 'Item',       icon: '📦', href: 'pages/item.html' },
      { key: 'bahan',     label: 'Bahan',      icon: '🧱', href: 'pages/bahan.html' },
      { key: 'tinta',     label: 'Tinta',      icon: '🎨', href: 'pages/tinta.html' },
      { key: 'bom',       label: 'BOM',        icon: '📋', href: 'pages/bom.html' },
      { key: 'operator',  label: 'Operator',   icon: '👤', href: 'pages/operator.html' },
    ]
  },
  {
    group: 'Sistem',
    items: [
      { key: 'user_management', label: 'User Management', icon: '👥', href: 'pages/user_management.html', role: ['DIREKTUR'] },
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
}
