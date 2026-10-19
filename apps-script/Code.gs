/**
 * รับผลสรุปการส่งงานจากเว็บจำลองโซลาร์ แล้วเพิ่มเป็นแถวใน Google Sheets
 * วิธีติดตั้งดู apps-script/README.md
 *
 * Script properties ที่ตั้งได้ (Project Settings > Script properties):
 *   CLASS_CODE        รหัสห้องอบรม ถ้าตั้งไว้ ผู้เรียนต้องกรอกให้ตรงจึงจะบันทึก
 *   GOOGLE_CLIENT_ID  ถ้าใช้ปุ่ม Google Sign-in ให้ใส่ Client ID เดียวกับ js/config.js
 */
var SHEET_NAME = 'Submissions';
var HEADERS = ['เวลาที่รับ', 'รหัสใบส่งงาน', 'ชื่อ', 'รหัสผู้เรียน', 'Google (ยืนยันแล้ว)', 'Google (แจ้งเอง)',
  'ผลต่อสาย', 'ไม่ผ่าน', 'ควรระวัง', 'แผงที่ใช้', 'แผงทั้งหมด', 'kWp', 'DC/AC', 'รูปแบบการต่อ',
  'แผง', 'อินเวอร์เตอร์', 'แบตเตอรี่', 'ผลิตต่อวัน kWh', 'โหลดต่อวัน kWh',
  'โหมด Backup', 'ผล Backup', 'สรุป Backup', 'ไฟขาด kWh', 'ข้อที่ต้องตรวจ', 'เวลาที่ส่งจากเครื่อง'];

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
      safe_((d.issues || []).slice(0, 15).join('\n')), safe_(d.t)
    ]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: 'เซิร์ฟเวอร์ผิดพลาด' });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}
