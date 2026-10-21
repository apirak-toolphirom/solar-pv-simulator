/* ---- Plus Code (Open Location Code) ---- */
const OLC='23456789CFGHJMPQRVWX';
function olcEncode(lat,lng){
  lat=Math.min(Math.max(lat,-90),90-1e-9);lng=((lng+180)%360+360)%360;
  let la=Math.floor((lat+90)*8000+1e-7),lo=Math.floor(lng*8000+1e-7);
  const a=[],b=[];
  for(let i=0;i<5;i++){a.unshift(la%20);la=Math.floor(la/20);b.unshift(lo%20);lo=Math.floor(lo/20)}
  let c='';for(let i=0;i<5;i++)c+=OLC[a[i]]+OLC[b[i]];
  return c.slice(0,8)+'+'+c.slice(8);
}
function olcDecode(code){
  const c=code.replace('+','').replace(/0+$/,'');
  if(c.length<2||c.indexOf('0')>=0)return null;
  const pairLen=Math.min(c.length,10);
  if(pairLen%2)return null;
  let lat=-90,lng=-180,res=20,sLat=0,sLng=0;
  for(let i=0;i<pairLen;i+=2){
    const a=OLC.indexOf(c[i]),b=OLC.indexOf(c[i+1]);
    if(a<0||b<0)return null;
    lat+=a*res;lng+=b*res;sLat=sLng=res;res/=20;
  }
  for(let i=10;i<c.length;i++){
    const d=OLC.indexOf(c[i]);if(d<0)return null;
    sLat/=5;sLng/=4;lat+=Math.floor(d/4)*sLat;lng+=(d%4)*sLng;
  }
  if(lat>=90||lng>=180)return null;
  return{lat:lat+sLat/2,lng:lng+sLng/2};
}
function olcRecover(short,refLat,refLng){
  const pad=8-short.indexOf('+'),res=Math.pow(20,2-pad/2),half=res/2;
  const prefix=olcEncode(refLat,refLng).replace('+','').slice(0,pad);
  const d=olcDecode(prefix+short);if(!d)return null;
  let lat=d.lat,lng=d.lng;
  if(refLat+half<lat&&lat-res>=-90)lat-=res;else if(refLat-half>lat&&lat+res<=90)lat+=res;
  if(refLng+half<lng)lng-=res;else if(refLng-half>lng)lng+=res;
  return{lat,lng};
}
function parseLoc(text){
  const t=text.trim();
  const bad={err:'อ่านไม่ออก ใส่ Plus Code เช่น 7P52QG42+GP หรือพิกัด เช่น 13.7563, 100.5018'};
  if(!t)return bad;
  const m=t.match(/^(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)$/);
  if(m){
    const la=+m[1],lo=+m[2];
    return(Math.abs(la)<=90&&Math.abs(lo)<=180)?{lat:la,lon:lo,kind:'latlon'}:{err:'ละติจูดต้องอยู่ระหว่าง −90 ถึง 90 และลองจิจูดระหว่าง −180 ถึง 180'};
  }
  const tok=t.split(/\s+/)[0].toUpperCase();
  if(!/^[23456789CFGHJMPQRVWX0]*\+[23456789CFGHJMPQRVWX]*$/.test(tok))return bad;
  const plus=tok.indexOf('+'),after=tok.length-plus-1;
  if(plus%2===1||plus>8||after===1)return bad;
  if(plus<8){
    if(after<2)return bad;
    const r=olcRecover(tok,SIM.refLat,SIM.refLon);
    return r?{lat:r.lat,lon:r.lng,kind:'short'}:bad;
  }
  const d=olcDecode(tok);
  return d?{lat:d.lat,lon:d.lng,kind:'full'}:bad;
}

