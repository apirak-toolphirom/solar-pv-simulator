/* ---- load simulation ---- */
let LOADS=[],nextLoad=1;
const LOAD_PRESETS={
  home:{name:'บ้านพักอาศัย',items:[
    ['ตู้เย็น',150,1,0,24,40,1],['Wi-Fi และคอมพิวเตอร์',80,1,0,24,100,1],['ไฟ LED',9,10,18,23,100,1],
    ['แอร์ 12,000 BTU (อินเวอร์เตอร์)',900,1,22,6,60,0],['แอร์ 12,000 BTU ช่วงบ่าย',900,1,13,17,60,0],['ทีวี',100,1,19,23,100,0],['ปั๊มน้ำ',750,1,6,7,30,0],['เครื่องซักผ้า',500,1,9,10,60,0]]},
  shop:{name:'ร้านค้า / ออฟฟิศ',items:[
    ['ตู้แช่',250,2,0,24,45,1],['ไฟส่องสว่าง',200,1,8,18,100,1],['คอมพิวเตอร์',120,4,8,17,100,1],['แอร์ 18,000 BTU',1400,2,9,17,65,0],['เครื่องปริ้นท์ / อื่นๆ',150,1,9,17,30,0]]},
  server:{name:'ห้องคอมพิวเตอร์ / อุปกรณ์สำคัญ',items:[
    ['เซิร์ฟเวอร์',300,2,0,24,100,1],['สวิตช์เครือข่าย',60,1,0,24,100,1],['แอร์ห้องเซิร์ฟเวอร์',1000,1,0,24,60,1],['ไฟส่องสว่าง',100,1,7,19,100,0]]}
};
function addLoad(a){
  const L={id:nextLoad++,name:a[0],w:a[1],qty:a[2],start:a[3],end:a[4],duty:a[5],crit:a[6]?1:0};
  LOADS.push(L);return L;
}
function setLoads(items){LOADS=[];nextLoad=1;items.forEach(addLoad)}
const inWin=(h,s,e)=>s===e?true:(s<e?(h>=s&&h<e):(h>=s||h<e));
/* returns watts per step for the whole day: {all, crit} */
function loadProfile(step){
  const n=Math.round(1440/step),all=new Array(n).fill(0),crit=new Array(n).fill(0);
  for(let i=0;i<n;i++){
    const h=(i+.5)*step/60;
    LOADS.forEach(L=>{
      if(!(L.w>0&&L.qty>0))return;
      if(inWin(h,L.start,L.end)){
        const w=L.w*L.qty*Math.max(0,Math.min(100,L.duty))/100;
        all[i]+=w;if(L.crit)crit[i]+=w;
      }
    });
  }
  return{all,crit,n,step};
}
const hhmm=h=>{const m=Math.round(h*60)%1440;return pad2(Math.floor(m/60))+':'+pad2(m%60)};
const parseHM=s=>{const m=/^(\d{1,2}):(\d{2})$/.exec(s||'');return m?(+m[1]+ +m[2]/60):NaN};

