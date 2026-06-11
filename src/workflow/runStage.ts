import type {
  ExperimentalGraph,
  LabOntologyValidation,
  LiteratureItem,
  NextSuggestion,
  Project,
  ProtocolDraft,
  ResearchReport,
  SciGraphAnalysis,
  SimulationRunResult,
  WorkflowStageId
} from '../domain/types';
import { buildExperimentalGraph } from '../services/experimentalGraphStore';
import { validateProtocol } from '../services/labOntologyAdapter';
import { designProtocol } from '../services/protocolDesigner';
import { generateResearchReport } from '../services/reportService';
import { analyzeLiterature } from '../services/scigraphAdapter';
import { runSimulation } from '../services/simulationEngine';

/** 一次会话内逐阶段累积的科学产物。 */
export interface WorkflowArtifacts {
  analysis: SciGraphAnalysis | null;
  report: ResearchReport | null;
  protocol: ProtocolDraft | null;
  validation: LabOntologyValidation | null;
  simulationRun: SimulationRunResult | null;
  experimentalGraph: ExperimentalGraph | null;
  suggestions: NextSuggestion[];
}

export function createEmptyArtifacts(): WorkflowArtifacts {
  return {
    analysis: null,
    report: null,
    protocol: null,
    validation: null,
    simulationRun: null,
    experimentalGraph: null,
    suggestions: []
  };
}

/** 终态阶段没有可执行动作。 */
export type ActionableStageId = Exclude<WorkflowStageId, 'next-suggestion'>;

export interface StageInput {
  project: Project;
  literature: LiteratureItem[];
  artifacts: WorkflowArtifacts;
  constraint: string;
}

export interface StageOutcome {
  artifacts: Partial<WorkflowArtifacts>;
  message: string;
}

const defaultProtocolConstraint = '希望保持温和条件并缩短反应时间';

function required<T>(value: T | null, name: string): T {
  if (value === null) {
    throw new Error(`工作流前置产物缺失：${name}`);
  }
  return value;
}

/**
 * 第一轮演示的阶段脚本：每个阶段做一件事，返回产物补丁和给用户的消息。
 * 阶段顺序由 stageMachine 保证，这里对前置产物做硬校验。
 */
export async function runStage(stageId: ActionableStageId, input: StageInput): Promise<StageOutcome> {
  const { project, literature, artifacts, constraint } = input;

  switch (stageId) {
    case 'literature': {
      const analysis = await analyzeLiterature(literature);
      return {
        artifacts: { analysis },
        message: 'SciGraph 已对齐文献实体和证据链。'
      };
    }

    case 'scigraph-analysis': {
      const analysis = required(artifacts.analysis, 'SciGraph 分析');
      const report = generateResearchReport(project, literature, analysis);
      return {
        artifacts: { report },
        message: '已基于私域文献和 SciGraph 证据生成研究总结报告。'
      };
    }

    case 'report': {
      const report = required(artifacts.report, '研究总结报告');
      const protocol = designProtocol(report, constraint || defaultProtocolConstraint);
      return {
        artifacts: { protocol },
        message: '已根据研究报告和用户约束生成实验方案草案。'
      };
    }

    case 'protocol-design': {
      const protocol = required(artifacts.protocol, '实验方案');
      const validation = await validateProtocol(protocol);
      return {
        artifacts: { validation },
        message: 'LabOntology 校验完成，并标记当前流程仅允许模拟执行。'
      };
    }

    case 'labontology-check': {
      const protocol = required(artifacts.protocol, '实验方案');
      const simulationRun = await runSimulation(protocol);
      return {
        artifacts: { simulationRun },
        message: '模拟执行完成，已生成实验观测结果。'
      };
    }

    case 'simulation': {
      const experimentalGraph = buildExperimentalGraph({
        project,
        literature,
        analysis: required(artifacts.analysis, 'SciGraph 分析'),
        report: required(artifacts.report, '研究总结报告'),
        protocol: required(artifacts.protocol, '实验方案'),
        validation: required(artifacts.validation, 'LabOntology 校验'),
        run: required(artifacts.simulationRun, '模拟执行结果')
      });
      return {
        artifacts: { experimentalGraph },
        message: 'Experimental Graph 回流完成。'
      };
    }

    case 'experimental-graph': {
      const suggestions: NextSuggestion[] = [
        {
          id: 'suggestion-001',
          label: '收窄溶剂候选范围',
          rationale: '模拟运行显示当前温和温度窗口下转化率较稳定。',
          expectedImpact: '在保持收率置信度的同时减少下一轮搜索空间。'
        },
        {
          id: 'suggestion-002',
          label: '测试更低催化剂用量',
          rationale: '私域文献提示存在降本空间，但需要关注批次波动。',
          expectedImpact: '若转化率保持在 80% 以上，可改善成本表现。'
        }
      ];
      return {
        artifacts: { suggestions },
        message: '已基于 Experimental Graph 生成下一轮实验建议。'
      };
    }
  }
}
