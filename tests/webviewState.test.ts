import assert from "node:assert/strict";
import test from "node:test";
import { readComparisonTab } from "../src/models/webviewState";

test("restores a valid comparison tab", () => {
  assert.equal(readComparisonTab({ selectedTab: "share" }), "share");
});

test("falls back to compare for missing or invalid state", () => {
  assert.equal(readComparisonTab(undefined), "compare");
  assert.equal(readComparisonTab({ selectedTab: "unknown" }), "compare");
});
