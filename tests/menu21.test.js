/* เมนู 21 ตู้โหลด: ตรวจสีสายมาตรฐาน กระแส/เบรกเกอร์/สาย การกระจายกำลังต่อเฟส กราฟแท่ง และการบันทึก/กู้คืน */
const { load, eq, done } = require('./lib');
load().then(({ w, ev, errs }) => {
  const near = (name, got, want, tol = 0.01) => eq(name, Math.abs(got - want) <= tol, true);
  /* สีสายตาม วสท. 2564 ข้อ 5.1.11 */
  eq('สี L1', ev('DB_STD.L1'), 'brown'); eq('สี L2', ev('DB_STD.L2'), 'black'); eq('สี L3', ev('DB_STD.L3'), 'gray');
  eq('สี L (1 เฟส)', ev('DB_STD.L'), 'brown'); eq('สี N', ev('DB_STD.N'), 'blue'); eq('สี PE', ev('DB_STD.PE'), 'gy');
  ev('ACC.enabled=false'); ev('showTab("dbox")');
  /* ตัวอย่าง 1 เฟส 6 ช่อง */
  ev('dbExample()'); ev('dbRender()');
  near('ช่อง 1: LED 12 หลอด + พัดลม 2 ตัว (A)', ev('dbCheck(0).I'), 12 * 18 / (230 * 0.9) + 2 * 75 / (230 * 0.85));
  eq('ช่อง 1 ผ่าน', ev('dbCheck(0).lvl'), 'ok');
  eq('ช่อง 3 แอร์ 12,000 BTU RCBO 20 A สาย 2.5 mm² ผ่าน', ev('dbCheck(2).lvl'), 'ok');
  eq('วงจร 1 เฟส ใช้ตัวนำ L N PE', ev('dbConds(1).join()'), 'L,N,PE');
  /* สายเล็กกว่าเบรกเกอร์ */
  ev('DB.slots[2].w=1.5');
  eq('เบรกเกอร์ 20 A สาย 1.5 mm² (B1 ทน 17.5 A) ผิด', ev('dbCheck(2).lvl'), 'err');
  near('สายขั้นต่ำสำหรับ 20 A (B1)', ev('dbCheck(2).minw'), 2.5);
  ev('DB.slots[2].w=2.5');
  /* เต้ารับบน MCB ธรรมดา เตือนให้ใช้ RCD */
  ev('DB.slots[1].brk="mcb1"'); eq('เต้ารับบน MCB เตือน RCD', ev('dbCheck(1).lvl'), 'warn'); ev('DB.slots[1].brk="rcbo"');
  /* เพิ่ม/ลดอุปกรณ์ */
  ev('dbAddDev(0,"led")'); eq('เพิ่มอุปกรณ์ซ้ำ รวมเป็นจำนวนเดียว', ev('DB.slots[0].devs[0].q'), 13);
  ev('dbAddDev(5,"led")'); eq('ช่องไม่มีเบรกเกอร์ ห้ามใส่อุปกรณ์', ev('DB.slots[5].devs.length'), 0);
  /* กราฟแท่งกำลังต่อเฟส (1 เฟส = 1 แท่ง) */
  ev('dbRender()');
  eq('1 เฟส มี 1 แท่ง', w.document.querySelectorAll('#dbhost .dbcb').length, 1);
  /* 3 เฟส */
  ev('dbSetSys("3")'); ev('DB.n=12');
  ev('DB.slots.forEach(s=>{s.brk="";s.devs=[];s.cw={}})');
  ev('dbSetBrk(0,"rcbo");dbAddDev(0,"ac12")');           /* L1 */
  ev('dbSetBrk(1,"rcbo");dbAddDev(1,"ac18")');           /* L2 */
  ev('dbSetBrk(3,"mcb3");');                              /* ช่อง 4 = L1 ของคอลัมน์ 2 ครอบ 4-6 */
  ev('dbAddDev(3,"m3")');
  eq('MCB 3P ครอบช่อง 5-6', ev('dbTaken(4)&&dbTaken(5)'), true);
  eq('ช่อง 1 อยู่เฟส L1', ev('dbPh(0)'), 'L1'); eq('ช่อง 2 อยู่เฟส L2', ev('dbPh(1)'), 'L2'); eq('ช่อง 3 อยู่เฟส L3', ev('dbPh(2)'), 'L3');
  eq('MCB 3P ใช้ตัวนำ L1 L2 L3 PE', ev('dbConds(3).join()'), 'L1,L2,L3,PE');
  near('มอเตอร์ 3 เฟส 2,800 W pf 0.8 (A)', ev('dbCheck(3).I'), 2800 / (Math.sqrt(3) * 400 * 0.8));
  ev('dbRender()');
  eq('3 เฟส มี 3 แท่ง', w.document.querySelectorAll('#dbhost .dbcb').length, 3);
  const pw = ev('dbSummary().pw');
  near('กำลัง L1 = แอร์ 1,100 + มอเตอร์ 2,800/3', pw[0], 1100 + 2800 / 3, 0.5);
  near('กำลัง L2 = แอร์ 1,700 + มอเตอร์ 2,800/3', pw[1], 1700 + 2800 / 3, 0.5);
  near('กำลัง L3 = มอเตอร์ 2,800/3', pw[2], 2800 / 3, 0.5);
  /* MCB 3P ถูกปฏิเสธเมื่อช่องใต้ไม่ว่าง */
  ev('dbSetBrk(6,"mcb1")'); ev('dbSetBrk(9,"mcb3")'); eq('MCB 3P ที่ช่อง 10 ได้ (ช่อง 11-12 ว่าง)', ev('DB.slots[9].brk'), 'mcb3');
  ev('dbSetBrk(9,"mcb1");dbSetBrk(10,"mcb1")'); ev('dbSetBrk(9,"mcb3")'); eq('MCB 3P ถูกปฏิเสธเมื่อช่อง 11 ใช้อยู่', ev('DB.slots[9].brk'), 'mcb1');
  /* ฝึกเลือกสี */
  ev('DB.mode="practice"; DB.slots[0].cw={L1:"black",N:"blue",PE:"gy"}');
  eq('เลือกสี L1 เป็นดำ ผิด', ev('dbCheck(0).items.some(x=>x.lvl==="err"&&/L1/.test(x.t))'), true);
  ev('DB.slots[0].cw={L1:"brown",N:"blue",PE:"gy"}');
  eq('เลือกสีถูกครบ ไม่มีข้อผิดเรื่องสี', ev('dbCheck(0).items.some(x=>/สี/.test(x.t)&&x.lvl==="err")'), false);
  ev('DB.mode="std"');
  /* เปลี่ยนเป็น 1 เฟส ล้าง MCB 3P และอุปกรณ์ 3 เฟส */
  ev('dbSetSys("1")'); eq('กลับ 1 เฟส ไม่มี MCB 3P', ev('DB.slots.some(s=>s.brk==="mcb3")'), false);
  /* บันทึก / กู้คืน */
  ev('dbExample()'); const snap = ev('JSON.stringify(dbSnapshot())'); ev('DB=DB_DEF()'); ev(`dbRestore(${snap})`);
  eq('กู้คืนครบ', ev('JSON.stringify(dbSnapshot())'), snap);
  ev('dbRestore({sys:"9",n:7,main:3,slots:[{brk:"mcb3",devs:[{id:"zz",q:1}]}]})'); eq('ค่าผิดรูปแบบถูกกรอง', ev('DB.sys+DB.n+DB.main'), '1640');
  eq('ไม่มี error', errs.length, 0);
  done('menu21');
});
