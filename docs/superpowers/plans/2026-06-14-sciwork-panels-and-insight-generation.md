# SciWork 面板接真实后端 + 生成式产出 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把文献/图谱/结果/产物面板接到按空间隔离的真实后端，并给工作流 report/下一轮建议接上 provider 可配置、无 key 回退的 LLM 生成。

**Architecture:** Part 1 纯前端：右栏改标签式，4 个面板各用一个通用数据 hook 调现有 `sc.*` 工具。Part 2 在 SciWork 网关层 `spacesGateway` 拦截 `callTool('insight_generate')`（scicompass MCP 核心保持"零 LLM"），由一个 provider 可配置的 LLM 适配器生成；无 key 时回退到确定性摘要。

**Tech Stack:** React + TS + Vitest（前端）；Node + MCP + `@anthropic-ai/sdk`（后端网关）。

**关联 spec：** [2026-06-14-sciwork-panels-and-insight-generation-design.md](../specs/2026-06-14-sciwork-panels-and-insight-generation-design.md)

**两阶段：** Phase 1（面板，低风险、独立可交付）→ Phase 2（生成式）。

---

## 文件结构

**Phase 1 新建：**
- `src/hooks/useProjectResource.ts` — 通用异步资源 hook（{data,loading,error,reload}），4 个面板共用（DRY，取代 spec 里 4 个同构 hook）。
- `src/hooks/useProjectResource.test.tsx`
- `src/components/panels/LiteraturePanel.tsx` / `GraphPanel.tsx` / `ResultsPanel.tsx` / `ArtifactsPanel.tsx`
- `src/components/panels/RightPanel.tsx` — 标签容器（上下文/文献/图谱/结果/产物）
- `src/components/panels/RightPanel.test.tsx`、`src/components/panels/panels.css`

**Phase 1 修改：**
- `src/services/scicompassClient.ts` — 给 `sc` 补 `insightGenerate`（Phase 2 用）；确认 `literatureSearch/resultList/artifactList/graphQuery` 已有。
- `src/components/SessionWorkspace.tsx` — 用 `RightPanel` 取代直接渲染 `ContextPanel`。

**Phase 2 新建：**
- `scicompass/packages/cli/src/insight/insightProvider.ts` — LLM 适配器（provider 可配置 + 无 key 回退）。
- `scicompass/packages/cli/src/insight/insightProvider.test.ts`

**Phase 2 修改：**
- `scicompass/packages/cli/package.json` — 加 `@anthropic-ai/sdk`。
- `scicompass/packages/cli/src/spacesGateway.ts` — `/api/call` 拦截 `insight_generate`。
- `scicompass/packages/cli/src/spacesGateway.test.ts` — 拦截 + 无 key 回退测试。
- `src/workflow/runStage.ts` — `scigraph-analysis`/`experimental-graph` 两阶段改调 `sc.insightGenerate`。
- `src/workflow/runStage.test.ts` — mock insightGenerate。

---

# Phase 1 — 面板接真实后端

## Task 1.1：通用数据 hook `useProjectResource`

**Files:**
- Create: `src/hooks/useProjectResource.ts`
- Test: `src/hooks/useProjectResource.test.tsx`

- [ ] **Step 1：写失败测试**

```tsx
import { renderHook, waitFor, act } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useProjectResource } from './useProjectResource';

afterEach(() => vi.restoreAllMocks());

it('加载成功返回 data 并结束 loading', async () => {
  const load = vi.fn().mockResolvedValue([{ id: 'a' }]);
  const { result } = renderHook(() => useProjectResource(load, ['p1']));
  expect(result.current.loading).toBe(true);
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.data).toEqual([{ id: 'a' }]);
  expect(result.current.error).toBeNull();
});

it('加载失败置 error', async () => {
  const load = vi.fn().mockRejectedValue(new Error('后端错误'));
  const { result } = renderHook(() => useProjectResource(load, ['p1']));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.error).toMatch(/后端错误/);
});

it('reload 重新拉取', async () => {
  const load = vi.fn().mockResolvedValue('x');
  const { result } = renderHook(() => useProjectResource(load, ['p1']));
  await waitFor(() => expect(result.current.loading).toBe(false));
  act(() => result.current.reload());
  await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
});
```

