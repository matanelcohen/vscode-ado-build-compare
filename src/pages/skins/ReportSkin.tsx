import * as React from "react";
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Badge,
  Body1,
  Button,
  Caption1,
  Card,
  Link,
  MessageBar,
  MessageBarBody,
  Spinner,
  Text,
  Title3,
  makeStyles,
  shorthands,
  tokens,
} from "@fluentui/react-components";
import { EditRegular, PlayRegular } from "@fluentui/react-icons";
import { BuildDiffHeader } from "../../components/Comparison/BuildDiffHeader";
import { TeamsShare } from "../../components/Comparison/TeamsShare";
import { ReportActions } from "../../components/Comparison/ReportActions";
import { ComparisonHistory } from "../../components/Comparison/ComparisonHistory";
import { ReferenceComparison } from "../../components/Comparison/ReferenceComparison";
import { summarizeFileHotspots } from "../../utils/comparison";
import { groupCommitsByAuthor } from "../../utils/groupChanges";
import { SkinProps } from "./types";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalL,
  },
  contextBar: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalS,
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: "var(--vscode-editorWidget-background)",
    ...shorthands.border("1px", "solid", "var(--vscode-editorWidget-border)"),
  },
  contextActions: {
    marginInlineStart: "auto",
    display: "flex",
    gap: tokens.spacingHorizontalXS,
  },
  verdict: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalM,
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalL),
  },
  verdictHeader: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    flexWrap: "wrap",
  },
  verdictBody: {
    lineHeight: tokens.lineHeightBase400,
  },
  verdictActions: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalS,
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalS,
    ...shorthands.padding(tokens.spacingVerticalXS, "0"),
  },
  rowMain: {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  mono: {
    fontFamily: tokens.fontFamilyMonospace,
  },
  chips: {
    display: "flex",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalXS,
  },
  scroll: {
    maxHeight: "360px",
    overflowY: "auto",
  },
  authorGroup: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalXS,
    ...shorthands.padding(tokens.spacingVerticalS, "0"),
  },
  authorHeader: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  authorChanges: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalXS,
    marginTop: 0,
    marginBottom: 0,
    paddingLeft: tokens.spacingHorizontalXL,
  },
  spinner: {
    alignSelf: "center",
    paddingBlock: tokens.spacingVerticalL,
  },
  selector: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalM,
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalL),
  },
  selectorActions: {
    display: "flex",
    justifyContent: "flex-end",
  },
});

const riskColor = {
  low: "success",
  medium: "warning",
  high: "danger",
  critical: "danger",
} as const;

/**
 * Skin C — a summary-first release report: the verdict and share actions come
 * first, with supporting detail behind collapsible sections.
 */
