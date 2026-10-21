/* ---- backup simulation: on-grid / hybrid / off-grid, 5-minute energy balance ---- */
const BK={exp:'full',expW:1000,meter:'auto',mode:'hybrid',src:'ideal',nIdeal:9,outStart:18,outDur:6,outKeep:6,island:'crit',soc0:50,micOff:[]};
/* micro channels used in this menu: ideal source = not marked 'ไม่ต่อแผง'; wiring source = channel wired OK in menu 02 */
function bkMicOn(k){if(BK.src!=='ideal')return!!(typeof lastA!=='undefined'&&lastA&&lastA.res&&lastA.res[k-1]&&lastA.res[k-1].status==='ok');return!(BK.micOff||[]).includes(k)}
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
    const gridUp=!island,gm=cfg.gmode||'selfuse';
    const floorE=bat?(gridUp?Math.max(Emin,cap*(gm==='backup'?100:(cfg.reserve||0))/100):Emin):0;
    const batIdle=gridUp&&gm==='feedin';
    if(cfg.mode==='grid'){
      if(outage){curt=p;p=0;unmet=ld;ld=0}
      else{direct=Math.min(p,ld);exp=p-direct;imp=ld-direct;if(cfg.expLimW!=null&&exp>cfg.expLimW){curt=exp-cfg.expLimW;exp=cfg.expLimW}}
    }else if(outage&&cfg.noBackup){curt=p;unmet=ld;ld=0;p=0}
    else{
      if(island&&ld>cfg.islandW){unmet+=ld-cfg.islandW;ld=cfg.islandW}
      direct=Math.min(p,ld);
      let sur=(p-direct)*dt/1000,def=(ld-direct)*dt/1000;
      if(sur>0&&bat&&!batIdle){
        const c=Math.min(sur,chgMax*dt,(cap-E)/eta);
        E+=c*eta;toB=c;sur-=c;
      }
      if(sur>1e-12){if(island)curt=sur*1000/dt;else{exp=sur*1000/dt;if(cfg.expLimW!=null&&exp>cfg.expLimW){curt=exp-cfg.expLimW;exp=cfg.expLimW}}}
      let fromBkWh=0;
      if(def>0&&bat&&!batIdle){
        const d=Math.min(def,disMax*dt,Math.max(0,E-floorE)*eta);
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

function bkSource(noEv){
  /* returns {pv:[W per 5-min], label, kwp, err} using the same site/orientation as the panel tab */
  const I=curInv();
  if(BK.src==='ideal'&&isMicro(I)){
    /* micro: one panel per input, each input its own module (shared with menu 02), × number of units */
    const nm=Math.max(1,Math.min(4,Math.round(+I.nmppt||4))),blocks=[...Array(nm)].map((_,j)=>bkMicOn(j+1)?{n:1,ns:1,mp:1,pv:mpPV(j+1)}:null),nOn=blocks.filter(Boolean).length;
    if(!nOn)return{err:'ไมโครอินเวอร์เตอร์ยังไม่ได้ต่อแผงเลย เลือกแผงอย่างน้อย 1 ช่อง'};
    const R=simDay(blocks,I,SIM.tilt,SIM.az,5,false,noEv),U=microU(I),kw=blocks.reduce((a,b)=>a+(b?b.pv.pmax:0),0)*U/1000;
    return{pv:R.pac,label:`ไมโคร 1 ตัว · ต่อแผง ${nOn}/${nm} ช่อง (${blocks.map(b=>b?b.pv.pmax+' W':'ว่าง').join(' / ')})`,kwp:kw,E:R.E};
  }
  if(BK.src==='ideal'){
    const N=Math.max(1,BK.nIdeal|0);
    const R=simDay([{n:N,ns:N,mp:1}],I,SIM.tilt,SIM.az,5,true,noEv);
    return{pv:R.pac,label:`แผงสมมติ ${N} แผง`,kwp:N*PV.pmax/1000,E:R.E};
  }
  if(!lastA)return{err:'ยังไม่มีผลการต่อสาย'};
  const blocks=lastA.res.map(r=>r.status==='ok'?r.blk:null);
  if(!blocks.some(Boolean))return{err:'ยังไม่ได้ต่อสายแผงเข้า MPPT ให้ถูกต้อง ไปแท็บ "ต่อสาย" หรือเลือกแหล่งไฟเป็นแผงสมมติ'};
  const R=simDay(blocks,I,SIM.tilt,SIM.az,5,false,noEv);
  const U=microU(I),nUsed=blocks.reduce((a,b)=>a+(b?b.n:0),0)*U;
  return{pv:R.pac,label:`ตามที่ต่อสายไว้ ${nUsed} แผง${U>1?` (ไมโคร ${U} ตัว)`:''}`,kwp:blocks.reduce((a,b)=>a+(b?b.n*(b.pv||PV).pmax:0),0)/1000*U,E:R.E};
}

let bkCfg=null;
/* the system type follows the chosen inverter: an on-grid inverter has no battery port and stops when the grid is down */
function bkModes(I){const t=I&&I.type;return t==='on-grid'?['grid']:t==='off-grid'?['off']:['grid','hybrid','off']}
/* BK.want = the type the student picked; a hybrid inverter brings it back after an on-grid one forced 'grid' */
function bkFit(){const ok=bkModes(curInv());if(!BK.want)BK.want=BK.mode;BK.mode=ok.includes(BK.want)?BK.want:ok.includes('hybrid')?'hybrid':ok[0];return ok}
function backupRun(){
  if(!$('#bkmx'))return;
  bkFit();bkSync();
  const msg=$('#bkmsg'),body=$('#bkbody'),I=curInv(),bi=bankInfo();
  $('#bkverdict').hidden=true;window.lastBK=null;window.lastBal=null;
  const src=bkSource();
  const need=BK.mode!=='grid';
  const warns=[];
  if(src.err){msg.hidden=false;msg.textContent=src.err;body.hidden=true;return}
  if(need&&!bi){msg.hidden=false;msg.textContent='ยังไม่มีรุ่นแบตเตอรี่ในแคตตาล็อก เพิ่มที่แท็บ "อุปกรณ์"';body.hidden=true;return}
  msg.hidden=true;body.hidden=false;$('#bkverdict').hidden=false;
  const LP=loadProfile(5);
  if(!LOADS.length||Math.max(...LP.all)<=0){msg.hidden=false;msg.textContent='ยังไม่มีโหลด ไปแท็บ "จำลองโหลด" เพื่อใส่รายการ';body.hidden=true;$('#bkverdict').hidden=true;return}
  const chgKw=bi?Math.min(I.bchg>0?I.bchg:I.pac/1000,bi.chgKw):0;
  const disKw=bi?Math.min(I.bdis>0?I.bdis:I.pac/1000,bi.disKw):0;
  const islandW=Math.min(I.pac,(I.backupKw>0?I.backupKw:I.pac/1000)*1000);
  const cfg={mode:BK.mode,bank:need?bi:null,chgKw,disKw,islandW,soc0:BK.soc0,outStart:BK.outStart,outDur:BK.outDur,island:BK.island,step:5};
  const ax=(typeof acsCfg==='function')?acsCfg():null;
  if(ax)Object.assign(cfg,{reserve:ax.reserve,gmode:ax.gmode,noBackup:ax.noBackup,expLimW:ax.expLimW});
  /* export setting of this menu (used unless menu 03 results are applied with their own export limit) */
  BK_EXPSRC=ax&&ax.expLimW!=null?'ac':BK.exp!=='full'&&BK.mode!=='off'?'bk':'';
  const MOK=bkMeterOk(I);
  if(BK_EXPSRC==='bk'&&MOK.ok)cfg.expLimW=BK.exp==='zero'?0:BK.expW;
  const R=balance(src.pv,LP.all,LP.crit,cfg);
  window.lastBal={R,LP,step:5,mode:BK.mode,island:BK.island,cfg};
  const T=R.T;

  /* warnings */
  if(false)warns.push(['err',`อินเวอร์เตอร์ ${I.name} เป็นแบบ On-grid ต่อแบตไม่ได้ ผลด้านล่างจำลองเหมือนมีแบตเพื่อดูแนวทางเท่านั้น เลือกรุ่น Hybrid หรือ Off-grid ที่แท็บ "อุปกรณ์"`]);
  if(need&&bi&&I.type!=='on-grid'&&I.bvMax&&(bi.V<I.bvMin||bi.V>I.bvMax))warns.push(['err',`แรงดันชุดแบต ${f(bi.V,1)} V อยู่นอกช่วงที่อินเวอร์เตอร์รับ ${I.bvMin}–${I.bvMax} V ปรับจำนวนต่ออนุกรมที่แท็บ "อุปกรณ์"`]);
  if(need&&bi&&I.type!=='on-grid'&&!batCompat(bi.b,I))warns.push(['err',batCompatMsg(bi.b,I)]);
  if(BK_SWAP)warns.push(['warn',BK_SWAP]);
  if(need&&bi&&String(I.brand).toLowerCase()==='deye'&&!isMicro(I)&&bi.b.brand!=='ตัวอย่าง'&&!deyeApproved(bi.b))warns.push(['warn',`แบต ${bi.b.brand} ไม่อยู่ในรายชื่อแบตที่ Deye รับรอง (DY-LV48-0109) ใช้สื่อสาร BMS แบบลิเธียมไม่ได้ ต้องตั้งเป็นโหมดแรงดัน/ตะกั่วกรด หรือยืนยันกับผู้ขายแบตก่อน`]);
  if(BK_EXPSRC==='bk'&&!MOK.ok)warns.push(['err',MOK.msg]);
  if(MOK.M&&BK.exp!=='full'&&BK.mode!=='off'){
    if(!isPh3(I)&&MOK.M.ph==='3')warns.push(['warn',`${MOK.M.name} เป็นมิเตอร์ 3 เฟส ใช้กับอินเวอร์เตอร์ 1 เฟสได้เมื่อบ้านใช้ไฟ 3 เฟส ถ้าบ้านใช้ไฟ 1 เฟส ใช้ DDSU666-H จะเหมาะกว่า`]);
    const pk=Math.max(...LP.all),ia=pk/230/(isPh3(I)?3:1);
    if(ia>MOK.M.imax)warns.push(['warn',`กระแสโหลดสูงสุดประมาณ ${f(ia,0)} A ต่อเฟส เกินช่วงวัดของ ${MOK.M.name} (${MOK.M.imax} A) ${MOK.M.imax<250&&isPh3(I)?'ควรใช้ DTSU666-H 250A':''}`]);}
  if(BK_EXPSRC==='ac'&&BK.exp!=='full')warns.push(['warn',`ใช้ค่า Export limit ${cfg.expLimW} W จากเมนู 03 ต่อสาย AC (ติ๊ก "นำผลการต่อสายไปใช้" ไว้) แทนค่าที่เลือกในหน้านี้`]);
  if(cfg.expLimW!=null&&T.curt>0.05&&BK.mode!=='off')warns.push(['warn',`${cfg.expLimW===0?'Zero export':'จำกัดการขาย '+cfg.expLimW+' W'}: อินเวอร์เตอร์ลดกำลังแผงลง ไฟที่ผลิตได้แต่ไม่ได้ใช้ ${f(T.curt,1)} kWh/วัน ${BK.mode==='grid'?'(ไม่มีแบตเก็บ ควรย้ายโหลดมาใช้กลางวัน)':'(แบตเต็มแล้ว)'}`]);
  if(BK.mode==='grid'&&BK.outDur>0)warns.push(['warn','อินเวอร์เตอร์ On-grid จะตัดการจ่ายไฟทันทีเมื่อกริดดับ (anti-islanding) แม้มีแดด ช่วงไฟดับจึงไม่มีไฟใช้']);
  const peakIsl=Math.max(...(BK.island==='crit'?LP.crit:LP.all));
  if(need&&(BK.mode==='off'||BK.outDur>0)&&peakIsl>islandW)warns.push(['warn',`โหลดช่วงจ่ายเองสูงสุด ${f(peakIsl/1000,2)} kW เกินกำลังขาออกของอินเวอร์เตอร์ ${f(islandW/1000,1)} kW ส่วนเกินจะถูกตัด`]);
  if(need&&bi&&bi.disKw<peakIsl/1000*0.999)warns.push(['warn',`แบตจ่ายกำลังสูงสุดได้ราว ${f(bi.disKw,1)} kW (${f(bi.disA,0)} A) น้อยกว่าโหลดสูงสุด`]);
  if(src.kwp>I.pvRec/1000)warns.push(['warn',`กำลังแผง ${f(src.kwp,2)} kWp เกินที่แนะนำสำหรับอินเวอร์เตอร์ ${I.pvRec/1000} kWp`]);
  if(ax)ax.notes.forEach(n=>warns.push(n));
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
  window.lastBK={mode:BK.mode,lvl,vt,pv:T.pv,load:T.load,self:selfS,unmet:BK.mode==='off'?T.unmet:T.unmetOut};
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
  bkPeriods(R,bi);
  $('#bkmx').innerHTML=mx.map(m=>`<div class="metric"><div class="k">${m[0]}</div><div class="v">${m[1]}</div><div class="s">${m[2]}</div></div>`).join('');
  $('#bklim').textContent=!need?'โหมด On-grid ไม่ใช้แบตในการคำนวณ (รายการแบตแสดงเฉพาะรุ่นที่ต่อกับอินเวอร์เตอร์นี้ได้: ยี่ห้อและแรงดันตรงกัน)':need&&bi?`ขีดจำกัดที่ใช้คำนวณ: ชาร์จสูงสุด ${f(chgKw,1)} kW · จ่ายสูงสุด ${f(disKw,1)} kW · ประสิทธิภาพรอบ ${f(bi.rt*100,0)} % · กำลังขาออกช่วงจ่ายเอง ${f(islandW/1000,1)} kW`:'';

  /* charts */
  const x=R.pv.map((_,i)=>(i+.5)*5/60),kw=a=>a.map(v=>v/1000);
  const vb=[];
  if(BK.mode!=='off'&&BK.outDur>0){
    const s=BK.outStart%24,e=s+BK.outDur;
    if(e<=24)vb.push([s,e]);else vb.push([s,24],[0,e-24]);
  }
  const yTop=Math.max(Math.max(...R.pv),Math.max(...R.load),1)/1000*1.1;
  const used=R.pv.map((v,i)=>Math.max(0,v-R.curt[i]));
  const s1=[{short:T.curt>0.005?'กำลังจากแผงที่ใช้ได้':'กำลังจากแผง',color:'var(--s1)',vals:kw(used),area:true,fmt:v=>f(v,2)},{short:'โหลดที่ต้องการ',color:'var(--s2)',vals:kw(R.load),fmt:v=>f(v,2)}];
  if(BK.mode!=='off')s1.push({short:'ซื้อจากกริด',color:'var(--s3)',vals:kw(R.imp),fmt:v=>f(v,2)});
  if(T.curt>0.005)s1.push({short:BK.mode==='grid'?'แดดมีแต่ไม่ได้จ่าย (หยุด/จำกัดขาย)':'ไฟแผงเหลือทิ้ง',color:'var(--muted)',vals:kw(R.curt),fmt:v=>f(v,2)});
  if(T.unmet>0.005)s1.push({short:'ส่วนที่ไฟไม่พอ',color:'var(--err)',vals:kw(R.unmet),fmt:v=>f(v,2)});
  bkCfg={A:{x,xmin:0,xmax:24,ymax:yTop,unit:'kW',aria:'กราฟกำลังจากแผง โหลด และไฟจากกริดตลอดวัน',vb,vbl:'ไฟดับ',series:s1}};
  if(BK.mode!=='grid')bkCfg.B={x,xmin:0,xmax:24,ymax:100,unit:'%',aria:'กราฟสถานะประจุแบต SOC ตลอดวัน',vb,vbl:'ไฟดับ',
    refs:[{y:R.Emin/R.cap*100,label:`SOC ขั้นต่ำ ${f(R.Emin/R.cap*100,0)}%`}],series:[{short:'SOC แบต',color:'var(--s3)',vals:R.soc,area:true,fmt:v=>f(v,0)}]};
  else bkCfg.B=null;
  bkCfg.A.leg='bkleg1';
  $('#bkleg1').innerHTML=legHTML('bkleg1',s1,(vb.length?'<span class="lg"><i class="lb" style="background:var(--warnbg)"></i>ช่วงไฟดับ</span>':''),drawBackup);
  $('#bkcard2').hidden=!bkCfg.B;
  drawBackup();
  if(typeof bkAnimUpdate==='function')bkAnimUpdate();
  if(typeof acRender==='function'&&typeof AC_MODE!=='undefined'&&AC_MODE&&AC_MODE!=='1')acRender();
}
/* normal hours vs outage hours: where the energy came from in each part of the day */
function bkPeriods(R,bi){
  const el=$('#bkper');if(!el)return;
  if(BK.mode==='off'){el.innerHTML='';return}
  const dt=5/60,k=dt/1000,P=[0,1].map(()=>({h:0,load:0,pv:0,direct:0,fromBat:0,toBat:0,imp:0,exp:0,unmet:0,curt:0}));
  R.pv.forEach((_,i)=>{const p=P[R.outage[i]?1:0];p.h+=dt;p.load+=R.load[i]*k;p.pv+=(R.pv[i]-R.curt[i])*k;p.direct+=R.direct[i]*k;p.fromBat+=R.fromBat[i]*k;p.toBat+=R.toBat[i]*k;p.imp+=R.imp[i]*k;p.exp+=R.exp[i]*k;p.unmet+=R.unmet[i]*k;p.curt+=R.curt[i]*k});
  const on=BK.outDur>0,bat=BK.mode!=='grid'&&bi,cov=p=>p.load>1e-6?Math.min(100,(1-p.unmet/p.load)*100):100;
  /* SOC when the outage starts and ends */
  /* SOC through each outage block (a block that crosses midnight is shown as two parts of the simulated day) */
  let socTxt='';
  if(on&&bat){const n=R.outage.length,seg=[];let i=0;
    while(i<n){if(!R.outage[i]){i++;continue}let j=i;while(j<n&&R.outage[j])j++;seg.push([i,j]);i=j}
    socTxt=seg.map(([a,b])=>`${hhmm(a*5/60)} ${f(a>0?R.soc[a-1]:BK.soc0,0)} % → ${b>=n?'24:00':hhmm(b*5/60)} ${f(R.soc[b-1],0)} %`).join(' · ')}
  const row=(nm,a,b,u)=>`<tr><td>${nm}</td><td>${a}</td>${on?`<td>${b}</td>`:''}</tr>`,v=x=>f(x,2)+' kWh',N=P[0],O=P[1];
  let h=`<table class="t bkper"><thead><tr><th>ช่วงเวลา</th><th>ปกติ (กริดมีไฟ)</th>${on?'<th class="out">ไฟดับ</th>':''}</tr></thead><tbody>`
    +row('ระยะเวลา',f(N.h,1)+' ชม.',f(O.h,1)+' ชม.')
    +row('โหลดที่ต้องจ่าย',v(N.load)+' <small>(ทั้งหมด)</small>',v(O.load)+` <small>(${BK.island==='crit'?'เฉพาะโหลดสำคัญ':'ทั้งหมด'})</small>`)
    +row('จากแผงตรง',v(N.direct),v(O.direct))
    +(bat?row('จากแบต',v(N.fromBat),v(O.fromBat))+row('ชาร์จเข้าแบต',v(N.toBat),v(O.toBat)):'')
    +row('ซื้อจากกริด',v(N.imp),on?'— <small>(กริดดับ)</small>':'')
    +row('ขายคืนกริด',v(N.exp),on?'—':'')
    +row('ไฟแผงเหลือทิ้ง',v(N.curt),v(O.curt))
    +row('ไฟขาด',v(N.unmet),`<b class="${O.unmet>0.005?'bad':''}">${v(O.unmet)}</b>`)
    +row('จ่ายโหลดได้',f(cov(N),0)+' %',`<b>${f(cov(O),0)} %</b>`)
    +(socTxt?row('SOC แบต ช่วงไฟดับ','—',socTxt):'')
    +'</tbody></table>';
  if(on&&bat&&BK.outStart+BK.outDur>24)h+=`<p class="hint tight">ไฟดับข้ามเที่ยงคืน: จำลอง 1 วัน (00:00–24:00) ช่วง 00:00–${hhmm((BK.outStart+BK.outDur)%24)} จึงเริ่มจาก SOC ตั้งต้น ${BK.soc0} % ที่ตั้งไว้ด้านบน</p>`;
  if(on&&BK.mode==='grid')h+='<p class="hint tight">On-grid ไม่มีแบตและหยุดจ่ายไฟทันทีเมื่อกริดดับ (anti-islanding) โหลดช่วงไฟดับจึงไม่มีไฟใช้ทั้งหมด แม้มีแดด</p>';
  else if(on&&bat&&O.unmet>0.005){const need=O.unmet+(s1!=null?0:0);h+=`<p class="hint tight">ช่วงไฟดับขาดไฟ ${f(O.unmet,2)} kWh: เพิ่มแบตอีกประมาณ ${f(O.unmet/((bi.b.dod||90)/100)/Math.sqrt(bi.rt),1)} kWh ตั้ง SOC สำรอง (reserve) ให้สูงขึ้นก่อนไฟดับ หรือลดโหลดช่วงไฟดับ</p>`}
  el.innerHTML=h;
}
function drawBackup(){
  if(!bkCfg)return;
  if($('#chK1').clientWidth)drawLine($('#chK1'),bkCfg.A);
  if(bkCfg.B&&$('#chK2').clientWidth)drawLine($('#chK2'),bkCfg.B);
  if(typeof bkaCursor==='function')bkaCursor();
}
/* a system type the current inverter cannot run: pick the closest inverter that can (same brand and phase first, then nearest power) */
let BK_SWAP='';
function bkSwapInv(I,m){
  const ok=x=>bkModes(Object.assign({},x)).includes(m);
  const sc=x=>(String(x.brand)===String(I.brand)?0:1e6)+(String(x.phase||'1')===String(I.phase||'1')?0:1e5)+Math.abs((+x.pac||0)-(+I.pac||0));
  return CAT.inverters.filter(ok).sort((a,b)=>sc(a)-sc(b))[0]||null;
}
let BK_EXPSRC='';
/* Huawei Smart Power Sensor, datasheet 06.2025 (Drive: 01 อินเวอร์เตอร์/Huawei) */
const HW_METERS={
  ddsu:{name:'DDSU666-H',ph:'1',imax:100,ct:'CT 100 A/40 mA ×1',grid:'1P2W'},
  dtsu:{name:'DTSU666-H',ph:'3',imax:100,ct:'CT 100 A/40 mA ×3',grid:'3P3W/3P4W'},
  dtsu250:{name:'DTSU666-H 250A',ph:'3',imax:250,ct:'CT 250 A/50 mA ×3',grid:'3P3W/3P4W'}};
const isHw=I=>String((I||{}).brand||'').toLowerCase()==='huawei';
/* meter actually used: 'auto' picks the one that matches the inverter phase */
function bkMeter(I){if(!isHw(I))return null;const m=BK.meter;if(m==='none')return'none';if(HW_METERS[m])return m;return isPh3(I)?'dtsu':'ddsu'}
/* can this Huawei inverter limit export with the chosen meter? */
function bkMeterOk(I){const m=bkMeter(I);if(m===null)return{ok:true};
  if(m==='none')return{ok:false,msg:'ไม่ได้ติดตั้ง Smart Power Sensor: อินเวอร์เตอร์ Huawei วัดไฟที่จุดต่อกริดไม่ได้ จึงทำ Zero export / จำกัดการขายไม่ได้ ไฟเหลือไหลออกกริดทั้งหมด (ผลด้านล่างคิดแบบขายได้ไม่จำกัด)'};
  const M=HW_METERS[m];
  if(isPh3(I)&&M.ph==='1')return{ok:false,msg:`${M.name} เป็นมิเตอร์ 1 เฟส (${M.grid}) ใช้กับอินเวอร์เตอร์ 3 เฟส ${I.name} ไม่ได้ วัดได้แค่เฟสเดียว Zero export จึงไม่ทำงาน ต้องใช้ DTSU666-H (ผลด้านล่างคิดแบบขายได้ไม่จำกัด)`};
  return{ok:true,M};}
/* how each brand names and wires export control (menu names can differ by model and firmware) */
function bkExpInfo(I){
  const b=String(I.brand||'').toLowerCase(),ph3=isPh3(I);
  if(b==='huawei')return{fn:'Active power control → Grid connection with zero power (Zero export) / Grid connection with limited power (kW) / Unlimited',
    where:'ตั้งในแอป FusionSolar หรือ SUN2000 App: Settings → Power adjustment',
    need:`ต้องมี Smart Power Sensor ${ph3?'DTSU666-H (3 เฟส)':'DDSU666-H (1 เฟส)'} ต่อ RS485 (485A/485B) ที่จุดต่อกริด และกำหนดทิศ CT ให้ถูก`};
  if(b==='solis')return{fn:'Export Power Set / Backflow Power: ON + ค่ากำลัง (W) · 0 W = Zero export',
    where:'ตั้งที่หน้าจออินเวอร์เตอร์: Advanced Settings → Export Power Set หรือในแอป SolisCloud',
    need:'ต้องเลือกชนิดเซนเซอร์ให้ตรงกับที่ติดตั้ง: CT ที่สาย L ด้านกริด หรือมิเตอร์ (เช่น Eastron / Acrel) ต่อ RS485 ลูกศร CT ชี้ไปทางกริด'};
  return{fn:'Export limit / Zero export (ชื่อเมนูต่างกันตามยี่ห้อ)',where:'ตั้งที่หน้าจออินเวอร์เตอร์หรือแอปของยี่ห้อ',need:'ต้องมี CT หรือมิเตอร์วัดกำลังที่จุดต่อกริด ไม่มีเซนเซอร์ = จำกัดการขายไม่ได้'};
}
function bkSync(){
  const ok=bkModes(curInv());
  /* on-grid: no battery and no islanded loads, so those inputs are shown as not used */
  const kb=$('#kbat'),is=$('#bkis'),g=BK.mode==='grid';
  if(kb&&!isMicro())kb.title=g?'โหมด On-grid ไม่ใช้แบตในการคำนวณ เลือก Hybrid เพื่อจำลองแบต':'';
  if(is){is.disabled=g;is.title=g?'On-grid ไม่จ่ายไฟตอนไฟดับ':''}
  document.querySelectorAll('#bkmode [data-bm]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.bm===BK.mode));b.disabled=false;
    b.title=ok.includes(b.dataset.bm)?'':'กดแล้วจะเปลี่ยนอินเวอร์เตอร์เป็นรุ่นที่ใช้ระบบนี้ได้ (ยี่ห้อเดิม ขนาดใกล้เคียง)'});
  const mic=isMicro(curInv());
  $('#bksrc').value=BK.src;$('#bkn').value=BK.nIdeal;$('#bknwrap').hidden=BK.src!=='ideal'||mic;
  $('#bkmicbox').hidden=!(mic&&BK.src==='ideal');
  if(mic&&BK.src==='ideal'){const I=curInv(),nm=Math.max(1,Math.min(4,Math.round(+I.nmppt||4)));
    $('#bkmicsel').innerHTML=[...Array(nm)].map((_,j)=>{const k=j+1,off=!bkMicOn(k),cur=off?'none':MP_PM[k]||'';return`<label${off?' class="bkmicoff"':''}>PV${k}<select data-bkpv="${k}"><option value="none" ${off?'selected':''}>— ไม่ต่อแผง (ช่องว่าง) —</option><option value="" ${cur?'':'selected'}>แผงหลัก: ${esc(PV.name)} (${PV.pmax} W)</option>${CAT.panels.map(p=>`<option value="${esc(p.id)}" ${cur===p.id?'selected':''}>${esc((p.brand+' '+p.model).trim())}${/\d\s*W\)?$/.test(p.model)?'':` (${p.pmax} W)`}</option>`).join('')}</select></label>`}).join('');
    const W=[...Array(nm)].map((_,j)=>bkMicOn(j+1)?mpPV(j+1).pmax:0),sum=W.reduce((a,b)=>a+b,0),nOn=W.filter(w=>w>0).length,emp=[...Array(nm)].map((_,j)=>j+1).filter(k=>!bkMicOn(k));
    $('#bkmicinfo').textContent=(nOn?`ไมโคร 1 ตัว ต่อแผง ${nOn} จาก ${nm} ช่อง (ช่องละ 1 แผง) รวม ${f(sum/1000,2)} kWp · AC ${f(I.pac/1000,2)} kW · รุ่นแผงใช้ค่าเดียวกับเมนู 02`:'ยังไม่ได้ต่อแผงเลย เลือกแผงอย่างน้อย 1 ช่อง')
      +(emp.length&&nOn?` · ช่องว่าง PV${emp.join(', PV')}: ไม่ผลิตไฟ ช่องอื่นทำงานแยกกันตามปกติ (เก็บขั้ว DC ช่องว่างด้วยฝาปิดกันน้ำ)`:'')+(I.pvRec&&sum>I.pvRec?` · เกินกำลังแผงที่แนะนำ ${I.pvRec} W ต่อตัว`:'');}
  $('#bkos').value=hhmm(BK.outStart);$('#bkod').value=BK.outDur;$('#bkis').value=BK.island;$('#bksoc').value=BK.soc0;
  document.querySelectorAll('#bkexp [data-be]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.be===BK.exp)));
  $('#bkexpbox').hidden=BK.mode==='off';$('#bkexpwbox').hidden=BK.exp!=='limit';$('#bkexpw').value=BK.expW;
  {const I=curInv(),hw=isHw(I),mb=$('#bkmeterbox');mb.hidden=!hw||BK.mode==='off';
    if(hw){const ph3=isPh3(I),m=bkMeter(I);
      $('#bkmeter').innerHTML=`<option value="auto">อัตโนมัติ (${ph3?'DTSU666-H':'DDSU666-H'} ตามเฟสอินเวอร์เตอร์)</option>`+Object.entries(HW_METERS).map(([k,M])=>`<option value="${k}">${M.name} · ${M.ph==='1'?'1 เฟส':'3 เฟส'} · ${M.imax} A</option>`).join('')+'<option value="none">ไม่ติดตั้งมิเตอร์</option>';
      $('#bkmeter').value=BK.meter;const M=HW_METERS[m],ok=bkMeterOk(I);
      $('#bkmeterinfo').innerHTML=M?`${esc(M.name)}: ระบบไฟ ${M.grid} · วัด 0–${M.imax} A · ${esc(M.ct)} สาย 5 m · RS485 Modbus-RTU 9600 bps สาย 10 m · ±1 % (Class 1) · ติดราง DIN · กินไฟ ≤ 1 W${ok.ok?'':' · <b class="bad">ใช้กับอินเวอร์เตอร์รุ่นนี้ไม่ได้</b>'}`:'<b class="bad">ไม่มีมิเตอร์: ทำ Zero export / จำกัดการขายไม่ได้</b>';
      const t=document.getElementById('bkameter');if(t)t.textContent=M?M.name.slice(0,4):'kWh';}
    else{const t=document.getElementById('bkameter');if(t)t.textContent='kWh'}}
  {const x=bkExpInfo(curInv());$('#bkexpinfo').innerHTML=`<span class="bkbrand">${esc(curInv().brand||'')}</span> <b>ฟังก์ชัน:</b> ${esc(x.fn)}<br><b>ตั้งค่า:</b> ${esc(x.where)}<br><b>อุปกรณ์ที่ต้องมี:</b> ${esc(x.need)}<br><span class="muted">ชื่อเมนูอาจต่างตามรุ่นและเวอร์ชันเฟิร์มแวร์ ตรวจกับคู่มือของรุ่นที่ติดตั้งจริง</span>`+
    (BK.exp==='full'?'<br><span class="muted">ไม่จำกัด: ไฟเหลือขายคืนกริดได้ทั้งหมด (ต้องได้รับอนุญาตขนานไฟจากการไฟฟ้า)</span>':BK.exp==='zero'?'<br><span class="muted">Zero export: ไม่ให้ไฟไหลออกกริดเลย ใช้เมื่อไม่ได้ขออนุญาตขายไฟ ไฟเหลือที่แบตรับไม่ได้จะถูกลดกำลัง</span>':'')}
  {const on=BK.outDur>0;$('#bkoutwrap').hidden=BK.mode==='off';$('#bkoutset').hidden=!on;
    document.querySelectorAll('#bkout [data-bo]').forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.bo==='1')===on)));
    document.querySelectorAll('#bkodq [data-od]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.od===BK.outDur)));
    $('#bkoutinfo').textContent=!on?'ทั้งวันเป็นช่วงปกติ: กริดมีไฟตลอด ผลด้านล่างเป็นการใช้พลังงานปกติ (เลือก "มีไฟดับ" เพื่อดูว่าระบบจ่ายไฟได้แค่ไหนตอนกริดดับ)'
      :`ช่วงไฟดับ ${hhmm(BK.outStart)}–${hhmm((BK.outStart+BK.outDur)%24)}${BK.outStart+BK.outDur>24?' (ข้ามเที่ยงคืน วนไปช่วงต้นวัน)':''} · ช่วงปกติอีก ${f(24-BK.outDur,1)} ชม. · ตอนไฟดับจ่าย${BK.island==='crit'?'เฉพาะโหลดสำคัญ':'โหลดทั้งหมด'}${BK.mode==='grid'?' · On-grid หยุดจ่ายไฟทันที':''}`}$('#bksocbox').hidden=BK.mode==='grid';
  $('#bkmodenote').textContent={
    grid:'ใช้แผงจ่ายโหลดและขายส่วนเกินคืนกริด ไม่มีแบต เมื่อกริดดับอินเวอร์เตอร์ต้องหยุดจ่ายไฟ',
    hybrid:'แผงจ่ายโหลดก่อน ส่วนเกินชาร์จแบต แล้วค่อยขายคืนกริด ตอนไฟดับแบตและแผงจ่ายโหลดที่เลือกต่อเอง',
    off:'ไม่ต่อกริด แผงและแบตต้องจ่ายโหลดทั้งหมดเอง ไฟส่วนที่ขาดคือโหลดที่ไม่มีไฟใช้'
  }[BK.mode]+(ok.length===1?` · ล็อกตามอินเวอร์เตอร์ ${curInv().name} (${curInv().type})`:'');
}
function initBackup(){
  $('#bkmicsel').addEventListener('change',e=>{const s=e.target.closest('[data-bkpv]');if(!s)return;const k=+s.dataset.bkpv;BK.micOff=(BK.micOff||[]).filter(x=>x!==k);if(s.value==='none')BK.micOff.push(k);else if(s.value)MP_PM[k]=s.value;else delete MP_PM[k];bkSync();backupRun();if(typeof render==='function')render();if(typeof touch==='function')touch()});
  $('#bkexp').addEventListener('click',e=>{const b=e.target.closest('[data-be]');if(!b)return;BK.exp=b.dataset.be;bkSync();backupRun();if(typeof touch==='function')touch()});
  $('#bkmeter').addEventListener('change',e=>{BK.meter=e.target.value;bkSync();backupRun();if(typeof touch==='function')touch()});
  $('#bkexpw').addEventListener('input',e=>{const n=parseFloat(e.target.value);if(isNaN(n))return;BK.expW=Math.max(0,Math.min(20000,n));backupRun();if(typeof touch==='function')touch()});
  $('#bkmode').addEventListener('click',e=>{const b=e.target.closest('[data-bm]');if(!b)return;const m=b.dataset.bm;BK.mode=BK.want=m;
    const I=curInv();BK_SWAP='';
    if(!bkModes(I).includes(m)){const n=bkSwapInv(I,m);if(n){BK_SWAP=`เปลี่ยนอินเวอร์เตอร์จาก ${I.name} เป็น ${(n.brand+' '+n.model).trim()} เพราะระบบ ${m==='off'?'Off-grid':'Hybrid'} ต้องใช้อินเวอร์เตอร์ที่ต่อแบตได้`;ACT.inv=n.id;onCatalogChange()}}
    bkSync();backupRun();if(typeof touch==='function')touch()});
  const num=(id,key,lo,hi)=>$('#'+id).addEventListener('input',e=>{const n=parseFloat(e.target.value);if(isNaN(n))return;BK[key]=Math.max(lo,Math.min(hi,n));backupRun();if(typeof touch==='function')touch()});
  num('bkn','nIdeal',1,200);
  $('#bkod').addEventListener('input',e=>{const n=parseFloat(e.target.value);if(isNaN(n))return;BK.outDur=Math.max(.5,Math.min(24,n));BK.outKeep=BK.outDur;bkSync();backupRun();if(typeof touch==='function')touch()});
  $('#bkout').addEventListener('click',e=>{const b=e.target.closest('[data-bo]');if(!b)return;if(b.dataset.bo==='1'){BK.outDur=BK.outKeep>0?BK.outKeep:4}else{if(BK.outDur>0)BK.outKeep=BK.outDur;BK.outDur=0}bkSync();backupRun();if(typeof touch==='function')touch()});
  $('#bkodq').addEventListener('click',e=>{const b=e.target.closest('[data-od]');if(!b)return;BK.outDur=BK.outKeep=+b.dataset.od;bkSync();backupRun();if(typeof touch==='function')touch()});num('bksoc','soc0',0,100);
  $('#bkos').addEventListener('input',e=>{const h=parseHM(e.target.value);if(isNaN(h))return;BK.outStart=h;bkSync();backupRun();if(typeof touch==='function')touch()});
  $('#bksrc').addEventListener('change',e=>{BK.src=e.target.value;bkSync();backupRun();if(typeof touch==='function')touch()});
  $('#bkis').addEventListener('change',e=>{BK.island=e.target.value;backupRun();if(typeof touch==='function')touch()});
  bkSync();
}
