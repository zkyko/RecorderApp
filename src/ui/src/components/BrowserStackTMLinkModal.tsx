import React, { useState, useEffect } from 'react';
import {
  Modal,
  Text,
  Button,
  Group,
  Stack,
  TextInput,
  Loader,
  Alert,
  Table,
  Badge,
  ScrollArea,
  Pagination,
} from '@mantine/core';
import { Cloud, Search, Link2, ExternalLink, RefreshCw } from 'lucide-react';
import { ipc } from '../ipc';

interface BrowserStackTMLinkModalProps {
  opened: boolean;
  onClose: () => void;
  onLink: (testCaseId: string, testCaseUrl: string) => Promise<void>;
  currentTestCaseId?: string;
  workspacePath: string;
  testName: string;
}

const BrowserStackTMLinkModal: React.FC<BrowserStackTMLinkModalProps> = ({
  opened,
  onClose,
  onLink,
  currentTestCaseId,
  workspacePath: _workspacePath,
  testName,
}) => {
  const [testCases, setTestCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTestCase, setSelectedTestCase] = useState<string | null>(currentTestCaseId || null);
  const [linking, setLinking] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(30);

  useEffect(() => {
    if (opened) {
      loadTestCases(1);
      setSelectedTestCase(currentTestCaseId || null);
    }
  }, [opened, currentTestCaseId]);

  const loadTestCases = async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const result = await ipc.browserstackTm.listTestCases({
        page,
        pageSize,
      });

      if (result.success && result.testCases) {
        setTestCases(result.testCases);
        setTotal(result.total || 0);
        setCurrentPage(page);
      } else {
        setError(result.error || 'Failed to load test cases');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load BrowserStack TM test cases');
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async () => {
    if (!selectedTestCase) return;

    const testCase = testCases.find(tc => tc.id === selectedTestCase || tc.identifier === selectedTestCase);
    if (!testCase) return;

    setLinking(true);
    try {
      await onLink(testCase.identifier || testCase.id, testCase.url);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to link test case');
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async () => {
    setLinking(true);
    try {
      // Unlink by passing empty values
      await onLink('', '');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to unlink test case');
    } finally {
      setLinking(false);
    }
  };

  const filteredTestCases = testCases.filter(tc => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      tc.name?.toLowerCase().includes(query) ||
      tc.identifier?.toLowerCase().includes(query) ||
      tc.description?.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(total / pageSize);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Cloud size={20} />
          <Text fw={600}>Link BrowserStack TM Test Case</Text>
        </Group>
      }
      size="xl"
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Link a BrowserStack TM test case to: <strong>{testName}</strong>
        </Text>

        {currentTestCaseId && (
          <Alert color="blue" icon={<Link2 size={16} />}>
            Currently linked to: <strong>{currentTestCaseId}</strong>
          </Alert>
        )}

        <Group>
          <TextInput
            placeholder="Search test cases..."
            leftSection={<Search size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1 }}
          />
          <Button
            variant="light"
            leftSection={<RefreshCw size={16} />}
            onClick={() => loadTestCases(currentPage)}
            loading={loading}
          >
            Refresh
          </Button>
        </Group>

        {error && (
          <Alert color="red" icon={<Cloud size={16} />}>
            {error}
          </Alert>
        )}

        {loading && testCases.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Loader size="lg" />
          </div>
        ) : (
          <ScrollArea style={{ height: 400 }}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: '50px' }}>Select</Table.Th>
                  <Table.Th>Identifier</Table.Th>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredTestCases.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                      <Text c="dimmed">No test cases found</Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  filteredTestCases.map((testCase) => {
                    const isSelected = selectedTestCase === (testCase.identifier || testCase.id);
                    return (
                      <Table.Tr
                        key={testCase.id}
                        style={{
                          backgroundColor: isSelected ? 'var(--mantine-color-blue-0)' : undefined,
                          cursor: 'pointer',
                        }}
                        onClick={() => setSelectedTestCase(testCase.identifier || testCase.id)}
                      >
                        <Table.Td>
                          <input
                            type="radio"
                            checked={isSelected}
                            onChange={() => setSelectedTestCase(testCase.identifier || testCase.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </Table.Td>
                        <Table.Td>
                          <Text fw={600} size="sm">
                            {testCase.identifier}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" lineClamp={2}>
                            {testCase.name}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={
                              testCase.status?.toLowerCase() === 'active'
                                ? 'green'
                                : testCase.status?.toLowerCase() === 'draft'
                                ? 'yellow'
                                : 'gray'
                            }
                            size="sm"
                          >
                            {testCase.status || 'N/A'}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Button
                            size="xs"
                            variant="subtle"
                            leftSection={<ExternalLink size={14} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(testCase.url, '_blank');
                            }}
                          >
                            Open
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        )}

        {totalPages > 1 && (
          <Group justify="center">
            <Pagination
              value={currentPage}
              onChange={loadTestCases}
              total={totalPages}
            />
          </Group>
        )}

        <Group justify="space-between" mt="md">
          <Button
            variant="subtle"
            color="red"
            onClick={handleUnlink}
            disabled={!currentTestCaseId || linking}
            loading={linking}
          >
            Unlink
          </Button>
          <Group>
            <Button variant="subtle" onClick={onClose} disabled={linking}>
              Cancel
            </Button>
            <Button
              leftSection={<Link2 size={16} />}
              onClick={handleLink}
              disabled={!selectedTestCase || linking || selectedTestCase === currentTestCaseId}
              loading={linking}
            >
              Link Test Case
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
};

export default BrowserStackTMLinkModal;

