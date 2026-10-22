/* ---- member, report image, submit ---- */
const CFG=Object.assign({COURSE:'จำลองระบบโซลาร์',SUBMIT_URL:'',GOOGLE_CLIENT_ID:''},window.APP_CONFIG||{});
const MEM_KEY='pvsim:member',SUBS_KEY='pvsim:subs';
const SANS='"Noto Sans Thai","Leelawadee UI","Sarabun",Tahoma,"Segoe UI",sans-serif',MONO='"IBM Plex Mono",Consolas,Menlo,monospace';
let MEMBER={name:'',sid:'',cls:'',gemail:'',gname:''},gToken='',lastImg=null,sending=false;
const lsGet=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const clip=(s,n)=>String(s==null?'':s).slice(0,n);

/* ---- what gets reported ---- */
function buildReport(){
  const A=lastA,I=curInv(),P=curPanel(),bi=bankInfo(),bat=curBat();
  const r={t:new Date(),course:CFG.COURSE,panel:PV.name,inverter:I.name,
    battery:bi?`${bat.brand} ${bat.model} × ${bi.s}S${bi.p}P (${f(bi.V,1)} V ${f(bi.kwh,1)} kWh)`:'-',
    wiring:null,issues:[],pv:null,load:null,bk:null};
  if(A){
    r.wiring={lvl:A.lvl,err:A.cnt.err,warn:A.cnt.warn,ok:A.cnt.ok,panels:st.panels.length,used:A.used,kwp:A.pv/1000,ratio:A.ratio,
      topo:A.res.map(x=>`MPPT ${x.k}: ${x.status==='idle'?'ว่าง':x.short}`).join(' | ')};
    [...A.res.flatMap(x=>x.ck.map(c=>({lvl:c.lvl,t:`MPPT ${x.k}: ${c.t}`}))),...A.sys].forEach(c=>{if(c.lvl!=='ok')r.issues.push({lvl:c.lvl,t:c.t})});
    r.issues.sort((a,b)=>RANK[a.lvl]-RANK[b.lvl]);
    const blocks=A.res.map(x=>x.status==='ok'?x.blk:null);
    if(blocks.some(Boolean)){const R=simDay(blocks,A.I,SIM.tilt,SIM.az,5);r.pv={E:R.E,peak:R.peak/1000,tilt:SIM.tilt,az:SIM.az,date:SIM.date}}
  }
  const LP=loadProfile(5),k=5/60/1000;
  r.load={E:LP.all.reduce((a,b)=>a+b,0)*k,Ec:LP.crit.reduce((a,b)=>a+b,0)*k,peak:Math.max(0,...LP.all)/1000,n:LOADS.length};
  if(typeof backupRun==='function')backupRun();
  if(window.lastBK)r.bk=window.lastBK;
  if(typeof acAnalyze==='function'){if(typeof acRender==='function')acRender();r.ac=window.lastAC||null}
  r.site=typeof siSummary==='function'?siSummary():'';
  {const w=typeof wsCur==='function'?wsCur():null;if(w){const E=wsEval(w);r.ws={id:w.id,name:w.name,img:w.img,pass:E.pass,fail:E.fail,items:E.items,qs:wsQs(w),ans:wsAnswers(w)}}}
  r.ev=(typeof EV!=='undefined'&&evActive())?[EV.cloud.on?`เมฆ ${EV.cloud.depth}%`:'',EV.dust.on?`ฝุ่น ${EV.dust.pct}%`:'',EV.tree.on?`ต้นไม้ ${EV.tree.h} ม.`:'',EV.bld.on?`ตึก ${EV.bld.h} ม.`:'',typeof evSiteActive==='function'&&evSiteActive()?'เงาจากผังไซต์':''].filter(Boolean).join(', ')+' · '+SIM.date:'';
  return r;
}
const wLabel=w=>!w?'ยังไม่มีผลการต่อสาย':({ok:'ต่อถูกต้อง ผ่านทุกข้อ',warn:`ใช้ได้ แต่มี ${w.warn} ข้อควรระวัง`,err:`มี ${w.err} ข้อที่ไม่ผ่าน`,idle:'ยังไม่ได้ต่อสายเข้าอินเวอร์เตอร์'})[w.lvl];
function reportLines(r){
  const w=r.wiring;
  return[
    ...(r.ws?[['ใบงาน',`${r.ws.id} ${r.ws.name} · ${r.ws.pass?'ครบเกณฑ์':'ยังไม่ครบ '+r.ws.fail.length+' ข้อ'}`]]:[]),
    ['ผลการต่อสาย',wLabel(w)],
    ['แผง / กำลังรวม',w?`${w.used}/${w.panels} แผง · ${f(w.kwp,2)} kWp · DC/AC ${f(w.ratio,2)}`:'-'],
    ['รูปแบบการต่อ',w?w.topo:'-'],
    ['แผงที่ใช้',r.panel],['อินเวอร์เตอร์',r.inverter],['แบตเตอรี่',r.battery],
    ['ผลิตต่อวัน',r.pv?`${f(r.pv.E,1)} kWh (สูงสุด ${f(r.pv.peak,2)} kW · เอียง ${r.pv.tilt}° · ทิศ ${r.pv.az}°)`:'-'],
    ['โหลดต่อวัน',`${f(r.load.E,1)} kWh (โหลด Backup ${f(r.load.Ec,1)} kWh · สูงสุด ${f(r.load.peak,2)} kW)`],
    ['Backup',r.bk?`${({grid:'On-grid',hybrid:'Hybrid',off:'Off-grid'})[r.bk.mode]}: ${r.bk.vt}`:'-'],
    ['ต่อสาย AC',r.ac&&r.ac.lvl!=='idle'?r.ac.txt:'ยังไม่ได้ต่อสาย AC'],
    ['เหตุการณ์ที่จำลอง',r.ev||'ไม่มี'],
    ['ไซต์และเงา',r.site||'ยังไม่ได้วางผัง']
  ];
}

