# How to Rebuild UI After Changes

## Quick Rebuild Command

From the **root directory** of the project, run:

```powershell
# Navigate to UI directory
Set-Location .\src\ui

# Build the UI
npm run build

# Return to root
Set-Location ..\..
```

Or use the npm script (if available):
```powershell
npm run build:ui
```

## After Rebuilding

1. **Stop any running Electron processes** (Ctrl+C in terminal)
2. **Restart Electron**:
   ```powershell
   npm run dev:electron
   ```
   or
   ```powershell
   npm start
   ```

## Verify the New UI is Loading

Look for these indicators that the new UI is active:

1. **Dark background** (#111827) instead of white/light
2. **Sidebar on the left** with navigation items
3. **Top toolbar** above the main content
4. **Mantine components** (Cards, Buttons with Mantine styling)

If you still see:
- White/light background
- "QA Studio" header with 3 buttons (Test Library, Record, Report)
- No sidebar

Then the old build is still being used. Delete `dist/ui` and rebuild.

## Force Clean Rebuild

```powershell
# Delete old build
Remove-Item -Recurse -Force .\dist\ui -ErrorAction SilentlyContinue

# Rebuild
Set-Location .\src\ui
npm run build
Set-Location ..\..
```

## Development Mode (Hot Reload)

If you want hot reload during development:

```powershell
# Terminal 1: Start UI dev server
Set-Location .\src\ui
npm run dev

# Terminal 2: Start Electron (it will connect to dev server on port 5173)
npm run dev:electron
```

The Electron main process is configured to load from `http://localhost:5173` in dev mode.

