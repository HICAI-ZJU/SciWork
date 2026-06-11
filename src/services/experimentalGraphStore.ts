import type {
  ExperimentalGraph,
  LabOntologyValidation,
  LiteratureItem,
  Project,
  ProtocolDraft,
  ResearchReport,
  SciGraphAnalysis,
  SimulationRunResult
} from '../domain/types';

export interface WorkflowGraphInput {
  project: Project;
  literature: LiteratureItem[];
  analysis: SciGraphAnalysis;
  report: ResearchReport;
  protocol: ProtocolDraft;
  validation: LabOntologyValidation;
  run: SimulationRunResult;
}

export function buildExperimentalGraph(input: WorkflowGraphInput): ExperimentalGraph {
  const objectiveNode = {
    id: 'node-objective',
    type: 'Objective' as const,
    label: input.project.name,
    detail: input.project.objective
  };

  const literatureNodes = input.analysis.evidence.map((evidence) => ({
    id: `node-${evidence.id}`,
    type: 'LiteratureEvidence' as const,
    label: evidence.claim,
    detail: evidence.quote
  }));

  const entityNodes = input.analysis.entities.map((entity) => ({
    id: `node-${entity.id}`,
    type: 'SciGraphEntity' as const,
    label: entity.label,
    detail: `${entity.type} 置信度 ${Math.round(entity.confidence * 100)}%`
  }));

  const reportNode = {
    id: 'node-report',
    type: 'ReportClaim' as const,
    label: '研究总结报告',
    detail: input.report.designRationale
  };

  const protocolNode = {
    id: 'node-protocol',
    type: 'Protocol' as const,
    label: input.protocol.reactionSystem,
    detail: `${input.protocol.parameters.temperature}, ${input.protocol.parameters.reactionTime}`
  };

  const constraintNodes = input.validation.constraints.map((constraint, index) => ({
    id: `node-constraint-${index + 1}`,
    type: 'OntologyConstraint' as const,
    label: `LabOntology 约束 ${index + 1}`,
    detail: constraint
  }));

  const runNode = {
    id: 'node-run',
    type: 'SimulationRun' as const,
    label: input.run.id,
    detail: input.run.status
  };

  const observationNodes = input.run.events.map((event) => ({
    id: `node-${event.id}`,
    type: 'Observation' as const,
    label: event.label,
    detail: event.detail
  }));

  const resultNode = {
    id: 'node-result',
    type: 'Result' as const,
    label: `${input.run.yieldPercent}% 模拟收率`,
    detail: input.run.interpretation
  };

  const suggestionNode = {
    id: 'node-next-suggestion',
    type: 'NextSuggestion' as const,
    label: '收窄溶剂和催化剂用量',
    detail: '围绕最佳模拟溶剂和更低催化剂用量开展更小规模的下一轮筛选。'
  };

  return {
    nodes: [
      objectiveNode,
      ...literatureNodes,
      ...entityNodes,
      reportNode,
      protocolNode,
      ...constraintNodes,
      runNode,
      ...observationNodes,
      resultNode,
      suggestionNode
    ],
    edges: [
      ...literatureNodes.map((node) => ({
        id: `edge-${node.id}-report`,
        source: node.id,
        target: reportNode.id,
        label: 'supports'
      })),
      ...entityNodes.map((node) => ({
        id: `edge-${node.id}-report`,
        source: node.id,
        target: reportNode.id,
        label: 'aligns'
      })),
      { id: 'edge-objective-report', source: objectiveNode.id, target: reportNode.id, label: 'frames' },
      { id: 'edge-report-protocol', source: reportNode.id, target: protocolNode.id, label: 'drives' },
      ...constraintNodes.map((node) => ({
        id: `edge-${node.id}-protocol`,
        source: node.id,
        target: protocolNode.id,
        label: 'validates'
      })),
      { id: 'edge-protocol-run', source: protocolNode.id, target: runNode.id, label: 'simulates' },
      ...observationNodes.map((node) => ({
        id: `edge-${node.id}-run`,
        source: runNode.id,
        target: node.id,
        label: 'emits'
      })),
      { id: 'edge-run-result', source: runNode.id, target: resultNode.id, label: 'produces' },
      { id: 'edge-result-suggestion', source: resultNode.id, target: suggestionNode.id, label: 'informs' }
    ]
  };
}
