import type { GitCommit } from 'azure-devops-node-api/interfaces/GitInterfaces';

export function commitToString(commit: string | GitCommit): string {
  if (typeof commit === 'string') {
    return commit;
  }
  if ('comment' in commit && typeof commit.comment === 'string') {
    return commit.comment.split('\n')[0] || 'No commit message';
  }
  return 'No commit message';
}

export function convertCommitMapToStringMap(committerMap: {
  [committer: string]: (GitCommit | string)[];
}): { [committer: string]: string[] } {
  const stringMap: { [committer: string]: string[] } = {};
  for (const [committer, commits] of Object.entries(committerMap)) {
    stringMap[committer] = commits.map(commit => commitToString(commit));
  }
  return stringMap;
}
