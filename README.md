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
  "feNinjaTools.organizationUrl": "https://dev.azure.com/yourorg",
  "feNinjaTools.projectName": "YourProject",
  "feNinjaTools.pipelineDefinitionId": 123,
  "feNinjaTools.targetStageName": "YourStage",
  "feNinjaTools.repositoryId": "your-repo-id",
  "feNinjaTools.relevantPathFilter": "src/"
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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## CI/CD

GitHub Actions workflows:
- **CI** - Build and test on every push/PR
- **Release** - Publish to marketplace on release creation

## License

[Add your license here]

## Support

[Add support information here]
