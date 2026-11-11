/* ---------- article: Deye hybrid inverter 6 kW — On-grid zero export เมื่อมีกริด / Off-grid เมื่อกริดดับ, ช่อง ATS, NG bonding ---------- */
function kbDeyeSvg(){
  const bx=(x,y,w,h,t,s,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="var(--surface)" stroke="${c||'var(--line)'}" stroke-width="1.6"/><text x="${x+w/2}" y="${y+h/2+(s?-1:4)}" text-anchor="middle" class="svgt" font-size="11.5" font-weight="600">${t}</text>${s?`<text x="${x+w/2}" y="${y+h/2+12}" text-anchor="middle" class="svgt mut" font-size="9.5">${s}</text>`:''}`;
  const pl=(pts,c,d)=>`<polyline points="${pts}" fill="none" stroke="${c||'var(--ink)'}" stroke-width="2" ${d?`stroke-dasharray="${d}"`:''}/>`;
  const port=(x,y,t)=>`<circle cx="${x}" cy="${y}" r="4.5" fill="var(--accent)"/><text x="${x}" y="${y-9}" text-anchor="middle" class="svgt mut" font-size="9.5">${t}</text>`;
  const V='#8e44ad';
  return `<div class="tblwrap"><svg viewBox="0 0 640 265" role="img" aria-label="แผนภาพทางเดินไฟของ Deye hybrid 6 kW มีกริด ไฟดับ และช่อง ATS">
   ${bx(6,60,74,40,'กริด','TN-C-S')}${bx(130,60,74,40,'เบรกเกอร์','Inv 32 A')}${bx(250,20,170,100,'Deye Hybrid 6 kW','','var(--accent)')}
   ${port(280,120,'Grid')}${port(335,120,'Load')}${port(390,120,'ATS')}
   <text x="335" y="42" text-anchor="middle" class="svgt mut" font-size="9.5">แผง PV1/PV2 + แบต</text>
   ${bx(470,142,74,40,'MTS','หรือ ATS')}${bx(560,142,74,40,'โหลด','ผ่าน RCBO')}
   ${pl('80,80 130,80')}${pl('204,80 240,80 240,150 280,150 280,124')}
   ${pl('335,124 335,160 470,160')}${pl('544,162 560,162')}
   ${pl('167,100 167,206 507,206 507,182','var(--warn)')}
   <text x="260" y="200" class="svgt mut" font-size="9.5" fill="var(--warn)">สายบายพาส (เมื่อปิดโซลาร์) เข้า MTS</text>
   ${pl('390,124 390,135 507,135 507,142',V,'7 4')}
   <circle cx="450" cy="135" r="8" fill="#fff" stroke="${V}" stroke-width="2.4"/><text x="450" y="124" text-anchor="middle" class="svgt mut" font-size="9.5">คอยล์</text>
   <text x="8" y="236" class="svgt mut" font-size="10.5">มีกริด: ผ่านช่อง Grid ทำงาน On-grid zero export · กริดดับ: เครื่องสร้างไฟเองออกช่อง Load (Off-grid)</text>
   <text x="8" y="254" class="svgt mut" font-size="10.5" fill="${V}">เส้นประม่วง = ช่อง ATS จ่ายไฟให้คอยล์ของ MTS/ATS หรือรีเลย์ NG bonding</text>
   </svg><p class="hint tight">ภาพวาดอย่างง่ายเพื่อการสอน ไม่ใช่แผนภาพวงจรจริง ตัดสายดิน N bonding SPD และส่วน DC ออก</p></div>`;
}
kbAdd({id:'deye-6kw-hybrid',cat:'pv',upd:'2026-11-11',
  title:'Deye hybrid inverter 6 kW: On-grid zero export, Off-grid เมื่อกริดดับ, ช่อง ATS และ NG bonding',
  summary:'หลักการทำงานของ Deye hybrid 6 kW มีกริดจะ zero export ในตัว กริดดับจึงสร้างไฟเอง การเปิด ATS dip switch เพื่อขับ ATS หรือ NG bonding relay และวงจรตัวอย่าง 6 แบบ',
  tags:['Deye','Hybrid','6kW','SUN-6K','On-grid','Off-grid','zero export','ATS','dip switch','NG bonding','N-PE','MTS','contactor','power relay','TN-C-S','NN bonding','PV1','PV2','คอยล์'],
  related:[['deye','18 Deye Commissioning'],['accouple','19 AC Coupling (GEN port)'],['ac','04 ต่อสาย AC ระบบ']],
  body:()=>`<section class="kbsec"><h2>หลักการทำงาน</h2>
<ul class="kbol">
<li><b>มีไฟกริดเข้าเครื่อง</b> เครื่องทำงานเป็น <b>On-grid แบบ zero export</b> ในตัว ซึ่งกันไฟย้อนออกกริดโดยไม่ต้องติดอุปกรณ์กันย้อนเพิ่ม โหลดได้ไฟจากแผง แบต และกริดผสมกัน</li>
<li><b>ไม่มีไฟกริดหรือไฟกริดดับ</b> เครื่องสร้างสัญญาณไฟ AC เองแบบ <b>Off-grid</b> จ่ายออกทางช่อง Load เท่านั้น จึงเป็นไฟสำรองอัตโนมัติ</li>
<li>ที่เครื่องมีช่องต่อ AC 3 ชุด คือ <b>Grid</b> (รับไฟกริด) <b>Load</b> (จ่ายโหลด) และ <b>ATS</b> (ใช้ขับอุปกรณ์สลับไฟภายนอก)</li>
</ul>
${kbDeyeSvg()}</section>
<section class="kbsec"><h2>ช่อง ATS และ dip switch</h2>
<ul class="kbol">
<li>เปิด <b>ATS dip switch เป็น ON</b> เพื่อให้เครื่องจ่ายไฟออกช่อง ATS ไปให้คอยล์ของอุปกรณ์สลับไฟ (ATS) ทำงาน เช่น คอนแทคเตอร์ รีเลย์กำลัง หรือคอนแทคเตอร์บ้าน</li>
<li>ใช้ช่อง ATS นี้ขับ <b>รีเลย์ NG bonding</b> ตอนเครื่องอยู่โหมด Off-grid ได้ด้วย เพื่อต่อ N ลงดิน ให้ไฟมาเส้นเดียว (จุดลงดินจุดเดียว)</li>
<li>เหตุผล: ตอนมีกริด N ลงดินที่ตู้เมนอยู่แล้ว (ต่อ N ของพอร์ต Grid กับ Load เข้าด้วยกัน = NN bonding) พอกริดดับหรือปิดเมน การลงดินที่ตู้เมนหายไป ต้องมีรีเลย์ต่อ N เข้ากับสายดินเฉพาะตอน Off-grid เพื่อไม่ให้ลงดิน 2 จุดพร้อมกัน</li>
<li>เงื่อนไขการจ่ายไฟของช่อง ATS และพิกัดคอยล์ ตรวจกับคู่มือ Deye รุ่นที่ใช้ทุกครั้ง</li>
</ul></section>
<section class="kbsec"><h2>วงจรตัวอย่าง 6 แบบ</h2>
<div class="tblwrap"><table class="t kbt kbwide"><thead><tr><th>วงจร</th><th>ใช้ทำอะไร</th></tr></thead><tbody>
<tr><th>1.0 · On-off grid + MTS</th><td>ต่อช่อง Grid ผ่านเบรกเกอร์ Inv 32 A และช่อง Load ผ่าน RCBO/RCCB 32 A ไปโหลด ใช้ MTS 1P,1P 50 A สลับโหลดไปรับไฟกริดตรงเมื่อปิดระบบโซลาร์ ตั้งแบบ มีกริด = On-grid zero export, กริดดับ = Off-grid มี NN bonding</td></tr>
<tr><th>1.1 · On-off grid + MTS + NG bonding relay</th><td>เหมือน 1.0 และเพิ่มรีเลย์ NG bonding ที่คอยล์ต่อกับช่อง ATS เพื่อต่อ N ลงดินเฉพาะตอน Off-grid</td></tr>
<tr><th>1.2 · Off-grid + MTS</th><td>ไม่ต่อช่อง Grid ("No grid input") ใช้ช่อง Load จ่ายโหลดอย่างเดียว MTS 1P,1P 32 A สลับระหว่างกริดตรงกับไฟจากเครื่อง</td></tr>
<tr><th>1.3 · Off-grid + ATS power relay 1NO 1NC</th><td>สลับด้วย power relay 1Z 80 A คอยล์ 220 V ต่อกับช่อง ATS</td></tr>
<tr><th>1.4 · Off-grid + ATS home contactor</th><td>สลับด้วยคอนแทคเตอร์บ้าน 63 A คอยล์ 230 V 1NO 1NC ต่อกับช่อง ATS</td></tr>
<tr><th>1.5 · Off-grid + ATS magnetic contactor</th><td>สลับด้วยแมกเนติกคอนแทคเตอร์ คอยล์ 220 V ขั้ว A1 A2 ต่อกับช่อง ATS</td></tr>
</tbody></table></div>
<p class="hint tight">ส่วนที่เหมือนกันในตัวอย่างทั้ง 6 แบบ: แผง 2 สตริง สตริงละ 6 × 650 W = 3,900 W เข้า PV1 และ PV2, DC MCB 32 A และฟิวส์ DC 6 A ต่อสตริง, DC SPD 500 V, สาย DC เข้าแบตขนาด 50 ตร.มม. ผ่าน DC MCCB 150 A, สาย AC 6 ตร.มม. และสายดินแผง 16 ตร.มม. ตัวเลขเป็นตัวอย่างของผู้ออกแบบ ไม่ใช่ข้อกำหนด ต้องคำนวณตามภาระและ<a href="#library/rcd-vs-mcb">มาตรฐาน วสท.</a> ก่อนติดตั้งจริง</p></section>
<section class="kbsec"><h2>ข้อควรตรวจก่อนติดตั้ง</h2>
<ul class="kbol">
<li>ถ้าไม่ใช้ NG bonding relay ต้องต่อ NN bonding ให้ถูกวิธีตามคู่มือและตามระบบ TN-C-S ห้ามลงดิน N เพิ่มโดยไม่ผ่านรีเลย์</li>
<li>อุปกรณ์สลับไฟ (MTS / คอนแทคเตอร์ / รีเลย์) ต้องรับกระแสโหลดได้และแรงดันคอยล์ตรงกับช่อง ATS</li>
<li>แบบ Off-grid ไม่ต่อช่อง Grid ให้จัดการให้ไฟกริดกับไฟจากเครื่องไม่เข้าโหลดพร้อมกัน (MTS หรือ ATS ต้องเป็นแบบสลับ ไม่ใช่ขนาน)</li>
<li>ตั้ง Work mode และการขายไฟของเครื่องให้ตรงกับที่การไฟฟ้าอนุญาต ดูเมนู 18 และ 19</li>
</ul></section>
<section class="kbsec"><h2>ทบทวน</h2>
<div class="kbq" data-ans="b"><p>1. Deye hybrid 6 kW ทำงานอย่างไรเมื่อมีไฟกริดเข้าเครื่อง</p>
 <div class="chips"><button type="button" class="chip" data-o="a">Off-grid สร้างไฟเอง</button><button type="button" class="chip" data-o="b">On-grid แบบ zero export กันย้อนในตัว</button><button type="button" class="chip" data-o="c">ขายไฟคืนกริดเต็มกำลัง</button></div>
 <p class="kbqx" data-t="มีกริดเข้าเครื่อง จะทำงานแบบ On-grid zero export ในตัว ส่วนการสร้างไฟเองแบบ Off-grid จะเกิดตอนไม่มีกริดหรือกริดดับเท่านั้น" hidden></p></div>
<div class="kbq" data-ans="c"><p>2. เปิด ATS dip switch เป็น ON เพื่ออะไร</p>
 <div class="chips"><button type="button" class="chip" data-o="a">เพิ่มกำลังขายไฟ</button><button type="button" class="chip" data-o="b">ต่อแบตขนาน</button><button type="button" class="chip" data-o="c">ให้ช่อง ATS จ่ายไฟขับคอยล์ของ ATS หรือรีเลย์ NG bonding</button></div>
 <p class="kbqx" data-t="ช่อง ATS ใช้จ่ายไฟขับคอยล์ของอุปกรณ์สลับไฟ หรือรีเลย์ NG bonding ตอน Off-grid" hidden></p></div>
<div class="kbq" data-ans="a"><p>3. ทำไมต้องมี NG bonding relay ตอน Off-grid</p>
 <div class="chips"><button type="button" class="chip" data-o="a">ตอนกริดดับ การลงดินที่ตู้เมนหายไป ต้องต่อ N ลงดินจุดเดียวโดยไม่ลงซ้ำกับตอนมีกริด</button><button type="button" class="chip" data-o="b">เพิ่มแรงดันขาออก</button><button type="button" class="chip" data-o="c">ลดการใช้แบต</button></div>
 <p class="kbqx" data-t="ระบบ TN-C-S ต้องลงดินจุดเดียว ตอนมีกริด N ลงดินที่ตู้เมน ตอน Off-grid รีเลย์จึงต่อ N เข้าสายดินแทน และไม่ต่อพร้อมกัน" hidden></p></div>
<div class="kbq" data-ans="b"><p>4. วงจรแบบ Off-grid ที่ไม่ต่อช่อง Grid ต้องระวังอะไรเป็นพิเศษ</p>
 <div class="chips"><button type="button" class="chip" data-o="a">ไม่ต้องมีเบรกเกอร์</button><button type="button" class="chip" data-o="b">อุปกรณ์สลับต้องเป็นแบบสลับ เพื่อไม่ให้ไฟกริดกับไฟจากเครื่องเข้าโหลดพร้อมกัน</button><button type="button" class="chip" data-o="c">ต้องต่อ CT</button></div>
 <p class="kbqx" data-t="ไฟสองแหล่งที่ไม่ซิงก์ห้ามเข้าโหลดพร้อมกัน MTS หรือ ATS ต้องเป็นแบบตัดอันหนึ่งก่อนต่ออีกอัน" hidden></p></div>
</section>
<section class="kbsec kbsrc"><h2>ที่มาของข้อมูล</h2>
<p class="hint tight">สรุปและเรียบเรียงใหม่จากแผนภาพวงจร Deye 6 kW ของคุณ Kittikorn T. (เพจ "คุ้มค่าไปกับโซลาร์เซลล์") และคำอธิบายการทำงานของผู้ใช้โปรแกรม แผนภาพในบทความนี้วาดขึ้นใหม่อย่างง่ายเพื่อการสอน ไม่ได้ใช้ภาพต้นฉบับ รายละเอียดของช่อง ATS และ dip switch ตรวจกับคู่มือ Deye รุ่นที่ใช้</p></section>`,
  init:el=>{kbQuiz(el);return null}
});
