import type { PipelineRun } from "../api-sdk";
import type { GitReference } from "../models/comparison";
import type { ComparisonHistoryEntry } from "../models/history";
import type { PipelineProfile } from "../models/profile";
import { createDemoComparison } from "./demoComparison";

const DEMO_ORGANIZATION_URL = "https://dev.azure.com/example";

export const demoProfiles: PipelineProfile[] = [
  {
    id: "demo-production",
    name: "Storefront · Production",
    config: {
      organizationUrl: DEMO_ORGANIZATION_URL,
      projectName: "Commerce",
      pipelineDefinitionId: 42,
      targetStageName: "Production",
      repositoryId: "storefront",
      relevantPathFilter: "/src,/infra,/config",
    },
    createdAt: "2026-06-01T09:00:00.000Z",
    updatedAt: "2026-08-01T09:00:00.000Z",
  },
  {
    id: "demo-staging",
    name: "Storefront · Staging",
    config: {
      organizationUrl: DEMO_ORGANIZATION_URL,
      projectName: "Commerce",
      pipelineDefinitionId: 42,
      targetStageName: "Staging",
      repositoryId: "storefront",
    },
    createdAt: "2026-06-01T09:00:00.000Z",
    updatedAt: "2026-07-20T09:00:00.000Z",
  },
];

export const demoActiveProfileId = "demo-production";

function createRun(
  id: number,
  buildNumber: string,
  sourceVersion: string,
  finishTime: string,
  commitMessage: string
): PipelineRun {
  return {
    id,
    buildNumber,
    sourceVersion,
    finishTime,
    startTime: finishTime,
    queueTime: finishTime,
    commitMessage,
    status: "completed",
    result: "succeeded",
    sourceBranch: "refs/heads/main",
    url: `${DEMO_ORGANIZATION_URL}/Commerce/_build/results?buildId=${id}`,
    _links: {
      web: {
        href: `${DEMO_ORGANIZATION_URL}/Commerce/_build/results?buildId=${id}`,
      },
    },
    definition: {
      id: 42,
      name: "storefront-ci",
      url: `${DEMO_ORGANIZATION_URL}/Commerce/_build?definitionId=42`,
    },
    requestedBy: {
      displayName: "Release Bot",
      id: "release-bot",
      uniqueName: "release-bot@example.com",
    },
  };
}

/** The most recent run that reached the target stage in the sample data. */
export const demoDeployedRun = createRun(
  1041,
  "2026.08.01.4",
  "9900aa11bb22cc33",
  "2026-08-01T07:45:00.000Z",
  "Bump storefront dependencies"
);

export const demoBuilds: PipelineRun[] = [
  createRun(
    1044,
    "2026.08.02.3",
    "ee05ff06aa07bb08",
    "2026-08-02T16:10:00.000Z",
    "Add telemetry for checkout retries"
  ),
  createRun(
    1043,
    "2026.08.02.2",
    "dd04ee05ff06aa07",
    "2026-08-02T12:20:00.000Z",
    "Tune payment worker autoscale rules"
  ),
  createRun(
    1042,
    "2026.08.02.1",
    "cc03dd04ee05ff06",
    "2026-08-02T09:05:00.000Z",
    "Update payment provider timeout"
  ),
  demoDeployedRun,
];

export const demoGitReferences: GitReference[] = [
  {
    name: "refs/heads/main",
    displayName: "main",
    kind: "branch",
    commitId: "ee05ff06aa07bb08",
  },
  {
    name: "refs/heads/release/2026.08",
    displayName: "release/2026.08",
    kind: "branch",
    commitId: "cc03dd04ee05ff06",
  },
  {
    name: "refs/tags/v4.2.0",
    displayName: "v4.2.0",
    kind: "tag",
    commitId: "9900aa11bb22cc33",
  },
];

export function createDemoHistory(): ComparisonHistoryEntry[] {
  return [
    {
      id: "demo-history-1",
      profileId: demoActiveProfileId,
      createdAt: "2026-08-02T09:30:00.000Z",
      summary: "2026.08.01.4 → 2026.08.02.1 · medium risk · 3 commits",
      result: createDemoComparison(),
    },
  ];
}

export const demoAiSummary = [
  "## Release summary (sample)",
  "",
  "This release hardens checkout payments and scales the payment workers ahead of seasonal traffic.",
  "",
  "- Checkout payment confirmation now retries with bounded backoff (PR #1842).",
  "- Payment worker capacity was increased for seasonal load (PR #1847).",
  "- Production configuration changed the payment provider timeout without a pull request.",
  "",
  "**Risk: medium.** Infrastructure and production configuration changed together, and one change bypassed pull request review.",
].join("\n");
