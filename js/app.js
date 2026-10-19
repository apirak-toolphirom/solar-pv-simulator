/* ---- app shell: tabs, persistence, boot ---- */
const TABS=['equip','wiring','pv','load','backup'];
let curTab='equip',loadedState=false,saveTimer=0,dirtyCat=false;

function setNavH(){
  const mob=window.matchMedia('(max-width:760px)').matches,nav=$('#nav');
  document.documentElement.style.setProperty('--navh',mob?nav.offsetHeight+'px':'0px');
}
function showTab(t,fromHash){
  if(!TABS.includes(t))t='equip';
  curTab=t;
  TABS.forEach(x=>{$('#tab-'+x).hidden=x!==t});
  document.querySelectorAll('.navb').forEach(b=>{if(b.dataset.tab===t)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
  if(!fromHash){try{history.replaceState(null,'','#'+t)}catch(e){}}
  setNavH();
  requestAnimationFrame(()=>{
    if(t==='wiring')render();
    else if(t==='pv')drawCharts();
    else if(t==='load')drawLoadChart();
    else if(t==='backup')drawBackup();
    window.scrollTo(0,0);
  });
  touch();
}
function quickSel(){
  const mk=(kind,id)=>{
    const el=$('#'+id);if(!el)return;
    const cur=(pick(kind)||{}).id;
    el.innerHTML=CAT[kind].map(x=>`<option value="${esc(x.id)}" ${x.id===cur?'selected':''}>${esc(x.brand+' '+x.model)}</option>`).join('');
  };
  mk('panels','qpanel');mk('inverters','qinv');mk('inverters','kinv');mk('batteries','kbat');
}

/* ---- persistence ---- */
function snapshot(){
  return{v:1,tab:curTab,act:ACT,bank:BANK,
    wiring:{panels:st.panels,wires:st.wires,nextId:st.nextId,tmin:st.tmin,thot:st.thot},
    sim:{loc:$('#loc').value,lat:SIM.lat,lon:SIM.lon,refLat:SIM.refLat,refLon:SIM.refLon,date:SIM.date,tz:SIM.tz,tilt:SIM.tilt,az:SIM.az,sky:SIM.sky,amin:SIM.amin,amax:SIM.amax},
    loads:LOADS,nextLoad,bk:BK};
}
function setSt(t){const e=$('#savest');if(e)e.textContent=t}
function touch(cat){
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
    if(out.length)CAT[k]=out;
  });
}
function restoreProject(p){
  if(!p||typeof p!=='object')return;
  if(p.act&&typeof p.act==='object')['panel','inv','bat'].forEach(k=>{if(typeof p.act[k]==='string')ACT[k]=p.act[k]});
  if(p.bank){BANK.s=Math.max(1,Math.min(32,fin(p.bank.s,1)|0));BANK.p=Math.max(1,Math.min(32,fin(p.bank.p,1)|0))}
  const w=p.wiring;
  if(w&&Array.isArray(w.panels)&&w.panels.length&&Array.isArray(w.wires)){
    st.panels=w.panels.slice(0,MAXP).map(q=>({id:fin(q.id,0)|0,x:fin(q.x,24),y:fin(q.y,34),sx:fin(q.sx,0)|0,rot:((fin(q.rot,0)|0)%4+4)%4})).filter(q=>q.id>0);
    const ids=new Set(st.panels.map(q=>q.id));
    st.wires=w.wires.filter(x=>x&&typeof x.a==='string'&&typeof x.b==='string').filter(x=>[x.a,x.b].every(k=>k[0]==='i'||ids.has(+k.split(':')[0]))).map(x=>({a:x.a,b:x.b}));
    st.nextId=Math.max(fin(w.nextId,1),Math.max(0,...st.panels.map(q=>q.id))+1);
    st.sel=null;st.armed=null;
    st.tmin=fin(w.tmin,10);st.thot=fin(w.thot,70);
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
    LOADS=p.loads.filter(l=>l&&typeof l==='object').map(l=>({id:0,name:String(l.name||'').slice(0,60),w:Math.max(0,fin(l.w,0)),qty:Math.max(0,fin(l.qty,1)),start:clamp(fin(l.start,0),0,24),end:clamp(fin(l.end,24),0,24),duty:clamp(fin(l.duty,100),0,100),crit:l.crit?1:0}));
    LOADS.forEach((l,i)=>l.id=i+1);nextLoad=LOADS.length+1;
  }
  if(p.bk&&typeof p.bk==='object'){
    if(['grid','hybrid','off'].includes(p.bk.mode))BK.mode=p.bk.mode;
    if(['wiring','ideal'].includes(p.bk.src))BK.src=p.bk.src;
    if(['crit','all'].includes(p.bk.island))BK.island=p.bk.island;
    BK.nIdeal=clamp(fin(p.bk.nIdeal,9),1,200);BK.outStart=clamp(fin(p.bk.outStart,18),0,24);BK.outDur=clamp(fin(p.bk.outDur,6),0,24);BK.soc0=clamp(fin(p.bk.soc0,50),0,100);
  }
}
function refreshAll(){
  applyActive();eqRenderAll();bkSync();loadRender();
  lastSig='';render();runSim();
}

/* ---- reset ---- */
let rsArm=0;
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
  initCatalogUI();eqRenderAll();
  initLoads();initBackup();initReset();
  document.querySelectorAll('.navb').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));
  $('#qpanel').addEventListener('change',e=>{ACT.panel=e.target.value;onCatalogChange()});
  $('#qinv').addEventListener('change',e=>{ACT.inv=e.target.value;onCatalogChange()});
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
