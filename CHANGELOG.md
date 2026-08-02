# Changelog

All notable changes to Build Compare Tools are documented here.

## [2.0.1] - 2026-08-02

### Fixed

- Restored spacing between the Changes tab empty-state heading and description.

## [2.0.0] - 2026-08-02

### Added

- Native VS Code release dashboard, status bar integration, and contextual actions.
- Guided Azure DevOps onboarding with named pipeline and environment profiles.
- Accurate build, branch, tag, and environment drift comparisons.
- Pull request, direct commit, contributor, and changed-file analysis.
- Deployment risk scoring and optional Copilot-generated release summaries.
- Teams Workflow Adaptive Cards with optional user mentions.
- Recent comparison history, Markdown and JSON exports, and Azure DevOps work-item creation.
- Opt-in scheduled Teams notifications while VS Code is running.
- Tabbed comparison workspace with persisted navigation state.
- Deterministic tests and opt-in live Azure DevOps and Teams smoke tests.

### Changed

- Replaced date-based commit lookup with build-to-build Git ancestry comparison.
- Moved Microsoft access tokens and Teams webhook URLs out of the webview; webhook URLs now use VS Code SecretStorage.
- Added bounded Azure DevOps API concurrency, strict CI validation, and race-safe profile requests.
- Modernized GitHub releases to validate version tags and publish a tested VSIX asset.

## [0.1.0] - 2024

### Added

- Initial Azure DevOps pipeline build comparison and path filtering.
