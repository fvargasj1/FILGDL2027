import { RETOS, MAX_CARTAS_EQUIPO, normalizarCodigo, esCarta, esReto } from '../contenido/cartas.js';
import { RECURSOS } from '../contenido/encuesta.js';
import { MAX_FRASES } from '../contenido/experiencia.js';
import { limpiarExperiencia, unirExperiencia, recursosCompletos, fraseDeClave } from './experiencia.js';

export const FASES = ['llegada', 'apertura', 'experiencia', 'ronda1', 'ronda2', 'cuentanos', 'cierre', 'gracias'];
export const MAX_PALABRA = 30, MAX_COMENTARIO = 280, MAX_MOTIVO = 200, MAX_EQUIPO = 5;
export const RESPUESTAS_RETO = { si: 'Sí, nos pasa', aveces: 'A veces', no: 'No nos pasa' };
export { MAX_CARTAS_EQUIPO };
// Sube este número si cambia la forma del estado: los estados guardados de otra versión se reinician.
export const FORMATO = 4;
export const VOTACION = ['cerrada', 'abierta', 'resultado'];
// Lo que muestra el proyector durante "Tu experiencia con Sage".
export const VISTAS_EXPERIENCIA = ['avance', 'recursos', 'satisfaccion', 'deseo', 'frases'];
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const sinTildes = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const llaveNombre = (s) => sinTildes(s).replace(/\s+/g, ' ').trim();

export class ErrorJuego extends Error {
  constructor(codigo, mensaje) { super(mensaje); this.codigo = codigo; this.name = 'ErrorJuego'; }
}
const falla = (codigo, mensaje) => { throw new ErrorJuego(codigo, mensaje); };

