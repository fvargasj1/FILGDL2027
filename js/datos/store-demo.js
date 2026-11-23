import { estadoInicial, aplicar, normalizarEstado } from '../logica/estado.js';
import { contextoReal } from './contexto.js';

// Modo demo: el estado vive en localStorage y se sincroniza entre pestañas con BroadcastChannel.
export async function crearStoreDemo({ asistentes, storage = globalThis.localStorage, canal = 'lab', clave = 'lab-estado', ctx = contextoReal() }) {
  const subs = new Set();
  const leer = () => { try { const t = storage.getItem(clave); return t ? JSON.parse(t) : null; } catch { return null; } };
  let estado = normalizarEstado(leer(), asistentes);
  const guardar = () => { try { storage.setItem(clave, JSON.stringify(estado)); } catch { /* sin almacenamiento: queda en memoria */ } };
  guardar();
  const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(canal) : null;
  const notificar = () => { for (const cb of subs) cb(estado); };
  // _rev ordena las versiones: el aviso entre pestañas trae el estado completo, porque el almacenamiento
  // local puede llegar más tarde que el aviso. Nunca se adopta una versión más vieja que la que se tiene.
  const rev = (e) => e?._rev ?? 0;
  const masNuevo = (a, b) => (rev(a) >= rev(b) ? a : b);
  const publicar = () => { guardar(); bc?.postMessage(estado); notificar(); };
  if (bc) bc.onmessage = (ev) => { const llega = ev.data && typeof ev.data === 'object' ? ev.data : leer(); if (llega && rev(llega) > rev(estado)) { estado = llega; notificar(); } };

  return {
    subscribe(cb) { subs.add(cb); cb(estado); return () => subs.delete(cb); },
    getEstado: () => estado,
    async dispatch(nombre, args) {
      const actual = normalizarEstado(masNuevo(estado, leer()), asistentes); // otra pestaña pudo cambiarlo
      const nuevo = aplicar(actual, nombre, args, ctx); // lanza ErrorJuego sin tocar el estado
      nuevo._rev = rev(actual) + 1;
      estado = nuevo; publicar();
    },
    async reset() { const r = rev(masNuevo(estado, leer())) + 1; estado = { ...estadoInicial(asistentes), _rev: r }; publicar(); },
    cerrar() { bc?.close(); subs.clear(); },
  };
}
