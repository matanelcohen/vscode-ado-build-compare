#!/bin/bash

# Release script for Build Compare Tools VS Code Extension
# Usage: ./scripts/release.sh <version>
# Example: ./scripts/release.sh 1.2.3

set -e

if [ $# -eq 0 ]; then
    echo "❌ Error: Version number required"
    echo "Usage: $0 <version>"
    echo "Example: $0 1.2.3"
    exit 1
fi

VERSION=$1
TAG="v$VERSION"

echo "🚀 Creating release for Build Compare Tools v$VERSION"

# Validate version format
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "❌ Error: Version must be in format X.Y.Z (e.g., 1.2.3)"
    exit 1
fi

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "⚠️  Warning: You're not on main branch (current: $CURRENT_BRANCH)"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if tag already exists
if git tag -l | grep -q "^$TAG$"; then
    echo "❌ Error: Tag $TAG already exists"
    exit 1
fi

# Update package.json version
echo "📝 Updating package.json version to $VERSION"
npm version $VERSION --no-git-tag-version

# Check if there are uncommitted changes
if ! git diff --quiet; then
    echo "📦 Committing version bump"
    git add package.json package-lock.json
    git commit -m "chore: bump version to $VERSION"
fi

# Create and push tag
echo "🏷️  Creating and pushing tag $TAG"
git tag $TAG
git push origin main
git push origin $TAG

echo "✅ Release process initiated!"
echo "📋 Next steps:"
echo "   1. GitHub Actions will automatically build and create the release"
echo "   2. Check the Actions tab: https://github.com/$(git config remote.origin.url | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/actions"
echo "   3. Once complete, the .vsix file will be available in the release"
echo "   4. Release page: https://github.com/$(git config remote.origin.url | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/releases/tag/$TAG"
