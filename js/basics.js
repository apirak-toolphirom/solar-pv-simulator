/* ---- เมนู 00 แบบฝึกพื้นฐาน: 15 หัวข้อ (dropdown) ใช้แผงตัวอย่างของตัวเอง ไม่อิงอุปกรณ์ในเมนู 01–10 ----
   แต่ละหัวข้อ: สรุปสั้น · แบบจำลองเล็ก (บางหัวข้อมีภารกิจ) · คำถามเลือกตอบ ตรวจทันที
   หัวข้อ "ผ่าน" เมื่อคำถามถูกทุกข้อ และทำภารกิจสำเร็จ (ถ้ามี) · บันทึกไปกับโปรเจ็ค (snapshot.b0) */
const B0={ans:{},task:{}};
const B0P={name:'แผงตัวอย่าง 550 W (ค่าสมมติเพื่อการเรียนรู้)',P:550,Voc:49.9,Isc:14.0,Vmp:41.8,Imp:13.16,bV:-0.27,aI:0.05,gP:-0.35,noct:45,cells:144,ser:72,fuse:25,vsys:1500};

/* I-V model (Xiao/De Soto simplified): I = Isc·(1 − C1·(e^(V/(C2·Voc)) − 1)) fitted to Vmp/Imp of the example panel */
function b0Curve(G,T){
  G=Math.max(0,G);T=+T;
  const P=B0P,isc=P.Isc*G/1000*(1+P.aI/100*(T-25)),voc=G<5?0:Math.max(0,P.Voc*(1+P.bV/100*(T-25))+2.2*Math.log(Math.max(G,20)/1000));
  const c2=(P.Vmp/P.Voc-1)/Math.log(1-P.Imp/P.Isc),c1=(1-P.Imp/P.Isc)*Math.exp(-P.Vmp/(c2*P.Voc));
  const I=v=>voc<=0?0:Math.max(0,isc*(1-c1*(Math.exp(v/(c2*voc))-1)));
  const pts=[];let mp={V:0,I:0,P:0};
  for(let k=0;k<=160;k++){const v=voc*k/160,i=I(v),p=v*i;pts.push([v,i,p]);if(p>mp.P)mp={V:v,I:i,P:p}}
  return{isc,voc,I,pts,mp};
}
/* operating point with a resistor load: solve I(V)=V/R */
function b0OnR(c,R){let lo=0,hi=c.voc;for(let k=0;k<60;k++){const m=(lo+hi)/2;if(c.I(m)>m/R)lo=m;else hi=m}const V=(lo+hi)/2;return{V,I:V/R,P:V*V/R}}
const b0f=(x,d=1)=>Number(x).toLocaleString('th-TH',{minimumFractionDigits:d,maximumFractionDigits:d});

