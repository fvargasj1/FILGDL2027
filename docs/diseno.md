# Sage LAB 2026 - "Cartas sobre la mesa"
## Diseño de la plataforma digital

Versión 1.1, 20 de noviembre de 2026. Aprobado por Felipe.

---

## 1. Para qué existe

El LAB (Library Advisory Board) reúne a 15-18 clientes de Sage durante la FIL Guadalajara (martes 1 de diciembre, City Express Plus by Marriott Guadalajara Expo). Busca tres cosas a la vez:

1. **Escuchar:** entender las necesidades de las bibliotecas y recibir feedback sobre Sage como marca.
2. **Mostrar sin vender:** que los clientes descubran por sí mismos dos recursos, el **asistente de investigación de Sage Research Methods** y la **colección de medicina de Mary Ann Liebert**, porque los usan para resolver sus propias necesidades.
3. **Pasarla bien:** una tarde amena, de pie, con bebidas y canapés, sin pausas ni presentaciones comerciales.

La plataforma es el hilo digital de la tarde: recoge lo que dicen, reparte las cartas del juego, muestra todo en el proyector y deja los datos listos para el informe.

## 2. Metas, no metas y antimetas

**Metas**
- Que cualquier cliente entre desde su celular con un QR, sin instalar nada ni crear cuenta, en menos de 30 segundos.
- Que el proyector cuente en todo momento lo que está pasando en la sala.
- Que los 3 de Sage controlen todo desde un celular, sin computador.
- Que al final exista un Excel con todo lo capturado.

**No metas**
- No es una herramienta para otros eventos (por ahora). No hay creación de eventos, ni administración de varios LAB.
- No hay competencia, puntajes ni ganadores.
- No reemplaza al asistente ni a Liebert: las cartas llevan a los recursos reales, no los imitan.

**Antimetas (sería un fracaso aunque funcione)**
- Que parezca una presentación de producto o un formulario de ventas.
- Que la gente pase más tiempo mirando el celular que conversando.
- Que alguien se quede atascado en la pantalla mientras su grupo sigue.
- Que se caiga en vivo y no haya plan B.

## 3. Restricciones

