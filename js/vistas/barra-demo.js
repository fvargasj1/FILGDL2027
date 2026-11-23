import { h } from './ui.js';
import { FASES } from '../logica/estado.js';
import { RETOS, LIEBERT, ASISTENTE } from '../contenido/cartas.js';
import { NOMBRE_FASE } from './facilitador.js';

// Barra solo para el modo demo: cambiar de vista, de persona, simular una sala y simular escaneos de QR o NFC.
export function montarBarraDemo(raiz, store, yo, remontar) {
  const vista = () => location.hash.replace('#', '') || 'cliente';
  async function simular() {
    const e0 = store.getEstado();
    const ids = Object.keys(e0.asistentes).slice(4, 16);
    const palabras = ['Confianza', 'Calidad', 'Aliado', 'Innovación', 'Investigación', 'Confianza', 'Rigor', 'Cercanía', 'Calidad', 'Metodología', 'Aliado', 'Confianza'];
    const retos = ['R01', 'R03', 'R05', 'R08'];
    const manos = [['L23', 'A03', 'L19', 'A10'], ['A02', 'A05', 'A16', 'L07'], ['A09', 'A10', 'A13', 'L06'], ['L03', 'L11', 'L25', 'A04']];
    const pasa = ['si', 'aveces', 'si', 'no'];
    const intenta = (n, a) => store.dispatch(n, a).catch(() => {});
    const fase = FASES.indexOf(store.getEstado().fase);
    for (const [i, id] of ids.entries()) { await intenta('ingresar', { asistente: id }); await intenta('guardarPalabra', { asistente: id, texto: palabras[i] }); }
    if (fase < FASES.indexOf('ronda1')) return;
    for (let g = 0; g < 4; g++) {
      const miembros = ids.slice(g * 3, g * 3 + 3);
      for (const [k, m] of miembros.entries()) {
        await intenta('unirseReto', { asistente: m, reto: retos[g] });
        await intenta('responderReto', { asistente: m, pasa: pasa[(g + k) % 4], comentario: k === 0 ? 'Nos pasa sobre todo en los programas de salud.' : '' });
      }
      if (fase >= FASES.indexOf('ronda2')) for (const [k, c] of manos[g].entries()) await intenta('jugarCarta', { asistente: miembros[k % 3], carta: c });
      const primera = store.getEstado().jugadas.find(j => j.equipo === retos[g]);
      if (primera && !primera.clave) await intenta('marcarClave', { jugada: primera.id });
      if (fase >= FASES.indexOf('cuentanos')) await intenta('guardarMotivo', { equipo: retos[g], texto: 'Es la que más conversación generó en la mesa.' });
    }
    if (fase >= FASES.indexOf('cierre'))
      for (const [i, id] of ids.entries()) await intenta('guardarEncuesta', { asistente: id, respuestas: { p1: palabras[i], p4: 3 + (i % 3), p5: 2 + (i % 4), contacto: i % 2 === 0 } });
  }

  const codigos = [['Retos', RETOS], ['Liebert', LIEBERT], ['Asistente', ASISTENTE]];
  function render() {
    const e = store.getEstado();
    const mio = yo.get()?.id ?? '';
    raiz.replaceChildren(h('div', { class: 'demo', role: 'region', 'aria-label': 'Controles de demostración' },
      h('span', null, 'Modo demostración'),
      h('label', null, 'Vista ',
        h('select', { onchange: (ev) => { location.hash = ev.target.value === 'cliente' ? '' : ev.target.value; } },
          [['cliente', 'Celular del cliente'], ['proyector', 'Proyector'], ['facilitador', 'Facilitador']].map(([v, t]) => h('option', { value: v, selected: vista() === v }, t)))),
      vista() === 'cliente' ? h('label', null, 'Ver como ',
        h('select', { onchange: (ev) => { const id = ev.target.value; if (id) yo.set(id, store.getEstado().asistentes[id].reinicios); else yo.borrar(); remontar(); render(); } },
          h('option', { value: '' }, 'Nadie (pantalla de ingreso)'),
          Object.values(e.asistentes).map(a => h('option', { value: a.id, selected: a.id === mio }, a.nombre)))) : null,
      vista() === 'cliente' ? h('label', { title: 'Hace lo mismo que escanear el QR o acercar el celular al NFC de esa carta' }, 'Escanear ',
        h('select', { onchange: (ev) => { const c = ev.target.value; ev.target.value = ''; if (c) globalThis.__labEscanear?.(c); } },
          h('option', { value: '' }, 'Elige una carta'),
          codigos.map(([g, xs]) => h('optgroup', { label: g }, xs.map(x => h('option', { value: x.codigo }, `${x.codigo} ${x.titulo ?? x.equipo}`)))))) : null,
      h('span', null, `Fase: ${NOMBRE_FASE[e.fase]}`),
      h('button', { onclick: simular, title: 'Hace ingresar a 12 personas, forma 4 equipos por reto, responde y juega cartas según la fase' }, 'Simular sala'),
      h('button', { onclick: () => store.reset() }, 'Reiniciar demo')));
  }
  store.subscribe(render);
  window.addEventListener('hashchange', render);
}
