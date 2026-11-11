/* ---- เมนู 19 AC Coupling: อินเวอร์เตอร์ออนกริด (Huawei SUN2000 หรือไมโคร Deye) ต่อเข้า Deye / Solis Hybrid (พอร์ต GEN หรือ Deye ช่อง LOAD) ----
   ฝึกต่อสาย (พอร์ต GEN, CT), ตั้งค่าจอเครื่อง Hybrid ตามคู่มือ (Deye: System Setup › Gen Port Use › Micro Inv Input / Solis: SYSTEM SETTING › SMART PORT › AC couple input) และอินเวอร์เตอร์ AC (กันย้อน เปิด/ปิด, Freq-Watt)
   ชื่อรายการและคำอธิบายบนจอเครื่องตามคู่มือ Deye SM2 (2026-01) และ Solis V1.3 ส่วนกำลัง แผง โหลด และพฤติกรรมควบคุมเป็นแบบจำลอง ตรวจกับเครื่องและคู่มือฉบับล่าสุดทุกครั้ง */
const CP_HOST={
  deye:{n:'Deye SUN-6K-SG04LP1-EU-SM2',kwp:3.9,cap:10.24,cmax:5,gen:'Gen Port Use',menu:'System Setup › Gen Port Use',
    ctOk:'ชี้เข้าหาเครื่อง Hybrid',ctBad:'ชี้ไปทางกริด',ctNote:'ตรวจทิศลูกศร CT กับคู่มือเครื่องจริงทุกครั้ง'},
  solis:{n:'Solis S6-EH1P6K-L-PLUS',kwp:3.9,cap:14.3,cmax:5,gen:'Smart Port',menu:'SYSTEM SETTING › SMART PORT',
    ctOk:'ชี้ไปทางการไฟฟ้า',ctBad:'ชี้เข้าบ้าน',ctNote:'ตามคู่มือ Solis ข้อ 3 (ทิศลูกศร CT)'}
};
const CP_SRC={
  hw:{n:'Huawei SUN2000-5KTL-L1',w:5,kwp:5.2,fa:50.2,fb:51.5,adj:true,meter:'Smart Power Sensor (DTSU666-H) ที่จุดต่อกริด',anti:'Active power control › Export limitation (Zero export)'},
  dm:{n:'ไมโคร Deye SUN-M200G4-EU-Q0 (2 kW, แผง 4 แผง)',w:2,kwp:2.6,fa:50.2,fb:51.5,adj:false,meter:'CT ของเครื่อง Hybrid ที่จุดต่อกริด',anti:'Zero export (กันย้อน) ผ่านแอป/CT ของ Hybrid'}
};
const CP_SC={
  hw_deye:{n:'Huawei → GEN ของ Deye (ห้ามขาย)',host:'deye',src:'hw',policy:'noexp',
    brief:'บ้านมี Huawei SUN2000-5KTL-L1 ออนกริดอยู่แล้ว เพิ่ม Deye Hybrid + แบต 10.24 kWh ให้ Huawei ผลิตไฟตอนไฟดับได้ (ต่อที่พอร์ต GEN) การไฟฟ้า **ไม่อนุญาตให้ขายไฟ** ต้องกันย้อนทั้งระบบ'},
  dm_deye:{n:'ไมโคร Deye → GEN ของ Deye (ขายได้)',host:'deye',src:'dm',policy:'sell',
    brief:'เพิ่มไมโครอินเวอร์เตอร์ Deye SUN-M200G4 4 แผงเข้าที่พอร์ต GEN ของ Deye Hybrid ได้รับอนุญาตให้ขายไฟคืน ไม่เกิน 5 kW'},
  hw_solis:{n:'Huawei → GEN ของ Solis (ขายได้)',host:'solis',src:'hw',policy:'sell',
    brief:'บ้านมี Huawei SUN2000-5KTL-L1 อยู่แล้ว เพิ่ม Solis S6-EH1P6K Hybrid + แบต Dyness 14.3 kWh ต่อ Huawei เข้าพอร์ต GEN (Smart Port) ได้รับอนุญาตให้ขายไฟ'},
  dm_solis:{n:'ไมโคร Deye → GEN ของ Solis (ห้ามขาย)',host:'solis',src:'dm',policy:'noexp',
    brief:'ต่อไมโคร Deye SUN-M200G4 เข้าพอร์ต GEN ของ Solis Hybrid พื้นที่นี้ **ห้ามขายไฟ** ต้องตั้งกันย้อนและ CT ให้ถูกต้อง'},
  hw_deye_load:{n:'Huawei → ช่อง Backup (LOAD) ของ Deye (ห้ามขาย)',host:'deye',src:'hw',policy:'noexp',load:true,
    brief:'บ้านมี Huawei SUN2000-5KTL-L1 ออนกริดอยู่แล้ว เพิ่ม Deye Hybrid ให้ Huawei ต่อที่ **ช่อง Backup (LOAD) ของ Deye** แทนพอร์ต GEN ติด CT ที่สายไฟกริด และ**เปิดกันย้อน**ที่จอของ Huawei (Settings › Power adjustment) การไฟฟ้า **ไม่อนุญาตให้ขายไฟ**'}
};
const CP_FAULTS={
  src_gridport:{n:'อินเวอร์เตอร์ AC ถูกต่อที่ตู้เมน ไม่ใช่พอร์ตของ Hybrid (ไฟดับแล้วไม่ทำงาน)',f:S=>{S.ports.src='main'}},
  ct_loc:{n:'CT ถูกคล้องที่สายอินเวอร์เตอร์ AC แทนสายกริด',f:S=>{S.ports.ct='src'}},
  ct_rev:{n:'CT ติดกลับทิศ',f:S=>{S.ports.arrow='rev'}},
  gen_use:{n:'ไม่ได้ตั้งพอร์ต GEN เป็น AC couple (Micro Inv Input / AC couple input)',f:S=>{if(CP_SC[S.sc].host==='deye')S.hs.gen.use='gen';else S.hs.sp.use='none'},ok:S=>!CP_SC[S.sc].load},
  hz_low:{n:'AC Couple Fre High ตั้งต่ำกว่าความถี่ที่อินเวอร์เตอร์ AC ตัดออก (51.5 Hz)',f:S=>{S.hs.gen.mi.hz=51},ok:S=>CP_SC[S.sc].host==='deye'&&!CP_SC[S.sc].load},
  ct_hw_pos:{n:'CT ของ Huawei ถูกคล้องที่สายไฟกริด ทั้งที่ Huawei ต่อฝั่ง LOAD (ต้องคล้องสายโหลด)',f:S=>{S.cu.at='grid'},ok:S=>!!CP_SC[S.sc].load},
  no_ct:{n:'ไม่ได้ติดตั้ง CT แต่เปิดกันย้อนไว้',f:S=>{S.ports.ct='none';S.set.src.anti=true},ok:S=>CP_SC[S.sc].policy==='noexp'},
  pf_off:{n:'ปิด Freq-Watt / P(f) ที่ Huawei (Solis ใช้ Freq-Watt ปรับกำลัง)',f:S=>{S.set.src.pf=false},ok:S=>CP_SC[S.sc].host==='solis'&&CP_SC[S.sc].src==='hw'}
};
const CP_SRC_OPTS=[['none','ยังไม่ต่อ'],['gen','พอร์ต GEN ของเครื่อง Hybrid'],['main','ตู้เมนฝั่งกริด'],['grid','พอร์ต GRID ของเครื่อง Hybrid (ขนานกับกริด)'],['load','พอร์ต LOAD / Backup ของเครื่อง Hybrid'],['bload','แผงโหลดบ้าน (Backup) ฝั่งโหลดของ Hybrid']];
const CP_CT_OPTS=[['none','ไม่ติด CT'],['grid','สายไฟกริด (L) ที่จุดต่อกริด'],['src','สายออกของอินเวอร์เตอร์ AC'],['load','สายไปโหลดบ้าน']];
const CP_OUT=[['none','ไม่ดับ'],['mid','ไฟดับ 10:00–15:00'],['eve','ไฟดับ 18:00–22:00']];
const CP_DEFSET=()=>({src:{pf:true,anti:false}});
const CP_FTRIP=51.5; /* ความถี่ที่อินเวอร์เตอร์ AC ตัดออก (คู่มือ Deye ตารางป้องกัน 81>.S1 = 51.5 Hz) */
const CP_CU0=()=>({at:'none',arrow:'ok',lh:'none',la:'none'});
const CP={sc:'hw_deye',page:'job',sm:{scr:'home'},ports:{src:'none',ct:'none',arrow:'ok'},cu:CP_CU0(),set:CP_DEFSET(),hs:hlDef('deye'),lcd:{scr:'home',stack:[]},dash:{t:24,out:'none',cloud:0,load:100,soc0:50},done:{},drill:null,diagOk:0,_c:null};
const cpF=(v,d=0)=>(+v).toLocaleString('th-TH',{minimumFractionDigits:d,maximumFractionDigits:d});
const cpHM=i=>String(Math.floor(i/2)).padStart(2,'0')+':'+(i%2?'30':'00');
const cpSc=()=>CP_SC[CP.sc],cpHost=()=>CP_HOST[cpSc().host],cpSrc=()=>CP_SRC[cpSc().src];
const cpLoad=h=>{let w=.35;if(h>=6&&h<8)w+=.8;if(h>=10&&h<16)w+=.5;if(h>=18&&h<22)w+=1.8;return w};
function cpReset(S){S.sm={scr:'home'};S.cu=CP_CU0();S.ports={src:'none',ct:'none',arrow:'ok'};S.set=CP_DEFSET();S.hs=hlDef(CP_SC[S.sc].host);S.lcd={scr:'home',stack:[]}}
function cpCorrect(S){const sc=CP_SC[S.sc],d=sc.host==='deye';cpReset(S);S.ports={src:sc.load?'load':'gen',ct:'grid',arrow:'ok'};if(sc.load){S.cu.at='load';S.cu.arrow='ok'}
  if(d){if(!sc.load)S.hs.gen.use='micro';if(sc.policy==='noexp'){S.hs.work.mode='zeroCT';S.hs.work.solarSell=false}else{S.hs.work.mode='sell';S.hs.work.maxSell=5000}}
  else{S.hs.sp.use='ac';S.hs.st.mode='self';if(sc.policy==='noexp')S.hs.st.allowExp=false;else{S.hs.st.allowExp=true;S.hs.st.maxExp=5000}}
  S.set.src.anti=sc.policy==='noexp';return S}
