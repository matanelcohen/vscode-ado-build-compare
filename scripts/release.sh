#!/usr/bin/env bash

set -euo pipefail

VERSION="${1:-}"
if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Usage: $0 X.Y.Z" >&2
  exit 1
fi

TAG="v$VERSION"
[[ "$(git branch --show-current)" == "main" ]] || {
  echo "Releases must be created from main." >&2
  exit 1
}
[[ -z "$(git status --porcelain)" ]] || {
  echo "Commit or stash all changes before releasing." >&2
  exit 1
}
git fetch origin main --tags
[[ "$(git rev-parse HEAD)" == "$(git rev-parse origin/main)" ]] || {
  echo "Local main must match origin/main." >&2
  exit 1
}
! git rev-parse "$TAG" >/dev/null 2>&1 || {
  echo "Tag $TAG already exists." >&2
  exit 1
}

CURRENT_VERSION="$(node -p "require('./package.json').version")"
if [[ "$CURRENT_VERSION" != "$VERSION" ]]; then
  npm version "$VERSION" --no-git-tag-version
fi
npm run check
npm run package
if [[ "$CURRENT_VERSION" != "$VERSION" ]]; then
  git add package.json package-lock.json
  git commit -m "chore: release $TAG" \
    -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
fi
git tag -a "$TAG" -m "ReleaseLens $VERSION"
git push --atomic origin main "$TAG"

echo "Release workflow started: https://github.com/matanelcohen/vscode-ado-build-compare/actions"
