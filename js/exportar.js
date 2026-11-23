import { RETOS, EQUIPOS, buscar } from './contenido/cartas.js';
import { PREGUNTAS, nombreRecurso, conteoRecursos } from './contenido/encuesta.js';
import { RESPUESTAS_RETO, equiposActivos, resumenVoto } from './logica/estado.js';
import { CATALOGO, ESTADO_RECURSO, DIMENSIONES, CANALES, ESPERA, PARTICIPO, FORMATOS, PUBLICOS, TEXTOS, nombreCatalogo } from './contenido/experiencia.js';
import { resumenRecursos, resumenNps, promediosDims, conteoOpciones, frasesAbiertas, avanceExperiencia } from './logica/experiencia.js';

const retoTexto = (c) => RETOS.find(r => r.codigo === c)?.texto ?? '';
const siNo = (v) => (v ? 'Sí' : 'No');
const TIPO = { liebert: 'Revista Liebert', asistente: 'Asistente de investigación' };
const carta = (cod) => `${cod} ${buscar(cod)?.titulo ?? ''}`.trim();
const etiquetas = (ids, opciones) => (ids ?? []).map(id => opciones[id] ?? id).join(', ');
export const signoNps = (n) => (n == null ? '-' : n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');

// Una fila por persona que respondió "Tu experiencia con Sage".
function filasExperiencia(e) {
  return Object.entries(e.experiencia ?? {}).map(([id, r]) => {
    const a = e.asistentes[id] ?? {};
    const f = { Nombre: a.nombre ?? id, 'Institución': a.institucion ?? '', 'País': a.pais ?? '', 'Terminó': siNo(r.terminado) };
    for (const c of CATALOGO) f[c.nombre] = ESTADO_RECURSO[r.recursos?.[c.id]] ?? '';
    f['Recomendaría Sage (0 a 10)'] = r.nps ?? '';
    for (const d of DIMENSIONES) f[`${d.nombre} (1 a 5)`] = r.dims?.[d.id] ?? '';
    Object.assign(f, {
      'Lo que más valora': r.valora ?? '', 'Lo primero que mejoraría': r.mejora ?? '',
      'Por dónde se entera': etiquetas(r.canales, CANALES), 'Utilidad de la comunicación (1 a 5)': r.utilMkt ?? '',
      'Qué le gustaría recibir': etiquetas(r.espera, ESPERA), 'Otra idea sobre comunicación': r.esperaOtra ?? '',
      'Capacitaciones de Sage': PARTICIPO[r.participo] ?? '', 'Utilidad de la capacitación (1 a 5)': r.utilForm ?? '',
      'Formato preferido': etiquetas(r.formatos, FORMATOS), 'A quién capacitar': etiquetas(r.publicos, PUBLICOS),
      'Sin presupuesto: 1º': nombreCatalogo(r.deseo?.[0] ?? ''), 'Sin presupuesto: 2º': nombreCatalogo(r.deseo?.[1] ?? ''), 'Sin presupuesto: 3º': nombreCatalogo(r.deseo?.[2] ?? ''),
      'Sage sería indispensable si…': r.frase ?? '',
    });
    return f;
  }).sort((x, y) => x.Nombre.localeCompare(y.Nombre, 'es'));
}

// ---------- datos ----------

// Hojas de detalle: una fila por registro, encabezados en español.
export function filasExport(e) {
  const nombre = (id) => e.asistentes[id]?.nombre ?? id;
  const inst = (id) => e.asistentes[id]?.institucion ?? '';
  const votos = Object.fromEntries(resumenVoto(e).map(v => [v.equipo, v.votos]));
  return {
    Asistentes: Object.values(e.asistentes).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map(a => ({
      Nombre: a.nombre, 'Institución': a.institucion, 'País': a.pais, Correo: a.correo,
      Registro: a.registro === 'evento' ? 'En el evento' : 'Lista previa',
      'Ingresó': siNo(a.ingreso), Equipo: a.equipo ? EQUIPOS[a.equipo] : '',
    })),
    Palabras: Object.values(e.asistentes).filter(a => e.palabras[a.id] || e.encuesta[a.id]?.p1).map(a => ({
      Nombre: a.nombre, 'Institución': a.institucion, 'Al llegar': e.palabras[a.id] ?? '', 'Al salir': e.encuesta[a.id]?.p1 ?? '',
    })),
    'Experiencia Sage': filasExperiencia(e),
    Equipos: equiposActivos(e).map(c => {
      const mesa = e.jugadas.filter(j => j.equipo === c);
      const clave = mesa.find(j => j.clave);
      return {
        Equipo: EQUIPOS[c], 'Código reto': c, Reto: retoTexto(c), Integrantes: e.equipos[c].miembros.map(nombre).join(', '),
        Cartas: mesa.map(j => carta(j.carta)).join('; '), 'Carta clave': clave ? carta(clave.carta) : '',
        'Por qué la carta clave': e.equipos[c].motivo ?? '', 'Votos recibidos': votos[c] ?? 0,
      };
    }),
    'Retos por persona': Object.entries(e.respuestas).map(([id, r]) => ({
      Nombre: nombre(id), 'Institución': inst(id), Equipo: EQUIPOS[r.reto] ?? '', 'Código reto': r.reto, Reto: retoTexto(r.reto),
      '¿Pasa en su institución?': RESPUESTAS_RETO[r.pasa] ?? '', Comentario: r.comentario,
    })),
    'Cartas jugadas': e.jugadas.map(j => {
      const c = buscar(j.carta);
      return { Equipo: EQUIPOS[j.equipo] ?? '', 'Código reto': j.equipo, 'Código': j.carta, Carta: c?.titulo ?? j.carta,
        Tipo: TIPO[c?.tipo] ?? '', 'Jugada por': nombre(j.asistente), Clave: siNo(j.clave) };
    }),
    'Voto del salón': Object.entries(e.votos ?? {}).map(([id, eq]) => ({
      Nombre: nombre(id), 'Institución': inst(id), 'Su equipo': EQUIPOS[e.asistentes[id]?.equipo] ?? '', 'Votó por': EQUIPOS[eq] ?? eq,
    })),
    Encuesta: Object.entries(e.encuesta).map(([id, r]) => {
      const fila = { Nombre: nombre(id), 'Institución': inst(id), 'Palabra al llegar': e.palabras[id] ?? '' };
      for (const p of PREGUNTAS) fila[p.texto] = p.tipo === 'multiple' ? (r[p.id] ?? []).map(nombreRecurso).join(', ') : (r[p.id] ?? '');
      fila['Quiere contacto'] = siNo(r.contacto);
      return fila;
    }),
  };
}

const contar = (xs) => {
  const m = new Map();
  for (const x of xs) { const t = String(x ?? '').trim(); if (!t) continue; const k = t.toLowerCase(); const v = m.get(k) || { texto: t, n: 0 }; v.n++; m.set(k, v); }
  return [...m.values()].sort((a, b) => b.n - a.n || a.texto.localeCompare(b.texto, 'es'));
};
const promedio = (xs) => { const v = xs.filter(n => typeof n === 'number'); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };

// Lo que va en la hoja Resumen, ya calculado.
export function datosResumen(e) {
  const personas = Object.values(e.asistentes);
  const enc = Object.values(e.encuesta);
  const activos = equiposActivos(e);
  const voto = resumenVoto(e);
  const votosDe = Object.fromEntries(voto.map(v => [v.equipo, v.votos]));
  const avance = avanceExperiencia(e);
  const nps = resumenNps(e);
  const exp = Object.values(e.experiencia ?? {});
  const cartas = new Map();
  for (const j of e.jugadas) {
    const c = cartas.get(j.carta) || { codigo: j.carta, titulo: buscar(j.carta)?.titulo ?? j.carta, tipo: TIPO[buscar(j.carta)?.tipo] ?? '', veces: 0, equipos: [], clave: 0 };
    c.veces++; c.equipos.push(EQUIPOS[j.equipo]); if (j.clave) c.clave++;
    cartas.set(j.carta, c);
  }
  return {
    kpis: [
      { valor: personas.filter(a => a.ingreso).length, etiqueta: 'personas participaron' },
      { valor: avance.terminaron, etiqueta: 'completaron Tu experiencia con Sage' },
      { valor: signoNps(nps.nps), etiqueta: 'NPS de la sala (de −100 a +100)' },
      { valor: activos.length, etiqueta: 'equipos formados' },
      { valor: e.jugadas.length, etiqueta: 'cartas sobre la mesa' },
      { valor: Object.keys(e.votos ?? {}).length, etiqueta: 'votos del salón' },
      { valor: enc.length, etiqueta: 'encuestas de cierre respondidas' },
      { valor: enc.filter(r => r.contacto).length, etiqueta: 'piden contacto de Sage' },
      { valor: promedio(enc.map(r => r.p4)), etiqueta: 'utilidad del asistente (1 a 5)', decimal: true },
      { valor: promedio(enc.map(r => r.p5)), etiqueta: 'relevancia de Liebert (1 a 5)', decimal: true },
    ],
    retos: activos.map(c => {
      const n = { si: 0, aveces: 0, no: 0 };
      for (const r of Object.values(e.respuestas)) if (r.reto === c) n[r.pasa]++;
      const clave = e.jugadas.find(j => j.equipo === c && j.clave);
      return { equipo: EQUIPOS[c], reto: retoTexto(c), ...n, clave: clave ? carta(clave.carta) : '', motivo: e.equipos[c].motivo ?? '', votos: votosDe[c] ?? 0 };
    }),
    voto: voto.map(v => ({ equipo: EQUIPOS[v.equipo], votos: v.votos })),
    cartas: [...cartas.values()].sort((a, b) => b.veces - a.veces || b.clave - a.clave || a.codigo.localeCompare(b.codigo)).slice(0, 12),
    recursos: conteoRecursos(e.encuesta),
    respondieronRecursos: enc.filter(r => (r.p6 ?? []).length).length,
    llegar: contar(Object.values(e.palabras)).slice(0, 10),
    salir: contar(enc.map(r => r.p1)).slice(0, 10),
    catalogo: resumenRecursos(e).sort((a, b) => b.puntos - a.puntos || b.brecha - a.brecha || b.tiene - a.tiene),
    respondieronExp: exp.length,
    nps, dims: promediosDims(e),
    utilMkt: promedio(exp.map(r => r.utilMkt)), utilForm: promedio(exp.map(r => r.utilForm)),
    canales: conteoOpciones(e, 'canales', CANALES), espera: conteoOpciones(e, 'espera', ESPERA),
    participo: conteoOpciones(e, 'participo', PARTICIPO), formatos: conteoOpciones(e, 'formatos', FORMATOS), publicos: conteoOpciones(e, 'publicos', PUBLICOS),
    frases: frasesAbiertas(e),
    contactos: Object.entries(e.encuesta).filter(([, r]) => r.contacto).map(([id]) => e.asistentes[id]).filter(Boolean)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
  };
}

// ---------- libro con estilos (ExcelJS) ----------

const NAVY = 'FF001A69', GRANATE = 'FF892034', TINTA = 'FF1F2024', GRIS = 'FF5B5D55', LINEA = 'FFD5D8E3', FONDO = 'FFF3F4F8', BLANCO = 'FFFFFFFF', CLARO = 'FFC9CFE6';
const FUENTE = 'Arial';
const relleno = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const borde = (argb = LINEA) => ({ style: 'thin', color: { argb } });
const fecha = (d = new Date()) => d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

// Alto de fila aproximado para texto envuelto (ExcelJS no lo calcula).
function altoFila(valores, anchos, base = 15) {
  let lineas = 1;
  valores.forEach((v, i) => { const t = String(v ?? ''); const w = anchos[i] || 10; lineas = Math.max(lineas, t.split('\n').reduce((s, l) => s + Math.max(1, Math.ceil(l.length / (w * 1.05))), 0)); });
  return lineas * base + 6;
}

function hojaResumen(libro, e) {
  const d = datosResumen(e);
  const ws = libro.addWorksheet('Resumen', { views: [{ showGridLines: false }], properties: { tabColor: { argb: NAVY } },
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9, margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } } });
  const anchos = [3, 16, 44, 11, 11, 11, 30, 38, 10, 3];
  ws.columns = anchos.map(width => ({ width }));
  const C = 'B', Z = 'I'; // columnas útiles B..I
  let f = 1;
  const fila = (alto) => { const r = ws.getRow(f); if (alto) r.height = alto; return r; };
  const unir = (a, b) => ws.mergeCells(`${a}${f}:${b}${f}`);
  const texto = (celda, v, font = {}, extra = {}) => { const c = ws.getCell(`${celda}${f}`); c.value = v; c.font = { name: FUENTE, size: 10, color: { argb: TINTA }, ...font }; c.alignment = { vertical: 'middle', wrapText: true, ...extra }; return c; };
  const banda = (argb, desde = 'A', hasta = 'J') => { for (let k = desde.charCodeAt(0); k <= hasta.charCodeAt(0); k++) ws.getCell(`${String.fromCharCode(k)}${f}`).fill = relleno(argb); };

  // Encabezado institucional
  fila(12); banda(NAVY); f++;
  fila(34); banda(NAVY); unir(C, Z); texto(C, 'Sage LAB 2026 - Cartas sobre la mesa', { size: 20, bold: true, color: { argb: BLANCO } }); f++;
  fila(20); banda(NAVY); unir(C, Z); texto(C, 'Resumen de resultados - Library Advisory Board, FIL Guadalajara, 1 de diciembre de 2026', { size: 11, color: { argb: CLARO } }); f++;
  fila(12); banda(NAVY); f++;
  fila(5); banda(GRANATE); f++;
  fila(14); f++;

  // Cifras: dos filas de cuatro tarjetas
  const tarjetas = [['B', 'C'], ['D', 'F'], ['G', 'G'], ['H', 'I']];
  for (let desde = 0; desde < d.kpis.length; desde += 4) {
    const grupo = d.kpis.slice(desde, desde + 4);
    fila(36);
    grupo.forEach((k, i) => { const [a, b] = tarjetas[i]; if (a !== b) unir(a, b);
      const v = k.valor == null ? '-' : k.decimal ? k.valor.toFixed(1).replace('.', ',') : k.valor;
      const c = texto(a, v, { size: 24, bold: true, color: { argb: NAVY } }, { horizontal: 'left', indent: 1 }); c.fill = relleno(FONDO);
      c.border = { left: { style: 'thick', color: { argb: i % 2 ? GRANATE : NAVY } } }; });
    f++;
    fila(18);
    grupo.forEach((k, i) => { const [a, b] = tarjetas[i]; if (a !== b) unir(a, b);
      const c = texto(a, k.etiqueta, { size: 9, color: { argb: GRIS } }, { horizontal: 'left', vertical: 'top', indent: 1 }); c.fill = relleno(FONDO);
      c.border = { left: { style: 'thick', color: { argb: i % 2 ? GRANATE : NAVY } } }; });
    f++;
    fila(10); f++;
  }

  const seccion = (titulo, nota) => {
    fila(10); f++;
    fila(24); unir(C, Z); const c = texto(C, titulo, { size: 13, bold: true, color: { argb: NAVY } });
    for (let k = 66; k <= 73; k++) ws.getCell(`${String.fromCharCode(k)}${f}`).border = { bottom: { style: 'medium', color: { argb: GRANATE } } };
    f++;
    if (nota) { fila(18); unir(C, Z); texto(C, nota, { size: 9, italic: true, color: { argb: GRIS } }); f++; }
    return c;
  };
  // Tabla: columnas = [[letraDesde, letraHasta, encabezado, alineación]]
  const anchoDe = ([a, b]) => { let w = 0; for (let k = a.charCodeAt(0); k <= b.charCodeAt(0); k++) w += anchos[k - 65]; return w; };
  const tabla = (cols, filas, vacio = 'Sin datos todavía.') => {
    fila(Math.max(22, altoFila(cols.map(c => c[2]), cols.map(anchoDe), 12)));
    for (const [a, b, t, al] of cols) { if (a !== b) unir(a, b); const c = texto(a, t, { size: 9, bold: true, color: { argb: BLANCO } }, { horizontal: al || 'left', indent: al ? 0 : 1 }); c.fill = relleno(NAVY); }
    f++;
    if (!filas.length) { fila(20); unir(C, Z); texto(C, vacio, { size: 9, italic: true, color: { argb: GRIS } }, { indent: 1 }); f++; return; }
    filas.forEach((vals, n) => {
      const ws_ = cols.map(([a, b]) => { let w = 0; for (let k = a.charCodeAt(0); k <= b.charCodeAt(0); k++) w += anchos[k - 65]; return w; });
      fila(altoFila(vals.map(v => (v && typeof v === 'object' && v.texto !== undefined ? v.texto : v)), ws_));
      cols.forEach(([a, b, , al], i) => {
        if (a !== b) unir(a, b);
        const v = vals[i];
        const c = texto(a, v && typeof v === 'object' && v.texto !== undefined ? v.texto : v, v?.font ?? {}, { horizontal: al || 'left', vertical: 'top', indent: al ? 0 : 1 });
        if (n % 2) c.fill = relleno(FONDO);
        c.border = { bottom: borde() };
      });
      f++;
    });
  };
  const barra = (n, max, ancho = 24) => ({ texto: max && n > 0 ? '█'.repeat(Math.max(1, Math.round((n / max) * ancho))) : '', font: { color: { argb: GRANATE }, size: 9 } });

  seccion('Retos y cartas clave', 'Cuántas personas dijeron que el reto pasa en su institución, la carta que cada equipo eligió como clave y por qué.');
  tabla([['B', 'B', 'Equipo'], ['C', 'C', 'Reto'], ['D', 'D', 'Nos pasa', 'center'], ['E', 'E', 'A veces', 'center'], ['F', 'F', 'No', 'center'], ['G', 'G', 'Carta clave'], ['H', 'H', 'Por qué'], ['I', 'I', 'Votos', 'center']],
    d.retos.map(r => [{ texto: r.equipo, font: { bold: true, color: { argb: NAVY } } }, r.reto, r.si, r.aveces, r.no, r.clave, r.motivo, r.votos]));

  const maxV = Math.max(0, ...d.voto.map(v => v.votos));
  seccion('Voto del salón', '¿Qué equipo defendió mejor su carta clave? Nadie podía votar por su propio equipo.');
  // Empates comparten puesto (1, 1, 3...).
  const puesto = (i) => d.voto.findIndex(x => x.votos === d.voto[i].votos) + 1;
  tabla([['B', 'B', 'Puesto', 'center'], ['C', 'C', 'Equipo'], ['D', 'D', 'Votos', 'center'], ['E', 'I', '']],
    d.voto.map((v, i) => [puesto(i), { texto: v.equipo, font: { bold: v.votos > 0 && v.votos === maxV, color: { argb: NAVY } } }, v.votos, barra(v.votos, maxV, 40)]));

  seccion('Cartas más jugadas', 'Las revistas y movimientos del asistente que más equipos pusieron sobre su reto.');
  tabla([['B', 'B', 'Código'], ['C', 'C', 'Carta'], ['D', 'D', 'Veces', 'center'], ['E', 'E', 'Clave', 'center'], ['F', 'G', 'Tipo'], ['H', 'I', 'Equipos']],
    d.cartas.map(c => [c.codigo, { texto: c.titulo, font: { bold: true, color: { argb: c.tipo.startsWith('Revista') ? GRANATE : NAVY } } }, c.veces, c.clave || '', c.tipo, c.equipos.join(', ')]));

  seccion('Recursos: lo que tienen, conocen y desean', `${d.respondieronExp} ${d.respondieronExp === 1 ? 'persona respondió' : 'personas respondieron'} Tu experiencia con Sage. Puntos de deseo: el 1º de cada persona suma 3, el 2º 2 y el 3º 1. "Lo desean sin tenerlo" es la brecha: lo eligieron y su institución no lo tiene. La última columna es "¿Qué recurso quieres conocer mejor?" del cierre.`);
  tabla([['B', 'C', 'Recurso'], ['D', 'D', 'Lo tienen', 'center'], ['E', 'E', 'Lo conocen', 'center'], ['F', 'F', 'Nuevo para ellos', 'center'], ['G', 'G', 'Puntos de deseo', 'center'], ['H', 'H', 'Lo desean sin tenerlo', 'center'], ['I', 'I', 'Quieren conocerlo (cierre)', 'center']],
    d.catalogo.map(r => [{ texto: r.nombre, font: { bold: true, color: { argb: NAVY } } }, r.tiene, r.conoce, r.nuevo,
      { texto: r.puntos, font: { bold: r.puntos > 0, color: { argb: r.puntos > 0 ? GRANATE : GRIS } } }, r.brecha, r.cierre]));

  seccion('Satisfacción con Sage', d.nps.n
    ? `NPS de la sala: ${signoNps(d.nps.nps)} (${d.nps.promotores} promotores de 9 a 10, ${d.nps.pasivos} pasivos de 7 a 8, ${d.nps.detractores} detractores de 0 a 6; ${d.nps.n} respuestas). Promedio de recomendación: ${d.nps.promedio.toFixed(1).replace('.', ',')} de 10.`
    : 'Todavía nadie respondió si recomendaría Sage.');
  tabla([['B', 'C', 'Aspecto'], ['D', 'D', 'Promedio (1 a 5)', 'center'], ['E', 'E', 'Respuestas', 'center'], ['F', 'I', '']],
    d.dims.map(x => [{ texto: x.nombre, font: { bold: true, color: { argb: NAVY } } }, x.prom == null ? '-' : x.prom.toFixed(1).replace('.', ','), x.n, barra(x.prom ?? 0, 5, 40)]));

  const decimal = (n) => (n == null ? '-' : n.toFixed(1).replace('.', ','));
  seccion('Comunicación y formación', `Utilidad de lo que comunica Sage: ${decimal(d.utilMkt)} de 5. Utilidad de la capacitación, entre quienes participaron: ${decimal(d.utilForm)} de 5.`);
  const conteo = (titulo, xs) => {
    const max = Math.max(0, ...xs.map(x => x.n));
    tabla([['B', 'C', titulo], ['D', 'D', 'Personas', 'center'], ['E', 'I', '']], xs.map(x => [x.nombre, x.n, barra(x.n, max, 40)]));
    fila(8); f++;
  };
  conteo(TEXTOS.canales, d.canales);
  conteo(TEXTOS.espera, d.espera);
  conteo(TEXTOS.participo, d.participo);
  conteo(TEXTOS.formatos, d.formatos);
  conteo(TEXTOS.publicos, d.publicos);

  seccion('Voces de la sala', 'Respuestas abiertas agrupadas por tema con palabras clave (agrupación aproximada). Con nombre en la hoja Experiencia Sage.');
  tabla([['B', 'B', 'Tema'], ['C', 'G', 'Respuesta'], ['H', 'I', 'Pregunta']],
    d.frases.map(x => [{ texto: x.nombreTema, font: { bold: true, color: { argb: NAVY } } }, x.texto, x.etiqueta]), 'Todavía no hay respuestas abiertas.');

  seccion('Palabras para Sage', 'La palabra que eligieron al llegar y la que eligieron al salir, de más a menos repetida.');
  const n = Math.max(d.llegar.length, d.salir.length);
  tabla([['B', 'C', 'Al llegar'], ['D', 'D', 'Veces', 'center'], ['E', 'E', ''], ['F', 'G', 'Al salir'], ['H', 'H', 'Veces', 'center']],
    Array.from({ length: n }, (_, i) => [d.llegar[i]?.texto ?? '', d.llegar[i]?.n ?? '', '', d.salir[i]?.texto ?? '', d.salir[i]?.n ?? '']));

  seccion('Piden que Sage los contacte');
  tabla([['B', 'C', 'Nombre'], ['D', 'F', 'Institución'], ['G', 'G', 'País'], ['H', 'I', 'Correo']],
    d.contactos.map(a => [{ texto: a.nombre, font: { bold: true } }, a.institucion, a.pais ?? '', a.correo ?? '']), 'Nadie lo pidió todavía.');

  fila(16); f++;
  fila(18); unir(C, Z); texto(C, `Generado el ${fecha()} desde la plataforma del LAB. El detalle está en las demás hojas.`, { size: 8, italic: true, color: { argb: GRIS } });
  ws.headerFooter.oddFooter = '&L&8Sage LAB 2026 - Cartas sobre la mesa&R&8Página &P de &N';
}

