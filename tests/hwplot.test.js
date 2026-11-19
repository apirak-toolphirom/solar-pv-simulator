/* menu 17 หน้า "อ่าน log": กราฟวิเคราะห์เลือกเส้นเอง (js/hwplot.js) ตามที่เขียนใน docs/manual-17-fusion.md */
const { load, eq, done } = require('./lib');
load().then(({ ev, errs }) => {
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
    eq('no script errors during use', errs.join(' | '), '');
    done();
  }, 300);
});
