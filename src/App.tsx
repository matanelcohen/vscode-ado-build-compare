// src/App.tsx
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
import { useVSCodeTheme } from "./hooks/useVSCodeTheme"; // Assuming you create this hook

interface AppProps {
  vscode: any;
}

// Map VS Code theme kinds to Fluent UI themes
const vscodeThemeToFluentTheme: Record<string, Theme> = {
  'vscode-light': webLightTheme,
  'vscode-dark': webDarkTheme,
  'vscode-high-contrast': teamsHighContrastTheme,
  // Add mappings for other themes if necessary
};

export const App: React.FC<AppProps> = ({ vscode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const vscodeTheme = useVSCodeTheme(vscode); // Get current VS Code theme

  // Determine the Fluent theme based on the VS Code theme
  const fluentTheme = vscodeThemeToFluentTheme[vscodeTheme] || webDarkTheme; // Default to dark

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      switch (message.type) {
        case "navigate":
          console.log("Webview received navigate message:", message.payload);
          // Prevent navigation if already on the target route
          if (location.pathname !== message.payload) {
            navigate(message.payload);
          }
          break;
      }
    };

    window.addEventListener("message", handleMessage);

    // Request initial theme on load
    vscode.postMessage({ command: 'getTheme' });

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [navigate, vscode, location.pathname]); // Add location.pathname dependency

  return (
    <FluentProvider
      theme={fluentTheme}
      style={{ height: "100vh", display: "flex", flexDirection: "column" }}
    >
      {/* Use Routes instead of Stack for routing */}
      <Routes>
        <Route path="/" element={<ComparisonPage vscode={vscode} />} />
        <Route path="/compare" element={<ComparisonPage vscode={vscode} />} />
      </Routes>
    </FluentProvider>
  );
};
