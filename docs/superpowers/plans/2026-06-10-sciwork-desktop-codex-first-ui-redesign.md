# SciWork Desktop Codex-First UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current showcase-style SciWork UI with a Codex-first desktop AI workbench shell while preserving the existing scientific workflow.

**Architecture:** Keep `useWorkflowController`, `services/*`, `domain/*`, and the stage machine as the workflow boundary. Replace only the React shell and presentation components with a left project/session sidebar, central agent conversation and composer, and right progress/context panel.

**Tech Stack:** Electron, Vite, React, TypeScript, Vitest, Testing Library, lucide-react, CSS.

**Repository Note:** `git rev-parse --is-inside-work-tree` currently returns `fatal: not a git repository`. Do not include git commit commands during execution in this workspace. Use the validation commands in each task as the checkpoint.

---

## File Structure

Create:

- `src/components/Sidebar.tsx`: left desktop project/session/resource navigation.
- `src/components/AgentThread.tsx`: central conversation-style rendering of the existing workflow state and generated artifacts.
- `src/components/Composer.tsx`: bottom prompt composer with workspace, slash skill palette, model, attachment, voice, and run controls.
- `src/components/ContextPanel.tsx`: right progress and project context panel with SciGraph, LabOntology, and Experimental Graph sections.
- `src/components/Composer.test.tsx`: focused slash palette and running-state tests.

Modify:

- `src/App.tsx`: replace the current showcase composition with the Codex-first three-column workbench.
- `src/App.css`: replace the current card/showcase styling with desktop workbench styling.
- `src/App.test.tsx`: update app-level tests to assert workbench shell, slash-aware composer, right context, and existing workflow progression.

Leave in place:

- `src/hooks/useWorkflowController.ts`
- `src/services/*`
- `src/domain/*`
- `src/workflow/stageMachine.ts`
- Existing generated assets under `assets/`

Old presentation components can remain unused in this round:

- `AssetRail.tsx`
- `CenterStage.tsx`
- `CommandBar.tsx`
- `EvidencePanel.tsx`
- `TopBar.tsx`
- `CharacterCue.tsx`

---

### Task 1: Rewrite UI Contract Tests

**Files:**

- Modify: `src/App.test.tsx`
- Create: `src/components/Composer.test.tsx`

- [ ] **Step 1: Replace `src/App.test.tsx` with app-level workbench tests**

Use this complete file content:

```tsx
import { fireEvent, render, screen, within } from '@testing-library/react';
import { App } from './App';

describe('SciWork Desktop app', () => {
  it('renders the Codex-first desktop workbench shell', () => {
    render(<App />);

    expect(screen.getByRole('navigation', { name: /Projects and sessions/i })).toBeInTheDocument();
    expect(screen.getByRole('main', { name: /Agent conversation/i })).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: /Progress and project context/i })).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /New Session/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Workspace folder/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Model/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Voice input/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Message SciWork/i })).toBeInTheDocument();

    expect(screen.getByText('温和条件下偶联反应优化演示项目')).toBeInTheDocument();
    expect(screen.getByText('Private Literature Library')).toBeInTheDocument();
    expect(screen.getByText('SciGraph')).toBeInTheDocument();
    expect(screen.getByText('LabOntology')).toBeInTheDocument();
    expect(screen.getByText('Experimental Graph')).toBeInTheDocument();
  });

  it('opens the slash skill palette from the app composer', () => {
    render(<App />);

    fireEvent.change(screen.getByRole('textbox', { name: /Message SciWork/i }), {
      target: { value: '/' }
    });

    const palette = screen.getByRole('listbox', { name: /Science skill packs/i });
    expect(within(palette).getByText('/scigraph')).toBeInTheDocument();
    expect(within(palette).getByText('/report')).toBeInTheDocument();
    expect(within(palette).getByText('/protocol')).toBeInTheDocument();
    expect(within(palette).getByText('/labontology')).toBeInTheDocument();
    expect(within(palette).getByText('/simulate')).toBeInTheDocument();
    expect(within(palette).getByText('/graph')).toBeInTheDocument();
  });

  it('advances through the scientific workflow from the workbench composer', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Analyze Literature/i }));
    expect(await screen.findByText(/SciGraph aligned literature entities/i)).toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: /Generate Report/i }));
    expect(await screen.findByText(/Research Summary Report/i)).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: /Message SciWork/i }), {
      target: { value: 'prefer mild conditions and shorter reaction time' }
    });
    fireEvent.click(await screen.findByRole('button', { name: /Draft Protocol/i }));
    expect(await screen.findByText(/Automated mild cross-coupling/i)).toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: /Validate with LabOntology/i }));
    expect(await screen.findByText(/LabOntology validation completed/i)).toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: /Run Simulation/i }));
    expect(await screen.findByText(/Simulation completed and generated observations/i)).toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: /Write Back to Experimental Graph/i }));
    expect(await screen.findByText(/Experimental Graph writeback completed/i)).toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: /Generate Next Suggestions/i }));
    expect(await screen.findByText('Narrow solvent candidates')).toBeInTheDocument();
  });

  it('does not skip workflow stages when Analyze Literature is clicked twice rapidly', async () => {
    render(<App />);

    const analyzeButton = screen.getByRole('button', { name: /Analyze Literature/i });
    fireEvent.click(analyzeButton);
    fireEvent.click(analyzeButton);

    expect(await screen.findByRole('button', { name: /Generate Report/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Draft Protocol/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Research Summary Report/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Add `src/components/Composer.test.tsx`**

Use this complete file content:

```tsx
import { fireEvent, render, screen, within } from '@testing-library/react';
import { Composer } from './Composer';