function loadRowsHTML(){
  return LOADS.map(L=>`<tr data-lid="${L.id}">
    <td data-th="ชื่อ"><input data-k="name" type="text" value="${esc(L.name)}" aria-label="ชื่อโหลด"></td>
    <td data-th="กำลัง (W)"><input data-k="w" type="number" inputmode="decimal" min="0" step="any" value="${L.w}" aria-label="กำลัง W"></td>
    <td data-th="จำนวน"><input data-k="qty" type="number" inputmode="numeric" min="0" step="1" value="${L.qty}" aria-label="จำนวน"></td>
    <td data-th="เริ่ม"><input data-k="start" type="time" value="${hhmm(L.start)}" aria-label="เวลาเริ่ม"></td>
    <td data-th="หยุด"><input data-k="end" type="time" value="${L.end>=24?'00:00':hhmm(L.end)}" aria-label="เวลาหยุด"></td>
    <td data-th="ใช้จริง (%)"><input data-k="duty" type="number" inputmode="decimal" min="0" max="100" step="1" value="${L.duty}" aria-label="เปอร์เซ็นต์เวลาที่ทำงานจริง"></td>
    <td data-th="สำคัญ"><label class="chk"><input data-k="crit" type="checkbox" ${L.crit?'checked':''}><span>โหลดสำคัญ</span></label></td>
    <td><button class="btn sm" data-ldel="${L.id}" aria-label="ลบ ${esc(L.name)}">ลบ</button></td></tr>`).join('');
}
let loadChartCfg=null;
function loadView(){
  const P=loadProfile(5),dt=5/60/1000;
  let E=0,Ec=0,pk=0,pkI=0;
  P.all.forEach((w,i)=>{E+=w*dt;Ec+=P.crit[i]*dt;if(w>pk){pk=w;pkI=i}});
  const I=curInv(),pc=Math.max(...P.crit);
  const mx=[
    ['พลังงานต่อวัน',f(E,2)+' kWh',`เฉลี่ย ${f(E/24,2)} kW`],
    ['กำลังสูงสุด',f(pk/1000,2)+' kW',pk>0?`เวลา ${hhmm((pkI+.5)*5/60)}`:''],
    ['โหลดสำคัญต่อวัน',f(Ec,2)+' kWh',`สูงสุด ${f(pc/1000,2)} kW`],
    ['เทียบพิกัด AC อินเวอร์เตอร์',I.pac?f(pk/I.pac*100,0)+' %':'-',`${esc(I.name)} ${I.pac/1000} kW`]
  ];
  $('#ldmx').innerHTML=mx.map(m=>`<div class="metric"><div class="k">${m[0]}</div><div class="v">${m[1]}</div><div class="s">${m[2]}</div></div>`).join('');
  const w=[];
  if(pk>I.pac)w.push(`กำลังโหลดสูงสุด ${f(pk/1000,2)} kW เกินพิกัด AC ของอินเวอร์เตอร์ ${I.pac/1000} kW`);
  if(I.type!=='on-grid'&&I.backupKw&&pc>I.backupKw*1000)w.push(`โหลดสำคัญสูงสุด ${f(pc/1000,2)} kW เกินกำลังขาออกโหมด Backup ${I.backupKw} kW`);
  $('#ldwarn').innerHTML=w.map(t=>`<li><span class="b warn">!</span><span>${esc(t)}</span></li>`).join('');
  const x=P.all.map((_,i)=>(i+.5)*5/60),ymax=Math.max(pk/1000,0.5)*1.1;
  loadChartCfg={x,xmin:0,xmax:24,ymax,unit:'kW',aria:'กราฟกำลังโหลดตลอดวัน',
    refs:I.pac&&pk>I.pac*0.3?[{y:I.pac/1000,label:`พิกัด AC ${I.pac/1000} kW`}]:[],
    series:[{short:'โหลดทั้งหมด',color:'var(--s1)',vals:P.all.map(v=>v/1000),area:true,peak:true,fmt:v=>f(v,2)},
            {short:'โหลดสำคัญ',color:'var(--s2)',vals:P.crit.map(v=>v/1000),fmt:v=>f(v,2)}]};
  $('#ldleg').innerHTML=loadChartCfg.series.map(se=>`<span class="lg"><i class="lk" style="background:${se.color}"></i>${se.short}</span>`).join('');
  drawLoadChart();
}
function drawLoadChart(){if(loadChartCfg&&$('#chL').clientWidth)drawLine($('#chL'),Object.assign({},loadChartCfg,{ymax:Math.max(loadChartCfg.ymax,loadChartCfg.refs.length?loadChartCfg.refs[0].y*1.08:0)}))}
function loadRender(){
  $('#ldrows').innerHTML=loadRowsHTML();
  $('#ldempty').hidden=LOADS.length>0;
  loadView();
}
function initLoads(){
  $('#ldpre').innerHTML=Object.keys(LOAD_PRESETS).map(k=>`<button class="chip" data-lp="${k}">${LOAD_PRESETS[k].name}</button>`).join('')+'<button class="chip" data-lp="_clear">ล้างทั้งหมด</button>';
  $('#ldpre').addEventListener('click',e=>{
    const b=e.target.closest('[data-lp]');if(!b)return;
    if(b.dataset.lp==='_clear')setLoads([]);else setLoads(LOAD_PRESETS[b.dataset.lp].items);
    loadRender();loadChanged();
  });
  $('#ldadd').addEventListener('click',()=>{addLoad(['โหลดใหม่',100,1,8,17,100,0]);loadRender();loadChanged();const r=$('#ldrows tr:last-child input');if(r)r.focus()});
  $('#ldrows').addEventListener('click',e=>{
    const b=e.target.closest('[data-ldel]');if(!b)return;
    LOADS=LOADS.filter(l=>l.id!==+b.dataset.ldel);loadRender();loadChanged();
  });
  const upd=e=>{
    const t=e.target,tr=t.closest('[data-lid]');if(!tr||!t.dataset.k)return;
    const L=LOADS.find(l=>l.id===+tr.dataset.lid);if(!L)return;
    const k=t.dataset.k;
    if(k==='name')L.name=t.value;
    else if(k==='crit')L.crit=t.checked?1:0;
    else if(k==='start'||k==='end'){const h=parseHM(t.value);if(isNaN(h))return;L[k]=h}
    else{const n=parseFloat(t.value);if(isNaN(n))return;L[k]=Math.max(0,n)}
    loadView();loadChanged();
  };
  $('#ldrows').addEventListener('input',upd);$('#ldrows').addEventListener('change',upd);
  setLoads(LOAD_PRESETS.home.items);
  loadRender();
}
function loadChanged(){
  if(typeof backupRun==='function')backupRun();
  if(typeof touch==='function')touch();
}
