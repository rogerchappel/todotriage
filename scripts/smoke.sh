#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

npm run build

node dist/cli/index.js scan examples/fixtures/tagged --out examples/output/tagged.md
node dist/cli/index.js scan examples/fixtures/docs --format json --out examples/output/docs.json --no-git

set +e
node dist/cli/index.js scan examples/fixtures/stale --format json --fail-on high --no-git > examples/output/stale-gate.json
status=$?
set -e

if [ "$status" -ne 2 ]; then
  printf 'Expected stale fixture gate to exit 2, got %s\n' "$status" >&2
  exit 1
fi

test -s examples/output/tagged.md
test -s examples/output/docs.json
test -s examples/output/stale-gate.json
