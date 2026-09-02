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

test("ignores comment delimiters inside JavaScript regular expressions", () => {
  const lines = [
    "const slash = /[//] TODO regex text/; // TODO genuine line comment",
    "const block = /\\/* FIXME regex text \\*\\//; /* FIXME genuine block comment */",
    "const escaped = /https?:\\/\\/example\\.test\\/TODO/; // HACK adjacent comment"
  ];
  const comments = extractTodoComments(lines.join("\n"), ["TODO", "FIXME", "HACK"], "typescript");
  assert.deepEqual(comments.map(({ marker, line, column, text }) => ({ marker, line, column, text })), [
    { marker: "TODO", line: 1, column: lines[0].indexOf("TODO genuine") + 1, text: "genuine line comment" },
    { marker: "FIXME", line: 2, column: lines[1].indexOf("FIXME genuine") + 1, text: "genuine block comment" },
    { marker: "HACK", line: 3, column: lines[2].indexOf("HACK adjacent") + 1, text: "adjacent comment" }
  ]);
});

test("does not mistake division followed by a real comment for a regex", () => {
  const source = "const ratio = total / count; // TODO verify empty input";
  assert.deepEqual(extractTodoComments(source, ["TODO"], "javascript"), [
    { marker: "TODO", line: 1, column: source.indexOf("TODO") + 1, text: "verify empty input" }
  ]);
});

test("extracts markers from multiline block comments", () => {
  const comments = extractTodoComments("/* context\n * TODO: follow up\n */", ["TODO"], "javascript");
  assert.equal(comments.length, 1);
  assert.equal(comments[0]?.line, 2);
  assert.equal(comments[0]?.text, "follow up");
});

test("ignores comment-like text inside multiline template literals", () => {
  const source = [
    "const docs = `first line",
    "// TODO: template content",
    "/* FIXME: more template content */",
    "last line`;",
    "// TODO: genuine comment"
  ].join("\n");
  const comments = extractTodoComments(source, ["TODO", "FIXME"], "typescript");
  assert.deepEqual(comments.map(({ marker, line, text }) => ({ marker, line, text })), [
    { marker: "TODO", line: 5, text: "genuine comment" }
  ]);
});

test("extracts comments following a multiline template on its closing line", () => {
  const source = "const value = `line one\n// TODO: template content\nline three`; // FIXME: genuine comment";
  const comments = extractTodoComments(source, ["TODO", "FIXME"], "javascript");
  assert.deepEqual(comments.map(({ marker, line, text }) => ({ marker, line, text })), [
    { marker: "FIXME", line: 3, text: "genuine comment" }
  ]);
});

test("extracts comments from single-line template interpolation expressions", () => {
  const source = "const value = `text ${(() => { /* TODO: interpolation work */ return 1; })()} // FIXME template text`;";
  const comments = extractTodoComments(source, ["TODO", "FIXME"], "typescript");
  assert.deepEqual(comments, [
    { marker: "TODO", line: 1, column: source.indexOf("TODO") + 1, text: "interpolation work" }
  ]);
});

test("tracks multiline nested and braced template interpolation expressions", () => {
  const lines = [
    "const value = `ignored // TODO template text ${",
    "  ({ outer: { value: `nested ${(() => {",
    "    // FIXME: nested interpolation work",
    "    return { depth: 1 };",
    "  })()}` } }) /* HACK: outer interpolation work */",
    "} ignored /* XXX template text */`;"
  ];
  const comments = extractTodoComments(lines.join("\n"), ["TODO", "FIXME", "HACK", "XXX"], "javascript");
  assert.deepEqual(comments, [
    { marker: "FIXME", line: 3, column: lines[2].indexOf("FIXME") + 1, text: "nested interpolation work" },
    { marker: "HACK", line: 5, column: lines[4].indexOf("HACK") + 1, text: "outer interpolation work" }
  ]);
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
