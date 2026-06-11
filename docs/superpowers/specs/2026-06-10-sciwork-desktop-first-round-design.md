# SciWork Desktop First-Round Prototype Design

Date: 2026-06-10

## 1. Purpose

The first-round SciWork Desktop prototype is a runnable desktop application that demonstrates the scientific discovery loop for the Fudan-XtalPi automated chemistry reaction space.

The prototype must show two core capabilities:

1. Private literature library management, literature analysis, and research report generation.
2. Experiment protocol design based on the report, followed by simulated execution, result writeback, and next-round suggestions.

This prototype is not a full research management platform and does not connect to real instruments. It is a deterministic demonstration of the Desktop interaction model, data flow, and future integration boundaries.

## 2. Product Scope

The first version opens directly into one scientific discovery space:

- Space: Fudan-XtalPi automated chemistry reaction space.
- Project: one preloaded demonstration project.
- Execution mode: simulation only.
- Safety policy: Queue With Approval, represented in the UI even though no real physical execution happens.

The main workflow is:

```text
Private Literature Library
  -> SciGraph Literature Analysis
  -> Research Summary Report
  -> Experiment Protocol Design
  -> LabOntology Validation
  -> Simulation Run
  -> Experimental Graph Writeback
  -> Next-Round Suggestions
```

The prototype should make it clear where SciGraph, LabOntology, and Experimental Graph participate:

- SciGraph is used during literature analysis for public knowledge alignment, entity completion, and evidence expansion.
- LabOntology is used during protocol design and task validation for experiment semantics, reagent/device constraints, and parameter boundaries.
- Experimental Graph is used during simulation and writeback to organize objectives, evidence, protocol, run events, observations, results, conclusions, and next suggestions.

## 3. Desktop Information Architecture

The application uses a workflow-first Desktop structure. It borrows the working model of Codex Desktop and Claude Desktop: a stable desktop shell, project context, a task-driving center pane, and contextual side panels. It should not look like a marketing landing page.

### 3.1 Top Bar

The top bar shows:

- Product identity: SciWork.
- Current space: Fudan-XtalPi automated chemistry reaction space.
- Current project name.
- Active theme.
- Runtime mode: Mock / Simulation.
- Safety policy: Queue With Approval.

### 3.2 Left Asset Rail

The left rail is the project asset tree:

- Private Literature.
- SciGraph Analysis.
- Research Report.
- Protocol Draft.
- LabOntology Check.
- Simulation Run.
- Experimental Graph.
- Next Suggestions.

Each item has a stage state:

- Not started.
- In progress.
- Completed.
- Needs approval.
- Needs revision.
- Warning or anomaly.

### 3.3 Center Stage

The center stage shows the active workflow stage:

- Literature stage: sample literature library and local import entry.
- SciGraph stage: entity alignment, public knowledge expansion, and evidence extraction.
- Report stage: structured research report.
- Protocol stage: objective, reaction system, reagents, devices, steps, parameters, risks, and expected observations.
- LabOntology stage: terminology normalization, parameter checks, device checks, safety checks, and approval status.
- Simulation stage: queue state, timeline, observations, generated results, and possible anomaly.
- Experimental Graph stage: nodes and edges representing the full experiment process.
- Next suggestion stage: recommended next-round reaction conditions and rationale.

### 3.4 Right Evidence Panel

The right panel changes with the stage:

- Literature and report stages show SciGraph evidence chains.
- Protocol and validation stages show LabOntology constraints.
- Simulation and writeback stages show Experimental Graph nodes and edges.

### 3.5 Bottom Command Bar

The bottom command bar is a stage-driving command input, not a generic chat box. It accepts short natural-language constraints and exposes explicit workflow actions:

- Analyze Literature.
- Generate Report.
- Draft Protocol.
- Validate with LabOntology.
- Run Simulation.
- Write Back to Experimental Graph.
- Generate Next Suggestions.

The first-round workflow is deterministic. Buttons advance mock data through the system. User input can adjust simple constraints such as "prefer mild conditions" or "shorter reaction time", but the prototype must not depend on a live LLM call to complete the demo.

## 4. Visual Direction and Theme System

The visual system should be professional, quiet, and suitable for repeated scientific work. It should reference Codex Desktop and Claude Desktop in interaction structure, but SciWork must have its own visual identity.

The default visual language combines:

- Zhejiang blue as the main structural color.
- Qiushi red as a restrained accent for approval, risk, anomaly, and critical actions.
- Subtle Chinese academic elements.
- Modern AI and knowledge graph motifs.
- Scientific cockpit clarity rather than decorative showmanship.

