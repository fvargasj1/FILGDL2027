// "Tu experiencia con Sage": limpieza de respuestas y cálculos para proyector, facilitador y Excel. Sin DOM.
import {
  CATALOGO, ESTADO_RECURSO, DIMENSIONES, CANALES, ESPERA, PARTICIPO, FORMATOS, PUBLICOS,
  MAX_DESEO, MAX_ABIERTA, ABIERTAS, TEMAS, OTROS_TEMA,
} from '../contenido/experiencia.js';

const sinTildes = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const entero = (v, min, max) => { const n = Number(v); return Number.isInteger(n) && n >= min && n <= max ? n : undefined; };
const texto = (v) => String(v ?? '').trim().replace(/\s+/g, ' ').slice(0, MAX_ABIERTA);
const lista = (v, validos, max = Infinity) => [...new Set(Array.isArray(v) ? v : [])].filter(x => validos.includes(x)).slice(0, max);
const ids = CATALOGO.map(r => r.id);

// Deja solo valores válidos. Las claves que no vienen no se tocan; null o '' borran la respuesta.
export function limpiarExperiencia(r = {}) {
  const out = {};
  const poner = (k, v) => { out[k] = v === '' || (Array.isArray(v) && !v.length && k !== 'deseo') ? undefined : v; };
  if ('recursos' in r) {
    const m = {};
    for (const [id, v] of Object.entries(r.recursos ?? {})) if (ids.includes(id) && v in ESTADO_RECURSO) m[id] = v;
    out.recursos = m;
  }
  if ('nps' in r) poner('nps', entero(r.nps, 0, 10));
  if ('dims' in r) {
    const m = {};
    for (const d of DIMENSIONES) { const n = entero(r.dims?.[d.id], 1, 5); if (n) m[d.id] = n; }
    out.dims = m;
  }
  for (const k of ['valora', 'mejora', 'esperaOtra', 'frase']) if (k in r) poner(k, texto(r[k]));
  if ('canales' in r) poner('canales', lista(r.canales, Object.keys(CANALES)));
  if ('utilMkt' in r) poner('utilMkt', entero(r.utilMkt, 1, 5));
  if ('espera' in r) poner('espera', lista(r.espera, Object.keys(ESPERA)));
  if ('participo' in r) poner('participo', r.participo in PARTICIPO ? r.participo : undefined);
  if ('utilForm' in r) poner('utilForm', entero(r.utilForm, 1, 5));
  if ('formatos' in r) poner('formatos', lista(r.formatos, Object.keys(FORMATOS)));
  if ('publicos' in r) poner('publicos', lista(r.publicos, Object.keys(PUBLICOS)));
  if ('deseo' in r) out.deseo = lista(r.deseo, ids, MAX_DESEO);
  // Quien no ha participado no califica la capacitación.
  if (out.participo === 'no') out.utilForm = undefined;
  return out;
}

// Une lo guardado con lo nuevo; quita las claves vacías.
export function unirExperiencia(previo = {}, limpio) {
  const r = { ...previo, ...limpio };
  for (const k of Object.keys(r)) if (r[k] === undefined) delete r[k];
  return r;
}

export const recursosCompletos = (r) => ids.every(id => r?.recursos?.[id]);
export const faltanRecursos = (r) => ids.filter(id => !r?.recursos?.[id]).length;

// ---------- cálculos ----------
const respuestas = (e) => Object.values(e.experiencia ?? {});

export function avanceExperiencia(e) {
  const rs = Object.entries(e.experiencia ?? {});
  const dentro = Object.values(e.asistentes).filter(a => a.ingreso);
  return {
    terminaron: rs.filter(([, r]) => r.terminado).length,
    empezaron: rs.length,
    dentro: dentro.length,
    pendientes: dentro.filter(a => !e.experiencia?.[a.id]?.terminado).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
  };
}

