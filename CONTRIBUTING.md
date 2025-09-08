# Contributing to VS Code ADO Build Compare Extension

Thank you for your interest in contributing to this project! We welcome contributions from everyone.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed after following the steps**
- **Explain which behavior you expected to see instead and why**
- **Include screenshots if possible**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Provide specific examples to demonstrate the steps**
- **Describe the current behavior and explain which behavior you expected to see instead**
- **Explain why this enhancement would be useful**

### Pull Requests

1. Fork the repository
2. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Make your changes
4. Add or update tests as appropriate
5. Ensure your code follows the existing style
6. Run the linter and fix any issues:
   ```bash
   npm run lint:fix
   ```
7. Test your changes thoroughly
8. Commit your changes with a clear commit message
9. Push to your fork:
   ```bash
   git push origin feature/amazing-feature
   ```
10. Open a Pull Request

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- VS Code
- Git

### Setup Steps

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/your-username/vscode-ado-build-compare.git
   cd vscode-ado-build-compare
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the project:**
   ```bash
   npm run compile
   ```

4. **Open in VS Code:**
   ```bash
   code .
   ```

5. **Run the extension:**
   - Press `F5` to open a new Extension Development Host window
   - Test your changes in the development window

### Development Workflow

#### Watch Mode
For active development, you can run the extension in watch mode:
```bash
npm run compile-watch
```

#### Linting
Run the linter to check code style:
```bash
npm run lint
```

Fix linting issues automatically:
```bash
npm run lint:fix
```

#### Building for Production
```bash
npm run compile-production
```

#### Packaging
To create a VSIX package:
```bash
npm run package
```

## Project Structure

```
├── src/
│   ├── components/          # React components for the UI
│   │   ├── Comparison/      # Build comparison components
│   │   └── CodeReview/      # Code review components
│   ├── hooks/               # Custom React hooks
│   ├── interfaces/          # TypeScript type definitions
│   ├── pages/               # Main page components
│   ├── services/            # API and external service integrations
│   ├── utils/               # Utility functions
│   ├── extension.ts         # VS Code extension entry point
│   ├── index.tsx            # React app entry point
│   ├── api.ts               # Direct Azure DevOps API calls
│   └── api-sdk.ts           # Webview messaging API
├── media/                   # Icons and static assets
├── docs/                    # Documentation files
├── scripts/                 # Build and utility scripts
└── out/                     # Compiled output (generated)
```

## Coding Guidelines

### TypeScript
- Use TypeScript for all code
- Define interfaces for all data structures
- Use proper typing, avoid `any` when possible
- Follow existing naming conventions

### React Components
- Use functional components with hooks
- Follow the existing component structure
- Use Fluent UI components when possible
- Keep components focused and reusable

### Styling
- Use CSS variables for theming
- Follow VS Code design guidelines
- Ensure compatibility with light/dark/high contrast themes

### API Integration
- Use the existing API structure in `src/api.ts`
- Handle errors gracefully
- Provide meaningful error messages to users
- Follow Azure DevOps API best practices

## Testing

Currently, the project uses manual testing. When contributing:

1. Test your changes in the Extension Development Host
2. Test with different VS Code themes
3. Test error scenarios (network failures, invalid config, etc.)
4. Test with various Azure DevOps configurations

Future contributions for automated testing are welcome!

## Documentation

- Update README.md if you add new features
- Add JSDoc comments for new functions and classes
- Update configuration documentation for new settings

## Release Process

Releases are managed by maintainers:

1. Version bump in `package.json`
2. Update CHANGELOG.md
3. Create GitHub release
4. Publish to VS Code Marketplace (if applicable)

## Questions?

If you have questions about contributing, please:

1. Check existing issues and discussions
2. Create a new issue with the "question" label
3. Reach out to maintainers

Thank you for contributing! 🎉
