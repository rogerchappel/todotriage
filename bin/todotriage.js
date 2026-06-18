#!/usr/bin/env node
"use strict";

const { initConfig, renderReport, scanProject, severityRank, writeReport } = require("../src");

function parseArgs(argv) {
  const [command, target, ...rest] = argv;
  const args = { target, _: [] };
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = rest[index + 1];
      if (!next || next.startsWith("--")) {
        args[key] = true;
      } else {
        args[key] = next;
        index += 1;
      }
    } else {
      args._.push(token);
    }
  }
  return { command, args };
}

async function main() {
  const { command, args } = parseArgs(process.argv.slice(2));
  if (!command || command === "help" || args.help) {
    process.stdout.write(`todotriage

Usage:
  todotriage scan . --out docs/TODOS.md
  todotriage scan fixtures/debt --format json --fail-on high
  todotriage init --preset oss-cli
`);
    return;
  }

  if (command === "init") {
    const output = await initConfig({ preset: args.preset || "oss-cli" });
    process.stdout.write(`Wrote ${output}\n`);
    return;
  }

  if (command === "scan") {
    const root = args.target || ".";
    const report = await scanProject(root);
    const format = args.format || (args.out && args.out.endsWith(".json") ? "json" : "markdown");
    const rendered = renderReport(report, { format });
    if (args.out) {
      await writeReport(args.out, rendered);
      process.stdout.write(`Wrote ${args.out}\n`);
    } else {
      process.stdout.write(rendered);
    }
    if (args["fail-on"]) {
      const gate = severityRank(args["fail-on"]);
      const hit = report.findings.some((finding) => severityRank(finding.severity) >= gate);
      if (hit) process.exitCode = 2;
    }
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => {
  process.stderr.write(`todotriage: ${error.message}\n`);
  process.exitCode = 1;
});
