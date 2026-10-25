/**
 * รับผลสรุปการส่งงานจากเว็บจำลองโซลาร์ แล้วเพิ่มเป็นแถวใน Google Sheets
 * วิธีติดตั้งดู apps-script/README.md
 *
 * Script properties ที่ตั้งได้ (Project Settings > Script properties):
 *   CLASS_CODE        รหัสห้องอบรม ถ้าตั้งไว้ ผู้เรียนต้องกรอกให้ตรงจึงจะบันทึก
 *   GOOGLE_CLIENT_ID  ถ้าใช้ปุ่ม Google Sign-in ให้ใส่ Client ID เดียวกับ js/config.js
 *   DRIVE_FOLDER_ID   ID ของโฟลเดอร์ Drive ที่เก็บไฟล์โปรเจ็คของผู้เรียน (ใช้กับปุ่ม บันทึก/โหลดจาก Drive)
 *   TEACHER_CODE      รหัสผู้สอน ใช้เปิดหน้า dashboard.html (สรุปงานส่ง) ถ้าไม่ตั้ง หน้า dashboard จะใช้ไม่ได้
 */
var SHEET_NAME = 'Submissions';
var HEADERS = ['เวลาที่รับ', 'รหัสใบส่งงาน', 'ชื่อ', 'รหัสผู้เรียน', 'Google (ยืนยันแล้ว)', 'Google (แจ้งเอง)',
  'ผลต่อสาย', 'ไม่ผ่าน', 'ควรระวัง', 'แผงที่ใช้', 'แผงทั้งหมด', 'kWp', 'DC/AC', 'รูปแบบการต่อ',
  'แผง', 'อินเวอร์เตอร์', 'แบตเตอรี่', 'ผลิตต่อวัน kWh', 'โหลดต่อวัน kWh',
  'โหมด Backup', 'ผล Backup', 'สรุป Backup', 'ไฟขาด kWh', 'ข้อที่ต้องตรวจ', 'เวลาที่ส่งจากเครื่อง', 'ผลต่อสาย AC', 'ข้อผิดพลาด AC', 'เหตุการณ์ที่จำลอง', 'ไซต์และเงา',
  'ใบงาน', 'ชื่อใบงาน', 'ผ่านเกณฑ์ใบงาน', 'เกณฑ์ที่ยังไม่ผ่าน', 'คำตอบ', 'ภาพ'];

