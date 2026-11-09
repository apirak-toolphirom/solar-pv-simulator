/* menu numbering and naming stay consistent everywhere (nav order 00, 01, 02 … with no gaps,
   and the same number in the nav, ACC_NAME, the manual file name and apps-script MENU_DEF) */
const fs = require('fs'), path = require('path');
const { load, eq, done } = require('./lib');
const root = path.resolve(__dirname, '..');

load().then(({ w, ev }) => {
  const nav = [...w.document.querySelectorAll('.navb[data-tab]')].map(b => [b.dataset.tab, b.querySelector('.ic').textContent.trim()]);
  eq('nav numbers run 00, 01, 02 … in order', nav.map(n => n[1]).join(','), nav.map((_, i) => String(i).padStart(2, '0')).join(','));
  const MAN = ev('MANUAL'), NAME = ev('ACC_NAME');
  const gs = fs.readFileSync(path.join(root, 'apps-script', 'Code.gs'), 'utf8');
  const def = {}; (gs.match(/\['([a-z]+)', '(\d\d) [^']*'\]/g) || []).forEach(m => { const x = m.match(/\['([a-z]+)', '(\d\d)/); def[x[1]] = x[2]; });
  nav.forEach(([t, n]) => {
    eq(`${t}: manual file number`, String(MAN[t] || '').slice(0, 2), n);
    eq(`${t}: manual file exists`, fs.existsSync(path.join(root, 'docs', `manual-${MAN[t]}.md`)), true);
    if (NAME[t]) eq(`${t}: ACC_NAME number`, NAME[t].slice(0, 2), n);
    if (def[t]) eq(`${t}: Code.gs MENU_DEF number`, def[t], n);
  });
  /* worksheets: the default list in the page and WS_DEF in Code.gs must match (id, menus, criteria) */
  const WS = ev('WS_DEFAULT'), rows = (gs.match(/\n  \['W\d+'[^\n]*/g) || []).map(l => l.match(/'([^']*)'/g).map(x => x.slice(1, -1)));
  const byId = {}; rows.forEach(r => byId[r[0]] = r);
  WS.forEach(w => {
    const r = byId[w.id];
    eq(`${w.id}: in Code.gs WS_DEF`, !!r, true);
    if (r) { eq(`${w.id}: same menus`, r[2], w.tabs); eq(`${w.id}: same criteria`, r[6], w.crit); }
    String(w.tabs || '').split(',').filter(Boolean).forEach(t => eq(`${w.id}: menu ${t} exists`, nav.some(n => n[0] === t), true));
    String(w.crit || '').split(';').filter(Boolean).forEach(k => eq(`${w.id}: criterion ${k} is known`, /ผู้สอนตรวจเอง/.test(ev(`wsCrit(${JSON.stringify(k)})[0]`)), false));
  });
  done('structure');
});
