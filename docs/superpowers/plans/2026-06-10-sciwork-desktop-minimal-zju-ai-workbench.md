# SciWork Desktop Minimal ZJU AI Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the current SciWork Desktop shell into a minimal Chinese ZJU-style AI scientist workbench with a clear scientific space -> project -> session hierarchy.

**Architecture:** Keep the existing Electron + React + Vite app and three-pane layout. Localize presentation data and UI strings, hide the native Electron menu, reuse existing theme/IP assets, and keep the existing mock scientific workflow logic intact.

**Tech Stack:** Electron, React, TypeScript, Vite, Vitest, Testing Library, lucide-react.

---

## File Structure

- Modify `electron/main.ts`: hide Electron native menu and keep current window loading flow.
- Modify `src/workflow/stageMachine.ts`: change stage labels from English to Chinese while preserving stage IDs and order.
- Create `src/workflow/presentation.ts`: shared Chinese status formatters for stage, validation, and simulation statuses.
- Modify `src/domain/demoData.ts`: localize visible scientific space, device, policy, project objective, literature titles, abstracts, sources, and evidence tags.
- Modify `src/services/*.ts`: localize visible mock outputs while preserving object shapes and deterministic test behavior.
- Modify `src/hooks/useWorkflowController.ts`: localize runtime assistant messages and next suggestions.
- Modify `src/components/Sidebar.tsx`: rebuild left navigation around scientific space, project directory, and sessions.
- Modify `src/components/AgentThread.tsx`: localize thread text and use the IP avatar for assistant identity.
- Modify `src/components/ContextPanel.tsx`: localize right context panel and compress current task status.
- Modify `src/components/Composer.tsx`: localize composer labels, actions, slash palette, and add a small assistant IP dock.
- Modify `src/components/CharacterCue.tsx`: localize the reusable IP cue component if used by the composer.
- Modify `src/components/GraphView.tsx`: localize graph empty state and node/edge metrics.
- Modify `src/App.tsx`: pass the assistant avatar into the composer.
- Modify `src/App.css`: reduce visual noise, strengthen dark ZJU left pane, keep light center/right panes, style the hierarchy and IP dock.
- Modify tests in `src/App.test.tsx`, `src/components/Composer.test.tsx`, and `src/services/sciencePipeline.test.ts`: update Chinese assertions and keep slash behavior/workflow progression covered.

This workspace is not a Git repository, so commit steps are replaced with local verification checkpoints.

---

### Task 1: Hide Native Menu And Centralize Chinese Status Labels

**Files:**
- Modify: `electron/main.ts`
- Modify: `src/workflow/stageMachine.ts`
- Create: `src/workflow/presentation.ts`

- [ ] **Step 1: Add the presentation formatter test coverage inside existing UI tests**

Use existing App/Composer tests to assert Chinese status text appears in the rendered shell after Task 3 and Task 4. No separate unit test is required because the formatter is a small presentation helper used through visible UI.

- [ ] **Step 2: Hide the Electron native menu**

In `electron/main.ts`, import `Menu` and configure the window as follows:

```ts
import { app, BrowserWindow, Menu } from 'electron';
```

Inside `createWindow()`, call:

```ts
Menu.setApplicationMenu(null);
```

Add window options:

```ts
autoHideMenuBar: true,
```

After constructing `BrowserWindow`, call:

```ts
window.setMenuBarVisibility(false);
```

- [ ] **Step 3: Localize stage labels**

Replace `stageDefinitions` labels in `src/workflow/stageMachine.ts` with:

