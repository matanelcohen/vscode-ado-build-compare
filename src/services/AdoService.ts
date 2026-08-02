import * as azdev from "azure-devops-node-api";
import { IBuildApi } from "azure-devops-node-api/BuildApi";
import { IGitApi } from "azure-devops-node-api/GitApi";
import { IWorkItemTrackingApi } from "azure-devops-node-api/WorkItemTrackingApi";
import { Build, BuildStatus } from "azure-devops-node-api/interfaces/BuildInterfaces";
import {
  GitCommitRef,
  GitPullRequest,
  GitPullRequestQueryType,
  GitVersionType,
  VersionControlChangeType,
} from "azure-devops-node-api/interfaces/GitInterfaces";
import { Operation } from "azure-devops-node-api/interfaces/common/VSSInterfaces";
import { AdcPipelineViewerConfig } from "../api-sdk";
import { PipelineRun } from "../api-sdk";
import {
  ComparedCommit,
  ComparedFile,
  ComparedPullRequest,
  ComparisonIdentity,
  ComparisonResult,
  GitReference,
} from "../models/comparison";
import {
  isPathRelevant,
  mapWithConcurrency,
  parsePathFilters,
  uniqueFiles,
  uniqueIdentities,
} from "../utils/comparison";
import { analyzeReleaseRisk } from "../utils/riskAnalysis";

export class AdoService {
  private connection: azdev.WebApi;
  private buildApi: Promise<IBuildApi>;
  private gitApi: Promise<IGitApi>;
  private workItemApi: Promise<IWorkItemTrackingApi>;
  private config: AdcPipelineViewerConfig;

