import {
  GitQueryCommitsCriteria,
  GitVersionType,
} from "azure-devops-node-api/interfaces/GitInterfaces";

export function buildCommitRangeCriteria(
  baseCommit: string,
  targetCommit: string
): GitQueryCommitsCriteria {
  return {
    itemVersion: {
      version: baseCommit,
      versionType: GitVersionType.Commit,
    },
    compareVersion: {
      version: targetCommit,
      versionType: GitVersionType.Commit,
    },
    includeLinks: true,
  };
}