```ts
export const stageDefinitions = [
  { id: 'literature', label: '私域文献库', shortLabel: '文献库', evidenceMode: 'scigraph' },
  { id: 'scigraph-analysis', label: 'SciGraph 文献分析', shortLabel: 'SciGraph', evidenceMode: 'scigraph' },
  { id: 'report', label: '研究总结报告', shortLabel: '报告', evidenceMode: 'scigraph' },
  { id: 'protocol-design', label: '实验方案设计', shortLabel: '方案', evidenceMode: 'labontology' },
  { id: 'labontology-check', label: 'LabOntology 校验', shortLabel: '校验', evidenceMode: 'labontology' },
  { id: 'simulation', label: '模拟执行', shortLabel: '模拟', evidenceMode: 'experimental-graph' },
  { id: 'experimental-graph', label: 'Experimental Graph 回流', shortLabel: '图谱', evidenceMode: 'experimental-graph' },
  { id: 'next-suggestion', label: '下一轮建议', shortLabel: '建议', evidenceMode: 'experimental-graph' }
] as const satisfies readonly StageDefinition[];
```

- [ ] **Step 4: Add shared Chinese formatters**

Create `src/workflow/presentation.ts`:

```ts
import type { LabOntologyValidation, SimulationRunResult, StageStatus } from '../domain/types';

export function formatStageStatus(status: StageStatus): string {
  const labels: Record<StageStatus, string> = {
    'not-started': '未开始',
    'in-progress': '进行中',
    completed: '已完成',
    'needs-approval': '待审批',
    'needs-revision': '需修订',
    warning: '有提示'
  };

  return labels[status];
}

export function formatValidationStatus(status: LabOntologyValidation['status']): string {
  const labels: Record<LabOntologyValidation['status'], string> = {
    pass: '通过',
    warning: '有提示',
    'needs-revision': '需修订'
  };

  return labels[status];
}

export function formatSimulationStatus(status: SimulationRunResult['status']): string {
  const labels: Record<SimulationRunResult['status'], string> = {
    completed: '已完成',
    'completed-with-warning': '完成，有提示'
  };

  return labels[status];
}
```

- [ ] **Step 5: Run TypeScript check for this task**

Run: `npm run typecheck`

Expected: TypeScript passes after later import updates are complete. If it fails at this point because components still import local `formatStatus`, continue to the component tasks and run the full build at the end.

---

### Task 2: Localize Demo Data And Mock Service Outputs

**Files:**
- Modify: `src/domain/demoData.ts`
- Modify: `src/services/scigraphAdapter.ts`
- Modify: `src/services/reportService.ts`
- Modify: `src/services/protocolDesigner.ts`
- Modify: `src/services/labOntologyAdapter.ts`
- Modify: `src/services/simulationEngine.ts`
- Modify: `src/services/experimentalGraphStore.ts`
- Modify: `src/hooks/useWorkflowController.ts`
- Modify test: `src/services/sciencePipeline.test.ts`

- [ ] **Step 1: Localize scientific space and project data**

Update `demoSpace` and `demoProject` visible values:

```ts
export const demoSpace: ScientificSpace = {
  id: 'fudan-xtalpi-chemistry',
  name: '自动化反应发现空间',
  domain: '面向温和合成条件优化的科学装置',
  device: '复旦-晶泰自动化反应平台',
  policy: 'Queue With Approval'
};

export const demoProject: Project = {
  id: 'mild-cross-coupling-demo',
  spaceId: demoSpace.id,
  name: '温和条件下偶联反应优化演示项目',
  objective: '寻找温和、短时、转化稳定且证据链可追溯的偶联反应条件。'
};
```

- [ ] **Step 2: Localize literature demo items**

Translate each `title`, `source`, `abstract`, and `evidenceTags` in `demoLiterature`. Preserve IDs and years. Example shape:

```ts
{
  id: 'lit-001',
  title: '自动化偶联反应筛选中的溶剂效应',
  source: '私域文献笔记',
  year: 2024,
  abstract: '私域筛选记录显示，极性非质子溶剂在降低催化剂用量时仍能提升转化率，并保持可控杂质水平。',
  evidenceTags: ['溶剂', '转化率', '筛选']
}
```

- [ ] **Step 3: Localize service outputs**

Translate visible strings in service return values. Keep numeric values and IDs unchanged.

In `scigraphAdapter.ts`, use Chinese labels such as:

