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
  const W=o.W||520,H=o.H||260,L=46,R=o.y2?46:14,T=14,B=36,pw=W-L-R,ph=H-T-B;
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

/* in-scene SVG sliders + chips: defs [{k,lab,min,max,step,v,fmt,ic,x,y,w}] · chips [{k,opts:[[val,label]],v,x,y,lab}] */
function b0SvgCtl(svg,g,defs,chips,onChange){
  const pt=e=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(svg.getScreenCTM().inverse());return[q.x,q.y]};
  const draw=()=>{g.innerHTML=defs.map(d=>{
    if(d.vt){const ky=d.y+d.h-(d.v-d.min)/(d.max-d.min)*d.h,c=d.col||'var(--accent)';
     return`<g class="b0sl" data-k="${d.k}" tabindex="0" role="slider" aria-orientation="vertical" aria-label="${esc(d.lab)}" aria-valuemin="${d.min}" aria-valuemax="${d.max}" aria-valuenow="${d.v}"><rect x="${d.x-38}" y="${d.y-50}" width="76" height="${d.h+84}" rx="10" fill="var(--surface)" stroke="var(--line)"/>
      ${d.ic?`<g transform="translate(${d.x-12} ${d.y-46})">${d.ic}</g>`:''}<text x="${d.x}" y="${d.y-12}" font-size="11" font-weight="600" text-anchor="middle" fill="var(--ink)">${esc(d.lab)}</text>
      <rect x="${d.x-3}" y="${d.y}" width="6" height="${d.h}" rx="3" fill="var(--band)"/><rect x="${d.x-3}" y="${ky.toFixed(1)}" width="6" height="${(d.y+d.h-ky).toFixed(1)}" rx="3" fill="${c}"/>
      <path d="M${d.x+10} ${d.y}h5M${d.x+10} ${d.y+d.h/2}h5M${d.x+10} ${d.y+d.h}h5" stroke="var(--line)" stroke-width="1.5"/>
      <rect x="${d.x-24}" y="${d.y-10}" width="48" height="${d.h+20}" fill="transparent"/><circle cx="${d.x}" cy="${ky.toFixed(1)}" r="10" fill="#fff" stroke="${c}" stroke-width="3"/>
      <text x="${d.x}" y="${d.y+d.h+25}" font-size="12" font-weight="700" text-anchor="middle" font-family="monospace" fill="var(--ink)">${esc(d.fmt?d.fmt(d.v):d.v)}</text></g>`}
    const kx=d.x+(d.v-d.min)/(d.max-d.min)*d.w;
    return`<g class="b0sl" data-k="${d.k}" tabindex="0" role="slider" aria-label="${esc(d.lab)}" aria-valuenow="${d.v}"><rect x="${d.x-38}" y="${d.y-30}" width="${d.w+56}" height="52" rx="10" fill="var(--surface)" stroke="var(--line)"/>
     ${d.ic?`<g transform="translate(${d.x-32} ${d.y-23}) scale(1.05)">${d.ic}</g>`:''}<text x="${d.x-4}" y="${d.y-12}" font-size="12" font-weight="600" fill="var(--ink)">${esc(d.lab)}</text><text x="${d.x+d.w+12}" y="${d.y-12}" font-size="12" font-weight="700" text-anchor="end" font-family="monospace" fill="var(--ink)">${esc(d.fmt?d.fmt(d.v):d.v)}</text>
     <rect x="${d.x}" y="${d.y+2}" width="${d.w}" height="6" rx="3" fill="var(--band)"/><rect x="${d.x}" y="${d.y+2}" width="${Math.max(0,kx-d.x).toFixed(1)}" height="6" rx="3" fill="${d.col||'var(--accent)'}"/>
     <rect x="${d.x-8}" y="${d.y-10}" width="${d.w+16}" height="30" fill="transparent"/><circle cx="${kx.toFixed(1)}" cy="${d.y+5}" r="10" fill="#fff" stroke="${d.col||'var(--accent)'}" stroke-width="3"/></g>`}).join('')+
    (chips||[]).map(c=>`<g><text x="${c.x}" y="${c.y-8}" font-size="12" font-weight="600" fill="var(--ink)">${esc(c.lab)}</text>${c.opts.map((o,i)=>{const w=c.w||86,x=c.x+i*(w+6),on=String(o[0])===String(c.v);return`<g class="b0chp" data-c="${c.k}" data-v="${o[0]}" role="button" tabindex="0" aria-pressed="${on}"><rect x="${x}" y="${c.y}" width="${w}" height="30" rx="15" fill="${on?'var(--accentbg)':'var(--surface)'}" stroke="${on?'var(--accent)':'var(--line)'}" stroke-width="${on?2:1}"/><text x="${x+w/2}" y="${c.y+19.5}" text-anchor="middle" font-size="12" font-weight="${on?700:500}" fill="var(--ink)">${esc(o[1])}</text></g>`}).join('')}</g>`).join('')};
  const set=(d,p)=>{let v=d.min+(d.vt?(d.y+d.h-p[1])/d.h:(p[0]-d.x)/d.w)*(d.max-d.min);v=Math.round(v/d.step)*d.step;v=+Math.max(d.min,Math.min(d.max,v)).toFixed(4);if(v!==d.v){d.v=v;draw();onChange(d.k,v)}};
  let drag=null;
  g.addEventListener('pointerdown',e=>{const c=e.target.closest('.b0chp');if(c){const ch=chips.find(x=>x.k===c.dataset.c);ch.v=isNaN(+c.dataset.v)?c.dataset.v:+c.dataset.v;draw();onChange(ch.k,ch.v);return}
    const s=e.target.closest('.b0sl');if(!s)return;e.preventDefault();e.stopPropagation();drag=defs.find(d=>d.k===s.dataset.k);try{svg.setPointerCapture(e.pointerId)}catch(_){}set(drag,pt(e))});
  svg.addEventListener('pointermove',e=>{if(drag)set(drag,pt(e))});
  const up=()=>{drag=null};svg.addEventListener('pointerup',up);svg.addEventListener('pointercancel',up);
  g.addEventListener('keydown',e=>{const s=e.target.closest('.b0sl'),c=e.target.closest('.b0chp');
    if(c&&(e.key==='Enter'||e.key===' ')){e.preventDefault();const ch=chips.find(x=>x.k===c.dataset.c);ch.v=isNaN(+c.dataset.v)?c.dataset.v:+c.dataset.v;draw();onChange(ch.k,ch.v);const n=g.querySelector(`.b0chp[data-c="${ch.k}"][data-v="${c.dataset.v}"]`);if(n)n.focus();return}
    if(!s)return;const d=defs.find(x=>x.k===s.dataset.k),dir=e.key==='ArrowRight'||e.key==='ArrowUp'?1:e.key==='ArrowLeft'||e.key==='ArrowDown'?-1:0;if(!dir)return;e.preventDefault();
    d.v=+Math.max(d.min,Math.min(d.max,d.v+dir*d.step)).toFixed(4);draw();onChange(d.k,d.v);const n=g.querySelector(`.b0sl[data-k="${d.k}"]`);if(n)n.focus()});
  draw();return{draw,get:k=>(defs.find(d=>d.k===k)||chips.find(c=>c.k===k)).v,set:(k,v)=>{const d=defs.find(x=>x.k===k)||chips.find(c=>c.k===k);d.v=v;draw()}};
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
  el.innerHTML=`<div class="b0fig"><svg id="b1svg" viewBox="0 0 640 222" class="b0ill" role="img" aria-label="แสงตกกระทบเซลล์ อิเล็กตรอนไหลผ่านหลอดไฟ พร้อมแถบปรับแสงและอุณหภูมิ" overflow="visible">
   <g id="b1sun">${B0G.sun(130,54,19,1)}</g><g id="b1ray" stroke="#f7a823" stroke-width="3" stroke-linecap="round" stroke-dasharray="7 6"><line x1="150" y1="66" x2="214" y2="98"/><line x1="144" y1="78" x2="196" y2="106"/><line x1="156" y1="52" x2="236" y2="98"/></g>
   <rect x="190" y="98" width="190" height="22" fill="var(--s1)" opacity=".85"/><text x="285" y="113" text-anchor="middle" class="b0lab" fill="#fff">ชนิด N (−)</text>
   <rect x="190" y="120" width="190" height="40" fill="var(--s2)" opacity=".75"/><text x="285" y="145" text-anchor="middle" class="b0lab" fill="#fff">ชนิด P (+)</text>
   <path d="M380 108 H450 V70 H494" fill="none" stroke="var(--neg)" stroke-width="2.5"/><path d="M380 148 H450 V180 H532 V94 H510" fill="none" stroke="var(--pos)" stroke-width="2.5"/>
   <g id="b1bw">${B0G.bulb(502,74,17,.8)}</g><text x="502" y="130" text-anchor="middle" class="b0ax">หลอด DC</text>
   <g id="b1th">${B0G.thermo(352,38,52,.3)}</g><text x="352" y="32" text-anchor="middle" class="b0ax" id="b1tt"></text>
   <text x="402" y="100" class="b0ax">e⁻ →</text><g id="b1ctl"></g></svg></div>
   <p class="hint tight">ลากปุ่มกลมบนแถบขึ้น-ลงในภาพ เพื่อปรับความเข้มแสงและอุณหภูมิเซลล์</p><div id="b1o"></div>`;
  const S={g:1000,t:25},$q=x=>el.querySelector(x);
  const draw=()=>{const c=b0Curve(S.g,S.t),g=S.g,t=S.t;
   $q('#b1o').innerHTML=b0Kv([['กระแสลัดวงจร Isc',b0f(c.isc,2)+' A'],['แรงดันวงจรเปิด Voc',b0f(c.voc,1)+' V'],['กำลังสูงสุด',b0f(c.mp.P,0)+' W'],['ชนิดไฟ','DC (มีขั้ว + / −)']]);
   $q('#b1bw').innerHTML=B0G.bulb(502,74,17,Math.min(1,c.mp.P/550));$q('#b1sun').innerHTML=B0G.sun(130,54,19,g/1200);
   $q('#b1ray').setAttribute('opacity',(g/1200).toFixed(2));$q('#b1th').innerHTML=B0G.thermo(352,38,52,t/80);$q('#b1tt').textContent=t+' °C'};
  b0SvgCtl($q('#b1svg'),$q('#b1ctl'),[
    {k:'g',lab:'ความเข้มแสง',min:0,max:1200,step:50,v:S.g,fmt:v=>v+' W/m²',ic:B0G.sun(12,12,6.5,1),vt:1,x:42,y:62,h:124,col:'#f7a823'},
    {k:'t',lab:'อุณหภูมิเซลล์',min:10,max:75,step:1,v:S.t,fmt:v=>v+' °C',ic:B0G.thermo(12,1,19,.55),vt:1,x:596,y:62,h:124,col:'#e53935'}],
   [],(k,v)=>{S[k]=v;draw()});
  draw();
 },
 q:[{q:'แผงโซลาร์เซลล์ผลิตไฟฟ้าชนิดใด',o:['ไฟฟ้ากระแสสลับ (AC) 230 V','ไฟฟ้ากระแสตรง (DC)','ไฟฟ้าสถิต','ไฟฟ้า 3 เฟส'],a:1,ex:'เซลล์ให้ไฟ DC ต้องใช้อินเวอร์เตอร์แปลงเป็น AC ก่อนใช้กับเครื่องใช้ไฟฟ้าในบ้าน'},
  {q:'ถ้าแสงลดลงเหลือครึ่งหนึ่ง (อุณหภูมิคงที่) ค่าใดลดลงเกือบครึ่งตาม',o:['แรงดันวงจรเปิด Voc','กระแส','ความถี่','ไม่มีค่าใดเปลี่ยน'],a:1,ex:'กระแสแปรผันตรงกับความเข้มแสง ส่วนแรงดันลดลงเพียงเล็กน้อย ลองเลื่อนแถบความเข้มแสงดู'},
  {q:'ปรากฏการณ์ที่ทำให้เซลล์แสงอาทิตย์ผลิตไฟฟ้าได้เรียกว่าอะไร',o:['ปรากฏการณ์เรือนกระจก','ปรากฏการณ์โฟโตโวลตาอิก','การเหนี่ยวนำแม่เหล็กไฟฟ้า','เทอร์โมอิเล็กทริก'],a:1,ex:'Photovoltaic effect: แสงให้พลังงานแก่อิเล็กตรอนในสารกึ่งตัวนำจนเกิดแรงดันที่รอยต่อ P-N'}]},

