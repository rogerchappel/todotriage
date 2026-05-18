import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { scanProject } from "../src/core/scanner.js";

const cwd = resolve(import.meta.dirname, "..");

test("clean fixture returns an empty report", async () => {
  const report = await scanProject({ cwd, root: "examples/fixtures/clean", format: "json", noGit: true });
  assert.equal(report.summary.total, 0);
});

test("tagged fixture ranks release hack above regular todo", async () => {
  const report = await scanProject({ cwd, root: "examples/fixtures/tagged", format: "json", noGit: true });
  assert.equal(report.summary.total, 2);
  assert.equal(report.findings[0]?.marker, "HACK");
  assert.equal(report.findings[0]?.releaseRisk, true);
});

test("fixture config ignores generated paths", async () => {
  const report = await scanProject({ cwd, root: "examples/fixtures/ignored", format: "json", noGit: true });
  assert.equal(report.summary.total, 0);
});

test("fail gate is marked when high findings exist", async () => {
  const report = await scanProject({
    cwd,
    root: "examples/fixtures/stale",
    format: "json",
    failOn: "high",
    noGit: true
  });
  assert.equal(report.summary.failedGate, true);
  assert.equal(report.findings[0]?.severity, "critical");
});
