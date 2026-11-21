/* ---- เมนู 21 ตู้โหลด (Load Center): จำลองตู้ 1 เฟส / 3 เฟส 6 · 9 · 12 ช่อง ----
   ใส่เบรกเกอร์ + อุปกรณ์ในแต่ละช่อง เพิ่ม/ลดอุปกรณ์ เลือกขนาดสาย ดูสีสายตามมาตรฐาน วสท. 2564 ข้อ 5.1.11
   (1 เฟส: L น้ำตาล · 3 เฟส: L1 น้ำตาล L2 ดำ L3 เทา · N ฟ้า · PE เขียวแถบเหลือง) และตรวจเบรกเกอร์/สาย/สมดุลเฟส
   ค่ากระแสสายใช้ตาราง CB_AMP ของเมนู 06 (PVC 70 °C ตัวนำทองแดง) ผลเป็นค่าประมาณเพื่อการเรียนรู้ */
const DB_COL={
  brown:['น้ำตาล','#7b4b25'],black:['ดำ','#222'],gray:['เทา','#8d949a'],blue:['ฟ้า','#2f80d8'],
  gy:['เขียวแถบเหลือง','linear-gradient(90deg,#2e9e49 50%,#f2d21b 50%)'],green:['เขียว','#2e9e49'],red:['แดง','#cf3b32'],
  yellow:['เหลือง','#f2d21b'],white:['ขาว','#f4f4f4'],orange:['ส้ม','#ee8a1f']
};
const DB_STD={L:'brown',L1:'brown',L2:'black',L3:'gray',N:'blue',PE:'gy'};
const DB_SLOTS=[6,9,12];
const DB_BRK=[6,10,13,16,20,25,32,40,50,63];
const DB_MAIN=[16,20,25,32,40,50,63,80,100,125];
const DB_WIRE=CB_SIZES.filter(s=>s<=70);
const DB_METH=[['B1','B1 ร้อยท่อเดินบนผนัง'],['B2','B2 สายหลายแกนร้อยท่อ'],['A1','A1 ร้อยท่อในผนังมีฉนวน'],['C','C ตีกิ๊ปบนผนัง'],['E','E เดินบนรางเคเบิล']];
const DB_BTYPE=[['','ว่าง (ไม่ใส่เบรกเกอร์)'],['mcb1','MCB 1P'],['rcbo','RCBO 1P+N 30 mA'],['mcb3','MCB 3P (ครอบ 3 ช่อง)']];
/* อุปกรณ์: w = กำลังไฟฟ้า (W), pf = ตัวประกอบกำลัง, ph = 1 หรือ 3 เฟส, rcd = ควรมีเครื่องตัดไฟรั่ว, ed = แก้ค่า W ได้ */
const DB_DEV=[
  {id:'led',n:'หลอด LED 18 W',w:18,pf:.9,ph:1},
  {id:'fan',n:'พัดลมเพดาน',w:75,pf:.85,ph:1},
  {id:'sock',n:'เต้ารับ 1 ที่ (180 VA)',w:180,pf:1,ph:1,rcd:1},
  {id:'fr',n:'ตู้เย็น',w:200,pf:.7,ph:1},
  {id:'ac9',n:'แอร์ 9,000 BTU',w:800,pf:.9,ph:1},
  {id:'ac12',n:'แอร์ 12,000 BTU',w:1100,pf:.9,ph:1},
  {id:'ac18',n:'แอร์ 18,000 BTU',w:1700,pf:.9,ph:1},
  {id:'ac24',n:'แอร์ 24,000 BTU',w:2300,pf:.9,ph:1},
  {id:'wh35',n:'เครื่องทำน้ำอุ่น 3,500 W',w:3500,pf:1,ph:1,rcd:1},
  {id:'wh45',n:'เครื่องทำน้ำอุ่น 4,500 W',w:4500,pf:1,ph:1,rcd:1},
  {id:'pmp1',n:'ปั๊มน้ำ 1 HP',w:900,pf:.8,ph:1,rcd:1},
  {id:'wm',n:'เครื่องซักผ้า',w:500,pf:.8,ph:1,rcd:1},
  {id:'ind',n:'เตาแม่เหล็กไฟฟ้า 2,000 W',w:2000,pf:1,ph:1},
  {id:'ev7',n:'EV wall charger 1 เฟส 7 kW',w:7000,pf:1,ph:1,rcd:1},
  {id:'c1',n:'อุปกรณ์กำหนดเอง 1 เฟส',w:1000,pf:.9,ph:1,ed:1},
  {id:'m3',n:'มอเตอร์ 3 เฟส 3 HP',w:2800,pf:.8,ph:3},
  {id:'p3',n:'ปั๊มน้ำ 3 เฟส 2 HP',w:2000,pf:.8,ph:3,rcd:1},
  {id:'m5',n:'มอเตอร์ 3 เฟส 5 HP',w:4600,pf:.8,ph:3},
  {id:'ac48',n:'แอร์ 3 เฟส 48,000 BTU',w:5500,pf:.85,ph:3},
  {id:'ev11',n:'EV wall charger 3 เฟส 11 kW',w:11000,pf:1,ph:3,rcd:1},
  {id:'c3',n:'อุปกรณ์กำหนดเอง 3 เฟส',w:3000,pf:.85,ph:3,ed:1}
];
const DB_DEVBY={};DB_DEV.forEach(d=>DB_DEVBY[d.id]=d);
const DB_SLOT=()=>({brk:'',a:16,w:2.5,devs:[],cw:{}});
const DB_DEF=()=>{const o={sys:'1',n:6,main:40,mw:10,meth:'B1',mode:'std',slots:[]};for(let i=0;i<12;i++)o.slots.push(DB_SLOT());return o};
let DB=DB_DEF();
let dbMsg='';
const dbF=(v,d=1)=>isFinite(v)?(+v).toLocaleString('th-TH',{minimumFractionDigits:d,maximumFractionDigits:d}):'–';
const dbPh=i=>DB.sys==='3'?['L1','L2','L3'][i%3]:'L';
const dbTaken=i=>DB.sys==='3'&&i%3!==0&&DB.slots[i-i%3].brk==='mcb3';
const dbPoles=sl=>sl.brk==='mcb3'?3:2;
/* ตัวนำของวงจร (ตามเบรกเกอร์) */
function dbConds(i){const sl=DB.slots[i];if(sl.brk==='mcb3')return['L1','L2','L3','PE'];return[dbPh(i),'N','PE']}
function dbMinWire(a,poles){return DB_WIRE.find(s=>cbAmp('thw',DB.meth,poles,s)>=a)||null}
function dbCur(sl){
  let I=0,P=0;
  sl.devs.forEach(x=>{const d=DB_DEVBY[x.id];if(!d)return;const w=(d.ed&&x.w!=null?x.w:d.w)*x.q;P+=w;I+=d.ph===3?w/(Math.sqrt(3)*400*d.pf):w/(230*d.pf)});
  return{I,P};
}
/* ตรวจหนึ่งช่อง: คืนรายการข้อความ + ระดับรวม */
function dbCheck(i){
  const sl=DB.slots[i],r={items:[],lvl:'idle',I:0,P:0,amp:0,minw:null};
  if(!sl.brk)return r;
  const c=dbCur(sl);r.I=c.I;r.P=c.P;
  const poles=dbPoles(sl);r.amp=cbAmp('thw',DB.meth,poles,sl.w);r.minw=dbMinWire(sl.a,poles);
  const add=(lvl,t)=>r.items.push({lvl,t});
  if(r.I>sl.a)add('err',`โหลด ${dbF(r.I)} A เกินเบรกเกอร์ ${sl.a} A เบรกเกอร์จะตัดวงจร`);
  else if(r.I>sl.a*.8)add('warn',`โหลด ${dbF(r.I)} A เกิน 80% ของเบรกเกอร์ ${sl.a} A (โหลดต่อเนื่องควรไม่เกิน 80%)`);
  else if(r.I>0)add('ok',`โหลด ${dbF(r.I)} A ไม่เกินเบรกเกอร์ ${sl.a} A`);
  if(r.amp<sl.a)add('err',`สาย ${sl.w} mm² ทนกระแสได้ ${dbF(r.amp)} A น้อยกว่าเบรกเกอร์ ${sl.a} A สายไม่ถูกป้องกัน ใช้อย่างน้อย ${r.minw||'> 70'} mm²`);
  else add('ok',`สาย ${sl.w} mm² ทนกระแสได้ ${dbF(r.amp)} A ≥ เบรกเกอร์ ${sl.a} A`);
  if(sl.devs.some(x=>DB_DEVBY[x.id]&&DB_DEVBY[x.id].rcd)&&sl.brk==='mcb1')add('warn','มีเต้ารับ/เครื่องทำน้ำอุ่น/ปั๊ม/EV ในวงจรนี้ ควรใช้ RCBO หรือมี RCD 30 mA ป้องกันไฟดูด');
  if(sl.brk==='mcb3'&&!sl.devs.length)add('warn','เบรกเกอร์ 3P ยังไม่มีอุปกรณ์ 3 เฟส');
  if(DB.mode==='practice'){
    const sz=sl.w;dbConds(i).forEach(k=>{
      const ch=sl.cw[k],std=DB_STD[k];
      if(!ch)add('warn',`ยังไม่เลือกสีสาย ${k}`);
      else if(ch!==std&&!(sz>16&&ch==='black'&&k!=='PE'))add('err',`สี ${k} เลือก "${DB_COL[ch][0]}" แต่มาตรฐานคือ "${DB_COL[std][0]}"`);
    });
  }
  r.lvl=r.items.some(x=>x.lvl==='err')?'err':r.items.some(x=>x.lvl==='warn')?'warn':'ok';
  return r;
}
/* สรุปทั้งตู้ */
function dbSummary(){
  const ph=DB.sys==='3'?[0,0,0]:[0],pw=ph.map(()=>0);let nb=0,np=0,err=0,warn=0;
  const rows=[];
  for(let i=0;i<DB.n;i++){
    if(dbTaken(i))continue;
    const sl=DB.slots[i],ck=dbCheck(i);rows.push(ck);
    if(!sl.brk)continue;nb++;np+=ck.P;
    if(sl.brk==='mcb3')ph.forEach((_,k)=>{ph[k]+=ck.I;pw[k]+=ck.P/3});
    else{const k=DB.sys==='3'?i%3:0;ph[k]+=ck.I;pw[k]+=ck.P}
    if(ck.lvl==='err')err++;else if(ck.lvl==='warn')warn++;
  }
  const mx=Math.max(...ph),mn=Math.min(...ph);
  const imb=DB.sys==='3'&&mx>0?(mx-mn)/mx*100:0;
  const mAmp=cbAmp('thw',DB.meth,DB.sys==='3'?3:2,DB.mw);
  return{ph,pw,nb,np,err,warn,mx,imb,mAmp,mMin:dbMinWire(DB.main,DB.sys==='3'?3:2)};
}
/* ---------- ตัวช่วยแก้ state ---------- */
function dbSetSys(v){
  if(v!=='1'&&v!=='3')return;
  DB.sys=v;
  DB.slots.forEach(s=>{
    if(v==='1'&&s.brk==='mcb3')s.brk='mcb1';
    s.devs=s.devs.filter(x=>{const d=DB_DEVBY[x.id];return d&&(v==='3'||d.ph===1)&&(s.brk==='mcb3'?d.ph===3:d.ph===1)});
    s.cw={};
  });
  if(v==='3')DB.main=Math.max(DB.main,25);
}
function dbSetBrk(i,v){
  const s=DB.slots[i];
  if(v==='mcb3'){
    if(DB.sys!=='3'||i%3!==0){dbMsg='MCB 3P ใช้ได้เฉพาะตู้ 3 เฟส และต้องเริ่มที่ช่องแถวบนสุดของคอลัมน์ (L1)';return}
    if(DB.slots[i+1].brk||DB.slots[i+2].brk){dbMsg='ช่องที่ '+(i+2)+' และ '+(i+3)+' ต้องว่างก่อน เพราะ MCB 3P ครอบ 3 ช่องของคอลัมน์';return}
    DB.slots[i+1].devs=[];DB.slots[i+2].devs=[];
  }
  const was3=s.brk==='mcb3';
  s.brk=v;s.cw={};
  s.devs=s.devs.filter(x=>{const d=DB_DEVBY[x.id];return d&&(v==='mcb3'?d.ph===3:!was3&&d.ph===1||was3&&v!=='mcb3'&&d.ph===1)});
  dbMsg='';
}
function dbAddDev(i,id){
  const s=DB.slots[i],d=DB_DEVBY[id];if(!d||!s.brk)return;
  const ex=s.devs.find(x=>x.id===id&&!d.ed);
  if(ex)ex.q=Math.min(99,ex.q+1);else s.devs.push({id,q:1});
}
function dbExample(){
  DB=DB_DEF();DB.sys='1';DB.n=6;DB.main=40;DB.mw=10;
  const S=DB.slots;
  S[0]={brk:'mcb1',a:10,w:1.5,devs:[{id:'led',q:12},{id:'fan',q:2}],cw:{}};
  S[1]={brk:'rcbo',a:16,w:2.5,devs:[{id:'sock',q:8}],cw:{}};
  S[2]={brk:'rcbo',a:20,w:2.5,devs:[{id:'ac12',q:1}],cw:{}};
  S[3]={brk:'rcbo',a:20,w:2.5,devs:[{id:'ac12',q:1}],cw:{}};
  S[4]={brk:'rcbo',a:32,w:6,devs:[{id:'wh45',q:1}],cw:{}};
  dbMsg='';
}
/* ---------- แสดงผล ---------- */
const dbSw=k=>`<span class="dbsw" style="background:${DB_COL[k][1]}" title="${DB_COL[k][0]}"></span>`;
const dbOpt=(arr,cur)=>arr.map(x=>{const[v,t]=Array.isArray(x)?x:[x,x];return`<option value="${v}"${String(v)===String(cur)?' selected':''}>${t}</option>`}).join('');
function dbBoardHTML(){
  const sys=DB.sys==='3',buses=sys?['L1','L2','L3','N','PE']:['L','N','PE'];
  return`<div class="dbboard"><div class="dbmain"><b>เมนเบรกเกอร์ ${DB.main} A ${sys?'3P / 4P':'2P'}</b><span>สายเมน ${DB.mw} mm² ${dbSw(sys?'brown':'brown')}${sys?dbSw('black')+dbSw('gray'):''}${dbSw('blue')}${dbSw('gy')}</span></div>`+
    `<div class="dbbus">${buses.map(b=>`<span class="dbbar">${dbSw(DB_STD[b])}<b>${b}</b> ${esc(DB_COL[DB_STD[b]][0])}</span>`).join('')}</div></div>`;
}
function dbSlotHTML(i,span){
  const sl=DB.slots[i],ph=dbPh(i),pk=ph==='L'?'brown':DB_STD[ph],ck=dbCheck(i),en=!!sl.brk;
  const lab=span?`ช่อง ${i+1}-${i+3} · L1 L2 L3`:`ช่อง ${i+1} · ${ph}`;
  const typeOpts=DB_BTYPE.filter(x=>x[0]!=='mcb3'||(DB.sys==='3'&&i%3===0)).map(x=>[x[0],x[1]]);
  const devOpts=DB_DEV.filter(d=>sl.brk==='mcb3'?d.ph===3:d.ph===1);
  let h=`<div class="dbslot ${en?ck.lvl:'empty'}" style="--ph:${DB_COL[pk][1]}"><div class="dbh"><b>${lab}</b><span class="pill ${en?ck.lvl:'idle'}">${en?(ck.lvl==='ok'?'ผ่าน':ck.lvl==='warn'?'เตือน':'ผิด'):'ว่าง'}</span></div>`;
  h+=`<div class="dbrow"><label>เบรกเกอร์<select data-dbs="${i}:brk">${dbOpt(typeOpts,sl.brk)}</select></label>`;
  if(en)h+=`<label>ขนาด (A)<select data-dbs="${i}:a">${dbOpt(DB_BRK,sl.a)}</select></label><label>สาย (mm²)<select data-dbs="${i}:w">${dbOpt(DB_WIRE,sl.w)}</select></label>`;
  h+=`</div>`;
  if(!en){return h+`<p class="dbhint">เลือกเบรกเกอร์เพื่อเริ่มใส่อุปกรณ์ในช่องนี้</p></div>`}
  /* สีสาย */
  h+=`<div class="dbwires">`+dbConds(i).map(k=>{
    const std=DB_STD[k];
    if(DB.mode==='practice'){const ch=sl.cw[k]||'';
      const bad=ch&&ch!==std&&!(sl.w>16&&ch==='black'&&k!=='PE');
      return`<label class="dbwire ${bad?'bad':ch?'good':''}">${ch?dbSw(ch):'<span class="dbsw none"></span>'}<b>${k}</b><select data-dbc="${i}:${k}"><option value="">เลือกสี…</option>${Object.keys(DB_COL).map(c=>`<option value="${c}"${c===ch?' selected':''}>${DB_COL[c][0]}</option>`).join('')}</select></label>`}
    return`<span class="dbwire good">${dbSw(std)}<b>${k}</b> ${esc(DB_COL[std][0])}</span>`}).join('')+`</div>`;
  /* อุปกรณ์ */
  h+=`<ul class="dbdevs">`+sl.devs.map((x,j)=>{const d=DB_DEVBY[x.id];if(!d)return'';
    const w=d.ed&&x.w!=null?x.w:d.w;
    return`<li><span class="dbdn">${esc(d.n)}${d.ed?` <input class="dbw" type="number" min="1" step="50" value="${w}" data-dbcw="${i}:${j}" aria-label="กำลังไฟ W"> W`:` · ${dbF(d.w,0)} W`}</span><span class="dbqty"><button type="button" class="btn sm" data-dbq="${i}:${j}:-1" aria-label="ลดจำนวน">−</button><b>${x.q}</b><button type="button" class="btn sm" data-dbq="${i}:${j}:1" aria-label="เพิ่มจำนวน">+</button><button type="button" class="btn sm" data-dbrm="${i}:${j}" aria-label="เอาอุปกรณ์ออก">✕</button></span></li>`}).join('')+`</ul>`;
  h+=`<label class="dbadd">เพิ่มอุปกรณ์<select data-dbadd="${i}"><option value="">+ เลือกอุปกรณ์…</option>${devOpts.map(d=>`<option value="${d.id}">${esc(d.n)}${d.ed?'':' · '+dbF(d.w,0)+' W'}</option>`).join('')}</select></label>`;
  h+=`<div class="dbcalc"><span>กำลัง ${dbF(ck.P,0)} W</span><span>กระแส ${dbF(ck.I)} A</span><span>สายทนได้ ${dbF(ck.amp)} A</span><span>สายขั้นต่ำ ${ck.minw||'> 70'} mm²</span></div>`;
  h+=`<ul class="checks">`+ck.items.map(c=>`<li><span class="b ${c.lvl}">${c.lvl==='ok'?'✓':c.lvl==='warn'?'!':'×'}</span><span>${esc(c.t)}</span></li>`).join('')+`</ul></div>`;
  return h;
}
function dbRender(){
  const host=document.getElementById('dbhost');if(!host)return;
  const sm=dbSummary(),sys=DB.sys==='3';
  const lvl=sm.err?'err':sm.warn?'warn':sm.nb?'ok':'idle';
  const mainErr=sm.mx>DB.main,mainWire=sm.mAmp<DB.main;
  let h=`<div class="verdict ${lvl==='idle'?'warn':lvl}"><b>ตู้โหลด ${sys?'3 เฟส':'1 เฟส'} ${DB.n} ช่อง</b><span>ใส่เบรกเกอร์ ${sm.nb} ช่อง · ผิด ${sm.err} · เตือน ${sm.warn}</span><span class="nums">รวม ${dbF(sm.np,0)} W</span></div>`;
  if(dbMsg)h+=`<p class="hint" role="alert">${esc(dbMsg)}</p>`;
  h+=`<div class="card dbctl"><div class="dbrow">`+
    `<label>ระบบไฟ<select data-dbg="sys">${dbOpt([['1','1 เฟส 230 V (L + N + PE)'],['3','3 เฟส 400/230 V (L1 L2 L3 + N + PE)']],DB.sys)}</select></label>`+
    `<label>จำนวนช่อง<select data-dbg="n">${dbOpt(DB_SLOTS.map(n=>[n,n+' ช่อง']),DB.n)}</select></label>`+
    `<label>เมนเบรกเกอร์ (A)<select data-dbg="main">${dbOpt(DB_MAIN,DB.main)}</select></label>`+
    `<label>สายเมน (mm²)<select data-dbg="mw">${dbOpt(DB_WIRE,DB.mw)}</select></label>`+
    `<label>วิธีเดินสาย<select data-dbg="meth">${dbOpt(DB_METH,DB.meth)}</select></label>`+
    `<label>สีสาย<select data-dbg="mode">${dbOpt([['std','แสดงสีตามมาตรฐาน'],['practice','ฝึกเลือกสีเอง (ตรวจให้)']],DB.mode)}</select></label>`+
    `</div><div class="dbrow"><button type="button" class="btn" data-dbact="example">โหลดตัวอย่าง 1 เฟส 6 ช่อง</button><button type="button" class="btn" data-dbact="clear">ล้างทุกช่อง</button></div></div>`;
  h+=dbBoardHTML();
  /* สรุปทั้งตู้ */
  h+=`<div class="card"><h3>สรุปทั้งตู้</h3><div class="dbsum">`+
    (sys?['L1','L2','L3'].map((p,k)=>`<div class="metric"><div class="k">กระแส ${p} ${dbSw(DB_STD[p])}</div><div class="v">${dbF(sm.ph[k])} A</div><div class="s">เมนเบรกเกอร์ ${DB.main} A</div></div>`).join('')+
      `<div class="metric"><div class="k">ความไม่สมดุลเฟส</div><div class="v">${dbF(sm.imb,0)} %</div><div class="s">${sm.imb>20?'ควรย้ายโหลดสลับเฟส':'อยู่ในเกณฑ์ที่ใช้งานได้'}</div></div>`
     :`<div class="metric"><div class="k">กระแส L ${dbSw('brown')}</div><div class="v">${dbF(sm.ph[0])} A</div><div class="s">เมนเบรกเกอร์ ${DB.main} A</div></div>`)+`</div>`+
    `<ul class="checks">`+
    `<li><span class="b ${mainErr?'err':'ok'}">${mainErr?'×':'✓'}</span><span>${mainErr?`กระแสรวมสูงสุด ${dbF(sm.mx)} A เกินเมนเบรกเกอร์ ${DB.main} A`:`กระแสรวมสูงสุด ${dbF(sm.mx)} A ไม่เกินเมนเบรกเกอร์ ${DB.main} A (ยังไม่ได้ใส่ดีมานด์แฟกเตอร์ ถ้าใช้พร้อมกันทั้งหมดคือกรณีเลวร้ายสุด)`}</span></li>`+
    `<li><span class="b ${mainWire?'err':'ok'}">${mainWire?'×':'✓'}</span><span>${mainWire?`สายเมน ${DB.mw} mm² ทนกระแสได้ ${dbF(sm.mAmp)} A น้อยกว่าเมนเบรกเกอร์ ${DB.main} A ใช้อย่างน้อย ${sm.mMin||'> 70'} mm²`:`สายเมน ${DB.mw} mm² ทนกระแสได้ ${dbF(sm.mAmp)} A ≥ เมนเบรกเกอร์ ${DB.main} A`}</span></li>`+
    `</ul></div>`;
  /* กราฟแท่งกำลัง (W) ที่ใช้ในแต่ละเฟส */
  {const names=sys?['L1','L2','L3']:['L'],top=Math.max(1000,...sm.pw),tot=sm.pw.reduce((a,b)=>a+b,0);
   h+=`<div class="card"><h3>กำลังไฟฟ้าที่ใช้ในแต่ละเฟส (W)</h3><div class="dbchart" role="img" aria-label="กราฟแท่งกำลังไฟฟ้า W ของแต่ละเฟส">`+
    names.map((p,k)=>{const pk=p==='L'?'brown':DB_STD[p],pc=tot>0?sm.pw[k]/tot*100:0;
      return`<div class="dbcb"><div class="dbcv">${dbF(sm.pw[k],0)} W</div><div class="dbct"><div class="dbcf" style="height:${Math.max(sm.pw[k]/top*100,sm.pw[k]>0?2:0)}%;background:${DB_COL[pk][1]}"></div></div><div class="dbcl">${dbSw(pk)}<b>${p}</b></div><div class="dbcp">${sys?dbF(pc,0)+' % ของทั้งตู้':'ทั้งตู้'}</div></div>`}).join('')+
    `</div><p class="dbhint">กำลังรวมของอุปกรณ์ที่ใส่ในช่องของเฟสนั้น (เบรกเกอร์ 3P แบ่งเท่ากันทั้ง 3 เฟส) รวมทั้งตู้ ${dbF(tot,0)} W</p></div>`}
  /* ช่อง: จัดเป็นคอลัมน์ละ 3 ช่อง (แถวบน→ล่าง = L1 L2 L3 ในตู้ 3 เฟส) */
  h+=`<div class="dbgrid">`;
  for(let c=0;c<DB.n/3;c++){
    const i0=c*3,span=DB.slots[i0].brk==='mcb3'&&DB.sys==='3';
    h+=`<div class="dbcol">`+(span?dbSlotHTML(i0,true):[0,1,2].map(r=>dbSlotHTML(i0+r,false)).join(''))+`</div>`;
  }
  h+=`</div>`;
  const keep=window.scrollY;host.innerHTML=h;window.scrollTo(0,keep);
}
function dbEvents(){
  const host=document.getElementById('dbhost');if(!host||host._dbev)return;host._dbev=1;
  const done=()=>{dbRender();if(typeof touch==='function')touch()};
  host.addEventListener('change',e=>{
    const t=e.target;let a;
    if((a=t.dataset.dbg)){
      const v=t.value;
      if(a==='sys')dbSetSys(v);
      else if(a==='n'){DB.n=+v;for(let i=0;i<12;i++)if(i>=DB.n){DB.slots[i]=DB_SLOT()}}
      else if(a==='main')DB.main=+v;else if(a==='mw')DB.mw=+v;else if(a==='meth')DB.meth=v;else if(a==='mode')DB.mode=v==='practice'?'practice':'std';
      dbMsg='';return done();
    }
    if((a=t.dataset.dbs)){const[i,f]=a.split(':');const s=DB.slots[+i];
      if(f==='brk'){dbSetBrk(+i,t.value);if(!s.brk)s.devs=[]}else s[f]=+t.value;return done()}
    if((a=t.dataset.dbc)){const[i,k]=a.split(':');DB.slots[+i].cw[k]=t.value;return done()}
    if((a=t.dataset.dbadd)){if(t.value)dbAddDev(+a,t.value);return done()}
    if((a=t.dataset.dbcw)){const[i,j]=a.split(':');const x=DB.slots[+i].devs[+j];if(x)x.w=Math.max(1,Math.min(100000,+t.value||1));return done()}
  });
  host.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;let a;
    if((a=b.dataset.dbq)){const[i,j,d]=a.split(':').map(Number);const x=DB.slots[i].devs[j];if(x){x.q+=d;if(x.q<1)DB.slots[i].devs.splice(j,1);else x.q=Math.min(99,x.q)}return done()}
    if((a=b.dataset.dbrm)){const[i,j]=a.split(':').map(Number);DB.slots[i].devs.splice(j,1);return done()}
    if((a=b.dataset.dbact)){if(a==='example')dbExample();else if(a==='clear'){const k={sys:DB.sys,n:DB.n,main:DB.main,mw:DB.mw,meth:DB.meth,mode:DB.mode};DB=Object.assign(DB_DEF(),k)}dbMsg='';return done()}
  });
}
function dbRenderTab(){dbEvents();dbRender()}
/* ---------- บันทึก / กู้คืน ---------- */
function dbSnapshot(){return JSON.parse(JSON.stringify(DB))}
function dbRestore(o){
  if(!o||typeof o!=='object')return;
  const D=DB_DEF();
  if(o.sys==='1'||o.sys==='3')D.sys=o.sys;
  if(DB_SLOTS.includes(o.n))D.n=o.n;
  if(DB_MAIN.includes(o.main))D.main=o.main;
  if(DB_WIRE.includes(o.mw))D.mw=o.mw;
  if(DB_METH.some(m=>m[0]===o.meth))D.meth=o.meth;
  if(o.mode==='practice')D.mode='practice';
  if(Array.isArray(o.slots))o.slots.slice(0,12).forEach((s,i)=>{
    if(!s||typeof s!=='object')return;const t=D.slots[i];
    if(['','mcb1','rcbo','mcb3'].includes(s.brk))t.brk=s.brk;
    if(DB_BRK.includes(s.a))t.a=s.a;if(DB_WIRE.includes(s.w))t.w=s.w;
    if(Array.isArray(s.devs))t.devs=s.devs.filter(x=>x&&DB_DEVBY[x.id]&&Number.isFinite(x.q)).slice(0,20).map(x=>{const r={id:x.id,q:Math.max(1,Math.min(99,x.q|0))};if(Number.isFinite(x.w))r.w=Math.max(1,Math.min(100000,x.w));return r});
    if(s.cw&&typeof s.cw==='object')Object.keys(s.cw).forEach(k=>{if(DB_STD[k]&&DB_COL[s.cw[k]])t.cw[k]=s.cw[k]});
  });
  /* MCB 3P ใช้ได้เฉพาะตู้ 3 เฟสที่แถวบนสุดและสองช่องใต้ว่าง */
  D.slots.forEach((s,i)=>{if(s.brk==='mcb3'&&(D.sys!=='3'||i%3!==0||D.slots[i+1].brk||D.slots[i+2].brk)){s.brk='mcb1';s.devs=s.devs.filter(x=>DB_DEVBY[x.id].ph===1)}});
  DB=D;
}
function dbSummaryOut(){const s=dbSummary();return{sys:DB.sys,n:DB.n,breakers:s.nb,err:s.err,warn:s.warn}}
