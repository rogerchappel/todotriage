import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { GitBlameInfo } from "../types.js";

const execFileAsync = promisify(execFile);

export async function readGitBlame(root: string, file: string, line: number): Promise<GitBlameInfo | null> {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["-C", root, "blame", "--line-porcelain", "-L" + line + "," + line, "--", file],
      { timeout: 2500, maxBuffer: 64 * 1024 }
    );

    const author = valueFor(stdout, "author") ?? "unknown";
    const authorTime = valueFor(stdout, "author-time");
    if (!authorTime) {
      return null;
    }

    const date = new Date(Number(authorTime) * 1000);
    const ageDays = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
    return {
      author,
      authorTime: date.toISOString(),
      ageDays
    };
  } catch {
    return null;
  }
}

function valueFor(stdout: string, key: string): string | null {
  const line = stdout.split(/\r?\n/).find((entry) => entry.startsWith(key + " "));
  return line ? line.slice(key.length + 1).trim() : null;
}
