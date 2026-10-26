/* ---------- article: บอก RCD (RCCB / RCBO) กับ MCB ด้วยตา ---------- */
function kbRcdSvg(){
  /* generic 2-pole breakers drawn for teaching (no brand): MCB, RCCB, RCBO */
  const dev=(x,kind)=>{
    const w=120,h=210,tst=kind!=='mcb',lab=kind==='mcb'?['C32','6000','IEC 60898-1']:kind==='rccb'?['40 A','IΔn 30 mA','IEC 61008-1']:['C20','IΔn 30 mA','IEC 61009-1'];
    const lev=kind==='rcbo'?'var(--err)':'var(--ink)';
    return `<g transform="translate(${x} 10)">
      <rect width="${w}" height="${h}" rx="8" class="kbbrk"/>
      <circle cx="32" cy="22" r="10" class="kbscr"/><circle cx="88" cy="22" r="10" class="kbscr"/><circle cx="32" cy="${h-22}" r="10" class="kbscr"/><circle cx="88" cy="${h-22}" r="10" class="kbscr"/>
      <text x="32" y="46" class="svgt m" text-anchor="middle" font-size="11">${kind==='mcb'?'1':'1'}</text><text x="88" y="46" class="svgt m" text-anchor="middle" font-size="11">${kind==='mcb'?'3':'N'}</text>
      <rect x="${tst?18:20}" y="62" width="${tst?44:80}" height="44" rx="4" fill="${lev}"/>
      ${tst?`<circle cx="92" cy="84" r="15" class="kbtest"/><text x="92" y="89" text-anchor="middle" font-size="13" font-weight="700" fill="#3a2a00">T</text><text x="92" y="114" class="svgt m" text-anchor="middle" font-size="10">TEST</text>`:''}
      ${lab.map((t,i)=>`<text x="${w/2}" y="${136+i*15}" class="svgt m ${i===1&&tst?'b':''}" text-anchor="middle" font-size="11.5">${t}</text>`).join('')}
    </g>`};
  const tag=(x,t,s)=>`<text x="${x+60}" y="250" class="svgt b" text-anchor="middle" font-size="14">${t}</text><text x="${x+60}" y="268" class="svgt mut" text-anchor="middle" font-size="11.5">${s}</text>`;
  return `<div class="tblwrap"><svg viewBox="0 0 470 280" role="img" aria-label="ภาพวาดเทียบ MCB RCCB RCBO">${dev(15,'mcb')}${dev(175,'rccb')}${dev(335,'rcbo')}${tag(15,'MCB','ไม่มีปุ่ม T · มี curve')}${tag(175,'RCCB','มีปุ่ม T · มี mA · ไม่มี curve')}${tag(335,'RCBO','มีปุ่ม T · มี mA · มี curve')}</svg></div>`;
}
kbAdd({id:'rcd-vs-mcb',cat:'protect',upd:'2026-10-26',
  title:'ดูให้ออก: เบรกเกอร์ตัวไหนเป็น RCD (RCCB / RCBO) ตัวไหนเป็น MCB',
  summary:'จุดสังเกต 3 อย่างบนตัวเบรกเกอร์ คือ ปุ่ม Test, ค่า IΔn (mA) และเลขมาตรฐาน พร้อมตารางเทียบหน้าที่ มาตรฐาน มอก./IEC ฉบับปัจจุบัน และวงจรที่มาตรฐาน วสท. กำหนดให้ต้องมีเครื่องตัดไฟรั่ว',
  tags:['RCD','RCCB','RCBO','MCB','เครื่องตัดไฟรั่ว','กันดูด','ปุ่ม Test','IΔn','30 mA','IEC 61008','IEC 61009','IEC 60898','มอก. 2425','มอก. 909','วสท.','มาตรฐานการติดตั้งทางไฟฟ้า'],
  related:[['cable','13 สายไฟและเบรกเกอร์ → AC: สาย + เบรกเกอร์'],['ac','03 ต่อสาย AC ระบบ'],['basics','00 หัวข้อ 08 ระบบป้องกัน']],
  src:[
    ['มาตรฐานการติดตั้งทางไฟฟ้าสำหรับประเทศไทย พ.ศ. 2564 — วิศวกรรมสถานแห่งประเทศไทย (ข้อมูลหนังสือ, Chulabook)','https://www.chulabook.com/engineering-book/161831'],
    ['วสท.: หลักสูตรอบรม มาตรฐานการติดตั้งทางไฟฟ้าสำหรับประเทศไทย (พ.ศ. 2564)','https://eit.or.th/order/course/195'],
    ['Schneider Electric FAQ: วงจรที่ต้องติดตั้งเครื่องตัดไฟรั่ว 30 mA','https://www.se.com/th/th/faqs/FA336027'],
    ['สมอ.: มอก. 2425-2560 เครื่องตัดวงจรใช้กระแสเหลือ (RCCB) ฉบับเต็ม','https://service.tisi.go.th/fulltext/2425_2560.pdf'],
    ['สมอ.: มอก. 909-2548 เครื่องตัดวงจรกระแสเหลือแบบมีอุปกรณ์ป้องกันกระแสเกิน (RCBO)','https://pr.tisi.go.th/%e0%b8%a1%e0%b8%ad%e0%b8%81-909-2548-%e0%b9%80%e0%b8%84%e0%b8%a3%e0%b8%b7%e0%b9%88%e0%b8%ad%e0%b8%87%e0%b8%95%e0%b8%b1%e0%b8%94%e0%b8%a7%e0%b8%87%e0%b8%88%e0%b8%a3%e0%b8%81%e0%b8%a3%e0%b8%b0%e0%b9%81%e0%b8%aa%e0%b9%80%e0%b8%ab%e0%b8%a5%e0%b8%b7%e0%b8%ad%e0%b9%81%e0%b8%9a%e0%b8%9a%e0%b8%a1%e0%b8%b5%e0%b8%ad%e0%b8%b8%e0%b8%9b%e0%b8%81%e0%b8%a3%e0%b8%93%e0%b9%8c%e0%b8%9b%e0%b9%89%e0%b8%ad%e0%b8%87%e0%b8%81%e0%b8%b1%e0%b8%99%e0%b8%81%e0%b8%a3%e0%b8%b0%e0%b9%81%e0%b8%aa%e0%b9%80%e0%b8%81%e0%b8%b4%e0%b8%99/'],
    ['KJL: ข้อกำหนดมาตรฐานการติดตั้งเครื่องตัดไฟรั่ว (วสท. 022001-22, มอก. 2425 / 909 / 2955)','https://kjl.co.th/en/blog/standards-installation-rcd/'],
    ['IEC 61008-2-1:2024 (ข้อมูลมาตรฐาน)','https://www.evs.ee/en/iec-61008-2-1-2024'],
    ['FprEN IEC 61009-1:2026 (ร่างฉบับปรับปรุง)','https://genorma.com/en/standards/fpren-iec-61009-1-2026']
  ],
  srcNote:'ตรวจเมื่อ 26 ต.ค. 2569: มาตรฐาน วสท. ฉบับที่ใช้อยู่คือ พ.ศ. 2564 · มอก. 2425-2560 และ 909-2548 มีฉบับเต็มบนเว็บ สมอ. · ยังไม่พบประกาศทางการของ มอก. 909 ฉบับ พ.ศ. 2567 บนเว็บ สมอ. หรือราชกิจจานุเบกษา ให้ตรวจที่ tisi.go.th ก่อนอ้างในเอกสาร ภาพในบทความเป็นภาพวาดประกอบ ไม่ใช่ยี่ห้อจริง',
  body:()=>`
<section class="kbsec"><h2>สังเกต 3 จุด รู้ได้ในไม่กี่วินาที</h2>
${kbRcdSvg()}
<ol class="kbol">
<li><b>ปุ่ม Test</b> (มักเป็นปุ่มเล็กสีเหลืองหรือฟ้า มีตัว T หรือคำว่า TEST) มีปุ่ม = <b>RCD</b> ไม่มีปุ่ม = <b>MCB</b></li>
<li><b>ค่า IΔn เป็น mA</b> เช่น IΔn 30 mA หรือ 0.03 A คือค่ากระแสรั่วที่ทำให้ตัด มีค่านี้ = RCD · MCB ไม่มีค่านี้</li>
<li><b>ตัวอักษร curve + พิกัด</b> เช่น B10, C16, C20, D32 แปลว่ามีส่วนป้องกันกระแสเกิน · MCB และ RCBO มี · <b>RCCB ไม่มี</b> (ระบุแค่พิกัด เช่น 40 A)</li>
</ol>
<p>สรุปสั้น: มีปุ่ม Test แต่ไม่มี curve = <b>RCCB</b> · มีปุ่ม Test และมี curve = <b>RCBO</b> · ไม่มีปุ่ม Test มีแต่ curve = <b>MCB</b> ถ้ายังไม่แน่ใจ ให้ดูเลขมาตรฐาน IEC / มอก. หรือคำว่า RCCB / RCBO ที่พิมพ์บนตัว</p>
</section>
<section class="kbsec"><h2>ตารางเทียบ MCB · RCCB · RCBO</h2>
<div class="tblwrap"><table class="t kbt kbwide"><thead><tr><th></th><th>MCB</th><th>RCCB</th><th>RCBO</th></tr></thead><tbody>
<tr><td>ชื่อเต็ม</td><td>Miniature Circuit Breaker</td><td>Residual Current Circuit Breaker (ไม่มีป้องกันกระแสเกิน)</td><td>Residual Current Breaker with Overcurrent protection</td></tr>
<tr><td>ตัดเมื่อลัดวงจร</td><td>✓</td><td>✕</td><td>✓</td></tr>
<tr><td>ตัดเมื่อโหลดเกินพิกัด</td><td>✓</td><td>✕</td><td>✓</td></tr>
<tr><td>ตัดเมื่อไฟรั่ว / ไฟดูด</td><td>✕</td><td>✓</td><td>✓</td></tr>
<tr><td>ปุ่ม Test</td><td>ไม่มี</td><td>มี</td><td>มี</td></tr>
<tr><td>บนฉลาก</td><td class="mono">C16 · 6000 (Icn)</td><td class="mono">40 A · IΔn 30 mA · Inc</td><td class="mono">C20 · IΔn 30 mA · Icn</td></tr>
<tr><td>IEC</td><td class="mono">IEC 60898-1</td><td class="mono">IEC 61008-1</td><td class="mono">IEC 61009-1</td></tr>
<tr><td>มอก.</td><td>ดูเลข มอก. บนฉลาก</td><td class="mono">มอก. 2425-2560 (แทน 2425-2552)</td><td class="mono">มอก. 909-2548 <span class="pill warn">ฉบับ 2567 รอตรวจ</span></td></tr>
</tbody></table></div>
<p class="hint tight">RCCB ไม่ป้องกันกระแสเกิน จึงต้องมี MCB หรือเบรกเกอร์ที่มีพิกัดเหมาะสมป้องกันอยู่ในวงจรเดียวกันเสมอ ส่วน RCBO ทำได้ทั้งสองอย่างในตัวเดียว เหมาะกับวงจรย่อยที่ต้องการแยกกันดูดทีละวงจร</p>
</section>
<section class="kbsec"><h2>RCD ทำงานอย่างไร</h2>
<p>RCD เทียบกระแสที่ไหลออกทางสาย L กับกระแสที่ไหลกลับทางสาย N ถ้าต่างกันแปลว่ามีกระแสบางส่วนรั่วลงดิน เช่น ผ่านตัวคน เมื่อผลต่างถึงค่า IΔn เครื่องจะตัดวงจรภายในเวลาเป็นมิลลิวินาที</p>
<ul class="kbol">
<li><b>IΔn 30 mA</b>: ใช้ป้องกันคนถูกไฟดูด (วงจรเต้ารับ ห้องน้ำ เครื่องทำน้ำอุ่น) · <b>10 mA</b>: ไวกว่า ใช้กับจุดเสี่ยงพิเศษ · <b>100 mA ขึ้นไป</b>: ป้องกันไฟไหม้จากกระแสรั่ว ไม่ได้ป้องกันคนโดยตรง</li>
<li>ชนิดตามรูปคลื่นกระแสรั่ว: <b>AC</b> (รั่วแบบไซน์) · <b>A</b> (รับ DC แบบพัลส์ด้วย) · <b>F</b> และ <b>B</b> (รับความถี่ผสมและ DC เรียบ ใช้กับอินเวอร์เตอร์ ไดรฟ์มอเตอร์ ที่ชาร์จรถไฟฟ้า มีมาตรฐาน มอก. 2955 ตามแหล่งอ้างอิง)</li>
<li>RCD ไม่ได้ป้องกันการแตะสาย L กับ N พร้อมกัน (กระแสออกเท่ากับกระแสกลับ) และ RCD แบบ AC ทั่วไป <b>ใช้ฝั่ง DC ของแผงโซลาร์ไม่ได้</b></li>
</ul>
</section>
<section class="kbsec"><h2>มาตรฐาน วสท. ที่ต้องรู้ (ฉบับ พ.ศ. 2564)</h2>
<p>มาตรฐานการติดตั้งทางไฟฟ้าสำหรับประเทศไทย ฉบับที่ใช้อยู่ตอนนี้คือ <b>พ.ศ. 2564</b> (รหัส วสท. 022001-22 ตามที่แหล่งอ้างอิงระบุ) วงจรต่อไปนี้ต้องมีเครื่องตัดไฟรั่วขนาด IΔn ไม่เกิน 30 mA เว้นแต่อุปกรณ์นั้นต่อลงดินตามข้อกำหนด:</p>
<ul class="kbol">
<li>วงจรเต้ารับในห้องน้ำ ห้องอาบน้ำ ที่จอดรถ ห้องครัว และห้องใต้ดิน</li>
<li>วงจรเต้ารับใกล้อ่างล้างจานหรืออ่างล้างมือ</li>
<li>วงจรและอุปกรณ์นอกอาคารที่คนเข้าถึงได้</li>
<li>วงจรเต้ารับชั้นล่างในพื้นที่ที่เคยน้ำท่วม หรือต่ำกว่าระดับน้ำทะเลปานกลาง</li>
<li>วงจรเครื่องทำน้ำอุ่นและอ่างอาบน้ำ</li>
</ul>
<p class="hint tight">รายการนี้สรุปจากแหล่งอ้างอิงที่ระบุ เลขข้อในมาตรฐานและรายละเอียดข้อยกเว้นให้เปิดดูจากเล่มมาตรฐาน วสท. ฉบับ พ.ศ. 2564 และข้อกำหนดของการไฟฟ้า (MEA / PEA) ในพื้นที่ก่อนใช้งานจริง</p>
</section>
<section class="kbsec"><h2>ในระบบโซลาร์</h2>
<ul class="kbol">
<li>วงจรโหลดที่จ่ายจากพอร์ต <b>BACKUP</b> ของอินเวอร์เตอร์ Hybrid ยังเป็นวงจรในบ้าน จึงต้องมี RCD ตามเกณฑ์ข้างต้นเหมือนวงจรที่จ่ายจากกริด</li>
<li>ขาออก AC ของอินเวอร์เตอร์ (GRID) ใช้ MCB หรือ MCCB 2 ขั้วตามพิกัดในคู่มือ ถ้าจะใส่ RCD ให้ดูคู่มือว่าอินเวอร์เตอร์ต้องการ RCD ชนิดใดและขนาด IΔn เท่าไร เพราะอินเวอร์เตอร์ไม่มีหม้อแปลงบางรุ่นอาจมีกระแสรั่ว DC ทำให้ RCD ชนิด AC ทำงานผิดพลาด</li>
<li>ฝั่ง DC (แผงและแบต) ใช้ฟิวส์ gPV เบรกเกอร์ DC หรือ DC isolator ที่ระบุพิกัด DC ไม่ใช่ RCD</li>
</ul>
</section>
<section class="kbsec"><h2>ใช้งานและตรวจสอบ</h2>
<ul class="kbol">
<li>กดปุ่ม Test ตามรอบที่ผู้ผลิตแนะนำ (หลายยี่ห้อแนะนำเดือนละครั้ง) ต้องตัดทันที ถ้ากดแล้วไม่ตัด ให้เปลี่ยน</li>
<li>ปุ่ม Test ทดสอบกลไกของเครื่องเท่านั้น ไม่ได้ยืนยันว่าสายดินต่อถูกต้อง ต้องวัดความต่อเนื่องของสายดินแยกต่างหาก</li>
<li>RCD ทริปบ่อยเมื่อฝนตกหรือเปิดเครื่องบางตัว มักเป็นกระแสรั่วจริงในสายหรืออุปกรณ์ ให้แยกวงจรหาจุดรั่ว ไม่ควรถอด RCD ออกหรือเปลี่ยนเป็นค่า mA ที่สูงขึ้น</li>
</ul>
</section>
<section class="kbsec"><h2>ทดสอบ: อ่านฉลากแล้วบอกชนิด</h2>
<div class="kbq" data-ans="a"><p>1. ฉลาก: <span class="mono">C16 · 6000 · IEC 60898-1</span> ไม่มีปุ่ม Test</p>
 <div class="chips"><button type="button" class="chip" data-o="a">MCB</button><button type="button" class="chip" data-o="b">RCCB</button><button type="button" class="chip" data-o="c">RCBO</button></div>
 <p class="kbqx" data-t="มี curve C และพิกัด 16 A แต่ไม่มีค่า IΔn และไม่มีปุ่ม Test จึงเป็น MCB ป้องกันลัดวงจรและโหลดเกิน ไม่ป้องกันไฟรั่ว" hidden></p></div>
<div class="kbq" data-ans="b"><p>2. ฉลาก: <span class="mono">40 A · IΔn 0.03 A · IEC 61008-1 · มอก. 2425</span> มีปุ่ม T</p>
 <div class="chips"><button type="button" class="chip" data-o="a">MCB</button><button type="button" class="chip" data-o="b">RCCB</button><button type="button" class="chip" data-o="c">RCBO</button></div>
 <p class="kbqx" data-t="มีปุ่ม Test และ IΔn 30 mA แต่ไม่มีตัวอักษร curve และใช้ IEC 61008 / มอก. 2425 จึงเป็น RCCB ต้องมี MCB ป้องกันกระแสเกินในวงจรด้วย" hidden></p></div>
<div class="kbq" data-ans="c"><p>3. ฉลาก: <span class="mono">C20 · IΔn 30 mA · IEC 61009-1 · มอก. 909</span> มีปุ่ม T</p>
 <div class="chips"><button type="button" class="chip" data-o="a">MCB</button><button type="button" class="chip" data-o="b">RCCB</button><button type="button" class="chip" data-o="c">RCBO</button></div>
 <p class="kbqx" data-t="มีทั้ง curve C20 และ IΔn 30 mA ใช้ IEC 61009 / มอก. 909 จึงเป็น RCBO ตัดได้ทั้งลัดวงจร โหลดเกิน และไฟรั่ว" hidden></p></div>
<div class="kbq" data-ans="b"><p>4. ตู้ไฟมี RCCB 63 A 30 mA เป็นเมน ตามด้วย MCB ย่อย ถ้ากดปุ่ม Test ของ RCCB จะเกิดอะไร</p>
 <div class="chips"><button type="button" class="chip" data-o="a">ดับเฉพาะวงจรที่มีไฟรั่ว</button><button type="button" class="chip" data-o="b">ดับทุกวงจรที่อยู่ใต้ RCCB ตัวนั้น</button><button type="button" class="chip" data-o="c">ไม่มีอะไรเกิดขึ้นถ้าไม่มีไฟรั่ว</button></div>
 <p class="kbqx" data-t="ปุ่ม Test สร้างกระแสรั่วจำลองภายในเครื่อง RCCB จึงตัดทั้งชุดที่อยู่ใต้มัน ถ้าต้องการให้ดับเฉพาะวงจรที่มีปัญหา ให้ใช้ RCBO แยกแต่ละวงจร" hidden></p></div>
<div class="kbq" data-ans="a"><p>5. จะใส่ RCD 30 mA ที่ฝั่งสาย DC จากแผงโซลาร์ได้หรือไม่</p>
 <div class="chips"><button type="button" class="chip" data-o="a">ไม่ได้ ฝั่ง DC ใช้ฟิวส์ gPV / เบรกเกอร์ DC / DC isolator</button><button type="button" class="chip" data-o="b">ได้ ถ้าเป็น RCBO</button><button type="button" class="chip" data-o="c">ได้ ถ้าต่อหลังอินเวอร์เตอร์</button></div>
 <p class="kbqx" data-t="RCD สำหรับวงจรบ้านออกแบบให้ทำงานกับไฟ AC ฝั่ง DC ของแผงต้องใช้อุปกรณ์ที่ระบุพิกัด DC ส่วนหลังอินเวอร์เตอร์คือฝั่ง AC ซึ่งไม่ใช่สาย DC จากแผงแล้ว" hidden></p></div>
</section>`,
  init:el=>{kbQuiz(el);return null}
});
