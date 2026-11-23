import { RETOS, EQUIPOS, buscar } from '../contenido/cartas.js';

// h('div', {class:'x', onclick:fn}, hijo1, 'texto', [hijos]) -> HTMLElement
export function h(tag, attrs, ...hijos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') for (const [p, x] of Object.entries(v)) { if (x == null) continue; if (p.startsWith('--')) el.style.setProperty(p, x); else el.style[p] = x; }
    else if (k === 'value') el.value = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of hijos.flat(Infinity)) if (c != null && c !== false) el.append(c.nodeType ? c : String(c));
  return el;
}

// Colores de las cartas en pantalla: Liebert granate, asistente navy (como las cartas impresas).
export const nombreEquipo = (reto) => EQUIPOS[reto] ?? reto;
export const textoReto = (reto) => RETOS.find(r => r.codigo === reto)?.texto ?? '';

export function datosCarta(codigo) {
  const c = buscar(codigo);
  if (!c) return { codigo, tipo: 'desconocida', titulo: codigo, etiqueta: '', descripcion: '' };
  if (c.tipo === 'liebert') return { codigo, tipo: 'liebert', titulo: c.titulo, etiqueta: c.area, descripcion: c.descripcion, url: c.url };
  if (c.tipo === 'asistente') return { codigo, tipo: 'asistente', titulo: c.titulo, etiqueta: 'Asistente de investigación', descripcion: c.descripcion, pruebalo: c.pruebalo, url: c.url };
  return { codigo, tipo: 'reto', titulo: `Reto ${c.codigo.slice(1)}`, etiqueta: `Equipo ${c.equipo}`, descripcion: c.texto };
}

export function vistaCarta(codigo, { onclick, tag = 'button', extra } = {}) {
  const d = datosCarta(codigo);
  return h(tag, { class: 'carta ' + d.tipo, onclick, type: tag === 'button' ? 'button' : null },
    h('div', { class: 'banda' }, h('span', { class: 'cod' }, d.codigo)),
    h('div', { class: 'cuerpo' },
      h('span', { class: 'area' }, d.etiqueta),
      h('span', { class: 'titulo' }, d.titulo),
      h('span', { class: 'desc' }, d.descripcion),
      extra));
}

export const logoSage = (cls = 'logo-sage') => h('img', { class: cls, src: 'assets/sage-logo.svg', alt: 'Sage' });
export const logoFil = (cls = 'fil') => h('img', { class: cls, src: 'assets/fil_logo.png', alt: 'FIL Guadalajara 40' });

// Reemplaza el contenido conservando foco, cursor y lo escrito en campos con data-k.
export function pintar(raiz, nodo) {
  const activo = document.activeElement;
  const k = activo && raiz.contains(activo) ? activo.dataset.k : null;
  const borradores = {};
  raiz.querySelectorAll('[data-k]').forEach(el => { if (el.dataset.borrador === '1') borradores[el.dataset.k] = el.value; });
  const sel = k && 'selectionStart' in activo ? [activo.selectionStart, activo.selectionEnd] : null;
  const scroll = [...raiz.querySelectorAll('[data-scroll]')].map(el => [el.dataset.scroll, el.scrollLeft]);
  raiz.replaceChildren(nodo);
  for (const [kk, v] of Object.entries(borradores)) { const el = raiz.querySelector(`[data-k="${kk}"]`); if (el) { el.value = v; el.dataset.borrador = '1'; } }
  for (const [s, x] of scroll) { const el = raiz.querySelector(`[data-scroll="${s}"]`); if (el) el.scrollLeft = x; }
  if (k) { const el = raiz.querySelector(`[data-k="${k}"]`); if (el) { el.focus(); if (sel) try { el.setSelectionRange(...sel); } catch {} } }
}
// Marca un campo como "en edición" para que pintar() no pierda lo escrito.
export const borrador = (e) => { e.target.dataset.borrador = '1'; };

export const sinTildes = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// ---------- temporizador ----------
// Cada elemento con data-reloj se actualiza solo, sin volver a pintar la vista.
export const formatoReloj = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
function restante(el) {
  if (el.dataset.fin) return Math.max(0, Math.ceil((Date.parse(el.dataset.fin) - Date.now()) / 1000));
  return Number(el.dataset.restante);
}
function tic() {
  for (const el of document.querySelectorAll('[data-reloj]')) {
    const s = restante(el);
    const t = el.querySelector('.t') ?? el;
    const txt = s > 0 ? formatoReloj(s) : 'Tiempo';
    if (t.textContent !== txt) t.textContent = txt;
    el.classList.toggle('poco', s > 0 && s <= 30);
    el.classList.toggle('cero', s === 0);
    el.classList.toggle('pausa', !el.dataset.fin);
  }
}
if (globalThis.document && !globalThis.__labReloj) globalThis.__labReloj = setInterval(tic, 250);

// t: estado.temporizador. Devuelve null si no hay temporizador.
export function reloj(t, clase = 'reloj', etiqueta = null) {
  if (!t) return null;
  const el = h('div', { class: clase, 'data-reloj': '', 'data-fin': t.fin || null, 'data-restante': t.fin ? null : t.restante, role: 'timer', 'aria-live': 'off' },
    etiqueta ? h('span', { class: 'e' }, etiqueta) : null, h('span', { class: 't' }, ''));
  queueMicrotask(tic);
  return el;
}
