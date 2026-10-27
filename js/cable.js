/* ---- menu 13: cables and breakers (AC circuit, DC PV string, DC battery, breaker picker, reference tables) ----
   Written for this simulator. Ampacities follow the IEC 60364-5-52 reference installation methods (copper, ambient 30 °C in air /
   20 °C in ground) and EN 50618 for PV cable (ambient 60 °C). Breaker and fuse rules follow common IEC 60364-4-43 / 60364-7-712 /
   IEC 62548 practice, simplified for teaching. Everything runs in the browser; values are a first design pass, not a final design. */

/* ---------- reference data ---------- */
const CB_SIZES=[1.5,2.5,4,6,10,16,25,35,50,70,95,120,150,185,240];
/* ampacity (A) by insulation, loaded conductors (2 = 1 phase / DC, 3 = 3 phase) and method, one value per CB_SIZES entry */
const CB_AMP={
  pvc:{
    2:{A1:[14.5,19.5,26,34,46,61,80,99,119,151,182,210,240,273,321],B1:[17.5,24,32,41,57,76,101,125,151,192,232,269,300,341,400],
       B2:[16.5,23,30,38,52,69,90,111,133,168,201,232,258,294,344],C:[19.5,27,36,46,63,85,112,138,168,213,258,299,344,392,461],
       E:[22,30,40,51,70,94,119,148,180,232,282,328,379,434,514],D:[22,29,37,46,60,78,99,119,140,173,204,231,261,292,336]},
    3:{A1:[13.5,18,24,31,42,56,73,89,108,136,164,188,216,245,286],B1:[15.5,21,28,36,50,68,89,110,134,171,207,239,262,296,346],
       B2:[15,20,27,34,46,62,80,99,118,149,179,206,225,258,297],C:[17.5,24,32,41,57,76,96,119,144,184,223,259,299,341,403],
       E:[18.5,25,34,43,60,80,101,126,153,196,238,276,319,364,430],D:[18,24,30,38,50,64,82,98,116,143,169,192,217,243,280]}
  },
  xlpe:{
    2:{A1:[19,26,35,45,61,81,106,131,158,200,241,278,318,362,424],B1:[23,31,42,54,75,100,133,164,198,253,306,354,393,449,528],
       B2:[22,30,40,51,69,91,119,146,175,221,265,305,334,384,459],C:[24,33,45,58,80,107,138,171,209,269,328,382,441,506,599],
       E:[26,36,49,63,86,115,149,185,225,289,352,410,473,542,641],D:[25,33,43,53,71,91,116,139,164,203,239,271,306,343,395]},
    3:{A1:[17,23,31,40,54,73,95,117,141,179,216,249,285,324,380],B1:[20,28,37,48,66,88,117,144,175,222,269,312,344,392,461],
       B2:[19.5,26,35,44,60,80,105,128,154,194,233,268,294,336,394],C:[22,30,40,52,71,96,119,147,179,229,278,322,371,424,500],
       E:[23,32,42,54,75,100,127,158,192,246,298,346,399,456,538],D:[21,28,36,44,58,75,96,115,135,167,197,223,251,281,324]}
  }
};
const CB_METH={
  A1:'A1 สายแกนเดียวร้อยท่อในผนังที่มีฉนวนกันความร้อน',
  B1:'B1 สายแกนเดียวร้อยท่อเดินบนผนัง / ฝ้า',
  B2:'B2 สายหลายแกนร้อยท่อเดินบนผนัง',
  C:'C เดินตีกิ๊ปบนผนัง / รางทึบ (ไม่ร้อยท่อ)',
  E:'E เดินในอากาศ / บนรางเคเบิลแบบมีรู (ห่างผนัง)',
  D:'D ร้อยท่อฝังดิน'
};
/* EN 50618 PV cable, conductor 120 °C, ambient 60 °C: single cable in free air / single cable on a surface / two cables touching on a surface */
const CB_PVS=[1.5,2.5,4,6,10,16,25,35];
const CB_PVAMP={air:[30,41,55,70,98,132,176,218],surface:[29,39,52,67,93,125,167,207],adj:[24,33,44,57,79,107,142,176]};
const CB_PVMETH={air:'เดินลอยในอากาศ (เส้นเดี่ยว)',surface:'วางบนผิวหลังคา / ราง (เส้นเดี่ยว)',adj:'สองเส้นชิดกัน หรือร้อยท่อ / รางร่วมกัน'};
/* temperature factors: air (reference 30 °C), ground (reference 20 °C), PV cable (reference 60 °C) */
const CB_KT={
  air:{pvc:{10:1.22,15:1.17,20:1.12,25:1.06,30:1,35:.94,40:.87,45:.79,50:.71,55:.61,60:.5},
       xlpe:{10:1.15,15:1.12,20:1.08,25:1.04,30:1,35:.96,40:.91,45:.87,50:.82,55:.76,60:.71,65:.65,70:.58,75:.5,80:.41}},
  ground:{pvc:{10:1.1,15:1.05,20:1,25:.95,30:.89,35:.84,40:.77,45:.71,50:.63},xlpe:{10:1.07,15:1.04,20:1,25:.96,30:.93,35:.89,40:.85,45:.8,50:.76}},
  pv:{60:1,70:.91,80:.82,90:.71,100:.58,110:.41}
};
/* grouping (bunched circuits in air, on a surface or enclosed) */
const CB_KG={1:1,2:.8,3:.7,4:.65,5:.6,6:.57,7:.54,8:.52,9:.5,12:.45,16:.41,20:.38};
const CB_TYPES={
  thw:{name:'THW (60227 IEC 01) แกนเดียว PVC 70°C',ins:'pvc',core:1,meth:['B1','A1','C','E'],od:[3.3,3.9,4.4,5,6.6,7.8,9.7,10.9,12.8,14.6,17.1,18.8,21,23.3,26.6]},
  nyy:{name:'NYY แกนเดียว PVC 70°C 0.6/1 kV',ins:'pvc',core:1,meth:['B1','A1','C','E','D'],od:[6,6.5,7.2,7.8,9,10,12,13,14.5,16.5,18.5,20,22,24.5,27.5]},
  cv:{name:'CV (XLPE) แกนเดียว 90°C 0.6/1 kV',ins:'xlpe',core:1,meth:['B1','A1','C','E','D'],od:[6,6.5,7.2,7.8,9,10,12,13,14.5,16.5,18.5,20,22,24.5,27.5]},
  vct:{name:'VCT / NYY หลายแกน PVC 70°C (รวมสายดินในเส้น)',ins:'pvc',core:'m',meth:['B2','C','E','D'],od:[6,6.5,7.2,7.8,9,10,12,13,14.5,16.5,18.5,20,22,24.5,27.5]},
  pv:{name:'PV1-F / H1Z2Z2-K สายโซลาร์ DC',ins:'pv',core:1,meth:['air','surface','adj'],od:[4.4,4.9,5.5,6.2,7.3,8.8,10.3,11.8]}
};
const CB_BRK_AC=[6,10,16,20,25,32,40,50,63,80,100,125,160,200,250,320,400,500,630];
const CB_BRK_DC=[6,10,13,16,20,25,32,40,50,63,80,100,125,160,200,250,320,400];
const CB_FUSE_PV=[2,3,4,5,6,8,10,12,15,16,20,25,30,32,40];
const CB_FUSE_BAT=[30,40,50,60,70,80,100,125,150,175,200,225,250,300,350,400,500];
const CB_ICU=[4.5,6,10,15,25,36,50];
/* conduit inside diameters (mm): EMT (steel, thin wall) and PVC conduit (approximate, check the maker's catalogue) */
const CB_CONDUIT={
  emt:{name:'ท่อเหล็กบาง EMT',s:[['1/2"',15.8],['3/4"',20.9],['1"',26.6],['1 1/4"',35.1],['1 1/2"',40.9],['2"',52.5],['2 1/2"',69.4],['3"',85.2],['4"',108.2]]},
  imc:{name:'ท่อเหล็กหนาปานกลาง IMC',s:[['1/2"',16.8],['3/4"',21.9],['1"',28.1],['1 1/4"',36.8],['1 1/2"',42.7],['2"',54.6],['2 1/2"',64.9],['3"',80.7],['4"',105.4]]},
  pvc:{name:'ท่อ PVC ร้อยสายไฟ',s:[['1/2"',15.3],['3/4"',20.4],['1"',26.1],['1 1/4"',34.5],['1 1/2"',40.4],['2"',52],['2 1/2"',62.1],['3"',77.3],['4"',101.5]]}
};
const CB_WIREWAY=[[50,50],[50,75],[75,75],[50,100],[100,100],[100,150],[150,150],[100,200],[150,200],[200,200],[200,300]];
const CB_RHO={pvc:0.0206,xlpe:0.022,pv:0.022};/* copper Ω·mm²/m at about the conductor operating temperature (70 / 90 °C) */
const CB_X=0.00008;/* Ω/m typical reactance of small LV cables */

