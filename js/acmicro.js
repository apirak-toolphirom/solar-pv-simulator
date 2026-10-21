/* ---- menu 03 for microinverters: units share an AC trunk cable per branch → branch breaker in the board → RCD → meter → grid.
   Checks: units per branch vs datasheet limit, breaker vs branch current (×1.25 continuous), cable ampacity vs breaker,
   voltage drop on the trunk, end cap on the open trunk end, RCD 30 mA, PE to every unit/frame. Values are teaching approximations. */
const MIC_AMP={1.5:15,2.5:21,4:28,6:36,10:50};/* copper PVC, in conduit, approx. (check the EIT/วสท. table for the real install method) */
const MIC_BRK=[10,16,20,25,32,40,50];
function micSplit(n,b){const a=[],q=Math.floor(n/b),r=n%b;for(let i=0;i<b;i++)a.push(q+(i<r?1:0));return a.filter(x=>x>0)}
function micAnalyze(I){
  const M=MICRO,ia=microIac(I),br=micSplit(Math.max(1,M.n|0),Math.max(1,Math.min(M.br|0,M.n|0))),mx=Math.max(...br),ck=[];
  const Ib=mx*ia,amp=MIC_AMP[M.cab]||0,lim=+I.brMax||0,ptot=M.n*I.pac;
  if(lim>0&&mx>lim)ck.push({lvl:'err',t:`สายย่อยมีไมโคร ${mx} ตัว เกินที่ผู้ผลิตกำหนด ${lim} ตัวต่อสายย่อย เพิ่มจำนวนสายย่อย (วงจร) เป็นอย่างน้อย ${Math.ceil(M.n/lim)} สาย`});
  else if(lim>0)ck.push({lvl:'ok',t:`สายย่อยละไม่เกิน ${mx} ตัว (ผู้ผลิตกำหนดไม่เกิน ${lim} ตัว)`});
  if(+I.brBrk>0&&M.brk>+I.brBrk)ck.push({lvl:'err',t:`เบรกเกอร์สายย่อย ${M.brk} A เกินที่คู่มือกำหนด ${I.brBrk} A (จำนวนต่อพ่วงสูงสุด ${lim} ตัวคิดที่เบรกเกอร์ ${I.brBrk} A)`});
  if(M.brk<Ib)ck.push({lvl:'err',t:`เบรกเกอร์ ${M.brk} A ต่ำกว่ากระแสสายย่อย ${f(Ib,1)} A (${mx} × ${f(ia,1)} A) จะทริปตอนแดดจัด เลือกอย่างน้อย ${MIC_BRK.find(x=>x>=Ib)||'—'} A หรือเพิ่มสายย่อย`});
  else ck.push({lvl:'ok',t:`เบรกเกอร์สายย่อย ${M.brk} A ≥ กระแสสายย่อย ${f(Ib,1)} A (${mx} × ${f(ia,1)} A)`});
  if(amp<M.brk)ck.push({lvl:'err',t:`สาย ${M.cab} mm² รับกระแสได้ราว ${amp} A น้อยกว่าเบรกเกอร์ ${M.brk} A เบรกเกอร์ป้องกันสายไม่ได้ เพิ่มขนาดสายหรือลดขนาดเบรกเกอร์`});
  else ck.push({lvl:'ok',t:`สาย ${M.cab} mm² (รับได้ราว ${amp} A) ≥ เบรกเกอร์ ${M.brk} A`});
  const vd=2*M.len*Ib*0.0175/M.cab/230*100;
  ck.push(vd>3?{lvl:'err',t:`แรงดันตกในสายย่อย ${f(vd,1)}% (ยาว ${M.len} m) เกิน 3% ไมโครอาจตัดเพราะแรงดันสูงเกิน ใช้สายใหญ่ขึ้นหรือย้ายตู้ให้ใกล้`}:
    vd>2?{lvl:'warn',t:`แรงดันตกในสายย่อย ${f(vd,1)}% เกิน 2% ที่แนะนำสำหรับไมโคร`}:{lvl:'ok',t:`แรงดันตกในสายย่อย ${f(vd,1)}% ไม่เกิน 2%`});
  ck.push(M.cap?{lvl:'ok',t:'ปลายสายย่อยต่อเข้ากล่องต่อสาย (junction box) และขั้ว AC ที่ไม่ได้ใช้ปิดกันน้ำแล้ว'}:{lvl:'err',t:'ปลายสายย่อยต้องต่อเข้ากล่องต่อสาย (junction box) แล้วเดินสายเข้าตู้ ขั้ว AC ของ T-connector ที่ไม่ได้ใช้ต้องปิดกันน้ำ (ยังมีไฟจากไมโครตัวอื่น)'});
  ck.push(M.rcd?{lvl:'ok',t:'มี RCD/RCBO 30 mA ที่วงจรโซลาร์'}:{lvl:'warn',t:'ควรมี RCD หรือ RCBO 30 mA (ชนิดที่ผู้ผลิตแนะนำ) ที่วงจรโซลาร์ ตามมาตรฐานการติดตั้ง'});
  ck.push(M.pe?{lvl:'ok',t:'ต่อสายดิน PE ถึงไมโครทุกตัวและโครงแผง'}:{lvl:'err',t:'ต้องต่อสายดิน PE ไปที่ไมโครทุกตัวและโครงยึดแผง'});
  if(ptot>5000)ck.push({lvl:'warn',t:`กำลังรวม ${f(ptot/1000,1)} kW บนไฟ 1 เฟส ตรวจระเบียบการไฟฟ้า (PEA/MEA) เรื่องขนาดสูงสุดของระบบ 1 เฟส`});
  ck.sort((a,b)=>RANK[a.lvl]-RANK[b.lvl]);
  const lvl=ck.some(c=>c.lvl==='err')?'err':ck.some(c=>c.lvl==='warn')?'warn':'ok';
  return{br,mx,Ib,ia,vd,amp,ck,lvl,ptot,lim};
}
function micSVG(I,A){
  const B=A.br.length,rowH=110,top=50,H=top+B*rowH+40,W=1040,dbx=740,show=6;
  let s=`<svg viewBox="0 0 ${W} ${H}" class="micsvg" role="img" aria-label="ผังสาย AC ไมโครอินเวอร์เตอร์">`;
  s+=`<rect x="${dbx}" y="${top-24}" width="120" height="${B*rowH+8}" rx="8" class="mic-db"/><text x="${dbx+60}" y="${top-32}" text-anchor="middle" class="mic-lab">ตู้ไฟ AC</text>`;
  A.br.forEach((n,b)=>{
    const y=top+b*rowH,ty=y+44,over=A.lim>0&&n>A.lim,cls=over?' err':'';
    const xs=[];for(let j=0;j<Math.min(n,show);j++)xs.push(90+j*100);
    s+=`<text x="20" y="${y-6}" class="mic-sm">สายย่อย ${b+1}: ${n} ตัว · ${f(n*A.ia,1)} A</text>`;
    s+=`<path d="M40 ${ty} H${dbx+18}" class="mic-trunk${cls}"/>`;
    s+=`<g class="mic-cap ${MICRO.cap?'ok':'bad'}"><rect x="26" y="${ty-9}" width="16" height="18" rx="4"/>${MICRO.cap?'':`<text x="34" y="${ty-14}" text-anchor="middle" class="mic-warn">!</text>`}</g><text x="34" y="${ty+26}" text-anchor="middle" class="mic-sm">J-box</text>`;
    xs.forEach((x,j)=>{
      s+=`<g><rect x="${x-34}" y="${y}" width="68" height="18" rx="2" class="mic-pv"/><rect x="${x-24}" y="${y+24}" width="48" height="26" rx="4" class="mic-u"/><text x="${x}" y="${y+41}" text-anchor="middle" class="mic-ut">M${j+1}</text><circle cx="${x}" cy="${ty}" r="4" class="mic-t"/></g>`;
    });
    if(n>show)s+=`<text x="${90+show*100-30}" y="${y+42}" class="mic-lab">… +${n-show}</text>`;
    s+=`<g><rect x="${dbx+18}" y="${ty-16}" width="26" height="32" rx="3" class="mic-brk${n*A.ia>MICRO.brk?' err':''}"/><text x="${dbx+31}" y="${ty+30}" text-anchor="middle" class="mic-sm">${MICRO.brk} A</text></g>`;
    s+=`<path d="M${dbx+44} ${ty} H${dbx+70} V${top+B*rowH/2-8}" class="mic-bus"/>`;
  });
  const cy=top+B*rowH/2-8;
  s+=`<g><rect x="${dbx+70}" y="${cy-18}" width="32" height="36" rx="3" class="mic-rcd ${MICRO.rcd?'':'off'}"/><text x="${dbx+86}" y="${cy+4}" text-anchor="middle" class="mic-ut">RCD</text></g>`;
  s+=`<path d="M${dbx+102} ${cy} H${dbx+150}" class="mic-bus"/><rect x="${dbx+150}" y="${cy-20}" width="48" height="40" rx="5" class="mic-db"/><text x="${dbx+174}" y="${cy+5}" text-anchor="middle" class="mic-sm">kWh</text>`;
  s+=`<path d="M${dbx+198} ${cy} H${W-26}" class="mic-bus"/><text x="${W-20}" y="${cy-12}" text-anchor="end" class="mic-lab">กริด</text>`;
  s+=`<g class="mic-pe ${MICRO.pe?'':'off'}"><path d="M60 ${H-18} H${dbx+60}"/><text x="64" y="${H-24}" class="mic-sm">PE สายดิน ${MICRO.pe?'ต่อครบ':'ยังไม่ต่อ'}</text></g>`;
  return s+'</svg>';
}
function micAC(){
  const I=curInv(),on=isMicro(I),box=document.getElementById('acmicro'),std=document.getElementById('acstdwrap');
  if(!box||!std)return false;
  box.hidden=!on;std.hidden=on;if(!on)return false;
  const A=micAnalyze(I),M=MICRO;
  const v=document.getElementById('acverdict');v.className='verdict '+A.lvl;
  const first=A.ck.find(c=>c.lvl!=='ok');
  v.innerHTML=`<span class="pill ${A.lvl}">${LABEL[A.lvl]}</span><b>ไมโคร ${M.n} ตัว · ${A.br.length} สายย่อย · ${f(A.ptot/1000,2)} kW</b>${first?`<span class="vfirst">${first.t}</span>`:''}`;
  const opt=(arr,cur,suf)=>arr.map(x=>`<option value="${x}" ${+cur===+x?'selected':''}>${x}${suf}</option>`).join('');
  if(!box.dataset.built){box.dataset.built='1';box.innerHTML=`
    <div class="panelbox"><h2>ไมโครอินเวอร์เตอร์: วางแผนสาย AC</h2>
      <p class="hint tight">ไมโครติดใต้แผงและจ่ายไฟ AC ออกมาเลย ไม่มีสาย DC ยาวและไม่ต่อแบต ไมโครหลายตัวต่อพ่วงบนสาย AC trunk เส้นเดียวกันเป็นสายย่อย แต่ละสายย่อยมีเบรกเกอร์ของตัวเองในตู้</p>
      <div class="row3">
        <label for="mcn">จำนวนไมโครที่จะติดตั้ง (ใช้วางแผนสายย่อย)<input id="mcn" type="number" inputmode="numeric" min="1" max="60" step="1"></label>
        <label for="mcb">จำนวนสายย่อย (วงจร)<input id="mcb" type="number" inputmode="numeric" min="1" max="20" step="1"></label>
        <label for="mcbrk">เบรกเกอร์ต่อสายย่อย<select id="mcbrk"></select></label>
        <label for="mccab">ขนาดสาย AC<select id="mccab"></select></label>
        <label for="mclen">ความยาวสายย่อยถึงตู้ (m)<input id="mclen" type="number" inputmode="decimal" min="1" max="200" step="1"></label>
      </div>
      <div class="row3 micchk"><label class="chk"><input id="mccap" type="checkbox"> มีกล่องต่อสายปลายสายย่อย / ปิดขั้วที่ไม่ใช้</label><label class="chk"><input id="mcrcd" type="checkbox"> มี RCD/RCBO 30 mA</label><label class="chk"><input id="mcpe" type="checkbox"> ต่อสายดิน PE ครบ</label></div>
    </div>
    <div class="canvas micwrap" id="micsvgbox"></div>
    <div class="panelbox"><div id="micinfo" class="hint tight"></div></div>
    <div><h2>ผลการตรวจ</h2><ul id="micchecks" class="checks"></ul></div>
    <details class="panelbox micman"><summary><b>ขั้นตอนเปิด/ปิด และไฟสถานะ (จากคู่มือ Deye SUN-M G4)</b></summary>
      <div class="micmang"><div><h3>เปิดระบบ</h3><ol><li>เปิดเบรกเกอร์ AC ของแต่ละสายย่อย</li><li>เปิดเบรกเกอร์เมนของบ้าน รอประมาณ 1 นาที ระบบเริ่มผลิตไฟ</li><li>ไฟกะพริบแดงหลังเปิด AC 1 นาที แล้วเปลี่ยนเป็นกะพริบน้ำเงิน = ผลิตไฟปกติ (กะพริบเร็ว = กำลังมาก)</li><li>ตั้งค่า WiFi ให้ไมโครส่งข้อมูลทุก 5 นาที</li></ol>
      <h3>ปิด / เปลี่ยนตัว</h3><ol><li>ปิดเบรกเกอร์ AC ของสายย่อยก่อน</li><li>ถอดขั้ว AC ของไมโคร</li><li>คลุมแผงด้วยวัสดุทึบแสง</li><li>ถอดขั้ว DC (ห้ามถอด DC ขณะมีกระแส)</li></ol></div>
      <div><h3>ไฟสถานะ LED</h3><table class="mictab"><tr><td>น้ำเงินกะพริบช้า</td><td>ผลิตไฟน้อย</td></tr><tr><td>น้ำเงินกะพริบเร็ว</td><td>ผลิตไฟมาก</td></tr><tr><td>แดงกะพริบ</td><td>ไม่ผลิตไฟ</td></tr><tr><td>แดง 2 ครั้ง</td><td>แรงดัน AC ต่ำหรือสูงเกิน</td></tr><tr><td>แดง 3 ครั้ง</td><td>กริดผิดปกติ</td></tr><tr><td>แดง 4 ครั้ง</td><td>GFDI ไฟรั่วลงดินฝั่ง PV</td></tr></table>
      <h3>ข้อกำหนดติดตั้ง</h3><ul><li>สาย DC จากแผงถึงไมโครยาวไม่เกิน 3 m</li><li>ห้ามเสียบ DC ขณะถอดขั้ว AC ออก</li><li>เว้นช่องใต้ไมโครถึงหลังคาอย่างน้อย 1.5 cm และไม่ให้โดนแดด/ฝนโดยตรง</li><li>แนะนำติดตั้ง SPD ในตู้มิเตอร์</li><li>สาย AC ของไมโครเป็น TC-ER 1 mm² (16 AWG)</li></ul></div></div></details>`;
    const q=id=>document.getElementById(id),go=()=>{micAC();if(typeof render==='function')render();if(typeof backupRun==='function')backupRun();if(typeof touch==='function')touch()};
    q('mcn').addEventListener('input',e=>{const n=parseInt(e.target.value,10);if(n>=1){MICRO.n=Math.min(60,n);go()}});
    q('mcb').addEventListener('input',e=>{const n=parseInt(e.target.value,10);if(n>=1){MICRO.br=Math.min(20,n);go()}});
    q('mclen').addEventListener('input',e=>{const n=parseFloat(e.target.value);if(n>0){MICRO.len=Math.min(200,n);go()}});
    q('mcbrk').addEventListener('change',e=>{MICRO.brk=+e.target.value;go()});q('mccab').addEventListener('change',e=>{MICRO.cab=+e.target.value;go()});
    ['cap','rcd','pe'].forEach(k=>q('mc'+k).addEventListener('change',e=>{MICRO[k]=e.target.checked;go()}));
  }
  const q=id=>document.getElementById(id),act=document.activeElement;
  if(act!==q('mcn'))q('mcn').value=M.n;if(act!==q('mcb'))q('mcb').value=M.br;if(act!==q('mclen'))q('mclen').value=M.len;
  q('mcbrk').innerHTML=opt(MIC_BRK,M.brk,' A');q('mccab').innerHTML=Object.keys(MIC_AMP).map(c=>`<option value="${c}" ${+c===+M.cab?'selected':''}>${c} mm² (~${MIC_AMP[c]} A)</option>`).join('');
  q('mccap').checked=M.cap;q('mcrcd').checked=M.rcd;q('mcpe').checked=M.pe;
  q('micsvgbox').innerHTML=micSVG(I,A);
  q('micinfo').innerHTML=`${esc(I.name)} · AC ${f(I.pac/1000,2)} kW · กระแส AC ${f(A.ia,1)} A ต่อตัว · ผู้ผลิตกำหนดไม่เกิน ${A.lim||'—'} ตัวต่อสายย่อย · สายย่อยที่ยาวที่สุดมี ${A.mx} ตัว = ${f(A.Ib,1)} A<br>ขนาดสายที่รับกระแสเป็นค่าประมาณสำหรับสายทองแดงร้อยท่อ ตรวจกับตารางของ วสท. ตามวิธีติดตั้งจริง`;
  q('micchecks').innerHTML=checksHTML(A.ck);
  return true;
}
