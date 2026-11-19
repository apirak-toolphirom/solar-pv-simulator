/* ---- เมนู 17 หน้า "อ่าน log": กราฟวิเคราะห์เลือกเส้นเองได้ ----
   ใช้ทุกคอลัมน์ตัวเลขของไฟล์รายช่วงเวลาที่นำเข้า (ไม่จำกัดเฉพาะคอลัมน์ที่ระบบจับคู่ไว้) แสดงหลายเส้นในกราฟเดียว
   เปิด/ปิดเส้นได้ · แกนตามหน่วย (ซ้าย/ขวา) หรือปรับสเกลเทียบกัน · ลากเลือกช่วงเวลา → ตารางสถิติ + ข้อสังเกตของช่วงนั้น
   ข้อมูลอยู่ในหน่วยความจำของหน้าเท่านั้น (เหมือน hwlog.js) */
const HWP={gran:'day',sim:{on:false,pr:.8,tariff:2.2,method:'auto',thr:.35,kwp:0},on:new Set(),sig:'',mode:'unit',scope:'day',sel:null,view:null,S:[],day:null,g:null,drag:null,bound:false};
const HWP_COL=['#2a6fc4','#d9622f','#1a9c6e','#8e44ad','#c0392b','#b8860b','#16a0b5','#e056a0','#5d6d7e','#6aa84f','#a0522d','#2e4053'];
const hwpUnit=h=>{const m=/[\(\[（]\s*([^)\]）]{1,10}?)\s*[\)\]）]\s*$/.exec(String(h||'').trim());let u=m?m[1].trim():hwUnitOf(h);if(/^(℃|°c|c)$/i.test(u))u='°C';return u};
const hwpIsPow=u=>/^(kw|w|mw)$/i.test(u);
const hwpNum=(v,d)=>{if(v==null||!isFinite(v))return'—';const a=Math.abs(v);return a>=1000?v.toFixed(0):a>=100?v.toFixed(1):a>=1?v.toFixed(2):v.toFixed(3)};
function hwpLbl(o,full,dateOnly){const d=new Date(o*6e4),hh=pad2(d.getUTCHours())+':'+pad2(d.getUTCMinutes()),dd=`${d.getUTCDate()}/${d.getUTCMonth()+1}/${d.getUTCFullYear()+543}`;
  if(dateOnly&&o>=527040)return dd;if(o<527040||(HWP.scope==='day'&&!full))return hh;return`${dd} ${hh}`}
function hwpNice(lo,hi){if(!(hi>lo))hi=lo+1;const raw=(hi-lo)/4,p=Math.pow(10,Math.floor(Math.log10(raw))),m=raw/p,st=(m<=1?1:m<=2?2:m<=2.5?2.5:m<=5?5:10)*p;
  const l=Math.floor(lo/st+1e-9)*st,h=Math.ceil(hi/st-1e-9)*st;return{lo:l,st,n:Math.max(1,Math.round((h-l)/st))}}
/* collect every numeric column of every interval file */
function hwpCollect(){
  const out=[],isRep=F=>F.kind==='report'||(F.kind==='auto'&&F.auto==='report'),ivf=HW.files.filter(F=>F.kind!=='alarm'&&F.map.t!=null&&(F.kind==='interval'||F.kind==='report'||F.kind==='auto'));
  ivf.forEach((F,fi)=>{
    const ti=F.map.t,rows=[];
    const rp=isRep(F);
    F.rows.forEach(r=>{const t=hwTime(r[ti]);if(t)rows.push({t,r})});
    if(!rows.length)return;rows.sort((a,b)=>a.t.o-b.t.o);
    F.head.forEach((h,i)=>{
      if(i===ti)return;
      const first=rows.map(o=>o.r[i]).find(v=>v!==''&&v!=null);
      if(typeof first==='string'&&hwTime(first))return;
      const pts=[];let ne=0;
      rows.forEach(({t,r})=>{const raw=r[i];if(raw!==''&&raw!=null)ne++;const v=hwNum(raw);if(v!=null)pts.push({x:t.o,d:t.d,y:v})});
      if(pts.length<3||pts.length<ne*.5)return;
      const df=[];for(let k=1;k<pts.length;k++){const d=pts[k].x-pts[k-1].x;if(d>0)df.push(d)}df.sort((a,b)=>a-b);
      const nm=String(h||'').trim()||`คอลัมน์ ${i+1}`;
      out.push({med0:df.length?df[df.length>>1]:5,key:F.id+'|'+i,name:nm+(ivf.length>1?` [${rp?'รายวัน':'รายช่วง'} ${fi+1}]`:''),unit:hwpUnit(h),pts,rep:rp,med:df.length?df[df.length>>1]:5});
    });
  });
  out.forEach((s,i)=>s.color=HWP_COL[i%HWP_COL.length]);
  return out;
}
/* สรุปข้อมูลรายวัน → รายสัปดาห์ (จันทร์–อาทิตย์) / รายเดือน: kWh,฿,t รวม · kW (Peak) สูงสุด · ค่าสะสม (Total) ค่าท้าย · อื่น ๆ เฉลี่ย */
function hwpAgg(s,g){
  if(g==='day'||s.med0>2000||!s.pts.length)return s.pts;
  const m=new Map();
  s.pts.forEach(p=>{const[y,mo,d]=p.d.split('-').map(Number);if(!y)return;let st;
    if(g==='month')st=Date.UTC(y,mo-1,1);else{const t=Date.UTC(y,mo-1,d);st=t-((new Date(t).getUTCDay()+6)%7)*864e5}
    const e=m.get(st);if(e)e.v.push(p.y);else m.set(st,{v:[p.y],d:new Date(st).toISOString().slice(0,10)})});
  const mode=/^(kwh|wh|mwh|฿|t)$/i.test(s.unit)?(/total|lifetime|สะสม/i.test(s.name)?'last':'sum'):/^kw$/i.test(s.unit)?'max':'avg';
  return[...m.entries()].sort((a,b)=>a[0]-b[0]).map(([st,e])=>({x:st/6e4,d:e.d,y:mode==='sum'?e.v.reduce((a,b)=>a+b,0):mode==='max'?Math.max(...e.v):mode==='last'?e.v[e.v.length-1]:e.v.reduce((a,b)=>a+b,0)/e.v.length}));
}
function hwpApplyScope(){HWP.S.forEach(s=>{
  if(s.rep){s.sp=HWP.scope==='all'?hwpAgg(s,HWP.gran):[];
    const df=[];for(let k=1;k<s.sp.length;k++)df.push(s.sp[k].x-s.sp[k-1].x);df.sort((a,b)=>a-b);s.med=df.length?df[df.length>>1]:s.med0;return}
  s.sp=HWP.scope==='all'?s.pts:s.pts.filter(p=>p.d===HW.day)})}