// ---- ใบงาน: แผ่น "ใบงาน" ผู้สอนแก้ได้ในชีตหรือในหน้า dashboard.html ----
// สถานะ: auto = เปิดตามวันที่ (ว่าง = ไม่จำกัด) · เปิด · ปิด
// เกณฑ์คั่นด้วย ; เช่น dc_pass;panels>=8;dcac=0.9-1.5 · คำถามคั่นด้วย | · ภาพ: dc / ac / site / bench / none
var WS_SHEET = 'ใบงาน';
var WS_HEAD = ['รหัส', 'ชื่อใบงาน', 'เมนู', 'เปิดวันที่', 'ปิดวันที่', 'สถานะ', 'เกณฑ์', 'คำถาม', 'ภาพ'];
var WS_DEF = [
  ['W00', 'แบบฝึกพื้นฐาน 15 หัวข้อ', 'basics', '', '', 'ปิด', 'basics_done>=15', '', 'none'],
  ['W1', 'อุปกรณ์และต่อสาย DC', 'equip,wiring', '', '', 'ปิด', 'dc_pass;panels>=8;dcac=0.9-1.5', 'ทำไมต่ออนุกรมเกินจำนวนที่ระบบแนะนำไม่ได้|ต่อขนานกับต่ออนุกรมให้แรงดันและกระแสต่างกันอย่างไร', 'dc'],
  ['W2', 'ต่อสาย AC และพอร์ตอินเวอร์เตอร์', 'ac', '', '', 'ปิด', 'ac_pass', 'ทำไมห้ามต่อพอร์ต BACKUP เข้าตู้เมนที่มีไฟกริด', 'ac'],
  ['W3', 'กำลังผลิตและเงา', 'pv,site', '', '', 'ปิด', 'pv_sim;site_pv;site_on;shade<=15', 'แผงของคุณถูกบังช่วงเวลาไหน เพราะอะไร และจะแก้อย่างไร', 'site'],
  ['W4', 'โหลดและ Backup', 'load,backup', '', '', 'ปิด', 'loads>=5;bk_outage>=6;bk_ok', 'โหลดสำคัญที่เลือกมีอะไรบ้าง ทำไมเลือก', 'none'],
  ['W5', 'เลือกระบบ On-grid / Off-grid / Hybrid', 'systems', '', '', 'ปิด', 'sys_seen', 'บ้านตัวอย่างควรใช้ระบบแบบไหน เพราะอะไร', 'none'],
  ['W6', 'จำลองเหตุการณ์', 'events', '', '', 'ปิด', 'ev_any', 'เหตุการณ์ไหนทำให้ไฟหายมากที่สุด จะป้องกันหรือแก้อย่างไร', 'none'],
  ['W7', 'วงจร DC 12 / 24 / 48 V', 'bench', '', '', 'ปิด', 'bench_pass', 'ทำไมต้องมีฟิวส์หรือเบรกเกอร์ระหว่างแบตกับอุปกรณ์', 'bench'],
  ['W0', 'ส่งรวม (ทุกเมนู)', '', '', '', 'ปิด', '', '', 'dc']
];
function wsSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sh = ss.getSheetByName(WS_SHEET);
  if (!sh) {
    sh = ss.insertSheet(WS_SHEET);
    sh.getRange(1, 1, 1, WS_HEAD.length).setValues([WS_HEAD]).setFontWeight('bold');
    sh.getRange(2, 1, WS_DEF.length, WS_HEAD.length).setValues(WS_DEF);
    sh.setFrozenRows(1);
    sh.getRange(2, 4, WS_DEF.length, 2).setNumberFormat('yyyy-mm-dd');
    sh.getRange(2, 6, 50, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['auto', 'เปิด', 'ปิด'], true).build());
  } else {
    // ใบงานใหม่ที่เพิ่มในโค้ดภายหลัง (เช่น W00) ถูกเพิ่มต่อท้ายถ้ายังไม่มีในแผ่น · ใบงานที่ผู้สอนลบเองจะไม่ถูกเพิ่มกลับ ยกเว้น W00 ครั้งแรก
    var n = sh.getLastRow() - 1, have = n > 0 ? sh.getRange(2, 1, n, 1).getValues().map(function (r) { return String(r[0]).trim(); }) : [];
    var p = PropertiesService.getScriptProperties();
    if (have.indexOf('W00') < 0 && p.getProperty('WS_W00_ADDED') !== '1') { sh.appendRow(WS_DEF[0]); p.setProperty('WS_W00_ADDED', '1'); }
  }
  return sh;
}
function ymd_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, 'Asia/Bangkok', 'yyyy-MM-dd');
  v = String(v || '').trim(); var m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(v);
  return m ? m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2) : '';
}
function wsList_() {
  var sh = wsSheet_(), n = sh.getLastRow() - 1; if (n < 1) return [];
  var today = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd');
  return sh.getRange(2, 1, n, WS_HEAD.length).getValues().filter(function (r) { return String(r[0]).trim(); }).map(function (r) {
    var st = String(r[5] || 'auto').trim(), a = ymd_(r[3]), b = ymd_(r[4]);
    var open = st === 'เปิด' ? true : st === 'ปิด' ? false : (!a || today >= a) && (!b || today <= b);
    return { id: String(r[0]).trim(), name: String(r[1]), tabs: String(r[2]), start: a, end: b, status: st, crit: String(r[6]), q: String(r[7]), img: String(r[8] || 'none'), open: open };
  });
}
function wsSet_(d, props) {
  var tc = props.getProperty('TEACHER_CODE');
  if (!tc || s_(d.tcode, 80) !== tc) { Utilities.sleep(1500); return json_({ ok: false, error: 'รหัสผู้สอนไม่ถูกต้อง' }); }
  var st = s_(d.status, 10); if (['auto', 'เปิด', 'ปิด'].indexOf(st) < 0) return json_({ ok: false, error: 'สถานะไม่ถูกต้อง' });
  var sh = wsSheet_(), n = sh.getLastRow() - 1, ids = n > 0 ? sh.getRange(2, 1, n, 1).getValues() : [];
  for (var i = 0; i < ids.length; i++) if (String(ids[i][0]).trim() === s_(d.id, 20)) { sh.getRange(i + 2, 6).setValue(st); return json_({ ok: true, ws: wsList_() }); }
  return json_({ ok: false, error: 'ไม่พบใบงาน' });
}
// ---- เมนู: แผ่น "เมนู" กำหนดว่าแต่ละเมนูเปิดให้ผู้เรียนแบบไหน และผู้เยี่ยมชม (ไม่มีรหัส) เห็นเมนูไหน ----
// สถานะ: auto = เปิดเมื่อมีใบงานที่เปิดรับใช้เมนูนี้ (ไม่มี = ซ่อน ยกเว้นเมนูที่ผู้เยี่ยมชมเห็น) · ส่งงาน auto = เปิดเมื่อมีใบงานเปิดอยู่ · เปิด · ดูอย่างเดียว · ปิด
var MENU_SHEET = 'เมนู';
var MENU_HEAD = ['เมนู', 'ชื่อ', 'สถานะ', 'ผู้เยี่ยมชม'];
var MENU_DEF = [['basics', '00 แบบฝึกพื้นฐาน'], ['equip', '01 อุปกรณ์'], ['wiring', '02 ต่อสาย DC แผง'], ['ac', '03 ต่อสาย AC ระบบ'], ['pv', '04 จำลองแผง'], ['site', '05 ไซต์และเงา'],
  ['load', '06 จำลองโหลด'], ['backup', '07 จำลองการไหลของไฟ'], ['systems', '08 จำลองระบบ 4 แบบ'], ['events', '09 จำลองเหตุการณ์'], ['bench', '10 ชุดทดลองวงจร DC'], ['submit', '11 ส่งงาน'], ['fusion', '12 Huawei FusionSolar'], ['cable', '13 สายไฟและเบรกเกอร์'], ['library', '14 คลังความรู้']]
  // 13 สายไฟและเบรกเกอร์ เป็นเครื่องมืออ้างอิง: เปิดให้ผู้เรียนเป็นค่าเริ่มต้น
  .map(function (m) { return [m[0], m[1], m[0] === 'cable' || m[0] === 'library' ? 'เปิด' : 'auto', m[0] === 'backup' || m[0] === 'basics' ? 'ใช่' : 'ไม่']; });
