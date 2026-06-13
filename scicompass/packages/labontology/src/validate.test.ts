import { describe, it, expect } from 'vitest';
import { loadOntology } from './load.js';
import { validateNodes, validateEdgeLabels, checkIntent } from './validate.js';

const o = loadOntology('chemistry', 'v1');
const node = (over: Partial<Parameters<typeof validateNodes>[1][0]>) => ({
  id: 'n', type: 'Objective', label: 'x', detail: '', round: 1, attrs: {}, provenance: [], ...over
});

describe('validateNodes', () => {
  it('rejects unknown node type', () => {
    const errs = validateNodes(o, [node({ type: 'Dragon' })]);
    expect(errs[0]).toMatch(/unknown node type/i);
  });

  it('rejects missing provenance where required', () => {
    const errs = validateNodes(o, [node({ type: 'Result' })]);
    expect(errs[0]).toMatch(/provenance required/i);
  });

  it('passes valid node', () => {
    expect(validateNodes(o, [node({})])).toEqual([]);
    expect(validateNodes(o, [node({ type: 'Result', provenance: ['scicompass://results/r1'] })])).toEqual([]);
  });
});

describe('validateEdgeLabels', () => {
  it('flags unknown labels only', () => {
    expect(validateEdgeLabels(o, ['supports', 'teleports'])).toEqual(['unknown edge label: teleports']);
  });
});

describe('checkIntent', () => {
  it('flags forbidden pair and out-of-bound temperature', () => {
    const r = checkIntent(o, { reagents: ['sodium-azide', 'heavy-metal-salt'], params: { temperatureC: 200 } });
    expect(r.ok).toBe(false);
    expect(r.violations.join(' ')).toMatch(/forbidden pair/i);
    expect(r.violations.join(' ')).toMatch(/temperatureC/);
  });

  it('passes safe intent', () => {
    expect(checkIntent(o, { reagents: ['water'], params: { temperatureC: 60 } }).ok).toBe(true);
  });
});
