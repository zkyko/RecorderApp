import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, FileText, Eye, Filter, Play, Cloud, Bug, RotateCcw, Download, Trash2, ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import { ipc } from '../ipc';
import { useWorkspaceStore } from '../store/workspace-store';
import { TestRunMeta, TestSummary } from '../../../types/v1.5';
import RunModal from './RunModal';
import FilterChip from './FilterChip';
import StatusBadge from './StatusBadge';
import Button from './Button';
import EmptyState from './EmptyState';
import Skeleton from './Skeleton';
import ExportButton from './ExportButton';
import { formatDate, formatDateWithTooltip } from '../utils/formatDate';
import { formatTestRunsForExport } from '../utils/exportUtils';
import { notifications } from '../utils/notifications';
import './RunsScreen.css';

const RunsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { workspacePath } = useWorkspaceStore();
  const [runs, setRuns] = useState<TestRunMeta[]>([]);
  const [allRuns, setAllRuns] = useState<TestRunMeta[]>([]);
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<string | null>(null);
  const [runModalOpened, setRunModalOpened] = useState(false);
  const [multiTestModalOpened, setMultiTestModalOpened] = useState(false);
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [selectedRuns, setSelectedRuns] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [multiTestRunMode, setMultiTestRunMode] = useState<'local' | 'browserstack'>('local');

  useEffect(() => {
    if (workspacePath) {
      loadRuns();
      loadTests();
    }
  }, [workspacePath]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    applyFilters();
  }, [debouncedSearchQuery, statusFilter, sourceFilter, dateRange, allRuns]);

  const loadRuns = async () => {
    if (!workspacePath) return;
    
    setLoading(true);
    try {
      const response = await ipc.runs.list({ workspacePath });
      if (response.success && response.runs) {
        setAllRuns(response.runs);
        setRuns(response.runs);
      }
    } catch (error) {
      console.error('Failed to load runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTests = async () => {
    if (!workspacePath) return;
    try {
      const response = await ipc.workspace.testsList({ workspacePath });
      if (response.success && response.tests) {
        setTests(response.tests);
      }
    } catch (error) {
      console.error('Failed to load tests:', error);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...allRuns];

    // Search filter
    if (debouncedSearchQuery) {
      filtered = filtered.filter(run =>
        run.testName.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(run => run.status === statusFilter);
    }

    // Source filter
    if (sourceFilter) {
      filtered = filtered.filter(run => run.source === sourceFilter);
    }

    // Date range filter
    if (dateRange) {
      const now = new Date();
      let cutoffDate: Date;
      if (dateRange === 'today') {
        cutoffDate = new Date(now.setHours(0, 0, 0, 0));
      } else if (dateRange === '7d') {
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (dateRange === '30d') {
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else {
        cutoffDate = new Date(0);
      }
      filtered = filtered.filter(run => new Date(run.startedAt) >= cutoffDate);
    }

    setRuns(filtered);
  }, [debouncedSearchQuery, statusFilter, sourceFilter, dateRange, allRuns]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const toggleRowExpansion = (runId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(runId)) {
        next.delete(runId);
      } else {
        next.add(runId);
      }
      return next;
    });
  };

  const getDurationColor = (duration: number | null) => {
    if (duration === null) return 'text-base-content/40';
    if (duration < 30) return 'text-[#2B8A3E]';
    if (duration < 60) return 'text-[#E67700]';
    return 'text-[#C92A2A]';
  };

  const getDurationBadgeColor = (duration: number | null) => {
    if (duration === null) return 'badge-neutral';
    if (duration < 30) return 'badge-success';
    if (duration < 60) return 'badge-warning';
    return 'badge-error';
  };

  const activeFiltersCount = [statusFilter, sourceFilter, dateRange, debouncedSearchQuery].filter(Boolean).length;

  const statusCounts = useMemo(() => {
    const counts = { all: runs.length, passed: 0, failed: 0, running: 0 };
    runs.forEach(run => {
      if (run.status === 'passed') counts.passed++;
      else if (run.status === 'failed') counts.failed++;
      else if (run.status === 'running') counts.running++;
    });
    return counts;
  }, [runs]);

  const handleRunTest = async (testName: string, mode: 'local' | 'browserstack', target?: string) => {
    if (!workspacePath) return;
    try {
      await ipc.test.run({
        workspacePath,
        specPath: `tests/${testName}.spec.ts`,
        runMode: mode,
        target,
      });
      // Reload runs after a short delay
      setTimeout(() => loadRuns(), 1000);
    } catch (error) {
      console.error('Failed to run test:', error);
    }
  };

  const handleRunSelectedTests = async () => {
    if (!workspacePath || selectedTests.size === 0) return;
    try {
      for (const testName of selectedTests) {
        await ipc.test.run({
          workspacePath,
          specPath: `tests/${testName}.spec.ts`,
          runMode: multiTestRunMode,
        });
      }
      setMultiTestModalOpened(false);
      setSelectedTests(new Set());
      setTimeout(() => loadRuns(), 2000);
    } catch (error) {
      console.error('Failed to run tests:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'green';
      case 'failed': return 'red';
      case 'running': return 'blue';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton variant="card" count={5} height={80} />
      </div>
    );
  }

  return (
    <div className="runs-screen p-6">
      {/* Header and Filters */}
      <div className="glass-card mb-6">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Test Runs</h2>
            <div className="flex items-center gap-2">
              {runs.length > 0 && (
                <ExportButton
                  data={formatTestRunsForExport(runs)}
                  filename="test-runs"
                  formats={['markdown', 'json', 'csv']}
                  includeSystemInfo={true}
                  metadata={{
                    totalRuns: runs.length,
                    filteredRuns: runs.length,
                    allRuns: allRuns.length,
                  }}
                  variant="secondary"
                  size="sm"
                />
              )}
              <Button variant="primary" onClick={() => setMultiTestModalOpened(true)}>
                <Play size={16} />
                Run Tests
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by test name..."
              className="input input-bordered w-full bg-base-100"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2 mb-3">
            <FilterChip
              label="All Runs"
              active={!statusFilter && !sourceFilter && !dateRange}
              count={statusCounts.all}
              onToggle={() => {
                setStatusFilter(null);
                setSourceFilter(null);
                setDateRange(null);
              }}
            />
            <FilterChip
              label="Failed Today"
              active={statusFilter === 'failed' && dateRange === 'today'}
              count={runs.filter(r => r.status === 'failed' && new Date(r.startedAt).toDateString() === new Date().toDateString()).length}
              onToggle={() => {
                setStatusFilter(statusFilter === 'failed' && dateRange === 'today' ? null : 'failed');
                setDateRange(dateRange === 'today' ? null : 'today');
              }}
            />
            <FilterChip
              label="Slow Tests (>60s)"
              active={false}
              count={runs.filter(r => {
                const duration = r.finishedAt && r.startedAt
                  ? Math.round((new Date(r.finishedAt).getTime() - new Date(r.startedAt).getTime()) / 1000)
                  : null;
                return duration !== null && duration > 60;
              }).length}
              onToggle={() => {
                // Filter logic for slow tests
              }}
            />
            <FilterChip
              label="BrowserStack Runs"
              active={sourceFilter === 'browserstack'}
              count={runs.filter(r => r.source === 'browserstack').length}
              onToggle={() => setSourceFilter(sourceFilter === 'browserstack' ? null : 'browserstack')}
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
              label="Running"
              active={statusFilter === 'running'}
              count={statusCounts.running}
              onToggle={() => setStatusFilter(statusFilter === 'running' ? null : 'running')}
            />
          </div>

          {/* Date Range Picker */}
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={14} className="text-base-content/60" />
            <span className="text-sm text-base-content/70">Date Range:</span>
            <div className="flex gap-2">
              <FilterChip
                label="Today"
                active={dateRange === 'today'}
                onToggle={() => setDateRange(dateRange === 'today' ? null : 'today')}
              />
              <FilterChip
                label="Last 7 Days"
                active={dateRange === '7d'}
                onToggle={() => setDateRange(dateRange === '7d' ? null : '7d')}
              />
              <FilterChip
                label="Last 30 Days"
                active={dateRange === '30d'}
                onToggle={() => setDateRange(dateRange === '30d' ? null : '30d')}
              />
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <div className="text-sm text-base-content/60">
              {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} applied
            </div>
          )}

          <div className="mt-3 text-sm text-base-content/60">
            Showing {runs.length} of {allRuns.length} runs
          </div>
        </div>
      </div>

      {/* Batch Action Toolbar */}
      {selectedRuns.size > 0 && (
        <div className="glass-card mb-4 p-3 flex items-center justify-between">
          <span className="text-sm font-medium">
            {selectedRuns.size} run{selectedRuns.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => {
              notifications.show({ message: 'Re-running selected tests...', color: 'info' });
            }}>
              <RotateCcw size={14} />
              Re-run Selected
            </Button>
            <ExportButton
              data={formatTestRunsForExport(runs.filter(r => selectedRuns.has(r.runId)))}
              filename="selected-test-runs"
              formats={['markdown', 'json', 'csv']}
              includeSystemInfo={true}
              metadata={{
                selectedCount: selectedRuns.size,
                totalRuns: runs.length,
              }}
              variant="secondary"
              size="sm"
              label="Export Selected"
            />
            <Button variant="danger" size="sm" onClick={() => {
              if (confirm(`Delete ${selectedRuns.size} run(s)?`)) {
                notifications.show({ message: 'Deleting selected runs...', color: 'info' });
                setSelectedRuns(new Set());
              }
            }}>
              <Trash2 size={14} />
              Delete
            </Button>
            <Button variant="tertiary" size="sm" onClick={() => setSelectedRuns(new Set())}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {runs.length === 0 ? (
        <EmptyState
          icon={PlayCircle}
          title="No runs found"
          description={activeFiltersCount > 0 ? 'Try adjusting your filters' : 'Run tests from the Test Library to see execution history'}
          actionLabel={activeFiltersCount === 0 ? 'Go to Test Library' : undefined}
          onAction={activeFiltersCount === 0 ? () => navigate('/library') : undefined}
        />
      ) : (
        <div className="glass-card">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th className="w-12">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={runs.length > 0 && runs.every(r => selectedRuns.has(r.runId))}
                      onChange={(e) => {
                        runs.forEach(run => {
                          const next = new Set(selectedRuns);
                          if (e.target.checked) {
                            next.add(run.runId);
                          } else {
                            next.delete(run.runId);
                          }
                          setSelectedRuns(next);
                        });
                      }}
                    />
                  </th>
                  <th>Test Name</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Started At</th>
                  <th>Duration</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run, idx) => {
                  const duration = run.finishedAt && run.startedAt
                    ? Math.round((new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)
                    : null;
                  const isExpanded = expandedRows.has(run.runId);
                  const borderColor = run.status === 'passed' ? 'border-l-[#2B8A3E]' :
                                     run.status === 'failed' ? 'border-l-[#C92A2A]' :
                                     run.status === 'running' ? 'border-l-[#1C7ED6]' :
                                     'border-l-transparent';
                  const { display, tooltip } = formatDateWithTooltip(run.startedAt);
                  
                  return (
                    <React.Fragment key={run.runId}>
                      <tr
                        className={`hover:bg-base-300 cursor-pointer border-l-4 ${borderColor} ${idx % 2 === 0 ? 'bg-base-200/50' : ''}`}
                        onClick={() => toggleRowExpansion(run.runId)}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={selectedRuns.has(run.runId)}
                            onChange={(e) => {
                              e.stopPropagation();
                              const next = new Set(selectedRuns);
                              if (e.target.checked) {
                                next.add(run.runId);
                              } else {
                                next.delete(run.runId);
                              }
                              setSelectedRuns(next);
                            }}
                          />
                        </td>
                        <td>
                          <div>
                            <div className="font-medium cursor-pointer hover:text-primary" onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/tests/${run.testName}`);
                            }}>
                              {run.testName}
                            </div>
                            <div className="text-xs text-base-content/60 font-mono">{run.runId.slice(0, 8)}</div>
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={run.status} size="sm" showIcon />
                        </td>
                        <td>
                          <span className={`badge badge-sm ${run.source === 'browserstack' ? 'badge-info' : 'badge-neutral'}`}>
                            {run.source?.toUpperCase() || 'LOCAL'}
                          </span>
                        </td>
                        <td>
                          <span className="text-sm text-base-content/70" title={tooltip}>
                            {display}
                          </span>
                        </td>
                        <td>
                          <span className={`text-sm font-medium ${getDurationColor(duration)}`}>
                            {duration !== null ? `${duration}s` : '-'}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            {(run.allureReportPath || run.reportPath) && (
                              <Button
                                variant="tertiary"
                                size="sm"
                                icon={FileText}
                                tooltip="View Report"
                                onClick={async () => {
                                  if (!workspacePath) return;
                                  await ipc.report.openWindow({
                                    workspacePath,
                                    runId: run.runId,
                                  });
                                }}
                              />
                            )}
                            {run.tracePaths && run.tracePaths.length > 0 && run.status === 'failed' && (
                              <Button
                                variant="tertiary"
                                size="sm"
                                icon={Bug}
                                tooltip="Debug Trace"
                                onClick={async () => {
                                  if (!workspacePath) return;
                                  await ipc.trace.openWindow({
                                    workspacePath,
                                    traceZipPath: run.tracePaths![0],
                                  });
                                }}
                              />
                            )}
                            <Button
                              variant="tertiary"
                              size="sm"
                              icon={Eye}
                              tooltip="View Details"
                              onClick={() => navigate(`/tests/${run.testName}`, { state: { initialTab: 'runs' } })}
                            />
                            <Button
                              variant="tertiary"
                              size="sm"
                              icon={RotateCcw}
                              tooltip="Re-run"
                              onClick={async () => {
                                await handleRunTest(run.testName, run.source === 'browserstack' ? 'browserstack' : 'local');
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="p-4 bg-base-300">
                            <div className="space-y-4">
                              <div>
                                <div className="text-sm font-medium mb-2">Test Path</div>
                                <div className="text-sm text-base-content/70 font-mono">{run.specRelPath}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium mb-2">Execution Log</div>
                                <div className="text-sm text-base-content/70 space-y-1">
                                  <div>Started: {formatDate(run.startedAt)}</div>
                                  {run.finishedAt && <div>Finished: {formatDate(run.finishedAt)}</div>}
                                  {duration !== null && <div>Duration: {duration} seconds</div>}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="primary" size="sm" onClick={() => {
                                  notifications.show({
                                    message: 'Creating Jira issue...',
                                    color: 'info',
                                  });
                                }}>
                                  Create Jira Issue
                                </Button>
                                <Button variant="secondary" size="sm" onClick={async () => {
                                  await handleRunTest(run.testName, run.source === 'browserstack' ? 'browserstack' : 'local');
                                }}>
                                  <RotateCcw size={14} />
                                  Re-run
                                </Button>
                                <Button variant="secondary" size="sm" onClick={async () => {
                                  notifications.show({
                                    message: 'Downloading report...',
                                    color: 'info',
                                  });
                                }}>
                                  <Download size={14} />
                                  Download Report
                                </Button>
                              </div>
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
      )}

      {/* Multi-Test Execution Modal */}
      {multiTestModalOpened && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-base-200 border border-base-300 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-base-300">
              <h2 className="text-xl font-semibold">Run Multiple Tests</h2>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setMultiTestModalOpened(false);
                  setSelectedTests(new Set());
                }}
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Execution Mode</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="runMode"
                      value="local"
                      checked={multiTestRunMode === 'local'}
                      onChange={(e) => setMultiTestRunMode(e.target.value as 'local' | 'browserstack')}
                    />
                    <Play size={16} />
                    <span>Local</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="runMode"
                      value="browserstack"
                      checked={multiTestRunMode === 'browserstack'}
                      onChange={(e) => setMultiTestRunMode(e.target.value as 'local' | 'browserstack')}
                    />
                    <Cloud size={16} />
                    <span>BrowserStack</span>
                  </label>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Select Tests</label>
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={() => {
                      if (selectedTests.size === tests.length) {
                        setSelectedTests(new Set());
                      } else {
                        setSelectedTests(new Set(tests.map(t => t.testName)));
                      }
                    }}
                  >
                    {selectedTests.size === tests.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {tests.map((test) => (
                    <label key={test.testName} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-base-300 rounded">
                      <input
                        type="checkbox"
                        checked={selectedTests.has(test.testName)}
                        onChange={(e) => {
                          const newSet = new Set(selectedTests);
                          if (e.target.checked) {
                            newSet.add(test.testName);
                          } else {
                            newSet.delete(test.testName);
                          }
                          setSelectedTests(newSet);
                        }}
                      />
                      <span className="text-sm">{test.testName}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-6 border-t border-base-300">
              <Button
                variant="secondary"
                onClick={() => {
                  setMultiTestModalOpened(false);
                  setSelectedTests(new Set());
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleRunSelectedTests}
                disabled={selectedTests.size === 0}
              >
                Run Selected ({selectedTests.size})
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RunsScreen;