```ts
{ id: 'entity-reaction-cross-coupling', label: '偶联反应', type: 'reaction', confidence: 0.92 }
```

In `reportService.ts`, keep `evidenceIds` unchanged and translate `consensus`, `disagreements`, `uncertainties`, `candidateDirections`, and `designRationale`.

In `protocolDesigner.ts`, keep protocol ID unchanged and translate `reactionSystem`, reagent/catalyst/solvent labels, device, steps, and safety notes. Preserve `temperature: '55 C'` so existing scientific pipeline expectations remain stable.

In `labOntologyAdapter.ts`, translate `constraints` and `warnings`, but keep normalized term prefixes such as `Device:` and `Operation:` acceptable as ontology terms.

In `simulationEngine.ts`, translate event `label`, `detail`, and `interpretation`.

In `experimentalGraphStore.ts`, translate graph node labels/details and edge labels that are visible in GraphView.

- [ ] **Step 4: Localize workflow runtime messages and suggestions**

Update `useWorkflowController.ts` initial message and per-stage messages, for example:

```ts
const [message, setMessage] = useState('已进入私域文献库，准备启动 SciGraph 文献分析。');
```

Translate suggestion labels and impacts:

```ts
label: '收窄溶剂候选范围',
expectedImpact: '在保持收率置信度的同时减少下一轮搜索空间。'
```

- [ ] **Step 5: Update pipeline tests**

In `src/services/sciencePipeline.test.ts`, update visible-string assertions:

```ts
expect(report.candidateDirections[0]).toMatch(/温和/);
expect(protocol.safetyNotes).toContain('仅模拟执行：不会提交到真实物理装置。');
expect(validation.constraints).toContain('真实物理执行前必须经过 Queue With Approval 审批。');
```

- [ ] **Step 6: Run service test**

Run: `npm run test:run -- src/services/sciencePipeline.test.ts`

Expected: service pipeline test passes with Chinese data and unchanged workflow shape.

---

### Task 3: Rebuild The Left Sidebar Hierarchy

**Files:**
- Modify: `src/components/Sidebar.tsx`
- Modify styles: `src/App.css`
- Modify test: `src/App.test.tsx`

- [ ] **Step 1: Rewrite Sidebar markup around the three-level model**

Use this structure in `Sidebar.tsx`:

```tsx
<nav className="sidebar" aria-label="科学空间、项目与会话">
  <div className="sidebar__identity">
    <div className="sidebar__mark">SW</div>
    <div>
      <strong>SciWork</strong>
      <span>AI 科学工作台</span>
    </div>
  </div>

  <section className="sidebar__section sidebar__section--space" aria-labelledby="sidebar-space">
    <h2 id="sidebar-space">科学发现空间</h2>
    <div className="sidebar__space-card">
      <FlaskConical size={16} />
      <div>
        <strong>{space.name}</strong>
        <span>{space.domain}</span>
        <small>{space.device}</small>
      </div>
    </div>
  </section>

  <section className="sidebar__section" aria-labelledby="sidebar-projects">
    <div className="sidebar__section-title-row">
      <h2 id="sidebar-projects">项目目录</h2>
      <button className="sidebar__mini-action" type="button">
        <Plus size={13} />
        <span>新建项目</span>
      </button>
    </div>
    <div className="sidebar__item sidebar__item--active">
      <FolderKanban size={16} />
      <div>
        <strong>{project.name}</strong>
        <span>projects/{project.id}</span>
      </div>
    </div>
  </section>

  <section className="sidebar__section" aria-labelledby="sidebar-sessions">
    <div className="sidebar__section-title-row">
      <h2 id="sidebar-sessions">会话</h2>
      <button className="sidebar__mini-action" type="button">
        <Plus size={13} />
        <span>新建会话</span>
      </button>
    </div>
    <ol className="sidebar__session-list">
      <li className="sidebar__session sidebar__session--active">
        <Sparkles size={15} />
        <div>
          <strong>当前科学任务</strong>
          <span>{stageDefinitions.find((stage) => stage.id === activeStageId)?.label}</span>
        </div>
      </li>
      <li className="sidebar__session">
        <BookOpen size={15} />
        <div>
          <strong>文献分析</strong>
          <span>SciGraph 证据链</span>
        </div>
      </li>
      <li className="sidebar__session">
        <Network size={15} />
        <div>
          <strong>模拟执行</strong>
          <span>Experimental Graph 回流</span>
        </div>
      </li>
    </ol>
  </section>
</nav>
```

