import * as React from "react";
import { ComparisonPage } from "./pages/ComparisonPage";
import { SetupPage } from "./pages/SetupPage";
import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  teamsHighContrastTheme,
  Theme
} from "@fluentui/react-components";
import { useAppearancePreferences } from "./hooks/useAppearancePreferences";
import { useVSCodeTheme } from "./hooks/useVSCodeTheme";
import { resolveAppearanceTheme } from "./theme";

interface AppProps {
  vscode: any;
  view?: "comparison" | "setup";
}

const vscodeThemeToFluentTheme: Record<string, Theme> = {
  'vscode-light': webLightTheme,
  'vscode-dark': webDarkTheme,
  'vscode-high-contrast': teamsHighContrastTheme,
};

export const App: React.FC<AppProps> = ({ vscode, view = "comparison" }) => {
  const vscodeTheme = useVSCodeTheme(vscode);
  const { appearance, updateAppearance } = useAppearancePreferences(vscode);
  const editorTheme = vscodeThemeToFluentTheme[vscodeTheme] || webDarkTheme;
  const { fluentTheme, cssVariables } = React.useMemo(
    () =>
      resolveAppearanceTheme(
        appearance.colorTheme,
        appearance.density,
        editorTheme
      ),
    [appearance.colorTheme, appearance.density, editorTheme]
  );

  React.useEffect(() => {
    vscode.postMessage({ command: "webviewReady" });
  }, [vscode]);

  React.useEffect(() => {
    vscode.postMessage({ command: "getTheme" });
  }, [vscode]);

  return (
    <FluentProvider
      theme={fluentTheme}
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--vscode-editor-background)",
        ...cssVariables,
      }}
    >
      {view === "setup" ? (
        <SetupPage />
      ) : (
        <ComparisonPage
          vscode={vscode}
          appearance={appearance}
          onAppearanceChange={updateAppearance}
        />
      )}
    </FluentProvider>
  );
};
