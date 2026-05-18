# TodoTriage

TodoTriage turns TODO, FIXME, HACK, and XXX comments into a ranked local maintenance queue. It is built for OSS maintainers and coding agents that need release-aware TODO debt without a hosted issue tracker or telemetry.

## Quick Start

```sh
npm install
npm run build
node dist/cli/index.js scan examples/fixtures/tagged --out examples/output/tagged.md
```

Install the package globally once published, or use the local binary from a clone:

```sh
todotriage scan . --out docs/TODOS.md
todotriage scan . --format json --fail-on high
todotriage init --preset oss-cli
```

## What It Detects

Default markers are TODO, FIXME, HACK, and XXX. Configure them in `.todotriage.json`:

```json
{
  "markers": ["TODO", "FIXME", "HACK", "DEBT"],
  "ignoredPaths": ["generated/"],
  "staleDays": 120,
  "oldDays": 365,
  "releaseRiskKeywords": ["security", "release", "breaking", "auth"],
  "severityOverrides": {
    "DEBT": "medium"
  }
}
```

TodoTriage extracts nearby symbols or Markdown headings, priority tags such as `[p1]` and `[owner:docs]`, issue links, release-risk keywords, and best-effort git blame age/author metadata.

## Scoring

Findings are ranked by marker severity, priority tags, release-risk keywords, security/auth language, and git age. Scores map to low, medium, high, and critical severity so release gates can fail deterministically.

## Output

Markdown is intended for humans:

```sh
todotriage scan . --out docs/TODOS.md
```

JSON is intended for agents and CI:

```sh
todotriage scan . --format json --fail-on high
```

Exit code 2 means the scan completed and the configured severity gate failed. Exit code 1 means the CLI failed.

## Safety Model

TodoTriage is local-first. It reads local files, `.todotriage.json`, `.gitignore`, and optional git blame data. It does not use network calls, telemetry, secrets, or LLM classification.

## Development

```sh
npm test
npm run check
npm run build
npm run smoke
bash scripts/validate.sh
```

## Project Docs

- PRD: `docs/PRD.md`
- Task plan: `docs/TASKS.md`
- Agent orchestration: `docs/ORCHESTRATION.md`
- Machine orchestration contract: `docs/orchestration.json`

## License

MIT
