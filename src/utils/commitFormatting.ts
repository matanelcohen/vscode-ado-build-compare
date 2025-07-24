import type { GitCommitRefFull } from '../interfaces/git';

export function commitToString(commit: string | GitCommitRefFull): string {
  if (typeof commit === 'string') {
    return commit;
  }
  if ('message' in commit && typeof commit.message === 'string') {
    return commit.message.split('\n')[0] || 'No commit message';
  }
  return 'No commit message';
}

export function convertCommitMapToStringMap(committerMap: {
  [committer: string]: (GitCommitRefFull | string)[];
}): { [committer: string]: string[] } {
  const stringMap: { [committer: string]: string[] } = {};
  for (const [committer, commits] of Object.entries(committerMap)) {
    stringMap[committer] = commits.map(commit => commitToString(commit));
  }
  return stringMap;
}
