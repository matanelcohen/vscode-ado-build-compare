import * as React from "react";
import {
  Button,
  Caption1,
  Dropdown,
  MessageBar,
  MessageBarBody,
  Option,
} from "@fluentui/react-components";
import { ArrowSwapRegular } from "@fluentui/react-icons";
import { compareProfileEnvironments } from "../../api-sdk";
import { ComparisonResult } from "../../models/comparison";
import { PipelineProfile } from "../../models/profile";

interface EnvironmentDriftProps {
  activeProfile: PipelineProfile;
  profiles: PipelineProfile[];
  onCompared: (result: ComparisonResult) => void;
}

export const EnvironmentDrift: React.FC<EnvironmentDriftProps> = ({
  activeProfile,
  profiles,
  onCompared,
}) => {
  const compatibleProfiles = profiles.filter(
    (profile) =>
      profile.id !== activeProfile.id &&
      profile.config.organizationUrl ===
        activeProfile.config.organizationUrl &&
      profile.config.projectName === activeProfile.config.projectName &&
      profile.config.repositoryId === activeProfile.config.repositoryId
  );
  const [targetId, setTargetId] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (compatibleProfiles.length === 0) {
    return null;
  }

  const target = compatibleProfiles.find(
    (profile) => profile.id === targetId
  );
  return (
    <>
      <Dropdown
        placeholder="Compare environment drift..."
        value={target?.name ?? ""}
        selectedOptions={target ? [target.id] : []}
        onOptionSelect={(_, data) => setTargetId(data.optionValue ?? "")}
        aria-label="Target environment profile"
      >
        {compatibleProfiles.map((profile) => (
          <Option key={profile.id} value={profile.id}>
            {profile.name}
          </Option>
        ))}
      </Dropdown>
      <Button
        icon={<ArrowSwapRegular />}
        disabled={!target || busy}
        onClick={() => {
          if (!target) {
            return;
          }
          setBusy(true);
          setError(null);
          void compareProfileEnvironments(activeProfile.id, target.id)
            .then(onCompared)
            .catch((caught: unknown) =>
              setError(
                caught instanceof Error
                  ? caught.message
                  : "Could not compare environments."
              )
            )
            .finally(() => setBusy(false));
        }}
      >
        {busy ? "Comparing drift..." : "Compare environments"}
      </Button>
      <Caption1>
        Shows commits deployed to the target profile that are not present in
        the active profile.
      </Caption1>
      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}
    </>
  );
};
