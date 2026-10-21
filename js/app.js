/* ---- app shell: tabs, persistence, boot ---- */
const TABS=['equip','wiring','ac','pv','site','load','backup','systems','events','bench','submit'];
let curTab='equip',loadedState=false,saveTimer=0,dirtyCat=false;

function setNavH(){
  const mob=window.matchMedia('(max-width:760px)').matches,nav=$('#nav');
  document.documentElement.style.setProperty('--navh',mob?nav.offsetHeight+'px':'0px');
}
function showTab(t,fromHash){
  if(!TABS.includes(t))t='equip';
  if(typeof accAllowed==='function'&&!accAllowed(t))t=accFirst();
  curTab=t;document.body.dataset.tab=t;if(typeof ctxSchedule==='function')ctxSchedule();
  if(typeof fsOn!=='undefined'&&fsOn&&t!=='wiring')setFs(false);
  TABS.forEach(x=>{$('#tab-'+x).hidden=x!==t});
  document.querySelectorAll('.navb').forEach(b=>{if(b.dataset.tab===t)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
  if(!fromHash){try{history.replaceState(null,'','#'+t)}catch(e){}}
  setNavH();
  requestAnimationFrame(()=>{
    if(t==='wiring')render();
    else if(t==='ac')acRender();
    else if(t==='events')evRun();
    else if(t==='bench')bRender();
    else if(t==='pv')drawCharts();
    else if(t==='load')drawLoadChart();
    else if(t==='backup'){drawBackup();if(typeof bkaKick==='function')bkaKick()}
    else if(t==='site')siRun();
    else if(t==='systems'){sySync();syRun()}
    else if(t==='submit')submitRefresh();
    window.scrollTo(0,0);
  });
  touch();
}
/* theme: pastel light by default, dark on request (remembered per browser) */
function themeSet(t){document.documentElement.dataset.theme=t;try{localStorage.setItem('pvsim:theme',t)}catch(e){}
  const b=$('#themebtn');if(b)b.textContent=t==='dark'?'☀ โทนสว่าง':'☾ โทนมืด';
  if(typeof drawBackup==='function')try{drawBackup()}catch(e){}}
document.addEventListener('DOMContentLoaded',()=>{const b=$('#themebtn');if(!b)return;themeSet(document.documentElement.dataset.theme==='dark'?'dark':'light');
  b.addEventListener('click',()=>themeSet(document.documentElement.dataset.theme==='dark'?'light':'dark'))});
function quickSel(){
  const mk=(kind,id)=>{
    const el=$('#'+id);if(!el)return;
    const cur=(pick(kind)||{}).id;
    el.innerHTML=CAT[kind].filter(x=>kind!=='batteries'||x.id===cur||batCompat(x)).map(x=>`<option value="${esc(x.id)}" ${x.id===cur?'selected':''}>${esc(x.brand+' '+x.model)}</option>`).join('');
  };
  mk('panels','qpanel');mk('inverters','qinv');mk('inverters','kinv');mk('inverters','acinv');mk('batteries','kbat');
}

/* ---- persistence ---- */
function snapshot(){
  return{v:1,tab:curTab,act:ACT,bank:BANK,
    wiring:{panels:st.panels,wires:st.wires,nextId:st.nextId,tmin:st.tmin,thot:st.thot,scale:st.scale,mp:INV},
    sim:{loc:$('#loc').value,lat:SIM.lat,lon:SIM.lon,refLat:SIM.refLat,refLon:SIM.refLon,date:SIM.date,tz:SIM.tz,tilt:SIM.tilt,az:SIM.az,sky:SIM.sky,amin:SIM.amin,amax:SIM.amax},
    loads:LOADS,nextLoad,bk:BK,ev:EV,ac:{wm:Object.assign({},ACS.wm,AC_KEY?{[AC_KEY]:ACS.wires}:{}),pm:Object.assign({},ACS.pm,AC_KEY?{[AC_KEY]:ACS.pos}:{}),scm:Object.assign({},ACS.scm,AC_KEY?{[AC_KEY]:ACS.msc}:{}),rh:ACS.rh,set:ACS.set,apply:ACS.apply,zoom:ACS.zoom},sc:{view:SC.view,h:SC.h},bn:bSnapshot(),sy:SY,site:siSnapshot()};
}
function setSt(t){const e=$('#savest');if(e)e.textContent=t}
function touch(cat){
  if(typeof ctxSchedule==='function')ctxSchedule();
  if(!window.APP_READY||!loadedState)return;
  if(cat)dirtyCat=true;
  setSt('กำลังบันทึก…');
  clearTimeout(saveTimer);saveTimer=setTimeout(flush,700);
}
async function flush(){
  let ok=await Store.save('project',snapshot());
  if(dirtyCat){ok=(await Store.save('catalog',{panels:CAT.panels,inverters:CAT.inverters,batteries:CAT.batteries}))&&ok;dirtyCat=false}
  setSt(ok?(Store.db?'บันทึกแล้ว (ผูกกับบัญชีของคุณ)':'บันทึกแล้ว (ในเบราว์เซอร์นี้)'):'บันทึกไม่ได้');
}
const fin=(v,d)=>typeof v==='number'&&isFinite(v)?v:d;
function restoreCatalog(c){
  if(!c)return;
  KIND_ORDER.forEach(k=>{
    if(!Array.isArray(c[k]))return;
    const out=[];
    c[k].forEach(r=>{if(r&&typeof r==='object'){const {item,why}=normalizeItem(k,r);if(!why.length)out.push(item)}});
    if(!out.length)return;
    // built-in datasheet models always present: added if missing, refreshed if the user never edited them
    DEFAULT_CAT()[k].filter(d=>d.builtin).forEach(d=>{const i=out.findIndex(x=>x.id===d.id);if(i<0)out.push(d);else if(out[i].builtin)out[i]=d});
    CAT[k]=out;
  });
}
function restoreProject(p){
  if(!p||typeof p!=='object')return;
  restoreExtra(p);
  if(p.act&&typeof p.act==='object')['panel','inv','bat'].forEach(k=>{if(typeof p.act[k]==='string')ACT[k]=p.act[k]});
  if(p.bank){BANK.s=Math.max(1,Math.min(32,fin(p.bank.s,1)|0));BANK.p=Math.max(1,Math.min(32,fin(p.bank.p,1)|0))}
  const w=p.wiring;
  if(w&&Array.isArray(w.panels)&&w.panels.length&&Array.isArray(w.wires)){
    applyScale(fin(w.scale,1));
    st.panels=w.panels.slice(0,MAXP).map(q=>({id:fin(q.id,0)|0,x:fin(q.x,24),y:fin(q.y,34),sx:fin(q.sx,0)|0,rot:((fin(q.rot,0)|0)%4+4)%4})).filter(q=>q.id>0);
    const ids=new Set(st.panels.map(q=>q.id));
    st.wires=w.wires.filter(x=>x&&typeof x.a==='string'&&typeof x.b==='string').filter(x=>[x.a,x.b].every(k=>k[0]==='i'||ids.has(+k.split(':')[0]))).map(x=>({a:x.a,b:x.b}));
    st.nextId=Math.max(fin(w.nextId,1),Math.max(0,...st.panels.map(q=>q.id))+1);
    st.sel=null;st.armed=null;
    st.tmin=fin(w.tmin,10);st.thot=fin(w.thot,70);
    INV=INV0();
    if(Array.isArray(w.mp))w.mp.slice(0,2).forEach((o,i)=>{if(o&&typeof o==='object')INV[i]={x:fin(o.x,INV[i].x),y:fin(o.y,INV[i].y),r:((fin(o.r,0)|0)%4+4)%4}});
    else if(isFinite(w.ix)&&isFinite(w.iy)){const r=((fin(w.ir,0)|0)%4+4)%4,hz=r%2===1;INV=[{x:w.ix,y:w.iy,r},{x:w.ix+(hz?150:0),y:w.iy+(hz?0:180),r}]}
    clampInv();
    $('#tmin').value=st.tmin;$('#thot').value=st.thot;
  }
  const s=p.sim;
  if(s){
    ['tz','tilt','az','amin','amax'].forEach(k=>{if(typeof s[k]==='number'&&isFinite(s[k]))SIM[k]=s[k]});
    if(['clear','partly','overcast'].includes(s.sky))SIM.sky=s.sky;
    if(typeof s.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s.date))SIM.date=s.date;
    if(typeof s.loc==='string')$('#loc').value=s.loc;
    $('#date').value=SIM.date;$('#tz').value=SIM.tz;$('#sky').value=SIM.sky;$('#amin').value=SIM.amin;$('#amax').value=SIM.amax;$('#tilt').value=SIM.tilt;$('#az').value=SIM.az;
    setOrientUI();
    const r=parseLoc($('#loc').value);
    if(!r.err){SIM.lat=r.lat;SIM.lon=r.lon;if(r.kind!=='short'){SIM.refLat=r.lat;SIM.refLon=r.lon}}
    else if(isFinite(s.lat)&&isFinite(s.lon)){SIM.lat=s.lat;SIM.lon=s.lon;SIM.refLat=fin(s.refLat,s.lat);SIM.refLon=fin(s.refLon,s.lon)}
  }
  if(Array.isArray(p.loads)){
    LOADS=p.loads.filter(l=>l&&typeof l==='object').map((l,i)=>({id:0,name:String(l.name||'').slice(0,60),w:Math.max(0,fin(l.w,0)),qty:Math.max(0,fin(l.qty,1)),start:clamp(fin(l.start,0),0,24),end:clamp(fin(l.end,24),0,24),duty:clamp(fin(l.duty,100),0,100),crit:l.crit?1:0,ph:LOAD_PH.includes(l.ph)?l.ph:['L1','L2','L3'][i%3]}));
    LOADS.forEach((l,i)=>l.id=i+1);nextLoad=LOADS.length+1;
  }
  if(p.bk&&typeof p.bk==='object'){
    if(['grid','hybrid','off'].includes(p.bk.mode))BK.mode=BK.want=p.bk.mode;
    if(['wiring','ideal'].includes(p.bk.src))BK.src=p.bk.src;
    if(['crit','all'].includes(p.bk.island))BK.island=p.bk.island;
    BK.nIdeal=clamp(fin(p.bk.nIdeal,9),1,200);BK.outStart=clamp(fin(p.bk.outStart,18),0,24);BK.outDur=clamp(fin(p.bk.outDur,6),0,24);BK.soc0=clamp(fin(p.bk.soc0,50),0,100);
  }
}
function restoreExtra(p){
  const num=(v,d,lo,hi)=>clamp(fin(v,d),lo,hi);
  if(p.ev&&typeof p.ev==='object'){
    const c=p.ev.cloud||{},u=p.ev.dust||{},t=p.ev.tree||{};
    Object.assign(EV.cloud,{on:!!c.on,start:num(c.start,11,0,24),dur:num(c.dur,2,0,12),depth:num(c.depth,70,10,100)});
    Object.assign(EV.dust,{on:!!u.on,pct:num(u.pct,15,1,60)});
    if(p.ev.site)EV.site.on=!!p.ev.site.on;
    {const b=p.ev.bld||{};Object.assign(EV.bld,{on:!!b.on,h:num(b.h,15,1,200),d:num(b.d,12,1,200),az:num(b.az,270,0,359),w:num(b.w,20,1,200)})}
    Object.assign(EV.tree,{on:!!t.on,h:num(t.h,12,1,40),d:num(t.d,7,1,60),az:num(t.az,180,0,359),w:num(t.w,90,5,160),pct:num(t.pct,60,10,100),mppt:[0,1,2].includes(t.mppt)?t.mppt:0,ph:num(t.ph,3,0,20)});
  }
  if(p.ac&&typeof p.ac==='object'){
    /* wires and module positions per wiring mode (1 phase, 3 phase, 3 phase + 1 phase backup); old saves had one 1-phase set */
    const wm=p.ac.wm&&typeof p.ac.wm==='object'?p.ac.wm:{'1':p.ac.wires},pm=p.ac.pm&&typeof p.ac.pm==='object'?p.ac.pm:{'1':p.ac.pos};
    const scm=p.ac.scm&&typeof p.ac.scm==='object'?p.ac.scm:{};
    ACS.wm={};ACS.pm={};ACS.scm={};
    Object.keys(AC_MODES).forEach(m=>{
      const M=AC_MODES[m];
      if(Array.isArray(wm[m]))ACS.wm[m]=wm[m].filter(w=>w&&M.TM[w.a]&&M.TM[w.b]).map(w=>({a:w.a,b:w.b}));
      const P=pm[m];if(P&&typeof P==='object'){const o={};Object.keys(M.C).forEach(k=>{const a=P[k];if(Array.isArray(a)){const x=Math.round(num(a[0],0,-2000,2000)/10)*10,y=Math.round(num(a[1],0,-2000,2000)/10)*10;if(x||y)o[k]=[Math.max(-M.C[k].x,x),Math.max(-M.C[k].y,y)]}});ACS.pm[m]=o}
      const Q=scm[m];if(Q&&typeof Q==='object'){const o={};Object.keys(M.C).forEach(k=>{const v=+Q[k];if(isFinite(v)&&v!==1)o[k]=Math.max(AC_SMIN,Math.min(AC_SMAX,Math.round(v*20)/20))});ACS.scm[m]=o}
    });
    ACS.rh=num(p.ac.rh,12,0,23.75);
    const s=p.ac.set||{},S=ACS.set,pick=(k,opts)=>{if(opts.includes(s[k]))S[k]=s[k]};
    pick('supply',['1','3']);pick('mode',['selfuse','feedin','backup']);pick('gridStd',['PEA','MEA','other']);pick('meterType',['ct','meter','none']);pick('ctPos',['gridL','loadL','invL','N']);pick('ctDir',['toGrid','toLoad']);
    pick('batType',['li','lead']);pick('batComm',['can','rs485','none']);pick('genMode',['off','charge','supply']);pick('mBaud',[2400,4800,9600,19200]);pick('iBaud',[2400,4800,9600,19200]);
    pick('cbGrid',[16,20,25,32,40,50,63]);pick('cbBackup',[16,20,25,32,40,50,63]);
    S.reserve=num(s.reserve,20,0,100);S.expLimW=num(s.expLimW,0,0,20000);S.mAddr=num(s.mAddr,1,1,247);S.iAddr=num(s.iAddr,1,1,247);S.expLimOn=!!s.expLimOn;S.backupEn=s.backupEn!==false;
    ACS.apply=!!p.ac.apply;
    AC_MODE=null;AC_KEY=null;acEnsureMode();
    ACS.zoom=num(p.ac.zoom,1,.5,2.5);
  }
  if(p.bn)bRestore(p.bn);
  if(p.sy)syRestore(p.sy);
  if(p.site)siRestore(p.site);
  if(p.sc&&['top','side'].includes(p.sc.view)){SC.view=p.sc.view;SC.h=num(p.sc.h,12,0,24)}
}
function refreshAll(){
  autoBat();applyActive();if(typeof quickSel==='function')quickSel();eqRenderAll();bkSync();loadRender();
  lastSig='';render();acRender();runSim();
  if(typeof ctxSchedule==='function')ctxSchedule();
}

/* ---- reset ---- */
let rsArm=0;
function applyProjectFile(o){restoreCatalog(o.catalog);restoreProject(o.project);refreshAll();bSyncCtl();bRender();touch(true)}
function projectFile(){return{app:'pvsim',v:1,saved:new Date().toISOString(),project:snapshot(),catalog:{panels:CAT.panels,inverters:CAT.inverters,batteries:CAT.batteries}}}
function initFile(){
  $('#savefile').addEventListener('click',()=>{
    const o=projectFile();
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(o)],{type:'application/json'}));
    a.download='solar-project-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
  });
  $('#openfile').addEventListener('click',()=>$('#openfilein').click());
  $('#openfilein').addEventListener('change',async e=>{
    const f=e.target.files[0];e.target.value='';if(!f)return;
    try{
      const o=JSON.parse(await f.text());
      if(!o||o.app!=='pvsim'||!o.project)throw 0;
      applyProjectFile(o);
      setSt('เปิดไฟล์แล้ว: '+f.name);
    }catch(err){setSt('ไฟล์นี้ไม่ใช่ไฟล์โปรเจ็คของโปรแกรมนี้')}
  });
}
function initReset(){
  const b=$('#resetall');
  b.addEventListener('click',async()=>{
    if(!rsArm){b.textContent='กดอีกครั้งเพื่อยืนยัน';rsArm=setTimeout(()=>{rsArm=0;b.textContent='เริ่มใหม่ทั้งโปรเจ็ค'},3500);return}
    clearTimeout(rsArm);rsArm=0;b.disabled=true;b.textContent='กำลังล้าง…';
    await Store.clear('project');await Store.clear('catalog');
    try{location.reload()}catch(e){b.textContent='ล้างแล้ว โหลดหน้าใหม่'}
  });
}

