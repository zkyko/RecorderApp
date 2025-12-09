import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Text, Button, Group, Stack, TextInput, Badge, ScrollArea, ActionIcon, Checkbox, Alert, Menu, Code } from '@mantine/core';
import { ArrowRight, Trash2, Edit2, Check, X, Plus, Clock, MessageSquare, CheckCircle } from 'lucide-react';
import { ipc } from '../ipc';
import { useWorkspaceStore } from '../store/workspace-store';
import AssertionEditorModal, { AssertionStep } from './AssertionEditorModal';
import { AssertionKind } from '../../../types';
import './StepEditorScreen.css';

interface RecordedStep {
  pageId: string;
  action: 'click' | 'fill' | 'select' | 'navigate' | 'wait' | 'custom' | 'comment' | 'assert';
  description: string;
  locator?: any;
  value?: string;
  order: number;
  timestamp: Date;
  fieldName?: string;
  methodName?: string;
  pageUrl?: string;
  mi?: string;
  cmp?: string;
  pageType?: 'list' | 'details' | 'dialog' | 'workspace' | 'unknown';
  customAction?: 'waitForD365'; // For custom action type
  // Assertion fields
  assertion?: AssertionKind;
  targetKind?: 'locator' | 'page';
  target?: string;
  expected?: string;
  customMessage?: string;
}

const StepEditorScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentWorkspace } = useWorkspaceStore();
  const [steps, setSteps] = useState<RecordedStep[]>([]);
  const [rawCode, setRawCode] = useState<string>('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedValue, setEditedValue] = useState<string>('');
  const [showCleanupAlert, setShowCleanupAlert] = useState(false);
  const [assertionModalOpen, setAssertionModalOpen] = useState(false);
  const [assertionEditIndex, setAssertionEditIndex] = useState<number | null>(null);
  const [availableLocators, setAvailableLocators] = useState<Array<{ fieldName?: string; methodName?: string; description?: string }>>([]);

  useEffect(() => {
    const state = location.state as { rawCode?: string; steps?: RecordedStep[] };
    if (state?.steps) {
      setSteps(state.steps);
    }
    if (state?.rawCode) {
      setRawCode(state.rawCode);
    }
  }, [location]);

  const handleDelete = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps);
    // Regenerate code after deletion
    regenerateCode(newSteps);
  };

  const handleEditStart = (index: number) => {
    setEditingIndex(index);
    setEditedValue(steps[index].value || '');
  };

  const handleEditSave = (index: number) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], value: editedValue };
    setSteps(newSteps);
    setEditingIndex(null);
    setEditedValue('');
    // Regenerate code after edit
    regenerateCode(newSteps);
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
    setEditedValue('');
  };

  const handleParameterize = (index: number) => {
    const step = steps[index];
    if (step.value) {
      // Mark as parameterized by wrapping in {{ }} or similar
      const newSteps = [...steps];
      newSteps[index] = { 
        ...newSteps[index], 
        value: `{{${step.value}}}` // Simple parameterization marker
      };
      setSteps(newSteps);
      regenerateCode(newSteps);
    }
  };

  const regenerateCode = async (stepsToCompile: RecordedStep[]) => {
    try {
      const code = await ipc.recorder.compileSteps(stepsToCompile);
      if (code) {
        setRawCode(code);
      }
    } catch (error) {
      console.error('Failed to regenerate code:', error);
    }
  };

  const handleContinue = () => {
    // Extract parameterized steps info and create ParamCandidate objects
    // If steps is empty (e.g., from Visual Builder), we'll detect parameters in the parameter mapping screen
    const parameterizedSteps = steps.length > 0
      ? steps
          .filter(step => step.value && step.value.startsWith('{{') && step.value.endsWith('}}'))
          .map((step, index) => {
            const originalValue = step.value!.slice(2, -2); // Remove {{ }}
            const label = extractFieldLabel(step.description) || step.description || 'Field';
            const suggestedName = generateParameterName(step, label);
            
            return {
              id: `param-${step.order}-${index}`, // Unique ID
              label: label,
              originalValue: originalValue,
              suggestedName: suggestedName,
            };
          })
      : []; // Empty array - parameter detection will happen in parameter mapping screen

    // For web-demo workspaces, skip locator cleanup and go directly to parameter mapping
    if (currentWorkspace?.type === 'web-demo') {
      navigate('/record/params', { 
        state: { 
          cleanedCode: rawCode, // Use rawCode as cleanedCode for web-demo
          steps: steps,
          parameterizedSteps: parameterizedSteps
        } 
      });
    } else {
      // Navigate to locator cleanup with the final code and parameterized steps
      navigate('/record/locator-cleanup', { 
        state: { 
          rawCode: rawCode,
          steps: steps,
          parameterizedSteps: parameterizedSteps
        } 
      });
    }
  };

  // Helper to generate parameter name from step (matches backend logic)
  const generateParameterName = (step: RecordedStep, label: string): string => {
    // Use label if available, otherwise use description
    const source = label || step.description || step.fieldName || 'value';
    
    // Convert to camelCase (matches backend makeSafeIdentifier logic)
    return source
      .toLowerCase()
      .replace(/[^a-z0-9]+(.)/g, (_, char) => char.toUpperCase())
      .replace(/^[A-Z]/, (char) => char.toLowerCase())
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 50);
  };

  // Helper to extract field label from description
  const extractFieldLabel = (description: string): string => {
    // Pattern: "Fill 'Customer account' = '100001'" or "Select 'Item number' = 'A0001'"
    const match = description.match(/['"]([^'"]+)['"]/);
    return match ? match[1] : '';
  };

  /**
   * Detect redundant navigation steps
   * Heuristic: Multiple navigations in a row, or navigations immediately after clicks without user interaction
   */
  const detectRedundantNavigations = useMemo(() => {
    const redundantIndices: number[] = [];
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      // Check if this is a navigation step
      if (step.action === 'navigate') {
        // Check if previous step was also navigation (multiple navigations in a row)
        if (i > 0 && steps[i - 1].action === 'navigate') {
          redundantIndices.push(i);
          continue;
        }
        
        // Check if next step is a click and previous step was a click (navigation between clicks without fill/select)
        if (i > 0 && i < steps.length - 1) {
          const prevStep = steps[i - 1];
          const nextStep = steps[i + 1];
          if (prevStep.action === 'click' && nextStep.action === 'click') {
            redundantIndices.push(i);
            continue;
          }
        }
        
        // Check if navigation appears right after a click without meaningful interaction
        if (i > 0 && steps[i - 1].action === 'click' && i < steps.length - 1) {
          const nextStep = steps[i + 1];
          // If next step is also a click or navigate, this might be a redirect
          if (nextStep.action === 'click' || nextStep.action === 'navigate') {
            redundantIndices.push(i);
          }
        }
      }
    }
    
    return redundantIndices;
  }, [steps]);

  useEffect(() => {
    setShowCleanupAlert(detectRedundantNavigations.length > 0);
  }, [detectRedundantNavigations]);

  const handleCleanup = () => {
    const newSteps = steps.filter((_, index) => !detectRedundantNavigations.includes(index));
    setSteps(newSteps);
    setShowCleanupAlert(false);
    regenerateCode(newSteps);
  };

  const handleInsertStep = (index: number, stepType: 'waitForD365' | 'wait' | 'comment' | 'assert') => {
    if (stepType === 'assert') {
      setAssertionEditIndex(index);
      setAssertionModalOpen(true);
      return;
    }

    const newStep: RecordedStep = {
      pageId: steps[index]?.pageId || 'unknown',
      action: stepType === 'comment' ? 'comment' : stepType === 'waitForD365' ? 'custom' : 'wait',
      description: stepType === 'waitForD365' 
        ? 'Wait for D365 to stabilize' 
        : stepType === 'wait' 
        ? 'Hard wait (1000ms)'
        : 'Comment',
      order: index + 1,
      timestamp: new Date(),
      value: stepType === 'wait' ? '1000' : stepType === 'comment' ? 'New Step' : undefined,
      customAction: stepType === 'waitForD365' ? 'waitForD365' : undefined,
    };

    // Update order numbers for all subsequent steps
    const newSteps = [...steps];
    newSteps.splice(index, 0, newStep);
    
    // Re-number all steps
    newSteps.forEach((step, idx) => {
      step.order = idx + 1;
    });
    
    setSteps(newSteps);
    regenerateCode(newSteps);
  };

  const handleSaveAssertion = (assertion: AssertionStep) => {
    const index = assertionEditIndex !== null ? assertionEditIndex : steps.length;
    const assertionLabels: Record<AssertionKind, string> = {
      toHaveText: 'Has Text',
      toContainText: 'Contains Text',
      toBeVisible: 'Is Visible',
      toHaveURL: 'Has URL',
      toHaveTitle: 'Has Title',
      toBeChecked: 'Is Checked',
      toHaveValue: 'Has Value',
      toHaveAttribute: 'Has Attribute',
    };

    const targetLabel = assertion.targetKind === 'page' ? 'page' : (assertion.target || 'element');
    const expectedLabel = assertion.expected ? ` "${assertion.expected}"` : '';
    const description = `Assert ${targetLabel} ${assertionLabels[assertion.assertion]}${expectedLabel}`;

    const newStep: RecordedStep = {
      pageId: steps[Math.max(0, index - 1)]?.pageId || 'unknown',
      action: 'assert',
      description,
      order: index + 1,
      timestamp: new Date(),
      assertion: assertion.assertion,
      targetKind: assertion.targetKind,
      target: assertion.target,
      expected: assertion.expected,
      customMessage: assertion.customMessage,
    };

    const newSteps = [...steps];
    if (assertionEditIndex !== null) {
      // Editing existing assertion
      newSteps[assertionEditIndex] = newStep;
    } else {
      // Adding new assertion
      newSteps.splice(index, 0, newStep);
      // Re-number all steps
      newSteps.forEach((step, idx) => {
        step.order = idx + 1;
      });
    }

    setSteps(newSteps);
    regenerateCode(newSteps);
    setAssertionEditIndex(null);
    // Update available locators
    const locators: Array<{ fieldName?: string; methodName?: string; description?: string }> = [];
    newSteps.forEach(step => {
      if (step.fieldName || step.methodName) {
        locators.push({
          fieldName: step.fieldName,
          methodName: step.methodName,
          description: step.description,
        });
      }
    });
    setAvailableLocators(locators);
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'navigate': return 'blue';
      case 'click': return 'green';
      case 'fill': return 'orange';
      case 'select': return 'purple';
      case 'wait': return 'yellow';
      case 'custom': return 'cyan';
      case 'comment': return 'gray';
      case 'assert': return 'violet';
      default: return 'gray';
    }
  };

  return (
    <div className="step-editor-screen">
      <div className="step-editor-header">
        <Text size="xl" fw={700}>Step Editor</Text>
        <Text size="sm" c="dimmed">Review, edit, and delete recorded steps before generating code</Text>
      </div>

      {/* Smart Cleanup Alert */}
      {showCleanupAlert && detectRedundantNavigations.length > 0 && (
        <Alert
          color="yellow"
          title={`Detected ${detectRedundantNavigations.length} potential redirect step${detectRedundantNavigations.length !== 1 ? 's' : ''}`}
          onClose={() => setShowCleanupAlert(false)}
          withCloseButton
          mb="md"
        >
          <Group justify="space-between" align="center">
            <Text size="sm">
              These navigation steps appear to be redundant and can be safely removed.
            </Text>
            <Button size="xs" onClick={handleCleanup}>
              Clean Up
            </Button>
          </Group>
        </Alert>
      )}

      <ScrollArea h={600} mb="md">
        <Stack gap="md">
          {steps.length === 0 && rawCode ? (
            <Card padding="lg" radius="md" withBorder>
              <Text fw={600} mb="sm">Generated Code</Text>
              <Code block style={{ 
                background: '#0b1020', 
                color: '#d4d4d4',
                padding: '16px',
                borderRadius: '8px',
                fontFamily: "'Courier New', monospace",
                fontSize: '0.875rem',
                lineHeight: 1.6,
              }}>
                {rawCode}
              </Code>
              <Text size="sm" c="dimmed" mt="md" ta="center">
                Code generated from Visual Builder. You can continue to locator cleanup or edit the code manually.
              </Text>
            </Card>
          ) : steps.length === 0 ? (
            <Card padding="lg" radius="md" withBorder>
              <Text c="dimmed" ta="center">No steps to display</Text>
            </Card>
          ) : (
            <>
              {/* Step Injection button before first step */}
              <Group justify="center">
                <Menu shadow="md" width={200}>
                  <Menu.Target>
                    <ActionIcon variant="light" color="blue" size="lg">
                      <Plus size={16} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<Clock size={14} />}
                      onClick={() => handleInsertStep(0, 'waitForD365')}
                    >
                      Wait for D365
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<Clock size={14} />}
                      onClick={() => handleInsertStep(0, 'wait')}
                    >
                      Hard Wait (Time)
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<MessageSquare size={14} />}
                      onClick={() => handleInsertStep(0, 'comment')}
                    >
                      Add Comment
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<CheckCircle size={14} />}
                      onClick={() => handleInsertStep(0, 'assert')}
                    >
                      Add Assertion
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>

              {steps.map((step, index) => (
                <React.Fragment key={index}>
                  <Card padding="lg" radius="md" withBorder>
                <Group justify="space-between" align="flex-start">
                  <Group gap="md" style={{ flex: 1 }}>
                    <Badge color={getActionBadgeColor(step.action)} size="lg">
                      {step.action.toUpperCase()}
                    </Badge>
                    <div style={{ flex: 1 }}>
                      <Text fw={500} mb={4}>{step.description}</Text>
                      {step.action === 'navigate' && step.pageUrl && (
                        <Text size="sm" c="dimmed" style={{ wordBreak: 'break-all' }}>
                          {step.pageUrl}
                        </Text>
                      )}
                      {step.action === 'assert' && (
                        <div style={{ marginTop: 8 }}>
                          <Text size="sm" c="dimmed">
                            <strong>Type:</strong> {step.assertion} | <strong>Target:</strong> {step.targetKind === 'page' ? 'page' : (step.target || 'element')}
                            {step.expected && ` | <strong>Expected:</strong> ${step.expected}`}
                          </Text>
                        </div>
                      )}
                      {(step.action === 'fill' || step.action === 'select') && (
                        <div style={{ marginTop: 8 }}>
                          {editingIndex === index ? (
                            <Group gap="xs">
                              <TextInput
                                value={editedValue}
                                onChange={(e) => setEditedValue(e.target.value)}
                                placeholder="Enter value"
                                style={{ flex: 1 }}
                              />
                              <ActionIcon
                                color="green"
                                onClick={() => handleEditSave(index)}
                                variant="filled"
                              >
                                <Check size={16} />
                              </ActionIcon>
                              <ActionIcon
                                color="red"
                                onClick={handleEditCancel}
                                variant="filled"
                              >
                                <X size={16} />
                              </ActionIcon>
                            </Group>
                          ) : (
                            <Group gap="xs">
                              <Text size="sm">
                                <strong>Value:</strong> {step.value || '(empty)'}
                              </Text>
                              <ActionIcon
                                size="sm"
                                variant="subtle"
                                onClick={() => handleEditStart(index)}
                              >
                                <Edit2 size={14} />
                              </ActionIcon>
                              {step.value && (
                                <Button
                                  size="xs"
                                  variant="light"
                                  onClick={() => handleParameterize(index)}
                                >
                                  Parameterize
                                </Button>
                              )}
                            </Group>
                          )}
                        </div>
                      )}
                      {step.pageId && (
                        <Text size="xs" c="dimmed" mt={4}>
                          Page: {step.pageId}
                        </Text>
                      )}
                      {step.action === 'custom' && step.customAction === 'waitForD365' && (
                        <Text size="sm" c="dimmed" mt={4}>
                          Custom: Wait for D365 to stabilize
                        </Text>
                      )}
                      {step.action === 'wait' && step.value && (
                        <Text size="sm" c="dimmed" mt={4}>
                          Wait: {step.value}ms
                        </Text>
                      )}
                      {step.action === 'comment' && step.value && (
                        <Text size="sm" c="dimmed" mt={4} style={{ fontStyle: 'italic' }}>
                          // {step.value}
                        </Text>
                      )}
                    </div>
                  </Group>
                  <Group gap="xs">
                    {step.action === 'assert' && (
                      <ActionIcon
                        color="blue"
                        variant="light"
                        onClick={() => {
                          setAssertionEditIndex(index);
                          setAssertionModalOpen(true);
                        }}
                      >
                        <Edit2 size={18} />
                      </ActionIcon>
                    )}
                    <ActionIcon
                      color="red"
                      variant="light"
                      onClick={() => handleDelete(index)}
                    >
                      <Trash2 size={18} />
                    </ActionIcon>
                  </Group>
                </Group>
                  </Card>
                  
                  {/* Step Injection button after each step */}
                  <Group justify="center">
                <Menu shadow="md" width={200}>
                  <Menu.Target>
                    <ActionIcon variant="light" color="blue" size="lg">
                      <Plus size={16} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<Clock size={14} />}
                      onClick={() => handleInsertStep(index + 1, 'waitForD365')}
                    >
                      Wait for D365
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<Clock size={14} />}
                      onClick={() => handleInsertStep(index + 1, 'wait')}
                    >
                      Hard Wait (Time)
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<MessageSquare size={14} />}
                      onClick={() => handleInsertStep(index + 1, 'comment')}
                    >
                      Add Comment
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<CheckCircle size={14} />}
                      onClick={() => handleInsertStep(index + 1, 'assert')}
                    >
                      Add Assertion
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
                </React.Fragment>
              ))}
            </>
          )}
        </Stack>
      </ScrollArea>

      <AssertionEditorModal
        opened={assertionModalOpen}
        onClose={() => {
          setAssertionModalOpen(false);
          setAssertionEditIndex(null);
        }}
        onSave={handleSaveAssertion}
        existingStep={
          assertionEditIndex !== null &&
          assertionEditIndex >= 0 &&
          assertionEditIndex < steps.length &&
          steps[assertionEditIndex].action === 'assert'
            ? {
                assertion: steps[assertionEditIndex].assertion!,
                targetKind: steps[assertionEditIndex].targetKind || 'locator',
                target: steps[assertionEditIndex].target,
                expected: steps[assertionEditIndex].expected,
                customMessage: steps[assertionEditIndex].customMessage,
              }
            : null
        }
        availableLocators={availableLocators}
      />

      <Group justify="space-between" mt="md">
        <Text size="sm" c="dimmed">
          {steps.length > 0 
            ? `${steps.length} step${steps.length !== 1 ? 's' : ''} total`
            : rawCode 
              ? 'Code ready - continue to proceed with locator cleanup'
              : 'No steps or code available'}
        </Text>
        <Button
          leftSection={<ArrowRight size={16} />}
          onClick={handleContinue}
          disabled={!rawCode && steps.length === 0}
        >
          Continue to Locator Cleanup
        </Button>
      </Group>
    </div>
  );
};

export default StepEditorScreen;

