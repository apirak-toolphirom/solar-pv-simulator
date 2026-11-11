/* ---- access: visitor (no code) / student (name + student id + class code, checked against the roster) / teacher (TEACHER_CODE) ----
   Menu permissions come from the "เมนู" sheet through the Apps Script web app. Without SUBMIT_URL everything stays open (offline use).
   The page lock is a front door; anything that changes the teacher's data (submit, Drive, history) is checked again by the web app. */
const ACC_KEY='pvsim:acc';
const ACC={enabled:false,role:'visitor',menus:null,checking:false};
const accToday=()=>{try{return new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Bangkok'})}catch(e){return new Date().toISOString().slice(0,10)}};
const ACC_NAME={basics:'00 แบบฝึกพื้นฐาน',equip:'02 อุปกรณ์',wiring:'03 ต่อสาย DC แผง',ac:'04 ต่อสาย AC ระบบ',pv:'07 จำลองแผง',site:'08 ไซต์และเงา',load:'09 จำลองโหลด',backup:'10 จำลองการไหลของไฟ',systems:'11 จำลองระบบ 4 แบบ',events:'12 จำลองเหตุการณ์',bench:'05 ชุดทดลองวงจร DC',submit:'21 ส่งงาน',fusion:'17 Huawei FusionSolar',deye:'18 Deye Commissioning',accouple:'19 AC Coupling',smartload:'20 Smart Load',cable:'06 สายไฟและเบรกเกอร์',library:'01 คลังความรู้',solis:'15 Solis Commissioning',lfp:'16 แบต LiFePO4 + JK-BMS',calc:'13 คำนวณความคุ้มค่า',eit:'14 ออกแบบระบบไฟฟ้า วสท.'};
/* menus the teacher opens on purpose: hidden from students until the "เมนู" sheet has a row that opens them (also before an older Code.gs adds the row) */
const ACC_HIDDEN=['solis','lfp','calc','eit','deye','accouple','smartload'];
/* menus that need a signed-in student or the teacher, whatever the sheet says (never open to visitors, nor offline) */
const ACC_SIGNED=[];
function accPerm(t){
  if(ACC_SIGNED.includes(t)&&ACC.role!=='student'&&ACC.role!=='teacher')return'closed';
  if(!ACC.enabled||ACC.role==='teacher')return'open';
  const m=ACC.menus&&ACC.menus.find(x=>x.tab===t);
  if(ACC.role==='student')return m?m.student:ACC_HIDDEN.includes(t)?'closed':'open';
  if(m)return m.visitor;
  return t==='backup'||t==='basics'?'open':'closed';/* before the list arrives (or an older sheet without this row): default visitor menus */
}
const accAllowed=t=>accPerm(t)!=='closed';
function accFirst(){return TABS.find(accAllowed)||'backup'}
async function accPost(o){const r=await fetch(CFG.SUBMIT_URL,{method:'POST',body:JSON.stringify(o),redirect:'follow'});return r.json()}
function accSave(){try{localStorage.setItem(ACC_KEY,JSON.stringify(ACC.role==='student'?{role:'student',day:accToday(),name:MEMBER.name,sid:MEMBER.sid}:{}))}catch(e){}}
function accBar(){
  const b=document.getElementById('accbar');if(!b)return;
  if(!ACC.enabled){b.hidden=true;return}
  b.hidden=false;
  const vis=TABS.filter(t=>accPerm(t)!=='closed').map(t=>ACC_NAME[t]);
  if(ACC.role==='visitor'){
    b.className='accbar visitor';
    const gm=!!CFG.GOOGLE_CLIENT_ID;
    b.innerHTML=`<div class="accrow"><b>ผู้เยี่ยมชม</b><span class="hint tight">ดูได้เฉพาะ ${esc(vis.join(', ')||'—')} · ${gm?'ผู้เรียนเข้าสู่ระบบด้วยบัญชี Google ที่ผู้สอนลงทะเบียนไว้ในรายชื่อ':'ผู้เรียนกรอกข้อมูลเพื่อเริ่มใช้งานทุกเมนูที่เปิด'}</span></div>
      ${gm?`<div class="accrow"><div id="accgbtn" class="accg"></div></div>
      <div class="accrow accform"><span class="accsep" style="margin-left:0">ผู้สอน</span><input id="acctc" type="password" placeholder="รหัสผู้สอน" autocomplete="current-password"><button class="btn" id="acctgo">เข้าโหมดผู้สอน</button></div>`
      :`<div class="accrow accform"><input id="accname" placeholder="ชื่อ-นามสกุล" autocomplete="off" value=""><input id="accsid" placeholder="รหัสผู้เรียน" autocomplete="off" value=""><input id="acccls" type="password" placeholder="รหัสห้องอบรม" autocomplete="off" value=""><button class="btn pri" id="accgo">เข้าใช้งาน</button>
      <span class="accsep">ผู้สอน</span><input id="acctc" type="password" placeholder="รหัสผู้สอน" autocomplete="current-password"><button class="btn" id="acctgo">เข้าโหมดผู้สอน</button></div>`}
      <p class="simmsg" id="accmsg" role="status" hidden></p>`;
    if(gm)accRenderG();
  }else if(ACC.role==='student'){
    b.className='accbar student';
    b.innerHTML=`<div class="accrow"><b>ผู้เรียน: ${esc(MEMBER.name)}${MEMBER.sid?' · '+esc(MEMBER.sid):''}${CFG.GOOGLE_CLIENT_ID&&MEMBER.gemail?' · '+esc(MEMBER.gemail):''}</b><span class="hint tight">${CFG.GOOGLE_CLIENT_ID?'เข้าสู่ระบบด้วย Google แล้ว (รีโหลดหน้าแล้วระบบเข้าให้เองถ้าเคยอนุญาต)':'ใช้งานได้ถึงสิ้นวันนี้'} · เมนูที่ผู้สอนยังไม่เปิดจะซ่อนหรือดูได้อย่างเดียว</span><button class="btn sm" id="accout">ออกจากระบบ</button></div>`;
  }else{
    b.className='accbar teacher';
    b.innerHTML=`<div class="accrow"><b>โหมดผู้สอน</b><span class="hint tight">เห็นและใช้ได้ทุกเมนู · ตั้งเปิด/ปิดเมนูและใบงานที่หน้า <a href="dashboard.html" target="_blank" rel="noopener">สรุปงานส่ง</a></span><button class="btn sm" id="accout">ออกจากโหมดผู้สอน</button></div>`;
  }
}
/* the class code is never left on a shared lab computer once the student is not signed in */
function accForget(all){
  MEMBER.cls='';if(all){MEMBER.name='';MEMBER.sid=''}
  ['mcls'].concat(all?['mname','msid']:[]).forEach(id=>{const e=document.getElementById(id);if(e)e.value=''});
  try{lsSet(MEM_KEY,MEMBER)}catch(e){}if(typeof whoUpdate==='function')whoUpdate();
}
function accMsg(t,cls){const m=document.getElementById('accmsg');if(!m)return;m.textContent=t;m.className='simmsg'+(cls?' '+cls:'');m.hidden=!t}
function accApply(){
  accBar();
  if(typeof HW!=='undefined'&&typeof hwRole==='function'&&!hwRole()){HW.files=[];HW.day=null}
  document.querySelectorAll('.navb[data-tab]').forEach(b=>{b.hidden=!accAllowed(b.dataset.tab)});
  if(typeof navSync==='function')navSync();
  TABS.forEach(t=>{
    const sec=document.getElementById('tab-'+t);if(!sec)return;
    const ro=ACC.enabled&&accPerm(t)==='view';
    sec.classList.toggle('ro',ro);
    let ban=sec.querySelector(':scope>.robanner');
    if(ro&&!ban){ban=document.createElement('p');ban.className='robanner';ban.textContent='ดูได้อย่างเดียว: ผู้สอนยังไม่เปิดเมนูนี้ให้ใช้งาน';const h=sec.querySelector(':scope>header');(h||sec.firstChild).after(ban)}
    if(ban)ban.hidden=!ro;
    [...sec.children].forEach(c=>{if(c.tagName==='HEADER'||c.classList.contains('ctxbar')||c.classList.contains('robanner'))return;if(ro)c.setAttribute('inert','');else c.removeAttribute('inert')});
  });
  const rs=document.getElementById('resetall');if(rs)rs.hidden=ACC.enabled&&ACC.role==='visitor';
  if(typeof curTab!=='undefined'&&!accAllowed(curTab))showTab(accFirst());
}
async function accStudent(name,sid,cls,quiet){
  if(!name||!(sid||(MEMBER.gemail&&gToken))){accMsg('กรอกชื่อ-นามสกุล และรหัสผู้เรียน','err');return false}
  if(!quiet)accMsg('กำลังตรวจสอบ…');
  try{
    const j=await accPost({action:'access',name,sid,cls,idToken:gToken});
    if(!j||!j.ok){if(!quiet)accMsg((j&&j.error)||'เข้าใช้งานไม่ได้','err');return false}
    if(!j.role){if(!quiet)accMsg('Apps Script ยังเป็นโค้ดเวอร์ชันเก่า ผู้สอนต้องวาง Code.gs ล่าสุดแล้ว Deploy → New version','err');return null}
    ACC.role=j.role==='teacher'?'teacher':'student';if(Array.isArray(j.menus))ACC.menus=j.menus;
    const nm=j.name||name,sd=CFG.GOOGLE_CLIENT_ID&&j.sid!=null?j.sid:sid;
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v};set('mname',nm);set('msid',sd);set('mcls',cls);
    if(typeof readMember==='function')readMember();
    accSave();accApply();if(typeof wsMine==='function')wsMine().then(()=>{if(typeof wsRender==='function')wsRender()});
    return true;
  }catch(e){if(!quiet)accMsg('เชื่อมต่อระบบของผู้สอนไม่ได้ ตรวจอินเทอร์เน็ต','err');return null}
}
/* Google mode (GOOGLE_CLIENT_ID set): the student signs in with Google; the web app accepts only an e-mail that is in the roster */
function accRenderG(n){
  const h=document.getElementById('accgbtn');if(!h||!CFG.GOOGLE_CLIENT_ID)return;
  if(window.GSI_READY&&window.google&&google.accounts&&google.accounts.id){try{google.accounts.id.renderButton(h,{theme:'outline',size:'large',text:'signin_with',locale:'th'})}catch(e){}return}
  if((n||0)<25)setTimeout(()=>accRenderG((n||0)+1),400);
}
async function accGoogle(){
  if(!ACC.enabled||ACC.role==='teacher'||!CFG.GOOGLE_CLIENT_ID)return;
  if(ACC.role==='student'){accApply();return}
  accMsg('กำลังตรวจรายชื่อ…');
  await accStudent(MEMBER.gname||MEMBER.gemail,'','',false);/* on failure the reason stays in #accmsg and the visitor bar (with the Google button) stays as is */
}
function accTeacher(on){
  if(!ACC.enabled)return;
  if(on)ACC.role='teacher';
  else{const s=(()=>{try{return JSON.parse(localStorage.getItem(ACC_KEY)||'{}')}catch(e){return{}}})();ACC.role=s.role==='student'&&s.day===accToday()?'student':'visitor'}
  accApply();
}
async function accRefreshMenus(){try{const j=await accPost({action:'menus'});if(j&&j.ok&&Array.isArray(j.menus)){ACC.menus=j.menus;accApply()}}catch(e){}}
async function initAccess(){
  ACC.enabled=false;accBar();
  if(!CFG.SUBMIT_URL){accApply();return}
  /* locked from the first paint: a visitor sees only the default menu (07) even while the web app is slow or unreachable */
  ACC.enabled=true;
  const s=(()=>{try{return JSON.parse(localStorage.getItem(ACC_KEY)||'{}')}catch(e){return{}}})();
  if(typeof TEACH!=='undefined'&&(TEACH.on||TEACH.lvl))ACC.role='teacher';
  else if(!CFG.GOOGLE_CLIENT_ID&&s.role==='student'&&s.day===accToday())ACC.role='student';
  if(ACC.role==='visitor')accForget(true);
  accApply();
  accRefreshMenus();
  const bar=document.getElementById('accbar');
  bar.addEventListener('click',async e=>{
    if(e.target.id==='accgo'){const v=id=>document.getElementById(id).value.trim();await accStudent(v('accname'),v('accsid'),v('acccls'))}
    else if(e.target.id==='acctgo'){const c=document.getElementById('acctc').value.trim();if(!c){accMsg('กรอกรหัสผู้สอน','err');return}accMsg('กำลังตรวจรหัส…');
      const ok=typeof teachVerify==='function'?await teachVerify(c,true):false;if(ok){ACC.role='teacher';accApply()}else accMsg('รหัสผู้สอนไม่ถูกต้อง หรือยังไม่ได้ตั้ง TEACHER_CODE','err')}
    else if(e.target.id==='accout'){
      if(ACC.role==='teacher'){if(typeof TEACH!=='undefined'){TEACH.on=false;TEACH.lvl='';try{sessionStorage.removeItem('pv.tcode')}catch(_){}if(typeof teachSync==='function')teachSync()}}
      if(CFG.GOOGLE_CLIENT_ID){gToken='';MEMBER.gemail='';MEMBER.gname='';try{google.accounts.id.disableAutoSelect()}catch(_){}}
      ACC.role='visitor';accForget(true);accSave();accApply();
    }
  });
  bar.addEventListener('keydown',e=>{if(e.key!=='Enter')return;if(e.target.id==='acctc')document.getElementById('acctgo').click();else if(e.target.closest('.accform')&&e.target.id!=='acctc')document.getElementById('accgo').click()});
  /* a saved student unlock is checked again: changed class code or removal from the roster locks the page */
  if(ACC.role==='student'&&MEMBER.name){const ok=await accStudent(MEMBER.name,MEMBER.sid,MEMBER.cls,true);if(ok===false){ACC.role='visitor';accForget(true);accSave();accApply()}}
}
