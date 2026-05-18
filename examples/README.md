# Examples

The fixture projects are intentionally small and checked into the repository so tests and smoke runs use real files.

- clean: no markers.
- stale: high-risk FIXME with release/auth language.
- tagged: owner and priority tags.
- docs: Markdown heading context.
- ignored: local .todotriage.json ignore policy.
- no-git: shell input that can be scanned without git metadata.

Run:

```sh
npm run build
node dist/cli/index.js scan examples/fixtures/tagged --out examples/output/tagged.md
```
