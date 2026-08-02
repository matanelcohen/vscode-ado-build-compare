import * as React from "react";
import {
  Badge,
  Body1,
  Button,
  Caption1,
  Card,
  Divider,
  Input,
  Link,
  makeStyles,
  shorthands,
  Text,
  Title3,
  tokens,
} from "@fluentui/react-components";
import { SearchRegular } from "@fluentui/react-icons";
import { ComparisonResult } from "../../models/comparison";
import { summarizeFileHotspots } from "../../utils/comparison";

interface CommitComparisonResultsProps {
  result: ComparisonResult;
}

const useStyles = makeStyles({
  card: {
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalL),
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalL,
  },
  metrics: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: tokens.spacingHorizontalM,
  },
  metric: {
    ...shorthands.padding(tokens.spacingVerticalM),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  metricValue: {
    display: "block",
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalM,
  },
  item: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalXS,
  },
  itemHeader: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
  },
  metadata: {
    color: tokens.colorNeutralForeground3,
  },
  files: {
    color: tokens.colorNeutralForeground3,
    fontFamily: tokens.fontFamilyMonospace,
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    rowGap: tokens.spacingVerticalS,
    textAlign: "center",
    ...shorthands.padding(tokens.spacingVerticalXXL),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  warning: {
    color: tokens.colorPaletteDarkOrangeForeground1,
  },
  risk: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    ...shorthands.padding(tokens.spacingVerticalM),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  riskHeader: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  filters: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalXS,
  },
  analysis: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalS,
    color: tokens.colorNeutralForeground3,
  },
  resultToolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalS,
  },
  resultFilters: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalXS,
  },
  hotspots: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalXS,
  },
  listFooter: {
    display: "flex",
    justifyContent: "center",
    paddingTop: tokens.spacingVerticalS,
  },
});

export const CommitComparisonResults: React.FC<
  CommitComparisonResultsProps