- [ ] **Step 2：跑测试确认失败**

Run: `npx vitest run src/hooks/useProjectResource.test.tsx`
Expected: FAIL（模块不存在）

- [ ] **Step 3：实现**

```ts
import { useEffect, useState, useCallback } from 'react';

export interface ResourceState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/** 通用项目数据 hook：deps 变化或 reload 时调用 load()，按空间隔离由 sc 客户端保证。 */
export function useProjectResource<T>(load: () => Promise<T>, deps: unknown[]): ResourceState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    load()
      .then((d) => { if (alive) setData(d); })
      .catch((e) => { if (alive) setError(String((e as Error)?.message ?? e)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { data, loading, error, reload };
}
```

- [ ] **Step 4：跑测试确认通过**

Run: `npx vitest run src/hooks/useProjectResource.test.tsx`
Expected: PASS（3 条）

- [ ] **Step 5：提交**

```bash
git add src/hooks/useProjectResource.ts src/hooks/useProjectResource.test.tsx
git commit -m "feat(hooks): generic useProjectResource for real-backed panels"
```

## Task 1.2：四个面板组件

**Files:**
- Create: `src/components/panels/LiteraturePanel.tsx`、`GraphPanel.tsx`、`ResultsPanel.tsx`、`ArtifactsPanel.tsx`、`panels.css`
- Test: `src/components/panels/LiteraturePanel.test.tsx`

- [ ] **Step 1：写失败测试（以文献面板为代表）**

```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { sc } from '../../services/scicompassClient';
import { LiteraturePanel } from './LiteraturePanel';

afterEach(() => vi.restoreAllMocks());
const project = { id: 'p1', spaceId: 's', name: 't', objective: '温和偶联', graphSlug: 'g1' };

it('渲染真实文献列表', async () => {
  vi.spyOn(sc, 'literatureSearch').mockResolvedValue({ hits: [{ id: 'l1', title: 'Allene coupling' }] });
  render(<LiteraturePanel project={project as any} />);
  expect(await screen.findByText('Allene coupling')).toBeInTheDocument();
});

it('导入 BibTeX 调 literature_import 并刷新', async () => {
  vi.spyOn(sc, 'literatureSearch').mockResolvedValue({ hits: [] });
  const imp = vi.spyOn(sc, 'literatureImport').mockResolvedValue({ imported: 1, ids: ['l9'] });
  render(<LiteraturePanel project={project as any} />);
  fireEvent.change(screen.getByLabelText(/BibTeX/), { target: { value: '@article{x, title={Y}}' } });
  fireEvent.click(screen.getByRole('button', { name: /导入/ }));
  await waitFor(() => expect(imp).toHaveBeenCalledWith('p1', '@article{x, title={Y}}'));
});
```

- [ ] **Step 2：跑测试确认失败**

Run: `npx vitest run src/components/panels/LiteraturePanel.test.tsx`
Expected: FAIL（模块不存在）

- [ ] **Step 3：实现 LiteraturePanel**

```tsx
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
    try { await sc.literatureImport(project.id, bibtex); setBibtex(''); reload(); } finally { setBusy(false); }
  }

  return (
    <div className="panel">
      <h3>私域文献（{hits.length}）</h3>
      {loading && <p className="panel__muted">加载中…</p>}
      {error && <p className="panel__err">{error}</p>}
      <ul className="panel__list">
        {hits.map((h) => <li key={h.id}><strong>{h.title ?? '—'}</strong><code>{h.id}</code></li>)}
        {!loading && hits.length === 0 && <li className="panel__muted">暂无文献，可在下方导入</li>}
      </ul>
      <label className="panel__field">
        <span>导入 BibTeX</span>
        <textarea value={bibtex} onChange={(e) => setBibtex(e.target.value)} rows={3} />
      </label>
      <button type="button" disabled={busy || !bibtex.trim()} onClick={onImport}>{busy ? '导入中…' : '导入'}</button>
    </div>
  );
}
```

