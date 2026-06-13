import { describe, it, expect } from 'vitest';
import { GraphNode } from './graph.js';
import { RunSubmitInput, RUN_STATUSES } from './run.js';
import { ResultRegisterInput } from './records.js';

describe('contracts', () => {
  it('GraphNode accepts minimal node with defaults', () => {
    const r = GraphNode.safeParse({ id: 'n1', type: 'Objective', label: 'x' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.round).toBe(1);
      expect(r.data.provenance).toEqual([]);
    }
  });

  it('RunSubmitInput restricts mode', () => {
    expect(RunSubmitInput.safeParse({
      projectId: 'p', protocolId: 'pr', protocolVersion: 1,
      deviceId: 'd', mode: 'teleport', params: {}
    }).success).toBe(false);
  });

  it('result two-tier provenance: device-run results need runId+protocol', () => {
    const bad = ResultRegisterInput.safeParse({
      origin: 'device-run', deviceId: 'd', summary: {}, params: {}, at: 't'
    });
    expect(bad.success).toBe(false);
    const manual = ResultRegisterInput.safeParse({
      origin: 'manual-instrument', deviceId: 'd', summary: { y: 1 },
      params: { t: 25 }, at: '2026-06-12T00:00:00Z'
    });
    expect(manual.success).toBe(true);
  });

  it('run statuses fixed set', () => {
    expect(RUN_STATUSES).toContain('awaiting-approval');
    expect(RUN_STATUSES).toHaveLength(8);
  });
});
