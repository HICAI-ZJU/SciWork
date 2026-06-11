# SciWork Desktop First-Round Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable Electron + React + Vite SciWork Desktop prototype that demonstrates the Fudan-XtalPi scientific discovery loop from private literature analysis to simulated execution and Experimental Graph writeback.

**Architecture:** Keep Electron thin and put prototype logic in typed renderer modules. Use deterministic mock adapters for SciGraph, LabOntology, simulation, and graph writeback so the demo is stable while preserving future service boundaries.

**Tech Stack:** Electron, React, Vite, TypeScript, Vitest, Testing Library, lucide-react, CSS modules through a single app stylesheet.

---

## Context

Current workspace contents:

- `SCIWORK_OVERVIEW_DESIGN.md`
- `docs/superpowers/specs/2026-06-10-sciwork-desktop-first-round-design.md`
- `assets/themes/*.png`
- `assets/characters/*.png`

The workspace is currently not a Git repository. Commit/checkpoint steps in this plan use `git status --short` to confirm that state. If the user initializes Git before implementation, run the listed `git add` and `git commit` commands at those checkpoints.

Do not read, create, or rely on `SESSION.md`, `session.md`, or any case variant.

## File Structure Map

Create these files:

```text
package.json
index.html
vite.config.ts
vitest.config.ts
tsconfig.json
tsconfig.node.json
electron/main.ts
electron/preload.ts
src/main.tsx
src/App.tsx
src/App.css
src/vite-env.d.ts
src/test/setup.ts
src/domain/types.ts
src/domain/demoData.ts
src/domain/demoData.test.ts
src/theme/themeRegistry.ts
src/theme/themeRegistry.test.ts
src/workflow/stageMachine.ts
src/workflow/stageMachine.test.ts
src/services/scigraphAdapter.ts
src/services/reportService.ts
src/services/protocolDesigner.ts
src/services/labOntologyAdapter.ts
src/services/simulationEngine.ts
src/services/experimentalGraphStore.ts
src/services/sciencePipeline.test.ts
src/hooks/useWorkflowController.ts
src/hooks/useWorkflowController.test.tsx
src/components/TopBar.tsx
src/components/AssetRail.tsx
src/components/CenterStage.tsx
src/components/EvidencePanel.tsx
src/components/CommandBar.tsx
src/components/CharacterCue.tsx
src/components/GraphView.tsx
src/App.test.tsx
```

Responsibilities:

- `electron/*`: desktop shell only.
- `src/domain/*`: shared data types and deterministic demo data.
- `src/theme/*`: replaceable background and IP character slots.
- `src/workflow/*`: stage list and legal transitions.
- `src/services/*`: mock scientific service boundaries.
- `src/hooks/*`: app workflow orchestration.
- `src/components/*`: presentational Desktop UI.
- `src/App.*`: app assembly and visual styling.

## Task 1: Tooling and Desktop Shell Scaffold

**Files:**

- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `electron/main.ts`
- Create: `electron/preload.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/App.css`
- Create: `src/vite-env.d.ts`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Create package metadata and scripts**

Create `package.json`:

```json
{
  "name": "sciwork-desktop",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist-electron/main.js",
  "scripts": {
    "dev": "concurrently -k \"npm:dev:vite\" \"npm:dev:electron\"",
    "dev:vite": "vite --host 127.0.0.1",
    "dev:electron": "wait-on http://127.0.0.1:5173 && cross-env VITE_DEV_SERVER_URL=http://127.0.0.1:5173 electron .",
    "typecheck": "tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.node.json",
    "test": "vitest",
    "test:run": "vitest run",
    "build:vite": "vite build",
    "build:electron": "tsc -p tsconfig.node.json",
    "build": "npm run typecheck && npm run test:run && npm run build:vite && npm run build:electron",
    "start": "electron ."
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "electron": "latest",
    "lucide-react": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "latest",
    "@testing-library/react": "latest",
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "concurrently": "latest",
    "cross-env": "latest",
    "jsdom": "latest",
    "typescript": "latest",
    "vite": "latest",
    "vitest": "latest",
    "wait-on": "latest"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run:

```powershell
npm install
```

Expected: `node_modules` and `package-lock.json` are created. Network access may require approval in this environment.

- [ ] **Step 3: Create TypeScript and Vite config**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "ignoreDeprecations": "6.0",
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "skipLibCheck": true,
    "rootDir": "electron",
    "outDir": "dist-electron",
    "types": ["node"]
  },
  "include": ["electron"]
}
```

Create `vite.config.ts`:

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  publicDir: 'assets',
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
```

Create `vitest.config.ts`:

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  publicDir: 'assets',
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true
  }
});
```

- [ ] **Step 4: Create Electron entry points**

Create `electron/main.ts`:

```ts
import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 1180,
    minHeight: 760,
    title: 'SciWork Desktop',
    backgroundColor: '#071c34',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    void window.loadURL(devServerUrl);
  } else {
    void window.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
```

Create `electron/preload.ts`:

```ts
export {};
```

- [ ] **Step 5: Create minimal React entry**

