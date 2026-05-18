import type { TodoTriageConfig } from "../types.js";

export const defaultConfig: TodoTriageConfig = {
  markers: ["TODO", "FIXME", "HACK", "XXX"],
  ignoredPaths: [
    ".git/",
    "node_modules/",
    "dist/",
    "coverage/",
    ".next/",
    "vendor/",
    "examples/output/"
  ],
  includeGlobs: [
    "**/*.cjs",
    "**/*.css",
    "**/*.js",
    "**/*.json",
    "**/*.jsx",
    "**/*.md",
    "**/*.mjs",
    "**/*.sh",
    "**/*.ts",
    "**/*.tsx",
    "**/*.yaml",
    "**/*.yml"
  ],
  staleDays: 180,
  oldDays: 365,
  releaseRiskKeywords: [
    "security",
    "release",
    "migration",
    "schema",
    "auth",
    "data loss",
    "breaking",
    "prod",
    "production"
  ],
  severityOverrides: {
    FIXME: "high",
    HACK: "medium",
    TODO: "low",
    XXX: "high"
  }
};
