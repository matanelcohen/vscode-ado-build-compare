// Interfaces related to Azure DevOps REST API responses

export interface IdentityRef {
  displayName: string;
  url: string;
  _links: any;
  id: string;
  uniqueName: string;
  imageUrl: string;
  descriptor: string;
}

export interface GitPullRequest {
  repository: {
    id: string;
    name: string;
    url: string;
    project: {
      id: string;
      name: string;
      state: string;
      visibility: string;
      lastUpdateTime: string;
    };
    size: number;
    remoteUrl: string;
    sshUrl: string;
    webUrl: string;
  };
  pullRequestId: number;
  codeReviewId: number;
  status: string; // e.g., "active", "completed", "abandoned"
  createdBy: IdentityRef;
  creationDate: string; // ISO 8601 date string
  title: string;
  description: string;
  sourceRefName: string; // e.g., "refs/heads/feature/my-feature"
  targetRefName: string; // e.g., "refs/heads/main"
  mergeStatus: string;
  isDraft: boolean;
  mergeId: string;
  lastMergeSourceCommit: { commitId: string; url: string };
  lastMergeTargetCommit: { commitId: string; url: string };
  lastMergeCommit: { commitId: string; url: string };
  reviewers: any[]; // Can be more specific if needed
  url: string;
  _links: any;
  supportsIterations: boolean;
  artifactId: string;
}

export interface GitPullRequestCommentThread {
  pullRequestThreadContext: {
    changeTrackingId: number;
    iterationContext: {
      firstComparingIteration: number;
      secondComparingIteration: number;
    };
    trackingCriteria: any; // Can be more specific if needed
  } | null;
  id: number;
  publishedDate: string; // ISO 8601 date string
  lastUpdatedDate: string; // ISO 8601 date string
  comments: GitPullRequestComment[];
  identities: any; // Dictionary of identities involved
  properties: any; // Custom properties
  isDeleted: boolean;
  threadContext: {
    filePath: string;
    rightFileStart: { line: number; offset: number } | null;
    rightFileEnd: { line: number; offset: number } | null;
    leftFileStart: { line: number; offset: number } | null;
    leftFileEnd: { line: number; offset: number } | null;
  } | null;
  status: string; // e.g., "active", "fixed", "wontFix", "closed", "byDesign"
  _links: any;
}

export interface GitPullRequestComment {
  id: number;
  parentCommentId: number;
  author: IdentityRef;
  content: string;
  publishedDate: string; // ISO 8601 date string
  lastUpdatedDate: string; // ISO 8601 date string
  lastContentUpdatedDate: string; // ISO 8601 date string
  commentType: string; // e.g., "text", "codeChange", "system"
  usersLiked: IdentityRef[];
  isDeleted: boolean;
  _links: any;
}

// Interface for the response when fetching multiple threads
export interface GetPullRequestThreadsResponse {
  value: GitPullRequestCommentThread[];
  count: number;
}

// Interface for the response when fetching multiple pull requests
export interface GetPullRequestsResponse {
    value: GitPullRequest[];
    count: number;
}

// Interface for updating a thread status
export interface UpdateThreadStatusPayload {
    status: string; // e.g., "1" for Active, "2" for ByDesign, "3" for Closed, "4" for Fixed, "5" for WontFix
}

// Interface for updating a comment
export interface UpdateCommentPayload {
    content: string;
}
