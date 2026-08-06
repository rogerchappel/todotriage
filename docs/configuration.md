# Configuration

TodoTriage reads .todotriage.json from the scan root unless --config points to another file.
It also reads `.gitignore` from the scan root. Rules are evaluated in order, including
negated rules such as `!generated/keep.ts`, so a later rule can re-include a file
beneath an ignored path. Slashless file and directory patterns, such as `*.ts` and
`build/`, apply at every directory depth; a leading slash anchors a pattern to the
scan root. TodoTriage currently reads only the root `.gitignore`; nested `.gitignore`
files and escaped leading `#` or `!` characters are not supported.

## Fields

- markers: marker words to detect, normalized to uppercase.
- ignoredPaths: path prefixes or simple globs excluded from scans.
- includeGlobs: file globs included in scans.
- staleDays: age threshold that increases score when git blame is available.
- oldDays: older age threshold that increases score further.
- releaseRiskKeywords: words that mark a finding as release-sensitive.
- severityOverrides: marker-to-severity defaults.

## Example

```json
{
  "markers": ["TODO", "FIXME", "HACK", "DEBT"],
  "ignoredPaths": ["generated/"],
  "staleDays": 120,
  "oldDays": 365,
  "severityOverrides": {
    "DEBT": "medium"
  }
}
```
