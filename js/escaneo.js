import { normalizarCodigo } from './contenido/cartas.js';

// QR y NFC abren la MISMA dirección: <urlPublica>?c=L05. El celular abre una pestaña nueva con ese código.
// Aquí se lee el código, se guarda como "pendiente" (por si la persona aún no se identifica)
// y se limpia la barra de direcciones para que recargar no vuelva a jugar la carta.
const CLAVE = 'lab-pendiente';

export function capturarCodigoDeUrl(storage, loc = globalThis.location, hist = globalThis.history) {
  const params = new URLSearchParams(loc.search);
  const bruto = params.get('c');
  if (bruto == null) return null;
  const codigo = normalizarCodigo(bruto);
  params.delete('c');
  const resto = params.toString();
  try { hist.replaceState(null, '', loc.pathname + (resto ? '?' + resto : '') + loc.hash); } catch { /* sin history: no pasa nada */ }
  // Un código ilegible también se guarda, para avisar en pantalla en vez de ignorarlo en silencio.
  const pendiente = { codigo, bruto: String(bruto).slice(0, 12) };
  try { storage.setItem(CLAVE, JSON.stringify(pendiente)); } catch { /* sin almacenamiento */ }
  return pendiente;
}

export function tomarPendiente(storage) {
  try {
    const v = JSON.parse(storage.getItem(CLAVE));
    storage.removeItem(CLAVE);
    return v && typeof v === 'object' ? v : null;
  } catch { return null; }
}
