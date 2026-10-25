/* ---- FusionSolar: หน้า Configuration (Device Information / Grid / Protection / Feature Parameter) ----
   ค่าเริ่มต้นและช่วงค่าตามหน้าจอ SUN2000-20K-MB0 จริง (ผ่านดองเกิล WLAN) ชื่อเครื่อง/SN/IP ถูกแทนด้วยค่าสมมุติ
   fx = มีผลต่อการจำลองในแท็บนี้ */
const fuDec=x=>{const t=String(x[8]==null?1:x[8]);return t.includes('.')?t.split('.')[1].length:0};
const fuFd=(x,v)=>Number(v).toFixed(fuDec(x));
const FUP_INFO={rcd:'A smaller value indicates a higher probability of the inverter being shut down due to RCD protection.',pid:'Ensure that the enclosure is properly grounded. Otherwise, the PID repair function will be unavailable.',optt:'This function is valid only when optimizers are configured for all PV modules and the device supports this function.'};
const FUP_EN=['Disable','Enable'];
const FUP=[
 ['Device Information',[
  ['devname','Device Name','ro','INV-TA0000000000'],['model','Model','ro','SUN2000-20K-MB0'],['proto','Protocol Version','ro','P1.15-D5.0'],
  ['sw','Software Version','ro','V200R023C10SPC214'],['mbid','Modbus ID address','ro','1'],['sn','SN','ro','TA0000000000'],
  ['comby','Commissioned By','ro',''],['pass','Authentication password','ro',''],['port','Device port','ro','45540'],
  ['ip','Device IP address','ro','192.168.1.50'],['rep','Replacement history','ro',''],['sup','Superior Equipment','ro','Dongle-TA0000000000'],
  ['net','Networking mode','ro','WIFI_DONGLE'],['type','Type','ro','String Inverter']]],
 ['Grid Parameter',[
  ['gcode','Grid code','ro','TAI-PEA'],['vlev','Voltage level (V)','ro','220','[0~1000]'],['flev','Frequency level (Hz)','ro','50','[50~60]'],
  ['omode','Output mode','sel','Three-phase four-wire system',['Three-phase four-wire system','Three-phase three-wire system']],
  ['iso','Isolation configuration','sel','Input not grounded, with a transformer',['Input grounded with transformer','Input not grounded, without a transformer','Input not grounded, with a transformer']],
  ['auto','Automatic startup upon grid recovery','sel','Disable',FUP_EN,'','fx'],
  ['rec','On-grid recovery time (s)','num',10,0,7200,'','',1],['qst','Quick startup for short-time grid disconnection','sel','Disable',FUP_EN],
  ['rvhi','Grid reconnection voltage upper limit (V)','num',255,220,299.2,'','fx',.1],['rvlo','Grid reconnection voltage lower limit (V)','num',210,99,220,'','fx',.1],
  ['rfhi','Grid reconnection frequency upper limit (Hz)','num',51,50,60,'','fx',.01],['rflo','Grid reconnection frequency lower limit (Hz)','num',48,40,50,'','fx',.01]]],
 ['Protection Parameters',[
  ['insul','Insulation resistance protection threshold (MΩ)','num',0.5,0.02,1.5,'','fx',.001],['isl','Active island protection','sel','Disable',FUP_EN],
  ['unb','Unbalance voltage protection threshold (%)','num',50,0,50,'','',.1],['pha','Phase angle offset protection','sel','Enable',FUP_EN],
  ['ov10','10 minute OV protection threshold (V)','num',264,220,330,'','',.1],['ov10t','10 minute OV protection time (ms)','num',200,50,18000000,'','',1],
  ['ov1','Level-1 OV protection threshold (V)','num',264,220,330,'','fx',.1],['ov1t','Level-1 OV protection time (ms)','num',1000,20,18000000,'','',1],
  ['ov2','Level-2 OV protection threshold (V)','num',264,220,330,'','fx',.1],
  ['ov2t','Level-2 OV protection time (ms)','num',160,20,18000000,'','',1],
  ['uv1','Level-1 UV protection threshold (V)','num',202.6,0,220,'','fx',.1],['uv1t','Level-1 UV protection time (ms)','num',2000,20,18000000,'','',1],
  ['uv2','Level-2 UV protection threshold (V)','num',110,0,220,'','',.1],['uv2t','Level-2 UV protection time (ms)','num',300,20,18000000,'','',1],
  ['of1','Level-1 OF protection threshold (Hz)','num',52,50,60,'','fx',.01],['of1t','Level-1 OF protection time (ms)','num',100,50,18000000,'','',1],
  ['uf1','Level-1 UF protection threshold (Hz)','num',47,40,50,'','fx',.01],['uf1t','Level-1 UF protection time (ms)','num',100,50,18000000,'','',1]]],
 ['Feature Parameter',[
  ['cmin','Shutdown duration during communication failure (min)','num',10,1,120,'','fx',1],['cshut','Automatic shutdown upon communication interruption','sel','Disable',FUP_EN,'','fx'],
  ['cfs','Communication disconnection fail-safe','sel','Disable',FUP_EN],['soft','Soft start time (s)','num',20,1,1800,'','',1],
  ['grad','Shutdown gradient (%/s)','num',50,0.1,2500,'','',.001],['zero','Shutdown at 0% power limit','sel','Disable',FUP_EN],
  ['dly','Delayed upgrade','sel','Disable',FUP_EN],['mppt','MPPT multi-peak scanning','sel','Disable',FUP_EN],['rcdp','RCD enhancement','sel','Disable',FUP_EN],
  ['rcd','Current Threshold for Triggering RCD Protection (mA)','num',300,5,300,'','',1],['afci','AFCI','sel','Disable',FUP_EN,'','fx'],
  ['gfd','Grounding failure detection','sel','Disable',FUP_EN],['strg','Automatic recovery of PV string-to-ground short circuit protection','sel','Disable',FUP_EN],
  ['pid','PID operation mode','sel','Repair',['Disable','Repair']],['pidn','PID nighttime off-grid repair','sel','Disable',FUP_EN],
  ['hvrt','HVRT','sel','Disable',FUP_EN],['lvrt','LVRT','sel','Disable',FUP_EN],['vrs','Voltage rise suppression','sel','Disable',FUP_EN],
  ['optt','Overtemperature Protection on Optimizer Terminal','sel','Disable',FUP_EN],['emm','Energy measurement mode','sel','Balanced beasurement',['Balanced beasurement','Unbalanced measurement']],
  ['offg','Off-grid mode','sel','Disable',FUP_EN],['dry','Dry contact function','sel','NC',['NC','NO']]]]
];
const FUP_ALL=FUP.flatMap(s=>s[1]);
const FUP_DEF=()=>{const o={};FUP_ALL.forEach(x=>{o[x[0]]=x[3]});return o};
let fuPr=FUP_DEF(),fuEd={};
function fuDev(){const I=curInv();return{I,tri:String(I.phase)==='3',micro:!!I.micro,nin:Math.max(1,Math.min(12,I.micro?(+I.nmppt||1):(+I.nmppt||2)*2)),hw:/huawei/i.test(I.brand||'')}}
function fuPv(){const o={};FUP_ALL.forEach(x=>{o[x[0]]=x[2]==='num'?+fuPr[x[0]]:fuPr[x[0]]});return o}
function fupErr(x,v){if(x[2]!=='num')return'';const n=parseFloat(v);if(!isFinite(n)||String(v).trim()==='')return'กรอกตัวเลข';if(n<x[4]||n>x[5])return`อยู่นอกช่วง [${fuFd(x,x[4])}~${fuFd(x,x[5])}]`;return''}
function fupDirty(){return FUP_ALL.some(x=>x[0] in fuEd&&String(fuEd[x[0]])!==String(fuPr[x[0]]))}
function fupInvalid(){return FUP_ALL.some(x=>x[0] in fuEd&&fupErr(x,fuEd[x[0]]))}
function fupBar(){
  const q=id=>document.getElementById(id);if(!q('fupsave'))return;
  q('fupsave').disabled=!fupDirty()||fupInvalid();
  q('fupst').textContent=fupInvalid()?'มีค่าที่อยู่นอกช่วง ยังบันทึกไม่ได้':fupDirty()?'มีการแก้ไขที่ยังไม่บันทึก':'';
}
function fupRender(){
  const box=document.getElementById('fupbody');if(!box)return;
  const dv=fuDev(),nt=document.getElementById('fupnote');
  if(nt)nt.innerHTML=`อินเวอร์เตอร์ที่เลือก: <b>${esc(dv.I.name)}</b> · ${dv.tri?'3 เฟส':'1 เฟส (L N)'} · ${dv.I.pac/1000} kW · ${dv.nin} อินพุต PV`+(/SUN2000-20K-MB0/.test(dv.I.name)?'':' — ช่วงค่าและค่าเริ่มต้นของพารามิเตอร์นำมาจากเครื่องตัวอย่าง SUN2000-20K-MB0 รุ่นอื่นอาจต่างกัน ตรวจกับคู่มือรุ่นนั้น');
  box.innerHTML=FUP.map(([t,items])=>`<h3>${t}</h3><div class="fucfg">${items.map(x=>{
    const k=x[0],cur=k in fuEd?fuEd[k]:(x[2]==='num'?fuFd(x,fuPr[k]):fuPr[k]),ro=x[2]==='ro',rng=x[2]==='num'?`[${fuFd(x,x[4])}~${fuFd(x,x[5])}]`:(x[4]&&typeof x[4]==='string'?x[4]:''),fx=x[2]==='sel'?x[6]:x[7],note=x[2]==='num'?x[6]:'';
    const tag=fx==='fx'?(note?'<span class="fufx a" title="ค่าสมมุติ">★</span>':'<span class="fufx" title="มีผลต่อการจำลองในแท็บนี้">★</span>'):'';
    let ctl;
    if(ro){let shown=cur;if(k==='model')shown=dv.I.name;else if(!dv.hw&&['proto','sw','sup'].includes(k))shown='--';ctl=`<input value="${esc(shown)}" disabled aria-label="${esc(x[1])}">`}
    else if(k==='omode'&&!dv.tri)ctl=`<input value="Single-phase" disabled aria-label="${esc(x[1])}">`;
    else if(x[2]==='sel')ctl=`<select data-fp="${k}" aria-label="${esc(x[1])}">${x[4].map(o=>`<option${o===cur?' selected':''}>${esc(o)}</option>`).join('')}</select>`;
    else ctl=`<input type="text" inputmode="decimal" data-fp="${k}" value="${esc(cur)}" aria-label="${esc(x[1])}" class="${fupErr(x,cur)?'bad':''}">`;
    return `<label class="fucf"><span class="fucl">${tag}${x[1]}${ro?'':':'}${FUP_INFO[k]?` <span class="fuinfo" tabindex="0" role="note" data-tip="${esc(FUP_INFO[k])}" aria-label="${esc(FUP_INFO[k])}">ⓘ</span>`:''}</span><span class="fucv">${ctl}<small>${ro&&x[4]?x[4]:rng}</small></span>${x[2]==='num'&&fupErr(x,cur)?`<em class="fuer">${fupErr(x,cur)}</em>`:''}${note?`<em class="fuas">${note}</em>`:''}</label>`}).join('')}</div>`).join('');
  fupBar();
}
function initFupar(){
  const q=id=>document.getElementById(id);if(!q('fupbody'))return;
  q('fupbody').addEventListener('input',e=>{const k=e.target.dataset.fp;if(!k)return;fuEd[k]=e.target.value;const x=FUP_ALL.find(z=>z[0]===k),er=fupErr(x,e.target.value);e.target.classList.toggle('bad',!!er);const lb=e.target.closest('.fucf');let m=lb.querySelector('.fuer');if(er){if(!m){m=document.createElement('em');m.className='fuer';lb.appendChild(m)}m.textContent=er}else if(m)m.remove();fupBar()});
  q('fupbody').addEventListener('change',e=>{if(e.target.tagName==='SELECT')fupBar()});
  q('fupsave').addEventListener('click',()=>{
    if(fupInvalid()||!fupDirty())return;
    FUP_ALL.forEach(x=>{if(x[0] in fuEd)fuPr[x[0]]=x[2]==='num'?+fuEd[x[0]]:fuEd[x[0]]});fuEd={};FU.startAt=null;
    fupRender();q('fupst').textContent='บันทึกแล้ว (จำลอง)';fuRender();touch();
  });
  q('fuprefresh').addEventListener('click',()=>{fuEd={};fupRender()});
  q('fupreset').addEventListener('click',()=>{fuPr=FUP_DEF();fuEd={};FU.startAt=null;fupRender();fuRender();touch()});
  q('fupexport').addEventListener('click',()=>{
    const rows=FUP.slice(1).flatMap(([t,it])=>it.map(x=>`${t},"${x[1]}",${fuPr[x[0]]}`));
    const blob=new Blob(['﻿Section,Parameter,Value\n'+rows.join('\n')],{type:'text/csv'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='inverter-parameters.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
  });
  fupRender();
}
function fupSnapshot(){const o={};FUP_ALL.forEach(x=>{if(x[2]!=='ro'&&String(fuPr[x[0]])!==String(x[3]))o[x[0]]=fuPr[x[0]]});return o}
function fupRestore(o){
  fuPr=FUP_DEF();fuEd={};
  if(o&&typeof o==='object')FUP_ALL.forEach(x=>{if(x[2]==='ro'||!(x[0] in o))return;const v=o[x[0]];if(x[2]==='sel'){if(x[4].includes(v))fuPr[x[0]]=v}else if(!fupErr(x,v))fuPr[x[0]]=+v});
  fupRender();
}
