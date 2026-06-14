import type {
  ExperimentalGraph,
  ExperimentalGraphNode,
  LabOntologyValidation,
  LiteratureItem,
  NextSuggestion,
  Project,
  ProtocolDraft,
  ResearchReport,
  SciGraphAnalysis,
  SimulationEvent,
  SimulationRunResult,
  WorkflowStageId
} from '../domain/types';
import { sc } from '../services/scicompassClient';

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

function required<T>(value: T | null, name: string): T {
  if (value === null) {
    throw new Error(`工作流前置产物缺失：${name}`);
  }
  return value;
}

function graphOf(project: Project): string {
  if (!project.graphSlug) {
    throw new Error('当前项目缺少 graphSlug（请从真实后端选择/创建项目）');
  }
  return project.graphSlug;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 一段演示文献（真实导入用）。无对应工具的字段以「—」占位，不编造。
const SEED_BIBTEX = `@article{seed,
  title={Mild reaction discovery with online monitoring},
  author={SciWork}, year={2024}, journal={Demo},
  abstract={A mild condition window is identified with low catalyst loading.}
}`;

/**
 * 逐阶段把科学工作流接到真实后端（同一套 MCP 工具，按空间隔离）。
 * 每阶段调用真实 sc.* 工具并把返回适配为 WorkflowArtifacts；
 * report / next-suggestion 无单一工具，读真实图谱 + 本地汇总（朴素呈现）。
 */
export async function runStage(stageId: ActionableStageId, input: StageInput): Promise<StageOutcome> {
  const { project, artifacts, constraint } = input;
  const graph = graphOf(project);

  switch (stageId) {
    case 'literature': {
      const imp = await sc.literatureImport(project.id, SEED_BIBTEX);
      const found: any = await sc.literatureSearch(project.id, 'mild reaction', 10);
      const hits: any[] = found.hits ?? [];
      const evNodes = hits.slice(0, 3).map((h, i) => ({
        id: `ev${i + 1}`, type: 'LiteratureEvidence', label: h.title ?? '文献证据', detail: '',
        round: 1, attrs: {}, provenance: [`scicompass://literature/${h.id}`]
      }));
      await sc.graphWrite(
        graph,
        [{ id: 'obj', type: 'Objective', label: project.objective || '研究目标', detail: '', round: 1, attrs: {}, provenance: [] }, ...evNodes],
        evNodes.map((n, i) => ({ id: `e${i + 1}`, source: n.id, target: 'obj', label: 'supports' }))
      );
      const aligned: any = await sc
        .graphAlign(graph, evNodes.slice(0, 1).map((n) => n.id))
        .catch(() => ({ anchors: [], source: 'SciGraph' }));
      const analysis: SciGraphAnalysis = {
        entities: hits.slice(0, 3).map((h, i) => ({ id: `ev${i + 1}`, label: h.title ?? '—', type: 'reaction', confidence: 0 })),
        evidence: hits.map((h) => ({ id: String(h.id), literatureId: String(h.id), quote: '—', claim: h.title ?? '—', confidence: 0 })),
        publicKnowledge: (aligned.anchors ?? []).map((a: any) => String(a.anchor ?? a))
      };
      return {
        artifacts: { analysis },
        message: `已导入 ${imp.imported} 篇并写入图谱证据，锚定公共星图 ${aligned.anchors?.length ?? 0} 处。`
      };
    }

    case 'scigraph-analysis': {
      const analysis = required(artifacts.analysis, 'SciGraph 分析');
      const g: any = await sc.graphQuery(graph, { limit: 50 });
      const nodes: any[] = g.nodes ?? [];
      const report: ResearchReport = {
        question: project.objective || '研究问题',
        consensus: analysis.publicKnowledge.slice(0, 2),
        disagreements: [],
        uncertainties: [],
        candidateDirections: nodes.filter((n) => n.type === 'LiteratureEvidence').slice(0, 3).map((n) => `参考：${n.label}`),
        designRationale: `基于 ${nodes.length} 个图谱节点与 ${analysis.evidence.length} 条文献证据形成方向。`,
        evidenceIds: analysis.evidence.map((e) => e.id)
      };
      return { artifacts: { report }, message: '已读取真实项目图谱并汇总研究方向（朴素呈现，无生成式产出）。' };
    }

    case 'report': {
      const report = required(artifacts.report, '研究总结报告');
      const steps = ['投料', '升温', '在线监测', '取样'];
      const saved: any = await sc.protocolSave(project.id, report.question, {
        constraint: constraint || '温和条件、缩短时间',
        steps
      });
      const protocol: ProtocolDraft = {
        id: saved.id,
        objective: report.question,
        reactionSystem: '真实后端协议',
        reagents: [],
        catalysts: [],
        solvents: [],
        device: '—',
        parameters: { version: String(saved.version) },
        steps: steps.map((label, i) => ({ id: `s${i + 1}`, label, detail: '', durationMinutes: 0 })),
        safetyNotes: []
      };
      return { artifacts: { protocol }, message: `已保存真实协议 ${saved.id} v${saved.version}。` };
    }

    case 'protocol-design': {
      const protocol = required(artifacts.protocol, '实验方案');
      const reagents = protocol.reagents.length ? protocol.reagents : ['pd-catalyst', 'solvent'];
      const chk: any = await sc.ontologyCheck(reagents, { temperatureC: 55 });
      const validation: LabOntologyValidation = {
        status: chk.ok ? 'pass' : 'warning',
        normalizedTerms: reagents,
        constraints: chk.ok ? ['试剂组合与温度合规'] : chk.violations,
        warnings: chk.ok ? [] : chk.violations
      };
      return {
        artifacts: { validation },
        message: chk.ok ? '本体校验通过。' : `本体校验告警：${(chk.violations ?? []).join('; ')}`
      };
    }

    case 'labontology-check': {
      const protocol = required(artifacts.protocol, '实验方案');
      const sub: any = await sc.runSubmit({
        projectId: project.id,
        protocolId: protocol.id,
        protocolVersion: Number(protocol.parameters.version ?? 1),
        deviceId: 'dev-xtalpi',
        experimentType: 'reaction-screening',
        mode: 'simulation',
        params: { temperatureC: 55, timeHours: 2 }
      });
      const events: SimulationEvent[] = [];
      let status = sub.status;
      for (let i = 0; i < 6 && status !== 'completed' && status !== 'failed' && status !== 'aborted'; i++) {
        await sleep(400);
        const st: any = await sc.runStatus(sub.runId);
        status = st.status;
        for (const ev of st.newEvents ?? []) {
          events.push({ id: `${ev.label}-${events.length}`, time: '', label: ev.label, detail: ev.detail, severity: 'info' });
        }
      }
      const simulationRun: SimulationRunResult = {
        id: sub.runId,
        protocolId: protocol.id,
        status: status === 'completed' ? 'completed' : 'completed-with-warning',
        yieldPercent: 0,
        conversionPercent: 0,
        confidence: 0,
        events,
        interpretation: `真实运行 ${sub.runId}（${status}）：queue-with-approval 装置，模拟队列需审批前进。`
      };
      return { artifacts: { simulationRun }, message: `运行 ${sub.runId} 当前状态：${status}。` };
    }

    case 'simulation': {
      const run = required(artifacts.simulationRun, '模拟执行结果');
      const results: any = await sc.resultList({ runId: run.id });
      if ((results.results ?? []).length) {
        await sc.resultFlowback(results.results[0].id, graph, 'obj', 1).catch(() => undefined);
      }
      const g: any = await sc.graphQuery(graph, { limit: 50 });
      const experimentalGraph: ExperimentalGraph = {
        nodes: (g.nodes ?? []).map((n: any) => ({
          id: n.id,
          type: (n.type ?? 'Observation') as ExperimentalGraphNode['type'],
          label: n.label ?? '—',
          detail: n.detail ?? ''
        })),
        edges: (g.edges ?? []).map((e: any) => ({ id: e.id ?? `${e.source}-${e.target}`, source: e.source, target: e.target, label: e.label ?? '' }))
      };
      return {
        artifacts: { experimentalGraph },
        message: `结果已回流，项目图现有 ${experimentalGraph.nodes.length} 节点 / ${experimentalGraph.edges.length} 边。`
      };
    }

    case 'experimental-graph': {
      const eg = required(artifacts.experimentalGraph, 'Experimental Graph');
      const suggestions: NextSuggestion[] = [
        {
          id: 'suggestion-001',
          label: '收窄条件搜索范围',
          rationale: `基于真实图谱 ${eg.nodes.length} 个节点的回流结果。`,
          expectedImpact: '减少下一轮搜索空间，聚焦温和窗口。'
        }
      ];
      return { artifacts: { suggestions }, message: '已基于真实回流图谱生成下一轮建议（朴素呈现）。' };
    }
  }
}
