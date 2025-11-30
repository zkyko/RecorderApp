'use client';

import React, { useState } from 'react';
import { Tabs, Card, Text, Group, Badge, Code, ScrollArea, Image, Button, Stack } from '@mantine/core';
import { AlertTriangle, Image as ImageIcon, Video, FileText, Brain, Download } from 'lucide-react';

interface FailureDetailViewProps {
  testName: string;
  runId: string;
  error?: string;
}

export function FailureDetailView({ testName, runId, error }: FailureDetailViewProps) {
  const [activeTab, setActiveTab] = useState<string | null>('screenshot');

  // Mock data - in real implementation, these would come from the backend
  const mockScreenshot = '/mock-data/failure-screenshot.png'; // Placeholder path
  const mockVideo = '/mock-data/failure-video.mp4'; // Placeholder path
  const mockLogs = `[2024-01-13 09:15:23] Starting test: warehouse-transfer
[2024-01-13 09:15:24] Navigated to: https://demo.sandbox.operations.dynamics.com/
[2024-01-13 09:15:25] Clicked: Sales orders link
[2024-01-13 09:15:26] Clicked: New button
[2024-01-13 09:15:27] Filled: Customer account = US-001
[2024-01-13 09:15:28] Clicked: Add line button
[2024-01-13 09:15:29] Filled: Item number = A0001
[2024-01-13 09:15:30] Filled: Quantity = 10
[2024-01-13 09:15:31] Clicked: Save button
[2024-01-13 09:15:32] Waiting for: Transfer button
[2024-01-13 09:17:45] ERROR: Timeout waiting for element
[2024-01-13 09:17:45] Element not found: page.getByRole('button', { name: 'Transfer' })
[2024-01-13 09:17:45] Test failed with exit code: 1`;

  const mockAIExplanation = `Based on the test failure logs, I can see that the warehouse transfer test failed at step 5 when trying to select a warehouse location. The error indicates that the locator \`page.getByRole('button', { name: 'Transfer' })\` couldn't find the element.

**Root Cause:**
The Transfer button appears to be conditionally rendered based on form state. The button may only appear after certain fields are filled or the form is in a specific state.

**Recommended Fix:**
1. Add a wait condition before clicking the Transfer button:
\`\`\`typescript
await page.getByRole('button', { name: 'Transfer' }).waitFor({ state: 'visible' });
await page.getByRole('button', { name: 'Transfer' }).click();
\`\`\`

2. Alternatively, verify the form state before attempting to transfer:
\`\`\`typescript
await expect(page.getByText('Ready to transfer')).toBeVisible();
await page.getByRole('button', { name: 'Transfer' }).click();
\`\`\`

**Additional Suggestions:**
- Check if there are any validation messages preventing the transfer
- Verify all required fields are filled before the transfer step
- Consider adding explicit waits for D365 form state changes`;

  return (
    <div style={{ padding: '1rem' }}>
      <Group justify="space-between" mb="md">
        <div>
          <Text size="lg" fw={600} mb={4}>{testName}</Text>
          <Group gap="xs">
            <Badge color="red" leftSection={<AlertTriangle size={12} />}>
              Failed
            </Badge>
            <Text size="xs" c="dimmed">Run ID: {runId}</Text>
          </Group>
        </div>
        <Button
          variant="subtle"
          leftSection={<Download size={16} />}
          onClick={() => {
            // In real implementation, this would download the failure report
            alert('Downloading failure report...');
          }}
        >
          Export Report
        </Button>
      </Group>

      {error && (
        <Card mb="md" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <Group gap="xs" mb="xs">
            <AlertTriangle size={16} color="#ef4444" />
            <Text fw={600} c="red">Error</Text>
          </Group>
          <Code block style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
            {error}
          </Code>
        </Card>
      )}

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="screenshot" leftSection={<ImageIcon size={16} />}>
            Screenshot
          </Tabs.Tab>
          <Tabs.Tab value="video" leftSection={<Video size={16} />}>
            Video
          </Tabs.Tab>
          <Tabs.Tab value="logs" leftSection={<FileText size={16} />}>
            Logs
          </Tabs.Tab>
          <Tabs.Tab value="ai" leftSection={<Brain size={16} />}>
            AI Explanation
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="screenshot" pt="md">
          <Card>
            <Stack gap="md">
              <Text size="sm" c="dimmed">Failure screenshot at the point of error</Text>
              <div style={{
                background: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px'
              }}>
                <Stack align="center" gap="md">
                  <ImageIcon size={48} color="#6b7280" />
                  <Text c="dimmed" size="sm">
                    Screenshot would appear here
                  </Text>
                  <Text c="dimmed" size="xs">
                    In the desktop app, this shows the actual failure screenshot
                  </Text>
                </Stack>
              </div>
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="video" pt="md">
          <Card>
            <Stack gap="md">
              <Text size="sm" c="dimmed">Video recording of the test execution</Text>
              <div style={{
                background: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px'
              }}>
                <Stack align="center" gap="md">
                  <Video size={48} color="#6b7280" />
                  <Text c="dimmed" size="sm">
                    Video would appear here
                  </Text>
                  <Text c="dimmed" size="xs">
                    In the desktop app, this shows the actual test execution video
                  </Text>
                </Stack>
              </div>
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="logs" pt="md">
          <Card>
            <ScrollArea h={500}>
              <Code block style={{ background: '#0b1020', padding: '1rem' }}>
                {mockLogs}
              </Code>
            </ScrollArea>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="ai" pt="md">
          <Card>
            <ScrollArea h={500}>
              <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: 1.6 }}>
                {mockAIExplanation}
              </div>
            </ScrollArea>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}

