/* ---- ui ---- */
const svg=document.getElementById('svg');
const $=s=>document.querySelector(s);
let wiring=null,moving=null,invMove=null,tr=9,fsOn=false;

const ROT=[[1,0],[0,1],[-1,0],[0,-1]];
function termPos(k){
  if(k[0]==='i'){const n=+k[1],base=mpY(n);return{x:invRight()?IX+IW:IX,y:k.endsWith(":p")?base+22:base+100}}
  const id=+k.split(':')[0],p=st.panels.find(q=>q.id===id);
  if(!p)return null;
  const [c,s]=ROT[p.rot||0],sg=k.endsWith(':p')?1:-1;
  return{x:p.x+PW/2+sg*c*PW/2,y:p.y+PH/2+sg*s*PW/2};
}
function dirVec(k){
  if(k[0]==='i')return{x:invRight()?1:-1,y:0};
  const p=st.panels.find(q=>q.id===+k.split(':')[0]),[c,s]=ROT[(p&&p.rot)||0],sg=k.endsWith(':p')?1:-1;
  return{x:sg*c,y:sg*s};
}
function clampPanel(p){
  const vert=(p.rot||0)%2===1,hx=vert?PH/2:PW/2,hy=vert?PW/2:PH/2,m=18;
  const cx=Math.max(hx+m,Math.min(W-hx-m,p.x+PW/2)),cy=Math.max(hy+m,Math.min(H-hy-m,p.y+PH/2));
  p.x=cx-PW/2;p.y=cy-PH/2;
}
function rotPanel(id){
  const p=st.panels.find(q=>q.id===id);if(!p)return;
  p.rot=((p.rot||0)+1)%4;clampPanel(p);st.sel=id;render();
}
const typeOf=k=>k.slice(-1);
const allKeys=()=>{const a=[];st.panels.forEach(p=>a.push(p.id+':p',p.id+':n'));return a.concat(['i1:p','i1:n','i2:p','i2:n'])};
function pt(e){const m=svg.getScreenCTM();if(!m)return{x:0,y:0};const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse());return{x:p.x,y:p.y}}
function nearest(p,exclude){
  let best=null,bd=tr*2.4;
  allKeys().forEach(k=>{if(k===exclude)return;const t=termPos(k),d=Math.hypot(t.x-p.x,t.y-p.y);if(d<bd){bd=d;best=k}});
  return best;
}
function connect(a,b){
  if(!a||!b||a===b)return;
  if(st.wires.some(w=>(w.a===a&&w.b===b)||(w.a===b&&w.b===a)))return;
  st.wires.push({a,b});
}
function wirePath(ka,a,kb,b){
  const da=dirVec(ka),db=kb?dirVec(kb):{x:0,y:0},dist=Math.hypot(b.x-a.x,b.y-a.y),k=30+Math.min(dist*.25,90);
  return`M${a.x},${a.y} C${a.x+da.x*k},${a.y+da.y*k} ${b.x+db.x*k},${b.y+db.y*k} ${b.x},${b.y}`;
}

