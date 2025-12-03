import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  TextInput,
  Textarea,
  Stack,
  Group,
  Text,
  Alert,
  Loader,
  Select,
} from '@mantine/core';
import { Bug, CheckCircle, XCircle } from 'lucide-react';
import { ipc } from '../ipc';
import { useWorkspaceStore } from '../store/workspace-store';
import { TestRunMeta, JiraDefectContext } from '../../../types/v1.5';

interface JiraCreateDefectModalProps {
  opened: boolean;
  onClose: () => void;
  run: TestRunMeta | null;
  testName: string;
}

const JiraCreateDefectModal: React.FC<JiraCreateDefectModalProps> = ({
  opened,
  onClose,
  run,
  testName,
}) => {
  const { workspacePath } = useWorkspaceStore();
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [issueType, setIssueType] = useState('Bug');
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message?: string } | null>(null);
  const [createdIssue, setCreatedIssue] = useState<{ key?: string; url?: string } | null>(null);

  // Load failure data when modal opens
  useEffect(() => {
    if (opened && run && workspacePath) {
      loadFailureData();
      testJiraConnection();
    } else {
      // Reset state when modal closes
      setSummary('');
      setDescription('');
      setCreatedIssue(null);
      setConnectionStatus(null);
    }
  }, [opened, run, workspacePath]);

  const testJiraConnection = async () => {
    setTestingConnection(true);
    try {
      const result = await ipc.jira.testConnection();
      setConnectionStatus({
        success: result.success,
        message: result.success ? `Connected to ${result.projectName}` : result.error || 'Connection failed',
      });
    } catch (error: any) {
      setConnectionStatus({
        success: false,
        message: error.message || 'Failed to test connection',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const loadFailureData = async () => {
    if (!run || !workspacePath) return;

    try {
      // Build summary
      const summaryText = `Test Failed: ${testName} (Run ${run.runId.slice(0, 8)})`;
      setSummary(summaryText);

      // Build description from run metadata
      setDescription('');
    } catch (error: any) {
      console.error('Failed to load failure data:', error);
      // Set basic description even if loading fails
      setSummary(`Test Failed: ${testName}`);
      setDescription(`Test: ${testName}\nRun ID: ${run.runId}\nStatus: ${run.status}`);
    }
  };

  const handleCreate = async () => {
    if (!summary.trim() || !run || !workspacePath) {
      return;
    }

    setLoading(true);
    try {
      const context: JiraDefectContext = {
        workspacePath,
        workspaceId: undefined,
        testName,
        module: undefined,
        status: 'failed',
        firstFailureMessage: description.trim(),
        browserStackSessionUrl: run.browserstack?.dashboardUrl,
        browserStackTmTestCaseUrl: undefined,
        browserStackTmRunUrl: undefined,
        screenshotPath: undefined,
        tracePath: run.tracePaths && run.tracePaths[0],
        playwrightReportPath: run.allureReportPath || run.reportPath,
      };

      const result = await ipc.jira.createDefectFromRun(context);

      if (result.success && result.issueKey) {
        setCreatedIssue({
          key: result.issueKey,
          url: result.issueUrl,
        });
      } else {
        setConnectionStatus({
          success: false,
          message: result.error || 'Failed to create issue',
        });
      }
    } catch (error: any) {
      setConnectionStatus({
        success: false,
        message: error.message || 'Failed to create Jira issue',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCreatedIssue(null);
    setConnectionStatus(null);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <Bug size={20} />
          <Text fw={600}>Create Jira Defect</Text>
        </Group>
      }
      size="lg"
    >
      <Stack gap="md">
        {testingConnection && (
          <Alert icon={<Loader size={16} />} color="blue">
            Testing Jira connection...
          </Alert>
        )}

        {connectionStatus && !testingConnection && (
          <Alert
            icon={connectionStatus.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
            color={connectionStatus.success ? 'green' : 'red'}
          >
            {connectionStatus.message}
          </Alert>
        )}

        {createdIssue ? (
          <Stack gap="md">
            <Alert color="green" icon={<CheckCircle size={16} />}>
              <Text fw={600}>Issue Created Successfully!</Text>
              <Text size="sm" mt="xs">
                Issue Key: <strong>{createdIssue.key}</strong>
              </Text>
              {createdIssue.url && (
                <Button
                  component="a"
                  href={createdIssue.url}
                  target="_blank"
                  variant="light"
                  mt="sm"
                  fullWidth
                >
                  Open in Jira
                </Button>
              )}
            </Alert>
            <Button onClick={handleClose} fullWidth>
              Close
            </Button>
          </Stack>
        ) : (
          <>
            <Select
              label="Issue Type"
              value={issueType}
              onChange={(value) => setIssueType(value || 'Bug')}
              data={['Bug', 'Task', 'Story']}
            />

            <TextInput
              label="Summary"
              placeholder="Enter issue summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              required
            />

            <Textarea
              label="Description"
              placeholder="Enter issue description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              minRows={10}
              autosize
            />

            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleCreate} loading={loading} disabled={!summary.trim()}>
                Create Issue
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
};

export default JiraCreateDefectModal;

