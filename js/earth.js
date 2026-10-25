/* ---- เมนู 00 หัวข้อ 09: จำลองปักหลักดิน ----
   ผังพื้นที่ (มองจากบน) + ภาพตัดดิน 2 ชั้น · ปัก/ย้าย/ตอกลึกหลักดิน · ลากสายดินเข้าหากันและเข้าบาร์กราวด์ตู้เมน
   วัดด้วยเครื่องวัดความต้านทานดินจำลองแบบ Kyoritsu KEW 4105A (3 ขั้ว E-P-C, สาย เขียว 5 ม. / เหลือง 10 ม. / แดง 20 ม.)
   แบบจำลอง (เพื่อการสอน ค่าดินเป็นค่าประมาณ):
   · หลักแท่งเดียว R = ρa/(2πL)·(ln(4L/r) − 1)  (r = 8 มม. หลัก Ø16 มม.)
   · ดิน 2 ชั้น: หลักที่ทะลุชั้นบน ρa = L / (h/ρ1 + (L−h)/ρ2)
   · หลายหลัก: ความต้านทานร่วม ≈ ρ/(2πs) แก้สมการศักย์เท่ากัน (ให้ผลใกล้ตารางตัวคูณ 2 หลัก 0.58/0.54, 3 หลัก ≈0.42)
   · ค่าที่เครื่องอ่านได้ (Fall-of-Potential) = R_E − ρ/2π·[1/(d_EP+d0) + 1/d_EC − 1/d_CP]  ทำให้เห็นช่วงราบรอบ 62% */
