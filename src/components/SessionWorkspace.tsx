import type { LiteratureItem, Project, ScienceSession, ScientificSpace } from '../domain/types';
import { useWorkflowController } from '../hooks/useWorkflowController';
import { AgentThread } from './AgentThread';
import { Composer } from './Composer';
import { ContextPanel } from './ContextPanel';

interface SessionWorkspaceProps {
  project: Project;
  session: ScienceSession | undefined;
  space: ScientificSpace;
  literature: LiteratureItem[];
  workspacePath: string;
}

/**
 * 中栏会话区 + 右栏上下文：一次会话的完整工作区。
 * 调用方按 `项目/会话` 加 key 渲染本组件，切换会话即整体重挂载，
 * 工作流状态随之归零 —— 状态生命周期由结构表达，无需手写 reset。
 */
export function SessionWorkspace({ project, session, space, literature, workspacePath }: SessionWorkspaceProps) {
  const workflow = useWorkflowController({ project, literature });

  return (
    <>
      <main className="workbench-main" aria-label="智能体会话">
        <AgentThread
          project={project}
          session={session}
          message={workflow.message}
          activeStageId={workflow.stageState.activeStageId}
          statusByStage={workflow.stageState.statusByStage}
          artifacts={workflow.artifacts}
        />
        <Composer
          activeStageId={workflow.stageState.activeStageId}
          workspacePath={workspacePath}
          canAdvance={workflow.canAdvance}
          isRunning={workflow.isRunning}
          onRun={workflow.runNextAction}
        />
      </main>
      <ContextPanel
        project={project}
        session={session}
        space={space}
        activeStageId={workflow.stageState.activeStageId}
        statusByStage={workflow.stageState.statusByStage}
        artifacts={workflow.artifacts}
        literatureCount={literature.length}
      />
    </>
  );
}