describe('Composer', () => {
  it('loads science skills when the user types a slash', () => {
    render(<Composer activeStageId="literature" canAdvance={true} isRunning={false} onRun={vi.fn()} />);

    fireEvent.change(screen.getByRole('textbox', { name: /Message SciWork/i }), {
      target: { value: '/' }
    });

    const palette = screen.getByRole('listbox', { name: /Science skill packs/i });
    expect(within(palette).getByRole('option', { name: /\/scigraph/i })).toBeInTheDocument();
    expect(within(palette).getByRole('option', { name: /\/report/i })).toBeInTheDocument();
    expect(within(palette).getByRole('option', { name: /\/protocol/i })).toBeInTheDocument();
    expect(within(palette).getByRole('option', { name: /\/labontology/i })).toBeInTheDocument();
    expect(within(palette).getByRole('option', { name: /\/simulate/i })).toBeInTheDocument();
    expect(within(palette).getByRole('option', { name: /\/graph/i })).toBeInTheDocument();
  });

  it('writes the selected slash skill into the composer', () => {
    render(<Composer activeStageId="literature" canAdvance={true} isRunning={false} onRun={vi.fn()} />);

    const input = screen.getByRole('textbox', { name: /Message SciWork/i });
    fireEvent.change(input, { target: { value: '/' } });
    fireEvent.click(screen.getByRole('option', { name: /\/scigraph/i }));

    expect(input).toHaveValue('/scigraph ');
  });

  it('passes the composer text to the workflow run action', async () => {
    const onRun = vi.fn().mockResolvedValue(undefined);
    render(<Composer activeStageId="report" canAdvance={true} isRunning={false} onRun={onRun} />);

    fireEvent.change(screen.getByRole('textbox', { name: /Message SciWork/i }), {
      target: { value: 'prefer mild conditions' }
    });
    fireEvent.click(screen.getByRole('button', { name: /Draft Protocol/i }));

    expect(onRun).toHaveBeenCalledWith('prefer mild conditions');
  });

  it('keeps the run button inert while a workflow action is running', () => {
    const onRun = vi.fn();
    render(<Composer activeStageId="literature" canAdvance={true} isRunning={true} onRun={onRun} />);

    const button = screen.getByRole('button', { name: /Running/i });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(onRun).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run the new tests and verify they fail for missing new UI**

Run:

```powershell
npm run test:run -- src/App.test.tsx src/components/Composer.test.tsx
```

Expected result:

- `src/components/Composer.test.tsx` fails because `src/components/Composer.tsx` does not exist yet.
- `src/App.test.tsx` fails because the old app does not render `Projects and sessions`, `Agent conversation`, or `Progress and project context`.

---

### Task 2: Implement The Composer And Slash Skill Palette

**Files:**

- Create: `src/components/Composer.tsx`

- [ ] **Step 1: Create `src/components/Composer.tsx`**

Use this complete file content:

```tsx
import {
  Bot,
  ChevronDown,
  FolderOpen,
  Mic,
  Paperclip,
  SendHorizontal,
  Sparkles
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import type { WorkflowStageId } from '../domain/types';

interface ComposerProps {
  activeStageId: WorkflowStageId;
  canAdvance: boolean;
  isRunning: boolean;
  onRun: (constraint: string) => Promise<void>;
}

interface ScienceSkill {
  command: string;
  label: string;
  description: string;
}

const actionLabels: Record<WorkflowStageId, string> = {
  literature: 'Analyze Literature',
  'scigraph-analysis': 'Generate Report',
  report: 'Draft Protocol',
  'protocol-design': 'Validate with LabOntology',
  'labontology-check': 'Run Simulation',
  simulation: 'Write Back to Experimental Graph',
  'experimental-graph': 'Generate Next Suggestions',
  'next-suggestion': 'Workflow Complete'
};

export const scienceSkills: ScienceSkill[] = [
  {
    command: '/scigraph',
    label: 'SciGraph literature analysis',
    description: 'Align private literature with reaction entities and evidence chains.'
  },
  {
    command: '/report',
    label: 'Research report',
    description: 'Generate a summary report grounded in the analyzed literature.'
  },
  {
    command: '/protocol',
    label: 'Protocol design',
    description: 'Turn the report and user constraints into an experiment protocol.'
  },
  {
    command: '/labontology',
    label: 'LabOntology validation',
    description: 'Normalize experiment terms and check simulated lab constraints.'
  },
  {
    command: '/simulate',
    label: 'Simulation execution',
    description: 'Run the protocol through the mock simulation engine.'
  },
  {
    command: '/graph',
    label: 'Experimental Graph writeback',
    description: 'Organize run data, observations, and suggestions as graph knowledge.'
  }
];

export function Composer({ activeStageId, canAdvance, isRunning, onRun }: ComposerProps) {
  const [constraint, setConstraint] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSkills = useMemo(() => {
    if (!constraint.startsWith('/')) return [];
    const query = constraint.slice(1).trim().toLowerCase();
    if (!query) return scienceSkills;
    return scienceSkills.filter((skill) =>
      `${skill.command} ${skill.label} ${skill.description}`.toLowerCase().includes(query)
    );
  }, [constraint]);

  const showPalette = filteredSkills.length > 0;

  async function handleRun() {
    if (isRunning || !canAdvance) return;
    await onRun(constraint);
  }

  function selectSkill(command: string) {
    setConstraint(`${command} `);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <footer className="composer-shell" aria-label="SciWork composer">
      {showPalette && (
        <div className="skill-palette" role="listbox" aria-label="Science skill packs">
          <div className="skill-palette__header">
            <Sparkles size={14} />
            <span>Science skill packs</span>
          </div>
          {filteredSkills.map((skill) => (
            <button
              className="skill-option"
              key={skill.command}
              onClick={() => selectSkill(skill.command)}
              role="option"
              type="button"
            >
              <strong>{skill.command}</strong>
              <span>{skill.label}</span>
              <small>{skill.description}</small>
            </button>
          ))}
        </div>
      )}

      <div className="composer">
        <button className="composer-tool composer-tool--workspace" aria-label="Workspace folder" type="button">
          <FolderOpen size={15} />
          <span>SciWork</span>
        </button>

        <label className="sr-only" htmlFor="sciwork-message">
          Message SciWork
        </label>
        <input
          aria-label="Message SciWork"
          id="sciwork-message"
          onChange={(event) => setConstraint(event.target.value)}
          placeholder="Ask SciWork or type / for science skills"
          ref={inputRef}
          value={constraint}
        />

        <div className="composer-actions">
          <button className="composer-tool" aria-label="Model" type="button">
            <Bot size={15} />
            <span>Scientific Agent</span>
            <ChevronDown size={13} />
          </button>
          <button className="icon-button" aria-label="Attach file" type="button">
            <Paperclip size={16} />
          </button>
          <button className="icon-button" aria-label="Voice input" type="button">
            <Mic size={16} />
          </button>
          <button className="send-button" disabled={isRunning || !canAdvance} onClick={handleRun} type="button">
            <SendHorizontal size={16} />
            <span>{isRunning ? 'Running...' : actionLabels[activeStageId]}</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Run the component tests**

Run:

```powershell
npm run test:run -- src/components/Composer.test.tsx
```

Expected result:

- `Composer.test.tsx` passes.

---

### Task 3: Implement Workbench Presentation Components

**Files:**

- Create: `src/components/Sidebar.tsx`
- Create: `src/components/AgentThread.tsx`
- Create: `src/components/ContextPanel.tsx`

- [ ] **Step 1: Create `src/components/Sidebar.tsx`**

Use this complete file content:

```tsx
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Clock3,
  FlaskConical,
  Folder,
  Library,
  MessageSquarePlus,
  Network,
  ScrollText,
  Settings2,
  TriangleAlert
} from 'lucide-react';
import type { LiteratureItem, Project, ScientificSpace, StageStatus, WorkflowStageId } from '../domain/types';
import { stageDefinitions } from '../workflow/stageMachine';

interface SidebarProps {
  activeStageId: WorkflowStageId;
  literature: LiteratureItem[];
  project: Project;
  space: ScientificSpace;
  statusByStage: Record<WorkflowStageId, StageStatus>;
}

function StatusGlyph({ status }: { status: StageStatus }) {
  if (status === 'completed') return <CheckCircle2 size={14} />;
  if (status === 'in-progress') return <Clock3 size={14} />;
  if (status === 'warning' || status === 'needs-revision' || status === 'needs-approval') return <TriangleAlert size={14} />;
  return <Circle size={14} />;
}

export function Sidebar({ activeStageId, literature, project, space, statusByStage }: SidebarProps) {
  return (
    <nav className="sidebar" aria-label="Projects and sessions">
      <div className="sidebar__brand">
        <div className="sidebar__mark">SW</div>
        <div>
          <strong>SciWork</strong>
          <span>Codex-style scientist workbench</span>
        </div>
      </div>

      <button className="sidebar__new-session" type="button">
        <MessageSquarePlus size={16} />
        New Session
      </button>

      <section className="sidebar-section" aria-label="Workspace">
        <div className="sidebar-section__title">Workspace</div>
        <button className="sidebar-workspace" type="button">
          <Folder size={15} />
          <span>{space.name}</span>
        </button>
      </section>

      <section className="sidebar-section" aria-label="Projects">
        <div className="sidebar-section__title">Projects</div>
        <div className="sidebar-project sidebar-project--active">
          <FlaskConical size={15} />
          <div>
            <strong>{project.name}</strong>
            <span>{space.domain}</span>
          </div>
        </div>
      </section>

      <section className="sidebar-section" aria-label="Sessions">
        <div className="sidebar-section__title">Sessions</div>
        <button className="sidebar-link sidebar-link--active" type="button">
          <ScrollText size={15} />
          Demo planning session
        </button>
        <button className="sidebar-link" type="button">
          <Library size={15} />
          Literature review queue
        </button>
      </section>

      <section className="sidebar-section" aria-label="Resources">
        <div className="sidebar-section__title">Resources</div>
        <button className="sidebar-link" type="button">
          <BookOpen size={15} />
          Private Literature Library
          <span>{literature.length}</span>
        </button>
        <button className="sidebar-link" type="button">
          <Network size={15} />
          Experimental Graph
        </button>
        <button className="sidebar-link" type="button">
          <Settings2 size={15} />
          Skill Packs
        </button>
      </section>

      <section className="sidebar-section sidebar-section--stages" aria-label="Workflow stages">
        <div className="sidebar-section__title">Progress</div>
        {stageDefinitions.map((stage) => (
          <div className={`stage-mini ${stage.id === activeStageId ? 'stage-mini--active' : ''}`} key={stage.id}>
            <StatusGlyph status={statusByStage[stage.id]} />
            <span>{stage.shortLabel}</span>
          </div>
        ))}
      </section>
    </nav>
  );
}
```

- [ ] **Step 2: Create `src/components/AgentThread.tsx`**

Use this complete file content:

```tsx
import { Bot, CheckCircle2, Clock3, UserRound } from 'lucide-react';
import type {
  ExperimentalGraph,
  LabOntologyValidation,
  LiteratureItem,
  NextSuggestion,
  Project,
  ProtocolDraft,
  ResearchReport,
  SciGraphAnalysis,
  SimulationRunResult,
  StageStatus,
  WorkflowStageId
} from '../domain/types';
import { stageDefinitions } from '../workflow/stageMachine';

interface AgentThreadProps {
  activeStageId: WorkflowStageId;
  analysis: SciGraphAnalysis | null;
  assistantAvatar: string;
  graph: ExperimentalGraph | null;
  literature: LiteratureItem[];
  message: string;
  project: Project;
  protocol: ProtocolDraft | null;
  report: ResearchReport | null;
  simulationRun: SimulationRunResult | null;
  suggestions: NextSuggestion[];
  validation: LabOntologyValidation | null;
  statusByStage: Record<WorkflowStageId, StageStatus>;
}

function statusLabel(status: StageStatus) {
  if (status === 'completed') return 'completed';
  if (status === 'in-progress') return 'running';
  return 'queued';
}

export function AgentThread({
  activeStageId,
  analysis,
  assistantAvatar,
  graph,
  literature,
  message,
  project,
  protocol,
  report,
  simulationRun,
  suggestions,
  validation,
  statusByStage
}: AgentThreadProps) {
  return (
    <section className="agent-thread" aria-label="Agent thread">
      <header className="thread-header">
        <div>
          <span className="thread-kicker">Scientific Agent Session</span>
          <h1>{project.name}</h1>
        </div>
        <div className="thread-status">
          <span>{stageDefinitions.find((stage) => stage.id === activeStageId)?.label}</span>
          <strong>{statusLabel(statusByStage[activeStageId])}</strong>
        </div>
      </header>

      <div className="message-list">
        <article className="message message--user">
          <div className="message__avatar message__avatar--user">
            <UserRound size={17} />
          </div>
          <div className="message__body">
            <div className="message__meta">User</div>
            <p>{project.objective}</p>
          </div>
        </article>

        <article className="message message--assistant">
          <img className="message__image-avatar" src={assistantAvatar} alt="" />
          <div className="message__body">
            <div className="message__meta">SciWork Agent</div>
            <p>{message}</p>
            <div className="artifact-grid">
              <div className="artifact-chip">
                <strong>{literature.length}</strong>
                <span>private literature items</span>
              </div>
              <div className="artifact-chip">
                <strong>SciGraph</strong>
                <span>evidence alignment ready</span>
              </div>
              <div className="artifact-chip">
                <strong>LabOntology</strong>
                <span>simulation-only validation</span>
              </div>
            </div>
          </div>
        </article>

        <article className="execution-card" aria-label="Agent execution trace">
          <div className="execution-card__header">
            <Bot size={16} />
            <span>Agent execution trace</span>
          </div>
          <div className="execution-steps">
            {stageDefinitions.map((stage) => (
              <div className={`execution-step execution-step--${statusByStage[stage.id]}`} key={stage.id}>
                {statusByStage[stage.id] === 'completed' ? <CheckCircle2 size={15} /> : <Clock3 size={15} />}
                <div>
                  <strong>{stage.label}</strong>
                  <span>{statusLabel(statusByStage[stage.id])}</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        {analysis && (
          <article className="message message--assistant">
            <div className="message__avatar">
              <Bot size={17} />
            </div>
            <div className="message__body">
              <div className="message__meta">SciGraph</div>
              <h2>SciGraph Literature Analysis</h2>
              <p>{analysis.entities.length} entities and {analysis.evidence.length} evidence links aligned from private literature.</p>
              <ul>{analysis.publicKnowledge.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          </article>
        )}

        {report && (
          <article className="message message--assistant">
            <div className="message__avatar">
              <Bot size={17} />
            </div>
            <div className="message__body">
              <div className="message__meta">Report</div>
              <h2>Research Summary Report</h2>
              <p>{report.designRationale}</p>
              <ul>{report.consensus.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          </article>
        )}

        {protocol && (
          <article className="message message--assistant">
            <div className="message__avatar">
              <Bot size={17} />
            </div>
            <div className="message__body">
              <div className="message__meta">Protocol</div>
              <h2>{protocol.reactionSystem}</h2>
              <div className="parameter-strip">
                {Object.entries(protocol.parameters).map(([key, value]) => (
                  <span key={key}><strong>{key}</strong>{value}</span>
                ))}
              </div>
            </div>
          </article>
        )}

        {validation && (
          <article className="message message--assistant">
            <div className="message__avatar">
              <Bot size={17} />
            </div>
            <div className="message__body">
              <div className="message__meta">LabOntology</div>
              <h2>LabOntology validation completed</h2>
              <p>Status: {validation.status}</p>
              <ul>{validation.constraints.map((constraint) => <li key={constraint}>{constraint}</li>)}</ul>
            </div>
          </article>
        )}

        {simulationRun && (
          <article className="message message--assistant">
            <div className="message__avatar">
              <Bot size={17} />
            </div>
            <div className="message__body">
              <div className="message__meta">Simulation</div>
              <h2>Simulation completed and generated observations</h2>
              <div className="metric-strip">
                <span>Yield {simulationRun.yieldPercent}%</span>
                <span>Conversion {simulationRun.conversionPercent}%</span>
                <span>Confidence {Math.round(simulationRun.confidence * 100)}%</span>
              </div>
            </div>
          </article>
        )}

        {graph && (
          <article className="message message--assistant">
            <div className="message__avatar">
              <Bot size={17} />
            </div>
            <div className="message__body">
              <div className="message__meta">Experimental Graph</div>
              <h2>Experimental Graph writeback completed</h2>
              <p>{graph.nodes.length} nodes and {graph.edges.length} edges now organize the simulated experiment knowledge.</p>
            </div>
          </article>
        )}

        {suggestions.length > 0 && (
          <article className="message message--assistant">
            <div className="message__avatar">
              <Bot size={17} />
            </div>
            <div className="message__body">
              <div className="message__meta">Next Suggestions</div>
              <h2>Next-round suggestions</h2>
              <ul>{suggestions.map((suggestion) => <li key={suggestion.id}><strong>{suggestion.label}</strong>: {suggestion.expectedImpact}</li>)}</ul>
            </div>
          </article>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create `src/components/ContextPanel.tsx`**

Use this complete file content:

```tsx
import { CheckCircle2, Circle, Clock3, Network, TriangleAlert } from 'lucide-react';
import type {
  ExperimentalGraph,
  LabOntologyValidation,
  LiteratureItem,
  Project,
  ProtocolDraft,
  ResearchReport,
  SciGraphAnalysis,
  SimulationRunResult,
  StageStatus,
  WorkflowStageId
} from '../domain/types';
import { stageDefinitions } from '../workflow/stageMachine';
import { GraphView } from './GraphView';

interface ContextPanelProps {
  activeStageId: WorkflowStageId;
  analysis: SciGraphAnalysis | null;
  graph: ExperimentalGraph | null;
  literature: LiteratureItem[];
  project: Project;
  protocol: ProtocolDraft | null;
  report: ResearchReport | null;
  simulationRun: SimulationRunResult | null;
  statusByStage: Record<WorkflowStageId, StageStatus>;
  validation: LabOntologyValidation | null;
}

function StatusIcon({ status }: { status: StageStatus }) {
  if (status === 'completed') return <CheckCircle2 size={14} />;
  if (status === 'in-progress') return <Clock3 size={14} />;
  if (status === 'warning' || status === 'needs-revision' || status === 'needs-approval') return <TriangleAlert size={14} />;
  return <Circle size={14} />;
}

export function ContextPanel({
  activeStageId,
  analysis,
  graph,
  literature,
  project,
  protocol,
  report,
  simulationRun,
  statusByStage,
  validation
}: ContextPanelProps) {
  return (
    <aside className="context-panel" aria-label="Progress and project context">
      <section className="context-card context-card--progress">
        <div className="context-card__title">
          <Network size={15} />
          <span>Progress</span>
        </div>
        <div className="progress-list">
          {stageDefinitions.map((stage) => (
            <div className={`progress-item ${stage.id === activeStageId ? 'progress-item--active' : ''}`} key={stage.id}>
              <StatusIcon status={statusByStage[stage.id]} />
              <div>
                <strong>{stage.shortLabel}</strong>
                <span>{statusByStage[stage.id]}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="context-card">
        <div className="context-card__title">Project Context</div>
        <h2>{project.name}</h2>
        <p>{project.objective}</p>
        <div className="context-metrics">
          <span>{literature.length} literature</span>
          <span>{report ? 'report ready' : 'report queued'}</span>
          <span>{protocol ? 'protocol ready' : 'protocol queued'}</span>
        </div>
      </section>

      <section className="context-card">
        <div className="context-card__title">SciGraph</div>
        {analysis ? (
          <>
            <div className="context-metrics">
              <span>{analysis.entities.length} entities</span>
              <span>{analysis.evidence.length} links</span>
            </div>
            <ul>{analysis.publicKnowledge.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul>
          </>
        ) : (
          <p>Waiting to align private literature with public reaction knowledge.</p>
        )}
      </section>

      <section className="context-card">
        <div className="context-card__title">LabOntology</div>
        {validation ? (
          <>
            <p>Status: {validation.status}</p>
            <ul>{validation.constraints.slice(0, 3).map((constraint) => <li key={constraint}>{constraint}</li>)}</ul>
          </>
        ) : (
          <p>Protocol terms and simulated safety boundaries will appear after validation.</p>
        )}
      </section>

      <section className="context-card">
        <div className="context-card__title">Experimental Graph</div>
        {simulationRun && (
          <div className="context-metrics">
            <span>Yield {simulationRun.yieldPercent}%</span>
            <span>Conversion {simulationRun.conversionPercent}%</span>
          </div>
        )}
        <GraphView graph={graph} />
      </section>
    </aside>
  );
}
```

- [ ] **Step 4: Run typecheck for the new components**

Run:

```powershell
npm run typecheck
```

Expected result:

- TypeScript still fails because `App.tsx` has not been rewired yet, or passes if all unused old imports remain valid. Any failure should be limited to missing component wiring and styling is not checked by TypeScript.

---

### Task 4: Rewire App Into The Codex-First Shell

**Files:**

- Modify: `src/App.tsx`

- [ ] **Step 1: Replace `src/App.tsx`**

Use this complete file content:

```tsx
import type { CSSProperties } from 'react';
import { AgentThread } from './components/AgentThread';
import { Composer } from './components/Composer';
import { ContextPanel } from './components/ContextPanel';
import { Sidebar } from './components/Sidebar';
import { useWorkflowController } from './hooks/useWorkflowController';
import { getActiveTheme, getBackground, getCharacter } from './theme/themeRegistry';

type ShellStyle = CSSProperties & {
  '--sciwork-skin': string;
};

export function App() {
  const workflow = useWorkflowController();
  const theme = getActiveTheme();
  const background = getBackground(
    workflow.stageState.activeStageId === 'simulation' || workflow.stageState.activeStageId === 'experimental-graph'
      ? 'executionBackground'
      : workflow.stageState.activeStageId === 'report'
        ? 'reportBackground'
        : 'desktopBackground'
  );

  const shellStyle: ShellStyle = {
    '--sciwork-skin': `url(${background})`
  };

  return (
    <div className={`desktop-app desktop-app--${theme.tone}`} style={shellStyle}>
      <Sidebar
        activeStageId={workflow.stageState.activeStageId}
        literature={workflow.literature}
        project={workflow.project}
        space={workflow.space}
        statusByStage={workflow.stageState.statusByStage}
      />

      <main className="workbench-main" aria-label="Agent conversation">
        <AgentThread
          activeStageId={workflow.stageState.activeStageId}
          analysis={workflow.analysis}
          assistantAvatar={getCharacter('assistantAvatar')}
          graph={workflow.experimentalGraph}
          literature={workflow.literature}
          message={workflow.message}
          project={workflow.project}
          protocol={workflow.protocol}
          report={workflow.report}
          simulationRun={workflow.simulationRun}
          suggestions={workflow.suggestions}
          validation={workflow.validation}
          statusByStage={workflow.stageState.statusByStage}
        />
        <Composer
          activeStageId={workflow.stageState.activeStageId}
          canAdvance={workflow.canAdvance}
          isRunning={workflow.isRunning}
          onRun={workflow.runNextAction}
        />
      </main>

      <ContextPanel
        activeStageId={workflow.stageState.activeStageId}
        analysis={workflow.analysis}
        graph={workflow.experimentalGraph}
        literature={workflow.literature}
        project={workflow.project}
        protocol={workflow.protocol}
        report={workflow.report}
        simulationRun={workflow.simulationRun}
        statusByStage={workflow.stageState.statusByStage}
        validation={workflow.validation}
      />
    </div>
  );
}
```

- [ ] **Step 2: Run the targeted tests before styling**

Run:

```powershell
npm run test:run -- src/App.test.tsx src/components/Composer.test.tsx
```

Expected result:

- Tests may fail only on duplicate text matches or accessible labels caused by the exact markup. If that happens, resolve by tightening labels in the component markup, not by weakening the tests.

---

### Task 5: Replace Showcase CSS With Desktop Workbench Styling

**Files:**

- Modify: `src/App.css`

- [ ] **Step 1: Replace `src/App.css` with the workbench stylesheet**

Use this complete file content as the replacement:

```css
:root {
  color: #152033;
  background: #071c34;
  font-family: Inter, "Segoe UI", "Microsoft YaHei", system-ui, sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

button,
input,
textarea {
  font: inherit;
}

button {
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.desktop-app {
  position: relative;
  min-height: 100vh;
  display: grid;
  grid-template-columns: 276px minmax(520px, 1fr) 342px;
  color: #152033;
  background:
    linear-gradient(135deg, rgba(7, 28, 52, 0.96), rgba(7, 28, 52, 0.9) 32%, rgba(245, 249, 253, 0.96) 32%),
    #071c34;
  overflow: hidden;
}

.desktop-app::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.045) 1px, transparent 1px),
    var(--sciwork-skin);
  background-size: 44px 44px, 44px 44px, cover;
  background-position: center;
  opacity: 0.14;
  mix-blend-mode: screen;
}

.desktop-app::after {
  content: "求是";
  position: absolute;
  right: 376px;
  top: 28px;
  color: rgba(176, 31, 36, 0.08);
  font-size: 56px;
  font-weight: 800;
  letter-spacing: 0;
  pointer-events: none;
}

.sidebar,
.workbench-main,
.context-panel {
  position: relative;
  z-index: 1;
  min-width: 0;
  min-height: 0;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 12px;
  color: #dcecff;
  background:
    linear-gradient(180deg, rgba(4, 18, 36, 0.96), rgba(7, 28, 52, 0.94)),
    #071c34;
  border-right: 1px solid rgba(222, 235, 249, 0.12);
}

.sidebar__brand,
.sidebar__new-session,
.sidebar-workspace,
.sidebar-project,
.sidebar-link,
.stage-mini,
.thread-header,
.thread-status,
.message,
.execution-card__header,
.execution-step,
.composer,
.composer-actions,
.composer-tool,
.icon-button,
.send-button,
.context-card__title,
.progress-item,
.context-metrics,
.graph-summary {
  display: flex;
  align-items: center;
}

.sidebar__brand {
  gap: 10px;
  min-width: 0;
}

.sidebar__brand strong,
.sidebar-project strong,
.message__body h2,
.context-card h2 {
  overflow-wrap: anywhere;
}

.sidebar__brand span,
.sidebar-project span,
.sidebar-link,
.stage-mini,
.thread-kicker,
.thread-status span,
.message__meta,
.artifact-chip span,
.execution-step span,
.context-card p,
.context-card li,
.graph-node span {
  color: inherit;
  opacity: 0.72;
}

.sidebar__mark {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: linear-gradient(135deg, #0b5cad, #b01f24);
  color: #fff;
  font-weight: 800;
  flex: 0 0 auto;
}

.sidebar__brand > div:last-child,
.sidebar-project > div,
.message__body,
.execution-step > div,
.progress-item > div {
  min-width: 0;
}

.sidebar__brand span,
.sidebar-project span {
  display: block;
  font-size: 12px;
}

.sidebar__new-session,
.sidebar-workspace,
.sidebar-link {
  width: 100%;
  min-width: 0;
  gap: 8px;
  border: 1px solid rgba(222, 235, 249, 0.12);
  border-radius: 8px;
  padding: 9px 10px;
  color: inherit;
  background: rgba(255, 255, 255, 0.055);
  text-align: left;
}

.sidebar__new-session {
  justify-content: center;
  color: #fff;
  background: rgba(11, 92, 173, 0.52);
}

.sidebar-section {
  min-width: 0;
}

.sidebar-section__title {
  margin: 0 0 8px 4px;
  color: rgba(220, 236, 255, 0.62);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0;
}

.sidebar-project {
  gap: 8px;
  min-width: 0;
  border-radius: 8px;
  padding: 10px;
  background: rgba(176, 31, 36, 0.18);
  border: 1px solid rgba(176, 31, 36, 0.34);
}

.sidebar-link {
  justify-content: flex-start;
  margin-bottom: 6px;
}

.sidebar-link span:last-child {
  margin-left: auto;
  color: #fff;
  opacity: 0.72;
}

.sidebar-link--active {
  color: #fff;
  background: rgba(11, 92, 173, 0.28);
}

.stage-mini {
  gap: 8px;
  padding: 6px 7px;
  color: rgba(220, 236, 255, 0.78);
  border-radius: 7px;
}

.stage-mini--active {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.workbench-main {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  background: rgba(246, 249, 253, 0.96);
}

.agent-thread {
  min-height: 0;
  overflow: auto;
  padding: 20px 24px 12px;
}

.thread-header {
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(16, 45, 79, 0.12);
}

.thread-header h1 {
  margin: 3px 0 0;
  color: #102d4f;
  font-size: 20px;
  line-height: 1.25;
}

.thread-kicker {
  color: #0b5cad;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.thread-status {
  flex: 0 0 auto;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  color: #40536b;
  font-size: 12px;
}

.thread-status strong {
  color: #b01f24;
}

.message-list {
  max-width: 920px;
  margin: 0 auto;
  padding: 18px 0 22px;
}

.message {
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 18px;
}

.message__avatar,
.message__image-avatar {
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  border-radius: 9px;
}

.message__avatar {
  display: grid;
  place-items: center;
  color: #fff;
  background: #0b5cad;
}

.message__avatar--user {
  color: #24364d;
  background: #dfe8f2;
}

.message__image-avatar {
  object-fit: cover;
  object-position: top;
  background: #dfe8f2;
}

.message__body,
.execution-card {
  min-width: 0;
  border: 1px solid rgba(16, 45, 79, 0.11);
  border-radius: 10px;
  padding: 13px 14px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 10px 24px rgba(7, 28, 52, 0.055);
}

.message__body p,
.message__body ul,
.context-card p,
.context-card ul {
  margin: 8px 0 0;
}

.message__body h2,
.context-card h2 {
  margin: 2px 0 0;
  color: #102d4f;
  font-size: 15px;
}

.message__meta {
  color: #52677f;
  font-size: 12px;
  font-weight: 700;
}

.artifact-grid,
.parameter-strip,
.metric-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.artifact-chip,
.parameter-strip span,
.metric-strip span,
.context-metrics span,
.graph-summary span {
  min-width: 0;
  border-radius: 8px;
  padding: 7px 9px;
  background: rgba(11, 92, 173, 0.08);
  color: #0b4d8c;
  overflow-wrap: anywhere;
}

.artifact-chip strong,
.artifact-chip span {
  display: block;
}

.execution-card {
  margin: 4px 0 18px 46px;
}

.execution-card__header {
  gap: 8px;
  color: #0b5cad;
  font-size: 13px;
  font-weight: 800;
}

.execution-steps {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.execution-step {
  gap: 8px;
  min-width: 0;
  border-radius: 8px;
  padding: 8px;
  color: #4e637b;
  background: rgba(7, 28, 52, 0.035);
}

.execution-step--completed {
  color: #1b6b56;
}

.execution-step--in-progress {
  color: #b01f24;
  background: rgba(176, 31, 36, 0.07);
}

.execution-step strong,
.execution-step span {
  display: block;
  overflow-wrap: anywhere;
}

.composer-shell {
  position: relative;
  padding: 10px 18px 16px;
  background: rgba(246, 249, 253, 0.96);
  border-top: 1px solid rgba(16, 45, 79, 0.12);
}

.skill-palette {
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: calc(100% - 8px);
  max-width: 720px;
  border: 1px solid rgba(16, 45, 79, 0.16);
  border-radius: 10px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 22px 50px rgba(7, 28, 52, 0.18);
}

.skill-palette__header {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 4px 6px 8px;
  color: #0b5cad;
  font-size: 12px;
  font-weight: 800;
}

.skill-option {
  display: grid;
  grid-template-columns: 108px 1fr;
  gap: 4px 10px;
  width: 100%;
  border: 0;
  border-radius: 8px;
  padding: 8px;
  color: #213247;
  background: transparent;
  text-align: left;
}

.skill-option:hover {
  background: rgba(11, 92, 173, 0.08);
}

.skill-option strong {
  color: #b01f24;
}

.skill-option small {
  grid-column: 2;
  color: #62758c;
}

.composer {
  gap: 9px;
  min-width: 0;
  border: 1px solid rgba(16, 45, 79, 0.14);
  border-radius: 12px;
  padding: 8px;
  background: #fff;
  box-shadow: 0 14px 38px rgba(7, 28, 52, 0.1);
}

.composer input {
  flex: 1;
  min-width: 0;
  height: 38px;
  border: 0;
  outline: none;
  color: #152033;
  background: transparent;
}

.composer-tool,
.icon-button,
.send-button {
  flex: 0 0 auto;
  justify-content: center;
  gap: 7px;
  min-width: 0;
  min-height: 36px;
  border: 1px solid rgba(16, 45, 79, 0.12);
  border-radius: 8px;
  color: #40536b;
  background: #f7fafc;
}

.composer-tool {
  padding: 0 10px;
}

.composer-tool--workspace {
  color: #0b4d8c;
}

.icon-button {
  width: 36px;
}

.send-button {
  padding: 0 12px;
  color: #fff;
  background: #b01f24;
  border-color: #b01f24;
}

.send-button:disabled {
  color: #dbe5ef;
  background: #7f8fa1;
  border-color: #7f8fa1;
}

.context-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  overflow: auto;
  background: rgba(241, 246, 251, 0.96);
  border-left: 1px solid rgba(16, 45, 79, 0.12);
}

.context-card {
  min-width: 0;
  border: 1px solid rgba(16, 45, 79, 0.1);
  border-radius: 10px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.82);
}

.context-card__title {
  gap: 7px;
  margin-bottom: 9px;
  color: #0b5cad;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.progress-list {
  display: grid;
  gap: 6px;
}

.progress-item {
  gap: 8px;
  border-radius: 8px;
  padding: 7px;
  color: #4e637b;
  background: rgba(7, 28, 52, 0.035);
}

.progress-item--active {
  color: #b01f24;
  background: rgba(176, 31, 36, 0.07);
}

.progress-item strong,
.progress-item span {
  display: block;
  font-size: 12px;
}

.context-metrics,
.graph-summary {
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 9px;
}

.context-card ul {
  padding-left: 18px;
}

.graph-empty {
  min-width: 0;
  color: #60758f;
  border: 1px dashed rgba(16, 45, 79, 0.18);
  border-radius: 8px;
  padding: 12px;
  overflow-wrap: anywhere;
}

.graph-node-list {
  display: grid;
  gap: 7px;
  margin-top: 8px;
}

.graph-node {
  min-width: 0;
  border-radius: 8px;
  padding: 8px;
  background: rgba(11, 92, 173, 0.06);
  overflow-wrap: anywhere;
}

.graph-node strong,
.graph-node span {
  display: block;
}

.graph-node strong {
  color: #0b5cad;
}

@media (max-width: 1180px) {
  .desktop-app {
    grid-template-columns: 240px minmax(0, 1fr);
  }

  .context-panel {
    display: none;
  }
}

@media (max-width: 780px) {
  .desktop-app {
    grid-template-columns: minmax(0, 1fr);
  }

  .sidebar {
    display: none;
  }

  .agent-thread {
    padding: 14px;
  }

  .thread-header,
  .composer,
  .composer-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .execution-steps {
    grid-template-columns: minmax(0, 1fr);
  }

  .execution-card {
    margin-left: 0;
  }

  .composer-tool,
  .icon-button,
  .send-button {
    width: 100%;
  }
}
```

- [ ] **Step 2: Run targeted UI tests**

Run:

```powershell
npm run test:run -- src/App.test.tsx src/components/Composer.test.tsx
```

Expected result:

- All tests in those two files pass.

---

### Task 6: Full Validation And Electron Preview

**Files:**

- No planned source edits. Only validate the finished UI.

- [ ] **Step 1: Run the full automated validation suite**

Run:

```powershell
npm run build
```

Expected result:

- TypeScript checks pass.
- Vitest suite passes.
- Vite build completes.
- Electron TypeScript build completes.

- [ ] **Step 2: Start the Electron desktop app for user preview**

Before starting, inspect project-owned processes only:

```powershell
Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*sciwork-desktop*' -or $_.CommandLine -like '*SciWork*' -or $_.CommandLine -like '*127.0.0.1:5173*' } | Select-Object ProcessId,Name,CommandLine
```

If port `5173` is free, run:

```powershell
npm run dev
```

If port `5173` is already occupied by this project, reuse the running app and refresh the Electron window. Do not stop unrelated Electron processes.

Expected visible result:

- A desktop app window titled `SciWork Desktop`.
- Left side resembles a project/session sidebar.
- Center resembles an AI agent conversation with a composer.
- Right side shows progress and scientific context.
- Typing `/` in the composer opens `/scigraph`, `/report`, `/protocol`, `/labontology`, `/simulate`, and `/graph`.

---

## Self-Review

Spec coverage:

- Codex-first three-column desktop shell: Tasks 3, 4, 5.
- Left project/session sidebar: Task 3 `Sidebar.tsx`.
- Central agent conversation: Task 3 `AgentThread.tsx`.
- Bottom composer with workspace, model, voice, attachment, send, and slash skills: Task 2.
- Right progress/context with SciGraph, LabOntology, and Experimental Graph: Task 3 `ContextPanel.tsx`.
- Preserve core workflow modules: File Structure and Tasks 2-5 avoid `hooks`, `services`, `domain`, and `workflow` edits.
- Testing contract: Task 1 and Task 6.
- Electron preview: Task 6.

Placeholder scan:

- No `TBD`, `TODO`, "fill in details", or undefined planned component interfaces remain.

Type consistency:

- `ComposerProps`, `SidebarProps`, `AgentThreadProps`, and `ContextPanelProps` use existing domain types from `src/domain/types.ts`.
- `WorkflowStageId` labels match `stageDefinitions` and the existing stage machine.
- `App.tsx` passes the existing `useWorkflowController` return fields without changing their names.
