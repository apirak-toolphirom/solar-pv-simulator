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

/* ---- cartoon icons used in the mini simulations (SVG fragments) ---- */
const B0G={
  sun(cx,cy,r,on){on=on==null?1:Math.max(0,Math.min(1,on));let ray='';for(let k=0;k<12;k++){const a=k*Math.PI/6,l=r*(k%2?1.55:1.8);ray+=`<path d="M${(cx+Math.cos(a-.12)*r*1.12).toFixed(1)} ${(cy+Math.sin(a-.12)*r*1.12).toFixed(1)}L${(cx+Math.cos(a)*l).toFixed(1)} ${(cy+Math.sin(a)*l).toFixed(1)}L${(cx+Math.cos(a+.12)*r*1.12).toFixed(1)} ${(cy+Math.sin(a+.12)*r*1.12).toFixed(1)}Z"/>`}
    return`<g class="b0sun"><g fill="#f7a823" opacity="${(0.25+0.75*on).toFixed(2)}">${ray}</g><circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffd23f" stroke="#f08c00" stroke-width="${(r/9).toFixed(1)}"/>
      <circle cx="${cx-r*.35}" cy="${cy-r*.15}" r="${r*.11}" fill="#5a3a00"/><circle cx="${cx+r*.35}" cy="${cy-r*.15}" r="${r*.11}" fill="#5a3a00"/>
      <path d="M${cx-r*.42} ${cy+r*.22}Q${cx} ${cy+r*.62} ${cx+r*.42} ${cy+r*.22}" fill="none" stroke="#5a3a00" stroke-width="${(r/10).toFixed(1)}" stroke-linecap="round"/>
      <circle cx="${cx-r*.6}" cy="${cy+r*.2}" r="${r*.13}" fill="#ff8a65" opacity=".55"/><circle cx="${cx+r*.6}" cy="${cy+r*.2}" r="${r*.13}" fill="#ff8a65" opacity=".55"/></g>`},
  thermo(x,y,h,lv,id){lv=Math.max(0,Math.min(1,lv));const w=h*.22,br=w*.95,top=y,bot=y+h-br,fill=(bot-top-w*.4)*lv;
    let tk='';for(let k=1;k<5;k++){const yy=top+w*.4+(bot-top-w*.4)*k/5;tk+=`<path d="M${x+w/2} ${yy.toFixed(1)}h${(w*.45).toFixed(1)}" stroke="#7d8a96" stroke-width="${(w/9).toFixed(1)}"/>`}
    return`<g class="b0th"><rect x="${x-w/2}" y="${top}" width="${w}" height="${bot-top+br*.4}" rx="${w/2}" fill="#fff" stroke="#55626e" stroke-width="${(w/7).toFixed(1)}"/>${tk}
      <rect ${id?`id="${id}"`:''} x="${x-w*.22}" y="${(bot-fill).toFixed(1)}" width="${w*.44}" height="${(fill+br*.3).toFixed(1)}" rx="${w*.2}" fill="#e53935"/>
      <circle cx="${x}" cy="${bot+br*.35}" r="${br}" fill="#e53935" stroke="#55626e" stroke-width="${(w/7).toFixed(1)}"/><circle cx="${x-br*.3}" cy="${bot+br*.1}" r="${br*.28}" fill="#fff" opacity=".5"/></g>`},
  bulb(cx,cy,s,on,id){on=Math.max(0,Math.min(1,on||0));const g=`hsl(48,${(30+70*on).toFixed(0)}%,${(78+10*on).toFixed(0)}%)`;
    return`<g class="b0bulb" ${id?`id="${id}"`:''}><circle cx="${cx}" cy="${cy}" r="${s*1.25}" fill="#ffe066" opacity="${(on*.55).toFixed(2)}"/>
      <path d="M${cx-s*.62} ${cy+s*.5}C${cx-s*1.05} ${cy+s*.05} ${cx-s*.95} ${cy-s*.95} ${cx} ${cy-s*.95}C${cx+s*.95} ${cy-s*.95} ${cx+s*1.05} ${cy+s*.05} ${cx+s*.62} ${cy+s*.5}L${cx+s*.4} ${cy+s*.78}H${cx-s*.4}Z" fill="${g}" stroke="#8a6d00" stroke-width="${(s/9).toFixed(1)}"/>
      <path d="M${cx-s*.25} ${cy+s*.72}L${cx-s*.25} ${cy+s*.1}Q${cx-s*.12} ${cy-s*.25} ${cx} ${cy+s*.1}Q${cx+s*.12} ${cy-s*.25} ${cx+s*.25} ${cy+s*.1}L${cx+s*.25} ${cy+s*.72}" fill="none" stroke="${on>.15?'#e65100':'#8d8d8d'}" stroke-width="${(s/12).toFixed(1)}"/>
      <rect x="${cx-s*.45}" y="${cy+s*.78}" width="${s*.9}" height="${s*.42}" rx="${s*.08}" fill="#9aa5ae" stroke="#5f6b75" stroke-width="${(s/14).toFixed(1)}"/><path d="M${cx-s*.45} ${cy+s*.92}h${s*.9}M${cx-s*.45} ${cy+s*1.06}h${s*.9}" stroke="#5f6b75" stroke-width="${(s/16).toFixed(1)}"/>
      <path d="M${cx-s*.22} ${cy+s*1.2}h${s*.44}l${-s*.08} ${s*.16}h${-s*.28}z" fill="#3b4650"/></g>`},
  panel(x,y,w,h){let l='';for(let k=1;k<4;k++)l+=`M${x+w*k/4} ${y}V${y+h}`;for(let k=1;k<3;k++)l+=`M${x} ${y+h*k/3}H${x+w}`;return`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(w,h)*.06}" fill="#1d4b78" stroke="#9fb0be" stroke-width="${(Math.min(w,h)*.05).toFixed(1)}"/><path d="${l}" stroke="#7fa6cf" stroke-width="${(Math.min(w,h)*.025).toFixed(1)}"/>`},
  battery(x,y,w,h,lv,col){lv=Math.max(0,Math.min(1,lv));return`<rect x="${x}" y="${y+h*.12}" width="${w}" height="${h*.88}" rx="${w*.12}" fill="#2b3138" stroke="#111" stroke-width="${(w/20).toFixed(1)}"/><rect x="${x+w*.3}" y="${y}" width="${w*.4}" height="${h*.14}" rx="${w*.05}" fill="#5f6b75"/>
    <rect x="${x+w*.14}" y="${(y+h*.2+h*.72*(1-lv)).toFixed(1)}" width="${w*.72}" height="${(h*.72*lv).toFixed(1)}" rx="${w*.06}" fill="${col||'#43c46b'}"/>`},
  house(x,y,s){return`<path d="M${x} ${y+s*.45}L${x+s*.5} ${y}L${x+s} ${y+s*.45}" fill="none" stroke="#a0522d" stroke-width="${(s/10).toFixed(1)}" stroke-linejoin="round"/><rect x="${x+s*.14}" y="${y+s*.42}" width="${s*.72}" height="${s*.56}" fill="#fff4e0" stroke="#a0522d" stroke-width="${(s/16).toFixed(1)}"/><rect x="${x+s*.42}" y="${y+s*.66}" width="${s*.18}" height="${s*.32}" fill="#a0522d"/>`},
  pole(x,y,h,off){return`<path d="M${x} ${y+h}L${x+h*.12} ${y}L${x+h*.24} ${y+h}M${x+h*.03} ${y+h*.72}H${x+h*.21}M${x+h*.06} ${y+h*.42}H${x+h*.18}M${x-h*.12} ${y+h*.12}H${x+h*.36}" fill="none" stroke="#55626e" stroke-width="${(h/22).toFixed(1)}"/>${off?`<path d="M${x-h*.15} ${y-h*.05}l${h*.54} ${h*.6}M${x+h*.39} ${y-h*.05}l${-h*.54} ${h*.6}" stroke="#e53935" stroke-width="${(h/12).toFixed(1)}" stroke-linecap="round"/>`:''}`},
  bolt(x,y,s,col){return`<path d="M${x+s*.55} ${y}L${x} ${y+s*.6}H${x+s*.42}L${x+s*.28} ${y+s*1.1}L${x+s*.9} ${y+s*.42}H${x+s*.48}Z" fill="${col||'#ffc400'}" stroke="#8a6d00" stroke-width="${(s/14).toFixed(1)}" stroke-linejoin="round"/>`},
  person(x,y,s,col){col=col||'#55626e';return`<g stroke="${col}" stroke-width="${(s/9).toFixed(1)}" stroke-linecap="round" fill="none"><circle cx="${x}" cy="${y}" r="${s*.16}" fill="#ffd8b1"/><path d="M${x} ${y+s*.16}V${y+s*.6}M${x} ${y+s*.6}L${x-s*.18} ${y+s}M${x} ${y+s*.6}L${x+s*.18} ${y+s}M${x} ${y+s*.3}L${x-s*.32} ${y+s*.18}"/></g>`},
  gnd(x,y,s,col){col=col||'#1a9c6e';return`<path d="M${x} ${y}V${y+s*.45}M${x-s*.45} ${y+s*.45}H${x+s*.45}M${x-s*.3} ${y+s*.68}H${x+s*.3}M${x-s*.14} ${y+s*.9}H${x+s*.14}" stroke="${col}" stroke-width="${(s/8).toFixed(1)}" stroke-linecap="round"/>`},
  dust(x,y,w,h,n){let d='';for(let k=0;k<n;k++){const a=(k*97%100)/100,b=(k*53%100)/100;d+=`<circle cx="${(x+a*w).toFixed(1)}" cy="${(y+b*h).toFixed(1)}" r="${1.2+(k%3)*.6}" fill="#8d6e63" opacity=".75"/>`}return d}
};
/* small icon in front of each slider / select label, picked from the label text */
function b0LabIc(lab){const L=String(lab);let g='';
  if(/ฝุ่น/.test(L))g=B0G.panel(2,7,20,12)+B0G.dust(3,7,18,12,9);
  else if(/อุณหภูมิ/.test(L))g=B0G.thermo(12,2,20,.55);
  else if(/มุมสูงดวงอาทิตย์/.test(L))g=`<path d="M2 21H22" stroke="#7d8a96" stroke-width="1.5"/><path d="M4 21A10 10 0 0 1 20 21" fill="none" stroke="#c9a227" stroke-width="1" stroke-dasharray="2 1.5"/>`+B0G.sun(15,9,4,1);
  else if(/แสง|รังสี/.test(L))g=B0G.sun(12,12,5.2,1);
  else if(/มุมเอียง/.test(L))g=`<path d="M2 21H22" stroke="#7d8a96" stroke-width="1.5"/><path d="M4 21L19 11" stroke="#1d4b78" stroke-width="4" stroke-linecap="round"/><path d="M11 21A7 7 0 0 0 10 17" fill="none" stroke="#e65100" stroke-width="1.2"/>`;
  else if(/ความต้านทานหลักดิน/.test(L))g=B0G.gnd(12,4,16);
  else if(/ความต้านทาน/.test(L))g=`<path d="M1 12H5L7 7L10 17L13 7L16 17L18 12H23" fill="none" stroke="#55626e" stroke-width="1.8" stroke-linejoin="round"/>`;
  else if(/โหลดที่ต้องการ|โหลด/.test(L))g=B0G.bulb(12,10,7,1);
  else if(/กำลัง DC|แผง|สตริง/.test(L))g=B0G.panel(3,5,18,14);
  else if(/Ah|ความจุ|อนุกรม \(ลูก\)|ขนาน \(ชุด\)|แบต/.test(L))g=B0G.battery(6,2,12,20,.7);
  else if(/ไฟการไฟฟ้า/.test(L))g=B0G.pole(7,3,18,0);
  else if(/อินเวอร์เตอร์/.test(L))g=`<rect x="4" y="3" width="16" height="18" rx="2" fill="#dbe3ea" stroke="#55626e" stroke-width="1.3"/><path d="M8 15c1.5-3 2.5-3 4 0s2.5 3 4 0" fill="none" stroke="#2a6fc4" stroke-width="1.4"/>`;
  else if(/ฟิวส์/.test(L))g=`<path d="M1 12H23" stroke="#55626e" stroke-width="1.5"/><rect x="6" y="8" width="12" height="8" rx="1.5" fill="#fff" stroke="#55626e" stroke-width="1.4"/>`;
  else if(/เบรกเกอร์/.test(L))g=`<rect x="6" y="2" width="12" height="20" rx="2" fill="#fff" stroke="#55626e" stroke-width="1.4"/><rect x="9" y="7" width="6" height="7" rx="1" fill="#e53935"/>`;
  else if(/เครื่องมือ|ย่าน/.test(L))g=`<rect x="6" y="2" width="12" height="20" rx="2" fill="#e9b52a" stroke="#55626e"/><rect x="8" y="4" width="8" height="5" fill="#cfe8d4"/><circle cx="12" cy="15" r="3" fill="#333"/>`;
  else if(/การต่อ|รูปแบบ|ชนิดแผง/.test(L))g=B0G.panel(1,6,10,12)+B0G.panel(13,6,10,12)+`<path d="M11 9h2" stroke="#d62828" stroke-width="1.5"/>`;
  return g?`<svg class="b0li" viewBox="0 0 24 24" aria-hidden="true">${g}</svg>`:'';
}
/* control helpers */
const b0Rng=(id,lab,min,max,step,val,unit)=>`<label class="b0r"><span>${b0LabIc(lab)}${lab}</span><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"><b id="${id}v">${val}${unit||''}</b></label>`;
const b0Sel=(id,lab,opts,val)=>`<label class="b0s"><span>${lab?b0LabIc(lab):''}${lab}</span><select id="${id}">${opts.map(o=>{const[v,t]=Array.isArray(o)?o:[o,o];return`<option value="${esc(v)}" ${String(v)===String(val)?'selected':''}>${esc(t)}</option>`}).join('')}</select></label>`;
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
  el.innerHTML=`<div class="b0fig"><svg viewBox="0 0 520 170" class="b0ill" role="img" aria-label="แสงตกกระทบเซลล์ อิเล็กตรอนไหลผ่านหลอดไฟ" overflow="visible">
   <g id="b1sun">${B0G.sun(42,40,19,1)}</g><g id="b1ray" stroke="#f7a823" stroke-width="3" stroke-linecap="round" stroke-dasharray="7 6"><line x1="66" y1="52" x2="150" y2="76"/><line x1="60" y1="64" x2="146" y2="90"/><line x1="72" y1="38" x2="168" y2="70"/></g>
   <rect x="150" y="70" width="190" height="22" fill="var(--s1)" opacity=".85"/><text x="245" y="85" text-anchor="middle" class="b0lab" fill="#fff">ชนิด N (−)</text>
   <rect x="150" y="92" width="190" height="40" fill="var(--s2)" opacity=".75"/><text x="245" y="117" text-anchor="middle" class="b0lab" fill="#fff">ชนิด P (+)</text>
   <path d="M340 80 H420 V40 H462" fill="none" stroke="var(--neg)" stroke-width="2.5"/><path d="M340 120 H420 V150 H500 V64 H478" fill="none" stroke="var(--pos)" stroke-width="2.5"/>
   <g id="b1bw">${B0G.bulb(470,44,17,.8)}</g><text x="470" y="100" text-anchor="middle" class="b0ax">หลอด DC</text>
   <g id="b1th">${B0G.thermo(120,6,52,.3)}</g><text x="120" y="2" text-anchor="middle" class="b0ax" id="b1tt"></text>
   <text x="380" y="72" class="b0ax">e⁻ →</text></svg></div>
   ${b0Rng('b1g','ความเข้มแสง (W/m²)',0,1200,50,1000)}${b0Rng('b1t','อุณหภูมิเซลล์ (°C)',10,75,1,25,' °C')}<div id="b1o"></div>`;
  b0Bind(el,['b1g','b1t'],()=>{const c=b0Curve(b0V('b1g'),b0V('b1t'));
   el.querySelector('#b1o').innerHTML=b0Kv([['กระแสลัดวงจร Isc',b0f(c.isc,2)+' A'],['แรงดันวงจรเปิด Voc',b0f(c.voc,1)+' V'],['กำลังสูงสุด',b0f(c.mp.P,0)+' W'],['ชนิดไฟ','DC (มีขั้ว + / −)']]);
   const on=Math.min(1,c.mp.P/550),g=b0V('b1g'),t=b0V('b1t');el.querySelector('#b1bw').innerHTML=B0G.bulb(470,44,17,on);el.querySelector('#b1sun').innerHTML=B0G.sun(42,40,19,g/1200);
   el.querySelector('#b1ray').setAttribute('opacity',(g/1200).toFixed(2));el.querySelector('#b1th').innerHTML=B0G.thermo(120,10,52,(t-0)/80);el.querySelector('#b1tt').textContent=t+' °C'},['',' °C']);
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
 intro:`<ul><li><b>Voc</b> หมุนปุ่มไป <b>V⎓</b> (แรงดัน DC) ใช้สายวัดแดงเสียบช่อง V Ω ดำเสียบ COM จิ้มคร่อมขั้ว + และ − ขณะ <b>ไม่ต่อโหลด</b> ตั้งย่านสูงกว่าค่าที่คาดไว้</li>
 <li><b>Isc</b> ต่อสายลัดขั้ว + กับ − ผ่าน <b>สวิตช์/เบรกเกอร์ DC</b> (สวิตช์ OFF) แล้วหมุนแคลมป์มิเตอร์ไป <b>A⎓</b> กดตั้งศูนย์ คล้องปากคีบรอบสาย <b>เส้นเดียว</b> แล้วจึงปิดสวิตช์ (ON) อ่านค่า เปิดสวิตช์ (OFF) ก่อนถอดสายลัด ห้ามเสียบสายมิเตอร์ช่อง A ของมัลติมิเตอร์ตรงขั้วแผง (กระแสเกินพิกัด ฟิวส์มิเตอร์ขาด และเกิดอาร์กตอนปลดสาย)</li>
 <li>จดความเข้มแสงและอุณหภูมิแผงพร้อมกันทุกครั้ง เพราะค่าที่วัดเปลี่ยนตามสองค่านี้ ป้ายแผงบอกค่าที่ STC (1000 W/m², 25 °C)</li></ul>`,
 w(el){
  /* ฉากลากได้: แผง + สาย +/− ขั้ว MC4 · สายลัดผ่านสวิตช์ DC · แคลมป์มิเตอร์ปุ่มหมุนแบบ Fluke 325 (ลากตัวเครื่องไปคล้องสาย) · ปลายสายวัดแดง/ดำ (ลากไปแตะขั้ว) */
  const POS=[['off','OFF','ปิด'],['adc','A⎓','กระแส DC (ปากคีบ)'],['aac','A~','กระแส AC (ปากคีบ)'],['vdc','V⎓','แรงดัน DC (สายวัด)'],['vac','V~','แรงดัน AC (สายวัด)'],['ohm','Ω •)))','ความต้านทาน / ความต่อเนื่อง'],['cap','⊣⊢','ความจุไฟฟ้า'],['tmp','°C','อุณหภูมิ']];
  const ang=k=>-120+k*240/(POS.length-1),SC=.55,JX=130*SC,JY=70*SC;
  const TP={pos:[318,372],neg:[408,452]};   /* + and − staggered so the two probes never overlap */                       /* MC4 tips: probes touch here */
  const ZN={red:[95,330,'สาย + (แดง)'],blk:[150,330,'สาย − (ดำ)'],pair:[222,400,'สาย + และ − พร้อมกัน'],sh:[420,346,'สายลัด']};
  const S={pos:4,mx:560,my:150,pr:[610,500],pb:[690,500],jaw:null,lead:false,sw:false,warn:''};
  const dial=POS.map((p,k)=>{const r=(ang(k)-90)*Math.PI/180,x=130+Math.cos(r)*74,y=300+Math.sin(r)*74;return`<g class="b0dp" data-k="${k}" tabindex="0" role="button" aria-label="${p[2]}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="18" fill="transparent"/><text x="${x.toFixed(1)}" y="${(y+4).toFixed(1)}" text-anchor="middle" fill="${p[0]==='off'?'#ff8a80':'#fff'}">${p[1]}</text></g>`}).join('');
  const mc4=(x,y,col,lab)=>`<rect x="${x-34}" y="${y-9}" width="30" height="18" rx="4" fill="#20252a"/><rect x="${x-6}" y="${y-6}" width="12" height="12" rx="2" fill="#20252a"/><circle cx="${x+6}" cy="${y}" r="3.2" fill="#c9ccd0"/><text x="${x-19}" y="${y+4}" text-anchor="middle" font-size="12" font-weight="700" fill="${col}">${lab}</text>`;
  el.innerHTML=`<p class="hint tight">ลาก<b>ปลายสายวัดแดง/ดำ</b>ไปแตะขั้ว MC4 เพื่อวัดแรงดัน · ลาก<b>แคลมป์มิเตอร์</b> (จับที่ปากคีบหรือตัวเครื่อง) ไปคล้องสาย เพื่อวัดกระแส · แตะสัญลักษณ์รอบปุ่มเพื่อหมุนย่าน · วัด Isc ต้องต่อสายลัดและปิดสวิตช์ DC</p>
   <div class="eqact"><button class="chip" id="b3lead" type="button">ต่อสายลัด (ผ่านสวิตช์ตัดตอน DC)</button><button class="chip" id="b3sw" type="button" disabled>สวิตช์ DC: เปิด (OFF)</button><button class="chip" id="b3l" type="button" aria-label="หมุนปุ่มซ้าย">◀ หมุน</button><button class="chip" id="b3r" type="button" aria-label="หมุนปุ่มขวา">หมุน ▶</button><button class="chip" id="b3rs" type="button">วางเครื่องมือที่เดิม</button></div>
   <div class="b0scn"><svg id="b3svg" viewBox="0 0 760 640" role="img" aria-label="แผงโซลาร์ ขั้ว MC4 สายลัด และแคลมป์มิเตอร์">
    <g id="b3sun"></g>
    <g>${B0G.panel(20,60,190,230)}<rect x="96" y="290" width="60" height="22" rx="3" fill="#2b3138"/><text x="126" y="305" text-anchor="middle" font-size="10" fill="#cfd8dc">J-Box</text></g>
    <path d="M110 312V352Q95 360 95 372V384Q95 394 120 394H200Q210 394 214 394H262Q290 394 290 372H314" fill="none" stroke="#d62828" stroke-width="7" stroke-linejoin="round"/>
    <path d="M142 312V352Q150 360 150 372V396Q150 406 170 406H262Q290 406 290 430V440Q290 452 310 452H380" fill="none" stroke="#2b3138" stroke-width="7" stroke-linejoin="round"/>
    ${mc4(TP.pos[0]+6,TP.pos[1],'#ff8a80','+')}${mc4(TP.neg[0]+6,TP.neg[1],'#cfd8dc','−')}
    <g id="b3short"></g>
    <g id="b3zones"></g>
    <g id="b3m" class="b0drag" transform="translate(${S.mx} ${S.my}) scale(${SC})">
     <path class="b3grab" d="M70 120V70A60 60 0 1 1 190 70V120" fill="none" stroke="#2b3138" stroke-width="26" stroke-linecap="round"/><path d="M70 120V70A60 60 0 1 1 190 70V120" fill="none" stroke="#e8b923" stroke-width="10" stroke-linecap="round" pointer-events="none"/>
     <rect id="b3gap" x="120" y="-4" width="20" height="24" fill="var(--surface)" pointer-events="none"/>
     <rect class="b3grab" x="30" y="118" width="200" height="292" rx="26" fill="#e8b923" stroke="#2b3138" stroke-width="3"/><rect class="b3grab" x="42" y="128" width="176" height="272" rx="18" fill="#3a4148"/>
     <rect class="b3grab" x="56" y="140" width="148" height="64" rx="8" fill="#b9d8b0" stroke="#1d2a1d" stroke-width="2"/>
     <text id="b3lcd" x="192" y="186" text-anchor="end" font-family="monospace" font-size="34" font-weight="700" fill="#1d2a1d" pointer-events="none">0.0</text><text id="b3unit" x="62" y="158" font-family="monospace" font-size="13" fill="#1d2a1d" pointer-events="none"></text>
     <g font-family="sans-serif" font-size="12" font-weight="700">${dial}</g>
     <circle cx="130" cy="300" r="46" fill="#22272c" stroke="#111" stroke-width="3" pointer-events="none"/><g id="b3knob" pointer-events="none"><circle cx="130" cy="300" r="38" fill="#2f363c" stroke="#555" stroke-width="2"/><rect x="124" y="258" width="12" height="44" rx="5" fill="#e8b923"/></g>
     <circle cx="96" cy="388" r="7" fill="#d62828" stroke="#111"/><circle cx="164" cy="388" r="7" fill="#111" stroke="#666"/><text x="96" y="372" text-anchor="middle" font-size="10" fill="#fff">V Ω</text><text x="164" y="372" text-anchor="middle" font-size="10" fill="#fff">COM</text>
    </g>
    <g id="b3leads"></g>
    <g id="b3pr" class="b0drag"></g><g id="b3pb" class="b0drag"></g>
   </svg></div>
   <p class="b0cmpos" id="b3pos"></p>
   ${b0Rng('b3g','ความเข้มแสงขณะวัด (W/m²)',200,1100,50,900)}${b0Rng('b3t','อุณหภูมิแผง (°C)',20,70,1,45,' °C')}
   <p class="b0msg" id="b3msg"></p><div class="b0done" id="b3d"></div>`;
  const st={voc:false,isc:false},$q=x=>el.querySelector(x),svg=$q('#b3svg');
  /* red probe points DOWN onto its terminal (handle above), black probe points UP (handle below): the two never overlap */
  const probe=(x,y,col,d)=>`<path d="M${x} ${y}l-5 ${16*d}h10z" fill="#c9ccd0" stroke="#7d8a96" stroke-width=".8"/><rect x="${x-7}" y="${d>0?y+16:y-60}" width="14" height="44" rx="5" fill="${col}" stroke="#111" stroke-width="1.2"/><rect x="${x-9}" y="${d>0?y+18:y-24}" width="18" height="6" rx="2" fill="${col}" stroke="#111" stroke-width="1"/><circle cx="${x}" cy="${y+38*d}" r="24" fill="transparent"/>`;
  const near=(p,q,r)=>Math.hypot(p[0]-q[0],p[1]-q[1])<=r;
  const on=p=>near(p,TP.pos,16)?'pos':near(p,TP.neg,16)?'neg':null;
  const shortOn=()=>S.lead&&S.sw;
  function draw(){
   const g=b0V('b3g');$q('#b3sun').innerHTML=B0G.sun(250,40,22,g/1100);
   /* DC isolator switch: grey enclosure, yellow plate, red rotary handle (vertical = ON, horizontal = OFF) + IEC switch-disconnector symbol */
   const iso=`<g id="b3swg" style="cursor:pointer" role="button" aria-label="สวิตช์ตัดตอน DC ${S.sw?'ON':'OFF'}">
     <rect x="428" y="352" width="84" height="86" rx="7" fill="#e3e7ea" stroke="#455a64" stroke-width="2"/><rect x="436" y="357" width="68" height="11" rx="2" fill="#cfd6db"/><text x="470" y="365.5" text-anchor="middle" font-size="7.5" font-weight="700" fill="#37474f">DC ISOLATOR</text>
     <circle cx="470" cy="405" r="20" fill="#ffd400" stroke="#8a6d00" stroke-width="1.5"/><text x="470" y="382" text-anchor="middle" font-size="8" font-weight="700" fill="${S.sw?'#1b5e20':'#5a4600'}">ON</text><text x="492" y="408" font-size="8" font-weight="700" fill="${S.sw?'#5a4600':'#b71c1c'}">OFF</text>
     <g transform="rotate(${S.sw?0:90} 470 405)"><rect x="465" y="389" width="10" height="32" rx="4.5" fill="#e53935" stroke="#7f1d1d" stroke-width="1.5"/><path d="M470 392v7" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g><circle cx="470" cy="405" r="3.5" fill="#7f1d1d"/></g>
     <g transform="translate(524 366)" stroke="var(--ink)" stroke-width="2" fill="none" stroke-linecap="round"><path d="M10 0V14M10 44V58"/><path d="M5 14H15"/><path d="M10 44${S.sw?'L10 15':'L-2 18'}"/><text x="20" y="34" font-size="11" stroke="none" fill="var(--ink)">⎓</text></g>
     <text x="534" y="440" text-anchor="middle" font-size="10" fill="var(--muted)">${S.sw?'ON':'OFF'}</text>`;
   $q('#b3short').innerHTML=S.lead?`<path d="M324 372H380Q392 372 392 360V346H448Q470 346 470 352" fill="none" stroke="#d62828" stroke-width="6"/><path d="M414 452H452Q470 452 470 438" fill="none" stroke="#2b3138" stroke-width="6"/>${iso}`:'';
   const sw=$q('#b3swg');if(sw)sw.addEventListener('click',toggleSw);
   $q('#b3zones').innerHTML=Object.keys(ZN).filter(k=>k!=='sh'||S.lead).map(k=>`<circle cx="${ZN[k][0]}" cy="${ZN[k][1]}" r="${S.jaw===k?0:9}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-dasharray="3 3" opacity=".8"/>`).join('');
   $q('#b3m').setAttribute('transform',`translate(${S.mx} ${S.my}) scale(${SC})`);$q('#b3gap').setAttribute('visibility',S.jaw?'hidden':'visible');
   $q('#b3knob').setAttribute('transform',`rotate(${ang(S.pos)} 130 300)`);el.querySelectorAll('.b0dp').forEach(d=>d.classList.toggle('on',+d.dataset.k===S.pos));
   const jr=[S.mx+96*SC,S.my+388*SC],jb=[S.mx+164*SC,S.my+388*SC];
   const lead=(j,p,col,d)=>`<path d="M${j[0]} ${j[1]}C${j[0]} ${j[1]+90} ${p[0]} ${p[1]+150*d} ${p[0]} ${p[1]+60*d}" fill="none" stroke="${col}" stroke-width="4"/>`;
   $q('#b3leads').innerHTML=lead(jr,S.pr,'#d62828',-1)+lead(jb,S.pb,'#2b3138',1);
   $q('#b3pr').innerHTML=probe(S.pr[0],S.pr[1],'#d62828',-1);$q('#b3pb').innerHTML=probe(S.pb[0],S.pb[1],'#2b3138',1);
   $q('#b3sw').disabled=!S.lead;$q('#b3sw').textContent=`สวิตช์ DC: ${S.sw?'ปิดวงจร (ON)':'เปิด (OFF)'}`;$q('#b3lead').textContent=S.lead?'ถอดสายลัด':'ต่อสายลัด (ผ่านสวิตช์ตัดตอน DC)';
  }
  function measure(){
   const m=POS[S.pos][0],c=b0Curve(b0V('b3g'),b0V('b3t')),r=on(S.pr),k=on(S.pb),sh=shortOn();
   let v='0.0',u='',ok=null,t='';
   if(m==='off'){v='';t='เครื่องปิดอยู่ หมุนปุ่มไปยังย่านที่ต้องการ'}
   else if(m==='tmp'){v='--';u='°C';ok=false;t='ย่านอุณหภูมิใช้กับหัววัดอุณหภูมิ ไม่ใช่การวัดค่าไฟฟ้าของแผง'}
   else if(m==='cap'){v='OL';u='µF';ok=false;t='ย่านความจุใช้กับตัวเก็บประจุที่ปลดไฟแล้ว ห้ามวัดกับแผงที่มีแรงดัน'}
   else if(m==='adc'||m==='aac'){u=m==='adc'?'A⎓':'A~';
    if(!S.jaw){t='ลากแคลมป์มิเตอร์ไปคล้องสาย (วงกลมประ) ปากคีบจะปิดเมื่อคล้องได้'}
    else if(S.jaw==='pair'){ok=false;t='คล้องสาย + และ − พร้อมกัน กระแสไปและกลับหักล้างกัน อ่านได้ 0 A ต้องคล้องสายเส้นเดียว'}
    else if(!sh){ok=false;t=S.lead?'สวิตช์ DC ยังเปิดอยู่ ไม่มีกระแสไหล แตะที่สวิตช์เพื่อปิดวงจร':'วงจรเปิดอยู่ (ไม่มีโหลด) จึงไม่มีกระแส ต่อสายลัดผ่านสวิตช์ DC ก่อน'}
    else if(m==='aac'){ok=false;t='กระแสจากแผงเป็น DC ย่าน A~ อ่านได้ราว 0 A ให้หมุนไป A⎓'}
    else{const neg=S.jaw==='blk';v=(neg?'-':'')+b0f(c.isc,1);ok=true;st.isc=true;t=`ถูกต้อง: Isc = ${b0f(c.isc,2)} A ที่สภาพนี้ (ป้าย ${B0P.Isc} A ที่ 1000 W/m²)${neg?' · ค่าติดลบเพราะสาย − กระแสไหลสวนทิศลูกศรบนปากคีบ':''} · เปิดสวิตช์ DC ก่อนถอดสายลัดทุกครั้ง`}
    if(ok!==true&&!(m==='adc'&&ok===null))v='0.0'}
   else{u=m==='vdc'?'V⎓':m==='vac'?'V~':'Ω';
    if(!r||!k||r===k){v=m==='ohm'?'OL':'0.0';t=r&&r===k?'ปลายสายทั้งสองแตะขั้วเดียวกัน ให้แตะคนละขั้ว':'ลากปลายสายวัดแดงไปแตะขั้ว + และสายดำไปแตะขั้ว −'}
    else if(m==='ohm'){v='OL';ok=false;t='อันตราย: ห้ามวัดโอห์มกับแผงที่มีแรงดัน มิเตอร์อาจเสียหาย'}
    else if(m==='vac'){v='0.0';ok=false;t='ตั้งผิดย่าน: แผงให้ไฟ DC ย่าน V~ อ่านค่าไม่ถูก ให้หมุนไป V⎓'}
    else if(sh){v='0.0';ok=false;t='ขั้วถูกลัดผ่านสวิตช์ DC อยู่ แรงดันจึงใกล้ 0 V เปิดสวิตช์ก่อนวัด Voc'}
    else if(r==='neg'){v='-'+b0f(c.voc,1);ok=false;t='สลับขั้ว: สายแดงแตะขั้ว − ค่าจึงติดลบ ให้สายแดงแตะ + และสายดำแตะ −'}
    else{v=b0f(c.voc,1);ok=true;st.voc=true;t=`ถูกต้อง: Voc = ${b0f(c.voc,1)} V ที่สภาพนี้ (ป้าย ${B0P.Voc} V ที่ STC) แผงร้อนกว่า 25 °C ค่าจึงต่ำกว่าป้าย`}}
   if(S.warn){t=S.warn+' · '+t;ok=false}
   $q('#b3lcd').textContent=v;$q('#b3unit').textContent=u;b0Msg($q('#b3msg'),ok,t);
   $q('#b3pos').innerHTML=`ปุ่มหมุนอยู่ที่ <b>${POS[S.pos][1]}</b> · ${POS[S.pos][2]}${S.jaw?` · ปากคีบคล้อง<b>${ZN[S.jaw][2]}</b>`:''}`;
   $q('#b3d').innerHTML=`<span class="${st.voc?'ok':''}">${st.voc?'✓':'○'} วัด Voc ถูกวิธี</span><span class="${st.isc?'ok':''}">${st.isc?'✓':'○'} วัด Isc ถูกวิธี</span>`;
   if(st.voc&&st.isc)b0Task('t3',true)}
  const run=()=>{draw();measure()};
  function toggleSw(){if(!S.lead)return;S.sw=!S.sw;S.warn='';run()}
  $q('#b3lead').addEventListener('click',()=>{S.warn=S.lead&&S.sw?'อันตราย: ถอดสายลัดขณะสวิตช์ปิดวงจรอยู่ จะเกิดอาร์ก DC ต้องเปิดสวิตช์ DC (OFF) ก่อนถอดทุกครั้ง':'';S.lead=!S.lead;S.sw=false;if(!S.lead&&S.jaw==='sh')S.jaw=null;run()});
  $q('#b3sw').addEventListener('click',toggleSw);
  const go=k=>{S.pos=Math.max(0,Math.min(POS.length-1,k));run()};
  el.querySelectorAll('.b0dp').forEach(d=>{d.addEventListener('pointerdown',e=>e.stopPropagation());d.addEventListener('click',()=>go(+d.dataset.k));d.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go(+d.dataset.k)}})});
  $q('#b3l').addEventListener('click',()=>go(S.pos-1));$q('#b3r').addEventListener('click',()=>go(S.pos+1));
  $q('#b3rs').addEventListener('click',()=>{Object.assign(S,{mx:560,my:150,pr:[610,500],pb:[690,500],jaw:null,warn:''});run()});
  /* dragging */
  const pt=e=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(svg.getScreenCTM().inverse());return[q.x,q.y]};
  let drag=null;
  const start=(what,e)=>{e.preventDefault();const p=pt(e);drag={what,dx:what==='m'?p[0]-S.mx:p[0]-S[what][0],dy:what==='m'?p[1]-S.my:p[1]-S[what][1]};S.warn='';if(what==='m')S.jaw=null;try{svg.setPointerCapture(e.pointerId)}catch(_){}};
  el.querySelectorAll('#b3m .b3grab').forEach(g=>g.addEventListener('pointerdown',e=>start('m',e)));
  $q('#b3pr').addEventListener('pointerdown',e=>start('pr',e));$q('#b3pb').addEventListener('pointerdown',e=>start('pb',e));
  svg.addEventListener('pointermove',e=>{if(!drag)return;const p=pt(e),x=Math.max(0,Math.min(760,p[0]-drag.dx)),y=Math.max(-20,Math.min(600,p[1]-drag.dy));
    if(drag.what==='m'){S.mx=Math.min(760-140*SC*2,x);S.my=y}else S[drag.what]=[x,Math.max(60,Math.min(y,570))];draw()});
  const end=()=>{if(!drag)return;const w=drag.what;drag=null;
    if(w==='m'){const jc=[S.mx+JX,S.my+JY];let best=null,bd=34;Object.keys(ZN).forEach(k=>{if(k==='sh'&&!S.lead)return;const d=Math.hypot(jc[0]-ZN[k][0],jc[1]-ZN[k][1]);if(d<bd){bd=d;best=k}});
      if(best){S.jaw=best;S.mx=ZN[best][0]-JX;S.my=ZN[best][1]-JY}}
    else{const dp=Math.hypot(S[w][0]-TP.pos[0],S[w][1]-TP.pos[1]),dn=Math.hypot(S[w][0]-TP.neg[0],S[w][1]-TP.neg[1]),t=Math.min(dp,dn)<=30?(dp<=dn?'pos':'neg'):null;if(t)S[w]=TP[t].slice()}
    run()};
  svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);
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
  el.innerHTML=`<p class="hint tight">อินเวอร์เตอร์ตัวอย่าง 5 kW (AC) · รับ DC สูงสุด 7.5 kW</p>${b0Rng('b5p','กำลัง DC จากแผง (W)',0,7500,100,3000)}${b0Sel('b5grid','ไฟการไฟฟ้า',[['on','ปกติ'],['off','ไฟดับ']],'on')}${b0Sel('b5ty','ชนิดอินเวอร์เตอร์',[['on','On-grid'],['hy','Hybrid (มีแบต)']],'on')}<div id="b5s"></div><div id="b5o"></div><div id="b5w"></div>`;
  const run=()=>{const p=b0V('b5p'),grid=el.querySelector('#b5grid').value,ty=el.querySelector('#b5ty').value,ld=p/5000;
   const eta=p<=0?0:Math.min(0.975,0.975-0.06*Math.exp(-ld*9)),ac0=p*eta,ac=Math.min(5000,ac0),clip=ac0>5000;
   const stop=grid==='off'&&ty==='on';
   {const on=stop?0:Math.min(1,ac/4000),hy=ty==='hy';el.querySelector('#b5s').innerHTML=`<svg viewBox="0 0 520 120" class="b0ill" role="img" aria-label="แผงผลิตไฟ DC ผ่านอินเวอร์เตอร์เป็น AC เข้าบ้าน">
     ${B0G.sun(34,34,16,Math.min(1,p/6000))}${B0G.panel(70,40,70,44)}<path d="M140 62H190" stroke="var(--pos)" stroke-width="3" ${p>0?'stroke-dasharray="6 5"':''}/><text x="165" y="54" text-anchor="middle" class="b0ax">DC</text>
     <rect x="192" y="34" width="62" height="56" rx="6" fill="var(--invfill)" stroke="var(--ink)" stroke-width="2"/><text x="207" y="54" class="b0lab" fill="var(--pos)">=</text><path d="M214 74c4-9 8-9 12 0s8 9 12 0" fill="none" stroke="var(--s1)" stroke-width="2.4"/>
     <path d="M254 62H312" stroke="${stop?'var(--muted)':'var(--s1)'}" stroke-width="3" ${stop?'':'stroke-dasharray="6 5"'}/><text x="283" y="54" text-anchor="middle" class="b0ax">AC</text>
     ${B0G.house(314,22,74)}${B0G.bulb(351,72,9,on)}${hy?B0G.battery(214,94,22,24,.7):''}
     <path d="M388 70H440" stroke="${grid==='off'?'var(--muted)':'var(--muted)'}" stroke-width="2"/>${B0G.pole(442,26,70,grid==='off')}<text x="452" y="114" text-anchor="middle" class="b0ax">${grid==='off'?'ไฟการไฟฟ้าดับ':'ไฟการไฟฟ้า'}</text></svg>`}
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
  el.innerHTML=`${b0Sel('b7k','ชนิด',[['pb','ตะกั่วกรด (DoD 50%)'],['li','LiFePO4 (DoD 90%)']],'li')}${b0Sel('b7v','แรงดันลูกละ',[['12','12 V'],['12.8','12.8 V'],['25.6','25.6 V'],['51.2','51.2 V']],'51.2')}${b0Rng('b7a','ความจุลูกละ (Ah)',50,300,10,100,' Ah')}${b0Rng('b7s','ต่ออนุกรม (ลูก)',1,4,1,1)}${b0Rng('b7p','ต่อขนาน (ชุด)',1,4,1,1)}${b0Rng('b7l','โหลดที่ต้องการสำรอง (W)',100,3000,50,600,' W')}<div id="b7pic"></div><div id="b7o"></div>`;
  const run=()=>{const li=el.querySelector('#b7k').value==='li',v=+el.querySelector('#b7v').value,a=b0V('b7a'),s=b0V('b7s'),p=b0V('b7p'),ld=b0V('b7l');
   const V=v*s,Ah=a*p,E=V*Ah,dod=li?0.9:0.5,use=E*dod*0.92;
   {let g='';for(let j=0;j<p;j++)for(let i=0;i<s;i++){const x=20+i*46,y=12+j*52;g+=B0G.battery(x,y,30,40,.85,li?'#43c46b':'#f0a030');if(i<s-1)g+=`<path d="M${x+21} ${y+2}Q${x+38} ${y-8} ${x+55} ${y+2}" fill="none" stroke="var(--pos)" stroke-width="2"/>`}
    const W=Math.max(260,40+s*46+130),hrs=use/ld;g+=`<path d="M${30+s*46} ${12+p*26}H${60+s*46}" stroke="var(--ink)" stroke-width="2" stroke-dasharray="5 4"/>`+B0G.bulb(84+s*46,8+p*26,14,Math.min(1,hrs/8))+`<text x="${84+s*46}" y="${36+p*26}" text-anchor="middle" class="b0ax">${ld} W</text>`;
    el.querySelector('#b7pic').innerHTML=`<svg viewBox="0 0 ${W} ${20+p*52}" class="b0ill" style="max-width:${W*1.2}px" role="img" aria-label="แบตต่อ ${s} อนุกรม × ${p} ขนาน">${g}</svg>`}
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
  el.innerHTML=`<div class="b0tog"><label class="chk"><input type="checkbox" id="b9pe" checked> ต่อสายดินที่โครงเครื่อง</label><label class="chk"><input type="checkbox" id="b9rcd" checked> มี RCD/RCBO 30 mA</label><label class="chk"><input type="checkbox" id="b9f"> เกิดไฟรั่วลงโครง</label><label class="chk"><input type="checkbox" id="b9h" checked> มีคนจับโครงเครื่อง</label></div>${b0Rng('b9r','ความต้านทานหลักดิน (Ω)',1,100,1,5,' Ω')}<div id="b9s"></div><div id="b9o"></div>`;
  const run=()=>{const pe=el.querySelector('#b9pe').checked,rcd=el.querySelector('#b9rcd').checked,fa=el.querySelector('#b9f').checked,hu=el.querySelector('#b9h').checked,rg=b0V('b9r');
   let rows,lvl='ok',t;
   if(!fa){rows=[['สถานะ','ปกติ ไม่มีไฟรั่ว'],['แรงดันที่โครง','0 V']];t='ลองติ๊ก "เกิดไฟรั่วลงโครง"'}
   else{const Rb=1000,Rsrc=1+rg; /* fault loop through PE: source/neutral earth ~1 Ω + electrode */
    if(pe){const If=230/(Rsrc+0.5),Vt=If*0.5;rows=[['กระแสรั่วผ่านสายดิน',b0f(If,1)+' A'],['แรงดันสัมผัสที่โครง',b0f(Math.min(230,Vt),0)+' V'],['ผล',rcd?'RCD ตัดวงจรภายในราว 0.03 วินาที':If>=200?'เบรกเกอร์ตัดเพราะกระแสสูง':'เบรกเกอร์อาจไม่ตัด (กระแสไม่พอ) ควรมี RCD']];lvl=rcd||If>=200?'ok':'warn';t=rcd?'ปลอดภัย: สายดินพากระแสลงดินและเครื่องตัดทำงาน':'มีสายดินแต่ไม่มี RCD: ถ้าหลักดินมีความต้านทานสูง กระแสอาจไม่พอให้เบรกเกอร์ตัด โครงจะมีไฟค้าง'}
    else{const Ib=hu?230/(Rb+Rsrc)*1000:0;rows=[['แรงดันที่โครง','≈ 230 V (ไม่มีทางให้กระแสไหลลงดิน)'],['กระแสผ่านร่างกาย',hu?b0f(Ib,0)+' mA':'—'],['ผล',hu?(rcd?'RCD ตัดหลังมีกระแสผ่านคน (ยังโดนดูดชั่วขณะ)':'อันตรายถึงชีวิต: ไม่มีอะไรตัดวงจร'):'โครงมีไฟค้างรอคนมาจับ']];lvl=hu&&!rcd?'err':'warn';t=hu&&!rcd?'อันตรายมาก: ไม่มีสายดินและไม่มี RCD':'ไม่มีสายดิน: แม้มี RCD ก็ต้องให้กระแสผ่านคนก่อนจึงตัด'}}
   {const danger=fa&&!pe&&hu,trip=fa&&rcd,cur=fa&&pe;el.querySelector('#b9s').innerHTML=`<svg viewBox="0 0 520 150" class="b0ill" role="img" aria-label="ไฟรั่วลงโครงเครื่อง สายดิน และคนสัมผัส">
     <path d="M20 30H120" stroke="#8b5a2b" stroke-width="3"/><text x="20" y="22" class="b0ax">L 230 V</text>
     <rect x="120" y="16" width="34" height="28" rx="4" fill="${rcd?'#fff':'var(--band)'}" stroke="var(--ink)" stroke-width="1.6"/><text x="137" y="34" text-anchor="middle" class="b0ax">${rcd?(trip?'ตัด':'RCD'):'—'}</text>
     <path d="M154 30H210" stroke="${trip?'var(--muted)':'#8b5a2b'}" stroke-width="3" ${trip?'stroke-dasharray="4 4"':''}/>
     <rect x="210" y="14" width="110" height="80" rx="8" fill="#e8ecef" stroke="${fa&&!trip?'#e53935':'var(--ink)'}" stroke-width="${fa&&!trip?3:2}"/><text x="265" y="58" text-anchor="middle" class="b0lab">เครื่องใช้ไฟฟ้า</text>
     ${fa?B0G.bolt(228,22,22,trip?'#cfd8dc':'#ffc400'):''}
     ${pe?`<path d="M240 94V128" stroke="#1a9c6e" stroke-width="3" ${cur?'stroke-dasharray="6 4"':''}/>${B0G.gnd(240,126,20)}<text x="252" y="116" class="b0ax">PE ${rg} Ω</text>`:`<text x="222" y="116" class="b0ax">ไม่มีสายดิน</text>`}
     ${hu?`<path d="M320 52H352" stroke="${danger?'#e53935':'var(--muted)'}" stroke-width="2.5"/>${B0G.person(372,40,70,danger?'#e53935':'#55626e')}${danger?B0G.bolt(392,36,22,'#ff7043'):''}`:''}
     <text x="440" y="74" class="b0lab" fill="${!fa?'var(--muted)':danger?'#e53935':trip||cur?'var(--ok)':'var(--warn)'}">${!fa?'ปกติ':danger?'อันตราย!':trip?'ปลอดภัย':'ระวัง'}</text></svg>`}
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
  el.innerHTML=`${b0Rng('b15g','แสงตรงตั้งฉากกับดวงอาทิตย์ (W/m²)',200,1100,50,950)}${b0Rng('b15e','มุมสูงดวงอาทิตย์ (องศาจากขอบฟ้า)',10,90,1,70,'°')}${b0Rng('b15tl','มุมเอียงแผง (หันเข้าหาดวงอาทิตย์)',0,60,1,15,'°')}${b0Rng('b15ta','อุณหภูมิอากาศ (°C)',15,42,1,33,' °C')}${b0Rng('b15d','ฝุ่นบังแสง (%)',0,30,1,0,' %')}<div id="b15s"></div><div id="b15o"></div>`;
  const run=()=>{const Gn=b0V('b15g'),el2=b0V('b15e'),tl=b0V('b15tl'),ta=b0V('b15ta'),du=b0V('b15d');
   const inc=Math.abs(90-el2-tl),cosi=Math.max(0,Math.cos(inc*Math.PI/180)),G=Gn*cosi*(1-du/100),tc=ta+(B0P.noct-20)/800*G;
   const c=b0Curve(G,tc),fx=B0P.P*G/1000*(1+B0P.gP/100*(tc-25));
   {const ox=150,oy=150,R=120,ea=el2*Math.PI/180,sx=ox-R*Math.cos(ea),sy=oy-R*Math.sin(ea),ta2=tl*Math.PI/180,L=70,px=ox+L/2*Math.cos(ta2),py=oy-8-L/2*Math.sin(ta2),qx=ox-L/2*Math.cos(ta2),qy=oy-8+L/2*Math.sin(ta2);
    const mx=(px+qx)/2,my=(py+qy)/2,nx=-Math.sin(ta2),ny=-Math.cos(ta2);
    el.querySelector('#b15s').innerHTML=`<svg viewBox="0 0 520 170" class="b0ill" role="img" aria-label="ดวงอาทิตย์ มุมเอียงแผง และอุณหภูมิ">
     <path d="M10 ${oy}H330" stroke="#7d8a96" stroke-width="2"/><path d="M${ox+R} ${oy}A${R} ${R} 0 0 0 ${ox-R} ${oy}" fill="none" stroke="#c9a227" stroke-width="1.2" stroke-dasharray="4 4"/>
     <line x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${mx.toFixed(1)}" y2="${my.toFixed(1)}" stroke="#f7a823" stroke-width="3" stroke-dasharray="8 6" opacity="${(0.3+0.7*cosi).toFixed(2)}"/>
     <line x1="${mx.toFixed(1)}" y1="${my.toFixed(1)}" x2="${(mx+nx*34).toFixed(1)}" y2="${(my+ny*34).toFixed(1)}" stroke="var(--muted)" stroke-width="1.2" stroke-dasharray="3 3"/>
     <line x1="${qx.toFixed(1)}" y1="${qy.toFixed(1)}" x2="${px.toFixed(1)}" y2="${py.toFixed(1)}" stroke="#1d4b78" stroke-width="9" stroke-linecap="round"/>
     ${B0G.dust(qx<px?qx:px,Math.min(py,qy)-6,Math.abs(px-qx),Math.abs(py-qy)+8,Math.round(du/2))}
     <path d="M${ox} ${oy}V${oy-8}" stroke="#55626e" stroke-width="3"/>${B0G.sun(sx,sy,15,Gn/1100)}
     <text x="${(mx+nx*38).toFixed(1)}" y="${(my+ny*38).toFixed(1)}" class="b0ax" text-anchor="middle">ตั้งฉาก</text><text x="${ox-60}" y="${oy+16}" class="b0ax">มุมตกกระทบ ${b0f(inc,0)}°</text>
     ${B0G.thermo(380,20,110,(ta-10)/40)}<text x="380" y="160" text-anchor="middle" class="b0ax">อากาศ ${ta} °C</text>
     ${B0G.thermo(460,20,110,(tc-10)/70)}<text x="460" y="160" text-anchor="middle" class="b0ax">เซลล์ ${b0f(tc,0)} °C</text></svg>`}
   el.querySelector('#b15o').innerHTML=b0Kv([['มุมตกกระทบ',b0f(inc,0)+'° (cos = '+b0f(cosi,2)+')'],['แสงที่ตกบนแผง',b0f(G,0)+' W/m²'],['อุณหภูมิเซลล์โดยประมาณ',b0f(tc,1)+' °C'],['กำลัง (จากเส้น I-V)',b0f(c.mp.P,0)+' W','ok'],['กำลัง (สูตร P × G/1000 × (1 + γ(Tc − 25)))',b0f(fx,0)+' W'],['เทียบกับป้าย 550 W',b0f(c.mp.P/550*100,0)+' %']])+`<p class="hint tight">ลองหาว่ามุมเอียงเท่าใดทำให้มุมตกกระทบเป็น 0° (แสงตั้งฉาก) และอากาศร้อนขึ้น 10 °C กำลังหายไปกี่วัตต์</p>`};
  b0Bind(el,['b15g','b15e','b15tl','b15ta','b15d'],run,['','°','°',' °C',' %']);
 },
 q:[{q:'แผง γ = −0.35 %/°C ทำงานที่อุณหภูมิเซลล์ 65 °C กำลังลดลงจากค่า STC ราวเท่าใด',o:['ราว 3.5%','ราว 14%','ราว 35%','ไม่ลดลง'],a:1,ex:'(65 − 25) × 0.35% = 14%'},
  {q:'แผงผลิตไฟได้มากที่สุดเมื่อแสงตกกระทบแผงในลักษณะใด',o:['ขนานกับผิวแผง','ตั้งฉากกับผิวแผง (มุมตกกระทบ 0°)','เอียง 45° กับผิวแผงเสมอ','ไม่ขึ้นกับมุม'],a:1,ex:'แสงที่ตกบนแผงแปรตาม cos(มุมตกกระทบ)'},
  {q:'บ้านในประเทศไทย หลังคาทิศใต้ มุมเอียงแผงที่นิยมเพื่อพลังงานทั้งปีคือ',o:['ราว 10–15°','ราว 45°','ราว 70°','วางราบ 0° ดีที่สุดเสมอ'],a:0,ex:'ใกล้ค่าละติจูดและยังพอให้ฝนชะล้างฝุ่นได้'}]}
];

