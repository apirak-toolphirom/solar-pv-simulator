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
  /* ---- หน้า 6 ต่อสายเอง: CT 2 ชุด + สายสัญญาณแยกสี ---- */
  ev('CP.sc="hw_deye";cpReset(CP);CP.page="custom";cpRender()');
  const D2 = (sel, from, to) => { const t = w.document.querySelector(sel); fire('pointerdown', from[0], from[1], t); fire('pointermove', to[0], to[1], host); fire('pointerup', to[0], to[1], host); };
  D2('[data-cpdrag="src"]', [335, 42], [335, 104]);
  ok(!ev('cpCuChecks().every(x=>x[0])'), 'หน้า 6 เริ่มต้นยังไม่ผ่าน');
  D2('[data-cpdrag="ctH"]', [460, 72], [108, 136]); ok(ev('CP.ports.ct') === 'grid', 'ลาก CT Hybrid ไปคล้องสายกริด (ใช้ร่วมกับหน้า 1)');
  D2('[data-cpdrag="ctA"]', [530, 72], [122, 136]); ok(ev('CP.cu.at') === 'grid', 'ลาก CT ออนกริดไปคล้องสายกริด');
  D2('[data-cpdrag="portH"]', [335, 168], [122, 136]); ok(ev('CP.cu.lh') === 'A' && ev('cpCuChecks().some(x=>x[2]==="err")'), 'สายส้มไปต่อ CT ฟ้า = สลับ ขึ้นเตือน');
  D2('[data-cpdrag="portH"]', [335, 168], [108, 136]); ok(ev('CP.cu.lh') === 'H', 'สายส้มต่อ CT Hybrid');
  D2('[data-cpdrag="portA"]', [256, 23], [122, 136]); ok(ev('CP.cu.la') === 'A', 'สายฟ้าต่อ CT ออนกริด');
  ok(ev('cpCuChecks().every(x=>x[0])'), 'ต่อถูกครบ หน้า 6 ผ่านทุกข้อ');
  ok(ev('document.querySelectorAll("#cpsld path[stroke-dasharray]").length')>=2, 'มีเส้นประสัญญาณ 2 เส้น');
  const sv = JSON.stringify(ev('cpSnapshot()')); ev('cpReset(CP)'); ev('cpRestore(' + sv + ')'); ok(ev('CP.cu.lh')==='H'&&ev('CP.cu.la')==='A'&&ev('CP.cu.at')==='grid', 'บันทึก/กู้คืนสถานะสายสัญญาณ');
  ev('CP.sc="dm_deye";cpReset(CP);CP.page="custom";cpRender()');
  ok(!w.document.querySelector('[data-cpdrag="ctA"]'), 'ไมโคร Deye ไม่มี CT ออนกริด');
  ok(!errs.filter(e => !/canvas|getContext|not implemented|scrollTo/i.test(e)).length, 'ไม่มี error: ' + errs.join('; '));
  console.log(fail ? 'menu19 FAILED' : 'menu19 OK'); process.exit(fail ? 1 : 0);
}, 800);
