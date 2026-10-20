#!/usr/bin/env bash
# Run this repo's sites locally.
#
#   scripts/run.sh [mode] [--help]
#
# Modes:
#   site       (default) the plantagoai.com app (site/) on the Vite dev server,
#              http://localhost:5173
#   personal   dagangilat.com (personal-site/) on the Vite dev server,
#              http://localhost:8082
#   all        both dev servers at once; Ctrl-C stops both
#   test       the site/ test suite (vitest, includes site/functions tests)
#
# Neither app has an emulator mode: both talk to the real Firebase project
# plantagoai and its functions (personal-site proxies chat and contact to
# deployed functions). Browsing is read-mostly, but a contact form or a
# subscribe sent from a local server is real.
set -euo pipefail

cd "$(dirname "$0")/.."

MODE="site"
while [ $# -gt 0 ]; do
  case "$1" in
    site|personal|all|test) MODE="$1"; shift ;;
    -h|--help) sed -n '2,/^set -euo pipefail/p' "$0" | sed '$d' | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown mode: $1 (see --help)" >&2; exit 1 ;;
  esac
done

bold() { printf '\n\033[1m%s\033[0m\n' "$*"; }
ok() { printf '  \033[32m✓\033[0m %s\n' "$*"; }
note() { printf '  %s\n' "$*"; }
die() { printf '\n\033[31m%s\033[0m\n' "$*" >&2; exit 1; }

bold "Pre-flight"
for tool in node npm; do
  command -v "$tool" >/dev/null || die "$tool is needed. Install Node.js 22: https://nodejs.org"
done
ok "Node $(node -v)"
# Public npm only (no npm.pkg.github.com packages), so no NODE_AUTH_TOKEN is needed.

# npm ci from the lockfile; if the lockfile is out of sync with package.json
# (site/'s is, as of 2026-10-20), fall back to npm install and say how to fix it.
npm_install() {
  if ! npm ci --prefix "$1" --no-audit --no-fund --loglevel=error 2>/dev/null; then
    printf '  \033[33m!\033[0m %s\n' "$1/package-lock.json is out of sync with $1/package.json; using npm install instead." \
      "Fix for good: npm install --prefix $1, then commit $1/package-lock.json."
    npm install --prefix "$1" --no-audit --no-fund --loglevel=error
  fi
}
# Install when node_modules is missing or older than the lockfile.
deps() {
  if [ ! -f "$1/node_modules/.package-lock.json" ] || [ "$1/package-lock.json" -nt "$1/node_modules/.package-lock.json" ]; then
    npm_install "$1"
    ok "$1: dependencies installed"
  else
    ok "$1: dependencies up to date"
  fi
}

case "$MODE" in
  test)
    deps site
    bold "Tests (site/)"
    cd site && exec npm test
    ;;
  site)
    deps site
    bold "plantagoai.com dev server (live Firebase project plantagoai)"
    note "Open http://localhost:5173"
    cd site && exec npm run dev
    ;;
  personal)
    deps personal-site
    bold "dagangilat.com dev server"
    note "Open http://localhost:8082"
    cd personal-site && exec npm run dev
    ;;
  all)
    deps site
    deps personal-site
    bold "Both dev servers (Ctrl-C stops both)"
    note "plantagoai.com:  http://localhost:5173"
    note "dagangilat.com:  http://localhost:8082"
    PIDS=""
    stop() {
      trap - INT TERM EXIT
      for pid in $PIDS; do kill "$pid" 2>/dev/null || true; done
      wait 2>/dev/null || true
    }
    trap stop INT TERM EXIT
    (cd site && exec npm run dev) &
    PIDS="$PIDS $!"
    (cd personal-site && exec npm run dev) &
    PIDS="$PIDS $!"
    # Stop both as soon as either one exits.
    while :; do
      for pid in $PIDS; do kill -0 "$pid" 2>/dev/null || exit 0; done
      sleep 1
    done
    ;;
esac
