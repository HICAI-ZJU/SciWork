import { z } from 'zod';
import { PromoteInput, makeGraphNodeUri, newId } from '@scicompass/core';
import type { KagService } from './kag.js';

// 蒸馏晋升 = 再表达，不是改标签：源图永不改动，目标图收到带溯源指针的泛化新内容。
export function promote(kag: KagService, raw: z.infer<typeof PromoteInput>) {
  const input = PromoteInput.parse(raw);
  const from = kag.open(input.fromGraph);
  const ids = from.nodeIds();
  for (const sid of input.sourceNodeIds) {
    if (!ids.has(sid)) throw new Error(`source node not found: ${sid}`);
  }
  const toOpen = input.toGraph.endsWith('-open');
  if (toOpen && (!input.sanitizationChecked || !input.irreversibleAck)) {
    throw new Error('open promotion requires sanitizationChecked and irreversibleAck (irreversible publication gate)');
  }
  if (toOpen && !(input.fromGraph.startsWith('grp-') && !input.fromGraph.endsWith('-open'))) {
    throw new Error('open promotion must originate from a group graph (prj -> grp -> open)');
  }
  const headId = newId('cap');
  const provenance = input.sourceNodeIds.map((sid) => makeGraphNodeUri(input.fromGraph, sid));
  const head = {
    id: headId,
    type: input.capsule.headType,
    label: input.capsule.title,
    detail: input.capsule.summary,
    round: 1,
    attrs: { status: 'active', confirmedBy: input.confirmedBy, promotedAt: new Date().toISOString() },
    provenance
  };
  kag.write({ graph: input.toGraph, nodes: [head, ...input.capsule.supportNodes], edges: input.capsule.edges });
  return { headNodeId: headId, provenance };
}
