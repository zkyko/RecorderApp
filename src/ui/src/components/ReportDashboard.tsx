import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Text, Button, Group, Loader, Center, Grid, Badge, Stack, Divider, Alert, Accordion } from '@mantine/core';
import { BarChart3, TrendingUp, TrendingDown, CheckCircle2, XCircle, Clock, FileText, ExternalLink, AlertTriangle, Activity, Filter } from 'lucide-react';
import { ipc } from '../ipc';
import { useWorkspaceStore } from '../store/workspace-store';
import { TestRunMeta } from '../../../types/v1.5';
import FilterChip from './FilterChip';
import { analyzeFailures, detectFlakyTests, getFailureTrend, getFailureCategoryIcon, getFailureCategoryColor, FailureCategory } from '../utils/failureAnalysis';
import { formatDate } from '../utils/formatDate';
import './ReportDashboard.css';

const ReportDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { workspacePath } = useWorkspaceStore();
  const [runs, setRuns] = useState<TestRunMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFailureCategory, setSelectedFailureCategory] = useState<FailureCategory | null>(null);

  // Calculate statistics (memoized to prevent recalculation)
  const stats = useMemo(() => {
    const totalRuns = runs.length;
    const passedRuns = runs.filter(r => r.status === 'passed').length;
    const failedRuns = runs.filter(r => r.status === 'failed').length;
    const skippedRuns = runs.filter(r => r.status === 'skipped').length;
    const runningRuns = runs.filter(r => r.status === 'running').length;
    const passRate = totalRuns > 0 ? ((passedRuns / totalRuns) * 100).toFixed(1) : '0.0';
    const testNames = Array.from(new Set(runs.map(r => r.testName)));
    const totalTests = testNames.length;
    
    return {
      totalRuns,
      passedRuns,
      failedRuns,
      skippedRuns,
      runningRuns,
      passRate,
      testNames,
      totalTests,
    };
  }, [runs]);
  
  const { totalRuns, passedRuns, failedRuns, skippedRuns, runningRuns, passRate, testNames, totalTests } = stats;

  // Get latest runs (most recent first)
  const latestRuns = useMemo(() => [...runs]
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 10), [runs]);

  // Get runs with Allure reports
  const runsWithReports = useMemo(() => runs.filter(r => r.allureReportPath || r.reportPath), [runs]);
  
  // Get recent failures
  const recentFailures = useMemo(() => runs
    .filter(r => r.status === 'failed')
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 5), [runs]);

  // Failure analysis
  const failureAnalysis = useMemo(() => analyzeFailures(runs), [runs]);
  const flakyTests = useMemo(() => detectFlakyTests(runs), [runs]);
  const failureTrend = useMemo(() => getFailureTrend(runs), [runs]);
  
  // Memoize failure category mapping to avoid recalculating on every render
  // Use a string-based map instead of Map object to avoid reference issues
  const failureCategoryMap = useMemo(() => {
    const map: Record<string, FailureCategory> = {};
    runs.forEach(run => {
      if (run.status === 'failed') {
        const analysis = analyzeFailures([run]);
        if (analysis.length > 0) {
          map[run.runId] = analysis[0].category;
        }
      }
    });
    return map;
  }, [runs]);
  
  const filteredFailures = useMemo(() => {
    if (!selectedFailureCategory) return recentFailures;
    return recentFailures.filter(r => failureCategoryMap[r.runId] === selectedFailureCategory);
  }, [recentFailures, selectedFailureCategory, failureCategoryMap]);

  // Check if Allure report exists (memoized)
  const hasAllureReport = useMemo(() => 
    runsWithReports.some(r => r.allureReportPath), 
    [runsWithReports]
  );
  
  const latestAllureReport = useMemo(() => 
    runsWithReports
      .filter(r => r.allureReportPath)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0],
    [runsWithReports]
  );

  useEffect(() => {
    if (workspacePath) {
      loadRuns();
    }
  }, [workspacePath]);

  const loadRuns = async () => {
    if (!workspacePath) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await ipc.runs.list({ workspacePath });
      if (response.success && response.runs) {
        setRuns(response.runs);
      } else {
        setError(response.error || 'Failed to load runs');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load runs');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Center h="100%">
        <Loader size="lg" />
      </Center>
    );
  }

  if (error) {
    return (
      <Card padding="xl" radius="md" withBorder>
        <Center>
          <div style={{ textAlign: 'center' }}>
            <Text size="xl" fw={600} mb="xs" c="red">Error</Text>
            <Text c="dimmed" mb="lg">{error}</Text>
            <Button onClick={loadRuns}>Retry</Button>
          </div>
        </Center>
      </Card>
    );
  }

  const handleOpenAllureDashboard = async () => {
    if (latestAllureReport && latestAllureReport.allureReportPath && workspacePath) {
      try {
        const response = await ipc.report.open({
          workspacePath,
          runId: latestAllureReport.runId,
        });
        if (response.success && response.url) {
          // Open in external browser or webview
          window.open(response.url, '_blank');
        }
      } catch (error) {
        console.error('Failed to open Allure report:', error);
        alert('Failed to open Allure report. Please check if the report exists.');
      }
    }
  };

  return (
    <div className="report-dashboard">
      <Stack gap="md">
        {/* Header */}
        <Card padding="lg" radius="md" withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Text size="xl" fw={600}>Test Reports Dashboard</Text>
              <Text size="sm" c="dimmed" mt="xs">
                Overview of all test runs and results
              </Text>
            </div>
            <Group gap="xs">
              {hasAllureReport && (
                <Button
                  leftSection={<ExternalLink size={16} />}
                  onClick={handleOpenAllureDashboard}
                  variant="filled"
                >
                  Open Allure Dashboard
                </Button>
              )}
              <Button
                leftSection={<FileText size={16} />}
                onClick={loadRuns}
                variant="light"
              >
                Refresh
              </Button>
            </Group>
          </Group>
        </Card>

        {/* Statistics Cards */}
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card padding="lg" radius="md" withBorder>
              <Group gap="xs" mb="xs">
                <BarChart3 size={20} color="var(--mantine-color-blue-6)" />
                <Text size="sm" c="dimmed">Total Runs</Text>
              </Group>
              <Text size="2rem" fw={700}>{totalRuns}</Text>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card padding="lg" radius="md" withBorder>
              <Group gap="xs" mb="xs">
                <CheckCircle2 size={20} color="var(--mantine-color-green-6)" />
                <Text size="sm" c="dimmed">Passed</Text>
              </Group>
              <Text size="2rem" fw={700} c="green">{passedRuns}</Text>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card padding="lg" radius="md" withBorder>
              <Group gap="xs" mb="xs">
                <XCircle size={20} color="var(--mantine-color-red-6)" />
                <Text size="sm" c="dimmed">Failed</Text>
              </Group>
              <Text size="2rem" fw={700} c="red">{failedRuns}</Text>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card padding="lg" radius="md" withBorder>
              <Group gap="xs" mb="xs">
                {parseFloat(passRate) >= 80 ? (
                  <TrendingUp size={20} color="var(--mantine-color-green-6)" />
                ) : (
                  <TrendingDown size={20} color="var(--mantine-color-red-6)" />
                )}
                <Text size="sm" c="dimmed">Pass Rate</Text>
              </Group>
              <Text size="2rem" fw={700}>{passRate}%</Text>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Additional Stats */}
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Card padding="lg" radius="md" withBorder>
              <Group gap="xs" mb="xs">
                <FileText size={20} color="var(--mantine-color-blue-6)" />
                <Text size="sm" c="dimmed">Total Tests</Text>
              </Group>
              <Text size="1.5rem" fw={600}>{totalTests}</Text>
              <Text size="xs" c="dimmed" mt="xs">
                {testNames.join(', ')}
              </Text>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Card padding="lg" radius="md" withBorder>
              <Group gap="xs" mb="xs">
                <Clock size={20} color="var(--mantine-color-yellow-6)" />
                <Text size="sm" c="dimmed">Status</Text>
              </Group>
              <Group gap="xs" mt="xs">
                {runningRuns > 0 && (
                  <Badge color="blue" size="lg">Running: {runningRuns}</Badge>
                )}
                {skippedRuns > 0 && (
                  <Badge color="gray" size="lg">Skipped: {skippedRuns}</Badge>
                )}
                {runsWithReports.length > 0 && (
                  <Badge color="green" size="lg">Reports: {runsWithReports.length}</Badge>
                )}
              </Group>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Failure Analysis */}
        {failureAnalysis.length > 0 && (
          <Card padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Group gap="xs">
                <Activity size={20} color="var(--mantine-color-red-6)" />
                <Text size="lg" fw={600}>Failure Analysis</Text>
              </Group>
              <Group gap="xs">
                <Badge
                  color={failureTrend.trend === 'improving' ? 'green' : failureTrend.trend === 'worsening' ? 'red' : 'gray'}
                  variant="light"
                >
                  {failureTrend.trend === 'improving' && <TrendingUp size={12} style={{ marginRight: 4 }} />}
                  {failureTrend.trend === 'worsening' && <TrendingDown size={12} style={{ marginRight: 4 }} />}
                  {failureTrend.trend.charAt(0).toUpperCase() + failureTrend.trend.slice(1)}
                </Badge>
              </Group>
            </Group>

            {/* Failure Categories */}
            <div className="mb-4">
              <Text size="sm" fw={500} mb="xs">Failure Categories</Text>
              <div className="flex flex-wrap gap-2 mb-3">
                <FilterChip
                  label="All Failures"
                  active={!selectedFailureCategory}
                  count={recentFailures.length}
                  onToggle={() => setSelectedFailureCategory(null)}
                />
                {failureAnalysis.map((analysis) => (
                  <FilterChip
                    key={analysis.category}
                    label={`${getFailureCategoryIcon(analysis.category)} ${analysis.pattern}`}
                    active={selectedFailureCategory === analysis.category}
                    count={analysis.count}
                    onToggle={() => setSelectedFailureCategory(
                      selectedFailureCategory === analysis.category ? null : analysis.category
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Failure Breakdown */}
            <Grid>
              {failureAnalysis.map((analysis) => (
                <Grid.Col key={analysis.category} span={{ base: 12, sm: 6, md: 4 }}>
                  <Card padding="md" radius="md" withBorder style={{ borderLeft: `4px solid ${getFailureCategoryColor(analysis.category)}` }}>
                    <Group gap="xs" mb="xs">
                      <Text size="xl">{getFailureCategoryIcon(analysis.category)}</Text>
                      <div style={{ flex: 1 }}>
                        <Text fw={600} size="sm">{analysis.pattern}</Text>
                        <Text size="xs" c="dimmed">{analysis.count} failure{analysis.count !== 1 ? 's' : ''}</Text>
                      </div>
                    </Group>
                    <Text size="xs" c="dimmed">
                      Affects {analysis.tests.length} test{analysis.tests.length !== 1 ? 's' : ''}
                    </Text>
                    {analysis.flakiness > 30 && (
                      <Badge color="orange" size="xs" mt="xs" variant="light">
                        Flaky ({Math.round(analysis.flakiness)}%)
                      </Badge>
                    )}
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          </Card>
        )}

        {/* Flaky Tests */}
        {flakyTests.length > 0 && (
          <Card padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Group gap="xs">
                <AlertTriangle size={20} color="var(--mantine-color-orange-6)" />
                <Text size="lg" fw={600}>Flaky Tests</Text>
                <Badge color="orange" variant="light">
                  {flakyTests.length} test{flakyTests.length !== 1 ? 's' : ''}
                </Badge>
              </Group>
            </Group>
            <Stack gap="xs">
              {flakyTests.slice(0, 5).map((test) => (
                <Card
                  key={test.testName}
                  padding="md"
                  radius="md"
                  withBorder
                  style={{ 
                    cursor: 'pointer',
                    borderLeft: `4px solid ${test.flakinessScore > 70 ? '#C92A2A' : '#E67700'}`,
                  }}
                  onClick={() => navigate(`/tests/${test.testName}`, { state: { initialTab: 'runs' } })}
                >
                  <Group justify="space-between" align="flex-start">
                    <div style={{ flex: 1 }}>
                      <Group gap="xs" mb="xs">
                        <Text fw={600}>{test.testName}</Text>
                        <Badge color="orange" variant="light">
                          {Math.round(test.flakinessScore)}% flaky
                        </Badge>
                      </Group>
                      <Group gap="md" mt="xs">
                        <Text size="xs" c="dimmed">
                          {test.passedRuns} passed / {test.failedRuns} failed ({test.totalRuns} total)
                        </Text>
                        <Text size="xs" c="dimmed">
                          Failure rate: {(test.failureRate * 100).toFixed(0)}%
                        </Text>
                      </Group>
                      {test.recentFailures.length > 0 && (
                        <Text size="xs" c="dimmed" mt="xs">
                          Last failed: {formatDate(test.recentFailures[0].startedAt)}
                        </Text>
                      )}
                    </div>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Card>
        )}

        {/* Recent Failures */}
        {filteredFailures.length > 0 && (
          <Card padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Group gap="xs">
                <AlertTriangle size={20} color="var(--mantine-color-red-6)" />
                <Text size="lg" fw={600}>
                  Recent Failures
                  {selectedFailureCategory && filteredFailures.length > 0 && ` (${failureAnalysis.find(a => a.category === selectedFailureCategory)?.pattern || 'Filtered'})`}
                </Text>
              </Group>
            </Group>
            <Stack gap="xs">
              {filteredFailures.map((run) => {
                const category = failureCategoryMap[run.runId] || 'unknown';
                const analysis = failureAnalysis.find(a => a.category === category);
                return (
                  <Card
                    key={run.runId}
                    padding="md"
                    radius="md"
                    withBorder
                    style={{ 
                      cursor: 'pointer',
                      borderLeft: `4px solid ${getFailureCategoryColor(category)}`,
                    }}
                    onClick={() => navigate(`/tests/${run.testName}`, { state: { initialTab: 'runs' } })}
                  >
                    <Group justify="space-between" align="flex-start">
                      <div style={{ flex: 1 }}>
                        <Group gap="xs" mb="xs">
                          <Text fw={600} c="red">{run.testName}</Text>
                          <Badge 
                            color="red"
                            leftSection={<span style={{ marginRight: 4 }}>{getFailureCategoryIcon(category)}</span>}
                          >
                            {analysis?.pattern || 'Failed'}
                          </Badge>
                        </Group>
                        <Text size="sm" c="dimmed">
                          Failed at: {formatDate(run.startedAt)}
                        </Text>
                        {run.assertionFailures && run.assertionFailures.length > 0 && (
                          <Text size="xs" c="dimmed" mt="xs" style={{ fontStyle: 'italic' }}>
                            {run.assertionFailures[0].assertionType || 'Assertion failure'}
                            {run.assertionFailures[0].expected && run.assertionFailures[0].actual && (
                              <>: Expected "{run.assertionFailures[0].expected}", got "{run.assertionFailures[0].actual}"</>
                            )}
                          </Text>
                        )}
                      </div>
                      {run.tracePaths && run.tracePaths.length > 0 && (
                        <Button
                          size="xs"
                          variant="light"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (workspacePath) {
                              ipc.trace.openWindow({
                                workspacePath,
                                traceZipPath: run.tracePaths![0],
                              });
                            }
                          }}
                        >
                          Debug
                        </Button>
                      )}
                    </Group>
                  </Card>
                );
              })}
            </Stack>
          </Card>
        )}

        {/* Allure Report Status */}
        {!hasAllureReport && (
          <Alert color="blue" title="No Allure Report Yet" icon={<FileText size={16} />}>
            <Text size="sm">
              No Allure report yet. Run a test to generate one.
            </Text>
          </Alert>
        )}

        {/* Latest Runs */}
        <Card padding="lg" radius="md" withBorder>
          <Text size="lg" fw={600} mb="md">Latest Runs</Text>
          {latestRuns.length === 0 ? (
            <Center py="xl">
              <div style={{ textAlign: 'center' }}>
                <Text size="4rem" mb="md">📊</Text>
                <Text size="xl" fw={600} mb="xs">No runs yet</Text>
                <Text c="dimmed" mb="lg">Run tests to see results here</Text>
                <Button onClick={() => navigate('/library')}>Go to Test Library</Button>
              </div>
            </Center>
          ) : (
            <Stack gap="xs">
              {latestRuns.map((run) => (
                <Card
                  key={run.runId}
                  padding="md"
                  radius="md"
                  withBorder
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    if (run.allureReportPath || run.reportPath) {
                      navigate(`/report/${run.testName}/${run.runId}`);
                    }
                  }}
                >
                  <Group justify="space-between" align="center">
                    <div style={{ flex: 1 }}>
                      <Group gap="xs" mb="xs">
                        <Text fw={600}>{run.testName}</Text>
                        <Badge
                          color={
                            run.status === 'passed' ? 'green' :
                            run.status === 'failed' ? 'red' :
                            run.status === 'running' ? 'blue' : 'gray'
                          }
                        >
                          {run.status}
                        </Badge>
                      </Group>
                      <Text size="sm" c="dimmed">
                        {new Date(run.startedAt).toLocaleString()}
                        {run.finishedAt && (
                          <> • Duration: {Math.round((new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)}s</>
                        )}
                      </Text>
                    </div>
                    {(run.allureReportPath || run.reportPath) && (
                      <Button
                        size="xs"
                        variant="light"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/report/${run.testName}/${run.runId}`);
                        }}
                      >
                        View Report
                      </Button>
                    )}
                  </Group>
                </Card>
              ))}
            </Stack>
          )}
        </Card>
      </Stack>
    </div>
  );
};

export default ReportDashboard;

