import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearStoreSupabase } from '../js/datos/store-supabase.js';
import { ErrorJuego } from '../js/logica/estado.js';
import { ASISTENTES_EJEMPLO } from '../js/contenido/asistentes-ejemplo.js';

const tick = () => new Promise(r => setTimeout(r, 0));
// Cliente Supabase falso: una tabla "sesion" en memoria y un canal realtime.
function falso({ conflictosForzados = 0 } = {}) {
  const filas = new Map(); const oyentes = []; let forzar = conflictosForzados;
  const avisar = (fila) => oyentes.forEach(cb => cb({ new: structuredClone(fila) }));
  return {
    filas, oyentes,
    from() {
      return {
        select() { return { eq: (_, id) => ({ maybeSingle: async () => { await tick(); return { data: filas.has(id) ? structuredClone(filas.get(id)) : null, error: null }; } }) }; },
        insert(fila) { return { then: (ok) => { if (!filas.has(fila.id)) filas.set(fila.id, structuredClone(fila)); ok({ error: null }); } }; },
        update(cambios) {
          const conds = {};
          const q = { eq: (k, v) => { conds[k] = v; return q; }, select: async () => {
            await tick();
            const f = filas.get(conds.id);
            if (!f || ('version' in conds && f.version !== conds.version) || forzar-- > 0) return { data: [], error: null };
            Object.assign(f, structuredClone(cambios)); avisar(f); return { data: [structuredClone(f)], error: null };
          } };
          return q;
        },
      };
    },
    channel() { const ch = { on: (_e, _f, cb) => { oyentes.push(cb); return ch; }, subscribe: () => ch }; return ch; },
    removeChannel() {},
  };
}
const cfg = { sesionId: 'lab-test' };

test('crea la fila si no existe y dispatch escribe version+1', async () => {
  const c = falso();
  const s = await crearStoreSupabase({ config: cfg, asistentes: ASISTENTES_EJEMPLO, cliente: c, sondeoMs: 0 });
  assert.equal(c.filas.get('lab-test').version, 1);
  await s.dispatch('ingresar', { asistente: 'p01' });
  assert.equal(c.filas.get('lab-test').version, 2);
  assert.ok(c.filas.get('lab-test').estado.asistentes.p01.ingreso);
  s.cerrar();
});

test('conflicto de versión reintenta y conserva ambos cambios', async () => {
  const c = falso();
  const a = await crearStoreSupabase({ config: cfg, asistentes: ASISTENTES_EJEMPLO, cliente: c, sondeoMs: 0 });
  const b = await crearStoreSupabase({ config: cfg, asistentes: ASISTENTES_EJEMPLO, cliente: c, sondeoMs: 0 });
  await Promise.all([a.dispatch('guardarPalabra', { asistente: 'p01', texto: 'uno' }), b.dispatch('guardarPalabra', { asistente: 'p02', texto: 'dos' })]);
  const e = c.filas.get('lab-test').estado;
  assert.equal(e.palabras.p01, 'uno'); assert.equal(e.palabras.p02, 'dos');
  a.cerrar(); b.cerrar();
});

test('tras 5 conflictos rechaza con ErrorJuego "conflicto"', async () => {
  const c = falso({ conflictosForzados: 5 });
  const s = await crearStoreSupabase({ config: cfg, asistentes: ASISTENTES_EJEMPLO, cliente: c, sondeoMs: 0 });
  await assert.rejects(s.dispatch('ingresar', { asistente: 'p01' }), (e) => e instanceof ErrorJuego && e.codigo === 'conflicto');
  s.cerrar();
});

test('cambio Realtime notifica a suscriptores', async () => {
  const c = falso();
  const a = await crearStoreSupabase({ config: cfg, asistentes: ASISTENTES_EJEMPLO, cliente: c, sondeoMs: 0 });
  const b = await crearStoreSupabase({ config: cfg, asistentes: ASISTENTES_EJEMPLO, cliente: c, sondeoMs: 0 });
  let visto = null; b.subscribe(e => (visto = e));
  await a.dispatch('guardarPalabra', { asistente: 'p03', texto: 'rigor' });
  assert.equal(visto.palabras.p03, 'rigor');
  a.cerrar(); b.cerrar();
});

test('acción inválida rechaza sin escribir', async () => {
  const c = falso();
  const s = await crearStoreSupabase({ config: cfg, asistentes: ASISTENTES_EJEMPLO, cliente: c, sondeoMs: 0 });
  await assert.rejects(s.dispatch('unirseReto', { asistente: 'p01', reto: 'R77' }), (e) => e.codigo === 'reto-no-existe');
  assert.equal(c.filas.get('lab-test').version, 1);
  s.cerrar();
});

test('fila sembrada vacía se llena con la lista de asistentes', async () => {
  const c = falso();
  c.filas.set('lab-test', { id: 'lab-test', estado: {}, version: 0 });
  const s = await crearStoreSupabase({ config: cfg, asistentes: ASISTENTES_EJEMPLO, cliente: c, sondeoMs: 0 });
  assert.equal(Object.keys(s.getEstado().asistentes).length, 18);
  assert.equal(c.filas.get('lab-test').version, 1);
  s.cerrar();
});