/* ---- สถานะต่อสาย/ตั้งค่า → ธงที่ใช้คำนวณ ---- */
function cpFlags(S){
  S=S||CP;const sc=CP_SC[S.sc],src=CP_SRC[sc.src],H=hlMap(sc.host,S.hs),s=S.set.src,p=S.ports;
  const ctS=p.ct==='grid'?(p.arrow==='ok'?'ok':'rev'):p.ct==='none'?'none':'wrong';
  const eff=p.src==='bload'?'load':p.src,gen=(eff==='gen'&&H.genUse==='ac')||(sc.host==='deye'&&eff==='load');
  if(sc.load)H.mi={on:95,off:100,hz:52,fixed:true};
  const pe=Object.assign({},p,{src:eff}),cu=S.cu||CP_CU0(),ls=eff==='load'&&sc.host==='deye'&&sc.src==='hw',am=ls?(cu.at==='load'?(cu.arrow==='ok'?'ok':'rev'):cu.at==='none'?'none':'wrong'):null;
  return{sc,src,H,s,p:pe,ctS,am,ls,gen,viaGrid:p.src==='main'||p.src==='grid',pf:src.adj?s.pf:true};
}
/* ผลเสีย/ข้อควรระวังของการต่ออินเวอร์เตอร์ออนกริดที่ฝั่ง LOAD (Backup) ของ Deye — ตัวเลขมาจากแบบจำลอง (โหลด 60%) ไม่ใช่ค่าจากคู่มือ */
function cpLoadRisks(S,opt){
  S=S||CP;const F=cpFlags(S),r=[];if(F.p.src!=='load'||F.sc.host!=='deye')return r;
  const N=cpRun({cloud:0,out:'none',soc0:50,load:60},S),B=cpRun({cloud:0,out:'mid',soc0:90,load:60},S),hw=F.sc.src==='hw';
  r.push({c:'LOAD-DISPLAY',d:'จอ Hybrid แสดงกำลังโหลดไม่ถูกต้อง (คู่มือ Deye ข้อ 5.11 AC couple on load side) เพราะไฟของอินเวอร์เตอร์ออนกริดเข้ามาที่ฝั่งโหลดของเครื่อง',sev:'warn'});
  r.push({c:'SURPLUS',d:'ไฟส่วนที่เกินโหลด Backup และเกินที่แบตรับได้ ไปจ่ายโหลดฝั่งกริดตรง ๆ ไม่ได้ ต้องลดกำลังหรือไหลย้อนผ่าน Hybrid ออกกริด (แบบจำลองวันตัวอย่างโหลด 60%: ตัดทิ้ง '+cpF(N.T.cutA,1)+' kWh, ส่งออกกริดโดยไม่ตั้งใจ '+cpF(N.T.expBad,1)+' kWh)',sev:N.T.expBad>.05?'stop':'warn'});
  r.push({c:'DOUBLE-CONVERSION',d:'ไฟที่ชาร์จแบตต้องผ่านการแปลง AC→DC อีกรอบ สูญเสียมากกว่าแผงของ Hybrid ที่ชาร์จตรง (วันตัวอย่างชาร์จแบต '+cpF(N.T.chg,1)+' kWh)',sev:'warn'});
  if(F.sc.policy==='noexp'&&F.s.anti)r.push({c:'TWO-CONTROLLERS',d:(hw?'Huawei zero export (อ่านมิเตอร์ที่กริด)':'อินเวอร์เตอร์ออนกริดที่เปิดกันย้อน')+' กับ Hybrid Zero Export To CT ควบคุมกำลังพร้อมกัน กำลังอาจแกว่งหรือตอบสนองช้า และถ้ามิเตอร์ไม่เห็นกระแสกริดจะลดกำลังเป็น 0',sev:'warn'});
  r.push({c:'OUTAGE-CURTAIL',d:'ไฟกริดดับแล้วแบตเต็ม คู่มือ Deye ไม่ได้บอกวิธีให้ Hybrid ลดกำลังอินเวอร์เตอร์ที่ฝั่ง LOAD (ค่า AC Couple Fre High อยู่ในเมนู Gen Port Use ของพอร์ต GEN) แบบจำลองสมมติว่าเลื่อนความถี่ได้เหมือน GEN (ไฟดับกลางวัน แบต 90% ตัดไม่ทัน '+B.T.trips+' ช่วง) ต้องทดสอบกับเครื่องจริง ถ้าลดกำลังไม่ได้เสี่ยง Battery OV และโหลด Backup ดับ',sev:B.T.trips>0?'stop':'warn'});
  if(hw&&F.s.anti&&F.am==='ok')r.push({c:'HW-LIMIT',d:'Huawei zero export โดย CT อยู่ที่สายโหลด: กำลังออนกริดถูกจำกัดไม่เกินโหลด Backup จึงไม่ไหลย้อนเข้าพอร์ต LOAD ของ Hybrid (แบบจำลองวันตัวอย่าง ตัดทิ้ง '+cpF(N.T.cutA,1)+' kWh) แลกกับใช้พลังงานแผงฝั่ง Huawei ได้น้อยลง และ Huawei ไม่ช่วยจ่ายโหลดฝั่งกริด (ค่าสมมติของแบบจำลอง ไม่ใช่ค่าจากคู่มือ)',sev:'warn'});
  if(hw&&F.s.anti&&F.am&&F.am!=='ok'&&(opt&&opt.custom||F.sc.load))r.push({c:'HW-METER',d:F.am==='rev'?'CT ของ Huawei อยู่ที่สายโหลดแต่ลูกศรกลับทิศ Huawei จึงอ่านค่าผิดและลดกำลังเป็น 0':'Huawei เปิด zero export แต่ CT/มิเตอร์ของ Huawei (ฟ้า) '+(F.am==='none'?'ยังไม่ได้ติด':'คล้องผิดสาย')+' เมื่อต่อฝั่ง LOAD ต้องคล้องที่สายโหลด (สายจากพอร์ต LOAD) เพราะ CT ที่สายไฟกริดมองไม่เห็นไฟที่ไหลย้อนเข้าพอร์ต LOAD ตอนนี้ Huawei จึงลดกำลังเป็น 0',sev:'stop'});
  return r;
}
function cpAlarms(S){
  S=S||CP;const F=cpFlags(S),a=[],hn=CP_SC[S.sc].host==='deye';
  if(F.p.src==='load'&&hn){if(!F.sc.load)a.push({c:'ใบงานนี้ให้ต่อที่ GEN',d:'ฝึกต่อฝั่ง LOAD ได้ที่ระบบ Huawei → ช่อง Backup (LOAD) หรือหน้า 6 ข้อความข้างล่างคือผลเสียของการต่อฝั่ง LOAD',sev:'warn'});cpLoadRisks(S).forEach(x=>a.push(x))}
  else if(F.p.src==='load')a.push({c:'LOAD-PORT',d:'คู่มือ Solis (ข้อ 5.4.3 Step 7) ระบุให้ต่ออินเวอร์เตอร์ออนกริดที่พอร์ต GEN (Smart Port = AC couple input) ไม่มีข้อความรองรับการต่อที่ฝั่ง Backup แบบจำลองจึงไม่นับว่าต่อ',sev:'stop'});
  if(F.sc.policy==='noexp'&&!F.s.anti)a.push({c:'EXPORT-LIMIT-OFF',d:'ยังไม่เปิดกันย้อนที่อินเวอร์เตอร์ AC ทั้งที่พื้นที่นี้ห้ามขายไฟ',sev:'warn',to:'src',bt:'ไปที่แท็บ 3 จอ on-grid',g:F.sc.src==='hw'?'ไปปรับที่แท็บ 3 จอ Huawei กด Settings › Power adjustment › Active power control › เปิด Export limitation (Zero export)':'ไปปรับที่แท็บ 3 ของไมโคร Deye เปิด Zero export (กันย้อน)'});
  if(F.p.src==='gen'&&!F.gen)a.push({c:hn?'GEN-PORT-USE':'SMART-PORT',d:(hn?'Gen Port Use ต้องเป็น Micro Inv Input':'Smart Port ต้องเป็น AC couple input')+' เครื่องจึงรับไฟจากพอร์ต GEN',sev:'stop',to:'host',g:hn?'ไปปรับที่แท็บ 2 จอเครื่อง Deye กด System Setup › Gen Port Use › เลือก Micro Inv Input':'ไปปรับที่แท็บ 2 จอเครื่อง Solis กด SYSTEM SETTING › SMART PORT › เลือก AC couple input'});
  if(F.ctS==='none')a.push({c:hn?'CT-LOST':'MET-SLT-Fail',d:'ไม่พบ CT/มิเตอร์ที่จุดต่อกริด'+(F.s.anti?' อินเวอร์เตอร์ AC ที่เปิดกันย้อนจะลดกำลังเป็น 0':''),sev:'warn'});
  if(F.ctS==='wrong')a.push({c:'CT-WRONG-POS',d:'CT อยู่ผิดตำแหน่ง ค่าที่อ่านไม่ใช่ไฟกริด',sev:'warn'});
  if(F.ctS==='rev')a.push({c:'CT-REVERSE',d:'ทิศ CT กลับ ค่ากริดกลับเครื่องหมาย',sev:'warn'});
  return a;
}
/* ---- จำลอง 1 วัน (ทุก 30 นาที) ---- */
function cpRun(o,S){
  o=Object.assign({cloud:0,out:'none',soc0:50,load:100},o||{});const F=cpFlags(S),H=CP_HOST[F.sc.host],A=F.src,dt=.5;
  const w0={none:[0,0],mid:[10,15],eve:[18,22]}[o.out]||[0,0],reserve=F.H.reserve/100,floor=F.H.floorOff/100,mi=F.H.mi;let mOpen=false;
  let soc=o.soc0/100;const rows=[],T={pvH:0,pvA:0,load:0,imp:0,exp:0,expBad:0,chg:0,dis:0,cutA:0,cutH:0,uns:0,trips:0};
  for(let i=0;i<48;i++){
    const h=i*dt,s=Math.max(0,Math.sin(Math.PI*(h-6)/12))*(1-o.cloud/100),up=!(o.out!=='none'&&h>=w0[0]&&h<w0[1]);
    const L=cpLoad(h)*o.load/100;let pH=H.kwp*.85*s,pA=Math.min(A.w,A.kwp*.85*s);
    const on=F.gen||(F.viaGrid&&up);if(!on)pA=0;
    const dmax=Math.min(H.cmax,Math.max(0,(soc-(up?reserve:floor))*H.cap/dt)),cmaxNow=Math.min(H.cmax,Math.max(0,(1-soc)*H.cap/dt));
    let capCut=0;
    if(F.am&&F.s.anti&&pA>0){ /* Huawei ต่อฝั่ง LOAD: CT/มิเตอร์ของ Huawei อยู่ที่สายโหลด → ผลิตได้ไม่เกินโหลด Backup ไม่ไหลย้อนเข้าพอร์ต LOAD (ทั้งตอนมีและไม่มีไฟกริด) */
      if(F.am!=='ok')pA=0;else{capCut=Math.max(0,pA-L);pA=Math.min(pA,L)}
    }else if(up&&F.s.anti&&pA>0){
      if(F.ctS==='none'||F.ctS==='wrong')pA=0;
      else if(F.ctS==='rev'&&L>pH+pA+dmax)pA=0;
    }
    let cutH=0,cutA=0,ch=0,exp=0,expBad=0,dis=0,imp=0,uns=0,trip=false,fq=50;
    if(!up&&pA>0&&!(F.am==='ok'&&F.s.anti)){ /* ไฟดับ: Hybrid เพิ่มความถี่ตาม SOC (Deye: Micro Inv Input ON/OFF + AC Couple Fre High, Solis: Freq-Watt) */
      const sp=soc*100;if(sp>=mi.off)mOpen=true;else if(sp<mi.on)mOpen=false;
      const ramp=mi.off>mi.on?Math.max(0,Math.min(1,(sp-mi.on)/(mi.off-mi.on))):(sp>=mi.off?1:0);
      fq=50+(mi.hz-50)*(mOpen?1:ramp);
      let fac=F.pf?Math.max(0,Math.min(1,(CP_FTRIP-fq)/(CP_FTRIP-F.src.fa))):(fq>=CP_FTRIP?0:1);
      if(mOpen&&mi.hz>=CP_FTRIP)fac=0;
      cutA=pA*(1-fac);pA-=cutA}
    const gen=pH+pA,direct=Math.min(gen,L);let sur=gen-direct;
    ch=Math.min(sur,cmaxNow);sur-=ch;
    if(sur>1e-9){
      if(up){
        if(!F.am&&F.s.anti&&F.ctS==='ok'){cutA=Math.min(pA,sur);sur-=cutA}
        if(F.H.exp){exp=Math.min(sur,F.H.maxSell);sur-=exp}
        const c=Math.min(pH,sur);cutH=c;sur-=c;
        if(sur>1e-9){expBad=sur;exp+=sur;sur=0}
        if(!F.H.exp)expBad=exp;
      }else{
        cutH=Math.min(pH,sur);sur-=cutH;
        if(sur>1e-6)trip=true;
      }
    }
    if(trip){uns=L;ch=0;exp=0;expBad=0;cutH=0;cutA=0;pH=0;pA=0;T.trips++}
    else{const def=L-direct;if(def>1e-9){dis=Math.min(def,dmax);const r=def-dis;if(up)imp=r;else uns=r}}
    soc+=(ch-dis)*dt/H.cap;soc=Math.max(0,Math.min(1,soc));
    const vH=pH-cutH,vA=pA-(up?cutA:0),f=up?50:fq;
    rows.push({i,h,up,pH:vH,pA:vA,L:L-uns,grid:imp-exp,bat:ch-dis,soc:soc*100,f,trip,cutA:cutA+capCut});
    T.pvH+=vH*dt;T.pvA+=vA*dt;T.load+=(L-uns)*dt;T.imp+=imp*dt;T.exp+=exp*dt;T.expBad+=expBad*dt;T.chg+=ch*dt;T.dis+=dis*dt;T.cutA+=(cutA+capCut)*dt;T.cutH+=cutH*dt;T.uns+=uns*dt;
  }
  return{rows,T};
}
function cpDay(){if(!CP._c){const d=CP.dash;CP._c=cpRun({cloud:d.cloud,out:d.out,soc0:d.soc0,load:d.load})}return CP._c}
/* ---- เช็กลิสต์ ---- */
function cpChecks(){
  const F=cpFlags(),sc=F.sc,H=CP_HOST[sc.host],A=F.src,deye=sc.host==='deye';
  const ld=!!sc.load,job=[[F.p.src===(ld?'load':'gen'),`อินเวอร์เตอร์ AC ต่อที่${ld?'ช่อง Backup (LOAD)':'พอร์ต GEN'} ของ ${H.n}`,F.p.src!==(ld?'load':'gen')&&F.p.src!=='none'?'err':''],
    [F.p.ct==='grid',`CT คล้องสายไฟกริดที่จุดต่อกริด (${F.p.ct==='grid'?'ติดแล้ว':F.p.ct==='src'?'ตอนนี้อยู่ที่สายอินเวอร์เตอร์ AC':F.p.ct==='load'?'ตอนนี้อยู่ที่สายโหลด':'ยังไม่ได้ติด'})`,F.p.ct==='src'||F.p.ct==='load'?'err':''],
    [F.p.ct==='grid'&&F.p.arrow==='ok','ทิศลูกศร CT ถูกต้อง',F.p.ct==='grid'&&F.p.arrow!=='ok'?'err':'']];
  if(ld&&A.adj)job.push([CP.cu.at==='load','CT ของ Huawei (ฟ้า) คล้องสายโหลด (สายจากพอร์ต LOAD) เพื่อจำกัดไม่ให้ไฟ Huawei ไหลย้อนเข้าพอร์ต LOAD'+(CP.cu.at==='load'?'':CP.cu.at==='none'?' (ยังไม่ได้ติด)':' (ตอนนี้อยู่ที่'+(CP.cu.at==='grid'?'สายไฟกริด':'สายอินเวอร์เตอร์ AC')+')'),CP.cu.at!=='none'&&CP.cu.at!=='load'?'err':''],[CP.cu.at==='load'&&CP.cu.arrow==='ok','ทิศลูกศร CT ของ Huawei ชี้ไปทางโหลด (จาก Hybrid ไปโหลด)',CP.cu.at==='load'&&CP.cu.arrow!=='ok'?'err':'']);
  const set=ld?[]:[[F.H.genUse==='ac',deye?'Gen Port Use = Micro Inv Input':'Smart Port = AC couple input']];
  if(deye&&!ld)set.push([F.H.mi.off>F.H.mi.on,`Micro Inv Input OFF (${F.H.mi.off}%) สูงกว่า ON (${F.H.mi.on}%)`],[F.H.mi.hz>=CP_FTRIP-1e-9,`AC Couple Fre High ≥ ${CP_FTRIP} Hz เพื่อให้อินเวอร์เตอร์ AC ตัดออกที่ SOC = OFF (ตอนนี้ ${cpF(F.H.mi.hz,1)} Hz)`]);
  else if(A.adj&&!deye)set.push([F.s.pf,'Huawei เปิด Freq-Watt (P(f)) เพราะ Solis ใช้ Freq-Watt ปรับกำลังอินเวอร์เตอร์ AC']);
  if(A.adj&&ld)set.push([F.p.ct==='grid','จอ Huawei ตรวจพบ Power meter / CT ที่จุดต่อกริด (Settings › Communication › Power meter)']);
  if(sc.policy==='noexp')set.push([deye?(F.H.zeroCT&&!F.H.exp):!F.H.exp,deye?'Work Mode = Zero Export To CT และไม่ติ๊ก Solar Sell':'Storage mode = Self-use และไม่ติ๊ก Allow export'],[F.s.anti,`เปิดกันย้อนที่อินเวอร์เตอร์ AC (${A.anti})`]);
  else set.push([F.H.exp&&F.H.maxSell>=3,deye?'Work Mode = Selling First และ Max Sell Power ≥ 3000 W':'Allow export เปิด (หรือ Selling first) และ Max export power ≥ 3000 W'],[!F.s.anti,'ปิดกันย้อนที่อินเวอร์เตอร์ AC (ได้รับอนุญาตให้ขายไฟ)']);
  const N=cpRun({cloud:0,out:'none',soc0:50,load:100}),B=cpRun({cloud:0,out:'mid',soc0:80,load:60});
  const dash=[[N.T.pvA>1,'อินเวอร์เตอร์ AC ผลิตและจ่ายไฟได้ในวันปกติ'],
    sc.policy==='noexp'?[N.T.expBad<.05&&N.T.pvA>1,`ห้ามขายไฟ: ส่งออกกริดทั้งวัน ${cpF(N.T.exp,2)} kWh ต้องเป็น 0`,N.T.exp>=.05?'err':'']:[N.T.exp>.5,`ขายไฟได้: ส่งออกกริดทั้งวัน ${cpF(N.T.exp,1)} kWh`],
    [B.T.uns<.05&&B.T.trips===0&&B.T.pvA>.5,`ไฟดับกลางวัน (แบต 80%): โหลดไม่ดับ ไม่ขึ้น Battery OV (ตัดไม่ทัน ${B.T.trips} ช่วง)`,B.T.trips>0?'err':'']];
  return{job,set,dash,N,B};
}
function cpScore(){const c=cpChecks(),all=[...c.job,...c.set,...c.dash],n=all.filter(x=>x[0]).length;return{c,n,all:all.length,ok:n===all.length}}
function cpChanged(full){CP._c=null;const s=cpScore();
  if(s.ok){if(!CP.drill||!CP.drill.length){CP.done[CP.sc]=true}else{CP.diagOk++;CP.drill=null;CP.done[CP.sc]=true;CP.flash='แก้ครบทุกจุด นับ 1 โจทย์'}}
  if(full!==false)cpRender();else cpLive();if(typeof touch==='function')touch()}
