/* เมนู 22 ออกแบบระบบโซลาร์: หน้าอยู่ใน design.html (หน้าเดี่ยว เปิดตรงได้) โหลดใน iframe เมื่อเปิดเมนูครั้งแรก
   ผู้สอนเปิด/ปิดเมนูนี้ที่ dashboard (แผ่น "เมนู" ค่าเริ่ม = ปิด) หน้าในอ่านแคตตาล็อกอุปกรณ์จากเมนู 02 (CAT) โดยตรง */
function designOpen(){
  const f=document.getElementById('designframe');if(!f)return;
  if(!f.dataset.loaded){f.dataset.loaded='1';
    if(typeof DESIGN_DOC==='string')f.srcdoc=DESIGN_DOC;else f.src='design.html'+(typeof DESIGN_V==='string'?'?v='+DESIGN_V:'');}
}
addEventListener('message',e=>{const f=document.getElementById('designframe');if(!f||e.source!==f.contentWindow||!e.data)return;
  if(e.data.designRes)window.lastDESIGN=e.data.designRes;
  if(e.data.designH)f.style.height=Math.max(700,e.data.designH)+'px'});