{id:'t2',title:'เซลล์ - โมดูล - สตริง - อาร์เรย์ คืออะไร?',desc:'โครงสร้างตั้งแต่หน่วยย่อยจนถึงระบบใหญ่',
 intro:`<ul><li><b>เซลล์ (Cell)</b> หน่วยเล็กสุด แรงดันวงจรเปิดราว 0.6–0.7 V ต่อเซลล์</li><li><b>โมดูล / แผง (Module)</b> เซลล์หลายสิบเซลล์ต่ออนุกรมในกรอบเดียว เช่น 60, 72 เซลล์ หรือแบบครึ่งเซลล์ 120 / 144 (ต่ออนุกรมจริง 60 / 72 ชุด)</li>
 <li><b>สตริง (String)</b> แผงหลายแผงต่ออนุกรม แรงดันรวมกัน กระแสเท่าแผงเดียว</li><li><b>อาร์เรย์ (Array)</b> หลายสตริงต่อขนานกัน กระแสรวมกัน กำลังรวมทั้งระบบ</li></ul>`,
 w(el){
  el.innerHTML=`${b0Sel('b2c','ชนิดแผง',[['60','60 เซลล์'],['72','72 เซลล์'],['120','ครึ่งเซลล์ 120'],['144','ครึ่งเซลล์ 144']],'144')}
   <div class="b0fig"><svg id="b2svg" viewBox="0 0 640 222" class="b0ill" role="img" aria-label="แผงต่ออนุกรมเป็นสตริง หลายสตริงต่อขนานเป็นอาร์เรย์ พร้อมแถบปรับจำนวน"><g id="b2arr"></g><g id="b2ctl"></g></svg></div>
   <p class="hint tight">ลากแถบขึ้น-ลงในภาพ · แต่ละแถว = 1 สตริง (แผงต่ออนุกรม เส้นแดงเชื่อม + ของแผงหนึ่งไป − ของแผงถัดไป) · ปลายสตริงทุกแถวต่อขนานเข้าบัส + และ − เป็น 1 อาร์เรย์</p><div id="b2o"></div>`;
  const S={n:8,s:2},$q=x=>el.querySelector(x);
  const scene=(n,st)=>{const X0=118,X1=512,g=n>10?7:12,pw=Math.min(40,(X1-X0-(n-1)*g)/n),ph=28,tot=n*pw+(n-1)*g,x0=(X0+X1-tot)/2,dy=46,y0=114-st*dy/2+12,BN=100,BP=530;
   let w='',p='',lab='';
   for(let r=0;r<st;r++){const y=y0+r*dy,cy=y+ph/2;lab+=`<text x="${x0}" y="${y-5}" class="b0ax">สตริง ${r+1}</text>`;
    for(let k=0;k<n;k++){const x=x0+k*(pw+g);p+=B0G.panel(x,y,pw,ph);if(k<n-1)w+=`<path d="M${(x+pw-1).toFixed(1)} ${cy}H${(x+pw+g+1).toFixed(1)}" stroke="var(--pos)" stroke-width="3" stroke-linecap="round"/>`}
    w+=`<path d="M${x0} ${cy}H${BN}" stroke="var(--neg)" stroke-width="2.5"/><path d="M${(x0+tot).toFixed(1)} ${cy}H${BP}" stroke="var(--pos)" stroke-width="2.5"/><circle cx="${BN}" cy="${cy}" r="3" fill="var(--neg)"/><circle cx="${BP}" cy="${cy}" r="3" fill="var(--pos)"/>`}
   const yt=y0+ph/2,yb=y0+(st-1)*dy+ph/2;
   w+=`<path d="M${BN} ${yt-6}V${yb+6}" stroke="var(--neg)" stroke-width="4" stroke-linecap="round"/><path d="M${BP} ${yt-6}V${yb+6}" stroke="var(--pos)" stroke-width="4" stroke-linecap="round"/>
    <text x="${BN}" y="${yb+24}" text-anchor="middle" class="b0lab" fill="var(--neg)">−</text><text x="${BP}" y="${yb+24}" text-anchor="middle" class="b0lab" fill="var(--pos)">+</text>`;
   return w+p+lab};
  const draw=()=>{const c=+$q('#b2c').value,ser=c>100?c/2:c,vcell=0.69,vmod=ser*vcell,n=S.n,s=S.s,wmod=Math.round(ser*vcell*0.8*(c>100?13.2:10.5)/5)*5;
   $q('#b2o').innerHTML=b0Kv([['เซลล์ต่ออนุกรมในแผง',ser+' ชุด'],['Voc ต่อแผง ≈ '+ser+' × 0.69 V',b0f(vmod,1)+' V'],['Voc ต่อสตริง',b0f(vmod*n,0)+' V'],['กระแสรวม (เท่าจำนวนสตริง)','× '+s],['จำนวนแผงทั้งหมด',n*s+' แผง'],['กำลังรวมโดยประมาณ',b0f(n*s*wmod/1000,2)+' kWp ('+wmod+' W/แผง)']]);
   $q('#b2arr').innerHTML=scene(n,s)};
  const pic=B0G.panel(2,6,9,12)+B0G.panel(13,6,9,12);
  b0SvgCtl($q('#b2svg'),$q('#b2ctl'),[
    {k:'n',lab:'แผงต่อสตริง',min:1,max:16,step:1,v:S.n,fmt:v=>v+' แผง',ic:pic+`<path d="M11 12h2" stroke="#d62828" stroke-width="2"/>`,vt:1,x:42,y:62,h:124},
    {k:'s',lab:'จำนวนสตริง',min:1,max:4,step:1,v:S.s,fmt:v=>v+' สตริง',ic:pic,vt:1,x:596,y:62,h:124}],
   [],(k,v)=>{S[k]=v;draw()});
  $q('#b2c').addEventListener('change',draw);draw();
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
 <li>ใช้แคลมป์มิเตอร์ย่าน <b>V⎓</b> วัดแรงดันคร่อมขั้วโหลด (แดงที่ +, ดำที่ −) และย่าน <b>A⎓</b> คล้องปากคีบรอบสาย <b>เส้นเดียว</b> วัดกระแส ที่จุดทำงานเดียวกัน ขณะแสงนิ่ง</li><li>โดยทั่วไป Vmp ≈ 80% ของ Voc และ Imp ≈ 93–95% ของ Isc</li></ul>`,
 w(el){
  /* วงจรจริง: แผง → สาย + / − → โหลด DC ปรับค่าได้ · วัด V คร่อมขั้วโหลดด้วยสายวัด · วัด I ด้วยปากคีบ · แคลมป์มิเตอร์ปุ่มหมุนแบบ Fluke 325 */
  const POS=[['off','OFF','ปิด'],['adc','A⎓','กระแส DC (ปากคีบ)'],['aac','A~','กระแส AC (ปากคีบ)'],['vdc','V⎓','แรงดัน DC (สายวัด)'],['vac','V~','แรงดัน AC (สายวัด)'],['ohm','Ω •)))','ความต้านทาน / ความต่อเนื่อง'],['cap','⊣⊢','ความจุไฟฟ้า'],['tmp','°C','อุณหภูมิ']];
  const ang=k=>-120+k*240/(POS.length-1),SC=.55,JX=130*SC,JY=70*SC,Rk=k=>0.4*Math.pow(150,k/100);
  const TP={pos:[490,323],neg:[560,467]};
  const ZN={red:[95,330,'สาย + (แดง)'],blk:[150,330,'สาย − (ดำ)'],pair:[222,400,'สาย + และ − พร้อมกัน'],red2:[400,302,'สาย + (แดง) ช่วงเข้าโหลด']};
  const H0={mx:615,my:392,pr:[430,606],pb:[505,560]};
  const SL={g:{x:-316,y:396,w:282,min:100,max:1100,step:50},r:{x:-316,y:466,w:282,min:0,max:100,step:1}};  /* in-scene sliders */
  const S=Object.assign({pos:4,jaw:null,mv:null,mi:null},JSON.parse(JSON.stringify(H0)));
  const dial=POS.map((p,k)=>{const r=(ang(k)-90)*Math.PI/180,x=130+Math.cos(r)*74,y=300+Math.sin(r)*74;return`<g class="b0dp" data-k="${k}" tabindex="0" role="button" aria-label="${p[2]}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="18" fill="transparent"/><text x="${x.toFixed(1)}" y="${(y+4).toFixed(1)}" text-anchor="middle" fill="${p[0]==='off'?'#ff8a80':'#fff'}">${p[1]}</text></g>`}).join('');
  const cloud=(x,y,s,o)=>`<g opacity="${o.toFixed(2)}" fill="#fff" stroke="#9aa9b6" stroke-width="2"><path d="M${x} ${y}a${s*.5} ${s*.5} 0 0 1 ${s*.45} ${-s*.42}a${s*.62} ${s*.62} 0 0 1 ${s*1.05} ${-s*.1}a${s*.48} ${s*.48} 0 0 1 ${s*.62} ${s*.52}a${s*.36} ${s*.36} 0 0 1 0 ${s*.72}H${x+s*.1}a${s*.36} ${s*.36} 0 0 1 ${-s*.1} ${-s*.72}z"/></g>`;
  el.innerHTML=`<p class="hint tight">ภารกิจ: ปรับโหลดให้แผงจ่ายกำลังสูงสุด แล้ว<b>วัดเอง</b>ทั้งแรงดัน (หมุนไป V⎓ ลากปลายสายแดงแตะขั้ว + และดำแตะขั้ว − ของโหลด) และกระแส (หมุนไป A⎓ ลากปากคีบไปคล้องสายเส้นเดียว) ที่จุดเดียวกัน</p>
   <div class="eqact"><button class="chip" id="b4l" type="button" aria-label="หมุนปุ่มซ้าย">◀ หมุน</button><button class="chip" id="b4rr" type="button" aria-label="หมุนปุ่มขวา">หมุน ▶</button><button class="chip" id="b4rs" type="button">วางเครื่องมือที่เดิม</button></div>
   <div class="b0scn"><svg id="b4svg" viewBox="-356 0 1118 650" role="img" aria-label="แผงโซลาร์ต่อโหลด DC และแคลมป์มิเตอร์">
    <g id="b4sky"></g>
    <g>${B0G.panel(20,60,190,230)}<rect x="96" y="290" width="60" height="22" rx="3" fill="#2b3138"/><text x="126" y="305" text-anchor="middle" font-size="10" fill="#cfd8dc">J-Box</text></g>
    <path d="M110 312V352Q95 360 95 372V384Q95 394 120 394H262Q300 394 300 370V320Q300 302 320 302H470Q490 302 490 318V330" fill="none" stroke="#d62828" stroke-width="7" stroke-linejoin="round"/>
    <path d="M142 312V352Q150 360 150 372V396Q150 406 170 406H262Q300 406 300 430V480Q300 500 320 500H540Q560 500 560 480V460" fill="none" stroke="#2b3138" stroke-width="7" stroke-linejoin="round"/>
    <path d="M340 292l14 10-14 10" fill="none" stroke="#d62828" stroke-width="2.5"/><text x="326" y="328" font-size="11" fill="var(--muted)">กระแส I →</text>
    <g id="b4load"></g><g id="b4chart"></g><g id="b4ctl"></g>
    <g id="b4zones"></g>
    <g id="b4m" class="b0drag" transform="translate(${S.mx} ${S.my}) scale(${SC})">
     <path class="b4grab" d="M70 120V70A60 60 0 1 1 190 70V120" fill="none" stroke="#2b3138" stroke-width="26" stroke-linecap="round"/><path d="M70 120V70A60 60 0 1 1 190 70V120" fill="none" stroke="#e8b923" stroke-width="10" stroke-linecap="round" pointer-events="none"/>
     <rect id="b4gap" x="120" y="-4" width="20" height="24" fill="var(--bg)" pointer-events="none"/>
     <rect class="b4grab" x="30" y="118" width="200" height="292" rx="26" fill="#e8b923" stroke="#2b3138" stroke-width="3"/><rect class="b4grab" x="42" y="128" width="176" height="272" rx="18" fill="#3a4148"/>
     <rect class="b4grab" x="56" y="140" width="148" height="64" rx="8" fill="#b9d8b0" stroke="#1d2a1d" stroke-width="2"/>
     <text id="b4lcd" x="192" y="186" text-anchor="end" font-family="monospace" font-size="34" font-weight="700" fill="#1d2a1d" pointer-events="none">0.0</text><text id="b4unit" x="62" y="158" font-family="monospace" font-size="13" fill="#1d2a1d" pointer-events="none"></text>
     <g font-family="sans-serif" font-size="12" font-weight="700">${dial}</g>
     <circle cx="130" cy="300" r="46" fill="#22272c" stroke="#111" stroke-width="3" pointer-events="none"/><g id="b4knob" pointer-events="none"><circle cx="130" cy="300" r="38" fill="#2f363c" stroke="#555" stroke-width="2"/><rect x="124" y="258" width="12" height="44" rx="5" fill="#e8b923"/></g>
     <circle cx="96" cy="388" r="7" fill="#d62828" stroke="#111"/><circle cx="164" cy="388" r="7" fill="#111" stroke="#666"/><text x="96" y="372" text-anchor="middle" font-size="10" fill="#fff">V Ω</text><text x="164" y="372" text-anchor="middle" font-size="10" fill="#fff">COM</text>
    </g>
    <g id="b4leads"></g><g id="b4pr" class="b0drag"></g><g id="b4pb" class="b0drag"></g>
   </svg></div>
   <p class="b0cmpos" id="b4pos"></p>
   <div class="b0vh">${b0Rng('b4g','ความเข้มแสง (W/m²)',100,1100,50,1000)}${b0Rng('b4r','ความต้านทานโหลด',0,100,1,20)}</div>
   <p class="b0msg" id="b4msg"></p><div class="b0done" id="b4d"></div>`;
  const $q=x=>el.querySelector(x),svg=$q('#b4svg');
  const probe=(x,y,col,d)=>`<path d="M${x} ${y}l-5 ${16*d}h10z" fill="#c9ccd0" stroke="#7d8a96" stroke-width=".8"/><rect x="${x-7}" y="${d>0?y+16:y-60}" width="14" height="44" rx="5" fill="${col}" stroke="#111" stroke-width="1.2"/><rect x="${x-9}" y="${d>0?y+18:y-24}" width="18" height="6" rx="2" fill="${col}" stroke="#111" stroke-width="1"/><circle cx="${x}" cy="${y+38*d}" r="24" fill="transparent"/>`;
  const near=(p,q,r)=>Math.hypot(p[0]-q[0],p[1]-q[1])<=r,on=p=>near(p,TP.pos,8)?'pos':near(p,TP.neg,8)?'neg':null;
  const op=()=>{const c=b0Curve(b0V('b4g'),25),R=Rk(b0V('b4r')),o=b0OnR(c,R);return{c,R,o,pct:c.mp.P>0?o.P/c.mp.P*100:0}};
  function draw(){
   const g=b0V('b4g'),{R,o}=op(),kn=-135+270*b0V('b4r')/100;
   $q('#b4sky').innerHTML=B0G.sun(250,44,24,g/1100)+cloud(196,70,62,Math.max(0,Math.min(.95,(900-g)/700)));
   $q('#b4load').innerHTML=`<rect x="470" y="330" width="140" height="130" rx="10" fill="#cfd8dc" stroke="#455a64" stroke-width="2"/><text x="540" y="350" text-anchor="middle" font-size="11" font-weight="700" fill="#263238">โหลด DC ปรับค่าได้</text>
     <path d="M484 378h8l5-9 8 18 8-18 8 18 8-18 8 18 5-9h8" fill="none" stroke="#37474f" stroke-width="2.4" stroke-linejoin="round"/><path d="M498 398L566 362" stroke="#37474f" stroke-width="2"/><path d="M566 362l-9 1 5 7z" fill="#37474f"/>
     <circle cx="584" cy="418" r="17" fill="#37474f" stroke="#111" stroke-width="1.5"/><g transform="rotate(${kn.toFixed(0)} 584 418)"><rect x="581" y="402" width="6" height="16" rx="3" fill="#ffd400"/></g>
     <text x="520" y="424" text-anchor="middle" font-family="monospace" font-size="13" font-weight="700" fill="#263238">${b0f(R,2)} Ω</text>
     <circle cx="490" cy="330" r="8" fill="#f2f2f2" stroke="#d62828" stroke-width="3"/><text x="476" y="320" font-size="13" font-weight="700" fill="#d62828">+</text>
     <circle cx="560" cy="460" r="8" fill="#f2f2f2" stroke="#2b3138" stroke-width="3"/><text x="574" y="478" font-size="15" font-weight="700" fill="#2b3138">−</text>`;
   $q('#b4zones').innerHTML=Object.keys(ZN).map(k=>`<circle cx="${ZN[k][0]}" cy="${ZN[k][1]}" r="${S.jaw===k?0:9}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-dasharray="3 3" opacity=".8"/>`).join('');
   $q('#b4m').setAttribute('transform',`translate(${S.mx} ${S.my}) scale(${SC})`);$q('#b4gap').setAttribute('visibility',S.jaw?'hidden':'visible');
   $q('#b4knob').setAttribute('transform',`rotate(${ang(S.pos)} 130 300)`);el.querySelectorAll('.b0dp').forEach(d=>d.classList.toggle('on',+d.dataset.k===S.pos));
   const jr=[S.mx+96*SC,S.my+388*SC],jb=[S.mx+164*SC,S.my+388*SC],lead=(j,p,col,d)=>`<path d="M${j[0]} ${j[1]}C${j[0]} ${j[1]+90} ${p[0]} ${p[1]+150*d} ${p[0]} ${p[1]+60*d}" fill="none" stroke="${col}" stroke-width="4"/>`;
   $q('#b4leads').innerHTML=lead(jr,S.pr,'#d62828',-1)+lead(jb,S.pb,'#2b3138',1);
   $q('#b4pr').innerHTML=probe(S.pr[0],S.pr[1],'#d62828',-1);$q('#b4pb').innerHTML=probe(S.pb[0],S.pb[1],'#2b3138',1);
   $q('#b4rv').textContent=b0f(R,2)+' Ω';
   const sl=(k,lab,txt,ic)=>{const c=SL[k],v=b0V(k==='g'?'b4g':'b4r'),kx=c.x+(v-c.min)/(c.max-c.min)*c.w;
     return`<g class="b4sl" data-k="${k}" tabindex="0" role="slider" aria-label="${lab}" aria-valuenow="${v}"><rect x="${c.x-34}" y="${c.y-30}" width="${c.w+60}" height="52" rx="10" fill="var(--surface)" stroke="var(--line)"/>
      <g transform="translate(${c.x-28} ${c.y-22}) scale(1.1)">${ic}</g><text x="${c.x}" y="${c.y-12}" font-size="12" font-weight="600" fill="var(--ink)">${lab}</text><text x="${c.x+c.w+20}" y="${c.y-12}" font-size="12" font-weight="700" text-anchor="end" font-family="monospace" fill="var(--ink)">${txt}</text>
      <rect x="${c.x}" y="${c.y+2}" width="${c.w}" height="6" rx="3" fill="var(--band)"/><rect x="${c.x}" y="${c.y+2}" width="${(kx-c.x).toFixed(1)}" height="6" rx="3" fill="var(--accent)"/>
      <rect x="${c.x-6}" y="${c.y-10}" width="${c.w+12}" height="30" fill="transparent"/><circle cx="${kx.toFixed(1)}" cy="${c.y+5}" r="10" fill="#fff" stroke="var(--accent)" stroke-width="3"/></g>`};
   $q('#b4ctl').innerHTML=sl('g','ความเข้มแสง',b0V('b4g')+' W/m²',B0G.sun(10,10,4.6,1))+sl('r','ความต้านทานโหลด',b0f(R,2)+' Ω',`<path d="M0 10H4L6 5L9 15L12 5L15 15L17 10H21" fill="none" stroke="#55626e" stroke-width="1.8" stroke-linejoin="round"/>`);
  }
  function measure(){
   const m=POS[S.pos][0],{c,R,o,pct}=op(),r=on(S.pr),k=on(S.pb);let v='0.0',u='',ok=null,t='';
   if(m==='off'){v='';t='เครื่องปิดอยู่ หมุนปุ่มไปยังย่านที่ต้องการ'}
   else if(m==='tmp'||m==='cap'){v=m==='tmp'?'--':'OL';u=m==='tmp'?'°C':'µF';ok=false;t='ย่านนี้ไม่ใช่การวัดแรงดันหรือกระแสของวงจรแผง'}
   else if(m==='adc'||m==='aac'){u=m==='adc'?'A⎓':'A~';
    if(!S.jaw)t='ลากแคลมป์มิเตอร์ไปคล้องสาย (วงกลมประ) ปากคีบจะปิดเมื่อคล้องได้';
    else if(S.jaw==='pair'){ok=false;t='คล้องสาย + และ − พร้อมกัน กระแสหักล้างกันเหลือ 0 A ต้องคล้องสายเส้นเดียว'}
    else if(m==='aac'){ok=false;t='กระแสจากแผงเป็น DC ย่าน A~ อ่านได้ราว 0 A ให้หมุนไป A⎓'}
    else{const neg=S.jaw==='blk';v=(neg?'-':'')+b0f(o.I,2);ok=true;S.mi=o.I;t=`วัดกระแสได้ ${b0f(o.I,2)} A${neg?' (ค่าติดลบเพราะสาย − กระแสไหลกลับทางสวนลูกศรบนปากคีบ)':''}`}}
   else{u=m==='vdc'?'V⎓':m==='vac'?'V~':'Ω';
    if(!r||!k||r===k){v=m==='ohm'?'OL':'0.0';t=r&&r===k?'ปลายสายทั้งสองแตะขั้วเดียวกัน ให้แตะคนละขั้ว':'ลากปลายสายแดงไปแตะขั้ว + และสายดำไปแตะขั้ว − ของโหลด'}
    else if(m==='ohm'){v='OL';ok=false;t='อันตราย: ห้ามวัดโอห์มในวงจรที่มีไฟ ต้องปลดโหลดออกจากแผงก่อน'}
    else if(m==='vac'){ok=false;t='ตั้งผิดย่าน: วงจรนี้เป็นไฟ DC ให้หมุนไป V⎓'}
    else if(r==='neg'){v='-'+b0f(o.V,1);ok=false;t='สลับขั้ว: สายแดงแตะขั้ว − ค่าจึงติดลบ'}
    else{v=b0f(o.V,1);ok=true;S.mv=o.V;t=`วัดแรงดันคร่อมโหลดได้ ${b0f(o.V,1)} V`}}
   $q('#b4lcd').textContent=v;$q('#b4unit').textContent=u;b0Msg($q('#b4msg'),ok,t);
   $q('#b4pos').innerHTML=`ปุ่มหมุนอยู่ที่ <b>${POS[S.pos][1]}</b> · ${POS[S.pos][2]}${S.jaw?` · ปากคีบคล้อง<b>${ZN[S.jaw][2]}</b>`:''}`;
   const P=S.mv!=null&&S.mi!=null?S.mv*S.mi:null;
   const done=P!=null&&pct>=98;
   $q('#b4d').innerHTML=`<span class="${S.mv!=null?'ok':''}">${S.mv!=null?'✓':'○'} วัดแรงดัน</span><span class="${S.mi!=null?'ok':''}">${S.mi!=null?'✓':'○'} วัดกระแส</span><span class="${done?'ok':''}">${done?'✓':'○'} อยู่ที่จุดกำลังสูงสุด (≥ 98%)</span>`;
   if(done){b0Task('t4',true);b0Msg($q('#b4msg'),true,`สำเร็จ: Vmp ≈ ${b0f(S.mv,1)} V, Imp ≈ ${b0f(S.mi,2)} A, Pmax ≈ ${b0f(P,0)} W (ป้ายแผงตัวอย่าง ${B0P.Vmp} V / ${B0P.Imp} A ที่ STC)`)}
   else if(P!=null&&pct<98&&ok!==false)$q('#b4msg').textContent+=` · ได้ ${b0f(pct,0)}% ของกำลังสูงสุด ลองปรับโหลดแล้ววัดใหม่`;
   const near=Math.abs(o.V-c.mp.V)<2.5;const ch=b0Chart({W:330,H:300,xmax:52,ymax:16,y2:true,y2max:600,xl:'แรงดัน (V)',yl:'กระแส (A)',y2l:'กำลัง (W)',aria:'เส้น I-V และ P-V พร้อมจุดทำงาน',
    series:[{pts:c.pts.map(p=>[p[0],p[1]]),col:'var(--s1)'},{pts:c.pts.map(p=>[p[0],p[2]]),col:'var(--s2)',y2:true,dash:true},{pts:[[0,0],[c.voc,c.voc/R]],col:'var(--muted)'}],
    dots:[{x:o.V,y:o.I,col:'var(--accent)',lab:near?'':'จุดทำงาน'},{x:c.mp.V,y:c.mp.P,col:'var(--s2)',lab:near?'':'Pmax',y2:true}],legend:[['I-V','var(--s1)'],['P-V','var(--s2)',1]]});
   const rd=`<text x="2" y="14" font-size="12" font-weight="700" fill="${P!=null&&pct>=98?'var(--ok)':'var(--ink)'}">วัดได้: V ${S.mv!=null?b0f(S.mv,1)+' V':'—'} · I ${S.mi!=null?b0f(S.mi,2)+' A':'—'}</text><text x="2" y="32" font-size="12" font-weight="700" fill="${P!=null&&pct>=98?'var(--ok)':'var(--ink)'}">P = V × I = ${P!=null?b0f(P,0)+' W ('+b0f(pct,0)+'% ของสูงสุด)':'—'}</text>`;
   $q('#b4chart').innerHTML=`<g transform="translate(-344 10)"><rect x="-6" y="-4" width="342" height="346" rx="10" fill="var(--surface)" stroke="var(--line)" opacity=".96"/>`+ch.replace(/^<svg class="b0ch" viewBox="0 0 330 300"[^>]*>/,'<svg x="0" y="40" width="330" height="300" viewBox="0 0 330 300">')+rd+'</g>';
  }
  const run=()=>{draw();measure()};
  const reset=()=>{S.mv=null;S.mi=null};
  const go=k=>{S.pos=Math.max(0,Math.min(POS.length-1,k));run()};
  el.querySelectorAll('.b0dp').forEach(d=>{d.addEventListener('pointerdown',e=>e.stopPropagation());d.addEventListener('click',()=>go(+d.dataset.k));d.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go(+d.dataset.k)}})});
  $q('#b4l').addEventListener('click',()=>go(S.pos-1));$q('#b4rr').addEventListener('click',()=>go(S.pos+1));
  $q('#b4rs').addEventListener('click',()=>{Object.assign(S,JSON.parse(JSON.stringify(H0)),{jaw:null});run()});
  const pt=e=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(svg.getScreenCTM().inverse());return[q.x,q.y]};
  let drag=null;
  const start=(w,e)=>{e.preventDefault();const p=pt(e);drag={w,dx:w==='m'?p[0]-S.mx:p[0]-S[w][0],dy:w==='m'?p[1]-S.my:p[1]-S[w][1]};if(w==='m')S.jaw=null;try{svg.setPointerCapture(e.pointerId)}catch(_){}};
  el.querySelectorAll('#b4m .b4grab').forEach(g=>g.addEventListener('pointerdown',e=>start('m',e)));
  /* in-scene sliders: drag the knob or the track, arrow keys when focused */
  const slSet=(k,x)=>{const c=SL[k],id=k==='g'?'b4g':'b4r',inp=$q('#'+id);let v=c.min+(x-c.x)/c.w*(c.max-c.min);v=Math.round(v/c.step)*c.step;v=Math.max(c.min,Math.min(c.max,v));if(+inp.value!==v){inp.value=v;inp.dispatchEvent(new Event('input'))}};
  $q('#b4ctl').addEventListener('pointerdown',e=>{const g=e.target.closest('.b4sl');if(!g)return;e.preventDefault();e.stopPropagation();drag={w:'sl',k:g.dataset.k};try{svg.setPointerCapture(e.pointerId)}catch(_){}slSet(g.dataset.k,pt(e)[0])});
  $q('#b4ctl').addEventListener('keydown',e=>{const g=e.target.closest('.b4sl');if(!g)return;const k=g.dataset.k,c=SL[k],inp=$q(k==='g'?'#b4g':'#b4r'),d=e.key==='ArrowRight'||e.key==='ArrowUp'?1:e.key==='ArrowLeft'||e.key==='ArrowDown'?-1:0;if(!d)return;e.preventDefault();inp.value=Math.max(c.min,Math.min(c.max,+inp.value+d*c.step));inp.dispatchEvent(new Event('input'));const n=$q(`.b4sl[data-k="${k}"]`);if(n)n.focus()});
  $q('#b4pr').addEventListener('pointerdown',e=>start('pr',e));$q('#b4pb').addEventListener('pointerdown',e=>start('pb',e));
  svg.addEventListener('pointermove',e=>{if(!drag)return;if(drag.w==='sl'){slSet(drag.k,pt(e)[0]);return}const p=pt(e),x=Math.max(0,Math.min(760,p[0]-drag.dx)),y=p[1]-drag.dy;
    if(drag.w==='m'){S.mx=Math.min(760-143,x);S.my=Math.max(-20,Math.min(600,y))}else S[drag.w]=[x,Math.max(60,Math.min(y,570))];draw()});
  const end=()=>{if(!drag)return;const w=drag.w;drag=null;if(w==='sl')return;
    if(w==='m'){const jc=[S.mx+JX,S.my+JY];let best=null,bd=34;Object.keys(ZN).forEach(k=>{const d=Math.hypot(jc[0]-ZN[k][0],jc[1]-ZN[k][1]);if(d<bd){bd=d;best=k}});if(best){S.jaw=best;S.mx=ZN[best][0]-JX;S.my=ZN[best][1]-JY}}
    else{const dp=Math.hypot(S[w][0]-TP.pos[0],S[w][1]-TP.pos[1]),dn=Math.hypot(S[w][0]-TP.neg[0],S[w][1]-TP.neg[1]),t=Math.min(dp,dn)<=30?(dp<=dn?'pos':'neg'):null;if(t)S[w]=TP[t].slice()}
    run()};
  svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);
  b0Bind(el,['b4g','b4r'],()=>{reset();run()},['','']);
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

