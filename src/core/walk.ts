import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { TodoTriageConfig } from "../types.js";
import { matchesAnyGlob } from "./glob.js";
import { hasNegatedPatterns, isIgnored, loadGitignore } from "./gitignore.js";
import { relativePosix } from "./path-utils.js";

export async function walkFiles(root: string, config: TodoTriageConfig): Promise<string[]> {
  const gitignore = await loadGitignore(root);
  const canReinclude = hasNegatedPatterns(gitignore);
  const files: string[] = [];

  async function visit(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const absolute = join(directory, entry.name);
      const relative = relativePosix(root, absolute);
      const configIgnored = isIgnored(relative, config.ignoredPaths);
      const gitIgnored = isIgnored(relative, gitignore);

      if (entry.isDirectory()) {
        if (configIgnored || (gitIgnored && !canReinclude)) {
          continue;
        }
        await visit(absolute);
      } else if (
        entry.isFile() &&
        !configIgnored &&
        !gitIgnored &&
        matchesAnyGlob(relative, config.includeGlobs)
      ) {
        files.push(absolute);
      }
    }
  }

  await visit(root);
  return files.sort((a, b) => relativePosix(root, a).localeCompare(relativePosix(root, b)));
}
