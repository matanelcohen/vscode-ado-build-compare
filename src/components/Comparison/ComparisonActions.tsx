import React from 'react';
import { Button, makeStyles, tokens } from "@fluentui/react-components";

// Define styles using makeStyles
const useStyles = makeStyles({
  root: {
    padding: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow4,
  },
  actionBar: {
    display: "flex",
    alignItems: "center",
    columnGap: tokens.spacingHorizontalS,
  },
  copyStatus: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
  },
  error: {
    color: tokens.colorPaletteRedForeground1,
    marginTop: tokens.spacingVerticalS,
    fontSize: tokens.fontSizeBase300,
  },
});

interface ComparisonActionsProps {
  onReset: () => void;
  onCopy: () => void;
  copyStatus: string;
  hasResults: boolean;
  isLoading: boolean;
  comparisonLoading: boolean;
  comparisonError: string | null;
}

export const ComparisonActions: React.FC<ComparisonActionsProps> = ({
  onReset,
  onCopy,
  copyStatus,
  hasResults,
  isLoading,
  comparisonLoading,
  comparisonError,
}) => {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <div className={styles.actionBar}>
        <Button
          appearance="secondary"
          onClick={onReset}
          disabled={isLoading || comparisonLoading}
        >
          Select Different Build
        </Button>
        {hasResults && !comparisonError && (
          <Button
            appearance="primary" // Use primary for the main action
            onClick={onCopy}
            disabled={isLoading || comparisonLoading}
          >
            Copy Results
          </Button>
        )}
        {copyStatus && <div className={styles.copyStatus}>{copyStatus}</div>}
      </div>
      {comparisonError && <div className={styles.error}>{comparisonError}</div>}
    </div>
  );
};
