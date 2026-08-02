import * as React from "react";
import {
  Badge,
  Body1,
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
});

export const CommitComparisonResults: React.FC<
  CommitComparisonResultsProps
> = ({ result }) => {
  const styles = useStyles();
  const [query, setQuery] = React.useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleCommits = result.commits.filter((commit) => {
    if (!normalizedQuery) {
      return true;
    }
    return [
      commit.message,
      commit.author.displayName,
      commit.pullRequest?.title,
      commit.pullRequest?.id.toString(),
      ...commit.files.map((file) => file.path),
    ].some((value) => value?.toLocaleLowerCase().includes(normalizedQuery));
  });

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
        <Caption1>
          Filtered to: {result.pathFilters.map((path) => `\`${path}\``).join(", ")}
        </Caption1>
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
