# ReleaseLens privacy

ReleaseLens is designed to keep organizational data inside the user's trusted
tools.

## Data processed

- Azure DevOps pipeline, Git, pull request, identity, and work-item metadata
  needed for actions the user initiates.
- Comparison profiles and recent comparison history stored by VS Code.
- A Teams Workflow URL stored in VS Code SecretStorage when configured.
- Comparison metadata sent to the selected VS Code language model only after
  the user selects **Generate with Copilot**.

## Data not collected

ReleaseLens does not operate a hosted backend, collect product analytics, sell
data, or send Azure DevOps access tokens to the webview. The publisher cannot
access profile configuration, comparison history, tokens, or webhook URLs.

## External services

- Azure DevOps receives API requests required for comparisons and work items.
- Microsoft Teams receives a release card only when manually sent or when
  profile automation is explicitly enabled.
- The selected VS Code language-model provider processes summary input only
  after explicit user action and under that provider's terms.

## Retention and deletion

Profiles and up to ten recent comparisons per profile are stored in VS Code
global storage. Delete profiles and history from the extension UI. Uninstalling
the extension and clearing its VS Code storage removes local state.

Questions can be filed at
https://github.com/matanelcohen/vscode-ado-build-compare/issues.
