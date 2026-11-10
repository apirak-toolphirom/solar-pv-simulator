"""Phone-layout check (optional, needs Python Playwright and Chrome):
   every menu at 390 px wide must not push content past the screen edge, and controls must be big enough to tap.
   Usage: python3 tests/mobile.py [path/to/chrome]   (run after python3 build.py)"""
import sys, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
TABS = ['basics', 'library', 'equip', 'wiring', 'ac', 'bench', 'cable', 'pv', 'site', 'load', 'backup', 'systems',
        'events', 'calc', 'eit', 'solis', 'deye', 'accouple', 'lfp', 'fusion', 'submit']
CHECK = """t=>{showTab(t);document.querySelectorAll('.tab').forEach(x=>x.hidden=x.id!=='tab-'+t);
  const W=document.documentElement.clientWidth,root=document.getElementById('tab-'+t);
  const scroller=e=>{for(let p=e.parentElement;p&&p!==root;p=p.parentElement){const s=getComputedStyle(p).overflowX;if(s==='auto'||s==='scroll')return true}return false};
  const wide=[...root.querySelectorAll('*')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.right>W+2&&!scroller(e)&&!(e.closest('svg')&&e.tagName!=='svg')}).length;
  const small=[...root.querySelectorAll('button,.chip,select,input:not([type=checkbox]):not([type=radio]):not([type=range])')].filter(e=>{const r=e.getBoundingClientRect();return r.height>0&&r.height<36}).length;
  const sidescroll=[...root.querySelectorAll('.tblwrap')].filter(e=>e.scrollWidth>e.clientWidth+4).length;
  return {wide,small,sidescroll}}"""

def main():
    chrome = sys.argv[1] if len(sys.argv) > 1 else '/usr/bin/google-chrome'
    bad = 0
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=chrome, args=['--no-sandbox'])
        pg = b.new_page(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True)
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)[:150]))
        pg.goto((ROOT / 'index.html').as_uri())
        pg.wait_for_timeout(1500)
        for t in TABS:
            n = len(errs)
            r = pg.evaluate(CHECK, t)
            pg.wait_for_timeout(200)
            new = errs[n:]
            ok = not (r['wide'] or r['small'] or r['sidescroll'] or new)
            bad += 0 if ok else 1
            print(('  ok ' if ok else '  FAIL') + f" {t}: {r}" + (f" errors={new}" if new else ''))
        # fusion menu: every step of the Commissioning page
        pg.evaluate("""()=>{fcReset();FC.login.ok=true;FC.login.pw2=true;FC.sw.ac=true;FC.sw.dc=true;FC.sw.log=['ac_on','dc_on'];FC.fault='none';FC.fault0='none'}""")
        for i in range(6):
            n = len(errs)
            pg.evaluate(f"()=>{{FU.page='com';FC.step={i}}}")
            r = pg.evaluate(CHECK, 'fusion')
            pg.evaluate(f"()=>{{FU.page='com';FC.step={i};fuRender()}}")
            r = pg.evaluate(CHECK, 'fusion')
            new = errs[n:]
            ok = not (r['wide'] or r['small'] or r['sidescroll'] or new)
            bad += 0 if ok else 1
            print(('  ok ' if ok else '  FAIL') + f" fusion commissioning step {i + 1}: {r}" + (f" errors={new}" if new else ''))
        b.close()
    print(f"mobile: {len(TABS) + 6 - bad} ok, {bad} with problems")
    sys.exit(1 if bad else 0)

main()
