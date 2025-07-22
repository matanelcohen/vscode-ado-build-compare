# Changelog

All notable changes to the "Build Compare Tools" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive installation guide (INSTALL.md)
- Automated GitHub release workflow
- Release script for version management
- Extension icon configuration (media/logo.png)

### Changed
- Improved PR link generation to use configuration instead of hardcoded values
- Updated CI workflow to use Node.js 20
- Enhanced error handling and debugging capabilities
- Made `relevantPathFilter` configuration optional
- Simplified user experience: clicking extension now directly opens React app

### Removed
- Code Review functionality (focusing on Build Comparison only)
- Unused dependencies and imports
- WebView provider for activity bar (simplified to direct command execution)

### Fixed
- Lint errors and TypeScript warnings
- VSCE packaging issues in CI
- Program crash when `relevantPathFilter` is not configured

## [0.1.0] - 2024-XX-XX

### Added
- Initial release of Build Compare Tools
- Azure DevOps pipeline build comparison
- Activity bar integration
- Build analysis and commit tracking
- Configurable path filtering
- VS Code webview interface

### Features
- Compare builds between different pipeline runs
- Analyze commit changes and author contributions
- Filter relevant file changes by path patterns
- Integration with Azure DevOps APIs
- Personal Access Token authentication
- Optimized performance with webpack and tree-shaking

---

## How to Contribute to Changelog

When making changes, please update this file following these guidelines:

### Categories
- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** in case of vulnerabilities

### Format
```markdown
## [Version] - YYYY-MM-DD

### Added
- New feature description

### Changed
- Changed feature description

### Fixed
- Bug fix description
```

### Version Numbers
- **Major** (X.0.0): Breaking changes
- **Minor** (0.X.0): New features, backwards compatible
- **Patch** (0.0.X): Bug fixes, backwards compatible
