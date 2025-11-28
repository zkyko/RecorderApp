import React, { useState } from 'react';
import { Modal, Radio, Select, Button, Group, Stack, Text } from '@mantine/core';
import { Play, Cloud } from 'lucide-react';

interface RunModalProps {
  opened: boolean;
  onClose: () => void;
  onRun: (mode: 'local' | 'browserstack', target?: string) => void;
  testName?: string;
}

const RunModal: React.FC<RunModalProps> = ({ opened, onClose, onRun, testName }) => {
  const [runMode, setRunMode] = useState<'local' | 'browserstack'>('local');
  const [target, setTarget] = useState<string>('Chrome');

  const browserstackTargets = [
    { value: 'Chrome', label: 'Chrome' },
    { value: 'Edge', label: 'Edge' },
    { value: 'Pixel', label: 'Pixel (Android)' },
    { value: 'iPhone', label: 'iPhone (iOS)' },
  ];

  const handleRun = () => {
    onRun(runMode, runMode === 'browserstack' ? target : undefined);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={testName ? `Run ${testName}` : 'Run Test'}
      size="md"
    >
      <Stack gap="md">
        <Radio.Group
          label="Execution Mode"
          value={runMode}
          onChange={(value) => setRunMode(value as 'local' | 'browserstack')}
        >
          <Stack gap="xs" mt="xs">
            <Radio value="local" label="Local" leftSection={<Play size={16} />} />
            <Radio value="browserstack" label="BrowserStack" leftSection={<Cloud size={16} />} />
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

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleRun}>
            Run
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default RunModal;

