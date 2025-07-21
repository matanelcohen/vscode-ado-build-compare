export interface GitCommitRefFull {
  commitId: string;
  comment: string;
  committer?: { name?: string; date?: string };
  author?: { name?: string; date?: string };
}

export interface GitCommitChangesResponse {
  changes: { item: { path: string } }[];
}

// Type definition for a Git commit object
export interface GitCommit {
  commitId: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  committer: {
    name: string;
    email: string;
    date: string;
  };
  message: string;
  parents?: string[];
  // Add more fields as needed for your use case
}
