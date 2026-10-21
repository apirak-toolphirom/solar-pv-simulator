/* ---- catalog: panels, inverters, batteries (+ import / export, storage) ---- */
const SCHEMA={
  panels:{
    title:'แผงโซลาร์',one:'แผง',
    fields:[
      ['brand','ยี่ห้อ','t',''],['model','รุ่น','t',''],
      ['pmax','Pmax (W)','n',0],['voc','Voc (V)','n',0],['vmp','Vmp (V)','n',0],['isc','Isc (A)','n',0],['imp','Imp (A)','n',0],
      ['kVoc','สัมประสิทธิ์ Voc (%/°C)','n',-0.25],['kPmax','สัมประสิทธิ์ Pmax (%/°C)','n',-0.30],['kIsc','สัมประสิทธิ์ Isc (%/°C)','n',0.05],
      ['noct','NOCT (°C)','n',43],['note','หมายเหตุ','t','']
    ],
    req:['brand','model','pmax','voc','vmp','isc','imp'],
    alias:{brand:['brand','ยี่ห้อ','manufacturer','maker'],model:['model','รุ่น','name','type'],pmax:['pmax','p','power','watt','w','wp','กำลัง'],voc:['voc'],vmp:['vmp','vmpp'],isc:['isc'],imp:['imp','impp'],
      kVoc:['kvoc','tcvoc','tempcoeffvoc','voctemp'],kPmax:['kpmax','tcpmax','tempcoeffpmax','pmaxtemp','gamma'],kIsc:['kisc','tcisc','iscTemp'],noct:['noct','noct(c)'],note:['note','หมายเหตุ','remark']}
  },
  inverters:{
    title:'อินเวอร์เตอร์',one:'อินเวอร์เตอร์',
    fields:[
      ['brand','ยี่ห้อ','t',''],['model','รุ่น','t',''],
      ['type','ชนิด','s','on-grid',[['on-grid','On-grid'],['hybrid','Hybrid'],['off-grid','Off-grid']]],
      ['phase','ระบบไฟ AC','s','1',[['1','1 เฟส (L N)'],['3','3 เฟส (L1 L2 L3 N)']]],
      ['asym','จ่ายไฟแต่ละเฟสไม่เท่ากันได้ (3 เฟส)','s','0',[['0','ไม่ได้ จ่ายเท่ากันทุกเฟส'],['1','ได้ ตามโหลดแต่ละเฟส']]],
      ['bph','พอร์ต Backup','s','',[['','เท่ากับระบบไฟ AC'],['1','1 เฟส'],['3','3 เฟส']],'hyb'],
      ['pac','กำลัง AC (W)','n',0],['vmax','Vdc สูงสุด (V)','n',0],['lo','MPPT ต่ำสุด (V)','n',0],['hi','MPPT สูงสุด (V)','n',0],['start','แรงดันเริ่มทำงาน (V)','n',0],
      ['micro','ชนิดย่อย','s','',[['','สตริง / ไฮบริด'],['1','ไมโครอินเวอร์เตอร์ (ติดใต้แผง)']]],['nmppt','จำนวน MPPT (1–4)','n',2],['brMax','ไมโคร: ต่อพ่วงสูงสุดต่อสายย่อย (ตัว)','n',0],['brBrk','ไมโคร: เบรกเกอร์สายย่อยสูงสุด (A)','n',0],['imax','กระแสอินพุตต่อ MPPT (A)','n',0],['isc','Isc สูงสุดต่อ MPPT (A)','n',0],['pvRec','PV สูงสุดที่แนะนำ (W)','n',0],['eff','ประสิทธิภาพ (%)','n',97],
      ['bvMin','แรงดันแบต ต่ำสุด (V)','n',0,null,'hyb'],['bvMax','แรงดันแบต สูงสุด (V)','n',0,null,'hyb'],
      ['bchg','ชาร์จแบตสูงสุด (kW)','n',0,null,'hyb'],['bdis','จ่ายจากแบตสูงสุด (kW)','n',0,null,'hyb'],['backupKw','กำลังขาออกโหมด Backup (kW)','n',0,null,'hyb'],
      ['note','หมายเหตุ','t','']
    ],
    req:['brand','model','pac','vmax','lo','hi','start','imax'],
    alias:{brand:['brand','ยี่ห้อ'],model:['model','รุ่น'],type:['type','ชนิด','topology'],phase:['phase','phases','เฟส','gridphase'],asym:['asym','asymmetric','unbalanced'],bph:['bph','backupphase'],pac:['pac','acpower','ratedac','power','กำลัง','ac'],vmax:['vmax','maxdcvoltage','vdcmax','maxvoltage'],lo:['lo','mpptmin','vmppmin','mpptlow'],hi:['hi','mpptmax','vmppmax','mppthigh'],start:['start','startvoltage','vstart'],
      micro:['micro','microinverter'],brMax:['brmax','maxunitsperbranch','unitsperbranch'],nmppt:['nmppt','mppt','mppts','mpptcount'],imax:['imax','maxinputcurrent','impptmax','inputcurrent'],isc:['isc','maxisc','iscmax'],pvRec:['pvrec','maxpv','pvmax','maxpvpower'],eff:['eff','efficiency'],
      bvMin:['bvmin','batvmin','batteryvmin'],bvMax:['bvmax','batvmax','batteryvmax'],bchg:['bchg','chargekw','maxcharge'],bdis:['bdis','dischargekw','maxdischarge'],backupKw:['backupkw','epskw','backuppower'],note:['note','หมายเหตุ']}
  },
  batteries:{
    title:'แบตเตอรี่',one:'แบต',
    fields:[
      ['brand','ยี่ห้อ','t',''],['model','รุ่น','t',''],
      ['chem','ชนิดเซลล์','s','LiFePO4',[['LiFePO4','LiFePO4'],['Li-ion','Li-ion (NMC)'],['Lead','ตะกั่วกรด (AGM/Gel)'],['Other','อื่นๆ']]],
      ['v','แรงดันต่อลูก (V)','n',0],['ah','ความจุต่อลูก (Ah)','n',0],['dod','ใช้ได้ (DoD %)','n',90],['rt','ประสิทธิภาพชาร์จ-จ่าย (%)','n',95],['maxC','กระแสสูงสุด (C) ใช้เมื่อไม่ได้ใส่แอมป์','n',0.5],['maxChg','กระแสชาร์จสูงสุดต่อลูก (A)','n',0],['maxDis','กระแสจ่ายสูงสุดต่อลูก (A)','n',0],['isc','กระแสลัดวงจรสูงสุดต่อลูก (A)','n',0],
      ['v3','แรงดันเมื่อใช้กับอินเวอร์เตอร์ 3 เฟส (V) 0 = เท่าเดิม','n',0],['maxS','ต่ออนุกรมได้สูงสุด (0 = ไม่จำกัด)','n',0],['maxP','ต่อขนานได้สูงสุด (0 = ไม่จำกัด)','n',0],
      ['compat','ใช้ได้เฉพาะอินเวอร์เตอร์ยี่ห้อ (ว่าง = ทุกยี่ห้อ)','t',''],
      ['note','หมายเหตุ','t','']
    ],
    req:['brand','model','v','ah'],
    alias:{brand:['brand','ยี่ห้อ'],model:['model','รุ่น'],chem:['chem','chemistry','ชนิด','type'],v:['v','voltage','nominalvoltage','แรงดัน','vnom'],ah:['ah','capacity','ความจุ'],dod:['dod','depthofdischarge'],rt:['rt','roundtrip','efficiency','eff'],maxC:['maxc','crate','c'],maxChg:['maxchg','maxchargecurrent','chargecurrent','imaxcharge'],maxDis:['maxdis','maxdischargecurrent','dischargecurrent','imaxdischarge'],isc:['isc','shortcircuitcurrent','shortcircuit','ishort'],v3:['v3','v3p','voltage3phase'],maxS:['maxs','maxseries'],maxP:['maxp','maxparallel'],compat:['compat','compatible','inverterbrand'],kwh:['kwh','energy','ขนาด'],note:['note','หมายเหตุ']}
  }
};
const KIND_ORDER=['panels','inverters','batteries'];

