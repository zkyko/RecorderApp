#!/bin/bash

# Script to create GitHub release and upload files using GitHub CLI
# Usage: ./scripts/create-github-release.sh [version]
# Example: ./scripts/create-github-release.sh 1.5.0

set -e

VERSION="${1:-1.5.0}"
TAG="v${VERSION}"
RELEASE_DIR="release-zips"
REPO="zkyko/RecorderApp"

echo "🚀 Creating GitHub release ${TAG}..."

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "📦 Install it with: brew install gh"
    echo "🔐 Then authenticate with: gh auth login"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI."
    echo "🔐 Please run: gh auth login"
    exit 1
fi

# Check if release-zips directory exists
if [ ! -d "$RELEASE_DIR" ]; then
    echo "❌ Release directory not found: $RELEASE_DIR"
    echo "📦 Run 'npm run package:releases' first to create zip files"
    exit 1
fi

# Get list of zip files
ZIP_FILES=$(find "$RELEASE_DIR" -name "*.zip" -type f)

if [ -z "$ZIP_FILES" ]; then
    echo "❌ No zip files found in $RELEASE_DIR"
    echo "📦 Run 'npm run package:releases' first to create zip files"
    exit 1
fi

echo "📦 Found zip files:"
echo "$ZIP_FILES" | while read -r file; do
    echo "   - $(basename "$file") ($(du -h "$file" | cut -f1))"
done

# Check if tag already exists
if gh release view "$TAG" &> /dev/null; then
    echo "⚠️  Release $TAG already exists!"
    read -p "Do you want to delete and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  Deleting existing release..."
        gh release delete "$TAG" --yes
    else
        echo "❌ Aborted. Release already exists."
        exit 1
    fi
fi

# Create release
echo "📝 Creating release ${TAG}..."
gh release create "$TAG" \
    --title "QA Studio v${VERSION}" \
    --notes "QA Studio v${VERSION} Release

## Downloads

- Windows x64: QA-Studio-Windows-x64-v${VERSION}.zip
- Windows ARM64: QA-Studio-Windows-ARM64-v${VERSION}.zip
- Mac ARM64: QA-Studio-Mac-ARM64-v${VERSION}.zip

## Installation

1. Download the appropriate zip file for your platform
2. Extract the zip file
3. Run the application from the extracted folder" \
    --repo "$REPO" \
    --draft

# Upload files
echo "📤 Uploading files..."
for file in $ZIP_FILES; do
    echo "   Uploading $(basename "$file")..."
    gh release upload "$TAG" "$file" --repo "$REPO" --clobber
done

# Publish release
echo "🚀 Publishing release..."
gh release edit "$TAG" --repo "$REPO" --draft=false

echo ""
echo "✅ Release created successfully!"
echo "🔗 View release: https://github.com/${REPO}/releases/tag/${TAG}"
echo ""
echo "📥 Download links:"
echo "$ZIP_FILES" | while read -r file; do
    filename=$(basename "$file")
    echo "   https://github.com/${REPO}/releases/latest/download/${filename}"
done

