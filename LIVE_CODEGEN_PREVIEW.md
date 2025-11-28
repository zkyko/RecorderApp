# Live Codegen Preview Implementation

## Summary

Implemented a live code preview feature that shows Playwright Codegen output in real-time as you record your D365 flow.

## Files Changed

### 1. **Type Definitions** (`src/types/v1.5.ts`)
- Added `CodegenCodeUpdate` interface:
  ```typescript
  interface CodegenCodeUpdate {
    workspacePath: string;
    content: string;      // full TypeScript codegen output
    timestamp: string;    // ISO timestamp
  }
  ```

### 2. **Main Process - Codegen Service** (`src/main/services/codegen-service.ts`)
- Added file watcher using `fs.watch()` to monitor `codegen-output.ts`
- Watches the directory (not the file) to handle cases where file doesn't exist initially
- Sends IPC events `codegen:code-update` to renderer on every file change
- Added `setMainWindow()` method to receive BrowserWindow reference for IPC
- Sends final code update before stopping watcher on `stop()`

**Key Methods:**
- `startFileWatcher()` - Sets up file watching
- `readAndSendCode()` - Reads file and sends update via IPC
- `stopFileWatcher()` - Cleans up watcher

### 3. **IPC Bridge** (`src/main/bridge.ts`)
- Updated constructor to call `codegenService.setMainWindow(mainWindow)`
- Updated `setMainWindow()` to also set window on codegen service

### 4. **Preload Script** (`src/main/preload.ts`)
- Added `onCodegenCodeUpdate(callback)` - Listens to `codegen:code-update` events
- Added `removeCodegenCodeUpdateListener()` - Cleans up listener

### 5. **Type Definitions** (`src/ui/src/types/electron.d.ts`)
- Added type definitions for new IPC methods:
  ```typescript
  onCodegenCodeUpdate: (callback: (update: CodegenCodeUpdate) => void) => void;
  removeCodegenCodeUpdateListener: () => void;
  ```

### 6. **IPC Wrapper** (`src/ui/src/ipc.ts`)
- Added `codegen.onCodeUpdate()` - Wrapper for listening to code updates
- Added `codegen.removeCodeUpdateListener()` - Cleanup method
- Imported `CodegenCodeUpdate` type

### 7. **RecordScreen Component** (`src/ui/src/components/RecordScreen.tsx`)
- **Complete UI redesign** with two-panel layout:
  - **Left Panel**: Status, controls, instructions
  - **Right Panel**: Live code preview
- Added state management:
  - `liveCodeContent` - Current codegen output
  - `lastCodeUpdateAt` - Timestamp of last update
  - `envUrl` - Environment URL being recorded
- Added `useEffect` hook to listen for code updates when recording
- Real-time code display using Mantine `Code` component
- Empty state when no recording
- Status indicators with timestamps

### 8. **RecordScreen Styles** (`src/ui/src/components/RecordScreen.css`)
- Updated styles for new two-panel layout
- Recording dot animation

## How It Works

### Flow:
1. User clicks "Start Recording" in RecordScreen
2. `codegen:start` IPC call launches Playwright Codegen
3. CodegenService starts watching `<workspace>/tmp/codegen-output.ts`
4. As Playwright writes to the file, file watcher detects changes
5. CodegenService reads file and sends `codegen:code-update` IPC event
6. RecordScreen receives update and displays code in real-time
7. When user clicks "Stop Recording", final code is sent and watcher stops

### IPC Event Flow:
```
Main Process (CodegenService)
  ↓ fs.watch() detects file change
  ↓ readAndSendCode()
  ↓ mainWindow.webContents.send('codegen:code-update', update)
  ↓
Renderer Process (RecordScreen)
  ↓ ipc.codegen.onCodeUpdate(callback)
  ↓ setLiveCodeContent(update.content)
  ↓ UI updates automatically
```

## Usage from Renderer

To listen for live code updates in any component:

```typescript
import { ipc } from '../ipc';
import { CodegenCodeUpdate } from '../../../types/v1.5';

useEffect(() => {
  // Start listening
  ipc.codegen.onCodeUpdate((update: CodegenCodeUpdate) => {
    console.log('Code updated:', update.content);
    console.log('Timestamp:', update.timestamp);
    // Update your state here
  });

  // Cleanup on unmount
  return () => {
    ipc.codegen.removeCodeUpdateListener();
  };
}, []);
```

## Features

✅ **Real-time Updates**: Code preview updates as Playwright Codegen writes to file
✅ **Status Indicators**: Shows recording status, environment URL, last update time
✅ **Two-Panel Layout**: Status/controls on left, code preview on right
✅ **Empty States**: Helpful messages when no recording
✅ **Dark Theme**: Matches Studio UI design
✅ **Auto-scroll**: Code preview scrolls to show latest content
✅ **Final Code**: Final code remains visible after stopping

## Testing

1. Start the app: `npm run dev:electron`
2. Navigate to Record screen
3. Click "Start Recording"
4. Perform actions in Playwright Codegen browser
5. Watch code appear in real-time in the preview panel
6. Click "Stop Recording"
7. Verify final code is displayed and passed to locator cleanup

## Notes

- File watcher watches the directory, not the file (handles file creation)
- 200ms delay after file change to ensure write is complete
- Watcher automatically stops when recording stops
- Code preview is read-only (editing happens in Locator Cleanup screen)