function hwpDefault(){
  const pool=HWP.S.some(s=>!s.rep)?HWP.S.filter(s=>!s.rep):HWP.S,pw=pool.filter(s=>hwpIsPow(s.unit)||/power|yield|กำลัง|ผลิต/i.test(s.name)).slice(0,3);
  return new Set((pw.length?pw:pool.slice(0,3)).map(s=>s.key));
}
function hwpPreset(id){
  const T={pow:s=>hwpIsPow(s.unit)||/power|กำลัง/i.test(s.name),vol:s=>/^v$/i.test(s.unit)||/voltage|แรงดัน/i.test(s.name),cur:s=>/^a$/i.test(s.unit)||/current|กระแส/i.test(s.name),tmp:s=>/^(°C|%)$/.test(s.unit)||/temp|soc|อุณหภูมิ/i.test(s.name)}[id];
  HWP.on=new Set(T?HWP.S.filter(T).slice(0,10).map(s=>s.key):[]);
}
function hwPlotRender(){
  const card=$('#hwplot');if(!card)return;
  if(!hwRole()||!HW.files.length){HWP.S=[];card.hidden=true;return}
  HWP.S=hwpCollect();card.hidden=!HWP.S.length;if(!HWP.S.length)return;
  const sig=HWP.S.map(s=>s.key).join(',');
  if(sig!==HWP.sig){HWP.sig=sig;HWP.scope=HWP.S.some(s=>!s.rep)?'day':'all';HWP.on=hwpDefault();HWP.view=null;HWP.sel=null}
  if(HWP.day!==HW.day){HWP.day=HW.day;HWP.view=null;HWP.sel=null}
  const sr=hwpSimAdd();
  hwpApplyScope();hwpBind();hwpChips();hwpDraw();hwpSimRender(sr);
}
function hwpChips(){
  const host=$('#hwpchips');if(!host)return;
  const units=[...new Set(HWP.S.map(s=>s.unit))];
  host.innerHTML=HWP.S.length?units.map(u=>`<div class="hwpg"><b>${esc(u||'ไม่ระบุหน่วย')}</b>`+HWP.S.filter(s=>s.unit===u).map(s=>`<button type="button" class="hwpc" data-hwpk="${esc(s.key)}" aria-pressed="${HWP.on.has(s.key)}" title="กดเพื่อเปิด/ปิดเส้นนี้"><i class="lk" style="background:${s.color}"></i>${esc(s.name)}</button>`).join('')+'</div>').join(''):'<span class="hint tight">ไม่พบคอลัมน์ตัวเลขในไฟล์รายช่วงเวลา</span>';
  const sc=$('#hwpscope'),md=$('#hwpmode');if(sc)sc.value=HWP.scope;if(md)md.value=HWP.mode;const gr=$('#hwpgran');if(gr)gr.value=HWP.gran;
}
function hwpExtent(vis){let a=Infinity,b=-Infinity;vis.forEach(s=>s.sp.forEach(p=>{if(p.x<a)a=p.x;if(p.x>b)b=p.x}));return isFinite(a)?[a,b]:null}
function hwpPath(s,x0,x1,sx,sy,iw){
  const P=s.sp,lo=x0-s.med*2,hi=x1+s.med*2,V=P.filter(p=>p.x>=lo&&p.x<=hi);
  let L=V;
  if(V.length>iw*2){/* min/max per pixel column */
    const m=new Map();V.forEach(p=>{const c=Math.floor(sx(p.x));const e=m.get(c);if(!e)m.set(c,{mn:p,mx:p});else{if(p.y<e.mn.y)e.mn=p;if(p.y>e.mx.y)e.mx=p}});
    L=[];m.forEach(e=>{if(e.mn===e.mx)L.push(e.mn);else L.push(...(e.mn.x<e.mx.x?[e.mn,e.mx]:[e.mx,e.mn]))});
  }
  let d='',prev=null;L.forEach(p=>{d+=(prev&&p.x-prev.x<=s.med*3?'L':'M')+sx(p.x).toFixed(1)+','+sy(s,p.y).toFixed(1);prev=p});
  return d;
}
function hwpDraw(){
  const host=$('#hwpchart'),stEl=$('#hwpstat'),note=$('#hwpnote');if(!host)return;
  const vis=HWP.S.filter(s=>HWP.on.has(s.key));
  if(note)note.textContent='';
  if(!HWP.S.length){host.innerHTML='';stEl.innerHTML='';HWP.g=null;return}
  const ext=hwpExtent(vis);
  if(!vis.length||!ext){host.innerHTML=`<p class="hint">${vis.length?'ไม่มีข้อมูลของเส้นที่เลือกในช่วงนี้ (ข้อมูลรายวัน/รายเดือนจะแสดงเมื่อเลือก "ทุกวันที่นำเข้า")':'เลือกเส้นที่ต้องการดูจากรายการด้านบน (หรือกดปุ่มชุดสำเร็จรูป)'}</p>`;stEl.innerHTML='';HWP.g=null;return}
  let x0,x1;
  if(HWP.view){[x0,x1]=HWP.view}else if(HWP.scope==='day'&&!vis.every(v=>v.rep)){x0=Math.floor(ext[0]/1440)*1440;x1=x0+1440}else{[x0,x1]=ext}
  if(!(x1>x0)){x0-=720;x1+=720}
  if(vis.every(v=>v.rep)&&!HWP.view){x0-=720;x1+=720}
  const units=[...new Set(vis.map(s=>s.unit))],mode=HWP.mode==='unit'&&units.length<=2?'unit':'norm';
  if(note&&HWP.mode==='unit'&&mode==='norm')note.textContent='เลือกเส้นที่มีหน่วยต่างกันเกิน 2 ชนิด จึงปรับสเกลเทียบกันอัตโนมัติ (แกนเป็น % ของช่วงค่าแต่ละเส้น)';
  const G={},R={};
  const rng=(arr)=>{let lo=Infinity,hi=-Infinity;arr.forEach(s=>s.sp.forEach(p=>{if(p.x>=x0&&p.x<=x1){if(p.y<lo)lo=p.y;if(p.y>hi)hi=p.y}}));return isFinite(lo)?[lo,hi]:[0,1]};
  if(mode==='unit')units.forEach(u=>{let[lo,hi]=rng(vis.filter(s=>s.unit===u));if(lo>=0&&lo<=hi*.4)lo=0;G[u]=hwpNice(lo,hi)});
  else vis.forEach(s=>{const[lo,hi]=rng([s]);R[s.key]={lo,hi}});
  const W=Math.max(300,host.clientWidth||640),H=300,ml=52,mr=mode==='unit'&&units.length===2?52:16,mt=16,mb=30,iw=W-ml-mr,ih=H-mt-mb;
  const sx=t=>ml+(t-x0)/(x1-x0)*iw;
  const sy=(s,v)=>{const fr=mode==='unit'?(v-G[s.unit].lo)/(G[s.unit].n*G[s.unit].st):(v-R[s.key].lo)/((R[s.key].hi-R[s.key].lo)||1);return mt+ih-fr*ih};
  HWP.g={ml,iw,x0,x1,W,mt,ih,mode,vis};
  let s=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="กราฟวิเคราะห์ค่าจาก log หลายเส้น"><defs><clipPath id="hwpclip"><rect x="${ml}" y="${mt}" width="${iw}" height="${ih}"/></clipPath></defs>`;
  /* y grid + axes */
  if(mode==='unit'){
    const gl=G[units[0]];
    for(let i=0;i<=gl.n;i++){const y=mt+ih-i/gl.n*ih;s+=`<line x1="${ml}" x2="${W-mr}" y1="${y}" y2="${y}" class="gl"/><text x="${ml-6}" y="${y+4}" class="ax" text-anchor="end">${hwpNum(gl.lo+i*gl.st)}</text>`}
    s+=`<text x="${ml-6}" y="10" class="ax" text-anchor="end">${esc(units[0])}</text>`;
    if(units.length===2){const gr=G[units[1]];for(let i=0;i<=gr.n;i++){const y=mt+ih-i/gr.n*ih;s+=`<text x="${W-mr+6}" y="${y+4}" class="ax">${hwpNum(gr.lo+i*gr.st)}</text>`}s+=`<text x="${W-mr+6}" y="10" class="ax">${esc(units[1])}</text>`}
  }else{for(let i=0;i<=4;i++){const y=mt+ih-i/4*ih;s+=`<line x1="${ml}" x2="${W-mr}" y1="${y}" y2="${y}" class="gl"/><text x="${ml-6}" y="${y+4}" class="ax" text-anchor="end">${i*25}</text>`}s+=`<text x="${ml-6}" y="10" class="ax" text-anchor="end">%</text>`}
  /* x ticks */
  const span=x1-x0,stp=[5,10,15,30,60,120,180,360,720,1440,2880,10080,43200].find(v=>span/v<=8)||43200;
  for(let t=Math.ceil(x0/stp)*stp;t<=x1+1e-6;t+=stp){const x=sx(t),d=new Date(t*6e4),lab=stp>=1440?`${d.getUTCDate()}/${d.getUTCMonth()+1}`:(span>1440&&t>=527040?`${d.getUTCDate()}/${d.getUTCMonth()+1} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`:pad2(d.getUTCHours())+':'+pad2(d.getUTCMinutes()));
    s+=`<line x1="${x}" x2="${x}" y1="${mt+ih}" y2="${mt+ih+4}" class="gl"/><text x="${x}" y="${H-8}" class="ax" text-anchor="${x>W-mr-20?'end':'middle'}">${lab}</text>`}
  /* selection shade */
  if(HWP.sel){const a=clamp(sx(HWP.sel[0]),ml,ml+iw),b=clamp(sx(HWP.sel[1]),ml,ml+iw);s+=`<rect x="${a}" y="${mt}" width="${Math.max(1,b-a)}" height="${ih}" style="fill:var(--accent);opacity:.14"/>`}
  /* lines */
  s+='<g clip-path="url(#hwpclip)">';
  vis.forEach(se=>{s+=`<path d="${hwpPath(se,x0,x1,sx,sy,iw)}" fill="none" stroke="${se.color}" stroke-width="1.8" stroke-linejoin="round"${se.sim?' stroke-dasharray="6 4"':''}/>`});
  s+='</g>';
  s+=`<g style="pointer-events:none"><line id="hwpCur" x1="0" x2="0" y1="${mt}" y2="${mt+ih}" stroke="var(--muted)" stroke-dasharray="3 3" hidden/><rect id="hwpBr" x="0" y="${mt}" width="0" height="${ih}" style="fill:var(--accent);opacity:.22" hidden/></g></svg><div class="tip" id="hwpTip" hidden></div>`;
  host.innerHTML=s;
  hwpStatRender(vis,mode);
}
/* ---- statistics of the selected range (or whole view) ---- */
function hwpStats(vis,a,b){
  return vis.map(s=>{
    const P=s.sp.filter(p=>p.x>=a&&p.x<=b);if(!P.length)return{s,n:0};
    let mn=P[0],mx=P[0],sum=0;P.forEach(p=>{if(p.y<mn.y)mn=p;if(p.y>mx.y)mx=p;sum+=p.y});
    const k=/^kw$/i.test(s.unit)?1:/^w$/i.test(s.unit)?.001:/^mw$/i.test(s.unit)?1000:null;
    let E=null;if(k!=null&&!s.rep&&P.length>1){E=0;for(let i=1;i<P.length;i++){const dt=P[i].x-P[i-1].x;if(dt<=s.med*3)E+=(P[i].y+P[i-1].y)/2*k*dt/60}}
    const ke=/^kwh$/i.test(s.unit)?1:/^wh$/i.test(s.unit)?.001:/^mwh$/i.test(s.unit)?1000:null;
    if(ke!=null){let dn=0;for(let i=1;i<P.length;i++)if(P[i].y<P[i-1].y-1e-9)dn++;/* สะสมเพิ่มขึ้นเรื่อย ๆ → ผลต่าง ไม่งั้นรวมค่ารายช่วง */E=(dn===0&&P.length>2&&P[P.length-1].y>P[0].y?P[P.length-1].y-P[0].y:P.reduce((a,p)=>a+p.y,0))*ke}
    return{s,n:P.length,mn,mx,avg:sum/P.length,first:P[0],last:P[P.length-1],E,P};
  });
}
function hwpObs(st,a,b){
  const o=[];
  st.filter(r=>r.n>1).forEach(r=>{
    const{s,P}=r;
    /* flat top (clipping) */
    if(hwpIsPow(s.unit)&&r.mx.y>0){let run=0,best=0;P.forEach(p=>{run=p.y>=r.mx.y*.985?run+1:0;best=Math.max(best,run)});
      if(best*s.med>=30&&best>=4)o.push(['warn',`${s.name}: ค่าแบนราบใกล้ค่าสูงสุด ${hwpNum(r.mx.y)} ${s.unit} นาน ≈ ${Math.round(best*s.med)} นาที น่าจะถึงพิกัดอุปกรณ์ (clipping)`])}
    /* data gaps */
    let gaps=0,gm=0;for(let i=1;i<P.length;i++){const d=P[i].x-P[i-1].x;if(d>s.med*3){gaps++;gm+=d}}
    if(gaps)o.push(['warn',`${s.name}: ข้อมูลขาด ${gaps} ช่วง รวม ≈ ${Math.round(gm)} นาที (สัญญาณ WiFi/Dongle หลุด หรืออุปกรณ์หยุด)`]);
    /* sudden drops */
    const dr=[];if(!s.rep&&!/^(kwh|wh|mwh|฿)$/i.test(s.unit))for(let i=1;i<P.length;i++)if(P[i-1].y>r.mx.y*.3&&P[i-1].y>0&&P[i].y<P[i-1].y*.4&&P[i].x-P[i-1].x<=s.med*3)dr.push(P[i]);
    if(dr.length)o.push(['warn',`${s.name}: ค่าตกฉับพลัน ${dr.length} ครั้ง (เช่น เวลา ${dr.slice(0,3).map(p=>hwpLbl(p.x)).join(', ')}) ตรวจเมฆ/เงา กริดหลุด หรือแจ้งเตือนช่วงนั้น`]);
  });
  /* compare same-unit series (e.g. PV string currents) */
  const byU={};st.filter(r=>r.n>1).forEach(r=>{(byU[r.s.unit]=byU[r.s.unit]||[]).push(r)});
  Object.keys(byU).forEach(u=>{const g=byU[u];if(g.length<2||!/^a$/i.test(u))return;
    const hi=Math.max(...g.map(r=>r.avg));if(hi<=0.3)return;const lo=g.reduce((m,r)=>r.avg<m.avg?r:m,g[0]);
    o.push(1-lo.avg/hi>.15?['warn',`กระแสเฉลี่ยในช่วงนี้ต่างกัน ${Math.round((1-lo.avg/hi)*100)}% (ต่ำสุด: ${lo.s.name}) ตรวจเงาบัง ฝุ่น หรือจำนวนแผงไม่เท่ากัน`]:['ok',`กระแสเฉลี่ยของเส้นหน่วย A ใกล้เคียงกัน (ต่างกัน ${Math.round((1-lo.avg/hi)*100)}%)`])});
  /* exactly two series: correlation + ratio */
  if(st.length===2&&st[0].n>4&&st[1].n>4){
    const A=st[0],B=st[1],xs=[],ys=[];
    A.P.forEach(p=>{const q=B.P.reduce((m,c)=>Math.abs(c.x-p.x)<Math.abs(m.x-p.x)?c:m,B.P[0]);if(Math.abs(q.x-p.x)<=A.s.med)xs.push([p.y,q.y])});
    if(xs.length>4){const n=xs.length,mx=xs.reduce((s,v)=>s+v[0],0)/n,my=xs.reduce((s,v)=>s+v[1],0)/n;
      let sxy=0,sxx=0,syy=0;xs.forEach(([x,y])=>{sxy+=(x-mx)*(y-my);sxx+=(x-mx)**2;syy+=(y-my)**2});
      if(sxx>0&&syy>0){const r=sxy/Math.sqrt(sxx*syy);o.push(['ok',`ความสัมพันธ์ ${A.s.name} กับ ${B.s.name}: r = ${r.toFixed(2)} (${Math.abs(r)>=.9?'สัมพันธ์กันสูง':Math.abs(r)>=.6?'ปานกลาง':'ต่ำ'})`])}
      if(A.E!=null&&B.E!=null&&A.E>0)o.push(['ok',`พลังงานในช่วงนี้: ${B.s.name} ÷ ${A.s.name} = ${(B.E/A.E*100).toFixed(1)}% (${hwpNum(B.E)} / ${hwpNum(A.E)} kWh) ถ้า A เป็น DC และ B เป็น AC ค่านี้คือประสิทธิภาพอินเวอร์เตอร์โดยประมาณ`])}
  }
  return o;
}
function hwpStatRender(vis,mode){
  const g=HWP.g,el=$('#hwpstat');if(!g||!el)return;
  const a=HWP.sel?HWP.sel[0]:g.x0,b=HWP.sel?HWP.sel[1]:g.x1,st=hwpStats(vis,a,b);
  const hasE=st.some(r=>r.E!=null);
  el.innerHTML=`<p class="hint tight"><b>ช่วงที่วิเคราะห์:</b> ${HWP.sel?`${hwpLbl(a,true)} – ${hwpLbl(b,true)} (${Math.round(b-a)} นาที) · ที่ลากเลือก`:'ทั้งหน้าจอที่แสดง (ลากบนกราฟเพื่อเลือกช่วง)'}</p>
  <div class="tablewrap"><table class="hwstat"><thead><tr><th>เส้น</th><th>จุด</th><th>ต่ำสุด</th><th>สูงสุด (เวลา)</th><th>เฉลี่ย</th><th>ต้น → ท้าย</th>${hasE?'<th>พลังงานรวม (kWh)</th>':''}</tr></thead><tbody>`+
  st.map(r=>r.n?`<tr><td><i class="lk" style="background:${r.s.color}"></i> ${esc(r.s.name)}</td><td class="mono">${r.n}</td><td class="mono">${hwpNum(r.mn.y)}</td><td class="mono">${hwpNum(r.mx.y)} <span class="hint tight">${hwpLbl(r.mx.x,false,r.s.rep)}</span></td><td class="mono">${hwpNum(r.avg)}</td><td class="mono">${hwpNum(r.first.y)} → ${hwpNum(r.last.y)}</td>${hasE?`<td class="mono">${r.E!=null?hwpNum(r.E):'—'}</td>`:''}</tr>`:`<tr><td><i class="lk" style="background:${r.s.color}"></i> ${esc(r.s.name)}</td><td colspan="${hasE?6:5}" class="hint">ไม่มีข้อมูลในช่วงนี้</td></tr>`).join('')+'</tbody></table></div>'+
  (()=>{const o=hwpObs(st,a,b);return o.length?`<ul class="checks">${o.map(([l,t])=>`<li><span class="b ${l}">${l==='ok'?'✓':'?'}</span><span>${esc(t)}</span></li>`).join('')}</ul>`:''})()+
  '<p class="hint tight">ค่าสถิติและข้อสังเกตเป็นเกณฑ์ประมาณเพื่อการเรียนรู้ ใช้ชี้จุดที่ควรตรวจ ไม่ใช่ผลวินิจฉัย พลังงานรวม: เส้นหน่วย W/kW คำนวณด้วยการอินทิเกรตตามเวลา ส่วนเส้นหน่วย kWh/Wh ใช้ผลรวมของค่ารายช่วง (หรือผลต่างต้น→ท้ายถ้าเป็นค่าสะสม)</p>';
  const z=$('#hwpzoom'),cl=$('#hwpclear');if(z)z.disabled=!HWP.sel;if(cl)cl.disabled=!HWP.sel&&!HWP.view;
}
function hwpCsv(){
  const g=HWP.g;if(!g)return;const a=HWP.sel?HWP.sel[0]:g.x0,b=HWP.sel?HWP.sel[1]:g.x1,st=hwpStats(g.vis,a,b).filter(r=>r.n);
  const L=[['เส้น','หน่วย','จุด','ต่ำสุด','สูงสุด','เวลาที่สูงสุด','เฉลี่ย','ค่าเริ่มต้น','ค่าท้าย','พลังงานรวม kWh']].concat(st.map(r=>[r.s.name,r.s.unit,r.n,r.mn.y,r.mx.y,hwpLbl(r.mx.x,true),+r.avg.toFixed(4),r.first.y,r.last.y,r.E!=null?+r.E.toFixed(4):'']));
  hwDownload('huawei-log-stats.csv','﻿'+L.map(r=>r.map(v=>/[",\n]/.test(String(v))?`"${String(v).replace(/"/g,'""')}"`:v).join(',')).join('\r\n'));
}