const cpDone=()=>Object.keys(CP_SC).filter(k=>CP.done[k]).length;
const cpList=a=>`<ul class="slchk">${a.map(([ok,t,l])=>`<li class="${ok?'ok':l==='err'?'err':''}">${esc(t)}</li>`).join('')}</ul>`;
/* ---- UI ---- */
const cpSel=(path,opts,v)=>`<select class="hn" data-cps="${path}" id="cps-${path.replace(/\./g,'-')}">${opts.map(([k,t])=>`<option value="${k}" ${String(v)===String(k)?'selected':''}>${esc(t)}</option>`).join('')}</select>`;
const cpNum=(path,v,min,max,step,u)=>`<span class="slnum"><input class="hn" type="number" data-cps="${path}" id="cps-${path.replace(/\./g,'-')}" value="${v}" min="${min}" max="${max}" step="${step||1}"><i>${u||''}</i></span>`;
const cpChk=(path,v,t)=>`<label class="slck"><input class="hn" type="checkbox" data-cps="${path}" id="cps-${path.replace(/\./g,'-')}" ${v?'checked':''}> ${t||''}</label>`;
const cpRow=(l,c)=>`<div class="slrow"><span>${l}</span><span>${c}</span></div>`;
const cpPages=()=>[['job','1 ใบสั่งงานและการต่อสาย'],['host',`2 จอเครื่อง ${CP_SC[CP.sc].host==='deye'?'Deye':'Solis'}`],['src',`3 ตั้งค่า ${CP_SC[CP.sc].src==='hw'?'Huawei':'ไมโคร Deye'}`],['dash','4 แดชบอร์ดและทดสอบ'],['fault','5 โจทย์หาข้อผิดพลาด'],['custom','6 ต่อสายเอง (CT 2 ชุด)']];
function cpRender(){
  const host=document.getElementById('cphost');if(!host)return;
  const s=cpScore(),sc=cpSc();if(!cpPages().some(p=>p[0]===CP.page))CP.page='job';const pg=CP.page;
  host.innerHTML=`<div class="verdict ${s.ok?'ok':s.n/s.all>.6?'warn':'err'}"><b>${esc(sc.n)}</b><span>${s.ok?'ผ่านครบทุกข้อ':'ผ่าน '+s.n+' / '+s.all+' ข้อ'}</span>${CP.drill?'<span class="pill warn">มีโจทย์หาข้อผิดพลาด</span>':''}<span class="nums">ผ่านแล้ว ${cpDone()}/${Object.keys(CP_SC).length} ระบบ</span></div>
  <div class="bar"><div class="grp" role="group" aria-label="ระบบ"><span class="lab">ระบบ</span>${Object.entries(CP_SC).map(([k,v])=>`<button class="chip" data-cpsc="${k}" aria-pressed="${CP.sc===k}">${CP.done[k]?'✓ ':''}${esc(v.n)}</button>`).join('')}</div></div>
  <div class="bar"><div class="grp" role="group" aria-label="ขั้นตอน">${cpPages().map(([k,t])=>`<button class="chip" data-cppg="${k}" aria-pressed="${pg===k}">${t}</button>`).join('')}</div></div>
  <div id="cppage">${pg==='job'?cpPgJob(s):pg==='host'?cpPgHost(s):pg==='src'?cpPgSrc(s):pg==='dash'?cpPgDash(s):pg==='custom'?cpPgCustom(s):cpPgFault(s)}</div>`;
  cpLive();
}
/* ---- ผังการต่อ: ลากปลายสายอินเวอร์เตอร์ AC ไปวางที่จุดต่อ และลาก CT ไปคล้องสาย (ค่าเก็บใน CP.ports เหมือนเดิม) ---- */
const CP_TI=[335,42];
const CP_TS={gen:[335,104],main:[175,112],grid:[240,136],load:[430,136],bload:[495,112]};
const CP_TC={grid:[115,136],src:[335,62],load:[430,136]};
const CP_TSN={gen:'พอร์ต GEN',main:'ตู้เมน',grid:'พอร์ต GRID',load:'พอร์ต LOAD',bload:'โหลดบ้าน (Backup)'};
let CPD=null;
function cpNear(T,x,y,r){let b=null,bd=r;for(const k in T){const d=Math.hypot(T[k][0]-x,T[k][1]-y);if(d<bd){bd=d;b=k}}return b}
function cpWire(k){const[x,y]=CP_TS[k];if(k==='bload')return`M335,42 L335,78 L${x},78 L${x},${y}`;return k==='gen'?`M335,42 L335,${y}`:`M335,42 L335,78 L${x},78 L${x},${y}`}
/* ---- ภาพอุปกรณ์ในผัง: สีตัวเครื่อง/ฟอร์มอย่างง่ายตามประเภท (ไม่ใช่โลโก้หรือแบบจริงของผู้ผลิต) สีในตัวเครื่องคงที่ อ่านได้ทั้งธีมมืดและสว่าง ---- */
function cpHybridIcon(x,y,w,h,host,hn,dim){
  const deye=host==='deye',body=dim?'#9aa8b6':deye?'#dfe5ec':'#eef0f2',stripe=deye?'#1f6fb5':'#e8590c',tx='#1b2430',model=(hn.split(' ')[1]||'').replace('-EU-SM2','');
  let s=`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${body}" stroke="#7d8b99" stroke-width="1.6"/><rect x="${x+1}" y="${y+1}" width="${w-2}" height="9" rx="6" fill="${stripe}"/>`;
  s+=`<rect x="${x+w-54}" y="${y+17}" width="46" height="25" rx="3" fill="#10222e" stroke="#5a6b78"/><path d="M${x+w-48},${y+25} h22 M${x+w-48},${y+31} h30 M${x+w-48},${y+37} h16" stroke="#58d68d" stroke-width="2" fill="none"/>`;
  s+=[0,1,2,3].map(i=>`<circle cx="${x+w-47+i*12}" cy="${y+52}" r="3" fill="#8794a1"/>`).join('');
  s+=`<text x="${x+9}" y="${y+30}" font-size="12" font-weight="700" fill="${tx}">${deye?'Deye':'Solis'} Hybrid</text><text x="${x+9}" y="${y+43}" font-size="9" fill="${tx}">${esc(model)}</text><text x="${x+9}" y="${y+56}" font-size="8" fill="#52606d">GRID · GEN · LOAD</text>`;
  return s;}
