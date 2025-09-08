import React, { useRef } from 'react';
import {
  Button,
  Card,
  makeStyles,
  shorthands,
  tokens,
  Body1,
  Caption1,
  Title3,
  Tooltip,
} from "@fluentui/react-components";
import { PipelineRun } from "../../api-sdk";

const useStyles = makeStyles({
  card: {
    // ...comparisonStyles.card, // Adapt or replace styles from comparisonStyles.card
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalL),
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalL,
  },
  title: {
    // ...comparisonStyles.deploymentTitle, // Adapt or replace
    marginBottom: tokens.spacingVerticalM,
  },
  buildList: {
    // ...comparisonStyles.buildList, // Adapt or replace
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalS,
    maxHeight: "400px", // Example max height for scroll
    overflowY: "auto",
  },
  buildItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
    backgroundColor: "var(--vscode-editor-background)", // Use VSCode variables
    color: "var(--vscode-foreground)",
    ...shorthands.border("1px", "solid", "var(--vscode-editorWidget-border)"),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    cursor: "pointer",
    transitionProperty: "all",
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    "&:hover": {
      backgroundColor: "var(--vscode-list-hoverBackground)",
      ...shorthands.border("1px", "solid", "var(--vscode-focusBorder)"),
    },
  },
  buildItemSelected: {
    backgroundColor: "var(--vscode-list-activeSelectionBackground)",
    color: "var(--vscode-list-activeSelectionForeground)",
    ...shorthands.border("1px", "solid", "var(--vscode-focusBorder)"),
    "&:hover": {
      backgroundColor: "var(--vscode-list-activeSelectionBackground)",
    },
  },
  commitHash: {
    fontFamily: "monospace",
    ...shorthands.padding("2px", "6px"),
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    fontSize: tokens.fontSizeBase200,
    backgroundColor: "var(--vscode-textCodeBlock-background)",
    marginLeft: tokens.spacingHorizontalM,
  },
  buildInfo: {
    display: "flex",
    alignItems: "center",
    flexGrow: 1, // Allow info section to grow
    overflow: "hidden", // Hide overflow
    whiteSpace: "nowrap", // Prevent wrapping in the main container
  },
  commitMessage: {
    marginLeft: tokens.spacingHorizontalM,
    color: "var(--vscode-descriptionForeground)",
    overflow: "hidden", // Hide overflow
    textOverflow: "ellipsis", // Add ellipsis
    whiteSpace: "nowrap", // Prevent wrapping
    flexShrink: 1, // Allow message to shrink if needed
    maxWidth: '400px', // Limit max width to prevent pushing out date
  },
  buildDate: {
    color: "var(--vscode-descriptionForeground)",
    marginLeft: tokens.spacingHorizontalM, // Add margin to separate from message
    flexShrink: 0, // Prevent date from shrinking
  },
  actionBar: {
    // ...comparisonStyles.actionBar, // Adapt or replace
    display: "flex",
    justifyContent: "flex-end", // Align button to the right
    marginTop: tokens.spacingVerticalM,
  },
  disabledItem: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
});

interface BuildSelectorProps {
  builds: PipelineRun[];
  selectedBuildId: number | null;
  onSelect: (buildId: number) => void;
  onCompare: () => void;
  disabled?: boolean;
}

export const BuildSelector: React.FC<BuildSelectorProps> = ({
  builds,
  selectedBuildId,
  onSelect,
  onCompare,
  disabled,
}) => {
  const styles = useStyles();
  const compareButtonRef = useRef<any>(null); // Create a ref for the button

  const handleSelect = (buildId: number) => {
    if (disabled) return;
    onSelect(buildId);
    // Focus the compare button after selection
    compareButtonRef.current?.focus();
  };

  return (
    <Card className={styles.card}>
      <Title3 className={styles.title}>Select a build to compare</Title3>
      <div className={styles.buildList}>
        {builds.map((build) => {
          const isSelected = build.id === selectedBuildId;
          return (
            <div
              key={build.id}
              className={`${styles.buildItem} ${
                isSelected ? styles.buildItemSelected : ""
              } ${disabled ? styles.disabledItem : ""}`}
              onClick={() => handleSelect(build.id)} // Use the new handler
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-pressed={isSelected}
              aria-disabled={disabled}
            >
              <div className={styles.buildInfo}>
                <Body1>Build {build.buildNumber}</Body1>
                {build.sourceVersion && (
                  <Caption1 className={styles.commitHash}>
                    {build.sourceVersion.substring(0, 7)}
                  </Caption1>
                )}
                {/* Display Commit Message */}
                {build.commitMessage && (
                  <Tooltip content={build.commitMessage} relationship="label">
                    <Caption1 className={styles.commitMessage} truncate>
                      {build.commitMessage.split("\n")[0]}{" "}
                      {/* Show first line */}
                    </Caption1>
                  </Tooltip>
                )}
              </div>
              <Caption1 className={styles.buildDate}>
                {build.finishTime
                  ? new Date(build.finishTime).toLocaleDateString()
                  : "In Progress"}
              </Caption1>
            </div>
          );
        })}
      </div>
      <div className={styles.actionBar}>
        <Button
          ref={compareButtonRef} // Attach the ref to the button
          appearance="primary"
          onClick={onCompare}
          disabled={disabled || selectedBuildId === null}
        >
          Compare Builds
        </Button>
      </div>
    </Card>
  );
};
