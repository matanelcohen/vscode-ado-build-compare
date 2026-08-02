import * as React from "react";
import {
  makeStyles,
  shorthands,
  Spinner,
  Text,
  Title1,
  Body1,
  Button,
} from "@fluentui/react-components";
import { ArrowClockwiseRegular, SettingsRegular } from "@fluentui/react-icons";
import { BuildSelector } from "../components/Comparison";
import { useAuthAndConfig } from "../hooks/useAccessToken";
import { useBuildData } from "../hooks/useBuildData";
import { useCommitComparison } from "../hooks/useCommitComparison";
import { LatestDeploymentInfo } from "../components/Comparison/LatestDeploymentInfo";
import { CommitComparisonResults } from "../components/Comparison/CommitComparisonResults";
import { ComparisonActions } from "../components/Comparison/ComparisonActions";
import { TeamsShare } from "../components/Comparison/TeamsShare";
import { generatePlainTextResults } from "../utils/generatePlainTextResults";
import { ProfileControls } from "../components/Comparison/ProfileControls";
import { ReportActions } from "../components/Comparison/ReportActions";
import { ComparisonHistory } from "../components/Comparison/ComparisonHistory";
import { PipelineRun } from "../api-sdk";
import { ReferenceComparison } from "../components/Comparison/ReferenceComparison";
import { EnvironmentDrift } from "../components/Comparison/EnvironmentDrift";
import { generateDeterministicSummary } from "../utils/riskAnalysis";

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
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
  },
  headerActions: {
    display: "flex",
    gap: "8px",
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
    config,
    error: authError,
    loading: authLoading,
    profile,
    profiles,
    needsOnboarding,
    reload: reloadConfiguration,
  } = useAuthAndConfig(vscode);

  const {
    olderRun,
    builds,
    loading: buildLoading,
    error: buildError,
    refresh,
  } = useBuildData(profile?.id ?? null, config);

  const {
    result,
    loading: comparisonLoading,
    error: comparisonError,
    compareCommits,
    resetComparison,
    loadComparison,
  } = useCommitComparison();

  const [selectedBuildId, setSelectedBuildId] = React.useState<number | null>(
    null
  );
  const [baseBuildId, setBaseBuildId] = React.useState<number | null>(null);
  const [copyStatus, setCopyStatus] = React.useState<string>("");
  const [releaseSummary, setReleaseSummary] = React.useState("");
  const [historyRefreshKey, setHistoryRefreshKey] = React.useState(0);

  const comparisonBuilds = React.useMemo(() => {
    const byId = new Map<number, PipelineRun>();
    if (olderRun) {
      byId.set(olderRun.id, olderRun);
    }
    for (const build of builds) {
      byId.set(build.id, build);
    }
    return [...byId.values()];
  }, [olderRun, builds]);
  const selectedBuild = React.useMemo(() => {
    return (
      comparisonBuilds.find((build) => build.id === selectedBuildId) ?? null
    );
  }, [comparisonBuilds, selectedBuildId]);
  const baseBuild =
    comparisonBuilds.find((build) => build.id === baseBuildId) ?? olderRun;
  const targetBuilds = React.useMemo(() => {
    if (!baseBuild) {
      return [];
    }
    const baseTime = new Date(
      baseBuild.finishTime ?? baseBuild.startTime ?? baseBuild.queueTime ?? 0
    ).getTime();
    return comparisonBuilds.filter((build) => {
      const targetTime = new Date(
        build.finishTime ?? build.startTime ?? build.queueTime ?? 0
      ).getTime();
      return build.id !== baseBuild.id && targetTime > baseTime;
    });
  }, [baseBuild, comparisonBuilds]);

  const handleSelectBuild = (buildId: number) => {
    setSelectedBuildId(buildId);
    setCopyStatus("");
  };

  const handleCompare = async () => {
    if (!baseBuild || !selectedBuild || !config) return;
    setCopyStatus("");
    if (!profile) return;
    await compareCommits(baseBuild, selectedBuild, profile.id);
  };

  const handleReset = () => {
    setSelectedBuildId(null);
    resetComparison();
    setCopyStatus("");
  };

  React.useEffect(() => {
    setSelectedBuildId(null);
    resetComparison();
    setCopyStatus("");
  }, [profile?.id, resetComparison]);

  React.useEffect(() => {
    if (olderRun) {
      setBaseBuildId(olderRun.id);
    }
  }, [olderRun]);

  React.useEffect(() => {
    if (result) {
      setReleaseSummary(generateDeterministicSummary(result));
      setHistoryRefreshKey((value) => value + 1);
    }
  }, [result]);

  const handleCopyResults = async () => {
    if (!result) return;
    const textToCopy = generatePlainTextResults(result);
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopyStatus("Copied!");
      setTimeout(() => setCopyStatus(""), 2000);
    } catch (err) {
      setCopyStatus("Failed to copy");
      setTimeout(() => setCopyStatus(""), 2000);
    }
  };

  const isLoading = authLoading || buildLoading;
  const currentError = authError || buildError;
  const isComparisonActive =
    comparisonLoading || !!result || !!comparisonError;
  const hasResults = Boolean(result);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title1 as="h1" className={styles.title}>
            Deployment comparison
          </Title1>
          <Body1>
            Review everything introduced after the latest successful deployment.
          </Body1>
        </div>
        <div className={styles.headerActions}>
          {profile && (
            <EnvironmentDrift
              activeProfile={profile}
              profiles={profiles}
              onCompared={loadComparison}
            />
          )}
          <Button
            icon={<ArrowClockwiseRegular />}
            disabled={isLoading || comparisonLoading}
            onClick={() => {
              handleReset();
              refresh();
            }}
          >
            Refresh
          </Button>
          <Button
            icon={<SettingsRegular />}
            onClick={() => vscode.postMessage({ command: "openSettings" })}
          >
            Settings
          </Button>
        </div>
      </div>

      {!authLoading && (
        <ProfileControls
          activeProfile={profile}
          profileCount={profiles.length}
          needsOnboarding={needsOnboarding}
          onChanged={() => {
            handleReset();
            reloadConfiguration();
          }}
        />
      )}

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
                onSelect={handleSelectBuild}
                onSelectBase={(buildId) => {
                  setBaseBuildId(buildId);
                  setSelectedBuildId(null);
                }}
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

      {!comparisonLoading && result && (
        <>
          <CommitComparisonResults result={result} />
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
      {profile && !comparisonLoading && (
        <ReferenceComparison
          profileId={profile.id}
          onCompared={loadComparison}
        />
      )}
      {profile && (
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