/* ---- state ----
   B0.ans[id][i] = คำตอบที่ "ส่ง" แล้ว (ไม่ใช่ตัวที่กำลังเลือก) · B0.tries[id] = จำนวนครั้งที่ส่ง
   ข้อที่ส่งถูกแล้วล็อกไว้ ข้อที่ผิดเลือกใหม่ได้หลังเวลารอ (นานขึ้นทุกครั้งที่ส่งผิด) กันการกดสุ่ม */
B0.tries={};
const B0D={},B0CD={};/* draft selections and cooldown end time (this browser session only) */
function b0Done(t){const a=B0.ans[t.id]||{};return t.q.every((q,i)=>a[i]===q.a)&&(!t.task||!!B0.task[t.id])}
function b0QOk(t){const a=B0.ans[t.id]||{};return t.q.every((q,i)=>a[i]===q.a)}
function b0Count(){return B0T.filter(b0Done).length}
function b0Missing(){return B0T.map((t,i)=>b0Done(t)?null:String(i+1).padStart(2,'0')).filter(Boolean)}
function b0Save(){b0Status();if(typeof touch==='function')touch()}
function b0Restore(o){if(!o||typeof o!=='object')return;B0.ans={};B0.task={};B0.tries={};
  B0T.forEach(t=>{const a=o.ans&&o.ans[t.id];if(a&&typeof a==='object'){B0.ans[t.id]={};Object.keys(a).forEach(k=>{const v=a[k];if(Number.isInteger(v)&&t.q[+k]&&v>=0&&v<t.q[+k].o.length)B0.ans[t.id][k]=v})}
   if(o.task&&o.task[t.id]===true)B0.task[t.id]=true;
   const n=o.tries&&o.tries[t.id];if(Number.isInteger(n)&&n>0)B0.tries[t.id]=Math.min(n,999)});
  if(document.getElementById('b0list'))b0RenderAll()}

