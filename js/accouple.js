/* ---- เมนู 19 AC Coupling: อินเวอร์เตอร์ออนกริด (Huawei SUN2000 หรือไมโคร Deye) ต่อที่พอร์ต GEN ของ Deye / Solis Hybrid ----
   ฝึกต่อสาย (พอร์ต GEN, CT), ตั้งค่าเครื่อง Hybrid (Deye: Gen Port Use / Solis: Smart Port) และตั้งค่าอินเวอร์เตอร์ AC (กันย้อน เปิด/ปิด, ลดกำลังตามความถี่)
   ค่ากำลัง แผง โหลด และพฤติกรรมควบคุมเป็นแบบจำลอง ชื่อรายการตั้งค่าตามคู่มือเท่าที่ทราบ ตรวจกับเครื่องและคู่มือฉบับล่าสุดทุกครั้ง */
const CP_HOST={
  deye:{n:'Deye SUN-6K-SG04LP1-EU-SM2',kwp:3.9,cap:10.24,cmax:5,gen:'Gen Port Use',menu:'System Setup › Grid Setup',
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
    brief:'ต่อไมโคร Deye SUN-M200G4 เข้าพอร์ต GEN ของ Solis Hybrid พื้นที่นี้ **ห้ามขายไฟ** ต้องตั้งกันย้อนและ CT ให้ถูกต้อง'}
};
const CP_FAULTS={
  src_load:{n:'อินเวอร์เตอร์ AC ถูกต่อเข้าพอร์ต LOAD',f:S=>{S.ports.src='load'}},
  ct_loc:{n:'CT ถูกคล้องที่สายอินเวอร์เตอร์ AC แทนสายกริด',f:S=>{S.ports.ct='src'}},
  ct_rev:{n:'CT ติดกลับทิศ',f:S=>{S.ports.arrow='rev'}},
  gen_use:{n:'ไม่ได้ตั้งพอร์ต GEN เป็น AC couple',f:S=>{S.set.host.genUse=S.sc.endsWith('deye')?'gen':'none'}},
  hz_low:{n:'ความถี่ AC couple ของ Hybrid ตั้งต่ำเกินไป',f:S=>{S.set.host.acHz=50.3}},
  no_ct:{n:'ไม่ได้ติดตั้ง CT แต่เปิดกันย้อนไว้',f:S=>{S.ports.ct='none'}},
  pf_off:{n:'ปิดการลดกำลังตามความถี่ P(f) ที่ Huawei',f:S=>{S.set.src.pf=false},need:'hw'}
};
const CP_SRC_OPTS=[['none','ยังไม่ต่อ'],['gen','พอร์ต GEN ของเครื่อง Hybrid'],['main','ตู้เมนฝั่งกริด'],['grid','พอร์ต GRID ของเครื่อง Hybrid (ขนานกับกริด)'],['load','พอร์ต LOAD / Backup ของเครื่อง Hybrid']];
const CP_CT_OPTS=[['none','ไม่ติด CT'],['grid','สายไฟกริด (L) ที่จุดต่อกริด'],['src','สายออกของอินเวอร์เตอร์ AC'],['load','สายไปโหลดบ้าน']];
const CP_OUT=[['none','ไม่ดับ'],['mid','ไฟดับ 10:00–15:00'],['eve','ไฟดับ 18:00–22:00']];
const CP_DEFSET=sc=>{const H=CP_SC[sc].host;return{host:{genUse:H==='deye'?'gen':'none',acHz:50.5,exp:false,maxSell:5,reserve:20},src:{pf:true,anti:false}}};
const CP={sc:'hw_deye',page:'job',ports:{src:'none',ct:'none',arrow:'ok'},set:CP_DEFSET('hw_deye'),dash:{t:24,out:'none',cloud:0,load:100,soc0:50},done:{},drill:null,diagOk:0,_c:null};
const cpF=(v,d=0)=>(+v).toLocaleString('th-TH',{minimumFractionDigits:d,maximumFractionDigits:d});
const cpHM=i=>String(Math.floor(i/2)).padStart(2,'0')+':'+(i%2?'30':'00');
const cpSc=()=>CP_SC[CP.sc],cpHost=()=>CP_HOST[cpSc().host],cpSrc=()=>CP_SRC[cpSc().src];
const cpLoad=h=>{let w=.35;if(h>=6&&h<8)w+=.8;if(h>=10&&h<16)w+=.5;if(h>=18&&h<22)w+=1.8;return w};
function cpCorrect(S){const sc=CP_SC[S.sc],H=sc.host;S.ports={src:'gen',ct:'grid',arrow:'ok'};S.set=CP_DEFSET(S.sc);
  S.set.host.genUse='ac';S.set.host.acHz=51.6;S.set.src.pf=true;
  if(sc.policy==='noexp'){S.set.host.exp=false;S.set.src.anti=true}else{S.set.host.exp=true;S.set.src.anti=false}return S}