Keep compact resource and progress sections below this hierarchy, using Chinese labels:

```tsx
<h2 id="sidebar-resources">资源</h2>
<strong>私域文献库</strong>
<span>{literature.length} 篇私域文献</span>
```

- [ ] **Step 2: Use shared status formatter**

Remove local `formatStatus()` from Sidebar and import:

```ts
import { formatStageStatus } from '../workflow/presentation';
```

Use:

```tsx
<small>{formatStageStatus(statusByStage[stage.id])}</small>
```

- [ ] **Step 3: Add sidebar CSS**

Add or replace CSS classes:

```css
.sidebar__space-card,
.sidebar__session {
  min-width: 0;
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 9px;
  align-items: start;
  padding: 10px;
  border-radius: 8px;
}

.sidebar__space-card {
  border: 1px solid rgba(196, 219, 243, 0.16);
  background: rgba(255, 255, 255, 0.07);
  box-shadow: inset 3px 0 0 var(--qiushi-red);
}

.sidebar__section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.sidebar__mini-action {
  min-height: 26px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 7px;
  padding: 0 7px;
  color: #f4f9ff;
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
}

.sidebar__session-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.sidebar__session--active {
  color: #fff;
  background: rgba(0, 91, 172, 0.3);
  box-shadow: inset 3px 0 0 var(--qiushi-red);
}
```

- [ ] **Step 4: Update App shell test**

In `src/App.test.tsx`, replace sidebar role query:

```ts
const sidebar = screen.getByRole('navigation', { name: /科学空间、项目与会话/ });
```

Assert hierarchy labels:

```ts
expect(within(sidebar).getByRole('heading', { name: '科学发现空间' })).toBeInTheDocument();
expect(within(sidebar).getByRole('heading', { name: '项目目录' })).toBeInTheDocument();
expect(within(sidebar).getByRole('heading', { name: '会话' })).toBeInTheDocument();
expect(screen.getByRole('button', { name: /新建项目/ })).toBeInTheDocument();
expect(screen.getByRole('button', { name: /新建会话/ })).toBeInTheDocument();
```

- [ ] **Step 5: Run App test**

Run: `npm run test:run -- src/App.test.tsx`

Expected: it may still fail until AgentThread, ContextPanel, and Composer are localized. Continue with following tasks, then rerun.

---

### Task 4: Localize Center Thread And Right Context

**Files:**
- Modify: `src/components/AgentThread.tsx`
- Modify: `src/components/ContextPanel.tsx`
- Modify: `src/components/GraphView.tsx`
- Modify test: `src/App.test.tsx`

- [ ] **Step 1: Localize AgentThread labels**

Change ARIA and visible labels:

```tsx
<section className="agent-thread" aria-label="智能体会话">
```

Header labels:

```tsx
<span>当前项目</span>
```

Assistant author:

```tsx
<span className="thread-message__author">科学助手</span>
```

User objective author:

```tsx
<span className="thread-message__author">研究目标</span>
```

Trace heading:

```tsx
<h2>执行过程</h2>
```

Translate block headings:

```tsx
<h2>SciGraph 文献分析</h2>
<h2>研究总结报告</h2>
<h2>实验方案设计</h2>
<h2>LabOntology 校验完成</h2>
<h2>模拟执行完成并生成观测结果</h2>
<h2>Experimental Graph 回流完成</h2>
<h2>收窄溶剂候选范围</h2>
```

