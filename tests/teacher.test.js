/* บัญชีครู (ไม่ใช่ admin): admin กรอกรหัส · ครูเข้าด้วยอีเมล Google ที่อยู่ในแผ่น "ครู" · ครูนำเข้า/เพิ่มรายชื่อไม่ได้ */
const vm=require('vm'),fs=require('fs'),path=require('path');
const code=fs.readFileSync(path.join(__dirname,'..','apps-script','Code.gs'),'utf8');
function mkSheet(rows){return{getLastRow:()=>rows.length,getLastColumn:()=>4,getRange:(r,c,n,m)=>({getValues:()=>rows.slice(r-1,r-1+(n||1)).map(x=>x.slice(c-1,c-1+(m||1)))})}}
const sheets={'ครู':mkSheet([['ชื่อครู','อีเมลครู','สถานะ'],['ครูเอ','Teacher.A@ubu.ac.th','ใช้งาน'],['ครูบี','closed@ubu.ac.th','ปิด'],['ครูซี','teacher.c@ubu.ac.th','']])};
const props={TEACHER_CODE:'ADMIN-1',GOOGLE_CLIENT_ID:'cid-123'};
/* tokens are fake: "tok:<email>:<aud>" is answered like Google's tokeninfo endpoint */
const fetch=u=>{const t=decodeURIComponent(u.split('id_token=')[1]).split(':');if(t[0]!=='tok')return{getResponseCode:()=>400,getContentText:()=>'{}'};
  return{getResponseCode:()=>200,getContentText:()=>JSON.stringify({email:t[1],aud:t[2],email_verified:'true',name:'x'})}};
const ctx={SpreadsheetApp:{getActiveSpreadsheet:()=>({getSheetByName:n=>sheets[n]||null})},UrlFetchApp:{fetch},Utilities:{sleep(){}},
  PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]||null})},ContentService:{createTextOutput:t=>({t,setMimeType(){return this}}),MimeType:{JSON:1}},LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},console};
vm.createContext(ctx);vm.runInContext(code,ctx);
const P=ctx.PropertiesService.getScriptProperties(),lv=vm.runInContext('teacherLevel_',ctx);
const got={
  admin:lv({tcode:'ADMIN-1'},P),
  teacherEmail:lv({idToken:'tok:teacher.a@ubu.ac.th:cid-123'},P),      /* case-insensitive e-mail match */
  teacherBlankStatus:lv({idToken:'tok:teacher.c@ubu.ac.th:cid-123'},P),
  closed:lv({idToken:'tok:closed@ubu.ac.th:cid-123'},P),
  notListed:lv({idToken:'tok:someone@gmail.com:cid-123'},P),
  wrongClient:lv({idToken:'tok:teacher.a@ubu.ac.th:other-client'},P),
  badToken:lv({idToken:'garbage'},P),
  wrongCode:lv({tcode:'nope'},P),
  emptyCall:lv({},P)};
const want={admin:'admin',teacherEmail:'teacher',teacherBlankStatus:'teacher',closed:'',notListed:'',wrongClient:'',badToken:'',wrongCode:'',emptyCall:''};
let bad=Object.keys(want).filter(k=>got[k]!==want[k]);
const r=vm.runInContext('rosterAction_',ctx);
for(const a of['rosteradd','rosterimport']){const j=JSON.parse(r({action:a,idToken:'tok:teacher.a@ubu.ac.th:cid-123',rows:[{name:'x',email:'a@b.c'}],sheet:'x'},P).t);if(j.ok)bad.push(a+' allowed for teacher')}
/* without GOOGLE_CLIENT_ID the e-mail sign-in is refused (the token audience cannot be checked) */
delete props.GOOGLE_CLIENT_ID;if(lv({idToken:'tok:teacher.a@ubu.ac.th:cid-123'},P)!=='')bad.push('teacher accepted without GOOGLE_CLIENT_ID');
if(bad.length){console.log('FAIL teacher roles:',bad.join(', '),got);process.exit(1)}
console.log('  ok  teacher roles (admin รหัส / ครู Google อีเมล / ปิด / ไม่อยู่ในแผ่น / roster admin-only)');
