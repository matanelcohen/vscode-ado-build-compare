import assert from "node:assert/strict";
import test from "node:test";
import type { ComparedCommit } from "../src/models/comparison";
import { groupCommitsByAuthor } from "../src/utils/groupChanges";

test("groups pull requests and direct commits by their displayed author", () => {
  const commits: ComparedCommit[] = [
    {
      id: "one",
      message: "First pull request",
      author: { displayName: "Merge Service" },
      files: [],
      pullRequest: {
        id: 1,
        title: "First pull request",
        url: "https://example.test/pr/1",
        createdBy: {
          displayName: "Matanel Cohen",
          email: "Matanel@example.com",
        },
        reviewers: [],
        workItemCount: 0,
      },
    },
    {
      id: "two",
      message: "Second change",
      author: {
        displayName: "Matanel Cohen",
        email: "matanel@example.com",
      },
      files: [],
    },
    {
      id: "three",
      message: "Third change",
      author: { displayName: "Shai Lev", email: "shai@example.com" },
      files: [],
    },
  ];

  const groups = groupCommitsByAuthor(commits);

  assert.deepEqual(
    groups.map((group) => ({
      author: group.author.displayName,
      commits: group.commits.map((commit) => commit.id),
    })),
    [
      { author: "Matanel Cohen", commits: ["one", "two"] },
      { author: "Shai Lev", commits: ["three"] },
    ]
  );
});