function hojaDetalle(libro, nombre, filas) {
  const ws = libro.addWorksheet(nombre, { views: [{ state: 'frozen', ySplit: 1 }], properties: { tabColor: { argb: GRANATE } },
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
  if (!filas.length) { ws.getCell('A1').value = 'Sin datos todavía.'; ws.getCell('A1').font = { name: FUENTE, italic: true, color: { argb: GRIS } }; ws.getColumn(1).width = 30; return; }
  const cab = Object.keys(filas[0]);
  const anchos = cab.map(k => Math.min(60, Math.max(10, k.length + 2, ...filas.map(r => String(r[k] ?? '').length + 2))));
  ws.columns = cab.map((k, i) => ({ header: k, key: k, width: anchos[i] }));
  const h = ws.getRow(1); h.height = 30;
  h.eachCell(c => { c.font = { name: FUENTE, size: 10, bold: true, color: { argb: BLANCO } }; c.fill = relleno(NAVY); c.alignment = { vertical: 'middle', wrapText: true, indent: 1 }; });
  filas.forEach((r, n) => {
    const row = ws.addRow(r);
    row.height = altoFila(cab.map(k => r[k]), anchos);
    row.eachCell({ includeEmpty: true }, c => {
      c.font = { name: FUENTE, size: 10, color: { argb: TINTA } };
      c.alignment = { vertical: 'top', wrapText: true, indent: 1 };
      c.border = { bottom: borde() };
      if (n % 2) c.fill = relleno(FONDO);
    });
  });
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cab.length } };
}

export function construirLibro(estado, ExcelJS) {
  const libro = new ExcelJS.Workbook();
  libro.creator = 'Sage LAB 2026';
  libro.created = new Date();
  hojaResumen(libro, estado);
  for (const [hoja, filas] of Object.entries(filasExport(estado))) hojaDetalle(libro, hoja, filas);
  return libro;
}

// Navegador: requiere vendor/exceljs.min.js cargado (window.ExcelJS).
// Dentro de Claude usa la capacidad "downloads"; fuera, la descarga normal del navegador.
export async function descargarExcel(estado, ExcelJS = globalThis.ExcelJS) {
  const datos = await construirLibro(estado, ExcelJS).xlsx.writeBuffer();
  const nombre = 'LAB_Sage_2026_resultados.xlsx';
  const descargas = globalThis.claude?.use ? await globalThis.claude.use('downloads') : null;
  if (descargas) { await descargas.save({ filename: nombre, data: new Uint8Array(datos) }); return; }
  const url = URL.createObjectURL(new Blob([datos], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: nombre });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
