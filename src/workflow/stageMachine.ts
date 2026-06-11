import type { StageStatus, WorkflowStageId } from '../domain/types';

export interface StageDefinition {
  id: WorkflowStageId;
  label: string;
  shortLabel: string;
  evidenceMode: 'scigraph' | 'labontology' | 'experimental-graph';
}

export interface StageMachineState {
  activeStageId: WorkflowStageId;
  statusByStage: Record<WorkflowStageId, StageStatus>;
}

export const stageDefinitions = [
  { id: 'literature', label: '私域文献库', shortLabel: '文献库', evidenceMode: 'scigraph' },
  { id: 'scigraph-analysis', label: 'SciGraph 文献分析', shortLabel: 'SciGraph', evidenceMode: 'scigraph' },
  { id: 'report', label: '研究总结报告', shortLabel: '报告', evidenceMode: 'scigraph' },
  { id: 'protocol-design', label: '实验方案设计', shortLabel: '方案', evidenceMode: 'labontology' },
  { id: 'labontology-check', label: 'LabOntology 校验', shortLabel: '校验', evidenceMode: 'labontology' },
  { id: 'simulation', label: '模拟执行', shortLabel: '模拟', evidenceMode: 'experimental-graph' },
  { id: 'experimental-graph', label: 'Experimental Graph 回流', shortLabel: '图谱', evidenceMode: 'experimental-graph' },
  { id: 'next-suggestion', label: '下一轮建议', shortLabel: '建议', evidenceMode: 'experimental-graph' }
] as const satisfies readonly StageDefinition[];

export function createInitialStageState(): StageMachineState {
  return {
    activeStageId: 'literature',
    statusByStage: stageDefinitions.reduce(
      (accumulator, stage) => {
        accumulator[stage.id] = stage.id === 'literature' ? 'in-progress' : 'not-started';
        return accumulator;
      },
      {} as Record<WorkflowStageId, StageStatus>
    )
  };
}

export function advanceStage(state: StageMachineState): StageMachineState {
  const currentIndex = stageDefinitions.findIndex((stage) => stage.id === state.activeStageId);
  const nextStage = stageDefinitions[currentIndex + 1];

  if (!nextStage) {
    return {
      activeStageId: state.activeStageId,
      statusByStage: {
        ...state.statusByStage,
        [state.activeStageId]: 'completed'
      }
    };
  }

  return {
    activeStageId: nextStage.id,
    statusByStage: {
      ...state.statusByStage,
      [state.activeStageId]: 'completed',
      [nextStage.id]: 'in-progress'
    }
  };
}

export function markStage(state: StageMachineState, stageId: WorkflowStageId, status: StageStatus): StageMachineState {
  return {
    ...state,
    statusByStage: {
      ...state.statusByStage,
      [stageId]: status
    }
  };
}
