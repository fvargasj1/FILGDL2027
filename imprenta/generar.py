"""Genera todo el material de imprenta desde el contenido de la plataforma (js/contenido/cartas.js).

Uso (desde la carpeta del proyecto):  python3 imprenta/generar.py
Requiere: node, python3 con playwright (chromium), segno, pypdf, openpyxl, opencv-python, pdftoppm.
Sale en imprenta/salida/. Falla si algún texto no cabe o si algún QR no se lee con su URL exacta."""
import json, subprocess, sys, pathlib, csv, tempfile
import piezas as P
from pypdf import PdfReader, PdfWriter
from pypdf.generic import RectangleObject

RAIZ = pathlib.Path(__file__).resolve().parent
OUT = RAIZ / 'salida'; OUT.mkdir(exist_ok=True)
COPIAS_CARTA, COPIAS_RETO, COPIAS_ENTRADA = 2, 1, 2
MM = 72 / 25.4
datos = json.loads(subprocess.check_output(['node', str(RAIZ / 'datos.mjs')], cwd=RAIZ.parent))
fallas = []

def doc(cuerpo, css, ancho, alto):
    return (f'<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><style>@page{{size:{ancho}mm {alto}mm;margin:0}}'
            f'{P.CSS_BASE}{css}</style></head><body>{cuerpo}</body></html>')

# Revisa que nada se desborde: bloques de texto y títulos dentro de su caja.
REVISAR = """() => {
  const malos = [];
  document.querySelectorAll('.pieza').forEach((p, i) => {
    p.querySelectorAll('.cuerpo, .juego .txt, .escanea .t, .titulo').forEach(el => {
      if (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 3) malos.push(`página ${i + 1}: ${el.className || el.tagName} (${el.textContent.trim().slice(0, 40)})`);
    });
    const cab = p.querySelector('.cabeza'), h1 = p.querySelector('.cabeza h1');
    if (cab && h1 && h1.getBoundingClientRect().bottom > cab.getBoundingClientRect().bottom - 2) malos.push(`página ${i + 1}: título se sale de la cabeza`);
    const pr = p.getBoundingClientRect();
    p.querySelectorAll('h1, .texto').forEach(el => { const r = el.getBoundingClientRect(); if (r.right > pr.right - 20) malos.push(`página ${i + 1}: texto pegado al borde derecho`); });
    const txt = p.querySelector('.texto'), esc = p.querySelector('.escanea');
    if (txt && esc && txt.getBoundingClientRect().bottom > esc.getBoundingClientRect().top - 8) malos.push(`página ${i + 1}: texto del reto choca con el QR`);
  });
  return malos;
}"""

def pdf(nombre, html, ancho, alto, navegador, cajas=True):
    ruta = OUT / nombre
    with tempfile.NamedTemporaryFile('w', suffix='.html', dir=RAIZ, delete=False) as f:
        f.write(html); tmp = pathlib.Path(f.name)
    try:
        pg = navegador.new_page()
        pg.goto(tmp.as_uri()); pg.wait_for_load_state('networkidle'); pg.evaluate('document.fonts.ready')
        for m in pg.evaluate(REVISAR): fallas.append(f'{nombre}: {m}')
        pg.pdf(path=str(ruta), width=f'{ancho}mm', height=f'{alto}mm', print_background=True, prefer_css_page_size=True)
        pg.close()
    finally:
        tmp.unlink()
    if cajas: marcar_cajas(ruta)
    return ruta

def marcar_cajas(ruta):
    """Piezas individuales: MediaBox/BleedBox = con sangrado; TrimBox = tamaño final (3 mm hacia dentro)."""
    r, w = PdfReader(str(ruta)), PdfWriter()
    for p in r.pages:
        x0, y0, x1, y1 = [float(v) for v in p.mediabox]
        s = P.S * MM
        p.bleedbox = RectangleObject([x0, y0, x1, y1])
        p.trimbox = RectangleObject([x0 + s, y0 + s, x1 - s, y1 - s])
        p.artbox = RectangleObject([x0 + s, y0 + s, x1 - s, y1 - s])
        w.add_page(p)
    w.add_metadata({'/Title': f'Sage LAB 2026 - {ruta.stem}', '/Author': 'Sage'})
    with open(ruta, 'wb') as f: w.write(f)

