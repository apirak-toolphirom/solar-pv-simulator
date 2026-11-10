/* ---- เมนู 18 (ส่วน Microinverter): Deye SUN-M200G4-EU-Q0 ต่อพ่วงสาย AC สายย่อยเดียว ----
   อ้างอิงคู่มือ Deye SUN-M130/160/180/200G4-EU-Q0 (2024-06): ข้อมูล DC/AC, เปิด/ปิดระบบ, ไฟ LED สถานะ, ข้อกำหนดติดตั้ง
   (สรุปไว้ใน Project: claude/deye-micro-g4-manual-notes.md) ค่าแผงและพฤติกรรมเป็นแบบจำลองเพื่อการเรียนรู้ ไม่ใช่เฟิร์มแวร์จริง
   ใช้ฟังก์ชัน/สถานะร่วมกับ deye.js (DY, dyRender, dyList ฯลฯ) */
const DM_MI={model:'SUN-M200G4-EU-Q0',w:2000,ia:8.7,lim:3,brkMan:40,micros:3,inputs:4};
const DM_FAULTS={
  m_pol:{n:'ขั้วแผงที่ช่อง 3 ของไมโครตัวที่ 2 สลับ'},
  m_pe:{n:'ไม่ได้ต่อสายดิน PE ที่ไมโครตัวสุดท้ายและโครงแผง'},
  m_ln:{n:'สาย L กับ N ของสายย่อยสลับกันที่ตู้'},
  m_brk:{n:'เบรกเกอร์สายย่อยที่ติดตั้งจริงเป็น 20 A (เล็กเกินไป)'},
  m_end:{n:'ปลายสายย่อยเปิดโล่ง ไม่ได้เข้า junction box'},
  m_gfdi:{n:'ไฟรั่วลงดินฝั่ง DC ของไมโครตัวที่ 1 (สาย DC เสียดสีโครงแผง)'}
};
const DM_SEL=[
  ['n','จำนวนไมโครต่อสายย่อย',[['','— เลือก —'],['2','2 ตัว'],['3','3 ตัว'],['4','4 ตัว'],['5','5 ตัว']]],
  ['brk','เบรกเกอร์สายย่อย',[['','— เลือก —'],['25','25 A'],['32','32 A'],['40','40 A'],['50','50 A']]],
  ['end','ปลายสายย่อย',[['','— เลือก —'],['open','ปล่อยเปิดโล่ง'],['cap','ปิดฝากันน้ำ (end cap) ที่ปลายสาย'],['jbox','เข้า junction box แล้วเดินสายเข้าตู้']]],
  ['dcl','สาย DC แผง → ไมโคร',[['','— เลือก —'],['2','ยาว 2 m'],['5','ยาว 5 m']]],
  ['pe','สายดิน PE',[['no','ไม่ต่อ'],['yes','ต่อ PE ถึงไมโครทุกตัวและโครงแผง']]],
  ['rcd','RCD / RCBO',[['none','ไม่มี'],['30','RCBO 30 mA']]],
  ['spd','SPD Type II ในตู้',[['no','ไม่มี'],['yes','มี']]]
];
const DM_PRE=['เบรกเกอร์ AC สายย่อยและเบรกเกอร์เมนปิดอยู่ ไม่มีไฟที่สาย AC','เสียบขั้ว AC ที่ไมโครทุกตัวและล็อกแน่นแล้ว (ห้ามเสียบ DC ขณะถอดขั้ว AC)','ขั้ว AC ที่ไม่ได้ใช้ปิดกันน้ำแล้ว ปลายสายย่อยเข้ากล่องต่อสาย','ต่อสายดิน PE ถึงไมโครทุกตัวและโครงแผง','เว้นช่องใต้ไมโครถึงหลังคาอย่างน้อย 1.5 cm ไมโครไม่โดนแดดฝนตรง','เตรียมมัลติมิเตอร์ และจดเลขซีเรียลไมโครแต่ละตัวเพื่อลงทะเบียน'];
const DM_WIFI=['เปิดแอปมอนิเตอร์ของผู้ผลิตและเลือกเครือข่าย WiFi ของบ้าน','ใส่รหัส WiFi และให้ไมโครเชื่อมต่อสำเร็จ','ตรวจว่ามีข้อมูลส่งขึ้นระบบ (ไมโครส่งข้อมูลทุก 5 นาที)'];
const DM_OFF=['ปิดเบรกเกอร์ AC สายย่อย','ถอดขั้ว AC ของไมโคร','คลุมแผงด้วยวัสดุทึบแสง','ถอดขั้ว DC (ห้ามถอดขณะมีกระแส)'];
const DM_CORRECT={n:'3',brk:'40',end:'jbox',dcl:'2',pe:'yes',rcd:'30',spd:'yes'};
const DM_DEFSET=()=>({n:'',brk:'',end:'',dcl:'',pe:'no',rcd:'none',spd:'no'});
const DM={set:DM_DEFSET(),pre:[],wifi:[],sw:{branch:false,main:false},log:[],waited:false,moff:[],mlast:null,_day:null};
const dmPts=()=>{const a=[];for(let m=1;m<=DM_MI.micros;m++)for(let i=1;i<=DM_MI.inputs;i++)a.push([`dc:${m}:${i}`,`DC ไมโคร ${m} ช่อง ${i} (ปลาย MC4 ของแผง)`,'dc']);return a};
const DM_MPT=()=>dmPts().concat([['gLN','AC กริดที่เบรกเกอร์เมน L–N','ac'],['gLPE','AC กริดที่เบรกเกอร์เมน L–PE','ac'],['gNPE','AC กริดที่เบรกเกอร์เมน N–PE','ac'],['brLN','AC ที่สายย่อย L–N (หลังเบรกเกอร์สายย่อย)','ac'],['pe','ความต่อเนื่อง PE: โครงแผงไมโครตัวสุดท้าย–บาร์กราวด์','ohm'],['endLook','ตรวจด้วยตา: ปลายสายย่อย','look'],['brkLook','ตรวจด้วยตา: เบรกเกอร์สายย่อยในตู้','look']]);