const slug=s=>String(s||'').toLowerCase().replace(/[^a-z0-9ก-๙]+/g,'-').replace(/^-|-$/g,'');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>{const n=typeof v==='number'?v:parseFloat(String(v).replace(/,/g,''));return isFinite(n)?n:NaN};

/* ---- built-in models from manufacturer datasheets (ship with the site, same on every computer) ----
   Add new datasheet models here, commit and push: GitHub Pages serves them to every device.
   eff = European weighted efficiency. phase '3' = three-phase AC, asym '1' = each phase can deliver a different power, bph = backup port phases. */
const BUILTIN=(()=>{
  const inv=[],bat=[];
  const hw=(model,o)=>inv.push(Object.assign({id:slug('huawei '+model),brand:'Huawei',model,builtin:1},o));
  // Solis S6-EH1P(6-8)K-L-PLUS / S6-EH1P10K-L-PLUS(21A): single-phase low-voltage hybrid (on/off-grid), Thai flyer
  [[6,16,20,12000,1],[8,32,40,16000,2],[10,42,48,20000,2]].forEach(([k,im,sc,rec,ns])=>inv.push({id:slug(`solis s6-eh1p${k}k-l-plus`),brand:'Solis',model:`S6-EH1P${k}K-L-PLUS${k===10?' (21A)':''}`,type:'hybrid',phase:'1',
    pac:k*1000,vmax:500,lo:90,hi:435,start:90,imax:im,isc:sc,pvRec:rec,eff:96.1,bvMin:40,bvMax:60,bchg:k,bdis:k,backupKw:k,builtin:1,
    note:`Hybrid 1 เฟส On/Off-grid แบตแรงดันต่ำ 40–60 V (ลิเธียม/ตะกั่วกรด, CAN/RS485) ชาร์จ/จ่าย ${k} kW · 2 MPPT ${ns} สตริงต่อ MPPT กระแสต่ออินพุต ${k===10?21:16} A · มีพอร์ต GEN · สลับไปไฟสำรอง <10 ms · โอเวอร์โหลด 200% 10 วินาที · ขนานได้ 6 เครื่อง · eff สูงสุด 96.2%`}));
  // Deye SUN-M130/160/180/200G4-EU-Q0: user manual 2024-06 (instructions_sun-m130-200g4-eu-q0eu_240622): 4 MPPT x 1 module, Vmax 60 V, start 20 V,
  //   MPPT 25-55 V, 15 A operating / 22.5 A Isc per input, 1 mm² AC lead, max units per branch for a 40 A breaker 5/4/3/3, DC cable < 3 m.
  //   SUN-M220G4: Deye datasheet 2025-08 (18 A / Isc 27 A per input).
  [[130,1300,460,5,6,15,22.5,'29'],[160,1600,560,4,7.3,15,22.5,'31.5'],[180,1800,630,3,8.2,15,22.5,'33'],[200,2000,700,3,9.1,15,22.5,'36.5'],[220,2200,770,3,10,18,27,'']].forEach(([m,w,mod,br,ia,im,sc,fl])=>inv.push({id:slug(`deye sun-m${m}g4-eu-q0`),brand:'Deye',model:`SUN-M${m}G4-EU-Q0 (micro ${w} W)`,type:'on-grid',phase:'1',
    pac:w,iac:ia,micro:'1',brMax:br,brBrk:40,nmppt:4,vmax:60,lo:25,hi:55,start:20,imax:im,isc:sc,pvRec:mod*4,eff:96,builtin:1,
    note:`ไมโครอินเวอร์เตอร์ 1 เฟส 220/230 V (L+N+PE) · 4 MPPT ช่องละ 1 แผง (แผง 210–${mod} W) · กระแสเข้า ${im} A / Isc ${sc} A ต่อช่อง${fl?` · MPPT เต็มกำลัง ${fl}–55 V`:''} · ต่อพ่วงได้ ${br} ตัวต่อสายย่อย (เบรกเกอร์ 40 A) · สาย DC แผงถึงไมโครยาวไม่เกิน 3 m · eff สูงสุด 96.5% ยุโรป 96.0% · IP67 · WiFi ในตัว · ${m===220?'ดาต้าชีต Deye 2025-08':'คู่มือ Deye 2024-06'}`}));
  // SUN2000-5/8/10KTL-M0: three-phase on-grid, no battery port
  // 6KTL-M0 from user manual SUN2000-(5KTL,6KTL)-M0 Issue 03 (2019): full-load MPPT 285–850 V
  [[5,98.4,97.5,7500],[6,98.6,97.7,9000],[8,98.6,98.0,12000],[10,98.6,98.1,15000]].forEach(([k,mx,eu,rec])=>hw(`SUN2000-${k}KTL-M0`,{type:'on-grid',phase:'3',asym:'0',pac:k*1000,vmax:1100,lo:140,hi:980,start:200,imax:11,isc:15,pvRec:rec,eff:eu,
    note:`3 เฟส 380/400 V · 2 MPPT (1 สตริง/MPPT) · eff สูงสุด ${mx}% · PV แนะนำใช้ค่าเดียวกับรุ่น M1 (ดาต้าชีต M0 ไม่ระบุ)`}));
  // SUN2000-3..10KTL-M1: three-phase hybrid, HV battery. User manual Issue 28 (2026-03): battery 600–1100 V, 16.7 A; input 11 A/13.5 A per MPPT by nameplate
  [[3,98.2,96.7,4500,3.3],[4,98.3,97.1,6000,4.4],[5,98.4,97.5,7500,5.5],[6,98.6,97.7,9000,6.6],[8,98.6,98.0,12000,8.8],[10,98.6,98.1,15000,10]].forEach(([k,mx,eu,rec,dis])=>hw(`SUN2000-${k}KTL-M1`,{type:'hybrid',phase:'3',asym:'0',bph:'1',pac:k*1000,vmax:1100,lo:140,hi:980,start:200,imax:11,isc:15,pvRec:rec,eff:eu,
    bvMin:600,bvMax:1100,bchg:10,bdis:dis,backupKw:3.3,
    note:`3 เฟส 380/400 V · กระแสเข้า 11 A หรือ 13.5 A ต่อ MPPT ตามป้ายเครื่อง · MPPT ละไม่เกิน 8.8 kW · แบตแรงดันสูง 600–1100 V (Huawei LUNA2000-S0 ทำงานที่ 600 V) ต่อได้สูงสุด 2 ชุด แบต 51.2 V ใช้ไม่ได้ · Backup 1 เฟส 3.3 kVA ผ่าน Backup Box-B1 · จ่ายเท่ากันทุกเฟส · eff สูงสุด ${mx}%`}));
  // SUN2000-2..6KTL-L1: single-phase hybrid
  [[2,98.2,96.7,3000,2.2,2],[3,98.3,97.3,4500,3.3,3],[3.68,98.4,97.3,5520,3.68,3.68],[4,98.4,97.5,6000,4.4,4.4],[4.6,98.4,97.7,6900,4.6,5],[5,98.4,97.8,7500,5,5.5],[6,98.4,97.8,9000,5,6]]
    .forEach(([k,mx,eu,rec,dis,va])=>hw(`SUN2000-${k}KTL-L1`,{type:'hybrid',phase:'1',pac:k*1000,vmax:600,lo:90,hi:560,start:100,imax:12.5,isc:18,pvRec:rec,eff:eu,
    bvMin:350,bvMax:560,bchg:5,bdis:dis,backupKw:Math.min(k,5),
    note:`1 เฟส 220/230 V · S max ${va} kVA · แบตแรงดันสูง 350–560 V (Huawei LUNA2000-S0 ทำงานที่ 450 V) ต่อได้สูงสุด 2 ชุด แบต 51.2 V ใช้ไม่ได้ · Backup ผ่าน Backup Box-B0 กำลังตามคู่มือ LUNA2000 · eff สูงสุด ${mx}%`}));
  // SUN2000-3..6K-LB0: single-phase hybrid (new series). Datasheet 01-202502 + user manual Issue 07 (2026-06): 600 V, MPPT 40–560 V, start 50 V,
  //   16 A / Isc 20 A per MPPT; battery LUNA2000-5/10/15-S0 or 7/14/21-S1, 350–560 V, 16.5 A, charge 6 kW, discharge = max apparent power;
  //   backup via SmartGuard-63A-S0; meter DDSU666-H / DTSU666-H for zero export
  [[3,96.6,4500,3300,3],[3.68,96.8,5520,3680,3.68],[4,96.8,6000,4400,4],[4.6,97.0,6900,5000,4.6],[5,97.1,7500,5500,5],[6,97.2,9000,6600,6]]
    .forEach(([k,eu,rec,pmax,off])=>hw(`SUN2000-${k}K-LB0`,{type:'hybrid',phase:'1',pac:k*1000,vmax:600,lo:40,hi:560,start:50,imax:16,isc:20,pvRec:rec,eff:eu,
    bvMin:350,bvMax:560,bchg:6,bdis:[3300,3680,4400,4600,5500,6600][[3,3.68,4,4.6,5,6].indexOf(k)]/1000,backupKw:off,
    note:`1 เฟส 220/230/240 V รุ่นใหม่ · MPPT 40–560 V เริ่มทำงาน 50 V · 16 A / Isc 20 A ต่อ MPPT · S สูงสุด ${pmax} VA · แบต LUNA2000-5/10/15-S0 หรือ LUNA2000-7/14/21-S1 (350–560 V, 16.5 A) ชาร์จ 6 kW · ชาร์จจากกริดได้ · Backup ผ่าน SmartGuard-63A-S0 · AFCI · ต่อ optimizer ได้ · Zero export ใช้มิเตอร์ DDSU666-H / DTSU666-H · มาตรฐานกริดในดาต้าชีตยังไม่มี PEA/MEA (ตรวจกับตัวแทน) · eff สูงสุด 97.8% · ดาต้าชีต 01-202502`}));
  // Deye SUN-3..6K-SG04LP1-EU-SM2: single-phase low-voltage hybrid (48 V; 3K-24 = 24 V). User manual 2026-01: PV 500 V, start 125 V, MPPT 150–425 V,
  //   18 A / Isc 27 A per MPPT (3K: 1 MPPT), charge/discharge 70/90/120/135 A (24 V model 140 A), lead-acid or Li-ion, off-grid peak 2× 10 s
  [['SUN-3K-SG04LP1-24-EU-SM1',3000,3300,1,140,24,4800],['SUN-3K-SG04LP1-EU-SM1',3000,3300,1,70,48,4800],['SUN-3.6K-SG04LP1-EU-SM2',3600,3960,2,90,48,5760],['SUN-5K-SG04LP1-EU-SM2',5000,5500,2,120,48,8000],['SUN-6K-SG04LP1-EU-SM2',6000,6600,2,135,48,9600]]
    .forEach(([m,p,s,nm,ib,bv,rec])=>inv.push({id:slug('deye '+m),brand:'Deye',model:m,type:'hybrid',phase:'1',pac:p,nmppt:nm,vmax:500,lo:150,hi:425,start:125,imax:18,isc:27,pvRec:rec,eff:96.5,
    bvMin:bv===24?20:40,bvMax:bv===24?30:60,bchg:Math.round(ib*bv/100)/10,bdis:Math.round(ib*bv/100)/10,backupKw:p/1000,builtin:1,
    note:`Hybrid 1 เฟส 220/230 V แบตแรงดันต่ำ ${bv===24?'20–30':'40–60'} V (ลิเธียมหรือตะกั่วกรด) ชาร์จ/จ่าย ${ib} A · ${nm} MPPT 18 A / Isc 27 A ต่อ MPPT · MPPT 150–425 V (เต็มกำลัง 300–425 V) · S สูงสุด ${s} VA · ออฟกริดจ่ายพีค 2 เท่า 10 วินาที · ไฟผ่านจากกริดถึงโหลดสูงสุด ${p<=3000?35:40} A · eff สูงสุด 97.6% · CT หรือมิเตอร์ RS485 · คู่มือ Deye 2026-01`}));
  // SUN2000-5..12K-MAP0: checked against FusionSolar datasheet 02-202406 (all values match) three-phase hybrid, whole-home backup with SmartGuard
  [[5,98.4,97.5,9000,5.5],[6,98.6,97.7,11000,6.6],[8,98.6,98.0,14600,8.8],[10,98.6,98.1,18000,11],[12,98.6,98.2,22000,12]]
    .forEach(([k,mx,eu,rec,dis])=>hw(`SUN2000-${k}K-MAP0`,{type:'hybrid',phase:'3',asym:'1',bph:'3',pac:k*1000,vmax:1100,lo:160,hi:1000,start:160,imax:16,isc:22,pvRec:rec,eff:eu,
    bvMin:600,bvMax:980,bchg:12,bdis:dis,backupKw:k,
    note:`3 เฟส 380/400 V รองรับโหลดไม่สมดุล 100% · แบต LUNA2000-5/10/15-S0 หรือ LUNA2000-7/14/21-S1 แรงดัน 600–980 V กระแส 20 A แบต 51.2 V ใช้ไม่ได้ · ชาร์จจากกริดได้ · Backup ทั้งบ้านผ่าน SmartGuard-63A-T0 สลับ ≤20 ms รับโหลดเกิน 150% 1 นาที (3 เฟส) และ 200% 10 วินาที · AFCI · มาตรฐาน MEA/PEA · eff สูงสุด ${mx}% · ดาต้าชีต 02-202406`}));
  const b=(brand,model,o)=>bat.push(Object.assign({id:slug(brand+' '+model),brand,model,chem:'LiFePO4',rt:95,builtin:1},o));
  // Huawei LUNA2000-(5-30)-S0: power control module LUNA2000-5KW-C0 (5 kW, DC/DC) + 1-3 battery modules LUNA2000-5-E0 (5 kWh each)
  [1,2,3].forEach(n=>b('Huawei',`LUNA2000-${5*n}-S0`,{chem:'Li-ion',v:450,v3:600,ah:Math.round(5*n*1000/450*100)/100,dod:95,maxChg:11.11,maxDis:11.11,maxS:1,maxP:2,compat:'Huawei',
    note:`LUNA2000-5KW-C0 (power module ชาร์จ/จ่าย 5 kW) + LUNA2000-5-E0 × ${n} (ก้อนละ 5 kWh) · ทำงาน 450 V กับอินเวอร์เตอร์ 1 เฟส (350–560 V) / 600 V กับ 3 เฟส (600–980 V) · ขนานได้ 2 ชุด รวมสูงสุด 30 kWh · ตัดจ่ายที่ SOC 5% (ค่าเริ่มต้น) · ใช้กับอินเวอร์เตอร์ Huawei เท่านั้น`}));
  // Huawei LUNA2000-7/14/21-S1: power module LUNA2000-10KW-C1 + 1-3 battery modules LUNA2000-7-E1 (6.9 kWh, LFP, 100% DoD). Datasheet 01-202411
  [1,2,3].forEach(n=>b('Huawei',`LUNA2000-${7*n}-S1`,{chem:'LiFePO4',v:450,v3:600,ah:Math.round(6.9*n*1000/450*100)/100,dod:100,maxChg:Math.round(3500*n/450*100)/100,maxDis:Math.round(3500*n/450*100)/100,maxS:1,maxP:2,compat:'Huawei',
    note:`LUNA2000-10KW-C1 + LUNA2000-7-E1 × ${n} (ก้อนละ 6.9 kWh) · ใช้ได้ ${(6.9*n).toFixed(1)} kWh (DoD 100%) · ชาร์จ/จ่ายสูงสุด ${3.5*n} kW · ทำงาน 350–560 V กับอินเวอร์เตอร์ 1 เฟส / 600–980 V กับ 3 เฟส · LiFePO4 · IP66 · ใช้กับ SUN2000-KTL-M1, MAP0, LC0, MB0, L1 (ดาต้าชีต S1) และ LB0 (ดาต้าชีต LB0 01-202502) · ขนานได้สูงสุด 4 ชุดเฉพาะ MB0 · ดาต้าชีต 01-202411`}));
  b('Dyness','PowerBrick 14.3 kWh',{v:51.2,ah:280,dod:95,maxChg:200,maxDis:200,isc:0,note:'แนะนำชาร์จ/จ่าย 140 A (0.5C) · จ่ายพีค 300 A 2 นาที · ขนานได้ 50 ลูก · CAN/RS485 · IP20'});
  b('Solis','IntelliHome 5 kWh (OD)',{v:51.2,ah:100,dod:100,maxChg:50,maxDis:100,note:'แรงดันทำงาน 44.8–57.6 V · แนะนำ 0.5C · ขนานได้ 8 ลูก · IP66 · ดาต้าชีตฉบับ Preliminary'});
  b('Solis','IntelliHome 10 kWh (OD)',{v:51.2,ah:200,dod:100,maxChg:100,maxDis:200,note:'ความจุคิดจาก 10 kWh ÷ 51.2 V (ดาต้าชีตระบุเซลล์ 100 Ah) · แรงดัน 44.8–57.6 V · ขนานได้ 8 ลูก · Preliminary'});
  b('Solis','IntelliHome 16 kWh (OD)',{v:51.2,ah:314,dod:100,maxChg:157,maxDis:157,note:'แรงดัน 44.8–57.6 V · แนะนำ 0.5C · ขนานได้ 8 ลูก · IP66 · Preliminary'});
  b('LVTOPSUN','LVTS-512314-G4 16 kWh',{v:51.2,ah:314,dod:90,maxChg:150,maxDis:200,isc:540,note:'16.07 kWh · ชาร์จ 7.68 kW / จ่าย 10.24 kW · ขนานได้ 63 ลูก · ตั้งพื้นมีล้อ · IP65 · ประกัน 10 ปี'});
  b('LVTOPSUN','LVTS-512314-G3 16 kWh',{v:51.2,ah:314,dod:90,maxChg:150,maxDis:200,isc:540,note:'16.08 kWh · แรงดันชาร์จ 55.68–56.16 V จ่าย 45.6–56.16 V · ขนานได้ 63 ลูก · จอสัมผัส · IP20 · ประกัน 5 ปี'});
  // AIKO Stellar 3N+72 (AIKO-A-MDE72Dw), N-type ABC, dual glass. NOCT temperature derived from the datasheet's NOCT Pmax (493 W of 650 W at 800 W/m², 20 °C ambient)
  const pan=[];
  [[650,54.00,45.30,15.06,14.35,24.1],[655,54.10,45.40,15.12,14.43,24.2],[660,54.20,45.50,15.18,14.51,24.4],[665,54.40,45.60,15.24,14.59,24.6],[670,54.60,45.70,15.30,14.67,24.8],[675,54.80,45.80,15.36,14.74,25.0]]
    .forEach(([w,voc,vmp,isc,imp,eff])=>pan.push({id:slug('aiko a'+w+' mde72dw'),brand:'AIKO',model:`A${w}-MDE72Dw (${w} W)`,pmax:w,voc,vmp,isc,imp,kVoc:-0.22,kPmax:-0.26,kIsc:0.05,noct:45,builtin:1,
      note:`Stellar 3N+72 · N-type ABC 144 เซลล์ · ประสิทธิภาพ ${eff}% · กระจกสองหน้า 2382×1134×30 mm 33 kg · ระบบสูงสุด 1500 V · ฟิวส์อนุกรมสูงสุด 30 A · NOCT 45 °C คำนวณจากค่า NOCT ในดาต้าชีต`}));
  // Trina Vertex N TSM-NEG21C.20 (695-720 W), N-type TOPCon bifacial dual glass, front-side STC values; NOCT 43 °C from the datasheet
  [[695,48.3,40.3,18.28,17.25,22.4],[700,48.6,40.5,18.32,17.29,22.5],[705,48.8,40.7,18.36,17.33,22.7],[710,49.0,40.9,18.40,17.36,22.9],[715,49.2,41.1,18.44,17.40,23.0],[720,49.4,41.3,18.49,17.44,23.2]]
    .forEach(([w,voc,vmp,isc,imp,eff])=>pan.push({id:slug('trina tsm-'+w+'neg21c.20'),brand:'Trina Solar',model:`TSM-${w}NEG21C.20 Vertex N (${w} W)`,pmax:w,voc,vmp,isc,imp,kVoc:-0.24,kPmax:-0.29,kIsc:0.04,noct:43,builtin:1,
      note:`N-type TOPCon สองหน้า 132 เซลล์ · ประสิทธิภาพ ${eff}% · bifaciality 80±5% (ค่าที่ใช้เป็นด้านหน้าอย่างเดียว ด้านหลังเพิ่มได้ 5–10%) · 2384×1303×33 mm 38.3 kg · ระบบสูงสุด 1500 V · ฟิวส์อนุกรมสูงสุด 35 A`}));
  // Solis S6-GR1P(2.5-6)K-S: single-phase on-grid, datasheet V1.9 2024-10 (6K-S is in the default list). 550 V, 16 A / Isc 22 A per MPPT, 2 MPPT.
  //   Two-column rows read as 2.5–3.6K: rated 250 V, start 60 V, MPPT 50–550 V; 4–6K: 330 V, 100 V, 90–550 V; EU eff grouped (check the datasheet)
  [[2.5,3750,96.5],[3,4500,96.5],[3.6,5400,96.6],[4,6000,97.1],[4.6,6900,97.1],[5,7500,97.1]].forEach(([k,rec,eu])=>{const lowV=k<4;inv.push({id:slug(`solis s6-gr1p${k}k-s`),brand:'Solis',model:`S6-GR1P${k}K-S`,type:'on-grid',phase:'1',
    pac:k*1000,vmax:550,lo:lowV?50:90,hi:550,start:lowV?60:100,imax:16,isc:22,pvRec:rec,eff:eu,builtin:1,
    note:`On-grid 1 เฟส 220/230 V · 2 MPPT 16 A / Isc 22 A · MPPT ${lowV?'50':'90'}–550 V เริ่มทำงาน ${lowV?60:100} V · กระแสออกสูงสุด ${(k*1000/220).toFixed(1)} A · ไม่มีช่องแบต · ดาต้าชีต S6-GR1P(2.5-6)K-S 2024-10 (ค่าช่วงแรงดันและ eff แบ่งกลุ่มตามการอ่านตาราง ควรตรวจซ้ำ)`})});
  // Solis S6-EH3P(5-10)K-H: three-phase hybrid, HV battery 120–600 V. Datasheet EU V1.8 2024-10: 1000 V, MPPT 200–850 V, start 160 V, 16 A / Isc 24 A per MPPT,
  //   charge/discharge 25 A (5–6K) / 50 A (8–10K) read from a two-value row; MPPT 3 (5–8K) / 4 (10K) read from a two-value row (check the datasheet)
  [[5,10000,96.77,25,3,8],[6,12000,97.10,25,3,9.6],[8,16000,97.41,50,3,12.8],[10,20000,97.51,50,4,16]].forEach(([k,rec,eu,ib,nm,pk])=>inv.push({id:slug(`solis s6-eh3p${k}k-h`),brand:'Solis',model:`S6-EH3P${k}K-H`,type:'hybrid',phase:'3',asym:'0',bph:'3',
    pac:k*1000,nmppt:nm,vmax:1000,lo:200,hi:850,start:160,imax:16,isc:24,pvRec:rec,eff:eu,bvMin:120,bvMax:600,bchg:k,bdis:k,backupKw:k,builtin:1,
    note:`Hybrid 3 เฟส 380/400 V แบตแรงดันสูง 120–600 V กระแสแบต ${ib} A ชาร์จ/จ่าย ${k} kW · ${nm} MPPT 16 A / Isc 24 A · MPPT 200–850 V · Backup ${k} kW (สูงสุด ${pk} kVA 60 วินาที) · แบต 48 V ใช้ไม่ได้ · ดาต้าชีต EU 2024-10 (จำนวน MPPT และกระแสแบตตีความจากตาราง ควรตรวจซ้ำ)`}));
  return{inverters:inv,batteries:bat,panels:pan};
})();

