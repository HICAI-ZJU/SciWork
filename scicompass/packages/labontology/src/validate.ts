import type { Ontology } from './load.js';

export interface NodeLike {
  id: string;
  type: string;
  label: string;
  detail: string;
  round: number;
  attrs: Record<string, unknown>;
  provenance: string[];
}

export function validateNodes(o: Ontology, nodes: NodeLike[]): string[] {
  const errs: string[] = [];
  for (const n of nodes) {
    if (!o.nodeTypes.includes(n.type)) {
      errs.push(`unknown node type: ${n.type} (${n.id})`);
    } else if (o.provenanceRequired.includes(n.type) && n.provenance.length === 0) {
      errs.push(`provenance required for type ${n.type} (${n.id})`);
    }
  }
  return errs;
}

export function validateEdgeLabels(o: Ontology, labels: string[]): string[] {
  return labels.filter((l) => !o.edgeLabels.includes(l)).map((l) => `unknown edge label: ${l}`);
}

export interface Intent { reagents?: string[]; params?: Record<string, unknown> }

export function checkIntent(o: Ontology, intent: Intent): { ok: boolean; violations: string[] } {
  const v: string[] = [];
  const set = new Set((intent.reagents ?? []).map((s) => s.toLowerCase()));
  for (const [a, b] of o.constraints.forbiddenPairs) {
    if (set.has(a) && set.has(b)) v.push(`forbidden pair: ${a} + ${b}`);
  }
  for (const [k, bound] of Object.entries(o.constraints.parameterBounds)) {
    const val = intent.params?.[k];
    if (typeof val === 'number' && (val < bound.min || val > bound.max)) {
      v.push(`${k}=${val} out of bounds [${bound.min}, ${bound.max}]`);
    }
  }
  return { ok: v.length === 0, violations: v };
}
