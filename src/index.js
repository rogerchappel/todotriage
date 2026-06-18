"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const DEFAULT_CONFIG = {
  markers: ["TODO", "FIXME", "HACK", "XXX"],
  ignore: ["node_modules", ".git", "tmp", "coverage", "dist"],
  highRiskWords: ["security", "release", "migration", "data loss", "auth", "credential"],
  mediumRiskWords: ["refactor", "cleanup", "temporary", "perf", "test"],
  extensions: [".js", ".ts", ".tsx", ".jsx", ".md", ".mjs", ".cjs", ".json", ".yml", ".yaml", ".sh"]
};

function severityRank(severity) {
  return { low: 1, medium: 2, high: 3 }[String(severity).toLowerCase()] || 0;
}

async function loadConfig(root) {
  try {
    const text = await fs.readFile(path.join(root, ".todotriage.json"), "utf8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(text) };
  } catch (error) {
    if (error.code === "ENOENT") return DEFAULT_CONFIG;
    throw error;
  }
}

function shouldIgnore(relativePath, config) {
  return config.ignore.some((entry) => relativePath === entry || relativePath.startsWith(`${entry}/`) || relativePath.includes(`/${entry}/`));
}

async function walk(root, config, prefix = "") {
  const entries = await fs.readdir(path.join(root, prefix), { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = path.join(prefix, entry.name);
    if (shouldIgnore(relative, config)) continue;
    if (entry.isDirectory()) {
      files.push(...await walk(root, config, relative));
    } else if (config.extensions.includes(path.extname(entry.name))) {
      files.push(relative);
    }
  }
  return files;
}

function nearbyContext(lines, index) {
  for (let cursor = index; cursor >= Math.max(0, index - 12); cursor -= 1) {
    const line = lines[cursor].trim();
    if (/^#+\s+/.test(line)) return line.replace(/^#+\s+/, "");
    const fn = line.match(/(?:function|const|let|var)\s+([A-Za-z0-9_$-]+)/);
    if (fn) return fn[1];
  }
  return "file scope";
}

function classify(text, marker, config) {
  const lower = text.toLowerCase();
  if (marker === "FIXME" || config.highRiskWords.some((word) => lower.includes(word))) return "high";
  if (marker === "HACK" || config.mediumRiskWords.some((word) => lower.includes(word))) return "medium";
  return "low";
}

function remediation(severity) {
  if (severity === "high") return "Resolve before release or document an explicit acceptance decision.";
  if (severity === "medium") return "Schedule in the next maintenance pass and add owner context.";
  return "Keep visible; convert to an issue if it survives another release.";
}

function scanText(relativePath, text, config) {
  const markerPattern = new RegExp(`\\b(${config.markers.map(escapeRegExp).join("|")})\\b[:\\s-]*(.*)$`, "i");
  const lines = text.split(/\r?\n/);
  const findings = [];
  lines.forEach((line, index) => {
    const match = line.match(markerPattern);
    if (!match) return;
    const marker = match[1].toUpperCase();
    const note = match[2].trim() || line.trim();
    const severity = classify(note, marker, config);
    findings.push({
      id: `${relativePath}:${index + 1}`,
      file: relativePath,
      line: index + 1,
      marker,
      note,
      context: nearbyContext(lines, index),
      severity,
      remediation: remediation(severity)
    });
  });
  return findings;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function scanProject(root) {
  const absolute = path.resolve(root);
  const config = await loadConfig(absolute);
  const files = await walk(absolute, config);
  const findings = [];
  for (const file of files) {
    const text = await fs.readFile(path.join(absolute, file), "utf8");
    findings.push(...scanText(file, text, config));
  }
  findings.sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || a.file.localeCompare(b.file) || a.line - b.line);
  return {
    schema: "todotriage.report.v1",
    scannedAt: new Date().toISOString(),
    root: absolute,
    totals: {
      files: files.length,
      findings: findings.length,
      high: findings.filter((item) => item.severity === "high").length,
      medium: findings.filter((item) => item.severity === "medium").length,
      low: findings.filter((item) => item.severity === "low").length
    },
    findings
  };
}

function renderMarkdown(report) {
  const lines = [
    "# TODO Triage Report",
    "",
    `Scanned: ${report.scannedAt}`,
    `Findings: ${report.totals.findings} (${report.totals.high} high, ${report.totals.medium} medium, ${report.totals.low} low)`,
    "",
    "| Severity | Location | Marker | Context | Note |",
    "|---|---|---|---|---|"
  ];
  for (const finding of report.findings) {
    lines.push(`| ${finding.severity} | \`${finding.file}:${finding.line}\` | ${finding.marker} | ${escapeCell(finding.context)} | ${escapeCell(finding.note)} |`);
  }
  lines.push("", "## Remediation Queue", "");
  for (const finding of report.findings) {
    lines.push(`- ${finding.severity}: \`${finding.file}:${finding.line}\` - ${finding.remediation}`);
  }
  return `${lines.join("\n")}\n`;
}

function escapeCell(value) {
  return String(value).replace(/\|/g, "\\|");
}

function renderReport(report, options = {}) {
  if (options.format === "json") return `${JSON.stringify(report, null, 2)}\n`;
  return renderMarkdown(report);
}

async function writeReport(outputPath, content) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, content);
}

async function initConfig(options = {}) {
  const config = {
    markers: DEFAULT_CONFIG.markers,
    ignore: DEFAULT_CONFIG.ignore,
    highRiskWords: DEFAULT_CONFIG.highRiskWords,
    mediumRiskWords: DEFAULT_CONFIG.mediumRiskWords,
    preset: options.preset || "oss-cli"
  };
  const output = ".todotriage.json";
  await fs.writeFile(output, `${JSON.stringify(config, null, 2)}\n`);
  return output;
}

module.exports = {
  DEFAULT_CONFIG,
  initConfig,
  renderReport,
  scanProject,
  scanText,
  severityRank,
  writeReport
};
