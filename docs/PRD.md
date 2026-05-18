# TodoTriage PRD

Status: in-progress

## One-liner
`todotriage` turns TODO/FIXME/HACK comments into a ranked local maintenance queue with age, ownership hints, and release-risk gates. 🧹

## Source attribution
Created during the 2026-05-14 evening OSS Factory run. Web search was attempted for current developer-tool pain points, but the configured provider returned an authentication/plan error. Inspired by everyday source-code TODO rot and agent handoff needs; renamed/reframed as a deterministic offline triage CLI.

## Target users
- OSS maintainers preparing releases.
- Agents summarizing maintenance debt before changes.
- Developers who want actionable TODOs without a hosted issue tracker.

## Problem
TODO comments are useful until they become invisible. They lack age, owner, category, and release impact, so agents and maintainers either ignore them or overreact without context.

## Goals
- Scan source/docs for TODO, FIXME, HACK, XXX, and custom markers.
- Add local context: file type, nearby symbol/heading, git age/blame when available, and severity hints.
- Rank findings into a practical maintenance queue.
- Emit Markdown/JSON reports and configurable failure gates.
- Work offline without sending source code anywhere.

## Non-goals
- Creating remote GitHub issues in V1.
- Rewriting comments automatically.
- Semantic LLM classification.

## V1 CLI

```bash
todotriage scan . --out docs/TODOS.md
todotriage scan fixtures/debt --format json --fail-on high
todotriage init --preset oss-cli
```

## Functional requirements
1. Walk files deterministically while respecting `.gitignore` by default.
2. Detect configurable markers in code, Markdown, YAML, and shell files.
3. Extract nearby heading/symbol context, optional git blame age/author, priority tags, issue links, and release-risk keywords.
4. Support `.todotriage.json` for ignored paths, marker policy, stale-age thresholds, and severity overrides.
5. Emit stable Markdown/JSON with ranked findings, evidence, severity, and remediation.
6. Include fixture-backed tests for clean, stale, tagged, docs, ignored, and no-git projects.

## Acceptance criteria
- `npm test`, `npm run check`, `npm run build`, and `npm run smoke` pass.
- `bash scripts/validate.sh` passes when present.
- Real CLI smoke scans checked-in fixtures and writes reports.
- README covers quick start, markers, scoring, safety model, examples, and CI usage.
- Public GitHub repo `rogerchappel/todotriage` has useful description and topics.
