import React, { useState } from 'react';
import { Tabs } from '@mantine/core';
import { FolderTree, Layers, PlayCircle } from 'lucide-react';
import BrowserStackAutomateProjects from './BrowserStackAutomateProjects';
import BrowserStackAutomateBuilds from './BrowserStackAutomateBuilds';
import BrowserStackAutomateSessions from './BrowserStackAutomateSessions';

/**
 * BrowserStack Automate Screen
 * Full-page screen for BrowserStack Automate integration
 */
const BrowserStackAutomateScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('projects');

  return (
    <div style={{ height: '100vh', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'projects')} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Tabs.List style={{ flexShrink: 0, padding: '8px 16px', borderBottom: '1px solid #1f2937' }}>
          <Tabs.Tab value="projects" leftSection={<FolderTree size={16} />}>
            Projects
          </Tabs.Tab>
          <Tabs.Tab value="builds" leftSection={<Layers size={16} />}>
            Builds
          </Tabs.Tab>
          <Tabs.Tab value="sessions" leftSection={<PlayCircle size={16} />}>
            Sessions
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="projects" style={{ flex: 1, overflow: 'hidden' }}>
          <BrowserStackAutomateProjects />
        </Tabs.Panel>

        <Tabs.Panel value="builds" style={{ flex: 1, overflow: 'hidden' }}>
          <BrowserStackAutomateBuilds />
        </Tabs.Panel>

        <Tabs.Panel value="sessions" style={{ flex: 1, overflow: 'hidden' }}>
          <BrowserStackAutomateSessions />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default BrowserStackAutomateScreen;

