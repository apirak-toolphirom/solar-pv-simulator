/* ---- Bench UI: schematic with movable modules, clamp meters, voltmeter, controls ---- */
const BM={
  ARR:[30,40,230,190,'แผงโซลาร์'],PVF:[300,50,90,90,'ฟิวส์สตริง'],PVB:[420,50,90,90,'เบรกเกอร์ DC (แผง)'],
  CTRL:[540,40,170,230,'ชาร์จคอนโทรลเลอร์'],BF:[740,60,90,90,'ฟิวส์แบต'],BAT:[880,40,150,190,'แบตเตอรี่'],
  SPD:[300,260,90,130,'SPD DC'],GND:[330,430,70,60,'กราวด์'],DCL:[540,330,170,150,'โหลด DC'],
  BBK:[740,330,90,90,'เบรกเกอร์ DC'],INV:[880,320,170,230,'อินเวอร์เตอร์'],ACB:[1080,340,90,90,'เบรกเกอร์ AC'],ACL:[1200,300,190,190,'โหลด AC']
};
const BPORT={
  'ARR+':['ARR',230,60,'r','+','p'],'ARR-':['ARR',230,130,'r','−','n'],
  'PVF.i':['PVF',0,45,'l','','p'],'PVF.o':['PVF',90,45,'r','','p'],'PVB.i':['PVB',0,45,'l','','p'],'PVB.o':['PVB',90,45,'r','','p'],
  'SPD+':['SPD',0,35,'l','+','p'],'SPD-':['SPD',0,65,'l','−','n'],'SPD.PE':['SPD',45,130,'b','PE','g'],'GND.PE':['GND',35,0,'t','PE','g'],
  'CTRL.pv+':['CTRL',0,50,'l','PV+','p'],'CTRL.pv-':['CTRL',0,90,'l','PV−','n'],'CTRL.b+':['CTRL',170,50,'r','BAT+','p'],'CTRL.b-':['CTRL',170,90,'r','BAT−','n'],
  'BF.i':['BF',90,45,'r','','p'],'BF.o':['BF',0,45,'l','','p'],'BAT+':['BAT',0,50,'l','+','p'],'BAT-':['BAT',0,100,'l','−','n'],
  'BBK.i':['BBK',0,45,'l','','p'],'BBK.o':['BBK',90,45,'r','','p'],
  'INV.d+':['INV',0,50,'l','DC+','p'],'INV.d-':['INV',0,100,'l','DC−','n'],'INV.L':['INV',170,50,'r','L','l'],'INV.N':['INV',170,100,'r','N','nn'],
  'ACB.i':['ACB',0,45,'l','','l'],'ACB.o':['ACB',90,45,'r','','l'],'DCL+':['DCL',0,40,'l','+','p'],'DCL-':['DCL',0,90,'l','−','n'],
  'ACL.L':['ACL',0,40,'l','L','l'],'ACL.N':['ACL',0,90,'l','N','nn']
};
const BWIRE=[
  ['w1','ARR+','PVF.i','p','Ia','สาย + แผง → ฟิวส์สตริง'],['w2','PVF.o','PVB.i','p','Ia','สาย + ฟิวส์ → เบรกเกอร์ DC'],['w3','PVB.o','CTRL.pv+','p','Ia','สาย + เบรกเกอร์ DC → ตัวควบคุม'],
  ['w4','ARR-','CTRL.pv-','n','Ia','สาย − แผง → ตัวควบคุม'],['w5','SPD+','CTRL.pv+','p','z','สาย + ของ SPD'],['w6','SPD-','CTRL.pv-','n','z','สาย − ของ SPD'],['w7','SPD.PE','GND.PE','g','z','สายกราวด์ SPD'],
  ['w8','CTRL.b+','BF.o','p','Ic','สาย + ตัวควบคุม → บัสแบต (กระแสชาร์จ)'],['w9','CTRL.b-','BAT-','n','Ic','สาย − ตัวควบคุม → แบต'],['w10','BF.i','BAT+','p','Ibat','สาย + แบต ↔ ฟิวส์แบต (ชาร์จ +/จ่าย −)'],
  ['w11','BF.o','BBK.i','p','Iinv','สาย + บัส → เบรกเกอร์อินเวอร์เตอร์'],['w12','BBK.o','INV.d+','p','Iinv','สาย + เบรกเกอร์ → อินเวอร์เตอร์'],['w13','INV.d-','BAT-','n','Iinv','สาย − อินเวอร์เตอร์ → แบต'],
  ['w14','BF.o','DCL+','p','Idc','สาย + บัส → โหลด DC'],['w15','DCL-','BAT-','n','Idc','สาย − โหลด DC → แบต'],
  ['w16','INV.L','ACB.i','l','Iac','สาย L อินเวอร์เตอร์ → เบรกเกอร์ AC'],['w17','ACB.o','ACL.L','l','Iac','สาย L เบรกเกอร์ → โหลด AC'],['w18','INV.N','ACL.N','nn','Iac','สาย N อินเวอร์เตอร์ → โหลด AC']
];
const BCOL={p:'#d62828',n:'#2b3138',l:'#8b5a2b',nn:'#2a78d6',g:'#1baf7a'};
const BSWK={PVF:'PVF',PVB:'PVB',BF:'BF',BBK:'BBK',ACB:'ACB',INV:'INV'};
const BC={},BPT={},BWG={};
let BVB={w:1400,h:640};
function bLayout(){
  let mx=1400,my=640;
  Object.keys(BM).forEach(k=>{const m=BM[k],o=BN.pos[k]||[0,0];BC[k]={x:m[0]+o[0],y:m[1]+o[1],w:m[2],h:m[3],t:m[4]};mx=Math.max(mx,m[0]+o[0]+m[2]+30);my=Math.max(my,m[1]+o[1]+m[3]+110)});
  Object.keys(BPORT).forEach(id=>{const p=BPORT[id],c=BC[p[0]];BPT[id]={id,x:c.x+p[1],y:c.y+p[2],side:p[3],lab:p[4],kind:p[5],mod:p[0]}});
  BVB={w:mx,h:my};
}
const bSide=s=>s==='l'?[-1,0]:s==='r'?[1,0]:s==='t'?[0,-1]:[0,1];
function bGeom(a,b){
  const d1=bSide(a.side),d2=bSide(b.side),dist=Math.hypot(b.x-a.x,b.y-a.y),k=Math.max(34,Math.min(260,dist*.4));
  return[a.x,a.y,a.x+d1[0]*k,a.y+d1[1]*k,b.x+d2[0]*k,b.y+d2[1]*k,b.x,b.y];
}
function bBez(g,t){const u=1-t,a=u*u*u,b=3*u*u*t,c=3*u*t*t,d=t*t*t;return[a*g[0]+b*g[2]+c*g[4]+d*g[6],a*g[1]+b*g[3]+c*g[5]+d*g[7]]}
const bMini={
  bulb:(x,y)=>`<circle cx="${x}" cy="${y}" r="7" fill="#ffd84a" stroke="#a07c00"/><rect x="${x-3}" y="${y+7}" width="6" height="4" fill="#888"/>`,
  fan:(x,y)=>`<circle cx="${x}" cy="${y}" r="8" fill="none" stroke="currentColor"/><path d="M${x} ${y}l0-7M${x} ${y}l6 4M${x} ${y}l-6 4" stroke="currentColor" stroke-width="2.2"/>`,
  pump:(x,y)=>`<circle cx="${x}" cy="${y}" r="8" fill="#cfe5ff" stroke="#2a78d6"/><path d="M${x-4} ${y}h8m-3-3l3 3l-3 3" stroke="#2a78d6" fill="none" stroke-width="1.6"/>`,
  air:(x,y)=>`<rect x="${x-10}" y="${y-6}" width="20" height="10" rx="2" fill="#e9eef3" stroke="currentColor"/><path d="M${x-6} ${y+7}l-2 4M${x} ${y+7}v5M${x+6} ${y+7}l2 4" stroke="#2a78d6" stroke-width="1.4"/>`
};
function bBadge(r,k){
  /* status text for protective devices */
  const rate={PVF:BN.pf.a,PVB:BN.pb.a,BF:BN.bf.a,BBK:BN.bb.a,ACB:BN.acb}[k];
  const cur={PVF:r.nP>0?r.Ia/r.nP:0,PVB:r.Ia,BF:Math.abs(r.st.Inet),BBK:r.st.Iinv,ACB:r.Iac}[k];
  return{rate,cur,open:!!r.op[k],hot:rate>0&&cur>rate,none:!(rate>0)};
}
function bModArt(k,c,r){
  const w=c.w,h=c.h,ink='currentColor';
  let st='',inner='',foot='';
  if(BSWK[k]&&k!=='INV'){
    const b=bBadge(r,k),pr=k==='PVF'||k==='BF';
    st=b.open?'bad':b.hot?'warn':'';
    const lab=b.none?'ไม่ติดตั้ง':(b.rate+' A');
    if(b.none)inner=`<path d="M0 45H90" stroke="${ink}" stroke-width="3"/><text x="45" y="30" text-anchor="middle" class="acnote">ไม่มี</text>`;
    else if(pr)inner=`<path d="M0 45H90" stroke="${ink}" stroke-width="3"/><rect x="22" y="36" width="46" height="18" rx="3" fill="var(--surface)" stroke="${ink}" stroke-width="2"/>${b.open?`<path d="M30 45l8-3 8 6 6-4 8 2" stroke="#d62828" stroke-width="2" fill="none"/>`:`<path d="M26 45H64" stroke="${ink}" stroke-width="2"/>`}`;
    else inner=`<path d="M0 45H24M66 45H90" stroke="${ink}" stroke-width="3"/><circle cx="24" cy="45" r="3.5" fill="${ink}"/><circle cx="66" cy="45" r="3.5" fill="${ink}"/><path d="${b.open?'M24 45L58 28':'M24 45L66 45'}" stroke="${b.open?'#d62828':ink}" stroke-width="4" stroke-linecap="round"/>`;
    foot=`<text x="45" y="${h-22}" text-anchor="middle" class="acnote">${lab}${b.none?'':(' · '+f(b.cur,1)+' A')}</text><text x="45" y="${h-8}" text-anchor="middle" class="acnote" style="fill:${b.open?'#d62828':'var(--muted)'}">${b.none?'':(BLATCH[k]?'ทริป · แตะเพื่อรีเซ็ต':b.open?'เปิดอยู่ · แตะเพื่อปิด':'ปิด (ทำงาน) · แตะเพื่อเปิด')}</text>`;
  }
  if(k==='ARR'){
    const cols=Math.min(r.nS,8),rows=Math.min(r.nP,5),cw=Math.min(40,(176)/cols),ch=Math.min(26,(110)/rows),pw=cw-6,ph=ch-6;
    let s='';
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
      const x=22+i*cw,y=24+j*ch;
      s+=`<rect x="${x}" y="${y}" width="${pw}" height="${ph}" rx="2" fill="#1f3a63" stroke="#8fb4e8"/><path d="M${x+pw/2} ${y}v${ph}M${x} ${y+ph/2}h${pw}" stroke="#4a6fa5" stroke-width=".7"/>`;
      if(i<cols-1)s+=`<path d="M${x+pw} ${y+ph/2}h6" stroke="${ink}" stroke-width="2"/>`;
    }
    const yb=24+rows*ch-6;
    s+=`<path d="M14 ${24+ph/2}V${yb-ph/2+ (rows-1)*0}" stroke="${BCOL.n}" stroke-width="2.5"/><path d="M${22+cols*cw-4} ${24+ph/2}V${24+(rows-1)*ch+ph/2}" stroke="${BCOL.p}" stroke-width="2.5"/>`;
    for(let j=0;j<rows;j++){const y=24+j*ch+ph/2;s+=`<path d="M14 ${y}H22" stroke="${BCOL.n}" stroke-width="2"/><path d="M${22+cols*cw-10} ${y}h6" stroke="${BCOL.p}" stroke-width="2"/>`}
    s+=`<path d="M${22+cols*cw-4} 60H230" stroke="${BCOL.p}" stroke-width="2.5"/><path d="M14 ${24+ph/2}V170H214V130H230" stroke="${BCOL.n}" stroke-width="2.5" fill="none"/>`;
    inner=s+(r.nS>8||r.nP>5?`<text x="115" y="165" text-anchor="middle" class="acnote">(ย่อภาพ)</text>`:'');
    foot=`<text x="115" y="${h-4}" text-anchor="middle" class="acnote">${r.nS} อนุกรม × ${r.nP} ขนาน · ${f(r.nS*r.nP*r.P.pmax,0)} Wp</text>`;
    foot+=`<text x="115" y="${h-18}" text-anchor="middle" class="acnote">Voc ${f(r.Voc,0)} V · Isc ${f(r.nP*r.cond.isc,1)} A</text>`;
  }
  if(k==='SPD'){
    st=BN.spd>0?'':'warn';
    inner=BN.spd>0?`<rect x="25" y="26" width="40" height="52" rx="4" fill="var(--surface)" stroke="${ink}" stroke-width="2"/><path d="M50 32l-10 22h8l-6 18 16-24h-9l7-16z" fill="#e0a800"/><path d="M45 78v30" stroke="${BCOL.g}" stroke-width="2.5"/>`:`<text x="45" y="62" text-anchor="middle" class="acnote">ไม่มี SPD</text>`;
    foot=BN.spd>0?`<text x="45" y="${h-4}" text-anchor="middle" class="acnote">Uc ${BN.spd} V</text>`:'';
  }
  if(k==='GND')inner=`<path d="M35 6v14M15 20h40M22 29h26M29 38h12" stroke="${BCOL.g}" stroke-width="3" stroke-linecap="round"/>`;
  if(k==='CTRL'){
    const ok=r.ctrlOk&&r.pvOn;
    st=r.dead||!r.ctrlSys?'bad':'';
    inner=`<rect x="22" y="30" width="126" height="120" rx="8" fill="#f1f4f7" stroke="${ink}" stroke-width="2"/><rect x="34" y="42" width="102" height="40" rx="4" fill="#1d3a2a"/><text x="85" y="60" text-anchor="middle" fill="#8ff0b0" font-family="var(--mono)" font-size="12">${r.dead?'OVER Voc!':ok?f(r.st.ic,1)+' A':'0.0 A'}</text><text x="85" y="75" text-anchor="middle" fill="#8ff0b0" font-family="var(--mono)" font-size="10">${f(r.st.vb,1)} V</text><circle cx="42" cy="104" r="5" fill="${ok&&r.st.ic>.1?'#2fbf6f':'#999'}"/><circle cx="60" cy="104" r="5" fill="${r.dead?'#d62828':'#bbb'}"/><text x="85" y="128" text-anchor="middle" class="acnote">${r.C.type.toUpperCase()} ${r.C.imax} A</text><text x="85" y="142" text-anchor="middle" class="acnote">PV ≤ ${r.C.vocMax} V</text>`;
    foot=`<text x="85" y="${h-8}" text-anchor="middle" class="acnote">${r.dead?'ตัวควบคุมเสียหาย':r.ctrlSys?'ระบบ '+BN.sys+' V':'ไม่รองรับ '+BN.sys+' V'}</text>`;
  }
  if(k==='BAT'){
    const B=r.B,lv=Math.max(0,Math.min(100,BN.soc));
    inner=`<rect x="30" y="38" width="90" height="110" rx="6" fill="#eef3f0" stroke="${ink}" stroke-width="2"/><rect x="56" y="30" width="38" height="8" fill="${ink}"/><rect x="36" y="${44+98*(1-lv/100)}" width="78" height="${98*lv/100}" rx="3" fill="${lv<20?'#d9534f':'#3fb77a'}" opacity=".85"/><text x="75" y="95" text-anchor="middle" font-size="14" font-weight="600" fill="#12301f">${f(lv,0)}%</text><text x="75" y="112" text-anchor="middle" class="acnote" style="fill:#12301f">${f(r.st.Vt,2)} V</text>`;
    foot=`<text x="75" y="${h-18}" text-anchor="middle" class="acnote">${B.ns}S × ${B.p}P · ${f(B.V,1)} V ${f(B.Ah,0)} Ah</text><text x="75" y="${h-4}" text-anchor="middle" class="acnote">${r.st.Inet>=0?'ชาร์จ +':'จ่าย −'}${f(Math.abs(r.st.Inet),1)} A</text>`;
  }
  if(k==='INV'){
    const I=r.I,on=r.st.invRun&&I,off=!!r.op.INV;
    st=off?'bad':'';
    inner=I?`<rect x="22" y="32" width="126" height="130" rx="8" fill="#f1f4f7" stroke="${ink}" stroke-width="2"/><path d="M34 90q12-26 24 0t24 0t24 0t24 0" fill="none" stroke="#2a78d6" stroke-width="2.6"/><text x="85" y="130" text-anchor="middle" class="acnote">${I.pac} W</text><text x="85" y="146" text-anchor="middle" class="acnote">${f(r.Pac,0)} W · ${f(r.Iac,1)} A</text><circle cx="40" cy="48" r="5" fill="${on?'#2fbf6f':'#999'}"/>`:`<text x="85" y="110" text-anchor="middle" class="acnote">ไม่ได้ติดตั้ง</text>`;
    foot=I?`<text x="85" y="${h-22}" text-anchor="middle" class="acnote">${esc(I.name)}</text><text x="85" y="${h-8}" text-anchor="middle" class="acnote" style="fill:${off?'#d62828':'var(--muted)'}">${off?(BLATCH.INV?'ปิดเพราะโอเวอร์โหลด · แตะเพื่อรีเซ็ต':'ปิดอยู่ · แตะเพื่อเปิด'):'เปิด · แตะเพื่อปิด'}</text>`:'';
  }
  if(k==='DCL'||k==='ACL'){
    const kind=k==='DCL'?'dc':'ac',ls=r.L.filter(x=>x.d.kind===kind);
    inner=ls.length?ls.slice(0,6).map((x,i)=>{const cx=24+(i%3)*54,cy=40+Math.floor(i/3)*40;return `<g>${bMini[x.d.ic](cx+12,cy)}<text x="${cx+12}" y="${cy+22}" text-anchor="middle" class="acnote">×${x.q}</text></g>`}).join(''):`<text x="${w/2}" y="${h/2}" text-anchor="middle" class="acnote">ไม่มีโหลด</text>`;
    const P=kind==='dc'?r.st.Pdc:r.Pac,I2=kind==='dc'?r.st.Idc:r.Iac;
    foot=`<text x="${w/2}" y="${h-6}" text-anchor="middle" class="acnote">${f(P,0)} W · ${f(I2,1)} A${r.cut&&P===0&&(kind==='dc'?r.Pdc0:r.Pac0)>0?' (ถูกตัด)':''}</text>`;
  }
  const stroke=st==='bad'?'#d62828':st==='warn'?'#e0a800':'var(--line)';
  return `<g class="bmod${BSWK[k]?' bsw':''}" data-c="${k}" transform="translate(${c.x} ${c.y})"><rect width="${w}" height="${h}" rx="10" class="acbox" style="stroke:${stroke};stroke-width:${st?2.5:1.5}"/><text x="${w/2}" y="15" text-anchor="middle" class="actitle">${esc(c.t)}</text><g style="color:var(--ink)">${inner}</g>${foot}</g>`;
}
function bClampRead(m,r){
  if(!m.wire||!BWG[m.wire])return{v:null,txt:'—',note:'ยังไม่ได้คล้องสาย: ลากแคลมป์ไปที่เส้นสาย'};
  const w=BWG[m.wire],raw=r.fl[w.flow]||0,ac=w.kind==='l'||w.kind==='nn',abs=Math.abs(raw);
  if(m.both)return{v:0,txt:'0.00 A',note:'คล้องทั้งสาย + และ − พร้อมกัน กระแสหักล้างกันจึงอ่านได้ 0 ต้องคล้องทีละเส้น'};
  if(m.type==='ac'&&!ac)return{v:0,txt:'0.00 A',note:'แคลมป์ AC อย่างเดียวอ่านกระแส DC ไม่ได้ ต้องใช้แคลมป์ DC (Hall effect)'};
  return{v:abs,txt:f(abs,abs<10?2:1)+' A',note:(w.flow==='Ibat'?(raw>=0?'กระแสชาร์จเข้าแบต':'กระแสจ่ายออกจากแบต'):'')};
}
function bPortV(id,r){
  const p=BPT[id];if(!p)return null;
  const dom=p.kind==='l'||p.kind==='nn'?'ac':p.kind==='g'?'g':'dc';
  return{v:r.v[id]||0,dom};
}
function bVoltRead(r){
  const a=bPortV(BN.m.PR.port,r),b=bPortV(BN.m.PB.port,r);
  if(!a||!b)return{txt:'— V',note:'ปลายสายวัดต้องแตะที่จุดต่อสาย (วงกลม)'};
  if(a.dom!=='g'&&b.dom!=='g'&&a.dom!==b.dom)return{txt:'— V',note:'จุดวัดอยู่คนละฝั่ง AC/DC ไม่ควรวัดข้ามกัน'};
  const dom=a.dom==='g'?b.dom:a.dom;
  let v=a.v-b.v;if(a.dom==='ac'&&b.dom==='ac')v=Math.abs(v);
  return{v,txt:f(v,dom==='ac'?0:2)+' V'+(dom==='ac'?' AC':' DC'),note:''};
}
function bRender(){
  const svg=document.getElementById('bnsvg');if(!svg)return;
  bLayout();
  const r=BSOL=bSolve();
  svg.setAttribute('viewBox',`0 0 ${BVB.w} ${BVB.h}`);bApplyZoom();
  let s='';
  Object.keys(BC).forEach(k=>{s+=bModArt(k,BC[k],r)});
  BWIRE.forEach(w=>{
    const a=BPT[w[1]],b=BPT[w[2]],g=bGeom(a,b),flow=w[4],I=Math.abs(r.fl[flow]||0);
    BWG[w[0]]={g,kind:w[3],flow,name:w[5],I};
    const d=`M${g[0]} ${g[1]}C${g[2]} ${g[3]} ${g[4]} ${g[5]} ${g[6]} ${g[7]}`;
    s+=`<path d="${d}" class="bw${I<.005?' dead':''}" style="stroke:${BCOL[w[3]]}"/>`;
  });
  Object.keys(BPT).forEach(id=>{
    const p=BPT[id],lx=p.side==='l'?p.x-8:p.side==='r'?p.x+8:p.x,ly=p.side==='t'?p.y-8:p.side==='b'?p.y+14:p.y+4,an=p.side==='l'?'end':p.side==='r'?'start':'middle';
    s+=`<g data-p="${id}"><circle cx="${p.x}" cy="${p.y}" r="5.5" class="acterm" style="stroke:${BCOL[p.kind]}"/>${p.lab?`<text x="${lx}" y="${ly}" class="aclab" text-anchor="${an}">${esc(p.lab)}</text>`:''}</g>`;
  });
  /* meters */
  ['A1','A2'].forEach(id=>{
    const m=BN.m[id],rd=bClampRead(m,r);let x=m.x,y=m.y;
    if(m.wire&&BWG[m.wire]){const q=bBez(BWG[m.wire].g,m.t);x=q[0];y=q[1]}
    s+=`<g class="bmeter" data-m="${id}"><circle cx="${x}" cy="${y}" r="15" fill="none" stroke="#e0a800" stroke-width="7"/><circle cx="${x}" cy="${y}" r="21" fill="transparent"/><rect x="${x-6}" y="${y+16}" width="12" height="16" fill="#3b4048"/><rect x="${x-34}" y="${y+30}" width="68" height="26" rx="5" fill="#222" stroke="#e0a800"/><text x="${x}" y="${y+48}" text-anchor="middle" fill="#9dff9d" font-family="var(--mono)" font-size="13">${rd.txt}</text><text x="${x}" y="${y-22}" text-anchor="middle" class="aclab">${id==='A1'?'แคลมป์ 1':'แคลมป์ 2'}</text></g>`;
  });
  const vm=BN.m.VB,rv=bVoltRead(r);
  const pp=id=>{const m=BN.m[id];if(m.port&&BPT[m.port])return[BPT[m.port].x,BPT[m.port].y];return[m.x,m.y]};
  const pr=pp('PR'),pb=pp('PB');
  s+=`<path d="M${vm.x+40} ${vm.y+56}C${vm.x+40} ${vm.y+110} ${pr[0]} ${pr[1]+70} ${pr[0]} ${pr[1]}" class="blead" style="stroke:#d62828"/><path d="M${vm.x+80} ${vm.y+56}C${vm.x+80} ${vm.y+110} ${pb[0]} ${pb[1]+70} ${pb[0]} ${pb[1]}" class="blead" style="stroke:#14191e"/>`;
  s+=`<g class="bmeter" data-m="VB"><rect x="${vm.x}" y="${vm.y}" width="120" height="56" rx="8" fill="#e4b400" stroke="#8a6d00" stroke-width="2"/><rect x="${vm.x+8}" y="${vm.y+8}" width="104" height="26" rx="3" fill="#222"/><text x="${vm.x+60}" y="${vm.y+27}" text-anchor="middle" fill="#9dff9d" font-family="var(--mono)" font-size="14">${rv.txt}</text><text x="${vm.x+60}" y="${vm.y+49}" text-anchor="middle" font-size="10" fill="#4a3a00">มัลติมิเตอร์ (โวลต์)</text></g>`;
  s+=`<g class="bmeter" data-m="PR"><circle cx="${pr[0]}" cy="${pr[1]}" r="9" fill="#d62828" stroke="#fff" stroke-width="2"/><circle cx="${pr[0]}" cy="${pr[1]}" r="20" fill="transparent"/></g><g class="bmeter" data-m="PB"><circle cx="${pb[0]}" cy="${pb[1]}" r="9" fill="#14191e" stroke="#fff" stroke-width="2"/><circle cx="${pb[0]}" cy="${pb[1]}" r="20" fill="transparent"/></g>`;
  svg.innerHTML=s;
  bPanels(r,rv);
}
function bPanels(r,rv){
  const q=id=>document.getElementById(id),S=BN,B=r.B;
  const nE=r.checks.filter(c=>c[0]==='err').length+(r.fault?r.fault.items.filter(c=>c[0]==='err').length:0),nW=r.checks.filter(c=>c[0]==='warn').length+(r.fault?r.fault.items.filter(c=>c[0]==='warn').length:0);
  const lvl=nE?'err':nW?'warn':'ok';
  q('bnverdict').className='verdict '+lvl;q('bnverdict').innerHTML=`<span class="pill ${lvl}">${LABEL[lvl]}</span><b>${nE?`พบปัญหาร้ายแรง ${nE} จุด`:nW?`ใช้งานได้ แต่มี ${nW} ข้อควรระวัง`:'วงจรและอุปกรณ์ป้องกันเหมาะสม'}</b>`;
  const P=r.st.ic*r.st.vb,net=r.st.Inet,use=B.Ah*(Math.max(0,S.soc-(100-B.dod))/100);
  const rt=net<-.05?`ใช้ได้อีก ≈ ${f(use/(-net),1)} ชม.`:net>.05?`เต็มใน ≈ ${f(B.Ah*(100-S.soc)/100/net,1)} ชม.`:'สมดุล';
  const mx=[
    ['แผง (ตอนนี้)',`${f(r.mp.P,0)} W`,`Voc ${f(r.Voc,0)} V · Vmp ${f(r.mp.V,0)} V · เซลล์ ${f(r.cond.Tc,0)}°C`],
    ['ชาร์จเข้าแบต',`${f(r.st.ic,1)} A`,`≈ ${f(P,0)} W · ${r.C.type.toUpperCase()}`],
    ['แรงดันแบต',`${f(r.st.Vt,2)} V`,`SOC ${f(S.soc,0)}% · กระแสสุทธิ ${net>=0?'+':''}${f(net,1)} A`],
    ['โหลด',`${f(r.st.Pdc+r.Pac+r.st.Pid,0)} W`,`DC ${f(r.st.Pdc,0)} W · AC ${f(r.Pac,0)} W`],
    ['แบตเตอรี่',rt,`${f(B.V*B.Ah/1000,2)} kWh`]
  ];
  q('bnmx').innerHTML=mx.map(m=>`<div class="metric"><div class="k">${m[0]}</div><div class="v">${m[1]}</div><div class="s">${esc(m[2])}</div></div>`).join('');
  q('bnchecks').innerHTML=r.checks.map(c=>`<li><span class="b ${c[0]}">${c[0]==='ok'?'✓':c[0]==='err'?'×':'!'}</span><span>${esc(c[1])}</span></li>`).join('');
  q('bnfault').innerHTML=r.fault?`<h2>ผลการทดสอบฟอลต์: ${esc(r.fault.title)}</h2><ul class="checks">`+r.fault.items.map(c=>`<li><span class="b ${c[0]}">${c[0]==='ok'?'✓':c[0]==='err'?'×':'!'}</span><span>${esc(c[1])}</span></li>`).join('')+'</ul>':'';
  const mt=[];
  ['A1','A2'].forEach(id=>{
    const m=S.m[id],rd=bClampRead(m,r),w=m.wire&&BWG[m.wire];
    mt.push(`<div class="bmrow" data-mr="${id}"><b>${id==='A1'?'แคลมป์ 1':'แคลมป์ 2'}</b><span class="bmval">${rd.txt}</span><span class="hint">${w?esc(w.name):'ยังไม่ได้คล้อง'}${rd.note?' · '+esc(rd.note):''}</span><label>ชนิด<select data-mk="${id}.type"><option value="dcac" ${m.type==='dcac'?'selected':''}>แคลมป์ DC+AC</option><option value="ac" ${m.type==='ac'?'selected':''}>แคลมป์ AC อย่างเดียว</option></select></label><label class="chk"><input type="checkbox" data-mk="${id}.both" ${m.both?'checked':''}><span>คล้องทั้ง + และ −</span></label></div>`);
  });
  const pa=S.m.PR.port,pb2=S.m.PB.port;
  mt.push(`<div class="bmrow"><b>โวลต์มิเตอร์</b><span class="bmval">${rv.txt}</span><span class="hint">แดง: ${pa?esc((BPT[pa].mod)+' '+(BPT[pa].lab||pa)):'ว่าง'} · ดำ: ${pb2?esc((BPT[pb2].mod)+' '+(BPT[pb2].lab||pb2)):'ว่าง'}${rv.note?' · '+esc(rv.note):''}</span></div>`);
  const act=document.activeElement;
  if(!(act&&act.closest&&act.closest('#bnmeters')))q('bnmeters').innerHTML=mt.join('');
  else mt.forEach((h,i)=>{});
}
function bApplyZoom(){
  const svg=document.getElementById('bnsvg');if(!svg)return;
  svg.style.width=(BN.zoom*100)+'%';
  const z=document.getElementById('bnzoomv');if(z)z.textContent=Math.round(BN.zoom*100)+'%';
  const rg=document.getElementById('bnzoom');if(rg&&document.activeElement!==rg)rg.value=Math.round(BN.zoom*100);
}
function bSetZoom(z){BN.zoom=Math.max(.5,Math.min(2.5,Math.round(z*100)/100));bApplyZoom()}
function bMove(k,dx,dy){
  const m=BM[k];if(!m)return;
  dx=Math.round(dx/10)*10;dy=Math.round(dy/10)*10;
  dx=Math.max(-m[0],Math.min(1600,dx));dy=Math.max(-m[1],Math.min(1000,dy));
  if(!dx&&!dy)delete BN.pos[k];else BN.pos[k]=[dx,dy];
}
/* ---- controls ---- */
const bOpts=(list,cur,fmt)=>list.map(v=>`<option value="${v}" ${String(v)===String(cur)?'selected':''}>${fmt?fmt(v):v}</option>`).join('');
function bCtlHTML(){
  const A=(a)=>a?a+' A':'ไม่ติดตั้ง';
  const sel=(k,lab,html,n)=>`<label>${lab}<select data-k="${k}" ${n?'data-n':''}>${html}</select></label>`;
  const num=(k,lab,min,max,step)=>`<label>${lab}<input data-k="${k}" data-n type="number" inputmode="decimal" min="${min}" max="${max}" step="${step||1}"></label>`;
  const rng=(k,lab,min,max,step,unit)=>`<label class="sl">${lab} <b data-bv="${k}"></b> ${unit}<input data-k="${k}" data-n type="range" min="${min}" max="${max}" step="${step}"></label>`;
  return `
  <div class="panelbox"><h2>1) ระบบและแผง</h2>
    <div class="chips" id="bnsys" role="group" aria-label="แรงดันระบบ"><span class="lab">แรงดันระบบ</span>${[12,24,48].map(v=>`<button class="chip" data-sys="${v}">${v} V</button>`).join('')}</div>
    <div class="row3">${sel('panel','แผงโซลาร์','')}${num('nS','จำนวนแผงต่ออนุกรม (S)',1,20)}${num('nP','จำนวนสตริงขนาน (P)',1,10)}</div>
    <p class="hint tight" id="bnarrinfo"></p>
    <div class="row3">${sel('ctrl','ชาร์จคอนโทรลเลอร์',bCtlOpts())}${sel('bat','แบตเตอรี่','')}${num('bP','แบตขนาน (ชุด)',1,8)}</div>
    <div class="row3">${sel('inv','อินเวอร์เตอร์','')}<label class="chk"><input type="checkbox" data-k="invOn"><span>เปิดอินเวอร์เตอร์</span></label>${sel('sc','ทดสอบฟอลต์',bOpts(B_SCEN.map(x=>x[0]),BN.sc,v=>B_SCEN.find(x=>x[0]===v)[1]))}</div>
  </div>
  <div class="panelbox"><h2>2) สภาพแวดล้อม</h2>
    <div class="row3">${rng('G','แสงแดด',0,1100,50,'W/m²')}${rng('Ta','อุณหภูมิอากาศ',0,45,1,'°C')}${rng('soc','ประจุแบต (SOC)',0,100,1,'%')}</div>
    <div class="row3">${num('tmin','อุณหภูมิต่ำสุดที่ใช้เช็ค Voc (°C)',-10,35)}</div>
  </div>
  <div class="panelbox"><h2>3) อุปกรณ์ป้องกัน</h2>
    <div class="row3">${sel('pf.a','ฟิวส์สตริง (ทุกสตริง)',bOpts(B_FUSE_PV,BN.pf.a,A),1)}${sel('pf.t','ชนิดฟิวส์',bOpts(B_TYPES.pf.map(x=>x[0]),BN.pf.t,v=>B_TYPES.pf.find(x=>x[0]===v)[1]))}<span></span>
      ${sel('pb.a','เบรกเกอร์ DC ฝั่งแผง',bOpts(B_BRK_PV,BN.pb.a,A),1)}${sel('pb.t','ชนิดเบรกเกอร์',bOpts(B_TYPES.pb.map(x=>x[0]),BN.pb.t,v=>B_TYPES.pb.find(x=>x[0]===v)[1]))}${sel('spd','SPD DC (Uc)',[[0,'ไม่ติดตั้ง'],[600,'SPD Uc 600 V'],[1000,'SPD Uc 1000 V']].map(x=>`<option value="${x[0]}">${x[1]}</option>`).join(''),1)}
      ${sel('bf.a','ฟิวส์แบต (ที่ขั้ว +)',bOpts(B_FUSE_BAT,BN.bf.a,A),1)}${sel('bf.t','ชนิดฟิวส์แบต',bOpts(B_TYPES.bf.map(x=>x[0]),BN.bf.t,v=>B_TYPES.bf.find(x=>x[0]===v)[1]))}<span></span>
      ${sel('bb.a','เบรกเกอร์ DC ของอินเวอร์เตอร์',bOpts(B_BRK_BAT,BN.bb.a,A),1)}${sel('bb.t','ชนิดเบรกเกอร์',bOpts(B_TYPES.bb.map(x=>x[0]),BN.bb.t,v=>B_TYPES.bb.find(x=>x[0]===v)[1]))}${sel('acb','เบรกเกอร์ AC หลังอินเวอร์เตอร์',bOpts(B_BRK_AC,BN.acb,A),1)}
    </div>
    <h3>สายไฟ</h3>
    <div class="row3">${sel('cPV.mm','สาย PV (mm²)',bOpts(B_MM,BN.cPV.mm),1)}${num('cPV.len','ความยาว PV (เมตร, ไป-กลับคิดให้)',1,200)}<span></span>
      ${sel('cB.mm','สายแบต/อินเวอร์เตอร์ (mm²)',bOpts(B_MM,BN.cB.mm),1)}${num('cB.len','ความยาวสายแบต (เมตร)',.2,20,.1)}</div>
  </div>
  <div class="panelbox"><h2>4) โหลดที่ใช้ทดสอบ</h2>
    <div class="bnloads">${BLOAD.map(d=>`<div class="bnload"><span>${d.kind==='dc'?'<i class="tag dc">DC</i>':'<i class="tag ac">AC</i>'}${esc(d.name)}</span><label>จำนวน<input type="number" min="0" max="20" step="1" inputmode="numeric" data-ld="${d.id}"></label><label class="chk"><input type="checkbox" data-lo="${d.id}"><span>เปิด</span></label></div>`).join('')}</div>
  </div>`;
}
const bCtlOpts=()=>BCTL.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');
function bSyncCtl(){
  const root=document.getElementById('bnctl');if(!root)return;
  const get=(o,p)=>p.split('.').reduce((a,k)=>a&&a[k],o);
  root.querySelector('[data-k=panel]').innerHTML=benchPanels().map(p=>`<option value="${esc(p.id)}">${esc(p.brand+' '+p.model)} (${p.pmax} W)</option>`).join('');
  root.querySelector('[data-k=bat]').innerHTML=benchBats().map(p=>`<option value="${esc(p.id)}">${esc(p.brand+' '+p.model)}</option>`).join('');
  const il=bInvList();root.querySelector('[data-k=inv]').innerHTML=`<option value="">ไม่ใช้อินเวอร์เตอร์ (โหลด DC อย่างเดียว)</option>`+il.map(i=>`<option value="${i.id}">${esc(i.name)}</option>`).join('');
  root.querySelectorAll('[data-k]').forEach(el=>{
    if(document.activeElement===el)return;
    const v=get(BN,el.dataset.k);
    if(el.type==='checkbox')el.checked=!!v;else el.value=v;
  });
  root.querySelectorAll('[data-bv]').forEach(el=>{el.textContent=BN[el.dataset.bv]});
  root.querySelectorAll('[data-sys]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.sys===BN.sys)));
  root.querySelectorAll('[data-ld]').forEach(el=>{if(document.activeElement!==el)el.value=(BN.loads[el.dataset.ld]||{}).q||0});
  root.querySelectorAll('[data-lo]').forEach(el=>{el.checked=!!(BN.loads[el.dataset.lo]||{}).on});
  const P=bSel(benchPanels(),BN.panel);
  document.getElementById('bnarrinfo').textContent=`อนุกรม ${BN.nS} แผง → แรงดันบวกกัน (Voc ${f(BN.nS*P.voc,1)} V) · ขนาน ${BN.nP} สตริง → กระแสบวกกัน (Isc ${f(BN.nP*P.isc,1)} A) · รวม ${f(BN.nS*BN.nP*P.pmax,0)} Wp`;
}
function bSetPath(k,v){
  const p=k.split('.'),last=p.pop();let o=BN;p.forEach(x=>{o=o[x]});o[last]=v;
}
function bOnChange(){
  BLATCH={};
  if(BN.inv&&!bInvSel())BN.inv='';
  bSyncCtl();bRender();touch();
}
const BPRESETS={
  p12(){Object.assign(BN,{sys:12,panel:'b-100',nS:1,nP:2,bat:'bb-lfp12-100',bP:1,ctrl:'mppt30',inv:'i12-1000',invOn:true,G:800,Ta:30,soc:60,sc:'none',spd:600,
    pf:{a:10,t:'pv'},pb:{a:25,t:'dc500'},bf:{a:125,t:'t160'},bb:{a:125,t:'dc500'},acb:10,cPV:{mm:4,len:10},cB:{mm:25,len:1},loads:{'led-dc':{q:3,on:true},'led-ac':{q:2,on:true},'fan':{q:1,on:true}}})},
  p24(){Object.assign(BN,{sys:24,panel:'b-330',nS:2,nP:2,bat:'bb-lfp24-100',bP:2,ctrl:'mppt40',inv:'i24-2000',invOn:true,G:900,Ta:32,soc:70,sc:'none',spd:1000,
    pf:{a:15,t:'pv'},pb:{a:32,t:'dc1000'},bf:{a:100,t:'t160'},bb:{a:100,t:'dc500'},acb:16,cPV:{mm:6,len:15},cB:{mm:25,len:1},loads:{'pump-ac':{q:1,on:true},'led-ac':{q:4,on:true},'pump-dc':{q:0,on:false}}})},
  p48(){Object.assign(BN,{sys:48,panel:'b-450',nS:4,nP:2,bat:'bb-lfp48-100',bP:2,ctrl:'mppt100',inv:'i48-5000',invOn:true,G:900,Ta:32,soc:80,sc:'none',spd:1000,
    pf:{a:20,t:'pv'},pb:{a:40,t:'dc1000'},bf:{a:150,t:'t160'},bb:{a:160,t:'dc500'},acb:32,cPV:{mm:6,len:20},cB:{mm:35,len:1.5},loads:{'air9':{q:1,on:true},'pump-ac':{q:1,on:true},'led-ac':{q:6,on:true},'fan':{q:2,on:true}}})},
  bad(){Object.assign(BN,{sys:24,panel:'b-450',nS:3,nP:3,bat:'bb-lfp24-100',bP:1,ctrl:'pwm20',inv:'i24-2000',invOn:true,G:1000,Ta:35,soc:50,sc:'bshort',spd:0,
    pf:{a:0,t:'ac'},pb:{a:63,t:'ac'},bf:{a:0,t:'anl32'},bb:{a:200,t:'ac'},acb:6,cPV:{mm:2.5,len:40},cB:{mm:6,len:3},loads:{'air12':{q:1,on:true},'pump-ac':{q:1,on:true},'led-ac':{q:2,on:true}}})}
};
function bSnapshot(){return JSON.parse(JSON.stringify(BN))}
function bRestore(o){
  if(!o||typeof o!=='object')return;
  const n=(v,d,lo,hi)=>{v=+v;return isFinite(v)?Math.max(lo,Math.min(hi,v)):d};
  if([12,24,48].includes(o.sys))BN.sys=o.sys;
  ['panel','bat','ctrl','inv'].forEach(k=>{if(typeof o[k]==='string')BN[k]=o[k]});
  BN.nS=n(o.nS,BN.nS,1,20)|0;BN.nP=n(o.nP,BN.nP,1,10)|0;BN.bP=n(o.bP,BN.bP,1,8)|0;BN.invOn=o.invOn!==false;
  BN.G=n(o.G,800,0,1100);BN.Ta=n(o.Ta,30,0,45);BN.soc=n(o.soc,60,0,100);BN.tmin=n(o.tmin,10,-10,35);
  const dev=(k,list,types)=>{const s=o[k]||{};BN[k]={a:list.includes(+s.a)?+s.a:BN[k].a,t:types.some(t=>t[0]===s.t)?s.t:BN[k].t}};
  dev('pf',B_FUSE_PV,B_TYPES.pf);dev('pb',B_BRK_PV,B_TYPES.pb);dev('bf',B_FUSE_BAT,B_TYPES.bf);dev('bb',B_BRK_BAT,B_TYPES.bb);
  if([0,600,1000].includes(+o.spd))BN.spd=+o.spd;
  if(B_BRK_AC.includes(+o.acb))BN.acb=+o.acb;
  if(o.cPV)BN.cPV={mm:B_MM.includes(+o.cPV.mm)?+o.cPV.mm:4,len:n(o.cPV.len,10,1,200)};
  if(o.cB)BN.cB={mm:B_MM.includes(+o.cB.mm)?+o.cB.mm:25,len:n(o.cB.len,1,.2,20)};
  if(o.loads&&typeof o.loads==='object'){BN.loads={};BLOAD.forEach(d=>{const l=o.loads[d.id];if(l)BN.loads[d.id]={q:n(l.q,0,0,20)|0,on:!!l.on}})}
  if(B_SCEN.some(x=>x[0]===o.sc))BN.sc=o.sc;
  BN.pos={};if(o.pos&&typeof o.pos==='object')Object.keys(BM).forEach(k=>{const a=o.pos[k];if(Array.isArray(a))bMove(k,n(a[0],0,-2000,2000),n(a[1],0,-2000,2000))});
  BN.zoom=n(o.zoom,1,.5,2.5);
  if(o.m&&typeof o.m==='object'){
    ['A1','A2'].forEach(k=>{const m=o.m[k];if(m)Object.assign(BN.m[k],{x:n(m.x,0,-100,4000),y:n(m.y,0,-100,4000),wire:BWIRE.some(w=>w[0]===m.wire)?m.wire:null,t:n(m.t,.5,.02,.98),type:m.type==='ac'?'ac':'dcac',both:!!m.both})});
    ['VB','PR','PB'].forEach(k=>{const m=o.m[k];if(m)Object.assign(BN.m[k],{x:n(m.x,0,-100,4000),y:n(m.y,0,-100,4000)});if(m&&k!=='VB')BN.m[k].port=BPORT[m.port]?m.port:null});
  }
}
function initBench(){
  const root=document.getElementById('bnctl'),svg=document.getElementById('bnsvg');if(!root||!svg)return;
  root.innerHTML=bCtlHTML();
  document.getElementById('bnpre').addEventListener('click',e=>{const b=e.target.closest('[data-bp]');if(b){BN.sw={PVF:1,PVB:1,BF:1,BBK:1,ACB:1,INV:1};BPRESETS[b.dataset.bp]();bOnChange()}});
  root.addEventListener('click',e=>{const b=e.target.closest('[data-sys]');if(!b)return;
    BN.sys=+b.dataset.sys;
    const P={12:['bb-lfp12-100','mppt30','i12-1000'],24:['bb-lfp24-100','mppt40','i24-2000'],48:['bb-lfp48-100','mppt100','i48-3000']}[BN.sys];
    BN.bat=P[0];BN.ctrl=P[1];BN.inv=P[2];bOnChange()});
  const onInput=e=>{
    const el=e.target;
    if(el.dataset.k){let v=el.type==='checkbox'?el.checked:el.value;if(el.dataset.n!==undefined){v=parseFloat(v);if(!isFinite(v))return}bSetPath(el.dataset.k,v);
      if(el.dataset.k==='spd')BN.spd=+BN.spd;
      bOnChange();return}
    if(el.dataset.ld){const q=Math.max(0,Math.min(20,parseInt(el.value)||0));BN.loads[el.dataset.ld]=Object.assign(BN.loads[el.dataset.ld]||{on:true},{q});if(q>0&&!BN.loads[el.dataset.ld].on)BN.loads[el.dataset.ld].on=true;BLATCH={};bSyncCtl();bRender();touch();return}
    if(el.dataset.lo){const l=BN.loads[el.dataset.lo]||(BN.loads[el.dataset.lo]={q:1,on:false});l.on=el.checked;if(l.on&&!(l.q>0))l.q=1;BLATCH={};bSyncCtl();bRender();touch()}
  };
  root.addEventListener('input',onInput);root.addEventListener('change',onInput);
  const mt=document.getElementById('bnmeters');
  mt.addEventListener('change',e=>{const el=e.target,k=el.dataset.mk;if(!k)return;const [id,f2]=k.split('.');BN.m[id][f2]=el.type==='checkbox'?el.checked:el.value;bRender();touch()});
  /* svg interaction */
  let mv=null,md=null,raf=0;
  const pt=e=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse())};
  const later=()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;bRender()})};
  svg.addEventListener('pointerdown',e=>{
    const m=e.target.closest('[data-m]');
    if(m){e.preventDefault();md={id:m.dataset.m};try{svg.setPointerCapture(e.pointerId)}catch(_){}return}
    const c=e.target.closest('[data-c]');
    if(c){e.preventDefault();const p=pt(e),o=BN.pos[c.dataset.c]||[0,0];mv={k:c.dataset.c,sx:p.x,sy:p.y,ox:o[0],oy:o[1],moved:false};try{svg.setPointerCapture(e.pointerId)}catch(_){}}
  });
  svg.addEventListener('pointermove',e=>{
    if(md){
      const p=pt(e),m=BN.m[md.id];m.x=p.x;m.y=p.y;
      if(md.id==='A1'||md.id==='A2'){
        let best=null;
        Object.keys(BWG).forEach(id=>{const g=BWG[id].g;for(let i=1;i<40;i++){const q=bBez(g,i/40),d=Math.hypot(q[0]-p.x,q[1]-p.y);if(!best||d<best.d)best={d,id,t:i/40}}});
        if(best&&best.d<40){m.wire=best.id;m.t=best.t}else m.wire=null;
      }else if(md.id==='PR'||md.id==='PB'){
        let best=null;Object.keys(BPT).forEach(id=>{const q=BPT[id],d=Math.hypot(q.x-p.x,q.y-p.y);if(!best||d<best.d)best={d,id}});
        m.port=best&&best.d<26?best.id:null;
      }
      later();return;
    }
    if(mv){
      const p=pt(e);
      if(!mv.moved&&Math.hypot(p.x-mv.sx,p.y-mv.sy)<6)return;
      mv.moved=true;bMove(mv.k,mv.ox+p.x-mv.sx,mv.oy+p.y-mv.sy);later();
    }
  });
  const end=()=>{
    if(md){md=null;bRender();touch();return}
    if(mv){
      const m=mv;mv=null;
      if(m.moved){bRender();touch()}
      else if(BSWK[m.k]){
        if(BLATCH[m.k])delete BLATCH[m.k];else BN.sw[m.k]=BN.sw[m.k]?0:1;
        bRender();touch();
      }
    }
  };
  svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',()=>{md=null;mv=null});
  const q=id=>document.getElementById(id);
  q('bnzoom').addEventListener('input',e=>bSetZoom(+e.target.value/100));q('bnzoom').addEventListener('change',()=>touch());
  q('bnzin').addEventListener('click',()=>{bSetZoom(BN.zoom+.1);touch()});q('bnzout').addEventListener('click',()=>{bSetZoom(BN.zoom-.1);touch()});
  q('bnreset').addEventListener('click',()=>{BN.pos={};BN.zoom=1;bRender();touch()});
  q('bnreset2').addEventListener('click',()=>{BLATCH={};BN.sw={PVF:1,PVB:1,BF:1,BBK:1,ACB:1,INV:1};bRender();touch()});
  bSyncCtl();bRender();
}
