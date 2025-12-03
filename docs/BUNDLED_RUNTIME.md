# Bundled Playwright Runtime

This document explains how the bundled Playwright and Node.js runtime works in QA Studio.

## Overview

QA Studio includes a **self-contained** Playwright runtime that bundles:
- Node.js executable
- Playwright packages (`@playwright/test` and `playwright`)
- Browser binaries (Chromium, Firefox)

This allows the app to run on machines **without**:
- System Node.js installation
- npm/npx access
- Command-line permissions
- Network access for installing dependencies

## How It Works

### Development Setup

When you run `npm run setup:runtime`, the script:
1. Creates `playwright-runtime/` directory in the project root
2. Copies your current Node.js executable to `playwright-runtime/node.exe` (or `node` on Mac/Linux)
3. Installs Playwright packages in the runtime directory
4. Downloads browser binaries to `playwright-runtime/ms-playwright/`

### Production Build

When you build the app (`npm run build:win`), the build process:
1. Runs `setup:runtime` to create the bundled runtime
2. Electron Builder packages everything into the `.exe`
3. The `playwright-runtime/` folder is included as an `extraResource`
4. In the packaged app, it's located at `resources/playwright-runtime/`

### Runtime Detection

The app automatically detects and uses the bundled runtime:
- **In packaged app**: Looks in `process.resourcesPath + '/playwright-runtime'`
- **In development**: Looks in project root `playwright-runtime/`
- **Fallback**: If bundled runtime not found, falls back to system `npx` (if available)

## File Structure

```
playwright-runtime/
├── node.exe (or node on Mac/Linux)
├── package.json
├── node_modules/
│   ├── @playwright/
│   │   └── test/
│   └── playwright/
└── ms-playwright/
    ├── chromium-*/
    ├── firefox-*/
    └── webkit-*/
```

## Usage

### Setting Up the Runtime

Run once before building:

```bash
npm run setup:runtime
```

This will:
- Copy Node.js
- Install Playwright dependencies
- Download browsers (Chromium and Firefox)

**Note**: This can take 5-10 minutes the first time due to browser downloads.

### Building with Bundled Runtime

All build commands automatically run `setup:runtime`:

```bash
# Windows
npm run build:win

# Mac
npm run build:mac

# Development build
npm run dist:win
```

### Manual Setup

If you need to set up the runtime manually:

```bash
node scripts/setup-bundled-runtime.js
```

## Troubleshooting

### Runtime Not Found

If the app says "Bundled runtime not found":

1. **Check if runtime exists**: Look for `playwright-runtime/` in project root
2. **Re-run setup**: `npm run setup:runtime`
3. **Check build output**: Ensure `playwright-runtime/` is in `extraResources` in `package.json`

### Browser Installation Fails

If browser installation fails during setup:

- The script will continue anyway
- Browsers can be installed later via the app's UI
- Go to Settings → Runtime Health → Install/Update Playwright

### Large File Size

The bundled runtime adds ~500MB-1GB to the app size:
- Node.js: ~50MB
- Playwright packages: ~100MB
- Browser binaries: ~300-800MB (depending on which browsers)

This is expected and necessary for a self-contained app.

## Benefits for Restricted Environments

✅ **No system Node.js required** - Works on machines without Node.js installed  
✅ **No CMD access needed** - Everything runs internally  
✅ **No admin rights** - Runs from app directory  
✅ **No network access** - All dependencies pre-bundled  
✅ **Portable** - Can run from USB drive or restricted folder  

## Limitations

⚠️ **Large file size** - App will be 500MB-1GB larger  
⚠️ **Platform-specific** - Need separate builds for Windows/Mac/Linux  
⚠️ **Browser updates** - Browsers are bundled, updates require app update  

## Technical Details

### Path Resolution

The runtime detection logic is in `src/main/utils/playwrightRuntime.ts`:

```typescript
// Production
process.resourcesPath + '/playwright-runtime'

// Development  
process.cwd() + '/playwright-runtime'
```

### Environment Variables

When using bundled runtime, the app sets:
- `PLAYWRIGHT_BROWSERS_PATH`: Points to `ms-playwright/` directory
- `NODE_PATH`: Points to runtime `node_modules/`

### Process Spawning

The app uses `child_process.spawn()` with:
- **Bundled**: `node.exe cli.js [args]` (no shell)
- **System**: `npx playwright [args]` (with shell)

## Maintenance

### Updating Playwright Version

1. Update version in `scripts/setup-bundled-runtime.js`
2. Update version in root `package.json`
3. Run `npm run setup:runtime` to rebuild
4. Rebuild the app

### Adding More Browsers

Edit `scripts/setup-bundled-runtime.js` and change:

```javascript
execSync(`"${bundledNodePath}" "${playwrightCli}" install chromium firefox webkit`, ...)
```

### Cleaning Runtime

To remove and rebuild:

```bash
# Windows
rmdir /s /q playwright-runtime

# Mac/Linux
rm -rf playwright-runtime

# Then rebuild
npm run setup:runtime
```

