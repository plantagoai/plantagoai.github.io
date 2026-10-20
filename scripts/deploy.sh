#!/usr/bin/env bash
# Deploy what this repo ships, the way each part is deployed today.
#
#   scripts/deploy.sh [target ...] [--yes] [--dry-run] [--help]
#
# Targets (with none: functions, rules, site, personal, in that order):
#   functions  site/functions → Cloud Functions in project plantagoai, through
#              site/scripts/deploy-functions.sh (bundles the shared
#              @plantagoai packages from ../shared/packages next to this repo)
#   rules      site/firestore.rules → Firestore in project plantagoai
#   site       site/ (React) → Firebase Hosting site plantagoai (plantagoai.com);
#              always npm ci + npm run build first
#   personal   personal-site/ → Firebase Hosting target personal
#              (dagangilat-personal, dagangilat.com); always built first.
#              CI normally does this on every push to main.
#   pages      the root static page → GitHub Pages. Pages only deploys from the
#              GitHub workflow, so this runs it (gh workflow run static.yml on
#              main); that workflow redeploys personal from main too. CI
#              normally does this on every push to main. Not part of no-args,
#              because the workflow would overwrite a local personal deploy.
#
# Options:
#   -y, --yes   don't ask Deploy? [y/N] (also CI=1)
#   --dry-run   print the plan and the commands, run nothing
#   -h, --help  this text
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

PROJECT=plantagoai
ALL_TARGETS="functions rules site personal"
TARGETS=""
YES=0
DRY_RUN=0
case "${CI:-}" in 1|true) YES=1 ;; esac

add_target() { case " $TARGETS " in *" $1 "*) ;; *) TARGETS="$TARGETS $1" ;; esac; }
while [ $# -gt 0 ]; do
  case "$1" in
    functions|rules|site|personal|pages) add_target "$1"; shift ;;
    -y|--yes) YES=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) sed -n '2,/^set -euo pipefail/p' "$0" | sed '$d' | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown target or option: $1 (see --help)" >&2; exit 1 ;;
  esac
done
[ -n "$TARGETS" ] || TARGETS=" $ALL_TARGETS"
want() { case " $TARGETS " in *" $1 "*) return 0 ;; *) return 1 ;; esac; }

