import assert from "node:assert/strict";
import test from "node:test";
import { renderJson } from "../src/renderer/json.js";
import { renderMarkdown } from "../src/renderer/markdown.js";
import type { ScanReport } from "../src/types.js";

const report: ScanReport = {
  summary: {
    root: "/tmp/project",
    generatedAt: "2026-05-18T00:00:00.000Z",
    total: 1,
    bySeverity: { low: 0, medium: 0, high: 1, critical: 0 },
    byMarker: { FIXME: 1 },
    failedGate: true,
    failOn: "high"
  },
  findings: [
    {
      id: "tt-test",
      marker: "FIXME",
      file: "src/app.ts",
      line: 2,
      column: 3,
      text: "release issue",
      context: "app",
      fileType: "typescript",
      priorityTag: null,
      issueLinks: [],
      releaseRisk: true,
      git: null,
      severity: "high",
      score: 80,
      remediation: "Review before release."
    }
  ]
};

test("renders stable json", () => {
  assert.equal(JSON.parse(renderJson(report)).summary.total, 1);
});

test("renders an exact multi-line markdown queue and escapes only pipes", () => {
  const markdown = renderMarkdown({
    ...report,
    findings: [{ ...report.findings[0], text: "release | issue" }]
  });

  assert.equal(markdown, `# TodoTriage Report

Generated: 2026-05-18T00:00:00.000Z
Root: \`/tmp/project\`
Total findings: 1

## Summary

| Severity | Count |
| --- | ---: |
| critical | 0 |
| high | 1 |
| medium | 0 |
| low | 0 |

## Queue

### 1. HIGH FIXME in \`src/app.ts:2\`

- Score: 80
- Context: app
- Text: release \\| issue
- Release risk: yes
- Remediation: Review before release.

## Gate

Failed: at least one finding met \`high\` severity.

`);
  assert.equal(Buffer.from(markdown).includes(Buffer.from("\\n")), false);
});

test("leaves finding text without pipes unchanged", () => {
  assert.match(renderMarkdown(report), /- Text: release issue\n/);
});

test("renders an exact empty markdown report", () => {
  const markdown = renderMarkdown({
    summary: {
      ...report.summary,
      total: 0,
      bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
      byMarker: {},
      failedGate: false,
      failOn: null
    },
    findings: []
  });

  assert.equal(markdown, `# TodoTriage Report

Generated: 2026-05-18T00:00:00.000Z
Root: \`/tmp/project\`
Total findings: 0

## Summary

| Severity | Count |
| --- | ---: |
| critical | 0 |
| high | 0 |
| medium | 0 |
| low | 0 |

No TODO debt markers were found.

`);
});
