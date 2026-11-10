/* ---- เมนู 18 Deye Commissioning: Hybrid (On-grid / Off-grid) และ Microinverter ----
   Hybrid อ้างอิง Deye SUN-3/3.6/5/6K-SG04LP1-EU-SM1/SM2 User Manual (2026-01, Drive: PV Datasheets/01 อินเวอร์เตอร์/Deye)
   3.4–3.7 ต่อแบต กริด/โหลดสำรอง PV และ CT · 4.1 Power ON/OFF · 5.1–5.12 จอ LCD และเมนู System Setup · 7 รหัส fault F-xx · 9 สเปก 6K
   Microinverter อ้างอิง SUN-M130/160/180/200G4-EU-Q0 (ไฟล์ deyemi.js)
   ค่าแผง โหลด และพฤติกรรมควบคุมเป็นแบบจำลองเพื่อการเรียนรู้ ไม่ใช่เฟิร์มแวร์จริง
   ผู้สอนเปิด/ปิดเมนูนี้ที่ dashboard (แผ่น "เมนู" ค่าเริ่ม = ปิด) */
const DY_HY={model:'SUN-6K-SG04LP1-EU-SM2',pac:6000,pvMax:9600,vmax:500,vstart:125,mLo:150,mHi:425,batI:135,loadPk:12000};
const DY_BAT={name:'Deye SE-G5.1 Pro-B 5.12 kWh × 2 ก้อน',v:51.2,kwh:10.24,iRec:100};
const DY_VOC=49.5,DY_WP=650; /* Voc ต่อแผงและกำลังต่อแผง (ค่าตัวอย่าง) */
const DY_SC={
  hon:{k:'hy',n:'Hybrid On-grid (ห้ามขายไฟ)',area:'PEA',s1:8,s2:6,bat:true,grid:true,load:true,ct:true,loadK:1,
    brief:'บ้านในพื้นที่ PEA แผง 14 แผง (สตริง 8 + 6) แบต Deye SE-G5.1 Pro-B 2 ก้อนขนาน (10.24 kWh, 51.2 V) ยังไม่ได้รับอนุญาตขายไฟย้อนเข้าระบบ ต้องใช้ไฟเองและชาร์จแบต จึงตั้ง Zero Export To CT สำรองแบตไว้ใช้ตอนไฟดับ โหลดสำคัญย้ายไปตู้ Backup ที่พอร์ต LOAD'},
  hsell:{k:'hy',n:'Hybrid On-grid (ขายไฟคืน)',area:'MEA',s1:8,s2:6,bat:true,grid:true,load:true,ct:true,loadK:1,
    brief:'บ้านในพื้นที่ MEA แผง 14 แผง แบตชุดเดียวกัน การไฟฟ้าอนุมัติขายไฟคืนไม่เกิน 5 kW เจ้าของต้องการขายไฟช่วงแดดจัด แต่ให้แบตเต็ม (SOC 80%) ภายในช่วงกลางวันแล้วเก็บไว้ใช้ตอนเย็น ตั้ง Selling First และ Time of Use'},
  hoff:{k:'hy',n:'Hybrid Off-grid',area:'',s1:8,s2:6,bat:true,grid:false,load:true,ct:false,loadK:0.5,
    brief:'บ้านสวนที่ไม่มีไฟการไฟฟ้า ใช้ไฟน้อยกว่าบ้านในเมือง แผง 14 แผง แบต Deye SE-G5.1 Pro-B 2 ก้อน โหลดทั้งบ้านอยู่ที่ตู้ Backup (พอร์ต LOAD) ไม่มี CT ตั้งหยุดจ่ายแบต (Shutdown) 15–30% และ Restart ให้สูงกว่าอย่างน้อย 10%'},
  mic:{k:'mi',n:'Microinverter (SUN-M200G4)',area:'PEA',
    brief:'บ้านในพื้นที่ PEA แผง 12 แผง (650 W) ใช้ไมโครอินเวอร์เตอร์ Deye SUN-M200G4-EU-Q0 (4 แผงต่อ 1 ตัว) ต่อพ่วงสาย AC สายย่อยเดียว ขายไฟคืนได้ ติดตั้ง ตรวจวัด เปิดระบบตามขั้นตอนของคู่มือ และเช็กไฟ LED สถานะ'}
};
const DY_HPORTS=[
  ['pv1','PV1 (MPPT1)',[['none','ว่าง'],['str','สตริงแผง']]],
  ['pv2','PV2 (MPPT2)',[['none','ว่าง'],['str','สตริงแผง']]],
  ['bat','Battery input',[['none','ว่าง'],['bat','แบต ผ่านเบรกเกอร์ DC']]],
  ['grid','GRID L N PE',[['none','ว่าง'],['main','ตู้เมน (ผ่านเบรกเกอร์ AC 40 A)'],['bpanel','ตู้โหลด Backup']]],
  ['load','LOAD L N PE',[['none','ว่าง'],['main','ตู้เมน (ผ่านเบรกเกอร์ AC 40 A)'],['bpanel','ตู้โหลด Backup']]],
  ['ct','CT (Function port ขา 3–4)',[['none','ไม่ติด'],['grid','สายเมนที่จุดเชื่อมต่อการไฟฟ้า']]],
  ['ctArrow','ทิศลูกศร CT',[['inv','ชี้ไปทางอินเวอร์เตอร์'],['grid','ชี้ไปทางการไฟฟ้า']]],
  ['ctWire','สาย CT',[['ok','ขาว → ขา 3, ดำ → ขา 4'],['swap','ขาว → ขา 4, ดำ → ขา 3']]],
  ['bms','RS485/CAN port (RJ45)',[['none','ว่าง'],['can','สาย CAN ไป BMS แบต']]]
];
const DY_HFAULTS={
  ct_rev:{n:'CT ติดกลับทิศ (ลูกศรชี้ผิดทาง)',need:'ct'},
  ct_open:{n:'สาย CT หลุดจากขั้ว Function port',need:'ct'},
  pv1_ovr:{n:'สตริง PV1 ต่ออนุกรมเกิน (Voc เกิน 500 V)',need:''},
  pv2_rev:{n:'สตริง PV2 เข้าขั้วกลับ',need:'s2'},
  bat_off:{n:'ฟิวส์/เบรกเกอร์ DC ของแบตขาด ไม่มีแรงดันถึงขั้วแบต',need:'bat'},
  can_pin:{n:'สาย CAN ลำดับ pin ไม่ตรงกับแบต',need:'bat'},
  ld_grid:{n:'พอร์ต LOAD ถูกต่อเข้าตู้เมนที่มีไฟกริด',need:'gridld'},
  ln_swap:{n:'สาย GRID สลับ L กับ N',need:'grid'},
  pe_open:{n:'ไม่ได้ต่อสายดิน PE ที่ตัวเครื่อง',need:''}
};
const DY_PRE=['ไม่มีตัวนำแรงดันสูงที่มีไฟอยู่ ปิดเบรกเกอร์ทุกตัวแล้ว','จุดต่อสายและท่อทุกจุดขันแน่นตามแรงบิด','มีที่ว่างระบายอากาศรอบเครื่อง','ไล่สายทุกเส้นถึงขั้วที่ถูกต้อง (PV, BAT, GRID, LOAD, CT, CAN)','ต่อสายดิน PE ที่ตัวเครื่องแล้ว (6 mm²)','ติดป้ายเตือนและฉลากครบ','เตรียมมัลติมิเตอร์วัด AC/DC'];
const DY_MPT=[['pv1','PV1 + / − (ที่ปลาย MC4)','dc'],['pv2','PV2 + / − (ที่ปลาย MC4)','dc'],['bat','ขั้ว BAT+ / BAT−','dc'],['gLN','GRID L–N','ac'],['gLPE','GRID L–PE','ac'],['gNPE','GRID N–PE','ac'],['ldLN','LOAD L–N (เครื่องปิด)','ac'],['pe','ความต่อเนื่อง PE ตัวเครื่อง–บาร์กราวด์','ohm'],['ctLook','ตรวจด้วยตา: CT และสาย','look'],['canLook','ตรวจด้วยตา: หัว RJ45 สาย CAN','look']];
const DY_GMODES=['General Standard','VDE4105','EN50549_CZ','CEI 0-21','NRS097','G98/G99','Australia_A','NewZealand'];
const DY_BATM=[['v','Use Batt V (ตะกั่วกรด/แรงดัน)'],['pct','Use Batt % (SOC)'],['lith','Lithium (สื่อสาร BMS)'],['nobatt','No Batt']];
const DY_WMODES=[['sell','Selling First'],['zeroLoad','Zero Export To Load'],['zeroCT','Zero Export To CT']];
const DY_DEFTP=()=>[1,5,9,13,17,21].map(h=>({h,p:6000,soc:50,grid:false}));
const DY_DEFSET=()=>({time:false,
  bat:{mode:'v',code:'00',chgA:40,disA:40,shutdown:20,low:35,restart:50,gridChg:false,gridA:40,gridStart:30},
  work:{mode:'zeroLoad',sell:false,maxSell:5000,zeroPwr:20,pattern:'batt',maxSolar:5000,peak:false,peakW:5000,tou:false,tp:DY_DEFTP()},
  grid:{unlock:false,mode:'General Standard',hz:60,volt:'240',type:'single'},
  adv:{exMeter:false,bmsErr:true}});
const DY_DEFPORTS=()=>({pv1:'none',pv2:'none',bat:'none',grid:'none',load:'none',ct:'none',ctArrow:'grid',ctWire:'ok',bms:'none'});
const DY={sys:'hon',page:'job',ports:DY_DEFPORTS(),sw:{bat:false,dc:false,grid:false,load:false,pwr:false},pre:[],log:[],mlast:null,
  lcd:{scr:'home',stack:[],nav:0,pwd:''},set:DY_DEFSET(),dash:{t:600,out:true,o0:18,o1:22,cloud:0,extra:0,soc0:50},
  faults:[],pick:[],tries:0,diagOk:0,reveal:false,done:{},_day:null,_fres:null};
let dyPlayT=0;

const dyTeacher=()=>(typeof TEACH!=='undefined'&&TEACH.on)||(typeof ACC!=='undefined'&&(!ACC.enabled||ACC.role==='teacher'));
const dySc=()=>DY_SC[DY.sys];
const dyIsMi=()=>dySc().k==='mi';
const dyFL=()=>dyIsMi()?DM_FAULTS:DY_HFAULTS;
const dyF=(v,d=0)=>(+v).toLocaleString('th-TH',{minimumFractionDigits:d,maximumFractionDigits:d});
const dyHM=m=>String(Math.floor(m/60)%24).padStart(2,'0')+':'+String(Math.round(m%60)).padStart(2,'0');
const dySun=h=>h<=6||h>=18?0:Math.pow(Math.sin(Math.PI*(h-6)/12),1.25);
function dyLoad(h){let w=380;if(h>=6&&h<8)w+=900;if(h>=10&&h<16)w+=700;if(h>=12&&h<13)w+=600;if(h>=18&&h<22.5)w+=1900;return w}
function dyApplies(k,sc){const n=DY_HFAULTS[k].need;return !n||(n==='ct'&&sc.ct)||(n==='s2'&&sc.s2>0)||(n==='bat'&&sc.bat)||(n==='grid'&&sc.grid)||(n==='gridld'&&sc.grid&&sc.load)}
function dyWant(sc){return{pv1:'str',pv2:sc.s2?'str':'none',bat:sc.bat?'bat':'none',grid:sc.grid?'main':'none',load:sc.load?'bpanel':'none',ct:sc.ct?'grid':'none',ctArrow:'inv',ctWire:'ok',bms:sc.bat?'can':'none'}}
function dyTou(h){
  const W=DY.set.work;if(!W.tou)return null;
  const tp=W.tp.slice().sort((a,b)=>a.h-b.h);let cur=tp[tp.length-1];tp.forEach(p=>{if(p.h<=h)cur=p});return cur;
}

