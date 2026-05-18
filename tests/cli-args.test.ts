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
