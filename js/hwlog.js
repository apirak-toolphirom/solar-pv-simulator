/* ---- 12 อ่าน log อินเวอร์เตอร์ Huawei: นำเข้าไฟล์ที่ส่งออกจาก FusionSolar / SUN2000 app / SmartLogger (CSV, XLSX, XLS)
   อ่านในเบราว์เซอร์เท่านั้น ไม่อัปโหลดไปที่ใด ข้อมูลอยู่ในหน่วยความจำของหน้า (ไม่บันทึกไปกับโปรเจ็ค) ล้างเมื่อออกจากระบบ
   ใช้ได้เฉพาะผู้เรียนที่ลงชื่อแล้วและผู้สอน (accPerm ใน access.js ปิดเมนูนี้สำหรับผู้เยี่ยมชมเสมอ)
   ชนิดไฟล์: ข้อมูลรายช่วงเวลา (5 นาที ฯลฯ) · รายงานรายวัน/รายเดือน · รายการแจ้งเตือน (alarm) ระบบเดาจากหัวคอลัมน์ แก้การจับคู่ได้ ---- */
const HW={files:[],day:null,sel:0,kwp:0,sev:'all',seq:0};
const hwRole=()=>typeof ACC!=='undefined'&&(ACC.role==='student'||ACC.role==='teacher');
/* field: k key · n Thai name · d dimension (P kW, E kWh, other = as is) · re header patterns (lower-case, units removed) */
const HW_F=[
  {k:'t',n:'เวลา',re:[/^(date\s*)?time$/,/^(time|date|เวลา|วันที่|วัน\/เวลา)/,/statistic(al)?\s*(period|time|date)/,/collect(ion|ed)?\s*time/,/^period/,/timestamp/,/^update\s*time/]},
  {k:'pgrid',n:'กำลังที่จุดมิเตอร์ (+ ขาย / − ซื้อ)',d:'P',re:[/(grid|meter|power\s*meter).*active\s*power/,/active\s*power.*(meter|grid)/,/feed[-\s]?in\s*power/,/grid\s*power/]},
  {k:'pload',n:'กำลังโหลด',d:'P',re:[/load\s*power/,/consumption\s*power/,/power\s*consumption/,/กำลัง.*โหลด/]},
  {k:'pbat',n:'กำลังแบต (+ ชาร์จ / − คายประจุ)',d:'P',re:[/charg(e|ing)\s*\/?\s*discharg(e|ing)\s*power/,/battery\s*(active\s*)?power/,/^(energy\s*storage|ess)\s*power/,/กำลัง.*แบต/]},
  {k:'pac',n:'กำลัง AC ขาออกอินเวอร์เตอร์',d:'P',no:/reactive/,re:[/^(inverter\s*)?(output\s*)?active\s*power/,/^(inverter\s*)?output\s*power/,/^ac\s*power/,/^p\s*ac/,/^power$/,/กำลัง.*(ac|ขาออก)/]},
  {k:'pdc',n:'กำลัง DC จากแผง',d:'P',re:[/(total\s*)?(dc\s*)?input\s*power/,/^pv\s*(input\s*|output\s*)?power/,/^dc\s*power/,/กำลัง.*(dc|แผง)/]},
  {k:'eday',n:'พลังงานที่ผลิต',d:'E',cum:'day',no:/feed|export|import|grid|consum|load|charg|total|lifetime/,re:[/daily\s*(energy|yield)/,/(energy|yield)\s*(of\s*the\s*day|today)/,/e[-\s]?day/,/^(pv\s*|inverter\s*)?yield/,/^(pv|solar)\s*(energy|generation)/,/^energy$/,/ผลิต/]},
  {k:'exp',n:'ขายเข้ากริด (Export)',d:'E',re:[/export/,/feed[-\s]?in/,/on[-\s]?grid\s*energy/,/to\s*grid/,/ขาย/]},
  {k:'imp',n:'ซื้อจากกริด (Import)',d:'E',re:[/import/,/(supply\s*)?from\s*(the\s*)?grid/,/purchas/,/ซื้อ/]},
  {k:'cons',n:'พลังงานที่ใช้ (โหลด)',d:'E',re:[/consumption/,/^load/,/ใช้ไฟ/]},
  {k:'etot',n:'พลังงานสะสมทั้งหมด',d:'E',re:[/total\s*(energy|yield)/,/e[-\s]?total/,/lifetime/,/สะสม/]},
  {k:'soc',n:'SOC แบต (%)',re:[/soc/,/state\s*of\s*charge/,/ระดับ.*แบต/]},
  {k:'temp',n:'อุณหภูมิภายใน (°C)',re:[/(internal|cabinet|inverter|heat\s*sink)?\s*temperature/,/อุณหภูมิ/]},
  {k:'vgrid',n:'แรงดันกริด (V)',re:[/^(phase\s*a|a\s*phase|uab|ua|a-b|l1)\b.*voltage/,/(grid|line|output|phase)\s*.*voltage/,/^ua\b/,/แรงดัน.*(กริด|ac)/]},
  {k:'freq',n:'ความถี่กริด (Hz)',re:[/frequency/,/ความถี่/]},
  {k:'riso',n:'ความต้านทานฉนวน (MΩ)',re:[/insulation/,/ฉนวน/]}
];
const HW_A=[
  {k:'aname',n:'ชื่อแจ้งเตือน',re:[/alarm\s*name/,/^alarm$/,/^(fault|event)\s*name/,/ชื่อ.*(แจ้งเตือน|alarm)/]},
  {k:'aid',n:'รหัสแจ้งเตือน',re:[/alarm\s*(id|code)/,/^(id|code)$/,/รหัส/]},
  {k:'asev',n:'ระดับ',re:[/severity/,/^(alarm\s*)?level/,/importance/,/ระดับ/]},
  {k:'aon',n:'เวลาเกิด',re:[/occur/,/raised/,/generat/,/start\s*time/,/^time$/,/เกิด/]},
  {k:'aoff',n:'เวลาหาย',re:[/clear/,/recover/,/end\s*time/,/หาย/,/สิ้นสุด/]},
  {k:'adev',n:'อุปกรณ์',re:[/device\s*name/,/^device/,/^sn$/,/อุปกรณ์/]},
  {k:'astat',n:'สถานะ',re:[/status/,/สถานะ/]}
];
/* แนวทางตรวจเบื้องต้นของแจ้งเตือนที่พบบ่อย (จับจากชื่อก่อน แล้วจึงรหัส) ใช้สอน ตรวจกับคู่มือรุ่นนั้นเสมอ */
const HW_HINT=[
  [/high\s*string\s*(input\s*)?voltage/,[2001],'แรงดันสตริงสูงเกินพิกัด: จำนวนแผงอนุกรมมากไป (คิด Voc ตอนอากาศเย็น) ตรวจที่เมนู 02'],
  [/reverse\s*connection|string\s*reverse/,[2011],'ต่อขั้วสตริงกลับ + / −: ปลด DC แล้ววัดขั้วด้วยมัลติมิเตอร์ก่อนต่อใหม่'],
  [/backfeed/,[2012],'กระแสย้อนในสตริง: สตริงที่ขนานกันมีจำนวนแผงหรือทิศไม่เท่ากัน'],
  [/abnormal\s*string|string\s*power/,[2013],'กำลังสตริงผิดปกติ: เงาบัง ฝุ่น แผงเสีย หรือขั้วต่อ MC4 หลวม เทียบกระแสแต่ละสตริง'],
  [/string\s*loss|pv\s*string\s*loss/,[2015],'สตริงหาย: ฟิวส์/เบรกเกอร์ DC ตัด สายหลุด หรือแผงไม่ได้รับแดด'],
  [/arc/,[2021,2022],'อาร์ก DC: หยุดระบบ ตรวจขั้วต่อ MC4 และสายที่ชำรุด (อันตรายไฟไหม้)'],
  [/short[-\s]*circuit.*pe|phase\s*wire\s*short/,[2031],'สายเฟสลัดลงดิน (PE): ตรวจสาย AC และขั้ว PE'],
  [/grid\s*loss|grid\s*failure|no\s*grid/,[2032],'ไฟกริดดับหรือเบรกเกอร์ AC ตัด อินเวอร์เตอร์หยุดจ่ายตามข้อกำหนด (anti-islanding)'],
  [/grid\s*undervoltage|under\s*voltage/,[2033],'แรงดันกริดต่ำ: สายเมนเล็ก/ยาว หรือหม้อแปลงแรงดันตก'],
  [/grid\s*overvoltage|over\s*voltage/,[2034],'แรงดันกริดสูง: มักเกิดตอนเที่ยงที่ขายไฟมาก สาย AC เล็กไป หรือแรงดันหม้อแปลงสูง'],
  [/voltage\s*imbalance|unbalance/,[2035],'แรงดันเฟสไม่สมดุล (3 เฟส): โหลดแต่ละเฟสต่างกันมาก'],
  [/over[-\s]?frequency/,[2036],'ความถี่กริดสูงเกิน'],
  [/under[-\s]?frequency/,[2037],'ความถี่กริดต่ำเกิน'],
  [/unstable\s*grid\s*frequency|frequency\s*instab/,[2038],'ความถี่กริดไม่นิ่ง (มักพบเมื่อต่อกับเครื่องปั่นไฟ)'],
  [/residual\s*current|leakage/,[2051],'กระแสรั่ว: ความชื้น ฉนวนสายหรือแผงชำรุด ตรวจค่าความต้านทานฉนวน'],
  [/abnormal\s*ground|grounding/,[2061],'ต่อลงดินผิดปกติ: ตรวจสาย PE และหลักดิน (เมนู 00 หัวข้อ 09)'],
  [/insulation/,[2062],'ความต้านทานฉนวนต่ำ: มักเกิดตอนเช้าที่มีน้ำค้าง ถ้าหายเองหลังแดดออกให้ตรวจขั้วต่อที่ชื้น ถ้าเป็นตลอดวันให้หาสายชำรุด'],
  [/over[-\s]?temperature|overtemp|high\s*temp/,[2063],'อุณหภูมิเครื่องสูง: ติดตั้งที่อับลมหรือโดนแดดตรง ทำความสะอาดครีบระบายความร้อน'],
  [/device\s*fault|internal\s*fault/,[2064],'เครื่องผิดปกติภายใน: รีสตาร์ทตามคู่มือ ถ้าไม่หายติดต่อตัวแทนจำหน่าย'],
  [/meter|power\s*collector/,[2067],'สื่อสารกับสมาร์ทมิเตอร์ไม่ได้: ตรวจสาย RS485 A/B สลับหรือหลวม และ address ของมิเตอร์'],
  [/battery/,[2068],'แบตผิดปกติ/สื่อสารไม่ได้: ตรวจสาย COM (Enable, 485A2/485B2) และเบรกเกอร์แบต'],
  [/islanding/,[2070,2071],'ตรวจพบภาวะ islanding: อินเวอร์เตอร์ตัดตัวเองจากกริดเพื่อความปลอดภัย'],
  [/upgrade/,[2065],'อัปเกรดเฟิร์มแวร์ไม่สำเร็จ: ลองใหม่ผ่านแอป'],
  [/monitor|communication|offline|dongle/,[],'การสื่อสาร/มอนิเตอร์ขาด: ตรวจ WiFi หรือ Smart Dongle ข้อมูลช่วงนี้จะหายจากกราฟ']
];
function hwHint(name,id){
  const n=String(name||'').toLowerCase(),i=parseInt(id,10);
  for(const[re,ids,h]of HW_HINT)if(n&&re.test(n))return h;
  for(const[,ids,h]of HW_HINT)if(ids.includes(i))return h;
  return'';
}
const hwNorm=h=>String(h==null?'':h).replace(/^﻿/,'').replace(/[℃°]\s*c?/gi,'').replace(/\((?:[^)]*)\)|\[(?:[^\]]*)\]/g,' ').replace(/[_]+/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
const hwUnitOf=h=>{const s=String(h||'').toLowerCase();
  if(/\bmwh\b/.test(s))return'MWh';if(/\bkwh\b/.test(s))return'kWh';if(/(^|[^k])wh\b/.test(s))return'Wh';
  if(/\bmw\b/.test(s))return'MW';if(/\bkw\b/.test(s))return'kW';if(/\(\s*w\s*\)|\[\s*w\s*\]|\bw\b/.test(s))return'W';return''};
const HW_SCALE={W:.001,kW:1,MW:1000,Wh:.001,kWh:1,MWh:1000};

/* ---- file reading ---- */
let hwXlsxP=null;
function hwXlsx(){
  if(window.XLSX)return Promise.resolve(window.XLSX);
  if(hwXlsxP)return hwXlsxP;
  const load=src=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s)});
  hwXlsxP=(async()=>{for(const u of['vendor/xlsx.full.min.js','https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js']){try{await load(u);if(window.XLSX)return window.XLSX}catch(e){}}hwXlsxP=null;throw new Error('โหลดตัวอ่าน Excel ไม่ได้ (ต้องมีอินเทอร์เน็ต) ลองบันทึกไฟล์เป็น CSV แล้วนำเข้าใหม่')})();
  return hwXlsxP;
}
function hwCsv(text){
  text=text.replace(/^﻿/,'');
  const first=text.split(/\r?\n/).slice(0,30).join('\n');
  const cnt=c=>(first.match(new RegExp(c==='\t'?'\t':'\\'+c,'g'))||[]).length;
  const del=[',',';','\t','|'].sort((a,b)=>cnt(b)-cnt(a))[0];
  const rows=[];let row=[],cell='',q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(q){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++}else q=false}else cell+=c;continue}
    if(c==='"'&&cell==='')q=true;
    else if(c===del){row.push(cell);cell=''}
    else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell=''}
    else cell+=c;
  }
  if(cell!==''||row.length){row.push(cell);rows.push(row)}
  return rows;
}
async function hwReadFile(file){
  const nm=file.name||'ไฟล์',low=nm.toLowerCase();
  if(/\.(xlsx|xlsm|xls|ods)$/.test(low)){
    const X=await hwXlsx(),buf=await file.arrayBuffer(),wb=X.read(buf,{type:'array',cellDates:false});
    return wb.SheetNames.map(sn=>({name:wb.SheetNames.length>1?`${nm} · ${sn}`:nm,rows:X.utils.sheet_to_json(wb.Sheets[sn],{header:1,raw:true,defval:''})})).filter(s=>s.rows.length>1);
  }
  let text=await file.text();
  if(/�/.test(text.slice(0,2000))){try{text=new TextDecoder('windows-874').decode(await file.arrayBuffer())}catch(e){}}
  return[{name:nm,rows:hwCsv(text)}];
}
/* the header row is the row (among the first 25) whose cells match the most known field patterns */
function hwMatch(defs,head){
  const map={},used=new Set(),nh=head.map(hwNorm);
  /* PV strings first so "PV1 input voltage" is never taken as grid voltage or input power */
  nh.forEach((h,i)=>{const m=/(?:pv|mppt|string)\s*(\d{1,2})\s*(?:input\s*)?(voltage|current|power)/.exec(h);if(m&&defs===HW_F){const k=`pv${+m[1]}${m[2][0]}`;if(!(k in map)){map[k]=i;used.add(i)}}});
  defs.forEach(fd=>{for(const re of fd.re){const i=nh.findIndex((h,j)=>h&&!used.has(j)&&re.test(h)&&!(fd.no&&fd.no.test(h)));if(i>=0){map[fd.k]=i;used.add(i);break}}});
  return map;
}
function hwDetect(sheet){
  const R=sheet.rows;let best={score:0,hi:-1};
  for(let r=0;r<Math.min(25,R.length);r++){
    const head=R[r].map(c=>String(c==null?'':c));if(head.filter(Boolean).length<2)continue;
    const fm=hwMatch(HW_F,head),am=hwMatch(HW_A,head);
    const fs=Object.keys(fm).length+(('t'in fm)?2:0),as=Object.keys(am).length+(('aname'in am)?3:0);
    const sc=Math.max(fs,as);if(sc>best.score)best={score:sc,hi:r,head,fm,am,alarm:as>fs&&'aname'in am};
  }
  if(best.hi<0)return null;
  const units={};best.head.forEach((h,i)=>{const u=hwUnitOf(h);if(u)units[i]=u});
  return{name:sheet.name,head:best.head,rows:R.slice(best.hi+1).filter(r=>r.some(c=>String(c).trim()!=='')),kind:best.alarm?'alarm':'auto',map:best.alarm?best.am:best.fm,units,ov:{}};
}
/* ---- values ---- */
function hwNum(v){
  if(typeof v==='number')return isFinite(v)?v:null;
  const s=String(v==null?'':v).trim().replace(/,/g,'').replace(/\s+/g,'');
  if(!s||/^[-–—]+$|^n\/?a$/i.test(s))return null;
  const m=/^[-+]?\d*\.?\d+(e[-+]?\d+)?/i.exec(s);return m?+m[0]:null;
}
/* time → {d:'YYYY-MM-DD'|'',h: hour of day, p:'min'|'day'|'month', o: sortable} */
function hwTime(v){
  const mk=(y,mo,d,h,mi,se,p)=>{if(y>2400)y-=543;if(!(mo>=1&&mo<=12)||!(d>=1&&d<=31))return null;
    const D=`${y}-${pad2(mo)}-${pad2(d)}`,H=(h||0)+(mi||0)/60+(se||0)/3600;return{d:D,h:H,p,o:Date.UTC(y,mo-1,d)/6e4+H*60}};
  if(typeof v==='number'&&v>20000&&v<80000){const t=new Date(Math.round((v-25569)*864e5));const frac=v%1;
    return mk(t.getUTCFullYear(),t.getUTCMonth()+1,t.getUTCDate(),t.getUTCHours(),t.getUTCMinutes(),t.getUTCSeconds(),frac>1e-6?'min':'day')}
  const s=String(v==null?'':v).trim();if(!s)return null;
  let m=/^(\d{4})[-/.](\d{1,2})(?:[-/.](\d{1,2}))?(?:[ T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/.exec(s);
  if(m)return m[3]?mk(+m[1],+m[2],+m[3],+m[4]||0,+m[5]||0,+m[6]||0,m[4]!=null?'min':'day'):mk(+m[1],+m[2],1,0,0,0,'month');
  m=/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:[ T,]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/.exec(s);
  if(m){let a=+m[1],b=+m[2];const d=b>12?b:a,mo=b>12?a:b;/* วัน/เดือน/ปี ตามแบบไทย ยกเว้นเลขกลางเกิน 12 */return mk(+m[3],mo,d,+m[4]||0,+m[5]||0,+m[6]||0,m[4]!=null?'min':'day')}
  m=/^(\d{1,2})[-/.](\d{4})$/.exec(s);if(m)return mk(+m[2],+m[1],1,0,0,0,'month');
  m=/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(s);if(m){const H=+m[1]+(+m[2])/60+(+m[3]||0)/3600;return{d:'',h:H,p:'min',o:H*60}}
  return null;
}
function hwScale(f,fd,col,vals){
  if(!fd||!fd.d)return 1;
  const u=f.ov[fd.k]||f.units[col];
  if(u&&HW_SCALE[u]!=null)return HW_SCALE[u];
  /* no unit in the header: values over 200 for a house-size system are most likely W / Wh */
  const mx=Math.max(0,...vals.filter(v=>v!=null).map(Math.abs));return mx>200?.001:1;
}
/* ---- build datasets from all loaded files ---- */
function hwBuild(){
  const iv=[],rp=[],al=[];
  HW.files.forEach(f=>{
    if(f.kind==='alarm'){
      const g=k=>f.map[k]!=null?f.map[k]:-1;
      f.rows.forEach(r=>{const nm=String(r[g('aname')]??'').trim();if(!nm)return;
        const on=hwTime(r[g('aon')]),off=hwTime(r[g('aoff')]);
        al.push({name:nm,id:String(r[g('aid')]??'').trim(),sev:String(r[g('asev')]??'').trim(),dev:String(r[g('adev')]??'').trim(),stat:String(r[g('astat')]??'').trim(),on,off,src:f.name})});
      return;
    }
    const ti=f.map.t;if(ti==null)return;
    const keys=Object.keys(f.map).filter(k=>k!=='t');
    const recs=[];f.rows.forEach(r=>{const t=hwTime(r[ti]);if(t)recs.push({t,r})});
    if(!recs.length)return;
    const sc={};keys.forEach(k=>{const fd=HW_F.find(x=>x.k===k)||(/^pv\d+p$/.test(k)?{k,d:'P'}:null);sc[k]=hwScale(f,fd,f.map[k],recs.map(o=>hwNum(o.r[f.map[k]])))});
    recs.sort((a,b)=>a.t.o-b.t.o);
    let kind=f.kind;
    if(kind==='auto'){
      const sameDay=[];for(let i=1;i<recs.length;i++)if(recs[i].t.d===recs[i-1].t.d)sameDay.push(recs[i].t.o-recs[i-1].t.o);
      const hasMin=recs.filter(o=>o.t.p==='min').length>recs.length*.3;
      kind=hasMin&&sameDay.length>=Math.min(3,recs.length-1)?'interval':'report';
      f.auto=kind;
    }
    recs.forEach(({t,r})=>{const v={};keys.forEach(k=>{const n=hwNum(r[f.map[k]]);if(n!=null)v[k]=n*sc[k]});(kind==='report'?rp:iv).push({t,v})});
  });
  return{iv,rp,al};
}
/* interval records of one day → uniform grid (gaps stay null) */
function hwGrid(recs){
  const df=[];for(let i=1;i<recs.length;i++){const d=recs[i].t.h-recs[i-1].t.h;if(d>0)df.push(d*60)}
  df.sort((a,b)=>a-b);const med=df.length?df[df.length>>1]:5;
  const step=[1,5,10,15,30,60].reduce((a,b)=>Math.abs(b-med)<Math.abs(a-med)?b:a,5);
  const n=Math.round(24*60/step),x=[...Array(n+1)].map((_,i)=>i*step/60),S={};
  recs.forEach(({t,v})=>{const i=clamp(Math.round(t.h*60/step),0,n);Object.keys(v).forEach(k=>{(S[k]||(S[k]=Array(n+1).fill(null)))[i]=v[k]})});
  return{x,S,step};
}
const hwMax=a=>{let m=null,i=-1;(a||[]).forEach((v,j)=>{if(v!=null&&(m==null||v>m)){m=v;i=j}});return{m,i}};
const hwMin=a=>{let m=null;(a||[]).forEach(v=>{if(v!=null&&(m==null||v<m))m=v});return m};
/* energy of the day from a column: cumulative (rising) → last − first, otherwise per-interval values → sum */
function hwDayE(a,isDaily){
  const v=(a||[]).filter(x=>x!=null);if(!v.length)return null;
  let up=0,dn=0;for(let i=1;i<v.length;i++){if(v[i]>v[i-1]+1e-9)up++;else if(v[i]<v[i-1]-1e-9)dn++}
  if(dn<=Math.max(1,v.length*.02)&&up>0)return isDaily?Math.max(...v):Math.max(...v)-v[0];
  return v.reduce((s,x)=>s+x,0);
}
function hwInteg(a,step){let e=0;for(let i=1;i<a.length;i++)if(a[i]!=null&&a[i-1]!=null)e+=(a[i]+a[i-1])/2*step/60;return e}

/* ---- sample data (สังเคราะห์ ไม่ใช่ log จริง): SUN2000-10KTL-M1 + 2 สตริง × 10 แผง 650 W + LUNA2000 10 kWh ---- */
function hwSample(){
  const day=(typeof SIM!=='undefined'&&SIM.date)||accToday(),[Y,M,D]=day.split('-').map(Number);
  const T=(h,m)=>`${Y}-${pad2(M)}-${pad2(D)} ${pad2(h)}:${pad2(m)}:00`;
  let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
  const head=['Time','Active power(kW)','Total input power(kW)','PV1 input voltage(V)','PV1 input current(A)','PV2 input voltage(V)','PV2 input current(A)','Daily energy(kWh)','Internal temperature(℃)','Phase A voltage(V)','Grid frequency(Hz)','Battery SOC(%)','Charge/Discharge power(kW)','Load power(kW)','Grid active power(kW)','Feed-in energy today(kWh)','Supply from grid today(kWh)'];
  const rows=[];let soc=38,ed=0,ex=0,im=0;
  for(let i=0;i<288;i++){
    const h=i/12,hh=Math.floor(h),mm=i%12*5;
    let g=h>6.1&&h<18.2?Math.pow(Math.sin(Math.PI*(h-6.1)/12.1),1.25):0;
    if(h>13&&h<13.6)g*=.35+.25*rnd();if(h>10.2&&h<10.4)g*=.6;
    const sh2=h>7&&h<8.6?.35:1,lost=h>=15.67&&h<15.76;
    const i1=g*13.6*(.97+.03*rnd()),i2=g*13.6*sh2*(.97+.03*rnd());
    const tc=30+28*g,vm=g>0.02?10*(40.6-0.11*(tc-25))*(.98+.02*g):g>0?10*45:0;
    const v1=g>0?vm:0,v2=g>0?vm*(sh2<1?.97:1):0,pdc=(v1*i1+v2*i2)/1000;
    let load=.45+(h>6&&h<8?1.2:0)+(h>11.5&&h<13?.8:0)+(h>18&&h<22.5?2.1:0)+(h>13&&h<17?1.4:0)+.15*rnd();
    let ac=pdc*.975,pb=0;
    if(lost){ac=0;pb=0}
    else{const sur=ac-load;if(sur>0&&soc<100)pb=Math.min(sur,5,(100-soc)/100*10*12);else if(sur<0&&soc>15)pb=-Math.min(-sur,5,(soc-15)/100*10*12)}
    let pac=lost?0:Math.min(10,ac-pb);if(!lost&&ac-pb>10){pb=Math.min(5,ac-10);pac=10}
    soc=clamp(soc+pb/12/10*100*(pb>0?.95:1),0,100);
    const pg=lost?0:pac-load;
    ed+=Math.max(0,pdc*.975)/12;if(pg>0)ex+=pg/12;else im+=-pg/12;
    const vg=lost?0:226+3*Math.max(0,pg)/10+2*rnd();
    rows.push([T(hh,mm),+pac.toFixed(3),+pdc.toFixed(3),+v1.toFixed(1),+i1.toFixed(2),+v2.toFixed(1),+i2.toFixed(2),+ed.toFixed(2),+(tc-2+6*Math.min(1,pac/10)).toFixed(1),+vg.toFixed(1),lost?0:+(50+(rnd()-.5)*.06).toFixed(2),+soc.toFixed(0),+pb.toFixed(3),+load.toFixed(3),+pg.toFixed(3),+ex.toFixed(2),+im.toFixed(2)]);
  }
  const prev=new Date(Date.UTC(Y,M-1,D-1)).toISOString().slice(0,10);
  const alarm={name:`ตัวอย่าง alarm ${day}.csv`,rows:[['Alarm Name','Alarm ID','Severity','Device Name','Occurrence Time','Clearance Time','Status'],
    ['Low Insulation Resistance','2062','Major','Inverter-1',T(6,10),T(6,45),'Cleared'],
    ['Abnormal String','2013','Warning','Inverter-1',T(7,5),T(8,35),'Cleared'],
    ['Grid Loss','2032','Major','Inverter-1',T(15,40),T(15,46),'Cleared'],
    ['Abnormal Smart Power Sensor Communication','2067','Minor','Inverter-1',T(19,20),'','Active'],
    ['Grid Overvoltage','2034','Major','Inverter-1',prev+' 12:15:00',prev+' 12:18:00','Cleared']]};
  const rep=[['Statistical Period','PV Yield (kWh)','Export (kWh)','Import (kWh)','Consumption (kWh)']];
  for(let k=29;k>=0;k--){const d=new Date(Date.UTC(Y,M-1,D-k)),c=.55+.45*Math.abs(Math.sin(k*1.7)),y=58*c;const cons=34+6*Math.sin(k);rep.push([d.toISOString().slice(0,10),+y.toFixed(1),+(y*.55).toFixed(1),+(cons*.32).toFixed(1),+cons.toFixed(1)])}
  return[{name:`ตัวอย่าง 5 นาที ${day}.csv`,rows:[head].concat(rows)},alarm,{name:'ตัวอย่าง รายวัน 30 วัน.csv',rows:rep}];
}

/* ---- UI ---- */
function hwMsg(t,cls){const m=$('#hwmsg');if(!m)return;m.textContent=t||'';m.className='simmsg'+(cls?' '+cls:'');m.hidden=!t}
async function hwAdd(sheets,isSample){
  let n=0,bad=[];
  sheets.forEach(s=>{const f=hwDetect(s);if(f){f.id=++HW.seq;f.sample=!!isSample;HW.files.push(f);n++}else bad.push(s.name)});
  if(n){HW.sel=HW.files.length-n;HW.day=null}
  hwMsg(bad.length?`อ่านไม่ได้: ${bad.join(', ')} (ไม่พบหัวคอลัมน์เวลา/ค่าที่รู้จัก ลองส่งออกใหม่เป็น CSV หรือ Excel จาก FusionSolar)`:n?`นำเข้าแล้ว ${n} ชุดข้อมูล`:'',bad.length?'err':'ok');
  hwRender();
}
function initHwlog(){
  const sec=$('#fupg-log');if(!sec)return;
  $('#hwfile').addEventListener('change',async e=>{
    if(!hwRole()){hwMsg('ต้องลงชื่อเป็นผู้เรียนหรือผู้สอนก่อน','err');e.target.value='';return}
    const fs=[...e.target.files];e.target.value='';if(!fs.length)return;
    hwMsg('กำลังอ่านไฟล์…');const all=[];
    for(const f of fs){if(f.size>40*1024*1024){hwMsg(`${f.name} ใหญ่เกิน 40 MB`,'err');continue}
      try{all.push(...await hwReadFile(f))}catch(err){hwMsg(`${f.name}: ${err.message||'อ่านไม่ได้'}`,'err');return}}
    hwAdd(all,false);
  });
  $('#hwsample').addEventListener('click',()=>{if(!hwRole())return;HW.files=HW.files.filter(f=>!f.sample);HW.kwp=HW.kwp||13;$('#hwkwp').value=HW.kwp;hwAdd(hwSample(),true)});
  $('#hwdlsample').addEventListener('click',()=>{const s=hwSample()[0],q=v=>/[",\n]/.test(String(v))?`"${String(v).replace(/"/g,'""')}"`:v;
    hwDownload(s.name.replace(/^ตัวอย่าง/,'huawei-sample'),'﻿'+s.rows.map(r=>r.map(q).join(',')).join('\r\n'))});
  $('#hwclear').addEventListener('click',()=>{HW.files=[];HW.day=null;hwMsg('');hwRender()});
  $('#hwkwp').addEventListener('input',e=>{HW.kwp=Math.max(0,+e.target.value||0);hwRender()});
  sec.addEventListener('change',e=>{
    const t=e.target;
    if(t.id==='hwday'){HW.day=t.value;hwRender()}
    else if(t.id==='hwsel'){HW.sel=+t.value;hwRender()}
    else if(t.id==='hwsev'){HW.sev=t.value;hwRender()}
    else if(t.dataset.hwk){const f=HW.files[HW.sel];if(!f)return;const k=t.dataset.hwk;
      if(t.value==='')delete f.map[k];else{Object.keys(f.map).forEach(x=>{if(f.map[x]===+t.value)delete f.map[x]});f.map[k]=+t.value}hwRender()}
    else if(t.dataset.hwu){const f=HW.files[HW.sel];if(!f)return;if(t.value)f.ov[t.dataset.hwu]=t.value;else delete f.ov[t.dataset.hwu];hwRender()}
    else if(t.id==='hwkind'){const f=HW.files[HW.sel];if(!f)return;const was=f.kind==='alarm';f.kind=t.value;if((t.value==='alarm')!==was){f.map=hwMatch(t.value==='alarm'?HW_A:HW_F,f.head)}hwRender()}
  });
  sec.addEventListener('click',e=>{
    const b=e.target.closest('[data-hwdel]');if(b){HW.files.splice(+b.dataset.hwdel,1);HW.sel=0;HW.day=null;hwRender();return}
    if(e.target.id==='hwcsv')hwExportDay();
  });
  window.addEventListener('resize',()=>{if(typeof curTab!=='undefined'&&curTab==='fusion'&&FU.page==='log')hwCharts()});
}
function hwDownload(name,text){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
let hwCfg=[];
function hwCharts(){hwCfg.forEach(([id,c])=>{const h=document.getElementById(id);if(h)drawLine(h,c)})}
function hwBars(host,labels,series,unit){
  const W=Math.max(280,host.clientWidth||600),H=230,ml=46,mr=10,mt=20,mb=34,iw=W-ml-mr,ih=H-mt-mb;
  const top=Math.max(1e-6,...series.flatMap(s=>s.vals.map(v=>v||0))),stp=niceStep(top/4),ym=stp*4,n=labels.length,gw=iw/n,bw=Math.max(2,Math.min(26,gw*.8/series.length));
  const sy=v=>mt+ih-v/ym*ih;let s=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="กราฟแท่งพลังงานรายช่วง">`;
  for(let i=0;i<=4;i++){const y=sy(stp*i);s+=`<line x1="${ml}" x2="${W-mr}" y1="${y}" y2="${y}" class="gl"/><text x="${ml-6}" y="${y+4}" class="ax" text-anchor="end">${fmtNum(stp*i)}</text>`}
  s+=`<text x="${ml-6}" y="10" class="ax" text-anchor="end">${unit}</text>`;
  const every=Math.max(1,Math.ceil(n/(iw/46)));
  labels.forEach((l,i)=>{const x0=ml+i*gw+(gw-bw*series.length)/2;
    series.forEach((se,k)=>{const v=se.vals[i];if(v==null)return;s+=`<rect x="${(x0+k*bw).toFixed(1)}" y="${sy(Math.max(0,v)).toFixed(1)}" width="${(bw-1).toFixed(1)}" height="${(ih-(sy(Math.max(0,v))-mt)).toFixed(1)}" style="fill:${se.color}"><title>${esc(l)} · ${esc(se.short)} ${f(v,1)} ${unit}</title></rect>`});
    if(i%every===0)s+=`<text x="${(ml+i*gw+gw/2).toFixed(1)}" y="${H-12}" class="ax" text-anchor="middle">${esc(l)}</text>`});
  host.innerHTML=s+'</svg>';
}
const hwDayLbl=d=>{if(!d)return'(ไม่มีวันที่)';const[y,m,dd]=d.split('-');return`${+dd}/${+m}/${+y+543}`};
const hwT=t=>t?(t.d?hwDayLbl(t.d)+' ':'')+fmtT(t.h):'—';
function hwSevCls(s){s=String(s).toLowerCase();return/critical|major|วิกฤต|สำคัญ|ร้ายแรง|หลัก/.test(s)?'err':/minor|warning|เตือน|รอง/.test(s)?'warn':'idle'}

function hwRender(){
  const sec=$('#fupg-log');if(!sec)return;
  const ok=hwRole();
  $('#hwlock').hidden=ok;$('#hwbody').hidden=!ok;
  if(!ok){HW.files=[];return}
  const D=hwBuild(),out=[];hwCfg=[];
  /* loaded files */
  $('#hwfiles').innerHTML=HW.files.length?HW.files.map((f,i)=>`<span class="chip hwf">${esc(f.name)} · ${f.kind==='alarm'?'แจ้งเตือน':(f.kind==='auto'?f.auto:f.kind)==='report'?'รายงานรายช่วง':'รายช่วงเวลา'} · ${f.rows.length} แถว<button type="button" class="hwx" data-hwdel="${i}" aria-label="เอาออก ${esc(f.name)}">×</button></span>`).join(''):'<span class="hint tight">ยังไม่มีไฟล์ เลือกไฟล์ log หรือกด "ใช้ข้อมูลตัวอย่าง"</span>';
  $('#hwclear').hidden=!HW.files.length;
  $('#hwempty').hidden=!!HW.files.length;
  /* ---- interval: one day ---- */
  const days=[...new Set(D.iv.map(r=>r.t.d))].sort();
  if(days.length&&!days.includes(HW.day))HW.day=days[days.length-1];
  $('#hwdaybox').hidden=!days.length;
  if(days.length)$('#hwday').innerHTML=days.map(d=>`<option value="${esc(d)}" ${d===HW.day?'selected':''}>${hwDayLbl(d)} (${D.iv.filter(r=>r.t.d===d).length} จุด)</option>`).join('');
  const ivBox=$('#hwiv');ivBox.hidden=!days.length;
  if(days.length){
    const recs=D.iv.filter(r=>r.t.d===HW.day),G=hwGrid(recs),S=G.S,x=G.x;
    const alD=D.al.filter(a=>a.on&&a.on.d===HW.day);
    const vb=alD.map(a=>[a.on.h,a.off&&a.off.d===HW.day?Math.max(a.off.h,a.on.h+G.step/60):Math.min(24,a.on.h+.25)]);
    const pacE=S.pac?hwInteg(S.pac,G.step):null,eday=S.eday?hwDayE(S.eday,true):null,E=eday!=null?eday:pacE!=null?pacE:S.pdc?hwInteg(S.pdc,G.step):null;
    const pk=hwMax(S.pac||S.pdc),strI=Object.keys(S).filter(k=>/^pv\d+c$/.test(k));
    /* production window from PV side (AC output of a hybrid also carries battery discharge at night) */
    const prodA=S.pdc||(strI.length?x.map((_,i)=>strI.some(k=>S[k][i]!=null)?strI.reduce((s,k)=>s+(S[k][i]||0),0):null):null)||S.pac||[];
    const th=S.pdc||!strI.length?.02:.05,on=prodA.findIndex(v=>v!=null&&v>th),offI=prodA.map((v,i)=>v!=null&&v>th?i:-1).filter(i=>i>=0).pop();
    const strs=[...new Set(Object.keys(S).filter(k=>/^pv\d+[vic]$/.test(k)).map(k=>+k.slice(2,-1)))].sort((a,b)=>a-b);
    const vmx=Math.max(0,...strs.map(n=>hwMax(S[`pv${n}v`]).m||0));
    const exE=S.exp?hwDayE(S.exp):S.pgrid?hwInteg(S.pgrid.map(v=>v==null?null:Math.max(0,v)),G.step):null;
    const imE=S.imp?hwDayE(S.imp):S.pgrid?hwInteg(S.pgrid.map(v=>v==null?null:Math.max(0,-v)),G.step):null;
    const ldE=S.pload?hwInteg(S.pload,G.step):null;
    const mx=[];
    if(E!=null)mx.push(['พลังงานที่ผลิต',`${f(E,2)} kWh`,eday!=null?'จากคอลัมน์พลังงานสะสมวันนี้':'คำนวณจากกำลังตามเวลา']);
    if(E!=null&&HW.kwp>0)mx.push(['ผลผลิตจำเพาะ',`${f(E/HW.kwp,2)} kWh/kWp`,`เทียบขนาดติดตั้ง ${f(HW.kwp,2)} kWp ≈ ชั่วโมงแดดเต็ม`]);
    if(pk.m!=null)mx.push(['กำลังสูงสุด',`${f(pk.m,2)} kW`,`เวลา ${fmtT(x[pk.i])}`]);
    if(on>=0)mx.push(['ช่วงที่ผลิตไฟ',`${fmtT(x[on])}–${fmtT(x[offI])}`,`${f((offI-on)*G.step/60,1)} ชม.`]);
    if(vmx>0)mx.push(['แรงดันสตริงสูงสุด',`${f(vmx,0)} V`,`${strs.length} สตริง`]);
    if(S.temp)mx.push(['อุณหภูมิเครื่องสูงสุด',`${f(hwMax(S.temp).m,1)} °C`,'']);
    if(S.soc)mx.push(['SOC แบต',`${f(hwMin(S.soc),0)}–${f(hwMax(S.soc).m,0)} %`,'ต่ำสุด–สูงสุด']);
    if(exE!=null||imE!=null)mx.push(['ขาย / ซื้อไฟ',`${exE!=null?f(exE,2):'—'} / ${imE!=null?f(imE,2):'—'} kWh`,'Export / Import']);
    if(ldE!=null)mx.push(['ใช้ไฟ (โหลด)',`${f(ldE,2)} kWh`,E?`ใช้จากแผงเอง ≈ ${f(Math.max(0,Math.min(100,(E-(exE||0))/E*100)),0)}% ของที่ผลิต`:'']);
    $('#hwmx').innerHTML=mx.map(m=>`<div class="metric"><div class="k">${m[0]}</div><div class="v">${m[1]}</div><div class="s">${m[2]}</div></div>`).join('');
    /* observations for teaching (rough rules of thumb) */
    const I=typeof curInv==='function'?curInv():null,chk=[];
    const daylight=x.map((_,i)=>on>=0&&i>=on&&i<=offI);
    let gap=0,gmax=0;daylight.forEach((d,i)=>{const miss=d&&Object.keys(S).every(k=>S[k][i]==null);gap=miss?gap+1:0;gmax=Math.max(gmax,gap)});
    if(gmax*G.step>=30)chk.push(['warn',`ข้อมูลขาดช่วงกลางวันนานสุด ${gmax*G.step} นาที: อาจเป็นสัญญาณ WiFi/Dongle หลุด หรืออินเวอร์เตอร์หยุด`]);
    if(S.pac&&pk.m>0){let run=0,best=0;S.pac.forEach(v=>{run=v!=null&&v>=pk.m*.985?run+1:0;best=Math.max(best,run)});
      if(best*G.step>=30)chk.push(['warn',`กำลัง AC แบนราบที่ ${f(pk.m,2)} kW นาน ${best*G.step} นาที: น่าจะถึงพิกัดอินเวอร์เตอร์ (clipping) แผงมากกว่าพิกัด AC`])}
    const vlim=I&&/huawei/i.test(I.brand||'')&&I.vmax?I.vmax:1100;
    if(vmx>0)chk.push(vmx>vlim*.95?['err',`แรงดันสตริงสูงสุด ${f(vmx,0)} V ใกล้/เกินพิกัด ${vlim} V`]:['ok',`แรงดันสตริงสูงสุด ${f(vmx,0)} V ไม่เกินพิกัด ${vlim} V${I&&/huawei/i.test(I.brand||'')?` (${I.model})`:' (ค่าทั่วไปของ SUN2000)'}`]);
    if(strs.length>1&&strs.every(n=>S[`pv${n}c`])){
      const mid=x.map((h,i)=>h>=10&&h<=14?i:-1).filter(i=>i>=0),avg=n=>{const a=mid.map(i=>S[`pv${n}c`][i]).filter(v=>v!=null);return a.length?a.reduce((s,v)=>s+v,0)/a.length:0};
      const A=strs.map(avg),hi=Math.max(...A),lo=Math.min(...A);
      if(hi>0.5)chk.push(lo<hi*.85?['warn',`กระแสสตริงช่วง 10:00–14:00 ต่างกัน ${f((1-lo/hi)*100,0)}% (PV${strs[A.indexOf(lo)]} ต่ำสุด): ตรวจเงาบัง ฝุ่น ทิศแผง หรือจำนวนแผงไม่เท่ากัน`]:['ok',`กระแสสตริงช่วงกลางวันใกล้เคียงกัน (ต่างกัน ${f((1-lo/hi)*100,0)}%)`]);
      const mor=x.map((h,i)=>h>=7&&h<=9?i:-1).filter(i=>i>=0);
      const am=strs.map(n=>{const a=mor.map(i=>S[`pv${n}c`][i]).filter(v=>v!=null);return a.length?a.reduce((s,v)=>s+v,0)/a.length:0}),amh=Math.max(...am);
      if(amh>.3&&Math.min(...am)<amh*.7&&lo>=hi*.85)chk.push(['warn',`ช่วง 07:00–09:00 PV${strs[am.indexOf(Math.min(...am))]} ได้กระแสน้อยกว่าสตริงอื่นชัดเจน แต่กลางวันปกติ: น่าจะมีเงาบังตอนเช้า (ดูเมนู 05 ไซต์และเงา)`]);
    }
    if(S.vgrid){const a=S.vgrid.filter(v=>v!=null&&v>50);if(a.length){const hv=Math.max(...a),lv=Math.min(...a);
      chk.push(hv>253||lv<207?['warn',`แรงดันกริด ${f(lv,0)}–${f(hv,0)} V ออกนอกช่วง 207–253 V (230 V ±10%)${hv>253?' แรงดันสูงตอนขายไฟมาก: ตรวจขนาดสาย AC':''}`]:['ok',`แรงดันกริด ${f(lv,0)}–${f(hv,0)} V อยู่ในช่วง 207–253 V`])}
      const z=S.vgrid.map((v,i)=>v!=null&&v<50&&daylight[i]?1:0).reduce((s,v)=>s+v,0);if(z)chk.push(['warn',`กริดหายช่วงกลางวัน ${z*G.step} นาที (แรงดัน ≈ 0 V) อินเวอร์เตอร์ต้องหยุดจ่ายเข้ากริด`])}
    if(S.freq){const a=S.freq.filter(v=>v!=null&&v>40);if(a.length&&(Math.max(...a)>50.5||Math.min(...a)<49.5))chk.push(['warn',`ความถี่ ${f(Math.min(...a),2)}–${f(Math.max(...a),2)} Hz ออกนอก 49.5–50.5 Hz`])}
    if(S.temp){const t=hwMax(S.temp).m;if(t>=65)chk.push(['warn',`อุณหภูมิเครื่องสูงถึง ${f(t,1)} °C: อินเวอร์เตอร์อาจลดกำลัง (derating) ตรวจการระบายอากาศ`])}
    if(S.soc){const lo=hwMin(S.soc);if(lo<=15)chk.push(['warn',`SOC ลงถึง ${f(lo,0)}%: แบตเล็กไปสำหรับโหลดกลางคืน หรือควรตั้ง SOC สำรองไว้สำหรับไฟดับ`])}
    if(alD.length)chk.push(['warn',`มีแจ้งเตือน ${alD.length} รายการในวันนี้ (แถบสีเหลืองในกราฟ) ดูตารางแจ้งเตือนด้านล่าง`]);
    $('#hwchk').innerHTML=chk.length?chk.map(([l,t])=>`<li><span class="b ${l}">${l==='ok'?'✓':l==='err'?'!':'?'}</span><span>${esc(t)}</span></li>`).join(''):'<li><span class="b idle">–</span><span>ไม่มีคอลัมน์ที่ใช้ตรวจอัตโนมัติ</span></li>';
    /* charts */
    const xs={x,xmin:0,xmax:24,vb,vbl:vb.length?'แจ้งเตือน':''};
    const mk=(id,unit,aria,series,ext)=>{series=series.filter(Boolean);const host=document.getElementById(id),card=host.closest('.card');card.hidden=!series.length;if(!series.length)return;
      const all=series.flatMap(s=>s.vals.filter(v=>v!=null));const top=Math.max(...all.map(Math.abs),1e-3);
      const c=Object.assign({},xs,{unit,aria,ymax:top*1.02,series:series.map(s=>Object.assign({fmt:v=>f(v,unit==='kW'?2:unit==='A'?2:1)},s))},ext||{});
      c.leg=id+'L';const lg=document.getElementById(id+'L');if(lg)lg.innerHTML=legHTML(c.leg,c.series,'',hwCharts);hwCfg.push([id,c])};
    const pos=a=>a&&a.map(v=>v==null?null:Math.max(0,v));
    mk('hwcP','kW','กราฟกำลังไฟฟ้าจาก log',[S.pac&&{short:'AC ขาออก',color:'var(--s1)',vals:S.pac,area:true,peak:true},S.pdc&&{short:'DC จากแผง',color:'var(--s2)',vals:S.pdc,dash:'5 4'},S.pload&&{short:'โหลด',color:'var(--s3)',vals:S.pload},S.pgrid&&{short:'ขายเข้ากริด',color:'var(--accent)',vals:pos(S.pgrid)},S.pgrid&&{short:'ซื้อจากกริด',color:'var(--err)',vals:S.pgrid.map(v=>v==null?null:Math.max(0,-v))},S.pbat&&{short:'ชาร์จแบต',color:'var(--warn)',vals:pos(S.pbat),dash:'2 3'},S.pbat&&{short:'แบตจ่าย',color:'var(--muted)',vals:S.pbat.map(v=>v==null?null:Math.max(0,-v)),dash:'2 3'}],
      I&&I.pac&&/huawei/i.test(I.brand||'')?{refs:[{y:I.pac/1000,label:`พิกัด ${I.model} ${f(I.pac/1000,1)} kW`}]}:null);
    const cols=['var(--s1)','var(--s2)','var(--s3)','var(--accent)','var(--warn)','var(--err)','var(--muted)','var(--s1)'];
    mk('hwcV','V','กราฟแรงดันสตริง',strs.map((n,j)=>S[`pv${n}v`]&&{short:`PV${n}`,color:cols[j%8],vals:S[`pv${n}v`]}),vmx>vlim*.6?{refs:[{y:vlim,label:`พิกัด ${vlim} V`}],ymax:Math.max(vmx,vlim)*1.02}:null);
    mk('hwcI','A','กราฟกระแสสตริง',strs.map((n,j)=>S[`pv${n}c`]&&{short:`PV${n}`,color:cols[j%8],vals:S[`pv${n}c`]}));
    mk('hwcG','V','กราฟแรงดันกริด',[S.vgrid&&{short:'แรงดันกริด',color:'var(--s1)',vals:S.vgrid}],S.vgrid?{refs:[{y:253,label:'253 V'},{y:207,label:'207 V'}],ymax:Math.max(260,hwMax(S.vgrid).m*1.02)}:null);
    mk('hwcT','% / °C','กราฟ SOC แบตและอุณหภูมิ',[S.soc&&{short:'SOC แบต (%)',color:'var(--s3)',vals:S.soc,area:true},S.temp&&{short:'อุณหภูมิ (°C)',color:'var(--s2)',vals:S.temp}],{ymax:Math.max(100,hwMax(S.temp).m||0)});
  }
  /* ---- report: per day / month ---- */
  const rpBox=$('#hwrp');rpBox.hidden=!D.rp.length;
  if(D.rp.length){
    const by={};D.rp.forEach(r=>{const k=r.t.p==='month'?r.t.d.slice(0,7):r.t.d;const o=by[k]||(by[k]={});Object.keys(r.v).forEach(q=>o[q]=(o[q]||0)+r.v[q])});
    const ks=Object.keys(by).sort(),isM=ks.every(k=>k.length===7);
    const lab=ks.map(k=>{const[y,m,d]=k.split('-');return isM?`${+m}/${(+y+543)%100}`:`${+d}/${+m}`});
    const ser=[['eday','ผลิต','var(--s1)'],['exp','ขาย','var(--accent)'],['imp','ซื้อ','var(--err)'],['cons','ใช้ไฟ','var(--s3)']].filter(([k])=>ks.some(q=>by[q][k]!=null)).map(([k,n,c])=>({k,short:n,color:c,vals:ks.map(q=>by[q][k]??null)}));
    $('#hwrpL').innerHTML=ser.map(s=>`<span class="lg"><i class="lk" style="background:${s.color}"></i>${s.short}</span>`).join('');
    requestAnimationFrame(()=>{const h=$('#hwcR');if(h)hwBars(h,lab,ser,'kWh')});
    const tot=k=>ks.reduce((s,q)=>s+(by[q][k]||0),0),y=ser.find(s=>s.k==='eday');
    const best=y?ks[y.vals.indexOf(Math.max(...y.vals.map(v=>v||0)))]:null,worst=y?ks[y.vals.indexOf(Math.min(...y.vals.filter(v=>v!=null)))]:null;
    $('#hwrpmx').innerHTML=[y&&['ผลิตรวม',`${f(tot('eday'),1)} kWh`,`${ks.length} ${isM?'เดือน':'วัน'} · เฉลี่ย ${f(tot('eday')/ks.length,1)} kWh${HW.kwp>0&&!isM?` · ${f(tot('eday')/ks.length/HW.kwp,2)} kWh/kWp/วัน`:''}`],
      y&&['สูงสุด / ต่ำสุด',`${f(Math.max(...y.vals.map(v=>v||0)),1)} / ${f(Math.min(...y.vals.filter(v=>v!=null)),1)} kWh`,`${isM?best:hwDayLbl(best)} / ${isM?worst:hwDayLbl(worst)}`],
      ser.some(s=>s.k==='exp')&&['ขายรวม',`${f(tot('exp'),1)} kWh`,''],ser.some(s=>s.k==='imp')&&['ซื้อรวม',`${f(tot('imp'),1)} kWh`,''],
      ser.some(s=>s.k==='cons')&&['ใช้ไฟรวม',`${f(tot('cons'),1)} kWh`,y?`ผลิตได้ ${f(tot('eday')/Math.max(1e-6,tot('cons'))*100,0)}% ของที่ใช้`:'']].filter(Boolean).map(m=>`<div class="metric"><div class="k">${m[0]}</div><div class="v">${m[1]}</div><div class="s">${m[2]}</div></div>`).join('');
  }
  /* ---- alarms ---- */
  const alBox=$('#hwal');alBox.hidden=!D.al.length;
  if(D.al.length){
    const L=D.al.slice().sort((a,b)=>(b.on?b.on.o:0)-(a.on?a.on.o:0)).filter(a=>HW.sev==='all'||hwSevCls(a.sev)===HW.sev);
    const cnt={};D.al.forEach(a=>cnt[a.name]=(cnt[a.name]||0)+1);
    const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,5);
    $('#hwalsum').innerHTML=`ทั้งหมด ${D.al.length} รายการ · ร้ายแรง ${D.al.filter(a=>hwSevCls(a.sev)==='err').length} · เตือน ${D.al.filter(a=>hwSevCls(a.sev)==='warn').length} · พบบ่อย: ${top.map(([n,c])=>`${esc(n)} ×${c}`).join(', ')}`;
    $('#hwalt').innerHTML=`<thead><tr><th>เกิด</th><th>หาย</th><th>นาน</th><th>ระดับ</th><th>แจ้งเตือน</th><th>อุปกรณ์</th><th>แนวทางตรวจเบื้องต้น</th></tr></thead><tbody>`+(L.length?L.map(a=>{
      const dur=a.on&&a.off?a.off.o-a.on.o:null,h=hwHint(a.name,a.id);
      return`<tr><td class="mono">${hwT(a.on)}</td><td class="mono">${a.off?hwT(a.off):esc(a.stat||'ยังไม่หาย')}</td><td class="mono">${dur!=null&&dur>=0?(dur>=60?f(dur/60,1)+' ชม.':Math.round(dur)+' นาที'):'—'}</td><td><span class="pill ${hwSevCls(a.sev)}">${esc(a.sev||'—')}</span></td><td>${esc(a.name)}${a.id?` <span class="hint tight">(${esc(a.id)})</span>`:''}</td><td>${esc(a.dev||'—')}</td><td>${esc(h||'ดูคู่มือรุ่นนั้นตามรหัสแจ้งเตือน')}</td></tr>`}).join(''):'<tr><td colspan="7" class="hint">ไม่มีรายการในระดับที่เลือก</td></tr>')+'</tbody>';
  }
  /* ---- column mapping of the selected file ---- */
  const mapBox=$('#hwmap');mapBox.hidden=!HW.files.length;
  if(HW.files.length){
    HW.sel=clamp(HW.sel,0,HW.files.length-1);const F=HW.files[HW.sel],defs=F.kind==='alarm'?HW_A:HW_F;
    const extra=F.kind==='alarm'?[]:Object.keys(F.map).filter(k=>/^pv\d+[vic]$/.test(k)).sort().map(k=>({k,n:`สตริง PV${k.slice(2,-1)} ${({v:'แรงดัน (V)',c:'กระแส (A)',p:'กำลัง',i:'กระแส (A)'})[k.slice(-1)]}`,d:k.endsWith('p')?'P':''}));
    const opt=k=>`<option value="">— ไม่ใช้ —</option>`+F.head.map((h,i)=>`<option value="${i}" ${F.map[k]===i?'selected':''}>${esc(h||'(คอลัมน์ '+(i+1)+')')}</option>`).join('');
    $('#hwsel').innerHTML=HW.files.map((f,i)=>`<option value="${i}" ${i===HW.sel?'selected':''}>${esc(f.name)}</option>`).join('');
    $('#hwkind').value=F.kind;
    $('#hwmapt').innerHTML='<thead><tr><th>ข้อมูล</th><th>คอลัมน์ในไฟล์</th><th>หน่วย</th></tr></thead><tbody>'+defs.concat(extra).map(fd=>`<tr><td>${esc(fd.n)}</td><td><select data-hwk="${fd.k}" aria-label="คอลัมน์ของ ${esc(fd.n)}">${opt(fd.k)}</select></td><td>${fd.d?`<select data-hwu="${fd.k}" aria-label="หน่วยของ ${esc(fd.n)}"><option value="">อัตโนมัติ${F.map[fd.k]!=null&&F.units[F.map[fd.k]]?' ('+F.units[F.map[fd.k]]+')':''}</option>${(fd.d==='P'?['W','kW']:['Wh','kWh','MWh']).map(u=>`<option ${F.ov[fd.k]===u?'selected':''}>${u}</option>`).join('')}</select>`:'—'}</td></tr>`).join('')+'</tbody>';
    const pv=F.rows.slice(0,6);
    $('#hwraw').innerHTML=`<thead><tr>${F.head.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${pv.map(r=>`<tr>${F.head.map((_,i)=>`<td class="mono">${esc(r[i]??'')}</td>`).join('')}</tr>`).join('')}</tbody>`;
  }
  requestAnimationFrame(hwCharts);
}
function hwExportDay(){
  const D=hwBuild(),recs=D.iv.filter(r=>r.t.d===HW.day);if(!recs.length)return;
  const G=hwGrid(recs),ks=Object.keys(G.S),nm=k=>{const fd=HW_F.find(x=>x.k===k);return fd?fd.n+(fd.d==='P'?' (kW)':fd.d==='E'?' (kWh)':''):`PV${k.slice(2,-1)} ${k.endsWith('v')?'V':k.endsWith('p')?'kW':'A'}`};
  const L=[['เวลา'].concat(ks.map(nm))].concat(G.x.map((h,i)=>[fmtT(h)].concat(ks.map(k=>G.S[k][i]==null?'':+G.S[k][i].toFixed(4)))).filter((r,i)=>i<G.x.length-1&&r.slice(1).some(v=>v!=='')));
  hwDownload(`huawei-log-${HW.day||'day'}.csv`,'﻿'+L.map(r=>r.map(v=>/[",\n]/.test(String(v))?`"${String(v).replace(/"/g,'""')}"`:v).join(',')).join('\r\n'));
}