/* ---- ของจริงที่หน้างาน = พอร์ตที่เลือก + ข้อผิดพลาดแฝงของโจทย์ ---- */
function dyPhys(h,o={}){
  const sc=dySc(),F=new Set(DY.faults),a=Object.assign({},DY.ports),S=DY.set,sw=DY.sw;
  if(F.has('ct_rev'))a.ctArrow=a.ctArrow==='inv'?'grid':'inv';
  if(F.has('ld_grid')&&a.load==='bpanel')a.load='main';
  const lit=dySun(h)>0||(h>5.75&&h<18.25);
  const n1=a.pv1==='str'?(F.has('pv1_ovr')?11:sc.s1):0,n2=a.pv2==='str'?sc.s2:0;
  const v1=lit?n1*DY_VOC:0,v2=lit?(F.has('pv2_rev')?-1:1)*n2*DY_VOC:0;
  const batIn=a.bat==='bat'&&sc.bat,batOn=batIn&&sw.bat&&!F.has('bat_off');
  const soc=o.soc!=null?o.soc:DY.dash.soc0;
  const vb=batOn?DY_BAT.v*(0.94+0.08*soc/100):0;
  const gridLive=sc.grid&&!o.out,gridAt=a.grid==='main'&&gridLive&&sw.grid;
  const bkGrid=a.load==='main'&&gridLive;
  const ln=F.has('ln_swap'),pe=!F.has('pe_open');
  let ctS=0;
  if(!S.adv.exMeter&&a.ct==='grid'&&!F.has('ct_open'))ctS=(a.ctArrow==='inv'?1:-1)*(a.ctWire==='ok'?1:-1);
  const canOk=a.bms==='can'&&!F.has('can_pin');
  const pvOver=Math.max(v1,v2)>DY_HY.vmax;
  const ok1=v1>=DY_HY.mLo&&v1<=DY_HY.vmax,ok2=v2>=DY_HY.mLo&&v2<=DY_HY.vmax;
  const powered=(sw.dc&&(v1>=DY_HY.vstart||v2>=DY_HY.vstart))||vb>=40||gridAt;
  return{a,F,sc,n1,n2,v1,v2,ok1,ok2,batIn,batOn,vb,gridLive,gridAt,bkGrid,ln,pe,ctS,canOk,pvOver,powered,op:powered&&sw.pwr};
}
function dyAlarms(P,o={}){
  const S=DY.set,L=[],add=(c,d,sev)=>L.push({c,d,sev:sev||'warn'});
  if(!P.powered)return L;
  if(P.pvOver&&DY.sw.dc)add('F55','DC voltage is too high: แรงดันสตริงเกิน 500 V ตรวจจำนวนแผงต่ออนุกรมในสตริง','stop');
  if(P.bkGrid)add('LOAD-GRID','มีแรงดันภายนอกเข้าพอร์ต LOAD ตรวจสายตู้ Backup (ข้อความของแบบจำลอง ไม่มีรหัสในคู่มือ)','stop');
  if(S.bat.mode!=='nobatt'&&!P.batOn)add('BAT-0V','ไม่มีแรงดันที่ขั้วแบต ตรวจเบรกเกอร์/ฟิวส์ DC ของแบต (ข้อความของแบบจำลอง)');
  if(P.batOn&&S.bat.mode==='lith'&&!P.canOk)add('F58','BMS communication fault: การสื่อสารกับแบตขาด ตรวจสาย CAN และ Lithium Mode',S.adv.bmsErr?'stop':'warn');
  if(S.grid.hz!==50&&P.gridAt)add('F48','AC lower frequency: ตั้ง Grid Frequency ไม่ตรงกับกริด 50 Hz (ข้อ 5.8)','stop');
  if(P.sc.grid&&!P.gridAt&&P.powered&&!o.island)add('F35','No AC grid: ไม่มีไฟกริดที่ขั้ว GRID ตรวจเบรกเกอร์และการต่อสาย');
  if(o.ovl)add('F34','AC Overcurrent fault: โหลด Backup เกินกำลังเครื่อง','stop');
  return L;
}
/* ---- จำลองทั้งวัน ทีละ 5 นาที ---- */
function dyStep(h,soc,out,off){
  const P=dyPhys(h,{out,soc}),S=DY.set,sc=P.sc,D=DY.dash,cap=DY_BAT.kwh*1000,dt=1/12,W=S.work;
  const r={h,pv:0,lb:0,lg:0,grid:0,gridSeen:0,bat:0,soc,soc2:soc,cut:0,unsB:0,unsG:0,st:'off',al:[],P,off:!!off};
  const load=dyLoad(h)*(sc.loadK||1),share=!sc.grid?1:(P.a.load==='bpanel'?0.55:0);
  let lb=load*share+(P.a.load==='bpanel'?D.extra:0),lg=sc.grid?load*(1-share):0;
  r.lb=lb;r.lg=lg;
  const base=dyAlarms(P,{island:out});
  const dead=st=>{r.st=st;r.unsB=lb;r.lb=0;if(P.gridLive&&P.a.grid==='main')r.grid=lg;else{r.unsG=lg;r.lg=0}r.al=base;return r};
  if(!P.op||base.some(x=>x.sev==='stop'))return dead(P.op?'stop':'off');
  const sun=dySun(h)*(1-D.cloud/100);
  const pvCap=Math.min(W.maxSolar,DY_HY.pvMax);
  let pv=DY.sw.dc?Math.min(pvCap,((P.ok1?P.n1:0)+(P.ok2?P.n2:0))*DY_WP*sun*0.62):0;
  const B=S.bat;
  const batUse=P.batOn&&B.mode!=='nobatt'&&(B.mode!=='lith'||P.canOk);
  const island=!P.gridAt;
  const floor=island?B.shutdown:(B.gridChg?B.low:B.shutdown);
  const chgMax=batUse&&soc<100?Math.min(Math.min(B.chgA,DY_HY.batI)*DY_BAT.v,(100-soc)/100*cap/dt):0;
  const disMax=batUse&&soc>floor?Math.min(Math.min(B.disA,DY_HY.batI)*DY_BAT.v,(soc-floor)/100*cap/dt):0;
  let b=0,cut=0;const o={};
  if(island){
    r.st='island';
    if(off&&soc<B.restart||batUse&&soc<=B.shutdown+0.0001){
      r.off=true;r.st='lowbat';r.unsB=lb;lb=0;const c=Math.min(pv,chgMax);b=c;cut=pv-c;
    }else{
      r.off=false;
      if(lb>DY_HY.pac*1.02){o.ovl=true;r.unsB=lb;lb=0}
      const net=lb-pv;
      if(net>0){const d=Math.min(net,disMax,DY_HY.pac);b=-d;if(net-d>5){r.unsB=net-d;lb-=net-d}}
      else{const E=-net,c=Math.min(E,chgMax);b=c;cut=E-c}
    }
    if(P.gridLive&&P.a.grid==='main')r.grid=lg;else{r.unsG=lg;lg=0}
    pv-=cut;
    r.pv=pv;r.cut=cut;r.bat=b;r.lb=lb;r.lg=lg;r.gridSeen=P.ctS*r.grid;
    r.soc2=Math.max(0,Math.min(100,soc+b*dt/cap*100));
    r.al=base.concat(dyAlarms({powered:true,sc,a:P.a,gridAt:P.gridAt,batOn:P.batOn,canOk:P.canOk},{ovl:o.ovl,island:true}).filter(x=>x.c==='F34'));
    return r;
  }
  r.st='grid';
  const tp=dyTou(h);let allowDis=true,disCap=disMax,gridCharge=0;
  if(W.tou&&tp){if(soc>=tp.soc){disCap=Math.min(disMax,tp.p)}else{allowDis=false;if(tp.grid&&batUse)gridCharge=chgMax}}
  let bc=0;
  if(W.pattern==='batt'&&W.mode!=='sell'&&!(W.tou&&tp)&&batUse)bc=Math.min(pv,chgMax);
  const pvL=pv-bc,real=lb+lg-pvL;
  if(P.ctS===-1){b=real>0?chgMax:-Math.min(disMax,DY_HY.pac)}
  else{
    const net=P.ctS===1?real:lb-pvL;
    if(net<0){
      let rem=-net,ex=0,c=0;
      const sellOk=W.mode==='sell'||W.sell,lim=sellOk?W.maxSell:0;
      if(W.mode==='sell'){ex=Math.min(rem,lim);rem-=ex;c=Math.min(rem,Math.max(0,chgMax-bc));rem-=c}
      else{c=Math.min(rem,Math.max(0,chgMax-bc));rem-=c;ex=Math.min(rem,lim);rem-=ex}
      if(P.ctS===0)rem=0;
      cut=Math.min(rem,pvL);b=bc+c;
    }else{
      const d=bc>0||!allowDis?0:Math.min(net,disCap,DY_HY.pac);
      b=bc-d;
    }
  }
  if(gridCharge>0)b=Math.max(b,Math.min(gridCharge,chgMax));
  if(!(W.tou&&tp)&&B.gridChg&&batUse&&soc<B.gridStart)b=Math.max(b,Math.min(B.gridA*DY_BAT.v,chgMax));
  if(W.peak&&b>0){const g=lb+lg-(pv-cut)+b;if(g>W.peakW)b=Math.max(0,b-(g-W.peakW))}
  pv-=cut;
  r.pv=pv;r.cut=cut;r.bat=b;r.lb=lb;r.lg=lg;r.grid=lb+lg-pv+b;r.gridSeen=P.ctS*r.grid;
  r.soc2=Math.max(0,Math.min(100,soc+b*dt/cap*100));
  r.al=base;
  return r;
}
function dyDay(){
  if(DY._day)return DY._day;
  const D=DY.dash,rows=[],T={pv:0,load:0,imp:0,exp:0,chg:0,dis:0,cut:0,unsB:0,unsBo:0,maxExp:0},al={};
  let soc=D.soc0,off=false;
  for(let i=0;i<288;i++){const h=i/12,r=dyStep(h,soc,D.out&&h>=D.o0&&h<D.o1,off);soc=r.soc2;off=r.off}
  const soc00=soc;
  for(let i=0;i<288;i++){const h=i/12,out=D.out&&h>=D.o0&&h<D.o1,r=dyStep(h,soc,out,off);r.out=out;rows.push(r);soc=r.soc2;off=r.off;
    const k=1/12/1000;T.pv+=r.pv*k;T.load+=(r.lb+r.lg)*k;if(r.grid>0)T.imp+=r.grid*k;else{T.exp+=-r.grid*k;T.maxExp=Math.max(T.maxExp,-r.grid)}
    if(r.bat>0)T.chg+=r.bat*k;else T.dis+=-r.bat*k;T.cut+=r.cut*k;T.unsB+=r.unsB*k;if(out)T.unsBo+=r.unsB*k;
    r.al.forEach(x=>{if(!al[x.c])al[x.c]=Object.assign({t:h},x)})}
  return DY._day={rows,T,al:Object.values(al),soc00};
}
const dyNow=()=>{const d=dyDay();return d.rows[Math.max(0,Math.min(287,Math.round(DY.dash.t/5)))]};

