/* ---- เมนู 03 ตัวช่วยให้เข้าใจง่าย (แนวเดียวกับบทเรียนบอร์ดจำลองแบบโต้ตอบ):
   ถาดอุปกรณ์ลากวาง · ป้ายบอกชนิดสายบนสาย · คำใบ้ระหว่างลากสาย · เดินระบบ (ไฟไหลตามสาย + ค่า V/A)
   · มัลติมิเตอร์ DC (เลือกอุณหภูมิเซลล์) · แคลมป์มิเตอร์วัดกระแสรายสาย · ภารกิจทีละขั้น · โจทย์หาจุดเสีย
   · ผังวงจรย่อ · บันทึกการทำงาน ---- */
const AID={labels:true,run:false,meter:false,clamp:false,tc:'25',log:[],mis:{},misDone:{},fault:null};
const MTR={x:24,y:H-128,r:{x:120,y:H-150,on:null},b:{x:170,y:H-150,on:null},drag:null,last:''};
const CLP={x:300,y:H-60,on:null,drag:null,last:''};
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

/* cell temperature for the meters: coldest / STC / hottest from the site settings */
const cellT=()=>AID.tc==='min'?+st.tmin:AID.tc==='max'?+st.thot:25;
const vAt=(P,run)=>{const d=cellT()-25;return run?P.vmp*(1+(d<0?+P.kVoc:+P.kPmax)/100*d):P.voc*(1+(+P.kVoc)/100*d)};
const iAt=P=>P.imp*(1+((+P.kIsc)||0.05)/100*(cellT()-25));
/* hidden fault (fault-finding exercise): an open MC4 joint, or a panel with one bypass diode shorted (2/3 voltage) */
const fwKey=w=>w&&[w.a,w.b].sort().join('|');
const fIsWire=w=>AID.fault&&AID.fault.type==='open'&&fwKey(w)===AID.fault.w;
const fWeak=id=>AID.fault&&AID.fault.type==='weak'&&AID.fault.id===id?2/3:1;

const mpOfKey=(k,A)=>k[0]==='i'?+k.slice(1,k.indexOf(':')):A.pk[+k.split(':')[0]];
function fOpenK(A){if(!AID.fault||AID.fault.type!=='open')return 0;const w=st.wires.find(fIsWire);return w?(mpOfKey(w.a,A)||mpOfKey(w.b,A)||0):0}
const mpRun=(A,k)=>{const r=k&&A.res.find(r=>r.k===k);return!!(AID.run&&r&&r.blk&&r.lvl!=='err'&&fOpenK(A)!==k)};
function bezCtl(w){
  const a=termPos(w.a),b=termPos(w.b),da=dirVec(w.a),db=dirVec(w.b),dist=Math.hypot(b.x-a.x,b.y-a.y),kk=30+Math.min(dist*.25,90);
  return[a,{x:a.x+da.x*kk,y:a.y+da.y*kk},{x:b.x+db.x*kk,y:b.y+db.y*kk},b];
}
function bezAt(w,t){const[p0,p1,p2,p3]=bezCtl(w),u=1-t;return{x:u*u*u*p0.x+3*u*u*t*p1.x+3*u*t*t*p2.x+t*t*t*p3.x,y:u*u*u*p0.y+3*u*u*t*p1.y+3*u*t*t*p2.y+t*t*t*p3.y}}
const bezMid=w=>bezAt(w,.5);
function tag(x,y,txt,cls){
  const w=Math.max(30,txt.length*6.6+14);
  return`<g class="wtag ${cls||''}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><rect x="${-w/2}" y="-10" width="${w}" height="20" rx="10"/><text y="4">${esc(txt)}</text></g>`;
}
/* string voltage and current of one running MPPT, at the chosen cell temperature */
function mpVI(A,k,P0){const r=A.res.find(r=>r.k===k),bk=r.blk,P=P0||aidPot(A),v=P.V[P.fd(`i${k}:p`)]-P.V[P.fd(`i${k}:n`)],c=bk.mp*iAt(bk.pv);return{v,c,n:bk.ns,exp:bk.ns*vAt(bk.pv,true)}}

