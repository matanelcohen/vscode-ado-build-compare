import assert from "node:assert/strict";
import test from "node:test";
import { ComparisonResult } from "../src/models/comparison";
import { formatComparisonExport } from "../src/utils/exportFormatting";

const result: ComparisonResult = {
  baseBuild: { id: 1, buildNumber: "100" },
  targetBuild: { id: 2, buildNumber: "101" },
  commits: [
    {
      id: "abcdef123456",
      message: "Fix *checkout*",
      author: { displayName: "Ada" },
      files: [{ path: "/src/checkout.ts", changeType: "Edit" }],
    },
  ],
  pullRequests: [],
  directCommits: [],
  contributors: [{ displayName: "Ada" }],
  files: [{ path: "/src/checkout.ts", changeType: "Edit" }],
  pathFilters: [],
  warnings: [],
  risk: { score: 0, level: "low", signals: [] },
};

test("formats portable Markdown reports", () => {
  const output = formatComparisonExport(result, "markdown", "Ready to ship.");
  assert.match(output, /# Deployment comparison: 100 → 101/);
  assert.match(output, /Ready to ship/);
  assert.match(output, /Fix \\\*checkout\\\*/);
  assert.match(output, /Generated with \[Release Lens/);
});

test("formats machine-readable JSON reports", () => {
  const parsed = JSON.parse(
    formatComparisonExport(result, "json", "Ready to ship.")
  ) as { summary: string; risk: { level: string } };
  assert.equal(parsed.summary, "Ready to ship.");
  assert.equal(parsed.risk.level, "low");
});
