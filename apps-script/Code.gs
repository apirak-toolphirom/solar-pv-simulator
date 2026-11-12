/**
 * รับผลสรุปการส่งงานจากเว็บจำลองโซลาร์ แล้วเพิ่มเป็นแถวใน Google Sheets
 * วิธีติดตั้งดู apps-script/README.md
 *
 * Script properties ที่ตั้งได้ (Project Settings > Script properties):
 *   CLASS_CODE        รหัสห้องอบรม ถ้าตั้งไว้ ผู้เรียนต้องกรอกให้ตรงจึงจะบันทึก
 *   GOOGLE_CLIENT_ID  ใส่ Client ID เดียวกับ js/config.js เพื่อเปิด Google Sign-in · เมื่อตั้งค่านี้ ระบบเข้าโหมดเข้ม:
 *                     ผู้เรียนต้องเข้าด้วย Google และอีเมลต้องอยู่ในแผ่น "รายชื่อ" (ไม่รับรหัสผู้เรียนอย่างเดียว ไม่ถามรหัสห้อง)
 *   DRIVE_FOLDER_ID   ID ของโฟลเดอร์ Drive ที่เก็บไฟล์โปรเจ็คของผู้เรียน (ใช้กับปุ่ม บันทึก/โหลดจาก Drive)
 *   TEACHER_CODE      รหัส admin (ทำได้ทุกอย่าง) เฉพาะ admin ที่กรอกรหัสนี้ · ครูที่ไม่ใช่ admin เข้าด้วยอีเมล Google ที่ใส่ในแผ่น "ครู" (เมนู ⚡ ระบบโซลาร์ (ผู้สอน) > สร้างแผ่นครู) ไม่ต้องกรอกรหัส
 */
var SHEET_NAME = 'Submissions';
var HEADERS = ['เวลาที่รับ', 'รหัสใบส่งงาน', 'ชื่อ', 'รหัสผู้เรียน', 'Google (ยืนยันแล้ว)', 'Google (แจ้งเอง)',
  'ผลต่อสาย', 'ไม่ผ่าน', 'ควรระวัง', 'แผงที่ใช้', 'แผงทั้งหมด', 'kWp', 'DC/AC', 'รูปแบบการต่อ',
  'แผง', 'อินเวอร์เตอร์', 'แบตเตอรี่', 'ผลิตต่อวัน kWh', 'โหลดต่อวัน kWh',
  'โหมด Backup', 'ผล Backup', 'สรุป Backup', 'ไฟขาด kWh', 'ข้อที่ต้องตรวจ', 'เวลาที่ส่งจากเครื่อง', 'ผลต่อสาย AC', 'ข้อผิดพลาด AC', 'เหตุการณ์ที่จำลอง', 'ไซต์และเงา',
  'ใบงาน', 'ชื่อใบงาน', 'ผ่านเกณฑ์ใบงาน', 'เกณฑ์ที่ยังไม่ผ่าน', 'คำตอบ', 'ภาพ'];

