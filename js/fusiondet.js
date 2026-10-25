/* ---- FusionSolar: หน้า Details ของอินเวอร์เตอร์ (Real-Time Device Data / Basic Information / String Details) และปุ่มควบคุม ---- */
function fuDetRender(D,i){
  const el=document.getElementById('fudet');if(!el)return;
  const P=fuPv(),dv=fuDev(),I=D.I,p=D.pac[i],st=D.st[i],on=D.online[i],h=i*5/60,tm=m=>`${SIM.date} ${pad2(Math.floor(m/60))}:${pad2(Math.round(m%60))}:00`;
  const act=['fault','manual','gridwait','commshut','starting','cmdoff'].includes(st)||p>0;
  const tri=dv.tri,V=D.gv[i],ph=[V,V*1.003,V*.997];
  const adj=FU.adj||{mode:'none',v:0},kW=p/1000;
  let Q=0,pf=p>0?1:0;
  if(p>0&&adj.mode==='pf'){const a=Math.abs(adj.v);Q=kW*Math.tan(Math.acos(Math.min(1,a)))*(adj.v<0?-1:1);pf=a}
  else if(p>0&&adj.mode==='qs'){Q=adj.v*I.pac/1000;pf=Math.abs(kW)/Math.hypot(kW,Q)}
  const cur=p>0?Math.hypot(kW,Q)*1000/((tri?3:1)*Math.max(V,1)):0;
  const pl=FU.pLim<100?`P=${f(FU.pLim,1)}% (Active power derating by percentage)`:(st==='derate'?'P=60.0% (Self-derating)':'P=100.0% (No derating)');
  const qs=adj.mode==='qs'?`Q/S=${f(adj.v,3)} (Q/S adjustment)`:adj.mode==='pf'?`PF=${f(adj.v,3)} (Power factor adjustment)`:'Q/S=0.000 (No adjustment)';
  const first=D.R.first,last=D.R.last;
  const startT=first>=0&&i>=first?tm(first*5):'--',stopT=last>=0&&i>last?tm((last+1)*5):'--';
  const n=(v,d)=>f(v,d);
  const cell=(k,v)=>`<td class="k"><i></i>${k}</td><td class="v">${v}</td>`;
  const rows=[
    [['Inverter status',FU_ST[st][0]],['Daily energy',n(D.Ecum[i][0],2)+' kWh'],['Total yield',n(D.tot||0,2)+' kWh']],
    [['Active power',n(kW,3)+' kW'],['Output reactive power',n(Q,3)+' kvar'],['Inverter rated power',n(I.pac/1000,3)+' kW']],
    [['Power factor',n(pf,3)],['Grid frequency',(act?n(D.gf[i],2):'0.00')+' Hz'],['Output mode',tri?esc(P.omode):'Single-phase']],
    ...(tri?[[['Grid phase A current',n(cur,3)+' A'],['Grid phase B current',n(cur,3)+' A'],['Grid phase C current',n(cur,3)+' A']],
    [['Phase A voltage',(act?n(ph[0],1):'0.0')+' V'],['Phase B voltage',(act?n(ph[1],1):'0.0')+' V'],['Phase C voltage',(act?n(ph[2],1):'0.0')+' V']]]:[[['Grid current',n(cur,3)+' A'],['Grid voltage',(act?n(ph[0],1):'0.0')+' V'],['','']]]),
    [['Inverter startup time',startT],['Inverter shutdown time',stopT],['Internal temperature',n(D.tmp[i],1)+'℃']],
    [['Insulation resistance',n(D.ir[i],3)+' MΩ'],['Active power adjustment status',pl],['Reactive power adjustment status',qs]],
    [['Device replacement status','NA'],['RS485-2 port mode','Master'],['','']]];
  const pvc=j=>{const d=D.pv[j][i];return d&&d.on&&d.V>0?[n(d.V,1),n(d.I,2)]:['0','0']};
  const pvs=Array.from({length:dv.nin},(_,j)=>j<2?pvc(j):['0','0']);
  const blk=j=>D.blocks[j];
  el.innerHTML=`<div class="fudb"><label class="fusw"><input type="checkbox" id="fuonoff" ${FU.offFrom==null?'checked':''} aria-label="เปิด/ปิดอินเวอร์เตอร์"><span></span>${FU.offFrom==null?'On':'Off'}</label>
    <button class="btn sm" data-fa="reset">Reset</button><button class="btn sm pri" data-fa="opt">Optimizer Search</button><button class="btn sm" data-fa="arc">DC Arc Fault Clearance</button><button class="btn sm" data-fa="pwr">Active Power Adjustment</button><button class="btn sm" data-fa="q">Reactive Power Adjustment</button><button class="btn sm" data-fa="pf">Power factor adjustment</button></div>
    <div id="fuadjp" class="fuadjp" hidden></div><p class="hint tight" id="fuamsg" role="status"></p>
    <h3>Real-Time Device Data</h3>
    <table class="fut fud"><tbody><tr><th>String</th>${pvs.map((_,k)=>`<th>PV${k+1}</th>`).join('')}</tr><tr><td>Input Voltage (V)</td>${pvs.map(x=>`<td>${x[0]}</td>`).join('')}</tr><tr><td>Input Current (A)</td>${pvs.map(x=>`<td>${x[1]}</td>`).join('')}</tr></tbody></table>
    <table class="fut fud3"><tbody>${rows.map(r=>`<tr>${r.map(c=>c[0]?cell(c[0],c[1]):'<td></td><td></td>').join('')}</tr>`).join('')}</tbody></table>
    <h3>Basic Information</h3><table class="fut fud3"><tbody>
    <tr>${cell('Device name',esc('INV-'+(dv.hw?'':'DEMO-')+'0000000000'))}${cell('Device type','Inverter')}${cell('SN',esc(fuPr.sn))}</tr>
    <tr>${cell('Device replacement record','--')}${cell('Model',esc(I.name))}${cell('Software version',dv.hw?esc(fuPr.sw):'--')}</tr>
    <tr>${cell('Package Name',dv.hw?'SUN2000MB_'+esc(fuPr.sw):'--')}${cell('Monitoring hardware version','B')}<td></td><td></td></tr></tbody></table>
    <h3>String Details <span class="fuinfo" tabindex="0" data-tip="ข้อมูลแผงของแต่ละสตริง ดึงจากอุปกรณ์ที่เลือกในแท็บ 01">ⓘ</span></h3>
    <table class="fut"><thead><tr><th></th><th>String</th><th>2-in-1 String</th><th>Module Manufacturer</th><th>Modules Type</th><th>Module Type</th><th>Max. Module Power (Pmax) (W)</th><th>Module Quantity</th><th>String Capacity (Wp)</th></tr></thead><tbody>${pvs.map((_,j)=>{const b=j<2?blk(j):null;return `<tr><td>+</td><th>PV${j+1}</th><td><input type="checkbox" disabled aria-label="2-in-1"></td><td>${b?esc(String(PV.name||'--').split(' ')[0]):'--'}</td><td>${b?'Crystalline silicon':'--'}</td><td>${b?esc(PV.name||'--'):'--'}</td><td>${b?n(PV.pmax,0):'--'}</td><td>${b?b.ns*(b.mp||1):'--'}</td><td>${b?n(b.n*PV.pmax,2):'0.00'}</td></tr>`}).join('')}</tbody></table>`;
}
function fuAdjOpen(kind){
  const b=document.getElementById('fuadjp');if(!b)return;
  const d={pwr:['Active power derating (%)',FU.pLim,0,100,'0~100'],q:['Q/S (reactive power compensation)',(FU.adj&&FU.adj.mode==='qs')?FU.adj.v:0,-0.6,0.6,'-0.600~0.600'],pf:['Power factor',(FU.adj&&FU.adj.mode==='pf')?FU.adj.v:1,-1,1,'-1.000~-0.800 หรือ 0.800~1.000']}[kind];
  b.dataset.kind=kind;b.hidden=false;
  b.innerHTML=`<label>${d[0]} <input type="text" inputmode="decimal" id="fuadjv" value="${d[1]}"> <small>[${d[4]}]</small></label><button class="btn sm pri" id="fuadjok">Submit</button><button class="btn sm" id="fuadjno">Cancel</button><em class="fuer" id="fuadje"></em>`;
}
function initFudet(){
  const root=document.getElementById('fudet');if(!root)return;
  const msg=t=>{const m=document.getElementById('fuamsg');if(m)m.textContent=t};
  root.addEventListener('change',e=>{if(e.target.id!=='fuonoff')return;FU.offFrom=e.target.checked?null:FU.m;if(e.target.checked)FU.startAt=FU.startAt;fuRender();touch()});
  root.addEventListener('click',e=>{
    const a=e.target.closest('[data-fa]');
    if(a){const k=a.dataset.fa;
      if(k==='pwr'||k==='q'||k==='pf'){fuAdjOpen(k);return}
      if(k==='reset'){FU.offFrom=null;FU.startAt=FU.m;fuRender();touch();msg('สั่ง Reset แล้ว อินเวอร์เตอร์เริ่มเครื่องใหม่');return}
      if(k==='arc'){askConfirm('Confirm','DC arc fault alarms can be cleared only after confirmation by the owner, which will trigger the automatic reset of the inverter. Are you sure you want to continue?','OK').then(ok=>{if(!ok)return;FU.startAt=FU.m;fuRender();touch();msg('ล้างสถานะ DC Arc Fault แล้ว และอินเวอร์เตอร์รีเซ็ตอัตโนมัติ')});return}
      if(k==='opt'){msg('ไม่พบ Optimizer ในระบบ (ไม่ได้ติดตั้ง) — ฟังก์ชันนี้ใช้เมื่อต่อ Optimizer กับแผงทุกแผง');return}}
    if(e.target.id==='fuadjno'){document.getElementById('fuadjp').hidden=true;return}
    if(e.target.id==='fuadjok'){
      const kind=document.getElementById('fuadjp').dataset.kind,v=parseFloat(document.getElementById('fuadjv').value),er=document.getElementById('fuadje');
      let bad=!isFinite(v);
      if(kind==='pwr')bad=bad||v<0||v>100;else if(kind==='q')bad=bad||v<-0.6||v>0.6;else bad=bad||Math.abs(v)<0.8||Math.abs(v)>1;
      if(bad){er.textContent='ค่าอยู่นอกช่วง';return}
      if(kind==='pwr')FU.pLim=v;else FU.adj=v===0&&kind==='q'?{mode:'none',v:0}:{mode:kind==='q'?'qs':'pf',v};
      document.getElementById('fuadjp').hidden=true;fuRender();touch();msg('ตั้งค่าแล้ว (จำลอง)');
    }
  });
}
