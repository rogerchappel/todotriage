# TodoTriage Orchestration

TodoTriage is designed for local agent and maintainer workflows. It never sends
source code to a remote service, and every report is produced from local files,
configuration, and optional git metadata.

## Agent Contract

1. Run todotriage scan <path> before release, refactor, or maintenance work.
2. Prefer --format json when another tool will consume the results.
3. Use --fail-on high or stricter in CI release gates.
4. Treat critical findings as release blockers unless the maintainer records an
   exception outside TodoTriage.
5. Do not rewrite TODO comments automatically in V1.

## Suggested Local Flow

```sh
npm ci
npm run build
node dist/cli/index.js scan . --out docs/TODOS.md --fail-on high
```

## CI Gate

```sh
todotriage scan . --format json --fail-on high
```

Exit code 2 means the scan ran successfully and the configured gate failed.
Exit code 1 means the CLI itself failed.