/* ---- ขั้นตอน Power ON (ข้อ 4.1 + ลำดับของใบงาน) ---- */
function dyProc(){
  const sc=dySc(),strs=[sc.s1?'pv1':null,sc.s2?'pv2':null].filter(Boolean);
  const st={pv:new Set(),bat:false,ac:new Set(),acOff:false,dcOn:false,on:false,ld:false},bad=[];
  DY.log.forEach(e=>{
    if(e.k==='meas'){
      if(strs.includes(e.n)&&!e.dc&&!st.dcOn)st.pv.add(e.n);
      if(e.n==='bat'&&e.bat&&!st.dcOn)st.bat=true;
      if(['gLN','gLPE','gNPE'].includes(e.n)&&e.grid&&!st.dcOn)st.ac.add(e.n);
    }
    if(e.k==='sw'){
      if(e.n==='dc'&&e.v){if(!st.dcOn&&strs.some(s=>!st.pv.has(s)))bad.push('เปิด DC switch ก่อนวัดแรงดันและขั้ว PV ครบทุกสตริง');st.dcOn=true}
      if(e.n==='grid'&&!e.v&&st.ac.size===3&&!st.dcOn)st.acOff=true;
      if(e.n==='grid'&&e.v&&!st.dcOn&&st.acOff&&st.ac.size===3)bad.push('เปิดเบรกเกอร์ GRID ค้างไว้ก่อนเปิด DC switch (ลำดับของใบงาน: DC switch ก่อน แล้วจึงเปิด GRID)');
      if(e.n==='load'&&e.v){if(!e.cfg)bad.push('เปิดเบรกเกอร์ตู้ Backup ก่อนตั้งค่าที่หน้าจอครบ');else st.ld=true}
    }
  });
  const sw=DY.sw,lcd=dyLcd().every(x=>x[0]);
  const steps=[['pre','ตรวจความพร้อมก่อนเปิดเครื่องครบ '+DY_PRE.length+' ข้อ',DY.pre.length===DY_PRE.length]];
  steps.push(['pv','DC switch ปิดอยู่ วัดแรงดันและขั้ว PV ทุกสตริงที่ต่อ',strs.every(s=>st.pv.has(s))]);
  if(sc.bat)steps.push(['bat','เปิดเบรกเกอร์แบต แล้ววัดแรงดันและขั้วที่ขั้ว BAT',st.bat]);
  if(sc.grid)steps.push(['ac','เปิดเบรกเกอร์ GRID วัด L–N, L–PE, N–PE แล้วปิดไว้ก่อน',st.ac.size===3&&st.acOff]);
  steps.push(['on',sc.grid?'เปิด DC switch → เปิดเบรกเกอร์ GRID → กดปุ่ม ON/OFF ที่เครื่อง':'เปิด DC switch → กดปุ่ม ON/OFF ที่เครื่อง',st.dcOn&&sw.dc&&(!sc.grid||sw.grid)&&sw.pwr]);
  steps.push(['cfg','ตั้งค่าที่หน้าจอ LCD ครบตามใบสั่งงาน (หน้า 3)',lcd]);
  if(sc.load)steps.push(['ld','ตั้งค่าเสร็จแล้ว จึงเปิดเบรกเกอร์ตู้โหลด Backup (LOAD)',st.ld&&sw.load]);
  return{steps,bad:[...new Set(bad)]};
}
/* ลำดับปิดเครื่อง: ปุ่ม ON/OFF → เบรกเกอร์ AC → DC switch → เบรกเกอร์แบต */
function dyOffSeq(){
  const offs=[];let lastOn=-1;
  DY.log.forEach((e,i)=>{if(e.k==='sw'&&e.v)lastOn=i});
  DY.log.slice(lastOn+1).forEach(e=>{if(e.k==='sw'&&!e.v&&['pwr','grid','dc','bat'].includes(e.n))offs.push(e.n)});
  return offs;
}
function dyOffOk(o){const need=['pwr','grid','dc','bat'].filter(k=>o.includes(k));const idx=need.map(k=>o.indexOf(k));return idx.every((v,i)=>i===0||v>idx[i-1])}

/* ---- เกณฑ์ตรวจ ---- */
function dyLcd(){
  const sc=dySc(),S=DY.set,B=S.bat,W=S.work,G=S.grid,out=[],H=(ok,t)=>out.push([ok,t]);
  H(S.time,'ตั้งวันและเวลาเครื่อง (Basic Setup)');
  H(G.mode==='General Standard'&&G.hz===50&&G.volt==='230'&&G.type==='single','Grid Setup: Grid Mode General Standard · 50 Hz · INV Output Voltage 230 V · Single Phase');
  H(B.mode==='lith'&&B.code==='00','Battery Setup: Batt Mode = Lithium และ Lithium Mode = 00 (Deye SE-G5.1 Pro-B สื่อสาร BMS)');
  H(B.chgA>=20&&B.disA>=20&&B.chgA<=DY_BAT.iRec&&B.disA<=DY_BAT.iRec,'Max A Charge / Discharge 20–100 A (แบต 2 ก้อน แนะนำ 50 A ต่อก้อน และไม่เกิน 135 A ของเครื่อง)');
  if(sc.grid)H(B.shutdown<B.low&&B.low<=B.restart,'Shutdown < Low Batt ≤ Restart (Batt Set3)');
  else H(B.shutdown>=15&&B.shutdown<=30&&B.restart>=B.shutdown+10,'Off-grid: Shutdown 15–30% และ Restart สูงกว่า Shutdown อย่างน้อย 10%');
  H(W.maxSolar>=9000&&W.maxSolar<=DY_HY.pvMax,'Max Solar Power 9,000–9,600 W (เปิดให้แผง 14 แผงทำงานได้เต็มที่)');
  if(DY.sys==='hon'){
    H(W.mode==='zeroCT','System Work Mode: Zero Export To CT (ใช้ CT ที่จุดเชื่อมต่อกริด)');
    H(!W.sell,'Solar Sell ปิด (ห้ามขายไฟย้อนเข้าระบบ)');
    H(W.zeroPwr>=20&&W.zeroPwr<=100,'Zero-export Power 20–100 W (ค่าแนะนำในคู่มือข้อ 5.7)');
    H(W.pattern==='load','Energy Pattern = Load First (PV จ่ายโหลดก่อนชาร์จแบต)');
    H(!S.adv.exMeter,'Advanced Function: ไม่ติ๊ก Ex_Meter For CT (ใช้ CT ไม่ใช้สมาร์ทมิเตอร์)');
  }
  if(DY.sys==='hsell'){
    H(W.mode==='sell','System Work Mode: Selling First');
    H(W.maxSell>0&&W.maxSell<=5000,'Max Sell Power ไม่เกิน 5,000 W ตามที่การไฟฟ้าอนุมัติ');
    H(W.tou,'เปิด Time of Use');
    const mid=dyTouAt(W,12),eve=dyTouAt(W,20);
    H(mid&&mid.soc>=80,'Time of Use: ช่วงเวลา 12:00 ตั้ง Batt SOC เป้าหมาย ≥ 80% (แบตเต็มช่วงกลางวัน)');
    H(eve&&eve.soc<=35&&eve.p>=3000,'Time of Use: ช่วงเวลา 20:00 ตั้ง Batt SOC เป้าหมาย ≤ 35% และ Power ≥ 3,000 W (จ่ายแบตตอนเย็น)');
    H(!S.adv.exMeter,'Advanced Function: ไม่ติ๊ก Ex_Meter For CT (ใช้ CT ไม่ใช้สมาร์ทมิเตอร์)');
  }
  return out;
}
function dyTouAt(W,h){const tp=W.tp.slice().sort((a,b)=>a.h-b.h);let cur=tp[tp.length-1];tp.forEach(p=>{if(p.h<=h)cur=p});return cur}
function dyHChecks(){
  const sc=dySc(),want=dyWant(sc),p=DY.ports,out={job:[],pwr:[],lcd:[],dash:[]};
  const J=(ok,t,lvl)=>out.job.push([ok,t,lvl]);
  const used={};['grid','load'].forEach(k=>{if(p[k]!=='none')(used[p[k]]=used[p[k]]||[]).push(k)});
  Object.entries(used).forEach(([d,ks])=>{if(ks.length>1)J(false,`อุปกรณ์เดียวกันต่อหลายพอร์ต (${ks.map(k=>k.toUpperCase()).join(', ')})`,'err')});
  if(p.load==='main')J(false,'ห้ามต่อพอร์ต LOAD เข้าตู้เมนที่มีไฟกริด','err');
  if(p.grid==='bpanel')J(false,'ตู้โหลด Backup ต้องต่อที่พอร์ต LOAD ไม่ใช่ GRID','err');
  J(p.pv1==='str'&&p.pv2===want.pv2,`PV: ${sc.s2?'สตริง 8 แผงเข้า PV1 และ 6 แผงเข้า PV2':'สตริง 8 แผงเข้า PV1 (PV2 ว่าง)'}`);
  J(p.bat===want.bat,'ต่อแบตเข้า Battery input ผ่านเบรกเกอร์ DC');
  J(p.bms===want.bms,'ต่อสาย CAN เข้า BMS (RS485/CAN port)');
  J(p.grid===want.grid,sc.grid?'GRID ต่อตู้เมนผ่านเบรกเกอร์ AC 40 A':'ไม่มีไฟการไฟฟ้า GRID ว่าง');
  J(p.load===want.load,'LOAD ต่อตู้โหลด Backup ผ่านเบรกเกอร์ AC 40 A');
  if(sc.ct){J(p.ct==='grid','ติด CT ที่สายเมน (L) ตรงจุดเชื่อมต่อการไฟฟ้า');J(p.ct==='grid'&&p.ctArrow==='inv','ลูกศร CT ชี้ไปทางอินเวอร์เตอร์ (คู่มือข้อ 3.7)');J(p.ct==='grid'&&p.ctWire==='ok','สาย CT ขาว → ขา 3, ดำ → ขา 4')}
  else J(p.ct==='none','ไม่มีกริด ไม่ต้องติด CT');
  const pr=dyProc();pr.steps.forEach(s=>out.pwr.push([s[2],s[1]]));pr.bad.forEach(t=>out.pwr.push([false,t,'err']));
  dyLcd().forEach(x=>out.lcd.push(x));
  const d=dyDay(),T=d.T,stop=d.al.filter(a=>a.sev==='stop'),Dd=(ok,t)=>out.dash.push([ok,t]);
  Dd(d.rows.some(r=>r.st==='grid'||r.st==='island'),'อินเวอร์เตอร์ทำงานได้ (เปิดเครื่องและตั้งค่าแล้ว)');
  Dd(!stop.length,'ไม่มี alarm ที่ทำให้เครื่องหยุด'+(stop.length?` (${stop.map(a=>a.c).join(', ')})`:''));
  if(sc.ct)Dd(d.rows.every(r=>r.st!=='grid'||r.P.ctS===1),'CT วัดทิศถูกต้อง (ค่ากริดบนจอตรงกับของจริง)');
  if(DY.sys==='hon')Dd(T.exp<=0.05&&T.chg>2,`ไม่มีไฟย้อนเข้ากริด (${dyF(T.exp,2)} kWh) และชาร์จแบตจากแผง (${dyF(T.chg,1)} kWh)`);
  if(DY.sys==='hsell')Dd(T.exp>0.5&&T.maxExp<=5050&&T.dis>2,`ขายไฟได้ ไม่เกิน 5 kW (สูงสุด ${dyF(T.maxExp)} W) และจ่ายแบตตอนเย็น (${dyF(T.dis,1)} kWh)`);
  if(sc.grid&&sc.load)Dd(DY.dash.out&&DY.dash.o1-DY.dash.o0>=3&&T.unsBo<0.01,'ทดสอบไฟดับอย่างน้อย 3 ชม. แล้วโหลด Backup ไม่ดับ');
  if(!sc.grid)Dd(T.unsB<0.01,'โหลดทั้งบ้านมีไฟตลอดวัน (ไม่ตัดที่ Shutdown)');
  return out;
}
function dyChecks(){return dyIsMi()?dmChecks():dyHChecks()}
function dyScore(){const c=dyChecks(),all=[...c.job,...c.pwr,...(c.lcd||[]),...c.dash];const n=all.filter(x=>x[0]).length;return{c,n,all:all.length,ok:n===all.length}}
function dyDoneCount(){return Object.values(DY.done).filter(Boolean).length}

