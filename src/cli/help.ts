export function helpText(): string {
  return [
    "todotriage",
    "",
    "Usage:",
    "  todotriage scan <path> [--out file] [--format markdown|json] [--fail-on low|medium|high|critical]",
    "  todotriage init [--preset oss-cli]",
    "",
    "Options:",
    "  --config file    Use a specific .todotriage.json file",
    "  --no-git         Skip git blame metadata",
    "  --help           Show help",
    "  --version        Show package version",
    ""
  ].join("\n");
}
