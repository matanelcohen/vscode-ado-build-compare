import * as React from "react";
import { AdcPipelineViewerConfig } from "../api-sdk";

interface VsCodeApi {
  postMessage: (message: any) => void;
}

export function useAuthAndConfig(vscode: VsCodeApi | undefined): {
  accessToken: string | null;
  config: AdcPipelineViewerConfig | null;
  error: string | null;
  loading: boolean;
} {
  const [accessToken, setAccessToken] = React.useState<string | null>(null);
  const [config, setConfig] = React.useState<AdcPipelineViewerConfig | null>(
    null
  );
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!vscode) {
      setError("Could not communicate with the extension host.");
      setLoading(false);
      return;
    }

    vscode.postMessage({ command: "getTokenAndConfig" });

    const messageHandler = (event: MessageEvent) => {
      const message = event.data;
      if (message?.command === "tokenAndConfigResponse") {
        setAccessToken(message.token);
        setConfig(message.config);
        if (!message.token || !message.config || message.error) {
          setError(
            message.error || "Failed to retrieve access token or configuration."
          );
        }
        setLoading(false);
      }
    };

    window.addEventListener("message", messageHandler);

    return () => {
      window.removeEventListener("message", messageHandler);
    };
  }, [vscode]);

  return { accessToken, config, error, loading };
}
