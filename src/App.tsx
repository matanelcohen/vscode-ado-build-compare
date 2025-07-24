import * as React from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
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
  const navigate = useNavigate();
  const location = useLocation();
  const vscodeTheme = useVSCodeTheme(vscode);

  const fluentTheme = vscodeThemeToFluentTheme[vscodeTheme] || webDarkTheme;

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      switch (message.type) {
        case "navigate":
          if (location.pathname !== message.payload) {
            navigate(message.payload);
          }
          break;
      }
    };

    window.addEventListener("message", handleMessage);

    vscode.postMessage({ command: 'getTheme' });

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [navigate, vscode, location.pathname]);

  return (
    <FluentProvider
      theme={fluentTheme}
      style={{ height: "100vh", display: "flex", flexDirection: "column" }}
    >
      <Routes>
        <Route path="/" element={<ComparisonPage vscode={vscode} />} />
        <Route path="/compare" element={<ComparisonPage vscode={vscode} />} />
      </Routes>
    </FluentProvider>
  );
};
