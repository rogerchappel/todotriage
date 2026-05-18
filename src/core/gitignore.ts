import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { matchesGlob } from "./glob.js";

export async function loadGitignore(root: string): Promise<string[]> {
  try {
    const body = await readFile(resolve(root, ".gitignore"), "utf8");
    return body
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#") && !line.startsWith("!"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export function isIgnored(path: string, patterns: string[]): boolean {
  return patterns.some((pattern) => matchesGlob(path, normalizeGitignorePattern(pattern)));
}

function normalizeGitignorePattern(pattern: string): string {
  const trimmed = pattern.replace(/^\//, "");
  if (trimmed.endsWith("/")) {
    return trimmed;
  }
  if (!trimmed.includes("/") && !trimmed.includes("*")) {
    return `**/${trimmed}`;
  }
  return trimmed;
}
