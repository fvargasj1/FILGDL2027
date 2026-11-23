import { test } from 'node:test';
import assert from 'node:assert/strict';
import { capturarCodigoDeUrl, tomarPendiente } from '../js/escaneo.js';

const almacen = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };
const historia = () => { const h = { url: null, replaceState: (_s, _t, u) => { h.url = u; } }; return h; };

test('lee ?c=, lo deja pendiente y limpia la dirección', () => {
  const st = almacen(), hist = historia();
  const p = capturarCodigoDeUrl(st, { search: '?c=l5', pathname: '/FILGDL2027/', hash: '' }, hist);
  assert.deepEqual(p, { codigo: 'L05', bruto: 'l5' });
  assert.equal(hist.url, '/FILGDL2027/');
  assert.deepEqual(tomarPendiente(st), { codigo: 'L05', bruto: 'l5' });
  assert.equal(tomarPendiente(st), null, 'se consume una sola vez');
});

test('sin ?c= no hace nada', () => {
  const st = almacen(), hist = historia();
  assert.equal(capturarCodigoDeUrl(st, { search: '', pathname: '/', hash: '#proyector' }, hist), null);
  assert.equal(hist.url, null);
});

test('código ilegible queda pendiente con codigo null para avisar', () => {
  const st = almacen();
  capturarCodigoDeUrl(st, { search: '?c=XYZ&x=1', pathname: '/', hash: '' }, historia());
  assert.deepEqual(tomarPendiente(st), { codigo: null, bruto: 'XYZ' });
});

test('conserva otros parámetros y el hash', () => {
  const hist = historia();
  capturarCodigoDeUrl(almacen(), { search: '?c=R01&utm=x', pathname: '/a/', hash: '#h' }, hist);
  assert.equal(hist.url, '/a/?utm=x#h');
});
