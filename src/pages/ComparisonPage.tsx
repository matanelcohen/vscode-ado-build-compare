import * as React from "react";
import {
  makeStyles,
  shorthands,
  Spinner,
  Text,
  Title1,
  Body1,
} from "@fluentui/react-components";
import { BuildSelector } from "../components/Comparison"; // Updated import path
import { useAuthAndConfig } from "../hooks/useAccessToken";
import { useBuildData } from "../hooks/useBuildData";
import { useCommitComparison } from "../hooks/useCommitComparison";
import { LatestDeploymentInfo } from "../components/Comparison/LatestDeploymentInfo"; // Updated import path
import { CommitComparisonResults } from "../components/Comparison/CommitComparisonResults"; // Updated import path
import { ComparisonActions } from "../components/Comparison/ComparisonActions"; // Updated import path
import { generatePlainTextResults } from "../utils/generatePlainTextResults"; // Updated import path

// Define styles using makeStyles
const useStyles = makeStyles({
  root: {
    ...shorthands.padding("24px"),
    minWidth: "350px",
    color: "var(--vscode-foreground)",
    backgroundColor: "var(--vscode-editor-background)",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  title: {
    color: "var(--vscode-foreground)",
  },
  errorText: {
    color: "var(--vscode-errorForeground)",
    backgroundColor: "var(--vscode-inputValidation-errorBackground)",
    ...shorthands.border(
      "1px",
      "solid",
      "var(--vscode-inputValidation-errorBorder)"
    ),
    ...shorthands.padding("10px"),
    ...shorthands.borderRadius("4px"),
  },
  loadingSpinner: {
    alignSelf: "center",
    paddingBlock: "20px",
  },
  pathFilter: {
    padding: "12px 16px",
    backgroundColor: "var(--vscode-textBlockQuote-background)",
    border: "1px solid var(--vscode-textBlockQuote-border)",
    borderRadius: "4px",
    marginBottom: "16px",
    fontSize: "14px",
    color: "var(--vscode-textBlockQuote-foreground)",
    fontWeight: "bold",
  },
});

interface ComparisonPageProps {
  vscode: any;
}

export const ComparisonPage: React.FC<ComparisonPageProps> = ({ vscode }) => {
  const styles = useStyles();
  const {
    accessToken,
    config,
    error: authError,
    loading: authLoading,
  } = useAuthAndConfig(vscode);

  const {
    olderRun,
    builds,
    loading: buildLoading,
    error: buildError,
  } = useBuildData(accessToken, config);

  const {
    committerMap,
    loading: comparisonLoading,
    error: comparisonError,
    compareCommits,
    resetComparison,
  } = useCommitComparison();

  const [selectedBuildId, setSelectedBuildId] = React.useState<number | null>(
    null
  );
  const [copyStatus, setCopyStatus] = React.useState<string>("");

  const selectedBuild = React.useMemo(() => {
    return builds.find((b) => b.id === selectedBuildId) || null;
  }, [builds, selectedBuildId]);

  const handleSelectBuild = (buildId: number) => {
    setSelectedBuildId(buildId);
    setCopyStatus("");
  };

  const handleCompare = async () => {
    if (!accessToken || !olderRun || !selectedBuild || !config) return;
    setCopyStatus("");
    await compareCommits(accessToken, olderRun, selectedBuild, config);
  };

  const handleReset = () => {
    setSelectedBuildId(null);
    resetComparison();
    setCopyStatus("");
  };

  const handleCopyResults = async () => {
    if (!committerMap) return;
    const textToCopy = generatePlainTextResults(committerMap);
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopyStatus("Copied!");
      setTimeout(() => setCopyStatus(""), 2000);
    } catch (err) {
      console.error("Failed to copy results: ", err);
      setCopyStatus("Failed to copy");
      setTimeout(() => setCopyStatus(""), 2000);
    }
  };

  const isLoading = authLoading || buildLoading;
  const currentError = authError || buildError;
  const isComparisonActive =
    comparisonLoading || !!committerMap || !!comparisonError;
  const hasResults = !!committerMap && Object.keys(committerMap).length > 0;

  return (
    <div className={styles.root}>
      <Title1 as="h1" className={styles.title}>
        What&apos;s changed from the last successful deployment?
      </Title1>

      {isLoading && (
        <Spinner
          className={styles.loadingSpinner}
          label="Loading configuration and data..."
        />
      )}
      {currentError && (
        <Body1 className={styles.errorText}>{currentError}</Body1>
      )}

      {!isLoading && !currentError && olderRun && config && (
        <>
          <LatestDeploymentInfo
            run={olderRun}
            title="Latest successful deployment"
          />
          {selectedBuild && (
            <LatestDeploymentInfo
              run={selectedBuild}
              title="Selected build to compare"
            />
          )}

          {!isComparisonActive ? (
            <>
              <Text className={styles.pathFilter}>
                Showing changes within:{" "}
                {config.relevantPathFilter || "all paths"}
              </Text>
              <BuildSelector
                builds={builds}
                selectedBuildId={selectedBuildId}
                onSelect={handleSelectBuild}
                onCompare={handleCompare}
                disabled={isLoading || comparisonLoading || !config}
              />
            </>
          ) : (
            <ComparisonActions
              onReset={handleReset}
              onCopy={handleCopyResults}
              copyStatus={copyStatus}
              hasResults={hasResults}
              comparisonError={comparisonError}
              isLoading={isLoading}
              comparisonLoading={comparisonLoading}
            />
          )}
        </>
      )}

      {/* Results are now rendered inside ComparisonActions or BuildSelector based on state */}
      {/* Render comparison results only when not loading and results/error exist */}
      {!comparisonLoading && (committerMap || comparisonError) && (
        <CommitComparisonResults
          committerMap={committerMap}
          loading={false} // Pass loading false as spinner is handled above
          error={comparisonError}
        />
      )}
      {/* Show comparison spinner separately */}
      {comparisonLoading && (
        <Spinner
          className={styles.loadingSpinner}
          label="Comparing builds..."
        />
      )}
    </div>
  );
};
