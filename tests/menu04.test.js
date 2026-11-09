/* menu 04: house wiring answer and wrong example behave as described in docs/manual-04-ac.md */
const { load, eq, done } = require('./lib');
load().then(({ ev, errs }) => {
  eq('no script errors on load', errs.join(' | '), '');
  eq('answer passes', ev(`showTab('ac');ahPreset('good');lastAH.lvl+' '+JSON.stringify(lastAH.n)`), 'ok {"err":0,"warn":0}');
  eq('answer powers and earths both outlets', ev(`JSON.stringify([lastAH.pw,lastAH.gnd])`), '[{"O1":true,"O2":true},{"O1":true,"O2":true}]');
  eq('leakage test with earth trips the RCBO', ev(`ahFault('O1');JSON.stringify(AH.trip)+' '+lastAH.pw.O1`), '{"D1":1} false');
  eq('wrong example has 3 errors', ev(`ahPreset('bad');lastAH.n.err`), '3');
  eq('wrong example: sub-board N–G bond is caught', ev(`lastAH.ck.some(c=>c[0]==='err'&&/ตู้ชั้น 2/.test(c[1])&&/ต่อฝาก/.test(c[1]))`), 'true');
  eq('wrong example: leakage on floor 2 is dangerous', ev(`ahFault('O2');AH.fault.ok`), 'false');
  eq('L to N wire is a short', ev(`ahPreset('clear');AH.wires.push({a:'MTR.OL',b:'MTR.ON'});ahRender();lastAH.ck[0][1].startsWith('ลัดวงจร')`), 'true');
  /* solar consumer-unit page */
  ev(`AS.mode='split'`);
  eq('split: answer passes', ev(`asPreset('good');lastAS.lvl+' '+JSON.stringify(lastAS.n)`), 'ok {"err":0,"warn":0}');
  eq('split: outage keeps only the backup load on', ev(`AS.grid=false;asRender();JSON.stringify(lastAS.S.pw)`), '{"LD1":false,"LD2":true}');
  eq('split: wrong example has 3 errors', ev(`AS.grid=true;asPreset('bad');lastAS.n.err`), '3');
  eq('split: backup N tied to grid N is caught', ev(`lastAS.ck.some(c=>c[0]==='err'&&/BACKUP N/.test(c[1]))`), 'true');
  ev(`AS.mode='full'`);
  eq('full backup: answer passes', ev(`asPreset('good');lastAS.lvl`), 'ok');
  eq('full backup: outage keeps every load on', ev(`AS.grid=false;asRender();JSON.stringify(lastAS.S.pw)`), '{"LD1":true,"LD2":true}');
  eq('back-feed (BACKUP to grid side) is an error', ev(`AS.grid=true;asPreset('clear');AS.wires.full.push({a:'MTR.OL',b:'INV.BL'});asRender();lastAS.ck.some(c=>c[0]==='err'&&/ย้อน/.test(c[1]))`), 'true');
  done('menu04');
});
