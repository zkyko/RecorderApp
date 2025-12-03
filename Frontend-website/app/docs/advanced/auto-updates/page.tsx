import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft, Download, Settings, Code2, Bell, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AutoUpdatesPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <Link
          href="/docs/advanced"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-blue-400 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Advanced Docs
        </Link>
        
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Auto-Updates Architecture
            </h1>
            <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30">
              v2.0
            </Badge>
          </div>
          <p className="text-xl text-zinc-400">
            Automatic updates via GitHub Releases using electron-updater
          </p>
        </div>

        <div className="space-y-8">
          {/* Overview */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300">
                QA Studio v2.0 includes automatic update functionality that checks for new releases on GitHub 
                and provides seamless update installation. Users no longer need to manually download and install 
                new versions.
              </p>
              <ul className="space-y-2 text-zinc-300 list-disc list-inside">
                <li><strong className="text-white">Automatic update detection</strong> - Checks GitHub Releases for new versions</li>
                <li><strong className="text-white">Download progress tracking</strong> - Real-time progress updates via IPC</li>
                <li><strong className="text-white">One-click installation</strong> - Restart to install with a single click</li>
                <li><strong className="text-white">Background updates</strong> - Downloads happen in the background without interrupting workflow</li>
              </ul>
            </CardContent>
          </Card>

          {/* Architecture */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">System Architecture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <h4 className="font-semibold text-white mb-3">Components</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-zinc-700/50 rounded border border-zinc-600">
                    <div className="flex items-center gap-2 mb-1">
                      <Code2 className="w-4 h-4 text-teal-400" />
                      <code className="text-teal-400 text-sm">updaterService.ts</code>
                    </div>
                    <p className="text-xs text-zinc-400 ml-6">
                      Main service in main process handling electron-updater lifecycle
                    </p>
                  </div>
                  <div className="p-3 bg-zinc-700/50 rounded border border-zinc-600">
                    <div className="flex items-center gap-2 mb-1">
                      <Settings className="w-4 h-4 text-cyan-400" />
                      <span className="text-cyan-400 text-sm">electron-builder.yml</span>
                    </div>
                    <p className="text-xs text-zinc-400 ml-6">
                      Build configuration with GitHub Releases publish provider
                    </p>
                  </div>
                  <div className="p-3 bg-zinc-700/50 rounded border border-zinc-600">
                    <div className="flex items-center gap-2 mb-1">
                      <Bell className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-400 text-sm">UI Components</span>
                    </div>
                    <p className="text-xs text-zinc-400 ml-6">
                      React components in renderer process showing update notifications
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Build Configuration */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Build Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300">
                The electron-builder configuration includes GitHub Releases as the publish provider:
              </p>
              
              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700 font-mono text-sm">
                <pre className="text-zinc-300">{`// electron-builder.yml or package.json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "zkyko",
      "repo": "RecorderApp"
    },
    "win": {
      "target": ["nsis"],
      "publisherName": "QA Studio"
    }
  }
}`}</pre>
              </div>

              <div className="p-4 bg-teal-500/10 border border-teal-500/30 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Release Artifacts</h4>
                <p className="text-sm text-zinc-400 mb-2">
                  When building for release, electron-builder automatically uploads:
                </p>
                <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
                  <li>Windows installer (.exe)</li>
                  <li>latest.yml - Update metadata file</li>
                  <li>Blockmap files - For efficient delta updates</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Update Service */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Update Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300">
                The updater service in the main process manages the update lifecycle:
              </p>

              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700 font-mono text-sm">
                <pre className="text-zinc-300">{`// src/main/services/updaterService.ts
import { autoUpdater } from 'electron-updater';

// Check for updates on app start
autoUpdater.checkForUpdatesAndNotify();

// Event handlers
autoUpdater.on('update-available', (info) => {
  // Send IPC to renderer: 'update-available'
});

autoUpdater.on('download-progress', (progress) => {
  // Send IPC: 'download-progress' with percentage
});

autoUpdater.on('update-downloaded', (info) => {
  // Send IPC: 'update-downloaded'
});

autoUpdater.on('error', (error) => {
  // Send IPC: 'update-error'
});`}</pre>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-teal-500/30">
                  <h4 className="font-semibold text-white mb-2">checkForUpdatesAndNotify()</h4>
                  <p className="text-sm text-zinc-400">
                    Checks GitHub Releases for new versions. Called on app startup and can be triggered manually.
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-teal-500/30">
                  <h4 className="font-semibold text-white mb-2">quitAndInstall()</h4>
                  <p className="text-sm text-zinc-400">
                    Quits the application and installs the downloaded update. Called when user clicks "Restart to Install".
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* IPC Events */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">IPC Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300">
                The main process sends IPC events to the renderer process for UI updates:
              </p>

              <div className="space-y-3">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Bell className="w-5 h-5 text-teal-400" />
                    <code className="text-teal-400">update-available</code>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Emitted when a new update is available. UI shows notification that update is downloading.
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="w-5 h-5 text-cyan-400" />
                    <code className="text-cyan-400">download-progress</code>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Emitted during download with progress percentage. UI updates progress bar.
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className="w-5 h-5 text-green-400" />
                    <code className="text-green-400">update-downloaded</code>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Emitted when download completes. UI shows "Update downloaded - Restart to install?" dialog.
                  </p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="w-5 h-5 text-red-400" />
                    <code className="text-red-400">update-error</code>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Emitted if update check or download fails. UI shows error message.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* UI Integration */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">UI Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300">
                The renderer process listens for IPC events and displays update notifications:
              </p>

              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700 font-mono text-sm">
                <pre className="text-zinc-300">{`// Renderer process
ipcRenderer.on('update-available', () => {
  // Show toast: "Downloading update..."
});

ipcRenderer.on('download-progress', (event, progress) => {
  // Update progress bar: "Downloading update... XX%"
});

ipcRenderer.on('update-downloaded', () => {
  // Show dialog: "Update downloaded - Restart to install?"
  // User clicks "Restart" → send IPC: 'quit-and-install'
});

ipcRenderer.send('quit-and-install');`}</pre>
              </div>

              <div className="p-4 bg-teal-500/10 border border-teal-500/30 rounded-lg">
                <h4 className="font-semibold text-white mb-2">User Experience</h4>
                <ol className="text-sm text-zinc-400 space-y-1 list-decimal list-inside">
                  <li>App checks for updates on startup (silent)</li>
                  <li>If update available, notification appears: "Downloading update..."</li>
                  <li>Progress bar shows download percentage</li>
                  <li>When complete, dialog appears: "Update downloaded - Restart to install?"</li>
                  <li>User clicks "Restart" → app quits and installs update</li>
                  <li>App restarts with new version</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Update Flow */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-2xl">Update Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-500 to-cyan-500"></div>
                  <div className="space-y-6 pl-10">
                    <div className="relative">
                      <div className="absolute -left-6 w-3 h-3 rounded-full bg-teal-500 border-2 border-zinc-900"></div>
                      <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                        <h4 className="font-semibold text-white mb-2">1. App Startup</h4>
                        <p className="text-sm text-zinc-400">
                          updaterService calls autoUpdater.checkForUpdatesAndNotify() automatically.
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-6 w-3 h-3 rounded-full bg-cyan-500 border-2 border-zinc-900"></div>
                      <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                        <h4 className="font-semibold text-white mb-2">2. Update Check</h4>
                        <p className="text-sm text-zinc-400">
                          electron-updater queries GitHub Releases API for latest version and compares with current version.
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-6 w-3 h-3 rounded-full bg-blue-500 border-2 border-zinc-900"></div>
                      <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                        <h4 className="font-semibold text-white mb-2">3. Download</h4>
                        <p className="text-sm text-zinc-400">
                          If update available, download starts in background. Progress events sent to renderer via IPC.
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-6 w-3 h-3 rounded-full bg-green-500 border-2 border-zinc-900"></div>
                      <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                        <h4 className="font-semibold text-white mb-2">4. Installation</h4>
                        <p className="text-sm text-zinc-400">
                          When download completes, user is prompted. On confirmation, app quits and installs update automatically.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Docs */}
          <div className="p-6 bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-blue-500/10 border border-teal-500/20 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-3">Related Documentation</h3>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/docs/architecture"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Architecture Overview
              </Link>
              <Link
                href="/docs/getting-started"
                className="px-4 py-2 border border-teal-500/50 text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors text-sm font-medium"
              >
                Getting Started
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

