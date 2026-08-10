import assert from "node:assert/strict";
import test from "node:test";
import { parseArgs } from "../src/cli/args.js";

test("parses scan args with inferred json format", () => {
  const parsed = parseArgs(["scan", ".", "--out", "report.json", "--fail-on", "high", "--no-git"], "/repo");
  assert.equal(parsed.command, "scan");
  assert.equal(parsed.options?.format, "json");
  assert.equal(parsed.options?.failOn, "high");
  assert.equal(parsed.options?.noGit, true);
});

test("rejects invalid fail-on severity", () => {
  assert.throws(() => parseArgs(["scan", ".", "--fail-on", "urgent"], "/repo"), /--fail-on/);
});

test("parses init preset", () => {
  const parsed = parseArgs(["init", "--preset", "oss-cli"], "/repo");
  assert.equal(parsed.command, "init");
  assert.equal(parsed.preset, "oss-cli");
});

test("rejects unknown scan options", () => {
  assert.throws(() => parseArgs(["scan", ".", "--bogus"], "/repo"), /Unknown scan option: --bogus/);
});

test("rejects duplicate scan options", () => {
  for (const args of [
    ["scan", "--out", "one.md", "--out", "two.md"],
    ["scan", "--format", "json", "--format", "markdown"],
    ["scan", "--fail-on", "high", "--fail-on", "low"],
    ["scan", "--config", "one.json", "--config", "two.json"],
    ["scan", "--no-git", "--no-git"]
  ]) {
    assert.throws(() => parseArgs(args, "/repo"), /Option may only be specified once/);
  }
});

test("rejects missing scan option values and option tokens used as values", () => {
  for (const option of ["--out", "--format", "--fail-on", "--config"]) {
    assert.throws(() => parseArgs(["scan", option], "/repo"), new RegExp(`Option requires a value: ${option}`));
    assert.throws(
      () => parseArgs(["scan", option, "--no-git"], "/repo"),
      new RegExp(`Option requires a value: ${option}`)
    );
  }
});

test("rejects extra scan paths", () => {
  assert.throws(() => parseArgs(["scan", ".", "extra"], "/repo"), /scan accepts at most one path argument: extra/);
});

test("rejects invalid init arguments", () => {
  assert.throws(() => parseArgs(["init", "--bogus"], "/repo"), /Unknown init option: --bogus/);
  assert.throws(() => parseArgs(["init", "--preset"], "/repo"), /Option requires a value: --preset/);
  assert.throws(() => parseArgs(["init", "--preset", "--bogus"], "/repo"), /Option requires a value: --preset/);
  assert.throws(
    () => parseArgs(["init", "--preset", "default", "--preset", "oss-cli"], "/repo"),
    /Option may only be specified once: --preset/
  );
  assert.throws(() => parseArgs(["init", "unexpected"], "/repo"), /Unknown init option: unexpected/);
});

test("keeps help and version aliases unchanged", () => {
  assert.deepEqual(parseArgs(["--help"], "/repo"), { command: "help" });
  assert.deepEqual(parseArgs(["-h"], "/repo"), { command: "help" });
  assert.deepEqual(parseArgs(["--version"], "/repo"), { command: "version" });
  assert.deepEqual(parseArgs(["-v"], "/repo"), { command: "version" });
});
