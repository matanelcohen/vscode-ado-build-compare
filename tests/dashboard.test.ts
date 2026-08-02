import assert from "node:assert/strict";
import test from "node:test";
import { buildDashboardRows } from "../src/models/dashboard";
import type { ComparisonHistoryEntry } from "../src/models/history";
import type { PipelineProfile } from "../src/models/profile";

const profile: PipelineProfile = {
  id: "production",
  name: "Production",
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
  config: {
    organizationUrl: "https://dev.azure.com/example",
    projectName: "Web",
    pipelineDefinitionId: 7,
    targetStageName: "Production",
    repositoryId: "repo",
    relevantPathFilter: "",
  },
};

const history: ComparisonHistoryEntry = {
  id: "comparison-1",
  profileId: profile.id,
  createdAt: "2025-01-02T00:00:00.000Z",
  summary: "One change",
  result: {
    baseBuild: { id: 1, buildNumber: "100" },
    targetBuild: { id: 2, buildNumber: "101" },
    commits: [],
    pullRequests: [],
    directCommits: [],
    contributors: [],
    files: [],
    pathFilters: [],
    warnings: [],
    risk: { score: 0, level: "low", signals: [] },
  },
};

test("shows guided setup when no profile is configured", () => {
  const rows = buildDashboardRows(
    { activeProfile: null, profiles: [] },
    [],
    false
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.command, "fe-ninja-tools.setupProfile");
});

test("builds actionable profile, Teams, and history dashboard rows", () => {
  const rows = buildDashboardRows(
    { activeProfile: profile, profiles: [profile] },
    [history],
    true
  );
  assert.deepEqual(
    rows.map((row) => row.id),
    [
      "active-profile",
      "open-comparison",
      "refresh",
      "teams",
      "history-comparison-1",
    ]
  );
  assert.equal(rows[3]?.label, "Teams connected");
  assert.deepEqual(rows[4]?.arguments, [history.result]);
});
