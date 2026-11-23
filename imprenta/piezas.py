"""Diseño de las piezas impresas (HTML/CSS en milímetros). Lo usa generar.py.

Todas las piezas se dibujan con sangrado: la caja exterior mide el tamaño final + 3 mm por lado.
Las medidas internas se expresan desde el borde de la caja con sangrado (S = 3 mm)."""
import html, pathlib, segno

RAIZ = pathlib.Path(__file__).resolve().parent
REC = RAIZ / 'recursos'
S = 3  # sangrado en mm
CARTA = (105, 148)        # A6, tamaño final de las cartas
RETO = (215.9, 279.4)     # carta (letter), tamaño final de retos y afiche de entrada

def svg(nombre):
    t = (REC / nombre).read_text()
    return t[t.index('<svg'):]

LOGO_LIEBERT, LOGO_SRM, LOGO_SAGE = svg('logo-liebert.svg'), svg('logo-srm.svg'), svg('logo-sage.svg')
FIL = (REC / 'fil-logo.png').as_uri()
LISTON = (REC / 'liston-srm.png').as_uri()
CINTA = (REC / 'fil-cinta.jpg').as_uri()
e = lambda s: html.escape(str(s))

def qr(url):
    """QR vectorial (corrección M, sin margen: el margen lo da la caja blanca)."""
    q = segno.make(url, error='m', micro=False)
    return q.svg_inline(scale=1, border=0, dark='#000', light=None, omitsize=True), q.version

def arcos(cls=''):
    cs = ['#BC2158', '#FE9CB2', '#E9015A', '#FFA392']
    c = ''.join(f'<circle cx="100" cy="0" r="{14 + 9 * i}" fill="none" stroke="{cs[i % 4]}" stroke-width="1.1"/>' for i in range(18))
    return f'<svg class="arcos {cls}" viewBox="0 0 100 100" preserveAspectRatio="xMaxYMin slice">{c}</svg>'

NFC_ICONO = ('<svg class="nfc-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">'
             '<path d="M6 8.5a5 5 0 0 1 0 7"/><path d="M9.5 6a9 9 0 0 1 0 12"/><path d="M13 3.5a13 13 0 0 1 0 17"/></svg>')

def zona_nfc(diam=27, texto='NFC'):
    """Guía punteada donde se pega el tag NFC de 25 mm (diámetro de la guía: 27 mm)."""
    return f'<div class="nfc" style="width:{diam}mm;height:{diam}mm">{NFC_ICONO}<span>{texto}</span></div>'

CSS_BASE = """
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#fff}
body{font-family:'Open Sans',sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;color:#000}
.pieza{position:relative;overflow:hidden;break-after:page}
.qr{background:#fff;display:block}
.qr svg{display:block;width:100%;height:100%}
.nfc{flex:none;border-radius:50%;border:.45mm dashed currentColor;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.4mm}
.nfc .nfc-ico{width:8mm;height:8mm}
.nfc span{font-size:2.4mm;font-weight:800;letter-spacing:.03em}
.chip-fil{background:#edeae5;padding:1.2mm 1.8mm;border-radius:1.2mm;display:inline-flex}
.chip-fil img{height:7mm;display:block}
"""

