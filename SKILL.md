# TodoTriage Skill

Use this skill when an agent needs to inspect TODO-style comments before a release, review, refactor, or handoff.

## Required Inputs

- A local repository or directory to scan.
- Optional `.todotriage.json` policy.

## Side-Effect Boundaries

The CLI reads local source files and may write a local report. It must not create issues, rewrite comments, post externally, or fail a release without a human-visible report.

## Workflow

1. Run `todotriage scan <path> --out docs/TODOS.md`.
2. Review high and medium findings.
3. For CI gates, run `todotriage scan <path> --format json --fail-on high`.
4. Convert important findings into tracked work only after approval.

## Example

```bash
todotriage scan . --out docs/TODOS.md
todotriage scan . --format json --fail-on high
```

## Verification

Run `npm test`, `npm run smoke`, or `bash scripts/validate.sh`.
