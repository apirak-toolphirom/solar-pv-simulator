/* ---- เมนู 03 ตัวช่วยให้เข้าใจง่าย (แนวเดียวกับบทเรียนบอร์ดจำลองแบบโต้ตอบ):
   ถาดอุปกรณ์ลากวาง · ป้ายบอกชนิดสายบนสาย · คำใบ้ระหว่างลากสาย · เดินระบบ (ไฟไหลตามสาย + ค่า V/A)
   · มัลติมิเตอร์ DC ลากปลายวัดแดง/ดำไปแตะขั้ว · ผังวงจรย่อ · บันทึกการทำงาน ---- */
const AID={labels:true,run:false,meter:false,log:[]};
const MTR={x:24,y:H-128,r:{x:120,y:H-150,on:null},b:{x:170,y:H-150,on:null},drag:null,last:''};
let trayDrag=null;

const kname=k=>k[0]==='i'?`DC${k.slice(1,k.indexOf(':'))}${k.endsWith(':p')?'+':'−'}`:`#${k.split(':')[0]}${k.endsWith(':p')?'+':'−'}`;
/* what a wire between two terminals means, in words a trainee can read */
function wkind(a,b){
  const pa=a.split(':')[0],pb=b.split(':')[0],ta=typeOf(a),tb=typeOf(b),ia=pa[0]==='i',ib=pb[0]==='i';
  if(ia&&ib){
    if(pa===pb)return{s:'ชอต',t:`${kname(a)} ต่อกับ ${kname(b)} = ลัดวงจรที่อินเวอร์เตอร์`,lvl:'err'};
    return{s:'ข้าม MPPT',t:`${kname(a)} ต่อกับ ${kname(b)} = ต่อคนละ MPPT ถึงกันเอง ไม่ควรทำ`,lvl:'warn'};
  }
  if(ia||ib){
    const inv=ia?a:b,pn=ia?b:a;
    if(typeOf(inv)===typeOf(pn))return{s:'เข้า '+kname(inv),t:`ขั้ว ${kname(pn)} เข้า ${kname(inv)} ถูกขั้ว`,lvl:'ok'};
    return{s:'ขั้วกลับ',t:`ขั้ว ${kname(pn)} ไปเข้า ${kname(inv)} = ขั้วกลับ`,lvl:'err'};
  }
  if(pa===pb)return{s:'ชอต',t:`ขั้ว + กับ − ของแผง #${pa} เดียวกัน = ลัดวงจร`,lvl:'err'};
  if(ta!==tb)return{s:'อนุกรม',t:`${kname(a)} ต่อ ${kname(b)} = อนุกรม (แรงดันบวกกัน)`,lvl:'ok'};
  return{s:'ขนาน',t:`${kname(a)} ต่อ ${kname(b)} = ขนาน (กระแสบวกกัน)`,lvl:'ok'};
}
function aidLog(msg,lvl){
  const d=new Date(),t=String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')+':'+String(d.getSeconds()).padStart(2,'0');
  AID.log.unshift({t,msg,lvl:lvl||'idle'});if(AID.log.length>40)AID.log.length=40;
  const el=document.getElementById('wlog');if(el)el.innerHTML=logHTML();
}
const logHTML=()=>AID.log.length?AID.log.map(x=>`<li class="${x.lvl}"><time>${x.t}</time><span>${esc(x.msg)}</span></li>`).join(''):'<li class="idle"><time>--:--</time><span>ยังไม่มีรายการ ลองต่อสาย วัดค่า หรือกด "▶ เดินระบบ"</span></li>';

const mpOfKey=(k,A)=>k[0]==='i'?+k.slice(1,k.indexOf(':')):A.pk[+k.split(':')[0]];
const mpRun=(A,k)=>{const r=k&&A.res.find(r=>r.k===k);return!!(AID.run&&r&&r.blk&&r.lvl!=='err')};
function bezMid(w){
  const a=termPos(w.a),b=termPos(w.b),da=dirVec(w.a),db=dirVec(w.b),dist=Math.hypot(b.x-a.x,b.y-a.y),kk=30+Math.min(dist*.25,90);
  return{x:(a.x+3*(a.x+da.x*kk)+3*(b.x+db.x*kk)+b.x)/8,y:(a.y+3*(a.y+da.y*kk)+3*(b.y+db.y*kk)+b.y)/8};
}
function tag(x,y,txt,cls){
  const w=Math.max(30,txt.length*6.6+14);
  return`<g class="wtag ${cls||''}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><rect x="${-w/2}" y="-10" width="${w}" height="20" rx="10"/><text y="4">${esc(txt)}</text></g>`;
}

