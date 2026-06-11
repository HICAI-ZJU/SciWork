import { useRef, useState } from 'react';
import { demoLiterature, demoProject } from '../domain/demoData';
import type { LiteratureItem, Project } from '../domain/types';
import { createEmptyArtifacts, runStage } from '../workflow/runStage';
import type { WorkflowArtifacts } from '../workflow/runStage';
import { advanceStage, createInitialStageState } from '../workflow/stageMachine';
import type { StageMachineState } from '../workflow/stageMachine';

interface WorkflowControllerProps {
  project?: Project;
  literature?: LiteratureItem[];
}

interface ControllerState {
  stageState: StageMachineState;
  artifacts: WorkflowArtifacts;
  message: string;
}

function createInitialControllerState(): ControllerState {
  return {
    stageState: createInitialStageState(),
    artifacts: createEmptyArtifacts(),
    message: '已进入私域文献库，准备启动 SciGraph 文献分析。'
  };
}

/**
 * 驱动一次会话的科学工作流。状态生命周期与组件实例一致：
 * 调用方按会话 key 重挂载即可重置，无需 reset 逻辑。
 */
export function useWorkflowController({
  project = demoProject,
  literature = demoLiterature
}: WorkflowControllerProps = {}) {
  const [state, setState] = useState(createInitialControllerState);
  const [isRunning, setIsRunning] = useState(false);

  // runNextAction 是异步的，需要调用时刻的状态快照；ref 与 state 同步提交。
  const stateRef = useRef(state);
  const runningRef = useRef(false);

  function commit(next: ControllerState) {
    stateRef.current = next;
    setState(next);
  }

  const canAdvance = !isRunning && state.stageState.activeStageId !== 'next-suggestion';

  async function runNextAction(constraint = '') {
    if (runningRef.current) {
      return;
    }
    const current = stateRef.current;
    const stageId = current.stageState.activeStageId;
    if (stageId === 'next-suggestion') {
      return;
    }

    runningRef.current = true;
    setIsRunning(true);
    try {
      const outcome = await runStage(stageId, {
        project,
        literature,
        artifacts: current.artifacts,
        constraint
      });
      commit({
        stageState: advanceStage(current.stageState),
        artifacts: { ...current.artifacts, ...outcome.artifacts },
        message: outcome.message
      });
    } finally {
      runningRef.current = false;
      setIsRunning(false);
    }
  }

  return {
    stageState: state.stageState,
    artifacts: state.artifacts,
    message: state.message,
    isRunning,
    canAdvance,
    runNextAction
  };
}
