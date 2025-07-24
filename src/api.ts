import { PipelineRun, Timeline, TimelineRecord } from "./interfaces/pipeline";
import { GitCommitRefFull } from "./interfaces/git";
import { GitPullRequest, GetPullRequestsResponse } from "./interfaces/ado";

function chunkArray<T>(arr: T[], n: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += n) result.push(arr.slice(i, i + n));
  return result;
}

export interface AdcPipelineViewerConfig {
  organizationUrl: string;
  projectName: string;
  pipelineDefinitionId: number;
  targetStageName: string;
  repositoryId: string;
  relevantPathFilter?: string;
}

function getAzureDevOpsApiBaseUrl(orgUrl: string): string {
  try {
    const parsedUrl = new URL(orgUrl);
    if (parsedUrl.hostname.endsWith("visualstudio.com")) {
      return `https://${parsedUrl.hostname}`;
    } else if (parsedUrl.hostname === "dev.azure.com") {
      const orgName = parsedUrl.pathname.split("/")[1];
      if (orgName) return `https://dev.azure.com/${orgName}`;
    }
    return orgUrl.endsWith("/") ? orgUrl.slice(0, -1) : orgUrl;
  } catch {
    return orgUrl;
  }
}

export async function findLatestDeployedRun(
  accessToken: string,
  config: AdcPipelineViewerConfig
): Promise<PipelineRun | null> {
  const {
    organizationUrl,
    projectName,
    pipelineDefinitionId,
    targetStageName,
  } = config;

  const runsUrl = `${organizationUrl}/${projectName}/_apis/build/builds?definitions=${pipelineDefinitionId}&statusFilter=completed&$top=50&queryOrder=finishTimeDescending&properties=sourceVersion&includeLatestBuilds=true&api-version=7.1-preview.7`;
  const headers = { Authorization: `Bearer ${accessToken}` };
  try {
    const runsResponse = await fetch(runsUrl, { headers } as any).then((r) =>
      r.json()
    );
    const recentCompletedSuccessfulRuns: PipelineRun[] = runsResponse.value;

    if (
      !recentCompletedSuccessfulRuns ||
      recentCompletedSuccessfulRuns.length === 0
    ) {
      return null;
    }

    // Parallelize timeline checks for better performance
    const timelinePromises = recentCompletedSuccessfulRuns.map(async (run) => {
      const timelineUrl = `${organizationUrl}/${projectName}/_apis/build/builds/${run.id}/timeline?api-version=7.1`;
      try {
        const timelineResponse = await fetch(timelineUrl, {
          headers,
        } as any).then((r) => r.json());
        const timeline: Timeline = timelineResponse;

        const targetStageRecord = timeline.records.find(
          (record: TimelineRecord) =>
            record.type === "Stage" && record.name === targetStageName
        );

        if (
          targetStageRecord &&
          targetStageRecord.state === "completed" &&
          targetStageRecord.result === "succeeded"
        ) {
          return run;
        }
        return null;
      } catch (timelineError) {
        return null;
      }
    });

    // Wait for all timeline checks to complete and return the first successful one
    const results = await Promise.all(timelinePromises);
    return results.find(result => result !== null) || null;
  } catch (error) {
    return null;
  }
}

export async function fetchLastNBuilds(
  accessToken: string,
  count: number,
  config: AdcPipelineViewerConfig
): Promise<PipelineRun[]> {
  const { organizationUrl, projectName, pipelineDefinitionId, repositoryId } =
    config;
  const apiBaseUrl = getAzureDevOpsApiBaseUrl(organizationUrl);

  const runsUrl = `${organizationUrl}/${projectName}/_apis/build/builds?definitions=${pipelineDefinitionId}&$top=${count}&queryOrder=finishTimeDescending&properties=sourceVersion&api-version=7.1-preview.7`;
  const headers = { Authorization: `Bearer ${accessToken}` };
  try {
    const response = await fetch(runsUrl, { headers } as any).then((r) =>
      r.json()
    );
    const runs: PipelineRun[] = response.value || [];

    const runsWithMessages = await Promise.all(
      runs.map(async (run) => {
        let commitMessage: string | undefined = undefined;
        if (run.sourceVersion && repositoryId) {
          try {
            const commitUrl = `${apiBaseUrl}/${projectName}/_apis/git/repositories/${repositoryId}/commits/${run.sourceVersion}?api-version=7.1`;
            const commitResponse = await fetch(commitUrl, {
              headers,
            } as any).then((r) => r.json());
            commitMessage = commitResponse.comment || undefined;
          } catch (commitError) {
            // Ignore error and continue
          }
        }
        return {
          ...run,
          sourceVersion: run.sourceVersion || undefined,
          finishTime: run.finishTime || undefined,
          result: run.result || undefined,
          status: run.status || undefined,
          commitMessage: commitMessage,
        };
      })
    );

    return runsWithMessages;
  } catch (error) {
    return [];
  }
}

