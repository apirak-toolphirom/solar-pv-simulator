/* ---- AC / system wiring: real inverter ports (GRID, BACKUP, GEN, CT, smart meter, BAT) ---- */
const ACS={apply:false,wires:[],armed:null,pos:{},zoom:1,wm:{},pm:{},msc:{},scm:{},selMod:null,rh:12,invPh:0,
  set:{supply:'1',mode:'selfuse',reserve:20,expLimOn:false,expLimW:0,gridStd:'PEA',backupEn:true,meterType:'ct',ctPos:'gridL',ctDir:'toGrid',
    mAddr:1,mBaud:9600,iAddr:1,iBaud:9600,batType:'li',batComm:'can',genMode:'off',cbGrid:32,cbBackup:32}};
const AC_C1={
  G:{x:20,y:40,w:150,h:130,t:'กริด (การไฟฟ้า)'},
  M:{x:230,y:40,w:150,h:170,t:'สมาร์ทมิเตอร์ RS485'},
  DB:{x:450,y:40,w:150,h:130,t:'ตู้เมนบ้าน (โหลดทั้งหมด)'},
  CT:{x:230,y:260,w:150,h:90,t:'CT (ตัวคล้องสาย)'},
  GEN:{x:20,y:400,w:170,h:180,t:'เครื่องปั่นไฟ'},
  CDB:{x:450,y:420,w:150,h:130,t:'ตู้โหลดสำรอง (Backup)'},
  INV:{x:700,y:30,w:260,h:630,t:''},
  BAT:{x:1030,y:60,w:150,h:170,t:'แบตเตอรี่'}
};
/* id,label,kind,x,y,side(l|r|b),component, [availability tags for inverter types] */
const AC_T1=[
 ['G.L','L','L',170,70,'r','G'],['G.N','N','N',170,100,'r','G'],['G.PE','PE','PE',170,130,'r','G'],
 ['M.LI','L เข้า','L',230,70,'l','M'],['M.LO','L ออก','L',380,70,'r','M'],['M.N','N','N',230,100,'l','M'],['M.A','A','a',270,210,'b','M'],['M.B','B','b',330,210,'b','M'],
 ['DB.LL','L','L',450,70,'l','DB'],['DB.NL','N','N',450,100,'l','DB'],['DB.PL','PE','PE',450,130,'l','DB'],
 ['DB.LR','L','L',600,70,'r','DB'],['DB.NR','N','N',600,100,'r','DB'],['DB.PR','PE','PE',600,130,'r','DB'],
 ['CT.S1','S1','ct1',380,290,'r','CT'],['CT.S2','S2','ct2',380,320,'r','CT'],
 ['GEN.L','L','L',190,430,'r','GEN'],['GEN.N','N','N',190,460,'r','GEN'],['GEN.PE','PE','PE',190,490,'r','GEN'],['GEN.S1','START 1','dry1',190,530,'r','GEN'],['GEN.S2','START 2','dry2',190,555,'r','GEN'],
 ['CDB.L','L','L',600,450,'r','CDB'],['CDB.N','N','N',600,480,'r','CDB'],['CDB.PE','PE','PE',600,510,'r','CDB'],
 ['INV.GL','GRID L','L',700,70,'l','INV','gh'],['INV.GN','GRID N','N',700,100,'l','INV','gh'],['INV.GP','GRID PE','PE',700,130,'l','INV','gh'],
 ['INV.PF','ตัวถัง PE','PE',700,165,'l','INV','all'],
 ['INV.BL','BACKUP L','L',700,215,'l','INV','ho'],['INV.BN','BACKUP N','N',700,245,'l','INV','ho'],['INV.BP','BACKUP PE','PE',700,275,'l','INV','ho'],
 ['INV.EL','GEN L','L',700,330,'l','INV','ho'],['INV.EN','GEN N','N',700,360,'l','INV','ho'],
 ['INV.D1','GEN START 1','dry1',700,410,'l','INV','ho'],['INV.D2','GEN START 2','dry2',700,440,'l','INV','ho'],
 ['INV.RA','RS485 A','a',700,520,'l','INV','gh'],['INV.RB','RS485 B','b',700,550,'l','INV','gh'],
 ['INV.C1','CT 1','ct1',700,595,'l','INV','gh'],['INV.C2','CT 2','ct2',700,625,'l','INV','gh'],
 ['INV.B+','BAT +','dc+',960,90,'r','INV','ho'],['INV.B-','BAT −','dc-',960,120,'r','INV','ho'],
 ['INV.CH','BMS CAN H','canh',960,170,'r','INV','ho'],['INV.CL','BMS CAN L','canl',960,200,'r','INV','ho'],
 ['BAT.+','+','dc+',1030,90,'l','BAT'],['BAT.-','−','dc-',1030,120,'l','BAT'],['BAT.H','CAN H','canh',1030,170,'l','BAT'],['BAT.L','CAN L','canl',1030,200,'l','BAT']
];
const AC_BUS1=[['DB.LL','DB.LR'],['DB.NL','DB.NR'],['DB.PL','DB.PR']];
/* three-phase layout (L1 L2 L3 N PE). bp = phases of the BACKUP port (3 = whole-home backup, 1 = backup box) */
function acTables3(bp){
  const C={
    G:{x:20,y:40,w:150,h:200,t:'กริด 3 เฟส'},
    M:{x:230,y:40,w:170,h:250,t:'สมาร์ทมิเตอร์ 3 เฟส'},
    DB:{x:470,y:40,w:150,h:200,t:'ตู้เมนบ้าน 3 เฟส'},
    CDB:bp===3?{x:470,y:400,w:150,h:200,t:'ตู้โหลดสำรอง 3 เฟส'}:{x:470,y:420,w:150,h:130,t:'ตู้โหลดสำรอง 1 เฟส'},
    INV:{x:720,y:30,w:260,h:630,t:'',ph3:1,bp},
    BAT:{x:1050,y:60,w:150,h:170,t:'แบตเตอรี่'}
  };
  const T=[],P=['1','2','3'];
  P.forEach((p,i)=>T.push(['G.L'+p,'L'+p,'L'+p,170,70+i*25,'r','G']));T.push(['G.N','N','N',170,145,'r','G'],['G.PE','PE','PE',170,170,'r','G']);
  P.forEach((p,i)=>T.push(['M.LI'+p,'L'+p,'L'+p,230,70+i*25,'l','M'],['M.LO'+p,'L'+p,'L'+p,400,70+i*25,'r','M']));
  T.push(['M.N','N','N',230,145,'l','M'],['M.A','A','a',280,290,'b','M'],['M.B','B','b',350,290,'b','M']);
  P.forEach((p,i)=>T.push(['DB.L'+p+'L','L'+p,'L'+p,470,70+i*25,'l','DB'],['DB.L'+p+'R','L'+p,'L'+p,620,70+i*25,'r','DB']));
  T.push(['DB.NL','N','N',470,145,'l','DB'],['DB.PL','PE','PE',470,170,'l','DB'],['DB.NR','N','N',620,145,'r','DB'],['DB.PR','PE','PE',620,170,'r','DB']);
  if(bp===3){P.forEach((p,i)=>T.push(['CDB.L'+p,'L'+p,'L'+p,620,430+i*25,'r','CDB']));T.push(['CDB.N','N','N',620,505,'r','CDB'],['CDB.PE','PE','PE',620,530,'r','CDB'])}
  else T.push(['CDB.L','L','L1',620,450,'r','CDB'],['CDB.N','N','N',620,480,'r','CDB'],['CDB.PE','PE','PE',620,510,'r','CDB']);
  P.forEach((p,i)=>T.push(['INV.GL'+p,'GRID L'+p,'L'+p,720,70+i*25,'l','INV','gh']));
  T.push(['INV.GN','GRID N','N',720,145,'l','INV','gh'],['INV.GP','GRID PE','PE',720,170,'l','INV','gh'],['INV.PF','ตัวถัง PE','PE',720,205,'l','INV','all']);
  if(bp===3){P.forEach((p,i)=>T.push(['INV.BL'+p,'BACKUP L'+p,'L'+p,720,255+i*25,'l','INV','ho']));T.push(['INV.BN','BACKUP N','N',720,330,'l','INV','ho'],['INV.BP','BACKUP PE','PE',720,355,'l','INV','ho'])}
  else T.push(['INV.BL','BACKUP L','L1',720,255,'l','INV','ho'],['INV.BN','BACKUP N','N',720,285,'l','INV','ho'],['INV.BP','BACKUP PE','PE',720,315,'l','INV','ho']);
  T.push(['INV.RA','RS485 A','a',720,520,'l','INV','gh'],['INV.RB','RS485 B','b',720,550,'l','INV','gh'],
    ['INV.B+','BAT +','dc+',980,90,'r','INV','ho'],['INV.B-','BAT −','dc-',980,120,'r','INV','ho'],['INV.CH','BMS CAN H','canh',980,170,'r','INV','ho'],['INV.CL','BMS CAN L','canl',980,200,'r','INV','ho'],
    ['BAT.+','+','dc+',1050,90,'l','BAT'],['BAT.-','−','dc-',1050,120,'l','BAT'],['BAT.H','CAN H','canh',1050,170,'l','BAT'],['BAT.L','CAN L','canl',1050,200,'l','BAT']);
  const BUS=P.map(p=>['DB.L'+p+'L','DB.L'+p+'R']).concat([['DB.NL','DB.NR'],['DB.PL','DB.PR']]);
  return{C,T,BUS};
}
const mkTM=T=>{const M={};T.forEach(t=>M[t[0]]={id:t[0],lab:t[1],kind:t[2],bx:t[3],by:t[4],x:t[3],y:t[4],side:t[5],comp:t[6],av:t[7]||''});return M};
const AC_MODES={'1':{C:AC_C1,T:AC_T1,BUS:AC_BUS1}};
{const a=acTables3(3),b=acTables3(1);AC_MODES['3']=a;AC_MODES['3b1']=b}
/* 1-phase inverter on a 3-phase supply: 3-phase grid, meter and main board; the inverter's single L goes to any one phase */
{const T3=acTables3(1),k3=new Set(['G','M','DB']),k1=['CDB','GEN','INV','BAT'];
 AC_MODES['1x3']={C:{G:T3.C.G,M:T3.C.M,DB:T3.C.DB,CDB:AC_C1.CDB,GEN:AC_C1.GEN,INV:AC_C1.INV,BAT:AC_C1.BAT},
  T:T3.T.filter(t=>k3.has(t[6])).concat(AC_T1.filter(t=>k1.includes(t[6])&&t[0]!=='INV.C1'&&t[0]!=='INV.C2')),BUS:T3.BUS}}
/* Huawei SUN2000 layout: battery signal goes to the inverter COM port as EN/GND (enable) and 485A2/485B2 (RS485 to the LUNA power module),
   the smart meter uses 485A1/485B1; no CT input and no GEN port */
