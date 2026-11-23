// Datos de ejemplo. Reemplazar por la lista real de asistentes antes del evento.
const base = [
  ['Ana María Restrepo', 'Universidad del Valle Norte', 'Colombia'],
  ['Carlos Mendoza', 'Instituto Tecnológico de Occidente', 'México'],
  ['Lucía Fernández', 'Universidad Central del Pacífico', 'México'],
  ['Jorge Salazar', 'Universidad Autónoma del Sur', 'México'],
  ['Patricia Gómez', 'Fundación Universitaria Andina', 'Colombia'],
  ['Ricardo Torres', 'Universidad de la Costa Austral', 'Chile'],
  ['Mariana López', 'Universidad Metropolitana del Centro', 'México'],
  ['Fernando Castillo', 'Universidad Nacional del Altiplano', 'Perú'],
  ['Gabriela Ruiz', 'Instituto de Ciencias de la Salud', 'México'],
  ['Andrés Vargas', 'Universidad del Río Grande', 'Colombia'],
  ['Sofía Herrera', 'Universidad Politécnica del Bajío', 'México'],
  ['Miguel Ángel Pérez', 'Universidad de los Lagos', 'México'],
  ['Valentina Rojas', 'Universidad del Litoral Sur', 'Argentina'],
  ['Héctor Navarro', 'Escuela de Medicina del Norte', 'México'],
  ['Daniela Ortiz', 'Universidad Católica del Oriente', 'Ecuador'],
  ['Luis Fernando Ramírez', 'Universidad de las Montañas', 'Colombia'],
  ['Claudia Morales', 'Universidad del Golfo', 'México'],
  ['Eduardo Silva', 'Universidad Interamericana del Este', 'Costa Rica'],
];
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export const ASISTENTES_EJEMPLO = base.map(([nombre, institucion, pais], i) => ({
  id: 'p' + String(i + 1).padStart(2, '0'),
  nombre, institucion, pais,
  correo: slug(nombre).split(' ')[0] + '.' + slug(nombre).split(' ').slice(-1)[0] + '@ejemplo.edu',
}));
