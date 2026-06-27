import os

dist = '/home/user/AN-CDS/dist/assets'
out = '/home/user/AN-CDS/GGA2026-Gestion-Gomme-Arabique.html'

js_file = next(f for f in os.listdir(dist) if f.endswith('.js'))

with open(os.path.join(dist, js_file), encoding='utf-8') as f:
    js = f.read()

# Separate CSS file only exists in older builds (format: es); IIFE embeds CSS in JS
css_block = ''
css_files = [f for f in os.listdir(dist) if f.endswith('.css')]
if css_files:
    with open(os.path.join(dist, css_files[0]), encoding='utf-8') as f:
        css_block = f'<style>\n{f.read()}\n</style>'

html = f'''<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="GGA 2026">
<meta name="theme-color" content="#16a34a">
<title>GGA 2026 — Gestion Gomme Arabique</title>
{css_block}
</head>
<body>
<div id="root"></div>
<script>
{js}
</script>
</body>
</html>'''

with open(out, 'w', encoding='utf-8') as f:
    f.write(html)

size = os.path.getsize(out)
print(f"Fichier généré : {out}")
print(f"Taille : {size // 1024} KB")
