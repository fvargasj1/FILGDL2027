# Plataforma Sage LAB "Cartas sobre la mesa" - Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Una aplicación web sin compilación (cliente, proyector, facilitador) que corre en modo demo dentro de Claude y pasa a Supabase cambiando solo la configuración.

**Architecture:** Estado de toda la sesión como un solo objeto. Las reglas del juego son funciones puras `accion(estado, ...) -> estado` (probadas con `node --test`). Un "store" expone `subscribe(cb)` y `dispatch(nombreAccion, ...args)`; el adaptador demo aplica las acciones en memoria y sincroniza pestañas con BroadcastChannel + localStorage; el adaptador Supabase traduce cada acción a filas en tablas y reconstruye el estado desde Realtime. Las vistas solo leen el estado y llaman `dispatch`.

**Tech Stack:** HTML + CSS + JavaScript (ES modules, sin build), Node 22 `node --test`, SheetJS y supabase-js copiados a `vendor/`, Playwright (Python) para comprobar vistas.

**Spec:** `docs/diseno.md`

## Global Constraints

- Todo el texto visible en español. Nunca usar el punto medio "·" como separador; usar guion "-".
- Identidad Sage: Sage Navy `#001A69`, logo en `#001F83` sobre fondos claros, fondo Páginas `#edeae5`, acento Travesía `#f5ae8d`, Tinta `#0a2b1a`; tipografía Open Sans (sustituto de Sage Peak). Logo FIL 40 como acento.
- La plataforma solo muestra "4:30 p. m." como hora citada; nunca muestra la hora interna de arranque (5:00).
- Sin cuentas ni instalación para clientes: entran por QR y se eligen en la lista.
- Grupos de 1 a 4 personas válidos.
- Ronda 1: 16 situaciones (8 Liebert, 8 asistente); cada una asignada como máximo 2 veces.
- Ronda 2: mano de 5 cartas (3 Liebert + 2 asistente); hasta 2 cambios por persona.
- "Pruébalo": asistente -> `https://methods.sagepub.com`; Liebert -> `https://journals.sagepub.com` como base configurable en un solo lugar (`config.liebertBaseUrl`), con URL opcional por carta.
- Necesidad del grupo: máximo 200 caracteres. Palabra para Sage: máximo 30 caracteres, una por persona (puede reemplazarla).
- Encuesta: 5 preguntas opcionales + casilla de contacto, ligadas al asistente.
- Panel de facilitador protegido con PIN (`config.pinFacilitador`, por defecto `"2026"`).
- Fases en orden: `llegada`, `apertura`, `ronda1`, `ronda2`, `cuentanos`, `cierre`, `gracias`. Solo el facilitador las cambia.
- Ningún archivo requiere paso de compilación; `index.html` se abre tal cual en GitHub Pages.

## Review Focus

1. **Recarga o caída de wifi en el celular a mitad de ronda:** al volver, la persona sigue identificada con su mano y su grupo intactos. Test en Task 3 (`demo: identidad persiste tras recarga`).
2. **Llega tarde, después de repartir manos:** al ingresar en `ronda2` recibe su mano automáticamente. Test en Task 2 (`ingresar en ronda2 reparte mano`).
3. **Nadie en grupo al empezar la ronda 2:** no puede jugar; la pantalla le ofrece crear su grupo de 1. Test en Task 2 (`jugarCarta sin grupo falla`) y comprobación visual en Task 5.
4. **Código de grupo mal escrito** (minúsculas, espacios, inexistente): se normaliza y, si no existe, muestra error sin sacarlo de la pantalla. Test en Task 2 (`unirseGrupo normaliza y rechaza`).
5. **Texto largo en el proyector** (necesidad de 200 caracteres, 18 grupos de 1): el proyector no se desborda; letras se reducen. Comprobación visual en Task 6 con datos extremos.
6. **Misma persona elegida en dos celulares:** el segundo celular ve "Ya ingresaste en otro dispositivo, ¿eres tú?" y puede continuar (no bloquea). Test en Task 2 (`ingresar dos veces es idempotente`).