# ---------------------------------------------------------------- cartas A6
CSS_CARTA = f"""
.carta{{width:{CARTA[0] + 2*S}mm;height:{CARTA[1] + 2*S}mm;display:flex;flex-direction:column;background:#fff}}
.carta .cabeza{{position:relative;padding:{S+6}mm {S+6}mm 6mm;display:flex;flex-direction:column;gap:3.5mm;overflow:hidden;flex:none}}
.carta .tag{{display:inline-block;font-weight:700;font-size:3mm;padding:.9mm 2.6mm 1.1mm;border-radius:999px;align-self:flex-start;position:relative}}
.carta h1{{font-weight:800;position:relative;margin-top:auto;letter-spacing:-.01em;line-height:1.08}}
.carta .cuerpo{{padding:4mm {S+6}mm 2mm;font-size:3.35mm;line-height:1.42;flex:1;min-height:0}}
.carta .cuerpo b{{display:block;font-size:2.9mm;margin-bottom:.8mm}}
.juego{{display:flex;align-items:center;gap:3mm;padding:0 {S+6}mm 3.2mm;flex:none}}
.juego .qr{{width:23mm;height:23mm;flex:none;padding:1.4mm;border:.3mm solid #d8d3c9;border-radius:1.5mm}}
.juego .cod{{font-size:8.6mm;font-weight:800;letter-spacing:.03em;line-height:1}}
.juego .inst{{font-size:2.55mm;line-height:1.35;color:#33352f;margin-top:1.2mm}}
.juego .txt{{flex:1;min-width:0}}
.juego .nfc{{color:#5b5d55}}
.pie{{display:flex;align-items:center;justify-content:space-between;padding:0 {S+6}mm {S}mm;height:{11+S}mm;border-top:.3mm solid #e2ddd4;flex:none}}
.pie .ev{{font-weight:800;color:#001A69;font-size:2.9mm;line-height:1.1}}
.pie .ev small{{display:block;font-weight:600;color:#5b5d55;font-size:2.2mm}}
.pie .marcas{{display:flex;align-items:center;gap:2.5mm}}
.pie .sage{{height:4.4mm;width:12.7mm;color:#001F83;display:block}}
.pie .sage svg{{height:100%;width:100%;display:block}}
.pie .fil{{height:7.6mm}}

/* Liebert */
.lb .cabeza{{background:#892034;color:#fff;height:{64+S}mm}}
.arcos{{position:absolute;right:0;top:0;width:62mm;height:62mm;opacity:.55}}
.lb .logo{{width:34mm;color:#fff;position:relative;display:block}}
.lb .tag{{background:#FFD565;color:#000}}
.lb .cuerpo b{{color:#892034}}
.lb .juego .cod{{color:#892034}}

/* Asistente SRM: listón del brochure sobre navy */
.ra .cabeza{{background:#001A69;color:#fff;height:{60+S}mm}}
.ra .liston{{position:absolute;right:-30mm;top:-8mm;width:92mm;height:auto;opacity:.95}}
.ra .logo{{width:30mm;color:#fff;position:relative;display:block}}
.ra .tag{{background:#fff;color:#001A69}}
.ra h1{{position:relative;max-width:74mm}}
.ra .cuerpo b{{color:#001A69}}
.prueba{{margin-top:2.2mm;background:#D9EEFF;border-radius:2mm;padding:2.4mm 3.2mm;color:#001A69;font-size:3.05mm;line-height:1.38;font-weight:600}}
.prueba i{{font-style:normal;display:block;font-size:2.4mm;font-weight:800;color:#0b7f8c;margin-bottom:.5mm}}
.ra .juego .cod{{color:#001A69}}

/* reversos */
.dorso{{justify-content:center;align-items:center;text-align:center;gap:5mm;color:#fff}}
.dorso .base{{position:absolute;left:{S}mm;right:{S}mm;bottom:{S}mm;display:flex;justify-content:space-between;align-items:center;padding:4mm 6mm}}
.dorso .base .ev{{font-weight:800;font-size:3.3mm;text-align:left;line-height:1.15}}
.dorso .base .ev small{{display:block;font-weight:600;font-size:2.4mm;opacity:.85}}
.dorso-lb{{background:#892034}}
.dorso-lb .arcos{{width:72mm;height:72mm;opacity:.45}}
.dorso-lb .arcos.b{{top:auto;bottom:0;right:auto;left:0;transform:rotate(180deg)}}
.dorso-lb .logo{{width:62mm;color:#fff;position:relative}}
.dorso .sub{{position:relative;font-size:4.2mm;font-weight:600}}
.dorso-ra{{background:#001A69}}
.dorso-ra .liston{{position:absolute;left:-28mm;top:8mm;width:170mm;height:auto;transform:rotate(-8deg)}}
.dorso-ra .logo{{width:58mm;color:#fff;position:relative;margin-top:44mm}}
.dorso-ra .sub{{color:#fff}}
"""

def pie_carta():
    return (f'<div class="pie"><div class="ev">Cartas sobre la mesa<small>Sage LAB 2026</small></div>'
            f'<div class="marcas"><span class="sage">{LOGO_SAGE}</span><img class="fil" src="{FIL}" alt="FIL"></div></div>')

def juego(c, accion):
    svgqr, _ = qr(c['url'])
    return (f'<div class="juego"><div class="qr">{svgqr}</div>'
            f'<div class="txt"><div class="cod">{e(c["codigo"])}</div><div class="inst">Escanea el QR o acerca tu celular al círculo para {accion}.</div></div>'
            f'{zona_nfc()}</div>')

def tam_titulo(t, base, pasos):
    for largo, tam in pasos:
        if len(t) > largo: return tam
    return base