/* ---- render ---- */
function dyPages(){return dyIsMi()?[['job','1 ใบสั่งงานและการติดตั้ง'],['power','2 ตรวจวัดและเปิดระบบ'],['dash','3 ผลผลิตและทดสอบ'],['fault','4 โจทย์หาข้อผิดพลาด']]:[['job','1 ใบสั่งงานและการต่อพอร์ต'],['power','2 ตรวจวัดและ Power ON/OFF'],['lcd','3 หน้าจอ LCD และการตั้งค่า'],['dash','4 แดชบอร์ดและทดสอบ'],['fault','5 โจทย์หาข้อผิดพลาด']]}
function dyChanged(full){DY._day=null;if(typeof DM!=='undefined')DM._day=null;const s=dyScore();if(s.ok&&!DY.faults.length&&!DY.done[DY.sys])DY.done[DY.sys]=true;
  if(full!==false)dyRender();else dyLive();if(typeof touch==='function')touch()}
const dyList=arr=>`<ul class="slchk">${arr.map(([ok,t,l])=>`<li class="${ok?'ok':l==='err'?'err':''}">${esc(t)}</li>`).join('')}</ul>`;
function dyRender(){
  const host=document.getElementById('dyhost');if(!host)return;
  const s=dyScore(),sc=dySc();
  if(!dyPages().some(p=>p[0]===DY.page))DY.page='job';
  const pg=DY.page;
  host.innerHTML=`<div class="verdict ${s.ok?'ok':s.n/s.all>.6?'warn':'err'}"><b>${esc(sc.n)}</b><span>${s.ok?'ผ่านครบทุกข้อ':'ผ่าน '+s.n+' / '+s.all+' ข้อ'}</span>${DY.faults.length?'<span class="pill warn">มีโจทย์หาข้อผิดพลาด</span>':''}<span class="nums">${dyIsMi()?esc(DM_MI.model):esc(DY_HY.model)} · ผ่านแล้ว ${dyDoneCount()}/4 ระบบ</span></div>
  <div class="bar"><div class="grp" role="group" aria-label="ระบบ"><span class="lab">ระบบ</span>${Object.entries(DY_SC).map(([k,v])=>`<button class="chip" data-dysc="${k}" aria-pressed="${DY.sys===k}">${DY.done[k]?'✓ ':''}${esc(v.n)}</button>`).join('')}</div></div>
  <div class="bar"><div class="grp" role="group" aria-label="ขั้นตอน">${dyPages().map(([k,t])=>`<button class="chip" data-dypg="${k}" aria-pressed="${pg===k}">${t}</button>`).join('')}</div></div>
  <div id="dypage">${dyIsMi()?dmPage(pg,s):pg==='job'?dyPgJob(s):pg==='power'?dyPgPower(s):pg==='lcd'?dyPgLcd(s):pg==='dash'?dyPgDash(s):dyPgFault()}</div>`;
  dyLive();
}
function dyPgJob(s){
  const sc=dySc(),p=DY.ports;
  return `<div class="cards"><div class="card"><h3>ใบสั่งงาน: ${esc(sc.n)}</h3><p class="sltxt">${esc(sc.brief)}</p>
    <table class="t"><tbody><tr><th>อินเวอร์เตอร์</th><td>${DY_HY.model} 6 kW 1 เฟส</td></tr><tr><th>แผง</th><td>${DY_WP} W · Voc ${DY_VOC} V (ตัวอย่าง)</td></tr><tr><th>PV สูงสุด / MPPT</th><td>500 V · MPPT 150–425 V × 2 · เริ่มทำงาน 125 V</td></tr><tr><th>แบต</th><td>${DY_BAT.name}</td></tr><tr><th>พื้นที่</th><td>${sc.area||'ไม่มีกริด'}</td></tr></tbody></table></div>
   <div class="card"><h3>ต่ออุปกรณ์เข้าพอร์ตของเครื่อง</h3><div class="slports">${DY_HPORTS.map(([k,l,opts])=>`<label class="slport"><span>${esc(l)}</span><select data-dyp="${k}" id="dyp-${k}">${opts.map(([v,t])=>`<option value="${v}" ${p[k]===v?'selected':''}>${esc(t)}</option>`).join('')}</select></label>`).join('')}</div>
   <p class="hint tight">ผังตามคู่มือข้อ 3.4–3.7: GRID → เบรกเกอร์ AC 40 A ในตู้เมน · LOAD → ตู้โหลด Backup (ห้ามต่อกับกริด) · CT ที่สาย L ฝั่งกริด ลูกศรชี้ไปทางอินเวอร์เตอร์ · CAN เข้า BMS แบต</p></div></div>
   <div class="cards"><div class="card"><h3>ผังระบบ</h3>${dySLD()}</div><div class="card"><h3>ตรวจการต่อพอร์ต</h3>${dyList(s.c.job)}</div></div>`;
}
function dySLD(){
  const p=DY.ports,sc=dySc(),W=640,Hh=300,box=(x,y,w,h,t,sub,on)=>`<g opacity="${on?1:.35}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" class="slnode"/><text x="${x+w/2}" y="${y+h/2-2}" class="svgt b" text-anchor="middle">${t}</text>${sub?`<text x="${x+w/2}" y="${y+h/2+15}" class="svgt mut" text-anchor="middle" font-size="11">${sub}</text>`:''}</g>`;
  const ln=(x1,y1,x2,y2,cls,on)=>on?`<path d="M${x1} ${y1} L${x2} ${y2}" class="slline ${cls}"/>`:'';
  const ix=250,iy=95,iw=140,ih=110;
  const dev={main:[500,30,'ตู้เมน','เบรกเกอร์ 40 A'],bpanel:[500,200,'ตู้ Backup','โหลดสำคัญ']};
  const portY={grid:125,load:170};
  let lines='',boxes='';
  ['grid','load'].forEach(k=>{const d=p[k];if(d==='none')return;const D=dev[d];lines+=ln(ix+iw,portY[k],D[0],D[1]+24,k==='load'&&d==='main'?'bad':'ac',true)+`<text x="${ix+iw+8}" y="${portY[k]-5}" class="svgt m" font-size="11">${k.toUpperCase()}</text>`});
  Object.entries(dev).forEach(([k,D])=>{boxes+=box(D[0],D[1],130,48,D[2],D[3],Object.values(p).includes(k))});
  lines+=ln(120,70,ix,125,'dc',p.pv1==='str')+ln(120,150,ix,145,'dc',p.pv2==='str')+ln(120,250,ix,190,'dc',p.bat==='bat');
  boxes+=box(10,46,110,46,'สตริง 1',sc.s1+' แผง',p.pv1==='str')+box(10,126,110,46,'สตริง 2',sc.s2?sc.s2+' แผง':'—',p.pv2==='str')+box(10,226,110,46,'แบต 51.2 V','10.24 kWh',p.bat==='bat');
  const ct=p.ct==='grid'?`<g><circle cx="600" cy="12" r="9" class="slct"/><text x="600" y="16" class="svgt b" text-anchor="middle" font-size="11">${p.ctArrow==='inv'?'←':'→'}</text><text x="560" y="16" class="svgt m" font-size="11">CT</text></g>`:'';
  const pole=sc.grid?`<text x="${W-6}" y="16" class="svgt mut" text-anchor="end" font-size="11">การไฟฟ้า ⚡</text>`:`<text x="${W-6}" y="16" class="svgt mut" text-anchor="end" font-size="11">ไม่มีกริด</text>`;
  return `<div class="tblwrap"><svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="ผังระบบ">${lines}${boxes}<rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" rx="10" class="slinv"/><text x="${ix+iw/2}" y="${iy+30}" class="svgt b" text-anchor="middle">Deye SUN-6K</text><text x="${ix+iw/2}" y="${iy+50}" class="svgt mut" text-anchor="middle" font-size="11">Hybrid SG04LP1</text>${pole}${ct}</svg></div>`;
}
function dyPgPower(s){
  const sw=DY.sw,sc=dySc(),m=DY.mlast,offs=dyOffSeq();
  const swb=(k,t,dis)=>`<button class="slsw ${sw[k]?'on':''}" data-dysw="${k}" aria-pressed="${sw[k]}" ${dis?'disabled':''}><span class="sllever"></span><span>${t}</span><b>${sw[k]?'ON':'OFF'}</b></button>`;
  return `<div class="cards"><div class="card"><h3>ตรวจก่อนเปิดเครื่อง</h3><div class="slpre">${DY_PRE.map((t,i)=>`<label><input type="checkbox" data-dypre="${i}" id="dypre-${i}" ${DY.pre.includes(i)?'checked':''}> ${esc(t)}</label>`).join('')}</div></div>
   <div class="card"><h3>สวิตช์และเบรกเกอร์</h3><div class="slsws">${swb('bat','เบรกเกอร์แบต (DC)',!sc.bat)}${swb('dc','DC switch (PV ที่ตัวเครื่อง)')}${swb('grid','เบรกเกอร์ GRID 40 A (ตู้เมน)',!sc.grid)}${swb('load','เบรกเกอร์ LOAD 40 A (ตู้ Backup)',!sc.load)}${swb('pwr','ปุ่ม ON/OFF ที่เครื่อง')}</div>
   <div class="slleds" id="dyleds"></div>
   <label class="sltime">เวลาหน้างาน <input type="range" min="300" max="1200" step="15" value="${DY.dash.t}" data-dytime id="dytime-p"><b id="dytimep">${dyHM(DY.dash.t)}</b></label></div>
   <div class="card"><h3>มัลติมิเตอร์</h3><div class="slmeter"><select id="dympt" aria-label="จุดวัด">${DY_MPT.map(([k,t])=>`<option value="${k}" ${m&&m.n===k?'selected':''}>${esc(t)}</option>`).join('')}</select><button class="btn pri" data-dyact="meas">วัด</button></div>
   <div class="sldmm"><span class="sldmmv">${m?esc(m.txt):'— —'}</span><span class="sldmmu">${m?esc(m.unit):''}</span></div><p class="hint tight" id="dymnote">${m&&m.note?esc(m.note):'เลือกจุดวัดแล้วกด "วัด" ผลจะถูกบันทึกเป็นขั้นตอน'}</p></div></div>
   <div class="cards"><div class="card"><h3>ขั้นตอน Power ON</h3>${dyList(s.c.pwr)}<div class="actions"><button class="btn sm" data-dyact="resetpwr">เริ่มใหม่ (ปิดทุกสวิตช์ ล้างบันทึก)</button></div></div>
   <div class="card"><h3>ขั้นตอน Power OFF</h3><p class="sltxt">กดปุ่ม ON/OFF ที่เครื่อง → ปิดเบรกเกอร์ AC (GRID, LOAD) → ปิด DC switch → ปิดเบรกเกอร์แบต แล้ววัดให้แรงดันเหลือ 0 V (ลำดับของแบบจำลอง ตรวจกับคู่มือรุ่นที่ใช้จริง)</p>
   <p class="sltxt">ลำดับที่ปิดล่าสุด: <b>${offs.length?offs.map(k=>({pwr:'ปุ่ม ON/OFF',grid:'AC',dc:'DC',bat:'แบต'})[k]).join(' → '):'ยังไม่ได้ปิด'}</b> ${offs.length>=2?(dyOffOk(offs)?'<span class="pill ok">ถูกลำดับ</span>':'<span class="pill err">ผิดลำดับ</span>'):''}</p>
   <p class="hint tight">ถ้าสาย DC กลับขั้วหรือเครื่องผิดปกติ ห้ามปิด DC switch ขณะมีกระแส ให้ใช้แคลมป์วัดกระแสสตริงและรอจนกระแสต่ำ ก่อนถอดสาย</p></div></div>`;
}
function dyMeasure(n){
  const P=dyPhys(DY.dash.t/60),sc=dySc();let v=0,txt='',unit='',note='';
  const fmt=(x,d)=>(x<0?'−':'')+Math.abs(x).toFixed(d);
  const invOn=P.op&&!dyAlarms(P).some(a=>a.sev==='stop');
  switch(n){
    case'pv1':v=P.v1;txt=fmt(v,1);unit='V DC';note=v>DY_HY.vmax?'เกิน 500 V ที่เครื่องรับได้ ห้ามเปิด DC switch':v===0&&DY.ports.pv1==='str'?'ไม่มีแสงหรือไม่ได้ต่อสาย':v?`อยู่ในช่วง MPPT ${v<=DY_HY.mHi?'(150–425 V)':'นอกช่วงเต็มกำลัง'}`:'';break;
    case'pv2':v=P.v2;txt=fmt(v,1);unit='V DC';note=v<0?'ค่าติดลบ: ขั้วกลับ ต้องแก้ก่อนเสียบเข้าเครื่อง':'';break;
    case'bat':v=P.vb;txt=fmt(v,1);unit='V DC';note=!DY.sw.bat&&P.batIn?'เบรกเกอร์แบตยังปิดอยู่':P.batIn&&DY.sw.bat&&!v?'เปิดเบรกเกอร์แล้วแต่ไม่มีแรงดัน ตรวจฟิวส์/เบรกเกอร์ DC':v?'ช่วงแบตของเครื่อง 40–60 V':'';break;
    case'gLN':case'gLPE':case'gNPE':{const at=P.gridAt;if(!at){v=0}else if(!P.pe&&n!=='gLN'){txt='ค่าไม่นิ่ง';unit='V AC';note='PE ลอย: ตรวจสายดิน';break}else v=n==='gLN'?230:n==='gLPE'?(P.ln?0.4:230):(P.ln?230:0.4);txt=fmt(v,1);unit='V AC';
      if(at&&P.ln&&n!=='gLN')note='L–PE ≈ 0 แต่ N–PE ≈ 230 V: สาย L กับ N สลับ';if(!at&&sc.grid)note=DY.sw.grid?'ไม่มีไฟถึงขั้ว ตรวจการต่อพอร์ต GRID':'เบรกเกอร์ GRID ปิดอยู่';break}
    case'ldLN':v=P.bkGrid?230:(invOn&&DY.sw.load?230:0);txt=fmt(v,1);unit='V AC';note=P.bkGrid?'มีไฟกริดย้อนเข้าพอร์ต LOAD: ห้ามเปิดเครื่อง ตรวจสาย Backup':invOn?'เครื่องจ่ายไฟ Backup อยู่':'';break;
    case'pe':txt=P.pe?'0.3':'OL';unit='Ω';note=P.pe?'ต่อเนื่องดี':'ไม่ต่อเนื่อง: ยังไม่ได้ต่อสายดินที่ตัวเครื่อง';break;
    case'ctLook':txt=P.a.ct==='grid'?(P.a.ctArrow==='inv'?'→ เครื่อง':'← กริด'):'ไม่มี CT';unit='';note=P.a.ct==='grid'?(P.F.has('ct_open')?'สาย CT หลุดจากขั้ว Function port':`สายขาว → ขา ${P.a.ctWire==='ok'?3:4}, ดำ → ขา ${P.a.ctWire==='ok'?4:3}`):'';break;
    case'canLook':txt=DY.ports.bms==='can'?(P.F.has('can_pin')?'pin ไม่ตรง':'pin ตรง'):'ไม่มีสาย';unit='';note=DY.ports.bms==='can'?(P.F.has('can_pin')?'หัวฝั่งแบตเข้าคนละคู่กับฝั่งเครื่อง (CAN-H / CAN-L สลับหรือผิด pin)':'CAN-H / CAN-L ตรงกับแบต'):'';break;
  }
  DY.mlast={n,txt,unit,note};DY.log.push({k:'meas',n,v,dc:DY.sw.dc,bat:DY.sw.bat,grid:DY.sw.grid});
  if(DY.log.length>400)DY.log=DY.log.slice(-400);
}
/* ---- หน้าจอ LCD ---- */
function dyPgLcd(s){
  return `<div class="cards"><div class="card sldevcard"><div class="sldev"><div class="sldevtop"><span class="sllogo">Deye</span><span class="slmodel">${DY_HY.model}</span></div>
   <div class="slscr" id="dyscr"></div>
   <div class="slkeys">${['esc','up','down','enter'].map(k=>`<button class="slkey" data-dykey="${k}" aria-label="${k.toUpperCase()}">${({esc:'ESC',up:'▲',down:'▼',enter:'ENTER'})[k]}</button>`).join('')}</div><div class="slleds" id="dyleds"></div></div>
   <p class="hint tight">จอจริงเป็นระบบสัมผัส แตะรายการบนจอได้โดยตรง หรือใช้ปุ่ม ▲ ▼ เลือก ENTER เข้า ESC ย้อนกลับ (ข้อ 4.2) แตะรูปเฟืองบนหน้าหลักเพื่อเข้า System Setup</p><div class="actions"><button class="btn sm" data-dyact="factory">คืนค่าเริ่มต้น (Factory Reset)</button></div></div>
   <div class="card"><h3>ตรวจการตั้งค่า</h3>${dyList(s.c.lcd)}</div></div>`;
}
const dySel=(path,opts,v)=>`<select class="hn" data-dys="${path}" id="dys-${path.replace(/\./g,'-')}">${opts.map(([k,t])=>`<option value="${k}" ${String(v)===String(k)?'selected':''}>${esc(t)}</option>`).join('')}</select>`;
const dyNum=(path,v,min,max,step,u)=>`<span class="slnum"><input class="hn" type="number" data-dys="${path}" id="dys-${path.replace(/\./g,'-')}" value="${v}" min="${min}" max="${max}" step="${step||1}"><i>${u||''}</i></span>`;
const dyChk=(path,v,t)=>`<label class="slck"><input class="hn" type="checkbox" data-dys="${path}" id="dys-${path.replace(/\./g,'-')}" ${v?'checked':''}> ${t||''}</label>`;
const dyRow=(l,c)=>`<div class="slrow"><span>${l}</span><span>${c}</span></div>`;
function dyDT(){const t=new Date();return DY.set.time?`${t.getFullYear()}/${String(t.getMonth()+1).padStart(2,'0')}/${String(t.getDate()).padStart(2,'0')} ${dyHM(DY.dash.t)}:00`:'2000/01/01 00:00:00'}
const dyKW=w=>(Math.abs(w)/1000).toFixed(2)+' kW';
function dyFlow(){
  const r=dyNow(),P=r.P,sc=P.sc,hasBat=P.batIn,W=640,H=330;
  const stTxt=!P.op?'OFF':r.al.some(a=>a.sev==='stop')?(r.al.find(a=>a.sev==='stop').c):'ON';
  const bms=P.batOn&&P.canOk,cur=dyAlarms(P,{island:r.P.sc.grid&&r.out});
  const node=(x,y,t,v,on)=>`<g opacity="${on?1:.4}"><rect x="${x}" y="${y}" width="150" height="64" rx="8" class="slfn"/><text x="${x+75}" y="${y+24}" text-anchor="middle" class="slft">${t}</text><text x="${x+75}" y="${y+48}" text-anchor="middle" class="slft" font-weight="700">${v}</text></g>`;
  const link=(d,p,on,rev)=>`<path d="${d}" class="slfl ${on&&Math.abs(p)>20?'on':''} ${rev?'rev':''}"/>`;
  let g=`<rect width="${W}" height="${H}" fill="#ffffff"/>`;
  g+=link('M165 82 L255 135',r.pv,true,false)+link('M475 82 L385 135',r.grid,sc.grid,r.grid<0)+link('M165 248 L255 195',r.bat,hasBat,r.bat>0)+link('M475 248 L385 195',r.lb+r.lg,true,false);
  g+=`<circle cx="320" cy="165" r="52" class="slnode"/><text x="320" y="160" text-anchor="middle" class="slft" font-weight="700">${stTxt}</text><text x="320" y="182" text-anchor="middle" class="slft" font-size="11">${P.op?'Normal':'Standby'}</text>`;
  g+=node(15,18,'Solar',dyKW(r.pv),true)+node(475,18,'Grid '+(r.grid<0?'(ขาย)':'(ซื้อ)'),sc.grid&&P.gridAt?dyKW(r.grid):'NO-Grid',sc.grid)+node(15,248,'Battery '+(hasBat?dyF(r.soc)+'%':''),hasBat?(r.bat>0?'−':'')+dyKW(r.bat)+(r.bat>0?' (ชาร์จ)':r.bat<0?' (จ่าย)':''):'--',hasBat)+node(475,248,'Load (Backup + บ้าน)',dyKW(r.lb+r.lg),true);
  g+=`<text x="320" y="318" text-anchor="middle" class="slft" font-size="11">กด ⚙ System Setup เพื่อตั้งค่า · ค่าลบ Grid = ขาย, Battery บวก = ชาร์จ (แบบจำลอง)</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" class="slds" role="img" aria-label="Devices Status: แผง ${dyKW(r.pv)}, โหลด ${dyKW(r.lb+r.lg)}, แบต ${dyKW(r.bat)}">${g}</svg>`;
}
function dyScreen(){
  const P=dyPhys(DY.dash.t/60),L=DY.lcd,S=DY.set,B=S.bat,W=S.work,G=S.grid,dt=dyDT();
  const bar=t=>`<div class="hmibar"><span>${t}</span><span>${dt}</span></div>`;
  if(!P.powered)return `<div class="hmioff">จอดับ: เครื่องยังไม่มีไฟเลี้ยง<br><small>จอติดได้เมื่อมี PV แบต หรือกริดอย่างใดอย่างหนึ่ง (ข้อ 4.1)</small></div>`;
  const go=(k,t,ic)=>`<button class="hn hmiitem" data-dygo="${k}"><i>${ic||'›'}</i>${t}</button>`;
  const r=dyNow(),T=dyDay().T;
  switch(L.scr){
    case'home':return bar('Home')+`<div class="hmibody flow" data-dygo="sys" title="แตะเพื่อเข้า System Setup (ENTER)">${dyFlow()}</div><div class="hmifoot c"><button class="hn slb pri" data-dygo="sys">⚙ System Setup</button><button class="hn slb" data-dygo="alarm">System Alarms</button><button class="hn slb" data-dygo="info">รายละเอียด</button></div>`;
    case'info':return bar('Solar / Grid / Battery / Load')+`<div class="hmibody"><div class="hmisub">Solar</div>${dyRow('PV1',dyF(Math.max(0,P.v1),1)+' V')+dyRow('PV2',dyF(Math.max(0,P.v2),1)+' V')+dyRow('Solar Power',dyF(r.pv)+' W')+dyRow('Today',dyF(T.pv,1)+' kWh')}<div class="hmisub">Grid</div>${dyRow('Grid Voltage',dyF(P.gridAt?230:0)+' V')+dyRow('Grid Power (CT)',dyF(r.gridSeen)+' W')}<div class="hmisub">Battery</div>${dyRow('Voltage / SOC',dyF(P.vb,1)+' V / '+dyF(r.soc)+' %')+dyRow('Power (+ชาร์จ / −จ่าย)',dyF(r.bat)+' W')+dyRow('BMS',P.batOn&&P.canOk?'OK':'—')}<div class="hmisub">Load</div>${dyRow('Backup (LOAD)',dyF(r.lb)+' W')+dyRow('Home (GRID side)',dyF(r.lg)+' W')}</div>`;
    case'alarm':{const cur=dyAlarms(P,{island:r.out}),hist=dyDay().al;return bar('System Alarms')+`<div class="hmibody"><div class="hmisub">Current</div>${cur.length?cur.map(a=>dyRow(`<b class="${a.sev==='stop'?'alr':'alw'}">${esc(a.c)}</b>`,esc(a.d))).join(''):'<p class="hmiempty">ไม่มี alarm</p>'}<div class="hmisub">Historical (วันนี้)</div>${hist.length?hist.map(a=>dyRow(`${dyHM(a.t*60)} <b>${esc(a.c)}</b>`,'')).join(''):'<p class="hmiempty">ไม่มีประวัติ</p>'}</div>`}
    case'sys':return bar('System Setup')+`<div class="hmibody grid2">${go('basic','Basic Setup','☰')}${go('batset','Battery Setup','▮')}${go('work','System Work Mode','◎')}${go('gridset','Grid Setup','⚡')}${go('gen','Generator Port Use','⇄')}${go('adv','Advanced Function','✎')}${go('devinfo','Device Info','ⓘ')}</div>`;
    case'basic':return bar('Basic Setup')+`<div class="hmibody">${dyRow('Time Syncs / Date and Time',`<button class="hn slb" data-dyact="settime">${S.time?'ตั้งแล้ว ✓':'Set'}</button>`)+dyRow('Beep',dyChk('adv.beep',S.adv.beep!==false,''))+dyRow('Auto Dim',dyChk('adv.dim',true,''))}<p class="hmiinfo">Factory Reset รหัส 9999 · Lock out all changes รหัส 7777 (คู่มือข้อ 5.5)</p></div>`;
    case'batset':{const lith=B.mode==='lith',bad=!(B.shutdown<B.low&&B.low<=B.restart);return bar('Battery Setup')+`<div class="hmibody">${dyRow('Batt Mode',dySel('bat.mode',DY_BATM,B.mode))+(lith?dyRow('Lithium Mode',dySel('bat.code',[['00','00'],['01','01'],['02','02'],['03','03'],['04','04']],B.code)):'')+dyRow('Max A Charge',dyNum('bat.chgA',B.chgA,0,135,1,'A'))+dyRow('Max A Discharge',dyNum('bat.disA',B.disA,0,135,1,'A'))+dyRow('Shutdown (Off-grid)',dyNum('bat.shutdown',B.shutdown,0,50,1,'%'))+dyRow('Low Batt',dyNum('bat.low',B.low,0,60,1,'%'))+dyRow('Restart',dyNum('bat.restart',B.restart,0,100,1,'%'))+dyRow('Grid Charge',dyChk('bat.gridChg',B.gridChg,'')+(B.gridChg?dyNum('bat.gridA',B.gridA,0,135,1,'A')+dyNum('bat.gridStart',B.gridStart,0,100,1,'%'):''))}${bad?'<p class="hmierr">Shutdown &lt; Low Batt ≤ Restart ไม่เช่นนั้นเครื่องหยุด/เริ่มใหม่ผิดจังหวะ</p>':''}<p class="hmiinfo">Lithium: แบตสื่อสาร BMS ผ่าน CAN ใช้รหัส Lithium Mode ตามรายชื่อแบตที่ Deye รับรอง</p></div>`}
    case'work':{let h=dyRow('Work Mode',dySel('work.mode',DY_WMODES,W.mode));
      if(W.mode==='sell')h+=dyRow('Max Sell Power',dyNum('work.maxSell',W.maxSell,0,10000,100,'W'));
      else h+=dyRow('Solar Sell',dyChk('work.sell',W.sell,''))+(W.sell?dyRow('Max Sell Power',dyNum('work.maxSell',W.maxSell,0,10000,100,'W')):'')+dyRow('Zero-export Power',dyNum('work.zeroPwr',W.zeroPwr,0,500,10,'W'));
      h+=dyRow('Energy Pattern',dySel('work.pattern',[['batt','Batt First'],['load','Load First']],W.pattern))+dyRow('Max Solar Power',dyNum('work.maxSolar',W.maxSolar,0,12000,100,'W'))+dyRow('Grid Peak-shaving',dyChk('work.peak',W.peak,'')+dyNum('work.peakW',W.peakW,0,10000,100,'W'))+dyRow('Time of Use',dyChk('work.tou',W.tou,''));
      if(W.tou)h+=`<div class="hmisub">Time of Use: เวลาเริ่ม · Power (W) · Batt SOC (%) · Grid charge</div>`+W.tp.map((p,i)=>dyRow('ช่วงที่ '+(i+1),dyNum('work.tp.'+i+'.h',p.h,0,23,1,':00')+dyNum('work.tp.'+i+'.p',p.p,0,6000,100,'W')+dyNum('work.tp.'+i+'.soc',p.soc,0,100,1,'%')+dyChk('work.tp.'+i+'.grid',p.grid,''))).join('');
      return bar('System Work Mode')+`<div class="hmibody">${h}<p class="hmiinfo">Selling First ขายส่วนเกินคืนกริด · Zero Export To CT ต้องมี CT หรือสมาร์ทมิเตอร์ · Time of Use: SOC จริงต่ำกว่าเป้าหมายจะชาร์จ สูงกว่าเป้าหมายจะจ่ายแบต (ข้อ 5.7)</p></div>`}
    case'gridset':return bar('Grid Setup')+`<div class="hmibody">${G.unlock?dyRow('Grid Mode',dySel('grid.mode',DY_GMODES.map(x=>[x,x]),G.mode))+dyRow('Grid Frequency',dySel('grid.hz',[[50,'50 Hz'],[60,'60 Hz']],G.hz))+dyRow('INV Output Voltage',dySel('grid.volt',[['200','200 V'],['220','220 V'],['230','230 V'],['240','240 V']],G.volt))+dyRow('Grid Type',dySel('grid.type',[['single','Single Phase'],['split','120/240V Split Phase'],['three','120/208V 3 Phase']],G.type)):dyRow('Unlock Grid Setting',`<span class="slnum"><input class="hn" type="password" id="dypwd" placeholder="รหัส" value="${esc(L.pwd)}" style="width:80px"></span><button class="hn slb" data-dyact="unlock">OK</button>`)}${G.unlock?'':`<p class="hmiinfo">ต้องปลดล็อกก่อนเปลี่ยนค่ากริด (รหัสในคู่มือข้อ 5.8: 7777)${L.pwd&&!G.unlock?' · รหัสไม่ถูกต้อง':''}</p>`}${G.unlock?'<p class="hmiinfo">Grid Mode เลือกตามมาตรฐานของการไฟฟ้า ในแบบจำลองใช้ General Standard</p>':''}</div>`;
    case'gen':return bar('Generator Port Use')+`<div class="hmibody"><p class="hmiinfo">พอร์ต GEN ใช้ต่อเครื่องปั่นไฟหรือ Smart Load ไม่ได้ใช้ในใบงานนี้ (ไม่ต้องตั้งค่า)</p></div>`;
    case'adv':return bar('Advanced Function')+`<div class="hmibody">${dyRow('Ex_Meter For CT',dyChk('adv.exMeter',S.adv.exMeter,'ใช้สมาร์ทมิเตอร์แทน CT'))+dyRow('BMS_Err-Stop',dyChk('adv.bmsErr',S.adv.bmsErr,'หยุดเมื่อสื่อสาร BMS ขาด'))}<p class="hmiinfo">ติ๊ก Ex_Meter For CT เมื่อใช้สมาร์ทมิเตอร์ (CHNT/Eastron) แทน CT ถ้าไม่ได้ต่อมิเตอร์ เครื่องจะไม่เห็นค่ากริด</p></div>`;
    case'devinfo':return bar('Device Info')+`<div class="hmibody">${dyRow('Model',DY_HY.model)+dyRow('Rated power','6000 W')+dyRow('Inverter SN','2605xxxxxx (ตัวอย่าง)')+dyRow('Software version','ตัวอย่างในแบบจำลอง')}</div>`;
  }
  return bar('Home');
}
function dyLive(){
  const P=dyIsMi()?null:dyPhys(DY.dash.t/60);
  if(P){
    const al=dyAlarms(P),opOn=P.op&&!al.some(a=>a.sev==='stop'),aOn=al.some(a=>a.sev==='stop'),aFl=!aOn&&al.length>0;
    const led=(c,t,on,fl)=>`<span class="slled ${c} ${on?'on':''} ${fl?'fl':''}"><i></i>${t}</span>`;
    document.querySelectorAll('#dyleds').forEach(e=>e.innerHTML=led('pw','POWER',P.powered)+led('op','OPERATION',opOn,P.powered&&!P.op)+led('al','ALARM',aOn,aFl));
    const scr=document.getElementById('dyscr');if(scr){scr.innerHTML=dyScreen();const it=[...scr.querySelectorAll('.hn')];DY.lcd.nav=Math.min(DY.lcd.nav,Math.max(0,it.length-1));if(it[DY.lcd.nav])it[DY.lcd.nav].classList.add('hf')}
    const f=document.getElementById('dyflow');if(f)f.innerHTML=dyFlow();const fd=document.getElementById('dydsdt');if(fd)fd.textContent=dyDT();
    const r=dyNow(),a=document.getElementById('dyalm');if(a){const cur=r?r.al:[];a.innerHTML=cur.length?`<ul class="msgs">${cur.map(x=>`<li class="${x.sev==='stop'?'err':'warn'}"><b>${esc(x.c)}</b> ${esc(x.d)}</li>`).join('')}</ul>`:''}
    const n=document.getElementById('dynowln');if(n){const W=640,L=40,R=36,x=L+(W-L-R)*(DY.dash.t/5)/287;n.setAttribute('x1',x);n.setAttribute('x2',x)}
  }else if(typeof dmLive==='function')dmLive();
  ['dydt','dytimep'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=dyHM(DY.dash.t)});
}
function dyPgDash(s){
  const D=DY.dash,T=dyDay().T;
  return `<div class="card"><div class="bar"><div class="grp"><span class="lab">เวลา</span><b id="dydt">${dyHM(D.t)}</b><input type="range" min="0" max="1435" step="5" value="${D.t}" data-dytime id="dytime-d" aria-label="เวลา"><button class="btn sm" data-dyact="play">${dyPlayT?'หยุด':'เล่น'}</button></div>
    <div class="grp">${dyChk('dash.out',D.out,'ไฟดับ')}${dyNum('dash.o0',D.o0,0,23,1,'–')}${dyNum('dash.o1',D.o1,1,24,1,'น.')}</div>
    <div class="grp"><span class="lab">เมฆ</span>${dyNum('dash.cloud',D.cloud,0,90,10,'%')}<span class="lab">โหลด Backup เพิ่ม</span>${dyNum('dash.extra',D.extra,0,9000,500,'W')}<span class="lab">SOC ตอนเที่ยงคืน</span><b>${dyF(dyDay().soc00)}%</b></div></div>
    <div class="slflowbig"><div class="hmibar"><span>Devices Status</span><span id="dydsdt">${dyDT()}</span></div><div id="dyflow">${dyFlow()}</div></div><div id="dyalm"></div></div>
   <div class="cards"><div class="card"><h3>ทั้งวัน</h3><div class="tblwrap" id="dychart">${dyChart()}</div>
    <table class="t"><tbody><tr><th>ผลิตจากแผง</th><td>${dyF(T.pv,1)} kWh</td><th>โหลดรวม</th><td>${dyF(T.load,1)} kWh</td></tr><tr><th>ซื้อไฟ</th><td>${dyF(T.imp,1)} kWh</td><th>ขายไฟ</th><td>${dyF(T.exp,1)} kWh</td></tr><tr><th>ชาร์จแบต</th><td>${dyF(T.chg,1)} kWh</td><th>จ่ายแบต</th><td>${dyF(T.dis,1)} kWh</td></tr><tr><th>ตัดกำลังแผง</th><td>${dyF(T.cut,1)} kWh</td><th>โหลด Backup ขาดไฟ</th><td>${dyF(T.unsB,1)} kWh</td></tr></tbody></table></div>
   <div class="card"><h3>ผลทดสอบการทำงาน</h3>${dyList(s.c.dash)}<p class="hint tight">ค่าบนหน้าจอเครื่องมาจาก CT ถ้า CT ติดกลับ ค่ากริดบนจอจะกลับเครื่องหมายและเครื่องจะชาร์จ/จ่ายแบตผิดทาง (คู่มือข้อ 3.7 หมายเหตุ)</p></div></div>`;
}
function dyChart(){
  const rows=dyDay().rows,W=640,H=200,L=40,R=36,B=22,Tp=10,mx=Math.max(3000,...rows.map(r=>Math.max(r.pv,r.lb+r.lg,Math.abs(r.grid),Math.abs(r.bat)))),x=i=>L+(W-L-R)*i/287,y=v=>Tp+(H-Tp-B)*(1-(v+mx)/(2*mx)),ys=v=>Tp+(H-Tp-B)*(1-v/100);
  const path=(f,cls)=>`<path d="${rows.map((r,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+f(r).toFixed(1)).join(' ')}" class="slc ${cls}"/>`;
  let out=rows.map((r,i)=>r.out?`<rect x="${x(i)}" y="${Tp}" width="${(W-L-R)/287+.5}" height="${H-Tp-B}" class="slout"/>`:'').join('');
  out+=[-mx,0,mx].map(v=>`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" class="slgrid"/><text x="${L-4}" y="${y(v)+4}" class="svgt m mut" text-anchor="end" font-size="10">${dyF(v/1000,0)}k</text>`).join('');
  [0,6,12,18,24].forEach(h=>out+=`<text x="${x(Math.min(287,h*12))}" y="${H-6}" class="svgt m mut" text-anchor="middle" font-size="10">${h}:00</text>`);
  [0,50,100].forEach(v=>out+=`<text x="${W-R+4}" y="${ys(v)+4}" class="svgt m mut" font-size="10">${v}%</text>`);
  out+=path(r=>y(r.pv),'pv')+path(r=>y(r.lb+r.lg),'ld')+path(r=>y(r.grid),'gd')+path(r=>y(r.bat),'bt')+path(r=>ys(r.soc),'sc');
  out+=`<line x1="${x(DY.dash.t/5)}" x2="${x(DY.dash.t/5)}" y1="${Tp}" y2="${H-B}" class="slnow" id="dynowln"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="กราฟทั้งวัน">${out}</svg><div class="slleg"><span class="pv">แผง</span><span class="ld">โหลด</span><span class="gd">กริด (+ซื้อ / −ขาย)</span><span class="bt">แบต (+ชาร์จ / −จ่าย)</span><span class="sc">SOC</span><span class="ot">ช่วงไฟดับ</span></div>`;
}
function dyPgFault(){
  const sc=dySc(),FL=dyFL(),cand=Object.keys(FL).filter(k=>dyIsMi()||dyApplies(k,sc)),T=dyTeacher(),active=DY.faults.length>0,res=DY._fres;
  return `<div class="cards"><div class="card"><h3>โจทย์หาข้อผิดพลาด</h3><p class="sltxt">ระบบจะตั้งพอร์ตตามใบสั่งงานให้ถูกต้อง แล้วซ่อนความผิดพลาดหน้างาน 2 จุด ให้ไล่ตรวจตามขั้นตอนจริง: ตรวจวัดก่อนเปิด (หน้า 2) ดู alarm และค่าบนหน้าจอ (หน้า 3–4) แล้วเลือกสิ่งที่พบ</p>
    <div class="actions"><button class="btn pri" data-dyact="drill">${active?'สุ่มโจทย์ใหม่':'เริ่มโจทย์ (สุ่ม 2 จุด)'}</button>${active?'<button class="btn" data-dyact="drillend">เลิกโจทย์</button>':''}</div>
    ${active?`<div class="slpre">${cand.map(k=>`<label><input type="checkbox" data-dypick="${k}" id="dypick-${k}" ${DY.pick.includes(k)?'checked':''}> ${esc(FL[k].n)}</label>`).join('')}</div><div class="actions"><button class="btn pri" data-dyact="answer">ตรวจคำตอบ</button>${DY.tries>=3||T?'<button class="btn" data-dyact="reveal">เฉลย</button>':''}</div>`:''}
    ${res?`<p class="simmsg ${res.ok?'ok':'err'}">${esc(res.msg)}</p>`:''}${DY.reveal&&active?`<p class="sltxt">เฉลย: ${DY.faults.map(k=>esc(FL[k].n)).join(' · ')}</p>`:''}
    <p class="hint tight">ทำผ่านแล้ว ${DY.diagOk} โจทย์</p></div>
   ${T?`<div class="card slteach"><h3>ผู้สอน: กำหนดโจทย์เอง</h3><p class="hint tight">ผู้เรียนไม่เห็นส่วนนี้ เลือกข้อผิดพลาดที่ต้องการแล้วกด "ใช้โจทย์นี้" ${active?`· โจทย์ตอนนี้: ${DY.faults.map(k=>esc(FL[k].n)).join(', ')}`:''}</p>
    <div class="slpre">${cand.map(k=>`<label><input type="checkbox" data-dyteach="${k}" id="dyteach-${k}"> ${esc(FL[k].n)}</label>`).join('')}</div><div class="actions"><button class="btn" data-dyact="teachset">ใช้โจทย์นี้</button></div></div>`:''}</div>`;
}

