import type { ScanReport, ScanSummary, Severity, TodoFinding } from "../types.js";
import { meetsSeverity } from "./severity.js";

const severities: Severity[] = ["low", "medium", "high", "critical"];

export function buildReport(
  root: string,
  findings: TodoFinding[],
  failOn: Severity | null,
  generatedAt = new Date().toISOString()
): ScanReport {
  const summary: ScanSummary = {
    root,
    generatedAt,
    total: findings.length,
    bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
    byMarker: {},
    failedGate: false,
    failOn
  };

  for (const finding of findings) {
    summary.bySeverity[finding.severity] += 1;
    summary.byMarker[finding.marker] = (summary.byMarker[finding.marker] ?? 0) + 1;
    if (failOn && meetsSeverity(finding.severity, failOn)) {
      summary.failedGate = true;
    }
  }

  for (const severity of severities) {
    summary.bySeverity[severity] = summary.bySeverity[severity] ?? 0;
  }

  return { summary, findings };
}