const DEFAULT_CAT=()=>({
  panels:[{id:'longi-hi-mo-x10-650',brand:'LONGi',model:'Hi-MO X10 650 W',pmax:650,voc:53.9,vmp:44.56,isc:15.29,imp:14.59,kVoc:-0.20,kPmax:-0.26,kIsc:0.05,noct:43,note:'NOCT 43°C เป็นค่าสมมติ ตรวจกับแผ่นข้อมูลจริง'}].concat(BUILTIN.panels),
  inverters:[
    {id:'solis-s6-gr1p6k-s',brand:'Solis',model:'S6-GR1P6K-S',type:'on-grid',pac:6000,vmax:550,lo:90,hi:550,start:100,imax:16,isc:22,pvRec:9000,eff:97,note:''},
    {id:'solis-s6-gr1p6k',brand:'Solis',model:'S6-GR1P6K',type:'on-grid',pac:6000,vmax:600,lo:90,hi:520,start:120,imax:14,isc:22,pvRec:9000,eff:97,note:''},
    {id:'example-hybrid-6k',brand:'ตัวอย่าง',model:'Hybrid 6 kW (ค่าสมมติ)',type:'hybrid',pac:6000,vmax:600,lo:90,hi:520,start:120,imax:16,isc:22,pvRec:9000,eff:97,bvMin:40,bvMax:60,bchg:6,bdis:6,backupKw:6,note:'ค่าตัวอย่างเพื่อฝึกใช้ ไม่ใช่รุ่นจริง นำเข้ารุ่นจริงของคุณแทนได้'}
 
  ].concat(BUILTIN.inverters),
  batteries:[
    {id:'example-lfp-51v-100ah',brand:'ตัวอย่าง',model:'LiFePO4 51.2 V 100 Ah (ค่าสมมติ)',chem:'LiFePO4',v:51.2,ah:100,dod:90,rt:95,maxC:0.5,note:'ค่าตัวอย่างเพื่อฝึกใช้ ไม่ใช่รุ่นจริง'}
  ].concat(BUILTIN.batteries)
});
let CAT=DEFAULT_CAT();
const ACT={panel:'longi-hi-mo-x10-650',inv:'solis-s6-gr1p6k-s',bat:'example-lfp-51v-100ah'};
const BANK={s:1,p:1};


