export type Severity = "low" | "medium" | "high" | "critical";

export interface MarkerPolicy {
  markers: string[];
  aliases: Record<string, Severity>;
}

export interface TodoTriageConfig {
  markers: string[];
  ignoredPaths: string[];
  includeGlobs: string[];
  staleDays: number;
  oldDays: number;
  releaseRiskKeywords: string[];
  severityOverrides: Record<string, Severity>;
}

export interface ScanOptions {
  cwd: string;
  root: string;
  format: "markdown" | "json";
  out?: string;
  failOn?: Severity;
  noGit?: boolean;
  configPath?: string;
}

export interface GitBlameInfo {
  author: string;
  authorTime: string;
  ageDays: number;
}

export interface TodoFinding {
  id: string;
  marker: string;
  file: string;
  line: number;
  column: number;
  text: string;
  context: string | null;
  fileType: string;
  priorityTag: string | null;
  issueLinks: string[];
  releaseRisk: boolean;
  git: GitBlameInfo | null;
  severity: Severity;
  score: number;
  remediation: string;
}

export interface ScanSummary {
  root: string;
  generatedAt: string;
  total: number;
  bySeverity: Record<Severity, number>;
  byMarker: Record<string, number>;
  failedGate: boolean;
  failOn: Severity | null;
}

export interface ScanReport {
  summary: ScanSummary;
  findings: TodoFinding[];
}
