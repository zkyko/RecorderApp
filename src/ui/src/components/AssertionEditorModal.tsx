import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  TextInput,
  Select,
  Stack,
  Group,
  Text,
  Alert,
  Radio,
} from '@mantine/core';
import { CheckCircle } from 'lucide-react';
import { AssertionKind } from '../../../types';

interface AssertionEditorModalProps {
  opened: boolean;
  onClose: () => void;
  onSave: (assertion: AssertionStep) => void;
  existingStep?: AssertionStep | null;
  availableLocators?: Array<{ fieldName?: string; methodName?: string; description?: string }>;
}

export interface AssertionStep {
  assertion: AssertionKind;
  targetKind: 'locator' | 'page';
  target?: string; // POM locator name or 'page'
  expected?: string; // literal value or {{param}}
  customMessage?: string;
}

const ASSERTION_OPTIONS: Array<{ value: AssertionKind; label: string; requiresValue: boolean }> = [
  { value: 'toHaveText', label: 'Has Text', requiresValue: true },
  { value: 'toContainText', label: 'Contains Text', requiresValue: true },
  { value: 'toBeVisible', label: 'Is Visible', requiresValue: false },
  { value: 'toHaveURL', label: 'Has URL', requiresValue: true },
  { value: 'toHaveTitle', label: 'Has Title', requiresValue: true },
  { value: 'toBeChecked', label: 'Is Checked', requiresValue: false },
  { value: 'toHaveValue', label: 'Has Value', requiresValue: true },
  { value: 'toHaveAttribute', label: 'Has Attribute', requiresValue: true },
];

const AssertionEditorModal: React.FC<AssertionEditorModalProps> = ({
  opened,
  onClose,
  onSave,
  existingStep,
  availableLocators = [],
}) => {
  const [assertionType, setAssertionType] = useState<AssertionKind>('toBeVisible');
  const [targetKind, setTargetKind] = useState<'locator' | 'page'>('locator');
  const [selectedLocator, setSelectedLocator] = useState<string>('');
  const [expectedValue, setExpectedValue] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');

  useEffect(() => {
    if (opened) {
      if (existingStep) {
        setAssertionType(existingStep.assertion);
        setTargetKind(existingStep.targetKind);
        setSelectedLocator(existingStep.target || '');
        setExpectedValue(existingStep.expected || '');
        setCustomMessage(existingStep.customMessage || '');
      } else {
        // Reset to defaults
        setAssertionType('toBeVisible');
        setTargetKind('locator');
        setSelectedLocator('');
        setExpectedValue('');
        setCustomMessage('');
      }
    }
  }, [opened, existingStep]);

  const selectedAssertion = ASSERTION_OPTIONS.find(opt => opt.value === assertionType);
  const requiresValue = selectedAssertion?.requiresValue ?? false;

  const handleSave = () => {
    const assertion: AssertionStep = {
      assertion: assertionType,
      targetKind,
      target: targetKind === 'locator' ? selectedLocator : 'page',
      expected: requiresValue ? expectedValue : undefined,
      customMessage: customMessage.trim() || undefined,
    };

    onSave(assertion);
    onClose();
  };

  const isValid = () => {
    if (targetKind === 'locator' && !selectedLocator) {
      return false;
    }
    if (requiresValue && !expectedValue.trim()) {
      return false;
    }
    return true;
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <CheckCircle size={20} />
          <Text fw={600}>{existingStep ? 'Edit Assertion' : 'Add Assertion'}</Text>
        </Group>
      }
      size="md"
    >
      <Stack gap="md">
        <Select
          label="Assertion Type"
          placeholder="Select assertion type"
          value={assertionType}
          onChange={(value) => setAssertionType(value as AssertionKind)}
          data={ASSERTION_OPTIONS.map(opt => ({ value: opt.value, label: opt.label }))}
          required
        />

        <Radio.Group
          label="Target"
          value={targetKind}
          onChange={(value) => setTargetKind(value as 'locator' | 'page')}
        >
          <Stack gap="xs" mt="xs">
            <Radio value="locator" label="Locator (Element)" />
            <Radio value="page" label="Page" />
          </Stack>
        </Radio.Group>

        {targetKind === 'locator' && (
          <Select
            label="Select Locator"
            placeholder="Choose a locator"
            value={selectedLocator}
            onChange={(value) => setSelectedLocator(value || '')}
            data={availableLocators.map(loc => ({
              value: loc.fieldName || loc.methodName || '',
              label: loc.description || loc.fieldName || loc.methodName || 'Unknown',
            }))}
            searchable
            required
          />
        )}

        {targetKind === 'page' && (
          <Alert color="blue">
            This assertion will check page-level properties (URL, title, etc.)
          </Alert>
        )}

        {requiresValue && (
          <TextInput
            label="Expected Value"
            placeholder={assertionType === 'toHaveAttribute' ? 'attribute=value' : 'Enter expected value'}
            value={expectedValue}
            onChange={(e) => setExpectedValue(e.target.value)}
            description={assertionType === 'toHaveAttribute' ? 'Format: attributeName=value' : 'You can use {{param}} for parameterization'}
            required
          />
        )}

        <TextInput
          label="Custom Message (Optional)"
          placeholder="Custom assertion failure message"
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
        />

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid()}>
            {existingStep ? 'Update' : 'Add'} Assertion
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default AssertionEditorModal;

