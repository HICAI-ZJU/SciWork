import { z } from 'zod';
import { GraphWriteInput, GraphQueryInput, PromoteInput, newId, makeRecordUri } from '@scicompass/core';
import type { OntologyService } from '@scicompass/labontology';
import { GraphRegistry, type GraphKind } from './registry.js';
import { promote as promoteImpl } from './promote.js';
import type { Records } from './records.js';

export class KagService {
  readonly registry: GraphRegistry;

  constructor(dataHome: string, readonly ontology: OntologyService) {
    this.registry = new GraphRegistry(dataHome);
  }

  private kindOf(slug: string): GraphKind {
    if (slug.startsWith('prj-')) return 'prj';
    if (slug.endsWith('-open')) return 'open';
    if (slug.startsWith('grp-')) return 'grp';
    throw new Error(`cannot infer graph kind from slug: ${slug}`);
  }

  open(slug: string) {
    return this.registry.open(slug, this.kindOf(slug));
  }

  write(input: z.infer<typeof GraphWriteInput>) {
    const { graph, nodes, edges } = GraphWriteInput.parse(input);
    const errs = this.ontology.validateGraphWrite(nodes, edges.map((e) => e.label));
    if (errs.length) throw new Error(`ontology validation failed: ${errs.join('; ')}`);
    this.open(graph).write(nodes, edges);
    return { written: { nodes: nodes.length, edges: edges.length } };
  }

  query(input: z.infer<typeof GraphQueryInput>) {
    const { graph, ...opts } = GraphQueryInput.parse(input);
    return this.open(graph).query(opts);
  }

  promote(raw: z.infer<typeof PromoteInput>) {
    return promoteImpl(this, raw);
  }

  // 结果回流：Result 记录 → 图谱 Result 节点 + produced 边，溯源指向主库记录
  flowback(rec: Records, input: { resultId: string; graph: string; runNodeId: string; round: number }) {
    const r = rec.resultGet(input.resultId);
    const resultNodeId = newId('node');
    this.write({
      graph: input.graph,
      nodes: [{
        id: resultNodeId,
        type: 'Result',
        label: `结果 ${input.resultId}`,
        detail: JSON.stringify(r.summary),
        round: input.round,
        attrs: { deviceId: r.device_id },
        provenance: [makeRecordUri('results', input.resultId)]
      }],
      edges: [{ id: newId('edge'), source: input.runNodeId, target: resultNodeId, label: 'produced' }]
    });
    return { resultNodeId };
  }
}
