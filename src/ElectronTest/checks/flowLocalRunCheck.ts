import { ElectronTestResultWithoutDuration } from '../types';

/**
 * For now this is a safe SKIP check.
 * Wiring a full Flow → Spec → Local Run smoke test requires a dedicated
 * configured flow id and workspace, which we haven't introduced yet.
 */
export async function flowLocalRunCheck(): Promise<ElectronTestResultWithoutDuration> {
  return {
    id: 'flow-local',
    label: 'Flow → Spec → Local Run',
    status: 'SKIP',
    details:
      'Local smoke flow is not configured yet. Configure a dedicated smoke flow id and update ElectronTest to exercise it.',
  };
}

(flowLocalRunCheck as any).id = 'flow-local';
(flowLocalRunCheck as any).label = 'Flow → Spec → Local Run';


