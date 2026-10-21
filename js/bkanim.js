/* ---- menu 07: animated power-flow picture (panels → DC box → inverter ↔ battery, inverter → AC board ↔ grid, board → loads)
   Reads the 5-minute balance from backupRun (window.lastBal). Dash speed follows the power on each wire, direction follows its sign. */
const BKA={picBad:{},i:144,play:false,speed:3,last:0,acc:0,off:{},raf:0,cloud:{on:false,x:520,y:70,thick:0.75,size:1.5}};
const bkaHM=i=>{const m=i*5;return String(Math.floor(m/60)%24).padStart(2,'0')+':'+String(m%60).padStart(2,'0')};
const bkaKW=w=>(Math.abs(w)/1000).toFixed(Math.abs(w)<10000?2:1)+' kW';
function bkaSVG(){
  const panel=(x,y,k)=>`<g id="bapnl${k}" transform="translate(${x} ${y}) skewX(-18)"><rect width="78" height="46" rx="2" class="ba-pv"/>${[1,2,3].map(k=>`<line x1="${k*19.5}" y1="0" x2="${k*19.5}" y2="46" class="ba-pvl"/>`).join('')}<line x1="0" y1="23" x2="78" y2="23" class="ba-pvl"/></g>`;
  const badge=(x,y,t,c,m)=>`<g class="ba-bd ${c} ${m||''}"><circle cx="${x}" cy="${y}" r="13"/><text x="${x}" y="${y+4}" text-anchor="middle">${t}</text></g>`;
  return `<svg viewBox="0 0 800 470" class="ba" role="img" aria-label="ภาพเคลื่อนไหวการไหลของไฟฟ้าในระบบ">
  <rect x="0" y="0" width="800" height="470" class="ba-wall"/><rect x="0" y="440" width="800" height="30" class="ba-floor"/>
  <g id="basun" class="ba-sun">${[0,1,2,3,4,5,6,7].map(k=>{const a=k*Math.PI/4;return`<line x1="${(Math.cos(a)*23).toFixed(1)}" y1="${(Math.sin(a)*23).toFixed(1)}" x2="${(Math.cos(a)*32).toFixed(1)}" y2="${(Math.sin(a)*32).toFixed(1)}"/>`}).join('')}<circle r="17"/></g>
  <g id="bamoon" class="ba-moon"><path d="M6 -19 A20 20 0 1 0 6 19 A15 15 0 1 1 6 -19Z"/><circle cx="-48" cy="-6" r="1.6"/><circle cx="40" cy="14" r="1.3"/><circle cx="-20" cy="22" r="1.1"/><circle cx="58" cy="-14" r="1.5"/></g>
  <g class="ba-rack"><line x1="40" y1="96" x2="380" y2="96"/><line x1="70" y1="96" x2="62" y2="122"/><line x1="350" y1="96" x2="342" y2="122"/></g>
  ${[0,1,2,3].map(k=>panel(54+k*82,46,k)).join('')}
  <clipPath id="bapvclip">${[0,1,2,3].map(k=>{const x=54+k*82;return`<polygon points="${x},46 ${x+78},46 ${(x+78-14.9).toFixed(1)},92 ${(x-14.9).toFixed(1)},92"/>`}).join('')}</clipPath>
  <rect id="bashade" x="0" y="40" width="0" height="60" class="ba-shade" clip-path="url(#bapvclip)"/>
  <text x="210" y="34" text-anchor="middle" class="ba-lab">แผงโซลาร์</text>
  <!-- wires (base + animated dash) -->
  ${[['pv','M120 96 V150 H80 V190','dc ba-str'],['pv2','M80 238 V262 H262','dc ba-str'],['bat','M300 330 V372 H200','dc ba-str'],['ac','M380 262 H470','ac ba-str'],['mtr','M340 229 H440 V262 H470','ac ba-mic'],['md0','M82 94 V222 H140','dc ba-mic'],['md1','M164 94 V130 H120 V172 H140','dc ba-mic'],['md2','M246 94 V130 H298 V173 H276','dc ba-mic'],['md3','M328 94 V216 H276','dc ba-mic'],['grid','M700 150 V215 H570','ac'],['load','M520 262 V330 H600','ac']]
    .map(([id,d,c])=>`<path d="${d}" class="ba-w ${c}"/><path id="baw-${id}" d="${d}" class="ba-f ${c}"/>`).join('')}
  <!-- microinverters: one under each panel, AC trunk straight to the board -->
  <g class="ba-mic"><image href="img/inv/deye-micro.png?v=2" x="140" y="150" width="200" height="109" preserveAspectRatio="xMidYMid meet"/>
    ${[0,1,2,3].map(k=>`<text id="bapw${k}" x="${54+k*82+32}" y="74" text-anchor="middle" class="ba-pw"></text>`).join('')}<text x="100" y="236" class="ba-pin">PV1</text><text x="96" y="168" class="ba-pin">PV2</text><text x="300" y="168" class="ba-pin">PV3</text><text x="300" y="211" class="ba-pin">PV4</text>
    <text id="bamicn" x="242" y="278" text-anchor="middle" class="ba-lab">ไมโครอินเวอร์เตอร์</text><text x="242" y="296" text-anchor="middle" class="ba-sm">แผงละ 1 ช่อง (4 แผงต่อ 1 ตัว) แปลง DC เป็น AC ที่หลังแผง</text>
    <text id="bav-md" x="242" y="314" text-anchor="middle" class="ba-sm"></text></g>
  <!-- DC isolator -->
  <g class="ba-str"><rect x="52" y="190" width="56" height="48" rx="5" class="ba-box"/><rect x="66" y="203" width="28" height="18" rx="3" class="ba-sw"/><text x="80" y="252" text-anchor="middle" class="ba-sm">DC isolator</text></g>
  <!-- inverter -->
  <g id="bainv" class="ba-str"><g id="bainvbody"><rect x="262" y="180" width="118" height="150" rx="10" class="ba-inv"/><circle id="baled" cx="321" cy="258" r="6" class="ba-led"/><text id="bainvb" x="321" y="284" text-anchor="middle" class="ba-brand"></text></g>
    <image id="bainvimg" x="250" y="168" width="142" height="128" preserveAspectRatio="xMidYMid meet" style="display:none"/>
    <g id="bainvlcd"><rect x="282" y="196" width="78" height="44" rx="6" class="ba-lcd"/><text id="bainvt1" x="321" y="214" text-anchor="middle" class="ba-lcdt">—</text><text id="bainvt2" x="321" y="231" text-anchor="middle" class="ba-lcdt sm">—</text></g>
    <text id="bainvl" x="321" y="303" text-anchor="middle" class="ba-lab">อินเวอร์เตอร์</text><text id="bainvm" x="321" y="319" text-anchor="middle" class="ba-sm">—</text></g>
  <!-- battery -->
  <g id="babat" class="ba-str"><rect x="96" y="300" width="104" height="138" rx="10" class="ba-bat"/><rect x="112" y="314" width="72" height="22" rx="4" class="ba-lcd"/><text id="basoc" x="148" y="330" text-anchor="middle" class="ba-lcdt">—</text>
    <rect x="132" y="350" width="32" height="70" rx="4" class="ba-cell"/><rect id="basocf" x="135" y="353" width="26" height="64" rx="2" class="ba-socf"/>
    <text id="babatb" x="148" y="432" text-anchor="middle" class="ba-brand sm"></text><text x="148" y="455" text-anchor="middle" class="ba-lab">แบตเตอรี่</text><text id="babatx" x="148" y="300" dy="-8" text-anchor="middle" class="ba-sm"></text></g>
  <!-- AC board -->
  <g><rect x="470" y="226" width="100" height="72" rx="6" class="ba-box"/>${[0,1,2,3,4].map(k=>`<rect x="${482+k*16}" y="244" width="11" height="22" rx="2" class="ba-brk"/>`).join('')}<text x="520" y="290" text-anchor="middle" class="ba-sm">ตู้ไฟ AC</text></g>
  <!-- grid -->
  <g id="bagrid"><path d="M664 48 Q732 62 800 50 M700 44 Q750 56 800 44 M736 48 Q770 58 800 56" class="ba-hv"/>
    <rect x="695" y="34" width="10" height="122" rx="2" class="ba-polep"/><rect x="660" y="44" width="80" height="7" rx="2" class="ba-arm"/>
    ${[664,700,736].map(x=>`<rect x="${x-3}" y="36" width="6" height="9" rx="2" class="ba-ins"/>`).join('')}
    <rect x="672" y="70" width="22" height="34" rx="6" class="ba-tr"/><line x1="683" y1="70" x2="683" y2="52" class="ba-hv"/><text x="660" y="92" text-anchor="end" class="ba-sm">หม้อแปลง</text>
    <path d="M694 96 Q700 128 700 150" class="ba-hv"/>
    <rect x="678" y="150" width="44" height="34" rx="5" class="ba-box"/><text id="bkameter" x="700" y="172" text-anchor="middle" class="ba-sm">kWh</text>
    <text x="700" y="30" text-anchor="middle" class="ba-lab">การไฟฟ้า (กริด)</text><g id="bagridx" class="ba-x"><line x1="684" y1="86" x2="716" y2="118"/><line x1="716" y1="86" x2="684" y2="118"/></g></g>
  <!-- loads -->
  <g id="baload"><rect x="600" y="400" width="180" height="8" class="ba-shelf"/>
    <rect x="604" y="300" width="44" height="100" rx="5" class="ba-ap"/><line x1="604" y1="336" x2="648" y2="336" class="ba-apl"/>
    <rect x="660" y="352" width="56" height="36" rx="3" class="ba-tv"/><rect x="684" y="388" width="8" height="12" class="ba-ap"/>
    <rect x="660" y="300" width="112" height="28" rx="6" class="ba-ap"/><line x1="668" y1="320" x2="764" y2="320" class="ba-apl"/>
    <circle cx="748" cy="374" r="13" class="ba-lamp"/><rect x="744" y="386" width="8" height="14" class="ba-ap"/>
    <text x="690" y="430" text-anchor="middle" class="ba-lab">โหลดในบ้าน</text></g>
  <g id="bacloud" class="ba-cloud" transform="translate(520 70)" tabindex="0" role="slider" aria-label="เมฆ ลากไปบังแผง (ใช้ลูกศรซ้าย/ขวาได้)"><g class="ba-cs"><ellipse cx="0" cy="12" rx="62" ry="22"/><circle cx="-28" cy="2" r="24"/><circle cx="6" cy="-10" r="32"/><circle cx="36" cy="4" r="22"/></g><text x="0" y="12" text-anchor="middle" class="ba-sm">⇆ ลากเมฆ</text></g>
  ${badge(80,150,'DC','dc','ba-str')}${badge(190,262,'DC','dc','ba-str')}${badge(250,372,'DC','dc','ba-str')}${badge(425,262,'AC','ac','ba-str')}${badge(400,229,'AC','ac','ba-mic')}${badge(620,215,'AC','ac')}${badge(560,330,'AC','ac')}
  <!-- flow labels -->
  <g class="ba-val"><text id="bav-pv" x="150" y="140" class="ba-str">—</text><text id="bav-bat" x="210" y="396" class="ba-str">—</text><text id="bav-ac" x="425" y="250" text-anchor="middle" class="ba-str">—</text><text id="bav-mtr" x="360" y="212" class="ba-mic">—</text>
    <text id="bav-grid" x="640" y="240">—</text><text id="bav-load" x="690" y="292" text-anchor="middle">—</text></g>
</svg>`;
}
function bkaFrame(){
  const R=window.lastBal&&window.lastBal.R,host=document.getElementById('bkasvg');
  if(!R||!host||!host.firstChild)return;
  const i=Math.max(0,Math.min(R.pv.length-1,BKA.i)),mode=window.lastBal.mode;
  const cf=bkaCloud(),out=R.outage[i];let pv=Math.max(0,R.pv[i]-R.curt[i]),bat=R.fromBat[i]-R.toBat[i],grid=R.imp[i]-R.exp[i],load=Math.max(0,R.load[i]-R.unmet[i]),unmet=R.unmet[i];
  if(cf>0&&R.pv[i]>1){const x=bkaInstant(i,R.pv[i]*(1-cf));pv=x.pv;bat=x.bat;grid=x.grid;load=x.load;unmet=x.unmet}
  const inv=pv+bat;
  const q=id=>document.getElementById(id),txt=(id,t)=>{const e=q(id);if(e)e.textContent=t};
  const mic=isMicro(curInv());host.classList.toggle('micro',mic);
  const On=[1,2,3,4].map(k=>!mic||bkMicOn(k)),Wp=[1,2,3,4].map((k,j)=>On[j]?mpPV(k).pmax:0),Ws=Wp.reduce((a,b)=>a+b,0)||1,Uu=mic?microU(curInv()):1,md=k=>mic?pv/Uu*Wp[k]/Ws:0;
  BKA.v={pv:mic?0:pv,pv2:mic?0:pv,bat:mic?0:-bat,ac:mic?0:inv,mtr:mic?inv:0,md0:md(0),md1:md(1),md2:md(2),md3:md(3),grid,load};
  if(mic)Wp.forEach((w,k)=>txt('bapw'+k,On[k]?w+' W':'ไม่ต่อแผง'));[0,1,2,3].forEach(k=>{const g=q('bapnl'+k);if(g)g.classList.toggle('ba-off',!On[k])});
  if(mic){const U=microU(curInv());txt('bav-mtr',bkaKW(inv)+(U>1?` (รวม ${U} ตัว)`:''));txt('bamicn',U>1?`ไมโครอินเวอร์เตอร์ × ${U} ตัว (ภาพแสดง 1 ตัว)`:'ไมโครอินเวอร์เตอร์ 1 ตัว');txt('bav-md',pv>1?`กำลังจากแผง ${On.filter(Boolean).length} แผง ${bkaKW(pv/U)}${U>1?' ต่อตัว':''}`:'')}/* positive = along the path as drawn */
  const h=i*5/60,day=h>=6&&h<=18,sun=q('basun'),moon=q('bamoon');
  if(day){const a=(h-6)/12*Math.PI;sun.setAttribute('transform',`translate(${(430+(h-6)/12*210).toFixed(1)} ${(125-Math.sin(a)*95).toFixed(1)})`);sun.style.display=''}else sun.style.display='none';
  {const hn=(h+6)%24,a=Math.min(12,hn)/12*Math.PI;moon.setAttribute('transform',`translate(${(430+Math.min(12,hn)/12*210).toFixed(1)} ${(115-Math.sin(a)*80).toFixed(1)})`)}moon.style.display=day?'none':'';
  bkaShade(day);
  host.classList.toggle('night',!day);
  txt('bav-pv',pv>1?bkaKW(pv):'0 kW');txt('bav-ac',Math.abs(inv)>1?bkaKW(inv):'0 kW');txt('bav-load',(load>1?bkaKW(load):'0 kW')+(unmet>1?' · ขาด '+bkaKW(unmet):''));
  txt('bav-bat',mode==='grid'?'':Math.abs(bat)<1?'พัก':(bat>0?'จ่าย ':'ชาร์จ ')+bkaKW(bat));
  const lim=window.lastBal.cfg&&window.lastBal.cfg.expLimW;
  txt('bav-grid',mode==='off'?'':out?'ไฟดับ':(Math.abs(grid)<1?'0 kW':(grid>0?'ซื้อ ':'ขาย ')+bkaKW(grid))+(lim!=null?(lim===0?' · Zero export':' · จำกัด '+bkaKW(lim)):''));
  {const I=curInv(),B=typeof curBat==='function'?curBat():null;txt('bainvb',String(I.brand||'').toUpperCase());bkaInvPic(I);txt('babatb',mode==='grid'?'':B?String(B.brand||'').toUpperCase():'')}
  const stop=mode==='grid'&&out;
  txt('bainvt1',stop?'STOP':bkaKW(inv));txt('bainvt2',stop?'กริดดับ':out?'จ่ายเอง':mode==='off'?'Off-grid':'ต่อกริด');
  txt('bainvm',mode==='grid'?'On-grid':mode==='off'?'Off-grid':'Hybrid');
  q('baled').setAttribute('class','ba-led '+(stop?'err':unmet>1?'warn':'ok'));
  const soc=R.soc[i]||0,f=q('basocf');txt('basoc',mode==='grid'?'—':Math.round(soc)+'%');
  f.setAttribute('height',Math.max(0,64*soc/100));f.setAttribute('y',353+64*(1-soc/100));f.setAttribute('class','ba-socf'+(soc<25?' low':''));
  q('babat').classList.toggle('ba-off',mode==='grid');txt('babatx',mode==='grid'?'ไม่ใช้แบต (On-grid)':'');
  q('bagrid').classList.toggle('ba-off',mode==='off'||out);q('bagridx').style.display=out&&mode!=='off'?'':'none';
  q('baload').classList.toggle('ba-dark',unmet>1&&load<1);q('baload').classList.toggle('ba-dim',unmet>1&&load>=1);
  ['pv','pv2','bat','ac','mtr','md0','md1','md2','md3','grid','load'].forEach(k=>{const p=q('baw-'+k);if(p)p.classList.toggle('idle',Math.abs(BKA.v[k])<1||(k==='bat'&&mode==='grid')||(k==='grid'&&(mode==='off'||out)))});
  q('bkat').value=i;txt('bkatl',bkaHM(i));bkaCursor();
  const note=q('bkanote');if(note)note.textContent=(cf>0&&R.pv[i]>1&&(out||stop)?`เมฆบังแผง ${Math.round(cf*100)}% · `:'')+(stop?'กริดดับ อินเวอร์เตอร์ On-grid ตัดการจ่ายทันที (anti-islanding) แม้มีแดด':out?'กริดดับ ระบบจ่ายไฟเองจากแผงและแบต เฉพาะ'+(window.lastBal.island==='crit'?'โหลดสำคัญ':'โหลดทั้งหมด'):
    (cf>0&&R.pv[i]>1?`เมฆบังแผง ${Math.round(cf*100)}% แดดลดลง · `:'')+(unmet>1?'ไฟไม่พอจ่ายโหลด':grid<-1?'ไฟเหลือ ขายคืนกริด':bat<-1?'ไฟเหลือ ชาร์จเข้าแบต':grid>1?'ซื้อไฟจากกริดเสริม':bat>1?'แบตจ่ายเสริม':''));
}
/* cloud: covered share of the panel row (horizontal overlap while the cloud is at panel height) × thickness */
function bkaCover(){const c=BKA.cloud;if(!c.on)return{f:0,x1:0,x2:0};const r=64*c.size,x1=Math.max(40,c.x-r),x2=Math.min(392,c.x+r);
  const near=c.y>=10&&c.y<=150;return near&&x2>x1?{f:(x2-x1)/352,x1,x2}:{f:0,x1:0,x2:0}}
