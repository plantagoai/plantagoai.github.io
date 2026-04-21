#!/bin/bash
# Deploy PlantagoAI site Cloud Functions with bundled shared packages.
#
# Strategy: npm pack each shared @plantagoai package → rewrite package.json
# to reference local tarballs → full npm install → deploy → restore symlinks.
#
# Mirrors foundation/scripts/deploy-functions.sh — the cross-project convention
# for deploying functions that depend on the shared packages monorepo.

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FUNCTIONS_DIR="$PROJECT_DIR/functions"
SHARED_DIR="$PROJECT_DIR/../../shared/packages"
BUNDLE_DIR="$FUNCTIONS_DIR/.bundles"

SHARED_PKGS=(messaging)
DEPLOY_TARGET="${1:-functions}"

cleanup() {
  echo "=== Cleaning up ==="
  if [ -f "$FUNCTIONS_DIR/package.json.bak" ]; then
    mv "$FUNCTIONS_DIR/package.json.bak" "$FUNCTIONS_DIR/package.json"
  fi
  rm -rf "$BUNDLE_DIR"
  rm -f "$FUNCTIONS_DIR/package-lock.json"
  # Restore symlinks for local dev
  (cd "$FUNCTIONS_DIR" && npm install --silent 2>/dev/null) || true
}
trap cleanup EXIT

# 1. Build and pack shared packages (output lines: "pkg:tarball_name")
echo "=== Packing shared packages ==="
rm -rf "$BUNDLE_DIR"
mkdir -p "$BUNDLE_DIR"

TARBALL_LINES=""
for pkg in "${SHARED_PKGS[@]}"; do
  SRC="$SHARED_DIR/$pkg"
  [ ! -d "$SRC/dist" ] && (cd "$SRC" && npm run build --silent)

  TARBALL_NAME=$(cd "$SRC" && npm pack --pack-destination "$BUNDLE_DIR" 2>/dev/null | tail -1)
  TARBALL_LINES="${TARBALL_LINES}${pkg}:${TARBALL_NAME}\n"
  echo "  $pkg -> $TARBALL_NAME"
done

# 2. Rewrite package.json to reference bundled tarballs
echo ""
echo "=== Rewriting package.json ==="
cp "$FUNCTIONS_DIR/package.json" "$FUNCTIONS_DIR/package.json.bak"

TARBALL_LINES_JSON=$(printf "$TARBALL_LINES")
export TARBALL_LINES_JSON
export FUNCTIONS_DIR

node -e "
const fs = require('fs');
const lines = (process.env.TARBALL_LINES_JSON || '').trim().split('\n');
const map = {};
for (const line of lines) {
  const [pkg, tarball] = line.split(':');
  if (pkg && tarball) map[pkg] = tarball;
}
const pkgPath = process.env.FUNCTIONS_DIR + '/package.json';
const pkg = JSON.parse(fs.readFileSync(pkgPath + '.bak', 'utf8'));
for (const [name, ver] of Object.entries(pkg.dependencies || {})) {
  if (typeof ver === 'string' && ver.startsWith('file:')) {
    const short = name.replace('@plantagoai/', '');
    const tarball = map[short];
    if (tarball) {
      pkg.dependencies[name] = 'file:.bundles/' + tarball;
      console.log('  ' + name + ' -> file:.bundles/' + tarball);
    }
  }
}
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
"

# 3. Fresh install from tarballs — creates a clean lockfile Cloud Build can use
echo ""
echo "=== Installing from tarballs ==="
rm -rf "$FUNCTIONS_DIR/node_modules/@plantagoai"
rm -f "$FUNCTIONS_DIR/package-lock.json"
(cd "$FUNCTIONS_DIR" && npm install 2>&1 | tail -5)

# Verify
echo ""
echo "=== Verifying ==="
for pkg in "${SHARED_PKGS[@]}"; do
  if [ -d "$FUNCTIONS_DIR/node_modules/@plantagoai/$pkg/dist" ]; then
    echo "  @plantagoai/$pkg OK"
  else
    echo "  @plantagoai/$pkg MISSING" && exit 1
  fi
done

# 4. Deploy
echo ""
echo "=== Deploying ==="
(cd "$PROJECT_DIR" && firebase deploy --only "$DEPLOY_TARGET")
