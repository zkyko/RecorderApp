#!/bin/bash

# Script to package Windows and Mac builds for GitHub releases
# Usage: ./scripts/package-releases.sh

set -e

VERSION="1.5.0"
RELEASE_DIR="release"
OUTPUT_DIR="release-zips"

echo "📦 Packaging releases for GitHub..."

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Package Windows x64
if [ -d "$RELEASE_DIR/win-unpacked" ]; then
    echo "📦 Zipping Windows x64..."
    cd "$RELEASE_DIR"
    zip -r "../$OUTPUT_DIR/QA-Studio-Windows-x64-v${VERSION}.zip" win-unpacked/
    cd ..
    echo "✅ Created: $OUTPUT_DIR/QA-Studio-Windows-x64-v${VERSION}.zip"
else
    echo "⚠️  Windows x64 build not found. Run 'npm run dist:win' first."
fi

# Package Windows ARM64
if [ -d "$RELEASE_DIR/win-arm64-unpacked" ]; then
    echo "📦 Zipping Windows ARM64..."
    cd "$RELEASE_DIR"
    zip -r "../$OUTPUT_DIR/QA-Studio-Windows-ARM64-v${VERSION}.zip" win-arm64-unpacked/
    cd ..
    echo "✅ Created: $OUTPUT_DIR/QA-Studio-Windows-ARM64-v${VERSION}.zip"
else
    echo "⚠️  Windows ARM64 build not found."
fi

# Package Mac
if [ -d "$RELEASE_DIR/mac" ]; then
    echo "📦 Zipping Mac..."
    cd "$RELEASE_DIR"
    zip -r "../$OUTPUT_DIR/QA-Studio-Mac-v${VERSION}.zip" mac/
    cd ..
    echo "✅ Created: $OUTPUT_DIR/QA-Studio-Mac-v${VERSION}.zip"
elif [ -d "$RELEASE_DIR/mac-arm64" ]; then
    echo "📦 Zipping Mac ARM64..."
    cd "$RELEASE_DIR"
    zip -r "../$OUTPUT_DIR/QA-Studio-Mac-ARM64-v${VERSION}.zip" mac-arm64/
    cd ..
    echo "✅ Created: $OUTPUT_DIR/QA-Studio-Mac-ARM64-v${VERSION}.zip"
elif [ -d "$RELEASE_DIR/mac-x64" ]; then
    echo "📦 Zipping Mac x64..."
    cd "$RELEASE_DIR"
    zip -r "../$OUTPUT_DIR/QA-Studio-Mac-x64-v${VERSION}.zip" mac-x64/
    cd ..
    echo "✅ Created: $OUTPUT_DIR/QA-Studio-Mac-x64-v${VERSION}.zip"
else
    echo "⚠️  Mac build not found. Run 'npm run dist:mac' first."
fi

echo ""
echo "✅ Packaging complete! Files ready in $OUTPUT_DIR/"
echo ""
echo "📤 To upload to GitHub:"
echo "   1. Go to: https://github.com/zkyko/RecorderApp/releases/new"
echo "   2. Tag: v${VERSION}"
echo "   3. Title: QA Studio v${VERSION}"
echo "   4. Upload the zip files from $OUTPUT_DIR/"

