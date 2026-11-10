/* ---- เมนู 20 Smart Load: พอร์ต GEN ของ Deye / Solis ใช้เป็น Smart Load output ต่อ wall charger รถไฟฟ้า ----
   ฝึกต่อ wall charger เข้าพอร์ต GEN ตั้งค่าที่จอเครื่องตามคู่มือ (Deye: System Setup › Gen Port Use › Smart Load Output / Solis: SYSTEM SETTING › SMART PORT › Smart load output) แล้วดูผลในวันที่มีกลางคืน เมฆ ไฟดับ On-grid / Off-grid
   ชื่อรายการและคำอธิบายบนจอเครื่องตามคู่มือ Deye SM2 (2026-01) และ Solis V1.3 ส่วนกำลัง แผง โหลด และพฤติกรรมควบคุมเป็นแบบจำลอง ตรวจกับเครื่องและคู่มือฉบับล่าสุดทุกครั้ง */
const SG_HOST={
  deye:{n:'Deye SUN-6K-SG04LP1-EU-SM2',kwp:3.9,cap:10.24,cmax:5,pac:6,port:4.6,gen:'Gen Port Use',menu:'System Setup › Grid Setup',lab:'DEYE'},
  solis:{n:'Solis S6-EH1P6K-L-PLUS',kwp:3.9,cap:14.3,cmax:5,pac:6,port:4.6,gen:'Smart Port',menu:'SYSTEM SETTING › SMART PORT',lab:'SOLIS'}
};
const SG_CAR={cap:60,eff:.92};
const SG_SC={
  deye_sun:{n:'Deye · ชาร์จรถด้วยแดด',host:'deye',task:'sun',brief:'ติด wall charger รถ EV ที่พอร์ต GEN ของ Deye ใช้เป็น Smart Load ให้ชาร์จรถช่วงกลางวันที่มีแดด ไม่ดึงไฟกริดมาชาร์จรถ ไม่ใช้แบตจนต่ำกว่า 30%'},
  deye_out:{n:'Deye · ไฟดับตอนเย็น ห้ามโหลดบ้านดับ',host:'deye',task:'out',brief:'รถเสียบ wall charger ตอนเย็นถึงเช้า ถ้าไฟกริดดับ 18:00–22:00 ต้องไม่ทำให้โหลดบ้านดับ ต้องตัดการชาร์จรถก่อนแบตเหลือน้อยจนบ้านไม่พอใช้ช่วงไฟดับ'},
  solis_sun:{n:'Solis · ชาร์จรถด้วยแดด',host:'solis',task:'sun',brief:'ติด wall charger รถ EV ที่พอร์ต GEN ของ Solis ใช้ Smart Port เป็น Smart load output ให้ชาร์จรถช่วงกลางวันที่มีแดด ไม่ดึงไฟกริดมาชาร์จรถ ไม่ใช้แบตจนต่ำกว่า 30%'},
  solis_out:{n:'Solis · ไฟดับตอนเย็น ห้ามโหลดบ้านดับ',host:'solis',task:'out',brief:'รถเสียบ wall charger ตอนเย็นถึงเช้า ถ้าไฟกริดดับ 18:00–22:00 ต้องไม่ทำให้โหลดบ้านดับ ต้องตัดการชาร์จรถก่อนแบตเหลือน้อยจนบ้านไม่พอใช้ช่วงไฟดับ'}
};
const SG_GEN_OPTS=[['none','ว่าง'],['ev','Wall charger รถ EV'],['house','ตู้เมนบ้าน (ผิด)']];
const SG_OUT=[['none','ไม่ดับ'],['mid','ไฟดับ 10:00–15:00'],['eve','ไฟดับ 18:00–22:00'],['all','ไฟดับทั้งวัน']];
const SG_MODE=[['on','On-grid (มีกริด)'],['off','Off-grid (ไม่มีกริด)']];
const SG_DEFDASH=()=>({t:24,mode:'on',out:'none',cloud:0,load:100,soc0:50,car0:30,arr:9,dep:17});
const SG={sc:'deye_sun',page:'job',gen:'none',chA:32,hs:hlDef('deye'),lcd:{scr:'home',stack:[]},dash:SG_DEFDASH(),done:{},_c:null};
const sgF=(v,d=0)=>(+v).toLocaleString('th-TH',{minimumFractionDigits:d,maximumFractionDigits:d});
const sgHM=i=>String(Math.floor(i/2)).padStart(2,'0')+':'+(i%2?'30':'00');
const sgSc=()=>SG_SC[SG.sc],sgHost=()=>SG_HOST[sgSc().host];
const sgLoad=h=>{let w=.35;if(h>=6&&h<8)w+=.8;if(h>=10&&h<16)w+=.5;if(h>=18&&h<22)w+=1.8;return w};
const sgChargerKW=S=>230*S.chA/1000;
function sgReset(S){S.gen='none';S.chA=32;S.hs=hlDef(SG_SC[S.sc].host);S.lcd={scr:'home',stack:[]}}
function sgCorrect(S){const sc=SG_SC[S.sc],d=sc.host==='deye',sun=sc.task==='sun';sgReset(S);S.gen='ev';S.chA=16;
  const sl=d?S.hs.gen.sl:S.hs.sp.sl;if(d)S.hs.gen.use='smart';else S.hs.sp.use='smart';
  sl.gridOn=false;if(sun){if(d)sl.pv=1500;sl.off=30;sl.on=45;if(!d)S.hs.st.reserve=20}else{sl.off=60;sl.on=80}return S}
