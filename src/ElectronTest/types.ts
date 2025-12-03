export type TestStatus = 'PASS' | 'FAIL' | 'SKIP';

export interface ElectronTestResult {
  id: string;
  label: string;
  status: TestStatus;
  details?: string;
  durationMs: number;
}

export type ElectronTestResultWithoutDuration = Omit<ElectronTestResult, 'durationMs'>;