/* ---- icons (แทนเลขหัวข้อ) ---- */
const B0IC=(()=>{const P='var(--cell)',A='var(--accent)',I='currentColor',R='var(--pos)',K='var(--neg)';
  const pv=(x,y,w,h)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" fill="${P}"/><path d="M${x+w/3} ${y}V${y+h}M${x+2*w/3} ${y}V${y+h}M${x} ${y+h/2}H${x+w}" stroke="#fff" stroke-width=".8" opacity=".7"/>`;
  const meter=t=>`<rect x="11" y="5" width="18" height="30" rx="3" fill="#e9b52a" stroke="${I}" stroke-width="1.4"/><rect x="14" y="8" width="12" height="7" rx="1" fill="#cfe8d4" stroke="${I}" stroke-width=".8"/><text x="20" y="13.8" font-size="5" text-anchor="middle" font-family="monospace" fill="#1d3a26">${t}</text><circle cx="20" cy="24" r="5" fill="#333" stroke="#111"/><path d="M20 24l3-3" stroke="#fff" stroke-width="1.2"/><circle cx="15" cy="32" r="1.3" fill="${R}"/><circle cx="25" cy="32" r="1.3" fill="${K}"/>`;
  return{
  t1:`${B0G.sun(29,10,5.5,1)}<g transform="skewX(-12)">${pv(10,18,22,15)}</g>`,
  t2:`<rect x="3" y="15" width="6" height="8" rx="1" fill="${P}"/><path d="M10 19h3" stroke="${I}" stroke-width="1.2"/>${pv(14,12,8,14)}<path d="M23 19h2" stroke="${I}" stroke-width="1.2"/>${pv(26,10,11,18)}<text x="6" y="30" font-size="4.5" text-anchor="middle" fill="${I}">cell</text>`,
  t3:meter('Voc'),t4:meter('Vmp'),
  t5:`<rect x="8" y="6" width="24" height="28" rx="3" fill="var(--invfill)" stroke="${I}" stroke-width="1.4"/><text x="14" y="17" font-size="7" fill="${R}" font-weight="700">=</text><path d="M18 26c2-5 4-5 6 0s4 5 6 0" fill="none" stroke="var(--s1)" stroke-width="1.6"/><path d="M8 34l24-28" stroke="${I}" stroke-width=".8" opacity=".5"/>`,
  t6:`<rect x="6" y="8" width="28" height="24" rx="3" fill="#2b3138"/><rect x="10" y="11" width="20" height="8" rx="1" fill="#3a8be0"/><text x="20" y="17.3" font-size="5" text-anchor="middle" fill="#fff" font-family="monospace">MPPT</text><g fill="#c8ccd0"><rect x="9" y="24" width="4" height="5"/><rect x="15" y="24" width="4" height="5"/><rect x="21" y="24" width="4" height="5"/><rect x="27" y="24" width="4" height="5"/></g>`,
  t7:`<rect x="7" y="11" width="26" height="21" rx="2" fill="#2b3138"/><rect x="11" y="7" width="5" height="4" fill="${R}"/><rect x="24" y="7" width="5" height="4" fill="#666"/><path d="M12 22h5M14.5 19.5v5M23 22h5" stroke="#fff" stroke-width="1.6"/>`,
  t8:`<rect x="8" y="5" width="24" height="30" rx="2" fill="#d7dde2" stroke="${I}" stroke-width="1.2"/><path d="M20 11l7 13H13z" fill="#f2c200" stroke="#222" stroke-width="1"/><path d="M20 15v5" stroke="#222" stroke-width="1.6"/><circle cx="20" cy="22" r=".9" fill="#222"/><path d="M12 29h16" stroke="${I}" stroke-width="1.5"/>`,
  t9:`<path d="M20 5v14" stroke="var(--ok)" stroke-width="2.4"/><path d="M9 19h22M13 25h14M17 31h6" stroke="var(--ok)" stroke-width="2.6" stroke-linecap="round"/>`,
  t10:`<path d="M10 4h15l6 6v26H10z" fill="#fff" stroke="${I}" stroke-width="1.3"/><path d="M25 4v6h6" fill="none" stroke="${I}" stroke-width="1.1"/><text x="19" y="15" font-size="5" text-anchor="middle" font-weight="700" fill="#222">DATA</text><path d="M13 20h14M13 24h14M13 28h10M13 32h12" stroke="#888" stroke-width="1.1"/>`,
  t11:`<rect x="5" y="5" width="30" height="30" rx="2" fill="#fff" stroke="${I}" stroke-width="1.2"/><path d="M10 12h6v8h8v-8h6M20 20v8M15 28h10" fill="none" stroke="var(--s1)" stroke-width="1.4"/><rect x="18" y="14" width="4" height="4" fill="none" stroke="${R}" stroke-width="1.1"/><circle cx="10" cy="12" r="1.5" fill="${R}"/><circle cx="30" cy="12" r="1.5" fill="${R}"/>`,
  t12:`<rect x="6" y="14" width="13" height="22" rx="2" fill="#e9b52a" stroke="${I}" stroke-width="1.1"/><rect x="8.5" y="17" width="8" height="5" fill="#cfe8d4"/><circle cx="12.5" cy="28" r="3" fill="#333"/><path d="M23 30V16a8 8 0 1 1 10 0v4" fill="none" stroke="#c0392b" stroke-width="3" stroke-linecap="round"/><rect x="21" y="26" width="8" height="10" rx="2" fill="#333"/>`,
  t13:`<path d="M6 5v29h29" fill="none" stroke="${I}" stroke-width="1.4"/><path d="M6 11h17c5 0 7 6 9 23" fill="none" stroke="var(--s1)" stroke-width="2"/><path d="M6 34L24 13c3-2 5 4 7 21" fill="none" stroke="var(--s2)" stroke-width="1.4" stroke-dasharray="2 1.5"/><circle cx="25" cy="13" r="2" fill="${A}"/><text x="24" y="9" font-size="5" fill="${I}">I-V</text>`,
  t14:`${pv(4,6,9,12)}${pv(16,6,9,12)}${pv(4,22,9,12)}${pv(16,22,9,12)}<path d="M13 12h3" stroke="${R}" stroke-width="1.6"/><path d="M28 12h6v16h-6M28 28h-3" fill="none" stroke="${R}" stroke-width="1.3"/><path d="M8.5 18v4" stroke="${K}" stroke-width="1.3"/>`,
  t15:`${B0G.sun(10,10,5,1)}${B0G.thermo(33,3,24,.7)}<path d="M6 34L26 24" stroke="${P}" stroke-width="5"/><path d="M14 31v4M22 27v8" stroke="${I}" stroke-width="1.3"/>`}})();
