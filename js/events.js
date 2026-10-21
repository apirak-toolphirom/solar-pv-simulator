/* ---- events: cloud, dust, tree shade, seasons, grid outage, plus top/side site views ---- */
const EV={cloud:{on:false,start:11,dur:2,depth:70},dust:{on:false,pct:15},
  tree:{on:false,h:12,d:7,az:180,w:90,pct:60,mppt:0,ph:3},
  bld:{on:false,h:15,d:12,az:270,w:20},
  site:{on:false}};
const SEASONS=[['ฤดูร้อน (กลาง เม.ย.)',4,15],['ฤดูฝน (กลาง ก.ค.)',7,15],['ฤดูหนาว (กลาง ธ.ค.)',12,15],
  ['วิษุวัต (ฤดูใบไม้ผลิ)',3,21],['ครีษมายัน (กลางวันยาวสุดทางเหนือ)',6,21],['เหมายัน (กลางวันสั้นสุดทางเหนือ)',12,21]];
const SC={view:'top',h:12,timer:0};

/* cloud coverage 0..1 at hour h, with 10 minute soft edges */
function evCloud(h){
  const c=EV.cloud;if(!c.on||c.dur<=0)return 0;
  const s=c.start%24,e=s+c.dur,ramp=1/6;
  let best=0;
  [h,h+24].forEach(x=>{if(x>=s-ramp&&x<=e+ramp)best=Math.max(best,Math.min(1,(x-s+ramp)/(2*ramp),(e-x+ramp)/(2*ramp)))});
  return Math.max(0,Math.min(1,best));
}
const angDiff=(a,b)=>{let d=((a-b)%(2*Math.PI)+3*Math.PI)%(2*Math.PI)-Math.PI;return Math.abs(d)};
/* tree blocks the beam if the sun is inside its angular width and below the top of the tree seen from the array */
function treeLimit(){const t=EV.tree;return Math.atan2(Math.max(0,t.h-t.ph),Math.max(0.5,t.d))}
function treeShade(azR,elR,j){
  const t=EV.tree;if(!t.on)return 0;
  if(t.mppt&&t.mppt!==j+1)return 0;
  if(angDiff(azR,t.az*Math.PI/180)>t.w/2*Math.PI/180)return 0;
  return elR<treeLimit()?t.pct/100:0;
}
/* building: an opaque block (height h, width w, distance d from the array) blocks the direct beam on every MPPT.
   Panel height above ground is the same setting as for the tree (EV.tree.ph) */
function bldLimit(){const b=EV.bld;return Math.atan2(Math.max(0,b.h-EV.tree.ph),Math.max(0.5,b.d))}
function bldHalfW(){const b=EV.bld;return Math.atan2(b.w/2,Math.max(0.5,b.d))}
function bldShade(azR,elR){
  const b=EV.bld;if(!b.on)return 0;
  if(angDiff(azR,b.az*Math.PI/180)>bldHalfW())return 0;
  return elR<bldLimit()?1:0;
}
function evTreeShade(azR,elR,j){
  if(EV.site.on)return typeof siteShade==='function'?siteShade(azR,elR,j):0;
  return Math.max(treeShade(azR,elR,j),bldShade(azR,elR));
}
const evSiteActive=()=>EV.site.on&&typeof siteHasPV==='function'&&siteHasPV();
const evActive=()=>EV.cloud.on||EV.dust.on||EV.tree.on||EV.bld.on||evSiteActive();
/* site model (tab 05) replaces the single tree / building; the two ways are mutually exclusive */
function evSiteOn(on){
  EV.site.on=!!on;
  if(on){EV.tree.on=false;EV.bld.on=false}
  if(typeof evSync==='function'&&document.getElementById('evmx'))evSync();
  if(typeof syEnvSync==='function')syEnvSync();
  if(typeof pvSiteSync==='function')pvSiteSync();
  if(typeof runSim==='function'){lastSig='';runSim()}
  if(typeof touch==='function')touch();
}

