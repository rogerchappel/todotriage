# Orchestration

TodoTriage fits before release readiness checks and agent handoffs.

1. Agent scans the target repository or changed directory.
2. Report is written to a local file or printed to stdout.
3. High findings are reviewed before release or merge.
4. Medium findings become scheduled maintenance.
5. Low findings remain visible unless they survive multiple releases.

The tool never posts issues, rewrites comments, or sends source code outside the machine.
