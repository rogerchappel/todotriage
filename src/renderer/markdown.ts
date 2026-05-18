import type { ScanReport } from "../types.js";

export function renderMarkdown(report: ScanReport): string {
  const lines: string[] = [];
  lines.push("# TodoTriage Report", "");
  lines.push(\`Generated: \${report.summary.generatedAt}\`);
  lines.push(\`Root: \\\`\${report.summary.root}\\\`\`);
  lines.push(\`Total findings: \${report.summary.total}\`);
  lines.push("");
  lines.push("## Summary", "");
  lines.push("| Severity | Count |");
  lines.push("| --- | ---: |");
  for (const severity of ["critical", "high", "medium", "low"] as const) {
    lines.push(\`| \${severity} | \${report.summary.bySeverity[severity]} |\`);
  }
  lines.push("");

  if (report.summary.total === 0) {
    lines.push("No TODO debt markers were found.", "");
    return lines.join("\\n") + "\\n";
  }

  lines.push("## Queue", "");
  report.findings.forEach((finding, index) => {
    lines.push(\`### \${index + 1}. \${finding.severity.toUpperCase()} \${finding.marker} in \\\`\${finding.file}:\${finding.line}\\\`\`);
    lines.push("");
    lines.push(\`- Score: \${finding.score}\`);
    lines.push(\`- Context: \${finding.context ?? "unknown"}\`);
    lines.push(\`- Text: \${escapeMarkdown(finding.text) || "(empty marker)"}\`);
    lines.push(\`- Release risk: \${finding.releaseRisk ? "yes" : "no"}\`);
    if (finding.priorityTag) lines.push(\`- Priority tag: \${finding.priorityTag}\`);
    if (finding.issueLinks.length > 0) lines.push(\`- Links: \${finding.issueLinks.join(", ")}\`);
    if (finding.git) {
      lines.push(\`- Age: \${finding.git.ageDays} days by \${finding.git.author}\`);
    }
    lines.push(\`- Remediation: \${finding.remediation}\`);
    lines.push("");
  });

  if (report.summary.failOn) {
    lines.push("## Gate", "");
    lines.push(
      report.summary.failedGate
        ? \`Failed: at least one finding met \\\`\${report.summary.failOn}\\\` severity.\`
        : \`Passed: no finding met \\\`\${report.summary.failOn}\\\` severity.\`
    );
    lines.push("");
  }

  return lines.join("\\n") + "\\n";
}

function escapeMarkdown(value: string): string {
  return value.replace(/\\|/g, "\\\\|");
}
