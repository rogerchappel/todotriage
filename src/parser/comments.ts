export interface RawTodoComment {
  marker: string;
  line: number;
  column: number;
  text: string;
}

export function extractTodoComments(source: string, markers: string[], fileType = "text"): RawTodoComment[] {
  const markerPattern = markers.map(escapeRegex).join("|");
  if (!markerPattern) {
    return [];
  }
  const pattern = new RegExp("\\b(" + markerPattern + ")(?![A-Za-z0-9_])(?:\\(([^)]+)\\))?:?\\s*(.*)", "i");
  const findings: RawTodoComment[] = [];
  const lines = source.split(/\r?\n/);
  let inBlockComment = false;

  lines.forEach((lineText, index) => {
    for (const segment of commentSegments(lineText, fileType, inBlockComment)) {
      inBlockComment = segment.inBlockComment;
      const match = pattern.exec(segment.text);
      if (!match) continue;

      const marker = match[1].toUpperCase();
      const tag = match[2]?.trim();
      const body = match[3]?.trim() ?? "";
      const text = tag ? "[" + tag + "] " + body : body;
      findings.push({ marker, line: index + 1, column: segment.column + match.index, text });
    }
  });

  return findings;
}

interface CommentSegment {
  text: string;
  column: number;
  inBlockComment: boolean;
}

function commentSegments(line: string, fileType: string, startsInBlock: boolean): CommentSegment[] {
  if (fileType === "markdown" || fileType === "text") {
    return [{ text: line, column: 1, inBlockComment: false }];
  }
  if (fileType === "shell" || fileType === "yaml") {
    const start = findUnquoted(line, "#");
    return start < 0 ? [] : [{ text: line.slice(start + 1), column: start + 2, inBlockComment: false }];
  }
  if (fileType !== "javascript" && fileType !== "typescript" && fileType !== "css") {
    return [];
  }

  const segments: CommentSegment[] = [];
  let inBlock = startsInBlock;
  let quote = "";
  let escaped = false;
  let start = inBlock ? 0 : -1;
  for (let i = 0; i < line.length; i += 1) {
    if (inBlock) {
      if (line[i] === "*" && line[i + 1] === "/") {
        segments.push({ text: line.slice(start, i), column: start + 1, inBlockComment: false });
        inBlock = false;
        i += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (line[i] === "\\") escaped = true;
      else if (line[i] === quote) quote = "";
      continue;
    }
    if (line[i] === '"' || line[i] === "'" || line[i] === "`") {
      quote = line[i];
    } else if (line[i] === "/" && line[i + 1] === "*") {
      inBlock = true;
      start = i + 2;
      i += 1;
    } else if (fileType !== "css" && line[i] === "/" && line[i + 1] === "/") {
      segments.push({ text: line.slice(i + 2), column: i + 3, inBlockComment: false });
      break;
    }
  }
  if (inBlock) segments.push({ text: line.slice(start), column: start + 1, inBlockComment: true });
  return segments;
}

function findUnquoted(line: string, token: string): number {
  let quote = "";
  let escaped = false;
  for (let i = 0; i < line.length; i += 1) {
    if (escaped) escaped = false;
    else if (line[i] === "\\") escaped = true;
    else if (quote && line[i] === quote) quote = "";
    else if (!quote && (line[i] === '"' || line[i] === "'")) quote = line[i];
    else if (!quote && line[i] === token) return i;
  }
  return -1;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
