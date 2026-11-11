/* ---------- article: วงจรแผง PV ควรต่อแบบไหน — string combiner (ฝั่งแผง) กับตู้ DC ฝั่งอินเวอร์เตอร์ ---------- */
function kbPvCircSvg(){
  const C={p:'#d64545',m:'var(--ink)',E:'#2e9e5b'};
  const ln=(pts,c,d)=>`<polyline points="${pts}" fill="none" stroke="${c}" stroke-width="2" ${d?`stroke-dasharray="${d}"`:''}/>`;
  const dot=(x,y,c)=>`<circle cx="${x}" cy="${y}" r="3" fill="${c}"/>`;
  const T=(x,y,t,s,a,k)=>`<text x="${x}" y="${y}" text-anchor="${a||'middle'}" class="svgt${k?'':' mut'}" font-size="${s||10}"${k?' font-weight="700"':''}>${t}</text>`;
  const box=(x,y,w,h,a,b)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.6"/>${T(x+w/2,y+h/2+(b?-1:4),a,9.5,0,1)}${b?T(x+w/2,y+h/2+11,b,9):''}`;
  const fuse=(x,y,w)=>`<rect x="${x-(w||18)/2}" y="${y-4}" width="${w||18}" height="8" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.4"/><line x1="${x-(w||18)/2}" y1="${y}" x2="${x+(w||18)/2}" y2="${y}" stroke="var(--ink)" stroke-width="1"/>`;
  const panel=(x,y)=>`<rect x="${x}" y="${y}" width="60" height="42" rx="3" fill="#2d4f7c" stroke="var(--ink)" stroke-width="1.4"/><path d="M${x+20} ${y}v42M${x+40} ${y}v42M${x} ${y+21}h60" stroke="#9db8d9" stroke-width="1" opacity=".6"/><text x="${x+30}" y="${y+25}" text-anchor="middle" class="svgt" style="fill:#fff" font-size="8">แผง</text>`;
  const cont=(x,y,w,h,t)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="none" stroke="var(--line)" stroke-width="1.5" stroke-dasharray="5 4"/>${T(x+8,y+14,t,10,'start')}`;
  const spd=(xp,xm,y,fy)=>`${ln(`${xp},${y} ${xp},${fy+60}`,C.p)}${ln(`${xm},${y+16} ${xm},${fy+60}`,C.m)}${dot(xp,y,C.p)}${dot(xm,y+16,C.m)}${fuse(xp,fy,14)}${fuse(xm,fy,14)}${box(xp-14,fy+34,xm-xp+28,22,'SPD DC')}${T(xm+14,fy+4,'ฟิวส์ 4–6 A',9,'start')}`;
  /* A: string combiner near the panels, 3 strings */
  const ys=[60,130,200];
  const A=`<svg viewBox="0 0 870 440" role="img" aria-label="แผนภาพวงจรที่ 1 ตู้ string combiner ใกล้แผง สามสตริงขึ้นไป มีฟิวส์อนุกรมทุกสตริง">
  <rect x="0" y="420" width="858" height="5" fill="${C.E}"/>${T(430,437,'บาร์กราวด์ PE',10)}
  ${cont(84,14,340,350,'ตู้ string combiner (ติดใกล้แผง)')}
  ${ys.map((y,i)=>ln(`70,${y} 210,${y}`,C.p)+ln(`70,${y+16} 230,${y+16}`,C.m)+panel(10,y-13)+fuse(110,y)+fuse(110,y+16)+dot(210,y,C.p)+dot(230,y+16,C.m)+T(135,y-8,'สตริง '+(i+1)+' + ฟิวส์',9,'start')).join('')}
    ${ln('210,60 210,250 330,250',C.p)}${ln('230,76 230,266 330,266',C.m)}
  ${ln('4,420 4,60',C.E,'4 3')}${[83,153,223].map(y=>ln(`4,${y} 10,${y}`,C.E,'4 3')).join('')}
  ${spd(290,310,250,300)}${ln('300,356 300,420',C.E)}
  ${ln('330,250 440,250',C.p)}${ln('330,266 440,266',C.m)}${box(436,240,58,36,'MCB','หรือ ISOL.')}${ln('490,250 640,250',C.p)}${ln('490,266 640,266',C.m)}
  ${T(640,246,'ไปตู้ฝั่งอินเวอร์เตอร์',10,'end')}${T(640,284,'(สายยาว)',10,'end')}
  ${T(450,60,'ใช้เมื่อมี 3 สตริงขึ้นไปขนานกัน',11,'start',1)}${T(450,80,'ถ้าสตริงหนึ่งลัดวงจร กระแสจากสตริงที่เหลือ',10.5,'start')}${T(450,96,'ย้อนเข้าสตริงนั้น ฟิวส์ต้องตัดก่อนเกินพิกัดแผง',10.5,'start')}
  ${[[10,C.p,'DC +'],[90,C.m,'DC −'],[170,C.E,'PE']].map(([x,c,t])=>ln(`${x},395 ${x+22},395`,c)+T(x+28,399,t,10,'start')).join('')}
  </svg>`;
  /* B: house system, 1-2 strings: MCB first, SPD with fuse on inverter side */
  const B=`<svg viewBox="0 0 870 360" role="img" aria-label="แผนภาพวงจรที่ 2 ระบบบ้าน 1-2 สตริง สายยาวเข้า DC MCB ก่อน แล้วขนาน SPD ที่มีฟิวส์ฝั่งอินเวอร์เตอร์">
  <rect x="0" y="340" width="858" height="5" fill="${C.E}"/>${T(430,357,'บาร์กราวด์ PE',10)}
  ${panel(10,87)}${ln('70,100 270,100',C.p)}${ln('70,116 270,116',C.m)}${T(80,84,'สายยาวจากหลังคา',10,'start')}
  ${ln('4,340 4,100',C.E,'4 3')}${ln('4,108 10,108',C.E,'4 3')}
  ${cont(262,40,420,270,'ตู้ DC ในบ้าน (ใกล้อินเวอร์เตอร์)')}
  ${ln('270,100 690,100',C.p)}${ln('270,116 690,116',C.m)}${box(296,88,66,40,'DC MCB','32A')}
  ${spd(470,490,100,150)}${ln('480,206 480,340',C.E)}
  ${box(690,70,150,76,'Inverter','PV1')}${dot(690,100,C.p)}${dot(690,116,C.m)}
  ${T(296,146,'อุปกรณ์แรกที่สายเจอ',10,'start',1)+T(296,160,'(MCB หรือ isolator)',10,'start')}${T(300,66,'',9)}
  ${T(120,200,'สตริง 2 ต่อแบบเดียวกัน',10)}${T(120,216,'(แยก MCB เข้าช่อง PV2)',10)}
  ${T(300,250,'ไม่ต้องมีฟิวส์อนุกรมสตริง เมื่อมี 1–2 สตริง',11,'start',1)}${T(300,268,'ตัดด้วย MCB ได้ทั้งวงจรด้านหลัง · ฟิวส์ 4–6 A มีไว้ตัด SPD ที่เสื่อมหรือช็อตลงดิน',10.5,'start')}
  ${[[10,C.p,'DC +'],[90,C.m,'DC −'],[170,C.E,'PE']].map(([x,c,t])=>ln(`${x},318 ${x+22},318`,c)+T(x+28,322,t,10,'start')).join('')}
  </svg>`;
  return {A,B};
}
kbAdd({id:'pv-circuit-combiner',cat:'pv',upd:'2026-11-11',
  title:'วงจรแผง PV ควรต่อแบบไหน: string combiner, DC MCB, SPD มีฟิวส์ และการเลือกฟิวส์สตริง',
  summary:'เทียบวงจรฝั่งแผง (ตู้รวมสตริงเมื่อมี 3 สตริงขึ้นไป) กับวงจรฝั่งอินเวอร์เตอร์ (DC MCB แล้วขนาน SPD ที่มีฟิวส์) ระบบบ้าน 1–2 สตริงควรต่ออย่างไร สูตรเลือกฟิวส์ 1.25×Isc พร้อมตัวอย่างคำนวณ',
  tags:['PV','string combiner','ฟิวส์สตริง','DC MCB','isolator','SPD','ฟิวส์ SPD','กราวด์','Isc','max fuse rating','ไฟย้อน','reverse current','ABB','สายยาว','1.25×Isc'],
  related:[['wiring','03 ต่อสาย DC แผง'],['cable','06 สายไฟและเบรกเกอร์'],['pv','07 จำลองแผง']],
  body:()=>{const d=kbPvCircSvg();return `<section class="kbsec"><h2>ภาพรวม: มี 2 วง ไม่ใช่วงเดียว</h2>
<ul class="kbol">
<li><b>วงที่ 1 ตู้ string combiner</b> ติดใกล้แผง ใช้รวมสตริงขนานกันตั้งแต่ <b>3 สตริงขึ้นไป</b> แต่ละสตริงมีฟิวส์อนุกรม มี SPD พร้อมฟิวส์ลงดิน และมีสวิตช์หรือ MCB ที่สายออกตัวสุดท้าย แล้วลากสายยาวไปตู้ที่สอง</li>
<li><b>วงที่ 2 ตู้ฝั่งอินเวอร์เตอร์</b> สายยาวเข้า <b>DC MCB หรือ DC isolator ก่อน</b> แล้วจึงขนาน SPD ที่มีฟิวส์ไว้ตัดวงจรเมื่อ SPD เสื่อม แล้วเข้าอินเวอร์เตอร์</li>
<li><b>ระบบบ้านที่มี 1–2 สตริง ใช้เฉพาะวงที่ 2</b> วงที่ 1 ไม่จำเป็น</li>
</ul></section>
<section class="kbsec"><h2>วงที่ 1 ตู้ string combiner (3 สตริงขึ้นไป)</h2>
<div class="tblwrap">${d.A}</div>
<p>เหตุผลที่ต้องมีฟิวส์ต่อสตริง: ถ้าสตริงหนึ่งเสีย (ลัดวงจรหรือลงดิน) สตริงที่เหลือจะส่งกระแสย้อนเข้าไป กระแสนี้คือ (จำนวนสตริง − 1) × Isc ถ้าเกิน <b>max fuse rating</b> ของแผง สายและแผงอาจร้อนจนไหม้ได้ ฟิวส์อนุกรมจึงต้องตัดก่อน</p></section>
<section class="kbsec"><h2>วงที่ 2 ระบบบ้าน 1–2 สตริง</h2>
<div class="tblwrap">${d.B}</div>
<ul class="kbol">
<li>สายที่ลากจากแผงเข้ามาในบ้านควรเจอ <b>MCB (หรือ isolator) เป็นอุปกรณ์แรก</b> การตัดด้วย MCB ตัดวงจรทั้งหมดด้านหลังมัน ปลอดภัยกว่าให้สายยาวต่อตรงเข้าอุปกรณ์อื่นก่อน</li>
<li>กระแสย้อนจาก 1 สตริงที่เหลือเท่ากับ Isc ของแผงเอง ไม่เกิน max fuse rating จึงไม่ต้องมีฟิวส์อนุกรมสตริง</li>
<li>SPD ต่อขนานหลัง MCB พร้อม <b>ฟิวส์ 4–6 A</b> ของ SPD เอง ถ้า SPD เสื่อมหรือช็อตลงดิน ฟิวส์ตัด SPD ออกจากวงจรโดยไม่ต้องตัดระบบทั้งหมด</li>
<li>ขั้ว PE ของ SPD ต่อเข้าบาร์กราวด์ เฟรมแผงต่อลงดินด้วย</li>
</ul></section>
<section class="kbsec"><h2>เลือกพิกัดฟิวส์สตริง (กรณีวงที่ 1)</h2>
<div class="tblwrap"><table class="t kbt"><thead><tr><th>รายการ</th><th>เกณฑ์</th><th>ตัวอย่างตัวเลข</th></tr></thead><tbody>
<tr><th>พิกัดฟิวส์ขั้นต่ำ</th><td>≥ 1.25 × Isc ของแผง</td><td>Isc 13.9 A → 1.25 × 13.9 = 17.4 A</td></tr>
<tr><th>พิกัดฟิวส์สูงสุด</th><td>&lt; max fuse rating ในแผ่นข้อมูลแผง</td><td>max fuse rating 25 A → เลือกฟิวส์ 20 A ได้ (17.4 ≤ 20 &lt; 25)</td></tr>
<tr><th>กระแสย้อนเมื่อสตริงหนึ่งเสีย</th><td>(จำนวนสตริง − 1) × Isc</td><td>3 สตริง: 2 × 13.9 = 27.8 A เกิน 25 A ต้องมีฟิวส์ · 2 สตริง: 13.9 A ไม่เกิน</td></tr>
<tr><th>ฟิวส์ของ SPD</th><td>ประมาณ 4–6 A</td><td>เลือก 6 A ตามที่ผู้ผลิต SPD แนะนำถ้ามี</td></tr>
</tbody></table></div>
<p class="hint tight">ตัวเลข Isc และ max fuse rating เป็นตัวอย่างเพื่อให้เห็นวิธีคิด ต้องอ่านจากแผ่นข้อมูลแผงรุ่นที่ใช้จริง ฟิวส์ต้องเป็นชนิด DC (gPV) ที่พิกัดแรงดันไม่ต่ำกว่า Voc ของสตริง และดูข้อกำหนดของมาตรฐานที่ใช้ประกอบ</p></section>
<section class="kbsec"><h2>ข้อผิดพลาดที่พบบ่อย</h2>
<ul class="kbol">
<li>ปล่อยสายยาวจากหลังคาเข้าอุปกรณ์อื่นก่อน MCB ทำให้ถ้าสายมีปัญหาไม่มีอะไรตัดได้</li>
<li>ใส่ฟิวส์สตริงในระบบ 1–2 สตริงโดยไม่จำเป็น เพิ่มจุดต่อและจุดร้อน แต่ไม่ได้เพิ่มความปลอดภัย</li>
<li>ใช้ฟิวส์พิกัดสูงเกิน max fuse rating ของแผงในระบบ 3 สตริงขึ้นไป ฟิวส์จึงไม่ตัดทันเวลา</li>
<li>ต่อ SPD โดยไม่มีฟิวส์ ถ้า SPD เสื่อมจะช็อตค้างอยู่ในวงจร</li>
<li>ขันขั้วต่อหลวม ทำให้จุดต่อร้อน ควรตรวจด้วยกล้องความร้อนหลังติดตั้งและตรวจซ้ำเป็นระยะ</li>
</ul></section>
<section class="kbsec"><h2>ทบทวน</h2>
<div class="kbq" data-ans="b"><p>1. ระบบบ้านที่มี 2 สตริง สายยาวจากหลังคาควรเจออะไรเป็นอุปกรณ์แรกในตู้ในบ้าน</p>
 <div class="chips"><button type="button" class="chip" data-o="a">SPD</button><button type="button" class="chip" data-o="b">DC MCB หรือ DC isolator</button><button type="button" class="chip" data-o="c">ฟิวส์ 4–6 A</button></div>
 <p class="kbqx" data-t="MCB เป็นอุปกรณ์แรกเพื่อให้ตัดวงจรทั้งหมดด้านหลังได้ แล้วจึงขนาน SPD ที่มีฟิวส์" hidden></p></div>
<div class="kbq" data-ans="c"><p>2. ทำไมระบบ 3 สตริงขนานจึงต้องมีฟิวส์อนุกรมทุกสตริง</p>
 <div class="chips"><button type="button" class="chip" data-o="a">เพื่อเพิ่มแรงดัน</button><button type="button" class="chip" data-o="b">เพื่อลดค่าไฟ</button><button type="button" class="chip" data-o="c">สตริงที่เสียจะได้กระแสย้อนจากอีก 2 สตริงซึ่งอาจเกิน max fuse rating ของแผง</button></div>
 <p class="kbqx" data-t="กระแสย้อน = (จำนวนสตริง − 1) × Isc ถ้าเกิน max fuse rating แผงและสายอาจไหม้ ฟิวส์ต้องตัดก่อน" hidden></p></div>
<div class="kbq" data-ans="a"><p>3. แผง Isc 10 A ฟิวส์สตริงขั้นต่ำตามสูตร 1.25 × Isc คือเท่าไร</p>
 <div class="chips"><button type="button" class="chip" data-o="a">12.5 A ขึ้นไป (เลือกขนาดมาตรฐานถัดไป เช่น 15 A ถ้าไม่เกิน max fuse rating)</button><button type="button" class="chip" data-o="b">5 A</button><button type="button" class="chip" data-o="c">40 A</button></div>
 <p class="kbqx" data-t="1.25 × 10 = 12.5 A ต้องไม่ต่ำกว่านี้ และต้องต่ำกว่า max fuse rating ของแผง" hidden></p></div>
<div class="kbq" data-ans="b"><p>4. ฟิวส์ 4–6 A ที่ต่ออนุกรมกับ SPD มีไว้ทำอะไร</p>
 <div class="chips"><button type="button" class="chip" data-o="a">ป้องกันกระแสโหลด</button><button type="button" class="chip" data-o="b">ตัด SPD ออกจากวงจรเมื่อ SPD เสื่อมหรือช็อตลงดิน</button><button type="button" class="chip" data-o="c">เพิ่มประสิทธิภาพแผง</button></div>
 <p class="kbqx" data-t="SPD ที่เสื่อมอาจช็อตค้าง ฟิวส์เล็กจึงตัด SPD ออกโดยไม่ต้องหยุดทั้งระบบ" hidden></p></div>
</section>
<section class="kbsec kbsrc"><h2>ที่มาของข้อมูล</h2>
<p class="hint tight">เรียบเรียงใหม่จากโพสต์อธิบายวงจรแผง PV ของผู้ใช้ (Facebook, #solar #solarcell) ซึ่งอ้างภาพวงจรจากแคตตาล็อก ABB "ABB solutions for solar energy – Low Voltage Products" และแผ่นข้อมูล DC SPD Type 2 ของผู้ผลิต แผนภาพในบทความนี้วาดขึ้นใหม่เพื่อการสอน ไม่ได้ใช้ภาพต้นฉบับ ตัวเลขตัวอย่างเป็นของผู้เขียนบทความนี้ ให้ตรวจกับแผ่นข้อมูลแผงและมาตรฐานก่อนใช้จริง</p></section>`},
  init:el=>{kbQuiz(el);return null}
});