/* ---- sun position and one-day simulation ---- */
const SIM={lat:13.7563,lon:100.5018,refLat:13.7563,refLon:100.5018,date:'',tz:7,tilt:15,az:180,sky:'clear',amin:24,amax:34,loss:5,noct:43};
const SKY={clear:{dir:.85,dif:1.3},partly:{dir:.5,dif:1.8},overcast:{dir:.06,dif:2.2}};
const DIRS=[['เหนือ',0],['ตะวันออกเฉียงเหนือ',45],['ตะวันออก',90],['ตะวันออกเฉียงใต้',135],['ใต้',180],['ตะวันตกเฉียงใต้',225],['ตะวันตก',270],['ตะวันตกเฉียงเหนือ',315]];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const pad2=n=>String(n).padStart(2,'0');
const fmtT=h=>{const m=Math.round(h*60);return pad2(Math.floor(m/60)%24)+':'+pad2(m%60)};
const fmtNum=v=>String(Number(v.toFixed(2)));
const dirName=az=>DIRS[Math.round((((az%360)+360)%360)/45)%8][0];
function dayOfYear(s){const p=s.split('-').map(Number);return Math.round((Date.UTC(p[0],p[1]-1,p[2])-Date.UTC(p[0],0,0))/864e5)}

function solarPos(lat,lon,doy,h,tz){
  const g=2*Math.PI/365*(doy-1+(h-12)/24);
  const eqt=229.18*(0.000075+0.001868*Math.cos(g)-0.032077*Math.sin(g)-0.014615*Math.cos(2*g)-0.040849*Math.sin(2*g));
  const dec=0.006918-0.399912*Math.cos(g)+0.070257*Math.sin(g)-0.006758*Math.cos(2*g)+0.000907*Math.sin(2*g)-0.002697*Math.cos(3*g)+0.00148*Math.sin(3*g);
  const tst=h*60+eqt+4*lon-60*tz,ha=(tst/4-180)*Math.PI/180,la=lat*Math.PI/180;
  const cosZ=Math.sin(la)*Math.sin(dec)+Math.cos(la)*Math.cos(dec)*Math.cos(ha);
  const zen=Math.acos(clamp(cosZ,-1,1)),sinZ=Math.sin(zen);
  let az=Math.PI;
  if(sinZ>1e-6){az=Math.acos(clamp((Math.sin(dec)-Math.sin(la)*cosZ)/(Math.cos(la)*sinZ),-1,1));if(ha>0)az=2*Math.PI-az}
  return{cosZ,zen,az};
}

