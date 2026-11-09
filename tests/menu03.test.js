/* menu 03: the example numbers quoted in docs/manual-03-wiring.md must stay what the program really shows.
   If a change to the model moves one of these on purpose, update the manual and this file together. */
const { load, eq, done } = require('./lib');

load().then(({ ev, errs }) => {
  eq('no script errors on load', errs.join(' | '), '');
  ev(`showTab('wiring');PRESETS.s9();render();AID.meter=true;MTR.r.on='i1:p';MTR.b.on='i1:n'`);
  const volt = t => ev(`AID.tc='${t}';meterRead(analyze()).v`);
  eq('9S Voc at coldest cell (10°C)', volt('min'), '499.7');
  eq('9S Voc at 25°C', volt('25'), '485.1');
  eq('9S Voc at hottest cell (70°C)', volt('max'), '441.4');
  eq('9S running voltage', ev(`AID.tc='25';AID.run=true;render();meterRead(analyze()).v`), '401.0');
  eq('clamp on a series wire', ev(`AID.clamp=true;CLP.on={k:fwKey(st.wires[3]),t:.5};clampRead(analyze()).v`), '14.6');
  eq('run tag on the DC+ wire', ev(`render();[...document.querySelectorAll('#svg .wtag.run')].map(g=>g.textContent).join()`), '401 V · 14.6 A · 5.85 kW');
  eq('reversed meter leads read negative', ev(`AID.run=false;MTR.r.on='i1:n';MTR.b.on='i1:p';meterRead(analyze()).v`), '-485.1');
  eq('wire classification', ev(`PRESETS.m22();st.wires.map(w=>wkind(w.a,w.b).s).join(',')`), 'เข้า DC1−,เข้า DC1−,อนุกรม,อนุกรม,เข้า DC1+,เข้า DC1+');
  eq('2S2P: each string wire carries one string current', ev(`AID.run=true;const A=analyze();A.res[0].lvl='ok';const I=aidCur(A);st.wires.map((w,i)=>(I[i]||0).toFixed(2)).join(',')`), '14.59,14.59,14.59,14.59,14.59,14.59');
  eq('short circuit reads 0 V with an error', ev(`AID.run=false;PRESETS.s9();st.wires.push({a:'1:p',b:'1:n'});MTR.r.on='9:p';MTR.b.on='1:n';const R=meterRead(analyze());R.v+' '+R.lvl`), '0.0 err');
  /* fault-finding codes quoted in the manual */
  eq('fault 4242 is panel #6 weak', ev(`faultStart(4242);AID.fault.type+' '+AID.fault.id+' '+st.panels.length`), 'weak 6 6');
  eq('fault 4242 string Voc', ev(`MTR.r.on='i1:p';MTR.b.on='i1:n';meterRead(analyze()).v`), '305.4');
  eq('fault 4242 running voltage', ev(`AID.run=true;meterRead(analyze()).v`), '252.5');
  eq('fault 1001 is an open joint #4+ – #5−', ev(`faultEnd();faultStart(1001);AID.fault.type+' '+AID.fault.w`), 'open 4:p|5:n');
  eq('fault 1001 reads 0 V at the inverter', ev(`AID.run=false;MTR.r.on='i1:p';MTR.b.on='i1:n';meterRead(analyze()).v`), '0.0');
  eq('fault 1001 across the open joint reads the whole string', ev(`MTR.r.on='5:n';MTR.b.on='4:p';Math.abs(+meterRead(analyze()).v)>300`), 'true');
  eq('missions all complete after a full run', ev(`faultEnd();AID.mis={};AID.misDone={};PRESETS.s9();AID.run=true;AID.meter=true;AID.clamp=true;MTR.r.on='i1:p';MTR.b.on='i1:n';CLP.on={k:fwKey(st.wires[2]),t:.5};render();render();document.getElementById('wmisp').textContent`), '6/6');
  done('menu03');
});