/* layer drawn above the wires: current flow when running, and a tag on each wire */
function aidWires(A){
  let s='';const fed={},P=aidPot(A);
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
      fed[k]=1;const q=mpVI(A,k,P);
      s+=tag(m.x,m.y,`${f(q.v)} V · ${f(q.c,1)} A · ${f(q.v*q.c/1000,2)} kW`,'run');
    }else if(AID.labels)s+=tag(m.x,m.y,kd.s,kd.lvl);
  });
  return s;
}

/* node voltages: each panel is a source from − to + (Voc open circuit, Vmp while the inverter runs) */
function aidPot(A){
  const keys=allKeys(),par={};keys.forEach(k=>par[k]=k);
  const fd=k=>{while(par[k]!==k){par[k]=par[par[k]];k=par[k]}return k};
  st.wires.forEach(w=>{if(fIsWire(w))return;if(w.a in par&&w.b in par){const x=fd(w.a),y=fd(w.b);if(x!==y)par[x]=y}});
  const adj={},add=(u,v,x)=>(adj[u]=adj[u]||[]).push([v,x]);
  st.panels.forEach(p=>{const k=A.pk[p.id],P=k?mpPV(k):PV,v=vAt(P,mpRun(A,k))*fWeak(p.id),n=fd(p.id+':n'),q=fd(p.id+':p');add(n,q,v);add(q,n,-v)});
  const V={},comp={},bad={};let c=0;
  [...mpKs().map(k=>fd(`i${k}:n`)),...keys.map(fd)].forEach(r=>{
    if(r in V)return;c++;V[r]=0;comp[r]=c;const q=[r];
    while(q.length){const u=q.shift();(adj[u]||[]).forEach(([v,x])=>{const want=V[u]+x;if(!(v in V)){V[v]=want;comp[v]=c;q.push(v)}else if(Math.abs(V[v]-want)>.01)bad[c]=1})}
  });
  return{fd,V,comp,bad};
}
function meterRead(A){
  const r=MTR.r.on,b=MTR.b.on;
  if(!r||!b)return{v:'- - -',note:'ลากปลายวัดสีแดงและสีดำไปแตะขั้วที่ต้องการวัด',lvl:'idle',x:0};
  const P=aidPot(A),gr=P.fd(r),gb=P.fd(b),run=mpRun(A,mpOfKey(r,A)),mode=(run?'แรงดันขณะทำงาน (Vmp)':'แรงดันเปิดวงจร (Voc)')+` ที่เซลล์ ${cellT()}°C`;
  if(P.comp[gr]!==P.comp[gb])return{v:'0.0',note:'ปลายวัดอยู่คนละวงจร ไม่มีทางเดินไฟระหว่างสองจุดนี้',lvl:'warn',x:0};
  if(P.bad[P.comp[gr]])return{v:'0.0',note:'วงจรนี้ลัดวงจร แรงดันตกเหลือ 0 V และมีกระแสลัดสูง ลบสายที่มีฟ้าแลบก่อน',lvl:'err',x:0};
  const v=P.V[gr]-P.V[gb],x=v/vAt(PV,run);
  if(gr===gb||Math.abs(v)<.05)return{v:'0.0',note:'สองจุดนี้ต่อถึงกันด้วยสาย (ศักย์เท่ากัน) จึงอ่านได้ 0 V',lvl:'idle',x:0};
  if(v<0)return{v:f(v,1),note:`ค่าติดลบ: ปลายแดงอยู่ฝั่ง − ของวงจร สลับสายมิเตอร์ (${mode})`,lvl:'warn',x:0};
  return{v:f(v,1),note:`${mode} ≈ ${f(x,1)} เท่าของแผงเดียว (แผงเดียว ${f(vAt(PV,run),1)} V)`,lvl:'ok',x};
}

/* wire currents while running: panels push Imp from − to +, each running MPPT takes the string current in at DC+.
   Wires form a forest over the terminals; the current in a tree wire is the net injection of the subtree below it
   (a redundant second wire between the same two points carries none in this model) */
