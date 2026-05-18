# Configuration

TodoTriage reads .todotriage.json from the scan root unless --config points to another file.

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
