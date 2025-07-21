interface Identity {
  id?: string;
  displayName?: string;
}

interface Identities {
  [key: string]: Identity;
}

export const replaceGuidsWithNames = (content: string, identities?: Identities): string => {
  if (!content || !identities) return content;

  return content.replace(/@<([A-F0-9-]+)>/gi, (match, guid) => {
    // Find the identity where id matches the guid (case-insensitive, ignore dashes)
    const found = Object.values(identities).find(
      (identity) =>
        identity?.id?.replace(/-/g, '').toLowerCase() === guid.replace(/-/g, '').toLowerCase()
    );

    return found?.displayName ? `@${found.displayName}` : match;
  });
};

export const truncateText = (text: string, maxLength: number = 120): string => {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleString();
};

export const getThreadSummary = (content: string, identities?: Identities): string => {
  const formattedContent = replaceGuidsWithNames(content, identities);
  return truncateText(formattedContent);
};
