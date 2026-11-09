/* ---- เมนู 04 หน้า "ตู้ไฟงานโซลาร์": ผนังติดตั้งมุมมองด้านหน้า ลากสายเอง 2 แบบ
   แยกโหลด  : กริด → มิเตอร์ → ตู้เมน (โหลดทั่วไป + MCB ป้อน GRID อินเวอร์เตอร์) · BACKUP → ตู้โหลดสำรอง
   Full backup: กริด → มิเตอร์ → ตู้กริด (MCB ป้อน GRID) · BACKUP → ตู้โหลดทั้งบ้าน
   ระบบดิน TN-C-S: ต่อฝาก N–G ที่ตู้เมนจุดเดียว บาร์ G ลงหลักดิน ตัวถังอินเวอร์เตอร์และตู้โหลดสำรองต่อถึงบาร์ G
   เพื่อการเรียนรู้ ให้ตรวจกับคู่มืออินเวอร์เตอร์ มาตรฐาน วสท. และข้อกำหนดการไฟฟ้าก่อนติดตั้งจริง ---- */
const AS={mode:'split',wires:{split:[],full:[]},sw:{MCU:1,MC1:1,MC2:1,BCU:1},trip:{},grid:true,load:false,armed:null,fault:null};
const AS_COL={L:'#8b5a2b',N:'#2a78d6',PE:'#1baf7a'};
/* id, label, kind, x, y, side, component */
const AS_T=[
  ['MTR.OL','L ออก','L',1010,250,'b','MTR'],['MTR.ON','N ออก','N',1070,250,'b','MTR'],
  ['MCU.IL','L เข้า','L',655,128,'t','MCU'],['MCU.IN','N เข้า','N',695,128,'t','MCU'],
  ['MCU.C1','ขาออก','L',775,240,'b','MCU'],['MCU.C2','ขาออก','L',835,240,'b','MCU'],
  ['MCU.N1','N','N',650,290,'b','MCU'],['MCU.N2','N','N',675,290,'b','MCU'],['MCU.N3','N','N',700,290,'b','MCU'],
  ['MCU.G1','G','PE',790,290,'b','MCU'],['MCU.G2','G','PE',815,290,'b','MCU'],['MCU.G3','G','PE',840,290,'b','MCU'],['MCU.G4','G','PE',865,290,'b','MCU'],
  ['INV.GL','L','L',290,380,'b','INV'],['INV.GN','N','N',320,380,'b','INV'],['INV.GP','PE','PE',350,380,'b','INV'],
  ['INV.BL','L','L',410,380,'b','INV'],['INV.BN','N','N',440,380,'b','INV'],['INV.BP','PE','PE',470,380,'b','INV'],
  ['INV.PE','ตัวถัง ⏚','PE',250,330,'l','INV'],
  ['BCU.IL','L เข้า','L',325,548,'t','BCU'],['BCU.IN','N เข้า','N',365,548,'t','BCU'],
  ['BCU.C1','ขาออก','L',445,660,'b','BCU'],['BCU.C2','ขาออก','L',505,660,'b','BCU'],
  ['BCU.N1','N','N',320,710,'b','BCU'],['BCU.N2','N','N',345,710,'b','BCU'],['BCU.N3','N','N',370,710,'b','BCU'],
  ['BCU.G1','G','PE',460,710,'b','BCU'],['BCU.G2','G','PE',485,710,'b','BCU'],['BCU.G3','G','PE',510,710,'b','BCU'],['BCU.G4','G','PE',535,710,'b','BCU'],
  ['LD1.L','L','L',700,520,'l','LD1'],['LD1.N','N','N',700,550,'l','LD1'],['LD1.G','G','PE',700,580,'l','LD1'],
  ['LD2.L','L','L',700,700,'l','LD2'],['LD2.N','N','N',700,730,'l','LD2'],['LD2.G','G','PE',700,760,'l','LD2'],
  ['ROD.T','หัวหลักดิน','PE',1040,800,'t','ROD']
];
const AS_TM={};AS_T.forEach(t=>AS_TM[t[0]]={id:t[0],lab:t[1],kind:t[2],x:t[3],y:t[4],side:t[5],comp:t[6]});
const asNames=()=>AS.mode==='split'
  ?{MTR:'มิเตอร์',MCU:'ตู้เมน',INV:'อินเวอร์เตอร์',BCU:'ตู้โหลดสำรอง',LD1:'โหลดทั่วไป',LD2:'โหลดสำรอง',ROD:'หลักดิน'}
  :{MTR:'มิเตอร์',MCU:'ตู้กริด',INV:'อินเวอร์เตอร์',BCU:'ตู้โหลดทั้งบ้าน',LD1:'โหลดชุด 1',LD2:'โหลดชุด 2',ROD:'หลักดิน'};