/* active selections */
const ACTKEY={panels:'panel',inverters:'inv',batteries:'bat'};
function pick(kind){const L=CAT[kind];return L.find(x=>x.id===ACT[ACTKEY[kind]])||L[0]||null}
let PV;
function curPanel(){return pick('panels')||DEFAULT_CAT().panels[0]}
function curInv(){
  const x=pick('inverters')||DEFAULT_CAT().inverters[0];
  return Object.assign({},x,{name:(x.brand+' '+x.model).trim(),eff:x.eff||97});
}
function curBat(){return pick('batteries')}
function batCompat(b,I){
  I=I||curInv();if(!b)return true;
  const ib=String(I.brand||'').toLowerCase();
  if(b.compat)return ib===String(b.compat).toLowerCase();
  if(ib==='huawei')return false;/* Huawei inverters only take LUNA2000 batteries */
  /* battery voltage: some series count of this battery must land inside the inverter's battery window */
  const lo=+I.bvMin||0,hi=+I.bvMax||0;
  if(hi>0){const v=(isPh3(I)&&+b.v3>0)?+b.v3:+b.v||0,ms=+b.maxS>0?+b.maxS:1;/* series stacking only when the battery datasheet allows it */
    if(v>0){let ok=false;for(let s=1;s<=ms;s++){const V=v*s;if(V>=lo-0.5&&V<=hi+0.5){ok=true;break}}if(!ok)return false}}
  return true;
}
const batCompatMsg=(b,I)=>{I=I||curInv();return b.compat?`แบต ${b.brand} ${b.model} ใช้ได้กับอินเวอร์เตอร์ ${b.compat} เท่านั้น (สื่อสารและควบคุมผ่าน power module ของแบต)`:`อินเวอร์เตอร์ ${I.brand} ${I.model} รับเฉพาะแบต Huawei LUNA2000 (แรงดันสูง สื่อสาร RS485 กับอินเวอร์เตอร์) เลือกแบต LUNA2000 ที่หัวข้อแบตเตอรี่`};
/* when the inverter changes, keep a battery that works with it (remembered per group) */
let LAST_INV=null;const BAT_MEM={};
function autoBat(){
  const I=curInv();
  if(LAST_INV===I.id)return;LAST_INV=I.id;
  const b=curBat(),grp=String(I.brand).toLowerCase()==='huawei'?'hw':'x';
  if(b&&batCompat(b,I)){BAT_MEM[grp]=b.id;return}
  const m=CAT.batteries.find(x=>x.id===BAT_MEM[grp]&&batCompat(x,I))||CAT.batteries.find(x=>x.id==='huawei-luna2000-10-s0'&&batCompat(x,I))||CAT.batteries.find(x=>batCompat(x,I));
  if(m){ACT.bat=m.id;BAT_MEM[grp]=m.id;if(m.maxS>0)BANK.s=Math.min(BANK.s,m.maxS);if(m.maxP>0)BANK.p=Math.min(BANK.p,m.maxP)}
}
const isPh3=I=>String((I||curInv()).phase)==='3';
const bkPh3=I=>{I=I||curInv();return isPh3(I)&&String(I.bph||I.phase)==='3'};
function applyActive(){const p=curPanel();PV=Object.assign({},p,{name:(p.brand+' '+p.model).trim(),noct:p.noct||43})}
applyActive();
function bankInfo(){
  const b=curBat();if(!b)return null;
  let s=Math.max(1,BANK.s|0),p=Math.max(1,BANK.p|0);
  if(b.maxS>0)s=Math.min(s,b.maxS);if(b.maxP>0)p=Math.min(p,b.maxP);
  /* packs with a DC/DC power module (Huawei LUNA) run at a different voltage on three-phase inverters; energy and power stay the same */
  const vu=b.v3>0&&isPh3(curInv())?b.v3:b.v,k=b.v/vu;
  const V=s*vu,Ah=p*b.ah*k,kwh=V*Ah/1000;
  const mc=b.maxC||0.5;
  const chgA=b.maxChg>0?b.maxChg*k*p:mc*Ah,disA=b.maxDis>0?b.maxDis*k*p:mc*Ah;
  return{b,s,p,n:s*p,V,vu,Ah,kwh,usable:kwh*(b.dod||90)/100,rt:(b.rt||95)/100,maxC:mc,chgA,disA,chgKw:V*chgA/1000,disKw:V*disA/1000,scA:b.isc>0?b.isc*p:0};
}

