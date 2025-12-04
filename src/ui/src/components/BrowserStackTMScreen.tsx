import React, { useState } from 'react';
import { Tabs } from '@mantine/core';
import { List, Globe } from 'lucide-react';
import { BrowserStackTM } from './BrowserStackTM';
import BrowserStackTMTestCasesList from './BrowserStackTMTestCasesList';

/**
 * BrowserStack Test Management Screen
 * Full-page screen for BrowserStack TM integration with tabs for test cases list and embedded view
 */
const BrowserStackTMScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('test-cases');

  return (
    <div style={{ height: '100vh', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'test-cases')} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Tabs.List style={{ flexShrink: 0, padding: '8px 16px', borderBottom: '1px solid #1f2937' }}>
          <Tabs.Tab value="test-cases" leftSection={<List size={16} />}>
            Test Cases
          </Tabs.Tab>
          <Tabs.Tab value="embedded" leftSection={<Globe size={16} />}>
            Embedded View
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="test-cases" style={{ flex: 1, overflow: 'hidden' }}>
          <BrowserStackTMTestCasesList />
        </Tabs.Panel>

        <Tabs.Panel value="embedded" style={{ flex: 1, overflow: 'hidden' }}>
          <BrowserStackTM />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default BrowserStackTMScreen;

