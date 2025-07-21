import React from 'react';
import {
  Card,
  Text,
  makeStyles,
  shorthands,
  tokens,
  Divider,
  Body1,
  Caption1,
  Title3,
  Link, // Import Link
} from "@fluentui/react-components";

interface Commit {
  message: string;
  // Add other properties if needed
}

interface CommitComparisonResultsProps {
  committerMap: { [committer: string]: (string | Commit)[] } | null;
  loading: boolean; // Note: Loading state is not handled in this component's render logic
  error: string | null;
}

const useStyles = makeStyles({
  card: {
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalL),
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalL,
  },
  title: {
    // ...comparisonStyles.deploymentTitle, // Adapt or replace
  },
  error: {
    color: tokens.colorPaletteRedForeground1,
  },
  committerGroup: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalS,
  },
  committerName: {
    fontWeight: tokens.fontWeightSemibold,
  },
  commitList: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalS, // Increased gap slightly
    paddingLeft: tokens.spacingHorizontalM,
  },
  commitItem: {
    display: "flex",
    flexDirection: "column", // Stack elements vertically
    gap: tokens.spacingVerticalXS,
  },
  commitMessageText: {
    // Style for the main commit message part
    color: "var(--vscode-foreground)", // Use standard foreground
  },
  prLink: {
    // Style for the PR link
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorBrandForegroundLink,
    textDecorationLine: "none",
    ":hover": {
      textDecorationLine: "underline",
    },
  },
  prNumber: {
    fontWeight: tokens.fontWeightSemibold,
    marginRight: tokens.spacingHorizontalXS,
  },
  pathFilterNote: {
    color: tokens.colorNeutralForeground3, // Use a less prominent color
    marginTop: tokens.spacingVerticalM,
  },
  divider: {
    marginTop: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalM,
  },
});

// Helper function to parse the commit string
const parseCommitString = (commitString: string) => {
  const prRegex = /# PR (\d+) Message: (.*?)\s*-\s*<a href="(.*?)"/;
  const match = commitString.match(prRegex);

  if (match) {
    return {
      prNumber: match[1],
      message: match[2].trim(),
      link: match[3],
    };
  }
  // Fallback if parsing fails
  return { prNumber: null, message: commitString, link: null };
};

export const CommitComparisonResults: React.FC<CommitComparisonResultsProps> = ({
  committerMap,
  loading,
  error,
}) => {
  const styles = useStyles();

  if (error) {
    return (
      <Card className={styles.card}>
        <Text className={styles.error}>Error comparing commits: {error}</Text>
      </Card>
    );
  }

  if (loading || !committerMap || Object.keys(committerMap).length === 0) {
    return null;
  }

  return (
    <Card className={styles.card}>
      <Title3 className={styles.title}>Comparison Results</Title3>
      {Object.entries(committerMap).map(([committer, commits], index) => (
        <React.Fragment key={committer}>
          {index > 0 && <Divider className={styles.divider} />}
          <div className={styles.committerGroup}>
            <Body1 className={styles.committerName}>
              {committer} ({commits.length}{" "}
              {commits.length === 1 ? "commit" : "commits"})
            </Body1>
            <div className={styles.commitList}>
              {commits.map((commit, idx) => {
                // Ensure commit is a string before parsing
                const commitStr = typeof commit === 'string' ? commit : (commit as any).message || '';
                const { prNumber, message, link } = parseCommitString(commitStr);

                return (
                  <div key={idx} className={styles.commitItem}>
                    <Text className={styles.commitMessageText}>
                      {prNumber && <span className={styles.prNumber}>PR #{prNumber}:</span>}
                      {message}
                    </Text>
                    {link && (
                      <Link href={link} target="_blank" rel="noreferrer" className={styles.prLink}>
                        View PR #{prNumber}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </React.Fragment>
      ))}
      <Caption1 className={styles.pathFilterNote}>
        Note: Only showing commits that modified relevant files based on the
        configured path filter.
      </Caption1>
    </Card>
  );
};
