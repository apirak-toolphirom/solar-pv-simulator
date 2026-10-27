/* ---- เมนู 16 แบตเตอรี่ LiFePO4 + JK-BMS: จัดวางเซลล์ 280/314 Ah ลงตู้ ต่อบัสบาร์ 4S/8S/16S ต่อสายและตั้งค่า JK-BMS ขนานแบต ----
   หน้าจำลองอยู่ใน lfp.html (หน้าเดี่ยว โหลดใน iframe เมื่อเปิดเมนูครั้งแรก) · ไฟล์รวม dist/ ฝังหน้าไว้ใน LFP_DOC
   ผู้สอนเปิด/ปิดเมนูนี้ที่ dashboard (แผ่น "เมนู" ค่าเริ่ม = ปิด) */
function lfpOpen(){
  const f=document.getElementById('lfpframe');if(!f)return;
  if(!f.dataset.loaded){f.dataset.loaded='1';
    if(typeof LFP_DOC==='string')f.srcdoc=LFP_DOC;else f.src='lfp.html'+(typeof LFP_V==='string'?'?v='+LFP_V:'');}
  lfpTheme();
}
function lfpTheme(){const f=document.getElementById('lfpframe');if(f&&f.contentWindow)try{f.contentWindow.postMessage({pvTheme:document.documentElement.dataset.theme},'*')}catch(e){}}
addEventListener('message',e=>{const f=document.getElementById('lfpframe');if(!f||e.source!==f.contentWindow||!e.data||!e.data.lfpH)return;f.style.height=Math.max(600,e.data.lfpH)+'px'});
document.addEventListener('DOMContentLoaded',()=>{const b=document.getElementById('themebtn');if(b)b.addEventListener('click',()=>setTimeout(lfpTheme,0))});
