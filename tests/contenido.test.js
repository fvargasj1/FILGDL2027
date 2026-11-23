import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RETOS, LIEBERT, ASISTENTE, EQUIPOS, buscar, normalizarCodigo, urlImpresa, esCarta, esReto } from '../js/contenido/cartas.js';
import { PREGUNTAS, CONTACTO_TEXTO } from '../js/contenido/encuesta.js';
import { ASISTENTES_EJEMPLO } from '../js/contenido/asistentes-ejemplo.js';
import { config } from '../js/config.js';

const unicos = (xs) => new Set(xs).size === xs.length;
const TODOS = [...RETOS, ...LIEBERT, ...ASISTENTE];

test('mazo impreso: 10 retos, 30 Liebert, 18 asistente; códigos consecutivos', () => {
  assert.equal(RETOS.length, 10);
  assert.equal(LIEBERT.length, 30);
  assert.equal(ASISTENTE.length, 18);
  const seq = (p, n) => Array.from({ length: n }, (_, i) => p + String(i + 1).padStart(2, '0'));
  assert.deepEqual(RETOS.map(r => r.codigo), seq('R', 10));
  assert.deepEqual(LIEBERT.map(r => r.codigo), seq('L', 30));
  assert.deepEqual(ASISTENTE.map(r => r.codigo), seq('A', 18));
});

test('con 2 copias alcanza para manos de 3 Liebert y 2 asistente para 18 personas', () => {
  assert.ok(LIEBERT.length * 2 >= 18 * 3);
  assert.ok(ASISTENTE.length * 2 >= 18 * 2);
});

test('equipos con nombres de recursos de Sage, únicos', () => {
  assert.ok(unicos(Object.values(EQUIPOS)));
  assert.equal(EQUIPOS.R01, 'Campus');
});

test('retos no nombran los recursos (se descubren jugando)', () => {
  for (const r of RETOS) assert.doesNotMatch(r.texto, /Liebert|Sage|Research Methods|asistente de investigaci/i);
});

test('buscar y normalizar códigos', () => {
  assert.equal(normalizarCodigo(' l5 '), 'L05');
  assert.equal(normalizarCodigo('a123'), null);
  assert.equal(normalizarCodigo('a012'), 'A12');
  assert.equal(normalizarCodigo('L31'), null);
  assert.equal(normalizarCodigo('R10'), 'R10');
  assert.equal(normalizarCodigo('hola'), null);
  assert.equal(buscar('L01').tipo, 'liebert');
  assert.equal(buscar('L01').url, config.liebertBaseUrl);
  assert.equal(buscar('A01').url, config.metodosUrl);
  assert.ok(esCarta('A18') && !esCarta('R01') && esReto('R01'));
});

test('URL impresa: base de GitHub Pages + ?c=CÓDIGO, corta para QR legible', () => {
  assert.match(config.urlPublica, /^https:\/\/.+\/$/);
  assert.equal(urlImpresa('L05'), config.urlPublica + '?c=L05');
  for (const c of TODOS) assert.ok(urlImpresa(c.codigo).length <= 60);
});

test('textos caben en la carta impresa', () => {
  for (const l of LIEBERT) { assert.ok(l.titulo.length <= 52, l.codigo); assert.ok(l.descripcion.length <= 120, l.codigo); }
  for (const a of ASISTENTE) { assert.ok(a.titulo.length <= 26, a.codigo); assert.ok(a.descripcion.length <= 120, a.codigo); assert.ok(a.pruebalo.length <= 90, a.codigo); }
  for (const r of RETOS) assert.ok(r.texto.length <= 130, r.codigo);
});

test('encuesta y asistentes de ejemplo', () => {
  assert.equal(PREGUNTAS.length, 5);
  assert.ok(CONTACTO_TEXTO.length > 0);
  assert.equal(ASISTENTES_EJEMPLO.length, 18);
  assert.ok(unicos(ASISTENTES_EJEMPLO.map(a => a.id)));
});

test('ningún texto usa el punto medio', () => {
  const todo = JSON.stringify([TODOS, PREGUNTAS, CONTACTO_TEXTO, ASISTENTES_EJEMPLO, config]);
  assert.ok(!todo.includes('·'));
});
