/* ---- หน้าจอเครื่อง Hybrid จำลอง (ใช้ร่วมกันในเมนู 19 AC Coupling และเมนู 20 Smart Load) ----
   Deye: SUN-3/3.6/5/6K-SG04LP1-EU-SM1/SM2 (2026-01) ข้อ 5.4 System Setup › 5.7 System Work Mode › 5.6 Battery Setup › 5.10 Generator Port Use
   Solis: S6-EH1P(3-8)K-L-PLUS User Manual V1.3 ข้อ 5.4 HMI: SYSTEM SETTING › STORAGE MODE / SMART PORT
   ชื่อรายการ ค่าเริ่มที่ระบุในคู่มือ และคำอธิบายตามคู่มือ ส่วนค่าเริ่มที่คู่มือไม่ระบุเป็นค่าตัวอย่างของแบบจำลอง */
const HL_DEYE=()=>({work:{mode:'zeroLoad',solarSell:false,maxSell:5000,zeroP:20},
  bat:{shutdown:10,low:20,restart:40},
  gen:{use:'gen',rated:8000,toGrid:false,acGrid:false,acLoad:false,sl:{pv:500,on:100,off:95,gridOn:false,offGridOff:false},mi:{on:95,off:100,hz:52}},
  adv:{inv2:false}});
const HL_SOLIS=()=>({st:{mode:'self',allowExp:false,maxExp:6600,cal:20,reserve:80,gridChg:false,peak:true},
  sp:{use:'none',gen:{ctl:'manual',on:30,off:80},sl:{on:90,off:80,gridOn:false,offGridOff:false}}});
