import { config } from '../config.js';

// FUENTE ÚNICA del contenido impreso. De aquí salen la plataforma, los PDF de imprenta y el listado de URL.
// Los CÓDIGOS (R01, L01, A01...) quedan impresos en papel, QR y NFC: nunca cambiarlos ni reutilizarlos.
// Los textos sí se pueden corregir en la plataforma después de imprimir (la carta en papel no cambia).

// Ronda 1: retos impresos en tamaño carta, uno por reto. Quien escanea un reto entra a su equipo.
// "recurso" es interno (para el informe); no se muestra a los clientes.
export const RETOS = [
  { codigo: 'R01', equipo: 'Campus', recurso: 'liebert', texto: 'Nuestra facultad de salud quiere crecer en investigación, pero los estudiantes citan siempre las mismas cinco fuentes.' },
  { codigo: 'R02', equipo: 'Skills', recurso: 'liebert', texto: 'Abrimos programas nuevos, de lo clínico a la ingeniería y el medio ambiente, y la colección no tiene revistas de esas áreas.' },
  { codigo: 'R03', equipo: 'Methods', recurso: 'asistente', texto: 'Los estudiantes de posgrado llegan a la tesis sin saber qué método elegir ni por qué.' },
  { codigo: 'R04', equipo: 'Business', recurso: 'liebert', texto: 'Tenemos presupuesto limitado y debemos justificar cada suscripción con su impacto real en docencia e investigación.' },
  { codigo: 'R05', equipo: 'Knowledge', recurso: 'asistente', texto: 'Nuestros investigadores jóvenes usan IA, pero entregan lo que les responde sin cuestionarlo.' },
  { codigo: 'R06', equipo: 'Journals', recurso: 'liebert', texto: 'Los investigadores en biotecnología y terapias avanzadas sienten que la biblioteca no sigue el ritmo de su campo.' },
  { codigo: 'R07', equipo: 'Video', recurso: 'asistente', texto: 'Nuestros talleres de formación llegan a pocos: la gente necesita orientación a la hora en que investiga, no solo en clase.' },
  { codigo: 'R08', equipo: 'Data', recurso: 'liebert', texto: 'La acreditación de medicina nos pide demostrar acceso a literatura científica de calidad por especialidad.' },
  { codigo: 'R09', equipo: 'Policy', recurso: 'asistente', texto: 'Los docentes temen que la IA haga las tareas por los estudiantes en lugar de ayudarles a aprender.' },
  { codigo: 'R10', equipo: 'Cases', recurso: 'asistente', texto: 'Los estudiantes no logran convertir un tema amplio en una pregunta de investigación que se pueda responder.' },
];

