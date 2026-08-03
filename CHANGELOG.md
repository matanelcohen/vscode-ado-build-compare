# Changelog

All notable changes to ReleaseLens for Azure DevOps are documented here.

## [Unreleased]

### Added

- Interactive setup page for first-time onboarding and for editing existing
  pipeline profiles, replacing the chained input boxes and quick picks with a
  single editable form that discovers projects, repositories, pipelines, and
  deployment stages on demand.
- Onboarding screenshots in the README showing the guided setup steps,
  discovery, a completed profile, and the saved profile list.
## [3.2.0] - 2026-08-02

### Added

- Selectable workspace layouts ("skins"): **Classic** (the previous layout),
  **Diff bar**, **Workbench**, and **Report**. Switch layouts from the
  paint-brush menu in the header; the choice is remembered per webview.

## [3.1.1] - 2026-08-02

### Fixed

- Treat hyphenated service folders as members of a configured path family, so
  `/gaia` includes both `/packages/gaia` and `/packages/gaia-chat` while
  keeping them as separate selectable changed areas.

## [3.1.0] - 2026-08-02

### Added

- Selectable changed-area filters for quickly isolating hotspots such as
  `/packages/gaia` and `/packages/gaia-chat` without rerunning a comparison.

### Fixed

- Preserve author names when copying pull requests and direct commits.
- Use a dedicated transparent monochrome Activity Bar icon instead of the
  filled Marketplace artwork.

## [3.0.1] - 2026-08-02

### Fixed

- Removed an unsupported Marketplace category that blocked publication of the
  ReleaseLens 3.0 package.

## [3.0.0] - 2026-08-02

### Added

- Instant sample-release experience with realistic synthetic data and no
  sign-in requirement.
- First-run walkthrough, demo-first dashboard, feedback entry points, and safe
  support diagnostics.
- Validated profile import and export for sharing team setup without tokens,
  webhook URLs, or enabled automation.
- ReleaseLens attribution and installation links in Teams cards and Markdown
  exports.
- Product privacy, security, installation, feedback, and bug-report
  documentation.
- New Marketplace icon, hero artwork, categories, keywords, and listing
  metadata.

### Changed

- Rebranded the product as ReleaseLens while preserving the existing extension
  ID, settings, and stored profile compatibility.
- Avoid authentication prompts until a real Azure DevOps action requires
  access.
- Removed unused Markdown, syntax-highlighting, and routing dependencies from
  the webview.
- Updated production dependencies to resolve all known runtime advisories.

## [2.1.1] - 2026-08-02

### Changed

- Republished the verified 2.1 release through the corrected Marketplace
  identity and authenticated release workflow.

## [2.1.0] - 2026-08-02

### Added

- Comparison diagnostics showing analyzed commits, inspected files, duration,
  filter exclusions, and inspection failures.
- Change-hotspot summaries plus All, Pull requests, and Direct commit filters.
- Incremental rendering for large result sets with a 50-item page size.

### Changed

- Run pull-request and file analysis concurrently.
- Cache up to 500 commit-change responses across overlapping comparisons.
- Constrain the report to a responsive readable width on large displays.

## [2.0.3] - 2026-08-02

### Fixed

- Render configured path filters as native badges instead of literal Markdown
  backticks.
- Correct Azure DevOps commit-range direction so newer builds return their
  introduced commits.
- Match single-folder filters such as `/gaia` at path-segment boundaries,
  including nested workspaces such as `/packages/gaia`.

## [2.0.2] - 2026-08-02

### Fixed

- Restored the Marketplace publisher identity to
  `matancohenmsft.fe-ninja-tools` so releases update the existing extension.

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