// เมนูที่ต้องลงชื่อ (ผู้เรียน/ผู้สอน) เสมอ: ผู้เยี่ยมชมไม่เห็นแม้ติ๊ก "ผู้เยี่ยมชม" = ใช่
var MENU_SIGNED = [];
function menuSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sh = ss.getSheetByName(MENU_SHEET);
  if (!sh) {
    sh = ss.insertSheet(MENU_SHEET);
    sh.getRange(1, 1, 1, MENU_HEAD.length).setValues([MENU_HEAD]).setFontWeight('bold');
    sh.getRange(2, 1, MENU_DEF.length, MENU_HEAD.length).setValues(MENU_DEF);
    sh.setFrozenRows(1);
    sh.getRange(2, 3, 20, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['auto', 'เปิด', 'ดูอย่างเดียว', 'ปิด'], true).build());
    sh.getRange(2, 4, 20, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['ใช่', 'ไม่'], true).build());
  } else {
    // แผ่นที่สร้างไว้ก่อนมีเมนูใหม่ (เช่น 00 แบบฝึกพื้นฐาน): เพิ่มแถวที่ยังไม่มีต่อท้าย
    var n = sh.getLastRow() - 1, have = n > 0 ? sh.getRange(2, 1, n, 1).getValues().map(function (r) { return String(r[0]).trim(); }) : [];
    MENU_DEF.forEach(function (m) { if (have.indexOf(m[0]) < 0) sh.appendRow(m); });
  }
  return sh;
}
// สิทธิ์ของแต่ละเมนู: student = ผู้เรียนที่ปลดล็อกแล้ว · visitor = ผู้ไม่มีรหัส ('open' | 'view' | 'closed')
function menus_() {
  var sh = menuSheet_(), n = sh.getLastRow() - 1, rows = n > 0 ? sh.getRange(2, 1, n, MENU_HEAD.length).getValues() : [];
  var used = {}, anyOpen = false; wsList_().forEach(function (w) { if (w.open) anyOpen = true; if (w.open && w.id !== 'W0') String(w.tabs).split(',').forEach(function (t) { used[t.trim()] = 1; }); });
  var conv = function (st) { return st === 'เปิด' ? 'open' : st === 'ดูอย่างเดียว' ? 'view' : st === 'ปิด' ? 'closed' : ''; };
  return rows.filter(function (r) { return String(r[0]).trim(); }).map(function (r) {
    var k = String(r[0]).trim(), st = String(r[2] || 'auto').trim(), c = conv(st);
    if (MENU_SIGNED.indexOf(k) >= 0) r[3] = 'ไม่';
    return { tab: k, name: String(r[1]), status: st, visitorOn: String(r[3]).trim() === 'ใช่',
      student: c || (used[k] || (k === 'submit' && anyOpen) || String(r[3]).trim() === 'ใช่' ? 'open' : 'closed'), visitor: String(r[3]).trim() === 'ใช่' ? (c === 'closed' ? 'closed' : c === 'view' ? 'view' : 'open') : 'closed' };
  });
}
function menuSet_(d, props) {
  var tc = props.getProperty('TEACHER_CODE');
  if (!tc || s_(d.tcode, 80) !== tc) { Utilities.sleep(1500); return json_({ ok: false, error: 'รหัสผู้สอนไม่ถูกต้อง' }); }
  var sh = menuSheet_(), n = sh.getLastRow() - 1, ids = n > 0 ? sh.getRange(2, 1, n, 1).getValues() : [];
  for (var i = 0; i < ids.length; i++) if (String(ids[i][0]).trim() === s_(d.tab, 20)) {
    if (d.status != null) { var st = s_(d.status, 20); if (['auto', 'เปิด', 'ดูอย่างเดียว', 'ปิด'].indexOf(st) < 0) return json_({ ok: false, error: 'สถานะไม่ถูกต้อง' }); sh.getRange(i + 2, 3).setValue(st); }
    if (d.visitor != null) sh.getRange(i + 2, 4).setValue(d.visitor ? 'ใช่' : 'ไม่');
    return json_({ ok: true, menus: menus_() });
  }
  return json_({ ok: false, error: 'ไม่พบเมนู' });
}

