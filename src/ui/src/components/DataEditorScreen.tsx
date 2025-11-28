import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Table, Button, Group, Text, TextInput, Checkbox, Loader, Center, Alert } from '@mantine/core';
import { Save, Plus, Trash2, ArrowLeft } from 'lucide-react';
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

  useEffect(() => {
    if (testName && workspacePath) {
      loadData();
    }
  }, [testName, workspacePath]);

  const loadData = async () => {
    if (!testName || !workspacePath) return;

    setLoading(true);
    try {
      const dataPath = `data/${testName}.json`;
      const response = await window.electronAPI?.loadTestData(dataPath);
      const data = response?.success && response.data ? response.data : [];
      if (data.length > 0) {
        setRows(data);
        setColumns(Object.keys(data[0]).filter(k => k !== 'id' && k !== 'enabled' && k !== 'name'));
      } else {
        const defaultRow: DataRow = {
          id: '1',
          enabled: true,
          name: 'Default',
        };
        setRows([defaultRow]);
        setColumns([]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
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
            >
              Save Changes
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
