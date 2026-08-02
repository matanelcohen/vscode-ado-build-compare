# Build Compare Tools - Complete Installation Guide

This guide provides step-by-step instructions for installing and configuring the Build Compare Tools VS Code extension for Azure DevOps pipeline analysis.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation Methods](#installation-methods)
- [Configuration Setup](#configuration-setup)
- [Azure DevOps Authentication](#azure-devops-authentication)
- [Finding Required Configuration Values](#finding-required-configuration-values)
- [Example Configurations](#example-configurations)
- [Troubleshooting](#troubleshooting)
- [Usage Guide](#usage-guide)

## Prerequisites

Before installing the extension, ensure you have:

- **VS Code 1.80.0 or higher**
- **Access to Azure DevOps** with appropriate permissions
- **Personal Access Token (PAT)** for Azure DevOps authentication

## Installation Methods

### Method 1: From VS Code Marketplace (Recommended)

1. **Open VS Code**
2. **Access Extensions View**
   - Press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (Mac)
   - Or click the Extensions icon in the Activity Bar

   ![Extensions View](./docs/images/extensions-view.png)

3. **Search for Extension**
   - Type "Build Compare Tools" in the search box
   - Look for the extension by "matanelcohen"

   ![Search Extension](./docs/images/search-extension.png)

4. **Install Extension**
   - Click the "Install" button
   - Wait for installation to complete

### Method 2: From VSIX File

1. **Download VSIX File**
   - Go to the [Releases page](../../releases)
   - Download the latest `.vsix` file

2. **Install from VSIX**
   - Open VS Code
   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
   - Type "Extensions: Install from VSIX..."
   - Select the downloaded `.vsix` file

   ![Install from VSIX](./docs/images/install-vsix.png)

### Method 3: Development Installation

For contributors or advanced users:

```bash
# Clone the repository
git clone https://github.com/matanelcohen/vscode-ado-build-compare.git
cd vscode-ado-build-compare

# Install dependencies
npm install

# Build the extension
npm run compile-production

# Package the extension
npm run package

# Install the generated .vsix file in VS Code
```

## Guided setup

1. Click the **Build Compare Tools** icon in the Activity Bar.
2. Select **Start guided setup** in the Release Dashboard.
3. Sign in through VS Code's Microsoft authentication prompt.
4. Choose the Azure DevOps organization, project, repository, pipeline, and
   deployment stage.
5. Name the profile and optionally configure path filters.

The extension stores profile configuration in VS Code global storage. Microsoft
access tokens stay in the extension host, and Teams Workflow URLs are stored in
SecretStorage. Existing `buildCompareTools.*` settings are imported once as a
legacy profile.

## Azure DevOps authentication

Build Compare Tools uses VS Code's Microsoft authentication provider. A
Personal Access Token is not required and must not be added to extension
settings.

## Finding Required Configuration Values

### Organization URL
Your Azure DevOps organization URL format:
- **Azure DevOps Services**: `https://dev.azure.com/yourorganization`
- **Azure DevOps Server**: `https://yourdomain.com/tfs/DefaultCollection`

### Project Name
1. Navigate to your Azure DevOps organization
2. The project name is visible in the URL and navigation:
   - URL: `https://dev.azure.com/yourorg/YourProject`
   - Project name: `YourProject`

### Pipeline Definition ID
1. **Go to Pipelines**
   - Navigate to Pipelines in your Azure DevOps project

2. **Select Your Pipeline**
   - Click on the pipeline you want to monitor

3. **Get Pipeline ID**
   - Look at the URL: `https://dev.azure.com/yourorg/yourproject/_build?definitionId=123`
   - The number after `definitionId=` is your pipeline definition ID

   ![Pipeline ID](./docs/images/pipeline-id.png)

### Target Stage Name
1. **Open Pipeline Definition**
   - Go to your pipeline in Azure DevOps

2. **Check Stages**
   - Look at the pipeline YAML or visual designer
   - Find the exact stage name you want to monitor
   - Common examples: "Deploy", "Production", "Release"

   ![Stage Name](./docs/images/stage-name.png)

### Repository ID
1. **Go to Repositories**
   - Navigate to Repos in your Azure DevOps project

2. **Get Repository ID**
   - Method 1: Look at the URL when viewing the repository
   - Method 2: Use the repository name (often works as ID)
   - Method 3: Check repository settings

   ![Repository ID](./docs/images/repository-id.png)

## Example Configurations

### Example 1: Standard Azure DevOps Services Setup
```json
{
  "buildCompareTools.organizationUrl": "https://dev.azure.com/contoso",
  "buildCompareTools.projectName": "WebApplication",
  "buildCompareTools.pipelineDefinitionId": 42,
  "buildCompareTools.targetStageName": "Deploy to Production",
  "buildCompareTools.repositoryId": "WebApp-Frontend",
  "buildCompareTools.relevantPathFilter": "src/frontend/,src/shared/"
}
```

### Example 2: Azure DevOps Server (On-Premises)
```json
{
  "buildCompareTools.organizationUrl": "https://tfs.company.com/tfs/DefaultCollection",
  "buildCompareTools.projectName": "Enterprise Project",
  "buildCompareTools.pipelineDefinitionId": 156,
  "buildCompareTools.targetStageName": "Production Deployment",
  "buildCompareTools.repositoryId": "enterprise-app",
  "buildCompareTools.relevantPathFilter": ""
}
```

### Example 3: Multiple Environment Setup
```json
{
  "buildCompareTools.organizationUrl": "https://dev.azure.com/mycompany",
  "buildCompareTools.projectName": "MobileApp",
  "buildCompareTools.pipelineDefinitionId": 89,
  "buildCompareTools.targetStageName": "Deploy to Staging",
  "buildCompareTools.repositoryId": "mobile-app-repo",
  "buildCompareTools.relevantPathFilter": "mobile/src/,shared/"
}
```

## Configuration Properties Explained

| Property | Description | Example | Required |
|----------|-------------|---------|----------|
| `organizationUrl` | Your Azure DevOps organization URL | `https://dev.azure.com/myorg` | ✅ |
| `projectName` | Name of your Azure DevOps project | `MyProject` | ✅ |
| `pipelineDefinitionId` | Numeric ID of the pipeline to monitor | `123` | ✅ |
| `targetStageName` | Exact name of the deployment stage | `Deploy to Production` | ✅ |
| `repositoryId` | Repository ID or name | `my-repo` | ✅ |
| `relevantPathFilter` | Comma-separated paths to filter commits | `src/,tests/` | ❌ |

## Troubleshooting

### Common Issues

#### 1. "Authentication Failed" Error
**Solution:**
- Verify your Personal Access Token has correct permissions
- Ensure the token hasn't expired
- Check organization URL is correct

#### 2. "Pipeline Not Found" Error
**Solution:**
- Verify `pipelineDefinitionId` is correct
- Ensure you have access to the pipeline
- Check `projectName` matches exactly

#### 3. "Stage Not Found" Error
**Solution:**
- Verify `targetStageName` matches exactly (case-sensitive)
- Check the stage exists in recent pipeline runs
- Ensure the stage is spelled correctly

#### 4. Extension Not Loading
**Solution:**
- Restart VS Code
- Check VS Code version (requires 1.80.0+)
- Reinstall the extension

### Debug Mode

Enable debug logging by adding:
```json
{
  "buildCompareTools.debug": true
}
```

Check the VS Code Output panel → "Build Compare Tools" for detailed logs.

## Usage Guide

### Opening the Extension

1. **Via Activity Bar**
   - Click the 🔄 icon in the Activity Bar (left side)

2. **Via Command Palette**
   - Press `Ctrl+Shift+P` / `Cmd+Shift+P`
   - Type "Compare Builds"
   - Select the command

### Comparing Builds

1. **Select Source Build**
   - Choose the older build from the dropdown

2. **Select Target Build**
   - Choose the newer build to compare against

3. **View Results**
   - See commit differences
   - Review changed files
   - Analyze deployment changes

   ![Build Comparison](./docs/images/build-comparison.png)

### Filtering Results

Use the `relevantPathFilter` setting to focus on specific directories:
- `"src/"` - Only commits affecting the src directory
- `"src/,tests/"` - Commits affecting src or tests directories
- `""` - All commits (no filtering)

## Advanced Configuration

### Workspace-Specific Settings

Create `.vscode/settings.json` in your project root:

```json
{
  "buildCompareTools.organizationUrl": "https://dev.azure.com/myorg",
  "buildCompareTools.projectName": "CurrentProject",
  "buildCompareTools.pipelineDefinitionId": 456,
  "buildCompareTools.targetStageName": "Deploy",
  "buildCompareTools.repositoryId": "current-repo",
  "buildCompareTools.relevantPathFilter": "."
}
```

### Multi-Root Workspaces

For multi-root workspaces, configure settings per folder:

```json
{
  "folders": [
    {
      "name": "Frontend",
      "path": "./frontend"
    },
    {
      "name": "Backend",
      "path": "./backend"
    }
  ],
  "settings": {
    "buildCompareTools.organizationUrl": "https://dev.azure.com/myorg",
    "buildCompareTools.projectName": "FullStackApp"
  }
}
```

## Support

If you encounter issues not covered in this guide:

1. **Check the [Issues page](../../issues)** for known problems
2. **Create a new issue** with:
   - VS Code version
   - Extension version
   - Configuration (without sensitive data)
   - Error messages or screenshots
3. **Enable debug mode** and include log output

## Next Steps

After successful installation and configuration:

1. **Test the setup** by comparing two recent builds
2. **Customize path filters** for your project structure
3. **Set up keyboard shortcuts** for quick access
4. **Explore advanced features** like pull request integration

---

**Need help?** Check our [FAQ](./FAQ.md) or [create an issue](../../issues/new).