function aidCur(A){
  const I={},inj={},add=(k,x)=>inj[k]=(inj[k]||0)+x;
  st.panels.forEach(p=>{const k=A.pk[p.id];if(!mpRun(A,k))return;const c=iAt(mpPV(k));add(p.id+':p',c);add(p.id+':n',-c)});
  mpKs().forEach(k=>{if(!mpRun(A,k))return;const r=A.res.find(r=>r.k===k),c=r.blk.mp*iAt(r.blk.pv);add(`i${k}:p`,-c);add(`i${k}:n`,c)});
  const adj={};st.wires.forEach((w,i)=>{if(fIsWire(w))return;(adj[w.a]=adj[w.a]||[]).push([w.b,i]);(adj[w.b]=adj[w.b]||[]).push([w.a,i])});
  const seen={};
  Object.keys(adj).forEach(r=>{
    if(seen[r])return;const order=[],up={};seen[r]=1;const q=[r];
    while(q.length){const u=q.shift();order.push(u);adj[u].forEach(([v,i])=>{if(!seen[v]){seen[v]=1;up[v]=[u,i];q.push(v)}})}
    const sub={};order.reverse().forEach(u=>{sub[u]=(sub[u]||0)+(inj[u]||0);if(up[u]){const[p,i]=up[u];I[i]=Math.abs(sub[u]);sub[p]=(sub[p]||0)+sub[u]}});
  });
  return I;
}
const clampIdx=()=>CLP.on?st.wires.findIndex(w=>fwKey(w)===CLP.on.k):-1;
function clampRead(A){
  const i=clampIdx();
  if(i<0)return{v:'- - -',note:'ลากแคลมป์ไปคล้องสายเส้นใดก็ได้',lvl:'idle',n:0};
  const w=st.wires[i],nm=`${kname(w.a)}–${kname(w.b)}`;
  if(!AID.run)return{v:'0.0',note:`สาย ${nm}: ระบบหยุดอยู่ ไม่มีกระแส กด ▶ เดินระบบ`,lvl:'idle',n:0};
  const c=aidCur(A)[i]||0;
  if(c<.05)return{v:'0.0',note:`สาย ${nm}: ไม่มีกระแสไหล (MPPT นี้ไม่ทำงาน หรือสายเส้นนี้ไม่อยู่ในทางเดินไฟ)`,lvl:'warn',n:0};
  return{v:f(c,1),note:`สาย ${nm}: กระแส ≈ ${f(c,1)} A ที่เซลล์ ${cellT()}°C (แผงเดียว Imp ${f(iAt(PV),2)} A)`,lvl:'ok',n:c};
}