/* ---------- helpers ---------- */
const cbN=(x,d=0)=>isFinite(x)?Number(x).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}):'–';
const cbStd=(list,need)=>list.find(v=>v>=need-1e-9);
function cbInterp(tbl,t){
  const ks=Object.keys(tbl).map(Number).sort((a,b)=>a-b);
  if(t<=ks[0])return tbl[ks[0]];
  if(t>=ks[ks.length-1])return t>ks[ks.length-1]?0:tbl[ks[ks.length-1]];
  for(let i=1;i<ks.length;i++)if(t<=ks[i]){const a=ks[i-1],b=ks[i];return tbl[a]+(tbl[b]-tbl[a])*(t-a)/(b-a)}
  return 1;
}
/* temperature factor for a cable type, method and ambient; PV cable never gets a bonus below its 60 °C reference */
function cbKt(type,meth,amb){
  const T=CB_TYPES[type];
  if(T.ins==='pv')return amb<=60?1:cbInterp(CB_KT.pv,amb);
  return cbInterp(meth==='D'?CB_KT.ground[T.ins]:CB_KT.air[T.ins],amb);
}
function cbKg(n){n=Math.max(1,n|0);const ks=Object.keys(CB_KG).map(Number);let k=ks[0];ks.forEach(x=>{if(x<=n)k=x});return CB_KG[k]}
function cbSizes(type){return CB_TYPES[type].ins==='pv'?CB_PVS:CB_SIZES}
function cbAmp(type,meth,loaded,size){
  const T=CB_TYPES[type],S=cbSizes(type),i=S.indexOf(size);if(i<0)return 0;
  if(T.ins==='pv')return(CB_PVAMP[meth]||CB_PVAMP.adj)[i];
  const tb=CB_AMP[T.ins][loaded>=3?3:2];return(tb[meth]||tb.B1)[i];
}
/* voltage drop for one run: k = 2 for single phase and DC, √3 for three phase (percent of the line voltage) */
function cbVd(o){
  const T=CB_TYPES[o.type],rho=CB_RHO[T.ins],R=rho/o.size/o.par,X=o.dc?0:CB_X/o.par;
  const pf=o.dc?1:Math.min(1,Math.max(0.1,o.pf||1)),sin=Math.sqrt(1-pf*pf);
  const k=o.ph3?Math.sqrt(3):2,dv=k*o.len*o.I*(R*pf+X*sin);
  return{dv,pct:dv/o.V*100};
}
/* try every size: current check (Iz' ≥ need) and voltage drop check */
function cbCands(o){
  const kt=cbKt(o.type,o.meth,o.amb),kg=cbKg(o.grp),min=o.min||0;
  return cbSizes(o.type).map(s=>{
    const iz=cbAmp(o.type,o.meth,o.loaded,s)*kt*kg*o.par,vd=cbVd({type:o.type,size:s,par:o.par,len:o.len,I:o.Ivd,V:o.V,pf:o.pf,ph3:o.ph3,dc:o.dc});
    return{s,iz,okI:iz>=o.need-1e-9,vd,okV:vd.pct<=o.vdMax+1e-9,okMin:s>=min-1e-9};
  }).map(c=>Object.assign(c,{ok:c.okI&&c.okV&&c.okMin}));
}
function cbChoose(o){const C=cbCands(o);return{C,pick:C.find(c=>c.ok)||null,kt:cbKt(o.type,o.meth,o.amb),kg:cbKg(o.grp)}}
/* protective conductor: IEC 60364-5-54 table 54.2 (same material as the phase conductor) */
function cbPE(s){const v=s<=16?s:s<=35?16:s/2;return cbStd(CB_SIZES,v)||v}
/* conduit fill: 53 % one cable, 31 % two, 40 % three or more · wireway 20 % */
function cbConduit(kind,ods){
  const n=ods.length,lim=n===1?.53:n===2?.31:.4,area=ods.reduce((a,d)=>a+Math.PI*d*d/4,0);
  const C=CB_CONDUIT[kind];if(!C)return null;
  const hit=C.s.find(([,id])=>Math.PI*id*id/4*lim>=area);
  const ww=CB_WIREWAY.find(([w,h])=>w*h*.2>=area);
  return{n,lim,area,size:hit?hit[0]:null,id:hit?hit[1]:0,fill:hit?area/(Math.PI*hit[1]*hit[1]/4):0,ww:ww?`${ww[0]}×${ww[1]} mm`:null,biggest:hit||(ods.some(d=>d>C.s[C.s.length-1][1]))};
}
function cbOd(type,size,core){const T=CB_TYPES[type],i=cbSizes(type).indexOf(size);const d=T.od[i]||0;if(T.core!=='m')return d;return d*(core<=2?1.6:core===3?1.75:core===4?1.95:2.15)}
const CB_CURVE={gen:'C',light:'B หรือ C',sock:'C',motor:'C (โหลดกระชากสูงใช้ D)',inv:'C (หรือตามคู่มืออินเวอร์เตอร์)',main:'C'};

