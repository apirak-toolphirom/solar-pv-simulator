/* ---- system types: On-grid / Off-grid / Hybrid off-grid / Hybrid on-off grid, same day, same panels, loads and battery ----
   Uses the energy balance from backup.js. Shared inputs (panel source, outage, start SOC, critical loads) are the same settings as tab "จำลอง Backup". */
const SY={sel:'hyb',h:13,buy:4.2,sell:2.2,btg:30};
const SYS=[
  {k:'ongrid',name:'On-grid',th:'ขนานกริด ไม่มีแบต',bat:false,grid:true,exp:true,
   note:'แผงจ่ายโหลดก่อน ส่วนเกินขายคืนกริด ตอนไฟดับต้องหยุดจ่ายไฟทันที (anti-islanding) แม้มีแดด',
   rows:{exp:'ขายได้',out:'ไม่มีไฟ',bat:'ไม่มี',gen:'ไม่รองรับ',sw:'—',inv:'On-grid (grid-tie)',perm:'ต้องขออนุญาตขนานกับการไฟฟ้า'},types:['on-grid']},
  {k:'off',name:'Off-grid',th:'ไม่ต่อกริด แผง + แบต',bat:true,grid:false,exp:false,
   note:'ไม่มีกริดเลย แผงและแบตต้องจ่ายโหลดทั้งหมดเอง ไฟส่วนเกินเมื่อแบตเต็มถูกทิ้ง ไฟส่วนที่ขาดคือไม่มีไฟใช้',
   rows:{exp:'ไม่มีกริด',out:'ไม่มีผล (ไม่ต่อกริด)',bat:'จำเป็น',gen:'รองรับ (ใช้ชาร์จแบต)',sw:'—',inv:'Off-grid หรือ Hybrid ที่ใช้แบบไม่ต่อกริด',perm:'ไม่ขนานกริด'},types:['off-grid','hybrid']},
  {k:'hoff',name:'Hybrid off-grid',th:'ใช้กริดเป็นไฟสำรอง ไม่ขายไฟ',bat:true,grid:true,exp:false,
   note:'แผงจ่ายโหลดก่อน ส่วนเกินชาร์จแบต แบตจ่ายโหลดจนเหลือ SOC ที่ตั้งไว้ แล้วสลับไปใช้ไฟกริด (bypass) ไม่ส่งไฟออกกริด ไฟที่เหลือเมื่อแบตเต็มถูกทิ้ง',
   rows:{exp:'ไม่ขาย (zero export)',out:'แบตจ่ายโหลดต่อ',bat:'จำเป็น',gen:'รองรับ (ต่อขา AC input)',sw:'~10–20 ms (โหมด UPS)',inv:'Off-grid ที่มี AC input หรือ Hybrid ตั้ง Export 0 W',perm:'ไม่ขนานกริด ไม่ขายไฟ'},types:['off-grid','hybrid']},
  {k:'hyb',name:'Hybrid on/off-grid',th:'ขนานกริด มีแบต ขายไฟได้',bat:true,grid:true,exp:true,
   note:'แผงจ่ายโหลดก่อน ส่วนเกินชาร์จแบตแล้วขายคืนกริด ตอนไฟดับตัดจากกริดแล้วจ่ายโหลดจากแผงและแบตต่อ',
   rows:{exp:'ขายได้ (ตั้ง Export limit ได้)',out:'แบตจ่ายโหลดต่อ',bat:'จำเป็น',gen:'แล้วแต่รุ่น (เช่น Solis มีพอร์ต GEN)',sw:'< 10 ms ตามรุ่น',inv:'Hybrid',perm:'ต้องขออนุญาตขนานกับการไฟฟ้า'},types:['hybrid']}
];
/* what is shading the panels at step i (for the diagram label) */
function syCause(i){
  const h=(i+.5)*5/60,sn=typeof sunAt==='function'?sunAt(h):null,c=[];
  if(EV.cloud.on&&evCloud(h)>0.05)c.push('เมฆ');
  if(sn&&sn.up&&EV.site.on&&siteShade(sn.az,sn.el,0)>0)c.push('ต้นไม้/ตึกในผัง');
  if(sn&&sn.up){if(EV.tree.on&&treeShade(sn.az,sn.el,EV.tree.mppt?EV.tree.mppt-1:0)>0)c.push('ต้นไม้');if(EV.bld.on&&bldShade(sn.az,sn.el)>0)c.push('ตึก')}
  if(EV.dust.on&&!c.length)c.push('ฝุ่น');
  return(c.join('+')||'เงา')+'บัง';
}
function syEnvSync(){
  const q=id=>document.getElementById(id);if(!q('syecl'))return;
  const C=EV.cloud,T=EV.tree,B=EV.bld;
  q('syecl').checked=C.on;q('syecs').value=hhmm(C.start);q('syecd').value=C.dur;q('syecp').value=C.depth;
  q('syetr').checked=T.on;q('syeth').value=T.h;q('syetd').value=T.d;q('syeta').value=T.az;
  q('syebl').checked=B.on;q('syebh').value=B.h;q('syebd').value=B.d;q('syeba').value=B.az;q('syebw').value=B.w;
  [['syecbox',C.on],['syetbox',T.on],['syebbox',B.on]].forEach(([id,on])=>q(id).classList.toggle('on',on));
  q('syesite').checked=EV.site.on;q('syesitebox').classList.toggle('on',EV.site.on);q('syetbox').hidden=EV.site.on;q('syebbox').hidden=EV.site.on;
  q('syesitenote').textContent=EV.site.on?(siteHasPV()?`ต้นไม้และตึกจากผัง · แผง ${siArrays().length} ชุดบนหลังคา`:'ยังไม่มีแผงบนผัง ไปแท็บ 05 กด "+ แผงโซลาร์"'):'ปิดอยู่ ใช้ต้นไม้ / ตึกแบบเดี่ยว';
}
const SY_ROWS=[['exp','ขายไฟคืนกริด'],['out','ตอนไฟดับ'],['bat','แบตเตอรี่'],['gen','เครื่องปั่นไฟ'],['sw','เวลาสลับไปไฟสำรอง'],['inv','ชนิดอินเวอร์เตอร์'],['perm','การเชื่อมต่อการไฟฟ้า']];
let SYR=null,syCfg=null;

