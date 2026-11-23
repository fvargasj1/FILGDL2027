"""Recorrido completo en modo demo con capturas. Uso: python3 tests/visual/capturas.py
Falla (exit 1) si hay errores de consola o si alguna comprobación no se cumple."""
import subprocess, sys, time, os, pathlib, openpyxl
from playwright.sync_api import sync_playwright

RAIZ = pathlib.Path(__file__).resolve().parents[2]
OUT = RAIZ / 'tests/visual/out'; OUT.mkdir(parents=True, exist_ok=True)
PUERTO = 8765
URL = f'http://localhost:{PUERTO}/index.html'
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PUERTO)], cwd=RAIZ, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)
errores, fallas = [], []
def chequear(cond, msg):
    if not cond: fallas.append(msg); print('FALLA:', msg)

def d(page, n, a):  # dispatch desde la página
    return page.evaluate('([n,a]) => window.__lab.store.dispatch(n,a).then(()=>null, e=>e.codigo)', [n, a])
def fase(page, f): d(page, 'cambiarFase', {'fase': f})
def esperar(page): page.wait_for_function('() => window.__lab'); page.wait_for_timeout(250)

try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(accept_downloads=True)
        def nueva(url, w, hgt):
            pg = ctx.new_page(); pg.set_viewport_size({'width': w, 'height': hgt})
            pg.on('console', lambda m: m.type == 'error' and errores.append(m.text))
            pg.on('pageerror', lambda e: errores.append(str(e)))
            pg.goto(url); esperar(pg); return pg
        proy = nueva(URL + '#proyector', 1920, 1130)
        proy.evaluate('() => window.__lab.store.reset()')
        cli = nueva(URL, 390, 844)
        cli.screenshot(path=OUT / 'cliente-ingreso.png', full_page=True)
        # ingreso por la interfaz
        cli.fill('[data-k=buscar]', 'ana maria')
        cli.click('.persona'); cli.click('text=Sí, soy yo'); cli.wait_for_timeout(300)
        cli.fill('[data-k=palabra]', 'Confianza'); cli.click('text=Enviar mi palabra')
        proy.wait_for_selector('.nube >> text=Confianza', timeout=1000)  # sincronía < 1 s
        cli.screenshot(path=OUT / 'cliente-llegada.png', full_page=True)
        cli.click('#demo >> text=Simular sala'); cli.wait_for_timeout(1500)
        proy.screenshot(path=OUT / 'proyector-llegada.png')
        chequear(proy.locator('.qr svg').count() == 1, 'QR visible en llegada')
        fase(proy, 'apertura'); cli.wait_for_timeout(250)
        cli.screenshot(path=OUT / 'cliente-apertura.png'); proy.screenshot(path=OUT / 'proyector-apertura.png')
        # un QR escaneado antes de identificarse: se guarda y se abre después del ingreso
        cli4 = nueva(URL + '?c=a5', 390, 844)
        chequear('?c=' not in cli4.url, 'la dirección se limpia tras leer el código')
        cli4.screenshot(path=OUT / 'cliente-qr-antes-de-ingresar.png', full_page=True)
        chequear(cli4.locator('text=Leímos tu carta').count() == 1, 'avisa que leyó la carta antes del ingreso')
        cli4.fill('[data-k=buscar]', 'lucia'); cli4.click('.persona'); cli4.click('text=Sí, soy yo'); cli4.wait_for_timeout(400)
        chequear(cli4.locator('.detalle >> text=Afina tu pregunta').count() == 1, 'tras ingresar abre la carta escaneada')
        cli4.screenshot(path=OUT / 'cliente-carta-fuera-de-ronda.png')
        fase(proy, 'ronda1'); cli.wait_for_timeout(250)
        cli.screenshot(path=OUT / 'cliente-ronda1-sinequipo.png', full_page=True)
        # escanear el reto: misma pestaña, como abre el celular al leer el QR o el NFC
        cli.goto(URL + '?c=R01'); esperar(cli); cli.wait_for_timeout(400)
        chequear(cli.locator('.detalle >> text=estás en el equipo Campus').count() == 1, 'escanear reto une al equipo Campus')
        cli.screenshot(path=OUT / 'cliente-reto-escaneado.png')
        cli.click('.detalle >> text=Cerrar')
        cli.click('.opciones >> text=A veces'); cli.fill('[data-k=comentario]', 'En medicina sí, en enfermería menos.')
        cli.click('text=Guardar mi respuesta')
        proy.wait_for_timeout(300)
        cli.screenshot(path=OUT / 'cliente-ronda1.png', full_page=True)
        cli.click('#demo >> text=Simular sala'); cli.wait_for_timeout(1500)
        t0 = time.time()
        try: proy.wait_for_function("() => (window.__lab.store.getEstado().equipos.R08?.miembros.length ?? 0) === 3", timeout=20000); hay4 = True
        except Exception: hay4 = False
        proy.wait_for_timeout(500); proy.screenshot(path=OUT / 'proyector-ronda1.png')
        chequear(hay4, 'proyector muestra 4 equipos (Campus compartido)')
        # código escrito a mano y código inválido
        cli.click('text=¿No es tu mesa?'); cli.fill('[data-k=cod-manual]', 'zz9'); cli.click('text=Abrir'); cli.wait_for_timeout(200)
        chequear(cli.locator('.detalle >> text=No reconocemos ese código').count() == 1, 'código inválido avisa')
        cli.click('.detalle >> text=Cerrar')
        fase(proy, 'ronda2'); cli.wait_for_timeout(300)
        cli.screenshot(path=OUT / 'cliente-ronda2.png', full_page=True)
        cli.goto(URL + '?c=L23'); esperar(cli); cli.wait_for_timeout(400)
        cli.screenshot(path=OUT / 'cliente-carta-escaneada.png')
        chequear(cli.locator('.detalle a[href^="https://"]').count() == 1, 'botón Pruébalo con enlace')
        cli.click('text=Jugarla en el reto de Campus'); cli.wait_for_timeout(300)
        chequear(cli.locator('.detalle >> text=Jugada sobre el reto').count() == 1, 'confirmación al jugar')
        cli.click('.detalle >> text=Cerrar')
        for c in ['A02', 'A05', 'L19', 'A10', 'A16']: d(cli, 'jugarCarta', {'asistente': 'p01', 'carta': c})
        cli.goto(URL + '?c=L01'); esperar(cli); cli.wait_for_timeout(300); cli.click('text=Jugarla en el reto de Campus'); cli.wait_for_timeout(300)
        chequear(cli.locator('.detalle >> text=ya tiene 6 cartas').count() == 1, 'la séptima carta se rechaza con mensaje')
        cli.screenshot(path=OUT / 'cliente-mesa-llena.png')
        cli.click('.detalle >> text=Cerrar')
        cli.click('.tablero [aria-label="Marcar como carta clave"] >> nth=0'); cli.wait_for_timeout(200)
        cli.click('#demo >> text=Simular sala'); cli.wait_for_timeout(1500)
        cli.screenshot(path=OUT / 'cliente-ronda2-tablero.png', full_page=True)
        proy.screenshot(path=OUT / 'proyector-ronda2.png')
        # sin equipo en ronda 2
        cli3 = nueva(URL, 390, 844); cli3.evaluate("() => { window.__lab.yo.set('p18',0) }"); cli3.reload(); esperar(cli3)
        cli3.screenshot(path=OUT / 'cliente-ronda2-sinequipo.png', full_page=True)
        chequear(cli3.locator('text=Escanea la carta grande del reto').count() == 1, 'sin equipo en ronda2 pide escanear el reto')
        # recarga conserva identidad y equipo
        cli.reload(); esperar(cli)
        chequear(cli.locator('.tablero .jugada').count() == 6, 'recarga conserva el tablero')
        fase(proy, 'cuentanos'); d(proy, 'destacar', {'equipo': 'R01'}); proy.wait_for_timeout(200)
        cli.fill('[data-k=motivo]', 'Porque conecta la biblioteca con la salud digital que ya enseñan.'); cli.click('#app >> text=Guardar'); proy.wait_for_timeout(300)
        proy.screenshot(path=OUT / 'proyector-cuentanos.png')
        fase(proy, 'cierre'); cli.wait_for_timeout(250)
        cli.screenshot(path=OUT / 'cliente-cierre.png', full_page=True)
        cli.fill('[data-k=q-p1]', 'Aliada'); cli.click('.escala >> nth=0 >> text=5'); cli.click('text=Enviar respuestas'); cli.wait_for_timeout(200)
        cli.click('#demo >> text=Simular sala'); cli.wait_for_timeout(1500)
        proy.screenshot(path=OUT / 'proyector-cierre.png')
        fase(proy, 'gracias'); cli.wait_for_timeout(250)
        cli.screenshot(path=OUT / 'cliente-gracias.png', full_page=True); proy.screenshot(path=OUT / 'proyector-gracias.png')
        # facilitador
        fac = nueva(URL + '#facilitador', 390, 844)
        fac.screenshot(path=OUT / 'facilitador-pin.png')
        fac.fill('[data-k=pin]', '2026'); fac.click('text=Entrar'); fac.wait_for_timeout(200)
        fac.screenshot(path=OUT / 'facilitador.png', full_page=True)
        with fac.expect_download() as dl: fac.click('text=Descargar Excel')
        ruta = OUT / 'export.xlsx'; dl.value.save_as(ruta)
        hojas = openpyxl.load_workbook(ruta).sheetnames
        chequear(hojas == ['Asistentes', 'Palabras', 'Equipos', 'Retos por persona', 'Cartas jugadas', 'Encuesta'], f'excel con 6 hojas: {hojas}')
        fac.click('text=Volver a Cierre'); fac.click('text=Confirmar'); fac.wait_for_timeout(200)
        chequear(proy.evaluate("() => window.__lab.store.getEstado().fase") == 'cierre', 'facilitador cambia fase')
        # escenario extremo en el proyector
        proy.evaluate('() => window.__lab.store.reset()')
        ids = proy.evaluate('() => Object.keys(window.__lab.store.getEstado().asistentes)')
        fase(proy, 'ronda1')
        retos = [f'R{n:02d}' for n in range(1, 11)]
        for k, i in enumerate(ids):
            d(proy, 'ingresar', {'asistente': i}); d(proy, 'unirseReto', {'asistente': i, 'reto': retos[k % 10]})
            d(proy, 'responderReto', {'asistente': i, 'pasa': ['si', 'aveces', 'no'][k % 3], 'comentario': ''})
        proy.wait_for_timeout(300); proy.screenshot(path=OUT / 'proyector-extremo-ronda1.png')
        fase(proy, 'ronda2')
        largos = ['L02', 'L05', 'L06', 'L11', 'L17', 'L30', 'A18', 'A10', 'A15']
        for k, i in enumerate(ids):
            for c in largos[(k % 3) * 3:(k % 3) * 3 + 3]: d(proy, 'jugarCarta', {'asistente': i, 'carta': c})
        proy.wait_for_timeout(300); proy.screenshot(path=OUT / 'proyector-extremo-ronda2.png')
        desborde = proy.evaluate("() => { const z = document.querySelector('.muro'); return z.scrollHeight > z.clientHeight + 2 || [...z.children].some(c => c.scrollHeight > c.clientHeight + 2) }")
        chequear(not desborde, 'proyector extremo sin desborde vertical')
        b.close()
finally:
    srv.terminate()

errores = [e for e in errores if 'favicon' not in e and 'ERR_TUNNEL_CONNECTION_FAILED' not in e]  # la CDN no es accesible en este entorno; se prueba el respaldo local
for e in errores: print('CONSOLA:', e)
print('capturas en', OUT)
sys.exit(1 if (errores or fallas) else 0)
