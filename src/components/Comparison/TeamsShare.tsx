import * as React from "react";
import {
  Button,
  Checkbox,
  Input,
  makeStyles,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  shorthands,
  Text,
  tokens,
} from "@fluentui/react-components";
import { SendRegular, SettingsRegular } from "@fluentui/react-icons";
import { AddRegular } from "@fluentui/react-icons";
import {
  configureTeamsWebhook,
  getTeamsConfiguration,
  sendTeamsComparison,
  TeamsConfigurationStatus,
} from "../../api-sdk";
import { ComparisonResult, TeamsMention } from "../../models/comparison";
import { isLikelyTeamsUpn } from "../../teams/adaptiveCard";

interface TeamsShareProps {
  result: ComparisonResult;
  summary?: string;
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
  mentions: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    flexWrap: "wrap",
  },
});

export const TeamsShare: React.FC<TeamsShareProps> = ({ result, summary }) => {
  const styles = useStyles();
  const [configuration, setConfiguration] =
    React.useState<TeamsConfigurationStatus>({ configured: false });
  const [title, setTitle] = React.useState(
    `Deployment ${result.targetBuild.buildNumber} comparison`
  );
  const [mentions, setMentions] = React.useState<TeamsMention[]>([]);
  const [sending, setSending] = React.useState(false);
  const [manualName, setManualName] = React.useState("");
  const [manualUpn, setManualUpn] = React.useState("");
  const [status, setStatus] = React.useState<{
    intent: "success" | "error";
    message: string;
  } | null>(null);

  React.useEffect(() => {
    setTitle(`Deployment ${result.targetBuild.buildNumber} comparison`);
    setMentions([]);
    setManualName("");
    setManualUpn("");
    setStatus(null);
  }, [
    result.baseBuild.id,
    result.baseBuild.sourceVersion,
    result.targetBuild.id,
    result.targetBuild.sourceVersion,
    result.targetBuild.buildNumber,
  ]);

  React.useEffect(() => {
    void getTeamsConfiguration()
      .then(setConfiguration)
      .catch((error: unknown) =>
        setStatus({
          intent: "error",
          message:
            error instanceof Error
              ? error.message
              : "Could not read Teams configuration.",
        })
      );
  }, []);

  const configurableMentions = result.contributors
    .map((contributor) => ({
      contributor,
      userId: contributor.email?.trim() ?? "",
    }))
    .filter(({ userId }) => isLikelyTeamsUpn(userId))
    .slice(0, 20);

  const toggleMention = (
    displayName: string,
    userId: string,
    checked: boolean
  ) => {
    setMentions((current) =>
      checked
        ? [...current, { displayName, userId }]
        : current.filter((mention) => mention.userId !== userId)
    );
  };

  const configure = async () => {
    setStatus(null);
    try {
      setConfiguration(await configureTeamsWebhook());
    } catch (error: unknown) {
      setStatus({
        intent: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not configure Teams.",
      });
    }
  };

  const send = async () => {
    setSending(true);
    setStatus(null);
    try {
      await sendTeamsComparison({
        title,
        comparison: result,
        mentions,
        ...(summary?.trim() ? { summary: summary.trim() } : {}),
      });
      setStatus({
        intent: "success",
        message: `Message accepted by ${
          configuration.destinationName ?? "the Teams Workflow"
        }.`,
      });
    } catch (error: unknown) {
      setStatus({
        intent: "error",
        message:
          error instanceof Error ? error.message : "Could not send to Teams.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.root}>
      <Text weight="semibold">Share with Microsoft Teams</Text>
      <Input
        value={title}
        onChange={(_, data) => setTitle(data.value)}
        aria-label="Teams message title"
      />
      {configurableMentions.length > 0 && (
        <>
          <Text size={200}>
            Notify contributors (uses their ADO identity as a Teams UPN)
          </Text>
          <div className={styles.mentions}>
            {configurableMentions.map(({ contributor, userId }) => {
              return (
                <Checkbox
                  key={userId}
                  label={contributor.displayName}
                  checked={mentions.some(
                    (mention) => mention.userId === userId
                  )}
                  onChange={(_, data) =>
                    toggleMention(
                      contributor.displayName,
                      userId,
                      data.checked === true
                    )
                  }
                />
              );
            })}
          </div>
        </>
      )}
      <div className={styles.actions}>
        <Input
          value={manualName}
          onChange={(_, data) => setManualName(data.value)}
          placeholder="Person's display name"
          aria-label="Manual mention display name"
        />
        <Input
          value={manualUpn}
          onChange={(_, data) => setManualUpn(data.value)}
          placeholder="user@company.com"
          aria-label="Manual mention UPN"
        />
        <Button
          icon={<AddRegular />}
          disabled={!manualName.trim() || !isLikelyTeamsUpn(manualUpn)}
          onClick={() => {
            setMentions((current) => [
              ...current.filter(
                (mention) =>
                  mention.userId.toLocaleLowerCase() !==
                  manualUpn.trim().toLocaleLowerCase()
              ),
              {
                displayName: manualName.trim(),
                userId: manualUpn.trim(),
              },
            ]);
            setManualName("");
            setManualUpn("");
          }}
        >
          Add mention
        </Button>
      </div>
      <div className={styles.actions}>
        <Button icon={<SettingsRegular />} onClick={() => void configure()}>
          {configuration.configured ? "Change destination" : "Configure Teams"}
        </Button>
        <Button
          appearance="primary"
          icon={<SendRegular />}
          disabled={!configuration.configured || sending || !title.trim()}
          onClick={() => void send()}
        >
          {sending ? "Sending..." : "Send Adaptive Card"}
        </Button>
        {configuration.configured && (
          <Text size={200}>
            Destination: {configuration.destinationName ?? "Teams Workflow"}
          </Text>
        )}
      </div>
      {status && (
        <MessageBar intent={status.intent}>
          <MessageBarBody>
            <MessageBarTitle>
              {status.intent === "success" ? "Sent" : "Teams error"}
            </MessageBarTitle>
            {status.message}
          </MessageBarBody>
        </MessageBar>
      )}
    </div>
  );
};
