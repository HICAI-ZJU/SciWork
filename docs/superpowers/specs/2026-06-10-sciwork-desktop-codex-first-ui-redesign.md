# SciWork Desktop Codex-First UI Redesign

Date: 2026-06-10

## Goal

Redesign the first-round SciWork Desktop UI so it feels like a Codex/Claude-style desktop AI workbench rather than a browser-like showcase page. The product shell should make users feel that SciWork can become their scientific Codex workspace: projects, conversations, workspace folders, model selection, slash-loaded skills, execution progress, and project context are first-class desktop patterns.

This redesign keeps the existing scientific workflow intact:

Private literature library -> SciGraph literature analysis -> research report -> experiment protocol generation -> LabOntology validation -> simulation execution -> Experimental Graph writeback -> next-round suggestions.

## Product Boundary

The UI should closely follow the usage habits and information architecture of Codex Desktop and Claude Desktop:

- Left column for projects, workspace folders, sessions, and resources.
- Center column for conversation and agent execution traces.
- Bottom composer for workspace folder, prompt input, slash skills, model selection, attachment, voice placeholder, and send action.
- Right column for progress, current project context, and scientific evidence/context.

The implementation must not copy proprietary brand assets, official icons, exact wording, or pixel-perfect visual details from Codex or Claude. The target is familiar usage, not brand imitation.

The app remains an Electron desktop program. Browser preview is only a development aid and must not define the product experience.

## Recommended Approach

Use a Codex-first desktop workbench shell with scientific capabilities embedded as natural workspace features. This was chosen over a Claude-first knowledge workspace and over a more original science dashboard because the current priority is strong familiarity with Codex/Claude desktop behavior.

Scientific features should appear through:

- Project resources in the left sidebar.
- Slash-loaded skill packs in the composer.
- Agent messages and execution logs in the central thread.
- Stage progress and scientific context in the right inspector.

Large dashboard cards, hero-style sections, and background-driven showcase layouts are out of scope for this redesign.

## Information Architecture

### Left Sidebar

The sidebar should behave like a project/session panel:

- Product identity: SciWork, with a restrained ZJU-inspired accent.
- New session action.
- Current workspace folder selector placeholder.
- Project list, with the current scientific project selected.
- Recent sessions.
- Resource entries for private literature library, reports, experiment protocols, simulation runs, and graph records.
- Skill pack entry point.

The sidebar should feel like a persistent desktop navigation surface, not a marketing navigation menu.

### Center Workbench

The center is the primary interaction area:

- Header row with the current session title and lightweight status.
- Agent conversation thread as the main surface.
- Messages represent user intent, assistant reasoning, and scientific task output.
- Existing workflow stages appear as execution events inside the thread:
  - Read private literature library.
  - Invoke SciGraph.
  - Generate research report.
  - Draft protocol from report and user constraints.
  - Validate with LabOntology.
  - Run simulation.
  - Write back to Experimental Graph.
  - Generate next-round suggestions.
- Scientific content can be summarized in compact blocks inside messages, but should not replace the chat thread with dashboard pages.

### Composer

The composer should be visually and behaviorally close to Codex/Claude desktop habits:

- Workspace folder selector placeholder.
- Main input field.
- Slash command palette triggered by typing `/`.
- Skill pack options:
  - `/scigraph`
  - `/report`
  - `/protocol`
  - `/labontology`
  - `/simulate`
  - `/graph`
- Model selector placeholder.
- Attachment button placeholder.
- Voice input placeholder.
- Send/run button.

The first implementation only needs to demonstrate the interaction contract. Real model switching, real voice input, and real filesystem selection are future work.

### Right Context Panel

The right panel should combine progress and context:

- Current task progress with the existing workflow stages.
- Running/completed/queued state.
- Current project context.
- Current artifacts:
  - selected literature set,
  - SciGraph evidence,
  - report summary,
  - LabOntology constraints,
  - simulation metrics,
  - Experimental Graph nodes and links.
- Context view changes with the active stage while retaining a stable panel structure.

This panel is where SciGraph, LabOntology, and Experimental Graph become visible without turning the app into a dashboard.

## Visual Direction

The desktop should feel premium, dense, and tool-like:

