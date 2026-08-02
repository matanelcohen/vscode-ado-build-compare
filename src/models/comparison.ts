import type { PipelineRun } from "../api-sdk";

export interface ComparisonIdentity {
  displayName: string;
  email?: string;
  id?: string;
}

export interface ComparedFile {
  path: string;
  changeType: string;
}

export interface ComparedPullRequest {
  id: number;
  title: string;
  url: string;
  createdBy: ComparisonIdentity;
  reviewers: ComparisonIdentity[];
  workItemCount: number;
}

export interface ComparedCommit {
  id: string;
  message: string;
  author: ComparisonIdentity;
  committedAt?: string;
  files: ComparedFile[];
  pullRequest?: ComparedPullRequest;
}

export interface ComparisonResult {
  baseBuild: PipelineRun;
  targetBuild: PipelineRun;
  commits: ComparedCommit[];
  pullRequests: ComparedPullRequest[];
  directCommits: ComparedCommit[];
  contributors: ComparisonIdentity[];
  files: ComparedFile[];
  pathFilters: string[];
  warnings: string[];
  risk: ReleaseRisk;
  analysis?: {
    totalCommits: number;
    excludedCommits: number;
    inspectionFailures?: number;
    inspectedFiles: number;
    durationMs: number;
  };
}

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface RiskSignal {
  id: string;
  label: string;
  description: string;
  score: number;
}

export interface ReleaseRisk {
  score: number;
  level: RiskLevel;
  signals: RiskSignal[];
}

export interface TeamsMention {
  displayName: string;
  userId: string;
}

export interface GitReference {
  name: string;
  displayName: string;
  kind: "branch" | "tag";
  commitId: string;
}

export interface TeamsShareRequest {
  title: string;
  comparison: ComparisonResult;
  mentions: TeamsMention[];
  summary?: string;
}