# ------------------------------------------------ marcas de corte
def marcas(xs, ys, ancho, alto, zona):
    """Líneas de corte en los márgenes. xs, ys: posiciones de corte en mm. zona: (x0, y0, x1, y1) del área impresa con sangrado."""
    zx0, zy0, zx1, zy1 = zona
    L, sep = 6, 3  # largo de la marca y separación desde el sangrado
    ls = []
    for x in xs:
        ls += [(x, zy0 - sep - L, x, zy0 - sep), (x, zy1 + sep, x, zy1 + sep + L)]
    for y in ys:
        ls += [(zx0 - sep - L, y, zx0 - sep, y), (zx1 + sep, y, zx1 + sep + L, y)]
    trazos = ''.join(f'<line x1="{a}" y1="{b}" x2="{c}" y2="{d}"/>' for a, b, c, d in ls)
    return (f'<svg class="marcas-corte" viewBox="0 0 {ancho} {alto}" style="position:absolute;inset:0;width:{ancho}mm;height:{alto}mm;pointer-events:none">'
            f'<g stroke="#000" stroke-width=".25">{trazos}</g></svg>')

def hoja(contenido, ancho, alto, pie):
    return (f'<div class="hoja" style="position:relative;width:{ancho}mm;height:{alto}mm;overflow:hidden;break-after:page">{contenido}'
            f'<div style="position:absolute;left:40mm;bottom:4mm;font:600 2.6mm \'Open Sans\';color:#000">{P.e(pie)}</div></div>')

CSS_HOJA = '.hoja .pieza{break-after:auto}'

# ------------------------------------------------ cartas
cartas = [('liebert', c) for c in datos['liebert']] + [('asistente', c) for c in datos['asistente']]
frente = {'liebert': P.frente_liebert, 'asistente': P.frente_asistente}
dorso = {'liebert': P.dorso_liebert(), 'asistente': P.dorso_asistente()}
CW, CH = P.CARTA[0] + 2 * P.S, P.CARTA[1] + 2 * P.S

def pliego_cartas():
    """Pliego carta horizontal (279,4 x 215,9 mm) con 2 copias de la MISMA carta por hoja.
    Así el reverso siempre coincide, sin importar cómo voltee la imprenta la hoja."""
    AW, AH = 279.4, 215.9
    x0, y0 = (AW - 2 * CW) / 2, (AH - CH) / 2
    xs = [x0 + P.S, x0 + CW - P.S, x0 + CW + P.S, x0 + 2 * CW - P.S]
    ys = [y0 + P.S, y0 + CH - P.S]
    zona = (x0, y0, x0 + 2 * CW, y0 + CH)
    out, n = [], len(cartas)
    for i, (t, c) in enumerate(cartas, 1):
        for lado, pieza in (('Frente', frente[t](c)), ('Reverso', dorso[t])):
            slots = ''.join(f'<div style="position:absolute;left:{x0 + k * CW}mm;top:{y0}mm">{pieza}</div>' for k in range(2))
            out.append(hoja(slots + marcas(xs, ys, AW, AH, zona), AW, AH,
                            f'Sage LAB 2026 - Cartas A6 (105 x 148 mm) - Hoja {i} de {n} - {lado} - {c["codigo"]} - 2 copias por hoja'))
    return doc(''.join(out), P.CSS_CARTA + CSS_HOJA, AW, AH), AW, AH

def con_marcas(piezas, etiqueta, margen=14):
    """Cada pieza grande en una página con margen para marcas de corte."""
    AW, AH = P.W + 2 * margen, P.H + 2 * margen
    xs = [margen + P.S, margen + P.W - P.S]; ys = [margen + P.S, margen + P.H - P.S]
    zona = (margen, margen, margen + P.W, margen + P.H)
    out = [hoja(f'<div style="position:absolute;left:{margen}mm;top:{margen}mm">{p}</div>' + marcas(xs, ys, AW, AH, zona), AW, AH, f'{etiqueta(i)}')
           for i, p in enumerate(piezas)]
    return doc(''.join(out), P.CSS_GRANDE + CSS_HOJA, AW, AH), AW, AH

