import assert from "node:assert/strict";
import test from "node:test";
import { extractTodoComments } from "../src/parser/comments.js";
import { findNearbyContext } from "../src/parser/context.js";
import { extractIssueLinks, extractPriorityTag, hasReleaseRisk } from "../src/parser/metadata.js";

test("extracts configured markers with tags", () => {
  const comments = extractTodoComments("// TODO(owner:docs): write guide\n// NOTE: ignore", ["TODO"]);
  assert.equal(comments.length, 1);
  assert.equal(comments[0]?.marker, "TODO");
  assert.equal(comments[0]?.text, "[owner:docs] write guide");
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
