/* ---- เมนู 17 หน้า "Commissioning (ฝึกเปิดเครื่อง)": จำลองลำดับงาน commissioning อินเวอร์เตอร์ Huawei SUN2000 ด้วยแอป FusionSolar ----
   ลำดับงานอ้างอิงหัวข้อ 4 "การจ่ายไฟระบบและการทดสอบ" และหัวข้อ 5 ของคู่มือในหน้า "คู่มือ (แปลไทย)" (4.1 ตรวจก่อนจ่ายไฟ · 4.2 เปิด AC แล้วเปิด DC · ตาราง 4-1 LED Smart Dongle)
   ค่าแรงดัน ความต้านทานฉนวน และชื่อรายการบนจอเป็นการเลียนแบบเพื่อการสอน ไม่ได้เชื่อมต่อ Huawei จริง ชื่อบนแอปจริงอาจต่างตามเวอร์ชัน
   ไม่เก็บรหัสผ่านไปกับโปรเจ็ค */
const FC_STEPS=['1 ตรวจก่อนเปิด','2 เชื่อมต่อแอป','3 Quick settings','4 เปิดเครื่อง','5 ตรวจหลังเดิน','6 สรุปผล'];
const FC_PRE=['สายกราวด์ของอินเวอร์เตอร์ต่อแน่นหนา','ติดตั้งอินเวอร์เตอร์ถูกต้อง และสายทุกเส้นต่อถูกต้องมั่นคง','ติดตั้ง Smart Dongle ถูกต้องและยึดแน่น','สวม PPE และใช้เครื่องมือหุ้มฉนวน (ตามหัวข้อ DANGER ในคู่มือ)'];
const FC_PTS=[['dc1','DC สตริง 1: แรงดันวงจรเปิด (Voc) ที่ขั้ว + ถึง −','V'],['dc2','DC สตริง 2: แรงดันวงจรเปิด (Voc)','V'],['iso','ความต้านทานฉนวน DC ถึงกราวด์ (เมกเกอร์)','MΩ'],['acln','AC: L–N ที่ปลายสาย AC ก่อนเข้าเครื่อง','V'],['npe','AC: N–PE','V']];
const FC_GC=[['','— เลือก grid code —'],['TAI-PEA','TAI-PEA'],['TAI-MEA','TAI-MEA'],['VDE-AR-N-4105','VDE-AR-N-4105'],['EN50549-LV','EN50549-LV'],['AS4777.2','AS4777.2'],['IEC61727','IEC61727 (50 Hz)']];
const FC_TZ=[['','— เลือก —'],['0','UTC+00:00'],['5.5','UTC+05:30'],['7','UTC+07:00'],['8','UTC+08:00']];
const FC_NET=[['','— เลือก —'],['wlanfe','WLAN-FE (Smart Dongle ผ่านเราเตอร์)'],['4g','4G (Smart Dongle 4G)'],['mbus','MBUS (ต่อเรียง)'],['rs485','RS485 / Modbus']];
const FC_SSID=[['','— เลือกเครือข่าย —'],['HOME-2G','HOME-2.4G'],['HOME-5G','HOME-5G'],['GUEST','Guest-WiFi']];
const FC_APC=[['','— เลือก —'],['none','No limit (ไม่จำกัด)'],['limit','Limited feed-in (kW)'],['zero','Zero export (ไม่ส่งออก)']];
const FC_ALM={
  rev:{n:'String Reverse Connection',cause:FU_AL.rev.cause,fix:FU_AL.rev.fix},
  insul:{n:'Low Insulation Resistance',cause:FU_AL.insul.cause,fix:FU_AL.insul.fix},
  over:{n:'High String Input Voltage',cause:'แรงดันวงจรเปิดของสตริงสูงกว่าแรงดันอินพุตสูงสุดของอินเวอร์เตอร์ (ต่อแผงอนุกรมมากเกินไป หรือยังไม่ได้คิดแรงดันตอนอากาศเย็น)',fix:'ปิด DC switch ห้ามเปิดซ้ำ ตัดสตริงออกให้จำนวนแผงลดลงจนแรงดัน Voc ต่ำกว่าขีดจำกัดพร้อมเผื่ออุณหภูมิต่ำ แล้ววัดซ้ำก่อนเปิดใหม่'}
};
const FC={step:0,area:'PEA',fault:'rev',fault0:'rev',pre:[],meas:{},fixed:false,method:'',ssid:'',login:{fails:0,locked:false,ok:false,pw2:false,msg:''},qs:{gc:'',omode:'',tz:'',net:'',router:'',apc:'',rpassOk:false,saved:false},sw:{ac:false,dc:false,log:[]}};
const fcN=(v,d)=>Number(v).toFixed(d);
const fcId=id=>document.getElementById(id);
function fcInv(){
  const I=curInv();
  if(/huawei/i.test(I.brand||'')&&/SUN2000/i.test(I.model||'')&&!I.micro)return{name:I.name,pac:I.pac,vmax:I.vmax,lo:I.lo,hi:I.hi,start:I.start||200,imax:I.imax||11,tri:String(I.phase)==='3',eff:I.eff||97,hw:true};
  return{name:'Huawei SUN2000-10KTL-M0 (ค่าสมมติ)',pac:10000,vmax:1100,lo:140,hi:980,start:200,imax:11,tri:true,eff:98.1,hw:false};
}
function fcStr(){
  const I=fcInv(),vo=PV.voc||(PV.vmp*1.2),vm=PV.vmp||40,im=PV.imp||10;
  let ns=Math.round((I.lo+I.hi)/2/vm);const mx=Math.floor(I.vmax/(vo*1.15));
  ns=Math.max(1,Math.max(Math.ceil(I.lo*1.2/vm),Math.min(ns,mx)));
  return{ns,vo,vm,im,voc:ns*vo*1.03};
}
function fcRead(k){
  const T=fcStr(),I=fcInv(),F=FC.fault;
  if(k==='dc1')return F==='rev'?-T.voc:F==='over'?I.vmax*1.08:T.voc;
  if(k==='dc2')return T.voc*0.99;
  if(k==='iso')return F==='insul'?0.12:38.5;
  if(k==='acln')return I.tri?231.6:229.8;
  return 0.6;
}
function fcVerdict(k,v){
  const I=fcInv();
  if(k==='dc1'||k==='dc2')return v>0&&v<I.vmax&&v>I.start;
  if(k==='iso')return v>=1;
  if(k==='acln')return v>=207&&v<=253;
  return v<2;
}
const FC_CRIT={dc1:'ต้องเป็นบวก ต่ำกว่าแรงดันอินพุตสูงสุดของเครื่อง และสูงกว่าแรงดันเริ่มทำงาน',dc2:'เกณฑ์เดียวกับสตริง 1',iso:'เกณฑ์ของแบบฝึก ≥ 1 MΩ (เทียบ IEC 62446-1 และข้อกำหนดการไฟฟ้า)',acln:'ช่วง 207–253 V (230 V ±10%)',npe:'ต่ำกว่า 2 V'};
function fcGcOk(){return FC.qs.gc===(FC.area==='PEA'?'TAI-PEA':'TAI-MEA')}
function fcOrderOk(){const L=FC.sw.log,a=L.indexOf('ac_on'),d=L.indexOf('dc_on');return a>=0&&d>=0&&a<d}
function fcRun(){
  const S=FC.sw,I=fcInv(),T=fcStr(),F=FC.fault;
  if(!S.ac&&!S.dc)return{st:'off',ok:false,lines:[],msg:'ยังไม่ได้เปิดสวิตช์ใดๆ'};
  if(S.dc&&!S.ac)return{st:'noac',ok:false,lines:[[0,'จอสว่างจากไฟ DC แต่ตรวจไม่พบแรงดันกริด']],msg:'มีไฟ DC แต่ยังไม่มี AC เครื่องรอกริดอยู่ ปิดสวิตช์ DC แล้วทำตามลำดับ: เปิดเบรกเกอร์ AC ก่อน แล้วค่อยเปิดสวิตช์ DC'};
  if(S.ac&&!S.dc)return{st:'nodc',ok:false,lines:[[0,'ตรวจพบกริด แต่ไม่มีแรงดัน DC ที่อินพุต']],msg:'มี AC แต่สวิตช์ DC ยังปิดอยู่ อินเวอร์เตอร์ยังไม่ผลิตไฟ'};
  const lines=[[0,'เปิดสวิตช์ DC · เครื่องเริ่มตรวจตัวเอง']];
  const rec=(typeof fuPr!=='undefined'&&+fuPr.rec>0)?+fuPr.rec:10;
  if(F==='over'){lines.push([2,'แรงดัน DC เกินแรงดันอินพุตสูงสุด · alarm: '+FC_ALM.over.n]);return{st:'fault',ok:false,alm:'over',lines,msg:'เครื่องไม่เริ่มทำงาน และเสี่ยงเสียหาย'}}
  if(F==='rev'){lines.push([2,'ตรวจพบสตริง 1 ขั้วกลับ · alarm: '+FC_ALM.rev.n]);return{st:'fault',ok:false,alm:'rev',lines,msg:'สตริง 1 ไม่ผลิตไฟ'}}
  lines.push([5,'ตรวจความต้านทานฉนวน: '+(F==='insul'?'0.12 MΩ ต่ำกว่าเกณฑ์':'38.5 MΩ ผ่าน')]);
  if(F==='insul'){lines.push([6,'alarm: '+FC_ALM.insul.n]);return{st:'fault',ok:false,alm:'insul',lines,msg:'ไม่ต่อเข้ากริด'}}
  lines.push([20,'ตรวจกริด '+fcN(I.tri?231.6:229.8,1)+' V / 50.0 Hz อยู่ในช่วง grid code ที่ตั้ง'],[20+rec,'หน่วงเวลาเชื่อมต่อกริด '+rec+' วินาที (On-grid recovery time ในหน้า Configuration)'],[22+rec,'สถานะ: On-grid · เริ่มส่งกำลังไฟ']);
  return{st:'on',ok:true,lines,msg:'เครื่องเชื่อมต่อกริดแล้ว'};
}
function fcLive(){
  const I=fcInv(),T=fcStr(),R=fcRun();
  if(!R.ok)return{R,pv:[0,0],i:[0,0],pac:0};
  const v=T.vm*T.ns*0.94,i=Math.min(T.im*0.9,I.imax),pdc=v*i*2;
  return{R,pv:[v,v*0.995],i:[i,i*0.99],pac:Math.min(I.pac,pdc*I.eff/100*0.97)};
}
function fcCloud(){
  const q=FC.qs;
  if(!q.saved)return{ok:false,led:'แดง กะพริบเร็ว (0.2 วินาที) — รอตั้งค่าพารามิเตอร์เชื่อมต่อเราเตอร์',why:'ยังไม่ได้บันทึกพารามิเตอร์ใน Quick settings'};
  if(q.net!=='wlanfe')return{ok:false,led:'แดง กะพริบเร็ว — เชื่อมต่อเราเตอร์ไม่สำเร็จ',why:'Networking mode ไม่ตรงกับ Smart Dongle WLAN-FE ที่ติดตั้ง'};
  if(q.router!=='HOME-2G')return{ok:false,led:'แดง กะพริบเร็ว — เชื่อมต่อเราเตอร์ไม่สำเร็จ',why:q.router==='HOME-5G'?'เลือกเครือข่าย 5 GHz แต่ Dongle ใช้ WLAN ย่าน 2.4 GHz':'เลือกเครือข่ายที่ไม่ใช่เราเตอร์ของบ้านนี้'};
  if(!q.rpassOk)return{ok:false,led:'แดง กะพริบเร็ว — เชื่อมต่อเราเตอร์ไม่สำเร็จ',why:'รหัส WiFi สั้นกว่า 8 ตัวอักษร'};
  return{ok:true,led:'เขียว ติดค้าง — เชื่อมต่อระบบจัดการสำเร็จ',why:''};
}
function fcChecks(){
  const I=fcInv(),q=FC.qs,L=fcLive(),C=fcCloud(),m=FC.meas;
  const pre=[[FC.pre.length>=FC_PRE.length,'ทำรายการตรวจก่อนจ่ายไฟครบ ('+FC_PRE.length+' ข้อ)'],[FC_PTS.every(p=>m[p[0]]!=null),'วัดครบทั้ง '+FC_PTS.length+' จุด'],[FC.fault0==='none'||FC.fixed,'พบความผิดปกติและแก้ไขก่อนเปิดเครื่อง'+(FC.fault0==='none'?' (รอบนี้ไม่มีความผิดปกติ)':'')]];
  const con=[[FC.method==='wlan','เลือกเชื่อมต่อผ่าน WLAN ของ Smart Dongle'],[FC.ssid==='own','เลือกเครือข่ายของเครื่องที่ตรงกับ SN บนป้าย'],[FC.login.ok,'ล็อกอินบัญชีผู้ติดตั้งสำเร็จ'],[FC.login.pw2,'เปลี่ยนรหัสผ่านเริ่มต้นตอนล็อกอินครั้งแรก']];
  const qs=[[fcGcOk(),'Grid code ตรงกับการไฟฟ้าของเขต '+FC.area],[!I.tri||q.omode==='four','Output mode เป็น Three-phase four-wire'],[q.tz==='7','เขตเวลา UTC+07:00'],[q.net==='wlanfe','Networking mode เป็น WLAN-FE'],[q.router==='HOME-2G'&&q.rpassOk,'เราเตอร์ 2.4 GHz และกรอกรหัส WiFi ครบ'],[q.apc==='zero','Active power control เป็น Zero export ตามที่เจ้าของบ้านขอ'],[q.saved,'บันทึกการตั้งค่าแล้ว']];
  const pw=[[fcOrderOk(),'เปิดเบรกเกอร์ AC ก่อน แล้วเปิดสวิตช์ DC'],[L.R.ok,'เครื่องขึ้นสถานะ On-grid']];
  const ve=[[L.R.ok&&Math.abs(L.pv[0]-L.pv[1])/Math.max(L.pv[0],1)<0.05,'แรงดันสองสตริงใกล้เคียงกัน (ต่างไม่เกิน 5%)'],[C.ok,'Smart Dongle เชื่อมต่อระบบจัดการสำเร็จ (LED เขียวติดค้าง)'],[L.R.ok&&fcGcOk(),'ไม่มี alarm และ grid code ถูกต้อง']];
  return{pre,con,qs,pw,ve};
}
function fcScore(){const c=fcChecks(),all=[].concat(c.pre,c.con,c.qs,c.pw,c.ve);const n=all.filter(x=>x[0]).length;return{c,n,all:all.length,ok:n===all.length}}
function fcPill(ok){return `<span class="pill ${ok?'ok':'err'}">${ok?'ผ่าน':'ยังไม่ผ่าน'}</span>`}
function fcSel(path,list,val,dis){return `<select data-fck="${path}"${dis?' disabled':''}>${list.map(o=>`<option value="${o[0]}"${o[0]===val?' selected':''}>${esc(o[1])}</option>`).join('')}</select>`}
function fcPgPre(){
  const I=fcInv();
  const chk=FC_PRE.map((t,i)=>`<label class="fcrow"><input type="checkbox" data-fct="${i}"${FC.pre.includes(i)?' checked':''}> ${esc(t)}</label>`).join('');
  const pts=FC_PTS.map(p=>{const v=FC.meas[p[0]];const body=v==null?`<button class="btn sm" data-fca="meas" data-k="${p[0]}">วัด</button>`:`<b class="fcval">${fcN(v,p[2]==='MΩ'?2:1)} ${p[2]}</b> ${fcPill(fcVerdict(p[0],v))}`;return `<div class="fcpt"><div><b>${esc(p[1])}</b><div class="hint tight">${esc(FC_CRIT[p[0]])}</div></div><div>${body}</div></div>`}).join('');
  let al='';
  const bad=FC.fault!=='none'&&FC_PTS.some(p=>FC.meas[p[0]]!=null&&!fcVerdict(p[0],FC.meas[p[0]]));
  if(bad){const a=FC_ALM[FC.fault];al=`<div class="fual-i act"><b>ค่าที่วัดผิดปกติ: เหมือนอาการ ${esc(a.n)}</b><p class="hint tight">${esc(a.cause)}</p><p class="hint tight"><b>วิธีแก้:</b> ${esc(a.fix)}</p><button class="btn sm" data-fca="fix">แก้ไขแล้ว (ต่อ/ตัดสายใหม่) แล้ววัดซ้ำ</button></div>`}
  return `<p class="hint">โจทย์: บ้านในเขตการไฟฟ้า ${fcSel('area',[['PEA','PEA'],['MEA','MEA']],FC.area)} ติดตั้ง <b>${esc(I.name)}</b> (${fcN(I.pac/1000,1)} kW, ${I.tri?'3 เฟส':'1 เฟส'}) สตริงละ ${fcStr().ns} แผง 2 สตริง ติด Smart Dongle WLAN-FE แล้ว เจ้าของบ้านขอใช้ไฟเองโดยไม่ส่งออก${I.hw?'':' · เครื่องที่เลือกในเมนู 02 ไม่ใช่ Huawei หน้านี้จึงใช้ค่าสมมติของ SUN2000'}</p>
  <div class="card"><h3>4.1 ตรวจก่อนจ่ายไฟ</h3>${chk}</div>
  <div class="card"><h3>วัดก่อนเปิดเครื่อง (ปิดเบรกเกอร์ AC และสวิตช์ DC อยู่)</h3>${pts}${al}<p class="hint">สถานการณ์ที่ซ่อนอยู่ในรอบนี้ ${fcSel('fault',[['rev','มีความผิดปกติ: สตริง 1 ขั้วกลับ'],['over','มีความผิดปกติ: สตริง 1 ต่ออนุกรมเกิน'],['insul','มีความผิดปกติ: ฉนวน DC ต่ำ'],['none','ปกติ ไม่มีความผิดปกติ']],FC.fault0)} <span class="hint">(ให้ผู้สอนเลือก แล้วให้ผู้เรียนหาเองจากค่าที่วัด)</span></p></div>`;
}
function fcPgConn(){
  const L=FC.login,sn='TA2600123456',sn2='TA2600654321';
  const meth=[['wlan','WLAN ผ่าน Smart Dongle','ติดตั้งแล้ว ใช้ได้'],['bt','Bluetooth','ไม่ได้ติดตั้งโมดูลบลูทูธ'],['usb','สาย USB','ต้องถอด Dongle ออก และไม่มีสาย USB-ข้อมูลในชุด']].map(m=>`<button class="chip" data-fca="method" data-k="${m[0]}" aria-pressed="${FC.method===m[0]}">${m[1]}</button>`).join('');
  let h=`<div class="card"><h3>ป้ายข้างเครื่อง (สมมติ)</h3><p class="hint">SN ของเครื่องนี้ <b>${sn}</b> · รหัสเริ่มต้นสำหรับฝึก <b>Ubu@2026</b> · เครื่องของเพื่อนบ้านที่อยู่ใกล้กันมี SN ${sn2}</p>
  <p class="lab">1. เลือกวิธีเชื่อมต่อ (แอป FusionSolar &gt; Me &gt; Device commissioning)</p><div class="grp">${meth}</div>`;
  if(FC.method&&FC.method!=='wlan')h+=`<p class="simmsg err" role="status">ใช้วิธีนี้ไม่ได้: ${FC.method==='bt'?'ไม่พบอุปกรณ์ ไม่ได้ติดตั้งโมดูลบลูทูธ':'ไม่มีสาย USB-ข้อมูล และต้องถอด Smart Dongle ออกก่อน'} ให้เลือกวิธีอื่น</p>`;
  if(FC.method==='wlan'){
    h+=`<p class="lab">2. เลือก WLAN ของอินเวอร์เตอร์</p><div class="grp"><button class="chip" data-fca="ssid" data-k="own" aria-pressed="${FC.ssid==='own'}">SUN2000-${sn}</button><button class="chip" data-fca="ssid" data-k="other" aria-pressed="${FC.ssid==='other'}">SUN2000-${sn2}</button></div>`;
    if(FC.ssid==='other')h+='<p class="simmsg err" role="status">นี่คือเครื่องอื่น ตรวจ SN บนป้ายข้างเครื่องแล้วเลือกใหม่ ห้ามตั้งค่าเครื่องของคนอื่น</p>';
    if(FC.ssid==='own'){
      if(!L.ok){
        h+=`<p class="lab">3. ล็อกอิน (บัญชีผู้ติดตั้ง)</p>`;
        if(L.locked)h+=`<p class="simmsg err" role="status">ใส่รหัสผิด 5 ครั้งติดกัน บัญชีถูกล็อก 10 นาที</p><button class="btn sm" data-fca="unlock">ข้ามเวลา 10 นาที (จำลอง)</button>`;
        else h+=`<div class="grp"><input type="password" id="fcpw" autocomplete="off" placeholder="รหัสผ่าน" aria-label="รหัสผ่าน"><button class="btn sm" data-fca="login">Log in</button></div><p class="hint tight">ผิดแล้ว ${L.fails}/5 ครั้ง</p>`;
        if(L.msg)h+=`<p class="simmsg err" role="status">${esc(L.msg)}</p>`;
      }else if(!L.pw2){
        h+=`<p class="lab">4. ตั้งรหัสผ่านใหม่ (บังคับครั้งแรก)</p><div class="grp"><input type="password" id="fcpw2" autocomplete="off" placeholder="รหัสใหม่" aria-label="รหัสผ่านใหม่"><button class="btn sm" data-fca="pw2">ตกลง</button></div><p class="hint tight">เกณฑ์ของแบบฝึก: อย่างน้อย 8 ตัวอักษร มีตัวอักษรและตัวเลข และไม่ซ้ำรหัสเริ่มต้น</p>`;
        if(L.msg)h+=`<p class="simmsg err" role="status">${esc(L.msg)}</p>`;
      }else h+='<p class="simmsg ok" role="status">ล็อกอินสำเร็จ ตั้งรหัสผ่านใหม่แล้ว ไปที่ขั้น 3 Quick settings ได้</p>';
    }
  }
  return h+'</div>';
}
function fcPgQs(){
  const I=fcInv(),q=FC.qs;
  if(!FC.login.ok||!FC.login.pw2)return '<p class="hint">ยังไม่ได้ล็อกอิน กลับไปทำขั้น 2 ให้เสร็จก่อน</p>';
  const om=I.tri?`<div class="fcf"><label>Output mode</label>${fcSel('qs.omode',[['','— เลือก —'],['four','Three-phase four-wire system'],['three','Three-phase three-wire system']],q.omode)}</div>`:'';
  let msg='';
  if(q.saved){
    const w=[];
    if(!fcGcOk())w.push(q.gc?`Grid code ${q.gc} ไม่ใช่ข้อกำหนดของ ${FC.area} เครื่องไม่เตือนบนจอ แต่ไม่ผ่านการตรวจรับของการไฟฟ้า`:'ยังไม่ได้เลือก Grid code');
    if(I.tri&&q.omode!=='four')w.push('Output mode ไม่ตรงระบบ 400/230 V ที่มีสายนิวทรัล');
    if(q.tz!=='7')w.push('เขตเวลาผิด เวลาใน log และกราฟรายวันเลื่อนจากเวลาจริง');
    if(q.apc!=='zero')w.push('Active power control ไม่ใช่ Zero export ไม่ตรงกับที่ตกลงกับเจ้าของบ้านและการไฟฟ้า');
    msg=w.length?`<div class="fual-i act"><b>บันทึกแล้ว แต่มีค่าที่ควรทบทวน</b>${w.map(x=>`<p class="hint tight">• ${esc(x)}</p>`).join('')}</div>`:'<p class="simmsg ok" role="status">บันทึกแล้ว ค่าที่ตั้งตรงกับโจทย์ทั้งหมด</p>';
  }
  return `<div class="card"><h3>Quick settings</h3><p class="hint">ตั้งค่าตามเขตการไฟฟ้า ${esc(FC.area)} · ค่าที่ผิดอาจไม่ขึ้นเตือนบนเครื่อง ผู้ติดตั้งต้องตรวจเอง</p>
  <div class="fcf"><label>Grid code</label>${fcSel('qs.gc',FC_GC,q.gc)}</div>${om}
  <div class="fcf"><label>เขตเวลา</label>${fcSel('qs.tz',FC_TZ,q.tz)}</div>
  <div class="fcf"><label>Networking mode</label>${fcSel('qs.net',FC_NET,q.net)}</div>
  <div class="fcf"><label>เราเตอร์ (Dongle ใช้ WLAN 2.4 GHz)</label>${fcSel('qs.router',FC_SSID,q.router)}</div>
  <div class="fcf"><label>รหัส WiFi เราเตอร์</label><input type="password" id="fcrp" autocomplete="off" placeholder="รหัส WiFi" aria-label="รหัส WiFi"></div>
  <div class="fcf"><label>Active power control</label>${fcSel('qs.apc',FC_APC,q.apc)}</div>
  <div class="grp"><button class="btn sm" data-fca="saveqs">บันทึกการตั้งค่า</button></div>${msg}</div>`;
}
function fcPgPwr(){
  const S=FC.sw,R=fcRun(),L=S.log.slice(-6).map(x=>x==='ac_on'?'เปิดเบรกเกอร์ AC':x==='dc_on'?'เปิดสวิตช์ DC':x==='ac_off'?'ปิดเบรกเกอร์ AC':'ปิดสวิตช์ DC');
  const tl=R.lines.map(l=>`<li><b>${l[0]} วิ</b> ${esc(l[1])}</li>`).join('');
  const a=R.alm?FC_ALM[R.alm]:null;
  const ord=S.log.includes('dc_on')&&S.log.includes('ac_on')&&!fcOrderOk()?'<p class="simmsg err" role="status">ลำดับไม่ตรงคู่มือ 4.2 ต้องเปิดเบรกเกอร์ AC ก่อน แล้วค่อยเปิดสวิตช์ DC กดปิดทั้งหมดแล้วเริ่มใหม่ให้ถูกลำดับ</p>':'';
  const warn=FC.fault!=='none'&&FC.fault===FC.fault0&&!FC.fixed&&S.ac&&S.dc?'<p class="simmsg err" role="status">คุณเปิดเครื่องทั้งที่ยังไม่ได้แก้ความผิดปกติจากขั้นวัด ในงานจริงต้องหยุดที่ขั้น 1</p>':'';
  return `<div class="card"><h3>4.2 การเปิดอินเวอร์เตอร์</h3><p class="hint">ทำตามลำดับ: 1) เปิดเบรกเกอร์ AC ระหว่างอินเวอร์เตอร์กับกริด 2) เปิดสวิตช์ DC ที่ด้านล่างของอินเวอร์เตอร์</p>
  <div class="grp"><button class="chip" data-fca="sw" data-k="ac" aria-pressed="${S.ac}">เบรกเกอร์ AC: ${S.ac?'ON':'OFF'}</button><button class="chip" data-fca="sw" data-k="dc" aria-pressed="${S.dc}">สวิตช์ DC: ${S.dc?'ON':'OFF'}</button><button class="btn sm" data-fca="alloff">ปิดทั้งหมด</button></div>
  ${L.length?`<p class="hint tight">ลำดับที่ทำ: ${L.map(esc).join(' → ')}</p>`:''}${ord}
  <p>สถานะเครื่อง: <span class="pill ${R.ok?'ok':R.st==='fault'?'err':'idle'}">${R.ok?'On-grid':R.st==='fault'?'Fault':R.st==='off'?'ปิดอยู่':'รอ'}</span> ${esc(R.msg)}</p>
  ${tl?`<ol class="fctl">${tl}</ol>`:''}${a?`<div class="fual-i act"><b>${esc(a.n)}</b><p class="hint tight">${esc(a.cause)}</p><p class="hint tight"><b>วิธีแก้:</b> ${esc(a.fix)}</p></div>`:''}${warn}</div>`;
}
function fcPgVer(){
  const L=fcLive(),C=fcCloud();
  if(!L.R.ok)return '<p class="hint">เครื่องยังไม่อยู่ในสถานะ On-grid ไปทำขั้น 4 ให้สำเร็จก่อน</p>';
  const bal=Math.abs(L.pv[0]-L.pv[1])/Math.max(L.pv[0],1)*100;
  return `<div class="card"><h3>ตรวจหลังเดินเครื่อง (ค่าประมาณตอนแดดจัด)</h3>
  <div class="fcgrid"><div><span class="lab">PV1</span><b>${fcN(L.pv[0],0)} V · ${fcN(L.i[0],1)} A</b></div><div><span class="lab">PV2</span><b>${fcN(L.pv[1],0)} V · ${fcN(L.i[1],1)} A</b></div><div><span class="lab">กำลัง AC</span><b>${fcN(L.pac/1000,2)} kW</b></div><div><span class="lab">Grid code ที่ตั้ง</span><b>${esc(FC.qs.gc||'—')}</b></div></div>
  <p class="hint">แรงดันสองสตริงต่างกัน ${fcN(bal,1)}% ${fcPill(bal<5)}</p>
  <p><b>LED Smart Dongle:</b> ${esc(C.led)} ${fcPill(C.ok)}</p>${C.ok?'':`<p class="hint">สาเหตุ: ${esc(C.why)} · ย้อนไปแก้ที่ขั้น 3 แล้วกลับมาดูใหม่ (ดูตาราง 4-1 ในหน้า "คู่มือ (แปลไทย)")</p>`}</div>`;
}
function fcPgSum(){
  const s=fcScore(),c=s.c,grp=(t,a)=>`<div class="card"><h3>${t}</h3>${a.map(x=>`<div class="fcrow">${x[0]?'✅':'⬜'} ${esc(x[1])}</div>`).join('')}</div>`;
  return `<p>ผ่าน <b>${s.n}/${s.all}</b> ข้อ ${fcPill(s.ok)}</p>${grp('1 ตรวจก่อนเปิด',c.pre)}${grp('2 เชื่อมต่อแอป',c.con)}${grp('3 Quick settings',c.qs)}${grp('4 เปิดเครื่อง',c.pw)}${grp('5 ตรวจหลังเดิน',c.ve)}
  <div class="grp"><button class="btn sm" data-fca="report">บันทึกรายงาน (.txt)</button><button class="btn sm" data-fca="reset">เริ่มใหม่</button></div>`;
}
function fcRender(){
  const box=fcId('fupg-com');if(!box)return;
  const pages=[fcPgPre,fcPgConn,fcPgQs,fcPgPwr,fcPgVer,fcPgSum],s=fcScore();
  box.innerHTML=`<p class="hint">ฝึกลำดับงาน commissioning อินเวอร์เตอร์ Huawei SUN2000 ด้วยแอป FusionSolar ตั้งแต่วัดก่อนเปิด เชื่อมต่อ ตั้งค่า เปิดเครื่อง จนตรวจผล ผ่านแล้ว ${s.n}/${s.all} ข้อ · หน้าตาและค่าเป็นการเลียนแบบเพื่อการสอน ไม่ได้เชื่อมต่อ Huawei จริง</p>
  <div class="grp" id="fcsteps">${FC_STEPS.map((t,i)=>`<button class="chip" data-fcs="${i}" aria-pressed="${FC.step===i}">${t}</button>`).join('')}</div>
  <div id="fcbody">${pages[FC.step]()}</div>
  <div class="grp"><button class="btn sm" data-fcs="${Math.max(0,FC.step-1)}"${FC.step===0?' disabled':''}>ย้อนกลับ</button><button class="btn sm" data-fcs="${Math.min(5,FC.step+1)}"${FC.step===5?' disabled':''}>ถัดไป</button></div>`;
}
function fcReport(){
  const s=fcScore(),c=s.c,I=fcInv(),out=['รายงานการ commissioning อินเวอร์เตอร์ Huawei (แบบฝึก)','เครื่อง: '+I.name,'เขตการไฟฟ้า: '+FC.area,'ผ่าน '+s.n+'/'+s.all+' ข้อ',''];
  [['1 ตรวจก่อนเปิด',c.pre],['2 เชื่อมต่อแอป',c.con],['3 Quick settings',c.qs],['4 เปิดเครื่อง',c.pw],['5 ตรวจหลังเดิน',c.ve]].forEach(g=>{out.push(g[0]);g[1].forEach(x=>out.push((x[0]?'[ผ่าน] ':'[ไม่ผ่าน] ')+x[1]));out.push('')});
  out.push('ผลจำลองเพื่อการเรียนรู้ ไม่ใช่เอกสารตรวจรับจริง');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['﻿'+out.join('\r\n')],{type:'text/plain;charset=utf-8'}));a.download='commissioning-huawei-report.txt';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
}
function fcSetPath(path,val){const k=path.split('.');if(k.length===1)FC[k[0]]=val;else FC[k[0]][k[1]]=val}
function fcAct(a,k){
  if(a==='meas'){FC.meas[k]=fcRead(k)}
  else if(a==='fix'){FC.fault='none';FC.fixed=true;FC_PTS.forEach(p=>{delete FC.meas[p[0]]})}
  else if(a==='method')FC.method=k;
  else if(a==='ssid')FC.ssid=k;
  else if(a==='unlock'){FC.login.locked=false;FC.login.fails=0;FC.login.msg=''}
  else if(a==='login'){
    const v=(fcId('fcpw')||{}).value||'';
    if(v==='Ubu@2026'){FC.login.ok=true;FC.login.fails=0;FC.login.msg=''}
    else{FC.login.fails++;FC.login.msg='รหัสผ่านไม่ถูกต้อง';if(FC.login.fails>=5)FC.login.locked=true}
  }
  else if(a==='pw2'){
    const v=(fcId('fcpw2')||{}).value||'';
    if(v.length<8||!/[A-Za-z]/.test(v)||!/\d/.test(v))FC.login.msg='รหัสใหม่ไม่ผ่านเกณฑ์ (อย่างน้อย 8 ตัว มีตัวอักษรและตัวเลข)';
    else if(v==='Ubu@2026')FC.login.msg='ห้ามใช้รหัสเดิม';
    else{FC.login.pw2=true;FC.login.msg=''}
  }
  else if(a==='saveqs'){FC.qs.rpassOk=((fcId('fcrp')||{}).value||'').length>=8;FC.qs.saved=true}
  else if(a==='sw'){const S=FC.sw;S[k]=!S[k];S.log.push(k+(S[k]?'_on':'_off'));if(S.log.length>20)S.log.shift()}
  else if(a==='alloff'){FC.sw.ac=false;FC.sw.dc=false;FC.sw.log=[]}
  else if(a==='report'){fcReport();return}
  else if(a==='reset'){fcReset()}
  fcRender();touch();
}
function fcReset(){
  Object.assign(FC,{step:0,pre:[],meas:{},fixed:false,method:'',ssid:'',fault:FC.fault0,login:{fails:0,locked:false,ok:false,pw2:false,msg:''},qs:{gc:'',omode:'',tz:'',net:'',router:'',apc:'',rpassOk:false,saved:false},sw:{ac:false,dc:false,log:[]}});
}
function initFusionCom(){
  const box=fcId('fupg-com');if(!box)return;
  box.addEventListener('click',e=>{
    const s=e.target.closest('[data-fcs]');if(s&&!s.disabled){FC.step=+s.dataset.fcs;fcRender();touch();return}
    const b=e.target.closest('[data-fca]');if(b)fcAct(b.dataset.fca,b.dataset.k);
  });
  box.addEventListener('change',e=>{
    const t=e.target;
    if(t.dataset.fct!=null){const i=+t.dataset.fct,k=FC.pre.indexOf(i);if(t.checked&&k<0)FC.pre.push(i);if(!t.checked&&k>=0)FC.pre.splice(k,1);fcRender();touch();return}
    if(t.dataset.fck){
      const p=t.dataset.fck;
      if(p==='fault'){FC.fault0=t.value;FC.fault=t.value;FC.fixed=false;FC.meas={};FC.sw={ac:false,dc:false,log:[]}}
      else fcSetPath(p,t.value);
      if(p.startsWith('qs.'))FC.qs.saved=false;
      fcRender();touch();
    }
  });
}
function fcSnapshot(){return JSON.parse(JSON.stringify(FC))}
function fcRestore(o){
  if(!o||typeof o!=='object')return;
  const pick=(v,list,d)=>list.includes(v)?v:d,sel=(v,L)=>L.some(x=>x[0]===v)?v:'';
  FC.step=Math.max(0,Math.min(5,+o.step||0));FC.area=pick(o.area,['PEA','MEA'],'PEA');
  FC.fault0=pick(o.fault0,['rev','over','insul','none'],'rev');FC.fault=pick(o.fault,['rev','over','insul','none'],FC.fault0);FC.fixed=!!o.fixed;
  FC.pre=Array.isArray(o.pre)?o.pre.filter(i=>Number.isInteger(i)&&i>=0&&i<FC_PRE.length):[];
  FC.meas={};if(o.meas&&typeof o.meas==='object')FC_PTS.forEach(p=>{const v=+o.meas[p[0]];if(o.meas[p[0]]!=null&&isFinite(v))FC.meas[p[0]]=v});
  FC.method=pick(o.method,['','wlan','bt','usb'],'');FC.ssid=pick(o.ssid,['','own','other'],'');
  const L=o.login||{};FC.login={fails:Math.max(0,Math.min(5,+L.fails||0)),locked:!!L.locked,ok:!!L.ok,pw2:!!L.ok&&!!L.pw2,msg:''};
  const q=o.qs||{};FC.qs={gc:sel(q.gc,FC_GC),omode:['','four','three'].includes(q.omode)?q.omode:'',tz:sel(q.tz,FC_TZ),net:sel(q.net,FC_NET),router:sel(q.router,FC_SSID),apc:sel(q.apc,FC_APC),rpassOk:!!q.rpassOk,saved:!!q.saved};
  const S=o.sw||{};FC.sw={ac:!!S.ac,dc:!!S.dc,log:Array.isArray(S.log)?S.log.filter(x=>['ac_on','dc_on','ac_off','dc_off'].includes(x)).slice(-20):[]};
}