/* ---------- calculations (pure, no DOM) ---------- */
/* AC circuit: current → breaker → cable (ampacity after factors and voltage drop) → N, PE → conduit */
function cbCalcAC(p,inv){
  const out={ck:[]},ck=(lvl,t)=>out.ck.push({lvl,t});
  let ph3=p.ph==='3',V=+p.v||(ph3?400:230),pf=Math.min(1,Math.max(.1,+p.pf||1)),IB;
  if(p.src==='inv'&&inv){
    ph3=String(inv.phase)==='3';V=ph3?400:230;pf=1;
    const Vc=ph3?380:220;/* low end of the grid voltage: the inverter pushes more current to keep its rated power */
    IB=+inv.iac>0?+inv.iac*(+inv.nUnits||1):(+inv.pac||0)/(ph3?Math.sqrt(3)*Vc:Vc);
    out.srcTxt=+inv.iac>0?`กระแส AC สูงสุดจากดาต้าชีต ${cbN(+inv.iac,1)} A`:`${cbN(inv.pac)} W ÷ ${ph3?'(√3 × 380 V)':'220 V'} = ${cbN(IB,1)} A (คิดที่แรงดันกริดต่ำ)`;
  }else{
    const val=Math.max(0,+p.val||0);
    if(p.unit==='A')IB=val;
    else{const S=p.unit==='kVA'?val*1000:val*1000/pf;IB=ph3?S/(Math.sqrt(3)*V):S/V}
    out.srcTxt=p.unit==='A'?`กระแสโหลด ${cbN(IB,1)} A`:`${cbN(val,2)} ${p.unit} ${p.unit==='kW'?`PF ${pf} `:''}${ph3?'3 เฟส':'1 เฟส'} ${V} V → ${cbN(IB,1)} A`;
  }
  const use=p.src==='inv'?'inv':p.use;
  const cont=p.src==='inv'||+p.cont===1;
  const need=IB*(cont?1.25:1);
  out.IB=IB;out.need=need;out.ph3=ph3;out.V=V;out.pf=pf;out.cont=cont;
  const In=cbStd(CB_BRK_AC,need);out.In=In;
  if(!In){ck('err',`กระแส ${cbN(need,1)} A เกินตารางเบรกเกอร์ในเครื่องคำนวณ (630 A) ต้องออกแบบเฉพาะ`);return out}
  out.kind=In<=63?'MCB (IEC 60898)':'MCCB (IEC 60947-2)';
  out.poles=ph3?(use==='inv'||use==='main'?'4P (3 เฟส + N) หรือ 3P ตามระบบ':'3P หรือ 4P'):(use==='inv'||use==='main'?'2P (ตัดทั้ง L และ N)':'1P หรือ 1P+N');
  out.curve=CB_CURVE[use]||'C';
  const ka=Math.max(1,+p.ka||6);out.icu=cbStd(CB_ICU,ka)||ka;
  out.rcd=use==='sock'?'RCBO / RCD 30 mA Type A (วงจรเต้ารับ)':use==='inv'?'ถ้าติด RCD ใช้ Type A หรือตามคู่มืออินเวอร์เตอร์ (บางรุ่นกำหนดค่ากระแสรั่ว 100–300 mA)':use==='main'?'กันไฟรั่วรวม ตามระบบสายดินของบ้าน (ปกติ 30 mA ที่วงจรย่อย)':'RCD 30 mA เมื่อเป็นวงจรที่คนสัมผัสได้หรือพื้นที่เปียก';
  const T=CB_TYPES[p.cab]||CB_TYPES.thw,meth=T.meth.includes(p.meth)?p.meth:T.meth[0];out.meth=meth;
  const par=Math.max(1,Math.min(8,+p.par|0||1));
  const sel=cbChoose({type:p.cab,meth,amb:+p.amb,grp:+p.grp,loaded:ph3?3:2,par,need:In,Ivd:IB,V,pf,ph3,len:Math.max(0,+p.len||0),vdMax:+p.vd||3,min:+p.min||0});
  Object.assign(out,sel,{par});
  if(!sel.pick){ck('err','ไม่มีขนาดสายในตารางที่ผ่านทั้งกระแสและแรงดันตก เพิ่มจำนวนสายขนานต่อเฟส ลดความยาว หรือเปลี่ยนวิธีติดตั้ง');return out}
  const s=sel.pick.s;out.size=s;out.N=s;out.PE=cbPE(s);
  const curOnly=sel.C.find(c=>c.okI&&c.okMin);
  if(curOnly&&curOnly.s<s)ck('warn',`ถ้าคิดเฉพาะกระแส ใช้ ${curOnly.s} mm² ได้ แต่แรงดันตก ${cbN(curOnly.vd.pct,2)}% เกิน ${p.vd}% จึงเลือก ${s} mm²`);
  ck('ok',`IB ${cbN(IB,1)} A ≤ In ${In} A ≤ Iz' ${cbN(sel.pick.iz,1)} A (สาย ${s} mm²${par>1?` × ${par} ขนาน`:''})`);
  ck(sel.pick.vd.pct<=+p.vd*0.8?'ok':'warn',`แรงดันตก ${cbN(sel.pick.vd.pct,2)}% (${cbN(sel.pick.vd.dv,1)} V) ที่ระยะ ${cbN(+p.len)} m ไม่เกิน ${p.vd}%`);
  if(sel.kt<1)ck('ok',`อุณหภูมิ ${p.amb}°C ลดพิกัดสายเหลือ ${cbN(sel.kt*100)}%`);
  if(sel.kg<1)ck('ok',`สาย ${p.grp} วงจรรวมกัน ลดพิกัดเหลือ ${cbN(sel.kg*100)}%`);
  if(par>1&&s<50)ck('warn','สายขนานต่อเฟสควรใช้กับขนาดตั้งแต่ 50 mm² ขึ้นไป ยาวเท่ากัน ชนิดเดียวกัน');
  if(use==='inv')ck('ok','เบรกเกอร์ขาออกอินเวอร์เตอร์: ใช้ตัวแยกของวงจรนี้ ห้ามต่อโหลดอื่นร่วม และติดป้ายแหล่งจ่ายไฟสองทาง');
  if(ka>10&&In<=63)ck('warn',`กระแสลัดวงจร ${ka} kA สูงกว่า MCB ทั่วไป (6–10 kA) เลือก Icu ≥ ${out.icu} kA`);
  /* conduit */
  if(p.cond&&p.cond!=='none'&&p.meth!=='C'&&p.meth!=='E'){
    let ods;
    if(T.core==='m')ods=Array(par).fill(cbOd(p.cab,s,ph3?5:3));
    else ods=[].concat(Array((ph3?4:2)*par).fill(cbOd(p.cab,s)),[cbOd(p.cab,out.PE)]);
    if(+p.od>0)ods=ods.map(()=>+p.od);
    out.cd=cbConduit(p.cond,ods);
  }
  return out;
}
/* DC PV string / array (IEC 62548 style, simplified) */
function cbCalcDC(p){
  const out={ck:[]},ck=(lvl,t)=>out.ck.push({lvl,t});
  const ns=Math.max(1,+p.ns|0),np=Math.max(1,+p.np|0),isc=Math.max(0,+p.isc||0),imp=Math.max(0,+p.imp||0),voc=Math.max(0,+p.voc||0),vmp=Math.max(0,+p.vmp||0);
  const kv=+p.kvoc||-0.28,tmin=isFinite(+p.tmin)?+p.tmin:10,imod=Math.max(0,+p.imod||0);
  const vocMax=ns*voc*(1+kv/100*(tmin-25));
  out.vocMax=vocMax;out.vmpS=ns*vmp;out.iscS=isc;out.iscA=isc*np;out.impA=imp*np;
  /* string fuses: needed when the reverse current from the other strings can exceed the module's series fuse rating */
  const rev=(np-1)*isc;out.rev=rev;
  out.fuseNeed=np>=3&&imod>0&&rev>imod;
  if(np>=3&&!imod)ck('warn','ใส่ค่า "พิกัดฟิวส์อนุกรมสูงสุดของแผง" จากดาต้าชีต เพื่อตรวจว่าต้องมีฟิวส์สตริงหรือไม่');
  if(out.fuseNeed){
    const lo=1.5*isc,hi=Math.min(2.4*isc,imod);
    const fz=CB_FUSE_PV.find(v=>v>=lo-1e-9&&v<=hi+1e-9);
    out.fuse=fz||null;
    if(fz)ck('ok',`ต่อขนาน ${np} สตริง กระแสย้อนจากสตริงอื่น ${cbN(rev,1)} A เกินพิกัดฟิวส์ของแผง ${imod} A ต้องมีฟิวส์ gPV ทั้งขั้ว + และ − ทุกสตริง ขนาด ${fz} A (ช่วง ${cbN(lo,1)}–${cbN(hi,1)} A)`);
    else ck('err',`หาขนาดฟิวส์ที่อยู่ในช่วง 1.5 × Isc = ${cbN(lo,1)} A ถึง ${cbN(hi,1)} A ไม่ได้ ตรวจค่าพิกัดฟิวส์ของแผง`);
  }else if(np>=2)ck('ok',`ขนาน ${np} สตริง กระแสย้อน ${cbN(rev,1)} A ${imod?`ไม่เกินพิกัดฟิวส์ของแผง ${imod} A`:''} ไม่ต้องมีฟิวส์สตริง`);
  /* string cable current: with a fuse, at least the fuse; without, 1.25 Isc times the strings that can feed a fault */
  const needS=out.fuse?Math.max(out.fuse,1.25*isc):1.25*isc*Math.max(1,np-1);out.needS=needS;
  const T=CB_TYPES[p.cab]||CB_TYPES.pv,meth=T.meth.includes(p.meth)?p.meth:T.meth[0];out.meth=meth;
  const sel=cbChoose({type:p.cab,meth,amb:+p.amb,grp:+p.grp,loaded:2,par:1,need:needS,Ivd:imp,V:Math.max(1,ns*vmp),dc:true,len:Math.max(0,+p.len||0),vdMax:+p.vd||1.5,min:+p.min||0});
  out.str=sel;
  if(sel.pick){
    ck('ok',`สายสตริง ${sel.pick.s} mm²: Iz' ${cbN(sel.pick.iz,1)} A ≥ ${cbN(needS,1)} A ${out.fuse?'(พิกัดฟิวส์สตริง)':`(1.25 × Isc${np>2?` × ${np-1} สตริง`:''})`}`);
    ck(sel.pick.vd.pct<=+p.vd*0.8?'ok':'warn',`แรงดันตกสายสตริง ${cbN(sel.pick.vd.pct,2)}% (${cbN(sel.pick.vd.dv,1)} V ที่ Imp ${cbN(imp,2)} A, ระยะ ${cbN(+p.len)} m)`);
  }else ck('err','ไม่มีขนาดสาย PV ในตาราง (ถึง 35 mm²) ที่ผ่าน ลดระยะ แยกเส้นทางเดินสาย หรือเปลี่ยนวิธีติดตั้ง');
  /* array cable after the combiner */
  if(np>1){
    const needA=1.25*isc*np;out.needA=needA;
    const selA=cbChoose({type:p.cab,meth,amb:+p.amb,grp:1,loaded:2,par:1,need:needA,Ivd:imp*np,V:Math.max(1,ns*vmp),dc:true,len:Math.max(0,+p.lenA||0),vdMax:+p.vd||1.5,min:+p.min||0});
    out.arr=selA;
    if(selA.pick)ck('ok',`สายรวมหลังคอมบายเนอร์ ${selA.pick.s} mm²: Iz' ${cbN(selA.pick.iz,1)} A ≥ 1.25 × ${np} × Isc = ${cbN(needA,1)} A · แรงดันตก ${cbN(selA.pick.vd.pct,2)}%`);
    else ck('err','สายรวมหลังคอมบายเนอร์เกินตารางสาย PV ใช้สาย DC แกนเดียว 0.6/1 kV (1.5 kV DC) ขนาดใหญ่ หรือแยก MPPT');
  }
  /* DC breaker / isolator for the array part */
  const needB=1.25*isc*np;out.needB=needB;out.InB=cbStd(CB_BRK_DC,needB);
  out.ue=vocMax;
  out.ueClass=vocMax<=500?'≥ 500 V DC (2P)':vocMax<=600?'≥ 600 V DC':vocMax<=800?'≥ 800 V DC':vocMax<=1000?'≥ 1000 V DC (มักเป็น 4P ต่ออนุกรมขั้ว)':vocMax<=1500?'≥ 1500 V DC':'เกิน 1500 V DC';
  out.spd=vocMax<=600?'600 V':vocMax<=1000?'1000 V':vocMax<=1200?'1200 V':'1500 V';
  ck(vocMax>1000?'warn':'ok',`Voc สูงสุดที่ ${tmin}°C = ${ns} × ${cbN(voc,2)} × (1 ${kv<0?'−':'+'} ${cbN(Math.abs(kv),2)}% × ${cbN(25-tmin)}) = ${cbN(vocMax,1)} V ใช้เป็นพิกัดแรงดันของเบรกเกอร์ ฟิวส์ สวิตช์ และ SPD ฝั่ง DC`);
  ck('ok',`เบรกเกอร์ / สวิตช์ตัดตอน DC: In ≥ 1.25 × Isc${np>1?` × ${np}`:''} = ${cbN(needB,1)} A → ${out.InB||'–'} A แรงดัน ${out.ueClass} ตัดทั้ง + และ −`);
  ck('ok','เบรกเกอร์ DC ส่วนใหญ่มีขั้ว (+ / −) ต่อตามเครื่องหมายบนตัวอุปกรณ์ ถ้าต่อกลับขั้วจะดับอาร์กไม่ได้ ห้ามใช้เบรกเกอร์ AC แทน');
  ck('ok',`SPD ฝั่ง DC Type 2 สำหรับ PV: Ucpv ≥ ${cbN(vocMax)} V (ชั้น ${out.spd}) ติดใกล้อินเวอร์เตอร์ / ตู้ DC`);
  if(imp*np>0&&isc>0&&imp/isc>0.98)ck('warn','Imp ใกล้เคียง Isc ตรวจค่าที่กรอก');
  return out;
}
/* battery DC circuit */
function cbCalcBat(p,ctx){
  const out={ck:[]},ck=(lvl,t)=>out.ck.push({lvl,t});
  const V=Math.max(1,+p.v||48),Vmin=Math.max(1,+p.vmin||V*0.9),eff=Math.min(100,Math.max(50,+p.eff||95))/100;
  let I;
  if(p.src==='kw'){I=Math.max(0,+p.kw||0)*1000/(Vmin*eff);out.srcTxt=`${cbN(+p.kw,2)} kW ÷ (${cbN(Vmin,1)} V × ${cbN(eff*100)}%) = ${cbN(I,1)} A`}
  else{I=Math.max(0,+p.amps||0);out.srcTxt=`กระแสสูงสุด ${cbN(I,1)} A${ctx&&ctx.txt?' · '+ctx.txt:''}`}
  out.I=I;
  const need=1.25*I;out.need=need;
  out.fuse=cbStd(CB_FUSE_BAT,need)||null;out.brk=cbStd(CB_BRK_DC,need)||null;
  const vmax=V*1.15;out.vmax=vmax;
  const ka=Math.max(.1,+p.ka||5);out.ka=ka;
  const In=Math.min(out.fuse||Infinity,out.brk||Infinity);
  if(!isFinite(In)){ck('err',`กระแส ${cbN(need)} A เกินตารางฟิวส์ / เบรกเกอร์แบตในเครื่องคำนวณ แยกเป็นหลายชุด`);return out}
  const T=CB_TYPES[p.cab]||CB_TYPES.cv,meth=T.meth.includes(p.meth)?p.meth:T.meth[0];out.meth=meth;
  const par=Math.max(1,Math.min(4,+p.par|0||1));
  /* cable must carry the larger of the fuse or breaker that will actually be installed */
  const prot=p.prot==='fuse'?out.fuse:out.brk;out.prot=prot;
  const sel=cbChoose({type:p.cab,meth,amb:+p.amb,grp:+p.grp,loaded:2,par,need:prot||need,Ivd:I,V:Vmin,dc:true,len:Math.max(0,+p.len||0),vdMax:+p.vd||1,min:+p.min||0});
  Object.assign(out,sel,{par});
  if(V<=60){
    out.pole='1P ที่ขั้ว + (หรือ 2P ตัดทั้ง + และ −) แรงดัน ≥ 125 V DC';
  }else if(V<=150){
    out.pole='2P แรงดัน ≥ 250 V DC';
  }else out.pole=`แบตแรงดันสูง ${cbN(V)} V: ใช้สวิตช์ / เบรกเกอร์ที่ติดมากับแบตหรือที่ผู้ผลิตกำหนด แรงดัน ≥ ${cbN(vmax)} V DC`;
  ck('ok',`กระแสสูงสุด ${cbN(I,1)} A × 1.25 = ${cbN(need,1)} A → ฟิวส์ ${out.fuse||'–'} A หรือเบรกเกอร์ DC ${out.brk||'–'} A`);
  ck(ka>10?'warn':'ok',`กระแสลัดวงจรของแบต ${cbN(ka,1)} kA: อุปกรณ์ป้องกันต้องมีพิกัดตัดกระแส DC ≥ ${cbN(ka,1)} kA ${ka>6?'(ใช้ฟิวส์ class T / NH หรือ DC MCCB เบรกเกอร์ MCB ทั่วไปตัดไม่ไหว)':''}`);
  ck('ok',`ติดอุปกรณ์ป้องกันใกล้ขั้วแบตที่สุด (ไม่เกินประมาณ 30 cm หรือตามคู่มือ) ก่อนสายจะเดินไปที่อื่น`);
  if(sel.pick){
    ck('ok',`สายแบต ${sel.pick.s} mm²${par>1?` × ${par} ขนาน`:''}: Iz' ${cbN(sel.pick.iz,1)} A ≥ ${prot||cbN(need,1)} A (${p.prot==='fuse'?'ฟิวส์':'เบรกเกอร์'})`);
    ck(sel.pick.vd.pct<=+p.vd*0.8?'ok':'warn',`แรงดันตก ${cbN(sel.pick.vd.pct,2)}% (${cbN(sel.pick.vd.dv,2)} V) ที่ ${cbN(I,1)} A ระยะ ${cbN(+p.len,1)} m · แบตแรงดันต่ำจะตกง่าย เดินสายสั้นที่สุด`);
    const c=sel.C.find(x=>x.okI&&x.okMin);if(c&&c.s<sel.pick.s)ck('warn',`ถ้าคิดเฉพาะกระแสใช้ ${c.s} mm² ได้ แต่แรงดันตกเกิน จึงเลือก ${sel.pick.s} mm²`);
  }else ck('err','ไม่มีขนาดสายที่ผ่าน เพิ่มสายขนาน ย้ายอินเวอร์เตอร์ใกล้แบต หรือใช้แบตแรงดันสูงขึ้น');
  ck('ok','สาย + และ − ยาวเท่ากัน มัดคู่กัน ใช้หางปลาย้ำด้วยเครื่องมือที่ถูกขนาด ขันแรงบิดตามคู่มือ');
  return out;
}
/* quick breaker picker (AC or DC) */
function cbCalcBrk(p){
  const out={ck:[]},ck=(lvl,t)=>out.ck.push({lvl,t});
  if(p.sys==='ac'){
    const ph3=p.ph==='3',V=+p.v||(ph3?400:230),pf=Math.min(1,Math.max(.1,+p.pf||1));
    const I=p.inp==='A'?Math.max(0,+p.a||0):Math.max(0,+p.kw||0)*1000/pf/(ph3?Math.sqrt(3)*V:V);
    const cont=p.use==='inv'||+p.cont===1,need=I*(cont?1.25:1);
    const In=cbStd(CB_BRK_AC,need),ka=Math.max(1,+p.ka||6);
    Object.assign(out,{I,need,In,cont,ph3,icu:cbStd(CB_ICU,ka)||ka,curve:CB_CURVE[p.use]||'C',kind:In&&In<=63?'MCB (IEC 60898)':'MCCB (IEC 60947-2)'});
    out.poles=ph3?(p.use==='inv'||p.use==='main'?'4P':'3P / 4P'):(p.use==='inv'||p.use==='main'?'2P':'1P / 1P+N');
    out.rcd=p.use==='sock'?'RCBO 30 mA Type A':p.use==='inv'?'Type A ตามคู่มืออินเวอร์เตอร์':'RCD 30 mA เมื่อจำเป็น';
    /* a quick cable hint: THW in conduit on a wall (B1) at 35 °C, one circuit */
    const q=cbChoose({type:'thw',meth:'B1',amb:35,grp:1,loaded:ph3?3:2,par:1,need:In||need,Ivd:I,V,pf,ph3,len:0,vdMax:100,min:2.5});
    out.cab=q.pick?q.pick.s:null;
    if(!In)ck('err','เกินตารางเบรกเกอร์ (630 A)');
    else{
      ck('ok',cont?`IB ${cbN(I,1)} A × 1.25 (โหลดต่อเนื่อง) = ${cbN(need,1)} A → เบรกเกอร์ ${In} A`:`IB ${cbN(I,1)} A → เบรกเกอร์ ${In} A (พิกัดมาตรฐานถัดขึ้นไป)`);
      if(out.cab)ck('ok',`สายขั้นต่ำโดยประมาณ: THW ${out.cab} mm² ร้อยท่อบนผนัง 35°C วงจรเดียว (ตรวจแรงดันตกในหน้า AC)`);
      if(p.use==='motor')ck('warn','มอเตอร์ / คอมเพรสเซอร์: ตรวจกระแสเริ่มเดิน ถ้าเบรกเกอร์ทริปตอนสตาร์ทใช้ curve D หรือขยับพิกัดขึ้นภายในพิกัดสาย');
      if(ka>10&&In<=63)ck('warn',`กระแสลัดวงจร ${ka} kA เลือก MCB ที่ Icu ≥ ${out.icu} kA`);
    }
  }else{
    const kind=p.dk;let I=0,V=0,txt='';
    if(kind==='pv'){const n=Math.max(1,+p.np|0);I=Math.max(0,+p.isc||0)*n;V=Math.max(0,+p.voc||0);txt=`Isc ${cbN(+p.isc,2)} A × ${n} สตริง`}
    else if(kind==='bat'){V=Math.max(1,+p.dv||48);I=p.dinp==='A'?Math.max(0,+p.da||0):Math.max(0,+p.dw||0)/(V*0.9*0.95);txt=p.dinp==='A'?`กระแสสูงสุด ${cbN(I,1)} A`:`${cbN(+p.dw)} W ÷ (${cbN(V*0.9,1)} V × 95%)`}
    else{V=Math.max(1,+p.dv||12);I=p.dinp==='A'?Math.max(0,+p.da||0):Math.max(0,+p.dw||0)/V;txt=p.dinp==='A'?`กระแสโหลด ${cbN(I,1)} A`:`${cbN(+p.dw)} W ÷ ${cbN(V)} V`}
    const need=1.25*I,In=cbStd(CB_BRK_DC,need);
    const ue=kind==='bat'?V*1.15:V;
    Object.assign(out,{I,need,In,V,ue,txt,kind});
    out.fz=kind==='pv'?null:cbStd(CB_FUSE_BAT,need);
    out.ueTxt=kind==='pv'?(ue<=500?'≥ 500 V DC':ue<=600?'≥ 600 V DC':ue<=800?'≥ 800 V DC':ue<=1000?'≥ 1000 V DC':'≥ 1500 V DC'):(ue<=60?'≥ 125 V DC':ue<=125?'≥ 250 V DC':`≥ ${cbN(Math.ceil(ue/50)*50)} V DC`);
    out.poles=kind==='pv'?(ue<=500?'2P':'2P / 4P (ตามแรงดันของรุ่น)'):ue<=60?'1P (ขั้ว +) หรือ 2P':'2P';
    if(!In)ck('err','เกินตารางเบรกเกอร์ DC (400 A) แยกเป็นหลายชุด');
    else{
      ck('ok',`${txt} = ${cbN(I,1)} A × 1.25 = ${cbN(need,1)} A → เบรกเกอร์ DC ${In} A แรงดัน ${out.ueTxt}`);
      if(kind==='pv'){
        const s=Math.max(1,+p.np|0);if(s>=3)ck('warn',`ขนาน ${s} สตริง ตรวจฟิวส์สตริงในหน้า DC สตริง`);
        ck('ok','สวิตช์ตัดตอน DC ฝั่ง PV ต้องตัดได้ขณะมีโหลด (DC-PV2 / DC-21B) ทั้ง + และ −');
      }
      if(kind==='bat')ck('warn',`แบตลิเธียมจ่ายกระแสลัดวงจรได้หลาย kA เลือกอุปกรณ์ที่พิกัดตัดกระแส DC พอ ทางเลือกคือฟิวส์ class T ${out.fz||''} A`);
      ck('ok','ใช้เบรกเกอร์ที่ระบุ DC บนตัวเท่านั้น และต่อขั้ว + / − ตามเครื่องหมาย');
    }
  }
  return out;
}