function acHuawei(M){
  const drop=new Set(['INV.CH','INV.CL','BAT.H','BAT.L','INV.C1','INV.C2','CT.S1','CT.S2','GEN.L','GEN.N','GEN.PE','GEN.S1','GEN.S2','INV.EL','INV.EN','INV.D1','INV.D2']);
  const C={};Object.keys(M.C).forEach(k=>{if(k!=='CT'&&k!=='GEN')C[k]=Object.assign({},M.C[k],{hw:1})});
  C.BAT=Object.assign({},C.BAT,{h:230,t:'Huawei LUNA2000'});
  const ix=C.INV.x+C.INV.w,bx=C.BAT.x;
  const lab={'INV.RA':'485A1 (มิเตอร์)','INV.RB':'485B1 (มิเตอร์)','INV.B+':'BAT+','INV.B-':'BAT−','M.A':'RS485A','M.B':'RS485B','BAT.+':'BAT+','BAT.-':'BAT−'};
  const T=M.T.filter(t=>!drop.has(t[0])).map(t=>lab[t[0]]?[t[0],lab[t[0]]].concat(t.slice(2)):t.slice());
  T.push(['INV.EP','EN','en+',ix,170,'r','INV','ho'],['INV.EG','GND (EN−)','en-',ix,195,'r','INV','ho'],['INV.BA','485A2 (แบต)','ba',ix,225,'r','INV','ho'],['INV.BB','485B2 (แบต)','bb',ix,250,'r','INV','ho'],
    ['BAT.EP','Enable+','en+',bx,170,'l','BAT'],['BAT.EN','Enable−','en-',bx,195,'l','BAT'],['BAT.RA','485A','ba',bx,225,'l','BAT'],['BAT.RB','485B','bb',bx,250,'l','BAT']);
  return{C,T,BUS:M.BUS,hw:1};
}
['1','3','3b1','1x3'].forEach(k=>AC_MODES['h'+k]=acHuawei(AC_MODES[k]));
Object.values(AC_MODES).forEach(m=>m.TM=mkTM(m.T));
/* active mode follows the selected inverter; each mode keeps its own wires and module positions */
let AC_C,AC_T,AC_BUS,AC_TM,AC_MODE=null;
const acModeOf=I=>isPh3(I)?(bkPh3(I)||I.type==='on-grid'?'3':'3b1'):(ACS.set.supply==='3'?'1x3':'1');
const acHwOf=I=>String(I.brand||'').toLowerCase()==='huawei';
let AC_HW=false,AC_KEY=null;
function acEnsureMode(){
  const I=curInv(),m=acModeOf(I),hw=acHwOf(I),key=(hw?'h':'')+m;if(key===AC_KEY)return;
  if(AC_KEY){ACS.wm[AC_KEY]=ACS.wires;ACS.pm[AC_KEY]=ACS.pos;ACS.scm[AC_KEY]=ACS.msc}
  AC_MODE=m;AC_HW=hw;AC_KEY=key;const M=AC_MODES[key];AC_C=M.C;AC_T=M.T;AC_BUS=M.BUS;AC_TM=M.TM;
  ACS.wires=ACS.wm[key]||[];ACS.pos=ACS.pm[key]||{};ACS.msc=ACS.scm[key]||{};ACS.armed=null;ACS.selMod=null;
}
const acPh3=()=>AC_MODE!=='1';
/* live layout: each module can be moved (ACS.pos[comp]=[dx,dy]); terminals follow their module */
const AC_CL={},AC_VB={w:1200,h:690},AC_GRID=10;
const AC_SMIN=.5,AC_SMAX=1.5,acSc=k=>ACS.msc[k]||1;
const AC_MNAME={G:'กริด',M:'สมาร์ทมิเตอร์',DB:'ตู้เมนบ้าน',CT:'CT',GEN:'เครื่องปั่นไฟ',CDB:'ตู้โหลดสำรอง',INV:'อินเวอร์เตอร์',BAT:'แบตเตอรี่'};
function acSetModScale(k,v){if(!AC_C[k])return;v=Math.max(AC_SMIN,Math.min(AC_SMAX,Math.round(v*20)/20));if(v===1)delete ACS.msc[k];else ACS.msc[k]=v}
function acLayout(){
  let mx=1200,my=690;
  Object.keys(AC_CL).forEach(k=>delete AC_CL[k]);
  /* each module has its own scale (ACS.msc[comp]); its origin stays put and its terminals scale with it */
  Object.keys(AC_C).forEach(k=>{const c=AC_C[k],o=ACS.pos[k]||[0,0],s=acSc(k);AC_CL[k]={...c,x:c.x+o[0],y:c.y+o[1],s};mx=Math.max(mx,c.x+o[0]+c.w*s+190);my=Math.max(my,c.y+o[1]+c.h*s+30)});
  Object.keys(AC_TM).forEach(id=>{const T=AC_TM[id],c=AC_C[T.comp],o=ACS.pos[T.comp]||[0,0],s=acSc(T.comp);T.x=c.x+o[0]+(T.bx-c.x)*s;T.y=c.y+o[1]+(T.by-c.y)*s});
  AC_VB.w=mx;AC_VB.h=my;
}
function acMove(k,dx,dy){
  const c=AC_C[k];if(!c)return;
  dx=Math.round(dx/AC_GRID)*AC_GRID;dy=Math.round(dy/AC_GRID)*AC_GRID;
  dx=Math.max(-c.x,Math.min(1600,dx));dy=Math.max(-c.y,Math.min(1000,dy));
  if(dx===0&&dy===0)delete ACS.pos[k];else ACS.pos[k]=[dx,dy];
}
function acSetZoom(z){ACS.zoom=Math.max(.5,Math.min(2.5,Math.round(z*100)/100));acApplyZoom()}
function acApplyZoom(){
  const svg=document.getElementById('acsvg');if(!svg)return;
  svg.style.width=(ACS.zoom*100)+'%';
  const z=document.getElementById('aczoomv');if(z)z.textContent=Math.round(ACS.zoom*100)+'%';
  const r=document.getElementById('aczoom');if(r&&document.activeElement!==r)r.value=Math.round(ACS.zoom*100);
}
const KIND_NAME={ba:'485A2 (แบต)',bb:'485B2 (แบต)','en+':'EN (Enable+)','en-':'GND (Enable−)',L:'L (ไลน์)',L1:'L1',L2:'L2',L3:'L3',N:'N',PE:'PE','dc+':'DC +','dc-':'DC −',ct1:'CT 1',ct2:'CT 2',a:'RS485 A',b:'RS485 B',canh:'CAN H',canl:'CAN L',dry1:'Dry contact 1',dry2:'Dry contact 2'};
const KIND_COL={ba:'#d9a400',bb:'#8a63d2','en+':'#a0522d','en-':'#c9a27e',L:'#8b5a2b',L1:'#8b5a2b',L2:'#14191e',L3:'#7d8590',N:'#2a78d6',PE:'#1baf7a','dc+':'#d62828','dc-':'#14191e',ct1:'#e0762c',ct2:'#9a9aa3',a:'#d9a400',b:'#8a63d2',canh:'#d9a400',canl:'#8a63d2',dry1:'#e0762c',dry2:'#9a9aa3'};
function acAvail(t){
  const ty=curInv().type;
  if(!t.av||t.av==='all')return true;
  if(t.av==='gh')return ty!=='off-grid';
  if(t.av==='ho')return ty!=='on-grid';
  return true;
}
const acKey=(a,b)=>a<b?a+'|'+b:b+'|'+a;

/* net analysis */
function acNets(){
  const par={};const find=x=>par[x]===x?x:(par[x]=find(par[x]));
  AC_T.forEach(t=>par[t[0]]=t[0]);
  AC_BUS.forEach(b=>{par[find(b[0])]=find(b[1])});
  ACS.wires.forEach(w=>{if(par[w.a]!==undefined&&par[w.b]!==undefined)par[find(w.a)]=find(w.b)});
  return{same:(a,b)=>find(a)===find(b),root:find,members:r=>AC_T.map(t=>t[0]).filter(i=>find(i)===r)};
}
const hasWire=(a,b)=>ACS.wires.some(w=>(w.a===a&&w.b===b)||(w.a===b&&w.b===a));
const anyOn=id=>ACS.wires.some(w=>w.a===id||w.b===id);