// ---- รายชื่อลงทะเบียน: แผ่น "รายชื่อ" (หรือชีตอื่นที่ตั้ง ROSTER_SHEET_ID / ROSTER_SHEET_NAME) ----
// ถ้ารายชื่อว่าง จะไม่ตรวจ (ผู้ที่รู้รหัสห้องใช้งานได้ทุกคน)
var ROSTER_SHEET = 'รายชื่อ';
var ROSTER_HEAD = ['รหัสผู้เรียน', 'ชื่อ-นามสกุล', 'อีเมล Google', 'สถานะ'];
function roster_(props) {
  var id = props.getProperty('ROSTER_SHEET_ID'), sh;
  if (id) { var ext = SpreadsheetApp.openById(id), nm = props.getProperty('ROSTER_SHEET_NAME'); sh = nm ? ext.getSheetByName(nm) : ext.getSheets()[0]; }
  else {
    var ss = SpreadsheetApp.getActiveSpreadsheet(); sh = ss.getSheetByName(ROSTER_SHEET);
    if (!sh) { sh = ss.insertSheet(ROSTER_SHEET); sh.getRange(1, 1, 1, ROSTER_HEAD.length).setValues([ROSTER_HEAD]).setFontWeight('bold'); sh.setFrozenRows(1); }
  }
  if (!sh || sh.getLastRow() < 2) return null;
  var v = sh.getRange(1, 1, sh.getLastRow(), sh.getLastColumn()).getValues(), h = v[0].map(function (x) { return String(x); });
  var find = function (re) { for (var i = 0; i < h.length; i++) if (re.test(h[i])) return i; return -1; };
  var iS = find(/รหัส|student|id/i), iE = find(/อีเมล|email/i), iA = find(/สถานะ|status/i);
  if (iS < 0) iS = 0;
  var list = [];
  for (var r = 1; r < v.length; r++) {
    var sid = String(v[r][iS] || '').trim(), em = iE >= 0 ? String(v[r][iE] || '').trim().toLowerCase() : '', st = iA >= 0 ? String(v[r][iA] || '').trim() : '';
    if ((sid || em) && st !== 'ระงับ') list.push({ sid: sid, email: em });
  }
  return list.length ? list : null;
}
function inRoster_(d, verified, props) {
  var L = roster_(props); if (!L) return true;
  var sid = s_(d.sid, 30).trim(), em = String(verified || '').toLowerCase();
  return L.some(function (x) { return (sid && x.sid === sid) || (em && x.email === em); });
}

