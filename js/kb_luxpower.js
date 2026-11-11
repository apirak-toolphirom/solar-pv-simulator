/* ---------- article: Hybrid inverter 6 kW — Off-grid (มี MTS) กับ On-grid (ขนานกริด) ในระบบ TN-C-S ---------- */
function kbHybSvg(){
  const C={p:'#d64545',m:'var(--ink)',L:'#b9791a',N:'#2f7fd0',E:'#2e9e5b',V:'#1c9ad6'};
  const ln=(pts,c,d)=>`<polyline points="${pts}" fill="none" stroke="${c}" stroke-width="2" ${d?`stroke-dasharray="${d}"`:''}/>`;
  const dot=(x,y,c)=>`<circle cx="${x}" cy="${y}" r="3" fill="${c}"/>`;
  const T=(x,y,t,s,a,k)=>`<text x="${x}" y="${y}" text-anchor="${a||'middle'}" class="svgt${k?'':' mut'}" font-size="${s||10}"${k?' font-weight="700"':''}>${t}</text>`;
  const box=(x,y,w,h,a,b,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="var(--surface)" stroke="${c||'var(--ink)'}" stroke-width="1.6"/>${T(x+w/2,y+h/2+(b?-1:4),a,9.5,0,1)}${b?T(x+w/2,y+h/2+11,b,9):''}`;
  const fuse=(x,y,w)=>`<rect x="${x-(w||18)/2}" y="${y-4}" width="${w||18}" height="8" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.4"/><line x1="${x-(w||18)/2}" y1="${y}" x2="${x+(w||18)/2}" y2="${y}" stroke="var(--ink)" stroke-width="1"/>`;
  const panel=(x,y)=>`<rect x="${x}" y="${y}" width="60" height="42" rx="3" fill="#2d4f7c" stroke="var(--ink)" stroke-width="1.4"/><path d="M${x+20} ${y}v42M${x+40} ${y}v42M${x} ${y+21}h60" stroke="#9db8d9" stroke-width="1" opacity=".6"/>`;
  const str=(yp,n)=>{const ym=yp+16;return ln(`70,${yp} 330,${yp}`,C.p)+ln(`70,${ym} 330,${ym}`,C.m)+panel(10,yp-13)+`<text x="40" y="${yp+11}" text-anchor="middle" class="svgt" style="fill:#fff" font-size="8">6×650W</text>`+fuse(99,yp)+fuse(99,ym)+T(99,yp-9,'ฟิวส์ 6A',8.5)+box(125,yp-10,40,36,'MCB','32A')+dot(330,yp,C.p)+dot(330,ym,C.m)+T(338,yp+13,'PV'+n,9.5,'start')};
  /* shared: ground bar, PV strings + SPD, inverter, battery branch, legend */
  const base=()=>`<rect x="0" y="16" width="858" height="5" fill="${C.E}"/>${T(430,11,'บาร์กราวด์ PE → หลักดิน (ลงดินจุดเดียว)',10.5)}
  ${ln('4,173 4,21',C.E,'4 3')}${ln('4,83 10,83',C.E,'4 3')}${ln('4,173 10,173',C.E,'4 3')}
  ${str(75,1)}${str(165,2)}
  ${ln('222,75 222,62',C.p)}${ln('238,91 238,62',C.m)}${dot(222,75,C.p)}${dot(238,91,C.m)}${box(200,44,60,18,'SPD DC')}${ln('230,44 230,21',C.E)}${T(230,116,'SPD 500 V ทำเหมือนกันทุกสตริง',8.5)}
  <rect x="330" y="50" width="210" height="280" rx="8" fill="var(--surface)" stroke="var(--accent)" stroke-width="2"/>${ln('435,50 435,21',C.E)}
  ${T(435,200,'Hybrid inverter 6 kW',13,0,1)}${T(435,218,'MPPT 2 ช่อง + ชาร์จแบต',10)}${T(370,318,'BAT',9.5)}
  ${ln('360,330 360,420',C.p)}${ln('380,330 380,420',C.m)}${dot(360,330,C.p)}${dot(380,330,C.m)}${box(345,350,50,36,'MCCB','150A')}${fuse(360,402,14)}${fuse(380,402,14)}${T(343,405,'ฟิวส์แบต',9,'end')}${box(335,422,70,40,'LiFePO4','48 V')}
  ${[[10,C.p,'DC +'],[90,C.m,'DC −'],[170,C.L,'L'],[230,C.N,'N'],[290,C.E,'PE']].map(([x,c,t])=>ln(`${x},488 ${x+22},488`,c)+T(x+28,492,t,10,'start')).join('')}`;
  const notes=a=>a.map((t,i)=>T(440,345+i*20,t,10.5,'start')).join('');
  const A=`<svg viewBox="0 0 870 510" role="img" aria-label="แผนภาพแบบที่ 1 Hybrid off-grid มี MTS พร้อมฟิวส์ เบรกเกอร์ SPD กราวด์ และ N-N bonding">${base()}
  ${T(532,89,'AC-in',9.5,'end')}${T(532,169,'AC-out',9.5,'end')}
  ${ln('540,80 770,80',C.L)}${ln('540,92 770,92',C.N)}${dot(540,80,C.L)}${dot(540,92,C.N)}
  ${box(560,68,40,36,'Inv','32A')}${box(690,68,40,36,'เมน','2P')}${box(770,62,80,48,'ไฟกริด','TN-C-S')}
  ${dot(660,92,C.N)}${ln('660,92 660,21',C.E)}${T(668,46,'N–PE bonding',9.5,'start')}${T(668,58,'ที่ตู้เมน (จุดเดียว)',9.5,'start')}
  ${dot(625,80,C.L)}${ln('625,80 625,140',C.L)}${dot(640,92,C.N)}${ln('640,92 640,140',C.N)}${T(648,125,'บายพาส',9,'start')}
  ${ln('540,160 610,160',C.L)}${ln('540,172 610,172',C.N)}${dot(540,160,C.L)}${dot(540,172,C.N)}${box(555,148,40,36,'RCBO','32A')}
  ${ln('551,92 551,172','#e05a5a','5 3')}${dot(551,92,C.N)}${dot(551,172,C.N)}${T(556,134,'N–N',9,'start')}
  ${ln('670,160 770,160',C.L)}${ln('670,172 770,172',C.N)}${box(610,140,60,60,'MTS','1P+1P')}${box(770,148,80,36,'โหลดหลัก','ในบ้าน')}
  ${notes(['ตั้งค่า: Hybrid (Take load jointly) = Disable · CT = Internal','ต้องมีแบต · โหลดต้องไม่เกินกำลังเครื่อง · ไม่ต้องใช้ External CT','ห้ามต่อ N ที่เครื่องลงดินตรง ๆ (บายพาสแล้วลงดิน 2 จุด) ใช้ N–N bonding','ปิดเมน: เปิด N-PE bonding ให้เครื่องสลับ N–N ↔ N–PE เอง'])}
  </svg>`;
  const B=`<svg viewBox="0 0 870 510" role="img" aria-label="แผนภาพแบบที่ 2 On-grid ขนานกริด มี CT คล้องสายกริด พร้อมฟิวส์ เบรกเกอร์ SPD กราวด์">${base()}
  ${T(532,89,'AC-out',9.5,'end')}${T(532,169,'AC-in',9.5,'end')}${T(532,259,'CT',9.5,'end')}
  ${ln('540,80 620,80',C.L)}${ln('540,92 620,92',C.N)}${dot(540,80,C.L)}${dot(540,92,C.N)}${box(555,68,40,36,'RCBO','32A')}${box(620,68,100,36,'โหลดสำรอง EPS','แยกวงจร')}
  ${ln('540,160 770,160',C.L)}${ln('540,172 770,172',C.N)}${dot(540,160,C.L)}${dot(540,172,C.N)}${box(560,148,40,36,'Inv','32A')}${box(690,148,40,36,'เมน','2P')}${box(770,142,80,48,'ไฟกริด','TN-C-S')}
  ${dot(750,172,C.N)}${ln('750,172 750,21',C.E)}${T(758,46,'N–PE bonding',9.5,'start')}${T(758,58,'ที่ตู้เมน',9.5,'start')}
  ${dot(625,160,C.L)}${ln('625,160 625,200',C.L)}${dot(640,172,C.N)}${ln('640,172 640,200',C.N)}${box(591,200,64,36,'โหลดบ้าน','ทั้งหมด')}
  <circle cx="665" cy="160" r="10" fill="#fff" stroke="${C.V}" stroke-width="3"/><text x="665" y="163" text-anchor="middle" font-size="8" font-weight="700" fill="#1b2430">CT</text>
  ${dot(540,255,C.V)}${ln('665,170 665,255 540,255',C.V,'7 4')}${T(670,225,'สายสัญญาณ CT',9.5,'start')}
  ${notes(['ตั้งค่า: Hybrid (Take load jointly) = Enable · Feed in = Disable','CT = External CT คล้องสาย L ที่เมน วัดกระแสกริดทั้งบ้าน','CT offset: −20 W = กินกริดเพิ่ม 20 W · +20 W = ย้อนออก 20 W','กริดดับ = ดับด้วย (จ่ายเฉพาะ AC-out) · ต้องขออนุญาตขนานกริด'])}
  ${ln('360,488 382,488',C.V,'7 4')}${T(388,492,'สายสัญญาณ CT',10,'start')}
  </svg>`;
  return `<div class="tblwrap"><p class="hint tight"><b>แบบที่ 1 Hybrid off-grid (มี MTS)</b> · เครื่องจ่ายโหลดหลักทางช่อง AC-out กริดเข้า AC-in และบายพาสผ่าน MTS</p>${A}<p class="hint tight"><b>แบบที่ 2 On-grid ขนานกริด (CT คล้องสายกริด)</b> · โหลดบ้านต่อกับกริดตามปกติ เครื่องจ่ายเสริมขนานเข้าไป</p>${B}<p class="hint tight">ภาพวาดอย่างง่ายเพื่อการสอน ตัวเลขเป็นตัวอย่าง ไม่ใช่ข้อกำหนด บนมือถือหมุนจอแนวนอนจะอ่านง่ายขึ้น</p></div>`;
}
kbAdd({id:'hybrid-offgrid-vs-ongrid',cat:'pv',upd:'2026-11-11',
  title:'Hybrid inverter 6 kW: ต่อแบบ Off-grid (มี MTS) กับ On-grid (ขนานกริด) ต่างกันอย่างไร',
  summary:'เปรียบเทียบการต่อ Hybrid inverter 2 แบบในระบบไฟบ้านไทย TN-C-S: ทางเดินไฟ การต่อ N ลงดิน การใช้ CT การตั้งค่า ข้อจำกัด และตัวอย่างวงจร 4 แบบ',
  tags:['Hybrid','Off-grid','On-grid','MTS','CT','TN-C-S','N bonding','NG bonding','Luxpower','6kW','ขนานกริด','EPS','Take load jointly','Feed in','CT offset','PV','MPPT','วสท.'],
  related:[['ac','04 ต่อสาย AC ระบบ'],['accouple','19 AC Coupling → หน้า 6 AC Coupling ฝั่ง on-load'],['systems','11 จำลองระบบ 4 แบบ']],
  body:()=>`<section class="kbsec"><h2>ภาพรวม</h2>
<p>Hybrid inverter 1 เครื่องต่อได้ 2 แบบ ต่างกันที่<b>ใครจ่ายไฟให้โหลดหลัก</b>และ<b>ต้องขนานกับการไฟฟ้าหรือไม่</b> บทความนี้ใช้ตัวอย่างเครื่อง 6 kW (Luxpower) ซึ่งใช้หลักการเดียวกับ Hybrid switching inverter ยี่ห้ออื่นที่มีพอร์ต AC-in / AC-out / Batt / PV ลักษณะเดียวกัน วงจรในบทความปรับให้ตรงกับระบบไฟบ้านไทยแบบ <b>TN-C-S</b> ที่ต่อสาย N เข้าบาร์กราวด์ก่อนเข้าเบรกเกอร์ (วงจรตามคู่มือผู้ผลิตเขียนไว้สำหรับระบบ TT)</p>
${kbHybSvg()}</section>
<section class="kbsec"><h2>เทียบ 2 แบบ</h2>
<div class="tblwrap"><table class="t kbt kbwide"><thead><tr><th></th><th>แบบที่ 1 Hybrid off-grid (มี MTS)</th><th>แบบที่ 2 On-grid (ขนานกริด)</th></tr></thead><tbody>
<tr><th>ไฟที่จ่ายโหลดหลัก</th><td>แผง + แบต ออกทางช่อง AC-out (load)</td><td>ผสมกับไฟกริด จ่ายทั้งช่อง AC-in และ AC-out เท่าที่แผงผลิตได้ ส่วนที่ไม่พอแบตช่วยเติม</td></tr>
<tr><th>แบตเตอรี่</th><td>ต้องมี</td><td>มีหรือไม่มีก็ได้ ถ้ามีจะตั้งเวลาให้จ่ายเสริมและจำกัดกระแสแบตสูงสุดได้</td></tr>
<tr><th>CT</th><td>ใช้ CT ภายในเครื่อง (Internal) ไม่ต้องมี CT ภายนอก</td><td>ใช้ <b>External CT</b> คล้องสาย L จากเมนเบรกเกอร์เพื่อวัดกระแสกริด หรือใช้ Internal CT ก็ได้ (ผลต่างกันตามด้านล่าง)</td></tr>
<tr><th>ขนาดโหลด</th><td>ต้องไม่เกินกำลังของอินเวอร์เตอร์</td><td>ไม่จำกัดด้วยกำลังเครื่อง อินเวอร์เตอร์จ่ายเสริมเข้าไปกับไฟกริด</td></tr>
<tr><th>ไฟกริดดับ</th><td>โหลดยังได้ไฟจากแผงและแบต (EPS)</td><td>ช่องโหลดหลักดับไปด้วย จ่ายได้เฉพาะช่อง AC-out ที่แยกวงจรสำรอง (Backup load / EPS)</td></tr>
<tr><th>การขออนุญาต</th><td>ไม่ได้ขนานกับกริดในโหมดหลัก</td><td><b>ต้องขออนุญาตขนานไฟกับการไฟฟ้า</b> และเครื่องต้องอยู่ในรายชื่อที่การไฟฟ้ายอมรับ</td></tr>
<tr><th>ค่าที่ตั้งในเครื่อง</th><td>Hybrid (Take load jointly) = Disable · CT = Internal</td><td>Hybrid (Take load jointly) = Enable · Feed in (Export to grid) = Disable · CT = External CT</td></tr>
</tbody></table></div></section>
<section class="kbsec"><h2>แบบที่ 1: ทำไมต้องต่อ N แบบนี้ และ MTS ทำอะไร</h2>
<ul class="kbol">
<li>ในระบบ TN-C-S สาย N ต้องลงดิน<b>จุดเดียว</b> ที่ตู้เมนฝั่งกริด จึงต่อ N ของช่อง AC-in เข้ากับ N ของ AC-out (N bonding) เพื่อให้ N ของโหลดมีอ้างอิงดินจากจุดเดิม</li>
<li>ห้ามต่อ N ที่ AC-out ลงดินที่เครื่องโดยตรง เพราะเมื่อแผงไม่มีไฟและแบตหมด เครื่องจะบายพาสไปใช้ไฟกริด ทำให้ N ลงดิน 2 จุด เกิดกราวด์ลูป กระแสวิ่งในสายดินได้ และไม่เป็นไปตามข้อกำหนดที่ให้ลงดินจุดเดียว</li>
<li>ถ้าปิดเมนเบรกเกอร์ การเชื่อมต่อลงดินจะถูกตัดไปด้วย เครื่องทำงานเป็น EPS off-grid ถ้าต้องการใช้งานแบบปิดเมนไว้ ให้เปิดฟังก์ชัน <b>N-PE bonding: Enable</b> และต่อสายลงดินเพิ่ม เครื่องจะสลับเองระหว่าง AC bypass (N-N) กับ off-grid (N-PE) ตามโหมด</li>
<li><b>MTS</b> (manual transfer switch) เป็นสวิตช์สลับสาย Line ของโหลดระหว่างเครื่อง inverter กับไฟกริด ใช้เมื่อปิดระบบโซลาร์ไว้ ให้โหลดยังใช้ไฟกริดได้</li>
</ul></section>
<section class="kbsec"><h2>แบบที่ 2: External CT กับ Internal CT</h2>
<ul class="kbol">
<li><b>External CT</b> คล้องสาย L ที่ออกจากเมนเบรกเกอร์ เครื่องจึงเห็นกระแสกริดทั้งบ้านและจ่ายผสมให้ทั้งช่อง AC-in และ AC-out ได้ ปรับ <b>CT offset</b> เพื่อชดเชยได้ ค่าติดลบ เช่น −20 W ให้กริดจ่ายเพิ่มขึ้น 20 W ค่าบวก เช่น +20 W ให้ย้อนออกกริด 20 W</li>
<li><b>Internal CT</b> วัดที่ตัวเครื่อง เมื่อตั้ง zero export เครื่องจะจ่ายให้โหลดฝั่ง AC-out เท่านั้น</li>
<li>แบบ On-grid ติดตั้งได้ทั้งแบบไม่มีแบต หรือมีแบตเพื่อจ่ายผสมตามช่วงเวลาที่ตั้ง</li>
</ul></section>
<section class="kbsec"><h2>การต่อแผง PV1 / PV2</h2>
<ul class="kbol">
<li>แต่ละช่อง MPPT รับได้ประมาณ 17 A / 4,000 W (ตัวอย่างรุ่น 6 kW) ต่อ 2 สตริงแยกกันเข้าแต่ละช่องได้ (เมนู 2: S, independent)</li>
<li>หรือใช้ 1 สตริงต่อขนานเข้า 2 ช่อง รวม 34 A / 8,000 W (เมนู 2: P, same string two MPPTs)</li>
<li>สตริง 1–2 สตริงไม่จำเป็นต้องใส่ฟิวส์อนุกรมสตริง เพราะกระแสย้อนจากหนึ่งสตริงไม่ต่างจากกระแสใช้งานของแผงและไม่เกินพิกัดฟิวส์สูงสุดของแผง (ตรวจค่า max series fuse จากดาต้าชีตแผงทุกครั้ง)</li>
</ul></section>
<section class="kbsec"><h2>ตัวอย่างวงจร 4 แบบที่ผู้ออกแบบเผยแพร่</h2>
<div class="tblwrap"><table class="t kbt kbwide"><thead><tr><th>วงจร</th><th>จุดเด่นที่ดูจากแผนภาพ</th></tr></thead><tbody>
<tr><th>1 · 6 kW Off-grid + MTS</th><td>เมน 50 A, AC SPD 275 V, เบรกเกอร์วงจรเครื่อง 32 A, MTS 1P+1P 32 A, RCBO/RCCB 32 A, แผง 9 × 620 W = 5,580 W, DC MCB 20 A, ฟิวส์ DC 4 A, DC SPD 1000 V, แบตผ่าน DC MCCB 150 A ลงดิน 2 จุด (PE#1 ที่ตู้เมน, PE#2 ที่โครงแผง)</td></tr>
<tr><th>1 · 2 × 6 kW Hybrid off-grid + MTS</th><td>เครื่อง 2 ตัวใช้เบรกเกอร์ Inv 32 A คนละตัว, MTS 1P+1P 50 A, RCBO 50 A ร่วมกัน, แบตแต่ละเครื่องมี MCCB 150 A, สาย N-N bonding</td></tr>
<tr><th>2 · On-grid + RCBO + MTS 2P</th><td>External CT คล้องสาย L, RCBO 300 mA (วงจรเครื่อง) และ RCBO 30 mA (โหลดบ้าน), MTS 2P,2P 32 A สำหรับวงจรโหลดสำรอง, ตั้ง Hybrid = Enable, Feed in = Disable, NG bonding = Enable</td></tr>
<tr><th>1.1 · On-grid + MTS 1P</th><td>คล้ายวงจร 2 แต่วงจรเครื่องใช้เบรกเกอร์ Inv 32 A, RCBO 30 mA 50 A ที่โหลดบ้าน และ MTS 1P,1P สำหรับโหลดสำรอง</td></tr>
</tbody></table></div>
<p class="hint tight">ตัวเลขข้างบนคือตัวอย่างของผู้ออกแบบ ไม่ใช่ข้อกำหนด ขนาดสายและเบรกเกอร์ที่ใช้จริงต้องคำนวณตามภาระและ<a href="#library/rcd-vs-mcb">มาตรฐานการติดตั้งทางไฟฟ้าฯ ของ วสท.</a></p></section>
<section class="kbsec"><h2>ทบทวน</h2>
<div class="kbq" data-ans="b"><p>1. ทำไมห้ามต่อ N ที่ AC-out ลงดินที่ตัวเครื่องโดยตรงในแบบที่ 1</p>
 <div class="chips"><button type="button" class="chip" data-o="a">เพราะ N ไม่ใช่สายมีไฟ ไม่ต้องลงดิน</button><button type="button" class="chip" data-o="b">เพราะตอนเครื่องบายพาสไปกริด N จะลงดิน 2 จุด เกิดกราวด์ลูป</button><button type="button" class="chip" data-o="c">เพราะเครื่องจะจ่ายไฟได้น้อยลง</button></div>
 <p class="kbqx" data-t="ระบบ TN-C-S ต้องลงดินจุดเดียวที่ตู้เมน ถ้าลงที่เครื่องอีกจุด ตอนบายพาสไปกริดจะเกิด 2 จุด กระแสไหลวนในสายดินได้ จึงต่อ N-N bonding แทน" hidden></p></div>
<div class="kbq" data-ans="c"><p>2. แบบ On-grid ที่ตั้ง Feed in = Disable ใช้ CT แบบใดเพื่อให้เครื่องเห็นกระแสกริดทั้งบ้าน</p>
 <div class="chips"><button type="button" class="chip" data-o="a">Internal CT</button><button type="button" class="chip" data-o="b">ไม่ต้องใช้ CT</button><button type="button" class="chip" data-o="c">External CT คล้องสาย L ที่ออกจากเมนเบรกเกอร์</button></div>
 <p class="kbqx" data-t="External CT วัดกระแสกริดที่เมน เครื่องจึงจ่ายผสมได้ทั้งช่อง AC-in และ AC-out ส่วน Internal CT วัดที่ตัวเครื่อง จะจ่ายเฉพาะโหลดฝั่ง AC-out" hidden></p></div>
<div class="kbq" data-ans="a"><p>3. ข้อใดเป็นข้อจำกัดของแบบ On-grid</p>
 <div class="chips"><button type="button" class="chip" data-o="a">ไฟกริดดับแล้วโหลดหลักดับด้วย จ่ายได้เฉพาะวงจรสำรองที่ AC-out และต้องขอขนานไฟกับการไฟฟ้า</button><button type="button" class="chip" data-o="b">ต้องมีแบตเสมอ</button><button type="button" class="chip" data-o="c">โหลดต้องไม่เกินกำลังเครื่อง</button></div>
 <p class="kbqx" data-t="แบบ On-grid ทำงานขนานกริด ไฟกริดดับจึงดับด้วย (ยกเว้นวงจรสำรอง) และต้องขออนุญาตขนานไฟ ส่วนแบตไม่จำเป็น และโหลดรวมไม่จำกัดด้วยกำลังเครื่อง" hidden></p></div>
<div class="kbq" data-ans="b"><p>4. ตั้ง CT offset เป็น −20 W ผลคืออะไร</p>
 <div class="chips"><button type="button" class="chip" data-o="a">ย้อนไฟออกกริด 20 W</button><button type="button" class="chip" data-o="b">กริดจ่ายเพิ่ม 20 W</button><button type="button" class="chip" data-o="c">แบตจ่ายเพิ่ม 20 W</button></div>
 <p class="kbqx" data-t="ค่าติดลบทำให้กินไฟกริดเพิ่ม ค่าบวกทำให้ย้อนออก" hidden></p></div>
</section>
<section class="kbsec kbsrc"><h2>ที่มาของข้อมูล</h2>
<p class="hint tight">สรุปและเรียบเรียงใหม่จากโพสต์และแผนภาพวงจร Luxpower 6 kW ของคุณ Kittikorn T. (เพจ "คุ้มค่าไปกับโซลาร์เซลล์") แผนภาพในบทความนี้วาดขึ้นใหม่อย่างง่ายเพื่อการสอน ไม่ได้ใช้ภาพต้นฉบับ ค่าและการตั้งค่าอาจต่างกันตามรุ่นและเฟิร์มแวร์ ตรวจกับคู่มือผู้ผลิต มาตรฐาน วสท. และข้อกำหนดการไฟฟ้าก่อนติดตั้งจริง</p></section>`,
  init:el=>{kbQuiz(el);return null}
});