const GE_SOIL={
  clay:{n:'ดินเหนียว / ดินร่วน',r1:{wet:30,dry:90},h:2.0,r2:{wet:15,dry:25},hit:[14,18],col:'#8a6a4b',col2:'#6b5139',top:'#c9dfae',l1:'ดินเหนียวผิวบน',l2:'ดินเหนียวชื้น',
    rg:'ดินเหนียว 25–60 Ω·m · ดินผิวหน้า/ดินปุ๋ย 10–55 Ω·m (ตาราง IEEE Std 142)',tip:'ตอกง่าย ฤดูฝนมักได้ตามเกณฑ์ด้วย 1–3 หลัก ฤดูแล้งดินชั้นบนแห้ง ค่าสูงขึ้นมาก'},
  sand:{n:'ทราย',r1:{wet:800,dry:2500},h:3.0,r2:{wet:30,dry:45},hit:[10,12],col:'#e3c27e',col2:'#8fb2cc',top:'#efe2b8',l1:'ทรายแห้ง/ทรายชื้น',l2:'ทรายอิ่มน้ำ (ชั้นน้ำใต้ดิน)',
    rg:'ทรายแห้ง 1,000–10,000 Ω·m · ทรายที่อิ่มน้ำต่ำกว่ามาก',tip:'ชั้นบนค่าสูงมาก เพิ่มหลักในชั้นเดิมช่วยได้น้อย ต้องตอกลึกให้ถึงชั้นน้ำใต้ดิน'},
  lat:{n:'ลูกรัง',r1:{wet:300,dry:900},h:2.5,r2:{wet:50,dry:80},hit:[45,30],col:'#b5592f',col2:'#7d6450',top:'#e4b89c',l1:'ลูกรัง (กรวดแข็งปนดิน)',l2:'ดินเหนียวปนกรวด',
    rg:'ลูกรัง/กรวดปนดิน ราว 200–2,500 Ω·m (ค่าประมาณ)',tip:'ตอกยาก ชั้นลูกรังอาจต้องเจาะนำ ค่ามักสูง พื้นที่ยากต่อการปฏิบัติอาจต้องขอการไฟฟ้าฯ ใช้เกณฑ์ไม่เกิน 25 Ω'}
};
function b0Earth(el){
  const K=38,OX=40,OY=56,YW=24,YH=9,SY=470,KS=24,DMAX=12.6,SEC=2.4,RR=0.008,RUT=2,LEAD={E:5,P:10,C:20},LNAME={E:'E (เขียว 5 ม.)',P:'P (เหลือง 10 ม.)',C:'C (แดง 20 ม.)'},LCOL={E:'#1a9c4a',P:'#d9a800',C:'#d62828'};
  const RNG={'20':{max:19.99,res:.01,d:2},'200':{max:199.9,res:.1,d:1},'2000':{max:1999,res:1,d:0}};
  const S={soil:'clay',wet:'wet',rods:[{id:1,x:5,y:4,n:1}],nid:2,wires:[],leads:{},P:{x:12.5,y:7.8,water:false},C:{x:20,y:7.8,water:false},M:{x:4,y:7.6},
    sel:1,pick:null,tool:false,sw:'OFF',lcd:'',lcdU:'',mm:['',''],log:[],valid:null,ex:false,hits:14,drag:null,wd:null,msg:['','']};
  const $q=x=>el.querySelector(x);
  el.innerHTML=`<div class="chips b0gtab" role="group" aria-label="มุมมอง"><button class="chip" data-gv="rod" aria-pressed="true">ปักหลักดินและวัดค่า</button><button class="chip" data-gv="fault" aria-pressed="false">ไฟรั่วลงโครง (ทำไมต้องมีสายดิน)</button></div>
   <div id="geRod"><div class="b8wrap"><div class="b8pal" id="gePal"></div><div class="b0scn"><svg id="geSvg" viewBox="0 0 1000 790" role="img" aria-label="ผังพื้นที่ปักหลักดินและภาพตัดดิน"></svg></div></div>
   <div class="gerow"><div class="gemet"><svg id="geMet" viewBox="0 0 360 262" role="img" aria-label="เครื่องวัดความต้านทานดินจำลอง"></svg><p class="b0msg" id="geMm"></p></div>
    <div class="gelog"><div class="geloh"><b>บันทึกค่าที่วัด</b><button class="chip sm" type="button" id="geClr">ล้างบันทึก</button></div><div id="geLog"></div></div></div>
   <h3 class="sech" style="margin:10px 0 0">ผลการตรวจ</h3><ul class="checks" id="geCk"></ul><p class="b0msg" id="geMsg"></p>
   <details class="gecmp" open><summary>เปรียบเทียบรูปแบบหลักดินในดินที่เลือก: หลักลึก กับ เดลต้า (คำนวณ)</summary><div id="geCmp" class="tblwrap"></div>
    <p class="hint tight">ค่าคำนวณจากแบบจำลองดิน 2 ชั้นด้านบน ใช้เปรียบเทียบแนวโน้ม งานจริงต้องวัดด้วยเครื่องวัดหลังปักเสร็จ · ตัวคูณจากตารางอ้างอิง: 2 หลักห่าง 2.4 ม. = 0.58, ห่าง 4.8 ม. = 0.54 · 3 หลักห่าง 2.4 ม. = 0.42</p></details></div>
   <div id="geFault" hidden></div>`;
  const svg=$q('#geSvg'),met=$q('#geMet');
  /* ---- soil and resistance model ---- */
  const so=()=>GE_SOIL[S.soil],r1=w=>so().r1[w||S.wet],r2=w=>so().r2[w||S.wet],hh=()=>so().h;
  const rhoA=(L,w)=>L<=hh()?r1(w):L/(hh()/r1(w)+(L-hh())/r2(w));
  const Rself=(L,w)=>rhoA(L,w)/(2*Math.PI*L)*(Math.log(4*L/RR)-1);
  const solve=(A,b)=>{const n=b.length,M=A.map((r,i)=>r.concat([b[i]]));
    for(let c=0;c<n;c++){let p=c;for(let r=c+1;r<n;r++)if(Math.abs(M[r][c])>Math.abs(M[p][c]))p=r;[M[c],M[p]]=[M[p],M[c]];
      for(let r=0;r<n;r++){if(r===c)continue;const f=M[r][c]/M[c][c];for(let k=c;k<=n;k++)M[r][k]-=f*M[c][k]}}
    return M.map((r,i)=>r[n]/r[i])};
  const sysR=(list,w)=>{const n=list.length;if(!n)return Infinity;const L=list.map(r=>r.n*SEC),ra=L.map(l=>rhoA(l,w)),Rs=L.map(l=>Rself(l,w));
    /* mutual: uniform line current on rod i (with surface image) averaged over rod j: ρ/(4πLi)·avg[asinh((z+Li)/s) − asinh((z−Li)/s)] */
    const mu=(Li,Lj,s)=>{let a=0;for(let k=0;k<=12;k++){const z=Lj*k/12,f=Math.asinh((z+Li)/s)-Math.asinh((z-Li)/s);a+=(k===0||k===12?.5:1)*f}return a/12/(4*Math.PI*Li)};
    const A=list.map((a,i)=>list.map((b,j)=>{if(i===j)return Rs[i];const s=Math.max(.3,Math.hypot(a.x-b.x,a.y-b.y)),r=(ra[i]+ra[j])/2;return Math.min(r*(mu(L[i],L[j],s)+mu(L[j],L[i],s))/2,.95*Math.min(Rs[i],Rs[j]))}));
    return 1/solve(A,list.map(()=>1)).reduce((s,v)=>s+v,0)};
  const spikeR=sp=>r1()/(2*Math.PI*.3)*(Math.log(4*.3/.005)-1)*(sp.water?.3:1);
  const hitsOf=k=>(k*SEC>=hh()?so().hit[1]:so().hit[0]);
  /* ---- geometry ---- */
  const X=x=>OX+x*K,Y=y=>OY+y*K,DZ=d=>SY+d*KS,dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),fm=(x,d=1)=>b0f(x,d);
  const rodOf=id=>S.rods.find(r=>'R'+r.id===id);
  const posOf=id=>{if(id==='G')return{x:1.5,y:2.2};if(id==='P')return S.P;if(id==='C')return S.C;
    if(id[0]==='M'){const o={ME:-.55,MP:0,MC:.55}[id];return{x:S.M.x+o,y:S.M.y+.5}}return rodOf(id)||null};
  const leadOk=k=>{const t=S.leads[k];if(!t)return false;const p=posOf(t);return!!p&&dist(posOf('M'+k),p)<=LEAD[k]+1e-6};
  const comp=id=>{const par={},f=x=>{if(par[x]===undefined)par[x]=x;while(par[x]!==x){par[x]=par[par[x]];x=par[x]}return x};
    S.wires.forEach(w=>{par[f(w.a)]=f(w.b)});const r=f(id),out=new Set([id]);['G',...S.rods.map(x=>'R'+x.id)].forEach(t=>{if(f(t)===r)out.add(t)});return out};
  const rodKey=()=>JSON.stringify([S.soil,S.wet,S.rods.map(r=>[r.id,+r.x.toFixed(2),+r.y.toFixed(2),r.n])]);
  const pt=e=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(svg.getScreenCTM().inverse());return{x:q.x,y:q.y}};
  const toM=p=>({x:(p.x-OX)/K,y:(p.y-OY)/K});
  const inPlan=p=>p.x>=OX&&p.x<=X(YW)&&p.y>=OY&&p.y<=Y(YH);
  const clampM=(m,minX)=>({x:Math.max(minX,Math.min(YW-.3,m.x)),y:Math.max(.3,Math.min(YH-.3,m.y))});
  const freeSpot=(m,skip)=>!S.rods.some(r=>r.id!==skip&&dist(r,m)<.5);
  /* ---- measurement (what the meter would read) ---- */
  function meas(){
    const L=S.leads,miss=['E','P','C'].filter(k=>!L[k]);
    if(miss.length)return{ok:false,why:`ยังไม่ได้ต่อสาย ${miss.map(k=>LNAME[k]).join(', ')}`};
    const taut=['E','P','C'].filter(k=>!leadOk(k));
    if(taut.length)return{ok:false,why:`สาย ${taut.map(k=>LNAME[k]).join(', ')} ยาวไม่ถึง ย้ายเครื่องวัดหรือหลักช่วยให้ใกล้ขึ้น`};
    if(!(L.E==='G'||rodOf(L.E)))return{ok:false,why:'สาย E (เขียว) ต้องหนีบที่หลักดินที่ต้องการวัด'};
    const cE=comp(L.E),rods=S.rods.filter(r=>cE.has('R'+r.id)),viaG=cE.has('G'),Rs=sysR(rods);
    const Reff=viaG?(isFinite(Rs)?Rs*RUT/(Rs+RUT):RUT):Rs;
    const E=rods.length?{x:rods.reduce((a,r)=>a+r.x,0)/rods.length,y:rods.reduce((a,r)=>a+r.y,0)/rods.length}:posOf('G');
    const Pp=posOf(L.P),Cp=posOf(L.C),dEP=dist(E,Pp),dEC=dist(E,Cp),dCP=dist(Cp,Pp);
    const rf=rods.length?rhoA(Math.max(...rods.map(r=>r.n*SEC))):r1(),d0=rf/(2*Math.PI*Reff);
    let R=Reff-rf/(2*Math.PI)*(1/(dEP+d0)+1/Math.max(dEC,.3)-1/Math.max(dCP,.3));R=Math.max(0,R);
    const ux=(Cp.x-E.x)/(dEC||1),uy=(Cp.y-E.y)/(dEC||1),along=(Pp.x-E.x)*ux+(Pp.y-E.y)*uy,off=Math.abs((Pp.x-E.x)*uy-(Pp.y-E.y)*ux);
    const aux=id=>id==='P'?spikeR(S.P):id==='C'?spikeR(S.C):id==='G'?RUT:rodOf(id)?Rself(rodOf(id).n*SEC):0;
    return{ok:true,R,Rtrue:Reff,viaG,rods,E,dEP,dEC,pct:along/(dEC||1)*100,off,auxC:aux(L.C),auxP:aux(L.P),pOnSpike:L.P==='P'||L.P==='C',cOnSpike:L.C==='C'||L.C==='P',swap:L.P==='C'&&L.C==='P'}}
  function test(){
    if(!['20','200','2000'].includes(S.sw)){S.mm=['','หมุนสวิตช์ไปที่ย่าน Ω (20 / 200 / 2000) ก่อนกด TEST'];return}
    const m=meas(),rg=RNG[S.sw];
    if(!m.ok){S.lcd='- - -';S.lcdU='Ω';S.mm=['err',m.why];return}
    if(m.auxC>5000){S.lcd='. . .';S.lcdU='';S.mm=['err',`ความต้านทานหลักช่วย C สูงเกิน (≈ ${fm(m.auxC,0)} Ω) เครื่องแสดง "..." · ตรวจขั้วสาย ตอกหลักช่วยให้ลึกขึ้น ย้ายจุด หรือรดน้ำรอบหลักช่วย`];return}
    const v=m.R*(1+(Math.random()-.5)*.012),disp=Math.round(v/rg.res)*rg.res;
    if(v>rg.max){S.lcd='1';S.lcdU='Ω';S.mm=['warn','ค่าเกินย่าน (แสดง "1") หมุนไปย่านที่สูงขึ้นแล้วกดใหม่'];return}
    S.lcd=disp.toFixed(rg.d);S.lcdU='Ω';
    const lowRes=S.sw!=='20'&&disp<RNG[S.sw==='2000'?'200':'20'].max;
    const ok=!m.viaG&&rodOf(S.leads.E)&&m.pOnSpike&&m.cOnSpike&&!m.swap&&m.dEC>=10&&m.pct>=52&&m.pct<=72&&m.off<=Math.max(1,.1*m.dEC);
    const why=m.viaG?'หลักดินยังต่ออยู่กับบาร์กราวด์ตู้เมน ค่าที่อ่านได้รวมสายนิวทรัลของการไฟฟ้าฯ ที่ต่อลงดินหลายจุด (ขนานกัน) จึงต่ำกว่าค่าจริง ปลดสายดินจากบาร์ก่อนวัด'
      :m.swap?'สาย P และ C สลับกัน (เหลืองต้องไปหลัก P แดงไปหลัก C)':!m.pOnSpike||!m.cOnSpike?'สาย P/C ต้องต่อที่หลักช่วย ไม่ใช่หลักดินหรือบาร์กราวด์'
      :m.dEC<10?`หลัก C ห่างจากหลักดินเพียง ${fm(m.dEC)} ม. ควรห่างอย่างน้อย 10 ม. (E–P และ P–C ห่างช่วงละ 5–10 ม.)`
      :m.pct<52||m.pct>72?`หลัก P อยู่ที่ ${fm(m.pct,0)}% ของระยะ E–C ควรอยู่ราว 62% (ช่วง 52–72%)`:m.off>Math.max(1,.1*m.dEC)?'หลัก E, P, C ควรอยู่ในแนวเส้นตรง':'';
    S.log.push({pct:m.pct,dEC:m.dEC,R:disp,rng:S.sw,ok});if(S.log.length>12)S.log.shift();
    if(ok)S.valid={R:disp,key:rodKey(),rods:m.rods.map(r=>'R'+r.id)};
    const Lx=Math.max(0,...m.rods.map(r=>r.n*SEC)),far=Lx&&m.dEC<2.5*Lx?` · หลักยาว ${fm(Lx)} ม. ควรวาง C ห่าง ≥ 2.5 เท่า (${fm(2.5*Lx)} ม.) ค่าที่อ่านอาจคลาด`:'';
    S.mm=ok?['ok',`วัดถูกวิธี: ${S.lcd} Ω (P ที่ ${fm(m.pct,0)}% ของ ${fm(m.dEC)} ม.)${far}${lowRes?' · ค่าต่ำ หมุนไปย่านที่เล็กลงเพื่อให้อ่านละเอียดขึ้น':''} · ลองเลื่อน P ไป ±10% แล้ววัดซ้ำ ถ้าค่าใกล้เดิมแปลว่าระยะ C ไกลพอ`]:['warn',`อ่านได้ ${S.lcd} Ω แต่ยังไม่ใช่ค่าที่ถูกต้อง: ${why}`]}
  /* ---- edits ---- */
  const touchRods=()=>{S.ex=false};
  function connect(a,b){
    const isM=x=>/^M[EPC]$/.test(x);
    if(isM(a)&&isM(b)){S.msg=['err','ต่อขั้วเครื่องวัดเข้าหากันไม่ได้'];return}
    if(isM(a)||isM(b)){const m=isM(a)?a:b,o=isM(a)?b:a,k=m[1],d=dist(posOf(m),posOf(o));
      if(d>LEAD[k]){S.msg=['err',`สาย ${LNAME[k]} ไม่ถึง (ห่าง ${fm(d)} ม.) ย้ายเครื่องวัดหรือหลักช่วยให้ใกล้ขึ้น`];return}
      S.leads[k]=o;S.msg=['ok',`ต่อสาย ${LNAME[k]} แล้ว`];S.ex=false;return}
    if([a,b].some(x=>x==='P'||x==='C')){S.msg=['err','หลักช่วย P และ C ใช้ต่อกับสายของเครื่องวัดเท่านั้น ห้ามต่อสายดินเข้ากับหลักช่วย'];return}
    if(S.wires.some(w=>(w.a===a&&w.b===b)||(w.a===b&&w.b===a)))return;
    S.wires.push({a,b});S.msg=['ok',`ต่อสายดิน ${a==='G'?'บาร์กราวด์':a} – ${b==='G'?'บาร์กราวด์':b} ยาว ${fm(dist(posOf(a),posOf(b)))} ม.`];S.ex=false}
  const delRod=id=>{const t='R'+id;S.rods=S.rods.filter(r=>r.id!==id);S.wires=S.wires.filter(w=>w.a!==t&&w.b!==t);Object.keys(S.leads).forEach(k=>{if(S.leads[k]===t)delete S.leads[k]});if(S.sel===id)S.sel=null;touchRods()};
  const addRod=(m,n)=>{const r={id:S.nid++,x:m.x,y:m.y,n:n||1};S.rods.push(r);for(let k=0;k<r.n;k++)S.hits+=hitsOf(k);S.sel=r.id;touchRods();return r};
  function preset(k){
    S.rods=[];S.wires=[];S.leads={};S.sel=null;S.valid=null;
    const x0=5.5,y0=4.6,tri=s=>[[x0,y0],[x0+s,y0],[x0+s/2,y0-s*.866]];
    const P={one:[[x0,y0,1]],two:[[x0,y0,1],[x0+4.8,y0,1]],d24:tri(2.4),d48:tri(4.8),deep3:[[x0,y0,3]],deep5:[[x0,y0,5]]}[k];
    P.forEach(p=>addRod({x:p[0],y:p[1]},p[2]||1));S.sel=S.rods[0]&&S.rods[0].id;S.msg=['','วางหลักแล้ว ต่อสายดินระหว่างหลักให้ถึงกัน แล้วต่อสาย E ของเครื่องวัดเข้าที่หลักดิน'];
  }
  function example(){
    const rows=cmpRows().filter(r=>r.ext<=5),best=rows.filter(r=>r.R<=4.6).sort((a,b)=>a.len-b.len||a.R-b.R)[0]||rows.sort((a,b)=>a.R-b.R)[0];
    S.rods=[];S.wires=[];S.leads={};S.log=[];S.valid=null;const x0=4.5,y0=4.6;
    best.rods.forEach(p=>addRod({x:x0+p.x,y:y0+p.y},p.n));
    for(let i=1;i<S.rods.length;i++)S.wires.push({a:'R'+S.rods[i-1].id,b:'R'+S.rods[i].id});
    const E={x:S.rods.reduce((a,r)=>a+r.x,0)/S.rods.length,y:S.rods.reduce((a,r)=>a+r.y,0)/S.rods.length},dEC=Math.min(15,YW-.6-E.x);
    S.C={x:+(E.x+dEC).toFixed(1),y:+E.y.toFixed(1),water:S.soil!=='clay'||S.wet==='dry'};S.P={x:+(E.x+dEC*.62).toFixed(1),y:+E.y.toFixed(1),water:S.C.water};S.M={x:+(E.x+1.2).toFixed(1),y:+Math.min(YH-.9,E.y+2.2).toFixed(1)};
    const near=S.rods.slice().sort((a,b)=>dist(a,posOf('ME'))-dist(b,posOf('ME')))[0];
    S.leads={E:'R'+near.id,P:'P',C:'C'};S.sw='20';S.lcd='';S.sel=S.rods[0].id;S.ex=true;
    S.msg=['',`${best.R>5?`ดิน${so().n} ${S.wet==='wet'?'ฤดูฝน':'ฤดูแล้ง'} รูปแบบที่วางในพื้นที่แคบไม่มีแบบใดได้ ≤ 5 Ω ต้องกระจายหลายจุดให้ห่างกัน หรือขอการไฟฟ้าฯ ใช้เกณฑ์ 25 Ω · `:''}ตัวอย่าง: ${best.n} · หลักดินต่อสายถึงกันแล้ว สาย E-P-C ต่อพร้อม หลัก P ที่ 62% · กด TEST เพื่ออ่านค่า แล้วต่อสายดินจากหลักดินเข้าบาร์กราวด์ตู้เมน (ตัวอย่างไม่นับเป็นภารกิจ ลองทำเอง)`]}
  /* ---- comparison table: deep rod vs delta ---- */
  function cmpRows(){
    const tri=s=>[{x:0,y:0,n:1},{x:s,y:0,n:1},{x:s/2,y:-s*.866,n:1}];
    const C=[['1 หลัก 2.4 ม.',[{x:0,y:0,n:1}]],['2 หลัก ห่าง 2.4 ม.',[{x:0,y:0,n:1},{x:2.4,y:0,n:1}]],['2 หลัก ห่าง 4.8 ม.',[{x:0,y:0,n:1},{x:4.8,y:0,n:1}]],
      ['เดลต้า 3 หลัก ด้าน 2.4 ม.',tri(2.4)],['เดลต้า 3 หลัก ด้าน 4.8 ม.',tri(4.8)],
      ['หลักลึก 4.8 ม. (2 ท่อน)',[{x:0,y:0,n:2}]],['หลักลึก 7.2 ม. (3 ท่อน)',[{x:0,y:0,n:3}]],['หลักลึก 9.6 ม. (4 ท่อน)',[{x:0,y:0,n:4}]],['หลักลึก 12 ม. (5 ท่อน)',[{x:0,y:0,n:5}]],
      ['หลักลึก 7.2 ม. 2 จุด ห่าง 4.8 ม.',[{x:0,y:0,n:3},{x:4.8,y:0,n:3}]],['หลักลึก 12 ม. 2 จุด ห่าง 4.8 ม.',[{x:0,y:0,n:5},{x:4.8,y:0,n:5}]],['หลักลึก 12 ม. 2 จุด ห่าง 12 ม.',[{x:0,y:0,n:5},{x:12,y:0,n:5}]]];
    return C.map(([n,rods])=>{const sec=rods.reduce((a,r)=>a+r.n,0);let hit=0;rods.forEach(r=>{for(let k=0;k<r.n;k++)hit+=hitsOf(k)});
      const ext=Math.max(0,...rods.map(a=>Math.max(...rods.map(b=>Math.hypot(a.x-b.x,a.y-b.y)))));
      return{n,rods,R:sysR(rods),Rw:sysR(rods,'wet'),Rd:sysR(rods,'dry'),len:sec*SEC,sec,pts:rods.length,hit,ext}})}
  function renderCmp(){
    const rows=cmpRows(),c=v=>v<=5?'ok':v<=25?'warn':'bad',t=v=>v>=1000?fm(v,0):v>=100?fm(v,0):fm(v,1);
    $q('#geCmp').innerHTML=`<table class="t gecmpt"><thead><tr><th>รูปแบบ</th><th>ฤดูฝน (Ω)</th><th>ฤดูแล้ง (Ω)</th><th>แท่งรวม</th><th>จุดตอก</th><th>ตอก (ครั้ง) ≈</th></tr></thead><tbody>${rows.map(r=>`<tr${/เดลต้า/.test(r.n)?' class="gedel"':/ลึก/.test(r.n)?' class="gedeep"':''}><td>${r.n}</td><td class="${c(r.Rw)}">${t(r.Rw)}</td><td class="${c(r.Rd)}">${t(r.Rd)}</td><td>${r.sec} ท่อน (${fm(r.len)} ม.)</td><td>${r.pts}</td><td>${r.hit}</td></tr>`).join('')}</tbody></table>
     <p class="hint tight"><b>${esc(so().n)}:</b> ${esc(so().tip)} · สีเขียว ≤ 5 Ω ผ่านเกณฑ์ · สีเหลือง ≤ 25 Ω ใช้ได้เฉพาะพื้นที่ยากต่อการปฏิบัติที่การไฟฟ้าฯ เห็นชอบ · ${esc(so().rg)}</p>`}
  /* ---- drawing ---- */
  function plan(){
    const sx=so(),h=[],L=r=>r.n*SEC;
    h.push(`<text x="${OX}" y="${OY-30}" class="b0lab">ผังพื้นที่ (มองจากด้านบน) · 1 ช่อง = 1 ม.</text>`);
    h.push(`<rect x="${OX}" y="${OY}" width="${YW*K}" height="${YH*K}" fill="${sx.top}" stroke="var(--line)"/>`);
    for(let x=0;x<=YW;x++)h.push(`<line x1="${X(x)}" y1="${OY}" x2="${X(x)}" y2="${Y(YH)}" stroke="#000" stroke-opacity="${x%2?'.05':'.1'}"/>`+(x%2?'':`<text x="${X(x)}" y="${OY-6}" class="b0ax" text-anchor="middle">${x}</text>`));
    for(let y=0;y<=YH;y++)h.push(`<line x1="${OX}" y1="${Y(y)}" x2="${X(YW)}" y2="${Y(y)}" stroke="#000" stroke-opacity=".05"/>`);
    h.push(`<rect x="${OX}" y="${OY}" width="${1.2*K}" height="${YH*K}" fill="#f3e6d3" stroke="#a0522d" stroke-width="2"/><text x="${X(.6)}" y="${Y(6)}" class="b0lab" text-anchor="middle" transform="rotate(-90 ${X(.6)} ${Y(6)})">ผนังบ้าน</text>`);
    h.push(`<rect x="${X(.15)}" y="${Y(1.4)}" width="${1.05*K}" height="${1.6*K}" rx="4" fill="#dbe3ea" stroke="#55626e" stroke-width="1.6"/><text x="${X(.68)}" y="${Y(1.85)}" class="b0ax" text-anchor="middle">ตู้เมน</text><rect x="${X(.35)}" y="${Y(2.05)}" width="${.75*K}" height="7" fill="#1baf7a"/><text x="${X(.68)}" y="${Y(2.75)}" class="b0ax" text-anchor="middle">บาร์กราวด์</text>`);
    S.rods.forEach(r=>h.push(`<circle cx="${X(r.x)}" cy="${Y(r.y)}" r="${1.1*L(r)*K}" fill="#1a9c6e" fill-opacity=".07" stroke="#1a9c6e" stroke-opacity=".3" stroke-dasharray="4 4"/>`));
    const rs=S.rods;for(let i=0;i<rs.length;i++)for(let j=i+1;j<rs.length;j++){const a=rs[i],b=rs[j],s=dist(a,b);if(rs.length>5&&s>6)continue;const bad=s<Math.max(L(a),L(b))-.05;
      h.push(`<line x1="${X(a.x)}" y1="${Y(a.y)}" x2="${X(b.x)}" y2="${Y(b.y)}" stroke="${bad?'var(--warn)':'#55626e'}" stroke-width="1" stroke-dasharray="2 3"/><text x="${(X(a.x)+X(b.x))/2}" y="${(Y(a.y)+Y(b.y))/2-5}" class="b0ax" text-anchor="middle" fill="${bad?'var(--warn)':'var(--ink)'}">${fm(s)} ม.</text>`)}
    if(S.leads.E&&S.leads.C&&leadOk('E')){const cE=comp(S.leads.E),rr=S.rods.filter(r=>cE.has('R'+r.id)),E=rr.length?{x:rr.reduce((a,r)=>a+r.x,0)/rr.length,y:rr.reduce((a,r)=>a+r.y,0)/rr.length}:posOf('G'),Cp=posOf(S.leads.C),tx=E.x+(Cp.x-E.x)*.62,ty=E.y+(Cp.y-E.y)*.62;
      h.push(`<line x1="${X(E.x)}" y1="${Y(E.y)}" x2="${X(Cp.x)}" y2="${Y(Cp.y)}" stroke="#55626e" stroke-opacity=".5" stroke-dasharray="8 5"/><circle cx="${X(tx)}" cy="${Y(ty)}" r="9" fill="none" stroke="#d9a800" stroke-width="2" stroke-dasharray="3 2"/><text x="${X(tx)}" y="${Y(ty)+22}" class="b0ax" text-anchor="middle">62%</text>`)}
    S.wires.forEach((w,i)=>{const a=posOf(w.a),b=posOf(w.b);if(!a||!b)return;const d=`M${X(a.x)} ${Y(a.y)}L${X(b.x)} ${Y(b.y)}`;
      h.push(`<g class="geW" data-i="${i}"><path d="${d}" stroke="transparent" stroke-width="14"/><path d="${d}" stroke="#1baf7a" stroke-width="4"/><path d="${d}" stroke="#ffd400" stroke-width="4" stroke-dasharray="6 8"/></g><text x="${(X(a.x)+X(b.x))/2}" y="${(Y(a.y)+Y(b.y))/2+14}" class="b0ax" text-anchor="middle" fill="#137a55">${fm(dist(a,b))} ม.</text>`)});
    Object.keys(S.leads).forEach(k=>{const a=posOf('M'+k),b=posOf(S.leads[k]);if(!b)return;const ok=leadOk(k);
      h.push(`<path d="M${X(a.x)} ${Y(a.y)}Q${(X(a.x)+X(b.x))/2} ${Math.max(Y(a.y),Y(b.y))+18} ${X(b.x)} ${Y(b.y)}" fill="none" stroke="${LCOL[k]}" stroke-width="2.6" ${ok?'':'stroke-dasharray="5 4" stroke-opacity=".6"'}/>`+(ok?'':`<text x="${(X(a.x)+X(b.x))/2}" y="${(Y(a.y)+Y(b.y))/2}" class="b0ax" fill="var(--err)" text-anchor="middle">สาย ${k} ไม่ถึง</text>`))});
    if(S.wd&&S.wd.moved){const a=posOf(S.wd.a);h.push(`<line id="geRub" x1="${X(a.x)}" y1="${Y(a.y)}" x2="${S.wd.p.x}" y2="${S.wd.p.y}" stroke="var(--accent)" stroke-width="3" stroke-dasharray="6 4" pointer-events="none"/>`)}
    S.rods.forEach(r=>{const on=S.sel===r.id;h.push(`<g class="geO" data-k="rod" data-id="${r.id}"><circle cx="${X(r.x)}" cy="${Y(r.y)}" r="${on?13:11}" fill="#b87333" stroke="${on?'var(--accent)':'#6b3f16'}" stroke-width="${on?4:2}"/><circle cx="${X(r.x)}" cy="${Y(r.y)}" r="4" fill="#e7b07a"/></g>
      <text x="${X(r.x)}" y="${Y(r.y)+28}" class="b0lab" text-anchor="middle">R${r.id} · ${fm(L(r))} ม.</text>`)});
    ['P','C'].forEach(k=>{const p=S[k];h.push(`<g class="geO" data-k="${k}"><path d="M${X(p.x)} ${Y(p.y)-12}L${X(p.x)+10} ${Y(p.y)+8}H${X(p.x)-10}Z" fill="${LCOL[k]}" stroke="#333" stroke-width="1.4"/>${p.water?`<ellipse cx="${X(p.x)}" cy="${Y(p.y)+10}" rx="16" ry="5" fill="#4aa3df" opacity=".45"/>`:''}</g><text x="${X(p.x)}" y="${Y(p.y)+26}" class="b0lab" text-anchor="middle">หลักช่วย ${k}</text>`)});
    {const x=X(S.M.x),y=Y(S.M.y);h.push(`<g class="geO" data-k="M"><rect x="${x-.9*K}" y="${y-.55*K}" width="${1.8*K}" height="${1.05*K}" rx="6" fill="#3d4650" stroke="#1f262c"/><rect x="${x-.6*K}" y="${y-.42*K}" width="${1.2*K}" height="${.36*K}" rx="2" fill="#c9d8b9"/><text x="${x}" y="${y-.15*K}" text-anchor="middle" font-size="11" font-family="monospace" fill="#1f262c">${S.sw==='OFF'?'':esc(S.lcd||'')}</text></g><text x="${x}" y="${y-.7*K}" class="b0ax" text-anchor="middle">เครื่องวัด</text>`)}
    const T=[['G','บาร์กราวด์'],...S.rods.map(r=>['R'+r.id,'']),['P',''],['C',''],['ME','E'],['MP','P'],['MC','C']];
    T.forEach(([id,lab])=>{const p=posOf(id);if(!p)return;const isR=id[0]==='R',isS=id==='P'||id==='C',ox=isR?16:0,oy=isR?-15:isS?-26:0,col=id[0]==='M'?LCOL[id[1]]:'#1baf7a',on=S.pick===id||(S.wd&&S.wd.a===id);
      h.push(`<g class="geT" data-t="${id}" role="button" tabindex="0" aria-label="ขั้ว ${id}"><circle cx="${X(p.x)+ox}" cy="${Y(p.y)+oy}" r="11" fill="transparent"/><circle cx="${X(p.x)+ox}" cy="${Y(p.y)+oy}" r="${on?8:6}" fill="${on?'var(--accent)':'#fff'}" stroke="${col}" stroke-width="3"/>${id[0]==='M'?`<text x="${X(p.x)}" y="${Y(p.y)+19}" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">${lab}</text>`:''}</g>`)});
    if(S.tool)h.push(`<text x="${X(YW)-6}" y="${OY+18}" class="b0lab" text-anchor="end" fill="var(--accent)">แตะบนพื้นดินเพื่อปักหลัก</text>`);
    return h.join('')}
  function section(){
    const sx=so(),h=[],w=S.wet,top=Math.min(DMAX,hh());
    h.push(`<text x="${X(1.5)}" y="${SY-34}" class="b0lab">ภาพตัดดิน (มองจากด้านหน้า) · ความลึก (ม.)</text>`);
    h.push(`<rect x="${OX}" y="${SY}" width="${YW*K}" height="${top*KS}" fill="${sx.col}" opacity="${w==='dry'?.75:1}"/><rect x="${OX}" y="${DZ(top)}" width="${YW*K}" height="${(DMAX-top)*KS}" fill="${sx.col2}"/>`);
    if(S.soil==='lat')for(let k=0;k<70;k++){const a=(k*97%100)/100,b=(k*53%100)/100;h.push(`<circle cx="${OX+a*YW*K}" cy="${SY+4+b*(top*KS-8)}" r="${2+(k%3)}" fill="#7a3a1c" opacity=".55"/>`)}
    if(S.soil==='sand')h.push(`<path d="M${OX} ${DZ(top)}H${X(YW)}" stroke="#2a78d6" stroke-width="2" stroke-dasharray="10 6"/><text x="${X(YW)-6}" y="${DZ(top)-6}" class="b0ax" text-anchor="end" fill="#1d5ea8">ระดับน้ำใต้ดิน</text>`);
    h.push(`<rect x="${X(YW)-232}" y="${SY+6}" width="226" height="38" rx="6" fill="var(--surface)" opacity=".88"/><text x="${X(YW)-224}" y="${SY+21}" class="b0ax">${esc(sx.l1)}: ${fm(r1(),0)} Ω·m</text><text x="${X(YW)-224}" y="${SY+37}" class="b0ax">${w==='dry'?'ฤดูแล้ง (ดินแห้ง)':'ฤดูฝน (ดินชื้น)'} · หนา ${fm(hh())} ม.</text>`);
    h.push(`<rect x="${X(YW)-232}" y="${DZ(top)+8}" width="226" height="22" rx="6" fill="var(--surface)" opacity=".88"/><text x="${X(YW)-224}" y="${DZ(top)+23}" class="b0ax">${esc(sx.l2)}: ${fm(r2(),0)} Ω·m</text>`);
    for(let d=0;d<=12;d+=2)h.push(`<text x="${OX-6}" y="${DZ(d)+4}" class="b0ax" text-anchor="end">${d}</text><line x1="${OX}" y1="${DZ(d)}" x2="${OX+6}" y2="${DZ(d)}" stroke="var(--ink)"/>`);
    h.push(`<rect x="${OX}" y="${SY-10}" width="${YW*K}" height="10" fill="${sx.top}"/><rect x="${OX}" y="${SY-56}" width="${1.2*K}" height="56" fill="#f3e6d3" stroke="#a0522d"/>`);
    S.rods.forEach(r=>{const L=r.n*SEC,x=X(r.x);h.push(`<ellipse cx="${x}" cy="${SY}" rx="${1.1*L*K}" ry="${1.1*L*KS}" fill="#1a9c6e" fill-opacity=".1" stroke="#1a9c6e" stroke-opacity=".35" stroke-dasharray="4 4" clip-path="url(#geClip)"/>`)});
    S.rods.forEach(r=>{const L=r.n*SEC,x=X(r.x),on=S.sel===r.id;h.push(`<rect x="${x-3}" y="${SY-14}" width="6" height="${L*KS+14}" fill="#b87333" stroke="${on?'var(--accent)':'#6b3f16'}" stroke-width="${on?2:1}"/>`);
      for(let k=1;k<r.n;k++)h.push(`<rect x="${x-5}" y="${DZ(k*SEC)-4}" width="10" height="8" rx="2" fill="#8d8d8d" stroke="#555"/>`);
      h.push(`<rect x="${x-7}" y="${SY-18}" width="14" height="8" rx="2" fill="#9aa5ae" stroke="#555"/><text x="${x+8}" y="${DZ(L)+4}" class="b0ax">R${r.id} ${fm(L)} ม.</text>`)});
    ['P','C'].forEach(k=>{const x=X(S[k].x);h.push(`<path d="M${x} ${SY-12}V${SY+.3*KS}" stroke="${LCOL[k]}" stroke-width="4"/><text x="${x}" y="${SY-16}" class="b0ax" text-anchor="middle">${k}</text>`)});
    return`<defs><clipPath id="geClip"><rect x="${OX}" y="${SY}" width="${YW*K}" height="${DMAX*KS}"/></clipPath></defs>`+h.join('')}
  function meter(){
    const on=S.sw!=='OFF',pos={OFF:210,V:245,'2000':285,'200':325,'20':5},lab={OFF:'OFF',V:'~V',2000:'2000Ω',200:'200Ω',20:'20Ω'},cx=104,cy=168,a=pos[S.sw]*Math.PI/180;
    let disp=S.lcd,unit=S.lcdU;
    if(S.sw==='V'){const okE=leadOk('E')&&S.leads.E,okP=leadOk('P')&&S.leads.P;disp=okE&&okP?(comp(S.leads.E).has('G')?'0.8':'0.1'):'0.0';unit='V'}
    const kn=Object.keys(pos).map(k=>{const t=pos[k]*Math.PI/180,x=cx+Math.cos(t)*56,y=cy+Math.sin(t)*56;return`<g class="gesw" data-sw="${k}" role="button" tabindex="0" aria-pressed="${S.sw===k}"><rect x="${x-25}" y="${y-11}" width="50" height="22" rx="6" fill="${S.sw===k?'#ffd23f':'transparent'}"/><text x="${x}" y="${y+4}" text-anchor="middle" font-size="12" font-weight="700" fill="${S.sw===k?'#1f262c':'#e9edf0'}">${lab[k]}</text></g>`}).join('');
    const term=['E','P','C'].map((k,i)=>{const c=!!S.leads[k]&&leadOk(k);return`<circle cx="${214+i*48}" cy="${226}" r="13" fill="${c?LCOL[k]:'#1f262c'}" stroke="${LCOL[k]}" stroke-width="4"/><text x="${214+i*48}" y="${252}" text-anchor="middle" font-size="12" font-weight="700" fill="#e9edf0">${k}</text>`}).join('');
    met.innerHTML=`<rect x="6" y="6" width="348" height="250" rx="18" fill="#3d4650" stroke="#1f262c" stroke-width="2"/>
     <rect x="28" y="20" width="304" height="70" rx="8" fill="${on?'#c9d8b9':'#8f9a8a'}" stroke="#1f262c" stroke-width="2"/>
     <text x="300" y="72" text-anchor="end" font-size="44" font-family="monospace" font-weight="600" fill="#1f262c">${on?esc(disp||''):''}</text><text x="322" y="72" text-anchor="end" font-size="15" font-weight="700" fill="#1f262c">${on?esc(unit||''):''}</text>
     <text x="38" y="38" font-size="11" fill="#1f262c">${on&&/^(20|200|2000)$/.test(S.sw)?'EARTH Ω':on?'EARTH VOLTAGE':''}</text>
     <circle cx="${cx}" cy="${cy}" r="30" fill="#e9edf0" stroke="#1f262c" stroke-width="2"/><line x1="${cx}" y1="${cy}" x2="${cx+Math.cos(a)*26}" y2="${cy+Math.sin(a)*26}" stroke="#d62828" stroke-width="5" stroke-linecap="round"/>${kn}
     <g class="getest" role="button" tabindex="0" aria-label="กดปุ่ม TEST"><circle cx="262" cy="150" r="30" fill="${/^(20|200|2000)$/.test(S.sw)?'#ffd23f':'#7d8a96'}" stroke="#1f262c" stroke-width="3"/><text x="262" y="146" text-anchor="middle" font-size="11" font-weight="700" fill="#1f262c">PRESS</text><text x="262" y="160" text-anchor="middle" font-size="11" font-weight="700" fill="#1f262c">TO TEST</text></g>
     ${term}<text x="22" y="246" font-size="10" fill="#c3ced8">จำลองแบบ KEW 4105A · 20/200/2000 Ω · กระแสวัด 2 mA</text>`;
    const mm=$q('#geMm');b0Msg(mm,S.mm[0]==='ok'?true:S.mm[0]==='err'?false:null,S.mm[1]||(S.sw==='OFF'?'หมุนสวิตช์ไปที่ ~V เพื่อตรวจแรงดันดินก่อน (ควรไม่เกิน 3 V) แล้วเลือกย่าน Ω และกด TEST':S.sw==='V'?'แรงดันดินควรไม่เกิน 3 V ถ้าสูงกว่านี้ค่าที่วัดจะคลาดมาก ให้ปลดอุปกรณ์ที่ต่ออยู่ก่อน':'กด PRESS TO TEST เพื่ออ่านค่า'))}
  function logView(){
    const L=S.log;if(!L.length){$q('#geLog').innerHTML='<p class="hint tight">กด TEST แล้วค่าจะบันทึกที่นี่ · ลองวัดหลายตำแหน่งของหลัก P (เช่น 40%, 52%, 62%, 72%, 85%) เพื่อดูช่วงที่ค่าคงที่</p>';return}
    const ym=Math.max(1,...L.map(r=>r.R))*1.35,ys=ym>20?Math.ceil(ym/10)*10:Math.ceil(ym);
    $q('#geLog').innerHTML=b0Chart({W:520,H:210,xmax:100,ymax:ys,xl:'ตำแหน่งหลัก P (% ของระยะ E–C)',yl:'ค่าที่อ่าน (Ω)',aria:'ค่าที่อ่านได้เทียบตำแหน่งหลัก P',
      series:[{pts:[[62,0],[62,ys]],col:'#d9a800',dash:1},{pts:[[0,5],[100,5]],col:'#1a9c6e',dash:1}],dots:L.map(r=>({x:Math.max(0,Math.min(100,r.pct)),y:Math.min(r.R,ys),col:r.ok?'#1a9c6e':'#e67e22'}))})
      +`<table class="t gelogt"><thead><tr><th>#</th><th>P (%)</th><th>E–C (ม.)</th><th>ย่าน</th><th>ค่าที่อ่าน</th></tr></thead><tbody>${L.map((r,i)=>`<tr><td>${i+1}</td><td>${fm(r.pct,0)}</td><td>${fm(r.dEC)}</td><td>${r.rng} Ω</td><td class="${r.ok?'ok':''}">${r.R.toFixed(RNG[r.rng].d)} Ω${r.ok?' ✓':''}</td></tr>`).join('')}</tbody></table>`}
  function checks(){
    const ck=[],add=(l,t)=>ck.push([l,t]),Ls=r=>r.n*SEC;
    add('idle',`${so().n} ${S.wet==='wet'?'ฤดูฝน':'ฤดูแล้ง'}: ชั้นบน ${fm(r1(),0)} Ω·m หนา ${fm(hh())} ม. · ชั้นล่าง ${fm(r2(),0)} Ω·m · ${so().tip}`);
    if(!S.rods.length)add('err','ยังไม่มีหลักดิน กด "➕ ปักหลัก" แล้วแตะบนพื้นดิน หรือเลือกรูปแบบสำเร็จ');
    const rs=S.rods,near=[];for(let i=0;i<rs.length;i++)for(let j=i+1;j<rs.length;j++){const s=dist(rs[i],rs[j]),L=Math.max(Ls(rs[i]),Ls(rs[j]));if(s<L-.05)near.push(`R${rs[i].id}–R${rs[j].id} ห่าง ${fm(s)} ม.`)}
    if(near.length)add('warn',`${near.slice(0,4).join(', ')}${near.length>4?' …':''} น้อยกว่าความยาวหลัก พื้นที่ส่งผลซ้อนกัน ค่าลดลงน้อย ควรห่างอย่างน้อยเท่าความยาวหลัก ดีที่สุดราว 2 เท่า`);
    else if(rs.length>1)add('ok','ระยะห่างระหว่างหลักไม่น้อยกว่าความยาวหลัก');
    if(rs.length>1){const c=comp('R'+rs[0].id),cut=rs.filter(r=>!c.has('R'+r.id));if(cut.length)add('warn',`${cut.map(r=>'R'+r.id).join(', ')} ยังไม่ได้ต่อสายดินถึงหลักอื่น หลักที่ไม่ได้ต่อจะไม่ช่วยลดค่า (ลากสายจากแคลมป์หลักหนึ่งไปอีกหลัก)`);else add('ok','หลักดินทุกต้นต่อสายดินถึงกันแล้ว')}
    const key=rodKey(),v=S.valid&&S.valid.key===key?S.valid:null;
    if(S.valid&&!v)add('warn','หลักดินหรือสภาพดินเปลี่ยนหลังวัด ต้องวัดใหม่');
    if(!v)add('idle','ยังไม่มีค่าที่วัดถูกวิธี: ปลดสายดินจากตู้เมน · สาย E หนีบหลักดิน · หลักช่วย C ห่าง ≥ 10 ม. · หลักช่วย P ราว 62% ในแนวเส้นตรง · ตรวจแรงดันดิน (~V) · เลือกย่าน Ω แล้วกด TEST');
    else add(v.R<=5?'ok':v.R<=25?'warn':'err',v.R<=5?`วัดได้ ${v.R} Ω ไม่เกิน 5 Ω ผ่านเกณฑ์`:v.R<=25?`วัดได้ ${v.R} Ω เกิน 5 Ω: ปักหลักเพิ่มแล้ววัดใหม่ (ค่าไม่เกิน 25 Ω ใช้ได้เฉพาะพื้นที่ยากต่อการปฏิบัติที่การไฟฟ้าฯ เห็นชอบ)`:`วัดได้ ${v.R} Ω สูงเกินไป เพิ่มหลัก (เว้นระยะ) หรือตอกหลักลึกให้ถึงชั้นดินชื้น ดูตารางเปรียบเทียบด้านล่าง`);
    const cg=comp('G'),gOk=rs.length&&rs.every(r=>cg.has('R'+r.id));
    add(gOk?'ok':v?'err':'idle',gOk?'ต่อสายดินจากหลักดินเข้าบาร์กราวด์ตู้เมนแล้ว':v?'วัดเสร็จแล้ว ต่อสายดินจากหลักดินกลับเข้าบาร์กราวด์ตู้เมน':'หลังวัดเสร็จ ต้องต่อสายดินจากหลักดินเข้าบาร์กราวด์ตู้เมน (ระหว่างวัดให้ปลดไว้)');
    const pass=!!v&&v.R<=5&&gOk&&!S.ex;b0Task('t9',pass);
    $q('#geCk').innerHTML=ck.map(([l,t])=>`<li><span class="b ${l}">${l==='ok'?'✓':l==='warn'?'!':l==='idle'?'i':'✗'}</span><span>${esc(t)}</span></li>`).join('');
    const gm=$q('#geMsg');if(pass)b0Msg(gm,true,`ภารกิจสำเร็จ: หลักดิน ${v.R} Ω ต่อเข้าบาร์กราวด์ตู้เมนแล้ว`);else if(S.msg[1])b0Msg(gm,S.msg[0]==='ok'?true:S.msg[0]==='err'?false:null,S.msg[1]);else b0Msg(gm,null,'');}
  function palette(){
    const sel=S.rods.find(r=>r.id===S.sel),chip=(a,v,on,t)=>`<button class="chip sm" type="button" data-${a}="${v}" aria-pressed="${on}">${t}</button>`;
    const wl=S.wires.reduce((a,w)=>{const p=posOf(w.a),q=posOf(w.b);return a+(p&&q?dist(p,q):0)},0),sec=S.rods.reduce((a,r)=>a+r.n,0);
    $q('#gePal').innerHTML=`<div class="b8grp"><b>ชนิดดิน</b><div class="b8row">${Object.keys(GE_SOIL).map(k=>chip('soil',k,S.soil===k,GE_SOIL[k].n)).join('')}</div>
      <div class="b8row">${chip('wet','wet',S.wet==='wet','🌧 ฤดูฝน (ชื้น)')}${chip('wet','dry',S.wet==='dry','☀ ฤดูแล้ง (แห้ง)')}</div><small class="muted">ควรวัดและออกแบบเผื่อฤดูแล้ง ซึ่งค่าสูงที่สุด</small></div>
     <div class="b8grp"><b>ปักหลักดิน</b><div class="b8row">${chip('act','tool',S.tool,'➕ ปักหลัก (แตะพื้นดิน)')}</div>
      <div class="b8row">${chip('pre','one',false,'1 หลัก')}${chip('pre','two',false,'2 หลัก ห่าง 4.8 ม.')}${chip('pre','d24',false,'เดลต้า ด้าน 2.4 ม.')}${chip('pre','d48',false,'เดลต้า ด้าน 4.8 ม.')}${chip('pre','deep3',false,'หลักลึก 7.2 ม.')}${chip('pre','deep5',false,'หลักลึก 12 ม.')}</div>
      <small class="muted">หลักเหล็กหุ้มทองแดง Ø 16 มม. ยาว 2.4 ม. ต่อท่อน ปักลึกอย่างน้อย 2.4 ม. · ลากหลักเพื่อย้าย</small></div>
     <div class="b8grp"><b>หลักที่เลือก</b>${sel?`<span>R${sel.id} ยาว ${fm(sel.n*SEC)} ม. (${sel.n} ท่อน${sel.n>1?` ข้อต่อ ${sel.n-1} ตัว`:''})</span>
      <div class="b8row">${chip('act','deep',false,'⬇ ตอกต่อแท่ง +2.4 ม.')}${chip('act','up',false,'⬆ ถอน 1 ท่อน')}${chip('act','del',false,'🗑 ถอนหลัก')}</div>${S.soil==='lat'&&sel.n>=2?'<small class="muted">ลูกรังแข็ง ตอกลึกต้องใช้เครื่องตอกหรือเจาะนำ</small>':''}`:'<small class="muted">แตะหลักดินในผังเพื่อเลือก</small>'}</div>
     <div class="b8grp"><b>สาย</b><small class="muted">แตะขั้ววงกลม แล้วแตะขั้วปลายทาง (หรือกดค้างลากไปปล่อย) · แตะสายดินเพื่อลบ · สายเครื่องวัด: E เขียว 5 ม. · P เหลือง 10 ม. · C แดง 20 ม.</small>
      <div class="b8row">${chip('act','water',S.P.water&&S.C.water,'💧 รดน้ำรอบหลักช่วย')}${chip('act','clrw',false,'ลบสายทั้งหมด')}</div>
      <div class="b8row">${chip('act','ex',false,'ตัวอย่างพร้อมวัด')}${chip('act','reset',false,'เริ่มใหม่')}</div></div>
     <div class="b8grp"><b>วัสดุที่ใช้</b><small>หลักดิน ${S.rods.length} จุด · แท่ง ${sec} ท่อน (${fm(sec*SEC)} ม.) · ข้อต่อ ${Math.max(0,sec-S.rods.length)} · แคลมป์ ${S.rods.length} · สายดิน ${fm(wl)} ม. · ตอกแล้วประมาณ ${S.hits} ครั้ง</small></div>`}
  function draw(full){svg.innerHTML=plan()+section();if(full===false)return;meter();palette();logView();checks()}
  /* ---- events ---- */
  svg.addEventListener('pointerdown',e=>{
    const t=e.target.closest('.geT');
    if(t){e.preventDefault();const id=t.dataset.t;if(S.pick&&S.pick!==id){connect(S.pick,id);S.pick=null;draw();return}
      S.wd={a:id,p:pt(e),moved:false};try{svg.setPointerCapture(e.pointerId)}catch(_){}return}
    const w=e.target.closest('.geW');if(w){S.wires.splice(+w.dataset.i,1);S.msg=['','ลบสายแล้ว'];S.ex=false;draw();return}
    const o=e.target.closest('.geO');if(o){e.preventDefault();S.drag={k:o.dataset.k,id:+o.dataset.id,p0:pt(e),moved:false};try{svg.setPointerCapture(e.pointerId)}catch(_){}return}
    const p=pt(e);if(S.tool&&inPlan(p)){const m=clampM(toM(p),1.6);if(!freeSpot(m)){S.msg=['err','ใกล้หลักเดิมเกินไป']}else{addRod({x:+m.x.toFixed(1),y:+m.y.toFixed(1)});S.msg=['ok',`ปักหลัก R${S.nid-1} แล้ว ตอกลงลึก 2.4 ม. (${hitsOf(0)} ครั้งโดยประมาณ)`]}draw();return}
    if(S.pick||S.sel){S.pick=null;draw()}});
  svg.addEventListener('pointermove',e=>{
    if(S.wd){const p=pt(e);if(!S.wd.moved&&Math.hypot(p.x-S.wd.p.x,p.y-S.wd.p.y)>8)S.wd.moved=true;S.wd.p=p;if(S.wd.moved)draw(false);return}
    if(S.drag){const p=pt(e);if(!S.drag.moved&&Math.hypot(p.x-S.drag.p0.x,p.y-S.drag.p0.y)<6)return;S.drag.moved=true;
      const k=S.drag.k,m=clampM(toM(p),k==='rod'?1.6:k==='M'?1.3:.6);
      if(k==='rod'){const r=S.rods.find(x=>x.id===S.drag.id);if(r&&freeSpot(m,r.id)){r.x=+m.x.toFixed(1);r.y=+m.y.toFixed(1);S.ex=false}}else if(k==='M'){S.M={x:+Math.max(1.3,Math.min(YW-1,m.x)).toFixed(1),y:+Math.max(.7,Math.min(YH-.7,m.y)).toFixed(1)}}else S[k]=Object.assign(S[k],{x:+m.x.toFixed(1),y:+m.y.toFixed(1)});
      draw(false)}});
  const up=e=>{
    if(S.wd){const wd=S.wd;S.wd=null;const tgt=wd.moved&&document.elementFromPoint(e.clientX,e.clientY),te=tgt&&tgt.closest&&tgt.closest('#geSvg .geT');
      if(wd.moved&&te&&te.dataset.t!==wd.a)connect(wd.a,te.dataset.t);else if(!wd.moved)S.pick=S.pick===wd.a?null:wd.a;draw();return}
    if(S.drag){const d=S.drag;S.drag=null;if(!d.moved&&d.k==='rod')S.sel=S.sel===d.id?null:d.id;draw()}};
  svg.addEventListener('pointerup',up);svg.addEventListener('pointercancel',()=>{S.wd=null;S.drag=null;draw()});
  $q('#gePal').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.soil){S.soil=b.dataset.soil;S.ex=false;renderCmp()}else if(b.dataset.wet){S.wet=b.dataset.wet;S.ex=false;renderCmp()}
    else if(b.dataset.pre)preset(b.dataset.pre);
    else if(b.dataset.act){const a=b.dataset.act,sel=S.rods.find(r=>r.id===S.sel);
      if(a==='tool')S.tool=!S.tool;
      else if(a==='deep'&&sel){if(sel.n>=5)S.msg=['err','ในแบบจำลองตอกได้ลึกสุด 5 ท่อน (12 ม.)'];else{S.hits+=hitsOf(sel.n);sel.n++;S.msg=['ok',`ต่อแท่งด้วยข้อต่อแล้วตอกลง R${sel.id} ลึก ${fm(sel.n*SEC)} ม. (ตอกท่อนนี้ราว ${hitsOf(sel.n-1)} ครั้ง)`];touchRods()}}
      else if(a==='up'&&sel){if(sel.n>1){sel.n--;touchRods()}}
      else if(a==='del'&&sel)delRod(sel.id);
      else if(a==='water'){const on=!(S.P.water&&S.C.water);S.P.water=on;S.C.water=on;S.msg=['',on?'รดน้ำรอบหลักช่วยแล้ว ความต้านทานหลักช่วยลดลง (รดเฉพาะหลักช่วย ห้ามรดหลักดินที่กำลังวัด เพราะจะได้ค่าต่ำกว่าความจริง)':'หลักช่วยแห้ง']}
      else if(a==='clrw'){S.wires=[];S.leads={};S.ex=false}
      else if(a==='ex')example();
      else if(a==='reset'){Object.assign(S,{rods:[],nid:1,wires:[],leads:{},log:[],valid:null,sel:null,pick:null,sw:'OFF',lcd:'',mm:['',''],ex:false,hits:0,P:{x:12.5,y:7.8,water:false},C:{x:20,y:7.8,water:false},M:{x:4,y:7.6},msg:['','']});addRod({x:5,y:4})}}
    draw()});
  met.addEventListener('click',e=>{const s=e.target.closest('.gesw');if(s){S.sw=s.dataset.sw;S.lcd='';S.mm=['',''];draw();return}
    if(e.target.closest('.getest')){test();draw()}});
  met.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const s=e.target.closest('.gesw,.getest');if(!s)return;e.preventDefault();s.dispatchEvent(new MouseEvent('click',{bubbles:true}))});
  $q('#geClr').addEventListener('click',()=>{S.log=[];logView()});
  el.querySelector('.b0gtab').addEventListener('click',e=>{const b=e.target.closest('[data-gv]');if(!b)return;const f=b.dataset.gv==='fault';
    el.querySelectorAll('.b0gtab [data-gv]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$q('#geRod').hidden=f;const fd=$q('#geFault');fd.hidden=!f;
    if(f&&!fd.dataset.on){fd.dataset.on='1';b0EarthFault(fd)}});
  renderCmp();draw();
}

