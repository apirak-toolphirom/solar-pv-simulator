/**
 * ระบบสอบ Pre-test / Post-test หลักสูตรโซลาร์เซลล์สำหรับครัวเรือน (Non-degree)
 * Google Apps Script Web App — ตรวจข้อสอบฝั่งเซิร์ฟเวอร์ (เฉลยไม่ถูกส่งไปที่เบราว์เซอร์)
 *
 *  Pre-test : เก็บอีเมล · แจ้งเฉพาะคะแนน (ไม่บอกข้อถูก/ผิด)
 *  Post-test: เก็บอีเมล · แจ้งคะแนน + ข้อถูก/ผิด · ส่งอีเมลผลให้ผู้สอบ
 *
 * ไฟล์ในโปรเจกต์: Code.gs (ไฟล์นี้) · QuestionBank.gs (ข้อสอบ 20 วัน × 20 ข้อ) · Index.html · appsscript.json
 * วิธีติดตั้ง: ดู docs/manual-training-quiz.md
 */

const CONFIG = {
  COURSE_TITLE: 'หลักสูตรโซลาร์เซลล์สำหรับครัวเรือน (Non-degree)',
  GROUP_COUNT: 10,              // จำนวนกลุ่ม workshop
  PRE_MAX_ATTEMPTS: 1,          // จำนวนครั้งสูงสุดต่ออีเมลต่อวัน
  POST_MAX_ATTEMPTS: 1,
  SEND_PRE_EMAIL: false,        // Pre-test: ส่งคะแนนทางอีเมลด้วยหรือไม่ (ค่าเริ่ม: แจ้งบนหน้าจออย่างเดียว)
  SEND_POST_EMAIL: true,        // Post-test: ส่งผลละเอียดทางอีเมล
  SHOW_CORRECT_ON_POST: true,   // Post-test: แสดงคำตอบที่ถูกของข้อที่ตอบผิด
  SHUFFLE_QUESTIONS: true,
  SHUFFLE_CHOICES: true,
  ALLOWED_EMAIL_DOMAINS: [],    // เช่น ['ubu.ac.th'] ว่าง = รับทุกโดเมน
  CC_INSTRUCTOR: '',            // อีเมลผู้สอนที่ต้องการรับสำเนาผล Post-test (ว่าง = ไม่ส่ง)
  SENDER_NAME: 'ระบบสอบหลักสูตรโซลาร์เซลล์ครัวเรือน',
  TZ: 'Asia/Bangkok',
  CACHE_SECONDS: 6 * 60 * 60    // อายุของ token การสอบ (สูงสุด 6 ชม.)
};

const SHEET_RESULTS = 'Results';
const SHEET_SETTINGS = 'Settings';
const SHEET_SUMMARY = 'Summary';
const RESULT_HEADERS = ['เวลา', 'วัน', 'หัวข้อ', 'ประเภท', 'อีเมล', 'ชื่อ-สกุล', 'กลุ่ม', 'คะแนน', 'เต็ม', 'เปอร์เซ็นต์', 'ใช้เวลา(วินาที)', 'ครั้งที่', 'คำตอบ(JSON)'];

// ---------------------------------------------------------------- Web app

