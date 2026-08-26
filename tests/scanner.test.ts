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

test("slashless gitignore patterns match files and directories at every depth", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "todotriage-gitignore-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "build"));
  await mkdir(join(root, "nested", "build"), { recursive: true });
  await writeFile(join(root, ".gitignore"), "*.ts\nbuild/\n");
  await writeFile(join(root, "root.ts"), "// TODO ignored root file\n");
  await writeFile(join(root, "nested", "item.ts"), "// TODO ignored nested file\n");
  await writeFile(join(root, "build", "item.js"), "// TODO ignored root directory\n");
  await writeFile(join(root, "nested", "build", "item.js"), "// TODO ignored nested directory\n");
  await writeFile(join(root, "nested", "keep.js"), "// TODO retained file\n");

  const report = await scanProject({ cwd: root, root: ".", format: "json", noGit: true });

  assert.deepEqual(report.findings.map(({ file }) => file), ["nested/keep.js"]);
});

test("gitignore question marks and bracket classes match one path character", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "todotriage-gitignore-globs-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "nested"));
  await writeFile(join(root, ".gitignore"), "foo?.js\nasset[0-2].ts\ncache[!a].js\n");
  await writeFile(join(root, "foo1.js"), "// TODO ignored question match\n");
  await writeFile(join(root, "fooxy.js"), "// TODO retained question near miss\n");
  await writeFile(join(root, "nested", "asset2.ts"), "// TODO ignored range match\n");
  await writeFile(join(root, "nested", "asset3.ts"), "// TODO retained range near miss\n");
  await writeFile(join(root, "cacheb.js"), "// TODO ignored negated class match\n");
  await writeFile(join(root, "cachea.js"), "// TODO retained negated class near miss\n");

  const report = await scanProject({ cwd: root, root: ".", format: "json", noGit: true });

  assert.deepEqual(report.findings.map(({ file }) => file), [
    "cachea.js",
    "fooxy.js",
    "nested/asset3.ts"
  ]);
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

test("scans comments in template expressions without reporting template text", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "todotriage-template-expression-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const source = [
    "const message = `TODO template text ${(() => {",
    "  // TODO interpolation work",
    "  return 1;",
    "})()}`;"
  ].join("\n");
  await writeFile(join(root, "interpolation.ts"), source);

  const report = await scanProject({ cwd: root, root: ".", format: "json", noGit: true });

  assert.deepEqual(report.findings.map(({ file, marker, line, column, text }) => ({ file, marker, line, column, text })), [
    { file: "interpolation.ts", marker: "TODO", line: 2, column: 6, text: "interpolation work" }
  ]);
});