/* สัญลักษณ์แบตเตอรี่ (สีคงที่ ไม่ขาวจ้า): ตัวแบต + ขั้ว + ช่องชาร์จ 4 ช่อง + ป้ายขั้ว +/− */
function cpBatIcon(x,y,w,h,cap){
  let s=`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="#33414f" stroke="#7d8b99" stroke-width="1.6"/><rect x="${x+w}" y="${y+h/2-6}" width="5" height="12" rx="1.5" fill="#7d8b99"/>`;
  for(let i=0;i<4;i++)s+=`<rect x="${x+7+i*((w-14)/4)}" y="${y+7}" width="${(w-14)/4-4}" height="${h-24}" rx="2" fill="#4caf7a"/>`;
  s+=`<text x="${x+w/2}" y="${y+h-5}" text-anchor="middle" font-size="8.5" font-weight="700" fill="#e8eef3">แบตเตอรี่ LiFePO4</text>`;
  if(cap)s+=`<text x="${x+w/2}" y="${y+h+12}" text-anchor="middle" class="svgt mut" font-size="9">${esc(cap)}</text>`;
  return s}
function cpAcIcon(src,sn,cu){
  const hw=src==='hw',tx=hw?'#1b2430':'#f1f4f7';let s='';
  if(hw){s+=`<rect x="262" y="4" width="146" height="38" rx="6" fill="#eef1f4" stroke="#7d8b99" stroke-width="1.6"/>`+[0,1,2,3,4,5].map(i=>`<line x1="${382+i*5}" y1="9" x2="${382+i*5}" y2="37" stroke="#aab4be" stroke-width="2"/>`).join('')+
    `<rect x="262" y="4" width="6" height="38" rx="3" fill="#c8102e"/>`+[0,1,2].map(i=>`<circle cx="${277+i*9}" cy="35" r="2.6" fill="${i===0?'#27ae60':'#9aa6b2'}"/>`).join('')+
    `<text x="276" y="21" font-size="10" font-weight="700" fill="${tx}">${esc(sn.replace('Huawei ',''))}</text>`;}
  else{s+=`<line x1="270" y1="22" x2="285" y2="22" stroke="#222" stroke-width="3"/><line x1="385" y1="22" x2="400" y2="22" stroke="#222" stroke-width="3"/><rect x="285" y="6" width="100" height="32" rx="7" fill="#323b45" stroke="#7d8b99" stroke-width="1.6"/>`+
    `<text x="335" y="21" text-anchor="middle" font-size="11" font-weight="700" fill="${tx}">SUN-M200G4</text><text x="335" y="32" text-anchor="middle" font-size="8" fill="#b6c0ca">ไมโครอินเวอร์เตอร์ 2 kW</text><line x1="335" y1="38" x2="335" y2="42" stroke="#222" stroke-width="3"/>`;}
  return s+(cu?`<text x="420" y="26" class="svgt mut" font-size="10">อินเวอร์เตอร์ AC</text>`:`<text x="254" y="26" text-anchor="end" class="svgt mut" font-size="10">อินเวอร์เตอร์ AC</text>`);}
