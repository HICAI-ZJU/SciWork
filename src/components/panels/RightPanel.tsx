import { useState, type ReactNode } from 'react';
import type { Project } from '../../domain/types';
import { LiteraturePanel } from './LiteraturePanel';
import { GraphPanel } from './GraphPanel';
import { ResultsPanel } from './ResultsPanel';
import { ArtifactsPanel } from './ArtifactsPanel';
import './panels.css';

type Tab = '上下文' | '文献' | '图谱' | '结果' | '产物';
const TABS: Tab[] = ['上下文', '文献', '图谱', '结果', '产物'];

export function RightPanel({ project, contextTab }: { project: Project; contextTab: ReactNode }) {
  const [tab, setTab] = useState<Tab>('上下文');
  return (
    <aside className="right-panel" aria-label="项目资产">
      <div className="right-panel__tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? 'is-active' : ''}
            onClick={() => setTab(t)}
            type="button"
          >
            {t}
          </button>
        ))}
      </div>
      <div className="right-panel__body">
        {tab === '上下文' && contextTab}
        {tab === '文献' && <LiteraturePanel project={project} />}
        {tab === '图谱' && <GraphPanel project={project} />}
        {tab === '结果' && <ResultsPanel project={project} />}
        {tab === '产物' && <ArtifactsPanel project={project} />}
      </div>
    </aside>
  );
}
