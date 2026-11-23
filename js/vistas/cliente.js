import { h, pintar, borrador, vistaCarta, datosCarta, logoSage, sinTildes, nombreEquipo } from './ui.js';
import { PREGUNTAS, CONTACTO_TEXTO } from '../contenido/encuesta.js';
import { MAX_PALABRA, MAX_COMENTARIO, MAX_MOTIVO, MAX_CARTAS_EQUIPO, RESPUESTAS_RETO } from '../logica/estado.js';
import { normalizarCodigo, esReto, esCarta } from '../contenido/cartas.js';
import { config } from '../config.js';

const primerNombre = (a) => a?.nombre.split(' ')[0] ?? '';

// pendiente: código que llegó por QR o NFC antes de montar la vista ({ codigo, bruto } o null).
export function montarCliente(raiz, store, yo, pendiente = null) {
  const ui = { busqueda: '', confirmar: null, error: {}, aviso: {}, encuesta: null, editarPalabra: false, hoja: null, escribir: false, pasa: undefined };
  let estado = store.getEstado();

  const render = () => pintar(raiz, vista());
  const set = (cambios) => { Object.assign(ui, cambios); render(); };
  async function hacer(zona, nombre, args, alTerminar) {
    ui.error[zona] = null; ui.aviso[zona] = null;
    try { await store.dispatch(nombre, args); alTerminar?.(); return true; }
    catch (err) { ui.error[zona] = err.message || 'Algo salió mal. Intenta de nuevo.'; return false; }
    finally { render(); }
  }
  const err = (zona) => (ui.error[zona] ? h('div', { class: 'error', role: 'alert' }, ui.error[zona]) : null);
  const ok = (zona) => (ui.aviso[zona] ? h('div', { class: 'ok', role: 'status' }, ui.aviso[zona]) : null);
  const valor = (k) => raiz.querySelector(`[data-k="${k}"]`)?.value ?? '';
  function limpiar(k) { const el = raiz.querySelector(`[data-k="${k}"]`); if (el) delete el.dataset.borrador; }

  // ¿Quién soy? Si el facilitador reinició mi celular, vuelvo a la lista.
  function miPersona() {
    const id = yo.get();
    if (!id) return null;
    const a = estado.asistentes[id.id];
    if (!a || a.reinicios !== id.reinicios) { yo.borrar(); return null; }
    return a;
  }

  // ---------- lo que llega escaneado (QR, NFC o escrito a mano) ----------
  async function procesar(a, p) {
    const cod = p.codigo;
    ui.error.hoja = null; ui.aviso.hoja = null;
    if (!cod) return set({ hoja: { invalido: p.bruto } });
    if (esReto(cod) && !a.equipo) {
      ui.hoja = { codigo: cod };
      await hacer('hoja', 'unirseReto', { asistente: a.id, reto: cod }, () => { ui.aviso.hoja = `Listo, estás en el equipo ${nombreEquipo(cod)}.`; });
      return;
    }
    set({ hoja: { codigo: cod } });
  }
  function abrirCodigo(a) {
    const bruto = valor('cod-manual');
    limpiar('cod-manual');
    ui.escribir = false;
    procesar(a, { codigo: normalizarCodigo(bruto), bruto });
  }

  function bloqueEscribir(a, texto = 'Escribir el código a mano') {
    if (!ui.escribir) return h('button', { class: 'btn link', onclick: () => set({ escribir: true }) }, texto);
    return h('div', { class: 'bloque escribir' },
      h('label', { for: 'cod-manual', class: 'sutil' }, 'Está impreso junto al QR, por ejemplo L05 o R03.'),
      h('div', { class: 'dos' },
        h('input', { id: 'cod-manual', class: 'campo codigo-campo', 'data-k': 'cod-manual', maxlength: 4, placeholder: 'L05', autocapitalize: 'characters', autocomplete: 'off', oninput: borrador,
          onkeydown: (e) => { if (e.key === 'Enter') abrirCodigo(a); } }),
        h('button', { class: 'btn', onclick: () => abrirCodigo(a) }, 'Abrir')),
      h('button', { class: 'btn link', onclick: () => set({ escribir: false }) }, 'Cancelar'));
  }

  const cerrarHoja = () => set({ hoja: null, error: { ...ui.error, hoja: null }, aviso: { ...ui.aviso, hoja: null } });
  function hoja(a) {
    const x = ui.hoja;
    if (!x) return null;
    const pie = h('button', { class: 'btn sec ancho', onclick: cerrarHoja }, 'Cerrar');
    let contenido;
    if (x.invalido !== undefined) {
      contenido = [h('h2', null, 'No reconocemos ese código'),
        h('p', null, `Leímos "${x.invalido || 'nada'}". Revisa el código impreso junto al QR y escríbelo a mano.`), bloqueEscribir(a, 'Escribirlo a mano')];
    } else if (esReto(x.codigo)) {
      const mio = a.equipo === x.codigo;
      contenido = [vistaCarta(x.codigo, { tag: 'div' }),
        mio ? h('p', { class: 'ok' }, ui.aviso.hoja || `Estás en el equipo ${nombreEquipo(x.codigo)}.`)
          : h('button', { class: 'btn ancho', onclick: () => hacer('hoja', 'unirseReto', { asistente: a.id, reto: x.codigo }, () => { ui.aviso.hoja = `Listo, ahora estás en el equipo ${nombreEquipo(x.codigo)}.`; }) },
            a.equipo ? `Cambiarme de ${nombreEquipo(a.equipo)} a ${nombreEquipo(x.codigo)}` : `Unirme al equipo ${nombreEquipo(x.codigo)}`)];
    } else if (esCarta(x.codigo)) {
      const d = datosCarta(x.codigo);
      const enMesa = a.equipo && estado.jugadas.some(j => j.equipo === a.equipo && j.carta === x.codigo);
      const puedeJugar = ['ronda2', 'cuentanos'].includes(estado.fase);
      let accion;
      if (enMesa) accion = h('p', { class: 'ok' }, ui.aviso.hoja || `Está sobre el reto de ${nombreEquipo(a.equipo)}.`);
      else if (!puedeJugar) accion = h('p', { class: 'sutil' }, 'Guárdala: la jugarán en la ronda de cartas. Mientras tanto, puedes probarla.');
      else if (!a.equipo) accion = h('p', { class: 'sutil' }, 'Para jugarla, primero escanea el reto de tu mesa.');
      else accion = h('button', { class: 'btn ancho', onclick: () => hacer('hoja', 'jugarCarta', { asistente: a.id, carta: x.codigo }, () => { ui.aviso.hoja = `Jugada sobre el reto de ${nombreEquipo(a.equipo)}.`; }) }, `Jugarla en el reto de ${nombreEquipo(a.equipo)}`);
      contenido = [vistaCarta(x.codigo, { tag: 'div', extra: d.pruebalo ? h('span', { class: 'prueba-txt' }, `Pruébalo: “${d.pruebalo}”`) : null }),
        accion,
        h('a', { class: 'btn calido ancho', href: d.url, target: '_blank', rel: 'noopener' }, d.tipo === 'asistente' ? 'Pruébalo en el asistente' : 'Ver la revista')];
    }
    return h('div', { class: 'detalle', onclick: (e) => { if (e.target.classList.contains('detalle')) cerrarHoja(); } },
      h('div', { class: 'hoja', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Carta escaneada' }, contenido, err('hoja'), pie));
  }

  // ---------- pantallas ----------
  function encabezado(a) {
    return h('header', null, logoSage(),
      h('div', { class: 'ev' }, config.nombreEvento, a ? h('small', null, a.equipo ? `${a.nombre}, equipo ${nombreEquipo(a.equipo)}` : a.nombre) : null));
  }

  function pantallaIngreso() {
    if (ui.confirmar) {
      const a = estado.asistentes[ui.confirmar];
      return h('div', { class: 'bloque' },
        h('h1', null, '¿Eres tú?'),
        h('div', { class: 'persona', style: { cursor: 'default' } }, h('b', null, a.nombre), h('span', null, a.institucion)),
        a.ingreso ? h('p', { class: 'sutil' }, 'Esta persona ya ingresó en otro celular. Si eres tú, puedes continuar aquí.') : null,
        h('button', { class: 'btn ancho', onclick: () => { yo.set(a.id, a.reinicios); set({ confirmar: null }); hacer('ingreso', 'ingresar', { asistente: a.id }); } }, 'Sí, soy yo'),
        h('button', { class: 'btn sec ancho', onclick: () => set({ confirmar: null }) }, 'No, volver a la lista'));
    }
    const q = sinTildes(ui.busqueda.trim());
    const lista = Object.values(estado.asistentes)
      .filter(a => !q || sinTildes(a.nombre + ' ' + a.institucion).includes(q))
      .sort((x, y) => x.nombre.localeCompare(y.nombre, 'es'));
    return h('div', { class: 'bloque' },
      h('h1', null, 'Bienvenida, bienvenido'),
      pendiente ? h('p', { class: 'ok' }, 'Leímos tu carta. Primero dinos quién eres y enseguida la abrimos.') : null,
      h('p', null, 'Busca tu nombre y tócalo para entrar.'),
      h('input', { class: 'campo', 'data-k': 'buscar', type: 'search', placeholder: 'Tu nombre o institución', value: ui.busqueda, autocomplete: 'off',
        oninput: (e) => { ui.busqueda = e.target.value; render(); } }),
      h('div', { class: 'lista-personas' },
        lista.length ? lista.map(a => h('button', { class: 'persona', onclick: () => set({ confirmar: a.id }) }, h('b', null, a.nombre), h('span', null, a.institucion)))
          : h('p', { class: 'sutil' }, 'No encontramos ese nombre. Pide ayuda a alguien del equipo de Sage.')),
      err('ingreso'));
  }

  function bloquePalabra(a) {
    const mia = estado.palabras[a.id];
    if (mia && !ui.editarPalabra) {
      return h('div', { class: 'bloque' },
        h('h2', null, 'Tu palabra para Sage'),
        h('div', { class: 'codigo', style: { letterSpacing: '0', fontSize: '34px' } }, mia),
        h('p', { class: 'sutil' }, 'Ya está en la pantalla. Mientras empezamos, toma algo y saluda.'),
        h('button', { class: 'btn link', onclick: () => set({ editarPalabra: true }) }, 'Cambiar mi palabra'));
    }
    return h('div', { class: 'bloque' },
      h('h1', null, `Hola, ${primerNombre(a)}`),
      h('p', null, 'Para empezar: ¿qué palabra te viene a la mente cuando piensas en Sage?'),
      h('input', { class: 'campo', 'data-k': 'palabra', maxlength: MAX_PALABRA, placeholder: 'Una palabra', value: mia || '', oninput: borrador,
        onkeydown: (e) => { if (e.key === 'Enter') enviarPalabra(a); } }),
      h('button', { class: 'btn ancho', onclick: () => enviarPalabra(a) }, 'Enviar mi palabra'),
      err('palabra'));
  }
  function enviarPalabra(a) { hacer('palabra', 'guardarPalabra', { asistente: a.id, texto: valor('palabra') }, () => { ui.editarPalabra = false; limpiar('palabra'); }); }

  const espera = (titulo, texto) => h('div', { class: 'espera' },
    h('div', { class: 'dorso' }, h('img', { src: 'assets/sage-logo.svg', alt: '' })),
    h('h2', null, titulo), h('p', { class: 'sutil' }, texto));

  const comoEscanear = (que) => h('div', { class: 'escanear' },
    h('div', { class: 'icono', 'aria-hidden': 'true' }, h('span', { class: 'qr-i' }), h('span', { class: 'nfc-i' })),
    h('p', null, h('b', null, `Escanea ${que}. `), 'Abre la cámara del celular y apunta al QR, o acerca la parte de atrás del celular al círculo NFC de la carta.'));

  function sinEquipo(a) {
    return h('div', { class: 'bloque' },
      h('h1', null, 'Tu reto'),
      comoEscanear('la carta grande del reto que está en tu mesa'),
      h('p', { class: 'sutil' }, 'Así quedas en el mismo equipo de quienes comparten ese reto contigo.'),
      bloqueEscribir(a), err('hoja'));
  }

  function bloqueRespuesta(a) {
    const r = estado.respuestas[a.id];
    const actual = r && r.reto === a.equipo ? r : null;
    const elegida = ui.pasa ?? actual?.pasa;
    return h('div', { class: 'bloque' },
      h('h2', null, '¿Esto pasa en tu institución?'),
      h('div', { class: 'opciones', role: 'group', 'aria-label': '¿Esto pasa en tu institución?' },
        Object.entries(RESPUESTAS_RETO).map(([k, t]) => h('button', { 'aria-pressed': String(elegida === k), onclick: () => set({ pasa: k }) }, t))),
      h('label', { for: 'comentario', class: 'sutil' }, '¿Cómo lo viven ustedes? (opcional)'),
      h('textarea', { id: 'comentario', class: 'campo', 'data-k': 'comentario', maxlength: MAX_COMENTARIO, value: actual?.comentario ?? '', placeholder: 'En nuestra biblioteca…', oninput: borrador, style: { minHeight: '90px' } }),
      h('button', { class: 'btn ancho', disabled: !elegida, onclick: () => hacer('respuesta', 'responderReto', { asistente: a.id, pasa: elegida, comentario: valor('comentario') },
        () => { ui.pasa = undefined; limpiar('comentario'); ui.aviso.respuesta = 'Guardado. Ahora conversen: ¿por qué pasa? ¿qué han intentado?'; }) }, actual ? 'Actualizar mi respuesta' : 'Guardar mi respuesta'),
      err('respuesta'), ok('respuesta'));
  }

  function miembros(a) {
    const otros = estado.equipos[a.equipo].miembros.filter(m => m !== a.id).map(m => primerNombre(estado.asistentes[m]));
    return h('p', { class: 'miembros' }, otros.length ? `Equipo ${nombreEquipo(a.equipo)}: tú, ${otros.join(', ')}.` : `Equipo ${nombreEquipo(a.equipo)}: por ahora solo tú.`);
  }

  function pantallaRonda1(a) {
    if (!a.equipo) return sinEquipo(a);
    return h('div', { class: 'bloque', style: { gap: '24px' } },
      h('div', { class: 'bloque' }, vistaCarta(a.equipo, { tag: 'div' }), miembros(a)),
      bloqueRespuesta(a),
      bloqueEscribir(a, '¿No es tu mesa? Escanea o escribe otro reto'));
  }

  function tablero(a) {
    const mesa = estado.jugadas.filter(j => j.equipo === a.equipo);
    return h('div', { class: 'tablero' },
      h('div', { class: 'tab-cab' }, h('span', null, `Equipo ${nombreEquipo(a.equipo)}`), h('span', null, `${mesa.length} de ${MAX_CARTAS_EQUIPO} cartas`)),
      h('div', { class: 'nec' }, datosCarta(a.equipo).descripcion),
      mesa.length ? mesa.map(j => {
        const d = datosCarta(j.carta);
        return h('div', { class: 'jugada ' + d.tipo },
          h('span', { class: 'c' }, d.codigo),
          h('button', { class: 't', style: { textAlign: 'left', fontSize: '15px' }, onclick: () => set({ hoja: { codigo: j.carta } }) }, d.titulo, h('small', null, `${d.etiqueta}, la jugó ${primerNombre(estado.asistentes[j.asistente])}`)),
          h('button', { 'aria-label': j.clave ? 'Quitar como carta clave' : 'Marcar como carta clave', 'aria-pressed': String(j.clave), title: 'Carta clave',
            onclick: () => hacer('tablero', 'marcarClave', { jugada: j.id }) }, j.clave ? '★' : '☆'),
          h('button', { 'aria-label': `Retirar ${d.titulo}`, title: 'Retirar', onclick: () => hacer('tablero', 'retirarCarta', { jugada: j.id }) }, '↩'));
      }) : h('p', { style: { color: '#c9cfe6', fontSize: '15px' } }, 'Todavía no hay cartas sobre este reto.'),
      mesa.length ? h('p', { style: { color: '#c9cfe6', fontSize: '13px' } }, 'Toquen ☆ para elegir su carta clave (solo una).') : null,
      err('tablero'));
  }

  function bloqueMotivo(a) {
    const eq = estado.equipos[a.equipo];
    return h('div', { class: 'bloque' },
      h('h2', null, '¿Por qué esa es su carta clave?'),
      h('textarea', { class: 'campo', 'data-k': 'motivo', maxlength: MAX_MOTIVO, value: eq.motivo ?? '', placeholder: 'Porque…', oninput: borrador, style: { minHeight: '80px' } }),
      h('button', { class: 'btn ancho', onclick: () => hacer('motivo', 'guardarMotivo', { equipo: a.equipo, texto: valor('motivo') }, () => { limpiar('motivo'); ui.aviso.motivo = 'Guardado.'; }) }, 'Guardar'),
      err('motivo'), ok('motivo'));
  }

  function pantallaRonda2(a) {
    if (!a.equipo) return sinEquipo(a);
    return h('div', { class: 'bloque', style: { gap: '22px' } },
      h('h1', null, 'Cartas sobre la mesa'),
      comoEscanear('una carta de tu mano'),
      h('p', { class: 'sutil' }, `Pongan sobre su reto las cartas que mejor lo resuelven, hasta ${MAX_CARTAS_EQUIPO} por equipo, y elijan una carta clave.`),
      bloqueEscribir(a),
      tablero(a),
      estado.fase === 'cuentanos' ? bloqueMotivo(a) : null);
  }

  function pantallaCierre(a) {
    const guardada = estado.encuesta[a.id];
    if (!ui.encuesta) ui.encuesta = { ...(guardada || {}) };
    if (guardada && !ui.editandoEncuesta) {
      return h('div', { class: 'bloque' },
        h('h1', null, 'Gracias por tus respuestas'),
        h('p', null, 'Las leeremos con calma. Lo que nos dices hoy define lo que hacemos el próximo año.'),
        h('button', { class: 'btn link', onclick: () => set({ editandoEncuesta: true }) }, 'Cambiar mis respuestas'));
    }
    const r = ui.encuesta;
    return h('div', { class: 'bloque', style: { gap: '22px' } },
      h('h1', null, 'Antes de despedirnos'),
      h('p', { class: 'sutil' }, 'Cinco preguntas cortas. Todas son opcionales.'),
      PREGUNTAS.map(p => h('div', { class: 'bloque' },
        h('label', { for: 'q-' + p.id, style: { fontWeight: 700, fontSize: '17px', color: 'var(--navy)' } }, p.texto),
        p.tipo === 'escala'
          ? [h('div', { class: 'escala', role: 'group', 'aria-label': p.texto },
              [1, 2, 3, 4, 5].map(n => h('button', { 'aria-pressed': String(r[p.id] === n), onclick: () => { r[p.id] = r[p.id] === n ? undefined : n; render(); } }, n))),
             h('div', { class: 'escala-leyenda' }, h('span', null, 'Poco'), h('span', null, 'Mucho'))]
          : h(p.corta ? 'input' : 'textarea', { id: 'q-' + p.id, class: 'campo', 'data-k': 'q-' + p.id, value: r[p.id] ?? '', maxlength: p.corta ? 30 : 600,
              style: p.corta ? null : { minHeight: '90px' }, oninput: (e) => { r[p.id] = e.target.value; } }))),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!r.contacto, onchange: (e) => { r.contacto = e.target.checked; } }), CONTACTO_TEXTO),
      h('button', { class: 'btn ancho', onclick: () => hacer('encuesta', 'guardarEncuesta', { asistente: a.id, respuestas: { ...r } }, () => { ui.editandoEncuesta = false; }) }, 'Enviar respuestas'),
      err('encuesta'));
  }

  function pantallaGracias(a) {
    const mesa = a.equipo ? estado.jugadas.filter(j => j.equipo === a.equipo) : [];
    return h('div', { class: 'bloque' },
      h('h1', null, `Gracias, ${primerNombre(a)}`),
      h('p', null, 'Fue un gusto tenerte en la mesa. Estas son las cartas que jugó tu equipo, por si quieres volver a ellas:'),
      mesa.length ? mesa.map(j => { const d = datosCarta(j.carta);
        return h('a', { class: 'jugada ' + d.tipo, href: d.url, target: '_blank', rel: 'noopener', style: { textDecoration: 'none' } },
          h('span', { class: 'c' }, d.codigo), h('div', { class: 't' }, d.titulo, h('small', null, d.etiqueta))); })
        : h('p', { class: 'sutil' }, 'Esta vez no se jugaron cartas.'),
      h('p', { class: 'sutil' }, 'Puedes llevarte tus cartas: al escanearlas te llevan siempre a su recurso.'));
  }

  function vista() {
    const a = miPersona();
    if (!a) return h('div', { class: 'cel' }, encabezado(null), pantallaIngreso());
    if (!a.ingreso) store.dispatch('ingresar', { asistente: a.id }).catch(() => {});
    if (pendiente) { const p = pendiente; pendiente = null; queueMicrotask(() => procesar(a, p)); }
    const cuerpo = {
      llegada: () => bloquePalabra(a),
      apertura: () => espera('Ya casi empezamos', 'Mira la pantalla del frente.'),
      ronda1: () => pantallaRonda1(a),
      ronda2: () => pantallaRonda2(a),
      cuentanos: () => pantallaRonda2(a),
      cierre: () => pantallaCierre(a),
      gracias: () => pantallaGracias(a),
    }[estado.fase]();
    return h('div', { class: 'cel' }, encabezado(a), cuerpo, hoja(a));
  }

  const quitar = store.subscribe((e) => { estado = e; render(); });
  // Para la barra demo: simular que este celular escaneó un código.
  const escanear = (codigo) => { const a = miPersona(); if (a) procesar(a, { codigo: normalizarCodigo(codigo), bruto: codigo }); else { pendiente = { codigo: normalizarCodigo(codigo), bruto: codigo }; render(); } };
  globalThis.__labEscanear = escanear;
  return () => { quitar(); if (globalThis.__labEscanear === escanear) delete globalThis.__labEscanear; };
}