const b0Icon=(t,i)=>`<span class="b0ic" aria-hidden="true"><svg viewBox="0 0 40 40">${B0IC[t.id]||''}</svg><em>${String(i+1).padStart(2,'0')}</em></span>`;

/* ---- quiz ---- */
function b0Wait(t){const n=B0CD[t.id]||0;return Math.max(0,Math.ceil((n-Date.now())/1000))}
function b0QuizHtml(t){
  const a=B0.ans[t.id]||{},d=B0D[t.id]||{},all=b0QOk(t),tries=B0.tries[t.id]||0;
  const open=t.q.map((q,i)=>a[i]!==q.a),need=open.filter(Boolean).length,picked=t.q.filter((q,i)=>open[i]&&d[i]!=null).length,wait=b0Wait(t);
  const qs=t.q.map((q,i)=>{
    const lock=!open[i],tried=a[i]!=null&&!lock?a[i]:null;
    return`<fieldset class="b0q ${lock?'lock':tried!=null?'miss':''}" data-q="${i}"><legend>${i+1}. ${esc(q.q)}${lock?' <span class="b0mk ok">✓</span>':tried!=null?' <span class="b0mk err">✗</span>':''}</legend>
     ${q.o.map((o,k)=>`<label class="b0o ${lock&&k===q.a?'ok':''} ${tried===k?'tried':''}"><input type="radio" name="b0_${t.id}_${i}" value="${k}" ${(lock?k===q.a:d[i]===k)?'checked':''} ${lock?'disabled':''}> ${esc(o)}</label>`).join('')}
     ${lock?`<p class="b0ex ok">ถูกต้อง · ${esc(q.ex)}</p>`:tried!=null?`<p class="b0ex err">ข้อนี้ยังไม่ถูก (ตัวเลือกที่ขีดฆ่าคือคำตอบที่ส่งไปแล้ว) ทบทวนสรุปหรือแบบจำลองด้านบน แล้วเลือกใหม่</p>`:''}</fieldset>`}).join('');
  const foot=all?`<div class="b0sub done"><b>✓ ถูกทุกข้อ</b><span class="hint tight">ส่ง ${tries} ครั้ง</span></div>`
   :`<div class="b0sub"><button class="btn pri b0go" type="button" ${picked<need||wait?'disabled':''}>${wait?`รอ ${wait} วินาทีก่อนส่งใหม่`:'ส่งคำตอบ'}</button><span class="hint tight">${picked<need?`เลือกให้ครบก่อน: เลือกแล้ว ${picked} / ${need} ข้อ`:'เลือกครบแล้ว กดส่งเพื่อตรวจ'}${tries?` · ส่งแล้ว ${tries} ครั้ง`:''}</span></div>`;
  return`<h3>คำถาม</h3><p class="hint tight">เลือกคำตอบให้ครบทุกข้อแล้วกด "ส่งคำตอบ" ระบบจึงตรวจ ข้อที่ถูกจะล็อกไว้ ข้อที่ผิดเลือกใหม่ได้หลังเวลารอ (ส่งผิดบ่อยต้องรอนานขึ้น)</p>${qs}${foot}`;
}
function b0QuizMount(d,t){
  const z=d.querySelector('.b0qz');z.innerHTML=b0QuizHtml(t);
  const w=b0Wait(t);if(w){clearTimeout(z._tm);z._tm=setTimeout(()=>b0QuizMount(d,t),1000)}
}
function b0QuizBind(d,t){
  const z=d.querySelector('.b0qz');
  z.addEventListener('change',e=>{const r=e.target;if(r.type!=='radio'||r.disabled)return;const i=+r.closest('.b0q').dataset.q;(B0D[t.id]=B0D[t.id]||{})[i]=+r.value;b0QuizMount(d,t)});
  z.addEventListener('click',e=>{const b=e.target.closest('.b0go');if(!b||b.disabled)return;
    const a=B0.ans[t.id]=B0.ans[t.id]||{},dr=B0D[t.id]||{};let wrong=0;
    t.q.forEach((q,i)=>{if(a[i]===q.a)return;if(dr[i]!=null)a[i]=dr[i];if(a[i]!==q.a)wrong++});
    B0.tries[t.id]=(B0.tries[t.id]||0)+1;B0D[t.id]={};
    if(wrong){const fails=t.q.length&&(B0.tries[t.id]-(b0QOk(t)?1:0));B0CD[t.id]=Date.now()+Math.min(60,10*Math.max(1,fails))*1000}
    b0QuizMount(d,t);b0Save();
    const f=z.querySelector('.b0q.miss')||z.querySelector('.b0sub');if(f)f.scrollIntoView({block:'nearest',behavior:'smooth'})});
}
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
  L.innerHTML=B0T.map((t,i)=>`<details class="b0t" data-id="${t.id}" ${open.has(t.id)?'open':''}><summary>${b0Icon(t,i)}<span class="b0tt"><b>${esc(t.title)}</b><small>${esc(t.desc)}</small></span><span class="b0bdw">${b0Badge(t)}</span></summary>
    <div class="b0body"><div class="b0intro">${t.intro}</div>${t.w?`<div class="b0w panelbox"><h3>แบบจำลอง${t.task?' · ภารกิจ: '+esc(t.task):''}</h3><div class="b0wi"></div></div>`:''}<div class="b0qz"></div></div></details>`).join('');
  L.querySelectorAll('details.b0t').forEach(d=>{const t=B0T.find(x=>x.id===d.dataset.id);
    const mount=()=>{const w=d.querySelector('.b0wi');if(w&&!w.dataset.on&&t.w){w.dataset.on='1';try{t.w(w)}catch(e){w.textContent='แบบจำลองนี้แสดงไม่ได้ในเบราว์เซอร์นี้'}}};
    d.addEventListener('toggle',()=>{if(d.open)mount()});if(d.open)mount();
    b0QuizMount(d,t);b0QuizBind(d,t)});
  b0Status();
}
function initBasics(){
  b0RenderAll();
  const ex=document.getElementById('b0exp'),co=document.getElementById('b0col'),rs=document.getElementById('b0reset');
  if(ex)ex.addEventListener('click',()=>document.querySelectorAll('#b0list details').forEach(d=>d.open=true));
  if(co)co.addEventListener('click',()=>document.querySelectorAll('#b0list details').forEach(d=>d.open=false));
  if(rs){let arm=0;rs.addEventListener('click',()=>{if(!arm){arm=setTimeout(()=>{arm=0;rs.textContent='ล้างคำตอบแบบฝึก 00'},3000);rs.textContent='กดอีกครั้งเพื่อยืนยัน';return}
    clearTimeout(arm);arm=0;rs.textContent='ล้างคำตอบแบบฝึก 00';B0.ans={};B0.task={};B0.tries={};Object.keys(B0D).forEach(k=>delete B0D[k]);Object.keys(B0CD).forEach(k=>delete B0CD[k]);b0RenderAll();b0Save()})}
}
