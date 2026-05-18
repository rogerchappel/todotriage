# Roadmap

This roadmap describes intended direction, not a delivery promise.

## Now

- Stabilize parser, scoring, and renderer contracts around fixture-backed tests.
- Keep CLI output deterministic for CI and agent consumers.
- Document release-gate usage for maintainers.

## Next

- Add SARIF output for GitHub code scanning.
- Export a JSON schema for .todotriage.json.
- Add richer nearby-symbol extraction for Python, Go, and Rust.

## Later

- Consider optional issue creation commands after local report quality is proven.
- Add trend comparison between reports.
- Explore editor integrations that consume JSON output.

## Not Planned

- Hosted scanning or telemetry.
- Automatic comment rewriting in V1.
- LLM classification as a required dependency.