/* layer drawn above the wires: current flow when running, and a tag on each wire */
function aidWires(A){
  let s='';const fed={};
  st.wires.forEach((w,i)=>{
    const a=termPos(w.a),b=termPos(w.b);if(!a||!b)return;
    const k=mpOfKey(w.a,A)||mpOfKey(w.b,A);
    if(mpRun(A,k)&&!A.sw.has(i)){
      /* conventional current leaves a panel's + and the inverter's DC−, and enters a panel's − and the inverter's DC+ */
      const src=x=>(x[0]==='i')===(typeOf(x)==='n');
      const [ka,kb]=src(w.a)||!src(w.b)?[w.a,w.b]:[w.b,w.a];
      s+=`<path class="wflow" d="${wirePath(ka,termPos(ka),kb,termPos(kb))}"/>`;
    }
  });
  st.wires.forEach((w,i)=>{
    const a=termPos(w.a),b=termPos(w.b);if(!a||!b)return;
    const m=bezMid(w),kd=wkind(w.a,w.b),k=mpOfKey(w.a,A)||mpOfKey(w.b,A);
    if(Math.hypot(b.x-a.x,b.y-a.y)<110)m.y=Math.min(a.y,b.y)-22; /* short hop between neighbours: lift the tag clear of the terminals */
    const inv=[w.a,w.b].find(x=>x[0]==='i'&&x.endsWith(':p'));
    if(inv&&mpRun(A,k)&&!fed[k]){
      fed[k]=1;const r=A.res.find(r=>r.k===k),bk=r.blk,P=bk.pv,v=bk.ns*P.vmp,c=bk.mp*P.imp;
      s+=tag(m.x,m.y,`${f(v)} V · ${f(c,1)} A · ${f(v*c/1000,2)} kW`,'run');
    }else if(AID.labels)s+=tag(m.x,m.y,kd.s,kd.lvl);
  });
  return s;
}

/* node voltages: each panel is a source from − to + (Voc open circuit, Vmp while the inverter runs, 25 °C) */
function aidPot(A){
  const keys=allKeys(),par={};keys.forEach(k=>par[k]=k);
  const fd=k=>{while(par[k]!==k){par[k]=par[par[k]];k=par[k]}return k};
  st.wires.forEach(w=>{if(w.a in par&&w.b in par){const x=fd(w.a),y=fd(w.b);if(x!==y)par[x]=y}});
  const adj={},add=(u,v,x)=>(adj[u]=adj[u]||[]).push([v,x]);
  st.panels.forEach(p=>{const k=A.pk[p.id],P=k?mpPV(k):PV,v=mpRun(A,k)?P.vmp:P.voc,n=fd(p.id+':n'),q=fd(p.id+':p');add(n,q,v);add(q,n,-v)});
  const V={},comp={},bad={};let c=0;
  [...mpKs().map(k=>fd(`i${k}:n`)),...keys.map(fd)].forEach(r=>{
    if(r in V)return;c++;V[r]=0;comp[r]=c;const q=[r];
    while(q.length){const u=q.shift();(adj[u]||[]).forEach(([v,x])=>{const want=V[u]+x;if(!(v in V)){V[v]=want;comp[v]=c;q.push(v)}else if(Math.abs(V[v]-want)>.01)bad[c]=1})}
  });
  return{fd,V,comp,bad};
}
function meterRead(A){
  const r=MTR.r.on,b=MTR.b.on;
  if(!r||!b)return{v:'- - -',note:'ลากปลายวัดสีแดงและสีดำไปแตะขั้วที่ต้องการวัด',lvl:'idle'};
  const P=aidPot(A),gr=P.fd(r),gb=P.fd(b),run=mpRun(A,mpOfKey(r,A)),mode=run?'แรงดันขณะทำงาน (Vmp)':'แรงดันเปิดวงจร (Voc)';
  if(P.comp[gr]!==P.comp[gb])return{v:'0.0',note:'ปลายวัดอยู่คนละวงจร ไม่มีทางเดินไฟระหว่างสองจุดนี้',lvl:'warn'};
  if(P.bad[P.comp[gr]])return{v:'0.0',note:'วงจรนี้ลัดวงจร แรงดันตกเหลือ 0 V และมีกระแสลัดสูง ลบสายที่มีฟ้าแลบก่อน',lvl:'err'};
  const v=P.V[gr]-P.V[gb],one=PV.voc;
  if(gr===gb||Math.abs(v)<.05)return{v:'0.0',note:'สองจุดนี้ต่อถึงกันด้วยสาย (ศักย์เท่ากัน) จึงอ่านได้ 0 V',lvl:'idle'};
  if(v<0)return{v:f(v,1),note:`ค่าติดลบ: ปลายแดงอยู่ฝั่ง − ของวงจร สลับสายมิเตอร์ (${mode} ที่ 25°C)`,lvl:'warn'};
  return{v:f(v,1),note:`${mode} ที่ 25°C ≈ ${f(v/(run?PV.vmp:one),1)} เท่าของแผงเดียว`,lvl:'ok'};
}