/* top layer: hint beside the wire being drawn, the multimeter and the clamp meter */
function aidTop(A){
  let s='';
  if(typeof wiring!=='undefined'&&wiring&&wiring.moved){
    const kd=wiring.cand?wkind(wiring.from,wiring.cand):null;
    s+=tag(wiring.x+12+60,wiring.y-22,kd?kd.t.replace(/^.*= /,'')+(kd.lvl==='err'?' !':''):'ลากไปปล่อยที่ขั้วปลายทาง','hint '+(kd?kd.lvl:'idle'));
  }else if(st.armed){
    const t=termPos(st.armed);if(t)s+=tag(t.x,t.y-26,`เลือก ${kname(st.armed)} แล้ว แตะขั้วที่สอง`,'hint idle');
  }
  if(AID.clamp){
    const i=clampIdx();if(CLP.on&&i<0)CLP.on=null;
    if(CLP.on&&!CLP.drag){const q=bezAt(st.wires[i],CLP.on.t);CLP.x=q.x;CLP.y=q.y}
    const R=clampRead(A),x=CLP.x,y=CLP.y;
    if(R.n>0)AID.mis.clamp=1;
    if(CLP.on&&!CLP.drag&&R.v+R.note!==CLP.last){CLP.last=R.v+R.note;aidLog('แคลมป์ '+R.v+' A · '+R.note,R.lvl)}
    s+=`<g class="clamp${CLP.on?' on':''}" data-clamp="1"><circle class="chit" cx="${x}" cy="${y}" r="26"/><circle class="cjaw" cx="${x}" cy="${y}" r="15"/><path class="chand" d="M${x+10},${y+11} L${x+22},${y+34} L${x+34},${y+28} L${x+18},${y+6} Z"/>`
      +`<rect class="clcd" x="${x+24}" y="${y-44}" width="92" height="30" rx="6"/><text class="cval ${R.lvl}" x="${x+110}" y="${y-22}">${R.v} A</text><title>${esc(R.note)}</title></g>`;
  }
  if(!AID.meter)return s;
  ['r','b'].forEach(c=>{const p=MTR[c];if(p.on&&!allKeys().includes(p.on))p.on=null;if(p.on){const t=termPos(p.on);p.x=t.x;p.y=t.y}});
  const R=meterRead(A),bx=MTR.x,by=MTR.y;
  if(R.x>=2.9)AID.mis.meas=1;
  if(R.v+R.note!==MTR.last&&MTR.r.on&&MTR.b.on&&!MTR.drag){MTR.last=R.v+R.note;aidLog(`มิเตอร์ ${kname(MTR.r.on)} (แดง) ↔ ${kname(MTR.b.on)} (ดำ) = ${R.v} V · ${R.note}`,R.lvl)}
  ['b','r'].forEach(c=>{
    const p=MTR[c],ox=bx+(c==='r'?150:40),oy=by;
    s+=`<path class="plead ${c}" d="M${ox},${oy} C${ox},${oy-60} ${p.x},${p.y+70} ${p.x},${p.y+18}"/>`;
  });
  s+=`<g class="mbox" data-mbox="1"><rect x="${bx}" y="${by}" width="190" height="96" rx="12"/><rect class="lcd" x="${bx+12}" y="${by+12}" width="166" height="44" rx="6"/>`
    +`<text class="mval ${R.lvl}" x="${bx+170}" y="${by+46}">${R.v}</text><text class="munit" x="${bx+18}" y="${by+30}">DC V</text><text class="munit" x="${bx+18}" y="${by+48}">${cellT()}°C</text>`
    +`<text class="mlab" x="${bx+12}" y="${by+76}">มัลติมิเตอร์ · ลากกล่องเพื่อย้าย</text><title>${esc(R.note)}</title></g>`;
  ['b','r'].forEach(c=>{const p=MTR[c];s+=`<g class="probe ${c}${p.on?' on':''}" data-probe="${c}"><circle class="phit" cx="${p.x}" cy="${p.y}" r="22"/><path d="M${p.x-5},${p.y+46} L${p.x-4},${p.y+10} L${p.x},${p.y} L${p.x+4},${p.y+10} L${p.x+5},${p.y+46} Z"/><title>ปลายวัดสี${c==='r'?'แดง (+)':'ดำ (COM)'} ลากไปแตะขั้ว</title></g>`});
  return s;
}

/* step-by-step mission (like the lessons of an interactive board course) */
const MIS=[
  ['วางแผงอย่างน้อย 3 แผง (ลากจากถาดอุปกรณ์ หรือกด + แผง)',(A)=>st.panels.length>=3],
  ['ต่ออนุกรม 3 แผงขึ้นไปเป็น 1 สตริง (+ ของแผงหนึ่ง ต่อ − ของแผงถัดไป)',(A)=>{const P=aidPot(A),lo={},hi={};Object.keys(P.V).forEach(g=>{const c=P.comp[g];lo[c]=Math.min(lo[c]??1e9,P.V[g]);hi[c]=Math.max(hi[c]??-1e9,P.V[g])});const one=vAt(PV,true)*.98;return Object.keys(lo).some(c=>!P.bad[c]&&hi[c]-lo[c]>=2.95*one)}],
  ['วัดแรงดันหัวท้ายสตริงด้วยมัลติมิเตอร์ (ได้อย่างน้อย 3 เท่าของแผงเดียว)',()=>!!AID.mis.meas],
  ['ต่อปลายสตริงเข้า DC+ / DC− ของ MPPT ให้ผ่านการตรวจ',(A)=>A.res.some(r=>r.blk&&r.lvl!=='err')],
  ['กด ▶ เดินระบบ ให้อินเวอร์เตอร์ทำงาน',(A)=>A.res.some(r=>mpRun(A,r.k))],
  ['ใช้แคลมป์มิเตอร์วัดกระแสในสายขณะเดินระบบ',()=>!!AID.mis.clamp]
];

