import { h, pintar, logoSage, nombreEquipo, datosCarta, reloj } from './ui.js';
import { FASES, equiposActivos, RESPUESTAS_RETO, MAX_CARTAS_EQUIPO, resumenVoto } from '../logica/estado.js';
import { config } from '../config.js';
import { cargarLibreria } from '../cargar-libreria.js';
import { VERSION } from '../version.js';
import { MAX_FRASES } from '../contenido/experiencia.js';
import { avanceExperiencia, frasesAbiertas } from '../logica/experiencia.js';

export const NOMBRE_FASE = { llegada: 'Llegada', apertura: 'Apertura', experiencia: 'Tu experiencia con Sage', ronda1: 'Ronda 1: retos', ronda2: 'Ronda 2: cartas', cuentanos: 'Cuéntanos', cierre: 'Cierre', gracias: 'Gracias' };

const cargarExcel = () => cargarLibreria('exceljs');

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

      seccionTemporizador(),
      estado.fase === 'experiencia' ? seccionExperiencia() : null,
      estado.fase === 'cuentanos' || estado.votacion !== 'cerrada' ? seccionVoto(personas.length) : null,

      h('section', null, h('h2', null, 'Pantalla y datos'),
        h('div', { class: 'bloque' },
          h('button', { class: 'btn ancho', onclick: async () => { try { await cargarExcel(); await (await import('../exportar.js')).descargarExcel(estado); } catch (e) { if (e?.code !== 'declined') set({ error: 'No se pudo descargar el Excel.' }); } } }, 'Descargar Excel'),
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
          h('div', { class: 'q' }, a.nombre, a.registro === 'evento' ? h('span', { class: 'insignia' }, 'Nuevo') : null,
            h('small', null, [a.institucion, a.equipo ? `equipo ${nombreEquipo(a.equipo)}` : null].filter(Boolean).join(', '))),
          a.ingreso ? conConfirmar('rei' + a.id, 'Reiniciar celular', () => hacer('reiniciarAsistente', { asistente: a.id })) : null)))),
      h('p', { class: 'sutil', style: { textAlign: 'center', fontSize: '13px' } }, `Plataforma versión ${VERSION}`));
  }

  // Tu experiencia con Sage: avance, qué muestra el proyector y qué frases se proyectan (sin nombre).
  const VISTAS = [['avance', 'Avance'], ['recursos', 'Recursos'], ['satisfaccion', 'Satisfacción'], ['deseo', 'Sin presupuesto'], ['frases', 'Frases']];
  function seccionExperiencia() {
    const a = avanceExperiencia(estado);
    const frases = frasesAbiertas(estado);
    const grupos = [...new Set(frases.map(f => f.nombreTema))];
    return h('section', null, h('h2', null, 'Tu experiencia con Sage'),
      h('p', { class: 'sutil', style: { marginBottom: '10px' } }, `${a.terminaron} de ${a.dentro} terminaron.` + (a.pendientes.length && a.pendientes.length <= 8 ? ` Faltan: ${a.pendientes.map(p => p.nombre).join(', ')}.` : '')),
      h('p', { style: { fontWeight: 700, color: 'var(--navy)', margin: '6px 0' } }, 'En el proyector'),
      h('div', { class: 'fases', style: { marginBottom: '14px' } }, VISTAS.map(([v, t]) =>
        h('button', { class: 'btn peq ' + (estado.vistaExperiencia === v ? '' : 'sec'), 'aria-pressed': String(estado.vistaExperiencia === v), onclick: () => hacer('vistaExperiencia', { vista: v }) }, t))),
      h('p', { style: { fontWeight: 700, color: 'var(--navy)', margin: '6px 0' } }, `Respuestas abiertas (${frases.length}). En pantalla: ${estado.frases.length} de ${MAX_FRASES}`),
      h('p', { class: 'sutil', style: { marginBottom: '8px' } }, 'Agrupadas por palabras clave, así que el tema es aproximado. En el proyector salen sin nombre.'),
      frases.length ? grupos.map(g => h('div', { class: 'grupo-frases' }, h('h3', null, g),
        h('div', { class: 'filas' }, frases.filter(f => f.nombreTema === g).map(f => {
          const en = estado.frases.includes(f.clave);
          return h('div', { class: 'fila' + (en ? ' proyectada' : '') },
            h('div', { class: 'q' }, f.texto, h('small', null, `${f.etiqueta}. ${estado.asistentes[f.asistente]?.nombre ?? ''}`)),
            h('button', { class: 'btn peq ' + (en ? '' : 'sec'), onclick: () => hacer('proyectarFrase', { clave: f.clave }) }, en ? 'Quitar' : 'Proyectar'));
        }))))
        : h('p', { class: 'sutil' }, 'Todavía no hay respuestas abiertas.'));
  }

  // Temporizador: el facilitador lo inicia a mano; se ve en el proyector y en los celulares.
  function seccionTemporizador() {
    const t = estado.temporizador;
    const tm = (accion, segundos) => hacer('temporizador', { accion, segundos });
    return h('section', null, h('h2', null, 'Temporizador'),
      t ? h('div', { class: 'temp-fac' },
            reloj(t, 'reloj-fac'),
            h('div', { class: 'fases' },
              t.fin ? h('button', { class: 'btn peq', onclick: () => tm('pausar') }, 'Pausar') : h('button', { class: 'btn peq', onclick: () => tm('reanudar') }, 'Reanudar'),
              h('button', { class: 'btn peq sec', onclick: () => tm('sumar', 60) }, '+1 min'),
              h('button', { class: 'btn peq sec', onclick: () => tm('detener') }, 'Quitar de la pantalla')))
        : h('div', null,
            h('p', { class: 'sutil', style: { marginBottom: '10px' } }, 'Elige cuánto dura esta parte. Arranca en cuanto lo toques y se ve en el proyector y en los celulares.'),
            h('div', { class: 'fases' }, [1, 2, 3, 5, 8, 10, 15].map(m => h('button', { class: 'btn peq sec', onclick: () => tm('iniciar', m * 60) }, `${m} min`)))));
  }

  function seccionVoto(total) {
    const ranking = resumenVoto(estado);
    const votaron = Object.keys(estado.votos ?? {}).length;
    const v = estado.votacion;
    return h('section', null, h('h2', null, 'Voto del salón'),
      h('p', { class: 'sutil', style: { marginBottom: '10px' } },
        v === 'cerrada' ? 'Ábrela cuando todos los equipos hayan contado su carta clave. Nadie puede votar por su propio equipo.'
          : v === 'abierta' ? `Votación abierta: ${votaron} de ${total} personas ya votaron. El proyector muestra los equipos.`
            : 'El proyector muestra el resultado.'),
      h('div', { class: 'fases', style: { marginBottom: '12px' } },
        v === 'cerrada' ? h('button', { class: 'btn peq', onclick: () => hacer('cambiarVotacion', { estado: 'abierta' }) }, 'Abrir votación') : null,
        v === 'abierta' ? conConfirmar('votoRes', 'Cerrar y mostrar resultado', () => hacer('cambiarVotacion', { estado: 'resultado' }), 'btn peq') : null,
        v === 'resultado' ? h('button', { class: 'btn peq sec', onclick: () => hacer('cambiarVotacion', { estado: 'abierta' }) }, 'Reabrir votación') : null,
        v !== 'cerrada' ? h('button', { class: 'btn peq sec', onclick: () => hacer('cambiarVotacion', { estado: 'cerrada' }) }, 'Quitar de la pantalla') : null),
      v !== 'cerrada' ? h('div', { class: 'filas' }, ranking.map(r => h('div', { class: 'fila' },
        h('b', { style: { color: 'var(--navy)', minWidth: '96px' } }, nombreEquipo(r.equipo)),
        h('div', { class: 'q' }, `${r.votos} ${r.votos === 1 ? 'voto' : 'votos'}`)))) : null);
  }

  const quitar = store.subscribe((e) => { estado = e; render(); });
  return () => quitar();
}
