# CI Usage

Use TodoTriage as a release-risk gate after dependencies are installed and the package is built.

```sh
npm ci
npm run build
npx todotriage scan . --format json --fail-on high
```

The gate is deterministic:

- 0: scan completed and no configured severity threshold was met.
- 1: CLI or environment error.
- 2: scan completed and the severity threshold was met.

Teams that want visibility without blocking can omit --fail-on and upload the Markdown report as a build artifact.
