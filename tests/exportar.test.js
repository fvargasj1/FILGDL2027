import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estadoInicial, aplicar } from '../js/logica/estado.js';
import { filasExport } from '../js/exportar.js';
import { ASISTENTES_EJEMPLO } from '../js/contenido/asistentes-ejemplo.js';
import { PREGUNTAS } from '../js/contenido/encuesta.js';
import { ctx } from './helpers.js';

function armar() {
  const c = ctx(5); let e = estadoInicial(ASISTENTES_EJEMPLO);
  const r = (n, a) => (e = aplicar(e, n, a, c));
  r('ingresar', { asistente: 'p01' }); r('ingresar', { asistente: 'p02' });
  r('guardarPalabra', { asistente: 'p01', texto: 'Aliado' });
  r('cambiarFase', { fase: 'ronda1' });
  r('unirseReto', { asistente: 'p01', reto: 'R01' });
  r('unirseReto', { asistente: 'p02', reto: 'R01' });
  r('responderReto', { asistente: 'p01', pasa: 'si', comentario: 'En enfermería sobre todo' });
  r('cambiarFase', { fase: 'ronda2' });
  r('jugarCarta', { asistente: 'p02', carta: 'L23' });
  r('marcarClave', { jugada: e.jugadas[0].id });
  r('guardarMotivo', { equipo: 'R01', texto: 'Abre la puerta a salud digital' });
  r('guardarEncuesta', { asistente: 'p01', respuestas: { p1: 'Confiable', p4: 4, contacto: true } });
  return e;
}

test('filasExport arma las 6 hojas con encabezados en español', () => {
  const h = filasExport(armar());
  assert.deepEqual(Object.keys(h), ['Asistentes', 'Palabras', 'Equipos', 'Retos por persona', 'Cartas jugadas', 'Encuesta']);
  assert.equal(h.Asistentes.length, 18);
  assert.deepEqual(Object.keys(h.Asistentes[0]), ['Nombre', 'Institución', 'Correo', 'País', 'Ingresó', 'Equipo']);
  assert.equal(h.Asistentes[0].Equipo, 'Campus');
  assert.deepEqual(h.Palabras, [{ Nombre: 'Ana María Restrepo', Palabra: 'Aliado' }]);
  assert.equal(h.Equipos.length, 1);
  assert.equal(h.Equipos[0].Integrantes, 'Ana María Restrepo, Carlos Mendoza');
  assert.equal(h.Equipos[0]['Carta clave'], 'L23 Telemedicine and e-Health');
  assert.equal(h.Equipos[0]['Por qué la carta clave'], 'Abre la puerta a salud digital');
  const rp = h['Retos por persona'];
  assert.equal(rp.length, 1);
  assert.equal(rp[0]['¿Pasa en su institución?'], 'Sí, nos pasa');
  assert.equal(rp[0].Comentario, 'En enfermería sobre todo');
  assert.equal(rp[0].Equipo, 'Campus');
  const cj = h['Cartas jugadas'];
  assert.equal(cj[0]['Código'], 'L23');
  assert.equal(cj[0].Tipo, 'Revista Liebert');
  assert.equal(cj[0].Clave, 'Sí');
  assert.equal(cj[0]['Jugada por'], 'Carlos Mendoza');
  assert.equal(h.Encuesta[0][PREGUNTAS[3].texto], 4);
  assert.equal(h.Encuesta[0]['Quiere contacto'], 'Sí');
});

test('nombres de hoja de Excel válidos (máx. 31 caracteres, sin / ? *)', () => {
  for (const k of Object.keys(filasExport(armar()))) { assert.ok(k.length <= 31); assert.doesNotMatch(k, /[\\/?*[\]:]/); }
});
