import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Edit, FileText, Plus, Code2, TestTube, Eye, Trash2, Grid3x3, List, ChevronDown, ChevronRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatDate, formatDateWithTooltip } from '../utils/formatDate';
import { ipc } from '../ipc';
import { getBackend } from '../ipc-backend';
import { useWorkspaceStore } from '../store/workspace-store';
import { TestSummary } from '../../../types/v1.5';
import RunModal from './RunModal';
import { TableColumn, SortDirection } from './Table';
import FilterChip from './FilterChip';
import EmptyState from './EmptyState';
import Skeleton from './Skeleton';
import Button from './Button';
import { notifications } from '../utils/notifications';
import './TestLibrary.css';

const TestLibrary: React.FC = () => {
  const navigate = useNavigate();
  const { workspacePath, setCurrentTest } = useWorkspaceStore();
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<'none' | 'module' | 'status' | 'date'>('none');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [runModalOpened, setRunModalOpened] = useState(false);
  const [selectedTest, setSelectedTest] = useState<TestSummary | null>(null);
  const [testsWithTraces, setTestsWithTraces] = useState<Set<string>>(new Set());
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    loadTests();
  }, [workspacePath]);

  // Listen for test status updates
  useEffect(() => {
    const backend = getBackend();
    if (!backend?.onTestUpdate) return;

    const handleTestUpdate = (data: { workspacePath: string; testName: string; status: 'passed' | 'failed'; lastRunAt: string; lastRunId: string }) => {
      // Only refresh if the update is for the current workspace
      if (data.workspacePath === workspacePath) {
        loadTests();
      }
    };

    backend.onTestUpdate(handleTestUpdate);

    return () => {
      if (backend?.removeTestUpdateListener) {
        backend.removeTestUpdateListener();
      }
    };
  }, [workspacePath]);

  const loadTests = async () => {
    if (!workspacePath) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await ipc.workspace.testsList({ workspacePath });
      if (response.success && response.tests) {
        setTests(response.tests);
        
        // Load runs to check which tests have traces
        const runsResponse = await ipc.runs.list({ workspacePath });
        if (runsResponse.success && runsResponse.runs) {
          const testsWithTracesSet = new Set<string>();
          runsResponse.runs.forEach(run => {
            if (run.tracePaths && run.tracePaths.length > 0) {
              testsWithTracesSet.add(run.testName);
            }
          });
          setTestsWithTraces(testsWithTracesSet);
        }
      }
    } catch (error) {
      console.error('Failed to load tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunClick = (test: TestSummary) => {
    setSelectedTest(test);
    setRunModalOpened(true);
  };

  const handleRun = async (mode: 'local' | 'browserstack', target?: string, selectedDataIndices?: number[]) => {
    if (!selectedTest || !workspacePath) return;
    try {
      // Load data rows to get IDs for selected indices
      let datasetFilterIds: string[] | undefined;
      if (selectedDataIndices && selectedDataIndices.length > 0) {
        const dataResponse = await ipc.data.read({ workspacePath, testName: selectedTest.testName });
        if (dataResponse.success && dataResponse.rows) {
          const enabledRows = dataResponse.rows.filter((row: any) => row.enabled !== false);
          datasetFilterIds = selectedDataIndices
            .map(index => enabledRows[index]?.id)
            .filter((id): id is string => !!id);
        }
      }

      await ipc.test.run({
        workspacePath,
        specPath: selectedTest.specPath,
        runMode: mode,
        target,
        datasetFilterIds, // Pass selected data row IDs
      });
      navigate(`/runs/${selectedTest.testName}`);
    } catch (error) {
      console.error('Failed to run test:', error);
    }
  };

  const handleEditData = (test: TestSummary) => {
    setCurrentTest(test.testName);
    navigate(`/tests/${test.testName}`, { state: { initialTab: 'data' } });
  };

  const handleOpenTrace = (test: TestSummary) => {
    navigate(`/tests/${test.testName}`, { state: { initialTab: 'runs' } });
  };

  const handleViewTest = (test: TestSummary) => {
    navigate(`/tests/${test.testName}`);
  };

  const handleRowSelect = useCallback((testName: string, selected: boolean) => {
    setSelectedTests(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(testName);
      } else {
        next.delete(testName);
      }
      return next;
    });
  }, []);

  const handleSort = useCallback((column: string, direction: SortDirection) => {
    setSortColumn(column);
    setSortDirection(direction);
  }, []);

  const toggleRowExpansion = (testName: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(testName)) {
        next.delete(testName);
      } else {
        next.add(testName);
      }
      return next;
    });
  };

  // Filter and sort tests
  const filteredAndSortedTests = useMemo(() => {
    let result = tests.filter(test => {
      const matchesSearch = !debouncedSearchQuery || test.testName.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      const matchesModule = !moduleFilter || test.module === moduleFilter;
      const matchesStatus = !statusFilter || test.lastStatus === statusFilter;
      return matchesSearch && matchesModule && matchesStatus;
    });

    // Sort
    if (sortColumn && sortDirection) {
      result = [...result].sort((a, b) => {
        let aVal: any = a[sortColumn];
        let bVal: any = b[sortColumn];
        
        if (sortColumn === 'lastRunAt') {
          aVal = aVal ? new Date(aVal).getTime() : 0;
          bVal = bVal ? new Date(bVal).getTime() : 0;
        }
        
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [tests, debouncedSearchQuery, moduleFilter, statusFilter, sortColumn, sortDirection]);

  // Group tests
  const groupedTests = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Tests': filteredAndSortedTests };
    }

    const groups: Record<string, TestSummary[]> = {};
    filteredAndSortedTests.forEach(test => {
      let key = 'Other';
      if (groupBy === 'module') {
        key = test.module || 'No Module';
      } else if (groupBy === 'status') {
        key = test.lastStatus || 'never_run';
      } else if (groupBy === 'date') {
        if (test.lastRunAt) {
          const date = new Date(test.lastRunAt);
          const today = new Date();
          const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === 0) key = 'Today';
          else if (diffDays === 1) key = 'Yesterday';
          else if (diffDays < 7) key = 'This Week';
          else if (diffDays < 30) key = 'This Month';
          else key = 'Older';
        } else {
          key = 'Never Run';
        }
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(test);
    });

    return groups;
  }, [filteredAndSortedTests, groupBy]);

  const modules = Array.from(new Set(tests.map(t => t.module).filter(Boolean)));
  
  const statusCounts = useMemo(() => {
    const counts = { all: filteredAndSortedTests.length, passed: 0, failed: 0, never_run: 0 };
    filteredAndSortedTests.forEach(test => {
      if (test.lastStatus === 'passed') counts.passed++;
      else if (test.lastStatus === 'failed') counts.failed++;
      else counts.never_run++;
    });
    return counts;
  }, [filteredAndSortedTests]);

  const tableColumns: TableColumn<TestSummary>[] = [
    {
      key: 'testName',
      label: 'Test Name',
      sortable: true,
      render: (_, test) => (
        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost btn-xs"
            onClick={(e) => {
              e.stopPropagation();
              toggleRowExpansion(test.testName);
            }}
            aria-label={expandedRows.has(test.testName) ? 'Collapse' : 'Expand'}
          >
            {expandedRows.has(test.testName) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          <span className="font-medium">{test.testName}</span>
        </div>
      ),
    },
    {
      key: 'module',
      label: 'Module',
      sortable: true,
      render: (value) => value ? <span className="badge badge-info badge-sm">{value}</span> : <span className="text-base-content/40">-</span>,
    },
    {
      key: 'lastStatus',
      label: 'Status',
      sortable: true,
      render: (_, test) => <StatusBadge status={test.lastStatus} size="sm" showIcon />,
    },
    {
      key: 'datasetCount',
      label: 'Datasets',
      sortable: true,
      align: 'center',
    },
    {
      key: 'lastRunAt',
      label: 'Last Modified',
      sortable: true,
      render: (value) => {
        const { display, tooltip } = formatDateWithTooltip(value);
        return (
          <span title={tooltip} className="text-sm text-base-content/70">
            {display}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, test) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="tertiary"
            size="sm"
            icon={Play}
            tooltip="Run"
            onClick={() => handleRunClick(test)}
          />
          <Button
            variant="tertiary"
            size="sm"
            icon={Eye}
            tooltip="View"
            onClick={() => handleViewTest(test)}
          />
          <Button
            variant="tertiary"
            size="sm"
            icon={Edit}
            tooltip="Edit"
            onClick={() => handleEditData(test)}
          />
          <Button
            variant="tertiary"
            size="sm"
            icon={FileText}
            tooltip="View Code"
            onClick={() => navigate(`/tests/${test.testName}`, { state: { initialTab: 'code' } })}
          />
          {testsWithTraces.has(test.testName) && (
            <Button
              variant="tertiary"
              size="sm"
              icon={TestTube}
              tooltip="Debug Trace"
              onClick={() => handleOpenTrace(test)}
            />
          )}
        </div>
      ),
    },
  ];

  const handleBulkAction = async (action: 'run' | 'delete' | 'export') => {
    if (selectedTests.size === 0) return;
    
    if (action === 'delete') {
      if (confirm(`Delete ${selectedTests.size} test(s)?`)) {
        notifications.show({
          message: `Deleting ${selectedTests.size} test(s)...`,
          color: 'info',
        });
        // Implement delete logic
      }
    } else if (action === 'export') {
      notifications.show({
        message: `Exporting ${selectedTests.size} test(s)...`,
        color: 'info',
      });
      // Implement export logic
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton variant="card" count={4} height={200} />
      </div>
    );
  }

  const activeFiltersCount = [statusFilter, moduleFilter, debouncedSearchQuery].filter(Boolean).length;

  return (
    <div className="test-library max-w-[1400px] mx-auto p-6">
      {/* Enhanced Filters Bar with Filter Chips */}
      <div className="glass-card mb-6">
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <input
              type="text"
              placeholder="Search tests..."
              className="input input-bordered flex-1 min-w-[250px] bg-base-100"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              className="select select-bordered bg-base-100"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
            >
              <option value="none">Group by: None</option>
              <option value="module">Group by: Module</option>
              <option value="status">Group by: Status</option>
              <option value="date">Group by: Date</option>
            </select>
            <div className="flex gap-2">
              <button
                className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setViewMode('table')}
              >
                <List size={16} />
                Table
              </button>
              <button
                className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 size={16} />
                Grid
              </button>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2">
            <FilterChip
              label="All Tests"
              active={!statusFilter}
              count={statusCounts.all}
              onToggle={() => setStatusFilter(null)}
            />
            <FilterChip
              label="Passed"
              active={statusFilter === 'passed'}
              count={statusCounts.passed}
              onToggle={() => setStatusFilter(statusFilter === 'passed' ? null : 'passed')}
            />
            <FilterChip
              label="Failed"
              active={statusFilter === 'failed'}
              count={statusCounts.failed}
              onToggle={() => setStatusFilter(statusFilter === 'failed' ? null : 'failed')}
            />
            <FilterChip
              label="Never Run"
              active={statusFilter === 'never_run'}
              count={statusCounts.never_run}
              onToggle={() => setStatusFilter(statusFilter === 'never_run' ? null : 'never_run')}
            />
            {modules.map(module => (
              <FilterChip
                key={module}
                label={module}
                active={moduleFilter === module}
                onToggle={() => setModuleFilter(moduleFilter === module ? null : module)}
                removable
                onRemove={() => setModuleFilter(null)}
              />
            ))}
            {activeFiltersCount > 0 && (
              <span className="text-xs text-base-content/60 self-center">
                {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} applied
              </span>
            )}
          </div>

          <div className="mt-3 text-sm text-base-content/60">
            Showing {filteredAndSortedTests.length} of {tests.length} tests
          </div>
        </div>
      </div>

      {/* Batch Action Toolbar */}
      {selectedTests.size > 0 && (
        <div className="glass-card mb-4 p-3 flex items-center justify-between">
          <span className="text-sm font-medium">
            {selectedTests.size} test{selectedTests.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => handleBulkAction('run')}>
              <Play size={14} />
              Run Selected
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleBulkAction('export')}>
              Export
            </Button>
            <Button variant="danger" size="sm" onClick={() => handleBulkAction('delete')}>
              <Trash2 size={14} />
              Delete
            </Button>
            <Button variant="tertiary" size="sm" onClick={() => setSelectedTests(new Set())}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {filteredAndSortedTests.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No tests found"
          description={activeFiltersCount > 0 ? 'Try adjusting your filters' : 'Record a new test to get started'}
          actionLabel={activeFiltersCount === 0 ? 'Record Your First Test' : undefined}
          onAction={activeFiltersCount === 0 ? () => navigate('/record') : undefined}
        />
      ) : viewMode === 'table' ? (
        Object.entries(groupedTests).map(([groupName, groupTests]) => (
          <div key={groupName} className="mb-6">
            {groupBy !== 'none' && (
              <h3 className="text-lg font-semibold mb-3">{groupName}</h3>
            )}
            <div className="glass-card">
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th className="w-12">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={groupTests.length > 0 && groupTests.every(t => selectedTests.has(t.testName))}
                          onChange={(e) => {
                            groupTests.forEach(test => {
                              handleRowSelect(test.testName, e.target.checked);
                            });
                          }}
                        />
                      </th>
                      {tableColumns.map((column) => (
                        <th
                          key={column.key}
                          className={column.sortable ? 'cursor-pointer select-none' : ''}
                          onClick={() => column.sortable && handleSort(column.key, sortColumn === column.key && sortDirection === 'asc' ? 'desc' : 'asc')}
                        >
                          <div className="flex items-center gap-2">
                            <span>{column.label}</span>
                            {column.sortable && sortColumn === column.key && (
                              <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {groupTests.map((test, idx) => {
                      const isExpanded = expandedRows.has(test.testName);
                      const borderColor = test.lastStatus === 'passed' ? 'border-l-[#2B8A3E]' :
                                         test.lastStatus === 'failed' ? 'border-l-[#C92A2A]' :
                                         'border-l-transparent';
                      return (
                        <React.Fragment key={test.testName}>
                          <tr
                            className={`hover:bg-base-300 cursor-pointer ${idx % 2 === 0 ? 'bg-base-200/50' : ''} border-l-4 ${borderColor}`}
                            onClick={() => toggleRowExpansion(test.testName)}
                          >
                            <td onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                className="checkbox checkbox-sm"
                                checked={selectedTests.has(test.testName)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleRowSelect(test.testName, e.target.checked);
                                }}
                              />
                            </td>
                            {tableColumns.map((column) => (
                              <td key={column.key} style={{ textAlign: column.align }}>
                                {column.render
                                  ? column.render(test[column.key], test)
                                  : test[column.key]?.toString() || '-'}
                              </td>
                            ))}
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={tableColumns.length + 1} className="p-4 bg-base-300">
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <div className="text-sm font-medium mb-2">Test Description</div>
                                    <div className="text-sm text-base-content/70">{test.module || 'No description'}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium mb-2">Quick Stats</div>
                                    <div className="text-sm text-base-content/70">
                                      {test.datasetCount} datasets
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button variant="primary" size="sm" onClick={() => handleRunClick(test)}>
                                    <Play size={14} />
                                    Quick Run
                                  </Button>
                                  <Button variant="secondary" size="sm" onClick={() => handleViewTest(test)}>
                                    View Full History
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAndSortedTests.map((test) => (
            <div
              key={test.testName}
              className={`glass-card cursor-pointer border-l-4 ${
                test.lastStatus === 'passed' ? 'border-l-[#2B8A3E]' :
                test.lastStatus === 'failed' ? 'border-l-[#C92A2A]' :
                'border-l-transparent'
              }`}
              onClick={() => handleViewTest(test)}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold mb-2 truncate">{test.testName}</h3>
                    {test.module && (
                      <span className="badge badge-info badge-sm mb-2">{test.module}</span>
                    )}
                  </div>
                  <StatusBadge status={test.lastStatus} size="sm" showIcon />
                </div>
                <div className="text-sm text-base-content/60 mb-4 space-y-1">
                  <div>Datasets: <span className="font-medium">{test.datasetCount}</span></div>
                  <div>Last run: {test.lastRunAt ? formatDate(test.lastRunAt) : 'Never run'}</div>
                </div>
                <div className="flex gap-2 mt-auto">
                  <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); handleRunClick(test); }}>
                    <Play size={14} />
                    Run
                  </Button>
                  <Button variant="tertiary" size="sm" icon={Eye} tooltip="View" onClick={(e) => { e.stopPropagation(); handleViewTest(test); }} />
                  <Button variant="tertiary" size="sm" icon={Edit} tooltip="Edit" onClick={(e) => { e.stopPropagation(); handleEditData(test); }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <RunModal
        opened={runModalOpened}
        onClose={() => {
          setRunModalOpened(false);
          setSelectedTest(null);
        }}
        onRun={handleRun}
        testName={selectedTest?.testName}
        workspacePath={workspacePath}
      />
    </div>
  );
};

export default TestLibrary;
