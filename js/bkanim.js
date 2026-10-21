/* ---- menu 07: animated power-flow picture (panels → DC box → inverter ↔ battery, inverter → AC board ↔ grid, board → loads)
   Reads the 5-minute balance from backupRun (window.lastBal). Dash speed follows the power on each wire, direction follows its sign. */
const BKA={i:144,play:false,speed:3,last:0,acc:0,off:{},raf:0};
const bkaHM=i=>{const m=i*5;return String(Math.floor(m/60)%24).padStart(2,'0')+':'+String(m%60).padStart(2,'0')};
const bkaKW=w=>(Math.abs(w)/1000).toFixed(Math.abs(w)<10000?2:1)+' kW';
function bkaSVG(){
  const panel=(x,y)=>`<g transform="translate(${x} ${y}) skewX(-18)"><rect width="78" height="46" rx="2" class="ba-pv"/>${[1,2,3].map(k=>`<line x1="${k*19.5}" y1="0" x2="${k*19.5}" y2="46" class="ba-pvl"/>`).join('')}<line x1="0" y1="23" x2="78" y2="23" class="ba-pvl"/></g>`;
  const badge=(x,y,t,c)=>`<g class="ba-bd ${c}"><circle cx="${x}" cy="${y}" r="13"/><text x="${x}" y="${y+4}" text-anchor="middle">${t}</text></g>`;
  return `<svg viewBox="0 0 800 470" class="ba" role="img" aria-label="ภาพเคลื่อนไหวการไหลของไฟฟ้าในระบบ">
  <rect x="0" y="0" width="800" height="470" class="ba-wall"/><rect x="0" y="440" width="800" height="30" class="ba-floor"/>
  <g id="basky"><circle id="basun" r="16" class="ba-sun"/><text id="bamoon" class="ba-moon" text-anchor="middle">☾</text></g>
  <g class="ba-rack"><line x1="40" y1="96" x2="380" y2="96"/><line x1="70" y1="96" x2="62" y2="122"/><line x1="350" y1="96" x2="342" y2="122"/></g>
  ${[0,1,2,3].map(k=>panel(54+k*82,46)).join('')}
  <text x="210" y="34" text-anchor="middle" class="ba-lab">แผงโซลาร์</text>
  <!-- wires (base + animated dash) -->
  ${[['pv','M120 96 V150 H80 V190','dc'],['pv2','M80 238 V262 H262','dc'],['bat','M300 330 V372 H200','dc'],['ac','M380 262 H470','ac'],['grid','M700 150 V215 H570','ac'],['load','M520 262 V330 H600','ac']]
    .map(([id,d,c])=>`<path d="${d}" class="ba-w ${c}"/><path id="baw-${id}" d="${d}" class="ba-f ${c}"/>`).join('')}
  <!-- DC isolator -->
  <g><rect x="52" y="190" width="56" height="48" rx="5" class="ba-box"/><rect x="66" y="203" width="28" height="18" rx="3" class="ba-sw"/><text x="80" y="252" text-anchor="middle" class="ba-sm">DC isolator</text></g>
  <!-- inverter -->
  <g id="bainv"><rect x="262" y="180" width="118" height="150" rx="10" class="ba-inv"/><rect x="282" y="196" width="78" height="44" rx="6" class="ba-lcd"/>
    <text id="bainvt1" x="321" y="214" text-anchor="middle" class="ba-lcdt">—</text><text id="bainvt2" x="321" y="231" text-anchor="middle" class="ba-lcdt sm">—</text>
    <circle id="baled" cx="321" cy="262" r="6" class="ba-led"/><text x="321" y="300" text-anchor="middle" class="ba-lab">อินเวอร์เตอร์</text><text id="bainvm" x="321" y="317" text-anchor="middle" class="ba-sm">—</text></g>
  <!-- battery -->
  <g id="babat"><rect x="96" y="300" width="104" height="138" rx="10" class="ba-bat"/><rect x="112" y="314" width="72" height="22" rx="4" class="ba-lcd"/><text id="basoc" x="148" y="330" text-anchor="middle" class="ba-lcdt">—</text>
    <rect x="132" y="350" width="32" height="70" rx="4" class="ba-cell"/><rect id="basocf" x="135" y="353" width="26" height="64" rx="2" class="ba-socf"/>
    <text x="148" y="455" text-anchor="middle" class="ba-lab">แบตเตอรี่</text><text id="babatx" x="148" y="300" dy="-8" text-anchor="middle" class="ba-sm"></text></g>
  <!-- AC board -->
  <g><rect x="470" y="226" width="100" height="72" rx="6" class="ba-box"/>${[0,1,2,3,4].map(k=>`<rect x="${482+k*16}" y="244" width="11" height="22" rx="2" class="ba-brk"/>`).join('')}<text x="520" y="290" text-anchor="middle" class="ba-sm">ตู้ไฟ AC</text></g>
  <!-- grid -->
  <g id="bagrid"><line x1="700" y1="40" x2="700" y2="150" class="ba-pole"/><line x1="672" y1="52" x2="728" y2="52" class="ba-pole"/><line x1="680" y1="70" x2="720" y2="70" class="ba-pole"/>
    <rect x="678" y="150" width="44" height="34" rx="5" class="ba-box"/><text x="700" y="172" text-anchor="middle" class="ba-sm">kWh</text>
    <text x="700" y="30" text-anchor="middle" class="ba-lab">การไฟฟ้า (กริด)</text><g id="bagridx" class="ba-x"><line x1="684" y1="86" x2="716" y2="118"/><line x1="716" y1="86" x2="684" y2="118"/></g></g>
  <!-- loads -->
  <g id="baload"><rect x="600" y="400" width="180" height="8" class="ba-shelf"/>
    <rect x="604" y="300" width="44" height="100" rx="5" class="ba-ap"/><line x1="604" y1="336" x2="648" y2="336" class="ba-apl"/>
    <rect x="660" y="352" width="56" height="36" rx="3" class="ba-tv"/><rect x="684" y="388" width="8" height="12" class="ba-ap"/>
    <rect x="660" y="300" width="112" height="28" rx="6" class="ba-ap"/><line x1="668" y1="320" x2="764" y2="320" class="ba-apl"/>
    <circle cx="748" cy="374" r="13" class="ba-lamp"/><rect x="744" y="386" width="8" height="14" class="ba-ap"/>
    <text x="690" y="430" text-anchor="middle" class="ba-lab">โหลดในบ้าน</text></g>
  ${badge(80,150,'DC','dc')}${badge(190,262,'DC','dc')}${badge(250,372,'DC','dc')}${badge(425,262,'AC','ac')}${badge(620,215,'AC','ac')}${badge(560,330,'AC','ac')}
  <!-- flow labels -->
  <g class="ba-val"><text id="bav-pv" x="150" y="140">—</text><text id="bav-bat" x="210" y="396">—</text><text id="bav-ac" x="425" y="250" text-anchor="middle">—</text>
    <text id="bav-grid" x="640" y="240">—</text><text id="bav-load" x="690" y="292" text-anchor="middle">—</text></g>
</svg>`;
}
function bkaFrame(){
  const R=window.lastBal&&window.lastBal.R,host=document.getElementById('bkasvg');
  if(!R||!host||!host.firstChild)return;
  const i=Math.max(0,Math.min(R.pv.length-1,BKA.i)),mode=window.lastBal.mode;
  const pv=Math.max(0,R.pv[i]-R.curt[i]),bat=R.fromBat[i]-R.toBat[i],grid=R.imp[i]-R.exp[i],load=Math.max(0,R.load[i]-R.unmet[i]),inv=pv+bat,out=R.outage[i];
  const q=id=>document.getElementById(id),txt=(id,t)=>{const e=q(id);if(e)e.textContent=t};
  BKA.v={pv,pv2:pv,bat:-bat,ac:inv,grid,load};/* positive = along the path as drawn */
  const h=i*5/60,day=h>=6&&h<=18,sun=q('basun'),moon=q('bamoon');
  if(day){const a=(h-6)/12*Math.PI;sun.setAttribute('cx',430+(h-6)/12*210);sun.setAttribute('cy',125-Math.sin(a)*95);sun.style.display=''}else sun.style.display='none';
  moon.setAttribute('x',600);moon.setAttribute('y',60);moon.style.display=day?'none':'';
  host.classList.toggle('night',!day);
  txt('bav-pv',pv>1?bkaKW(pv):'0 kW');txt('bav-ac',Math.abs(inv)>1?bkaKW(inv):'0 kW');txt('bav-load',(load>1?bkaKW(load):'0 kW')+(R.unmet[i]>1?' · ขาด '+bkaKW(R.unmet[i]):''));
  txt('bav-bat',mode==='grid'?'':Math.abs(bat)<1?'พัก':(bat>0?'จ่าย ':'ชาร์จ ')+bkaKW(bat));
  txt('bav-grid',mode==='off'?'':out?'ไฟดับ':Math.abs(grid)<1?'0 kW':(grid>0?'ซื้อ ':'ขาย ')+bkaKW(grid));
  const stop=mode==='grid'&&out;
  txt('bainvt1',stop?'STOP':bkaKW(inv));txt('bainvt2',stop?'กริดดับ':out?'จ่ายเอง':mode==='off'?'Off-grid':'ต่อกริด');
  txt('bainvm',mode==='grid'?'On-grid':mode==='off'?'Off-grid':'Hybrid');
  q('baled').setAttribute('class','ba-led '+(stop?'err':R.unmet[i]>1?'warn':'ok'));
  const soc=R.soc[i]||0,f=q('basocf');txt('basoc',mode==='grid'?'—':Math.round(soc)+'%');
  f.setAttribute('height',Math.max(0,64*soc/100));f.setAttribute('y',353+64*(1-soc/100));f.setAttribute('class','ba-socf'+(soc<25?' low':''));
  q('babat').classList.toggle('ba-off',mode==='grid');txt('babatx',mode==='grid'?'ไม่ใช้แบต (On-grid)':'');
  q('bagrid').classList.toggle('ba-off',mode==='off'||out);q('bagridx').style.display=out&&mode!=='off'?'':'none';
  q('baload').classList.toggle('ba-dark',R.unmet[i]>1&&load<1);q('baload').classList.toggle('ba-dim',R.unmet[i]>1&&load>=1);
  ['pv','pv2','bat','ac','grid','load'].forEach(k=>{const p=q('baw-'+k);if(p)p.classList.toggle('idle',Math.abs(BKA.v[k])<1||(k==='bat'&&mode==='grid')||(k==='grid'&&(mode==='off'||out)))});
  q('bkat').value=i;txt('bkatl',bkaHM(i));
  const note=q('bkanote');if(note)note.textContent=stop?'กริดดับ อินเวอร์เตอร์ On-grid ตัดการจ่ายทันที (anti-islanding) แม้มีแดด':out?'กริดดับ ระบบจ่ายไฟเองจากแผงและแบต เฉพาะ'+(window.lastBal.island==='crit'?'โหลดสำคัญ':'โหลดทั้งหมด'):
    R.unmet[i]>1?'ไฟไม่พอจ่ายโหลด':grid<-1?'ไฟเหลือ ขายคืนกริด':bat<-1?'ไฟเหลือ ชาร์จเข้าแบต':'';
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
function bkAnimUpdate(){const host=document.getElementById('bkasvg');if(!host)return;if(!host.firstChild)host.innerHTML=bkaSVG();bkaFrame();bkaKick()}
function initBkAnim(){
  const t=document.getElementById('bkat');if(!t)return;
  t.addEventListener('input',e=>{BKA.i=+e.target.value;bkaFrame()});
  document.getElementById('bkaplay').addEventListener('click',e=>{BKA.play=!BKA.play;e.currentTarget.textContent=BKA.play?'❚❚ หยุด':'▶ เล่นทั้งวัน';e.currentTarget.setAttribute('aria-pressed',String(BKA.play));bkaKick()});
  document.getElementById('bkasp').addEventListener('change',e=>{BKA.speed=+e.target.value});
  document.querySelectorAll('[data-bkat]').forEach(b=>b.addEventListener('click',()=>{const R=window.lastBal&&window.lastBal.R;let i=144;
    if(b.dataset.bkat==='out'&&R){const k=R.outage.indexOf(true);i=k>=0?Math.min(287,k+6):144}else i=+b.dataset.bkat;BKA.i=i;bkaFrame()}));
  document.addEventListener('visibilitychange',bkaKick);
}
