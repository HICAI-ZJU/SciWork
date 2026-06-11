import type { Project, ScienceSession, ScientificSpace, StageStatus, WorkflowStageId } from '../domain/types';
import { formatSimulationStatus, formatStageStatus, formatValidationStatus } from '../workflow/presentation';
import type { WorkflowArtifacts } from '../workflow/runStage';
import { stageDefinitions } from '../workflow/stageMachine';
import { GraphView } from './GraphView';

interface ContextPanelProps {
  project: Project;
  session: ScienceSession | undefined;
  space: ScientificSpace;
  activeStageId: WorkflowStageId;
  statusByStage: Record<WorkflowStageId, StageStatus>;
  artifacts: WorkflowArtifacts;
  literatureCount: number;
}

function stepClassName(stageId: WorkflowStageId, activeStageId: WorkflowStageId, status: StageStatus): string {
  if (stageId === activeStageId) return 'progress-step progress-step--active';
  if (status === 'completed') return 'progress-step progress-step--done';
  return 'progress-step';
}

export function ContextPanel({
  project,
  session,
  space,
  activeStageId,
  statusByStage,
  artifacts,
  literatureCount
}: ContextPanelProps) {
  const activeStage = stageDefinitions.find((stage) => stage.id === activeStageId);
  const { analysis, report, protocol, validation, simulationRun, experimentalGraph } = artifacts;

  const completedCount = stageDefinitions.filter((stage) => statusByStage[stage.id] === 'completed').length;
  const progressPercent = Math.round((completedCount / stageDefinitions.length) * 100);

  return (
    <aside className="context-panel" aria-label="任务进度与项目上下文">
      <section className="context-panel__section">
        <h2>进度</h2>
        <div className="progress-head">
          <strong>{activeStage?.label}</strong>
          <span>{formatStageStatus(statusByStage[activeStageId])}</span>
        </div>
        <div aria-hidden="true" className="progress-bar">
          <i style={{ width: `${progressPercent}%` }} />
        </div>
        <ol aria-label="工作流阶段" className="progress-steps">
          {stageDefinitions.map((stage) => (
            <li
              aria-label={`${stage.label}：${formatStageStatus(statusByStage[stage.id])}`}
              className={stepClassName(stage.id, activeStageId, statusByStage[stage.id])}
              key={stage.id}
              title={`${stage.label} · ${formatStageStatus(statusByStage[stage.id])}`}
            >
              <i aria-hidden="true" />
              <small>{stage.shortLabel}</small>
            </li>
          ))}
        </ol>
      </section>

      <section className="context-panel__section">
        <h2>项目上下文</h2>
        <strong>{project.name}</strong>
        <small className="context-panel__submeta">{session ? session.title : '未选择会话'}</small>
        <p>{project.objective}</p>
        <dl>
          <div>
            <dt>装置</dt>
            <dd>
              <span aria-hidden="true" className="context-panel__device-dot" />
              {space.device} · 模拟队列就绪
            </dd>
          </div>
          <div>
            <dt>文献</dt>
            <dd>{literatureCount} 篇</dd>
          </div>
          {report && (
            <div>
              <dt>报告</dt>
              <dd>{report.question}</dd>
            </div>
          )}
          {protocol && (
            <div>
              <dt>方案</dt>
              <dd>{protocol.reactionSystem}</dd>
            </div>
          )}
          {simulationRun && (
            <div>
              <dt>模拟</dt>
              <dd>
                {formatSimulationStatus(simulationRun.status)} · {simulationRun.yieldPercent}% 模拟收率
              </dd>
            </div>
          )}
        </dl>
      </section>

      <section className="context-panel__section">
        <h2>知识资产</h2>
        <div aria-label="知识资产状态" className="asset-pills" role="group">
          <span className={analysis ? 'asset-pill asset-pill--ready' : 'asset-pill'}>SciGraph</span>
          <span className={validation ? 'asset-pill asset-pill--ready' : 'asset-pill'}>LabOntology</span>
          <span className={experimentalGraph ? 'asset-pill asset-pill--ready' : 'asset-pill'}>Experimental Graph</span>
        </div>

        {analysis && (
          <div className="asset-block">
            <h3>SciGraph 证据链</h3>
            <div className="metric-row">
              <span>{analysis.entities.length} 个实体</span>
              <span>{analysis.evidence.length} 条证据链</span>
            </div>
            <ul>
              {analysis.publicKnowledge.slice(0, 2).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {validation && (
          <div className="asset-block">
            <h3>LabOntology 约束</h3>
            <strong>{formatValidationStatus(validation.status)}</strong>
            <ul>
              {validation.constraints.slice(0, 2).map((constraint) => (
                <li key={constraint}>{constraint}</li>
              ))}
            </ul>
          </div>
        )}

        {experimentalGraph && (
          <div className="asset-block">
            <h3>Experimental Graph 图谱</h3>
            <GraphView graph={experimentalGraph} />
          </div>
        )}
      </section>
    </aside>
  );
}
