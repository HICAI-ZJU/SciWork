import { z } from 'zod';

export const ProvenanceRefs = z.array(z.string().min(1));

export const GraphNode = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string(),
  detail: z.string().default(''),
  round: z.number().int().positive().default(1),
  attrs: z.record(z.unknown()).default({}),
  provenance: ProvenanceRefs.default([])
});

export const GraphEdge = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string()
});

export const GraphWriteInput = z.object({
  graph: z.string(),
  nodes: z.array(GraphNode).default([]),
  edges: z.array(GraphEdge).default([])
});

export const GraphQueryInput = z.object({
  graph: z.string(),
  type: z.string().optional(),
  round: z.number().int().optional(),
  headOnly: z.boolean().default(false),
  limit: z.number().int().positive().max(500).default(100)
});

export const PromoteInput = z.object({
  fromGraph: z.string(),
  toGraph: z.string(),
  sourceNodeIds: z.array(z.string()).min(1),
  capsule: z.object({
    headType: z.enum(['Lesson', 'Method', 'Prior', 'NegativeResult']),
    title: z.string().min(1),
    summary: z.string().min(1),
    supportNodes: z.array(GraphNode).default([]),
    edges: z.array(GraphEdge).default([])
  }),
  confirmedBy: z.string().min(1),
  sanitizationChecked: z.boolean().default(false),
  irreversibleAck: z.boolean().default(false)
});

export type GraphNodeT = z.infer<typeof GraphNode>;
export type GraphEdgeT = z.infer<typeof GraphEdge>;
