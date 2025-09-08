# VS Code ADO Build Compare Extension

A Visual Studio Code extension for comparing Azure DevOps builds and analyzing changes between deployments.

## Features

- 🔄 **Build Comparison**: Compare builds and see what changed between the last successful deployment and a selected build
- 📊 **Commit Analysis**: View commits grouped by committer with pull request links
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

## Configuration

Before using the extension, configure it in VS Code settings:

1. Open VS Code Settings (`Ctrl+,`)
2. Search for "Build Compare Tools"
3. Configure the following settings:

### Required Settings

- **Organization URL**: Your Azure DevOps organization URL (e.g., `https://dev.azure.com/yourorg`)
- **Project Name**: Your Azure DevOps project name
- **Pipeline Definition ID**: The ID of the pipeline you want to monitor
- **Target Stage Name**: The name of the deployment stage to track (e.g., "Deploy to Production")
- **Repository ID**: The ID or name of the Git repository

### Optional Settings

- **Relevant Path Filter**: Filter commits by path (e.g., `/src/frontend`) to show only relevant changes

## Usage

1. **Open the Extension**:
   - Use the Command Palette (`Ctrl+Shift+P`) and run "Compare Builds"
   - Or click the Build Compare Tools icon in the Activity Bar

2. **View Latest Deployment**: The extension automatically shows the latest successful deployment

3. **Compare Builds**:
   - Select a build from the list to compare against the latest deployment
   - Click "Compare" to see the changes

4. **Analyze Results**:
   - View commits grouped by committer
   - Click on pull request links to view details in Azure DevOps
   - Copy results to clipboard for sharing

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
│   ├── interfaces/         # TypeScript interfaces
│   ├── pages/              # Main page components
│   ├── services/           # API services
│   ├── utils/              # Utility functions
│   ├── extension.ts        # VS Code extension entry point
│   ├── index.tsx           # React app entry point
│   └── api.ts              # Azure DevOps API calls
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
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

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

1. **"Configuration missing" error**: Ensure all required settings are configured in VS Code settings
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
