import { access, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const presets: Record<string, object> = {
  default: {
    markers: ["TODO", "FIXME", "HACK", "XXX"],
    ignoredPaths: ["dist/", "coverage/"],
    staleDays: 180,
    oldDays: 365
  },
  "oss-cli": {
    markers: ["TODO", "FIXME", "HACK", "XXX"],
    ignoredPaths: ["dist/", "coverage/", "examples/output/"],
    staleDays: 120,
    oldDays: 365,
    releaseRiskKeywords: ["security", "release", "breaking", "auth", "migration"]
  }
};

export async function initConfig(cwd: string, preset: string): Promise<string> {
  const selected = presets[preset] ?? presets.default;
  const path = resolve(cwd, ".todotriage.json");
  try {
    await access(path);
    throw new Error(".todotriage.json already exists");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  await writeFile(path, JSON.stringify(selected, null, 2) + "\n", "utf8");
  return path;
}