/* top layer: hint beside the wire being drawn, and the multimeter */
function aidTop(A){
  let s='';
  if(typeof wiring!=='undefined'&&wiring&&wiring.moved){
    const kd=wiring.cand?wkind(wiring.from,wiring.cand):null;
    s+=tag(wiring.x+12+60,wiring.y-22,kd?kd.t.replace(/^.*= /,'')+(kd.lvl==='err'?' !':''):'ลากไปปล่อยที่ขั้วปลายทาง','hint '+(kd?kd.lvl:'idle'));
  }else if(st.armed){
    const t=termPos(st.armed);if(t)s+=tag(t.x,t.y-26,`เลือก ${kname(st.armed)} แล้ว แตะขั้วที่สอง`,'hint idle');
  }
  if(!AID.meter)return s;
  ['r','b'].forEach(c=>{const p=MTR[c];if(p.on&&!allKeys().includes(p.on))p.on=null;if(p.on){const t=termPos(p.on);p.x=t.x;p.y=t.y}});
  const R=meterRead(A),bx=MTR.x,by=MTR.y;
  if(R.v+R.note!==MTR.last&&MTR.r.on&&MTR.b.on&&!MTR.drag){MTR.last=R.v+R.note;aidLog(`มิเตอร์ ${kname(MTR.r.on)} (แดง) ↔ ${kname(MTR.b.on)} (ดำ) = ${R.v} V · ${R.note}`,R.lvl)}
  ['b','r'].forEach(c=>{
    const p=MTR[c],ox=bx+(c==='r'?150:40),oy=by;
    s+=`<path class="plead ${c}" d="M${ox},${oy} C${ox},${oy-60} ${p.x},${p.y+70} ${p.x},${p.y+18}"/>`;
  });
  s+=`<g class="mbox" data-mbox="1"><rect x="${bx}" y="${by}" width="190" height="96" rx="12"/><rect class="lcd" x="${bx+12}" y="${by+12}" width="166" height="44" rx="6"/>`
    +`<text class="mval ${R.lvl}" x="${bx+170}" y="${by+46}">${R.v}</text><text class="munit" x="${bx+18}" y="${by+30}">DC V</text>`
    +`<text class="mlab" x="${bx+12}" y="${by+76}">มัลติมิเตอร์ · ลากกล่องเพื่อย้าย</text><title>${esc(R.note)}</title></g>`;
  ['b','r'].forEach(c=>{const p=MTR[c];s+=`<g class="probe ${c}${p.on?' on':''}" data-probe="${c}"><circle class="phit" cx="${p.x}" cy="${p.y}" r="22"/><path d="M${p.x-5},${p.y+46} L${p.x-4},${p.y+10} L${p.x},${p.y} L${p.x+4},${p.y+10} L${p.x+5},${p.y+46} Z"/><title>ปลายวัดสี${c==='r'?'แดง (+)':'ดำ (COM)'} ลากไปแตะขั้ว</title></g>`});
  return s;
}