/* panels below the canvas: meter note, mission, schematic per MPPT, log */
function aidPanels(A){
  const mn=document.getElementById('wmnote');
  if(mn){const on=AID.meter||AID.clamp;mn.hidden=!on;if(on){const R=AID.meter?meterRead(A):null,C=AID.clamp?clampRead(A):null,lv=[R,C].filter(Boolean).map(x=>x.lvl);mn.className='wmnote '+(lv.includes('err')?'err':lv.includes('warn')?'warn':lv.includes('ok')?'ok':'idle');mn.innerHTML=(R?`<div><b>มิเตอร์ ${R.v} V</b> <span>${esc(R.note)}</span></div>`:'')+(C?`<div><b>แคลมป์ ${C.v} A</b> <span>${esc(C.note)}</span></div>`:'')}}
  const ml=document.getElementById('wmisl');
  if(ml){
    let first=-1;const done=MIS.map(([t,fn],i)=>{const d=!!fn(A);if(!d&&first<0)first=i;return d});
    done.forEach((d,i)=>{if(d&&!AID.misDone[i]){AID.misDone[i]=1;aidLog(`ภารกิจข้อ ${i+1} สำเร็จ: ${MIS[i][0]}`,'ok')}});
    const n=done.filter(Boolean).length;
    ml.innerHTML=MIS.map(([t],i)=>`<li class="${done[i]?'done':i===first?'now':''}"><span class="mk">${done[i]?'✓':i+1}</span><span>${esc(t)}</span></li>`).join('');
    const pp=document.getElementById('wmisp');if(pp)pp.textContent=`${n}/${MIS.length}`;
    const pb=document.getElementById('wmisbar');if(pb)pb.style.width=(n/MIS.length*100)+'%';
  }
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

/* ---- pointer: meter box, probes, clamp ---- */
function aidDown(e){
  const pr=e.target.closest('[data-probe]'),mb=e.target.closest('[data-mbox]'),cl=e.target.closest('[data-clamp]');
  if(!pr&&!mb&&!cl)return false;
  const p=pt(e);
  if(cl){CLP.on=null;CLP.drag={dx:p.x-CLP.x,dy:p.y-CLP.y}}
  else if(pr){const c=pr.dataset.probe;MTR[c].on=null;MTR.drag={c,dx:0,dy:0}}
  else MTR.drag={box:1,dx:p.x-MTR.x,dy:p.y-MTR.y};
  e.preventDefault();render();return true;
}
function aidMove(e){
  if(trayDrag){trayDrag.g.style.left=e.clientX+'px';trayDrag.g.style.top=e.clientY+'px';if(Math.hypot(e.clientX-trayDrag.sx,e.clientY-trayDrag.sy)>6)trayDrag.moved=true;return true}
  if(CLP.drag){const p=pt(e);CLP.x=Math.max(6,Math.min(W-120,p.x-CLP.drag.dx));CLP.y=Math.max(50,Math.min(H-40,p.y-CLP.drag.dy));render();return true}
  if(!MTR.drag)return false;
  const p=pt(e);
  if(MTR.drag.box){MTR.x=Math.max(4,Math.min(W-194,p.x-MTR.drag.dx));MTR.y=Math.max(4,Math.min(H-100,p.y-MTR.drag.dy))}
  else{const q=MTR[MTR.drag.c];q.x=Math.max(6,Math.min(W-6,p.x));q.y=Math.max(6,Math.min(H-6,p.y))}
  render();return true;
}
/* nearest point on any wire (sampled along its curve) */
function wireNear(p,lim){let best=null;st.wires.forEach(w=>{for(let i=1;i<40;i++){const t=i/40,q=bezAt(w,t),d=Math.hypot(q.x-p.x,q.y-p.y);if(d<lim&&(!best||d<best.d))best={d,k:fwKey(w),t}}});return best}
function aidUp(e){
  if(trayDrag){const T=trayDrag;trayDrag=null;T.g.remove();trayDrop(T,e);return true}
  if(CLP.drag){CLP.drag=null;const b=wireNear({x:CLP.x,y:CLP.y},44);CLP.on=b?{k:b.k,t:b.t}:null;CLP.last='';render();return true}
  if(!MTR.drag)return false;
  const d=MTR.drag;MTR.drag=null;
  if(d.c){const q=MTR[d.c],k=nearest({x:q.x,y:q.y},null);if(k)q.on=k;MTR.last=''}
  render();return true;
}

/* ---- tray: drag a panel, the meter or the clamp onto the canvas (tap = add at the next free slot / toggle) ---- */
function trayDrop(T,e){
  const r=svg.getBoundingClientRect(),inside=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;
  if(T.moved&&!inside)return;
  if(T.kind==='panel'){
    const p=addPanel();
    if(!p){aidLog(`ใส่แผงได้สูงสุด ${MAXP} แผง`,'warn');return}
    if(T.moved){const q=pt(e);p.x=q.x-PW/2;p.y=q.y-PH/2;p.sx=1000+p.id;clampPanel(p)}
    st.sel=p.id;aidLog(`วางแผง #${p.id} (${PV.name} ${PV.pmax} W) ลงพื้นที่`,'idle');render();
  }else if(T.kind==='clamp'){
    if(T.moved){const q=pt(e);AID.clamp=true;CLP.x=q.x;CLP.y=q.y;const b=wireNear(q,44);CLP.on=b?{k:b.k,t:b.t}:null;CLP.last=''}
    else AID.clamp=!AID.clamp;
    syncAidUI();render();
  }else{
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
  if(q('wclamp')){q('wclamp').classList.toggle('on',AID.clamp);q('wclamp').setAttribute('aria-pressed',AID.clamp)}
  if(q('wfault')){q('wfault').classList.toggle('on',!!AID.fault||!q('wfaultbox').hidden)}
}

/* ---- fault-finding exercise: the same code gives every trainee the same hidden fault ---- */
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
function faultStart(code){
  const R=rng(code*7919+13),A0=analyze(),e=A0.ev,I=A0.I;
  const lo=Math.max(2,Math.ceil(I.lo/e.vmpH)+1),hi=Math.max(lo,Math.min(9,Math.floor(I.vmax/e.vocC)));
  const n=lo+Math.floor(R()*(hi-lo+1));
  applyScale(n>7?.8:1);INV=INV0();resetWith(n);wireSeries(st.panels.map(p=>p.id),1);
  const open=R()<.5;
  if(open){const w=st.wires[Math.floor(R()*st.wires.length)];AID.fault={code,type:'open',w:fwKey(w)}}
  else AID.fault={code,type:'weak',id:1+Math.floor(R()*n)};
  AID.fault.tries=0;AID.run=false;AID.meter=true;MTR.r.on=null;MTR.b.on=null;MTR.last='';
  MTR.r.x=MTR.x+150;MTR.r.y=MTR.y-40;MTR.b.x=MTR.x+40;MTR.b.y=MTR.y-40;
  const sel=document.getElementById('wfsel');
  sel.innerHTML='<option value="">— เลือกจุดที่คิดว่าเสีย —</option>'+st.panels.map(p=>`<option value="p${p.id}">แผง #${p.id} (แรงดันแผงผิดปกติ)</option>`).join('')+st.wires.map(w=>`<option value="w${fwKey(w)}">ขั้วต่อ/สาย ${kname(w.a)} – ${kname(w.b)} (หลวมหรือขาด)</option>`).join('');
  document.getElementById('wfans').hidden=false;
  document.getElementById('wfmsg').innerHTML=`โจทย์ <b>${code}</b>: สตริง ${n} แผงต่ออนุกรมเข้า MPPT 1 ลูกค้าแจ้งว่าระบบผลิตไฟไม่ได้หรือได้น้อยผิดปกติ ใช้มัลติมิเตอร์วัด Voc ทีละแผงและข้ามแต่ละจุดต่อ แล้วเลือกคำตอบ`;
  aidLog(`เริ่มโจทย์หาจุดเสีย รหัส ${code} (${n} แผง)`,'warn');syncAidUI();render();
}
function faultCheck(){
  const F=AID.fault,v=document.getElementById('wfsel').value,m=document.getElementById('wfmsg');if(!F||!v)return;
  F.tries++;
  const ok=F.type==='open'?v==='w'+F.w:v==='p'+F.id;
  if(ok){
    const why=F.type==='open'?'ขั้ว MC4 จุดนี้หลวม/สายขาด วัดคร่อมจุดต่อนี้จึงได้แรงดันของทั้งสตริง ขณะที่วัดแต่ละแผงปกติทุกแผง':`แผง #${F.id} มีบายพาสไดโอดลัด 1 ใน 3 ชุด แรงดันเหลือราว 2/3 ของแผงปกติ`;
    m.innerHTML=`<b class="okc">ถูกต้อง!</b> ${why} (ตอบ ${F.tries} ครั้ง) กด "จบโจทย์" แล้วลองรหัสใหม่ได้`;
    aidLog(`โจทย์ ${F.code}: ตอบถูกใน ${F.tries} ครั้ง · ${why}`,'ok');
  }else{m.innerHTML=`<b class="errc">ยังไม่ใช่</b> ลองวัดเพิ่ม: วัด + กับ − ของแต่ละแผง (ควรได้ใกล้ ${f(vAt(PV,false),1)} V) และวัดคร่อมแต่ละจุดต่อ (จุดต่อปกติวัดได้ 0 V) (ตอบไปแล้ว ${F.tries} ครั้ง)`;aidLog(`โจทย์ ${F.code}: คำตอบที่ ${F.tries} ยังไม่ถูก`,'warn')}
}
function faultEnd(){if(AID.fault)aidLog(`จบโจทย์หาจุดเสีย รหัส ${AID.fault.code}`,'idle');AID.fault=null;document.getElementById('wfans').hidden=true;document.getElementById('wfmsg').textContent='';syncAidUI();render()}

(function(){
  const q=id=>document.getElementById(id);
  document.querySelectorAll('[data-tray]').forEach(b=>b.addEventListener('pointerdown',e=>{
    const g=document.createElement('div');g.className='trayghost '+b.dataset.tray;g.textContent={panel:'แผง',meter:'DC V',clamp:'A'}[b.dataset.tray];
    g.style.left=e.clientX+'px';g.style.top=e.clientY+'px';document.body.appendChild(g);
    trayDrag={kind:b.dataset.tray,g,sx:e.clientX,sy:e.clientY,moved:false};e.preventDefault();
  }));
  if(q('wlab'))q('wlab').addEventListener('click',()=>{AID.labels=!AID.labels;syncAidUI();render()});
  if(q('wmeter'))q('wmeter').addEventListener('click',()=>trayDrop({kind:'meter',moved:false},{clientX:0,clientY:0}));
  if(q('wclamp'))q('wclamp').addEventListener('click',()=>trayDrop({kind:'clamp',moved:false},{clientX:0,clientY:0}));
  if(q('wtc'))q('wtc').addEventListener('change',e=>{AID.tc=e.target.value;MTR.last='';CLP.last='';aidLog(`อุณหภูมิเซลล์ตอนวัด: ${cellT()}°C`,'idle');render()});
  if(q('wrun'))q('wrun').addEventListener('click',()=>{
    AID.run=!AID.run;syncAidUI();MTR.last='';CLP.last='';
    const A=analyze();
    if(AID.run){const P=aidPot(A);A.res.forEach(r=>{if(r.status==='idle')return;
      if(r.blk&&r.lvl!=='err'&&fOpenK(A)===r.k){aidLog(`MPPT ${r.k}: อินเวอร์เตอร์แจ้งไม่มีแรงดัน PV (0 V) ทั้งที่ต่อสายครบ ตรวจหาจุดต่อที่หลวมหรือขาด`,'err');return}
      if(r.blk&&r.lvl!=='err'){const x=mpVI(A,r.k,P),low=x.v<x.exp*.95;aidLog(`เดินระบบ MPPT ${r.k}: ${f(x.v)} V × ${f(x.c,1)} A ≈ ${f(x.v*x.c/1000,2)} kW ที่เซลล์ ${cellT()}°C`+(low?` · แรงดันต่ำกว่าที่ควรได้ (${f(x.exp)} V) ตรวจแผงทีละแผง`:''),low?'warn':r.lvl)}
      else aidLog(`MPPT ${r.k} ไม่ทำงาน: ${r.short} แก้การต่อสายก่อน`,'err')})}
    else aidLog('หยุดระบบ อินเวอร์เตอร์ไม่ดึงกระแส แรงดันกลับเป็น Voc','idle');
    if(AID.run&&!A.res.some(r=>r.status!=='idle'))aidLog('ยังไม่มีสายเข้า MPPT ต่อปลายสตริงเข้าอินเวอร์เตอร์ก่อน','warn');
    render();
  });
  if(q('wlogclr'))q('wlogclr').addEventListener('click',()=>{AID.log=[];q('wlog').innerHTML=logHTML()});
  if(q('wmisr'))q('wmisr').addEventListener('click',()=>{AID.mis={};AID.misDone={};aidLog('เริ่มภารกิจใหม่','idle');render()});
  if(q('wfault'))q('wfault').addEventListener('click',()=>{const b=q('wfaultbox');b.hidden=!b.hidden;if(!b.hidden&&!q('wfcode').value)q('wfcode').value=1000+Math.floor(Math.random()*9000);syncAidUI()});
  if(q('wfrand'))q('wfrand').addEventListener('click',()=>{q('wfcode').value=1000+Math.floor(Math.random()*9000)});
  if(q('wfgo'))q('wfgo').addEventListener('click',()=>{const c=parseInt(q('wfcode').value,10);if(!(c>=1000&&c<=9999)){q('wfmsg').textContent='ใส่รหัสโจทย์ 4 หลัก (1000–9999)';return}faultStart(c)});
  if(q('wfchk'))q('wfchk').addEventListener('click',faultCheck);
  if(q('wfend'))q('wfend').addEventListener('click',faultEnd);
  document.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>{if(AID.fault)faultEnd();aidLog('โหลดตัวอย่าง: '+b.textContent.trim(),'idle')}));
  syncAidUI();
})();