// Por recurso: cuántos lo tienen, lo conocen o es nuevo; puntos de deseo (1º = 3, 2º = 2, 3º = 1);
// brecha = lo eligieron sin tenerlo; cierre = lo marcaron en "¿Qué recurso quieres conocer mejor?".
export function resumenRecursos(e) {
  const rs = respuestas(e);
  const cierre = {};
  for (const r of Object.values(e.encuesta ?? {})) for (const id of r.p6 ?? []) cierre[id] = (cierre[id] || 0) + 1;
  return CATALOGO.map(c => {
    const x = { ...c, tiene: 0, conoce: 0, nuevo: 0, puntos: 0, eligieron: 0, primero: 0, brecha: 0, cierre: cierre[c.id] || 0 };
    for (const r of rs) {
      const est = r.recursos?.[c.id];
      if (est) x[est]++;
      const pos = (r.deseo ?? []).indexOf(c.id);
      if (pos >= 0) { x.puntos += MAX_DESEO - pos; x.eligieron++; if (pos === 0) x.primero++; if (est !== 'tiene') x.brecha++; }
    }
    return x;
  });
}
export const rankingDeseo = (e) => resumenRecursos(e).filter(x => x.puntos > 0)
  .sort((a, b) => b.puntos - a.puntos || b.primero - a.primero || b.eligieron - a.eligieron);

// NPS: promotores (9-10) menos detractores (0-6), en puntos porcentuales.
export function resumenNps(e) {
  const valores = respuestas(e).map(r => r.nps).filter(n => Number.isInteger(n));
  const promotores = valores.filter(n => n >= 9).length, detractores = valores.filter(n => n <= 6).length;
  const n = valores.length;
  return { n, valores, promotores, pasivos: n - promotores - detractores, detractores,
    nps: n ? Math.round(((promotores - detractores) / n) * 100) : null,
    promedio: n ? valores.reduce((a, b) => a + b, 0) / n : null };
}

export function promediosDims(e) {
  const rs = respuestas(e);
  return DIMENSIONES.map(d => {
    const v = rs.map(r => r.dims?.[d.id]).filter(Boolean);
    return { ...d, n: v.length, prom: v.length ? v.reduce((a, b) => a + b, 0) / v.length : null };
  });
}

// Conteo de una pregunta de varias opciones: [{ id, nombre, n }] de más a menos, con las que nadie eligió al final.
export function conteoOpciones(e, campo, opciones) {
  const n = {};
  for (const r of respuestas(e)) { const v = r[campo]; for (const id of Array.isArray(v) ? v : v ? [v] : []) n[id] = (n[id] || 0) + 1; }
  return Object.entries(opciones).map(([id, nombre]) => ({ id, nombre, n: n[id] || 0 })).sort((a, b) => b.n - a.n);
}

export function temaDe(txt) {
  const t = sinTildes(txt);
  return TEMAS.find(tm => tm.claves.some(c => t.includes(c))) ?? OTROS_TEMA;
}

// Respuestas abiertas, con tema. clave = "asistente|campo" (lo que el facilitador marca para proyectar).
export function frasesAbiertas(e) {
  const out = [];
  for (const [id, r] of Object.entries(e.experiencia ?? {})) for (const [campo, etiqueta] of Object.entries(ABIERTAS)) {
    if (!r[campo]) continue;
    const tema = temaDe(r[campo]);
    out.push({ clave: `${id}|${campo}`, asistente: id, campo, etiqueta, texto: r[campo], tema: tema.id, nombreTema: tema.nombre });
  }
  const orden = [...TEMAS, OTROS_TEMA].map(t => t.id);
  return out.sort((a, b) => orden.indexOf(a.tema) - orden.indexOf(b.tema));
}
export const fraseDeClave = (e, clave) => {
  const [id, campo] = String(clave).split('|');
  const t = campo in ABIERTAS ? e.experiencia?.[id]?.[campo] : undefined;
  return t ? { clave, texto: t, campo, etiqueta: ABIERTAS[campo] } : null;
};