/* small line chart: series [{pts:[[x,y]],col,lab,dash}] · dots [{x,y,col,lab}] */
function b0Chart(o){
  const W=520,H=260,L=46,R=o.y2?46:14,T=14,B=36,pw=W-L-R,ph=H-T-B;
  const X=x=>L+x/o.xmax*pw,Y=y=>T+ph-y/o.ymax*ph,Y2=y=>T+ph-y/(o.y2max||1)*ph;
  let s=`<svg class="b0ch" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria||'กราฟ')}">`;
  for(let k=0;k<=4;k++){const yy=T+ph*k/4;s+=`<line x1="${L}" x2="${L+pw}" y1="${yy}" y2="${yy}" class="b0grid"/><text x="${L-6}" y="${yy+4}" class="b0ax" text-anchor="end">${b0f(o.ymax*(4-k)/4,o.ymax<20?1:0)}</text>`;
    if(o.y2)s+=`<text x="${L+pw+6}" y="${yy+4}" class="b0ax">${b0f(o.y2max*(4-k)/4,0)}</text>`}
  for(let k=0;k<=5;k++){const xx=L+pw*k/5;s+=`<text x="${xx}" y="${T+ph+16}" class="b0ax" text-anchor="middle">${b0f(o.xmax*k/5,0)}</text>`}
  s+=`<line x1="${L}" x2="${L+pw}" y1="${T+ph}" y2="${T+ph}" class="b0axl"/><line x1="${L}" x2="${L}" y1="${T}" y2="${T+ph}" class="b0axl"/>`;
  s+=`<text x="${L+pw/2}" y="${H-4}" class="b0ax" text-anchor="middle">${esc(o.xl||'')}</text><text x="10" y="${T+ph/2}" class="b0ax" text-anchor="middle" transform="rotate(-90 10 ${T+ph/2})">${esc(o.yl||'')}</text>`;
  if(o.y2)s+=`<text x="${W-8}" y="${T+ph/2}" class="b0ax" text-anchor="middle" transform="rotate(90 ${W-8} ${T+ph/2})">${esc(o.y2l||'')}</text>`;
  (o.series||[]).forEach(se=>{const f2=se.y2?Y2:Y;s+=`<polyline fill="none" stroke="${se.col}" stroke-width="2.4" ${se.dash?'stroke-dasharray="6 4"':''} points="${se.pts.map(p=>X(Math.min(p[0],o.xmax)).toFixed(1)+','+f2(Math.min(p[1],se.y2?o.y2max:o.ymax)).toFixed(1)).join(' ')}"/>`});
  (o.dots||[]).forEach(d=>{const f2=d.y2?Y2:Y,cx=X(d.x),cy=f2(d.y);s+=`<circle cx="${cx}" cy="${cy}" r="5" fill="${d.col}" stroke="var(--surface)" stroke-width="1.5"/>`;if(d.lab)s+=`<text x="${cx+(cx>L+pw*.7?-8:8)}" y="${cy-8}" class="b0lab" text-anchor="${cx>L+pw*.7?'end':'start'}">${esc(d.lab)}</text>`});
  if(o.legend)s+=o.legend.map((g,k)=>`<g transform="translate(${L+10+k*150},${T+4})"><line x1="0" x2="18" y1="6" y2="6" stroke="${g[1]}" stroke-width="3" ${g[2]?'stroke-dasharray="5 3"':''}/><text x="24" y="10" class="b0ax">${esc(g[0])}</text></g>`).join('');
  return s+'</svg>';
}
/* control helpers */
const b0Rng=(id,lab,min,max,step,val,unit)=>`<label class="b0r"><span>${lab}</span><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"><b id="${id}v">${val}${unit||''}</b></label>`;
const b0Sel=(id,lab,opts,val)=>`<label class="b0s"><span>${lab}</span><select id="${id}">${opts.map(o=>{const[v,t]=Array.isArray(o)?o:[o,o];return`<option value="${esc(v)}" ${String(v)===String(val)?'selected':''}>${esc(t)}</option>`}).join('')}</select></label>`;
const b0Kv=rows=>`<div class="b0kv">${rows.map(r=>`<div class="${r[2]||''}"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}</div>`;
const b0V=id=>{const e=document.getElementById(id);return e?+e.value:0};
function b0Bind(root,ids,fn,units){ids.forEach((id,k)=>{const e=root.querySelector('#'+id);if(!e)return;e.addEventListener('input',()=>{const v=root.querySelector('#'+id+'v');if(v)v.textContent=e.value+((units&&units[k])||'');fn()})});fn()}
function b0Msg(el,ok,t){el.className='b0msg '+(ok===true?'ok':ok===false?'err':'');el.textContent=t}
function b0Task(id,ok){if(!!B0.task[id]===!!ok)return;B0.task[id]=!!ok;b0Save()}

/* ---- topics ---- */
const B0T=[
{id:'t1',title:'หลักการทำงานของแผงโซลาร์เซลล์',desc:'การเปลี่ยนพลังงานแสงอาทิตย์เป็นไฟฟ้ากระแสตรง (DC)',
 intro:`<ul><li>เซลล์ทำจากสารกึ่งตัวนำ (ซิลิคอนชนิด N ประกบชนิด P) แสง (โฟตอน) ที่ตกกระทบให้พลังงานแก่อิเล็กตรอนจนหลุดเป็นอิสระ สนามไฟฟ้าที่รอยต่อ P-N ผลักอิเล็กตรอนไปด้านเดียว เกิดแรงดันและกระแส เรียกว่า <b>ปรากฏการณ์โฟโตโวลตาอิก</b></li>
 <li>ไฟที่ได้เป็น <b>ไฟฟ้ากระแสตรง (DC)</b> มีขั้ว + และ − ชัดเจน</li><li><b>กระแส</b> แปรผันตรงกับความเข้มแสง ส่วน <b>แรงดัน</b> เปลี่ยนน้อยเมื่อแสงเปลี่ยน แต่ลดลงเมื่อเซลล์ร้อนขึ้น</li></ul>`,
 w(el){
  el.innerHTML=`<div class="b0fig"><svg viewBox="0 0 520 170" class="b0ill" role="img" aria-label="แสงตกกระทบเซลล์ อิเล็กตรอนไหลผ่านหลอดไฟ">
   <circle cx="40" cy="36" r="20" fill="var(--accent)"/><g stroke="var(--accent)" stroke-width="2.5"><line x1="62" y1="44" x2="150" y2="78"/><line x1="56" y1="58" x2="140" y2="92"/><line x1="70" y1="30" x2="170" y2="70"/></g>
   <rect x="150" y="70" width="190" height="22" fill="var(--s1)" opacity=".85"/><text x="245" y="85" text-anchor="middle" class="b0lab" fill="#fff">ชนิด N (−)</text>
   <rect x="150" y="92" width="190" height="40" fill="var(--s2)" opacity=".75"/><text x="245" y="117" text-anchor="middle" class="b0lab" fill="#fff">ชนิด P (+)</text>
   <path d="M340 80 H420 V40 H470" fill="none" stroke="var(--neg)" stroke-width="2.5"/><path d="M340 120 H420 V150 H500 V60" fill="none" stroke="var(--pos)" stroke-width="2.5"/>
   <circle id="b1bulb" cx="482" cy="50" r="16" fill="var(--accent)" opacity=".6" stroke="var(--ink)"/><text x="482" y="92" text-anchor="middle" class="b0ax">หลอด DC</text>
   <text x="380" y="72" class="b0ax">e⁻ →</text></svg></div>
   ${b0Rng('b1g','ความเข้มแสง (W/m²)',0,1200,50,1000)}${b0Rng('b1t','อุณหภูมิเซลล์ (°C)',10,75,1,25,' °C')}<div id="b1o"></div>`;
  b0Bind(el,['b1g','b1t'],()=>{const c=b0Curve(b0V('b1g'),b0V('b1t'));
   el.querySelector('#b1o').innerHTML=b0Kv([['กระแสลัดวงจร Isc',b0f(c.isc,2)+' A'],['แรงดันวงจรเปิด Voc',b0f(c.voc,1)+' V'],['กำลังสูงสุด',b0f(c.mp.P,0)+' W'],['ชนิดไฟ','DC (มีขั้ว + / −)']]);
   el.querySelector('#b1bulb').setAttribute('opacity',(0.1+0.9*Math.min(1,c.mp.P/550)).toFixed(2))},['',' °C']);
 },
 q:[{q:'แผงโซลาร์เซลล์ผลิตไฟฟ้าชนิดใด',o:['ไฟฟ้ากระแสสลับ (AC) 230 V','ไฟฟ้ากระแสตรง (DC)','ไฟฟ้าสถิต','ไฟฟ้า 3 เฟส'],a:1,ex:'เซลล์ให้ไฟ DC ต้องใช้อินเวอร์เตอร์แปลงเป็น AC ก่อนใช้กับเครื่องใช้ไฟฟ้าในบ้าน'},
  {q:'ถ้าแสงลดลงเหลือครึ่งหนึ่ง (อุณหภูมิคงที่) ค่าใดลดลงเกือบครึ่งตาม',o:['แรงดันวงจรเปิด Voc','กระแส','ความถี่','ไม่มีค่าใดเปลี่ยน'],a:1,ex:'กระแสแปรผันตรงกับความเข้มแสง ส่วนแรงดันลดลงเพียงเล็กน้อย ลองเลื่อนแถบความเข้มแสงดู'},
  {q:'ปรากฏการณ์ที่ทำให้เซลล์แสงอาทิตย์ผลิตไฟฟ้าได้เรียกว่าอะไร',o:['ปรากฏการณ์เรือนกระจก','ปรากฏการณ์โฟโตโวลตาอิก','การเหนี่ยวนำแม่เหล็กไฟฟ้า','เทอร์โมอิเล็กทริก'],a:1,ex:'Photovoltaic effect: แสงให้พลังงานแก่อิเล็กตรอนในสารกึ่งตัวนำจนเกิดแรงดันที่รอยต่อ P-N'}]},

{id:'t2',title:'เซลล์ - โมดูล - สตริง - อาร์เรย์ คืออะไร?',desc:'โครงสร้างตั้งแต่หน่วยย่อยจนถึงระบบใหญ่',
 intro:`<ul><li><b>เซลล์ (Cell)</b> หน่วยเล็กสุด แรงดันวงจรเปิดราว 0.6–0.7 V ต่อเซลล์</li><li><b>โมดูล / แผง (Module)</b> เซลล์หลายสิบเซลล์ต่ออนุกรมในกรอบเดียว เช่น 60, 72 เซลล์ หรือแบบครึ่งเซลล์ 120 / 144 (ต่ออนุกรมจริง 60 / 72 ชุด)</li>
 <li><b>สตริง (String)</b> แผงหลายแผงต่ออนุกรม แรงดันรวมกัน กระแสเท่าแผงเดียว</li><li><b>อาร์เรย์ (Array)</b> หลายสตริงต่อขนานกัน กระแสรวมกัน กำลังรวมทั้งระบบ</li></ul>`,
 w(el){
  el.innerHTML=`${b0Sel('b2c','ชนิดแผง',[['60','60 เซลล์'],['72','72 เซลล์'],['120','ครึ่งเซลล์ 120'],['144','ครึ่งเซลล์ 144']],'144')}${b0Rng('b2n','แผงต่อสตริง',1,16,1,8,' แผง')}${b0Rng('b2s','จำนวนสตริง',1,4,1,2,' สตริง')}<div id="b2o"></div><div id="b2g" class="b0grid2"></div>`;
  b0Bind(el,['b2n','b2s'],()=>{const c=+el.querySelector('#b2c').value,ser=c>100?c/2:c,vcell=0.69,vmod=ser*vcell,n=b0V('b2n'),s=b0V('b2s');
   const wmod=Math.round(ser*vcell*0.8*(c>100?13.2:10.5)/5)*5;
   el.querySelector('#b2o').innerHTML=b0Kv([['เซลล์ต่ออนุกรมในแผง',ser+' ชุด'],['Voc ต่อแผง ≈ '+ser+' × 0.69 V',b0f(vmod,1)+' V'],['Voc ต่อสตริง',b0f(vmod*n,0)+' V'],['กระแสรวม (เท่าจำนวนสตริง)','× '+s],['จำนวนแผงทั้งหมด',n*s+' แผง'],['กำลังรวมโดยประมาณ',b0f(n*s*wmod/1000,2)+' kWp ('+wmod+' W/แผง)']]);
   el.querySelector('#b2g').innerHTML=Array.from({length:s},(_,k)=>`<div class="b0str"><span>สตริง ${k+1}</span>${'<i></i>'.repeat(n)}</div>`).join('')+`<p class="hint tight">แต่ละแถว = 1 สตริง (แผงต่ออนุกรม) · ทุกแถวต่อขนานกันเป็น 1 อาร์เรย์</p>`},[' แผง',' สตริง']);
  el.querySelector('#b2c').addEventListener('change',()=>el.querySelector('#b2n').dispatchEvent(new Event('input')));
 },
 q:[{q:'"สตริง (String)" หมายถึงข้อใด',o:['เซลล์หลายเซลล์ในกรอบเดียว','แผงหลายแผงต่ออนุกรมกัน','สายไฟ AC จากอินเวอร์เตอร์','แผงหลายแผงต่อขนานกันทั้งหมด'],a:1,ex:'สตริง = แผงต่ออนุกรม แรงดันรวมกัน หลายสตริงขนานกันจึงเป็นอาร์เรย์'},
  {q:'เซลล์ซิลิคอนหนึ่งเซลล์มีแรงดันวงจรเปิดประมาณเท่าใด',o:['0.6–0.7 V','1.5 V','12 V','40 V'],a:0,ex:'ต้องนำเซลล์หลายสิบเซลล์มาต่ออนุกรมจึงได้แรงดันแผงราว 40–50 V'},
  {q:'อาร์เรย์ 2 สตริง สตริงละ 10 แผง แผงละ 550 W มีกำลังติดตั้งเท่าใด',o:['5.5 kWp','11 kWp','1.1 kWp','22 kWp'],a:1,ex:'2 × 10 × 550 W = 11,000 W = 11 kWp'}]},

{id:'t3',title:'วิธีวัดแรงดันวงจรเปิด (Voc) และกระแสลัดวงจร (Isc)',desc:'ใช้เครื่องมือวัดตรวจสภาพแผงก่อนต่อใช้งาน',task:'วัด Voc และ Isc ได้ถูกวิธี',
 intro:`<ul><li><b>Voc</b> วัดด้วยมัลติมิเตอร์ย่าน <b>V DC</b> คร่อมขั้ว + และ − ขณะ <b>ไม่ต่อโหลด</b> ตั้งย่านสูงกว่าค่าที่คาดไว้</li>
 <li><b>Isc</b> ลัดขั้ว + กับ − ผ่าน <b>สวิตช์/เบรกเกอร์ DC</b> แล้วคล้อง <b>แคลมป์มิเตอร์ DC</b> ที่สายลัด ห้ามเสียบสายมิเตอร์ช่อง A ตรงขั้วแผง (กระแสเกินพิกัด ฟิวส์มิเตอร์ขาด และเกิดอาร์กตอนปลดสาย)</li>
 <li>จดความเข้มแสงและอุณหภูมิแผงพร้อมกันทุกครั้ง เพราะค่าที่วัดเปลี่ยนตามสองค่านี้ ป้ายแผงบอกค่าที่ STC (1000 W/m², 25 °C)</li></ul>`,
 w(el){
  el.innerHTML=`${b0Sel('b3m','เครื่องมือ / ย่าน',[['vdc','มัลติมิเตอร์ V DC (V⎓)'],['vac','มัลติมิเตอร์ V AC (V~)'],['ohm','มัลติมิเตอร์ Ω'],['adc','มัลติมิเตอร์ A DC (ช่อง 10 A)'],['clamp','แคลมป์มิเตอร์ DC (Hall)']],'vac')}
   ${b0Sel('b3c','การต่อ',[['open','จิ้มคร่อมขั้ว + และ − (ไม่มีโหลด)'],['short','ลัดขั้วผ่านสวิตช์ DC แล้วคล้องแคลมป์ที่สายลัด'],['meter','ต่อสายมิเตอร์แทนสายลัด (มิเตอร์อยู่ในวงจร)']],'open')}
   ${b0Rng('b3g','ความเข้มแสงขณะวัด (W/m²)',200,1100,50,900)}${b0Rng('b3t','อุณหภูมิแผง (°C)',20,70,1,45,' °C')}
   <div class="b0meter"><span class="b0lcd" id="b3lcd">--.-</span><span id="b3u"></span></div><p class="b0msg" id="b3msg"></p><div class="b0done" id="b3d"></div>`;
  const st={voc:false,isc:false};
  const run=()=>{const m=el.querySelector('#b3m').value,cn=el.querySelector('#b3c').value,c=b0Curve(b0V('b3g'),b0V('b3t'));
   const lcd=el.querySelector('#b3lcd'),u=el.querySelector('#b3u'),msg=el.querySelector('#b3msg');let ok=null,t='';
   if(cn==='open'){
    if(m==='vdc'){lcd.textContent=b0f(c.voc,1);u.textContent='V DC';ok=true;st.voc=true;t=`ถูกต้อง: นี่คือ Voc ที่สภาพนี้ (ป้ายบอก ${B0P.Voc} V ที่ STC) แผงร้อนกว่า 25 °C ค่าจึงต่ำกว่าป้าย`}
    else if(m==='vac'){lcd.textContent='0.0';u.textContent='V AC';ok=false;t='ตั้งผิดย่าน: แผงให้ไฟ DC ย่าน AC อ่านค่าไม่ถูก'}
    else if(m==='ohm'){lcd.textContent='Err';u.textContent='Ω';ok=false;t='อันตราย: ห้ามวัดโอห์มกับวงจรที่มีแรงดัน มิเตอร์อาจเสียหาย'}
    else if(m==='adc'){lcd.textContent='FUSE';u.textContent='';ok=false;t='อันตราย: ช่อง A มีความต้านทานต่ำ จิ้มคร่อมขั้วเท่ากับลัดวงจรผ่านมิเตอร์ กระแส '+b0f(c.isc,1)+' A เกิน 10 A ฟิวส์มิเตอร์ขาด'}
    else{lcd.textContent='0.00';u.textContent='A';ok=false;t='ไม่มีกระแสไหลขณะวงจรเปิด แคลมป์จึงอ่านได้ 0 A'}}
   else if(cn==='short'){
    if(m==='clamp'){lcd.textContent=b0f(c.isc,2);u.textContent='A DC';ok=true;st.isc=true;t=`ถูกต้อง: นี่คือ Isc ที่สภาพนี้ (ป้ายบอก ${B0P.Isc} A ที่ 1000 W/m²) เปิดสวิตช์ DC ก่อนปลดสายลัดทุกครั้ง`}
    else if(m==='vdc'){lcd.textContent='0.0';u.textContent='V DC';ok=false;t='ขั้วถูกลัดอยู่ แรงดันจึงใกล้ 0 V ถ้าต้องการ Isc ให้ใช้แคลมป์ DC'}
    else{lcd.textContent='?';u.textContent='';ok=false;t='เครื่องมือนี้วัดกระแสในสายลัดไม่ได้ ใช้แคลมป์มิเตอร์ DC (แบบ Hall effect)'}}
   else{
    if(m==='adc'){lcd.textContent='FUSE';u.textContent='';ok=false;t='กระแส '+b0f(c.isc,1)+' A เกินพิกัดช่อง 10 A และเมื่อดึงสายออกจะเกิดอาร์ก DC ใช้สวิตช์ DC + แคลมป์แทน'}
    else if(m==='vdc'){lcd.textContent=b0f(c.voc,1);u.textContent='V DC';ok=null;t='ช่อง V มีความต้านทานสูง จึงไม่ใช่การลัดวงจร ค่าที่อ่านได้คือ Voc (เลือกการต่อ "จิ้มคร่อมขั้ว" จะตรงความหมายกว่า)'}
    else{lcd.textContent='Err';u.textContent='';ok=false;t='การต่อแบบนี้ไม่ถูกต้องสำหรับเครื่องมือที่เลือก'}}
   b0Msg(msg,ok,t);
   el.querySelector('#b3d').innerHTML=`<span class="${st.voc?'ok':''}">${st.voc?'✓':'○'} วัด Voc ถูกวิธี</span><span class="${st.isc?'ok':''}">${st.isc?'✓':'○'} วัด Isc ถูกวิธี</span>`;
   if(st.voc&&st.isc)b0Task('t3',true)};
  ['b3m','b3c'].forEach(id=>el.querySelector('#'+id).addEventListener('change',run));
  b0Bind(el,['b3g','b3t'],run,['',' °C']);
 },
 q:[{q:'ตั้งมิเตอร์และต่ออย่างไรจึงวัด Voc ได้ถูกต้อง',o:['V AC คร่อมขั้วขณะต่ออินเวอร์เตอร์','V DC คร่อมขั้ว + และ − ขณะไม่มีโหลด','A DC ต่ออนุกรมกับแผง','Ω คร่อมขั้ว'],a:1,ex:'Voc = แรงดันขณะวงจรเปิด (ไม่มีกระแสไหล) วัดด้วยย่าน V DC'},
  {q:'ทำไมไม่ควรวัด Isc ของแผง 550 W โดยเสียบสายมิเตอร์ช่อง 10 A ตรงขั้วแผง',o:['เพราะมิเตอร์จะอ่านค่าเป็นลบ','เพราะ Isc ราว 14 A เกินพิกัดช่องวัด และเกิดอาร์ก DC ตอนปลดสาย','เพราะแผงจะผลิตไฟ AC','ไม่มีปัญหา ทำได้ตามปกติ'],a:1,ex:'ใช้สวิตช์ DC ลัดขั้วแล้วคล้องแคลมป์ DC ปลอดภัยกว่าและวัดได้เกิน 10 A'},
  {q:'แดดดี แผงไม่ร้อน แต่วัด Voc ได้ประมาณ 2 ใน 3 ของค่าบนป้าย สาเหตุที่น่าจะเป็นคือ',o:['ไดโอดบายพาส 1 ใน 3 ตัวลัดวงจร หรือเซลล์กลุ่มหนึ่งเสีย','ความเข้มแสงสูงเกินไป','มิเตอร์ตั้งย่าน V DC','ปกติของแผงทุกแผง'],a:0,ex:'แผงส่วนใหญ่แบ่งเซลล์เป็น 3 กลุ่ม แต่ละกลุ่มมีไดโอดบายพาส ถ้าตัวใดลัด Voc จะหายไปราว 1/3'}]},

{id:'t4',title:'วิธีวัดแรงดันที่จุดกำลังสูงสุด (Vmp) และกระแสที่จุดกำลังสูงสุด (Imp)',desc:'การวัดค่าขณะแผงจ่ายพลังงานสูงสุด',task:'หาจุดกำลังสูงสุด (≥ 98% ของ Pmax)',
 intro:`<ul><li>Vmp และ Imp คือแรงดันและกระแสที่ทำให้ <b>P = V × I</b> สูงสุด ต้องวัดขณะแผง <b>จ่ายโหลด</b> (เช่น อินเวอร์เตอร์ที่มี MPPT กำลังทำงาน) ไม่ใช่วงจรเปิดหรือลัดวงจร</li>
 <li>วัด V ด้วยมัลติมิเตอร์ V DC คร่อมขั้ว และวัด I ด้วยแคลมป์ DC ที่สายเส้นเดียว <b>พร้อมกัน</b> ขณะแสงนิ่ง</li><li>โดยทั่วไป Vmp ≈ 80% ของ Voc และ Imp ≈ 93–95% ของ Isc</li></ul>`,
 w(el){
  el.innerHTML=`<p class="hint tight">ภารกิจ: ปรับค่าความต้านทานโหลดจนได้กำลังสูงสุด (เหมือนที่ MPPT ในอินเวอร์เตอร์ทำเอง)</p>${b0Rng('b4r','ความต้านทานโหลด',0,100,1,20)}${b0Rng('b4g','ความเข้มแสง (W/m²)',300,1100,50,1000)}<div id="b4o"></div><div id="b4c"></div><p class="b0msg" id="b4msg"></p>`;
  const R=k=>0.4*Math.pow(150,k/100);
  b0Bind(el,['b4r','b4g'],()=>{const c=b0Curve(b0V('b4g'),25),r=R(b0V('b4r')),op=b0OnR(c,r),pct=op.P/c.mp.P*100;
   el.querySelector('#b4rv').textContent=b0f(r,2)+' Ω';
   el.querySelector('#b4o').innerHTML=b0Kv([['แรงดัน (มัลติมิเตอร์)',b0f(op.V,1)+' V'],['กระแส (แคลมป์ DC)',b0f(op.I,2)+' A'],['กำลัง P = V × I',b0f(op.P,0)+' W'],['เทียบกำลังสูงสุดที่เป็นไปได้',b0f(pct,1)+' %',pct>=98?'ok':'']]);
   el.querySelector('#b4c').innerHTML=b0Chart({xmax:52,ymax:15,y2:true,y2max:600,xl:'แรงดัน (V)',yl:'กระแส (A)',y2l:'กำลัง (W)',aria:'เส้น I-V และ P-V พร้อมจุดทำงาน',
    series:[{pts:c.pts.map(p=>[p[0],p[1]]),col:'var(--s1)'},{pts:c.pts.map(p=>[p[0],p[2]]),col:'var(--s2)',y2:true,dash:true},{pts:[[0,0],[c.voc,c.voc/r]],col:'var(--muted)'}],
    dots:[{x:op.V,y:op.I,col:'var(--accent)',lab:'จุดทำงาน'}],legend:[['I-V','var(--s1)'],['P-V','var(--s2)',1],['เส้นโหลด V/R','var(--muted)']]});
   const ok=pct>=98;b0Msg(el.querySelector('#b4msg'),ok?true:null,ok?`สำเร็จ: Vmp ≈ ${b0f(op.V,1)} V, Imp ≈ ${b0f(op.I,2)} A (ป้ายแผงตัวอย่าง ${B0P.Vmp} V / ${B0P.Imp} A ที่ STC)`:'ลองเลื่อนให้จุดทำงานอยู่ตรง "เข่า" ของเส้นโค้ง (ยอดเส้นกำลัง)');
   if(ok)b0Task('t4',true)});
 },
 q:[{q:'ปกติ Vmp ของแผงซิลิคอนอยู่ราวกี่เปอร์เซ็นต์ของ Voc',o:['ประมาณ 30%','ประมาณ 50%','ประมาณ 80%','100% (เท่ากัน)'],a:2,ex:'แผงตัวอย่าง 41.8 / 49.9 ≈ 84%'},
  {q:'จะวัด Vmp และ Imp ได้ต้องวัดในสภาวะใด',o:['ขณะปลดแผงออกจากวงจร','ขณะลัดขั้วแผง','ขณะแผงจ่ายโหลด/อินเวอร์เตอร์ทำงาน แสงคงที่ วัด V และ I พร้อมกัน','ตอนกลางคืน'],a:2,ex:'วงจรเปิดได้ Voc ลัดวงจรได้ Isc ส่วนจุดกำลังสูงสุดอยู่ระหว่างสองค่านี้ขณะมีโหลด'},
  {q:'วัดได้ 40 V และ 12 A พร้อมกัน แผงจ่ายกำลังเท่าใด',o:['52 W','480 W','3.33 W','4,800 W'],a:1,ex:'P = V × I = 40 × 12 = 480 W'}]},

{id:'t5',title:'การทำงานของอินเวอร์เตอร์ (Inverter)',desc:'แปลงไฟ DC เป็น AC เพื่อใช้ในบ้าน',
 intro:`<ul><li>อินเวอร์เตอร์สวิตช์ไฟ DC ด้วยทรานซิสเตอร์กำลังความถี่สูง แล้วกรองให้เป็นคลื่นไซน์ <b>AC 230 V 50 Hz</b> (ไฟบ้านไทย 1 เฟส)</li>
 <li><b>On-grid</b> ขนานกับไฟการไฟฟ้า ต้องหยุดจ่ายทันทีเมื่อไฟดับ (Anti-islanding) เพื่อความปลอดภัยของช่าง · <b>Off-grid</b> สร้างไฟเองจากแบต · <b>Hybrid</b> ทำได้ทั้งสองแบบ</li>
 <li>มีวงจร <b>MPPT</b> ฝั่ง DC และมีประสิทธิภาพราว 95–98% กำลังส่วนที่เหลือกลายเป็นความร้อน</li></ul>`,
 w(el){
  el.innerHTML=`<p class="hint tight">อินเวอร์เตอร์ตัวอย่าง 5 kW (AC) · รับ DC สูงสุด 7.5 kW</p>${b0Rng('b5p','กำลัง DC จากแผง (W)',0,7500,100,3000)}${b0Sel('b5grid','ไฟการไฟฟ้า',[['on','ปกติ'],['off','ไฟดับ']],'on')}${b0Sel('b5ty','ชนิดอินเวอร์เตอร์',[['on','On-grid'],['hy','Hybrid (มีแบต)']],'on')}<div id="b5o"></div><div id="b5w"></div>`;
  const run=()=>{const p=b0V('b5p'),grid=el.querySelector('#b5grid').value,ty=el.querySelector('#b5ty').value,ld=p/5000;
   const eta=p<=0?0:Math.min(0.975,0.975-0.06*Math.exp(-ld*9)),ac0=p*eta,ac=Math.min(5000,ac0),clip=ac0>5000;
   const stop=grid==='off'&&ty==='on';
   el.querySelector('#b5o').innerHTML=b0Kv([['ประสิทธิภาพ',stop?'—':b0f(eta*100,1)+' %'],['กำลัง AC ที่จ่าย',stop?'0 W (หยุดจ่าย Anti-islanding)':b0f(ac,0)+' W',stop?'err':''],['ความร้อนสูญเสีย',stop?'0 W':b0f(Math.max(0,p*(1-eta)),0)+' W'],['ตัดยอด (Clipping)',clip&&!stop?b0f(ac0-5000,0)+' W':'ไม่มี',clip&&!stop?'warn':'']]);
   const amp=stop?0:Math.max(.15,Math.min(1,ac/5000));let d='',dd='';for(let k=0;k<=200;k++){const x=20+k*2.4,y=80-50*amp*Math.sin(k/200*4*Math.PI);d+=(k?'L':'M')+x.toFixed(1)+' '+y.toFixed(1)}
   dd=`M20 ${80-40*Math.min(1,p/7500)} H500`;
   el.querySelector('#b5w').innerHTML=`<svg viewBox="0 0 520 150" class="b0ill" role="img" aria-label="เทียบไฟ DC กับคลื่นไซน์ AC"><line x1="20" x2="500" y1="80" y2="80" class="b0grid"/><path d="${dd}" stroke="var(--pos)" stroke-width="2.5" fill="none" stroke-dasharray="6 4"/><path d="${d}" stroke="var(--s1)" stroke-width="2.5" fill="none"/><text x="24" y="146" class="b0ax">เส้นประแดง = DC (คงที่) · เส้นน้ำเงิน = AC 50 Hz (2 รอบ = 40 ms)${stop?' · ไฟดับ: On-grid หยุดจ่าย':''}</text></svg>`};
  ['b5grid','b5ty'].forEach(id=>el.querySelector('#'+id).addEventListener('change',run));b0Bind(el,['b5p'],run,[' W']);
 },
 q:[{q:'หน้าที่หลักของอินเวอร์เตอร์ในระบบโซลาร์บ้านคืออะไร',o:['เก็บพลังงานไว้ใช้ตอนกลางคืน','แปลงไฟ DC จากแผงเป็นไฟ AC 230 V 50 Hz','เพิ่มความเข้มแสงให้แผง','ป้องกันฟ้าผ่า'],a:1,ex:'ส่วนการเก็บพลังงานเป็นหน้าที่ของแบตเตอรี่'},
  {q:'เมื่อไฟการไฟฟ้าดับ อินเวอร์เตอร์ On-grid ทำอย่างไร',o:['จ่ายไฟต่อให้ทั้งบ้าน','หยุดจ่ายไฟทันที (Anti-islanding)','เพิ่มแรงดันเป็น 400 V','สลับไปชาร์จแบต'],a:1,ex:'ป้องกันไฟย้อนเข้าสายของการไฟฟ้าขณะช่างกำลังซ่อม'},
  {q:'รับ DC 5,000 W ประสิทธิภาพ 97% จะได้ AC ประมาณเท่าใด',o:['5,150 W','4,850 W','3,500 W','5,000 W พอดี'],a:1,ex:'5,000 × 0.97 = 4,850 W อีก 150 W เป็นความร้อน'}]},

{id:'t6',title:'การทำงานของเครื่องควบคุมการชาร์จ (Charger/Controller)',desc:'ชาร์จแบตอย่างปลอดภัย ระบบ PWM / MPPT',
 intro:`<ul><li><b>PWM</b> เปิด-ปิดสวิตช์ต่อแผงกับแบตตรง ๆ แผงจึงถูกดึงแรงดันลงมาเท่าแบต ใช้ได้ดีเมื่อ Vmp ของแผงใกล้แรงดันชาร์จแบต (แผง "12 V" กับแบต 12 V)</li>
 <li><b>MPPT</b> เป็นตัวแปลง DC-DC ให้แผงทำงานที่ Vmp แล้วแปลงแรงดันส่วนเกินเป็นกระแสชาร์จ ได้พลังงานมากกว่า โดยเฉพาะแผงแรงดันสูง</li>
 <li>ขั้นตอนชาร์จ: Bulk → Absorption → Float · <b>ต่อแบตเข้าคอนโทรลเลอร์ก่อน แล้วจึงต่อแผง</b> (ถอดกลับลำดับ) เพื่อให้คอนโทรลเลอร์รู้แรงดันระบบ</li></ul>`,
 w(el){
  el.innerHTML=`<p class="hint tight">ใช้แผงตัวอย่าง 1 แผง (Vmp ${B0P.Vmp} V) · ตัวควบคุมรับกระแสชาร์จสูงสุด 40 A</p>${b0Sel('b6b','แบตเตอรี่',[['12','12 V (ชาร์จ ~13.8 V)'],['24','24 V (ชาร์จ ~27.6 V)'],['48','48 V (ชาร์จ ~55.2 V)']],'12')}${b0Rng('b6g','ความเข้มแสง (W/m²)',200,1100,50,1000)}<div id="b6o"></div>`;
  const run=()=>{const vb={12:13.8,24:27.6,48:55.2}[el.querySelector('#b6b').value],c=b0Curve(b0V('b6g'),45);
   const pwmI=vb<c.voc?c.I(vb):0,pwmP=pwmI*vb,mpP=Math.min(c.mp.P*0.97,40*vb),mpI=mpP/vb;
   el.querySelector('#b6o').innerHTML=`<table class="t b0tb"><tr><th></th><th>PWM</th><th>MPPT</th></tr>
    <tr><td>แผงทำงานที่</td><td>${b0f(vb,1)} V</td><td>${b0f(c.mp.V,1)} V (Vmp)</td></tr>
    <tr><td>กระแสชาร์จเข้าแบต</td><td>${b0f(pwmI,1)} A</td><td>${b0f(mpI,1)} A</td></tr>
    <tr><td>กำลังชาร์จ</td><td><b>${b0f(pwmP,0)} W</b></td><td><b>${b0f(mpP,0)} W</b></td></tr>
    <tr><td>ใช้กำลังแผงได้</td><td>${b0f(pwmP/c.mp.P*100,0)} %</td><td>${b0f(mpP/c.mp.P*100,0)} %</td></tr></table>
    <p class="hint tight">${pwmI===0?'แรงดันชาร์จสูงกว่า Voc ของแผงเดียว PWM จึงชาร์จไม่ได้เลย ต้องต่อแผงอนุกรมเพิ่มหรือใช้ MPPT ที่รองรับ':'PWM ดึงแผงลงมาเท่าแรงดันแบต กระแสไม่เพิ่มตาม ส่วน MPPT แปลงแรงดันส่วนเกินเป็นกระแส'} (อุณหภูมิแผง 45 °C)</p>`};
  el.querySelector('#b6b').addEventListener('change',run);b0Bind(el,['b6g'],run);
 },
 q:[{q:'ข้อดีหลักของ MPPT เมื่อเทียบกับ PWM คืออะไร',o:['ราคาถูกกว่าเสมอ','ให้แผงทำงานที่ Vmp และแปลงแรงดันส่วนเกินเป็นกระแสชาร์จ ได้พลังงานมากกว่า','ไม่ต้องต่อแบต','ใช้ได้เฉพาะไฟ AC'],a:1,ex:'ยิ่ง Vmp ของแผงสูงกว่าแรงดันแบตมาก MPPT ยิ่งได้เปรียบ'},
  {q:'ใช้ PWM กับแบต 12 V และแผง Vmp 41.8 V จะใช้กำลังแผงได้ราวเท่าใด',o:['เกือบ 100%','ราว 1/3','ราว 2 เท่า','ใช้ไม่ได้เลย'],a:1,ex:'แผงถูกดึงลงที่ ~13.8 V กระแสใกล้ Isc กำลังจึงเหลือราว 13.8 × 14 ≈ 190 W จาก 550 W'},
  {q:'ลำดับการต่อชาร์จคอนโทรลเลอร์ที่ถูกต้องคือ',o:['ต่อแผงก่อน แล้วค่อยต่อแบต','ต่อแบตก่อน แล้วค่อยต่อแผง','ต่อพร้อมกัน','ต่อโหลดก่อนทุกอย่าง'],a:1,ex:'คอนโทรลเลอร์ตรวจแรงดันระบบจากแบต ต่อแผงก่อนอาจตรวจผิดหรือเสียหาย'}]},

{id:'t7',title:'แบตเตอรี่ (Battery)',desc:'ประเภทและการกักเก็บพลังงาน ระบบ Off-Grid / Hybrid',
 intro:`<ul><li>พลังงานแบต (Wh) = แรงดัน (V) × ความจุ (Ah) · ใช้ได้จริง = พลังงาน × <b>DoD</b> (ความลึกการคายประจุที่แนะนำ) × ประสิทธิภาพอินเวอร์เตอร์</li>
 <li><b>ตะกั่วกรด</b> ราคาถูก หนัก ควรใช้ไม่เกินราว 50% · <b>ลิเธียมฟอสเฟต (LiFePO4)</b> ใช้ได้ลึก 80–90% อายุรอบมากกว่าหลายเท่า มี BMS ควบคุม</li>
 <li>ต่อ <b>อนุกรม</b> แรงดันเพิ่ม Ah เท่าเดิม · ต่อ <b>ขนาน</b> Ah เพิ่ม แรงดันเท่าเดิม</li></ul>`,
 w(el){
  el.innerHTML=`${b0Sel('b7k','ชนิด',[['pb','ตะกั่วกรด (DoD 50%)'],['li','LiFePO4 (DoD 90%)']],'li')}${b0Sel('b7v','แรงดันลูกละ',[['12','12 V'],['12.8','12.8 V'],['25.6','25.6 V'],['51.2','51.2 V']],'51.2')}${b0Rng('b7a','ความจุลูกละ (Ah)',50,300,10,100,' Ah')}${b0Rng('b7s','ต่ออนุกรม (ลูก)',1,4,1,1)}${b0Rng('b7p','ต่อขนาน (ชุด)',1,4,1,1)}${b0Rng('b7l','โหลดที่ต้องการสำรอง (W)',100,3000,50,600,' W')}<div id="b7o"></div>`;
  const run=()=>{const li=el.querySelector('#b7k').value==='li',v=+el.querySelector('#b7v').value,a=b0V('b7a'),s=b0V('b7s'),p=b0V('b7p'),ld=b0V('b7l');
   const V=v*s,Ah=a*p,E=V*Ah,dod=li?0.9:0.5,use=E*dod*0.92;
   el.querySelector('#b7o').innerHTML=b0Kv([['แรงดันระบบแบต',b0f(V,1)+' V'],['ความจุรวม',Ah+' Ah'],['พลังงานรวม',b0f(E/1000,2)+' kWh'],['ใช้ได้จริง (× DoD × 92%)',b0f(use/1000,2)+' kWh'],['สำรองโหลด '+ld+' W ได้',b0f(use/ld,1)+' ชม.','ok'],['อายุรอบโดยประมาณ',li?'3,000–6,000 รอบ':'300–800 รอบ']])};
  el.querySelector('#b7k').addEventListener('change',run);el.querySelector('#b7v').addEventListener('change',run);b0Bind(el,['b7a','b7s','b7p','b7l'],run,[' Ah','','',' W']);
 },
 q:[{q:'ข้อใดเป็นข้อเด่นของ LiFePO4 เมื่อเทียบกับตะกั่วกรด',o:['ใช้ได้ลึกกว่าและอายุรอบมากกว่า','ไม่ต้องมีระบบป้องกันใด ๆ','ราคาต่อลูกถูกกว่าเสมอ','แรงดันต่อเซลล์ 12 V'],a:0,ex:'LiFePO4 ใช้ DoD 80–90% และอายุหลายพันรอบ แต่ต้องมี BMS'},
  {q:'แบต 51.2 V 100 Ah มีพลังงานเท่าใด',o:['5.12 kWh','51.2 kWh','1.51 kWh','100 kWh'],a:0,ex:'51.2 × 100 = 5,120 Wh = 5.12 kWh'},
  {q:'นำแบต 12 V 100 Ah สองลูกต่ออนุกรม จะได้เท่าใด',o:['12 V 200 Ah','24 V 100 Ah','24 V 200 Ah','12 V 100 Ah'],a:1,ex:'อนุกรม: แรงดันบวกกัน ความจุ (Ah) เท่าเดิม'}]},

{id:'t8',title:'ระบบป้องกัน (Protection)',desc:'ฟิวส์ เบรกเกอร์ DC/AC (MCB) และอุปกรณ์ป้องกันแรงดันเกิน (SPD)',task:'เลือกฟิวส์สตริงและเบรกเกอร์ DC ได้ถูกต้อง',
 intro:`<ul><li><b>ฟิวส์สตริง</b> ป้องกันกระแสย้อนจากสตริงอื่นเมื่อมีสตริงขนานกันตั้งแต่ 3 สตริงขึ้นไป เลือกพิกัดราว <b>1.5–2.4 × Isc</b> และไม่เกิน "Maximum series fuse rating" บนป้ายแผง</li>
 <li><b>เบรกเกอร์ / สวิตช์ DC</b> ต้องเป็นชนิด DC พิกัดแรงดัน <b>≥ Voc รวมของสตริงที่อุณหภูมิต่ำสุด</b> (DC ไม่มีจุดตัดศูนย์ ดับอาร์กยากกว่า AC)</li>
 <li><b>SPD</b> จำกัดแรงดันเกินชั่วขณะจากฟ้าผ่า/การสวิตช์ ลงดิน ติดทั้งฝั่ง DC (ใกล้อินเวอร์เตอร์) และฝั่ง AC (ตู้เมน) · <b>MCB / RCBO</b> ฝั่ง AC ป้องกันกระแสเกินและไฟรั่ว</li></ul>`,
 w(el){
  el.innerHTML=`<p class="hint tight">แผงตัวอย่าง: Isc ${B0P.Isc} A · Voc ${B0P.Voc} V · สัมประสิทธิ์ Voc ${B0P.bV} %/°C · Max series fuse ${B0P.fuse} A · 3 สตริงขนาน</p>
   ${b0Sel('b8f','1) ฟิวส์สตริงที่เลือก',[['','— เลือก —'],'10','15','20','25','32','40'],'')}
   ${b0Rng('b8n','แผงต่อสตริง',6,20,1,12,' แผง')}${b0Sel('b8tm','อุณหภูมิต่ำสุดของพื้นที่',[['10','10 °C'],['15','15 °C'],['0','0 °C']],'10')}
   ${b0Sel('b8v','2) พิกัดแรงดันเบรกเกอร์ DC',[['','— เลือก —'],['500','500 V DC'],['600','600 V DC'],['1000','1000 V DC'],['ac','เบรกเกอร์ AC 230/400 V']],'')}<div id="b8o"></div><p class="b0msg" id="b8m1"></p><p class="b0msg" id="b8m2"></p>`;
  const run=()=>{const fu=el.querySelector('#b8f').value,bv=el.querySelector('#b8v').value,n=b0V('b8n'),tm=+el.querySelector('#b8tm').value;
   const lo=1.5*B0P.Isc,hi=Math.min(2.4*B0P.Isc,B0P.fuse),vc=B0P.Voc*(1+B0P.bV/100*(tm-25))*n;
   el.querySelector('#b8o').innerHTML=b0Kv([['ช่วงฟิวส์ที่ใช้ได้',`${b0f(lo,1)}–${b0f(hi,0)} A`],[`Voc สตริงที่ ${tm} °C = ${B0P.Voc} × (1 + ${B0P.bV}% × (${tm}−25)) × ${n}`,b0f(vc,0)+' V']]);
   let f1=null,t1='เลือกพิกัดฟิวส์';if(fu){const x=+fu;f1=x>=lo&&x<=hi;t1=f1?`ถูกต้อง: ${x} A อยู่ในช่วง และไม่เกินพิกัดฟิวส์ของแผง`:x<lo?`${x} A ต่ำเกินไป ฟิวส์อาจขาดเองขณะแดดแรง (ต้อง ≥ ${b0f(lo,1)} A)`:`${x} A สูงเกินพิกัดฟิวส์ของแผง (${B0P.fuse} A) ป้องกันแผงไม่ได้`}
   let f2=null,t2='เลือกพิกัดเบรกเกอร์ DC';if(bv){if(bv==='ac'){f2=false;t2='เบรกเกอร์ AC ไม่ได้ออกแบบให้ดับอาร์ก DC ห้ามใช้ในวงจร DC'}else{const x=+bv,need=[500,600,1000].find(k=>k>=vc);f2=x>=vc&&x===need;t2=x<vc?`${x} V ต่ำกว่า Voc ที่อุณหภูมิต่ำสุด (${b0f(vc,0)} V) อันตราย`:x===need?`ถูกต้อง: ${x} V ≥ ${b0f(vc,0)} V`:`ใช้ได้ (${x} V ≥ ${b0f(vc,0)} V) แต่มีพิกัดที่ต่ำกว่าซึ่งเพียงพอแล้ว (${need} V)`;if(x>=vc&&x!==need)f2=true}}
   b0Msg(el.querySelector('#b8m1'),f1,'ฟิวส์: '+t1);b0Msg(el.querySelector('#b8m2'),f2,'เบรกเกอร์ DC: '+t2);
   if(f1&&f2)b0Task('t8',true)};
  ['b8f','b8v','b8tm'].forEach(id=>el.querySelector('#'+id).addEventListener('change',run));b0Bind(el,['b8n'],run,[' แผง']);
 },
 q:[{q:'SPD (Surge Protective Device) มีหน้าที่อะไร',o:['ตัดไฟเมื่อกระแสเกินพิกัดต่อเนื่อง','จำกัดแรงดันเกินชั่วขณะจากฟ้าผ่าหรือการสวิตช์ โดยระบายลงดิน','วัดพลังงานที่ผลิตได้','เพิ่มแรงดันให้แผง'],a:1,ex:'การตัดกระแสเกินเป็นหน้าที่ของฟิวส์/เบรกเกอร์ SPD ต้องต่อลงดินจึงทำงานได้'},
  {q:'เลือกพิกัดแรงดันของเบรกเกอร์ DC สำหรับสตริงแผงอย่างไร',o:['เท่ากับ Vmp ของแผงเดียว','≥ Voc รวมของสตริงที่อุณหภูมิต่ำสุด','230 V เสมอ','เท่ากับแรงดันแบต'],a:1,ex:'อากาศเย็น Voc สูงขึ้น ต้องเผื่อค่าสูงสุดที่อาจเกิด'},
  {q:'ใช้เบรกเกอร์ AC แทนเบรกเกอร์ DC ในวงจรแผงได้หรือไม่',o:['ได้ เพราะพิกัดกระแสเท่ากัน','ไม่ควร เพราะ DC ไม่มีจุดตัดศูนย์ อาร์กดับยาก อาจไหม้','ได้ ถ้าต่อกลับขั้ว','ได้เฉพาะกลางวัน'],a:1,ex:'ใช้อุปกรณ์ที่ระบุพิกัด DC (V DC) และขั้วตามที่ผู้ผลิตกำหนด'}]},

{id:'t9',title:'การต่อลงดิน (Grounding)',desc:'ระบบสายดินเพื่อความปลอดภัยต่อผู้ใช้และอุปกรณ์',
 intro:`<ul><li>สายดิน (PE) <b>สีเขียวแถบเหลือง</b> ต่อโครงโลหะทั้งหมด: กรอบแผง ราง อินเวอร์เตอร์ ตู้ไฟ เข้ากับหลักดิน (ประสานศักย์ / Bonding)</li>
 <li>เมื่อไฟรั่วลงโครง กระแสจะไหลผ่านสายดินซึ่งความต้านทานต่ำ ทำให้เบรกเกอร์/RCD ตัดวงจร และแรงดันที่โครงไม่สูงจนเป็นอันตราย</li>
 <li>ค่าความต้านทานหลักดินที่นิยมใช้อ้างอิงคือไม่เกิน 5 Ω (ตรวจตามมาตรฐาน วสท. และการไฟฟ้าในพื้นที่) · SPD ทำงานได้ก็ต่อเมื่อมีสายดินที่ดี</li></ul>`,
 w(el){
  el.innerHTML=`<div class="b0tog"><label class="chk"><input type="checkbox" id="b9pe" checked> ต่อสายดินที่โครงเครื่อง</label><label class="chk"><input type="checkbox" id="b9rcd" checked> มี RCD/RCBO 30 mA</label><label class="chk"><input type="checkbox" id="b9f"> เกิดไฟรั่วลงโครง</label><label class="chk"><input type="checkbox" id="b9h" checked> มีคนจับโครงเครื่อง</label></div>${b0Rng('b9r','ความต้านทานหลักดิน (Ω)',1,100,1,5,' Ω')}<div id="b9o"></div>`;
  const run=()=>{const pe=el.querySelector('#b9pe').checked,rcd=el.querySelector('#b9rcd').checked,fa=el.querySelector('#b9f').checked,hu=el.querySelector('#b9h').checked,rg=b0V('b9r');
   let rows,lvl='ok',t;
   if(!fa){rows=[['สถานะ','ปกติ ไม่มีไฟรั่ว'],['แรงดันที่โครง','0 V']];t='ลองติ๊ก "เกิดไฟรั่วลงโครง"'}
   else{const Rb=1000,Rsrc=1+rg; /* fault loop through PE: source/neutral earth ~1 Ω + electrode */
    if(pe){const If=230/(Rsrc+0.5),Vt=If*0.5;rows=[['กระแสรั่วผ่านสายดิน',b0f(If,1)+' A'],['แรงดันสัมผัสที่โครง',b0f(Math.min(230,Vt),0)+' V'],['ผล',rcd?'RCD ตัดวงจรภายในราว 0.03 วินาที':If>=200?'เบรกเกอร์ตัดเพราะกระแสสูง':'เบรกเกอร์อาจไม่ตัด (กระแสไม่พอ) ควรมี RCD']];lvl=rcd||If>=200?'ok':'warn';t=rcd?'ปลอดภัย: สายดินพากระแสลงดินและเครื่องตัดทำงาน':'มีสายดินแต่ไม่มี RCD: ถ้าหลักดินมีความต้านทานสูง กระแสอาจไม่พอให้เบรกเกอร์ตัด โครงจะมีไฟค้าง'}
    else{const Ib=hu?230/(Rb+Rsrc)*1000:0;rows=[['แรงดันที่โครง','≈ 230 V (ไม่มีทางให้กระแสไหลลงดิน)'],['กระแสผ่านร่างกาย',hu?b0f(Ib,0)+' mA':'—'],['ผล',hu?(rcd?'RCD ตัดหลังมีกระแสผ่านคน (ยังโดนดูดชั่วขณะ)':'อันตรายถึงชีวิต: ไม่มีอะไรตัดวงจร'):'โครงมีไฟค้างรอคนมาจับ']];lvl=hu&&!rcd?'err':'warn';t=hu&&!rcd?'อันตรายมาก: ไม่มีสายดินและไม่มี RCD':'ไม่มีสายดิน: แม้มี RCD ก็ต้องให้กระแสผ่านคนก่อนจึงตัด'}}
   el.querySelector('#b9o').innerHTML=b0Kv(rows)+`<p class="b0msg ${lvl==='ok'?'ok':lvl==='err'?'err':''}">${t}</p>`};
  ['b9pe','b9rcd','b9f','b9h'].forEach(id=>el.querySelector('#'+id).addEventListener('change',run));b0Bind(el,['b9r'],run,[' Ω']);
 },
 q:[{q:'หน้าที่หลักของสายดินคืออะไร',o:['เพิ่มกำลังผลิตของแผง','ให้กระแสรั่วไหลลงดินเพื่อให้เครื่องตัดทำงานและลดแรงดันสัมผัส','ใช้แทนสายนิวทรัล','ลดค่าไฟ'],a:1,ex:'สายดินไม่ใช่สายนำกระแสปกติ ห้ามใช้แทนสาย N'},
  {q:'สายดิน (PE) ตามมาตรฐานใช้สีใด',o:['แดง','ดำ','เขียวแถบเหลือง','ฟ้า'],a:2,ex:'สีฟ้า = นิวทรัล (N) · น้ำตาล/ดำ/เทา = สายเฟส'},
  {q:'กรอบอะลูมิเนียมของแผงโซลาร์ควรทำอย่างไร',o:['ปล่อยลอยไว้','ต่อประสานศักย์ (Bond) กับสายดินของระบบ','ต่อเข้ากับขั้ว + ของแผง','ทาสีเพื่อกันไฟ'],a:1,ex:'ใช้หางปลา/แหวนกราวด์ที่ผู้ผลิตกำหนด ต่อทุกแผงและรางเข้าระบบดินเดียวกัน'}]},

{id:'t10',title:'การอ่าน Nameplate และ Datasheet',desc:'อ่านและตีความสเปกไฟฟ้าของแผงและอุปกรณ์',task:'คำนวณ Voc ที่ 10 °C และ Pmax ที่ 65 °C',
 intro:`<ul><li><b>STC</b> (Standard Test Conditions) = แสง 1000 W/m², อุณหภูมิเซลล์ 25 °C, AM 1.5 ค่าบนป้ายวัดที่สภาวะนี้</li>
 <li><b>NOCT / NMOT</b> = ค่าที่สภาวะใกล้การใช้งานจริง (800 W/m², อากาศ 20 °C, ลม 1 m/s)</li><li>สัมประสิทธิ์อุณหภูมิ: ค่า (อุณหภูมิ − 25) × % ใช้คำนวณ Voc ตอนเย็น (ออกแบบจำนวนแผงต่อสตริง) และกำลังตอนร้อน</li></ul>`,
 w(el){
  const P=B0P;
  el.innerHTML=`<div class="b0np"><div class="b0nph">แผงตัวอย่าง SP-550M (ค่าสมมติ)</div><table>
   <tr><td>Maximum Power (Pmax)</td><td>${P.P} W</td></tr><tr><td>Open Circuit Voltage (Voc)</td><td>${P.Voc} V</td></tr><tr><td>Short Circuit Current (Isc)</td><td>${P.Isc} A</td></tr>
   <tr><td>Voltage at Pmax (Vmp)</td><td>${P.Vmp} V</td></tr><tr><td>Current at Pmax (Imp)</td><td>${P.Imp} A</td></tr><tr><td>Temp. Coefficient of Voc</td><td>${P.bV} %/°C</td></tr>
   <tr><td>Temp. Coefficient of Pmax</td><td>${P.gP} %/°C</td></tr><tr><td>Temp. Coefficient of Isc</td><td>+${P.aI} %/°C</td></tr><tr><td>Maximum System Voltage</td><td>${P.vsys} V DC</td></tr>
   <tr><td>Maximum Series Fuse Rating</td><td>${P.fuse} A</td></tr><tr><td>NOCT</td><td>${P.noct} ± 2 °C</td></tr><tr><td>Cells</td><td>${P.cells} (ครึ่งเซลล์)</td></tr><tr><td colspan="2" class="b0nps">STC: 1000 W/m², 25 °C, AM 1.5</td></tr></table></div>
   <label class="b0s"><span>1) Voc ที่อุณหภูมิเซลล์ 10 °C (V)</span><input id="b10a" inputmode="decimal" placeholder="เช่น 50.0"></label><p class="b0msg" id="b10am"></p>
   <label class="b0s"><span>2) Pmax ที่อุณหภูมิเซลล์ 65 °C แสง 1000 W/m² (W)</span><input id="b10b" inputmode="decimal" placeholder="เช่น 500"></label><p class="b0msg" id="b10bm"></p>
   <button class="btn" id="b10go">ตรวจคำตอบ</button>`;
  const ra=P.Voc*(1+P.bV/100*(10-25)),rb=P.P*(1+P.gP/100*(65-25));
  el.querySelector('#b10go').addEventListener('click',()=>{const a=parseFloat(el.querySelector('#b10a').value.replace(',','.')),b=parseFloat(el.querySelector('#b10b').value.replace(',','.'));
   const ok1=Math.abs(a-ra)<=0.3,ok2=Math.abs(b-rb)<=3;
   b0Msg(el.querySelector('#b10am'),isFinite(a)?ok1:null,isFinite(a)?(ok1?`ถูกต้อง: ${P.Voc} × (1 + ${P.bV}% × (10 − 25)) = ${b0f(ra,2)} V`:'ยังไม่ถูก: ใช้สัมประสิทธิ์ Voc คูณผลต่างอุณหภูมิจาก 25 °C (อากาศเย็น Voc สูงขึ้น)'):'กรอกตัวเลข');
   b0Msg(el.querySelector('#b10bm'),isFinite(b)?ok2:null,isFinite(b)?(ok2?`ถูกต้อง: ${P.P} × (1 + ${P.gP}% × (65 − 25)) = ${b0f(rb,0)} W`:'ยังไม่ถูก: ใช้สัมประสิทธิ์ Pmax (เซลล์ร้อนกว่า 25 °C กำลังลดลง)'):'กรอกตัวเลข');
   if(ok1&&ok2)b0Task('t10',true)});
 },
 q:[{q:'ค่าใดบนป้ายแผงใช้คำนวณจำนวนแผงต่ออนุกรมสูงสุดไม่ให้เกินแรงดันอินเวอร์เตอร์',o:['Imp','Voc พร้อมสัมประสิทธิ์อุณหภูมิของ Voc','Pmax','น้ำหนักแผง'],a:1,ex:'ใช้ Voc ที่อุณหภูมิต่ำสุดของพื้นที่ × จำนวนแผง ต้องไม่เกินแรงดัน DC สูงสุดของอินเวอร์เตอร์'},
  {q:'STC ย่อมาจากอะไรและหมายถึงสภาวะใด',o:['1000 W/m², เซลล์ 25 °C, AM 1.5','800 W/m², อากาศ 20 °C','500 W/m², 45 °C','กลางแดดจริงตอนเที่ยง'],a:0,ex:'Standard Test Conditions ใช้เปรียบเทียบแผงต่างยี่ห้อบนเงื่อนไขเดียวกัน'},
  {q:'"Maximum Series Fuse Rating 25 A" หมายถึงอะไร',o:['แผงผลิตกระแสได้ 25 A','พิกัดฟิวส์สูงสุดที่ใช้ป้องกันแผงในสตริงได้','กระแสใช้งานของอินเวอร์เตอร์','ค่าลัดวงจรของแบต'],a:1,ex:'ฟิวส์สตริงต้องไม่เกินค่านี้ (และไม่ต่ำกว่าราว 1.5 × Isc)'}]},

{id:'t11',title:'อ่านสัญลักษณ์และแผนภาพระบบ',desc:'Schematic Diagram และ Single Line Diagram',task:'จับคู่สัญลักษณ์ถูกครบทุกตัว',
 intro:`<ul><li><b>Schematic</b> แสดงสายทุกเส้นและขั้วต่อ ใช้ต่อสายจริง · <b>Single Line Diagram (SLD)</b> ใช้เส้นเดียวแทนสายหลายเส้น เห็นภาพรวมเส้นทางไฟและอุปกรณ์ป้องกันตามลำดับ</li>
 <li>อ่าน SLD จากแหล่งกำเนิด → อุปกรณ์ป้องกัน → อินเวอร์เตอร์ → ตู้ไฟ/มิเตอร์ → กริด แต่ละอุปกรณ์มีพิกัดกำกับ (A, V, mm²)</li></ul>`,
 w(el){
  const S=[
   ['pv','แผงโซลาร์',`<rect x="10" y="12" width="60" height="40" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 52 L70 12" stroke="currentColor" stroke-width="2"/><path d="M22 4 l8 8 M34 2 l8 8" stroke="currentColor" stroke-width="1.6"/>`],
   ['bat','แบตเตอรี่',`<line x1="40" y1="2" x2="40" y2="20" stroke="currentColor" stroke-width="2"/><line x1="20" y1="20" x2="60" y2="20" stroke="currentColor" stroke-width="3"/><line x1="30" y1="28" x2="50" y2="28" stroke="currentColor" stroke-width="3"/><line x1="20" y1="36" x2="60" y2="36" stroke="currentColor" stroke-width="3"/><line x1="30" y1="44" x2="50" y2="44" stroke="currentColor" stroke-width="3"/><line x1="40" y1="44" x2="40" y2="62" stroke="currentColor" stroke-width="2"/>`],
   ['fuse','ฟิวส์',`<line x1="2" y1="32" x2="78" y2="32" stroke="currentColor" stroke-width="2"/><rect x="22" y="24" width="36" height="16" fill="none" stroke="currentColor" stroke-width="2"/>`],
   ['cb','เบรกเกอร์ (Circuit breaker)',`<line x1="2" y1="40" x2="24" y2="40" stroke="currentColor" stroke-width="2"/><line x1="24" y1="40" x2="54" y2="24" stroke="currentColor" stroke-width="2"/><line x1="56" y1="40" x2="78" y2="40" stroke="currentColor" stroke-width="2"/><path d="M50 18 l8 8 M58 18 l-8 8" stroke="currentColor" stroke-width="2"/>`],
   ['gnd','กราวด์ / สายดิน',`<line x1="40" y1="2" x2="40" y2="30" stroke="currentColor" stroke-width="2"/><line x1="18" y1="30" x2="62" y2="30" stroke="currentColor" stroke-width="3"/><line x1="26" y1="40" x2="54" y2="40" stroke="currentColor" stroke-width="3"/><line x1="34" y1="50" x2="46" y2="50" stroke="currentColor" stroke-width="3"/>`],
   ['inv','อินเวอร์เตอร์ (DC → AC)',`<rect x="12" y="6" width="56" height="52" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 58 L68 6" stroke="currentColor" stroke-width="1.6"/><text x="20" y="26" font-size="13" fill="currentColor">=</text><text x="48" y="52" font-size="15" fill="currentColor">~</text>`],
   ['spd','SPD',`<rect x="26" y="10" width="28" height="34" fill="none" stroke="currentColor" stroke-width="2"/><path d="M44 14 L34 28 H46 L36 42" fill="none" stroke="currentColor" stroke-width="2"/><line x1="40" y1="44" x2="40" y2="54" stroke="currentColor" stroke-width="2"/><line x1="28" y1="54" x2="52" y2="54" stroke="currentColor" stroke-width="2.5"/><line x1="40" y1="2" x2="40" y2="10" stroke="currentColor" stroke-width="2"/>`],
   ['kwh','มิเตอร์วัดพลังงาน (kWh)',`<circle cx="40" cy="32" r="24" fill="none" stroke="currentColor" stroke-width="2"/><text x="40" y="37" font-size="13" text-anchor="middle" fill="currentColor">kWh</text>`]];
  const ord=[3,6,0,5,2,7,1,4],opts=[['','— เลือก —']].concat(S.map(s=>[s[0],s[1]]));
  el.innerHTML=`<div class="b0sym">${ord.map((k,i)=>`<div class="b0symc"><svg viewBox="0 0 80 64" aria-label="สัญลักษณ์ ${i+1}">${S[k][2]}</svg><span>${i+1}</span>${b0Sel('b11_'+i,'',opts,'')}</div>`).join('')}</div><p class="b0msg" id="b11m"></p>`;
  const run=()=>{let ok=0,any=0;ord.forEach((k,i)=>{const s=el.querySelector('#b11_'+i),c=s.closest('.b0symc');if(s.value){any++;const r=s.value===S[k][0];if(r)ok++;c.classList.toggle('ok',r);c.classList.toggle('err',!r)}else c.classList.remove('ok','err')});
   b0Msg(el.querySelector('#b11m'),ok===S.length?true:any&&ok<any?false:null,`ถูก ${ok} / ${S.length}`+(ok===S.length?' · ครบแล้ว':''));if(ok===S.length)b0Task('t11',true)};
  ord.forEach((_,i)=>el.querySelector('#b11_'+i).addEventListener('change',run));run();
 },
 q:[{q:'Single Line Diagram ต่างจาก Schematic อย่างไร',o:['SLD ใช้เส้นเดียวแทนสายหลายเส้น แสดงภาพรวมเส้นทางไฟและอุปกรณ์','SLD แสดงทุกขั้วต่อละเอียดกว่า','SLD ใช้กับไฟ DC เท่านั้น','ไม่ต่างกัน'],a:0,ex:'SLD เหมาะดูภาพรวมระบบและพิกัดอุปกรณ์ ส่วน Schematic ใช้ต่อสายจริง'},
  {q:'ใน SLD ของระบบ On-grid ลำดับจากแผงไปกริดที่ถูกต้องคือ',o:['แผง → อินเวอร์เตอร์ → เบรกเกอร์ DC → กริด','แผง → ฟิวส์/สวิตช์ DC + SPD → อินเวอร์เตอร์ → เบรกเกอร์ AC + SPD → ตู้/มิเตอร์ → กริด','กริด → แผง → แบต','แผง → มิเตอร์ → แบต → กริด'],a:1,ex:'ป้องกันฝั่ง DC ก่อนเข้าอินเวอร์เตอร์ และฝั่ง AC ก่อนเข้าตู้ไฟ'}]},