- [ ] **Step 2: Use shared formatters in AgentThread**

Remove local `formatStatus()` and import:

```ts
import { formatStageStatus, formatValidationStatus } from '../workflow/presentation';
```

Use `formatStageStatus(statusByStage[stage.id])` and `formatValidationStatus(validation.status)`.

- [ ] **Step 3: Localize ContextPanel**

Change ARIA:

```tsx
<aside className="context-panel" aria-label="任务进度与项目上下文">
```

Use headings:

```tsx
<h2>进度</h2>
<h2>项目上下文</h2>
<dt>文献</dt>
<dt>报告</dt>
<dt>方案</dt>
<dt>模拟</dt>
```

Use Chinese pending text:

```tsx
<dd>{report ? report.question : '待生成'}</dd>
```

Use shared formatters:

```ts
import { formatStageStatus, formatValidationStatus } from '../workflow/presentation';
```

- [ ] **Step 4: Localize GraphView**

Update `src/components/GraphView.tsx`:

```tsx
return <div className="graph-empty">Experimental Graph 会在模拟结果回流后出现。</div>;
```

Metrics:

```tsx
<span>{graph.nodes.length} 个节点</span>
<span>{graph.edges.length} 条关系</span>
```

- [ ] **Step 5: Update App test workflow assertions**

Replace English workflow button and heading assertions:

```ts
fireEvent.click(screen.getByRole('button', { name: /分析文献/ }));
expect(await screen.findByText(/SciGraph 已对齐文献实体和证据链/)).toBeInTheDocument();

fireEvent.click(await screen.findByRole('button', { name: /生成报告/ }));
expect(await screen.findByRole('heading', { name: /研究总结报告/ })).toBeInTheDocument();

fireEvent.click(await screen.findByRole('button', { name: /设计方案/ }));
expect(await screen.findByText(/自动化温和偶联反应条件筛选/)).toBeInTheDocument();

fireEvent.click(await screen.findByRole('button', { name: /LabOntology 校验/ }));
expect(await screen.findByRole('heading', { name: /LabOntology 校验完成/ })).toBeInTheDocument();

fireEvent.click(await screen.findByRole('button', { name: /模拟执行/ }));
expect(await screen.findByRole('heading', { name: /模拟执行完成并生成观测结果/ })).toBeInTheDocument();

fireEvent.click(await screen.findByRole('button', { name: /回流 Experimental Graph/ }));
expect(await screen.findByRole('heading', { name: /Experimental Graph 回流完成/ })).toBeInTheDocument();

fireEvent.click(await screen.findByRole('button', { name: /生成下一轮建议/ }));
expect(await screen.findByRole('heading', { name: '收窄溶剂候选范围' })).toBeInTheDocument();
```

- [ ] **Step 6: Run App test**

Run: `npm run test:run -- src/App.test.tsx`

Expected: app shell and workflow progression pass after Composer is localized in Task 5.

---

### Task 5: Localize Composer And Add Small IP Dock

**Files:**
- Modify: `src/components/Composer.tsx`
- Modify: `src/components/CharacterCue.tsx`
- Modify: `src/App.tsx`
- Modify styles: `src/App.css`
- Modify test: `src/components/Composer.test.tsx`
- Modify test: `src/App.test.tsx`

- [ ] **Step 1: Add assistant avatar prop to Composer**

Update props:

```ts
interface ComposerProps {
  activeStageId: WorkflowStageId;
  assistantAvatar: string;
  canAdvance: boolean;
  isRunning: boolean;
  onRun: (constraint: string) => Promise<void>;
}
```

Update component signature:

```ts
export function Composer({ activeStageId, assistantAvatar, canAdvance, isRunning, onRun }: ComposerProps) {
```

Update tests to pass `assistantAvatar=""`.

- [ ] **Step 2: Localize action labels**

Use:

