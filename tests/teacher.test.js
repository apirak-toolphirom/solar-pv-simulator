/* บัญชีครู (ไม่ใช่ admin): ระดับสิทธิ์จากรหัส และครูต้องนำเข้า/เพิ่มรายชื่อไม่ได้ */
const vm=require('vm'),fs=require('fs');
const code=fs.readFileSync(require('path').join(__dirname,'..','apps-script','Code.gs'),'utf8');
const sheets={};
function mkSheet(rows){return{getLastRow:()=>rows.length,getLastColumn:()=>4,getRange:(r,c,n,m)=>({getValues:()=>rows.slice(r-1,r-1+(n||1)).map(x=>x.slice(c-1,c-1+(m||1)))})}}
sheets['ครู']=mkSheet([['ชื่อครู','รหัสครู','สถานะ'],['ครูเอ','teacher-77','ใช้งาน'],['ครูบี','closed-99','ปิด'],['ครูซี','abc','ใช้งาน']]);
const props={TEACHER_CODE:'ADMIN-1'};
const ctx={SpreadsheetApp:{getActiveSpreadsheet:()=>({getSheetByName:n=>sheets[n]||null})},Utilities:{sleep(){}},PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]||null})},ContentService:{createTextOutput:t=>({t,setMimeType(){return this}}),MimeType:{JSON:1}},LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},console};
vm.createContext(ctx);vm.runInContext(code,ctx);
const P=ctx.PropertiesService.getScriptProperties();
const lv=c=>vm.runInContext('teacherLevel_',ctx)({tcode:c},P);
const out={admin:lv('ADMIN-1'),teacher:lv('teacher-77'),closed:lv('closed-99'),short:lv('abc'),wrong:lv('nope'),empty:lv('')};
console.log(out);
const ok=out.admin==='admin'&&out.teacher==='teacher'&&out.closed===''&&out.short===''&&out.wrong===''&&out.empty==='';
// roster write as teacher must be refused (stub rosterTab_ to avoid sheet access)
const r=vm.runInContext('rosterAction_',ctx);
let res=JSON.parse(r({action:'rosteradd',tcode:'teacher-77',rows:[{name:'x',email:'a@b.c'}]},P).t);console.log('teacher rosteradd:',res.ok,res.error);
res=JSON.parse(r({action:'rosterimport',tcode:'teacher-77',sheet:'x'},P).t);console.log('teacher rosterimport:',res.ok,res.error);
if(!(ok&&!res.ok)){console.log('FAIL teacher roles');process.exit(1)}console.log('  ok  teacher roles (admin / ครู / รหัสปิด / รหัสสั้น / roster admin-only)');
