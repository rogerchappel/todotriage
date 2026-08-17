import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { defaultConfig } from "./defaults.js";
import type { Severity, TodoTriageConfig } from "../types.js";

const severities = new Set(["low", "medium", "high", "critical"]);
const stringArrayFields = ["markers", "ignoredPaths", "includeGlobs", "releaseRiskKeywords"] as const;

export async function loadConfig(root: string, explicitPath?: string): Promise<TodoTriageConfig> {
  const candidates = explicitPath ? [resolve(root, explicitPath)] : [resolve(root, ".todotriage.json")];
  let loaded: Partial<TodoTriageConfig> = {};

  for (const candidate of candidates) {
    try {
      loaded = validateConfig(JSON.parse(await readFile(candidate, "utf8")), candidate);
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

function validateConfig(value: unknown, path: string): Partial<TodoTriageConfig> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Invalid config ${path}: root must be a JSON object`);
  }

  const config = value as Record<string, unknown>;
  for (const field of stringArrayFields) {
    const fieldValue = config[field];
    if (fieldValue === undefined) continue;
    if (!Array.isArray(fieldValue)) {
      throw new Error(`Invalid config ${path}: ${field} must be an array of strings`);
    }
    const invalidIndex = fieldValue.findIndex((item) => typeof item !== "string");
    if (invalidIndex !== -1) {
      throw new Error(`Invalid config ${path}: ${field}[${invalidIndex}] must be a string`);
    }
  }

  for (const field of ["staleDays", "oldDays"] as const) {
    const fieldValue = config[field];
    if (fieldValue !== undefined &&
        (typeof fieldValue !== "number" || !Number.isFinite(fieldValue) || fieldValue < 0)) {
      throw new Error(`Invalid config ${path}: ${field} must be a finite non-negative number`);
    }
  }

  const staleDays = (config.staleDays as number | undefined) ?? defaultConfig.staleDays;
  const oldDays = (config.oldDays as number | undefined) ?? defaultConfig.oldDays;
  if (staleDays > oldDays) {
    throw new Error(`Invalid config ${path}: staleDays (${staleDays}) must not exceed oldDays (${oldDays})`);
  }

  const overrides = config.severityOverrides;
  if (overrides !== undefined) {
    if (overrides === null || typeof overrides !== "object" || Array.isArray(overrides)) {
      throw new Error(`Invalid config ${path}: severityOverrides must be an object`);
    }
    for (const [marker, severity] of Object.entries(overrides)) {
      if (typeof severity !== "string" || !severities.has(severity)) {
        throw new Error(
          `Invalid config ${path}: severityOverrides.${marker} must be one of low, medium, high, critical`
        );
      }
    }
  }

  return config as Partial<TodoTriageConfig>;
}

function normalizeMarkers(markers: string[]): string[] {
  const normalized = markers.map((marker) => marker.trim().toUpperCase()).filter(Boolean);
  return [...new Set(normalized)].sort();
}
