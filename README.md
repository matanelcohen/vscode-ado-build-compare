# Build Compare Tools - VS Code Extension

A VS Code extension for comparing Azure DevOps builds and analyzing changes between pipeline runs.

## Features

🔄 **Build Comparison**: Compare builds between different pipeline runs and analyze changes
🎯 **Activity Bar Integration**: Quick access via activity bar icon
⚡ **Optimized Performance**: Lightweight extension with tree-shaking and minimization

## Installation

### From VS Code Marketplace
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Build Compare Tools"
4. Click Install

### From VSIX File
1. Download the latest `.vsix` file from [Releases](../../releases)
2. Open VS Code
3. Run command: `Extensions: Install from VSIX...`
4. Select the downloaded `.vsix` file

## Configuration

Add these settings to your VS Code settings:

```json
{
  "buildCompareTools.organizationUrl": "https://dev.azure.com/yourorg",
  "buildCompareTools.projectName": "YourProject",
  "buildCompareTools.pipelineDefinitionId": 123,
  "buildCompareTools.targetStageName": "YourStage",
  "buildCompareTools.repositoryId": "your-repo-id",
  "buildCompareTools.relevantPathFilter": "src/"
}
```

## Usage

### Build Comparison
1. Click the 🔄 icon in the activity bar
2. Select builds to compare
3. View detailed comparison results

## Development

### Prerequisites
- Node.js 18+
- npm

### Setup
```bash
git clone <repository>
cd ado-pipeline-viewer
npm install
```

### Build
```bash
# Development build
npm run compile

# Production build
npm run compile-production

# Package extension
npm run package
```

### Scripts
- `npm run compile` - Build extension and webview
- `npm run compile-production` - Optimized production build
- `npm run package` - Create VSIX package
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix linting issues

## Architecture

- **Extension Backend** (`src/extension.ts`) - VS Code API integration
- **React Frontend** (`src/index.tsx`) - Webview UI
- **Webpack Build** - Optimized bundling with tree shaking
- **TypeScript** - Type-safe development

### Running in Development
1. Open the project in VS Code
2. Press `F5` to launch Extension Development Host
3. Test your changes in the new VS Code window

## Releases

### Creating a Release

#### Option 1: Using the Release Script (Recommended)
```bash
./scripts/release.sh 1.2.3
```

#### Option 2: Manual Git Tag
```bash
git tag v1.2.3
git push origin v1.2.3
```

#### Option 3: Manual GitHub Workflow
1. Go to Actions tab in GitHub
2. Select "Release" workflow
3. Click "Run workflow"
4. Enter version number (e.g., v1.2.3)

### Release Process
1. **Automatic Build** - GitHub Actions builds the extension
2. **Create Release** - Automatically creates GitHub release with changelog
3. **Upload VSIX** - Extension package uploaded to release assets
4. **Marketplace Publishing** - Optional publishing to VS Code Marketplace

### Release Assets
Each release includes:
- 📦 **VSIX file** - Ready-to-install extension package
- 📋 **Installation instructions** - How to install the extension
- 🔗 **Configuration guide** - Links to setup documentation

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Update [CHANGELOG.md](./CHANGELOG.md)
5. Run tests and linting (`npm run lint`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Submit a pull request

## CI/CD

GitHub Actions workflows:
- **CI** (`ci.yml`) - Build and test on every push/PR
- **Release** (`release.yml`) - Create releases and publish packages

### Workflow Triggers
- **CI**: Push to `main`/`develop`, Pull Requests
- **Release**: Git tags (`v*`), Manual trigger

## License

[Add your license here]

## Support

For issues and support:
1. Check the [Installation Guide](./INSTALL.md)
2. Review [Troubleshooting](./INSTALL.md#troubleshooting)
3. Search [existing issues](../../issues)
4. Create a [new issue](../../issues/new) if needed