def frente_liebert(c):
    h1 = tam_titulo(c['titulo'], 8.6, [(40, 6.2), (30, 7.0), (20, 7.8)])
    return (f'<section class="pieza carta lb"><div class="cabeza">{arcos()}<span class="logo">{LOGO_LIEBERT}</span>'
            f'<span class="tag">{e(c["area"])}</span><h1 style="font-size:{h1}mm">{e(c["titulo"]).replace("-", "&#8209;")}</h1></div>'
            f'<div class="cuerpo"><b>Qué aporta a tu biblioteca</b>{e(c["descripcion"])}</div>'
            f'{juego(c, "jugarla en tu reto y ver la revista")}{pie_carta()}</section>')

def frente_asistente(c):
    h1 = tam_titulo(c['titulo'], 9.0, [(20, 7.6), (16, 8.2)])
    return (f'<section class="pieza carta ra"><div class="cabeza"><img class="liston" src="{LISTON}" alt=""><span class="logo">{LOGO_SRM}</span>'
            f'<span class="tag">Asistente de investigación</span><h1 style="font-size:{h1}mm">{e(c["titulo"])}</h1></div>'
            f'<div class="cuerpo"><b>Cómo te acompaña</b>{e(c["descripcion"])}'
            f'<div class="prueba"><i>Pruébalo</i>“{e(c["pruebalo"])}”</div></div>'
            f'{juego(c, "jugarla en tu reto y probarla")}{pie_carta()}</section>')

def base_dorso():
    return f'<div class="base"><div class="ev">Cartas sobre la mesa<small>Sage LAB 2026</small></div><span class="chip-fil"><img src="{FIL}" alt="FIL"></span></div>'

def dorso_liebert():
    return (f'<section class="pieza carta dorso dorso-lb">{arcos()}{arcos("b")}<span class="logo">{LOGO_LIEBERT}</span>'
            f'<div class="sub">Colección de medicina</div>{base_dorso()}</section>')

def dorso_asistente():
    return (f'<section class="pieza carta dorso dorso-ra"><img class="liston" src="{LISTON}" alt=""><span class="logo">{LOGO_SRM}</span>'
            f'<div class="sub">Asistente de investigación</div>{base_dorso()}</section>')

# ---------------------------------------------------------------- retos (carta) y entrada
W, H = RETO[0] + 2 * S, RETO[1] + 2 * S
CSS_GRANDE = f"""
.grande{{width:{W}mm;height:{H}mm}}
.frente{{background:#edeae5;color:#0a2b1a}}
.cinta{{position:absolute;right:0;bottom:0;width:{120+S}mm;height:{140+S}mm;background:url({CINTA}) 68% 72%/250mm auto no-repeat;-webkit-mask-image:radial-gradient(circle at 100% 100%,#000 52%,transparent 76%)}}
.top{{position:absolute;left:{16+S}mm;right:{16+S}mm;top:{14+S}mm;display:flex;justify-content:space-between;align-items:center}}
.top .sage{{height:11mm;color:#001F83;display:block}}
.top .sage svg{{height:100%;width:auto;display:block}}
.top .fil{{height:19mm}}
.num{{position:absolute;left:{16+S}mm;top:{44+S}mm;display:flex;align-items:center;gap:4mm}}
.num span{{background:#001A69;color:#fff;font-weight:800;font-size:7mm;padding:1.5mm 5mm 2mm;border-radius:999px}}
.num em{{font-style:normal;font-weight:700;font-size:5.4mm;color:#001A69;border:.5mm solid #001A69;padding:1.2mm 4mm 1.6mm;border-radius:999px}}
.texto{{position:absolute;left:{16+S}mm;right:{22+S}mm;top:{66+S}mm;line-height:1.14;font-weight:800;color:#001A69;letter-spacing:-.015em}}
.escanea{{position:absolute;left:{12+S}mm;bottom:{12+S}mm;display:flex;align-items:center;gap:6mm;z-index:2;background:#edeae5;padding:4mm 7mm 4mm 4mm;border-radius:4mm}}
.escanea .qr{{width:52mm;height:52mm;padding:3mm;border-radius:3mm;box-shadow:0 0 0 .6mm #001A69}}
.escanea .t{{font-size:6mm;font-weight:800;color:#001A69;line-height:1.15;max-width:64mm;display:flex;flex-direction:column;gap:3mm}}
.escanea .t small{{display:block;font-size:4.1mm;font-weight:600;color:#0a2b1a;line-height:1.35}}
.escanea .t .fila{{display:flex;align-items:center;gap:3mm}}
.escanea .nfc{{color:#001A69}}
.escanea .cod{{font-size:4mm;font-weight:700;color:#5b5d55}}
.dorso-g{{background:#001A69;color:#fff}}
.dorso-g .cinta{{width:{W}mm;height:{112+S}mm;top:0;bottom:auto;background-position:62% 70%;background-size:360mm auto;-webkit-mask-image:linear-gradient(to bottom,#000 45%,transparent)}}
.dorso-g .tit{{position:absolute;left:{18+S}mm;top:{112+S}mm;right:{18+S}mm}}
.dorso-g .tit .a{{font-size:11mm;font-weight:800}}
.dorso-g .tit .b{{font-size:15mm;font-weight:800;color:#f5ae8d;line-height:1.05;letter-spacing:-.015em}}
.dorso-g ol{{position:absolute;left:{18+S}mm;right:{18+S}mm;top:{160+S}mm;list-style:none;counter-reset:p;display:flex;flex-direction:column;gap:5.5mm}}
.dorso-g li{{counter-increment:p;display:flex;gap:5mm;font-size:5.4mm;line-height:1.35}}
.dorso-g li::before{{content:counter(p);flex:none;width:11mm;height:11mm;border-radius:50%;background:#f5ae8d;color:#001A69;font-weight:800;display:grid;place-items:center;font-size:6mm}}
.dorso-g .base{{position:absolute;left:{18+S}mm;right:{18+S}mm;bottom:{12+S}mm;display:flex;justify-content:space-between;align-items:center}}
.dorso-g .base .sage{{height:10mm;color:#fff;display:block}}
.dorso-g .base .sage svg{{height:100%;width:auto;display:block}}
.dorso-g .base .chip-fil img{{height:15mm}}
.entrada .titulo{{position:absolute;left:{16+S}mm;right:{16+S}mm;top:{50+S}mm;color:#001A69}}
.entrada .titulo .a{{font-size:20mm;font-weight:800;letter-spacing:-.02em;line-height:1}}
.entrada .titulo .b{{font-size:12mm;font-weight:800;color:#87526c;margin-top:3mm}}
.entrada .titulo p{{font-size:6.4mm;font-weight:600;line-height:1.35;margin-top:9mm;max-width:150mm;color:#0a2b1a}}
.entrada .url{{display:block;font-size:4mm;font-weight:700;color:#001A69;margin-top:1mm;overflow-wrap:anywhere}}
"""

