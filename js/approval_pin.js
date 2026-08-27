// ============================================================
// SIEO — approval-pin.js
// Modal konfirmasi + input PIN untuk aksi approval sensitif.
// Menggantikan confirm() native (tidak reliable di Android Chrome
// saat dipicu dari elemen hasil re-render innerHTML).
//
// Load setelah: bootstrap.bundle.js, css/sieo.css (pakai var --navy dst),
// api.js, utils.js. Tidak butuh nav.js.
//
// Pakai di halaman:
//   var pin = await mintaApprovalPin('Approve alokasi XYZ?');
//   if (!pin) return; // user batal
//   // pin = string 4-6 digit, kirim sebagai p_pin ke RPC
// ============================================================
(function () {
  var _modalEl = null, _resolver = null;

  function _pastikanModal() {
    if (_modalEl) return _modalEl;
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="modal fade" id="mdApprovalPin" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">' +
        '<div class="modal-dialog modal-dialog-centered" style="max-width:340px">' +
          '<div class="modal-content">' +
            '<div class="modal-header py-2">' +
              '<h6 class="modal-title" style="font-family:var(--mono);font-size:.85rem;margin:0">🔐 Konfirmasi Approval</h6>' +
              '<button type="button" class="btn-close" onclick="_apPinBatal()"></button>' +
            '</div>' +
            '<div class="modal-body">' +
              '<div id="apPinPesan" style="font-size:.82rem;margin-bottom:.7rem;color:var(--navy)"></div>' +
              '<input type="password" id="apPinInput" inputmode="numeric" pattern="[0-9]*" maxlength="6" ' +
                     'placeholder="Masukkan PIN" autocomplete="off" ' +
                     'style="width:100%;font-family:var(--mono);font-size:1.15rem;letter-spacing:.35em;text-align:center;' +
                     'padding:.55rem;border:1px solid var(--border);border-radius:6px;box-sizing:border-box"/>' +
              '<div id="apPinErr" style="color:var(--red);font-size:.72rem;margin-top:.4rem;min-height:1.1em"></div>' +
            '</div>' +
            '<div class="modal-footer py-2">' +
              '<button type="button" class="btn-outline" onclick="_apPinBatal()">Batal</button>' +
              '<button type="button" class="btn-navy" onclick="_apPinKonfirmasi()">Konfirmasi</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap.firstElementChild);
    _modalEl = document.getElementById('mdApprovalPin');
    document.getElementById('apPinInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); _apPinKonfirmasi(); }
    });
    _modalEl.addEventListener('hidden.bs.modal', function () {
      // Kalau modal ditutup lewat cara lain (mis. tombol back Android) tanpa lewat
      // tombol Batal/Konfirmasi, tetap resolve null supaya promise tidak nggantung.
      if (_resolver) { _resolver(null); _resolver = null; }
    });
    return _modalEl;
  }

  window.mintaApprovalPin = function (pesan) {
    _pastikanModal();
    document.getElementById('apPinPesan').textContent = pesan || 'Konfirmasi aksi ini?';
    var inp = document.getElementById('apPinInput');
    inp.value = '';
    document.getElementById('apPinErr').textContent = '';
    var inst = bootstrap.Modal.getOrCreateInstance(_modalEl);
    inst.show();
    setTimeout(function () { inp.focus(); }, 300);
    return new Promise(function (resolve) { _resolver = resolve; });
  };

  window._apPinKonfirmasi = function () {
    var v = document.getElementById('apPinInput').value.trim();
    if (!/^[0-9]{4,6}$/.test(v)) {
      document.getElementById('apPinErr').textContent = 'PIN harus 4-6 digit angka.';
      return;
    }
    var resolver = _resolver;
    _resolver = null; // cegah hidden.bs.modal ikut resolve(null) setelah ini
    bootstrap.Modal.getOrCreateInstance(_modalEl).hide();
    if (resolver) resolver(v);
  };

  window._apPinBatal = function () {
    var resolver = _resolver;
    _resolver = null;
    bootstrap.Modal.getOrCreateInstance(_modalEl).hide();
    if (resolver) resolver(null);
  };
})();