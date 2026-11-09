/* ---- เมนู 04: หน้าตาจุดต่อสายตามอินเวอร์เตอร์จริงของแต่ละยี่ห้อ
   ชื่อขั้ว การจัดกลุ่มขั้วในกล่องต่อสาย (wire box) และช่องร้อยสายด้านล่างตามคู่มือผู้ผลิต
   รหัสขั้ว (INV.GL, INV.C1 …) และชนิดสายเหมือนเดิมทุกยี่ห้อ การตรวจต่อถูก/ผิดจึงไม่เปลี่ยน ---- */
/* group: [title, kind of block (ac | rj45 | pins | bat | pe), regexp of terminal ids, note] */
const ACB_COL={ac:'var(--s1)',bk:'var(--s2)',gen:'var(--accent)',sig:'var(--s3)',m:'var(--s3)',bat:'var(--pos)',bms:'var(--s3)',pe:'#1baf7a'};
const ACB={
  solis:{
    src:'คู่มือ Solis S6-EH1P(3-8)K-L-PLUS V1.3 · รูป 1.3 มุมมองด้านล่าง · 3.9 CT / มิเตอร์ · 3.10.2 ขั้วสื่อสาร',
    L:[['GRID · ขั้วต่อ AC','ac','ac',/^INV\.G(L\d?|N|P)$/],['BACKUP · ขั้วต่อ AC','ac','bk',/^INV\.B(L\d?|N|P)$/],['GEN · ขั้วต่อ AC','ac','gen',/^INV\.E[LN]$/],
       ['ขั้ว 12 PIN · ผ่าน COM3','pins','sig',/^INV\.(C1|C2|D1|D2)$/],['Meter RJ45 · ผ่าน COM1/2','rj45','m',/^INV\.R[AB]$/],['กราวด์ตัวถัง','pe','pe',/^INV\.PF$/]],
    R:[['BAT · Battery Connection','bat','bat',/^INV\.B[+-]$/],['BMS RJ45 CAN · ผ่าน COM1/2','rj45','bms',/^INV\.C[HL]$/]],
    lab:{'INV.C1':'ขา 1 CT ขาว','INV.C2':'ขา 2 CT ดำ','INV.D1':'ขา 3 G-V','INV.D2':'ขา 4 G-V','INV.RA':'ขา 1 RS485A','INV.RB':'ขา 2 RS485B','INV.B+':'BAT+','INV.B-':'BAT−','INV.CH':'CAN H','INV.CL':'CAN L','INV.PF':'ตัวถัง ⏚'},
    bottom:['DC Switch','COM1','COM2','COM3','Gen','Backup','Grid','PV','Battery','COM (USB)']
  },
  deye:{
    src:'คู่มือ Deye SUN-3-6K-SG04LP1-EU-SM2 (2026-01) · 2 ภาพรวมขั้วต่อ · 3.4 Function port · 3.5 ขั้ว GRID / LOAD / GEN',
    L:[['GRID · ขั้วต่อ AC','ac','ac',/^INV\.G(L\d?|N|P)$/],['GEN · Generator input','ac','gen',/^INV\.E[LN]$/],['LOAD · ไฟสำรอง','ac','bk',/^INV\.B(L\d?|N|P)$/],
       ['Function port (8 ขา)','pins','sig',/^INV\.(C1|C2|D1|D2)$/],['Meter port · RJ45','rj45','m',/^INV\.R[AB]$/],['กราวด์ตัวถัง','pe','pe',/^INV\.PF$/]],
    R:[['Battery input','bat','bat',/^INV\.B[+-]$/],['RS485/CAN · แบต BMS','rj45','bms',/^INV\.C[HL]$/]],
    lab:{'INV.BL':'LOAD L','INV.BN':'LOAD N','INV.BP':'LOAD PE','INV.BL1':'LOAD L1','INV.BL2':'LOAD L2','INV.BL3':'LOAD L3','INV.EL':'GEN L','INV.EN':'GEN N',
      'INV.C1':'ขา 3 CT','INV.C2':'ขา 4 CT','INV.D1':'ขา 5 G-start','INV.D2':'ขา 6 G-start','INV.RA':'Meter A','INV.RB':'Meter B','INV.B+':'BAT+','INV.B-':'BAT−','INV.CH':'CAN H','INV.CL':'CAN L','INV.PF':'ตัวถัง ⏚'},
    bottom:['DC Switch','PV input','Battery','Modbus','RS485/CAN','Meter','Function','Parallel','DRM','GEN','LOAD','GRID','WiFi']
  },
  huawei:{
    src:'คู่มือ Huawei SUN2000-(2KTL-6KTL)-L1 Issue 06 · 2 มุมมองด้านล่าง · ตาราง 5-3 ขาพอร์ต COM',
    L:[['AC · ขั้วต่อ AC (L N PE)','ac','ac',/^INV\.G(L\d?|N|P)$/],['BACKUP · Backup Box','ac','bk',/^INV\.B(L\d?|N|P)$/],['COM · มิเตอร์ (ขา 3–4)','pins','m',/^INV\.R[AB]$/],['กราวด์ตัวถัง','pe','pe',/^INV\.PF$/]],
    R:[['BAT+ / BAT−','bat','bat',/^INV\.B[+-]$/],['COM แบต LUNA2000 ขา 3–6','pins','bms',/^INV\.(EP|EG|BA|BB)$/]],
    lab:{'INV.GL':'AC L','INV.GN':'AC N','INV.GP':'AC PE','INV.RA':'ขา 4 485A2','INV.RB':'ขา 3 485B2','INV.EP':'ขา 6 EN+','INV.EG':'ขา 5 GND','INV.BA':'ขา 4 485A2','INV.BB':'ขา 3 485B2','INV.PF':'ตัวถัง ⏚'},
    bottom:['DC SWITCH','PV1','PV2','BAT','4G/FE','ANT','COM','AC']
  },
  goodwe:{
    src:'ดาต้าชีต GoodWe ET PLUS+ V1.0 (ชื่อพอร์ต) · ยังไม่มีคู่มือติดตั้งในโฟลเดอร์ PV Datasheets ตำแหน่งขั้วเป็นการจัดเพื่อการสอน',
    L:[['ON-GRID · ขั้วต่อ AC','ac','ac',/^INV\.G(L\d?|N|P)$/],['BACK-UP · ขั้วต่อ AC','ac','bk',/^INV\.B(L\d?|N|P)$/],['Meter · RS485','rj45','m',/^INV\.R[AB]$/],['กราวด์ตัวถัง','pe','pe',/^INV\.PF$/]],
    R:[['BAT+ / BAT− (HV)','bat','bat',/^INV\.B[+-]$/],['BMS · CAN','rj45','bms',/^INV\.C[HL]$/]],
    lab:{'INV.GL':'ON-GRID L','INV.GN':'ON-GRID N','INV.GP':'ON-GRID PE','INV.BL':'BACK-UP L','INV.BN':'BACK-UP N','INV.BP':'BACK-UP PE','INV.GL1':'ON-GRID L1','INV.GL2':'ON-GRID L2','INV.GL3':'ON-GRID L3',
      'INV.BL1':'BACK-UP L1','INV.BL2':'BACK-UP L2','INV.BL3':'BACK-UP L3','INV.RA':'485 A','INV.RB':'485 B','INV.B+':'BAT+','INV.B-':'BAT−','INV.CH':'CAN H','INV.CL':'CAN L','INV.PF':'ตัวถัง ⏚'},
    bottom:null
  }
};
let ACB_CUR=null,ACB_GRP=[];
const acbOf=I=>ACB[String((I||{}).brand||'').toLowerCase()]||null;
/* re-place the inverter's terminals as the brand's terminal blocks; called before acLayout() on every render */
function acBrandApply(I){
  const B=acbOf(I);ACB_CUR=B;ACB_GRP=[];
  const base=AC_T.reduce((m,t)=>(m[t[0]]=t,m),{});
  /* reset to the table positions and names first (switching brand, or back to a brand without a layout) */
  Object.keys(AC_TM).forEach(id=>{const T=AC_TM[id],t=base[id];if(T.comp==='INV'&&t){T.bx=t[3];T.by=t[4];if(!B)T.lab=t[1]}});
  if(!B)return;
  const C=AC_C.INV,ids=Object.keys(AC_TM).filter(id=>AC_TM[id].comp==='INV');
  const place=(groups,side)=>{
    let y=C.y+20;const xEdge=side==='l'?C.x:C.x+C.w,used=new Set();
    groups.forEach(([title,blk,col,re])=>{
      const g=ids.filter(id=>re.test(id)&&!used.has(id)&&AC_TM[id].side===side);if(!g.length)return;
      const pin=id=>{const m=/ขา (\d+)/.exec(B.lab[id]||'');return m?+m[1]:0};if(g.some(pin))g.sort((x,y)=>pin(x)-pin(y));
      g.forEach(id=>used.add(id));
      const y0=y;y+=20;
      g.forEach(id=>{const T=AC_TM[id];T.bx=xEdge;T.by=y;y+=24});
      ACB_GRP.push({title,blk,col:ACB_COL[col]||'var(--s3)',side,y0:y0-C.y,y1:y-C.y-6,ids:g,off:g.every(id=>!acAvail(AC_TM[id]))});
      y+=8;
    });
    /* anything a brand does not list stays in a plain group at the end */
    const rest=ids.filter(id=>!used.has(id)&&AC_TM[id].side===side);
    if(rest.length){const y0=y;y+=20;rest.forEach(id=>{const T=AC_TM[id];T.bx=xEdge;T.by=y;y+=24});ACB_GRP.push({title:'อื่นๆ',blk:'pins',col:'var(--muted)',side,y0:y0-C.y,y1:y-C.y-6,ids:rest,off:false})}
  };
  place(B.L,'l');place(B.R,'r');
  ids.forEach(id=>{if(B.lab[id])AC_TM[id].lab=B.lab[id]});
}
/* drawing of the brand's wire box inside the inverter module (local coordinates of the module) */
function acBrandArt(c,I){
  const B=ACB_CUR;if(!B)return null;
  const T=(x,y,t,cls,anc,st)=>`<text x="${x}" y="${y}" class="${cls||'a-t'}" text-anchor="${anc||'middle'}"${st?` style="${st}"`:''}>${t}</text>`;
  let g=`<rect x="0" y="0" width="${c.w}" height="${c.h}" rx="14" class="acbox inv"/>`;
  ACB_GRP.forEach(G=>{
    const L=G.side==='l',x0=L?3:c.w-106,x1=L?106:c.w-3,op=G.off?.45:1;
    g+=`<g style="opacity:${op}"><rect x="${x0}" y="${G.y0}" width="${x1-x0}" height="${G.y1-G.y0}" rx="6" style="fill:${G.col};opacity:.12"/>`;
    const ttl=esc(G.title)+(G.off?' · ไม่มีในรุ่นนี้':'');
    g+=`<text x="${L?x0+5:x1-5}" y="${G.y0+12}" class="a-grp" text-anchor="${L?'start':'end'}" style="fill:${G.col};font-size:8.5px" textLength="${Math.min(x1-x0-8,ttl.length*5)}" lengthAdjust="spacingAndGlyphs">${ttl}</text>`;
    /* the block itself: screw terminals for AC/BAT, an RJ45 jack, or a pin header */
    const ys=G.ids.map(id=>AC_TM[id].by-c.y),bx=L?84:c.w-100,top=ys[0]-9,bot=ys[ys.length-1]+9;
    if(G.blk==='ac'||G.blk==='bat'||G.blk==='pe'){
      g+=`<rect x="${bx}" y="${top}" width="16" height="${bot-top}" rx="2" class="a-dark" style="opacity:.75"/>`;
      ys.forEach(y=>{g+=`<circle cx="${bx+8}" cy="${y}" r="4.2" class="a-fill"/><path d="M${bx+5} ${y}H${bx+11}" class="a-line" style="stroke-width:1.2"/>`});
    }else if(G.blk==='rj45'){
      g+=`<rect x="${bx-2}" y="${top-2}" width="20" height="${Math.max(22,bot-top+4)}" rx="2" class="a-fill" style="stroke-width:1.5"/><rect x="${bx+2}" y="${top+2}" width="12" height="7" rx="1" class="a-dark"/>`;
      for(let i=0;i<8;i++)g+=`<path d="M${bx+3+i*1.5} ${top+11}V${top+16}" class="a-line" style="stroke-width:.7"/>`;
    }else{
      g+=`<rect x="${bx}" y="${top}" width="16" height="${bot-top}" rx="2" class="a-fill" style="stroke-width:1.5"/>`;
      ys.forEach(y=>{g+=`<rect x="${bx+4}" y="${y-3.5}" width="8" height="7" rx="1" class="a-dark"/>`});
    }
    g+='</g>';
  });
  /* inverter face between the two columns */
  const fx=112,fw=c.w-224>70?c.w-224:140,fy=Math.max(...ACB_GRP.filter(G=>G.side==='r').map(G=>G.y1),120)+18;
  const fh=Math.min(300,c.h-fy-50);
  if(fh>120){
    g+=`<rect x="${fx}" y="${fy}" width="${c.w-fx-6}" height="${fh}" rx="10" class="a-fill" style="stroke-width:2"/>`
      +`<rect x="${fx+10}" y="${fy+12}" width="${c.w-fx-26}" height="50" rx="5" class="a-lcd"/>`+T((fx+c.w)/2,fy+40,`${f(I.pac/1000,1)} kW`,'a-lcdt big')+T((fx+c.w)/2,fy+56,'PV → AC','a-lcdt');
    for(let i=0;i<Math.floor((fh-130)/16);i++)g+=`<rect x="${fx+12}" y="${fy+76+i*16}" width="${c.w-fx-30}" height="6" rx="3" class="a-fin"/>`;
    g+=`<rect x="${fx+10}" y="${fy+fh-56}" width="${c.w-fx-26}" height="46" rx="6" class="a-dark"/>`+T((fx+c.w)/2,fy+fh-30,esc((I.brand||'').toUpperCase()),'a-brand')+T((fx+c.w)/2,fy+fh-16,esc(I.model||''),'a-brand s');
  }
  /* cable entries on the underside, in the order printed in the manual */
  if(B.bottom){
    const n=B.bottom.length,w=(c.w-8)/n;
    g+=`<rect x="2" y="${c.h-34}" width="${c.w-4}" height="32" rx="6" class="a-dark" style="opacity:.85"/>`;
    B.bottom.forEach((t,i)=>{const x=4+i*w+w/2,up=n>9&&i%2;g+=`<circle cx="${x}" cy="${c.h-18}" r="3.6" class="a-fill"/>`+T(x,up?c.h-25:c.h-6,esc(t),'a-brand s','middle','font-size:7px')});
    g+=T(c.w/2,c.h+12,'ช่องร้อยสายด้านล่าง (ซ้าย → ขวา ตามคู่มือ)','acnote','middle','font-size:9px');
  }
  g+=T(c.w/2,-8,esc(I.name||'อินเวอร์เตอร์')+' · '+esc(I.type),'actitle');
  return g;
}
