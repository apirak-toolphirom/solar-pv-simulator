#!/usr/bin/env python3
"""Build the PV simulator.
  python3 build.py            -> writes index.html (dev, links css/js) and dist/pv-wiring-sim.html (single-file bundle)
Open index.html in a browser to run the project from this folder."""
import os,re,hashlib
here=os.path.dirname(os.path.abspath(__file__))
R=lambda p:open(os.path.join(here,p),encoding='utf-8').read()
JS=['config','catalog','pdfimport','model','engine','wiring','acart','acsys','acmicro','solar','site','loads','backup','bkanim','systems','events','bench','benchui','basics','earth','submit','worksheets','hwlog','fusion','access','ctx','app']
TITLE='solar sim@1'
import base64
ICON_URI='data:image/svg+xml;base64,'+base64.b64encode(open(os.path.join(here,'img','favicon.svg'),'rb').read()).decode()
FONTS='https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap'
body=R('app.html')
# cache-busting: each css/js link carries a hash of its content, so a browser never mixes a new page with old cached scripts
V=lambda p:hashlib.sha1(R(p).encode('utf-8')).hexdigest()[:8]
for n in JS:
    assert '</script' not in R(f'js/{n}.js'),n
BUILD=hashlib.sha1((''.join(R(f'js/{n}.js') for n in JS)+R('css/styles.css')+body).encode('utf-8')).hexdigest()[:10]
dev=f'''<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="build" content="{BUILD}">
<script>/* phones keep the old page for a while (GitHub Pages cache): fetch the live copy once and reload if it is newer */
addEventListener('load',()=>{{try{{fetch(location.pathname+'?nc='+Date.now(),{{cache:'no-store'}}).then(r=>r.text()).then(t=>{{const m=/<meta name="build" content="([0-9a-f]+)"/.exec(t);
if(m&&m[1]!=='{BUILD}'&&sessionStorage.getItem('pvsim:reloaded')!==m[1]){{sessionStorage.setItem('pvsim:reloaded',m[1]);location.reload()}}}}).catch(()=>{{}})}}catch(e){{}}}});</script>
<title>{TITLE}</title>
<link rel="icon" type="image/svg+xml" href="img/favicon.svg?v={V('img/favicon.svg')}">
<script>try{{document.documentElement.dataset.theme=localStorage.getItem('pvsim:theme')||'light'}}catch(e){{document.documentElement.dataset.theme='light'}}</script>
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
<link rel="icon" type="image/svg+xml" href="{ICON_URI}">
<script>try{{document.documentElement.dataset.theme=localStorage.getItem('pvsim:theme')||'light'}}catch(e){{document.documentElement.dataset.theme='light'}}</script>
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