function syRunAll(){
  const I=curInv(),bi=bankInfo(),src=bkSource(),LP=loadProfile(5);
  if(src.err)return{err:src.err};
  const ev=typeof evActive==='function'&&evActive(),pv0=ev?bkSource(true).pv:src.pv,lossE=pv0.reduce((a,v,j)=>a+Math.max(0,v-src.pv[j]),0)*5/60/1000;
  if(!LOADS.length||Math.max(...LP.all)<=0)return{err:'ยังไม่มีโหลด ไปแท็บ "จำลองโหลด" เพื่อใส่รายการ'};
  const chgKw=bi?Math.min(I.bchg>0?I.bchg:I.pac/1000,bi.chgKw):0,disKw=bi?Math.min(I.bdis>0?I.bdis:I.pac/1000,bi.disKw):0;
  const islandW=Math.min(I.pac,(I.backupKw>0?I.backupKw:I.pac/1000)*1000);
  const base={bank:bi,chgKw,disKw,islandW,soc0:BK.soc0,outStart:BK.outStart,outDur:BK.outDur,island:BK.island,step:5};
  const out={};
  SYS.forEach(s=>{
    if(s.bat&&!bi){out[s.k]={err:'ยังไม่มีรุ่นแบต'};return}
    let cfg;
    if(s.k==='ongrid')cfg=Object.assign({},base,{mode:'grid',bank:null});
    else if(s.k==='off')cfg=Object.assign({},base,{mode:'off',island:'all'});
    else if(s.k==='hoff')cfg=Object.assign({},base,{mode:'hybrid',expLimW:0,reserve:SY.btg,gmode:'selfuse'});
    else cfg=Object.assign({},base,{mode:'hybrid',reserve:SY.btg,gmode:'selfuse'});
    const R=balance(src.pv,LP.all,LP.crit,cfg),T=R.T;
    const bill=T.imp*SY.buy-T.exp*SY.sell,noSolar=LP.all.reduce((a,b)=>a+b,0)*5/60/1000*SY.buy;
    out[s.k]={R,T,cfg,bill,noSolar,self:T.load>0?(T.direct+T.fromBat)/T.load*100:0};
  });
  return{out,src,LP,I,bi,pv0,lossE,ev};
}
function syFit(s,I){
  if(s.types.includes(I.type))return{ok:true,t:`อินเวอร์เตอร์ที่เลือก (${I.type}) ใช้กับระบบนี้ได้`};
  return{ok:false,t:`อินเวอร์เตอร์ที่เลือกเป็น ${I.type} ระบบนี้ต้องใช้ ${s.types.join(' หรือ ')} ผลด้านล่างจำลองตามหลักการทำงานของระบบ`};
}
/* small flow diagram for one system at the chosen time; values in kW, arrows show direction */
function syDiagram(s,r,i,pv0){
  const R=r.R,kw=v=>f(Math.abs(v)/1000,2),out=s.k!=='off'&&R.outage[i];
  const pv=R.pv[i],ld=R.load[i]-R.unmet[i],bat=(R.fromBat[i]-R.toBat[i]),grid=R.imp[i]-R.exp[i],waste=R.curt[i];
  const C={pv:[52,28],grid:[248,28],inv:[150,92],bat:[52,156],load:[248,156]};
  const node=(k,lab,sub,off)=>`<g class="synode${off?' off':''}"><rect x="${C[k][0]-40}" y="${C[k][1]-17}" width="80" height="34" rx="8"/><text x="${C[k][0]}" y="${C[k][1]-2}" text-anchor="middle" class="syn">${lab}</text><text x="${C[k][0]}" y="${C[k][1]+11}" text-anchor="middle" class="sys">${sub}</text></g>`;
  const link=(k,val,toInv,cls,off)=>{
    const [x,y]=C[k],[cx,cy]=C.inv,live=!off&&Math.abs(val)>5,a=toInv?[x,y,cx,cy]:[cx,cy,x,y];
    const mx=(x+cx)/2,my=(y+cy)/2;
    return`<line x1="${x}" y1="${y}" x2="${cx}" y2="${cy}" class="syl ${cls}${live?' live':''}${off?' off':''}"/>`
      +(live?(()=>{const dx=a[2]-a[0],dy=a[3]-a[1],L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,px=a[0]+dx*.62,py=a[1]+dy*.62,s=6;
          return`<path d="M${(px+ux*s).toFixed(1)} ${(py+uy*s).toFixed(1)}L${(px-ux*s-uy*s).toFixed(1)} ${(py-uy*s+ux*s).toFixed(1)}L${(px-ux*s+uy*s).toFixed(1)} ${(py-uy*s-ux*s).toFixed(1)}Z" class="syarr ${cls}"/>`})():'')
      +`<text x="${mx+(x<cx?-6:6)}" y="${my-6}" text-anchor="${x<cx?'end':'start'}" class="syv">${off?'':live?kw(val)+' kW':'0'}</text>`;
  };
  let g=`<svg viewBox="0 -18 300 204" role="img" aria-label="ภาพการไหลของไฟ ${s.name}">`;
  g+=link('pv',pv,true,'pv',false);
  g+=link('grid',grid,grid>0,'gr',!s.grid||out);
  g+=link('bat',bat,bat>0,'bt',!s.bat);
  g+=link('load',ld,false,'ld',false);
  g+=node('pv','แผง',kw(pv)+' kW')+node('grid','กริด',!s.grid?'ไม่ต่อ':out?'ไฟดับ':grid>5?'ซื้อ':grid<-5?'ขาย':'—',!s.grid||out)
    +node('bat','แบต',s.bat?f(R.soc[i],0)+' %':'ไม่มี',!s.bat)+node('load','โหลด',kw(ld)+' kW',false);
  g+=`<g class="synode inv"><rect x="${C.inv[0]-34}" y="${C.inv[1]-15}" width="68" height="30" rx="8"/><text x="${C.inv[0]}" y="${C.inv[1]+4}" text-anchor="middle" class="syn">INV</text></g>`;
  {const lost=pv0?pv0[i]-R.pv[i]:0;if(lost>20)g+=`<text x="12" y="-5" text-anchor="start" class="syv bad">${syCause(i)} −${kw(lost)} kW</text>`}
  if(R.unmet[i]>5)g+=`<text x="248" y="182" text-anchor="middle" class="syv bad">ขาด ${kw(R.unmet[i])} kW</text>`;
  if(waste>5)g+=`<text x="52" y="182" text-anchor="middle" class="syv mut">ไฟแผงทิ้ง ${kw(waste)} kW</text>`;
  return g+'</svg>';
}
function syRun(){
  if(!document.getElementById('sycards'))return;
  syEnvSync();window.SY_SEEN=true;
  const A=syRunAll(),msg=document.getElementById('symsg'),body=document.getElementById('sybody');
  SYR=A;
  if(A.err){msg.hidden=false;msg.textContent=A.err;body.hidden=true;return}
  msg.hidden=true;body.hidden=false;
  const i=Math.max(0,Math.min(A.out.ongrid.R.pv.length-1,Math.floor(SY.h*60/5)));
  document.getElementById('syhv').textContent=hhmm(SY.h);
  const hr=document.getElementById('syh');if(document.activeElement!==hr)hr.value=SY.h;
  const outNow=BK.outDur>0&&inWin(SY.h,BK.outStart%24,(BK.outStart+BK.outDur)%24);
  document.getElementById('systate').textContent=outNow?`เวลา ${hhmm(SY.h)}: ไฟดับ`:`เวลา ${hhmm(SY.h)}: กริดปกติ`;
  document.getElementById('systate').className='pill '+(outNow?'warn':'idle');
  {const L=document.getElementById('syloss');L.hidden=!A.ev;
   if(A.ev){const E0=A.pv0.reduce((a,b)=>a+b,0)*5/60/1000;L.innerHTML=`<b>เมฆ / เงาบังทำให้ไฟจากแผงหาย ${f(A.lossE,1)} kWh</b> จาก ${f(E0,1)} kWh (${f(E0>0?A.lossE/E0*100:0,0)}%) ทุกระบบได้รับผลเท่ากัน แต่ผลต่อค่าไฟและไฟดับต่างกัน`}}
  document.getElementById('sycards').innerHTML=SYS.map(s=>{
    const r=A.out[s.k],fit=syFit(s,A.I);
    if(r.err)return`<section class="card sycard"><h3>${s.name}</h3><p class="hint">${r.err}</p></section>`;
    const T=r.T,unm=s.k==='off'?T.unmet:T.unmetOut;
    const lv=unm>0.005?(s.k==='ongrid'?'warn':unm/Math.max(T.loadOut||T.load,1e-9)>.2?'err':'warn'):'ok';
    const vt=s.k==='off'?(unm>0.005?`ไฟไม่พอ ขาด ${f(unm,2)} kWh`:'ไฟพอใช้ทั้งวัน'):BK.outDur>0?(unm>0.005?`ไฟดับ: ขาด ${f(unm,2)} kWh`:'ไฟดับ: ไฟพอใช้'):'ไม่มีไฟดับ';
    return`<section class="card sycard${SY.sel===s.k?' on':''}" data-sy="${s.k}" tabindex="0" role="button" aria-pressed="${SY.sel===s.k}">
      <div class="syhead"><h3>${s.name}</h3><span class="pill ${lv}">${LABEL[lv]}</span></div><p class="syth">${s.th}</p>
      ${syDiagram(s,r,i,A.ev?A.pv0:null)}
      <dl class="sydl"><div><dt>ใช้ไฟจากแผงและแบต</dt><dd>${f(r.self,0)} %</dd></div><div><dt>ซื้อ / ขาย</dt><dd>${s.grid?f(T.imp,1)+' / '+f(T.exp,1):'—'} kWh</dd></div>
      <div><dt>ไฟแผงที่ทิ้ง</dt><dd>${f(T.curt,1)} kWh</dd></div><div><dt>ค่าไฟวันนี้</dt><dd>${s.grid?(r.bill<0?'ได้คืน '+f(-r.bill,1):f(r.bill,1))+' บาท':'0 บาท'}</dd></div></dl>
      <p class="syv2 ${lv}">${vt}</p><p class="syfit${fit.ok?'':' no'}">${fit.ok?'✓':'!'} ${esc(fit.t)}</p></section>`;
  }).join('');
  /* comparison table */
  const head=`<tr><th></th>${SYS.map(s=>`<th>${s.name}</th>`).join('')}</tr>`;
  const num=(lab,fn,unit)=>`<tr><th>${lab}</th>${SYS.map(s=>{const r=A.out[s.k];return`<td class="n">${r.err?'—':fn(r,s)}${unit&&!r.err?' '+unit:''}</td>`}).join('')}</tr>`;
  document.getElementById('sytbl').innerHTML=`<thead>${head}</thead><tbody>`
    +num('ผลิตจากแผง',r=>f(r.T.pv,1),'kWh')+num('ใช้ตรงจากแผง',r=>f(r.T.direct,1),'kWh')+num('ชาร์จ / จ่ายแบต',(r,s)=>s.bat?f(r.T.toBat,1)+' / '+f(r.T.fromBat,1):'—','kWh')
    +num('ซื้อจากกริด',(r,s)=>s.grid?f(r.T.imp,1):'—','kWh')+num('ขายคืนกริด',(r,s)=>s.exp?f(r.T.exp,1):'—','kWh')+num('ไฟแผงที่ทิ้ง',r=>f(r.T.curt,1),'kWh')
    +num('ไฟขาด (ไม่มีไฟใช้)',(r,s)=>f(s.k==='off'?r.T.unmet:r.T.unmetOut,2),'kWh')+num('SOC ต่ำสุด / สิ้นวัน',(r,s)=>s.bat?f(r.R.socMin,0)+' / '+f(r.R.socEnd,0):'—','%')
    +num('ค่าไฟวันนี้ (ติดลบ = ได้เงินคืน)',(r,s)=>s.grid?f(r.bill,1):'0','บาท')+num('ประหยัดเทียบไม่ติดโซลาร์',(r,s)=>f(r.noSolar-(s.grid?r.bill:0),1),'บาท/วัน')
    +SY_ROWS.map(([k,lab])=>`<tr class="q"><th>${lab}</th>${SYS.map(s=>`<td>${esc(s.rows[k])}</td>`).join('')}</tr>`).join('')+'</tbody>';
  /* chart for the selected system */
  const s=SYS.find(x=>x.k===SY.sel)||SYS[3],r=A.out[s.k];
  document.getElementById('sysel').textContent=s.name;
  document.getElementById('synote').textContent=s.note;
  if(r.err){syCfg=null;return}
  const R=r.R,x=R.pv.map((_,j)=>(j+.5)*5/60),kw=a=>a.map(v=>v/1000),vb=[];
  if(s.k!=='off'&&BK.outDur>0){const a=BK.outStart%24,e=a+BK.outDur;if(e<=24)vb.push([a,e]);else vb.push([a,24],[0,e-24])}
  const se=[{short:'กำลังจากแผง',color:'var(--s1)',vals:kw(R.pv),area:true,fmt:v=>f(v,2)},{short:'โหลด',color:'var(--s2)',vals:kw(R.load),fmt:v=>f(v,2)}];
  if(s.grid)se.push({short:'ซื้อจากกริด',color:'var(--s3)',vals:kw(R.imp),fmt:v=>f(v,2)});
  if(s.exp)se.push({short:'ขายคืนกริด',color:'var(--accent)',vals:kw(R.exp),fmt:v=>f(v,2)});
  if(A.ev)se.push({short:'แผงถ้าไม่มีเมฆ/เงา',color:'var(--muted)',vals:kw(A.pv0),fmt:v=>f(v,2)});
  if(r.T.curt>0.01)se.push({short:'ไฟแผงที่ทิ้ง',color:'var(--muted)',vals:kw(R.curt),fmt:v=>f(v,2)});
  if(r.T.unmet>0.005)se.push({short:'ไฟขาด',color:'var(--err)',vals:kw(R.unmet),fmt:v=>f(v,2)});
  const top=Math.max(Math.max(...R.pv),Math.max(...R.load),1)/1000*1.1;
  syCfg={A:{x,xmin:0,xmax:24,ymax:top,unit:'kW',aria:'กราฟกำลังตลอดวันของระบบที่เลือก',vb,vbl:'ไฟดับ',series:se},
    B:s.bat?{x,xmin:0,xmax:24,ymax:100,unit:'%',aria:'กราฟ SOC แบตของระบบที่เลือก',vb,vbl:'ไฟดับ',refs:[{y:R.Emin/R.cap*100,label:`SOC ต่ำสุดที่ใช้ได้ ${f(R.Emin/R.cap*100,0)}%`}].concat(s.grid?[{y:SY.btg,label:`กลับไปใช้กริดที่ ${SY.btg}%`}]:[]),series:[{short:'SOC แบต',color:'var(--s3)',vals:R.soc,area:true,fmt:v=>f(v,0)}]}:null};
  syCfg.A.leg='syleg';document.getElementById('syleg').innerHTML=legHTML('syleg',se,vb.length?'<span class="lg"><i class="lb" style="background:var(--warnbg)"></i>ช่วงไฟดับ</span>':'',drawSys);
  document.getElementById('sycard2').hidden=!syCfg.B;
  drawSys();
}
function drawSys(){
  if(!syCfg)return;
  if($('#chS1').clientWidth)drawLine($('#chS1'),syCfg.A);
  if(syCfg.B&&$('#chS2').clientWidth)drawLine($('#chS2'),syCfg.B);
}
function sySync(){
  const q=id=>document.getElementById(id);
  q('sysrc').value=BK.src;q('syn').value=BK.nIdeal;q('synwrap').hidden=BK.src!=='ideal';
  q('syos').value=hhmm(BK.outStart);q('syod').value=BK.outDur;q('syis').value=BK.island;q('sysoc').value=BK.soc0;
  q('sybuy').value=SY.buy;q('sysell').value=SY.sell;q('sybtg').value=SY.btg;
}
function initSystems(){
  const q=id=>document.getElementById(id);if(!q('sycards'))return;
  const go=()=>{if(typeof bkSync==='function')bkSync();if(typeof backupRun==='function')backupRun();syRun();if(typeof touch==='function')touch()};
  const nb=(id,obj,key,lo,hi)=>q(id).addEventListener('input',e=>{const n=parseFloat(e.target.value);if(isNaN(n))return;obj[key]=Math.max(lo,Math.min(hi,n));go()});
  nb('syn',BK,'nIdeal',1,200);nb('syod',BK,'outDur',0,24);nb('sysoc',BK,'soc0',0,100);
  nb('sybuy',SY,'buy',0,50);nb('sysell',SY,'sell',0,50);nb('sybtg',SY,'btg',0,100);
  q('syos').addEventListener('input',e=>{const h=parseHM(e.target.value);if(isNaN(h))return;BK.outStart=h;go()});
  q('sysrc').addEventListener('change',e=>{BK.src=e.target.value;q('synwrap').hidden=BK.src!=='ideal';go()});
  q('syis').addEventListener('change',e=>{BK.island=e.target.value;go()});
  q('syh').addEventListener('input',e=>{SY.h=+e.target.value;syRun()});q('syh').addEventListener('change',()=>{if(typeof touch==='function')touch()});
  const pick=e=>{const c=e.target.closest('[data-sy]');if(!c)return;if(e.type==='keydown'&&e.key!=='Enter'&&e.key!==' ')return;e.preventDefault();SY.sel=c.dataset.sy;syRun();if(typeof touch==='function')touch()};
  q('sycards').addEventListener('click',pick);q('sycards').addEventListener('keydown',pick);
  let rz=0;window.addEventListener('resize',()=>{cancelAnimationFrame(rz);rz=requestAnimationFrame(drawSys)});
  /* shading and cloud controls: same settings as tab "จำลองเหตุการณ์" */
  const env=()=>{syEnvSync();if(typeof runSim==='function')runSim();else go();syRun();if(typeof touch==='function')touch()};
  const ck=(id,obj)=>q(id).addEventListener('change',e=>{obj.on=e.target.checked;env()});
  const en=(id,obj,key,lo,hi)=>q(id).addEventListener('input',e=>{const n=parseFloat(e.target.value);if(isNaN(n))return;obj[key]=Math.max(lo,Math.min(hi,n));env()});
  ck('syecl',EV.cloud);
  q('syetr').addEventListener('change',e=>{EV.tree.on=e.target.checked;if(EV.tree.on)EV.site.on=false;env()});q('syebl').addEventListener('change',e=>{EV.bld.on=e.target.checked;if(EV.bld.on)EV.site.on=false;env()});
  q('syesite').addEventListener('change',e=>{evSiteOn(e.target.checked);syRun()});
  q('syecs').addEventListener('input',e=>{const h=parseHM(e.target.value);if(isNaN(h))return;EV.cloud.start=h;env()});
  en('syecd',EV.cloud,'dur',0,12);en('syecp',EV.cloud,'depth',10,100);
  en('syeth',EV.tree,'h',1,40);en('syetd',EV.tree,'d',1,60);
  en('syebh',EV.bld,'h',1,200);en('syebd',EV.bld,'d',1,200);en('syebw',EV.bld,'w',1,200);
  q('syeta').addEventListener('change',e=>{EV.tree.az=+e.target.value;env()});q('syeba').addEventListener('change',e=>{EV.bld.az=+e.target.value;env()});
  const dirs=DIRS.map(d=>`<option value="${d[1]}">${d[0]} (${d[1]}°)</option>`).join('');q('syeta').innerHTML=dirs;q('syeba').innerHTML=dirs;
  sySync();syEnvSync();
}
function syRestore(o){
  if(!o||typeof o!=='object')return;
  const n=(v,d,lo,hi)=>{v=+v;return isFinite(v)?Math.max(lo,Math.min(hi,v)):d};
  if(SYS.some(s=>s.k===o.sel))SY.sel=o.sel;
  SY.h=n(o.h,13,0,23.75);SY.buy=n(o.buy,4.2,0,50);SY.sell=n(o.sell,2.2,0,50);SY.btg=n(o.btg,30,0,100);
}
