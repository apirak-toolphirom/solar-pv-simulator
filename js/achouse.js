/* ---- เมนู 04 ส่วนต่อสายไฟบ้าน: ไฟการไฟฟ้า → มิเตอร์ → เมนเบรกเกอร์ + SPD → ตู้ชั้น 1 (ตู้เมน) / ตู้ชั้น 2 → เต้ารับ + หลักดิน
   แนวเดียวกับภาพผังไฟบ้านตู้ 2 ชั้น: สายน้ำตาล L · ฟ้า N · เขียว G · ต่อฝาก N–G ที่ตู้เมนจุดเดียว ตู้ย่อยแยก N กับ G
   เพื่อการเรียนรู้ ขนาดเบรกเกอร์ สาย และหลักดินจริงให้ช่างไฟฟ้าผู้ได้รับอนุญาตออกแบบตามมาตรฐาน วสท. และการไฟฟ้า ---- */
const AH={wires:[],sw:{MB:1,D1:1,D2:1},trip:{},load:false,armed:null,fault:null};
/* id, label, kind (L N PE), x, y, side (t b l r), component */
const AH_T=[
  ['MTR.OL','L ออก','L',860,236,'b','MTR'],['MTR.ON','N ออก','N',930,236,'b','MTR'],
  ['MB.IL','L เข้า','L',560,44,'t','MB'],['MB.IN','N เข้า','N',620,44,'t','MB'],['MB.OL','L ออก','L',560,236,'b','MB'],['MB.ON','N ออก','N',620,236,'b','MB'],
  ['SPD.L','L','L',360,64,'t','SPD'],['SPD.N','N','N',410,64,'t','SPD'],['SPD.PE','PE','PE',385,216,'b','SPD']
];
const AH_DB=(p,y0)=>[
  [p+'.IL','L เข้า','L',345,y0+86,'t',p],[p+'.IN','N เข้า','N',385,y0+86,'t',p],
  [p+'.C1','วงจร 1','L',455,y0+186,'b',p],[p+'.C2','วงจร 2','L',495,y0+186,'b',p],[p+'.C3','วงจร 3','L',535,y0+186,'b',p],
  [p+'.N1','N','N',480,y0+30,'t',p],[p+'.N2','N','N',510,y0+30,'t',p],[p+'.N3','N','N',540,y0+30,'t',p],
  [p+'.G1','G','PE',600,y0+30,'t',p],[p+'.G2','G','PE',630,y0+30,'t',p],[p+'.G3','G','PE',660,y0+30,'t',p],[p+'.G4','G','PE',690,y0+30,'t',p]
];
const AH_OUT=(p,y0)=>[[p+'.L','L','L',800,y0+30,'l',p],[p+'.N','N','N',800,y0+60,'l',p],[p+'.G','G','PE',800,y0+90,'l',p]];
AH_T.push(...AH_DB('D1',320),...AH_DB('D2',630),...AH_OUT('O1',360),...AH_OUT('O2',670),['ROD.T','หัวหลักดิน','PE',165,650,'t','ROD']);
const AH_TM={};AH_T.forEach(t=>AH_TM[t[0]]={id:t[0],lab:t[1],kind:t[2],x:t[3],y:t[4],side:t[5],comp:t[6]});
const AH_NM={MTR:'มิเตอร์',MB:'เมนเบรกเกอร์',SPD:'SPD',D1:'ตู้ชั้น 1',D2:'ตู้ชั้น 2',O1:'เต้ารับชั้น 1',O2:'เต้ารับชั้น 2',ROD:'หลักดิน'};
const AH_COL={L:'#8b5a2b',N:'#2a78d6',PE:'#1baf7a'};
const ahName=id=>{const T=AH_TM[id],k=id.split('.')[0],bar={N:'บาร์ N',G:'บาร์ G'}[id.split('.')[1][0]];return`${AH_NM[k]} ${/^D\d\.[NG]\d$/.test(id)?bar:T.lab}`};
const ahKey=(a,b)=>[a,b].sort().join('|');
const ahHas=(a,b)=>AH.wires.some(w=>ahKey(w.a,w.b)===ahKey(a,b));
function ahKindOf(a,b){
  const A=AH_TM[a].kind,B=AH_TM[b].kind;if(A===B)return['ok',`${ahName(a)} → ${ahName(b)} ถูกชนิด (${A==='PE'?'G':A})`];
  if((A==='N'&&B==='PE')||(A==='PE'&&B==='N'))return['warn','ต่อฝาก N กับ G (ทำได้ที่ตู้เมนจุดเดียว)'];
  if((A==='L'&&B==='N')||(A==='N'&&B==='L'))return['err','L ต่อกับ N = ลัดวงจร!'];
  return['err','L ต่อกับ G = ไฟรั่วลงดิน!'];
}
/* nets: wires + what is built into the equipment (bars, breakers that are ON) */
function ahNets(){
  const par={},fd=k=>{while(par[k]!==k){par[k]=par[par[k]];k=par[k]}return k},un=(a,b)=>{const x=fd(a),y=fd(b);if(x!==y)par[x]=y};
  Object.keys(AH_TM).concat(['UT.L','UT.N','D1.BUS','D2.BUS']).forEach(k=>par[k]=k);
  un('UT.L','MTR.OL');un('UT.N','MTR.ON');
  if(AH.sw.MB&&!AH.trip.MB){un('MB.IL','MB.OL');un('MB.IN','MB.ON')}
  ['D1','D2'].forEach(p=>{
    un(p+'.N1',p+'.N2');un(p+'.N2',p+'.N3');un(p+'.G1',p+'.G2');un(p+'.G2',p+'.G3');un(p+'.G3',p+'.G4');
    if(AH.sw[p]&&!AH.trip[p]){un(p+'.IL',p+'.BUS');un(p+'.IN',p+'.N1');['C1','C2','C3'].forEach(c=>un(p+'.BUS',p+'.'+c))}
  });
  AH.wires.forEach(w=>un(w.a,w.b));
  return fd;
}
/* the same nets with every breaker closed: used for "is it wired right" so a tripped breaker is not reported as a wiring error */
function ahNetsWired(){const keep=AH.sw,kt=AH.trip;AH.sw={MB:1,D1:1,D2:1};AH.trip={};const f=ahNets();AH.sw=keep;AH.trip=kt;return f}
function ahAnalyze(){
  const W=ahNetsWired(),E=ahNets(),ck=[],add=(l,t)=>ck.push([l,t]);
  const same=(f,a,b)=>f(a)===f(b),L=W('UT.L'),N=W('UT.N'),G=W('ROD.T');
  if(!AH.wires.length)return{ck:[],lvl:'idle',pw:{},gnd:{}};
  if(L===N)add('err','ลัดวงจร: สาย L กับ N ต่อถึงกัน เบรกเกอร์จะตัดทันที ตรวจสายที่มีเส้นประสีแดง');
  if(L===G)add('err','ไฟรั่ว: สาย L ต่อถึงสายดิน ตรวจสายที่มีเส้นประสีแดง');
  /* meter → main breaker */
  if(same(W,'MB.IL','UT.L')&&same(W,'MB.IN','UT.N'))add('ok','มิเตอร์ → เมนเบรกเกอร์: L เข้า L, N เข้า N');
  else if(same(W,'MB.IL','UT.N')&&same(W,'MB.IN','UT.L'))add('err','มิเตอร์ → เมนเบรกเกอร์: สลับ L กับ N สาย L ต้องเข้าขั้ว L ของเมน');
  else add('warn','ยังไม่ได้ต่อสาย L และ N จากด้านออกของมิเตอร์เข้าด้านบน (ขาเข้า) ของเมนเบรกเกอร์');
  /* SPD */
  const spdL=same(W,'SPD.L','MB.OL')||same(W,'SPD.L','D1.IL'),spdN=same(W,'SPD.N','MB.ON')||same(W,'SPD.N','D1.IN');
  if(spdL&&spdN&&same(W,'SPD.PE','ROD.T'))add('ok','SPD: ขั้ว L และ N ต่อหลังเมนเบรกเกอร์ ขั้ว PE ลงบาร์กราวด์ไปหลักดิน');
  else if(!AH.wires.some(w=>w.a.startsWith('SPD')||w.b.startsWith('SPD')))add('warn','ยังไม่ได้ต่อ SPD (อุปกรณ์ป้องกันไฟกระโชก) ต่อ L, N หลังเมนเบรกเกอร์ และ PE ลงกราวด์');
  else add('err','SPD ต่อไม่ครบ: L และ N ต้องต่อหลังเมนเบรกเกอร์ และ PE ต้องต่อถึงหลักดิน ไม่อย่างนั้นป้องกันไฟกระโชกไม่ได้');
  /* boards */
  [['D1','ตู้ชั้น 1 (ตู้เมน)'],['D2','ตู้ชั้น 2']].forEach(([p,nm])=>{
    const fedL=same(W,p+'.IL','MB.OL')||(p==='D2'&&['C1','C2','C3'].some(c=>same(W,'D2.IL','D1.'+c))),fedN=same(W,p+'.IN','UT.N');
    if(same(W,p+'.IL','UT.L')&&!fedL)add('warn',`${nm}: รับไฟ L ก่อนเมนเบรกเกอร์ ต่อจากด้านออกของเมนเบรกเกอร์แทน`);
    if(fedL&&fedN)add('ok',`${nm}: รับไฟ L และ N จากเมนเบรกเกอร์เข้า RCBO หลักของตู้`);
    else if(same(W,p+'.IL','UT.N')||same(W,p+'.IN','UT.L'))add('err',`${nm}: สลับ L กับ N ที่ขาเข้า RCBO`);
    else add('warn',`${nm}: ยังไม่ได้ต่อไฟเข้า (L และ N จากเมนเบรกเกอร์เข้าขั้วบนของ RCBO)`);
    if(same(W,p+'.G1','ROD.T'))add('ok',`${nm}: บาร์ G ต่อถึงหลักดิน${p==='D1'?' (สายต่อหลักดินตามตาราง 4-1 · ความต้านทานดินไม่เกิน 5 Ω วสท. ข้อ 4.27)':''}`);else add('err',`${nm}: บาร์ G ยังไม่ต่อถึงหลักดิน เครื่องใช้ไฟฟ้าจะไม่มีทางให้ไฟรั่วลงดิน`);
  });
  /* neutral–earth bond: only at the main board */
  const bonds=AH.wires.filter(w=>{const a=AH_TM[w.a].kind,b=AH_TM[w.b].kind;return(a==='N'&&b==='PE')||(a==='PE'&&b==='N')});
  const bAt=bonds.map(w=>[w.a,w.b].map(x=>x.split('.')[0]).find(c=>c!=='ROD')||'ROD');
  if(bAt.includes('D1')&&!bAt.some(c=>c!=='D1'))add('ok','ต่อฝาก N กับ G ที่ตู้ชั้น 1 (ตู้เมน) จุดเดียว');
  if(!bonds.length)add('warn','ยังไม่ได้ต่อฝาก N กับ G ที่ตู้เมน (ต่อสายจากบาร์ N ไปบาร์ G ในตู้ชั้น 1 หนึ่งเส้น) ไม่อย่างนั้นไฟรั่วจะไหลกลับหม้อแปลงได้ยาก (วสท. 022001-22 ข้อ 4.3.1)');
  bAt.filter(c=>c!=='D1').forEach(c=>add('err',`ห้ามต่อฝาก N กับ G ที่${AH_NM[c]||c} ต่อฝากได้ที่ตู้เมนจุดเดียว ตู้ย่อยต้องแยกบาร์ N กับบาร์ G (ข้อ 4.3.1, 4.4.2.1)`));
  /* outlets */
  const pw={},gnd={};
  [['O1','D1','ชั้น 1'],['O2','D2','ชั้น 2']].forEach(([o,p,nm])=>{
    const cL=['C1','C2','C3'].find(c=>same(W,o+'.L',p+'.'+c)),otherL=['C1','C2','C3'].find(c=>same(W,o+'.L',(p==='D1'?'D2':'D1')+'.'+c));
    if(cL)add('ok',`เต้ารับ${nm}: L จาก${AH_NM[p]} ${cL.replace('C','วงจร ')}`);
    else if(otherL)add('warn',`เต้ารับ${nm}: L มาจากตู้อีกชั้น ควรใช้วงจรในตู้ของชั้นนั้น`);
    else if(same(W,o+'.L','UT.L'))add('err',`เต้ารับ${nm}: L ต่อตรงไม่ผ่านเบรกเกอร์ย่อย ไม่มีอุปกรณ์ป้องกันวงจร`);
    else add('warn',`เต้ารับ${nm}: ยังไม่ได้ต่อ L จากเบรกเกอร์ย่อย`);
    if(same(W,o+'.N',p+'.N1'))add('ok',`เต้ารับ${nm}: N จากบาร์ N ของ${AH_NM[p]}`);
    else if(same(W,o+'.N','UT.N'))add('warn',`เต้ารับ${nm}: N ไม่ได้มาจากบาร์ N ของตู้เดียวกับ L RCBO จะตัดเพราะกระแสไม่สมดุล`);
    else add('warn',`เต้ารับ${nm}: ยังไม่ได้ต่อ N`);
    gnd[o]=same(W,o+'.G','ROD.T');
    if(same(W,o+'.G',p+'.G1')&&gnd[o])add('ok',`เต้ารับ${nm}: G จากบาร์ G ถึงหลักดิน`);else add('err',`เต้ารับ${nm}: ไม่มีสายดิน (G) ถ้าเครื่องใช้ไฟฟ้ารั่ว คนแตะจะถูกไฟดูด`);
    pw[o]=E(o+'.L')===E('UT.L')&&E(o+'.N')===E('UT.N')&&E('UT.L')!==E('UT.N');
  });
  const n={err:0,warn:0};ck.forEach(c=>{if(n[c[0]]!=null)n[c[0]]++});
  return{ck,lvl:n.err?'err':n.warn?'warn':'ok',n,pw,gnd};
}
function ahPreset(k){
  AH.wires=[];AH.trip={};AH.sw={MB:1,D1:1,D2:1};AH.fault=null;
  if(k==='good'||k==='bad'){
    const W=(a,b)=>AH.wires.push({a,b});
    W('MTR.OL','MB.IL');W('MTR.ON','MB.IN');W('MB.OL','SPD.L');W('MB.ON','SPD.N');W('SPD.PE','D1.G1');
    W('MB.OL','D1.IL');W('MB.ON','D1.IN');W('D1.G2','ROD.T');W('D1.N3','D1.G4');
    W('MB.OL','D2.IL');W('MB.ON','D2.IN');W('D1.G3','D2.G4');
    W('D1.C1','O1.L');W('D1.N2','O1.N');W('D1.G4','O1.G');W('D2.C1','O2.L');W('D2.N2','O2.N');W('D2.G2','O2.G');
    /* three independent mistakes: no earth wire to the floor-2 outlet, an N–G bond in the sub-board, SPD earth left open */
    if(k==='bad'){AH.wires=AH.wires.filter(w=>!(w.a==='D2.G2'&&w.b==='O2.G')&&!(w.a==='SPD.PE'&&w.b==='D1.G1'));W('D2.N3','D2.G3')}
  }
  ahLog(k==='good'?'โหลดเฉลย: ต่อตามผังไฟบ้านตู้ 2 ชั้น':k==='bad'?'โหลดตัวอย่างต่อผิด 3 จุด ลองหาให้เจอ':'ล้างสายทั้งหมด','idle');
  ahRender();
}
const ahLog=(m,l)=>{if(typeof logTo==='function')logTo('ahlog',m,l)};
/* leakage test: a fault from L to the appliance's metal case at one outlet */
function ahFault(o){
  const A=ahAnalyze(),nm=o==='O1'?'ชั้น 1':'ชั้น 2',p=o==='O1'?'D1':'D2';
  if(!A.pw[o]){ahLog(`ทดสอบไฟรั่ว${nm}: เต้ารับไม่มีไฟ (ต่อสายให้ครบหรือเปิดเบรกเกอร์ก่อน)`,'warn');return}
  if(A.gnd[o]){AH.trip[p]=1;AH.fault={o,ok:true,t:Date.now()};ahLog(`ทดสอบไฟรั่ว${nm}: ไฟรั่วไหลลงสายดินไปหลักดิน RCBO ของ${AH_NM[p]}ตัดวงจรทันที ปลอดภัย กด "รีเซ็ตเบรกเกอร์" เพื่อจ่ายไฟใหม่`,'ok')}
  else{AH.fault={o,ok:false,t:Date.now()};ahLog(`ทดสอบไฟรั่ว${nm}: ไม่มีสายดิน ไฟค้างที่ตัวเครื่อง 230 V จนกว่าจะมีคนแตะแล้วกระแสไหลผ่านตัวคน อันตราย! ต่อสาย G ให้ถึงหลักดิน`,'err')}
  ahRender();setTimeout(()=>{if(AH.fault&&Date.now()-AH.fault.t>=2900){AH.fault=null;ahRender()}},3000);
}

