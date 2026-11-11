#!/usr/bin/env node
/* เมนู 19: ลากต่อสาย — ลากปลายสายอินเวอร์เตอร์ AC ไปวางที่จุดต่อ, ลาก CT ไปคล้องสาย, คลิก CT กลับทิศ */
const fs = require('fs'), path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const file = path.resolve(__dirname, '..', 'dist', 'pv-wiring-sim.html');
const vc = new VirtualConsole(), errs = [];
vc.on('jsdomError', e => errs.push(String(e.message).split('\n')[0]));
const dom = new JSDOM(fs.readFileSync(file, 'utf8'), { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'https://example.github.io/x/',
  beforeParse(w) { w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    w.SVGSVGElement.prototype.createSVGPoint = function () { return { x: 0, y: 0, matrixTransform() { return { x: this.x, y: this.y }; } }; };
    w.SVGSVGElement.prototype.getScreenCTM = function () { return { inverse() { return {}; } }; };
    w.SVGSVGElement.prototype.createSVGPoint = function () { const p = { x: 0, y: 0, matrixTransform() { return { x: p.x, y: p.y }; } }; return p; };
    w.Element.prototype.setPointerCapture = function () {}; } });
const w = dom.window, ev = s => w.eval(s);
let fail = 0; const ok = (c, m) => { console.log((c ? '  ok  ' : '  FAIL ') + m); if (!c) fail++; };
setTimeout(() => {
  ev('ACC.enabled=false'); ev('showTab("accouple")'); ev('CP.page="job"; cpRenderTab()');
  const host = w.document.getElementById('cphost');
  const fire = (type, x, y, target) => { const e = new w.MouseEvent(type, { bubbles: true, clientX: x, clientY: y }); (target || host).dispatchEvent(e); };
  const drag = (sel, to) => { const t = w.document.querySelector(sel); fire('pointerdown', ...(sel.includes('src') ? [335, 42] : [505, 40]), t); fire('pointermove', to[0], to[1], host); fire('pointerup', to[0], to[1], host); };
  ev('cpReset(CP)'); ev('cpRender()');
  ok(ev('CP.ports.src') === 'none', 'เริ่มต้นยังไม่ต่อ');
  drag('[data-cpdrag="src"]', [335, 104]); ok(ev('CP.ports.src') === 'gen', 'ลากปลายสายไปพอร์ต GEN');
  drag('[data-cpdrag="src"]', [175, 112]); ok(ev('CP.ports.src') === 'main', 'ลากไปตู้เมน');
  drag('[data-cpdrag="src"]', [430, 136]); ok(ev('CP.ports.src') === 'load', 'ลากไปพอร์ต LOAD');
  drag('[data-cpdrag="src"]', [520, 80]); ok(ev('CP.ports.src') === 'none', 'วางนอกจุดต่อ = ถอดสาย');
  drag('[data-cpdrag="src"]', [335, 104]);
  drag('[data-cpdrag="ct"]', [115, 136]); ok(ev('CP.ports.ct') === 'grid', 'ลาก CT ไปคล้องสายกริด');
  const t = w.document.querySelector('[data-cpdrag="ct"]'); fire('pointerdown', 115, 136, t); fire('pointerup', 115, 136, host);
  ok(ev('CP.ports.arrow') === 'rev', 'คลิก CT กลับทิศลูกศร');
  fire('pointerdown', 115, 136, w.document.querySelector('[data-cpdrag="ct"]')); fire('pointerup', 115, 136, host);
  ok(ev('CP.ports.arrow') === 'ok', 'คลิกอีกครั้งกลับเป็นทิศเดิม');
  drag('[data-cpdrag="ct"]', [335, 62]); ok(ev('CP.ports.ct') === 'src', 'ลาก CT ไปสายอินเวอร์เตอร์ AC');
  drag('[data-cpdrag="ct"]', [115, 136]);
  ev('cpCorrect(CP)'); ev('CP.ports.src="none";CP.ports.ct="none";cpRender()');
  drag('[data-cpdrag="src"]', [335, 104]); drag('[data-cpdrag="ct"]', [115, 136]);
  ok(ev('cpChecks().job.every(x=>x[0])'), 'ต่อด้วยการลากถูกทั้งหมด เช็กลิสต์การต่อสายผ่าน');
  ok(!errs.filter(e => !/canvas|getContext|not implemented|scrollTo/i.test(e)).length, 'ไม่มี error: ' + errs.join('; '));
  console.log(fail ? 'menu19 FAILED' : 'menu19 OK'); process.exit(fail ? 1 : 0);
}, 800);
