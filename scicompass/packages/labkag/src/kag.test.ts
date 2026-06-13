import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { OntologyService } from '@scicompass/labontology';
import { KagService } from './kag.js';

let kag: KagService;
beforeEach(() => {
  kag = new KagService(mkdtempSync(join(tmpdir(), 'sc-')), new OntologyService());
});

describe('KagService.write', () => {
  it('rejects unknown type via ontology', () => {
    expect(() => kag.write({
      graph: 'prj-a',
      nodes: [{ id: 'n', type: 'Dragon', label: 'x', detail: '', round: 1, attrs: {}, provenance: [] }],
      edges: []
    })).toThrow(/unknown node type/i);
  });

  it('rejects provenance-required type without provenance', () => {
    expect(() => kag.write({
      graph: 'prj-a',
      nodes: [{ id: 'n', type: 'Result', label: 'x', detail: '', round: 1, attrs: {}, provenance: [] }],
      edges: []
    })).toThrow(/provenance required/i);
  });

  it('writes valid objective and queries it back', () => {
    kag.write({
      graph: 'prj-a',
      nodes: [{ id: 'n1', type: 'Objective', label: 'goal', detail: '', round: 1, attrs: {}, provenance: [] }],
      edges: []
    });
    expect(kag.query({ graph: 'prj-a', type: 'Objective', headOnly: false, limit: 10 }).nodes[0].label).toBe('goal');
  });

  it('rejects unknown edge label', () => {
    expect(() => kag.write({
      graph: 'prj-a',
      nodes: [
        { id: 'a', type: 'Objective', label: 'a', detail: '', round: 1, attrs: {}, provenance: [] },
        { id: 'b', type: 'Objective', label: 'b', detail: '', round: 1, attrs: {}, provenance: [] }
      ],
      edges: [{ id: 'e', source: 'a', target: 'b', label: 'teleports' }]
    })).toThrow(/unknown edge label/i);
  });
});