function dmReset(){DM.sw={branch:false,main:false};DM.log=[];DM.pre=[];DM.wifi=[];DM.waited=false;DM.moff=[];DM.mlast=null}
function dmEff(){const F=new Set(DY.faults),S=DM.set;return{n:+S.n||0,brk:F.has('m_brk')?20:(+S.brk||0),end:F.has('m_end')?'open':S.end,pe:F.has('m_pe')?'no':S.pe,F}}
/* ไมโครแต่ละตัว ณ เวลา h: กำลังออก AC และไฟ LED */
function dmMicros(h,out){
  const E=dmEff(),F=E.F,sun=dySun(h)*(1-DY.dash.cloud/100),acOn=DM.sw.branch&&DM.sw.main&&!out;
  const polIdx=(2-1)*DM_MI.inputs+(3-1);
  const ms=[];let tot=0;
  for(let m=0;m<DM_MI.micros;m++){
    let p=0;
    for(let i=0;i<DM_MI.inputs;i++){const k=m*DM_MI.inputs+i;if(F.has('m_pol')&&k===polIdx)continue;p+=650*sun*0.7}
    p=Math.min(DM_MI.w,p)*0.965;
    let led='off',txt='ดับ: ไม่มีไฟ AC เข้าไมโคร',pw=0;
    if(acOn){
      if(F.has('m_ln')){led='red3';txt='แดง 3 ครั้ง: กริดผิดปกติ'}
      else if(F.has('m_gfdi')&&m===0){led='red4';txt='แดง 4 ครั้ง: GFDI ไฟรั่วลงดินฝั่ง PV'}
      else if(!DM.waited){led='red1';txt='แดงสั้น 1 ครั้ง: สตาร์ทสำเร็จ (รอครบ 1 นาที)'}
      else if(p<5){led='redf';txt='แดงกะพริบ: ไม่ผลิตไฟ (แสงน้อย)'}
      else{pw=p;led=p>=1000?'bluef':'blues';txt=p>=1000?'น้ำเงินกะพริบเร็ว: ผลิตไฟมาก':'น้ำเงินกะพริบช้า: ผลิตไฟน้อย'}
    }
    ms.push({m:m+1,p:pw,led,txt});tot+=pw;
  }
  let trip=false;
  if(acOn&&E.brk>0&&tot/230>E.brk){trip=true;ms.forEach(x=>{x.p=0;x.led='off';x.txt='ดับ: เบรกเกอร์สายย่อยทริป'});tot=0}
  return{ms,tot,trip,acOn};
}
function dmDay(){
  if(DM._day)return DM._day;
  const D=DY.dash,rows=[],T={kwh:0,trip:false,led:{}};let ideal=0;
  const sv=DM.sw,sw0={branch:sv.branch,main:sv.main},w0=DM.waited;
  DM.sw={branch:true,main:true};DM.waited=true;
  const F=DY.faults;DY.faults=[];const sset=DM.set;DM.set=Object.assign({},DM_CORRECT);
  for(let i=0;i<288;i++){const h=i/12,r=dmMicros(h,D.out&&h>=D.o0&&h<D.o1);ideal+=r.tot/12/1000}
  DY.faults=F;DM.set=sset;DM.sw=sw0;DM.waited=w0;
  for(let i=0;i<288;i++){const h=i/12,out=D.out&&h>=D.o0&&h<D.o1,r=dmMicros(h,out);r.h=h;r.out=out;rows.push(r);T.kwh+=r.tot/12/1000;if(r.trip)T.trip=true;
    r.ms.forEach(x=>{if(h>=8&&h<=16&&r.acOn&&!out)T.led[x.m]=x.led})}
  return DM._day={rows,T,ideal};
}
const dmNow=()=>{const d=dmDay();return d.rows[Math.max(0,Math.min(287,Math.round(DY.dash.t/5)))]};