{id:'t12',title:'การใช้มัลติมิเตอร์ แคลมป์มิเตอร์ เครื่องวัดรังสีอาทิตย์ และเครื่องวัดอุณหภูมิอินฟราเรด',desc:'ใช้เครื่องมือวัดทางไฟฟ้าและสิ่งแวดล้อมอย่างถูกต้อง',task:'เลือกเครื่องมือถูกทุกสถานการณ์',
 intro:`<ul><li><b>มัลติมิเตอร์</b> วัด V DC / V AC / Ω / ความต่อเนื่อง ตรวจขั้วและย่านก่อนจิ้มทุกครั้ง พิกัด CAT (เช่น CAT III 1000 V) ต้องเหมาะกับงาน</li>
 <li><b>แคลมป์มิเตอร์</b> วัดกระแสโดยไม่ตัดสาย คล้องสาย <b>เส้นเดียว</b> วัด DC ได้เฉพาะรุ่น Hall effect (AC/DC)</li>
 <li><b>เครื่องวัดรังสีอาทิตย์ (Solar power meter / Pyranometer)</b> วางระนาบเดียวกับแผง · <b>เทอร์โมมิเตอร์อินฟราเรด</b> หา hotspot และจุดต่อร้อน ระวังค่า emissivity และแสงสะท้อนกระจก (วัดหลังแผงแม่นกว่า)</li></ul>`,
 w(el){
  const T=[['วัดแรงดันวงจรเปิดของสตริง','mm'],['วัดกระแส DC ในสายสตริงขณะอินเวอร์เตอร์ทำงาน','clamp'],['ตรวจความเข้มแสงที่ตกบนแผงขณะทดสอบ','irr'],['หาจุดร้อนผิดปกติบนแผงหรือขั้วต่อ','ir'],['ตรวจความต่อเนื่องของสายดิน (ตัดไฟแล้ว)','mm'],['วัดกระแสโหลดแอร์ในตู้ไฟ (สายเฟสเส้นเดียว)','clamp']];
  const op=[['','— เลือก —'],['mm','มัลติมิเตอร์ดิจิทัล'],['clamp','แคลมป์มิเตอร์ (AC/DC)'],['irr','เครื่องวัดความเข้มรังสีอาทิตย์'],['ir','เครื่องวัดอุณหภูมิอินฟราเรด']];
  el.innerHTML=T.map((t,i)=>b0Sel('b12_'+i,`${i+1}) ${t[0]}`,op,'')).join('')+'<p class="b0msg" id="b12m"></p>';
  const run=()=>{let ok=0,bad=0;T.forEach((t,i)=>{const s=el.querySelector('#b12_'+i);if(!s.value){s.classList.remove('ok','err');return}const r=s.value===t[1];r?ok++:bad++;s.classList.toggle('ok',r);s.classList.toggle('err',!r)});
   b0Msg(el.querySelector('#b12m'),ok===T.length?true:bad?false:null,`ถูก ${ok} / ${T.length}`+(bad?` · ผิด ${bad} ข้อ (กรอบสีแดง)`:''));if(ok===T.length)b0Task('t12',true)};
  T.forEach((_,i)=>el.querySelector('#b12_'+i).addEventListener('change',run));run();
 },
 q:[{q:'แคลมป์มิเตอร์ที่วัดกระแส DC ของแผงได้ต้องเป็นแบบใด',o:['แบบหม้อแปลงกระแส (CT) ทั่วไป','แบบ Hall effect (AC/DC)','ทุกแบบวัดได้','ต้องคล้องสาย + และ − พร้อมกัน'],a:1,ex:'แคลมป์ CT ทั่วไปวัดได้เฉพาะ AC และต้องคล้องสายเส้นเดียว ถ้าคล้องคู่ + / − กระแสหักล้างกันเหลือ 0'},
  {q:'วางเครื่องวัดความเข้มรังสีอาทิตย์อย่างไรเมื่อทดสอบแผง',o:['วางราบกับพื้นเสมอ','วางระนาบเดียวกับแผง (มุมเอียงและทิศเดียวกัน)','หันเข้าหาดวงอาทิตย์ตรง ๆ เสมอ','วางในร่ม'],a:1,ex:'ต้องวัดแสงที่ตกบนแผงจริง จึงเทียบกับกำลังที่วัดได้'},
  {q:'ใช้เทอร์โมมิเตอร์อินฟราเรดวัดด้านหน้าแผงแล้วค่าเพี้ยน สาเหตุหลักคือ',o:['กระจกสะท้อนแสงและค่า emissivity ไม่ตรง','แผงผลิตไฟ DC','อากาศเย็นเกินไป','แบตของเครื่องเต็ม'],a:0,ex:'วัดที่แผ่นหลัง (backsheet) หรือตั้งค่า emissivity ให้ตรงวัสดุ'}]},