# ------------------------------------------------ verificación de QR
def verificar_qr(ruta, esperadas, paginas):
    """Rasteriza las páginas indicadas a 300 ppp (como saldría impresa) y lee cada QR con OpenCV."""
    import cv2
    det = cv2.QRCodeDetector()
    with tempfile.TemporaryDirectory() as d:
        for pagina, url in zip(paginas, esperadas):
            base = pathlib.Path(d) / f'p{pagina}'
            subprocess.run(['pdftoppm', '-f', str(pagina), '-l', str(pagina), '-r', '300', '-png', '-singlefile', str(ruta), str(base)], check=True)
            img = cv2.imread(str(base) + '.png')
            leido, _, _ = det.detectAndDecode(img)
            if not leido:  # segundo intento a menor resolución (el detector es sensible a la escala)
                leido, _, _ = det.detectAndDecode(cv2.resize(img, None, fx=.5, fy=.5))
            if leido != url: fallas.append(f'QR {ruta.name} página {pagina}: leí "{leido}", esperaba "{url}"')
    return len(esperadas)

# ------------------------------------------------ listado para NFC
def listado():
    filas = [('Reto', r, f'Reto {r["codigo"][1:]} - Equipo {r["equipo"]}', COPIAS_RETO) for r in datos['retos']]
    filas += [('Revista Liebert', c, c['titulo'], COPIAS_CARTA) for c in datos['liebert']]
    filas += [('Asistente SRM', c, c['titulo'], COPIAS_CARTA) for c in datos['asistente']]
    filas.append(('Entrada', {'codigo': 'ENTRADA', 'url': datos['urlPublica']}, 'Afiche de entrada', COPIAS_ENTRADA))
    enc = ['Código', 'Tipo', 'Nombre', 'URL (QR y NFC)', 'Copias impresas', 'Tags NFC a grabar']
    reg = [(x['codigo'], t, n, x['url'], k, k) for t, x, n, k in filas]
    with open(OUT / 'listado_QR_NFC.csv', 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.writer(f); w.writerow(enc); w.writerows(reg)
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment
    wb = openpyxl.Workbook(); ws = wb.active; ws.title = 'QR y NFC'
    ws.append(enc)
    for r in reg: ws.append(list(r))
    ws.append([]); ws.append(['Total', '', '', '', sum(r[4] for r in reg), sum(r[5] for r in reg)])
    for c in ws[1]: c.font = Font(bold=True, color='FFFFFF'); c.fill = PatternFill('solid', fgColor='001A69'); c.alignment = Alignment(vertical='center')
    ws[ws.max_row][0].font = Font(bold=True)
    for col, ancho in zip('ABCDEF', (10, 18, 48, 52, 16, 18)): ws.column_dimensions[col].width = ancho
    ws.freeze_panes = 'A2'
    wb.save(OUT / 'listado_QR_NFC.xlsx')
    return reg

def revision():
    """Hoja para que Sage valide cada texto antes de imprimir."""
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment
    wb = openpyxl.Workbook(); ws = wb.active; ws.title = 'Validar antes de imprimir'
    enc = ['Código', 'Tipo', 'Equipo o área', 'Título', 'Texto impreso', 'Pruébalo (impreso)', '¿Aprobado?', 'Corrección']
    ws.append(enc)
    for r in datos['retos']: ws.append([r['codigo'], 'Reto', r['equipo'], '', r['texto'], '', '', ''])
    for c in datos['liebert']: ws.append([c['codigo'], 'Revista Liebert', c['area'], c['titulo'], c['descripcion'], '', '', ''])
    for c in datos['asistente']: ws.append([c['codigo'], 'Asistente SRM', '', c['titulo'], c['descripcion'], c['pruebalo'], '', ''])
    for c in ws[1]: c.font = Font(bold=True, color='FFFFFF'); c.fill = PatternFill('solid', fgColor='001A69')
    for col, w in zip('ABCDEFGH', (9, 16, 22, 40, 70, 50, 12, 40)): ws.column_dimensions[col].width = w
    for fila in ws.iter_rows(min_row=2):
        for c in fila: c.alignment = Alignment(wrap_text=True, vertical='top')
    ws.freeze_panes = 'A2'
    wb.save(OUT / 'contenido_para_validar.xlsx')

# ------------------------------------------------ instrucciones para la imprenta
def instrucciones(nc, nr):
    filas = [
        ('Cartas de juego', 'cartas_A6_individuales_con_sangrado.pdf<br>o cartas_pliego_carta_con_marcas.pdf', f'{nc} diseños x {COPIAS_CARTA} copias = <b>{nc * COPIAS_CARTA} cartas</b>', 'A6: 105 x 148 mm', 'Frente y reverso (4/4)'),
        ('Retos', 'retos_carta_individuales_con_sangrado.pdf<br>o retos_con_marcas.pdf', f'{nr} diseños x {COPIAS_RETO} = <b>{nr * COPIAS_RETO} piezas</b>', 'Carta: 215,9 x 279,4 mm', 'Frente y reverso (4/4)'),
        ('Afiche de entrada', 'entrada_carta_con_sangrado.pdf<br>o entrada_con_marcas.pdf', f'1 diseño x {COPIAS_ENTRADA} = <b>{COPIAS_ENTRADA} piezas</b>', 'Carta: 215,9 x 279,4 mm', 'Solo frente (4/0)'),
    ]
    tabla = ''.join(f'<tr>{"".join(f"<td>{c}</td>" for c in f)}</tr>' for f in filas)
    puntos = lambda xs: '<ul>' + ''.join(f'<li>{x}</li>' for x in xs) + '</ul>'
    cuerpo = f"""<section class="ins">
<h1>Instrucciones para imprenta</h1><p class="sub">Sage LAB 2026 - Cartas sobre la mesa. Evento: martes 1 de diciembre de 2026, Guadalajara. Material sin posibilidad de reimpresión: por favor enviar prueba antes de producir.</p>
<h2>Piezas y cantidades</h2>
<table><tr><th>Pieza</th><th>Archivo</th><th>Cantidad</th><th>Tamaño final</th><th>Impresión</th></tr>{tabla}</table>
<h2>Archivos</h2>{puntos([
 'Todos los archivos traen <b>3 mm de sangrado</b> por lado. Los archivos "individuales" tienen definida la caja de corte (TrimBox) en el tamaño final; los archivos "con marcas" traen marcas de corte.',
 'El pliego de cartas es tamaño carta horizontal con <b>2 copias de la misma carta por hoja</b> (48 hojas, frente y reverso). Como ambas copias son iguales, el reverso siempre coincide sin importar cómo se voltee la hoja. Si prefieren imponer en su propio pliego, usen el archivo individual: las páginas impares son frentes y las pares, su reverso.',
 'Archivos en color RGB. Conviertan a CMYK con su perfil habitual. Colores de referencia: Sage Navy #001A69, granate Liebert #892034.',
 'Zona segura: no hay textos a menos de 5 mm del corte.'])}
<h2>Papel y acabado (recomendado)</h2>{puntos([
 'Cartas: cartulina de 300 a 350 g, <b>laminado o barniz mate</b> por ambas caras. Esquinas redondeadas de 3 mm opcionales.',
 'Retos y afiches: cartulina de 300 g, mate.',
 'Evitar laminado o barniz brillante sobre los códigos QR: los reflejos dificultan la lectura con el celular.',
 'No usar tintas metálicas ni papeles metalizados: interfieren con los tags NFC.'])}
<h2>Códigos QR (muy importante)</h2>{puntos([
 'Cada pieza tiene un QR distinto. <b>No reemplazar, redibujar, recortar ni cambiar de tamaño ni de color los QR.</b> No escalar las piezas.',
 'Mantener negro sólido sobre blanco y el margen blanco alrededor del QR.',
 'En la prueba, escanear varios QR con un celular para confirmar que abren una dirección que empieza por fvargasj1.github.io/FILGDL2027.'])}
<h2>Zona NFC</h2>{puntos([
 'Cada frente tiene un círculo punteado de 27 mm marcado "NFC". Ahí Sage pegará después un tag NFC adhesivo de 25 mm. Es parte del diseño: imprimirlo tal cual.',
 'Si la imprenta ofrece pegar los tags, Sage entregará el listado de códigos (listado_QR_NFC.xlsx): cada tag va sobre la pieza con su mismo código.'])}
<h2>Entrega</h2>{puntos([
 'Separar y rotular por grupos: Retos R01 a R10; Liebert L01 a L30 (2 de cada una); Asistente A01 a A18 (2 de cada una); Afiches.',
 'El código de cada carta está impreso junto a su QR (por ejemplo L05, A12, R03).'])}
<p class="contacto">Dudas sobre el material: equipo de Sage a cargo del LAB.</p></section>"""
    css = '''.ins{width:215.9mm;padding:10mm 15mm;font-size:3.1mm;line-height:1.36;color:#0a2b1a}
.ins h1{font-size:8mm;color:#001A69;line-height:1.1}.ins .sub{margin:2mm 0 4mm;color:#33352f}
.ins h2{font-size:4.2mm;color:#001A69;margin:3mm 0 1mm}.ins ul{padding-left:5mm}.ins li{margin:.8mm 0}
.ins table{width:100%;border-collapse:collapse;font-size:3.1mm}.ins th{background:#001A69;color:#fff;text-align:left;padding:1.6mm 2mm}
.ins td{border-bottom:.3mm solid #d8d3c9;padding:1.6mm 2mm;vertical-align:top}.ins .contacto{margin-top:5mm;font-weight:700;color:#001A69}'''
    return doc(cuerpo, css, 215.9, 279.4)

# ------------------------------------------------ todo
if __name__ == '__main__':
    from playwright.sync_api import sync_playwright
    with sync_playwright() as pw:
        nav = pw.chromium.launch()
        # 1. cartas individuales: frente y reverso intercalados, con sangrado y TrimBox
        piezas_ind = ''.join(frente[t](c) + dorso[t] for t, c in cartas)
        ind = pdf('cartas_A6_individuales_con_sangrado.pdf', doc(piezas_ind, P.CSS_CARTA, CW, CH), CW, CH, nav)
        # 2. cartas en pliego carta con marcas de corte
        h, aw, ah = pliego_cartas(); pdf('cartas_pliego_carta_con_marcas.pdf', h, aw, ah, nav, cajas=False)
        # 3. retos
        piezas_reto = ''.join(P.frente_reto(r) + P.dorso_reto() for r in datos['retos'])
        ret = pdf('retos_carta_individuales_con_sangrado.pdf', doc(piezas_reto, P.CSS_GRANDE, P.W, P.H), P.W, P.H, nav)
        lista = [p for r in datos['retos'] for p in (P.frente_reto(r), P.dorso_reto())]
        h, aw, ah = con_marcas(lista, lambda i: f'Sage LAB 2026 - Retos tamaño carta (215,9 x 279,4 mm) - Reto {i // 2 + 1:02d} - {"Frente" if i % 2 == 0 else "Reverso"}')
        pdf('retos_con_marcas.pdf', h, aw, ah, nav, cajas=False)
        # 4. afiche de entrada
        ent = pdf('entrada_carta_con_sangrado.pdf', doc(P.frente_entrada(datos['urlPublica']), P.CSS_GRANDE, P.W, P.H), P.W, P.H, nav)
        h, aw, ah = con_marcas([P.frente_entrada(datos['urlPublica'])], lambda i: 'Sage LAB 2026 - Afiche de entrada tamaño carta - 2 copias - solo frente')
        pdf('entrada_con_marcas.pdf', h, aw, ah, nav, cajas=False)
        pdf('instrucciones_imprenta.pdf', instrucciones(len(cartas), len(datos['retos'])), 215.9, 279.4, nav, cajas=False)
        nav.close()
    n = verificar_qr(ind, [c['url'] for _, c in cartas], [2 * i + 1 for i in range(len(cartas))])
    n += verificar_qr(ret, [r['url'] for r in datos['retos']], [2 * i + 1 for i in range(len(datos['retos']))])
    n += verificar_qr(ent, [datos['urlPublica']], [1])
    reg = listado()
    revision()
    print(f'{len(cartas)} cartas, {len(datos["retos"])} retos, 1 afiche. QR verificados: {n}. Tags NFC: {sum(r[5] for r in reg)}.')
    for f in fallas: print('FALLA:', f)
    print('Salida en', OUT)
    sys.exit(1 if fallas else 0)
