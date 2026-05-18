import type { ScanReport } from "../types.js";
import { renderJson } from "./json.js";
import { renderMarkdown } from "./markdown.js";

export function renderReport(report: ScanReport, format: "markdown" | "json"): string {
  return format === "json" ? renderJson(report) : renderMarkdown(report);
}
