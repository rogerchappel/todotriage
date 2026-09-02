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
  let lexicalState: LexicalState = { inBlockComment: false, quote: "", templateDepths: [] };

  lines.forEach((lineText, index) => {
    const result = commentSegments(lineText, fileType, lexicalState);
    lexicalState = result.state;
    for (const segment of result.segments) {
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
}

interface LexicalState {
  inBlockComment: boolean;
  quote: string;
  templateDepths: number[];
}

interface CommentSegmentsResult {
  segments: CommentSegment[];
  state: LexicalState;
}

function commentSegments(line: string, fileType: string, state: LexicalState): CommentSegmentsResult {
  if (fileType === "markdown" || fileType === "text") {
    return { segments: [{ text: line, column: 1 }], state: { inBlockComment: false, quote: "", templateDepths: [] } };
  }
  if (fileType === "shell" || fileType === "yaml") {
    const start = findUnquoted(line, "#");
    const segments = start < 0 ? [] : [{ text: line.slice(start + 1), column: start + 2 }];
    return { segments, state: { inBlockComment: false, quote: "", templateDepths: [] } };
  }
  if (fileType !== "javascript" && fileType !== "typescript" && fileType !== "css") {
    return { segments: [], state: { inBlockComment: false, quote: "", templateDepths: [] } };
  }

  const segments: CommentSegment[] = [];
  let inBlock = state.inBlockComment;
  let quote = state.quote;
  const templateDepths = [...state.templateDepths];
  let escaped = false;
  let start = inBlock ? 0 : -1;
  for (let i = 0; i < line.length; i += 1) {
    if (inBlock) {
      if (line[i] === "*" && line[i + 1] === "/") {
        segments.push({ text: line.slice(start, i), column: start + 1 });
        inBlock = false;
        i += 1;
      }
      continue;
    }
    const templateDepth = templateDepths.at(-1);
    if (templateDepth === 0) {
      if (escaped) escaped = false;
      else if (line[i] === "\\") escaped = true;
      else if (line[i] === "`") templateDepths.pop();
      else if (line[i] === "$" && line[i + 1] === "{") {
        templateDepths[templateDepths.length - 1] = 1;
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
    if (line[i] === '"' || line[i] === "'") {
      quote = line[i];
    } else if (fileType !== "css" && line[i] === "`") {
      templateDepths.push(0);
    } else if (fileType !== "css" && templateDepth !== undefined && line[i] === "{") {
      templateDepths[templateDepths.length - 1] += 1;
    } else if (fileType !== "css" && templateDepth !== undefined && line[i] === "}") {
      templateDepths[templateDepths.length - 1] -= 1;
    } else if (fileType === "css" && line[i] === "`") {
      quote = line[i];
    } else if (
      fileType !== "css" &&
      line[i] === "/" &&
      line[i + 1] !== "/" &&
      line[i + 1] !== "*" &&
      isRegexLiteralStart(line, i)
    ) {
      i = regexLiteralEnd(line, i);
    } else if (line[i] === "/" && line[i + 1] === "*") {
      inBlock = true;
      start = i + 2;
      i += 1;
    } else if (fileType !== "css" && line[i] === "/" && line[i + 1] === "/") {
      segments.push({ text: line.slice(i + 2), column: i + 3 });
      break;
    }
  }
  if (inBlock) segments.push({ text: line.slice(start), column: start + 1 });
  return { segments, state: { inBlockComment: inBlock, quote, templateDepths } };
}

function isRegexLiteralStart(line: string, slashIndex: number): boolean {
  const prefix = line.slice(0, slashIndex).trimEnd();
  if (!prefix) return true;

  const previous = prefix.at(-1) ?? "";
  if (/[({[=,:;!?&|+*%^~<>-]/.test(previous)) return true;

  const keyword = /(?:^|[^A-Za-z0-9_$])(return|throw|case|delete|typeof|void|new|in|instanceof|of|yield|await)$/.exec(prefix);
  return keyword !== null;
}

function regexLiteralEnd(line: string, slashIndex: number): number {
  let escaped = false;
  let inCharacterClass = false;
  for (let i = slashIndex + 1; i < line.length; i += 1) {
    const character = line[i];
    if (escaped) {
      escaped = false;
    } else if (character === "\\") {
      escaped = true;
    } else if (character === "[") {
      inCharacterClass = true;
    } else if (character === "]") {
      inCharacterClass = false;
    } else if (character === "/" && !inCharacterClass) {
      while (/[A-Za-z]/.test(line[i + 1] ?? "")) i += 1;
      return i;
    }
  }
  return slashIndex;
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
