#!/usr/bin/env bash
# Run every check before a commit:  bash tests/run.sh
# 1. build  2. jsdom smoke test of all menus  3. menu numbering  4. menu 03 example numbers
# 5. phone layout (only when Python Playwright and Chrome are available)
set -e
cd "$(dirname "$0")/.."
python3 build.py
[ -d tests/node_modules/jsdom ] || (cd tests && npm install --silent)
export NODE_PATH="$PWD/tests/node_modules"
fail=0
node tests/smoke.js dist/pv-wiring-sim.html || fail=1
node tests/structure.test.js || fail=1
node tests/menu03.test.js || fail=1
if python3 -c "import playwright" 2>/dev/null && [ -x "${CHROME:-/usr/bin/google-chrome}" ]; then
  python3 tests/mobile.py "${CHROME:-/usr/bin/google-chrome}" || fail=1
else
  echo "mobile: skipped (needs Python Playwright and Chrome; set CHROME=/path/to/chrome)"
fi
[ $fail = 0 ] && echo "ALL TESTS PASSED" || { echo "SOME TESTS FAILED"; exit 1; }
