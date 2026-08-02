import type {
  ComparedCommit,
  ComparisonResult,
} from "../models/comparison";

export function createDemoComparison(): ComparisonResult {
  const checkoutPr = {
    id: 1842,
    title: "Add resilient checkout retries",
    url: "https://dev.azure.com/example/Commerce/_git/storefront/pullrequest/1842",
    createdBy: {
      displayName: "Ada Lovelace",
      email: "ada@example.com",
    },
    reviewers: [{ displayName: "Grace Hopper", email: "grace@example.com" }],
    workItemCount: 2,
  };
  const infrastructurePr = {
    id: 1847,
    title: "Scale production payment workers",
    url: "https://dev.azure.com/example/Commerce/_git/storefront/pullrequest/1847",
    createdBy: {
      displayName: "Lin Chen",
      email: "lin@example.com",
    },
    reviewers: [{ displayName: "Ada Lovelace", email: "ada@example.com" }],
    workItemCount: 1,
  };
  const directCommit: ComparedCommit = {
    id: "cc03dd04ee05ff06",
    message: "Update payment provider timeout",
    author: { displayName: "Sam Rivera", email: "sam@example.com" },
    committedAt: "2026-08-01T13:05:00.000Z",
    files: [{ path: "/config/production.json", changeType: "Edit" }],
  };
  const commits: ComparedCommit[] = [
    {
      id: "aa01bb02cc03dd04",
      message: "Add bounded retries to checkout payment confirmation",
      author: checkoutPr.createdBy,
      committedAt: "2026-08-01T09:15:00.000Z",
      files: [
        { path: "/src/checkout/payment.ts", changeType: "Edit" },
        { path: "/src/checkout/payment.test.ts", changeType: "Edit" },
      ],
      pullRequest: checkoutPr,
    },
    {
      id: "bb02cc03dd04ee05",
      message: "Scale payment workers for seasonal traffic",
      author: infrastructurePr.createdBy,
      committedAt: "2026-08-01T11:30:00.000Z",
      files: [
        { path: "/infra/payment-workers.bicep", changeType: "Edit" },
        { path: "/config/production.json", changeType: "Edit" },
      ],
      pullRequest: infrastructurePr,
    },
    directCommit,
  ];
  const files = [
    { path: "/config/production.json", changeType: "Edit" },
    { path: "/infra/payment-workers.bicep", changeType: "Edit" },
    { path: "/src/checkout/payment.test.ts", changeType: "Edit" },
    { path: "/src/checkout/payment.ts", changeType: "Edit" },
  ];

  return {
    baseBuild: {
      id: 1041,
      buildNumber: "2026.08.01.4",
      sourceVersion: "9900aa11bb22cc33",
    },
    targetBuild: {
      id: 1042,
      buildNumber: "2026.08.02.1",
      sourceVersion: "cc03dd04ee05ff06",
      _links: { web: { href: "https://dev.azure.com/example/build/1042" } },
    },
    commits,
    pullRequests: [checkoutPr, infrastructurePr],
    directCommits: [directCommit],
    contributors: [
      checkoutPr.createdBy,
      infrastructurePr.createdBy,
      directCommit.author,
    ],
    files,
    pathFilters: ["/src", "/infra", "/config"],
    warnings: [],
    risk: {
      score: 38,
      level: "medium",
      signals: [
        {
          id: "infrastructure",
          label: "Infrastructure",
          description: "Production infrastructure definitions changed.",
          score: 18,
        },
        {
          id: "configuration",
          label: "Configuration",
          description: "Production configuration changed.",
          score: 12,
        },
        {
          id: "direct-commits",
          label: "Direct commits",
          description: "One change was not associated with a pull request.",
          score: 8,
        },
      ],
    },
    analysis: {
      totalCommits: 12,
      excludedCommits: 9,
      inspectionFailures: 0,
      inspectedFiles: 31,
      durationMs: 1260,
    },
  };
}
