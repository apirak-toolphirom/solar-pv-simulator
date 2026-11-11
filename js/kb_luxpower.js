/* ---------- article: Hybrid inverter 6 kW — Off-grid (มี MTS) กับ On-grid (ขนานกริด) ในระบบ TN-C-S ---------- */
function kbHybSvg(){
  const bx=(x,y,w,h,t,s,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="var(--surface)" stroke="${c||'var(--line)'}" stroke-width="1.6"/><text x="${x+w/2}" y="${y+h/2+(s?-1:4)}" text-anchor="middle" class="svgt" font-size="11.5" font-weight="600">${t}</text>${s?`<text x="${x+w/2}" y="${y+h/2+12}" text-anchor="middle" class="svgt mut" font-size="9.5">${s}</text>`:''}`;
  const pl=(pts,c,d)=>`<polyline points="${pts}" fill="none" stroke="${c||'var(--ink)'}" stroke-width="2" ${d?`stroke-dasharray="${d}"`:''}/>`;
  const A=`<svg viewBox="0 0 620 150" role="img" aria-label="แผนภาพทางเดินไฟ แบบ Hybrid off-grid มี MTS">
    ${bx(8,56,84,40,'กริด','TN-C-S')}${bx(200,8,150,66,'Hybrid inverter','ต่อแผง + แบต','var(--accent)')}${bx(410,56,76,40,'MTS','1P+1P')}${bx(530,56,82,40,'โหลดหลัก','ในบ้าน')}
    ${pl('92,66 150,66 150,28 200,28')}${pl('350,28 448,28 448,56')}${pl('50,96 50,132 448,132 448,96','var(--warn)')}${pl('486,76 530,76')}
    <text x="154" y="22" class="svgt mut" font-size="9.5">AC-in</text><text x="355" y="22" class="svgt mut" font-size="9.5">AC-out</text><text x="250" y="128" class="svgt mut" font-size="9.5" fill="var(--warn)">สายบายพาสจากกริดเข้า MTS</text>
    </svg>`;
  const B=`<svg viewBox="0 0 620 190" role="img" aria-label="แผนภาพทางเดินไฟ แบบ On-grid ขนานกริด มี CT">
    ${bx(8,60,84,40,'กริด','TN-C-S')}${bx(520,60,92,40,'โหลดบ้าน','On-grid')}${bx(210,112,150,66,'Hybrid inverter','ต่อแผง (+ แบต)','var(--accent)')}${bx(430,118,60,40,'MTS','2P/1P')}${bx(530,118,82,40,'โหลดสำรอง','Backup / EPS')}
    ${pl('92,80 520,80')}${pl('285,80 285,112')}${pl('460,80 460,118')}${pl('360,148 430,148')}${pl('490,138 530,138')}
    <circle cx="140" cy="80" r="11" fill="#fff" stroke="#1c9ad6" stroke-width="3"/><text x="140" y="83" text-anchor="middle" font-size="8" font-weight="700" fill="#1b2430">CT</text>
    ${pl('140,91 140,170 210,170','#1c9ad6','7 4')}<text x="132" y="150" text-anchor="end" class="svgt mut" font-size="9.5" fill="#1c9ad6">สายสัญญาณ CT</text>
    <text x="290" y="100" class="svgt mut" font-size="9.5">AC-in</text><text x="365" y="143" class="svgt mut" font-size="9.5">AC-out</text></svg>`;
  return `<div class="tblwrap"><p class="hint tight"><b>แบบที่ 1 Hybrid off-grid (มี MTS)</b></p>${A}<p class="hint tight"><b>แบบที่ 2 On-grid ขนานกริด (CT คล้องสายกริด)</b></p>${B}<p class="hint tight">ภาพวาดอย่างง่ายเพื่อการสอน ไม่ใช่แผนภาพวงจรจริง ตัดเบรกเกอร์ สายดิน และ SPD ออกเพื่อให้เห็นเส้นทางไฟ</p></div>`;
}
kbAdd({id:'hybrid-offgrid-vs-ongrid',cat:'pv',upd:'2026-11-11',
  title:'Hybrid inverter 6 kW: ต่อแบบ Off-grid (มี MTS) กับ On-grid (ขนานกริด) ต่างกันอย่างไร',
  summary:'เปรียบเทียบการต่อ Hybrid inverter 2 แบบในระบบไฟบ้านไทย TN-C-S: ทางเดินไฟ การต่อ N ลงดิน การใช้ CT การตั้งค่า ข้อจำกัด และตัวอย่างวงจร 4 แบบ',
  tags:['Hybrid','Off-grid','On-grid','MTS','CT','TN-C-S','N bonding','NG bonding','Luxpower','6kW','ขนานกริด','EPS','Take load jointly','Feed in','CT offset','PV','MPPT','วสท.'],
  related:[['ac','04 ต่อสาย AC ระบบ'],['accouple','19 AC Coupling (GEN port) → หน้า 6 ต่อสายเอง (CT 2 ชุด)'],['systems','11 จำลองระบบ 4 แบบ']],
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
