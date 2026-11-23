import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estadoInicial, aplicar, ErrorJuego, FASES, FORMATO, normalizarEstado } from '../js/logica/estado.js';
import { ASISTENTES_EJEMPLO } from '../js/contenido/asistentes-ejemplo.js';
import { ctx, congelar } from './helpers.js';

const A = ASISTENTES_EJEMPLO;
function sesion(fase) {
  const c = ctx(); let e = estadoInicial(A);
  const run = (n, a) => (e = aplicar(e, n, a, c));
  if (fase) run('cambiarFase', { fase });
  return { run, get e() { return e; } };
}
const lanza = (fn, codigo) => assert.throws(fn, (err) => err instanceof ErrorJuego && err.codigo === codigo);
const jugadasDe = (e, eq) => e.jugadas.filter(j => j.equipo === eq);

test('fases en orden', () => assert.deepEqual(FASES, ['llegada', 'apertura', 'ronda1', 'ronda2', 'cuentanos', 'cierre', 'gracias']));

test('ingresar dos veces es idempotente', () => {
  const s = sesion();
  s.run('ingresar', { asistente: 'p01' });
  const antes = s.e.asistentes.p01;
  s.run('ingresar', { asistente: 'p01' });
  assert.deepEqual(s.e.asistentes.p01, antes);
  assert.ok(antes.ingreso);
});

test('aplicar no muta el estado de entrada', () => {
  const s = sesion('ronda2');
  const congelado = congelar(s.e);
  assert.doesNotThrow(() => aplicar(congelado, 'unirseReto', { asistente: 'p01', reto: 'R01' }, ctx()));
});

test('palabra se recorta a 30 y no puede estar vacía', () => {
  const s = sesion();
  s.run('guardarPalabra', { asistente: 'p01', texto: '  ' + 'x'.repeat(40) });
  assert.equal(s.e.palabras.p01.length, 30);
  lanza(() => s.run('guardarPalabra', { asistente: 'p01', texto: '   ' }), 'vacio');
});

test('escanear un reto crea el equipo con su nombre y suma miembros', () => {
  const s = sesion('ronda1');
  s.run('unirseReto', { asistente: 'p01', reto: 'r01' });
  s.run('unirseReto', { asistente: 'p02', reto: 'R01' });
  assert.deepEqual(s.e.equipos.R01.miembros, ['p01', 'p02']);
  assert.equal(s.e.asistentes.p01.equipo, 'R01');
  // volver a escanear el mismo reto no duplica
  s.run('unirseReto', { asistente: 'p01', reto: 'R01' });
  assert.equal(s.e.equipos.R01.miembros.length, 2);
});

test('reto inexistente o código de carta no sirven para unirse', () => {
  const s = sesion('ronda1');
  lanza(() => s.run('unirseReto', { asistente: 'p01', reto: 'R99' }), 'reto-no-existe');
  lanza(() => s.run('unirseReto', { asistente: 'p01', reto: 'L01' }), 'reto-no-existe');
});

test('cambiarse de reto saca a la persona del equipo anterior', () => {
  const s = sesion('ronda1');
  s.run('unirseReto', { asistente: 'p01', reto: 'R01' });
  s.run('unirseReto', { asistente: 'p02', reto: 'R01' });
  s.run('unirseReto', { asistente: 'p01', reto: 'R02' });
  assert.deepEqual(s.e.equipos.R01.miembros, ['p02']);
  assert.deepEqual(s.e.equipos.R02.miembros, ['p01']);
});

test('un equipo admite hasta 5 personas', () => {
  const s = sesion('ronda1');
  for (const id of ['p01', 'p02', 'p03', 'p04', 'p05']) s.run('unirseReto', { asistente: id, reto: 'R03' });
  lanza(() => s.run('unirseReto', { asistente: 'p06', reto: 'R03' }), 'equipo-lleno');
});

test('no se cambia de reto en cierre ni en gracias', () => {
  const s = sesion('cierre');
  lanza(() => s.run('unirseReto', { asistente: 'p01', reto: 'R01' }), 'fase');
});

test('responder el reto guarda si pasa y el comentario, por persona', () => {
  const s = sesion('ronda1');
  s.run('unirseReto', { asistente: 'p01', reto: 'R04' });
  s.run('responderReto', { asistente: 'p01', pasa: 'aveces', comentario: '  Pasa en medicina  ' });
  assert.deepEqual(s.e.respuestas.p01, { reto: 'R04', pasa: 'aveces', comentario: 'Pasa en medicina' });
  lanza(() => s.run('responderReto', { asistente: 'p01', pasa: 'tal vez' }), 'respuesta');
  lanza(() => s.run('responderReto', { asistente: 'p02', pasa: 'si' }), 'sin-equipo');
});

test('la respuesta conserva su reto aunque la persona cambie de equipo', () => {
  const s = sesion('ronda1');
  s.run('unirseReto', { asistente: 'p01', reto: 'R04' });
  s.run('responderReto', { asistente: 'p01', pasa: 'si', comentario: '' });
  s.run('unirseReto', { asistente: 'p01', reto: 'R05' });
  assert.equal(s.e.respuestas.p01.reto, 'R04');
});

test('jugar carta solo en ronda 2 o cuéntanos y con equipo', () => {
  const s = sesion('ronda1');
  s.run('unirseReto', { asistente: 'p01', reto: 'R01' });
  lanza(() => s.run('jugarCarta', { asistente: 'p01', carta: 'L01' }), 'fase');
  s.run('cambiarFase', { fase: 'ronda2' });
  lanza(() => s.run('jugarCarta', { asistente: 'p02', carta: 'L01' }), 'sin-equipo');
  s.run('jugarCarta', { asistente: 'p01', carta: 'l1' });
  assert.equal(jugadasDe(s.e, 'R01')[0].carta, 'L01');
  assert.equal(jugadasDe(s.e, 'R01')[0].asistente, 'p01');
});

