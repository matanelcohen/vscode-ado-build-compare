import * as React from "react";
import {
  Badge,
  Button,
  Card,
  makeStyles,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  shorthands,
  Text,
  Title3,
  tokens,
} from "@fluentui/react-components";
import {
  AddRegular,
  DeleteRegular,
  EditRegular,
  PlugConnectedRegular,
} from "@fluentui/react-icons";
import {
  deletePipelineProfile,
  editPipelineProfile,
  runSmartOnboarding,
  switchPipelineProfile,
} from "../../api-sdk";
import { PipelineProfile } from "../../models/profile";

interface ProfileControlsProps {
  activeProfile: PipelineProfile | null;
  profileCount: number;
  needsOnboarding: boolean;
  onChanged: () => void;
}

const useStyles = makeStyles({
  onboarding: {
    ...shorthands.padding(tokens.spacingVerticalXXL, tokens.spacingHorizontalXXL),
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    alignItems: "flex-start",
  },
  controls: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
  },
});

export const ProfileControls: React.FC<ProfileControlsProps> = ({
  activeProfile,
  profileCount,
  needsOnboarding,
  onChanged,
}) => {
  const styles = useStyles();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      onChanged();
    } catch (caught: unknown) {
      setError(
        caught instanceof Error ? caught.message : "The profile action failed."
      );
    } finally {
      setBusy(false);
    }
  };

  if (needsOnboarding) {
    return (
      <Card className={styles.onboarding}>
        <PlugConnectedRegular fontSize={32} />
        <Title3>Connect your first Azure DevOps pipeline</Title3>
        <Text>
          The guided setup discovers your projects, repositories, pipelines,
          and deployment stages. No IDs need to be copied manually.
        </Text>
        <Button
          appearance="primary"
          icon={<PlugConnectedRegular />}
          disabled={busy}
          onClick={() => void run(runSmartOnboarding)}
        >
          {busy ? "Opening setup..." : "Start guided setup"}
        </Button>
        {error && (
          <MessageBar intent="error">
            <MessageBarBody>
              <MessageBarTitle>Setup failed</MessageBarTitle>
              {error}
            </MessageBarBody>
          </MessageBar>
        )}
      </Card>
    );
  }

  return (
    <>
      <div className={styles.controls}>
        {activeProfile && (
          <Badge appearance="tint" color="brand">
            {activeProfile.name}
          </Badge>
        )}
        <Button
          icon={<PlugConnectedRegular />}
          disabled={busy || profileCount < 2}
          onClick={() => void run(switchPipelineProfile)}
        >
          Switch
        </Button>
        <Button
          icon={<AddRegular />}
          disabled={busy}
          onClick={() => void run(runSmartOnboarding)}
        >
          Add profile
        </Button>
        <Button
          icon={<EditRegular />}
          disabled={busy || profileCount === 0}
          onClick={() => void run(editPipelineProfile)}
        >
          Edit
        </Button>
        <Button
          icon={<DeleteRegular />}
          disabled={busy || profileCount === 0}
          onClick={() => void run(deletePipelineProfile)}
        >
          Delete
        </Button>
      </div>
      {error && (
        <MessageBar intent="error">
          <MessageBarBody>
            <MessageBarTitle>Profile action failed</MessageBarTitle>
            {error}
          </MessageBarBody>
        </MessageBar>
      )}
    </>
  );
};