/* ---- report image (canvas, no external libs) ---- */
function svgToImage(id){
  return new Promise((res,rej)=>{
    const src=document.getElementById(id||'svg');if(!src){rej(new Error('nosvg'));return}
    const vb=src.viewBox&&src.viewBox.baseVal,IW=1520,IH=vb&&vb.width?Math.round(IW*vb.height/vb.width):880;
    constclone=src.cloneNode(true),a=src.querySelectorAll('*'),b=clone.querySelectorAll('*'),rm=[];
    const props=['fill','stroke','stroke-width','stroke-dasharray','stroke-linecap','stroke-linejoin','opacity','fill-opacity','stroke-opacity','font-size','font-weight','text-anchor','paint-order','stop-color'];
    a.forEach((el,i)=>{
      const t=b[i],tag=el.tagName.toLowerCase();
      if(el.classList.contains('hit')||el.classList.contains('whit')||tag==='title'){rm.push(t);return}
      const cs=getComputedStyle(el);let s='';
      props.forEach(p=>{const v=cs.getPropertyValue(p);if(v)s+=p+':'+v+';'});
      if(tag==='text')s+='font-family:'+(el.classList.contains('m')||el.classList.contains('onp')||el.classList.contains('tt')?MONO:SANS)+';';
      t.setAttribute('style',s);t.removeAttribute('class');
    });
    rm.forEach(n=>n.remove());
    clone.setAttribute('xmlns','http://www.w3.org/2000/svg');clone.setAttribute('width',IW);clone.setAttribute('height',IH);clone.removeAttribute('style');clone.removeAttribute('class');
    const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)],{type:'image/svg+xml;charset=utf-8'}));
    const im=new Image();im.onload=()=>{URL.revokeObjectURL(url);res(im)};im.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('svg'))};im.src=url;
  });
}
function wrapLines(ctx,text,maxW){
  const seg=typeof Intl!=='undefined'&&Intl.Segmenter?[...new Intl.Segmenter('th',{granularity:'word'}).segment(String(text))].map(s=>s.segment):[...String(text)];
  const out=[];let cur='';
  seg.forEach(w=>{
    if(ctx.measureText(cur+w).width<=maxW||!cur){cur+=w}else{out.push(cur.trimEnd());cur=w.trimStart()}
  });
  if(cur)out.push(cur);
  return out.length?out:[''];
}
async function renderReportImage(r,mem,receipt){
  const cs=getComputedStyle(document.documentElement),v=n=>cs.getPropertyValue(n).trim()||'#000';
  const W=1200,pad=40,iw=W-pad*2;
  let img=null;const sid=r.ws?WS_IMG[r.ws.img||'none']:'svg';if(sid){try{img=await svgToImage(sid)}catch(e){}}
  const cv=document.createElement('canvas');cv.width=W;cv.height=3200;
  const c=cv.getContext('2d');
  c.fillStyle=v('--bg');c.fillRect(0,0,W,3200);
  let y=pad;
  const text=(s,x,yy,font,col,align)=>{c.font=font;c.fillStyle=col;c.textAlign=align||'left';c.textBaseline='alphabetic';c.fillText(s,x,yy)};
  const para=(s,x,font,col,maxW,lh)=>{c.font=font;wrapLines(c,s,maxW).forEach(l=>{text(l,x,y,font,col);y+=lh})};
  /* header */
  c.fillStyle=v('--surface');c.fillRect(pad-10,y-10,iw+20,128);c.strokeStyle=v('--line');c.lineWidth=2;c.strokeRect(pad-10,y-10,iw+20,128);
  y+=28;text(r.course,pad+8,y,`600 30px ${SANS}`,v('--ink'));
  y+=40;text(`${mem.name||'(ไม่ระบุชื่อ)'}${mem.sid?'  ·  '+mem.sid:''}${mem.gemail?'  ·  '+mem.gemail:''}`,pad+8,y,`500 24px ${SANS}`,v('--ink'));
  y+=36;const d=r.t,ds=`${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  text(`${ds}   รหัสใบส่งงาน ${receipt||'ยังไม่ส่ง'}`,pad+8,y,`400 20px ${MONO}`,v('--muted'));
  y+=56;
  /* verdict */
  const w=r.wiring,lvl=w?w.lvl:'idle',col={ok:v('--ok'),warn:v('--warn'),err:v('--err'),idle:v('--muted')}[lvl],bg={ok:v('--okbg'),warn:v('--warnbg'),err:v('--errbg'),idle:v('--surface')}[lvl];
  c.fillStyle=bg;c.fillRect(pad,y,iw,64);c.fillStyle=col;c.fillRect(pad,y,8,64);
  text(`${lvl==='idle'?'รอต่อสาย':LABEL[lvl]}  ·  ${wLabel(w)}`,pad+28,y+42,`600 26px ${SANS}`,col);
  y+=92;
  /* diagram */
  if(img){const h=Math.round(iw*img.height/img.width);c.fillStyle=v('--surface');c.fillRect(pad,y,iw,h);c.strokeStyle=v('--line');c.strokeRect(pad,y,iw,h);c.drawImage(img,pad,y,iw,h);y+=h+32}
  /* summary rows */
  text('สรุปผล',pad,y+4,`600 22px ${SANS}`,v('--muted'));y+=30;
  reportLines(r).forEach(([k,val])=>{
    c.strokeStyle=v('--line');c.beginPath();c.moveTo(pad,y-4);c.lineTo(pad+iw,y-4);c.stroke();
    y+=22;text(k,pad+4,y,`500 20px ${SANS}`,v('--muted'));
    const y0=y;c.font=`500 21px ${SANS}`;const ls=wrapLines(c,val,iw-260);
    ls.forEach((l,i)=>{text(l,pad+250,y0+i*30,`500 21px ${SANS}`,v('--ink'))});
    y=y0+(ls.length-1)*30+18;
  });
  y+=22;
  /* worksheet checklist and answers */
  if(r.ws&&(r.ws.items.length||r.ws.qs.length)){
    text(`ใบงาน ${r.ws.id}: เกณฑ์และคำตอบ`,pad,y+4,`600 22px ${SANS}`,v('--muted'));y+=34;
    r.ws.items.forEach(it=>{const cc=it.ok?v('--ok'):it.ok===null?v('--muted'):v('--warn');c.fillStyle=cc;c.beginPath();c.arc(pad+14,y-7,9,0,7);c.fill();
      text(it.ok?'✓':it.ok===null?'?':'!',pad+14,y-1,`700 14px ${MONO}`,'#fff','center');c.font=`400 20px ${SANS}`;const ls=wrapLines(c,it.l,iw-50);ls.forEach((l,i)=>text(l,pad+40,y+i*28,`400 20px ${SANS}`,v('--ink')));y+=(ls.length-1)*28+34});
    r.ws.qs.forEach((q,i)=>{c.font=`600 20px ${SANS}`;wrapLines(c,`${i+1}. ${q}`,iw-20).forEach(l=>{text(l,pad+4,y,`600 20px ${SANS}`,v('--ink'));y+=28});
      c.font=`400 20px ${SANS}`;wrapLines(c,(r.ws.ans[i]||'').trim()||'(ยังไม่ได้ตอบ)',iw-40).forEach(l=>{text(l,pad+24,y,`400 20px ${SANS}`,v('--muted'));y+=28});y+=8});
    y+=12;
  }
  /* issues */
  if(r.issues.length){
    text('ข้อที่ต้องตรวจ',pad,y+4,`600 22px ${SANS}`,v('--muted'));y+=34;
    r.issues.slice(0,12).forEach(it=>{
      const cc=it.lvl==='err'?v('--err'):v('--warn');
      c.fillStyle=cc;c.beginPath();c.arc(pad+14,y-7,9,0,7);c.fill();
      text(it.lvl==='err'?'×':'!',pad+14,y-1,`700 14px ${MONO}`,'#fff','center');
      c.font=`400 20px ${SANS}`;const ls=wrapLines(c,it.t,iw-50);
      ls.forEach((l,i)=>text(l,pad+40,y+i*28,`400 20px ${SANS}`,v('--ink')));
      y+=(ls.length-1)*28+36;
    });
    if(r.issues.length>12){text(`และอีก ${r.issues.length-12} ข้อ`,pad+40,y,`400 20px ${SANS}`,v('--muted'));y+=34}
  }else if(w){text('ไม่พบข้อที่ต้องแก้ไข',pad,y+4,`500 22px ${SANS}`,v('--ok'));y+=40}
  y+=10;
  text('ผลจากแบบจำลองอย่างง่ายเพื่อการเรียนรู้ ไม่ใช่ค่ารับประกัน ตรวจกับดาต้าชีตของอุปกรณ์จริงก่อนติดตั้ง',pad,y+16,`400 17px ${SANS}`,v('--muted'));
  y+=pad+10;
  const out=document.createElement('canvas');out.width=W;out.height=y;out.getContext('2d').drawImage(cv,0,0);
  return out;
}

/* ---- UI ---- */
function readMember(){
  MEMBER.name=clip($('#mname').value.trim(),80);MEMBER.sid=clip($('#msid').value.trim(),30);MEMBER.cls=clip($('#mcls').value.trim(),30);
  lsSet(MEM_KEY,MEMBER);whoUpdate();
}
function whoUpdate(){
  const e=$('#whoami');if(e)e.textContent=MEMBER.name?`ผู้เรียน: ${MEMBER.name}`:'';
  const g=$('#gwho');if(g)g.textContent=MEMBER.gemail?`ล็อกอิน Google: ${MEMBER.gemail}${gToken?' (ยืนยันแล้ว)':''}`:'';
  const o=$('#gout');if(o)o.hidden=!MEMBER.gemail;
}
function setMsg(t,cls){const m=$('#smmsg');m.textContent=t;m.className='simmsg'+(cls?' '+cls:'');m.hidden=!t}
function submitRefresh(){
  if(typeof wsRender==='function')wsRender();
  const r=buildReport(),w=r.wiring;
  $('#smmx').innerHTML=[
    ['ผลการต่อสาย',w?(w.lvl==='idle'?'รอต่อสาย':LABEL[w.lvl]):'-',wLabel(w)],
    ['แผง',w?`${w.used}/${w.panels}`:'-',w?`${f(w.kwp,2)} kWp · DC/AC ${f(w.ratio,2)}`:''],
    ['ผลิตต่อวัน',r.pv?f(r.pv.E,1)+' kWh':'-',r.pv?`สูงสุด ${f(r.pv.peak,2)} kW`:'ต่อสายให้ถูกต้องก่อน'],
    ['โหลดต่อวัน',f(r.load.E,1)+' kWh',`${r.load.n} รายการ · โหลด Backup ${f(r.load.Ec,1)} kWh`],
    ['Backup',r.bk?({ok:'ผ่าน',warn:'ควรระวัง',err:'ไม่ผ่าน'})[r.bk.lvl]:'-',r.bk?r.bk.vt:'ยังไม่มีผล'],
    ['ต่อสาย AC',r.ac&&r.ac.lvl!=='idle'?LABEL[r.ac.lvl]:'-',r.ac&&r.ac.lvl!=='idle'?r.ac.txt:'ยังไม่ได้ต่อสาย AC']
  ].map(m=>`<div class="metric"><div class="k">${m[0]}</div><div class="v">${esc(m[1])}</div><div class="s">${esc(m[2])}</div></div>`).join('');
  $('#smiss').innerHTML=r.issues.length?r.issues.map(c=>`<li><span class="b ${c.lvl}">${c.lvl==='err'?'×':'!'}</span><span>${esc(c.t)}</span></li>`).join(''):'';
  const subs=lsGet(SUBS_KEY)||[];
  $('#smhist').innerHTML=subs.length?subs.map(s=>`<li><span class="b ${s.sent?'ok':'warn'}">${s.sent?'✓':'!'}</span><span><b class="mono">${esc(s.receipt)}</b> · ${esc(s.when)} · ${esc(s.text)}${s.sent?'':' · ยังไม่ยืนยันว่าส่งถึง'}</span></li>`).join(''):'<li><span class="b" style="visibility:hidden">·</span><span>ยังไม่เคยส่งงานจากเครื่องนี้</span></li>';
  $('#smsend').disabled=!CFG.SUBMIT_URL||sending;
  $('#smcfg').hidden=!!CFG.SUBMIT_URL;
  whoUpdate();
}
async function makeImage(receipt,r){
  r=r||buildReport();
  const cv=await renderReportImage(r,MEMBER,receipt);
  const url=cv.toDataURL('image/png');
  lastImg=url;
  $('#smimg').src=url;$('#smimgw').hidden=false;
  const a=$('#smdl');a.href=url;a.download=`solar-${(MEMBER.sid||MEMBER.name||'report').replace(/[^\wก-๙-]+/g,'_')}-${receipt||'draft'}.png`;
  return url;
}
const newReceipt=()=>('S'+Date.now().toString(36).slice(-5)+Math.random().toString(36).slice(2,4)).toUpperCase();
function payload(r,receipt){
  const w=r.wiring||{};
  return{v:1,receipt,t:r.t.toISOString(),course:r.course,name:MEMBER.name,sid:MEMBER.sid,cls:MEMBER.cls,gemail:MEMBER.gemail,idToken:gToken,
    lvl:w.lvl||'idle',err:w.err||0,warn:w.warn||0,ok:w.ok||0,panels:w.panels||0,used:w.used||0,kwp:+(w.kwp||0).toFixed(2),ratio:+(w.ratio||0).toFixed(2),topo:w.topo||'',
    panel:r.panel,inverter:r.inverter,battery:r.battery,
    pvKwh:r.pv?+r.pv.E.toFixed(2):'',loadKwh:+r.load.E.toFixed(2),
    bkMode:r.bk?r.bk.mode:'',bkLvl:r.bk?r.bk.lvl:'',bkText:r.bk?r.bk.vt:'',bkUnmet:r.bk?+(r.bk.unmet||0).toFixed(2):'',
    ws:r.ws?r.ws.id:'',wsName:r.ws?r.ws.name:'',wsPass:r.ws?r.ws.pass:'',wsFail:r.ws?r.ws.fail.slice(0,10).map(x=>clip(x,120)):[],answers:r.ws?r.ws.qs.map((q,i)=>`${i+1}. ${clip(q,120)} → ${clip(r.ws.ans[i]||'',600)}`):[],
    acLvl:r.ac?r.ac.lvl:'',acErr:r.ac?r.ac.nE:0,evText:r.ev||'',siteText:clip(r.site||'',480),
    issues:r.issues.slice(0,15).map(i=>`[${i.lvl}] ${clip(i.t,200)}`)};
}
async function doSubmit(){
  if(sending)return;
  readMember();
  if(!MEMBER.name){setMsg('กรอกชื่อ-นามสกุลก่อนส่งงาน','err');$('#mname').focus();return}
  const wsel=typeof wsCur==='function'?wsCur():null;
  if(!wsel){setMsg('เลือกใบงานที่จะส่งก่อน','err');return}
  if((wsel.id==='W0'||wsTabs(wsel).includes('wiring'))&&!lastA){setMsg('ยังไม่มีผลการต่อสาย ไปแท็บ "ต่อสาย DC" ก่อน','err');return}
  sending=true;$('#smsend').disabled=true;setMsg('กำลังสร้างภาพและส่งงาน…');
  const r=buildReport(),receipt=newReceipt(),pl=payload(r,receipt);
  if(WS_IMG[wsel.img||'none']){try{const cv=await renderReportImage(r,MEMBER,receipt);pl.img=cv.toDataURL('image/jpeg',0.82)}catch(e){}}
  const body=JSON.stringify(pl);
  let status='unknown',errText='';
  try{
    const res=await fetch(CFG.SUBMIT_URL,{method:'POST',body,redirect:'follow'});
    const j=await res.json();
    if(j&&j.ok)status='ok';else{status='rejected';errText=(j&&j.error)||'ถูกปฏิเสธ'}
  }catch(e){
    try{await fetch(CFG.SUBMIT_URL,{method:'POST',body,mode:'no-cors'});status='unknown'}catch(e2){status='fail'}
  }
  sending=false;
  const when=`${pad2(r.t.getDate())}/${pad2(r.t.getMonth()+1)} ${pad2(r.t.getHours())}:${pad2(r.t.getMinutes())}`;
  if(status==='rejected'||status==='fail'){
    setMsg(status==='rejected'?`ส่งไม่สำเร็จ: ${errText} (ตรวจรหัสห้องอบรมกับผู้สอน)`:'ส่งไม่สำเร็จ ตรวจอินเทอร์เน็ตแล้วลองใหม่','err');
  }else{
    const subs=lsGet(SUBS_KEY)||[];subs.unshift({receipt,when,text:(r.ws?r.ws.id+' '+r.ws.name+' · ':'')+wLabel(r.wiring),sent:status==='ok',ws:r.ws?r.ws.id:'',pass:r.ws?r.ws.pass:false});lsSet(SUBS_KEY,subs.slice(0,20));
    setMsg(status==='ok'?`ส่งงานแล้ว รหัสใบส่งงาน ${receipt}`:`ส่งแล้วแต่ยังไม่ได้รับการยืนยันจากเซิร์ฟเวอร์ รหัส ${receipt} บันทึกภาพไว้เป็นหลักฐานได้`,status==='ok'?'ok':'');
    try{await makeImage(receipt,r)}catch(e){}
    if(typeof wsMine==='function'){await wsMine()}
  }
  submitRefresh();
}
function loadGsi(){
  if(!CFG.GOOGLE_CLIENT_ID)return;
  $('#gsi').hidden=false;
  const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=true;
  s.onload=()=>{try{
    google.accounts.id.initialize({client_id:CFG.GOOGLE_CLIENT_ID,callback:resp=>{
      gToken=resp.credential;
      try{const p=JSON.parse(decodeURIComponent(escape(atob(resp.credential.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')))));
        MEMBER.gemail=p.email||'';MEMBER.gname=p.name||'';if(!$('#mname').value&&p.name)$('#mname').value=p.name;}catch(e){}
      readMember();submitRefresh();
    }});
    google.accounts.id.renderButton($('#gbtn'),{theme:'outline',size:'large',text:'signin_with',locale:'th'});
  }catch(e){}};
  document.head.appendChild(s);
}
function initSubmit(){
  const m=lsGet(MEM_KEY);
  if(m&&typeof m==='object')MEMBER=Object.assign(MEMBER,{name:clip(m.name,80),sid:clip(m.sid,30),cls:clip(m.cls,30),gemail:clip(m.gemail,120),gname:clip(m.gname,80)});
  $('#mname').value=MEMBER.name;$('#msid').value=MEMBER.sid;$('#mcls').value=MEMBER.cls;
  ['mname','msid','mcls'].forEach(id=>$('#'+id).addEventListener('input',readMember));
  $('#smsend').addEventListener('click',doSubmit);
  $('#smshot').addEventListener('click',async()=>{readMember();setMsg('กำลังสร้างภาพ…');try{await makeImage('',null);setMsg('')}catch(e){setMsg('สร้างภาพไม่สำเร็จ','err')}});
  $('#smcopy').addEventListener('click',async()=>{
    readMember();const r=buildReport();
    const t=[CFG.COURSE,`${MEMBER.name} ${MEMBER.sid}`.trim(),...reportLines(r).map(([k,v])=>`${k}: ${v}`),...r.issues.map(i=>`- ${i.t}`)].join('\n');
    try{await navigator.clipboard.writeText(t);setMsg('คัดลอกสรุปแล้ว')}catch(e){setMsg('คัดลอกไม่ได้ เลือกข้อความเองหรือใช้ภาพแทน','err')}
  });
  $('#gout').addEventListener('click',()=>{gToken='';MEMBER.gemail='';MEMBER.gname='';lsSet(MEM_KEY,MEMBER);try{google.accounts.id.disableAutoSelect()}catch(e){}submitRefresh()});
  loadGsi();whoUpdate();
}

/* ---- project in the teacher's Google Drive (via the same Apps Script web app) ---- */
function cloudMsg(t,cls){const m=$('#cloudmsg');if(!m)return;m.textContent=t;m.className='simmsg'+(cls?' '+cls:'');m.hidden=!t;setSt(t)}
async function cloudCall(action,extra){
  readMember();
  if(!MEMBER.name||!(MEMBER.sid||(MEMBER.gemail&&gToken))){cloudMsg('กรอกชื่อ รหัสผู้เรียน และรหัสห้องด้านบนก่อน','err');return null}
  try{
    const res=await fetch(CFG.SUBMIT_URL,{method:'POST',body:JSON.stringify(Object.assign({action,name:MEMBER.name,sid:MEMBER.sid,cls:MEMBER.cls,idToken:gToken},extra||{})),redirect:'follow'});
    const j=await res.json();
    if(!j||!j.ok){cloudMsg('Drive: '+((j&&j.error)||'ไม่สำเร็จ'),'err');return null}
    if(!j.cloud){cloudMsg('ไม่ได้บันทึกลง Drive: Apps Script ยังเป็นโค้ดเวอร์ชันเก่า (ผู้สอนต้องวาง Code.gs ล่าสุดแล้ว Deploy → New version) คำขอนี้ถูกนับเป็นการส่งงานแทน','err');return null}
    return j;
  }catch(e){cloudMsg('เชื่อมต่อ Drive ไม่ได้ ตรวจอินเทอร์เน็ต','err');return null}
}
function initCloud(){
  const sv=$('#cloudsave'),ld=$('#cloudload');
  if(!sv||!CFG.SUBMIT_URL)return;
  sv.hidden=ld.hidden=false;
  sv.addEventListener('click',async()=>{
    sv.disabled=true;cloudMsg('กำลังบันทึกขึ้น Drive…');
    const j=await cloudCall('save',{data:JSON.stringify(projectFile())});
    sv.disabled=false;if(j)cloudMsg('บันทึกขึ้น Drive แล้ว เวลา '+new Date().toLocaleTimeString('th-TH')+' (ไฟล์ '+(j.file||'')+')','ok');
  });
  ld.addEventListener('click',async()=>{
    ld.disabled=true;cloudMsg('กำลังโหลดจาก Drive…');
    const j=await cloudCall('load');
    ld.disabled=false;if(!j)return;
    if(!j.found){cloudMsg('ยังไม่มีงานที่บันทึกไว้บน Drive สำหรับชื่อ/รหัสนี้ ตรวจว่ากรอกรหัสผู้เรียนตรงกับเครื่องที่บันทึก','err');return}
    try{const o=JSON.parse(j.data);applyProjectFile({catalog:o.project&&o.project.catalog,project:o.project&&o.project.project});cloudMsg('โหลดจาก Drive แล้ว (บันทึกเมื่อ '+new Date(j.saved).toLocaleString('th-TH')+')','ok')}catch(e){cloudMsg('ไฟล์บน Drive อ่านไม่ได้','err')}
  });
}

/* ---- confirmation pop-up for the submit buttons ---- */
function askConfirm(title,body,okLabel){
  return new Promise(res=>{
    const prev=document.activeElement,ov=document.createElement('div');
    ov.className='cfm';ov.innerHTML=`<div class="cfmbox" role="dialog" aria-modal="true" aria-labelledby="cfmt"><h2 id="cfmt">${esc(title)}</h2><p>${body}</p><div class="cfmbtn"><button class="btn" data-x="0">ยกเลิก</button><button class="btn pri" data-x="1">${esc(okLabel||'ยืนยัน')}</button></div></div>`;
    const done=v=>{document.removeEventListener('keydown',key,true);ov.remove();try{prev&&prev.focus()}catch(e){}res(v)};
    const key=e=>{if(e.key==='Escape'){e.preventDefault();done(false)}};
    ov.addEventListener('click',e=>{const b=e.target.closest('[data-x]');if(b)done(b.dataset.x==='1');else if(e.target===ov)done(false)});
    document.addEventListener('keydown',key,true);
    document.body.appendChild(ov);ov.querySelector('[data-x="0"]').focus();
  });
}
function guardButtons(container,map){
  if(!container)return;
  container.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b||!map[b.id]||b._ok)return;
    e.stopPropagation();e.preventDefault();
    const m=map[b.id]();
    askConfirm(m[0],m[1],m[2]).then(ok=>{if(ok){b._ok=true;b.click();b._ok=false}});
  },true);
}
function initConfirm(){
  const who=()=>{readMember();return `<b>${esc(MEMBER.name||'(ยังไม่ได้กรอกชื่อ)')}</b>${MEMBER.sid?' · รหัส '+esc(MEMBER.sid):''}`};
  guardButtons($('#smsend').parentElement,{
    smsend:()=>{const w=wsCur(),E=wsEval(w);return['ยืนยันการส่งงาน?',`ส่ง <b>${esc(w?w.id+' '+w.name:'(ยังไม่เลือกใบงาน)')}</b> ของ ${who()} ไปให้ผู้สอน`+(w&&!E.pass?`<br><br>ยังไม่ครบเกณฑ์ ${E.fail.length} ข้อ: ${E.fail.map(esc).join(' · ')}<br>ส่งได้ แต่ผู้สอนจะเห็นว่ายังไม่ครบ`:'')+'<br><br>ส่งซ้ำได้ ระบบใช้ผลที่ส่งล่าสุดของแต่ละใบงาน','ยืนยันส่งงาน']},
    smshot:()=>['สร้างภาพรายงาน?','สร้างภาพรายงานจากผลปัจจุบัน ภาพอยู่ในเครื่องนี้เท่านั้น ไม่ได้ส่งให้ผู้สอน','ยืนยัน สร้างภาพ'],
    smcopy:()=>['คัดลอกสรุป?','คัดลอกข้อความสรุปผลปัจจุบันไปที่คลิปบอร์ด','ยืนยัน คัดลอก']
  });
  guardButtons($('#cloudsave').parentElement,{
    cloudsave:()=>['บันทึกขึ้น Drive?',`บันทึกงานของ ${who()} ขึ้น Drive ของผู้สอน ถ้าเคยบันทึกไว้แล้วจะถูกแทนที่ด้วยงานปัจจุบัน`,'ยืนยัน บันทึก'],
    cloudload:()=>['โหลดจาก Drive?',`โหลดงานของ ${who()} จาก Drive งานที่เปิดอยู่ในเครื่องนี้จะถูกแทนที่ (ควรกด "บันทึกเป็นไฟล์" สำรองไว้ก่อน)`,'ยืนยัน โหลด']
  });
}
