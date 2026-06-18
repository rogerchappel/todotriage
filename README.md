# TodoTriage

TodoTriage turns TODO, FIXME, HACK, and XXX comments into a ranked local maintenance queue. It helps agents and maintainers decide which comments are release blockers, which are maintenance work, and which can remain visible.

## Quick Start

```bash
npm install
npm run smoke
node bin/todotriage.js scan fixtures/debt --out tmp/TODOS.md
node bin/todotriage.js scan fixtures/debt --format json --fail-on high
```

## Scoring

- `high`: FIXME markers or comments containing security, release, auth, credential, migration, or data-loss language.
- `medium`: HACK markers or comments containing refactor, cleanup, temporary, perf, or test language.
- `low`: ordinary TODO comments without risk language.

## Configuration

Run `todotriage init --preset oss-cli` to create `.todotriage.json`. You can adjust markers, ignored paths, and risk words. Scans are deterministic and local.

## Safety Notes

TodoTriage reads local files and writes optional local reports. It does not create remote issues, modify source comments, call hosted services, or send source code anywhere.

## CI Usage

```bash
todotriage scan . --format json --fail-on high
```

Use a high-severity gate before release branches to force explicit review of risky maintenance debt.
