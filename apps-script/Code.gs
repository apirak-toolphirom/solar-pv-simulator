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
  'โหมด Backup', 'ผล Backup', 'สรุป Backup', 'ไฟขาด kWh', 'ข้อที่ต้องตรวจ', 'เวลาที่ส่งจากเครื่อง', 'ผลต่อสาย AC', 'ข้อผิดพลาด AC', 'เหตุการณ์ที่จำลอง'];

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function s_(v, n) { return String(v == null ? '' : v).slice(0, n || 200); }
// กันสูตรใน Sheets (ค่าที่ขึ้นต้นด้วย = + - @ จะถูกนำหน้าด้วย ')
function safe_(v) { v = s_(v, 500); return /^[=+\-@]/.test(v) ? "'" + v : v; }

function doGet() { return json_({ ok: true, service: 'solar-pv-simulator' }); }

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var d = JSON.parse(e.postData.contents);
    var props = PropertiesService.getScriptProperties();

    if (d.action === 'dash') return dash_(d, props);

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

    if (d.action === 'save' || d.action === 'load') return cloud_(d, verified, props);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
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
      s_(d.acLvl, 10), Number(d.acErr) || 0, safe_(d.evText)
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
  if (!sh || sh.getLastRow() < 2) return json_({ ok: true, dash: true, headers: HEADERS, rows: [] });
  var n = sh.getLastRow() - 1, start = Math.max(2, sh.getLastRow() - 4999);
  var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var vals = sh.getRange(start, 1, sh.getLastRow() - start + 1, sh.getLastColumn()).getValues();
  var rows = vals.map(function (r) { return r.map(function (v) { return v instanceof Date ? v.toISOString() : v; }); });
  return json_({ ok: true, dash: true, headers: head, rows: rows, total: n, at: new Date().toISOString() });
}