function cpSLD(cu){
  const F=cpFlags(),p=F.p,hn=cpHost().n,sn=cpSrc().n.split(' (')[0],D=CPD,dsrc=D&&D.k==='src',dct=D&&D.k==='ct';
  const box=(x,y,w,h,t,t2,cl)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" class="cpb ${cl||''}"/><text x="${x+w/2}" y="${y+h/2-(t2?2:-4)}" text-anchor="middle" class="svgt" font-size="12">${esc(t)}</text>${t2?`<text x="${x+w/2}" y="${y+h/2+13}" text-anchor="middle" class="svgt mut" font-size="10">${esc(t2)}</text>`:''}`;
  const ln=(a,b,c,d)=>`<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" class="cpw"/>`;
  let o=box(10,112,90,48,'กริด','PEA/MEA')+box(130,112,90,48,'ตู้เมน')+cpHybridIcon(260,104,150,64,cpSc().host,hn)+box(450,112,90,48,'โหลดบ้าน','Backup')+cpAcIcon(cpSc().src,sn,cu)+cpBatIcon(448,176,92,36,cpF(cpHost().cap,2)+' kWh');
  o+=`<path d="M385,168 L385,185 L448,185" class="cpw" style="stroke:#d64545" fill="none"/><path d="M398,168 L398,203 L448,203" class="cpw" fill="none"/><text x="392" y="198" class="svgt mut" font-size="8" text-anchor="end">แบต</text>`;
  o+=ln(100,136,130,136)+ln(220,136,260,136)+ln(410,136,450,136);
  o+=`<text x="345" y="98" class="svgt mut" font-size="10">GEN</text><text x="240" y="152" text-anchor="middle" class="svgt mut" font-size="9">GRID</text><text x="430" y="152" text-anchor="middle" class="svgt mut" font-size="9">LOAD</text>`;
  /* สายอินเวอร์เตอร์ AC */
  if(dsrc)o+=`<path d="M335,42 L${D.x.toFixed(1)},${D.y.toFixed(1)}" class="cpw" stroke-dasharray="4 3" fill="none"/>`;
  else if(p.src==='none')o+=`<path d="M335,42 L335,56" class="cpw" stroke-dasharray="3 3" fill="none"/><text x="345" y="56" class="svgt mut" font-size="10">ยังไม่ต่อ · ลากปลายสายไปวางที่จุดต่อ</text>`;
  else o+=`<path d="${cpWire(CP.ports.src)}" class="cpw ${p.src==='load'&&!(cpSc().load||(cu&&cpSc().host==='deye'))?'bad':''}" ${cu&&p.src==='load'?'style="stroke-dasharray:none"':''} fill="none"/>`;
  /* จุดต่อที่วางได้ */
  const hotS=dsrc?cpNear(CP_TS,D.x,D.y,28):null,hotC=dct?cpNear(CP_TC,D.x,D.y,30):null;
  if(dsrc)for(const k in CP_TS){const h=hotS===k;o+=`<circle cx="${CP_TS[k][0]}" cy="${CP_TS[k][1]}" r="${h?10:6}" fill="${h?'var(--accent)':'none'}" fill-opacity=".35" stroke="var(--accent)" stroke-width="2" stroke-dasharray="${h?'none':'3 2'}"/>`+(h?`<text x="${CP_TS[k][0]}" y="${CP_TS[k][1]-14}" text-anchor="middle" class="svgt" font-size="11" font-weight="700">${CP_TSN[k]}</text>`:'')}
  if(dct)for(const k in CP_TC){const h=hotC===k;o+=`<circle cx="${CP_TC[k][0]}" cy="${CP_TC[k][1]}" r="${h?12:7}" fill="${h?'var(--accent)':'none'}" fill-opacity=".35" stroke="var(--accent)" stroke-width="2" stroke-dasharray="${h?'none':'3 2'}"/>`}
  /* ปลายสาย (จับลากได้) */
  o+=`<circle cx="335" cy="42" r="5" fill="var(--ink)"/><circle data-cpdrag="src" cx="335" cy="42" r="13" fill="transparent" style="cursor:grab;touch-action:none"><title>ลากปลายสายอินเวอร์เตอร์ AC ไปวางที่จุดต่อ</title></circle>`;
  if(cu)o+=cpCuLayer(F,D);else{
  /* CT */
  const pos=dct?[D.x,D.y]:p.ct!=='none'?CP_TC[p.ct]:[505,40],dx=(F.p.arrow==='ok')===(cpSc().host==='deye')?1:-1,[cx,cy]=pos;
  /* สายสัญญาณ CT → พอร์ต CT ของ Hybrid (สีส้ม) ให้เห็นว่า CT ตัวนี้ส่งค่าไปที่ Hybrid */
  const hp=CUPORT.H,placed=p.ct!=='none'||dct;
  if(placed)o+=`<path d="M${hp[0]},${hp[1]} C${hp[0]},${hp[1]+45} ${cx},${cy+55} ${cx},${cy+9}" fill="none" stroke="${CUC.H}" stroke-width="2.6" stroke-dasharray="7 4" stroke-linecap="round"/>`;
  o+=`<circle cx="${hp[0]}" cy="${hp[1]}" r="6" fill="${CUC.H}" stroke="#fff" stroke-width="1.5"/><text x="326" y="206" text-anchor="end" class="svgt mut" font-size="9">พอร์ต CT (Hybrid)</text>`+(placed?`<text x="${cx}" y="${cy+36}" text-anchor="middle" class="svgt mut" font-size="9">CT ของ Hybrid</text>`:'');
  o+=`<g data-cpdrag="ct" style="cursor:grab;touch-action:none"><circle cx="${cx}" cy="${cy}" r="${p.ct==='none'&&!dct?11:9}" class="cpct" style="stroke:${CUC.H};stroke-width:3"/><text x="${cx}" y="${cy+4}" text-anchor="middle" font-size="10" font-weight="700" fill="#1b2430" style="pointer-events:none">CT</text>`+
    (p.ct!=='none'||dct?`<path d="M${cx-dx*9},${cy+17} L${cx+dx*9},${cy+17} M${cx+dx*9},${cy+17} l${-dx*5},-3 M${cx+dx*9},${cy+17} l${-dx*5},3" stroke="var(--err)" stroke-width="1.8" fill="none" style="pointer-events:none"/>`:'')+`<title>ลาก CT ไปคล้องสาย · คลิกเพื่อกลับทิศลูกศร</title></g>`;
  if(p.ct==='none'&&!dct)o+=`<text x="505" y="66" text-anchor="middle" class="svgt mut" font-size="10">ลาก CT ไปคล้องสาย</text>`;
  }
  return `<svg viewBox="0 0 560 ${cu?236:236}" role="img" aria-label="ผังการต่อ AC coupling ลากปลายสายและ CT เพื่อต่อ">${o}</svg>`;
}
/* ---- หน้า 6 ต่อสายเอง: CT 2 ชุด (Hybrid = ส้ม, อินเวอร์เตอร์ออนกริด = ฟ้า) และสายสัญญาณเส้นประแยกสี ---- */
const CUC={H:'#e8590c',A:'#1c9ad6'};
const CUPOS={H:{grid:[108,136],src:[335,56],load:[423,136],tray:[460,72]},A:{grid:[122,136],src:[335,70],load:[437,136],tray:[530,72]}};
const CUPORT={H:[335,168],A:[256,23]};
const cuHasA=()=>cpSc().src==='hw';
const cuTargets=k=>({grid:CUPOS[k].grid,src:CUPOS[k].src,load:CUPOS[k].load});
function cuAt(k){return k==='H'?CP.ports.ct:CP.cu.at}
function cuPos(k,D){if(D&&D.k==='ct'+k)return[D.x,D.y];const at=cuAt(k);return at==='none'?CUPOS[k].tray:CUPOS[k][at]}
function cpCuLayer(F,D){
  let o='';const ks=cuHasA()?['H','A']:['H'],dport=D&&D.k.startsWith('port')?D.k.slice(4):null,dct=D&&D.k.startsWith('ct')&&D.k!=='ct'?D.k.slice(2):null;
  const cable=(k,tgt)=>{const P=CUPORT[k],C=tgt,d=k==='H'?`M${P[0]},${P[1]} C${P[0]},${P[1]+45} ${C[0]},${C[1]+55} ${C[0]},${C[1]+9}`:`M${P[0]},${P[1]} C${P[0]-60},${P[1]} ${C[0]},${C[1]-55} ${C[0]},${C[1]-9}`;
    return `<path d="${d}" fill="none" stroke="${CUC[k]}" stroke-width="2.6" stroke-dasharray="7 4" stroke-linecap="round"/>`};
  ks.forEach(k=>{const l=k==='H'?CP.cu.lh:CP.cu.la;
    if(dport===k)o+=`<path d="M${CUPORT[k][0]},${CUPORT[k][1]} L${D.x.toFixed(1)},${D.y.toFixed(1)}" fill="none" stroke="${CUC[k]}" stroke-width="2.6" stroke-dasharray="7 4" stroke-linecap="round"/>`;
    else if(l!=='none'&&(l==='H'||cuHasA()))o+=cable(k,cuPos(l,null))});
  /* จุดคล้อง CT ที่วางได้ / CT ที่รับสายได้ */
  if(dct){const T=cuTargets(dct),hot=cpNear(T,D.x,D.y,26);for(const t in T)o+=`<circle cx="${T[t][0]}" cy="${T[t][1]}" r="${hot===t?11:7}" fill="${hot===t?CUC[dct]:'none'}" fill-opacity=".3" stroke="${CUC[dct]}" stroke-width="2" stroke-dasharray="${hot===t?'none':'3 2'}"/>`}
  if(dport){const cand={};ks.forEach(k=>cand[k]=cuPos(k,null));const hot=cpNear(cand,D.x,D.y,24);for(const k in cand)o+=`<circle cx="${cand[k][0]}" cy="${cand[k][1]}" r="${hot===k?13:10}" fill="${hot===k?CUC[dport]:'none'}" fill-opacity=".3" stroke="${CUC[dport]}" stroke-width="2" stroke-dasharray="${hot===k?'none':'3 2'}"/>`}
  /* ตัว CT */
  ks.forEach(k=>{const[cx,cy]=cuPos(k,D),at=cuAt(k),placed=at!=='none'||dct===k,
    dx=k==='H'?((F.p.arrow==='ok')===(cpSc().host==='deye')?1:-1):(CP.cu.arrow==='ok'?1:-1);
    o+=`<g data-cpdrag="ct${k}" style="cursor:grab;touch-action:none"><circle cx="${cx}" cy="${cy}" r="${placed?8:11}" fill="#fff" stroke="${CUC[k]}" stroke-width="3"/><text x="${cx}" y="${cy+3}" text-anchor="middle" font-size="8" font-weight="700" fill="#1b2430" style="pointer-events:none">CT</text>`+
      (placed?`<path d="M${cx-dx*7},${cy+15} L${cx+dx*7},${cy+15} M${cx+dx*7},${cy+15} l${-dx*4},-2.5 M${cx+dx*7},${cy+15} l${-dx*4},2.5" stroke="${CUC[k]}" stroke-width="1.8" fill="none" style="pointer-events:none"/>`:'')+`<title>${k==='H'?'CT ของ Hybrid':'CT ของอินเวอร์เตอร์ออนกริด'} · ลากไปคล้องสาย · คลิกเพื่อกลับทิศลูกศร</title></g>`;
    if(!placed)o+=`<text x="${cx}" y="${cy+25}" text-anchor="middle" class="svgt mut" font-size="9">${k==='H'?'CT Hybrid':'CT ออนกริด'}</text>`});
  /* พอร์ต (จับลากสายสัญญาณ) */
  ks.forEach(k=>{const[px,py]=CUPORT[k];o+=`<circle cx="${px}" cy="${py}" r="6" fill="${CUC[k]}" stroke="#fff" stroke-width="1.5"/><circle data-cpdrag="port${k}" cx="${px}" cy="${py}" r="13" fill="transparent" style="cursor:crosshair;touch-action:none"><title>${k==='H'?'พอร์ต CT ของ Hybrid':'พอร์ตมิเตอร์ของอินเวอร์เตอร์ออนกริด'} · ลากสายไปที่ CT ของตัวเอง</title></circle>`});
  o+=`<text x="326" y="186" text-anchor="end" class="svgt mut" font-size="9">พอร์ต CT (Hybrid)</text>`;
  if(cuHasA())o+=`<text x="250" y="40" text-anchor="end" class="svgt mut" font-size="9">พอร์ตมิเตอร์</text>`;
  return o}
function cpCuChecks(){
  const F=cpFlags(),cu=CP.cu,hw=cuHasA(),L=[];
  const dy=cpSc().host==='deye',okP=cpSc().load?F.p.src==='load':dy?(F.p.src==='gen'||F.p.src==='load'):F.p.src==='gen';
  L.push([okP,'อินเวอร์เตอร์ AC ต่อที่'+(cpSc().load?'ช่อง LOAD (Backup)':dy?'พอร์ต GEN หรือช่อง LOAD (Backup)':'พอร์ต GEN')+' ของ Hybrid',F.p.src==='main'||F.p.src==='grid'||(F.p.src==='load'&&!okP)?'err':'']);
  L.push([F.p.ct==='grid','CT ของ Hybrid (ส้ม) คล้องสายไฟกริด',F.p.ct==='src'||F.p.ct==='load'?'err':'']);
  L.push([F.p.ct==='grid'&&F.p.arrow==='ok','ทิศลูกศร CT ของ Hybrid ถูกต้อง',F.p.ct==='grid'&&F.p.arrow!=='ok'?'err':'']);
  L.push([cu.lh==='H','สายสัญญาณสีส้มจากพอร์ต CT ของ Hybrid ต่อถึง CT ของ Hybrid'+(cu.lh==='A'?' (ตอนนี้ไปต่อกับ CT ออนกริด สลับกัน)':''),cu.lh==='A'?'err':'']);
  if(hw){
    const w=F.ls?'load':'grid';
    L.push([cu.at===w,F.ls?'CT ของ Huawei (ฟ้า) คล้องสายโหลด (สายจากพอร์ต LOAD) เพื่อจำกัดไม่ให้ไฟออนกริดไหลย้อนเข้าพอร์ต LOAD ของ Hybrid':'CT ของอินเวอร์เตอร์ออนกริด (ฟ้า) คล้องสายไฟกริด',cu.at!=='none'&&cu.at!==w?'err':'']);
    L.push([cu.at===w&&cu.arrow==='ok',F.ls?'ทิศลูกศร CT ของ Huawei ชี้ไปทางโหลด (ค่าสมมติของแบบจำลอง ตรวจกับคู่มือ Huawei)':'ทิศลูกศร CT ออนกริดชี้เข้าหาบ้าน (ค่าสมมติของแบบจำลอง ตรวจกับคู่มือ Huawei)',cu.at===w&&cu.arrow!=='ok'?'err':'']);
    L.push([cu.la==='A','สายสัญญาณสีฟ้าจากพอร์ตมิเตอร์ของอินเวอร์เตอร์ออนกริดต่อถึง CT ออนกริด'+(cu.la==='H'?' (ตอนนี้ไปต่อกับ CT Hybrid สลับกัน)':''),cu.la==='H'?'err':'']);
  }
  return L}
