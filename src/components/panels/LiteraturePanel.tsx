import { useState } from 'react';
import { useProjectResource } from '../../hooks/useProjectResource';
import { sc } from '../../services/scicompassClient';
import type { Project } from '../../domain/types';
import './panels.css';

export function LiteraturePanel({ project }: { project: Project }) {
  const { data, loading, error, reload } = useProjectResource(
    () => sc.literatureSearch(project.id, project.objective || 'reaction', 30),
    [project.id]
  );
  const [bibtex, setBibtex] = useState('');
  const [busy, setBusy] = useState(false);
  const hits = (data?.hits ?? []) as Array<{ id: string; title?: string }>;

  async function onImport() {
    if (!bibtex.trim()) return;
    setBusy(true);
    try {
      await sc.literatureImport(project.id, bibtex);
      setBibtex('');
      reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel">
      <h3>私域文献（{hits.length}）</h3>
      {loading && <p className="panel__muted">加载中…</p>}
      {error && <p className="panel__err">{error}</p>}
      <ul className="panel__list">
        {hits.map((h) => (
          <li key={h.id}>
            <strong>{h.title ?? '—'}</strong>
            <code>{h.id}</code>
          </li>
        ))}
        {!loading && hits.length === 0 && <li className="panel__muted">暂无文献，可在下方导入</li>}
      </ul>
      <label className="panel__field">
        <span>导入 BibTeX</span>
        <textarea value={bibtex} onChange={(e) => setBibtex(e.target.value)} rows={3} />
      </label>
      <button type="button" disabled={busy || !bibtex.trim()} onClick={onImport}>
        {busy ? '导入中…' : '导入'}
      </button>
    </div>
  );
}