### 4.1 Theme Skins

The first round includes three theme directions:

1. Qiushi Blue Graph
   - Default Desktop theme.
   - Deep blue knowledge graph background.
   - Best for the main workflow.

2. Ink Scholar
   - Light report-reading theme.
   - Warm paper texture, subtle ink atmosphere, and knowledge graph motifs.
   - Best for literature and research report stages.

3. Graph Night
   - Dark simulation and monitoring theme.
   - Stronger Experimental Graph and reaction network feel.
   - Best for simulation, run timeline, and demo mode.

### 4.2 Zhejiang University Identity Handling

The prototype may use Zhejiang University-inspired visual cues:

- Qiushi Lecture Hall-inspired or traditional campus architecture silhouettes.
- Zhejiang blue and Qiushi red palette.
- Academic and knowledge graph motifs.
- A non-official ZJU-inspired badge asset slot on the IP character.

The prototype must not reproduce, counterfeit, or hard-code an official university seal or logo. If authorized official assets are provided later, they can replace the non-official badge asset through the asset registry.

### 4.3 Replaceable Asset Slots

IP character and backgrounds must be replaceable without editing page components.

Assets are organized under:

```text
assets/
  themes/
  characters/
```

Current image assets:

```text
assets/themes/sciwork-theme-qiushi-blue-graph.png
assets/themes/sciwork-theme-ink-scholar.png
assets/themes/sciwork-theme-graph-night.png
assets/characters/sciwork-character-scientist-assistant.png
assets/themes/sciwork-theme-qiushi-blue-graph-zju-v2.png
assets/themes/sciwork-theme-ink-scholar-zju-v2.png
assets/themes/sciwork-theme-graph-night-zju-v2.png
assets/characters/sciwork-character-scientist-assistant-zju-v2.png
```

The frontend should use a theme manifest or registry rather than direct file references inside components. Stable slots:

- `desktopBackground`.
- `reportBackground`.
- `executionBackground`.
- `assistantAvatar`.
- `emptyStateCharacter`.
- `approvalCharacter`.

Components only consume the active asset slot. Future background images, IP characters, authorized badges, or official imagery can be swapped by editing the registry.

## 5. Application Architecture

The first-round implementation should use:

- Electron for the desktop shell and future local capability boundary.
- React for the renderer UI.
- Vite for frontend tooling.
- TypeScript for typed state, adapters, and data models.

Electron should remain thin. Most prototype logic belongs in the React renderer and service layer.

### 5.1 Core Modules

#### DesktopShell

Owns the application layout:

- Top bar.
- Left asset rail.
- Center stage.
- Right evidence panel.
- Bottom command bar.

#### WorkflowStageMachine

Owns stage transitions and stage states:

```text
literature
  -> scigraph-analysis
  -> report
  -> protocol-design
  -> labontology-check
  -> simulation
  -> experimental-graph
  -> next-suggestion
```

#### LiteratureLibrary

Owns:

- Built-in demonstration literature.
- Simple local import entry.
- Lightweight text extraction from Markdown and TXT.
- Basic handling for PDFs in the first round: store filename, file size, MIME type when available, and an optional user note. Full PDF content extraction is out of scope.

#### SciGraphAdapter

Defines the future SciGraph integration boundary. First-round implementation is mock-based.

Expected responsibility:

- Extract or mock scientific entities.
- Align entities with public knowledge.
- Expand related reactions, reagents, methods, and concepts.
- Produce evidence chain items.

#### ResearchReportService

Generates the structured report from literature and SciGraph mock output.

Report sections:

- Research question.
- Literature consensus.
- Disagreements and uncertainty.
- Candidate experiment directions.
- Design rationale.
- Evidence citations.

#### ProtocolDesigner

Generates a protocol draft from:

- Research report.
- User constraints.
- Mock device capability.
- Safety and queue policy.

#### LabOntologyAdapter

Defines the future LabOntology integration boundary. First-round implementation is mock-based.

Expected responsibility:

- Normalize experiment terms.
- Validate reagent and sample semantics.
- Check device capability.
- Check parameter ranges.
- Check safety boundaries.
- Return pass, warning, or needs-revision status.

#### SimulationEngine

Runs a deterministic simulated experiment:

- Queue created.
- Approval required.
- Simulation started.
- Sampling events emitted.
- Result generated.
- Optional anomaly emitted for demo value.

#### ExperimentalGraphStore

Builds a graph representation of the experiment process.

Key node types:

- Objective.
- LiteratureEvidence.
- SciGraphEntity.
- ReportClaim.
- Protocol.
- OntologyConstraint.
- SimulationRun.
- Observation.
- Result.
- NextSuggestion.