{id:'t6',title:'การทำงานของเครื่องควบคุมการชาร์จ (Charger/Controller)',desc:'ชาร์จแบตอย่างปลอดภัย ระบบ PWM / MPPT',task:'ตั้งค่า CC / CV / Float ให้เหมาะกับแบต แล้วชาร์จจนเข้า Float',
 intro:`<ul><li><b>PWM</b> เปิด-ปิดสวิตช์ต่อแผงกับแบตตรง ๆ แผงจึงถูกดึงแรงดันลงมาเท่าแบต ใช้ได้ดีเมื่อ Vmp ของแผงใกล้แรงดันชาร์จแบต (แผง "12 V" กับแบต 12 V)</li>
 <li><b>MPPT</b> เป็นตัวแปลง DC-DC ให้แผงทำงานที่ Vmp แล้วแปลงแรงดันส่วนเกินเป็นกระแสชาร์จ ได้พลังงานมากกว่า โดยเฉพาะแผงแรงดันสูง</li>
 <li>ขั้นตอนชาร์จ: <b>CC (Bulk)</b> จ่ายกระแสคงที่ตามที่ตั้ง แรงดันแบตค่อย ๆ ขึ้น → <b>CV (Absorption)</b> คุมแรงดันคงที่ กระแสลดลงเรื่อย ๆ → <b>Float</b> ลดแรงดันลงเลี้ยงแบตเต็ม · <b>ต่อแบตเข้าคอนโทรลเลอร์ก่อน แล้วจึงต่อแผง</b> (ถอดกลับลำดับ) เพื่อให้คอนโทรลเลอร์รู้แรงดันระบบ</li></ul>`,
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
  const box=document.createElement('div');box.className='b6cc';el.append(box);b0ChgSim(box);
 },
 q:[{q:'ข้อดีหลักของ MPPT เมื่อเทียบกับ PWM คืออะไร',o:['ราคาถูกกว่าเสมอ','ให้แผงทำงานที่ Vmp และแปลงแรงดันส่วนเกินเป็นกระแสชาร์จ ได้พลังงานมากกว่า','ไม่ต้องต่อแบต','ใช้ได้เฉพาะไฟ AC'],a:1,ex:'ยิ่ง Vmp ของแผงสูงกว่าแรงดันแบตมาก MPPT ยิ่งได้เปรียบ'},
  {q:'ใช้ PWM กับแบต 12 V และแผง Vmp 41.8 V จะใช้กำลังแผงได้ราวเท่าใด',o:['เกือบ 100%','ราว 1/3','ราว 2 เท่า','ใช้ไม่ได้เลย'],a:1,ex:'แผงถูกดึงลงที่ ~13.8 V กระแสใกล้ Isc กำลังจึงเหลือราว 13.8 × 14 ≈ 190 W จาก 550 W'},
  {q:'ลำดับการต่อชาร์จคอนโทรลเลอร์ที่ถูกต้องคือ',o:['ต่อแผงก่อน แล้วค่อยต่อแบต','ต่อแบตก่อน แล้วค่อยต่อแผง','ต่อพร้อมกัน','ต่อโหลดก่อนทุกอย่าง'],a:1,ex:'คอนโทรลเลอร์ตรวจแรงดันระบบจากแบต ต่อแผงก่อนอาจตรวจผิดหรือเสียหาย'}]},

{id:'t7',title:'แบตเตอรี่ (Battery)',desc:'ประเภทและการกักเก็บพลังงาน ระบบ Off-Grid / Hybrid',
 intro:`<ul><li>พลังงานแบต (Wh) = แรงดัน (V) × ความจุ (Ah) · ใช้ได้จริง = พลังงาน × <b>DoD</b> (ความลึกการคายประจุที่แนะนำ) × ประสิทธิภาพอินเวอร์เตอร์</li>
 <li><b>ตะกั่วกรด</b> ราคาถูก หนัก ควรใช้ไม่เกินราว 50% · <b>ลิเธียมฟอสเฟต (LiFePO4)</b> ใช้ได้ลึก 80–90% อายุรอบมากกว่าหลายเท่า ทนร้อนดี มี BMS ควบคุม · <b>ลิเธียม NMC</b> เบา พลังงานต่อน้ำหนักสูง แต่ไวต่อความร้อนและการชาร์จเกินมากกว่า LFP</li>
 <li>ต่อ <b>อนุกรม</b> แรงดันเพิ่ม Ah เท่าเดิม · ต่อ <b>ขนาน</b> Ah เพิ่ม แรงดันเท่าเดิม</li></ul>`,
 w(el){
  /* แบตเตอรี่: กราฟลักษณะการคายประจุ (แรงดันขณะจ่ายโหลด เทียบ SOC) · DoD · SOC · ตัดแรงดันต่ำ (LVD) · Peukert (ตะกั่วกรด) */
  const CH={lfp:{n:'LiFePO4',cells:{12:4,24:8,48:16},cell:3.2,ocv:[[0,2.5],[.03,2.9],[.08,3.1],[.15,3.2],[.3,3.26],[.5,3.29],[.7,3.31],[.9,3.34],[.97,3.38],[1,3.45]],R:.0016,cut:2.8,dod:90,k:1.03,cyc:[80,4000,1.6],col:'#2e7d32',whkg:120},
    nmc:{n:'NMC',cells:{12:3,24:7,48:13},cell:3.7,ocv:[[0,3.0],[.05,3.3],[.1,3.45],[.2,3.56],[.4,3.68],[.6,3.82],[.8,3.98],[.95,4.1],[1,4.17]],R:.0022,cut:3.0,dod:80,k:1.05,cyc:[80,1500,1.5],col:'#1565c0',whkg:180},
    pb:{n:'ตะกั่วกรด',cells:{12:6,24:12,48:24},cell:2,ocv:[[0,1.93],[.2,1.98],[.5,2.03],[.8,2.09],[1,2.13]],R:.0012,cut:1.75,dod:50,k:1.25,cyc:[50,600,1.3],col:'#e65100',whkg:35}};
  const S={ch:'lfp',sys:12,ah:100,soc:100,dod:90,ld:600,t:null,play:0,run:null};
  const lerp=(tb,x)=>{x=Math.max(0,Math.min(1,x));for(let i=1;i<tb.length;i++)if(x<=tb[i][0]){const[a,b]=[tb[i-1],tb[i]];return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0])}return tb[tb.length-1][1]};
  const C=()=>CH[S.ch],nc=()=>C().cells[S.sys];
  const model=()=>{const c=C(),n=nc(),Vn=c.cell*n,E=Vn*S.ah,I=S.ld/(Vn*.92),c20=S.ah/20,peuk=I>c20?Math.pow(c20/I,c.k-1):1;
    const R=soc=>c.R*n*(100/S.ah)*(1+3*Math.pow(1-soc,4))*(S.ch==='pb'?1+2*(1-soc):1);
    const vl=soc=>{const v=lerp(c.ocv,soc)*n,i=S.ld/Math.max(1,v*.92);return v-i*R(soc)};
    const ocv=soc=>lerp(c.ocv,soc)*n,cut=c.cut*n;
    /* SOC where loaded voltage hits cutoff, scanning down */
    let socLvd=0;for(let x=1;x>=0;x-=.002){if(vl(x)<=cut){socLvd=x;break}}
    const socDod=1-S.dod/100,stop=Math.max(socDod,socLvd),by=socLvd>socDod?'lvd':'dod';
    const capEff=S.ah*peuk,usable=Math.max(0,S.soc/100-stop)*capEff*Vn*.92,hrs=usable/S.ld;
    const cyc=Math.round(c.cyc[1]*Math.pow(c.cyc[0]/Math.max(5,S.dod),c.cyc[2]));
    return{c,n,Vn,E,I,peuk,vl,ocv,cut,socLvd,socDod,stop,by,usable,hrs,cyc,crate:I/S.ah}};
  el.innerHTML=`<p class="hint tight">ปรับค่าที่แถบด้านซ้าย กราฟด้านขวาเปลี่ยนตามทันที · กด ▶ คายประจุ เพื่อดูว่าแบตถูกตัดเพราะถึง DoD ที่ตั้งไว้ หรือเพราะแรงดันตกถึงจุดตัด (LVD) ก่อน</p>
   <div class="eqact"><button class="chip" id="b7play" type="button">▶ คายประจุ</button><button class="chip" id="b7stop" type="button">⟲ กลับ SOC ที่ตั้ง</button></div>
   <div class="b0scn"><svg id="b7svg" viewBox="-370 0 1150 445" role="img" aria-label="กราฟคายประจุแบตเตอรี่ และแถบปรับค่า"><g id="b7ch"></g><g id="b7pk"></g><g id="b7ctl"></g></svg></div>
   <div id="b7o"></div><p class="b0msg" id="b7msg"></p>`;
  const $q=x=>el.querySelector(x),svg=$q('#b7svg');
  const bat=`<rect x="2" y="5" width="16" height="15" rx="2" fill="#2b3138"/><rect x="6" y="2" width="8" height="3" fill="#5f6b75"/><rect x="5" y="11" width="10" height="7" fill="#43c46b"/>`;
  const ctl=b0SvgCtl(svg,$q('#b7ctl'),[
    {k:'soc',lab:'SOC ตอนนี้',min:0,max:100,step:1,v:S.soc,fmt:v=>v+' %',ic:bat,x:-318,y:200,w:280,col:'#43a047'},
    {k:'dod',lab:'DoD ที่ยอมให้ใช้',min:10,max:100,step:5,v:S.dod,fmt:v=>v+' %',ic:`<path d="M2 18h16M4 18V8h12v10" fill="none" stroke="#55626e" stroke-width="1.6"/><path d="M4 13h12" stroke="#e53935" stroke-width="2"/>`,x:-318,y:272,w:280,col:'#e53935'},
    {k:'ld',lab:'โหลดที่ใช้',min:100,max:5000,step:100,v:S.ld,fmt:v=>v+' W',ic:B0G.bulb(10,9,6.5,1),x:-318,y:344,w:280},
    {k:'ah',lab:'ความจุแบต',min:50,max:400,step:50,v:S.ah,fmt:v=>v+' Ah',ic:bat,x:-318,y:416,w:280}],
   [{k:'ch',lab:'ชนิดแบต',opts:[['lfp','LiFePO4'],['nmc','NMC'],['pb','ตะกั่วกรด']],v:'lfp',x:-356,y:26,w:104},{k:'sys',lab:'แรงดันระบบ',opts:[[12,'12 V'],[24,'24 V'],[48,'48 V']],v:12,x:-356,y:96,w:104}],
   (k,v)=>{if(k==='ch'){S.ch=v;S.dod=CH[v].dod;ctl.set('dod',S.dod)}else S[k]=v;stop();S.t=null;draw()});
  function draw(){
    const m=model(),c=m.c,X0=40,X1=470,Y0=40,Y1=360,vmin=Math.floor(c.cut*m.n*.92),vmax=Math.ceil(lerp(c.ocv,1)*m.n*1.02);
    const X=soc=>X0+(1-soc)*(X1-X0),Y=v=>Y1-(Math.max(vmin,Math.min(vmax,v))-vmin)/(vmax-vmin)*(Y1-Y0);
    const cur=S.t!=null?S.t:S.soc/100;
    let g=`<rect x="-8" y="0" width="520" height="430" rx="10" fill="var(--surface)" stroke="var(--line)"/><text x="4" y="22" font-size="13" font-weight="700" fill="var(--ink)">ลักษณะการคายประจุ ${esc(c.n)} ${S.sys} V (${m.n} เซลล์) · โหลด ${S.ld} W (${b0f(m.I,1)} A = ${b0f(m.crate,2)}C)</text>`;
    /* usable band between current SOC and stop */
    if(cur>m.stop)g+=`<rect x="${X(cur)}" y="${Y0}" width="${(X(m.stop)-X(cur)).toFixed(1)}" height="${Y1-Y0}" fill="#43a047" opacity=".12"/>`;
    g+=`<rect x="${X(m.socDod)}" y="${Y0}" width="${(X1-X(m.socDod)).toFixed(1)}" height="${Y1-Y0}" fill="#e53935" opacity=".07"/>`;
    for(let q=0;q<=10;q++){const x=X0+(X1-X0)*q/10;g+=`<line x1="${x}" x2="${x}" y1="${Y0}" y2="${Y1}" class="b0grid"/>`+(q%2?'':`<text x="${x}" y="${Y1+16}" text-anchor="middle" class="b0ax">${100-q*10}</text>`)}
    for(let q=0;q<=5;q++){const v=vmin+(vmax-vmin)*q/5,y=Y(v);g+=`<line x1="${X0}" x2="${X1}" y1="${y}" y2="${y}" class="b0grid"/><text x="${X0-6}" y="${y+4}" text-anchor="end" class="b0ax">${b0f(v,1)}</text>`}
    g+=`<text x="${(X0+X1)/2}" y="${Y1+34}" text-anchor="middle" class="b0ax">SOC (%) ← เต็ม · หมด →</text><text x="8" y="${(Y0+Y1)/2}" class="b0ax" text-anchor="middle" transform="rotate(-90 8 ${(Y0+Y1)/2})">แรงดันแบต (V)</text>`;
    const pts=f=>{let p=[];for(let k=0;k<=200;k++){const soc=1-k/200,v=f(soc);p.push(X(soc).toFixed(1)+','+Y(v).toFixed(1));if(v<vmin)break}return p.join(' ')};
    g+=`<polyline fill="none" stroke="var(--muted)" stroke-width="1.6" stroke-dasharray="5 4" points="${pts(m.ocv)}"/><polyline fill="none" stroke="${c.col}" stroke-width="3" points="${pts(m.vl)}"/>`;
    g+=`<line x1="${X0}" x2="${X1}" y1="${Y(m.cut)}" y2="${Y(m.cut)}" stroke="#c62828" stroke-width="2" stroke-dasharray="7 4"/><text x="${X0+4}" y="${Y(m.cut)-5}" font-size="11" font-weight="700" fill="#c62828">ตัดแรงดันต่ำ (LVD) ${b0f(m.cut,1)} V · ${c.cut} V/เซลล์</text>`;
    g+=`<line x1="${X(m.socDod)}" x2="${X(m.socDod)}" y1="${Y0}" y2="${Y1}" stroke="#e53935" stroke-width="2"/><text x="${X(m.socDod)+(m.socDod<.25?-4:4)}" y="${Y0+14}" font-size="11" font-weight="700" text-anchor="${m.socDod<.25?'end':'start'}" fill="#e53935">DoD ${S.dod}% → หยุดที่ SOC ${100-S.dod}%</text>`;
    if(m.socLvd>0)g+=`<circle cx="${X(m.socLvd)}" cy="${Y(m.cut)}" r="6" fill="#c62828"/><text x="${X(m.socLvd)}" y="${Y(m.cut)+18}" text-anchor="middle" font-size="10.5" fill="#c62828">ถึง LVD ที่ SOC ${b0f(m.socLvd*100,0)}%</text>`;
    g+=`<line x1="${X(cur)}" x2="${X(cur)}" y1="${Y0}" y2="${Y1}" stroke="var(--ink)" stroke-width="1.5"/><circle cx="${X(cur)}" cy="${Y(m.vl(cur))}" r="7" fill="${c.col}" stroke="#fff" stroke-width="2"/><text x="${X(cur)+(cur<.3?-8:8)}" y="${Y(m.vl(cur))-10}" text-anchor="${cur<.3?'end':'start'}" font-size="12" font-weight="700" fill="var(--ink)">${b0f(m.vl(cur),1)} V</text>`;
    g+=`<g transform="translate(${X0+8} ${Y1-14})" font-size="11"><rect x="-4" y="-12" width="330" height="20" rx="4" fill="var(--surface)" opacity=".9"/><line x1="0" x2="18" y1="-2" y2="-2" stroke="${c.col}" stroke-width="3"/><text x="22" y="2">แรงดันขณะจ่ายโหลด</text><line x1="140" x2="158" y1="-2" y2="-2" stroke="var(--muted)" stroke-width="1.6" stroke-dasharray="5 4"/><text x="162" y="2">แรงดันพัก (ไม่มีโหลด)</text></g>`;
    $q('#b7ch').innerHTML=g;
    /* pack + load picture */
    const s=1,p=1,on=S.play||S.t==null?cur>m.stop:cur>m.stop+1e-4,lvl=Math.max(0,cur);
    let k=`<g transform="translate(530 0)"><rect x="0" y="0" width="240" height="430" rx="10" fill="var(--surface)" stroke="var(--line)"/>
      ${B0G.battery(40,70,110,150,lvl,lvl>.5?'#43c46b':lvl>m.stop+.1?'#f0c330':'#ef6c4c')}<text x="95" y="160" text-anchor="middle" font-size="22" font-weight="700" fill="#fff">${b0f(cur*100,0)}%</text>
      <line x1="40" x2="150" y1="${(88+132*(1-m.stop)).toFixed(1)}" y2="${(88+132*(1-m.stop)).toFixed(1)}" stroke="#e53935" stroke-width="3" stroke-dasharray="6 3"/><text x="158" y="${(92+132*(1-m.stop)).toFixed(1)}" font-size="11" font-weight="700" fill="#e53935">หยุดใช้</text>
      <text x="95" y="244" text-anchor="middle" font-size="12" font-weight="600" fill="var(--ink)">${esc(c.n)} ${S.sys} V ${S.ah} Ah</text><text x="95" y="262" text-anchor="middle" font-size="11" fill="var(--muted)">${b0f(m.E/1000,2)} kWh · ~${b0f(m.Vn*S.ah/c.whkg,0)} kg</text>
      <path d="M150 120H196V300" fill="none" stroke="#d62828" stroke-width="4" ${on?'stroke-dasharray="7 5"':''}/><path d="M150 140H184V300" fill="none" stroke="#2b3138" stroke-width="4"/>
      ${B0G.bulb(190,330,26,on?Math.min(1,.4+S.ld/3000):0)}<text x="190" y="392" text-anchor="middle" font-size="12" font-weight="700" fill="${on?'var(--ink)':'#c62828'}">${on?`โหลด ${S.ld} W`:'ตัดโหลดแล้ว'}</text>
      <text x="120" y="418" text-anchor="middle" font-size="11" fill="var(--muted)">${S.t!=null?`ใช้ไปแล้ว ${b0f(S.run||0,1)} ชม.`:''}</text></g>`;
    $q('#b7pk').innerHTML=k;
    $q('#b7o').innerHTML=b0Kv([['พลังงานรวม',b0f(m.E/1000,2)+' kWh'],['ใช้ได้จริงจาก SOC ตอนนี้ (หลังหักจุดหยุด, อินเวอร์เตอร์ 92%)',b0f(m.usable/1000,2)+' kWh','ok'],['ใช้โหลดนี้ได้อีก',b0f(m.hrs,1)+' ชม.','ok'],
      ['จุดหยุดใช้แบต',m.by==='lvd'?`แรงดันตกถึง LVD ก่อน (SOC ${b0f(m.socLvd*100,0)}%)`:`ตาม DoD ที่ตั้ง (SOC ${100-S.dod}%)`,m.by==='lvd'?'warn':''],
      ['ความจุที่ใช้ได้จริงที่กระแสนี้ (Peukert)',`${b0f(m.peuk*100,0)}% ของ ${S.ah} Ah`,m.peuk<.85?'warn':''],['อายุรอบโดยประมาณที่ DoD นี้',`~${m.cyc.toLocaleString('th-TH')} รอบ`]]);
    const notes=[];if(m.by==='lvd')notes.push(`โหลด ${S.ld} W ทำให้แรงดันตก (I×R) ถึงจุดตัด ${b0f(m.cut,1)} V ก่อนถึง DoD ที่ตั้ง แบตจึงใช้ได้น้อยกว่าที่คิด ลดโหลด เพิ่มความจุ หรือใช้แรงดันระบบสูงขึ้น`);
    if(S.ch==='pb'&&S.dod>50)notes.push('ตะกั่วกรดใช้ลึกเกิน 50% อายุรอบลดลงมาก');if(S.ch!=='pb'&&S.dod>=100)notes.push('ใช้ 100% ทุกครั้ง แบตลิเธียมเสื่อมเร็วขึ้น BMS ต้องตัดเอง');
    if(m.crate>(S.ch==='pb'?.25:S.ch==='nmc'?1:1))notes.push(`กระแส ${b0f(m.crate,2)}C สูงสำหรับแบตชนิดนี้ แบตร้อนและแรงดันตกมาก`);
    if(S.play||S.t!=null){if(S.t!=null&&S.t<=m.stop+1e-4)notes.unshift(m.by==='lvd'?`ตัดโหลดเพราะแรงดันตกถึง LVD ${b0f(m.cut,1)} V ที่ SOC ${b0f(m.socLvd*100,0)}% (ใช้ไป ${b0f(S.run,1)} ชม.)`:`ตัดโหลดเพราะถึง DoD ${S.dod}% ที่ตั้งไว้ (ใช้ไป ${b0f(S.run,1)} ชม.)`)}
    b0Msg($q('#b7msg'),notes.length?(S.t!=null&&S.t<=m.stop+1e-4?true:null):null,notes.join(' · '));
  }
  function stop(){if(S.play){cancelAnimationFrame(S.play);S.play=0}$q('#b7play').textContent='▶ คายประจุ'}
  const tick=()=>{const m=model(),dt=Math.max(.02,m.hrs/180)*1;/* hours per frame */
    const capEff=S.ah*m.peuk,dsoc=S.ld/(m.Vn*.92)*dt/capEff;S.t=Math.max(m.stop,S.t-dsoc);S.run=(S.run||0)+dt;draw();
    if(S.t<=m.stop+1e-6){stop();draw();return}S.play=requestAnimationFrame(tick)};
  $q('#b7play').addEventListener('click',()=>{if(S.play){stop();return}const m=model();if(S.t==null||S.t<=m.stop+1e-6){S.t=S.soc/100;S.run=0}if(S.t<=m.stop){draw();return}$q('#b7play').textContent='⏸ หยุด';S.play=requestAnimationFrame(tick)});
  $q('#b7stop').addEventListener('click',()=>{stop();S.t=null;S.run=0;draw()});
  draw();
 },
 q:[{q:'ข้อใดเป็นข้อเด่นของ LiFePO4 เมื่อเทียบกับตะกั่วกรด',o:['ใช้ได้ลึกกว่าและอายุรอบมากกว่า','ไม่ต้องมีระบบป้องกันใด ๆ','ราคาต่อลูกถูกกว่าเสมอ','แรงดันต่อเซลล์ 12 V'],a:0,ex:'LiFePO4 ใช้ DoD 80–90% และอายุหลายพันรอบ แต่ต้องมี BMS'},
  {q:'แบต 51.2 V 100 Ah มีพลังงานเท่าใด',o:['5.12 kWh','51.2 kWh','1.51 kWh','100 kWh'],a:0,ex:'51.2 × 100 = 5,120 Wh = 5.12 kWh'},
  {q:'นำแบต 12 V 100 Ah สองลูกต่ออนุกรม จะได้เท่าใด',o:['12 V 200 Ah','24 V 100 Ah','24 V 200 Ah','12 V 100 Ah'],a:1,ex:'อนุกรม: แรงดันบวกกัน ความจุ (Ah) เท่าเดิม'}]},

