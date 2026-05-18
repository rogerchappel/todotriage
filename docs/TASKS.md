# TodoTriage Task Plan

## MVP

- [x] Scaffold a TypeScript OSS CLI with StackForge.
- [x] Copy the PRD into docs/PRD.md.
- [x] Implement deterministic file walking with ignore policy.
- [x] Detect TODO, FIXME, HACK, XXX, and configured markers.
- [x] Extract nearby code symbols or Markdown headings.
- [x] Parse priority tags, issue links, and release-risk keywords.
- [x] Read best-effort git blame age and author metadata.
- [x] Rank findings into low, medium, high, and critical severity.
- [x] Render Markdown and JSON reports.
- [x] Support release gates with --fail-on.
- [x] Add fixture-backed parser, scanner, and renderer tests.
- [x] Add smoke and validation scripts.

## Near-Term Follow-Ups

- [ ] Add SARIF output for code scanning integrations.
- [ ] Add richer language-aware symbol context for Python, Go, and Rust.
- [ ] Add --since filters for release branch triage.
- [ ] Add config schema export for editor validation.