function dmMeasure(n){
  const E=dmEff(),F=E.F,out=false;let txt='',unit='',note='';const fmt=(x,d)=>(x<0?'−':'')+Math.abs(x).toFixed(d);
  const h=DY.dash.t/60,lit=dySun(h)>0||(h>5.75&&h<18.25);
  if(n.startsWith('dc:')){const[,m,i]=n.split(':').map(Number);const k=(m-1)*DM_MI.inputs+(i-1);const rev=F.has('m_pol')&&k===(2-1)*DM_MI.inputs+(3-1);const v=lit?(rev?-1:1)*DY_VOC:0;txt=fmt(v,1);unit='V DC';note=v<0?'ค่าติดลบ: ขั้วกลับ ต้องแก้ก่อนเสียบเข้าไมโคร':v===0?'ไม่มีแสง':'อยู่ในช่วงที่ไมโครรับได้ (สูงสุด 60 V)'}
  else switch(n){
    case'gLN':txt='230.0';unit='V AC';note='ไฟกริดที่ด้านเข้าเบรกเกอร์เมน';break;
    case'gLPE':txt=F.has('m_ln')?'0.4':'230.0';unit='V AC';note=F.has('m_ln')?'L–PE ≈ 0 แต่ N–PE ≈ 230 V: สาย L กับ N สลับ':'';break;
    case'gNPE':txt=F.has('m_ln')?'230.0':'0.4';unit='V AC';note=F.has('m_ln')?'N–PE ≈ 230 V: สาย L กับ N สลับ':'';break;
    case'brLN':{const on=DM.sw.branch&&DM.sw.main;txt=on?'230.0':'0.0';unit='V AC';note=on?'มีไฟที่สายย่อย':'เบรกเกอร์สายย่อยหรือเบรกเกอร์เมนยังปิดอยู่';break}
    case'pe':txt=E.pe==='yes'?'0.4':'OL';unit='Ω';note=E.pe==='yes'?'ต่อเนื่องดี':'ไม่ต่อเนื่อง: โครงแผงยังไม่ได้ต่อสายดิน';break;
    case'endLook':txt=E.end==='jbox'?'เข้า J-box':E.end==='cap'?'ปิดฝา':'เปิดโล่ง';unit='';note=E.end==='open'?'ปลายสายย่อยเปิดโล่ง ขั้วที่ไม่ได้ใช้ต้องปิดกันน้ำและเข้ากล่องต่อสาย':'';break;
    case'brkLook':txt=E.brk?E.brk+' A':'—';unit='';note=E.brk&&E.brk<DM_MI.ia*DM_MI.micros?`กระแสสายย่อยเต็มกำลัง ${(DM_MI.ia*DM_MI.micros).toFixed(1)} A มากกว่าเบรกเกอร์`:'';break;
  }
  DM.mlast={n,txt,unit,note};DM.log.push({k:'meas',n,on:DM.sw.branch||DM.sw.main});
  if(DM.log.length>400)DM.log=DM.log.slice(-400);
}
function dmSw(k){
  DM.sw[k]=!DM.sw[k];DM.log.push({k:'sw',n:k,v:DM.sw[k]});
  if(!(DM.sw.branch&&DM.sw.main))DM.waited=false;
}
function dmWait(){if(DM.sw.branch&&DM.sw.main)DM.waited=true}
function dmOff(i){DM.moff.push(+i);if(DM.moff.length>8)DM.moff=DM.moff.slice(-8)}
function dmProc(){
  const bad=[],st={dc:new Set(),ac:new Set(),swOk:false,order:true,onAt:-1};
  let b=false,m=false;
  DM.log.forEach((e,i)=>{
    if(e.k==='meas'&&!e.on){if(e.n.startsWith('dc:'))st.dc.add(e.n);if(['gLN','gLPE','gNPE'].includes(e.n))st.ac.add(e.n)}
    if(e.k==='sw'){if(e.n==='branch')b=e.v;if(e.n==='main'){if(e.v&&!b&&!m)bad.push('เปิดเบรกเกอร์เมนก่อนเบรกเกอร์สายย่อย (คู่มือ: เปิดเบรกเกอร์ AC สายย่อยก่อน แล้วจึงเปิดเบรกเกอร์เมน)');m=e.v}if(b&&m&&st.onAt<0)st.onAt=i}
  });
  const sw=DM.sw,run=dmNow().ms,okLed=run.every(x=>x.led==='blues'||x.led==='bluef');
  const offOk=DM.moff.length===DM_OFF.length&&DM.moff.every((v,i)=>v===i);
  const offBad=DM.moff.length&&DM.moff.some((v,i)=>v!==i);
  if(offBad)bad.push('ลำดับปิด/เปลี่ยนตัวผิด (ต้อง ปิด AC สายย่อย → ถอดขั้ว AC → คลุมแผง → ถอดขั้ว DC)');
  const steps=[['pre','ตรวจความพร้อมก่อนเริ่มครบ '+DM_PRE.length+' ข้อ',DM.pre.length===DM_PRE.length],
    ['dc','วัดแรงดันและขั้วแผงครบทั้ง 12 ช่อง ก่อนเปิดเบรกเกอร์',st.dc.size===DM_MI.micros*DM_MI.inputs],
    ['ac','วัดไฟกริด L–N, L–PE, N–PE ที่เบรกเกอร์เมนก่อนเปิดระบบ',st.ac.size===3],
    ['on','เปิดเบรกเกอร์ AC สายย่อย แล้วจึงเปิดเบรกเกอร์เมน',sw.branch&&sw.main&&!bad.some(x=>x.startsWith('เปิดเบรกเกอร์เมนก่อน'))],
    ['wait','รอประมาณ 1 นาที (กดปุ่ม "รอ 1 นาที")',DM.waited],
    ['led','ไฟ LED ไมโครทุกตัวกะพริบน้ำเงิน (ผลิตไฟปกติ) ตอนกลางวัน',sw.branch&&sw.main&&DM.waited&&okLed],
    ['wifi','ตั้งค่า WiFi ให้ไมโครส่งข้อมูลขึ้นระบบครบ 3 ข้อ',DM.wifi.length===DM_WIFI.length],
    ['off','ฝึกลำดับปิด/เปลี่ยนตัวไมโครครบ 4 ขั้นตามลำดับ',offOk]];
  return{steps,bad:[...new Set(bad)]};
}
function dmChecks(){
  const out={job:[],pwr:[],dash:[]},S=DM.set,J=(ok,t,lvl)=>out.job.push([ok,t,lvl]);
  const n=+S.n,brk=+S.brk,ia=DM_MI.ia;
  J(n===3,n>DM_MI.lim?`ไมโคร ${n} ตัวต่อสายย่อย เกิน ${DM_MI.lim} ตัวที่ผู้ผลิตกำหนด (เบรกเกอร์ ${DM_MI.brkMan} A)`:n&&n<3?`แผง 12 แผง ÷ 4 แผงต่อตัว ต้องใช้ไมโคร 3 ตัว (ตอนนี้ ${n})`:'จำนวนไมโคร 3 ตัว (12 แผง ÷ 4 แผงต่อตัว) และไม่เกิน '+DM_MI.lim+' ตัวต่อสายย่อย',n&&n!==3?'err':undefined);
  J(brk===DM_MI.brkMan,brk&&brk<33?`เบรกเกอร์ ${brk} A ต่ำกว่ากระแสสายย่อย ${(3*ia).toFixed(1)} A × 1.25 จะทริปตอนแดดจัด`:brk>DM_MI.brkMan?`เบรกเกอร์ ${brk} A เกิน ${DM_MI.brkMan} A ที่คู่มือกำหนดสำหรับสายย่อย`:`เบรกเกอร์สายย่อย ${DM_MI.brkMan} A ตามคู่มือ (กระแส 3 × ${ia} A = ${(3*ia).toFixed(1)} A)`,brk&&brk!==DM_MI.brkMan?'err':undefined);
  J(S.end==='jbox','ปลายสายย่อยเข้า junction box แล้วเดินสายเข้าตู้ (ขั้วที่ไม่ใช้ปิดกันน้ำ)',S.end&&S.end!=='jbox'?'err':undefined);
  J(S.dcl==='2','สาย DC จากแผงถึงไมโครยาวไม่เกิน 3 m (ใช้ 2 m)',S.dcl==='5'?'err':undefined);
  J(S.pe==='yes','ต่อสายดิน PE ถึงไมโครทุกตัวและโครงแผง');
  J(S.rcd==='30','มี RCBO 30 mA ที่วงจรโซลาร์');
  J(S.spd==='yes','ติดตั้ง SPD Type II ในตู้ (คู่มือแนะนำ)');
  const pr=dmProc();pr.steps.forEach(s=>out.pwr.push([s[2],s[1]]));pr.bad.forEach(t=>out.pwr.push([false,t,'err']));
  const d=dmDay(),T=d.T,E=dmEff(),Dd=(ok,t)=>out.dash.push([ok,t]);
  const leds=Object.values(T.led);
  Dd(leds.length===DM_MI.micros&&leds.every(l=>l==='blues'||l==='bluef'),'ไมโครทุกตัวผลิตไฟและไฟ LED ปกติช่วง 08:00–16:00'+(leds.some(l=>l==='red3'||l==='red4')?' (พบ LED แดง: '+(leds.includes('red4')?'GFDI':'กริดผิดปกติ')+')':''));
  Dd(!T.trip,'เบรกเกอร์สายย่อยไม่ทริปตอนแดดจัด'+(T.trip?` (เบรกเกอร์จริง ${E.brk} A)`:''));
  Dd(d.ideal>0&&T.kwh>=0.9*d.ideal,`ผลผลิตทั้งวัน ${dyF(T.kwh,1)} kWh ไม่ต่ำกว่า 90% ของค่าคาดหมาย ${dyF(d.ideal,1)} kWh`);
  Dd(E.pe==='yes'&&E.end!=='open','สายย่อยปลอดภัย: ต่อ PE ครบ ปลายสายย่อยปิด/เข้า J-box');
  return out;
}
function dmDrill(list){
  const cand=Object.keys(DM_FAULTS);let f=list&&list.length?list.filter(k=>cand.includes(k)):[];
  if(!f.length){const pool=cand.slice();while(f.length<2&&pool.length)f.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0])}
  DY.faults=f;DY.pick=[];DY.tries=0;DY.reveal=false;DY._fres=null;DM.set=Object.assign(DM_DEFSET(),DM_CORRECT);dmReset();
}
/* ---- render ---- */
function dmPage(pg,s){return pg==='job'?dmPgJob(s):pg==='power'?dmPgPower(s):pg==='dash'?dmPgDash(s):dyPgFault()}
function dmPgJob(s){
  const S=DM.set;
  return `<div class="cards"><div class="card"><h3>ใบสั่งงาน: ${esc(dySc().n)}</h3><p class="sltxt">${esc(dySc().brief)}</p>
    <table class="t"><tbody><tr><th>ไมโครอินเวอร์เตอร์</th><td>${DM_MI.model} · ${DM_MI.w} W · ${DM_MI.ia} A ที่ 230 V</td></tr><tr><th>อินพุต DC</th><td>4 ช่อง ช่องละ 1 แผง · สูงสุด 60 V · เริ่มทำงาน 20 V</td></tr><tr><th>แผง</th><td>${DY_WP} W · Voc ${DY_VOC} V (ตัวอย่าง) × 12 แผง</td></tr><tr><th>ต่อพ่วงสูงสุด</th><td>${DM_MI.lim} ตัวต่อสายย่อย (เบรกเกอร์ ${DM_MI.brkMan} A)</td></tr><tr><th>พื้นที่</th><td>${dySc().area}</td></tr></tbody></table></div>
   <div class="card"><h3>เลือกการติดตั้ง</h3><div class="slports">${DM_SEL.map(([k,l,opts])=>`<label class="slport"><span>${esc(l)}</span><select data-dymp="${k}" id="dymp-${k}">${opts.map(([v,t])=>`<option value="${v}" ${S[k]===v?'selected':''}>${esc(t)}</option>`).join('')}</select></label>`).join('')}</div>
   <p class="hint tight">ไมโครติดใต้แผง จ่ายไฟ AC เข้าสายย่อยร่วมกัน ไม่มีสาย DC ยาวและไม่ต่อแบต เลือกค่าให้ถูกต้องตามคู่มือ Deye SUN-M G4 แล้วดูผลตรวจทางขวา</p></div></div>
   <div class="cards"><div class="card"><h3>ผังระบบ</h3>${dmSLD()}</div><div class="card"><h3>ตรวจการติดตั้ง</h3>${dyList(s.c.job)}</div></div>`;
}
function dmSLD(){
  const S=DM.set,W=640,H=250;let g='';
  for(let m=0;m<3;m++){const x=20+m*160;
    for(let i=0;i<4;i++)g+=`<rect x="${x+i*34}" y="20" width="30" height="40" rx="2" class="slnode"/>`;
    g+=`<rect x="${x}" y="80" width="134" height="28" rx="5" class="slinv"/><text x="${x+67}" y="99" class="svgt b" text-anchor="middle" font-size="12">ไมโคร ${m+1}</text>`;
    g+=`<path d="M${x+67} 108 V140" class="slline ac"/>`}
  g+=`<path d="M87 140 H${S.end==='open'?300:520}" class="slline ${S.end==='open'?'bad':'ac'}"/>`;
  g+=`<text x="20" y="160" class="svgt mut" font-size="11">สาย AC ต่อพ่วง (trunk) ${S.end?(S.end==='jbox'?'→ J-box':S.end==='cap'?'ปิดฝา':'ปลายเปิด'):''}</text>`;
  g+=`<g><rect x="520" y="120" width="50" height="40" rx="4" class="slnode"/><text x="545" y="145" class="svgt b" text-anchor="middle" font-size="12">${S.brk?S.brk+' A':'—'}</text><text x="545" y="175" class="svgt mut" text-anchor="middle" font-size="11">เบรกเกอร์</text></g>`;
  g+=`<path d="M570 140 H610" class="slline ac"/><text x="610" y="130" class="svgt mut" font-size="11">${S.rcd==='30'?'RCBO':'—'}</text><text x="600" y="200" class="svgt mut" font-size="11">กริด ⚡</text>`;
  g+=`<text x="20" y="225" class="svgt mut" font-size="11">PE ${S.pe==='yes'?'ต่อครบ':'ยังไม่ต่อ'} · SPD ${S.spd==='yes'?'มี':'ไม่มี'} · สาย DC ${S.dcl?S.dcl+' m':'—'}</text>`;
  return `<div class="tblwrap"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="ผังไมโครอินเวอร์เตอร์">${g}</svg></div>`;
}
function dmPgPower(s){
  const sw=DM.sw,m=DM.mlast,swb=(k,t)=>`<button class="slsw ${sw[k]?'on':''}" data-dymsw="${k}" aria-pressed="${sw[k]}"><span class="sllever"></span><span>${t}</span><b>${sw[k]?'ON':'OFF'}</b></button>`;
  return `<div class="cards"><div class="card"><h3>ตรวจก่อนเริ่ม</h3><div class="slpre">${DM_PRE.map((t,i)=>`<label><input type="checkbox" data-dymchk="${i}" id="dymchk-${i}" ${DM.pre.includes(i)?'checked':''}> ${esc(t)}</label>`).join('')}</div></div>
   <div class="card"><h3>เบรกเกอร์และไฟ LED</h3><div class="slsws">${swb('branch','เบรกเกอร์ AC สายย่อย')}${swb('main','เบรกเกอร์เมนของบ้าน')}</div>
   <div class="actions"><button class="btn sm" data-dyact="wait">รอ 1 นาที</button></div>
   <div id="dmleds" class="dmleds"></div>
   <label class="sltime">เวลาหน้างาน <input type="range" min="300" max="1200" step="15" value="${DY.dash.t}" data-dytime id="dytime-p"><b id="dytimep">${dyHM(DY.dash.t)}</b></label></div>
   <div class="card"><h3>มัลติมิเตอร์</h3><div class="slmeter"><select id="dympt" aria-label="จุดวัด">${DM_MPT().map(([k,t])=>`<option value="${k}" ${m&&m.n===k?'selected':''}>${esc(t)}</option>`).join('')}</select><button class="btn pri" data-dyact="meas">วัด</button></div>
   <div class="sldmm"><span class="sldmmv">${m?esc(m.txt):'— —'}</span><span class="sldmmu">${m?esc(m.unit):''}</span></div><p class="hint tight" id="dymnote">${m&&m.note?esc(m.note):'เลือกจุดวัดแล้วกด "วัด" ผลจะถูกบันทึกเป็นขั้นตอน'}</p></div></div>
   <div class="cards"><div class="card"><h3>ขั้นตอนเปิดระบบ</h3>${dyList(s.c.pwr)}<div class="actions"><button class="btn sm" data-dyact="resetpwr">เริ่มใหม่ (ปิดเบรกเกอร์ ล้างบันทึก)</button></div></div>
   <div class="card"><h3>ตั้งค่า WiFi</h3><div class="slpre">${DM_WIFI.map((t,i)=>`<label><input type="checkbox" data-dymwifi="${i}" id="dymwifi-${i}" ${DM.wifi.includes(i)?'checked':''}> ${esc(t)}</label>`).join('')}</div>
   <h3>ฝึกลำดับปิด / เปลี่ยนตัวไมโคร</h3><p class="sltxt">กดตามลำดับที่ถูกต้อง: ${DM.moff.length?DM.moff.map(i=>`<b>${i+1}</b>`).join(' → '):'ยังไม่ได้เริ่ม'} ${DM.moff.length===DM_OFF.length?(DM.moff.every((v,i)=>v===i)?'<span class="pill ok">ถูกลำดับ</span>':'<span class="pill err">ผิดลำดับ</span>'):''}</p>
   <div class="slsws">${DM_OFF.map((t,i)=>`<button class="btn sm" data-dymoff="${i}" id="dymoff-${i}">${i+1}. ${esc(t)}</button>`).join('')}</div><div class="actions"><button class="btn sm" data-dyact="resetoff">ล้างลำดับ</button></div>
   <p class="hint tight">ห้ามถอด DC ขณะมีกระแส · ห้ามเสียบ DC ขณะถอดขั้ว AC ออก (คู่มือ Deye SUN-M G4)</p></div></div>`;
}
function dmPgDash(s){
  const D=DY.dash,d=dmDay(),T=d.T;
  return `<div class="card"><div class="bar"><div class="grp"><span class="lab">เวลา</span><b id="dydt">${dyHM(D.t)}</b><input type="range" min="0" max="1435" step="5" value="${D.t}" data-dytime id="dytime-d" aria-label="เวลา"><button class="btn sm" data-dyact="play">${dyPlayT?'หยุด':'เล่น'}</button></div>
    <div class="grp">${dyChk('dash.out',D.out,'ไฟดับ')}${dyNum('dash.o0',D.o0,0,23,1,'–')}${dyNum('dash.o1',D.o1,1,24,1,'น.')}<span class="lab">เมฆ</span>${dyNum('dash.cloud',D.cloud,0,90,10,'%')}</div></div>
    <div id="dmleds" class="dmleds"></div></div>
   <div class="cards"><div class="card"><h3>กำลังผลิตทั้งวัน</h3><div class="tblwrap" id="dychart">${dmChart()}</div>
    <table class="t"><tbody><tr><th>ผลผลิตทั้งวัน</th><td>${dyF(T.kwh,1)} kWh</td><th>ค่าคาดหมาย (ไม่มีข้อผิดพลาด)</th><td>${dyF(d.ideal,1)} kWh</td></tr></tbody></table></div>
   <div class="card"><h3>ผลทดสอบการทำงาน</h3>${dyList(s.c.dash)}<p class="hint tight">ไมโครหยุดจ่ายไฟเมื่อกริดดับ (ป้องกันการจ่ายไฟย้อนขณะไฟดับ) จึงไม่มีไฟสำรองเหมือนระบบไฮบริด ค่าผลผลิตเป็นค่าประมาณเพื่อการเรียนรู้</p></div></div>`;
}
function dmChart(){
  const rows=dmDay().rows,W=640,H=200,L=40,R=16,B=22,Tp=10,mx=Math.max(3000,...rows.map(r=>r.tot)),x=i=>L+(W-L-R)*i/287,y=v=>Tp+(H-Tp-B)*(1-v/mx);
  const path=rows.map((r,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+y(r.tot).toFixed(1)).join(' ');
  let out=rows.map((r,i)=>r.out?`<rect x="${x(i)}" y="${Tp}" width="${(W-L-R)/287+.5}" height="${H-Tp-B}" class="slout"/>`:'').join('');
  [0,mx/2,mx].forEach(v=>out+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" class="slgrid"/><text x="${L-4}" y="${y(v)+4}" class="svgt m mut" text-anchor="end" font-size="10">${dyF(v/1000,1)}k</text>`);
  [0,6,12,18,24].forEach(h=>out+=`<text x="${x(Math.min(287,h*12))}" y="${H-6}" class="svgt m mut" text-anchor="middle" font-size="10">${h}:00</text>`);
  out+=`<path d="${path}" class="slc pv"/><line x1="${x(DY.dash.t/5)}" x2="${x(DY.dash.t/5)}" y1="${Tp}" y2="${H-B}" class="slnow" id="dynowln"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="กราฟกำลังผลิตทั้งวัน">${out}</svg><div class="slleg"><span class="pv">กำลัง AC รวม</span><span class="ot">ช่วงไฟดับ</span></div>`;
}
function dmLive(){
  const r=dmNow(),box=document.querySelectorAll('#dmleds');
  const col={off:'#8a94a1',red1:'#d23b2f',red3:'#d23b2f',red4:'#d23b2f',redf:'#d23b2f',blues:'#2a6fdb',bluef:'#2a6fdb'};
  box.forEach(e=>e.innerHTML=r.ms.map(x=>`<span class="slled"><i style="background:${col[x.led]};${x.led==='off'?'':'box-shadow:0 0 6px '+col[x.led]}"></i><b>ไมโคร ${x.m}</b> ${esc(x.txt)} · ${dyF(x.p)} W</span>`).join('')+(r.trip?'<span class="pill err">เบรกเกอร์สายย่อยทริป</span>':''));
  const n=document.getElementById('dynowln');if(n){const W=640,L=40,R=16,x=L+(W-L-R)*(DY.dash.t/5)/287;n.setAttribute('x1',x);n.setAttribute('x2',x)}
}
function dmSnapshot(){const o=JSON.parse(JSON.stringify(DM));delete o._day;return o}
function dmRestore(o){
  if(!o||typeof o!=='object')return;
  if(o.set&&typeof o.set==='object'){const d=DM_DEFSET();DM_SEL.forEach(([k,,opts])=>{if(opts.some(x=>x[0]===o.set[k]))d[k]=o.set[k]});DM.set=d}
  if(Array.isArray(o.pre))DM.pre=o.pre.filter(i=>Number.isInteger(i)&&i>=0&&i<DM_PRE.length);
  if(Array.isArray(o.wifi))DM.wifi=o.wifi.filter(i=>Number.isInteger(i)&&i>=0&&i<DM_WIFI.length);
  if(o.sw&&typeof o.sw==='object')['branch','main'].forEach(k=>DM.sw[k]=!!o.sw[k]);
  if(Array.isArray(o.log))DM.log=o.log.filter(e=>e&&typeof e.k==='string').slice(-400);
  DM.waited=!!o.waited;if(Array.isArray(o.moff))DM.moff=o.moff.filter(i=>Number.isInteger(i)&&i>=0&&i<DM_OFF.length).slice(-8);
  DM._day=null;
}