{id:'t13',title:'รู้จักกับ I-V Curve',desc:'กราฟความสัมพันธ์ระหว่างกระแสและแรงดันของแผง',
 intro:`<ul><li>เส้นโค้งตัดแกนกระแสที่ <b>Isc</b> (V = 0) และตัดแกนแรงดันที่ <b>Voc</b> (I = 0) จุด "เข่า" ของเส้นคือ <b>MPP</b> (Vmp, Imp)</li>
 <li>แสงมากขึ้น → เส้นยกสูง (กระแสเพิ่ม) · อุณหภูมิสูงขึ้น → เส้นเลื่อนซ้าย (แรงดันลด)</li><li><b>Fill Factor</b> = Pmax ÷ (Voc × Isc) บอกว่าเส้นโค้ง "เต็มเหลี่ยม" แค่ไหน แผงดีอยู่ราว 0.75–0.82</li></ul>`,
 w(el){
  el.innerHTML=`${b0Rng('b13g','ความเข้มแสง (W/m²)',100,1200,50,1000)}${b0Rng('b13t','อุณหภูมิเซลล์ (°C)',0,80,1,25,' °C')}<label class="chk"><input type="checkbox" id="b13ref" checked> แสดงเส้นอ้างอิง STC</label><div id="b13c"></div><div id="b13o"></div>`;
  const run=()=>{const c=b0Curve(b0V('b13g'),b0V('b13t')),s=b0Curve(1000,25),ref=el.querySelector('#b13ref').checked;
   const ser=[{pts:c.pts.map(p=>[p[0],p[1]]),col:'var(--s1)'},{pts:c.pts.map(p=>[p[0],p[2]]),col:'var(--s2)',y2:true}];
   if(ref)ser.unshift({pts:s.pts.map(p=>[p[0],p[1]]),col:'var(--muted)',dash:true});
   el.querySelector('#b13c').innerHTML=b0Chart({xmax:56,ymax:17,y2:true,y2max:700,xl:'แรงดัน (V)',yl:'กระแส (A)',y2l:'กำลัง (W)',aria:'I-V curve ของแผงตัวอย่าง',series:ser,
    dots:[{x:0,y:c.isc,col:'var(--s1)',lab:'Isc'},{x:c.voc,y:0,col:'var(--s1)',lab:'Voc'},{x:c.mp.V,y:c.mp.I,col:'var(--accent)',lab:'MPP'}],legend:[['I-V','var(--s1)'],['P-V','var(--s2)'],...(ref?[['STC','var(--muted)',1]]:[])]});
   el.querySelector('#b13o').innerHTML=b0Kv([['Isc',b0f(c.isc,2)+' A'],['Voc',b0f(c.voc,1)+' V'],['Vmp / Imp',b0f(c.mp.V,1)+' V / '+b0f(c.mp.I,2)+' A'],['Pmax',b0f(c.mp.P,0)+' W'],['Fill Factor',c.voc&&c.isc?b0f(c.mp.P/(c.voc*c.isc),2):'—']])};
  el.querySelector('#b13ref').addEventListener('change',run);b0Bind(el,['b13g','b13t'],run,['',' °C']);
 },
 q:[{q:'จุดที่เส้น I-V ตัดแกนแรงดัน (กระแส = 0) คือค่าใด',o:['Isc','Voc','Vmp','Pmax'],a:1,ex:'กระแสเป็นศูนย์ = วงจรเปิด จึงเป็น Voc'},
  {q:'เมื่ออุณหภูมิเซลล์สูงขึ้น เส้น I-V เปลี่ยนอย่างไร',o:['เลื่อนไปทางซ้าย แรงดันลดลง กำลังลดลง','ยกสูงขึ้นมาก กำลังเพิ่ม','ไม่เปลี่ยน','กลายเป็นเส้นตรง'],a:0,ex:'กระแสเพิ่มขึ้นเล็กน้อย แต่แรงดันลดมากกว่า กำลังโดยรวมจึงลด'},
  {q:'แผงตัวอย่าง Pmax 550 W, Voc 49.9 V, Isc 14 A มี Fill Factor ประมาณเท่าใด',o:['0.39','0.79','1.27','0.95'],a:1,ex:'550 ÷ (49.9 × 14) ≈ 0.79'}]},

