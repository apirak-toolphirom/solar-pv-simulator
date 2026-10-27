/* ---- menu 14: คลังความรู้ (knowledge library) ----
   A list of articles grouped by category, with search. Each article is one kbAdd({...}) call:
     id      short slug, also the link  #library/<id>
     cat     a key of KB_CATS
     title, summary, tags[], upd ('YYYY-MM-DD')
     body()  returns the article HTML (sections as <section class="kbsec" id="kb-<id>-<n>"><h2>…</h2>…</section>)
     init(el) optional, wires up interactive parts inside the article element
     related [[tab,label]] buttons that open other menus · src [[title,url]] sources
   To add an article: add another kbAdd({...}) below (or in a new js file listed after 'library' in build.py), then python3 build.py */
const KB_CATS=[['protect','อุปกรณ์ป้องกัน'],['cable','สายไฟและการเดินสาย'],['pv','แผงและอินเวอร์เตอร์'],['bat','แบตเตอรี่'],['safety','ความปลอดภัย'],['std','มาตรฐานและกฎ']];
const KB_ARTS=[];
const KB={cat:'',q:'',open:''};
function kbAdd(a){KB_ARTS.push(a)}
const kbCatName=k=>(KB_CATS.find(c=>c[0]===k)||[k,k])[1];

/* ---------- article: MCB trip curves ---------- */
/* magnetic band (multiples of In, AC) and thermal reference points per curve.
   B/C/D: IEC 60898-1 (1.13 In no trip / 1.45 In trip within 1 h, 2.55 In trips in 1–60 s).
   K/Z: IEC 60947-2 manufacturer curves (1.05 In no trip / 1.2 In trip within 1–2 h); bands vary by maker. */
