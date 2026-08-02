import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzeReleaseRisk,
  buildAiSummaryPrompt,
  generateDeterministicSummary,
} from "../src/utils/riskAnalysis";

test("raises risk for sensitive files and direct commits", () => {
  const risk = analyzeReleaseRisk({
    files: [
      { path: "/db/migrations/001.sql", changeType: "Add" },
      { path: "/infra/main.bicep", changeType: "Edit" },
      { path: "/src/auth/token.ts", changeType: "Edit" },
    ],
    commits: [],
    directCommits: [
      {
        id: "abc",
        message: "hotfix",
        author: { displayName: "Ada" },
        files: [],
      },
    ],
    warnings: [],
  });

  assert.equal(risk.level, "critical");
  assert.ok(risk.score >= 50);
  assert.deepEqual(
    risk.signals.map((signal) => signal.id),
    ["database", "security", "infrastructure", "direct-commits"]
  );
});

test("builds a bounded AI prompt from comparison metadata", () => {
  const prompt = buildAiSummaryPrompt({
    baseBuild: { id: 1, buildNumber: "1" },
    targetBuild: { id: 2, buildNumber: "2" },
    commits: [],
    pullRequests: [],
    directCommits: [],
    contributors: [],
    files: [],
    pathFilters: [],
    warnings: [],
    risk: { score: 0, level: "low", signals: [] },
  });
  assert.match(prompt, /Do not invent facts/);
  assert.match(prompt, /"from":"1"/);
});

test("produces a concise deterministic release summary", () => {
  const summary = generateDeterministicSummary({
    pullRequests: [],
    commits: [],
    files: [],
    contributors: [],
    risk: { score: 0, level: "low", signals: [] },
  });
  assert.match(summary, /Release risk is low/);
});
