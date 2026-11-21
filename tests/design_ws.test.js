/* ใบงาน W18: เกณฑ์ design_roof / design_ok / design_clim อ่านจาก window.lastDESIGN ที่หน้าออกแบบส่งมา */
const { load, eq, done } = require('./lib');
load().then(({ w, ev }) => {
  const r = k => ev(`wsCrit(${JSON.stringify(k)})[1]`);
  w.lastDESIGN = null;
  eq('ยังไม่เปิดเมนู: วางแผงไม่ผ่าน', r('design_roof'), false);
  eq('ยังไม่เปิดเมนู: ออกแบบไฟฟ้าไม่ผ่าน', r('design_ok'), false);
  w.lastDESIGN = { modules: 6, kwp: 3.9, seen: false, stringsOk: true, climSrc: 'fallback' };
  eq('มีแผงแล้ว: วางแผงผ่าน', r('design_roof'), true);
  eq('ยังไม่เปิดขั้นไฟฟ้า: ไม่ผ่านแม้ stringsOk', r('design_ok'), false);
  eq('ใช้ตารางสำรอง: ข้อมูลจริงไม่ผ่าน', r('design_clim'), false);
  w.lastDESIGN = { modules: 6, kwp: 3.9, seen: true, stringsOk: true, climSrc: 'nasa' };
  eq('เปิดขั้นไฟฟ้าและผ่านทุกข้อ', r('design_ok'), true);
  eq('ข้อมูล NASA ผ่าน', r('design_clim'), true);
  eq('W18 อยู่ในรายการใบงาน', ev(`WS_DEFAULT.some(x=>x.id==='W18'&&x.tabs==='design')`), true);
  done('design_ws');
});