---

## Estructura de archivos

```
lab-plataforma/
  index.html                  entrada única; enruta por hash (#proyector, #facilitador)
  css/sage.css                tokens y componentes visuales
  js/config.js                modo, URLs, PIN, claves Supabase
  js/app.js                   arranque: crea store, elige vista
  js/contenido/situaciones.js 16 situaciones
  js/contenido/liebert.js     ~36 revistas
  js/contenido/asistente.js   ~12 movimientos
  js/contenido/encuesta.js    preguntas de cierre
  js/contenido/asistentes-ejemplo.js  18 asistentes de ejemplo
  js/logica/estado.js         estadoInicial() y acciones puras
  js/logica/reparto.js        asignar situaciones, repartir y cambiar cartas
  js/datos/store-demo.js      adaptador demo
  js/datos/store-supabase.js  adaptador Supabase
  js/datos/crear-store.js     elige adaptador según config
  js/vistas/cliente.js
  js/vistas/proyector.js
  js/vistas/facilitador.js
  js/vistas/barra-demo.js
  js/vistas/ui.js             helpers DOM compartidos (h(), carta(), logo())
  js/exportar.js              estado -> libro Excel
  assets/                     logo Sage SVG, logo FIL PNG, cinta FIL
  vendor/xlsx.full.min.js, vendor/supabase.js
  supabase/schema.sql
  tests/*.test.js
  tests/visual/capturas.py
  README.md
```

---

### Task 1: Esqueleto, contenido y configuración

**Files:**
- Create: `index.html`, `css/sage.css`, `js/config.js`, `js/contenido/*.js`, `assets/*`, `README.md`, `package.json` (solo `"type":"module"` y script `test`)
- Test: `tests/contenido.test.js`

**Interfaces:**
- Produces:
  - `config = { modo: "demo"|"supabase", supabaseUrl, supabaseAnonKey, metodosUrl: "https://methods.sagepub.com", liebertBaseUrl: "https://journals.sagepub.com", pinFacilitador: "2026", horaCitada: "4:30 p. m." }`
  - `SITUACIONES: Array<{id:"s01".."s16", recurso:"liebert"|"asistente", texto:string}>`
  - `CARTAS_LIEBERT: Array<{id:"l01"..., titulo, area, descripcion, url?:string}>`
  - `CARTAS_ASISTENTE: Array<{id:"a01"..., nombre, descripcion, pruebalo:string}>`
  - `urlCarta(carta) -> string` en `js/contenido/liebert.js` / `asistente.js` (Liebert: `carta.url ?? config.liebertBaseUrl`; asistente: `config.metodosUrl`)
  - `PREGUNTAS: Array<{id:"p1".."p5", tipo:"texto"|"escala", texto}>` + `CONTACTO_TEXTO`
  - `ASISTENTES_EJEMPLO: Array<{id, nombre, institucion, correo, pais}>` (18)

- [ ] **Step 1: Investigar contenido.** Buscar en la web la lista actual de revistas de Mary Ann Liebert (medicina) y las funciones del Research Assistant de Sage Research Methods. Elegir ~36 revistas repartidas en al menos 8 áreas y ~12 movimientos basados en funciones reales. Redactar las 16 situaciones (texto del spec 5.1 como tono) y las preguntas del spec 5.3 literalmente.
- [ ] **Step 2: Escribir test** `tests/contenido.test.js`:
  - `SITUACIONES` tiene 16, 8 por recurso, ids únicos, ningún texto contiene "Liebert", "Sage", "Research Methods" ni "asistente de investigación".
  - `CARTAS_LIEBERT.length >= 30`, `CARTAS_ASISTENTE.length >= 10`, ids únicos.
  - `PREGUNTAS.length === 5`.
  - `ASISTENTES_EJEMPLO.length === 18`.
  - Ningún string exportado por `js/contenido/*` contiene "·".