/* ---- shared wiring helpers for menus 04 and 05 (same look and feel as menu 03) ---- */
const LOGS={};
function logTo(id,msg,lvl){
  const d=new Date(),t=[d.getHours(),d.getMinutes(),d.getSeconds()].map(x=>String(x).padStart(2,'0')).join(':');
  const L=LOGS[id]=LOGS[id]||[];L.unshift({t,msg,lvl:lvl||'idle'});if(L.length>40)L.length=40;logShow(id);
}
function logShow(id){
  const el=document.getElementById(id);if(!el)return;const L=LOGS[id]||[];
  el.innerHTML=L.length?L.map(x=>`<li class="${x.lvl}"><time>${x.t}</time><span>${esc(x.msg)}</span></li>`).join(''):'<li class="idle"><time>--:--</time><span>ยังไม่มีรายการ ลองต่อสายหรือลบสาย</span></li>';
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-logclr]');if(b){LOGS[b.dataset.logclr]=[];logShow(b.dataset.logclr)}});
/* mark the terminals a wire from `from` may go to (dashed ring = right kind) */
function pickMark(svg,attr,from,ok){
  svg.querySelectorAll(`[data-${attr}]`).forEach(g=>{const id=g.dataset[attr];g.classList.toggle('pick',!!from&&id!==from&&ok(from,id));g.classList.toggle('nopick',!!from&&id!==from&&!ok(from,id))});
}
/* floating tag beside the pointer (or a terminal) while wiring */
function hintAt(svg,x,y,txt,lvl){
  let g=svg.querySelector('g.wtag.hint');
  if(!txt){if(g)g.remove();return}
  if(!g){g=document.createElementNS('http://www.w3.org/2000/svg','g');svg.appendChild(g)}
  const w=Math.max(30,txt.length*6.6+14);
  g.setAttribute('class','wtag hint '+(lvl||'idle'));g.setAttribute('transform',`translate(${(x+w/2+14).toFixed(1)} ${(y-22).toFixed(1)})`);
  g.innerHTML=`<rect x="${-w/2}" y="-10" width="${w}" height="20" rx="10"/><text y="4">${esc(txt)}</text>`;
}
const KIND_TH={L:'L',L1:'L1',L2:'L2',L3:'L3',N:'N',PE:'PE','dc+':'DC+','dc-':'DC−',ba:'RS485 A',bb:'RS485 B',a:'RS485 A',b:'RS485 B',canh:'CAN H',canl:'CAN L',ct1:'CT S1',ct2:'CT S2','en+':'Enable+','en-':'Enable−',p:'DC+',n:'DC−',l:'AC L',nn:'AC N',g:'PE'};
const kindTh=k=>KIND_TH[k]||k;
