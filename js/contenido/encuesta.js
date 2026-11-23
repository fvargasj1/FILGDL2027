// Encuesta de cierre. La palabra de llegada se vuelve a preguntar al salir para comparar antes y después.
// Los ids (p1...p6) van al Excel: no reutilizarlos para otra pregunta.

import { CATALOGO } from './experiencia.js';

// Recursos que la persona puede querer conocer mejor (pregunta p6, varias opciones).
// Es el mismo catálogo de "Tu experiencia con Sage", más el asistente, para comparar antes y después del juego.
export const RECURSOS = [
  { id: 'asistente', nombre: 'Asistente de investigación de Sage Research Methods' },
  ...CATALOGO.map(({ id, nombre }) => ({ id, nombre })),
];

export const PREGUNTAS = [
  { id: 'p1', tipo: 'texto', corta: true, texto: 'Después de hoy, ¿qué palabra elegirías para Sage?' },
  { id: 'p2', tipo: 'texto', texto: '¿Qué deberíamos mantener?' },
  { id: 'p3', tipo: 'texto', texto: '¿Qué deberíamos cambiar o mejorar?' },
  { id: 'p4', tipo: 'escala', texto: '¿Qué tan útil te parecería el asistente de investigación para tu comunidad?' },
  { id: 'p5', tipo: 'escala', texto: '¿Qué tan relevante sería la colección Liebert para tu institución?' },
  { id: 'p6', tipo: 'multiple', texto: '¿Qué recurso quieres conocer mejor?', ayuda: 'Elige todos los que quieras.', opciones: RECURSOS },
];
export const CONTACTO_TEXTO = 'Quiero que Sage me contacte para conocer más';
export const nombreRecurso = (id) => RECURSOS.find(r => r.id === id)?.nombre ?? id;

// Conteo de la pregunta p6: [{ id, nombre, n }] de más a menos elegido, solo los elegidos al menos una vez.
export function conteoRecursos(encuesta) {
  const n = {};
  for (const r of Object.values(encuesta ?? {})) for (const id of r.p6 ?? []) n[id] = (n[id] || 0) + 1;
  return RECURSOS.filter(r => n[r.id]).map(r => ({ ...r, n: n[r.id] })).sort((a, b) => b.n - a.n);
}
