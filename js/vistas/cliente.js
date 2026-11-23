import { h, pintar, borrador, vistaCarta, datosCarta, logoSage, nombreEquipo, reloj } from './ui.js';
import { PREGUNTAS, CONTACTO_TEXTO } from '../contenido/encuesta.js';
import { MAX_PALABRA, MAX_COMENTARIO, MAX_MOTIVO, MAX_CARTAS_EQUIPO, RESPUESTAS_RETO, buscarPersonas, equiposActivos } from '../logica/estado.js';
import { normalizarCodigo, esReto, esCarta } from '../contenido/cartas.js';
import { config } from '../config.js';
import { CATALOGO, ESTADO_RECURSO, DIMENSIONES, NIVELES, CANALES, ESPERA, PARTICIPO, FORMATOS, PUBLICOS, MAX_DESEO, MAX_ABIERTA, TEXTOS, PANTALLAS } from '../contenido/experiencia.js';
import { faltanRecursos } from '../logica/experiencia.js';

const primerNombre = (a) => a?.nombre.split(' ')[0] ?? '';

// pendiente: código que llegó por QR o NFC antes de montar la vista ({ codigo, bruto } o null).
export function montarCliente(raiz, store, yo, pendiente = null) {
  const ui = { busqueda: '', registro: false, confirmar: null, error: {}, aviso: {}, encuesta: null, editarPalabra: false, hoja: null, escribir: false, pasa: undefined };
  let estado = store.getEstado();

  // Mientras alguien arrastra una barra no se repinta (perdería el arrastre); se repinta al soltar.
  let ocupado = false, repintar = false;
  const render = () => { if (ocupado) { repintar = true; return; } pintar(raiz, vista()); };
  const soltar = () => { if (!ocupado) return; ocupado = false; if (repintar) { repintar = false; render(); } };
  globalThis.addEventListener?.('pointerup', soltar);
  globalThis.addEventListener?.('pointercancel', soltar);
  globalThis.addEventListener?.('touchend', soltar);
  globalThis.addEventListener?.('change', soltar);
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
    return [h('header', null, logoSage(),
      h('div', { class: 'ev' }, config.nombreEvento, a ? h('small', null, a.equipo ? `${a.nombre}, equipo ${nombreEquipo(a.equipo)}` : a.nombre) : null)),
      a ? reloj(estado.temporizador, 'reloj-cel', 'Tiempo para esta parte') : null];
  }

  function pantallaIngreso() {
    if (ui.confirmar) {
      const a = estado.asistentes[ui.confirmar];
      return h('div', { class: 'bloque' },
        h('h1', null, '¿Eres tú?'),
        h('div', { class: 'persona', style: { cursor: 'default' } }, h('b', null, a.nombre), h('span', null, a.institucion)),
        a.ingreso ? h('p', { class: 'sutil' }, 'Esta persona ya ingresó en otro celular. Si eres tú, puedes continuar aquí.') : null,
        h('button', { class: 'btn ancho', onclick: () => { yo.set(a.id, a.reinicios); set({ confirmar: null }); hacer('ingreso', 'ingresar', { asistente: a.id }); } }, 'Sí, soy yo'),
        h('button', { class: 'btn sec ancho', onclick: () => set({ confirmar: null }) }, 'No, volver a buscar'));
    }
    if (ui.registro) return pantallaRegistro();
    const q = ui.busqueda.trim();
    const corto = q.replace(/\s/g, '').length < 3;
    const lista = corto ? [] : buscarPersonas(estado, q);
    return h('div', { class: 'bloque' },
      h('h1', null, 'Bienvenida, bienvenido'),
      pendiente ? h('p', { class: 'ok' }, 'Leímos tu carta. Primero dinos quién eres y enseguida la abrimos.') : null,
      h('label', { for: 'buscar', style: { fontSize: '17px' } }, 'Escribe tu nombre y elígelo para entrar.'),
      h('input', { id: 'buscar', class: 'campo', 'data-k': 'buscar', type: 'text', placeholder: 'Tu nombre', value: ui.busqueda,
        autocomplete: 'off', autocapitalize: 'words', spellcheck: 'false', 'aria-describedby': 'buscar-ayuda',
        oninput: (e) => { ui.busqueda = e.target.value; render(); } }),
      corto ? h('p', { id: 'buscar-ayuda', class: 'sutil' }, 'Escribe al menos tres letras.')
        : lista.length
          ? h('div', { id: 'buscar-ayuda', class: 'lista-personas', role: 'list' },
              lista.map(a => h('button', { class: 'persona', role: 'listitem', onclick: () => set({ confirmar: a.id }) }, h('b', null, a.nombre), h('span', null, a.institucion))))
          : h('p', { id: 'buscar-ayuda', class: 'sutil' }, 'No encontramos ese nombre en la lista.'),
      corto ? null : h('div', { class: 'registrate' },
        h('span', null, lista.length ? '¿No apareces?' : '¿Es tu primera vez en la lista?'),
        h('button', { class: lista.length ? 'btn link' : 'btn ancho', onclick: () => set({ registro: true, error: { ...ui.error, registro: null } }) }, 'Registrarme')),
      err('ingreso'));
  }

  function pantallaRegistro() {
    const campo = (k, etiqueta, attrs = {}) => h('div', { class: 'campo-reg' },
      h('label', { for: 'r-' + k }, etiqueta),
      h('input', { id: 'r-' + k, class: 'campo', 'data-k': 'r-' + k, oninput: borrador, ...attrs }));
    const enviar = () => {
      const id = 'n-' + (globalThis.crypto?.randomUUID?.().slice(0, 12) ?? Math.random().toString(36).slice(2, 12));
      const datos = { id, nombre: valor('r-nombre'), institucion: valor('r-institucion'), pais: valor('r-pais'), correo: valor('r-correo') };
      hacer('registro', 'registrar', datos, () => {
        yo.set(id, 0);
        ['nombre', 'institucion', 'pais', 'correo'].forEach(k => limpiar('r-' + k));
        ui.registro = false; ui.busqueda = '';
      });
    };
    return h('form', { class: 'bloque', novalidate: true, onsubmit: (e) => { e.preventDefault(); enviar(); } },
      h('h1', null, 'Regístrate'),
      h('p', { class: 'sutil' }, 'Te toma un minuto. Usaremos estos datos solo para el LAB y para escribirte si nos lo pides.'),
      campo('nombre', 'Nombre y apellido', { value: ui.busqueda.trim(), autocomplete: 'name', autocapitalize: 'words', required: true, maxlength: 80 }),
      campo('institucion', 'Institución', { autocomplete: 'organization', required: true, maxlength: 120 }),
      campo('pais', 'País', { autocomplete: 'country-name', required: true, maxlength: 60 }),
      campo('correo', 'Correo', { type: 'email', inputmode: 'email', autocomplete: 'email', autocapitalize: 'off', required: true, maxlength: 120 }),
      err('registro'),
      h('button', { class: 'btn ancho', type: 'submit' }, 'Registrarme y entrar'),
      h('button', { class: 'btn link', type: 'button', onclick: () => set({ registro: false }) }, 'Volver a buscar mi nombre'));
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

  function bloqueVoto(a) {
    if (estado.votacion === 'resultado') return h('div', { class: 'bloque voto' }, h('h2', null, 'La votación cerró'), h('p', null, 'Mira el resultado en la pantalla del frente.'));
    const mio = estado.votos?.[a.id];
    const otros = equiposActivos(estado).filter(c => c !== a.equipo);
    return h('div', { class: 'bloque voto' },
      h('h2', null, '¿Qué equipo defendió mejor su carta clave?'),
      h('p', { class: 'sutil' }, mio ? `Votaste por ${nombreEquipo(mio)}. Puedes cambiar tu voto mientras la votación siga abierta.` : 'Toca un equipo para votar. No puedes votar por el tuyo.'),
      h('div', { class: 'opciones-voto', role: 'group', 'aria-label': 'Equipos' }, otros.map(c => {
        const clave = estado.jugadas.find(j => j.equipo === c && j.clave);
        return h('button', { 'aria-pressed': String(mio === c), onclick: () => hacer('voto', 'votar', { asistente: a.id, equipo: c }) },
          h('b', null, nombreEquipo(c)), h('span', null, clave ? datosCarta(clave.carta).titulo : 'Sin carta clave'));
      })),
      err('voto'));
  }

  function pantallaRonda2(a) {
    if (!a.equipo) return estado.fase === 'cuentanos' && estado.votacion !== 'cerrada' ? bloqueVoto(a) : sinEquipo(a);
    return h('div', { class: 'bloque', style: { gap: '22px' } },
      h('h1', null, 'Cartas sobre la mesa'),
      estado.fase === 'cuentanos' && estado.votacion !== 'cerrada' ? bloqueVoto(a) : null,
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
      h('p', { class: 'sutil' }, 'Seis preguntas cortas. Todas son opcionales.'),
      PREGUNTAS.map(p => h('div', { class: 'bloque' },
        h('label', { for: 'q-' + p.id, style: { fontWeight: 700, fontSize: '17px', color: 'var(--navy)' } }, p.texto),
        p.id === 'p1' && estado.palabras[a.id] ? h('p', { class: 'antes' }, 'Al llegar elegiste ', h('b', null, estado.palabras[a.id]), '.') : null,
        p.ayuda ? h('p', { class: 'sutil' }, p.ayuda) : null,
        p.tipo === 'multiple'
          ? h('div', { class: 'chips', role: 'group', 'aria-label': p.texto }, p.opciones.map(o => {
              const sel = (r[p.id] ?? []).includes(o.id);
              return h('button', { 'aria-pressed': String(sel), onclick: () => { const v = new Set(r[p.id] ?? []); sel ? v.delete(o.id) : v.add(o.id); r[p.id] = [...v]; render(); } },
                h('span', { class: 'marca', 'aria-hidden': 'true' }, sel ? '✓' : '+'), o.nombre);
            }))
        : p.tipo === 'escala'
          ? [h('div', { class: 'escala', role: 'group', 'aria-label': p.texto },
              [1, 2, 3, 4, 5].map(n => h('button', { 'aria-pressed': String(r[p.id] === n), onclick: () => { r[p.id] = r[p.id] === n ? undefined : n; render(); } }, n))),
             h('div', { class: 'escala-leyenda' }, h('span', null, 'Poco'), h('span', null, 'Mucho'))]
          : h(p.corta ? 'input' : 'textarea', { id: 'q-' + p.id, class: 'campo', 'data-k': 'q-' + p.id, value: r[p.id] ?? '', maxlength: p.corta ? 30 : 600,
              style: p.corta ? null : { minHeight: '90px' }, oninput: (e) => { r[p.id] = e.target.value; } }))),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!r.contacto, onchange: (e) => { r.contacto = e.target.checked; } }), CONTACTO_TEXTO),
      h('button', { class: 'btn ancho', onclick: () => hacer('encuesta', 'guardarEncuesta', { asistente: a.id, respuestas: { ...r } }, () => { ui.editandoEncuesta = false; }) }, 'Enviar respuestas'),
      err('encuesta'));
  }

  // ---------- Tu experiencia con Sage (después de la apertura) ----------
  const logoRecurso = (r) => r.logo
    ? h('img', { class: 'logo-rec', src: `assets/recursos/${r.logo}.svg`, alt: r.nombre })
    : h('span', { class: 'logo-rec txt' }, r.nombre);

  // Barra deslizante. Sin respuesta se ve en gris; la primera vez que se toca queda respondida.
  // clave: para conservar el foco; poner(n): dónde se guarda el valor.
  function barra(k, valor, poner, min, max, { izq, der, palabra = (n) => String(n), grande = false, etiqueta }) {
    let sin = valor == null;
    const v = sin ? Math.round((min + max) / 2) : valor;
    const pct = (n) => `${((n - min) / (max - min)) * 100}%`;
    const salida = h('output', { class: 'valor' + (grande ? ' grande' : '') + (sin ? ' sin' : ''), 'aria-hidden': 'true' }, sin ? 'Sin responder' : palabra(v));
    const fijar = (el) => {
      const n = Number(el.value);
      poner(n); sin = false;
      el.classList.remove('sin-valor');
      el.style.setProperty('--p', pct(n));
      el.setAttribute('aria-valuetext', palabra(n));
      salida.textContent = palabra(n); salida.classList.remove('sin');
    };
    const input = h('input', { type: 'range', class: 'deslizar' + (sin ? ' sin-valor' : ''), 'data-k': 'b-' + k, min, max, step: 1, value: v,
      'aria-label': etiqueta, 'aria-valuetext': sin ? 'Sin responder' : palabra(v), style: { '--p': sin ? '0%' : pct(v) },
      onpointerdown: () => { ocupado = true; }, oninput: (e) => fijar(e.target), onclick: (e) => { if (sin) fijar(e.target); } });
    const marcas = h('div', { class: 'marcas', 'aria-hidden': 'true' }, Array.from({ length: max - min + 1 }, (_, i) => h('span', null, min + i)));
    return h('div', { class: 'resp-barra' }, grande ? salida : null, input, marcas,
      h('div', { class: 'escala-leyenda' }, h('span', null, izq), grande ? null : salida, h('span', null, der)));
  }

  function chips(campo, opciones, etiqueta) {
    const r = ui.exp.r;
    return h('div', { class: 'chips', role: 'group', 'aria-label': etiqueta }, Object.entries(opciones).map(([id, nombre]) => {
      const sel = (r[campo] ?? []).includes(id);
      return h('button', { 'aria-pressed': String(sel), onclick: () => { const v = new Set(r[campo] ?? []); sel ? v.delete(id) : v.add(id); r[campo] = [...v]; render(); } },
        h('span', { class: 'marca', 'aria-hidden': 'true' }, sel ? '✓' : '+'), nombre);
    }));
  }
  const abierta = (campo, etiqueta, { corta = false, placeholder = '' } = {}) => h('div', { class: 'bloque' },
    h('label', { for: 'x-' + campo, class: 'preg' }, etiqueta),
    h(corta ? 'input' : 'textarea', { id: 'x-' + campo, class: 'campo', 'data-k': 'x-' + campo, maxlength: MAX_ABIERTA, value: ui.exp.r[campo] ?? '', placeholder,
      style: corta ? null : { minHeight: '84px' }, oninput: (e) => { ui.exp.r[campo] = e.target.value; } }));
  const pregunta = (texto, ayuda, ...cuerpo) => h('div', { class: 'bloque preg-bloque' }, h('p', { class: 'preg' }, texto), ayuda ? h('p', { class: 'sutil' }, ayuda) : null, cuerpo);

  const pasos = [
    // 1. Tu biblioteca y Sage hoy
    () => {
      const r = ui.exp.r; r.recursos ??= {};
      const faltan = faltanRecursos(r);
      return [
        h('p', { class: 'sutil' }, 'Son cuatro pantallas cortas, unos cuatro minutos. En la pantalla del salón las respuestas se muestran sin nombre.'),
        pregunta(TEXTOS.recursos, null,
          h('dl', { class: 'leyenda-rec' },
            h('dt', null, 'Lo tenemos'), h('dd', null, 'tu institución ya lo tiene.'),
            h('dt', null, 'Lo conozco'), h('dd', null, 'lo conoces, pero no lo tienen.'),
            h('dt', null, 'Nuevo para mí'), h('dd', null, 'no lo conocías.')),
          h('div', { class: 'recursos-lista' }, CATALOGO.map(c => h('div', { class: 'rec' + (r.recursos[c.id] ? ' marcado' : '') },
            h('div', { class: 'rec-cab' }, logoRecurso(c)),
            h('p', { class: 'rec-desc' }, c.desc),
            h('div', { class: 'seg', role: 'group', 'aria-label': c.nombre }, Object.entries(ESTADO_RECURSO).map(([k, t]) =>
              h('button', { 'aria-pressed': String(r.recursos[c.id] === k), onclick: () => { r.recursos[c.id] = k; render(); } }, t)))))),
          h('p', { class: 'avance-rec' + (faltan ? '' : ' listo') }, faltan ? `Te ${faltan === 1 ? 'falta' : 'faltan'} ${faltan} de ${CATALOGO.length}.` : 'Listo, marcaste todos.')),
        pregunta(TEXTOS.nps, null, barra('nps', r.nps, (n) => { r.nps = n; }, 0, 10, { izq: 'Nada probable', der: 'Muy probable', grande: true, etiqueta: TEXTOS.nps })),
      ];
    },
    // 2. Qué funciona y qué no
    () => {
      const r = ui.exp.r; r.dims ??= {};
      return [
        pregunta(TEXTOS.dims, 'Desliza cada barra. Si no tienes cómo opinar sobre alguno, déjalo sin responder.',
          DIMENSIONES.map(d => h('div', { class: 'dim' },
            h('div', { class: 'dim-cab' }, h('b', null, d.nombre), h('span', null, d.ayuda)),
            barra('dim-' + d.id, r.dims[d.id], (n) => { r.dims[d.id] = n; }, 1, 5, { izq: '', der: '', palabra: (n) => NIVELES[n - 1], etiqueta: d.nombre })))),
        abierta('valora', TEXTOS.valora, { placeholder: 'Lo que no cambiarías…' }),
        abierta('mejora', TEXTOS.mejora, { placeholder: 'Si pudieras cambiar una sola cosa…' }),
      ];
    },
    // 3. Comunicación y formación
    () => {
      const r = ui.exp.r;
      const util = ['Nada útil', 'Poco útil', 'Algo útil', 'Útil', 'Muy útil'];
      return [
        h('h2', { class: 'sub-exp' }, 'Comunicación'),
        pregunta(TEXTOS.canales, 'Elige todos los que apliquen.', chips('canales', CANALES, TEXTOS.canales)),
        pregunta(TEXTOS.utilMkt, null, barra('utilMkt', r.utilMkt, (n) => { r.utilMkt = n; }, 1, 5, { izq: 'Nada útil', der: 'Muy útil', palabra: (n) => util[n - 1], etiqueta: TEXTOS.utilMkt })),
        pregunta(TEXTOS.espera, 'Elige todos los que quieras.', chips('espera', ESPERA, TEXTOS.espera)),
        abierta('esperaOtra', TEXTOS.esperaOtra, { corta: true, placeholder: 'Me gustaría recibir…' }),
        h('h2', { class: 'sub-exp' }, 'Formación y entrenamiento'),
        pregunta(TEXTOS.participo, null, h('div', { class: 'opciones', role: 'group', 'aria-label': TEXTOS.participo },
          Object.entries(PARTICIPO).map(([k, t]) => h('button', { 'aria-pressed': String(r.participo === k), onclick: () => { r.participo = r.participo === k ? undefined : k; if (r.participo === 'no') delete r.utilForm; render(); } }, t)))),
        r.participo && r.participo !== 'no'
          ? pregunta(TEXTOS.utilForm, null, barra('utilForm', r.utilForm, (n) => { r.utilForm = n; }, 1, 5, { izq: 'Nada útil', der: 'Muy útil', palabra: (n) => util[n - 1], etiqueta: TEXTOS.utilForm })) : null,
        pregunta(TEXTOS.formatos, 'Elige todos los que quieras.', chips('formatos', FORMATOS, TEXTOS.formatos)),
        pregunta(TEXTOS.publicos, 'Elige todos los que apliquen.', chips('publicos', PUBLICOS, TEXTOS.publicos)),
      ];
    },
    // 4. Sin límite de presupuesto
    () => {
      const r = ui.exp.r; r.deseo ??= [];
      const lleno = r.deseo.length >= MAX_DESEO;
      return [
        pregunta(TEXTOS.deseo, `Elige hasta ${MAX_DESEO}, en orden de prioridad. Toca de nuevo para quitar.`,
          h('div', { class: 'deseo' }, CATALOGO.map(c => {
            const pos = r.deseo.indexOf(c.id);
            const tiene = r.recursos?.[c.id] === 'tiene';
            return h('button', { class: 'deseo-item', 'aria-pressed': String(pos >= 0), disabled: pos < 0 && lleno,
              'aria-label': `${c.nombre}${pos >= 0 ? `, prioridad ${pos + 1}` : ''}${tiene ? ', ya lo tienen' : ''}`,
              onclick: () => { r.deseo = pos >= 0 ? r.deseo.filter(x => x !== c.id) : [...r.deseo, c.id]; render(); } },
              pos >= 0 ? h('span', { class: 'num', 'aria-hidden': 'true' }, pos + 1) : null,
              logoRecurso(c),
              tiene ? h('span', { class: 'ya' }, 'Ya lo tienen') : null);
          })),
          r.deseo.length
            ? h('ol', { class: 'orden-deseo' }, r.deseo.map(id => h('li', null, CATALOGO.find(c => c.id === id).nombre)))
            : h('p', { class: 'avance-rec' }, 'Todavía no eliges ninguno.')),
        abierta('frase', TEXTOS.frase, { placeholder: 'Completa la frase…' }),
      ];
    },
  ];
  function pantallaExperiencia(a) {
    const guardada = estado.experiencia?.[a.id];
    if (!ui.exp) ui.exp = { paso: 0, r: structuredClone(guardada ?? {}), revisar: false };
    if (guardada?.terminado && !ui.exp.revisar) {
      return h('div', { class: 'bloque' },
        h('h1', null, `Gracias, ${primerNombre(a)}`),
        h('p', null, 'Tus respuestas ya están guardadas. En un momento seguimos con el juego; mientras tanto, mira la pantalla del frente.'),
        h('button', { class: 'btn link', onclick: () => set({ exp: { paso: 0, r: structuredClone(guardada), revisar: true } }) }, 'Revisar mis respuestas'));
    }
    const { paso, r } = ui.exp;
    const ultimo = paso === pasos.length - 1;
    const ir = (n) => { ui.exp.paso = n; render(); globalThis.scrollTo?.(0, 0); };
    const respuestas = () => { const x = structuredClone(r); delete x.terminado; return x; };
    const siguiente = () => hacer('exp', 'guardarExperiencia', { asistente: a.id, respuestas: respuestas(), terminar: ultimo },
      () => { if (ultimo) { ui.exp.revisar = false; globalThis.scrollTo?.(0, 0); } else ir(paso + 1); });
    const bloqueado = paso === 0 && faltanRecursos(r) > 0;
    return h('div', { class: 'bloque exp', style: { gap: '22px' } },
      h('div', { class: 'exp-cab' },
        h('span', { class: 'paso' }, `Paso ${paso + 1} de ${pasos.length}`),
        h('div', { class: 'progreso', 'aria-hidden': 'true' }, pasos.map((_, i) => h('i', { class: i <= paso ? 'hecho' : null }))),
        h('h1', null, PANTALLAS[paso])),
      pasos[paso](),
      err('exp'),
      h('div', { class: 'exp-pie' },
        paso > 0 ? h('button', { class: 'btn sec', onclick: () => ir(paso - 1) }, 'Atrás') : h('span'),
        h('button', { class: 'btn', disabled: bloqueado, onclick: siguiente }, ultimo ? 'Enviar mis respuestas' : 'Siguiente')),
      bloqueado ? h('p', { class: 'sutil', style: { textAlign: 'right' } }, 'Marca todos los recursos para seguir.') : null);
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
      experiencia: () => pantallaExperiencia(a),
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
  return () => { quitar(); globalThis.removeEventListener?.('pointerup', soltar); globalThis.removeEventListener?.('pointercancel', soltar); globalThis.removeEventListener?.('touchend', soltar); globalThis.removeEventListener?.('change', soltar); if (globalThis.__labEscanear === escanear) delete globalThis.__labEscanear; };
}
