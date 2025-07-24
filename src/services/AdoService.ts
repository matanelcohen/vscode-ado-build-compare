import * as azdev from "azure-devops-node-api";
import { IBuildApi } from "azure-devops-node-api/BuildApi";
import { IGitApi } from "azure-devops-node-api/GitApi";
import { Build, BuildStatus } from "azure-devops-node-api/interfaces/BuildInterfaces";
import { GitPullRequest, GitPullRequestSearchCriteria } from "azure-devops-node-api/interfaces/GitInterfaces";
import { AdcPipelineViewerConfig } from "../api";
import { PipelineRun } from "../interfaces/pipeline";

export class AdoService {
  private connection: azdev.WebApi;
  private buildApi: Promise<IBuildApi>;
  private gitApi: Promise<IGitApi>;
  private config: AdcPipelineViewerConfig;

  constructor(organizationUrl: string, accessToken: string, config: AdcPipelineViewerConfig) {
    // Create the connection using Personal Access Token
    const authHandler = azdev.getPersonalAccessTokenHandler(accessToken);
    this.connection = new azdev.WebApi(organizationUrl, authHandler);
    this.config = config;

    // Initialize API clients
    this.buildApi = this.connection.getBuildApi();
    this.gitApi = this.connection.getGitApi();
  }

  /**
   * Converts Azure DevOps SDK Build to our PipelineRun interface
   */
  private buildToPipelineRun(build: Build, commitMessage?: string): PipelineRun {
    return {
      id: build.id || 0,
      buildNumber: build.buildNumber || "",
      sourceVersion: build.sourceVersion,
      finishTime: build.finishTime?.toISOString(),
      commitMessage,
      status: build.status?.toString(),
      result: build.result?.toString(),
      startTime: build.startTime?.toISOString(),
      queueTime: build.queueTime?.toISOString(),
      url: build.url,
      _links: build._links,
      definition: build.definition ? {
        id: build.definition.id || 0,
        name: build.definition.name || "",
        url: build.definition.url || ""
      } : undefined,
      project: build.project ? {
        id: build.project.id || "",
        name: build.project.name || ""
      } : undefined,
      requestedBy: build.requestedBy ? {
        displayName: build.requestedBy.displayName || "",
        id: build.requestedBy.id || "",
        uniqueName: build.requestedBy.uniqueName || ""
      } : undefined,
      reason: build.reason?.toString(),
      sourceBranch: build.sourceBranch,
      sourceRepositoryId: build.repository?.id,
      templateParameters: build.templateParameters,
      triggerInfo: build.triggerInfo,
      uri: build.uri,
      buildNumberRevision: build.buildNumberRevision,
      deleted: build.deleted,
      retainedByRelease: build.retainedByRelease,
      triggeredByBuild: build.triggeredByBuild as Record<string, unknown> | undefined
    };
  }

  /**
   * Find the latest successfully deployed pipeline run
   */
  async findLatestDeployedRun(): Promise<PipelineRun | null> {
    try {
      const buildApiClient = await this.buildApi;

      const builds = await buildApiClient.getBuilds(
        this.config.projectName,
        [this.config.pipelineDefinitionId], // definitions
        undefined, // queues
        undefined, // buildNumber
        undefined, // minTime
        undefined, // maxTime
        undefined, // requestedFor
        undefined, // reasonFilter
        BuildStatus.Completed, // statusFilter
        undefined, // resultFilter
        undefined, // tagFilters
        undefined, // properties
        50 // top
      );

      if (!builds || builds.length === 0) {
        return null;
      }

      // Check all builds in parallel for better performance
      const timelinePromises = builds.map(async (build) => {
        try {
          const timeline = await buildApiClient.getBuildTimeline(
            this.config.projectName,
            build.id || 0
          );

          if (timeline?.records) {
            const targetStageRecord = timeline.records.find(
              (record: any) => record.type === "Stage" && record.name === this.config.targetStageName
            );

            if (targetStageRecord) {
              // Azure DevOps uses enum values: state 2 = completed, result 0 = succeeded
              if (
                targetStageRecord.state === 2 &&
                targetStageRecord.result === 0
              ) {
                return build;
              }
            }
          }
          return null;
        } catch (timelineError) {
          return null;
        }
      });

      // Wait for all timeline checks to complete
      const results = await Promise.all(timelinePromises);
      const successfulBuild = results.find(result => result !== null);

      return successfulBuild ? this.buildToPipelineRun(successfulBuild) : null;
    } catch (error) {
      console.error("Error finding latest deployed run:", error);
      return null;
    }
  }

  /**
   * Fetch the last N builds with commit messages
   */
  async fetchLastNBuilds(count: number): Promise<PipelineRun[]> {
    try {
      const buildApiClient = await this.buildApi;
      const gitApiClient = await this.gitApi;

      const builds = await buildApiClient.getBuilds(
        this.config.projectName,
        [this.config.pipelineDefinitionId], // definitions
        undefined, // queues
        undefined, // buildNumber
        undefined, // minTime
        undefined, // maxTime
        undefined, // requestedFor
        undefined, // reasonFilter
        undefined, // statusFilter
        undefined, // resultFilter
        undefined, // tagFilters
        undefined, // properties
        count // top
      );

      if (!builds || builds.length === 0) {
        return [];
      }

      // Fetch commit messages for each build
      const runsWithMessages = await Promise.all(
        builds.map(async (build: Build) => {
          let commitMessage: string | undefined = undefined;

          if (build.sourceVersion && this.config.repositoryId) {
            try {
              const commit = await gitApiClient.getCommit(
                build.sourceVersion,
                this.config.repositoryId,
                this.config.projectName
              );
              commitMessage = commit.comment;
            } catch (commitError) {
              // Ignore error and continue without commit message
            }
          }

          return this.buildToPipelineRun(build, commitMessage);
        })
      );

      return runsWithMessages;
    } catch (error) {
      console.error("Error fetching last N builds:", error);
      return [];
    }
  }