- Salón en U, un solo proyector al frente, sin otras pantallas ni computadores.
- Solo celulares de los clientes y de los 3 de Sage.
- Wifi del hotel incierto para ~21 dispositivos: debe tolerar desconexiones cortas y tener respaldo impreso.
- Todo con la identidad de Sage (Sage Navy #001A69, logo, tipografía), combinable con logo e íconos de la FIL 2026.
- Español como único idioma.
- Nunca usar el punto medio como separador en ningún texto.
- La lista de asistentes llega después: se trabaja con 18 nombres de ejemplo.
- Los clientes tendrán acceso en vivo al asistente y a Liebert.

## 4. Enfoque elegido

Se consideraron tres caminos:

| Opción | Qué es | Por qué sí o no |
|---|---|---|
| A. Demo en Claude, Supabase después | Prototipo navegable con todas las vistas | Rápido de revisar, pero habría que reescribir al migrar |
| B. Directo a Supabase | Aplicación final desde el día uno | No se puede ver nada hasta crear Supabase |
| **C. Demo con conexión enchufable (elegida)** | Una sola base de código con una capa de datos de dos modos: "demo" y "Supabase" | Se revisa ya en Claude y el paso a Supabase es cambiar una configuración |

En Claude, las páginas publicadas solo comparten datos entre personas con cuenta de la organización, por eso los clientes reales necesitan Supabase. El modo demo sincroniza pestañas del mismo navegador para probar el flujo completo.

## 5. Flujo de la tarde y lo que hace la plataforma

Horario: la gente está citada a las 4:30 p. m. (es lo único que ve en la invitación y en la plataforma); el arranque real es a las 5:00. Las fases las avanza el facilitador a mano; la plataforma no depende del reloj ni muestra horas internas.

| Fase | Sala | Celular del cliente | Proyector |
|---|---|---|---|
| 0. Llegada | Bebidas, saludos | Se busca en la lista y toca su nombre. Escribe "una palabra para Sage" | Nube de palabras creciendo en vivo y QR grande |
| 1. Apertura | Sage habla sobre el año anterior | Pantalla de espera con el nombre del LAB | Lámina de bienvenida (o lo que el facilitador quiera mostrar) |
| 2. Ronda 1: la plaza | Cada quien recibe una carta de situación en su celular. Se mueven, se juntan en grupos de 2 o 3 | Ve su carta de situación. Forma grupo con otros. El grupo escribe su necesidad en su propia voz | Muro de necesidades apareciendo una a una |
| 3. Ronda 2: cartas sobre la mesa | Los grupos juegan cartas sobre su necesidad y conversan por qué | Ve su mano de cartas. Toca una para jugarla en el tablero de su grupo. Cada carta tiene "Pruébalo" | Cuadrícula con el tablero de cada grupo: necesidad arriba, cartas debajo |
| 4. Cuéntanos | Cada grupo explica de pie en 90 segundos | El grupo puede marcar su carta "clave" | Tablero del grupo que presenta, en grande |
| 5. Cierre | Preguntas de marca | Encuesta corta | Resultados agregados en vivo |
| 6. Gracias | Despedida | Agradecimiento y resumen de las cartas que jugó, con enlaces | Gracias + nube final |

### 5.1 Ronda 1: cartas de situación
- 16 situaciones, 8 que llevan hacia Liebert y 8 hacia el asistente, sin nombrar recursos. Cada situación se reparte como máximo 2 veces.
- Ejemplo Liebert: "Nuestra facultad de salud quiere crecer en investigación y los estudiantes citan siempre las mismas fuentes."
- Ejemplo asistente: "Mis investigadores jóvenes usan IA, pero entregan sin cuestionar lo que les responde."
- **Formar grupo:** una persona toca "Crear grupo" y aparece un código de 3 letras grande en su pantalla; los demás tocan "Unirme" y escriben el código. Grupos de 1 a 4 personas son válidos.
- **Necesidad:** cualquier miembro escribe la necesidad del grupo (máximo 200 caracteres) y elige de qué situación partió. Se puede editar hasta que el facilitador pase a la ronda 2.

### 5.2 Ronda 2: el juego de cartas
- **Mano:** al empezar la ronda, cada persona recibe 5 cartas al azar: 3 de Liebert y 2 de movimientos del asistente. Las manos son distintas entre sí dentro de lo posible.
- **Mazo Liebert:** ~36 revistas curadas de la colección de medicina. Cada carta: título, área (por ejemplo, cardiología), una línea de qué cubre y para qué le sirve a una biblioteca, color por área. Sin carátulas en la v1 (se pueden añadir si Sage las aporta).
- **Mazo asistente:** ~12 "movimientos" que muestran cómo acompaña la investigación, por ejemplo "Te devuelve una pregunta", "Cuestiona tu hipótesis", "Te muestra métodos alternativos", "Te explica por qué, no solo qué". Cada carta: nombre del movimiento, una línea de qué hace y una sugerencia concreta para probarlo.
- **"Pruébalo":** cada carta abre el recurso real en una pestaña nueva. Los clientes entran con un usuario y contraseña que Sage les entrega.
  - Movimientos del asistente: https://methods.sagepub.com
  - Revistas Liebert: por ahora https://journals.sagepub.com. Más adelante apuntará a una página propia de Liebert (al estilo del catálogo Premier, con listados y cuartiles) desde donde se llega a cada revista. Por eso la URL base de Liebert vive en un solo lugar de la configuración, y cada carta puede tener además su propia URL opcional.
- **Jugar una carta:** tocarla y confirmar. Aparece en el tablero del grupo en el proyector con el nombre de quien la jugó. Se puede retirar.
- **Pedir cartas:** si a alguien no le sirve su mano, puede cambiar hasta 2 cartas por otras al azar.

### 5.3 Cierre: encuesta
Cinco preguntas, todas opcionales, ligadas al nombre del asistente (es un consejo asesor, no una encuesta anónima):
1. En una palabra, ¿cómo describirías a Sage hoy? (texto corto)
2. ¿Qué deberíamos mantener? (texto)
3. ¿Qué deberíamos cambiar o mejorar? (texto)
4. ¿Qué tan útil te parecería el asistente de investigación para tu comunidad? (1 a 5)
5. ¿Qué tan relevante sería la colección Liebert para tu institución? (1 a 5)
Más una casilla: "Quiero que Sage me contacte para conocer más" (sí/no).

## 6. Vistas

Una sola aplicación con cuatro vistas, elegidas por la URL:

1. **Cliente** (`/`): celular, vertical. Ingreso, palabra, carta de situación, grupo, necesidad, mano de cartas, encuesta, gracias.
2. **Proyector** (`/#proyector`): 16:9, letras grandes legibles desde el fondo del salón, animaciones suaves.
3. **Facilitador** (`/#facilitador`, con PIN): avanzar o retroceder de fase, elegir qué grupo se muestra en grande, ver quién ya ingresó, reiniciar un celular atascado, borrar una palabra o necesidad inapropiada, exportar.
4. **Exportación** (dentro de Facilitador): descarga un Excel con hojas Asistentes, Palabras, Grupos y necesidades, Cartas jugadas, Encuesta.

En modo demo se añade una barra de demostración con un selector de vista y la opción de simular varios clientes desde una misma pantalla.

## 7. Datos

| Tabla | Campos principales |
|---|---|
| asistentes | id, nombre, institución, correo, país, ingresó_en |
| estado | fase actual, grupo destacado (una sola fila) |
| palabras | asistente, palabra, creada_en |
| situaciones_asignadas | asistente, situación |
| grupos | id, código, necesidad, situación_origen |
| miembros | grupo, asistente |
| manos | asistente, carta, estado (en mano, jugada, cambiada) |
| jugadas | grupo, carta, asistente, orden, clave |
| encuesta | asistente, respuestas |

Las cartas (situaciones, Liebert, movimientos) son contenido fijo en un archivo de datos, no en la base, para editarlas fácil.

## 8. Arquitectura

- HTML, CSS y JavaScript sin paso de compilación, para subir a GitHub Pages tal cual.
- **Capa de datos** con la misma interfaz en ambos modos:
  - *Demo:* memoria del navegador + BroadcastChannel para sincronizar pestañas.
  - *Supabase:* tablas Postgres + Realtime. Se activa con URL y clave pública en un archivo de configuración.
- Se incluye el script SQL para crear las tablas y permisos en Supabase.
- El celular guarda quién es el asistente para sobrevivir recargas y desconexiones cortas.
- La versión de revisión se publica como artifact en Claude en modo demo.

## 9. Respaldo sin wifi

Fuera del alcance de esta primera entrega, pero previsto: versión imprimible de las cartas y situaciones, y encuesta en papel.

## 10. Decisiones tomadas por Claude (revisar)

- Grupos con código de 3 letras en vez de elegir compañeros de una lista.
- 5 cartas por mano (3 Liebert + 2 asistente) y hasta 2 cambios.
- ~36 revistas Liebert y ~12 movimientos del asistente, seleccionadas por Claude con información pública; Felipe las revisa.
- Encuesta de 5 preguntas ligada al nombre, con casilla de contacto.
- Fases avanzadas a mano por el facilitador, sin cronómetro obligatorio.
- PIN simple para el panel de facilitador.
- Sin carátulas de revistas en la v1.

## 11. Pendiente de Felipe

- Lista real de asistentes (nombre, institución, correo, país).
- Revisar textos de situaciones, cartas Liebert, movimientos del asistente y encuesta.

---

## 11. Versión 2: juego análogo y digital (23 de noviembre de 2026)

Reemplaza las secciones 5.1 y 5.2 y la tabla de datos de la sección 7.

- **Retos impresos (ronda 1):** 10 retos en tamaño carta, uno por reto, sin nombrar recursos. Cada reto tiene un equipo con nombre de recurso de Sage (Campus, Skills, Methods, Business, Knowledge, Journals, Video, Data, Policy, Cases). Quien escanea el reto entra a ese equipo (máximo 5 personas) y responde "¿Esto pasa en tu institución?" (sí, a veces, no) con un comentario opcional. Desaparecen las situaciones individuales, los códigos de 3 letras y la "necesidad" escrita.
- **Cartas impresas (ronda 2):** 30 revistas Liebert (L01 a L30) y 18 movimientos del asistente (A01 a A18), 2 copias de cada una, en A6. El equipo de Sage reparte a cada persona 5 cartas en papel (3 Liebert y 2 del asistente). Escanear una carta la juega sobre el reto del equipo: máximo 6 cartas por equipo, sin repetir, con una sola carta clave y un "por qué" escrito en la fase Cuéntanos. Las cartas no se cambian en la plataforma: la mano es física.
- **QR y NFC:** cada pieza abre `urlPublica?c=CÓDIGO`, la misma dirección en el QR y en el tag NFC de 25 mm. Si la persona aún no se ha identificado, el código queda pendiente y se abre después del ingreso. Se puede escribir el código a mano como respaldo.
- **Lo impreso es fijo:** códigos y dirección no cambian; textos en pantalla, destinos de "Pruébalo" y nombres en pantalla sí.
- **Datos:** `equipos` (por código de reto), `respuestas` (por persona, con su reto), `jugadas` (equipo, carta, quién, clave). El Excel trae las hojas Asistentes, Palabras, Equipos, Retos por persona, Cartas jugadas y Encuesta.
- **Identidad:** en el evento se guarda en localStorage, porque cada QR o NFC abre una pestaña nueva.
