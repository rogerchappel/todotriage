export function matchesAnyGlob(path: string, globs: string[]): boolean {
  return globs.some((glob) => matchesGlob(path, glob));
}

export function matchesGlob(path: string, glob: string): boolean {
  const normalized = stripLeadingDotSlash(glob);
  if (normalized.endsWith("/")) {
    const directory = normalized.slice(0, -1);
    if (!hasGlobMagic(directory)) {
      return path === directory || path.startsWith(normalized);
    }
    const regex = new RegExp(`^${escapeGlob(directory)}(?:/.*)?$`);
    return regex.test(path);
  }

  if (!hasGlobMagic(normalized)) {
    return path === normalized || path.startsWith(`${normalized}/`);
  }

  const regex = new RegExp(`^${escapeGlob(normalized)}$`);
  return regex.test(path);
}

function stripLeadingDotSlash(value: string): string {
  return value.replace(/^\.\//, "");
}

function escapeGlob(glob: string): string {
  let source = "";
  for (let index = 0; index < glob.length; index += 1) {
    const char = glob[index];
    const next = glob[index + 1];
    if (char === "*" && next === "*") {
      if (glob[index + 2] === "/") {
        source += "(?:.*/)?";
        index += 2;
      } else {
        source += ".*";
        index += 1;
      }
    } else if (char === "*") {
      source += "[^/]*";
    } else if (char === "?") {
      source += "[^/]";
    } else if (char === "[") {
      const characterClass = readCharacterClass(glob, index);
      if (characterClass) {
        source += characterClass.source;
        index = characterClass.end;
      } else {
        source += "\\[";
      }
    } else {
      source += char.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
    }
  }
  return source;
}

function hasGlobMagic(glob: string): boolean {
  return glob.includes("*") || glob.includes("?") || glob.includes("[");
}

function readCharacterClass(glob: string, start: number): { source: string; end: number } | undefined {
  let end = start + 1;
  if (glob[end] === "!" || glob[end] === "^") {
    end += 1;
  }
  if (glob[end] === "]") {
    end += 1;
  }
  end = glob.indexOf("]", end);
  if (end === -1) {
    return undefined;
  }

  let body = glob.slice(start + 1, end);
  const negated = body.startsWith("!");
  if (negated) {
    body = body.slice(1);
  }
  body = body.replace(/\\/g, "\\\\").replace(/^\^/, "\\^");
  return { source: `[${negated ? "^" : ""}${body}]`, end };
}