{id:'t14',title:'การวัดแรงดัน-กระแส ขณะต่ออนุกรม/ขนาน',desc:'ผลทางไฟฟ้าเมื่อนำแผงมาต่อรวมกัน',task:'คาดค่า V และ I ได้ถูก ก่อนดูค่าจากมิเตอร์',
 intro:`<ul><li><b>อนุกรม</b> (+ ของแผงหนึ่งต่อ − ของอีกแผง): แรงดันบวกกัน กระแสเท่าแผงเดียว</li><li><b>ขนาน</b> (+ ต่อ +, − ต่อ −): กระแสบวกกัน แรงดันเท่าแผงเดียว</li>
 <li>ในสตริงอนุกรม แผงที่ถูกเงาบังจำกัดกระแสของทั้งสตริง ไดโอดบายพาสช่วยให้กระแสข้ามกลุ่มเซลล์ที่ถูกบัง (แลกกับแรงดันที่หายไป) · ต่อขนานควรใช้แผงรุ่นเดียวกันและจำนวนแผงต่อสตริงเท่ากัน</li></ul>`,
 w(el){
  el.innerHTML=`${b0Sel('b14m','รูปแบบ',[['s','อนุกรม'],['p','ขนาน']],'s')}${b0Rng('b14n','จำนวนแผง',2,4,1,3,' แผง')}<p class="hint tight">วัดขณะทำงานที่จุดกำลังสูงสุด (STC) · แผงตัวอย่าง Vmp ${B0P.Vmp} V, Imp ${B0P.Imp} A</p><div id="b14f"></div>
   <div class="b0pred"><label class="b0s"><span>คาดว่าโวลต์มิเตอร์อ่านได้ (V)</span><input id="b14v" inputmode="decimal"></label><label class="b0s"><span>คาดว่าแคลมป์อ่านได้ (A)</span><input id="b14i" inputmode="decimal"></label><button class="btn" id="b14go">ตรวจ แล้วดูค่ามิเตอร์</button></div><p class="b0msg" id="b14msg"></p><div id="b14o"></div>`;
  const draw=()=>{const m=el.querySelector('#b14m').value,n=b0V('b14n'),W=520,H=150;let s=`<svg viewBox="0 0 ${W} ${H}" class="b0ill" role="img" aria-label="ผังต่อแผง">`;
   const pw=70,gap=(W-140-n*pw)/(n+1);
   for(let k=0;k<n;k++){const x=20+gap*(k+1)+pw*k;s+=`<rect x="${x}" y="40" width="${pw}" height="60" rx="4" fill="var(--cell)"/><text x="${x+pw/2}" y="76" text-anchor="middle" class="b0lab" fill="#fff">แผง ${k+1}</text><text x="${x+6}" y="36" class="b0ax" fill="var(--pos)">+</text><text x="${x+pw-12}" y="36" class="b0ax">−</text>`;
    if(m==='s'&&k<n-1)s+=`<path d="M${x+pw-6} 40 V24 H${x+pw+gap+6} V40" fill="none" stroke="var(--pos)" stroke-width="2.5"/>`}
   const x0=20+gap,xl=20+gap*n+pw*(n-1);
   if(m==='s'){s+=`<path d="M${x0+6} 40 V12 H${W-60}" fill="none" stroke="var(--pos)" stroke-width="2.5"/><path d="M${xl+pw-6} 100 V130 H${W-60}" fill="none" stroke="var(--neg)" stroke-width="2.5"/>`}
   else{s+=`<path d="M${x0+6} 40 V12 H${W-60}" fill="none" stroke="var(--pos)" stroke-width="2.5"/>`;for(let k=1;k<n;k++){const x=20+gap*(k+1)+pw*k;s+=`<path d="M${x+6} 40 V12" fill="none" stroke="var(--pos)" stroke-width="2.5"/>`}
    for(let k=0;k<n;k++){const x=20+gap*(k+1)+pw*k;s+=`<path d="M${x+pw-6} 100 V130" fill="none" stroke="var(--neg)" stroke-width="2.5"/>`}s+=`<path d="M${x0+pw-6} 130 H${W-60}" fill="none" stroke="var(--neg)" stroke-width="2.5"/>`}
   s+=`<circle cx="${W-40}" cy="70" r="20" fill="var(--surface)" stroke="var(--ink)" stroke-width="2"/><text x="${W-40}" y="75" text-anchor="middle" class="b0lab">V</text><path d="M${W-60} 12 H${W-40} V50 M${W-60} 130 H${W-40} V90" fill="none" stroke="var(--ink)" stroke-width="1.5"/><ellipse cx="${W-80}" cy="12" rx="9" ry="12" fill="none" stroke="var(--accent)" stroke-width="3"/><text x="${W-80}" y="34" text-anchor="middle" class="b0ax">A</text></svg>`;
   el.querySelector('#b14f').innerHTML=s;el.querySelector('#b14o').innerHTML='';el.querySelector('#b14msg').textContent='';el.querySelector('#b14msg').className='b0msg'};
  el.querySelector('#b14m').addEventListener('change',draw);b0Bind(el,['b14n'],draw,[' แผง']);
  el.querySelector('#b14go').addEventListener('click',()=>{const m=el.querySelector('#b14m').value,n=b0V('b14n'),V=m==='s'?B0P.Vmp*n:B0P.Vmp,I=m==='p'?B0P.Imp*n:B0P.Imp;
   const pv=parseFloat(el.querySelector('#b14v').value.replace(',','.')),pi=parseFloat(el.querySelector('#b14i').value.replace(',','.'));
   if(!isFinite(pv)||!isFinite(pi)){b0Msg(el.querySelector('#b14msg'),null,'กรอกค่าที่คาดทั้งแรงดันและกระแสก่อน');return}
   const okV=Math.abs(pv-V)<=V*0.03,okI=Math.abs(pi-I)<=I*0.03;
   el.querySelector('#b14o').innerHTML=b0Kv([['โวลต์มิเตอร์',b0f(V,1)+' V',okV?'ok':'err'],['แคลมป์มิเตอร์',b0f(I,2)+' A',okI?'ok':'err'],['กำลังรวม',b0f(V*I,0)+' W']]);
   b0Msg(el.querySelector('#b14msg'),okV&&okI,okV&&okI?'คาดถูกทั้งสองค่า':`ยังไม่ถูก${okV?'':' (แรงดัน)'}${okI?'':' (กระแส)'}: ${m==='s'?'อนุกรม แรงดันบวกกัน กระแสเท่าเดิม':'ขนาน กระแสบวกกัน แรงดันเท่าเดิม'}`);
   if(okV&&okI)b0Task('t14',true)});
 },
 q:[{q:'ต่อแผง Vmp 40 V, Imp 13 A อนุกรม 3 แผง จะได้เท่าใด',o:['40 V, 39 A','120 V, 13 A','120 V, 39 A','13 V, 120 A'],a:1,ex:'อนุกรม: แรงดันบวกกัน 3 × 40 = 120 V กระแสเท่าแผงเดียว'},
  {q:'ต่อแผงเดียวกันขนาน 3 แผง จะได้เท่าใด',o:['40 V, 39 A','120 V, 13 A','40 V, 13 A','120 V, 39 A'],a:0,ex:'ขนาน: กระแสบวกกัน 3 × 13 = 39 A แรงดันเท่าเดิม'},
  {q:'ในสตริงอนุกรม แผงหนึ่งถูกเงาบังมาก ผลคืออะไร',o:['ไม่มีผลต่อแผงอื่น','กระแสทั้งสตริงถูกจำกัด ไดโอดบายพาสช่วยข้ามกลุ่มเซลล์ที่ถูกบัง','แรงดันเพิ่มขึ้นเป็นสองเท่า','อินเวอร์เตอร์เปลี่ยนเป็น Off-grid'],a:1,ex:'กระแสในวงจรอนุกรมต้องเท่ากันทุกจุด แผงที่อ่อนที่สุดจึงจำกัดทั้งสตริง'}]},

