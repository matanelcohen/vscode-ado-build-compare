import * as React from "react";
import {
  Badge,
  Body1,
  Button,
  Caption1,
  Card,
  Divider,
  Dropdown,
  Link,
  MessageBar,
  MessageBarBody,
  Option,
  Spinner,
  Tab,
  TabList,
  TabValue,
  Text,
  makeStyles,
  shorthands,
  tokens,
} from "@fluentui/react-components";
import { PlayRegular } from "@fluentui/react-icons";
import { CommitComparisonResults } from "../../components/Comparison/CommitComparisonResults";
import { TeamsShare } from "../../components/Comparison/TeamsShare";
import { ReportActions } from "../../components/Comparison/ReportActions";
import { ComparisonHistory } from "../../components/Comparison/ComparisonHistory";
import { ReferenceComparison } from "../../components/Comparison/ReferenceComparison";
import { ComparisonTab } from "../../models/webviewState";
import { summarizeFileHotspots } from "../../utils/comparison";
import { SkinProps } from "./types";

const useStyles = makeStyles({
  root: {
    display: "grid",
    gridTemplateColumns: "minmax(240px, 280px) minmax(0, 1fr)",
    gap: tokens.spacingHorizontalL,
    alignItems: "start",
    "@media (max-width: 860px)": {
      gridTemplateColumns: "minmax(0, 1fr)",
    },
  },
  rail: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalM,
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
    position: "sticky",
    top: "0",
  },
  pane: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalM,
    minWidth: 0,
  },
  label: {
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: tokens.colorNeutralForeground3,
    display: "block",
    marginBottom: tokens.spacingVerticalXS,
  },
  buildList: {
    display: "flex",
    flexDirection: "column",
    maxHeight: "320px",
    overflowY: "auto",
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border("1px", "solid", "var(--vscode-editorWidget-border)"),
  },
  buildItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalS,
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalS),
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "var(--vscode-editorWidget-border)",
    cursor: "pointer",
    backgroundColor: "transparent",
    color: "inherit",
    textAlign: "left",
    ":hover": {
      backgroundColor: "var(--vscode-list-hoverBackground)",
    },
  },
  buildItemSelected: {
    backgroundColor: "var(--vscode-list-activeSelectionBackground)",
    color: "var(--vscode-list-activeSelectionForeground)",
  },
  hash: {
    fontFamily: tokens.fontFamilyMonospace,
  },
  metrics: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
    gap: tokens.spacingHorizontalS,
  },
  metric: {
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border("1px", "solid", "var(--vscode-editorWidget-border)"),
    backgroundColor: "var(--vscode-editorWidget-background)",
  },
  metricValue: {
    display: "block",
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
  },
  metricLabel: {
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: tokens.colorNeutralForeground3,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalS,
  },
  signal: {
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalS,
  },
  chips: {
    display: "flex",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalXS,
  },
  fileRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalS,
    ...shorthands.padding(tokens.spacingVerticalXS, "0"),
  },
  filePath: {
    fontFamily: tokens.fontFamilyMonospace,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  spinner: {
    alignSelf: "center",
    paddingBlock: tokens.spacingVerticalL,
  },
  scroll: {
    maxHeight: "420px",
    overflowY: "auto",
  },
});

const riskColor = {
  low: "success",
  medium: "warning",
  high: "danger",
  critical: "danger",
} as const;

/**
 * Skin B — a persistent selection rail beside a tabbed results pane, so the
 * chosen builds stay visible while reading the comparison.
 */
