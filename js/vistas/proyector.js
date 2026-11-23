import { h, pintar, datosCarta, vistaCarta, logoFil, nombreEquipo } from './ui.js';
import { equiposActivos, MAX_CARTAS_EQUIPO } from '../logica/estado.js';
import { PREGUNTAS } from '../contenido/encuesta.js';
import { config } from '../config.js';
import { cargarLibreria } from '../cargar-libreria.js';

const cargarQr = () => cargarLibreria('qrcode');
// En el evento el QR de entrada usa la dirección pública; en pruebas, la de esta misma página.
export const urlCliente = () => (config.modo === 'supabase' ? config.urlPublica : location.href.split(/[?#]/)[0]);

function qrSvg(texto) {
  if (!globalThis.qrcode) return h('div', null);
  const q = globalThis.qrcode(0, 'M'); q.addData(texto); q.make();
  const div = document.createElement('div');
  div.innerHTML = q.createSvgTag({ cellSize: 8, margin: 0, scalable: true });
  return div.firstChild;
}

// Tamaño de palabra según repeticiones; máximo 80 distintas visibles.
function nube(palabras, vacio) {
  const cuenta = new Map();
  for (const p of palabras) { const k = p.trim().toLowerCase(); if (!k) continue; const v = cuenta.get(k) || { texto: p.trim(), n: 0 }; v.n++; cuenta.set(k, v); }
  const items = [...cuenta.values()].sort((a, b) => b.n - a.n).slice(0, 80);
  if (!items.length) return h('div', { class: 'nube' }, h('span', { class: 'vacia' }, vacio));
  const max = items[0].n;
  const colores = ['#ffffff', '#f5ae8d', '#a8d9de', '#ccb4d7'];
  const total = items.length;
  const base = total > 40 ? 34 : total > 20 ? 46 : 60;
  // orden intercalado para que la más grande quede al centro
  const orden = []; items.forEach((it, i) => (i % 2 ? orden.push(it) : orden.unshift(it)));
  return h('div', { class: 'nube' }, orden.map((it, i) => h('span', {
    style: { fontSize: `calc(var(--u) * ${Math.round(base + (base * 1.4) * (it.n - 1) / Math.max(1, max - 1 || 1))})`, color: colores[i % colores.length] } }, it.texto)));
}

// Columnas y tamaño de letra según cuántos grupos hay.
function rejilla(n) {
  const cols = n <= 2 ? n || 1 : n <= 4 ? 2 : n <= 6 ? 3 : n <= 12 ? 4 : n <= 15 ? 5 : 6;
  const filas = Math.ceil(n / cols) || 1;
  const letra = filas <= 1 ? 40 : filas === 2 ? 32 : filas === 3 ? 24 : 19;
  return { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, fontSize: `calc(var(--u) * ${letra})` };
}

export function montarProyector(raiz, store) {
  let estado = store.getEstado();
  cargarQr().then(() => render()).catch(() => {});
  const nombre = (id) => estado.asistentes[id]?.nombre.split(' ')[0] ?? '';
  const equipos = () => equiposActivos(estado);
  const ingresados = () => Object.values(estado.asistentes).filter(a => a.ingreso).length;

  const pie = () => h('div', { class: 'pie' },
    h('img', { class: 'sage', src: 'assets/sage-logo.svg', alt: 'Sage' }),
    h('span', null, `Sage LAB - ${config.nombreEvento}`),
    logoFil('fil'));

  const mini = (j) => { const d = datosCarta(j.carta);
    return h('span', { class: 'mini ' + d.tipo + (j.clave ? ' clave' : '') }, (j.clave ? '★ ' : '') + d.titulo); };
  const reto = (c) => datosCarta(c).descripcion;
  const conteo = (c) => { const n = { si: 0, aveces: 0, no: 0 }; for (const r of Object.values(estado.respuestas)) if (r.reto === c) n[r.pasa]++; return n; };

  const fases = {
    llegada: () => h('div', { class: 'llegada' },
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'calc(var(--u)*26)' } },
        h('h1', null, 'Una palabra para Sage'),
        h('div', { class: 'qr' }, qrSvg(urlCliente()), h('b', null, 'Entra desde tu celular'), h('span', null, urlCliente().replace(/^https?:\/\//, ''))),
        h('div', { class: 'contador' }, `${ingresados()} de ${Object.keys(estado.asistentes).length} personas en la mesa`)),
      nube(Object.values(estado.palabras), 'Las palabras irán apareciendo aquí')),

    apertura: () => h('div', { class: 'portada' },
      h('div', { class: 'grande' }, 'Sage LAB'),
      h('div', { class: 'sub', style: { fontSize: 'calc(var(--u)*40)' } }, 'Library Advisory Board, 3ra edición en Latinoamérica'),
      h('div', { class: 'ev' }, config.nombreEvento)),

    ronda1: () => {
      const es = equipos();
      return [h('div', null, h('h2', null, 'Los retos de nuestras bibliotecas'),
          h('div', { class: 'sub' }, es.length ? `${es.length} ${es.length === 1 ? 'equipo' : 'equipos'} en la mesa. ¿Esto pasa en tu institución?` : 'Escaneen la carta grande del reto de su mesa con el celular.')),
        h('div', { class: 'muro', style: rejilla(es.length) }, es.map(c => { const n = conteo(c); return h('div', { class: 'nota' },
          h('span', { class: 'cod' }, `Equipo ${nombreEquipo(c)}`),
          h('span', { class: 'txt' }, reto(c)),
          h('span', { class: 'votos' }, h('b', null, n.si), ' nos pasa ', h('b', null, n.aveces), ' a veces ', h('b', null, n.no), ' no'),
          h('span', { class: 'quien' }, estado.equipos[c].miembros.map(nombre).join(', '))); }))];
    },

    ronda2: () => {
      const es = equipos();
      return [h('div', null, h('h2', null, 'Cartas sobre la mesa'), h('div', { class: 'sub' }, `Escaneen las cartas de su mano para ponerlas sobre su reto. Hasta ${MAX_CARTAS_EQUIPO} por equipo.`)),
        h('div', { class: 'muro', style: rejilla(es.length) }, es.map(c => { const mesa = estado.jugadas.filter(j => j.equipo === c); return h('div', { class: 'tab' },
          h('span', { class: 'cod' }, `Equipo ${nombreEquipo(c)}, ${mesa.length} de ${MAX_CARTAS_EQUIPO}`),
          h('span', { class: 'txt' }, reto(c)),
          h('div', { class: 'cartas' }, mesa.map(mini))); }))];
    },

    cuentanos: () => {
      const c = estado.destacado && estado.equipos[estado.destacado] ? estado.destacado : null;
      if (!c) return fases.ronda2();
      const eq = estado.equipos[c];
      const js = estado.jugadas.filter(j => j.equipo === c).sort((a, b) => b.clave - a.clave);
      return h('div', { class: 'destacado' },
        h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'calc(var(--u)*24)' } },
          h('div', { class: 'sub' }, `Equipo ${nombreEquipo(c)}: ${eq.miembros.map(nombre).join(', ')}`),
          h('div', { class: 'txt' }, reto(c)),
          eq.motivo ? h('div', { class: 'motivo' }, h('b', null, 'Por qué es su carta clave: '), eq.motivo) : null),
        h('div', { class: 'cartas' }, js.map(j => vistaCarta(j.carta, { tag: 'div', extra: j.clave ? h('span', { class: 'marca' }, '★') : null }))));
    },

    cierre: () => {
      const rs = Object.values(estado.encuesta);
      const prom = (k) => { const v = rs.map(r => r[k]).filter(n => typeof n === 'number'); return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1).replace('.', ',') : '-'; };
      return [h('h2', null, 'Antes de despedirnos, cuéntanos'),
        h('div', { class: 'sub' }, 'Responde las preguntas en tu celular. Todas son opcionales.'),
        h('div', { class: 'cifras', style: { marginTop: 'auto' } },
          h('div', { class: 'cifra' }, h('b', null, rs.length), h('span', null, rs.length === 1 ? 'persona ya respondió' : 'personas ya respondieron')),
          h('div', { class: 'cifra' }, h('b', null, prom('p4')), h('span', null, PREGUNTAS[3].texto + ' (de 1 a 5)')),
          h('div', { class: 'cifra' }, h('b', null, prom('p5')), h('span', null, PREGUNTAS[4].texto + ' (de 1 a 5)')))];
    },

    gracias: () => h('div', { class: 'llegada', style: { gridTemplateColumns: 'calc(var(--u)*640) 1fr' } },
      h('div', { style: { display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'calc(var(--u)*24)' } },
        h('h1', { style: { fontSize: 'calc(var(--u)*120)' } }, 'Gracias'),
        h('div', { class: 'sub' }, 'Por poner sus cartas sobre la mesa. Así nos describieron hoy.')),
      nube([...Object.values(estado.palabras), ...Object.values(estado.encuesta).map(r => r.p1).filter(Boolean)], '')),
  };

  const render = () => {
    const c = fases[estado.fase]();
    pintar(raiz, h('div', { class: 'proy' }, estado.fase === 'apertura' || estado.fase === 'gracias' ? h('div', { class: 'cinta' }) : null, h('div', { class: 'zona' }, c), pie()));
    ajustar();
  };
  // Reduce la letra del muro hasta que todo quepa en pantalla (muchos grupos o textos largos).
  function ajustar() {
    const m = raiz.querySelector('.muro');
    if (!m) return;
    let t = parseFloat(getComputedStyle(m).fontSize);
    const desborda = () => m.scrollHeight > m.clientHeight + 1 || [...m.children].some(c => c.scrollHeight > c.clientHeight + 1);
    while (desborda() && t > 9) { t -= 1; m.style.fontSize = t + 'px'; }
  }
  window.addEventListener('resize', () => render());
  const quitar = store.subscribe((e) => { estado = e; render(); });
  return () => quitar();
}
