# VS Code ADO Build Compare Extension

A Visual Studio Code extension for comparing Azure DevOps builds and analyzing changes between deployments.

## Features

- 🔄 **Build Comparison**: Compare builds and see what changed between the last successful deployment and a selected build
- 📊 **Release Summary**: Review pull requests, direct commits, contributors, and changed files
- 🔎 **Accurate Git Ranges**: Compare build commit ancestry instead of approximating by date
- 🧭 **Result Filtering**: Search by PR, contributor, commit message, or file
- 💬 **Microsoft Teams Sharing**: Send Adaptive Cards through Teams Workflows and optionally mention contributors
- 🧭 **Guided Setup**: Discover projects, repositories, pipelines, and deployment stages without copying IDs
- 🗂️ **Pipeline Profiles**: Save and switch between multiple pipelines and environments
- 🧠 **Release Intelligence**: Risk scoring plus optional Copilot-generated summaries
- 🌿 **Flexible Comparison**: Compare builds, branches, tags, or compatible environment profiles
- 🕘 **History and Export**: Reopen recent comparisons and export Markdown or JSON
- 📣 **Automation**: Post new-build comparisons to Teams while VS Code is running
- 🚀 **Pipeline Integration**: Direct integration with Azure DevOps pipelines
- 🎨 **VS Code Theme Support**: Matches your VS Code theme (light/dark/high contrast)
- ⚡ **Real-time Data**: Fetches live data from Azure DevOps APIs

## Installation

### From Source

1. Clone this repository:
   ```bash
   git clone https://github.com/matanelcohen/vscode-ado-build-compare.git
   cd vscode-ado-build-compare
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Compile the extension:
   ```bash
   npm run compile
   ```

4. Open in VS Code and press `F5` to run the extension in a new Extension Development Host window.

### From VSIX Package

1. Download the latest `.vsix` file from the [Releases](https://github.com/matanelcohen/vscode-ado-build-compare/releases) page
2. In VS Code, go to Extensions view (`Ctrl+Shift+X`)
3. Click the `...` menu and select "Install from VSIX..."
4. Select the downloaded `.vsix` file

## Guided setup

On first use, select **Start guided setup**. The extension:

1. Signs in with VS Code's Microsoft authentication provider.
2. Discovers projects in the Azure DevOps organization.
3. Lists repositories and matching build pipelines.
4. Inspects recent runs to discover deployment stage names.
5. Saves the selection as a named pipeline profile.

Use **Add profile**, **Switch**, and **Delete** in the comparison header to
manage multiple pipelines or environments. Use **Edit** to change the profile
name, deployment stage, path filters, and automatic Teams behavior. Profiles
contain non-secret configuration only; access tokens remain in the extension
host.

The command palette also provides:

- **Build Compare Tools: Add Pipeline Profile**
- **Build Compare Tools: Switch Pipeline Profile**
- **Build Compare Tools: Edit Pipeline Profile**
- **Build Compare Tools: Delete Pipeline Profile**

Existing `buildCompareTools.*` VS Code settings are migrated once into a
**Workspace settings** profile for backward compatibility.

## Usage

1. **Open the Extension**:
   - Use the Command Palette (`Ctrl+Shift+P`) and run "Compare Builds"
   - Or click the Build Compare Tools icon in the Activity Bar

2. **View Latest Deployment**: The extension automatically shows the latest successful deployment

3. **Compare Builds**:
   - Select a build from the list to compare against the latest deployment
   - Click "Compare" to see the changes

4. **Analyze Results**:
   - Review summary metrics, pull requests, direct commits, and changed files
   - Filter results by PR, contributor, message, or file path
   - Click on pull request links to view details in Azure DevOps
   - Copy results to clipboard for sharing

5. **Share to Teams**:
   - Create a Teams Workflow using the **When a Teams webhook request is received** trigger
   - Run **Build Compare Tools: Configure Teams Workflow**
   - Paste the HTTPS trigger URL; it is stored securely in VS Code SecretStorage
   - After comparing builds, choose contributors to notify and send the Adaptive Card

### Teams mention requirements

Teams mentions require the contributor identity from Azure DevOps to match a
Microsoft Entra object ID or user principal name (UPN) in the destination
tenant. If an identity cannot be resolved by Teams, the comparison still sends
but that person may appear as text rather than receive a notification.

Workflow URLs are secrets. Do not commit them to source control or place them in
VS Code settings. Assign workflow co-owners so release notifications do not
depend on one person's account.

Automatic notifications are explicitly opt-in per profile and run only while
VS Code and the extension are active. They use the configured Teams Workflow
destination. Mentions can be selected from ADO identities or entered manually
as Microsoft Entra UPNs.

Direct Graph channel selection is intentionally not used: VS Code's stable
Microsoft authentication provider cannot identify this extension with its own
Entra client registration. Teams Workflow setup provides tenant-governed
channel selection without requesting broad Graph permissions.

## Release intelligence

Every comparison receives a deterministic risk score based on database,
security, infrastructure, dependency, configuration, direct-commit, change
volume, and incomplete-analysis signals. **Generate with Copilot** is an
explicit action; comparison metadata is sent to the selected VS Code language
model only after the user clicks it.

Comparisons can be exported as Markdown or JSON or used to create an Azure
DevOps Task, Issue, or Bug. The ten most recent comparisons per profile are
stored in VS Code global state.

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- VS Code

### Setup

```bash
# Clone the repository
git clone https://github.com/matanelcohen/vscode-ado-build-compare.git
cd vscode-ado-build-compare