function bkaCloud(){return bkaCover().f*BKA.cloud.thick}
function bkaShade(day){const s=document.getElementById('bashade'),cl=document.getElementById('bacloud');if(!s||!cl)return;const c=bkaCover();
  cl.style.display=BKA.cloud.on?'':'none';cl.setAttribute('transform',`translate(${BKA.cloud.x.toFixed(0)} ${BKA.cloud.y.toFixed(0)})`);const g=cl.querySelector('.ba-cs');if(g)g.setAttribute('transform',`scale(${BKA.cloud.size} 1)`);
  s.setAttribute('x',c.x1-8);s.setAttribute('width',Math.max(0,c.x2-c.x1));s.style.opacity=day?(0.25+0.5*BKA.cloud.thick):0}
/* one-step what-if with the clouded PV: panels to loads first, then battery, then grid (same order as balance()) */
function bkaInstant(i,pvNew){
  const B=window.lastBal,R=B.R,cfg=B.cfg||{},mode=B.mode,out=R.outage[i],want=R.load[i],soc=R.soc[i]||0;
  if(mode==='grid'&&out)return{pv:0,bat:0,grid:0,load:0,unmet:want};
  const gridUp=mode!=='off'&&!out,hasBat=mode!=='grid'&&cfg.bank;
  const minSoc=hasBat?100-((cfg.bank.b&&cfg.bank.b.dod)||90):0;
  let direct=Math.min(pvNew,want),sur=pvNew-direct,def=want-direct,bat=0,grid=0,unmet=0,used=pvNew;
  if(sur>0){const ch=hasBat&&soc<99.5?Math.min(sur,(cfg.chgKw||0)*1000):0;bat=-ch;sur-=ch;if(gridUp){grid=-sur;if(cfg.expLimW!=null&&-grid>cfg.expLimW){used-=(-grid-cfg.expLimW);grid=-cfg.expLimW}}else used-=sur}
  if(def>0){const ds=hasBat&&soc>minSoc+0.5?Math.min(def,(cfg.disKw||0)*1000):0;bat=ds;def-=ds;if(gridUp)grid=def;else unmet=def}
  return{pv:used,bat,grid,load:want-unmet,unmet};
}
function bkaDrag(){
  const cl=document.getElementById('bacloud'),svg=cl&&cl.ownerSVGElement;if(!cl||cl.dataset.dr)return;cl.dataset.dr='1';
  const pt=e=>{const m=svg.getScreenCTM().inverse(),p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(m)};
  let d=null;
  cl.addEventListener('pointerdown',e=>{const p=pt(e);d={dx:p.x-BKA.cloud.x,dy:p.y-BKA.cloud.y};cl.setPointerCapture(e.pointerId);cl.classList.add('drag');e.preventDefault()});
  cl.addEventListener('pointermove',e=>{if(!d)return;const p=pt(e);BKA.cloud.x=Math.max(30,Math.min(770,p.x-d.dx));BKA.cloud.y=Math.max(46,Math.min(200,p.y-d.dy));bkaFrame()});
  const up=()=>{d=null;cl.classList.remove('drag')};cl.addEventListener('pointerup',up);cl.addEventListener('pointercancel',up);
  cl.addEventListener('keydown',e=>{const k={ArrowLeft:-20,ArrowRight:20}[e.key];if(k){BKA.cloud.x=Math.max(30,Math.min(770,BKA.cloud.x+k));bkaFrame();e.preventDefault()}});
}
/* product picture of the chosen inverter brand (img/inv/*.png, transparent background); the drawn box stays as fallback */
function bkaInvSrc(I){
  const b=String(I.brand||'').toLowerCase(),m=String(I.model||'');
  if(b==='huawei')return'huawei';if(b==='solis')return'solis';
  if(b==='deye')return /SUN-M|micro|ไมโคร/i.test(m+' '+(I.note||''))||I.type==='micro'?'deye-micro':'deye-hybrid';
  return'';
}
function bkaInvPic(I){
  const img=document.getElementById('bainvimg');if(!img)return;const k=bkaInvSrc(I),body=document.getElementById('bainvbody'),lcd=document.getElementById('bainvlcd');
  const show=on=>{img.style.display=on?'':'none';body.style.display=on?'none':'';lcd.setAttribute('transform',on?'translate(0 -70)':'');
    document.getElementById('bainvl').setAttribute('y',on?316:303);document.getElementById('bainvm').setAttribute('y',on?331:319)};
  if(!k||BKA.picBad[k]){show(false);return}
  if(img.dataset.k!==k){img.dataset.k=k;img.onerror=()=>{BKA.picBad[k]=1;show(false)};img.setAttribute('href','img/inv/'+k+'.png?v=3')}
  show(true);
}
/* time cursor on the menu 07 charts follows the animation time; click a chart to jump the animation there */
function bkaCursor(){
  const h=(BKA.i+.5)*5/60,NS='http://www.w3.org/2000/svg';
  ['chK1','chK2'].forEach(id=>{const host=document.getElementById(id),m=host&&host._map,svg=host&&host.querySelector('svg');if(!m||!svg)return;
    let g=svg.querySelector('.tcur');
    if(!g){g=document.createElementNS(NS,'g');g.setAttribute('class','tcur');g.innerHTML='<line/><rect rx="4" height="18" width="46"/><text text-anchor="middle"></text>';const ov=svg.querySelector('.ov');svg.insertBefore(g,ov||null)}
    const x=m.ml+(h-m.x0)/(m.x1-m.x0)*m.iw,[l,r,t]=g.children;
    l.setAttribute('x1',x);l.setAttribute('x2',x);l.setAttribute('y1',m.mt);l.setAttribute('y2',m.mt+m.ih);
    const tx=Math.max(m.ml+23,Math.min(m.ml+m.iw-23,x));r.setAttribute('x',tx-23);r.setAttribute('y',m.mt-19);t.setAttribute('x',tx);t.setAttribute('y',m.mt-6);t.textContent=bkaHM(BKA.i);
  });
}
function bkaTick(t){
  BKA.raf=0;
  const tab=document.getElementById('tab-backup');
  if(!tab||tab.hidden||document.hidden||!BKA.v){BKA.last=0;return}
  const dt=BKA.last?Math.min(0.1,(t-BKA.last)/1000):0;BKA.last=t;
  const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  Object.keys(BKA.v).forEach(k=>{const p=document.getElementById('baw-'+k);if(!p)return;const w=BKA.v[k];
    const sp=Math.abs(w)<1?0:(18+Math.min(1,Math.abs(w)/6000)*70)*Math.sign(w);BKA.off[k]=((BKA.off[k]||0)-(reduce?0:sp*dt))%220;p.style.strokeDashoffset=BKA.off[k]});
  if(BKA.play){BKA.acc+=dt*BKA.speed*4;if(BKA.acc>=1){const n=Math.floor(BKA.acc);BKA.acc-=n;BKA.i=(BKA.i+n)%288;bkaFrame()}}
  BKA.raf=requestAnimationFrame(bkaTick);
}
function bkaKick(){if(!BKA.raf)BKA.raf=requestAnimationFrame(bkaTick)}
function bkAnimUpdate(){const host=document.getElementById('bkasvg');if(!host)return;if(!host.firstChild){host.innerHTML=bkaSVG();bkaDrag()}bkaFrame();bkaKick()}
function initBkAnim(){
  const t=document.getElementById('bkat');if(!t)return;
  t.addEventListener('input',e=>{BKA.i=+e.target.value;bkaFrame()});
  document.getElementById('bkaplay').addEventListener('click',e=>{BKA.play=!BKA.play;e.currentTarget.textContent=BKA.play?'❚❚ หยุด':'▶ เล่นทั้งวัน';e.currentTarget.setAttribute('aria-pressed',String(BKA.play));bkaKick()});
  document.getElementById('bkasp').addEventListener('change',e=>{BKA.speed=+e.target.value});
  document.querySelectorAll('[data-bkat]').forEach(b=>b.addEventListener('click',()=>{const R=window.lastBal&&window.lastBal.R;let i=144;
    if(b.dataset.bkat==='out'&&R){const k=R.outage.indexOf(true);i=k>=0?Math.min(287,k+6):144}else i=+b.dataset.bkat;BKA.i=i;bkaFrame()}));
  const cb=document.getElementById('bkacloud'),ct=document.getElementById('bkathick'),cz=document.getElementById('bkasize');
  cb.addEventListener('click',()=>{BKA.cloud.on=!BKA.cloud.on;if(BKA.cloud.on){BKA.cloud.x=520;BKA.cloud.y=70}cb.setAttribute('aria-pressed',String(BKA.cloud.on));cb.textContent=BKA.cloud.on?'☁ เอาเมฆออก':'☁ เพิ่มเมฆ';ct.hidden=cz.hidden=!BKA.cloud.on;bkaFrame()});
  ct.addEventListener('change',e=>{BKA.cloud.thick=+e.target.value;bkaFrame()});
  cz.addEventListener('change',e=>{BKA.cloud.size=+e.target.value;bkaFrame()});
  document.addEventListener('visibilitychange',bkaKick);
  ['chK1','chK2'].forEach(id=>{const host=document.getElementById(id);if(!host)return;host.addEventListener('click',e=>{const m=host._map,svg=host.querySelector('svg');if(!m||!svg)return;
    const r=svg.getBoundingClientRect(),px=(e.clientX-r.left)*(m.W/r.width),h=m.x0+(px-m.ml)/m.iw*(m.x1-m.x0);if(h<m.x0||h>m.x1)return;BKA.i=Math.max(0,Math.min(287,Math.round(h*12-.5)));bkaFrame()})});
}