function evSource(){
  const I=curInv();
  if(lastA){
    const blocks=lastA.res.map(r=>r.status==='ok'?r.blk:null);
    if(blocks.some(Boolean))return{blocks,I:lastA.I||I,ideal:false,label:'ตามที่ต่อสายไว้ในแท็บ "ต่อสาย"'+(isMicro(I)?' (ไมโคร 1 ตัว)':''),n:blocks.reduce((a,b)=>a+(b?b.n:0),0)*microU(I)};
  }
  if(isMicro(I)){const nm=Math.max(1,Math.min(4,Math.round(+I.nmppt||4))),bl=[...Array(nm)].map((_,j)=>({n:1,ns:1,mp:1,pv:mpPV(j+1)}));return{blocks:bl,I,ideal:false,label:`ไมโคร 1 ตัว · ${nm} แผง`,n:nm*microU(I)}}
  const N=Math.max(1,BK.nIdeal|0);
  return{blocks:[{n:N,ns:N,mp:1}],I,ideal:true,label:`แผงสมมติ ${N} แผง (ยังไม่ได้ต่อสายที่ถูกต้อง)`,n:N};
}
function simWith(S,only,date){
  const keep=JSON.stringify([EV.cloud.on,EV.dust.on,EV.tree.on,EV.bld.on,EV.site.on]),od=SIM.date;
  if(only==='none'){EV.cloud.on=EV.dust.on=EV.tree.on=EV.bld.on=EV.site.on=false}
  else if(only){const o={cloud:EV.cloud.on,dust:EV.dust.on,tree:EV.tree.on,bld:EV.bld.on,site:EV.site.on};EV.cloud.on=only==='cloud'&&o.cloud;EV.dust.on=only==='dust'&&o.dust;EV.tree.on=only==='tree'&&o.tree;EV.bld.on=only==='bld'&&o.bld;EV.site.on=only==='site'&&o.site}
  if(date)SIM.date=date;
  let R;try{R=simDay(S.blocks,S.I,SIM.tilt,SIM.az,5,S.ideal)}finally{
    const k=JSON.parse(keep);EV.cloud.on=k[0];EV.dust.on=k[1];EV.tree.on=k[2];EV.bld.on=k[3];EV.site.on=k[4];SIM.date=od}
  return R;
}
function sunTimes(R){
  const idx=R.sun.map((v,i)=>v?i:-1).filter(i=>i>=0);
  if(!idx.length)return null;
  const sr=idx[0]*R.step/60,ss=(idx[idx.length-1]+1)*R.step/60;
  let mx=0;R.elev.forEach(e=>{if(e>mx)mx=e});
  return{sr,ss,len:ss-sr,noon:mx*180/Math.PI};
}
function seasonDate(m,d){const y=(SIM.date||'').slice(0,4)||String(new Date().getFullYear());return `${y}-${pad2(m)}-${pad2(d)}`}
function setDate(ds){SIM.date=ds;const el=document.getElementById('date');if(el)el.value=ds}

