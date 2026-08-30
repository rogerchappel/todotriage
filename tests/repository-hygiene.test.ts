import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const obsoleteCommonJsPaths = [
  "bin/todotriage.js",
  "scripts/build.js",
  "scripts/check.js",
  "src/index.js",
  "test/todotriage.test.js"
];

test("keeps TypeScript and ESM as the only implementation and test path", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8")) as {
    bin?: Record<string, string>;
    exports?: Record<string, string>;
    scripts?: Record<string, string>;
    type?: string;
  };

  assert.equal(packageJson.type, "module");
  assert.equal(packageJson.bin?.todotriage, "./dist/cli/index.js");
  assert.equal(packageJson.exports?.["."], "./dist/index.js");
  assert.equal(packageJson.scripts?.test, "tsx --test tests/*.test.ts");

  for (const path of obsoleteCommonJsPaths) {
    await assert.rejects(
      access(path),
      (error: NodeJS.ErrnoException) => error.code === "ENOENT",
      `${path} must not return as a parallel CommonJS path`
    );
  }
});

test("keeps canonical agent operating metadata", async () => {
  const agents = await readFile("AGENTS.md", "utf8");
  const requiredLines = [
    "# Agent Operating Instructions for todotriage",
    "This file defines how AI agents and human maintainers should work in `todotriage`.",
    "- Project: `todotriage`",
    "- Repository: `https://github.com/rogerchappel/todotriage`",
    "- Primary maintainer: `Roger Chappel`",
    "- Default branch: `main`",
    "- Package manager: `npm`",
    "- Branch from the latest `main` before editing."
  ];

  for (const line of requiredLines) {
    assert.ok(agents.split("\n").includes(line), `AGENTS.md must contain: ${line}`);
  }

  assert.doesNotMatch(agents, /`\.\.\/todotriage`|: ``|latest ``/);
});
