import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { ScanOptions, ScanReport, TodoFinding } from "../types.js";
import { loadConfig } from "../config/load.js";
import { readGitBlame } from "../git/blame.js";
import { extractTodoComments } from "../parser/comments.js";
import { findNearbyContext } from "../parser/context.js";
import { extractIssueLinks, extractPriorityTag, hasReleaseRisk } from "../parser/metadata.js";
import { detectFileType } from "./file-type.js";
import { relativePosix, stableId } from "./path-utils.js";
import { scoreFinding, sortFindings } from "./severity.js";
import { buildReport } from "./summary.js";
import { walkFiles } from "./walk.js";

export async function scanProject(options: ScanOptions): Promise<ScanReport> {
  const root = resolve(options.cwd, options.root);
  const config = await loadConfig(root, options.configPath);
  const files = await walkFiles(root, config);
  const findings: TodoFinding[] = [];

  for (const absolutePath of files) {
    const file = relativePosix(root, absolutePath);
    const source = await readFile(absolutePath, "utf8");
    const fileType = detectFileType(file);
    const comments = extractTodoComments(source, config.markers);

    for (const comment of comments) {
      const priorityTag = extractPriorityTag(comment.text);
      const releaseRisk = hasReleaseRisk(comment.text, config.releaseRiskKeywords);
      const git = options.noGit ? null : await readGitBlame(root, file, comment.line);
      const scored = scoreFinding(
        comment.marker,
        comment.text,
        priorityTag,
        releaseRisk,
        git?.ageDays ?? null,
        config
      );

      findings.push({
        id: stableId(file, comment.line, comment.marker, comment.text),
        marker: comment.marker,
        file,
        line: comment.line,
        column: comment.column,
        text: comment.text,
        context: findNearbyContext(source, comment.line, fileType),
        fileType,
        priorityTag,
        issueLinks: extractIssueLinks(comment.text),
        releaseRisk,
        git,
        ...scored
      });
    }
  }

  return buildReport(root, sortFindings(findings), options.failOn ?? null);
}