```ts
const actionLabels: Record<WorkflowStageId, string> = {
  literature: '分析文献',
  'scigraph-analysis': '生成报告',
  report: '设计方案',
  'protocol-design': 'LabOntology 校验',
  'labontology-check': '模拟执行',
  simulation: '回流 Experimental Graph',
  'experimental-graph': '生成下一轮建议',
  'next-suggestion': '流程完成'
};
```

Busy text:

```tsx
<span>{isBusy ? '执行中...' : actionLabels[activeStageId]}</span>
```

- [ ] **Step 3: Localize science skill palette**

Use Chinese labels/descriptions:

```ts
{
  command: '/scigraph',
  label: 'SciGraph 文献分析',
  description: '把私域文献对齐到反应实体、证据链和公开知识。'
}
```

Palette ARIA and header:

```tsx
<div className="skill-palette" role="listbox" aria-label="科学技能包">
  <div className="skill-palette__header">
    <Sparkles size={14} />
    <span>科学技能包</span>
  </div>
```

- [ ] **Step 4: Localize composer controls**

Use:

```tsx
<footer className="composer-shell" aria-label="SciWork 输入区">
```

Workspace button:

```tsx
<button className="composer-tool composer-tool--workspace" aria-label="工作区目录" type="button">
  <FolderOpen size={15} />
  <span>当前项目</span>
</button>
```

Text input:

```tsx
<label className="sr-only" htmlFor="sciwork-message">
  给 SciWork 发送消息
</label>
<input
  aria-label="给 SciWork 发送消息"
  placeholder="输入任务，或输入 / 调用科学技能包"
/>
```

Controls:

```tsx
<button className="composer-tool" aria-label="模型" type="button">
  <Bot size={15} />
  <span>科学智能体</span>
  <ChevronDown size={13} />
</button>
<button className="icon-button" aria-label="添加文件" type="button">
<button className="icon-button" aria-label="语音输入" type="button">
```

- [ ] **Step 5: Add small IP dock above the composer**

Inside `Composer`, before `.composer`, render:

```tsx
<div className="composer-assistant" aria-label="科学助手状态">
  <div className="composer-assistant__avatar">
    {assistantAvatar ? <img alt="" src={assistantAvatar} /> : <Bot size={17} />}
  </div>
  <div>
    <strong>科学助手</strong>
    <span>正在组织文献、图谱和机器人实验流程</span>
  </div>
</div>
```

- [ ] **Step 6: Pass avatar from App**

Update `src/App.tsx`:

```tsx
<Composer
  activeStageId={workflow.stageState.activeStageId}
  assistantAvatar={getCharacter('assistantAvatar')}
  canAdvance={workflow.canAdvance}
  isRunning={workflow.isRunning}
  onRun={workflow.runNextAction}
/>
```

- [ ] **Step 7: Localize CharacterCue if retained**

Update `src/components/CharacterCue.tsx` visible labels:

```tsx
<img src={imageUrl} alt="SciWork 科学助手" />
<div className="cue-title">科学助手</div>
```

- [ ] **Step 8: Add IP dock CSS**

Add:

```css
.composer-assistant {
  min-width: 0;
  display: inline-grid;
  grid-template-columns: 32px minmax(0, auto);
  gap: 9px;
  align-items: center;
  margin-bottom: 8px;
  padding: 6px 9px;
  border: 1px solid rgba(0, 91, 172, 0.12);
  border-radius: 8px;
  color: #203650;
  background: rgba(255, 255, 255, 0.72);
}

.composer-assistant__avatar {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 8px;
  color: #fff;
  background: var(--zju-blue-strong);
}

.composer-assistant__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.composer-assistant strong,
.composer-assistant span {
  display: block;
  min-width: 0;
  overflow-wrap: anywhere;
}

.composer-assistant strong {
  font-size: 12px;
  color: var(--zju-blue-strong);
}

.composer-assistant span {
  margin-top: 2px;
  color: var(--muted);
  font-size: 12px;
}
```

- [ ] **Step 9: Update Composer tests**

Replace textbox queries:

