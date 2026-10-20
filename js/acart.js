/* ---- AC tab artwork: simple illustrations of real equipment (terminal positions come from acsys.js) ---- */
const AI={
  pylon:(x,y,s)=>`<g transform="translate(${x} ${y}) scale(${s||1})"><path d="M0 -40L-14 38M0 -40L14 38M-9 -2H9M-12 16H12M-9 -2L12 16M9 -2L-12 16" class="a-line"/><path d="M-28 -30H28M-19 -16H19" class="a-line a-th"/><path d="M0 -40V-50" class="a-line"/><g class="a-fill"><circle cx="-28" cy="-26" r="3.2"/><circle cx="28" cy="-26" r="3.2"/><circle cx="-19" cy="-12" r="3.2"/><circle cx="19" cy="-12" r="3.2"/></g></g>`,
  bolt:(x,y,s)=>`<path transform="translate(${x} ${y}) scale(${s||1})" d="M4 -14L-8 3H-1L-4 15L9 -2H2Z" class="a-acc"/>`,
  house:(x,y,s)=>`<g transform="translate(${x} ${y}) scale(${s||1})"><path d="M-17 1L0 -16L17 1" class="a-line a-th"/><path d="M-12 -3V16H12V-3" class="a-fill"/><rect x="-3.5" y="5" width="7" height="11" class="a-dark"/></g>`,
  plug:(x,y,s)=>`<g transform="translate(${x} ${y}) scale(${s||1})"><rect x="-15" y="-15" width="30" height="30" rx="7" class="a-fill"/><circle cx="-5" cy="-3" r="2.4" class="a-dark"/><circle cx="5" cy="-3" r="2.4" class="a-dark"/><path d="M-4 7H4" class="a-line a-th"/></g>`,
  bulb:(x,y,s)=>`<g transform="translate(${x} ${y}) scale(${s||1})"><circle cx="0" cy="-4" r="10" style="fill:#ffe27a;stroke:#c99a00;stroke-width:1.5"/><rect x="-5" y="5" width="10" height="7" rx="1.5" class="a-dark"/><path d="M-3 -4L0 2L3 -4" class="a-line" style="stroke:#c99a00;stroke-width:1.4"/></g>`,
  meter:(x,y,s)=>`<g transform="translate(${x} ${y}) scale(${s||1})"><rect x="-14" y="-18" width="28" height="36" rx="5" class="a-fill"/><rect x="-10" y="-14" width="20" height="9" rx="1.5" class="a-lcd"/><circle cx="0" cy="6" r="6.5" class="a-line"/><path d="M0 6L3.5 2.5" class="a-line"/></g>`,
  bat:(x,y,s)=>`<g transform="translate(${x} ${y}) scale(${s||1})"><rect x="-17" y="-11" width="30" height="22" rx="3" class="a-fill"/><rect x="13" y="-5" width="4" height="10" rx="1" class="a-dark"/><rect x="-13" y="-7" width="6" height="14" class="a-grn"/><rect x="-5" y="-7" width="6" height="14" class="a-grn"/><rect x="3" y="-7" width="6" height="14" class="a-grn" style="opacity:.35"/></g>`,
  gen:(x,y,s)=>`<g transform="translate(${x} ${y}) scale(${s||1})"><rect x="-19" y="-14" width="38" height="24" rx="4" class="a-fill"/><rect x="-15" y="-10" width="16" height="16" rx="2" class="a-dark"/><circle cx="9" cy="-2" r="5" class="a-line"/><circle cx="-12" cy="14" r="4.5" class="a-dark"/><circle cx="12" cy="14" r="4.5" class="a-dark"/></g>`
};
function acArt(k,c,I,S){
  const T=(x,y,t,cls,anc)=>`<text x="${x}" y="${y}" class="${cls||'a-t'}" text-anchor="${anc||'middle'}">${t}</text>`;
  let g=`<g transform="translate(${c.x} ${c.y})">`;
  const plate=(cls)=>`<rect x="0" y="0" width="${c.w}" height="${c.h}" rx="10" class="acbox${cls||''}"/>`;
  const p3=typeof AC_MODE!=='undefined'&&AC_MODE!=='1',hw=!!c.hw;
  if(p3&&k==='G'){
    g+=plate()+T(75,18,'กริด 3 เฟส','actitle')+AI.pylon(52,92,1.15)+AI.bolt(102,50,1.3)
      +`<path d="M5 132H110" class="a-ground"/>`+T(70,152,'400 V ระหว่างเฟส','acnote')+T(70,168,'230 V เฟสกับ N','acnote')+T(70,186,'3 เฟส 4 สาย + PE','acnote');
  }else if(p3&&k==='M'){
    const R=(typeof AC_READ!=='undefined'&&AC_READ)||null;
    g+=plate()+T(85,18,'สมาร์ทมิเตอร์ 3 เฟส','actitle')
      +`<rect x="44" y="28" width="82" height="196" rx="8" class="a-fill"/>`;
    PH3.forEach((p,i)=>{const v=R?R.grid[i]:null,t=v==null?'L'+p+'  —':`L${p} ${v>=0?'+':'−'}${f(Math.abs(v)/1000,2)}`;
      g+=`<rect x="50" y="${36+i*26}" width="70" height="20" rx="3" class="a-lcd"/>`+T(85,50+i*26,t,'a-lcdt')});
    const tot=R?R.grid.reduce((a,b)=>a+b,0):null;
    g+=`<rect x="50" y="116" width="70" height="20" rx="3" class="a-lcd"/>`+T(85,130,tot==null?'Σ —':`Σ ${tot>=0?'+':'−'}${f(Math.abs(tot)/1000,2)}`,'a-lcdt')
      +`<circle cx="85" cy="160" r="12" class="a-fill" style="stroke-width:2"/><path d="M85 160L93 153" class="a-line a-th"/><circle cx="85" cy="160" r="2.5" class="a-dark"/>`
      +T(85,190,R?`kW · ${hhmm(R.h)}`:'kW','acnote').replace('class="acnote"','class="acnote" style="font-size:9.5px"')
      +T(85,204,hw?'DTSU666-H':'+ ซื้อ − ขาย','acnote').replace('class="acnote"','class="acnote" style="font-size:9.5px"')
      +`<rect x="56" y="212" width="28" height="7" rx="2" class="a-dark"/><rect x="88" y="212" width="28" height="7" rx="2" class="a-dark"/>`
;
  }else if(k==='G'){
    g+=plate()+T(75,18,'กริด (การไฟฟ้า)','actitle')+AI.pylon(52,82,1.15)+AI.bolt(102,40,1.3)
      +`<path d="M5 112H110" class="a-ground"/>`+T(52,126,'หม้อแปลง / เสาไฟ','acnote');
  }else if(k==='M'){
    g+=plate()+T(75,18,'สมาร์ทมิเตอร์','actitle')
      +`<rect x="48" y="30" width="56" height="102" rx="8" class="a-fill"/><rect x="53" y="36" width="46" height="24" rx="3" class="a-lcd"/>`
      +T(76,52,'0123.4','a-lcdt')+`<circle cx="76" cy="90" r="15" class="a-fill" style="stroke-width:2"/><path d="M76 90L86 81" class="a-line a-th"/><circle cx="76" cy="90" r="2.5" class="a-dark"/>`
      +`<rect x="56" y="112" width="18" height="7" rx="2" class="a-dark"/><rect x="78" y="112" width="18" height="7" rx="2" class="a-dark"/>`+T(76,148,hw?'DDSU666-H · RS485':'RS485','acnote');
  }else if(k==='DB'){
    g+=plate()+T(75,16,'ตู้เมนบ้าน','actitle')
      +`<rect x="32" y="24" width="86" height="96" rx="5" class="a-fill" style="stroke-width:2"/><path d="M38 52H112M38 98H112" class="a-line"/>`;
    for(let i=0;i<5;i++){const x=40+i*14;g+=`<rect x="${x}" y="58" width="11" height="34" rx="2" class="a-dark"/><rect x="${x+2}" y="${i%2?74:62}" width="7" height="14" rx="1.5" class="${i===4?'a-red':'a-fill'}"/>`}
    g+=AI.house(75,38,.62)+T(75,112,'เบรกเกอร์ย่อย · โหลดทั้งบ้าน','acnote').replace('class="acnote"','class="acnote" style="font-size:9px"');
    if(p3)g+=T(75,190,'บัส L1 L2 L3 · N · PE','acnote').replace('class="acnote"','class="acnote" style="font-size:9.5px"');
  }else if(k==='CT'){
    const toGrid=S.ctDir==='toGrid';
    g+=plate()+T(75,16,'CT (ตัวคล้องสาย)','actitle')
      +`<path d="M0 46H98" class="a-wire" style="stroke:#8b5a2b"/>`
      +`<circle cx="58" cy="46" r="24" class="a-fill" style="stroke-width:7;stroke:#46535e"/><circle cx="58" cy="46" r="14" style="fill:var(--bg);stroke:none"/>`
      +`<path d="M58 22V28M58 64V70" class="a-line" style="stroke:var(--bg);stroke-width:3"/>`
      +`<path d="${toGrid?'M70 80H34M34 80l6-5M34 80l6 5':'M46 80H82M82 80l-6-5M82 80l-6 5'}" class="a-line a-th" style="stroke:var(--accent)"/>`
      +`<path d="M80 40C110 36 120 30 150 30M80 52C110 56 120 60 150 60" class="a-line" style="stroke:#e0762c"/><path d="M80 52C110 56 120 60 150 60" class="a-line" style="stroke:#9a9aa3"/>`;
  }else if(k==='GEN'){
    g+=plate()+T(85,18,'เครื่องปั่นไฟ','actitle')
      +`<rect x="14" y="30" width="72" height="22" rx="6" style="fill:#d9534f;stroke:#8f2a27;stroke-width:1.5"/>`
      +`<rect x="10" y="54" width="80" height="62" rx="6" class="a-fill" style="stroke-width:2"/><rect x="14" y="60" width="38" height="50" rx="4" class="a-dark"/><circle cx="33" cy="85" r="14" class="a-fill"/><path d="M33 85l8-8M33 85l-8-5M33 85l2 10" class="a-line"/>`
      +`<rect x="56" y="62" width="30" height="40" rx="3" class="a-fill"/><circle cx="66" cy="74" r="4.5" class="a-dark"/><circle cx="78" cy="74" r="4.5" class="a-dark"/><rect x="62" y="86" width="18" height="8" rx="2" class="a-grn"/>`
      +`<path d="M92 66V40H104" class="a-line a-th"/><circle cx="24" cy="126" r="9" class="a-dark"/><circle cx="76" cy="126" r="9" class="a-dark"/><path d="M6 120H94" class="a-line a-th"/>`
      +T(48,156,'สตาร์ท 2 สาย (dry contact)','acnote').replace('class="acnote"','class="acnote" style="font-size:9.5px"');
  }else if(k==='CDB'){
    g+=plate()+T(75,16,'ตู้โหลดสำรอง','actitle')
      +`<rect x="14" y="24" width="86" height="96" rx="5" class="a-fill" style="stroke-width:2"/>`+AI.bulb(38,52,1.1)+AI.plug(72,52,.9)
      +`<rect x="22" y="80" width="18" height="26" rx="2" class="a-dark"/><rect x="25" y="84" width="12" height="9" class="a-fill"/><rect x="46" y="80" width="18" height="26" rx="2" class="a-dark"/><rect x="49" y="95" width="12" height="9" class="a-fill"/><rect x="70" y="80" width="18" height="26" rx="2" class="a-dark"/><rect x="73" y="84" width="12" height="9" class="a-fill"/>`
      +T(56,115,'ตู้เย็น · ไฟ · เราเตอร์','acnote').replace('class="acnote"','class="acnote" style="font-size:9px"');
  }else if(k==='BAT'&&hw){
    const bi=typeof bankInfo==='function'?bankInfo():null;
    g+=plate()+T(75,18,'Huawei LUNA2000','actitle')
      +`<rect x="78" y="30" width="64" height="150" rx="6" class="a-dark" style="stroke-width:2"/><rect x="83" y="36" width="54" height="22" rx="3" class="a-lcd"/>`+T(110,52,bi?f(bi.V,0)+' V':'—','a-lcdt')
      +`<rect x="83" y="64" width="54" height="34" rx="3" class="a-fill"/>`+T(110,85,'5KW-C0','acnote')
      +`<rect x="83" y="104" width="54" height="32" rx="3" class="a-fill"/><rect x="83" y="140" width="54" height="32" rx="3" class="a-fill"/>`+T(110,124,'5-E0','acnote')+T(110,160,'5-E0','acnote')
      +T(75,206,bi?`${bi.p} ชุด · ${f(bi.kwh,0)} kWh`:'','acnote')+T(75,222,'COM: Enable · RS485','acnote').replace('class="acnote"','class="acnote" style="font-size:9.5px"');
  }else if(k==='BAT'){
    const bi=typeof bankInfo==='function'?bankInfo():null;
    g+=plate()+T(75,18,hw?'Huawei LUNA2000':'แบตเตอรี่ '+esc(bi?bi.b.chem.replace('LiFePO4','LiFePO₄'):''),'actitle')
      +`<rect x="44" y="28" width="92" height="128" rx="7" class="a-dark" style="stroke-width:2"/><rect x="50" y="34" width="80" height="24" rx="3" class="a-lcd"/>`+T(90,51,bi?f(bi.V,0)+' V':'—','a-lcdt')
      +`<rect x="50" y="66" width="80" height="12" rx="2" class="a-fill"/><rect x="52" y="68" width="14" height="8" class="a-grn"/><rect x="68" y="68" width="14" height="8" class="a-grn"/><rect x="84" y="68" width="14" height="8" class="a-grn"/><rect x="100" y="68" width="14" height="8" class="a-grn" style="opacity:.35"/>`
      +`<rect x="56" y="88" width="24" height="52" rx="3" class="a-fill"/><rect x="92" y="88" width="24" height="52" rx="3" class="a-fill"/><path d="M68 94V134M104 94V134" class="a-line" style="stroke:var(--s3)"/><rect x="48" y="146" width="84" height="4" rx="2" style="fill:var(--accent)"/>`
      +T(90,170,hw?'COM: Enable · RS485':'BMS สื่อสาร CAN','acnote');
  }else if(k==='INV'){
    g+=`<rect x="0" y="0" width="${c.w}" height="${c.h}" rx="14" class="acbox inv"/>`;
    const band=(y0,y1,x0,x1,col,title,icon)=>`<rect x="${x0}" y="${y0}" width="${x1-x0}" height="${y1-y0}" rx="7" style="fill:${col};opacity:.13"/><text x="${x0+6}" y="${y0+12}" class="a-grp" style="fill:${col}">${title}</text>`+icon;
    if(p3){
      const b3=c.bp===3;
      g+=band(8,186,3,100,'var(--s1)','GRID 3 เฟส','')+AI.pylon(128,96,.5)
        +band(228,b3?370:330,3,100,'var(--s2)',b3?'BACKUP 3 เฟส':'BACKUP 1 เฟส','')
        +band(492,572,3,100,'var(--s3)','สมาร์ทมิเตอร์ RS485','')
        +band(26,hw?262:186,160,257,'var(--pos)',hw?'BAT · COM แบต':'BAT · แบตเตอรี่','')+AI.bat(127,115,1);
    }else g+=band(8,146,3,100,'var(--s1)','GRID · ไฟจากกริด','')+AI.pylon(128,88,.5)
      +band(152,258,3,100,'var(--s2)','BACKUP · ไฟสำรอง','')+AI.plug(128,214,.9)
      +(hw?'':band(268,428,3,100,'var(--accent)','GEN · เครื่องปั่นไฟ','')+AI.gen(128,356,.9))
      +band(462,hw?572:612,3,100,'var(--s3)',hw?'สมาร์ทมิเตอร์ 485A1/B1':'วัดกริด · CT / มิเตอร์','')+(hw?'':AI.meter(128,545,.9))
      +band(26,hw?262:186,160,257,'var(--pos)',hw?'BAT · COM แบต':'BAT · แบตเตอรี่','')+AI.bat(127,115,1)
      ;
    /* inverter face on the free right side */
    g+=`<rect x="112" y="238" width="140" height="352" rx="10" class="a-fill" style="stroke-width:2"/>`
      +`<rect x="122" y="250" width="120" height="58" rx="5" class="a-lcd"/>`+T(182,278,`${f(I.pac/1000,1)} kW`,'a-lcdt big')+T(182,298,'PV → AC','a-lcdt')
      +`<circle cx="134" cy="330" r="5" class="a-grn"/><circle cx="154" cy="330" r="5" class="a-acc"/><circle cx="174" cy="330" r="5" class="a-red" style="opacity:.4"/>`+T(206,334,'สถานะ','acnote').replace('class="acnote"','class="acnote" style="font-size:9.5px"');
    for(let i=0;i<9;i++)g+=`<rect x="124" y="${356+i*17}" width="116" height="7" rx="3.5" class="a-fin"/>`;
    g+=`<rect x="124" y="518" width="116" height="60" rx="6" class="a-dark"/>`+T(182,553,esc((I.brand||'').toUpperCase()||'INVERTER'),'a-lcdt big').replace('class="a-lcdt big"','class="a-brand"')+T(182,570,esc(I.model||''),'a-brand s');
    g+=T(c.w/2,-8,esc(I.name||'อินเวอร์เตอร์')+' · '+esc(I.type),'actitle');
  }
  return g+'</g>';
}
