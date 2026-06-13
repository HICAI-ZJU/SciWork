import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { OntologyService } from '@scicompass/labontology';
import { KagService } from './kag.js';

let kag: KagService;
beforeEach(() => {
  kag = new KagService(mkdtempSync(join(tmpdir(), 'sc-')), new OntologyService());
  kag.write({
    graph: 'prj-a',
    nodes: [
      { id: 'run1', type: 'Run', label: 'run', detail: '', round: 1, attrs: {}, provenance: ['scicompass://runs/run1'] },
      { id: 'res1', type: 'Result', label: 'yield 12%', detail: '', round: 1, attrs: {}, provenance: ['scicompass://results/res1'] }
    ],
    edges: [{ id: 'e1', source: 'run1', target: 'res1', label: 'produced' }]
  });
});

const capsule = {
  headType: 'Lesson' as const,
  title: '高温产率劣化',
  summary: '该配体类高温下产率显著劣化',
  supportNodes: [],
  edges: []
};

describe('graph_promote', () => {
  it('prj->grp creates capsule head with provenance URIs back to source', () => {
    const out = kag.promote({
      fromGraph: 'prj-a', toGraph: 'grp-ma', sourceNodeIds: ['run1', 'res1'],
      capsule, confirmedBy: '麻老师', sanitizationChecked: false, irreversibleAck: false
    });
    const grp = kag.query({ graph: 'grp-ma', headOnly: true, limit: 10 });
    expect(grp.nodes[0].type).toBe('Lesson');
    expect(grp.nodes[0].provenance).toContain('labgraph://prj-a/node/run1');
    expect(out.headNodeId).toBe(grp.nodes[0].id);
  });

  it('source nodes are untouched (re-expression, not move)', () => {
    kag.promote({
      fromGraph: 'prj-a', toGraph: 'grp-ma', sourceNodeIds: ['res1'],
      capsule, confirmedBy: 'x', sanitizationChecked: false, irreversibleAck: false
    });
    expect(kag.query({ graph: 'prj-a', headOnly: false, limit: 10 }).nodes).toHaveLength(2);
  });

  it('grp->open requires sanitization + irreversible ack', () => {
    kag.promote({
      fromGraph: 'prj-a', toGraph: 'grp-ma', sourceNodeIds: ['res1'],
      capsule, confirmedBy: 'x', sanitizationChecked: false, irreversibleAck: false
    });
    const head = kag.query({ graph: 'grp-ma', headOnly: true, limit: 1 }).nodes[0];
    expect(() => kag.promote({
      fromGraph: 'grp-ma', toGraph: 'grp-ma-open', sourceNodeIds: [head.id],
      capsule, confirmedBy: 'PI', sanitizationChecked: false, irreversibleAck: false
    })).toThrow(/sanitization|irreversible/i);
  });

  it('open promotion must originate from group graph', () => {
    expect(() => kag.promote({
      fromGraph: 'prj-a', toGraph: 'grp-ma-open', sourceNodeIds: ['res1'],
      capsule, confirmedBy: 'PI', sanitizationChecked: true, irreversibleAck: true
    })).toThrow(/originate from a group graph/i);
  });

  it('rejects missing source node', () => {
    expect(() => kag.promote({
      fromGraph: 'prj-a', toGraph: 'grp-ma', sourceNodeIds: ['ghost'],
      capsule, confirmedBy: 'x', sanitizationChecked: false, irreversibleAck: false
    })).toThrow(/source node/i);
  });
});
