import type { ExperimentalGraph } from '../domain/types';

interface GraphViewProps {
  graph: ExperimentalGraph | null;
}

export function GraphView({ graph }: GraphViewProps) {
  if (!graph) {
    return <div className="graph-empty">Experimental Graph 会在模拟结果回流后出现。</div>;
  }

  const typeLabels: Record<string, string> = {
    Objective: '研究目标',
    LiteratureEvidence: '文献证据',
    SciGraphEntity: 'SciGraph 实体',
    ReportClaim: '报告结论',
    Protocol: '实验方案',
    OntologyConstraint: 'Ontology 约束',
    SimulationRun: '模拟执行',
    Observation: '观测结果',
    Result: '结果',
    NextSuggestion: '下一轮建议'
  };

  return (
    <div className="graph-view">
      <div className="graph-summary">
        <span>{graph.nodes.length} 个节点</span>
        <span>{graph.edges.length} 条关系</span>
      </div>
      <div className="graph-node-list">
        {graph.nodes.slice(0, 10).map((node) => (
          <div className="graph-node" key={node.id}>
            <strong>{typeLabels[node.type] ?? node.type}</strong>
            <span>{node.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
