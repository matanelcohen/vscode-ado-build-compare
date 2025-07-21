import * as React from "react";
import * as ReactDOM from "react-dom/client"; // Import from react-dom/client for React 18
import { App } from "./App";
// initializeIcons is v8, not needed for v9 icons used directly
// import { initializeIcons } from "@fluentui/react/lib/Icons";
import { MemoryRouter } from "react-router-dom";

// initializeIcons(); // Remove v8 icon initialization

declare const acquireVsCodeApi: any;
const vscode = acquireVsCodeApi();

// Use createRoot for React 18
const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode> { /* Added StrictMode */ }
      <MemoryRouter>
        <App vscode={vscode} />
      </MemoryRouter>
    </React.StrictMode>
  );
} else {
  console.error("Failed to find the root element");
}