{id:'t8',title:'ระบบป้องกัน (Protection)',desc:'ฟิวส์ เบรกเกอร์ DC/AC (MCB) และอุปกรณ์ป้องกันแรงดันเกิน (SPD)',task:'ประกอบตู้คอมไบเนอร์ DC/AC และต่อสายผ่านการตรวจทุกข้อ',
 intro:`<ul><li><b>ฟิวส์สตริง</b> ป้องกันกระแสย้อนจากสตริงอื่นเมื่อมีสตริงขนานกันตั้งแต่ 3 สตริงขึ้นไป เลือกพิกัดราว <b>1.5–2.4 × Isc</b> และไม่เกิน "Maximum series fuse rating" บนป้ายแผง</li>
 <li><b>เบรกเกอร์ / สวิตช์ DC</b> ต้องเป็นชนิด DC พิกัดแรงดัน <b>≥ Voc รวมของสตริงที่อุณหภูมิต่ำสุด</b> (DC ไม่มีจุดตัดศูนย์ ดับอาร์กยากกว่า AC)</li>
 <li><b>SPD</b> จำกัดแรงดันเกินชั่วขณะจากฟ้าผ่า/การสวิตช์ ลงดิน ติดทั้งฝั่ง DC (ใกล้อินเวอร์เตอร์) และฝั่ง AC (ตู้เมน) · <b>MCB / RCBO</b> ฝั่ง AC ป้องกันกระแสเกินและไฟรั่ว เลือกพิกัด ≥ 1.25 × กระแสพิกัดอินเวอร์เตอร์ (โหลดต่อเนื่อง) สายต้องรับกระแสได้ไม่น้อยกว่าพิกัดเบรกเกอร์</li>
 <li>ฟิวส์สตริงจำเป็นเมื่อ (จำนวนสตริง − 1) × Isc มากกว่าพิกัดฟิวส์สูงสุดของแผง ต้องใส่ทั้งขั้ว + และ − · ระบบบนอาคาร Voc ของอาร์เรย์ไม่เกิน 600 V (ร่างข้อกำหนด วสท. Solar PV Rooftop)</li></ul>`,
 w(el){b0Combiner(el)},
 q:[{q:'SPD (Surge Protective Device) มีหน้าที่อะไร',o:['ตัดไฟเมื่อกระแสเกินพิกัดต่อเนื่อง','จำกัดแรงดันเกินชั่วขณะจากฟ้าผ่าหรือการสวิตช์ โดยระบายลงดิน','วัดพลังงานที่ผลิตได้','เพิ่มแรงดันให้แผง'],a:1,ex:'การตัดกระแสเกินเป็นหน้าที่ของฟิวส์/เบรกเกอร์ SPD ต้องต่อลงดินจึงทำงานได้'},
  {q:'เลือกพิกัดแรงดันของเบรกเกอร์ DC สำหรับสตริงแผงอย่างไร',o:['เท่ากับ Vmp ของแผงเดียว','≥ Voc รวมของสตริงที่อุณหภูมิต่ำสุด','230 V เสมอ','เท่ากับแรงดันแบต'],a:1,ex:'อากาศเย็น Voc สูงขึ้น ต้องเผื่อค่าสูงสุดที่อาจเกิด'},
  {q:'ใช้เบรกเกอร์ AC แทนเบรกเกอร์ DC ในวงจรแผงได้หรือไม่',o:['ได้ เพราะพิกัดกระแสเท่ากัน','ไม่ควร เพราะ DC ไม่มีจุดตัดศูนย์ อาร์กดับยาก อาจไหม้','ได้ ถ้าต่อกลับขั้ว','ได้เฉพาะกลางวัน'],a:1,ex:'ใช้อุปกรณ์ที่ระบุพิกัด DC (V DC) และขั้วตามที่ผู้ผลิตกำหนด'}]},

{id:'t9',title:'การต่อลงดิน (Grounding)',desc:'ระบบสายดินเพื่อความปลอดภัยต่อผู้ใช้และอุปกรณ์',task:'ปักหลักดิน วัดด้วยเครื่องวัดความต้านทานดินได้ไม่เกิน 5 Ω แล้วต่อเข้าบาร์กราวด์ตู้เมน',
 intro:`<ul><li>สายดิน (PE) <b>สีเขียวแถบเหลือง</b> ต่อโครงโลหะทั้งหมด: กรอบแผง ราง อินเวอร์เตอร์ ตู้ไฟ เข้ากับหลักดิน (ประสานศักย์ / Bonding) เมื่อไฟรั่วลงโครง กระแสไหลผ่านสายดินทำให้เบรกเกอร์/RCD ตัดวงจร · SPD ทำงานได้ก็ต่อเมื่อมีสายดินที่ดี</li>
 <li><b>หลักดิน</b>: แท่งเหล็กหุ้มทองแดง แท่งทองแดง หรือเหล็กอาบสังกะสี Ø ไม่น้อยกว่า 16 มม. ยาวไม่น้อยกว่า 2.40 ม. ปักลึกไม่น้อยกว่า 2.40 ม. (มาตรฐานการติดตั้งทางไฟฟ้าฯ วสท.) · ค่าความต้านทานหลักดินกับดิน<b>ไม่เกิน 5 Ω</b> ถ้าเกินให้ปักหลักเพิ่มแล้ววัดใหม่ (พื้นที่ยากต่อการปฏิบัติ การไฟฟ้าฯ อาจยอมให้ไม่เกิน 25 Ω)</li>
 <li>ค่าขึ้นกับ<b>ชนิดและความชื้นของดิน</b>: ดินเหนียวต่ำ ทราย/ลูกรังสูงมาก ฤดูแล้งสูงกว่าฤดูฝน · ลดค่าได้ 2 แบบ: <b>เพิ่มหลักเว้นระยะ</b> (เช่น 3 หลักเป็นสามเหลี่ยม "เดลต้า" ระยะห่างอย่างน้อยเท่าความยาวหลัก) หรือ<b>ตอกหลักลึก</b> (ต่อแท่งด้วยข้อต่อ) ให้ถึงชั้นดินชื้น/ชั้นน้ำใต้ดิน</li>
 <li><b>วัดแบบ 3 ขั้ว (Fall-of-Potential)</b>: ปลดสายดินจากตู้เมนก่อน · E หนีบหลักดิน · ปักหลักช่วย P และ C ในแนวเส้นตรง C ห่างพอ (≥ 10 ม. และ ≥ 2.5 เท่าความยาวหลัก) · P ที่ราว <b>62%</b> ของระยะ E–C · ตรวจแรงดันดินก่อน (ไม่เกิน 3 V) แล้วเลือกย่าน Ω กดวัด · วัดเสร็จต่อสายดินกลับ</li></ul>`,
 w(el){b0Earth(el)},
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


/* ---- หัวข้อ 06: จำลองชาร์จคอนโทรลเลอร์ MPPT ตั้งค่าผ่านปุ่ม MENU ▲ ▼ OK แล้วดูขั้น CC → CV → Float ----
   ค่าต่อเซลล์ (ค่าประมาณเพื่อการสอน): ocv0/ocv1 = แรงดันเปิดวงจรที่ SOC 0/100 % · R = ความต้านทานภายในต่อเซลล์ที่ 100 Ah, 25 °C
   ce = ประสิทธิภาพคูลอมบ์ · อายุ: กฎประมาณ ร้อนขึ้นทุก 10 °C (ตะกั่วกรด) / 15 °C (ลิเธียม) อายุลดครึ่ง · tmax = BMS/ผู้ผลิตให้หยุดชาร์จเมื่อเกิน · whkg = พลังงานต่อน้ำหนัก (ใช้คิดมวลความร้อน) · tc = ชดเชยอุณหภูมิ V/°C/เซลล์ */
const B6T={
  lfp:{n:'LiFePO4 (LFP)',cell:3.2,cells:{12:4,24:8,48:16},ocv0:3.0,ocv1:3.36,R:.0045,ce:.99,tmax:55,tmin:0,whkg:120,tc:0,
    rec:{cv:3.55,fl:3.375,cvt:30,c:.3},max:{cv:3.65,fl:3.45,c:.5},min:{cv:3.45,fl:3.3}},
  nmc:{n:'ลิเธียม NMC',cell:3.7,cells:{12:3,24:7,48:13},ocv0:3.3,ocv1:4.15,R:.006,ce:.99,tmax:45,tmin:0,whkg:180,tc:0,
    rec:{cv:4.1,fl:4.0,cvt:30,c:.3},max:{cv:4.2,fl:4.1,c:.7},min:{cv:4.0,fl:3.9}},
  pb:{n:'ตะกั่วกรด (AGM)',cell:2,cells:{12:6,24:12,48:24},ocv0:1.983,ocv1:2.125,R:.005,ce:.9,tmax:50,tmin:-10,whkg:35,tc:-.003,
    rec:{cv:2.4,fl:2.267,cvt:120,c:.15},max:{cv:2.467,fl:2.3,c:.25},min:{cv:2.35,fl:2.2}}};
function b0ChgSim(el){
  const S={type:'lfp',sys:12,imax:10,cv:14.2,cvt:30,fl:13.5,ah:100,soc0:20,pan:2,g:850,ta:30,vent:'open',menu:-1,t:0,play:0,edited:false,seen:false,dirty:false};
  const M=[['type','ชนิดแบต'],['sys','แรงดันระบบ'],['ah','ความจุแบต'],['imax','กระแสชาร์จสูงสุด (CC)'],['cv','แรงดัน CV (Absorption)'],['cvt','เวลา CV'],['fl','แรงดัน Float']];
  const TY=()=>B6T[S.type],nc=()=>TY().cells[S.sys],vn=()=>TY().cell*nc();
  const fmt=key=>key==='type'?TY().n:key==='sys'?`${S.sys} V (${nc()} เซลล์ ${b0f(vn(),1)} V)`:key==='ah'?S.ah+' Ah':key==='imax'?`${S.imax} A (${b0f(S.imax/S.ah,2)}C)`:key==='cvt'?S.cvt+' นาที':`${b0f(S[key],1)} V (${b0f(S[key]/nc(),2)} V/เซลล์)`;
  const rec=()=>{const r=TY().rec,n=nc();S.cv=Math.round(r.cv*n*10)/10;S.fl=Math.round(r.fl*n*10)/10;S.cvt=r.cvt;S.imax=Math.max(5,Math.min(80,Math.round(S.ah*r.c/5)*5))};
  const step=(key,d)=>{
    if(key==='type'){const a=['lfp','nmc','pb'];S.type=a[(a.indexOf(S.type)+d+3)%3];rec()}
    else if(key==='sys'){const a=[12,24,48],o=nc();S.sys=a[(a.indexOf(S.sys)+d+3)%3];const r=nc()/o;S.cv=Math.round(S.cv*r*10)/10;S.fl=Math.round(S.fl*r*10)/10}
    else if(key==='ah')S.ah=Math.max(50,Math.min(400,S.ah+50*d));else if(key==='imax')S.imax=Math.max(5,Math.min(80,S.imax+5*d));
    else if(key==='cvt')S.cvt=Math.max(0,Math.min(240,S.cvt+15*d));else S[key]=Math.round((S[key]+.1*d)*10)/10};
  const checks=()=>{const T=TY(),n=nc(),c=S.imax/S.ah,cv=S.cv/n,fl=S.fl/n,out=[];
    if(cv>T.max.cv+1e-6)out.push(['err',`CV ${b0f(S.cv,1)} V (${b0f(cv,2)} V/เซลล์) สูงเกินสำหรับ ${T.n} (ไม่ควรเกิน ${b0f(T.max.cv*n,1)} V) ชาร์จเกิน แบตเสื่อม${S.type==='pb'?' เดือด/บวม':' BMS อาจตัด'}${S.type==='nmc'?' และเสี่ยงความร้อนสะสมสูง':''}`]);
    else if(cv<T.min.cv-1e-6)out.push(['warn',`CV ${b0f(S.cv,1)} V ต่ำไป แบตจะชาร์จไม่เต็ม`]);
    if(S.fl>=S.cv)out.push(['err','Float ต้องต่ำกว่า CV']);else if(fl>T.max.fl+1e-6)out.push(['warn',`Float ${b0f(S.fl,1)} V สูงไป แบตถูกชาร์จค้างตลอดเวลา`]);else if(fl<T.min.fl-1e-6)out.push(['warn',`Float ${b0f(S.fl,1)} V ต่ำไป แบตจะคายประจุเองช้า ๆ`]);
    if(c>T.max.c+1e-6)out.push(['err',`กระแส ${S.imax} A = ${b0f(c,2)}C เกินที่แนะนำสำหรับ ${T.n} (${T.max.c}C = ${b0f(T.max.c*S.ah,0)} A) แบตร้อน อายุสั้น`]);
    if(S.type==='pb'&&S.cvt<60)out.push(['warn','ตะกั่วกรดต้องการเวลา CV นานพอ (ราว 1–3 ชม.) จึงเต็มจริง']);
    if(S.type==='nmc'&&cv<4.15)out.push(['idle',`NMC ตั้ง CV ${b0f(cv,2)} V/เซลล์ (ต่ำกว่า 4.2) จะชาร์จได้ราว 85–90% แต่ช่วยยืดอายุแบต ถ้าต้องการเต็ม 100% ตั้ง 4.2 V/เซลล์`]);
    if(S.type!=='pb')out.push(['idle','แบตลิเธียมไม่ต้อง Float ค้างนาน ๆ ถ้าคอนโทรลเลอร์ปิด Float ได้ หรือตั้ง Float ต่ำพอให้แบตไม่ถูกชาร์จค้าง อายุจะยืนกว่า']);
    return out};
  /* 1-minute steps over 8 h: electrical + lumped thermal model */
  const sim=()=>{const T=TY(),n=nc(),Ah=S.ah,c=b0Curve(S.g,45),ppv=c.mp.P*S.pan*.97;
    const Rp=T.R*n*(100/Ah),mass=vn()*Ah/T.whkg,Cth=mass*(S.type==='pb'?700:1000),hA=(S.vent==='open'?.9:S.vent==='fan'?2.2:.35)*Math.pow(mass,2/3);
    let soc=S.soc0/100,st='cc',cvm=0,Tb=S.ta,hot=false,Ein=0,Est=0,Eh=0,Tmx=Tb,Tsum=0;const out=[];
    for(let m=0;m<=480;m++){
      const f=S.type==='pb'?Math.pow(soc,.8):S.type==='nmc'?(.05+.9*soc+.05*Math.pow(soc,6)):(.15+.7*soc+.15*Math.pow(soc,8));
      const ocv=(T.ocv0+(T.ocv1-T.ocv0)*f)*n;
      const Rr=Rp*(1+.025*Math.max(-20,25-Tb))*(S.type==='pb'?1+6*Math.pow(soc,6):1+3*Math.pow(soc,10));
      const comp=T.tc*(Tb-25)*n,cvV=S.cv+comp,flV=S.fl+comp;
      if(hot&&Tb<T.tmax-5)hot=false;if(Tb>=T.tmax)hot=true;
      let I=0,V=ocv,ph=st;
      if(hot){ph='hot'}
      else{
        if(st==='cc'){I=Math.min(S.imax,ppv/Math.max(1,ocv));V=ocv+I*Rr;if(V>=cvV){st='cv';ph='cv';V=cvV;I=Math.max(0,(cvV-ocv)/Rr)}}
        else if(st==='cv'){V=cvV;I=Math.max(0,Math.min(S.imax,ppv/cvV,(cvV-ocv)/Rr));cvm++;if(cvm>=S.cvt||I<Ah*.02)st='fl'}
        if(st==='fl'){ph='fl';V=flV;I=Math.max(0,Math.min(S.imax,ppv/flV,(flV-ocv)/Rr))}
        if(V<ocv)V=ocv}
      /* heat: I²R + extra loss near full for lead-acid (gassing) */
      const ce=S.type==='pb'?(soc<.8?.95:.95-.5*(soc-.8)):T.ce,Pq=I*I*Rr+(1-ce)*I*ocv;
      out.push({m,st:ph,V,I,soc,Tb,P:V*I,Pq});
      Ein+=V*I/60;Est+=ocv*I*ce/60;Eh+=Pq/60;
      Tb+=(Pq-hA*(Tb-S.ta))*60/Cth;Tmx=Math.max(Tmx,Tb);Tsum+=Tb;
      soc=Math.min(1,soc+I/60/Ah*ce);
    }
    return{out,ppv,Ein,Est,Eh,Tmx,Tavg:Tsum/481,mass,hA}};
  const SC={cc:['CC (Bulk)','#ffe2b8'],cv:['CV (Absorption)','#d7ecff'],fl:['Float','#d9f2df'],hot:['หยุด: ร้อนเกิน','#ffd0cc']};
  el.innerHTML=`<h3 class="b6h">ตั้งค่าชาร์จคอนโทรลเลอร์ และขั้นตอนชาร์จ CC → CV → Float</h3>
   <p class="hint tight">กด <b>MENU</b> บนเครื่องเพื่อเข้าตั้งค่า กด MENU ซ้ำเพื่อไปหัวข้อถัดไป ใช้ <b>▲ ▼</b> ปรับค่า กด <b>OK</b> เพื่อบันทึกและกลับหน้าหลัก จากนั้นกด ▶ เพื่อดูการชาร์จตามเวลา · ลองตั้งกระแสสูงในที่อับอากาศ แล้วดูอุณหภูมิแบต</p>
   <div class="eqact"><button class="chip" id="b6rec" type="button">ใช้ค่าแนะนำของแบตชนิดนี้</button><button class="chip" id="b6play" type="button">▶ เล่นการชาร์จ</button><button class="chip" id="b6rst" type="button">⟲ เริ่มใหม่</button>
    ${b0Sel('b6pan','แผง',[['1','1 แผง'],['2','2 แผง'],['3','3 แผง'],['4','4 แผง']],'2')}${b0Sel('b6soc','SOC เริ่มต้น',[['10','10%'],['20','20%'],['50','50%'],['80','80%']],'20')}${b0Sel('b6sun','แสง',[['400','400 W/m²'],['650','650 W/m²'],['850','850 W/m²'],['1000','1000 W/m²']],'850')}
    ${b0Sel('b6ta','อุณหภูมิห้องที่วางแบต',[['15','15 °C'],['25','25 °C'],['30','30 °C'],['35','35 °C'],['40','40 °C']],'30')}${b0Sel('b6vent','การระบายความร้อน',[['closed','ตู้ปิดทึบ'],['open','วางในที่โล่ง'],['fan','มีพัดลมระบาย']],'open')}</div>
   <div class="b0scn"><svg id="b6svg" viewBox="0 0 1100 470" role="img" aria-label="ชาร์จคอนโทรลเลอร์ แบตเตอรี่ และกราฟการชาร์จ"><g id="b6ch"></g><g id="b6dev"></g></svg></div>
   <div id="b6kv"></div><div id="b6ck"></div><p class="b0msg" id="b6msg"></p>`;
  const $q=x=>el.querySelector(x),svg=$q('#b6svg');let R=sim();
  const at=()=>R.out[Math.min(R.out.length-1,Math.round(S.t))];
  function chart(){
    const X0=48,X1=520,Y0=30,Y1=380,o=R.out,vmin=Math.floor(TY().ocv0*nc()*.95),vmax=Math.ceil(Math.max(S.cv,TY().max.cv*nc())*1.02),imx=Math.max(10,Math.ceil(Math.max(S.imax,...o.map(p=>p.I))/10)*10);
    const X=m=>X0+m/480*(X1-X0),YV=v=>Y1-(v-vmin)/(vmax-vmin)*(Y1-Y0),YI=i=>Y1-i/imx*(Y1-Y0),YS=sc=>Y1-sc*(Y1-Y0),YT=t=>Y1-(t-10)/70*(Y1-Y0);
    let g=`<rect x="6" y="4" width="570" height="440" rx="10" fill="var(--surface)" stroke="var(--line)"/>`;
    let a=0;for(let m=1;m<=o.length;m++){if(m===o.length||o[m].st!==o[a].st){g+=`<rect x="${X(a)}" y="${Y0}" width="${(X(m-1)-X(a)).toFixed(1)}" height="${Y1-Y0}" fill="${SC[o[a].st][1]}" opacity=".8"/>`;{const w=X(m-1)-X(a);if(w>14)g+=`<text x="${((X(a)+X(m-1))/2).toFixed(1)}" y="${Y0+16}" text-anchor="middle" font-size="12" font-weight="700" fill="#37474f">${w>110?SC[o[a].st][0]:o[a].st==='fl'?'Float':o[a].st==='hot'?'ร้อน':o[a].st.toUpperCase()}</text>`}a=m}}
    for(let h=0;h<=8;h++)g+=`<line x1="${X(h*60)}" x2="${X(h*60)}" y1="${Y0}" y2="${Y1}" class="b0grid"/><text x="${X(h*60)}" y="${Y1+16}" text-anchor="middle" class="b0ax">${h}</text>`;
    for(let q=0;q<=4;q++){const y=Y0+(Y1-Y0)*q/4;g+=`<text x="${X0-6}" y="${y+4}" text-anchor="end" class="b0ax">${b0f(vmax-(vmax-vmin)*q/4,1)}</text><text x="${X1+6}" y="${y+4}" class="b0ax">${b0f(imx*(4-q)/4,0)}</text>`}
    g+=`<text x="${(X0+X1)/2}" y="${Y1+34}" text-anchor="middle" class="b0ax">เวลา (ชั่วโมง)</text><text x="14" y="${(Y0+Y1)/2}" class="b0ax" transform="rotate(-90 14 ${(Y0+Y1)/2})" text-anchor="middle">แรงดันแบต (V)</text><text x="566" y="${(Y0+Y1)/2}" class="b0ax" transform="rotate(90 566 ${(Y0+Y1)/2})" text-anchor="middle">กระแสชาร์จ (A)</text>`;
    const pl=(f,col,d,w)=>`<polyline fill="none" stroke="${col}" stroke-width="${w||2.6}" ${d?'stroke-dasharray="6 4"':''} points="${o.map(p=>X(p.m).toFixed(1)+','+f(p).toFixed(1)).join(' ')}"/>`;
    g+=`<line x1="${X0}" x2="${X1}" y1="${YV(S.cv)}" y2="${YV(S.cv)}" stroke="#1565c0" stroke-dasharray="2 3"/><text x="${X0+4}" y="${YV(S.cv)-4}" font-size="10" fill="#1565c0">CV ${b0f(S.cv,1)} V</text>`;
    g+=`<line x1="${X0}" x2="${X1}" y1="${YV(S.fl)}" y2="${YV(S.fl)}" stroke="#2e7d32" stroke-dasharray="2 3"/><text x="${X0+4}" y="${YV(S.fl)+12}" font-size="10" fill="#2e7d32">Float ${b0f(S.fl,1)} V</text>`;
    g+=`<line x1="${X0}" x2="${X1}" y1="${YT(TY().tmax)}" y2="${YT(TY().tmax)}" stroke="#c62828" stroke-dasharray="1 3"/><text x="${X1-4}" y="${YT(TY().tmax)-4}" text-anchor="end" font-size="10" fill="#c62828">จำกัด ${TY().tmax} °C</text>`;
    const cl=v=>Math.max(vmin,Math.min(vmax,v));
    g+=pl(p=>YV(cl(p.V)),'var(--s1)')+pl(p=>YI(Math.min(imx,p.I)),'var(--s2)',1)+pl(p=>YS(p.soc),'#43a047')+pl(p=>YT(Math.max(10,Math.min(80,p.Tb))),'#e53935',0,2);
    const c=at(),cx=X(c.m);g+=`<line x1="${cx}" x2="${cx}" y1="${Y0}" y2="${Y1}" stroke="var(--ink)" stroke-width="1.5"/><circle cx="${cx}" cy="${YV(cl(c.V))}" r="5" fill="var(--s1)"/><circle cx="${cx}" cy="${YI(Math.min(imx,c.I))}" r="5" fill="var(--s2)"/><circle cx="${cx}" cy="${YT(Math.max(10,Math.min(80,c.Tb)))}" r="4" fill="#e53935"/>`;
    g+=`<g transform="translate(${X0+6} ${Y1-58})" font-size="11"><rect x="-4" y="-12" width="372" height="20" rx="4" fill="var(--surface)" opacity=".9"/><line x1="0" x2="18" y1="-2" y2="-2" stroke="var(--s1)" stroke-width="3"/><text x="22" y="2">แรงดัน</text><line x1="70" x2="88" y1="-2" y2="-2" stroke="var(--s2)" stroke-width="3" stroke-dasharray="5 3"/><text x="92" y="2">กระแส</text><line x1="140" x2="158" y1="-2" y2="-2" stroke="#43a047" stroke-width="3"/><text x="162" y="2">SOC 0–100%</text><line x1="246" x2="264" y1="-2" y2="-2" stroke="#e53935" stroke-width="2"/><text x="268" y="2">อุณหภูมิแบต 10–80 °C</text></g>`;
    g+=`<rect id="b6track" x="${X0}" y="${Y0}" width="${X1-X0}" height="${Y1-Y0}" fill="transparent" style="cursor:ew-resize"/>`;
    $q('#b6ch').innerHTML=g}
  function device(){
    const c=at(),T=TY(),lcd=S.menu<0?[`${SC[c.st][0]}`,`BAT ${b0f(c.V,1)} V  ${b0f(c.I,1)} A`,`SOC ${b0f(c.soc*100,0)}%  แบต ${b0f(c.Tb,0)} °C`,`เวลา ${Math.floor(c.m/60)}:${String(c.m%60).padStart(2,'0')} · PV ${b0f(R.ppv,0)} W`]
      :[`ตั้งค่า ${S.menu+1}/${M.length}`,M[S.menu][1],`▲▼ ${fmt(M[S.menu][0])}`,'MENU = ถัดไป · OK = บันทึก'];
    const flow=c.I>0.2,hotC=c.Tb>=T.tmax-5;
    let g=`${B0G.sun(640,52,22,S.g/1000)}${B0G.panel(686,40,70,96)}${S.pan>1?B0G.panel(762,40,70,96):''}${S.pan>2?B0G.panel(838,40,70,96):''}${S.pan>3?B0G.panel(914,40,70,96):''}
     <path d="M720 136V170H780" fill="none" stroke="#d62828" stroke-width="5" ${R.ppv>0?'stroke-dasharray="8 6"':''}/><path d="M734 136V160H780" fill="none" stroke="#2b3138" stroke-width="5"/><text x="660" y="190" font-size="11" fill="var(--muted)">PV ${b0f(R.ppv,0)} W</text>
     <rect x="780" y="140" width="210" height="226" rx="14" fill="#1f3b5a" stroke="#0f2236" stroke-width="3"/><text x="885" y="160" text-anchor="middle" font-size="11" font-weight="700" fill="#cfe3f7">MPPT CHARGE CONTROLLER</text>
     <rect x="796" y="168" width="178" height="92" rx="6" fill="${c.st==='hot'?'#e57373':'#3a8be0'}" stroke="#0f2236" stroke-width="2"/>
     ${lcd.map((l,i)=>`<text x="804" y="${188+i*21}" font-size="${i?(S.menu>=0&&i===2?11:12.5):14}" font-weight="${i?500:700}" font-family="monospace" fill="#fff">${esc(l)}</text>`).join('')}
     <circle cx="808" cy="276" r="6" fill="${(c.st==='cc'||c.st==='cv')&&flow?'#66ff8a':'#3b4b5c'}"/><text x="818" y="280" font-size="10" fill="#cfe3f7">CHG</text><circle cx="860" cy="276" r="6" fill="${c.st==='fl'?'#66ff8a':'#3b4b5c'}"/><text x="870" y="280" font-size="10" fill="#cfe3f7">FLOAT</text><circle cx="924" cy="276" r="6" fill="${c.st==='hot'?'#ff5252':'#3b4b5c'}"/><text x="934" y="280" font-size="10" fill="#cfe3f7">TEMP</text>
     ${[['MENU',812],['▲',864],['▼',912],['OK',958]].map(([t,x])=>`<g class="b6btn" data-b="${t}" role="button" tabindex="0" aria-label="ปุ่ม ${t}"><rect x="${x-22}" y="298" width="44" height="34" rx="8" fill="#e8eef4" stroke="#0f2236" stroke-width="2"/><text x="${x}" y="320" text-anchor="middle" font-size="${t.length>2?11:15}" font-weight="700" fill="#0f2236">${t}</text></g>`).join('')}
     <text x="885" y="356" text-anchor="middle" font-size="10" fill="#9fb8d1">PV ⎓ · BAT ⎓ · LOAD</text>
     <path d="M870 366V392H900" fill="none" stroke="#d62828" stroke-width="5" ${flow?'stroke-dasharray="8 6"':''}/><path d="M900 366V384H920" fill="none" stroke="#2b3138" stroke-width="5"/>
     ${hotC?`<circle cx="980" cy="400" r="${60+Math.min(20,(c.Tb-T.tmax+5)*3)}" fill="#ff7043" opacity=".25"/>`:''}
     ${B0G.battery(920,350,120,100,c.soc,c.soc>.8?'#43c46b':c.soc>.4?'#f0c330':'#ef6c4c')}<text x="980" y="412" text-anchor="middle" font-size="16" font-weight="700" fill="#fff">${b0f(c.soc*100,0)}%</text>
     ${B0G.thermo(1062,350,92,Math.max(0,Math.min(1,(c.Tb-10)/70)))}<text x="1062" y="462" text-anchor="middle" font-size="11" font-weight="700" fill="${hotC?'#c62828':'var(--ink)'}">${b0f(c.Tb,0)} °C</text>
     <text x="960" y="466" text-anchor="middle" font-size="11" fill="var(--muted)">${esc(T.n)} ${S.sys} V ${S.ah} Ah</text>`;
    $q('#b6dev').innerHTML=g}
  function report(){
    const ck=checks(),o=R.out,T=TY(),fl=o.find(p=>p.st==='fl'),cv=o.find(p=>p.st==='cv'),hot=o.filter(p=>p.st==='hot').length;
    const cr=S.imax/S.ah,life=Math.max(5,Math.min(130,100*Math.pow(2,-(R.Tavg-25)/(S.type==='pb'?10:15))*(1-Math.max(0,cr-T.rec.c)*.9)*(R.Tmx>T.tmax?.85:1)));
    const effC=R.Ein>0?R.Est/R.Ein*100:0;
    $q('#b6kv').innerHTML=b0Kv([['อุณหภูมิแบตสูงสุด',`${b0f(R.Tmx,1)} °C`,R.Tmx>=T.tmax?'err':R.Tmx>=T.tmax-10?'warn':''],['อุณหภูมิแบตเฉลี่ย (8 ชม.)',`${b0f(R.Tavg,1)} °C`],
      ['ความร้อนสูญเสียในแบต',`${b0f(R.Eh,0)} Wh`],['พลังงานที่ชาร์จเข้า / เก็บได้',`${b0f(R.Ein,0)} / ${b0f(R.Est,0)} Wh`],['ประสิทธิภาพการชาร์จ',`${b0f(effC,1)} %`,effC<88?'warn':''],
      ['เวลาที่ BMS หยุดชาร์จเพราะร้อน',hot?`${(hot/60).toFixed(1)} ชม.`:'ไม่มี',hot?'err':''],['ดัชนีอายุแบตโดยประมาณ (เทียบ 25 °C + กระแสแนะนำ = 100%)',`${b0f(life,0)} %`,life<70?'warn':life>=95?'ok':''],
      ['มวลแบตโดยประมาณ / การระบายความร้อน',`${b0f(R.mass,0)} kg · ${S.vent==='closed'?'ตู้ปิดทึบ':S.vent==='fan'?'พัดลม':'ที่โล่ง'}`]]);
    $q('#b6ck').innerHTML=`<ul class="checks">${(ck.filter(c=>c[0]!=='idle').length?ck:[['ok',`ค่าที่ตั้งเหมาะกับ ${T.n}: CC ${S.imax} A (${b0f(cr,2)}C) · CV ${b0f(S.cv,1)} V · Float ${b0f(S.fl,1)} V`]].concat(ck)).map(([l,t])=>`<li><span class="b ${l}">${l==='ok'?'✓':l==='warn'?'!':l==='idle'?'i':'✗'}</span><span>${esc(t)}</span></li>`).join('')}
      ${T.tc?`<li><span class="b idle">i</span><span>ตะกั่วกรด: คอนโทรลเลอร์ชดเชยอุณหภูมิ ${T.tc*1000} mV/°C/เซลล์ (แบตร้อนขึ้น แรงดัน CV/Float ลดลงเอง)</span></li>`:''}
      ${R.Tmx>=T.tmax?`<li><span class="b err">✗</span><span>แบตร้อนถึง ${T.tmax} °C BMS/คอนโทรลเลอร์หยุดชาร์จจนเย็นลง ลดกระแสชาร์จ เพิ่มการระบายความร้อน หรือย้ายแบตไปที่เย็นกว่า</span></li>`:''}</ul>`;
    const bad=ck.some(c=>c[0]==='err')||R.Tmx>=T.tmax,good=!bad&&!!fl,ok=good&&S.edited&&S.seen;
    const txt=!cv&&hot?`BMS หยุดชาร์จเพราะแบตร้อนถึง ${T.tmax} °C รวม ${(hot/60).toFixed(1)} ชม. ชาร์จไม่เต็ม`:!cv?`ใน 8 ชม. ยังไม่ถึง CV (PV ${b0f(R.ppv,0)} W ไม่พอ หรือกระแสตั้งไว้ต่ำ) ลองเพิ่มแผง แสง หรือกระแส`:
      !fl?`เข้า CV ที่ ${(cv.m/60).toFixed(1)} ชม. แต่ยังไม่เข้า Float ใน 8 ชม.`:`เข้า CV ที่ ${(cv.m/60).toFixed(1)} ชม. (SOC ${b0f(cv.soc*100,0)}%) และเข้า Float ที่ ${(fl.m/60).toFixed(1)} ชม. (SOC ${b0f(fl.soc*100,0)}%)`;
    b0Msg($q('#b6msg'),ok?true:bad?false:null,txt+(ok?' · ภารกิจสำเร็จ':bad?' · แก้ค่าที่ผิด (หรือความร้อนเกิน) ก่อน ภารกิจจึงผ่าน':!S.edited?' · ภารกิจ: ตั้งค่าผ่านปุ่ม MENU ▲ ▼ แล้วกด OK':good&&!S.seen?' · กด ▶ เล่นการชาร์จให้ถึงช่วง Float':''));
    if(ok)b0Task('t6',true)}
  const all=()=>{R=sim();chart();device();report()};
  const view=()=>{chart();device();const o=R.out.find(p=>p.st==='fl');if(o&&S.t>=o.m&&!S.seen){S.seen=true;report()}};
  const press=b=>{if(b==='MENU'){S.menu=(S.menu+1)%M.length}else if(b==='OK'){if(S.menu>=0&&S.dirty)S.edited=true;S.dirty=false;S.menu=-1;S.t=0;S.seen=false;all();return}else if(S.menu>=0){step(M[S.menu][0],b==='▲'?1:-1);S.dirty=true;S.t=0;S.seen=false;all();return}view()};
  svg.addEventListener('click',e=>{const g=e.target.closest('.b6btn');if(g)press(g.dataset.b)});
  svg.addEventListener('keydown',e=>{const g=e.target.closest('.b6btn');if(g&&(e.key==='Enter'||e.key===' ')){e.preventDefault();press(g.dataset.b);const n=svg.querySelector(`.b6btn[data-b="${g.dataset.b}"]`);if(n)n.focus()}});
  const pt=e=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse())};
  let scrub=false;const scrubTo=e=>{const x=pt(e).x;S.t=Math.max(0,Math.min(480,(x-48)/(520-48)*480));view()};
  svg.addEventListener('pointerdown',e=>{if(e.target.id!=='b6track')return;scrub=true;try{svg.setPointerCapture(e.pointerId)}catch(_){}scrubTo(e)});
  svg.addEventListener('pointermove',e=>{if(scrub)scrubTo(e)});svg.addEventListener('pointerup',()=>{scrub=false});
  const tick=()=>{if(!S.play)return;S.t+=3;if(S.t>=480){S.t=480;S.play=0;$q('#b6play').textContent='▶ เล่นการชาร์จ'}view();if(S.play)S.play=requestAnimationFrame(tick)};
  $q('#b6play').addEventListener('click',()=>{if(S.play){cancelAnimationFrame(S.play);S.play=0;$q('#b6play').textContent='▶ เล่นการชาร์จ';return}if(S.t>=480)S.t=0;S.menu=-1;$q('#b6play').textContent='⏸ หยุด';S.play=requestAnimationFrame(tick)});
  $q('#b6rst').addEventListener('click',()=>{S.t=0;view()});
  $q('#b6rec').addEventListener('click',()=>{rec();S.edited=true;S.t=0;S.seen=false;all()});
  [['b6pan','pan',1],['b6soc','soc0',1],['b6sun','g',1],['b6ta','ta',1],['b6vent','vent',0]].forEach(([id,key,num])=>$q('#'+id).addEventListener('change',e=>{S[key]=num?+e.target.value:e.target.value;S.t=0;S.seen=false;all()}));
  all();
}


