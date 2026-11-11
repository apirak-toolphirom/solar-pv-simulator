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
  /* ---- ระบบที่ 5: Huawei ต่อช่อง Backup (LOAD) ของ Deye + จอตั้งค่า on-grid เป็นเมนูซ้อน ---- */
  ev('CP.sc="hw_deye_load";cpReset(CP);CP.page="job";cpRender()');
  ok(w.document.querySelectorAll('[data-cpsc]').length === 5, 'มีให้เลือก 5 ระบบ');
  ev('cpCorrect(CP);cpChanged()'); ok(ev('cpScore().ok') && ev('CP.ports.src') === 'load', 'เฉลยระบบ LOAD: ต่อ LOAD + CT กริด + เปิดกันย้อน ผ่านทุกข้อ');
  ev('CP.ports.src="gen";cpChanged()'); ok(!ev('cpChecks().job[0][0]'), 'ต่อที่ GEN ไม่ผ่านในใบงาน LOAD');
  /* ค่าตั้ง AC couple on load side ที่หน้า Gen Port Use (คู่มือ Deye ข้อ 5.10) */
  ev('cpCorrect(CP);cpChanged()'); ok(ev('CP.hs.gen.acLoad')===true && ev('cpChecks().set.some(x=>/AC couple on load side/.test(x[1])&&x[0])'), 'เฉลยระบบ LOAD: ติ๊ก AC couple on load side แล้วผ่านเช็กลิสต์');
  ev('CP.hs.gen.acLoad=false;cpChanged()'); ok(!ev('cpScore().ok') && ev('cpAlarms().some(a=>a.c==="AC-COUPLE-LOAD"&&a.to==="host")'), 'ไม่ติ๊ก AC couple on load side: ไม่ผ่านและมีคำเตือนพร้อมไกด์ไปจอเครื่อง');
  ev('CP.page="host";CP.lcd={scr:"gen",stack:[]};cpRender()'); ok(/AC couple on load side/.test(w.document.body.innerHTML) && w.document.getElementById('hl-gen-acLoad'), 'จอ Gen Port Use มีช่องติ๊ก AC couple on load side');
  ev('CP.sc="hw_deye";cpReset(CP);CP.ports.src="gen";CP.hs.gen.acLoad=true;'); ok(ev('cpAlarms().some(a=>a.c==="AC-COUPLE-SIDE")'), 'ต่อ GEN แต่ติ๊ก AC couple on load side: มีคำเตือน');
  ev('CP.sc="hw_deye_load";cpReset(CP);cpRender()');
  ev('cpCorrect(CP);CP.set.src.anti=false;cpChanged()');
  ok(ev('cpAlarms().some(a=>a.c==="EXPORT-LIMIT-OFF"&&a.to==="src")'), 'ไม่เปิดกันย้อน: มีข้อความแดง + ไกด์ไปแท็บ 3');
  ev('CP.page="src";CP.sm.scr="home";cpRender()');
  w.document.querySelector('[data-cpsm="padj"]').click();
  ok(ev('CP.sm.scr') === 'padj' && !!w.document.querySelector('[data-cps="src.anti"]'), 'จอ on-grid: Settings › Power adjustment มีช่องเปิด Export limitation');
  const ck = w.document.querySelector('[data-cps="src.anti"]'); ck.checked = true; ck.dispatchEvent(new w.Event('change', { bubbles: true }));
  ok(ev('CP.set.src.anti') === true && ev('cpScore().ok'), 'เปิดกันย้อนที่จอ on-grid แล้วผ่านทุกข้อ');
  w.document.querySelector('[data-cpsm="home"]').click(); w.document.querySelector('[data-cpsm="meter"]').click();
  ok(ev('CP.sm.scr') === 'meter', 'เมนู Communication › Power meter เปิดได้');
  const sv5 = JSON.stringify(ev('cpSnapshot()')); ev('cpReset(CP)'); ev('cpRestore(' + sv5 + ')'); ok(ev('CP.sc') === 'hw_deye_load' && ev('CP.sm.scr') === 'meter', 'บันทึก/กู้คืนระบบ LOAD และหน้าจอเมนู');
  /* ---- หน้า 6: ต่อเข้า LOAD ได้กับ Deye, Solis ไม่รับ + ผลจำลองไฟดับ ---- */
  ev('CP.sc="hw_deye";cpReset(CP);CP.ports.src="load";CP.ports.ct="grid";CP.page="custom";cpRender()');
  ok(ev('cpCuChecks()[0][0]'), 'Deye: หน้า 6 ยอมรับต่อที่ช่อง LOAD');
  ok(/ผลจำลองไฟกริดดับ/.test(ev('cpCuSim()')) && ev('cpRun({out:"mid",soc0:50}).T.pvA')>1, 'มีผลจำลองไฟดับ และอินเวอร์เตอร์ AC ที่ LOAD ผลิตตอนไฟดับ');
  ev('CP.sc="hw_solis";cpReset(CP);CP.ports.src="load";CP.page="custom";cpRender()');
  ok(!ev('cpCuChecks()[0][0]') && ev('cpRun({out:"mid",soc0:50}).T.pvA')===0, 'Solis: ต่อ LOAD ไม่ผ่านและอินเวอร์เตอร์ AC ไม่ผลิต');
  ok(!/GEN/.test(ev('ACC_NAME.accouple')), 'ชื่อเมนูไม่มีคำว่า GEN');
  /* ---- จุดต่อใหม่ที่ช่องโหลดบ้าน (Backup) + ผลเสียของการต่อฝั่ง LOAD ---- */
  ev('CP.sc="hw_deye_load";cpReset(CP);CP.page="job";cpRender()');
  drag('[data-cpdrag="src"]', [495, 112]); ok(ev('CP.ports.src') === 'bload', 'ลากปลายสายไปช่องโหลดบ้าน (Backup) ได้');
  ev('CP.ports.ct="grid";cpChanged()'); ok(ev('cpChecks().job[0][0]'), 'ต่อที่โหลดบ้าน (Backup) นับเป็นฝั่ง LOAD ในใบงาน LOAD');
  ok(ev('cpLoadRisks(CP).some(a=>a.c==="OUTAGE-CURTAIL")&&cpLoadRisks(CP).some(a=>a.c==="SURPLUS")'), 'มีข้อความผลเสียของการต่อฝั่ง LOAD');
  ev('CP.sc="hw_deye";cpReset(CP);CP.ports.src="gen";'); ok(ev('cpLoadRisks(CP).length')===0, 'ต่อที่ GEN ไม่มีข้อความผลเสียฝั่ง LOAD');
  ev('CP.sc="hw_deye_load";cpReset(CP);CP.ports.src="load";CP.set.src.anti=true;CP.cu.at="none"');
  ok(ev('cpLoadRisks(CP,{custom:true}).some(a=>a.c==="HW-METER"&&a.sev==="stop")'), 'เปิด zero export แต่ CT Huawei ไม่อยู่ที่สายกริด: ข้อความแดง HW-METER');
  ev('CP.cu.at="grid"'); ok(ev('cpLoadRisks(CP,{custom:true}).some(a=>a.c==="HW-METER"&&a.sev==="stop")'), 'Huawei ต่อฝั่ง LOAD แต่ CT อยู่สายกริด ยังเตือนแดง');
  ok(ev('cpCuChecks().some(x=>!x[0]&&x[1].includes("คล้องสายโหลด")&&x[2]==="err")'), 'ตรวจสาย: CT Huawei ที่สายกริดผิด ต้องอยู่สายโหลด');
  ev('CP.cu.at="load";CP.cu.arrow="ok"'); ok(!ev('cpLoadRisks(CP,{custom:true}).some(a=>a.c==="HW-METER")'), 'คล้อง CT Huawei ที่สายโหลดแล้วข้อความแดงหาย');
  ok(ev('cpLoadRisks(CP,{custom:true}).some(a=>a.c==="HW-LIMIT")'), 'มีข้อความ trade-off จำกัดกำลังตามโหลด');
  ok(ev('cpCuChecks().every(x=>x[2]!=="err")'), 'CT Huawei ที่สายโหลด ไม่มีรายการ ✗ แดงเรื่อง CT ออนกริด');
  ev('CP.sc="hw_deye_load";cpReset(CP);CP.ports.src="bload";CP.ports.ct="grid";CP.set.src.anti=true;CP.cu.at="none"');
  ok(/ลดกำลังเป็น 0/.test(ev('cpCuSim()')) && !ev('CP.ports.ct==="none"'), 'ผลจำลองหน้า 6 คิด Huawei = 0 เมื่อมิเตอร์ของ Huawei ไม่อยู่ที่สายกริด โดยไม่แก้ค่าหลัก');
  ok(!errs.filter(e => !/canvas|getContext|not implemented|scrollTo/i.test(e)).length, 'ไม่มี error: ' + errs.join('; '));
  console.log(fail ? 'menu19 FAILED' : 'menu19 OK'); process.exit(fail ? 1 : 0);
}, 800);
