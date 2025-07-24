// Helper function to parse the commit string (same as in CommitComparisonResults)
const parseCommitString = (commitString: string) => {
  const prRegex = /# PR (\d+) Message: (.*?)\s*-\s*<a href="(.*?)"/;
  const match = commitString.match(prRegex);

  if (match) {
    return {
      prNumber: match[1],
      message: (match[2] ?? "").trim(),
      link: match[3],
    };
  }
  // Fallback if parsing fails
  return { prNumber: null, message: commitString, link: null };
};

export function generatePlainTextResults(committerMap: { [committer: string]: string[] }): string {
  let plainText = 'Comparison Results:\n\n';
  for (const [committer, commits] of Object.entries(committerMap)) {
    plainText += `${committer} (${commits.length} ${commits.length === 1 ? "commit" : "commits"}):\n`;
    for (const commitStr of commits) {
      const { prNumber, message, link } = parseCommitString(commitStr);
      if (prNumber) {
        plainText += `  - PR #${prNumber}: ${message}\n`;
        // Optionally include the link on a new line or appended
        plainText += `    Link: ${link}\n`;
      } else {
        // Fallback for messages that couldn't be parsed
        plainText += `  - ${message}\n`;
      }
    }
    plainText += '\n'; // Add a blank line between committers
  }
  return plainText;
}
