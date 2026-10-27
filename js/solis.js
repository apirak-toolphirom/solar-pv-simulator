/* ---- เมนู 13 Solis Hybrid: ติดตั้ง ตรวจวัด Power ON/OFF ตั้งค่าหน้าจอ HMI และแดชบอร์ดทดสอบการทำงาน ----
   อ้างอิง Solis S6-EH1P(3-8)K-L-PLUS User Manual V1.3 (04/2026, Drive: PV Datasheets/01 อินเวอร์เตอร์/Solis)
   3.4–3.10 ผังพอร์ตและการต่อสาย · 5.1–5.3 Pre-commissioning, Power ON/OFF · 5.4 HMI Quick/Detailed setting · ตาราง 7.1 ข้อความ alarm · 8 สเปก 6K · FAQ
   แรงดันแผง โหลด และพฤติกรรมควบคุมเป็นแบบจำลองเพื่อการเรียนรู้ ไม่ใช่เฟิร์มแวร์จริง
   ผู้สอนเปิด/ปิดเมนูนี้ที่ dashboard (แผ่น "เมนู" ค่าเริ่ม = ปิด) */
const SL_INV={model:'S6-EH1P6K-L-PLUS',pac:6000,pvMax:9600,vmax:500,mLo:90,mHi:435,vstart:90,batI:135,bkPeak:12000};
const SL_BAT={name:'Dyness PowerBrick 14.3 kWh',v:51.2,kwh:14.3,dod:95,iRec:140,iMax:200};
const SL_VOC=49.5,SL_WP=650; /* Voc ต่อแผงและกำลังต่อแผง (ค่าตัวอย่าง) */
const SL_SC={
  ongrid:{n:'On-grid (ไม่มีแบต)',area:'PEA',s1:8,s2:6,bat:false,grid:true,backup:false,gen:false,ct:true,
    brief:'บ้านในพื้นที่ PEA แผง 14 แผง (สตริง 8 + 6) ยังไม่ซื้อแบต การไฟฟ้าอนุมัติขายไฟคืนได้ไม่เกิน 5 kW โหลดทั้งหมดอยู่ที่ตู้เมน'},
  hybrid:{n:'Hybrid (กริด + Backup)',area:'PEA',s1:8,s2:6,bat:true,grid:true,backup:true,gen:false,ct:true,
    brief:'บ้านในพื้นที่ PEA แผง 14 แผง แบต Dyness PowerBrick 14.3 kWh (51.2 V แนะนำชาร์จ/จ่าย 140 A) เจ้าของใช้ไฟเองเป็นหลัก ห้ามขายไฟย้อนเข้าระบบ ต้องสำรองแบตไว้อย่างน้อย 30% สำหรับไฟดับ โหลดสำคัญย้ายไปตู้ Backup'},
  offgrid:{n:'Off-grid',area:'',loadK:0.7,s1:8,s2:6,bat:true,grid:false,backup:true,gen:false,ct:false,
    brief:'บ้านสวนที่ไม่มีไฟการไฟฟ้า ใช้ไฟน้อยกว่าบ้านในเมือง แผง 14 แผง แบต Dyness PowerBrick 14.3 kWh โหลดทั้งหมดอยู่ที่ตู้ Backup ไม่มี CT และมิเตอร์ ตั้งหยุดจ่ายแบต (Over discharge) 15–30%'},
  accouple:{n:'AC coupling',area:'MEA',s1:8,s2:0,bat:true,grid:true,backup:true,gen:true,ct:true,
    brief:'บ้านในพื้นที่ MEA มีอินเวอร์เตอร์ออนกริดเดิม 3 kW อยู่แล้ว เพิ่ม Solis Hybrid แผง 8 แผง แบต Dyness 14.3 kWh ให้อินเวอร์เตอร์เดิมทำงานต่อได้ตอนไฟดับ (ต่อที่พอร์ต GEN แบบ AC coupled) ขายไฟคืนได้'}
};
const SL_PORTS=[
  ['pv1','PV1 (MPPT1)',[['none','ว่าง'],['str','สตริงแผง']]],
  ['pv2','PV2 (MPPT2)',[['none','ว่าง'],['str','สตริงแผง']]],
  ['bat','BAT+ / BAT−',[['none','ว่าง'],['bat','แบต ผ่านเบรกเกอร์ DC']]],
  ['grid','AC-GRID L N PE',[['none','ว่าง'],['main','ตู้เมน (ผ่าน OCPD 2P)'],['bpanel','ตู้โหลด Backup'],['gt','อินเวอร์เตอร์ออนกริดเดิม']]],
  ['backup','AC-BACKUP L N PE',[['none','ว่าง'],['main','ตู้เมน (ผ่าน OCPD 2P)'],['bpanel','ตู้โหลด Backup'],['gt','อินเวอร์เตอร์ออนกริดเดิม']]],
  ['gen','AC-GEN L N PE',[['none','ว่าง'],['main','ตู้เมน (ผ่าน OCPD 2P)'],['bpanel','ตู้โหลด Backup'],['gt','อินเวอร์เตอร์ออนกริดเดิม']]],
  ['ct','CT (12-pin ขั้ว 1–2)',[['none','ไม่ติด'],['grid','สายเมนที่จุดเชื่อมต่อการไฟฟ้า']]],
  ['ctArrow','ทิศลูกศร CT',[['grid','ชี้ไปทางการไฟฟ้า'],['load','ชี้เข้าบ้าน']]],
  ['ctWire','สาย CT',[['ok','ขาว → ขั้ว 1, ดำ → ขั้ว 2'],['swap','ขาว → ขั้ว 2, ดำ → ขั้ว 1']]],
  ['bms','BMS (RJ45 CAN)',[['none','ว่าง'],['can','สาย CAN ไปแบต']]],
  ['meter','METER (RJ45 RS485)',[['none','ว่าง'],['sdm','มิเตอร์ SDM120CTM']]]
];
const SL_FAULTS={
  ct_rev:{n:'CT ติดกลับทิศ (ลูกศรชี้เข้าบ้าน)',need:'ct'},
  ct_swap:{n:'สาย CT ขาว/ดำ สลับขั้วที่ขั้ว 1–2',need:'ct'},
  ct_open:{n:'สาย CT หลุดจากขั้วต่อ 12-pin',need:'ct'},
  pv1_ovr:{n:'สตริง PV1 ต่ออนุกรมเกิน (Voc เกิน 500 V)',need:''},
  pv2_rev:{n:'สตริง PV2 เข้าขั้วกลับ',need:'s2'},
  bat_off:{n:'ฟิวส์/เบรกเกอร์ DC ของแบตขาด ไม่มีแรงดันถึงขั้ว BAT',need:'bat'},
  can_pin:{n:'สาย CAN ลำดับ pin ไม่ตรงกับแบต',need:'bat'},
  bk_grid:{n:'สายพอร์ต BACKUP ถูกต่อเข้าตู้เมนที่มีไฟกริด',need:'gridbk'},
  ln_swap:{n:'สาย AC-GRID สลับ L กับ N',need:'grid'},
  pe_open:{n:'ไม่ได้ต่อสายดิน PE ที่ตัวเครื่อง',need:''}
};
const SL_GRIDCODE=[['','— ยังไม่เลือก —'],['MEA','MEA'],['PEA','PEA'],['IEC61727','IEC 61727'],['G98','G98'],['EN50549','EN 50549'],['NRS097','NRS 097-2-1']];
const SL_BATM=[['none','No Battery'],['liLV','Lithium Battery LV'],['dyness','Dyness'],['pylon','Pylontech'],['solis','Solis IntelliHome'],['lead','Lead-acid']];
const SL_METERS=[['ct','CT (ESCT-TA16-100A/50mA)'],['sdm','Meter SDM120CTM'],['none','No Meter']];
const SL_SMART=[['none','ไม่ใช้งาน'],['genset','Genset input'],['gensetgrid','Genset connected to grid'],['smart','Smart load output'],['ac','AC couple input']];
const SL_MODES=[['self','Self-use'],['sell','Selling first'],['off','Off grid']];
const SL_PRE=['ไม่มีตัวนำแรงดันสูงที่มีไฟอยู่','จุดต่อสายและท่อทุกจุดขันแน่น','มีที่ว่างระบายอากาศรอบอุปกรณ์','ไล่สายทุกเส้นถึงขั้วที่ถูกต้อง','ติดป้ายเตือนและฉลากครบ','ยึดอินเวอร์เตอร์แน่นกับผนัง','เตรียมมัลติมิเตอร์วัด AC/DC และแอป SolisCloud'];
const SL_MPT=[['pv1','PV1 + / − (ที่ปลาย MC4)','dc'],['pv2','PV2 + / − (ที่ปลาย MC4)','dc'],['bat','ขั้ว BAT+ / BAT−','dc'],['gLN','AC-GRID L–N','ac'],['gLPE','AC-GRID L–PE','ac'],['gNPE','AC-GRID N–PE','ac'],['bkLN','AC-BACKUP L–N (เครื่องปิด)','ac'],['pe','ความต่อเนื่อง PE ตัวเครื่อง–บาร์กราวด์','ohm'],['ctLook','ตรวจด้วยตา: CT และสาย','look'],['canLook','ตรวจด้วยตา: หัว RJ45 สาย CAN','look']];
const SL_DEFSET=()=>({time:false,meter:'ct',ctDir:'fwd',ctRatio:2000,grid:'',mode:'self',allowExp:true,maxExp:6600,reserve:20,gridChg:false,expCal:20,peak:true,peakW:12000,
  tou:{c:{on:false,s:1,e:5,a:50,soc:80},d:{on:false,s:18,e:22,a:50,soc:30}},bat:'none',chg:100,dis:100,od:20,rec:30,force:10,maxSoc:100,smart:'none',unbal:false,lang:'English'});
const SL_DEFPORTS=()=>({pv1:'none',pv2:'none',bat:'none',grid:'none',backup:'none',gen:'none',ct:'none',ctArrow:'grid',ctWire:'ok',bms:'none',meter:'none'});
const SL={page:'job',sc:'hybrid',ports:SL_DEFPORTS(),sw:{bat:false,dc:false,grid:false,backup:false},pre:[],log:[],mlast:null,
  hmi:{qdone:false,q:0,scr:'quick',stack:[],nav:0,pt:'pv',pro:false},set:SL_DEFSET(),
  dash:{t:600,out:true,o0:18,o1:22,cloud:0,extra:0,soc0:50},faults:[],pick:[],tries:0,diagOk:0,reveal:false,done:{},_day:null};
let slPlayT=0;

const slTeacher=()=>(typeof TEACH!=='undefined'&&TEACH.on)||(typeof ACC!=='undefined'&&(!ACC.enabled||ACC.role==='teacher'));
const slSc=()=>SL_SC[SL.sc];
const slF=(v,d=0)=>(+v).toLocaleString('th-TH',{minimumFractionDigits:d,maximumFractionDigits:d});
const slHM=m=>String(Math.floor(m/60)%24).padStart(2,'0')+':'+String(Math.round(m%60)).padStart(2,'0');
const slSun=h=>h<=6||h>=18?0:Math.pow(Math.sin(Math.PI*(h-6)/12),1.25);
function slLoad(h){let w=380;if(h>=6&&h<8)w+=900;if(h>=10&&h<16)w+=700;if(h>=12&&h<13)w+=600;if(h>=18&&h<22.5)w+=1900;return w}
function slApplies(k,sc){const n=SL_FAULTS[k].need;return !n||(n==='ct'&&sc.ct)||(n==='s2'&&sc.s2>0)||(n==='bat'&&sc.bat)||(n==='grid'&&sc.grid)||(n==='gridbk'&&sc.grid&&sc.backup)}
function slWant(sc){return{pv1:'str',pv2:sc.s2?'str':'none',bat:sc.bat?'bat':'none',grid:sc.grid?'main':'none',backup:sc.backup?'bpanel':'none',gen:sc.gen?'gt':'none',ct:sc.ct?'grid':'none',ctArrow:'grid',ctWire:'ok',bms:sc.bat?'can':'none',meter:'none'}}

