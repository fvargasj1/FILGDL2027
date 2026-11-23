import { RETOS, MAX_CARTAS_EQUIPO, normalizarCodigo, esCarta, esReto } from '../contenido/cartas.js';

export const FASES = ['llegada', 'apertura', 'ronda1', 'ronda2', 'cuentanos', 'cierre', 'gracias'];
export const MAX_PALABRA = 30, MAX_COMENTARIO = 280, MAX_MOTIVO = 200, MAX_EQUIPO = 5;
export const RESPUESTAS_RETO = { si: 'Sí, nos pasa', aveces: 'A veces', no: 'No nos pasa' };
export { MAX_CARTAS_EQUIPO };
// Sube este número si cambia la forma del estado: los estados guardados de otra versión se reinician.
export const FORMATO = 2;

export class ErrorJuego extends Error {
  constructor(codigo, mensaje) { super(mensaje); this.codigo = codigo; this.name = 'ErrorJuego'; }
}
const falla = (codigo, mensaje) => { throw new ErrorJuego(codigo, mensaje); };

export function estadoInicial(asistentes) {
  const mapa = {};
  for (const a of asistentes) mapa[a.id] = { ...a, ingreso: null, reinicios: 0, equipo: null };
  // equipos: uno por reto impreso, con la clave del reto (R01...). Se crean al primer escaneo.
  return { formato: FORMATO, fase: 'llegada', destacado: null, asistentes: mapa, palabras: {}, equipos: {}, respuestas: {}, jugadas: [], encuesta: {} };
}

// Si lo guardado viene de otra versión (o está vacío), se empieza de cero.
export const normalizarEstado = (e, asistentes) => (e && e.formato === FORMATO ? e : estadoInicial(asistentes));

const clon = (e) => structuredClone(e);
const persona = (e, id) => e.asistentes[id] || falla('asistente-no-existe', 'No encontramos a esa persona en la lista.');
const equipoDe = (e, id) => e.equipos[id] || falla('equipo-no-existe', 'Ese equipo todavía no existe.');
function exigirFase(e, permitidas, mensaje) { if (!permitidas.includes(e.fase)) falla('fase', mensaje); }
const nombreEquipo = (reto) => RETOS.find(r => r.codigo === reto)?.equipo ?? reto;

function salir(e, id) {
  const a = e.asistentes[id];
  if (!a.equipo) return;
  const eq = e.equipos[a.equipo];
  if (eq) eq.miembros = eq.miembros.filter(m => m !== id);
  a.equipo = null;
}

