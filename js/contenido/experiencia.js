// "Tu experiencia con Sage": bloque de preguntas solo en la plataforma, después de la apertura y antes del juego.
// Los ids van al Excel: no reutilizarlos para otra cosa.

// Recursos de Sage. logo: archivo en assets/recursos (azul) y assets/recursos/blanco (proyector). Sin logo se muestra el nombre.
export const CATALOGO = [
  { id: 'journals', nombre: 'Sage Journals', logo: 'journals', desc: 'Revistas revisadas por pares en todas las disciplinas.' },
  { id: 'liebert', nombre: 'Mary Ann Liebert', logo: 'liebert', desc: 'Revistas de medicina, ciencias de la vida e ingeniería.' },
  { id: 'methods', nombre: 'Sage Research Methods', logo: 'methods', desc: 'Métodos de investigación, ahora con asistente de investigación.' },
  { id: 'books', nombre: 'Sage Books & Reference', logo: 'books', desc: 'Libros, manuales y obras de referencia.' },
  { id: 'business', nombre: 'Sage Business', logo: 'business', desc: 'Casos, investigación y datos para enseñar negocios.' },
  { id: 'video', nombre: 'Sage Video', logo: 'video', desc: 'Video para la enseñanza y la investigación.' },
  { id: 'data', nombre: 'Sage Data', desc: 'Datos estadísticos listos para analizar.' },
  { id: 'campus', nombre: 'Sage Campus', logo: 'campus', desc: 'Cursos en línea de métodos y habilidades de datos.' },
  { id: 'skills', nombre: 'Sage Skills', logo: 'skills', desc: 'Habilidades académicas y para la vida profesional.' },
  { id: 'policy', nombre: 'Sage Policy Profiles', desc: 'Cómo llega la investigación a las políticas públicas.' },
  { id: 'am', nombre: 'Adam Matthew', desc: 'Fuentes primarias digitalizadas para las humanidades.' },
  { id: 'cq', nombre: 'CQ Press Library', desc: 'Política y gobierno de Estados Unidos.' },
];
export const nombreCatalogo = (id) => CATALOGO.find(r => r.id === id)?.nombre ?? id;

// Pregunta 1 (obligatoria): estado de cada recurso en su institución.
export const ESTADO_RECURSO = { tiene: 'Lo tenemos', conoce: 'Lo conozco', nuevo: 'Nuevo para mí' };

// Pregunta 3: seis aspectos de 1 a 5.
export const DIMENSIONES = [
  { id: 'contenido', nombre: 'Contenido', ayuda: 'Calidad y pertinencia de lo que publicamos' },
  { id: 'plataforma', nombre: 'Plataformas', ayuda: 'Facilidad para buscar y acceder' },
  { id: 'soporte', nombre: 'Soporte y atención', ayuda: 'Rapidez y claridad cuando nos necesitas' },
  { id: 'formacion', nombre: 'Capacitación', ayuda: 'Talleres, webinars y materiales' },
  { id: 'comunicacion', nombre: 'Comunicación', ayuda: 'Lo que te contamos y cómo' },
  { id: 'comercial', nombre: 'Flexibilidad comercial', ayuda: 'Modelos, precios y negociación' },
];
export const NIVELES = ['Muy débil', 'Débil', 'Aceptable', 'Bueno', 'Excelente'];

export const CANALES = {
  correo: 'Correos de Sage', ejecutivo: 'Mi ejecutivo de cuenta', webinars: 'Webinars', eventos: 'Eventos y ferias',
  redes: 'Redes sociales', web: 'Sitio web de Sage', colegas: 'Colegas', ninguno: 'Casi no me entero',
};
export const ESPERA = {
  novedades: 'Novedades de contenido', uso: 'Reportes de uso de mi institución', promocion: 'Material de promoción listo para usar',
  casos: 'Experiencias de otras bibliotecas', eventos: 'Invitaciones a eventos', menos: 'Menos correos, más precisos',
};
export const PARTICIPO = { reciente: 'Sí, este año', antes: 'Sí, hace más de un año', no: 'Todavía no' };
export const FORMATOS = {
  webinar: 'Webinar en vivo', presencial: 'Taller presencial', videos: 'Videos cortos', guias: 'Guías descargables', medida: 'Sesión a la medida de mi institución',
};
export const PUBLICOS = {
  biblioteca: 'Personal de biblioteca', pregrado: 'Estudiantes de pregrado', posgrado: 'Estudiantes de posgrado', investigadores: 'Investigadores', docentes: 'Docentes',
};

