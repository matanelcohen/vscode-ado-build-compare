export interface GitCommitRef {
  commitId: string;
  url: string;
}

export interface GitUserDate {
  name: string;
  email: string;
  date: string;
}

export interface GitCommitRefFull extends GitCommitRef {
  author: GitUserDate;
  committer: GitUserDate;
  comment: string;
  changeCounts?: {
    Add: number;
    Edit: number;
    Delete: number;
  };
  changes?: GitChange[];
  parents?: string[];
  _links?: Record<string, { href: string }>;
}

export interface GitChange {
  changeType: string;
  item: {
    gitObjectType: string;
    path: string;
    url: string;
  };
  newContent?: {
    content: string;
    contentType: string;
  };
  originalPath?: string;
}

export interface GitRepository {
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
  defaultBranch: string;
}

export interface GitBranchStats {
  name: string;
  aheadCount: number;
  behindCount: number;
  commit: GitCommitRef;
  isBaseVersion: boolean;
}

export interface GetCommitsResponse {
  value: GitCommitRefFull[];
  count: number;
}

export interface GitPush {
  pushId: number;
  date: string;
  pushedBy: {
    id: string;
    displayName: string;
    uniqueName: string;
  };
  commits: GitCommitRefFull[];
  refUpdates: {
    name: string;
    oldObjectId: string;
    newObjectId: string;
  }[];
  repository: GitRepository;
  _links?: Record<string, { href: string }>;
}