- Primary color: Zhejiang University-inspired blue.
- Accent color: Qiushi red.
- Supporting colors: ink black, paper white, restrained teal/green.
- Chinese classical influence should be subtle: fine texture, watermark, seal-like status detail, and restrained architectural silhouettes.
- Modern AI/knowledge graph influence should appear through thin node-link lines, execution traces, graph micro-visuals, and state pulses.
- Avoid large background images behind the main UI.
- Avoid hero sections, decorative large cards, and one-note color palettes.
- Keep border radius, shadows, and decorative effects restrained.

Existing generated assets remain replaceable:

- Theme backgrounds may be used as faint texture or skin material.
- Scientist IP character should be used as assistant avatar, empty-state cue, or running-status badge.
- ZJU references must remain inspired placeholders unless official assets are supplied.

## Scope For This Implementation Round

Included:

- Replace the current showcase-style app shell with a three-column desktop workbench.
- Refactor the UI composition around:
  - `Sidebar`
  - `AgentThread`
  - `Composer`
  - `ContextPanel`
- Preserve the current workflow controller and scientific service/domain modules.
- Represent workflow outputs as thread messages, progress state, and context-panel details.
- Add a slash skill palette with the scientific skill pack entries.
- Restyle the app with the Codex-first desktop workbench visual direction.
- Keep the Electron app as the primary target.
- Add or update focused tests for the UI contract.

Excluded:

- Real Codex or Claude integration.
- Real model provider switching.
- Real voice input.
- Real filesystem folder picker.
- Real document import beyond the existing demo data.
- Official ZJU branding or official logo recreation.
- Changes to core scientific workflow behavior unless needed to expose existing state to the UI.

## Architecture

The existing workflow boundary should remain stable:

- `useWorkflowController` continues to own workflow state, active stage, generated artifacts, and `runNextAction`.
- `services/*` continues to provide the simulated scientific pipeline.
- `domain/*` continues to define demo data and types.
- UI components consume the controller state and render it in the new shell.

Proposed UI component responsibilities:

- `Sidebar`: workspace, project, sessions, resource navigation, skill pack entry points.
- `AgentThread`: conversation-like rendering of the workflow state and generated artifacts.
- `Composer`: prompt input, slash palette, model/workspace/voice/attachment placeholders, run action.
- `ContextPanel`: progress timeline, project context, SciGraph/LabOntology/Experimental Graph context.

The UI can derive display messages from the existing workflow artifacts instead of changing the workflow controller's data model in this round.

## Data Flow

1. `App` calls `useWorkflowController`.
2. `Sidebar` receives project, space, literature, and active stage metadata.
3. `AgentThread` receives active stage and generated artifacts, then renders a conversation-style timeline.
4. `Composer` captures optional user constraints and slash skill selection.
5. Sending from the composer calls `runNextAction`.
6. `ContextPanel` receives the same workflow artifacts and renders progress plus stage-specific context.

Slash skill selection should not bypass the existing workflow in this round. It can fill the composer with the selected skill and help the user understand available capabilities, while the send/run action continues to advance the demo pipeline.

## Error Handling And Empty States

- If a stage artifact is not available yet, show a queued or pending state in the thread and context panel.
- If the workflow is running, disable duplicate sends and show an active running state in the composer and progress panel.
- If the workflow reaches completion, the composer should indicate the demo pipeline is complete while still allowing visible command entry for future extension.
- Empty states should use compact assistant/avatar hints, not large onboarding cards.

## Testing

Focused tests should cover:

- The app renders a desktop workbench with left sidebar, central thread/composer, and right context panel.
- The slash palette opens when the composer input starts with `/`.
- The scientific skills are listed in the slash palette.
- Selecting a slash skill updates the composer command state.
- The workflow can still advance through the existing run action.
- The right context panel exposes SciGraph, LabOntology, and Experimental Graph context labels.

Existing service, domain, and stage-machine tests should continue to pass.

## Acceptance Criteria

- The first screen no longer looks like a browser showcase or marketing page.
- The layout clearly reads as a desktop AI workbench with left project/session navigation, central agent conversation, and right progress/context.
- The composer visually supports workspace, slash skills, model, attachment, voice, and send controls.
- SciGraph, LabOntology, and Experimental Graph are visible in the right context/progress system and in the conversation flow.
- Zhejiang University-inspired blue/red styling is stronger but restrained.
- The scientist IP and background assets are optional, replaceable accents rather than structural UI dependencies.
- Core workflow modules remain fixed.
