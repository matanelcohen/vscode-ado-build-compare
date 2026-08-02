# Security

## Security model

- Azure DevOps access uses VS Code's Microsoft authentication provider.
- OAuth tokens remain in the extension host and are never exposed to webview
  JavaScript.
- Teams Workflow URLs are stored in VS Code SecretStorage.
- Webviews use a restrictive Content Security Policy and nonce-bound scripts.
- Organization URLs are validated to prevent token forwarding to arbitrary
  hosts.
- Network and analysis failures are surfaced instead of silently producing a
  successful result.

## Reporting a vulnerability

Do not disclose exploitable vulnerabilities in a public issue. Use GitHub's
private vulnerability reporting for this repository:

https://github.com/matanelcohen/vscode-ado-build-compare/security/advisories/new

Include affected versions, reproduction steps, impact, and any suggested
mitigation. Please allow reasonable time for investigation before disclosure.