- [ ] **Step 3:** `node --test tests/` -> FAIL (módulos no existen).
- [ ] **Step 4:** Crear los módulos de contenido y `config.js`. Copiar `logo_paths.txt` y `fil_logo.png` de `/home/claude/banner/` a `assets/`. `css/sage.css` con variables de color del Global Constraints, Open Sans, botones grandes (mínimo 48 px de alto), carta base.
- [ ] **Step 5:** `node --test tests/` -> PASS.
- [ ] **Step 6:** `git init` y commit `feat: contenido y configuración`.

### Task 2: Lógica del juego (funciones puras)

**Files:**
- Create: `js/logica/estado.js`, `js/logica/reparto.js`
- Test: `tests/estado.test.js`, `tests/reparto.test.js`

**Interfaces:**
- Consumes: contenido de Task 1.
- Produces (todas puras; reciben `rng` opcional `() => number` para tests deterministas; lanzan `ErrorJuego(codigo, mensaje)` en errores):
  - `estadoInicial(asistentes) -> Estado` donde
    `Estado = { fase, destacado:null|grupoId, asistentes:{[id]:{...datos, ingreso:null|ISO, situacion:null|id, grupo:null|grupoId, mano:[cartaId], cambios:0}}, palabras:{[asistenteId]:texto}, grupos:{[grupoId]:{codigo, necesidad:"", situacion:null|id, miembros:[asistenteId]}}, jugadas:[{id, grupo, carta, asistente, clave:false}], encuesta:{[asistenteId]:{p1..p5, contacto:boolean}} }`
  - `ACCIONES`: objeto `{ nombre: (estado, ...args) -> estado }` con:
    `ingresar(e, asistenteId, ahoraISO, rng)`, `guardarPalabra(e, id, texto)`, `borrarPalabra(e, id)`, `crearGrupo(e, id, rng)`, `unirseGrupo(e, id, codigo)`, `salirGrupo(e, id)`, `guardarNecesidad(e, grupoId, texto, situacionId)`, `borrarNecesidad(e, grupoId)`, `jugarCarta(e, id, cartaId, jugadaId)`, `retirarCarta(e, jugadaId)`, `marcarClave(e, jugadaId)`, `cambiarCarta(e, id, cartaId, rng)`, `guardarEncuesta(e, id, respuestas)`, `cambiarFase(e, fase, rng)`, `destacar(e, grupoId)`, `reiniciarAsistente(e, id)`
  - `asignarSituacion(estado, rng) -> situacionId` (en reparto.js)
  - `repartirMano(estado, rng) -> cartaId[]` (3 Liebert + 2 asistente, minimizando cartas ya en manos de otros)
  - `cartaDeReemplazo(estado, mano, tipo, rng) -> cartaId`
- Reglas que no se deducen solas:
  - `ingresar` es idempotente (no cambia `ingreso` ni situación si ya existe) y asigna situación si la fase es `ronda1` o posterior; si la fase es `ronda2` o posterior y la mano está vacía, reparte mano.
  - `cambiarFase(e,"ronda1")` asigna situación a todo ingresado sin una; `cambiarFase(e,"ronda2")` reparte mano a todo ingresado sin mano.
  - Códigos de grupo: 3 letras mayúsculas sin I, O ni Q (evitan confusiones), únicos.
  - `unirseGrupo` normaliza `codigo.trim().toUpperCase()`; si ya estaba en otro grupo, sale de ese (y un grupo vacío se elimina junto con sus jugadas).
  - `jugarCarta` exige grupo y que la carta esté en la mano; la carta sale de la mano. `retirarCarta` la devuelve a la mano de quien la jugó.
  - `guardarPalabra`: recorta espacios, máximo 30 caracteres, vacío lanza error.
  - `guardarNecesidad`: máximo 200 caracteres (recorta), editable mientras `fase` sea `ronda1` o `ronda2`.
  - `cambiarCarta` falla si `cambios >= 2`; reemplaza por una carta del mismo tipo que no tenga en la mano.

