/* shared loader: opens the single-file bundle in jsdom and gives a tiny assert helper */
const fs = require('fs'), path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const BUNDLE = path.resolve(__dirname, '..', 'dist', 'pv-wiring-sim.html');

function load() {
  return new Promise(res => {
    const errs = [], vc = new VirtualConsole();
    vc.on('jsdomError', e => errs.push(String(e.message).split('\n')[0].slice(0, 160)));
    const dom = new JSDOM(fs.readFileSync(BUNDLE, 'utf8'), {
      runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'https://example.github.io/solar-pv-simulator/',
      beforeParse(w) {
        w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
        w.scrollTo = () => {};
      }
    });
    setTimeout(() => res({ w: dom.window, ev: s => dom.window.eval(s), errs: errs.filter(e => !/canvas|getContext|not implemented|toDataURL/i.test(e)) }), 1500);
  });
}

let fails = 0, passes = 0;
function eq(name, got, want) {
  const ok = String(got) === String(want);
  ok ? passes++ : fails++;
  console.log(`${ok ? '  ok ' : '  FAIL'} ${name}${ok ? '' : `: got ${got}, want ${want}`}`);
}
function done(label) {
  console.log(`${label}: ${passes} passed, ${fails} failed`);
  process.exit(fails ? 1 : 0);
}
module.exports = { load, eq, done };
