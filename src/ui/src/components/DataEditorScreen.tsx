import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Table, Button, Group, Text, TextInput, Checkbox, Loader, Center, Alert } from '@mantine/core';
import { Save, Plus, Trash2, ArrowLeft, Play } from 'lucide-react';
import { ipc } from '../ipc';
import { useWorkspaceStore } from '../store/workspace-store';
import { DataRow } from '../../../types/v1.5';
import './DataEditorScreen.css';

const DataEditorScreen: React.FC = () => {
  const { testName } = useParams<{ testName: string }>();
  const navigate = useNavigate();
  const { workspacePath } = useWorkspaceStore();
  const [rows, setRows] = useState<DataRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (testName && workspacePath) {
      loadData();
    }
  }, [testName, workspacePath]);

  const loadData = async () => {
    if (!testName || !workspacePath) return;

    setLoading(true);
    try {
      // Use ipc.data.read which correctly resolves workspace-relative data path
      const response = await ipc.data.read({ workspacePath, testName });
      const data = response.success && response.rows ? response.rows : [];
      
      if (data.length > 0) {
        setRows(data);
        // Extract parameter columns (exclude id, enabled, name)
        const paramColumns = Object.keys(data[0]).filter(k => k !== 'id' && k !== 'enabled' && k !== 'name');
        setColumns(paramColumns);
      } else {
        // No data file exists - create default row
        // Try to detect parameters from spec file to pre-populate columns
        try {
          const specResponse = await ipc.test.getSpec({ workspacePath, testName });
          if (specResponse.success && specResponse.content) {
            // Extract parameter names from spec (look for row.parameterName patterns)
            const paramPattern = /row\.([a-zA-Z_][a-zA-Z0-9_]*)/g;
            const matches = specResponse.content.matchAll(paramPattern);
            const detectedParams = new Set<string>();
            for (const match of matches) {
              detectedParams.add(match[1]);
            }
            
            if (detectedParams.size > 0) {
              // Create initial row with parameter columns
              const defaultRow: DataRow = {
                id: '1',
                enabled: true,
                name: 'Default',
              };
              // Add empty values for each parameter
              Array.from(detectedParams).forEach(param => {
                defaultRow[param] = '';
              });
              setRows([defaultRow]);
              setColumns(Array.from(detectedParams));
            } else {
              // No parameters detected
              const defaultRow: DataRow = {
                id: '1',
                enabled: true,
                name: 'Default',
              };
              setRows([defaultRow]);
              setColumns([]);
            }
          } else {
            // Can't load spec, just create default
            const defaultRow: DataRow = {
              id: '1',
              enabled: true,
              name: 'Default',
            };
            setRows([defaultRow]);
            setColumns([]);
          }
        } catch (specError) {
          // Fallback: just create default row
          const defaultRow: DataRow = {
            id: '1',
            enabled: true,
            name: 'Default',
          };
          setRows([defaultRow]);
          setColumns([]);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      // Fallback: create default row
      const defaultRow: DataRow = {
        id: '1',
        enabled: true,
        name: 'Default',
      };
      setRows([defaultRow]);
      setColumns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!testName || !workspacePath) return;

    setSaving(true);
    try {
      const response = await ipc.data.write({
        workspacePath,
        testName,
        rows,
      });

      if (response.success) {
        // Show success message
        alert('Data saved successfully');
      } else {
        alert(`Failed to save: ${response.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddRow = () => {
    const newRow: DataRow = {
      id: Date.now().toString(),
      enabled: true,
      name: `Row ${rows.length + 1}`,
    };
    setRows([...rows, newRow]);
  };

  const handleDeleteRow = (id: string) => {
    setRows(rows.filter(r => r.id !== id));
  };

  const handleCellChange = (rowId: string, key: string, value: any) => {
    setRows(rows.map(row => 
      row.id === rowId ? { ...row, [key]: value } : row
    ));
  };

  const handleRunTest = async () => {
    if (!testName || !workspacePath) return;

    setRunning(true);
    try {
      // First, save the data with current values
      const saveResponse = await ipc.data.write({
        workspacePath,
        testName,
        rows,
      });

      if (!saveResponse.success) {
        alert(`Failed to save data: ${saveResponse.error}`);
        return;
      }

      // Get the spec file path for this test
      const specPath = `tests/${testName}.spec.ts`;
      
      // Run the test
      const runResponse = await ipc.test.run({
        workspacePath,
        specPath,
        runMode: 'local',
      });

      if (runResponse.runId) {
        // Navigate to run screen to see output.
        // RunScreen currently expects the route param to be the test name,
        // and it will start the test run itself, streaming logs live.
        // Using testName here keeps that behavior consistent.
        navigate(`/runs/${testName}`);
      } else {
        // Fallback: navigate to test details page
        navigate(`/tests/${testName}`, { state: { initialTab: 'runs' } });
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <Center h="100%">
        <Loader size="lg" />
      </Center>
    );
  }

  const allColumns = ['enabled', 'name', ...columns];

  return (
    <div className="data-editor-screen">
      <Card padding="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <div>
            <Text size="lg" fw={600}>Data Editor</Text>
            <Text size="sm" c="dimmed">Test: {testName}</Text>
          </div>
          <Group gap="xs">
            <Button
              leftSection={<ArrowLeft size={16} />}
              variant="subtle"
              onClick={() => navigate('/library')}
            >
              Back
            </Button>
            <Button
              leftSection={<Plus size={16} />}
              variant="light"
              onClick={handleAddRow}
            >
              Add Row
            </Button>
            <Button
              leftSection={<Save size={16} />}
              onClick={handleSave}
              loading={saving}
              variant="light"
            >
              Save Changes
            </Button>
            <Button
              leftSection={<Play size={16} />}
              onClick={handleRunTest}
              loading={running}
              disabled={running || rows.length === 0}
              color="green"
            >
              Run Test
            </Button>
          </Group>
        </Group>

        {rows.length === 0 ? (
          <Alert color="blue" title="No data rows">
            <Text size="sm" mb="md">No data rows yet. Add your first row to get started.</Text>
            <Button leftSection={<Plus size={16} />} onClick={handleAddRow}>
              Add Row
            </Button>
          </Alert>
        ) : (
          <div className="data-grid">
            <Table>
              <Table.Thead>
                <Table.Tr>
                  {allColumns.map(col => (
                    <Table.Th key={col}>{col}</Table.Th>
                  ))}
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((row) => (
                  <Table.Tr key={row.id}>
                    {allColumns.map(col => (
                      <Table.Td key={col}>
                        {col === 'enabled' ? (
                          <Checkbox
                            checked={row.enabled}
                            onChange={(e) => handleCellChange(row.id, col, e.currentTarget.checked)}
                          />
                        ) : (
                          <TextInput
                            value={row[col] || ''}
                            onChange={(e) => handleCellChange(row.id, col, e.target.value)}
                            size="xs"
                          />
                        )}
                      </Table.Td>
                    ))}
                    <Table.Td>
                      <Button
                        size="xs"
                        variant="subtle"
                        color="red"
                        leftSection={<Trash2 size={14} />}
                        onClick={() => handleDeleteRow(row.id)}
                      >
                        Delete
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default DataEditorScreen;
