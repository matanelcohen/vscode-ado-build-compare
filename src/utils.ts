export function generateMarkdownForTeams(
  committerMap: { [committer: string]: string[] } | null
): string {
  if (!committerMap || Object.keys(committerMap).length === 0) {
    return "No relevant frontend changes found.";
  }

  let markdown = "**Frontend Changes by Committer:**\n\n";

  Object.keys(committerMap).forEach((committer) => {
    markdown += `**${committer}:**\n`;
    committerMap[committer].forEach((line) => {
      let cleanedLine = line.replace(/<[^>]*>/g, "").trim();
      cleanedLine = cleanedLine.replace(/^\*?\s*/, "");
      const linkRegex =
        /(\[(.*?)\]\((https?:\/\/[^)]+)\))|(https?:\/\/[^\s]+)/g;
      cleanedLine = cleanedLine.replace(
        linkRegex,
        (
          match,
          existingMarkdownLink,
          linkText,
          urlFromMarkdown,
          standaloneUrl
        ) => {
          if (existingMarkdownLink) {
            return existingMarkdownLink;
          } else if (standaloneUrl) {
            return `[link](${standaloneUrl})`;
          }
          return match;
        }
      );
      markdown += `* ${cleanedLine}\n`;
    });
    markdown += "\n";
  });

  return markdown.trim();
}
