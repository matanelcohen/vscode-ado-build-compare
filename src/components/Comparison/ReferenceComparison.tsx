import * as React from "react";
import {
  Button,
  Card,
  Dropdown,
  makeStyles,
  MessageBar,
  MessageBarBody,
  Option,
  shorthands,
  Text,
  tokens,
} from "@fluentui/react-components";
import { BranchCompareRegular } from "@fluentui/react-icons";
import {
  compareGitReferences,
  getGitReferences,
} from "../../api-sdk";
import {
  ComparisonResult,
  GitReference,
} from "../../models/comparison";

interface ReferenceComparisonProps {
  profileId: string;
  onCompared: (result: ComparisonResult) => void;
}

const useStyles = makeStyles({
  card: {
    ...shorthands.padding(tokens.spacingVerticalM),
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  controls: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: tokens.spacingHorizontalM,
    alignItems: "end",
  },
});

export const ReferenceComparison: React.FC<ReferenceComparisonProps> = ({
  profileId,
  onCompared,
}) => {
  const styles = useStyles();
  const [expanded, setExpanded] = React.useState(false);
  const [references, setReferences] = React.useState<GitReference[]>([]);
  const [baseName, setBaseName] = React.useState("");
  const [targetName, setTargetName] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const open = async () => {
    setExpanded(true);
    if (references.length > 0) {
      return;
    }
    setBusy(true);
    try {
      setReferences(await getGitReferences(profileId));
    } catch (caught: unknown) {
      setError(
        caught instanceof Error ? caught.message : "Could not load Git refs."
      );
    } finally {
      setBusy(false);
    }
  };

  if (!expanded) {
    return (
      <Button
        appearance="secondary"
        icon={<BranchCompareRegular />}
        onClick={() => void open()}
      >
        Compare branches or tags
      </Button>
    );
  }

  const base = references.find((reference) => reference.name === baseName);
  const target = references.find((reference) => reference.name === targetName);

  return (
    <Card className={styles.card}>
      <Text weight="semibold">Compare branches or tags</Text>
      <div className={styles.controls}>
        <Dropdown
          placeholder="Base branch or tag"
          value={base ? `${base.kind}: ${base.displayName}` : ""}
          selectedOptions={base ? [base.name] : []}
          onOptionSelect={(_, data) => setBaseName(data.optionValue ?? "")}
          disabled={busy}
        >
          {references.map((reference) => (
            <Option
              key={reference.name}
              value={reference.name}
              text={`${reference.kind}: ${reference.displayName}`}
            >
              {reference.kind}: {reference.displayName}
            </Option>
          ))}
        </Dropdown>
        <Dropdown
          placeholder="Target branch or tag"
          value={target ? `${target.kind}: ${target.displayName}` : ""}
          selectedOptions={target ? [target.name] : []}
          onOptionSelect={(_, data) => setTargetName(data.optionValue ?? "")}
          disabled={busy}
        >
          {references.map((reference) => (
            <Option
              key={reference.name}
              value={reference.name}
              text={`${reference.kind}: ${reference.displayName}`}
            >
              {reference.kind}: {reference.displayName}
            </Option>
          ))}
        </Dropdown>
        <Button
          appearance="primary"
          icon={<BranchCompareRegular />}
          disabled={busy || !base || !target || base.name === target.name}
          onClick={() => {
            if (!base || !target) {
              return;
            }
            setBusy(true);
            setError(null);
            void compareGitReferences(profileId, base, target)
              .then(onCompared)
              .catch((caught: unknown) =>
                setError(
                  caught instanceof Error
                    ? caught.message
                    : "Could not compare refs."
                )
              )
              .finally(() => setBusy(false));
          }}
        >
          {busy ? "Comparing..." : "Compare references"}
        </Button>
      </div>
      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}
    </Card>
  );
};