/* ---- สถานะต่อสาย/ตั้งค่า → ธงที่ใช้คำนวณ ---- */
function cpFlags(S){
  S=S||CP;const sc=CP_SC[S.sc],src=CP_SRC[sc.src],H=S.set.host,s=S.set.src,p=S.ports;
  const ctS=p.ct==='grid'?(p.arrow==='ok'?'ok':'rev'):p.ct==='none'?'none':'wrong';
  const gen=p.src==='gen'&&H.genUse==='ac';
  return{sc,src,H,s,p,ctS,gen,viaGrid:p.src==='main'||p.src==='grid',
    pf:src.adj?s.pf:true,mc:(src.adj?s.pf:true)?Math.max(0,Math.min(1,(H.acHz-src.fa)/(src.fb-src.fa))):0};
}
function cpAlarms(S){
  S=S||CP;const F=cpFlags(S),a=[],hn=CP_SC[S.sc].host==='deye';
  if(F.p.src==='load')a.push({c:'LOAD-BACKFEED',d:'อินเวอร์เตอร์ AC ต่อเข้าพอร์ต LOAD: ไฟย้อนเข้าเครื่อง Hybrid ผิดวิธี ตัดการทำงาน',sev:'stop'});
  if(F.p.src==='gen'&&!F.gen)a.push({c:hn?'GEN-PORT-SET':'SMART-PORT-SET',d:(hn?'Gen Port Use':'Smart Port')+' ไม่ได้ตั้งเป็น AC couple: เครื่องไม่รับไฟจากพอร์ต GEN',sev:'stop'});
  if(F.ctS==='none')a.push({c:hn?'CT-LOST':'MET-SLT-Fail',d:'ไม่พบ CT/มิเตอร์ที่จุดต่อกริด'+(F.s.anti?' อินเวอร์เตอร์ AC ที่เปิดกันย้อนจะลดกำลังเป็น 0':''),sev:'warn'});
  if(F.ctS==='wrong')a.push({c:'CT-WRONG-POS',d:'CT อยู่ผิดตำแหน่ง ค่าที่อ่านไม่ใช่ไฟกริด',sev:'warn'});
  if(F.ctS==='rev')a.push({c:'CT-REVERSE',d:'ทิศ CT กลับ ค่ากริดกลับเครื่องหมาย',sev:'warn'});
  return a;
}
/* ---- จำลอง 1 วัน (ทุก 30 นาที) ---- */
function cpRun(o,S){
  o=Object.assign({cloud:0,out:'none',soc0:50,load:100},o||{});const F=cpFlags(S),H=CP_HOST[F.sc.host],A=F.src,dt=.5;
  const w0={none:[0,0],mid:[10,15],eve:[18,22]}[o.out]||[0,0],reserve=F.H.reserve/100;
  let soc=o.soc0/100;const rows=[],T={pvH:0,pvA:0,load:0,imp:0,exp:0,expBad:0,chg:0,dis:0,cutA:0,cutH:0,uns:0,trips:0};
  for(let i=0;i<48;i++){
    const h=i*dt,s=Math.max(0,Math.sin(Math.PI*(h-6)/12))*(1-o.cloud/100),up=!(o.out!=='none'&&h>=w0[0]&&h<w0[1]);
    const L=cpLoad(h)*o.load/100;let pH=H.kwp*.85*s,pA=Math.min(A.w,A.kwp*.85*s);
    const on=F.gen||(F.viaGrid&&up);if(!on)pA=0;
    const dmax=Math.min(H.cmax,Math.max(0,(soc-(up?reserve:.05))*H.cap/dt)),cmaxNow=Math.min(H.cmax,Math.max(0,(1-soc)*H.cap/dt));
    if(up&&F.s.anti&&pA>0){
      if(F.ctS==='none'||F.ctS==='wrong')pA=0;
      else if(F.ctS==='rev'&&L>pH+pA+dmax)pA=0;
    }
    let cutH=0,cutA=0,ch=0,exp=0,expBad=0,dis=0,imp=0,uns=0,trip=false;
    const gen=pH+pA,direct=Math.min(gen,L);let sur=gen-direct;
    ch=Math.min(sur,cmaxNow);sur-=ch;
    if(sur>1e-9){
      if(up){
        if(F.s.anti&&F.ctS==='ok'){cutA=Math.min(pA,sur);sur-=cutA}
        if(F.H.exp){exp=Math.min(sur,F.H.maxSell);sur-=exp}
        const c=Math.min(pH,sur);cutH=c;sur-=c;
        if(sur>1e-9){expBad=sur;exp+=sur;sur=0}
        if(!F.H.exp)expBad=exp;
      }else{
        cutH=Math.min(pH,sur);sur-=cutH;const c=Math.min(sur,F.mc*pA);cutA=c;sur-=c;
        if(sur>1e-6)trip=true;
      }
    }
    if(trip){uns=L;ch=0;exp=0;expBad=0;cutH=0;cutA=0;pH=0;pA=0;T.trips++}
    else{const def=L-direct;if(def>1e-9){dis=Math.min(def,dmax);const r=def-dis;if(up)imp=r;else uns=r}}
    soc+=(ch-dis)*dt/H.cap;soc=Math.max(0,Math.min(1,soc));
    const vH=pH-cutH,vA=pA-cutA,f=up?50:cutA>0?Math.min(F.H.acHz,52):50;
    rows.push({i,h,up,pH:vH,pA:vA,L:L-uns,grid:imp-exp,bat:ch-dis,soc:soc*100,f,trip,cutA:cutA});
    T.pvH+=vH*dt;T.pvA+=vA*dt;T.load+=(L-uns)*dt;T.imp+=imp*dt;T.exp+=exp*dt;T.expBad+=expBad*dt;T.chg+=ch*dt;T.dis+=dis*dt;T.cutA+=cutA*dt;T.cutH+=cutH*dt;T.uns+=uns*dt;
  }
  return{rows,T};
}
function cpDay(){if(!CP._c){const d=CP.dash;CP._c=cpRun({cloud:d.cloud,out:d.out,soc0:d.soc0,load:d.load})}return CP._c}
/* ---- เช็กลิสต์ ---- */
function cpChecks(){
  const F=cpFlags(),sc=F.sc,H=CP_HOST[sc.host],A=F.src,deye=sc.host==='deye';
  const job=[[F.p.src==='gen',`อินเวอร์เตอร์ AC ต่อที่พอร์ต GEN ของ ${H.n}`,F.p.src==='load'?'err':''],
    [F.p.ct==='grid',`CT คล้องสายไฟกริดที่จุดต่อกริด (${F.p.ct==='src'?'ตอนนี้อยู่ที่สายอินเวอร์เตอร์ AC':F.p.ct==='load'?'ตอนนี้อยู่ที่สายโหลด':'ยังไม่ได้ติด'})`,F.p.ct==='src'||F.p.ct==='load'?'err':''],
    [F.p.ct==='grid'&&F.p.arrow==='ok','ทิศลูกศร CT ถูกต้อง',F.p.ct==='grid'&&F.p.arrow!=='ok'?'err':'']];
  const set=[[F.H.genUse==='ac',deye?'Gen Port Use = Micro Inv input (AC couple)':'Smart Port = AC couple input'],
    [F.H.acHz>=A.fb-1e-9,`AC Couple Freq ≥ ${A.fb} Hz เพื่อให้ Hybrid ดันความถี่ตัดกำลังอินเวอร์เตอร์ AC ได้หมดตอนแบตเต็ม (ตอนนี้ ${cpF(F.H.acHz,1)} Hz)`]];
  if(A.adj)set.push([F.s.pf,'Huawei เปิด P(f) ลดกำลังเมื่อความถี่สูง']);
  if(sc.policy==='noexp'){set.push([!F.H.exp,deye?'Work Mode = Zero Export To CT':'Storage mode = Self-use และปิด Allow export'],[F.s.anti,`เปิดกันย้อนที่อินเวอร์เตอร์ AC (${A.anti})`])}
  else{set.push([F.H.exp&&F.H.maxSell>=3,deye?'Work Mode = Selling First และ Max Sell Power ≥ 3 kW':'Allow export เปิด และ Max export ≥ 3 kW'],[!F.s.anti,'ปิดกันย้อนที่อินเวอร์เตอร์ AC (ได้รับอนุญาตให้ขายไฟ)'])}
  const N=cpRun({cloud:0,out:'none',soc0:50,load:100}),B=cpRun({cloud:0,out:'mid',soc0:95,load:60});
  const dash=[[N.T.pvA>1,'อินเวอร์เตอร์ AC ผลิตและจ่ายไฟได้ในวันปกติ'],
    sc.policy==='noexp'?[N.T.expBad<.05&&N.T.pvA>1,`ห้ามขายไฟ: ส่งออกกริดทั้งวัน ${cpF(N.T.exp,2)} kWh ต้องเป็น 0`,N.T.exp>=.05?'err':'']:[N.T.exp>.5,`ขายไฟได้: ส่งออกกริดทั้งวัน ${cpF(N.T.exp,1)} kWh`],
    [B.T.uns<.05&&B.T.trips===0&&B.T.pvA>.5,`ไฟดับกลางวัน (แบต 95%): โหลดไม่ดับ ไม่ขึ้น Battery OV (ตัดไม่ทัน ${B.T.trips} ช่วง)`,B.T.trips>0?'err':'']];
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
const cpPages=()=>[['job','1 ใบสั่งงานและการต่อสาย'],['host',`2 ตั้งค่า ${CP_SC[CP.sc].host==='deye'?'Deye':'Solis'} Hybrid`],['src',`3 ตั้งค่า ${CP_SC[CP.sc].src==='hw'?'Huawei':'ไมโคร Deye'}`],['dash','4 แดชบอร์ดและทดสอบ'],['fault','5 โจทย์หาข้อผิดพลาด']];
function cpRender(){
  const host=document.getElementById('cphost');if(!host)return;
  const s=cpScore(),sc=cpSc();if(!cpPages().some(p=>p[0]===CP.page))CP.page='job';const pg=CP.page;
  host.innerHTML=`<div class="verdict ${s.ok?'ok':s.n/s.all>.6?'warn':'err'}"><b>${esc(sc.n)}</b><span>${s.ok?'ผ่านครบทุกข้อ':'ผ่าน '+s.n+' / '+s.all+' ข้อ'}</span>${CP.drill?'<span class="pill warn">มีโจทย์หาข้อผิดพลาด</span>':''}<span class="nums">ผ่านแล้ว ${cpDone()}/4 ระบบ</span></div>
  <div class="bar"><div class="grp" role="group" aria-label="ระบบ"><span class="lab">ระบบ</span>${Object.entries(CP_SC).map(([k,v])=>`<button class="chip" data-cpsc="${k}" aria-pressed="${CP.sc===k}">${CP.done[k]?'✓ ':''}${esc(v.n)}</button>`).join('')}</div></div>
  <div class="bar"><div class="grp" role="group" aria-label="ขั้นตอน">${cpPages().map(([k,t])=>`<button class="chip" data-cppg="${k}" aria-pressed="${pg===k}">${t}</button>`).join('')}</div></div>
  <div id="cppage">${pg==='job'?cpPgJob(s):pg==='host'?cpPgHost(s):pg==='src'?cpPgSrc(s):pg==='dash'?cpPgDash(s):cpPgFault(s)}</div>`;
  cpLive();
}
function cpSLD(){
  const F=cpFlags(),p=F.p,hn=cpHost().n,sn=cpSrc().n.split(' (')[0];
  const ln=(a,b,c,d,cl)=>`<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" class="${cl||'cpw'}"/>`;
  const box=(x,y,w,h,t,t2,cl)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" class="cpb ${cl||''}"/><text x="${x+w/2}" y="${y+h/2-(t2?2:-4)}" text-anchor="middle" class="svgt" font-size="12">${esc(t)}</text>${t2?`<text x="${x+w/2}" y="${y+h/2+13}" text-anchor="middle" class="svgt mut" font-size="10">${esc(t2)}</text>`:''}`;
  let o=box(10,100,90,44,'กริด','PEA/MEA')+box(130,100,90,44,'ตู้เมน')+box(260,90,150,64,hn.split(' ')[0]+' Hybrid','พอร์ต GRID · GEN · LOAD','hy')+box(450,100,90,44,'โหลดบ้าน','Backup')+box(260,10,150,40,sn,'อินเวอร์เตอร์ AC','sr');
  o+=ln(100,122,130,122)+ln(220,122,260,122);
  o+=ln(410,122,450,122);
  o+=`<text x="335" y="82" text-anchor="middle" class="svgt mut" font-size="10">GEN</text>`;
  if(p.src==='gen')o+=ln(335,50,335,90);
  else if(p.src==='main')o+=ln(175,50,175,100)+ln(175,30,260,30);
  else if(p.src==='grid')o+=ln(240,50,240,122)+ln(240,30,260,30);
  else if(p.src==='load')o+=ln(430,50,430,122,'cpw bad')+ln(410,30,430,30,'cpw bad');
  const ct=(x,y)=>`<circle cx="${x}" cy="${y}" r="9" class="cpct"/><text x="${x}" y="${y+4}" text-anchor="middle" class="svgt" font-size="10">CT</text>`;
  if(p.ct==='grid')o+=ct(115,122);else if(p.ct==='src')o+=ct(335,70);else if(p.ct==='load')o+=ct(430,122);
  return `<svg viewBox="0 0 560 170" role="img" aria-label="ผังการต่อ AC coupling">${o}</svg>`;
}
function cpPgJob(s){
  const F=cpFlags(),H=cpHost(),sc=cpSc(),p=CP.ports;
  return `<div class="cards"><div class="card"><h3>ใบสั่งงาน</h3><p>${esc(sc.brief).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>')}</p>
    <table class="t"><tbody><tr><th>Hybrid</th><td>${esc(H.n)} · แบต ${cpF(H.cap,2)} kWh</td></tr><tr><th>อินเวอร์เตอร์ AC</th><td>${esc(cpSrc().n)}</td></tr><tr><th>นโยบายขายไฟ</th><td>${sc.policy==='noexp'?'ห้ามขาย (ต้องกันย้อน)':'ขายได้ ไม่เกิน 5 kW'}</td></tr></tbody></table>
    <div class="tblwrap">${cpSLD()}</div></div>
    <div class="card"><h3>การต่อสาย</h3>
    ${cpRow('อินเวอร์เตอร์ AC ต่อเข้าที่',`<select class="hn" data-cpp="src" id="cpp-src">${CP_SRC_OPTS.map(([k,t])=>`<option value="${k}" ${p.src===k?'selected':''}>${esc(t)}</option>`).join('')}</select>`)}
    ${cpRow('ตำแหน่ง CT',`<select class="hn" data-cpp="ct" id="cpp-ct">${CP_CT_OPTS.map(([k,t])=>`<option value="${k}" ${p.ct===k?'selected':''}>${esc(t)}</option>`).join('')}</select>`)}
    ${cpRow('ทิศลูกศร CT',`<select class="hn" data-cpp="arrow" id="cpp-arrow"><option value="ok" ${p.arrow==='ok'?'selected':''}>${esc(H.ctOk)}</option><option value="rev" ${p.arrow==='rev'?'selected':''}>${esc(H.ctBad)}</option></select>`)}
    <p class="hint tight">${esc(H.ctNote)} · มิเตอร์/CT กันย้อน: ${esc(cpSrc().meter)}</p>
    <h3>ตรวจการต่อสาย</h3>${cpList(s.c.job)}
    ${cpAlarms().map(a=>`<p class="${a.sev==='stop'?'hmierr':'hint tight'}"><b>${esc(a.c)}</b> ${esc(a.d)}</p>`).join('')}</div></div>`;
}
function cpPgHost(s){
  const S=CP.set.host,deye=cpSc().host==='deye',H=cpHost(),bar=t=>`<div class="hmibar"><span>${t}</span><span>${esc(H.n)}</span></div>`;
  let body;
  if(deye)body=cpRow('Work Mode',cpSel('host.exp',[['zero','Zero Export To CT'],['sell','Selling First']],S.exp?'sell':'zero'))
    +(S.exp?cpRow('Max Sell Power',cpNum('host.maxSell',S.maxSell,0,6,.5,'kW')):'')
    +cpRow('Gen Port Use',cpSel('host.genUse',[['gen','Gen input'],['smart','Smart Load output'],['ac','Micro Inv input']],S.genUse))
    +(S.genUse==='ac'?cpRow('AC Couple Fre High',cpNum('host.acHz',S.acHz,50,52,.1,'Hz')):'')
    +cpRow('Batt Low (ไฟดับ/กริด)',cpNum('host.reserve',S.reserve,10,50,1,'%'))
    +`<p class="hmiinfo">Micro Inv input: ไมโคร/อินเวอร์เตอร์ออนกริดต่อที่พอร์ต GEN เมื่อไฟดับและแบตเต็ม Hybrid เพิ่มความถี่ขึ้นถึงค่า AC Couple Fre High เพื่อให้อินเวอร์เตอร์นั้นลดกำลัง ตรวจชื่อรายการและช่วงค่ากับคู่มือ Deye ฉบับล่าสุด</p>`;
  else body=cpRow('Storage mode','Self-use')
    +cpRow('Allow export',cpChk('host.exp',S.exp,''))+(S.exp?cpRow('Max export power',cpNum('host.maxSell',S.maxSell,0,6,.5,'kW')):'')
    +cpRow('Smart Port',cpSel('host.genUse',[['none','ไม่ใช้งาน'],['genset','Genset input'],['gensetgrid','Genset connected to grid'],['smart','Smart load output'],['ac','AC couple input']],S.genUse))
    +(S.genUse==='ac'?cpRow('AC couple Freq-Watt max freq',cpNum('host.acHz',S.acHz,50,52,.1,'Hz')):'')
    +cpRow('Battery reserve',cpNum('host.reserve',S.reserve,10,50,1,'%'))
    +`<p class="hmiinfo">AC couple input: อินเวอร์เตอร์ออนกริดต่อที่พอร์ต GEN เครื่อง Hybrid ใช้ Freq-Watt ปรับกำลังของอินเวอร์เตอร์นั้น ตรวจชื่อรายการและช่วงค่ากับคู่มือ Solis ฉบับล่าสุด</p>`;
  return `<div class="cards"><div class="card sldevcard"><div class="sldev"><div class="sldevtop"><span>${deye?'DEYE':'SOLIS'}</span><span>${esc(H.menu)}</span></div><div class="slscr">${bar(deye?'GRID SETUP / WORK MODE':'STORAGE MODE · SMART PORT')}<div class="hmibody">${body}</div></div></div></div>
    <div class="card"><h3>ตรวจการตั้งค่า</h3>${cpList(s.c.set)}<p class="hint tight">${deye?'ค่า Gen Port Use และ AC Couple Fre High':'ค่า Smart Port และ Freq-Watt'} ต้องสอดคล้องกับอินเวอร์เตอร์ AC ที่ต่ออยู่</p></div></div>`;
}
function cpPgSrc(s){
  const S=CP.set.src,A=cpSrc(),hw=cpSc().src==='hw',F=cpFlags();
  const body=hw?cpRow('P(f) over-frequency derating',cpChk('src.pf',S.pf,'เปิด'))+cpRow('Derating start / stop',`${A.fa} / ${A.fb} Hz`)+cpRow('Export limitation (Zero export)',cpChk('src.anti',S.anti,'เปิด กันย้อน'))+cpRow('Power meter',F.p.ct==='grid'?'พบ (CT/มิเตอร์ที่จุดต่อกริด)':'ไม่พบ')
    :cpRow('Grid code frequency derate',`${A.fa} / ${A.fb} Hz (ตามมาตรฐาน ปรับไม่ได้)`)+cpRow('Zero export (กันย้อน)',cpChk('src.anti',S.anti,'เปิด'))+cpRow('ค่าที่อ่านจาก CT',F.p.ct==='grid'?'พบ CT ของ Hybrid':'ไม่พบ CT');
  return `<div class="cards"><div class="card sldevcard"><div class="sldev"><div class="sldevtop"><span>${hw?'HUAWEI · SUN2000 (FusionSolar / SUN2000 app)':'DEYE MICRO · แอปมอนิเตอร์'}</span><span>${esc(A.n.split(' (')[0])}</span></div><div class="slscr"><div class="hmibar"><span>${hw?'Settings › Feature parameters':'Settings'}</span><span>${esc(A.anti)}</span></div><div class="hmibody">${body}<p class="hmiinfo">เปิดกันย้อนแล้ว ถ้าไม่พบ CT/มิเตอร์หรืออ่านผิด อินเวอร์เตอร์จะลดกำลังเป็น 0 เพื่อความปลอดภัย ไม่ใช่ขายไฟต่อ · ชื่อรายการเป็นแบบจำลอง ตรวจกับคู่มือรุ่นจริง</p></div></div></div></div>
    <div class="card"><h3>ตรวจการตั้งค่า</h3>${cpList(s.c.set)}</div></div>`;
}
function cpLive(){
  const el=document.getElementById('cplive');if(!el)return;const r=cpDay().rows[CP.dash.t];
  el.innerHTML=`<table class="t"><tbody><tr><th>เวลา</th><td><b>${cpHM(r.i)}</b> ${r.up?'':'<span class="pill warn">ไฟดับ</span>'}${r.trip?'<span class="pill err">Battery OV · โหลดดับ</span>':''}</td><th>ความถี่ที่ Hybrid จ่าย</th><td>${cpF(r.f,1)} Hz</td></tr>
  <tr><th>แผงของ Hybrid</th><td>${cpF(r.pH,2)} kW</td><th>อินเวอร์เตอร์ AC (GEN)</th><td>${cpF(r.pA,2)} kW${r.cutA>0?` (ถูกตัด ${cpF(r.cutA,2)})`:''}</td></tr>
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
  const S=CP;cpCorrect(S);const ks=Object.keys(CP_FAULTS).filter(k=>!CP_FAULTS[k].need||CP_FAULTS[k].need===CP_SC[S.sc].src);
  const pick=[];while(pick.length<2){const k=ks[Math.floor(Math.random()*ks.length)];if(!pick.includes(k))pick.push(k)}
  if(pick.includes('ct_loc')&&pick.includes('ct_rev'))pick[1]='src_load';
  if(pick.includes('no_ct')&&CP_SC[S.sc].policy!=='noexp')pick[pick.indexOf('no_ct')]='hz_low';
  pick.forEach(k=>CP_FAULTS[k].f(S));if(pick.includes('no_ct'))S.set.src.anti=true;
  S.drill=pick;S.reveal=false;S.flash='';
}
function cpSetPath(path,v){const[g,k]=path.split('.');
  if(path==='host.exp'){CP.set.host.exp=(v===true||v==='sell');return}
  if(g==='dash'){CP.dash[k]=v;return}if(CP.set[g])CP.set[g][k]=v}
function cpEvents(){
  const host=document.getElementById('cphost');if(!host||host.dataset.on)return;host.dataset.on='1';
  host.addEventListener('click',e=>{
    const t=e.target.closest('[data-cpsc],[data-cppg],[data-cpact]');if(!t)return;const d=t.dataset;
    if(d.cpsc){if(CP.sc!==d.cpsc){CP.sc=d.cpsc;CP.ports={src:'none',ct:'none',arrow:'ok'};CP.set=CP_DEFSET(CP.sc);CP.drill=null;CP.flash=''}cpChanged();return}
    if(d.cppg){CP.page=d.cppg;cpRender();if(typeof touch==='function')touch();return}
    if(d.cpact==='drill'){cpDrill();cpChanged()}
    else if(d.cpact==='drillend'){CP.drill=null;cpCorrect(CP);cpChanged()}
    else if(d.cpact==='reveal'){CP.reveal=true;cpRender()}
  });
  host.addEventListener('change',e=>{
    const t=e.target,d=t.dataset;
    if(d.cpp){CP.ports[d.cpp]=t.value;cpChanged();return}
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
  if(CP_SC[o.sc])CP.sc=o.sc;if(['job','host','src','dash','fault'].includes(o.page))CP.page=o.page;
  CP.set=CP_DEFSET(CP.sc);
  if(o.ports){['src','ct'].forEach(k=>{const l=k==='src'?CP_SRC_OPTS:CP_CT_OPTS;if(l.some(x=>x[0]===o.ports[k]))CP.ports[k]=o.ports[k]});if(o.ports.arrow==='ok'||o.ports.arrow==='rev')CP.ports.arrow=o.ports.arrow}
  if(o.set&&typeof o.set==='object')['host','src'].forEach(g=>{if(o.set[g]&&typeof o.set[g]==='object')Object.keys(CP.set[g]).forEach(k=>{if(typeof o.set[g][k]===typeof CP.set[g][k])CP.set[g][k]=o.set[g][k]})});
  if(o.dash&&typeof o.dash==='object')Object.keys(CP.dash).forEach(k=>{if(typeof o.dash[k]===typeof CP.dash[k])CP.dash[k]=o.dash[k]});
  CP.drill=Array.isArray(o.drill)?o.drill.filter(k=>CP_FAULTS[k]):null;
  if(o.done&&typeof o.done==='object')Object.keys(CP_SC).forEach(k=>CP.done[k]=!!o.done[k]);
  CP.diagOk=Math.max(0,o.diagOk|0);CP._c=null;
}
function cpSummary(){const s=cpScore();return{sc:CP.sc,pass:s.n,all:s.all,done:Object.keys(CP.done).filter(k=>CP.done[k]),diag:CP.diagOk}}
