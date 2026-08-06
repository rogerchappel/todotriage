import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { matchesGlob } from "./glob.js";

export async function loadGitignore(root: string): Promise<string[]> {
  try {
    const body = await readFile(resolve(root, ".gitignore"), "utf8");
    return body
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export function isIgnored(path: string, patterns: string[]): boolean {
  let ignored = false;

  for (const pattern of patterns) {
    const negated = pattern.startsWith("!");
    const candidate = negated ? pattern.slice(1) : pattern;
    if (candidate.length > 0 && matchesGlob(path, normalizeGitignorePattern(candidate))) {
      ignored = !negated;
    }
  }

  return ignored;
}

export function hasNegatedPatterns(patterns: string[]): boolean {
  return patterns.some((pattern) => pattern.startsWith("!") && pattern.length > 1);
}

function normalizeGitignorePattern(pattern: string): string {
  const anchored = pattern.startsWith("/");
  const trimmed = pattern.replace(/^\//, "");
  const pathPart = trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
  if (!anchored && !pathPart.includes("/")) {
    return `**/${trimmed}`;
  }
  return trimmed;
}