/* panels below the canvas: meter note, schematic per MPPT, log */
function aidPanels(A){
  const mn=document.getElementById('wmnote');
  if(mn){mn.hidden=!AID.meter;if(AID.meter){const R=meterRead(A);mn.className='wmnote '+R.lvl;mn.innerHTML=`<b>มิเตอร์ ${R.v} V</b><span>${esc(R.note)}</span>`}}
  const el=document.getElementById('wschem');if(!el)return;
  el.innerHTML=A.res.map(r=>{
    if(r.status==='idle')return`<div class="sch idle"><b>MPPT ${r.k}</b><span>ยังไม่ต่อสาย</span></div>`;
    if(!r.blk)return`<div class="sch err"><b>MPPT ${r.k}</b><span>${esc(r.short)} วาดผังไม่ได้ ดูข้อแนะนำในการ์ดผลการต่อ</span></div>`;
    const b=r.blk,ns=Math.min(b.ns,10),mp=Math.min(b.mp,4),bw=30,gap=12,rowH=30,W2=50+ns*(bw+gap)+20,H2=20+mp*rowH+16,run=mpRun(A,r.k);
    let g='';
    for(let j=0;j<mp;j++){
      const y=20+j*rowH;
      g+=`<line class="sl" x1="22" y1="${y}" x2="${W2-22}" y2="${y}"/>`;
      for(let i=0;i<ns;i++){const x=40+i*(bw+gap);g+=`<rect class="sp" x="${x}" y="${y-9}" width="${bw}" height="18" rx="2"/><text class="spt" x="${x+bw/2}" y="${y+4}">${i===ns-1&&b.ns>ns?'…':'+'}</text>`}
    }
    g=`<line class="rail n" x1="22" y1="12" x2="22" y2="${H2-8}"/><line class="rail p" x1="${W2-22}" y1="12" x2="${W2-22}" y2="${H2-8}"/>`+g+`<text class="rl" x="22" y="${H2+4}">DC${r.k}−</text><text class="rl" x="${W2-22}" y="${H2+4}">DC${r.k}+</text>`;
    return`<div class="sch ${r.lvl}${run?' run':''}"><b>MPPT ${r.k} · ${b.ns}S${b.mp}P = ${b.n} แผง</b><span>อนุกรม ${b.ns} แผงต่อสตริง (แรงดันบวกกัน) · ขนาน ${b.mp} สตริง (กระแสบวกกัน)</span><svg viewBox="0 0 ${W2} ${H2+10}" style="max-width:${W2*1.3}px">${g}</svg><span class="mono">Voc ${f(b.voc)} V · Imp ${f(b.imp,1)} A${run?' · กำลังทำงาน':''}</span></div>`;
  }).join('');
  const lg=document.getElementById('wlog');if(lg&&!lg.dataset.init){lg.dataset.init=1;lg.innerHTML=logHTML()}
}

/* ---- pointer: meter box, probes ---- */
function aidDown(e){
  const pr=e.target.closest('[data-probe]'),mb=e.target.closest('[data-mbox]');
  if(!pr&&!mb)return false;
  const p=pt(e);
  if(pr){const c=pr.dataset.probe;MTR[c].on=null;MTR.drag={c,dx:0,dy:0}}
  else MTR.drag={box:1,dx:p.x-MTR.x,dy:p.y-MTR.y};
  e.preventDefault();render();return true;
}
function aidMove(e){
  if(trayDrag){trayDrag.g.style.left=e.clientX+'px';trayDrag.g.style.top=e.clientY+'px';if(Math.hypot(e.clientX-trayDrag.sx,e.clientY-trayDrag.sy)>6)trayDrag.moved=true;return true}
  if(!MTR.drag)return false;
  const p=pt(e);
  if(MTR.drag.box){MTR.x=Math.max(4,Math.min(W-194,p.x-MTR.drag.dx));MTR.y=Math.max(4,Math.min(H-100,p.y-MTR.drag.dy))}
  else{const q=MTR[MTR.drag.c];q.x=Math.max(6,Math.min(W-6,p.x));q.y=Math.max(6,Math.min(H-6,p.y))}
  render();return true;
}
function aidUp(e){
  if(trayDrag){const T=trayDrag;trayDrag=null;T.g.remove();trayDrop(T,e);return true}
  if(!MTR.drag)return false;
  const d=MTR.drag;MTR.drag=null;
  if(d.c){const q=MTR[d.c],k=nearest({x:q.x,y:q.y},null);if(k)q.on=k;MTR.last=''}
  render();return true;
}

