export interface IdentityRef {
  displayName: string;
  url: string;
  _links: Record<string, { href: string }>;
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
  status: string;
  createdBy: IdentityRef;
  creationDate: string;
  title: string;
  description: string;
  sourceRefName: string;
  targetRefName: string;
  mergeStatus: string;
  isDraft: boolean;
  mergeId: string;
  lastMergeSourceCommit: { commitId: string; url: string };
  lastMergeTargetCommit: { commitId: string; url: string };
  lastMergeCommit: { commitId: string; url: string };
  reviewers: IdentityRef[];
  url: string;
  _links: Record<string, { href: string }>;
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
    trackingCriteria: Record<string, unknown>;
  } | null;
  id: number;
  publishedDate: string;
  lastUpdatedDate: string;
  comments: GitPullRequestComment[];
  identities: Record<string, IdentityRef>;
  properties: Record<string, unknown>;
  isDeleted: boolean;
  threadContext: {
    filePath: string;
    rightFileStart: { line: number; offset: number } | null;
    rightFileEnd: { line: number; offset: number } | null;
    leftFileStart: { line: number; offset: number } | null;
    leftFileEnd: { line: number; offset: number } | null;
  } | null;
  status: string;
  _links: Record<string, { href: string }>;
}

export interface GitPullRequestComment {
  id: number;
  parentCommentId: number;
  author: IdentityRef;
  content: string;
  publishedDate: string;
  lastUpdatedDate: string;
  lastContentUpdatedDate: string;
  commentType: string;
  usersLiked: IdentityRef[];
  isDeleted: boolean;
  _links: Record<string, { href: string }>;
}

export interface GetPullRequestThreadsResponse {
  value: GitPullRequestCommentThread[];
  count: number;
}

export interface GetPullRequestsResponse {
    value: GitPullRequest[];
    count: number;
}

export interface UpdateThreadStatusPayload {
    status: string;
}

export interface UpdateCommentPayload {
    content: string;
}
