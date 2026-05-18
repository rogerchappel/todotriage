const issuePattern = /(?:https?:\/\/[^\s)]+\/issues\/\d+|#[0-9]+)/gi;
const priorityPattern = /\[(p[0-3]|critical|high|medium|low|owner:[^\]]+)\]/i;

export function extractIssueLinks(text: string): string[] {
  return [...new Set(text.match(issuePattern) ?? [])].sort();
}

export function extractPriorityTag(text: string): string | null {
  const match = priorityPattern.exec(text);
  return match ? match[1].toLowerCase() : null;
}

export function hasReleaseRisk(text: string, keywords: string[]): boolean {
  const normalized = text.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
}
