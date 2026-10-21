#!/usr/bin/env python3
"""Build the PV simulator.
  python3 build.py            -> writes index.html (dev, links css/js) and dist/pv-wiring-sim.html (single-file bundle)
Open index.html in a browser to run the project from this folder."""
import os,re,hashlib
here=os.path.dirname(os.path.abspath(__file__))
R=lambda p:open(os.path.join(here,p),encoding='utf-8').read()
JS=['config','catalog','pdfimport','model','engine','wiring','acart','acsys','solar','site','loads','backup','systems','events','bench','benchui','submit','worksheets','access','ctx','app']
TITLE='ต่อสายแผงโซลาร์'
FONTS='https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap'
body=R('app.html')
# cache-busting: each css/js link carries a hash of its content, so a browser never mixes a new page with old cached scripts
V=lambda p:hashlib.sha1(R(p).encode('utf-8')).hexdigest()[:8]
for n in JS:
    assert '</script' not in R(f'js/{n}.js'),n
dev=f'''<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{TITLE}</title>
<link rel="stylesheet" href="{FONTS}">
<link rel="stylesheet" href="css/styles.css?v={V('css/styles.css')}">
</head>
<body>
{body}
'''+''.join(f'<script src="js/{n}.js?v={V(f"js/{n}.js")}"></script>\n' for n in JS)+'''</body>
</html>
'''
open(os.path.join(here,'index.html'),'w',encoding='utf-8').write(dev)
bundle=f'''<title>{TITLE}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="{FONTS}">
<style>
{R('css/styles.css')}</style>
{body}
<script>
'''+'\n'.join(R(f'js/{n}.js') for n in JS)+'''
</script>
'''
os.makedirs(os.path.join(here,'dist'),exist_ok=True)
open(os.path.join(here,'dist','pv-wiring-sim.html'),'w',encoding='utf-8').write(bundle)
print('index.html',len(dev),'dist/pv-wiring-sim.html',len(bundle))
