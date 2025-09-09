# VS Code ADO Build Compare Extension

A Visual Studio Code extension for comparing Azure DevOps builds and analyzing changes between deployments.

## Configuration

Create a `.vscode/settings.json` file in your project with the following configuration:

```json
{
  "buildCompareTools.relevantPathFilter": "example-project",
  "buildCompareTools.organizationUrl": "https://dev.azure.com/your-organization/",
  "buildCompareTools.pipelineDefinitionId": 12345,
  "buildCompareTools.targetStageName": "Deploy to Production",
  "buildCompareTools.projectName": "YourProjectName",
  "buildCompareTools.repositoryId": "YourRepositoryName"
}
```

### Configuration Settings

- **relevantPathFilter**: Filter commits by path to show only relevant changes
- **organizationUrl**: Your Azure DevOps organization URL
- **pipelineDefinitionId**: The ID of the pipeline you want to monitor
- **targetStageName**: The name of the deployment stage to track
- **projectName**: Your Azure DevOps project name
- **repositoryId**: The ID or name of the Git repository

## Usage

1. Configure the settings above in your project's `.vscode/settings.json`
2. Use Command Palette (`Ctrl+Shift+P`) and run "Compare Builds"
3. Select a build to compare against the latest deployment
4. View commits grouped by committer with pull request links

## Features

- 🔄 Build comparison between deployments
- 📊 Commit analysis grouped by committer
- 🚀 Direct Azure DevOps pipeline integration
- 🎨 VS Code theme support
- ⚡ Real-time data from Azure DevOps APIs

## Installation

### From Source

```bash
git clone https://github.com/matanelcohen/vscode-ado-build-compare.git
cd vscode-ado-build-compare
npm install
npm run compile
```

Open in VS Code and press `F5` to run the extension.

### From VSIX

1. Download `.vsix` from [Releases](https://github.com/matanelcohen/vscode-ado-build-compare/releases)
2. In VS Code Extensions view (`Ctrl+Shift+X`), click `...` → "Install from VSIX..."

## Authentication

Uses VS Code's built-in Microsoft authentication. You'll be prompted to sign in when first using the extension.

## License

MIT License - see [LICENSE](LICENSE) file.