/* ผลจำลองจากสายที่ต่อจริงในผัง: ไฟกริดดับ 10:00–15:00 (แบต 50%) เทียบกับวันปกติ — ค่าจำลอง ไม่ใช่ค่าจากคู่มือ */
function cpCuSim(){
  const F=cpFlags(),ld=F.p.src==='load',lost=F.sc.src==='hw'&&F.s.anti&&(F.ls?F.am!=='ok':CP.cu.at!=='grid'),S2=lost?Object.assign(JSON.parse(JSON.stringify(CP)),{_c:null}):CP;
  if(lost)S2.ports.ct='none'; /* Huawei เปิดกันย้อนแต่ไม่เห็นมิเตอร์ของตัวเอง → ลดกำลังเป็น 0 */
  const N=cpRun({cloud:0,out:'none',soc0:50,load:100},S2),B=cpRun({cloud:0,out:'mid',soc0:50,load:100},S2),r=B.rows.find(x=>!x.up&&x.pA>0.01);
  const row=(l,v)=>`<tr><th>${l}</th><td>${v}</td></tr>`;
  let note='';
  if(F.p.src==='none')note='ยังไม่ได้ต่อสายอินเวอร์เตอร์ AC';
  else if(!F.gen&&!F.viaGrid)note=F.p.src==='load'?'Solis: คู่มือไม่รองรับการต่อฝั่ง Backup แบบจำลองจึงไม่นับว่าอินเวอร์เตอร์ AC ทำงาน':'พอร์ต GEN ยังไม่ได้ตั้งเป็น AC couple (ไปตั้งที่แท็บ 2 จอเครื่อง)';
  else if(F.viaGrid)note='ต่อที่ฝั่งกริด: ไฟกริดดับแล้วอินเวอร์เตอร์ AC ไม่ทำงาน';
  else note=ld?'ต่อที่ช่อง LOAD: ตอนไฟกริดดับ Hybrid สร้างไฟที่ช่อง LOAD อินเวอร์เตอร์ AC ซิงก์กับไฟนั้นและจ่ายให้โหลด Backup ได้ แต่ Hybrid ต้องลดกำลังเมื่อแบตเต็ม (เลื่อนความถี่) · CT ที่สายกริดจะอ่าน 0 A เพราะไม่มีกระแสกริด':'ต่อที่พอร์ต GEN: ตอนไฟกริดดับ Hybrid จ่ายไฟออกพอร์ต GEN ให้อินเวอร์เตอร์ AC ซิงก์ตาม';
  return `<h3>ผลจำลองไฟกริดดับ 10:00–15:00 (แบต 50%)</h3>${lost?'<p class="hint tight">Huawei เปิดกันย้อนแต่ CT/มิเตอร์ของ Huawei ยังไม่อยู่ที่ตำแหน่งที่ถูก (ฝั่ง LOAD ต้องคล้องสายโหลด, ฝั่งกริดต้องคล้องสายไฟกริด) ผลด้านล่างจึงคิดว่า Huawei ลดกำลังเป็น 0</p>':''}<table class="t"><tbody>${row('อินเวอร์เตอร์ AC ผลิตทั้งวัน (วันปกติ)',cpF(N.T.pvA,1)+' kWh')+row('อินเวอร์เตอร์ AC ผลิตทั้งวัน (ไฟดับ)',cpF(B.T.pvA,1)+' kWh')+row('โหลดที่ไม่ได้รับไฟ',cpF(B.T.uns,2)+' kWh')+row('Battery OV (ตัดไม่ทัน)',B.T.trips+' ช่วง')+(r?row('ความถี่ที่ช่องต่อตอนไฟดับ',cpF(r.f,2)+' Hz'):'')}</tbody></table><p class="hint tight">${note}</p><p class="hint tight">ค่าจำลองตามหลัก AC coupling ไม่ใช่ค่าจากคู่มือ: คู่มือ Deye ข้อ 5.11 มีแบบ On-Load + AC couple แต่ไม่ได้อธิบายพฤติกรรมตอนไฟดับ · คู่มือ Solis ระบุเฉพาะพอร์ต GEN</p>`;
}
function cpPgCustom(){
  const L=cpCuChecks(),n=L.filter(x=>x[0]).length,hw=cuHasA();
  return `<div class="cards"><div class="card"><h3>ต่อสายเอง: CT 2 ชุด</h3>
    <p>อินเวอร์เตอร์ออนกริดและเครื่อง Hybrid ต่างมี CT/มิเตอร์ของตัวเอง ${hw?'ลาก CT ทั้งสองไปคล้องสายไฟกริด แล้วลากสายสัญญาณเส้นประจากพอร์ตของแต่ละเครื่องไปต่อกับ CT ของตัวเอง':'ไมโคร Deye ไม่มีพอร์ตมิเตอร์ของตัวเอง ใช้ CT ของ Hybrid ชุดเดียว ลาก CT ไปคล้องสายไฟกริดแล้วลากสายสัญญาณเส้นประไปต่อ'}</p>
    <div class="tblwrap" id="cpsld">${cpSLD(true)}</div>
    <p class="slleg" style="display:flex;flex-wrap:wrap;gap:6px 16px;font-size:13px"><span><b style="color:${CUC.H}">- - -</b> สายสัญญาณ CT ของ <b>Hybrid</b> (สีส้ม)</span>${hw?`<span><b style="color:${CUC.A}">- - -</b> สายสัญญาณ CT/มิเตอร์ของ<b>อินเวอร์เตอร์ออนกริด</b> (สีฟ้า)</span>`:''}</p>
    <p class="hint tight">ลาก<b>ปลายสายอินเวอร์เตอร์ AC</b>ไปที่พอร์ต GEN${cpSc().host==='deye'?' หรือช่อง LOAD (Backup)':''} · ลาก <b>CT</b> (วงกลมขอบส้ม/ฟ้า) ไปคล้องสายกริด · ลากจุดสี<b>พอร์ต</b>ไปปล่อยบน CT สีเดียวกัน · คลิกที่ CT เพื่อกลับทิศลูกศร · วางนอกจุด = ถอดออก · ผลการวาง CT ของ Hybrid ใช้ร่วมกับหน้า 1 และการจำลอง</p></div>
   <div class="card"><h3>ตรวจการต่อสาย <span class="pill ${n===L.length?'ok':'warn'}">${n}/${L.length}</span></h3>${cpList(L)}${cpCuSim()}${cpLoadRisks(CP,{custom:true}).map(a=>`<p class="${a.sev==='stop'?'hmierr':'hint tight'}"><b>${esc(a.c)}</b> ${esc(a.d)}</p>`).join('')}</div></div>`;
}
function cpPgJob(s){
  const F=cpFlags(),H=cpHost(),sc=cpSc(),p=CP.ports;
  return `<div class="cards"><div class="card"><h3>ใบสั่งงาน</h3><p>${esc(sc.brief).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>')}</p>
    <table class="t"><tbody><tr><th>Hybrid</th><td>${esc(H.n)} · แบต ${cpF(H.cap,2)} kWh</td></tr><tr><th>อินเวอร์เตอร์ AC</th><td>${esc(cpSrc().n)}</td></tr><tr><th>นโยบายขายไฟ</th><td>${sc.policy==='noexp'?'ห้ามขาย (ต้องกันย้อน)':'ขายได้ ไม่เกิน 5 kW'}</td></tr></tbody></table>
    <div class="tblwrap" id="cpsld">${cpSLD()}</div><p class="hint tight">ลาก<b>ปลายสายอินเวอร์เตอร์ AC</b>ไปวางที่ตู้เมน / พอร์ต GRID / พอร์ต GEN / พอร์ต LOAD · ลาก<b>CT</b>ไปคล้องสายกริด สายอินเวอร์เตอร์ AC หรือสายโหลด · คลิกที่ CT เพื่อกลับทิศลูกศร · วางนอกจุดต่อ = ถอดออก (ตั้งผ่านรายการเลือกด้านขวาก็ได้)</p></div>
    <div class="card"><h3>การต่อสาย</h3>
    ${cpRow('อินเวอร์เตอร์ AC ต่อเข้าที่',`<select class="hn" data-cpp="src" id="cpp-src">${CP_SRC_OPTS.map(([k,t])=>`<option value="${k}" ${p.src===k?'selected':''}>${esc(t)}</option>`).join('')}</select>`)}
    ${cpRow('ตำแหน่ง CT',`<select class="hn" data-cpp="ct" id="cpp-ct">${CP_CT_OPTS.map(([k,t])=>`<option value="${k}" ${p.ct===k?'selected':''}>${esc(t)}</option>`).join('')}</select>`)}
    ${cpRow('ทิศลูกศร CT',`<select class="hn" data-cpp="arrow" id="cpp-arrow"><option value="ok" ${p.arrow==='ok'?'selected':''}>${esc(H.ctOk)}</option><option value="rev" ${p.arrow==='rev'?'selected':''}>${esc(H.ctBad)}</option></select>`)}
    ${F.am!==null?cpRow('ตำแหน่ง CT ของ Huawei',`<select class="hn" data-cpu="at" id="cpu-at">${CP_CT_OPTS.map(([k,t])=>`<option value="${k}" ${CP.cu.at===k?'selected':''}>${esc(t)}</option>`).join('')}</select>`)+cpRow('ทิศลูกศร CT ของ Huawei',`<select class="hn" data-cpu="arrow" id="cpu-arrow"><option value="ok" ${CP.cu.arrow==='ok'?'selected':''}>ชี้ไปทางโหลด</option><option value="rev" ${CP.cu.arrow==='rev'?'selected':''}>ชี้ย้อนกลับ</option></select>`)+'<p class="hint tight">Huawei ต่อฝั่ง LOAD: CT/มิเตอร์ของ Huawei ต้องคล้องที่สายโหลดเพื่อไม่ให้ไฟ Huawei ไหลย้อนเข้าพอร์ต LOAD (วางด้วยการลากได้ที่หน้า 6)</p>':''}
    <p class="hint tight">${esc(H.ctNote)} · มิเตอร์/CT กันย้อน: ${esc(cpSrc().meter)}</p>
    <h3>ตรวจการต่อสาย</h3>${cpList(s.c.job)}
    ${cpAlarms().map(a=>`<p class="${a.sev==='stop'?'hmierr':'hint tight'}"><b>${esc(a.c)}</b> ${esc(a.d)}</p>`+(a.g?`<p class="cpguide">▶ ${esc(a.g)} <button class="btn sm" data-cppg="${a.to}">${esc(a.bt||'ไปที่แท็บ 2 จอเครื่อง')}</button></p>`:'')).join('')}</div></div>`;
}
function cpHome(){const r=cpDay().rows[CP.dash.t];
  return `<table class="t"><tbody><tr><th>เวลา</th><td>${cpHM(r.i)} ${r.up?'':'(ไฟกริดดับ)'}</td><th>ความถี่ที่พอร์ต</th><td>${cpF(r.f,2)} Hz</td></tr><tr><th>PV (เครื่อง)</th><td>${cpF(r.pH*1000)} W</td><th>GEN (AC couple)</th><td>${cpF(r.pA*1000)} W</td></tr><tr><th>โหลด</th><td>${cpF(r.L*1000)} W</td><th>กริด</th><td>${cpF(r.grid*1000)} W</td></tr><tr><th>แบต</th><td>${cpF(r.bat*1000)} W</td><th>SOC</th><td>${cpF(r.soc)} %</td></tr></tbody></table><p class="hmiinfo">แตะ System Setup เพื่อเข้าตั้งค่า</p>`}