- [ ] **Step 4：实现 GraphPanel / ResultsPanel / ArtifactsPanel**

`GraphPanel.tsx`（复用 GraphView，把 graph_query 节点映射为 ExperimentalGraph）：

```tsx
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
  const g = data as { nodes?: any[]; edges?: any[] } | null;
  const graph: ExperimentalGraph = {
    nodes: (g?.nodes ?? []).map((n: any): ExperimentalGraphNode => ({ id: n.id, type: (n.type ?? 'Observation') as ExperimentalGraphNode['type'], label: n.label ?? '—', detail: n.detail ?? '' })),
    edges: (g?.edges ?? []).map((e: any) => ({ id: e.id ?? `${e.source}-${e.target}`, source: e.source, target: e.target, label: e.label ?? '' }))
  };
  return (
    <div className="panel">
      <h3>项目图谱（{graph.nodes.length} 节点 / {graph.edges.length} 边）</h3>
      {loading && <p className="panel__muted">加载中…</p>}
      {error && <p className="panel__err">{error}</p>}
      {!loading && graph.nodes.length === 0 && <p className="panel__muted">图谱为空，运行工作流后回看</p>}
      {graph.nodes.length > 0 && <GraphView graph={graph} />}
    </div>
  );
}
```

`ResultsPanel.tsx`：

```tsx
import { useProjectResource } from '../../hooks/useProjectResource';
import { sc } from '../../services/scicompassClient';
import type { Project } from '../../domain/types';
import './panels.css';

export function ResultsPanel({ project }: { project: Project }) {
  const { data, loading, error } = useProjectResource(() => sc.resultList({ projectId: project.id }), [project.id]);
  const results = (data?.results ?? []) as Array<{ id: string; [k: string]: unknown }>;
  return (
    <div className="panel">
      <h3>运行结果（{results.length}）</h3>
      {loading && <p className="panel__muted">加载中…</p>}
      {error && <p className="panel__err">{error}</p>}
      <ul className="panel__list">
        {results.map((r) => <li key={r.id}><code>{r.id}</code></li>)}
        {!loading && results.length === 0 && <li className="panel__muted">暂无结果</li>}
      </ul>
    </div>
  );
}
```

`ArtifactsPanel.tsx`：

```tsx
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
        {artifacts.map((a) => <li key={a.id}><strong>{a.kind ?? '产物'}</strong><code>{a.uri ?? a.id}</code></li>)}
        {!loading && artifacts.length === 0 && <li className="panel__muted">暂无产物</li>}
      </ul>
    </div>
  );
}
```

`panels.css`（精简）：

```css
.panel { padding: 16px 18px; display: flex; flex-direction: column; gap: 10px; height: 100%; overflow-y: auto; }
.panel h3 { margin: 0; font-size: 14px; }
.panel__muted { color: #8693ad; font-size: 13px; }
.panel__err { color: #c0392b; font-size: 13px; }
.panel__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.panel__list li { display: flex; flex-direction: column; background: rgba(0,91,172,0.04); border: 1px solid var(--line, #e2e8f0); border-radius: 8px; padding: 8px 10px; }
.panel__list code { color: #65718a; font-size: 11px; }
.panel__field { display: grid; gap: 4px; font-size: 12px; color: #65718a; }
.panel__field textarea { width: 100%; resize: vertical; border-radius: 8px; border: 1px solid var(--line, #e2e8f0); padding: 6px; font-family: inherit; }
.panel button { align-self: flex-start; height: 32px; padding: 0 14px; border: 0; border-radius: 8px; background: #005bac; color: #fff; cursor: pointer; }
.panel button[disabled] { opacity: 0.5; cursor: not-allowed; }
```

- [ ] **Step 5：跑测试确认通过**

Run: `npx vitest run src/components/panels/LiteraturePanel.test.tsx`
Expected: PASS（2 条）

- [ ] **Step 6：提交**

