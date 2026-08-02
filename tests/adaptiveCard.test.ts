import assert from "node:assert/strict";
import test from "node:test";
import { ComparisonResult } from "../src/models/comparison";
import {
  buildTeamsWorkflowPayload,
  isLikelyTeamsUpn,
  isSupportedTeamsMentionId,
} from "../src/teams/adaptiveCard";
import { generatePlainTextResults } from "../src/utils/generatePlainTextResults";

function comparison(): ComparisonResult {
  const pullRequest = {
    id: 42,
    title: "Add release telemetry",
    url: "https://dev.azure.com/example/project/_git/repo/pullrequest/42",
    createdBy: {
      displayName: "Ada Lovelace",
      email: "ada@example.com",
    },
    reviewers: [],
    workItemCount: 1,
  };
  const commit = {
    id: "1234567890abcdef",
    message: "Merged PR 42: Add release telemetry",
    author: {
      displayName: "Ada Lovelace",
      email: "ada@example.com",
    },
    files: [{ path: "/src/telemetry.ts", changeType: "Add" }],
    pullRequest,
  };
  return {
    baseBuild: { id: 10, buildNumber: "2026.10" },
    targetBuild: {
      id: 11,
      buildNumber: "2026.11",
      _links: { web: { href: "https://dev.azure.com/build/11" } },
    },
    commits: [commit],
    pullRequests: [pullRequest],
    directCommits: [],
    contributors: [commit.author],
    files: commit.files,
    pathFilters: ["/src"],
    warnings: [],
    risk: { score: 0, level: "low", signals: [] },
  };
}

test("builds a Teams Workflow Adaptive Card with deduplicated mentions", () => {
  const payload = buildTeamsWorkflowPayload({
    title: "Production release",
    comparison: comparison(),
    mentions: [
      { displayName: "Ada Lovelace", userId: "ada@example.com" },
      { displayName: "Ada Lovelace", userId: "ADA@example.com" },
    ],
  }) as {
    type: string;
    attachments: Array<{
      contentType: string;
      contentUrl: null;
      content: {
        type: string;
        version: string;
        body: Array<{ text?: string }>;
        actions: Array<{ title: string; url: string }>;
        msteams: { entities: Array<{ mentioned: { id: string } }> };
      };
    }>;
  };

  assert.equal(payload.type, "message");
  assert.equal(
    payload.attachments[0]?.contentType,
    "application/vnd.microsoft.card.adaptive"
  );
  assert.equal(payload.attachments[0]?.contentUrl, null);
  assert.equal(payload.attachments[0]?.content.type, "AdaptiveCard");
  assert.equal(payload.attachments[0]?.content.version, "1.5");
  assert.deepEqual(
    payload.attachments[0]?.content.msteams.entities.map(
      (entity) => entity.mentioned.id
    ),
    ["ADA@example.com"]
  );
  assert.ok(
    payload.attachments[0]?.content.body.some((block) =>
      block.text?.includes("<at>Ada Lovelace</at>")
    )
  );
  assert.ok(
    payload.attachments[0]?.content.body.some((block) =>
      block.text?.includes("ReleaseLens")
    )
  );
  assert.ok(
    payload.attachments[0]?.content.actions.some(
      (action) => action.title === "Get ReleaseLens"
    )
  );
});

test("generates readable plain-text output from typed results", () => {
  const output = generatePlainTextResults(comparison());
  assert.match(output, /2026\.10 -> 2026\.11/);
  assert.match(output, /PR #42: Add release telemetry/);
  assert.match(output, /1 pull requests \| 1 commits \| 1 files/);
});

test("accepts documented Teams identities and rejects arbitrary ADO IDs", () => {
  assert.equal(isLikelyTeamsUpn("ada@example.com"), true);
  assert.equal(isLikelyTeamsUpn("ada"), false);
  assert.equal(
    isSupportedTeamsMentionId("87d349ed-44d7-43e1-9a83-5f2406dee5bd"),
    true
  );
  assert.equal(isSupportedTeamsMentionId("29:teams-user-id"), true);
  assert.equal(isSupportedTeamsMentionId("ado-identity-id"), false);
});