```ts
screen.getByRole('textbox', { name: /给 SciWork 发送消息/ })
```

Replace palette query:

```ts
screen.getByRole('listbox', { name: /科学技能包/ })
```

Replace buttons:

```ts
screen.getByRole('button', { name: /设计方案/ })
screen.getByRole('button', { name: /执行中/ })
screen.getByRole('button', { name: /分析文献/ })
```

Add an assertion in the first test:

```ts
expect(screen.getByLabelText('科学助手状态')).toBeInTheDocument();
```

- [ ] **Step 10: Run Composer test**

Run: `npm run test:run -- src/components/Composer.test.tsx`

Expected: slash palette still opens, selection writes `/scigraph `, palette closes after selection, duplicate run protection remains intact.

---

### Task 6: Refine Minimal ZJU Visual Style

**Files:**
- Modify: `src/App.css`

- [ ] **Step 1: Reduce shell background noise**

Adjust `.desktop-app` to use a calmer light work surface outside the dark sidebar:

```css
.desktop-app {
  --zju-blue: #005bac;
  --zju-blue-strong: #063a75;
  --qiushi-red: #b31b1b;
  --paper: #fbfaf6;
  --ink: #172234;
  grid-template-columns: minmax(230px, 286px) minmax(500px, 1fr) minmax(288px, 352px);
  background:
    linear-gradient(90deg, rgba(0, 91, 172, 0.08) 1px, transparent 1px),
    linear-gradient(180deg, #f8fbff 0%, #f4f6f0 100%);
  background-size: 32px 32px, auto;
}
```

- [ ] **Step 2: Strengthen dark ZJU left pane without clutter**

Use:

```css
.sidebar {
  background:
    linear-gradient(180deg, rgba(4, 33, 67, 0.98), rgba(3, 18, 38, 0.98)),
    var(--sciwork-skin);
  background-size: cover;
  background-blend-mode: multiply;
}
```

Keep sidebar text high contrast and section spacing compact.

- [ ] **Step 3: Keep center and right panes light**

Use:

```css
.workbench-main {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(246, 248, 243, 0.94)),
    repeating-linear-gradient(90deg, rgba(0, 91, 172, 0.035) 0 1px, transparent 1px 22px);
}

.context-panel {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(247, 248, 243, 0.96)),
    repeating-linear-gradient(45deg, rgba(0, 91, 172, 0.035) 0 1px, transparent 1px 18px);
}
```

- [ ] **Step 4: Keep minimal typography**

Remove uppercase transforms for Chinese headings:

```css
.sidebar__section h2,
.execution-trace h2,
.context-panel__section h2,
.skill-palette__header {
  text-transform: none;
  letter-spacing: 0;
}
```

- [ ] **Step 5: Check responsive behavior**

Keep existing media queries but ensure new `.sidebar__space-card`, `.sidebar__session-list`, and `.composer-assistant` do not force overflow at widths down to `980px`.

---

### Task 7: Full Verification And Desktop Preview

**Files:**
- Verify all modified files.

- [ ] **Step 1: Run full build**

Run: `npm run build`

Expected:

- `tsc --noEmit -p tsconfig.json` passes.
- `tsc --noEmit -p tsconfig.node.json` passes.
- Vitest suite passes.
- Vite production build passes.
- Electron TypeScript build passes.

- [ ] **Step 2: Start desktop app for user preview**

Run: `npm run dev`

Expected: Vite dev server starts and Electron opens the desktop app.

- [ ] **Step 3: Visually confirm requirements**

Confirm in the Electron window:

- No native top menu is visible.
- Visible UI is Chinese.
- Left pane is dark ZJU style.
- Center and right panes are light.
- Left hierarchy clearly reads as scientific space -> project directory -> sessions.
- IP scientist assistant appears in messages and near the composer without dominating the UI.
- Core workflow still progresses from literature analysis to Experimental Graph writeback.

- [ ] **Step 4: Report result**

Summarize changed files, verification command output, and the local preview status for the user.