{id:'t15',title:'ผลของความเข้มแสง อุณหภูมิ และมุมเอียง ต่อไฟฟ้าที่ผลิตได้',desc:'ปัจจัยสิ่งแวดล้อมที่มีผลต่อประสิทธิภาพ',
 intro:`<ul><li><b>แสงที่ตกบนแผง</b> ≈ แสงตรง × cos(มุมตกกระทบ) แสงตั้งฉากกับแผงได้มากที่สุด</li><li><b>อุณหภูมิเซลล์</b> ≈ อุณหภูมิอากาศ + (NOCT − 20) ÷ 800 × แสง กำลังลดตามสัมประสิทธิ์ Pmax (ราว −0.3 ถึง −0.4 %/°C)</li>
 <li>ประเทศไทย (ละติจูดราว 6–20°) หันแผงทิศใต้ เอียงราว 10–15° ได้พลังงานทั้งปีดี และฝนช่วยล้างฝุ่น</li></ul>`,
 w(el){
  el.innerHTML=`${b0Rng('b15g','แสงตรงตั้งฉากกับดวงอาทิตย์ (W/m²)',200,1100,50,950)}${b0Rng('b15e','มุมสูงดวงอาทิตย์ (องศาจากขอบฟ้า)',10,90,1,70,'°')}${b0Rng('b15tl','มุมเอียงแผง (หันเข้าหาดวงอาทิตย์)',0,60,1,15,'°')}${b0Rng('b15ta','อุณหภูมิอากาศ (°C)',15,42,1,33,' °C')}${b0Rng('b15d','ฝุ่นบังแสง (%)',0,30,1,0,' %')}<div id="b15o"></div>`;
  const run=()=>{const Gn=b0V('b15g'),el2=b0V('b15e'),tl=b0V('b15tl'),ta=b0V('b15ta'),du=b0V('b15d');
   const inc=Math.abs(90-el2-tl),cosi=Math.max(0,Math.cos(inc*Math.PI/180)),G=Gn*cosi*(1-du/100),tc=ta+(B0P.noct-20)/800*G;
   const c=b0Curve(G,tc),fx=B0P.P*G/1000*(1+B0P.gP/100*(tc-25));
   el.querySelector('#b15o').innerHTML=b0Kv([['มุมตกกระทบ',b0f(inc,0)+'° (cos = '+b0f(cosi,2)+')'],['แสงที่ตกบนแผง',b0f(G,0)+' W/m²'],['อุณหภูมิเซลล์โดยประมาณ',b0f(tc,1)+' °C'],['กำลัง (จากเส้น I-V)',b0f(c.mp.P,0)+' W','ok'],['กำลัง (สูตร P × G/1000 × (1 + γ(Tc − 25)))',b0f(fx,0)+' W'],['เทียบกับป้าย 550 W',b0f(c.mp.P/550*100,0)+' %']])+`<p class="hint tight">ลองหาว่ามุมเอียงเท่าใดทำให้มุมตกกระทบเป็น 0° (แสงตั้งฉาก) และอากาศร้อนขึ้น 10 °C กำลังหายไปกี่วัตต์</p>`};
  b0Bind(el,['b15g','b15e','b15tl','b15ta','b15d'],run,['','°','°',' °C',' %']);
 },
 q:[{q:'แผง γ = −0.35 %/°C ทำงานที่อุณหภูมิเซลล์ 65 °C กำลังลดลงจากค่า STC ราวเท่าใด',o:['ราว 3.5%','ราว 14%','ราว 35%','ไม่ลดลง'],a:1,ex:'(65 − 25) × 0.35% = 14%'},
  {q:'แผงผลิตไฟได้มากที่สุดเมื่อแสงตกกระทบแผงในลักษณะใด',o:['ขนานกับผิวแผง','ตั้งฉากกับผิวแผง (มุมตกกระทบ 0°)','เอียง 45° กับผิวแผงเสมอ','ไม่ขึ้นกับมุม'],a:1,ex:'แสงที่ตกบนแผงแปรตาม cos(มุมตกกระทบ)'},
  {q:'บ้านในประเทศไทย หลังคาทิศใต้ มุมเอียงแผงที่นิยมเพื่อพลังงานทั้งปีคือ',o:['ราว 10–15°','ราว 45°','ราว 70°','วางราบ 0° ดีที่สุดเสมอ'],a:0,ex:'ใกล้ค่าละติจูดและยังพอให้ฝนชะล้างฝุ่นได้'}]}
];

