import * as React from "react";
import {
  Link,
  makeStyles,
  tokens,
  Body1,
  Body1Strong,
} from "@fluentui/react-components";
import { PipelineRun } from "../interfaces/pipeline";

interface LatestDeploymentInfoProps {
  run: PipelineRun;
  title: string;
}

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalS, // Use tokens for gap
  },
  text: {
    color: "var(--vscode-foreground)", // Use VSCode variable
  },
  link: {
    color: "var(--vscode-textLink-foreground)", // Use VSCode variable
    textDecorationLine: "none", // Default link style in v9 might have underline
    ":hover": {
      color: "var(--vscode-textLink-activeForeground)",
      textDecorationLine: "underline",
    },
  },
  label: {
    display: "inline-block",
    minWidth: "70px", // Align values
  },
});

export const LatestDeploymentInfo: React.FC<LatestDeploymentInfoProps> = ({
  run,
  title,
}) => {
  const styles = useStyles();
  return (
    <div className={styles.root}>
      <Body1 className={styles.text}>
        <Body1Strong className={styles.label}>{title}:</Body1Strong> Build{" "}
        {run.buildNumber} (ID: {run.id})
      </Body1>
      <Body1 className={styles.text}>
        <Body1Strong className={styles.label}>Commit:</Body1Strong>{" "}
        {run.sourceVersion ? run.sourceVersion.substring(0, 8) : "N/A"}
      </Body1>
      <Body1 className={styles.text}>
        <Body1Strong className={styles.label}>Finished:</Body1Strong>{" "}
        {run.finishTime ? new Date(run.finishTime).toLocaleString() : "N/A"}
      </Body1>
      <Body1 className={styles.text}>
        <Body1Strong className={styles.label}>Link:</Body1Strong>{" "}
        {run._links?.web?.href ? (
          <Link
            href={run._links.web.href}
            target="_blank"
            rel="noreferrer"
            className={styles.link}
            inline // Render link inline with text
          >
            View in ADO
          </Link>
        ) : (
          <span style={{ opacity: 0.5 }}>View in ADO (URL not available)</span>
        )}
      </Body1>
    </div>
  );
};