/* ---------- state ---------- */
const CB_DEF=()=>({page:'ac',
  ac:{src:'inv',ph:'1',v:230,unit:'kW',val:5,pf:0.9,use:'gen',cont:1,len:20,cab:'thw',meth:'B1',amb:35,grp:1,par:1,vd:2,min:2.5,cond:'pvc',od:0,ka:10},
  dc:{ns:10,np:1,isc:13.9,imp:13.2,voc:49.6,vmp:41.3,kvoc:-0.26,tmin:10,imod:25,len:25,lenA:10,cab:'pv',meth:'adj',amb:70,grp:2,vd:1.5,min:4,cond:'pvc'},
  bat:{v:51.2,vmin:46,src:'kw',kw:5,eff:95,amps:100,len:2,cab:'cv',meth:'C',amb:35,grp:1,par:1,vd:1,min:6,ka:5,prot:'brk'},
  brk:{sys:'ac',inp:'kW',a:20,kw:3,pf:0.9,ph:'1',v:230,use:'gen',cont:0,ka:10,dk:'pv',isc:13.9,np:1,voc:500,dv:48,dinp:'W',dw:1000,da:20}
});
let CB=CB_DEF();
function cbSnapshot(){return JSON.parse(JSON.stringify(CB))}
function cbRestore(o){
  if(!o||typeof o!=='object')return;
  const D=CB_DEF();
  ['ac','dc','bat','brk'].forEach(k=>{if(o[k]&&typeof o[k]==='object')Object.keys(D[k]).forEach(f=>{const v=o[k][f];if(v!==undefined&&(typeof v===typeof D[k][f]))D[k][f]=v})});
  if(['ac','dc','bat','brk','ref'].includes(o.page))D.page=o.page;
  CB=D;
}

