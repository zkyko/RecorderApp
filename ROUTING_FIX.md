# Routing Fix for Electron

## Problem
React Router was trying to match file paths like:
```
/C:/Users/nisc-/Downloads/D365-Recorder-main/D365-Recorder-main/dist/ui/index.html
```

This happens because Electron uses the `file://` protocol, and `BrowserRouter` relies on the pathname which includes the full file path.

## Solution
Changed from `BrowserRouter` to `HashRouter` in `src/ui/src/App.tsx`.

### Why HashRouter?
- Works perfectly with `file://` protocol
- Uses hash-based routing (`#/route`) instead of pathname
- No need to configure basename
- Standard approach for Electron apps

### What Changed
```tsx
// Before
<BrowserRouter>
  <AppContent />
</BrowserRouter>

// After
<HashRouter>
  <AppContent />
</HashRouter>
```

## Content Security Policy
Also added a Content Security Policy meta tag to `index.html` to silence the Electron security warning:
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http://localhost:* ws://localhost:* ws://127.0.0.1:*;" />
```

## Next Steps
1. Rebuild the UI: `npm run build:ui`
2. Restart Electron: `npm run dev:electron`

Routes will now work correctly with URLs like:
- `file:///path/to/app/index.html#/` (Dashboard)
- `file:///path/to/app/index.html#/library` (Test Library)
- `file:///path/to/app/index.html#/record` (Record)