export async function fetchCommitRangeData(
  accessToken: string,
  olderRun: PipelineRun,
  selectedBuild: PipelineRun,
  config: AdcPipelineViewerConfig
): Promise<{
  committerMap: { [committer: string]: string[] };
  error?: string;
}> {
  const { organizationUrl, projectName, repositoryId, relevantPathFilter } =
    config;

  const apiBaseUrl = getAzureDevOpsApiBaseUrl(organizationUrl);
  const headers = { Authorization: `Bearer ${accessToken}` };
  try {
    // Parallelize the initial commit detail fetches
    const [parentCommitResp, newerCommitResp] = await Promise.all([
      fetch(
        `${apiBaseUrl}/${projectName}/_apis/git/repositories/${repositoryId}/commits/${olderRun.sourceVersion}?api-version=7.1`,
        { headers } as any
      ).then(async (r) => {
        const data = await r.json();
        const parentCommit = data.parents && data.parents.length > 0 ? data.parents[0] : "";
        if (!parentCommit) return null;
        return fetch(
          `${apiBaseUrl}/${projectName}/_apis/git/repositories/${repositoryId}/commits/${parentCommit}?api-version=7.1`,
          { headers } as any
        ).then((r) => r.json());
      }),
      fetch(
        `${apiBaseUrl}/${projectName}/_apis/git/repositories/${repositoryId}/commits/${selectedBuild.sourceVersion}?api-version=7.1`,
        { headers } as any
      ).then((r) => r.json())
    ]);

    if (!parentCommitResp) {
      return {
        committerMap: {},
        error: `Could not find parent commit for ${olderRun.sourceVersion}`,
      };
    }

    const fromDate = parentCommitResp.committer?.date || parentCommitResp.author?.date;
    const toDate = newerCommitResp.committer?.date || newerCommitResp.author?.date;

    if (!fromDate || !toDate) {
      return {
        committerMap: {},
        error: "Could not determine commit dates for range.",
      };
    }

    const commitsUrl = `${apiBaseUrl}/${projectName}/_apis/git/repositories/${repositoryId}/commits?searchCriteria.itemVersion=main&searchCriteria.fromDate=${encodeURIComponent(
      fromDate
    )}&searchCriteria.toDate=${encodeURIComponent(
      toDate
    )}&$top=10000&api-version=7.1-preview.1`;

    const commitResponse = await fetch(commitsUrl, { headers } as any).then(
      (r) => r.json()
    );
    const commitsInRange: GitCommitRefFull[] = commitResponse.value || [];
    const prIdRegex = /Merged PR (\d+)/i;

    // Process all commits in parallel with larger chunks for better performance
    const commitChunks = chunkArray(commitsInRange, 20);
    const committerMap: { [committer: string]: string[] } = {};

    const pathPatterns = relevantPathFilter
      ? relevantPathFilter
          .split(",")
          .map((pattern) => pattern.trim())
          .filter((pattern) => pattern.length > 0)
      : [];

    // Process all chunks in parallel
    const chunkPromises = commitChunks.map(async (chunk) => {
      const chunkResults: { [committer: string]: string[] } = {};

      const promises = chunk.map(async (commit: GitCommitRefFull) => {
        try {
          const changesUrl = `${apiBaseUrl}/${projectName}/_apis/git/repositories/${repositoryId}/commits/${commit.commitId}/changes?api-version=7.1`;
          const changeResp = await fetch(changesUrl, { headers } as any).then(
            (r) => r.json()
          );
          const affectedPaths = (changeResp.changes || []).map(
            (c: any) => c.item?.path || ""
          );

          if (
            pathPatterns.length === 0 ||
            affectedPaths.some(
              (p: string) =>
                p && pathPatterns.some((pattern) => p.includes(pattern))
            )
          ) {
            const committerName = commit.committer?.name || "Unknown";
            const match = commit.comment.match(prIdRegex);
            const prNumber = match?.[1] ? match[1] : null;
            if (!prNumber) return null;
            const prLink = `${organizationUrl}/${projectName}/_git/${repositoryId}/pullrequest/${prNumber}`;
            const mergeTitle = commit.comment;
            const prLine = `# PR ${prNumber} Message: ${mergeTitle} - <a href="${prLink}" target="_blank">${prLink}</a>`;

            return { committerName, prLine };
          }
        } catch {
          return null;
        }
        return null;
      });

      const results = await Promise.all(promises);

      // Collect results from this chunk
      results.forEach(result => {
        if (result) {
          if (!chunkResults[result.committerName]) {
            chunkResults[result.committerName] = [];
          }
          chunkResults[result.committerName].push(result.prLine);
        }
      });

      return chunkResults;
    });

    // Wait for all chunks to complete and merge results
    const allChunkResults = await Promise.all(chunkPromises);

    allChunkResults.forEach(chunkResult => {
      if (chunkResult) {
        Object.keys(chunkResult).forEach(committerName => {
          if (!committerMap[committerName]) {
            committerMap[committerName] = [];
          }
          const chunkCommits = chunkResult[committerName];
          if (chunkCommits) {
            committerMap[committerName].push(...chunkCommits);
          }
        });
      }
    });

    return { committerMap };
  } catch (error: any) {
    return { committerMap: {}, error: error?.message || "Unknown error" };
  }
}

export async function getActivePullRequestForBranch(
  accessToken: string,
  branchName: string,
  config: AdcPipelineViewerConfig
): Promise<GitPullRequest | null> {
  const { organizationUrl, projectName, repositoryId } = config;
  const apiBaseUrl = getAzureDevOpsApiBaseUrl(organizationUrl);
  const headers = { Authorization: `Bearer ${accessToken}` };

  const sourceRef = branchName.startsWith("refs/heads/") ? branchName : `refs/heads/${branchName}`;

  const prsUrl = `${apiBaseUrl}/${projectName}/_apis/git/repositories/${repositoryId}/pullrequests?searchCriteria.sourceRefName=${encodeURIComponent(sourceRef)}&searchCriteria.status=active&api-version=7.1-preview.1`;

  try {
    const response = await fetch(prsUrl, { headers } as any).then((r) => r.json());
    const prs: GetPullRequestsResponse = response;
    if (prs.value && prs.value.length > 0) {
      return prs.value[0] || null;
    }
    return null;
  } catch (error: any) {
    return null;
  }
}