function cpPgHost(s){
  const deye=cpSc().host==='deye',note=cpSc().host==='solis'?'ค่าในแบบจำลอง: Solis ไม่มีค่าความถี่ให้ตั้ง ใช้ Freq-Watt ของอินเวอร์เตอร์ AC ลดกำลังเมื่อ SOC 95–100% (ค่าสมมติ)':'';
  return `<div class="cards"><div class="card sldevcard">${hlDevice(cpSc().host,CP,cpHome(),note)}<p class="hint tight">${deye?(cpSc().load?'ใบงานนี้ต่อที่ช่อง LOAD ไม่ต้องตั้ง Gen Port Use · ตั้งโหมดที่ System Work Mode เป็น Zero Export To CT':'ไป System Setup › Gen Port Use เลือก Micro Inv Input · ตั้งโหมดขายไฟที่ System Work Mode'):'ไป SYSTEM SETTING › SMART PORT เลือก AC couple input · ตั้งโหมดขายไฟที่ STORAGE MODE'}</p></div>
    <div class="card"><h3>ตรวจการตั้งค่า</h3>${cpList(s.c.set)}<p class="hint tight">ชื่อรายการบนจอและคำอธิบายตามคู่มือ ${deye?'Deye SUN-3/3.6/5/6K-SG04LP1-EU-SM2 (2026-01) ข้อ 5.4–5.10':'Solis S6-EH1P(3-8)K-L-PLUS V1.3 ข้อ 5.4'}</p></div></div>`;
}
function cpPgSrc(s){
  const S=CP.set.src,A=cpSrc(),hw=cpSc().src==='hw',F=cpFlags();
  const scr=['home','padj','feat','meter'].includes(CP.sm.scr)?CP.sm.scr:'home',go=(k,t)=>`<button class="hn hmiitem" data-cpsm="${k}"><i>›</i>${t}</button>`,back=`<button class="hn hmiitem" data-cpsm="home"><i>‹</i>ย้อนกลับ</button>`;
  const crumb={home:'Settings',padj:'Settings › Power adjustment',feat:'Settings › Feature parameters',meter:'Settings › Communication › Power meter'}[scr];
  const hwBody=scr==='home'?go('padj','Power adjustment (Active power control)')+go('feat','Feature parameters (Freq-Watt)')+go('meter','Communication › Power meter')+cpRow('Export limitation',S.anti?'เปิด (Zero export)':'ปิด')+cpRow('Power meter',F.p.ct==='grid'?'พบ':'ไม่พบ')
    :scr==='padj'?cpRow('Active power control › Export limitation',cpChk('src.anti',S.anti,'เปิด Zero export ที่จุดต่อกริด'))+cpRow('Power meter ที่ต้องใช้',F.p.ct==='grid'?'พบ (CT/มิเตอร์ที่จุดต่อกริด)':'ไม่พบ')+back
    :scr==='feat'?cpRow('P(f) / Freq-Watt',cpChk('src.pf',S.pf,'เปิด'))+cpRow('Derating start / stop',`${A.fa} / ${A.fb} Hz`)+back
    :cpRow('Meter model','DTSU666-H (Smart Power Sensor)')+cpRow('Status',F.ctS==='ok'?'Connected · ทิศถูกต้อง':F.ctS==='rev'?'Connected · ทิศกลับ':F.ctS==='wrong'?'Connected · ตำแหน่งผิด':'Not found')+cpRow('ตำแหน่งที่ต้องติด','สายไฟกริด (L) ที่จุดต่อกริด')+back;
  const body=hw?hwBody
    :cpRow('Grid code frequency derate',`${A.fa} / ${A.fb} Hz (ตามมาตรฐาน ปรับไม่ได้)`)+cpRow('Zero export (กันย้อน)',cpChk('src.anti',S.anti,'เปิด'))+cpRow('ค่าที่อ่านจาก CT',F.p.ct==='grid'?'พบ CT ของ Hybrid':'ไม่พบ CT');
  return `<div class="cards"><div class="card sldevcard"><div class="sldev"><div class="sldevtop"><span>${hw?'HUAWEI · SUN2000 (FusionSolar / SUN2000 app)':'DEYE MICRO · แอปมอนิเตอร์'}</span><span>${esc(A.n.split(' (')[0])}</span></div><div class="slscr"><div class="hmibar"><span>${hw?crumb:'Settings'}</span><span>${esc(A.anti)}</span></div><div class="hmibody">${body}<p class="hmiinfo">เปิดกันย้อนแล้ว ถ้าไม่พบ CT/มิเตอร์หรืออ่านผิด อินเวอร์เตอร์จะลดกำลังเป็น 0 เพื่อความปลอดภัย ไม่ใช่ขายไฟต่อ · ชื่อรายการเป็นแบบจำลอง ตรวจกับคู่มือรุ่นจริง</p></div></div></div></div>
    <div class="card"><h3>ตรวจการตั้งค่า</h3>${cpList(s.c.set)}</div></div>`;
}
function cpLive(){
  const el=document.getElementById('cplive');if(!el)return;const r=cpDay().rows[CP.dash.t];
  el.innerHTML=`<table class="t"><tbody><tr><th>เวลา</th><td><b>${cpHM(r.i)}</b> ${r.up?'':'<span class="pill warn">ไฟดับ</span>'}${r.trip?'<span class="pill err">Battery OV · โหลดดับ</span>':''}</td><th>ความถี่ที่ Hybrid จ่าย</th><td>${cpF(r.f,1)} Hz</td></tr>
  <tr><th>แผงของ Hybrid</th><td>${cpF(r.pH,2)} kW</td><th>อินเวอร์เตอร์ AC (${cpSc().load?'LOAD':'GEN'})</th><td>${cpF(r.pA,2)} kW${r.cutA>0?` (ถูกตัด ${cpF(r.cutA,2)})`:''}</td></tr>
  <tr><th>โหลด</th><td>${cpF(r.L,2)} kW</td><th>กริด</th><td>${r.grid>0.005?'ซื้อ ':r.grid<-0.005?'ขาย ':''}${cpF(Math.abs(r.grid),2)} kW</td></tr>
  <tr><th>แบต</th><td>${r.bat>=0?'ชาร์จ ':'จ่าย '}${cpF(Math.abs(r.bat),2)} kW</td><th>SOC</th><td>${cpF(r.soc)} %</td></tr></tbody></table>`;
  const n=document.getElementById('cpnow');if(n){const x=40+(640-40-20)*r.i/47;n.setAttribute('x1',x);n.setAttribute('x2',x)}
}
function cpChart(){
  const rows=cpDay().rows,W=640,H=200,L=40,R=20,B=22,Tp=10,mx=8,x=i=>L+(W-L-R)*i/47,y=v=>Tp+(H-Tp-B)*(1-(v+mx)/(2*mx));
  const path=(f,cls)=>`<path d="${rows.map((r,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+f(r).toFixed(1)).join(' ')}" class="slc ${cls}"/>`;
  let out=rows.map((r,i)=>r.up?'':`<rect x="${x(i)}" y="${Tp}" width="${(W-L-R)/47+.5}" height="${H-Tp-B}" class="slout"/>`).join('');
  out+=[-mx,0,mx].map(v=>`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" class="slgrid"/><text x="${L-4}" y="${y(v)+4}" class="svgt m mut" text-anchor="end" font-size="10">${v}k</text>`).join('');
  [0,6,12,18,24].forEach(h=>out+=`<text x="${x(Math.min(47,h*2))}" y="${H-6}" class="svgt m mut" text-anchor="middle" font-size="10">${h}:00</text>`);
  out+=path(r=>y(r.pH),'pv')+path(r=>y(r.pA),'sc')+path(r=>y(r.L),'ld')+path(r=>y(r.grid),'gd')+path(r=>y(r.bat),'bt');
  out+=`<line x1="${x(CP.dash.t)}" x2="${x(CP.dash.t)}" y1="${Tp}" y2="${H-B}" class="slnow" id="cpnow"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="กราฟทั้งวัน">${out}</svg><div class="slleg"><span class="pv">แผง Hybrid</span><span class="sc">อินเวอร์เตอร์ AC</span><span class="ld">โหลด</span><span class="gd">กริด (+ซื้อ / −ขาย)</span><span class="bt">แบต (+ชาร์จ / −จ่าย)</span><span class="ot">ช่วงไฟดับ</span></div>`;
}
function cpPgDash(s){
  const D=CP.dash,T=cpDay().T;
  return `<div class="card"><div class="bar"><div class="grp"><span class="lab">เวลา</span><input type="range" min="0" max="47" step="1" value="${D.t}" data-cpt id="cptime" aria-label="เวลา"></div>
    <div class="grp"><span class="lab">ไฟดับ</span>${cpSel('dash.out',CP_OUT,D.out)}<span class="lab">เมฆ</span>${cpNum('dash.cloud',D.cloud,0,90,10,'%')}<span class="lab">โหลด</span>${cpNum('dash.load',D.load,20,300,10,'%')}<span class="lab">SOC เริ่มวัน</span>${cpNum('dash.soc0',D.soc0,10,100,5,'%')}</div>
    <div class="grp">${cpChk('src.anti',CP.set.src.anti,'กันย้อน (ตั้งที่อินเวอร์เตอร์ AC)')}${cpChk('ctquick',CP.ports.ct==='grid','มี CT ที่กริด')}</div></div>
    <div id="cplive"></div></div>
  <div class="cards"><div class="card"><h3>ทั้งวัน</h3><div class="tblwrap">${cpChart()}</div>
    <table class="t"><tbody><tr><th>ผลิตแผง Hybrid</th><td>${cpF(T.pvH,1)} kWh</td><th>ผลิตอินเวอร์เตอร์ AC</th><td>${cpF(T.pvA,1)} kWh</td></tr><tr><th>โหลดที่จ่ายได้</th><td>${cpF(T.load,1)} kWh</td><th>โหลดดับ</th><td>${cpF(T.uns,1)} kWh</td></tr><tr><th>ซื้อไฟ</th><td>${cpF(T.imp,1)} kWh</td><th>ขายไฟ</th><td>${cpF(T.exp,1)} kWh</td></tr><tr><th>ชาร์จ / จ่ายแบต</th><td>${cpF(T.chg,1)} / ${cpF(T.dis,1)} kWh</td><th>ตัดกำลัง AC / Hybrid</th><td>${cpF(T.cutA,1)} / ${cpF(T.cutH,1)} kWh</td></tr></tbody></table></div>
   <div class="card"><h3>ผลทดสอบการทำงาน</h3>${cpList(s.c.dash)}<p class="hint tight">ทดสอบอัตโนมัติ 2 วัน: วันปกติ (แบต 50%) และไฟดับ 10:00–15:00 ตอนแบต 95% โหลด 60% ดูว่าตัดกำลังอินเวอร์เตอร์ AC ทัน ไม่เกิน Battery OV</p></div></div>`;
}
function cpPgFault(s){
  const d=CP.drill,fl=d?d.map(k=>CP_FAULTS[k].n):[];
  return `<div class="card"><h3>โจทย์หาข้อผิดพลาด</h3><p>ระบบจัดค่าที่ถูกต้องให้ แล้วใส่ความผิดพลาด 2 จุด ให้หาจากผังการต่อ หน้าตั้งค่า และผลทดสอบ แล้วแก้ให้ผ่านครบทุกข้อ นับโจทย์ที่ผ่านแล้ว <b>${CP.diagOk}</b> โจทย์</p>
    ${CP.flash?`<p class="hint tight"><b>${esc(CP.flash)}</b></p>`:''}
    <div class="bar"><button class="btn sm" data-cpact="drill">${d?'สุ่มโจทย์ใหม่':'เริ่มโจทย์หาข้อผิดพลาด'}</button>${d?'<button class="btn sm" data-cpact="reveal">เฉลยจุดที่ผิด</button><button class="btn sm" data-cpact="drillend">ยกเลิกโจทย์</button>':''}</div>
    ${d&&CP.reveal?`<ul class="slchk">${fl.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:''}
    <h3>ผลตอนนี้</h3>${cpList([...s.c.job,...s.c.set,...s.c.dash])}</div>`;
}
function cpDrill(){
  const S=CP;cpCorrect(S);const ks=Object.keys(CP_FAULTS).filter(k=>!CP_FAULTS[k].ok||CP_FAULTS[k].ok(S));
  const pick=[];while(pick.length<2){const k=ks[Math.floor(Math.random()*ks.length)];if(!pick.includes(k))pick.push(k)}
  if(pick.includes('ct_loc')&&pick.includes('ct_rev'))pick[pick.indexOf('ct_rev')]=ks.find(k=>!pick.includes(k)&&k!=='ct_rev');
  if(pick.includes('no_ct')&&pick.includes('ct_loc'))pick[pick.indexOf('ct_loc')]=ks.find(k=>!pick.includes(k)&&k!=='ct_loc'&&k!=='ct_rev');
  pick.forEach(k=>CP_FAULTS[k].f(S));S.drill=pick;S.reveal=false;S.flash='';
}
function cpSetPath(path,v){const[g,k]=path.split('.');if(g==='dash'){CP.dash[k]=v;return}if(CP.set[g])CP.set[g][k]=v}
function cpEvents(){
  const host=document.getElementById('cphost');if(!host||host.dataset.on)return;host.dataset.on='1';
  /* ลากต่อสาย: ปลายสายอินเวอร์เตอร์ AC และ CT */
  const cpPt=e=>{const sv=document.querySelector('#cpsld svg');if(!sv)return null;const q=sv.createSVGPoint();q.x=e.clientX;q.y=e.clientY;const m=sv.getScreenCTM();return m?q.matrixTransform(m.inverse()):null};
  const cpRedraw=()=>{const el=document.getElementById('cpsld');if(el)el.innerHTML=cpSLD(CP.page==='custom')};
  host.addEventListener('pointerdown',e=>{const t=e.target.closest('[data-cpdrag]');if(!t)return;const pt=cpPt(e);if(!pt)return;e.preventDefault();
    CPD={k:t.dataset.cpdrag,x:pt.x,y:pt.y,sx:pt.x,sy:pt.y,moved:false};try{host.setPointerCapture(e.pointerId)}catch(_){}cpRedraw()});
  host.addEventListener('pointermove',e=>{if(!CPD)return;const pt=cpPt(e);if(!pt)return;CPD.x=pt.x;CPD.y=pt.y;if(Math.hypot(pt.x-CPD.sx,pt.y-CPD.sy)>5)CPD.moved=true;cpRedraw()});
  const cpEnd=e=>{if(!CPD)return;const d=CPD;CPD=null;if(e.type==='pointercancel'){cpRedraw();return}
    if(d.k==='ctH'||d.k==='ctA'){const A=d.k==='ctA';
      if(d.moved){const v=cpNear(cuTargets(d.k.slice(2)),d.x,d.y,26)||'none';if(A)CP.cu.at=v;else CP.ports.ct=v}
      else if(A?CP.cu.at!=='none':CP.ports.ct!=='none'){if(A)CP.cu.arrow=CP.cu.arrow==='ok'?'rev':'ok';else CP.ports.arrow=CP.ports.arrow==='ok'?'rev':'ok'}}
    else if(d.k==='portH'||d.k==='portA'){if(d.moved){const cand={};['H','A'].forEach(k=>{if(k==='H'||cuHasA())cand[k]=cuPos(k,null)});const v=cpNear(cand,d.x,d.y,24)||'none';if(d.k==='portH')CP.cu.lh=v;else CP.cu.la=v}}
    else if(d.k==='src'){if(d.moved)CP.ports.src=cpNear(CP_TS,d.x,d.y,28)||'none'}
    else if(d.moved)CP.ports.ct=cpNear(CP_TC,d.x,d.y,30)||'none';
    else if(CP.ports.ct!=='none')CP.ports.arrow=CP.ports.arrow==='ok'?'rev':'ok';
    cpChanged()};
  host.addEventListener('pointerup',cpEnd);host.addEventListener('pointercancel',cpEnd);
  host.addEventListener('click',e=>{
    if(hlClick(e,CP)){cpRender();return}
    const sm=e.target.closest('[data-cpsm]');if(sm){if(['home','padj','feat','meter'].includes(sm.dataset.cpsm)){CP.sm.scr=sm.dataset.cpsm;cpRender();if(typeof touch==='function')touch()}return}
    const t=e.target.closest('[data-cpsc],[data-cppg],[data-cpact]');if(!t)return;const d=t.dataset;
    if(d.cpsc){if(CP.sc!==d.cpsc){CP.sc=d.cpsc;cpReset(CP);CP.drill=null;CP.flash=''}cpChanged();return}
    if(d.cppg){CP.page=d.cppg;cpRender();if(typeof touch==='function')touch();return}
    if(d.cpact==='drill'){cpDrill();cpChanged()}
    else if(d.cpact==='drillend'){CP.drill=null;cpCorrect(CP);cpChanged()}
    else if(d.cpact==='reveal'){CP.reveal=true;cpRender()}
  });
  host.addEventListener('change',e=>{
    if(hlChange(e,CP)){const keep=document.activeElement&&document.activeElement.id;cpChanged();if(keep){const el=document.getElementById(keep);if(el&&el!==document.activeElement)try{el.focus()}catch(_){}}return}
    const t=e.target,d=t.dataset;
    if(d.cpp){CP.ports[d.cpp]=t.value;cpChanged();return}
    if(d.cpu){if(d.cpu==='at'&&CP_CT_OPTS.some(x=>x[0]===t.value))CP.cu.at=t.value;else if(d.cpu==='arrow'&&(t.value==='ok'||t.value==='rev'))CP.cu.arrow=t.value;cpChanged();return}
    if(d.cps){let v;if(t.type==='checkbox')v=t.checked;else if(t.type==='number'){v=+t.value;if(!isFinite(v))v=0;if(t.min!=='')v=Math.max(+t.min,v);if(t.max!=='')v=Math.min(+t.max,v)}else v=t.value;
      if(d.cps==='ctquick'){CP.ports.ct=v?'grid':'none';cpChanged();return}
      cpSetPath(d.cps,v);const keep=document.activeElement&&document.activeElement.id;cpChanged();
      if(keep){const el=document.getElementById(keep);if(el&&el!==document.activeElement)try{el.focus()}catch(_){}}}
  });
  host.addEventListener('input',e=>{if(e.target.dataset.cpt==null)return;CP.dash.t=+e.target.value;cpLive();clearTimeout(host._tt);host._tt=setTimeout(()=>{if(typeof touch==='function')touch()},400)});
}
function cpRenderTab(){cpEvents();cpRender()}
function cpSnapshot(){const o=JSON.parse(JSON.stringify(CP));delete o._c;return o}
function cpRestore(o){
  if(!o||typeof o!=='object')return;
  if(CP_SC[o.sc])CP.sc=o.sc;if(['job','host','src','dash','fault','custom'].includes(o.page))CP.page=o.page;
  cpReset(CP);
  if(o.ports){['src','ct'].forEach(k=>{const l=k==='src'?CP_SRC_OPTS:CP_CT_OPTS;if(l.some(x=>x[0]===o.ports[k]))CP.ports[k]=o.ports[k]});if(o.ports.arrow==='ok'||o.ports.arrow==='rev')CP.ports.arrow=o.ports.arrow}
  if(o.set&&o.set.src&&typeof o.set.src==='object')['pf','anti'].forEach(k=>{if(typeof o.set.src[k]==='boolean')CP.set.src[k]=o.set.src[k]});
  if(o.cu&&typeof o.cu==='object'){const c=o.cu;if(['none','grid','src','load'].includes(c.at))CP.cu.at=c.at;if(c.arrow==='ok'||c.arrow==='rev')CP.cu.arrow=c.arrow;if(['none','H','A'].includes(c.lh))CP.cu.lh=c.lh;if(['none','H','A'].includes(c.la))CP.cu.la=c.la}
  CP.hs=hlMerge(hlDef(CP_SC[CP.sc].host),o.hs);
  if(o.sm&&['home','padj','feat','meter'].includes(o.sm.scr))CP.sm.scr=o.sm.scr;
  if(o.lcd&&typeof o.lcd.scr==='string'&&/^[a-z]{2,10}$/.test(o.lcd.scr)){CP.lcd.scr=o.lcd.scr}
  if(o.dash&&typeof o.dash==='object')Object.keys(CP.dash).forEach(k=>{if(typeof o.dash[k]===typeof CP.dash[k])CP.dash[k]=o.dash[k]});
  CP.drill=Array.isArray(o.drill)?o.drill.filter(k=>CP_FAULTS[k]):null;
  if(o.done&&typeof o.done==='object')Object.keys(CP_SC).forEach(k=>CP.done[k]=!!o.done[k]);
  CP.diagOk=Math.max(0,o.diagOk|0);CP._c=null;
}
function cpSummary(){const s=cpScore();return{sc:CP.sc,pass:s.n,all:s.all,done:Object.keys(CP.done).filter(k=>CP.done[k]),diag:CP.diagOk}}
