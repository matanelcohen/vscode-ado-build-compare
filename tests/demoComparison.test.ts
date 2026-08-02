import assert from "node:assert/strict";
import test from "node:test";
import { createDemoComparison } from "../src/demo/demoComparison";

test("creates a complete, synthetic release comparison", () => {
  const result = createDemoComparison();

  assert.equal(result.commits.length, 3);
  assert.equal(result.pullRequests.length, 2);
  assert.equal(result.directCommits.length, 1);
  assert.equal(result.files.length, 4);
  assert.equal(result.contributors.length, 3);
  assert.equal(result.risk.level, "medium");
  assert.ok(result.risk.signals.length >= 3);
  assert.ok(result.analysis);
  assert.ok(result.analysis.totalCommits > result.commits.length);

  const serialized = JSON.stringify(result);
  assert.doesNotMatch(serialized, /matancohen|microsoft\.com/i);
  assert.match(serialized, /dev\.azure\.com\/example/);
});