```bash
git add src/components/panels/
git commit -m "feat(panels): real-backed literature/graph/results/artifacts panels"
```

## Task 1.3：右栏标签容器 RightPanel + 接入 SessionWorkspace

**Files:**
- Create: `src/components/panels/RightPanel.tsx`、`src/components/panels/RightPanel.test.tsx`
- Modify: `src/components/SessionWorkspace.tsx`

- [ ] **Step 1：写失败测试**

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { sc } from '../../services/scicompassClient';
import { RightPanel } from './RightPanel';

afterEach(() => vi.restoreAllMocks());
const project = { id: 'p1', spaceId: 's', name: 't', objective: 'o', graphSlug: 'g1' } as any;
const ctx = <aside aria-label="任务进度与项目上下文">上下文内容</aside>;

it('默认显示上下文标签，切到文献加载真实文献', async () => {
  vi.spyOn(sc, 'literatureSearch').mockResolvedValue({ hits: [{ id: 'l1', title: '真实文献' }] });
  render(<RightPanel project={project} contextTab={ctx} />);
  expect(screen.getByText('上下文内容')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('tab', { name: '文献' }));
  expect(await screen.findByText('真实文献')).toBeInTheDocument();
});
```

- [ ] **Step 2：跑测试确认失败**

Run: `npx vitest run src/components/panels/RightPanel.test.tsx`
Expected: FAIL

- [ ] **Step 3：实现 RightPanel**

```tsx
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
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'is-active' : ''} onClick={() => setTab(t)}>{t}</button>
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
```

并在 `panels.css` 追加：

```css
.right-panel { display: flex; flex-direction: column; height: 100%; min-height: 0; overflow: hidden; background: linear-gradient(180deg,#fcfcfa,#f6f7f3); }
.right-panel__tabs { display: flex; gap: 2px; padding: 8px 8px 0; flex: none; }
.right-panel__tabs button { flex: 1; height: 30px; border: 0; border-radius: 8px 8px 0 0; background: transparent; color: #65718a; cursor: pointer; font-size: 12px; }
.right-panel__tabs button.is-active { background: #fff; color: #14233c; font-weight: 600; }
.right-panel__body { flex: 1; min-height: 0; overflow-y: auto; background: #fff; }
```

- [ ] **Step 4：接入 SessionWorkspace** — 把 [SessionWorkspace.tsx](../../../src/components/SessionWorkspace.tsx) 里的 `<ContextPanel .../>` 用 `RightPanel` 包起来（ContextPanel 作为「上下文」tab）：

```tsx
// import { RightPanel } from './panels/RightPanel';
// 把 return 里的 <ContextPanel ... /> 替换为：
<RightPanel
  project={project}
  contextTab={
    <ContextPanel
      project={project}
      session={session}
      space={space}
      activeStageId={workflow.stageState.activeStageId}
      statusByStage={workflow.stageState.statusByStage}
      artifacts={workflow.artifacts}
      literatureCount={literature.length}
    />
  }
/>
```

- [ ] **Step 5：跑测试 + typecheck**

Run: `npx vitest run src/components/panels/RightPanel.test.tsx` → PASS
Run: `npm run typecheck` → 通过

- [ ] **Step 6：提交**

```bash
git add src/components/panels/RightPanel.tsx src/components/panels/RightPanel.test.tsx src/components/panels/panels.css src/components/SessionWorkspace.tsx
git commit -m "feat(workspace): tabbed right panel hosting real-backed asset panels"
```

## Task 1.4：Phase 1 回归

- [ ] **Step 1：全前端测试 + typecheck**

Run: `npx vitest run`（前端）→ 全绿
Run: `npm run typecheck` → 通过

- [ ] **Step 2：端到端手测**（gateway+vite 在跑）：登录 → 选项目 → 右栏切「文献/图谱/结果/产物」看真实数据；导入一段 BibTeX 看文献刷新。

---

# Phase 2 — 生成式产出（insight_generate，网关层）

## Task 2.1：LLM 适配器 insightProvider（无 key 回退）

**Files:**
- Create: `scicompass/packages/cli/src/insight/insightProvider.ts`
- Test: `scicompass/packages/cli/src/insight/insightProvider.test.ts`

- [ ] **Step 1：写失败测试**

```ts
import { it, expect } from 'vitest';
import { generateInsight } from './insightProvider.js';

function fakeClient(nodes: any[]) {
  return { callTool: async () => ({ content: [{ text: JSON.stringify({ nodes }) }] }) } as any;
}

it('无 key → generated:false + 确定性摘要', async () => {
  const r = await generateInsight({ client: fakeClient([{ id: 'obj', type: 'Objective', label: '联烯偶联' }]), graph: 'g1', kind: 'report', env: {} });
  expect(r.generated).toBe(false);
  expect(r.text).toMatch(/联烯偶联|图谱/);
});

it('有 key 但 provider=anthropic 走真实路径（注入 mock 调用器）', async () => {
  const r = await generateInsight({
    client: fakeClient([]), graph: 'g1', kind: 'suggestion',
    env: { SCICOMPASS_LLM_PROVIDER: 'anthropic', SCICOMPASS_LLM_API_KEY: 'sk-x' },
    callLlm: async () => 'AI 建议文本'
  });
  expect(r.generated).toBe(true);
  expect(r.text).toBe('AI 建议文本');
});
```

- [ ] **Step 2：跑测试确认失败**

Run: `cd scicompass && npx vitest run insightProvider`
Expected: FAIL（模块不存在）

- [ ] **Step 3：实现 insightProvider** — 用可注入的 `callLlm`（测试不打真实 API；生产默认按 provider 选择 Anthropic/OpenAI 兼容）：

```ts
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';

export interface InsightResult { generated: boolean; text: string; items?: string[] }
export type InsightKind = 'report' | 'suggestion';

interface GraphSummary { count: number; objectives: string[]; evidence: string[] }

function summarize(nodes: any[]): GraphSummary {
  return {
    count: nodes.length,
    objectives: nodes.filter((n) => n.type === 'Objective').map((n) => String(n.label)),
    evidence: nodes.filter((n) => n.type === 'LiteratureEvidence').map((n) => String(n.label))
  };
}

function fallback(kind: InsightKind, s: GraphSummary): InsightResult {
  if (kind === 'report') {
    return {
      generated: false,
      text: `基于 ${s.count} 个图谱节点的确定性摘要：${s.objectives[0] ?? '研究目标'}；文献证据 ${s.evidence.length} 条。`,
      items: s.evidence.slice(0, 3).map((e) => `参考：${e}`)
    };
  }
  return { generated: false, text: `基于真实图谱（${s.count} 节点）的下一轮建议（摘要回退）。`, items: ['收窄条件搜索范围'] };
}

function buildPrompt(kind: InsightKind, s: GraphSummary, constraint?: string): string {
  const head = kind === 'report'
    ? '你是科研助手。基于以下项目知识图谱摘要，给出简洁的研究方向报告（中文，3-5 句 + 2-3 条候选方向，每条一行以"-"开头）。'
    : '你是科研助手。基于以下项目知识图谱摘要，给出下一轮实验的 2-3 条建议（中文，每条一行以"-"开头）。';
  return `${head}\n约束：${constraint ?? '无'}\n图谱：节点 ${s.count}，目标【${s.objectives.join('；')}】，证据【${s.evidence.join('；')}】`;
}

function extractItems(text: string): string[] {
  return text.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('-')).map((l) => l.replace(/^-\s*/, ''));
}

interface LlmConfig { provider: string; baseUrl?: string; model?: string; apiKey?: string }
function readConfig(env: Record<string, string | undefined>): LlmConfig {
  return {
    provider: env.SCICOMPASS_LLM_PROVIDER ?? 'none',
    baseUrl: env.SCICOMPASS_LLM_BASE_URL,
    model: env.SCICOMPASS_LLM_MODEL,
    apiKey: env.SCICOMPASS_LLM_API_KEY
  };
}

// 生产默认调用器：按 provider 选 Anthropic SDK 或 OpenAI 兼容 fetch。
async function defaultCallLlm(cfg: LlmConfig, prompt: string): Promise<string> {
  if (cfg.provider === 'anthropic') {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: cfg.apiKey });
    const msg = await client.messages.create({
      model: cfg.model ?? 'claude-opus-4-8',
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      messages: [{ role: 'user', content: prompt }]
    } as any);
    return (msg.content as any[]).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  }
  // openai-compatible（火山方舟/豆包、ZJU 内网、OpenAI）
  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({ model: cfg.model, messages: [{ role: 'user', content: prompt }] })
  });
  const json: any = await res.json();
  return json.choices?.[0]?.message?.content ?? '';
}

