import * as vscode from "vscode";
import { exec } from "child_process";
import { AdcPipelineViewerConfig } from "./api";
import { AdoService } from "./services/AdoService";

let currentPanel: vscode.WebviewPanel | undefined = undefined;

class BuildCompareViewProvider implements vscode.WebviewViewProvider {
  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    webviewView.webview.options = {
      enableScripts: true,
    };

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
          setTimeout(() => {
            window.parent.postMessage({ command: 'openReactApp' }, '*');
          }, 100);
        </script>
      </body>
      </html>
    `;

    setTimeout(() => {
      vscode.commands.executeCommand("fe-ninja-tools.showPipelines");
    }, 100);
  }
}

function getExtensionConfig(): AdcPipelineViewerConfig | null {
  const config = vscode.workspace.getConfiguration("buildCompareTools");
  const organizationUrl = config.get<string>("organizationUrl");
  const projectName = config.get<string>("projectName");
  const pipelineDefinitionId = config.get<number>("pipelineDefinitionId");
  const targetStageName = config.get<string>("targetStageName");
  const repositoryId = config.get<string>("repositoryId");
  const relevantPathFilter = config.get<string>("relevantPathFilter");

  if (
    !organizationUrl ||
    !projectName ||
    pipelineDefinitionId === undefined ||
    !targetStageName ||
    !repositoryId
  ) {
    vscode.window.showErrorMessage(
      "Build Compare Tools configuration is missing or incomplete in VS Code settings."
    );
    return null;
  }

  return {
    organizationUrl,
    projectName,
    pipelineDefinitionId,
    targetStageName,
    repositoryId,
    relevantPathFilter: relevantPathFilter ?? "",
  };
}

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
      return;
    }
  } catch (error) {
    return;
  }
}

export function activate(context: vscode.ExtensionContext) {
  const viewProvider = new BuildCompareViewProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "build-compare-view",
      viewProvider
    )
  );

  loadCompareBuildsByDefault();

  context.subscriptions.push(
    vscode.commands.registerCommand("fe-ninja-tools.openSettings", () => {
      vscode.commands.executeCommand(
        "workbench.action.openSettings",
        "buildCompareTools"
      );
    })
  );

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
        "Build Compare Tools - Compare Builds",
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

      const themeChangeListener = vscode.window.onDidChangeActiveColorTheme(
        (theme) => {
          currentPanel?.webview.postMessage({
            command: "themeChanged",
            theme: `vscode-${vscode.ColorThemeKind[theme.kind].toLowerCase()}`,
          });
        }
      );
      panelDisposables.push(themeChangeListener);
      currentPanel.webview.onDidReceiveMessage(
        async (message) => {
          switch (message.command) {
            case "getTokenAndConfig": {
              try {
                const config = getExtensionConfig();
                if (!config) {
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
                  command: "tokenAndConfigResponse",
                  token: session?.accessToken,
                  config: config,
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
                  const fullRefName = `refs/heads/${branchName}`;
                  currentPanel?.webview.postMessage({
                    command: "currentBranchResponse",
                    branch: fullRefName,
                  });
                }
              );
              return;
            }
            case "getTheme": {
              const currentTheme = vscode.window.activeColorTheme;
              currentPanel?.webview.postMessage({
                command: "themeChanged",
                theme: `vscode-${vscode.ColorThemeKind[
                  currentTheme.kind
                ].toLowerCase()}`,
              });
              return;
            }
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
            case "findLatestDeployedRun": {
              try {
                const { accessToken, config } = message;
                const adoService = new AdoService(
                  config.organizationUrl,
                  accessToken,
                  config
                );
                const result = await adoService.findLatestDeployedRun();
                currentPanel?.webview.postMessage({
                  command: "findLatestDeployedRunResponse",
                  requestId: message.requestId,
                  result: result,
                });
              } catch (error: any) {
                currentPanel?.webview.postMessage({
                  command: "findLatestDeployedRunResponse",
                  requestId: message.requestId,
                  error: error.message || "Unknown error",
                });
              }
              return;
            }
            case "fetchLastNBuilds": {
              try {
                const { accessToken, count, config } = message;
                const adoService = new AdoService(
                  config.organizationUrl,
                  accessToken,
                  config
                );
                const result = await adoService.fetchLastNBuilds(count);
                currentPanel?.webview.postMessage({
                  command: "fetchLastNBuildsResponse",
                  requestId: message.requestId,
                  result: result,
                });
              } catch (error: any) {
                currentPanel?.webview.postMessage({
                  command: "fetchLastNBuildsResponse",
                  requestId: message.requestId,
                  error: error.message || "Unknown error",
                });
              }
              return;
            }
            case "fetchCommitRangeData": {
              try {
                const { accessToken, olderRun, selectedBuild, config } =
                  message;
                const adoService = new AdoService(
                  config.organizationUrl,
                  accessToken,
                  config
                );
                const result = await adoService.fetchCommitRangeData(
                  olderRun,
                  selectedBuild
                );
                currentPanel?.webview.postMessage({
                  command: "fetchCommitRangeDataResponse",
                  requestId: message.requestId,
                  result: result,
                });
              } catch (error: any) {
                currentPanel?.webview.postMessage({
                  command: "fetchCommitRangeDataResponse",
                  requestId: message.requestId,
                  error: error.message || "Unknown error",
                });
              }
              return;
            }
            case "getActivePullRequestForBranch": {
              try {
                const { accessToken, branchName, config } = message;
                const adoService = new AdoService(
                  config.organizationUrl,
                  accessToken,
                  config
                );
                const result = await adoService.getActivePullRequestForBranch(
                  branchName
                );
                currentPanel?.webview.postMessage({
                  command: "getActivePullRequestForBranchResponse",
                  requestId: message.requestId,
                  result: result,
                });
              } catch (error: any) {
                currentPanel?.webview.postMessage({
                  command: "getActivePullRequestForBranchResponse",
                  requestId: message.requestId,
                  error: error.message || "Unknown error",
                });
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

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "tools.navigate",
      (route: string = "/compare") => {
        const targetRoute = route || "/compare";

        if (!currentPanel) {
          vscode.commands
            .executeCommand("fe-ninja-tools.showPipelines")
            .then(() => {
              setTimeout(() => {
                if (currentPanel) {
                  currentPanel.webview.postMessage({
                    type: "navigate",
                    payload: targetRoute,
                  });
                }
              }, 500);
            });
        } else {
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
  return;
}
