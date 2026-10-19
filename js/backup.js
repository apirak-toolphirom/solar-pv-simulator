/* ---- backup simulation: on-grid / hybrid / off-grid, 5-minute energy balance ---- */
const BK={mode:'hybrid',src:'ideal',nIdeal:9,outStart:18,outDur:6,island:'crit',soc0:50};
const MODE_NAME={grid:'On-grid (ไม่มีแบต)',hybrid:'Hybrid (กริด + แบต)',off:'Off-grid (ไม่ต่อกริด)'};

/* pure energy balance. inputs: pv[], load[], crit[] in W (same length), cfg. returns arrays and totals */
function balance(pv,loadAll,loadCrit,cfg){
  const n=pv.length,dt=cfg.step/60,out=[];
  const bat=cfg.mode!=='grid'&&cfg.bank;
  const cap=bat?cfg.bank.kwh:0,Emin=bat?cap*(1-(cfg.bank.b.dod||90)/100):0,eta=bat?Math.sqrt(cfg.bank.rt):1;
  const chgMax=bat?cfg.chgKw:0,disMax=bat?cfg.disKw:0;
  let E=bat?Math.max(Emin,Math.min(cap,cap*cfg.soc0/100)):0;
  const R={pv:[],load:[],direct:[],toBat:[],fromBat:[],exp:[],imp:[],unmet:[],curt:[],soc:[],outage:[],
    T:{pv:0,load:0,direct:0,toBat:0,fromBat:0,exp:0,imp:0,unmet:0,curt:0,unmetOut:0,loadOut:0,unmetH:0},socMin:100,Emin,cap};
  for(let i=0;i<n;i++){
    const h=(i+.5)*cfg.step/60;
    const outage=cfg.mode==='off'?false:(cfg.outDur>0&&inWin(h,cfg.outStart%24,(cfg.outStart+cfg.outDur)%24));
    const island=cfg.mode==='off'||outage;
    const want=island?(cfg.island==='crit'?loadCrit[i]:loadAll[i]):loadAll[i];
    let p=pv[i],ld=want,unmet=0,direct=0,toB=0,fromB=0,exp=0,imp=0,curt=0;
    if(cfg.mode==='grid'){
      if(outage){curt=p;p=0;unmet=ld;ld=0}
      else{direct=Math.min(p,ld);exp=p-direct;imp=ld-direct}
    }else{
      if(island&&ld>cfg.islandW){unmet+=ld-cfg.islandW;ld=cfg.islandW}
      direct=Math.min(p,ld);
      let sur=(p-direct)*dt/1000,def=(ld-direct)*dt/1000;
      if(sur>0&&bat){
        const c=Math.min(sur,chgMax*dt,(cap-E)/eta);
        E+=c*eta;toB=c;sur-=c;
      }
      if(sur>1e-12){if(island)curt=sur*1000/dt;else exp=sur*1000/dt}
      let fromBkWh=0;
      if(def>0&&bat){
        const d=Math.min(def,disMax*dt,Math.max(0,E-Emin)*eta);
        E-=d/eta;fromBkWh=d;def-=d;
      }
      fromB=fromBkWh*1000/dt;toB=toB*1000/dt;
      if(def>1e-12){const w=def*1000/dt;if(island)unmet+=w;else imp=w}
    }
    if(cfg.mode==='grid'){/* toB, fromB stay 0 */}
    const soc=bat?E/cap*100:0;
    R.pv.push(pv[i]);R.load.push(want);R.direct.push(direct);R.toBat.push(toB);R.fromBat.push(fromB);R.exp.push(exp);R.imp.push(imp);R.unmet.push(unmet);R.curt.push(curt);R.soc.push(soc);R.outage.push(outage);
    const T=R.T,k=dt/1000;
    T.pv+=pv[i]*k;T.load+=want*k;T.direct+=direct*k;T.toBat+=toB*k;T.fromBat+=fromB*k;T.exp+=exp*k;T.imp+=imp*k;T.unmet+=unmet*k;T.curt+=curt*k;
    if(outage){T.unmetOut+=unmet*k;T.loadOut+=want*k}
    if(unmet>1)T.unmetH+=dt;
    if(bat&&soc<R.socMin)R.socMin=soc;
  }
  R.socEnd=R.soc[n-1];R.E=E;
  return R;
}

