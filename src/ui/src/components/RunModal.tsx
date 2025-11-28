import React, { useState, useEffect } from 'react';
import { Modal, Radio, Select, Button, Group, Stack, Text, Checkbox, ScrollArea, Divider } from '@mantine/core';
import { ipc } from '../ipc';

interface RunModalProps {
  opened: boolean;
  onClose: () => void;
  onRun: (mode: 'local' | 'browserstack', target?: string, selectedDataIndices?: number[]) => void;
  testName?: string;
  workspacePath?: string;
  dataRows?: any[]; // Optional: Pass data rows directly instead of loading
}

const RunModal: React.FC<RunModalProps> = ({ opened, onClose, onRun, testName, workspacePath, dataRows: propDataRows }) => {
  const [runMode, setRunMode] = useState<'local' | 'browserstack'>('local');
  const [target, setTarget] = useState<string>('Chrome');
  const [dataRows, setDataRows] = useState<any[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const browserstackTargets = [
    { value: 'Chrome', label: 'Chrome' },
    { value: 'Edge', label: 'Edge' },
    { value: 'Pixel', label: 'Pixel (Android)' },
    { value: 'iPhone', label: 'iPhone (iOS)' },
  ];

  // Use passed dataRows or load them
  useEffect(() => {
    if (opened) {
      if (propDataRows && propDataRows.length > 0) {
        // Use passed data rows
        const enabledRows = propDataRows.filter((row: any) => row.enabled !== false);
        setDataRows(enabledRows);
        setSelectedIndices(enabledRows.map((_: any, index: number) => index));
        setLoading(false);
      } else if (testName && workspacePath) {
        // Load data rows if not provided
        loadTestData();
      } else {
        setDataRows([]);
        setSelectedIndices([]);
        setLoading(false);
      }
    } else {
      setDataRows([]);
      setSelectedIndices([]);
      setLoading(false);
    }
  }, [opened, testName, workspacePath, propDataRows]);

  const loadTestData = async () => {
    if (!testName || !workspacePath) return;
    
    setLoading(true);
    try {
      const response = await ipc.data.read({ workspacePath, testName });
      if (response.success && response.rows) {
        const rows = response.rows.filter((row: any) => row.enabled !== false);
        setDataRows(rows);
        // Select all by default
        setSelectedIndices(rows.map((_: any, index: number) => index));
      }
    } catch (error) {
      console.error('Failed to load test data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDataRow = (index: number) => {
    setSelectedIndices(prev => 
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleSelectAll = () => {
    if (selectedIndices.length === dataRows.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(dataRows.map((_, index) => index));
    }
  };

  const handleRun = () => {
    if (selectedIndices.length === 0) {
      alert('Please select at least one data set to run');
      return;
    }
    onRun(runMode, runMode === 'browserstack' ? target : undefined, selectedIndices);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={testName ? `Run ${testName}` : 'Run Test'}
      size="lg"
    >
      <Stack gap="md">
        <Radio.Group
          label="Execution Mode"
          value={runMode}
          onChange={(value) => setRunMode(value as 'local' | 'browserstack')}
        >
          <Stack gap="xs" mt="xs">
            <Radio value="local" label="Local" />
            <Radio value="browserstack" label="BrowserStack Automate" />
          </Stack>
        </Radio.Group>

        {runMode === 'browserstack' && (
          <Select
            label="Target"
            placeholder="Select target"
            data={browserstackTargets}
            value={target}
            onChange={(value) => setTarget(value || 'Chrome')}
          />
        )}

        {dataRows.length > 0 && (
          <>
            <Divider />
            <Group justify="space-between" align="center">
              <Text fw={500} size="sm">Select Data Sets to Run</Text>
              <Button
                size="xs"
                variant="subtle"
                onClick={handleSelectAll}
              >
                {selectedIndices.length === dataRows.length ? 'Deselect All' : 'Select All'}
              </Button>
            </Group>
            <ScrollArea h={200}>
              <Stack gap="xs">
                {dataRows.map((row, index) => {
                  const isSelected = selectedIndices.includes(index);
                  const rowName = row.name || row.id || `Row ${index + 1}`;
                  const rowData = Object.entries(row)
                    .filter(([key]) => key !== 'id' && key !== 'enabled' && key !== 'name')
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ');

                  return (
                    <Checkbox
                      key={index}
                      checked={isSelected}
                      onChange={() => handleToggleDataRow(index)}
                      label={
                        <div>
                          <Text size="sm" fw={500}>{rowName}</Text>
                          {rowData && (
                            <Text size="xs" c="dimmed">{rowData}</Text>
                          )}
                        </div>
                      }
                    />
                  );
                })}
              </Stack>
            </ScrollArea>
            <Text size="xs" c="dimmed">
              {selectedIndices.length} of {dataRows.length} data set{dataRows.length !== 1 ? 's' : ''} selected
            </Text>
          </>
        )}

        {dataRows.length === 0 && !loading && (
          <Text size="sm" c="dimmed" ta="center" py="md">
            No data sets found. The test will run with default data.
          </Text>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleRun}
            disabled={dataRows.length > 0 && selectedIndices.length === 0}
          >
            Run {selectedIndices.length > 0 ? `(${selectedIndices.length})` : ''}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default RunModal;

