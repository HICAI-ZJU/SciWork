import { useProjectResource } from '../../hooks/useProjectResource';
import { sc } from '../../services/scicompassClient';
import type { Project } from '../../domain/types';
import './panels.css';

export function ResultsPanel({ project }: { project: Project }) {
  const { data, loading, error } = useProjectResource(() => sc.resultList({ projectId: project.id }), [project.id]);
  const results = (data?.results ?? []) as Array<{ id: string }>;
  return (
    <div className="panel">
      <h3>运行结果（{results.length}）</h3>
      {loading && <p className="panel__muted">加载中…</p>}
      {error && <p className="panel__err">{error}</p>}
      <ul className="panel__list">
        {results.map((r) => (
          <li key={r.id}>
            <code>{r.id}</code>
          </li>
        ))}
        {!loading && results.length === 0 && <li className="panel__muted">暂无结果</li>}
      </ul>
    </div>
  );
}