- [ ] **Step 1: Escribir tests** (`rng` sembrado con un LCG simple en el test):
  - `asignarSituacion nunca asigna una situación más de 2 veces` (32 asistentes -> todas exactamente 2).
  - `repartirMano da 3 liebert y 2 asistente sin repetir en la mano`.
  - `18 manos usan al menos 30 cartas Liebert distintas`.
  - `ingresar dos veces es idempotente`.
  - `ingresar en ronda2 reparte mano`.
  - `cambiarFase ronda1 asigna situación a todos los ingresados`.
  - `crearGrupo genera código de 3 letras sin I/O/Q y único entre 50 grupos`.
  - `unirseGrupo normaliza y rechaza` (" abc " encuentra "ABC"; "ZZZ" lanza `ErrorJuego` con codigo `"grupo-no-existe"`).
  - `cambiar de grupo deja el anterior y elimina grupos vacíos`.
  - `jugarCarta sin grupo falla` (codigo `"sin-grupo"`).
  - `jugar y retirar devuelve la carta a la mano`.
  - `cambiarCarta permite 2 y falla al tercero` (codigo `"sin-cambios"`).
  - `guardarNecesidad recorta a 200 caracteres`.
  - `guardarPalabra rechaza vacío y recorta a 30`.
  - `las acciones no mutan el estado recibido` (deep-freeze del estado de entrada).
- [ ] **Step 2:** `node --test tests/` -> FAIL.
- [ ] **Step 3:** Implementar `estado.js` y `reparto.js`.
- [ ] **Step 4:** `node --test tests/` -> PASS.
- [ ] **Step 5:** Commit `feat: reglas del juego`.

### Task 3: Store demo

**Files:**
- Create: `js/datos/store-demo.js`, `js/datos/crear-store.js`
- Test: `tests/store-demo.test.js`

**Interfaces:**
- Consumes: `estadoInicial`, `ACCIONES` (Task 2).
- Produces (misma forma para ambos adaptadores):
  - `crearStore(config, asistentes) -> Promise<Store>`
  - `Store = { subscribe(cb: (estado) => void) -> unsubscribe, dispatch(nombre, ...args) -> Promise<void> (rechaza con ErrorJuego), getEstado() -> Estado, reset() -> Promise<void> }`
  - Identidad local del celular: `miId()` / `setMiId(id)` guardados en `localStorage["lab-mi-id"]` (exportados desde `crear-store.js`).
- Demo: guarda el estado en `localStorage["lab-estado"]`, avisa por `BroadcastChannel("lab")`; los argumentos aleatorios (`rng`, `ahoraISO`, `jugadaId`) los pone el store, no la vista.

- [ ] **Step 1: Tests** con `localStorage` y `BroadcastChannel` simulados (Node 22 trae `BroadcastChannel`; `localStorage` como Map):
  - `dispatch notifica a los suscriptores`.
  - `dos stores en el mismo canal ven el mismo estado tras dispatch` (esperar el mensaje).
  - `demo: identidad persiste tras recarga` (crear store, setMiId, ingresar, crear store nuevo sobre el mismo localStorage -> mismo estado y `miId()`).
  - `dispatch de acción inválida rechaza y no cambia el estado`.
- [ ] **Step 2:** `node --test tests/` -> FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `node --test tests/` -> PASS.
- [ ] **Step 5:** Commit `feat: store demo`.

### Task 4: Exportación a Excel

**Files:**
- Create: `js/exportar.js`, `vendor/xlsx.full.min.js` (desde `npm pack xlsx`, archivo `dist/xlsx.full.min.js`)
- Test: `tests/exportar.test.js`

**Interfaces:**
- Produces: `filasExport(estado) -> {Asistentes:Row[], Palabras:Row[], Grupos:Row[], CartasJugadas:Row[], Encuesta:Row[]}` (pura) y `descargarExcel(estado)` (navegador: usa `window.XLSX`, archivo `LAB_Sage_2026_resultados.xlsx`).
- Columnas en español: Asistentes(Nombre, Institución, Correo, País, Ingresó, Situación); Palabras(Nombre, Palabra); Grupos(Código, Integrantes, Situación de origen, Necesidad); CartasJugadas(Código grupo, Carta, Tipo, Jugada por, Clave); Encuesta(Nombre, Institución, P1..P5 con el texto de la pregunta como encabezado, Quiere contacto).

