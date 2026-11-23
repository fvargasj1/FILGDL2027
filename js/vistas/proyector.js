import { h, pintar, datosCarta, vistaCarta, logoFil, nombreEquipo, reloj } from './ui.js';
import { equiposActivos, MAX_CARTAS_EQUIPO, resumenVoto } from '../logica/estado.js';
import { PREGUNTAS, conteoRecursos } from '../contenido/encuesta.js';
import { config } from '../config.js';
import { CATALOGO, NIVELES } from '../contenido/experiencia.js';
import { avanceExperiencia, resumenRecursos, rankingDeseo, resumenNps, promediosDims, fraseDeClave } from '../logica/experiencia.js';
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
function nube(palabras, vacio, escala = 1) {
  const cuenta = new Map();
  for (const p of palabras) { const k = p.trim().toLowerCase(); if (!k) continue; const v = cuenta.get(k) || { texto: p.trim(), n: 0 }; v.n++; cuenta.set(k, v); }
  const items = [...cuenta.values()].sort((a, b) => b.n - a.n).slice(0, 80);
  if (!items.length) return h('div', { class: 'nube' }, h('span', { class: 'vacia' }, vacio));
  const max = items[0].n;
  const colores = ['#ffffff', '#f5ae8d', '#a8d9de', '#ccb4d7'];
  const total = items.length;
  const base = (total > 40 ? 34 : total > 20 ? 46 : 60) * escala;
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

    experiencia: () => (vistasExperiencia[estado.vistaExperiencia] ?? vistasExperiencia.avance)(),

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
      if (estado.votacion === 'abierta') return votoAbierto();
      if (estado.votacion === 'resultado') return votoResultado();
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
          h('div', { class: 'cifra' }, h('b', null, prom('p5')), h('span', null, PREGUNTAS[4].texto + ' (de 1 a 5)'))),
        recursos()];
    },

    gracias: () => {
      const salir = Object.values(estado.encuesta).map(r => r.p1).filter(Boolean);
      return h('div', { class: 'gracias' },
        h('div', { class: 'gr-tit' },
          h('h1', null, 'Gracias'),
          h('div', { class: 'sub' }, 'Por poner sus cartas sobre la mesa.')),
        salir.length
          ? h('div', { class: 'antes-despues' },
              h('div', { class: 'col' }, h('span', { class: 'rotulo' }, 'Al llegar'), nube(Object.values(estado.palabras), '', 0.55)),
              h('div', { class: 'col' }, h('span', { class: 'rotulo' }, 'Al salir'), nube(salir, '', 0.55)))
          : nube(Object.values(estado.palabras), ''));
    },
  };

  // ---------- Tu experiencia con Sage ----------
  const logoBlanco = (c, cls = 'logo-b') => c.logo
    ? h('img', { class: cls, src: `assets/recursos/blanco/${c.logo}.svg`, alt: c.nombre })
    : h('span', { class: cls + ' txt' }, c.nombre);
  const logoAzul = (c, cls = 'logo-a') => c.logo
    ? h('img', { class: cls, src: `assets/recursos/${c.logo}.svg`, alt: c.nombre })
    : h('span', { class: cls + ' txt' }, c.nombre);
  const coma = (n, d = 1) => (n == null ? '-' : n.toFixed(d).replace('.', ','));

  const vistasExperiencia = {
    avance: () => {
      const a = avanceExperiencia(estado);
      return h('div', { class: 'exp-avance' },
        h('div', { class: 'col' },
          h('h1', null, 'Tu experiencia con Sage'),
          h('div', { class: 'sub' }, 'Responde en tu celular: son cuatro pantallas cortas. Aquí todo se muestra sin nombre.'),
          h('div', { class: 'cuenta' }, h('b', null, a.terminaron), h('span', null, `de ${a.dentro || Object.keys(estado.asistentes).length} ya terminaron`)),
          h('div', { class: 'puntos' }, Array.from({ length: a.dentro }, (_, i) => h('i', { class: i < a.terminaron ? 'si' : null })))),
        h('div', { class: 'logos' }, CATALOGO.map(c => h('div', { class: 'celda' }, logoBlanco(c)))));
    },

    recursos: () => {
      const rs = resumenRecursos(estado);
      const n = Math.max(1, ...rs.map(r => r.tiene + r.conoce + r.nuevo));
      const seg = (cls, v) => (v ? h('span', { class: cls, style: { flexGrow: v } }, v) : null);
      return [h('div', null, h('h2', null, 'Así está Sage en esta sala'),
          h('div', { class: 'leyenda' }, h('span', { class: 'tiene' }, 'Lo tienen'), h('span', { class: 'conoce' }, 'Lo conocen, no lo tienen'), h('span', { class: 'nuevo' }, 'Nuevo para ellos'))),
        h('div', { class: 'radiografia' }, rs.map(r => {
          const tot = r.tiene + r.conoce + r.nuevo;
          return h('div', { class: 'fila-rec' },
            h('div', { class: 'logo' }, logoBlanco(r)),
            h('div', { class: 'pila', style: { width: `${(tot / n) * 100}%` } }, seg('tiene', r.tiene), seg('conoce', r.conoce), seg('nuevo', r.nuevo)));
        }))];
    },

    satisfaccion: () => {
      const nps = resumenNps(estado);
      const dims = promediosDims(estado);
      const porValor = Array.from({ length: 11 }, (_, v) => nps.valores.filter(x => x === v).length);
      const signo = nps.nps == null ? '-' : nps.nps > 0 ? `+${nps.nps}` : nps.nps < 0 ? `−${-nps.nps}` : '0';
      return h('div', { class: 'satisf' },
        h('div', { class: 'col' },
          h('h2', null, '¿Recomendarían Sage a un colega?'),
          h('div', { class: 'nps' }, h('b', null, signo), h('span', null, 'Índice de recomendación de la sala (NPS), de −100 a +100')),
          h('div', { class: 'tira' }, porValor.map((k, v) => h('div', { class: 'col-v ' + (v >= 9 ? 'pro' : v >= 7 ? 'pas' : 'det') },
            h('div', { class: 'pila-p' }, Array.from({ length: k }, () => h('i'))), h('span', null, v)))),
          h('div', { class: 'grupos' },
            h('span', { class: 'det' }, `${nps.detractores} de 0 a 6`), h('span', { class: 'pas' }, `${nps.pasivos} de 7 a 8`), h('span', { class: 'pro' }, `${nps.promotores} de 9 a 10`))),
        h('div', { class: 'col' }, h('h2', null, 'Cómo califican cada aspecto'), radar(dims)));
    },

    deseo: () => {
      const rk = rankingDeseo(estado);
      const [top, resto] = [rk.slice(0, 3), rk.slice(3)];
      return [h('div', null, h('h2', null, 'Si el presupuesto no fuera un tema'),
          h('div', { class: 'sub' }, 'Lo que suscribiría la sala. El primer lugar de cada persona suma 3 puntos, el segundo 2 y el tercero 1.')),
        top.length ? h('div', { class: 'podio' }, top.map((r, i) => h('div', { class: 'pod' },
          h('span', { class: 'pos' }, i + 1),
          h('div', { class: 'logo' }, logoAzul(r)),
          h('b', null, `${r.puntos} puntos`),
          h('span', null, `${r.eligieron} ${r.eligieron === 1 ? 'persona lo eligió' : 'personas lo eligieron'}${r.brecha ? `; ${r.brecha} todavía no lo ${r.brecha === 1 ? 'tiene' : 'tienen'}` : ''}`))))
          : h('div', { class: 'sub' }, 'Las respuestas irán apareciendo aquí.'),
        resto.length ? h('div', { class: 'resto' }, resto.map(r => h('span', null, `${r.nombre} (${r.puntos})`))) : null];
    },

    frases: () => {
      const fs = estado.frases.map(c => fraseDeClave(estado, c)).filter(Boolean);
      return [h('div', null, h('h2', null, 'Lo que dijo la sala'), h('div', { class: 'sub' }, 'Sin nombres. Algunas respuestas elegidas por el equipo Sage.')),
        fs.length ? h('div', { class: 'frases', style: { gridTemplateColumns: `repeat(${fs.length <= 2 ? fs.length : fs.length <= 4 ? 2 : 3}, minmax(0,1fr))` } },
          fs.map(f => h('figure', { class: 'frase' }, h('blockquote', null, f.campo === 'frase' ? `…${f.texto}` : f.texto), h('figcaption', null, f.etiqueta))))
          : h('div', { class: 'sub' }, 'En un momento compartimos algunas respuestas.')];
    },
  };

  // Radar de seis aspectos, promedio de 1 a 5. Sin respuestas, el aspecto queda en el centro.
  function radar(dims) {
    const W = 1040, H = 640, cx = W / 2, cy = H / 2 + 10, R = 220;
    const ang = (i) => (Math.PI * 2 * i) / dims.length - Math.PI / 2;
    const pt = (i, v) => [cx + Math.cos(ang(i)) * R * (v / 5), cy + Math.sin(ang(i)) * R * (v / 5)];
    const svg = (tag, attrs, ...hijos) => { const el = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v); el.append(...hijos); return el; };
    const anillos = [1, 2, 3, 4, 5].map(v => svg('polygon', { points: dims.map((_, i) => pt(i, v).join(',')).join(' '), class: 'anillo' }));
    const ejes = dims.map((_, i) => svg('line', { x1: cx, y1: cy, x2: pt(i, 5)[0], y2: pt(i, 5)[1], class: 'eje' }));
    const hay = dims.some(d => d.prom != null);
    const forma = hay ? svg('polygon', { points: dims.map((d, i) => pt(i, d.prom ?? 0).join(',')).join(' '), class: 'forma' }) : null;
    const puntos = dims.filter(d => d.prom != null).map(d => { const i = dims.indexOf(d); const [x, y] = pt(i, d.prom); return svg('circle', { cx: x, cy: y, r: 9, class: 'punto' }); });
    const etiquetas = dims.map((d, i) => {
      const [x, y] = pt(i, 6.15);
      const anchor = Math.abs(x - cx) < 10 ? 'middle' : x > cx ? 'start' : 'end';
      const t = svg('text', { x, y, 'text-anchor': anchor, class: 'etq' });
      t.append(svg('tspan', { x, dy: '0' }, d.nombre), svg('tspan', { x, dy: '1.25em', class: 'val' }, d.prom == null ? 'Sin datos' : `${coma(d.prom)} - ${NIVELES[Math.round(d.prom) - 1]}`));
      return t;
    });
    return svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'radar', role: 'img', 'aria-label': dims.map(d => `${d.nombre}: ${coma(d.prom)}`).join('; ') },
      ...anillos, ...ejes, ...(forma ? [forma] : []), ...puntos, ...etiquetas);
  }

  // Voto del salón
  function votoAbierto() {
    const es = equipos();
    const votaron = Object.keys(estado.votos ?? {}).length;
    return [h('div', null, h('h2', null, '¿Qué equipo defendió mejor su carta clave?'),
        h('div', { class: 'sub' }, `Vota desde tu celular. No puedes votar por tu propio equipo. ${votaron} ${votaron === 1 ? 'voto' : 'votos'} hasta ahora.`)),
      h('div', { class: 'muro', style: rejilla(es.length) }, es.map(c => {
        const clave = estado.jugadas.find(j => j.equipo === c && j.clave);
        return h('div', { class: 'nota votable' },
          h('span', { class: 'cod' }, `Equipo ${nombreEquipo(c)}`),
          clave ? h('span', { class: 'mini ' + datosCarta(clave.carta).tipo + ' clave' }, '★ ' + datosCarta(clave.carta).titulo) : null,
          estado.equipos[c].motivo ? h('span', { class: 'txt' }, estado.equipos[c].motivo) : null);
      }))];
  }
  function votoResultado() {
    const r = resumenVoto(estado);
    const max = Math.max(1, ...r.map(x => x.votos));
    const top = r.filter(x => x.votos === max && x.votos > 0);
    return [h('div', null, h('h2', null, top.length > 1 ? 'Empate en el voto del salón' : 'El salón eligió'),
        top.length ? h('div', { class: 'ganador' }, top.map(x => nombreEquipo(x.equipo)).join(' y ')) : h('div', { class: 'sub' }, 'Todavía no hay votos.')),
      h('div', { class: 'barras' }, r.map(x => h('div', { class: 'barra' + (x.votos === max && x.votos > 0 ? ' top' : '') },
        h('span', { class: 'n' }, nombreEquipo(x.equipo)),
        h('span', { class: 'b' }, h('i', { style: { width: (x.votos / max) * 100 + '%' } })),
        h('b', null, x.votos))))];
  }
  function recursos() {
    const r = conteoRecursos(estado.encuesta).slice(0, 6);
    if (!r.length) return null;
    const max = r[0].n;
    return h('div', { class: 'recursos' }, h('h3', null, 'Lo que quieren conocer mejor'),
      h('div', { class: 'barras' }, r.map(x => h('div', { class: 'barra' },
        h('span', { class: 'n' }, x.nombre), h('span', { class: 'b' }, h('i', { style: { width: (x.n / max) * 100 + '%' } })), h('b', null, x.n)))));
  }

  const render = () => {
    const c = fases[estado.fase]();
    pintar(raiz, h('div', { class: 'proy' }, estado.fase === 'apertura' || (estado.fase === 'gracias' && !Object.values(estado.encuesta).some(r => r.p1)) ? h('div', { class: 'cinta' }) : null, h('div', { class: 'zona' }, c), pie(),
      reloj(estado.temporizador, 'reloj-proy')));
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
