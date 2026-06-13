import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Records } from '@scicompass/labkag';
import { DeviceRegistry } from './deviceRegistry.js';
import { RunService } from './runs.js';

let runs: RunService;
let rec: Records;
let now: number;
const clock = () => now;

beforeEach(() => {
  const home = mkdtempSync(join(tmpdir(), 'sc-'));
  const reg = new DeviceRegistry(home);
  reg.loadTemplate(resolve(import.meta.dirname, '../../../templates/fudan-xtalpi.yaml'));
  rec = new Records(home);
  runs = new RunService(home, reg, rec, clock);
  now = Date.parse('2026-06-12T00:00:00Z');
});

const submitArgs = {
  projectId: 'p', protocolId: 'pr', protocolVersion: 1, deviceId: 'dev-xtalpi',
  experimentType: 'reaction-screening', params: { temperatureC: 60, timeHours: 2 }
} as const;

describe('RunService', () => {
  it('simulation: queued immediately, lazily advances to completed and auto-registers result', () => {
    const r = runs.submit({ ...submitArgs, mode: 'simulation' });
    expect(r.status).toBe('queued');
    now += 2_000;
    expect(runs.status(r.runId).status).toBe('running');
    now += 10_000;
    const done = runs.status(r.runId);
    expect(done.status).toBe('completed');
    expect(done.newEvents.length).toBeGreaterThan(0);
    expect(rec.resultList({ runId: r.runId })).toHaveLength(1);
  });

  it('physical: stops at awaiting-approval; approve materializes; audit recorded', () => {
    const r = runs.submit({ ...submitArgs, mode: 'physical' });
    expect(r.status).toBe('awaiting-approval');
    now += 60_000;
    expect(runs.status(r.runId).status).toBe('awaiting-approval'); // 不批不动
    runs.approve({ runId: r.runId, decision: 'approve', confirmedBy: '麻老师', note: '' });
    now += 12_000;
    expect(runs.status(r.runId).status).toBe('completed');
    const audits = runs.auditList().map((a) => a.tool);
    expect(audits).toContain('run_submit');
    expect(audits).toContain('run_approve');
  });

  it('physical reject is terminal', () => {
    const r = runs.submit({ ...submitArgs, mode: 'physical' });
    runs.approve({ runId: r.runId, decision: 'reject', confirmedBy: 'PI', note: '参数存疑' });
    expect(runs.status(r.runId).status).toBe('rejected');
  });

  it('illegal transitions are conflicts', () => {
    const r = runs.submit({ ...submitArgs, mode: 'simulation' });
    expect(() => runs.approve({ runId: r.runId, decision: 'approve', confirmedBy: 'x', note: '' }))
      .toThrow(/conflict/i);
    now += 20_000;
    runs.status(r.runId); // -> completed
    expect(() => runs.control({ runId: r.runId, action: 'abort', actor: 'x' })).toThrow(/conflict/i);
  });

  it('validate rejects bad params without creating run', () => {
    expect(() => runs.submit({ ...submitArgs, params: { temperatureC: 999, timeHours: 2 }, mode: 'simulation' }))
      .toThrow(/validation/i);
    expect(runs.list({}).length).toBe(0);
  });

  it('abort from running is allowed, audited, and blocks later timeline transitions', () => {
    const r = runs.submit({ ...submitArgs, mode: 'simulation' });
    now += 2_000;
    runs.status(r.runId); // running
    runs.control({ runId: r.runId, action: 'abort', actor: '麻老师' });
    now += 60_000;
    expect(runs.status(r.runId).status).toBe('aborted'); // 后续 completed 事件不再生效
    expect(rec.resultList({ runId: r.runId })).toHaveLength(0);
    expect(runs.auditList().map((a) => a.tool)).toContain('run_control');
  });
});
