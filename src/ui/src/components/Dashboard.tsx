import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Library, PlayCircle, BarChart3, Plus, Bug, Eye, Play, Lightbulb, CheckCircle2, XCircle, Circle, FileText, Clock, Activity } from 'lucide-react';
import { ipc } from '../ipc';
import { useWorkspaceStore } from '../store/workspace-store';
import { TestSummary } from '../../../types/v1.5';
import MetricCard from './MetricCard';
import StatusBadge from './StatusBadge';
import { formatDate, formatDateWithTooltip } from '../utils/formatDate';
import Skeleton from './Skeleton';
import EmptyState from './EmptyState';
import './Dashboard.css';

// Check if we're in demo mode (web environment)
const isDemoMode = typeof window !== 'undefined' && !window.electronAPI;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { workspacePath } = useWorkspaceStore();
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    neverRun: 0,
    totalDatasets: 0,
    testsWithTraces: 0,
  });
  const [recentRunsWithTraces, setRecentRunsWithTraces] = useState<any[]>([]);

  useEffect(() => {
    if (workspacePath) {
      loadTests();
    }
  }, [workspacePath]);

  const loadTests = async () => {
    if (!workspacePath) return;

    setLoading(true);
    try {
      const response = await ipc.workspace.testsList({ workspacePath });
      if (response.success && response.tests) {
        setTests(response.tests);
        
        // Load recent runs to check for traces
        const runsResponse = await ipc.runs.list({ workspacePath });
        const runsWithTraces = runsResponse.success && runsResponse.runs
          ? runsResponse.runs.filter(r => r.tracePaths && r.tracePaths.length > 0)
          : [];
        
        // Get unique test names that have traces
        const testNamesWithTraces = new Set(runsWithTraces.map(r => r.testName));
        
        const stats = {
          totalTests: response.tests.length,
          passedTests: response.tests.filter(t => t.lastStatus === 'passed').length,
          failedTests: response.tests.filter(t => t.lastStatus === 'failed').length,
          neverRun: response.tests.filter(t => t.lastStatus === 'never_run').length,
          totalDatasets: response.tests.reduce((sum, t) => sum + t.datasetCount, 0),
          testsWithTraces: testNamesWithTraces.size,
        };
        setStats(stats);
        setRecentRunsWithTraces(runsWithTraces.slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to load tests:', error);
    } finally {
      setLoading(false);
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

  const recentTests = tests
    .filter(t => t.lastRunAt)
    .sort((a, b) => new Date(b.lastRunAt!).getTime() - new Date(a.lastRunAt!).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Skeleton variant="card" height={120} />
          <Skeleton variant="card" height={120} />
          <Skeleton variant="card" height={120} />
          <Skeleton variant="card" height={120} />
        </div>
      </div>
    );
  }

  const handleStartTour = () => {
    // Trigger tour by setting a custom event or localStorage flag
    window.dispatchEvent(new CustomEvent('start-demo-tour'));
  };

  return (
    <div className="dashboard">
      {/* Professional Header Section */}
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="dashboard-header-title-section">
            <div className="dashboard-header-icon">
              <Lightbulb size={24} />
            </div>
            <div>
              <h1 className="dashboard-header-title">Workspace Overview</h1>
              <p className="dashboard-header-description">
                Your workspace contains all tests, recordings, and generated code. Keep it organized for better test management.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Tour CTA */}
      {isDemoMode && (
        <div className="card bg-gradient-to-br from-primary/10 to-secondary/10 border border-base-300 mb-6">
          <div className="card-body">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold mb-1">New to QA Studio?</h3>
                <p className="text-sm text-base-content/70">
                  Take a guided tour to learn about all the features and capabilities
                </p>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleStartTour}
              >
                <Play size={16} />
                Start Tour
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Section - Compact 4-column grid with trends */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Total Tests"
          value={stats.totalTests}
          icon={BarChart3}
          trend={stats.totalTests > 0 ? { direction: 'neutral', value: '' } : undefined}
        />
        <MetricCard
          title="Passed"
          value={stats.passedTests}
          icon={CheckCircle2}
          trend={
            stats.totalTests > 0
              ? {
                  direction: stats.passedTests / stats.totalTests > 0.8 ? 'up' : 'neutral',
                  value: `${Math.round((stats.passedTests / stats.totalTests) * 100)}%`,
                }
              : undefined
          }
        />
        <MetricCard
          title="Failed"
          value={stats.failedTests}
          icon={XCircle}
          trend={
            stats.totalTests > 0
              ? {
                  direction: stats.failedTests > 0 ? 'down' : 'neutral',
                  value: `${Math.round((stats.failedTests / stats.totalTests) * 100)}%`,
                }
              : undefined
          }
        />
        <MetricCard
          title="Never Run"
          value={stats.neverRun}
          icon={Circle}
          trend={
            stats.totalTests > 0
              ? {
                  direction: stats.neverRun > 0 ? 'down' : 'neutral',
                  value: `${Math.round((stats.neverRun / stats.totalTests) * 100)}%`,
                }
              : undefined
          }
        />
      </div>

      {/* Recent Activity Timeline */}
      {recentTests.length > 0 && (
        <div className="glass-card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity size={20} />
              Recent Activity
            </h3>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/runs')}
            >
              View All Activity →
            </button>
          </div>
          <div className="space-y-2">
            {recentTests.slice(0, 10).map((test) => {
              const { display, tooltip } = formatDateWithTooltip(test.lastRunAt || null);
              return (
                <div
                  key={test.testName}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-base-300 cursor-pointer transition-colors"
                  onClick={() => navigate(`/tests/${test.testName}`)}
                  title={tooltip}
                >
                  <div className="flex-shrink-0">
                    {test.lastStatus === 'passed' ? (
                      <CheckCircle2 size={16} className="text-[#2B8A3E]" />
                    ) : test.lastStatus === 'failed' ? (
                      <XCircle size={16} className="text-[#C92A2A]" />
                    ) : (
                      <Circle size={16} className="text-base-content/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{test.testName}</div>
                    <div className="text-xs text-base-content/60 flex items-center gap-2">
                      <Clock size={12} />
                      {display}
                    </div>
                  </div>
                  <StatusBadge status={test.lastStatus} size="sm" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions - Uniform size with keyboard shortcuts */}
      <div className="dashboard-actions mb-6">
        <h3 className="dashboard-actions-title mb-4">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-4">
          <button
            className="btn btn-primary h-[50px] flex flex-col items-center justify-between py-2 group relative"
            onClick={() => navigate('/record')}
            style={{ width: '160px' }}
          >
            <div className="flex flex-col items-center gap-1">
              <PlayCircle size={18} />
              <span>Record New Test</span>
            </div>
            <span className="text-xs opacity-0 group-hover:opacity-70 transition-opacity">Ctrl+R</span>
          </button>
          <button
            className="btn btn-outline h-[50px] flex flex-col items-center justify-center gap-1"
            onClick={() => navigate('/library')}
            style={{ width: '160px' }}
          >
            <Library size={18} />
            <span>Test Library</span>
          </button>
          <button
            className="btn btn-outline h-[50px] flex flex-col items-center justify-center gap-1"
            onClick={() => navigate('/report')}
            style={{ width: '160px' }}
          >
            <BarChart3 size={18} />
            <span>View Reports</span>
          </button>
        </div>
      </div>

      {/* Recent Tests */}
      {recentTests.length > 0 && (
        <div className="dashboard-recent">
          <h3 className="dashboard-recent-title">Recent Test Runs</h3>
          <div className="recent-tests">
            {recentTests.map((test) => (
              <div
                key={test.testName}
                className="recent-test-card"
                onClick={() => navigate(`/tests/${test.testName}`)}
              >
                <div className="recent-test-header">
                  <div>
                    <div className="recent-test-name">{test.testName}</div>
                    <div className="recent-test-meta">
                      {test.module || 'No module'} • {test.datasetCount} datasets • {new Date(test.lastRunAt!).toLocaleString()}
                    </div>
                  </div>
                  <span className={`badge badge-${getStatusColor(test.lastStatus) === 'green' ? 'success' : getStatusColor(test.lastStatus) === 'red' ? 'error' : 'info'}`}>
                    {test.lastStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Tests Table (Compact) */}
      {tests.length > 0 && (
        <div className="dashboard-all-tests">
          <div className="dashboard-all-tests-header">
            <h3 className="dashboard-all-tests-title">All Tests</h3>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/library')}
            >
              View All →
            </button>
          </div>
          <div className="tests-table-compact">
            {tests.slice(0, 10).map((test) => (
              <div
                key={test.testName}
                className="test-row"
                onClick={() => navigate(`/tests/${test.testName}`)}
              >
                <div className="test-row-content">
                  <div className="test-row-info">
                    <div className="test-row-name">{test.testName}</div>
                    <div className="test-row-meta">
                      {test.module || '-'} • {test.datasetCount} datasets • {test.lastRunAt ? new Date(test.lastRunAt).toLocaleDateString() : 'Never'}
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/tests/${test.testName}`);
                    }}
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tests.length === 0 && (
        <EmptyState
          icon={PlayCircle}
          title="No tests yet"
          description="Get started by recording your first test flow"
          actionLabel="Record Your First Test"
          onAction={() => navigate('/record')}
          tip="Use keyboard shortcut Ctrl+R to start recording"
        />
      )}
    </div>
  );
};

export default Dashboard;