function drawSvg(A){
  const k0=.55+.45*Math.min(1,st.scale),hit=tr*2.2,fs=Math.round(tr*1.35),S=st.scale;
  const pw=12*S,ph=13*S;
  let s=`<defs><pattern id="cells" width="${pw}" height="${ph}" patternUnits="userSpaceOnUse"><path d="M${pw} 0V${ph}M0 ${ph}H${pw}" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="1"/></pattern></defs>`;
  const R=invRight(),tx=R?IX+IW-18:IX+18,ta=R?'end':'start';
  s+=`<g class="invbox${invMove?' moving':''}" data-inv="1"><title>ลากเพื่อย้ายตำแหน่งอินพุต MPPT</title>`;
  s+=`<text class="svgt b" x="${IX+80}" y="${INVY-12}" text-anchor="middle">${A.I.name}</text>`;
  s+=`<rect class="inv" x="${IX}" y="${INVY}" width="160" height="270" rx="8"/>`;
  s+=`<g class="grip"><circle cx="${IX+74}" cy="${INVY+5}" r="1.6"/><circle cx="${IX+80}" cy="${INVY+5}" r="1.6"/><circle cx="${IX+86}" cy="${INVY+5}" r="1.6"/></g>`;
  A.res.forEach(r=>{
    const base=mpY(r.k),cls=r.lvl==='idle'?'':r.lvl;
    s+=`<rect class="mp ${cls}" x="${IX+8}" y="${base}" width="144" height="120" rx="6"/>`;
    s+=`<text class="svgt b" x="${IX+28}" y="${base+46}">MPPT ${r.k}</text>`;
    s+=`<text class="svgt m" x="${IX+28}" y="${base+64}">${r.short}</text>`;
    if(r.blk)s+=`<text class="svgt m mut" x="${IX+28}" y="${base+82}">Voc ${f(r.blk.voc)} V</text>`;
    s+=`<text class="svgt m mut" x="${tx}" y="${base+26}" text-anchor="${ta}">DC${r.k}+</text><text class="svgt m mut" x="${tx}" y="${base+104}" text-anchor="${ta}">DC${r.k}−</text>`;
  });
  s+=`</g>`;
  /* panels first, wires on top of them so a wire is never hidden under a panel */
  const fsz=Math.max(8,12*S);
  st.panels.forEach(p=>{
    const cx=p.x+PW/2,cy=p.y+PH/2,vert=(p.rot||0)%2===1;
    let lab='';
    if(S>=.45)lab=`<text class="onp" style="font-size:${fsz}px" x="${cx}" y="${S>=.7?cy-2:cy+fsz*.35}">#${p.id}</text>`+(S>=.7?`<text class="onp" style="font-size:${fsz}px" x="${cx}" y="${cy+13*S+2}">${PV.pmax} W</text>`:'');
    s+=`<g class="panel${st.sel===p.id?' sel':''}${A.si.cyc.has(p.id)?' shorted':''}" data-panel="${p.id}"><g transform="rotate(${(p.rot||0)*90} ${cx} ${cy})"><rect class="pbody" x="${p.x}" y="${p.y}" width="${PW}" height="${PH}" rx="3"/><rect class="cells" x="${p.x}" y="${p.y}" width="${PW}" height="${PH}" rx="3" fill="url(#cells)"/></g>${lab}</g>`;
    if(st.sel===p.id){const rx=vert?cx+PH/2+20:cx,ry=vert?cy:cy-PH/2-20;s+=`<g class="rot" data-rot="${p.id}"><circle cx="${rx}" cy="${ry}" r="13"/><text x="${rx}" y="${ry+5}">↻</text><title>หมุนแผง 90°</title></g>`}
  });
  const badges=[];
  st.wires.forEach((w,i)=>{
    const a=termPos(w.a),b=termPos(w.b);if(!a||!b)return;
    const d=wirePath(w.a,a,w.b,b),same=typeOf(w.a)===typeOf(w.b);
    let cls='w-'+typeOf(w.a)+typeOf(w.a),sty='';
    if(!same){
      const P=typeOf(w.a)==='p'?a:b,N=typeOf(w.a)==='p'?b:a;
      s+=`<linearGradient id="g${i}" gradientUnits="userSpaceOnUse" x1="${P.x}" y1="${P.y}" x2="${N.x}" y2="${N.y}"><stop offset="0" style="stop-color:var(--pos)"/><stop offset=".42" style="stop-color:var(--pos)"/><stop offset=".58" style="stop-color:var(--neg)"/><stop offset="1" style="stop-color:var(--neg)"/></linearGradient>`;
      sty=` style="stroke:url(#g${i})"`;cls='';
    }
    if(A.sw.has(i)){
      const da=dirVec(w.a),db=dirVec(w.b),dist=Math.hypot(b.x-a.x,b.y-a.y),kk=30+Math.min(dist*.25,90);
      const pa=w.a.split(':')[0],pb=w.b.split(':')[0],own=pa===pb&&pa[0]!=='i'?st.panels.find(q=>q.id===+pa):null;
      badges.push(own?[own.x+PW/2,own.y-14]:[(a.x+3*(a.x+da.x*kk)+3*(b.x+db.x*kk)+b.x)/8,(a.y+3*(a.y+da.y*kk)+3*(b.y+db.y*kk)+b.y)/8]);
      s+=`<path class="wshort" d="${d}"/>`;
    }
    s+=`<path class="halo" d="${d}"/><path class="wire ${cls}"${sty} d="${d}"/><path class="whit" data-wire="${i}" d="${d}"><title>แตะเพื่อลบสาย</title></path>`;
  });
  allKeys().forEach(k=>{
    const t=termPos(k),ty=typeOf(k);
    const on=st.armed===k||(wiring&&wiring.cand===k);
    s+=`<g data-term="${k}"><circle class="hit" cx="${t.x}" cy="${t.y}" r="${hit}"/><circle class="term ${ty}${on?' armed':''}" cx="${t.x}" cy="${t.y}" r="${tr}"/><text class="tt" style="font-size:${fs}px" x="${t.x}" y="${t.y+fs*0.36}">${ty==='p'?'+':'−'}</text></g>`;
  });
  A.si.inv.forEach(k=>{badges.push([invRight()?IX+36:IX+124,mpY(k)+56])});
  badges.forEach(m=>{s+=`<g class="shortbadge" transform="translate(${m[0].toFixed(1)} ${m[1].toFixed(1)})"><circle r="14"/><path d="M3,-9 L-5,2 L0,2 L-3,10 L6,-3 L1,-3 Z"/><text class="shortlbl" x="19" y="4" style="text-anchor:start">ชอต</text></g>`});
  if(wiring&&wiring.moved){
    const a=termPos(wiring.from),tgt=wiring.cand?termPos(wiring.cand):{x:wiring.x,y:wiring.y};
    s+=`<path class="wprev" d="${wirePath(wiring.from,a,wiring.cand,tgt)}"/>`;
  }
  svg.innerHTML=s;
}

