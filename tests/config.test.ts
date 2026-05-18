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
  await assert.rejects(() => loadConfig(root), /Invalid severity override/);
});