// ภาพรายงานของใบงาน เก็บในโฟลเดอร์ "ภาพงานส่ง" ใต้ DRIVE_FOLDER_ID (ถ้าตั้งไว้)
function saveImg_(d, props, receipt) {
  var fid = props.getProperty('DRIVE_FOLDER_ID'), m = /^data:image\/(png|jpeg);base64,(.+)$/.exec(String(d.img || ''));
  if (!fid || !m || m[2].length > 6000000) return '';
  var root = DriveApp.getFolderById(fid), it = root.getFoldersByName('ภาพงานส่ง'), f = it.hasNext() ? it.next() : root.createFolder('ภาพงานส่ง');
  var name = [s_(d.ws, 10), s_(d.sid || d.name, 40).replace(/[^A-Za-z0-9ก-๙@._-]+/g, '_'), receipt].join('_') + (m[1] === 'png' ? '.png' : '.jpg');
  return f.createFile(Utilities.newBlob(Utilities.base64Decode(m[2]), 'image/' + m[1], name)).getUrl();
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function s_(v, n) { return String(v == null ? '' : v).slice(0, n || 200); }
// กันสูตรใน Sheets (ค่าที่ขึ้นต้นด้วย = + - @ จะถูกนำหน้าด้วย ')
function safe_(v) { v = s_(v, 2000); return /^[=+\-@]/.test(v) ? "'" + v : v; }

function doGet() { return json_({ ok: true, service: 'solar-pv-simulator' }); }

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var d = JSON.parse(e.postData.contents);
    var props = PropertiesService.getScriptProperties();

    if (d.action === 'ws') return json_({ ok: true, ws: wsList_() });
    if (d.action === 'menus') return json_({ ok: true, menus: menus_() });
    if (d.action === 'menuset') return menuSet_(d, props);
    if (d.action === 'access' && d.tcode) {
      var tc0 = props.getProperty('TEACHER_CODE');
      if (tc0 && s_(d.tcode, 80) === tc0) return json_({ ok: true, role: 'teacher', menus: menus_() });
      Utilities.sleep(1500); return json_({ ok: false, error: 'รหัสผู้สอนไม่ถูกต้อง' });
    }
    if (d.action === 'wsset') return wsSet_(d, props);
    if (d.action === 'dash') return dash_(d, props);
    if (d.action === 'tcheck') {
      var tc = props.getProperty('TEACHER_CODE');
      if (!tc) return json_({ ok: false, tcheck: true, error: 'ผู้สอนยังไม่ได้ตั้ง TEACHER_CODE ใน Script properties' });
      if (s_(d.tcode, 80) !== tc) { Utilities.sleep(1500); return json_({ ok: false, tcheck: true, error: 'รหัสผู้สอนไม่ถูกต้อง' }); }
      return json_({ ok: true, tcheck: true });
    }

    var code = props.getProperty('CLASS_CODE');
    if (code && s_(d.cls, 60) !== code) return json_({ ok: false, error: 'รหัสห้องอบรมไม่ถูกต้อง' });
    if (!s_(d.name, 100)) return json_({ ok: false, error: 'ไม่มีชื่อ' });

    var verified = '';
    if (d.idToken) {
      var r = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(d.idToken),
        { muteHttpExceptions: true });
      if (r.getResponseCode() === 200) {
        var t = JSON.parse(r.getContentText());
        var cid = props.getProperty('GOOGLE_CLIENT_ID');
        if ((!cid || t.aud === cid) && t.email_verified !== 'false') verified = t.email;
      }
    }

    if (!inRoster_(d, verified, props)) return json_({ ok: false, error: 'ไม่พบรหัสผู้เรียนนี้ในรายชื่อลงทะเบียน ติดต่อผู้สอน' });
    if (d.action === 'access') return json_({ ok: true, role: 'student', menus: menus_() });
    if (d.action === 'save' || d.action === 'load') return cloud_(d, verified, props);
    if (d.action === 'mine') return mine_(d, verified);

    // ใบงานต้องเปิดรับอยู่
    var wsInfo = null;
    if (d.ws) {
      wsInfo = wsList_().filter(function (w) { return w.id === s_(d.ws, 20); })[0];
      if (!wsInfo) return json_({ ok: false, error: 'ไม่พบใบงาน ' + s_(d.ws, 20) });
      if (!wsInfo.open) return json_({ ok: false, error: 'ใบงาน ' + wsInfo.id + ' ปิดรับแล้ว' });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sh.getLastRow() > 0 && sh.getLastColumn() < HEADERS.length) sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    if (sh.getLastRow() === 0) {
      sh.appendRow(HEADERS);
      sh.setFrozenRows(1);
      sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    }
    // กันส่งซ้ำ: รหัสใบส่งงานเดียวกันบันทึกครั้งเดียว
    var receipt = s_(d.receipt, 20);
    if (receipt && sh.getLastRow() > 1) {
      var ids = sh.getRange(2, 2, sh.getLastRow() - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) if (ids[i][0] === receipt) return json_({ ok: true, dup: true });
    }

    sh.appendRow([
      new Date(), receipt, safe_(d.name), safe_(d.sid), verified, safe_(d.gemail),
      s_(d.lvl, 10), Number(d.err) || 0, Number(d.warn) || 0, Number(d.used) || 0, Number(d.panels) || 0,
      Number(d.kwp) || 0, Number(d.ratio) || 0, safe_(d.topo),
      safe_(d.panel), safe_(d.inverter), safe_(d.battery), d.pvKwh === '' ? '' : Number(d.pvKwh) || 0, Number(d.loadKwh) || 0,
      s_(d.bkMode, 10), s_(d.bkLvl, 10), safe_(d.bkText), Number(d.bkUnmet) || 0,
      safe_((d.issues || []).slice(0, 15).join('\n')), safe_(d.t),
      s_(d.acLvl, 10), Number(d.acErr) || 0, safe_(d.evText), safe_(d.siteText),
      s_(d.ws, 20), safe_(d.wsName), d.ws ? (d.wsPass === true ? 'ผ่าน' : 'ยังไม่ครบ') : '', safe_((d.wsFail || []).slice(0, 10).join('\n')),
      safe_((d.answers || []).slice(0, 5).join('\n')), d.ws ? saveImg_(d, props, receipt) : ''
    ]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: 'เซิร์ฟเวอร์ผิดพลาด' });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