/* ---- จำลองกรณีไม่เปิด Zero Export (ไม่จำกัดการส่งออก) ----
   ใช้ข้อมูลรายช่วงเวลาที่มี PV + ซื้อไฟ (Import): ชั่วโมงที่ซื้อไฟน้อยกว่าเกณฑ์ ถือว่าอินเวอร์เตอร์ถูกจำกัดกำลังให้ตามโหลด
   กำลังที่ผลิตได้จริงถ้าไม่จำกัด ≈ max(ค่าจริง, k × รูประฆังคว่ำตามดวงอาทิตย์) โดย k ปรับจากชั่วโมงที่ไม่ถูกจำกัด หรือ kWp × PR */
function hwpSimAdd(){
  const sm=HWP.sim;if(!sm.on)return null;
  const S=HWP.S.filter(x=>!x.rep&&!x.sim);
  const pick=(res,ex)=>{for(const re of res){const f=S.find(x=>re.test(x.name)&&!(ex&&ex.test(x.name)));if(f)return f}return null};
  const pv=pick([/pv\s*yield/i,/inverter\s*yield/i,/(input|output|active)\s*power/i,/yield/i],/total|loss|theoretical|specific/i);
  if(!pv||!(/^(kwh|kw)$/i.test(pv.unit)))return{err:'ไม่พบเส้นผลิตไฟ (PV Yield / Active power) ในไฟล์รายช่วงเวลา การจำลองต้องใช้ไฟล์ Historical data รายชั่วโมงหรือ 5 นาที ไม่ใช่รายงานรายวัน'};
  const imp=pick([/import/i,/purchas/i]),exp=pick([/export/i,/feed/i],/loss|limit/i),cons=pick([/^consumption/i,/load\s*power/i]);
  const cap=HWP.S.find(x=>/string\s*capacity|kwp/i.test(x.name)&&x.pts.length);
  const kwp=sm.kwp||HW.kwp||(cap?cap.pts[0].y:0);
  const stepH=pv.med/60,eU=/^kwh$/i.test(pv.unit),fac=eU?stepH:1;
  const toKW=(sr,y)=>/^kwh$/i.test(sr.unit)?y/stepH:/^w$/i.test(sr.unit)?y/1000:y;
  const mp=sr=>{if(!sr)return null;const m=new Map();sr.pts.forEach(p=>m.set(p.x,toKW(sr,p.y)));return m};
  const mI=mp(imp),mE=mp(exp),mC=mp(cons),days=[...new Set(pv.pts.map(p=>p.d))];
  const calc=method=>{
  const pot=[],lost=[];let pvE=0,lostE=0,expE=0,nLim=0,pk=0,kUsed=[],nFit=0,skipped=0;
  days.forEach(d=>{
    const P=pv.pts.filter(p=>p.d===d),pos=P.filter(p=>p.y>0);if(pos.length<3){skipped++;return}
    const hod=x=>(x%1440)/60,sr=hod(pos[0].x),ss=hod(pos[pos.length-1].x)+(eU?stepH:0);if(!(ss>sr)){skipped++;return}
    const shape=p=>Math.max(0,Math.sin(Math.PI*(hod(p.x)+(eU?stepH/2:0)-sr)/(ss-sr)))**1.25;
    const rows=P.map(p=>{const kw=toKW(pv,p.y),ik=mI?mI.get(p.x):null;return{p,kw,sh:shape(p),lim:ik==null?true:ik<sm.thr,ik,ek:mE?mE.get(p.x):null,ck:mC?mC.get(p.x):null}});
    const ratios=rows.filter(r=>!r.lim&&r.kw>0&&r.sh>.1).map(r=>r.kw/r.sh).sort((a,b)=>a-b);
    let k=null;
    if(method==='auto'&&ratios.length>=2)k=ratios[ratios.length>>1];
    else if(kwp>0)k=kwp*sm.pr;
    if(k==null){skipped++;return}
    if(kwp>0)k=Math.min(k,kwp);
    if(method==='auto'&&ratios.length>=2)nFit+=ratios.length;kUsed.push(k);
    rows.forEach(r=>{
      const pk_=r.lim?Math.max(r.kw,k*r.sh):r.kw,ld=r.ck!=null?r.ck:(r.ik!=null?r.kw+r.ik-(r.ek||0):null);
      const es=ld!=null?Math.max(0,pk_-ld):null;
      pot.push({x:r.p.x,d,y:pk_*fac,e:es==null?null:es*fac});lost.push({x:r.p.x,d,y:(pk_-r.kw)*fac});
      pvE+=r.kw*stepH;lostE+=(pk_-r.kw)*stepH;if(pk_>r.kw+.05)nLim++;if(es!=null)expE+=es*stepH;if(pk_>pk)pk=pk_;
    });
  });
  return{pot,lost,pvE,lostE,expE,nLim,pk,kUsed,nFit,skipped};
  };
  const C=calc(sm.method),alt=calc(sm.method==='auto'?'kwp':'auto'),{pot,lost,pvE,lostE,expE,nLim,pk,kUsed,nFit,skipped}=C;
  if(!pot.length)return{err:'ประเมินไม่ได้: ข้อมูลที่ไม่ถูกจำกัดน้อยเกินไป ลองกรอก ขนาดติดตั้ง (kWp) แล้วเลือกวิธี "จากขนาดติดตั้ง × PR"'};
  const mk=(key,name,pts,color)=>({key,name,unit:pv.unit,pts,rep:false,sim:true,color,med:pv.med});
  const sx=pot.filter(q=>q.e!=null).map(q=>({x:q.x,d:q.d,y:q.e}));
  HWP.S.push(mk('sim|pot','PV ถ้าไม่จำกัดส่งออก (จำลอง)',pot,'#e11d48'),mk('sim|lost','ส่วนที่ถูกจำกัด (จำลอง)',lost,'#f59e0b'));
  if(sx.length)HWP.S.push(mk('sim|exp','ขายเข้ากริดถ้าไม่เปิด Zero Export (จำลอง)',sx,'#7c3aed'));
  return{pv,imp,exp,cons,kwp,pvE,lostE,expE,nLim,pk,alt:alt.pot.length&&(kwp>0||sm.method==='kwp')?{m:sm.method==='auto'?'kwp':'auto',lostE:alt.lostE,expE:alt.expE}:null,k:kUsed.length?kUsed.reduce((a,b)=>a+b,0)/kUsed.length:0,nFit,skipped,days:days.length,hasLoad:sx.length>0};
}
function hwpSimRender(r){
  const el=$('#hwpsimres'),b=$('#hwpsimon');if(b)b.setAttribute('aria-pressed',String(HWP.sim.on));
  document.querySelectorAll('#hwplot [data-hwps]').forEach(i=>{const v=HWP.sim[i.dataset.hwps];if(document.activeElement!==i)i.value=i.dataset.hwps==='kwp'&&!v?'':v});
  if(!el)return;
  if(!HWP.sim.on||!r){el.innerHTML=HWP.sim.on?'':'<p class="hint tight">กด "เปิดโหมดจำลอง" เพื่อเพิ่มเส้นประเมินว่าถ้าไม่เปิด Zero Export (ไม่จำกัดการส่งออก) ระบบจะผลิตและขายเข้ากริดได้เท่าไร ใช้ประกอบการตัดสินใจปรับปรุงระบบ เช่น ขออนุญาตขายไฟ เพิ่มแบตเตอรี่ หรือเพิ่มโหลดช่วงกลางวัน</p>';return}
  if(r.err){el.innerHTML=`<p class="simmsg err">${esc(r.err)}</p>`;return}
  const t=HWP.sim.tariff,pct=r.pvE>0?r.lostE/r.pvE*100:0,u='kWh',pd=r.days>1?` (รวม ${r.days} วัน)`:'';
  const o=[];
  o.push(['ok',`วิธี: ${r.nFit?`ปรับจาก ${r.nFit} ช่วงที่ไม่ถูกจำกัด`:`ขนาดติดตั้ง ${f(r.kwp,1)} kWp × PR ${HWP.sim.pr}`} → กำลังผลิตสูงสุดโดยประมาณ k ≈ ${f(r.k,1)} kW`]);
  o.push(pct<3?['ok',`ส่วนที่ถูกจำกัดน้อย (${f(pct,1)}% ของที่ผลิตจริง): การเปิด Zero Export แทบไม่ทำให้เสียพลังงาน โหลดช่วงกลางวันใช้ไฟจากแผงเกือบหมด`]:['warn',`ส่วนที่ถูกจำกัดมี ${f(pct,1)}% ของที่ผลิตจริง: ถ้าขายไฟได้ตามเงื่อนไข หรือเพิ่มแบตเตอรี่/ย้ายโหลดมาใช้ช่วงกลางวัน จะใช้ประโยชน์ส่วนนี้ได้`]);
  if(r.alt)o.push(['ok',`เทียบอีกวิธี (${r.alt.m==='kwp'?'ขนาดติดตั้ง × PR ซึ่งเป็นค่าสูงสุดที่เป็นไปได้':'ปรับจากชั่วโมงที่ไม่ถูกจำกัด ซึ่งเป็นค่าต่ำสุด'}): ถูกจำกัด ≈ ${f(r.alt.lostE,1)} kWh ขายเข้ากริด ≈ ${f(r.alt.expE,1)} kWh ช่วงจริงน่าจะอยู่ระหว่างสองค่า (ขึ้นกับเมฆ ขนาดอินเวอร์เตอร์ และ PR จริง)`]);
  if(r.nFit&&r.nFit<8)o.push(['warn',`ใช้ชั่วโมงที่ไม่ถูกจำกัดเพียง ${r.nFit} ช่วง ค่า k อาจต่ำเกินไปถ้าวันนั้นมีเมฆ ควรเทียบกับวิธี kWp × PR หรือนำเข้าข้อมูลหลายวัน`]);
  o.push(['warn','การปิด Zero Export / ขายไฟเข้ากริดต้องได้รับอนุญาตและเป็นไปตามข้อกำหนดของการไฟฟ้า (หรือสัญญา/โครงการที่เข้าร่วม) ตรวจสอบก่อนปรับตั้งค่าจริง ตัวเลขนี้เป็นค่าประมาณจากข้อมูลที่นำเข้าเท่านั้น']);
  el.innerHTML=`<div class="metrics"><div class="metric"><div class="k">ผลิตจริง${pd}</div><div class="v">${f(r.pvE,2)} ${u}</div></div><div class="metric"><div class="k">ถูกจำกัดโดยประมาณ</div><div class="v">${f(r.lostE,2)} ${u}</div><div class="s">${f(pct,1)}% · ${r.nLim} ช่วง</div></div>`+
  (r.hasLoad?`<div class="metric"><div class="k">ขายเข้ากริดจำลอง</div><div class="v">${f(r.expE,2)} ${u}</div><div class="s">≈ ${f(r.expE*t,2)} ฿ ที่ ${t} ฿/${u}</div></div>`:'<div class="metric"><div class="k">ขายเข้ากริดจำลอง</div><div class="v">—</div><div class="s">ไม่มีข้อมูลโหลด/ซื้อไฟ</div></div>')+'</div>'+
  `<ul class="checks">${o.map(([l,x])=>`<li><span class="b ${l}">${l==='ok'?'✓':'?'}</span><span>${esc(x)}</span></li>`).join('')}</ul>`;
}
/* ---- interaction ---- */
function hwpBind(){
  if(HWP.bound)return;const host=$('#hwpchart');if(!host)return;HWP.bound=true;
  const px=e=>{const sv=host.querySelector('svg');return sv?e.clientX-sv.getBoundingClientRect().left:0};
  const xAt=p=>{const g=HWP.g;return g.x0+clamp((p-g.ml)/g.iw,0,1)*(g.x1-g.x0)};
  host.addEventListener('pointerdown',e=>{if(!HWP.g||e.button>0)return;const p=px(e);if(p<HWP.g.ml-2||p>HWP.g.ml+HWP.g.iw+2)return;HWP.drag={p0:p,moved:false};try{host.setPointerCapture(e.pointerId)}catch(_){}});
  host.addEventListener('pointermove',e=>{
    const g=HWP.g;if(!g)return;const p=px(e),cur=host.querySelector('#hwpCur'),br=host.querySelector('#hwpBr'),tip=host.querySelector('#hwpTip');if(!cur)return;
    if(HWP.drag){if(Math.abs(p-HWP.drag.p0)>4)HWP.drag.moved=true;
      if(HWP.drag.moved){const a=clamp(Math.min(HWP.drag.p0,p),g.ml,g.ml+g.iw),b=clamp(Math.max(HWP.drag.p0,p),g.ml,g.ml+g.iw);br.setAttribute('x',a);br.setAttribute('width',b-a);br.hidden=false;tip.hidden=true;cur.hidden=true;return}}
    if(p<g.ml||p>g.ml+g.iw){cur.hidden=true;tip.hidden=true;return}
    const x=xAt(p);cur.setAttribute('x1',p);cur.setAttribute('x2',p);cur.hidden=false;
    let h=`<div class="th">${hwpLbl(x,true,g.vis.every(s=>s.rep))}</div>`;
    g.vis.forEach(s=>{const P=s.sp;if(!P.length)return;let lo=0,hi=P.length-1;while(lo<hi){const m=(lo+hi)>>1;if(P[m].x<x)lo=m+1;else hi=m}let i=lo;if(i>0&&Math.abs(P[i-1].x-x)<=Math.abs(P[i].x-x))i--;
      const q=P[i],ok=Math.abs(q.x-x)<=s.med*1.5;h+=`<div class="tr"><i class="tk" style="background:${s.color}"></i><span class="tn">${esc(s.name)}</span><span class="tv">${ok?hwpNum(q.y)+' '+esc(s.unit):'—'}</span></div>`});
    tip.innerHTML=h;tip.hidden=false;const tw=tip.offsetWidth||200;tip.style.left=(p+14+tw>g.W?Math.max(0,p-14-tw):p+14)+'px';
  });
  const end=e=>{
    const g=HWP.g,d=HWP.drag;HWP.drag=null;if(!g||!d)return;const p=px(e);
    if(d.moved&&Math.abs(p-d.p0)>6){const a=xAt(Math.min(d.p0,p)),b=xAt(Math.max(d.p0,p));HWP.sel=[a,b]}else if(!d.moved)HWP.sel=null;
    hwpDraw();
  };
  host.addEventListener('pointerup',end);
  host.addEventListener('pointercancel',()=>{HWP.drag=null;hwpDraw()});
  host.addEventListener('pointerleave',()=>{if(HWP.drag)return;const c=host.querySelector('#hwpCur'),t=host.querySelector('#hwpTip');if(c)c.hidden=true;if(t)t.hidden=true});
}
document.addEventListener('click',e=>{
  if(!e.target.closest('#hwplot'))return;
  const c=e.target.closest('[data-hwpk]');
  if(c){const k=c.dataset.hwpk;if(HWP.on.has(k))HWP.on.delete(k);else HWP.on.add(k);c.setAttribute('aria-pressed',String(HWP.on.has(k)));hwpDraw();return}
  const pr=e.target.closest('[data-hwpre]');if(pr){hwpPreset(pr.dataset.hwpre);hwpChips();hwpDraw();return}
  const id=e.target.closest('button')?.id;
  if(id==='hwpzoom'&&HWP.sel){HWP.view=HWP.sel;HWP.sel=null;hwpDraw()}
  else if(id==='hwpclear'){HWP.sel=null;HWP.view=null;hwpDraw()}
  else if(id==='hwpcsv')hwpCsv();
  else if(id==='hwpsimon'){HWP.sim.on=!HWP.sim.on;if(HWP.sim.on){const sr=HWP.S;HWP.sim._want=true}hwPlotRender();if(HWP.sim.on){['sim|pot','sim|exp'].forEach(k=>{if(HWP.S.some(x=>x.key===k))HWP.on.add(k)});const pv=HWP.S.find(x=>!x.rep&&!x.sim&&/yield|power/i.test(x.name)&&!/total|loss|theoretical|specific/i.test(x.name));if(pv)HWP.on.add(pv.key);hwpChips();hwpDraw()}else{[...HWP.on].forEach(k=>{if(/^sim\|/.test(k))HWP.on.delete(k)});hwpChips();hwpDraw()}}
});
document.addEventListener('change',e=>{
  if(e.target.id==='hwpscope'){HWP.scope=e.target.value;HWP.view=null;HWP.sel=null;hwpApplyScope();hwpDraw()}
  else if(e.target.id==='hwpgran'){HWP.gran=e.target.value;HWP.view=null;HWP.sel=null;hwpApplyScope();hwpDraw()}
  else if(e.target.id==='hwpmode'){HWP.mode=e.target.value;hwpDraw()}
  else if(e.target.dataset&&e.target.dataset.hwps){const k=e.target.dataset.hwps,v=e.target.value;HWP.sim[k]=k==='method'?v:Math.max(0,+v||0);if(k==='pr'&&!HWP.sim.pr)HWP.sim.pr=.8;hwPlotRender()}
});
window.addEventListener('resize',()=>{if(HWP.g&&typeof curTab!=='undefined'&&curTab==='fusion')hwpDraw()});
