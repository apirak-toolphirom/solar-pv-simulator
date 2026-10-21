# ตั้งค่าระบบรับงาน (Google Sheets + Apps Script)

ผู้สอนทำครั้งเดียวต่อหนึ่งรุ่นอบรม ใช้เวลาประมาณ 10 นาที

## 1. สร้างชีตและสคริปต์
1. สร้าง Google Sheets ใหม่ ตั้งชื่อเช่น `ผลส่งงานโซลาร์ รุ่น 1`
2. เมนู **ส่วนขยาย (Extensions) → Apps Script**
3. ลบโค้ดเดิม วางเนื้อหาจาก `Code.gs` แล้วบันทึก

## 2. ตั้งรหัสห้องอบรม (แนะนำ)
Apps Script → **Project Settings → Script properties → Add**
- `CLASS_CODE` = รหัสที่จะบอกผู้เรียน เช่น `SOLAR69`

ผู้เรียนต้องกรอกรหัสนี้ในแท็บ "ส่งงาน" ไม่ตรงจะไม่บันทึก รหัสนี้ไม่อยู่ใน GitHub เพราะ repo เป็น public

## 3. Deploy เป็น Web app
1. **Deploy → New deployment → Select type: Web app**
2. Execute as: **Me** / Who has access: **Anyone**
3. กด Deploy อนุญาตสิทธิ์ แล้วคัดลอก URL ที่ลงท้ายด้วย `/exec`

## 4. ใส่ URL ในเว็บ
แก้ `js/config.js` ใน repo

```js
SUBMIT_URL:'https://script.google.com/macros/s/xxxxxxxx/exec',
```

แล้ว commit และ push GitHub Pages จะอัปเดตเอง (ถ้ารันในเครื่อง ให้ `python3 build.py` ด้วย)

## 5. (ไม่บังคับ) ปุ่ม Google Sign-in
1. Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID → **Web application**
2. Authorized JavaScript origins: `https://apirak-toolphirom.github.io` (และ `http://localhost:8080` ถ้าทดสอบในเครื่อง)
3. คัดลอก Client ID ใส่ `GOOGLE_CLIENT_ID` ใน `js/config.js` และใน Script properties ของ Apps Script

ถ้าไม่ตั้ง ผู้เรียนกรอกชื่ออย่างเดียวได้ตามปกติ ถ้าตั้ง สคริปต์จะตรวจ token กับ Google และบันทึกอีเมลลงคอลัมน์ "Google (ยืนยันแล้ว)"

## ข้อมูลที่เก็บ
หนึ่งแถวต่อหนึ่งครั้งที่กด "ส่งงาน": ชื่อ รหัส ผลตรวจการต่อสาย จำนวนแผง รุ่นอุปกรณ์ ตัวเลขสรุปจำลองแผง/โหลด/Backup และข้อที่ต้องตรวจ ไม่เก็บทุกการลากสาย ผู้เรียนส่งซ้ำได้ ใช้แถวล่าสุดของแต่ละรหัส
ควรแจ้งผู้เรียนว่าเก็บข้อมูลอะไร และลบชีตเมื่อจบรุ่น

## หมายเหตุ
- ถ้าแก้ `Code.gs` ภายหลัง ต้อง **Deploy → Manage deployments → Edit → New version** URL เดิมจึงใช้โค้ดใหม่
- ไม่ต้องใส่คีย์ลับในเว็บ ตัว URL ของ Web app ใครรู้ก็ส่งได้ จึงควรตั้ง `CLASS_CODE`

## 6. (ไม่บังคับ) เก็บโปรเจ็คของผู้เรียนใน Google Drive ของผู้สอน
ผู้เรียนเปลี่ยนเครื่องแล้วงานยังอยู่ โดยกดปุ่ม "บันทึกขึ้น Drive" / "โหลดจาก Drive" ใต้เมนูด้านซ้าย (ปุ่มจะโผล่เมื่อตั้ง `SUBMIT_URL` แล้ว)
1. สร้างโฟลเดอร์ใน Drive ของผู้สอน แล้วคัดลอก ID จาก URL (`…/folders/<ID>`)
2. Apps Script → Project Settings → Script properties → เพิ่ม `DRIVE_FOLDER_ID` = ID นั้น
3. วาง `Code.gs` เวอร์ชันล่าสุด แล้ว **Deploy → Manage deployments → Edit → New version** (ต้องอนุญาตสิทธิ์ Drive เพิ่ม)
- หนึ่งไฟล์ต่อผู้เรียน ชื่อตามอีเมล Google ที่ยืนยันแล้ว ถ้าไม่ได้ล็อกอิน Google ใช้รหัสผู้เรียน
- ถ้าไม่ล็อกอิน Google คนที่รู้รหัสห้องและรหัสผู้เรียนของคนอื่นเขียนทับได้ แนะนำให้ตั้งปุ่ม Google Sign-in (ข้อ 5) ประวัติเวอร์ชันของ Drive ย้อนกลับได้

