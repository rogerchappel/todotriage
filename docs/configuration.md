# Configuration

TodoTriage reads .todotriage.json from the scan root unless --config points to another file.
It also reads `.gitignore` from the scan root. Rules are evaluated in order, including
negated rules such as `!generated/keep.ts`, so a later rule can re-include a file
beneath an ignored path. Slashless file and directory patterns, such as `*.ts` and
`build/`, apply at every directory depth; a leading slash anchors a pattern to the
scan root. Standard `?` single-character patterns and bracket classes or ranges such
as `[abc]`, `[0-9]`, and `[!a]` are supported. TodoTriage currently reads only the root `.gitignore`; nested `.gitignore`
files and escaped leading `#` or `!` characters are not supported.

## Fields

- markers: an array of marker words to detect, normalized to uppercase.
- ignoredPaths: an array of path prefixes or simple globs excluded from scans.
- includeGlobs: an array of file globs included in scans.
- staleDays: a finite, non-negative age threshold that increases score when git blame is available.
- oldDays: a finite, non-negative older age threshold that increases score further. It must be greater
  than or equal to `staleDays`, including when only one threshold overrides its default.
- releaseRiskKeywords: an array of words that mark a finding as release-sensitive.
- severityOverrides: an object mapping markers to `low`, `medium`, `high`, or `critical`.

All array elements must be strings. Omitted fields keep their defaults; configured `ignoredPaths` are
appended to the default exclusions, while the other array fields replace their defaults. A malformed
field is reported with its config path and field name before scanning begins.

## Comment parsing

JavaScript and TypeScript scans ignore marker-like text inside quoted strings and
template literal text. Valid regular-expression literals are also treated as code,
so `//` or `/*` sequences in a regex body or character class do not begin comments;
real line or block comments immediately after the regex are still scanned.
Because `${...}` interpolation expressions are executable
JavaScript, line and block comments inside those expressions are scanned, including
inside nested templates. Braces in an interpolation are tracked so scanning resumes
as template text only when the matching expression brace closes.

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