/* ---- import / export ---- */
function normKind(v){
  const t=String(v||'').toLowerCase().replace(/[^a-z]/g,'');
  if(t.includes('hybrid'))return'hybrid';
  if(t.includes('off'))return'off-grid';
  if(t.includes('grid')||t.includes('on'))return'on-grid';
  return'';
}
function normalizeItem(kind,raw){
  const sc=SCHEMA[kind],o={},why=[];
  const g=k=>{
    if(raw[k]!==undefined&&raw[k]!=='')return raw[k];
    const low={};Object.keys(raw).forEach(q=>low[q.toLowerCase().replace(/[^a-z0-9ก-๙()]/g,'')]=raw[q]);
    for(const a of (sc.alias[k]||[k])){const v=low[a.toLowerCase().replace(/[^a-z0-9ก-๙()]/g,'')];if(v!==undefined&&v!=='')return v}
    return undefined;
  };
  sc.fields.forEach(([k,label,ty,def,opts])=>{
    let v=g(k);
    if(ty==='n'){v=v===undefined?NaN:num(v);o[k]=isNaN(v)?(sc.req.includes(k)?NaN:def):v}
    else if(ty==='s'){
      if(k==='type')v=normKind(v)||def;else{const m=(opts||[]).find(x=>String(x[0]).toLowerCase()===String(v).toLowerCase());v=m?m[0]:def}
      o[k]=v;
    }else o[k]=v==null?def:String(v).trim();
  });
  if(kind==='batteries'&&(isNaN(o.ah)||!o.ah)){const kw=num(g('kwh'));if(!isNaN(kw)&&o.v>0)o.ah=Math.round(kw*1000/o.v*10)/10}
  sc.req.forEach(k=>{const f=sc.fields.find(x=>x[0]===k);if(f[2]==='n'?!(o[k]>0):!o[k])why.push(f[1])});
  if(kind==='panels'&&!why.length&&o.vmp>=o.voc)why.push('Vmp ต้องน้อยกว่า Voc');
  if(kind==='inverters'&&!why.length&&o.lo>=o.hi)why.push('ช่วง MPPT ไม่ถูกต้อง');
  o.id=String(raw.id||'').trim()||slug(o.brand+' '+o.model)||('x'+Date.now());
  if(raw.builtin)o.builtin=1;
  return{item:o,why};
}
function parseCSV(text){
  const lines=text.replace(/\r/g,'').split('\n').filter(l=>l.trim());
  if(lines.length<2)return[];
  const d=[',','\t',';'].map(c=>[c,lines[0].split(c).length]).sort((a,b)=>b[1]-a[1])[0][0];
  const split=l=>{const r=[];let c='',q=false;for(let i=0;i<l.length;i++){const ch=l[i];if(q){if(ch==='"'){if(l[i+1]==='"'){c+='"';i++}else q=false}else c+=ch}else if(ch==='"')q=true;else if(ch===d){r.push(c);c=''}else c+=ch}r.push(c);return r.map(x=>x.trim())};
  const head=split(lines[0]);
  return lines.slice(1).map(l=>{const v=split(l),o={};head.forEach((h,i)=>{if(h)o[h]=v[i]});return o});
}
/* returns {added, skipped:[{row,why}], error} and merges into CAT */
function importText(text,kind){
  text=(text||'').trim();
  if(!text)return{error:'ยังไม่มีข้อมูลให้นำเข้า'};
  let groups=[];
  if(text[0]==='{'||text[0]==='['){
    let j;try{j=JSON.parse(text)}catch(e){return{error:'อ่านไฟล์ JSON ไม่ได้: '+e.message}}
    if(Array.isArray(j))groups.push([kind,j]);
    else{
      const ks=KIND_ORDER.filter(k=>Array.isArray(j[k]));
      if(ks.length)ks.forEach(k=>groups.push([k,j[k]]));else groups.push([kind,[j]]);
    }
  }else groups.push([kind,parseCSV(text)]);
  let added=0,updated=0;const skipped=[];
  groups.forEach(([k,rows])=>{
    rows.forEach((r,i)=>{
      if(!r||typeof r!=='object'){skipped.push({row:i+1,why:'รูปแบบแถวไม่ถูกต้อง'});return}
      const {item,why}=normalizeItem(k,r);
      if(why.length){skipped.push({row:`${SCHEMA[k].title} แถว ${i+1}`,why:'ขาดหรือไม่ถูกต้อง: '+why.join(', ')});return}
      const ix=CAT[k].findIndex(x=>x.id===item.id);
      if(ix>=0){CAT[k][ix]=item;updated++}else{CAT[k].push(item);added++}
    });
  });
  if(!added&&!updated&&!skipped.length)return{error:'ไม่พบรายการในข้อมูลที่ใส่'};
  return{added,updated,skipped};
}
const SAMPLE={
  panels:'brand,model,pmax,voc,vmp,isc,imp,kVoc,kPmax,kIsc,noct\nBrandX,ABC-600,600,51.5,43.2,14.9,13.9,-0.25,-0.30,0.05,44',
  inverters:'brand,model,type,pac,vmax,lo,hi,start,imax,isc,eff,bvMin,bvMax,bchg,bdis,backupKw\nBrandY,HY-5K,hybrid,5000,600,90,520,120,16,22,97,40,60,5,5,5',
  batteries:'brand,model,chem,v,ah,dod,rt,maxChg,maxDis,isc\nBrandZ,LFP-5.12,LiFePO4,51.2,100,90,95,50,50,2000'
};
function exportJSON(){return JSON.stringify({panels:CAT.panels,inverters:CAT.inverters,batteries:CAT.batteries},null,1)}