// ---- เก็บโปรเจ็คของผู้เรียนใน Google Drive ของผู้สอน (1 ไฟล์ต่อผู้เรียน) ----
// คีย์ไฟล์ = อีเมล Google ที่ยืนยันแล้ว ถ้าไม่มีใช้รหัสผู้เรียน (ถ้าไม่ล็อกอิน Google คนที่รู้รหัสห้องและรหัสผู้เรียนของคนอื่นเขียนทับได้
// ประวัติเวอร์ชันของ Drive ยังย้อนกลับได้)
function cloud_(d, verified, props) {
  var fid = props.getProperty('DRIVE_FOLDER_ID');
  if (!fid) return json_({ ok: false, error: 'ผู้สอนยังไม่ได้ตั้ง DRIVE_FOLDER_ID' });
  var key = verified || s_(d.sid, 30);
  if (!key) return json_({ ok: false, error: 'ต้องกรอกรหัสผู้เรียน หรือล็อกอิน Google' });
  var safeKey = key.replace(/[^A-Za-z0-9ก-๙@._-]+/g, '_').slice(0, 60);
  var safeName = s_(d.name, 60).replace(/[^A-Za-z0-9ก-๙@._ -]+/g, '').trim().replace(/\s+/g, ' ');
  var fname = safeKey + (safeName ? ' - ' + safeName : '') + '.json';
  var folder = DriveApp.getFolderById(fid);
  // หาไฟล์เดิมจากรหัส (ขึ้นต้นด้วย "รหัส.json" หรือ "รหัส - ") เพื่อไม่ให้เกิดไฟล์ซ้ำเมื่อชื่อเปลี่ยน
  var file = null, it = folder.searchFiles("title contains '" + safeKey + "' and trashed = false");
  while (it.hasNext()) {
    var f = it.next(), n = f.getName();
    if (n === safeKey + '.json' || n.indexOf(safeKey + ' - ') === 0) { file = f; break; }
  }
  if (d.action === 'load') {
    if (!file) return json_({ ok: true, cloud: true, found: false });
    return json_({ ok: true, cloud: true, found: true, saved: file.getLastUpdated().toISOString(), data: file.getBlob().getDataAsString('UTF-8') });
  }
  var data = typeof d.data === 'string' ? d.data : JSON.stringify(d.data || {});
  if (data.length > 1500000) return json_({ ok: false, error: 'ไฟล์โปรเจ็คใหญ่เกินไป' });
  var wrapped = JSON.stringify({ name: s_(d.name, 100), sid: s_(d.sid, 30), email: verified, saved: new Date().toISOString(), project: JSON.parse(data) });
  if (file) { file.setContent(wrapped); if (file.getName() !== fname) file.setName(fname); } else folder.createFile(fname, wrapped, 'application/json');
  return json_({ ok: true, cloud: true, file: fname });
}

