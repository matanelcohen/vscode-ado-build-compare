import * as vscode from "vscode";

export type WebviewView = "comparison" | "setup";

export function getWebviewContent(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  view: WebviewView = "comparison"
): string {
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "out", "webview.js")
  );
  const nonce = getNonce();
  const title = view === "setup" ? "ReleaseLens Setup" : "ReleaseLens";
  return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} data:; script-src 'nonce-${nonce}'; font-src ${webview.cspSource} data:;">
              <title>${title}</title>
        </head>
        <body>
            <div id="root"></div>
            <script nonce="${nonce}">window.__releaseLensView = ${JSON.stringify(
              view
            )};</script>
            <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>`;
}

export function getNonce(): string {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