export function estadoInicial(asistentes) {
  const mapa = {};
  for (const a of asistentes) mapa[a.id] = { ...a, registro: 'lista', ingreso: null, reinicios: 0, equipo: null };
  // equipos: uno por reto impreso, con la clave del reto (R01...). Se crean al primer escaneo.
  return { formato: FORMATO, fase: 'llegada', destacado: null, asistentes: mapa, palabras: {}, equipos: {}, respuestas: {}, jugadas: [], encuesta: {},
    votacion: 'cerrada', votos: {}, temporizador: null, experiencia: {}, vistaExperiencia: 'avance', frases: [] };
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
  // Quien no está en la lista previa se registra desde su celular. El id lo genera el celular.
  registrar(e, { id, nombre, institucion, pais, correo }, { ahora }) {
    const t = (v, max) => String(v ?? '').trim().replace(/\s+/g, ' ').slice(0, max);
    const n = t(nombre, 80), i = t(institucion, 120), p = t(pais, 60), c = t(correo, 120).toLowerCase();
    if (!/^n-[\w-]{4,40}$/.test(String(id ?? '')) || e.asistentes[id]) falla('id', 'No pudimos crear tu registro. Intenta de nuevo.');
    if (n.length < 4 || !n.includes(' ')) falla('nombre', 'Escribe tu nombre y apellido.');
    if (!i) falla('institucion', 'Escribe tu institución.');
    if (!p) falla('pais', 'Escribe tu país.');
    if (!CORREO.test(c)) falla('correo', 'Revisa tu correo: parece incompleto.');
    const ya = Object.values(e.asistentes).find(a => (a.correo && a.correo.toLowerCase() === c) || llaveNombre(a.nombre) === llaveNombre(n));
    if (ya) falla('duplicado', `Ya hay un registro de ${ya.nombre}. Búscalo por tu nombre y tócalo para entrar.`);
    e.asistentes[id] = { id, nombre: n, institucion: i, pais: p, correo: c, registro: 'evento', ingreso: ahora(), reinicios: 0, equipo: null };
  },
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
    exigirFase(e, FASES.slice(0, FASES.indexOf('cierre')), 'Los equipos ya se cerraron.');
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
    const r = { ...respuestas };
    if ('p6' in r) r.p6 = [...new Set(Array.isArray(r.p6) ? r.p6 : [])].filter(id => RECURSOS.some(x => x.id === id));
    e.encuesta[asistente] = { ...(e.encuesta[asistente] || {}), ...r };
  },

  // Tu experiencia con Sage. Se guarda por pantallas; "terminar" exige haber marcado todos los recursos.
  guardarExperiencia(e, { asistente, respuestas, terminar }, { ahora }) {
    persona(e, asistente);
    const r = unirExperiencia(e.experiencia[asistente], limpiarExperiencia(respuestas ?? {}));
    if (terminar) {
      if (!recursosCompletos(r)) falla('recursos', 'Marca cómo está cada recurso en tu institución (pantalla 1).');
      r.terminado = r.terminado ?? ahora();
    }
    e.experiencia[asistente] = r;
  },
  vistaExperiencia(e, { vista }) {
    if (!VISTAS_EXPERIENCIA.includes(vista)) falla('vista', 'Vista desconocida.');
    e.vistaExperiencia = vista;
  },
  // Proyectar (o quitar) una respuesta abierta, siempre sin nombre.
  proyectarFrase(e, { clave }) {
    if (e.frases.includes(clave)) { e.frases = e.frases.filter(c => c !== clave); return; }
    if (!fraseDeClave(e, clave)) falla('frase', 'Esa respuesta ya no existe.');
    if (e.frases.length >= MAX_FRASES) falla('frases-llenas', `Ya hay ${MAX_FRASES} frases en pantalla. Quita una para agregar otra.`);
    e.frases.push(clave);
  },

  // Voto del salón: ¿qué equipo defendió mejor su carta clave? No se vota por el propio equipo.
  cambiarVotacion(e, { estado }) {
    if (!VOTACION.includes(estado)) falla('votacion', 'Estado de votación desconocido.');
    e.votacion = estado;
  },
  votar(e, { asistente, equipo }) {
    const a = persona(e, asistente);
    if (e.votacion !== 'abierta') falla('votacion-cerrada', 'La votación no está abierta.');
    if (!equiposActivos(e).includes(equipo)) falla('equipo-no-existe', 'Ese equipo no está en juego.');
    if (a.equipo === equipo) falla('propio', 'Vota por otro equipo, no por el tuyo.');
    e.votos[asistente] = equipo;
  },

  // Temporizador que el facilitador inicia a mano. Se guarda la hora de fin; cada pantalla calcula lo que falta.
  temporizador(e, { accion, segundos }, { ahora }) {
    const ya = Date.parse(ahora());
    const t = e.temporizador;
    const seg = Math.round(Number(segundos));
    if (accion === 'iniciar') {
      if (!(seg >= 10 && seg <= 3600)) falla('temporizador', 'Elige entre 10 segundos y 60 minutos.');
      e.temporizador = { duracion: seg, fin: new Date(ya + seg * 1000).toISOString(), restante: null };
    } else if (accion === 'pausar' && t?.fin) {
      e.temporizador = { ...t, fin: null, restante: segundosRestantes(t, ya) };
    } else if (accion === 'reanudar' && t && !t.fin) {
      e.temporizador = { ...t, fin: new Date(ya + t.restante * 1000).toISOString(), restante: null };
    } else if (accion === 'sumar' && t) {
      if (!(seg > 0 && seg <= 600)) falla('temporizador', 'Suma entre 1 segundo y 10 minutos.');
      e.temporizador = t.fin ? { ...t, fin: new Date(Date.parse(t.fin) + seg * 1000).toISOString() } : { ...t, restante: t.restante + seg };
    } else if (accion === 'detener') {
      e.temporizador = null;
    }
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

// Segundos que faltan (null si no hay temporizador). Nunca negativo.
export function segundosRestantes(t, ahoraMs) {
  if (!t) return null;
  if (!t.fin) return t.restante;
  return Math.max(0, Math.ceil((Date.parse(t.fin) - ahoraMs) / 1000));
}

// Sugerencias del registro: desde 3 letras, cada palabra escrita debe iniciar una palabra del nombre. Máximo 5.
export function buscarPersonas(e, texto, max = 5) {
  const q = sinTildes(texto).split(/\s+/).filter(Boolean);
  if (q.join('').length < 3) return [];
  return Object.values(e.asistentes)
    .filter(a => { const ps = sinTildes(a.nombre).split(/\s+/); return q.every(t => ps.some(p => p.startsWith(t))); })
    .sort((x, y) => x.nombre.localeCompare(y.nombre, 'es'))
    .slice(0, max);
}

// Ranking del voto: equipos activos de más a menos votos; empates en orden de reto.
export function resumenVoto(e) {
  const n = {};
  for (const eq of Object.values(e.votos ?? {})) n[eq] = (n[eq] || 0) + 1;
  return equiposActivos(e).map(equipo => ({ equipo, votos: n[equipo] || 0 })).sort((a, b) => b.votos - a.votos);
}