/* ---- ของจริงที่หน้างาน = พอร์ตที่เลือก + ข้อผิดพลาดแฝงของโจทย์ ---- */
function slPhys(h,o={}){
  const sc=slSc(),F=new Set(SL.faults),a=Object.assign({},SL.ports),S=SL.set;
  if(F.has('ct_rev'))a.ctArrow=a.ctArrow==='grid'?'load':'grid';
  if(F.has('ct_swap'))a.ctWire=a.ctWire==='ok'?'swap':'ok';
  if(F.has('bk_grid')&&a.backup==='bpanel')a.backup='main';
  const lit=slSun(h)>0||(h>5.75&&h<18.25);
  const n1=a.pv1==='str'?(F.has('pv1_ovr')?11:sc.s1):0,n2=a.pv2==='str'?sc.s2:0;
  const v1=lit?n1*SL_VOC:0,v2=lit?(F.has('pv2_rev')?-1:1)*n2*SL_VOC:0;
  const batIn=a.bat==='bat'&&sc.bat,batOn=batIn&&SL.sw.bat&&!F.has('bat_off');
  const soc=o.soc!=null?o.soc:SL.dash.soc0;
  const vb=batOn?SL_BAT.v*(0.94+0.08*soc/100):0;
  const gridLive=sc.grid&&!o.out,gridAt=a.grid==='main'&&gridLive&&SL.sw.grid;
  const bkGrid=a.backup==='main'&&gridLive;
  const ln=F.has('ln_swap'),pe=!F.has('pe_open');
  let ctS=0,ctTxt='ไม่มีสัญญาณ';
  if(S.meter==='ct'&&a.ct==='grid'&&!F.has('ct_open')){ctS=(a.ctArrow==='grid'?1:-1)*(a.ctWire==='ok'?1:-1)*(S.ctDir==='fwd'?1:-1);ctTxt='OK'}
  else if(S.meter==='sdm'&&a.meter==='sdm'){ctS=1;ctTxt='OK'}
  const meterFail=S.meter==='sdm'&&a.meter!=='sdm';
  const canOk=a.bms==='can'&&!F.has('can_pin');
  const pvOver=Math.max(v1,v2)>SL_INV.vmax;
  const ok1=v1>=SL_INV.mLo&&v1<=SL_INV.vmax,ok2=v2>=SL_INV.mLo&&v2<=SL_INV.vmax;
  const powered=(SL.sw.dc&&(v1>=SL_INV.vstart||v2>=SL_INV.vstart))||vb>=40||gridAt;
  return{a,F,sc,n1,n2,v1,v2,ok1,ok2,batIn,batOn,vb,gridLive,gridAt,bkGrid,ln,pe,ctS,ctTxt,meterFail,canOk,pvOver,powered};
}
function slAlarms(P,o={}){
  const S=SL.set,L=[],add=(c,d,sev)=>L.push({c,d,sev:sev||'warn'});
  if(!P.powered)return L;
  if(P.pvOver&&SL.sw.dc)add('OV-DC01','DC 1 input overvoltage (1020 DATA:0001) แรงดันสตริงเกิน 500 V','stop');
  if(P.bkGrid)add('OV-Vbackup','Inverting overvoltage: มีแรงดันภายนอกที่พอร์ต BACKUP ตรวจการต่อสาย Backup','stop');
  if(S.bat!=='none'&&!P.batOn)add('NO-Battery','Battery is not connected ตรวจสายแบตและเบรกเกอร์แบต');
  if(P.batOn&&S.bat!=='none'&&S.bat!=='lead'&&!P.canOk)add('CAN Fail','การสื่อสาร CAN กับแบตขาด ตรวจสายและลำดับ pin');
  if(P.batOn&&P.canOk&&!['none','dyness','liLV'].includes(S.bat))add('BatName-FAIL','เลือกรุ่นแบตไม่ตรงกับป้ายแบตจริง');
  if(P.meterFail)add('MET-SLT-Fail','ตั้งชนิดมิเตอร์ไม่ตรงกับมิเตอร์ที่ต่ออยู่');
  if(P.sc.grid&&!P.gridAt&&S.mode!=='off')add('NO-Grid','No grid: ไม่มีไฟกริดที่ขั้ว AC-GRID');
  if(o.ovl)add('Over-Load','Load overload fault: โหลด Backup เกินกำลังเครื่อง','stop');
  if(o.ovb)add('OV-Vbatt','Battery overvoltage: แบตเต็มแล้วยังมีไฟจากพอร์ต GEN ไหลเข้า (ไม่ได้ตั้ง AC couple input)','stop');
  return L;
}
/* ---- จำลองทั้งวัน ทีละ 5 นาที: การไหลของไฟตามโหมดที่ตั้ง ---- */
function slStep(h,soc,out){
  const P=slPhys(h,{out,soc}),S=SL.set,sc=P.sc,D=SL.dash,dt=1/12,cap=SL_BAT.kwh*1000*SL_BAT.dod/100;
  const r={h,pv:0,ac:0,lb:0,lg:0,grid:0,gridSeen:0,bat:0,soc,soc2:soc,cut:0,unsB:0,unsG:0,freq:50,st:'off',al:[],P};
  const load=slLoad(h)*(sc.loadK||1),share=!sc.grid?1:(P.a.backup==='bpanel'?0.55:0);
  let lb=load*share+(P.a.backup==='bpanel'?D.extra:0),lg=sc.grid?load*(1-share):0;
  r.lb=lb;r.lg=lg;
  const base=slAlarms(P);
  if(!P.powered){r.unsB=lb;r.lb=0;if(P.gridLive)r.grid=lg;else{r.unsG=lg;r.lg=0}r.al=base;return r}
  if(!SL.hmi.qdone||base.some(x=>x.sev==='stop')){r.st=SL.hmi.qdone?'stop':'init';r.unsB=lb;r.lb=0;if(P.gridLive)r.grid=lg;else{r.unsG=lg;r.lg=0}r.al=base;return r}
  const sun=slSun(h)*(1-D.cloud/100);
  let pv=SL.sw.dc?Math.min(SL_INV.pvMax,((P.ok1?P.n1:0)+(P.ok2?P.n2:0))*SL_WP*sun*0.62):0;
  const gt=P.a.gen==='gt'?3000*sun*0.65:0,acIn=(S.smart==='ac'||S.smart==='genset')?gt:0,freqCtl=S.smart==='ac';
  const batUse=P.batOn&&P.canOk&&['dyness','liLV'].includes(S.bat);
  const island=!P.gridAt||S.mode==='off';
  const floor=island?S.od:Math.max(S.reserve,S.od);
  const chgMax=batUse&&soc<S.maxSoc?Math.min(Math.min(S.chg,SL_INV.batI,SL_BAT.iMax)*SL_BAT.v,(S.maxSoc-soc)/100*cap/dt):0;
  const disMax=batUse&&soc>floor?Math.min(Math.min(S.dis,SL_INV.batI,SL_BAT.iMax)*SL_BAT.v,(soc-floor)/100*cap/dt):0;
  let b=0,ac=acIn,cut=0,o={};
  if(island){
    r.st='island';
    if(lb>SL_INV.pac*1.02){o.ovl=true;r.unsB=lb;lb=0}
    const net=lb-pv-ac;
    if(net>0){const d=Math.min(net,disMax,SL_INV.pac);b=-d;if(net-d>5){r.unsB=lb;lb=0;b=0;r.st='lowbat';cut=pv;pv=0}}
    else{const E=-net,c=Math.min(E,chgMax);b=c;let rest=E-c;const cp=Math.min(rest,pv);cut=cp;rest-=cp;
      if(rest>5){if(freqCtl){const cutAc=Math.min(rest,ac);ac-=cutAc;r.freq=50+Math.min(2,2*cutAc/3000);}else{o.ovb=true;r.unsB=lb;lb=0;b=0}}
      else if(freqCtl&&gt>0&&soc>=S.maxSoc-1)r.freq=50.6}
    if(P.gridLive&&P.a.grid==='main')r.grid=lg;else{r.unsG=lg;lg=0}
  }else{
    r.st='grid';
    const real=lb+lg-pv-ac;
    if(P.ctS===-1){b=real>0?chgMax:-Math.min(disMax,SL_INV.pac)}
    else{
      const net=P.ctS===1?real:lb-pv-ac;
      if(net<0){const E=-net;let c=0,ex=0,rem=E;
        if(S.mode==='sell'){ex=S.allowExp?Math.max(0,Math.min(rem,S.maxExp)):0;rem-=ex;c=Math.min(rem,chgMax);rem-=c}
        else{c=Math.min(rem,chgMax);rem-=c;ex=S.allowExp?Math.max(0,Math.min(rem,S.maxExp)):0;rem-=ex}
        if(P.ctS===0)rem=0;
        cut=Math.min(rem,pv);b=c}
      else b=-Math.min(net,disMax);
      const tm=h,inW=(w)=>w.s<=w.e?tm>=w.s&&tm<w.e:tm>=w.s||tm<w.e;
      if(S.gridChg&&batUse&&soc<=S.force+0.5)b=Math.max(b,chgMax);
      if(S.tou.c.on&&inW(S.tou.c)&&soc<S.tou.c.soc&&S.gridChg)b=Math.max(b,Math.min(S.tou.c.a*SL_BAT.v,chgMax));
      if(S.tou.d.on&&inW(S.tou.d)&&soc>S.tou.d.soc){const d=Math.min(S.tou.d.a*SL_BAT.v,disMax);b=Math.min(b,-(S.allowExp?d:Math.min(d,Math.max(0,net))))}
      if(S.peak&&b>0){const g=lb+lg-(pv-cut)-ac+b;if(g>S.peakW)b=Math.max(0,b-(g-S.peakW))}
    }
    pv-=cut;
    r.grid=lb+lg-pv-ac+b;
  }
  r.pv=pv;r.ac=ac;r.cut=cut;r.bat=b;r.lb=lb;r.lg=lg;r.gridSeen=P.ctS*r.grid;
  r.soc2=Math.max(0,Math.min(100,soc+b*dt/cap*100));
  r.al=base.concat(slAlarms({powered:true,sc,a:P.a},o).filter(x=>x.c==='Over-Load'||x.c==='OV-Vbatt'));
  return r;
}
function slDay(){
  if(SL._day)return SL._day;
  const D=SL.dash,rows=[],T={pv:0,ac:0,load:0,imp:0,exp:0,chg:0,dis:0,cut:0,unsB:0,unsBo:0,maxExp:0,expRev:0},al={};
  /* วันปกติ: เริ่มด้วย SOC ที่เหลือจากเมื่อวาน (จำลองซ้ำ 1 วันก่อน) ไม่ใช่ค่าเดาตอนเที่ยงคืน */
  let soc=D.soc0;for(let i=0;i<288;i++){const h=i/12;soc=slStep(h,soc,D.out&&h>=D.o0&&h<D.o1).soc2}
  const soc00=soc;
  for(let i=0;i<288;i++){const h=i/12,out=D.out&&h>=D.o0&&h<D.o1,r=slStep(h,soc,out);r.out=out;rows.push(r);soc=r.soc2;
    const k=1/12/1000;T.pv+=r.pv*k;T.ac+=r.ac*k;T.load+=(r.lb+r.lg)*k;if(r.grid>0)T.imp+=r.grid*k;else{T.exp+=-r.grid*k;T.maxExp=Math.max(T.maxExp,-r.grid)}
    if(r.bat>0)T.chg+=r.bat*k;else T.dis+=-r.bat*k;T.cut+=r.cut*k;T.unsB+=r.unsB*k;if(out)T.unsBo+=r.unsB*k;
    r.al.forEach(x=>{if(!al[x.c])al[x.c]=Object.assign({t:h},x)})}
  return SL._day={rows,T,al:Object.values(al),soc00};
}
const slNow=()=>{const d=slDay();return d.rows[Math.max(0,Math.min(287,Math.round(SL.dash.t/5)))]};

