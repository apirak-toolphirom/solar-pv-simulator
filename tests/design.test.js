/* เมนู 22 ออกแบบระบบโซลาร์ (design.html): เปิดหน้าใน jsdom ทดสอบวางแผง ต่อสตริง จำลองพลังงาน และเศรษฐศาสตร์ */
const fs = require('fs'), path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const { eq, done } = require('./lib.js');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'design.html'), 'utf8');
const errs = [], vc = new VirtualConsole();
vc.on('jsdomError', e => errs.push(String(e.message).split('\n')[0].slice(0, 200)));
const noop = new Proxy(function () {}, { get: (t, k) => k === 'measureText' ? () => ({ width: 10 }) : noop, apply: () => noop, set: () => true });
const dom = new JSDOM(html, {
  runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'https://example.github.io/solar-pv-simulator/design.html',
  beforeParse(w) {
    w.HTMLCanvasElement.prototype.getContext = () => noop;
    w.HTMLCanvasElement.prototype.setPointerCapture = () => {};
    w.ResizeObserver = class { observe() {} disconnect() {} };
    w.fetch = () => Promise.reject(new Error('offline'));
    w.Image = class { set src(v) {} };
  }
});
setTimeout(() => {
  const w = dom.window, DS = w.DS, ev = s => w.eval(s);
  eq('โหลดหน้าไม่มี error', errs.filter(e => !/not implemented/i.test(e)).join('|'), '');
  // Plus Code ของภาพตัวอย่าง (อุบลฯ) ต้องถอดได้ใกล้ 15.24, 104.84
  const pc = DS.parseLoc('7VRF+69', 15.24, 104.85);
  eq('Plus Code สั้น 7VRF+69 กู้คืนใกล้อุบลฯ (ละติจูด)', pc && Math.abs(pc.lat - 15.24) < 0.1, true);
  eq('Plus Code สั้น 7VRF+69 กู้คืนใกล้อุบลฯ (ลองจิจูด)', pc && Math.abs(pc.lon - 104.85) < 0.1, true);
  eq('พิกัดทศนิยม', JSON.stringify(DS.parseLoc('13.7563, 100.5018')), '{"lat":13.7563,"lon":100.5018}');
  // หลังคาสี่เหลี่ยม ~ 11.8 × 14 ม. (ใกล้ภาพตัวอย่าง) หันใต้
  const la0 = 15.2447, lo0 = 104.8472, k = Math.cos(la0 * Math.PI / 180) * 111320, h = 111320;
  const pts = [[-5.9, -7], [5.9, -7], [5.9, 7], [-5.9, 7]].map(([x, y]) => [la0 + y / h, lo0 + x / k]);
  const S = DS.S(); S.roof.pts = pts; S.roof.type = 'flat'; S.lay.tilt = 10; S.lay.az = 180; S.lay.setback = 0.5; S.lay.off = {};
  DS.usePanel({ id: 'p650', brand: 't', model: 't', pmax: 650, voc: 53.9, vmp: 44.56, isc: 15.29, imp: 14.59, kVoc: -0.2, kPmax: -0.26, noct: 45, note: '2382×1134×30 mm' });
  DS.setClim({ ghi: [5.0, 5.6, 5.9, 5.9, 5.3, 4.8, 4.6, 4.5, 4.5, 4.7, 4.8, 4.7], t: [25, 27, 29, 30, 29, 28, 28, 28, 27, 27, 26, 24], tmax: [32, 34, 36, 36, 34, 33, 32, 32, 32, 32, 31, 30], tmin: [18, 20, 23, 25, 25, 25, 24, 24, 24, 23, 21, 18] });
  const L = DS.getLayout();
  eq('วางแผงได้มากกว่า 0', L.n > 0, true);
  // ทุกแผงต้องอยู่ในหลังคาและห่างขอบ ≥ ระยะเว้น (ตรวจที่ศูนย์กลางแผง)
  const g = L.g; let bad = 0;
  L.mods.forEach(m => { const a = m.a + m.w / 2, b = m.b + m.d / 2, x = a * L.c + b * L.s, y = -a * L.s + b * L.c; if (Math.abs(x) > 5.9 - 0.5 || Math.abs(y) > 7 - 0.5) bad++; });
  eq('ไม่มีแผงล้ำเขตเว้นขอบ', bad, 0);
  // ระยะแถว: ต้องมากกว่าความลึกแผงตามแนวราบ (มีที่ว่างกันเงา)
  eq('ระยะแถว > ความลึกแผง', L.rp.pitch > L.rp.d, true);
  // ลดระยะเว้นขอบ → แผงต้องไม่น้อยลง
  S.lay.setback = 0.2; const n2 = DS.getLayout().n; S.lay.setback = 0.5; eq('เว้นขอบน้อยลงวางได้ไม่น้อยลง', n2 >= L.n, true);
  // ลบแผง 1 แผง
  const n0 = DS.activeMods().length; S.lay.off[L.mods[0].key] = 1; eq('ลบแผงแล้วนับลดลง 1', DS.activeMods().length, n0 - 1); S.lay.off = {};
  // ออกแบบอัตโนมัติ
  S.grid = '1'; const ok = DS.applyAuto(); eq('ออกแบบอัตโนมัติได้', ok, true);
  const dc = DS.designCheck();
  eq('ต่อแผงครบทุกแผง', dc.conn, DS.activeMods().length);
  eq('ผ่านเงื่อนไขทั้งหมด', dc.ok, true);
  eq('อัตราส่วน DC/AC สมเหตุผล (80–200%)', dc.ratio > 80 && dc.ratio < 200, true);
  // แรงดันสตริงต้องไม่เกิน Vmax
  const V = DS.volts(); dc.rows.forEach(r => { if (r.o.len * V.vocC > dc.inv.vmax) eq('Voc เกิน', 1, 0) });
  // จำลองพลังงาน: ผลิตต่อ kWp ต่อปีในช่วงสมเหตุผลของไทย
  const R = DS.simulate(), y = R.tot.gen / R.kwp;
  eq('ผลิตต่อ kWp ต่อปี 1,200–1,700 kWh', y > 1200 && y < 1700, true);
  console.log('   yield =', y.toFixed(0), 'kWh/kWp · kWp =', R.kwp.toFixed(2), '· modules =', R.N);
  eq('ผลรวมสมดุล: ใช้เอง + ขายคืน = ผลิต', Math.abs(R.tot.self + R.tot.exp - R.tot.gen) < 1, true);
  eq('ใช้เอง + ซื้อ = ใช้ไฟรวม', Math.abs(R.tot.self + R.tot.imp - R.tot.load) < 1, true);
  eq('การใช้ไฟรวม = 5,356 kWh', Math.round(R.tot.load), 5356);
  // เปลี่ยนเป็นหันเหนือ ต้องผลิตน้อยลง
  const gs = R.tot.gen / R.kwp; S.lay.az = 0; DS.set(S); const Rn = DS.simulate(), gn = Rn.tot.gen / Rn.kwp; console.log('   south', gs.toFixed(0), 'north', gn.toFixed(0), 'kWh/kWp, modules', R.N, Rn.N); eq('หันเหนือผลิตต่อ kWp น้อยกว่าหันใต้', gn < gs, true);
  // เศรษฐศาสตร์
  S.lay.az = 180; DS.set(S); DS.applyAuto(); const E = DS.economics();
  eq('ต้นทุน = ราคา/W × กำลังแผง', Math.round(E.cap), Math.round(S.cost.perW * DS.activeMods().length * 650));
  eq('มีผลคืนทุน', E.pay != null && E.pay > 0 && E.pay < 25, true);
  console.log('   capex =', Math.round(E.cap), 'payback =', E.pay && E.pay.toFixed(1), 'NPV =', Math.round(E.npv), 'IRR =', E.irr && (E.irr * 100).toFixed(1) + '%', 'LCOE =', E.lcoe && E.lcoe.toFixed(2));
  S.cons.buy = 0; S.cons.fit = 0; DS.set(S); eq('ไม่มีรายได้ → ไม่คืนทุน', DS.economics().pay, null);
  // วางแผงเอง
  S.lay.off = {}; S.lay.manual = null; DS.set(S); const max = DS.autoGrid().n;
  DS.manualEnter(); eq('เข้าโหมดวางเอง แผงเท่าเดิม', DS.activeMods().length, max);
  S.lay.manual = []; DS.set(S); eq('ล้างแผงแล้วเหลือ 0', DS.activeMods().length, 0);
  eq('เพิ่มแผงกลางหลังคาได้', DS.manualAdd(la0, lo0), true); eq('มี 1 แผง', DS.activeMods().length, 1);
  eq('วางทับตำแหน่งเดิมไม่ได้', DS.manualAdd(la0, lo0), false); eq('ยังมี 1 แผง', DS.activeMods().length, 1);
  eq('วางนอกหลังคาไม่ได้', DS.manualAdd(la0 + 0.01, lo0), false);
  const nf = DS.manualFill(); eq('เติมให้เต็มที่ว่างได้เพิ่ม', nf > 0, true);
  const am = DS.activeMods(); let ov = 0, wd = am[0].w, pitch = DS.getLayout().rp.pitch;
  for (let i = 0; i < am.length; i++) for (let j = i + 1; j < am.length; j++) if (Math.abs(am[i].a - am[j].a) < wd - 1e-6 && Math.abs(am[i].b - am[j].b) < pitch - 1e-6) ov++;
  eq('แผงที่วางไม่ซ้อนกัน', ov, 0); eq('จำนวนแผงไม่เกินที่วางได้โดยประมาณ + 2', am.length <= max + 2, true);
  const before = DS.activeMods().length; eq('ลบแผงที่เลือก', DS.manualDelSel() && DS.activeMods().length === before - 1, true);
  S.lay.manual = [[la0 + 1, lo0]]; DS.set(S); eq('แผงนอกหลังคาถูกทำเครื่องหมายและไม่นับ', DS.getLayout().mods[0].bad && DS.activeMods().length === 0, true);
  DS.manualAuto(); eq('กลับโหมดอัตโนมัติได้แผงสูงสุด', DS.activeMods().length, max);
  // จำกัดกำลังขายคืน: ไฟที่ขายต้องลดลงและไม่เกินเพดานรายชั่วโมง
  S.feedLimit = ''; DS.set(S); const ex0 = DS.simulate().tot.exp; S.feedLimit = 5; DS.set(S); const R5 = DS.simulate();
  eq('จำกัดขายคืน 5 kW ทำให้ไฟขายลดลง', R5.tot.exp < ex0, true);
  eq('ไฟขายคืนต่อปี ≤ 5 kW × ชั่วโมงแสงทั้งปี', R5.tot.exp <= 5 * 4400, true);
  S.feedLimit = ''; DS.set(S);
  // ---- สิ่งกีดขวาง อาคารข้างเคียง ต้นไม้ และเงา ----
  const P = (x, y) => [la0 + y / h, lo0 + x / k], poly = (x0, y0, x1, y1) => [P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)];
  S.obj = []; S.lay.manual = null; S.lay.off = {}; S.feedLimit = ''; DS.set(S); DS.applyAuto();
  const base = DS.simulate(), nBase = DS.activeMods().length, genBase = base.tot.gen;
  eq('ไม่มีวัตถุ → ไม่มีตารางเงา', DS.shadeTab(), null); eq('ไม่มีวัตถุ → เงา 0%', base.tot.shade, 0);
  // เรขาคณิตตรงๆ: อาคารสูง 10 ม. อยู่ทางใต้ห่าง 8–12 ม. จุด (0,0,3) แสงจากใต้
  S.obj = [{ t: 'building', pts: poly(-2, -12, 2, -8), h: 10 }]; DS.set(S); const g0 = DS.getLayout().g, E0 = DS.objXY(g0), vv = a => ({ dx: 0, dy: -Math.cos(a * Math.PI / 180), dz: Math.sin(a * Math.PI / 180) });
  eq('แสงต่ำ 30° ถูกอาคารบัง', DS.blockedAt(g0, E0, 0, 0, 3, vv(30)), 1); eq('แสงสูง 60° ไม่ถูกบัง', DS.blockedAt(g0, E0, 0, 0, 3, vv(60)), 0);
  eq('จุดที่อยู่นอกแนวอาคาร (x=6) ไม่ถูกบัง', DS.blockedAt(g0, E0, 6, 0, 3, vv(30)), 0);
  S.obj = [{ t: 'tree', c: P(0, -5), h: 8, r: 2, th: 2 }]; DS.set(S); const gT = DS.getLayout().g;
  eq('แสงผ่านพุ่มไม้ถูกบังราว 70%', Math.abs(DS.blockedAt(gT, DS.objXY(gT), 0, 0, 1, vv(30)) - 0.7) < 1e-9, true);
  eq('แสงลอดใต้พุ่มไม้ (ต่ำกว่าโคนพุ่ม) ไม่ถูกบัง', DS.blockedAt(gT, DS.objXY(gT), 0, 0, 0.2, vv(5)) < 0.01, true);
  // สิ่งกีดขวางบนหลังคา (ปล่อง 1×1 ม. กลางหลังคา) → แผงไม่ทับ
  S.obj = [{ t: 'obstacle', pts: poly(-0.5, -0.5, 0.5, 0.5), h: 1.5 }]; DS.set(S); DS.applyAuto();
  const nObs = DS.activeMods().length, A1 = DS.autoGrid();
  eq('มีสิ่งกีดขวางกลางหลังคา แผงลดลง', nObs < nBase, true);
  let hit = 0; DS.activeMods().forEach(m => { if (DS.obsHit(A1.O, A1.c, A1.s, m.a, m.b, m.w, m.d)) hit++; }); eq('ไม่มีแผงทับสิ่งกีดขวาง', hit, 0);
  S.lay.manual = []; DS.set(S); eq('วางแผงเองทับสิ่งกีดขวางไม่ได้', DS.manualAdd(la0, lo0), false); eq('วางแผงเองข้างสิ่งกีดขวางได้', DS.manualAdd(la0, lo0 + 3 / k), true);
  S.lay.manual = null; DS.set(S);
  eq('สิ่งกีดขวางเตี้ยบนหลังคา ไม่ทำให้เกิดเงาข้ามแถว (เงา < 8%)', DS.simulate().tot.shade < 8, true);
  // อาคารสูงทางใต้ (บังมาก) เทียบกับทางเหนือ (บังน้อย)
  S.obj = [{ t: 'building', pts: poly(-6, -13, 6, -9), h: 14 }]; S.lay.manual = null; DS.set(S); DS.applyAuto();
  const Rs = DS.simulate(), tab = DS.shadeTab();
  eq('ตารางเงา 12 เดือน × 24 ชม.', tab.length === 12 && tab.every(r => r.length === 24), true);
  eq('อาคารสูงทางใต้ทำให้เสียแสง > 1% ต่อปี', Rs.tot.shade > 1, true);
  eq('ผลิตไฟลดลงเมื่อมีเงา', Rs.tot.gen < genBase, true);
  eq('เงาไม่ลดพลังงานเกินพลังงานที่ได้ทั้งหมด (< 60%)', Rs.tot.shade < 60, true);
  eq('ธ.ค. เสียแสงมากกว่า มิ.ย. (ดวงอาทิตย์ต่ำทางใต้)', Rs.months[11].poaU - Rs.months[11].poa > Rs.months[5].poaU - Rs.months[5].poa, true);
  console.log('   shade south bldg =', Rs.tot.shade.toFixed(1) + '%', 'gen', Math.round(Rs.tot.gen), 'vs', Math.round(genBase));
  S.obj = [{ t: 'building', pts: poly(-6, 9, 6, 13), h: 14 }]; DS.set(S); const RnN = DS.simulate();
  eq('อาคารสูงทางเหนือเสียแสงน้อยกว่าทางใต้', RnN.tot.shade < Rs.tot.shade, true);
  console.log('   shade north bldg =', RnN.tot.shade.toFixed(2) + '%', ' obstacle 1x1: modules', nBase, '->', nObs);
  S.obj = [{ t: 'tree', c: P(0, -9), h: 9, r: 3, th: 2 }]; DS.set(S); const Rt = DS.simulate();
  console.log('   shade tree =', Rt.tot.shade.toFixed(2) + '%', 'gen', Math.round(Rt.tot.gen), 'Dec', (100 * (1 - Rs.months[11].poa / Rs.months[11].poaU)).toFixed(1) + '% (south bldg)');
  eq('ต้นไม้ทางใต้ทำให้เสียแสง > 0 แต่น้อยกว่าอาคารสูง', Rt.tot.shade > 0 && Rt.tot.shade < Rs.tot.shade, true);
  S.obj = []; DS.set(S); DS.applyAuto(); eq('ลบวัตถุแล้วกลับเท่าเดิม', Math.round(DS.simulate().tot.gen), Math.round(genBase)); eq('จำนวนแผงกลับเท่าเดิม', DS.activeMods().length, nBase);
  // เปิดทุกขั้นไม่มี error
  S.cons.buy = 4.4; S.cons.fit = 2.2; DS.set(S); DS.applyAuto();
  ['info', 'load', 'roof', 'layout', 'elec', 'cost', 'report'].forEach((id, i) => { try { DS.go(i) } catch (e) { errs.push(id + ': ' + e.message) } });
  eq('เปิดครบ 7 ขั้นไม่มี error', errs.filter(e => !/not implemented/i.test(e)).join('|'), '');
  done('design');
}, 800);