Create `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SciWork Desktop</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './App.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

Create `src/App.tsx`:

```tsx
export function App() {
  return (
    <main className="app app--boot">
      <h1>SciWork Desktop</h1>
      <p>First-round scientific discovery cockpit prototype.</p>
    </main>
  );
}
```

Create `src/App.css`:

```css
:root {
  color: #102033;
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

.app--boot {
  min-height: 100vh;
  display: grid;
  place-items: center;
  color: #e9f4ff;
}
```

Create `src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
```

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 6: Verify scaffold**

Run:

```powershell
npm run typecheck
npm run build:vite
npm run build:electron
```

Expected: all three commands exit with code `0`.

- [ ] **Step 7: Version checkpoint**

Run:

```powershell
git status --short
```

Expected in the current workspace: `fatal: not a git repository (or any of the parent directories): .git`.

If Git has been initialized:

```powershell
git add package.json package-lock.json index.html vite.config.ts vitest.config.ts tsconfig.json tsconfig.node.json electron src
git commit -m "chore: scaffold SciWork desktop app"
```

## Task 2: Domain Types and Demo Data

**Files:**

- Create: `src/domain/types.ts`
- Create: `src/domain/demoData.ts`
- Create: `src/domain/demoData.test.ts`

- [ ] **Step 1: Write failing demo data test**

Create `src/domain/demoData.test.ts`:

```ts
import { demoLiterature, demoProject, demoSpace } from './demoData';

describe('demo data', () => {
  it('loads a Fudan-XtalPi demonstration project with a useful private literature library', () => {
    expect(demoSpace.id).toBe('fudan-xtalpi-chemistry');
    expect(demoProject.spaceId).toBe(demoSpace.id);
    expect(demoLiterature).toHaveLength(6);
    expect(demoLiterature.every((item) => item.evidenceTags.length > 0)).toBe(true);
  });

  it('keeps demo literature tied to automated chemistry reaction design', () => {
    const titles = demoLiterature.map((item) => item.title).join(' ');
    expect(titles).toMatch(/reaction|catalyst|solvent|yield/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm run test:run -- src/domain/demoData.test.ts
```

Expected: FAIL because `src/domain/demoData.ts` does not exist.

- [ ] **Step 3: Create domain types**

Create `src/domain/types.ts`:

```ts
export type StageStatus = 'not-started' | 'in-progress' | 'completed' | 'needs-approval' | 'needs-revision' | 'warning';

export type WorkflowStageId =
  | 'literature'
  | 'scigraph-analysis'
  | 'report'
  | 'protocol-design'
  | 'labontology-check'
  | 'simulation'
  | 'experimental-graph'
  | 'next-suggestion';

export interface ScientificSpace {
  id: string;
  name: string;
  domain: string;
  device: string;
  policy: 'Queue With Approval';
}

export interface Project {
  id: string;
  spaceId: string;
  name: string;
  objective: string;
}

export interface LiteratureItem {
  id: string;
  title: string;
  source: string;
  year: number;
  abstract: string;
  evidenceTags: string[];
}

export interface SciGraphEntity {
  id: string;
  label: string;
  type: 'reaction' | 'reagent' | 'catalyst' | 'solvent' | 'condition' | 'instrument';
  confidence: number;
}

export interface EvidenceLink {
  id: string;
  literatureId: string;
  quote: string;
  claim: string;
  confidence: number;
}

export interface SciGraphAnalysis {
  entities: SciGraphEntity[];
  evidence: EvidenceLink[];
  publicKnowledge: string[];
}

export interface ResearchReport {
  question: string;
  consensus: string[];
  disagreements: string[];
  uncertainties: string[];
  candidateDirections: string[];
  designRationale: string;
  evidenceIds: string[];
}

export interface ProtocolStep {
  id: string;
  label: string;
  detail: string;
  durationMinutes: number;
}

export interface ProtocolDraft {
  id: string;
  objective: string;
  reactionSystem: string;
  reagents: string[];
  catalysts: string[];
  solvents: string[];
  device: string;
  parameters: Record<string, string>;
  steps: ProtocolStep[];
  safetyNotes: string[];
}

export interface LabOntologyValidation {
  status: 'pass' | 'warning' | 'needs-revision';
  normalizedTerms: string[];
  constraints: string[];
  warnings: string[];
}

export interface SimulationEvent {
  id: string;
  time: string;
  label: string;
  detail: string;
  severity: 'info' | 'warning' | 'success';
}

export interface SimulationRunResult {
  id: string;
  protocolId: string;
  status: 'completed' | 'completed-with-warning';
  yieldPercent: number;
  conversionPercent: number;
  confidence: number;
  events: SimulationEvent[];
  interpretation: string;
}

export interface ExperimentalGraphNode {
  id: string;
  type:
    | 'Objective'
    | 'LiteratureEvidence'
    | 'SciGraphEntity'
    | 'ReportClaim'
    | 'Protocol'
    | 'OntologyConstraint'
    | 'SimulationRun'
    | 'Observation'
    | 'Result'
    | 'NextSuggestion';
  label: string;
  detail: string;
}

export interface ExperimentalGraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface ExperimentalGraph {
  nodes: ExperimentalGraphNode[];
  edges: ExperimentalGraphEdge[];
}

export interface NextSuggestion {
  id: string;
  label: string;
  rationale: string;
  expectedImpact: string;
}
```

- [ ] **Step 4: Create deterministic demo data**

Create `src/domain/demoData.ts`:

```ts
import type { LiteratureItem, Project, ScientificSpace } from './types';

export const demoSpace: ScientificSpace = {
  id: 'fudan-xtalpi-chemistry',
  name: '复旦晶泰自动化化学反应空间',
  domain: 'Automated chemical reaction discovery',
  device: 'Fudan-XtalPi automated reaction platform',
  policy: 'Queue With Approval'
};

export const demoProject: Project = {
  id: 'mild-cross-coupling-demo',
  spaceId: demoSpace.id,
  name: '温和条件下偶联反应优化演示项目',
  objective: 'Find a mild, short-duration reaction condition with stable conversion and traceable evidence.'
};

export const demoLiterature: LiteratureItem[] = [
  {
    id: 'lit-001',
    title: 'Solvent effects in automated cross-coupling reaction screening',
    source: 'Private literature note',
    year: 2024,
    abstract: 'A private screening note reports that polar aprotic solvents improved conversion under reduced catalyst loading while maintaining manageable impurity formation.',
    evidenceTags: ['solvent', 'conversion', 'screening']
  },
  {
    id: 'lit-002',
    title: 'Catalyst loading boundaries for rapid reaction optimization',
    source: 'Internal method summary',
    year: 2023,
    abstract: 'Lower catalyst loading reduced cost but increased variability. Automated sampling made it possible to stop low-conversion runs early.',
    evidenceTags: ['catalyst', 'cost', 'automation']
  },
  {
    id: 'lit-003',
    title: 'Temperature windows for mild synthetic chemistry workflows',
    source: 'Curated article excerpt',
    year: 2022,
    abstract: 'Moderate temperature windows between 45 and 65 C often balanced reaction rate, impurity control, and instrument stability.',
    evidenceTags: ['temperature', 'safety', 'yield']
  },
  {
    id: 'lit-004',
    title: 'Reaction time compression using online conversion monitoring',
    source: 'Instrument application note',
    year: 2024,
    abstract: 'Online monitoring supported shorter reaction time decisions when conversion plateaued before the planned endpoint.',
    evidenceTags: ['reaction time', 'monitoring', 'instrument']
  },
  {
    id: 'lit-005',
    title: 'Base selection and impurity risk in automated reaction queues',
    source: 'Patent analysis memo',
    year: 2021,
    abstract: 'Base selection changed impurity profiles. The memo recommends checking compatibility before queue submission.',
    evidenceTags: ['base', 'impurity', 'queue']
  },
  {
    id: 'lit-006',
    title: 'Yield confidence scoring for simulated chemistry planning',
    source: 'SciWork seed dataset',
    year: 2025,
    abstract: 'Combining literature evidence, ontology constraints, and run observations improved confidence scoring for next-round experiment suggestions.',
    evidenceTags: ['yield', 'confidence', 'experimental graph']
  }
];
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```powershell
npm run test:run -- src/domain/demoData.test.ts
```

Expected: PASS, 2 tests pass.

- [ ] **Step 6: Version checkpoint**

Run:

```powershell
git status --short
```

Expected in the current workspace: `fatal: not a git repository (or any of the parent directories): .git`.

If Git has been initialized:

```powershell
git add src/domain
git commit -m "feat: add SciWork domain demo data"
```

## Task 3: Theme Asset Registry

**Files:**

- Create: `src/theme/themeRegistry.ts`
- Create: `src/theme/themeRegistry.test.ts`

- [ ] **Step 1: Write failing theme registry test**

Create `src/theme/themeRegistry.test.ts`:

```ts
import { getActiveTheme, getBackground, getCharacter, setActiveTheme, themes } from './themeRegistry';

describe('theme registry', () => {
  it('uses the ZJU-inspired blue graph theme by default', () => {
    expect(getActiveTheme().id).toBe('qiushi-blue-graph-zju');
    expect(getBackground('desktopBackground')).toBe('/themes/sciwork-theme-qiushi-blue-graph-zju-v2.png');
    expect(getCharacter('assistantAvatar')).toBe('/characters/sciwork-character-scientist-assistant-zju-v2.png');
  });

  it('switches to the report and execution theme slots without changing component code', () => {
    setActiveTheme('ink-scholar-zju');
    expect(getBackground('reportBackground')).toBe('/themes/sciwork-theme-ink-scholar-zju-v2.png');

    setActiveTheme('graph-night-zju');
    expect(getBackground('executionBackground')).toBe('/themes/sciwork-theme-graph-night-zju-v2.png');

    setActiveTheme('qiushi-blue-graph-zju');
  });

  it('keeps all registered themes addressable', () => {
    expect(themes.map((theme) => theme.id)).toEqual([
      'qiushi-blue-graph-zju',
      'ink-scholar-zju',
      'graph-night-zju',
      'qiushi-blue-graph-classic',
      'ink-scholar-classic',
      'graph-night-classic'
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm run test:run -- src/theme/themeRegistry.test.ts
```

Expected: FAIL because `src/theme/themeRegistry.ts` does not exist.

- [ ] **Step 3: Implement theme registry**

Create `src/theme/themeRegistry.ts`:

```ts
export type BackgroundSlot = 'desktopBackground' | 'reportBackground' | 'executionBackground';
export type CharacterSlot = 'assistantAvatar' | 'emptyStateCharacter' | 'approvalCharacter';

export interface ThemeDefinition {
  id: string;
  label: string;
  tone: 'default' | 'report' | 'execution';
  accent: string;
  backgrounds: Record<BackgroundSlot, string>;
  characters: Record<CharacterSlot, string>;
}

const zjuCharacter = '/characters/sciwork-character-scientist-assistant-zju-v2.png';
const classicCharacter = '/characters/sciwork-character-scientist-assistant.png';

export const themes: ThemeDefinition[] = [
  {
    id: 'qiushi-blue-graph-zju',
    label: '求是蓝图谱',
    tone: 'default',
    accent: '#b01f24',
    backgrounds: {
      desktopBackground: '/themes/sciwork-theme-qiushi-blue-graph-zju-v2.png',
      reportBackground: '/themes/sciwork-theme-ink-scholar-zju-v2.png',
      executionBackground: '/themes/sciwork-theme-graph-night-zju-v2.png'
    },
    characters: {
      assistantAvatar: zjuCharacter,
      emptyStateCharacter: zjuCharacter,
      approvalCharacter: zjuCharacter
    }
  },
  {
    id: 'ink-scholar-zju',
    label: '水墨学术',
    tone: 'report',
    accent: '#b01f24',
    backgrounds: {
      desktopBackground: '/themes/sciwork-theme-ink-scholar-zju-v2.png',
      reportBackground: '/themes/sciwork-theme-ink-scholar-zju-v2.png',
      executionBackground: '/themes/sciwork-theme-graph-night-zju-v2.png'
    },
    characters: {
      assistantAvatar: zjuCharacter,
      emptyStateCharacter: zjuCharacter,
      approvalCharacter: zjuCharacter
    }
  },
  {
    id: 'graph-night-zju',
    label: '夜间图谱',
    tone: 'execution',
    accent: '#e04444',
    backgrounds: {
      desktopBackground: '/themes/sciwork-theme-graph-night-zju-v2.png',
      reportBackground: '/themes/sciwork-theme-ink-scholar-zju-v2.png',
      executionBackground: '/themes/sciwork-theme-graph-night-zju-v2.png'
    },
    characters: {
      assistantAvatar: zjuCharacter,
      emptyStateCharacter: zjuCharacter,
      approvalCharacter: zjuCharacter
    }
  },
  {
    id: 'qiushi-blue-graph-classic',
    label: '经典蓝图谱',
    tone: 'default',
    accent: '#b01f24',
    backgrounds: {
      desktopBackground: '/themes/sciwork-theme-qiushi-blue-graph.png',
      reportBackground: '/themes/sciwork-theme-ink-scholar.png',
      executionBackground: '/themes/sciwork-theme-graph-night.png'
    },
    characters: {
      assistantAvatar: classicCharacter,
      emptyStateCharacter: classicCharacter,
      approvalCharacter: classicCharacter
    }
  },
  {
    id: 'ink-scholar-classic',
    label: '经典水墨',
    tone: 'report',
    accent: '#b01f24',
    backgrounds: {
      desktopBackground: '/themes/sciwork-theme-ink-scholar.png',
      reportBackground: '/themes/sciwork-theme-ink-scholar.png',
      executionBackground: '/themes/sciwork-theme-graph-night.png'
    },
    characters: {
      assistantAvatar: classicCharacter,
      emptyStateCharacter: classicCharacter,
      approvalCharacter: classicCharacter
    }
  },
  {
    id: 'graph-night-classic',
    label: '经典夜间',
    tone: 'execution',
    accent: '#e04444',
    backgrounds: {
      desktopBackground: '/themes/sciwork-theme-graph-night.png',
      reportBackground: '/themes/sciwork-theme-ink-scholar.png',
      executionBackground: '/themes/sciwork-theme-graph-night.png'
    },
    characters: {
      assistantAvatar: classicCharacter,
      emptyStateCharacter: classicCharacter,
      approvalCharacter: classicCharacter
    }
  }
];

let activeThemeId = 'qiushi-blue-graph-zju';

export function getActiveTheme(): ThemeDefinition {
  return themes.find((theme) => theme.id === activeThemeId) ?? themes[0];
}

export function setActiveTheme(themeId: string): void {
  if (themes.some((theme) => theme.id === themeId)) {
    activeThemeId = themeId;
  }
}

export function getBackground(slot: BackgroundSlot): string {
  return getActiveTheme().backgrounds[slot];
}

export function getCharacter(slot: CharacterSlot): string {
  return getActiveTheme().characters[slot];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
npm run test:run -- src/theme/themeRegistry.test.ts
```

Expected: PASS, 3 tests pass.

- [ ] **Step 5: Version checkpoint**

Run:

```powershell
git status --short
```

Expected in the current workspace: `fatal: not a git repository (or any of the parent directories): .git`.

If Git has been initialized:

```powershell
git add src/theme
git commit -m "feat: add replaceable theme asset registry"
```

## Task 4: Workflow Stage Machine

**Files:**

- Create: `src/workflow/stageMachine.ts`
- Create: `src/workflow/stageMachine.test.ts`

- [ ] **Step 1: Write failing stage machine test**

Create `src/workflow/stageMachine.test.ts`:

```ts
import { advanceStage, createInitialStageState, stageDefinitions } from './stageMachine';

describe('workflow stage machine', () => {
  it('defines the full first-round SciWork workflow in order', () => {
    expect(stageDefinitions.map((stage) => stage.id)).toEqual([
      'literature',
      'scigraph-analysis',
      'report',
      'protocol-design',
      'labontology-check',
      'simulation',
      'experimental-graph',
      'next-suggestion'
    ]);
  });

  it('starts at literature with every later stage not started', () => {
    const state = createInitialStageState();
    expect(state.activeStageId).toBe('literature');
    expect(state.statusByStage.literature).toBe('in-progress');
    expect(state.statusByStage['next-suggestion']).toBe('not-started');
  });

  it('advances one stage at a time and marks prior stages complete', () => {
    const state = advanceStage(createInitialStageState());
    expect(state.activeStageId).toBe('scigraph-analysis');
    expect(state.statusByStage.literature).toBe('completed');
    expect(state.statusByStage['scigraph-analysis']).toBe('in-progress');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm run test:run -- src/workflow/stageMachine.test.ts
```

Expected: FAIL because `src/workflow/stageMachine.ts` does not exist.

- [ ] **Step 3: Implement stage machine**

Create `src/workflow/stageMachine.ts`:

```ts
import type { StageStatus, WorkflowStageId } from '../domain/types';

export interface StageDefinition {
  id: WorkflowStageId;
  label: string;
  shortLabel: string;
  evidenceMode: 'scigraph' | 'labontology' | 'experimental-graph';
}

export interface StageMachineState {
  activeStageId: WorkflowStageId;
  statusByStage: Record<WorkflowStageId, StageStatus>;
}

export const stageDefinitions: StageDefinition[] = [
  { id: 'literature', label: 'Private Literature Library', shortLabel: 'Literature', evidenceMode: 'scigraph' },
  { id: 'scigraph-analysis', label: 'SciGraph Literature Analysis', shortLabel: 'SciGraph', evidenceMode: 'scigraph' },
  { id: 'report', label: 'Research Summary Report', shortLabel: 'Report', evidenceMode: 'scigraph' },
  { id: 'protocol-design', label: 'Experiment Protocol Design', shortLabel: 'Protocol', evidenceMode: 'labontology' },
  { id: 'labontology-check', label: 'LabOntology Validation', shortLabel: 'Validation', evidenceMode: 'labontology' },
  { id: 'simulation', label: 'Simulation Run', shortLabel: 'Simulation', evidenceMode: 'experimental-graph' },
  { id: 'experimental-graph', label: 'Experimental Graph Writeback', shortLabel: 'Graph', evidenceMode: 'experimental-graph' },
  { id: 'next-suggestion', label: 'Next-Round Suggestions', shortLabel: 'Suggest', evidenceMode: 'experimental-graph' }
];

export function createInitialStageState(): StageMachineState {
  return {
    activeStageId: 'literature',
    statusByStage: stageDefinitions.reduce(
      (accumulator, stage) => {
        accumulator[stage.id] = stage.id === 'literature' ? 'in-progress' : 'not-started';
        return accumulator;
      },
      {} as Record<WorkflowStageId, StageStatus>
    )
  };
}

export function advanceStage(state: StageMachineState): StageMachineState {
  const currentIndex = stageDefinitions.findIndex((stage) => stage.id === state.activeStageId);
  const nextStage = stageDefinitions[currentIndex + 1];

  if (!nextStage) {
    return {
      activeStageId: state.activeStageId,
      statusByStage: {
        ...state.statusByStage,
        [state.activeStageId]: 'completed'
      }
    };
  }

  return {
    activeStageId: nextStage.id,
    statusByStage: {
      ...state.statusByStage,
      [state.activeStageId]: 'completed',
      [nextStage.id]: 'in-progress'
    }
  };
}

export function markStage(state: StageMachineState, stageId: WorkflowStageId, status: StageStatus): StageMachineState {
  return {
    ...state,
    statusByStage: {
      ...state.statusByStage,
      [stageId]: status
    }
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
npm run test:run -- src/workflow/stageMachine.test.ts
```

Expected: PASS, 3 tests pass.

- [ ] **Step 5: Version checkpoint**

Run:

```powershell
git status --short
```

Expected in the current workspace: `fatal: not a git repository (or any of the parent directories): .git`.

If Git has been initialized:

```powershell
git add src/workflow
git commit -m "feat: add SciWork workflow stage machine"
```

## Task 5: Mock Scientific Service Pipeline

**Files:**

- Create: `src/services/scigraphAdapter.ts`
- Create: `src/services/reportService.ts`
- Create: `src/services/protocolDesigner.ts`
- Create: `src/services/labOntologyAdapter.ts`
- Create: `src/services/simulationEngine.ts`
- Create: `src/services/experimentalGraphStore.ts`
- Create: `src/services/sciencePipeline.test.ts`

- [ ] **Step 1: Write failing pipeline test**

Create `src/services/sciencePipeline.test.ts`:

```ts
import { demoLiterature, demoProject } from '../domain/demoData';
import { buildExperimentalGraph } from './experimentalGraphStore';
import { validateProtocol } from './labOntologyAdapter';
import { designProtocol } from './protocolDesigner';
import { generateResearchReport } from './reportService';
import { analyzeLiterature } from './scigraphAdapter';
import { runSimulation } from './simulationEngine';

describe('mock scientific service pipeline', () => {
  it('runs from private literature to Experimental Graph with traceable evidence', async () => {
    const analysis = await analyzeLiterature(demoLiterature);
    expect(analysis.entities.length).toBeGreaterThanOrEqual(5);
    expect(analysis.evidence.length).toBeGreaterThanOrEqual(3);

    const report = generateResearchReport(demoProject, demoLiterature, analysis);
    expect(report.evidenceIds.length).toBeGreaterThan(0);
    expect(report.candidateDirections[0]).toMatch(/mild/i);

    const protocol = designProtocol(report, 'prefer mild conditions and shorter reaction time');
    expect(protocol.parameters.temperature).toBe('55 C');
    expect(protocol.safetyNotes).toContain('Simulation only: do not submit to a physical device.');

    const validation = await validateProtocol(protocol);
    expect(validation.status).toBe('warning');
    expect(validation.constraints).toContain('Queue With Approval required before physical execution.');

    const run = await runSimulation(protocol);
    expect(run.status).toBe('completed-with-warning');
    expect(run.yieldPercent).toBeGreaterThanOrEqual(70);

    const graph = buildExperimentalGraph({
      project: demoProject,
      literature: demoLiterature,
      analysis,
      report,
      protocol,
      validation,
      run
    });

    expect(graph.nodes.some((node) => node.type === 'LiteratureEvidence')).toBe(true);
    expect(graph.nodes.some((node) => node.type === 'Result')).toBe(true);
    expect(graph.edges.some((edge) => edge.label === 'supports')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm run test:run -- src/services/sciencePipeline.test.ts
```

Expected: FAIL because the service modules do not exist.

- [ ] **Step 3: Implement SciGraph adapter**

Create `src/services/scigraphAdapter.ts`:

```ts
import type { EvidenceLink, LiteratureItem, SciGraphAnalysis, SciGraphEntity } from '../domain/types';

export async function analyzeLiterature(literatureSet: LiteratureItem[]): Promise<SciGraphAnalysis> {
  const entities: SciGraphEntity[] = [
    { id: 'entity-reaction-cross-coupling', label: 'Cross-coupling reaction', type: 'reaction', confidence: 0.92 },
    { id: 'entity-solvent-polar-aprotic', label: 'Polar aprotic solvent', type: 'solvent', confidence: 0.88 },
    { id: 'entity-catalyst-low-loading', label: 'Reduced catalyst loading', type: 'catalyst', confidence: 0.84 },
    { id: 'entity-temp-moderate', label: '45-65 C temperature window', type: 'condition', confidence: 0.9 },
    { id: 'entity-device-online-monitoring', label: 'Online conversion monitoring', type: 'instrument', confidence: 0.86 }
  ];

  const evidence: EvidenceLink[] = literatureSet.slice(0, 5).map((item, index) => ({
    id: `evidence-${index + 1}`,
    literatureId: item.id,
    quote: item.abstract,
    claim: item.evidenceTags.join(', '),
    confidence: 0.78 + index * 0.03
  }));

  return {
    entities,
    evidence,
    publicKnowledge: [
      'SciGraph alignment: moderate temperature windows reduce impurity risk for this reaction class.',
      'SciGraph alignment: online conversion monitoring can shorten low-value runs.',
      'SciGraph alignment: solvent and base compatibility should be checked before queue submission.'
    ]
  };
}
```

- [ ] **Step 4: Implement report service**

Create `src/services/reportService.ts`:

```ts
import type { LiteratureItem, Project, ResearchReport, SciGraphAnalysis } from '../domain/types';

export function generateResearchReport(
  project: Project,
  literature: LiteratureItem[],
  analysis: SciGraphAnalysis
): ResearchReport {
  return {
    question: project.objective,
    consensus: [
      'Moderate temperature conditions are favored for balancing conversion and impurity control.',
      'Solvent choice is a primary lever for conversion stability.',
      'Online monitoring supports shorter reaction runs when conversion plateaus.'
    ],
    disagreements: [
      'Lower catalyst loading improves cost but may increase run-to-run variability.',
      'Base selection has inconsistent impurity behavior across the private literature set.'
    ],
    uncertainties: [
      'The exact solvent-base interaction should be tested under the target device profile.',
      'The confidence score depends on simulated rather than physical observations in this first prototype.'
    ],
    candidateDirections: [
      'Mild cross-coupling condition screen at 55 C with online conversion monitoring.',
      'Reduced catalyst loading branch with early-stop monitoring.',
      'Base compatibility branch focused on impurity risk.'
    ],
    designRationale: [
      `The report uses ${literature.length} private literature items.`,
      `SciGraph contributed ${analysis.entities.length} aligned entities and ${analysis.publicKnowledge.length} public knowledge notes.`,
      'The recommended first protocol prioritizes mild conditions, shorter runtime, and queue-safe validation.'
    ].join(' '),
    evidenceIds: analysis.evidence.map((item) => item.id)
  };
}
```

- [ ] **Step 5: Implement protocol designer**

Create `src/services/protocolDesigner.ts`:

```ts
import type { ProtocolDraft, ResearchReport } from '../domain/types';

export function designProtocol(report: ResearchReport, userConstraint: string): ProtocolDraft {
  const wantsShortRun = /short|shorter|短|快/i.test(userConstraint);

  return {
    id: 'protocol-mild-cross-coupling-001',
    objective: report.question,
    reactionSystem: 'Automated mild cross-coupling condition screen',
    reagents: ['aryl halide substrate', 'organoboron coupling partner', 'carbonate base'],
    catalysts: ['low-loading palladium catalyst'],
    solvents: ['polar aprotic solvent candidate A', 'polar aprotic solvent candidate B'],
    device: 'Fudan-XtalPi automated reaction platform',
    parameters: {
      temperature: '55 C',
      reactionTime: wantsShortRun ? '90 min' : '120 min',
      samplingInterval: '15 min',
      scale: '0.10 mmol',
      atmosphere: 'inert'
    },
    steps: [
      {
        id: 'step-prepare',
        label: 'Prepare reaction plate',
        detail: 'Load substrate, coupling partner, base, solvent, and catalyst according to the simulated device map.',
        durationMinutes: 20
      },
      {
        id: 'step-react',
        label: 'Run reaction',
        detail: 'Heat to 55 C and monitor conversion every 15 minutes.',
        durationMinutes: wantsShortRun ? 90 : 120
      },
      {
        id: 'step-analyze',
        label: 'Analyze samples',
        detail: 'Use simulated online monitoring data to estimate conversion and impurity risk.',
        durationMinutes: 25
      }
    ],
    safetyNotes: [
      'Queue With Approval required before any physical execution.',
      'Simulation only: do not submit to a physical device.',
      'Check base and solvent compatibility before physical protocol export.'
    ]
  };
}
```

- [ ] **Step 6: Implement LabOntology adapter**

Create `src/services/labOntologyAdapter.ts`:

```ts
import type { LabOntologyValidation, ProtocolDraft } from '../domain/types';

export async function validateProtocol(protocol: ProtocolDraft): Promise<LabOntologyValidation> {
  const normalizedTerms = [
    `Device:${protocol.device}`,
    'Operation:ReactionPlatePreparation',
    'Operation:ThermalReaction',
    'Observation:OnlineConversionMonitoring',
    'SafetyPolicy:QueueWithApproval'
  ];

  return {
    status: 'warning',
    normalizedTerms,
    constraints: [
      'Queue With Approval required before physical execution.',
      'Temperature 55 C is inside the simulated mild chemistry range.',
      'Scale 0.10 mmol is inside the simulated device range.',
      'Sampling interval 15 min is supported by the simulated monitoring profile.'
    ],
    warnings: [
      'Physical execution is disabled in the first-round prototype.',
      'Base-solvent compatibility requires authorized device profile data before real export.'
    ]
  };
}
```

- [ ] **Step 7: Implement simulation engine**

Create `src/services/simulationEngine.ts`:

```ts
import type { ProtocolDraft, SimulationRunResult } from '../domain/types';

export async function runSimulation(protocol: ProtocolDraft): Promise<SimulationRunResult> {
  return {
    id: 'simulation-run-001',
    protocolId: protocol.id,
    status: 'completed-with-warning',
    yieldPercent: 76,
    conversionPercent: 84,
    confidence: 0.81,
    events: [
      {
        id: 'event-queued',
        time: '00:00',
        label: 'Queued for simulation',
        detail: 'Protocol entered the simulated Queue With Approval workflow.',
        severity: 'info'
      },
      {
        id: 'event-approved',
        time: '00:03',
        label: 'Simulation approved',
        detail: 'Human approval point acknowledged for demonstration.',
        severity: 'info'
      },
      {
        id: 'event-monitoring',
        time: '00:45',
        label: 'Conversion plateau detected',
        detail: 'Simulated monitoring indicates conversion is stabilizing before the planned endpoint.',
        severity: 'warning'
      },
      {
        id: 'event-completed',
        time: '01:30',
        label: 'Simulation completed',
        detail: 'Predicted yield is high enough to justify a narrower next-round condition screen.',
        severity: 'success'
      }
    ],
    interpretation:
      'The mild condition achieved stable simulated conversion with manageable impurity risk. The next round should narrow solvent choice and test a slightly lower catalyst loading.'
  };
}
```

- [ ] **Step 8: Implement Experimental Graph store**

Create `src/services/experimentalGraphStore.ts`:

```ts
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
    detail: `${entity.type} confidence ${Math.round(entity.confidence * 100)}%`
  }));

  const reportNode = {
    id: 'node-report',
    type: 'ReportClaim' as const,
    label: 'Research report',
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
    label: `LabOntology constraint ${index + 1}`,
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
    label: `${input.run.yieldPercent}% simulated yield`,
    detail: input.run.interpretation
  };

  const suggestionNode = {
    id: 'node-next-suggestion',
    type: 'NextSuggestion' as const,
    label: 'Narrow solvent and catalyst loading',
    detail: 'Run a smaller next-round screen around the best simulated solvent and reduced catalyst loading.'
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
```

- [ ] **Step 9: Run pipeline test to verify it passes**

Run:

```powershell
npm run test:run -- src/services/sciencePipeline.test.ts
```

Expected: PASS, 1 test passes.

- [ ] **Step 10: Version checkpoint**

Run:

```powershell
git status --short
```

Expected in the current workspace: `fatal: not a git repository (or any of the parent directories): .git`.

If Git has been initialized:

```powershell
git add src/services
git commit -m "feat: add mock scientific service pipeline"
```

## Task 6: Workflow Controller Hook

**Files:**

- Create: `src/hooks/useWorkflowController.ts`
- Create: `src/hooks/useWorkflowController.test.tsx`

- [ ] **Step 1: Write failing controller test**

Create `src/hooks/useWorkflowController.test.tsx`:

```tsx
import { act, renderHook } from '@testing-library/react';
import { useWorkflowController } from './useWorkflowController';

describe('useWorkflowController', () => {
  it('advances through the full deterministic demo workflow', async () => {
    const { result } = renderHook(() => useWorkflowController());

    expect(result.current.stageState.activeStageId).toBe('literature');
    expect(result.current.report).toBeNull();
    expect(result.current.experimentalGraph).toBeNull();

    await act(async () => {
      await result.current.runNextAction();
    });
    expect(result.current.stageState.activeStageId).toBe('scigraph-analysis');
    expect(result.current.analysis?.entities.length).toBeGreaterThan(0);

    await act(async () => {
      await result.current.runNextAction();
      await result.current.runNextAction('prefer mild conditions and shorter reaction time');
      await result.current.runNextAction();
      await result.current.runNextAction();
      await result.current.runNextAction();
      await result.current.runNextAction();
    });

    expect(result.current.stageState.activeStageId).toBe('next-suggestion');
    expect(result.current.experimentalGraph?.nodes.some((node) => node.type === 'NextSuggestion')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm run test:run -- src/hooks/useWorkflowController.test.tsx
```

Expected: FAIL because `src/hooks/useWorkflowController.ts` does not exist.

- [ ] **Step 3: Implement workflow controller hook**

Create `src/hooks/useWorkflowController.ts`:

```ts
import { useMemo, useState } from 'react';
import { demoLiterature, demoProject, demoSpace } from '../domain/demoData';
import type {
  ExperimentalGraph,
  LabOntologyValidation,
  NextSuggestion,
  ProtocolDraft,
  ResearchReport,
  SciGraphAnalysis,
  SimulationRunResult
} from '../domain/types';
import { buildExperimentalGraph } from '../services/experimentalGraphStore';
import { validateProtocol } from '../services/labOntologyAdapter';
import { designProtocol } from '../services/protocolDesigner';
import { generateResearchReport } from '../services/reportService';
import { analyzeLiterature } from '../services/scigraphAdapter';
import { runSimulation } from '../services/simulationEngine';
import { advanceStage, createInitialStageState } from '../workflow/stageMachine';

export function useWorkflowController() {
  const [stageState, setStageState] = useState(createInitialStageState);
  const [analysis, setAnalysis] = useState<SciGraphAnalysis | null>(null);
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [protocol, setProtocol] = useState<ProtocolDraft | null>(null);
  const [validation, setValidation] = useState<LabOntologyValidation | null>(null);
  const [simulationRun, setSimulationRun] = useState<SimulationRunResult | null>(null);
  const [experimentalGraph, setExperimentalGraph] = useState<ExperimentalGraph | null>(null);
  const [suggestions, setSuggestions] = useState<NextSuggestion[]>([]);
  const [message, setMessage] = useState('Ready to analyze the private literature library.');

  const canAdvance = useMemo(() => stageState.activeStageId !== 'next-suggestion', [stageState.activeStageId]);

  async function runNextAction(userConstraint = '') {
    const activeStage = stageState.activeStageId;

    if (activeStage === 'literature') {
      const nextAnalysis = await analyzeLiterature(demoLiterature);
      setAnalysis(nextAnalysis);
      setMessage('SciGraph aligned literature entities and evidence chains.');
      setStageState((current) => advanceStage(current));
      return;
    }

    if (activeStage === 'scigraph-analysis' && analysis) {
      const nextReport = generateResearchReport(demoProject, demoLiterature, analysis);
      setReport(nextReport);
      setMessage('Research report generated from private literature and SciGraph evidence.');
      setStageState((current) => advanceStage(current));
      return;
    }

    if (activeStage === 'report' && report) {
      const nextProtocol = designProtocol(report, userConstraint || 'prefer mild conditions and shorter reaction time');
      setProtocol(nextProtocol);
      setMessage('Protocol draft created from the research report and user constraints.');
      setStageState((current) => advanceStage(current));
      return;
    }

    if (activeStage === 'protocol-design' && protocol) {
      const nextValidation = await validateProtocol(protocol);
      setValidation(nextValidation);
      setMessage('LabOntology validation completed with simulation-only warnings.');
      setStageState((current) => advanceStage(current));
      return;
    }

    if (activeStage === 'labontology-check' && protocol) {
      const nextRun = await runSimulation(protocol);
      setSimulationRun(nextRun);
      setMessage('Simulation completed and generated observations.');
      setStageState((current) => advanceStage(current));
      return;
    }

    if (activeStage === 'simulation' && analysis && report && protocol && validation && simulationRun) {
      const graph = buildExperimentalGraph({
        project: demoProject,
        literature: demoLiterature,
        analysis,
        report,
        protocol,
        validation,
        run: simulationRun
      });
      setExperimentalGraph(graph);
      setMessage('Experimental Graph writeback completed.');
      setStageState((current) => advanceStage(current));
      return;
    }

    if (activeStage === 'experimental-graph') {
      setSuggestions([
        {
          id: 'suggestion-001',
          label: 'Narrow solvent candidates',
          rationale: 'The simulated run indicates conversion stability under the current mild temperature window.',
          expectedImpact: 'Reduce experimental search space while preserving yield confidence.'
        },
        {
          id: 'suggestion-002',
          label: 'Test lower catalyst loading',
          rationale: 'Private literature suggests cost reduction is possible but variability should be watched.',
          expectedImpact: 'Improve cost profile if conversion remains above 80%.'
        }
      ]);
      setMessage('Next-round suggestions generated from the Experimental Graph.');
      setStageState((current) => advanceStage(current));
    }
  }

  return {
    space: demoSpace,
    project: demoProject,
    literature: demoLiterature,
    stageState,
    analysis,
    report,
    protocol,
    validation,
    simulationRun,
    experimentalGraph,
    suggestions,
    message,
    canAdvance,
    runNextAction
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
npm run test:run -- src/hooks/useWorkflowController.test.tsx
```

Expected: PASS, 1 test passes.

- [ ] **Step 5: Version checkpoint**

Run:

```powershell
git status --short
```

Expected in the current workspace: `fatal: not a git repository (or any of the parent directories): .git`.

If Git has been initialized:

```powershell
git add src/hooks
git commit -m "feat: add workflow controller hook"
```

## Task 7: Desktop UI Components

**Files:**

- Create: `src/components/TopBar.tsx`
- Create: `src/components/AssetRail.tsx`
- Create: `src/components/CenterStage.tsx`
- Create: `src/components/EvidencePanel.tsx`
- Create: `src/components/CommandBar.tsx`
- Create: `src/components/CharacterCue.tsx`
- Create: `src/components/GraphView.tsx`
- Modify: `src/App.tsx`
- Create: `src/App.test.tsx`

- [ ] **Step 1: Write failing app interaction test**

Create `src/App.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { App } from './App';

describe('SciWork Desktop app', () => {
  it('renders the workflow-first cockpit and advances through the demo loop', async () => {
    render(<App />);

    expect(screen.getByText('复旦晶泰自动化化学反应空间')).toBeInTheDocument();
    expect(screen.getByText('Private Literature Library')).toBeInTheDocument();
    expect(screen.getByText('SciGraph Evidence')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Analyze Literature/i }));
    expect(await screen.findByText(/SciGraph aligned literature entities/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Generate Report/i }));
    expect(await screen.findByText(/Research Summary Report/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Workflow command'), {
      target: { value: 'prefer mild conditions and shorter reaction time' }
    });
    fireEvent.click(screen.getByRole('button', { name: /Draft Protocol/i }));
    expect(await screen.findByText(/Automated mild cross-coupling/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Validate with LabOntology/i }));
    fireEvent.click(screen.getByRole('button', { name: /Run Simulation/i }));
    fireEvent.click(screen.getByRole('button', { name: /Write Back to Experimental Graph/i }));
    fireEvent.click(screen.getByRole('button', { name: /Generate Next Suggestions/i }));

    expect(await screen.findByText('Narrow solvent candidates')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm run test:run -- src/App.test.tsx
```

Expected: FAIL because App still renders the initial boot screen.

- [ ] **Step 3: Implement TopBar**

Create `src/components/TopBar.tsx`:

```tsx
import { FlaskConical, ShieldCheck } from 'lucide-react';
import type { Project, ScientificSpace } from '../domain/types';
import type { ThemeDefinition } from '../theme/themeRegistry';

interface TopBarProps {
  space: ScientificSpace;
  project: Project;
  theme: ThemeDefinition;
}

export function TopBar({ space, project, theme }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="brand-block">
        <div className="brand-mark">SW</div>
        <div>
          <div className="product-name">SciWork Desktop</div>
          <div className="space-name">{space.name}</div>
        </div>
      </div>
      <div className="project-chip">
        <FlaskConical size={16} />
        <span>{project.name}</span>
      </div>
      <div className="topbar-meta">
        <span>{theme.label}</span>
        <span>Mock / Simulation</span>
        <span className="approval-chip">
          <ShieldCheck size={14} />
          {space.policy}
        </span>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Implement AssetRail**

Create `src/components/AssetRail.tsx`:

```tsx
import { CheckCircle2, Circle, Clock3, TriangleAlert } from 'lucide-react';
import type { StageStatus, WorkflowStageId } from '../domain/types';
import { stageDefinitions } from '../workflow/stageMachine';

interface AssetRailProps {
  activeStageId: WorkflowStageId;
  statusByStage: Record<WorkflowStageId, StageStatus>;
}

function StatusIcon({ status }: { status: StageStatus }) {
  if (status === 'completed') return <CheckCircle2 size={15} />;
  if (status === 'in-progress') return <Clock3 size={15} />;
  if (status === 'warning' || status === 'needs-revision' || status === 'needs-approval') return <TriangleAlert size={15} />;
  return <Circle size={15} />;
}

export function AssetRail({ activeStageId, statusByStage }: AssetRailProps) {
  return (
    <aside className="asset-rail" aria-label="Workflow assets">
      <div className="rail-section-title">Project Assets</div>
      {stageDefinitions.map((stage) => (
        <div
          className={`asset-item ${stage.id === activeStageId ? 'asset-item--active' : ''}`}
          key={stage.id}
        >
          <StatusIcon status={statusByStage[stage.id]} />
          <div>
            <div>{stage.shortLabel}</div>
            <small>{statusByStage[stage.id]}</small>
          </div>
        </div>
      ))}
    </aside>
  );
}
```

- [ ] **Step 5: Implement CharacterCue**

Create `src/components/CharacterCue.tsx`:

```tsx
interface CharacterCueProps {
  imageUrl: string;
  message: string;
}

export function CharacterCue({ imageUrl, message }: CharacterCueProps) {
  return (
    <section className="character-cue">
      <img src={imageUrl} alt="SciWork scientist assistant" />
      <div>
        <div className="cue-title">SciWork Assistant</div>
        <p>{message}</p>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Implement GraphView**

Create `src/components/GraphView.tsx`:

```tsx
import type { ExperimentalGraph } from '../domain/types';

interface GraphViewProps {
  graph: ExperimentalGraph | null;
}

export function GraphView({ graph }: GraphViewProps) {
  if (!graph) {
    return <div className="graph-empty">Experimental Graph will appear after simulation writeback.</div>;
  }

  return (
    <div className="graph-view">
      <div className="graph-summary">
        <span>{graph.nodes.length} nodes</span>
        <span>{graph.edges.length} edges</span>
      </div>
      <div className="graph-node-list">
        {graph.nodes.slice(0, 10).map((node) => (
          <div className="graph-node" key={node.id}>
            <strong>{node.type}</strong>
            <span>{node.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Implement EvidencePanel**

Create `src/components/EvidencePanel.tsx`:

```tsx
import type { ExperimentalGraph, LabOntologyValidation, SciGraphAnalysis, WorkflowStageId } from '../domain/types';
import { GraphView } from './GraphView';

interface EvidencePanelProps {
  activeStageId: WorkflowStageId;
  analysis: SciGraphAnalysis | null;
  validation: LabOntologyValidation | null;
  graph: ExperimentalGraph | null;
}

export function EvidencePanel({ activeStageId, analysis, validation, graph }: EvidencePanelProps) {
  const isLabOntology = activeStageId === 'protocol-design' || activeStageId === 'labontology-check';
  const isExperimentalGraph = activeStageId === 'simulation' || activeStageId === 'experimental-graph' || activeStageId === 'next-suggestion';

  if (isLabOntology) {
    return (
      <aside className="evidence-panel">
        <h2>LabOntology Constraints</h2>
        {validation ? (
          <ul>
            {validation.constraints.map((constraint) => (
              <li key={constraint}>{constraint}</li>
            ))}
          </ul>
        ) : (
          <p>Protocol validation will normalize experiment terms and check simulated safety boundaries.</p>
        )}
      </aside>
    );
  }

  if (isExperimentalGraph) {
    return (
      <aside className="evidence-panel">
        <h2>Experimental Graph</h2>
        <GraphView graph={graph} />
      </aside>
    );
  }

  return (
    <aside className="evidence-panel">
      <h2>SciGraph Evidence</h2>
      {analysis ? (
        <>
          <div className="metric-row">
            <span>{analysis.entities.length} entities</span>
            <span>{analysis.evidence.length} evidence links</span>
          </div>
          <ul>
            {analysis.publicKnowledge.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      ) : (
        <p>SciGraph will align private literature with public reaction knowledge.</p>
      )}
    </aside>
  );
}
```

- [ ] **Step 8: Implement CenterStage**

Create `src/components/CenterStage.tsx`:

```tsx
import type {
  ExperimentalGraph,
  LabOntologyValidation,
  LiteratureItem,
  NextSuggestion,
  ProtocolDraft,
  ResearchReport,
  SciGraphAnalysis,
  SimulationRunResult,
  WorkflowStageId
} from '../domain/types';
import { GraphView } from './GraphView';

interface CenterStageProps {
  activeStageId: WorkflowStageId;
  literature: LiteratureItem[];
  analysis: SciGraphAnalysis | null;
  report: ResearchReport | null;
  protocol: ProtocolDraft | null;
  validation: LabOntologyValidation | null;
  simulationRun: SimulationRunResult | null;
  graph: ExperimentalGraph | null;
  suggestions: NextSuggestion[];
}

export function CenterStage(props: CenterStageProps) {
  if (props.activeStageId === 'literature') {
    return (
      <section className="center-stage">
        <h1>Private Literature Library</h1>
        <p>Sample private literature is preloaded. Local Markdown and TXT import can be added in the implementation pass.</p>
        <div className="literature-grid">
          {props.literature.map((item) => (
            <article className="literature-card" key={item.id}>
              <h3>{item.title}</h3>
              <p>{item.abstract}</p>
              <small>{item.source} · {item.year}</small>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (props.activeStageId === 'scigraph-analysis') {
    return (
      <section className="center-stage">
        <h1>SciGraph Literature Analysis</h1>
        <div className="entity-grid">
          {props.analysis?.entities.map((entity) => (
            <div className="entity-card" key={entity.id}>
              <strong>{entity.label}</strong>
              <span>{entity.type} · {Math.round(entity.confidence * 100)}%</span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (props.activeStageId === 'report') {
    return (
      <section className="center-stage report-surface">
        <h1>Research Summary Report</h1>
        <h2>Consensus</h2>
        <ul>{props.report?.consensus.map((item) => <li key={item}>{item}</li>)}</ul>
        <h2>Candidate Directions</h2>
        <ul>{props.report?.candidateDirections.map((item) => <li key={item}>{item}</li>)}</ul>
        <p>{props.report?.designRationale}</p>
      </section>
    );
  }

  if (props.activeStageId === 'protocol-design') {
    return (
      <section className="center-stage">
        <h1>Experiment Protocol Design</h1>
        <h2>{props.protocol?.reactionSystem}</h2>
        <div className="parameter-grid">
          {props.protocol && Object.entries(props.protocol.parameters).map(([key, value]) => (
            <div className="parameter-card" key={key}>
              <span>{key}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <ol>{props.protocol?.steps.map((step) => <li key={step.id}>{step.label}: {step.detail}</li>)}</ol>
      </section>
    );
  }

  if (props.activeStageId === 'labontology-check') {
    return (
      <section className="center-stage">
        <h1>LabOntology Validation</h1>
        <p>Status: {props.validation?.status}</p>
        <ul>{props.validation?.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
      </section>
    );
  }

  if (props.activeStageId === 'simulation') {
    return (
      <section className="center-stage">
        <h1>Simulation Run</h1>
        <div className="metric-row">
          <span>Yield {props.simulationRun?.yieldPercent}%</span>
          <span>Conversion {props.simulationRun?.conversionPercent}%</span>
          <span>Confidence {Math.round((props.simulationRun?.confidence ?? 0) * 100)}%</span>
        </div>
        <ol>{props.simulationRun?.events.map((event) => <li key={event.id}>{event.time} · {event.label}: {event.detail}</li>)}</ol>
      </section>
    );
  }

  if (props.activeStageId === 'experimental-graph') {
    return (
      <section className="center-stage">
        <h1>Experimental Graph Writeback</h1>
        <GraphView graph={props.graph} />
      </section>
    );
  }

  return (
    <section className="center-stage">
      <h1>Next-Round Suggestions</h1>
      <div className="suggestion-grid">
        {props.suggestions.map((suggestion) => (
          <article className="suggestion-card" key={suggestion.id}>
            <h2>{suggestion.label}</h2>
            <p>{suggestion.rationale}</p>
            <strong>{suggestion.expectedImpact}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 9: Implement CommandBar**

Create `src/components/CommandBar.tsx`:

```tsx
import { SendHorizontal } from 'lucide-react';
import { useState } from 'react';
import type { WorkflowStageId } from '../domain/types';

interface CommandBarProps {
  activeStageId: WorkflowStageId;
  canAdvance: boolean;
  onRun: (constraint: string) => Promise<void>;
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

export function CommandBar({ activeStageId, canAdvance, onRun }: CommandBarProps) {
  const [constraint, setConstraint] = useState('');

  async function handleRun() {
    await onRun(constraint);
  }

  return (
    <footer className="command-bar">
      <label className="sr-only" htmlFor="workflow-command">Workflow command</label>
      <input
        aria-label="Workflow command"
        id="workflow-command"
        value={constraint}
        onChange={(event) => setConstraint(event.target.value)}
        title="Add a constraint, e.g. prefer mild conditions and shorter reaction time"
      />
      <button disabled={!canAdvance} onClick={handleRun} type="button">
        <SendHorizontal size={16} />
        {actionLabels[activeStageId]}
      </button>
    </footer>
  );
}
```

- [ ] **Step 10: Assemble App**

Modify `src/App.tsx`:

```tsx
import { AssetRail } from './components/AssetRail';
import { CenterStage } from './components/CenterStage';
import { CharacterCue } from './components/CharacterCue';
import { CommandBar } from './components/CommandBar';
import { EvidencePanel } from './components/EvidencePanel';
import { TopBar } from './components/TopBar';
import { useWorkflowController } from './hooks/useWorkflowController';
import { getActiveTheme, getBackground, getCharacter } from './theme/themeRegistry';

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

  return (
    <main className={`app app--${theme.tone}`} style={{ backgroundImage: `linear-gradient(rgba(5, 18, 34, 0.34), rgba(5, 18, 34, 0.52)), url(${background})` }}>
      <TopBar space={workflow.space} project={workflow.project} theme={theme} />
      <div className="workspace">
        <AssetRail
          activeStageId={workflow.stageState.activeStageId}
          statusByStage={workflow.stageState.statusByStage}
        />
        <div className="stage-column">
          <CharacterCue imageUrl={getCharacter('assistantAvatar')} message={workflow.message} />
          <CenterStage
            activeStageId={workflow.stageState.activeStageId}
            literature={workflow.literature}
            analysis={workflow.analysis}
            report={workflow.report}
            protocol={workflow.protocol}
            validation={workflow.validation}
            simulationRun={workflow.simulationRun}
            graph={workflow.experimentalGraph}
            suggestions={workflow.suggestions}
          />
        </div>
        <EvidencePanel
          activeStageId={workflow.stageState.activeStageId}
          analysis={workflow.analysis}
          validation={workflow.validation}
          graph={workflow.experimentalGraph}
        />
      </div>
      <CommandBar
        activeStageId={workflow.stageState.activeStageId}
        canAdvance={workflow.canAdvance}
        onRun={workflow.runNextAction}
      />
    </main>
  );
}
```

- [ ] **Step 11: Run app test to verify it passes**

Run:

```powershell
npm run test:run -- src/App.test.tsx
```

Expected: PASS, 1 test passes.

- [ ] **Step 12: Version checkpoint**

Run:

```powershell
git status --short
```

Expected in the current workspace: `fatal: not a git repository (or any of the parent directories): .git`.

If Git has been initialized:

```powershell
git add src/components src/App.tsx src/App.test.tsx
git commit -m "feat: assemble SciWork desktop workflow UI"
```

## Task 8: Desktop Visual Styling

**Files:**

- Modify: `src/App.css`

- [ ] **Step 1: Replace boot CSS with full Desktop styling**

Modify `src/App.css`:

```css
:root {
  color: #102033;
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

.app {
  min-height: 100vh;
  color: #152033;
  background-size: cover;
  background-position: center;
  display: grid;
  grid-template-rows: 68px 1fr 76px;
}

.topbar {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 0 22px;
  color: #f4f9ff;
  background: rgba(4, 18, 36, 0.74);
  border-bottom: 1px solid rgba(188, 215, 243, 0.24);
  backdrop-filter: blur(18px);
}

.brand-block,
.project-chip,
.topbar-meta,
.approval-chip,
.metric-row,
.command-bar,
.graph-summary {
  display: flex;
  align-items: center;
}

.brand-block {
  gap: 12px;
  min-width: 320px;
}

.brand-mark {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: #0b5cad;
  color: #fff;
  font-weight: 700;
}

.product-name {
  font-weight: 700;
}

.space-name,
.topbar-meta,
.asset-item small,
.literature-card small {
  color: #b9c8d8;
  font-size: 12px;
}

.project-chip,
.approval-chip {
  gap: 8px;
  border: 1px solid rgba(212, 227, 244, 0.25);
  border-radius: 999px;
  padding: 7px 12px;
  background: rgba(255, 255, 255, 0.08);
}

.topbar-meta {
  margin-left: auto;
  gap: 10px;
}

.approval-chip {
  color: #ffe7e7;
  background: rgba(176, 31, 36, 0.22);
}

.workspace {
  min-height: 0;
  display: grid;
  grid-template-columns: 250px minmax(520px, 1fr) 330px;
  gap: 14px;
  padding: 14px;
}

.asset-rail,
.center-stage,
.evidence-panel,
.character-cue,
.command-bar {
  border: 1px solid rgba(221, 232, 244, 0.42);
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 18px 42px rgba(2, 8, 23, 0.18);
  backdrop-filter: blur(20px);
}

.asset-rail,
.evidence-panel {
  border-radius: 12px;
  padding: 14px;
  overflow: auto;
}

.rail-section-title {
  color: #48627f;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  margin-bottom: 12px;
}

.asset-item {
  display: grid;
  grid-template-columns: 20px 1fr;
  gap: 9px;
  align-items: start;
  padding: 10px;
  border-radius: 10px;
  color: #26384d;
}

.asset-item--active {
  color: #0b5cad;
  background: rgba(11, 92, 173, 0.1);
}

.stage-column {
  min-width: 0;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 12px;
}

.character-cue {
  min-height: 104px;
  display: grid;
  grid-template-columns: 74px 1fr;
  gap: 14px;
  align-items: center;
  border-radius: 12px;
  padding: 12px 16px;
}

.character-cue img {
  width: 64px;
  height: 80px;
  object-fit: cover;
  object-position: top;
  border-radius: 14px;
  background: #eef4fb;
}

.cue-title {
  font-weight: 700;
  color: #0b5cad;
}

.character-cue p,
.center-stage p,
.evidence-panel p {
  margin: 6px 0 0;
  color: #4c5f76;
}

.center-stage {
  min-height: 0;
  overflow: auto;
  border-radius: 12px;
  padding: 18px;
}

.center-stage h1,
.evidence-panel h2 {
  margin: 0 0 14px;
}

.center-stage h1 {
  font-size: 24px;
  color: #102d4f;
}

.center-stage h2,
.evidence-panel h2 {
  font-size: 16px;
  color: #183959;
}

.literature-grid,
.entity-grid,
.parameter-grid,
.suggestion-grid,
.graph-node-list {
  display: grid;
  gap: 10px;
}

.literature-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.entity-grid,
.parameter-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.literature-card,
.entity-card,
.parameter-card,
.suggestion-card,
.graph-node {
  border: 1px solid #dce6f1;
  border-radius: 10px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.88);
}

.literature-card h3,
.suggestion-card h2 {
  margin: 0 0 8px;
  font-size: 15px;
  color: #102d4f;
}

.entity-card strong,
.parameter-card strong,
.graph-node strong {
  display: block;
  color: #0b5cad;
}

.entity-card span,
.parameter-card span,
.graph-node span {
  color: #52677f;
  font-size: 12px;
}

.report-surface {
  background: rgba(255, 252, 244, 0.9);
}

.metric-row,
.graph-summary {
  gap: 9px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.metric-row span,
.graph-summary span {
  border-radius: 999px;
  padding: 6px 10px;
  color: #0b4d8c;
  background: rgba(11, 92, 173, 0.1);
}

.evidence-panel ul,
.center-stage ul,
.center-stage ol {
  color: #384d64;
  padding-left: 20px;
}

.graph-empty {
  color: #60758f;
  border: 1px dashed #b8c7d8;
  border-radius: 10px;
  padding: 16px;
}

.command-bar {
  gap: 12px;
  margin: 0 14px 14px;
  border-radius: 14px;
  padding: 12px;
}

.command-bar input {
  flex: 1;
  min-width: 0;
  height: 44px;
  border: 1px solid #c8d6e6;
  border-radius: 10px;
  padding: 0 14px;
  background: rgba(255, 255, 255, 0.94);
}

.command-bar button {
  height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 0;
  border-radius: 10px;
  padding: 0 16px;
  color: #fff;
  background: #b01f24;
  cursor: pointer;
}

.command-bar button:disabled {
  cursor: not-allowed;
  background: #8a9aab;
}

@media (max-width: 1180px) {
  .workspace {
    grid-template-columns: 210px minmax(430px, 1fr);
  }

  .evidence-panel {
    grid-column: 1 / -1;
  }
}
```

- [ ] **Step 2: Run app and type checks**

Run:

```powershell
npm run test:run -- src/App.test.tsx
npm run typecheck
```

Expected: both commands exit with code `0`.

- [ ] **Step 3: Version checkpoint**

Run:

```powershell
git status --short
```

Expected in the current workspace: `fatal: not a git repository (or any of the parent directories): .git`.

If Git has been initialized:

```powershell
git add src/App.css
git commit -m "style: add SciWork desktop cockpit styling"
```

## Task 9: Full Validation and Local Run

**Files:**

- No file changes expected unless validation exposes a defect.

- [ ] **Step 1: Run all tests**

Run:

```powershell
npm run test:run
```

Expected: PASS for:

- `src/domain/demoData.test.ts`
- `src/theme/themeRegistry.test.ts`
- `src/workflow/stageMachine.test.ts`
- `src/services/sciencePipeline.test.ts`
- `src/hooks/useWorkflowController.test.tsx`
- `src/App.test.tsx`

- [ ] **Step 2: Run production build**

Run:

```powershell
npm run build
```

Expected: `typecheck`, `test:run`, `build:vite`, and `build:electron` all exit with code `0`. `dist/` and `dist-electron/` are created.

- [ ] **Step 3: Start local desktop app**

Run:

```powershell
npm run dev
```

Expected: Vite serves `http://127.0.0.1:5173`, Electron opens a window titled `SciWork Desktop`, and the first screen shows:

- `SciWork Desktop`
- `复旦晶泰自动化化学反应空间`
- `Private Literature Library`
- `SciGraph Evidence`
- `Analyze Literature`

- [ ] **Step 4: Manually exercise the workflow**

In the Electron window:

1. Click `Analyze Literature`.
2. Click `Generate Report`.
3. Type `prefer mild conditions and shorter reaction time`.
4. Click `Draft Protocol`.
5. Click `Validate with LabOntology`.
6. Click `Run Simulation`.
7. Click `Write Back to Experimental Graph`.
8. Click `Generate Next Suggestions`.

Expected final screen:

- Active stage is `Next Suggestions`.
- A suggestion named `Narrow solvent candidates` is visible.
- Right panel shows `Experimental Graph`.
- UI labels still say `Mock / Simulation` and `Queue With Approval`.

- [ ] **Step 5: Confirm asset replacement boundary**

Temporarily rename this file:

```text
assets/themes/sciwork-theme-qiushi-blue-graph-zju-v2.png
```

to:

```text
assets/themes/sciwork-theme-qiushi-blue-graph-zju-v2.disabled.png
```

Run:

```powershell
npm run dev
```

Expected: the app still starts. The background image may be missing, but panels, text, and workflow remain usable because CSS background color is present. Rename the file back to `sciwork-theme-qiushi-blue-graph-zju-v2.png` before finishing the task.

- [ ] **Step 6: Version checkpoint**

Run:

```powershell
git status --short
```

Expected in the current workspace: `fatal: not a git repository (or any of the parent directories): .git`.

If Git has been initialized:

```powershell
git add .
git commit -m "test: validate SciWork desktop prototype"
```

## Task 10: Implementation Notes for Final Handoff

**Files:**

- Create: `docs/superpowers/plans/2026-06-10-sciwork-desktop-first-round-validation.md`

- [ ] **Step 1: Create validation notes after implementation**

Create `docs/superpowers/plans/2026-06-10-sciwork-desktop-first-round-validation.md`:

```markdown
# SciWork Desktop First-Round Validation Notes

Date: 2026-06-10

## Commands Run

- `npm run test:run`
- `npm run build`
- `npm run dev`

## Manual Workflow Result

- Started in Fudan-XtalPi automated chemistry reaction space.
- Advanced from private literature library to next-round suggestions.
- SciGraph evidence appeared during literature and report stages.
- LabOntology constraints appeared during protocol validation.
- Experimental Graph appeared after simulation writeback.
- Execution labels remained Simulation Only / Mock.

## Asset Registry Result

- Default ZJU-inspired background loaded from `assets/themes/`.
- Scientist assistant loaded from `assets/characters/`.
- Temporarily missing background did not block workflow interaction.

## Remaining Known Limits

- No real SciGraph-SCP connection.
- No real LabOntology service.
- No real device execution.
- No persistent database.
- No full PDF semantic parsing.
```

- [ ] **Step 2: Version checkpoint**

Run:

```powershell
git status --short
```

Expected in the current workspace: `fatal: not a git repository (or any of the parent directories): .git`.

If Git has been initialized:

```powershell
git add docs/superpowers/plans/2026-06-10-sciwork-desktop-first-round-validation.md
git commit -m "docs: record SciWork desktop validation"
```

## Self-Review

Spec coverage:

- Runnable Electron Desktop: Tasks 1 and 9.
- Fudan-XtalPi default space and project: Tasks 2, 6, and 7.
- Workflow-first Desktop layout: Tasks 4, 6, 7, and 8.
- Private literature and import boundary: Task 2 provides sample literature; Task 9 keeps import out of the stable demo path.
- SciGraph, LabOntology, Experimental Graph adapter/mock boundaries: Tasks 5 and 7.
- Theme and IP asset registry: Task 3, Task 8, and Task 9.
- Simulation-only safety boundary: Tasks 5, 6, 7, and 9.
- Tests and validation: every task includes a verification command; Task 9 validates the full app.

Red-flag scan:

- No unresolved markers.
- No deferred-work markers.
- No task shortcut language.
- No implementation step depends on undefined service names.

Type consistency:

- `WorkflowStageId` values match `stageDefinitions`.
- Service return types match `src/domain/types.ts`.
- Hook state names match App props.
- Theme slots match `ThemeAssetRegistry`.
