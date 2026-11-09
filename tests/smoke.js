#!/usr/bin/env node
/* Smoke test for the solar-pv-simulator bundle (dist/pv-wiring-sim.html) in jsdom.
   Usage: node tests/smoke.js dist/pv-wiring-sim.html [tab ...]   (or: bash tests/run.sh)
   - opens every tab (or the ones named), reports script errors (canvas/getContext noise filtered)
   - checks every tab has a nav button, a <section id="tab-…">, an ACC_NAME, a MANUAL entry and a docs file
   - prints the permission each role gets for menus in ACC_HIDDEN
   Needs jsdom: `npm install` inside tests/ (tests/run.sh does it once)
 */
const fs = require('fs'), path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const file = process.argv[2];
if (!file || !fs.existsSync(file)) { console.error('usage: node smoke.js <dist/pv-wiring-sim.html> [tab ...]'); process.exit(2); }
const repo = path.resolve(path.dirname(file), '..');
const errs = [], vc = new VirtualConsole();
vc.on('jsdomError', e => errs.push(String(e.message).split('\n')[0].slice(0, 160)));
const dom = new JSDOM(fs.readFileSync(file, 'utf8'), {
  runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'https://example.github.io/solar-pv-simulator/',
  beforeParse(w) { w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }); }
});
const w = dom.window, ev = s => w.eval(s);
setTimeout(() => {
  const noise = /canvas|getContext|not implemented|toDataURL|scrollTo/i;
  const bootErr = errs.filter(e => !noise.test(e));
  const TABS = ev('TABS'), want = process.argv.slice(3).length ? process.argv.slice(3) : TABS;
  const problems = [];
  const MAN = (() => { try { return ev('MANUAL'); } catch (e) { return null; } })();
  const NAME = (() => { try { return ev('ACC_NAME'); } catch (e) { return {}; } })();
  for (const t of TABS) {
    if (!w.document.querySelector(`.navb[data-tab="${t}"]`)) problems.push(`${t}: no nav button in app.html`);
    if (!w.document.getElementById('tab-' + t)) problems.push(`${t}: no <section id="tab-${t}">`);
    if (!NAME[t]) problems.push(`${t}: missing in ACC_NAME (js/access.js)`);
    if (MAN && !MAN[t]) problems.push(`${t}: missing in MANUAL (js/app.js)`);
    if (MAN && MAN[t] && !fs.existsSync(path.join(repo, 'docs', `manual-${MAN[t]}.md`))) problems.push(`${t}: docs/manual-${MAN[t]}.md not found`);
  }
  ev('ACC.enabled=false');
  const tabErr = {};
  for (const t of want) {
    const before = errs.length;
    try { ev(`showTab(${JSON.stringify(t)})`); } catch (e) { errs.push(e.message); }
    const shown = w.document.getElementById('tab-' + t);
    if (shown && shown.hidden) problems.push(`${t}: section still hidden after showTab`);
    tabErr[t] = () => errs.slice(before).filter(e => !noise.test(e));
  }
  setTimeout(() => {
    console.log('boot errors:', bootErr.length ? bootErr : 'none');
    for (const t of want) { const e = tabErr[t](); if (e.length) console.log(`errors after showTab(${t}):`, e.slice(0, 3)); }
    let hidden = []; try { hidden = ev('ACC_HIDDEN'); } catch (e) {}
    if (hidden.length) {
      const perm = (role, menus) => { ev(`ACC.enabled=true;ACC.role=${JSON.stringify(role)};ACC.menus=${JSON.stringify(menus)}`); return hidden.map(t => `${t}=${ev(`accPerm(${JSON.stringify(t)})`)}`).join(' '); };
      console.log('teacher-opened menus, student before sheet row :', perm('student', null));
      console.log('teacher-opened menus, visitor                  :', perm('visitor', null));
      console.log('teacher-opened menus, teacher                  :', perm('teacher', null));
      ev('ACC.enabled=false');
    }
    console.log(problems.length ? 'PROBLEMS:\n - ' + problems.join('\n - ') : 'structure: ok (' + TABS.length + ' tabs)');
    process.exit(problems.length || bootErr.length ? 1 : 0);
  }, 800);
}, 1500);
