import React, { useState } from 'react';
import { Tabs } from '@mantine/core';
import { List, Globe } from 'lucide-react';
import { Jira } from './Jira';
import JiraIssuesList from './JiraIssuesList';

/**
 * Jira Screen
 * Full-page screen for Jira integration with tabs for embedded view and issues list
 */
const JiraScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('issues');

  return (
    <div style={{ height: '100vh', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'issues')} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Tabs.List style={{ flexShrink: 0, padding: '8px 16px', borderBottom: '1px solid #1f2937' }}>
          <Tabs.Tab value="issues" leftSection={<List size={16} />}>
            Issues List
          </Tabs.Tab>
          <Tabs.Tab value="embedded" leftSection={<Globe size={16} />}>
            Embedded View
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="issues" style={{ flex: 1, overflow: 'hidden' }}>
          <JiraIssuesList />
        </Tabs.Panel>

        <Tabs.Panel value="embedded" style={{ flex: 1, overflow: 'hidden' }}>
          <Jira />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default JiraScreen;