/* ---- ขั้นตอน Power ON ตามคู่มือ 5.2 (เล่นย้อนจากบันทึกการกด/วัด) ---- */
function slProc(){
  const sc=slSc(),need=[];
  const strs=[sc.s1?'pv1':null,sc.s2?'pv2':null].filter(Boolean);
  const st={pv:new Set(),bat:false,ac:new Set(),acOff:false,dcOn:false,on:false,qs:false,bk:false},bad=[];
  let qsAt=-1;
  SL.log.forEach((e,i)=>{
    if(e.k==='qdone'&&qsAt<0)qsAt=i;
    if(e.k==='meas'){
      if(strs.includes(e.n)&&!e.dc&&!st.dcOn)st.pv.add(e.n);
      if(e.n==='bat'&&e.bat&&!st.dcOn)st.bat=true;
      if(['gLN','gLPE','gNPE'].includes(e.n)&&e.grid&&!st.dcOn)st.ac.add(e.n);
    }
    if(e.k==='sw'){
      if(e.n==='dc'&&e.v){if(!st.dcOn&&strs.some(s=>!st.pv.has(s)))bad.push('เปิด DC switch ก่อนวัดแรงดันและขั้ว PV ครบทุกสตริง');st.dcOn=true}
      if(e.n==='grid'&&!e.v&&st.ac.size===3&&!st.dcOn)st.acOff=true;
      if(e.n==='grid'&&e.v&&st.dcOn)st.on=true;
      if(e.n==='grid'&&e.v&&!st.dcOn&&st.acOff&&st.ac.size===3)bad.push('เปิด OCPD ฝั่งกริดค้างไว้ก่อนเปิด DC switch (ขั้นที่ 3 ให้เปิด DC switch ก่อน)');
      if(e.n==='backup'&&e.v){if(qsAt<0)bad.push('เปิดเบรกเกอร์ตู้ Backup ก่อน commissioning เสร็จ');else st.bk=true}
    }
  });
  const steps=[['pre','ตรวจความพร้อมก่อนเปิดเครื่อง (ข้อ 5.1) ครบ 7 ข้อ',SL.pre.length===SL_PRE.length]];
  steps.push(['pv','DC switch ปิดอยู่ วัดแรงดันและขั้ว PV ทุกสตริงที่ต่อ',strs.every(s=>st.pv.has(s))]);
  if(sc.bat)steps.push(['bat','เปิดเบรกเกอร์แบต แล้ววัดแรงดันและขั้วที่ขั้ว BAT',st.bat]);
  if(sc.grid)steps.push(['ac','เปิด OCPD ฝั่งกริด วัด L–N, L–PE, N–PE แล้วปิด OCPD ไว้ก่อน',st.ac.size===3&&st.acOff]);
  steps.push(['on',sc.grid?'เปิด DC switch แล้วจึงเปิด OCPD ฝั่งกริด':'เปิด DC switch',sc.grid?st.on&&SL.sw.dc&&SL.sw.grid:SL.sw.dc&&st.dcOn]);
  steps.push(['qs','ทำ Quick Setting ที่หน้าจอให้ครบ 5 ขั้น',SL.hmi.qdone]);
  if(sc.backup)steps.push(['bk','commissioning เสร็จแล้ว จึงเปิดเบรกเกอร์ตู้โหลด Backup',st.bk&&SL.sw.backup]);
  return{steps,bad:[...new Set(bad)]};
}
/* ลำดับปิดเครื่อง (5.3): AC breaker → DC switch → เบรกเกอร์แบต แล้ววัดให้เหลือ 0 V */
function slOffSeq(){
  const offs=[];let lastAllOn=-1;
  SL.log.forEach((e,i)=>{if(e.k==='sw'&&e.v)lastAllOn=i});
  SL.log.slice(lastAllOn+1).forEach(e=>{if(e.k==='sw'&&!e.v&&['grid','dc','bat'].includes(e.n))offs.push(e.n)});
  return offs;
}

/* ---- เกณฑ์ตรวจของโจทย์ ---- */
function slChecks(){
  const sc=slSc(),S=SL.set,want=slWant(sc),p=SL.ports,out={job:[],pwr:[],hmi:[],dash:[]};
  const J=(ok,t,lvl)=>out.job.push([ok,t,lvl]);
  const used={};['grid','backup','gen'].forEach(k=>{if(p[k]!=='none')(used[p[k]]=used[p[k]]||[]).push(k)});
  Object.entries(used).forEach(([d,ks])=>{if(ks.length>1)J(false,`อุปกรณ์เดียวกันต่อหลายพอร์ต (${ks.map(k=>k.toUpperCase()).join(', ')})`,'err')});
  if(p.backup==='main')J(false,'ห้ามต่อพอร์ต AC-BACKUP เข้าตู้เมนที่มีไฟกริด (คำเตือนในคู่มือข้อ 2.2)','err');
  if(p.grid==='bpanel')J(false,'ตู้โหลด Backup ต้องต่อที่พอร์ต AC-BACKUP ไม่ใช่ AC-GRID','err');
  if(p.grid==='gt'||p.backup==='gt')J(false,'อินเวอร์เตอร์ออนกริดเดิมต้องต่อที่พอร์ต GEN แล้วตั้ง Smart Port เป็น AC couple input','err');
  if(p.gen==='main')J(false,'พอร์ต GEN ห้ามต่อเข้าตู้เมน','err');
  J(p.pv1==='str'&&p.pv2===want.pv2,`PV: ${sc.s2?'สตริง 8 แผงเข้า PV1 และ 6 แผงเข้า PV2':'สตริง 8 แผงเข้า PV1 (PV2 ว่าง)'}`);
  J(p.bat===want.bat,sc.bat?'ต่อแบตเข้า BAT+ / BAT− ผ่านเบรกเกอร์ DC':'ไม่มีแบตในงานนี้ ขั้ว BAT ว่าง');
  J(p.bms===want.bms,sc.bat?'ต่อสาย CAN เข้า BMS':'ไม่มีแบต ไม่ต้องต่อ BMS');
  J(p.grid===want.grid,sc.grid?'AC-GRID ต่อตู้เมนผ่าน OCPD 2P':'ไม่มีไฟการไฟฟ้า AC-GRID ว่าง');
  if(sc.backup)J(p.backup==='bpanel','AC-BACKUP ต่อตู้โหลด Backup');
  J(p.gen===want.gen,sc.gen?'อินเวอร์เตอร์ออนกริดเดิมต่อที่พอร์ต GEN':'พอร์ต GEN ว่าง');
  if(sc.ct){J(p.ct==='grid','ติด CT ที่สายเมนตรงจุดเชื่อมต่อการไฟฟ้า');J(p.ct==='grid'&&p.ctArrow==='grid','ลูกศร CT ชี้ไปทางการไฟฟ้า');J(p.ct==='grid'&&p.ctWire==='ok','สาย CT ขาว → ขั้ว 1, ดำ → ขั้ว 2')}
  else J(p.ct==='none','ไม่มีกริด ไม่ต้องติด CT');
  J(p.meter==='none',sc.ct?'ใช้ CT ที่แถมมา ไม่ต่อมิเตอร์ RS485':'ไม่มีมิเตอร์ในงานนี้');
  const pr=slProc();pr.steps.forEach(s=>out.pwr.push([s[2],s[1]]));pr.bad.forEach(t=>out.pwr.push([false,t,'err']));
  const H=(ok,t)=>out.hmi.push([ok,t]);
  H(SL.hmi.qdone,'ทำ Quick Setting ครบ (เวลา → มิเตอร์ → Grid code → Storage mode → แบต)');
  H(S.time,'ตั้งวันและเวลาเครื่อง');
  if(sc.grid)H(S.grid===sc.area,`Grid code = ${sc.area} ตามพื้นที่ใบสั่งงาน`);
  H(sc.ct?S.meter==='ct'&&S.ctDir==='fwd'&&+S.ctRatio===2000:S.meter==='none',sc.ct?'Meter setting: CT, Direction Forward, CT ratio 2000:1':'Meter setting: No Meter (ไม่มี CT/มิเตอร์)');
  const wm=sc.grid?'self':'off';H(S.mode===wm,`Storage mode = ${wm==='self'?'Self-use':'Off grid'}`);
  if(SL.sc==='ongrid')H(S.allowExp&&S.maxExp>0&&S.maxExp<=5000,'Allow export เปิด และ Max export power ไม่เกิน 5,000 W');
  if(SL.sc==='hybrid')H(!S.allowExp||S.maxExp<=0,'ห้ามขายไฟ: ปิด Allow export หรือ Max export power = 0');
  if(SL.sc==='accouple')H(S.allowExp,'Allow export เปิด (ขายไฟคืนได้)');
  H(sc.bat?['dyness','liLV'].includes(S.bat):S.bat==='none',sc.bat?'Battery model = Dyness (หรือ Lithium Battery LV)':'Battery model = No Battery');
  if(sc.bat){H(S.chg<=SL_BAT.iRec&&S.dis<=SL_BAT.iRec&&S.chg<=SL_INV.batI&&S.dis<=SL_INV.batI&&S.chg>=20&&S.dis>=20,'Max charge / discharge current 20–135 A (ไม่เกินแบต 140 A และเครื่อง 135 A)');
    H(S.force<S.od&&S.od<S.rec,'Force charge < Over discharge < Recovery');
    if(sc.grid)H(S.reserve>=30&&S.reserve<=60,'Battery reserve 30–60% (สำรองไว้สำหรับไฟดับ)');else H(S.od>=15&&S.od<=30,'Over discharge 15–30%')}
  H(S.smart===(sc.gen?'ac':'none'),sc.gen?'Smart Port = AC couple input':'Smart Port ไม่ใช้งาน');
  const d=slDay(),T=d.T,stop=d.al.filter(a=>a.sev==='stop'),Dd=(ok,t)=>out.dash.push([ok,t]);
  Dd(d.rows.some(r=>r.st==='grid'||r.st==='island'),'อินเวอร์เตอร์ทำงานได้ (เปิดเครื่องและ commissioning แล้ว)');
  Dd(!stop.length,'ไม่มี alarm ที่ทำให้เครื่องหยุด'+(stop.length?` (${stop.map(a=>a.c).join(', ')})`:''));
  if(sc.ct)Dd(d.rows.every(r=>r.st!=='grid'||r.P.ctS===1),'CT วัดทิศถูกต้อง (ค่ากริดบนจอตรงกับของจริง)');
  if(SL.sc==='ongrid')Dd(T.maxExp<=5050&&T.exp>0.5,`ขายไฟได้และไม่เกิน 5 kW (สูงสุด ${slF(T.maxExp)} W)`);
  if(SL.sc==='hybrid')Dd(T.exp<=0.05&&T.chg>2,`ไม่มีไฟย้อนเข้ากริด (${slF(T.exp,2)} kWh) และชาร์จแบตจากแผง (${slF(T.chg,1)} kWh)`);
  if(sc.grid&&sc.backup)Dd(SL.dash.out&&SL.dash.o1-SL.dash.o0>=3&&T.unsBo<0.01,'ทดสอบไฟดับอย่างน้อย 3 ชม. แล้วโหลด Backup ไม่ดับ');
  if(!sc.grid)Dd(T.unsB<0.01,'โหลดทั้งบ้านมีไฟตลอดวัน');
  if(sc.gen)Dd(T.ac>1&&!d.al.some(a=>a.c==='OV-Vbatt'),`อินเวอร์เตอร์ออนกริดเดิมผลิตได้ (${slF(T.ac,1)} kWh) และไม่ขึ้น OV-Vbatt ตอนไฟดับ`);
  return out;
}
function slScore(){const c=slChecks(),all=[...c.job,...c.pwr,...c.hmi,...c.dash];const n=all.filter(x=>x[0]).length;return{c,n,all:all.length,ok:n===all.length}}
function slDoneCount(){return Object.values(SL.done).filter(Boolean).length}

/* ---- render ---- */
function slChanged(full){SL._day=null;const s=slScore();if(s.ok&&!SL.faults.length&&!SL.done[SL.sc]){SL.done[SL.sc]=true}
  if(full!==false)slRender();else slLive();if(typeof touch==='function')touch()}
