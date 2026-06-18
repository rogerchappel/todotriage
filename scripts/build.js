"use strict";

const { execFileSync } = require("node:child_process");

execFileSync(process.execPath, ["--check", "src/index.js"], {
  stdio: "ignore"
});
execFileSync(process.execPath, ["--check", "bin/todotriage.js"], {
  stdio: "ignore"
});
process.stdout.write("build: commonjs library parses\n");
