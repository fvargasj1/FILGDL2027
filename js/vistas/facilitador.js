import { h, pintar, logoSage, nombreEquipo, datosCarta } from './ui.js';
import { FASES, equiposActivos, RESPUESTAS_RETO, MAX_CARTAS_EQUIPO } from '../logica/estado.js';
import { config } from '../config.js';
import { cargarLibreria } from '../cargar-libreria.js';

export const NOMBRE_FASE = { llegada: 'Llegada', apertura: 'Apertura', ronda1: 'Ronda 1: retos', ronda2: 'Ronda 2: cartas', cuentanos: 'Cuéntanos', cierre: 'Cierre', gracias: 'Gracias' };

const cargarXlsx = () => cargarLibreria('xlsx');

export function montarFacilitador(raiz, store) {
  let estado = store.getEstado();
  const ui = { confirmar: null, error: null, pinError: false };
  const ses = (() => { try { return sessionStorage; } catch { return null; } })();
  let autorizado = ses?.getItem('lab-fac') === '1';

  const render = () => pintar(raiz, autorizado ? panel() : pin());
  const set = (c) => { Object.assign(ui, c); render(); };
  async function hacer(nombre, args) {
    ui.error = null;
    try { await store.dispatch(nombre, args); } catch (e) { ui.error = e.message; }
    ui.confirmar = null; render();
  }
  // Confirmación en línea: primer toque pide confirmar, segundo ejecuta.
  const conConfirmar = (clave, etiqueta, accion, clase = 'btn sec peq') => ui.confirmar === clave
    ? h('span', { style: { display: 'inline-flex', gap: '6px' } },
        h('button', { class: 'btn peq', onclick: accion }, 'Confirmar'),
        h('button', { class: 'btn link', onclick: () => set({ confirmar: null }) }, 'Cancelar'))
    : h('button', { class: clase, onclick: () => set({ confirmar: clave }) }, etiqueta);

  function pin() {
    const entrar = () => {
      const v = raiz.querySelector('[data-k="pin"]').value;
      if (v === config.pinFacilitador) { autorizado = true; ses?.setItem('lab-fac', '1'); render(); } else set({ pinError: true });
    };
    return h('div', { class: 'fac' }, logoSage(),
      h('h1', null, 'Panel del equipo Sage'),
      h('input', { class: 'campo', 'data-k': 'pin', type: 'password', inputmode: 'numeric', placeholder: 'PIN', onkeydown: (e) => { if (e.key === 'Enter') entrar(); } }),
      h('button', { class: 'btn ancho', onclick: entrar }, 'Entrar'),
      ui.pinError ? h('div', { class: 'error' }, 'PIN incorrecto.') : null);
  }

  function panel() {
    const i = FASES.indexOf(estado.fase);
    const personas = Object.values(estado.asistentes);
    const dentro = personas.filter(a => a.ingreso).length;
    const equipos = equiposActivos(estado);
    const sig = FASES[i + 1], ant = FASES[i - 1];
    return h('div', { class: 'fac' },
      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, logoSage(), h('span', { style: { fontWeight: 700, color: 'var(--navy)' } }, `${dentro} de ${personas.length} en la mesa`)),
      h('section', null,
        h('h1', null, NOMBRE_FASE[estado.fase]),
        h('div', { class: 'fases', style: { margin: '10px 0 14px' } }, FASES.map(f => h('span', { class: f === estado.fase ? 'actual' : null }, NOMBRE_FASE[f]))),
        h('div', { class: 'dos' },
          ant ? conConfirmar('ant', `Volver a ${NOMBRE_FASE[ant]}`, () => hacer('cambiarFase', { fase: ant })) : h('span'),
          sig ? conConfirmar('sig', `Pasar a ${NOMBRE_FASE[sig]}`, () => hacer('cambiarFase', { fase: sig }), 'btn') : h('span')),
        ui.error ? h('div', { class: 'error' }, ui.error) : null),

      h('section', null, h('h2', null, 'Pantalla y datos'),
        h('div', { class: 'bloque' },
          h('button', { class: 'btn ancho', onclick: async () => { try { await cargarXlsx(); await (await import('../exportar.js')).descargarExcel(estado); } catch (e) { if (e?.code !== 'declined') set({ error: 'No se pudo descargar el Excel.' }); } } }, 'Descargar Excel'),
          h('a', { class: 'btn sec ancho', href: '#proyector', target: '_blank' }, 'Abrir el proyector en otra pestaña'),
          ui.confirmar === 'reset2'
            ? h('button', { class: 'btn ancho', style: { background: 'var(--error)' }, onclick: async () => { await store.reset(); set({ confirmar: null }); } }, 'Sí, borrar todo y empezar de cero')
            : ui.confirmar === 'reset1'
              ? h('button', { class: 'btn sec ancho', onclick: () => set({ confirmar: 'reset2' }) }, 'Esto borra palabras, equipos, respuestas, cartas y encuesta. Toca otra vez para confirmar')
              : h('button', { class: 'btn link', onclick: () => set({ confirmar: 'reset1' }) }, 'Reiniciar toda la sesión'))),

      estado.fase === 'cuentanos' ? h('section', null, h('h2', null, 'Equipo en pantalla'),
        h('div', { class: 'fases' },
          h('button', { class: 'btn peq ' + (estado.destacado ? 'sec' : ''), onclick: () => hacer('destacar', { equipo: null }) }, 'Todos'),
          equipos.map(c => h('button', { class: 'btn peq ' + (estado.destacado === c ? '' : 'sec'), onclick: () => hacer('destacar', { equipo: c }) }, nombreEquipo(c))))) : null,

      h('section', null, h('h2', null, `Equipos (${equipos.length})`),
        h('div', { class: 'filas' }, equipos.length ? equipos.map(c => {
          const mesa = estado.jugadas.filter(j => j.equipo === c);
          return h('div', { class: 'fila' },
            h('b', { style: { color: 'var(--navy)', minWidth: '84px' } }, nombreEquipo(c), h('small', { style: { display: 'block', fontWeight: 600, color: '#5b5d55' } }, c)),
            h('div', { class: 'q' }, datosCarta(c).descripcion,
              h('small', null, `${estado.equipos[c].miembros.length} personas, ${mesa.length} de ${MAX_CARTAS_EQUIPO} cartas${mesa.length ? ': ' + mesa.map(j => (j.clave ? '★' : '') + j.carta).join(', ') : ''}`)));
        }) : h('p', { class: 'sutil' }, 'Aún no hay equipos. Se forman cuando alguien escanea un reto.'))),

      h('section', null, h('h2', null, `Respuestas a los retos (${Object.keys(estado.respuestas).length})`),
        h('div', { class: 'filas' }, Object.entries(estado.respuestas).map(([id, r]) => h('div', { class: 'fila' },
          h('div', { class: 'q' }, `${RESPUESTAS_RETO[r.pasa]}${r.comentario ? ': ' + r.comentario : ''}`, h('small', null, `${estado.asistentes[id]?.nombre}, equipo ${nombreEquipo(r.reto)}`)),
          r.comentario ? conConfirmar('com' + id, 'Borrar comentario', () => hacer('borrarComentario', { asistente: id })) : null)))),

      h('section', null, h('h2', null, `Palabras (${Object.keys(estado.palabras).length})`),
        h('div', { class: 'filas' }, Object.entries(estado.palabras).map(([id, p]) => h('div', { class: 'fila' },
          h('div', { class: 'q' }, p, h('small', null, estado.asistentes[id]?.nombre)),
          conConfirmar('pal' + id, 'Borrar', () => hacer('borrarPalabra', { asistente: id })))))),

      h('section', null, h('h2', null, 'Asistentes'),
        h('div', { class: 'filas' }, personas.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map(a => h('div', { class: 'fila' },
          h('span', { class: 'punto' + (a.ingreso ? ' si' : ''), title: a.ingreso ? 'En la mesa' : 'Sin ingresar' }),
          h('div', { class: 'q' }, a.nombre, h('small', null, [a.institucion, a.equipo ? `equipo ${nombreEquipo(a.equipo)}` : null].filter(Boolean).join(', '))),
          a.ingreso ? conConfirmar('rei' + a.id, 'Reiniciar celular', () => hacer('reiniciarAsistente', { asistente: a.id })) : null)))));
  }

  const quitar = store.subscribe((e) => { estado = e; render(); });
  return () => quitar();
}