/* ไฟรั่วลงโครง: มี/ไม่มีสายดิน และ RCD (แบบจำลองเดิมของหัวข้อนี้) */
function b0EarthFault(el){
  el.innerHTML=`<div class="b0tog"><label class="chk"><input type="checkbox" id="b9pe" checked> ต่อสายดินที่โครงเครื่อง</label><label class="chk"><input type="checkbox" id="b9rcd" checked> มี RCD/RCBO 30 mA</label><label class="chk"><input type="checkbox" id="b9f"> เกิดไฟรั่วลงโครง</label><label class="chk"><input type="checkbox" id="b9h" checked> มีคนจับโครงเครื่อง</label></div>${b0Rng('b9r','ความต้านทานหลักดิน (Ω)',1,100,1,5,' Ω')}<div id="b9s"></div><div id="b9o"></div>`;
  const run=()=>{const pe=el.querySelector('#b9pe').checked,rcd=el.querySelector('#b9rcd').checked,fa=el.querySelector('#b9f').checked,hu=el.querySelector('#b9h').checked,rg=b0V('b9r');
   let rows,lvl='ok',t;
   if(!fa){rows=[['สถานะ','ปกติ ไม่มีไฟรั่ว'],['แรงดันที่โครง','0 V']];t='ลองติ๊ก "เกิดไฟรั่วลงโครง"'}
   else{const Rb=1000,Rsrc=1+rg; /* fault loop through PE: source/neutral earth ~1 Ω + electrode */
    if(pe){const If=230/(Rsrc+0.5),Vt=If*0.5;rows=[['กระแสรั่วผ่านสายดิน',b0f(If,1)+' A'],['แรงดันสัมผัสที่โครง',b0f(Math.min(230,Vt),0)+' V'],['ผล',rcd?'RCD ตัดวงจรภายในราว 0.03 วินาที':If>=200?'เบรกเกอร์ตัดเพราะกระแสสูง':'เบรกเกอร์อาจไม่ตัด (กระแสไม่พอ) ควรมี RCD']];lvl=rcd||If>=200?'ok':'warn';t=rcd?'ปลอดภัย: สายดินพากระแสลงดินและเครื่องตัดทำงาน':'มีสายดินแต่ไม่มี RCD: ถ้าหลักดินมีความต้านทานสูง กระแสอาจไม่พอให้เบรกเกอร์ตัด โครงจะมีไฟค้าง'}
    else{const Ib=hu?230/(Rb+Rsrc)*1000:0;rows=[['แรงดันที่โครง','≈ 230 V (ไม่มีทางให้กระแสไหลลงดิน)'],['กระแสผ่านร่างกาย',hu?b0f(Ib,0)+' mA':'—'],['ผล',hu?(rcd?'RCD ตัดหลังมีกระแสผ่านคน (ยังโดนดูดชั่วขณะ)':'อันตรายถึงชีวิต: ไม่มีอะไรตัดวงจร'):'โครงมีไฟค้างรอคนมาจับ']];lvl=hu&&!rcd?'err':'warn';t=hu&&!rcd?'อันตรายมาก: ไม่มีสายดินและไม่มี RCD':'ไม่มีสายดิน: แม้มี RCD ก็ต้องให้กระแสผ่านคนก่อนจึงตัด'}}
   {const danger=fa&&!pe&&hu,trip=fa&&rcd,cur=fa&&pe;el.querySelector('#b9s').innerHTML=`<svg viewBox="0 0 520 150" class="b0ill" role="img" aria-label="ไฟรั่วลงโครงเครื่อง สายดิน และคนสัมผัส">
     <path d="M20 30H120" stroke="#8b5a2b" stroke-width="3"/><text x="20" y="22" class="b0ax">L 230 V</text>
     <rect x="120" y="16" width="34" height="28" rx="4" fill="${rcd?'#fff':'var(--band)'}" stroke="var(--ink)" stroke-width="1.6"/><text x="137" y="34" text-anchor="middle" class="b0ax">${rcd?(trip?'ตัด':'RCD'):'—'}</text>
     <path d="M154 30H210" stroke="${trip?'var(--muted)':'#8b5a2b'}" stroke-width="3" ${trip?'stroke-dasharray="4 4"':''}/>
     <rect x="210" y="14" width="110" height="80" rx="8" fill="#e8ecef" stroke="${fa&&!trip?'#e53935':'var(--ink)'}" stroke-width="${fa&&!trip?3:2}"/><text x="265" y="58" text-anchor="middle" class="b0lab">เครื่องใช้ไฟฟ้า</text>
     ${fa?B0G.bolt(228,22,22,trip?'#cfd8dc':'#ffc400'):''}
     ${pe?`<path d="M240 94V128" stroke="#1a9c6e" stroke-width="3" ${cur?'stroke-dasharray="6 4"':''}/>${B0G.gnd(240,126,20)}<text x="252" y="116" class="b0ax">PE ${rg} Ω</text>`:`<text x="222" y="116" class="b0ax">ไม่มีสายดิน</text>`}
     ${hu?`<path d="M320 52H352" stroke="${danger?'#e53935':'var(--muted)'}" stroke-width="2.5"/>${B0G.person(372,40,70,danger?'#e53935':'#55626e')}${danger?B0G.bolt(392,36,22,'#ff7043'):''}`:''}
     <text x="440" y="74" class="b0lab" fill="${!fa?'var(--muted)':danger?'#e53935':trip||cur?'var(--ok)':'var(--warn)'}">${!fa?'ปกติ':danger?'อันตราย!':trip?'ปลอดภัย':'ระวัง'}</text></svg>`}
   el.querySelector('#b9o').innerHTML=b0Kv(rows)+`<p class="b0msg ${lvl==='ok'?'ok':lvl==='err'?'err':''}">${t}</p>`};
  ['b9pe','b9rcd','b9f','b9h'].forEach(id=>el.querySelector('#'+id).addEventListener('change',run));b0Bind(el,['b9r'],run,[' Ω']);
}
