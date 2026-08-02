import * as React from "react";
import { ComparisonPage } from "./pages/ComparisonPage";
import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  teamsHighContrastTheme,
  Theme
} from "@fluentui/react-components";
import { useVSCodeTheme } from "./hooks/useVSCodeTheme";

interface AppProps {
  vscode: any;
}

const vscodeThemeToFluentTheme: Record<string, Theme> = {
  'vscode-light': webLightTheme,
  'vscode-dark': webDarkTheme,
  'vscode-high-contrast': teamsHighContrastTheme,
};

export const App: React.FC<AppProps> = ({ vscode }) => {
  const vscodeTheme = useVSCodeTheme(vscode);

  const fluentTheme = vscodeThemeToFluentTheme[vscodeTheme] || webDarkTheme;

  React.useEffect(() => {
    vscode.postMessage({ command: "webviewReady" });
  }, [vscode]);

  React.useEffect(() => {
    vscode.postMessage({ command: "getTheme" });
  }, [vscode]);

  return (
    <FluentProvider
      theme={fluentTheme}
      style={{ height: "100vh", display: "flex", flexDirection: "column" }}
    >
      <ComparisonPage vscode={vscode} />
    </FluentProvider>
  );
};
