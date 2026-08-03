import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { App } from "../App";
import { setVSCodeApi } from "../api-sdk";
import {
  createDemoVsCodeApi,
  loadDemoComparison,
  notifyDemoTheme,
} from "./demoHost";

const demoApi = createDemoVsCodeApi();
setVSCodeApi(demoApi);

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Failed to find the root element");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App vscode={demoApi} view="comparison" />
  </React.StrictMode>
);

const themeToggle = document.getElementById("demo-theme-toggle");
themeToggle?.addEventListener("click", () => {
  const light = document.body.classList.toggle("demo-light");
  themeToggle.textContent = light ? "Dark theme" : "Light theme";
  notifyDemoTheme(light ? "vscode-light" : "vscode-dark");
});

const reloadButton = document.getElementById("demo-reload-sample");
reloadButton?.addEventListener("click", () => loadDemoComparison());