> = ({ result }) => {
  const styles = useStyles();
  const [query, setQuery] = React.useState("");
  const [commitKind, setCommitKind] = React.useState<
    "all" | "pull-request" | "direct"
  >("all");
  const [visibleLimit, setVisibleLimit] = React.useState(50);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredCommits = React.useMemo(
    () =>
      result.commits.filter((commit) => {
        if (commitKind === "pull-request" && !commit.pullRequest) {
          return false;
        }
        if (commitKind === "direct" && commit.pullRequest) {
          return false;
        }
        if (!normalizedQuery) {
          return true;
        }
        return [
          commit.message,
          commit.author.displayName,
          commit.pullRequest?.title,
          commit.pullRequest?.id.toString(),
          ...commit.files.map((file) => file.path),
        ].some((value) =>
          value?.toLocaleLowerCase().includes(normalizedQuery)
        );
      }),
    [commitKind, normalizedQuery, result.commits]
  );
  const visibleCommits = filteredCommits.slice(0, visibleLimit);
  const directCommitCount = React.useMemo(
    () => result.commits.filter((commit) => !commit.pullRequest).length,
    [result.commits]
  );
  const hotspots = React.useMemo(
    () => summarizeFileHotspots(result.files),
    [result.files]
  );

  React.useEffect(() => {
    setVisibleLimit(50);
  }, [commitKind, normalizedQuery, result]);

  return (
    <Card className={styles.card}>
      <Title3>Comparison summary</Title3>
      <div className={styles.metrics}>
        {[
          ["Pull requests", result.pullRequests.length],
          ["Commits", result.commits.length],
          ["Changed files", result.files.length],
          ["Contributors", result.contributors.length],
        ].map(([label, value]) => (
          <div className={styles.metric} key={label}>
            <Text className={styles.metricValue}>{value}</Text>
            <Caption1>{label}</Caption1>
          </div>
        ))}
      </div>
      {result.analysis && (
        <div className={styles.analysis}>
          <Caption1>
            Analyzed {result.analysis.totalCommits} commits and{" "}
            {result.analysis.inspectedFiles} file changes in{" "}
            {(result.analysis.durationMs / 1000).toFixed(1)}s
          </Caption1>
          {result.analysis.excludedCommits > 0 && (
            <Badge appearance="tint">
              {result.analysis.excludedCommits} excluded by filters
            </Badge>
          )}
          {(result.analysis.inspectionFailures ?? 0) > 0 && (
            <Badge appearance="tint" color="warning">
              {result.analysis.inspectionFailures} inspection failures
            </Badge>
          )}
        </div>
      )}
      <div className={styles.risk}>
        <div className={styles.riskHeader}>
          <Text weight="semibold">Release risk</Text>
          <Badge
            appearance="filled"
            color={
              result.risk.level === "low"
                ? "success"
                : result.risk.level === "medium"
                  ? "warning"
                  : "danger"
            }
          >
            {result.risk.level.toLocaleUpperCase()} · {result.risk.score}/100
          </Badge>
        </div>
        {result.risk.signals.length === 0 ? (
          <Caption1>No sensitive change patterns detected.</Caption1>
        ) : (
          result.risk.signals.map((signal) => (
            <Caption1 key={signal.id}>
              <strong>{signal.label}:</strong> {signal.description}
            </Caption1>
          ))
        )}
      </div>

      {result.pathFilters.length > 0 && (
        <div className={styles.filters}>
          <Caption1>Filtered to:</Caption1>
          {result.pathFilters.map((path) => (
            <Badge appearance="outline" key={path}>
              {path}
            </Badge>
          ))}
        </div>
      )}
      {hotspots.length > 0 && (
        <div className={styles.hotspots}>
          <Caption1>Change hotspots:</Caption1>
          {hotspots.map((hotspot) => (
            <Badge appearance="tint" key={hotspot.path}>
              {hotspot.path} · {hotspot.count}
            </Badge>
          ))}
        </div>
      )}

      {result.commits.length > 0 ? (
        <>
          <Input
            contentBefore={<SearchRegular />}
            value={query}
            onChange={(_, data) => setQuery(data.value)}
            placeholder="Filter by PR, contributor, message, or file"
            aria-label="Filter comparison results"
          />
          <div className={styles.resultToolbar}>
            <div className={styles.resultFilters}>
              <Button
                size="small"
                appearance={commitKind === "all" ? "primary" : "secondary"}
                onClick={() => setCommitKind("all")}
              >
                All · {result.commits.length}
              </Button>
              <Button
                size="small"
                appearance={
                  commitKind === "pull-request" ? "primary" : "secondary"
                }
                onClick={() => setCommitKind("pull-request")}
              >
                Pull requests · {result.commits.length - directCommitCount}
              </Button>
              <Button
                size="small"
                appearance={commitKind === "direct" ? "primary" : "secondary"}
                onClick={() => setCommitKind("direct")}
              >
                Direct · {directCommitCount}
              </Button>
            </div>
            <Caption1>
              Showing {Math.min(visibleLimit, filteredCommits.length)} of{" "}
              {filteredCommits.length}
            </Caption1>
          </div>
          <div className={styles.list}>
            {visibleCommits.map((commit, index) => (
              <React.Fragment key={commit.id}>
                {index > 0 && <Divider />}
                <div className={styles.item}>
                  <div className={styles.itemHeader}>
                    {commit.pullRequest ? (
                      <Link
                        href={commit.pullRequest.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        PR #{commit.pullRequest.id}: {commit.pullRequest.title}
                      </Link>
                    ) : (
                      <>
                        <Badge appearance="outline">Direct commit</Badge>
                        <Body1>{commit.message.split("\n")[0]}</Body1>
                      </>
                    )}
                  </div>
                  <Caption1 className={styles.metadata}>
                    {commit.author.displayName} · {commit.id.slice(0, 7)} ·{" "}
                    {commit.files.length} changed{" "}
                    {commit.files.length === 1 ? "file" : "files"}
                  </Caption1>
                  {commit.files.length > 0 && (
                    <Caption1 className={styles.files}>
                      {commit.files
                        .slice(0, 4)
                        .map((file) => file.path)
                        .join(" · ")}
                      {commit.files.length > 4
                        ? ` · +${commit.files.length - 4} more`
                        : ""}
                    </Caption1>
                  )}
                </div>
              </React.Fragment>
            ))}
            {visibleCommits.length === 0 && (
              <div className={styles.empty}>No changes match this filter.</div>
            )}
            {visibleCommits.length < filteredCommits.length && (
              <div className={styles.listFooter}>
                <Button
                  appearance="secondary"
                  onClick={() => setVisibleLimit((value) => value + 50)}
                >
                  Show 50 more
                </Button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className={styles.empty}>
          <Title3>No relevant changes</Title3>
          <Body1>
            The builds differ, but no commits matched the configured path
            filters.
          </Body1>
        </div>
      )}

      {result.warnings.map((warning) => (
        <Caption1 className={styles.warning} key={warning}>
          {warning}
        </Caption1>
      ))}
    </Card>
  );
};