const asName=id=>{const T=AS_TM[id],k=id.split('.')[0],n=asNames()[k];if(k==='INV'&&id!=='INV.PE')return`${n} ${id[4]==='G'?'GRID':'BACKUP'} ${T.lab}`;if(/^(MCU|BCU)\.[NG]\d$/.test(id))return`${n} บาร์ ${id.split('.')[1][0]}`;if(/\.C\d$/.test(id))return`${n} MCB ${id.slice(-1)}`;return`${n} ${T.lab}`};
const asW=()=>AS.wires[AS.mode];
const asKey=(a,b)=>[a,b].sort().join('|');
const asHas=(a,b)=>asW().some(w=>asKey(w.a,w.b)===asKey(a,b));
function asKind(a,b){
  const A=AS_TM[a].kind,B=AS_TM[b].kind;if(A===B)return['ok',`${asName(a)} → ${asName(b)} ถูกชนิด (${A==='PE'?'G':A})`];
  if((A==='N'&&B==='PE')||(A==='PE'&&B==='N'))return['warn','ต่อฝาก N กับ G (ทำได้ที่ตู้เมนจุดเดียว)'];
  if((A==='L'&&B==='N')||(A==='N'&&B==='L'))return['err','L ต่อกับ N = ลัดวงจร!'];
  return['err','L ต่อกับ G = ไฟรั่วลงดิน!'];
}
/* nets: grid and inverter are two separate sources; the inverter's GRID ↔ BACKUP relay is not a wire */
function asNets(allOn){
  const par={},fd=k=>{while(par[k]!==k){par[k]=par[par[k]];k=par[k]}return k},un=(a,b)=>{const x=fd(a),y=fd(b);if(x!==y)par[x]=y};
  Object.keys(AS_TM).concat(['UT.L','UT.N','IV.L','IV.N','MCU.BUS','BCU.BUS']).forEach(k=>par[k]=k);
  const on=k=>allOn||(AS.sw[k]&&!AS.trip[k]);
  if(allOn||AS.grid){un('UT.L','MTR.OL');un('UT.N','MTR.ON')}
  un('IV.L','INV.BL');un('IV.N','INV.BN');un('INV.GP','INV.BP');un('INV.BP','INV.PE');
  ['MCU','BCU'].forEach(p=>{
    for(let i=1;i<3;i++)un(`${p}.N${i}`,`${p}.N${i+1}`);for(let i=1;i<4;i++)un(`${p}.G${i}`,`${p}.G${i+1}`);
    if(on(p)){un(p+'.IL',p+'.BUS');un(p+'.IN',p+'.N1');if(p==='BCU'){un('BCU.BUS','BCU.C1');un('BCU.BUS','BCU.C2')}}
  });
  if(on('MCU')&&on('MC1'))un('MCU.BUS','MCU.C1');if(on('MCU')&&on('MC2'))un('MCU.BUS','MCU.C2');
  asW().forEach(w=>un(w.a,w.b));
  return fd;
}
/* the inverter makes BACKUP live from the battery; with grid present at its GRID port it passes grid power through */
function asState(){
  const E=asNets(false),gridAtInv=AS.grid&&E('INV.GL')===E('UT.L')&&E('INV.GN')===E('UT.N');
  const pw={},src={};
  ['LD1','LD2'].forEach(o=>{const g=AS.grid&&E(o+'.L')===E('UT.L')&&E(o+'.N')===E('UT.N'),v=E(o+'.L')===E('IV.L')&&E(o+'.N')===E('IV.N');pw[o]=g||v;src[o]=v?(gridAtInv?'กริดผ่านอินเวอร์เตอร์':'แบต (อินเวอร์เตอร์)'):g?'กริด':''});
  return{E,gridAtInv,pw,src};
}
function asAnalyze(){
  const W=asNets(true),ck=[],add=(l,t)=>ck.push([l,t]),same=(a,b)=>W(a)===W(b),nm=asNames(),split=AS.mode==='split';
  const S=asState();
  if(!asW().length)return{ck:[],lvl:'idle',n:{err:0,warn:0},S};
  const L=W('UT.L'),N=W('UT.N'),G=W('ROD.T');
  if(L===N||W('IV.L')===W('IV.N'))add('err','ลัดวงจร: สาย L กับ N ต่อถึงกัน ตรวจสายที่มีเส้นประสีแดง');
  if(L===G||W('IV.L')===G)add('err','ไฟรั่ว: สาย L ต่อถึงสายดิน ตรวจสายที่มีเส้นประสีแดง');
  if(W('IV.L')===L)add('err','ห้ามต่อ BACKUP ของอินเวอร์เตอร์เชื่อมกับฝั่งกริด ไฟจะย้อนเข้าสายการไฟฟ้าตอนไฟดับ (อันตรายต่อช่าง) และอินเวอร์เตอร์เสียหาย');
  /* 1 meter → main board */
  if(same('MCU.IL','UT.L')&&same('MCU.IN','UT.N'))add('ok',`มิเตอร์ → ${nm.MCU}: L เข้า L, N เข้า N`);
  else if(same('MCU.IL','UT.N'))add('err',`มิเตอร์ → ${nm.MCU}: สลับ L กับ N`);
  else add('warn',`ต่อ L และ N จากด้านออกของมิเตอร์เข้าเมนเบรกเกอร์ของ${nm.MCU}`);
  /* 2 inverter GRID port from its own breaker */
  const gL=['C1','C2'].find(c=>same('INV.GL','MCU.'+c));
  if(gL&&same('INV.GN','MCU.N1'))add('ok',`${nm.MCU} MCB ${gL.slice(1)} → GRID L, บาร์ N → GRID N ของอินเวอร์เตอร์`);
  else if(same('INV.GL','UT.L')&&!gL)add('warn','GRID L ของอินเวอร์เตอร์ต่อตรงไม่ผ่านเบรกเกอร์ ต้องมี MCB ป้อนอินเวอร์เตอร์ (ตัดเพื่อซ่อมบำรุงได้)');
  else add('warn',`ต่อ GRID L จาก MCB ใน${nm.MCU} และ GRID N จากบาร์ N ไปขั้ว GRID ของอินเวอร์เตอร์`);
  /* 3 BACKUP → backup / whole-house board */
  if(same('BCU.IL','IV.L')&&same('BCU.IN','IV.N'))add('ok',`BACKUP L / N ของอินเวอร์เตอร์ → เมนเบรกเกอร์${nm.BCU}`);
  else if(same('BCU.IL','UT.L')||same('BCU.IN','UT.N'))add('err',`${nm.BCU}ต้องรับไฟจาก BACKUP ของอินเวอร์เตอร์ ไม่ใช่จากฝั่งกริด ไม่อย่างนั้นไฟดับแล้วตู้นี้ดับด้วย`);
  else add('warn',`ต่อ BACKUP L และ BACKUP N ของอินเวอร์เตอร์เข้าเมนเบรกเกอร์ของ${nm.BCU}`);
  if(same('BCU.N1','UT.N')&&!same('BCU.N1','IV.N'))add('err',`บาร์ N ของ${nm.BCU}ต่อกับ N ฝั่งกริด ต้องใช้ N จาก BACKUP N ของอินเวอร์เตอร์เท่านั้น`);
  /* 4 earthing (TN-C-S) */
  if(same('MCU.G1','ROD.T'))add('ok',`บาร์ G ของ${nm.MCU}ต่อลงหลักดิน (สายต่อหลักดินตามตาราง 4-1 เช่น สายเมนไม่เกิน 35 ตร.มม. ใช้ 10 ตร.มม. · ความต้านทานดินไม่เกิน 5 Ω)`);else add('err',`บาร์ G ของ${nm.MCU}ยังไม่ต่อถึงหลักดิน`);
  const bonds=asW().filter(w=>{const a=AS_TM[w.a].kind,b=AS_TM[w.b].kind;return(a==='N'&&b==='PE')||(a==='PE'&&b==='N')});
  const at=bonds.map(w=>[w.a,w.b].map(x=>x.split('.')[0]).find(c=>c!=='ROD')||'ROD');
  if(at.includes('MCU')&&!at.some(c=>c!=='MCU'))add('ok',`ต่อฝาก N กับ G ที่${nm.MCU}จุดเดียว (ระบบ TN-C-S)`);
  if(!bonds.length)add('warn',`ยังไม่ได้ต่อฝาก N กับ G ที่${nm.MCU} (ลากสายจากบาร์ N ไปบาร์ G หนึ่งเส้น) ระบบ TN-C-S ต้องต่อฝากที่บริภัณฑ์ประธาน (วสท. 022001-22 ข้อ 4.3.1)`);
  at.filter(c=>c!=='MCU').forEach(c=>add('err',`ห้ามต่อฝาก N กับ G ที่${nm[c]||c} ต่อฝากได้ที่${nm.MCU}จุดเดียว (ข้อ 4.3.1, 4.4.2.1) (ด้าน BACKUP บางรุ่นต่อ N–PE ด้วยรีเลย์ในตัวเครื่องเองตอนไฟดับ ดูคู่มือรุ่นนั้น)`));
  if(same('INV.PE','ROD.T'))add('ok','ตัวถังและ PE ของอินเวอร์เตอร์ต่อถึงบาร์ G / หลักดิน');else add('err','ยังไม่ได้ต่อสายดินอินเวอร์เตอร์ (ขั้วตัวถังหรือ GRID PE ไปบาร์ G) ต้องต่อเสมอ');
  if(same('BCU.G1','ROD.T'))add('ok',`บาร์ G ของ${nm.BCU}ต่อถึงระบบดินเดียวกัน`);else add('err',`บาร์ G ของ${nm.BCU}ยังไม่ต่อถึงระบบดิน (ต่อจาก BACKUP PE หรือจากบาร์ G ของ${nm.MCU})`);
  /* 5 loads */
  [['LD1',split?'MCU':'BCU'],['LD2','BCU']].forEach(([o,want])=>{
    const from=['MCU','BCU'].find(p=>['C1','C2'].some(c=>same(o+'.L',p+'.'+c)));
    if(from===want)add('ok',`${nm[o]}: L จาก MCB ของ${nm[want]}`);
    else if(from)add(split?'warn':'warn',split?`${nm[o]}: ควรต่อจาก${nm[want]}`:`Full backup: ${nm[o]}ต่อจาก${nm.MCU} ไฟดับแล้วโหลดนี้ดับ ย้ายไป${nm.BCU}`);
    else add('warn',`${nm[o]}: ยังไม่ได้ต่อ L จาก MCB`);
    const nOk=same(o+'.N',(from||want)+'.N1');
    if(!nOk)add('warn',`${nm[o]}: N ต้องมาจากบาร์ N ของตู้เดียวกับ L`);
    if(same(o+'.G','ROD.T'))add('ok',`${nm[o]}: มีสายดิน`);else add('err',`${nm[o]}: ไม่มีสายดิน (G) ถ้ารั่วคนแตะจะถูกไฟดูด`);
  });
  if(!split){const I=typeof curInv==='function'?curInv():null,bk=I&&(+I.backupKw||+I.pac/1000);if(bk)add('ok',`Full backup: โหลดทั้งบ้านรวมกันต้องไม่เกินกำลัง BACKUP ของอินเวอร์เตอร์ (${f(bk,1)} kW ตามรุ่นที่เลือก) ตรวจกับเมนู 09`)}
  const n={err:0,warn:0};ck.forEach(c=>{if(n[c[0]]!=null)n[c[0]]++});
  return{ck,lvl:n.err?'err':n.warn?'warn':'ok',n,S};
}
function asPreset(k){
  AS.wires[AS.mode]=[];AS.trip={};AS.sw={MCU:1,MC1:1,MC2:1,BCU:1};AS.fault=null;
  if(k==='good'||k==='bad'){
    const W=(a,b)=>AS.wires[AS.mode].push({a,b}),split=AS.mode==='split';
    W('MTR.OL','MCU.IL');W('MTR.ON','MCU.IN');W('MCU.N3','MCU.G1');W('MCU.G4','ROD.T');
    W('MCU.C2','INV.GL');W('MCU.N2','INV.GN');W('MCU.G2','INV.GP');
    W('INV.BL','BCU.IL');W('INV.BN','BCU.IN');W('INV.BP','BCU.G1');
    if(split){W('MCU.C1','LD1.L');W('MCU.N1','LD1.N');W('MCU.G3','LD1.G')}else{W('BCU.C1','LD1.L');W('BCU.N1','LD1.N');W('BCU.G2','LD1.G')}
    W('BCU.C2','LD2.L');W('BCU.N2','LD2.N');W('BCU.G3','LD2.G');
    if(k==='bad'){const r=(a,b)=>{AS.wires[AS.mode]=asW().filter(w=>asKey(w.a,w.b)!==asKey(a,b))};r('MCU.G2','INV.GP');r('INV.BN','BCU.IN');W('MCU.N1','BCU.IN');W('BCU.N3','BCU.G4')}
  }
  asLog(k==='good'?`โหลดเฉลย: ${AS.mode==='split'?'แยกโหลด':'Full backup'}`:k==='bad'?'โหลดตัวอย่างต่อผิด 3 จุด: ลองหาให้เจอ':'ล้างสายทั้งหมด','idle');asRender();
}
const asLog=(m,l)=>{if(typeof logTo==='function')logTo('aslog',m,l)};
function asFault(o){
  const A=asAnalyze(),nm=asNames();
  if(!A.S.pw[o]){asLog(`ทดสอบไฟรั่ว${nm[o]}: โหลดไม่มีไฟ`,'warn');return}
  const W=asNets(true),grounded=W(o+'.G')===W('ROD.T'),p=['MCU','BCU'].find(x=>['C1','C2'].some(c=>W(o+'.L')===W(x+'.'+c)))||'BCU';
  const backupSide=W(o+'.L')===W('IV.L'),offGrid=backupSide&&!A.S.gridAtInv;
  if(grounded){AS.trip[p]=1;AS.fault={o,ok:true,t:Date.now()};asLog(`ทดสอบไฟรั่ว${nm[o]}: ไฟรั่วไหลลงสายดิน RCBO ของ${nm[p]}ตัด${offGrid?' (ตอนไฟดับ RCBO ด้าน BACKUP ทำงานได้เมื่ออินเวอร์เตอร์ต่อ N–PE ภายในและตัวถังต่อลงดิน)':''}`,'ok')}
  else{AS.fault={o,ok:false,t:Date.now()};asLog(`ทดสอบไฟรั่ว${nm[o]}: ไม่มีสายดิน ไฟค้างที่ตัวเครื่อง อันตราย!`,'err')}
  asRender();setTimeout(()=>{if(AS.fault&&Date.now()-AS.fault.t>=2900){AS.fault=null;asRender()}},3000);
}

