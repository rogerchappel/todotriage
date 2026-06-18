# TodoTriage PRD

## Summary

TodoTriage scans source and docs for TODO/FIXME/HACK/XXX markers, adds nearby context, ranks severity, and emits stable Markdown or JSON reports.

## Users

- OSS maintainers preparing releases.
- Agents summarizing maintenance debt before code changes.
- Developers who want actionable TODOs without a hosted issue tracker.

## Requirements

- Walk files deterministically while ignoring common generated directories.
- Detect configurable markers in code, docs, JSON, YAML, and shell files.
- Add nearby heading or symbol context.
- Rank severity with marker and keyword rules.
- Emit Markdown and JSON reports.
- Support a fail-on severity gate for CI.

## Non-Goals

- Creating remote GitHub issues in V1.
- Rewriting comments automatically.
- Semantic LLM classification.

## Acceptance Criteria

- Fixture-backed tests cover scanning, severity, and rendering.
- Smoke command writes Markdown and evaluates a JSON gate.
- README and `SKILL.md` document local-only safety boundaries.