/* ---- จำลอง 1 วัน (ทุก 30 นาที) ---- */
function sgRun(o,S){
  S=S||SG;o=Object.assign(SG_DEFDASH(),o||{});const sc=SG_SC[S.sc],H=SG_HOST[sc.host],M=hlMap(sc.host,S.hs),E={genUse:M.genUse,socOn:M.sl.on,socOff:M.sl.off,gridOn:M.sl.gridOn,offGridOff:M.sl.offGridOff,pvMin:M.sl.pvMin,reserve:M.reserve,floor:M.floorOff},dt=.5,kw=sgChargerKW(S);
  const w0={none:[0,0],mid:[10,15],eve:[18,22],all:[0,24]}[o.out];let soc=o.soc0/100,car=o.car0,on=false;
  const rows=[],T={pv:0,load:0,sl:0,slPv:0,slBat:0,slGrid:0,imp:0,chg:0,dis:0,cut:0,uns:0,over:0,minSoc:100,minSocSL:100,car0:o.car0,car1:o.car0};
  for(let i=0;i<48;i++){
    const h=i*dt,s=Math.max(0,Math.sin(Math.PI*(h-6)/12))*(1-o.cloud/100),up=o.mode==='on'&&!(h>=w0[0]&&h<w0[1]);
    const L=sgLoad(h)*o.load/100,pH=H.kwp*.85*s;
    const plug=o.arr<o.dep?(h>=o.arr&&h<o.dep):(h>=o.arr||h<o.dep);
    const gen=S.gen==='ev'&&E.genUse==='smart';
    /* ตัดสินใจ ON/OFF ของ Smart Load */
    let want=false;
    if(gen&&plug&&car<100){
      if(!up&&E.offGridOff)on=false;
      else if(up&&E.gridOn)want=true;
      else{
        if(soc*100>=E.socOn)on=true;else if(soc*100<E.socOff)on=false;
        want=on&&(E.pvMin<=0||pH>=E.pvMin)}
    }else on=soc*100>=E.socOn;
    let sl=want?kw:0,over=false;
    if(sl>H.port){sl=0;over=true}                      /* เกินกำลังพอร์ต GEN: เครื่องตัด Smart Load */
    if(L+sl>H.pac){sl=Math.max(0,H.pac-L);over=true}  /* เกินกำลังพิกัดเครื่อง */
    const dmax=Math.min(H.cmax,Math.max(0,(soc-(up?E.reserve/100:E.floor/100))*H.cap/dt)),cmaxNow=Math.min(H.cmax,Math.max(0,(1-soc)*H.cap/dt));
    if(!up)sl=Math.min(sl,Math.max(0,pH+dmax-L));      /* ไฟดับ: ต้องเหลือให้โหลดบ้านก่อน */
    const dem=L+sl,direct=Math.min(pH,dem);let sur=pH-direct,ch=Math.min(sur,cmaxNow),cut=0,dis=0,imp=0,uns=0;sur-=ch;cut=sur;
    const def=dem-direct;if(def>1e-9){dis=Math.min(def,dmax);const r=def-dis;if(up)imp=r;else uns=r}
    if(sl>0.001)T.minSocSL=Math.min(T.minSocSL,soc*100);
    soc+=(ch-dis)*dt/H.cap;soc=Math.max(0,Math.min(1,soc));car=Math.min(100,car+sl*dt*SG_CAR.eff/SG_CAR.cap*100);
    rows.push({i,h,up,pH,L,sl,slOn:sl>0.001,plug,grid:imp,bat:ch-dis,soc:soc*100,car,over,cut,uns});
    T.pv+=pH*dt-cut*dt;T.load+=(L-uns)*dt;T.sl+=sl*dt;T.slPv+=sl*dt*(dem>0?direct/dem:0);T.slBat+=sl*dt*(dem>0?dis/dem:0);T.slGrid+=sl*dt*(dem>0?imp/dem:0);
    T.imp+=imp*dt;T.chg+=ch*dt;T.dis+=dis*dt;T.cut+=cut*dt;T.uns+=uns*dt;if(over)T.over++;T.minSoc=Math.min(T.minSoc,soc*100);
  }
  T.car1=car;return{rows,T};
}
function sgDay(){if(!SG._c)SG._c=sgRun(SG.dash);return SG._c}
/* ---- เช็กลิสต์ ---- */
function sgChecks(){
  const sc=sgSc(),H=sgHost(),M=hlMap(sc.host,SG.hs),E=M.sl,deye=sc.host==='deye',sun=sc.task==='sun';
  const job=[[SG.gen==='ev',`Wall charger รถ EV ต่อที่พอร์ต GEN ของ ${H.n}`,SG.gen==='house'?'err':''],
    [SG.chA<=16,`ตั้งกระแส wall charger ≤ 16 A (ตอนนี้ ${SG.chA} A = ${sgF(sgChargerKW(SG),2)} kW) ให้รวมกับโหลดบ้านไม่เกินพิกัด ${H.pac} kW`,SG.chA>20?'err':'']];
  const set=[[M.genUse==='smart',deye?'Gen Port Use = Smart Load Output':'Smart Port = Smart load output',M.genUse==='gen'||M.genUse==='genset'||M.genUse==='gensetgrid'||M.genUse==='ac'?'err':''],
    [E.on>=E.off+5,`${deye?'Smart Load ON Batt':'Smart load ON SOC'} สูงกว่า OFF อย่างน้อย 5% เพื่อไม่ให้สลับถี่ (ตอนนี้ ON ${E.on}% / OFF ${E.off}%)`]];
  if(sun)set.push([!E.gridOn,deye?'ปิด On Grid always on (ไม่ใช้ไฟกริดชาร์จรถ)':'ปิด On grid always on (ไม่ใช้ไฟกริดชาร์จรถ)'],[E.off>=30,`${deye?'Smart Load OFF Batt':'Smart load OFF SOC'} ≥ 30% ไม่ดึงแบตต่ำกว่า 30%`],[M.reserve<=E.off,`${deye?'Low Batt':'Battery reserve'} (${M.reserve}%) ไม่เกิน OFF (${E.off}%) ไม่เช่นนั้นแบตไม่จ่ายให้รถแล้วดึงไฟกริดแทน`]);
  if(sun&&deye)set.push([E.pvMin>=1.5,'Power (PV ≥) ตั้ง 1500 W เริ่มชาร์จเมื่อแผงผลิตพอ']);
  if(!sun)set.push([E.off>=60,`${deye?'Smart Load OFF Batt':'Smart load OFF SOC'} ≥ 60% เหลือแบตไว้ให้โหลดบ้านตลอดช่วงไฟดับ (ตอนนี้ ${E.off}%)`],[!E.gridOn,deye?'ปิด On Grid always on':'ปิด On grid always on']);
  const D=sgRun({mode:'on',out:'none',cloud:20,soc0:50,car0:30,arr:9,dep:17,load:100}),X=sgRun(Object.assign({mode:'on',out:'eve',soc0:100,car0:30,dep:7,load:50},deye?{cloud:30,arr:14}:{cloud:0,arr:17}));
  const dash=[[D.T.over+X.T.over===0,'ไม่ overload ตัด Smart Load (ทดสอบวันปกติและวันไฟดับตอนเย็น)',D.T.over+X.T.over>0?'err':'']];
  if(sun)dash.push([D.T.sl>=4,`วันมีแดด: ชาร์จรถได้ ${sgF(D.T.sl,1)} kWh (ต้อง ≥ 4)`],[D.T.slGrid<=.3,`ไม่ใช้ไฟกริดชาร์จรถ (ใช้ ${sgF(D.T.slGrid,1)} kWh ต้อง ≤ 0.3)`,D.T.slGrid>.3?'err':''],[D.T.minSocSL>=28,`ไม่ดึงแบตชาร์จรถเมื่อ SOC ต่ำกว่า 30% (ตอนชาร์จต่ำสุด ${sgF(D.T.minSocSL)}%)`]);
  else dash.push([X.T.uns<.05,`ไฟดับตอนเย็น: โหลดบ้านไม่ดับ (ขาด ${sgF(X.T.uns,2)} kWh)`,X.T.uns>=.05?'err':''],[X.T.sl>=.5,`ยังชาร์จรถได้ตอนมีแบตเหลือ (${sgF(X.T.sl,1)} kWh ต้อง ≥ 0.5)`]);
  return{job,set,dash,D,X};
}
function sgScore(){const c=sgChecks(),all=[...c.job,...c.set,...c.dash],n=all.filter(x=>x[0]).length;return{c,n,all:all.length,ok:n===all.length}}
function sgChanged(full){SG._c=null;const s=sgScore();if(s.ok)SG.done[SG.sc]=true;if(full!==false)sgRender();else sgLive();if(typeof touch==='function')touch()}
const sgDone=()=>Object.keys(SG_SC).filter(k=>SG.done[k]).length;
const sgList=a=>`<ul class="slchk">${a.map(([ok,t,l])=>`<li class="${ok?'ok':l==='err'?'err':''}">${esc(t)}</li>`).join('')}</ul>`;
/* ---- UI ---- */
const sgSel=(path,opts,v)=>`<select class="hn" data-sgs="${path}" id="sgs-${path.replace(/\./g,'-')}">${opts.map(([k,t])=>`<option value="${k}" ${String(v)===String(k)?'selected':''}>${esc(t)}</option>`).join('')}</select>`;
const sgNum=(path,v,min,max,step,u)=>`<span class="slnum"><input class="hn" type="number" data-sgs="${path}" id="sgs-${path.replace(/\./g,'-')}" value="${v}" min="${min}" max="${max}" step="${step||1}"><i>${u||''}</i></span>`;
const sgChk=(path,v,t)=>`<label class="slck"><input class="hn" type="checkbox" data-sgs="${path}" id="sgs-${path.replace(/\./g,'-')}" ${v?'checked':''}> ${t||''}</label>`;
const sgRow=(l,c)=>`<div class="slrow"><span>${l}</span><span>${c}</span></div>`;
const sgPages=()=>[['job','1 ใบสั่งงานและการต่อ'],['host',`2 จอเครื่อง ${sgSc().host==='deye'?'Deye':'Solis'}`],['dash','3 แดชบอร์ดและทดสอบ']];
function sgRender(){
  const host=document.getElementById('sghost');if(!host)return;
  const s=sgScore(),sc=sgSc();if(!sgPages().some(p=>p[0]===SG.page))SG.page='job';const pg=SG.page;
  host.innerHTML=`<div class="verdict ${s.ok?'ok':s.n/s.all>.6?'warn':'err'}"><b>${esc(sc.n)}</b><span>${s.ok?'ผ่านครบทุกข้อ':'ผ่าน '+s.n+' / '+s.all+' ข้อ'}</span><span class="nums">ผ่านแล้ว ${sgDone()}/4 ระบบ</span></div>
  <div class="bar"><div class="grp" role="group" aria-label="ระบบ"><span class="lab">ระบบ</span>${Object.entries(SG_SC).map(([k,v])=>`<button class="chip" data-sgsc="${k}" aria-pressed="${SG.sc===k}">${SG.done[k]?'✓ ':''}${esc(v.n)}</button>`).join('')}</div></div>
  <div class="bar"><div class="grp" role="group" aria-label="ขั้นตอน">${sgPages().map(([k,t])=>`<button class="chip" data-sgpg="${k}" aria-pressed="${pg===k}">${t}</button>`).join('')}</div></div>
  <div id="sgpage">${pg==='job'?sgPgJob(s):pg==='host'?sgPgHost(s):sgPgDash(s)}</div>`;
  sgLive();
}
function sgSLD(){
  const hn=sgHost().n.split(' ')[0],g=SG.gen,ln=(a,b,c,d,cl)=>`<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" class="${cl||'cpw'}"/>`;
  const box=(x,y,w,h,t,t2,cl)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" class="cpb ${cl||''}"/><text x="${x+w/2}" y="${y+h/2-(t2?2:-4)}" text-anchor="middle" class="svgt" font-size="12">${esc(t)}</text>${t2?`<text x="${x+w/2}" y="${y+h/2+13}" text-anchor="middle" class="svgt mut" font-size="10">${esc(t2)}</text>`:''}`;
  let o=box(10,100,90,44,'กริด','PEA/MEA')+box(130,100,90,44,'ตู้เมน')+box(260,90,150,64,hn+' Hybrid','GRID · GEN · LOAD','hy')+box(450,100,90,44,'โหลดบ้าน','Backup')+box(250,8,170,44,g==='ev'?'Wall charger รถ EV':g==='house'?'ตู้เมนบ้าน':'ว่าง',g==='ev'?'Smart Load':'','sr');
  o+=ln(100,122,130,122)+ln(220,122,260,122)+ln(410,122,450,122)+`<text x="335" y="82" text-anchor="middle" class="svgt mut" font-size="10">GEN</text>`;
  if(g!=='none')o+=ln(335,52,335,90,g==='house'?'cpw bad':'cpw');
  return `<svg viewBox="0 0 560 170" role="img" aria-label="ผังการต่อ Smart Load">${o}</svg>`;
}
function sgPgJob(s){
  const H=sgHost(),sc=sgSc();
  return `<div class="cards"><div class="card"><h3>ใบสั่งงาน</h3><p>${esc(sc.brief)}</p>
    <table class="t"><tbody><tr><th>Hybrid</th><td>${esc(H.n)} · แบต ${sgF(H.cap,2)} kWh · พิกัด ${H.pac} kW</td></tr><tr><th>พอร์ต GEN (Smart Load)</th><td>สูงสุด ${H.port} kW (ค่าในแบบจำลอง)</td></tr><tr><th>รถ EV</th><td>แบต ${SG_CAR.cap} kWh</td></tr></tbody></table>
    <div class="tblwrap">${sgSLD()}</div></div>
    <div class="card"><h3>การต่อและ wall charger</h3>
    ${sgRow('สิ่งที่ต่อที่พอร์ต GEN',sgSel('gen',SG_GEN_OPTS,SG.gen))}
    ${sgRow('กระแสชาร์จของ wall charger',sgNum('chA',SG.chA,6,32,1,'A')+` = ${sgF(sgChargerKW(SG),2)} kW`)}
    <p class="hint tight">1 เฟส 230 V · กระแสสูงเกินพอร์ต GEN หรือพิกัดเครื่องเมื่อรวมโหลดบ้าน เครื่องจะตัด Smart Load</p>
    <h3>ตรวจการต่อ</h3>${sgList(s.c.job)}</div></div>`;
}
function sgHome(){const r=sgDay().rows[SG.dash.t];
  return `<table class="t"><tbody><tr><th>เวลา</th><td>${sgHM(r.i)} ${r.up?'':'(ไฟกริดดับ)'}</td><th>Smart Load (GEN)</th><td>${r.slOn?'ON':'OFF'} ${sgF(r.sl*1000)} W</td></tr><tr><th>PV</th><td>${sgF(r.pH*1000)} W</td><th>โหลด Backup</th><td>${sgF(r.L*1000)} W</td></tr><tr><th>กริด</th><td>${sgF(r.grid*1000)} W</td><th>แบต / SOC</th><td>${sgF(r.bat*1000)} W / ${sgF(r.soc)} %</td></tr></tbody></table><p class="hmiinfo">แตะ System Setup เพื่อเข้าตั้งค่า</p>`}
