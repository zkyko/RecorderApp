import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Text, Button, Group, TextInput, Checkbox, Badge, Loader, Center, Alert } from '@mantine/core';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { ipc } from '../ipc';
import { useWorkspaceStore } from '../store/workspace-store';
import { ParamCandidate } from '../../../types/v1.5';
import './ParameterMappingScreen.css';

const ParameterMappingScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { workspacePath } = useWorkspaceStore();
  const [cleanedCode, setCleanedCode] = useState<string>('');
  const [candidates, setCandidates] = useState<ParamCandidate[]>([]);
  const [selectedParams, setSelectedParams] = useState<Map<string, string>>(new Map());
  const [testName, setTestName] = useState('');
  const [module, setModule] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegenerate, setIsRegenerate] = useState(false);

  useEffect(() => {
    const state = location.state as {
      cleanedCode?: string;
      parameterizedSteps?: ParamCandidate[];
      testName?: string;
      module?: string;
      mode?: 'regenerate' | 'new';
    };

    if (state?.cleanedCode) {
      setCleanedCode(state.cleanedCode);

      // If this was launched from an existing test, pre-fill test info
      if (state.testName) {
        setTestName(state.testName);
      }
      if (state.module) {
        setModule(state.module);
      }
      if (state.mode === 'regenerate') {
        setIsRegenerate(true);
      }
      
      // If parameterized steps were passed from Step Editor, use those
      if (state.parameterizedSteps && state.parameterizedSteps.length > 0) {
        setCandidates(state.parameterizedSteps);
        // Pre-select all parameterized steps
        const initial = new Map<string, string>();
        state.parameterizedSteps.forEach(c => {
          initial.set(c.id, c.suggestedName);
        });
        setSelectedParams(initial);
      } else {
        // Otherwise, detect from code
        handleDetectParams(state.cleanedCode);
      }
    }
  }, [location]);

  const handleDetectParams = async (code?: string) => {
    const codeToAnalyze = code || cleanedCode;
    if (!codeToAnalyze) return;

    setLoading(true);
    try {
      const response = await ipc.params.detect({ cleanedCode: codeToAnalyze });
      if (response.success && response.candidates) {
        setCandidates(response.candidates);
        // Pre-select all candidates
        const initial = new Map<string, string>();
        response.candidates.forEach(c => {
          initial.set(c.id, c.suggestedName);
        });
        setSelectedParams(initial);
      }
    } catch (error) {
      console.error('Failed to detect parameters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleParam = (id: string, checked: boolean) => {
    const newMap = new Map(selectedParams);
    if (checked) {
      const candidate = candidates.find(c => c.id === id);
      if (candidate) {
        newMap.set(id, candidate.suggestedName);
      }
    } else {
      newMap.delete(id);
    }
    setSelectedParams(newMap);
  };

  const handleVariableNameChange = (id: string, name: string) => {
    const newMap = new Map(selectedParams);
    newMap.set(id, name);
    setSelectedParams(newMap);
  };

  const handleGenerate = async () => {
    if (!testName || !workspacePath) return;

    const selected = Array.from(selectedParams.entries()).map(([id, variableName]) => ({
      id,
      variableName,
    }));

    try {
      const response = await ipc.spec.write({
        workspacePath,
        testName,
        module: module || undefined,
        cleanedCode,
        selectedParams: selected,
      });

      if (response.success) {
        navigate(`/test/${testName}/data`);
      } else {
        alert(`Failed to generate spec: ${response.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="parameter-mapping-screen">
      <Card padding="lg" radius="md" withBorder mb="md">
        <Text size="lg" fw={600} mb="xs">Parameter Mapping</Text>
        <Text size="sm" c="dimmed">Select which input values should become test parameters</Text>
      </Card>

      <Card padding="lg" radius="md" withBorder mb="md">
        <Text fw={600} mb="md">Test Information</Text>
        <Group gap="md">
          <TextInput
            label="Test Name *"
            placeholder="e.g., SalesOrder"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            disabled={isRegenerate} // For regenerate mode, keep the existing test name
            style={{ flex: 1 }}
            required
          />
          <TextInput
            label="Module (optional)"
            placeholder="e.g., Sales"
            value={module}
            onChange={(e) => setModule(e.target.value)}
            style={{ flex: 1 }}
          />
        </Group>
      </Card>

      <Card padding="lg" radius="md" withBorder mb="md">
        <Group justify="space-between" mb="md">
          <Text fw={600}>Detected Parameters</Text>
          <Badge color="blue">{candidates.length} candidates found</Badge>
        </Group>
        
        {loading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : candidates.length === 0 ? (
          <Alert color="blue" title="No parameters">
            No parameterizable inputs detected in the code.
          </Alert>
        ) : (
          <div className="parameter-list">
            {candidates.map((candidate) => (
              <Card key={candidate.id} padding="md" radius="md" withBorder mb="xs" style={{ background: '#1f2937' }}>
                <Group gap="md" align="flex-start">
                  <Checkbox
                    checked={selectedParams.has(candidate.id)}
                    onChange={(e) => handleToggleParam(candidate.id, e.currentTarget.checked)}
                  />
                  <div style={{ flex: 1 }}>
                    <Group gap="xs" mb="xs">
                      <Text size="xs" c="dimmed">Field:</Text>
                      <Text size="sm" fw={500}>{candidate.label}</Text>
                    </Group>
                    <Group gap="xs" mb="xs">
                      <Text size="xs" c="dimmed">Value:</Text>
                      <Text size="sm" ff="monospace" c="blue">{candidate.originalValue}</Text>
                    </Group>
                    <TextInput
                      label="Variable Name"
                      value={selectedParams.get(candidate.id) || candidate.suggestedName}
                      onChange={(e) => handleVariableNameChange(candidate.id, e.target.value)}
                      disabled={!selectedParams.has(candidate.id)}
                      placeholder={candidate.suggestedName}
                      size="sm"
                    />
                  </div>
                </Group>
              </Card>
            ))}
          </div>
        )}
      </Card>

      <Card padding="md" radius="md" withBorder style={{ background: '#1f2937' }}>
        <Group justify="space-between">
          <Button
            leftSection={<ArrowLeft size={16} />}
            variant="light"
            onClick={() => navigate('/record')}
          >
            Back
          </Button>
          <Button
            rightSection={<ArrowRight size={16} />}
            onClick={handleGenerate}
            disabled={!testName}
            leftSection={<Check size={16} />}
            color="blue"
            size="md"
          >
            Generate Test
          </Button>
        </Group>
        {!testName && (
          <Text size="xs" c="dimmed" mt="xs" style={{ textAlign: 'center' }}>
            Enter a test name to enable Generate Test
          </Text>
        )}
        {testName && selectedParams.size === 0 && candidates.length > 0 && (
          <Text size="xs" c="blue" mt="xs" style={{ textAlign: 'center' }}>
            No parameters selected - test will be generated with hardcoded values
          </Text>
        )}
      </Card>
    </div>
  );
};

export default ParameterMappingScreen;