// ---- ซ่อมหัวคอลัมน์ของแผ่น Submissions ให้ตรงกับโค้ดปัจจุบัน ----
// ชีตที่ใช้มาหลายเวอร์ชันมีหัวคอลัมน์สั้นกว่า (25, 28, 29 ช่อง) ทุกเวอร์ชันเพิ่มคอลัมน์ต่อท้ายเท่านั้น จึงเขียนทับแถว 1 ตามตำแหน่งได้โดยไม่กระทบข้อมูล
// ทำงานเองตอนมีการส่งงาน เปิด dashboard และดูประวัติใบงาน · สั่งเองได้จากเมนู "⚡ ระบบโซลาร์ (ผู้สอน)" ในชีต หรือรัน fixHeaders ใน Apps Script
// ไม่แตะแผ่นที่ช่อง A1 ไม่ใช่ "เวลาที่รับ" (กันเขียนทับแถวข้อมูลถ้าหัวตารางถูกลบ)
function fixHeaders_(sh) {
  if (!sh || sh.getLastRow() < 1) return false;
  var cur = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), HEADERS.length)).getValues()[0], same = true;
  if (String(cur[0]).trim() !== HEADERS[0]) return false;
  for (var i = 0; i < HEADERS.length; i++) if (String(cur[i]).trim() !== HEADERS[i]) { same = false; break; }
  if (same) return false;
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sh.setFrozenRows(1);
  return true;
}
function fixHeaders() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME), ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!sh) { ss.toast('ไม่พบแผ่น ' + SHEET_NAME, 'ระบบโซลาร์', 8); return; }
  var ch = fixHeaders_(sh);
  ss.toast(ch ? 'แก้หัวคอลัมน์ให้ตรงกับเวอร์ชันล่าสุดแล้ว (' + HEADERS.length + ' คอลัมน์)' : 'หัวคอลัมน์ตรงกับเวอร์ชันล่าสุดอยู่แล้ว (หรือ A1 ไม่ใช่ "เวลาที่รับ" จึงไม่แตะ)', 'ระบบโซลาร์', 8);
}
function onOpen() {
  try { SpreadsheetApp.getUi().createMenu('⚡ ระบบโซลาร์ (ผู้สอน)').addItem('ซ่อมหัวคอลัมน์ Submissions', 'fixHeaders').addItem('สร้างแผ่นครู (อีเมลครู)', 'makeTeacherSheet').addToUi(); } catch (e) {}
}

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
  ['W8', 'Commissioning Solis Hybrid', 'solis', '', '', 'ปิด', 'solis_done>=1;solis_diag>=1', 'ทำไมต้องวัดแรงดันและขั้ว PV ก่อนเปิด DC switch|ถ้า CT ติดกลับทิศ ค่าบนจอและการชาร์จแบตจะผิดอย่างไร', 'none'],
  ['W9', 'สายไฟและเบรกเกอร์', 'cable', '', '', 'ปิด', 'cable_ok>=2', 'เลือกขนาดสาย AC ของอินเวอร์เตอร์ได้กี่ mm² เพราะอะไร|ทำไมเบรกเกอร์ฝั่ง DC ต้องใช้รุ่นสำหรับ DC ไม่ใช้เบรกเกอร์ AC แทน', 'none'],
  ['W10', 'คำนวณความคุ้มค่า', 'calc', '', '', 'ปิด', 'calc_done', 'บ้านตัวอย่างควรติดกี่ kWp และคืนทุนกี่ปี|ถ้าใช้ไฟกลางวันน้อยลง ความคุ้มค่าเปลี่ยนอย่างไร เพราะอะไร', 'none'],
  ['W11', 'ออกแบบระบบไฟฟ้า วสท.', 'eit', '', '', 'ปิด', 'eit_circ>=5;eit_ok', 'เบรกเกอร์เมนของบ้านที่ออกแบบขนาดเท่าไร คิดจากอะไร|ทำไมวงจรเต้ารับในห้องน้ำต้องมี RCD', 'none'],
  ['W12', 'แบต LiFePO4 + JK-BMS', 'lfp', '', '', 'ปิด', 'lfp_layout;lfp_wire;lfp_bms', 'ทำไมต้องต่อบัสบาร์ + ของเซลล์หนึ่งเข้า − ของเซลล์ถัดไป|ค่า OVP / UVP ของเซลล์ LiFePO4 ที่ตั้งไว้เท่าไร เพราะอะไร', 'none'],
  ['W13', 'อ่าน log Huawei FusionSolar', 'fusion', '', '', 'ปิด', 'hw_file>=1', 'จาก log วันที่เลือก ระบบผลิตไฟได้กี่ kWh และมีแจ้งเตือนอะไรบ้าง|ถ้าเจอแจ้งเตือน Low insulation resistance ควรตรวจอะไรก่อน', 'none'],
  ['W14', 'Commissioning Huawei SUN2000', 'fusion', '', '', 'ปิด', 'fc_pre;fc_con;fc_qs;fc_on;fc_ver', 'ผลวัดก่อนเปิดเครื่องของคุณเจอความผิดปกติอะไร ดูจากค่าไหน และแก้อย่างไร (ถ้ารอบของคุณปกติ ให้อธิบายว่าค่าไหนบอกว่าปกติ)|ทำไมต้องเปิดเบรกเกอร์ AC ก่อนสวิตช์ DC และทำไมต้องเลือก Grid code ให้ตรงเขตการไฟฟ้า|ถ้า LED ของ Smart Dongle เป็นสีแดงกะพริบเร็ว หมายถึงอะไร และต้องกลับไปแก้ค่าไหน', 'none'],
  ['W15', 'Commissioning Deye (Hybrid และ Microinverter)', 'deye', '', '', 'ปิด', 'deye_done>=1;deye_diag>=1', 'ทำไมต้องวัดแรงดันและขั้ว PV ก่อนเปิด DC switch|ถ้า CT ติดกลับทิศ ค่าบนจอและการชาร์จแบตของ Deye จะผิดอย่างไร|ทำไมต้องเปิดเบรกเกอร์สายย่อยก่อนเบรกเกอร์เมนของไมโครอินเวอร์เตอร์ และทำไมห้ามเสียบ DC ขณะถอดขั้ว AC', 'none'],
  ['W16', 'AC Coupling: ต่ออินเวอร์เตอร์ออนกริดเข้า Hybrid', 'accouple', '', '', 'ปิด', 'acc_done>=1;acc_diag>=1', 'ทำไมอินเวอร์เตอร์ AC ที่ต่อพอร์ต GEN ต้องถูกลดกำลังด้วยความถี่เมื่อไฟดับและแบตเต็ม|ถ้าเปิดกันย้อนแต่ไม่ติด CT หรือ CT อยู่ผิดตำแหน่ง จะเกิดอะไรขึ้นกับอินเวอร์เตอร์ AC|พื้นที่ห้ามขายไฟกับพื้นที่ขายไฟได้ ต้องตั้งค่า Hybrid และอินเวอร์เตอร์ AC ต่างกันอย่างไร', 'none'],
  ['W17', 'Smart Load: ชาร์จรถ EV ที่พอร์ต GEN', 'smartload', '', '', 'ปิด', 'sg_done>=2', 'ทำไมต้องตั้ง SOC ON สูงกว่า SOC OFF และถ้าตั้งเท่ากันจะเกิดอะไรขึ้น|ถ้าชาร์จรถด้วยกระแสสูงเกินไป เครื่อง Hybrid จะตัด Smart Load เพราะอะไร|ตอนไฟดับ ควรตั้งเกณฑ์ SOC OFF ของ Smart Load อย่างไร เพื่อไม่ให้โหลดบ้านดับ', 'none'],
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
    if (have.indexOf('W8') < 0 && p.getProperty('WS_W8_ADDED') !== '1') { WS_DEF.forEach(function (w) { if (w[0] === 'W8') sh.appendRow(w); }); p.setProperty('WS_W8_ADDED', '1'); }
    if (have.indexOf('W14') < 0 && p.getProperty('WS_W14_ADDED') !== '1') { WS_DEF.forEach(function (w) { if (w[0] === 'W14') sh.appendRow(w); }); p.setProperty('WS_W14_ADDED', '1'); }
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
  if (!teacherLevel_(d, props)) { Utilities.sleep(1500); return json_({ ok: false, error: 'รหัสผู้สอนไม่ถูกต้อง' }); }
  var st = s_(d.status, 10); if (['auto', 'เปิด', 'ปิด'].indexOf(st) < 0) return json_({ ok: false, error: 'สถานะไม่ถูกต้อง' });
  var sh = wsSheet_(), n = sh.getLastRow() - 1, ids = n > 0 ? sh.getRange(2, 1, n, 1).getValues() : [];
  for (var i = 0; i < ids.length; i++) if (String(ids[i][0]).trim() === s_(d.id, 20)) { sh.getRange(i + 2, 6).setValue(st); return json_({ ok: true, ws: wsList_() }); }
  return json_({ ok: false, error: 'ไม่พบใบงาน' });
}
// ---- เมนู: แผ่น "เมนู" กำหนดว่าแต่ละเมนูเปิดให้ผู้เรียนแบบไหน และผู้เยี่ยมชม (ไม่มีรหัส) เห็นเมนูไหน ----
// สถานะ: auto = เปิดเมื่อมีใบงานที่เปิดรับใช้เมนูนี้ (ไม่มี = ซ่อน ยกเว้นเมนูที่ผู้เยี่ยมชมเห็น) · ส่งงาน auto = เปิดเมื่อมีใบงานเปิดอยู่ · เปิด · ดูอย่างเดียว · ปิด
var MENU_SHEET = 'เมนู';
var MENU_HEAD = ['เมนู', 'ชื่อ', 'สถานะ', 'ผู้เยี่ยมชม'];
var MENU_DEF = [['basics', '00 แบบฝึกพื้นฐาน'], ['library', '01 คลังความรู้'], ['equip', '02 อุปกรณ์'], ['wiring', '03 ต่อสาย DC แผง'], ['ac', '04 ต่อสาย AC ระบบ'], ['bench', '05 ชุดทดลองวงจร DC'],
  ['cable', '06 สายไฟและเบรกเกอร์'], ['pv', '07 จำลองแผง'], ['site', '08 ไซต์และเงา'], ['load', '09 จำลองโหลด'], ['backup', '10 จำลองการไหลของไฟ'], ['systems', '11 จำลองระบบ 4 แบบ'], ['events', '12 จำลองเหตุการณ์'], ['calc', '13 คำนวณความคุ้มค่า'], ['eit', '14 ออกแบบระบบไฟฟ้า วสท.'], ['solis', '15 Solis Commissioning'], ['lfp', '16 แบต LiFePO4 + JK-BMS'], ['fusion', '17 Huawei FusionSolar'], ['deye', '18 Deye Commissioning'], ['accouple', '19 AC Coupling (GEN)'], ['smartload', '20 Smart Load'], ['submit', '21 ส่งงาน']]
  // 06 สายไฟและเบรกเกอร์ และ 01 คลังความรู้ เป็นเครื่องมืออ้างอิง: เปิดให้ผู้เรียนเป็นค่าเริ่มต้น
  .map(function (m) { return [m[0], m[1], m[0] === 'cable' || m[0] === 'library' ? 'เปิด' : m[0] === 'solis' || m[0] === 'lfp' || m[0] === 'calc' || m[0] === 'eit' || m[0] === 'deye' || m[0] === 'accouple' || m[0] === 'smartload' ? 'ปิด' : 'auto', m[0] === 'backup' || m[0] === 'basics' ? 'ใช่' : 'ไม่']; });
