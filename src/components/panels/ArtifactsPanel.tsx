import { useProjectResource } from '../../hooks/useProjectResource';
import { sc } from '../../services/scicompassClient';
import type { Project } from '../../domain/types';
import './panels.css';

export function ArtifactsPanel({ project }: { project: Project }) {
  const { data, loading, error } = useProjectResource(() => sc.artifactList(project.id), [project.id]);
  const artifacts = (data?.artifacts ?? []) as Array<{ id: string; uri?: string; kind?: string }>;
  return (
    <div className="panel">
      <h3>产物（{artifacts.length}）</h3>
      {loading && <p className="panel__muted">加载中…</p>}
      {error && <p className="panel__err">{error}</p>}
      <ul className="panel__list">
        {artifacts.map((a) => (
          <li key={a.id}>
            <strong>{a.kind ?? '产物'}</strong>
            <code>{a.uri ?? a.id}</code>
          </li>
        ))}
        {!loading && artifacts.length === 0 && <li className="panel__muted">暂无产物</li>}
      </ul>
    </div>
  );
}
