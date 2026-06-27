import os, re

dist = '/home/user/AN-CDS/dist/assets'
out = '/home/user/AN-CDS/GGA2026-Gestion-Gomme-Arabique.html'

js_file = next(f for f in os.listdir(dist) if f.endswith('.js'))
css_file = next(f for f in os.listdir(dist) if f.endswith('.css'))

with open(os.path.join(dist, js_file), encoding='utf-8') as f:
    js = f.read()
with open(os.path.join(dist, css_file), encoding='utf-8') as f:
    css = f.read()

html = f'''<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>GGA 2026 — Gestion Gomme Arabique</title>
<style>
{css}
</style>
</head>
<body>
<div id="root"></div>
<script type="text/javascript">
{js}
</script>
</body>
</html>'''

with open(out, 'w', encoding='utf-8') as f:
    f.write(html)

size = os.path.getsize(out)
print(f"Fichier généré : {out}")
print(f"Taille : {size // 1024} KB")
