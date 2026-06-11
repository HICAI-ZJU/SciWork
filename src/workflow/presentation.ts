import type { LabOntologyValidation, SimulationRunResult, StageStatus } from '../domain/types';

export function formatStageStatus(status: StageStatus): string {
  const labels: Record<StageStatus, string> = {
    'not-started': '未开始',
    'in-progress': '进行中',
    completed: '已完成',
    'needs-approval': '待审批',
    'needs-revision': '需修订',
    warning: '有提示'
  };

  return labels[status];
}

export function formatValidationStatus(status: LabOntologyValidation['status']): string {
  const labels: Record<LabOntologyValidation['status'], string> = {
    pass: '通过',
    warning: '有提示',
    'needs-revision': '需修订'
  };

  return labels[status];
}

export function formatSimulationStatus(status: SimulationRunResult['status']): string {
  const labels: Record<SimulationRunResult['status'], string> = {
    completed: '已完成',
    'completed-with-warning': '完成，有提示'
  };

  return labels[status];
}