function sgPgHost(s){
  const deye=sgSc().host==='deye';
  return `<div class="cards"><div class="card sldevcard">${hlDevice(sgSc().host,SG,sgHome(),'')}<p class="hint tight">${deye?'ไป System Setup › Gen Port Use เลือก Smart Load Output':'ไป SYSTEM SETTING › SMART PORT เลือก Smart load output'}</p></div>
    <div class="card"><h3>ตรวจการตั้งค่า</h3>${sgList(s.c.set)}<p class="hint tight">ชื่อรายการบนจอและคำอธิบายตามคู่มือ ${deye?'Deye SUN-3/3.6/5/6K-SG04LP1-EU-SM2 (2026-01) ข้อ 5.10':'Solis S6-EH1P(3-8)K-L-PLUS V1.3 ข้อ 5.4.3 Step 7'} · ผลของการตั้งค่านี้ดูที่หน้า "แดชบอร์ดและทดสอบ"</p></div></div>`;
}
function sgLive(){
  const el=document.getElementById('sglive');if(!el)return;const r=sgDay().rows[SG.dash.t];
  el.innerHTML=`<table class="t"><tbody><tr><th>เวลา</th><td><b>${sgHM(r.i)}</b> ${r.up?'':'<span class="pill warn">ไฟกริดดับ</span>'}${r.plug?'':' <span class="pill">รถไม่ได้เสียบ</span>'}${r.over?' <span class="pill err">Overload ตัด Smart Load</span>':''}</td><th>Smart Load (GEN)</th><td><b>${r.slOn?'ON':'OFF'}</b> ${sgF(r.sl,2)} kW</td></tr>
  <tr><th>แผง</th><td>${sgF(r.pH,2)} kW</td><th>โหลดบ้าน</th><td>${sgF(r.L,2)} kW</td></tr>
  <tr><th>กริด</th><td>${r.up?(r.grid>.005?'ซื้อ '+sgF(r.grid,2)+' kW':'ไม่ซื้อ'):'ไม่มีไฟกริด'}</td><th>แบต</th><td>${r.bat>=0?'ชาร์จ ':'จ่าย '}${sgF(Math.abs(r.bat),2)} kW · SOC ${sgF(r.soc)}%</td></tr>
  <tr><th>แบตรถ</th><td>${sgF(r.car)}%</td><th>โหลดบ้านขาดไฟ</th><td>${sgF(r.uns,2)} kW</td></tr></tbody></table>`;
  const n=document.getElementById('sgnow');if(n){const x=40+(640-40-20)*r.i/47;n.setAttribute('x1',x);n.setAttribute('x2',x)}
}
function sgChart(){
  const rows=sgDay().rows,W=640,H=200,L=40,R=36,B=22,Tp=10,mx=6,x=i=>L+(W-L-R)*i/47,y=v=>Tp+(H-Tp-B)*(1-(v+mx)/(2*mx)),ys=v=>Tp+(H-Tp-B)*(1-v/100);
  const path=(f,cls)=>`<path d="${rows.map((r,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+f(r).toFixed(1)).join(' ')}" class="slc ${cls}"/>`;
  let out=rows.map((r,i)=>r.up?'':`<rect x="${x(i)}" y="${Tp}" width="${(W-L-R)/47+.5}" height="${H-Tp-B}" class="slout"/>`).join('');
  out+=[-mx,0,mx].map(v=>`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" class="slgrid"/><text x="${L-4}" y="${y(v)+4}" class="svgt m mut" text-anchor="end" font-size="10">${v}k</text>`).join('');
  [0,6,12,18,24].forEach(h=>out+=`<text x="${x(Math.min(47,h*2))}" y="${H-6}" class="svgt m mut" text-anchor="middle" font-size="10">${h}:00</text>`);
  [0,50,100].forEach(v=>out+=`<text x="${W-R+4}" y="${ys(v)+4}" class="svgt m mut" font-size="10">${v}%</text>`);
  out+=path(r=>y(r.pH),'pv')+path(r=>y(r.L),'ld')+path(r=>y(r.sl),'sc')+path(r=>y(r.grid),'gd')+path(r=>ys(r.soc),'bt')+path(r=>ys(r.car),'ot2');
  out+=`<line x1="${x(SG.dash.t)}" x2="${x(SG.dash.t)}" y1="${Tp}" y2="${H-B}" class="slnow" id="sgnow"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="กราฟทั้งวัน">${out}</svg><div class="slleg"><span class="pv">แผง (kW)</span><span class="ld">โหลดบ้าน (kW)</span><span class="sc">Smart Load (kW)</span><span class="gd">ซื้อไฟกริด (kW)</span><span class="bt">SOC แบตบ้าน (%)</span><span class="ot2">แบตรถ (%)</span><span class="ot">ช่วงไฟกริดดับ</span></div>`;
}
function sgPgDash(s){
  const D=SG.dash,T=sgDay().T;
  return `<div class="card"><div class="bar"><div class="grp"><span class="lab">เวลา</span><input type="range" min="0" max="47" step="1" value="${D.t}" data-sgt id="sgtime" aria-label="เวลา"></div>
    <div class="grp"><span class="lab">ระบบ</span>${sgSel('dash.mode',SG_MODE,D.mode)}<span class="lab">ไฟดับ</span>${sgSel('dash.out',SG_OUT,D.out)}<span class="lab">เมฆ</span>${sgNum('dash.cloud',D.cloud,0,90,10,'%')}<span class="lab">โหลดบ้าน</span>${sgNum('dash.load',D.load,20,300,10,'%')}</div>
    <div class="grp"><span class="lab">SOC แบตบ้านเริ่มวัน</span>${sgNum('dash.soc0',D.soc0,10,100,5,'%')}<span class="lab">แบตรถเริ่ม</span>${sgNum('dash.car0',D.car0,0,95,5,'%')}<span class="lab">รถเสียบ</span>${sgNum('dash.arr',D.arr,0,23,1,'น.')}<span class="lab">ถึง</span>${sgNum('dash.dep',D.dep,0,23,1,'น.')}<span class="lab">กระแสชาร์จ</span>${sgNum('chA',SG.chA,6,32,1,'A')}</div></div>
    <div id="sglive"></div></div>
  <div class="cards"><div class="card"><h3>ทั้งวัน</h3><div class="tblwrap">${sgChart()}</div>
    <table class="t"><tbody><tr><th>แผงผลิต</th><td>${sgF(T.pv,1)} kWh</td><th>โหลดบ้าน</th><td>${sgF(T.load,1)} kWh</td></tr><tr><th>ชาร์จรถรวม</th><td>${sgF(T.sl,1)} kWh</td><th>แบตรถ</th><td>${sgF(T.car0)}% → ${sgF(T.car1)}%</td></tr><tr><th>ชาร์จรถจากแผง / แบต / กริด</th><td>${sgF(T.slPv,1)} / ${sgF(T.slBat,1)} / ${sgF(T.slGrid,1)} kWh</td><th>ซื้อไฟรวม</th><td>${sgF(T.imp,1)} kWh</td></tr><tr><th>SOC แบตบ้านต่ำสุด</th><td>${sgF(T.minSoc)}%</td><th>โหลดบ้านขาดไฟ</th><td>${sgF(T.uns,2)} kWh</td></tr></tbody></table></div>
   <div class="card"><h3>ผลทดสอบการทำงาน</h3>${sgList([...s.c.job.slice(1),...s.c.dash])}<p class="hint tight">ทดสอบอัตโนมัติ 2 วัน: วันมีแดด (เมฆ 20%, รถเสียบ 9–17 น.) และไฟดับ 18:00–22:00 (แบต 100%, โหลดบ้าน 50%, ${sgSc().host==='deye'?'เมฆ 30%, รถเสียบ 14–07 น.':'รถเสียบ 17–07 น.'}) ไม่ขึ้นกับตัวเลือกที่ปรับบนหน้านี้</p></div></div>`;
}
function sgSetPath(path,v){if(path==='chA'){SG.chA=v;return}const[g,k]=path.split('.');if(g==='dash')SG.dash[k]=v}
function sgEvents(){
  const host=document.getElementById('sghost');if(!host||host.dataset.on)return;host.dataset.on='1';
  host.addEventListener('click',e=>{
    if(hlClick(e,SG)){sgRender();return}
    const t=e.target.closest('[data-sgsc],[data-sgpg]');if(!t)return;const d=t.dataset;
    if(d.sgsc){if(SG.sc!==d.sgsc){SG.sc=d.sgsc;sgReset(SG)}sgChanged();return}
    if(d.sgpg){SG.page=d.sgpg;sgRender();if(typeof touch==='function')touch()}
  });
  host.addEventListener('change',e=>{
    if(hlChange(e,SG)){const keep=document.activeElement&&document.activeElement.id;sgChanged();if(keep){const el=document.getElementById(keep);if(el&&el!==document.activeElement)try{el.focus()}catch(_){}}return}
    const t=e.target,d=t.dataset;if(d.sgs==null)return;
    let v;if(t.type==='checkbox')v=t.checked;else if(t.type==='number'){v=+t.value;if(!isFinite(v))v=0;if(t.min!=='')v=Math.max(+t.min,v);if(t.max!=='')v=Math.min(+t.max,v)}else v=t.value;
    if(d.sgs==='gen')SG.gen=v;else sgSetPath(d.sgs,v);
    const keep=document.activeElement&&document.activeElement.id;sgChanged();
    if(keep){const el=document.getElementById(keep);if(el&&el!==document.activeElement)try{el.focus()}catch(_){}}
  });
  host.addEventListener('input',e=>{if(e.target.dataset.sgt==null)return;SG.dash.t=+e.target.value;sgLive();clearTimeout(host._tt);host._tt=setTimeout(()=>{if(typeof touch==='function')touch()},400)});
}
function sgRenderTab(){sgEvents();sgRender()}
function sgSnapshot(){const o=JSON.parse(JSON.stringify(SG));delete o._c;return o}
function sgRestore(o){
  if(!o||typeof o!=='object')return;
  if(SG_SC[o.sc])SG.sc=o.sc;if(['job','host','dash'].includes(o.page))SG.page=o.page;
  if(SG_GEN_OPTS.some(x=>x[0]===o.gen))SG.gen=o.gen;if(Number.isFinite(o.chA))SG.chA=Math.max(6,Math.min(32,o.chA));
  SG.hs=hlMerge(hlDef(SG_SC[SG.sc].host),o.hs);SG.lcd={scr:'home',stack:[]};if(o.lcd&&typeof o.lcd.scr==='string'&&/^[a-z]{2,10}$/.test(o.lcd.scr))SG.lcd.scr=o.lcd.scr;
  if(o.dash&&typeof o.dash==='object'){const d=SG_DEFDASH();Object.keys(d).forEach(k=>{if(typeof o.dash[k]===typeof d[k])d[k]=o.dash[k]});if(!SG_OUT.some(x=>x[0]===d.out))d.out='none';if(!SG_MODE.some(x=>x[0]===d.mode))d.mode='on';SG.dash=d}
  if(o.done&&typeof o.done==='object')Object.keys(SG_SC).forEach(k=>SG.done[k]=!!o.done[k]);
  SG._c=null;
}
function sgSummary(){const s=sgScore();return{sc:SG.sc,pass:s.n,all:s.all,done:Object.keys(SG.done).filter(k=>SG.done[k])}}