function doGet(e) {
  const p = (e && e.parameter) || {};
  const day = /^\d{1,2}$/.test(p.day || '') ? Number(p.day) : 0;
  const type = (p.type === 'pre' || p.type === 'post') ? p.type : '';
  const t = HtmlService.createTemplateFromFile('Index');
  t.init = JSON.stringify({ day: day, type: type });
  return t.evaluate()
    .setTitle('ระบบสอบ Pre/Post Test')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** ข้อมูลหน้าแรก: รายการวันและสถานะเปิด/ปิดของ Pre/Post */
function getQuizInfo() {
  const settings = readSettings_();
  const days = Object.keys(QUESTION_BANK).map(Number).sort(function (a, b) { return a - b; }).map(function (d) {
    const s = settings[d] || {};
    return { day: d, date: QUESTION_BANK[d].date, title: QUESTION_BANK[d].title, preOpen: !!s.pre, postOpen: !!s.post };
  });
  return {
    course: CONFIG.COURSE_TITLE,
    groups: CONFIG.GROUP_COUNT,
    days: days,
    activeEmail: activeEmail_(),
    preShowsAnswers: false,
    postShowsAnswers: true
  };
}

/** เริ่มสอบ: ตรวจข้อมูลผู้สอบ สร้างข้อสอบที่สลับลำดับแล้ว (ไม่มีเฉลย) */
function startQuiz(req) {
  req = req || {};
  const day = Number(req.day);
  const type = req.type;
  if (!QUESTION_BANK[day]) throw new Error('ไม่พบข้อสอบของวันที่เลือก');
  if (type !== 'pre' && type !== 'post') throw new Error('ประเภทการสอบไม่ถูกต้อง');

  const id = identity_(req);
  const settings = readSettings_()[day] || {};
  if (!settings[type]) throw new Error('การสอบ ' + (type === 'pre' ? 'Pre-test' : 'Post-test') + ' วันนี้ยังไม่เปิดหรือปิดแล้ว กรุณาติดต่อผู้สอน');

  const used = countAttempts_(id.email, day, type);
  const max = type === 'pre' ? CONFIG.PRE_MAX_ATTEMPTS : CONFIG.POST_MAX_ATTEMPTS;
  if (used >= max) throw new Error('อีเมลนี้สอบ ' + (type === 'pre' ? 'Pre-test' : 'Post-test') + ' วันนี้ครบ ' + max + ' ครั้งแล้ว');

  const bank = QUESTION_BANK[day];
  const n = bank.questions.length;
  let order = range_(n);
  if (CONFIG.SHUFFLE_QUESTIONS) order = shuffle_(order);
  const perms = order.map(function () {
    const p = range_(4);
    return CONFIG.SHUFFLE_CHOICES ? shuffle_(p) : p;
  });

  const token = Utilities.getUuid();
  CacheService.getScriptCache().put(token, JSON.stringify({
    day: day, type: type, email: id.email, name: id.name, group: id.group,
    start: Date.now(), order: order, perms: perms
  }), CONFIG.CACHE_SECONDS);

  const questions = order.map(function (qi, pos) {
    const q = bank.questions[qi];
    return { q: q.q, c: perms[pos].map(function (ci) { return q.c[ci]; }) };
  });
  return { token: token, day: day, type: type, title: bank.title, date: bank.date, email: id.email, questions: questions };
}

/** ส่งคำตอบ: ตรวจและบันทึกผล / Pre = คะแนนอย่างเดียว / Post = รายข้อ + ส่งอีเมล */
function submitQuiz(token, answers) {
  const cache = CacheService.getScriptCache();
  const raw = cache.get(String(token || ''));
  if (!raw) throw new Error('หมดอายุหรือไม่พบการสอบนี้ (อาจส่งไปแล้ว) กรุณาเริ่มสอบใหม่');
  const st = JSON.parse(raw);
  const bank = QUESTION_BANK[st.day];
  const n = st.order.length;
  if (!Array.isArray(answers) || answers.length !== n) throw new Error('จำนวนคำตอบไม่ถูกต้อง');

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  let attemptNo, score = 0, detail = [], original = [];
  try {
    if (!cache.get(token)) throw new Error('การสอบนี้ถูกส่งไปแล้ว');
    const max = st.type === 'pre' ? CONFIG.PRE_MAX_ATTEMPTS : CONFIG.POST_MAX_ATTEMPTS;
    const used = countAttempts_(st.email, st.day, st.type);
    if (used >= max) throw new Error('จำนวนครั้งที่สอบครบแล้ว');
    attemptNo = used + 1;

    for (let pos = 0; pos < n; pos++) {
      const q = bank.questions[st.order[pos]];
      const shown = answers[pos];
      const chosenOrig = (Number.isInteger(shown) && shown >= 0 && shown < 4) ? st.perms[pos][shown] : -1;
      const ok = chosenOrig === q.a;
      if (ok) score++;
      original.push(chosenOrig);
      detail.push({
        no: pos + 1,
        q: q.q,
        correct: ok,
        yourAnswer: chosenOrig >= 0 ? q.c[chosenOrig] : '(ไม่ได้ตอบ)',
        correctAnswer: q.c[q.a]
      });
    }
    const seconds = Math.round((Date.now() - st.start) / 1000);
    appendResult_([new Date(), st.day, bank.title, st.type, st.email, st.name, st.group, score, n,
      Math.round(score / n * 1000) / 10, seconds, attemptNo, JSON.stringify(original)]);
    cache.remove(token);
  } finally {
    lock.releaseLock();
  }

  const pct = Math.round(score / n * 1000) / 10;
  const out = { type: st.type, day: st.day, title: bank.title, score: score, total: n, percent: pct, email: st.email, emailed: false };

  if (st.type === 'post') {
    const pre = findPreScore_(st.email, st.day);
    if (pre !== null) { out.preScore = pre; out.gain = score - pre; }
    out.details = detail.map(function (d) {
      return {
        no: d.no, q: d.q, correct: d.correct, yourAnswer: d.yourAnswer,
        correctAnswer: (CONFIG.SHOW_CORRECT_ON_POST && !d.correct) ? d.correctAnswer : null
      };
    });
    if (CONFIG.SEND_POST_EMAIL) out.emailed = sendResultEmail_(st, bank, out);
  } else if (CONFIG.SEND_PRE_EMAIL) {
    out.emailed = sendResultEmail_(st, bank, out);
  }
  return out;
}

// ---------------------------------------------------------------- ตั้งค่า / ชีต

/** รันครั้งเดียวจากตัวแก้ไข Apps Script เพื่อสร้างสเปรดชีตและชีต Settings/Results/Summary */
function setup() {
  const ss = ss_();
  let r = ss.getSheetByName(SHEET_RESULTS);
  if (!r) { r = ss.insertSheet(SHEET_RESULTS); }
  r.getRange(1, 1, 1, RESULT_HEADERS.length).setValues([RESULT_HEADERS]).setFontWeight('bold');
  r.setFrozenRows(1);

  let s = ss.getSheetByName(SHEET_SETTINGS);
  if (!s) {
    s = ss.insertSheet(SHEET_SETTINGS);
    s.getRange(1, 1, 1, 5).setValues([['วัน', 'วันที่', 'หัวข้อ', 'เปิด Pre-test', 'เปิด Post-test']]).setFontWeight('bold');
    const rows = Object.keys(QUESTION_BANK).map(Number).sort(function (a, b) { return a - b; }).map(function (d) {
      return [d, QUESTION_BANK[d].date, QUESTION_BANK[d].title, false, false];
    });
    s.getRange(2, 1, rows.length, 5).setValues(rows);
    s.getRange(2, 4, rows.length, 2).insertCheckboxes();
    s.setFrozenRows(1);
  }

  let m = ss.getSheetByName(SHEET_SUMMARY);
  if (!m) { m = ss.insertSheet(SHEET_SUMMARY); }
  m.clear();
  m.getRange(1, 1, 1, 8).setValues([['วัน', 'วันที่', 'จำนวน Pre', 'เฉลี่ย Pre', 'จำนวน Post', 'เฉลี่ย Post', 'พัฒนาการ (Post−Pre)', 'หัวข้อ']]).setFontWeight('bold');
  const days = Object.keys(QUESTION_BANK).map(Number).sort(function (a, b) { return a - b; });
  days.forEach(function (d, i) {
    const row = i + 2;
    m.getRange(row, 1, 1, 2).setValues([[d, QUESTION_BANK[d].date]]);
    m.getRange(row, 3).setFormula('=COUNTIFS(Results!$B:$B,$A' + row + ',Results!$D:$D,"pre")');
    m.getRange(row, 4).setFormula('=IFERROR(AVERAGEIFS(Results!$H:$H,Results!$B:$B,$A' + row + ',Results!$D:$D,"pre"),"")');
    m.getRange(row, 5).setFormula('=COUNTIFS(Results!$B:$B,$A' + row + ',Results!$D:$D,"post")');
    m.getRange(row, 6).setFormula('=IFERROR(AVERAGEIFS(Results!$H:$H,Results!$B:$B,$A' + row + ',Results!$D:$D,"post"),"")');
    m.getRange(row, 7).setFormula('=IF(AND(D' + row + '<>"",F' + row + '<>""),F' + row + '-D' + row + ',"")');
    m.getRange(row, 8).setValue(QUESTION_BANK[d].title);
  });
  m.setFrozenRows(1);
  const first = ss.getSheets()[0];
  if (first && first.getName() !== SHEET_RESULTS && first.getName() !== SHEET_SETTINGS && first.getName() !== SHEET_SUMMARY && first.getLastRow() === 0) {
    ss.deleteSheet(first);
  }
  Logger.log('สเปรดชีตผลสอบ: ' + ss.getUrl());
  return ss.getUrl();
}

function ss_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('SHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  let s = null;
  try { s = SpreadsheetApp.getActiveSpreadsheet(); } catch (err) { s = null; }
  if (!s) s = SpreadsheetApp.create('ผลสอบ Pre/Post Test — ' + CONFIG.COURSE_TITLE);
  props.setProperty('SHEET_ID', s.getId());
  return s;
}

function resultsSheet_() {
  const ss = ss_();
  let sh = ss.getSheetByName(SHEET_RESULTS);
  if (!sh) { setup(); sh = ss.getSheetByName(SHEET_RESULTS); }
  return sh;
}

function readSettings_() {
  const ss = ss_();
  let sh = ss.getSheetByName(SHEET_SETTINGS);
  if (!sh) { setup(); sh = ss.getSheetByName(SHEET_SETTINGS); }
  const out = {};
  const last = sh.getLastRow();
  if (last < 2) return out;
  sh.getRange(2, 1, last - 1, 5).getValues().forEach(function (r) {
    out[Number(r[0])] = { pre: r[3] === true || String(r[3]).toUpperCase() === 'TRUE', post: r[4] === true || String(r[4]).toUpperCase() === 'TRUE' };
  });
  return out;
}

function appendResult_(row) {
  const sh = resultsSheet_();
  row[0] = Utilities.formatDate(row[0], CONFIG.TZ, 'yyyy-MM-dd HH:mm:ss');
  sh.appendRow(row);
}

function countAttempts_(email, day, type) {
  const sh = resultsSheet_();
  const last = sh.getLastRow();
  if (last < 2) return 0;
  let n = 0;
  sh.getRange(2, 1, last - 1, 7).getValues().forEach(function (r) {
    if (Number(r[1]) === day && r[3] === type && String(r[4]).toLowerCase() === email) n++;
  });
  return n;
}

function findPreScore_(email, day) {
  const sh = resultsSheet_();
  const last = sh.getLastRow();
  if (last < 2) return null;
  let v = null;
  sh.getRange(2, 1, last - 1, 8).getValues().forEach(function (r) {
    if (Number(r[1]) === day && r[3] === 'pre' && String(r[4]).toLowerCase() === email) v = Number(r[7]);
  });
  return v;
}

// ---------------------------------------------------------------- ผู้สอบ

function activeEmail_() {
  try { return String(Session.getActiveUser().getEmail() || '').toLowerCase(); } catch (err) { return ''; }
}

function identity_(req) {
  const name = String(req.name || '').replace(/\s+/g, ' ').trim();
  if (name.length < 2 || name.length > 80) throw new Error('กรุณากรอกชื่อ-สกุล (2–80 ตัวอักษร)');
  const group = Number(req.group);
  if (!Number.isInteger(group) || group < 1 || group > CONFIG.GROUP_COUNT) throw new Error('กรุณาเลือกกลุ่มที่ 1–' + CONFIG.GROUP_COUNT);
  // ถ้าระบบรู้อีเมลผู้ใช้จริง (บัญชีโดเมนเดียวกัน) ใช้ค่านั้น ไม่ใช้ค่าที่พิมพ์
  let email = activeEmail_() || String(req.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) throw new Error('รูปแบบอีเมลไม่ถูกต้อง');
  if (CONFIG.ALLOWED_EMAIL_DOMAINS.length) {
    const dom = email.split('@')[1];
    if (CONFIG.ALLOWED_EMAIL_DOMAINS.indexOf(dom) < 0) throw new Error('ใช้ได้เฉพาะอีเมลโดเมน: ' + CONFIG.ALLOWED_EMAIL_DOMAINS.join(', '));
  }
  return { name: name, group: group, email: email };
}

// ---------------------------------------------------------------- อีเมลผล

function esc_(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function sendResultEmail_(st, bank, out) {
  try {
    const isPost = st.type === 'post';
    const label = isPost ? 'Post-test (หลังเรียน)' : 'Pre-test (ก่อนเรียน)';
    let html = '<div style="font-family:Sarabun,Tahoma,sans-serif;max-width:640px">' +
      '<h2 style="margin:0 0 4px">ผลสอบ ' + esc_(label) + '</h2>' +
      '<p style="margin:0 0 12px;color:#444">' + esc_(CONFIG.COURSE_TITLE) + '<br>วันที่ ' + esc_(bank.date) + ' · ' + esc_(bank.title) + '</p>' +
      '<p>ผู้สอบ: <b>' + esc_(st.name) + '</b> · กลุ่ม ' + esc_(st.group) + '</p>' +
      '<p style="font-size:22px;margin:8px 0"><b>คะแนน ' + out.score + ' / ' + out.total + '</b> (' + out.percent + '%)</p>';
    if (isPost && out.preScore !== undefined) {
      html += '<p>คะแนน Pre-test: ' + out.preScore + ' · พัฒนาการ: <b>' + (out.gain >= 0 ? '+' : '') + out.gain + '</b> คะแนน</p>';
    }
    if (isPost) {
      html += '<table style="border-collapse:collapse;width:100%;font-size:14px"><tr style="background:#eef3fb"><th style="text-align:left;padding:6px;border:1px solid #cfd8e3">ข้อ</th><th style="text-align:left;padding:6px;border:1px solid #cfd8e3">ผล</th><th style="text-align:left;padding:6px;border:1px solid #cfd8e3">คำถาม / คำตอบของคุณ' + (CONFIG.SHOW_CORRECT_ON_POST ? ' / เฉลย (เมื่อผิด)' : '') + '</th></tr>';
      out.details.forEach(function (d) {
        html += '<tr><td style="padding:6px;border:1px solid #cfd8e3;vertical-align:top">' + d.no + '</td>' +
          '<td style="padding:6px;border:1px solid #cfd8e3;vertical-align:top;color:' + (d.correct ? '#1b7f3b' : '#c92a2a') + '"><b>' + (d.correct ? 'ถูก' : 'ผิด') + '</b></td>' +
          '<td style="padding:6px;border:1px solid #cfd8e3">' + esc_(d.q) + '<br><span style="color:#555">คำตอบของคุณ: ' + esc_(d.yourAnswer) + '</span>' +
          (d.correctAnswer ? '<br><span style="color:#1b7f3b">เฉลย: ' + esc_(d.correctAnswer) + '</span>' : '') + '</td></tr>';
      });
      html += '</table>';
    } else {
      html += '<p style="color:#555">Pre-test แจ้งเฉพาะคะแนน ไม่แสดงข้อถูก/ผิด</p>';
    }
    html += '<p style="color:#777;font-size:12px;margin-top:16px">อีเมลนี้ส่งอัตโนมัติจากระบบสอบ กรุณาอย่าตอบกลับ</p></div>';
    const opts = { htmlBody: html, name: CONFIG.SENDER_NAME };
    if (isPost && CONFIG.CC_INSTRUCTOR) opts.cc = CONFIG.CC_INSTRUCTOR;
    MailApp.sendEmail(st.email, 'ผลสอบ ' + label + ' — วันที่ ' + bank.date, 'ผลสอบ ' + label + ' คะแนน ' + out.score + '/' + out.total, opts);
    return true;
  } catch (err) {
    console.error('ส่งอีเมลไม่สำเร็จ: ' + err);
    return false;
  }
}

// ---------------------------------------------------------------- ตัวช่วย

function range_(n) { const a = []; for (let i = 0; i < n; i++) a.push(i); return a; }

function shuffle_(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