/* ---- การกระทำ ---- */
function dySetPath(path,val){const ks=path.split('.');let o=ks[0]==='dash'?DY.dash:DY.set;if(ks[0]==='dash')ks.shift();for(let i=0;i<ks.length-1;i++)o=o[ks[i]];o[ks[ks.length-1]]=val}
function dyGetPath(path){const ks=path.split('.');let o=ks[0]==='dash'?DY.dash:DY.set;if(ks[0]==='dash')ks.shift();ks.forEach(k=>o=o==null?o:o[k]);return o}
function dyKey(k){
  const P=dyPhys(DY.dash.t/60);if(!P.powered)return;
  const it=[...document.querySelectorAll('#dyscr .hn')],L=DY.lcd;
  if(k==='up'||k==='down'){if(!it.length)return;L.nav=(L.nav+(k==='down'?1:-1)+it.length)%it.length;dyLive();return}
  if(k==='enter'){if(L.scr==='home'){dyGo('sys');return}const el=it[L.nav];if(!el)return;if(el.matches('input[type=checkbox],input[type=radio],button'))el.click();else el.focus();return}
  if(k==='esc'){if(L.scr==='home')return;L.scr=L.stack.pop()||'home';L.nav=0;dyLive()}
}
function dyGo(s){DY.lcd.stack.push(DY.lcd.scr);DY.lcd.scr=s;DY.lcd.nav=0;dyLive()}
function dySw(k){
  const sc=dySc();if((k==='bat'&&!sc.bat)||(k==='grid'&&!sc.grid)||(k==='load'&&!sc.load))return;
  DY.sw[k]=!DY.sw[k];DY.log.push({k:'sw',n:k,v:DY.sw[k],cfg:k==='load'?dyLcd().every(x=>x[0]):undefined});
  const P=dyPhys(DY.dash.t/60);
  if(k==='dc'&&DY.sw.dc&&P.pvOver)DY.mlast={n:'',txt:'!!',unit:'',note:'เปิด DC switch ทั้งที่สตริง PV1 เกิน 500 V: เครื่องขึ้น F55 และเสี่ยงเสียหาย'};
}
function dyResetPwr(){DY.sw={bat:false,dc:false,grid:false,load:false,pwr:false};DY.log=[];DY.pre=[];DY.mlast=null}
function dyDrill(list){
  if(dyIsMi()){dmDrill(list);return}
  const sc=dySc(),cand=Object.keys(DY_HFAULTS).filter(k=>dyApplies(k,sc));
  let f=list&&list.length?list.filter(k=>cand.includes(k)):[];
  if(!f.length){const pool=cand.slice();while(f.length<2&&pool.length)f.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0])}
  DY.faults=f;DY.pick=[];DY.tries=0;DY.reveal=false;DY._fres=null;DY.ports=dyWant(sc);dyResetPwr();
}
function dyAnswer(){
  const fl=dyIsMi()?DM_FAULTS:DY_HFAULTS;
  const a=new Set(DY.pick),f=new Set(DY.faults),hit=[...f].filter(k=>a.has(k)).length,wrong=[...a].filter(k=>!f.has(k)).length;DY.tries++;
  if(hit===f.size&&!wrong){DY.diagOk++;DY._fres={ok:true,msg:`ถูกต้องครบ ${f.size} จุด แก้ไขหน้างานแล้ว ลองเปิดเครื่องตามขั้นตอนอีกครั้ง`};DY.faults=[];DY.pick=[];DY.reveal=false}
  else DY._fres={ok:false,msg:`ถูก ${hit} จาก ${f.size} จุด${wrong?` · เลือกผิด ${wrong} ข้อ`:''} ลองตรวจวัดเพิ่ม (ครั้งที่ ${DY.tries})`};
}
function dyEvents(){
  const host=document.getElementById('dyhost');if(!host||host.dataset.on)return;host.dataset.on='1';
  host.addEventListener('click',e=>{
    const t=e.target.closest('[data-dysc],[data-dypg],[data-dysw],[data-dyact],[data-dykey],[data-dygo],[data-dymsw],[data-dymoff]');if(!t)return;
    const d=t.dataset;
    if(d.dysc){if(DY.sys!==d.dysc){DY.sys=d.dysc;DY.faults=[];DY._fres=null;DY.pick=[];dyResetPwr();if(dyIsMi()&&typeof dmReset==='function')dmReset()}dyChanged();return}
    if(d.dypg){DY.page=d.dypg;dyStop();dyRender();if(typeof touch==='function')touch();return}
    if(d.dysw){dySw(d.dysw);dyChanged();return}
    if(d.dymsw){dmSw(d.dymsw);dyChanged();return}
    if(d.dymoff!=null){dmOff(d.dymoff);dyChanged();return}
    if(d.dykey){dyKey(d.dykey);return}
    if(d.dygo){dyGo(d.dygo);return}
    const a=d.dyact;
    if(a==='meas'){const sel=document.getElementById('dympt').value;if(dyIsMi())dmMeasure(sel);else dyMeasure(sel);dyChanged()}
    else if(a==='resetpwr'){dyResetPwr();if(dyIsMi()&&typeof dmReset==='function')dmReset();dyChanged()}
    else if(a==='settime'){DY.set.time=true;dyChanged(false)}
    else if(a==='unlock'){const p=document.getElementById('dypwd');DY.lcd.pwd=p?p.value:'';if(DY.lcd.pwd==='7777'){DY.set.grid.unlock=true;DY.lcd.pwd=''}dyLive()}
    else if(a==='factory'){DY.set=DY_DEFSET();DY.lcd={scr:'home',stack:[],nav:0,pwd:''};dyChanged()}
    else if(a==='wait'){dmWait();dyChanged()}
    else if(a==='resetoff'){DM.moff=[];dyChanged()}
    else if(a==='play'){if(dyPlayT)dyStop();else{dyPlayT=setInterval(()=>{DY.dash.t=(DY.dash.t+10)%1440;const r=document.getElementById('dytime-d');if(r)r.value=DY.dash.t;dyLive()},140)}t.textContent=dyPlayT?'หยุด':'เล่น'}
    else if(a==='drill'){dyDrill();dyChanged()}
    else if(a==='drillend'){DY.faults=[];DY._fres=null;dyChanged()}
    else if(a==='answer'){dyAnswer();dyChanged()}
    else if(a==='reveal'){DY.reveal=true;dyRender()}
    else if(a==='teachset'){const l=[...host.querySelectorAll('[data-dyteach]:checked')].map(x=>x.dataset.dyteach);dyDrill(l);dyChanged()}
  });
  host.addEventListener('change',e=>{
    const t=e.target,d=t.dataset;
    if(d.dyp){DY.ports[d.dyp]=t.value;dyChanged();return}
    if(d.dymp){DM.set[d.dymp]=t.value;dyChanged();return}
    if(d.dypre!=null){const i=+d.dypre;DY.pre=DY.pre.filter(x=>x!==i);if(t.checked)DY.pre.push(i);dyChanged();return}
    if(d.dymchk!=null){const i=+d.dymchk;DM.pre=DM.pre.filter(x=>x!==i);if(t.checked)DM.pre.push(i);dyChanged();return}
    if(d.dymwifi!=null){const i=+d.dymwifi;DM.wifi=DM.wifi.filter(x=>x!==i);if(t.checked)DM.wifi.push(i);dyChanged();return}
    if(d.dypick){DY.pick=DY.pick.filter(x=>x!==d.dypick);if(t.checked)DY.pick.push(d.dypick);return}
    if(d.dys){let v;if(t.type==='checkbox')v=t.checked;else if(t.type==='number'){v=+t.value;if(!isFinite(v))v=+(dyGetPath(d.dys)||0);if(t.min!=='')v=Math.max(+t.min,v);if(t.max!=='')v=Math.min(+t.max,v)}else v=t.value;
      if(['grid.hz'].includes(d.dys))v=+v;
      dySetPath(d.dys,v);if(d.dys==='dash.o1'&&DY.dash.o1<=DY.dash.o0)DY.dash.o1=Math.min(24,DY.dash.o0+1);
      const keep=document.activeElement&&document.activeElement.id;dyChanged(DY.page==='lcd'?false:true);
      if(DY.page==='lcd'){const s=dyScore();const c=document.querySelector('#dypage .card:last-child');if(c)c.innerHTML='<h3>ตรวจการตั้งค่า</h3>'+dyList(s.c.lcd);const v2=document.querySelector('.verdict');if(v2){v2.className='verdict '+(s.ok?'ok':s.n/s.all>.6?'warn':'err');v2.children[1].textContent=s.ok?'ผ่านครบทุกข้อ':'ผ่าน '+s.n+' / '+s.all+' ข้อ'}}
      if(keep){const el=document.getElementById(keep);if(el&&el!==document.activeElement)try{el.focus()}catch(_){}}}
  });
  host.addEventListener('input',e=>{if(e.target.dataset.dytime==null)return;DY.dash.t=+e.target.value;dyLive();clearTimeout(host._tt);host._tt=setTimeout(()=>{if(DY.page==='power')dyRender();if(typeof touch==='function')touch()},400)});
  host.addEventListener('keydown',e=>{if(DY.page!=='lcd'||e.target.closest('input,select'))return;const m={ArrowUp:'up',ArrowDown:'down',Enter:'enter',Escape:'esc'}[e.key];if(m&&e.target.closest('.sldev')){e.preventDefault();dyKey(m)}});
}
function dyStop(){if(dyPlayT){clearInterval(dyPlayT);dyPlayT=0}}
function dyRenderTab(){dyEvents();dyRender()}
function dySnapshot(){const o=JSON.parse(JSON.stringify(DY));delete o._day;delete o._fres;o.mi=typeof dmSnapshot==='function'?dmSnapshot():null;return o}
function dyRestore(o){
  if(!o||typeof o!=='object')return;
  if(DY_SC[o.sys])DY.sys=o.sys;if(['job','power','lcd','dash','fault'].includes(o.page))DY.page=o.page;
  if(o.ports)DY_HPORTS.forEach(([k,,opts])=>{if(opts.some(x=>x[0]===o.ports[k]))DY.ports[k]=o.ports[k]});
  if(o.sw)['bat','dc','grid','load','pwr'].forEach(k=>DY.sw[k]=!!o.sw[k]);
  if(Array.isArray(o.pre))DY.pre=o.pre.filter(i=>Number.isInteger(i)&&i>=0&&i<DY_PRE.length);
  if(Array.isArray(o.log))DY.log=o.log.filter(e=>e&&typeof e.k==='string').slice(-400);
  if(o.set&&typeof o.set==='object'){const d=DY_DEFSET();
    if(typeof o.set.time==='boolean')d.time=o.set.time;
    ['bat','work','grid','adv'].forEach(g=>{if(o.set[g]&&typeof o.set[g]==='object')Object.keys(d[g]).forEach(k=>{if(k==='tp'){if(Array.isArray(o.set.work.tp)&&o.set.work.tp.length===6)d.work.tp=o.set.work.tp.map((p,i)=>{const q=Object.assign({},d.work.tp[i]);Object.keys(q).forEach(f=>{if(p&&typeof p[f]===typeof q[f])q[f]=p[f]});return q})}else if(typeof o.set[g][k]===typeof d[g][k])d[g][k]=o.set[g][k]})});
    DY.set=d}
  if(o.dash&&typeof o.dash==='object')Object.keys(DY.dash).forEach(k=>{if(typeof o.dash[k]===typeof DY.dash[k])DY.dash[k]=o.dash[k]});
  if(Array.isArray(o.faults))DY.faults=o.faults.filter(k=>DY_HFAULTS[k]||(typeof DM_FAULTS!=='undefined'&&DM_FAULTS[k]));
  if(o.done&&typeof o.done==='object')Object.keys(DY_SC).forEach(k=>DY.done[k]=!!o.done[k]);
  DY.diagOk=Math.max(0,o.diagOk|0);DY.tries=Math.max(0,o.tries|0);DY._day=null;
  if(o.mi&&typeof dmRestore==='function')dmRestore(o.mi);
}
function dySummary(){const s=dyScore();return{sys:DY.sys,pass:s.n,all:s.all,done:Object.keys(DY.done).filter(k=>DY.done[k]),diag:DY.diagOk}}
