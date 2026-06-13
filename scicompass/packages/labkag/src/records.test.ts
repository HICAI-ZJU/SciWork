import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Records } from './records.js';

let rec: Records;
beforeEach(() => { rec = new Records(mkdtempSync(join(tmpdir(), 'sc-'))); });

describe('Records', () => {
  it('creates project and lists it', () => {
    const p = rec.projectCreate({ name: 'MOF 稳定性', objective: '湿气下稳定' });
    expect(rec.projectList()[0].id).toBe(p.id);
    expect(p.graphSlug).toMatch(/^prj-/);
  });

  it('projectGet throws on missing', () => {
    expect(() => rec.projectGet('nope')).toThrow(/not found/i);
  });

  it('protocol versions auto-increment per project', () => {
    const p = rec.projectCreate({ name: 'a', objective: 'b' });
    const v1 = rec.protocolSave({ projectId: p.id, objective: 'o', payload: { steps: [] } });
    const v2 = rec.protocolSave({ projectId: p.id, objective: 'o', payload: { steps: [1] } });
    expect([v1.version, v2.version]).toEqual([1, 2]);
  });

  it('device-run result requires run linkage (zod) and registers with provenance', () => {
    expect(() => rec.resultRegister({
      origin: 'device-run', deviceId: 'd', summary: {}, params: {}, at: 't'
    } as any)).toThrow();
    const r = rec.resultRegister({
      origin: 'device-run', runId: 'run-1', protocolId: 'pr-1', protocolVersion: 1,
      deviceId: 'dev-xtalpi', summary: { yield: 0.41 }, params: { temperatureC: 60 },
      at: new Date().toISOString()
    });
    const got = rec.resultGet(r.id);
    expect(got.summary.yield).toBe(0.41);
    expect(got.provenance).toContain('scicompass://runs/run-1');
  });

  it('manual-instrument result with upstream run keeps chain', () => {
    const r = rec.resultRegister({
      origin: 'manual-instrument', deviceId: 'dev-hplc', summary: { peak: 3 },
      params: { method: 'std' }, at: 't', upstreamRunId: 'run-9'
    });
    expect(rec.resultGet(r.id).provenance).toContain('scicompass://runs/run-9');
  });

  it('artifact save/list roundtrip', () => {
    const p = rec.projectCreate({ name: 'a', objective: 'b' });
    rec.artifactSave({
      projectId: p.id, kind: 'report', title: '综述', content: '## 共识',
      payload: {}, provenance: ['scicompass://literature/l1']
    });
    expect(rec.artifactList(p.id, 'report')).toHaveLength(1);
  });
});
