import type { Severity, TodoFinding, TodoTriageConfig } from "../types.js";

const severityRank: Record<Severity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3
};

export function compareSeverity(a: Severity, b: Severity): number {
  return severityRank[a] - severityRank[b];
}

export function meetsSeverity(value: Severity, threshold: Severity): boolean {
  return compareSeverity(value, threshold) >= 0;
}

export function scoreFinding(
  marker: string,
  text: string,
  priorityTag: string | null,
  releaseRisk: boolean,
  ageDays: number | null,
  config: TodoTriageConfig
): { severity: Severity; score: number; remediation: string } {
  let score = 10;
  let severity = config.severityOverrides[marker] ?? "low";
  const normalized = text.toLowerCase();

  if (marker === "FIXME" || marker === "XXX") score += 35;
  if (marker === "HACK") score += 20;
  if (releaseRisk) score += 30;
  if (normalized.includes("security") || normalized.includes("auth")) score += 35;
  if (priorityTag === "critical" || priorityTag === "p0") score += 50;
  if (priorityTag === "high" || priorityTag === "p1") score += 30;
  if (priorityTag === "medium" || priorityTag === "p2") score += 15;
  if (priorityTag === "low" || priorityTag === "p3") score -= 5;
  if (ageDays !== null && ageDays >= config.oldDays) score += 25;
  else if (ageDays !== null && ageDays >= config.staleDays) score += 15;

  if (score >= 90) severity = "critical";
  else if (score >= 60 && compareSeverity(severity, "high") < 0) severity = "high";
  else if (score >= 35 && compareSeverity(severity, "medium") < 0) severity = "medium";

  return {
    severity,
    score,
    remediation: remediationFor(severity, releaseRisk, ageDays, config)
  };
}

export function sortFindings(findings: TodoFinding[]): TodoFinding[] {
  return [...findings].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    return a.line - b.line;
  });
}

function remediationFor(
  severity: Severity,
  releaseRisk: boolean,
  ageDays: number | null,
  config: TodoTriageConfig
): string {
  if (severity === "critical") return "Resolve before release or document an explicit release exception.";
  if (releaseRisk) return "Review before release and either fix or downgrade with a clear owner.";
  if (ageDays !== null && ageDays >= config.staleDays) return "Confirm whether this stale TODO still applies and assign ownership.";
  if (severity === "high") return "Prioritize in the next maintenance pass.";
  return "Keep visible; batch with related cleanup when touching this area.";
}
