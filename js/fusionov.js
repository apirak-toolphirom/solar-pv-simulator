/* ---- FusionSolar: หน้า Overview ของโรงไฟฟ้า (KPI, แผนภาพการไหลของพลังงาน, Energy Management, Revenue) สีกราฟตามแอปจริง ---- */
const FUC={pv:'#2eb872',load:'#ef5b4f',self:'#3b8eea',grn:'#3c9a1c',yel:'#f0b823',org:'#f07a1c',pur:'#b44cf0'};
function fuOvSeries(D){
  const MY=fuMonthYear(D),LP=loadProfile(5),n=D.n,dayL=LP.all.slice(0,n);
  const lkWh=dayL.reduce((a,v)=>a+v,0)*5/60/1000;
  const dir=D.pac.map((v,k)=>Math.min(v,dayL[k])),dKWh=dir.reduce((a,v)=>a+v,0)*5/60/1000,pKWh=D.E||1e-9,ratio=Math.min(1,dKWh/pKWh);
  const wob=k=>0.92+0.16*fuWxSeed(k*17+3);
  const mk=(pv,lf)=>({pv,load:pv.map((_,k)=>lkWh*lf(k)),direct:pv.map((v,k)=>Math.min(v*ratio,lkWh*lf(k)))});
  const dim=MY.days.length,y=MY.y;
  const day={x:Array.from({length:n},(_,k)=>k*5/60),pv:D.pac.map(v=>v/1000),load:dayL.map(v=>v/1000),direct:dir.map(v=>v/1000),unit:'kW',lines:true,
    tot:{pv:D.E,load:lkWh,direct:dKWh}};
  const mo=mk(MY.days,k=>wob(k+MY.m*40)),yr=mk(MY.mon,k=>[31,28,31,30,31,30,31,31,30,31,30,31][k]*wob(k+90));
  const life=mk([0,1,2].map(k=>MY.mon.reduce((a,v)=>a+v,0)*(k===2?1:(0.96-0.03*(1-k)))),()=>365);
  return{day,month:Object.assign(mo,{x:MY.days.map((_,k)=>k+1),unit:'kWh'}),year:Object.assign(yr,{x:['1','2','3','4','5','6','7','8','9','10','11','12'],unit:'kWh'}),
    lifetime:Object.assign(life,{x:[y-2,y-1,y].map(String),unit:'kWh'}),MY};
}
function fuLineSVG(S,upTo){
  const W=860,H=210,L=40,Rm=10,T=12,B=26,pw=W-L-Rm,ph=H-T-B,nn=S.pv.length;
  const mx=Math.max(1e-6,...S.pv,...S.load)*1.1,X=k=>L+(nn>1?k/(nn-1):.5)*pw,Y=v=>T+ph-v/mx*ph;
  let g='';
  for(let k=0;k<=5;k++){const v=mx*k/5,y=Y(v);g+=`<line x1="${L}" x2="${W-Rm}" y1="${y}" y2="${y}" class="fugrid"/><text x="${L-6}" y="${y+4}" text-anchor="end" class="fuax">${f(v,mx>=10?0:1)}</text>`}
  g+=`<text x="${L-6}" y="9" text-anchor="end" class="fuax">${S.unit}</text>`;
  const step=nn>40?Math.round(nn/12):1;
  S.x.forEach((xv,k)=>{if(S.lines){if(k%24===0)g+=`<text x="${X(k)}" y="${H-8}" text-anchor="middle" class="fuax">${pad2(Math.floor(xv))}:00</text>`}else if(k%Math.ceil(nn/16||1)===0||nn<=16)g+=`<text x="${X(k)}" y="${H-8}" text-anchor="middle" class="fuax">${xv}</text>`});
  const path=a=>{const m=upTo==null?nn:upTo+1;return 'M'+a.slice(0,m).map((v,k)=>`${X(k).toFixed(1)} ${Y(v).toFixed(1)}`).join('L')};
  const st=(a,c,w)=>`<path d="${path(a)}" fill="none" stroke="${c}" stroke-width="${w||1.6}" stroke-linejoin="round"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="PV output, total consumption, consumed from PV">${g}${st(S.load,FUC.load)}${st(S.direct,FUC.self)}${st(S.pv,FUC.pv,2)}</svg>
  <div class="fuleg"><span><i style="background:${FUC.pv}"></i>PV output</span><span><i style="background:${FUC.load}"></i>Total consumption</span><span><i style="background:${FUC.self}"></i>Consumed from PV</span></div>`;
}
function fuRevSVG(vals,labels,hi){
  const W=860,H=210,L=40,Rm=10,T=14,B=26,pw=W-L-Rm,ph=H-T-B,n=vals.length,mx=Math.max(...vals,.01)*1.15,bw=pw/n;let s='';
  for(let k=0;k<=5;k++){const v=mx*k/5,y=T+ph-v/mx*ph;s+=`<line x1="${L}" x2="${W-Rm}" y1="${y}" y2="${y}" class="fugrid"/><text x="${L-6}" y="${y+4}" text-anchor="end" class="fuax">${f(v,mx>=10?0:1)}</text>`}
  vals.forEach((v,k)=>{const h=v/mx*ph,x=L+k*bw;s+=`<rect x="${x+bw*.2}" y="${T+ph-h}" width="${bw*.6}" height="${h}" fill="${FUC.pur}" opacity="${k>hi?.0:1}"><title>${labels[k]}: ${f(v,2)} ฿</title></rect>`;if(n<=14||k%Math.ceil(n/16)===0)s+=`<text x="${x+bw/2}" y="${H-8}" text-anchor="middle" class="fuax">${labels[k]}</text>`});
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Revenue">${s}</svg><div class="fuleg"><span><i style="background:${FUC.pur}"></i>Revenue</span></div>`;
}
function fuFlowSVG(pv,ld,gr){
  const c=(x,y,t,v,col,above)=>`<circle cx="${x}" cy="${y}" r="28" fill="#fff" stroke="${col}" stroke-width="2"/><text x="${x}" y="${y}" text-anchor="middle" class="fuflv">${f(v,3)}</text><text x="${x}" y="${y+12}" text-anchor="middle" class="fuflv">kW</text><text x="${x}" y="${above?y-36:y+46}" text-anchor="middle" class="fuax">${t}</text>`;
  return `<svg viewBox="0 0 300 230" class="fuflow" role="img" aria-label="การไหลของพลังงาน"><path d="M150 70V160H62" fill="none" stroke="#f3b040" stroke-width="2.5" opacity="${pv>0?1:.35}"/><path d="M62 160H238" fill="none" stroke="#4aa8f0" stroke-width="2.5"/>${c(150,44,'PV',pv,'#f3d66b',true)}${c(62,160,'Load',ld,'#7ec8f5')}${c(238,160,gr>=0?'Grid (import)':'Grid (export)',Math.abs(gr),'#c9a8f0')}</svg>`;
}
function fuOvRender(D,i){
  const el=document.getElementById('fuovn');if(!el)return;
  const S=fuOvSeries(D),MY=S.MY,P=fuPv(),I=D.I;
  const tariff=FU.tariff,evv=FU.ev||'day',rvv=FU.rv||'month';
  const LP=loadProfile(5),L=LP.all.slice(0,D.n);
  let cumPv=D.Ecum[i][1],cumL=0,cumD=0,cumE=0;for(let k=0;k<=i;k++){const dtk=5/60/1000;cumL+=L[k]*dtk;cumD+=Math.min(D.pac[k],L[k])*dtk;cumE+=Math.max(0,D.pac[k]-L[k])*dtk}
  const pvk=D.pac[i]/1000,ldk=L[i]/1000,grk=ldk-Math.min(pvk,ldk)-Math.max(0,pvk-ldk);
  const gridNet=(L[i]-D.pac[i])/1000,tot=D.tot||0,co2=tot*0.475/1000,coal=tot*0.4/1000;
  const cap=D.blocks.reduce((a,b)=>a+(b?b.n*PV.pmax:0),0)/1000;
  const a=D.alarm,h=i*5/60,act=a&&a.start!=null&&h>=a.start&&(h<a.end||(a.key!=='dongle'&&a.key!=='temp'&&h<a.end+10/60));
  const cnt={Critical:0,Major:0,Minor:0,Warning:0};if(act)cnt[a.lv]++;const na=cnt.Critical+cnt.Major+cnt.Minor+cnt.Warning;
  const bar=k=>`<div class="fuabar"><span>${k}</span><b>${cnt[k]}</b><i><u style="width:${na?cnt[k]/na*100:0}%"></u></i></div>`;
  // Energy management values
  const T=S[evv].tot||{pv:S[evv].pv.reduce((a,v)=>a+v,0),load:S[evv].load.reduce((a,v)=>a+v,0),direct:S[evv].direct.reduce((a,v)=>a+v,0)};
  const pvT=evv==='day'?cumPv:T.pv,ldT=evv==='day'?cumL:T.load,dT=evv==='day'?cumD:T.direct,exT=Math.max(0,pvT-dT),imT=Math.max(0,ldT-dT);
  const pc=(x,y)=>y>0?x/y*100:0,pcs=pc(dT,pvT),pcl=pc(dT,ldT);
  const dateLb=evv==='day'?SIM.date:evv==='month'?SIM.date.slice(0,7):evv==='year'?String(MY.y):'Lifetime';
  const tabs=(key,cur,items)=>`<div class="futabs" data-fk="${key}">${items.map(([k,t])=>`<button type="button" data-v="${k}" aria-pressed="${k===cur}">${t}</button>`).join('')}</div>`;
  // revenue series
  const rv=rvv==='month'?{v:MY.days.map(v=>v*tariff),l:MY.days.map((_,k)=>pad2(k+1)),hi:Math.max(0,parseInt(SIM.date.slice(8,10))-1),lb:SIM.date.slice(0,7)}:
    rvv==='year'?{v:MY.mon.map(v=>v*tariff),l:['01','02','03','04','05','06','07','08','09','10','11','12'],hi:MY.m-1,lb:String(MY.y)}:
    {v:S.lifetime.pv.map(v=>v*tariff),l:S.lifetime.x,hi:2,lb:'Lifetime'};
  const rvT=rv.v.slice(0,rv.hi+1).reduce((a,v)=>a+v,0);
  el.innerHTML=`<div class="fuplant"><span class="fuhome" aria-hidden="true">⌂</span><b>โรงไฟฟ้าจำลอง</b><span class="pill ${D.online[i]?'ok':'err'}">${D.online[i]?'Connected':'Disconnected'}</span></div>
  <div class="fukpi"><div><span class="fuki" style="--c:#f0a020">☀</span><b>${f(cumPv,2)} <small>kWh</small></b><em>Yield today</em></div>
   <div><span class="fuki" style="--c:#3b8eea">▦</span><b>${f(tot/1000,2)} <small>MWh</small></b><em>Total yield</em></div>
   <div><span class="fuki" style="--c:#3b6fe0">⚡</span><b>${f(cumL,2)} <small>kWh</small></b><em>Consumption today</em></div>
   <div><span class="fuki" style="--c:#3b8eea">⌂</span><b>${f(cumD,2)} <small>kWh</small></b><em>Consumed from PV</em></div></div>
  <div class="fumain"><div class="fuflowbox"><span class="fulive">● Live Data</span>${fuFlowSVG(pvk,ldk,gridNet)}</div>
   <div class="fueco"><div><i>⛏</i><b>${f(coal,2)} <small>(tons)</small></b><em>Standard coal saved</em></div><div><i>🏭</i><b>${f(co2,2)} <small>(tons)</small></b><em>CO₂ avoided</em></div><div><i>🌲</i><b>${Math.round(co2*1000/21)}</b><em>Equivalent trees planted</em></div></div>
   <div class="fualc"><div class="fualh"><b>${na}</b> Alarm</div>${bar('Critical')}${bar('Major')}${bar('Minor')}${bar('Warning')}</div>
   <div class="fuinfo2"><div><span>Plant address</span><b>Thailand (${f(SIM.lat,2)}, ${f(SIM.lon,2)})</b></div><div><span>Total string capacity</span><b>${f(cap,3)} kWp</b></div><div><span>Grid connection date</span><b>2026-05-06</b></div></div></div>
  <div class="fuem"><div class="card fuemc"><div class="fuemh"><h2>Energy Management</h2>${tabs('ev',evv,[['day','Day'],['month','Month'],['year','Year'],['lifetime','Lifetime']])}<span class="fudate">${dateLb}</span></div>
    <div class="fuemg"><div><div class="fuemr"><b>PV yield:</b><span><b>${f(pvT,2)}</b> <small>kWh</small></span></div><div class="fuemr2"><span style="color:${FUC.grn}">${f(dT,2)}</span><span style="color:${FUC.yel}">${f(exT,2)}</span></div><div class="fuemr3"><span>Consumed (kWh)</span><span>Fed to grid (kWh)</span></div><div class="fupb"><i style="width:${pcs}%;background:${FUC.grn}">${f(pcs,2)}%</i><i style="width:${100-pcs}%;background:${FUC.yel}">${f(100-pcs,2)}%</i></div></div>
    <div><div class="fuemr"><b>Consumed by appliances:</b><span><b>${f(ldT,2)}</b> <small>kWh</small></span></div><div class="fuemr2"><span style="color:${FUC.org}">${f(dT,2)}</span><span style="color:${FUC.yel}">${f(imT,2)}</span></div><div class="fuemr3"><span>From PV (kWh)</span><span>From grid (kWh)</span></div><div class="fupb"><i style="width:${pcl}%;background:${FUC.org}">${f(pcl,2)}%</i><i style="width:${100-pcl}%;background:${FUC.yel}">${f(100-pcl,2)}%</i></div></div></div>
    <div class="fusvg">${fuLineSVG(S[evv],evv==='day'?i:null)}</div></div>
   <div class="card fuemc"><div class="fuemh"><h2>Revenue</h2>${tabs('rv',rvv,[['month','Month'],['year','Year'],['lifetime','Lifetime']])}<span class="fudate">${rv.lb}</span></div>
    <p class="furev">Total revenue <b>${f(rvT,2)}</b> ฿</p><div class="fusvg">${fuRevSVG(rv.v,rv.l,rv.hi)}</div></div></div>`;
}
function initFuov(){
  const el=document.getElementById('fuovn');if(!el)return;
  el.addEventListener('click',e=>{const b=e.target.closest('.futabs [data-v]');if(!b)return;const k=b.parentNode.dataset.fk;FU[k]=b.dataset.v;fuRender();touch()});
}