function simDay(blocks,I,tilt,az,step,ideal,noEv){
  const n=Math.round(1440/step),doy=dayOfYear(SIM.date),la=SIM.lat,lo=SIM.lon;
  const b=tilt*Math.PI/180,gp=az*Math.PI/180,sky=SKY[SIM.sky],keep=1-SIM.loss/100;
  const Ics=1361*(1+0.033*Math.cos(2*Math.PI*doy/365)),dt=step/60/1000;
  const ev=(!noEv&&typeof EV!=='undefined')?EV:null;
  const R={step,n,t:[],g:[],tc:[],sun:[],elev:[],saz:[],cov:[],shade:[],vmp:[[],[]],pot:[],pac:[],E:0,Eclip:0,Elim:0,first:-1,last:-1,ops:0,idle:0,peak:0,peakI:-1};
  for(let i=0;i<n;i++){
    const h=(i+.5)*step/60,sp=solarPos(la,lo,doy,h,SIM.tz);
    let g=0,gb=0,gd=0;
    if(sp.cosZ>0.001){
      const zd=sp.zen*180/Math.PI,am=1/(sp.cosZ+0.50572*Math.pow(96.07995-zd,-1.6364));
      const dni=Ics*Math.pow(0.7,Math.pow(am,0.678)),dhi=0.1*dni*sky.dif,dne=dni*sky.dir;
      const ghi=dne*sp.cosZ+dhi;
      const cosI=Math.max(0,sp.cosZ*Math.cos(b)+Math.sin(sp.zen)*Math.sin(b)*Math.cos(sp.az-gp));
      gb=dne*cosI;gd=dhi*(1+Math.cos(b))/2+ghi*0.2*(1-Math.cos(b))/2;
    }
    const cov=ev?evCloud(h):0;
    if(cov>0){gb*=1-cov*ev.cloud.depth/100*0.95;gd*=1-cov*ev.cloud.depth/100*0.35}
    g=gb+gd;
    const elev=Math.PI/2-sp.zen,soil=ev&&ev.dust.on?1-ev.dust.pct/100:1;
    const ta=(SIM.amax+SIM.amin)/2+(SIM.amax-SIM.amin)/2*Math.cos(2*Math.PI*(h-15)/24);
    const tc=ta+((PV.noct||43)-20)/800*g;
    let pot=0,pdc=0,lim=0,shd=0;
    blocks.forEach((bk,j)=>{
      if(!bk||g<20){R.vmp[j].push(null);return}
      const sf=ev&&sp.cosZ>0.001?evTreeShade(sp.az,elev,j):0;if(sf>shd)shd=sf;
      const gs=(gb*(1-sf)+gd)*soil;
      const ln=2.04*Math.log(Math.max(gs,1)/1000);
      const vmp=Math.max(0,PV.vmp*(1+PV.kPmax/100*(tc-25))+ln)*bk.ns;
      const voc=Math.max(0,PV.voc*(1+PV.kVoc/100*(tc-25))+ln)*bk.ns;
      const imp=PV.imp*(gs/1000)*(1+PV.kIsc/100*(tc-25))*bk.mp;
      const p=bk.n*PV.pmax*(gs/1000)*(1+PV.kPmax/100*(tc-25))*keep;
      R.vmp[j].push(vmp);
      pot+=p;
      if(ideal)pdc+=p;
      else if(voc>=I.start&&voc<=I.vmax&&vmp>=I.lo&&vmp<=I.hi){const k=imp>I.imax?I.imax/imp:1;pdc+=p*k;lim+=p*(1-k)}
    });
    const pre=pdc*(I.eff||97)/100,pac=Math.min(pre,I.pac);
    R.elev.push(elev);R.saz.push(sp.az);R.cov.push(cov);R.shade.push(shd);R.t.push(h);R.g.push(g);R.tc.push(tc);R.sun.push(sp.cosZ>0);R.pot.push(pot);R.pac.push(pac);
    R.E+=pac*dt;R.Eclip+=(pre-pac)*dt;R.Elim+=lim*dt;
    if(pac>0){if(R.first<0)R.first=i;R.last=i;R.ops++;if(pac>R.peak){R.peak=pac;R.peakI=i}}
    else if(g>=20)R.idle++;
  }
  return R;
}