function bkSource(){
  /* returns {pv:[W per 5-min], label, kwp, err} using the same site/orientation as the panel tab */
  const I=curInv();
  if(BK.src==='ideal'){
    const N=Math.max(1,BK.nIdeal|0);
    const R=simDay([{n:N,ns:N,mp:1}],I,SIM.tilt,SIM.az,5,true);
    return{pv:R.pac,label:`แผงสมมติ ${N} แผง`,kwp:N*PV.pmax/1000,E:R.E};
  }
  if(!lastA)return{err:'ยังไม่มีผลการต่อสาย'};
  const blocks=lastA.res.map(r=>r.status==='ok'?r.blk:null);
  if(!blocks.some(Boolean))return{err:'ยังไม่ได้ต่อสายแผงเข้า MPPT ให้ถูกต้อง ไปแท็บ "ต่อสาย" หรือเลือกแหล่งไฟเป็นแผงสมมติ'};
  const R=simDay(blocks,I,SIM.tilt,SIM.az,5);
  const nUsed=blocks.reduce((a,b)=>a+(b?b.n:0),0);
  return{pv:R.pac,label:`ตามที่ต่อสายไว้ ${nUsed} แผง`,kwp:nUsed*PV.pmax/1000,E:R.E};
}

let bkCfg=null;
function backupRun(){
  if(!$('#bkmx'))return;
  const msg=$('#bkmsg'),body=$('#bkbody'),I=curInv(),bi=bankInfo();
  $('#bkverdict').hidden=true;
  const src=bkSource();
  const need=BK.mode!=='grid';
  const warns=[];
  if(src.err){msg.hidden=false;msg.textContent=src.err;body.hidden=true;return}
  if(need&&!bi){msg.hidden=false;msg.textContent='ยังไม่มีรุ่นแบตเตอรี่ในแคตตาล็อก เพิ่มที่แท็บ "อุปกรณ์"';body.hidden=true;return}
  msg.hidden=true;body.hidden=false;$('#bkverdict').hidden=false;
  const LP=loadProfile(5);
  if(!LOADS.length||Math.max(...LP.all)<=0){msg.hidden=false;msg.textContent='ยังไม่มีโหลด ไปแท็บ "จำลองโหลด" เพื่อใส่รายการ';body.hidden=true;$('#bkverdict').hidden=true;return}
  const chgKw=bi?Math.min(I.bchg>0?I.bchg:I.pac/1000,bi.kwh*bi.maxC):0;
  const disKw=bi?Math.min(I.bdis>0?I.bdis:I.pac/1000,bi.kwh*bi.maxC):0;
  const islandW=Math.min(I.pac,(I.backupKw>0?I.backupKw:I.pac/1000)*1000);
  const cfg={mode:BK.mode,bank:need?bi:null,chgKw,disKw,islandW,soc0:BK.soc0,outStart:BK.outStart,outDur:BK.outDur,island:BK.island,step:5};
  const R=balance(src.pv,LP.all,LP.crit,cfg);
  const T=R.T;

  /* warnings */
  if(need&&I.type==='on-grid')warns.push(['err',`อินเวอร์เตอร์ ${I.name} เป็นแบบ On-grid ต่อแบตไม่ได้ ผลด้านล่างจำลองเหมือนมีแบตเพื่อดูแนวทางเท่านั้น เลือกรุ่น Hybrid หรือ Off-grid ที่แท็บ "อุปกรณ์"`]);
  if(need&&bi&&I.type!=='on-grid'&&I.bvMax&&(bi.V<I.bvMin||bi.V>I.bvMax))warns.push(['err',`แรงดันชุดแบต ${f(bi.V,1)} V อยู่นอกช่วงที่อินเวอร์เตอร์รับ ${I.bvMin}–${I.bvMax} V ปรับจำนวนต่ออนุกรมที่แท็บ "อุปกรณ์"`]);
  if(BK.mode==='grid'&&BK.outDur>0)warns.push(['warn','อินเวอร์เตอร์ On-grid จะตัดการจ่ายไฟทันทีเมื่อกริดดับ (anti-islanding) แม้มีแดด ช่วงไฟดับจึงไม่มีไฟใช้']);
  const peakIsl=Math.max(...(BK.island==='crit'?LP.crit:LP.all));
  if(need&&(BK.mode==='off'||BK.outDur>0)&&peakIsl>islandW)warns.push(['warn',`โหลดช่วงจ่ายเองสูงสุด ${f(peakIsl/1000,2)} kW เกินกำลังขาออกของอินเวอร์เตอร์ ${f(islandW/1000,1)} kW ส่วนเกินจะถูกตัด`]);
  if(need&&bi&&bi.kwh*bi.maxC<peakIsl/1000*0.999)warns.push(['warn',`แบตจ่ายกำลังสูงสุดได้ราว ${f(bi.kwh*bi.maxC,1)} kW (${bi.maxC}C) น้อยกว่าโหลดสูงสุด`]);
  if(src.kwp>I.pvRec/1000)warns.push(['warn',`กำลังแผง ${f(src.kwp,2)} kWp เกินที่แนะนำสำหรับอินเวอร์เตอร์ ${I.pvRec/1000} kWp`]);
  $('#bkwarn').innerHTML=warns.map(w=>`<li><span class="b ${w[0]}">${w[0]==='err'?'×':'!'}</span><span>${esc(w[1])}</span></li>`).join('');

  /* verdict */
  const outTxt=(BK.mode!=='off'&&BK.outDur>0)?`${hhmm(BK.outStart)}–${hhmm((BK.outStart+BK.outDur)%24)} (${BK.outDur} ชม.)`:'';
  let lvl='ok',vt='';
  const unmetShow=BK.mode==='off'?T.unmet:T.unmetOut;
  if(BK.mode==='off'||BK.outDur>0){
    const loss=unmetShow>0.005;
    lvl=loss?(unmetShow/Math.max(T.loadOut||T.load,1e-9)>0.2?'err':'warn'):'ok';
    vt=BK.mode==='off'
      ?(loss?`Off-grid: ไฟไม่พอ ขาด ${f(T.unmet,2)} kWh (${f(T.unmetH,1)} ชม.) ใน 1 วัน`:'Off-grid: ไฟพอใช้ทั้งวันตามโหลดที่ตั้งไว้')
      :(loss?`ช่วงไฟดับ ${outTxt}: ไฟไม่พอ ขาด ${f(T.unmetOut,2)} kWh (${f(T.unmetH,1)} ชม.)`:`ช่วงไฟดับ ${outTxt}: ไฟพอใช้ตามโหลดที่เลือก`);
  }else vt='ไม่มีไฟดับในวันนี้ ดูการใช้พลังงานปกติ';
  const vEl=$('#bkverdict');vEl.className='verdict '+lvl;
  vEl.innerHTML=`<span class="pill ${lvl}">${LABEL[lvl]}</span><b>${esc(vt)}</b>`;

  /* metrics */
  const selfS=T.load>0?(T.direct+T.fromBat)/T.load*100:0;
  const avgIsl=((BK.island==='crit'?LP.crit:LP.all).reduce((a,b)=>a+b,0)/LP.n)/1000;
  const autonomy=bi&&avgIsl>0?bi.usable*bi.rt**0.5/avgIsl:null;
  const mx=[
    ['ผลิตจากแผง',f(T.pv,1)+' kWh',`${src.label} · ${f(src.kwp,2)} kWp`],
    ['ใช้ไฟจากแผงโดยตรง',f(T.direct,1)+' kWh',`พึ่งพาตนเอง ${f(selfS,0)} % ของโหลด`]
  ];
  if(BK.mode!=='grid')mx.push(['ชาร์จเข้าแบต',f(T.toBat,1)+' kWh',`จ่ายออกจากแบต ${f(T.fromBat,1)} kWh`],['SOC ต่ำสุด / สิ้นวัน',f(R.socMin,0)+' / '+f(R.socEnd,0)+' %',`ขั้นต่ำที่ใช้ได้ ${f(R.Emin/R.cap*100,0)} %`]);
  if(BK.mode!=='off')mx.push(['ซื้อไฟจากกริด',f(T.imp,1)+' kWh',`ขายคืนกริด ${f(T.exp,1)} kWh`]);
  mx.push(['ไฟขาด (ไม่มีไฟใช้)',f(T.unmet,2)+' kWh',`${f(T.unmetH,1)} ชม.`+(T.curt>0.01?` · ไฟแผงเหลือทิ้ง ${f(T.curt,1)} kWh`:'')]);
  if(autonomy!=null&&(BK.mode!=='grid'))mx.push(['แบตเต็มอยู่ได้ (ไม่มีแดด)',f(autonomy,1)+' ชม.',`โหลดเฉลี่ย ${f(avgIsl,2)} kW · ${BK.island==='crit'?'เฉพาะโหลดสำคัญ':'โหลดทั้งหมด'}`]);
  $('#bkmx').innerHTML=mx.map(m=>`<div class="metric"><div class="k">${m[0]}</div><div class="v">${m[1]}</div><div class="s">${m[2]}</div></div>`).join('');
  $('#bklim').textContent=need&&bi?`ขีดจำกัดที่ใช้คำนวณ: ชาร์จสูงสุด ${f(chgKw,1)} kW · จ่ายสูงสุด ${f(disKw,1)} kW · ประสิทธิภาพรอบ ${f(bi.rt*100,0)} % · กำลังขาออกช่วงจ่ายเอง ${f(islandW/1000,1)} kW`:'';

  /* charts */
  const x=R.pv.map((_,i)=>(i+.5)*5/60),kw=a=>a.map(v=>v/1000);
  const vb=[];
  if(BK.mode!=='off'&&BK.outDur>0){
    const s=BK.outStart%24,e=s+BK.outDur;
    if(e<=24)vb.push([s,e]);else vb.push([s,24],[0,e-24]);
  }
  const yTop=Math.max(Math.max(...R.pv),Math.max(...R.load),1)/1000*1.1;
  const s1=[{short:'กำลังจากแผง',color:'var(--s1)',vals:kw(R.pv),area:true,fmt:v=>f(v,2)},{short:'โหลดที่ต้องการ',color:'var(--s2)',vals:kw(R.load),fmt:v=>f(v,2)}];
  if(BK.mode!=='off')s1.push({short:'ซื้อจากกริด',color:'var(--s3)',vals:kw(R.imp),fmt:v=>f(v,2)});
  if(T.unmet>0.005)s1.push({short:'ส่วนที่ไฟไม่พอ',color:'var(--err)',vals:kw(R.unmet),fmt:v=>f(v,2)});
  bkCfg={A:{x,xmin:0,xmax:24,ymax:yTop,unit:'kW',aria:'กราฟกำลังจากแผง โหลด และไฟจากกริดตลอดวัน',vb,vbl:'ไฟดับ',series:s1}};
  if(BK.mode!=='grid')bkCfg.B={x,xmin:0,xmax:24,ymax:100,unit:'%',aria:'กราฟสถานะประจุแบต SOC ตลอดวัน',vb,vbl:'ไฟดับ',
    refs:[{y:R.Emin/R.cap*100,label:`SOC ขั้นต่ำ ${f(R.Emin/R.cap*100,0)}%`}],series:[{short:'SOC แบต',color:'var(--s3)',vals:R.soc,area:true,fmt:v=>f(v,0)}]};
  else bkCfg.B=null;
  $('#bkleg1').innerHTML=s1.map(se=>`<span class="lg"><i class="lk" style="background:${se.color}"></i>${se.short}</span>`).join('')+(vb.length?'<span class="lg"><i class="lb" style="background:var(--warnbg)"></i>ช่วงไฟดับ</span>':'');
  $('#bkcard2').hidden=!bkCfg.B;
  drawBackup();
}
function drawBackup(){
  if(!bkCfg)return;
  if($('#chK1').clientWidth)drawLine($('#chK1'),bkCfg.A);
  if(bkCfg.B&&$('#chK2').clientWidth)drawLine($('#chK2'),bkCfg.B);
}
function bkSync(){
  document.querySelectorAll('#bkmode [data-bm]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.bm===BK.mode)));
  $('#bksrc').value=BK.src;$('#bkn').value=BK.nIdeal;$('#bknwrap').hidden=BK.src!=='ideal';
  $('#bkos').value=hhmm(BK.outStart);$('#bkod').value=BK.outDur;$('#bkis').value=BK.island;$('#bksoc').value=BK.soc0;
  $('#bkoutbox').hidden=BK.mode==='off';$('#bkoutbox2').hidden=BK.mode==='off';$('#bksocbox').hidden=BK.mode==='grid';
  $('#bkmodenote').textContent={
    grid:'ใช้แผงจ่ายโหลดและขายส่วนเกินคืนกริด ไม่มีแบต เมื่อกริดดับอินเวอร์เตอร์ต้องหยุดจ่ายไฟ',
    hybrid:'แผงจ่ายโหลดก่อน ส่วนเกินชาร์จแบต แล้วค่อยขายคืนกริด ตอนไฟดับแบตและแผงจ่ายโหลดที่เลือกต่อเอง',
    off:'ไม่ต่อกริด แผงและแบตต้องจ่ายโหลดทั้งหมดเอง ไฟส่วนที่ขาดคือโหลดที่ไม่มีไฟใช้'
  }[BK.mode];
}
function initBackup(){
  $('#bkmode').addEventListener('click',e=>{const b=e.target.closest('[data-bm]');if(!b)return;BK.mode=b.dataset.bm;bkSync();backupRun();if(typeof touch==='function')touch()});
  const num=(id,key,lo,hi)=>$('#'+id).addEventListener('input',e=>{const n=parseFloat(e.target.value);if(isNaN(n))return;BK[key]=Math.max(lo,Math.min(hi,n));backupRun();if(typeof touch==='function')touch()});
  num('bkn','nIdeal',1,200);num('bkod','outDur',0,24);num('bksoc','soc0',0,100);
  $('#bkos').addEventListener('input',e=>{const h=parseHM(e.target.value);if(isNaN(h))return;BK.outStart=h;backupRun();if(typeof touch==='function')touch()});
  $('#bksrc').addEventListener('change',e=>{BK.src=e.target.value;bkSync();backupRun();if(typeof touch==='function')touch()});
  $('#bkis').addEventListener('change',e=>{BK.island=e.target.value;backupRun();if(typeof touch==='function')touch()});
  bkSync();
}
