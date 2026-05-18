import type { ScanOptions, Severity } from "../types.js";

export interface ParsedCommand {
  command: "scan" | "init" | "help" | "version";
  options?: ScanOptions;
  preset?: string;
}

const severities = new Set(["low", "medium", "high", "critical"]);

export function parseArgs(argv: string[], cwd: string): ParsedCommand {
  const [command, ...rest] = argv;
  if (!command || command === "--help" || command === "-h") return { command: "help" };
  if (command === "--version" || command === "-v") return { command: "version" };
  if (command === "init") {
    return { command: "init", preset: valueAfter(rest, "--preset") ?? "default" };
  }
  if (command !== "scan") {
    throw new Error("Unknown command: " + command);
  }

  const positional = rest.filter((arg, index) => !arg.startsWith("-") && !isValueForOption(rest, index));
  const root = positional[0] ?? ".";
  const format = valueAfter(rest, "--format") ?? inferFormat(valueAfter(rest, "--out"));
  if (format !== "markdown" && format !== "json") {
    throw new Error("--format must be markdown or json");
  }

  const failOn = valueAfter(rest, "--fail-on");
  if (failOn && !severities.has(failOn)) {
    throw new Error("--fail-on must be low, medium, high, or critical");
  }

  return {
    command: "scan",
    options: {
      cwd,
      root,
      format,
      out: valueAfter(rest, "--out"),
      failOn: failOn as Severity | undefined,
      noGit: rest.includes("--no-git"),
      configPath: valueAfter(rest, "--config")
    }
  };
}

function valueAfter(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  return args[index + 1];
}

function isValueForOption(args: string[], index: number): boolean {
  const previous = args[index - 1];
  return ["--out", "--format", "--fail-on", "--config", "--preset"].includes(previous);
}

function inferFormat(out?: string): "markdown" | "json" {
  return out?.endsWith(".json") ? "json" : "markdown";
}