  constructor(organizationUrl: string, accessToken: string, config: AdcPipelineViewerConfig) {
    const authHandler = azdev.getBearerHandler(accessToken);
    this.connection = new azdev.WebApi(organizationUrl, authHandler);
    this.config = config;

    // Initialize API clients
    this.buildApi = this.connection.getBuildApi();
    this.gitApi = this.connection.getGitApi();
    this.workItemApi = this.connection.getWorkItemTrackingApi();
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

      const results = await mapWithConcurrency(builds, 6, async (build) => {
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

      const successfulBuild = results.find(result => result !== null);

      return successfulBuild ? this.buildToPipelineRun(successfulBuild) : null;
    } catch (error) {
      throw new Error(
        `Unable to inspect pipeline deployments: ${this.errorMessage(error)}`
      );
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

      return mapWithConcurrency(builds, 8, async (build: Build) => {
          let commitMessage: string | undefined = undefined;

          if (build.sourceVersion && this.config.repositoryId) {
            try {
              const commit = await gitApiClient.getCommit(
                build.sourceVersion,
                this.config.repositoryId,
                this.config.projectName
              );
              commitMessage = commit.comment;
            } catch {
              commitMessage = undefined;
            }
          }

          return this.buildToPipelineRun(build, commitMessage);
        });
    } catch (error) {
      throw new Error(`Unable to load builds: ${this.errorMessage(error)}`);
    }
  }

  /**
   * Fetch commit range data between two builds
   */
  async fetchCommitRangeData(
    olderRun: PipelineRun,
    selectedBuild: PipelineRun
  ): Promise<ComparisonResult> {
    if (!olderRun.sourceVersion || !selectedBuild.sourceVersion) {
      throw new Error("Both builds must have a source commit.");
    }
    if (olderRun.sourceVersion === selectedBuild.sourceVersion) {
      const empty = {
        baseBuild: olderRun,
        targetBuild: selectedBuild,
        commits: [],
        pullRequests: [],
        directCommits: [],
        contributors: [],
        files: [],
        pathFilters: parsePathFilters(this.config.relevantPathFilter),
        warnings: [],
      };
      return { ...empty, risk: analyzeReleaseRisk(empty) };
    }

    const gitApiClient = await this.gitApi;
    const commits = await gitApiClient.getCommitsBatch(
      {
        itemVersion: {
          version: selectedBuild.sourceVersion,
          versionType: GitVersionType.Commit,
        },
        compareVersion: {
          version: olderRun.sourceVersion,
          versionType: GitVersionType.Commit,
        },
        includeLinks: true,
        $top: 10000,
      },
      this.config.repositoryId,
      this.config.projectName
    );

    if (commits.length >= 10000) {
      throw new Error(
        "The comparison contains at least 10,000 commits. Choose a narrower build range."
      );
    }

    const pathFilters = parsePathFilters(this.config.relevantPathFilter);
    const pullRequests = await this.findPullRequestsForCommits(commits);
    const warnings: string[] = [];

    const compared = await mapWithConcurrency(commits, 8, async (commit) => {
      const commitId = commit.commitId;
      if (!commitId) {
        return null;
      }

      try {
        const changes = await gitApiClient.getChanges(
          commitId,
          this.config.repositoryId,
          this.config.projectName,
          10000
        );
        if ((changes.changes?.length ?? 0) >= 10000) {
          warnings.push(
            `Commit ${commitId.slice(0, 7)} contains at least 10,000 file changes; its file list was truncated.`
          );
        }
        const files: ComparedFile[] = (changes.changes ?? [])
          .map((change) => {
            const path = change.item?.path;
            if (!path) {
              return null;
            }
            return {
              path,
              changeType:
                VersionControlChangeType[change.changeType ?? 0] ?? "Unknown",
            };
          })
          .filter((file): file is ComparedFile => file !== null)
          .filter((file) => isPathRelevant(file.path, pathFilters));

        if (pathFilters.length > 0 && files.length === 0) {
          return null;
        }

        const pullRequest = pullRequests.get(commitId);
        const author = this.gitIdentity(
          commit.author?.name,
          commit.author?.email
        );
        const result: ComparedCommit = {
          id: commitId,
          message: commit.comment?.trim() || "No commit message",
          author,
          files,
          ...(commit.author?.date
            ? { committedAt: commit.author.date.toISOString() }
            : {}),
          ...(pullRequest ? { pullRequest } : {}),
        };
        return result;
      } catch (error) {
        warnings.push(
          `Could not inspect files for commit ${commitId.slice(0, 7)}: ${this.errorMessage(error)}`
        );
        return null;
      }
    });

    const relevantCommits = compared.filter(
      (commit): commit is ComparedCommit => commit !== null
    );
    const uniquePullRequests = new Map<number, ComparedPullRequest>();
    for (const commit of relevantCommits) {
      if (commit.pullRequest) {
        uniquePullRequests.set(commit.pullRequest.id, commit.pullRequest);
      }
    }

    const resultWithoutRisk = {
      baseBuild: olderRun,
      targetBuild: selectedBuild,
      commits: relevantCommits,
      pullRequests: [...uniquePullRequests.values()],
      directCommits: relevantCommits.filter((commit) => !commit.pullRequest),
      contributors: uniqueIdentities(
        relevantCommits.map(
          (commit) => commit.pullRequest?.createdBy ?? commit.author
        )
      ),
      files: uniqueFiles(relevantCommits.flatMap((commit) => commit.files)),
      pathFilters,
      warnings,
    };
    return {
      ...resultWithoutRisk,
      risk: analyzeReleaseRisk(resultWithoutRisk),
    };
  }

  private async findPullRequestsForCommits(
    commits: GitCommitRef[]
  ): Promise<Map<string, ComparedPullRequest>> {
    const commitIds = commits
      .map((commit) => commit.commitId)
      .filter((id): id is string => Boolean(id));
    if (commitIds.length === 0) {
      return new Map();
    }

    const byCommit = new Map<string, ComparedPullRequest>();
    const chunks = Array.from(
      { length: Math.ceil(commitIds.length / 100) },
      (_, index) => commitIds.slice(index * 100, (index + 1) * 100)
    );
    const gitApiClient = await this.gitApi;
    const responses = await mapWithConcurrency(chunks, 4, (items) =>
      gitApiClient.getPullRequestQuery(
        {
          queries: [
            { type: GitPullRequestQueryType.LastMergeCommit, items },
            { type: GitPullRequestQueryType.Commit, items },
          ],
        },
        this.config.repositoryId,
        this.config.projectName
      )
    );

    for (const response of responses) {
      const [exactMatches, broadMatches] = response.results ?? [];
      if (exactMatches) {
        for (const [commitId, matches] of Object.entries(exactMatches)) {
          const pullRequest = matches[0];
          if (pullRequest) {
            byCommit.set(commitId, this.toComparedPullRequest(pullRequest));
          }
        }
      }
      if (broadMatches) {
        for (const [commitId, matches] of Object.entries(broadMatches)) {
          const pullRequest = matches[0];
          if (pullRequest && !byCommit.has(commitId)) {
            byCommit.set(commitId, this.toComparedPullRequest(pullRequest));
          }
        }
      }
    }
    return byCommit;
  }

  private toComparedPullRequest(
    pullRequest: GitPullRequest
  ): ComparedPullRequest {
    const id = pullRequest.pullRequestId ?? 0;
    return {
      id,
      title: pullRequest.title?.trim() || `Pull request #${id}`,
      url:
        pullRequest._links?.web?.href ??
        `${this.config.organizationUrl}/${encodeURIComponent(
          this.config.projectName
        )}/_git/${encodeURIComponent(
          this.config.repositoryId
        )}/pullrequest/${id}`,
      createdBy: this.adoIdentity(
        pullRequest.createdBy?.displayName,
        pullRequest.createdBy?.uniqueName,
        pullRequest.createdBy?.id
      ),
      reviewers: (pullRequest.reviewers ?? []).map((reviewer) =>
        this.adoIdentity(
          reviewer.displayName,
          reviewer.uniqueName,
          reviewer.id
        )
      ),
      workItemCount: pullRequest.workItemRefs?.length ?? 0,
    };
  }

  private gitIdentity(name?: string, email?: string): ComparisonIdentity {
    return {
      displayName: name?.trim() || email?.trim() || "Unknown contributor",
      ...(email?.trim() ? { email: email.trim() } : {}),
    };
  }

  private adoIdentity(
    displayName?: string,
    uniqueName?: string,
    id?: string
  ): ComparisonIdentity {
    return {
      displayName:
        displayName?.trim() || uniqueName?.trim() || "Unknown contributor",
      ...(uniqueName?.trim() ? { email: uniqueName.trim() } : {}),
      ...(id?.trim() ? { id: id.trim() } : {}),
    };
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  async createComparisonWorkItem(
    result: ComparisonResult,
    title: string,
    workItemType: string,
    summary: string
  ): Promise<{ id: number; url?: string }> {
    const workItemApi = await this.workItemApi;
    const changeLines = result.commits
      .slice(0, 50)
      .map((commit) =>
        commit.pullRequest
          ? `<li><a href="${escapeHtml(commit.pullRequest.url)}">PR #${
              commit.pullRequest.id
            }</a>: ${escapeHtml(commit.pullRequest.title)}</li>`
          : `<li><code>${commit.id.slice(0, 7)}</code>: ${escapeHtml(
              commit.message.split("\n")[0] || "No commit message"
            )}</li>`
      )
      .join("");
    const description = [
      `<p>${escapeHtml(summary)}</p>`,
      `<p><strong>Release risk:</strong> ${result.risk.level.toUpperCase()} (${result.risk.score}/100)</p>`,
      `<p><strong>Builds:</strong> ${escapeHtml(
        result.baseBuild.buildNumber
      )} → ${escapeHtml(result.targetBuild.buildNumber)}</p>`,
      `<ul>${changeLines}</ul>`,
    ].join("");
    const document = [
      {
        op: Operation.Add,
        path: "/fields/System.Title",
        value: title,
      },
      {
        op: Operation.Add,
        path: "/fields/System.Description",
        value: description,
      },
      {
        op: Operation.Add,
        path: "/fields/System.Tags",
        value: "Build Compare; Deployment",
      },
    ];
    const workItem = await workItemApi.createWorkItem(
      undefined,
      document,
      this.config.projectName,
      workItemType
    );
    if (!workItem.id) {
      throw new Error("Azure DevOps created a work item without an ID.");
    }
    return {
      id: workItem.id,
      ...(workItem._links?.html?.href
        ? { url: workItem._links.html.href as string }
        : {}),
    };
  }

  async getGitReferences(): Promise<GitReference[]> {
    const gitApiClient = await this.gitApi;
    const refs = await gitApiClient.getRefs(
      this.config.repositoryId,
      this.config.projectName,
      undefined,
      false,
      false,
      false,
      false,
      true
    );
    return refs
      .map((ref): GitReference | null => {
        if (!ref.name || !ref.objectId) {
          return null;
        }
        const branchPrefix = "refs/heads/";
        const tagPrefix = "refs/tags/";
        const kind = ref.name.startsWith(branchPrefix)
          ? "branch"
          : ref.name.startsWith(tagPrefix)
            ? "tag"
            : null;
        if (!kind) {
          return null;
        }
        return {
          name: ref.name,
          displayName: ref.name.slice(
            kind === "branch" ? branchPrefix.length : tagPrefix.length
          ),
          kind,
          commitId: ref.peeledObjectId ?? ref.objectId,
        };
      })
      .filter((ref): ref is GitReference => ref !== null)
      .sort((left, right) =>
        `${left.kind}:${left.displayName}`.localeCompare(
          `${right.kind}:${right.displayName}`
        )
      );
  }

}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