export const ReportSkin: React.FC<SkinProps> = ({ workspace }) => {
  const styles = useStyles();
  const {
    config,
    profile,
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
    copyStatus,
    selectBuild,
    selectBaseBuild,
    compare,
    reset,
    copyResults,
  } = workspace;

  const busy = isLoading || comparisonLoading;
  const hotspots = React.useMemo(
    () => (result ? summarizeFileHotspots(result.files, 12) : []),
    [result]
  );
  const authorGroups = React.useMemo(
    () => (result ? groupCommitsByAuthor(result.commits) : []),
    [result]
  );

  return (
    <div className={styles.root}>
      {result && !comparisonLoading ? (
        <>
          <div className={styles.contextBar}>
            <Text weight="semibold">{result.baseBuild.buildNumber}</Text>
            <Caption1>&rarr;</Caption1>
            <Text weight="semibold">{result.targetBuild.buildNumber}</Text>
            {result.pathFilters.length > 0 && (
              <div className={styles.chips}>
                {result.pathFilters.map((path) => (
                  <Badge appearance="outline" key={path}>
                    {path}
                  </Badge>
                ))}
              </div>
            )}
            <div className={styles.contextActions}>
              <Button
                size="small"
                icon={<EditRegular />}
                onClick={reset}
                disabled={busy}
              >
                Change comparison
              </Button>
            </div>
          </div>

          <Card className={styles.verdict}>
            <div className={styles.verdictHeader}>
              <Badge appearance="filled" color={riskColor[result.risk.level]}>
                {result.risk.level.toLocaleUpperCase()} RISK
              </Badge>
              <Title3>{result.risk.score} / 100</Title3>
              {result.analysis && (
                <Caption1>
                  Analyzed {result.analysis.totalCommits} commits in{" "}
                  {(result.analysis.durationMs / 1000).toFixed(1)}s
                </Caption1>
              )}
            </div>
            <Body1 className={styles.verdictBody}>
              {result.commits.length} commits from {result.contributors.length}{" "}
              contributors across {result.files.length} files, delivered in{" "}
              {result.pullRequests.length} pull requests.
              {result.risk.signals.length > 0 && (
                <>
                  {" "}
                  Review before promoting:{" "}
                  {result.risk.signals
                    .map((signal) => signal.label.toLocaleLowerCase())
                    .join(", ")}
                  .
                </>
              )}
            </Body1>
            <div className={styles.verdictActions}>
              <Button
                appearance="primary"
                onClick={copyResults}
                disabled={busy}
              >
                Copy summary
              </Button>
              {copyStatus && <Caption1>{copyStatus}</Caption1>}
              {result.targetBuild._links?.web?.href && (
                <Link
                  href={result.targetBuild._links.web.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in Azure DevOps
                </Link>
              )}
            </div>
          </Card>

          <Accordion collapsible multiple defaultOpenItems={["pullRequests"]}>
            <AccordionItem value="pullRequests">
              <AccordionHeader>
                Changes by contributor ({result.commits.length})
              </AccordionHeader>
              <AccordionPanel>
                <div className={styles.scroll}>
                  {authorGroups.map((group) => (
                    <div className={styles.authorGroup} key={group.key}>
                      <div className={styles.authorHeader}>
                        <Text weight="semibold">
                          {group.author.displayName}
                        </Text>
                        <Badge appearance="tint">
                          {group.commits.length}
                        </Badge>
                      </div>
                      <ol className={styles.authorChanges}>
                        {group.commits.map((commit) => (
                          <li key={commit.id}>
                            {commit.pullRequest ? (
                              <Link
                                href={commit.pullRequest.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                PR #{commit.pullRequest.id}:{" "}
                                {commit.pullRequest.title}
                              </Link>
                            ) : (
                              <Caption1>
                                <span className={styles.mono}>
                                  {commit.id.slice(0, 7)}
                                </span>{" "}
                                {commit.message.split("\n")[0]}
                              </Caption1>
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                  {authorGroups.length === 0 && (
                    <Caption1>No changes in this range.</Caption1>
                  )}
                </div>
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem value="files">
              <AccordionHeader>
                Changed files ({result.files.length})
              </AccordionHeader>
              <AccordionPanel>
                {hotspots.length > 0 && (
                  <div className={styles.chips}>
                    {hotspots.map((hotspot) => (
                      <Badge appearance="outline" key={hotspot.path}>
                        {hotspot.path} · {hotspot.count}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className={styles.scroll}>
                  {result.files.slice(0, 200).map((file) => (
                    <div className={styles.row} key={file.path}>
                      <Caption1
                        className={`${styles.rowMain} ${styles.mono}`}
                      >
                        {file.path}
                      </Caption1>
                      <Badge appearance="outline">{file.changeType}</Badge>
                    </div>
                  ))}
                  {result.files.length > 200 && (
                    <Caption1>
                      +{result.files.length - 200} more changed files
                    </Caption1>
                  )}
                </div>
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem value="risk">
              <AccordionHeader>
                Risk signals ({result.risk.signals.length})
              </AccordionHeader>
              <AccordionPanel>
                {result.risk.signals.length === 0 ? (
                  <Caption1>No sensitive change patterns detected.</Caption1>
                ) : (
                  result.risk.signals.map((signal) => (
                    <div className={styles.row} key={signal.id}>
                      <Caption1 className={styles.rowMain}>
                        <strong>{signal.label}:</strong> {signal.description}
                      </Caption1>
                    </div>
                  ))
                )}
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem value="share">
              <AccordionHeader>Share &amp; export</AccordionHeader>
              <AccordionPanel>
                {profile && (
                  <ReportActions
                    profileId={profile.id}
                    result={result}
                    onSummaryChanged={setReleaseSummary}
                  />
                )}
                <TeamsShare result={result} summary={releaseSummary} />
              </AccordionPanel>
            </AccordionItem>

            {profile && (
              <AccordionItem value="history">
                <AccordionHeader>Recent comparisons</AccordionHeader>
                <AccordionPanel>
                  <ComparisonHistory
                    profileId={profile.id}
                    refreshKey={historyRefreshKey}
                    onOpen={loadComparison}
                  />
                </AccordionPanel>
              </AccordionItem>
            )}
          </Accordion>

          {result.warnings.map((warning) => (
            <MessageBar intent="warning" key={warning}>
              <MessageBarBody>{warning}</MessageBarBody>
            </MessageBar>
          ))}
        </>
      ) : (
        <>
          <Card className={styles.selector}>
            <Title3>Build a release report</Title3>
            <BuildDiffHeader
              baseBuild={baseBuild}
              targetBuild={selectedBuild}
              baseBuilds={comparisonBuilds}
              targetBuilds={targetBuilds}
              onSelectBase={selectBaseBuild}
              onSelectTarget={selectBuild}
              disabled={busy || !config}
            />
            <div className={styles.selectorActions}>
              <Button
                appearance="primary"
                icon={<PlayRegular />}
                disabled={busy || !config || selectedBuildId === null}
                onClick={compare}
              >
                Analyze release
              </Button>
            </div>
          </Card>

          {profile && !comparisonLoading && (
            <Accordion collapsible>
              <AccordionItem value="reference">
                <AccordionHeader>Compare to a reference</AccordionHeader>
                <AccordionPanel>
                  <ReferenceComparison
                    profileId={profile.id}
                    onCompared={loadComparison}
                  />
                </AccordionPanel>
              </AccordionItem>
              <AccordionItem value="history">
                <AccordionHeader>Recent comparisons</AccordionHeader>
                <AccordionPanel>
                  <ComparisonHistory
                    profileId={profile.id}
                    refreshKey={historyRefreshKey}
                    onOpen={loadComparison}
                  />
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          )}
        </>
      )}

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
    </div>
  );
};
