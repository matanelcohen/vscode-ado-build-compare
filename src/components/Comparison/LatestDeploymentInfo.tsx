import React from 'react';
import {
  makeStyles,
  mergeClasses,
  shorthands,
  tokens,
  Text,
  Link,
} from "@fluentui/react-components";
import { PipelineRun } from "../../api-sdk";

const useStyles = makeStyles({
  card: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.padding("24px"),
    marginBottom: "24px",
    boxShadow: tokens.shadow4,
  },
  deploymentInfoContainer: {
    display: "flex",
    alignItems: "flex-start",
    ...shorthands.gap("16px"),
    ...shorthands.padding("16px"),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
  },
  deploymentTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: "8px",
  },
  deploymentDetails: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    "& > div": {
      marginBottom: "4px",
    },
  },
  detailLabel: {
    fontWeight: tokens.fontWeightSemibold,
  },
  commitHash: {
    fontFamily: tokens.fontFamilyMonospace,
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.padding("2px", "6px"),
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    fontSize: tokens.fontSizeBase200,
  },
  errorHash: {
    backgroundColor: tokens.colorPaletteRedBackground1,
    color: tokens.colorPaletteRedForeground1,
  },
  commitMessage: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
    marginTop: "8px",
    padding: "8px",
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
    lineHeight: "1.4",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontFamily: tokens.fontFamilyBase,
  },
  viewButton: {},
  link: {
    color: tokens.colorBrandForegroundLink,
    "&:hover": {
      color: tokens.colorBrandForegroundLinkHover,
      textDecoration: "underline",
    },
  },
});

function getTimeAgo(dateString: string | null | undefined): string {
  if (!dateString) return "N/A";

  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString();
}

interface LatestDeploymentInfoProps {
  run: PipelineRun;
  title: string;
}

export const LatestDeploymentInfo: React.FC<LatestDeploymentInfoProps> = ({
  run,
  title,
}) => {
  const styles = useStyles();
  const shortCommit = run.sourceVersion
    ? run.sourceVersion.substring(0, 7)
    : "Unknown";
  const timeAgo = getTimeAgo(run.finishTime);
  const hasValidCommit = !!run.sourceVersion;
  const commitMessage = run.commitMessage?.trim();

  return (
    <div className={styles.card}>
      <Text block className={styles.deploymentTitle} as="h3">
        {title}
      </Text>
      <div className={styles.deploymentInfoContainer}>
        <div style={{ flex: 1 }}>
          <div className={styles.deploymentDetails}>
            <div>
              <span className={styles.detailLabel}>Build:</span>{" "}
              {run._links?.web?.href ? (
                <Link
                  href={run._links.web.href}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.link}
                >
                  {run.buildNumber}
                </Link>
              ) : (
                <span>{run.buildNumber}</span>
              )}
              {` (ID: ${run.id})`}
            </div>
            <div>
              <span className={styles.detailLabel}>Commit:</span>{" "}
              <span
                className={mergeClasses(
                  styles.commitHash,
                  !hasValidCommit && styles.errorHash
                )}
                title={run.sourceVersion || "Commit hash not available"}
              >
                {shortCommit}
              </span>
            </div>
            <div>
              <span className={styles.detailLabel}>Finished:</span>{" "}
              <span
                title={
                  run.finishTime
                    ? new Date(run.finishTime).toLocaleString()
                    : "N/A"
                }
              >
                {timeAgo}
              </span>
            </div>
          </div>
          {commitMessage && (
            <div>
              <div style={{ marginTop: "8px", marginBottom: "4px" }}>
                <span className={styles.detailLabel}>Message:</span>
              </div>
              <div className={styles.commitMessage}>{commitMessage}</div>
            </div>
          )}
        </div>
        <div>
          {run._links?.web?.href ? (
            <Link
              href={run._links.web.href}
              target="_blank"
              rel="noreferrer"
              className={styles.link}
            >
              View in Azure DevOps
            </Link>
          ) : (
            <span className={styles.link} style={{ opacity: 0.5 }}>
              View in Azure DevOps (URL not available)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