## 7. หน้าสรุปงานส่งของผู้สอน (dashboard.html)
1. Apps Script → Project Settings → Script properties → เพิ่ม `TEACHER_CODE` = รหัสผู้สอน (อย่าใช้รหัสเดียวกับ `CLASS_CODE`)
2. วาง `Code.gs` เวอร์ชันล่าสุด แล้ว **Deploy → Manage deployments → Edit → New version**
3. เปิด `https://apirak-toolphirom.github.io/solar-pv-simulator/dashboard.html` กรอกรหัสผู้สอน แล้วกด "โหลดข้อมูล"
- แสดงจำนวนผู้ส่ง ผลต่อสาย DC / AC / Backup งานส่งรายวัน ข้อผิดพลาดที่พบบ่อย และตารางรายชื่อ (กรองวัน ผล ค้นหา ส่งออก CSV)
- รหัสผู้สอนไม่อยู่ใน GitHub ตรวจที่ Apps Script ทุกครั้ง เบราว์เซอร์จำไว้เฉพาะแท็บที่เปิดอยู่ ปิดแท็บแล้วต้องกรอกใหม่
- ปุ่ม "ดูข้อมูลตัวอย่าง" ใช้ดูหน้าตาได้โดยไม่ต้องตั้งค่า

## 8. ล็อกการแก้ไขรุ่นอุปกรณ์ (แท็บ "อุปกรณ์")
ผู้เรียนเลือกรุ่นได้ แต่เพิ่ม แก้ไข ลบ และนำเข้ารุ่นไม่ได้ ผู้สอนกรอก `TEACHER_CODE` ที่ปุ่ม "ปลดล็อกผู้สอน" (ใช้ Code.gs ล่าสุด) ปลดล็อกค้างไว้จนปิดแท็บเบราว์เซอร์
การแก้หรือลบรุ่นมีผลเฉพาะเบราว์เซอร์ที่ทำเท่านั้น ไม่กระทบเครื่องอื่น รุ่นที่ติดมากับเว็บจะกลับมาเมื่อเปิดใหม่

## 9. ส่งงานตามใบงาน
วาง `Code.gs` ล่าสุด แล้ว **Deploy → Manage deployments → Edit → New version** ระบบจะสร้างแผ่น **"ใบงาน"** ใน Google Sheets ให้เอง (W1–W7 และ W0 ส่งรวม)
- คอลัมน์: รหัส · ชื่อใบงาน · เมนู (equip, wiring, ac, pv, site, load, backup, systems, events, bench) · เปิดวันที่ · ปิดวันที่ · สถานะ · เกณฑ์ · คำถาม · ภาพ
- สถานะ `auto` = เปิดรับตามช่วงวันที่ (ว่าง = ไม่จำกัด) · `เปิด` / `ปิด` = บังคับ เปลี่ยนได้ในชีตหรือในหน้า dashboard.html (ต้องใช้ TEACHER_CODE)
- ใบงานที่ปิดรับ ผู้เรียนส่งไม่ได้
- เกณฑ์คั่นด้วย `;` ใช้ได้: `dc_pass` `panels>=8` `dcac=0.9-1.5` `ac_pass` `pv_sim` `site_pv` `site_on` `shade<=15` `loads>=5` `bk_outage>=6` `bk_ok` `sys_seen` `ev_any` `bench_pass` (คีย์อื่นจะแสดงเป็น "ผู้สอนตรวจเอง")
- คำถามคั่นด้วย `|` ผู้เรียนต้องตอบข้อละอย่างน้อย 10 ตัวอักษรจึงนับว่าครบ
- ภาพ: `dc` `ac` `site` `bench` หรือ `none` ภาพรายงานเก็บในโฟลเดอร์ "ภาพงานส่ง" ใต้ `DRIVE_FOLDER_ID` (ถ้าไม่ตั้ง จะไม่เก็บภาพ) ลิงก์อยู่ในคอลัมน์ "ภาพ"
- แผ่น Submissions เพิ่มคอลัมน์ ใบงาน · ชื่อใบงาน · ผ่านเกณฑ์ใบงาน · เกณฑ์ที่ยังไม่ผ่าน · คำตอบ · ภาพ (หัวคอลัมน์เดิมต่อท้ายให้เอง)
- ผู้เรียนเห็น "ใบงานของฉัน" จากชีต ค้นจากอีเมล Google ที่ยืนยันแล้ว หรือรหัสผู้เรียน + รหัสห้อง