/* ---- tray: drag a panel or the meter onto the canvas (tap = add at the next free slot) ---- */
function trayDrop(T,e){
  const r=svg.getBoundingClientRect(),inside=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;
  if(T.kind==='panel'){
    if(T.moved&&!inside)return;
    const p=addPanel();
    if(!p){aidLog(`ใส่แผงได้สูงสุด ${MAXP} แผง`,'warn');return}
    if(T.moved){const q=pt(e);p.x=q.x-PW/2;p.y=q.y-PH/2;p.sx=1000+p.id;clampPanel(p)}
    st.sel=p.id;aidLog(`วางแผง #${p.id} (${PV.name} ${PV.pmax} W) ลงพื้นที่`,'idle');render();
  }else{
    if(T.moved&&!inside)return;
    if(T.moved){const q=pt(e);AID.meter=true;MTR.x=Math.max(4,Math.min(W-194,q.x-95));MTR.y=Math.max(4,Math.min(H-100,q.y-48))}
    else AID.meter=!AID.meter;
    if(AID.meter&&!MTR.r.on){MTR.r.x=MTR.x+150;MTR.r.y=Math.max(30,MTR.y-40);MTR.b.x=MTR.x+40;MTR.b.y=Math.max(30,MTR.y-40)}
    syncAidUI();render();
  }
}
function syncAidUI(){
  const q=id=>document.getElementById(id);
  if(q('wlab')){q('wlab').classList.toggle('on',AID.labels);q('wlab').setAttribute('aria-pressed',AID.labels)}
  if(q('wrun')){q('wrun').classList.toggle('on',AID.run);q('wrun').textContent=AID.run?'■ หยุดระบบ':'▶ เดินระบบ'}
  if(q('wmeter')){q('wmeter').classList.toggle('on',AID.meter);q('wmeter').setAttribute('aria-pressed',AID.meter)}
}
(function(){
  const q=id=>document.getElementById(id);
  document.querySelectorAll('[data-tray]').forEach(b=>b.addEventListener('pointerdown',e=>{
    const g=document.createElement('div');g.className='trayghost '+b.dataset.tray;g.textContent=b.dataset.tray==='panel'?'แผง':'DC V';
    g.style.left=e.clientX+'px';g.style.top=e.clientY+'px';document.body.appendChild(g);
    trayDrag={kind:b.dataset.tray,g,sx:e.clientX,sy:e.clientY,moved:false};e.preventDefault();
  }));
  if(q('wlab'))q('wlab').addEventListener('click',()=>{AID.labels=!AID.labels;syncAidUI();render()});
  if(q('wmeter'))q('wmeter').addEventListener('click',()=>trayDrop({kind:'meter',moved:false},{clientX:0,clientY:0}));
  if(q('wrun'))q('wrun').addEventListener('click',()=>{
    AID.run=!AID.run;syncAidUI();MTR.last='';
    const A=analyze();
    if(AID.run)A.res.forEach(r=>{if(r.status==='idle')return;if(r.blk&&r.lvl!=='err'){const P=r.blk.pv;aidLog(`เดินระบบ MPPT ${r.k}: ${f(r.blk.ns*P.vmp)} V × ${f(r.blk.mp*P.imp,1)} A ≈ ${f(r.blk.ns*P.vmp*r.blk.mp*P.imp/1000,2)} kW (ค่า STC)`,r.lvl)}else aidLog(`MPPT ${r.k} ไม่ทำงาน: ${r.short} แก้การต่อสายก่อน`,'err')});
    else aidLog('หยุดระบบ อินเวอร์เตอร์ไม่ดึงกระแส แรงดันกลับเป็น Voc','idle');
    if(AID.run&&!A.res.some(r=>r.status!=='idle'))aidLog('ยังไม่มีสายเข้า MPPT ต่อปลายสตริงเข้าอินเวอร์เตอร์ก่อน','warn');
    render();
  });
  if(q('wlogclr'))q('wlogclr').addEventListener('click',()=>{AID.log=[];q('wlog').innerHTML=logHTML()});
  document.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>aidLog('โหลดตัวอย่าง: '+b.textContent.trim(),'idle')));
  syncAidUI();
})();