// 15 Solis Commissioning, 16 แบต LiFePO4 + JK-BMS, 18 Deye Commissioning, 19 AC Coupling, 20 Smart Load และ 13 คำนวณความคุ้มค่า: ค่าเริ่ม = ปิด (ซ่อนจากผู้เรียน) ผู้สอนเปิดเองที่ dashboard เมื่อถึงคาบที่ใช้
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
    // ชื่อเมนูตามเลขใหม่ (จัดกลุ่มเมนู 2569-10): อัปเดตคอลัมน์ชื่อ ไม่แตะสถานะที่ผู้สอนตั้งไว้
    var nm = {}; MENU_DEF.forEach(function (m) { nm[m[0]] = m[1]; });
    var n2 = sh.getLastRow() - 1, keys = n2 > 0 ? sh.getRange(2, 1, n2, 2).getValues() : [];
    keys.forEach(function (r, k) { var t = String(r[0]).trim(); if (nm[t] && String(r[1]) !== nm[t]) sh.getRange(k + 2, 2).setValue(nm[t]); });
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
  if (!teacherLevel_(d, props)) { Utilities.sleep(1500); return json_({ ok: false, error: 'รหัสผู้สอนไม่ถูกต้อง' }); }
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
// อ่านทุกแถวของรายชื่อ (รวมที่ระงับ) จากแผ่น "รายชื่อ" หรือชีตภายนอก · คืน null ถ้าไม่มีข้อมูล
function rosterRead_(props) {
  var id = props.getProperty('ROSTER_SHEET_ID'), sh;
  if (id) { var ext = SpreadsheetApp.openById(id), nm = props.getProperty('ROSTER_SHEET_NAME'); sh = nm ? ext.getSheetByName(nm) : ext.getSheets()[0]; }
  else {
    var ss = SpreadsheetApp.getActiveSpreadsheet(); sh = ss.getSheetByName(ROSTER_SHEET);
    if (!sh) { sh = ss.insertSheet(ROSTER_SHEET); sh.getRange(1, 1, 1, ROSTER_HEAD.length).setValues([ROSTER_HEAD]).setFontWeight('bold'); sh.setFrozenRows(1); }
  }
  if (!sh || sh.getLastRow() < 2) return null;
  var v = sh.getRange(1, 1, sh.getLastRow(), sh.getLastColumn()).getValues(), h = v[0].map(function (x) { return String(x); });
  var find = function (re) { for (var i = 0; i < h.length; i++) if (re.test(h[i])) return i; return -1; };
  var iS = find(/รหัส|student|id/i), iE = find(/อีเมล|email/i), iA = find(/สถานะ|status/i), iN = find(/ชื่อ|name/i);
  if (iS < 0) iS = 0;
  var list = [];
  for (var r = 1; r < v.length; r++) {
    var sid = String(v[r][iS] || '').trim(), em = iE >= 0 ? String(v[r][iE] || '').trim().toLowerCase() : '',
      st = iA >= 0 ? String(v[r][iA] || '').trim() : '', nm2 = iN >= 0 ? String(v[r][iN] || '').trim() : '';
    if (sid || em) list.push({ sid: sid, email: em, name: nm2, status: st });
  }
  return list.length ? list : null;
}
function roster_(props) {
  var all = rosterRead_(props); if (!all) return null;
  var list = all.filter(function (x) { return x.status !== 'ระงับ'; });
  return list.length ? list : null;
}
function inRoster_(d, verified, props) {
  var L = roster_(props); if (!L) return true;
  var sid = s_(d.sid, 30).trim(), em = String(verified || '').toLowerCase();
  return L.some(function (x) { return (sid && x.sid === sid) || (em && x.email === em); });
}