/* ---- boot ---- */
(function boot(){
  initSim();resetWith(1);
  ctxInit();initCatalogUI();initTeach();eqRenderAll();initPdfImport();
  initLoads();initSite();initBackup();if(typeof initBkAnim==='function')initBkAnim();initSystems();initAC();initBench();initEvents();initSubmit();initWorksheets();initAccess();initReset();initFile();initCloud();initConfirm();
  document.querySelectorAll('.navb').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));
  $('#qpanel').addEventListener('change',e=>{ACT.panel=e.target.value;onCatalogChange()});
  $('#qinv').addEventListener('change',e=>{ACT.inv=e.target.value;onCatalogChange()});
  $('#acinv').addEventListener('change',e=>{ACT.inv=e.target.value;onCatalogChange()});
  $('#kinv').addEventListener('change',e=>{ACT.inv=e.target.value;onCatalogChange()});
  $('#kbat').addEventListener('change',e=>{ACT.bat=e.target.value;onCatalogChange()});
  window.addEventListener('hashchange',()=>showTab(location.hash.slice(1),true));
  window.addEventListener('resize',()=>{setNavH();drawLoadChart();drawBackup()});
  const h=(location.hash||'').slice(1);
  showTab(TABS.includes(h)?h:'equip',true);
  render();runSim();
  setSt('กำลังโหลดข้อมูลที่บันทึกไว้…');
  (async()=>{
    try{
      await Store.init();
      restoreCatalog(await Store.load('catalog'));
      const p=await Store.load('project');
      restoreProject(p);
      refreshAll();
      if(p&&TABS.includes(p.tab)&&!TABS.includes(h))showTab(p.tab,true);
    }catch(e){}
    loadedState=true;
    setSt(Store.db?'พร้อมใช้งาน · บันทึกอัตโนมัติ (บัญชีของคุณ)':'พร้อมใช้งาน · บันทึกอัตโนมัติ (ในเบราว์เซอร์นี้)');
    window.APP_READY=true;
  })();
})();
