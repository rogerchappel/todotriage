import { relative, sep } from "node:path";

export function toPosixPath(path: string): string {
  return path.split(sep).join("/");
}

export function relativePosix(root: string, filePath: string): string {
  return toPosixPath(relative(root, filePath));
}

export function isSubPath(relativePath: string): boolean {
  return relativePath !== "" && !relativePath.startsWith("..") && !relativePath.startsWith("/");
}

export function stableId(file: string, line: number, marker: string, text: string): string {
  const seed = `${file}:${line}:${marker}:${text}`;
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `tt-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
