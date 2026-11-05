/* ---- เมนู 17 คำนวณความคุ้มค่า (โซลาร์ภาคประชาชน): ค่าไฟ → ขนาดระบบ → กู้/จ่ายสด → ผลประหยัด จุดคุ้มทุน 25 ปี ----
   หน้าเครื่องคำนวณอยู่ใน calc.html (หน้าเดี่ยว เปิดตรงได้ แก้ CONFIG ด้านบนไฟล์) โหลดใน iframe เมื่อเปิดเมนูครั้งแรก · ไฟล์รวม dist/ ฝังหน้าไว้ใน CALC_DOC
   ผู้สอนเปิด/ปิดเมนูนี้ที่ dashboard (แผ่น "เมนู" ค่าเริ่ม = ปิด) */
function calcOpen(){
  const f=document.getElementById('calcframe');if(!f)return;
  if(!f.dataset.loaded){f.dataset.loaded='1';
    if(typeof CALC_DOC==='string')f.srcdoc=CALC_DOC;else f.src='calc.html'+(typeof CALC_V==='string'?'?v='+CALC_V:'');}
}
addEventListener('message',e=>{const f=document.getElementById('calcframe');if(!f||e.source!==f.contentWindow||!e.data)return;
  if(e.data.calcH)f.style.height=Math.max(600,e.data.calcH)+'px'});
