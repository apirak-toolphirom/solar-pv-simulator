/* ---- worksheets (ใบงาน): what to do in which tabs, automatic pass criteria, questions, image to attach ----
   The list comes from the "ใบงาน" sheet through the Apps Script web app (teacher edits it there or in dashboard.html).
   WS_DEFAULT is used when no web app is set or it cannot be reached. Criteria are written as keys separated by ";". */
const WS_DEFAULT=[
  {id:'W1',name:'อุปกรณ์และต่อสาย DC',tabs:'equip,wiring',crit:'dc_pass;panels>=8;dcac=0.9-1.5',q:'ทำไมต่ออนุกรมเกินจำนวนที่ระบบแนะนำไม่ได้|ต่อขนานกับต่ออนุกรมให้แรงดันและกระแสต่างกันอย่างไร',img:'dc'},
  {id:'W2',name:'ต่อสาย AC และพอร์ตอินเวอร์เตอร์',tabs:'ac',crit:'ac_pass',q:'ทำไมห้ามต่อพอร์ต BACKUP เข้าตู้เมนที่มีไฟกริด',img:'ac'},
  {id:'W3',name:'กำลังผลิตและเงา',tabs:'pv,site',crit:'pv_sim;site_pv;site_on;shade<=15',q:'แผงของคุณถูกบังช่วงเวลาไหน เพราะอะไร และจะแก้อย่างไร',img:'site'},
  {id:'W4',name:'โหลดและ Backup',tabs:'load,backup',crit:'loads>=5;bk_outage>=6;bk_ok',q:'โหลด Backup ที่เลือกมีอะไรบ้าง ทำไมเลือก',img:'none'},
  {id:'W5',name:'เลือกระบบ On-grid / Off-grid / Hybrid',tabs:'systems',crit:'sys_seen',q:'บ้านตัวอย่างควรใช้ระบบแบบไหน เพราะอะไร',img:'none'},
  {id:'W6',name:'จำลองเหตุการณ์',tabs:'events',crit:'ev_any',q:'เหตุการณ์ไหนทำให้ไฟหายมากที่สุด จะป้องกันหรือแก้อย่างไร',img:'none'},
  {id:'W7',name:'วงจร DC 12 / 24 / 48 V',tabs:'bench',crit:'bench_pass',q:'ทำไมต้องมีฟิวส์หรือเบรกเกอร์ระหว่างแบตกับอุปกรณ์',img:'bench'},
  {id:'W0',name:'ส่งรวม (ทุกเมนู)',tabs:'',crit:'',q:'',img:'dc'}
].map(w=>Object.assign({open:true,status:'auto',start:'',end:''},w));
const WS_IMG={dc:'svg',ac:'acsvg',site:'siplan',bench:'bnsvg',none:''};
const TAB_NAME={equip:'01 อุปกรณ์',wiring:'02 ต่อสาย DC',ac:'03 ต่อสาย AC',pv:'04 จำลองแผง',site:'05 ไซต์และเงา',load:'06 จำลองโหลด',backup:'07 การไหลของไฟ',systems:'08 ระบบ 4 แบบ',events:'09 เหตุการณ์',bench:'10 วงจร DC'};
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
    case'bench_pass':{const b=window.lastBN;return['ต่อวงจร DC ผ่าน ไม่มีข้อผิดพลาด',!!(b&&b.lvl==='ok')]}
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