/* ---- drawing ---- */
function ahPath(a,b){
  const d=s=>s==='t'?[0,-1]:s==='b'?[0,1]:s==='l'?[-1,0]:[1,0],da=d(a.side),db=d(b.side),k=Math.max(30,Math.hypot(b.x-a.x,b.y-a.y)*.35);
  return`M${a.x} ${a.y}C${a.x+da[0]*k} ${a.y+da[1]*k} ${b.x+db[0]*k} ${b.y+db[1]*k} ${b.x} ${b.y}`;
}
function ahArt(A){
  const T=(x,y,t,cls,anc,st)=>`<text x="${x}" y="${y}" class="${cls||'acnote'}" text-anchor="${anc||'middle'}"${st?` style="${st}"`:''}>${t}</text>`;
  const on=k=>AH.sw[k]&&!AH.trip[k];
  const brk=(x,y,w,h,k,lab)=>`<g class="ahsw" data-hsw="${k}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" class="a-fill" style="stroke-width:1.5"/><rect x="${x+w/2-7}" y="${y+h/2-14}" width="14" height="28" rx="3" class="a-dark"/><rect x="${x+w/2-5}" y="${on(k)?y+h/2-12:y+h/2+1}" width="10" height="11" rx="2" style="fill:${on(k)?'var(--ok)':AH.trip[k]?'var(--err)':'#9aa4ad'}"/>${T(x+w/2,y+h+12,esc(lab)+(AH.trip[k]?' · ตัด':on(k)?' · ON':' · OFF'),'acnote','middle','font-size:10px')}<title>แตะเพื่อเปิด/ปิด</title></g>`;
  let s='';
  /* utility pole and the service drop the utility connects to the meter */
  s+=`<g><path d="M1050 30V230M1030 44H1070M1036 60H1064" class="a-line a-th"/>${T(1050,250,'ไฟการไฟฟ้า','actitle')}${T(1050,266,'230 V 1 เฟส','acnote')}`
    +`<path d="M1036 44C990 40 960 40 880 44" style="stroke:${AH_COL.L};stroke-width:3;fill:none"/><path d="M1064 60C1000 60 970 56 940 44" style="stroke:${AH_COL.N};stroke-width:3;fill:none"/>${T(965,30,'การไฟฟ้าต่อให้','acnote','middle','font-size:9.5px')}</g>`;
  /* kWh meter */
  s+=`<g><rect x="820" y="44" width="150" height="192" rx="12" class="acbox"/><rect x="836" y="60" width="118" height="70" rx="8" style="fill:#e9eef2;stroke:#9aa4ad"/><rect x="848" y="72" width="94" height="22" rx="3" class="a-dark"/>${T(895,88,'0 0 0 1 6','a-lcdt','middle','fill:#fff;font-size:13px')}${T(895,118,'kWh 5(15) A','acnote')}${T(895,160,'มิเตอร์ (kWh)','actitle')}${T(895,178,'การไฟฟ้า','acnote')}</g>`;
  /* main breaker (MCCB) */
  s+=`<g><rect x="530" y="44" width="120" height="192" rx="8" class="acbox"/><rect x="530" y="44" width="120" height="26" rx="8" style="fill:#e0762c;opacity:.85"/>${T(590,62,'เมนเบรกเกอร์','a-brand','middle','fill:#fff')}${brk(568,96,44,80,'MB','MCCB 2P')}</g>`;
  /* SPD */
  s+=`<g><rect x="330" y="64" width="110" height="152" rx="8" class="acbox"/><rect x="344" y="82" width="34" height="90" rx="4" class="a-dark"/><rect x="392" y="82" width="34" height="90" rx="4" class="a-dark"/><rect x="350" y="92" width="22" height="16" rx="2" style="fill:#2e9e4f"/><rect x="398" y="92" width="22" height="16" rx="2" style="fill:#2e9e4f"/>${T(385,192,'SPD','actitle')}${T(385,206,'กันไฟกระโชก','acnote','middle','font-size:9.5px')}</g>`;
  /* boards */
  [['D1',320,'ตู้ชั้น 1 (ตู้เมน)'],['D2',630,'ตู้ชั้น 2 (ตู้ย่อย)']].forEach(([p,y0,nm])=>{
    s+=`<g><rect x="300" y="${y0}" width="420" height="250" rx="12" class="acbox"/>${T(320,y0+240,esc(nm),'actitle','start')}`
      +`<rect x="466" y="${y0+22}" width="88" height="16" rx="3" style="fill:#d4b04c;stroke:#9a7a20"/>${T(510,y0+52,'บาร์ N','acnote','middle','fill:'+AH_COL.N)}`
      +`<rect x="586" y="${y0+22}" width="118" height="16" rx="3" style="fill:#d4b04c;stroke:#9a7a20"/>${T(645,y0+52,'บาร์ G (กราวด์)','acnote','middle','fill:'+AH_COL.PE)}`
      +`<rect x="320" y="${y0+96}" width="380" height="82" rx="6" style="fill:#e9eef2;stroke:#c3ced8"/>`
      +brk(330,y0+100,70,66,p,'RCBO 2P 30 mA');
    ['C1','C2','C3'].forEach((c,i)=>{s+=`<rect x="${440+i*40}" y="${y0+104}" width="30" height="62" rx="3" class="a-fill"/><rect x="${448+i*40}" y="${y0+118}" width="14" height="22" rx="2" style="fill:${on(p)?'var(--ok)':'#9aa4ad'}"/>${T(455+i*40,y0+160,'MCB','acnote','middle','font-size:8.5px')}`});
    s+=T(560,y0+214,'บัสในตู้: RCBO → MCB ทุกตัว · ขาออก N ของ RCBO → บาร์ N','acnote','middle','font-size:9.5px');
    s+='</g>';
  });
  /* outlets */
  [['O1',360,'เต้ารับชั้น 1'],['O2',670,'เต้ารับชั้น 2']].forEach(([o,y0,nm])=>{
    const p=A.pw[o],f=AH.fault&&AH.fault.o===o;
    s+=`<g><rect x="800" y="${y0}" width="180" height="120" rx="10" class="acbox"/>`;
    [850,920].forEach(x=>{s+=`<rect x="${x-24}" y="${y0+30}" width="48" height="48" rx="6" style="fill:#f5f7f9;stroke:#9aa4ad"/><rect x="${x-12}" y="${y0+44}" width="5" height="12" rx="1.5" class="a-dark"/><rect x="${x+7}" y="${y0+44}" width="5" height="12" rx="1.5" class="a-dark"/><circle cx="${x}" cy="${y0+66}" r="4" class="a-dark"/>`});
    s+=`<circle cx="960" cy="${y0+16}" r="7" style="fill:${p?'#ffd84a':'#9aa4ad'};stroke:#7a6a20"/>${T(890,y0+102,esc(nm)+(p?' · มีไฟ 230 V':' · ไม่มีไฟ'),'acnote','middle',p?'fill:var(--ok);font-weight:600':'')}`;
    if(f)s+=`<g>${T(890,y0-8,AH.fault.ok?'ไฟรั่ว → สายดิน → RCBO ตัด ✓':'ไฟรั่ว ไม่มีสายดิน อันตราย!','acnote','middle',`font-weight:700;fill:${AH.fault.ok?'var(--ok)':'var(--err)'}`)}</g>`;
    s+='</g>';
  });
  /* ground rod in the soil, dimensions as in the reference picture */
  s+=`<g transform="translate(40 0)"><rect x="40" y="640" width="170" height="270" rx="4" style="fill:#7a5a3a;opacity:.85"/><rect x="40" y="628" width="170" height="14" rx="3" style="fill:#5fa04a"/>`
    +`<rect x="80" y="650" width="90" height="34" rx="3" style="fill:#c9cfd4;stroke:#8a939b"/>${T(125,672,'บ่อตรวจ','acnote','middle','fill:#333;font-size:9.5px')}`
    +`<rect x="118" y="672" width="14" height="222" rx="3" style="fill:#e8862f;stroke:#a85a14"/><path d="M118 894L125 910L132 894Z" style="fill:#e8862f"/>`
    +`<path d="M24 642V684M20 642H28M20 684H28" class="a-line"/>${T(22,666,'≥0.3 ม.','acnote','end','font-size:9.5px;fill:#fff')}`
    +`<path d="M24 690V906M20 690H28M20 906H28" class="a-line"/>${T(22,800,'≥2.4 ม.','acnote','end','font-size:9.5px')}`
    +T(150,860,'Ø 5/8 นิ้ว','acnote','start','fill:#fff;font-size:9.5px')+T(150,876,'≤5 Ω','acnote','start','fill:#fff;font-size:9.5px')+T(125,622,'หลักดิน (แท่งทองแดงหุ้มเหล็ก)','actitle')+'</g>';
  return s;
}
function ahRender(){
  const svg=document.getElementById('ahsvg');if(!svg)return;
  const A=ahAnalyze();let s=ahArt(A);
  const live=AH.load&&(A.pw.O1||A.pw.O2),E=ahNets(),L=E('UT.L'),N=E('UT.N'),G=E('ROD.T');
  AH.wires.forEach((w,i)=>{
    const a=AH_TM[w.a],b=AH_TM[w.b];if(!a||!b)return;
    const k=ahKindOf(w.a,w.b),col=k[0]==='err'?'var(--err)':AH_COL[a.kind==='PE'&&b.kind==='N'?'N':a.kind],d=ahPath(a,b);
    s+=`<path d="${d}" class="acw-hit" data-hw="${i}"/><path d="${d}" class="acw${k[0]==='err'?' bad':''}" style="stroke:${col}"/>`;
    if(k[0]==='warn')s+=`<path d="${d}" class="acw" style="stroke:${AH_COL.PE};stroke-dasharray:6 6"/>`;
    const fl=E(w.a);
    const pe=a.kind==='PE'||b.kind==='PE'; /* earth wires carry no load current; they light up only during the leakage test */
    if((live&&!pe&&(fl===L||fl===N))||(AH.fault&&AH.fault.ok&&pe&&fl===G))s+=`<path d="${d}" class="wflow" style="stroke:${AH.fault&&fl===G?'#7dff9a':'#ffd84a'}"/>`;
  });
  AH_T.forEach(t=>{const T=AH_TM[t[0]],arm=AH.armed===T.id,on=AH.wires.some(w=>w.a===T.id||w.b===T.id);
    const lx=T.side==='l'?T.x-9:T.side==='r'?T.x+9:T.x,ly=T.side==='t'?T.y-9:T.side==='b'?T.y+16:T.y+4,an=T.side==='l'?'end':T.side==='r'?'start':'middle';
    const show=!/^D\d\.[NG]\d$/.test(T.id);
    s+=`<g class="act" data-h="${T.id}"><circle cx="${T.x}" cy="${T.y}" r="15" class="achit"/><circle cx="${T.x}" cy="${T.y}" r="6.5" class="acterm${on?' on':''}${arm?' arm':''}" style="stroke:${AH_COL[T.kind]}"/>${show?`<text x="${lx}" y="${ly}" class="aclab" text-anchor="${an}">${esc(T.lab)}</text>`:''}</g>`});
  svg.innerHTML=s;
  if(AH.armed&&typeof pickMark==='function'){pickMark(svg,'h',AH.armed,(a,b)=>a!==b&&!ahHas(a,b)&&ahKindOf(a,b)[0]!=='err');const T=AH_TM[AH.armed];hintAt(svg,T.x,T.y,`เลือก ${ahName(AH.armed)} แล้ว แตะขั้วที่สอง`,'idle')}
  const v=document.getElementById('ahverdict');
  if(v){const msg=A.lvl==='idle'?'ยังไม่ได้ต่อสาย':A.lvl==='ok'?'ต่อถูกทั้งหมด':A.lvl==='warn'?`ใช้ได้บางส่วน มี ${A.n.warn} ข้อควรทำต่อ`:`พบ ${A.n.err} ข้อที่ไม่ปลอดภัย`;
    v.className='verdict '+(A.lvl==='idle'?'':A.lvl);v.innerHTML=`<span class="pill ${A.lvl}">${A.lvl==='idle'?'ยังไม่เริ่ม':LABEL[A.lvl]}</span><b>${esc(msg)}</b><span class="nums">เต้ารับมีไฟ ${(A.pw.O1?1:0)+(A.pw.O2?1:0)}/2 · มีสายดิน ${(A.gnd.O1?1:0)+(A.gnd.O2?1:0)}/2</span>`}
  const c=document.getElementById('ahchecks');if(c)c.innerHTML=A.ck.sort((a,b)=>RANK[a[0]]-RANK[b[0]]).map(x=>`<li><span class="b ${x[0]}">${GLYPH[x[0]]}</span><span>${esc(x[1])}</span></li>`).join('');
  const lb=document.getElementById('ahload');if(lb){lb.classList.toggle('on',AH.load);lb.textContent=AH.load?'■ ปิดโหลด':'▶ เปิดโหลด'}
  window.lastAH=A;try{localStorage.setItem('pvsim:house',JSON.stringify({wires:AH.wires}))}catch(e){}
}
function initAH(){
  const svg=document.getElementById('ahsvg');if(!svg)return;
  try{const o=JSON.parse(localStorage.getItem('pvsim:house')||'null');if(o&&Array.isArray(o.wires))AH.wires=o.wires.filter(w=>AH_TM[w.a]&&AH_TM[w.b])}catch(e){}
  let drag=null,tmp=null;
  const pt=e=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse())};
  const ok=(a,b)=>a!==b&&!ahHas(a,b)&&ahKindOf(a,b)[0]!=='err';
  const add=(a,b)=>{if(a===b||ahHas(a,b))return;const k=ahKindOf(a,b);AH.wires.push({a,b});AH.armed=null;ahLog('ต่อสาย: '+(k[0]==='ok'?k[1]:`${ahName(a)} → ${ahName(b)} · ${k[1]}`),k[0]);ahRender();if(typeof touch==='function')touch()};
  svg.addEventListener('pointerdown',e=>{
    const sw=e.target.closest('[data-hsw]');if(sw){const k=sw.dataset.hsw;if(AH.trip[k]){delete AH.trip[k]}else AH.sw[k]=AH.sw[k]?0:1;ahLog(`${{MB:'เมนเบรกเกอร์',D1:'RCBO ตู้ชั้น 1',D2:'RCBO ตู้ชั้น 2'}[k]} ${AH.sw[k]?'ON':'OFF'}`,'idle');ahRender();return}
    const t=e.target.closest('[data-h]');if(!t)return;e.preventDefault();
    drag={id:t.dataset.h,moved:false};tmp=document.createElementNS('http://www.w3.org/2000/svg','path');tmp.setAttribute('class','acw tmp');tmp.style.pointerEvents='none';svg.appendChild(tmp);
    pickMark(svg,'h',drag.id,ok);try{svg.setPointerCapture(e.pointerId)}catch(_){}
  });
  svg.addEventListener('pointermove',e=>{
    if(!drag)return;const p=pt(e),a=AH_TM[drag.id];if(Math.hypot(p.x-a.x,p.y-a.y)>8)drag.moved=true;if(!drag.moved)return;
    tmp.setAttribute('d',`M${a.x} ${a.y}L${p.x} ${p.y}`);
    const el=document.elementFromPoint(e.clientX,e.clientY),t=el&&el.closest&&el.closest('[data-h]'),b=t&&t.dataset.h;
    if(b&&b!==drag.id){const k=ahHas(drag.id,b)?['warn','ต่อสายเส้นนี้ไว้แล้ว']:ahKindOf(drag.id,b);hintAt(svg,p.x,p.y,k[1],k[0])}else hintAt(svg,p.x,p.y,`จาก ${ahName(drag.id)} ลากไปปล่อยที่ขั้วปลายทาง`,'idle');
  });
  const end=e=>{
    if(!drag)return;const d=drag;drag=null;if(tmp){tmp.remove();tmp=null}
    if(d.moved){const el=document.elementFromPoint(e.clientX,e.clientY),t=el&&el.closest&&el.closest('[data-h]');if(t)add(d.id,t.dataset.h);else ahRender()}
    else if(AH.armed&&AH.armed!==d.id)add(AH.armed,d.id);
    else{AH.armed=AH.armed===d.id?null:d.id;ahRender()}
  };
  svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',()=>{drag=null;if(tmp){tmp.remove();tmp=null};ahRender()});
  svg.addEventListener('click',e=>{const w=e.target.closest('[data-hw]');if(w){const x=AH.wires[+w.dataset.hw];AH.wires.splice(+w.dataset.hw,1);if(x)ahLog(`ลบสาย: ${ahName(x.a)} → ${ahName(x.b)}`,'idle');ahRender()}});
  const q=id=>document.getElementById(id);
  document.querySelectorAll('[data-ahp]').forEach(b=>b.addEventListener('click',()=>ahPreset(b.dataset.ahp)));
  if(q('ahload'))q('ahload').addEventListener('click',()=>{AH.load=!AH.load;const A=ahAnalyze();ahLog(AH.load?(A.pw.O1||A.pw.O2?`เปิดโหลด: ไฟไหลจากการไฟฟ้า → มิเตอร์ → เมน → ตู้ → เต้ารับที่มีไฟ (${['O1','O2'].filter(o=>A.pw[o]).map(o=>AH_NM[o]).join(', ')}) แล้วกลับทางสาย N`:'เปิดโหลด: ยังไม่มีเต้ารับที่มีไฟ'):'ปิดโหลด',AH.load&&!(A.pw.O1||A.pw.O2)?'warn':'idle');ahRender()});
  document.querySelectorAll('[data-ahf]').forEach(b=>b.addEventListener('click',()=>ahFault(b.dataset.ahf)));
  if(q('ahreset'))q('ahreset').addEventListener('click',()=>{AH.trip={};AH.sw={MB:1,D1:1,D2:1};ahLog('รีเซ็ตเบรกเกอร์ทั้งหมด (ON)','idle');ahRender()});
  logShow('ahlog');ahRender();
}
