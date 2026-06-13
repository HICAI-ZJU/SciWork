import { describe, it, expect } from 'vitest';
import { loadOntology } from './load.js';

describe('loadOntology', () => {
  it('loads chemistry v1', () => {
    const o = loadOntology('chemistry', 'v1');
    expect(o.space).toBe('chemistry');
    expect(o.nodeTypes).toContain('Lesson');
    expect(o.edgeLabels).toContain('produced');
    expect(o.constraints.parameterBounds.temperatureC.max).toBe(150);
    expect(o.constraints.processRules.map((r) => r.id)).toContain('physical-needs-approval');
  });

  it('throws on unknown space', () => {
    expect(() => loadOntology('alchemy', 'v1')).toThrow();
  });
});
