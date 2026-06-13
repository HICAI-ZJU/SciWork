import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { GraphRegistry } from './registry.js';

let dataHome: string;
beforeEach(() => { dataHome = mkdtempSync(join(tmpdir(), 'sc-')); });

describe('GraphRegistry + GraphStore', () => {
  it('creates project graph file and writes/queries nodes', () => {
    const reg = new GraphRegistry(dataHome);
    const g = reg.open('prj-mof', 'prj');
    g.write([{ id: 'n1', type: 'Objective', label: 'MOF 稳定性', detail: '', round: 1, attrs: {}, provenance: [] }], []);
    const rows = g.query({ type: 'Objective' });
    expect(rows.nodes).toHaveLength(1);
    expect(reg.list().map((r) => r.slug)).toContain('prj-mof');
  });

  it('edge endpoints must exist in same graph (self-contained)', () => {
    const g = new GraphRegistry(dataHome).open('prj-a', 'prj');
    expect(() => g.write([], [{ id: 'e1', source: 'ghost', target: 'ghost2', label: 'supports' }]))
      .toThrow(/endpoint/i);
  });

  it('headOnly filters to capsule head types', () => {
    const g = new GraphRegistry(dataHome).open('grp-x', 'grp');
    g.write([
      { id: 'h1', type: 'Lesson', label: '教训', detail: '', round: 1, attrs: {}, provenance: ['labgraph://prj-a/node/n1'] },
      { id: 's1', type: 'Observation', label: '支撑', detail: '', round: 1, attrs: {}, provenance: ['labgraph://prj-a/node/n2'] }
    ], []);
    const heads = g.query({ headOnly: true });
    expect(heads.nodes.map((n) => n.id)).toEqual(['h1']);
  });
});