// Ronda 2: 30 revistas de Mary Ann Liebert, tomadas de la lista oficial "Liebert Premier 2027" (104 títulos).
// 27 de salud y 3 de otras áreas, para mostrar la amplitud de la colección. Cada carta abre su revista.
// No mostrar factor de impacto, cuartil ni sociedad aliada (decisión del equipo).
export const LIEBERT = [
  { codigo: 'L01', titulo: 'Thyroid®', area: 'Endocrinología', url: 'https://journals.sagepub.com/loi/THY', descripcion: 'Investigación clínica y básica sobre la tiroides, del diagnóstico al tratamiento.' },
  { codigo: 'L02', titulo: 'Diabetes Technology & Therapeutics', area: 'Endocrinología', url: 'https://journals.sagepub.com/loi/DTT', descripcion: 'Tecnología aplicada a la diabetes: monitoreo continuo, bombas de insulina y terapias.' },
  { codigo: 'L03', titulo: 'Journal of Neurotrauma', area: 'Neurociencias', url: 'https://journals.sagepub.com/loi/NRT', descripcion: 'Lesiones cerebrales y medulares: mecanismos, rehabilitación y resultados clínicos.' },
  { codigo: 'L04', titulo: 'Brain Connectivity', area: 'Neurociencias', url: 'https://journals.sagepub.com/loi/BRC', descripcion: 'Cómo se conectan las redes cerebrales, con imagen y modelado.' },
  { codigo: 'L05', titulo: 'Journal of Child and Adolescent Psychopharmacology', area: 'Salud mental', url: 'https://journals.sagepub.com/loi/CHA', descripcion: 'Uso seguro y eficaz de medicamentos en salud mental infantil y adolescente.' },
  { codigo: 'L06', titulo: 'Cyberpsychology, Behavior, and Social Networking', area: 'Salud mental', url: 'https://journals.sagepub.com/loi/CYB', descripcion: 'Efectos de la tecnología y las redes sociales en la conducta y el bienestar.' },
  { codigo: 'L07', titulo: 'Autism in Adulthood', area: 'Salud mental', url: 'https://journals.sagepub.com/loi/AUA', descripcion: 'Investigación sobre la vida adulta de las personas autistas, con su participación.' },
  { codigo: 'L08', titulo: 'Breastfeeding Medicine', area: 'Salud materno infantil', url: 'https://journals.sagepub.com/loi/BFM', descripcion: 'Evidencia sobre lactancia materna para clínicos y salud pública.' },
  { codigo: 'L09', titulo: 'Childhood Obesity', area: 'Salud materno infantil', url: 'https://journals.sagepub.com/loi/CDO', descripcion: 'Prevención y tratamiento de la obesidad en niños y familias.' },
  { codigo: 'L10', titulo: "Journal of Women's Health", area: 'Salud de la mujer', url: 'https://journals.sagepub.com/loi/JWH', descripcion: 'Salud de la mujer a lo largo de la vida, con enfoque clínico y de equidad.' },
  { codigo: 'L11', titulo: 'AIDS Research and Human Retroviruses', area: 'Infectología', url: 'https://journals.sagepub.com/loi/AID', descripcion: 'Investigación sobre VIH y retrovirus, de la biología a la clínica.' },
  { codigo: 'L12', titulo: 'Microbial Drug Resistance', area: 'Infectología', url: 'https://journals.sagepub.com/loi/MDR', descripcion: 'Resistencia a antimicrobianos: mecanismos, vigilancia y control.' },
  { codigo: 'L13', titulo: 'Vector-Borne and Zoonotic Diseases', area: 'Infectología', url: 'https://journals.sagepub.com/loi/VBZ', descripcion: 'Enfermedades transmitidas por vectores y animales, clave en la región.' },
  { codigo: 'L14', titulo: 'Journal of Endourology', area: 'Cirugía', url: 'https://journals.sagepub.com/loi/ENR', descripcion: 'Técnicas mínimamente invasivas en urología.' },
  { codigo: 'L15', titulo: 'Cancer Biotherapy and Radiopharmaceuticals', area: 'Oncología', url: 'https://journals.sagepub.com/loi/CBT', descripcion: 'Bioterapias y radiofármacos para diagnóstico y tratamiento del cáncer.' },
  { codigo: 'L16', titulo: 'AI in Precision Oncology', area: 'Oncología', url: 'https://journals.sagepub.com/loi/AII', descripcion: 'Inteligencia artificial aplicada a la oncología de precisión.' },
  { codigo: 'L17', titulo: 'Population Health Management', area: 'Salud pública', url: 'https://journals.sagepub.com/loi/POP', descripcion: 'Gestión de la salud de poblaciones, calidad y costos de la atención.' },
  { codigo: 'L18', titulo: 'Health Security', area: 'Salud pública', url: 'https://journals.sagepub.com/loi/HSC', descripcion: 'Preparación ante epidemias, emergencias y amenazas sanitarias.' },
  { codigo: 'L19', titulo: 'LGBT Health', area: 'Salud pública', url: 'https://journals.sagepub.com/loi/LGB', descripcion: 'Salud de las personas LGBT, investigación y políticas.' },
  { codigo: 'L20', titulo: 'Telemedicine and e-Health', area: 'Salud digital', url: 'https://journals.sagepub.com/loi/TEH', descripcion: 'Telemedicina y salud digital: cómo se implementa, qué resultados tiene y cómo llega a más pacientes.' },
  { codigo: 'L21', titulo: 'Games for Health Journal', area: 'Salud digital', url: 'https://journals.sagepub.com/loi/GFH', descripcion: 'Juegos y gamificación para la salud y el cambio de conducta.' },
  { codigo: 'L22', titulo: 'Human Gene Therapy', area: 'Terapias avanzadas', url: 'https://journals.sagepub.com/loi/HGT', descripcion: 'Terapia génica y celular, de la investigación a los ensayos clínicos.' },
  { codigo: 'L23', titulo: 'Stem Cells and Development', area: 'Terapias avanzadas', url: 'https://journals.sagepub.com/loi/STC', descripcion: 'Células madre y medicina regenerativa.' },
  { codigo: 'L24', titulo: 'Tissue Engineering Part A', area: 'Terapias avanzadas', url: 'https://journals.sagepub.com/loi/TEA', descripcion: 'Ingeniería de tejidos y biomateriales para regenerar órganos.' },
  { codigo: 'L25', titulo: 'The CRISPR Journal', area: 'Terapias avanzadas', url: 'https://journals.sagepub.com/loi/TCJ', descripcion: 'Edición genética con CRISPR: ciencia, aplicaciones y ética.' },
  { codigo: 'L26', titulo: 'Journal of Palliative Medicine', area: 'Cuidados paliativos', url: 'https://journals.sagepub.com/loi/PLM', descripcion: 'Cuidados paliativos y atención al final de la vida.' },
  { codigo: 'L27', titulo: 'Journal of Integrative and Complementary Medicine', area: 'Medicina integrativa', url: 'https://journals.sagepub.com/loi/CPM', descripcion: 'Evidencia sobre terapias complementarias integradas a la atención.' },
  { codigo: 'L28', titulo: 'Big Data', area: 'Ciencia de datos', url: 'https://journals.sagepub.com/loi/BIG', descripcion: 'Cómo se recolectan, analizan y usan grandes volúmenes de datos, con su impacto en la sociedad.' },
  { codigo: 'L29', titulo: 'Soft Robotics', area: 'Ingeniería', url: 'https://journals.sagepub.com/loi/SRB', descripcion: 'Robots blandos y flexibles inspirados en la naturaleza, de la medicina a la industria.' },
  { codigo: 'L30', titulo: 'Sustainability and Climate Change', area: 'Medio ambiente', url: 'https://journals.sagepub.com/loi/SCL', descripcion: 'Soluciones y políticas frente al cambio climático, con mirada interdisciplinaria.' },
];

