import { extname } from "node:path";

const fileTypeByExtension: Record<string, string> = {
  ".cjs": "javascript",
  ".css": "css",
  ".js": "javascript",
  ".json": "json",
  ".jsx": "javascript",
  ".md": "markdown",
  ".mjs": "javascript",
  ".sh": "shell",
  ".ts": "typescript",
  ".tsx": "typescript",
  ".yaml": "yaml",
  ".yml": "yaml"
};

export function detectFileType(file: string): string {
  return fileTypeByExtension[extname(file).toLowerCase()] ?? "text";
}