/* ---- หัวข้อ 08: ตู้คอมไบเนอร์จำลอง (DC + AC) ลากอุปกรณ์ลงรางปีกนก ต่อสาย แล้วตรวจตามเกณฑ์ ----
   เกณฑ์ทั้งหมดรวมไว้ที่ B8R (แก้ค่าได้ที่นี่ที่เดียว) อ้างอิง:
   · วสท. (ร่าง) ข้อกำหนดการติดตั้ง Solar PV Rooftop ข้อ 3.1 / 3.3 (ฟิวส์สตริง สมการ 3.1–3.4, Voc array บนอาคาร ≤ 600 V, แรงดันตก ≤ 3%)
   · มาตรฐานการติดตั้งทางไฟฟ้าสำหรับประเทศไทย (วสท. 2001-64) ฝั่ง AC: เบรกเกอร์/สายสำหรับโหลดต่อเนื่อง 125 %, สายดิน, RCD
   · IEC 62548 (ที่ วสท. อ้างถึง) สำหรับสวิตช์ตัดตอน DC, ขนาดสาย DC 1.25 × Isc, SPD DC
   ค่าในตารางเป็นค่าที่ใช้สอน ตรวจกับตัวเล่มมาตรฐานฉบับที่ใช้จริงทุกครั้ง */
const B8R={
  vocBldMax:600,           /* วสท. ร่าง ข้อ 3.1: Voc array บนอาคาร ≤ 600 V */
  fuseLo:1.5,fuseHi:2.4,   /* วสท. ร่าง สมการ 3.2–3.4: 1.5 Isc < In < 2.4 Isc และ In ≤ IMOD MAX OCPR */
  dcCable:1.25,            /* IEC 62548: สาย DC ≥ 1.25 × Isc ของวงจรนั้น */
  dcSwI:1.25,              /* สวิตช์ตัดตอน DC: กระแส ≥ 1.25 × Isc array, แรงดัน ≥ Voc max ตัดทั้ง + และ − */
  spdK:1.2,                /* SPD DC: Ucpv ≥ Voc max (ต้อง) และแนะนำ ≥ 1.2 × Voc max */
  acCont:1.25,             /* วสท. 2001-64: โหลดต่อเนื่อง เบรกเกอร์ ≥ 1.25 × กระแสพิกัดอินเวอร์เตอร์ */
  acUcMin:253,             /* SPD AC: Uc ≥ 1.1 × 230 V */
  peMin:6,                 /* สายดินของ SPD / สายประสานกรอบแผง แนะนำ ≥ 6 mm² */
  ampDC:{2.5:30,4:40,6:50,10:70,16:95},   /* สาย PV (H1Z2Z2-K/PV1-F) เดินในตู้/ท่อ ค่าประมาณสำหรับสอน */
  ampAC:{2.5:21,4:28,6:36,10:50,16:68}    /* สาย IEC 01 ในท่อ ค่าประมาณสำหรับสอน */
};
const B8D={
  fuse:{n:'ฟิวส์ DC 1P',side:'dc',w:1,poles:1,opt:{A:[10,15,20,25,32]},V:1000,sym:'fuse',col:'#f4f6f8'},
  dcsw:{n:'สวิตช์ตัดตอน DC 2P',side:'dc',w:2,poles:2,opt:{A:[16,25,32,40,63],V:[500,1000]},sym:'iso',col:'#ffd54f'},
  dcspd:{n:'SPD DC Type 2',side:'dc',w:2,poles:2,pe:true,opt:{V:[500,600,1000]},sym:'spd',col:'#eceff1'},
  mcb:{n:'เบรกเกอร์ AC 2P (MCB)',side:'ac',w:2,poles:2,opt:{A:[16,20,25,32,40]},sym:'cb',col:'#f4f6f8'},
  rcbo:{n:'RCBO 2P 30 mA',side:'ac',w:2,poles:2,opt:{A:[25,32,40],T:['A','B']},sym:'rcd',col:'#f4f6f8'},
  acspd:{n:'SPD AC Type 2',side:'ac',w:2,poles:2,pe:true,opt:{V:[150,275,385]},sym:'spd',col:'#eceff1'}};
const B8INV={P:5000,Iac:22.7,Vmax:600,Imppt:40,rcdA:true};

