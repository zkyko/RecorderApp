import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Text,
  Table,
  Group,
  Badge,
  Button,
  TextInput,
  Select,
  Loader,
  Center,
  Chip,
  Breadcrumbs,
  Anchor,
} from '@mantine/core';
import { Crosshair, Search, Eye } from 'lucide-react';
import { ipc } from '../ipc';
import { useWorkspaceStore } from '../store/workspace-store';
import { LocatorIndexEntry } from '../../../types/v1.5';
import './LocatorsScreen.css';

const LocatorsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { workspacePath } = useWorkspaceStore();
  const [locators, setLocators] = useState<LocatorIndexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  useEffect(() => {
    if (workspacePath) {
      loadLocators();
    }
  }, [workspacePath]);

  const loadLocators = async () => {
    if (!workspacePath) return;

    setLoading(true);
    try {
      const response = await ipc.workspace.locatorsList({ workspacePath });
      if (response.success && response.locators) {
        setLocators(response.locators);
      }
    } catch (error) {
      console.error('Failed to load locators:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLocators = locators.filter(loc => {
    const matchesSearch = !searchQuery || 
      loc.locator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.usedInTests.some(test => test.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = !typeFilter || loc.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const types = Array.from(new Set(locators.map(l => l.type)));

  const handleViewInTest = (locator: LocatorIndexEntry) => {
    if (locator.usedInTests.length > 0) {
      navigate(`/tests/${locator.usedInTests[0]}`, { state: { initialTab: 'locators', highlightLocator: locator.locator } });
    }
  };

  if (loading) {
    return (
      <Center h="100%">
        <Loader size="lg" />
      </Center>
    );
  }

  const breadcrumbs = [
    { title: 'Dashboard', href: '/' },
    { title: 'Locators' },
  ].map((item, index) => (
    <Anchor
      key={index}
      href={item.href}
      onClick={(e) => {
        e.preventDefault();
        if (item.href) navigate(item.href);
      }}
    >
      {item.title}
    </Anchor>
  ));

  return (
    <div className="locators-screen">
      <Breadcrumbs mb="md">{breadcrumbs}</Breadcrumbs>

      <Card padding="lg" radius="md" withBorder mb="md">
        <Group justify="space-between" mb="md">
          <div>
            <Text size="xl" fw={700} mb="xs">Global Locators</Text>
            <Text size="sm" c="dimmed">
              View all locators used across all tests in your workspace
            </Text>
          </div>
        </Group>

        <Group gap="md" mb="md">
          <TextInput
            placeholder="Search locators or tests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftSection={<Search size={16} />}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="All Types"
            data={types.map(t => ({ value: t, label: t }))}
            value={typeFilter}
            onChange={setTypeFilter}
            clearable
            style={{ width: 150 }}
          />
        </Group>
      </Card>

      {filteredLocators.length === 0 ? (
        <Card padding="xl" radius="md" withBorder>
          <Center>
            <div style={{ textAlign: 'center' }}>
              <Text size="4rem" mb="md">🎯</Text>
              <Text size="xl" fw={600} mb="xs">No locators found</Text>
              <Text c="dimmed">
                {searchQuery || typeFilter
                  ? 'Try adjusting your filters'
                  : 'Record tests to see locators here'}
              </Text>
            </div>
          </Center>
        </Card>
      ) : (
        <Card padding="lg" radius="md" withBorder>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Locator Snippet</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Test Count</Table.Th>
                <Table.Th>Used in Tests</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredLocators.map((locator, index) => (
                <Table.Tr key={index}>
                  <Table.Td>
                    <Text size="sm" ff="monospace" style={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {locator.locator}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light">{locator.type}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={500}>{locator.testCount}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      {locator.usedInTests.slice(0, 3).map(test => (
                        <Chip key={test} size="xs" variant="light">
                          {test}
                        </Chip>
                      ))}
                      {locator.usedInTests.length > 3 && (
                        <Chip size="xs" variant="light">
                          +{locator.usedInTests.length - 3}
                        </Chip>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<Eye size={14} />}
                      onClick={() => handleViewInTest(locator)}
                    >
                      View in Test
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default LocatorsScreen;

