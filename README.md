# Sage LAB 2026 - Cartas sobre la mesa

Plataforma y material impreso de la sesión del LAB (Library Advisory Board), FIL Guadalajara, martes 1 de diciembre de 2026.

Es un juego analógico y digital: las cartas y los retos están impresos, y cada uno trae un **QR** y un **tag NFC** que llevan a la misma dirección. Al escanear o acercar el celular, la plataforma reconoce la carta y la juega en el equipo de la persona.

| Vista | Dirección | Para quién |
|---|---|---|
| Celular | `https://fvargasj1.github.io/FILGDL2027/` | Cada cliente (QR o NFC del afiche de entrada) |
| Proyector | `.../FILGDL2027/#proyector` | La pantalla del salón |
| Facilitador | `.../FILGDL2027/#facilitador` | El equipo de Sage (PIN en `js/config.js`) |

No necesita instalación ni compilación: son archivos estáticos.

---

## 1. Lo que no se puede cambiar después de imprimir

Cada pieza impresa lleva una dirección fija:

```
https://fvargasj1.github.io/FILGDL2027/?c=CÓDIGO
```

- `CÓDIGO` es `R01` a `R10` (retos), `L01` a `L30` (revistas Liebert) y `A01` a `A18` (asistente de investigación). El afiche de entrada usa la dirección sin `?c=`.
- La lista completa está en `imprenta/salida/listado_QR_NFC.xlsx` (y `.csv`): es la que usas para grabar los NFC.
- **Nunca** cambies `urlPublica` en `js/config.js`, el nombre del repositorio ni los códigos en `js/contenido/cartas.js` después de imprimir.
- **Sí** puedes cambiar después de imprimir: textos que se ven en el celular, a dónde lleva "Pruébalo" (`metodosUrl`, `liebertBaseUrl` o el `url` de cada carta), nombres de equipo en pantalla, lista de asistentes, encuesta y PIN. La plataforma decide qué mostrar para cada código.
- Si algún día se usa un dominio propio en GitHub Pages, GitHub redirige `fvargasj1.github.io/FILGDL2027/...` al dominio nuevo conservando el `?c=`, así que los impresos siguen funcionando.

## 2. Publicar en GitHub Pages

1. En GitHub, abre el repositorio `fvargasj1/FILGDL2027` (si no existe, créalo con ese nombre exacto, público).
2. Sube **todo el contenido de esta carpeta** a la raíz del repositorio, de modo que `index.html` quede en la raíz:
   - Opción web: *Add file > Upload files*, arrastra todos los archivos y carpetas, *Commit changes*.
   - Opción terminal:
     ```
     git remote add origin https://github.com/fvargasj1/FILGDL2027.git
     git branch -M main
     git push -u origin main
     ```
3. *Settings > Pages > Build and deployment*: Source `Deploy from a branch`, rama `main`, carpeta `/ (root)`, *Save*.
4. En 1 o 2 minutos queda en `https://fvargasj1.github.io/FILGDL2027/`. Abre `https://fvargasj1.github.io/FILGDL2027/?c=L01` y verifica que abra la carta Thyroid.

Mientras `modo` sea `'demo'`, la página publicada funciona solo dentro de cada navegador (sirve para revisar). Para el evento hay que pasar a Supabase.

## 3. Pasar a Supabase (obligatorio para el evento)