def top_grande():
    return f'<div class="top"><span class="sage">{LOGO_SAGE}</span><img class="fil" src="{FIL}" alt="FIL"></div>'

def frente_reto(r):
    svgqr, _ = qr(r['url'])
    t = 15.5 if len(r['texto']) <= 95 else 13.6
    return (f'<section class="pieza grande frente"><div class="cinta"></div>{top_grande()}'
            f'<div class="num"><span>Reto {r["codigo"][1:]}</span><em>Equipo {e(r["equipo"])}</em></div>'
            f'<div class="texto" style="font-size:{t}mm">{e(r["texto"])}</div>'
            f'<div class="escanea"><div class="qr">{svgqr}</div><div class="t">Escanea o acerca tu celular para unirte a este reto'
            f'<small>Y cuéntanos si esto pasa en tu institución.</small>'
            f'<div class="fila">{zona_nfc(27)}<span class="cod">Código {e(r["codigo"])}</span></div></div></div></section>')

def dorso_reto():
    pasos = ['Cada quien escanea este reto con su celular (QR o NFC) y cuenta si esto pasa en su institución.',
             'Conversen: ¿por qué pasa? ¿Qué han intentado?',
             'En la ronda de cartas, escaneen las cartas de sus manos que mejor resuelven el reto: hasta 6 por equipo.',
             'Elijan su carta clave y cuéntennos por qué.']
    return (f'<section class="pieza grande dorso-g"><div class="cinta"></div>'
            f'<div class="tit"><div class="a">Sage LAB</div><div class="b">Cartas sobre la mesa</div></div>'
            f'<ol>{"".join(f"<li>{e(p)}</li>" for p in pasos)}</ol>'
            f'<div class="base"><span class="sage">{LOGO_SAGE}</span><span class="chip-fil"><img src="{FIL}" alt="FIL"></span></div></section>')

def frente_entrada(url):
    svgqr, _ = qr(url)
    corta = url.replace('https://', '').rstrip('/')
    return (f'<section class="pieza grande frente entrada"><div class="cinta"></div>{top_grande()}'
            f'<div class="titulo"><div class="a">Sage LAB</div><div class="b">Cartas sobre la mesa</div>'
            f'<p>Entra a la mesa desde tu celular: busca tu nombre y escribe una palabra para Sage.</p></div>'
            f'<div class="escanea"><div class="qr">{svgqr}</div><div class="t">Escanea o acerca tu celular para entrar'
            f'<small>Sin instalar nada.<span class="url">{e(corta)}</span></small>'
            f'<div class="fila">{zona_nfc(27)}</div></div></div></section>')
