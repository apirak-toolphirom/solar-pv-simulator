/* menu 17 หน้า "อ่าน log": กราฟวิเคราะห์เลือกเส้นเอง (js/hwplot.js) ตามที่เขียนใน docs/manual-17-fusion.md */
const { load, eq, done } = require('./lib');
load().then(({ w, ev, errs }) => {
  eq('no script errors on load', errs.join(' | '), '');
  ev(`ACC.role='teacher';showTab('fusion');FU.page='log';fuRender();hwRender();document.getElementById('hwsample').click()`);
  setTimeout(() => {
    eq('series list uses every numeric column', ev(`HWP.S.length>=8`), 'true');
    eq('default shows power lines', ev(`HWP.on.size>0&&HWP.S.filter(s=>HWP.on.has(s.key)).every(s=>/kW|power/i.test(s.unit+s.name))`), 'true');
    eq('chart draws one path per visible line', ev(`document.querySelectorAll('#hwpchart path[stroke]').length===HWP.on.size`), 'true');
    ev(`document.querySelector('#hwpchips [data-hwpk]').click()`);
    eq('chip click toggles the line off/on', ev(`const n=HWP.on.size;document.querySelector('#hwpchips [data-hwpk]').click();Math.abs(HWP.on.size-n)===1`), 'true');
    ev(`hwpPreset('cur');hwpChips();hwpDraw()`);
    eq('current preset selects A series', ev(`[...HWP.on].every(k=>/^a$/i.test(HWP.S.find(s=>s.key===k).unit))&&HWP.on.size>=2`), 'true');
    eq('stats table has a row per visible line', ev(`document.querySelectorAll('#hwpstat table.hwstat tbody tr').length===HWP.on.size`), 'true');
    ev(`hwpPreset('pow');hwpDraw();HWP.sel=[11*60+Math.floor(HWP.g.x0/1440)*1440,13*60+Math.floor(HWP.g.x0/1440)*1440];hwpDraw()`);
    eq('selected range is analysed (energy column for kW lines)', ev(`/พลังงานรวม/.test(document.getElementById('hwpstat').innerHTML)&&/ที่ลากเลือก/.test(document.getElementById('hwpstat').textContent)`), 'true');
    const e = +ev(`hwpStats(HWP.g.vis,HWP.sel[0],HWP.sel[1]).find(r=>r.E!=null).E`);
    eq('energy over 2 h of midday power is plausible (>1 kWh)', String(e > 1 && e < 25), 'true');
    ev(`hwpPreset('vol');hwpPreset('cur');HWP.mode='unit';hwpDraw()`);
    ev(`HWP.on=new Set(HWP.S.slice(0,3).map(s=>s.key));HWP.sel=null;hwpDraw()`);
    ev(`HWP.on=new Set(HWP.S.map(s=>s.key));hwpDraw()`);
    eq('more than 2 unit kinds falls back to % scale with a note', ev(`document.getElementById('hwpnote').textContent.length>0`), 'true');
    eq('all-day scope works', ev(`HWP.scope='all';hwpApplyScope();hwpDraw();document.querySelectorAll('#hwpchart path[stroke]').length>0`), 'true');
    eq('zoom to selection then reset', ev(`HWP.scope='day';hwpApplyScope();HWP.sel=[8*60+Math.floor(HWP.g.x0/1440)*1440,10*60+Math.floor(HWP.g.x0/1440)*1440];hwpDraw();document.getElementById('hwpzoom').click();const z=HWP.view?HWP.view[1]-HWP.view[0]:0;document.getElementById('hwpclear').click();z===120&&HWP.view===null&&HWP.sel===null`), 'true');
    /* รูปแบบ Plant Report ของ FusionSolar: รายชั่วโมง (kWh ต่อชั่วโมง) และรายวัน */
    const hr = [['Plant Report_TEST'], ['Statistical Period','PV Yield (kWh)','Export (kWh)','Import (kWh)']];
    const pv = [0,0,0,0,0,0,.5,1.5,2,2.5,6,6,5.5,7,5.5,3.5,2,.1,0,0,0,0,0,0];
    pv.forEach((v, h) => hr.push([`2026-11-18 ${String(h).padStart(2,'0')}:00:00`, v, 0, 3]));
    const dy = [['Plant Report_TEST'], ['Statistical Period','PV Yield (kWh)','Total Yield (kWh)','Peak Power (kW)']];
    for (let d = 1; d <= 10; d++) dy.push([`2026-10-${String(d).padStart(2,'0')}`, 40 + d, 38000 + d * 40, 9 + d / 10]);
    ev(`HW.files=[];hwAdd(${JSON.stringify([{ name: 'h.xlsx', rows: hr }, { name: 'd.xlsx', rows: dy }])},false)`);
    eq('hourly file is interval, daily file is report', ev(`HW.files.map(f=>f.auto).join()`), 'interval,report');
    eq('hourly energy sums to 42.1 kWh in the stats', ev(`HWP.on=new Set(HWP.S.filter(s=>!s.rep&&/PV Yield/.test(s.name)).map(s=>s.key));hwpDraw();hwpStats(HWP.g.vis,HWP.g.x0,HWP.g.x1)[0].E.toFixed(1)`), '42.1');
    eq('daily series appear only under "all days" scope', ev(`const a=HWP.S.filter(s=>s.rep).every(s=>s.sp.length===0);HWP.scope='all';hwpApplyScope();a&&HWP.S.filter(s=>s.rep).every(s=>s.sp.length===10)`), 'true');
    eq('cumulative Total Yield uses last-first (9×40=360)', ev(`HWP.on=new Set(HWP.S.filter(s=>s.rep&&/Total Yield/.test(s.name)).map(s=>s.key));hwpDraw();hwpStats(HWP.g.vis,HWP.g.x0,HWP.g.x1)[0].E.toFixed(0)`), '360');
    eq('daily Peak Power gets no integrated energy', ev(`HWP.on=new Set(HWP.S.filter(s=>s.rep&&/Peak Power/.test(s.name)).map(s=>s.key));hwpDraw();hwpStats(HWP.g.vis,HWP.g.x0,HWP.g.x1)[0].E`), 'null');
    eq('daily-only view draws', ev(`document.querySelectorAll('#hwpchart path[stroke]').length`), '1');
    /* จำลองไม่เปิด Zero Export: ชั่วโมงเที่ยงถูกจำกัดตามโหลด (ซื้อไฟ ≈ 0) */
    const hr2 = [['Statistical Period','PV Yield (kWh)','Export (kWh)','Import (kWh)']];
    const pv2 = [0,0,0,0,0,0,1,2,3,4,5,6,6,6,5,4,3,2,1,0,0,0,0,0], im2 = [2,2,2,2,2,2,1.5,1,.5,.5,.1,.05,.05,.05,.3,1,1.5,2,2,2,2,2,2,2];
    pv2.forEach((v, h) => hr2.push([`2026-11-18 ${String(h).padStart(2,'0')}:00:00`, v, 0, im2[h]]));
    ev(`HW.files=[];hwAdd(${JSON.stringify([{ name: 'z.xlsx', rows: hr2 }])},false);HWP.sim.kwp=10;HWP.sim.method='kwp';HWP.sim.pr=.8;document.getElementById('hwpsimon').click()`);
    eq('simulation adds 3 dashed lines', ev(`HWP.S.filter(s=>s.sim).length`), '3');
    eq('potential is never below the real PV', ev(`const pv=HWP.S.find(s=>/PV Yield/.test(s.name)&&!s.sim),p=HWP.S.find(s=>s.key==='sim|pot');p.pts.every((q,i)=>q.y>=pv.pts[i].y-1e-9)`), 'true');
    eq('midday hours are lifted, morning hours are not', ev(`const pv=HWP.S.find(s=>/PV Yield/.test(s.name)&&!s.sim),p=HWP.S.find(s=>s.key==='sim|pot');(p.pts[12].y>pv.pts[12].y+.5)+' '+(p.pts[6].y===pv.pts[6].y)`), 'true true');
    eq('result panel shows limited energy and the other bound', ev(`/ถูกจำกัดโดยประมาณ/.test(document.getElementById('hwpsimres').textContent)&&/เทียบอีกวิธี/.test(document.getElementById('hwpsimres').textContent)`), 'true');
    eq('dashed paths are drawn', ev(`document.querySelectorAll('#hwpchart path[stroke-dasharray]').length>=1`), 'true');
    eq('daily-only data: clear message, no crash', ev(`HW.files=[];hwAdd(${JSON.stringify([{ name: 'd.xlsx', rows: dy }])},false);HWP.sim.on=true;hwPlotRender();document.getElementById('hwpsimres').textContent.length>0`), 'true');
    ev(`document.getElementById('hwpsimon').click()`);
    /* ไฟล์ Huawei ที่ dimension ผิด (A4:...) ต้องอ่านครบตั้งแต่หัวตาราง */
    const X = require('../vendor/xlsx.full.min.js'); ev('0');
    const ws = X.utils.aoa_to_sheet([['Plant Report_TEST'], ['Statistical Period','PV Yield (kWh)'], ['2026-11-18 00:00:00', 0], ['2026-11-18 01:00:00', 0], ['2026-11-18 02:00:00', 1]]);
    ws['!ref'] = 'A4:B5';
    const rows = w.eval('hwSheetRows').call(null, X, ws);
    eq('wrong sheet dimension still reads the header rows', rows.length + ' ' + rows[1][0], '5 Statistical Period');
    eq('and the file is then detected as interval', ev(`HW.files=[];hwAdd([{name:'x.xlsx',rows:${JSON.stringify(rows)}}],false);HW.files.length+' '+HW.files[0].auto`), '1 interval');
    eq('no script errors during use', errs.join(' | '), '');
    done();
  }, 300);
});
