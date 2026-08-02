import * as React from "react";
import {
  Button,
  Dropdown,
  Link,
  makeStyles,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Option,
  shorthands,
  Text,
  Textarea,
  tokens,
} from "@fluentui/react-components";
import {
  BotSparkleRegular,
  DocumentArrowDownRegular,
  TaskListAddRegular,
} from "@fluentui/react-icons";
import {
  createComparisonWorkItem,
  exportComparison,
  generateAiSummary,
} from "../../api-sdk";
import { ComparisonResult } from "../../models/comparison";
import { generateDeterministicSummary } from "../../utils/riskAnalysis";

interface ReportActionsProps {
  profileId: string;
  result: ComparisonResult;
  onSummaryChanged: (summary: string) => void;
}

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    ...shorthands.padding(tokens.spacingVerticalM),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
  },
});

export const ReportActions: React.FC<ReportActionsProps> = ({
  profileId,
  result,
  onSummaryChanged,
}) => {
  const styles = useStyles();
  const [summary, setSummary] = React.useState(() =>
    generateDeterministicSummary(result)
  );
  const [workItemType, setWorkItemType] = React.useState("Task");
  const [busy, setBusy] = React.useState(false);
  const [status, setStatus] = React.useState<{
    intent: "success" | "error";
    text: string;
    url?: string;
  } | null>(null);

  React.useEffect(() => {
    const next = generateDeterministicSummary(result);
    setSummary(next);
    onSummaryChanged(next);
  }, [result, onSummaryChanged]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setStatus(null);
    try {
      await action();
    } catch (error: unknown) {
      setStatus({
        intent: "error",
        text: error instanceof Error ? error.message : "The action failed.",
      });
    } finally {
      setBusy(false);
    }
  };

  const updateSummary = (value: string) => {
    setSummary(value);
    onSummaryChanged(value);
  };

  return (
    <div className={styles.root}>
      <Text weight="semibold">Release summary and exports</Text>
      <Textarea
        resize="vertical"
        rows={5}
        value={summary}
        onChange={(_, data) => updateSummary(data.value)}
        aria-label="Editable release summary"
      />
      <div className={styles.actions}>
        <Button
          icon={<BotSparkleRegular />}
          disabled={busy}
          onClick={() =>
            void run(async () => {
              updateSummary(await generateAiSummary(result));
              setStatus({
                intent: "success",
                text: "Copilot generated an editable release summary.",
              });
            })
          }
        >
          Generate with Copilot
        </Button>
        <Button
          icon={<DocumentArrowDownRegular />}
          disabled={busy}
          onClick={() =>
            void run(async () => {
              const path = await exportComparison(result, "markdown", summary);
              if (path) {
                setStatus({ intent: "success", text: "Markdown exported." });
              }
            })
          }
        >
          Export Markdown
        </Button>
        <Button
          icon={<DocumentArrowDownRegular />}
          disabled={busy}
          onClick={() =>
            void run(async () => {
              const path = await exportComparison(result, "json", summary);
              if (path) {
                setStatus({ intent: "success", text: "JSON exported." });
              }
            })
          }
        >
          Export JSON
        </Button>
        <Dropdown
          value={workItemType}
          selectedOptions={[workItemType]}
          onOptionSelect={(_, data) =>
            setWorkItemType(data.optionValue ?? "Task")
          }
          aria-label="Azure DevOps work item type"
        >
          {["Task", "Issue", "Bug"].map((type) => (
            <Option key={type} value={type}>
              {type}
            </Option>
          ))}
        </Dropdown>
        <Button
          icon={<TaskListAddRegular />}
          disabled={busy}
          onClick={() =>
            void run(async () => {
              const created = await createComparisonWorkItem(
                profileId,
                result,
                `Deployment ${result.targetBuild.buildNumber}: ${result.risk.level} risk`,
                workItemType,
                summary
              );
              setStatus({
                intent: "success",
                text: `Created ${workItemType} #${created.id}.`,
                ...(created.url ? { url: created.url } : {}),
              });
            })
          }
        >
          Create ADO work item
        </Button>
      </div>
      <Text size={200}>
        Copilot is invoked only when you click Generate; comparison metadata is
        sent to your selected VS Code language model provider.
      </Text>
      {status && (
        <MessageBar intent={status.intent}>
          <MessageBarBody>
            <MessageBarTitle>
              {status.intent === "success" ? "Complete" : "Action failed"}
            </MessageBarTitle>
            {status.text}{" "}
            {status.url && (
              <Link href={status.url} target="_blank" rel="noreferrer">
                Open in Azure DevOps
              </Link>
            )}
          </MessageBarBody>
        </MessageBar>
      )}
    </div>
  );
};
