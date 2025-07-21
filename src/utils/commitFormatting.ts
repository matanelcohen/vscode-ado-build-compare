// import { GitCommit } from '../interfaces/git';
import type { GitCommit } from '../interfaces/git'; // Use 'import type' if GitCommit is a type, or update the import to match the actual export

export function commitToString(commit: string | GitCommit): string {
  if (typeof commit === 'string') {
    return commit;
  }
  // Type guard: check if commit has a 'message' property
  if ('message' in commit && typeof commit.message === 'string') {
    return commit.message.split('\n')[0] || 'No commit message';
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