export async function generateInsight(opts: {
  client: Client;
  graph: string;
  kind: InsightKind;
  constraint?: string;
  env?: Record<string, string | undefined>;
  callLlm?: (cfg: LlmConfig, prompt: string) => Promise<string>;
}): Promise<InsightResult> {
  const cfg = readConfig(opts.env ?? process.env);
  // 上下文自取：用空间 MCP client 读真实项目图
  let nodes: any[] = [];
  try {
    const gq: any = await opts.client.callTool({ name: 'graph_query', arguments: { graph: opts.graph, limit: 50 } });
    nodes = JSON.parse(gq.content?.[0]?.text ?? '{}').nodes ?? [];
  } catch { nodes = []; }
  const s = summarize(nodes);

  const hasKey = cfg.provider !== 'none' && !!cfg.apiKey && (cfg.provider === 'anthropic' || !!cfg.baseUrl);
  if (!hasKey) return fallback(opts.kind, s);

  try {
    const call = opts.callLlm ?? defaultCallLlm;
    const text = await call(cfg, buildPrompt(opts.kind, s, opts.constraint));
    if (!text.trim()) return fallback(opts.kind, s);
    return { generated: true, text, items: extractItems(text) };
  } catch {
    return fallback(opts.kind, s); // 失败也回退，不阻塞工作流
  }
}
```

- [ ] **Step 4：跑测试确认通过**

Run: `cd scicompass && npx vitest run insightProvider`
Expected: PASS（2 条）

- [ ] **Step 5：加依赖** — 在 [package.json](../../../scicompass/packages/cli/package.json) `dependencies` 加：

```json
"@anthropic-ai/sdk": "^0.69.0"
```

Run: `cd scicompass && npm install`（或仓库根 `npm install`）

- [ ] **Step 6：提交**

```bash
git add scicompass/packages/cli/src/insight/ scicompass/packages/cli/package.json package-lock.json
git commit -m "feat(insight): provider-configurable LLM adapter with no-key fallback"
```

## Task 2.2：网关拦截 insight_generate

**Files:**
- Modify: `scicompass/packages/cli/src/spacesGateway.ts:97-108`
- Test: `scicompass/packages/cli/src/spacesGateway.test.ts`

- [ ] **Step 1：写失败测试** — 追加（默认无 key → 回退 generated:false）：

```ts
it('insight_generate 无 key 走网关回退（generated:false）', async () => {
  await post('/api/call', { space: 'fudan-xtalpi', name: 'project_create', arguments: { name: 'ins', objective: 'o' } });
  const a = await post('/api/call', { space: 'fudan-xtalpi', name: 'project_list', arguments: {} });
  const graph = a.json.data.projects[0].graphSlug;
  const { json } = await post('/api/call', { space: 'fudan-xtalpi', name: 'insight_generate', arguments: { kind: 'report', graph } });
  expect(json.ok).toBe(true);
  expect(json.data.generated).toBe(false);
  expect(typeof json.data.text).toBe('string');
});
```

- [ ] **Step 2：跑测试确认失败**

Run: `cd scicompass && npx vitest run spacesGateway`
Expected: FAIL（insight_generate 被透传给 MCP，返回 unknown tool 错误）

- [ ] **Step 3：在 /api/call 加拦截** — 在 [spacesGateway.ts](../../../scicompass/packages/cli/src/spacesGateway.ts) 顶部 import：

```ts
import { generateInsight } from './insight/insightProvider.js';
```

把 `/api/call` 分支里取到 `client` 之后、转发之前插入拦截：

```ts
if (body.name === 'insight_generate') {
  const a: any = body.arguments ?? {};
  const result = await generateInsight({
    client,
    graph: String(a.graph ?? ''),
    kind: a.kind === 'suggestion' ? 'suggestion' : 'report',
    constraint: a.constraint
  });
  send(res, 200, { ok: true, data: result });
  return;
}
```

- [ ] **Step 4：跑测试确认通过**

Run: `cd scicompass && npx vitest run spacesGateway`
Expected: PASS（含原有 + 新增 1 条）

- [ ] **Step 5：提交**

```bash
git add scicompass/packages/cli/src/spacesGateway.ts scicompass/packages/cli/src/spacesGateway.test.ts
git commit -m "feat(gateway): intercept insight_generate (keeps scicompass core LLM-free)"
```

## Task 2.3：前端 runStage 两阶段接 insight_generate

**Files:**
- Modify: `src/services/scicompassClient.ts`（加 `sc.insightGenerate`）
- Modify: `src/workflow/runStage.ts`（`scigraph-analysis`、`experimental-graph`）
- Test: `src/workflow/runStage.test.ts`

- [ ] **Step 1：客户端加便捷方法** — 在 [scicompassClient.ts](../../../src/services/scicompassClient.ts) 的 `sc` 对象加：

```ts
  insightGenerate: (kind: 'report' | 'suggestion', graph: string, constraint?: string) =>
    callTool<{ generated: boolean; text: string; items?: string[] }>('insight_generate', { kind, graph, constraint }),