const hlDef=host=>host==='deye'?HL_DEYE():HL_SOLIS();
/* ค่าที่โมเดลใช้ (ปรับรูปแบบของสองยี่ห้อให้เหมือนกัน) */
function hlMap(host,h){
  if(host==='deye'){const w=h.work,g=h.gen;
    return{exp:w.mode==='sell'||w.solarSell,maxSell:w.maxSell/1000,reserve:h.bat.low,floorOff:h.bat.shutdown,genUse:{gen:'gen',smart:'smart',micro:'ac'}[g.use],acLoad:!!g.acLoad,acGrid:!!g.acGrid,inv2:!!(h.adv&&h.adv.inv2),
      sl:{pvMin:g.sl.pv/1000,on:g.sl.on,off:g.sl.off,gridOn:g.sl.gridOn,offGridOff:g.sl.offGridOff},mi:{on:g.mi.on,off:g.mi.off,hz:g.mi.hz,fixed:false},zeroCT:w.mode==='zeroCT'}}
  const s=h.st,p=h.sp;
  return{exp:s.mode==='sell'||(s.mode==='self'&&s.allowExp),maxSell:s.maxExp/1000,reserve:s.reserve,floorOff:5,genUse:p.use,acLoad:false,acGrid:false,inv2:false,
    sl:{pvMin:0,on:p.sl.on,off:p.sl.off,gridOn:p.sl.gridOn,offGridOff:p.sl.offGridOff},mi:{on:95,off:100,hz:52,fixed:true},zeroCT:false};
}
/* ---- สร้างฟอร์ม ---- */
const hlRow=(l,c)=>`<div class="slrow"><span>${l}</span><span>${c}</span></div>`;
const hlNum=(p,v,min,max,step,u)=>`<span class="slnum"><input class="hn" type="number" data-hl="${p}" id="hl-${p.replace(/\./g,'-')}" value="${v}" min="${min}" max="${max}" step="${step||1}"><i>${u||''}</i></span>`;
const hlChk=(p,v,t)=>`<label class="slck"><input class="hn" type="checkbox" data-hl="${p}" id="hl-${p.replace(/\./g,'-')}" ${v?'checked':''}> ${t||''}</label>`;
const hlRadio=(p,opts,v)=>`<span class="slradio" style="flex-wrap:wrap">${opts.map(([k,t])=>`<label><input class="hn" type="radio" name="hl-${p}" data-hl="${p}" value="${k}" ${String(v)===String(k)?'checked':''}> ${esc(t)}</label>`).join('')}</span>`;
const hlGo=(k,t,ic)=>`<button class="hn hmiitem" data-hlgo="${k}"><i>${ic||'›'}</i>${t}</button>`;
function hlPath(o,p,set,v){const ks=p.split('.');for(let i=0;i<ks.length-1;i++){o=o[ks[i]];if(o==null)return undefined}const k=ks[ks.length-1];if(set){o[k]=v;return v}return o[k]}
/* S = {hs, lcd:{scr,stack}} · host = 'deye' | 'solis' · live = HTML หน้า Home (ค่าจริงขณะนี้) */
function hlScreen(host,S,live,modelNote){
  const h=S.hs,L=S.lcd,deye=host==='deye',scr=L.scr,bar=t=>`<div class="hmibar"><span>${t}</span><span>${deye?'SUN-6K-SG04LP1':'S6-EH1P6K-L-PLUS'}</span></div>`;
  const foot=`<div class="hmifoot">${scr==='home'?'<span></span>':'<button class="hn slb" data-hlgo="back">◀ Back</button>'}${scr==='home'?'':'<button class="hn slb" data-hlgo="home">⌂ Home</button>'}</div>`;
  const stub=(t,msg)=>bar(t)+`<div class="hmibody"><p class="hmiinfo">${msg}</p></div>`+foot;
  let b='';
  if(scr==='home')return bar(deye?'Home':'Devices Status')+`<div class="hmibody">${live}</div><div class="hmifoot c"><button class="hn slb pri" data-hlgo="sys">⚙ ${deye?'System Setup':'SYSTEM SETTING'}</button></div>`;
  if(deye){
    const w=h.work,g=h.gen,bt=h.bat;
    switch(scr){
      case'sys':return bar('System Setup')+`<div class="hmibody grid2">${hlGo('work','System Work Mode','◎')}${hlGo('bat','Battery Setting','▮')}${hlGo('gridset','Grid Setting','⚡')}${hlGo('gen','Gen Port Use','⇄')}${hlGo('basic','Basic','☰')}${hlGo('adv','Advanced Function','✎')}${hlGo('devinfo','Device Info.','ⓘ')}</div>`+foot;
      case'work':{
        b=hlRow('Work Mode',hlRadio('work.mode',[['sell','Selling First'],['zeroLoad','Zero Export To Load'],['zeroCT','Zero Export To CT']],w.mode));
        if(w.mode==='sell')b+=hlRow('Max Sell Power',hlNum('work.maxSell',w.maxSell,0,10000,100,'W'));
        else b+=hlRow('Solar Sell',hlChk('work.solarSell',w.solarSell,''))+(w.solarSell?hlRow('Max Sell Power',hlNum('work.maxSell',w.maxSell,0,10000,100,'W')):'')+hlRow('Zero-export Power',hlNum('work.zeroP',w.zeroP,0,500,10,'W'));
        return bar('System Work Mode')+`<div class="hmibody">${b}<p class="hmiinfo">Selling First: ขายไฟส่วนเกินคืนกริด · Zero Export To Load: จ่ายเฉพาะโหลด Backup ไม่ขายและไม่จ่ายโหลดบ้านฝั่งกริด · Zero Export To CT: ต้องมี CT หรือสมาร์ทมิเตอร์ ไม่ขายไฟถ้าไม่เปิด Solar Sell · Solar Sell: ใช้กับสองโหมดหลังเมื่อต้องการขายไฟส่วนเกินไม่เกิน Max Sell Power · Zero-export Power: ดึงจากกริดเล็กน้อย (แนะนำ 20–100 W) เพื่อไม่ให้ไฟย้อน (คู่มือข้อ 5.7)</p></div>`+foot}
      case'bat':return bar('Battery Setting')+`<div class="hmibody">${hlRow('Batt Mode','Lithium (สื่อสาร BMS)')+hlRow('Shutdown',hlNum('bat.shutdown',bt.shutdown,0,50,1,'%'))+hlRow('Low Batt',hlNum('bat.low',bt.low,0,60,1,'%'))+hlRow('Restart',hlNum('bat.restart',bt.restart,0,100,1,'%'))}${bt.shutdown<bt.low&&bt.low<=bt.restart?'':'<p class="hmierr">Shutdown &lt; Low Batt ≤ Restart</p>'}<p class="hmiinfo">Low Batt: SOC ที่เครื่องหยุดจ่ายแบตตอนมีกริด · Shutdown: SOC ที่ปิดเครื่องตอนไฟดับ (ค่าตัวอย่างในแบบจำลอง) (ข้อ 5.6)</p></div>`+foot;
      case'gen':{
        b=hlRow('Generator Port Use',hlRadio('gen.use',[['gen','Generator Input'],['smart','Smart Load Output'],['micro','Micro Inv Input']],g.use));
        if(g.use==='gen')b+=hlRow('Generator Input Rated Power',hlNum('gen.rated',g.rated,0,8000,100,'W'))+hlRow('GEN connect to Grid input port',hlChk('gen.toGrid',g.toGrid,''));
        if(g.use==='smart')b+=hlRow('Power (PV ≥)',hlNum('gen.sl.pv',g.sl.pv,0,6000,100,'W'))+hlRow('Smart Load ON Batt',hlNum('gen.sl.on',g.sl.on,0,100,1,'%'))+hlRow('Smart Load OFF Batt',hlNum('gen.sl.off',g.sl.off,0,100,1,'%'))+hlRow('On Grid always on',hlChk('gen.sl.gridOn',g.sl.gridOn,''))+hlRow('off grid immediately off',hlChk('gen.sl.offGridOff',g.sl.offGridOff,''));
        if(g.use==='micro')b+=hlRow('Micro Inv Input ON',hlNum('gen.mi.on',g.mi.on,0,100,1,'%'))+hlRow('Micro Inv Input OFF',hlNum('gen.mi.off',g.mi.off,0,100,1,'%'))+hlRow('AC Couple Fre High',hlNum('gen.mi.hz',g.mi.hz,50,52,.1,'Hz'));
        b+=hlRow('AC couple on grid side',hlChk('gen.acGrid',g.acGrid,''))+hlRow('AC couple on load side',hlChk('gen.acLoad',g.acLoad,''));
        const acn=' · AC couple on load side: ต่อเอาต์พุตของอินเวอร์เตอร์ออนกริดที่พอร์ต LOAD ของ Hybrid ซึ่งเครื่องจะแสดงกำลังโหลดไม่ถูกต้อง · AC couple on grid side: ต่อที่พอร์ต GRID · บางเฟิร์มแวร์ไม่มีฟังก์ชันนี้ · ถ้าอินเวอร์เตอร์ออนกริดมีมิเตอร์ของตัวเอง ตั้ง Advanced Function › Grid Side INV Meter2 (ข้อ 5.11) เพื่อให้จอแสดงกำลังของมันที่ไอคอน PV (คู่มือข้อ 5.10)';
        const info={gen:'Generator Input: ต่อเครื่องปั่นไฟที่พอร์ต GEN (Rated Power = กำลังสูงสุดที่รับจากเครื่องปั่นไฟ)',
          smart:'Smart Load Output: ใช้พอร์ต GEN เป็นเอาต์พุต โหลดที่ต่ออยู่เปิด/ปิดโดยเครื่อง ตัวอย่างในคู่มือ Power = 500 W, ON 100%, OFF 95%: เมื่อ PV เกิน 500 W และ SOC ถึง 100% Smart Load จะเปิด เมื่อ SOC ต่ำกว่า 95% หรือ PV ต่ำกว่า 500 W จะปิด · On Grid always on: เปิดทุกครั้งที่มีกริด · off grid immediately off: ตัดทันทีเมื่อกริดดับ',
          micro:'Micro Inv Input: ใช้พอร์ต GEN เป็นอินพุต AC ของไมโครอินเวอร์เตอร์หรืออินเวอร์เตอร์ออนกริด · OFF: เมื่อ SOC ถึงค่านี้ตอนไฟดับ เครื่องเพิ่มความถี่ที่พอร์ต GEN ถึง AC Couple Fre High เพื่อให้อินเวอร์เตอร์นั้นตัดออก (ใช้ไม่ได้ตอนมีกริด) · ON: เมื่อ SOC ต่ำกว่าค่านี้ รีเลย์พอร์ต GEN ปิดและอินเวอร์เตอร์นั้นจ่ายไฟ · ก่อนถึง OFF กำลังไมโครลดลงเป็นเส้นตรง · หมายเหตุในคู่มือ: ON/OFF ของ Micro Inv Input มีเฉพาะบางเวอร์ชันเฟิร์มแวร์'}[g.use];
        return bar('Generator Port Use')+`<div class="hmibody">${b}<p class="hmiinfo">${info}${acn}</p></div>`+foot}
      case'gridset':return stub('Grid Setting','ปลดล็อกด้วยรหัส 7777 ก่อนแก้ค่ากริด (ไม่ได้ใช้ในใบงานนี้)');
      case'basic':return stub('Basic','Time Syncs, Beep, Auto Dim · Factory Reset รหัส 9999 · Lock out all changes รหัส 7777 (ไม่ได้ใช้ในใบงานนี้)');
      case'adv':{const a=h.adv||(h.adv={inv2:false});
        return bar('Advanced Function')+`<div class="hmibody">${hlRow('Grid Side INV Meter2',hlChk('adv.inv2',a.inv2,''))}<p class="hmiinfo">Grid Side INV Meter2: ใช้เมื่อมีอินเวอร์เตอร์ออนกริดต่อ AC couple ที่ฝั่งกริดหรือฝั่งโหลดของ Hybrid และติดมิเตอร์ให้อินเวอร์เตอร์ออนกริดนั้น จอ Hybrid จะแสดงกำลังของอินเวอร์เตอร์ออนกริดที่ไอคอน PV ต้องแน่ใจว่ามิเตอร์สื่อสารกับ Hybrid ได้ (คู่มือข้อ 5.11) · รายการอื่นในหน้านี้ (Parallel, Ex_Meter For CT, Meter Select, ATS, Export/Import power limiter, Low Noise Mode, Low Power Mode&lt;Low Batt, MPPT Multi-Point Scanning) ไม่ได้ใช้ในใบงานนี้ ดูเมนู 18</p></div>`+foot}
      case'devinfo':return stub('Device Info.','รุ่น SUN-6K-SG04LP1-EU-SM2 · เวอร์ชันเฟิร์มแวร์เป็นตัวอย่างในแบบจำลอง');
    }
  }else{
    const s=h.st,p=h.sp;
    switch(scr){
      case'sys':return bar('SYSTEM SETTING')+`<div class="hmibody grid2">${hlGo('storage','STORAGE MODE','◎')}${hlGo('parallel','PARALLEL SETTING','⫴')}${hlGo('battery','BATTERY SETTING','▮')}${hlGo('basic','BASIC SETTING','☰')}${hlGo('smart','SMART PORT','⇄')}${hlGo('gridport','GRID PORT','⚡')}</div>`+foot;
      case'storage':{
        b=hlRow('Storage mode',hlRadio('st.mode',[['self','Self-use'],['sell','Selling first'],['off','Off grid']],s.mode));
        if(s.mode==='self')b+=hlRow('Allow export',hlChk('st.allowExp',s.allowExp,''));
        if(s.mode!=='off')b+=hlRow('Max export power',hlNum('st.maxExp',s.maxExp,0,6600,100,'W'))+hlRow('Export calibration',hlNum('st.cal',s.cal,-500,500,10,'W'));
        b+=hlRow('Battery reserve',hlNum('st.reserve',s.reserve,5,95,1,'%'))+hlRow('Allow grid charging',hlChk('st.gridChg',s.gridChg,''))+hlRow('Grid peak shaving',hlChk('st.peak',s.peak,''));
        return bar('STORAGE MODE')+`<div class="hmibody">${b}<p class="hmiinfo">Self-use: โหลด &gt; แบต &gt; กริด ถ้าไม่ติ๊ก Allow export จะลดกำลังแผงตามโหลด · Selling first: โหลด &gt; กริด &gt; แบต ห้ามใช้ถ้าตั้ง Max export = 0 · Off grid: โหลด &gt; แบต · Max export power ค่าเริ่ม 1.1 เท่าพิกัดเครื่อง ถ้าไม่อนุญาตให้ขายไฟตั้งเป็น 0 · Export calibration ค่าเริ่ม 20 W (−500…500 W) · Battery reserve 5–95% ค่าเริ่ม 80% ต่ำกว่านี้แบตหยุดจ่าย (คู่มือข้อ 5.4)</p></div>`+foot}
      case'smart':{
        b=hlRow('Smart Port',hlRadio('sp.use',[['none','ไม่ใช้งาน'],['genset','Genset input'],['gensetgrid','Genset connected to grid'],['smart','Smart load output'],['ac','AC couple input']],p.use));
        if(p.use==='smart')b+=hlRow('Smart load OFF SOC',hlNum('sp.sl.off',p.sl.off,0,100,1,'%'))+hlRow('Smart load ON SOC',hlNum('sp.sl.on',p.sl.on,0,100,1,'%'))+hlRow('On grid always on',hlChk('sp.sl.gridOn',p.sl.gridOn,''))+hlRow('Off grid always off',hlChk('sp.sl.offGridOff',p.sl.offGridOff,''));
        if(p.use==='genset'||p.use==='gensetgrid')b+=hlRow('Generator control',hlRadio('sp.gen.ctl',[['manual','Manual'],['auto','Automatic']],p.gen.ctl))+(p.gen.ctl==='auto'?hlRow('Generator ON SOC',hlNum('sp.gen.on',p.gen.on,0,100,1,'%'))+hlRow('Generator OFF SOC',hlNum('sp.gen.off',p.gen.off,0,100,1,'%')):'');
        const info={none:'ไม่ได้ต่ออะไรที่พอร์ต GEN',genset:'Genset input: เครื่องปั่นไฟต่อที่พอร์ต GEN · Manual/Enable หรือ Automatic ON/OFF (เริ่มเมื่อ SOC ลดถึง ON หยุดเมื่อถึง OFF)',gensetgrid:'Genset connected to grid: เครื่องปั่นไฟต่อที่พอร์ต Grid',
          smart:'Smart load output: โหลดที่พอร์ต GEN เป็น Smart load เมื่อ SOC/Volt ของแบตลดถึง OFF ระบบตัดไฟ Smart load เพื่อเหลือไฟให้โหลด Backup เมื่อ SOC/Volt ถึง ON จึงจ่ายไฟ · On grid always on: จ่ายไฟ Smart load ทุกครั้งที่มีกริด · Off grid always off: ตัดไฟ Smart load เมื่อกริดดับ (คู่มือข้อ 5.4.3 Step 7)',
          ac:'AC couple input: อินเวอร์เตอร์ออนกริดภายนอกต่อที่พอร์ต GEN เครื่อง Hybrid ใช้ Freq-Watt ปรับกำลังของอินเวอร์เตอร์นั้น ไม่มีค่าความถี่ให้ตั้งที่เครื่อง Solis ต้องดูวิธีตั้ง Freq-Watt ที่คู่มือของอินเวอร์เตอร์นั้นก่อน (ตามคู่มือ)'}[p.use];
        return bar('SMART PORT')+`<div class="hmibody">${b}<p class="hmiinfo">${info}</p>${modelNote&&p.use==='ac'?`<p class="hmiinfo">${modelNote}</p>`:''}</div>`+foot}
      case'parallel':return stub('PARALLEL SETTING','เครื่องเดี่ยว: Disable (ไม่ได้ใช้ในใบงานนี้)');
      case'battery':return stub('BATTERY SETTING','Battery Model, Max charge/discharge current, Over discharge / Force charge SOC (ไม่ได้ใช้ในใบงานนี้ ดูเมนู 15)');
      case'basic':return stub('BASIC SETTING','Date and Time, Language (ไม่ได้ใช้ในใบงานนี้)');
      case'gridport':return stub('GRID PORT','Grid Code ตามการไฟฟ้า (ไม่ได้ใช้ในใบงานนี้ ดูเมนู 15)');
    }
  }
  return bar('Home');
}
/* ห่อจอเครื่อง */
const hlDevice=(host,S,live,note)=>{const deye=host==='deye';return `<div class="sldev"><div class="sldevtop"><span>${deye?'DEYE':'SOLIS'}</span><span>${deye?'System Setup (จอสัมผัส)':'HMI › SYSTEM SETTING'}</span></div><div class="slscr">${hlScreen(host,S,live,note)}</div></div>`};
/* จัดการคลิก/เปลี่ยนค่า: คืน true ถ้าเป็นของจอเครื่อง */
function hlClick(e,S){const t=e.target.closest('[data-hlgo]');if(!t)return false;const k=t.dataset.hlgo,L=S.lcd;
  if(k==='back'){L.scr=L.stack.pop()||'home'}else if(k==='home'){L.scr='home';L.stack=[]}else{L.stack.push(L.scr);L.scr=k}return true}
function hlChange(e,S){const t=e.target;if(!t.dataset||t.dataset.hl==null)return false;let v;
  if(t.type==='checkbox')v=t.checked;else if(t.type==='number'){v=+t.value;if(!isFinite(v))v=0;if(t.min!=='')v=Math.max(+t.min,v);if(t.max!=='')v=Math.min(+t.max,v)}else v=t.value;
  hlPath(S.hs,t.dataset.hl,true,v);return true}
/* กู้ค่าจากที่บันทึก: คงโครงเดิม รับเฉพาะค่าที่ชนิดตรงกัน */
function hlMerge(def,o){if(!o||typeof o!=='object')return def;Object.keys(def).forEach(k=>{if(def[k]&&typeof def[k]==='object')def[k]=hlMerge(def[k],o[k]);else if(typeof o[k]===typeof def[k])def[k]=o[k]});return def}