bold() { printf '\n\033[1m%s\033[0m\n' "$*"; }
ok() { printf '  \033[32m✓\033[0m %s\n' "$*"; }
note() { printf '  %s\n' "$*"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$*"; }
die() { printf '\n\033[31m%s\033[0m\n' "$*" >&2; exit 1; }
run() { if [ $DRY_RUN = 1 ]; then note "\$ $*"; else "$@"; fi; }

# --- Pre-flight -----------------------------------------------------------
bold "Pre-flight"
PROBLEMS=""
need() { command -v "$1" >/dev/null || PROBLEMS="${PROBLEMS}  - $1 isn't installed. $2
"; }
need node "Install Node.js 22: https://nodejs.org"
need npm "It comes with Node.js."
need git "Install git (xcode-select --install)."
if want functions || want rules || want site || want personal; then
  need firebase "Install it with: npm install -g firebase-tools   (then: firebase login)"
fi
if want pages; then
  need gh "Install it with: brew install gh   (then: gh auth login)"
fi

# The functions bundle the shared packages from <parent of this repo>/shared/packages,
# the path site/scripts/deploy-functions.sh and site/functions/package.json use.
PARENT="$(cd "$ROOT/.." && pwd)"
SHARED="$PARENT/shared/packages"
if want functions; then
  if [ -f "$SHARED/messaging/package.json" ]; then
    ok "Shared packages found at $SHARED"
  else
    if [ -L "$PARENT/shared" ]; then
      fix="$PARENT/shared is a symlink to a folder that doesn't exist or has no packages/messaging. Point it at the shared repo:
      ln -sfn \"$PARENT/plantagoai-shared\" \"$PARENT/shared\""
    elif [ -d "$PARENT/plantagoai-shared/packages" ]; then
      fix="Link the shared repo under the name the deploy expects:
      ln -s \"$PARENT/plantagoai-shared\" \"$PARENT/shared\""
    else
      fix="Clone the shared packages repo next to this one and link it as shared:
      git clone https://github.com/plantagoai/plantagoai-shared.git \"$PARENT/plantagoai-shared\"
      ln -s \"$PARENT/plantagoai-shared\" \"$PARENT/shared\""
    fi
    PROBLEMS="${PROBLEMS}  - The functions deploy needs the shared packages at $SHARED (missing).
      $fix
"
  fi
fi

# This repo installs only from the public npm registry (no .npmrc for
# npm.pkg.github.com), so no NODE_AUTH_TOKEN is needed.

if [ -n "$PROBLEMS" ]; then
  if [ $DRY_RUN = 1 ]; then
    printf '  \033[33mThese would stop a real deploy:\033[0m\n%s' "$PROBLEMS"
  else
    printf '\n\033[31mCan'"'"'t deploy yet:\033[0m\n%s' "$PROBLEMS" >&2
    exit 1
  fi
else
  ok "Tools found"
fi

# Branch checks: what goes out is this checkout, so say when it isn't main as on GitHub.
WARNINGS=""
git fetch --quiet origin 2>/dev/null || warn "Couldn't fetch origin; branch checks use what is already fetched."
DEFAULT="$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's#^origin/##' || true)"
[ -n "$DEFAULT" ] || DEFAULT=main
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
[ "$BRANCH" = "$DEFAULT" ] || WARNINGS="${WARNINGS}  - You're on '$BRANCH', not '$DEFAULT'.
"
[ -z "$(git status --porcelain)" ] || WARNINGS="${WARNINGS}  - The working tree has uncommitted changes; they will be deployed.
"
if git rev-parse --verify --quiet "origin/$BRANCH" >/dev/null; then
  behind="$(git rev-list --count "HEAD..origin/$BRANCH")"
  [ "$behind" = 0 ] || WARNINGS="${WARNINGS}  - '$BRANCH' is $behind commit(s) behind origin/$BRANCH (git pull).
"
fi
if want pages; then
  WARNINGS="${WARNINGS}  - pages runs the GitHub workflow on '$DEFAULT' as pushed, not this checkout.
"
fi

# --- Plan -----------------------------------------------------------------
bold "Plan"
want functions && note "functions  site/functions → Cloud Functions, project $PROJECT (via site/scripts/deploy-functions.sh)"
want rules     && note "rules      site/firestore.rules → Firestore, project $PROJECT"
want site      && note "site       site/ build → Hosting site plantagoai → https://plantagoai.com"
want personal  && note "personal   personal-site/ build → Hosting target personal (dagangilat-personal) → https://dagangilat.com"
want pages     && note "pages      GitHub workflow static.yml on $DEFAULT → https://plantagoai.github.io (+ personal from $DEFAULT)"
if [ -n "$WARNINGS" ]; then
  printf '\n  \033[33mHeads up:\033[0m\n%s' "$WARNINGS"
fi

if [ $DRY_RUN = 1 ]; then
  bold "Commands (dry run, nothing runs)"
elif [ $YES = 0 ]; then
  echo
  read -r -p "  Deploy? [y/N] " answer </dev/tty
  case "$answer" in y|Y|yes) ;; *) die "Stopped. Nothing was deployed." ;; esac
fi

# npm ci from the lockfile; if the lockfile is out of sync with package.json
# (site/'s is, as of 2026-10-20), fall back to npm install and say how to fix it.
npm_install() {
  if ! npm ci --prefix "$1" --no-audit --no-fund --loglevel=error 2>/dev/null; then
    printf '  \033[33m!\033[0m %s\n' "$1/package-lock.json is out of sync with $1/package.json; using npm install instead." \
      "Fix for good: npm install --prefix $1, then commit $1/package-lock.json."
    npm install --prefix "$1" --no-audit --no-fund --loglevel=error
  fi
}

