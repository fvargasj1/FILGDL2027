import { RETOS, EQUIPOS, buscar } from './contenido/cartas.js';
import { PREGUNTAS } from './contenido/encuesta.js';
import { RESPUESTAS_RETO, equiposActivos } from './logica/estado.js';

const retoTexto = (c) => RETOS.find(r => r.codigo === c)?.texto ?? '';
const siNo = (v) => (v ? 'Sí' : 'No');
const tipo = { liebert: 'Revista Liebert', asistente: 'Asistente de investigación' };

export function filasExport(e) {
  const nombre = (id) => e.asistentes[id]?.nombre ?? id;
  const inst = (id) => e.asistentes[id]?.institucion ?? '';
  return {
    Asistentes: Object.values(e.asistentes).map(a => ({
      Nombre: a.nombre, 'Institución': a.institucion, Correo: a.correo, 'País': a.pais,
      'Ingresó': a.ingreso ? 'Sí' : 'No', Equipo: a.equipo ? EQUIPOS[a.equipo] : '',
    })),
    Palabras: Object.entries(e.palabras).map(([id, p]) => ({ Nombre: nombre(id), Palabra: p })),
    Equipos: equiposActivos(e).map(c => {
      const mesa = e.jugadas.filter(j => j.equipo === c);
      const clave = mesa.find(j => j.clave);
      return {
        Equipo: EQUIPOS[c], 'Código reto': c, Reto: retoTexto(c), Integrantes: e.equipos[c].miembros.map(nombre).join(', '),
        Cartas: mesa.map(j => `${j.carta} ${buscar(j.carta)?.titulo ?? ''}`).join('; '),
        'Carta clave': clave ? `${clave.carta} ${buscar(clave.carta)?.titulo ?? ''}` : '',
        'Por qué la carta clave': e.equipos[c].motivo ?? '',
      };
    }),
    'Retos por persona': Object.entries(e.respuestas).map(([id, r]) => ({
      Nombre: nombre(id), 'Institución': inst(id), Equipo: EQUIPOS[r.reto] ?? '', 'Código reto': r.reto, Reto: retoTexto(r.reto),
      '¿Pasa en su institución?': RESPUESTAS_RETO[r.pasa] ?? '', Comentario: r.comentario,
    })),
    'Cartas jugadas': e.jugadas.map(j => {
      const c = buscar(j.carta);
      return { Equipo: EQUIPOS[j.equipo] ?? '', 'Código reto': j.equipo, 'Código': j.carta, Carta: c?.titulo ?? j.carta,
        Tipo: tipo[c?.tipo] ?? '', 'Jugada por': nombre(j.asistente), Clave: siNo(j.clave) };
    }),
    Encuesta: Object.entries(e.encuesta).map(([id, r]) => {
      const fila = { Nombre: nombre(id), 'Institución': inst(id) };
      for (const p of PREGUNTAS) fila[p.texto] = r[p.id] ?? '';
      fila['Quiere contacto'] = siNo(r.contacto);
      return fila;
    }),
  };
}

// Navegador: requiere vendor/xlsx.full.min.js cargado (window.XLSX).
// Dentro de Claude usa la capacidad "downloads"; fuera, la descarga normal del navegador.
export async function descargarExcel(estado, XLSX = globalThis.XLSX) {
  const libro = XLSX.utils.book_new();
  for (const [hoja, filas] of Object.entries(filasExport(estado))) {
    const ws = filas.length ? XLSX.utils.json_to_sheet(filas) : XLSX.utils.aoa_to_sheet([['Sin datos']]);
    XLSX.utils.book_append_sheet(libro, ws, hoja);
  }
  const nombre = 'LAB_Sage_2026_resultados.xlsx';
  const descargas = globalThis.claude?.use ? await globalThis.claude.use('downloads') : null;
  if (descargas) {
    await descargas.save({ filename: nombre, data: XLSX.write(libro, { bookType: 'xlsx', type: 'array' }) });
    return;
  }
  XLSX.writeFile(libro, nombre);
}
