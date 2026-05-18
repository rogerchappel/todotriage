#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { initConfig } from "./init.js";
import { parseArgs } from "./args.js";
import { helpText } from "./help.js";
import { scanProject } from "../core/scanner.js";
import { renderReport } from "../renderer/index.js";

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2), process.cwd());
  if (parsed.command === "help") {
    process.stdout.write(helpText());
    return;
  }
  if (parsed.command === "version") {
    const pkg = JSON.parse(await readFile(new URL("../../package.json", import.meta.url), "utf8")) as { version: string };
    process.stdout.write(pkg.version + "\n");
    return;
  }
  if (parsed.command === "init") {
    const path = await initConfig(process.cwd(), parsed.preset ?? "default");
    process.stdout.write("Wrote " + path + "\n");
    return;
  }

  if (!parsed.options) {
    throw new Error("Missing scan options");
  }

  const report = await scanProject(parsed.options);
  const rendered = renderReport(report, parsed.options.format);
  if (parsed.options.out) {
    const outPath = resolve(process.cwd(), parsed.options.out);
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, rendered, "utf8");
    process.stdout.write("Wrote " + outPath + "\n");
  } else {
    process.stdout.write(rendered);
  }

  if (report.summary.failedGate) {
    process.exitCode = 2;
  }
}

main().catch((error: unknown) => {
  process.stderr.write((error as Error).message + "\n");
  process.exitCode = 1;
});
