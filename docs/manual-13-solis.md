# เมนู 13 Solis Commissioning

**ฉบับ 1.0 · ปรับปรุงล่าสุด 5 พ.ย. 2569** · [กลับสารบัญ](README.md) · ไฟล์ `js/solis.js`

ฝึกต่อพอร์ต ตรวจวัดก่อนเปิดเครื่อง Power ON/OFF ตั้งค่าหน้าจอ และทดสอบการทำงานของ Solis S6-EH1P6K-L-PLUS ตามคู่มือผู้ผลิต (V1.3, 04/2026) ทั้ง On-grid, Hybrid, Off-grid และ AC coupling

**ใครใช้ได้**: ค่าเริ่ม **ปิด** ผู้เรียนและผู้เยี่ยมชมไม่เห็นจนกว่าผู้สอนเลือก "เปิด" ที่ dashboard (ต้องวาง `Code.gs` ล่าสุดแล้ว Deploy → New version) ผู้สอนเห็นเสมอ

## เลือกระบบ (ใบสั่งงาน)
| ระบบ | ใบสั่งงาน |
|---|---|
| On-grid | ไม่มีแบต PEA ขายไฟ ≤ 5 kW |
| Hybrid | กริด + Backup PEA ห้ามขายไฟ สำรองแบต ≥ 30% |
| Off-grid | ไม่มี CT / มิเตอร์ |
| AC coupling | อินเวอร์เตอร์ออนกริดเดิม 3 kW ที่พอร์ต GEN, MEA |

## ขั้นตอน
1. **ใบสั่งงานและการต่อพอร์ต**: เลือกสิ่งที่ต่อเข้า PV1/PV2, BAT, AC-GRID, AC-BACKUP, AC-GEN, CT (ตำแหน่ง ทิศลูกศร สายขาว/ดำ), BMS (CAN), METER ดูผังระบบ ระบบตรวจข้อห้ามตามคู่มือ เช่น ห้ามต่อ BACKUP เข้ากริด
2. **ตรวจวัดและ Power ON/OFF**: เช็กลิสต์ข้อ 5.1 · สวิตช์แบต / DC switch / OCPD / เบรกเกอร์ Backup · มัลติมิเตอร์วัด PV, BAT, L–N, L–PE, N–PE, Backup, ความต่อเนื่อง PE ตรวจ CT และหัว CAN ด้วยตา · ดู LED POWER / OPERATION / ALARM
   - ลำดับเปิด (ข้อ 5.2): วัด PV ก่อนเปิด DC switch → วัด AC แล้วปิด OCPD → เปิด DC ก่อน OCPD → เปิด Backup หลัง commissioning
   - ลำดับปิดเครื่องตามข้อ 5.3
3. **หน้าจอเครื่อง**: จอ 7 นิ้ว ปุ่ม ESC ▲ ▼ ENTER · Quick Setting 5 ขั้น (เวลา → Meter → Grid code → Storage mode → Battery) แล้วเข้า HOME: Plant / Alarm Information, System Setting (Storage Mode + Time of use, Battery, Smart Port, Grid Port, Parallel, Basic)
4. **แดชบอร์ด**: หน้า Devices Status (แผง แบต กริด โหลดกริด โหลด Backup AC coupled) เลื่อนเวลา/เล่น ตั้งไฟดับ เมฆ และโหลด Backup เพิ่ม ดูกราฟทั้งวันและสรุป kWh ผลเปลี่ยนตามการตั้งค่า เช่น Self-use / Selling first / Off grid, Allow export, Max export, Battery reserve, Over discharge, Allow grid charging, Peak shaving, Smart Port
5. **โจทย์หาข้อผิดพลาด**: ระบบสุ่มความผิดพลาดหน้างาน 2 จุด ให้หาด้วยการวัดและ alarm เช่น CT กลับทิศ/สายสลับ/หลุด, PV เกิน 500 V, PV2 กลับขั้ว, ฟิวส์แบตขาด, CAN pin ไม่ตรง, BACKUP ต่อเข้าตู้เมน, L/N สลับ, ไม่ต่อ PE

Alarm ที่จำลอง: OV-DC01 · OV-Vbackup · NO-Battery · CAN Fail · BatName-FAIL · MET-SLT-Fail · NO-Grid · Over-Load · OV-Vbatt

## สำหรับผู้สอน
- เปิดเมนูที่ dashboard เมื่อถึงคาบ
- กำหนดโจทย์หาข้อผิดพลาดเองได้ในโหมดผู้สอน (ผู้เรียนไม่เห็นส่วนนี้)
- ใบงาน **W8** (ค่าเริ่ม = ปิด): ผ่านครบอย่างน้อย 1 ระบบ และหาข้อผิดพลาดถูก 1 โจทย์

ค่าแผง (Voc 49.5 V, 650 W) โหลด และพฤติกรรมควบคุมเป็นแบบจำลอง ไม่ใช่เฟิร์มแวร์จริง ตรวจกับเครื่องและคู่มือฉบับล่าสุดทุกครั้ง

## ประวัติการแก้ไข
| ฉบับ | วันที่ | การเปลี่ยนแปลง |
|---|---|---|
| 1.0 | 5 พ.ย. 2569 | ฉบับแรก |
