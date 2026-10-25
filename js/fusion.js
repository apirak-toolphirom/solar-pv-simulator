/* ---- จำลองแอป FusionSolar (Huawei SUN2000) — แสดงข้อมูลจากแบบจำลองในเว็บนี้ เพื่อฝึกอ่านหน้าจอและ alarm โดยไม่ต้องมีเครื่องจริง ---- */
const FU={startAt:null,page:'mon',mode:'ramp',m:720,play:false,fault:'none',f0:11,f1:13,tariff:4.2,base:12500,view:'day'};
const FU_FAULTS=[['none','ปกติ (ไม่มีฟอลต์)'],['gridov','ไฟกริดสูงเกิน (Grid Overvoltage)'],['griduv','ไฟกริดต่ำเกิน (Grid Undervoltage)'],['gridf','ความถี่กริดผิดปกติ'],['insul','ความต้านทานฉนวนต่ำ (Low Insulation Resistance)'],['arc','DC Arc Fault (AFCI)'],['rev','ขั้วสตริง PV1 กลับด้าน'],['temp','อุณหภูมิสูง ลดกำลัง (Derating)'],['dongle','Smart Dongle ขาดการเชื่อมต่อคลาวด์']];
const FU_IC={none:['✅','ปกติ'],gridov:['⚡↑','แรงดันกริดสูง'],griduv:['⚡↓','แรงดันกริดต่ำ'],gridf:['〰️','ความถี่ผิดปกติ'],insul:['🛡️','ฉนวนต่ำ'],arc:['🔥','DC Arc'],rev:['🔁','ขั้วกลับ'],temp:['🌡️','ร้อนเกิน'],dongle:['📡','ดองเกิลหลุด']};
const FU_AL={
  gridov:{n:'Grid Overvoltage',lv:'Major',cause:'แรงดันกริดสูงเกินค่า Level-1/Level-2 OV protection threshold ที่ตั้งในหน้า Configuration (เครื่องตัวอย่างตั้ง 264 V) มักเกิดจากสาย AC เล็ก/ยาวเกิน หรือแรงดันหม้อแปลงสูง ตอนที่แผงเพิ่งผลิตเยอะ',fix:'วัดแรงดันที่ขั้ว AC ของอินเวอร์เตอร์ ตรวจขนาดและความยาวสาย AC และเบรกเกอร์ แจ้งการไฟฟ้าถ้าแรงดันที่เสาสูง ตรวจว่าเลือก grid code ถูกต้อง'},
  griduv:{n:'Grid Undervoltage',lv:'Major',cause:'แรงดันกริดต่ำกว่าช่วงที่อนุญาต อาจเป็นช่วงโหลดสูง สายหลวม หรือเบรกเกอร์ AC จุดต่อเสื่อม',fix:'วัดแรงดัน L-N ตอนมีโหลด ตรวจจุดต่อสาย AC และเบรกเกอร์ที่ร้อน แจ้งการไฟฟ้าถ้าแรงดันตกที่ต้นทาง'},
  gridf:{n:'Grid Frequency Abnormal',lv:'Major',cause:'ความถี่กริดออกนอกช่วง 50 Hz ที่ตั้งไว้ (กริดไม่เสถียร หรือเครื่องปั่นไฟต่ออยู่)',fix:'ตรวจว่ามีเครื่องปั่นไฟต่อพ่วงหรือไม่ ตรวจ grid code และรอให้กริดกลับสู่ปกติ อินเวอร์เตอร์จะเชื่อมต่อกลับเอง'},
  insul:{n:'Low Insulation Resistance',lv:'Major',cause:'ฉนวนสาย DC หรือแผงเสื่อม น้ำเข้าหัวต่อ MC4 สายถลอกแตะโครง หรือแผงชำรุด',fix:'ปิดระบบและแยกแหล่งจ่ายก่อนเสมอ วัดความต้านทานฉนวนทีละสตริงด้วยเครื่องที่เหมาะสม ตรวจหัวต่อและสายที่ถลอก (งานนี้ควรให้ช่างไฟฟ้าผู้ได้รับอนุญาตทำ)'},
  arc:{n:'DC Arc Fault',lv:'Major',cause:'หัวต่อ MC4 หลวม ไหม้ หรือสายขาดบางส่วน ทำให้เกิดอาร์กต่อเนื่องที่ฝั่ง DC',fix:'ห้ามถอดหัวต่อ DC ขณะมีโหลด ปิด DC switch แล้วให้ช่างตรวจและเปลี่ยนหัวต่อ/สายที่เสียหาย'},
  rev:{n:'String Reverse Connection',lv:'Major',cause:'ต่อขั้ว + − ของสตริงกลับด้านที่หัวต่อหรือกล่องรวม',fix:'ปิด DC switch ตรวจขั้วด้วยโวลต์มิเตอร์ แล้วต่อใหม่ให้ถูกขั้ว (ไม่ควรปล่อยไว้เพราะเสี่ยงกับตัวกันกระแสย้อนและไดโอดภายใน)'},
  temp:{n:'Abnormal Temperature (Derating)',lv:'Warning',cause:'อุณหภูมิภายในสูง ระบายอากาศไม่พอ หรือติดตั้งโดนแดดตรง อินเวอร์เตอร์จึงลดกำลังเอง (Derating)',fix:'ย้ายหรือทำที่บังแดด เว้นช่องระบายอากาศตามคู่มือ ทำความสะอาดครีบระบายความร้อน'},
  dongle:{n:'Disconnected from Cloud',lv:'Warning',cause:'Smart Dongle หรือสัญญาณ WLAN/4G ขาด อินเวอร์เตอร์ยังผลิตไฟตามปกติ แต่แอปไม่เห็นข้อมูลช่วงนั้น',fix:'ตรวจสัญญาณ Wi-Fi/ซิม ไฟแสดงสถานะบนดองเกิล รีสตาร์ตเราเตอร์ และตั้งค่าเครือข่ายผ่านแอป SUN2000 ใหม่'}
};
const fuWxSeed=n=>{let t=(n*2654435761)>>>0;t^=t<<13;t>>>=0;t^=t>>>17;t^=t<<5;t>>>=0;return (t%10000)/10000};
let fuCache={sig:'',D:null},fuMY={key:'',v:null},fuTimer=0;
function fuBlocks(){
  const I=curInv();let blocks=(typeof lastA!=='undefined'&&lastA)?lastA.res.map(r=>r.status==='ok'?r.blk:null):[];
  let demo=false;
  if(!blocks.some(Boolean)){demo=true;const ns=Math.max(1,Math.min(20,Math.round((I.lo+I.hi)/2/Math.max(PV.vmp,1))));blocks=[{n:ns,ns,mp:1},null]}
  return{I,blocks,demo};
}
function fuCompute(){
  const{I,blocks,demo}=fuBlocks(),P=fuPv();
  const sig=JSON.stringify([P,FU.startAt,FU.fault,FU.mode,FU.f0,FU.f1,SIM.date,SIM.lat,SIM.lon,SIM.tilt,SIM.az,SIM.sky,SIM.loss,SIM.amin,SIM.amax,blocks,I.name,I.pac,PV.pmax,typeof EV!=='undefined'?EV:0]);
  if(fuCache.sig===sig)return fuCache.D;
  const R=simDay(blocks,I,SIM.tilt,SIM.az,5),n=R.n,dt=5/60/1000;
  const totN=blocks.reduce((a,b)=>a+(b?b.n:0),0)||1;
  const D={R,I,blocks,demo,n,pac:[],st:[],pv:[[],[]],gv:[],gf:[],tmp:[],eff:[],ir:[],online:[],alarm:null,trip:-1,held:-1,arcMiss:false,commShut:false,gridwait:false,E:0,Eapp:0,Ecum:[],hour:new Array(24).fill(0)};
  const f0=FU.f0*60/5,f1=FU.f1*60/5,fault=FU.fault,sunI=R.sun.map((v,i)=>v?i:-1).filter(i=>i>=0);
  let acc=0,accApp=0;
  for(let i=0;i<n;i++){
    const h=(i+.5)*5/60,inW=fault!=='none'&&i>=f0&&i<f1&&R.g[i]>=20;
    let p=R.pac[i],st='night',lim=false,tmpX=0;
    const ta=(SIM.amax+SIM.amin)/2+(SIM.amax-SIM.amin)/2*Math.cos(2*Math.PI*(h-15)/24);
    let vg=(FU_V||230)+0.8*(p/1000)+0.5*Math.sin(i/9),fq=50+0.025*Math.sin(i/7),ir=3.1+0.15*Math.sin(i/13),derate=1,share=[1,1];
    const sev=inW?(FU.mode==='ramp'?Math.min(1,(i-f0+1)/Math.max(1,(f1-f0)*.6)):1):0,lp=(a,b)=>a+(b-a)*sev;
    let trip=false;const vg0=(FU_V||230)+0.5*Math.sin(i/9);
    if(inW){
      if(fault==='gridov'){vg=lp(vg,282);if(vg>Math.min(P.ov1,P.ov2))trip=true}
      else if(fault==='griduv'){vg=lp(vg,150);if(vg<P.uv1)trip=true}
      else if(fault==='gridf'){fq=lp(fq,52.5);if(fq>P.rfhi||fq<P.rflo)trip=true}
      else if(fault==='insul'){ir=Math.exp(lp(Math.log(ir),Math.log(0.04)));if(ir<P.insul)trip=true}
      else if(fault==='arc'){if(sev>=0.5){if(P.afci==='Enable')trip=true;else D.arcMiss=true}}
      else if(fault==='rev'){if(sev>0){const s0=blocks[0]?blocks[0].n/totN:1;p=p*(1-s0);share[0]=0;st=p>0?'ongrid':'fault';trip=true}}
      else if(fault==='temp'){tmpX=lp(0,1);if(sev>0){trip=true;derate=lp(1,.6)}}
      else if(fault==='dongle'){trip=true}
      if(fault!=='rev'&&fault!=='temp'&&fault!=='dongle'&&trip){p=0;st='fault'}
      if(fault==='temp'&&sev>0){p*=derate;st=derate<.999?'derate':st}
      if(trip&&D.trip<0)D.trip=i;
      if(fault==='dongle'&&P.cshut==='Enable'&&D.trip>=0&&(i-D.trip)*5>=P.cmin){p=0;st='commshut';D.commShut=true}
    }
    const gridF=['gridov','griduv','gridf','insul','arc'].includes(fault)&&D.trip>=0&&!(fault==='arc'&&P.afci!=='Enable');
    let held=false;
    if(gridF&&!inW&&i>=f1&&R.g[i]>=20&&P.auto==='Disable'&&!(FU.startAt!=null&&FU.startAt>=f1*5&&i*5>=FU.startAt))held=true;
    if(held){p=0;st='manual';D.held=D.held<0?i:D.held}
    else if(!inW&&R.g[i]>=20&&(vg0>P.rvhi||vg0<P.rvlo||fq>P.rfhi||fq<P.rflo)){p=0;st='gridwait';D.gridwait=true}
    const recover=gridF&&!held&&i>=f1&&i<f1+2&&R.g[i]>=20&&R.pac[i]>0;
    if(recover){p=0;st='starting'}
    if(!st||st==='night'){
      if(p>0){st=R.pac[i]<(R.pot[i]*(I.eff||97)/100)-1&&R.pot[i]*(I.eff||97)/100>I.pac*.999?'limited':'ongrid'}
      else if(R.sun[i]&&R.g[i]>=20){
        if(R.first>=0&&i>=R.first-2&&i<R.first)st=i===R.first-1?'starting':'insul';
        else st='detect';
      }else st='night';
    }
    const load=I.pac>0?p/I.pac:0;
    let tmp=ta+28*Math.pow(Math.max(load,0),1.2)+3;if(fault==='temp'&&inW)tmp=tmp+(86-tmp)*tmpX;
    const eff=p>0?(I.eff||97)/100*(1-0.05*Math.exp(-p/(0.04*I.pac))):0;
    const pdc=eff>0?p/eff:0;
    for(let j=0;j<2;j++){
      const b=blocks[j],V=b&&R.vmp[j][i]!=null?R.vmp[j][i]:0;
      const Pj=b&&pdc>0?pdc*b.n/totN*(share[j]===0?0:1)/(fault==='rev'&&inW&&j===0?1:1):0;
      D.pv[j].push(b?{V:(fault==='rev'&&inW&&j===0)?-0.4:V,I:V>0&&Pj>0?Pj/V:0,P:Pj,on:true}:{V:0,I:0,P:0,on:false});
    }
    D.pac.push(p);D.st.push(st);D.gv.push(p>0||st==='starting'||st==='fault'||st==='detect'||st==='insul'?vg:(R.sun[i]?vg:vg));D.gf.push(fq);D.tmp.push(tmp);D.eff.push(eff);D.ir.push(ir);
    const off=fault==='dongle'&&i>=f0&&i<f1;
    D.online.push(!off);
    acc+=p*dt;if(!off)accApp+=p*dt;D.Ecum.push([acc,accApp]);
    D.hour[Math.min(23,Math.floor(h))]+=p*dt;
  }
  D.E=acc;D.Eapp=accApp;
  D.sunI=sunI;
  D.alarm=fault==='none'?null:Object.assign({key:fault,start:D.trip>=0?D.trip*5/60:null,end:FU.f1},FU_AL[fault]);
  fuCache={sig,D};return D;
}
let FU_V=230;
function fuMonthYear(D){
  const{blocks,I}=D,key=[SIM.date.slice(0,7),SIM.lat,SIM.lon,SIM.tilt,SIM.az,SIM.sky,SIM.loss,I.name,PV.pmax,JSON.stringify(blocks)].join('|');
  if(fuMY.key===key)return fuMY.v;
  const old=SIM.date,[y,m]=old.split('-').map(Number),dim=new Date(Date.UTC(y,m,0)).getUTCDate(),days=[],mon=[];
  const season=mm=>(mm>=5&&mm<=10)?.68:.88;
  try{
    for(let d=1;d<=dim;d++){SIM.date=`${y}-${pad2(m)}-${pad2(d)}`;const wx=Math.max(.25,Math.min(1,season(m)*(.5+.8*fuWxSeed(y*400+m*31+d))));days.push(simDay(blocks,I,SIM.tilt,SIM.az,15,false,true).E*wx)}
    for(let mm=1;mm<=12;mm++){SIM.date=`${y}-${pad2(mm)}-15`;const dm=new Date(Date.UTC(y,mm,0)).getUTCDate();mon.push(simDay(blocks,I,SIM.tilt,SIM.az,15,false,true).E*dm*season(mm)*.9)}
  }finally{SIM.date=old}
  fuMY={key,v:{days,mon,y,m}};return fuMY.v;
}
const FU_ST={manual:['Shutdown: Command (รอสั่งเริ่มเครื่อง)','err'],gridwait:['Standby: Grid parameters out of reconnection range','warn'],commshut:['Shutdown: Communication interruption','err'],night:['Standby: No irradiation','idle'],insul:['Standby: Detecting insulation resistance','warn'],detect:['Standby: Detecting irradiation','warn'],starting:['Starting','warn'],ongrid:['On-grid','ok'],limited:['On-grid: Power limited','ok'],derate:['On-grid: Self-derating','warn'],fault:['Shutdown: Fault','err']};
function fuChartSVG(D,i){
  const W=640,H=230,L=44,Rm=12,T=14,B=26,pw=W-L-Rm,ph=H-T-B,sun=D.sunI;
  if(!sun.length)return `<svg viewBox="0 0 ${W} ${H}"><text x="${W/2}" y="${H/2}" text-anchor="middle" class="acnote">ไม่มีแสงอาทิตย์ในวันที่นี้</text></svg>`;
  const x0=Math.max(0,Math.floor(sun[0]*5/60-.5)),x1=Math.min(24,Math.ceil((sun[sun.length-1]+1)*5/60+.5));
  const X=h=>L+(h-x0)/(x1-x0)*pw,pmax=Math.max(D.I.pac,...D.R.pot.map(v=>v))/1000;
  const ymax=Math.max(1,Math.ceil(Math.max(...D.pac)/1000*1.15*2)/2),Y=v=>T+ph-v/ymax*ph;
  let s='';
  for(let k=0;k<=4;k++){const v=ymax*k/4,y=Y(v);s+=`<line x1="${L}" x2="${W-Rm}" y1="${y}" y2="${y}" class="fugrid"/><text x="${L-6}" y="${y+4}" text-anchor="end" class="fuax">${f(v,1)}</text>`}
  for(let h=Math.ceil(x0/2)*2;h<=x1;h+=2)s+=`<text x="${X(h)}" y="${H-8}" text-anchor="middle" class="fuax">${pad2(h)}:00</text>`;
  s+=`<text x="${L-6}" y="10" text-anchor="end" class="fuax">kW</text>`;
  let seg='',off='',prevOn=true,pts=[];
  const flush=()=>{if(pts.length>1)seg+=`<path d="M${pts.map(p=>p.join(' ')).join('L')}L${pts[pts.length-1][0]} ${Y(0)}L${pts[0][0]} ${Y(0)}Z" class="fuarea"/><path d="M${pts.map(p=>p.join(' ')).join('L')}" class="fuline"/>`;pts=[]};
  for(let k=0;k<D.n;k++){
    const h=(k+.5)*5/60;if(h<x0||h>x1)continue;
    if(D.online[k])pts.push([+X(h).toFixed(1),+Y(D.pac[k]/1000).toFixed(1)]);else{flush();}
  }
  flush();
  const offI=D.online.map((v,k)=>v?-1:k).filter(k=>k>=0);
  if(offI.length)off=`<rect x="${X(offI[0]*5/60)}" y="${T}" width="${X((offI[offI.length-1]+1)*5/60)-X(offI[0]*5/60)}" height="${ph}" class="fuoff"/><text x="${(X(offI[0]*5/60)+X((offI[offI.length-1]+1)*5/60))/2}" y="${T+16}" text-anchor="middle" class="fuax">ข้อมูลขาดช่วง</text>`;
  const ch=(i+.5)*5/60,cx=X(Math.min(Math.max(ch,x0),x1)),cy=Y(D.pac[i]/1000);
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="กราฟกำลังผลิต AC ตลอดวัน">${s}${off}${seg}<line x1="${cx}" x2="${cx}" y1="${T}" y2="${T+ph}" class="fucur"/><circle cx="${cx}" cy="${cy}" r="5" class="fudot"/></svg>`;
}
function fuBarsSVG(vals,labels,hi,unit){
  const W=640,H=200,L=40,Rm=8,T=12,B=26,pw=W-L-Rm,ph=H-T-B,n=vals.length,mx=Math.max(...vals,.1)*1.1,bw=pw/n;
  let s='';
  for(let k=0;k<=3;k++){const v=mx*k/3,y=T+ph-v/mx*ph;s+=`<line x1="${L}" x2="${W-Rm}" y1="${y}" y2="${y}" class="fugrid"/><text x="${L-5}" y="${y+4}" text-anchor="end" class="fuax">${f(v,mx>20?0:1)}</text>`}
  vals.forEach((v,k)=>{const h=v/mx*ph,x=L+k*bw;s+=`<rect x="${x+bw*.15}" y="${T+ph-h}" width="${bw*.7}" height="${h}" rx="2" class="fubar${k===hi?' hi':''}"><title>${labels[k]}: ${f(v,1)} ${unit}</title></rect>`;if(n<=14||k%Math.ceil(n/12)===0)s+=`<text x="${x+bw/2}" y="${H-8}" text-anchor="middle" class="fuax">${labels[k]}</text>`});
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="กราฟพลังงานที่ผลิต (${unit})">${s}</svg>`;
}
function fuRender(){
  if(!document.getElementById('fuov'))return;
  const D=fuCompute(),i=Math.min(D.n-1,Math.max(0,Math.round(FU.m/5))),q=id=>document.getElementById(id);
  const h=i*5/60,st=D.st[i],stn=FU_ST[st],on=D.online[i],p=D.pac[i],I=D.I;
  const[Eday,EdayApp]=D.Ecum[i],shown=on?EdayApp:EdayApp;
  const MY=fuMonthYear(D),dayIdx=Math.max(0,parseInt(SIM.date.slice(8,10))-1);
  const monE=MY.days.reduce((a,v,k)=>a+(k<dayIdx?v:0),0)+(D.Eapp?Eday:0),yr=MY.mon.reduce((a,v,k)=>a+(k<MY.m-1?v:0),0)+monE;
  const tot=FU.base+yr,rev=tot*FU.tariff;
  const kg=Eday*0.5;
  q('fuclock').textContent=`${pad2(Math.floor(FU.m/60))}:${pad2(FU.m%60)}`;
  q('fusl').value=FU.m;q('fuplay').textContent=FU.play?'หยุด':'เล่น';
  q('fudemo').hidden=!D.demo;
  q('fuov').innerHTML=`
    <div class="fuhead"><b>โรงไฟฟ้า (จำลอง)</b><span class="pill ${on?'ok':'err'}">${on?'เชื่อมต่อ':'Disconnected'}</span></div>
    <div class="fubig"><div><div class="k">กำลังผลิตขณะนี้</div><div class="v">${on?f(p/1000,2):'--'} <small>kW</small></div></div>
    <div><div class="k">ผลิตวันนี้</div><div class="v">${f(shown,2)} <small>kWh</small></div></div></div>
    <div class="fumx"><div><span>เดือนนี้</span><b>${f(monE,0)} kWh</b></div><div><span>ปีนี้</span><b>${f(yr,0)} kWh</b></div><div><span>สะสมทั้งหมด</span><b>${f(tot,0)} kWh</b></div>
    <div><span>รายได้/ประหยัด (สะสม)</span><b>${f(rev,0)} ฿</b></div><div><span>ลด CO₂ วันนี้ (ประมาณ)</span><b>${f(kg,1)} kg</b></div><div><span>เทียบต้นไม้ (วันนี้)</span><b>${f(kg/21*365,1)} ต้น/ปี</b></div></div>
    ${FU.fault==='dongle'&&Eday>EdayApp+.005?`<p class="hint tight">ผลิตจริง ${f(Eday,2)} kWh แต่แอปแสดง ${f(EdayApp,2)} kWh เพราะข้อมูลช่วง ${pad2(FU.f0)}:00–${pad2(FU.f1)}:00 ขาด</p>`:''}`;
  q('fuchart').innerHTML=fuChartSVG(D,i);
  const Pdc=p>0&&D.eff[i]>0?p/D.eff[i]:0;
  const row=(k,v,u)=>`<tr><th>${k}</th><td>${v}</td><td>${u||''}</td></tr>`;
  const g=on&&true;
  q('fudev').innerHTML=`<div class="fuhead"><b>${esc(I.name)}</b><span class="pill ${stn[1]==='idle'?'idle':stn[1]}">${stn[0]}</span></div>
    <table class="fut"><tbody>
    ${row('Active power',f(p/1000,3),'kW')}${row('Reactive power','0.000','kVar')}${row('Power factor',p>0?'1.000':'--','')}
    ${row('Grid voltage (L-N)',p>0||['fault','starting','manual','gridwait','commshut'].includes(st)?f(D.gv[i],1):'--','V')}${row('Grid current',p>0?f(p/Math.max(D.gv[i],1),2):'0.00','A')}${row('Grid frequency',R_f(D,i),'Hz')}
    ${row('Internal temperature',f(D.tmp[i],1),'°C')}${row('Efficiency',p>0?f(D.eff[i]*100,2):'--','%')}${row('Insulation resistance',f(D.ir[i],D.ir[i]<1?3:2),'MΩ')}
    ${row('Daily energy',f(Eday,2),'kWh')}${row('Input power',f(Pdc/1000,3),'kW')}${row('Rated power',f(I.pac/1000,2),'kW')}
    </tbody></table>`;
  q('fustr').innerHTML=`<table class="fut"><thead><tr><th>Input</th><th>แรงดัน (V)</th><th>กระแส (A)</th><th>กำลัง (W)</th></tr></thead><tbody>`+[0,1].map(j=>{const b=D.blocks[j],d=D.pv[j][i];return `<tr><th>PV${j+1}${b?` · ${b.ns} แผงอนุกรม`:''}</th>${b?`<td>${f(d.V,1)}</td><td>${f(d.I,2)}</td><td>${f(d.P,0)}</td>`:`<td colspan="3" class="hint">ไม่ได้ต่อ</td>`}</tr>`}).join('')+`</tbody></table>
    <p class="hint tight">แสงบนแผง ${f(D.R.g[i],0)} W/m² · อุณหภูมิเซลล์ ${f(D.R.tc[i],1)} °C · ช่วง MPPT ${I.lo}–${I.hi} V</p>`;
  const a=D.alarm;
  let al='';
  if(a){
    const state=a.start==null||h<a.start?'ยังไม่เกิด (ยังไม่ถึงเกณฑ์)':(h<a.end||(a.key!=='dongle'&&a.key!=='temp'&&h<a.end+10/60))?'กำลังเกิด (Active)':'แก้ไขแล้ว (Cleared)';
    const act=state.startsWith('กำลัง');
    al=`<div class="fual-i ${act?'act':''}"><div class="fuhead"><b>${a.n}</b><span class="pill ${a.lv==='Major'?'err':'warn'}">${a.lv}</span></div>
      <p class="hint tight">เกิด ${a.start==null?'--':pad2(Math.floor(a.start))+':'+pad2(Math.round(a.start%1*60))} · สิ้นสุด ${pad2(Math.floor(a.end))}:00 · สถานะ ณ เวลาที่เลือก: <b>${state}</b></p>
      <details ${act?'open':''}><summary>สาเหตุและวิธีแก้</summary><p><b>สาเหตุที่เป็นไปได้:</b> ${esc(a.cause)}</p><p><b>วิธีตรวจ/แก้:</b> ${esc(a.fix)}</p></details></div>`;
  }else al='<p class="hint">ไม่มี alarm — เลือกฟอลต์ด้านบนเพื่อฝึกอ่านและวิเคราะห์ alarm</p>';
  const nt=[];
  if(D.st[i]==='manual')nt.push(`<div class="fual-i act"><b>อินเวอร์เตอร์ไม่เริ่มเองหลังไฟกริดกลับมา</b><p class="hint tight">พารามิเตอร์ "Automatic startup upon grid recovery" = ${esc(fuPv().auto)} จึงต้องสั่งเริ่มเครื่องด้วยตนเอง (หรือไปตั้งเป็น Enable ในหน้า Configuration)</p><button class="btn sm" id="fustart">สั่งเริ่มเครื่อง (Start)</button></div>`);
  if(D.gridwait&&D.st[i]==='gridwait')nt.push('<div class="fual-i act"><b>ค่ากริดอยู่นอกช่วงเชื่อมต่อกลับ</b><p class="hint tight">แรงดัน/ความถี่ปกติของกริดอยู่นอกช่วง Grid reconnection limits ที่ตั้งไว้ อินเวอร์เตอร์จึงไม่ต่อเข้ากริด ตรวจค่าในหน้า Configuration</p></div>');
  if(D.arcMiss&&FU.fault==='arc')nt.push('<div class="fual-i act"><b>เกิดอาร์ก DC แต่ไม่มี alarm</b><p class="hint tight">พารามิเตอร์ AFCI = Disable อินเวอร์เตอร์จึงไม่ตรวจจับและไม่ตัดวงจร เสี่ยงต่อไฟไหม้ ควรตั้ง Enable (ค่าในเครื่องตัวอย่างเป็น Disable)</p></div>');
  if(D.commShut&&D.st[i]==='commshut')nt.push('<div class="fual-i act"><b>หยุดเครื่องเพราะสื่อสารขาดนานเกินกำหนด</b><p class="hint tight">เปิด Automatic shutdown upon communication interruption จึงหยุดหลัง Shutdown duration ที่ตั้งไว้</p></div>');
  q('fual').innerHTML=al+nt.join('');
  const sb=q('fustart');if(sb)sb.onclick=()=>{FU.startAt=FU.m;fuRender();touch()};
  q('fumon').hidden=FU.page!=='mon';q('fucfg').hidden=FU.page!=='cfg';q('fupages').querySelectorAll('[data-fpg]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.fpg===FU.page)));
  const days=MY.days,mon=MY.mon;
  let bars='';
  if(FU.view==='day')bars=fuBarsSVG(D.hour,Array.from({length:24},(_,k)=>pad2(k)),Math.floor(h),'kWh');
  else if(FU.view==='month')bars=fuBarsSVG(days,days.map((_,k)=>String(k+1)),dayIdx,'kWh');
  else bars=fuBarsSVG(mon,['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'],MY.m-1,'kWh');
  q('fubars').innerHTML=bars;
  q('fuviews').querySelectorAll('[data-fv]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.fv===FU.view)));
  q('fuvnote').textContent=FU.view==='day'?`พลังงานรายชั่วโมงของวันที่ ${SIM.date}`:FU.view==='month'?'รายวัน (สภาพอากาศสุ่มแบบคงที่ ฤดูฝนผลิตน้อยกว่า)':'รายเดือน (ค่าประมาณจากวันกลางเดือน ปรับตามฤดู)';
}
const R_f=(D,i)=>D.pac[i]>0||['fault','starting','manual','gridwait','commshut'].includes(D.st[i])?f(D.gf[i],2):'--';
function fuSyncCtl(){
  const q=id=>document.getElementById(id);
  q('fufault').querySelectorAll('[data-ff]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ff===FU.fault)));q('fumode').querySelectorAll('[data-fm]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.fm===FU.mode)));
  const inf=q('fuinfo');if(inf){const a=FU_AL[FU.fault];inf.innerHTML=a?`<b>${FU_IC[FU.fault][0]} ${a.n}</b> <span class="pill ${a.lv==='Major'?'err':'warn'}">${a.lv}</span><br>${esc(a.cause)}`:'เลือกสัญลักษณ์ฟอลต์ด้านบน แล้วกำหนดช่วงเวลาและรูปแบบการเกิด';}
  q('fuf0').value=FU.f0;q('fuf1').value=FU.f1;
  if(document.activeElement!==q('futar'))q('futar').value=FU.tariff;
  if(document.activeElement!==q('fubase'))q('fubase').value=FU.base;
}
function fuStop(){FU.play=false;clearInterval(fuTimer);fuTimer=0}
function initFusion(){
  const q=id=>document.getElementById(id);if(!q('fusl'))return;
  q('fufault').innerHTML=FU_FAULTS.map(x=>`<button type="button" class="fuft" data-ff="${x[0]}" title="${esc(x[1])}"><span class="fui">${FU_IC[x[0]][0]}</span><span>${FU_IC[x[0]][1]}</span></button>`).join('');
  q('fufault').addEventListener('click',e=>{const b=e.target.closest('[data-ff]');if(!b)return;FU.fault=b.dataset.ff;FU.startAt=null;if(FU.fault!=='none'&&FU.f1<=FU.f0){FU.f0=11;FU.f1=13}fuSyncCtl();fuRender();touch()});
  q('fumode').addEventListener('click',e=>{const b=e.target.closest('[data-fm]');if(!b)return;FU.mode=b.dataset.fm;fuSyncCtl();fuRender();touch()});
  const hrs=Array.from({length:25},(_,k)=>`<option value="${k}">${pad2(k)}:00</option>`).join('');
  q('fuf0').innerHTML=hrs;q('fuf1').innerHTML=hrs;
  q('fupages').addEventListener('click',e=>{const b=e.target.closest('[data-fpg]');if(b){FU.page=b.dataset.fpg;fuRender();touch()}});
  q('fusl').addEventListener('input',e=>{FU.m=Math.round(+e.target.value/5)*5;fuRender();touch()});
  q('fuplay').addEventListener('click',()=>{
    if(FU.play){fuStop();fuRender();return}
    FU.play=true;if(FU.m>=1430)FU.m=0;
    fuTimer=setInterval(()=>{if(typeof curTab==='undefined'||curTab!=='fusion'){fuStop();return}FU.m+=10;if(FU.m>=1435){FU.m=1435;fuStop()}fuRender()},120);fuRender();
  });
  const w=(id,k)=>q(id).addEventListener('change',e=>{FU[k]=+e.target.value;FU.startAt=null;if(FU.f1<=FU.f0){if(k==='f0')FU.f1=Math.min(24,FU.f0+1);else FU.f0=Math.max(0,FU.f1-1)}fuSyncCtl();fuRender();touch()});
  w('fuf0','f0');w('fuf1','f1');
  q('futar').addEventListener('input',e=>{const v=parseFloat(e.target.value);if(isFinite(v)){FU.tariff=Math.max(0,Math.min(50,v));fuRender();touch()}});
  q('fubase').addEventListener('input',e=>{const v=parseFloat(e.target.value);if(isFinite(v)){FU.base=Math.max(0,Math.min(1e7,v));fuRender();touch()}});
  q('fuviews').addEventListener('click',e=>{const b=e.target.closest('[data-fv]');if(b){FU.view=b.dataset.fv;fuRender();touch()}});
  fuSyncCtl();
}
function fuSnapshot(){return{pr:fupSnapshot(),page:FU.page,m:FU.m,mode:FU.mode,fault:FU.fault,f0:FU.f0,f1:FU.f1,tariff:FU.tariff,base:FU.base,view:FU.view}}
function fuRestore(o){
  if(!o||typeof o!=='object')return;
  fupRestore(o.pr);if(o.page==='cfg'||o.page==='mon')FU.page=o.page;FU.startAt=null;
  const n=(v,d,lo,hi)=>{v=+v;return isFinite(v)?Math.max(lo,Math.min(hi,v)):d};
  FU.m=Math.round(n(o.m,720,0,1435)/5)*5;FU.f0=n(o.f0,11,0,23)|0;FU.f1=n(o.f1,13,1,24)|0;if(FU.f1<=FU.f0)FU.f1=Math.min(24,FU.f0+1);
  if(FU_FAULTS.some(x=>x[0]===o.fault))FU.fault=o.fault;
  FU.tariff=n(o.tariff,4.2,0,50);FU.base=n(o.base,12500,0,1e7);
  if(['day','month','year'].includes(o.view))FU.view=o.view;
  if(o.mode==='step'||o.mode==='ramp')FU.mode=o.mode;
  fuSyncCtl();
}