/* ---- world size, scale, full screen ---- */
function fitWorld(){
  let h=680;
  if(fsOn){const r=svg.parentElement.getBoundingClientRect();if(r.width>0&&r.height>0)h=Math.max(420,Math.round(W*r.height/r.width))}
  H=h;svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  st.panels.forEach(clampPanel);clampInv();
}
function syncScaleUI(){const e=$('#pscale');if(e){e.value=Math.round(st.scale*100);$('#pscalev').textContent=Math.round(st.scale*100)+'%'}}
function setFs(on){
  fsOn=!!on;document.body.classList.toggle('fsmode',fsOn);
  $('#fsbtn').textContent=fsOn?'ออกจากเต็มจอ':'เต็มจอ';
  try{
    if(fsOn&&document.documentElement.requestFullscreen&&!document.fullscreenElement)document.documentElement.requestFullscreen().catch(()=>{});
    if(!fsOn&&document.fullscreenElement)document.exitFullscreen().catch(()=>{});
  }catch(e){}
  requestAnimationFrame(()=>{fitWorld();render()});
}
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&fsOn)setFs(false)});

function checksHTML(list){
  return list.map(k=>`<li><span class="b ${k.lvl}" aria-label="${LABEL[k.lvl]}">${GLYPH[k.lvl]}</span><span>${k.t}</span></li>`).join('');
}

