"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { DEFAULT_CONFIG, renderReport, scanProject, scanText, severityRank } = require("../src");

test("scans TODO markers with severity", () => {
  const findings = scanText("src/app.js", "function run() {\n  // FIXME security release gate\n}\n", DEFAULT_CONFIG);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].severity, "high");
  assert.equal(findings[0].context, "run");
});

test("ranks severities", () => {
  assert.ok(severityRank("high") > severityRank("medium"));
  assert.ok(severityRank("medium") > severityRank("low"));
});

test("scans fixture project deterministically", async () => {
  const report = await scanProject("fixtures/debt");
  assert.equal(report.schema, "todotriage.report.v1");
  assert.equal(report.totals.findings, 3);
  assert.equal(report.findings[0].severity, "high");
});

test("renders markdown report", async () => {
  const report = await scanProject("fixtures/debt");
  const markdown = renderReport(report, { format: "markdown" });
  assert.match(markdown, /TODO Triage Report/);
  assert.match(markdown, /Remediation Queue/);
});
