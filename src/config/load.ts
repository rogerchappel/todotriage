import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { defaultConfig } from "./defaults.js";
import type { Severity, TodoTriageConfig } from "../types.js";

const severities = new Set(["low", "medium", "high", "critical"]);

export async function loadConfig(root: string, explicitPath?: string): Promise<TodoTriageConfig> {
  const candidates = explicitPath ? [resolve(root, explicitPath)] : [resolve(root, ".todotriage.json")];
  let loaded: Partial<TodoTriageConfig> = {};

  for (const candidate of candidates) {
    try {
      loaded = JSON.parse(await readFile(candidate, "utf8")) as Partial<TodoTriageConfig>;
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT" || explicitPath) {
        throw new Error(`Unable to read config ${candidate}: ${(error as Error).message}`);
      }
    }
  }

  const severityOverrides = { ...defaultConfig.severityOverrides };
  for (const [marker, severity] of Object.entries(loaded.severityOverrides ?? {})) {
    if (!severities.has(severity)) {
      throw new Error(`Invalid severity override for ${marker}: ${severity}`);
    }
    severityOverrides[marker.toUpperCase()] = severity as Severity;
  }

  return {
    markers: normalizeMarkers(loaded.markers ?? defaultConfig.markers),
    ignoredPaths: [...defaultConfig.ignoredPaths, ...(loaded.ignoredPaths ?? [])],
    includeGlobs: loaded.includeGlobs ?? defaultConfig.includeGlobs,
    staleDays: loaded.staleDays ?? defaultConfig.staleDays,
    oldDays: loaded.oldDays ?? defaultConfig.oldDays,
    releaseRiskKeywords: loaded.releaseRiskKeywords ?? defaultConfig.releaseRiskKeywords,
    severityOverrides
  };
}

function normalizeMarkers(markers: string[]): string[] {
  const normalized = markers.map((marker) => marker.trim().toUpperCase()).filter(Boolean);
  return [...new Set(normalized)].sort();
}
