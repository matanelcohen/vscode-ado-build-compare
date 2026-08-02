import {
  ComparisonResult,
  ReleaseRisk,
  RiskSignal,
} from "../models/comparison";

interface RiskInput {
  files: ComparisonResult["files"];
  commits: ComparisonResult["commits"];
  directCommits: ComparisonResult["directCommits"];
  warnings: string[];
}

const sensitiveRules: Array<{
  id: string;
  label: string;
  pattern: RegExp;
  score: number;
  description: string;
}> = [
  {
    id: "database",
    label: "Database changes",
    pattern: /(^|\/)(migrations?|schema|database|db)(\/|\.|$)/i,
    score: 25,
    description: "Database or schema files changed and may require coordinated rollout.",
  },
  {
    id: "security",
    label: "Security-sensitive changes",
    pattern: /(^|\/)(auth|security|identity|permissions?|rbac|secrets?)(\/|\.|$)/i,
    score: 25,
    description: "Authentication, authorization, identity, or secret-related files changed.",
  },
  {
    id: "infrastructure",
    label: "Infrastructure changes",
    pattern:
      /(^|\/)(infra|terraform|bicep|helm|k8s|kubernetes|deploy|pipelines?)(\/|\.|$)|\.ya?ml$/i,
    score: 18,
    description: "Deployment or infrastructure configuration changed.",
  },
  {
    id: "dependencies",
    label: "Dependency changes",
    pattern:
      /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|packages\.lock\.json|requirements\.txt|poetry\.lock|go\.sum)$/i,
    score: 12,
    description: "Locked dependencies changed and may alter runtime behavior.",
  },
  {
    id: "configuration",
    label: "Runtime configuration changes",
    pattern: /(^|\/)(config|settings|featureflags?)(\/|\.|$)|\.env/i,
    score: 12,
    description: "Runtime configuration or feature flag files changed.",
  },
];

export function analyzeReleaseRisk(input: RiskInput): ReleaseRisk {
  const signals: RiskSignal[] = [];
  const paths = input.files.map((file) => file.path);

  for (const rule of sensitiveRules) {
    const matches = paths.filter((path) => rule.pattern.test(path));
    if (matches.length > 0) {
      signals.push({
        id: rule.id,
        label: rule.label,
        description: `${rule.description} ${matches.length} ${
          matches.length === 1 ? "file matches" : "files match"
        }.`,
        score: rule.score,
      });
    }
  }

  if (input.files.length >= 100) {
    signals.push({
      id: "large-file-change",
      label: "Large file surface",
      description: `${input.files.length} files changed.`,
      score: 20,
    });
  } else if (input.files.length >= 30) {
    signals.push({
      id: "moderate-file-change",
      label: "Broad file surface",
      description: `${input.files.length} files changed.`,
      score: 10,
    });
  }

  if (input.commits.length >= 50) {
    signals.push({
      id: "large-commit-range",
      label: "Large commit range",
      description: `${input.commits.length} commits are included.`,
      score: 15,
    });
  }

  if (input.directCommits.length > 0) {
    signals.push({
      id: "direct-commits",
      label: "Direct commits",
      description: `${input.directCommits.length} ${
        input.directCommits.length === 1 ? "commit was" : "commits were"
      } not associated with a pull request.`,
      score: Math.min(20, 5 + input.directCommits.length * 2),
    });
  }

  if (input.warnings.length > 0) {
    signals.push({
      id: "incomplete-analysis",
      label: "Incomplete analysis",
      description: `${input.warnings.length} warning${
        input.warnings.length === 1 ? "" : "s"
      } occurred while inspecting changes.`,
      score: 15,
    });
  }

  const score = Math.min(
    100,
    signals.reduce((total, signal) => total + signal.score, 0)
  );
  return {
    score,
    level:
      score >= 75
        ? "critical"
        : score >= 50
          ? "high"
          : score >= 25
            ? "medium"
            : "low",
    signals,
  };
}

export function generateDeterministicSummary(
  result: Pick<
    ComparisonResult,
    "pullRequests" | "commits" | "files" | "contributors" | "risk"
  >
): string {
  const lead = `${result.pullRequests.length} pull requests, ${result.commits.length} commits, and ${result.files.length} files changed across ${result.contributors.length} contributors.`;
  if (result.risk.signals.length === 0) {
    return `${lead} Release risk is low; no sensitive change patterns were detected.`;
  }

  const reasons = result.risk.signals
    .slice(0, 3)
    .map((signal) => signal.label.toLocaleLowerCase())
    .join(", ");
  return `${lead} Release risk is ${result.risk.level} (${result.risk.score}/100), primarily due to ${reasons}.`;
}

export function buildAiSummaryPrompt(result: ComparisonResult): string {
  const changes = result.commits.slice(0, 80).map((commit) => ({
    pullRequest: commit.pullRequest?.id,
    title:
      commit.pullRequest?.title ?? commit.message.split("\n")[0] ?? "Change",
    author:
      commit.pullRequest?.createdBy.displayName ?? commit.author.displayName,
    files: commit.files.slice(0, 15).map((file) => file.path),
  }));
  return [
    "Write a concise deployment summary for engineers and release managers.",
    "Use 3-6 bullets. Explain user or operational impact when supported by the data.",
    "Call out risk and required rollout attention. Do not invent facts.",
    "Do not include a heading or markdown table.",
    JSON.stringify({
      builds: {
        from: result.baseBuild.buildNumber,
        to: result.targetBuild.buildNumber,
      },
      risk: result.risk,
      totals: {
        pullRequests: result.pullRequests.length,
        commits: result.commits.length,
        files: result.files.length,
        contributors: result.contributors.length,
      },
      changes,
    }),
  ].join("\n");
}