#### ThemeAssetRegistry

Owns replaceable visual asset slots and theme metadata.

It provides:

- Active theme.
- Available themes.
- Background URLs.
- Character URLs.
- Fallback colors and gradients when image assets are missing.

## 6. Data Flow

The main deterministic data flow is:

1. Literature Set
   - Load built-in sample literature.
   - Optionally add imported local files.

2. SciGraph Analysis
   - Generate mock entity extraction.
   - Generate public knowledge alignment.
   - Generate evidence chains.

3. Research Report
   - Produce a structured summary report with traceable evidence.

4. Protocol Draft
   - Generate an experiment plan from the report and user constraints.

5. LabOntology Check
   - Validate terminology, device capability, parameters, and safety policy.

6. Simulation Run
   - Simulate queue, execution, observations, and generated result.

7. Experimental Graph Writeback
   - Write all stages into graph nodes and edges.

8. Next Suggestions
   - Generate next-round experiment suggestions from the result and graph context.

## 7. Adapter Interfaces

The first-round implementation should keep adapter contracts explicit so later real services can replace mocks.

Suggested TypeScript shape:

```ts
interface SciGraphAdapter {
  analyzeLiterature(literatureSet: LiteratureItem[]): Promise<SciGraphAnalysis>;
}

interface LabOntologyAdapter {
  validateProtocol(protocolDraft: ProtocolDraft): Promise<LabOntologyValidation>;
}

interface SimulationEngine {
  run(protocolDraft: ProtocolDraft): Promise<SimulationRunResult>;
}

interface ExperimentalGraphStore {
  buildFromWorkflow(workflow: WorkflowSnapshot): ExperimentalGraph;
  addRunResult(result: SimulationRunResult): ExperimentalGraph;
}

interface ThemeAssetRegistry {
  getActiveTheme(): ThemeDefinition;
  setActiveTheme(themeId: string): void;
  getCharacter(slot: CharacterSlot): string;
  getBackground(slot: BackgroundSlot): string;
}
```

## 8. Error and Boundary Handling

The first-round prototype should handle expected boundaries without breaking the demo:

- Empty literature library: show IP empty state and offer sample library or import.
- Import failure: show a non-blocking warning and allow the demo to continue.
- SciGraph mock finds weak evidence: mark the report as low confidence.
- Protocol cannot be validated: move to Needs Revision and show suggested fixes.
- LabOntology warning: allow simulation only after the user acknowledges the warning.
- Simulation anomaly: write anomaly into Experimental Graph as failure experience.
- Theme image missing: fall back to a local color/gradient and default assistant slot.
- Character image missing: fall back to initials or a simple generated assistant silhouette.
- Physical execution: every execution-related action is labeled Simulation Only.

The UI must avoid implying that a real instrument has been controlled.

## 9. Verification Criteria

The first-round prototype is successful when:

- The Electron Desktop app starts.
- The default screen enters the Fudan-XtalPi space and demonstration project.
- The default ZJU-inspired theme assets load from `assets/`.
- Missing assets have a visible fallback.
- The left asset rail shows all workflow stages and status changes.
- The center stage can advance from literature library to next suggestions.
- The right panel switches between SciGraph, LabOntology, and Experimental Graph views.
- The final Experimental Graph can trace result and suggestions back to report claims and literature evidence.
- Importing a simple Markdown or TXT file does not break the workflow.
- Build validation passes.
- Core service or state-machine behavior has at least basic tests or a minimal verification script.

## 10. Out of Scope for First Round

The following are intentionally out of scope:

- Real SciGraph-SCP connection.
- Real LabOntology service.
- Real device execution.
- Real queue submission to hardware.
- Full PDF parsing and semantic paper extraction.
- User accounts and authentication.
- Multi-space switching.
- Multi-project management beyond the one demonstration project.
- Persistent database.
- Full LLM integration.
- Official Zhejiang University logo integration unless authorized assets are provided.

## 11. Implementation Notes

The first implementation should optimize for a stable demo and clear architecture.

Recommended defaults:

- Use local mock data for scientific content.
- Use deterministic service functions rather than network calls.
- Keep Electron main process thin.
- Keep theme and IP assets behind a registry.
- Make the workflow state explicit and testable.
- Treat every real-world experiment action as simulation-only.

The design should support later replacement of:

- Mock SciGraph adapter with real SciGraph-SCP.
- Mock LabOntology adapter with real ontology service.
- Mock simulation engine with a real simulator or action engine.
- Current non-official ZJU-inspired visual assets with authorized official assets.
- Current IP character with any future assistant character.
