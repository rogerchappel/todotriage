import type { ScanOptions, Severity } from "../types.js";

export interface ParsedCommand {
  command: "scan" | "init" | "help" | "version";
  options?: ScanOptions;
  preset?: string;
}

const severities = new Set(["low", "medium", "high", "critical"]);
const scanValueOptions = new Set(["--out", "--format", "--fail-on", "--config"]);
const scanFlagOptions = new Set(["--no-git"]);

export function parseArgs(argv: string[], cwd: string): ParsedCommand {
  const [command, ...rest] = argv;
  if (!command || command === "--help" || command === "-h") return { command: "help" };
  if (command === "--version" || command === "-v") return { command: "version" };
  if (command === "init") return parseInit(rest);
  if (command !== "scan") throw new Error("Unknown command: " + command);

  const values = new Map<string, string>();
  const flags = new Set<string>();
  let root = ".";
  let hasRoot = false;

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (scanValueOptions.has(arg)) {
      rejectDuplicate(values.has(arg), arg);
      const value = requiredValue(rest, index, arg);
      values.set(arg, value);
      index += 1;
    } else if (scanFlagOptions.has(arg)) {
      rejectDuplicate(flags.has(arg), arg);
      flags.add(arg);
    } else if (arg.startsWith("-")) {
      throw new Error("Unknown scan option: " + arg);
    } else if (hasRoot) {
      throw new Error("scan accepts at most one path argument: " + arg);
    } else {
      root = arg;
      hasRoot = true;
    }
  }

  const out = values.get("--out");
  const format = values.get("--format") ?? inferFormat(out);
  if (format !== "markdown" && format !== "json") {
    throw new Error("--format must be markdown or json");
  }

  const failOn = values.get("--fail-on");
  if (failOn && !severities.has(failOn)) {
    throw new Error("--fail-on must be low, medium, high, or critical");
  }

  return {
    command: "scan",
    options: {
      cwd,
      root,
      format,
      out,
      failOn: failOn as Severity | undefined,
      noGit: flags.has("--no-git"),
      configPath: values.get("--config")
    }
  };
}

function parseInit(args: string[]): ParsedCommand {
  if (args.length === 0) return { command: "init", preset: "default" };
  if (args[0] !== "--preset") throw new Error("Unknown init option: " + args[0]);
  const preset = requiredValue(args, 0, "--preset");
  if (args.length > 2) {
    if (args[2] === "--preset") throw new Error("Option may only be specified once: --preset");
    throw new Error("Unknown init option: " + args[2]);
  }
  return { command: "init", preset };
}

function requiredValue(args: string[], index: number, name: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith("-")) throw new Error("Option requires a value: " + name);
  return value;
}

function rejectDuplicate(duplicate: boolean, name: string): void {
  if (duplicate) throw new Error("Option may only be specified once: " + name);
}

function inferFormat(out?: string): "markdown" | "json" {
  return out?.endsWith(".json") ? "json" : "markdown";
}
