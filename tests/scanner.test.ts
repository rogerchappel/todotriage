import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { scanProject } from "../src/core/scanner.js";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

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

test("gitignore negation re-includes a file beneath an ignored path", async () => {
  const report = await scanProject({
    cwd,
    root: "examples/fixtures/gitignore-negation",
    format: "json",
    noGit: true
  });

  assert.equal(report.summary.total, 1);
  assert.equal(report.findings[0]?.file, "generated/keep.ts");
  assert.equal(report.findings[0]?.text, "should be re-included");
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

test("default globs scan root and nested files without reporting string literals", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "todotriage-scan-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "nested"));
  await writeFile(join(root, "app.ts"), 'const a = "TODO string";\n// TODO root comment\n');
  await writeFile(join(root, "nested", "app.ts"), 'const b = "FIXME string";\n/* FIXME nested comment */\n');

  const report = await scanProject({ cwd: root, root: ".", format: "json", noGit: true });
  assert.deepEqual(report.findings.map(({ file, marker }) => ({ file, marker })), [
    { file: "nested/app.ts", marker: "FIXME" },
    { file: "app.ts", marker: "TODO" }
  ]);
});