const SWAP_OK=(a,b)=>{const P=[['a','b'],['ba','bb'],['en+','en-'],['ct1','ct2'],['canh','canl'],['dc+','dc-']];return P.some(([x,y])=>(a===x&&b===y)||(a===y&&b===x))};
const acKindOk=(a,b)=>a===b||SWAP_OK(a,b)||(isLk(a)&&isLk(b)&&(a==='L'||b==='L'));
const isLk=k=>k==='L'||k==='L1'||k==='L2'||k==='L3';
const tName=T=>T.comp==='INV'?'INV '+T.lab:T.comp+' '+T.lab;
function acAnalyze(){
  acEnsureMode();
  const I=curInv(),ty=I.type,S=ACS.set,N=acNets(),ck=[],d={},p3=acPh3();
  const add=(lvl,msg)=>ck.push([lvl,msg]);
  /* wire level */
  ACS.wires.forEach(w=>{
    const A=AC_TM[w.a],B=AC_TM[w.b];if(!A||!B)return;
    if(!acAvail(A)||!acAvail(B))add('err',`สาย ${tName(A)} ↔ ${tName(B)}: อินเวอร์เตอร์ประเภท ${ty} ไม่มีพอร์ตนี้`);
    else if(!acKindOk(A.kind,B.kind)){
      if(p3&&isLk(A.kind)&&isLk(B.kind))add('err',`ต่อข้ามเฟส: ${tName(A)} (${A.kind}) ↔ ${tName(B)} (${B.kind}) ต้องต่อ L1→L1, L2→L2, L3→L3 ลำดับเฟสผิดทำให้อินเวอร์เตอร์ขึ้นเตือนลำดับเฟส และมิเตอร์วัดกำลังผิดเฟส`);
      else if(['a','b'].includes(A.kind)&&['ba','bb'].includes(B.kind)||['a','b'].includes(B.kind)&&['ba','bb'].includes(A.kind))add('err',`สาย ${tName(A)} ↔ ${tName(B)}: ต่อผิดพอร์ต RS485 ของ Huawei 485A1/485B1 สำหรับสมาร์ทมิเตอร์ 485A2/485B2 สำหรับแบต LUNA2000`);
      else add('err',`สาย ${tName(A)} ↔ ${tName(B)}: ต่อคนละชนิดขั้ว (${KIND_NAME[A.kind]} กับ ${KIND_NAME[B.kind]})`);
    }
  });
  /* short circuits inside a net */
  const SRC=p3?{'G.L1':'กริด L1','G.L2':'กริด L2','G.L3':'กริด L3','INV.BL1':'BACKUP L1','INV.BL2':'BACKUP L2','INV.BL3':'BACKUP L3','INV.BL':'BACKUP L','GEN.L':'เครื่องปั่นไฟ'}:{'G.L':'กริด','INV.BL':'ขา BACKUP ของอินเวอร์เตอร์','GEN.L':'เครื่องปั่นไฟ'};
  const seen=new Set();
  AC_T.forEach(t=>{
    const r=N.root(t[0]);if(seen.has(r))return;seen.add(r);
    const mem=N.members(r);if(mem.length<2)return;
    const kinds=new Set(mem.map(m=>AC_TM[m].kind)),Ls=[...kinds].filter(isLk).sort();
    const srcPh=[...new Set(mem.filter(m=>['G','M','DB'].includes(AC_TM[m].comp)&&/^L[123]$/.test(AC_TM[m].kind)).map(m=>AC_TM[m].kind))].sort(),bkPh=[...new Set(mem.filter(m=>/^INV\.BL[123]$/.test(m)).map(m=>'L'+m.slice(-1)))];
    const shPh=srcPh.length>1?srcPh:bkPh.length>1?bkPh:null;
    if(shPh)add('err',`ชอตระหว่างเฟส ${shPh.join(' กับ ')} (แรงดันระหว่างเฟส 400 V) เบรกเกอร์ตัดทันที อันตรายมาก`);
    if(Ls.length&&kinds.has('N'))add('err',`ไฟ ${Ls.join('/')} ชอตกับ N: สายไลน์และ N ถูกต่อถึงกัน (`+mem.filter(m=>isLk(AC_TM[m].kind)||AC_TM[m].kind==='N').join(', ')+')');
    if(Ls.length&&kinds.has('PE'))add('err',`ไฟ ${Ls.join('/')} ต่อลงดิน PE: จะทำให้เบรกเกอร์หรือ RCD ตัด`);
    if(kinds.has('dc+')&&kinds.has('dc-'))add('err','ชอต DC + กับ − ที่แบตเตอรี่ อันตรายมาก');
    const src=Object.keys(SRC).filter(s=>mem.includes(s)),grid=src.filter(x=>x[0]==='G'),oth=src.filter(x=>x[0]!=='G');
    if(src.length>1&&(!p3||(grid.length&&oth.length)||oth.length>1))add('err',`แหล่งไฟ ${src.map(x=>SRC[x]).join(' กับ ')} ถูกต่อรวมกัน ต้องมีสวิตช์สลับ (ATS/interlock) ห้ามต่อสายตรง`);
  });
  const hyb=ty!=='on-grid',gridPort=ty!=='off-grid';
  if(p3)acCheck3(I,S,N,add,d,hyb,gridPort);
  else{
      /* grid to house */
    const nG=N.same('G.L','DB.LL'),viaM=!nG&&N.same('G.L','M.LI')&&N.same('DB.LL','M.LO');
    d.direct=nG;d.viaMeter=viaM;
    const nN=N.same('G.N','DB.NL')||(viaM&&N.same('G.N','DB.NL')),nPE=N.same('G.PE','DB.PL');
    if(!(nG||viaM))add('err','ตู้เมนบ้านยังไม่ได้รับไฟ L จากกริด (ต่อ กริด → ตู้เมน โดยตรง หรือผ่านสมาร์ทมิเตอร์)');
    else if(!nN)add('err','ตู้เมนบ้านยังไม่ได้ต่อ N กับกริด');
    else if(!nPE)add('warn','ตู้เมนบ้านยังไม่ได้ต่อสายดิน PE');
    else add('ok','กริด → ตู้เมนบ้าน ต่อ L N PE ครบ'+(viaM?' (ผ่านสมาร์ทมิเตอร์)':''));
    d.gridHouse=(nG||viaM)&&nN;
    /* inverter grid port */
    if(gridPort){
      const gl=N.same('INV.GL','DB.LR'),gn=N.same('INV.GN','DB.NR'),gp=N.same('INV.GP','DB.PR')||N.same('INV.GP','G.PE');
      if(!anyOn('INV.GL')&&!anyOn('INV.GN'))add('err','พอร์ต GRID ของอินเวอร์เตอร์ยังไม่ได้ต่อกับตู้เมนบ้าน');
      else if(!gl||!gn)add('err','พอร์ต GRID ต่อ L หรือ N ไม่ครบหรือไม่ถึงตู้เมนบ้าน');
      else if(!gp)add('warn','พอร์ต GRID ยังไม่ได้ต่อ PE');
      else add('ok','พอร์ต GRID ต่อเข้าตู้เมนบ้านครบ');
      d.gridPort=gl&&gn;
      if(viaM&&N.same('INV.GL','G.L')&&!N.same('INV.GL','DB.LR'))add('err','พอร์ต GRID ต่อก่อนสมาร์ทมิเตอร์ มิเตอร์จะไม่เห็นกำลังของอินเวอร์เตอร์ ต้องต่อหลังมิเตอร์ (ฝั่งโหลด)');
    }else d.gridPort=false;
    if(!anyOn('INV.PF'))add('warn','ตัวถังอินเวอร์เตอร์ (PE) ยังไม่ได้ต่อสายดิน');
    else if(!N.same('INV.PF','DB.PR')&&!N.same('INV.PF','G.PE'))add('warn','ตัวถังอินเวอร์เตอร์ต่อ PE แต่ไม่ถึงสายดินของบ้าน');
    /* backup port */
    d.backupOk=false;
    if(hyb){
      const touched=anyOn('INV.BL')||anyOn('INV.BN');
      if(!touched)add('warn','ยังไม่ได้ต่อพอร์ต BACKUP ตอนไฟดับจะไม่มีไฟจ่ายโหลดสำคัญ');
      else{
        const bl=N.same('INV.BL','CDB.L'),bn=N.same('INV.BN','CDB.N');
        if(N.same('INV.BL','DB.LR')||N.same('INV.BL','DB.LL'))add('err','พอร์ต BACKUP ต่อเข้าตู้เมนบ้านที่มีไฟกริด ตอนไฟดับอินเวอร์เตอร์จะจ่ายไฟย้อนเข้ากริด (back-feed) อันตรายต่อช่างไฟฟ้า');
        else if(!bl||!bn)add('err','พอร์ต BACKUP ต้องต่อ L และ N ไปที่ตู้โหลดสำรอง');
        else if(!N.same('INV.BP','CDB.PE'))add('warn','พอร์ต BACKUP ต่อ L N แล้ว แต่ PE ยังไม่ครบ');
        else add('ok','พอร์ต BACKUP ต่อเข้าตู้โหลดสำรองครบ');
        d.backupOk=bl&&bn&&!N.same('INV.BL','DB.LR')&&!N.same('INV.BL','G.L');
      }
    }
    /* generator */
    d.genOk=false;
    if(hyb&&(anyOn('GEN.L')||anyOn('INV.EL'))){
      const gl=N.same('GEN.L','INV.EL'),gn=N.same('GEN.N','INV.EN');
      if(!gl||!gn)add('err','พอร์ต GEN ต้องต่อ L และ N จากเครื่องปั่นไฟ');
      else{d.genOk=true;add('ok','เครื่องปั่นไฟต่อเข้าพอร์ต GEN');}
      if(gl&&!(hasWire('GEN.S1','INV.D1')&&hasWire('GEN.S2','INV.D2')||hasWire('GEN.S1','INV.D2')&&hasWire('GEN.S2','INV.D1')))add('warn','ไม่ได้ต่อสาย Start (dry contact) อินเวอร์เตอร์สั่งสตาร์ทเครื่องปั่นไฟเองไม่ได้ ต้องสตาร์ทด้วยมือ');
    }
  }
  /* battery */
  d.batOk=false;d.batRev=false;d.canOk=false;
  if(hyb){
    const bp=hasWire('BAT.+','INV.B+')&&hasWire('BAT.-','INV.B-'),br=hasWire('BAT.+','INV.B-')&&hasWire('BAT.-','INV.B+');
    if(br)add('err','ขั้ว + − ของแบตเตอรี่ต่อกลับกับอินเวอร์เตอร์ (reverse polarity) ห้ามเปิดเบรกเกอร์ DC');
    else if(bp){d.batOk=true;add('ok','แบตเตอรี่ต่อขั้ว + − ถูกต้อง')}
    else if(anyOn('INV.B+')||anyOn('INV.B-')||anyOn('BAT.+')||anyOn('BAT.-'))add('err','สายแบตเตอรี่ยังต่อไม่ครบทั้ง + และ −');
    else add('warn','ยังไม่ได้ต่อแบตเตอรี่ ระบบทำงานเป็นไฟจากแผงและกริดเท่านั้น');
    d.batRev=br;
    const bi=bankInfo();
    if(d.batOk&&bi&&bi.scA>0)add('ok',`กระแสลัดวงจรของชุดแบตสูงสุด ${f(bi.scA,0)} A เบรกเกอร์หรือฟิวส์ DC ต้องมีค่าตัดกระแสลัดวงจร (breaking capacity) ไม่ต่ำกว่านี้`);
    if(d.batOk&&bi&&I.bchg>0&&bi.chgKw<I.bchg*0.999)add('warn',`แบตรับชาร์จได้ ${f(bi.chgA,0)} A (${f(bi.chgKw,1)} kW) น้อยกว่ากำลังชาร์จของอินเวอร์เตอร์ ${I.bchg} kW ระบบจะชาร์จได้เท่าที่แบตรับ เพิ่มจำนวนชุดขนานถ้าต้องการชาร์จเร็วขึ้น`);
    if(bi&&!batCompat(bi.b,I))add('err',batCompatMsg(bi.b,I));
    if(d.batOk&&bi&&I.bvMax&&(bi.V<I.bvMin||bi.V>I.bvMax))add('err',`แรงดันชุดแบต ${f(bi.V,1)} V อยู่นอกช่วง ${I.bvMin}–${I.bvMax} V ของอินเวอร์เตอร์`);
    const cn=(hasWire('BAT.H','INV.CH')&&hasWire('BAT.L','INV.CL')),cs=(hasWire('BAT.H','INV.CL')&&hasWire('BAT.L','INV.CH'));
    d.canOk=cn;
    if(AC_HW){
      const en=hasWire('BAT.EP','INV.EP')&&hasWire('BAT.EN','INV.EG'),ens=hasWire('BAT.EP','INV.EG')&&hasWire('BAT.EN','INV.EP');
      const rs=hasWire('BAT.RA','INV.BA')&&hasWire('BAT.RB','INV.BB'),rss=hasWire('BAT.RA','INV.BB')&&hasWire('BAT.RB','INV.BA');
      if(en)add('ok','สาย Enable ต่อถูก (Enable+ → EN, Enable− → GND) อินเวอร์เตอร์สั่งเปิดแบตได้');
      else if(ens)add('err','สาย Enable+ / Enable− สลับกัน อินเวอร์เตอร์สั่งเปิดแบตไม่ได้ ไฟสถานะแบตไม่ติด');
      else if(d.batOk)add('err','ยังไม่ได้ต่อสาย Enable (Enable+ → EN, Enable− → GND) แบต LUNA2000 จะไม่เปิดทำงาน');
      if(rs)add('ok','สาย RS485 แบต (485A → 485A2, 485B → 485B2) ต่อถูก อินเวอร์เตอร์สื่อสารกับแบตได้');
      else if(rss)add('err','สาย RS485 แบต A/B สลับกัน อินเวอร์เตอร์จะไม่เห็นแบต');
      else if(d.batOk)add('err','ยังไม่ได้ต่อ RS485 ของแบต (485A → 485A2, 485B → 485B2) อินเวอร์เตอร์จะไม่เห็นแบต');
      d.canOk=en&&rs;
    }else if(S.batType==='li'&&S.batComm!=='none'){
      if(cn)add('ok','สื่อสาร BMS CAN ต่อถูกต้อง');
      else if(cs)add('err','สาย CAN H/L สลับกัน อินเวอร์เตอร์จะไม่เห็นแบต');
      else if(d.batOk)add('warn','แบตลิเธียมแต่ยังไม่ได้ต่อสาย BMS CAN อินเวอร์เตอร์อาจไม่ยอมชาร์จ หรือแสดง BMS fault');
    }
    if(S.batType==='lead'&&(cn||cs))add('warn','แบตตะกั่วกรดไม่มี BMS สาย CAN ไม่จำเป็น');
  }
  if(p3)acMeter3(S,N,add,d);
  else if(AC_HW&&S.meterType==='ct'){d.meterOk=false;add('err','อินเวอร์เตอร์ Huawei ไม่มีขั้ว CT ใช้สมาร์ทมิเตอร์ Huawei (DDSU666-H 1 เฟส) ต่อ RS485 เข้า 485A1/485B1 ตั้ง "อุปกรณ์วัดกริด" เป็นสมาร์ทมิเตอร์')}
  else{
  d.meterOk=false;
  const mt=S.meterType;
  if(mt==='ct'){
    const sw=hasWire('CT.S1','INV.C2')&&hasWire('CT.S2','INV.C1'),ok=hasWire('CT.S1','INV.C1')&&hasWire('CT.S2','INV.C2');
    let bad=false;
    if(!ok&&!sw){add('err','เลือกใช้ CT แต่ยังไม่ได้ต่อสาย CT เข้าอินเวอร์เตอร์ครบ (S1→CT1, S2→CT2)');bad=true}
    if(S.ctPos==='loadL'){add('err','CT คล้องสาย L ของโหลดบ้านเท่านั้น อินเวอร์เตอร์จะไม่เห็นกำลังกริดจริง ต้องคล้องที่จุดต่อกริด');bad=true}
    else if(S.ctPos==='invL'){add('err','CT คล้องสาย L ของอินเวอร์เตอร์ วัดกำลังอินเวอร์เตอร์ไม่ใช่กำลังกริด ต้องคล้องที่จุดต่อกริด');bad=true}
    else if(S.ctPos==='N'){add('err','CT คล้องสาย N ต้องคล้องสาย L เส้นเปลวเท่านั้น');bad=true}
    const rev=(S.ctDir!=='toGrid')!==sw;
    if(ok||sw){
      if(rev){add('err','ทิศ CT กลับด้าน (ลูกศรต้องชี้ไปทางกริด และ S1→CT1, S2→CT2) อินเวอร์เตอร์จะเห็นนำเข้าเป็นส่งออก และกลับกัน');bad=true}
      else if(!bad)add('ok','CT คล้องถูกที่ ทิศถูก ต่อสายถูกขั้ว');
    }
    d.meterOk=!bad&&(ok||sw);d.ctRev=rev;
    if(anyOn('M.A')||anyOn('M.B'))add('warn','ต่อสมาร์ทมิเตอร์ไว้ แต่ตั้งค่าใช้ CT ไม่ได้ใช้มิเตอร์');
  }else if(mt==='meter'){
    let bad=false;
    const ab=hasWire('M.A','INV.RA')&&hasWire('M.B','INV.RB'),sw=hasWire('M.A','INV.RB')&&hasWire('M.B','INV.RA');
    if(!d.viaMeter){add('err','เลือกใช้สมาร์ทมิเตอร์ แต่ยังไม่ได้ต่ออนุกรมระหว่างกริดกับตู้เมน (L เข้า ← กริด, L ออก → ตู้เมน)');bad=true}
    if(!N.same('M.N','G.N')&&!N.same('M.N','DB.NL')){add('err','มิเตอร์ยังไม่ได้ต่อ N (ไม่มีไฟเลี้ยงมิเตอร์)');bad=true}
    if(sw){add('err','สาย RS485 A/B สลับกัน มิเตอร์จะสื่อสารไม่ได้');bad=true}
    else if(!ab){add('err','ยังไม่ได้ต่อ RS485 A→A, B→B ระหว่างมิเตอร์กับอินเวอร์เตอร์');bad=true}
    if(S.mAddr!==S.iAddr||S.mBaud!==S.iBaud){add('err',`ค่าสื่อสารไม่ตรงกัน: มิเตอร์ ${S.mAddr}/${S.mBaud} อินเวอร์เตอร์ ${S.iAddr}/${S.iBaud} (แอดเดรส/Baud) จะขึ้น Meter fault`);bad=true}
    if(!bad)add('ok','สมาร์ทมิเตอร์ต่อถูก สื่อสารได้');
    d.meterOk=!bad;
    if(anyOn('CT.S1')||anyOn('CT.S2'))add('warn','ต่อ CT ไว้ แต่ตั้งค่าใช้สมาร์ทมิเตอร์');
  }else{
    if(anyOn('CT.S1')||anyOn('M.A'))add('warn','ต่อ CT หรือมิเตอร์ไว้ แต่ตั้งค่า "ไม่ใช้" อินเวอร์เตอร์จะไม่ใช้ข้อมูลนี้');
  }
  }
  /* settings consistency */
  if(S.expLimOn&&!d.meterOk)add('err','เปิด Export limit แต่ไม่มี CT หรือมิเตอร์ที่ใช้งานได้ ระบบจำกัดการขายไฟไม่ได้ ไฟอาจไหลออกกริดเกินที่กำหนด');
  if(S.expLimOn&&d.meterOk&&S.meterType==='ct'&&d.ctRev)add('err','Export limit ทำงานผิดทิศ');
  if(!hyb&&S.batType&&false){}
  if(S.mode==='backup'&&!d.batOk&&hyb)add('warn','โหมด Backup reserve ต้องมีแบต');
  if(S.genMode!=='off'&&!d.genOk&&hyb&&(!p3||AC_MODE==='1x3')&&!AC_HW)add('warn','เปิดใช้เครื่องปั่นไฟในตั้งค่า แต่ยังไม่ได้ต่อพอร์ต GEN');
  if(S.backupEn&&!d.backupOk&&hyb&&anyOn('INV.BL'))add('warn','เปิดใช้ Backup แต่การต่อพอร์ต BACKUP ยังไม่ถูก');
  if(!S.backupEn&&d.backupOk)add('warn','ต่อ BACKUP ครบแล้ว แต่ตั้งค่าปิด Backup ตอนไฟดับจะไม่จ่ายไฟ');
  if(p3&&S.expLimOn&&d.meterOk&&String(I.asym)!=='1')add('warn',(AC_MODE==='1x3'?'อินเวอร์เตอร์ 1 เฟสบนไฟ 3 เฟส':'รุ่นนี้จ่ายไฟเท่ากันทุกเฟส')+' จำกัดการขายไฟได้จากยอดรวม 3 เฟส ถ้าโหลดแต่ละเฟสไม่เท่ากัน บางเฟสยังไหลออกกริดได้ ดูตาราง "มิเตอร์ 3 เฟส" ด้านล่าง');
  if(((p3&&AC_MODE!=='1x3')||AC_HW)&&S.genMode!=='off')add('warn','ผังนี้ไม่มีพอร์ต GEN (อินเวอร์เตอร์รุ่นนี้ไม่มีพอร์ตเครื่องปั่นไฟ) ตั้งค่าเครื่องปั่นไฟเป็น "ไม่ใช้"');
  /* breakers (per phase on three-phase) */
  const ph3i=p3&&AC_MODE!=='1x3',iRated=ph3i?I.pac/(3*230):I.pac/230,min=iRated*1.2,per=ph3i?' ต่อเฟส':'';
  const cb=(v,nm,ir)=>{const mn=(ir||iRated)*1.2;if(v<mn)add('warn',`เบรกเกอร์ ${nm} ${v} A เล็กกว่าที่ควรใช้ (กระแสพิกัด${per} ${f(ir||iRated,0)} A × 1.2 ≈ ${f(mn,0)} A) อาจตัดเมื่อโหลดเต็ม`);else if(v>mn*2.2)add('warn',`เบรกเกอร์ ${nm} ${v} A ใหญ่เกินไป ใหญ่กว่าสายและอุปกรณ์ที่ป้องกันได้ ควรเลือกใกล้ ${f(mn,0)} A`)};
  if(gridPort&&d.gridPort)cb(S.cbGrid,ph3i?'GRID (3 ขั้ว)':'GRID');
  if(hyb&&d.backupOk)cb(S.cbBackup,'BACKUP',p3&&AC_MODE==='3b1'?(I.backupKw>0?I.backupKw:I.pac/1000)*1000/230:null);
  /* errors summary */
  {const u=new Set();for(let i=ck.length-1;i>=0;i--){const k=ck[i][0]+ck[i][1];if(u.has(k))ck.splice(i,1);else u.add(k)}}
  const nE=ck.filter(c=>c[0]==='err').length,nW=ck.filter(c=>c[0]==='warn').length;
  const lvl=nE?'err':nW?'warn':ck.some(c=>c[0]==='ok')?'ok':'warn';
  return{ck,d,nE,nW,lvl};
}
/* three-phase checks: grid → house, inverter GRID and BACKUP ports */
const PH3=['1','2','3'];
function acCheck3(I,S,N,add,d,hyb,gridPort){
  const dir=PH3.map(p=>N.same('G.L'+p,'DB.L'+p+'L')),via=PH3.map((p,i)=>!dir[i]&&N.same('G.L'+p,'M.LI'+p)&&N.same('M.LO'+p,'DB.L'+p+'L'));
  const fed=PH3.map((p,i)=>dir[i]||via[i]),miss=PH3.filter((p,i)=>!fed[i]).map(p=>'L'+p);
  const nN=N.same('G.N','DB.NL'),nPE=N.same('G.PE','DB.PL');
  d.viaMeter=via.every(Boolean);d.viaSome=via.some(Boolean);d.viaPh=via;d.direct=dir.every(Boolean);
  if(miss.length===3)add('err','ตู้เมนบ้านยังไม่ได้รับไฟจากกริด ต่อ L1 L2 L3 จากกริด → ตู้เมน โดยตรง หรือผ่านสมาร์ทมิเตอร์ 3 เฟส');
  else if(miss.length)add('err',`ตู้เมนบ้านได้รับไฟไม่ครบ 3 เฟส ขาด ${miss.join(', ')} โหลด 3 เฟส (เช่น มอเตอร์ ปั๊ม) จะทำงานไม่ได้ และอินเวอร์เตอร์ 3 เฟสจะไม่เชื่อมกริด`);
  else if(!nN)add('err','ตู้เมนบ้านยังไม่ได้ต่อ N กับกริด โหลด 1 เฟส (230 V) จะไม่มีไฟ');
  else if(!nPE)add('warn','ตู้เมนบ้านยังไม่ได้ต่อสายดิน PE');
  else add('ok','กริด 3 เฟส → ตู้เมนบ้าน ต่อ L1 L2 L3 N PE ครบ'+(d.viaMeter?' (ผ่านสมาร์ทมิเตอร์ 3 เฟส)':''));
  d.gridHouse=!miss.length&&nN;
  if(gridPort&&AC_MODE==='1x3'){
    const ph=PH3.filter(p=>N.same('INV.GL','DB.L'+p+'R')),gn=N.same('INV.GN','DB.NR'),gp=N.same('INV.GP','DB.PR')||N.same('INV.GP','G.PE');
    if(!anyOn('INV.GL')&&!anyOn('INV.GN'))add('err','พอร์ต GRID (1 เฟส) ยังไม่ได้ต่อกับตู้เมนบ้าน ต่อ L เข้าเฟสใดเฟสหนึ่ง (L1, L2 หรือ L3) และต่อ N');
    else if(!ph.length)add('err','พอร์ต GRID L ยังไม่ถึงเฟสใดของตู้เมนบ้าน');
    else if(!gn)add('err','พอร์ต GRID ยังไม่ได้ต่อ N อินเวอร์เตอร์ 1 เฟสต้องใช้ L กับ N (230 V)');
    else if(!gp)add('warn','พอร์ต GRID ยังไม่ได้ต่อ PE');
    else add('ok',`พอร์ต GRID 1 เฟสต่อเข้าเฟส L${ph[0]} ของตู้เมนบ้าน ควรเลือกเฟสที่มีโหลดกลางวันมาก`);
    d.gridPort=ph.length===1&&gn;ACS.invPh=ph.length?+ph[0]-1:0;
    if(PH3.some((p,i)=>via[i]&&N.same('INV.GL','G.L'+p)&&!N.same('INV.GL','DB.L'+p+'R')))add('err','พอร์ต GRID ต่อก่อนสมาร์ทมิเตอร์ มิเตอร์จะไม่เห็นกำลังของอินเวอร์เตอร์ ต้องต่อหลังมิเตอร์ (ฝั่งโหลด)');
  }else if(gridPort){
    const ok=PH3.map(p=>N.same('INV.GL'+p,'DB.L'+p+'R')),gn=N.same('INV.GN','DB.NR'),gp=N.same('INV.GP','DB.PR')||N.same('INV.GP','G.PE');
    const touched=PH3.some(p=>anyOn('INV.GL'+p))||anyOn('INV.GN');
    const lack=PH3.filter((p,i)=>!ok[i]).map(p=>'L'+p);
    if(!touched)add('err','พอร์ต GRID 3 เฟสของอินเวอร์เตอร์ยังไม่ได้ต่อกับตู้เมนบ้าน');
    else if(lack.length)add('err',`พอร์ต GRID ต่อไม่ครบหรือไม่ถึงตู้เมน ขาด ${lack.join(', ')} อินเวอร์เตอร์จะแจ้งเฟสหาย (grid phase loss) และไม่จ่ายไฟ`);
    else if(!gn)add('err','พอร์ต GRID ยังไม่ได้ต่อ N (ระบบ 3W/N+PE ต้องมี N)');
    else if(!gp)add('warn','พอร์ต GRID ยังไม่ได้ต่อ PE');
    else add('ok','พอร์ต GRID 3 เฟสต่อเข้าตู้เมนบ้านครบ ลำดับเฟสถูก');
    d.gridPort=!lack.length&&gn;
    if(PH3.some((p,i)=>via[i]&&N.same('INV.GL'+p,'G.L'+p)&&!N.same('INV.GL'+p,'DB.L'+p+'R')))add('err','พอร์ต GRID ต่อก่อนสมาร์ทมิเตอร์ มิเตอร์จะไม่เห็นกำลังของอินเวอร์เตอร์ ต้องต่อหลังมิเตอร์ (ฝั่งโหลด)');
  }else d.gridPort=false;
  if(!anyOn('INV.PF'))add('warn','ตัวถังอินเวอร์เตอร์ (PE) ยังไม่ได้ต่อสายดิน');
  else if(!N.same('INV.PF','DB.PR')&&!N.same('INV.PF','G.PE'))add('warn','ตัวถังอินเวอร์เตอร์ต่อ PE แต่ไม่ถึงสายดินของบ้าน');
  d.backupOk=false;d.genOk=false;
  if(!hyb)return;
  if(AC_MODE==='1x3'&&(anyOn('GEN.L')||anyOn('INV.EL'))){
    const gl=N.same('GEN.L','INV.EL'),gn=N.same('GEN.N','INV.EN');
    if(!gl||!gn)add('err','พอร์ต GEN ต้องต่อ L และ N จากเครื่องปั่นไฟ');
    else{d.genOk=true;add('ok','เครื่องปั่นไฟต่อเข้าพอร์ต GEN')}
    if(gl&&!(hasWire('GEN.S1','INV.D1')&&hasWire('GEN.S2','INV.D2')||hasWire('GEN.S1','INV.D2')&&hasWire('GEN.S2','INV.D1')))add('warn','ไม่ได้ต่อสาย Start (dry contact) อินเวอร์เตอร์สั่งสตาร์ทเครื่องปั่นไฟเองไม่ได้ ต้องสตาร์ทด้วยมือ');
  }
  const b3=AC_MODE==='3';
  const outs=b3?PH3.map(p=>'INV.BL'+p):['INV.BL'],to=b3?PH3.map(p=>'CDB.L'+p):['CDB.L'];
  const touched=outs.some(anyOn)||anyOn('INV.BN');
  if(!touched){add('warn',b3?'ยังไม่ได้ต่อพอร์ต BACKUP 3 เฟส ตอนไฟดับจะไม่มีไฟจ่ายโหลดสำรอง':(AC_MODE==='3b1'?'ยังไม่ได้ต่อพอร์ต BACKUP (1 เฟส ผ่าน Backup Box) ตอนไฟดับจะไม่มีไฟจ่ายโหลดสำคัญ':'ยังไม่ได้ต่อพอร์ต BACKUP ตอนไฟดับจะไม่มีไฟจ่ายโหลดสำคัญ'));return}
  const feed=outs.some(o=>PH3.some(p=>N.same(o,'DB.L'+p+'L')||N.same(o,'DB.L'+p+'R')||N.same(o,'G.L'+p)));
  const ok=outs.every((o,i)=>N.same(o,to[i])),bn=N.same('INV.BN','CDB.N');
  if(feed)add('err','พอร์ต BACKUP ต่อเข้าตู้เมนบ้านที่มีไฟกริด ตอนไฟดับอินเวอร์เตอร์จะจ่ายไฟย้อนเข้ากริด (back-feed) อันตรายต่อช่างไฟฟ้า');
  else if(!ok||!bn)add('err',b3?'พอร์ต BACKUP 3 เฟสต้องต่อ L1 L2 L3 และ N ไปที่ตู้โหลดสำรองให้ตรงเฟส':'พอร์ต BACKUP ต้องต่อ L และ N ไปที่ตู้โหลดสำรอง');
  else if(!N.same('INV.BP','CDB.PE'))add('warn','พอร์ต BACKUP ต่อสายไฟแล้ว แต่ PE ยังไม่ครบ');
  else add('ok',b3?'พอร์ต BACKUP 3 เฟสต่อเข้าตู้โหลดสำรองครบ':'พอร์ต BACKUP 1 เฟสต่อเข้าตู้โหลดสำรองครบ (โหลดสำรองต้องเป็นวงจร 1 เฟส 230 V)');
  d.backupOk=ok&&bn&&!feed;
}
/* three-phase meter: must be a 3-phase smart meter in series on all phases */
function acMeter3(S,N,add,d){
  d.meterOk=false;d.ctRev=false;
  if(S.meterType==='ct'){add('err','อินเวอร์เตอร์ 3 เฟสต้องวัดกริดครบทุกเฟส ใช้สมาร์ทมิเตอร์ 3 เฟส (เช่น Huawei DTSU666-H) ตั้ง "อุปกรณ์วัดกริด" เป็นสมาร์ทมิเตอร์');return}
  if(S.meterType==='none'){if(anyOn('M.A'))add('warn','ต่อมิเตอร์ไว้ แต่ตั้งค่า "ไม่ใช้" อินเวอร์เตอร์จะไม่ใช้ข้อมูลนี้');return}
  let bad=false;
  if(!d.viaMeter){
    if(d.viaSome){const m=PH3.filter((p,i)=>!d.viaPh[i]).map(p=>'L'+p);add('err',`มิเตอร์วัดไม่ครบ 3 เฟส: ${m.join(', ')} ไม่ได้ผ่านมิเตอร์ อินเวอร์เตอร์จะเห็นกำลังกริดผิด จำกัดการขายไฟผิด`)}
    else add('err','เลือกใช้สมาร์ทมิเตอร์ แต่ยังไม่ได้ต่ออนุกรมระหว่างกริดกับตู้เมน (L1 L2 L3 เข้า ← กริด, L1 L2 L3 ออก → ตู้เมน)');
    bad=true;
  }
  if(!N.same('M.N','G.N')&&!N.same('M.N','DB.NL')){add('err','มิเตอร์ยังไม่ได้ต่อ N มิเตอร์ใช้ N เป็นจุดอ้างอิงวัดแรงดันแต่ละเฟส');bad=true}
  const ab=hasWire('M.A','INV.RA')&&hasWire('M.B','INV.RB'),sw=hasWire('M.A','INV.RB')&&hasWire('M.B','INV.RA');
  if(sw){add('err','สาย RS485 A/B สลับกัน มิเตอร์จะสื่อสารไม่ได้');bad=true}
  else if(!ab){add('err','ยังไม่ได้ต่อ RS485 A→A, B→B ระหว่างมิเตอร์กับอินเวอร์เตอร์');bad=true}
  if(S.mAddr!==S.iAddr||S.mBaud!==S.iBaud){add('err',`ค่าสื่อสารไม่ตรงกัน: มิเตอร์ ${S.mAddr}/${S.mBaud} อินเวอร์เตอร์ ${S.iAddr}/${S.iBaud} (แอดเดรส/Baud) จะขึ้น Meter fault`);bad=true}
  if(!bad)add('ok','สมาร์ทมิเตอร์ 3 เฟสต่อถูก วัดได้ครบ L1 L2 L3 สื่อสารได้');
  d.meterOk=!bad;
}
/* ---- three-phase meter readout: per-phase load, inverter output and grid power from the backup energy balance ---- */
let AC_READ=null;
function fill3(total,want,cap){
  /* share `total` over 3 phases, each up to want[q] and cap; returns array */
  const out=[0,0,0];let left=total;
  for(let it=0;it<4&&left>1e-9;it++){
    const open=[0,1,2].filter(q=>out[q]<Math.min(want[q],cap)-1e-9);if(!open.length)break;
    const sw=open.reduce((a,q)=>a+(Math.min(want[q],cap)-out[q]),0);
    open.forEach(q=>{const room=Math.min(want[q],cap)-out[q],g=Math.min(room,left*room/sw);out[q]+=g});
    left=total-out.reduce((a,b)=>a+b,0);
  }
  return out;
}
function phaseAt(B,I,i){
  const R=B.R,LP=B.LP,asym=String(I.asym)==='1',cap=I.pac/3;
  const outage=R.outage[i]||B.mode==='off',crit=outage&&B.island==='crit';
  const load=[0,1,2].map(q=>(crit?LP.phc:LP.ph)[q][i]);
  const toLoad=R.direct[i]+R.fromBat[i],exp=R.exp[i];
  let inv;
  if(AC_MODE==='1x3'){
    /* 1-phase inverter: all of its output lands on the phase its GRID port is wired to */
    const q=ACS.invPh||0;inv=[0,0,0];inv[q]=outage?toLoad:toLoad+exp;
    return outage?{load,inv,grid:[0,0,0],outage:true}:{load,inv,grid:load.map((l,k)=>l-inv[k]),outage:false};
  }
  if(outage){
    /* island: inverter feeds what it can; 1-phase backup box feeds one circuit only */
    inv=fill3(toLoad,load,asym||AC_MODE==='3b1'?cap*3:cap);
    return{load,inv,grid:[0,0,0],outage:true};
  }
  if(asym){inv=fill3(toLoad,load,cap);const head=inv.map(v=>cap-v),hs=head.reduce((a,b)=>a+b,0);inv=inv.map((v,q)=>v+(hs>0?exp*head[q]/hs:exp/3))}
  else inv=[0,1,2].map(()=>(toLoad+exp)/3);
  return{load,inv,grid:load.map((l,q)=>l-inv[q]),outage:false};
}
function acReadout(I){
  const box=document.getElementById('acph3');if(!box)return;
  const p3=acPh3();box.hidden=!p3;AC_READ=null;
  if(!p3)return;
  const B=window.lastBal,body=document.getElementById('acph3body');
  const rh=document.getElementById('acrh'),rv=document.getElementById('acrhv');
  if(rh&&document.activeElement!==rh)rh.value=ACS.rh;
  if(rv)rv.textContent=hhmm(ACS.rh);
  if(!B){body.innerHTML='<p class="hint">ยังคำนวณไม่ได้ ใส่โหลดที่แท็บ "จำลองโหลด" และเลือกแหล่งไฟที่แท็บ "จำลอง Backup" ก่อน</p>';return}
  if(B.mode==='off'){body.innerHTML='<p class="hint">แท็บ "จำลอง Backup" ตั้งเป็น Off-grid ไม่มีกริด มิเตอร์จึงไม่มีค่า เปลี่ยนเป็น On-grid หรือ Hybrid เพื่อดูกำลังแต่ละเฟส</p>';return}
  const i=Math.max(0,Math.min(B.R.pv.length-1,Math.floor(ACS.rh*60/B.step)));
  const X=phaseAt(B,I,i);
  AC_READ={h:ACS.rh,grid:X.grid};
  const kw=v=>f(v/1000,2),sg=v=>Math.abs(v)<5?'<span class="z">0.00</span>':v>0?`<span class="imp">ซื้อ ${kw(v)}</span>`:`<span class="exp">ขาย ${kw(-v)}</span>`;
  const sum=a=>a.reduce((x,y)=>x+y,0);
  let rows=[0,1,2].map(q=>`<tr><th>L${q+1}</th><td>${kw(X.load[q])}</td><td>${kw(X.inv[q])}</td><td>${X.outage?'ไฟดับ':sg(X.grid[q])}</td></tr>`).join('');
  rows+=`<tr class="tot"><th>รวม</th><td>${kw(sum(X.load))}</td><td>${kw(sum(X.inv))}</td><td>${X.outage?'ไฟดับ':sg(sum(X.grid))}</td></tr>`;
  /* daily totals */
  const n=B.R.pv.length,dt=B.step/60/1000,imp=[0,0,0],exp=[0,0,0];let nImp=0,nExp=0,mix=0;
  for(let k=0;k<n;k++){
    const Y=phaseAt(B,I,k);if(Y.outage)continue;
    Y.grid.forEach((g,q)=>{if(g>0)imp[q]+=g*dt;else exp[q]-=g*dt});
    const t=sum(Y.grid);if(t>0)nImp+=t*dt;else nExp-=t*dt;
    if(Y.grid.some(g=>g>20)&&Y.grid.some(g=>g<-20))mix+=B.step/60;
  }
  const day=[0,1,2].map(q=>`<tr><th>L${q+1}</th><td>${f(imp[q],2)}</td><td>${f(exp[q],2)}</td></tr>`).join('')
    +`<tr class="tot"><th>นับแยกรายเฟส</th><td>${f(sum(imp),2)}</td><td>${f(sum(exp),2)}</td></tr>`
    +`<tr class="tot"><th>นับสุทธิรวม 3 เฟส</th><td>${f(nImp,2)}</td><td>${f(nExp,2)}</td></tr>`;
  const notes=[];
  if(!X.outage&&X.grid.some(g=>g>20)&&X.grid.some(g=>g<-20))notes.push(`เวลา ${hhmm(ACS.rh)} มีเฟสที่ซื้อไฟและเฟสที่ขายไฟพร้อมกัน`+(AC_MODE==='1x3'?' เพราะอินเวอร์เตอร์ 1 เฟสจ่ายไฟเข้าเฟสเดียว':String(I.asym)==='1'?'':' เพราะรุ่นนี้จ่ายเท่ากันทุกเฟส ขณะโหลดแต่ละเฟสไม่เท่ากัน'));
  if(mix>0)notes.push(`ทั้งวันมีช่วงที่ซื้อและขายพร้อมกันคนละเฟสรวม ${f(mix,1)} ชม. ผลต่างระหว่าง "นับแยกรายเฟส" กับ "นับสุทธิ" ${f(sum(imp)-nImp,2)} kWh คือไฟที่ถูกนับว่าซื้อ ทั้งที่อีกเฟสกำลังขายอยู่ ค่าไฟจริงขึ้นกับว่ามิเตอร์ของการไฟฟ้านับแบบไหน`);
  if(AC_MODE==='1x3')notes.push(`อินเวอร์เตอร์ 1 เฟสต่อที่เฟส L${(ACS.invPh||0)+1} ไฟจากแผงช่วยได้เฉพาะโหลดเฟสนี้ เฟสอื่นยังซื้อไฟจากกริด ย้ายโหลดกลางวันมาไว้เฟสนี้ หรือย้ายสาย GRID ไปเฟสที่โหลดมากที่สุด`);
  else if(String(I.asym)==='1')notes.push('รุ่นนี้จ่ายไฟแต่ละเฟสตามโหลดได้ (สูงสุดเฟสละ '+f(I.pac/3000,2)+' kW) จึงลดการซื้อไฟเฟสที่โหลดหนักได้');
  if(X.outage)notes.push(AC_MODE==='3b1'?'ช่วงไฟดับ: พอร์ต BACKUP 1 เฟสจ่ายเฉพาะโหลดในตู้โหลดสำรอง':'ช่วงไฟดับ: อินเวอร์เตอร์จ่ายโหลดเองทั้ง 3 เฟส มิเตอร์กริดเป็นศูนย์');
  body.innerHTML=`<div class="ph3grid"><div><h3>ขณะนี้ (kW)</h3><table class="t ph3t"><thead><tr><th>เฟส</th><th>โหลด</th><th>อินเวอร์เตอร์จ่าย</th><th>กริด</th></tr></thead><tbody>${rows}</tbody></table></div>
    <div><h3>ทั้งวัน (kWh)</h3><table class="t ph3t"><thead><tr><th>เฟส</th><th>ซื้อจากกริด</th><th>ขายคืนกริด</th></tr></thead><tbody>${day}</tbody></table></div></div>`
    +(notes.length?`<ul class="checks">${notes.map(t=>`<li><span class="b warn">!</span><span>${esc(t)}</span></li>`).join('')}</ul>`:'');
}
/* config handed to the backup energy balance */
function acsCfg(){
  if(!ACS.apply)return null;
  const a=acAnalyze(),S=ACS.set,I=curInv(),c={reserve:S.reserve,gmode:S.mode,notes:[]};
  if(I.type!=='on-grid'){
    c.noBackup=!(a.d.backupOk&&S.backupEn);
    if(c.noBackup)c.notes.push(['err','ใช้ผลการต่อสาย AC: พอร์ต BACKUP ยังไม่พร้อม ตอนไฟดับโหลดทั้งหมดจึงไม่มีไฟ'])
  }
  if(S.expLimOn){
    if(a.d.meterOk&&!a.d.ctRev)c.expLimW=S.expLimW;
    else c.notes.push(['err',`ใช้ผลการต่อสาย AC: ตั้ง Export limit ${S.expLimW} W แต่ CT/มิเตอร์ใช้งานไม่ได้ ระบบจึงจำกัดการขายไฟไม่ได้`]);
  }
  if(S.mode==='feedin')c.notes.push(['warn','โหมด Feed-in priority: แบตไม่ชาร์จหรือจ่ายตอนมีกริด ใช้แบตเฉพาะตอนไฟดับ']);
  return c;
}

