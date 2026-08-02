import { ComparisonResult } from "../models/comparison";

export function generatePlainTextResults(result: ComparisonResult): string {
  const lines = [
    "Deployment comparison",
    `${result.baseBuild.buildNumber} -> ${result.targetBuild.buildNumber}`,
    `${result.pullRequests.length} pull requests | ${result.commits.length} commits | ${result.files.length} files | ${result.contributors.length} contributors`,
    `Release risk: ${result.risk.level.toUpperCase()} (${result.risk.score}/100)`,
    "",
  ];

  for (const commit of result.commits) {
    const message = commit.message.split("\n")[0] || "No commit message";
    const author =
      commit.pullRequest?.createdBy.displayName ?? commit.author.displayName;
    if (commit.pullRequest) {
      lines.push(
        `- PR #${commit.pullRequest.id}: ${commit.pullRequest.title} — ${author}`,
        `  ${commit.pullRequest.url}`
      );
    } else {
      lines.push(`- ${commit.id.slice(0, 7)}: ${message} — ${author}`);
    }
  }

  if (result.commits.length === 0) {
    lines.push("No relevant changes found.");
  }
  return lines.join("\n");
}