```

- [ ] **Step 2：写失败测试** — 在 [runStage.test.ts](../../../src/workflow/runStage.test.ts) 追加：

```ts
it('scigraph-analysis 调 insightGenerate 填充 report', async () => {
  vi.spyOn(sc, 'graphQuery').mockResolvedValue({ nodes: [{ id: 'ev1', type: 'LiteratureEvidence', label: 'A' }], edges: [] });
  vi.spyOn(sc, 'insightGenerate').mockResolvedValue({ generated: true, text: 'AI 报告', items: ['方向一'] });
  const artifacts = { ...createEmptyArtifacts(), analysis: { entities: [], evidence: [{ id: 'e1', literatureId: 'l1', quote: '—', claim: 'A', confidence: 0 }], publicKnowledge: [] } };
  const out = await runStage('scigraph-analysis', { ...base, artifacts });
  expect(sc.insightGenerate).toHaveBeenCalledWith('report', 'g1', '');
  expect(out.artifacts.report?.designRationale).toBe('AI 报告');
  expect(out.artifacts.report?.candidateDirections).toEqual(['方向一']);
});
```

- [ ] **Step 3：跑测试确认失败**

Run: `npx vitest run src/workflow/runStage.test.ts`
Expected: FAIL（仍走本地汇总，未调 insightGenerate）

- [ ] **Step 4：改 runStage 两阶段** — `scigraph-analysis` 分支替换为：

```ts
case 'scigraph-analysis': {
  const analysis = required(artifacts.analysis, 'SciGraph 分析');
  const ins = await sc.insightGenerate('report', graph, constraint).catch(() => ({ generated: false, text: '', items: [] as string[] }));
  const report: ResearchReport = {
    question: project.objective || '研究问题',
    consensus: analysis.publicKnowledge.slice(0, 2),
    disagreements: [],
    uncertainties: [],
    candidateDirections: (ins.items ?? []).slice(0, 3),
    designRationale: ins.text || `基于真实图谱与 ${analysis.evidence.length} 条文献证据形成方向。`,
    evidenceIds: analysis.evidence.map((e) => e.id)
  };
  return { artifacts: { report }, message: ins.generated ? 'AI 生成研究方向报告。' : '读取真实图谱并汇总研究方向（摘要回退）。' };
}
```

`experimental-graph` 分支替换为：

```ts
case 'experimental-graph': {
  const eg = required(artifacts.experimentalGraph, 'Experimental Graph');
  const ins = await sc.insightGenerate('suggestion', graph).catch(() => ({ generated: false, text: '', items: [] as string[] }));
  const labels = ins.items && ins.items.length ? ins.items : ['收窄条件搜索范围'];
  const suggestions: NextSuggestion[] = labels.slice(0, 3).map((label, i) => ({
    id: `suggestion-${i + 1}`,
    label,
    rationale: ins.text || `基于真实图谱 ${eg.nodes.length} 个节点的回流结果。`,
    expectedImpact: '减少下一轮搜索空间，聚焦温和窗口。'
  }));
  return { artifacts: { suggestions }, message: ins.generated ? 'AI 生成下一轮建议。' : '基于真实回流图谱生成建议（摘要回退）。' };
}
```

- [ ] **Step 5：修已有全阶段测试** — `useWorkflowController.test.tsx` 的 `mockBackend()` 跑了全部阶段，runStage 现在会调 `insightGenerate`，需补 mock，否则真连后端失败。在 [useWorkflowController.test.tsx](../../../src/hooks/useWorkflowController.test.tsx) 的 `mockBackend()` 内加一行：

```ts
  vi.spyOn(sc, 'insightGenerate').mockResolvedValue({ generated: false, text: '', items: [] });