function render(){
  const sc=svg.clientWidth/W||1;tr=Math.max(9,Math.min(16,8/sc))*(.55+.45*Math.min(1,st.scale));
  if(st.sel!=null&&!st.panels.some(p=>p.id===st.sel))st.sel=null;
  const A=analyze(),I=A.I;
  drawSvg(A);
  const msg={ok:'ต่อถูกต้อง ผ่านทุกข้อ',warn:`ใช้ได้ แต่มี ${A.cnt.warn} ข้อควรระวัง`,err:`มี ${A.cnt.err} ข้อที่ไม่ผ่าน`,idle:'ยังไม่ได้ต่อสายเข้าอินเวอร์เตอร์'}[A.lvl];
  const fi=[...A.res.flatMap(r=>r.ck),...A.sys].filter(c=>c.lvl!=='ok').sort((a,b)=>RANK[a.lvl]-RANK[b.lvl])[0];
  const v=$('#verdict');v.className='verdict fsk '+A.lvl;
  v.innerHTML=`<span class="pill ${A.lvl}">${A.lvl==='idle'?'รอต่อสาย':LABEL[A.lvl]}</span><b>${msg}</b><span class="nums">${A.used}/${st.panels.length} แผง · ${f(A.pv/1000,2)} kWp</span>${fi?`<span class="vfirst">${fi.t}</span>`:''}`;

  $('#cards').innerHTML=A.res.map(r=>{
    if(r.status==='idle')return`<section class="card"><div class="chead"><h3>MPPT ${r.k}</h3><span class="pill idle">ว่าง</span></div><p class="idlehint">ยังไม่ได้ต่อสาย ลากสายจากขั้ว DC${r.k}+ และ DC${r.k}− ของอินเวอร์เตอร์ไปที่แผง</p></section>`;
    const b=r.blk;
    const head=b?`<div class="chead"><h3>MPPT ${r.k}</h3><span class="topo">${r.short}</span><span class="pill ${r.lvl}">${LABEL[r.lvl]}</span></div><div class="meta">${b.n} แผง · ${f(b.n*PV.pmax/1000,2)} kWp</div><div class="calc"><span>Voc ${b.ns} × ${f(A.ev.vocC,1)} V = ${f(b.voc)} V</span><span>Vmp ${f(b.vmpH)}–${f(b.vmpC)} V</span><span>Imp ${b.mp} × ${f(PV.imp,2)} A = ${f(b.imp,1)} A</span></div>`
      :`<div class="chead"><h3>MPPT ${r.k}</h3><span class="topo">${r.short}</span><span class="pill ${r.lvl}">${LABEL[r.lvl]}</span></div>`;
    return`<section class="card">${head}<ul class="checks">${checksHTML(r.ck)}</ul></section>`;
  }).join('');

  $('#sys').innerHTML=A.sys.length?checksHTML(A.sys):'<li><span class="b ok" style="visibility:hidden">·</span><span>ยังไม่มีรายการ ต่อสายเข้าอินเวอร์เตอร์เพื่อดูผลรวมระบบ</span></li>';
  $('#specs').innerHTML=[
    ['แผง',`${PV.pmax} W`],['Voc / Isc',`${PV.voc} V / ${PV.isc} A`],['Vmp / Imp',`${PV.vmp} V / ${PV.imp} A`],['สัมประสิทธิ์ Voc / Pmax',`${PV.kVoc} / ${PV.kPmax} %/°C`],
    ['Vdc สูงสุด',`${I.vmax} V`],['ช่วง MPPT',`${I.lo}–${I.hi} V`],['กระแสอินพุต / Isc สูงสุด',`${I.imax} A / ${I.isc} A`],['กำลัง AC',`${I.pac/1000} kW`]
  ].map(r=>`<div><dt>${r[0]}</dt><dd>${r[1]}</dd></div>`).join('');
  $('#delp').disabled=st.sel==null;
  $('#rotp').disabled=st.sel==null;
  $('#addp').disabled=st.panels.length>=MAXP;
  syncScaleUI();
  maybeSim(A);
  if(typeof touch==='function')touch();
}