function slRender(){
  const host=document.getElementById('slhost');if(!host)return;
  const s=slScore(),sc=slSc();
  host.innerHTML=`<div class="verdict ${s.ok?'ok':s.n/s.all>.6?'warn':'err'}"><b>${esc(sc.n)}</b><span>${s.ok?'ผ่านครบทุกข้อ':'ผ่าน '+s.n+' / '+s.all+' ข้อ'}</span>${SL.faults.length?'<span class="pill warn">มีโจทย์หาข้อผิดพลาด</span>':''}<span class="nums">${esc(SL_INV.model)} · ผ่านแล้ว ${slDoneCount()}/4 ระบบ</span></div>
  <div class="bar"><div class="grp" role="group" aria-label="ระบบ"><span class="lab">ระบบ</span>${Object.entries(SL_SC).map(([k,v])=>`<button class="chip" data-slsc="${k}" aria-pressed="${SL.sc===k}">${SL.done[k]?'✓ ':''}${esc(v.n)}</button>`).join('')}</div></div>
  <div class="bar"><div class="grp" role="group" aria-label="ขั้นตอน">${[['job','1 ใบสั่งงานและการต่อพอร์ต'],['power','2 ตรวจวัดและ Power ON/OFF'],['hmi','3 หน้าจอเครื่องและการตั้งค่า'],['dash','4 แดชบอร์ดและทดสอบ'],['fault','5 โจทย์หาข้อผิดพลาด']].map(([k,t])=>`<button class="chip" data-slpg="${k}" aria-pressed="${SL.page===k}">${t}</button>`).join('')}</div></div>
  <div id="slpage">${SL.page==='job'?slPgJob(s):SL.page==='power'?slPgPower(s):SL.page==='hmi'?slPgHmi(s):SL.page==='dash'?slPgDash(s):slPgFault()}</div>`;
  slLive();
}
const slList=(arr)=>`<ul class="slchk">${arr.map(([ok,t,l])=>`<li class="${ok?'ok':l==='err'?'err':''}">${esc(t)}</li>`).join('')}</ul>`;
function slPgJob(s){
  const sc=slSc(),p=SL.ports;
  return `<div class="cards"><div class="card"><h3>ใบสั่งงาน: ${esc(sc.n)}</h3><p class="sltxt">${esc(sc.brief)}</p>
    <table class="t"><tbody><tr><th>อินเวอร์เตอร์</th><td>${SL_INV.model} 6 kW 1 เฟส</td></tr><tr><th>แผง</th><td>${SL_WP} W · Voc ${SL_VOC} V (ตัวอย่าง)</td></tr><tr><th>PV สูงสุด / MPPT</th><td>500 V · 90–435 V × 2</td></tr>${sc.bat?`<tr><th>แบต</th><td>${SL_BAT.name}</td></tr>`:''}<tr><th>พื้นที่ / grid code</th><td>${sc.area||'ไม่มีกริด'}</td></tr></tbody></table></div>
   <div class="card"><h3>ต่ออุปกรณ์เข้าพอร์ตของเครื่อง</h3><div class="slports">${SL_PORTS.map(([k,l,opts])=>`<label class="slport"><span>${esc(l)}</span><select data-slp="${k}" id="slp-${k}">${opts.map(([v,t])=>`<option value="${v}" ${p[k]===v?'selected':''}>${esc(t)}</option>`).join('')}</select></label>`).join('')}</div>
   <p class="hint tight">ผังตามคู่มือข้อ 3.4: GRID → OCPD ในตู้เมน · BACKUP → ตู้โหลด Backup (ห้ามต่อกับกริด) · CT ที่จุดเชื่อมต่อกริด ลูกศรชี้ไปทางกริด · CAN เข้า BMS</p></div></div>
   <div class="cards"><div class="card"><h3>ผังระบบ</h3>${slSLD()}</div><div class="card"><h3>ตรวจการต่อพอร์ต</h3>${slList(s.c.job)}</div></div>`;
}
function slSLD(){
  const p=SL.ports,sc=slSc(),W=640,Hh=300,box=(x,y,w,h,t,sub,on)=>`<g opacity="${on?1:.35}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" class="slnode"/><text x="${x+w/2}" y="${y+h/2-2}" class="svgt b" text-anchor="middle">${t}</text>${sub?`<text x="${x+w/2}" y="${y+h/2+15}" class="svgt mut" text-anchor="middle" font-size="11">${sub}</text>`:''}</g>`;
  const ln=(x1,y1,x2,y2,cls,on)=>on?`<path d="M${x1} ${y1} L${x2} ${y2}" class="slline ${cls}"/>`:'';
  const ix=250,iy=95,iw=140,ih=110;
  const dev={main:[500,30,'ตู้เมน','OCPD 2P'],bpanel:[500,200,'ตู้ Backup','โหลดสำคัญ'],gt:[500,115,'Grid-tie เดิม','3 kW']};
  const portY={grid:115,backup:150,gen:185};
  let lines='',boxes='';
  ['grid','backup','gen'].forEach(k=>{const d=p[k];if(d==='none')return;const D=dev[d];lines+=ln(ix+iw,portY[k],D[0],D[1]+22,k==='backup'&&d==='main'?'bad':'ac',true)+`<text x="${ix+iw+8}" y="${portY[k]-5}" class="svgt m" font-size="11">${k.toUpperCase()}</text>`});
  Object.entries(dev).forEach(([k,D])=>{boxes+=box(D[0],D[1],130,48,D[2],D[3],Object.values(p).includes(k))});
  const grid=sc.grid?`<g><rect x="590" y="0" width="0" height="0"/></g>`:'';
  lines+=ln(70,70,ix,125,'dc',p.pv1==='str')+ln(70,150,ix,145,'dc',p.pv2==='str')+ln(70,250,ix,190,'dc',p.bat==='bat');
  boxes+=box(10,46,110,46,'สตริง 1',sc.s1+' แผง',p.pv1==='str')+box(10,126,110,46,'สตริง 2',sc.s2?sc.s2+' แผง':'—',p.pv2==='str')+box(10,226,110,46,'แบต 51.2 V',sc.bat?'14.3 kWh':'—',p.bat==='bat');
  const ct=p.ct==='grid'?`<g><circle cx="${600}" cy="12" r="9" class="slct"/><text x="${600}" y="16" class="svgt b" text-anchor="middle" font-size="11">${p.ctArrow==='grid'?'→':'←'}</text><text x="560" y="16" class="svgt m" font-size="11">CT</text></g>`:'';
  const pole=sc.grid?`<text x="${W-6}" y="16" class="svgt mut" text-anchor="end" font-size="11">การไฟฟ้า ⚡</text><path d="M630 54 L630 22" class="slline ac"/>`:`<text x="${W-6}" y="16" class="svgt mut" text-anchor="end" font-size="11">ไม่มีกริด</text>`;
  return `<div class="tblwrap"><svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="ผังระบบ">${grid}${lines}${boxes}<rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" rx="10" class="slinv"/><text x="${ix+iw/2}" y="${iy+30}" class="svgt b" text-anchor="middle">Solis S6-EH1P6K</text><text x="${ix+iw/2}" y="${iy+50}" class="svgt mut" text-anchor="middle" font-size="11">Hybrid 6 kW</text>${pole}${ct}</svg></div>`;
}
function slPgPower(s){
  const P=slPhys(SL.dash.t/60),sw=SL.sw,sc=slSc(),m=SL.mlast,offs=slOffSeq();
  const swb=(k,t,dis)=>`<button class="slsw ${sw[k]?'on':''}" data-slsw="${k}" aria-pressed="${sw[k]}" ${dis?'disabled':''}><span class="sllever"></span><span>${t}</span><b>${sw[k]?'ON':'OFF'}</b></button>`;
  return `<div class="cards"><div class="card"><h3>ตรวจก่อนเปิดเครื่อง (5.1)</h3><div class="slpre">${SL_PRE.map((t,i)=>`<label><input type="checkbox" data-slpre="${i}" id="slpre-${i}" ${SL.pre.includes(i)?'checked':''}> ${esc(t)}</label>`).join('')}</div></div>
   <div class="card"><h3>สวิตช์และเบรกเกอร์</h3><div class="slsws">${swb('bat','เบรกเกอร์แบต',!sc.bat)}${swb('dc','DC switch (ที่ตัวเครื่อง)')}${swb('grid','OCPD ฝั่งกริด (ตู้เมน)',!sc.grid)}${swb('backup','เบรกเกอร์ตู้ Backup',!sc.backup)}</div>
   <div class="slleds" id="slleds"></div>
   <label class="sltime">เวลาหน้างาน <input type="range" min="300" max="1200" step="15" value="${SL.dash.t}" data-sltime id="sltime-p"><b id="sltimep">${slHM(SL.dash.t)}</b></label></div>
   <div class="card"><h3>มัลติมิเตอร์</h3><div class="slmeter"><select id="slmpt" aria-label="จุดวัด">${SL_MPT.map(([k,t])=>`<option value="${k}" ${m&&m.n===k?'selected':''}>${esc(t)}</option>`).join('')}</select><button class="btn pri" data-slact="meas">วัด</button></div>
   <div class="sldmm"><span class="sldmmv">${m?esc(m.txt):'— —'}</span><span class="sldmmu">${m?esc(m.unit):''}</span></div><p class="hint tight" id="slmnote">${m&&m.note?esc(m.note):'เลือกจุดวัดแล้วกด "วัด" ผลจะถูกบันทึกเป็นขั้นตอน'}</p></div></div>
   <div class="cards"><div class="card"><h3>ขั้นตอน Power ON (5.2)</h3>${slList(s.c.pwr)}<div class="actions"><button class="btn sm" data-slact="resetpwr">เริ่มใหม่ (ปิดทุกสวิตช์ ล้างบันทึก)</button></div></div>
   <div class="card"><h3>ขั้นตอน Power OFF (5.3)</h3><p class="sltxt">ปิด AC breaker → ปิด DC switch → ปิดเบรกเกอร์แบต → วัดว่าแรงดันแบตและ AC เป็น 0 V</p>
   <p class="sltxt">ลำดับที่ปิดล่าสุด: <b>${offs.length?offs.map(k=>({grid:'AC',dc:'DC',bat:'แบต'})[k]).join(' → '):'ยังไม่ได้ปิด'}</b> ${offs.length>=2?(slOffOk(offs)?'<span class="pill ok">ถูกลำดับ</span>':'<span class="pill err">ผิดลำดับ</span>'):''}</p>
   <p class="hint tight">ถ้าสาย DC กลับขั้วหรือเครื่องผิดปกติ ห้ามปิด DC switch ขณะมีกระแส ให้ใช้แคลมป์วัดกระแสสตริง รอจนต่ำกว่า 0.5 A ก่อน (คู่มือข้อ 3.6)</p></div></div>`;
}
function slOffOk(o){const need=['grid','dc','bat'].filter(k=>o.includes(k));const idx=need.map(k=>o.indexOf(k));return idx.every((v,i)=>i===0||v>idx[i-1])}
function slMeasure(n){
  const P=slPhys(SL.dash.t/60),sc=slSc();let v=0,txt='',unit='',note='';
  const fmt=(x,d)=>(x<0?'−':'')+Math.abs(x).toFixed(d);
  const invOn=P.powered&&SL.hmi.qdone&&!slAlarms(P).some(a=>a.sev==='stop');
  switch(n){
    case'pv1':v=P.v1;txt=fmt(v,1);unit='V DC';note=v>SL_INV.vmax?'เกิน 500 V ที่เครื่องรับได้ ห้ามเปิด DC switch':v===0&&SL.ports.pv1==='str'?'ไม่มีแสงหรือไม่ได้ต่อสาย':v?`อยู่ในช่วง MPPT ${v<=SL_INV.mHi?'(90–435 V)':'นอกช่วงเต็มกำลัง'}`:'';break;
    case'pv2':v=P.v2;txt=fmt(v,1);unit='V DC';note=v<0?'ค่าติดลบ: ขั้วกลับ ต้องแก้ก่อนเสียบเข้าเครื่อง':'';break;
    case'bat':v=P.vb;txt=fmt(v,1);unit='V DC';note=!SL.sw.bat&&P.batIn?'เบรกเกอร์แบตยังปิดอยู่':P.batIn&&SL.sw.bat&&!v?'เปิดเบรกเกอร์แล้วแต่ไม่มีแรงดัน ตรวจฟิวส์/เบรกเกอร์ DC':v?'ช่วงแบตของเครื่อง 40–60 V':'';break;
    case'gLN':case'gLPE':case'gNPE':{const at=P.gridAt;if(!at){v=0}else if(!P.pe&&n!=='gLN'){txt='ค่าไม่นิ่ง';unit='V AC';note='PE ลอย: ตรวจสายดิน';break}else v=n==='gLN'?230:n==='gLPE'?(P.ln?0.4:230):(P.ln?230:0.4);txt=fmt(v,1);unit='V AC';
      if(at&&P.ln&&n!=='gLN')note='L–PE ≈ 0 แต่ N–PE ≈ 230 V: สาย L กับ N สลับ';if(!at&&sc.grid)note=SL.sw.grid?'ไม่มีไฟถึงขั้ว ตรวจการต่อพอร์ต GRID':'OCPD ปิดอยู่';break}
    case'bkLN':v=P.bkGrid?230:(invOn&&SL.sw.backup?230:0);txt=fmt(v,1);unit='V AC';note=P.bkGrid?'มีไฟกริดย้อนเข้าพอร์ต BACKUP: ห้ามเปิดเครื่อง ตรวจสาย Backup':invOn?'เครื่องจ่ายไฟ Backup อยู่':'';break;
    case'pe':txt=P.pe?'0.3':'OL';unit='Ω';note=P.pe?'ต่อเนื่องดี':'ไม่ต่อเนื่อง: ยังไม่ได้ต่อสายดินที่ตัวเครื่อง (M4, ≥ 4 mm²)';break;
    case'ctLook':txt=P.a.ct==='grid'?(P.a.ctArrow==='grid'?'→ กริด':'← บ้าน'):'ไม่มี CT';unit='';note=P.a.ct==='grid'?(P.F.has('ct_open')?'สาย CT หลุดจากขั้ว 12-pin':`สายขาว → ขั้ว ${P.a.ctWire==='ok'?1:2}, ดำ → ขั้ว ${P.a.ctWire==='ok'?2:1}`):'';break;
    case'canLook':txt=SL.ports.bms==='can'?(P.F.has('can_pin')?'pin ไม่ตรง':'pin ตรง'):'ไม่มีสาย';unit='';note=SL.ports.bms==='can'?(P.F.has('can_pin')?'ฝั่งเครื่อง CAN-H = pin 4, CAN-L = pin 5 แต่หัวฝั่งแบตเข้าคนละคู่':'CAN-H pin 4 (ฟ้า), CAN-L pin 5 (ฟ้าขาว) ตรงกับแบต'):'';break;
  }
  SL.mlast={n,txt,unit,note};SL.log.push({k:'meas',n,v,dc:SL.sw.dc,bat:SL.sw.bat,grid:SL.sw.grid});
  if(SL.log.length>400)SL.log=SL.log.slice(-400);
}
/* ---- หน้าจอ HMI 7 นิ้ว + ปุ่ม ESC UP DOWN ENTER ---- */
function slPgHmi(s){
  return `<div class="cards"><div class="card sldevcard"><div class="sldev"><div class="sldevtop"><span class="sllogo">solis</span><span class="slmodel">${SL_INV.model}</span></div>
   <div class="slscr" id="slscr"></div>
   <div class="slkeys">${['esc','up','down','enter'].map(k=>`<button class="slkey" data-slkey="${k}" aria-label="${k.toUpperCase()}">${({esc:'ESC',up:'▲',down:'▼',enter:'ENTER'})[k]}</button>`).join('')}</div><div class="slleds" id="slleds"></div></div>
   <p class="hint tight">แตะรายการบนจอได้โดยตรง หรือใช้ปุ่ม ▲ ▼ เลือก ENTER เข้า ESC ย้อนกลับ เหมือนปุ่มหน้าเครื่องจริง</p><div class="actions"><button class="btn sm" data-slact="factory">ล้างการตั้งค่าเครื่อง (เริ่ม Quick Setting ใหม่)</button></div></div>
   <div class="card"><h3>ตรวจการตั้งค่า</h3>${slList(s.c.hmi)}</div></div>`;
}
const slSel=(path,opts,v)=>`<select class="hn" data-sls="${path}" id="sls-${path.replace(/\./g,'-')}">${opts.map(([k,t])=>`<option value="${k}" ${String(v)===String(k)?'selected':''}>${esc(t)}</option>`).join('')}</select>`;
const slNum=(path,v,min,max,step,u)=>`<span class="slnum"><input class="hn" type="number" data-sls="${path}" id="sls-${path.replace(/\./g,'-')}" value="${v}" min="${min}" max="${max}" step="${step||1}"><i>${u||''}</i></span>`;
const slChk=(path,v,t)=>`<label class="slck"><input class="hn" type="checkbox" data-sls="${path}" id="sls-${path.replace(/\./g,'-')}" ${v?'checked':''}> ${t}</label>`;
const slRow=(l,c)=>`<div class="slrow"><span>${l}</span><span>${c}</span></div>`;
function slScreen(){
  const P=slPhys(SL.dash.t/60),H=SL.hmi,S=SL.set,today=new Date();
  const dt=slDT();
  const bar=t=>`<div class="hmibar"><span>${t}</span><span>${dt}</span></div>`;
  if(!P.powered)return `<div class="hmioff">จอดับ: เครื่องยังไม่มีไฟเลี้ยง<br><small>เปิดได้จาก PV อย่างเดียว แบตอย่างเดียว หรือกริดอย่างเดียว (ข้อ 5.2)</small></div>`;
  if(!H.qdone){
    const q=H.q,names=['Inverter Time','Meter Setting','Grid Code','Storage Mode','Battery Model'];
    let body='';
    if(q===0)body=slRow('Follow Phone Time',`<button class="hn slb" data-slact="settime">${S.time?'ตั้งแล้ว ✓':'Set'}</button>`);
    if(q===1)body=slRow('Meter Type',slSel('meter',SL_METERS,S.meter))+(S.meter==='ct'?slRow('Location','Grid side')+slRow('Direction',slSel('ctDir',[['fwd','Forward'],['rev','Reverse']],S.ctDir))+slRow('CT ratio',slNum('ctRatio',S.ctRatio,100,5000,100,':1')):'');
    if(q===2)body=slRow('Grid Code',slSel('grid',SL_GRIDCODE,S.grid));
    if(q===3)body=slStorage();
    if(q===4)body=slRow('Battery Model',slSel('bat',SL_BATM,S.bat))+(S.bat!=='none'?slRow('Max charge current',slNum('chg',S.chg,0,135,1,'A'))+slRow('Max discharge current',slNum('dis',S.dis,0,135,1,'A')):'');
    return bar('QUICK SETTING '+(q+1)+'/5')+`<div class="hmibody"><div class="hmistep">${names.map((n,i)=>`<span class="${i===q?'on':i<q?'dn':''}">${n}</span>`).join('<i>›</i>')}</div>${body}</div>
      <div class="hmifoot">${q>0?'<button class="hn slb" data-slq="-1">Back</button>':'<span></span>'}<button class="hn slb pri" data-slq="1">${q<4?'Next':'Finish'}</button></div>`;
  }
  const scr=H.scr,go=(k,t,ic)=>`<button class="hn hmiitem" data-slgo="${k}"><i>${ic||'›'}</i>${t}</button>`;
  switch(scr){
    case'home':return bar('Devices Status')+`<div class="hmibody flow" data-slgo="menu" title="แตะเพื่อเข้า MENU (ENTER)">${slFlow(true)}</div>`;
    case'energy':{const T=slDay().T;return bar('MONTHLY ENERGY')+`<div class="hmibody">${slRow('PV (วันนี้)',slF(T.pv,1)+' kWh')+slRow('Load',slF(T.load,1)+' kWh')+slRow('Grid import',slF(T.imp,1)+' kWh')+slRow('Grid export',slF(T.exp,1)+' kWh')+slRow('Battery charge / discharge',slF(T.chg,1)+' / '+slF(T.dis,1)+' kWh')}</div>`}
    case'menu':return bar('HOME')+`<div class="hmibody grid2">${go('plant','PLANT INFORMATION','▤')}${go('alarm','ALARM INFORMATION','⚠')}${go('sys','SYSTEM SETTING','⚙')}${go('pro','PROFESSIONAL SETTING','✎')}</div>`;
    case'plant':{const r=slNow(),T=slDay().T,pt=H.pt;const tabs=[['pv','PV'],['bat','BATTERY'],['grid','GRID'],['load','LOAD'],['more','MORE']].map(([k,t])=>`<button class="hn slb ${pt===k?'pri':''}" data-slpt="${k}">${t}</button>`).join('');
      let b='';if(pt==='pv')b=slRow('PV1 voltage',slF(Math.max(0,P.v1),1)+' V')+slRow('PV2 voltage',slF(Math.max(0,P.v2),1)+' V')+slRow('PV power',slF(r.pv)+' W')+slRow('Today yield',slF(T.pv,1)+' kWh');
      if(pt==='bat')b=slRow('Battery voltage',slF(P.vb,1)+' V')+slRow('SOC',slF(r.soc)+' %')+slRow('Power',(r.bat>=0?'Charge ':'Discharge ')+slF(Math.abs(r.bat))+' W')+slRow('BMS comm.',P.batOn&&P.canOk?'OK':'Fail');
      if(pt==='grid')b=slRow('Grid voltage',slF(P.gridAt?230:0)+' V')+slRow('Frequency',slF(r.freq,2)+' Hz')+slRow('Meter/CT power',slF(r.gridSeen)+' W')+slRow('Import / Export today',slF(T.imp,1)+' / '+slF(T.exp,1)+' kWh');
      if(pt==='load')b=slRow('Backup load',slF(r.lb)+' W')+slRow('Grid-side load',slF(r.lg)+' W')+slRow('Today load',slF(T.load,1)+' kWh');
      if(pt==='more')b=slRow('Model',SL_INV.model)+slRow('Inverter SN','6031-xxxx-xxxx (ตัวอย่าง)')+slRow('Software version','ตัวอย่างในแบบจำลอง');
      return bar('PLANT INFORMATION')+`<div class="hmibody"><div class="hmitabs">${tabs}</div>${b}</div>`}
    case'alarm':{const cur=slAlarms(P),hist=slDay().al;return bar('ALARM INFORMATION')+`<div class="hmibody"><div class="hmisub">Current Alarm</div>${cur.length?cur.map(a=>slRow(`<b class="${a.sev==='stop'?'alr':'alw'}">${esc(a.c)}</b>`,esc(a.d))).join(''):'<p class="hmiempty">ไม่มี alarm</p>'}<div class="hmisub">Historical Alarm (วันนี้)</div>${hist.length?hist.map(a=>slRow(`${slHM(a.t*60)} <b>${esc(a.c)}</b>`,'')).join(''):'<p class="hmiempty">ไม่มีประวัติ</p>'}</div>`}
    case'sys':return bar('SYSTEM SETTING')+`<div class="hmibody grid2">${go('storage','STORAGE MODE','◎')}${go('parallel','PARALLEL SETTING','⫴')}${go('battery','BATTERY SETTING','▮')}${go('basic','BASIC SETTING','☰')}${go('smart','SMART PORT','⇄')}${go('gridport','GRID PORT','⚡')}</div>`;
    case'storage':return bar('STORAGE MODE')+`<div class="hmibody">${slStorage(true)}</div>`;
    case'battery':{const bad=!(S.force<S.od&&S.od<S.rec);return bar('BATTERY SETTING')+`<div class="hmibody">${slRow('Battery Model',slSel('bat',SL_BATM,S.bat))+slRow('Max charge current',slNum('chg',S.chg,0,135,1,'A'))+slRow('Max discharge current',slNum('dis',S.dis,0,135,1,'A'))+slRow('Over discharge SOC',slNum('od',S.od,5,40,1,'%'))+slRow('Recovery SOC',slNum('rec',S.rec,S.od+1,S.od+20,1,'%'))+slRow('Force charge SOC',slNum('force',S.force,1,39,1,'%'))+slRow('Max charge SOC',slNum('maxSoc',S.maxSoc,50,100,1,'%'))}${bad?'<p class="hmierr">Force charge &lt; Over discharge &lt; Recovery ไม่เช่นนั้นการตั้งค่าผิดพลาด</p>':''}</div>`}
    case'smart':return bar('SMART PORT')+`<div class="hmibody">${slRow('Smart Port',slSel('smart',SL_SMART,S.smart))}${S.smart==='ac'?'<p class="hmiinfo">AC couple input: อินเวอร์เตอร์ออนกริดต่อที่พอร์ต GEN เครื่อง Hybrid ใช้ Freq-Watt ปรับกำลังของอินเวอร์เตอร์นั้น ตรวจการตั้งค่า Freq-Watt ของเครื่องนั้นกับผู้ผลิตก่อน</p>':S.smart==='genset'?'<p class="hmiinfo">Genset input: เครื่องปั่นไฟต่อที่พอร์ต GEN</p>':S.smart==='smart'?'<p class="hmiinfo">Smart load output: ตัดไฟโหลดที่พอร์ต GEN เมื่อ SOC ต่ำกว่าค่า OFF</p>':''}</div>`;
    case'gridport':return bar('GRID PORT')+`<div class="hmibody">${slRow('Grid Code',slSel('grid',SL_GRIDCODE,S.grid))}</div>`;
    case'parallel':return bar('PARALLEL SETTING')+`<div class="hmibody">${slRow('Parallel system','Disable (เครื่องเดี่ยว)')+slRow('Master / Slave','Master')+slRow('Address ID','1')}<p class="hmiinfo">เครื่องเดี่ยว: DIP switch 1 และ 2 อยู่ตำแหน่งล่างทั้งคู่</p></div>`;
    case'basic':return bar('BASIC SETTING')+`<div class="hmibody">${slRow('Date and Time',`<button class="hn slb" data-slact="settime">${S.time?'ตั้งแล้ว ✓':'Set'}</button>`)+slRow('Language',slSel('lang',[['English','English']],S.lang))}</div>`;
    case'pro':return bar('PROFESSIONAL SETTING')+`<div class="hmibody"><p class="hmiinfo">Function / Protection / Device / Compensate / Advanced Setting ใช้รหัส installer และเปลี่ยนค่าป้องกันของเครื่อง ในแบบจำลองนี้ไม่เปิดให้แก้</p></div>`;
  }
  return bar('HOME');
}
function slStorage(full){
  const S=SL.set;
  let h=`<div class="slrow"><span>Storage mode</span><span class="slradio">${SL_MODES.map(([k,t])=>`<label><input class="hn" type="radio" name="slmode" data-sls="mode" value="${k}" ${S.mode===k?'checked':''}> ${t}</label>`).join('')}</span></div>`;
  if(S.mode!=='off'){h+=slRow('Allow export',slChk('allowExp',S.allowExp,''))+slRow('Max export power',slNum('maxExp',S.maxExp,0,6600,100,'W'))+slRow('Export calibration',slNum('expCal',S.expCal,-500,500,10,'W'))+slRow('Battery reserve',slNum('reserve',S.reserve,5,95,1,'%'))+slRow('Allow grid charging',slChk('gridChg',S.gridChg,''))+slRow('Grid peak shaving',slChk('peak',S.peak,'')+' '+slNum('peakW',S.peakW,0,20000,100,'W'))}
  else h+=slRow('Unbalance output',slChk('unbal',S.unbal,''));
  if(full&&S.mode!=='off'){const T=S.tou;h+=`<div class="hmisub">Time of use</div>`+slRow('Charge',slChk('tou.c.on',T.c.on,'')+slNum('tou.c.s',T.c.s,0,23,1,'h')+slNum('tou.c.e',T.c.e,0,24,1,'h')+slNum('tou.c.a',T.c.a,0,135,1,'A')+slNum('tou.c.soc',T.c.soc,10,100,1,'%'))+slRow('Discharge',slChk('tou.d.on',T.d.on,'')+slNum('tou.d.s',T.d.s,0,23,1,'h')+slNum('tou.d.e',T.d.e,0,24,1,'h')+slNum('tou.d.a',T.d.a,0,135,1,'A')+slNum('tou.d.soc',T.d.soc,5,100,1,'%'))}
  return h;
}
/* ---- หน้า Devices Status: วางตำแหน่งและไอคอนตามภาพหน้าจอในคู่มือข้อ 5.4.3 (แผง → อินเวอร์เตอร์ → บ้าน → มิเตอร์ → เสาไฟ, หลอดไฟ = Backup, เครื่องปั่นไฟ = GEN, แบตแบบแท่ง) ---- */
function slDT(){const t=new Date();return SL.set.time?`${t.getFullYear()}/${String(t.getMonth()+1).padStart(2,'0')}/${String(t.getDate()).padStart(2,'0')} ${slHM(SL.dash.t)}:00`:'2000/01/01 00:00:00'}
const slKW=w=>(Math.abs(w)/1000).toFixed(2).padStart(5,'0')+'kW';
/* ลูกศรแบบหน้าจอจริง: กล่องเล็ก 4 ช่องต่อด้วยหัวลูกศรสีส้ม (แนวนอนหรือแนวตั้งเท่านั้น) */
function slArrow(x1,y1,x2,y2,p,id){
  const on=Math.abs(p)>20,f=p<0;if(f){[x1,x2]=[x2,x1];[y1,y2]=[y2,y1]}
  const hz=y1===y2,L=hz?Math.abs(x2-x1):Math.abs(y2-y1),s=hz?Math.sign(x2-x1):Math.sign(y2-y1);
  const at=d=>hz?[x1+s*d,y1]:[x1,y1+s*d];let g='';
  for(let i=0;i<4;i++){const[cx,cy]=at(7+i*16),w=hz?13:8,h=hz?8:13;g+=`<rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" class="slseg ${on?'on':''}" style="animation-delay:${(s>0?i:3-i)*.18}s"/>`}
  if(on){const a=at(L*.58),b=at(L-14),c=at(L);
    g+=hz?`<rect x="${Math.min(a[0],b[0])}" y="${y1-5}" width="${Math.abs(b[0]-a[0])}" height="10" fill="url(#slag${s>0?'r':'l'})"/><path d="M${b[0]} ${y1-10} L${c[0]} ${y1} L${b[0]} ${y1+10}Z" fill="#ef8a3c"/>`
         :`<rect x="${x1-5}" y="${Math.min(a[1],b[1])}" width="10" height="${Math.abs(b[1]-a[1])}" fill="url(#slag${s>0?'d':'u'})"/><path d="M${x1-10} ${b[1]} L${x1} ${c[1]} L${x1+10} ${b[1]}Z" fill="#ef8a3c"/>`}
  return `<g class="slarr${on?'':' off'}">${g}</g>`;
}
function slIcPV(x,y){let g='';[[0,0],[58,-14]].forEach(([dx,dy])=>{const A=[x+dx-58,y+dy+34],B=[x+dx-26,y+dy-12],C=[x+dx+26,y+dy+2],D=[x+dx-6,y+dy+48];
  g+=`<line x1="${A[0]+8}" y1="${A[1]}" x2="${A[0]+8}" y2="${A[1]+16}" class="sli-leg"/><line x1="${D[0]-6}" y1="${D[1]}" x2="${D[0]-6}" y2="${D[1]+12}" class="sli-leg"/><polygon points="${[A,B,C,D].map(p=>p.join(',')).join(' ')}" class="sli-pv"/>`;
  const lerp=(P,Q,t)=>[P[0]+(Q[0]-P[0])*t,P[1]+(Q[1]-P[1])*t];
  for(let i=1;i<4;i++){const p=lerp(A,B,i/4),q=lerp(D,C,i/4);g+=`<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" class="sli-pvl"/>`}
  for(let i=1;i<5;i++){const p=lerp(A,D,i/5),q=lerp(B,C,i/5);g+=`<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" class="sli-pvl"/>`}});return g}