/* ---- site view (top / side) ---- */
function sunAt(h){const doy=dayOfYear(SIM.date),p=solarPos(SIM.lat,SIM.lon,doy,h,SIM.tz);return{az:p.az,el:Math.PI/2-p.zen,up:p.cosZ>0.001}}
function cloudSvg(x,y,s,op){return `<g opacity="${op}"><ellipse cx="${x}" cy="${y}" rx="${34*s}" ry="${13*s}" class="cld"/><ellipse cx="${x-20*s}" cy="${y+4*s}" rx="${22*s}" ry="${10*s}" class="cld"/><ellipse cx="${x+22*s}" cy="${y+5*s}" rx="${24*s}" ry="${10*s}" class="cld"/></g>`}
function siteTop(S){
  const cx=260,cy=190,R=165,m=7.2;/* px per metre in plan */
  const sn=sunAt(SC.h),az=SIM.az*Math.PI/180,t=EV.tree,cov=evCloud(SC.h);
  const P=(a,r)=>[cx+r*Math.sin(a),cy-r*Math.cos(a)];
  let s=`<circle cx="${cx}" cy="${cy}" r="${R}" class="sg"/><circle cx="${cx}" cy="${cy}" r="${R*0.5}" class="sg" stroke-dasharray="3 4"/>`;
  [['N',0],['E',90],['S',180],['W',270]].forEach(d=>{const q=P(d[1]*Math.PI/180,R+14);s+=`<text x="${q[0]}" y="${q[1]+4}" class="ax" text-anchor="middle">${d[0]==='N'?'เหนือ':d[0]==='E'?'ตะวันออก':d[0]==='S'?'ใต้':'ตะวันตก'}</text>`});
  /* sun path on the rim (azimuth only) */
  let path='';const pts=[];
  for(let h=0;h<24;h+=0.1){const q=sunAt(h);if(q.up)pts.push(P(q.az,R*(1-q.el/(Math.PI/2))))}
  if(pts.length>1)path='M'+pts.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join('L');
  s+=`<path d="${path}" class="spath"/><text x="${cx}" y="${cy+R+30}" class="ax" text-anchor="middle">เส้นทางดวงอาทิตย์ (ยิ่งใกล้ขอบวงยิ่งเงยต่ำ)</text>`;
  /* tree and its shadow */
  if(t.on){
    const tp=P(t.az*Math.PI/180,Math.min(R-12,t.d*m));
    if(sn.up&&sn.el>0.02){
      const L=Math.min(R*1.4,(t.h)/Math.tan(sn.el)*m),a=sn.az+Math.PI,wd=3.5*m/2;
      const e=[tp[0]+L*Math.sin(a),tp[1]-L*Math.cos(a)],nx=Math.cos(a)*wd,ny=Math.sin(a)*wd;
      s+=`<polygon points="${tp[0]-nx},${tp[1]-ny} ${tp[0]+nx},${tp[1]+ny} ${e[0]+nx},${e[1]+ny} ${e[0]-nx},${e[1]-ny}" class="shd"/>`;
    }
    const aw=t.w/2*Math.PI/180,a1=P(t.az*Math.PI/180-aw,R),a2=P(t.az*Math.PI/180+aw,R);
    s+=`<path d="M${cx} ${cy}L${a1[0]} ${a1[1]}A${R} ${R} 0 0 1 ${a2[0]} ${a2[1]}Z" class="wedge"/>`;
    s+=`<circle cx="${tp[0]}" cy="${tp[1]}" r="${Math.max(7,2*m)}" class="tree"/><text x="${tp[0]}" y="${tp[1]+4}" class="ax" text-anchor="middle">ต้นไม้</text>`;
  }
  /* building and its shadow */
  const B=EV.bld;
  if(B.on){
    const ba=B.az*Math.PI/180,bp=P(ba,Math.min(R-12,B.d*m)),hw=Math.min(R*.9,B.w/2*m),dp=Math.max(10,Math.min(40,6*m));
    if(sn.up&&sn.el>0.02){
      const L=Math.min(R*1.4,B.h/Math.tan(sn.el)*m),a=sn.az+Math.PI,tx=-Math.cos(ba)*hw,ty=-Math.sin(ba)*hw;
      const c1=[bp[0]+tx,bp[1]+ty],c2=[bp[0]-tx,bp[1]-ty],ox=L*Math.sin(a),oy=-L*Math.cos(a);
      s+=`<polygon points="${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${c2[0]+ox},${c2[1]+oy} ${c1[0]+ox},${c1[1]+oy}" class="shd"/>`;
    }
    const hb=bldHalfW(),b1=P(ba-hb,R),b2=P(ba+hb,R);
    s+=`<path d="M${cx} ${cy}L${b1[0]} ${b1[1]}A${R} ${R} 0 0 1 ${b2[0]} ${b2[1]}Z" class="wedge"/>`;
    s+=`<g transform="translate(${bp[0]} ${bp[1]}) rotate(${B.az})"><rect x="${-hw}" y="${-dp}" width="${2*hw}" height="${dp}" class="bld"/></g><text x="${bp[0]}" y="${bp[1]+4}" class="ax" text-anchor="middle">ตึก</text>`;
  }
  /* array */
  const n=Math.max(1,S.n),cols=Math.min(n,Math.max(1,Math.round(Math.sqrt(n*1.4)))),rows=Math.ceil(n/cols);
  const aw2=cols*1.13*m,ah=rows*2.38*m*Math.cos(SIM.tilt*Math.PI/180*0.9);
  const dust=EV.dust.on?EV.dust.pct/100:0;
  s+=`<g transform="translate(${cx} ${cy}) rotate(${SIM.az+180})"><rect x="${-aw2/2}" y="${-ah/2}" width="${aw2}" height="${ah}" class="arr"/>`
    +(dust?`<rect x="${-aw2/2}" y="${-ah/2}" width="${aw2}" height="${ah}" class="dustl" style="opacity:${Math.min(.85,dust*2.2)}"/>`:'')
    +`<line x1="${-aw2/2}" x2="${aw2/2}" y1="${ah/2}" y2="${ah/2}" class="frontl"/></g>`;
  const fa=P(az,Math.max(aw2,ah)/2+30);
  s+=`<line x1="${cx}" y1="${cy}" x2="${fa[0]}" y2="${fa[1]}" class="face"/><text x="${fa[0]}" y="${fa[1]-6}" class="ax" text-anchor="middle">หน้าแผง ${SIM.az}°</text>`;
  /* sun */
  if(sn.up){const q=P(sn.az,R*(1-sn.el/(Math.PI/2)));s+=`<line x1="${cx}" y1="${cy}" x2="${q[0]}" y2="${q[1]}" class="ray"/><circle cx="${q[0]}" cy="${q[1]}" r="9" class="sun"/>`}
  if(cov>0.02)s+=cloudSvg(cx-60,cy-110,1.3,Math.min(.9,cov))+cloudSvg(cx+70,cy+60,1.1,Math.min(.9,cov));
  s+=`<text x="12" y="408" class="ax">แผนผังมองจากด้านบน · 1 ช่อง ≈ ${(R*0.5/m).toFixed(0)} ม. จากกลางแผง</text>`;
  return{svg:s,vb:'0 0 520 420'};
}
function siteSide(S){
  const W=520,gy=250,px=250,sc=9;/* px per metre */
  const sn=sunAt(SC.h),tilt=SIM.tilt*Math.PI/180,t=EV.tree,cov=evCloud(SC.h),b=SIM.tilt;
  const L=2.4*sc*Math.min(2,Math.max(1,S.n/6)),py=gy-28;
  let s=`<line x1="10" x2="${W-10}" y1="${gy}" y2="${gy}" class="gnd"/>`;
  /* sun in the vertical plane through the panel normal */
  const dA=sn.az-SIM.az*Math.PI/180;
  const u=Math.cos(sn.el)*Math.cos(dA),v=Math.sin(sn.el),apparent=Math.atan2(v,u);
  /* tree */
  let blocked=false;
  if(t.on){
    const dT=t.az*Math.PI/180-SIM.az*Math.PI/180,dist=t.d*Math.cos(dT);
    const tx=px+Math.max(-230,Math.min(230,dist*sc));
    const hh=t.h*sc;
    s+=`<rect x="${tx-3}" y="${gy-hh*0.45}" width="6" height="${hh*0.45}" class="trunk"/><ellipse cx="${tx}" cy="${gy-hh*0.72}" rx="${Math.max(14,hh*0.3)}" ry="${hh*0.34}" class="tree"/>`;
    s+=`<text x="${tx}" y="${gy+16}" class="ax" text-anchor="middle">ต้นไม้ สูง ${t.h} ม. ห่าง ${t.d} ม.</text>`;
    blocked=sn.up&&evTreeShade(sn.az,sn.el,t.mppt?t.mppt-1:0)>0&&Math.cos(dT)>-0.2;
  }
  const B=EV.bld;
  if(B.on){
    const dB=B.az*Math.PI/180-SIM.az*Math.PI/180,dist=B.d*Math.cos(dB),bx=px+Math.max(-230,Math.min(230,dist*sc)),hh=Math.min(gy-20,B.h*sc),ww=Math.max(24,Math.min(80,6*sc));
    s+=`<rect x="${bx-ww/2}" y="${gy-hh}" width="${ww}" height="${hh}" class="bld"/><text x="${bx}" y="${gy+30}" class="ax" text-anchor="middle">ตึก สูง ${B.h} ม. ห่าง ${B.d} ม.</text>`;
    if(sn.up&&bldShade(sn.az,sn.el)>0&&Math.cos(dB)>-0.2)blocked=true;
  }
  /* panel */
  const ex=px+L*Math.cos(tilt),ey=py-L*Math.sin(tilt);
  s+=`<line x1="${px}" y1="${py}" x2="${px}" y2="${gy}" class="post"/><line x1="${ex}" y1="${ey}" x2="${ex}" y2="${gy}" class="post"/>`;
  s+=`<line x1="${px-L*0.0}" y1="${py}" x2="${ex}" y2="${ey}" class="slab${blocked?' blk':''}"/>`;
  if(EV.dust.on){const k=Math.round(8+EV.dust.pct);for(let i=0;i<k;i++){const r=(i+.5)/k;s+=`<circle cx="${px+(ex-px)*r}" cy="${py+(ey-py)*r-4.5}" r="1.8" class="dustd"/>`}}
  s+=`<path d="M${px+30} ${py}A30 30 0 0 0 ${px+30*Math.cos(tilt)} ${py-30*Math.sin(tilt)}" class="angl"/><text x="${px+38}" y="${py-6}" class="ax">${b}°</text>`;
  /* sun and ray */
  const mx=(px+ex)/2,my=(py+ey)/2;
  if(sn.up){
    const Rr=215,sx=mx+Rr*Math.cos(apparent),sy=my-Rr*Math.sin(apparent);
    s+=`<line x1="${sx}" y1="${sy}" x2="${mx}" y2="${my}" class="ray${blocked?' cut':''}"/><circle cx="${sx}" cy="${sy}" r="10" class="sun"/>`;
    const nA=tilt+Math.PI/2,cosI=Math.max(-1,Math.min(1,Math.cos(apparent-tilt-Math.PI/2+Math.PI/2)));
    const inc=Math.acos(Math.max(-1,Math.min(1,Math.sin(apparent+tilt)*1)))*180/Math.PI;
    s+=`<text x="${W-12}" y="22" class="ax" text-anchor="end">มุมเงยดวงอาทิตย์ ${(sn.el*180/Math.PI).toFixed(0)}° · ทิศ ${(sn.az*180/Math.PI).toFixed(0)}°</text>`;
    s+=`<text x="${W-12}" y="40" class="ax" text-anchor="end">มุมตกกระทบบนแผงประมาณ ${inc.toFixed(0)}°${sn.az!==undefined&&u<0?' (ดวงอาทิตย์อยู่หลังแผง)':''}</text>`;
    if(blocked)s+=`<text x="${W-12}" y="58" class="ax" text-anchor="end" style="fill:var(--err)">${bldShade(sn.az,sn.el)>0?'เงาตึกบังแผง':'เงาต้นไม้บังแผง'}</text>`;
  }else s+=`<text x="${W-12}" y="22" class="ax" text-anchor="end">กลางคืน ยังไม่มีแสงอาทิตย์</text>`;
  if(cov>0.02)s+=cloudSvg(140,70,1.5,Math.min(.9,cov))+cloudSvg(380,100,1.2,Math.min(.9,cov));
  s+=`<text x="12" y="20" class="ax">มองจากด้านข้าง ตามแนวหน้าแผง (หันหน้าไปทางขวา)</text>`;
  return{svg:s,vb:'0 0 520 290'};
}
function sceneHTML(id){
  return `<div class="scbar"><div class="seg" role="group" aria-label="มุมมอง"><button class="chip" data-sv="top">Top view (มองจากด้านบน)</button><button class="chip" data-sv="side">Side view (มองจากด้านข้าง)</button></div>
  <label class="sctime">เวลา <b data-sct></b><input type="range" min="0" max="24" step="0.1" value="12" data-sch aria-label="เวลาในวัน"></label>
  <button class="btn" data-scplay>▶ เล่น</button></div>
  <svg class="scsvg" role="img" aria-label="มุมมองไซต์ติดตั้งแผงโซลาร์" data-scsvg></svg>`;
}
function drawScenes(){
  const S=evSource();
  const o=SC.view==='top'?siteTop(S):siteSide(S);
  document.querySelectorAll('[data-scsvg]').forEach(el=>{el.setAttribute('viewBox',o.vb);el.innerHTML=o.svg});
  document.querySelectorAll('[data-sv]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sv===SC.view)));
  document.querySelectorAll('[data-sch]').forEach(el=>{el.value=SC.h});
  document.querySelectorAll('[data-sct]').forEach(el=>{el.textContent=fmtT(SC.h)});
}
function initScenes(){
  document.querySelectorAll('.scene').forEach(el=>{
    el.innerHTML=sceneHTML();
    el.addEventListener('click',e=>{
      const b=e.target.closest('[data-sv]');if(b){SC.view=b.dataset.sv;drawScenes();return}
      if(e.target.closest('[data-scplay]')){
        if(SC.timer){clearInterval(SC.timer);SC.timer=0}
        else SC.timer=setInterval(()=>{SC.h=(SC.h+0.1)%24;drawScenes()},80);
        document.querySelectorAll('[data-scplay]').forEach(x=>x.textContent=SC.timer?'❚❚ หยุด':'▶ เล่น');
      }
    });
    el.addEventListener('input',e=>{if(e.target.matches('[data-sch]')){SC.h=+e.target.value;drawScenes()}});
  });
}

/* ---- events tab ---- */
let evCfg=null;
function evSync(){
  const q=id=>document.getElementById(id);
  q('evcl').checked=EV.cloud.on;q('evcs').value=hhmm(EV.cloud.start);q('evcd').value=EV.cloud.dur;q('evcp').value=EV.cloud.depth;q('evcpv').textContent=EV.cloud.depth+'%';
  q('evdu').checked=EV.dust.on;q('evdp').value=EV.dust.pct;q('evdpv').textContent=EV.dust.pct+'%';
  const t=EV.tree;q('evtr').checked=t.on;q('evth').value=t.h;q('evtd').value=t.d;q('evta').value=t.az;q('evtav').textContent=`${t.az}° (${dirName(t.az)})`;
  q('evtw').value=t.w;q('evtwv').textContent=t.w+'°';q('evtp').value=t.pct;q('evtpv').textContent=t.pct+'%';q('evtm').value=t.mppt;q('evtph').value=t.ph;
  q('evos').value=hhmm(BK.outStart);q('evod').value=BK.outDur;q('evmode').value=BK.mode;
  q('evout-note').textContent=BK.mode==='off'?'โหมด Off-grid ไม่ต่อกริด จึงไม่มีเหตุการณ์ไฟดับ เลือก On-grid หรือ Hybrid เพื่อทดลองไฟดับ':'';
  const ds=SIM.date;q('evday').value=dayOfYear(ds);q('evdayv').textContent=ds;
  const B=EV.bld;if(q('evbl')){q('evbl').checked=B.on;q('evbh').value=B.h;q('evbd').value=B.d;q('evbw').value=B.w;q('evba').value=B.az;q('evbav').textContent=`${B.az}° (${dirName(B.az)})`}
  ['evcbox','evdbox','evtbox','evbbox'].forEach((id,i)=>{const e=q(id);if(e)e.classList.toggle('on',[EV.cloud.on,EV.dust.on,EV.tree.on,EV.bld.on][i])});
  const act=[];if(EV.cloud.on)act.push('เมฆบัง');if(EV.dust.on)act.push('ฝุ่นบังแผง');if(EV.tree.on)act.push('ต้นไม้บัง');if(EV.bld.on)act.push('ตึกบัง');if(evSiteActive())act.push('เงาจากผังไซต์');
  if(q('evsite')){q('evsite').checked=EV.site.on;q('evsitebox').classList.toggle('on',EV.site.on);q('evtbox').hidden=EV.site.on;q('evbbox').hidden=EV.site.on;q('evsitenote').textContent=EV.site.on?(siteHasPV()?`ใช้ต้นไม้และตึกจากผังไซต์ (แท็บ 05) คิดเงาบนแผงโซลาร์ ${siArrays().length} ชุดบนผัง`:'ยังไม่มีแผงโซลาร์บนผัง ไปแท็บ 05 กด "+ แผงโซลาร์" เพื่อวางบนหลังคา'):'ใช้ต้นไม้ / ตึกแบบเดี่ยวที่ตั้งด้านล่างแทน'}
  const n=document.getElementById('evnote');if(n)n.textContent=act.length?'เหตุการณ์ที่เปิดอยู่ในกราฟด้านล่าง: '+act.join(', ')+' (ตั้งค่าที่แท็บ "จำลองเหตุการณ์")':'';
}
function evRun(){
  if(!document.getElementById('evmx'))return;
  evSync();drawScenes();
  const S=evSource(),R=simWith(S,null),R0=simWith(S,'none');
  const st=sunTimes(R0);
  const msg=document.getElementById('evsrc');
  msg.textContent=`แหล่งผลิต: ${S.label} · ${f(S.n*PV.pmax/1000,2)} kWp · ${SIM.date} · มุมเอียง ${SIM.tilt}° หันไป ${SIM.az}° (${dirName(SIM.az)})`;
  if(!st){document.getElementById('evmx').innerHTML='<div class="metric"><div class="k">วันนี้ไม่มีแสงอาทิตย์</div></div>';return}
  const loss=R0.E-R.E,pc=R0.E>0?loss/R0.E*100:0;
  const cause=['cloud','dust','tree','bld','site'].map(k=>{
    const on=k==='site'?evSiteActive():EV[k].on;if(!on)return null;
    const Rk=simWith(S,k);return{k,name:{cloud:'เมฆบัง',dust:'ฝุ่นบังแผง',tree:'ต้นไม้บัง',bld:'ตึกบัง',site:'เงาจากผังไซต์'}[k],d:R0.E-Rk.E};
  }).filter(Boolean);
  const bk=window.lastBK;
  const mx=[
    ['พลังงานวันนี้ (ไม่มีเหตุการณ์)',f(R0.E,1)+' kWh',`${f(R0.E/Math.max(.01,S.n*PV.pmax/1000),2)} kWh ต่อ kWp`],
    ['พลังงานวันนี้ (มีเหตุการณ์)',f(R.E,1)+' kWh',evActive()?`หายไป ${f(loss,1)} kWh (${f(pc,0)}%)`:'ยังไม่ได้เปิดเหตุการณ์'],
    ['ดวงอาทิตย์ขึ้น–ตก',`${fmtT(st.sr)}–${fmtT(st.ss)}`,`กลางวัน ${f(st.len,1)} ชม. · เงยสูงสุด ${f(st.noon,0)}°`],
    ['กำลังสูงสุด (มีเหตุการณ์)',f(R.peak/1000,2)+' kW',`ไม่มีเหตุการณ์ ${f(R0.peak/1000,2)} kW`]
  ];
  if(BK.mode!=='off'&&BK.outDur>0&&bk)mx.push(['ไฟดับ '+hhmm(BK.outStart)+' ('+BK.outDur+' ชม.)',bk.unmet>0.005?`ขาด ${f(bk.unmet,2)} kWh`:'ไฟพอใช้',bk.mode==='grid'?'On-grid ตัดไฟทันทีเมื่อกริดดับ':'ดูรายละเอียดที่แท็บ "จำลองการไหลของไฟ"']);
  document.getElementById('evmx').innerHTML=mx.map(m=>`<div class="metric"><div class="k">${m[0]}</div><div class="v">${m[1]}</div><div class="s">${m[2]}</div></div>`).join('');
  document.getElementById('evcause').innerHTML=cause.length?cause.map(c=>`<div class="brow"><span class="bn">${c.name}</span><span class="btrack"><span class="bfill" style="width:${Math.max(2,c.d/Math.max(loss,.001)*70)}%;background:var(--s2)"></span><span class="bv">−${f(c.d,2)} kWh</span></span></div>`).join('')
    :'<p class="hint" style="margin:0">เปิดเหตุการณ์เมฆ ฝุ่น หรือต้นไม้เพื่อดูว่าแต่ละอย่างทำให้ไฟหายไปเท่าไร</p>';
  /* charts */
  const xmin=Math.max(0,Math.floor(st.sr-.5)),xmax=Math.min(24,Math.ceil(st.ss+.5)),i0=Math.round(xmin*12),i1=Math.round(xmax*12);
  const sl=a=>a.slice(i0,i1),kw=v=>v/1000,xs=sl(R.t);
  const vb=[];if(BK.mode!=='off'&&BK.outDur>0){const s0=BK.outStart%24,e0=s0+BK.outDur;if(e0<=24)vb.push([s0,e0]);else vb.push([s0,24],[0,e0-24])}
  const shadeBands=[];let a=null;R.shade.forEach((v,i)=>{const h=i*5/60;if(v>0&&a==null)a=h;if((v<=0||i===R.shade.length-1)&&a!=null){shadeBands.push([a,h]);a=null}});
  evCfg={A:{x:xs,ymax:Math.max(Math.max(...R0.pac),1)/1000*1.1,unit:'kW',aria:'กราฟกำลัง AC เทียบวันปกติกับวันที่มีเหตุการณ์',vb,vbl:vb.length?'ไฟดับ':'',
      series:[{short:'ไม่มีเหตุการณ์',color:'var(--muted)',vals:sl(R0.pac).map(kw),fmt:v=>f(v,2)},{short:'มีเหตุการณ์',color:'var(--s1)',vals:sl(R.pac).map(kw),area:true,fmt:v=>f(v,2)}]},
    B:{x:xs,ymax:90,unit:'°',aria:'กราฟมุมเงยของดวงอาทิตย์ตลอดวัน',vb:shadeBands,vbl:shadeBands.length?'ต้นไม้บังแสง':'',
      refs:(EV.tree.on?[{y:treeLimit()*180/Math.PI,label:`ยอดต้นไม้ ${f(treeLimit()*180/Math.PI,0)}°`}]:[]).concat(EV.bld.on?[{y:bldLimit()*180/Math.PI,label:`ขอบตึก ${f(bldLimit()*180/Math.PI,0)}°`}]:[]),
      series:[{short:'มุมเงยดวงอาทิตย์',color:'var(--s2)',vals:sl(R.elev).map(e=>Math.max(0,e*180/Math.PI)),area:true,fmt:v=>f(v,0)}]}};
  evCfg.A.leg='evleg1';document.getElementById('evleg1').innerHTML=legHTML('evleg1',evCfg.A.series,'',drawEvCharts);
  drawEvCharts();
  /* seasons table */
  const rows=SEASONS.map(se=>{
    const ds=seasonDate(se[1],se[2]),r=simWith(S,'none',ds),re=simWith(S,null,ds),t2=sunTimes(r);
    const cur=SIM.date===ds;
    return `<tr${cur?' class="cur"':''}><td><button class="lnk" data-sd="${ds}">${se[0]}</button></td><td>${ds}</td><td>${t2?fmtT(t2.sr)+'–'+fmtT(t2.ss):'-'}</td><td>${t2?f(t2.len,1):'-'}</td><td>${t2?f(t2.noon,0)+'°':'-'}</td><td>${f(r.E,1)}</td><td>${evActive()?f(re.E,1):'-'}</td></tr>`;
  }).join('');
  document.getElementById('evseas').innerHTML=rows;
}
function drawEvCharts(){
  if(!evCfg)return;
  const a=document.getElementById('evchA'),b=document.getElementById('evchB');
  if(a&&a.clientWidth)drawLine(a,evCfg.A);if(b&&b.clientWidth)drawLine(b,evCfg.B);
}
function evChanged(){runSim();evSync();if(typeof touch==='function')touch()}
function initEvents(){
  initScenes();
  const q=id=>document.getElementById(id),num=(id,obj,key,lo,hi,after)=>q(id).addEventListener('input',e=>{const n=parseFloat(e.target.value);if(isNaN(n))return;obj[key]=Math.max(lo,Math.min(hi,n));evChanged()});
  q('evcl').addEventListener('change',e=>{EV.cloud.on=e.target.checked;evChanged()});
  q('evcs').addEventListener('input',e=>{const h=parseHM(e.target.value);if(isNaN(h))return;EV.cloud.start=h;evChanged()});
  num('evcd',EV.cloud,'dur',0,12);num('evcp',EV.cloud,'depth',10,100);
  q('evdu').addEventListener('change',e=>{EV.dust.on=e.target.checked;evChanged()});num('evdp',EV.dust,'pct',1,60);
  q('evtr').addEventListener('change',e=>{EV.tree.on=e.target.checked;if(EV.tree.on)EV.site.on=false;evChanged()});
  num('evth',EV.tree,'h',1,40);num('evtd',EV.tree,'d',1,60);num('evta',EV.tree,'az',0,359);num('evtw',EV.tree,'w',5,160);num('evtp',EV.tree,'pct',10,100);num('evtph',EV.tree,'ph',0,20);
  q('evtm').addEventListener('change',e=>{EV.tree.mppt=+e.target.value;evChanged()});
  if(q('evbl')){q('evbl').addEventListener('change',e=>{EV.bld.on=e.target.checked;if(EV.bld.on)EV.site.on=false;evChanged()});num('evbh',EV.bld,'h',1,200);num('evbd',EV.bld,'d',1,200);num('evbw',EV.bld,'w',1,200);num('evba',EV.bld,'az',0,359);
    q('evbdir').addEventListener('click',e=>{const b=e.target.closest('[data-az]');if(!b)return;EV.bld.az=+b.dataset.az;evChanged()})}
  q('evtdir').addEventListener('click',e=>{const b=e.target.closest('[data-az]');if(!b)return;EV.tree.az=+b.dataset.az;evChanged()});
  q('evtdir').innerHTML=DIRS.map(d=>`<button class="chip" data-az="${d[1]}">${d[0]}</button>`).join('');
  if(q('evbdir'))q('evbdir').innerHTML=q('evtdir').innerHTML;
  q('evos').addEventListener('input',e=>{const h=parseHM(e.target.value);if(isNaN(h))return;BK.outStart=h;bkSync();runSim();evSync();touch()});
  q('evod').addEventListener('input',e=>{const n=parseFloat(e.target.value);if(isNaN(n))return;BK.outDur=Math.max(0,Math.min(24,n));bkSync();runSim();evSync();touch()});
  q('evmode').addEventListener('change',e=>{BK.mode=BK.want=e.target.value;bkSync();runSim();evSync();touch()});
  q('evday').addEventListener('input',e=>{const d=+e.target.value,y=+(SIM.date||'2026').slice(0,4);const dt=new Date(Date.UTC(y,0,d));setDate(`${y}-${pad2(dt.getUTCMonth()+1)}-${pad2(dt.getUTCDate())}`);runSim();evSync();touch()});
  q('evseaschips').innerHTML=SEASONS.map((se,i)=>`<button class="chip" data-si="${i}">${se[0].replace(/ \(.*/,'')}</button>`).join('');
  const pick=ds=>{setDate(ds);runSim();evSync();touch()};
  q('evseaschips').addEventListener('click',e=>{const b=e.target.closest('[data-si]');if(!b)return;const se=SEASONS[+b.dataset.si];pick(seasonDate(se[1],se[2]))});
  q('evseas').addEventListener('click',e=>{const b=e.target.closest('[data-sd]');if(b)pick(b.dataset.sd)});
  q('evreset').addEventListener('click',()=>{EV.cloud.on=EV.dust.on=EV.tree.on=EV.bld.on=EV.site.on=false;evChanged()});
  if(q('evsite'))q('evsite').addEventListener('change',e=>evSiteOn(e.target.checked));
  let rz2=0;window.addEventListener('resize',()=>{cancelAnimationFrame(rz2);rz2=requestAnimationFrame(drawEvCharts)});
  evSync();
}
