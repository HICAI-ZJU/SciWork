import { it, expect } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { OntologyService } from '@scicompass/labontology';
import { KagService } from './kag.js';
import { Records } from './records.js';

it('flowback writes Result node linked to Run node with provenance', () => {
  const home = mkdtempSync(join(tmpdir(), 'sc-'));
  const kag = new KagService(home, new OntologyService());
  const rec = new Records(home);
  const p = rec.projectCreate({ name: 'a', objective: 'b' });
  kag.write({
    graph: p.graphSlug,
    nodes: [{ id: 'run-1', type: 'Run', label: 'sim run', detail: '', round: 1, attrs: {}, provenance: ['scicompass://runs/run-1'] }],
    edges: []
  });
  const res = rec.resultRegister({
    origin: 'device-run', runId: 'run-1', protocolId: 'pr', protocolVersion: 1,
    deviceId: 'dev', summary: { yield: 0.4 }, params: {}, at: 't'
  });
  const out = kag.flowback(rec, { resultId: res.id, graph: p.graphSlug, runNodeId: 'run-1', round: 1 });
  const g = kag.query({ graph: p.graphSlug, type: 'Result', headOnly: false, limit: 10 });
  expect(g.nodes).toHaveLength(1);
  expect(g.nodes[0].provenance).toContain(res.uri);
  expect(g.edges.some((e) => e.source === 'run-1' && e.target === out.resultNodeId && e.label === 'produced')).toBe(true);
});
