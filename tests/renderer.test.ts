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

test("renders markdown queue", () => {
  const markdown = renderMarkdown(report);
  assert.match(markdown, /TodoTriage Report/);
  assert.match(markdown, /src\/app.ts:2/);
});