export const MAX_DESEO = 3, MAX_ABIERTA = 300, MAX_FRASES = 6;

// Textos de cada pregunta, en un solo lugar (celular, proyector y Excel).
export const TEXTOS = {
  recursos: '¿Qué tan cerca está cada recurso de tu institución?',
  nps: '¿Qué tan probable es que recomiendes Sage a un colega?',
  dims: '¿Cómo calificas a Sage en cada aspecto?',
  valora: 'Lo que más valoras de Sage',
  mejora: 'Lo primero que mejorarías',
  canales: '¿Por dónde te enteras de lo nuevo de Sage?',
  utilMkt: '¿Qué tan útil te resulta lo que Sage te comunica?',
  espera: '¿Qué te gustaría recibir de Sage?',
  esperaOtra: 'Otra idea (opcional)',
  participo: '¿Has participado en capacitaciones de Sage?',
  utilForm: '¿Qué tan útil te resultó?',
  formatos: '¿En qué formato la prefieres?',
  publicos: '¿A quién necesitas capacitar?',
  deseo: 'Si el presupuesto no fuera un tema, ¿qué recursos suscribirías?',
  frase: 'Sage sería indispensable para mi institución si…',
};

export const PANTALLAS = ['Tu biblioteca y Sage hoy', 'Qué funciona y qué no', 'Comunicación y formación', 'Sin límite de presupuesto'];

// Campos de texto abierto que el facilitador puede proyectar (sin nombre).
export const ABIERTAS = { valora: 'Lo que más valoran', mejora: 'Lo primero que mejorarían', esperaOtra: 'Lo que esperan recibir', frase: 'Sage sería indispensable si…' };

// Agrupación aproximada por palabras clave (raíces sin tildes). La primera que coincide gana.
export const TEMAS = [
  { id: 'precio', nombre: 'Precio y presupuesto', claves: ['precio', 'costo', 'presupuest', 'tarifa', 'caro', 'cara', 'descuento', 'pago', 'licencia', 'negocia', 'contrato', 'renovac'] },
  { id: 'soporte', nombre: 'Soporte y atención', claves: ['soporte', 'atencion', 'respuesta', 'responde', 'ayuda', 'servicio', 'acompan', 'cercan', 'ejecutiv', 'contacto', 'trato'] },
  { id: 'formacion', nombre: 'Capacitación', claves: ['capacit', 'formacion', 'entrenamiento', 'taller', 'webinar', 'curso', 'tutorial', 'guia', 'aprend'] },
  { id: 'plataforma', nombre: 'Plataformas y acceso', claves: ['plataforma', 'busqueda', 'buscador', 'interfaz', 'acceso', 'navega', 'login', 'proxy', 'usabilidad', 'facil', 'descarga', 'movil', 'tecnic'] },
  { id: 'datos', nombre: 'Estadísticas de uso', claves: ['estadistic', 'reporte', 'counter', 'metrica', 'indicador', 'uso de'] },
  { id: 'comunicacion', nombre: 'Comunicación', claves: ['correo', 'comunica', 'informa', 'newsletter', 'boletin', 'marketing', 'difusion', 'promocion', 'redes', 'mail'] },
  { id: 'contenido', nombre: 'Contenido', claves: ['contenido', 'revista', 'libro', 'coleccion', 'espanol', 'idioma', 'calidad', 'articulo', 'actualiz', 'tema', 'disciplina', 'metodo'] },
];
export const OTROS_TEMA = { id: 'otros', nombre: 'Otros temas' };
