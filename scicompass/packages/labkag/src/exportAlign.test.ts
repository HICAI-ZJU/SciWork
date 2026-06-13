import { it, expect } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { OntologyService } from '@scicompass/labontology';
import { KagService } from './kag.js';
import { exportGraphMarkdown } from './exportMd.js';
import { alignPublic } from './alignPublic.js';

it('exports markdown with node and edge sections', () => {
  const kag = new KagService(mkdtempSync(join(tmpdir(), 'sc-')), new OntologyService());
  kag.write({
    graph: 'prj-a',
    nodes: [{ id: 'n1', type: 'Objective', label: 'goal', detail: 'd', round: 1, attrs: {}, provenance: [] }],
    edges: []
  });
  const md = exportGraphMarkdown(kag, 'prj-a');
  expect(md).toContain('# LabGraph: prj-a');
  expect(md).toContain('goal');
  expect(md).toContain('## Edges');
});

it('align_public returns deterministic mock anchors and writes anchor attr', () => {
  const kag = new KagService(mkdtempSync(join(tmpdir(), 'sc-')), new OntologyService());
  kag.write({
    graph: 'prj-a',
    nodes: [{ id: 'n1', type: 'SciGraphEntity', label: '偶联反应', detail: '', round: 1, attrs: {}, provenance: [] }],
    edges: []
  });
  const out = alignPublic(kag, { graph: 'prj-a', nodeIds: ['n1'] });
  expect(out.anchors[0].anchor).toMatch(/^scigraph:\/\//);
  expect(out.source).toBe('mock');
  const again = alignPublic(kag, { graph: 'prj-a', nodeIds: ['n1'] });
  expect(again.anchors[0].anchor).toBe(out.anchors[0].anchor); // 确定性
  expect(kag.query({ graph: 'prj-a', headOnly: false, limit: 5 }).nodes[0].attrs.scigraph_anchor).toBeDefined();
});
