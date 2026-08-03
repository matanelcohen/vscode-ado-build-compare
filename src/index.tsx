import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { App } from "./App";
import { setVSCodeApi } from "./api-sdk";

declare const acquireVsCodeApi: any;
const vscode = acquireVsCodeApi();

const view =
  (window as unknown as { __releaseLensView?: "comparison" | "setup" })
    .__releaseLensView ?? "comparison";

// Set the vscode API for the api-sdk module
setVSCodeApi(vscode);

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App vscode={vscode} view={view} />
    </React.StrictMode>
  );
} else {
  throw new Error("Failed to find the root element");
}
