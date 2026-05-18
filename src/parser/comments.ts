export interface RawTodoComment {
  marker: string;
  line: number;
  column: number;
  text: string;
}

export function extractTodoComments(source: string, markers: string[]): RawTodoComment[] {
  const markerPattern = markers.map(escapeRegex).join("|");
  const pattern = new RegExp("\\b(" + markerPattern + ")(?:\\(([^)]+)\\))?:?\\s*(.*)", "i");
  const findings: RawTodoComment[] = [];
  const lines = source.split(/\r?\n/);

  lines.forEach((lineText, index) => {
    const match = pattern.exec(lineText);
    if (!match) {
      return;
    }

    const marker = match[1].toUpperCase();
    const tag = match[2]?.trim();
    const body = match[3]?.trim() ?? "";
    const text = tag ? "[" + tag + "] " + body : body;
    findings.push({
      marker,
      line: index + 1,
      column: match.index + 1,
      text
    });
  });

  return findings;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
