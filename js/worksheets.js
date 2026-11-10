/* ---- worksheets (ใบงาน): what to do in which tabs, automatic pass criteria, questions, image to attach ----
   The list comes from the "ใบงาน" sheet through the Apps Script web app (teacher edits it there or in dashboard.html).
   WS_DEFAULT is used when no web app is set or it cannot be reached. Criteria are written as keys separated by ";". */
const WS_DEFAULT=[
  {id:'W00',name:'แบบฝึกพื้นฐาน 15 หัวข้อ',tabs:'basics',crit:'basics_done>=15',q:'',img:'none'},
  {id:'W1',name:'อุปกรณ์และต่อสาย DC',tabs:'equip,wiring',crit:'dc_pass;panels>=8;dcac=0.9-1.5',q:'ทำไมต่ออนุกรมเกินจำนวนที่ระบบแนะนำไม่ได้|ต่อขนานกับต่ออนุกรมให้แรงดันและกระแสต่างกันอย่างไร',img:'dc'},
  {id:'W2',name:'ต่อสาย AC และพอร์ตอินเวอร์เตอร์',tabs:'ac',crit:'ac_pass',q:'ทำไมห้ามต่อพอร์ต BACKUP เข้าตู้เมนที่มีไฟกริด',img:'ac'},
  {id:'W3',name:'กำลังผลิตและเงา',tabs:'pv,site',crit:'pv_sim;site_pv;site_on;shade<=15',q:'แผงของคุณถูกบังช่วงเวลาไหน เพราะอะไร และจะแก้อย่างไร',img:'site'},
  {id:'W4',name:'โหลดและ Backup',tabs:'load,backup',crit:'loads>=5;bk_outage>=6;bk_ok',q:'โหลด Backup ที่เลือกมีอะไรบ้าง ทำไมเลือก',img:'none'},
  {id:'W5',name:'เลือกระบบ On-grid / Off-grid / Hybrid',tabs:'systems',crit:'sys_seen',q:'บ้านตัวอย่างควรใช้ระบบแบบไหน เพราะอะไร',img:'none'},
  {id:'W6',name:'จำลองเหตุการณ์',tabs:'events',crit:'ev_any',q:'เหตุการณ์ไหนทำให้ไฟหายมากที่สุด จะป้องกันหรือแก้อย่างไร',img:'none'},
  {id:'W7',name:'วงจร DC 12 / 24 / 48 V',tabs:'bench',crit:'bench_pass',q:'ทำไมต้องมีฟิวส์หรือเบรกเกอร์ระหว่างแบตกับอุปกรณ์',img:'bench'},
  {id:'W8',name:'Commissioning Solis Hybrid',tabs:'solis',crit:'solis_done>=1;solis_diag>=1',q:'ทำไมต้องวัดแรงดันและขั้ว PV ก่อนเปิด DC switch|ถ้า CT ติดกลับทิศ ค่าบนจอและการชาร์จแบตจะผิดอย่างไร',img:'none',open:false,status:'ปิด'},
  {id:'W9',name:'สายไฟและเบรกเกอร์',tabs:'cable',crit:'cable_ok>=2',q:'เลือกขนาดสาย AC ของอินเวอร์เตอร์ได้กี่ mm² เพราะอะไร|ทำไมเบรกเกอร์ฝั่ง DC ต้องใช้รุ่นสำหรับ DC ไม่ใช้เบรกเกอร์ AC แทน',img:'none',open:false,status:'ปิด'},
  {id:'W10',name:'คำนวณความคุ้มค่า',tabs:'calc',crit:'calc_done',q:'บ้านตัวอย่างควรติดกี่ kWp และคืนทุนกี่ปี|ถ้าใช้ไฟกลางวันน้อยลง ความคุ้มค่าเปลี่ยนอย่างไร เพราะอะไร',img:'none',open:false,status:'ปิด'},
  {id:'W11',name:'ออกแบบระบบไฟฟ้า วสท.',tabs:'eit',crit:'eit_circ>=5;eit_ok',q:'เบรกเกอร์เมนของบ้านที่ออกแบบขนาดเท่าไร คิดจากอะไร|ทำไมวงจรเต้ารับในห้องน้ำต้องมี RCD',img:'none',open:false,status:'ปิด'},
  {id:'W12',name:'แบต LiFePO4 + JK-BMS',tabs:'lfp',crit:'lfp_layout;lfp_wire;lfp_bms',q:'ทำไมต้องต่อบัสบาร์ + ของเซลล์หนึ่งเข้า − ของเซลล์ถัดไป|ค่า OVP / UVP ของเซลล์ LiFePO4 ที่ตั้งไว้เท่าไร เพราะอะไร',img:'none',open:false,status:'ปิด'},
  {id:'W13',name:'อ่าน log Huawei FusionSolar',tabs:'fusion',crit:'hw_file>=1',q:'จาก log วันที่เลือก ระบบผลิตไฟได้กี่ kWh และมีแจ้งเตือนอะไรบ้าง|ถ้าเจอแจ้งเตือน Low insulation resistance ควรตรวจอะไรก่อน',img:'none',open:false,status:'ปิด'},
  {id:'W14',name:'Commissioning Huawei SUN2000',tabs:'fusion',crit:'fc_pre;fc_con;fc_qs;fc_on;fc_ver',q:'ผลวัดก่อนเปิดเครื่องของคุณเจอความผิดปกติอะไร ดูจากค่าไหน และแก้อย่างไร (ถ้ารอบของคุณปกติ ให้อธิบายว่าค่าไหนบอกว่าปกติ)|ทำไมต้องเปิดเบรกเกอร์ AC ก่อนสวิตช์ DC และทำไมต้องเลือก Grid code ให้ตรงเขตการไฟฟ้า|ถ้า LED ของ Smart Dongle เป็นสีแดงกะพริบเร็ว หมายถึงอะไร และต้องกลับไปแก้ค่าไหน',img:'none',open:false,status:'ปิด'},
  {id:'W0',name:'ส่งรวม (ทุกเมนู)',tabs:'',crit:'',q:'',img:'dc'}
].map(w=>Object.assign({open:true,status:'auto',start:'',end:''},w));
const WS_IMG={dc:'svg',ac:'acsvg',site:'siplan',bench:'bnsvg',none:''};
const TAB_NAME={basics:'00 แบบฝึกพื้นฐาน',equip:'02 อุปกรณ์',wiring:'03 ต่อสาย DC',ac:'04 ต่อสาย AC',pv:'07 จำลองแผง',site:'08 ไซต์และเงา',load:'09 จำลองโหลด',backup:'10 การไหลของไฟ',systems:'11 ระบบ 4 แบบ',events:'12 เหตุการณ์',bench:'05 วงจร DC',solis:'15 Solis Commissioning',lfp:'16 แบต LiFePO4 + JK-BMS',calc:'13 คำนวณความคุ้มค่า',eit:'14 ออกแบบระบบไฟฟ้า วสท.'};
let WS=WS_DEFAULT.slice(),WSSEL=null,WSSRC='default',WS_MINE=null;
window.SY_SEEN=false;

