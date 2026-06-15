import { UserRound } from 'lucide-react';
import type { Project, ScienceSession, StageStatus, WorkflowStageId } from '../domain/types';
import { themeAssets } from '../theme/assets';
import { formatStageStatus, formatValidationStatus } from '../workflow/presentation';
import type { WorkflowArtifacts } from '../workflow/runStage';
import { stageDefinitions } from '../workflow/stageMachine';
import { SciWorkPulseIcon } from './SciWorkPulseIcon';

interface AgentThreadProps {
  project: Project;
  session: ScienceSession | undefined;
  message: string;
  activeStageId: WorkflowStageId;
  statusByStage: Record<WorkflowStageId, StageStatus>;
  artifacts: WorkflowArtifacts;
}

export function AgentThread({
  project,
  session,
  message,
  activeStageId,
  statusByStage,
  artifacts
}: AgentThreadProps) {
  const activeStage = stageDefinitions.find((stage) => stage.id === activeStageId);
  const { analysis, report, protocol, validation, simulationRun, experimentalGraph, suggestions } = artifacts;

  return (
    <section className="agent-thread" aria-label="会话线程">
      <header className="agent-thread__header">
        <div>
          <span>当前项目</span>
          <h1>{project.name}</h1>
          <strong className="agent-thread__subtitle">{session ? session.title : '未选择会话'}</strong>
        </div>
        <div className="agent-thread__status">
          <strong>{activeStage?.label}</strong>
          <span>{formatStageStatus(statusByStage[activeStageId])}</span>
        </div>
      </header>

      <article className="thread-message thread-message--assistant">
        <div className="thread-message__avatar thread-message__avatar--assistant">
          <SciWorkPulseIcon
            imageSrc={themeAssets.assistantAvatar}
            state="thinking"
            title="SciWork 求是智核"
            tone="light"
          />
        </div>
        <div className="thread-message__body">
          <span className="thread-message__author">科学助手</span>
          <p>{message}</p>
        </div>
      </article>

      <article className="thread-message thread-message--user">
        <div className="thread-message__avatar">
          <UserRound size={18} />
        </div>
        <div className="thread-message__body">
          <span className="thread-message__author">研究目标</span>
          <p>{project.objective}</p>
        </div>
      </article>

      {analysis && (
        <article className="thread-block">
          <h2>SciGraph 文献分析</h2>
          <p>
            已从私域文献库映射 {analysis.entities.length} 个实体和 {analysis.evidence.length} 条证据链。
          </p>
        </article>
      )}

      {report && (
        <article className="thread-block">
          <h2>研究总结报告</h2>
          <p>{report.designRationale}</p>
          <ul>
            {report.candidateDirections.slice(0, 3).map((direction, i) => (
              <li key={`${i}-${direction}`}>{direction}</li>
            ))}
          </ul>
        </article>
      )}

      {protocol && (
        <article className="thread-block">
          <h2>实验方案设计</h2>
          <p>{protocol.objective}</p>
          <span>{protocol.steps.length} 个方案步骤已准备</span>
        </article>
      )}

      {validation && (
        <article className="thread-block">
          <h2>LabOntology 校验完成</h2>
          <p>状态：{formatValidationStatus(validation.status)}</p>
          <span>{validation.normalizedTerms.length} 个术语已规范化</span>
        </article>
      )}

      {simulationRun && (
        <article className="thread-block">
          <h2>模拟执行完成并生成观测结果</h2>
          <p>{simulationRun.interpretation}</p>
          <span>
            收率 {simulationRun.yieldPercent}% · 转化率 {simulationRun.conversionPercent}%
          </span>
        </article>
      )}

      {experimentalGraph && (
        <article className="thread-block">
          <h2>Experimental Graph 回流完成</h2>
          <p>
            已写入 {experimentalGraph.nodes.length} 个节点和 {experimentalGraph.edges.length} 条关系到实验记忆图谱。
          </p>
        </article>
      )}

      {suggestions.length > 0 && (
        <article className="thread-block">
          <h2>下一轮实验建议</h2>
          <ul className="thread-suggestions">
            {suggestions.map((suggestion) => (
              <li key={suggestion.id}>
                <strong>{suggestion.label}</strong>
                <span>{suggestion.rationale}</span>
                <span>{suggestion.expectedImpact}</span>
              </li>
            ))}
          </ul>
        </article>
      )}
    </section>
  );
}
