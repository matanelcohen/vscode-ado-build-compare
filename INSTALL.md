# Install ReleaseLens

## VS Code Marketplace

1. Open Extensions in VS Code.
2. Search for `ReleaseLens for Azure DevOps` or
   `matancohenmsft.fe-ninja-tools`.
3. Select **Install**.
4. Open the ReleaseLens icon in the Activity Bar.
5. Choose **Explore sample release** or **Connect Azure DevOps**.

## VSIX

Download the latest `.vsix` from
https://github.com/matanelcohen/vscode-ado-build-compare/releases, then run
**Extensions: Install from VSIX...** from the Command Palette.

## Authentication

ReleaseLens uses VS Code's Microsoft authentication provider. It does not ask
for or store an Azure DevOps Personal Access Token.

During guided setup, select the organization, project, repository, pipeline,
deployment stage, and optional relevant paths. Configuration is stored as a
named profile in VS Code.

## Teams

Create a Teams Workflow with the **When a Teams webhook request is received**
trigger. Run **ReleaseLens: Configure Teams Workflow** and paste the HTTPS
trigger URL. The URL is stored in VS Code SecretStorage.

## Troubleshooting

- **No deployments found:** Confirm the selected stage has a successful,
  completed run.
- **No changes found:** Verify build order and relevant-path filters.
- **Sign-in failed:** Sign out and back in through VS Code's Accounts menu.
- **Teams send failed:** Confirm the Workflow is enabled and still accepts
  webhook requests.

Use **ReleaseLens: Copy Safe Diagnostics** when filing an issue. It excludes
tokens, webhook URLs, repository names, project names, and comparison data.