/* each criterion: [label, test() -> true/false/null(can't check)] */
function wsCrit(key){
  const A=typeof lastA!=='undefined'?lastA:null,m=/^([a-z_]+)\s*(>=|<=|=)?\s*([\d.\-]+)?$/.exec(key.trim());
  if(!m)return[`${key} (ผู้สอนตรวจเอง)`,null];
  const k=m[1],n=parseFloat(m[3]);
  switch(k){
    case'dc_pass':return['ต่อสาย DC ไม่มีข้อผิดพลาด',!!(A&&A.used>0&&A.cnt.err===0)];
    case'panels':return[`ใช้แผงอย่างน้อย ${n} แผง`,!!(A&&A.used>=n)];
    case'dcac':{const[lo,hi]=String(m[3]).split('-').map(Number);return[`DC/AC อยู่ระหว่าง ${lo}–${hi}${A&&A.used?` (ตอนนี้ ${f(A.ratio,2)})`:''}`,!!(A&&A.used&&A.ratio>=lo&&A.ratio<=hi)]}
    case'ac_pass':{if(typeof acRender==='function')acRender();const c=window.lastAC;return['ต่อสาย AC ไม่มีข้อผิดพลาด',!!(c&&c.lvl!=='idle'&&c.nE===0)]}
    case'pv_sim':return['มีผลจำลองกำลังผลิต (ต่อสายผ่าน)',!!(A&&A.used>0&&A.lvl!=='err')];
    case'site_pv':return['วางแผงโซลาร์บนผังไซต์',typeof siteHasPV==='function'&&siteHasPV()];
    case'site_on':return['เปิด "ใช้เงาจากผังไซต์"',typeof EV!=='undefined'&&EV.site.on];
    case'shade':{if(typeof siteHasPV!=='function'||!siteHasPV())return[`แผงถูกบังไม่เกิน ${n}%`,false];
      const R=wsShade();return[`แผงถูกบังไม่เกิน ${n}% เฉลี่ยทั้งปี (ตอนนี้ ${f(R,0)}%)`,R<=n]}
    case'loads':{const c=typeof LOADS!=='undefined'?LOADS.filter(l=>l.w>0&&l.qty>0).length:0;return[`มีโหลดอย่างน้อย ${n} รายการ (ตอนนี้ ${c})`,c>=n]}
    case'bk_outage':return[`ตั้งไฟดับอย่างน้อย ${n} ชม. ในระบบที่มีแบต`,typeof BK!=='undefined'&&BK.outDur>=n&&BK.mode!=='grid'];
    case'bk_ok':{if(typeof backupRun==='function')backupRun();const b=window.lastBK;return['ไฟดับแล้วโหลดที่เลือกไม่ขาดไฟ',!!(b&&b.mode!=='grid'&&(b.unmet||0)<=0.005)]}
    case'sys_seen':return['เปิดดูแท็บระบบ 4 แบบ',!!window.SY_SEEN];
    case'ev_any':return['เปิดเหตุการณ์อย่างน้อย 1 อย่าง',typeof evActive==='function'&&evActive()];
    case'basics_done':{const c=typeof b0Count==='function'?b0Count():0,ms=typeof b0Missing==='function'?b0Missing():[];return[`แบบฝึก 00 ผ่านอย่างน้อย ${n} หัวข้อ (ตอนนี้ ${c}${ms.length&&c<n?' · ยังไม่ผ่าน '+ms.join(', '):''})`,c>=n]}
    case'solis_done':{const c=typeof slDoneCount==='function'?slDoneCount():0;return[`Commissioning Solis ผ่านครบอย่างน้อย ${n} ระบบ (ตอนนี้ ${c}/4)`,c>=n]}
    case'solis_diag':{const c=typeof SL!=='undefined'?SL.diagOk:0;return[`โจทย์หาข้อผิดพลาด Solis ผ่านอย่างน้อย ${n} โจทย์ (ตอนนี้ ${c})`,c>=n]}
    case'bench_pass':{const b=window.lastBN;return['ต่อวงจร DC ผ่าน ไม่มีข้อผิดพลาด',!!(b&&b.lvl==='ok')]}
    case'cable_ok':{const c=typeof cbWsCount==='function'?cbWsCount():{n:0,pages:[]};return[`คำนวณสายไฟ/เบรกเกอร์ไม่มีข้อไม่ผ่าน อย่างน้อย ${n} หน้า จาก AC · DC แผง · DC แบต · เบรกเกอร์ (ปรับค่าเองแล้ว ตอนนี้ ${c.n}${c.pages.length?' · '+c.pages.join(', '):''})`,c.n>=n]}
    case'calc_done':{const c=window.lastCALC;return[c?`คำนวณความคุ้มค่าด้วยค่าที่ปรับเอง (ค่าไฟ ${c.bill} บาท/เดือน · ${c.kwp} kWp${c.payback?` · คืนทุน ${f(c.payback,1)} ปี`:''})`:'คำนวณความคุ้มค่าด้วยค่าที่ปรับเอง (เปิดเมนู 13 แล้วปรับค่าไฟหรือขนาดระบบ)',!!(c&&c.user)]}
    case'eit_circ':{const c=window.lastEIT;return[`ออกแบบวงจรย่อยของบ้านเองอย่างน้อย ${n} วงจร (${c?`ตอนนี้ ${c.nC}${c.user?'':' · ยังเป็นแบบตัวอย่าง ต้องแก้หรือเพิ่มวงจรเอง'}`:'เปิดเมนู 14 ก่อนส่ง'})`,!!(c&&c.user&&c.nC>=n)]}
    case'eit_ok':{const c=window.lastEIT;return[`ผลตรวจตาม วสท. ไม่มีข้อไม่ผ่าน${c&&c.err?` (ตอนนี้ ${c.err} ข้อ)`:''}`,!!(c&&c.nC>0&&c.err===0)]}
    case'lfp_layout':{const c=window.lastLFP;return[`จัดวางเซลล์ลงตู้ผ่าน${c?'':' (เปิดเมนู 16 ก่อนส่ง)'}`,!!(c&&c.lay)]}
    case'lfp_wire':{const c=window.lastLFP;return['ต่อบัสบาร์และสาย BMS ผ่าน (แพ็กทำงาน)',!!(c&&c.wire)]}
    case'lfp_bms':{const c=window.lastLFP;return['ตั้งค่า JK-BMS ผ่าน',!!(c&&c.bms)]}
    case'fc_pre':case'fc_con':case'fc_qs':case'fc_on':case'fc_ver':{
      const g={fc_pre:['pre','ตรวจและวัดก่อนเปิดเครื่อง'],fc_con:['con','เชื่อมต่อแอปและล็อกอิน'],fc_qs:['qs','Quick settings'],fc_on:['pw','เปิดเครื่องถึง On-grid'],fc_ver:['ve','ตรวจหลังเดินเครื่อง']}[k];
      const L=typeof fcChecks==='function'?fcChecks()[g[0]]:[],c=L.filter(x=>x[0]).length;
      return[`Commissioning Huawei: ${g[1]} ผ่านครบ (ตอนนี้ ${c}/${L.length||'?'})`,!!L.length&&c===L.length]}
    case'hw_file':{const c=typeof HW!=='undefined'?HW.files.length:0;return[`นำเข้าไฟล์ log Huawei อย่างน้อย ${n} ไฟล์ (ตอนนี้ ${c})`,c>=n]}
  }
  return[`${key} (ผู้สอนตรวจเอง)`,null];
}
function wsShade(){if(typeof siAnalyse!=='function')return 100;const keep=SITE.period;SITE.period='year';siAllSteps.k=null;const A=siAnalyse();SITE.period=keep;siAllSteps.k=null;if(!A.arrays.length)return 100;return Math.max(...A.arrays.map(r=>r.sun>0?r.blk/r.sun*100:0))}
const wsQs=w=>String(w.q||'').split('|').map(s=>s.trim()).filter(Boolean);
const wsTabs=w=>String(w.tabs||'').split(',').map(s=>s.trim()).filter(t=>TAB_NAME[t]);
const wsAnsKey=id=>'pvsim:ans:'+id;
function wsAnswers(w){const a=lsGet(wsAnsKey(w.id));return Array.isArray(a)?a:[]}
function wsEval(w){
  if(!w)return{items:[],pass:true,fail:[]};
  const items=String(w.crit||'').split(';').map(s=>s.trim()).filter(Boolean).map(k=>{const[l,ok]=wsCrit(k);return{l,ok}});
  const qs=wsQs(w);
  if(qs.length){const a=wsAnswers(w),n=qs.filter((_,i)=>String(a[i]||'').trim().length>=10).length;items.push({l:`ตอบคำถามครบ ${qs.length} ข้อ (ข้อละอย่างน้อย 10 ตัวอักษร) · ตอบแล้ว ${n}`,ok:n===qs.length})}
  const fail=items.filter(i=>i.ok===false).map(i=>i.l);
  return{items,pass:!fail.length,fail};
}
async function wsLoad(){
  if(!CFG.SUBMIT_URL){WS=WS_DEFAULT.slice();WSSRC='default';return}
  try{
    const r=await fetch(CFG.SUBMIT_URL,{method:'POST',body:JSON.stringify({action:'ws'}),redirect:'follow'}),j=await r.json();
    if(j&&j.ok&&Array.isArray(j.ws)&&j.ws.length){WS=j.ws.map(w=>Object.assign({tabs:'',crit:'',q:'',img:'none'},w));WSSRC='sheet'}
    else{WS=WS_DEFAULT.slice();WSSRC=j&&j.ok===false?'default':'old'}
  }catch(e){WS=WS_DEFAULT.slice();WSSRC='offline'}
}
async function wsMine(){
  WS_MINE=null;
  if(!CFG.SUBMIT_URL||WSSRC!=='sheet'||!MEMBER.name||!(MEMBER.sid||(MEMBER.gemail&&gToken)))return;/* older Code.gs would store 'mine' as a submission */
  try{
    const r=await fetch(CFG.SUBMIT_URL,{method:'POST',body:JSON.stringify({action:'mine',name:MEMBER.name,sid:MEMBER.sid,cls:MEMBER.cls,idToken:gToken}),redirect:'follow'}),j=await r.json();
    if(j&&j.ok&&Array.isArray(j.mine))WS_MINE=j.mine;
  }catch(e){}
}
function wsCur(){return WS.find(w=>w.id===WSSEL)||null}
function wsRender(){
  const sel=$('#wssel');if(!sel)return;
  const keep=WSSEL;
  sel.innerHTML=WS.map(w=>`<option value="${esc(w.id)}" ${w.open?'':'disabled'}>${esc(w.id)} · ${esc(w.name)}${w.open?'':' (ปิดรับ)'}</option>`).join('');
  if(!WS.some(w=>w.id===keep&&w.open)){const o=WS.find(w=>w.open);WSSEL=o?o.id:null}
  sel.value=WSSEL||'';
  const w=wsCur();
  $('#wssrc').textContent=WSSRC==='sheet'?'รายการใบงานจากผู้สอน':WSSRC==='old'?'ใช้ใบงานมาตรฐาน (Apps Script ยังเป็นโค้ดเวอร์ชันเก่า)':WSSRC==='offline'?'ใช้ใบงานมาตรฐาน (เชื่อมต่อผู้สอนไม่ได้)':'ใช้ใบงานมาตรฐาน (ยังไม่ได้ตั้งระบบรับงาน)';
  if(!w){$('#wsbody').innerHTML='<p class="hint">ยังไม่มีใบงานที่เปิดรับ</p>';return}
  const E=wsEval(w),tabs=wsTabs(w),qs=wsQs(w),ans=wsAnswers(w);
  const when=w.start||w.end?`เปิด ${w.start||'—'} ถึง ${w.end||'—'}`:'';
  $('#wsbody').innerHTML=`<div class="wshead"><b>${esc(w.name)}</b><span class="pill ${E.pass?'ok':'warn'}">${E.pass?'✓ ครบเกณฑ์':'! ยังไม่ครบ '+E.fail.length+' ข้อ'}</span>${when?`<span class="hint tight">${esc(when)}</span>`:''}</div>
    ${tabs.length?`<div class="wstabs"><span class="lab">ทำในเมนู</span>${tabs.map(t=>`<button class="chip" data-go="${t}">${TAB_NAME[t]}</button>`).join('')}</div>`:''}
    ${E.items.length?`<ul class="checks">${E.items.map(i=>`<li><span class="b ${i.ok===null?'idle':i.ok?'ok':'warn'}">${i.ok===null?'?':i.ok?'✓':'!'}</span><span>${esc(i.l)}</span></li>`).join('')}</ul>`:'<p class="hint tight">ใบงานนี้ไม่มีเกณฑ์ตรวจอัตโนมัติ</p>'}
    ${qs.map((q,i)=>`<label class="wsq">คำถาม ${i+1}: ${esc(q)}<textarea data-wq="${i}" rows="2" maxlength="600">${esc(ans[i]||'')}</textarea></label>`).join('')}
    <p class="hint tight">${w.img&&WS_IMG[w.img]?'แนบภาพ: '+({dc:'ผังต่อสาย DC',ac:'ผังต่อสาย AC',site:'ผังไซต์และเงา',bench:'วงจร DC'}[w.img])+' ไปกับรายงาน':'ใบงานนี้ไม่แนบภาพผัง'}</p>`;
  wsHist();
}
function wsHist(){
  const h=$('#wshist');if(!h)return;
  const subs=lsGet(SUBS_KEY)||[],srv=WS_MINE;
  const rows=WS.filter(w=>w.id!=='W0').map(w=>{
    const s=srv?srv.filter(x=>x.ws===w.id):subs.filter(x=>x.ws===w.id);
    const last=s[0],pass=last&&(srv?last.pass:last.pass);
    return`<tr><td>${esc(w.id)} ${esc(w.name)}</td><td>${w.open?'<span class="pill ok">เปิด</span>':'<span class="pill idle">ปิด</span>'}</td><td>${last?(pass?'<span class="pill ok">✓ ผ่าน</span>':'<span class="pill warn">! ส่งแล้ว ยังไม่ครบ</span>'):'<span class="pill idle">– ยังไม่ส่ง</span>'}</td><td class="mono">${last?esc(last.when||last.t||''):''}</td></tr>`;
  }).join('');
  h.innerHTML=`<thead><tr><th>ใบงาน</th><th>สถานะ</th><th>ผลล่าสุด</th><th>เวลา</th></tr></thead><tbody>${rows}</tbody>`;
  $('#wshsrc').textContent=srv?'ข้อมูลจากระบบของผู้สอน':'ข้อมูลจากเครื่องนี้ (กรอกชื่อ รหัส และรหัสห้อง เพื่อดูจากระบบของผู้สอน)';
}
async function initWorksheets(){
  const sel=$('#wssel');if(!sel)return;
  sel.addEventListener('change',e=>{WSSEL=e.target.value;wsRender();if(typeof submitRefresh==='function')submitRefresh()});
  $('#wsbody').addEventListener('input',e=>{const t=e.target.closest('[data-wq]');if(!t)return;const w=wsCur();if(!w)return;const a=wsAnswers(w);a[+t.dataset.wq]=t.value.slice(0,600);lsSet(wsAnsKey(w.id),a);
    clearTimeout(initWorksheets.t);initWorksheets.t=setTimeout(()=>{const p=document.activeElement,i=p&&p.dataset?p.dataset.wq:null,pos=p&&p.selectionStart;wsRender();if(i!=null){const n=document.querySelector(`[data-wq="${i}"]`);if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(_){}}}},600)});
  $('#wsbody').addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b&&typeof showTab==='function')showTab(b.dataset.go)});
  $('#wsreload').addEventListener('click',async()=>{await wsLoad();readMember();await wsMine();wsRender()});
  wsRender();
  await wsLoad();await wsMine();wsRender();
}