// Ronda 2: "movimientos" del asistente de investigación de Sage Research Methods.
// Basados en sus FAQ oficiales: explica en lenguaje claro, lleva a contenido de SRM, apoya el aprendizaje y pide criterio propio.
export const ASISTENTE = [
  { codigo: 'A01', titulo: 'Explícamelo fácil', descripcion: 'Explica conceptos de metodología en lenguaje claro, cuando lo necesitas.', pruebalo: '¿Qué diferencia hay entre un muestreo intencional y uno por conveniencia?' },
  { codigo: 'A02', titulo: '¿Qué método elijo?', descripcion: 'Ayuda a comparar enfoques antes de decidir el diseño de un estudio.', pruebalo: '¿Me conviene una encuesta o entrevistas para estudiar el uso de la biblioteca?' },
  { codigo: 'A03', titulo: 'Llévame a la fuente', descripcion: 'No se queda en la respuesta: recomienda libros, casos y videos confiables para profundizar.', pruebalo: 'Recomiéndame recursos para aprender análisis temático.' },
  { codigo: 'A04', titulo: 'Muéstrame un caso real', descripcion: 'Conecta la teoría con estudios de caso de investigaciones reales.', pruebalo: '¿Hay casos de investigación que usen grupos focales en salud?' },
  { codigo: 'A05', titulo: 'Afina tu pregunta', descripcion: 'Orienta para convertir un tema amplio en una pregunta de investigación clara, sin hacer el trabajo por ti.', pruebalo: '¿Cómo formulo una buena pregunta de investigación sobre lectura en universitarios?' },
  { codigo: 'A06', titulo: 'Revisa la literatura', descripcion: 'Explica cómo planear una revisión de literatura paso a paso.', pruebalo: '¿Cuáles son los pasos de una revisión sistemática?' },
  { codigo: 'A07', titulo: 'Investiga con ética', descripcion: 'Aclara principios de ética, consentimiento informado y trabajo con poblaciones sensibles.', pruebalo: '¿Qué debe incluir un consentimiento informado?' },
  { codigo: 'A08', titulo: '¿Qué análisis hago?', descripcion: 'Ayuda a entender qué técnica de análisis se ajusta a tus datos.', pruebalo: '¿Cuándo uso una prueba t y cuándo un ANOVA?' },
  { codigo: 'A09', titulo: 'No lo hace por ti', descripcion: 'Está pensado para aprender, no para escribir tareas: acompaña el proceso en lugar de reemplazarlo.', pruebalo: 'Pídele que te escriba un trabajo completo y mira cómo responde.' },
  { codigo: 'A10', titulo: 'Contrasta y decide', descripcion: 'Invita a revisar los recursos recomendados y aplicar tu propio criterio.', pruebalo: '¿Cómo verifico lo que me acabas de responder?' },
  { codigo: 'A11', titulo: 'A cualquier hora', descripcion: 'Orientación en el momento en que se investiga, no solo en el aula o el taller.', pruebalo: '¿Cómo calculo el tamaño de una muestra?' },
  { codigo: 'A12', titulo: 'Aliado del formador', descripcion: 'Apoya a docentes y bibliotecarios para guiar el aprendizaje y el descubrimiento de contenido.', pruebalo: '¿Qué recursos me sirven para enseñar métodos mixtos?' },
  { codigo: 'A13', titulo: 'A tu nivel', descripcion: 'Adapta la explicación a quien pregunta, de quien empieza a quien ya investiga.', pruebalo: 'Explícame qué es una regresión como si nunca hubiera visto estadística.' },
  { codigo: 'A14', titulo: 'Diseña tu encuesta', descripcion: 'Orienta para construir un cuestionario y evitar preguntas que sesgan las respuestas.', pruebalo: '¿Cómo evito preguntas sesgadas en una encuesta?' },
  { codigo: 'A15', titulo: 'Prepara tu entrevista', descripcion: 'Guía para planear entrevistas cualitativas, desde el guion hasta el análisis.', pruebalo: '¿Cómo preparo el guion de una entrevista semiestructurada?' },
  { codigo: 'A16', titulo: 'Mezcla métodos', descripcion: 'Explica cuándo y cómo combinar datos cualitativos y cuantitativos.', pruebalo: '¿Cuándo conviene un diseño de métodos mixtos?' },
  { codigo: 'A17', titulo: 'Datos para practicar', descripcion: 'Señala conjuntos de datos de Sage Research Methods para practicar el análisis.', pruebalo: '¿Hay conjuntos de datos para practicar una regresión logística?' },
  { codigo: 'A18', titulo: 'Tus preguntas son tuyas', descripcion: 'Las conversaciones no se usan para entrenar modelos públicos de IA.', pruebalo: '¿Qué pasa con las preguntas que te hago?' },
];

