/* ---- AC / system wiring: real inverter ports (GRID, BACKUP, GEN, CT, smart meter, BAT) ---- */
const ACS={apply:false,wires:[],armed:null,pos:{},zoom:1,
  set:{mode:'selfuse',reserve:20,expLimOn:false,expLimW:0,gridStd:'PEA',backupEn:true,meterType:'ct',ctPos:'gridL',ctDir:'toGrid',
    mAddr:1,mBaud:9600,iAddr:1,iBaud:9600,batType:'li',batComm:'can',genMode:'off',cbGrid:32,cbBackup:32}};
const AC_C={
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
const AC_T=[
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
const AC_BUS=[['DB.LL','DB.LR'],['DB.NL','DB.NR'],['DB.PL','DB.PR']];
const AC_TM={};AC_T.forEach(t=>AC_TM[t[0]]={id:t[0],lab:t[1],kind:t[2],bx:t[3],by:t[4],x:t[3],y:t[4],side:t[5],comp:t[6],av:t[7]||''});
/* live layout: each module can be moved (ACS.pos[comp]=[dx,dy]); terminals follow their module */
const AC_CL={},AC_VB={w:1200,h:690},AC_GRID=10;
function acLayout(){
  let mx=1200,my=690;
  Object.keys(AC_C).forEach(k=>{const c=AC_C[k],o=ACS.pos[k]||[0,0];AC_CL[k]={...c,x:c.x+o[0],y:c.y+o[1]};mx=Math.max(mx,c.x+o[0]+c.w+190);my=Math.max(my,c.y+o[1]+c.h+30)});
  Object.keys(AC_TM).forEach(id=>{const T=AC_TM[id],o=ACS.pos[T.comp]||[0,0];T.x=T.bx+o[0];T.y=T.by+o[1]});
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
const KIND_NAME={L:'L (ไลน์)',N:'N',PE:'PE','dc+':'DC +','dc-':'DC −',ct1:'CT 1',ct2:'CT 2',a:'RS485 A',b:'RS485 B',canh:'CAN H',canl:'CAN L',dry1:'Dry contact 1',dry2:'Dry contact 2'};
const KIND_COL={L:'#8b5a2b',N:'#2a78d6',PE:'#1baf7a','dc+':'#d62828','dc-':'#14191e',ct1:'#e0762c',ct2:'#9a9aa3',a:'#d9a400',b:'#8a63d2',canh:'#d9a400',canl:'#8a63d2',dry1:'#e0762c',dry2:'#9a9aa3'};
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

function acAnalyze(){
  const I=curInv(),ty=I.type,S=ACS.set,N=acNets(),ck=[],d={};
  const add=(lvl,msg)=>ck.push([lvl,msg]);
  /* wire level */
  ACS.wires.forEach(w=>{
    const A=AC_TM[w.a],B=AC_TM[w.b];if(!A||!B)return;
    if(!acAvail(A)||!acAvail(B))add('err',`สาย ${A.comp==='INV'?'INV '+A.lab:A.comp+' '+A.lab} ↔ ${B.comp==='INV'?'INV '+B.lab:B.comp+' '+B.lab}: อินเวอร์เตอร์ประเภท ${ty} ไม่มีพอร์ตนี้`);
    else if(A.kind!==B.kind){
      const swap=(A.kind==='a'&&B.kind==='b')||(A.kind==='b'&&B.kind==='a')||(A.kind==='ct1'&&B.kind==='ct2')||(A.kind==='ct2'&&B.kind==='ct1')||(A.kind==='canh'&&B.kind==='canl')||(A.kind==='canl'&&B.kind==='canh')||(A.kind==='dc+'&&B.kind==='dc-')||(A.kind==='dc-'&&B.kind==='dc+');
      if(!swap)add('err',`สาย ${A.comp} ${A.lab} ↔ ${B.comp} ${B.lab}: ต่อคนละชนิดขั้ว (${KIND_NAME[A.kind]} กับ ${KIND_NAME[B.kind]})`);
    }
  });
  /* short circuits inside a net */
  const seen=new Set();
  AC_T.forEach(t=>{
    const r=N.root(t[0]);if(seen.has(r))return;seen.add(r);
    const mem=N.members(r);if(mem.length<2)return;
    const kinds=new Set(mem.map(m=>AC_TM[m].kind));
    if(kinds.has('L')&&kinds.has('N'))add('err','ไฟ L ชอตกับ N: สาย L และ N ถูกต่อถึงกัน ('+mem.filter(m=>['L','N'].includes(AC_TM[m].kind)).join(', ')+')');
    if(kinds.has('L')&&kinds.has('PE'))add('err','ไฟ L ต่อลงดิน PE: จะทำให้เบรกเกอร์หรือ RCD ตัด');
    if(kinds.has('dc+')&&kinds.has('dc-'))add('err','ชอต DC + กับ − ที่แบตเตอรี่ อันตรายมาก');
    const src=['G.L','INV.BL','GEN.L'].filter(s=>mem.includes(s));
    if(src.length>1)add('err',`แหล่งไฟ ${src.map(s=>({ 'G.L':'กริด','INV.BL':'ขา BACKUP ของอินเวอร์เตอร์','GEN.L':'เครื่องปั่นไฟ'}[s])).join(' กับ ')} ถูกต่อรวมกัน ต้องมีสวิตช์สลับ (ATS/interlock) ห้ามต่อสายตรง`);
  });
  const hyb=ty!=='on-grid',gridPort=ty!=='off-grid';
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
    if(d.batOk&&bi&&I.bvMax&&(bi.V<I.bvMin||bi.V>I.bvMax))add('err',`แรงดันชุดแบต ${f(bi.V,1)} V อยู่นอกช่วง ${I.bvMin}–${I.bvMax} V ของอินเวอร์เตอร์`);
    const cn=(hasWire('BAT.H','INV.CH')&&hasWire('BAT.L','INV.CL')),cs=(hasWire('BAT.H','INV.CL')&&hasWire('BAT.L','INV.CH'));
    d.canOk=cn;
    if(S.batType==='li'&&S.batComm!=='none'){
      if(cn)add('ok','สื่อสาร BMS CAN ต่อถูกต้อง');
      else if(cs)add('err','สาย CAN H/L สลับกัน อินเวอร์เตอร์จะไม่เห็นแบต');
      else if(d.batOk)add('warn','แบตลิเธียมแต่ยังไม่ได้ต่อสาย BMS CAN อินเวอร์เตอร์อาจไม่ยอมชาร์จ หรือแสดง BMS fault');
    }
    if(S.batType==='lead'&&(cn||cs))add('warn','แบตตะกั่วกรดไม่มี BMS สาย CAN ไม่จำเป็น');
  }
  /* meter / CT */
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
    if(!viaM){add('err','เลือกใช้สมาร์ทมิเตอร์ แต่ยังไม่ได้ต่ออนุกรมระหว่างกริดกับตู้เมน (L เข้า ← กริด, L ออก → ตู้เมน)');bad=true}
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
  /* settings consistency */
  if(S.expLimOn&&!d.meterOk)add('err','เปิด Export limit แต่ไม่มี CT หรือมิเตอร์ที่ใช้งานได้ ระบบจำกัดการขายไฟไม่ได้ ไฟอาจไหลออกกริดเกินที่กำหนด');
  if(S.expLimOn&&d.meterOk&&mt==='ct'&&d.ctRev)add('err','Export limit ทำงานผิดทิศ');
  if(!hyb&&S.batType&&false){}
  if(S.mode==='backup'&&!d.batOk&&hyb)add('warn','โหมด Backup reserve ต้องมีแบต');
  if(S.genMode!=='off'&&!d.genOk&&hyb)add('warn','เปิดใช้เครื่องปั่นไฟในตั้งค่า แต่ยังไม่ได้ต่อพอร์ต GEN');
  if(S.backupEn&&!d.backupOk&&hyb&&anyOn('INV.BL'))add('warn','เปิดใช้ Backup แต่การต่อพอร์ต BACKUP ยังไม่ถูก');
  if(!S.backupEn&&d.backupOk)add('warn','ต่อ BACKUP ครบแล้ว แต่ตั้งค่าปิด Backup ตอนไฟดับจะไม่จ่ายไฟ');
  /* breakers */
  const iRated=I.pac/230,min=iRated*1.2;
  const cb=(v,nm)=>{if(v<min)add('warn',`เบรกเกอร์ ${nm} ${v} A เล็กกว่าที่ควรใช้ (กระแสพิกัด ${f(iRated,0)} A × 1.2 ≈ ${f(min,0)} A) อาจตัดเมื่อโหลดเต็ม`);else if(v>min*2.2)add('warn',`เบรกเกอร์ ${nm} ${v} A ใหญ่เกินไป ใหญ่กว่าสายและอุปกรณ์ที่ป้องกันได้ ควรเลือกใกล้ ${f(min,0)} A`)};
  if(gridPort&&d.gridPort)cb(S.cbGrid,'GRID');
  if(hyb&&d.backupOk)cb(S.cbBackup,'BACKUP');
  /* errors summary */
  {const u=new Set();for(let i=ck.length-1;i>=0;i--){const k=ck[i][0]+ck[i][1];if(u.has(k))ck.splice(i,1);else u.add(k)}}
  const nE=ck.filter(c=>c[0]==='err').length,nW=ck.filter(c=>c[0]==='warn').length;
  const lvl=nE?'err':nW?'warn':ck.some(c=>c[0]==='ok')?'ok':'warn';
  return{ck,d,nE,nW,lvl};
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
  acLayout();svg.setAttribute('viewBox',`0 0 ${AC_VB.w} ${AC_VB.h}`);acApplyZoom();
  let s='';
  Object.keys(AC_CL).forEach(k=>{s+=`<g class="acmod" data-c="${k}">${acArt(k,AC_CL[k],I,ACS.set)}</g>`});
  /* CT clamp symbol drawn on the position choice */
  const S=ACS.set;
  s+=`<text x="${AC_CL.CT.x+75}" y="${AC_CL.CT.y+108}" class="acnote" text-anchor="middle">คล้องที่: ${({gridL:'สาย L จุดต่อกริด',loadL:'สาย L โหลดบ้าน',invL:'สาย L อินเวอร์เตอร์',N:'สาย N'})[S.ctPos]}</text><text x="${AC_CL.CT.x+75}" y="${AC_CL.CT.y+125}" class="acnote" text-anchor="middle">ลูกศรชี้ ${S.ctDir==='toGrid'?'ไปทางกริด':'ไปทางบ้าน/อินเวอร์เตอร์'}</text>`;
  /* wires */
  const side=a=>a==='l'?[-1,0]:a==='r'?[1,0]:[0,1];
  const path=(t1,t2)=>{
    const d1=side(t1.side),d2=side(t2.side),dist=Math.hypot(t2.x-t1.x,t2.y-t1.y),k=Math.max(40,dist*.38);
    return `M${t1.x} ${t1.y}C${t1.x+d1[0]*k} ${t1.y+d1[1]*k} ${t2.x+d2[0]*k} ${t2.y+d2[1]*k} ${t2.x} ${t2.y}`;
  };
  const errW=new Set();
  ACS.wires.forEach((w,i)=>{
    const a=AC_TM[w.a],b=AC_TM[w.b];if(!a||!b)return;
    const bad=a.kind!==b.kind&&!((a.kind==='a'&&b.kind==='b')||(a.kind==='b'&&b.kind==='a')||(a.kind==='ct1'&&b.kind==='ct2')||(a.kind==='ct2'&&b.kind==='ct1')||(a.kind==='canh'&&b.kind==='canl')||(a.kind==='canl'&&b.kind==='canh')||(a.kind==='dc+'&&b.kind==='dc-')||(a.kind==='dc-'&&b.kind==='dc+'));
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
  svg.innerHTML=s;
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
  q('acmeterbox').hidden=S.meterType!=='meter';q('acctbox').hidden=S.meterType!=='ct';
  q('acinvnote').textContent=I.type==='on-grid'?'รุ่นนี้เป็น On-grid: มีพอร์ต GRID, RS485 และ CT เท่านั้น ไม่มี BACKUP / GEN / แบตเตอรี่':I.type==='off-grid'?'รุ่นนี้เป็น Off-grid: ไม่มีพอร์ต GRID แบบขนานกริด ใช้ GEN เป็นทางเข้า AC และจ่ายโหลดที่ BACKUP':'รุ่นนี้เป็น Hybrid: มีครบทั้ง GRID, BACKUP, GEN, CT/มิเตอร์ และแบตเตอรี่';
}
function acPreset(name){
  ACS.wires=[];ACS.armed=null;
  if(name!=='clear'&&curInv().type!=='hybrid'){const h=CAT.inverters.find(x=>x.type==='hybrid');if(h){ACT.inv=h.id;applyActive();if(typeof quickSel==='function')quickSel();lastSig='';if(typeof render==='function')render()}}
  const W=(a,b)=>ACS.wires.push({a,b});
  const S=ACS.set;
  if(name==='clear'){acRender();touch();return}
  if(name==='ct'||name==='meter'||name==='bad'){
    if(name==='meter'){W('G.L','M.LI');W('M.LO','DB.LL');W('G.N','M.N');W('G.N','DB.NL');W('M.A','INV.RA');W('M.B','INV.RB');S.meterType='meter';S.mAddr=S.iAddr=1;S.mBaud=S.iBaud=9600}
    else{W('G.L','DB.LL');W('G.N','DB.NL');S.meterType='ct';S.ctPos='gridL';S.ctDir='toGrid';W('CT.S1','INV.C1');W('CT.S2','INV.C2')}
    W('G.PE','DB.PL');
    W('DB.LR','INV.GL');W('DB.NR','INV.GN');W('DB.PR','INV.GP');W('DB.PR','INV.PF');
    W('INV.BL','CDB.L');W('INV.BN','CDB.N');W('INV.BP','CDB.PE');
    W('BAT.+','INV.B+');W('BAT.-','INV.B-');W('BAT.H','INV.CH');W('BAT.L','INV.CL');
    if(name==='bad'){
      ACS.wires=ACS.wires.filter(w=>!(w.a==='INV.BL'||w.a==='BAT.+'||w.a==='BAT.-'||w.a==='CT.S1'));
      W('INV.BL','DB.LR');W('BAT.+','INV.B-');W('BAT.-','INV.B+');W('CT.S1','INV.C1');S.ctDir='toLoad';S.expLimOn=true;S.expLimW=0;
    }
  }
  acRender();touch();
}
function acPoint(svg,e){const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse())}
function acAdd(a,b){
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
    if(mv){const m=mv;mv=null;if(m.moved){acRender();touch()}return}
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
  q('aclayreset').addEventListener('click',()=>{ACS.pos={};ACS.zoom=1;acRender();touch()});
  acRender();
}
function rerunBk(){if(typeof backupRun==='function')backupRun();if(typeof evRun==='function')evRun()}
