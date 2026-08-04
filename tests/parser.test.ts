import assert from "node:assert/strict";
import test from "node:test";
import { extractTodoComments } from "../src/parser/comments.js";
import { findNearbyContext } from "../src/parser/context.js";
import { extractIssueLinks, extractPriorityTag, hasReleaseRisk } from "../src/parser/metadata.js";

test("extracts configured markers with tags", () => {
  const comments = extractTodoComments("// TODO(owner:docs): write guide\n// NOTE: ignore", ["TODO"], "typescript");
  assert.equal(comments.length, 1);
  assert.equal(comments[0]?.marker, "TODO");
  assert.equal(comments[0]?.text, "[owner:docs] write guide");
});

test("only extracts complete markers from JavaScript comments", () => {
  const source = [
    'const first = "TODO ship this";',
    'const second = "TODOUBLE";',
    "// TODO genuine line comment",
    "/* FIXME genuine block comment */",
    "const suffix = 1; // TODOUBLE is not a marker"
  ].join("\n");
  const comments = extractTodoComments(source, ["TODO", "FIXME"], "typescript");
  assert.deepEqual(comments.map(({ marker, line, text }) => ({ marker, line, text })), [
    { marker: "TODO", line: 3, text: "genuine line comment" },
    { marker: "FIXME", line: 4, text: "genuine block comment" }
  ]);
});

test("extracts markers from multiline block comments", () => {
  const comments = extractTodoComments("/* context\n * TODO: follow up\n */", ["TODO"], "javascript");
  assert.equal(comments.length, 1);
  assert.equal(comments[0]?.line, 2);
  assert.equal(comments[0]?.text, "follow up");
});

test("preserves document-wide Markdown marker scanning", () => {
  const comments = extractTodoComments("## Work\nTODO: document release", ["TODO"], "markdown");
  assert.equal(comments[0]?.text, "document release");
});

test("only extracts shell markers from unquoted comments", () => {
  const source = 'value="TODO string"\n# TODO genuine shell comment\nprintf "%s" "# FIXME string"\n';
  const comments = extractTodoComments(source, ["TODO", "FIXME"], "shell");
  assert.deepEqual(comments.map(({ marker, line, text }) => ({ marker, line, text })), [
    { marker: "TODO", line: 2, text: "genuine shell comment" }
  ]);
});

test("extracts nearby markdown heading", () => {
  const source = "# Title\n\n## Deploy\n\nTODO: document rollback";
  assert.equal(findNearbyContext(source, 5, "markdown"), "Deploy");
});

test("extracts priority, links, and release risk", () => {
  const text = "[p1] release auth issue #42";
  assert.equal(extractPriorityTag(text), "p1");
  assert.deepEqual(extractIssueLinks(text), ["#42"]);
  assert.equal(hasReleaseRisk(text, ["release"]), true);
});