export const EQUIPOS = Object.fromEntries(RETOS.map(r => [r.codigo, r.equipo]));
export const MAX_CARTAS_EQUIPO = 6;

const normal = (c) => String(c ?? '').trim().toUpperCase().replace(/\s+/g, '');

// Acepta "l5", "L05", " a 12 " y devuelve el código canónico ("L05") o null.
export function normalizarCodigo(texto) {
  const m = normal(texto).match(/^([RLA])0*(\d{1,2})$/);
  if (!m) return null;
  const cod = m[1] + m[2].padStart(2, '0');
  return buscar(cod) ? cod : null;
}

export function buscar(codigo) {
  const c = normal(codigo);
  const r = RETOS.find(x => x.codigo === c);
  if (r) return { tipo: 'reto', ...r };
  const l = LIEBERT.find(x => x.codigo === c);
  if (l) return { tipo: 'liebert', ...l, url: l.url ?? config.liebertBaseUrl };
  const a = ASISTENTE.find(x => x.codigo === c);
  if (a) return { tipo: 'asistente', ...a, url: a.url ?? config.metodosUrl };
  return null;
}

export const esCarta = (codigo) => ['liebert', 'asistente'].includes(buscar(codigo)?.tipo);
export const esReto = (codigo) => buscar(codigo)?.tipo === 'reto';

// URL que va impresa en el QR y grabada en el NFC. Debe ser idéntica en ambos.
export const urlImpresa = (codigo, base = config.urlPublica) => `${base}?c=${codigo}`;