- [ ] **Step 1: Test** `filasExport` con un estado armado vía `ACCIONES`: cuenta de filas por hoja, encabezados exactos, "Clave" como "Sí"/"No", integrantes separados por ", ".
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: exportación a Excel`.

### Task 5: Vista cliente (celular)

**Files:**
- Create: `js/app.js`, `js/vistas/ui.js`, `js/vistas/cliente.js`
- Test: `tests/visual/capturas.py` (Playwright, viewport 390x844)

**Interfaces:**
- Consumes: `Store`, `miId/setMiId`, contenido, `urlCarta`.
- Produces: `montarCliente(raiz: HTMLElement, store: Store)`; `ui.js` exporta `h(tag, attrs, ...hijos)`, `vistaCarta(carta, {onTocar})`, `logoSage()`, `logoFil()`.
- Pantallas por fase (y por si tiene identidad): ingreso (buscador por nombre o institución, sin tildes ni mayúsculas importando) -> confirmación "¿Eres tú?" -> `llegada`: palabra -> `apertura`: espera -> `ronda1`: carta de situación + crear/unirse grupo + necesidad -> `ronda2`/`cuentanos`: mano (tocar carta = detalle con "Jugar en mi grupo" y "Pruébalo"), cartas del grupo, cambiar carta (muestra cambios restantes), sin grupo -> botón "Crear mi grupo" -> `cierre`: encuesta -> `gracias`: resumen de cartas jugadas con sus enlaces.
- Errores de `dispatch` se muestran en una franja bajo el campo, nunca con `alert()`.

- [ ] **Step 1:** Escribir `capturas.py` que sirve la carpeta con `python3 -m http.server`, abre `#facilitador` en una pestaña para avanzar fases (vía `store.dispatch` expuesto en `window.__lab` solo en modo demo) y captura el cliente en cada fase en `tests/visual/out/cliente-<fase>.png`. Debe fallar si hay errores en consola.
- [ ] **Step 2:** Correr -> falla (vista no existe).
- [ ] **Step 3:** Implementar `app.js` (lee hash, crea store, monta vista; expone `window.__lab = {store}` si `config.modo==="demo"`), `ui.js`, `cliente.js`. Usar `anthropic-skills:frontend-design` para la dirección visual.
- [ ] **Step 4:** Correr capturas; revisar cada PNG: textos completos, sin "·", botones visibles sin scroll horizontal, caso "sin grupo en ronda2".
- [ ] **Step 5:** Commit `feat: vista cliente`.

### Task 6: Vista proyector

**Files:**
- Create: `js/vistas/proyector.js`
- Modify: `tests/visual/capturas.py` (viewport 1920x1080)

**Interfaces:**
- Produces: `montarProyector(raiz, store)`.
- Por fase: `llegada` nube de palabras (tamaño según repetición, máx. 80 palabras visibles) + QR grande a la URL del cliente (generar QR en el navegador con una librería vendorizada `vendor/qrcode.min.js`) + "Citación 4:30 p. m." no se muestra (no hace falta en sala); `apertura` lámina con Sage LAB, Cartas sobre la mesa, logo FIL; `ronda1` muro de necesidades; `ronda2` cuadrícula de tableros (auto-ajuste de columnas y tamaño de letra por cantidad de grupos); `cuentanos` grupo destacado en grande (o la cuadrícula si no hay destacado); `cierre` cantidad de respuestas y promedios de P4 y P5; `gracias` nube final.
- Las cartas nuevas entran con animación corta (≤300 ms).

- [ ] **Step 1:** Añadir a capturas un escenario extremo: 18 grupos de 1 persona con necesidades de 200 caracteres y 5 cartas cada uno; y uno normal de 6 grupos.
- [ ] **Step 2:** Correr -> falla.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Revisar capturas: nada se corta ni se desborda en el escenario extremo; legible a 1920x1080.
- [ ] **Step 5:** Commit `feat: vista proyector`.

### Task 7: Panel de facilitador y barra demo