export const ACCIONES = {
  ingresar(e, { asistente }, { ahora }) {
    const a = persona(e, asistente);
    if (!a.ingreso) a.ingreso = ahora();
  },
  guardarPalabra(e, { asistente, texto }) {
    persona(e, asistente);
    const t = String(texto ?? '').trim().slice(0, MAX_PALABRA);
    if (!t) falla('vacio', 'Escribe una palabra.');
    e.palabras[asistente] = t;
  },
  borrarPalabra(e, { asistente }) { delete e.palabras[asistente]; },

  // Escanear la carta de un reto: entra al equipo de ese reto (se crea si nadie lo ha escaneado).
  unirseReto(e, { asistente, reto }) {
    const a = persona(e, asistente);
    exigirFase(e, FASES.slice(0, 5), 'Los equipos ya se cerraron.');
    const cod = normalizarCodigo(reto);
    if (!cod || !esReto(cod)) falla('reto-no-existe', 'Ese código no corresponde a un reto. Revisa la carta grande de tu mesa.');
    if (a.equipo === cod) return;
    const eq = e.equipos[cod] ?? { miembros: [], motivo: '' };
    if (eq.miembros.length >= MAX_EQUIPO) falla('equipo-lleno', `El equipo ${nombreEquipo(cod)} ya tiene ${MAX_EQUIPO} personas. Busca otro reto.`);
    salir(e, asistente);
    eq.miembros.push(asistente);
    e.equipos[cod] = eq;
    a.equipo = cod;
  },
  salirEquipo(e, { asistente }) { persona(e, asistente); salir(e, asistente); },

  responderReto(e, { asistente, pasa, comentario }) {
    const a = persona(e, asistente);
    if (!a.equipo) falla('sin-equipo', 'Primero escanea el reto de tu mesa.');
    if (!(pasa in RESPUESTAS_RETO)) falla('respuesta', 'Elige una de las tres opciones.');
    e.respuestas[asistente] = { reto: a.equipo, pasa, comentario: String(comentario ?? '').trim().slice(0, MAX_COMENTARIO) };
  },
  borrarComentario(e, { asistente }) { if (e.respuestas[asistente]) e.respuestas[asistente].comentario = ''; },

  // Escanear una carta de la mano: la pone sobre el reto del equipo.
  jugarCarta(e, { asistente, carta }, { nuevoId, ahora }) {
    const a = persona(e, asistente);
    exigirFase(e, ['ronda2', 'cuentanos'], 'Todavía no es momento de jugar cartas. Espera la ronda de cartas.');
    const cod = normalizarCodigo(carta);
    if (!cod || !esCarta(cod)) falla('carta-no-existe', 'Ese código no corresponde a una carta del juego.');
    if (!a.equipo) falla('sin-equipo', 'Primero escanea el reto de tu mesa para unirte a un equipo.');
    const mesa = e.jugadas.filter(j => j.equipo === a.equipo);
    if (mesa.some(j => j.carta === cod)) falla('repetida', 'Esa carta ya está sobre el reto de tu equipo.');
    if (mesa.length >= MAX_CARTAS_EQUIPO) falla('mesa-llena', `Su reto ya tiene ${MAX_CARTAS_EQUIPO} cartas. Retiren una para jugar otra.`);
    e.jugadas.push({ id: nuevoId(), equipo: a.equipo, carta: cod, asistente, clave: false, en: ahora() });
  },
  retirarCarta(e, { jugada }) { e.jugadas = e.jugadas.filter(x => x.id !== jugada); },
  marcarClave(e, { jugada }) {
    const j = e.jugadas.find(x => x.id === jugada) || falla('jugada', 'Esa carta ya no está sobre el reto.');
    const nueva = !j.clave;
    for (const x of e.jugadas) if (x.equipo === j.equipo) x.clave = false;
    j.clave = nueva;
  },
  guardarMotivo(e, { equipo, texto }) { equipoDe(e, equipo).motivo = String(texto ?? '').trim().slice(0, MAX_MOTIVO); },

  guardarEncuesta(e, { asistente, respuestas }) {
    persona(e, asistente);
    e.encuesta[asistente] = { ...(e.encuesta[asistente] || {}), ...respuestas };
  },
  cambiarFase(e, { fase }) {
    if (!FASES.includes(fase)) falla('fase', 'Fase desconocida.');
    e.fase = fase;
  },
  destacar(e, { equipo }) { if (equipo !== null) equipoDe(e, equipo); e.destacado = equipo; },
  reiniciarAsistente(e, { asistente }) { const a = persona(e, asistente); a.ingreso = null; a.reinicios += 1; },
};

// Aplica una acción sin mutar el estado recibido. Lanza ErrorJuego si no se puede.
export function aplicar(estado, nombre, args, ctx) {
  const fn = ACCIONES[nombre] || falla('accion', `Acción desconocida: ${nombre}`);
  const e = clon(estado);
  fn(e, args || {}, ctx);
  return e;
}

// Equipos visibles: con gente o con cartas, en el orden de los retos.
export const equiposActivos = (e) => RETOS.map(r => r.codigo)
  .filter(c => e.equipos[c] && (e.equipos[c].miembros.length || e.jugadas.some(j => j.equipo === c)));
