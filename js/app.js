import { config } from './config.js';
import { ASISTENTES_EJEMPLO } from './contenido/asistentes-ejemplo.js';
import { crearStore, identidad } from './datos/crear-store.js';
import { montarCliente } from './vistas/cliente.js';
import { capturarCodigoDeUrl, tomarPendiente } from './escaneo.js';

const VISTAS = {
  cliente: async (raiz, store, yo, almacen) => montarCliente(raiz, store, yo, tomarPendiente(almacen)),
  proyector: async (raiz, store) => (await import('./vistas/proyector.js')).montarProyector(raiz, store),
  facilitador: async (raiz, store) => (await import('./vistas/facilitador.js')).montarFacilitador(raiz, store),
};
const vistaActual = () => (location.hash.replace('#', '') in VISTAS ? location.hash.replace('#', '') : 'cliente');

// En demo cada pestaña es una persona distinta (sessionStorage); en el evento real, localStorage,
// porque cada QR o NFC abre una pestaña nueva y debe reconocer a la misma persona.
function almacenIdentidad() {
  const preferido = config.modo === 'demo' ? 'sessionStorage' : 'localStorage';
  try { const s = globalThis[preferido]; s.setItem('lab-prueba', '1'); s.removeItem('lab-prueba'); return s; }
  catch { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; }
}

async function iniciar() {
  const raiz = document.getElementById('app');
  const almacen = almacenIdentidad();
  // Lo primero: si se abrió desde un QR o NFC (?c=L05), guardar el código antes de cualquier otra cosa.
  if (capturarCodigoDeUrl(almacen) && location.hash) location.hash = '';
  const store = await crearStore(config, ASISTENTES_EJEMPLO);
  const yo = identidad(almacen);
  let desmontar = null;
  async function montar() {
    desmontar?.();
    raiz.replaceChildren();
    document.body.dataset.vista = vistaActual();
    desmontar = await VISTAS[vistaActual()](raiz, store, yo, almacen);
  }
  window.addEventListener('hashchange', montar);
  if (config.modo === 'demo') {
    window.__lab = { store, yo };
    document.body.classList.add('con-demo');
    const { montarBarraDemo } = await import('./vistas/barra-demo.js');
    montarBarraDemo(document.getElementById('demo'), store, yo, () => montar());
  }
  await montar();
}

iniciar().catch((e) => {
  console.error(e);
  document.getElementById('app').textContent = 'No pudimos cargar la plataforma. Recarga la página o pide ayuda al equipo de Sage.';
});
