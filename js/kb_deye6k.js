/* ---------- article: Deye hybrid inverter 6 kW — On-grid zero export เมื่อมีกริด / Off-grid เมื่อกริดดับ, ช่อง ATS, NG bonding ---------- */
function kbDeyeSvg(){
  const C={p:'#d64545',m:'var(--ink)',L:'#b9791a',N:'#2f7fd0',E:'#2e9e5b',V:'#8e44ad'};
  const ln=(pts,c,d)=>`<polyline points="${pts}" fill="none" stroke="${c}" stroke-width="2" ${d?`stroke-dasharray="${d}"`:''}/>`;
  const dot=(x,y,c)=>`<circle cx="${x}" cy="${y}" r="3" fill="${c}"/>`;
  const T=(x,y,t,s,a,k)=>`<text x="${x}" y="${y}" text-anchor="${a||'middle'}" class="svgt${k?'':' mut'}" font-size="${s||10}"${k?' font-weight="700"':''}>${t}</text>`;
  const box=(x,y,w,h,a,b,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="var(--surface)" stroke="${c||'var(--ink)'}" stroke-width="1.6"/>${T(x+w/2,y+h/2+(b?-1:4),a,9.5,0,1)}${b?T(x+w/2,y+h/2+11,b,9):''}`;
  const fuse=(x,y,w)=>`<rect x="${x-(w||18)/2}" y="${y-4}" width="${w||18}" height="8" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.4"/><line x1="${x-(w||18)/2}" y1="${y}" x2="${x+(w||18)/2}" y2="${y}" stroke="var(--ink)" stroke-width="1"/>`;
  const panel=(x,y)=>`<rect x="${x}" y="${y}" width="60" height="42" rx="3" fill="#2d4f7c" stroke="var(--ink)" stroke-width="1.4"/><path d="M${x+20} ${y}v42M${x+40} ${y}v42M${x} ${y+21}h60" stroke="#9db8d9" stroke-width="1" opacity=".6"/>`;
  const str=(yp,n)=>{const ym=yp+16;return ln(`70,${yp} 330,${yp}`,C.p)+ln(`70,${ym} 330,${ym}`,C.m)+panel(10,yp-13)+T(40,yp+11,'6×650W',8,0,0).replace('class="svgt mut"','class="svgt" fill="#fff"')+fuse(99,yp)+fuse(99,ym)+T(99,yp-9,'ฟิวส์ 6A',8.5)+box(125,yp-10,40,36,'MCB','32A')+dot(330,yp,C.p)+dot(330,ym,C.m)+T(338,yp+13,'PV'+n,9.5,'start')};
  return `<div class="tblwrap"><svg viewBox="0 0 870 510" role="img" aria-label="แผนภาพการต่อ Deye hybrid 6 kW พร้อมฟิวส์ เบรกเกอร์ SPD กราวด์ MTS และช่อง ATS">
  <rect x="0" y="16" width="858" height="5" fill="${C.E}"/>${T(430,11,'บาร์กราวด์ PE → หลักดิน (ลงดินจุดเดียว)',10.5)}
  ${ln('4,173 4,21',C.E,'4 3')}${ln('4,83 10,83',C.E,'4 3')}${ln('4,173 10,173',C.E,'4 3')}
  ${str(75,1)}${str(165,2)}
  ${ln('222,75 222,62',C.p)}${ln('238,91 238,62',C.m)}${dot(222,75,C.p)}${dot(238,91,C.m)}${box(200,44,60,18,'SPD DC')}${ln('230,44 230,21',C.E)}${T(230,116,'SPD 500 V ทำเหมือนกันทุกสตริง',8.5)}
  <rect x="330" y="50" width="210" height="280" rx="8" fill="var(--surface)" stroke="var(--accent)" stroke-width="2"/>${ln('435,50 435,21',C.E)}
  ${T(435,200,'Deye Hybrid 6 kW',13,0,1)}${T(435,218,'MPPT 2 ช่อง + ชาร์จแบต',10)}
  ${T(532,89,'Grid',9.5,'end')}${T(532,169,'Load',9.5,'end')}${T(532,254,'ATS',9.5,'end')}${T(370,318,'BAT',9.5)}
  ${ln('540,80 770,80',C.L)}${ln('540,92 770,92',C.N)}${dot(540,80,C.L)}${dot(540,92,C.N)}
  ${box(560,68,40,36,'Inv','32A')}${box(690,68,40,36,'เมน','2P')}${box(770,62,80,48,'ไฟกริด','TN-C-S')}
  ${dot(660,92,C.N)}${ln('660,92 660,21',C.E)}${T(668,46,'N–PE bonding',9.5,'start')}${T(668,58,'ที่ตู้เมน',9.5,'start')}
  ${dot(625,80,C.L)}${ln('625,80 625,140',C.L)}${dot(640,92,C.N)}${ln('640,92 640,140',C.N)}${T(618,126,'บายพาส',9,'end')}
  ${ln('540,160 610,160',C.L)}${ln('540,172 610,172',C.N)}${dot(540,160,C.L)}${dot(540,172,C.N)}${box(555,148,40,36,'RCBO','32A')}
  ${ln('670,160 770,160',C.L)}${ln('670,172 770,172',C.N)}${box(610,140,60,60,'MTS','1P+1P')}${box(770,148,80,36,'โหลดบ้าน','ที่ต้องสำรอง')}
  ${dot(540,250,C.V)}${ln('540,250 640,250 640,200',C.V,'7 4')}<circle cx="640" cy="225" r="8" fill="#fff" stroke="${C.V}" stroke-width="2.4"/>${T(654,228,'คอยล์',9.5,'start')}
  ${ln('640,250 700,250',C.V,'7 4')}${dot(720,172,C.N)}${ln('720,172 720,234',C.N)}${box(700,234,75,32,'รีเลย์ NG','bonding',C.V)}${ln('775,250 858,250 858,21',C.E)}${T(816,243,'N→PE',9.5)}
  ${ln('360,330 360,420',C.p)}${ln('380,330 380,420',C.m)}${dot(360,330,C.p)}${dot(380,330,C.m)}${box(345,350,50,36,'MCCB','150A')}${fuse(360,402,14)}${fuse(380,402,14)}${T(343,405,'ฟิวส์แบต',9,'end')}${box(335,422,70,40,'LiFePO4','48 V')}
  ${T(440,345,'① มีกริด: กริด → เบรกเกอร์ Inv → ช่อง Grid ทำงาน On-grid zero export',10.5,'start')}
  ${T(440,365,'② กริดดับ: เครื่องสร้างไฟเองออกช่อง Load (Off-grid) ผ่าน MTS ไปโหลด',10.5,'start')}
  ${T(440,385,'③ ช่อง ATS (ม่วง) ขับคอยล์ MTS/ATS และรีเลย์ NG bonding',10.5,'start')}
  ${T(440,405,'④ ตอนมีกริด N ลงดินที่ตู้เมนจุดเดียว ตอน Off-grid รีเลย์ต่อ N→PE แทน',10.5,'start')}
  ${[[10,C.p,'DC +'],[90,C.m,'DC −'],[170,C.L,'L'],[230,C.N,'N'],[290,C.E,'PE'],[360,C.V,'สัญญาณ ATS']].map(([x,c,t])=>ln(`${x},488 ${x+22},488`,c,c===C.V?'7 4':'')+T(x+28,492,t,10,'start')).join('')}
  </svg><p class="hint tight">ภาพวาดอย่างง่ายเพื่อการสอน ตัวเลขเป็นตัวอย่าง ไม่ใช่ข้อกำหนด บนมือถือหมุนจอแนวนอนจะอ่านง่ายขึ้น</p></div>`;
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
${kbDeyeSvg()}<p class="hint tight">อ่านภาพจากซ้ายไปขวา: แผง → ฟิวส์ 6 A → DC MCB 32 A → (SPD ต่อ PE) → ช่อง PV1/PV2 · แบตผ่าน MCCB 150 A และฟิวส์ · ฝั่ง AC กริดผ่านเมน → Inv 32 A → ช่อง Grid, ช่อง Load ผ่าน RCBO → MTS → โหลด</p></section>
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
