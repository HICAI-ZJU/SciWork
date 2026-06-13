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
  directory?: string;
  graphSlug?: string;
}

export interface ScienceSession {
  id: string;
  projectId: string;
  title: string;
  objective: string;
  status: 'active' | 'queued' | 'completed' | 'idle';
  updatedAt: string;
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