// ---- โหมดเข้มเมื่อตั้ง GOOGLE_CLIENT_ID: ผู้เรียนต้องยืนยันอีเมลด้วย Google และอีเมลต้องอยู่ในรายชื่อ (ไม่รับรหัสผู้เรียนอย่างเดียว ไม่ใช้รหัสห้อง) ----
function strict_(props) { return !!props.getProperty('GOOGLE_CLIENT_ID'); }
function teacherOk_(d, props) {
  if (!teacherLevel_(d, props)) { Utilities.sleep(1500); return false; }
  return true;
}
// ---- ระดับสิทธิ์ของผู้สอน ----
// admin   = กรอก TEACHER_CODE (Script properties): ทำได้ทุกอย่าง (รวมนำเข้า/เพิ่มรายชื่อ และแก้ไขรุ่นอุปกรณ์ในโปรแกรม) · มีเฉพาะ admin ที่กรอกรหัส
// teacher = เข้าสู่ระบบด้วยอีเมล Google ที่ admin ใส่ไว้ในแผ่น "ครู" (ไม่ต้องกรอกรหัส): เปิดเมนูและเนื้อหา เปิด/ปิดใบงานและแบบทดสอบ ดู dashboard และรายชื่อได้
//           แต่ไม่มีสิทธิ์แก้หรือลบข้อมูล (นำเข้า/เพิ่มรายชื่อ แก้ไขรุ่นอุปกรณ์ ฯลฯ) · ต้องตั้ง GOOGLE_CLIENT_ID ไว้ (ตรวจอีเมลกับ Google ทุกครั้ง)
var TEACHER_SHEET = 'ครู';
function googleUser_(idToken, props) {
  if (!idToken) return null;
  var r = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken), { muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) return null;
  var t = JSON.parse(r.getContentText()), cid = props.getProperty('GOOGLE_CLIENT_ID');
  if (cid && t.aud === cid && t.email_verified !== 'false' && t.email) return { email: String(t.email).toLowerCase(), name: t.name || '' };
  return null;
}
function teacherLevel_(d, props) {
  var c = s_(d.tcode, 80).trim(), tc = props.getProperty('TEACHER_CODE');
  if (c && tc && c === tc) return 'admin';
  if (!d.idToken) return '';
  var u = googleUser_(d.idToken, props);
  if (!u) return '';
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TEACHER_SHEET);
  if (!sh || sh.getLastRow() < 2) return '';
  var rows = sh.getRange(2, 1, sh.getLastRow() - 1, 3).getValues();
  for (var i = 0; i < rows.length; i++) {
    var em = String(rows[i][1]).trim().toLowerCase(), st = String(rows[i][2] || 'ใช้งาน').trim();
    if (em && em === u.email && st !== 'ปิด') return 'teacher';
  }
  return '';
}
// เมนู "⚡ ระบบโซลาร์ (ผู้สอน) > สร้างแผ่นครู": สร้างแผ่น "ครู" ให้ admin กรอกอีเมล Google ของครู (ครูเข้าด้วย Google ไม่ต้องกรอกรหัส)
function makeTeacherSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sh = ss.getSheetByName(TEACHER_SHEET);
  if (!sh) {
    sh = ss.insertSheet(TEACHER_SHEET);
    sh.getRange(1, 1, 1, 4).setValues([['ชื่อครู', 'อีเมลครู (บัญชี Google)', 'สถานะ', 'หมายเหตุ']]).setFontWeight('bold');
    sh.getRange(2, 3, 200, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['ใช้งาน', 'ปิด'], true).build());
    sh.setFrozenRows(1);
    sh.getRange(2, 4).setValue('ครูเข้าด้วยปุ่ม Google ไม่ต้องกรอกรหัส เปิดเมนู ใบงาน แบบทดสอบ และดู dashboard ได้ แก้หรือลบข้อมูลไม่ได้ ตั้งสถานะ ปิด เพื่อเลิกใช้');
  }
  ss.setActiveSheet(sh);
  ss.toast('กรอกชื่อครูและอีเมล Google (คอลัมน์ A–B) แล้วใช้ได้ทันที ไม่ต้อง Deploy ใหม่ · ต้องตั้ง GOOGLE_CLIENT_ID ไว้แล้ว', 'ระบบโซลาร์', 10);
}
// แผ่น "รายชื่อ" ในไฟล์นี้ (ใช้ตอนนำเข้า/เพิ่ม) · ถ้าตั้ง ROSTER_SHEET_ID ไว้ รายชื่ออยู่ไฟล์อื่น ไม่นำเข้าให้
function rosterTab_(props) {
  if (props.getProperty('ROSTER_SHEET_ID')) return null;
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sh = ss.getSheetByName(ROSTER_SHEET) || ss.insertSheet(ROSTER_SHEET);
  if (sh.getLastRow() === 0) { sh.getRange(1, 1, 1, ROSTER_HEAD.length).setValues([ROSTER_HEAD]).setFontWeight('bold'); sh.setFrozenRows(1); }
  return sh;
}
// หาคอลัมน์ รหัส/ชื่อ/อีเมล/สถานะ ของแผ่นรายชื่อ ถ้าขาดคอลัมน์ไหน เพิ่มหัวต่อท้าย
function rosterCols_(sh) {
  var lc = Math.max(sh.getLastColumn(), 1), h = sh.getRange(1, 1, 1, lc).getValues()[0].map(String);
  var find = function (re) { for (var i = 0; i < h.length; i++) if (re.test(h[i])) return i; return -1; };
  var c = { e: find(/อีเมล|email/i), a: find(/สถานะ|status/i), n: find(/ชื่อ|name/i), s: find(/รหัส|student|id/i) };
  var nm = { s: 'รหัสผู้เรียน', n: 'ชื่อ-นามสกุล', e: 'อีเมล Google', a: 'สถานะ' };
  ['s', 'n', 'e', 'a'].forEach(function (k) { if (c[k] < 0) { lc++; sh.getRange(1, lc).setValue(nm[k]).setFontWeight('bold'); c[k] = lc - 1; } });
  return c;
}
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// ตารางสองมิติ (แถวแรกเป็นหัวหรือไม่ก็ได้) -> [{sid,name,email,status}] ตรวจหาคอลัมน์จากหัว ถ้าไม่มีหัวอีเมลดูจากค่าที่หน้าตาเป็นอีเมล
function rosterRows_(t) {
  t = (t || []).slice(0, 1001); if (!t.length) return [];
  var first = t[0].map(String), hasHead = !first.some(function (x) { return EMAIL_RE.test(x.trim()); });
  var find = function (re) { for (var i = 0; i < first.length; i++) if (re.test(first[i])) return i; return -1; };
  var iE = hasHead ? find(/อีเมล|email|e-mail|mail/i) : -1, iN = hasHead ? find(/ชื่อ|name/i) : -1,
    iA = hasHead ? find(/สถานะ|status/i) : -1, iS = hasHead ? find(/รหัส|student|เลขที่|ลำดับ|id|no\.?$/i) : -1;
  var body = hasHead ? t.slice(1) : t;
  if (iE < 0) { var best = -1, bc = 0; for (var c = 0; c < first.length; c++) { var k = 0; body.forEach(function (r) { if (EMAIL_RE.test(String(r[c] || '').trim())) k++; }); if (k > bc) { bc = k; best = c; } } iE = best; }
  if (iE < 0) return [];
  if (iN === iE) iN = -1; if (iS === iE || iS === iN) iS = -1;
  return body.map(function (r) {
    return { email: String(r[iE] || '').trim(), name: iN >= 0 ? String(r[iN] || '').trim() : '', sid: iS >= 0 ? String(r[iS] || '').trim() : '', status: iA >= 0 ? String(r[iA] || '').trim() : '' };
  });
}
// เพิ่ม/แก้แถวในแผ่นรายชื่อ ใช้อีเมลเป็นคีย์ (ซ้ำ = แก้ชื่อ/รหัส/สถานะเฉพาะช่องที่ไม่ว่าง)
function rosterUpsert_(sh, rows) {
  var c = rosterCols_(sh), lc = sh.getLastColumn(), n = Math.max(sh.getLastRow() - 1, 0);
  var vals = n ? sh.getRange(2, 1, n, lc).getValues() : [], idx = {};
  vals.forEach(function (r, i) { var em = String(r[c.e] || '').trim().toLowerCase(); if (em) idx[em] = i; });
  var added = 0, updated = 0, skipped = 0;
  rows.slice(0, 1000).forEach(function (x) {
    var em = String(x.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(em)) { skipped++; return; }
    var nm = safe_(s_(x.name, 100).trim()), sid = safe_(s_(x.sid, 30).trim()), st = s_(x.status, 10).trim(), r;
    if (em in idx) { r = vals[idx[em]]; updated++; }
    else { r = []; for (var k = 0; k < lc; k++) r.push(''); r[c.e] = em; vals.push(r); idx[em] = vals.length - 1; added++; }
    if (nm) r[c.n] = nm; if (sid) r[c.s] = sid; if (st) r[c.a] = st;
  });
  if (vals.length) sh.getRange(2, 1, vals.length, lc).setValues(vals);
  return { added: added, updated: updated, skipped: skipped, total: vals.length };
}
function rosterList_(props) {
  var all = rosterRead_(props) || [];
  return all.slice(0, 1000).map(function (x) { return { sid: x.sid, name: x.name, email: x.email, status: x.status }; });
}
// action ของผู้สอน: rosterlist · rosteradd (rows หรือ table) · rosterimport (sheet = ลิงก์หรือ ID ของ Google Sheets, tab = ชื่อแท็บ ไม่บังคับ)
function rosterAction_(d, props) {
  if (!teacherOk_(d, props)) return json_({ ok: false, error: 'รหัสผู้สอนไม่ถูกต้อง' });
  if (d.action !== 'rosterlist' && teacherLevel_(d, props) !== 'admin') return json_({ ok: false, error: 'บัญชีครูไม่มีสิทธิ์นำเข้าหรือแก้รายชื่อ (เฉพาะ admin)' });
  if (d.action === 'rosterlist') return json_({ ok: true, roster: rosterList_(props), external: !!props.getProperty('ROSTER_SHEET_ID') });
  var sh = rosterTab_(props);
  if (!sh) return json_({ ok: false, error: 'รายชื่อใช้ชีตภายนอก (ROSTER_SHEET_ID) แก้ในชีตนั้นโดยตรง' });
  var rows;
  if (d.action === 'rosterimport') {
    var link = s_(d.sheet, 400), m = /\/d\/([a-zA-Z0-9_-]{20,})/.exec(link) || /^([a-zA-Z0-9_-]{25,})$/.exec(link.trim());
    if (!m) return json_({ ok: false, error: 'ลิงก์ไม่ใช่ Google Sheets (ต้องมี /d/รหัสไฟล์/)' });
    try {
      var ext = SpreadsheetApp.openById(m[1]), src = null, g = /[#&?]gid=(\d+)/.exec(link), tab = s_(d.tab, 100);
      if (tab) src = ext.getSheetByName(tab);
      if (!src && g) ext.getSheets().forEach(function (x) { if (String(x.getSheetId()) === g[1]) src = x; });
      if (!src) src = ext.getSheets()[0];
      var rr = Math.min(src.getLastRow(), 1001);
      rows = rr ? rosterRows_(src.getRange(1, 1, rr, Math.max(src.getLastColumn(), 1)).getValues()) : [];
    } catch (err) { return json_({ ok: false, error: 'เปิดไฟล์ไม่ได้ ตรวจว่าลิงก์ถูกต้องและแชร์ให้บัญชีเจ้าของสคริปต์ (Viewer ขึ้นไป) หรือใช้ปุ่มอัปโหลดไฟล์แทน' }); }
  } else if (Array.isArray(d.table)) rows = rosterRows_(d.table);
  else if (Array.isArray(d.rows)) rows = d.rows;
  else return json_({ ok: false, error: 'ไม่มีข้อมูลรายชื่อ' });
  if (!rows.length) return json_({ ok: false, error: 'ไม่พบคอลัมน์อีเมลในข้อมูลที่ส่งมา (ต้องมีคอลัมน์อีเมล)' });
  var res = rosterUpsert_(sh, rows);
  return json_({ ok: true, added: res.added, updated: res.updated, skipped: res.skipped, total: res.total, roster: rosterList_(props) });
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
    if (d.action === 'access' && (d.tcode || d.idToken)) {
      var lv0 = teacherLevel_(d, props);
      if (lv0) return json_({ ok: true, role: 'teacher', level: lv0, menus: menus_() });
      if (d.tcode) { Utilities.sleep(1500); return json_({ ok: false, error: 'รหัสผู้สอนไม่ถูกต้อง' }); }
    }
    if (d.action === 'wsset') return wsSet_(d, props);
    if (d.action === 'rosterlist' || d.action === 'rosteradd' || d.action === 'rosterimport') return rosterAction_(d, props);
    if (d.action === 'dash') return dash_(d, props);
    if (d.action === 'tcheck') {
      var tc = props.getProperty('TEACHER_CODE'), lv = teacherLevel_(d, props);
      if (!tc && !lv) return json_({ ok: false, tcheck: true, error: 'ผู้สอนยังไม่ได้ตั้ง TEACHER_CODE ใน Script properties' });
      if (!lv) { Utilities.sleep(1500); return json_({ ok: false, tcheck: true, error: 'รหัสผู้สอนไม่ถูกต้อง' }); }
      return json_({ ok: true, tcheck: true, level: lv });
    }

    var strict = strict_(props), code = props.getProperty('CLASS_CODE');
    if (code && !strict && s_(d.cls, 60) !== code) return json_({ ok: false, error: 'รหัสห้องอบรมไม่ถูกต้อง' });

    var verified = '', gname = '';
    if (d.idToken) {
      var r = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(d.idToken),
        { muteHttpExceptions: true });
      if (r.getResponseCode() === 200) {
        var t = JSON.parse(r.getContentText());
        var cid = props.getProperty('GOOGLE_CLIENT_ID');
        if ((!cid || t.aud === cid) && t.email_verified !== 'false') { verified = t.email; gname = t.name || ''; }
      }
    }

    if (strict) {
      // ต้องมีอีเมลที่ Google ยืนยัน และอยู่ในรายชื่อ (สถานะไม่ใช่ "ระงับ")
      if (!verified) return json_({ ok: false, needGoogle: true, error: 'ต้องเข้าสู่ระบบด้วยบัญชี Google (ถ้าเข้าไว้แล้วอาจหมดเวลา ให้เข้าใหม่)' });
      var RL = roster_(props);
      if (!RL) return json_({ ok: false, error: 'ผู้สอนยังไม่ได้เพิ่มรายชื่อผู้เรียน' });
      var me = null, vem = String(verified).toLowerCase();
      RL.forEach(function (x) { if (x.email && x.email === vem) me = x; });
      if (!me) return json_({ ok: false, error: 'อีเมล ' + verified + ' ไม่อยู่ในรายชื่อลงทะเบียน ติดต่อผู้สอน' });
      d.name = me.name || s_(d.name, 100) || gname || verified;
      d.sid = me.sid || s_(d.sid, 30);
    } else {
      if (!s_(d.name, 100)) return json_({ ok: false, error: 'ไม่มีชื่อ' });
      if (!inRoster_(d, verified, props)) return json_({ ok: false, error: 'ไม่พบรหัสผู้เรียนนี้ในรายชื่อลงทะเบียน ติดต่อผู้สอน' });
    }
    if (d.action === 'access') return json_({ ok: true, role: 'student', menus: menus_(), name: s_(d.name, 100), sid: s_(d.sid, 30), email: verified });
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
    fixHeaders_(sh);
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
  var tcode = props.getProperty('TEACHER_CODE'), lvl = teacherLevel_(d, props);
  if (!tcode && !lvl) return json_({ ok: false, error: 'ผู้สอนยังไม่ได้ตั้ง TEACHER_CODE ใน Script properties' });
  if (!lvl) { Utilities.sleep(1500); return json_({ ok: false, error: 'รหัสผู้สอนไม่ถูกต้อง' }); }
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sh || sh.getLastRow() < 2) return json_({ ok: true, dash: true, level: lvl, headers: HEADERS, rows: [], ws: wsList_(), menus: menus_(), roster: (roster_(props) || []).length });
  fixHeaders_(sh);
  var n = sh.getLastRow() - 1, start = Math.max(2, sh.getLastRow() - 4999);
  var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var vals = sh.getRange(start, 1, sh.getLastRow() - start + 1, sh.getLastColumn()).getValues();
  var rows = vals.map(function (r) { return r.map(function (v) { return v instanceof Date ? v.toISOString() : v; }); });
  return json_({ ok: true, dash: true, level: lvl, headers: head, rows: rows, total: n, at: new Date().toISOString(), ws: wsList_(), menus: menus_(), roster: (roster_(props) || []).length });
}

// ---- ประวัติใบงานของผู้เรียนเอง (ตามอีเมล Google ที่ยืนยันแล้ว หรือรหัสผู้เรียน) ----
function mine_(d, verified) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sh || sh.getLastRow() < 2) return json_({ ok: true, mine: [] });
  fixHeaders_(sh);
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