/* ---- charts ---- */
function niceStep(raw){
  const e=Math.pow(10,Math.floor(Math.log10(raw||1)));
  for(const c of [1,1.5,2,2.5,5,10]){if(c*e>=raw-1e-9)return c*e}
  return 10*e;
}
function drawLine(host,c){
  const W=Math.max(280,host.clientWidth||600),H=240,ml=46,mr=16,mt=22,mb=28,iw=W-ml-mr,ih=H-mt-mb;
  const x0=c.xmin!=null?c.xmin:c.x[0],x1=c.xmax!=null?c.xmax:c.x[c.x.length-1],stp=niceStep(c.ymax/4),ymax=stp*4;
  const sx=t=>ml+(t-x0)/(x1-x0)*iw,sy=v=>mt+ih-(v/ymax)*ih;
  let s=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${c.aria}">`;
  if(c.band){
    s+=`<rect x="${ml}" y="${sy(c.band.hi)}" width="${iw}" height="${sy(c.band.lo)-sy(c.band.hi)}" style="fill:var(--band)"/>`;
    s+=`<text x="${ml+6}" y="${sy(c.band.hi)+14}" class="ax">${c.band.label}</text>`;
  }
  (c.vb||[]).forEach((b,k)=>{
    const a=Math.max(x0,b[0]),e=Math.min(x1,b[1]);
    if(e>a){s+=`<rect x="${sx(a)}" y="${mt}" width="${sx(e)-sx(a)}" height="${ih}" style="fill:var(--warnbg);opacity:.8"/>`;if(k===0&&c.vbl)s+=`<text x="${sx(a)+6}" y="${mt+14}" class="ax">${c.vbl}</text>`}
  });
  for(let i=0;i<=4;i++){const v=stp*i,y=sy(v);s+=`<line x1="${ml}" x2="${W-mr}" y1="${y}" y2="${y}" class="gl"/><text x="${ml-6}" y="${y+4}" class="ax" text-anchor="end">${fmtNum(v)}</text>`}
  const xs=(x1-x0)>10?(iw<420?4:2):(iw<300?2:1);
  for(let h=Math.ceil(x0/xs)*xs;h<=x1+1e-9;h+=xs){const x=sx(h);s+=`<line x1="${x}" x2="${x}" y1="${mt+ih}" y2="${mt+ih+4}" class="gl"/><text x="${x}" y="${H-8}" class="ax" text-anchor="${x>W-mr-14?'end':'middle'}">${pad2(h)}:00</text>`}
  s+=`<text x="${ml-6}" y="10" class="ax" text-anchor="end">${c.unit}</text>`;
  (c.refs||[]).forEach(r=>{const y=sy(r.y);s+=`<line x1="${ml}" x2="${W-mr}" y1="${y}" y2="${y}" class="rl"/><text x="${W-mr-4}" y="${y-5}" class="ax" text-anchor="end">${r.label}</text>`});
  c.series.forEach(se=>{
    let seg=[],d='',area='';
    const flush=()=>{
      if(seg.length>1){
        d+='M'+seg.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join('L');
        if(se.area)area+=`<path d="M${seg[0][0].toFixed(1)} ${sy(0)}L${seg.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join('L')}L${seg[seg.length-1][0].toFixed(1)} ${sy(0)}Z" style="fill:${se.color};fill-opacity:.1"/>`;
      }
      seg=[];
    };
    se.vals.forEach((v,i)=>{if(v==null)flush();else seg.push([sx(c.x[i]),sy(v)])});
    flush();
    s+=area+`<path d="${d}" class="ln" style="stroke:${se.color}"/>`;
    if(se.peak){
      let mi=-1,mv=-1;se.vals.forEach((v,i)=>{if(v!=null&&v>mv){mv=v;mi=i}});
      if(mi>=0&&mv>0){
        const px=sx(c.x[mi]),py=sy(mv),anc=px>W-90?'end':px<ml+60?'start':'middle';
        s+=`<circle cx="${px}" cy="${py}" r="4.5" style="fill:${se.color}" class="pk"/><text x="${px}" y="${py-10}" class="ax strong" text-anchor="${anc}">${se.fmt(mv)} ${c.unit} · ${fmtT(c.x[mi])}</text>`;
      }
    }
  });
  s+=`<line class="xh" y1="${mt}" y2="${mt+ih}" style="display:none"/>`;
  c.series.forEach(se=>{s+=`<circle class="hd" r="4.5" style="fill:${se.color};display:none"/>`});
  s+=`<rect class="ov" x="${ml}" y="${mt}" width="${iw}" height="${ih}" fill="transparent"/></svg><div class="tip" hidden></div>`;
  host.innerHTML=s;
  const svgEl=host.querySelector('svg'),tip=host.querySelector('.tip'),xh=svgEl.querySelector('.xh'),dots=[...svgEl.querySelectorAll('.hd')],ov=svgEl.querySelector('.ov');
  const step=c.x.length>1?c.x[1]-c.x[0]:1;
  function show(ev){
    const r=svgEl.getBoundingClientRect(),px=(ev.clientX-r.left)*(W/r.width);
    let i=Math.round((x0+(px-ml)/iw*(x1-x0)-c.x[0])/step);i=clamp(i,0,c.x.length-1);
    const X=sx(c.x[i]);
    xh.setAttribute('x1',X);xh.setAttribute('x2',X);xh.style.display='';
    tip.hidden=false;tip.textContent='';
    const hd=document.createElement('div');hd.className='th';hd.textContent=fmtT(c.x[i]);tip.appendChild(hd);
    c.series.forEach((se,k)=>{
      const v=se.vals[i],dt=dots[k];
      if(v==null){dt.style.display='none';return}
      dt.style.display='';dt.setAttribute('cx',X);dt.setAttribute('cy',sy(v));
      const row=document.createElement('div');row.className='tr';
      const key=document.createElement('span');key.className='tk';key.style.background=se.color;
      const val=document.createElement('span');val.className='tv';val.textContent=se.fmt(v)+' '+c.unit;
      const nm=document.createElement('span');nm.className='tn';nm.textContent=se.short;
      row.append(key,val,nm);tip.appendChild(row);
    });
    const w=tip.offsetWidth;let left=X+12;if(left+w>W)left=X-w-12;
    tip.style.left=Math.max(0,left)+'px';
  }
  function hide(){tip.hidden=true;xh.style.display='none';dots.forEach(d=>d.style.display='none')}
  ov.addEventListener('pointermove',show);ov.addEventListener('pointerdown',show);
  ov.addEventListener('pointerleave',hide);ov.addEventListener('pointerup',e=>{if(e.pointerType==='touch')hide()});
}