1. Crea un proyecto en [supabase.com](https://supabase.com) (plan gratuito basta). Región sugerida: la más cercana a México.
2. *SQL Editor > New query*: pega el contenido de `supabase/schema.sql` y pulsa *Run*.
3. *Project Settings > API*: copia la *Project URL* y la clave *anon public*.
4. En `js/config.js` cambia:
   ```js
   modo: 'supabase',
   supabaseUrl: 'https://xxxx.supabase.co',
   supabaseAnonKey: 'eyJ...',
   pinFacilitador: 'un PIN nuevo',
   ```
5. Sube el cambio a GitHub (paso 2). Abre el facilitador, entra con el PIN y verifica que aparezca la lista de asistentes.
6. Prueba con 3 o 4 celulares reales, idealmente en la red del hotel: un iPhone y un Android, por QR y por NFC.
7. Antes de empezar el evento: en el facilitador, *Reiniciar toda la sesión* para borrar las pruebas.

La clave *anon* es pública por diseño: las reglas de `schema.sql` solo permiten leer y actualizar la fila del evento. Cualquiera con el enlace podría modificar la sesión, así que cambia el PIN y comparte el enlace solo en el salón.

## 4. Grabar los tags NFC

- Tags recomendados: NTAG213 o NTAG215, adhesivos circulares de 25 mm. Se necesitan **108** (96 cartas + 10 retos + 2 afiches); compra unos 10 de repuesto.
- App gratuita: **NFC Tools** (iPhone y Android). *Escribir > Agregar un registro > URL / URI*, pega la URL de la columna "URL (QR y NFC)" del listado y acerca el tag.
- Cada carta tiene 2 copias: graba 2 tags con la misma URL.
- Pega cada tag sobre el círculo punteado "NFC" del frente de su pieza. Revisa el código impreso (por ejemplo L05) antes de pegar.
- Prueba cada tag con un celular: debe abrir la carta correcta. Cuando todo esté probado puedes **bloquear** los tags (NFC Tools > Otro > Bloquear etiqueta) para que nadie los reescriba. Bloquear es irreversible.
- iPhone lee NFC sin abrir nada (desde iPhone XS); en Android el NFC debe estar activado en ajustes. Quien no tenga NFC usa el QR, y si nada funciona puede escribir el código a mano en la plataforma.

## 5. Antes del evento

1. **Lista de asistentes:** reemplaza los 18 nombres de ejemplo en `js/contenido/asistentes-ejemplo.js` (id, nombre, institución, correo, país).
2. **Contenido:** todo está en `js/contenido/cartas.js` (retos, revistas, movimientos del asistente). Si cambias un texto **antes** de imprimir, vuelve a generar los impresos (sección 7).
3. **Enlaces "Pruébalo":** `metodosUrl` y `liebertBaseUrl` en `js/config.js`. Cuando exista la página propia de Liebert, cambia solo `liebertBaseUrl`.

## 6. Guía de sala

| Fase | Qué pasa | Material |
|---|---|---|
| Llegada | Cada persona escanea el afiche de entrada, busca su nombre y escribe una palabra para Sage | 2 afiches de entrada |
| Apertura | Sage habla; los celulares esperan | |
| Ronda 1: retos | Un reto impreso en cada mesa. Cada persona lo escanea y queda en el equipo de ese reto (Campus, Skills, Methods...). Responde si le pasa en su institución y conversan | 10 retos, uno por mesa (con 15 a 18 personas se usan 5 o 6) |
| Ronda 2: cartas | Repartan a cada persona **5 cartas en papel: 3 Liebert y 2 del asistente**. Escanean las que mejor resuelven su reto, hasta 6 por equipo, y marcan una carta clave | 60 cartas Liebert y 36 del asistente |
| Cuéntanos | Cada equipo explica su carta clave; el facilitador elige qué equipo se ve en grande | |
| Cierre y gracias | Encuesta corta y despedida. Las personas pueden llevarse sus cartas: siempre llevan a su recurso | |

El facilitador avanza las fases a mano desde su celular. Si alguien queda bloqueado, *Reiniciar celular* lo devuelve a la lista de nombres.

## 7. Material de imprenta

```
python3 imprenta/generar.py
```

Genera en `imprenta/salida/` los PDF listos para imprenta, el listado de QR y NFC y las instrucciones para la imprenta. Lee los textos de `js/contenido/cartas.js` y la dirección de `js/config.js`, y **falla** si algún texto no cabe o si algún QR no se lee con su URL exacta.

Requiere Node, Python 3, `pip install playwright segno pypdf openpyxl opencv-python` y `playwright install chromium`, más `pdftoppm` (poppler).

## 8. Desarrollo

- Pruebas de reglas y datos: `node --test tests/*.test.js`
- Recorrido completo con capturas: `python3 tests/visual/capturas.py` (requiere Playwright)
- Modo demo (`modo: 'demo'`): todo vive en el navegador; varias pestañas se sincronizan. La barra naranja permite cambiar de vista, de persona, **simular un escaneo** de cualquier carta y simular una sala.
- Para probar un QR sin imprimir: abre `index.html?c=L05` en el navegador.

## Estructura

- `js/contenido/cartas.js`: fuente única de retos, cartas y códigos (plataforma e impresos).
- `js/escaneo.js`: lee el `?c=` que traen el QR y el NFC, incluso antes de que la persona se identifique.
- `js/logica/`: reglas del juego (funciones puras, probadas).
- `js/datos/`: guardado de la sesión, modo demo o Supabase, con la misma interfaz.
- `js/vistas/`: celular, proyector, facilitador.
- `imprenta/`: generador de PDF, recursos gráficos y salida.
- `docs/`: diseño y plan.