/* ---- catalog UI (equipment tab) ---- */
const EQ={edit:{panels:null,inverters:null,batteries:null}};
/* teacher mode: adding, editing, deleting and importing equipment models is for the teacher only.
   The code is checked by the Apps Script web app (TEACHER_CODE); nothing secret is in this page.
   Catalog changes only ever affect the browser they are made in. */
const TEACH={on:false};
const tss={get:k=>{try{return sessionStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{v==null?sessionStorage.removeItem(k):sessionStorage.setItem(k,v)}catch(e){}}};
async function teachVerify(code,quiet){
  const CFG=window.APP_CONFIG||{},m=t=>{const e=document.getElementById('teachmsg');if(e&&!quiet){e.textContent=t;e.hidden=!t}};
  if(!CFG.SUBMIT_URL){m('ยังไม่ได้ตั้ง SUBMIT_URL ใน js/config.js จึงตรวจรหัสผู้สอนไม่ได้');return false}
  if(!code){m('กรอกรหัสผู้สอนก่อน');return false}
  m('กำลังตรวจรหัส…');
  try{
    const r=await fetch(CFG.SUBMIT_URL,{method:'POST',body:JSON.stringify({action:'tcheck',tcode:code}),redirect:'follow'}),j=await r.json();
    if(!j||!j.tcheck){m('Apps Script ยังเป็นโค้ดเวอร์ชันเก่า: วาง Code.gs ล่าสุด ตั้ง TEACHER_CODE แล้ว Deploy → New version');return false}
    if(!j.ok){m(j.error||'รหัสผู้สอนไม่ถูกต้อง');tss.set('pv.tcode',null);return false}
    TEACH.on=true;tss.set('pv.tcode',code);m('');teachSync();if(typeof accTeacher==='function')accTeacher(true);return true;
  }catch(e){m('เชื่อมต่อ Apps Script ไม่ได้ ตรวจอินเทอร์เน็ต');return false}
}
function teachSync(){
  const b=document.getElementById('teachbar');
  if(b)b.innerHTML=TEACH.on
    ?`<span class="tlab on">โหมดผู้สอน · เพิ่ม แก้ไข ลบ และนำเข้ารุ่นอุปกรณ์ได้</span><button class="btn" id="teachoff">ล็อก</button><span class="hint tight">การแก้ไขมีผลเฉพาะเบราว์เซอร์นี้ รุ่นที่ต้องการให้ทุกเครื่องเห็นต้องใส่ในโค้ดบน GitHub</span>`
    :`<span class="tlab">🔒 เพิ่ม แก้ไข ลบ และนำเข้ารุ่นอุปกรณ์ เฉพาะผู้สอน</span><input type="password" id="teachcode" placeholder="รหัสผู้สอน" aria-label="รหัสผู้สอน" autocomplete="current-password"><button class="btn" id="teachon">ปลดล็อกผู้สอน</button><span class="eqmsg" id="teachmsg" role="status" hidden></span>`;
  const p=document.querySelector('#tab-equip .pdfimp');if(p)p.hidden=!TEACH.on;
  KIND_ORDER.forEach(eqRender);
}
function initTeach(){
  const sec=document.getElementById('tab-equip');if(!sec)return;
  if(!document.getElementById('teachbar')){const d=document.createElement('div');d.id='teachbar';d.className='panelbox teachbar';const c=document.getElementById('cur-equip');(c||sec.querySelector('header')).after(d)}
  sec.addEventListener('click',e=>{
    if(e.target.id==='teachon')teachVerify(document.getElementById('teachcode').value.trim());
    else if(e.target.id==='teachoff'){TEACH.on=false;tss.set('pv.tcode',null);EQ.edit={panels:null,inverters:null,batteries:null};teachSync();if(typeof accTeacher==='function')accTeacher(false)}
  });
  sec.addEventListener('keydown',e=>{if(e.target.id==='teachcode'&&e.key==='Enter')teachVerify(e.target.value.trim())});
  teachSync();
  const saved=tss.get('pv.tcode');if(saved)teachVerify(saved,true);
}
function fmtSummary(kind,x){
  if(kind==='panels')return`${x.pmax} W · Voc ${x.voc} V · Vmp ${x.vmp} V · Isc ${x.isc} A`;
  if(kind==='inverters')return`${({'on-grid':'On-grid','hybrid':'Hybrid','off-grid':'Off-grid'})[x.type]||x.type} · ${x.pac/1000} kW · MPPT ${x.lo}–${x.hi} V`+(x.type!=='on-grid'&&x.bvMax?` · แบต ${x.bvMin}–${x.bvMax} V`:'');
  return`${x.chem} · ${x.v} V${x.v3>0?' / '+x.v3+' V (3 เฟส)':''} · ${x.ah} Ah · ${f(x.v*x.ah/1000,2)} kWh`;
}
function eqListHTML(kind){
  const key=ACTKEY[kind],sc=SCHEMA[kind];
  return CAT[kind].map(x=>{
    const on=(pick(kind)||{}).id===x.id;
    return`<li class="eqrow${on?' on':''}"><label class="eqpick"><input type="radio" name="act-${kind}" value="${esc(x.id)}" ${on?'checked':''} data-act="${kind}"><span><b>${esc(x.brand)} ${esc(x.model)}</b><small>${esc(fmtSummary(kind,x))}</small>${x.note?`<small class="nt">${esc(x.note)}</small>`:''}${kind==='batteries'&&!batCompat(x)?'<small class="nt bad">ใช้กับอินเวอร์เตอร์ที่เลือกไม่ได้</small>':''}</span></label>${TEACH.on?`<span class="eqbtn"><button class="btn sm" data-edit="${kind}" data-id="${esc(x.id)}">แก้ไข</button><button class="btn sm" data-del="${kind}" data-id="${esc(x.id)}" ${CAT[kind].length<2?'disabled':''}>ลบ</button></span>`:''}</li>`;
  }).join('');
}
function eqFormHTML(kind){
  const sc=SCHEMA[kind],cur=EQ.edit[kind],isNew=!cur;
  const val=k=>{const f0=sc.fields.find(x=>x[0]===k);return cur&&cur[k]!==undefined?cur[k]:f0[3]};
  const cells=sc.fields.map(([k,label,ty,def,opts,grp])=>{
    const req=sc.req.includes(k)?' *':'';
    if(ty==='s')return`<label>${label}<select data-f="${k}">${opts.map(o=>`<option value="${o[0]}" ${o[0]===val(k)?'selected':''}>${o[1]}</option>`).join('')}</select></label>`;
    if(ty==='n')return`<label>${label}${req}<input data-f="${k}" type="number" inputmode="decimal" step="any" value="${val(k)===0&&sc.req.includes(k)?'':val(k)}"></label>`;
    return`<label class="${k==='note'?'wide':''}">${label}${req}<input data-f="${k}" type="text" value="${esc(val(k))}"></label>`;
  }).join('');
  return`<div class="eqform" data-form="${kind}"><div class="eqgrid">${cells}</div><div class="eqact"><button class="btn pri" data-save="${kind}">${isNew?'เพิ่ม'+sc.one+'เข้าแคตตาล็อก':'บันทึกการแก้ไข'}</button>${isNew?'':`<button class="btn" data-cancel="${kind}">ยกเลิก</button>`}<span class="eqmsg" data-fmsg="${kind}" role="status"></span></div></div>`;
}
function bankHTML(){
  const bi=bankInfo(),b=bi&&bi.b;
  if(!b)return'<p class="hint">ยังไม่มีรุ่นแบตเตอรี่ในแคตตาล็อก</p>';
  const warn=[];
  const I=curInv();
  if(I.type!=='on-grid'&&I.bvMax&&(bi.V<I.bvMin||bi.V>I.bvMax))warn.push(`แรงดันชุดแบต ${f(bi.V,1)} V อยู่นอกช่วงแบตของอินเวอร์เตอร์ ${I.bvMin}–${I.bvMax} V`);
  if(I.type!=='on-grid'&&!batCompat(b,I))warn.push(batCompatMsg(b,I));
  if(b.maxS>0&&BANK.s>b.maxS||b.maxP>0&&BANK.p>b.maxP)warn.push(`รุ่นนี้ต่ออนุกรมได้ ${b.maxS||'ไม่จำกัด'} · ขนานได้ ${b.maxP||'ไม่จำกัด'} ชุด ระบบใช้ค่าสูงสุดที่ทำได้`);
  if(b.v3>0)warn.push(`แรงดันชุดขึ้นกับอินเวอร์เตอร์: ${b.v} V กับรุ่น 1 เฟส, ${b.v3} V กับรุ่น 3 เฟส (power module ปรับแรงดันเอง)`);
  if(I.type==='on-grid')warn.push('อินเวอร์เตอร์ที่เลือกเป็นแบบ On-grid ต่อแบตตรงไม่ได้ เลือกรุ่น Hybrid หรือ Off-grid ที่หัวข้ออินเวอร์เตอร์ก่อนจำลองการไหลของไฟ');
  return`<div class="row3"><label>ต่ออนุกรม (ลูก)<input id="bk-s" type="number" min="1" max="${b.maxS||32}" step="1" value="${bi.s}"></label><label>ต่อขนาน (ชุด)<input id="bk-p" type="number" min="1" max="${b.maxP||32}" step="1" value="${bi.p}"></label></div>
  <dl class="specs bk"><div><dt>จำนวนแบต</dt><dd>${bi.n} ลูก</dd></div><div><dt>แรงดันชุด</dt><dd>${f(bi.V,1)} V</dd></div><div><dt>ความจุชุด</dt><dd>${f(bi.Ah,0)} Ah</dd></div><div><dt>พลังงานรวม</dt><dd>${f(bi.kwh,2)} kWh</dd></div><div><dt>ใช้ได้จริง (DoD ${b.dod}%)</dt><dd>${f(bi.usable,2)} kWh</dd></div><div><dt>กระแสชาร์จสูงสุดของชุด</dt><dd>${f(bi.chgA,0)} A · ${f(bi.chgKw,1)} kW</dd></div><div><dt>กระแสจ่ายสูงสุดของชุด</dt><dd>${f(bi.disA,0)} A · ${f(bi.disKw,1)} kW</dd></div><div><dt>กระแสลัดวงจรสูงสุดของชุด</dt><dd>${bi.scA>0?f(bi.scA,0)+' A':'ไม่ระบุ'}</dd></div></dl>`+(warn.length?`<ul class="checks">${warn.map(w=>`<li><span class="b warn">!</span><span>${esc(w)}</span></li>`).join('')}</ul>`:'');
}
function eqRender(kind){
  const host=$('#eq-'+kind);if(!host)return;
  const sc=SCHEMA[kind];
  host.innerHTML=`<div class="panelbox eqbox">
    <ul class="eqlist">${eqListHTML(kind)}</ul>
    ${kind==='batteries'?`<div class="bankbox"><h3>ชุดแบตเตอรี่ที่ใช้จำลอง</h3>${bankHTML()}</div>`:''}
    ${TEACH.on?`<details class="eqd"${EQ.edit[kind]?' open':''}><summary>${EQ.edit[kind]?'แก้ไข':'เพิ่ม'}${sc.one}</summary>${eqFormHTML(kind)}</details>
    <details class="eqd"><summary>นำเข้า / ส่งออก</summary>
      <div class="eqimp">
        <p class="hint" style="margin:0">นำเข้าได้จากไฟล์ JSON หรือ CSV (หัวคอลัมน์ภาษาอังกฤษ เช่น ${sc.fields.slice(0,6).map(x=>x[0]).join(', ')}) หรือวางข้อความลงในช่อง ถ้า id ซ้ำจะแทนที่รายการเดิม</p>
        <input type="file" accept=".json,.csv,.txt,text/csv,application/json" data-file="${kind}">
        <textarea data-paste="${kind}" rows="4" spellcheck="false" placeholder="วาง JSON หรือ CSV ที่นี่"></textarea>
        <div class="eqact"><button class="btn pri" data-import="${kind}">นำเข้า</button><button class="btn" data-sample="${kind}">ใส่ตัวอย่างรูปแบบ CSV</button><button class="btn" data-export="${kind}">ส่งออกแคตตาล็อกทั้งหมดเป็น JSON</button><span class="eqmsg" data-imsg="${kind}" role="status"></span></div>
      </div>
    </details>`:''}
  </div>`;
}
function eqRenderAll(){KIND_ORDER.forEach(eqRender);fillSelectors()}
function fillSelectors(){
  if(typeof quickSel==='function')quickSel();
  const p=curPanel(),I=curInv();
  const el=$('#cur-equip');
  if(el){
    const bi=bankInfo();
    el.innerHTML=`<span><b>แผง</b> ${esc(PV.name)} · ${PV.pmax} W</span><span><b>อินเวอร์เตอร์</b> ${esc(I.name)} · ${I.pac/1000} kW · ${({'on-grid':'On-grid','hybrid':'Hybrid','off-grid':'Off-grid'})[I.type]}</span><span><b>แบต</b> ${bi?`${bi.n} ลูก · ${f(bi.V,1)} V · ${f(bi.kwh,2)} kWh`:'-'}</span>`;
  }
}
function eqMsg(sel,txt,cls){const m=document.querySelector(sel);if(m){m.className='eqmsg '+(cls||'');m.textContent=txt}}
function onCatalogChange(){
  autoBat();
  applyActive();eqRenderAll();if(typeof quickSel==='function')quickSel();
  lastSig='';render();
  if(typeof loadView==='function'&&$('#ldmx'))loadView();
  if(typeof acRender==='function')acRender();
  if(typeof runSim==='function'&&lastA)runSim();
  if(typeof backupRun==='function')backupRun();
  if(typeof touch==='function')touch(true);
}
function initCatalogUI(){
  const root=$('#tab-equip');
  root.addEventListener('change',e=>{
    const t=e.target;
    if(t.dataset.file&&!TEACH.on)return;
    if(t.dataset.act){ACT[ACTKEY[t.dataset.act]]=t.value;onCatalogChange();return}
    if(t.dataset.file){
      const file=t.files[0];if(!file)return;
      const kind=t.dataset.file,rd=new FileReader();
      rd.onload=()=>{document.querySelector(`[data-paste="${kind}"]`).value=String(rd.result||'');eqMsg(`[data-imsg="${kind}"]`,`อ่านไฟล์ ${file.name} แล้ว กด "นำเข้า" เพื่อยืนยัน`,'')};
      rd.onerror=()=>eqMsg(`[data-imsg="${kind}"]`,'อ่านไฟล์ไม่ได้','err');
      rd.readAsText(file);
    }
  });
  root.addEventListener('input',e=>{
    if(e.target.id==='bk-s'||e.target.id==='bk-p'){
      const n=Math.max(1,Math.min(32,parseInt(e.target.value)||1));
      if(e.target.id==='bk-s')BANK.s=n;else BANK.p=n;
      const bk=$('#eq-batteries .bankbox');
      const h=bankHTML();
      /* keep focus: refresh only the readout part */
      const tmp=document.createElement('div');tmp.innerHTML=h;
      const old=bk.querySelectorAll('dl,ul.checks');old.forEach(x=>x.remove());
      tmp.querySelectorAll('dl,ul.checks').forEach(x=>bk.appendChild(x));
      fillSelectors();
      if(typeof backupRun==='function')backupRun();
      if(typeof touch==='function')touch();
    }
  });
  root.addEventListener('click',e=>{
    const t=e.target.closest('button');if(!t)return;
    const d=t.dataset;
    if(!TEACH.on&&(d.edit||d.del||d.save||d.cancel||d.import||d.sample||d.export))return;
    if(d.edit){EQ.edit[d.edit]=CAT[d.edit].find(x=>x.id===d.id)||null;eqRender(d.edit);const dd=document.querySelector(`#eq-${d.edit} details`);if(dd)dd.scrollIntoView({block:'nearest'});return}
    if(d.cancel){EQ.edit[d.cancel]=null;eqRender(d.cancel);return}
    if(d.del){
      if(CAT[d.del].length<2)return;
      CAT[d.del]=CAT[d.del].filter(x=>x.id!==d.id);
      if(EQ.edit[d.del]&&EQ.edit[d.del].id===d.id)EQ.edit[d.del]=null;
      onCatalogChange();return;
    }
    if(d.save){
      const kind=d.save,form=document.querySelector(`[data-form="${kind}"]`),raw={};
      form.querySelectorAll('[data-f]').forEach(i=>raw[i.dataset.f]=i.value);
      if(EQ.edit[kind])raw.id=EQ.edit[kind].id;
      const {item,why}=normalizeItem(kind,raw);
      if(why.length){eqMsg(`[data-fmsg="${kind}"]`,'ต้องกรอก: '+why.join(', '),'err');return}
      if(!EQ.edit[kind]&&CAT[kind].some(x=>x.id===item.id))item.id+='-'+Date.now().toString(36).slice(-4);
      const ix=CAT[kind].findIndex(x=>x.id===item.id);
      if(ix>=0)CAT[kind][ix]=item;else CAT[kind].push(item);
      ACT[ACTKEY[kind]]=item.id;EQ.edit[kind]=null;onCatalogChange();return;
    }
    if(d.import){
      const kind=d.import,txt=document.querySelector(`[data-paste="${kind}"]`).value;
      const r=importText(txt,kind);
      if(r.error){eqMsg(`[data-imsg="${kind}"]`,r.error,'err');return}
      onCatalogChange();
      const sk=r.skipped.length?` · ข้าม ${r.skipped.length} แถว (${r.skipped.slice(0,3).map(s=>s.row+' '+s.why).join('; ')}${r.skipped.length>3?' …':''})`:'';
      eqMsg(`[data-imsg="${kind}"]`,`นำเข้าใหม่ ${r.added} · แทนที่ ${r.updated}${sk}`,r.added||r.updated?'ok':'err');
      return;
    }
    if(d.sample){document.querySelector(`[data-paste="${d.sample}"]`).value=SAMPLE[d.sample];eqMsg(`[data-imsg="${d.sample}"]`,'แก้ค่าตัวอย่างเป็นข้อมูลจริงแล้วกด "นำเข้า"','');return}
    if(d.export){
      const ta=document.querySelector(`[data-paste="${d.export}"]`);ta.value=exportJSON();ta.select();
      let ok=false;try{ok=document.execCommand&&document.execCommand('copy')}catch(_){}
      eqMsg(`[data-imsg="${d.export}"]`,ok?'คัดลอก JSON ของแคตตาล็อกแล้ว นำไปวางเก็บเป็นไฟล์ได้':'แสดง JSON ในช่องแล้ว คัดลอกไปเก็บเป็นไฟล์ได้','ok');
    }
  });
}

/* ---- storage: per-viewer db doc when available, else localStorage ---- */
const Store={db:null,uid:null,ready:false,
  async init(){
    try{
      if(!window.claude||!claude.use)return;
      const [db,user]=await Promise.all([claude.use('db'),claude.use('user')]);
      if(db&&user){const id=await user.id();if(id){this.db=db;this.uid=id}}
    }catch(e){this.db=null}
    this.ready=true;
  },
  path(n){return`data/users/${this.uid}/${n}`},
  async load(n){
    try{
      if(this.db){const s=await this.db.doc(this.path(n)).get();if(s.exists){const d=s.data();if(d&&d.json)return JSON.parse(d.json)}}
    }catch(e){}
    try{const t=localStorage.getItem('pvsim:'+n);if(t)return JSON.parse(t)}catch(e){}
    return null;
  },
  async save(n,obj){
    const json=JSON.stringify(obj);let ok=false;
    try{if(this.db){await this.db.doc(this.path(n)).set({json,t:Date.now()});ok=true}}catch(e){}
    try{localStorage.setItem('pvsim:'+n,json);ok=true}catch(e){}
    return ok;
  },
  async clear(n){
    try{if(this.db)await this.db.doc(this.path(n)).delete()}catch(e){}
    try{localStorage.removeItem('pvsim:'+n)}catch(e){}
  }
};