test('una carta no se juega dos veces en el mismo equipo, pero sí en otro', () => {
  const s = sesion('ronda2');
  s.run('unirseReto', { asistente: 'p01', reto: 'R01' });
  s.run('unirseReto', { asistente: 'p02', reto: 'R01' });
  s.run('unirseReto', { asistente: 'p03', reto: 'R02' });
  s.run('jugarCarta', { asistente: 'p01', carta: 'A05' });
  lanza(() => s.run('jugarCarta', { asistente: 'p02', carta: 'A05' }), 'repetida');
  s.run('jugarCarta', { asistente: 'p03', carta: 'A05' });
  assert.equal(s.e.jugadas.length, 2);
});

test('máximo 6 cartas por equipo; al retirar una se libera el espacio', () => {
  const s = sesion('ronda2');
  s.run('unirseReto', { asistente: 'p01', reto: 'R01' });
  for (const c of ['L01', 'L02', 'L03', 'A01', 'A02', 'A03']) s.run('jugarCarta', { asistente: 'p01', carta: c });
  lanza(() => s.run('jugarCarta', { asistente: 'p01', carta: 'L04' }), 'mesa-llena');
  s.run('retirarCarta', { jugada: jugadasDe(s.e, 'R01')[0].id });
  s.run('jugarCarta', { asistente: 'p01', carta: 'L04' });
  assert.equal(jugadasDe(s.e, 'R01').length, 6);
});

test('códigos que no son carta no se juegan', () => {
  const s = sesion('ronda2');
  s.run('unirseReto', { asistente: 'p01', reto: 'R01' });
  lanza(() => s.run('jugarCarta', { asistente: 'p01', carta: 'R02' }), 'carta-no-existe');
  lanza(() => s.run('jugarCarta', { asistente: 'p01', carta: 'L99' }), 'carta-no-existe');
});

test('solo una carta clave por equipo; marcarla de nuevo la desmarca', () => {
  const s = sesion('ronda2');
  s.run('unirseReto', { asistente: 'p01', reto: 'R01' });
  s.run('jugarCarta', { asistente: 'p01', carta: 'L01' });
  s.run('jugarCarta', { asistente: 'p01', carta: 'A01' });
  const [j1, j2] = jugadasDe(s.e, 'R01');
  s.run('marcarClave', { jugada: j1.id });
  s.run('marcarClave', { jugada: j2.id });
  assert.deepEqual(jugadasDe(s.e, 'R01').map(j => j.clave), [false, true]);
  s.run('marcarClave', { jugada: j2.id });
  assert.deepEqual(jugadasDe(s.e, 'R01').map(j => j.clave), [false, false]);
});

test('las cartas jugadas se quedan en el equipo aunque quien las jugó se cambie', () => {
  const s = sesion('ronda2');
  s.run('unirseReto', { asistente: 'p01', reto: 'R01' });
  s.run('jugarCarta', { asistente: 'p01', carta: 'L01' });
  s.run('unirseReto', { asistente: 'p01', reto: 'R02' });
  assert.equal(jugadasDe(s.e, 'R01').length, 1);
  assert.deepEqual(s.e.equipos.R01.miembros, []);
});

test('motivo de la carta clave: se guarda recortado a 200', () => {
  const s = sesion('cuentanos');
  s.run('unirseReto', { asistente: 'p01', reto: 'R01' });
  s.run('guardarMotivo', { equipo: 'R01', texto: 'x'.repeat(250) });
  assert.equal(s.e.equipos.R01.motivo.length, 200);
});

test('destacar requiere un equipo existente o null', () => {
  const s = sesion('cuentanos');
  lanza(() => s.run('destacar', { equipo: 'R09' }), 'equipo-no-existe');
  s.run('unirseReto', { asistente: 'p01', reto: 'R09' });
  s.run('destacar', { equipo: 'R09' });
  assert.equal(s.e.destacado, 'R09');
  s.run('destacar', { equipo: null });
  assert.equal(s.e.destacado, null);
});

test('reiniciar asistente obliga a reingresar', () => {
  const s = sesion('ronda1');
  s.run('ingresar', { asistente: 'p01' });
  s.run('unirseReto', { asistente: 'p01', reto: 'R01' });
  s.run('reiniciarAsistente', { asistente: 'p01' });
  assert.equal(s.e.asistentes.p01.ingreso, null);
  assert.equal(s.e.asistentes.p01.reinicios, 1);
});

test('moderación: borrar comentario de un reto', () => {
  const s = sesion('ronda1');
  s.run('unirseReto', { asistente: 'p01', reto: 'R01' });
  s.run('responderReto', { asistente: 'p01', pasa: 'si', comentario: 'algo' });
  s.run('borrarComentario', { asistente: 'p01' });
  assert.equal(s.e.respuestas.p01.comentario, '');
  assert.equal(s.e.respuestas.p01.pasa, 'si');
});

test('normalizarEstado reemplaza estados de una versión anterior', () => {
  const viejo = { fase: 'ronda2', grupos: {}, asistentes: {} };
  const e = normalizarEstado(viejo, A);
  assert.equal(e.formato, FORMATO);
  assert.equal(Object.keys(e.asistentes).length, A.length);
  const actual = estadoInicial(A);
  assert.equal(normalizarEstado(actual, A), actual);
});
