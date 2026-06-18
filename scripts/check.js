"use strict";

const fs = require("node:fs");

const required = [
  "README.md",
  "SKILL.md",
  "docs/PRD.md",
  "docs/TASKS.md",
  "docs/ORCHESTRATION.md",
  "docs/RELEASE_CANDIDATE.md",
  "bin/todotriage.js",
  "src/index.js"
];

const missing = required.filter((file) => !fs.existsSync(file));
if (missing.length) {
  process.stderr.write(`Missing required files:\n${missing.join("\n")}\n`);
  process.exit(1);
}
process.stdout.write("check: required files present\n");