function slIcInv(x,y,w,h,st){return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" fill="url(#slinvg)" stroke="#b7bcc3" stroke-width="2"/><circle cx="${x+w/2-24}" cy="${y+48}" r="6" fill="#ef8a3c"/><text x="${x+w/2-14}" y="${y+53}" font-size="15" font-weight="700" fill="#e0701b" font-family="Arial,sans-serif">solis</text>
  <rect x="${x+w/2-34}" y="${y+h-92}" width="68" height="48" rx="6" fill="#59606b"/><rect x="${x+w/2-27}" y="${y+h-85}" width="54" height="34" rx="3" fill="#e3e8ef"/><text x="${x+w/2}" y="${y+h-64}" text-anchor="middle" font-size="8.5" fill="#3c4f9f" font-family="Arial,sans-serif">${esc(st)}</text>${[-18,-6,6,18].map(d=>`<circle cx="${x+w/2+d}" cy="${y+h-88.5}" r="1.6" fill="#c9ced6"/><circle cx="${x+w/2+d}" cy="${y+h-47.5}" r="1.6" fill="#c9ced6"/>`).join('')}`}
function slIcHouse(x,y){return `<rect x="${x-4}" y="${y-30}" width="58" height="46" fill="#c7cacf" stroke="#6a6f76"/><rect x="${x+32}" y="${y-66}" width="9" height="20" fill="#7a5134"/><polygon points="${x-14},${y-28} ${x+25},${y-62} ${x+64},${y-28}" fill="#7a5134"/>
  <rect x="${x-38}" y="${y-8}" width="46" height="34" fill="#e4e6e9" stroke="#6a6f76"/><polygon points="${x-46},${y-6} ${x-15},${y-34} ${x+16},${y-6}" fill="#8d6040"/><rect x="${x-22}" y="${y+6}" width="12" height="20" fill="#8b9097"/>`}
function slIcBulb(x,y){return `${[[-30,-14,-22,-10],[30,-14,22,-10],[-20,-34,-15,-28],[20,-34,15,-28],[0,-44,0,-36]].map(([a,b,c,d])=>`<line x1="${x+a}" y1="${y+b}" x2="${x+c}" y2="${y+d}" stroke="#ef8a3c" stroke-width="3" stroke-linecap="round"/>`).join('')}<circle cx="${x}" cy="${y-12}" r="15" fill="#f6c443" stroke="#c99a1a" stroke-width="1.5"/><path d="M${x-7} ${y+2} L${x+7} ${y+2} L${x+6} ${y+10} L${x-6} ${y+10}Z" fill="#f6c443"/><rect x="${x-8}" y="${y+10}" width="16" height="10" rx="2" fill="#6b7079"/><line x1="${x-8}" y1="${y+15}" x2="${x+8}" y2="${y+15}" stroke="#c7cbd1"/>`}
function slIcGen(x,y){return `<rect x="${x-36}" y="${y-22}" width="72" height="44" rx="4" fill="#e8eaed" stroke="#6a6f76" stroke-width="1.5"/><rect x="${x-34}" y="${y+22}" width="10" height="5" fill="#6a6f76"/><rect x="${x+24}" y="${y+22}" width="10" height="5" fill="#6a6f76"/>${[-8,-2,4].map(d=>`<line x1="${x-24}" y1="${y+d}" x2="${x-6}" y2="${y+d}" stroke="#6a6f76" stroke-width="2"/>`).join('')}<path d="M${x+12} ${y-14} L${x+4} ${y+2} L${x+11} ${y+2} L${x+7} ${y+15} L${x+19} ${y-3} L${x+12} ${y-3} L${x+16} ${y-14}Z" fill="#ef8a3c"/>`}
function slIcMeter(x,y){return `<rect x="${x-10}" y="${y-30}" width="20" height="6" fill="#6a6f76"/><rect x="${x-10}" y="${y+24}" width="20" height="6" fill="#6a6f76"/><rect x="${x-26}" y="${y-25}" width="52" height="50" rx="9" fill="#f2f3f5" stroke="#6a6f76" stroke-width="2"/><rect x="${x-16}" y="${y-15}" width="32" height="26" rx="3" fill="#59606b"/><rect x="${x-12}" y="${y-11}" width="24" height="18" rx="2" fill="#f08a2c"/>`}
function slIcTower(x,y,h){const t=y-h,arm=(yy,w)=>`<line x1="${x-w}" y1="${yy}" x2="${x+w}" y2="${yy}"/><line x1="${x-w}" y1="${yy}" x2="${x-w}" y2="${yy+5}"/><line x1="${x+w}" y1="${yy}" x2="${x+w}" y2="${yy+5}"/>`;
  let g=`<line x1="${x-h*.2}" y1="${y}" x2="${x-2}" y2="${t}"/><line x1="${x+h*.2}" y1="${y}" x2="${x+2}" y2="${t}"/>`+arm(t+8,h*.3)+arm(t+20,h*.22);
  for(let i=0;i<5;i++){const a=t+24+i*(h-24)/5,b=a+(h-24)/5,wa=2+(a-t)/h*h*.18,wb=2+(b-t)/h*h*.18;g+=`<line x1="${x-wa}" y1="${a}" x2="${x+wb}" y2="${b}"/><line x1="${x+wa}" y1="${a}" x2="${x-wb}" y2="${b}"/>`}
  return `<g stroke="#2c3036" stroke-width="1.6" fill="none">${g}</g>`}
function slIcBat(x,y,soc,on){const n=on?Math.max(0,Math.min(5,Math.ceil(soc/20))):0;let g=`<rect x="${x-9}" y="${y-58}" width="18" height="7" rx="2" fill="#4b5158"/><rect x="${x-22}" y="${y-52}" width="44" height="100" rx="8" fill="#f4f5f6" stroke="#4b5158" stroke-width="3"/>`;
  for(let i=0;i<5;i++){const yy=y+30-i*17;g+=`<rect x="${x-14}" y="${yy}" width="28" height="12" rx="2" fill="${i<n?'#4b5158':'none'}" stroke="#4b5158" stroke-width="1.6"/>`}return g}
function slFlow(small){
  const r=slNow(),P=r.P,S=SL.set,W=980,H=470;
  const stTxt={off:'Off',init:'Initializing',stop:'Fault',grid:'Normal',island:'Off-grid',lowbat:'Low SOC'}[r.st]||r.st;
  const hasGrid=P.sc.grid,hasGen=P.a.gen!=='none',hasBat=P.batIn,meterOk=P.ctS!==0,bmsOk=P.batOn&&P.canOk;
  const lab=(x,y,t,a)=>`<text x="${x}" y="${y}" text-anchor="${a||'middle'}" class="slft">${t}</text>`;
  let g=`<defs><linearGradient id="slinvg" x1="0" x2="1"><stop offset="0" stop-color="#f7f8f9"/><stop offset="1" stop-color="#dfe2e6"/></linearGradient>
    <linearGradient id="slagr" x1="0" x2="1"><stop offset="0" stop-color="#fbe3cf"/><stop offset="1" stop-color="#ef8a3c"/></linearGradient><linearGradient id="slagl" x1="1" x2="0"><stop offset="0" stop-color="#fbe3cf"/><stop offset="1" stop-color="#ef8a3c"/></linearGradient>
    <linearGradient id="slagd" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fbe3cf"/><stop offset="1" stop-color="#ef8a3c"/></linearGradient><linearGradient id="slagu" x1="0" x2="0" y1="1" y2="0"><stop offset="0" stop-color="#fbe3cf"/><stop offset="1" stop-color="#ef8a3c"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="#ffffff"/>`;
  /* สายสื่อสาร Meter / BMS */
  if(hasGrid)g+=`<path d="M410 128 V96 H880 V150" class="slcom"/><rect x="560" y="86" width="140" height="20" fill="#fff"/>`+lab(630,101,`Meter Comm. ${meterOk?'OK':'Fail'}`);
  if(hasBat)g+=`<path d="M110 290 V262 H330" class="slcom"/><rect x="150" y="252" width="128" height="20" fill="#fff"/>`+lab(214,267,`BMS Comm. ${bmsOk?'OK':'Fail'}`);
  /* ไอคอน */
  g+=`<g transform="translate(110 150)">${slIcPV(0,0)}</g>`+slIcInv(340,128,150,276,stTxt);
  g+=`<g opacity="${hasGrid?1:.3}">${slIcHouse(690,200)}${slIcMeter(880,180)}${slIcTower(860,440,78)}${slIcTower(902,430,62)}</g>`;
  g+=`<g opacity="${P.a.backup==='bpanel'?1:.3}">${slIcBulb(690,310)}</g><g opacity="${hasGen?1:.3}">${slIcGen(690,398)}</g><g opacity="${hasBat?1:.3}">${slIcBat(110,355,r.soc,hasBat)}</g>`;
  /* ลูกศรและค่า */
  g+=slArrow(195,185,322,185,r.pv)+lab(258,170,slKW(r.pv));
  g+=slArrow(498,195,630,195,hasGrid?r.lg:0)+lab(690,250,slKW(r.lg));
  g+=slArrow(748,195,846,195,hasGrid?-r.grid:0);
  g+=slArrow(498,305,640,305,r.lb)+lab(566,290,slKW(r.lb));
  g+=slArrow(640,400,498,400,hasGen?r.ac:0)+lab(566,385,slKW(r.ac));
  g+=slArrow(322,400,172,400,hasBat?r.bat:0)+lab(250,385,slKW(r.bat));
  g+=hasGrid?slArrow(880,320,880,222,r.grid)+lab(852,318,hasGrid&&P.gridAt?slKW(r.gridSeen):'NO-Grid','end'):'';
  g+=lab(110,432,hasBat?`${slF(P.vb,1)}V · ${slF(r.soc)}%`:'--');
  if(r.freq>50.05)g+=lab(690,442,`${slF(r.freq,2)} Hz (Freq-Watt)`);
  g+=lab(490,460,'MENU=&lt;ENTER&gt;  MONTHLY ENERGY=&lt;ESC&gt;');
  return `<svg viewBox="0 0 ${W} ${H}" class="slds" role="img" aria-label="Devices Status: แผง ${slKW(r.pv)}, โหลด Backup ${slKW(r.lb)}, แบต ${slKW(r.bat)}">${g}</svg>`;
}
function slPgDash(s){
  const D=SL.dash,T=slDay().T;
  return `<div class="card"><div class="bar"><div class="grp"><span class="lab">เวลา</span><b id="sldt">${slHM(D.t)}</b><input type="range" min="0" max="1435" step="5" value="${D.t}" data-sltime id="sltime-d" aria-label="เวลา"><button class="btn sm" data-slact="play">${slPlayT?'หยุด':'เล่น'}</button></div>
    <div class="grp">${slChk('dash.out',D.out,'ไฟดับ')}${slNum('dash.o0',D.o0,0,23,1,'–')}${slNum('dash.o1',D.o1,1,24,1,'น.')}</div>
    <div class="grp"><span class="lab">เมฆ</span>${slNum('dash.cloud',D.cloud,0,90,10,'%')}<span class="lab">โหลด Backup เพิ่ม</span>${slNum('dash.extra',D.extra,0,9000,500,'W')}<span class="lab">SOC ตอนเที่ยงคืน</span><b>${slF(slDay().soc00)}%</b></div></div>
    <div class="slflowbig"><div class="hmibar"><span>Devices Status</span><span id="sldsdt">${slDT()}</span></div><div id="slflow">${slFlow(false)}</div></div><div id="slalm"></div></div>
   <div class="cards"><div class="card"><h3>ทั้งวัน</h3><div class="tblwrap" id="slchart">${slChart()}</div>
    <table class="t"><tbody><tr><th>ผลิตจากแผง</th><td>${slF(T.pv,1)} kWh</td><th>โหลดรวม</th><td>${slF(T.load,1)} kWh</td></tr><tr><th>ซื้อไฟ</th><td>${slF(T.imp,1)} kWh</td><th>ขายไฟ</th><td>${slF(T.exp,1)} kWh</td></tr><tr><th>ชาร์จแบต</th><td>${slF(T.chg,1)} kWh</td><th>จ่ายแบต</th><td>${slF(T.dis,1)} kWh</td></tr><tr><th>ตัดกำลังแผง</th><td>${slF(T.cut,1)} kWh</td><th>โหลด Backup ขาดไฟ</th><td>${slF(T.unsB,1)} kWh</td></tr>${T.ac?`<tr><th>AC coupled</th><td>${slF(T.ac,1)} kWh</td><th></th><td></td></tr>`:''}</tbody></table></div>
   <div class="card"><h3>ผลทดสอบการทำงาน</h3>${slList(s.c.dash)}<p class="hint tight">ค่าบนหน้าจอเครื่องมาจาก CT/มิเตอร์ ถ้า CT ติดกลับ ค่ากริดบนจอจะกลับเครื่องหมายและเครื่องจะชาร์จ/จ่ายแบตผิดทาง (FAQ ข้อ Q4)</p></div></div>`;
}
function slChart(){
  const rows=slDay().rows,W=640,H=200,L=40,R=36,B=22,Tp=10,mx=Math.max(3000,...rows.map(r=>Math.max(r.pv,r.lb+r.lg,Math.abs(r.grid),Math.abs(r.bat)))),x=i=>L+(W-L-R)*i/287,y=v=>Tp+(H-Tp-B)*(1-(v+mx)/(2*mx)),ys=v=>Tp+(H-Tp-B)*(1-v/100);
  const path=(f,cls)=>`<path d="${rows.map((r,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+f(r).toFixed(1)).join(' ')}" class="slc ${cls}"/>`;
  let out=rows.map((r,i)=>r.out?`<rect x="${x(i)}" y="${Tp}" width="${(W-L-R)/287+.5}" height="${H-Tp-B}" class="slout"/>`:'').join('');
  out+=[-mx,0,mx].map(v=>`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" class="slgrid"/><text x="${L-4}" y="${y(v)+4}" class="svgt m mut" text-anchor="end" font-size="10">${slF(v/1000,0)}k</text>`).join('');
  [0,6,12,18,24].forEach(h=>out+=`<text x="${x(Math.min(287,h*12))}" y="${H-6}" class="svgt m mut" text-anchor="middle" font-size="10">${h}:00</text>`);
  [0,50,100].forEach(v=>out+=`<text x="${W-R+4}" y="${ys(v)+4}" class="svgt m mut" font-size="10">${v}%</text>`);
  out+=path(r=>y(r.pv),'pv')+path(r=>y(r.lb+r.lg),'ld')+path(r=>y(r.grid),'gd')+path(r=>y(r.bat),'bt')+path(r=>ys(r.soc),'sc');
  out+=`<line x1="${x(SL.dash.t/5)}" x2="${x(SL.dash.t/5)}" y1="${Tp}" y2="${H-B}" class="slnow" id="slnowln"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="กราฟทั้งวัน">${out}</svg><div class="slleg"><span class="pv">แผง</span><span class="ld">โหลด</span><span class="gd">กริด (+ซื้อ / −ขาย)</span><span class="bt">แบต (+ชาร์จ / −จ่าย)</span><span class="sc">SOC</span><span class="ot">ช่วงไฟดับ</span></div>`;
}
function slPgFault(){
  const sc=slSc(),cand=Object.keys(SL_FAULTS).filter(k=>slApplies(k,sc)),T=slTeacher(),active=SL.faults.length>0;
  const res=SL._fres;
  return `<div class="cards"><div class="card"><h3>โจทย์หาข้อผิดพลาด</h3><p class="sltxt">ระบบจะตั้งพอร์ตตามใบสั่งงานให้ถูกต้อง แล้วซ่อนความผิดพลาดหน้างาน 2 จุด ให้ไล่ตรวจตามขั้นตอนจริง: ตรวจวัดก่อนเปิด (หน้า 2) ดู alarm และค่าบนหน้าจอ (หน้า 3–4) แล้วเลือกสิ่งที่พบ</p>
    <div class="actions"><button class="btn pri" data-slact="drill">${active?'สุ่มโจทย์ใหม่':'เริ่มโจทย์ (สุ่ม 2 จุด)'}</button>${active?'<button class="btn" data-slact="drillend">เลิกโจทย์</button>':''}</div>
    ${active?`<div class="slpre">${cand.map(k=>`<label><input type="checkbox" data-slpick="${k}" id="slpick-${k}" ${SL.pick.includes(k)?'checked':''}> ${esc(SL_FAULTS[k].n)}</label>`).join('')}</div><div class="actions"><button class="btn pri" data-slact="answer">ตรวจคำตอบ</button>${SL.tries>=3||T?'<button class="btn" data-slact="reveal">เฉลย</button>':''}</div>`:''}
    ${res?`<p class="simmsg ${res.ok?'ok':'err'}">${esc(res.msg)}</p>`:''}${SL.reveal&&active?`<p class="sltxt">เฉลย: ${SL.faults.map(k=>esc(SL_FAULTS[k].n)).join(' · ')}</p>`:''}
    <p class="hint tight">ทำผ่านแล้ว ${SL.diagOk} โจทย์</p></div>
   ${T?`<div class="card slteach"><h3>ผู้สอน: กำหนดโจทย์เอง</h3><p class="hint tight">ผู้เรียนไม่เห็นส่วนนี้ เลือกข้อผิดพลาดที่ต้องการแล้วกด "ใช้โจทย์นี้" ${active?`· โจทย์ตอนนี้: ${SL.faults.map(k=>esc(SL_FAULTS[k].n)).join(', ')}`:''}</p>
    <div class="slpre">${cand.map(k=>`<label><input type="checkbox" data-slteach="${k}" id="slteach-${k}"> ${esc(SL_FAULTS[k].n)}</label>`).join('')}</div><div class="actions"><button class="btn" data-slact="teachset">ใช้โจทย์นี้</button></div></div>`:''}</div>`;
}
function slLive(){
  const P=slPhys(SL.dash.t/60),al=slAlarms(P),r=slDay()&&slNow();
  const opOn=P.powered&&SL.hmi.qdone&&!al.some(a=>a.sev==='stop'),opFl=P.powered&&!SL.hmi.qdone;
  const aOn=al.some(a=>a.sev==='stop'),aFl=!aOn&&al.length>0;
  const led=(c,t,on,fl)=>`<span class="slled ${c} ${on?'on':''} ${fl?'fl':''}"><i></i>${t}</span>`;
  document.querySelectorAll('#slleds').forEach(e=>e.innerHTML=led('pw','POWER',P.powered)+led('op','OPERATION',opOn,opFl)+led('al','ALARM',aOn,aFl));
  const scr=document.getElementById('slscr');if(scr){scr.innerHTML=slScreen();const it=[...scr.querySelectorAll('.hn')];SL.hmi.nav=Math.min(SL.hmi.nav,Math.max(0,it.length-1));if(it[SL.hmi.nav])it[SL.hmi.nav].classList.add('hf')}
  const f=document.getElementById('slflow');if(f)f.innerHTML=slFlow(false);const fd=document.getElementById('sldsdt');if(fd)fd.textContent=slDT();
  const a=document.getElementById('slalm');if(a){const cur=r?r.al:[];a.innerHTML=cur.length?`<ul class="msgs">${cur.map(x=>`<li class="${x.sev==='stop'?'err':'warn'}"><b>${esc(x.c)}</b> ${esc(x.d)}</li>`).join('')}</ul>`:''}
  const n=document.getElementById('slnowln');if(n){const W=640,L=40,R=36,x=L+(W-L-R)*(SL.dash.t/5)/287;n.setAttribute('x1',x);n.setAttribute('x2',x)}
  ['sldt','sltimep'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=slHM(SL.dash.t)});
}
function slSetPath(path,val){const ks=path.split('.');let o=ks[0]==='dash'?SL:SL.set;if(ks[0]==='dash'){o=SL.dash;ks.shift()}for(let i=0;i<ks.length-1;i++)o=o[ks[i]];o[ks[ks.length-1]]=val}
function slGetPath(path){const ks=path.split('.');let o=ks[0]==='dash'?SL.dash:SL.set;if(ks[0]==='dash')ks.shift();ks.forEach(k=>o=o==null?o:o[k]);return o}
function slHmiKey(k){
  const P=slPhys(SL.dash.t/60);if(!P.powered)return;
  const it=[...document.querySelectorAll('#slscr .hn')],H=SL.hmi;
  if(k==='up'||k==='down'){if(!it.length)return;H.nav=(H.nav+(k==='down'?1:-1)+it.length)%it.length;slLive();return}
  if(k==='enter'){if(H.qdone&&H.scr==='home'){slGo('menu');return}const el=it[H.nav];if(!el)return;if(el.matches('input[type=checkbox],input[type=radio],button'))el.click();else el.focus();return}
  if(k==='esc'){if(!H.qdone)return;if(H.scr==='home'){slGo('energy');return}H.scr=H.stack.pop()||'home';H.nav=0;slLive()}
}
function slGo(s){SL.hmi.stack.push(SL.hmi.scr);SL.hmi.scr=s;SL.hmi.nav=0;slLive()}
function slSw(k){
  const sc=slSc();if((k==='bat'&&!sc.bat)||(k==='grid'&&!sc.grid)||(k==='backup'&&!sc.backup))return;
  SL.sw[k]=!SL.sw[k];SL.log.push({k:'sw',n:k,v:SL.sw[k]});
  const P=slPhys(SL.dash.t/60);
  if(k==='dc'&&SL.sw.dc&&P.pvOver)SL.mlast={n:'',txt:'!!',unit:'',note:'เปิด DC switch ทั้งที่สตริง PV1 เกิน 500 V: เครื่องขึ้น OV-DC01 และเสี่ยงเสียหาย'};
}
function slResetPwr(){SL.sw={bat:false,dc:false,grid:false,backup:false};SL.log=[];SL.pre=[];SL.mlast=null}
function slDrill(list){
  const sc=slSc(),cand=Object.keys(SL_FAULTS).filter(k=>slApplies(k,sc));
  let f=list&&list.length?list.filter(k=>cand.includes(k)):[];
  if(!f.length){const pool=cand.slice();while(f.length<2&&pool.length)f.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0])}
  SL.faults=f;SL.pick=[];SL.tries=0;SL.reveal=false;SL._fres=null;SL.ports=slWant(sc);slResetPwr();
}
function slAnswer(){
  const a=new Set(SL.pick),f=new Set(SL.faults),hit=[...f].filter(k=>a.has(k)).length,wrong=[...a].filter(k=>!f.has(k)).length;SL.tries++;
  if(hit===f.size&&!wrong){SL.diagOk++;SL._fres={ok:true,msg:`ถูกต้องครบ ${f.size} จุด แก้ไขหน้างานแล้ว ลองเปิดเครื่องตามขั้นตอนอีกครั้ง`};SL.faults=[];SL.pick=[];SL.reveal=false}
  else SL._fres={ok:false,msg:`ถูก ${hit} จาก ${f.size} จุด${wrong?` · เลือกผิด ${wrong} ข้อ`:''} ลองตรวจวัดเพิ่ม (ครั้งที่ ${SL.tries})`};
}
function slEvents(){
  const host=document.getElementById('slhost');if(!host||host.dataset.on)return;host.dataset.on='1';
  host.addEventListener('click',e=>{
    const t=e.target.closest('[data-slsc],[data-slpg],[data-slsw],[data-slact],[data-slkey],[data-slgo],[data-slq],[data-slpt]');if(!t)return;
    const d=t.dataset;
    if(d.slsc){if(SL.sc!==d.slsc){SL.sc=d.slsc;SL.faults=[];SL._fres=null;slResetPwr()}slChanged();return}
    if(d.slpg){SL.page=d.slpg;slStop();slRender();if(typeof touch==='function')touch();return}
    if(d.slsw){slSw(d.slsw);slChanged();return}
    if(d.slkey){slHmiKey(d.slkey);return}
    if(d.slgo){slGo(d.slgo);return}
    if(d.slpt){SL.hmi.pt=d.slpt;slLive();return}
    if(d.slq){const q=SL.hmi.q+(+d.slq);if(q>4){SL.hmi.qdone=true;SL.hmi.scr='home';SL.hmi.stack=[];SL.log.push({k:'qdone'});slChanged();return}SL.hmi.q=Math.max(0,q);SL.hmi.nav=0;slLive();return}
    const a=d.slact;
    if(a==='meas'){slMeasure(document.getElementById('slmpt').value);slChanged()}
    else if(a==='resetpwr'){slResetPwr();slChanged()}
    else if(a==='settime'){SL.set.time=true;slChanged(false)}
    else if(a==='factory'){SL.set=SL_DEFSET();SL.hmi={qdone:false,q:0,scr:'quick',stack:[],nav:0,pt:'pv',pro:false};SL.log=SL.log.filter(x=>x.k!=='qdone');slChanged()}
    else if(a==='play'){if(slPlayT)slStop();else{slPlayT=setInterval(()=>{SL.dash.t=(SL.dash.t+10)%1440;const r=document.getElementById('sltime-d');if(r)r.value=SL.dash.t;slLive()},140)}const b=t;b.textContent=slPlayT?'หยุด':'เล่น'}
    else if(a==='drill'){slDrill();slChanged()}
    else if(a==='drillend'){SL.faults=[];SL._fres=null;slChanged()}
    else if(a==='answer'){slAnswer();slChanged()}
    else if(a==='reveal'){SL.reveal=true;slRender()}
    else if(a==='teachset'){const l=[...host.querySelectorAll('[data-slteach]:checked')].map(x=>x.dataset.slteach);slDrill(l);slChanged()}
  });
  host.addEventListener('change',e=>{
    const t=e.target,d=t.dataset;
    if(d.slp){SL.ports[d.slp]=t.value;slChanged();return}
    if(d.slpre!=null){const i=+d.slpre;SL.pre=SL.pre.filter(x=>x!==i);if(t.checked)SL.pre.push(i);slChanged();return}
    if(d.slpick){SL.pick=SL.pick.filter(x=>x!==d.slpick);if(t.checked)SL.pick.push(d.slpick);return}
    if(d.sls){let v;if(t.type==='checkbox')v=t.checked;else if(t.type==='number'){v=+t.value;if(!isFinite(v))v=+(slGetPath(d.sls)||0);if(t.min!=='')v=Math.max(+t.min,v);if(t.max!=='')v=Math.min(+t.max,v)}else v=t.value;
      slSetPath(d.sls,v);if(d.sls==='dash.o1'&&SL.dash.o1<=SL.dash.o0)SL.dash.o1=Math.min(24,SL.dash.o0+1);
      const keep=document.activeElement&&document.activeElement.id;slChanged(SL.page==='hmi'?false:true);if(SL.page==='hmi'){const s=slScore();const c=document.querySelector('#slpage .card:last-child');if(c)c.innerHTML='<h3>ตรวจการตั้งค่า</h3>'+slList(s.c.hmi);const v2=document.querySelector('.verdict');if(v2){v2.className='verdict '+(s.ok?'ok':s.n/s.all>.6?'warn':'err');v2.children[1].textContent=s.ok?'ผ่านครบทุกข้อ':'ผ่าน '+s.n+' / '+s.all+' ข้อ'}}
      if(keep){const el=document.getElementById(keep);if(el&&el!==document.activeElement)try{el.focus()}catch(_){}}}
  });
  host.addEventListener('input',e=>{if(e.target.dataset.sltime==null)return;SL.dash.t=+e.target.value;slLive();clearTimeout(host._tt);host._tt=setTimeout(()=>{if(SL.page==='power')slRender();if(typeof touch==='function')touch()},400)});
  host.addEventListener('keydown',e=>{if(SL.page!=='hmi'||e.target.closest('input,select'))return;const m={ArrowUp:'up',ArrowDown:'down',Enter:'enter',Escape:'esc'}[e.key];if(m&&e.target.closest('.sldev')){e.preventDefault();slHmiKey(m)}});
}
function slStop(){if(slPlayT){clearInterval(slPlayT);slPlayT=0}}
function slRenderTab(){slEvents();slRender()}
function slSnapshot(){const o=JSON.parse(JSON.stringify(SL));delete o._day;delete o._fres;return o}
function slRestore(o){
  if(!o||typeof o!=='object')return;
  if(SL_SC[o.sc])SL.sc=o.sc;if(['job','power','hmi','dash','fault'].includes(o.page))SL.page=o.page;
  if(o.ports)SL_PORTS.forEach(([k,,opts])=>{if(opts.some(x=>x[0]===o.ports[k]))SL.ports[k]=o.ports[k]});
  if(o.sw)['bat','dc','grid','backup'].forEach(k=>SL.sw[k]=!!o.sw[k]);
  if(Array.isArray(o.pre))SL.pre=o.pre.filter(i=>Number.isInteger(i)&&i>=0&&i<SL_PRE.length);
  if(Array.isArray(o.log))SL.log=o.log.filter(e=>e&&typeof e.k==='string').slice(-400);
  if(o.hmi&&typeof o.hmi==='object'){SL.hmi.qdone=!!o.hmi.qdone;SL.hmi.q=Math.max(0,Math.min(4,o.hmi.q|0));SL.hmi.scr=SL.hmi.qdone?'home':'quick'}
  if(o.set&&typeof o.set==='object'){const d=SL_DEFSET();Object.keys(d).forEach(k=>{if(k==='tou'){if(o.set.tou)['c','d'].forEach(w=>{if(o.set.tou[w])Object.keys(d.tou[w]).forEach(f=>{if(typeof o.set.tou[w][f]===typeof d.tou[w][f])d.tou[w][f]=o.set.tou[w][f]})})}else if(typeof o.set[k]===typeof d[k])d[k]=o.set[k]});SL.set=d}
  if(o.dash&&typeof o.dash==='object')Object.keys(SL.dash).forEach(k=>{if(typeof o.dash[k]===typeof SL.dash[k])SL.dash[k]=o.dash[k]});
  if(Array.isArray(o.faults))SL.faults=o.faults.filter(k=>SL_FAULTS[k]);
  if(o.done&&typeof o.done==='object')Object.keys(SL_SC).forEach(k=>SL.done[k]=!!o.done[k]);
  SL.diagOk=Math.max(0,o.diagOk|0);SL.tries=Math.max(0,o.tries|0);SL._day=null;
}
/* ผลสรุปสำหรับใบงาน/ส่งงาน */
function slSummary(){const s=slScore();return{sc:SL.sc,pass:s.n,all:s.all,done:Object.keys(SL.done).filter(k=>SL.done[k]),diag:SL.diagOk}}
