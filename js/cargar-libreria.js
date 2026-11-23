// Carga una librería externa desde la CDN y, si falla, desde la copia local en vendor/.
const LIBRERIAS = {
  xlsx: ['https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js', 'vendor/xlsx.full.min.js', 'XLSX'],
  qrcode: ['https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js', 'vendor/qrcode.js', 'qrcode'],
  supabase: ['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.2/dist/umd/supabase.js', 'vendor/supabase.js', 'supabase'],
};
const promesas = {};
const script = (src) => new Promise((ok, mal) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => { s.remove(); mal(new Error('No cargó ' + src)); }; document.head.append(s); });

export function cargarLibreria(nombre) {
  const [cdn, local, global] = LIBRERIAS[nombre];
  if (globalThis[global]) return Promise.resolve(globalThis[global]);
  return (promesas[nombre] ??= script(cdn).catch(() => script(local)).then(() => globalThis[global]));
}