// ---- หน้า dashboard ของผู้สอน: ส่งข้อมูลในชีตกลับไป เมื่อรหัสผู้สอน (TEACHER_CODE) ถูกต้อง ----
function dash_(d, props) {
  var tcode = props.getProperty('TEACHER_CODE');
  if (!tcode) return json_({ ok: false, error: 'ผู้สอนยังไม่ได้ตั้ง TEACHER_CODE ใน Script properties' });
  if (s_(d.tcode, 80) !== tcode) { Utilities.sleep(1500); return json_({ ok: false, error: 'รหัสผู้สอนไม่ถูกต้อง' }); }
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sh || sh.getLastRow() < 2) return json_({ ok: true, dash: true, headers: HEADERS, rows: [], ws: wsList_(), menus: menus_(), roster: (roster_(props) || []).length });
  var n = sh.getLastRow() - 1, start = Math.max(2, sh.getLastRow() - 4999);
  var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var vals = sh.getRange(start, 1, sh.getLastRow() - start + 1, sh.getLastColumn()).getValues();
  var rows = vals.map(function (r) { return r.map(function (v) { return v instanceof Date ? v.toISOString() : v; }); });
  return json_({ ok: true, dash: true, headers: head, rows: rows, total: n, at: new Date().toISOString(), ws: wsList_(), menus: menus_(), roster: (roster_(props) || []).length });
}

// ---- ประวัติใบงานของผู้เรียนเอง (ตามอีเมล Google ที่ยืนยันแล้ว หรือรหัสผู้เรียน) ----
function mine_(d, verified) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sh || sh.getLastRow() < 2) return json_({ ok: true, mine: [] });
  var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0], ix = function (n) { return head.indexOf(n); };
  var iT = ix('เวลาที่รับ'), iS = ix('รหัสผู้เรียน'), iG = ix('Google (ยืนยันแล้ว)'), iW = ix('ใบงาน'), iP = ix('ผ่านเกณฑ์ใบงาน');
  if (iW < 0) return json_({ ok: true, mine: [] });
  var key = verified || s_(d.sid, 30); if (!key) return json_({ ok: true, mine: [] });
  var vals = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues(), out = [];
  for (var i = vals.length - 1; i >= 0 && out.length < 100; i--) {
    var r = vals[i]; if (!r[iW]) continue;
    if ((verified && r[iG] === verified) || (!verified && String(r[iS]) === key))
      out.push({ ws: String(r[iW]), pass: r[iP] === 'ผ่าน', t: r[iT] instanceof Date ? Utilities.formatDate(r[iT], 'Asia/Bangkok', 'dd/MM HH:mm') : '' });
  }
  return json_({ ok: true, mine: out });
}
