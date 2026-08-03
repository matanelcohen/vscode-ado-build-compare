import {
  ComparedCommit,
  ComparisonIdentity,
} from "../models/comparison";

export interface AuthorChangeGroup {
  key: string;
  author: ComparisonIdentity;
  commits: ComparedCommit[];
}

export function groupCommitsByAuthor(
  commits: ComparedCommit[]
): AuthorChangeGroup[] {
  const groups = new Map<string, AuthorChangeGroup>();
  for (const commit of commits) {
    const author = commit.pullRequest?.createdBy ?? commit.author;
    const key = (
      author.email ??
      author.id ??
      author.displayName
    ).toLocaleLowerCase();
    const group = groups.get(key);
    if (group) {
      group.commits.push(commit);
    } else {
      groups.set(key, {
        key,
        author,
        commits: [commit],
      });
    }
  }
  return [...groups.values()];
}