/* ---- state ---- */
function b0Done(t){const a=B0.ans[t.id]||{};return t.q.every((q,i)=>a[i]===q.a)&&(!t.task||!!B0.task[t.id])}
function b0Count(){return B0T.filter(b0Done).length}
function b0Missing(){return B0T.map((t,i)=>b0Done(t)?null:String(i+1).padStart(2,'0')).filter(Boolean)}
function b0Save(){b0Status();if(typeof touch==='function')touch()}
function b0Restore(o){if(!o||typeof o!=='object')return;B0.ans={};B0.task={};
  B0T.forEach(t=>{const a=o.ans&&o.ans[t.id];if(a&&typeof a==='object'){B0.ans[t.id]={};Object.keys(a).forEach(k=>{const v=a[k];if(Number.isInteger(v)&&t.q[+k]&&v>=0&&v<t.q[+k].o.length)B0.ans[t.id][k]=v})}
   if(o.task&&o.task[t.id]===true)B0.task[t.id]=true});
  if(document.getElementById('b0list'))b0RenderAll()}

/* ---- UI ---- */
function b0QuizHtml(t){const a=B0.ans[t.id]||{};
  return t.q.map((q,i)=>{const sel=a[i],ans=sel!=null;return`<fieldset class="b0q" data-q="${i}"><legend>${i+1}. ${esc(q.q)}</legend>${q.o.map((o,k)=>`<label class="b0o ${ans&&k===sel?(k===q.a?'ok':'err'):''}"><input type="radio" name="b0_${t.id}_${i}" value="${k}" ${k===sel?'checked':''}> ${esc(o)}</label>`).join('')}
   <p class="b0ex ${ans?(sel===q.a?'ok':'err'):''}" ${ans?'':'hidden'}>${ans?(sel===q.a?'ถูกต้อง · ':'ยังไม่ถูก ลองใหม่ · ')+esc(q.ex):''}</p></fieldset>`}).join('')}
