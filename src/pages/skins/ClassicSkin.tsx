import * as React from "react";
import {
  Body1,
  Spinner,
  Tab,
  TabList,
  TabValue,
  Text,
  makeStyles,
  shorthands,
} from "@fluentui/react-components";
import { BuildSelector } from "../../components/Comparison";
import { LatestDeploymentInfo } from "../../components/Comparison/LatestDeploymentInfo";
import { CommitComparisonResults } from "../../components/Comparison/CommitComparisonResults";
import { ComparisonActions } from "../../components/Comparison/ComparisonActions";
import { TeamsShare } from "../../components/Comparison/TeamsShare";
import { ReportActions } from "../../components/Comparison/ReportActions";
import { ComparisonHistory } from "../../components/Comparison/ComparisonHistory";
import { ReferenceComparison } from "../../components/Comparison/ReferenceComparison";
import { ComparisonTab } from "../../models/webviewState";
import { SkinProps } from "./types";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  loadingSpinner: {
    alignSelf: "center",
    paddingBlock: "20px",
  },
  pathFilter: {
    padding: "12px 16px",
    backgroundColor: "var(--vscode-textBlockQuote-background)",
    ...shorthands.border(
      "1px",
      "solid",
      "var(--vscode-textBlockQuote-border)"
    ),
    borderRadius: "4px",
    marginBottom: "16px",
    fontSize: "14px",
    color: "var(--vscode-textBlockQuote-foreground)",
    fontWeight: "bold",
  },
});

/** The original ReleaseLens layout, kept as a selectable skin. */
export const ClassicSkin: React.FC<SkinProps> = ({ workspace }) => {
  const styles = useStyles();
  const {
    config,
    profile,
    olderRun,
    comparisonBuilds,
    targetBuilds,
    baseBuild,
    selectedBuild,
    selectedBuildId,
    result,
    releaseSummary,
    setReleaseSummary,
    loadComparison,
    historyRefreshKey,
    isLoading,
    comparisonLoading,
    currentError,
    comparisonError,
    isComparisonActive,
    hasResults,
    copyStatus,
    selectedTab,
    selectTab,
    selectBuild,
    selectBaseBuild,
    compare,
    reset,
    copyResults,
  } = workspace;

  return (
    <div className={styles.root}>
      <TabList
        selectedValue={selectedTab}
        onTabSelect={(_event, data) => selectTab(data.value as ComparisonTab)}
      >
        <Tab value={"compare" as TabValue}>Compare</Tab>
        <Tab value={"changes" as TabValue}>Changes</Tab>
        <Tab value={"share" as TabValue}>Share &amp; export</Tab>
        <Tab value={"history" as TabValue}>History</Tab>
      </TabList>

      {isLoading && (
        <Spinner
          className={styles.loadingSpinner}
          label="Loading configuration and data..."
        />
      )}

      {selectedTab === "compare" &&
        !isLoading &&
        !currentError &&
        olderRun &&
        config && (
          <>
            <LatestDeploymentInfo
              run={baseBuild ?? olderRun}
              title={
                baseBuild?.id === olderRun.id
                  ? "Latest successful deployment (base)"
                  : "Selected base build"
              }
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
                  baseBuilds={comparisonBuilds}
                  baseBuildId={baseBuild?.id ?? null}
                  builds={targetBuilds}
                  selectedBuildId={selectedBuildId}
                  onSelect={selectBuild}
                  onSelectBase={selectBaseBuild}
                  onCompare={compare}
                  disabled={isLoading || comparisonLoading || !config}
                />
              </>
            ) : (
              <ComparisonActions
                onReset={reset}
                onCopy={copyResults}
                copyStatus={copyStatus}
                hasResults={hasResults}
                comparisonError={comparisonError}
                isLoading={isLoading}
                comparisonLoading={comparisonLoading}
              />
            )}
          </>
        )}

      {selectedTab === "changes" && !comparisonLoading && result && (
        <>
          <ComparisonActions
            onReset={() => {
              reset();
              selectTab("compare");
            }}
            onCopy={copyResults}
            copyStatus={copyStatus}
            hasResults={hasResults}
            comparisonError={comparisonError}
            isLoading={isLoading}
            comparisonLoading={comparisonLoading}
          />
          <CommitComparisonResults result={result} />
        </>
      )}
      {selectedTab === "changes" && !comparisonLoading && !result && (
        <Body1>Run or open a comparison to review release changes.</Body1>
      )}
      {selectedTab === "share" && !comparisonLoading && result && (
        <>
          {profile && (
            <ReportActions
              profileId={profile.id}
              result={result}
              onSummaryChanged={setReleaseSummary}
            />
          )}
          <TeamsShare result={result} summary={releaseSummary} />
        </>
      )}
      {selectedTab === "share" && !comparisonLoading && !result && (
        <Body1>Run or open a comparison before sharing or exporting.</Body1>
      )}
      {selectedTab === "compare" && profile && !comparisonLoading && (
        <ReferenceComparison
          profileId={profile.id}
          onCompared={loadComparison}
        />
      )}
      {selectedTab === "history" && profile && (
        <ComparisonHistory
          profileId={profile.id}
          refreshKey={historyRefreshKey}
          onOpen={loadComparison}
        />
      )}
      {comparisonLoading && (
        <Spinner
          className={styles.loadingSpinner}
          label="Comparing builds..."
        />
      )}
    </div>
  );
};