/* ---- simulation view ---- */
let lastA=null,lastSig='',chartCfg=null;
function maybeSim(A){
  lastA=A;
  const sig=JSON.stringify([A.res.map(r=>r.status==='ok'?[r.blk.ns,r.blk.mp,r.blk.n]:0),curInv(),PV]);
  if(sig!==lastSig){lastSig=sig;runSim()}
}
function drawOrient(){
  const az=SIM.az*Math.PI/180,cx=75,cy=75,R=56,b=SIM.tilt*Math.PI/180;
  let s=`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" class="gl"/>`;
  [['N',0],['E',90],['S',180],['W',270]].forEach(d=>{const a=d[1]*Math.PI/180;s+=`<text x="${cx+(R+11)*Math.sin(a)}" y="${cy-(R+11)*Math.cos(a)+4}" class="ax" text-anchor="middle">${d[0]}</text>`});
  const ex=cx+R*0.88*Math.sin(az),ey=cy-R*0.88*Math.cos(az);
  s+=`<line x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" class="ln" style="stroke:var(--s1);stroke-width:3.5"/><circle cx="${cx}" cy="${cy}" r="4.5" style="fill:var(--s1)" class="pk"/>`;
  const ox=190,gy=112,len=100;
  s+=`<line x1="${ox-40}" y1="${gy}" x2="${ox+130}" y2="${gy}" class="gl"/><line x1="${ox}" y1="${gy}" x2="${ox+len*Math.cos(b)}" y2="${gy-len*Math.sin(b)}" class="ln" style="stroke:var(--cell);stroke-width:7"/>`;
  s+=`<text x="${ox+60}" y="${gy-8}" class="ax">${SIM.tilt}°</text><text x="${ox-40}" y="${gy+16}" class="ax">มุมเอียงจากแนวนอน</text>`;
  $('#orsvg').innerHTML=s;
}
function setOrientUI(){
  $('#tiltv').textContent=SIM.tilt+'°';
  $('#azv').textContent=`${SIM.az}° (${dirName(SIM.az)})`;
  document.querySelectorAll('#dirs .chip').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.az===Math.round(SIM.az/45)%8*45)));
  drawOrient();
}
function pvSiteSync(){
  const c=document.getElementById('pvsite');if(!c||typeof EV==='undefined')return;
  c.checked=EV.site.on;
  const n=typeof siArrays==='function'?siArrays().length:0;
  document.getElementById('pvsitenote').textContent=EV.site.on?(n?`ใช้ต้นไม้ ตึก และตำแหน่งแผง ${n} ชุดจากผังไซต์`:'ยังไม่มีแผงบนผัง ไปแท็บ 05 กด "+ แผงโซลาร์"'):(n?`มีแผงบนผัง ${n} ชุด ติ๊กเพื่อคิดเงาจากผัง`:'วางบ้าน ต้นไม้ ตึก และแผงได้ที่แท็บ 05');
}
function runSimView(){
  if(!lastA)return;
  const A=lastA,I=A.I,blocks=A.res.map(r=>r.status==='ok'?r.blk:null);
  const body=$('#simbody'),msg=$('#simmsg');
  if(!blocks.some(Boolean)){msg.hidden=false;body.hidden=true;return}
  msg.hidden=true;body.hidden=false;
  const R=simDay(blocks,I,SIM.tilt,SIM.az,5);
  const sunI=R.sun.map((v,i)=>v?i:-1).filter(i=>i>=0);
  if(!sunI.length){body.hidden=true;msg.hidden=false;msg.textContent='วันที่และพิกัดนี้ไม่มีแสงอาทิตย์ (กลางคืนตลอดวัน)';return}
  const sr=sunI[0]*R.step/60,ss=(sunI[sunI.length-1]+1)*R.step/60;
  const xmin=Math.max(0,Math.floor(sr-0.5)),xmax=Math.min(24,Math.ceil(ss+0.5));
  const i0=Math.round(xmin*60/R.step),i1=Math.round(xmax*60/R.step);
  const sl=a=>a.slice(i0,i1);
  const xs=sl(R.t),kw=v=>v==null?null:v/1000;
  const nUsed=blocks.reduce((a,b)=>a+(b?b.n:0),0),kwp=nUsed*PV.pmax/1000;
  const hrs=R.ops*R.step/60,idleH=R.idle*R.step/60;
  const mx=[
    ['ช่วงที่อินเวอร์เตอร์ทำงาน',R.ops?`${fmtT(R.first*R.step/60)}–${fmtT((R.last+1)*R.step/60)}`:'ไม่ทำงาน',R.ops?`${f(hrs,1)} ชม. · แสงอาทิตย์ ${fmtT(sr)}–${fmtT(ss)}`:`แสงอาทิตย์ ${fmtT(sr)}–${fmtT(ss)}`],
    ['กำลัง AC สูงสุด',R.ops?f(R.peak/1000,2)+' kW':'0 kW',R.ops?`เวลา ${fmtT(R.t[R.peakI])} · พิกัด ${I.pac/1000} kW`:''],
    ['พลังงานต่อวัน',f(R.E,1)+' kWh',`${f(R.E/kwp,2)} kWh ต่อ kWp · ${nUsed} แผง`],
    ['สูญเสียจากเพดาน AC',f(R.Eclip,2)+' kWh',`จำกัดกระแส MPPT ${f(R.Elim*(I.eff||97)/100,2)} kWh`],
    ['มีแสงแต่ยังไม่ทำงาน',f(idleH,1)+' ชม.','แรงดันต่ำกว่าช่วง MPPT หรือยังไม่ถึงแรงดันเริ่มทำงาน']
  ];
  if(typeof evSiteActive==='function'&&evSiteActive()){const S0=(()=>{const k=EV.site.on;EV.site.on=false;const r=simDay(blocks,I,SIM.tilt,SIM.az,5);EV.site.on=k;return r})();
    mx.push(['เสียไฟจากเงาในผังไซต์',f(Math.max(0,S0.E-R.E),2)+' kWh',`${f(S0.E>0?(S0.E-R.E)/S0.E*100:0,1)} % ของวันนี้ · แผงบนผัง ${siArrays().length} ชุด`])}
  pvSiteSync();
  $('#mx').innerHTML=mx.map(m=>`<div class="metric"><div class="k">${m[0]}</div><div class="v">${m[1]}</div><div class="s">${m[2]}</div></div>`).join('');
  const potMax=Math.max(...R.pot)/1000,vTop=Math.max(I.hi,...R.vmp.flatMap(a=>a.filter(v=>v!=null)))*1.05;
  chartCfg={
    A:{x:xs,ymax:Math.max(potMax,I.pac/1000)*1.08,unit:'kW',aria:'กราฟกำลังไฟฟ้า AC และ DC ตลอดวัน',
      refs:[{y:I.pac/1000,label:`พิกัด AC ${I.pac/1000} kW`}],
      series:[{short:'กำลัง AC ที่จ่ายจริง',color:'var(--s1)',vals:sl(R.pac).map(kw),area:true,peak:true,fmt:v=>f(v,2)},
              {short:'กำลัง DC จากแผง',color:'var(--s2)',vals:sl(R.pot).map(kw),fmt:v=>f(v,2)}]},
    B:{x:xs,ymax:vTop,unit:'V',aria:'กราฟแรงดันสตริงเทียบช่วง MPPT ตลอดวัน',
      band:{lo:I.lo,hi:I.hi,label:`ช่วง MPPT ${I.lo}–${I.hi} V`},
      refs:[{y:I.start,label:`แรงดันเริ่มทำงาน ${I.start} V`}],
      series:blocks.map((bk,j)=>bk?{short:`MPPT ${j+1} (${bk.ns} แผงอนุกรม)`,color:j?'var(--s2)':'var(--s1)',vals:sl(R.vmp[j]),fmt:v=>f(v,0)}:null).filter(Boolean)}
  };
  $('#lgA').innerHTML=chartCfg.A.series.map(se=>`<span class="lg"><i class="lk" style="background:${se.color}"></i>${se.short}</span>`).join('');
  $('#lgB').innerHTML=chartCfg.B.series.map(se=>`<span class="lg"><i class="lk" style="background:${se.color}"></i>${se.short}</span>`).join('')+`<span class="lg"><i class="lb"></i>ช่วง MPPT</span>`;
  drawCharts();
  const E8=DIRS.map(d=>simDay(blocks,I,SIM.tilt,d[1],15).E),eMax=Math.max(...E8,0.001);
  const selI=Math.round(SIM.az/45)%8;
  $('#dirbars').innerHTML=DIRS.map((d,i)=>`<div class="brow${i===selI?' sel':''}" title="${d[0]}: ${f(E8[i],1)} kWh ต่อวัน"><span class="bn">${d[0]}</span><span class="btrack"><span class="bfill" style="width:${Math.max(2,E8[i]/eMax*100*0.78)}%"></span><span class="bv">${f(E8[i],1)} kWh</span></span></div>`).join('');
  $('#dirnote').textContent=`เทียบที่มุมเอียง ${SIM.tilt}° วันที่เลือก สภาพฟ้าเดียวกัน แถบที่เน้นคือทิศที่ใกล้กับ ${SIM.az}° ที่สุด`;
  let rows='';
  for(let h=Math.ceil(xmin);h<=Math.floor(xmax);h++){
    const i=Math.min(R.n-1,Math.round(h*60/R.step));
    rows+=`<tr><td>${pad2(h)}:00</td><td>${f(R.g[i])}</td><td>${f(R.tc[i],1)}</td>`+blocks.map((bk,j)=>bk?`<td>${R.vmp[j][i]==null?'-':f(R.vmp[j][i])}</td>`:'').join('')+`<td>${f(R.pot[i]/1000,2)}</td><td>${f(R.pac[i]/1000,2)}</td></tr>`;
  }
  $('#tblh').innerHTML=`<tr><th>เวลา</th><th>แสงบนแผง (W/m²)</th><th>อุณหภูมิเซลล์ (°C)</th>`+blocks.map((bk,j)=>bk?`<th>Vmp MPPT ${j+1} (V)</th>`:'').join('')+`<th>DC (kW)</th><th>AC (kW)</th></tr>`;
  $('#tblb').innerHTML=rows;
}
function runSim(){runSimView();if(typeof backupRun==='function')backupRun();if(typeof evRun==='function')evRun()}
function drawCharts(){if(!chartCfg)return;drawLine($('#chA'),chartCfg.A);drawLine($('#chB'),chartCfg.B)}
let rz=0;
window.addEventListener('resize',()=>{cancelAnimationFrame(rz);rz=requestAnimationFrame(drawCharts)});
{const c=document.getElementById('pvsite');if(c){c.addEventListener('change',e=>evSiteOn(e.target.checked));document.getElementById('pvsitego').addEventListener('click',()=>showTab('site'))}}