/* ---- events ---- */
svg.addEventListener('pointerdown',e=>{
  const rh=e.target.closest('[data-rot]');
  if(rh){rotPanel(+rh.dataset.rot);e.preventDefault();return}
  const t=e.target.closest('[data-term]');
  if(t){const p=pt(e);wiring={from:t.dataset.term,x:p.x,y:p.y,sx:e.clientX,sy:e.clientY,moved:false,cand:null};e.preventDefault();render();return}
  const ib=e.target.closest('[data-inv]');
  if(ib){const p=pt(e);invMove={dx:p.x-IX,dy:p.y-INVY};st.sel=null;e.preventDefault();render();return}
  const g=e.target.closest('[data-panel]');
  if(g){
    const id=+g.dataset.panel,p=pt(e),pan=st.panels.find(q=>q.id===id);
    moving={id,dx:p.x-pan.x,dy:p.y-pan.y};st.sel=id;e.preventDefault();render();return;
  }
  if(!e.target.closest('[data-wire]')){st.sel=null;st.armed=null;render()}
});
document.addEventListener('pointermove',e=>{
  if(wiring){
    const p=pt(e);wiring.x=p.x;wiring.y=p.y;
    if(Math.hypot(e.clientX-wiring.sx,e.clientY-wiring.sy)>5)wiring.moved=true;
    wiring.cand=wiring.moved?nearest(p,wiring.from):null;render();
  }else if(invMove){
    const p=pt(e);IX=p.x-invMove.dx;INVY=p.y-invMove.dy;clampInv();render();
  }else if(moving){
    const p=pt(e),pan=st.panels.find(q=>q.id===moving.id);if(!pan)return;
    pan.x=p.x-moving.dx;pan.y=p.y-moving.dy;clampPanel(pan);render();
  }
});
document.addEventListener('pointerup',e=>{
  if(wiring){
    const w=wiring;wiring=null;
    if(w.moved){connect(w.from,nearest(pt(e),w.from));st.armed=null}
    else if(st.armed&&st.armed!==w.from){connect(st.armed,w.from);st.armed=null}
    else st.armed=st.armed===w.from?null:w.from;
    render();
  }else if(invMove){invMove=null;render()}
  else if(moving){moving=null;render()}
});
document.addEventListener('pointercancel',()=>{wiring=null;moving=null;invMove=null;render()});
svg.addEventListener('click',e=>{
  const w=e.target.closest('[data-wire]');
  if(w){st.wires.splice(+w.dataset.wire,1);render()}
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&fsOn){setFs(false);return}
  if((e.key==='r'||e.key==='R')&&st.sel!=null&&curTab==='wiring'&&!/INPUT|SELECT|TEXTAREA|BUTTON/.test(document.activeElement.tagName)){rotPanel(st.sel);e.preventDefault();return}
  if((e.key==='Delete'||e.key==='Backspace')&&st.sel!=null&&curTab==='wiring'&&!/INPUT|SELECT|TEXTAREA|BUTTON/.test(document.activeElement.tagName)){delPanel();e.preventDefault()}
});
function delPanel(){
  if(st.sel==null)return;
  const id=st.sel;
  st.panels=st.panels.filter(p=>p.id!==id);
  st.wires=st.wires.filter(w=>!w.a.startsWith(id+':')&&!w.b.startsWith(id+':'));
  st.sel=null;render();
}
document.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>{PRESETS[b.dataset.preset]();render()}));
$('#addp').addEventListener('click',()=>{const p=addPanel();if(p)st.sel=p.id;render()});
$('#delp').addEventListener('click',delPanel);
$('#rotp').addEventListener('click',()=>{if(st.sel!=null)rotPanel(st.sel)});
$('#clrw').addEventListener('click',()=>{st.wires=[];st.armed=null;render()});
['tmin','thot'].forEach(id=>$('#'+id).addEventListener('input',e=>{const n=parseFloat(e.target.value);if(!isNaN(n)){st[id]=n;render()}}));
$('#pscale').addEventListener('input',e=>{setScale(+e.target.value/100);render()});
$('#relayout').addEventListener('click',()=>{layoutAll();fitWorld();render()});
$('#fsbtn').addEventListener('click',()=>setFs(!fsOn));
window.addEventListener('resize',()=>{fitWorld();render()});
fitWorld();

