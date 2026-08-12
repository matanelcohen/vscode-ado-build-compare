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
  const result = comparison();
  const directCommit = {
    id: "abcdef1234567890",
    message: "Document deployment recovery",
    author: {
      displayName: "Grace Hopper",
      email: "grace@example.com",
    },
    files: [{ path: "/docs/recovery.md", changeType: "Add" }],
  };
  result.commits.push(directCommit);
  result.directCommits.push(directCommit);
  result.contributors.push(directCommit.author);

  const payload = buildTeamsWorkflowPayload({
    title: "Production release",
    comparison: result,
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
  assert.equal(
    payload.attachments[0]?.content.body.some((block) =>
      block.text?.includes("Created with")
    ),
    false
  );
  assert.ok(
    payload.attachments[0]?.content.body.some(
      (block) =>
        block.text?.includes("**<at>Ada Lovelace</at>**") &&
        block.text.includes("1. [PR #42]")
    )
  );
  assert.equal(
    payload.attachments[0]?.content.body.some(
      (block) => block.text === "<at>Ada Lovelace</at>"
    ),
    false
  );
  assert.ok(
    payload.attachments[0]?.content.body.some(
      (block) =>
        block.text?.includes("**Grace Hopper**") &&
        block.text.includes("1. `abcdef1` Document deployment recovery")
    )
  );
  assert.ok(
    payload.attachments[0]?.content.actions.some(
      (action) => action.title === "Get Release Lens"
    )
  );
});

test("includes every change in a Teams Workflow Adaptive Card", () => {
  const result = comparison();
  const sourceCommit = result.commits[0];
  assert.ok(sourceCommit);
  result.commits = Array.from({ length: 15 }, (_, index) => ({
    ...sourceCommit,
    id: String(index).padStart(16, "0"),
    message: `Change ${index + 1}`,
  }));

  const payload = buildTeamsWorkflowPayload({
    title: "Production release",
    comparison: result,
    mentions: [],
  }) as {
    attachments: Array<{
      content: {
        body: Array<{ text?: string }>;
      };
    }>;
  };
  const bodyText = payload.attachments[0]?.content.body
    .map((block) => block.text || "")
    .join("\n");

  for (let index = 1; index <= result.commits.length; index += 1) {
    assert.match(bodyText, new RegExp(`Change ${index}(?:\\n|$)`));
  }
  assert.doesNotMatch(bodyText, /more changes/);
});

test("generates readable plain-text output from typed results", () => {
  const output = generatePlainTextResults(comparison());
  assert.match(output, /2026\.10 -> 2026\.11/);
  assert.match(output, /PR #42: Add release telemetry — Ada Lovelace/);
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