/* ---- drawing: a wall, boxes screwed to it, cables leaving through the bottom ---- */
function asPath(a,b){
  const d=s=>s==='t'?[0,-1]:s==='b'?[0,1]:s==='l'?[-1,0]:[1,0],da=d(a.side),db=d(b.side),k=Math.max(30,Math.hypot(b.x-a.x,b.y-a.y)*.35);
  return`M${a.x} ${a.y}C${a.x+da[0]*k} ${a.y+da[1]*k} ${b.x+db[0]*k} ${b.y+db[1]*k} ${b.x} ${b.y}`;
}
function asArt(A){
  const T=(x,y,t,cls,anc,st)=>`<text x="${x}" y="${y}" class="${cls||'acnote'}" text-anchor="${anc||'middle'}"${st?` style="${st}"`:''}>${t}</text>`;
  const nm=asNames(),on=k=>AS.sw[k]&&!AS.trip[k];
  const scr=(x,y)=>`<circle cx="${x}" cy="${y}" r="3" style="fill:#c3ced8;stroke:#8a939b"/>`;
  const box=(x,y,w,h,title,sub)=>`<rect x="${x+4}" y="${y+6}" width="${w}" height="${h}" rx="10" style="fill:rgba(0,0,0,.08)"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" class="acbox" style="stroke-width:2"/>${scr(x+10,y+10)}${scr(x+w-10,y+10)}${scr(x+10,y+h-10)}${scr(x+w-10,y+h-10)}${T(x+16,y+24,esc(title),'actitle','start')}${sub?T(x+16,y+40,esc(sub),'acnote','start','font-size:10px'):''}`;
  const brk=(x,y,k,lab,w)=>{w=w||40;return`<g class="ahsw" data-asw="${k}"><rect x="${x}" y="${y}" width="${w}" height="64" rx="4" class="a-fill" style="stroke-width:1.5"/><rect x="${x+w/2-7}" y="${y+16}" width="14" height="30" rx="3" class="a-dark"/><rect x="${x+w/2-5}" y="${on(k)?y+18:y+33}" width="10" height="11" rx="2" style="fill:${on(k)?'var(--ok)':AS.trip[k]?'var(--err)':'#9aa4ad'}"/>${T(x+w/2,y+78,esc(lab),'acnote','middle','font-size:9.5px')}${T(x+w/2,y+90,AS.trip[k]?'ตัด':on(k)?'ON':'OFF','acnote','middle',`font-size:9px;fill:${AS.trip[k]?'var(--err)':'var(--muted)'}`)}<title>แตะเพื่อเปิด/ปิด</title></g>`};
  const bars=(x,y,nx,gx)=>`<rect x="${nx-12}" y="${y}" width="${2*25+24}" height="14" rx="3" style="fill:#d4b04c;stroke:#9a7a20"/>${T(nx+25,y-4,'บาร์ N','acnote','middle','font-size:9.5px;fill:'+AS_COL.N)}<rect x="${gx-12}" y="${y}" width="${3*25+24}" height="14" rx="3" style="fill:#d4b04c;stroke:#9a7a20"/>${T(gx+37,y-4,'บาร์ G','acnote','middle','font-size:9.5px;fill:'+AS_COL.PE)}`;
  /* wall */
  let s=`<defs><pattern id="aswall" width="60" height="30" patternUnits="userSpaceOnUse"><path d="M0 30H60M30 0V15M0 15H60M0 0V15M60 15V30" style="fill:none;stroke:rgba(120,130,140,.12);stroke-width:1"/></pattern></defs>`
    +`<rect x="0" y="0" width="1200" height="790" style="fill:url(#aswall)"/><path d="M0 790H1200" style="stroke:#8a939b;stroke-width:3"/>${T(20,782,'ผนังติดตั้ง (มุมมองด้านหน้า)','acnote','start','font-size:10px')}`;
  /* utility + meter */
  s+=`<path d="M1150 20V250M1130 34H1170" class="a-line a-th"/><path d="M1130 34C1100 30 1080 34 1040 70" style="stroke:${AS_COL.L};stroke-width:3;fill:none"/><path d="M1170 34C1150 50 1110 56 1080 70" style="stroke:${AS_COL.N};stroke-width:3;fill:none"/>${T(1150,270,AS.grid?'ไฟการไฟฟ้า':'ไฟดับ','actitle','middle',AS.grid?'':'fill:var(--err)')}`;
  s+=box(980,70,120,180,'มิเตอร์','การไฟฟ้า')+`<rect x="996" y="120" width="88" height="40" rx="6" style="fill:#e9eef2;stroke:#9aa4ad"/><rect x="1004" y="128" width="72" height="16" rx="2" class="a-dark"/>${T(1040,140,'0 0 0 1 6','a-lcdt','middle','fill:#fff;font-size:11px')}`;
  /* main / grid board */
  s+=box(620,60,280,230,nm.MCU,AS.mode==='split'?'โหลดทั่วไป + ป้อนอินเวอร์เตอร์':'ก่อนอินเวอร์เตอร์ ป้อน GRID')+brk(635,140,'MCU','เมน 2P',80)
    +brk(755,140,'MC1',AS.mode==='split'?'RCBO':'สำรอง')+brk(815,140,'MC2','MCB INV')+bars(0,262,650,790);
  /* inverter, battery and PV pre-wired on DC */
  const I=typeof curInv==='function'?curInv():{brand:'',model:''};
  s+=box(250,60,250,320,'อินเวอร์เตอร์ Hybrid',`${I.brand||''} ${I.model||''}`.trim())+`<rect x="280" y="110" width="190" height="56" rx="6" class="a-lcd"/>${T(375,138,A.S.gridAtInv?'GRID → LOAD':'BATTERY → LOAD','a-lcdt','middle')}${T(375,156,AS.grid?'มีไฟกริด':'ไฟดับ: จ่ายจากแบต','a-lcdt','middle','font-size:10px')}`;
  for(let i=0;i<6;i++)s+=`<rect x="280" y="${180+i*18}" width="190" height="7" rx="3.5" class="a-fin"/>`;
  s+=`<rect x="270" y="340" width="220" height="30" rx="4" class="a-dark" style="opacity:.8"/>${T(320,360,'GRID','a-brand s')}${T(440,360,'BACKUP','a-brand s')}`;
  s+=box(40,100,150,170,'แบตเตอรี่','48 V (ต่อ DC ไว้แล้ว)')+`<path d="M190 200C220 200 230 250 250 250" style="stroke:#d62828;stroke-width:4;fill:none"/><path d="M190 220C215 220 225 270 250 270" style="stroke:#14191e;stroke-width:4;fill:none"/>`;
  s+=box(40,10,150,70,'PV DC Isolator','สายแผง (ต่อไว้แล้ว)')+`<path d="M190 40C230 40 240 90 250 150" style="stroke:#d62828;stroke-width:3;fill:none"/><path d="M190 55C220 55 230 110 250 170" style="stroke:#14191e;stroke-width:3;fill:none"/>`;
  /* backup board */
  s+=box(300,480,270,230,nm.BCU,'รับไฟจาก BACKUP ของอินเวอร์เตอร์')+brk(305,560,'BCU','RCBO 2P',80)+`<rect x="425" y="560" width="40" height="64" rx="4" class="a-fill"/><rect x="485" y="560" width="40" height="64" rx="4" class="a-fill"/>${T(445,638,'MCB 1','acnote','middle','font-size:9.5px')}${T(505,638,'MCB 2','acnote','middle','font-size:9.5px')}`+bars(0,682,320,460);
  /* loads */
  [['LD1',490],['LD2',670]].forEach(([o,y])=>{const p=A.S.pw[o],fl=AS.fault&&AS.fault.o===o;
    s+=box(700,y,200,110,nm[o],o==='LD1'?(AS.mode==='split'?'แอร์ ปั๊มน้ำ (ไม่ต้องสำรอง)':'แอร์ ปั๊มน้ำ'):'ไฟ ตู้เย็น เราเตอร์');
    s+=`<circle cx="870" cy="${y+24}" r="9" style="fill:${p?'#ffd84a':'#9aa4ad'};stroke:#7a6a20"/>${T(800,y+98,p?'มีไฟ · '+A.S.src[o]:'ไม่มีไฟ','acnote','middle',p?'fill:var(--ok);font-weight:600':'')}`;
    if(fl)s+=T(800,y-8,AS.fault.ok?'ไฟรั่ว → สายดิน → RCBO ตัด ✓':'ไฟรั่ว ไม่มีสายดิน อันตราย!','acnote','middle',`font-weight:700;fill:${AS.fault.ok?'var(--ok)':'var(--err)'}`)});
  /* ground rod outside the wall */
  s+=`<g><rect x="960" y="800" width="170" height="150" rx="4" style="fill:#7a5a3a;opacity:.85"/><rect x="960" y="792" width="170" height="10" rx="3" style="fill:#5fa04a"/><rect x="1000" y="806" width="80" height="26" rx="3" style="fill:#c9cfd4;stroke:#8a939b"/>${T(1040,823,'บ่อตรวจ','acnote','middle','fill:#333;font-size:9px')}<rect x="1034" y="820" width="12" height="122" rx="3" style="fill:#e8862f;stroke:#a85a14"/><path d="M950 802V832M946 802H954M946 832H954" class="a-line"/>${T(946,821,'≥0.3 ม.','acnote','end','font-size:9px')}${T(1090,900,'≥2.4 ม. · Ø 5/8 นิ้ว · ≤5 Ω','acnote','start','fill:#fff;font-size:9px')}</g>`;
  return s;
}
function asRender(){
  const svg=document.getElementById('assvg');if(!svg)return;
  const A=asAnalyze(),nm=asNames();let s=asArt(A);
  const E=A.S.E,live=AS.load,srcNets=new Set([AS.grid?E('UT.L'):null,AS.grid?E('UT.N'):null,E('IV.L'),E('IV.N')].filter(Boolean)),G=asNets(true)('ROD.T');
  asW().forEach((w,i)=>{const a=AS_TM[w.a],b=AS_TM[w.b];if(!a||!b)return;
    const k=asKind(w.a,w.b),col=k[0]==='err'?'var(--err)':AS_COL[a.kind==='PE'&&b.kind==='N'?'N':a.kind],d=asPath(a,b),pe=a.kind==='PE'||b.kind==='PE';
    s+=`<path d="${d}" class="acw-hit" data-asw-w="${i}"/><path d="${d}" class="acw${k[0]==='err'?' bad':''}" style="stroke:${col};stroke-width:3.6"/>`;
    if(k[0]==='warn')s+=`<path d="${d}" class="acw" style="stroke:${AS_COL.PE};stroke-dasharray:6 6"/>`;
    const fl=E(w.a);
    if((live&&!pe&&srcNets.has(fl)&&(A.S.pw.LD1||A.S.pw.LD2))||(AS.fault&&AS.fault.ok&&pe&&asNets(true)(w.a)===G))s+=`<path d="${d}" class="wflow" style="stroke:${pe?'#7dff9a':'#ffd84a'}"/>`;
  });
  AS_T.forEach(t=>{const T=AS_TM[t[0]],arm=AS.armed===T.id,on=asW().some(w=>w.a===T.id||w.b===T.id);
    const lx=T.side==='l'?T.x-9:T.side==='r'?T.x+9:T.x,ly=T.side==='t'?T.y-9:T.side==='b'?T.y+17:T.y+4,an=T.side==='l'?'end':T.side==='r'?'start':'middle';
    const show=!/^(MCU|BCU)\.[NG]\d$/.test(T.id)&&!/\.C\d$/.test(T.id);
    s+=`<g class="act" data-as="${T.id}"><circle cx="${T.x}" cy="${T.y}" r="15" class="achit"/><circle cx="${T.x}" cy="${T.y}" r="6.5" class="acterm${on?' on':''}${arm?' arm':''}" style="stroke:${AS_COL[T.kind]}"/>${show?`<text x="${lx}" y="${ly}" class="aclab" text-anchor="${an}" style="font-size:9.5px">${esc(T.lab)}</text>`:''}</g>`});
  svg.innerHTML=s;
  if(AS.armed&&typeof pickMark==='function'){pickMark(svg,'as',AS.armed,(a,b)=>a!==b&&!asHas(a,b)&&asKind(a,b)[0]!=='err');const T=AS_TM[AS.armed];hintAt(svg,T.x,T.y,`เลือก ${asName(AS.armed)} แล้ว แตะขั้วที่สอง`,'idle')}
  const v=document.getElementById('asverdict');
  if(v){const msg=A.lvl==='idle'?'ยังไม่ได้ต่อสาย':A.lvl==='ok'?'ต่อถูกทั้งหมด':A.lvl==='warn'?`ใช้ได้บางส่วน มี ${A.n.warn} ข้อควรทำต่อ`:`พบ ${A.n.err} ข้อที่ไม่ปลอดภัย`;
    v.className='verdict '+(A.lvl==='idle'?'':A.lvl);v.innerHTML=`<span class="pill ${A.lvl}">${A.lvl==='idle'?'ยังไม่เริ่ม':LABEL[A.lvl]}</span><b>${esc(msg)}</b><span class="nums">${AS.grid?'มีไฟกริด':'ไฟดับ'} · ${nm.LD1} ${A.S.pw.LD1?'มีไฟ':'ดับ'} · ${nm.LD2} ${A.S.pw.LD2?'มีไฟ':'ดับ'}</span>`}
  const c=document.getElementById('aschecks');if(c)c.innerHTML=A.ck.slice().sort((a,b)=>RANK[a[0]]-RANK[b[0]]).map(x=>`<li><span class="b ${x[0]}">${GLYPH[x[0]]}</span><span>${esc(x[1])}</span></li>`).join('');
  const q=id=>document.getElementById(id);
  if(q('asgrid')){q('asgrid').classList.toggle('on',!AS.grid);q('asgrid').textContent=AS.grid?'ไฟการไฟฟ้า: มีไฟ':'ไฟการไฟฟ้า: ไฟดับ'}
  if(q('asload')){q('asload').classList.toggle('on',AS.load);q('asload').textContent=AS.load?'■ ปิดโหลด':'▶ เปิดโหลด'}
  document.querySelectorAll('[data-asmode]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.asmode===AS.mode));
  window.lastAS=A;try{localStorage.setItem('pvsim:solarcu',JSON.stringify({mode:AS.mode,wires:AS.wires}))}catch(e){}
}

/* ---- static TN-C-S earthing diagram with numbered notes ---- */
function asTNCS(){
  const svg=document.getElementById('astncs');if(!svg)return;
  const T=(x,y,t,cls,anc,st)=>`<text x="${x}" y="${y}" class="${cls||'acnote'}" text-anchor="${anc||'middle'}"${st?` style="${st}"`:''}>${t}</text>`;
  const n=(x,y,k)=>`<circle cx="${x}" cy="${y}" r="11" style="fill:var(--accent)"/>${T(x,y+4,k,'acnote','middle','fill:#fff;font-weight:700')}`;
  const ln=(d,c,w,da)=>`<path d="${d}" style="fill:none;stroke:${c};stroke-width:${w||3}${da?`;stroke-dasharray:${da}`:''}"/>`;
  let s='';
  s+=`<rect x="30" y="40" width="150" height="120" rx="10" class="acbox"/>${T(105,64,'หม้อแปลงการไฟฟ้า','actitle')}${T(105,82,'(N ต่อลงดินที่หม้อแปลง)','acnote','middle','font-size:9.5px')}`
    +ln('M90 160V200',AS_COL.PE,3)+`<path d="M78 200H102M83 207H97M88 214H92" class="a-line"/>`+n(130,190,'1');
  s+=ln('M180 90H330',AS_COL.L,4)+ln('M180 120H330','#7d6a3a',5)+T(255,82,'L','acnote','middle','fill:'+AS_COL.L)+T(255,140,'PEN (N + PE รวมกัน · TN-C)','acnote','middle','font-size:10px')+n(255,108,'2');
  s+=`<rect x="330" y="50" width="120" height="110" rx="10" class="acbox"/>${T(390,76,'มิเตอร์','actitle')}`;
  s+=ln('M450 90H560',AS_COL.L,4)+ln('M450 120H560','#7d6a3a',5);
  s+=`<rect x="560" y="30" width="300" height="250" rx="12" class="acbox"/>${T(710,54,'ตู้เมน (บริภัณฑ์ประธาน)','actitle')}`
    +`<rect x="590" y="110" width="110" height="16" rx="3" style="fill:#d4b04c;stroke:#9a7a20"/>${T(645,104,'บาร์ N','acnote','middle','fill:'+AS_COL.N)}`
    +`<rect x="730" y="110" width="110" height="16" rx="3" style="fill:#d4b04c;stroke:#9a7a20"/>${T(785,104,'บาร์ G','acnote','middle','fill:'+AS_COL.PE)}`
    +ln('M560 120H600','#7d6a3a',5)+ln('M690 126C700 160 730 160 740 126',AS_COL.PE,4,'7 5')+T(715,176,'สายต่อฝาก N–G','acnote','middle','font-size:10px')+n(715,196,'3');
  s+=ln('M790 126V320C790 370 700 360 659 402',AS_COL.PE,4)+`<rect x="648" y="398" width="22" height="8" rx="2" class="a-dark"/>`+T(800,300,'สายต่อหลักดิน 10 ตร.มม. (สายเมน ≤35)','acnote','start','font-size:10px')+n(812,330,'4');
  s+=`<rect x="560" y="380" width="200" height="160" rx="4" style="fill:#7a5a3a;opacity:.85"/><rect x="560" y="372" width="200" height="10" rx="3" style="fill:#5fa04a"/><rect x="610" y="386" width="100" height="28" rx="3" style="fill:#c9cfd4;stroke:#8a939b"/>${T(660,404,'บ่อตรวจ','acnote','middle','fill:#333;font-size:9.5px')}<rect x="652" y="400" width="14" height="138" rx="3" style="fill:#e8862f;stroke:#a85a14"/>${T(680,470,'หลักดิน','acnote','start','fill:#fff;font-weight:700')}${T(680,486,'Ø 5/8 นิ้ว (≈14.2 มม.)','acnote','start','fill:#fff;font-size:9.5px')}${T(680,502,'≤5 Ω · ยาว ≥2.4 ม.','acnote','start','fill:#fff;font-size:9.5px')}`+n(560,460,'5');
  s+=ln('M860 80H1000',AS_COL.L,4)+ln('M645 126V250H1000',AS_COL.N,4)+ln('M820 126V220H1000',AS_COL.PE,4)+T(930,72,'L','acnote','middle','fill:'+AS_COL.L)+T(930,242,'N','acnote','middle','fill:'+AS_COL.N)+T(930,212,'PE','acnote','middle','fill:'+AS_COL.PE)+n(930,160,'6');
  s+=`<rect x="1000" y="40" width="170" height="230" rx="12" class="acbox"/>${T(1085,64,'อินเวอร์เตอร์ / ตู้ย่อย','actitle')}${T(1085,82,'N กับ G แยกกัน (TN-S)','acnote','middle','font-size:10px')}`+n(1085,140,'7');
  s+=`<rect x="900" y="330" width="270" height="90" rx="10" class="acbox"/>${T(1035,354,'โครงแผง PV / ราง','actitle')}`+ln('M900 380C860 380 830 330 820 300',AS_COL.PE,3,'4 4')+T(1035,374,'ต่อลงดิน ≥4 ตร.มม. (≥16 ถ้ามีระบบป้องกันฟ้าผ่า)','acnote','middle','font-size:9.5px')+n(1150,400,'8');
  s+=`<rect x="900" y="440" width="270" height="90" rx="10" style="fill:none;stroke:var(--muted);stroke-dasharray:6 5"/>${T(1035,466,'หลักดินแยกของ PV (ถ้ามี)','acnote','middle','font-weight:600')}${T(1035,484,'ต้องต่อประสานกับหลักดินหลัก','acnote','middle','font-size:9.5px')}`+ln('M900 500H760',AS_COL.PE,3,'4 4')+n(1150,510,'9');
  svg.innerHTML=s;
  /* references: วสท. 022001-22 (มาตรฐานการติดตั้งทางไฟฟ้าสำหรับประเทศไทย พ.ศ. 2564) บทที่ 2, 4 · วสท. 022013-25 (ระบบผลิตไฟฟ้าพลังงานแสงอาทิตย์และระบบกักเก็บพลังงานแบตเตอรี่ พ.ศ. 2568) บทที่ 4, 5 */
  const N=[
    'หม้อแปลงการไฟฟ้าต่อจุดนิวทรัลลงดิน หม้อแปลงที่ติดตั้งนอกอาคารต้องต่อลงดินเพิ่มอย่างน้อย 1 จุดทางด้านไฟออกของหม้อแปลง (วสท. 022001-22 ข้อ 4.3.1)',
    'ก่อนถึงตู้เมน สายนิวทรัลของการไฟฟ้าทำหน้าที่ทั้ง N และ PE (ส่วน TN-C) ตัวนำที่ต่อลงดินต้องเดินไปถึงบริภัณฑ์ประธานทุกชุดพร้อมสายเส้นไฟ (ข้อ 4.3.2)',
    'ต่อลงดินที่บริภัณฑ์ประธาน (ตู้เมน) โดยต่อฝากบัสบาร์นิวทรัลกับบัสบาร์ต่อลงดิน และห้ามต่อลงดินที่จุดอื่นอีกทางด้านไฟออกของบริภัณฑ์ประธาน จากจุดนี้ไป N กับ PE แยกกัน (TN-C-S) (ข้อ 4.3.1 และข้อยกเว้นที่ 2, ข้อ 4.15.6)',
    'สายต่อหลักดิน (ทองแดง) ตามตารางที่ 4-1: สายประธานไม่เกิน 35 ตร.มม. ใช้ 10 ตร.มม. (แนะนำร้อยท่ออโลหะ) · เกิน 35–50 ใช้ 16 · เกิน 50–95 ใช้ 25 · เกิน 95–185 ใช้ 35',
    'หลักดินแบบแนวดิ่ง หุ้ม/ชุบทองแดงตาม มอก. 3024 เล่ม 2 หรือมาตรฐานการไฟฟ้า (ข้อ 2.4.1) ขนาด 5/8 นิ้ว ≈ 14.2 มม. สำหรับแท่งหุ้มทองแดง (หมายเหตุข้อ 2.4) · ความยาว ≥2.4 ม. และหัวหลักลึก ≥0.3 ม. ตามภาพอ้างอิง · ความต้านทานการต่อลงดินไม่เกิน 5 โอห์ม พื้นที่ที่ทำได้ยากและการไฟฟ้าเห็นชอบไม่เกิน 25 โอห์ม ถ้ายังเกินให้ตอกหลักดินเพิ่มอีก 1 แท่งแล้วต่อเชื่อมกัน (ข้อ 4.27)',
    'หลังตู้เมนเดินสาย L, N และสายดินของบริภัณฑ์ (PE สีเขียว) แยกกันทุกวงจร ขนาดสายดินตามตารางที่ 4-2 ตามพิกัดเครื่องป้องกันกระแสเกิน: ไม่เกิน 20 A ใช้ 2.5 ตร.มม. · 40 A ใช้ 4 · 70 A ใช้ 6 · 100 A ใช้ 10',
    'ตู้ย่อย ตู้โหลดสำรอง และอาคารที่รับไฟจากสายป้อน: เดินสายดินไปกับสายป้อน และห้ามต่อสายนิวทรัลเข้ากับสายดินหรือสายต่อหลักดิน (ข้อ 4.4.2.1) ด้าน BACKUP บางรุ่นต่อ N–PE ด้วยรีเลย์ในเครื่องเองตอนไฟดับ ให้ทำตามคู่มือรุ่นนั้น',
    'โครงโลหะที่รองรับ PV array ต่อลงดินด้วยตัวนำทองแดงไม่ต่ำกว่า 4 ตร.มม. และไม่ต่ำกว่า 16 ตร.มม. เมื่อใช้ร่วมกับระบบป้องกันฟ้าผ่า (วสท. 022013-25 ข้อ 4.4.2.2 รูปที่ 4.1)',
    'ถ้าใช้รากสายดินแยกสำหรับ PV array ต้องต่อเข้ากับรากสายดินหลักของระบบไฟฟ้าด้วยตัวนำประสานให้ศักย์เท่ากัน (วสท. 022013-25 ข้อ 4.4.2.3) · แบตเตอรี่แบบลอย (ไม่ต่อลงดิน) ไม่ต้องต่อสายดินเพิ่ม ยกเว้นการตรวจวัดความผิดพร่องลงดิน (ข้อ 5.4.3)'
  ];
  const ol=document.getElementById('astnote');if(ol)ol.innerHTML=N.map(t=>`<li>${esc(t)}</li>`).join('');
}

function initAS(){
  const svg=document.getElementById('assvg');if(!svg)return;
  try{const o=JSON.parse(localStorage.getItem('pvsim:solarcu')||'null');if(o&&o.wires){['split','full'].forEach(m=>{if(Array.isArray(o.wires[m]))AS.wires[m]=o.wires[m].filter(w=>AS_TM[w.a]&&AS_TM[w.b])});if(o.mode==='full')AS.mode='full'}}catch(e){}
  let drag=null,tmp=null;
  const pt=e=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse())};
  const ok=(a,b)=>a!==b&&!asHas(a,b)&&asKind(a,b)[0]!=='err';
  const add=(a,b)=>{if(a===b||asHas(a,b))return;const k=asKind(a,b);asW().push({a,b});AS.armed=null;asLog('ต่อสาย: '+(k[0]==='ok'?k[1]:`${asName(a)} → ${asName(b)} · ${k[1]}`),k[0]);asRender();if(typeof touch==='function')touch()};
  svg.addEventListener('pointerdown',e=>{
    const sw=e.target.closest('[data-asw]');if(sw){const k=sw.dataset.asw;if(AS.trip[k])delete AS.trip[k];else AS.sw[k]=AS.sw[k]?0:1;asLog(`เบรกเกอร์ ${k} ${AS.sw[k]&&!AS.trip[k]?'ON':'OFF'}`,'idle');asRender();return}
    const t=e.target.closest('[data-as]');if(!t)return;e.preventDefault();
    drag={id:t.dataset.as,moved:false};tmp=document.createElementNS('http://www.w3.org/2000/svg','path');tmp.setAttribute('class','acw tmp');tmp.style.pointerEvents='none';svg.appendChild(tmp);
    pickMark(svg,'as',drag.id,ok);try{svg.setPointerCapture(e.pointerId)}catch(_){}
  });
  svg.addEventListener('pointermove',e=>{
    if(!drag)return;const p=pt(e),a=AS_TM[drag.id];if(Math.hypot(p.x-a.x,p.y-a.y)>8)drag.moved=true;if(!drag.moved)return;
    tmp.setAttribute('d',`M${a.x} ${a.y}L${p.x} ${p.y}`);
    const el=document.elementFromPoint(e.clientX,e.clientY),t=el&&el.closest&&el.closest('[data-as]'),b=t&&t.dataset.as;
    if(b&&b!==drag.id){const k=asHas(drag.id,b)?['warn','ต่อสายเส้นนี้ไว้แล้ว']:asKind(drag.id,b);hintAt(svg,p.x,p.y,k[1],k[0])}else hintAt(svg,p.x,p.y,`จาก ${asName(drag.id)} ลากไปปล่อยที่ขั้วปลายทาง`,'idle');
  });
  const end=e=>{
    if(!drag)return;const d=drag;drag=null;if(tmp){tmp.remove();tmp=null}
    if(d.moved){const el=document.elementFromPoint(e.clientX,e.clientY),t=el&&el.closest&&el.closest('[data-as]');if(t)add(d.id,t.dataset.as);else asRender()}
    else if(AS.armed&&AS.armed!==d.id)add(AS.armed,d.id);
    else{AS.armed=AS.armed===d.id?null:d.id;asRender()}
  };
  svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',()=>{drag=null;if(tmp){tmp.remove();tmp=null};asRender()});
  svg.addEventListener('click',e=>{const w=e.target.closest('[data-asw-w]');if(w){const x=asW()[+w.dataset.aswW];asW().splice(+w.dataset.aswW,1);if(x)asLog(`ลบสาย: ${asName(x.a)} → ${asName(x.b)}`,'idle');asRender()}});
  const q=id=>document.getElementById(id);
  document.querySelectorAll('[data-asmode]').forEach(b=>b.addEventListener('click',()=>{AS.mode=b.dataset.asmode;AS.armed=null;AS.trip={};asLog(`รูปแบบ: ${AS.mode==='split'?'แยกโหลด (ตู้โหลดสำรอง)':'Full backup (ทั้งบ้าน)'}`,'idle');asRender()}));
  document.querySelectorAll('[data-asp]').forEach(b=>b.addEventListener('click',()=>asPreset(b.dataset.asp)));
  document.querySelectorAll('[data-asf]').forEach(b=>b.addEventListener('click',()=>asFault(b.dataset.asf)));
  if(q('asgrid'))q('asgrid').addEventListener('click',()=>{AS.grid=!AS.grid;const A=asAnalyze(),nm=asNames();asLog(AS.grid?'ไฟการไฟฟ้ากลับมา':`ไฟดับ: ${['LD1','LD2'].map(o=>`${nm[o]} ${A.S.pw[o]?'ยังมีไฟจาก'+A.S.src[o]:'ดับ'}`).join(' · ')}`,AS.grid?'idle':'warn');asRender()});
  if(q('asload'))q('asload').addEventListener('click',()=>{AS.load=!AS.load;asRender()});
  if(q('asreset'))q('asreset').addEventListener('click',()=>{AS.trip={};AS.sw={MCU:1,MC1:1,MC2:1,BCU:1};asLog('รีเซ็ตเบรกเกอร์ทั้งหมด (ON)','idle');asRender()});
  /* pages of menu 04 */
  document.querySelectorAll('[data-acpg]').forEach(b=>b.addEventListener('click',()=>{const pg=b.dataset.acpg;
    document.querySelectorAll('[data-acpg]').forEach(x=>x.setAttribute('aria-pressed',x===b));
    document.querySelectorAll('#tab-ac .acpg').forEach(x=>x.hidden=x.dataset.pg!==pg);
    if(pg==='solar')asRender();if(pg==='house'&&typeof ahRender==='function')ahRender();if(pg==='inv'&&typeof acRender==='function')acRender()}));
  logShow('aslog');asTNCS();asRender();
}