function b0Combiner(el){
  const U=44,H=116,X0=460,RAIL={dc:205,ac:440},SLOTS=10,PEY=640,PEX=[470,510,550,590,630,670,710,750];
  const S={SA:2,M:10,tmin:10,dev:[],wires:[],nid:1,sel:null,ws:4,pick:{},drag:null,ex:false,G:1000,vg:230,load:3000,fx:null,inv:''};
  Object.keys(B8D).forEach(k=>{S.pick[k]={};Object.keys(B8D[k].opt).forEach(o=>S.pick[k][o]=B8D[k].opt[o][Math.floor(B8D[k].opt[o].length/2)])});
  const P=B0P,vocMax=()=>P.Voc*(1+P.bV/100*(S.tmin-25))*S.M,iscA=()=>P.Isc*S.SA,fuseReq=()=>(S.SA-1)*P.Isc>P.fuse;
  /* ---- fixed terminals ---- */
  const FIX=()=>{const f={};for(let s=1;s<=4;s++){f[`S${s}+`]={x:448+(s-1)*84+0,y:92,r:'+',lab:`S${s}+`,on:s<=S.SA};f[`S${s}-`]={x:448+(s-1)*84+36,y:92,r:'-',lab:`S${s}−`,on:s<=S.SA}}
    Object.assign(f,{'INV+':{x:1000,y:330,r:'+',lab:'DC+'},'INV-':{x:1036,y:330,r:'-',lab:'DC−'},'INVL':{x:1090,y:330,r:'L',lab:'L'},'INVN':{x:1124,y:330,r:'N',lab:'N'},'INVPE':{x:1158,y:330,r:'PE',lab:'PE'},
      'GL':{x:1070,y:600,r:'L',lab:'L'},'GN':{x:1110,y:600,r:'N',lab:'N'},'GPE':{x:1150,y:600,r:'PE',lab:'PE'},'FR':{x:300,y:700,r:'PE',lab:'กรอบแผง'}});
    PEX.forEach((x,i)=>f['E'+i]={x,y:PEY,r:'PE',lab:''});return f};
  const devX=d=>X0+d.slot*U,devY=d=>RAIL[d.rail]-H/2;
  const tpos=id=>{const F=FIX();if(F[id])return F[id];const[di,t]=id.split('.'),d=S.dev.find(x=>x.id===+di);if(!d)return null;const D=B8D[d.type],x=devX(d),y=devY(d);
    if(t==='pe')return{x:x+D.w*U/2,y:y+H-12};const i=+t.slice(1);return{x:x+i*U+U/2,y:t[0]==='t'?y+12:y+H-12}};
  const terms=d=>{const D=B8D[d.type],a=[];for(let i=0;i<D.poles;i++){a.push(`${d.id}.t${i}`);if(!D.pe)a.push(`${d.id}.b${i}`)}if(D.pe)a.push(`${d.id}.pe`);return a};
  const role=id=>{const F=FIX();if(F[id])return F[id].r;const[di,t]=id.split('.'),d=S.dev.find(x=>x.id===+di);if(!d)return '';if(t==='pe')return'PE';const D=B8D[d.type];
    if(D.side==='ac')return t.slice(1)==='0'?'L':'N';if(D.poles===2)return t.slice(1)==='0'?'+':'-';return''};
  const WCOL={'+':'#d62828','-':'#20252a',L:'#8b5a2b',N:'#2a78d6',PE:'#1baf7a'};
  /* ---- connectivity ---- */
  const nets=(skip)=>{const par={},f=x=>{if(par[x]===undefined)par[x]=x;while(par[x]!==x){par[x]=par[par[x]];x=par[x]}return x},u=(a,b)=>{par[f(a)]=f(b)};
    PEX.forEach((_,i)=>u('E'+i,'E0'));
    S.wires.forEach(w=>u(w.a,w.b));
    S.dev.forEach(d=>{if(skip&&skip(d))return;const D=B8D[d.type];if(D.pe)return;for(let i=0;i<D.poles;i++)u(`${d.id}.t${i}`,`${d.id}.b${i}`)});
    return f};
  const conn=(a,b,skip)=>{const f=nets(skip);return f(a)===f(b)};
  /* ---- checks ---- */
  function check(){
    const out=[],add=(l,t)=>out.push([l,t]),vm=vocMax(),ia=iscA(),f=nets(),act=[];for(let s=1;s<=S.SA;s++)act.push(s);
    add(vm>B8R.vocBldMax?'err':'ok',`Voc สูงสุดของสตริงที่ ${S.tmin} °C = ${P.Voc} × (1 + ${P.bV}% × (${S.tmin}−25)) × ${S.M} = ${b0f(vm,0)} V ${vm>B8R.vocBldMax?`เกิน ${B8R.vocBldMax} V ที่ วสท. กำหนดสำหรับระบบบนอาคาร ลดจำนวนแผงต่อสตริง`:`ไม่เกิน ${B8R.vocBldMax} V (บนอาคาร) และอินเวอร์เตอร์รับได้ ${B8INV.Vmax} V`}`);
    /* DC paths */
    let dcOk=true;
    act.forEach(s=>{const p=conn(`S${s}+`,'INV+'),n=conn(`S${s}-`,'INV-');
      if(conn(`S${s}+`,'INV-')||conn(`S${s}-`,'INV+')){add('err',`สตริง ${s} ต่อสลับขั้ว (+ ไป DC− หรือ − ไป DC+)`);dcOk=false}
      else if(!p||!n){add('err',`สตริง ${s}: ${!p?'ขั้ว + ':''}${!p&&!n?'และ ':''}${!n?'ขั้ว − ':''}ยังไปไม่ถึงอินเวอร์เตอร์`);dcOk=false}});
    if(f('INV+')===f('INV-')){add('err','ลัดวงจร: DC+ กับ DC− ต่อถึงกัน');dcOk=false}
    if(S.wires.some(w=>{const r1=role(w.a),r2=role(w.b);return(r1==='+'&&r2==='-')||(r1==='-'&&r2==='+')}))add('err','มีสายต่อขั้ว + เข้ากับขั้ว − ของอุปกรณ์');
    const dcDev=S.dev.filter(d=>d.rail==='dc'),acDev=S.dev.filter(d=>d.rail==='ac');
    if(S.dev.some(d=>B8D[d.type].side!==d.rail))add('err',S.dev.filter(d=>B8D[d.type].side!==d.rail).map(d=>`${B8D[d.type].n} อยู่ผิดราง (${d.rail==='dc'?'ราง DC':'ราง AC'})`).join(' · ')+' · อุปกรณ์ AC ดับอาร์กไฟ DC ไม่ได้ และอุปกรณ์ DC ไม่ได้ออกแบบมาสำหรับไฟ AC');
    /* DC switch */
    const sws=dcDev.filter(d=>d.type==='dcsw');
    if(!sws.length)add('err','ยังไม่มีสวิตช์ตัดตอน DC (ต้องตัดได้ทั้งขั้ว + และ − ก่อนเข้าอินเวอร์เตอร์)');
    else{const allBroken=act.every(s=>!conn(`S${s}+`,'INV+',d=>d.type==='dcsw')&&!conn(`S${s}-`,'INV-',d=>d.type==='dcsw'));
      add(allBroken?'ok':'err',allBroken?'สวิตช์ตัดตอน DC อยู่ในเส้นทางของทุกสตริง ตัดได้ทั้ง + และ −':'มีบางสตริงหรือบางขั้วที่ไม่ผ่านสวิตช์ตัดตอน DC (เปิดสวิตช์แล้วยังมีไฟเข้าอินเวอร์เตอร์)');
      sws.forEach(d=>{const okV=d.o.V>=vm,okI=d.o.A>=B8R.dcSwI*ia;add(okV&&okI?'ok':'err',`สวิตช์ DC ${d.o.A} A ${d.o.V} V: ${okV?'แรงดันพอ':`แรงดันต่ำกว่า Voc สูงสุด ${b0f(vm,0)} V`} · ${okI?`กระแสพอ (≥ ${B8R.dcSwI} × ${b0f(ia,1)} = ${b0f(B8R.dcSwI*ia,1)} A)`:`กระแสต้อง ≥ ${b0f(B8R.dcSwI*ia,1)} A`}`)})}
    /* fuses */
    const fus=dcDev.filter(d=>d.type==='fuse'),need=fuseReq();
    add(need?'idle':'idle',`ต้องมีฟิวส์สตริงหรือไม่: (จำนวนสตริง − 1) × Isc = (${S.SA} − 1) × ${P.Isc} = ${b0f((S.SA-1)*P.Isc,1)} A ${need?'>':'≤'} พิกัดฟิวส์สูงสุดของแผง ${P.fuse} A → ${need?'ต้องมีฟิวส์ทุกสตริง':'ไม่บังคับ (ใส่ได้)'}`);
    if(need){const okAll=act.every(s=>!conn(`S${s}+`,'INV+',d=>d.type==='fuse')&&!conn(`S${s}-`,'INV-',d=>d.type==='fuse'));
      const own=(s,pol)=>fus.some(d=>!conn(`S${s}${pol}`,'INV'+pol,x=>x===d)&&act.filter(t=>t!==s).every(t=>conn(`S${t}${pol}`,'INV'+pol,x=>x===d)));
      const perStr=act.every(s=>own(s,'+')&&own(s,'-'));
      add(okAll&&perStr?'ok':'err',okAll&&perStr?'ฟิวส์อยู่ในเส้นทางของทุกสตริง ทั้งขั้ว + และ − (ระบบ DC ไม่ต่อลงดิน)':`ต้องมีฟิวส์แยกทุกสตริง ทั้งขั้ว + และ − (ต้องใช้ ${S.SA*2} ตัว ตอนนี้ ${fus.length} ตัว)`)}
    fus.forEach(d=>{const lo=B8R.fuseLo*P.Isc,hi=Math.min(B8R.fuseHi*P.Isc,P.fuse),ok=d.o.A>lo&&d.o.A<=hi;if(fus.indexOf(d)===fus.findIndex(x=>x.o.A===d.o.A))add(ok?'ok':'err',`ฟิวส์ ${d.o.A} A: ต้องอยู่ระหว่าง ${b0f(lo,1)} A (1.5 × Isc) ถึง ${b0f(hi,0)} A (≤ 2.4 × Isc และ ≤ ${P.fuse} A ของแผง) ${ok?'✓':''}`)});
    /* DC SPD */
    const dsp=dcDev.filter(d=>d.type==='dcspd');
    if(!dsp.length)add('err','ยังไม่มี SPD ฝั่ง DC');
    dsp.forEach(d=>{const p=f(`${d.id}.t0`)===f('INV+'),n=f(`${d.id}.t1`)===f('INV-'),e=f(`${d.id}.pe`)===f('E0');
      add(p&&n&&e?'ok':'err',`SPD DC: ${p?'':'ขั้ว + ยังไม่ต่อกับฝั่ง + · '}${n?'':'ขั้ว − ยังไม่ต่อกับฝั่ง − · '}${e?'':'ขั้วดินยังไม่ต่อบาร์กราวด์ · '}${p&&n&&e?'ต่อคร่อม + / − และลงดินครบ':''}`);
      add(d.o.V<vm?'err':d.o.V<B8R.spdK*vm?'warn':'ok',`SPD DC Ucpv ${d.o.V} V ${d.o.V<vm?`ต่ำกว่า Voc สูงสุด ${b0f(vm,0)} V SPD จะนำไฟตลอดและเสียหาย`:d.o.V<B8R.spdK*vm?`ต่ำกว่าที่แนะนำ ${B8R.spdK} × Voc = ${b0f(B8R.spdK*vm,0)} V`:'พอ'}`)});
    /* AC paths */
    const pL=conn('INVL','GL'),pN=conn('INVN','GN');
    if(conn('INVL','GN')||conn('INVN','GL'))add('err','ฝั่ง AC ต่อสลับ L กับ N');
    else if(!pL||!pN)add('err',`ฝั่ง AC: ${!pL?'L ':''}${!pL&&!pN?'และ ':''}${!pN?'N ':''}ยังไปไม่ถึงตู้ MDB`);
    if(f('INVL')===f('INVN'))add('err','ลัดวงจร: L กับ N ต่อถึงกัน');
    const mcb=acDev.filter(d=>d.type==='mcb'||d.type==='rcbo');
    if(!mcb.length)add('err','ยังไม่มีเบรกเกอร์ AC ระหว่างอินเวอร์เตอร์กับตู้ MDB');
    else{const br=!conn('INVL','GL',d=>d.type==='mcb'||d.type==='rcbo')&&!conn('INVN','GN',d=>d.type==='mcb'||d.type==='rcbo');add(br?'ok':'err',br?'เบรกเกอร์ AC ตัดได้ทั้ง L และ N':'เบรกเกอร์ AC ยังไม่อยู่ในเส้นทางทั้ง L และ N');
      const need=B8R.acCont*B8INV.Iac;mcb.forEach(d=>add(d.o.A>=need?'ok':'err',`${B8D[d.type].n} ${d.o.A} A: ต้อง ≥ ${B8R.acCont} × ${B8INV.Iac} A = ${b0f(need,1)} A (โหลดต่อเนื่อง) ${d.o.A>=need?'✓':''}`))}
    const rc=acDev.filter(d=>d.type==='rcbo');
    if(!rc.length)add('warn','ไม่มี RCD/RCBO 30 mA ฝั่ง AC (ส่วนใหญ่การไฟฟ้าและ วสท. ให้มีเครื่องตัดไฟรั่ว)');
    else rc.forEach(d=>add(d.o.T==='B'||B8INV.rcdA?'ok':'warn',`RCBO Type ${d.o.T} ${d.o.T==='A'?(B8INV.rcdA?'ใช้ได้ (ผู้ผลิตอินเวอร์เตอร์รับรองว่าไม่มีกระแสรั่ว DC ไหลย้อน)':'ต้องใช้ Type B'):'ใช้ได้กับทุกกรณี'}`));
    const asp=acDev.filter(d=>d.type==='acspd');
    if(!asp.length)add('err','ยังไม่มี SPD ฝั่ง AC');
    asp.forEach(d=>{const l=f(`${d.id}.t0`)===f('INVL'),n=f(`${d.id}.t1`)===f('INVN'),e=f(`${d.id}.pe`)===f('E0');
      add(l&&n&&e?'ok':'err',`SPD AC: ${l?'':'ขั้ว L ยังไม่ต่อ · '}${n?'':'ขั้ว N ยังไม่ต่อ · '}${e?'':'ขั้วดินยังไม่ต่อบาร์กราวด์ · '}${l&&n&&e?'ต่อคร่อม L / N และลงดินครบ':''}`);
      add(d.o.V<B8R.acUcMin?'err':d.o.V>300?'warn':'ok',`SPD AC Uc ${d.o.V} V ${d.o.V<B8R.acUcMin?`ต่ำกว่า ${B8R.acUcMin} V (1.1 × 230) จะนำไฟตลอด`:d.o.V>300?'สูงเกินจำเป็น ระดับแรงดันที่ปล่อยผ่าน (Up) สูง ป้องกันอุปกรณ์ได้น้อยลง':'เหมาะกับระบบ 230 V'}`)});
    /* earthing */
    const ePE=f('INVPE')===f('E0'),eG=f('GPE')===f('E0'),eF=f('FR')===f('E0');
    add(ePE&&eG&&eF?'ok':'err',`ระบบดิน: ${ePE?'':'อินเวอร์เตอร์ PE ยังไม่ต่อบาร์ · '}${eG?'':'บาร์กราวด์ยังไม่ต่อสายดินของตู้ MDB/หลักดิน · '}${eF?'':'กรอบแผงยังไม่ประสานลงดิน · '}${ePE&&eG&&eF?'ต่อลงดินครบ (อินเวอร์เตอร์ กรอบแผง SPD และตู้ MDB อยู่ที่บาร์เดียวกัน)':''}`);
    if([...'+-LN'].some(r=>S.wires.some(w=>(role(w.a)==='PE')!==(role(w.b)==='PE')&&(role(w.a)===r||role(w.b)===r))))add('err','มีสายต่อขั้วไฟ (+ − L N) เข้ากับขั้วดิน');
    /* cable sizes */
    const bad=[];S.wires.forEach(w=>{const ra=role(w.a)||role(w.b),r=w.r;const side=['+','-'].includes(r)?'dc':['L','N'].includes(r)?'ac':'pe';
      if(side==='dc'){const strWire=w.a[0]==='S'||w.b[0]==='S'||[w.a,w.b].some(t=>{const d=S.dev.find(x=>x.id===+t.split('.')[0]);return d&&d.type==='fuse'&&t.endsWith('t0')});
        const need=B8R.dcCable*(strWire?P.Isc:ia);if((B8R.ampDC[w.s]||0)<need)bad.push(`สาย DC ${w.s} mm² รับได้ ~${B8R.ampDC[w.s]} A ต้อง ≥ ${b0f(need,1)} A (${B8R.dcCable} × Isc ${strWire?'ของสตริง':'รวม'})`)}
      else if(side==='ac'){const br=mcb.length?Math.max(...mcb.map(d=>d.o.A)):B8R.acCont*B8INV.Iac;if((B8R.ampAC[w.s]||0)<br)bad.push(`สาย AC ${w.s} mm² รับได้ ~${B8R.ampAC[w.s]} A น้อยกว่าเบรกเกอร์ ${b0f(br,0)} A`)}
      else{const spd=[w.a,w.b].some(t=>t.endsWith('.pe'))||[w.a,w.b].includes('FR');if(spd&&w.s<B8R.peMin)bad.push(`สายดิน${[w.a,w.b].includes('FR')?'ประสานกรอบแผง':'ของ SPD'} ${w.s} mm² แนะนำ ≥ ${B8R.peMin} mm²`)}});
    [...new Set(bad)].forEach(t=>add(t.includes('แนะนำ')?'warn':'err',t));
    if(!S.wires.length)out.splice(1,out.length-1,['idle','ลากอุปกรณ์ลงราง แล้วแตะขั้วต่อสองจุดเพื่อเดินสาย']);
    return{out,dcOk}}
  /* ---- render ---- */
  el.innerHTML=`<p class="hint tight">1) ลากอุปกรณ์จากรายการด้านซ้ายลง<b>ราง DC</b> หรือ<b>ราง AC</b> (เลือกขนาดก่อนลาก) · 2) แตะขั้วต่อ (วงกลม) จุดแรกแล้วแตะจุดที่สองเพื่อเดินสาย สีสายเลือกให้ตามขั้ว · แตะสายเพื่อลบ · ลากอุปกรณ์ออกนอกตู้เพื่อเอาออก · แตะด้ามสวิตช์/เบรกเกอร์เพื่อเปิด-ปิด</p>
   <div class="b8wrap"><div class="b8pal" id="b8pal"></div><div class="b0scn"><svg id="b8svg" viewBox="250 0 960 820" role="img" aria-label="ตู้คอมไบเนอร์ DC และ AC จำลอง"></svg></div></div>
   <div class="eqact"><button class="chip" id="b8ex" type="button">ดูตัวอย่างที่ถูกต้อง</button><button class="chip" id="b8clr" type="button">ล้างสายทั้งหมด</button><button class="chip" id="b8all" type="button">ล้างตู้ทั้งหมด</button></div>
   <div id="b8ev" class="b8evres" hidden></div><h3 class="sech" style="margin:6px 0 0">ผลการตรวจ</h3><ul class="checks" id="b8ck"></ul><p class="b0msg" id="b8msg"></p>`;
  const $q=x=>el.querySelector(x),svg=$q('#b8svg');
  function palette(){
    $q('#b8pal').innerHTML=`<div class="b8grp"><b>แผงและสตริง</b><div class="b8row">${[1,2,3,4].map(n=>`<button class="chip" data-sa="${n}" aria-pressed="${S.SA===n}">${n} สตริง</button>`).join('')}</div>
      <label class="b8lab">แผงต่อสตริง <select id="b8m">${[6,8,9,10,11,12,13,14].map(n=>`<option ${n===S.M?'selected':''}>${n}</option>`).join('')}</select></label>
      <label class="b8lab">อุณหภูมิต่ำสุด <select id="b8t">${[5,10,15,20].map(n=>`<option value="${n}" ${n===S.tmin?'selected':''}>${n} °C</option>`).join('')}</select></label>
      <p class="hint tight">แผง ${P.Voc} V / Isc ${P.Isc} A · ฟิวส์สูงสุด ${P.fuse} A<br>อินเวอร์เตอร์ ${B8INV.P/1000} kW 1 เฟส ${B8INV.Iac} A · DC สูงสุด ${B8INV.Vmax} V</p></div>
      <div class="b8grp"><b>แหล่งจ่ายและโหลด</b>
       <label class="b8sl"><span>☀ ความเข้มแสง <b id="b8Gv">${S.G} W/m²</b></span><input type="range" id="b8G" min="0" max="1200" step="50" value="${S.G}"></label>
       <label class="b8sl"><span>⚡ แรงดันกริด <b id="b8vgv">${S.vg} V</b></span><input type="range" id="b8vg" min="190" max="290" step="5" value="${S.vg}"></label>
       <label class="b8sl"><span>💡 โหลดในบ้าน <b id="b8ldv">${S.load} W</b></span><input type="range" id="b8ld" min="0" max="9000" step="250" value="${S.load}"></label></div>
      <div class="b8grp"><b>จำลองเหตุการณ์</b><div class="b8evb">
       <button class="chip sm" data-ev="sdc">⚡ ฟ้าผ่าใกล้แผง (ไฟกระชาก DC)</button><button class="chip sm" data-ev="sac">⚡ ไฟกระชากจากสายการไฟฟ้า (AC)</button>
       <button class="chip sm" data-ev="ovdc">❄ เช้าวันหนาว แรงดัน DC สูงสุด</button><button class="chip sm" data-ev="ovac">▲ แรงดันกริดเกิน (ตามแถบด้านบน)</button>
       <button class="chip sm" data-ev="ocdc">🔥 ลัดวงจรในสตริง 1 (กระแสย้อน)</button><button class="chip sm" data-ev="ocac">🔥 ลัดวงจรสาย AC</button>
       <button class="chip sm" data-ev="olac">☀ แดดแรงทั้งวัน อินเวอร์เตอร์จ่ายเต็มพิกัด</button><button class="chip sm" data-ev="leak">💧 ไฟรั่วลงโครงอินเวอร์เตอร์</button>
       <button class="chip sm" data-ev="reset">⟲ รีเซ็ตเหตุการณ์ (เปลี่ยนฟิวส์ / ยกเบรกเกอร์)</button></div></div>
      ${Object.keys(B8D).map(k=>{const D=B8D[k];return`<div class="b8card" data-k="${k}"><div class="b8drag" data-k="${k}" title="ลากลงราง"><svg viewBox="0 0 ${D.w*U} 70" class="b8ico" style="width:${D.w*34}px">${devFace(k,{A:S.pick[k].A,V:S.pick[k].V,T:S.pick[k].T},0,0,true)}</svg><span>${D.n}<small>${D.side==='dc'?'ราง DC':'ราง AC'} · ลากไปวาง</small></span></div>
        ${Object.keys(D.opt).map(o=>`<div class="b8row">${D.opt[o].map(v=>`<button class="chip sm" data-k="${k}" data-o="${o}" data-v="${v}" aria-pressed="${S.pick[k][o]==v}">${v}${o==='A'?' A':o==='V'?' V':''}${o==='T'?' Type':''}</button>`).join('')}</div>`).join('')}</div>`}).join('')}
      <div class="b8grp"><b>ขนาดสายที่จะเดิน</b><div class="b8row">${[2.5,4,6,10,16].map(v=>`<button class="chip sm" data-ws="${v}" aria-pressed="${S.ws===v}">${v} mm²</button>`).join('')}</div></div>`;
  }
  function devFace(k,o,x,y,mini){const D=B8D[k],w=D.w*U-4,h=mini?66:H,cx=x+w/2+2;let sy='';
    const c=y+(mini?30:H/2+2);
    if(D.sym==='fuse')sy=`<rect x="${cx-9}" y="${c-16}" width="18" height="32" rx="3" fill="#fff" stroke="#37474f" stroke-width="1.6"/><path d="M${cx} ${c-22}V${c+22}" stroke="#37474f" stroke-width="1.6"/>`;
    else if(D.sym==='iso')sy=`<circle cx="${cx}" cy="${c}" r="16" fill="#ffd400" stroke="#8a6d00"/><rect x="${cx-4}" y="${c-14}" width="8" height="28" rx="3" fill="#e53935"/>`;
    else if(D.sym==='cb')sy=`<path d="M${cx-14} ${c+12}L${cx+8} ${c-8}" stroke="#37474f" stroke-width="2.4"/><path d="M${cx+4} ${c-14}l8 8M${cx+12} ${c-14}l-8 8" stroke="#37474f" stroke-width="2"/><path d="M${cx-14} ${c+12}H${cx-22}M${cx+14} ${c+12}H${cx+22}" stroke="#37474f" stroke-width="2"/>`;
    else if(D.sym==='rcd')sy=`<path d="M${cx-16} ${c+10}L${cx+4} ${c-8}" stroke="#37474f" stroke-width="2.4"/><ellipse cx="${cx}" cy="${c+12}" rx="14" ry="6" fill="none" stroke="#1565c0" stroke-width="2"/><text x="${cx}" y="${c-14}" text-anchor="middle" font-size="9" font-weight="700" fill="#1565c0">30mA</text>`;
    else if(D.sym==='spd')sy=`<rect x="${cx-11}" y="${c-18}" width="22" height="30" rx="2" fill="#fff" stroke="#37474f" stroke-width="1.6"/><path d="M${cx+4} ${c-14}L${cx-4} ${c-2}H${cx+5}L${cx-3} ${c+9}" fill="none" stroke="#e53935" stroke-width="2"/><path d="M${cx} ${c+12}V${c+18}M${cx-8} ${c+18}H${cx+8}M${cx-5} ${c+21}H${cx+5}" stroke="#1baf7a" stroke-width="2"/>`;
    const lab=[o.A?o.A+'A':'',o.V?o.V+'V'+(D.side==='dc'?'⎓':'~'):'',o.T?'Type '+o.T:''].filter(Boolean).join(' ');
    return`<rect x="${x+2}" y="${y}" width="${w}" height="${h}" rx="5" fill="${D.col}" stroke="#455a64" stroke-width="1.5"/>${sy}<text x="${cx}" y="${y+h-(mini?4:26)}" text-anchor="middle" font-size="${mini?9:10.5}" font-weight="700" fill="#263238">${lab}</text>${mini?'':`<text x="${cx}" y="${y+h-14}" text-anchor="middle" font-size="9" fill="#546e7a">${D.side==='dc'?'DC':'AC'}</text>`}`}
  function draw(){
    const R=check(),F=FIX(),live=d=>!d.on||d.blown||d.dmg,fl=nets(live),L=flow(fl,R);
    let g=`<defs><pattern id="b8hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#b0bec5" stroke-width="2"/></pattern></defs>`;
    /* PV array */
    g+=`<text x="262" y="24" font-size="13" font-weight="700" fill="var(--ink)">แผงโซลาร์ ${S.SA} สตริง × ${S.M} แผง</text>`;
    for(let s=1;s<=4;s++){const y=40+(s-1)*128,on=s<=S.SA;g+=`<g opacity="${on?1:.25}">${B0G.panel(262,y,46,60)}${B0G.panel(314,y,46,60)}<text x="311" y="${y+78}" text-anchor="middle" font-size="11" fill="var(--muted)">สตริง ${s}${on?` · ${b0f(P.Voc*S.M,0)} V`:''}</text></g>`;
      if(on){const p=F[`S${s}+`],n=F[`S${s}-`];g+=`<path d="M285 ${y+60}V${y+92}Q285 ${y+102} 300 ${y+102}H${p.x-30}Q${p.x} ${y+102} ${p.x} ${p.y+18}V${p.y+8}" fill="none" stroke="#d62828" stroke-width="3" opacity=".75"/><path d="M337 ${y+60}V${y+86}Q337 ${y+96} 352 ${y+96}H${n.x-30}Q${n.x} ${y+96} ${n.x} ${n.y+18}V${n.y+8}" fill="none" stroke="#20252a" stroke-width="3" opacity=".75"/>`}}
    g+=`${B0G.gnd(300,716,24)}${B0G.sun(392,26,13,S.G/1200)}<text x="392" y="58" text-anchor="middle" font-size="10.5" font-weight="700" fill="var(--ink)">${S.G} W/m²</text>`;
    if(S.fx&&S.fx.bolt==='dc')g+=`<g class="b8flash">${B0G.bolt(352,8,40,'#ffd400')}</g>`;
    if(S.fx&&S.fx.str)g+=`<g class="b8flash"><circle cx="311" cy="70" r="40" fill="#ff5252" opacity=".25"/><text x="311" y="74" text-anchor="middle" font-size="13" font-weight="700" fill="#c62828">ลัดวงจร!</text></g>`;
    /* enclosure */
    g+=`<rect x="420" y="40" width="${SLOTS*U+70}" height="650" rx="14" fill="#eef1f4" stroke="#78909c" stroke-width="3"/><text x="434" y="62" font-size="13" font-weight="700" fill="#37474f">ตู้คอมไบเนอร์ (Combiner box)</text>
      <rect x="436" y="78" width="${S.SA*84-10}" height="30" rx="4" fill="#cfd8dc"/><text x="${440+S.SA*84}" y="97" font-size="10" fill="#546e7a">← เทอร์มินัลสายจากแผง</text>`;
    ['dc','ac'].forEach(r=>{const y=RAIL[r];g+=`<rect x="${X0-6}" y="${y-6}" width="${SLOTS*U+12}" height="12" fill="url(#b8hatch)" stroke="#90a4ae"/><text x="${X0-8}" y="${y-H/2-8}" font-size="12" font-weight="700" fill="${r==='dc'?'#c62828':'#6d4c41'}">${r==='dc'?'ราง DC (รางปีกนก)':'ราง AC (รางปีกนก)'}</text>`;
      for(let k=0;k<SLOTS;k++)g+=`<rect x="${X0+k*U+1}" y="${y-H/2}" width="${U-2}" height="${H}" rx="4" fill="none" stroke="#cfd8dc" stroke-dasharray="3 3"/>`});
    g+=`<rect x="460" y="${PEY-14}" width="320" height="28" rx="5" fill="#c8e6c9" stroke="#2e7d32"/><text x="790" y="${PEY+5}" font-size="12" font-weight="700" fill="#2e7d32">บาร์กราวด์ PE</text>`;
    /* inverter & MDB */
    g+=`<rect x="980" y="150" width="200" height="164" rx="12" fill="var(--invfill)" stroke="var(--ink)" stroke-width="2"/><text x="1080" y="176" text-anchor="middle" font-size="13" font-weight="700" fill="var(--ink)">อินเวอร์เตอร์ ${B8INV.P/1000} kW</text>
      <text x="1018" y="300" text-anchor="middle" font-size="11" fill="#c62828" font-weight="700">DC IN</text><text x="1124" y="300" text-anchor="middle" font-size="11" fill="#6d4c41" font-weight="700">AC OUT</text>
      <text x="1080" y="204" text-anchor="middle" font-size="12" fill="${L.dc?'var(--ok)':'var(--muted)'}">${L.dc?`● DC ${b0f(L.vdc,0)} V · ${b0f(L.pdc/1000,2)} kW`:'○ ไม่มีไฟ DC เข้า'}</text>
      <text x="1080" y="226" text-anchor="middle" font-size="12" fill="${L.ac?'var(--ok)':'var(--muted)'}">${L.ac?`● จ่าย AC ${b0f(L.pac/1000,2)} kW`:`○ ${esc(L.why)}`}</text>
      ${S.inv==='dmg'?`<rect x="984" y="236" width="192" height="40" rx="6" fill="#ffcdd2" stroke="#c62828" stroke-width="2"/><text x="1080" y="262" text-anchor="middle" font-size="13" font-weight="700" fill="#b71c1c">✗ อินเวอร์เตอร์เสียหาย</text>`:S.inv==='trip'?`<rect x="984" y="236" width="192" height="40" rx="6" fill="#ffe0b2" stroke="#e65100" stroke-width="2"/><text x="1080" y="262" text-anchor="middle" font-size="12" font-weight="700" fill="#e65100">! หยุดจ่าย (ป้องกันตัวเอง)</text>`:''}
      <rect x="1040" y="560" width="140" height="110" rx="10" fill="#e8eaf6" stroke="var(--ink)" stroke-width="2"/><text x="1110" y="632" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink)">ตู้ MDB</text>
      <text x="1110" y="650" text-anchor="middle" font-size="10.5" fill="${L.imp>0?'#c62828':'var(--ok)'}">${L.imp>0?`ซื้อไฟ ${b0f(L.imp/1000,2)} kW`:`ขายคืน ${b0f(-L.imp/1000,2)} kW`}</text>
      <path d="M1070 670V700M1110 670V730M1150 670V700" stroke="var(--muted)" stroke-width="2"/>
      <g transform="translate(1036 700)">${B0G.pole(0,4,62,!L.grid)}<circle cx="34" cy="20" r="9" fill="none" stroke="var(--ink)" stroke-width="1.8"/><circle cx="34" cy="32" r="9" fill="none" stroke="var(--ink)" stroke-width="1.8"/><text x="14" y="88" font-size="11" font-weight="700" fill="${L.grid?'var(--ink)':'#c62828'}">กริด ${S.vg} V</text></g>
      <g transform="translate(1104 730)">${B0G.house(0,0,62)}${B0G.bulb(31,44,8,S.load>0?Math.min(1,.3+S.load/6000):0)}<text x="31" y="78" text-anchor="middle" font-size="11" font-weight="700" fill="var(--ink)">โหลด ${b0f(S.load/1000,2)} kW</text></g>`;
    /* devices */
    S.dev.forEach(d=>{const D=B8D[d.type],x=devX(d),y=devY(d),w=D.w*U;const st=S.fx&&S.fx.dev[d.id];
      g+=`<g class="b8dev" data-id="${d.id}">${st==='clamp'?`<rect class="b8flash" x="${x-4}" y="${y-6}" width="${w+4}" height="${H+12}" rx="8" fill="#ffb300" opacity=".45"/>`:''}${devFace(d.type,d.o,x,y)}${D.pe||d.type==='fuse'?'':`<rect class="b8tog" data-id="${d.id}" x="${x+w/2-14}" y="${y+22}" width="28" height="14" rx="3" fill="${d.on?'#43a047':'#e53935'}"/><text x="${x+w/2}" y="${y+32.5}" text-anchor="middle" font-size="9" font-weight="700" fill="#fff" pointer-events="none">${d.trip?'TRIP':d.on?'ON':'OFF'}</text>`}
       ${d.blown||d.dmg?`<path d="M${x+6} ${y+40}L${x+w-6} ${y+H-30}M${x+w-6} ${y+40}L${x+6} ${y+H-30}" stroke="#c62828" stroke-width="4" stroke-linecap="round"/><rect x="${x+2}" y="${y+H/2-10}" width="${w-4}" height="18" rx="3" fill="#c62828"/><text x="${x+w/2}" y="${y+H/2+3}" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">${d.blown?'ขาด':'เสีย'}</text>`:''}
       ${st==='clamp'?`<text x="${x+w/2}" y="${y+H+16}" text-anchor="middle" font-size="10" font-weight="700" fill="#e65100">จำกัดแรงดัน → ดิน</text>`:''}${st==='trip'?`<rect class="b8flash" x="${x-4}" y="${y-6}" width="${w+4}" height="${H+12}" rx="8" fill="none" stroke="#e53935" stroke-width="4"/>`:''}</g>`});
    /* wires */
    S.wires.forEach((w,i)=>{const a=tpos(w.a),b=tpos(w.b);if(!a||!b)return;const dy=Math.max(30,Math.abs(b.y-a.y)/2),up=a.y<b.y;
      const dA=role(w.a)==='PE'||w.a[0]==='E'?1:/\.t/.test(w.a)||w.a[0]==='S'||w.a.startsWith('INV')?-1:1,dB=/\.t/.test(w.b)||w.b[0]==='S'||w.b.startsWith('INV')?-1:1;
      const pth=`M${a.x} ${a.y}C${a.x} ${a.y+dA*dy} ${b.x} ${b.y+dB*dy} ${b.x} ${b.y}`;
      if(S.fx&&S.fx.hot&&S.fx.hot.includes(i))g+=`<path class="b8flash" d="${pth}" fill="none" stroke="#ff3d00" stroke-width="${10+w.s/2}" opacity=".45" stroke-linecap="round"/>`;
      if(S.fx&&S.fx.surge&&S.fx.surge.includes(i))g+=`<path class="b8flash" d="${pth}" fill="none" stroke="#ffd400" stroke-width="${8+w.s/2}" opacity=".55" stroke-linecap="round"/>`;
      g+=`<path d="${pth}" fill="none" stroke="${WCOL[w.r]||'#888'}" stroke-width="${2+w.s/3}" ${w.r==='PE'?'stroke-dasharray="10 4"':''} opacity=".92"/><path class="b8w" data-i="${i}" d="${pth}" fill="none" stroke="transparent" stroke-width="12"/>`;
      if(w.r==='PE')g+=`<path d="${pth}" fill="none" stroke="#f9d71c" stroke-width="${1+w.s/6}" stroke-dasharray="4 10" stroke-dashoffset="-10" pointer-events="none"/>`});
    /* terminals */
    const all=Object.keys(F).filter(k=>F[k].on!==false);S.dev.forEach(d=>all.push(...terms(d)));
    all.forEach(id=>{const p=tpos(id),r=role(id),sel=S.sel===id;g+=`<g class="b8t" data-t="${id}"><circle cx="${p.x}" cy="${p.y}" r="${sel?9:7}" fill="${sel?'#ffd400':'#fff'}" stroke="${WCOL[r]||'#607d8b'}" stroke-width="${sel?3.5:2.5}"/><circle cx="${p.x}" cy="${p.y}" r="14" fill="transparent"/>${F[id]&&F[id].lab?`<text x="${p.x}" y="${p.y-12}" text-anchor="middle" font-size="10" font-weight="700" fill="${WCOL[r]||'var(--ink)'}">${F[id].lab}</text>`:''}</g>`});
    if(S.fx&&S.fx.bolt==='ac')g+=`<g class="b8flash">${B0G.bolt(1010,690,40,'#ffd400')}</g>`;
    if(S.fx&&S.fx.inv)g+=`<g class="b8flash"><rect x="976" y="146" width="208" height="172" rx="14" fill="none" stroke="${S.inv==='dmg'?'#c62828':'#ff9800'}" stroke-width="5"/></g>`;
    if(S.drag&&S.drag.ghost){const gh=S.drag.ghost,D=B8D[S.drag.k];g+=`<g opacity=".7" pointer-events="none">${devFace(S.drag.k,S.drag.o,gh.x-D.w*U/2,gh.y-H/2)}</g>`;if(gh.slot!=null)g+=`<rect x="${X0+gh.slot*U}" y="${RAIL[gh.rail]-H/2}" width="${D.w*U}" height="${H}" rx="5" fill="none" stroke="${gh.ok?'var(--ok)':'var(--err)'}" stroke-width="3" pointer-events="none"/>`}
    svg.innerHTML=g;
    const ul=$q('#b8ck');ul.innerHTML=R.out.map(([l,t])=>`<li><span class="b ${l}">${l==='ok'?'✓':l==='warn'?'!':l==='idle'?'i':'✗'}</span><span>${esc(t)}</span></li>`).join('');
    const ne=R.out.filter(x=>x[0]==='err').length,nw=R.out.filter(x=>x[0]==='warn').length,ok=S.wires.length&&!ne;
    if(S.ex)b0Msg($q('#b8msg'),null,'ตัวอย่าง: 3 สตริง (ต้องมีฟิวส์ทั้ง + / − ทุกสตริง) → สวิตช์ตัดตอน DC 63 A 1000 V → SPD DC 1000 V → อินเวอร์เตอร์ → MCB 32 A → RCBO 32 A → MDB พร้อม SPD AC 275 V · ตัวอย่างไม่นับเป็นภารกิจ กด "ล้างตู้ทั้งหมด" แล้วต่อเอง');
    else b0Msg($q('#b8msg'),ok?true:S.wires.length?false:null,ok?`ผ่านทุกข้อ${nw?` (มีข้อควรระวัง ${nw} ข้อ)`:''} · ภารกิจสำเร็จ`:S.wires.length?`ยังไม่ผ่าน ${ne} ข้อ`:'');
    if(ok&&!S.ex)b0Task('t8',true);
  }
  /* ---- live power flow (devices OFF / blown / damaged are open) ---- */
  function flow(f,R){
    const ok=s=>f(`S${s}+`)===f('INV+')&&f(`S${s}-`)===f('INV-'),n=[1,2,3,4].filter(s=>s<=S.SA&&ok(s)).length,sh=f('INV+')===f('INV-')||f('INVL')===f('INVN');
    const c=b0Curve(S.G,45),dc=n>0&&!sh&&R.dcOk&&S.inv!=='dmg'&&S.G>0,vdc=dc?c.mp.V*S.M:0,pdc=dc?Math.min(c.mp.P*S.M*n*.98,B8INV.P*1.3):0;
    const acPath=f('INVL')===f('GL')&&f('INVN')===f('GN')&&!sh,grid=S.vg>=207&&S.vg<=253;
    const ac=dc&&acPath&&grid&&S.inv===''&&vdc>=150&&vdc<=B8INV.Vmax,pac=ac?Math.min(B8INV.P,pdc*.97):0;
    const why=S.inv==='dmg'?'อินเวอร์เตอร์เสียหาย':S.inv==='trip'?'หยุดจ่าย':!dc?'ไม่มีไฟ DC':vdc>B8INV.Vmax?'DC เกินพิกัด':!acPath?'ฝั่ง AC ถูกตัด/ยังไม่ต่อ':!grid?`แรงดันกริด ${S.vg} V นอกช่วง 207–253 V`:'ไม่จ่าย';
    return{dc,vdc,pdc,ac,pac,grid,imp:S.load-pac,why}}
  /* ---- events: each one reads the wiring as it is now and makes devices respond ---- */
  function event(type){
    if(type==='reset'){S.fx=null;S.inv='';S.dev.forEach(d=>{d.blown=false;d.dmg=false;if(d.trip){d.trip=false;d.on=true}});draw();return}
    const f=nets(),fx={dev:{},hot:[],surge:[],msgs:[],bolt:null,inv:false,str:0},say=(l,t)=>fx.msgs.push([l,t]),gnd=f('E0')===f('GPE');
    const spdOK=k=>S.dev.filter(d=>d.type===k&&!d.dmg&&f(`${d.id}.t0`)===f(k==='dcspd'?'INV+':'INVL')&&f(`${d.id}.t1`)===f(k==='dcspd'?'INV-':'INVN')&&f(`${d.id}.pe`)===f('E0'));
    const wiresOf=pred=>S.wires.map((w,i)=>pred(w)?i:-1).filter(i=>i>=0),vm=vocMax(),title={sdc:'ฟ้าผ่าใกล้แผง: แรงดันกระชากเหนี่ยวนำเข้าสาย DC (หลาย kV ในไม่กี่ไมโครวินาที)',sac:'ไฟกระชากจากสายการไฟฟ้า (ฟ้าผ่าสายส่ง / การสวิตช์)',ovdc:`เช้าวันหนาว ${S.tmin} °C แดดแรง: Voc สตริงสูงสุด ${b0f(vm,0)} V`,ovac:`แรงดันกริด ${S.vg} V`,ocdc:'ลัดวงจรที่สายของสตริง 1 (เช่น สายถูกหนูกัด / MC4 ชำรุด)',ocac:'ลัดวงจรที่สาย AC ระหว่างอินเวอร์เตอร์กับตู้ MDB',olac:'แดดแรงทั้งวัน อินเวอร์เตอร์จ่ายเต็มพิกัดต่อเนื่องหลายชั่วโมง',leak:'ฉนวนอินเวอร์เตอร์ชำรุด ไฟรั่วลงโครงเครื่อง'}[type];
    if(type==='sdc'||type==='sac'){const dc=type==='sdc',sp=spdOK(dc?'dcspd':'acspd'),okV=sp.filter(d=>dc?d.o.V>=vm:d.o.V>=B8R.acUcMin);fx.bolt=dc?'dc':'ac';
      fx.surge=wiresOf(w=>dc?['+','-'].includes(w.r):['L','N'].includes(w.r));
      if(okV.length&&gnd){okV.forEach(d=>fx.dev[d.id]='clamp');fx.surge.push(...wiresOf(w=>w.r==='PE'));say('ok',`SPD ${dc?'DC':'AC'} ${okV.map(d=>d.o.V+' V').join(', ')} นำกระแสกระชากลงบาร์กราวด์ → หลักดิน จำกัดแรงดันที่อินเวอร์เตอร์ไว้ต่ำกว่าระดับที่ทนได้ อินเวอร์เตอร์ปลอดภัย`);
        if(dc&&!S.dev.some(d=>d.type==='acspd'&&f(`${d.id}.pe`)===f('E0')))say('idle','กระแสกระชากบางส่วนวิ่งต่อไปฝั่ง AC ได้ ควรมี SPD ทั้งสองฝั่ง')}
      else{S.inv='dmg';fx.inv=true;const why=!S.dev.some(d=>d.type===(dc?'dcspd':'acspd'))?`ไม่มี SPD ฝั่ง ${dc?'DC':'AC'}`:!gnd?'บาร์กราวด์ไม่ได้ต่อลงดิน (สายดินของตู้ MDB) SPD จึงระบายกระแสไม่ได้':sp.length?`SPD พิกัดต่ำเกินไป (${dc?`Ucpv < Voc ${b0f(vm,0)} V`:'Uc < 253 V'}) เสียไปก่อนแล้ว`:'SPD ต่อไม่ครบ (ขั้วไฟหรือขั้วดิน)';
        say('err',`${why} → แรงดันกระชากเข้าอินเวอร์เตอร์โดยตรง วงจรภาค ${dc?'DC (MPPT)':'AC'} เสียหาย`)}}
    else if(type==='ovdc'){
      say(vm>B8INV.Vmax?'err':'ok',vm>B8INV.Vmax?`Voc ${b0f(vm,0)} V เกินพิกัดอินเวอร์เตอร์ ${B8INV.Vmax} V ภาค DC เสียหาย ลดจำนวนแผงต่อสตริง`:`Voc ${b0f(vm,0)} V ไม่เกินพิกัดอินเวอร์เตอร์ ${B8INV.Vmax} V`);if(vm>B8INV.Vmax){S.inv='dmg';fx.inv=true}
      if(vm>B8R.vocBldMax)say('err',`เกิน ${B8R.vocBldMax} V ที่กำหนดสำหรับระบบบนอาคาร`);
      S.dev.filter(d=>d.type==='dcspd').forEach(d=>{if(d.o.V<vm){d.dmg=true;say('err',`SPD DC ${d.o.V} V ต่ำกว่า Voc จึงนำกระแสตลอด ร้อนจนตัวตัดภายในทำงาน SPD ใช้ไม่ได้แล้ว`)}else say('ok',`SPD DC ${d.o.V} V ไม่นำกระแส (สูงกว่า Voc)`)});
      S.dev.filter(d=>d.type==='dcsw').forEach(d=>say(d.o.V>=vm?'ok':'err',d.o.V>=vm?`สวิตช์ DC ${d.o.V} V ตัดวงจรได้ปลอดภัย`:`สวิตช์ DC ${d.o.V} V ต่ำกว่า ${b0f(vm,0)} V ถ้าสับ OFF ขณะมีกระแส อาร์ก DC อาจไม่ดับ เสี่ยงไฟไหม้`));
      fx.surge=wiresOf(w=>['+','-'].includes(w.r))}
    else if(type==='ovac'){
      if(S.vg>253){S.inv='trip';fx.inv=true;say('warn',`แรงดัน ${S.vg} V เกิน 253 V (230 V + 10%) อินเวอร์เตอร์ตัดตัวเองออกจากกริด (ระบบป้องกันแรงดันเกินในเครื่อง) ไม่เสียหาย กลับมาจ่ายเมื่อแรงดันปกติ`)}
      else if(S.vg<207){S.inv='trip';fx.inv=true;say('warn',`แรงดัน ${S.vg} V ต่ำกว่า 207 V อินเวอร์เตอร์หยุดจ่ายชั่วคราว`)}
      else say('ok',`แรงดัน ${S.vg} V อยู่ในช่วงปกติ (207–253 V) ลองเลื่อนแถบแรงดันกริดให้สูงขึ้นแล้วกดอีกครั้ง`);
      S.dev.filter(d=>d.type==='acspd').forEach(d=>{if(d.o.V<S.vg){d.dmg=true;say('err',`SPD AC Uc ${d.o.V} V ต่ำกว่าแรงดันกริด ${S.vg} V นำกระแสตลอด ร้อนจนเสีย`)}else say('ok',`SPD AC Uc ${d.o.V} V ทนแรงดัน ${S.vg} V ได้`)})}
    else if(type==='ocdc'){
      if(S.SA<2){say('idle','มีสตริงเดียว ไม่มีกระแสย้อนจากสตริงอื่น กระแสลัดวงจรเท่ากับ Isc ของสตริงนั้นเอง (แผงทนได้) เลือก 2–3 สตริงเพื่อดูผล')}
      else{const oth=[2,3,4].filter(t=>t<=S.SA&&conn(`S${t}+`,'INV+')&&conn(`S${t}-`,'INV-')),ib=oth.length*P.Isc*S.G/1000;fx.str=1;
        const fu=S.dev.filter(d=>d.type==='fuse'&&!d.blown&&[ '+','-'].some(pol=>!conn(`S1${pol}`,'INV'+pol,x=>x===d)&&oth.every(t=>conn(`S${t}${pol}`,'INV'+pol,x=>x===d))));
        say('idle',`กระแสย้อนจากสตริงอื่นที่ต่ออยู่ ${oth.length} สตริง ไหลเข้าจุดลัดวงจร = ${oth.length} × ${P.Isc} A × ${S.G}/1000 = ${b0f(ib,1)} A (แผงทนได้ไม่เกิน ${P.fuse} A)`);
        if(fu.length){const In=Math.min(...fu.map(d=>d.o.A)),r=ib/In;
          if(r>=1.45){fu.forEach(d=>{d.blown=true;fx.dev[d.id]='blown'});say('ok',`ฟิวส์ของสตริง 1 ขาด (กระแส ${b0f(r,2)} เท่าของพิกัด ${In} A${r>=2?' ตัดภายในไม่กี่วินาที':' ตัดภายในไม่กี่นาที'}) ตัดสตริงที่เสียออก สตริงอื่นยังจ่ายไฟต่อ`)}
          else say('ok',`กระแสย้อนเพียง ${b0f(r,2)} เท่าของฟิวส์ ${In} A ฟิวส์ gPV อาจยังไม่ขาด (ต้องราว 1.45 เท่าขึ้นไป) แต่ไม่เกิน 1.35 × ${P.fuse} A = ${b0f(1.35*P.fuse,1)} A ที่แผงผ่านการทดสอบทนกระแสย้อน (IEC 61730) แผงจึงยังปลอดภัย · ลองเลือก 4 สตริงเพื่อดูฟิวส์ทำงาน`)}
        else if(ib>P.fuse){fx.hot=wiresOf(w=>[w.a,w.b].some(t=>t==='S1+'||t==='S1-'));say('err',`ไม่มีฟิวส์ในสตริง 1 กระแสย้อน ${b0f(ib,1)} A เกินพิกัดแผง ${P.fuse} A สายและแผงสตริง 1 ร้อนจัด เสี่ยงไฟไหม้ (สวิตช์ DC อยู่ปลายทาง ช่วยไม่ได้)`)}
        else say('ok',`กระแสย้อน ${b0f(ib,1)} A ไม่เกินพิกัดแผง ${P.fuse} A แผงทนได้ นี่คือเหตุผลที่ ${S.SA} สตริงยังไม่บังคับฟิวส์`)}}
    else if(type==='ocac'){
      const brk=S.dev.filter(d=>(d.type==='mcb'||d.type==='rcbo')&&d.on&&!conn('GL','INVL',x=>x===d));
      say('idle','กระแสลัดวงจรจากกริดไหลมาที่จุดลัด (หลายร้อย A) ส่วนอินเวอร์เตอร์จำกัดกระแสตัวเองและหยุดจ่าย');
      if(brk.length){const d=brk[0];d.on=false;d.trip=true;fx.dev[d.id]='trip';S.inv='trip';fx.inv=true;say('ok',`${B8D[d.type].n} ${d.o.A} A ทริปทันที (ทริปแม่เหล็ก) ตัดวงจรออกจากกริด`)}
      else{fx.hot=wiresOf(w=>['L','N'].includes(w.r));S.inv='trip';say('err','ไม่มีเบรกเกอร์ AC คั่นระหว่างกริดกับจุดลัด สาย AC ร้อนจนฉนวนละลาย ต้องรอเบรกเกอร์เมนในตู้ MDB ซึ่งพิกัดสูงกว่าสายนี้มาก')}}
    else if(type==='olac'){const i=B8INV.Iac,br=S.dev.filter(d=>(d.type==='mcb'||d.type==='rcbo')&&d.on&&!conn('GL','INVL',x=>x===d));
      if(!br.length)say('warn','ไม่มีเบรกเกอร์ AC ในเส้นทาง');
      br.forEach(d=>{if(d.o.A<i){d.on=false;d.trip=true;fx.dev[d.id]='trip';say('err',`${B8D[d.type].n} ${d.o.A} A ต่ำกว่ากระแสอินเวอร์เตอร์ ${i} A ทริปเองตอนแดดแรง (ทริปความร้อน)`)}
        else if(d.o.A<B8R.acCont*i)say('warn',`${B8D[d.type].n} ${d.o.A} A จ่ายต่อเนื่อง ${i} A นาน ๆ ร้อนและอาจทริปเองในวันร้อน ควร ≥ ${b0f(B8R.acCont*i,1)} A`);
        else say('ok',`${B8D[d.type].n} ${d.o.A} A รับกระแสต่อเนื่อง ${i} A ได้ (≥ 1.25 เท่า)`)});
      const thin=wiresOf(w=>['L','N'].includes(w.r)&&(B8R.ampAC[w.s]||0)<i);if(thin.length){fx.hot=thin;say('err',`สาย AC บางเส้นรับกระแสได้น้อยกว่า ${i} A ร้อนเกิน`)}
      S.G=1100;$q('#b8G').value=1100;$q('#b8Gv').textContent='1100 W/m²'}
    else if(type==='leak'){const rc=S.dev.filter(d=>d.type==='rcbo'&&d.on&&!conn('GL','INVL',x=>x===d)),pe=f('INVPE')===f('E0')&&gnd;
      if(rc.length){const d=rc[0];d.on=false;d.trip=true;fx.dev[d.id]='trip';S.inv='trip';fx.inv=true;say('ok',`RCBO 30 mA ทริป ตัดไฟที่รั่ว${pe?' และสายดินพากระแสรั่วลงดิน':' (แต่ยังไม่ได้ต่อสายดิน โครงเครื่องมีไฟจนกว่า RCBO ตัด)'}`)}
      else if(pe)say('warn','กระแสรั่วไหลลงดินผ่านสายดิน โครงเครื่องไม่มีไฟอันตราย แต่ไม่มี RCD ตัดวงจร เครื่องยังรั่วต่อไปโดยไม่มีใครรู้');
      else{say('err','ไม่มี RCD และอินเวอร์เตอร์ไม่ได้ต่อสายดิน โครงเครื่องมีไฟ 230 V ใครสัมผัสถูกไฟดูด');fx.inv=true}}
    S.fx=Object.assign(fx,{title});draw();
    const box=$q('#b8ev');box.hidden=false;box.innerHTML=`<h3>เหตุการณ์: ${esc(title)}</h3><ul class="checks">${fx.msgs.map(([l,t])=>`<li><span class="b ${l}">${l==='ok'?'✓':l==='warn'?'!':l==='idle'?'i':'✗'}</span><span>${esc(t)}</span></li>`).join('')}</ul><p class="hint tight">กด "⟲ รีเซ็ตเหตุการณ์" เพื่อเปลี่ยนฟิวส์ที่ขาด ยกเบรกเกอร์ที่ทริป และซ่อมอุปกรณ์ แล้วลองเหตุการณ์อื่น</p>`;
    box.scrollIntoView({block:'nearest',behavior:'smooth'})}
  /* ---- slot logic ---- */
  const freeAt=(rail,slot,w,skipId)=>{if(slot<0||slot+w>SLOTS)return false;return!S.dev.some(d=>d.id!==skipId&&d.rail===rail&&slot<d.slot+B8D[d.type].w&&d.slot<slot+w)};
  const pt=e=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(svg.getScreenCTM().inverse());return{x:q.x,y:q.y}};
  const target=(p,k,skipId)=>{const w=B8D[k].w;let rail=null;['dc','ac'].forEach(r=>{if(Math.abs(p.y-RAIL[r])<H*.75)rail=r});if(!rail||p.x<X0-U||p.x>X0+SLOTS*U+U)return{x:p.x,y:p.y};
    const slot=Math.max(0,Math.min(SLOTS-w,Math.round((p.x-X0-w*U/2)/U)));return{x:p.x,y:p.y,rail,slot,ok:freeAt(rail,slot,w,skipId)}};
  const startDrag=(k,o,e,dev)=>{e.preventDefault();S.drag={k,o:Object.assign({},o),dev,ghost:null};S.sel=null;S.ex=false;
    const mv=ev=>{S.drag.ghost=target(pt(ev),k,dev&&dev.id);draw()};
    const up=ev=>{document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',up);const gh=S.drag.ghost;
      if(dev){if(gh&&gh.rail&&gh.ok){dev.rail=gh.rail;dev.slot=gh.slot}else if(!gh||!gh.rail){const inside=gh&&gh.x>420&&gh.x<420+SLOTS*U+70&&gh.y>40&&gh.y<690;if(!inside&&gh){S.dev=S.dev.filter(x=>x!==dev);const ts=terms(dev);S.wires=S.wires.filter(w=>!ts.includes(w.a)&&!ts.includes(w.b))}}}
      else if(gh&&gh.rail&&gh.ok)S.dev.push({id:S.nid++,type:k,rail:gh.rail,slot:gh.slot,o:Object.assign({},o),on:true});
      S.drag=null;draw()};
    document.addEventListener('pointermove',mv);document.addEventListener('pointerup',up)};
  /* ---- events ---- */
  $q('#b8pal').addEventListener('input',e=>{const t=e.target;if(t.id==='b8G'){S.G=+t.value;$q('#b8Gv').textContent=S.G+' W/m²'}else if(t.id==='b8vg'){S.vg=+t.value;$q('#b8vgv').textContent=S.vg+' V';if(S.inv==='trip'&&S.vg>=207&&S.vg<=253&&S.fx&&S.fx.title&&S.fx.title.startsWith('แรงดันกริด'))S.inv=''}else if(t.id==='b8ld'){S.load=+t.value;$q('#b8ldv').textContent=S.load+' W'}else return;draw()});
  $q('#b8pal').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.ev){event(b.dataset.ev);if(b.dataset.ev==='reset'){$q('#b8ev').hidden=true}return}
    if(b.dataset.sa){S.SA=+b.dataset.sa;S.ex=false;S.wires=S.wires.filter(w=>![w.a,w.b].some(t=>/^S\d/.test(t)&&+t[1]>S.SA));palette();draw();return}
    if(b.dataset.ws){S.ws=+b.dataset.ws;palette();return}
    if(b.dataset.k&&b.dataset.o){const v=isNaN(+b.dataset.v)?b.dataset.v:+b.dataset.v;S.pick[b.dataset.k][b.dataset.o]=v;palette()}});
  $q('#b8pal').addEventListener('change',e=>{if(e.target.id==='b8m')S.M=+e.target.value;if(e.target.id==='b8t')S.tmin=+e.target.value;S.ex=false;draw()});
  $q('#b8pal').addEventListener('pointerdown',e=>{const c=e.target.closest('.b8drag');if(!c)return;const k=c.dataset.k;startDrag(k,S.pick[k],e,null)});
  svg.addEventListener('pointerdown',e=>{const t=e.target.closest('.b8t');if(t)return;const tg=e.target.closest('.b8tog');if(tg)return;const dv=e.target.closest('.b8dev');if(dv){const d=S.dev.find(x=>x.id===+dv.dataset.id);startDrag(d.type,d.o,e,d)}});
  svg.addEventListener('click',e=>{const tg=e.target.closest('.b8tog');if(tg){const d=S.dev.find(x=>x.id===+tg.dataset.id);d.on=!d.on;if(d.on)d.trip=false;draw();return}
    const t=e.target.closest('.b8t');if(t){const id=t.dataset.t;if(!S.sel){S.sel=id}else if(S.sel===id){S.sel=null}else{const a=S.sel,b=id;S.sel=null;
      if(!S.wires.some(w=>(w.a===a&&w.b===b)||(w.a===b&&w.b===a))){let r=role(a)||role(b);if(!r){const f=nets(),F=FIX(),hit=Object.keys(F).find(k=>F[k].on!==false&&(f(k)===f(a)||f(k)===f(b)));r=hit?F[hit].r:'+'}S.wires.push({a,b,r,s:S.ws});S.ex=false}}draw();return}
    const w=e.target.closest('.b8w');if(w){S.wires.splice(+w.dataset.i,1);S.ex=false;draw();return}
    if(S.sel){S.sel=null;draw()}});
  $q('#b8clr').addEventListener('click',()=>{S.wires=[];S.ex=false;draw()});
  $q('#b8all').addEventListener('click',()=>{S.wires=[];S.dev=[];S.ex=false;draw()});
  $q('#b8ex').addEventListener('click',()=>{/* example: 3 strings so fuses are required */
    S.SA=3;S.M=10;S.tmin=10;S.dev=[];S.wires=[];S.nid=1;
    const add=(type,rail,slot,o)=>{const d={id:S.nid++,type,rail,slot,o,on:true};S.dev.push(d);return d.id};
    const fu=[0,1,2,3,4,5].map(i=>add('fuse','dc',i,{A:25}));const sw=add('dcsw','dc',6,{A:63,V:1000});
    const dsp=add('dcspd','dc',8,{V:1000});
    const rc=add('rcbo','ac',0,{A:32,T:'A'}),mc=add('mcb','ac',2,{A:32}),as=add('acspd','ac',4,{V:275});
    const W=(a,b,s,r)=>S.wires.push({a,b,s:s||4,r:r||role(a)||role(b)});
    for(let s=1;s<=3;s++){W(`S${s}+`,`${fu[(s-1)*2]}.t0`);W(`S${s}-`,`${fu[(s-1)*2+1]}.t0`,4,'-')}
    W(`${fu[0]}.b0`,`${fu[2]}.b0`,10,'+');W(`${fu[2]}.b0`,`${fu[4]}.b0`,10,'+');W(`${fu[4]}.b0`,`${sw}.t0`,10,'+');
    W(`${fu[1]}.b0`,`${fu[3]}.b0`,10,'-');W(`${fu[3]}.b0`,`${fu[5]}.b0`,10,'-');W(`${fu[5]}.b0`,`${sw}.t1`,10,'-');
    W(`${sw}.b0`,'INV+',10);W(`${sw}.b1`,'INV-',10);W(`${sw}.b0`,`${dsp}.t0`,10);W(`${sw}.b1`,`${dsp}.t1`,10,'-');W(`${dsp}.pe`,'E1',10,'PE');
    W('INVL',`${mc}.t0`,6);W('INVN',`${mc}.t1`,6);W(`${mc}.b0`,`${rc}.t0`,6,'L');W(`${mc}.b1`,`${rc}.t1`,6,'N');W(`${rc}.b0`,'GL',6);W(`${rc}.b1`,'GN',6);
    W(`${mc}.b0`,`${as}.t0`,6,'L');W(`${mc}.b1`,`${as}.t1`,6,'N');W(`${as}.pe`,'E3',6,'PE');W('INVPE','E5',6,'PE');W('GPE','E7',10,'PE');W('FR','E0',6,'PE');
    S.ex=true;palette();draw()});
  palette();draw();
}


/* ---- zoom for each topic's simulation (mobile): buttons, two-finger pinch, pan mode, full screen ----
   content is scaled with a CSS transform (SVG pointer maths use getScreenCTM so dragging and tapping still land correctly) */
function b0Zoom(w){
  if(w.dataset.zm)return;w.dataset.zm='1';
  const bar=document.createElement('div');bar.className='b0zbar';
  bar.innerHTML=`<button class="chip sm" data-z="-" type="button" aria-label="ย่อ">−</button><b class="b0zv">100%</b><button class="chip sm" data-z="+" type="button" aria-label="ขยาย">+</button><button class="chip sm" data-z="fit" type="button">พอดีจอ</button><button class="chip sm" data-z="pan" type="button" aria-pressed="false">✋ เลื่อนภาพ</button><button class="chip sm" data-z="full" type="button" aria-pressed="false">⛶ เต็มจอ</button><span class="hint tight b0zh">มือถือ: ใช้สองนิ้วบีบเพื่อซูม · เปิด ✋ แล้วใช้นิ้วเดียวเลื่อนภาพ</span>`;
  const out=document.createElement('div');out.className='b0zo';const sp=document.createElement('div');sp.className='b0zsp';const inn=document.createElement('div');inn.className='b0zin';
  while(w.firstChild)inn.appendChild(w.firstChild);sp.appendChild(inn);out.appendChild(sp);w.appendChild(bar);w.appendChild(out);
  let z=1,base=0;const val=bar.querySelector('.b0zv');
  const layout=()=>{if(!base||z===1)base=out.clientWidth||base;inn.style.width=base+'px';inn.style.transform=z===1?'':`scale(${z})`;
    sp.style.width=(base*z)+'px';sp.style.height=(inn.offsetHeight*z)+'px';val.textContent=Math.round(z*100)+'%';out.classList.toggle('zoomed',z>1)};
  const setZ=(nz,cx,cy)=>{nz=Math.max(1,Math.min(3,Math.round(nz*100)/100));if(nz===z)return;const r=out.getBoundingClientRect(),px=(cx==null?r.width/2:cx-r.left),py=(cy==null?Math.min(r.height,innerHeight)/2:cy-r.top);
    const ax=(out.scrollLeft+px)/z,ay=(out.scrollTop+py)/z;z=nz;layout();out.scrollLeft=ax*z-px;out.scrollTop=ay*z-py};
  new ResizeObserver(layout).observe(inn);addEventListener('resize',()=>{if(z===1){base=0;layout()}});
  bar.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const k=b.dataset.z;
    if(k==='+')setZ(z+.25);else if(k==='-')setZ(z-.25);else if(k==='fit'){z=1;base=0;layout();out.scrollLeft=0}
    else if(k==='pan'){const on=!out.classList.contains('pan');out.classList.toggle('pan',on);b.setAttribute('aria-pressed',on)}
    else if(k==='full'){const on=!w.classList.contains('b0zfull');w.classList.toggle('b0zfull',on);b.setAttribute('aria-pressed',on);document.body.classList.toggle('b0zlock',on);base=0;z=1;layout();out.scrollTop=0;out.scrollLeft=0}});
  /* two-finger pinch + pan */
  let pin=null;const d2=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY),mid=t=>[(t[0].clientX+t[1].clientX)/2,(t[0].clientY+t[1].clientY)/2];
  out.addEventListener('touchstart',e=>{if(e.touches.length===2){pin={d:d2(e.touches),z,m:mid(e.touches),sl:out.scrollLeft,st:out.scrollTop};e.preventDefault()}},{passive:false});
  out.addEventListener('touchmove',e=>{if(!pin||e.touches.length!==2)return;e.preventDefault();const m=mid(e.touches);setZ(pin.z*d2(e.touches)/pin.d,m[0],m[1]);out.scrollLeft-=m[0]-pin.m[0];out.scrollTop-=m[1]-pin.m[1];pin.m=m},{passive:false});
  out.addEventListener('touchend',e=>{if(e.touches.length<2)pin=null});
  /* ctrl + wheel on desktop */
  out.addEventListener('wheel',e=>{if(!e.ctrlKey)return;e.preventDefault();setZ(z*(e.deltaY<0?1.1:1/1.1),e.clientX,e.clientY)},{passive:false});
  requestAnimationFrame(layout);
}

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
    const mount=()=>{const w=d.querySelector('.b0wi');if(w&&!w.dataset.on&&t.w){w.dataset.on='1';try{t.w(w)}catch(e){w.textContent='แบบจำลองนี้แสดงไม่ได้ในเบราว์เซอร์นี้'}try{b0Zoom(w)}catch(e){}}};
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