function b0Badge(t){const a=B0.ans[t.id]||{},n=t.q.filter((q,i)=>a[i]===q.a).length,done=b0Done(t);
  return`<span class="b0bd ${done?'ok':n||B0.task[t.id]?'part':''}">${done?'✓ ผ่าน':`${n}/${t.q.length} ข้อ${t.task?(B0.task[t.id]?' · ภารกิจ ✓':' · ภารกิจ ○'):''}`}</span>`}
function b0Status(){
  B0T.forEach(t=>{const d=document.querySelector(`.b0t[data-id="${t.id}"] .b0bdw`);if(d)d.innerHTML=b0Badge(t)});
  const n=b0Count(),p=document.getElementById('b0prog');if(p)p.innerHTML=`<div class="b0bar"><i style="width:${n/B0T.length*100}%"></i></div><b>ผ่านแล้ว ${n} / ${B0T.length} หัวข้อ</b>${n===B0T.length?'<span class="b0bd ok">ครบทุกหัวข้อ</span>':''}`;
  if(typeof ctxSchedule==='function')ctxSchedule();
}
function b0RenderAll(){
  const L=document.getElementById('b0list');if(!L)return;
  const open=new Set([...L.querySelectorAll('details[open]')].map(d=>d.dataset.id));
  L.innerHTML=B0T.map((t,i)=>`<details class="b0t" data-id="${t.id}" ${open.has(t.id)?'open':''}><summary><span class="b0no">${String(i+1).padStart(2,'0')}</span><span class="b0tt"><b>${esc(t.title)}</b><small>${esc(t.desc)}</small></span><span class="b0bdw">${b0Badge(t)}</span></summary>
    <div class="b0body"><div class="b0intro">${t.intro}</div>${t.w?`<div class="b0w panelbox"><h3>แบบจำลอง${t.task?' · ภารกิจ: '+esc(t.task):''}</h3><div class="b0wi"></div></div>`:''}<div class="b0qz"><h3>คำถาม</h3>${b0QuizHtml(t)}</div></div></details>`).join('');
  L.querySelectorAll('details.b0t').forEach(d=>{const t=B0T.find(x=>x.id===d.dataset.id);
    const mount=()=>{const w=d.querySelector('.b0wi');if(w&&!w.dataset.on&&t.w){w.dataset.on='1';try{t.w(w)}catch(e){w.textContent='แบบจำลองนี้แสดงไม่ได้ในเบราว์เซอร์นี้'}}};
    d.addEventListener('toggle',()=>{if(d.open)mount()});if(d.open)mount();
    d.querySelector('.b0qz').addEventListener('change',e=>{const r=e.target;if(r.type!=='radio')return;const fs=r.closest('.b0q'),i=+fs.dataset.q,k=+r.value,q=t.q[i];
      (B0.ans[t.id]=B0.ans[t.id]||{})[i]=k;
      fs.querySelectorAll('.b0o').forEach((l,j)=>{l.classList.remove('ok','err');if(j===k)l.classList.add(k===q.a?'ok':'err')});
      const ex=fs.querySelector('.b0ex');ex.hidden=false;ex.className='b0ex '+(k===q.a?'ok':'err');ex.textContent=(k===q.a?'ถูกต้อง · ':'ยังไม่ถูก ลองใหม่ · ')+q.ex;b0Save()})});
  b0Status();
}
function initBasics(){
  b0RenderAll();
  const ex=document.getElementById('b0exp'),co=document.getElementById('b0col'),rs=document.getElementById('b0reset');
  if(ex)ex.addEventListener('click',()=>document.querySelectorAll('#b0list details').forEach(d=>d.open=true));
  if(co)co.addEventListener('click',()=>document.querySelectorAll('#b0list details').forEach(d=>d.open=false));
  if(rs){let arm=0;rs.addEventListener('click',()=>{if(!arm){arm=setTimeout(()=>{arm=0;rs.textContent='ล้างคำตอบแบบฝึก 00'},3000);rs.textContent='กดอีกครั้งเพื่อยืนยัน';return}
    clearTimeout(arm);arm=0;rs.textContent='ล้างคำตอบแบบฝึก 00';B0.ans={};B0.task={};b0RenderAll();b0Save()})}
}
