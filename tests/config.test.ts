import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { loadConfig } from "../src/config/load.js";

test("loads config overrides from scan root", async () => {
  const root = await mkdtemp(join(tmpdir(), "todotriage-config-"));
  await writeFile(
    join(root, ".todotriage.json"),
    JSON.stringify({ markers: ["debt", "todo"], staleDays: 30, severityOverrides: { DEBT: "medium" } })
  );

  const config = await loadConfig(root);
  assert.deepEqual(config.markers, ["DEBT", "TODO"]);
  assert.equal(config.staleDays, 30);
  assert.equal(config.severityOverrides.DEBT, "medium");
});

test("rejects invalid severity overrides", async () => {
  const root = await mkdtemp(join(tmpdir(), "todotriage-config-"));
  await writeFile(join(root, ".todotriage.json"), JSON.stringify({ severityOverrides: { TODO: "urgent" } }));
  await assert.rejects(() => loadConfig(root), /severityOverrides\.TODO must be one of/);
});

test("rejects malformed config fields with actionable paths", async (t) => {
  const cases: Array<[string, unknown, RegExp]> = [
    ["non-object root", [], /root must be a JSON object/],
    ["non-array markers", { markers: "TODO" }, /markers must be an array of strings/],
    ["non-string array item", { ignoredPaths: ["dist", 42] }, /ignoredPaths\[1\] must be a string/],
    ["negative threshold", { staleDays: -1 }, /staleDays must be a finite non-negative number/],
    ["non-number threshold", { oldDays: null }, /oldDays must be a finite non-negative number/],
    ["incoherent thresholds", { staleDays: 10, oldDays: 9 }, /staleDays \(10\) must not exceed oldDays \(9\)/],
    ["non-object overrides", { severityOverrides: ["high"] }, /severityOverrides must be an object/],
    ["non-string severity", { severityOverrides: { TODO: 1 } }, /severityOverrides\.TODO must be one of/]
  ];

  for (const [name, value, expected] of cases) {
    await t.test(name, async () => {
      const root = await mkdtemp(join(tmpdir(), "todotriage-config-"));
      await writeFile(join(root, ".todotriage.json"), JSON.stringify(value));
      await assert.rejects(() => loadConfig(root), expected);
    });
  }
});

test("rejects a numeric literal that overflows to infinity", async () => {
  const root = await mkdtemp(join(tmpdir(), "todotriage-config-"));
  await writeFile(join(root, ".todotriage.json"), '{"oldDays": 1e400}');
  await assert.rejects(() => loadConfig(root), /oldDays must be a finite non-negative number/);
});

test("accepts valid boundary values and preserves partial-config defaults", async () => {
  const root = await mkdtemp(join(tmpdir(), "todotriage-config-"));
  await writeFile(
    join(root, ".todotriage.json"),
    JSON.stringify({ staleDays: 0, oldDays: 0, ignoredPaths: [], severityOverrides: {} })
  );

  const config = await loadConfig(root);
  assert.equal(config.staleDays, 0);
  assert.equal(config.oldDays, 0);
  assert.deepEqual(config.markers, ["FIXME", "HACK", "TODO", "XXX"]);
  assert.deepEqual(config.ignoredPaths, [
    ".git/", "node_modules/", "dist/", "coverage/", ".next/", "vendor/", "examples/output/"
  ]);
  assert.equal(config.severityOverrides.FIXME, "high");
});