DONE=""
# --- Deploy ---------------------------------------------------------------
if want functions; then
  bold "Functions"
  run bash site/scripts/deploy-functions.sh functions
  DONE="${DONE}  functions → project $PROJECT
"
fi

if want rules; then
  bold "Firestore rules"
  if [ $DRY_RUN = 1 ]; then note "\$ (cd site && firebase deploy --project $PROJECT --only firestore:rules)"
  else (cd site && firebase deploy --project "$PROJECT" --only firestore:rules); fi
  DONE="${DONE}  firestore rules → project $PROJECT
"
fi

if want site; then
  bold "plantagoai.com (site/)"
  if [ $DRY_RUN = 1 ]; then note "\$ npm ci --prefix site   # always (npm install if the lockfile is out of sync)"
  else npm_install site; fi
  if [ $DRY_RUN = 1 ]; then note "\$ (cd site && npm run build && firebase deploy --project $PROJECT --only hosting)"
  else
    rm -rf site/dist
    (cd site && npm run build)
    [ -f site/dist/index.html ] || die "site/dist/index.html is missing after the build; not deploying."
    (cd site && firebase deploy --project "$PROJECT" --only hosting)
  fi
  DONE="${DONE}  site → https://plantagoai.com (also https://plantagoai.web.app)
"
fi

if want personal; then
  bold "dagangilat.com (personal-site/)"
  if [ $DRY_RUN = 1 ]; then note "\$ npm ci --prefix personal-site   # always (npm install if the lockfile is out of sync)"
  else npm_install personal-site; fi
  if [ $DRY_RUN = 1 ]; then
    note "\$ (cd personal-site && npm run build)"
    note "\$ grep -rq api/track personal-site/dist/assets/*.js   # the same check CI runs"
    note "\$ firebase deploy --project prod --only hosting:personal"
  else
    rm -rf personal-site/dist
    (cd personal-site && npm run build)
    # Same guard as CI: the visit tracker must survive bundling.
    grep -rq "api/track" personal-site/dist/assets/*.js || die "personal-site build has no /api/track call; visitor analytics would record nothing. Not deploying."
    ok "Visit tracker present in the bundle"
    firebase deploy --project prod --only hosting:personal
  fi
  DONE="${DONE}  personal → https://dagangilat.com
"
fi

if want pages; then
  bold "GitHub Pages (workflow)"
  if [ $DRY_RUN = 1 ]; then
    note "\$ gh workflow run static.yml --ref $DEFAULT"
    note "\$ gh run list --workflow static.yml --limit 1"
  else
    gh auth status >/dev/null 2>&1 || die "gh isn't signed in. Run: gh auth login"
    gh workflow run static.yml --ref "$DEFAULT"
    sleep 3
    note "Run: $(gh run list --workflow static.yml --limit 1 --json url -q '.[0].url' 2>/dev/null || echo 'see the Actions tab')"
  fi
  DONE="${DONE}  pages → https://plantagoai.github.io (workflow started; it finishes on GitHub)
"
fi

[ $DRY_RUN = 1 ] && exit 0

# --- What went out, and a quick check -------------------------------------
bold "Deployed"
printf '%s' "$DONE"
bold "Checks"
status() { curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$1" 2>/dev/null || true; }
if want site; then
  code="$(status https://plantagoai.com/)"
  if [ "$code" = 200 ]; then ok "https://plantagoai.com answers 200"; else warn "https://plantagoai.com answered ${code:-nothing}"; fi
fi
if want personal; then
  ct="$(curl -s -o /dev/null -w '%{content_type}' --max-time 20 https://dagangilat.com/api/track 2>/dev/null || true)"
  case "$ct" in
    application/json*) ok "dagangilat.com/api/track reaches trackFn ($ct)" ;;
    *) warn "dagangilat.com/api/track answered '${ct:-nothing}', not JSON: the rewrite to trackFn may be missing" ;;
  esac
fi
if want functions; then
  note "Deployed functions:"
  firebase functions:list --project "$PROJECT" 2>/dev/null | sed 's/^/  /' || warn "Couldn't list them."
fi
