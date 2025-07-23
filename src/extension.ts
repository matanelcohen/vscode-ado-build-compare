import * as vscode from "vscode";
import { exec } from "child_process"; // Import exec for running git command
import { AdcPipelineViewerConfig } from "./api";

let currentPanel: vscode.WebviewPanel | undefined = undefined;

// Simple WebviewViewProvider that immediately opens the React app
class BuildCompareViewProvider implements vscode.WebviewViewProvider {
  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    webviewView.webview.options = {
      enableScripts: true,
    };

    // Simple HTML that immediately opens the React app
    webviewView.webview.html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
          }
          .message {
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="message">
          <p>Opening Build Compare Tools...</p>
        </div>
        <script>
          // Immediately open the React app
          setTimeout(() => {
            window.parent.postMessage({ command: 'openReactApp' }, '*');
          }, 100);
        </script>
      </body>
      </html>
    `;

    // Open the React app immediately when view is resolved
    setTimeout(() => {
      vscode.commands.executeCommand("fe-ninja-tools.showPipelines");
    }, 100);
  }
}

// Helper function to get configuration
function getExtensionConfig(): AdcPipelineViewerConfig | null {
  const config = vscode.workspace.getConfiguration("buildCompareTools"); // Updated configuration section name
  const organizationUrl = config.get<string>("organizationUrl");
  const projectName = config.get<string>("projectName");
  const pipelineDefinitionId = config.get<number>("pipelineDefinitionId");
  const targetStageName = config.get<string>("targetStageName");
  const repositoryId = config.get<string>("repositoryId");
  const relevantPathFilter = config.get<string>("relevantPathFilter");

  if (
    !organizationUrl ||
    !projectName ||
    pipelineDefinitionId === undefined || // Check for undefined as 0 could be valid
    !targetStageName ||
    !repositoryId
  ) {
    vscode.window.showErrorMessage(
      "Build Compare Tools configuration is missing or incomplete in VS Code settings." // Updated error message
    );
    return null;
  }

  return {
    organizationUrl,
    projectName,
    pipelineDefinitionId,
    targetStageName,
    repositoryId,
    relevantPathFilter,
  };
}

// --- CardViewProvider (REMOVED - No longer using sidebar) ---
// Commented out completely to reduce bundle size
/*
class CardViewProvider implements vscode.WebviewViewProvider {
  // ... entire class implementation removed
}
*/

async function loadCompareBuildsByDefault() {
  try {
    const config = getExtensionConfig();
    if (!config) return;

    const session = await vscode.authentication.getSession(
      "microsoft",
      ["499b84ac-1321-427f-aa17-267ca6975798/.default"],
      { createIfNone: true }
    );

    if (session?.accessToken) {
      // No need to navigate since Compare Builds is now the default route
      console.log("Authentication ready for Compare Builds");
    }
  } catch (error) {
    console.error("Failed to auto-load compare builds:", error);
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "Build Compare Tools" is now active!'
  );

  // Register the simple webview view provider for the activity bar
  const viewProvider = new BuildCompareViewProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "build-compare-view",
      viewProvider
    )
  );

  // Auto-load Compare Builds by default
  loadCompareBuildsByDefault();

  // Register command to open extension settings
  context.subscriptions.push(
    vscode.commands.registerCommand("fe-ninja-tools.openSettings", () => {
      vscode.commands.executeCommand(
        "workbench.action.openSettings",
        "buildCompareTools"
      );
    })
  );

  // Command to show the main webview panel
  context.subscriptions.push(
    vscode.commands.registerCommand("fe-ninja-tools.showPipelines", () => {
      const column = vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.viewColumn
        : undefined;

      if (currentPanel) {
        currentPanel.reveal(column);
        return;
      }

      currentPanel = vscode.window.createWebviewPanel(
        "gaiaToolsReport",
        "Build Compare Tools - Compare Builds", // Updated title
        column || vscode.ViewColumn.One,
        {
          enableScripts: true,
          localResourceRoots: [
            vscode.Uri.joinPath(context.extensionUri, "out"),
          ],
          retainContextWhenHidden: true,
        }
      );

      currentPanel.webview.html = getWebviewContent(
        currentPanel.webview,
        context.extensionUri
      );

      const panelDisposables: vscode.Disposable[] = [];

      // Add listener for theme changes
      const themeChangeListener = vscode.window.onDidChangeActiveColorTheme(
        (theme) => {
          console.log("VS Code theme changed, notifying webview:", theme.kind);
          currentPanel?.webview.postMessage({
            command: "themeChanged",
            theme: `vscode-${vscode.ColorThemeKind[theme.kind].toLowerCase()}`, // e.g., vscode-dark
          });
        }
      );
      panelDisposables.push(themeChangeListener);

      // No need to navigate to /compare anymore since it's now the default route

      currentPanel.webview.onDidReceiveMessage(
        async (message) => {
          switch (message.command) {
            case "getTokenAndConfig": {
              // Changed command name
              try {
                const config = getExtensionConfig();
                if (!config) {
                  // Error message already shown by getExtensionConfig
                  currentPanel?.webview.postMessage({
                    command: "tokenAndConfigResponse",
                    token: null,
                    config: null,
                    error: "Configuration missing",
                  });
                  return;
                }

                const session = await vscode.authentication.getSession(
                  "microsoft",
                  ["499b84ac-1321-427f-aa17-267ca6975798/.default"],
                  { createIfNone: true }
                );

                currentPanel?.webview.postMessage({
                  command: "tokenAndConfigResponse", // Changed response command name
                  token: session?.accessToken,
                  config: config, // Send config along with token
                });
              } catch (error) {
                vscode.window.showErrorMessage(
                  "Failed to get authentication token."
                );
                currentPanel?.webview.postMessage({
                  command: "tokenAndConfigResponse",
                  token: null,
                  config: null,
                  error: "Failed to get token",
                });
              }
              return;
            }
            case "getCurrentBranch": {
              // Execute git command to get current branch
              // Ensure the command runs in the workspace root
              const workspaceFolder =
                vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
              if (!workspaceFolder) {
                currentPanel?.webview.postMessage({
                  command: "currentBranchResponse",
                  branch: null,
                  error: "Could not determine workspace folder.",
                });
                return;
              }
              exec(
                "git rev-parse --abbrev-ref HEAD",
                { cwd: workspaceFolder },
                (error, stdout, stderr) => {
                  if (error) {
                    console.error(`Error getting git branch: ${error.message}`);
                    currentPanel?.webview.postMessage({
                      command: "currentBranchResponse",
                      branch: null,
                      error: `Failed to get current branch: ${
                        stderr || error.message
                      }`,
                    });
                    return;
                  }
                  const branchName = stdout.trim();
                  // ADO API often expects full ref name (refs/heads/...)
                  const fullRefName = `refs/heads/${branchName}`;
                  currentPanel?.webview.postMessage({
                    command: "currentBranchResponse",
                    branch: fullRefName, // Send the full ref name
                  });
                }
              );
              return;
            }
            case "getTheme": {
              // Handle request for initial theme
              const currentTheme = vscode.window.activeColorTheme;
              console.log(
                "Webview requested theme, sending:",
                currentTheme.kind
              );
              currentPanel?.webview.postMessage({
                command: "themeChanged", // Reuse themeChanged command
                theme: `vscode-${vscode.ColorThemeKind[
                  currentTheme.kind
                ].toLowerCase()}`,
              });
              return;
            }
            // Add cases for other messages if needed
            case "openFileAtLine": {
              const { filePath, line } = message;
              const workspaceFolderUri =
                vscode.workspace.workspaceFolders?.[0]?.uri;
              if (!workspaceFolderUri) return;
              const absFileUri = vscode.Uri.joinPath(
                workspaceFolderUri,
                filePath
              );
              try {
                const doc = await vscode.workspace.openTextDocument(absFileUri);
                const editor = await vscode.window.showTextDocument(doc, {
                  preview: false,
                });
                const pos = new vscode.Position(
                  Math.max(0, (line || 1) - 1),
                  0
                );
                editor.revealRange(
                  new vscode.Range(pos, pos),
                  vscode.TextEditorRevealType.InCenter
                );
                editor.selection = new vscode.Selection(pos, pos);
              } catch (e) {
                vscode.window.showErrorMessage(
                  `Could not open file: ${filePath}`
                );
              }
              return;
            }
          }
        },
        undefined,
        panelDisposables
      );

      currentPanel.onDidDispose(
        () => {
          currentPanel = undefined;
          // Dispose theme listener when panel closes
          themeChangeListener.dispose();
          while (panelDisposables.length) {
            const d = panelDisposables.pop();
            if (d) {
              d.dispose();
            }
          }
        },
        null,
        context.subscriptions
      );
    })
  );

  // Command to handle navigation requests (from sidebar webview or elsewhere)
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "tools.navigate",
      (route: string = "/compare") => {
        // Default to compare if no route provided
        const targetRoute = route || "/compare";

        // 1. Ensure the main panel exists or create it
        if (!currentPanel) {
          vscode.commands
            .executeCommand("fe-ninja-tools.showPipelines")
            .then(() => {
              // Use a slight delay to ensure the panel is ready
              setTimeout(() => {
                if (currentPanel) {
                  console.log(
                    `Extension sending navigate message after opening: ${targetRoute}`
                  );
                  currentPanel.webview.postMessage({
                    type: "navigate",
                    payload: targetRoute,
                  });
                }
              }, 500);
            });
        } else {
          // 2. If panel exists, just send the message and reveal
          console.log(`Extension sending navigate message: ${targetRoute}`);
          currentPanel.webview.postMessage({
            type: "navigate",
            payload: targetRoute,
          });
          currentPanel.reveal();
        }
      }
    )
  );
}

// getWebviewContent for the *main panel*
function getWebviewContent(
  webview: vscode.Webview,
  extensionUri: vscode.Uri
): string {
  const scriptPathOnDisk = vscode.Uri.joinPath(
    extensionUri,
    "out",
    "webview.js"
  );
  const scriptUri = webview.asWebviewUri(scriptPathOnDisk);
  const nonce = getNonce();
  // Make CSP less restrictive for debugging
  return `<!DOCTYPE html>\n        <html lang="en">\n        <head>\n            <meta charset="UTF-8">\n            <meta name="viewport" content="width=device-width, initial-scale=1.0">\n            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline' https:; img-src ${webview.cspSource} https: data:; script-src 'nonce-${nonce}'; font-src ${webview.cspSource} https: data:; connect-src *;">\n            <title>Build Compare Tools UI Report</title>\n        </head>\n        <body>\n            <div id="root"></div>\n            <script type="module" nonce="${nonce}" src="${scriptUri}"></script>\n        </body>\n        </html>`;
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export function deactivate() {
  // Cleanup logic would go here if needed
}
