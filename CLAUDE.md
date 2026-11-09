# solar-pv-simulator: กฎของ repo

## คู่มือการใช้งานต้องอัปเดตทุกครั้งที่แก้
คู่มืออยู่ใน `docs/` (สารบัญ `docs/README.md`) แก้โค้ดของเมนูใด ต้องอัปเดตคู่มือของเมนูนั้นใน commit เดียวกัน

| แก้ไฟล์ | อัปเดตคู่มือ |
|---|---|
| `js/basics.js` | `docs/manual-00-basics.md` |
| `js/library.js` `js/kb_*.js` | `docs/manual-01-library.md` (ตารางบทความ) |
| `js/catalog.js` `js/pdfimport.js` | `docs/manual-02-equip.md` |
| `js/wiring.js` `js/wireaid.js` `js/engine.js` `js/model.js` | `docs/manual-03-wiring.md` |
| `js/acsys.js` `js/acart.js` `js/acbrand.js` `js/acmicro.js` `js/achouse.js` | `docs/manual-04-ac.md` |
| `js/bench.js` `js/benchui.js` | `docs/manual-05-bench.md` |
| `js/cable.js` | `docs/manual-06-cable.md` |
| `js/solar.js` | `docs/manual-07-pv.md` |
| `js/site.js` `js/earth.js` | `docs/manual-08-site.md` |
| `js/loads.js` | `docs/manual-09-load.md` |
| `js/backup.js` `js/bkanim.js` | `docs/manual-10-backup.md` |
| `js/systems.js` | `docs/manual-11-systems.md` |
| `js/events.js` | `docs/manual-12-events.md` |
| `calc.html` `js/calc.js` | `docs/manual-13-calc.md` |
| `eit.html` `js/eit.js` | `docs/manual-14-eit.md` |
| `js/solis.js` | `docs/manual-15-solis.md` |
| `lfp.html` `js/lfp.js` | `docs/manual-16-lfp.md` |
| `js/fusion*.js` `js/hwlog.js` | `docs/manual-17-fusion.md` |
| `js/submit.js` `js/worksheets.js` | `docs/manual-18-submit.md` และ `docs/manual-teacher.md` (ตารางใบงาน) |
| `js/access.js` `js/app.js` `js/ctx.js` `app.html` (เมนู บทบาท การบันทึก) | `docs/manual-start.md` |
| `apps-script/*` `dashboard.html` `js/config.js` | `docs/manual-teacher.md` |
| ส่วนของเมนูใดใน `app.html` | คู่มือของเมนูนั้น |

ทุกครั้งที่อัปเดตคู่มือ
- แก้ขั้นตอน ชื่อปุ่ม/ข้อความหน้าจอ ค่าเริ่ม สิทธิ์ สูตร ตัวอย่างตัวเลข และตารางปัญหาที่พบบ่อยให้ตรงกับของจริง ชื่อปุ่มในคู่มือต้องตรงกับหน้าจอ
- เพิ่มแถวใน "ประวัติการแก้ไข" ของไฟล์นั้น (ฉบับ +0.1 แก้เล็ก, +1.0 เปลี่ยนการคำนวณหรือขั้นตอนหลัก) และแก้บรรทัด "ฉบับ … · ปรับปรุงล่าสุด …" ด้านบน
- ถ้าตัวเลขตัวอย่างเปลี่ยน ให้รันของจริงด้วยค่าตัวอย่างแล้วใส่ผลที่ได้ อย่าคาดเอง
- เพิ่มเมนูใหม่: สร้าง `docs/manual-<เลข>-<รหัส>.md` เพิ่มในตารางของ `docs/README.md` ใน `MANUAL` ของ `js/app.js` และในตารางนี้
- เปลี่ยนค่าเริ่มสิทธิ์เมนู (Code.gs `MENU_DEF`): แก้ตารางใน `docs/README.md` และ `docs/manual-teacher.md` ข้อ 3

## build
แก้ไฟล์ต้นทางแล้วรัน `python3 build.py` ทุกครั้งก่อน commit (สร้าง `index.html` และ `dist/pv-wiring-sim.html`)

## ทดสอบ
รัน `bash tests/run.sh` ก่อน commit ทุกครั้ง (build ให้เอง) ต้องขึ้น `ALL TESTS PASSED`
- `tests/smoke.js` เปิดทุกเมนูใน jsdom ตรวจ error และว่าทุกเมนูมีปุ่ม section ชื่อ และคู่มือ
- `tests/structure.test.js` เลขเมนูเรียง 00, 01, 02 … ตามแถบเมนู และตรงกันใน ACC_NAME ชื่อไฟล์คู่มือ และ `Code.gs`
- `tests/menu03.test.js` ตัวเลขตัวอย่างในคู่มือเมนู 03 ต้องตรงกับที่โปรแกรมคำนวณ ถ้าตั้งใจเปลี่ยนการคำนวณ ให้แก้คู่มือและไฟล์ทดสอบพร้อมกัน
- `tests/mobile.py` (ถ้ามี Python Playwright + Chrome) ทุกเมนูที่จอ 390 px ไม่ล้นจอ ไม่มีตารางต้องเลื่อนซ้ายขวา และปุ่มสูงพอให้แตะ
