/* menu 17: Commissioning practice page behaves as described in docs/manual-17-fusion.md */
const { load, eq, done } = require('./lib');
load().then(({ ev, errs }) => {
  eq('no script errors on load', errs.join(' | '), '');
  ev(`showTab('fusion');FU.page='com';fuRender();fcReset();fcRender()`);
  eq('page renders 6 step chips', ev(`document.querySelectorAll('#fcsteps [data-fcs]').length`), '6');
  eq('fresh run passes nothing important', ev(`fcScore().ok`), 'false');
  /* step 1: hidden fault is found from the readings */
  eq('string 1 reversed reads negative', ev(`fcRead('dc1')<0`), 'true');
  eq('negative reading fails verdict', ev(`fcVerdict('dc1',fcRead('dc1'))`), 'false');
  ev(`FC.fault0='over';FC.fault='over'`);
  eq('over-length string exceeds max input voltage', ev(`fcRead('dc1')>fcInv().vmax`), 'true');
  ev(`FC.fault0='insul';FC.fault='insul'`);
  eq('low insulation fails verdict', ev(`fcVerdict('iso',fcRead('iso'))`), 'false');
  ev(`FC.fault0='rev';FC.fault='rev'`);
  ev(`['dc1','dc2','iso','acln','npe'].forEach(k=>fcAct('meas',k));fcAct('fix')`);
  eq('fix clears fault and readings', ev(`FC.fault+' '+Object.keys(FC.meas).length+' '+FC.fixed`), 'none 0 true');
  ev(`FC.pre=[0,1,2,3];['dc1','dc2','iso','acln','npe'].forEach(k=>fcAct('meas',k))`);
  eq('all readings pass after the fix', ev(`['dc1','dc2','iso','acln','npe'].every(k=>fcVerdict(k,FC.meas[k]))`), 'true');
  /* step 2: connect and login */
  ev(`FC.step=1;fcRender();fcAct('method','bt')`);
  eq('bluetooth is not available', ev(`fcChecks().con[0][0]`), 'false');
  ev(`fcAct('method','wlan');fcAct('ssid','other')`);
  eq('neighbour SN is not accepted', ev(`fcChecks().con[1][0]`), 'false');
  ev(`fcAct('ssid','own')`);
  for (let i = 0; i < 5; i++) ev(`document.getElementById('fcpw').value='wrong';fcAct('login')`);
  eq('5 wrong passwords lock the account', ev(`FC.login.locked+' '+FC.login.fails`), 'true 5');
  ev(`fcAct('unlock');document.getElementById('fcpw').value='Ubu@2026';fcAct('login')`);
  eq('correct initial password logs in', ev(`FC.login.ok`), 'true');
  ev(`document.getElementById('fcpw2').value='Ubu@2026';fcAct('pw2')`);
  eq('same password is refused', ev(`FC.login.pw2`), 'false');
  ev(`document.getElementById('fcpw2').value='short';fcAct('pw2')`);
  eq('weak password is refused', ev(`FC.login.pw2`), 'false');
  ev(`document.getElementById('fcpw2').value='Solar2026x';fcAct('pw2')`);
  eq('strong new password accepted', ev(`FC.login.pw2`), 'true');
  /* step 3: quick settings */
  ev(`FC.step=2;fcRender();FC.area='PEA';FC.qs.gc='TAI-MEA';document.getElementById('fcrp').value='12345678';fcAct('saveqs')`);
  eq('wrong grid code fails its check', ev(`fcChecks().qs[0][0]`), 'false');
  ev(`Object.assign(FC.qs,{gc:'TAI-PEA',omode:'four',tz:'7',net:'wlanfe',router:'HOME-2G',apc:'zero'});fcRender();document.getElementById('fcrp').value='12345678';fcAct('saveqs')`);
  eq('correct quick settings all pass', ev(`fcChecks().qs.every(x=>x[0])`), 'true');
  /* step 4: power on */
  ev(`FC.step=3;fcRender();fcAct('sw','dc')`);
  eq('DC only: not on-grid', ev(`fcRun().st`), 'noac');
  ev(`fcAct('alloff');fcAct('sw','ac')`);
  eq('AC only: no DC', ev(`fcRun().st`), 'nodc');
  ev(`fcAct('sw','dc')`);
  eq('AC then DC: on-grid', ev(`fcRun().st+' '+fcOrderOk()`), 'on true');
  ev(`fcAct('alloff');fcAct('sw','dc');fcAct('sw','ac')`);
  eq('DC before AC is flagged', ev(`fcOrderOk()`), 'false');
  ev(`fcAct('alloff');fcAct('sw','ac');fcAct('sw','dc')`);
  /* step 5 and 6 */
  ev(`FC.step=4;fcRender()`);
  eq('dongle online with correct router', ev(`fcCloud().ok`), 'true');
  eq('string voltages balanced', ev(`fcChecks().ve[0][0]`), 'true');
  eq('whole run passes', ev(`fcScore().ok`), 'true');
  /* faults left in place show their alarms */
  for (const [f, alm] of [['rev', 'String Reverse Connection'], ['insul', 'Low Insulation Resistance'], ['over', 'High String Input Voltage']])
    eq(`power on with ${f} gives its alarm`, ev(`FC.fault='${f}';fcRun().alm?FC_ALM[fcRun().alm].n:''`), alm);
  ev(`FC.fault='none'`);
  /* router mistakes show in the dongle LED */
  eq('5 GHz router is refused', ev(`FC.qs.router='HOME-5G';fcCloud().ok`), 'false');
  eq('short WiFi password is refused', ev(`FC.qs.router='HOME-2G';FC.qs.rpassOk=false;fcCloud().ok`), 'false');
  /* save/restore round trip keeps no password */
  const snap = ev(`FC.qs.rpassOk=true;JSON.stringify(fuSnapshot().fc)`);
  eq('snapshot has no password field', /pass|pw"/i.test(snap.replace(/rpassOk/g, '').replace(/pw2/g, '')), 'false');
  eq('restore keeps progress', ev(`const s=fuSnapshot();fcReset();fuRestore(s);FC.login.ok+' '+FC.qs.gc+' '+FC.sw.ac`), 'true TAI-PEA true');
  eq('bad restore data is ignored safely', ev(`fcRestore({step:99,area:'x',qs:{gc:'evil'},sw:{log:['x']}});FC.step+' '+FC.area+' '+FC.qs.gc+' '+FC.sw.log.length`), '5 PEA  0');
  done('menu17');
});
