import { useProjectResource } from '../../hooks/useProjectResource';
import { sc } from '../../services/scicompassClient';
import { GraphView } from '../GraphView';
import type { ExperimentalGraph, ExperimentalGraphNode, Project } from '../../domain/types';
import './panels.css';

export function GraphPanel({ project }: { project: Project }) {
  const { data, loading, error } = useProjectResource(
    () => sc.graphQuery(project.graphSlug ?? '', { limit: 50 }),
    [project.graphSlug]
  );
  const g = data as { nodes?: unknown[]; edges?: unknown[] } | null;
  const graph: ExperimentalGraph = {
    nodes: ((g?.nodes ?? []) as Record<string, unknown>[]).map((n): ExperimentalGraphNode => ({
      id: String(n.id),
      type: (n.type ?? 'Observation') as ExperimentalGraphNode['type'],
      label: String(n.label ?? '—'),
      detail: String(n.detail ?? '')
    })),
    edges: ((g?.edges ?? []) as Record<string, unknown>[]).map((e) => ({
      id: String(e.id ?? `${e.source}-${e.target}`),
      source: String(e.source),
      target: String(e.target),
      label: String(e.label ?? '')
    }))
  };
  return (
    <div className="panel">
      <h3>
        项目图谱（{graph.nodes.length} 节点 / {graph.edges.length} 边）
      </h3>
      {loading && <p className="panel__muted">加载中…</p>}
      {error && <p className="panel__err">{error}</p>}
      {!loading && graph.nodes.length === 0 && <p className="panel__muted">图谱为空，运行工作流后回看</p>}
      {graph.nodes.length > 0 && <GraphView graph={graph} />}
    </div>
  );
}
