import { estadoInicial, aplicar, ErrorJuego, FORMATO } from '../logica/estado.js';
import { contextoReal } from './contexto.js';

const TABLA = 'sesion';
const INTENTOS = 5;

async function cargarCliente(config) {
  const { cargarLibreria } = await import('../cargar-libreria.js');
  const sb = await cargarLibreria('supabase');
  return sb.createClient(config.supabaseUrl, config.supabaseAnonKey);
}

// Toda la sesión vive en una fila jsonb. Cada acción: leer, aplicar la regla pura, escribir si la versión no cambió.
// Si otra persona escribió en medio, se relee y se reintenta (hasta 5 veces).
export async function crearStoreSupabase({ config, asistentes, cliente, ctx = contextoReal(), sondeoMs = 10000 }) {
  const db = cliente ?? await cargarCliente(config);
  const id = config.sesionId;
  const subs = new Set();
  let fila = null; // { estado, version }

  const notificar = () => { for (const cb of subs) cb(fila.estado); };
  const adoptar = (f) => { if (f && (!fila || f.version > fila.version)) { fila = { estado: f.estado, version: f.version }; notificar(); } };
  async function leer() {
    const { data, error } = await db.from(TABLA).select('estado, version').eq('id', id).maybeSingle();
    if (error) throw new ErrorJuego('red', 'Sin conexión. Revisa el wifi e intenta de nuevo.');
    return data;
  }

  let actual = await leer();
  if (!actual) {
    await db.from(TABLA).insert({ id, estado: estadoInicial(asistentes), version: 1 });
    actual = await leer();
  } else if (actual.estado?.formato !== FORMATO) {
    // fila sembrada vacía por schema.sql: se llena con la lista de asistentes de la app
    actual = (await escribirInicial(actual.version)) ?? await leer();
  }
  fila = { estado: actual.estado, version: actual.version };

  async function escribirInicial(v) { const r = await db.from(TABLA).update({ estado: estadoInicial(asistentes), version: v + 1 }).eq('id', id).eq('version', v).select(); return r.data?.[0] ?? null; }

  const canal = db.channel('lab-' + id)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: TABLA, filter: `id=eq.${id}` }, (p) => adoptar(p.new))
    .subscribe();
  // Respaldo por si Realtime se cae con el wifi del hotel.
  const refrescar = () => leer().then(adoptar).catch(() => {});
  const sondeo = sondeoMs ? setInterval(refrescar, sondeoMs) : null;
  const alVolver = () => { if (document.visibilityState === 'visible') refrescar(); };
  globalThis.document?.addEventListener('visibilitychange', alVolver);

  async function escribir(estado, version) {
    const { data, error } = await db.from(TABLA).update({ estado, version: version + 1, actualizado: new Date().toISOString() })
      .eq('id', id).eq('version', version).select();
    if (error) throw new ErrorJuego('red', 'Sin conexión. Revisa el wifi e intenta de nuevo.');
    return data?.[0] ?? null;
  }

  return {
    subscribe(cb) { subs.add(cb); cb(fila.estado); return () => subs.delete(cb); },
    getEstado: () => fila.estado,
    async dispatch(nombre, args) {
      for (let i = 0; i < INTENTOS; i++) {
        const base = i === 0 ? fila : await leer();
        const nuevo = aplicar(base.estado, nombre, args, ctx); // lanza ErrorJuego si la regla no lo permite
        const escrita = await escribir(nuevo, base.version);
        if (escrita) { adoptar(escrita); return; }
      }
      throw new ErrorJuego('conflicto', 'Mucha gente escribiendo a la vez. Intenta de nuevo.');
    },
    async reset() {
      const f = await leer();
      const escrita = await escribir(estadoInicial(asistentes), f.version);
      if (escrita) adoptar(escrita); else return this.reset();
    },
    cerrar() { clearInterval(sondeo); globalThis.document?.removeEventListener('visibilitychange', alVolver); db.removeChannel(canal); subs.clear(); },
  };
}