const KB_CRV={
  Z:{lo:2,hi:3,nt:1.05,tr:1.2,std:'IEC 60947-2',col:'var(--s3)',use:'อิเล็กทรอนิกส์และเซมิคอนดักเตอร์ วงจรวัดและควบคุม สายสัญญาณยาว',why:'แทบไม่ทนกระแสกระชาก ทริปเร็วที่สุด'},
  B:{lo:3,hi:5,nt:1.13,tr:1.45,std:'IEC 60898-1',col:'var(--s1)',use:'โหลดความต้านทาน (ฮีตเตอร์ กาต้มน้ำ) แสงสว่าง วงจรสายยาวที่กระแสลัดวงจรต่ำ วงจรที่จ่ายจากเครื่องปั่นไฟหรืออินเวอร์เตอร์ off-grid',why:'ทริปเร็วเมื่อลัดวงจร เหมาะเมื่อแหล่งจ่ายให้กระแสลัดวงจรได้น้อย'},
  C:{lo:5,hi:10,nt:1.13,tr:1.45,std:'IEC 60898-1',col:'var(--accent)',use:'วงจรทั่วไปในบ้านและอาคาร เต้ารับ โหลดผสม มอเตอร์เล็ก ขาออก AC ของอินเวอร์เตอร์ (ตามคู่มือ)',why:'ทนกระชากได้ราว 2 เท่าของ B ใช้มากที่สุด'},
  K:{lo:10,hi:14,nt:1.05,tr:1.2,std:'IEC 60947-2',col:'var(--warn)',use:'มอเตอร์ ปั๊ม คอมเพรสเซอร์ หม้อแปลง ที่มีกระแสกระชากสูง',why:'ทนกระชากสูงแต่ส่วน thermal ไวกว่า จึงป้องกันโหลดเกินของสายได้ดีกว่า D'},
  D:{lo:10,hi:20,nt:1.13,tr:1.45,std:'IEC 60898-1',col:'var(--err)',use:'หม้อแปลงใหญ่ เครื่องเชื่อม มอเตอร์ที่สตาร์ทหนัก เซอร์โว/CNC',why:'ทนกระชากสูงสุด แต่ต้องมีกระแสลัดวงจรสูงพอ (สายสั้น/ใหญ่) จึงจะทริปทันที'}
};
const KB_ORDER=['Z','B','C','K','D'];
const KB_DC=Math.SQRT2;/* AC bands are rms: on DC the magnetic release needs about √2 × the AC value (check the maker's DC data) */
/* trip-time limits (s) at x × In. tMax = it has tripped by then, tMin = it will not trip before then (Infinity = never) */
function kbT(c,x,dc){
  const C=KB_CRV[c],lo=C.lo*(dc?KB_DC:1),hi=C.hi*(dc?KB_DC:1);
  /* thermal shape from the IEC 60898-1 points, rescaled for K/Z whose points are 1.05 / 1.2 */
  const ax=x*1.45/C.tr,nx=x*1.13/C.nt;
  const lin=(x,x0,t0,x1,t1)=>Math.exp(Math.log(t0)+(Math.log(x)-Math.log(x0))/(Math.log(x1)-Math.log(x0))*(Math.log(t1)-Math.log(t0)));
  let tMax=ax<1.45?Infinity:ax<=2.55?lin(ax,1.45,3600,2.55,60):60*Math.pow(2.55/ax,2);
  let tMin=nx<=1.13?Infinity:nx<=2.55?lin(nx,1.13,7200,2.55,1):Math.pow(2.55/nx,2);
  if(x<lo)tMin=Math.max(tMin,.1);
  if(x>=hi)tMax=Math.min(tMax,.01);
  if(x>=lo)tMin=Math.min(tMin,.004);
  return{tMin,tMax,lo,hi};
}
const kbSec=t=>t===Infinity?'ไม่ทริป':t>=3600?`${(t/3600).toFixed(t>=36000?0:1)} ชม.`:t>=60?`${(t/60).toFixed(t>=600?0:1)} นาที`:t>=1?`${t.toFixed(t>=10?0:1)} วินาที`:`${Math.round(t*1000)} ms`;
function kbState(c,x,dc){
  const r=kbT(c,x,dc);
  if(x>=r.hi)return{lvl:'err',t:'ทริปทันที (magnetic)',d:'< 10 ms'};
  if(x>=r.lo)return{lvl:'warn',t:'อาจทริปทันที (อยู่ในช่วง magnetic)',d:`ทันที ถึง ${kbSec(r.tMax)}`};
  if(r.tMax===Infinity&&r.tMin===Infinity)return{lvl:'ok',t:'ไม่ทริป',d:'กระแสไม่เกินพิกัดใช้งาน'};
  if(r.tMax===Infinity)return{lvl:'idle',t:'อาจทริปช้ามาก (thermal)',d:`ไม่ก่อน ${kbSec(r.tMin)}`};
  return{lvl:'idle',t:'ทริปแบบหน่วงเวลา (thermal)',d:`${kbSec(r.tMin)} – ${kbSec(r.tMax)}`};
}
/* log-log time-current chart */
function kbChart(host,o){
  const W=Math.max(300,host.clientWidth||640),H=Math.round(Math.min(420,Math.max(300,W*.62))),ml=52,mr=14,mt=26,mb=40,iw=W-ml-mr,ih=H-mt-mb;
  const X0=1,X1=o.dc?40:30,Y0=.001,Y1=10000;
  const sx=x=>ml+Math.log(x/X0)/Math.log(X1/X0)*iw,sy=t=>mt+(1-Math.log(Math.min(Y1,Math.max(Y0,t))/Y0)/Math.log(Y1/Y0))*ih;
  let s=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="กราฟเวลา-กระแสของเบรกเกอร์ curve ${o.show.join(', ')}">`;
  [.001,.01,.1,1,10,100,1000,10000].forEach(t=>{const y=sy(t);s+=`<line x1="${ml}" x2="${W-mr}" y1="${y}" y2="${y}" class="gl"/><text x="${ml-6}" y="${y+4}" class="ax" text-anchor="end">${t>=1?t:t}</text>`});
  [[3600,'1 ชม.'],[60,'1 นาที']].forEach(([t,l])=>{const y=sy(t);s+=`<text x="${W-mr-4}" y="${y-4}" class="ax" text-anchor="end">${l}</text>`});
  const xt=[1,1.5,2,3,4,5,7,10,14,20,30,40].filter(x=>x<=X1);
  xt.forEach(x=>{const X=sx(x);s+=`<line x1="${X}" x2="${X}" y1="${mt}" y2="${mt+ih}" class="gl"/><text x="${X}" y="${H-22}" class="ax" text-anchor="middle">${x}</text>`});
  s+=`<text x="${ml+iw/2}" y="${H-5}" class="ax" text-anchor="middle">กระแส (จำนวนเท่าของ In)${o.In?` · In = ${o.In} A`:''}</text><text x="${ml-6}" y="12" class="ax" text-anchor="end">วินาที</text>`;
  /* bands */
  const N=220,xs=[...Array(N+1)].map((_,i)=>X0*Math.pow(X1/X0,i/N));
  o.show.forEach(c=>{
    const C=KB_CRV[c],up=[],dn=[];
    xs.forEach(x=>{const r=kbT(c,x,o.dc);if(r.tMax!==Infinity)up.push([sx(x),sy(r.tMax)]);if(r.tMin!==Infinity)dn.push([sx(x),sy(r.tMin)])});
    /* vertical edges of the magnetic band */
    const r=kbT(c,1,o.dc),ph=p=>p.map(q=>q[0].toFixed(1)+' '+q[1].toFixed(1)).join('L');
    const upP=[[sx(C.tr),sy(Y1)]].concat(up.filter(p=>p[0]<sx(r.hi))).concat([[sx(r.hi),sy(kbT(c,r.hi*.999,o.dc).tMax)],[sx(r.hi),sy(.01)],[sx(X1),sy(.01)]]);
    const dnP=[[sx(C.nt),sy(Y1)]].concat(dn.filter(p=>p[0]<sx(r.lo))).concat([[sx(r.lo),sy(Math.max(.1,kbT(c,r.lo*.999,o.dc).tMin))],[sx(r.lo),sy(.004)],[sx(X1),sy(.004)]]);
    s+=`<path d="M${ph(upP)}L${ph(dnP.slice().reverse())}Z" style="fill:${C.col};fill-opacity:.13;stroke:none"/>`;
    s+=`<path d="M${ph(upP)}" class="ln" style="stroke:${C.col}"/><path d="M${ph(dnP)}" class="ln" style="stroke:${C.col};stroke-dasharray:5 4"/>`;
    const lx=sx(Math.sqrt(r.lo*r.hi));s+=`<text x="${lx}" y="${sy(.02)}" class="ax strong" text-anchor="middle" style="fill:${C.col}">${c}</text>`;
  });
  (o.marks||[]).forEach(m=>{if(!(m.x>X0))return;const X=sx(Math.min(m.x,X1));s+=`<line x1="${X}" x2="${X}" y1="${mt}" y2="${mt+ih}" style="stroke:${m.col};stroke-width:2;stroke-dasharray:${m.dash||'0'}"/><text x="${X+(X>W-120?-5:5)}" y="${mt+12+(m.row||0)*14}" class="ax strong" text-anchor="${X>W-120?'end':'start'}" style="fill:${m.col}">${esc(m.l)}${m.x>X1?' →':''}</text>`});
  host.innerHTML=s+'</svg>';
}
/* typical inrush (multiple of running current) — rough teaching values, the maker's data wins */
const KB_LOADS=[
  ['res','ฮีตเตอร์ / กาต้มน้ำ / เตารีด (ความต้านทาน)',1,'แทบไม่มีกระแสกระชาก'],
  ['lamp','หลอดไส้ / ฮาโลเจน',12,'ไส้หลอดเย็น ~10–15 เท่า นานไม่กี่มิลลิวินาที'],
  ['led','ไดรเวอร์ LED / สวิตชิ่งเพาเวอร์ซัพพลาย หลายตัว',25,'ชาร์จตัวเก็บประจุ พีกสูงมากแต่ < 1 ms ดูตาราง "จำนวนไดรเวอร์ต่อเบรกเกอร์" ของผู้ผลิต'],
  ['motor','มอเตอร์ / ปั๊มน้ำ สตาร์ทตรง (DOL)',7,'6–8 เท่า นาน 0.5–5 วินาทีตามโหลด'],
  ['comp','แอร์/ตู้เย็นแบบธรรมดา (ไม่ใช่อินเวอร์เตอร์)',6,'คอมเพรสเซอร์ 5–7 เท่า (LRA) ไม่ถึงวินาที'],
  ['invac','แอร์/ปั๊มระบบอินเวอร์เตอร์',1.5,'สตาร์ทนุ่ม กระชากต่ำ'],
  ['trafo','หม้อแปลง (ตอนจ่ายไฟ)',12,'10–15 เท่า (แบบเทอรอยด์อาจถึง 30) นาน ~10 ms'],
  ['custom','กำหนดเอง',3,'']
];
function kbMcbInit(el){
  const S={show:['B','C','D'],In:16,dc:false,ld:'motor',Ib:8,k:7,ik:0,len:25,mm:2.5,ze:.5,mode:'calc'};
  const $e=s=>el.querySelector(s);
  const inp=$e('#kbm-in'),ld=$e('#kbm-ld');
  inp.innerHTML=[6,10,13,16,20,25,32,40,50,63].map(v=>`<option ${v===S.In?'selected':''}>${v}</option>`).join('');
  ld.innerHTML=KB_LOADS.map(l=>`<option value="${l[0]}" ${l[0]===S.ld?'selected':''}>${esc(l[1])}</option>`).join('');
  $e('#kbm-crv').innerHTML=KB_ORDER.map(c=>`<button type="button" class="chip" data-kbc="${c}" aria-pressed="${S.show.includes(c)}">Curve ${c}</button>`).join('');
  const rd=()=>{
    S.In=+inp.value;S.dc=$e('#kbm-dc').checked;S.Ib=Math.max(0,+$e('#kbm-ib').value||0);
    const L=KB_LOADS.find(l=>l[0]===ld.value);S.ld=ld.value;
    if(S.ld!=='custom'){$e('#kbm-k').value=L[2];}S.k=Math.max(1,+$e('#kbm-k').value||1);$e('#kbm-k').disabled=S.ld!=='custom';$e('#kbm-ldn').textContent=L[3];
    S.mode=$e('#kbm-mode').value;S.len=Math.max(0,+$e('#kbm-len').value||0);S.mm=+$e('#kbm-mm').value;S.ze=Math.max(0,+$e('#kbm-ze').value||0);S.ikIn=Math.max(0,+$e('#kbm-ik').value||0);
    $e('#kbm-calc').hidden=S.mode!=='calc';$e('#kbm-ikbox').hidden=S.mode!=='ik';
  };
  const draw=()=>{
    rd();
    /* prospective fault current at the far end: Ik = U0 / (Ze + 2·L·ρ/S), copper at ~70 °C */
    const U0=S.dc?48:230,Rl=2*S.len*.0225/S.mm,Ik=S.mode==='calc'?(S.dc?NaN:U0/(S.ze+Rl)):S.ikIn;
    $e('#kbm-ikv').textContent=S.mode==='calc'?(S.dc?'คำนวณเฉพาะ AC 230 V':`Zs = ${(S.ze+Rl).toFixed(2)} Ω → Ik ≈ ${Math.round(Ik)} A`):'';
    const xi=S.k*S.Ib/S.In,xk=Ik/S.In;
    const marks=[];if(S.Ib>0)marks.push({x:S.Ib/S.In,col:'var(--s3)',l:`ใช้งาน ${S.Ib} A`,dash:'2 3',row:0});
    if(S.Ib>0&&S.k>1)marks.push({x:xi,col:'var(--warn)',l:`กระชาก ${Math.round(S.k*S.Ib)} A`,row:1});
    if(isFinite(xk)&&xk>0)marks.push({x:xk,col:'var(--err)',l:`ลัดวงจร ${Math.round(Ik)} A`,row:2});
    kbChart($e('#kbm-chart'),{show:KB_ORDER.filter(c=>S.show.includes(c)),dc:S.dc,In:S.In,marks});
    /* verdict table */
    const rows=KB_ORDER.map(c=>{
      const r=kbT(c,1,S.dc),run=S.Ib>S.In?{lvl:'err',t:'กระแสใช้งานเกิน In'}:null;
      const inr=S.k<=1||!S.Ib?{lvl:'ok',t:'—'}:xi>=r.hi?{lvl:'err',t:`ทริปตอนสตาร์ท (${xi.toFixed(1)}× ≥ ${r.hi.toFixed(1)}×)`}:xi>=r.lo?{lvl:'warn',t:`อาจทริปตอนสตาร์ท (${xi.toFixed(1)}× อยู่ในช่วง)`}:{lvl:'ok',t:`ผ่าน (${xi.toFixed(1)}× < ${r.lo.toFixed(1)}×)`};
      const sc=!isFinite(xk)||!(xk>0)?{lvl:'idle',t:'ไม่ได้ระบุ'}:xk>=r.hi?{lvl:'ok',t:`ทริปทันที (${xk.toFixed(1)}× ≥ ${r.hi.toFixed(1)}×)`}:xk>=r.lo?{lvl:'warn',t:`ไม่แน่นอน (${xk.toFixed(1)}× อยู่ในช่วง ${r.lo.toFixed(1)}–${r.hi.toFixed(1)}×)`}:{lvl:'err',t:`ไม่ทริปทันที ต้องรอ thermal ${kbSec(kbT(c,xk,S.dc).tMax)}`};
      const L=[run,inr,sc].filter(Boolean),bad=L.some(v=>v.lvl==='err'),warn=L.some(v=>v.lvl==='warn');
      return{c,inr,sc,run,v:bad?'err':warn?'warn':sc.lvl==='idle'?'idle':'ok'};
    });
    const pill=v=>`<span class="pill ${v.lvl}">${esc(v.t)}</span>`;
    $e('#kbm-tbl').innerHTML=`<thead><tr><th>Curve</th><th>ช่วง magnetic${S.dc?' (DC ≈ ×1.4)':''}</th><th>ตอนสตาร์ท</th><th>ตอนลัดวงจร</th><th>สรุป</th></tr></thead><tbody>`+rows.map(o=>{const r=kbT(o.c,1,S.dc);
      return`<tr><td><b>${o.c}</b></td><td class="mono">${r.lo.toFixed(r.lo%1?1:0)}–${r.hi.toFixed(r.hi%1?1:0)} × In = ${Math.round(r.lo*S.In)}–${Math.round(r.hi*S.In)} A</td><td>${pill(o.inr)}</td><td>${pill(o.sc)}</td><td>${pill(o.run||{lvl:o.v,t:o.v==='ok'?'เหมาะ':o.v==='idle'?'ผ่านเรื่องกระชาก ยังไม่ได้ตรวจลัดวงจร':o.v==='warn'?'ใช้ได้แต่ควรตรวจ':'ไม่เหมาะ'})}</td></tr>`}).join('')+'</tbody>';
    const good=rows.filter(o=>o.v==='ok').map(o=>o.c),half=rows.filter(o=>o.v==='idle').map(o=>o.c);
    $e('#kbm-sum').innerHTML=S.Ib>S.In?`<span class="simmsg err">กระแสใช้งาน ${S.Ib} A เกินพิกัด ${S.In} A เลือก In ใหม่ (และขนาดสายตาม) ก่อนเลือก curve</span>`
      :!good.length&&half.length?`ผ่านเรื่องกระแสกระชาก: <b>${half.join(', ')}</b> · ใส่กระแสลัดวงจรปลายสาย (เลือก "กรอกเอง" สำหรับ DC) เพื่อตรวจว่าตัดทันทีได้หรือไม่`
      :good.length?`curve ที่ผ่านทั้งสองเงื่อนไข: <b>${good.join(', ')}</b> · ถ้าผ่านหลายตัว เลือกตัวที่ทริปเร็วกว่า (อยู่ซ้ายกว่า) จะปลอดภัยกว่า`
      :`ไม่มี curve ที่ผ่านทั้งสองเงื่อนไข: ลดกระแสกระชาก (soft starter / อินเวอร์เตอร์) หรือเพิ่มกระแสลัดวงจร (สายใหญ่ขึ้น / สั้นลง) หรือเพิ่ม RCD/RCBO ช่วยตัดเมื่อลัดลงดิน`;
    /* point check under the chart */
    const xq=Math.max(1,+$e('#kbm-x').value||1);
    $e('#kbm-xr').innerHTML=KB_ORDER.filter(c=>S.show.includes(c)).map(c=>{const st=kbState(c,xq,S.dc);return`<li><span class="b ${st.lvl==='idle'?'idle':st.lvl}">${c}</span><span><b>${esc(st.t)}</b> · ${esc(st.d)}</span></li>`}).join('')||'<li><span class="b idle">–</span><span>เลือก curve ด้านบนก่อน</span></li>';
    $e('#kbm-xa').textContent=`${xq} × In = ${Math.round(xq*S.In)} A`;
  };
  el.addEventListener('input',e=>{if(e.target.closest('.kbmcb'))draw()});
  el.addEventListener('change',e=>{if(e.target.closest('.kbmcb'))draw()});
  el.addEventListener('click',e=>{const b=e.target.closest('[data-kbc]');if(!b)return;const c=b.dataset.kbc;S.show=S.show.includes(c)?S.show.filter(x=>x!==c):S.show.concat(c);b.setAttribute('aria-pressed',S.show.includes(c));draw()});
  kbQuiz(el);
  draw();
  return draw;
}
/* small instant-check quiz: <div class="kbq" data-ans="b"> with buttons data-o="a|b|c" and a .kbqx explanation */
function kbQuiz(el){
  el.querySelectorAll('.kbq').forEach(q=>q.addEventListener('click',e=>{const b=e.target.closest('[data-o]');if(!b)return;
    const ok=b.dataset.o===q.dataset.ans;q.querySelectorAll('[data-o]').forEach(x=>{x.classList.remove('kbok','kbno');x.setAttribute('aria-pressed','false')});
    b.classList.add(ok?'kbok':'kbno');b.setAttribute('aria-pressed','true');const x=q.querySelector('.kbqx');x.hidden=false;x.className='kbqx simmsg '+(ok?'ok':'err');x.textContent=(ok?'ถูกต้อง: ':'ยังไม่ใช่: ')+x.dataset.t}));
}
kbAdd({id:'mcb-curves',cat:'protect',upd:'2026-10-26',
  title:'เคิร์ฟการทริปของเบรกเกอร์ลูกย่อย (MCB): B, C, D, K, Z',
  summary:'MCB แต่ละชนิดต่างกันที่ "ทนกระแสกระชากได้กี่เท่าก่อนทริปทันที" อ่านกราฟเวลา-กระแส เลือก curve ให้เหมาะกับโหลดและความยาวสาย และข้อควรระวังเมื่อใช้กับไฟ DC',
  tags:['เบรกเกอร์','MCB','trip curve','เคิร์ฟ','B','C','D','K','Z','IEC 60898','IEC 60947-2','inrush','กระแสกระชาก','ลัดวงจร','thermal','magnetic','DC'],
  related:[['cable','06 สายไฟและเบรกเกอร์ → เลือกเบรกเกอร์'],['bench','05 ชุดทดลองวงจร DC'],['basics','00 หัวข้อ 08 ระบบป้องกัน']],
  src:[['What You Need to Know About Miniature Circuit Breaker Trip Curves — Electrical Engineering Resource','https://electricalengineeringresource.com/what-you-need-to-know-about-miniature-circuit-breaker-trip-curves/']],
  srcNote:'ค่าส่วน thermal ของ B/C/D ตาม IEC 60898-1 ส่วน K/Z เป็นเคิร์ฟของผู้ผลิตตาม IEC 60947-2 ซึ่งแต่ละยี่ห้อต่างกันเล็กน้อย กราฟในหน้านี้เป็นรูปทรงโดยประมาณเพื่อการเรียนรู้ งานจริงใช้กราฟจากแคตตาล็อกของรุ่นที่ซื้อ',
  body:()=>`
<section class="kbsec"><h2>เบรกเกอร์ตัดไฟได้ 2 แบบ</h2>
<p>MCB (Miniature Circuit Breaker) หนึ่งตัวมีกลไกป้องกัน 2 ชุดทำงานร่วมกัน:</p>
<ul>
<li><b>Thermal (แผ่นโลหะคู่ / ไบเมทัล)</b> ป้องกัน <b>โหลดเกิน</b> กระแสเกินพิกัดเล็กน้อยทำให้แผ่นโลหะร้อนและงอจนปลดกลไก ยิ่งกระแสมากยิ่งตัดเร็ว (หน่วงเวลาเป็นวินาทีถึงชั่วโมง) ทำหน้าที่ปกป้องสายไฟไม่ให้ร้อนเกิน</li>
<li><b>Magnetic (ขดลวดแม่เหล็ก)</b> ป้องกัน <b>ลัดวงจร</b> เมื่อกระแสสูงถึงระดับหนึ่ง แรงแม่เหล็กดึงกลไกให้ตัด <b>ทันที</b> (น้อยกว่า 0.1 วินาที ปกติไม่กี่มิลลิวินาที)</li>
</ul>
<p>ตัวอักษร B, C, D, K, Z บนเบรกเกอร์ (เช่น <span class="mono">C16</span> = curve C พิกัด 16 A) บอกว่า <b>ส่วน magnetic เริ่มตัดทันทีที่กระแสกี่เท่าของพิกัด In</b> ส่วน thermal ของ B, C, D เหมือนกัน</p>
</section>
<section class="kbsec"><h2>ตารางเปรียบเทียบแต่ละ curve</h2>
<div class="tblwrap"><table class="t kbt kbwide"><thead><tr><th>Curve</th><th>ตัดทันทีที่ (AC)</th><th>มาตรฐาน</th><th>เหมาะกับ</th><th>จุดเด่น / ข้อควรระวัง</th></tr></thead><tbody>
${KB_ORDER.map(c=>{const C=KB_CRV[c];return`<tr><td><b style="color:${C.col}">${c}</b></td><td class="mono">${C.lo}–${C.hi} × In</td><td>${C.std}</td><td>${C.use}</td><td>${C.why}</td></tr>`}).join('')}
</tbody></table></div>
<p class="hint">ช่วง เช่น C = 5–10 × In หมายถึง ต่ำกว่า 5 เท่า <b>ต้องไม่</b> ตัดทันที และตั้งแต่ 10 เท่า <b>ต้อง</b> ตัดทันที ระหว่างนั้นผู้ผลิตกำหนดจุดเองได้ (tolerance band) ค่า K และ Z ต่างกันได้ตามยี่ห้อ</p>
<p>จำง่าย ๆ: <b>B → C → D ทนกระชากเพิ่มขึ้นทีละประมาณ 2 เท่า</b> แต่ยิ่งทนกระชากมาก ก็ยิ่งต้องมีกระแสลัดวงจรสูงขึ้นจึงจะตัดทันที</p>
</section>
<section class="kbsec"><h2>ส่วน thermal: ตัวเลขที่ควรรู้</h2>
<div class="tblwrap"><table class="t kbt"><thead><tr><th>กระแส</th><th>B, C, D (IEC 60898-1)</th><th>K, Z (IEC 60947-2 ทั่วไป)</th></tr></thead><tbody>
<tr><td class="mono">1.05 × In</td><td>—</td><td>ไม่ตัดภายใน 1–2 ชม.</td></tr>
<tr><td class="mono">1.13 × In</td><td>ไม่ตัดภายใน 1 ชม.</td><td>—</td></tr>
<tr><td class="mono">1.2 × In</td><td>—</td><td>ตัดภายใน 1–2 ชม.</td></tr>
<tr><td class="mono">1.45 × In</td><td>ตัดภายใน 1 ชม.</td><td>—</td></tr>
<tr><td class="mono">2.55 × In</td><td>ตัดใน 1–60 วินาที (In ≤ 32 A) หรือ 1–120 วินาที (In > 32 A)</td><td>—</td></tr>
</tbody></table></div>
<ul>
<li>เบรกเกอร์ <b>ไม่ได้ตัดทันทีที่กระแสเกินพิกัด</b> กระแส 1.2 เท่าอาจไหลได้นานเป็นชั่วโมง จึงต้องเลือกสายให้รับกระแสได้ ≥ In เสมอ (Ib ≤ In ≤ Iz)</li>
<li>ค่าพิกัดกำหนดที่อุณหภูมิอ้างอิง 30 °C ตู้ไฟที่ตากแดด (เช่น ตู้คอมไบเนอร์บนหลังคา) ร้อนกว่านี้มาก เบรกเกอร์จะตัดเร็วขึ้น ต้องลดพิกัดตามตาราง derating ของผู้ผลิต</li>
<li>K และ Z มีส่วน thermal ไวกว่า (1.2 × In) จึงปกป้องสายจากโหลดเกินได้ดีกว่า B/C/D ที่ 1.45 × In</li>
</ul>
</section>
<section class="kbsec"><h2>อ่านกราฟเวลา-กระแส และทดลอง</h2>
<p>แกนนอนคือกระแสเป็นจำนวนเท่าของ In แกนตั้งคือเวลาที่ใช้ตัด (สเกล log) แต่ละ curve เป็น <b>แถบ</b> ไม่ใช่เส้นเดียว: เส้นทึบ = ตัดแน่นอนภายในเวลานี้ เส้นประ = ไม่ตัดก่อนเวลานี้ ตรงที่แถบดิ่งลงคือช่วง magnetic</p>
<div class="kbmcb">
 <div class="kbmctl"><div class="chips" id="kbm-crv" role="group" aria-label="curve ที่แสดง"></div>
  <label class="kbchk"><input type="checkbox" id="kbm-dc"> ใช้กับไฟ DC (ช่วง magnetic ≈ × 1.4)</label></div>
 <div id="kbm-chart" class="chart kbchart"></div>
 <div class="kbmx"><label>ลองกระแส (× In)<input type="number" id="kbm-x" min="1" max="60" step="0.5" value="4" inputmode="decimal"></label><span class="hint tight" id="kbm-xa"></span></div>
 <ul class="checks" id="kbm-xr"></ul>
 <h3>เลือก curve ให้วงจรจริง</h3>
 <p class="hint tight">เงื่อนไข 2 ข้อ: (1) กระแสกระชากตอนเปิดเครื่อง <b>ต่ำกว่า</b> ขอบล่างของช่วง magnetic จะได้ไม่ทริปเอง (2) กระแสลัดวงจรที่ <b>ปลายสาย</b> <b>สูงกว่า</b> ขอบบน จะได้ตัดทันทีเมื่อเกิดเหตุ</p>
 <div class="row3 kbmform">
  <label>พิกัดเบรกเกอร์ In (A)<select id="kbm-in"></select></label>
  <label>กระแสใช้งาน Ib (A)<input type="number" id="kbm-ib" min="0" step="0.1" value="8" inputmode="decimal"></label>
  <label>ชนิดโหลด<select id="kbm-ld"></select></label>
  <label>กระชาก (เท่าของ Ib)<input type="number" id="kbm-k" min="1" step="0.5" value="7" inputmode="decimal"></label>
  <label>กระแสลัดวงจรปลายสาย<select id="kbm-mode"><option value="calc">คำนวณจากสาย (AC 230 V)</option><option value="ik">กรอกเอง</option></select></label>
 </div>
 <p class="hint tight" id="kbm-ldn"></p>
 <div class="row3 kbmform" id="kbm-calc">
  <label>ความยาวสาย (ม. ทางเดียว)<input type="number" id="kbm-len" min="0" step="1" value="25" inputmode="decimal"></label>
  <label>ขนาดสาย (mm²)<select id="kbm-mm">${[1.5,2.5,4,6,10,16,25].map(v=>`<option ${v===2.5?'selected':''}>${v}</option>`).join('')}</select></label>
  <label>อิมพีแดนซ์ต้นทาง Ze (Ω)<input type="number" id="kbm-ze" min="0" step="0.05" value="0.5" inputmode="decimal"></label>
 </div>
 <div class="row3 kbmform" id="kbm-ikbox" hidden><label>กระแสลัดวงจร Ik (A)<input type="number" id="kbm-ik" min="0" step="10" value="300" inputmode="decimal"></label></div>
 <p class="hint tight mono" id="kbm-ikv"></p>
 <div class="tblwrap"><table class="t kbt kbwide" id="kbm-tbl"></table></div>
 <p id="kbm-sum" class="kbsum"></p>
 <p class="hint tight">Ik ≈ 230 V ÷ (Ze + ความต้านทานสายไป-กลับ) ใช้ทองแดงที่ ~70 °C (0.0225 Ω·mm²/m) Ze ขึ้นกับหม้อแปลงและสายเมน วัดจริงด้วยเครื่องวัดลูปอิมพีแดนซ์ ค่ากระแสกระชากเป็นค่าทั่วไป ใช้ข้อมูลผู้ผลิตเมื่อมี</p>
</div>
</section>
<section class="kbsec"><h2>ใช้ MCB กับไฟ DC (ระบบโซลาร์)</h2>
<ul>
<li>ช่วง magnetic ในตารางเป็นค่าสำหรับ AC (ค่า rms) กับไฟ DC ต้องใช้กระแสสูงขึ้นประมาณ <b>√2 ≈ 1.4 เท่า</b> จึงตัดทันที เช่น C ราว 7–14 × In ดูค่าจริงจากข้อมูล DC ของผู้ผลิต</li>
<li><b>ต้องใช้เบรกเกอร์ที่ระบุพิกัด DC</b> (เช่น 250 V DC ต่อขั้ว) ห้ามใช้เบรกเกอร์ AC ตัดไฟ DC เพราะ DC ไม่มีจุดตัดศูนย์ อาร์กดับยาก อาจไหม้ เบรกเกอร์ DC หลายรุ่นมีขั้ว + / − ต้องต่อตามทิศ</li>
<li><b>ฝั่งแผง (PV)</b> กระแสลัดวงจรถูกจำกัดที่ประมาณ Isc ของแผง (ไม่กี่สิบแอมป์) ส่วน magnetic แทบไม่ได้ทำงาน เบรกเกอร์/สวิตช์ DC ฝั่งนี้ใช้ตัดตอนซ่อมบำรุงและกันกระแสย้อนจากสตริงขนาน (ใช้ฟิวส์ gPV ร่วม) พิกัดแรงดันต้อง ≥ Voc ที่อุณหภูมิต่ำสุด</li>
<li><b>ฝั่งแบต</b> ตรงข้ามกัน: แบตลิเทียมจ่ายกระแสลัดวงจรได้เป็นพัน ๆ แอมป์ ต้องดู <b>พิกัดตัดกระแส (kA ที่แรงดัน DC)</b> ให้พอ หรือใช้ฟิวส์ class T / NH และระวังกระแสกระชากตอนต่ออินเวอร์เตอร์ที่ตัวเก็บประจุยังว่าง (ใช้วงจร pre-charge ตามคู่มือ)</li>
</ul>
</section>
<section class="kbsec"><h2>อ่านป้ายบนเบรกเกอร์</h2>
<ul>
<li><span class="mono">C16</span> curve และพิกัดกระแส In</li>
<li><span class="mono">6000</span> ในกรอบสี่เหลี่ยม = พิกัดตัดกระแสลัดวงจร Icn 6 kA (IEC 60898-1) ต้องไม่ต่ำกว่ากระแสลัดวงจรที่จุดติดตั้ง (ใกล้หม้อแปลงอาจต้อง 10 kA)</li>
<li><span class="mono">3</span> ในกรอบเล็ก = energy limiting class 3 จำกัดพลังงานขณะลัดวงจรได้ดี</li>
<li>แรงดัน Ue (230/400 V AC) และถ้ามี พิกัด DC ต่อขั้ว · จำนวนขั้ว (1P, 1P+N, 2P, 3P, 4P) · หมายเลขมาตรฐาน</li>
</ul>
</section>
<section class="kbsec"><h2>ข้อผิดพลาดที่พบบ่อย</h2>
<ul>
<li><b>เปลี่ยนเบรกเกอร์ให้ใหญ่ขึ้นเพราะทริปบ่อย</b> โดยไม่เปลี่ยนสาย สายจะไม่ได้รับการป้องกันและร้อนจนไฟไหม้ได้ ถ้าทริปตอนเปิดเครื่อง (กระชาก) ให้พิจารณาเปลี่ยน curve ที่พิกัดเดิม</li>
<li><b>ใช้ curve D กับวงจรสายยาว</b> เช่น ปั๊มน้ำปลายสวน กระแสลัดวงจรปลายสายอาจไม่ถึง 20 × In เบรกเกอร์ไม่ตัดทันที</li>
<li><b>ใช้ curve C/D กับวงจรที่จ่ายจากอินเวอร์เตอร์ off-grid หรือเครื่องปั่นไฟ</b> แหล่งจ่ายเหล่านี้ให้กระแสลัดวงจรได้แค่ 1.5–3 เท่าของพิกัดเครื่อง เบรกเกอร์อาจไม่ตัดทันที (ดูข้อกำหนดในคู่มืออินเวอร์เตอร์)</li>
<li><b>ใช้เบรกเกอร์ AC ในวงจร DC</b> หรือใช้เบรกเกอร์ DC ที่พิกัดแรงดันต่ำกว่าแรงดันสตริง</li>
<li>เบรกเกอร์ป้องกันกระแสเกินเท่านั้น <b>ไม่ได้กันไฟดูด</b> การป้องกันคนจากไฟรั่วต้องใช้ RCD / RCBO</li>
</ul>
</section>
<section class="kbsec"><h2>ทดสอบความเข้าใจ</h2>
<div class="kbq" data-ans="b"><p>1. ปั๊มน้ำสตาร์ทตรง ทำให้ C16 ทริปทุกครั้งที่เปิด แต่ใช้งานปกติไม่ทริป ควรแก้อย่างไร</p>
 <div class="chips"><button type="button" class="chip" data-o="a">เปลี่ยนเป็น C32 สายเดิม</button><button type="button" class="chip" data-o="b">ตรวจกระแสลัดวงจรปลายสาย แล้วเปลี่ยนเป็น D16 หรือ K16</button><button type="button" class="chip" data-o="c">เปลี่ยนเป็น B16</button></div>
 <p class="kbqx" data-t="ปัญหาคือกระแสกระชากตอนสตาร์ท ไม่ใช่โหลดเกิน จึงแก้ที่ curve ให้ทนกระชากมากขึ้นที่พิกัดเดิม แต่ต้องมั่นใจว่ากระแสลัดวงจรปลายสายสูงพอให้ D/K ตัดทันที ส่วน C32 ทำให้สายเดิมไม่ได้รับการป้องกัน และ B ทริปง่ายกว่าเดิม" hidden></p></div>
<div class="kbq" data-ans="c"><p>2. เบรกเกอร์ C10 ต้องตัดทันทีแน่นอนเมื่อกระแสเท่าใด (AC)</p>
 <div class="chips"><button type="button" class="chip" data-o="a">10 A</button><button type="button" class="chip" data-o="b">50 A</button><button type="button" class="chip" data-o="c">100 A</button></div>
 <p class="kbqx" data-t="curve C ตัดทันทีแน่นอนที่ 10 × In = 100 A ช่วง 50–100 A อาจตัดทันทีหรือไม่ก็ได้ ส่วน 10 A คือพิกัดใช้งาน" hidden></p></div>
<div class="kbq" data-ans="a"><p>3. กระแส 1.3 × In ไหลผ่านเบรกเกอร์ C (IEC 60898-1) จะเกิดอะไร</p>
 <div class="chips"><button type="button" class="chip" data-o="a">อาจไหลได้นานถึงราว 1 ชั่วโมงก่อนตัด หรือไม่ตัดเลย</button><button type="button" class="chip" data-o="b">ตัดภายใน 1 วินาที</button><button type="button" class="chip" data-o="c">ตัดทันที</button></div>
 <p class="kbqx" data-t="ส่วน thermal รับประกันว่าตัดภายใน 1 ชม. ที่ 1.45 × In ส่วน 1.13 × In ต้องไม่ตัดใน 1 ชม. กระแส 1.3 เท่าจึงอยู่ระหว่างนั้น สายต้องรับกระแสได้ไม่น้อยกว่า In" hidden></p></div>
<div class="kbq" data-ans="b"><p>4. ทำไมเบรกเกอร์ฝั่งแผงโซลาร์แทบไม่ได้ใช้ส่วน magnetic</p>
 <div class="chips"><button type="button" class="chip" data-o="a">เพราะไฟ DC ไม่ทำให้เกิดสนามแม่เหล็ก</button><button type="button" class="chip" data-o="b">เพราะกระแสลัดวงจรของแผงถูกจำกัดที่ประมาณ Isc ซึ่งต่ำกว่าช่วง magnetic</button><button type="button" class="chip" data-o="c">เพราะแผงมีฟิวส์ในตัว</button></div>
 <p class="kbqx" data-t="แผงเป็นแหล่งจ่ายกระแสจำกัด ลัดวงจรแล้วกระแสขึ้นแค่ราว Isc จึงไม่ถึงหลายเท่าของ In ส่วน magnetic ทำงานกับ DC ได้ (แต่ต้องใช้กระแสสูงกว่า AC ราว 1.4 เท่า)" hidden></p></div>
</section>`,
  init:kbMcbInit
});

/* ---------- library UI ---------- */
let kbRedraw=null;
function kbText(a){if(!a._t){const d=document.createElement('div');d.innerHTML=a.body();a._t=(a.title+' '+a.summary+' '+(a.tags||[]).join(' ')+' '+d.textContent).toLowerCase()}return a._t}
function kbList(){
  const q=KB.q.trim().toLowerCase(),L=KB_ARTS.filter(a=>(!KB.cat||a.cat===KB.cat)&&(!q||q.split(/\s+/).every(w=>kbText(a).includes(w))));
  const cats=KB_CATS.filter(([k])=>KB_ARTS.some(a=>a.cat===k));
  return`<div class="panelbox kbbar"><input type="search" id="kbq" placeholder="ค้นหาในคลังความรู้ เช่น curve, DC, ลัดวงจร" value="${esc(KB.q)}" aria-label="ค้นหาบทความ">
    <div class="chips" role="group" aria-label="หมวด"><button type="button" class="chip" data-kbcat="" aria-pressed="${!KB.cat}">ทั้งหมด (${KB_ARTS.length})</button>${cats.map(([k,n])=>`<button type="button" class="chip" data-kbcat="${k}" aria-pressed="${KB.cat===k}">${esc(n)} (${KB_ARTS.filter(a=>a.cat===k).length})</button>`).join('')}</div></div>
  <div class="kbcards">${L.length?L.map(a=>`<button type="button" class="kbcard" data-kbopen="${esc(a.id)}"><span class="pill idle">${esc(kbCatName(a.cat))}</span><b>${esc(a.title)}</b><span class="hint tight">${esc(a.summary)}</span></button>`).join(''):'<p class="hint">ไม่พบบทความที่ตรงกับคำค้น</p>'}</div>`;
}
function kbArticle(a){
  return`<div class="kbnav"><button type="button" class="btn sm" data-kbback>← คลังความรู้</button><span class="hint tight">${esc(kbCatName(a.cat))}${a.upd?` · ปรับปรุง ${esc(a.upd)}`:''}</span></div>
  <article class="kbart" id="kbart"><h2 class="kbh">${esc(a.title)}</h2><p class="sub">${esc(a.summary)}</p>${a.body()}
  ${a.related&&a.related.length?`<section class="kbsec"><h2>ลองต่อในเมนู</h2><div class="chips">${a.related.map(([t,l])=>`<button type="button" class="chip" data-kbgo="${esc(t)}">${esc(l)}</button>`).join('')}</div></section>`:''}
  ${a.src&&a.src.length?`<section class="kbsec kbsrc"><h2>แหล่งอ้างอิง</h2><ul>${a.src.map(([t,u])=>`<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a></li>`).join('')}</ul>${a.srcNote?`<p class="hint tight">${esc(a.srcNote)}</p>`:''}</section>`:''}</article>`;
}
function kbRender(){
  const h=document.getElementById('kbhost');if(!h)return;
  const a=KB.open&&KB_ARTS.find(x=>x.id===KB.open);
  kbRedraw=null;
  if(a){h.innerHTML=kbArticle(a);if(a.init)kbRedraw=a.init(h.querySelector('#kbart'))||null}
  else{KB.open='';h.innerHTML=kbList()}
}
function kbOpen(id){KB.open=id||'';if(typeof curTab!=='undefined'&&curTab!=='library'&&typeof showTab==='function')showTab('library');else kbRender();
  try{history.replaceState(null,'','#library'+(id?'/'+id:''))}catch(e){}window.scrollTo(0,0)}
function initLibrary(){
  const h=document.getElementById('kbhost');if(!h)return;
  h.addEventListener('click',e=>{
    const o=e.target.closest('[data-kbopen]');if(o){kbOpen(o.dataset.kbopen);return}
    if(e.target.closest('[data-kbback]')){kbOpen('');return}
    const c=e.target.closest('[data-kbcat]');if(c){KB.cat=c.dataset.kbcat;kbRender();return}
    const g=e.target.closest('[data-kbgo]');if(g&&typeof showTab==='function')showTab(g.dataset.kbgo);
  });
  h.addEventListener('input',e=>{if(e.target.id!=='kbq')return;KB.q=e.target.value;const pos=e.target.selectionStart;kbRender();const i=document.getElementById('kbq');if(i){i.focus();try{i.setSelectionRange(pos,pos)}catch(_){}}});
  window.addEventListener('resize',()=>{if(typeof curTab!=='undefined'&&curTab==='library'&&kbRedraw)kbRedraw()});
  /* links from other menus: <a data-kblink="mcb-curves"> */
  document.addEventListener('click',e=>{const l=e.target.closest('[data-kblink]');if(!l)return;e.preventDefault();kbOpen(l.dataset.kblink)});
}
