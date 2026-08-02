import * as React from "react";
import {
  Button,
  Caption1,
  Card,
  makeStyles,
  shorthands,
  Text,
  tokens,
} from "@fluentui/react-components";
import { DeleteRegular, HistoryRegular } from "@fluentui/react-icons";
import {
  clearComparisonHistory,
  getComparisonHistory,
} from "../../api-sdk";
import { ComparisonResult } from "../../models/comparison";
import { ComparisonHistoryEntry } from "../../models/history";

interface ComparisonHistoryProps {
  profileId: string;
  refreshKey: number;
  onOpen: (result: ComparisonResult) => void;
}

const useStyles = makeStyles({
  card: {
    ...shorthands.padding(tokens.spacingVerticalM),
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  item: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalM,
    ...shorthands.padding(tokens.spacingVerticalS),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
  },
});

export const ComparisonHistory: React.FC<ComparisonHistoryProps> = ({
  profileId,
  refreshKey,
  onOpen,
}) => {
  const styles = useStyles();
  const [entries, setEntries] = React.useState<ComparisonHistoryEntry[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    void getComparisonHistory(profileId).then((history) => {
      if (!cancelled) {
        setEntries(history);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [profileId, refreshKey]);

  if (entries.length === 0) {
    return null;
  }

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <Text weight="semibold">
          <HistoryRegular /> Recent comparisons
        </Text>
        <Button
          appearance="subtle"
          icon={<DeleteRegular />}
          onClick={() => {
            void clearComparisonHistory(profileId).then(() => setEntries([]));
          }}
        >
          Clear
        </Button>
      </div>
      {entries.slice(0, 5).map((entry) => (
        <div className={styles.item} key={entry.id}>
          <div>
            <Text>
              {entry.result.baseBuild.buildNumber} →{" "}
              {entry.result.targetBuild.buildNumber}
            </Text>
            <Caption1 block>
              {new Date(entry.createdAt).toLocaleString()} ·{" "}
              {entry.result.risk.level} risk
            </Caption1>
          </div>
          <Button onClick={() => onOpen(entry.result)}>Open</Button>
        </div>
      ))}
    </Card>
  );
};