  /**
   * Fetch commit range data between two builds
   */
  async fetchCommitRangeData(
    olderRun: PipelineRun,
    selectedBuild: PipelineRun
  ): Promise<{
    committerMap: { [committer: string]: string[] };
    error?: string;
  }> {
    try {
      if (!olderRun.sourceVersion || !selectedBuild.sourceVersion) {
        return {
          committerMap: {},
          error: "Missing source versions for build comparison"
        };
      }

      const gitApiClient = await this.gitApi;

      // Parallelize the initial commit fetches for better performance
      const [parentCommit, newerCommitDetails] = await Promise.all([
        gitApiClient.getCommit(
          olderRun.sourceVersion,
          this.config.repositoryId,
          this.config.projectName
        ),
        gitApiClient.getCommit(
          selectedBuild.sourceVersion,
          this.config.repositoryId,
          this.config.projectName
        )
      ]);

      if (!parentCommit.parents || parentCommit.parents.length === 0) {
        return {
          committerMap: {},
          error: `Could not find parent commit for ${olderRun.sourceVersion}`
        };
      }

      const parentCommitId = parentCommit.parents[0];
      if (!parentCommitId) {
        return {
          committerMap: {},
          error: "Invalid parent commit ID"
        };
      }

      // Get the parent commit details
      const parentCommitDetails = await gitApiClient.getCommit(
        parentCommitId,
        this.config.repositoryId,
        this.config.projectName
      );

      const fromDate = parentCommitDetails.committer?.date || parentCommitDetails.author?.date;
      const toDate = newerCommitDetails.committer?.date || newerCommitDetails.author?.date;

      if (!fromDate || !toDate) {
        return {
          committerMap: {},
          error: "Could not determine commit dates for range."
        };
      }

      // Get commits in the range
      const commits = await gitApiClient.getCommits(
        this.config.repositoryId,
        {
          itemVersion: { version: "main" },
          fromDate: fromDate.toISOString(),
          toDate: toDate.toISOString(),
          $top: 10000
        },
        this.config.projectName
      );

      const committerMap: { [committer: string]: string[] } = {};
      const prIdRegex = /Merged PR (\d+)/i;

      // Process commits in chunks to avoid overwhelming the API (increased for better performance)
      const chunkSize = 20;
      for (let i = 0; i < commits.length; i += chunkSize) {
        const chunk = commits.slice(i, i + chunkSize);

        await Promise.all(
          chunk.map(async (commit: any) => {
            try {
              // Get changes for this commit to check if it affects relevant paths
              const changes = await gitApiClient.getChanges(
                commit.commitId || "",
                this.config.repositoryId,
                this.config.projectName
              );

              const affectedPaths = changes.changes?.map((c: any) => c.item?.path || "") || [];

              // Apply path filtering if configured
              const pathPatterns = this.config.relevantPathFilter
                ? this.config.relevantPathFilter
                    .split(",")
                    .map(pattern => pattern.trim())
                    .filter(pattern => pattern.length > 0)
                : [];

              const isRelevant = pathPatterns.length === 0 ||
                affectedPaths.some((path: string) =>
                  path && pathPatterns.some(pattern => path.includes(pattern))
                );

              if (isRelevant) {
                const committerName = commit.committer?.name || "Unknown";
                const match = commit.comment?.match(prIdRegex);
                const prNumber = match?.[1];

                if (prNumber) {
                  const prLink = `${this.config.organizationUrl}/${this.config.projectName}/_git/${this.config.repositoryId}/pullrequest/${prNumber}`;
                  const mergeTitle = commit.comment;
                  const prLine = `# PR ${prNumber} Message: ${mergeTitle} - <a href="${prLink}" target="_blank">${prLink}</a>`;

                  if (!committerMap[committerName]) {
                    committerMap[committerName] = [];
                  }
                  committerMap[committerName].push(prLine);
                }
              }
            } catch (error) {
              // Continue processing other commits if one fails
              return;
            }
          })
        );
      }

      return { committerMap };
    } catch (error: any) {
      return {
        committerMap: {},
        error: error?.message || "Unknown error"
      };
    }
  }

  /**
   * Get active pull request for a branch
   */
  async getActivePullRequestForBranch(branchName: string): Promise<GitPullRequest | null> {
    try {
      const gitApiClient = await this.gitApi;
      const sourceRef = branchName.startsWith("refs/heads/") ? branchName : `refs/heads/${branchName}`;

      const searchCriteria: GitPullRequestSearchCriteria = {
        sourceRefName: sourceRef,
        status: 1 // Active status
      };

      const pullRequests = await gitApiClient.getPullRequests(
        this.config.repositoryId,
        searchCriteria,
        this.config.projectName
      );

      if (pullRequests && pullRequests.length > 0) {
        return pullRequests[0] || null;
      }

      return null;
    } catch (error) {
      console.error("Error getting active pull request:", error);
      return null;
    }
  }
}
