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
  MessageBar,
  MessageBarBody,
  Spinner,
  Text,
  makeStyles,
  shorthands,
  tokens,
} from "@fluentui/react-components";
import { EditRegular, PlayRegular } from "@fluentui/react-icons";
import { BuildDiffHeader } from "../../components/Comparison/BuildDiffHeader";
import { CommitComparisonResults } from "../../components/Comparison/CommitComparisonResults";
import { TeamsShare } from "../../components/Comparison/TeamsShare";
import { ReportActions } from "../../components/Comparison/ReportActions";
import { ComparisonHistory } from "../../components/Comparison/ComparisonHistory";
import { ReferenceComparison } from "../../components/Comparison/ReferenceComparison";
import { SkinProps } from "./types";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalL,
  },
  selector: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalM,
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalL),
  },
  scopeRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalS,
  },
  scopeChips: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalXS,
  },
  crumb: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalS,
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: "var(--vscode-editorWidget-background)",
    ...shorthands.border("1px", "solid", "var(--vscode-editorWidget-border)"),
  },
  crumbActions: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    marginInlineStart: "auto",
  },
  spinner: {
    alignSelf: "center",
    paddingBlock: tokens.spacingVerticalL,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalM,
  },
});

/**
 * Skin A — a focused linear flow: pick base and target side by side, analyze,
 * then read the results directly below a compact comparison breadcrumb.
 */
export const DiffBarSkin: React.FC<SkinProps> = ({ workspace }) => {
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
    hasResults,
    copyStatus,
    selectBuild,
    selectBaseBuild,
    swapBuilds,
    compare,
    reset,
    copyResults,
  } = workspace;

  const pathFilters = (config?.relevantPathFilter || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const busy = isLoading || comparisonLoading;

  return (
    <div className={styles.root}>
      {!hasResults && (
        <Card className={styles.selector}>
          <BuildDiffHeader
            baseBuild={baseBuild}
            targetBuild={selectedBuild}
            baseBuilds={comparisonBuilds}
            targetBuilds={targetBuilds}
            onSelectBase={selectBaseBuild}
            onSelectTarget={selectBuild}
            onSwap={swapBuilds}
            disabled={busy || !config}
          />
          <div className={styles.scopeRow}>
            <div className={styles.scopeChips}>
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
          </div>
          {targetBuilds.length === 0 && !isLoading && (
            <Caption1>
              No newer target builds are available after this base build.
            </Caption1>
          )}
        </Card>
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

      {result && !comparisonLoading && (
        <>
          <div className={styles.crumb}>
            <Caption1>Analyzed</Caption1>
            <Text weight="semibold">{result.baseBuild.buildNumber}</Text>
            <Caption1>&rarr;</Caption1>
            <Text weight="semibold">{result.targetBuild.buildNumber}</Text>
            <div className={styles.crumbActions}>
              <Button
                size="small"
                icon={<EditRegular />}
                onClick={reset}
                disabled={busy}
              >
                Change
              </Button>
              <Button size="small" onClick={copyResults} disabled={busy}>
                Copy
              </Button>
              {copyStatus && <Caption1>{copyStatus}</Caption1>}
            </div>
          </div>
          <CommitComparisonResults result={result} />
          <div className={styles.section}>
            {profile && (
              <ReportActions
                profileId={profile.id}
                result={result}
                onSummaryChanged={setReleaseSummary}
              />
            )}
            <TeamsShare result={result} summary={releaseSummary} />
          </div>
        </>
      )}

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

      {!profile && !isLoading && (
        <Body1>Connect a pipeline profile to compare builds.</Body1>
      )}
    </div>
  );
};
