import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearStoreDemo } from '../js/datos/store-demo.js';
import { identidad } from '../js/datos/crear-store.js';
import { ErrorJuego } from '../js/logica/estado.js';
import { ASISTENTES_EJEMPLO } from '../js/contenido/asistentes-ejemplo.js';

function almacen() { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; }
const espera = (ms = 30) => new Promise(r => setTimeout(r, ms));

test('dispatch notifica a los suscriptores', async () => {
  const s = await crearStoreDemo({ asistentes: ASISTENTES_EJEMPLO, storage: almacen(), canal: 'c1' });
  let visto = null; s.subscribe(e => (visto = e));
  await s.dispatch('ingresar', { asistente: 'p01' });
  assert.ok(visto.asistentes.p01.ingreso);
  s.cerrar();
});

test('dos stores en el mismo canal ven el mismo estado tras dispatch', async () => {
  const st = almacen();
  const a = await crearStoreDemo({ asistentes: ASISTENTES_EJEMPLO, storage: st, canal: 'c2' });
  const b = await crearStoreDemo({ asistentes: ASISTENTES_EJEMPLO, storage: st, canal: 'c2' });
  let vistoB = null; b.subscribe(e => (vistoB = e));
  await a.dispatch('guardarPalabra', { asistente: 'p02', texto: 'confianza' });
  await espera();
  assert.equal(vistoB.palabras.p02, 'confianza');
  a.cerrar(); b.cerrar();
});

test('demo: identidad persiste tras recarga', async () => {
  const st = almacen();
  const a = await crearStoreDemo({ asistentes: ASISTENTES_EJEMPLO, storage: st, canal: 'c3' });
  const yo = identidad(st);
  yo.set('p03', 0);
  await a.dispatch('ingresar', { asistente: 'p03' });
  await a.dispatch('unirseReto', { asistente: 'p03', reto: 'R02' });
  a.cerrar();
  const b = await crearStoreDemo({ asistentes: ASISTENTES_EJEMPLO, storage: st, canal: 'c3' });
  assert.equal(identidad(st).get().id, 'p03');
  assert.equal(b.getEstado().asistentes.p03.equipo, 'R02');
  b.cerrar();
});

test('dispatch de acción inválida rechaza y no cambia el estado', async () => {
  const s = await crearStoreDemo({ asistentes: ASISTENTES_EJEMPLO, storage: almacen(), canal: 'c4' });
  const antes = JSON.stringify(s.getEstado());
  await assert.rejects(s.dispatch('unirseReto', { asistente: 'p01', reto: 'R77' }), ErrorJuego);
  assert.equal(JSON.stringify(s.getEstado()), antes);
  s.cerrar();
});

test('reset vuelve al estado inicial', async () => {
  const s = await crearStoreDemo({ asistentes: ASISTENTES_EJEMPLO, storage: almacen(), canal: 'c5' });
  await s.dispatch('ingresar', { asistente: 'p01' });
  await s.reset();
  assert.equal(s.getEstado().asistentes.p01.ingreso, null);
  s.cerrar();
});

test('demo: un estado guardado de la versión anterior se reemplaza', async () => {
  const st = almacen();
  st.setItem('lab-estado', JSON.stringify({ fase: 'ronda2', grupos: {}, asistentes: {} }));
  const s = await crearStoreDemo({ asistentes: ASISTENTES_EJEMPLO, storage: st, canal: 'c9' });
  assert.equal(s.getEstado().fase, 'llegada');
  assert.equal(Object.keys(s.getEstado().asistentes).length, 18);
  s.cerrar();
});
