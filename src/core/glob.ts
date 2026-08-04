export function matchesAnyGlob(path: string, globs: string[]): boolean {
  return globs.some((glob) => matchesGlob(path, glob));
}

export function matchesGlob(path: string, glob: string): boolean {
  const normalized = stripLeadingDotSlash(glob);
  if (normalized.endsWith("/")) {
    return path === normalized.slice(0, -1) || path.startsWith(normalized);
  }

  if (!normalized.includes("*")) {
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
    } else {
      source += char.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
    }
  }
  return source;
}
