#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

npm run build

mkdir -p examples/output
node dist/cli/index.js scan examples/fixtures/tagged --format markdown --no-git > examples/output/tagged-stdout.md

out_message="$(node dist/cli/index.js scan examples/fixtures/tagged --out examples/output/tagged.md --no-git)"
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
test -s examples/output/tagged-stdout.md
test -s examples/output/docs.json
test -s examples/output/stale-gate.json

grep -q '^# TodoTriage Report$' examples/output/tagged.md
grep -q '^## Queue$' examples/output/tagged.md
grep -q '^# TodoTriage Report$' examples/output/tagged-stdout.md
test "$out_message" = "Wrote $repo_root/examples/output/tagged.md"

if grep -q '\\n' examples/output/tagged.md; then
  printf 'Markdown output contains a literal backslash-n sequence\n' >&2
  exit 1
fi