/* drawing */
function acRender(){
  const svg=document.getElementById('acsvg');if(!svg)return;
  const I=curInv(),A=acAnalyze();
  acLayout();if(typeof acReadout==='function')acReadout(I);svg.setAttribute('viewBox',`0 0 ${AC_VB.w} ${AC_VB.h}`);acApplyZoom();
  let s='';
  Object.keys(AC_CL).forEach(k=>{s+=`<g class="acmod" data-c="${k}">${acArt(k,AC_CL[k],I,ACS.set)}</g>`});
  /* CT clamp symbol drawn on the position choice */
  const S=ACS.set;
  if(AC_CL.CT)s+=`<text x="${AC_CL.CT.x+75*AC_CL.CT.s}" y="${AC_CL.CT.y+108*AC_CL.CT.s}" class="acnote" text-anchor="middle">คล้องที่: ${({gridL:'สาย L จุดต่อกริด',loadL:'สาย L โหลดบ้าน',invL:'สาย L อินเวอร์เตอร์',N:'สาย N'})[S.ctPos]}</text><text x="${AC_CL.CT.x+75}" y="${AC_CL.CT.y+125*AC_CL.CT.s}" class="acnote" text-anchor="middle">ลูกศรชี้ ${S.ctDir==='toGrid'?'ไปทางกริด':'ไปทางบ้าน/อินเวอร์เตอร์'}</text>`;
  /* wires */
  const side=a=>a==='l'?[-1,0]:a==='r'?[1,0]:[0,1];
  const path=(t1,t2)=>{
    const d1=side(t1.side),d2=side(t2.side),dist=Math.hypot(t2.x-t1.x,t2.y-t1.y),k=Math.max(40,dist*.38);
    return `M${t1.x} ${t1.y}C${t1.x+d1[0]*k} ${t1.y+d1[1]*k} ${t2.x+d2[0]*k} ${t2.y+d2[1]*k} ${t2.x} ${t2.y}`;
  };
  const errW=new Set();
  ACS.wires.forEach((w,i)=>{
    const a=AC_TM[w.a],b=AC_TM[w.b];if(!a||!b)return;
    const bad=!acKindOk(a.kind,b.kind);
    const col=KIND_COL[a.kind]||'#888',d=path(a,b);
    s+=`<path d="${d}" class="acw-hit" data-w="${i}"/><path d="${d}" class="acw${bad?' bad':''}" style="stroke:${col}" data-w="${i}"/>`;
    if(a.kind==='PE')s+=`<path d="${d}" class="acw pe"/>`;
  });
  /* terminals */
  AC_T.forEach(t=>{
    const T=AC_TM[t[0]],on=anyOn(T.id),av=acAvail(T),arm=ACS.armed===T.id;
    const lx=T.side==='l'?T.x+9:T.side==='r'?T.x-9:T.x,ly=T.side==='b'?T.y-9:T.y+4,an=T.side==='l'?'start':T.side==='r'?'end':'middle';
    s+=`<g class="act${av?'':' off'}" data-t="${T.id}"><circle cx="${T.x}" cy="${T.y}" r="16" class="achit"/><circle cx="${T.x}" cy="${T.y}" r="6.5" class="acterm${on?' on':''}${arm?' arm':''}" style="stroke:${KIND_COL[T.kind]}"/><text x="${lx}" y="${ly}" class="aclab" text-anchor="${an}">${esc(T.lab)}</text></g>`;
  });
  if(ACS.selMod&&AC_CL[ACS.selMod]){const c=AC_CL[ACS.selMod];s=s.replace(`<g class="acmod" data-c="${ACS.selMod}">`,`<g class="acmod sel" data-c="${ACS.selMod}"><rect class="acselbox" x="${c.x-5}" y="${c.y-5}" width="${c.w*c.s+10}" height="${c.h*c.s+10}" rx="12"/>`)}
  svg.innerHTML=s;
  {const k=ACS.selMod,b=document.getElementById('acmods');if(b){b.hidden=!k||!AC_C[k];if(k&&AC_C[k]){document.getElementById('acmodn').textContent=AC_MNAME[k]||k;const r=document.getElementById('acmsr');if(document.activeElement!==r)r.value=Math.round(acSc(k)*100);document.getElementById('acmodv').textContent=Math.round(acSc(k)*100)+'%'}}}
  const v=document.getElementById('acverdict');
  const txt=A.nE?`พบข้อผิดพลาด ${A.nE} จุด`:A.nW?`ใช้งานได้ แต่มี ${A.nW} ข้อควรระวัง`:A.ck.length?'ต่อสายและตั้งค่าถูกต้องตามที่ตรวจได้':'ยังไม่ได้ต่อสาย';
  v.className='verdict '+(A.ck.length?A.lvl:'');v.innerHTML=`<span class="pill ${A.ck.length?A.lvl:'idle'}">${A.ck.length?LABEL[A.lvl]:'ยังไม่เริ่ม'}</span><b>${esc(txt)}</b>`;
  document.getElementById('acchecks').innerHTML=A.ck.map(c=>`<li><span class="b ${c[0]}">${c[0]==='ok'?'✓':c[0]==='err'?'×':'!'}</span><span>${esc(c[1])}</span></li>`).join('');
  acSyncUI(I);
  window.lastAC={lvl:ACS.wires.length&&A.ck.length?A.lvl:'idle',nE:A.nE,nW:A.nW,txt};
}
function acSyncUI(I){
  const S=ACS.set,q=id=>document.getElementById(id);
  q('acapply').checked=ACS.apply;
  const map={acmode:'mode',acres:'reserve',acstd:'gridStd',acmt:'meterType',acctp:'ctPos',acctd:'ctDir',acmad:'mAddr',acmbd:'mBaud',aciad:'iAddr',acibd:'iBaud',acbt:'batType',acbc:'batComm',acgen:'genMode',accg:'cbGrid',accb:'cbBackup',acel:'expLimW'};
  Object.keys(map).forEach(id=>{const el=q(id);if(el&&document.activeElement!==el)el.value=S[map[id]]});
  q('acelon').checked=S.expLimOn;q('acbken').checked=S.backupEn;
  q('acelw').hidden=!S.expLimOn;
  const p3=acPh3();
  q('acmeterbox').hidden=S.meterType!=='meter';q('acctbox').hidden=S.meterType!=='ct'||p3||AC_HW;
  {const o=q('acmt').querySelector('option[value="ct"]');if(o)o.textContent=p3?'CT (ใช้ไม่ได้กับ 3 เฟส)':AC_HW?'CT (Huawei ไม่มีขั้ว CT)':'CT';const m=q('acmt').querySelector('option[value="meter"]');if(m)m.textContent=p3?'สมาร์ทมิเตอร์ 3 เฟส RS485':'สมาร์ทมิเตอร์ RS485'}
  document.querySelectorAll('#acpre [data-acp="ct"]').forEach(b=>b.hidden=p3||AC_HW);
  ['acbt','acbc'].forEach(id=>{const e=q(id);if(e&&e.closest('label'))e.closest('label').hidden=AC_HW});
  {const b=document.querySelector('#acpre [data-acp="meter"]');if(b)b.textContent=p3?'3 เฟส ต่อถูก (สมาร์ทมิเตอร์ 3 เฟส)':'Hybrid ต่อถูก (ใช้สมาร์ทมิเตอร์)'}
  const k3=q('ackey3');if(k3)k3.hidden=!p3;
  const hwn=AC_HW?' · ขั้วตามรุ่น Huawei: แบตต่อ COM เป็น EN/GND และ 485A2/485B2 มิเตอร์ต่อ 485A1/485B1':'';
  {const sp=q('acsup');if(sp){sp.value=isPh3(I)?'3':S.supply;sp.disabled=isPh3(I)}}
  q('acinvnote').textContent=(AC_MODE==='1x3'?`ไฟเข้าบ้าน 3 เฟส กับอินเวอร์เตอร์ 1 เฟส (${I.type==='on-grid'?'On-grid':'Hybrid'}): ต่อพอร์ต GRID L เข้าเฟสใดเฟสหนึ่ง (L1, L2 หรือ L3) กับ N ของตู้เมน วัดกริดด้วยสมาร์ทมิเตอร์ 3 เฟส`:p3?(I.type==='on-grid'?'รุ่นนี้เป็น On-grid 3 เฟส: มีพอร์ต GRID L1 L2 L3 N PE และ RS485 สำหรับสมาร์ทมิเตอร์ 3 เฟส ไม่มี BACKUP / แบตเตอรี่':`รุ่นนี้เป็น Hybrid 3 เฟส: GRID L1 L2 L3 N PE, BACKUP ${AC_MODE==='3'?'3 เฟส (ทั้งบ้าน)':'1 เฟส (ผ่าน Backup Box)'}, สมาร์ทมิเตอร์ 3 เฟส และแบตเตอรี่ ไม่มีพอร์ต GEN`)+(String(I.asym)==='1'?' · จ่ายไฟแต่ละเฟสตามโหลดได้ (asymmetric)':' · จ่ายไฟเท่ากันทุกเฟส'):I.type==='on-grid'?'รุ่นนี้เป็น On-grid: มีพอร์ต GRID, RS485 และ CT เท่านั้น ไม่มี BACKUP / GEN / แบตเตอรี่':I.type==='off-grid'?'รุ่นนี้เป็น Off-grid: ไม่มีพอร์ต GRID แบบขนานกริด ใช้ GEN เป็นทางเข้า AC และจ่ายโหลดที่ BACKUP':'รุ่นนี้เป็น Hybrid: มีครบทั้ง GRID, BACKUP, GEN, CT/มิเตอร์ และแบตเตอรี่')+hwn;
}
function acBatSig(W){if(AC_HW){W('BAT.EP','INV.EP');W('BAT.EN','INV.EG');W('BAT.RA','INV.BA');W('BAT.RB','INV.BB')}else{W('BAT.H','INV.CH');W('BAT.L','INV.CL')}}
function acPreset(name){
  acEnsureMode();
  const want3=AC_MODE==='3'||AC_MODE==='3b1';
  ACS.wires=[];ACS.armed=null;
  if(name!=='clear'&&curInv().type!=='hybrid'){const h=CAT.inverters.find(x=>x.type==='hybrid'&&isPh3(x)===want3);if(h){ACT.inv=h.id;autoBat();applyActive();if(typeof quickSel==='function')quickSel();lastSig='';if(typeof render==='function')render();acEnsureMode();ACS.wires=[]}}
  const W=(a,b)=>ACS.wires.push({a,b});
  const S=ACS.set;
  if(name==='clear'){acRender();touch();return}
  if(AC_MODE==='1x3'){
    PH3.forEach(p=>{W('G.L'+p,'M.LI'+p);W('M.LO'+p,'DB.L'+p+'L')});
    W('G.N','M.N');W('G.N','DB.NL');W('G.PE','DB.PL');W('M.A','INV.RA');W('M.B','INV.RB');
    S.meterType='meter';S.mAddr=S.iAddr=1;S.mBaud=S.iBaud=9600;if(AC_HW)S.genMode='off';
    W('DB.L1R','INV.GL');W('DB.NR','INV.GN');W('DB.PR','INV.GP');W('DB.PR','INV.PF');
    W('INV.BL','CDB.L');W('INV.BN','CDB.N');W('INV.BP','CDB.PE');
    W('BAT.+','INV.B+');W('BAT.-','INV.B-');acBatSig(W);
    if(name==='bad'){
      const rm=new Set(['INV.BL','M.A','M.B','BAT.+','BAT.-']);
      ACS.wires=ACS.wires.filter(w=>!rm.has(w.a)&&!rm.has(w.b));
      W('INV.BL','DB.L2R');W('DB.L2R','INV.GL');W('M.A','INV.RB');W('M.B','INV.RA');W('BAT.+','INV.B-');W('BAT.-','INV.B+');S.expLimOn=true;S.expLimW=0;
    }
    acRender();touch();return;
  }
  if(acPh3()){
    const b3=AC_MODE==='3';
    PH3.forEach(p=>{W('G.L'+p,'M.LI'+p);W('M.LO'+p,'DB.L'+p+'L');W('DB.L'+p+'R','INV.GL'+p);if(b3)W('INV.BL'+p,'CDB.L'+p)});
    W('G.N','M.N');W('G.N','DB.NL');W('G.PE','DB.PL');W('M.A','INV.RA');W('M.B','INV.RB');
    S.meterType='meter';S.mAddr=S.iAddr=1;S.mBaud=S.iBaud=9600;S.genMode='off';
    W('DB.NR','INV.GN');W('DB.PR','INV.GP');W('DB.PR','INV.PF');
    if(!b3)W('INV.BL','CDB.L');W('INV.BN','CDB.N');W('INV.BP','CDB.PE');
    W('BAT.+','INV.B+');W('BAT.-','INV.B-');acBatSig(W);
    if(name==='bad'){
      const rm=new Set(['INV.GL2','INV.GL3','M.A','M.B','BAT.+','BAT.-',b3?'INV.BL1':'INV.BL']);
      ACS.wires=ACS.wires.filter(w=>!rm.has(w.a)&&!rm.has(w.b));
      W('DB.L2R','INV.GL3');W('DB.L3R','INV.GL2');W('M.A','INV.RB');W('M.B','INV.RA');W('BAT.+','INV.B-');W('BAT.-','INV.B+');
      W(b3?'INV.BL1':'INV.BL','DB.L1R');S.expLimOn=true;S.expLimW=0;
      ACS.wires=ACS.wires.filter((w,i,a)=>a.findIndex(x=>acKey(x.a,x.b)===acKey(w.a,w.b))===i);
    }
    acRender();touch();return;
  }
  if(AC_HW&&name==='ct')name='meter';
  if(name==='ct'||name==='meter'||name==='bad'){
    if(name==='meter'||AC_HW){W('G.L','M.LI');W('M.LO','DB.LL');W('G.N','M.N');W('G.N','DB.NL');W('M.A','INV.RA');W('M.B','INV.RB');S.meterType='meter';S.mAddr=S.iAddr=1;S.mBaud=S.iBaud=9600;if(AC_HW)S.genMode='off'}
    else{W('G.L','DB.LL');W('G.N','DB.NL');S.meterType='ct';S.ctPos='gridL';S.ctDir='toGrid';W('CT.S1','INV.C1');W('CT.S2','INV.C2')}
    W('G.PE','DB.PL');
    W('DB.LR','INV.GL');W('DB.NR','INV.GN');W('DB.PR','INV.GP');W('DB.PR','INV.PF');
    W('INV.BL','CDB.L');W('INV.BN','CDB.N');W('INV.BP','CDB.PE');
    W('BAT.+','INV.B+');W('BAT.-','INV.B-');acBatSig(W);
    if(name==='bad'&&AC_HW){
      ACS.wires=ACS.wires.filter(w=>!['INV.BL','BAT.+','BAT.-','BAT.EP','BAT.EN','BAT.RA'].includes(w.a));
      W('INV.BL','DB.LR');W('BAT.+','INV.B-');W('BAT.-','INV.B+');W('BAT.EP','INV.EG');W('BAT.EN','INV.EP');W('BAT.RA','INV.RA');S.expLimOn=true;S.expLimW=0;
    }else if(name==='bad'){
      ACS.wires=ACS.wires.filter(w=>!(w.a==='INV.BL'||w.a==='BAT.+'||w.a==='BAT.-'||w.a==='CT.S1'));
      W('INV.BL','DB.LR');W('BAT.+','INV.B-');W('BAT.-','INV.B+');W('CT.S1','INV.C1');S.ctDir='toLoad';S.expLimOn=true;S.expLimW=0;
    }
  }
  acRender();touch();
}
function acPoint(svg,e){const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse())}
function acAdd(a,b){
  acEnsureMode();
  if(a===b)return;
  if(!AC_TM[a]||!AC_TM[b]||!acAvail(AC_TM[a])||!acAvail(AC_TM[b]))return;
  if(hasWire(a,b))return;
  ACS.wires.push({a,b});ACS.armed=null;acRender();touch();
}
function initAC(){
  const svg=document.getElementById('acsvg');
  let drag=null,tmp=null;
  let mv=null;
  svg.addEventListener('pointerdown',e=>{
    const t=e.target.closest('[data-t]');
    if(!t){
      const m=e.target.closest('[data-c]');
      if(m&&!e.target.closest('[data-w]')){
        e.preventDefault();const p=acPoint(svg,e),o=ACS.pos[m.dataset.c]||[0,0];
        mv={k:m.dataset.c,sx:p.x,sy:p.y,ox:o[0],oy:o[1],moved:false};
        try{svg.setPointerCapture(e.pointerId)}catch(_){}
        return;
      }
    }
    if(t&&!t.classList.contains('off')){
      e.preventDefault();
      drag={id:t.dataset.t,moved:false};tmp=document.createElementNS('http://www.w3.org/2000/svg','path');tmp.setAttribute('class','acw tmp');svg.appendChild(tmp);
      try{svg.setPointerCapture(e.pointerId)}catch(_){}
    }
  });
  let raf=0;
  svg.addEventListener('pointermove',e=>{
    if(mv){
      const p=acPoint(svg,e);
      if(!mv.moved&&Math.hypot(p.x-mv.sx,p.y-mv.sy)<6)return;
      mv.moved=true;acMove(mv.k,mv.ox+p.x-mv.sx,mv.oy+p.y-mv.sy);
      if(!raf)raf=requestAnimationFrame(()=>{raf=0;acRender()});
      return;
    }
    if(!drag)return;
    const p=acPoint(svg,e),a=AC_TM[drag.id];
    if(Math.hypot(p.x-a.x,p.y-a.y)>8)drag.moved=true;
    if(drag.moved)tmp.setAttribute('d',`M${a.x} ${a.y}L${p.x} ${p.y}`);
  });
  const end=e=>{
    if(mv){const m=mv;mv=null;if(m.moved){acRender();touch()}else{ACS.selMod=ACS.selMod===m.k?null:m.k;acRender()}return}
    if(!drag)return;
    const d=drag;drag=null;if(tmp){tmp.remove();tmp=null}
    if(d.moved){
      const el=document.elementFromPoint(e.clientX,e.clientY),t=el&&el.closest&&el.closest('[data-t]');
      if(t)acAdd(d.id,t.dataset.t);
    }else{
      if(ACS.armed&&ACS.armed!==d.id)acAdd(ACS.armed,d.id);
      else{ACS.armed=ACS.armed===d.id?null:d.id;acRender()}
    }
  };
  svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',()=>{mv=null;drag=null;if(tmp){tmp.remove();tmp=null}});
  svg.addEventListener('click',e=>{const w=e.target.closest('[data-w]');if(w){ACS.wires.splice(+w.dataset.w,1);acRender();touch()}});
  document.getElementById('acpre').addEventListener('click',e=>{const b=e.target.closest('[data-acp]');if(b)acPreset(b.dataset.acp)});
  const S=ACS.set,q=id=>document.getElementById(id);
  const bindSel=(id,key,num)=>q(id).addEventListener('change',e=>{S[key]=num?+e.target.value:e.target.value;acRender();rerunBk();touch()});
  const bindNum=(id,key,lo,hi)=>q(id).addEventListener('input',e=>{const n=parseFloat(e.target.value);if(isNaN(n))return;S[key]=Math.max(lo,Math.min(hi,n));acRender();rerunBk();touch()});
  {const sp=q('acsup');if(sp)sp.addEventListener('change',e=>{if(!['1','3'].includes(e.target.value))return;S.supply=e.target.value;acRender();if(typeof loadView==='function')loadView();rerunBk();touch()})}
  bindSel('acmode','mode');bindSel('acstd','gridStd');bindSel('acmt','meterType');bindSel('acctp','ctPos');bindSel('acctd','ctDir');
  bindSel('acbt','batType');bindSel('acbc','batComm');bindSel('acgen','genMode');bindSel('accg','cbGrid',true);bindSel('accb','cbBackup',true);
  bindNum('acres','reserve',0,100);bindNum('acmad','mAddr',1,247);bindNum('aciad','iAddr',1,247);bindNum('acel','expLimW',0,20000);
  bindSel('acmbd','mBaud',true);bindSel('acibd','iBaud',true);
  q('acelon').addEventListener('change',e=>{S.expLimOn=e.target.checked;acRender();rerunBk();touch()});
  q('acbken').addEventListener('change',e=>{S.backupEn=e.target.checked;acRender();rerunBk();touch()});
  q('acapply').addEventListener('change',e=>{ACS.apply=e.target.checked;acRender();rerunBk();touch()});
  const zr=q('aczoom');
  zr.addEventListener('input',e=>acSetZoom(+e.target.value/100));
  q('aczin').addEventListener('click',()=>{acSetZoom(ACS.zoom+.1);touch()});q('aczout').addEventListener('click',()=>{acSetZoom(ACS.zoom-.1);touch()});
  zr.addEventListener('change',()=>touch());
  q('aclayreset').addEventListener('click',()=>{ACS.pos={};ACS.msc={};ACS.zoom=1;acRender();touch()});
  {const r=q('acmsr'),st=d=>{const k=ACS.selMod;if(!k)return;acSetModScale(k,acSc(k)+d);acRender();touch()};
   if(r){r.addEventListener('input',e=>{const k=ACS.selMod;if(!k)return;acSetModScale(k,+e.target.value/100);acRender()});r.addEventListener('change',()=>touch())}
   q('acmsm').addEventListener('click',()=>st(-.1));q('acmsp').addEventListener('click',()=>st(.1));
   q('acms1').addEventListener('click',()=>{const k=ACS.selMod;if(k){delete ACS.msc[k];acRender();touch()}});
   q('acmsx').addEventListener('click',()=>{ACS.selMod=null;acRender()})}
  const rh=q('acrh');if(rh){rh.addEventListener('input',e=>{ACS.rh=+e.target.value;acRender()});rh.addEventListener('change',()=>touch())}
  acRender();
}
function rerunBk(){if(typeof backupRun==='function')backupRun();if(typeof evRun==='function')evRun()}