export const WorkbenchSkin: React.FC<SkinProps> = ({ workspace }) => {
  const styles = useStyles();
  const {
    config,
    profile,
    comparisonBuilds,
    targetBuilds,
    baseBuild,
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
    copyStatus,
    selectedTab,
    selectTab,
    selectBuild,
    selectBaseBuild,
    compare,
    reset,
    copyResults,
  } = workspace;

  const busy = isLoading || comparisonLoading;
  const pathFilters = (config?.relevantPathFilter || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const hotspots = React.useMemo(
    () => (result ? summarizeFileHotspots(result.files, 12) : []),
    [result]
  );

  return (
    <div className={styles.root}>
      <Card className={styles.rail}>
        <div>
          <Caption1 className={styles.label}>Base build</Caption1>
          <Dropdown
            value={baseBuild?.buildNumber ?? ""}
            selectedOptions={baseBuild ? [String(baseBuild.id)] : []}
            onOptionSelect={(_, data) => {
              const id = Number(data.optionValue);
              if (Number.isInteger(id)) {
                selectBaseBuild(id);
              }
            }}
            disabled={busy}
            aria-label="Base build"
          >
            {comparisonBuilds.map((build) => (
              <Option key={build.id} value={String(build.id)}>
                {build.buildNumber}
              </Option>
            ))}
          </Dropdown>
        </div>

        <div>
          <Caption1 className={styles.label}>Target build (newer)</Caption1>
          <div
            className={styles.buildList}
            role="listbox"
            aria-label="Target build"
          >
            {targetBuilds.map((build) => {
              const isSelected = build.id === selectedBuildId;
              return (
                <div
                  key={build.id}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={busy ? -1 : 0}
                  className={`${styles.buildItem} ${
                    isSelected ? styles.buildItemSelected : ""
                  }`}
                  onClick={() => !busy && selectBuild(build.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      if (!busy) {
                        selectBuild(build.id);
                      }
                    }
                  }}
                >
                  <Caption1>
                    {build.buildNumber}
                    {build.sourceVersion && (
                      <>
                        {" "}
                        <span className={styles.hash}>
                          {build.sourceVersion.substring(0, 7)}
                        </span>
                      </>
                    )}
                  </Caption1>
                  {build.result && (
                    <Badge
                      appearance="tint"
                      color={build.result === "2" ? "success" : "informative"}
                    >
                      {build.result === "2" ? "OK" : build.result}
                    </Badge>
                  )}
                </div>
              );
            })}
            {targetBuilds.length === 0 && (
              <Caption1 style={{ padding: "8px" }}>
                No newer target builds are available.
              </Caption1>
            )}
          </div>
        </div>

        <div className={styles.chips}>
          <Caption1>Scope:</Caption1>
          {pathFilters.length > 0 ? (
            pathFilters.map((path) => (
              <Badge appearance="outline" key={path}>
                {path}
              </Badge>
            ))
          ) : (
            <Badge appearance="outline">all paths</Badge>
          )}
        </div>

        <Button
          appearance="primary"
          icon={<PlayRegular />}
          disabled={busy || !config || selectedBuildId === null}
          onClick={compare}
        >
          Analyze release
        </Button>
        {result && (
          <Button appearance="secondary" disabled={busy} onClick={reset}>
            Clear comparison
          </Button>
        )}

        <Divider />

        {profile && (
          <div className={styles.section}>
            <Caption1 className={styles.label}>Other comparisons</Caption1>
            <ReferenceComparison
              profileId={profile.id}
              onCompared={loadComparison}
            />
          </div>
        )}
      </Card>

      <div className={styles.pane}>
        <TabList
          selectedValue={selectedTab}
          onTabSelect={(_event, data) => selectTab(data.value as ComparisonTab)}
        >
          <Tab value={"compare" as TabValue}>Summary</Tab>
          <Tab value={"changes" as TabValue}>Changes</Tab>
          <Tab value={"share" as TabValue}>Share &amp; export</Tab>
          <Tab value={"history" as TabValue}>History</Tab>
        </TabList>

        {currentError && (
          <MessageBar intent="error">
            <MessageBarBody>{currentError}</MessageBarBody>
          </MessageBar>
        )}
        {comparisonError && (
          <MessageBar intent="error">
            <MessageBarBody>{comparisonError}</MessageBarBody>
          </MessageBar>
        )}
        {comparisonLoading && (
          <Spinner className={styles.spinner} label="Comparing builds..." />
        )}
        {isLoading && !comparisonLoading && (
          <Spinner
            className={styles.spinner}
            label="Loading configuration and data..."
          />
        )}

        {selectedTab === "compare" && result && !comparisonLoading && (
          <>
            <div className={styles.metrics}>
              <div className={styles.metric}>
                <Text className={styles.metricValue}>
                  {result.risk.level.toLocaleUpperCase()} · {result.risk.score}
                </Text>
                <Caption1 className={styles.metricLabel}>Release risk</Caption1>
              </div>
              {(
                [
                  ["Pull requests", result.pullRequests.length],
                  ["Commits", result.commits.length],
                  ["Changed files", result.files.length],
                  ["Contributors", result.contributors.length],
                ] as const
              ).map(([label, value]) => (
                <div className={styles.metric} key={label}>
                  <Text className={styles.metricValue}>{value}</Text>
                  <Caption1 className={styles.metricLabel}>{label}</Caption1>
                </div>
              ))}
            </div>

            <Card className={styles.section}>
              <div className={styles.signal}>
                <Text weight="semibold">Risk signals</Text>
                <Badge
                  appearance="filled"
                  color={riskColor[result.risk.level]}
                >
                  {result.risk.score}/100
                </Badge>
              </div>
              {result.risk.signals.length === 0 ? (
                <Caption1>No sensitive change patterns detected.</Caption1>
              ) : (
                result.risk.signals.map((signal) => (
                  <Caption1 key={signal.id} className={styles.signal}>
                    <Badge appearance="tint">{signal.label}</Badge>
                    <span>{signal.description}</span>
                  </Caption1>
                ))
              )}
            </Card>

            {hotspots.length > 0 && (
              <Card className={styles.section}>
                <Text weight="semibold">Changed areas</Text>
                <div className={styles.chips}>
                  {hotspots.map((hotspot) => (
                    <Badge appearance="outline" key={hotspot.path}>
                      {hotspot.path} · {hotspot.count}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            <Card className={styles.section}>
              <div className={styles.signal}>
                <Text weight="semibold">Changed files</Text>
                <Badge appearance="tint">{result.files.length}</Badge>
              </div>
              <div className={styles.scroll}>
                {result.files.slice(0, 200).map((file) => (
                  <div className={styles.fileRow} key={file.path}>
                    <Caption1 className={styles.filePath}>{file.path}</Caption1>
                    <Badge appearance="outline">{file.changeType}</Badge>
                  </div>
                ))}
                {result.files.length > 200 && (
                  <Caption1>
                    +{result.files.length - 200} more changed files
                  </Caption1>
                )}
              </div>
            </Card>

            <div className={styles.chips}>
              <Button size="small" onClick={copyResults} disabled={busy}>
                Copy results
              </Button>
              {copyStatus && <Caption1>{copyStatus}</Caption1>}
              {result.targetBuild._links?.web?.href && (
                <Link
                  href={result.targetBuild._links.web.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open target build in Azure DevOps
                </Link>
              )}
            </div>
          </>
        )}

        {selectedTab === "compare" && !result && !comparisonLoading && (
          <Body1>
            Choose a base and target build in the rail, then run the analysis.
          </Body1>
        )}

        {selectedTab === "changes" && result && !comparisonLoading && (
          <CommitComparisonResults result={result} />
        )}
        {selectedTab === "changes" && !result && !comparisonLoading && (
          <Body1>Run or open a comparison to review release changes.</Body1>
        )}

        {selectedTab === "share" && result && !comparisonLoading && (
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
        {selectedTab === "share" && !result && !comparisonLoading && (
          <Body1>Run or open a comparison before sharing or exporting.</Body1>
        )}

        {selectedTab === "history" && profile && (
          <ComparisonHistory
            profileId={profile.id}
            refreshKey={historyRefreshKey}
            onOpen={loadComparison}
          />
        )}
      </div>
    </div>
  );
};
