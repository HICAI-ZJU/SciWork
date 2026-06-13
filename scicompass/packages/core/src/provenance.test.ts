import { describe, it, expect } from 'vitest';
import { parseProvenanceUri, makeGraphNodeUri, makeRecordUri } from './provenance.js';

describe('provenance URIs', () => {
  it('parses labgraph node uri', () => {
    expect(parseProvenanceUri('labgraph://prj-mof/node/n1'))
      .toEqual({ scheme: 'labgraph', host: 'prj-mof', kind: 'node', id: 'n1' });
  });

  it('parses scicompass record uri', () => {
    expect(parseProvenanceUri('scicompass://results/r9'))
      .toEqual({ scheme: 'scicompass', host: 'results', kind: 'record', id: 'r9' });
  });

  it('builders roundtrip', () => {
    expect(makeGraphNodeUri('grp-ma', 'n2')).toBe('labgraph://grp-ma/node/n2');
    expect(makeRecordUri('runs', 'run-1')).toBe('scicompass://runs/run-1');
  });

  it('rejects unknown scheme', () => {
    expect(() => parseProvenanceUri('http://x/y')).toThrow(/unsupported/i);
  });

  it('rejects labgraph uri without node segment', () => {
    expect(() => parseProvenanceUri('labgraph://prj-a/n1')).toThrow(/unsupported/i);
  });
});
