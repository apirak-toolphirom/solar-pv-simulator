/* ---- เมนู 14 ออกแบบระบบไฟฟ้า วสท. 2564: แหล่งจ่าย (มิเตอร์ 1/3 เฟส หรือหม้อแปลง) → ตู้ MDB/DB → วงจรย่อย + Solar PV ----
   คำนวณเบรกเกอร์ สาย สายดิน แรงดันตก กระแสลัดวงจร สมดุลเฟส มิเตอร์ แล้วสร้าง SLD, BOQ (Excel) และรายงาน PDF
   หน้าอยู่ใน eit.html (หน้าเดี่ยว เปิดตรงได้) โหลดใน iframe เมื่อเปิดเมนูครั้งแรก · ไฟล์รวม dist/ ฝังหน้าไว้ใน EIT_DOC
   ผู้สอนเปิด/ปิดเมนูนี้ที่ dashboard (แผ่น "เมนู" ค่าเริ่ม = ปิด) */
function eitOpen(){
  const f=document.getElementById('eitframe');if(!f)return;
  if(!f.dataset.loaded){f.dataset.loaded='1';
    if(typeof EIT_DOC==='string')f.srcdoc=EIT_DOC;else f.src='eit.html'+(typeof EIT_V==='string'?'?v='+EIT_V:'');}
  eitTheme();
}
function eitTheme(){const f=document.getElementById('eitframe');if(f&&f.contentWindow)try{f.contentWindow.postMessage({pvTheme:document.documentElement.dataset.theme},'*')}catch(e){}}
addEventListener('message',e=>{const f=document.getElementById('eitframe');if(!f||e.source!==f.contentWindow||!e.data)return;
  if(e.data.eitH)f.style.height=Math.max(600,e.data.eitH)+'px';
  if(typeof e.data.eitScroll==='number')window.scrollTo({top:f.getBoundingClientRect().top+window.scrollY+e.data.eitScroll-120,behavior:'smooth'})});
document.addEventListener('DOMContentLoaded',()=>{const b=document.getElementById('themebtn');if(b)b.addEventListener('click',()=>setTimeout(eitTheme,0))});
