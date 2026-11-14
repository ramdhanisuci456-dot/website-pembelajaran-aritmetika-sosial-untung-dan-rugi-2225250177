export const rp = (n) => 'Rp' + Number(n).toLocaleString('id-ID');

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Membaca angka gaya Indonesia: "Rp20.000" -> 20000, "12,5%" -> 12.5
export function parseAngka(input) {
  let t = String(input).toLowerCase().replace(/rp|%|\s/g, '');
  if (!t) return NaN;
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) t = t.replace(/\./g, '').replace(',', '.');
  else t = t.replace(',', '.');
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

export const PALET = [
  ['#dbeafe', '#2563eb'],
  ['#ffedd5', '#ea580c'],
  ['#dcfce7', '#16a34a'],
  ['#fae8ff', '#a21caf'],
];
