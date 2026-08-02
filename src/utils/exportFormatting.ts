import { ComparisonResult } from "../models/comparison";
import { generateDeterministicSummary } from "./riskAnalysis";
import { marketplaceUrl, productName } from "../product";

export type ExportFormat = "markdown" | "json";

export function formatComparisonExport(
  result: ComparisonResult,
  format: ExportFormat,
  summary?: string
): string {
  if (format === "json") {
    return JSON.stringify(
      { summary: summary ?? generateDeterministicSummary(result), ...result },
      null,
      2
    );
  }

  const lines = [
    `# Deployment comparison: ${result.baseBuild.buildNumber} → ${result.targetBuild.buildNumber}`,
    "",
    summary ?? generateDeterministicSummary(result),
    "",
    `**Release risk:** ${result.risk.level.toUpperCase()} (${result.risk.score}/100)`,
    "",
    "| Pull requests | Commits | Files | Contributors |",
    "| ---: | ---: | ---: | ---: |",
    `| ${result.pullRequests.length} | ${result.commits.length} | ${result.files.length} | ${result.contributors.length} |`,
    "",
    "## Changes",
    "",
  ];
  for (const commit of result.commits) {
    if (commit.pullRequest) {
      lines.push(
        `- [PR #${commit.pullRequest.id}: ${escapeMarkdown(
          commit.pullRequest.title
        )}](${commit.pullRequest.url}) — ${escapeMarkdown(
          commit.pullRequest.createdBy.displayName
        )}`
      );
    } else {
      lines.push(
        `- \`${commit.id.slice(0, 7)}\` ${escapeMarkdown(
          commit.message.split("\n")[0] || "No commit message"
        )} — ${escapeMarkdown(commit.author.displayName)}`
      );
    }
  }
  if (result.files.length > 0) {
    lines.push("", "## Changed files", "");
    for (const file of result.files) {
      lines.push(`- \`${file.path}\` (${file.changeType})`);
    }
  }
  if (result.risk.signals.length > 0) {
    lines.push("", "## Risk signals", "");
    for (const signal of result.risk.signals) {
      lines.push(`- **${signal.label}:** ${signal.description}`);
    }
  }
  lines.push(
    "",
    "---",
    `Generated with [${productName}](${marketplaceUrl}).`
  );
  return lines.join("\n");
}

function escapeMarkdown(value: string): string {
  return value.replace(/([\\`*_[\]<>])/g, "\\$1");
}
