/* ---- context strip: a small bar under each tab's heading showing which data that tab is using and where it comes from.
   Each chip links to its source tab. Colors: ok = taken from another tab, idle = stand-in value (example panels, not ticked), warn = source not ready ---- */
const CTX_NO={equip:'01',wiring:'02',ac:'03',pv:'04',load:'05',backup:'06',events:'07',bench:'08',submit:'09'};
let ctxRaf=0;
function ctxSchedule(){if(ctxRaf)return;ctxRaf=requestAnimationFrame(()=>{ctxRaf=0;try{ctxRender()}catch(e){}})}
function ctxInit(){
  Object.keys(CTX_NO).forEach(t=>{
    const sec=document.getElementById('tab-'+t);if(!sec||sec.querySelector('.ctxbar'))return;
    const bar=document.createElement('div');bar.className='ctxbar';bar.dataset.ctx=t;bar.setAttribute('aria-label','ข้อมูลที่แท็บนี้ใช้');
    const h=sec.querySelector('header');if(h)h.after(bar);else sec.prepend(bar);
  });
  document.addEventListener('click',e=>{const c=e.target.closest('.ctxc[data-go]');if(c&&typeof showTab==='function')showTab(c.dataset.go)});
}
function ctxChips(t){
  const I=curInv(),P=curPanel(),A=typeof lastA!=='undefined'?lastA:null,bi=typeof bankInfo==='function'?bankInfo():null;
  const inv=`${I.brand} ${I.model}`,pan=`${P.brand} ${P.model}`;
  const dcOk=A&&A.used>0&&A.lvl!=='err',nUsed=A?A.used:0;
  const loads=typeof LOADS!=='undefined'?LOADS.filter(l=>l.w>0&&l.qty>0):[];
  let kwh=0;if(loads.length&&typeof loadProfile==='function'){const L=loadProfile(15);kwh=L.all.reduce((a,b)=>a+b,0)*0.25/1000}
  const ph3=(typeof isPh3==='function'&&isPh3(I))||(typeof ACS!=='undefined'&&ACS.set.supply==='3');
  const site=typeof SIM!=='undefined'?`${SIM.date} · เอียง ${SIM.tilt}° หัน ${SIM.az}°`:'';
  const panelSrc=()=>BK.src==='wiring'
    ?(dcOk?['ok',`ตามที่ต่อสาย ${nUsed} แผง`,'wiring']:['warn','ตามที่ต่อสาย: ยังต่อไม่ถูก','wiring'])
    :['idle',`แผงสมมติ ${BK.nIdeal} แผง (ไม่ใช้สายจาก 02)`,'backup'];
  const C=(lvl,k,v,go)=>({lvl,k,v,go});
  switch(t){
    case'equip':return[C('ok','อุปกรณ์ที่เลือก',`${pan} · ${inv}${bi?' · '+bi.b.brand+' '+bi.b.model:''}`,null),C('idle','ใช้ใน','แท็บ 02–07 และ 09',null)];
    case'wiring':return[C('ok','แผง',pan,'equip'),C('ok','อินเวอร์เตอร์',inv,'equip'),C('ok','ส่งต่อไป','04 จำลองแผง · 06/07 ถ้าเลือก',null)];
    case'ac':{
      const a=[C('ok','อินเวอร์เตอร์',inv,'equip')];
      if(I.type!=='on-grid')a.push(C(bi?'ok':'warn','แบต',bi?`${bi.b.brand} ${bi.b.model} × ${bi.n} (${f(bi.V,0)} V)`:'ยังไม่มี','equip'));
      a.push(C('ok','ไฟเข้าบ้าน',ph3?'3 เฟส':'1 เฟส',null));
      if(ph3)a.push(C(loads.length?'ok':'warn','ตารางมิเตอร์ 3 เฟส',loads.length?`โหลด ${loads.length} รายการ · ${BK.mode==='off'?'Off-grid':'มีกริด'}`:'ยังไม่มีโหลด','load'));
      a.push(C(ACS.apply?'ok':'idle','ส่งผลไปแท็บ 06',ACS.apply?'ใช้ (ติ๊กแล้ว)':'ไม่ใช้ (ยังไม่ติ๊ก)',null));
      return a;
    }
    case'pv':return[C(dcOk?'ok':'warn','แผงที่ต่อสาย',dcOk?`${nUsed} แผง · ${f(A.pv/1000,2)} kWp`:'ยังต่อสายไม่ถูก','wiring'),C('ok','อินเวอร์เตอร์',inv,'equip'),C('ok','พิกัด / มุมแผง',site,null)];
    case'load':return[C('ok','อินเวอร์เตอร์ (ใช้เทียบกำลัง)',inv,'equip'),C(ph3?'ok':'idle','คอลัมน์เฟส',ph3?'แสดง (ระบบ 3 เฟส)':'ซ่อน (ระบบ 1 เฟส)','ac'),C(loads.length?'ok':'warn','ส่งต่อไป',loads.length?`${loads.length} รายการ · ${f(kwh,1)} kWh/วัน → 03, 06`:'ยังไม่มีโหลด',null)];
    case'backup':{
      const ps=panelSrc();
      const a=[C(ps[0],'แผง',ps[1],ps[2]),C(loads.length?'ok':'warn','โหลด',loads.length?`${loads.length} รายการ · ${f(kwh,1)} kWh/วัน`:'ยังไม่มี','load'),C('ok','พิกัด / มุมแผง',site,'pv')];
      if(BK.mode!=='grid')a.push(C(bi?'ok':'warn','แบต',bi?`${bi.b.brand} ${bi.b.model} × ${bi.n} · ${f(bi.kwh,1)} kWh`:'ยังไม่มี','equip'));
      a.push(C(ACS.apply?'ok':'idle','ผลต่อสาย AC',ACS.apply?(window.lastAC&&window.lastAC.lvl==='err'?'ใช้ (ยังมีข้อผิดพลาด)':'ใช้'):'ไม่ใช้','ac'));
      return a;
    }
    case'events':{
      const ev=typeof evSource==='function'?evSource():null,bk=window.lastBK;
      return[C(ev&&!ev.ideal?'ok':'idle','แผง',ev?(ev.ideal?`แผงสมมติ ${ev.n} แผง`:`ตามที่ต่อสาย ${ev.n} แผง`):'-','wiring'),C('ok','พิกัด / วันที่',site,'pv'),
        C(bk&&BK.mode!=='off'&&BK.outDur>0?'ok':'idle','ไฟดับ',bk&&BK.mode!=='off'&&BK.outDur>0?`${hhmm(BK.outStart)} ${BK.outDur} ชม. (จาก 06)`:'ไม่ได้ตั้งในแท็บ 06','backup')];
    }
    case'bench':return[C('idle','อิสระ','ไม่ใช้ข้อมูลจากแท็บอื่น (ระบบ 12 / 24 / 48 V)',null)];
    case'submit':{
      const lv=x=>x==='ok'?'ok':x==='err'||x==='warn'?'warn':'idle',lab=x=>x==='ok'?'ผ่าน':x==='warn'?'มีข้อควรระวัง':x==='err'?'ไม่ผ่าน':'ยังไม่ได้ทำ';
      const ac=window.lastAC,bk=window.lastBK;
      return[C(lv(A&&A.used?A.lvl:'idle'),'ต่อสาย DC',lab(A&&A.used?A.lvl:'idle'),'wiring'),C(lv(ac?ac.lvl:'idle'),'ต่อสาย AC',lab(ac?ac.lvl:'idle'),'ac'),
        C(dcOk?'ok':'idle','จำลองแผง',dcOk?'มีผล':'ยังไม่ได้ทำ','pv'),C(loads.length?'ok':'idle','โหลด',loads.length?`${loads.length} รายการ`:'ยังไม่ได้ทำ','load'),C(bk?lv(bk.lvl):'idle','Backup',bk?lab(bk.lvl):'ยังไม่ได้ทำ','backup')];
    }
  }
  return[];
}
function ctxRender(){
  document.querySelectorAll('.ctxbar').forEach(bar=>{
    const t=bar.dataset.ctx,list=ctxChips(t);
    bar.innerHTML=`<span class="ctxlab">ใช้ข้อมูล</span>`+list.map(c=>{
      const tag=c.go?'button':'span',from=c.go&&c.go!==t?`<span class="ctxfrom">${CTX_NO[c.go]}</span>`:'';
      return`<${tag} class="ctxc ${c.lvl}"${c.go&&c.go!==t?` data-go="${c.go}" title="ไปแท็บ ${CTX_NO[c.go]}"`:''}>${from}<span class="ctxk">${esc(c.k)}</span><b>${esc(c.v)}</b></${tag}>`;
    }).join('');
  });
}