/* ---------- UI ---------- */
const CB_PAGES=[['ac','AC: สาย + เบรกเกอร์'],['dc','DC: สตริงแผง'],['bat','DC: แบตเตอรี่'],['brk','เลือกเบรกเกอร์ AC / DC'],['ref','ตารางอ้างอิง']];
const cbO=a=>a.map(x=>Array.isArray(x)?x:[x,x]);
const CB_TEMPS=[25,30,35,40,45,50,55,60,65,70,80];
function cbMethOpts(type){const T=CB_TYPES[type];return T.meth.map(m=>[m,T.ins==='pv'?CB_PVMETH[m]:CB_METH[m]])}
/* field specs: [key, label, kind, options|null, show(state)] */
function cbFields(pg){
  const P=CB[pg];
  if(pg==='ac')return[
    ['src','วงจรของ','sel',[['inv','ขาออกอินเวอร์เตอร์ที่เลือก (เมนู 02)'],['load','โหลด / วงจรทั่วไป']]],
    ['ph','ระบบไฟ','sel',[['1','1 เฟส'],['3','3 เฟส']],()=>P.src!=='inv'],
    ['v','แรงดัน (V)','num',null,()=>P.src!=='inv'],
    ['unit','หน่วยโหลด','sel',[['kW','kW'],['kVA','kVA'],['A','A']],()=>P.src!=='inv'],
    ['val','ขนาดโหลด','num',null,()=>P.src!=='inv'],
    ['pf','Power factor','num',null,()=>P.src!=='inv'&&P.unit==='kW'],
    ['use','ชนิดวงจร','sel',[['gen','วงจรทั่วไป'],['light','แสงสว่าง'],['sock','เต้ารับ'],['motor','มอเตอร์ / ปั๊ม / แอร์'],['main','เมนเบรกเกอร์']],()=>P.src!=='inv'],
    ['cont','โหลดต่อเนื่อง ≥ 3 ชม.','sel',[[1,'ใช่ (In ≥ 1.25 × IB)'],[0,'ไม่ใช่']],()=>P.src!=='inv'],
    ['len','ความยาวสาย ทางเดียว (m)','num'],
    ['cab','ชนิดสาย','sel',Object.keys(CB_TYPES).filter(k=>k!=='pv').map(k=>[k,CB_TYPES[k].name])],
    ['meth','วิธีติดตั้ง','sel',cbMethOpts(P.cab)],
    ['amb','อุณหภูมิโดยรอบ (°C)','sel',cbO(CB_TEMPS)],
    ['grp','จำนวนวงจรเดินรวมกัน','sel',cbO([1,2,3,4,5,6,7,8,9,12,16,20])],
    ['par','สายขนานต่อเฟส','sel',cbO([1,2,3,4])],
    ['vd','แรงดันตกที่ยอมให้ (%)','sel',cbO([1,1.5,2,2.5,3,4,5])],
    ['min','ขนาดสายเล็กสุด (mm²)','sel',cbO([1.5,2.5,4,6,10])],
    ['ka','กระแสลัดวงจรที่ตู้ (kA)','sel',cbO([3,4.5,6,10,15,25])],
    ['cond','ชนิดท่อ (แนะนำขนาดท่อ)','sel',[['pvc','ท่อ PVC'],['emt','EMT'],['imc','IMC'],['none','ไม่ใช้ท่อ']],()=>!['C','E'].includes(P.meth)],
    ['od','เส้นผ่านศูนย์กลางสายจริง (mm) 0 = ประมาณให้','num',null,()=>P.cond!=='none'&&!['C','E'].includes(P.meth)]
  ];
  if(pg==='dc')return[
    ['ns','แผงอนุกรมต่อสตริง','num'],['np','สตริงขนานกัน (ต่อ MPPT / คอมบายเนอร์)','num'],
    ['isc','Isc แผง (A)','num'],['imp','Imp แผง (A)','num'],['voc','Voc แผง (V)','num'],['vmp','Vmp แผง (V)','num'],
    ['kvoc','สัมประสิทธิ์ Voc (%/°C)','num'],['tmin','อุณหภูมิเซลล์ต่ำสุด (°C)','num'],
    ['imod','พิกัดฟิวส์อนุกรมสูงสุดของแผง (A)','num'],
    ['len','สายสตริง: ระยะทางเดียวถึงอินเวอร์เตอร์ / คอมบายเนอร์ (m)','num'],
    ['lenA','สายรวม: คอมบายเนอร์ถึงอินเวอร์เตอร์ (m)','num',null,()=>(+P.np|0)>1],
    ['cab','ชนิดสาย','sel',[['pv',CB_TYPES.pv.name],['cv','CV (XLPE) แกนเดียว 90°C']]],
    ['meth','วิธีเดินสาย','sel',cbMethOpts(P.cab)],
    ['amb','อุณหภูมิโดยรอบสาย (°C)','sel',cbO(P.cab==='pv'?[60,70,80,90]:CB_TEMPS)],
    ['grp','จำนวนสตริงเดินรวมกัน','sel',cbO([1,2,3,4,5,6,8,9,12])],
    ['vd','แรงดันตกที่ยอมให้ (%)','sel',cbO([1,1.5,2,3])],
    ['min','ขนาดสายเล็กสุด (mm²)','sel',cbO([2.5,4,6])],
    ['cond','ชนิดท่อ','sel',[['pvc','ท่อ PVC'],['emt','EMT'],['imc','IMC'],['none','ไม่ใช้ท่อ']]]
  ];
  if(pg==='bat')return[
    ['v','แรงดันแบต (V)','num'],['vmin','แรงดันต่ำสุดขณะจ่าย (V)','num'],
    ['src','คิดกระแสจาก','sel',[['kw','กำลังที่อินเวอร์เตอร์ดึงจากแบต (kW)'],['amps','กระแส (A)']]],
    ['kw','กำลังจ่ายจากแบตสูงสุด (kW)','num',null,()=>P.src==='kw'],['eff','ประสิทธิภาพอินเวอร์เตอร์ (%)','num',null,()=>P.src==='kw'],
    ['amps','กระแสสูงสุด (A)','num',null,()=>P.src==='amps'],
    ['len','ความยาวสาย ทางเดียว (m)','num'],
    ['cab','ชนิดสาย','sel',[['cv',CB_TYPES.cv.name],['thw',CB_TYPES.thw.name],['pv',CB_TYPES.pv.name]]],
    ['meth','วิธีเดินสาย','sel',cbMethOpts(P.cab)],
    ['amb','อุณหภูมิโดยรอบ (°C)','sel',cbO(P.cab==='pv'?[60,70,80]:CB_TEMPS)],
    ['grp','จำนวนวงจรเดินรวมกัน','sel',cbO([1,2,3,4])],
    ['par','สายขนานต่อขั้ว','sel',cbO([1,2,3,4])],
    ['vd','แรงดันตกที่ยอมให้ (%)','sel',cbO([0.5,1,1.5,2,3])],
    ['min','ขนาดสายเล็กสุด (mm²)','sel',cbO([4,6,10,16,25])],
    ['prot','อุปกรณ์ป้องกันที่จะติด','sel',[['brk','เบรกเกอร์ DC'],['fuse','ฟิวส์ (class T / NH / ANL)']]],
    ['ka','กระแสลัดวงจรของแบต (kA)','num']
  ];
  if(pg==='brk')return[
    ['sys','ระบบ','sel',[['ac','AC'],['dc','DC']]],
    ['inp','ใส่ค่าเป็น','sel',[['kW','กำลัง (kW)'],['A','กระแส (A)']],()=>P.sys==='ac'],
    ['kw','กำลัง (kW)','num',null,()=>P.sys==='ac'&&P.inp==='kW'],['pf','Power factor','num',null,()=>P.sys==='ac'&&P.inp==='kW'],
    ['a','กระแส (A)','num',null,()=>P.sys==='ac'&&P.inp==='A'],
    ['ph','ระบบไฟ','sel',[['1','1 เฟส'],['3','3 เฟส']],()=>P.sys==='ac'],['v','แรงดัน (V)','num',null,()=>P.sys==='ac'],
    ['use','ชนิดวงจร','sel',[['gen','วงจรทั่วไป'],['light','แสงสว่าง'],['sock','เต้ารับ'],['motor','มอเตอร์ / ปั๊ม / แอร์'],['inv','ขาออกอินเวอร์เตอร์'],['main','เมนเบรกเกอร์']],()=>P.sys==='ac'],
    ['cont','โหลดต่อเนื่อง ≥ 3 ชม.','sel',[[1,'ใช่'],[0,'ไม่ใช่']],()=>P.sys==='ac'&&P.use!=='inv'],
    ['ka','กระแสลัดวงจรที่ตู้ (kA)','sel',cbO([3,4.5,6,10,15,25]),()=>P.sys==='ac'],
    ['dk','ใช้กับ','sel',[['pv','สตริง / แผงโซลาร์'],['bat','แบตเตอรี่'],['load','โหลด DC (หลอด / ปั๊ม / คอนโทรลเลอร์)']],()=>P.sys==='dc'],
    ['isc','Isc ต่อสตริง (A)','num',null,()=>P.sys==='dc'&&P.dk==='pv'],['np','สตริงขนาน','num',null,()=>P.sys==='dc'&&P.dk==='pv'],
    ['voc','Voc สูงสุดตอนเย็น (V)','num',null,()=>P.sys==='dc'&&P.dk==='pv'],
    ['dv','แรงดันระบบ (V)','sel',cbO([12,24,48,51.2]),()=>P.sys==='dc'&&P.dk!=='pv'],
    ['dinp','ใส่ค่าเป็น','sel',[['W','กำลัง (W)'],['A','กระแส (A)']],()=>P.sys==='dc'&&P.dk!=='pv'],
    ['dw','กำลัง (W)','num',null,()=>P.sys==='dc'&&P.dk!=='pv'&&P.dinp==='W'],['da','กระแส (A)','num',null,()=>P.sys==='dc'&&P.dk!=='pv'&&P.dinp==='A']
  ];
  return[];
}
function cbFieldHTML(pg,f){
  const [k,lab,kind,opts]=f,v=CB[pg][k],id=`cb_${pg}_${k}`;
  const ctl=kind==='sel'
    ?`<select id="${id}" data-cb="${pg}.${k}">${opts.map(([ov,ol])=>`<option value="${esc(ov)}"${String(ov)===String(v)?' selected':''}>${esc(ol)}</option>`).join('')}</select>`
    :`<input id="${id}" type="number" step="any" inputmode="decimal" data-cb="${pg}.${k}" value="${esc(v)}">`;
  return`<label class="cbf" data-cbk="${k}">${esc(lab)}${ctl}</label>`;
}
function cbFormHTML(pg){
  const tools={
    ac:`<p class="hint tight" id="cbacinv"></p>`,
    dc:`<div class="eqact"><button class="btn sm" id="cbdcfrom">ใช้ค่าจากแผงและการต่อสาย (เมนู 02–03)</button></div>`,
    bat:`<div class="eqact"><button class="btn sm" id="cbbatfrom">ใช้ค่าจากแบตและอินเวอร์เตอร์ที่เลือก (เมนู 02)</button></div>`,
    brk:''
  }[pg]||'';
  return`<div class="panelbox cbform">${tools}<div class="cbgrid">${cbFields(pg).map(f=>cbFieldHTML(pg,f)).join('')}</div></div><div id="cbres_${pg}" class="cbres"></div>`;
}
function cbVis(pg){
  const sec=document.getElementById('cbpage');if(!sec)return;
  cbFields(pg).forEach(f=>{const el=sec.querySelector(`[data-cbk="${f[0]}"]`);if(el)el.hidden=!!(f[4]&&!f[4]())});
}
function cbMetric(k,v,s){return`<div class="metric"><div class="k">${k}</div><div class="v">${v}</div><div class="s">${s||''}</div></div>`}
function cbChecks(L){return`<ul class="checks">${L.map(c=>`<li><span class="b ${c.lvl}">${c.lvl==='ok'?'✓':c.lvl==='warn'?'!':'×'}</span><span>${esc(c.t)}</span></li>`).join('')}</ul>`}
function cbCandTable(sel,need,vdMax,par,label){
  if(!sel||!sel.C)return'';
  const pk=sel.pick&&sel.pick.s;
  return`<section class="card tbl"><h3>${esc(label||'เทียบขนาดสาย')}</h3><p class="hint tight">ตัวคูณอุณหภูมิ ${cbN(sel.kt,2)} · ตัวคูณจัดกลุ่ม ${cbN(sel.kg,2)}${par>1?` · ขนาน ${par} เส้น`:''} · ต้องการ Iz' ≥ ${cbN(need,1)} A และแรงดันตก ≤ ${vdMax}%</p>
    <div class="tblwrap"><table class="t cbt"><thead><tr><th>ขนาด (mm²)</th><th>Iz' (A)</th><th>กระแส</th><th>แรงดันตก (%)</th><th>แรงดันตก</th><th></th></tr></thead><tbody>${sel.C.map(c=>`<tr class="${c.s===pk?'cur':''}${!c.okMin?' cbdim':''}"><td>${c.s}</td><td>${cbN(c.iz,1)}</td><td>${c.okI?'<span class="cbok">ผ่าน</span>':'<span class="cbno">ไม่ผ่าน</span>'}</td><td>${cbN(c.vd.pct,2)}</td><td>${c.okV?'<span class="cbok">ผ่าน</span>':'<span class="cbno">ไม่ผ่าน</span>'}</td><td>${c.s===pk?'<b>เลือก</b>':!c.okMin?'<small>เล็กกว่าที่กำหนด</small>':''}</td></tr>`).join('')}</tbody></table></div></section>`;
}
function cbCdHTML(cd,kind){
  if(!cd)return'';
  const C=CB_CONDUIT[kind];
  return cbMetric(`ท่อ (${esc(C?C.name:'')})`,cd.size||'เกิน 4"',cd.size?`สาย ${cd.n} เส้น · ใช้พื้นที่ ${cbN(cd.fill*100)}% (ไม่เกิน ${cbN(cd.lim*100)}%)`:'แบ่งเป็นหลายท่อ หรือใช้รางเดินสาย')+cbMetric('หรือรางเดินสาย (Wireway)',cd.ww||'ใหญ่กว่า 200×300',`พื้นที่สายรวม ${cbN(cd.area)} mm² · บรรจุไม่เกิน 20%`);
}
function cbInvForAC(){
  if(typeof curInv!=='function')return null;
  const I=curInv();
  const micro=typeof isMicro==='function'&&isMicro(I),n=micro&&typeof MICRO!=='undefined'?Math.max(1,MICRO.n|0):1;
  return Object.assign({},I,micro?{pac:(+I.pac||0)*n,nUnits:n,iac:+I.iac>0?+I.iac:0}:{});
}
function cbRenderAC(){
  const P=CB.ac,inv=cbInvForAC(),r=cbCalcAC(P,inv),h=document.getElementById('cbres_ac');if(!h)return;
  const it=document.getElementById('cbacinv');
  if(it)it.textContent=P.src==='inv'&&inv?`อินเวอร์เตอร์: ${inv.brand} ${inv.model} · ${cbN(inv.pac)} W · ${String(inv.phase)==='3'?'3 เฟส':'1 เฟส'}${inv.nUnits>1?` (ไมโคร ${inv.nUnits} ตัวรวมกัน)`:''} เปลี่ยนรุ่นได้ที่เมนู 02`:'';
  const ok=r.size;
  h.innerHTML=`<div class="metrics">
    ${cbMetric('กระแสใช้งาน IB',`${cbN(r.IB,1)} A`,esc(r.srcTxt||''))}
    ${cbMetric('เบรกเกอร์',r.In?`${r.In} A`:'–',r.In?`${esc(r.kind)} · curve ${esc(r.curve)} · ${esc(r.poles)} · Icu ≥ ${r.icu} kA`:'')}
    ${cbMetric('สายเฟส (L)',ok?`${r.size} mm²${r.par>1?` × ${r.par}`:''}`:'–',ok?`${esc((CB_TYPES[P.cab]||{}).name)} · Iz' ${cbN(r.pick.iz,1)} A`:'')}
    ${cbMetric('สายนิวทรัล (N) / สายดิน (PE)',ok?`${r.N} / ${r.PE} mm²`:'–',ok?'N เท่าสายเฟส · PE ตาม IEC 60364-5-54 ตาราง 54.2':'')}
    ${cbMetric('แรงดันตก',ok?`${cbN(r.pick.vd.pct,2)} %`:'–',ok?`${cbN(r.pick.vd.dv,1)} V ที่ ${cbN(P.len)} m`:'')}
    ${cbMetric('กันไฟรั่ว',r.rcd?'RCD':'–',esc(r.rcd||''))}
    ${ok&&r.cd?cbCdHTML(r.cd,P.cond):''}
  </div>${cbChecks(r.ck)}${cbCandTable(r,r.In||r.need,P.vd,r.par,'เทียบขนาดสายเฟส')}`;
}
function cbRenderDC(){
  const P=CB.dc,r=cbCalcDC(P),h=document.getElementById('cbres_dc');if(!h)return;
  const s=r.str&&r.str.pick,a=r.arr&&r.arr.pick,np=Math.max(1,+P.np|0);
  let cd=null;if(P.cond!=='none'&&s)cd=cbConduit(P.cond,Array(2*Math.max(1,+P.grp|0)).fill(cbOd(P.cab,s.s)));
  h.innerHTML=`<div class="metrics">
    ${cbMetric('Voc สูงสุด (ตอนเย็น)',`${cbN(r.vocMax,1)} V`,`Vmp สตริง ${cbN(r.vmpS,1)} V`)}
    ${cbMetric('Isc สตริง / รวม',`${cbN(r.iscS,2)} / ${cbN(r.iscA,2)} A`,`Imp รวม ${cbN(r.impA,2)} A`)}
    ${cbMetric('ฟิวส์สตริง gPV',r.fuseNeed?(r.fuse?`${r.fuse} A`:'หาไม่ได้'):'ไม่ต้องใช้',r.fuseNeed?`ทั้ง + และ − ทุกสตริง · แรงดัน ≥ ${cbN(r.vocMax)} V DC`:np>=2?`ขนาน ${np} สตริง กระแสย้อน ${cbN(r.rev,1)} A`:'สตริงเดียว ไม่มีกระแสย้อน')}
    ${cbMetric('สายสตริง',s?`${s.s} mm²`:'–',s?`${esc(CB_TYPES[P.cab].name)} · Iz' ${cbN(s.iz,1)} A · ตก ${cbN(s.vd.pct,2)}%`:'')}
    ${np>1?cbMetric('สายรวมหลังคอมบายเนอร์',a?`${a.s} mm²`:'–',a?`Iz' ${cbN(a.iz,1)} A · ตก ${cbN(a.vd.pct,2)}%`:''):''}
    ${cbMetric('เบรกเกอร์ / สวิตช์ DC',r.InB?`${r.InB} A`:'–',`${esc(r.ueClass)} · ตัดทั้ง + และ −`)}
    ${cbMetric('SPD ฝั่ง DC',`Type 2 ${r.spd}`,`Ucpv ≥ ${cbN(r.vocMax)} V`)}
    ${cbMetric('สายดินโครงแผง',`${s&&s.s>6?cbPE(s.s):6} mm²`,'ทองแดง ต่อฝากโครงแผงและราง (ตรวจข้อกำหนดที่ใช้บังคับ)')}
    ${cd?cbMetric(`ท่อ (${esc(CB_CONDUIT[P.cond].name)})`,cd.size||'เกิน 4"',`สาย ${cd.n} เส้น (${Math.max(1,+P.grp|0)} สตริง × 2)`):''}
  </div>${cbChecks(r.ck)}${cbCandTable(r.str,r.needS,P.vd,1,'เทียบขนาดสายสตริง')}${np>1?cbCandTable(r.arr,r.needA,P.vd,1,'เทียบขนาดสายรวม'):''}`;
}
function cbRenderBat(){
  const P=CB.bat,ctx=cbBatCtx(),r=cbCalcBat(P,ctx),h=document.getElementById('cbres_bat');if(!h)return;
  const s=r.pick;
  h.innerHTML=`<div class="metrics">
    ${cbMetric('กระแสสูงสุด',`${cbN(r.I,1)} A`,esc(r.srcTxt||''))}
    ${cbMetric('ฟิวส์แบต',r.fuse?`${r.fuse} A`:'–',`class T / NH · ≥ ${cbN(r.vmax,1)} V DC · ตัดได้ ≥ ${cbN(r.ka,1)} kA`)}
    ${cbMetric('เบรกเกอร์ DC',r.brk?`${r.brk} A`:'–',esc(r.pole||''))}
    ${cbMetric('สายแบต (+ / −)',s?`${s.s} mm²${r.par>1?` × ${r.par}`:''}`:'–',s?`${esc(CB_TYPES[P.cab].name)} · Iz' ${cbN(s.iz,1)} A`:'')}
    ${cbMetric('แรงดันตก',s?`${cbN(s.vd.pct,2)} %`:'–',s?`${cbN(s.vd.dv,2)} V ไป-กลับ ${cbN(2*P.len,1)} m`:'')}
    ${cbMetric('สายดินตู้ / โครงแบต',s?`${cbPE(s.s)} mm²`:'–','ตาม IEC 60364-5-54 ตาราง 54.2 หรือตามคู่มือ')}
  </div>${cbChecks(r.ck)}${cbCandTable(r,r.prot||r.need,P.vd,r.par,'เทียบขนาดสายแบต')}`;
}
function cbRenderBrk(){
  const P=CB.brk,r=cbCalcBrk(P),h=document.getElementById('cbres_brk');if(!h)return;
  if(P.sys==='ac')h.innerHTML=`<div class="metrics">
    ${cbMetric('กระแสใช้งาน',`${cbN(r.I,1)} A`,r.cont?`× 1.25 = ${cbN(r.need,1)} A`:'')}
    ${cbMetric('พิกัดเบรกเกอร์ In',r.In?`${r.In} A`:'–',esc(r.kind||''))}
    ${cbMetric('จำนวนขั้ว',esc(r.poles),r.ph3?'3 เฟส':'1 เฟส')}
    ${cbMetric('Curve',esc(r.curve),'B = ต้านทาน / แสงสว่าง · C = ทั่วไป · D = มอเตอร์กระชากสูง · <a href="#library/mcb-curves" data-kblink="mcb-curves">อ่านเรื่อง curve</a>')}
    ${cbMetric('พิกัดตัดกระแส Icu',`≥ ${r.icu} kA`,'ต้องไม่ต่ำกว่ากระแสลัดวงจรที่จุดติดตั้ง')}
    ${cbMetric('กันไฟรั่ว',esc(r.rcd),'')}
  </div>${cbChecks(r.ck)}${cbBrkTable('ac',r.need)}`;
  else h.innerHTML=`<div class="metrics">
    ${cbMetric('กระแสที่ใช้คิด',`${cbN(r.I,1)} A`,`× 1.25 = ${cbN(r.need,1)} A`)}
    ${cbMetric('เบรกเกอร์ DC In',r.In?`${r.In} A`:'–',r.kind==='pv'?'ฝั่งแผง (PV)':r.kind==='bat'?'ฝั่งแบต':'โหลด DC')}
    ${cbMetric('แรงดันของเบรกเกอร์',esc(r.ueTxt),r.kind==='bat'?`แบตชาร์จเต็มประมาณ ${cbN(r.ue,1)} V`:`ระบบ ${cbN(r.V,1)} V`)}
    ${cbMetric('จำนวนขั้ว',esc(r.poles),'ใช้ชนิด DC เท่านั้น ต่อตามเครื่องหมายขั้ว')}
    ${r.fz?cbMetric('ทางเลือก: ฟิวส์',`${r.fz} A`,r.kind==='bat'?'class T / NH สำหรับแบต':'ฟิวส์ DC'):''}
  </div>${cbChecks(r.ck)}${cbBrkTable('dc',r.need)}`;
}
function cbBrkTable(sys,need){
  const L=sys==='ac'?CB_BRK_AC:CB_BRK_DC;
  return`<section class="card"><h3>พิกัดมาตรฐานที่ใช้ในเครื่องคำนวณ (${sys==='ac'?'AC':'DC'})</h3><div class="cbsteps">${L.map(v=>`<span class="${v===cbStd(L,need)?'on':v<need?'lo':''}">${v}</span>`).join('')}</div><p class="hint tight">ช่องที่เน้นคือพิกัดที่เลือก ช่องจางคือต่ำกว่าที่ต้องการ พิกัดที่มีขายจริงขึ้นกับยี่ห้อ</p></section>`;
}
function cbRenderRef(){
  const h=document.getElementById('cbres_ref');if(!h)return;
  const amp=(ins,ld)=>`<div class="tblwrap"><table class="t cbt"><thead><tr><th>mm²</th>${Object.keys(CB_AMP[ins][ld]).map(m=>`<th>${m}</th>`).join('')}</tr></thead><tbody>${CB_SIZES.map((s,i)=>`<tr><td>${s}</td>${Object.keys(CB_AMP[ins][ld]).map(m=>`<td>${CB_AMP[ins][ld][m][i]}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const kt=(t)=>`<tr>${Object.keys(t).map(k=>`<td>${k}°C<br><b>${t[k]}</b></td>`).join('')}</tr>`;
  h.innerHTML=`
  <section class="card tbl"><h3>พิกัดกระแสสายทองแดง PVC 70°C (A) อุณหภูมิอากาศ 30°C / ดิน 20°C</h3><p class="hint tight">1 เฟส และ DC (2 เส้นมีกระแส)</p>${amp('pvc',2)}<p class="hint tight" style="margin-top:10px">3 เฟส (3 เส้นมีกระแส)</p>${amp('pvc',3)}</section>
  <section class="card tbl"><h3>พิกัดกระแสสายทองแดง XLPE 90°C (A)</h3><p class="hint tight">1 เฟส และ DC</p>${amp('xlpe',2)}<p class="hint tight" style="margin-top:10px">3 เฟส</p>${amp('xlpe',3)}</section>
  <section class="card tbl"><h3>วิธีติดตั้ง</h3><div class="tblwrap"><table class="t cbt cbl"><tbody>${Object.keys(CB_METH).map(k=>`<tr><td>${esc(CB_METH[k])}</td></tr>`).join('')}</tbody></table></div></section>
  <section class="card tbl"><h3>สายโซลาร์ PV1-F / H1Z2Z2-K (A) ที่อากาศ 60°C ตัวนำ 120°C</h3><div class="tblwrap"><table class="t cbt"><thead><tr><th>mm²</th>${Object.keys(CB_PVMETH).map(k=>`<th>${esc(CB_PVMETH[k])}</th>`).join('')}</tr></thead><tbody>${CB_PVS.map((s,i)=>`<tr><td>${s}</td>${Object.keys(CB_PVAMP).map(k=>`<td>${CB_PVAMP[k][i]}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <p class="hint tight">ตัวคูณอุณหภูมิ: 70°C 0.91 · 80°C 0.82 · 90°C 0.71 · ต่ำกว่า 60°C ใช้ 1.00 (ไม่เพิ่มพิกัด)</p></section>
  <section class="card tbl"><h3>ตัวคูณปรับค่าอุณหภูมิ</h3><p class="hint tight">ในอากาศ PVC / XLPE</p><div class="tblwrap"><table class="t cbt cbk"><tbody>${kt(CB_KT.air.pvc)}${kt(CB_KT.air.xlpe)}</tbody></table></div><p class="hint tight" style="margin-top:10px">ในดิน PVC / XLPE</p><div class="tblwrap"><table class="t cbt cbk"><tbody>${kt(CB_KT.ground.pvc)}${kt(CB_KT.ground.xlpe)}</tbody></table></div></section>
  <section class="card tbl"><h3>ตัวคูณจัดกลุ่ม (วงจรเดินรวมกัน)</h3><div class="tblwrap"><table class="t cbt cbk"><tbody><tr>${Object.keys(CB_KG).map(k=>`<td>${k} วงจร<br><b>${CB_KG[k]}</b></td>`).join('')}</tr></tbody></table></div></section>
  <section class="card"><h3>หลักที่ใช้</h3><ul class="checks">${[
    'วงจร AC: IB ≤ In ≤ Iz\' โดย Iz\' = พิกัดสาย × ตัวคูณอุณหภูมิ × ตัวคูณจัดกลุ่ม × จำนวนสายขนาน · โหลดต่อเนื่อง In ≥ 1.25 × IB',
    'ขาออกอินเวอร์เตอร์: คิดกระแสที่แรงดันกริดต่ำ (220 V / 380 V) แล้วคูณ 1.25 หรือใช้ค่าเบรกเกอร์ที่คู่มือกำหนดถ้าต่างกัน',
    'แรงดันตก: ΔV = k × L × I × (R cosφ + X sinφ) · k = 2 สำหรับ 1 เฟสและ DC · k = √3 สำหรับ 3 เฟส · R ทองแดงที่อุณหภูมิใช้งาน',
    'สายดิน: เฟส ≤ 16 mm² ใช้เท่าเฟส · 16–35 mm² ใช้ 16 mm² · เกิน 35 mm² ใช้ครึ่งหนึ่ง (IEC 60364-5-54 ตาราง 54.2)',
    'ฝั่ง PV: Voc สูงสุด = Ns × Voc × (1 + kVoc × (Tmin − 25)) · สายสตริงไม่มีฟิวส์ ≥ 1.25 × Isc × (Np − 1) · สายรวม ≥ 1.25 × Isc × Np',
    'ฟิวส์สตริง: ต้องใช้เมื่อ (Np − 1) × Isc เกินพิกัดฟิวส์อนุกรมของแผง ขนาด 1.5 × Isc ≤ In ≤ 2.4 × Isc และไม่เกินพิกัดฟิวส์ของแผง',
    'แบต: In ≥ 1.25 × กระแสสูงสุด · ติดใกล้ขั้วแบต · พิกัดตัดกระแส DC ≥ กระแสลัดวงจรของแบต',
    'ท่อ: สาย 1 เส้น ≤ 53% · 2 เส้น ≤ 31% · 3 เส้นขึ้นไป ≤ 40% ของพื้นที่หน้าตัดภายใน · รางเดินสาย ≤ 20%'
  ].map(t=>`<li><span class="b idle">i</span><span>${esc(t)}</span></li>`).join('')}</ul></section>`;
}
function cbBatCtx(){
  const bi=typeof bankInfo==='function'?bankInfo():null;
  return bi?{txt:`แบต ${bi.b.brand} ${bi.b.model} × ${bi.n}`}:null;
}
function cbFromWiring(){
  const P=CB.dc,pv=typeof curPanel==='function'?curPanel():null;
  if(pv){Object.assign(P,{isc:+pv.isc||P.isc,imp:+pv.imp||P.imp,voc:+pv.voc||P.voc,vmp:+pv.vmp||P.vmp,kvoc:isFinite(+pv.kVoc)?+pv.kVoc:P.kvoc})}
  let msg='ใช้ค่าแผง '+(pv?`${pv.brand} ${pv.model}`:'–');
  try{
    const A=typeof analyze==='function'?analyze():null;
    const r=A&&A.res.find(x=>x.blk);
    if(r){P.ns=r.blk.ns;P.np=r.blk.mp;msg+=` · DC${r.k} ต่อ ${r.blk.ns}S${r.blk.mp}P`;if(A.res.filter(x=>x.blk).length>1)msg+=' (ใช้ MPPT แรกที่ต่อแล้ว)'}
    else msg+=' · ยังไม่ได้ต่อสายในเมนู 03 จำนวนแผงคงค่าเดิม';
    if(typeof st!=='undefined'&&isFinite(st.tmin))P.tmin=st.tmin;
  }catch(e){}
  cbMsg(msg);
}
function cbFromBattery(){
  const P=CB.bat,bi=typeof bankInfo==='function'?bankInfo():null,I=typeof curInv==='function'?curInv():null;
  let msg='';
  if(bi){P.v=Math.round(bi.V*10)/10;P.vmin=Math.round(bi.V*0.9*10)/10;P.amps=Math.round(Math.max(bi.chgA,bi.disA));if(bi.scA>0)P.ka=Math.round(bi.scA/100)/10;msg=`แบต ${bi.b.brand} ${bi.b.model} × ${bi.n} · ${cbN(bi.V,1)} V · ชาร์จ/จ่ายสูงสุด ${cbN(Math.max(bi.chgA,bi.disA))} A`}
  else msg='ยังไม่ได้เลือกแบตในเมนู 02';
  if(I&&I.type!=='on-grid'){const kw=+I.bdis||+I.backupKw||(+I.pac||0)/1000;if(kw>0){P.kw=kw;msg+=` · อินเวอร์เตอร์ ${I.brand} ${I.model} จ่ายจากแบต ${cbN(kw,1)} kW`}}
  if(P.v>150){P.cab='cv';msg+=' · แบตแรงดันสูง ใช้สายและสวิตช์ตามคู่มือผู้ผลิต'}
  cbMsg(msg);
}
function cbMsg(t){const m=document.getElementById('cbmsg');if(!m)return;m.textContent=t;m.hidden=!t}
function cbRenderPage(){
  const host=document.getElementById('cbpage'),chips=document.getElementById('cbtabs');if(!host||!chips)return;
  chips.innerHTML=CB_PAGES.map(([k,l])=>`<button class="chip" data-cbp="${k}" aria-pressed="${CB.page===k}">${esc(l)}</button>`).join('');
  host.innerHTML=CB.page==='ref'?'<div id="cbres_ref" class="cbres"></div>':cbFormHTML(CB.page);
  cbVis(CB.page);cbRun();
}
function cbRun(){
  try{
    if(CB.page==='ac')cbRenderAC();else if(CB.page==='dc')cbRenderDC();else if(CB.page==='bat')cbRenderBat();else if(CB.page==='brk')cbRenderBrk();else cbRenderRef();
  }catch(e){const h=document.getElementById('cbres_'+CB.page);if(h)h.innerHTML=`<p class="simmsg err">คำนวณไม่ได้: ${esc(e.message)}</p>`}
}
function cbRender(){if(!document.getElementById('cbpage'))return;if(!document.querySelector('#cbpage [data-cb], #cbres_ref'))cbRenderPage();else cbRun()}
function cbInit(){
  const sec=document.getElementById('tab-cable');if(!sec||sec.dataset.cbInit)return;sec.dataset.cbInit='1';
  sec.addEventListener('click',e=>{
    const b=e.target.closest('[data-cbp]');
    if(b){CB.page=b.dataset.cbp;cbMsg('');cbRenderPage();if(typeof touch==='function')touch();return}
    if(e.target.id==='cbdcfrom'){cbFromWiring();cbRenderPage();if(typeof touch==='function')touch();return}
    if(e.target.id==='cbbatfrom'){cbFromBattery();cbRenderPage();if(typeof touch==='function')touch()}
  });
  const onCh=e=>{
    const el=e.target.closest('[data-cb]');if(!el)return;
    const [pg,k]=el.dataset.cb.split('.'),D=CB_DEF()[pg];
    let v=el.value;
    if(typeof D[k]==='number'){v=parseFloat(v);if(!isFinite(v))return}
    CB[pg][k]=v;
    /* changing the cable type changes the list of installation methods */
    if(k==='cab'){const T=CB_TYPES[v];if(T&&!T.meth.includes(CB[pg].meth))CB[pg].meth=T.meth[T.ins==='pv'?2:0];
      if(T&&T.ins==='pv'&&CB[pg].amb<60)CB[pg].amb=60;if(T&&T.ins!=='pv'&&CB[pg].amb>60)CB[pg].amb=40;
      if(e.type==='change'){cbRenderPage();if(typeof touch==='function')touch();return}}
    if(e.type==='change'&&el.tagName==='SELECT'){cbVis(pg)}
    cbRun();if(typeof touch==='function')touch();
  };
  sec.addEventListener('input',onCh);sec.addEventListener('change',onCh);
  cbRenderPage();
}
if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded',()=>{try{cbInit()}catch(e){}});
