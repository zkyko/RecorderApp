import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Text, Button, Group, Grid, Badge, Loader, Center, ScrollArea, Code } from '@mantine/core';
import { ArrowRight, Check, RefreshCw } from 'lucide-react';
import { ipc } from '../ipc';
import './LocatorCleanupScreen.css';

const LocatorCleanupScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [rawCode, setRawCode] = useState<string>('');
  const [cleanedCode, setCleanedCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [mapping, setMapping] = useState<Array<{ original: string; upgraded: string }>>([]);

  useEffect(() => {
    const state = location.state as { rawCode?: string };
    if (state?.rawCode) {
      setRawCode(state.rawCode);
      handleCleanup(state.rawCode);
    }
  }, [location]);

  const handleCleanup = async (code?: string) => {
    const codeToClean = code || rawCode;
    if (!codeToClean) return;

    setLoading(true);
    try {
      const response = await ipc.locator.cleanup({ rawCode: codeToClean });
      if (response.success && response.cleanedCode) {
        setCleanedCode(response.cleanedCode);
        setMapping(response.mapping || []);
      }
    } catch (error) {
      console.error('Failed to clean locators:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    const state = location.state as { cleanedCode?: string; parameterizedSteps?: any[] };
    navigate('/record/params', { 
      state: { 
        cleanedCode,
        parameterizedSteps: state?.parameterizedSteps || []
      } 
    });
  };

  return (
    <div className="locator-cleanup-screen">
      <Card padding="lg" radius="md" withBorder mb="md">
        <Text size="lg" fw={600} mb="xs">Locator Cleanup</Text>
        <Text size="sm" c="dimmed">Review and approve upgraded locators for better stability</Text>
      </Card>

      {loading && (
        <Card padding="xl" radius="md" withBorder mb="md">
          <Center>
            <Group>
              <Loader size="md" />
              <Text>Cleaning locators...</Text>
            </Group>
          </Center>
        </Card>
      )}
      
      {!loading && mapping.length > 0 && (
        <Card padding="lg" radius="md" withBorder mb="md">
          <Group justify="space-between" mb="md">
            <Text fw={600}>Locator Upgrades</Text>
            <Badge color="blue">{mapping.length} locators upgraded</Badge>
          </Group>
          <ScrollArea h={200}>
            {mapping.map((m, i) => (
              <Card key={i} padding="sm" radius="md" withBorder mb="xs" style={{ background: '#1f2937' }}>
                <Group gap="md">
                  <div style={{ flex: 1 }}>
                    <Text size="xs" c="dimmed" mb={4}>Original:</Text>
                    <Code block style={{ background: '#0b1020' }}>{m.original}</Code>
                  </div>
                  <ArrowRight size={20} color="#3b82f6" />
                  <div style={{ flex: 1 }}>
                    <Text size="xs" c="dimmed" mb={4}>Upgraded:</Text>
                    <Code block color="blue" style={{ background: '#0b1020' }}>{m.upgraded}</Code>
                  </div>
                </Group>
              </Card>
            ))}
          </ScrollArea>
        </Card>
      )}

      <Grid gutter="md" mb="md">
        <Grid.Col span={6}>
          <Card padding="lg" radius="md" withBorder style={{ height: '100%' }}>
            <Group justify="space-between" mb="md">
              <Text fw={600}>Original Code</Text>
              <Badge variant="light">Raw Codegen</Badge>
            </Group>
            <ScrollArea h={500}>
              <Code block style={{ background: '#0b1020', color: '#d4d4d4' }}>
                {rawCode || 'No code available'}
              </Code>
            </ScrollArea>
          </Card>
        </Grid.Col>
        <Grid.Col span={6}>
          <Card padding="lg" radius="md" withBorder style={{ height: '100%' }}>
            <Group justify="space-between" mb="md">
              <Text fw={600}>Cleaned Code</Text>
              <Badge color="green">Upgraded</Badge>
            </Group>
            <ScrollArea h={500}>
              <Code block color="green" style={{ background: '#0b1020', color: '#d4d4d4' }}>
                {cleanedCode || 'Click "Clean Locators" to process'}
              </Code>
            </ScrollArea>
          </Card>
        </Grid.Col>
      </Grid>

      <Group justify="flex-end">
        <Button
          leftSection={<RefreshCw size={16} />}
          onClick={() => handleCleanup()}
          disabled={loading}
          variant="light"
        >
          Clean Locators
        </Button>
        <Button
          leftSection={<Check size={16} />}
          onClick={handleApprove}
          disabled={!cleanedCode || loading}
          rightSection={<ArrowRight size={16} />}
        >
          Approve & Continue
        </Button>
      </Group>
    </div>
  );
};

export default LocatorCleanupScreen;
