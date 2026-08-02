import * as React from "react";
import { AdcPipelineViewerConfig } from "../api-sdk";
import { PipelineProfile } from "../models/profile";

interface VsCodeApi {
  postMessage: (message: any) => void;
}

export function useAuthAndConfig(vscode: VsCodeApi | undefined): {
  config: AdcPipelineViewerConfig | null;
  error: string | null;
  loading: boolean;
  profile: PipelineProfile | null;
  profiles: PipelineProfile[];
  needsOnboarding: boolean;
  reload: () => void;
} {
  const [config, setConfig] = React.useState<AdcPipelineViewerConfig | null>(
    null
  );
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<PipelineProfile | null>(null);
  const [profiles, setProfiles] = React.useState<PipelineProfile[]>([]);
  const [needsOnboarding, setNeedsOnboarding] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);
  const reload = React.useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((value) => value + 1);
  }, []);

  React.useEffect(() => {
    if (!vscode) {
      setError("Could not communicate with the extension host.");
      setLoading(false);
      return;
    }

    const messageHandler = (event: MessageEvent) => {
      const message = event.data;
      if (message?.command === "profilesChanged") {
        setLoading(true);
        setError(null);
        setReloadKey((value) => value + 1);
        return;
      }
      if (message?.command === "authAndConfigResponse") {
        setConfig(message.config);
        setProfile(message.profile ?? null);
        setProfiles(message.profiles ?? []);
        setNeedsOnboarding(Boolean(message.needsOnboarding));
        if (!message.authenticated || message.error) {
          setError(
            message.error || "Could not authenticate with Azure DevOps."
          );
        } else if (!message.config) {
          setError(null);
        }
        setLoading(false);
      }
    };

    window.addEventListener("message", messageHandler);
    vscode.postMessage({ command: "getAuthAndConfig" });

    return () => {
      window.removeEventListener("message", messageHandler);
    };
  }, [vscode, reloadKey]);

  return {
    config,
    error,
    loading,
    profile,
    profiles,
    needsOnboarding,
    reload,
  };
}