**Files:**
- Create: `js/vistas/facilitador.js`, `js/vistas/barra-demo.js`
- Modify: `tests/visual/capturas.py`

**Interfaces:**
- Produces: `montarFacilitador(raiz, store)`, `montarBarraDemo(raiz, store)`.
- Facilitador (celular): PIN -> fase actual con botones Anterior/Siguiente (confirmación al avanzar), contador de ingresados/total, lista de asistentes con estado (ingresó, grupo) y botón "Reiniciar celular" (acción `reiniciarAsistente`), lista de palabras y necesidades con "Borrar", selector "Destacar grupo" en `cuentanos`, botón "Exportar Excel", botón "Reiniciar sesión" (doble confirmación).
- Barra demo (solo `modo==="demo"`): fija arriba; selector de vista (Cliente, Proyector, Facilitador) y "Ver como:" con la lista de asistentes para cambiar `miId` en esta pestaña; botón "Simular sala" que hace ingresar 12 asistentes, forma 4 grupos con necesidades y juega cartas.

- [ ] **Step 1:** Capturas del facilitador en cada fase y de la barra demo.
- [ ] **Step 2:** Correr -> falla.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Recorrido completo en Playwright: dos pestañas (proyector y cliente) + facilitador avanzando todas las fases; el proyector refleja cada acción del cliente en menos de 1 s; exportar descarga un .xlsx que abre con 5 hojas (verificar con `python3 -c "import openpyxl"`).
- [ ] **Step 5:** Commit `feat: facilitador y barra demo`.

### Task 8: Adaptador Supabase y esquema

**Files:**
- Create: `supabase/schema.sql`, `js/datos/store-supabase.js`, `vendor/supabase.js` (UMD de `@supabase/supabase-js`)
- Modify: `js/datos/crear-store.js`, `README.md`
- Test: `tests/store-supabase.test.js`

**Interfaces:**
- Consumes: `ACCIONES`, contrato `Store` de Task 3.
- Diseño: una tabla `sesion (id text primary key, estado jsonb, version int, actualizado timestamptz)` con una fila `'lab-2026'`. `dispatch` lee la fila, aplica la acción pura, y escribe con `update ... where version = v_leida` (control optimista); si 0 filas, relee y reintenta hasta 5 veces. `subscribe` usa Realtime `postgres_changes` sobre esa fila. Esto mantiene una sola fuente de reglas (las mismas acciones puras) y basta para 21 dispositivos.
- `schema.sql`: tabla, fila inicial con `estadoInicial` vacío (los asistentes se cargan desde el panel), RLS que permite `select` y `update` a `anon` solo sobre esa fila, publicación Realtime.

- [ ] **Step 1: Tests** con un cliente Supabase falso (objeto con `from().select/update`, `channel().on().subscribe()`):
  - `dispatch aplica la acción y escribe version+1`.
  - `conflicto de versión reintenta y conserva ambos cambios` (dos dispatch concurrentes de `guardarPalabra` de personas distintas -> ambas palabras quedan).
  - `tras 5 conflictos rechaza con ErrorJuego "conflicto"`.
  - `cambio Realtime notifica a suscriptores`.
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** PASS.
- [ ] **Step 5:** README: cómo crear el proyecto Supabase, correr `schema.sql`, poner URL y clave en `config.js`, cambiar `modo` y publicar en GitHub Pages.
- [ ] **Step 6:** Commit `feat: adaptador supabase`.

### Task 9: Publicar la versión de revisión

**Files:**
- Modify: ninguno de código.

- [ ] **Step 1:** `node --test tests/` -> todo PASS; capturas sin errores de consola.
- [ ] **Step 2:** Publicar la carpeta como artifact (publish_files, `index.html` + `css/`, `js/`, `assets/`, `vendor/`), modo demo.
- [ ] **Step 3:** Abrir el artifact publicado en Playwright (o revisar que todos los recursos cargan con rutas relativas) y probar el recorrido corto: ingresar, palabra, avanzar a ronda1.
- [ ] **Step 4:** Enviar a Felipe el enlace y un zip del proyecto para GitHub.