```

> App.test.tsx 的工作流测试只点「分析文献」(literature 阶段，不调 insightGenerate)，无需改。

- [ ] **Step 6：跑测试确认通过 + typecheck**

Run: `npx vitest run`（前端全量，含 runStage + useWorkflowController + App）→ 全绿
Run: `npm run typecheck` → 通过

- [ ] **Step 7：提交**

```bash
git add src/services/scicompassClient.ts src/workflow/runStage.ts src/workflow/runStage.test.ts src/hooks/useWorkflowController.test.tsx
git commit -m "feat(workflow): report/suggestion stages call insight_generate (AI or fallback)"
```

## Task 2.4：Phase 2 全量回归

- [ ] **Step 1：全部测试**

Run: `npx vitest run`（前端）→ 全绿
Run: `cd scicompass && npx vitest run` → 全绿

- [ ] **Step 2：typecheck 全量**

Run: `npm run typecheck` + `cd scicompass && npm run typecheck` → 通过

- [ ] **Step 3：端到端手测** — 不配 key：工作流 report/建议显示"摘要回退"且内容来自真实图谱。配 `SCICOMPASS_LLM_PROVIDER` + key（如火山方舟 OpenAI 兼容端点）后重启 sidecar：同两步显示"AI 生成"。

---

## 自审（plan vs spec）

- **spec Part 1**：标签式右面板(1.3)、文献/图谱/结果/产物面板(1.2)、通用 hook(1.1)、加载/空/错三态(各面板)。文献计数：现 ContextPanel 仍用 `literature.length`（上下文 tab），文献真实列表在文献 tab——满足"接真实"，侧栏计数保持现状（如需侧栏也真实，属小follow-up）。✓
- **spec Part 2**：网关拦截 insight_generate(2.2)、provider 可配置 + 无 key 回退(2.1)、两阶段接线 + 徽标经 message(2.3)。✓
- **架构约束**：scicompass MCP 核心零 LLM——LLM 只在网关 `insightProvider`(2.1/2.2)，未碰 serve.ts/registerKnowledge。✓
- **占位符扫描**：无 TBD；fallback/空态均有具体实现。✓
- **类型一致**：`InsightResult{generated,text,items?}` 贯穿后端(2.1)→网关(2.2)→前端 `sc.insightGenerate`(2.3)→runStage。✓
- **已知细节**：文献"列出"用 `literature_search`（宽查询）；若需"列全部"另加 `literature_list`（小后端改动，未纳入本计划）。`@anthropic-ai/sdk` 版本 `^0.69.0` 执行时以 `npm install` 实际解析为准。