# Install dependencies
npm install

# Compile the extension
npm run compile

# Watch for changes (optional)
npm run compile-watch
```

### Project Structure

```
├── src/
│   ├── components/          # React components
│   ├── hooks/              # React hooks
│   ├── models/             # Typed comparison and sharing models
│   ├── teams/              # Teams Adaptive Card generation
│   ├── pages/              # Main page components
│   ├── services/           # API services
│   ├── utils/              # Utility functions
│   ├── extension.ts        # VS Code extension entry point
│   ├── index.tsx           # React app entry point
│   └── api-sdk.ts          # Typed extension-host messaging
├── media/                  # Icons and images
├── docs/                   # Documentation
└── out/                    # Compiled output
```

### Building

```bash
# Development build
npm run compile

# Production build
npm run compile-production

# Package as VSIX
npm run package
```

### Testing

```bash
# Unit tests
npm test

# Full local quality gate
npm run check

# Lint only
npm run lint

# Fix linting issues
npm run lint:fix
```

### Optional live integration smoke test

The normal test suite is deterministic and does not contact external services.
To explicitly test a real ADO organization and optionally a Teams Workflow:

```bash
RUN_LIVE_INTEGRATION=1 \
ADO_ORGANIZATION_URL=https://dev.azure.com/yourorg \
ADO_PROJECT=YourProject \
ADO_ACCESS_TOKEN=... \
TEAMS_WORKFLOW_WEBHOOK=... \
npm run test:live
```

`TEAMS_WORKFLOW_WEBHOOK` is optional. Never commit these values.

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Authentication

The extension uses VS Code's built-in Microsoft authentication to access Azure DevOps APIs. You'll be prompted to sign in with your Microsoft account when first using the extension.

## Troubleshooting

### Common Issues

1. **No profile configured**: Run **Build Compare Tools: Add Pipeline Profile**
2. **Authentication failed**: Try signing out and back in through VS Code's account menu
3. **No builds found**: Check that the pipeline definition ID is correct and the pipeline has completed runs
4. **Empty results**: Verify that the target stage name matches exactly with your pipeline stage

### Getting Help

- 📝 [Create an issue](https://github.com/matanelcohen/vscode-ado-build-compare/issues) for bug reports
- 💡 [Request a feature](https://github.com/matanelcohen/vscode-ado-build-compare/issues) for new functionality
- 📚 Check the [documentation](https://github.com/matanelcohen/vscode-ado-build-compare/wiki) for detailed guides

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with ❤️ using [VS Code Extension API](https://code.visualstudio.com/api)
- UI components from [Fluent UI React](https://react.fluentui.dev/)
- Azure DevOps integration via [REST APIs](https://docs.microsoft.com/en-us/rest/api/azure/devops/)

---

**Happy building! 🚀**