function applyLoc(){
  const r=parseLoc($('#loc').value),m=$('#locmsg');
  if(r.err){m.className='locmsg err';m.textContent=r.err;return}
  SIM.lat=r.lat;SIM.lon=r.lon;
  if(r.kind!=='short'){SIM.refLat=r.lat;SIM.refLon=r.lon}
  m.className='locmsg ok';
  m.textContent=`พิกัด ${f(r.lat,5)}, ${f(r.lon,5)}`+(r.kind==='latlon'?` · Plus Code ${olcEncode(r.lat,r.lon)}`:r.kind==='short'?' · โค้ดแบบสั้น ใช้พิกัดล่าสุดเป็นจุดอ้างอิง':'');
  runSim();
}
function initSim(){
  const d=new Date();SIM.date=`${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
  $('#date').value=SIM.date;
  $('#loc').value=olcEncode(SIM.lat,SIM.lon);
  $('#locmsg').className='locmsg ok';$('#locmsg').textContent=`ตัวอย่าง: กรุงเทพฯ พิกัด ${f(SIM.lat,4)}, ${f(SIM.lon,4)} ใส่ Plus Code หรือพิกัดของไซต์จริงแทนได้`;
  $('#dirs').innerHTML=DIRS.map(d=>`<button class="chip" data-az="${d[1]}" aria-pressed="false">${d[0]}</button>`).join('');
  $('#dirs').addEventListener('click',e=>{const b=e.target.closest('[data-az]');if(!b)return;SIM.az=+b.dataset.az;$('#az').value=SIM.az;setOrientUI();runSim()});
  $('#loc').addEventListener('input',applyLoc);
  $('#date').addEventListener('input',e=>{if(e.target.value){SIM.date=e.target.value;runSim()}});
  $('#tz').addEventListener('input',e=>{const n=parseFloat(e.target.value);if(!isNaN(n)){SIM.tz=n;runSim()}});
  $('#sky').addEventListener('change',e=>{SIM.sky=e.target.value;runSim()});
  ['amin','amax'].forEach(id=>$('#'+id).addEventListener('input',e=>{const n=parseFloat(e.target.value);if(!isNaN(n)){SIM[id]=n;if(SIM.amin>SIM.amax){const t=SIM.amin;SIM.amin=SIM.amax;SIM.amax=t}runSim()}}));
  $('#tilt').addEventListener('input',e=>{SIM.tilt=+e.target.value;setOrientUI();runSim()});
  $('#az').addEventListener('input',e=>{SIM.az=+e.target.value;setOrientUI();runSim()});
  $('#optb').addEventListener('click',()=>{SIM.tilt=Math.round(Math.min(Math.abs(SIM.lat),90));SIM.az=SIM.lat>=0?180:0;$('#tilt').value=SIM.tilt;$('#az').value=SIM.az;setOrientUI();runSim()});
  setOrientUI();
}
