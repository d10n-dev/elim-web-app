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