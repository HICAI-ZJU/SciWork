import { join } from 'node:path';
import { z } from 'zod';
import {
  openDb, type Db, newId,
  RunSubmitInput, RunControlInput, RunApproveInput
} from '@scicompass/core';
import { Records } from '@scicompass/labkag';
import { DeviceRegistry } from './deviceRegistry.js';
import { MockFoundryDriver } from './mockDriver.js';
import type { DeviceDriver } from './driver.js';

const MIG = [{
  id: 31, sql: `
  CREATE TABLE runs(id TEXT PRIMARY KEY, project_id TEXT, protocol_id TEXT, protocol_version INTEGER,
    device_id TEXT, experiment_type TEXT, mode TEXT, status TEXT, params TEXT, created_at TEXT, updated_at TEXT);
  CREATE TABLE run_events(id TEXT PRIMARY KEY, run_id TEXT, seq INTEGER, reveal_at INTEGER,
    label TEXT, detail TEXT, severity TEXT, transition_to TEXT, result_summary TEXT, revealed INTEGER DEFAULT 0);
  CREATE TABLE approvals(id TEXT PRIMARY KEY, run_id TEXT, decision TEXT, confirmed_by TEXT, note TEXT, decided_at TEXT);
  CREATE TABLE audit_log(id TEXT PRIMARY KEY, tool TEXT, actor TEXT, payload TEXT, at TEXT);`
}];

// 8 状态机：physical 必停 awaiting-approval；终态不可再转移
const LEGAL: Record<string, string[]> = {
  'awaiting-approval': ['queued', 'rejected'],
  queued: ['running', 'aborted'],
  running: ['paused', 'completed', 'failed', 'aborted'],
  paused: ['running', 'aborted'],
  completed: [], failed: [], rejected: [], aborted: []
};

export class RunService {
  db: Db;
  driver: DeviceDriver = new MockFoundryDriver();

  constructor(
    dataHome: string,
    readonly devices: DeviceRegistry,
    readonly records: Records,
    readonly clock: () => number = () => Date.now()
  ) {
    this.db = openDb(join(dataHome, 'scicompass.db'), MIG);
  }

  private audit(tool: string, actor: string, payload: unknown) {
    this.db.prepare('INSERT INTO audit_log VALUES(?,?,?,?,?)')
      .run(newId('aud'), tool, actor, JSON.stringify(payload), new Date(this.clock()).toISOString());
  }

  private setStatus(runId: string, from: string, to: string) {
    if (!LEGAL[from]?.includes(to)) throw new Error(`conflict: illegal transition ${from} -> ${to}`);
    this.db.prepare('UPDATE runs SET status=?, updated_at=? WHERE id=?')
      .run(to, new Date(this.clock()).toISOString(), runId);
  }

  validate(input: { deviceId: string; experimentType: string; params: Record<string, unknown> }) {
    const profile = this.devices.getProfile(input.deviceId);
    return this.driver.validate(profile, input.experimentType, input.params);
  }

  submit(raw: z.infer<typeof RunSubmitInput>) {
    const input = RunSubmitInput.parse(raw);
    const v = this.validate(input);
    if (!v.ok) throw new Error(`validation failed: ${v.errors.join('; ')}`);
    const runId = newId('run');
    const status = input.mode === 'physical' ? 'awaiting-approval' : 'queued';
    const now = new Date(this.clock()).toISOString();
    this.db.prepare('INSERT INTO runs VALUES(?,?,?,?,?,?,?,?,?,?,?)')
      .run(runId, input.projectId, input.protocolId, input.protocolVersion, input.deviceId,
        input.experimentType, input.mode, status, JSON.stringify(input.params), now, now);
    if (input.mode === 'physical') {
      this.audit('run_submit', 'agent', { runId, mode: input.mode, deviceId: input.deviceId });
    } else {
      this.materialize(runId, input.experimentType, input.params);
    }
    return { runId, status };
  }

  // 时间线物化：提交/批准时一次性生成完整事件脚本，无常驻执行器
  private materialize(runId: string, experimentType: string, params: Record<string, unknown>) {
    const events = this.driver.plan({ runId, experimentType, params, startAt: this.clock() });
    const ins = this.db.prepare('INSERT INTO run_events VALUES(?,?,?,?,?,?,?,?,?,0)');
    for (const e of events) {
      ins.run(newId('rev'), runId, e.seq, e.revealAt, e.label, e.detail, e.severity,
        e.transitionTo ?? null, e.resultSummary ? JSON.stringify(e.resultSummary) : null);
    }
  }

  approve(raw: z.infer<typeof RunApproveInput>) {
    const a = RunApproveInput.parse(raw);
    const run = this.get(a.runId);
    if (run.status !== 'awaiting-approval') {
      throw new Error(`conflict: run is ${run.status}, not awaiting-approval`);
    }
    this.db.prepare('INSERT INTO approvals VALUES(?,?,?,?,?,?)')
      .run(newId('apr'), a.runId, a.decision, a.confirmedBy, a.note, new Date(this.clock()).toISOString());
    this.audit('run_approve', a.confirmedBy, a);
    if (a.decision === 'reject') {
      this.setStatus(a.runId, 'awaiting-approval', 'rejected');
      return { runId: a.runId, status: 'rejected' };
    }
    this.setStatus(a.runId, 'awaiting-approval', 'queued');
    this.materialize(a.runId, run.experiment_type, JSON.parse(run.params));
    return { runId: a.runId, status: 'queued' };
  }

  control(raw: z.infer<typeof RunControlInput>) {
    const c = RunControlInput.parse(raw);
    const run = this.get(c.runId);
    this.statusAdvance(run);
    const cur = this.get(c.runId).status as string;
    const to = c.action === 'abort' ? 'aborted' : c.action === 'pause' ? 'paused' : 'running';
    this.setStatus(c.runId, cur, to);
    this.audit('run_control', c.actor, c);
    return { runId: c.runId, status: to };
  }

  private get(runId: string): any {
    const r = this.db.prepare('SELECT * FROM runs WHERE id=?').get(runId);
    if (!r) throw new Error(`run not found: ${runId}`);
    return r;
  }

  // 惰性推进：揭示 reveal_at 已到的事件并应用其状态转移；完成事件自动登记结果
  private statusAdvance(run: any) {
    const due = this.db.prepare(
      'SELECT * FROM run_events WHERE run_id=? AND revealed=0 AND reveal_at<=? ORDER BY seq'
    ).all(run.id, this.clock()) as any[];
    let status = run.status as string;
    for (const e of due) {
      this.db.prepare('UPDATE run_events SET revealed=1 WHERE id=?').run(e.id);
      if (e.transition_to && LEGAL[status]?.includes(e.transition_to)) {
        this.setStatus(run.id, status, e.transition_to);
        status = e.transition_to;
      }
      if (e.result_summary && status === 'completed') {
        this.records.resultRegister({
          origin: 'device-run', runId: run.id, protocolId: run.protocol_id,
          protocolVersion: run.protocol_version, deviceId: run.device_id,
          projectId: run.project_id ?? undefined,
          summary: JSON.parse(e.result_summary), params: JSON.parse(run.params),
          at: new Date(e.reveal_at).toISOString()
        });
      }
    }
    return due;
  }

  status(runId: string) {
    const run = this.get(runId);
    const due = this.statusAdvance(run);
    const cur = this.get(runId);
    return {
      runId,
      status: cur.status as string,
      newEvents: due.map((e: any) => ({ seq: e.seq, label: e.label, detail: e.detail, severity: e.severity }))
    };
  }

  list(filter: { projectId?: string } = {}) {
    return this.db.prepare(
      `SELECT id,project_id,device_id,mode,status FROM runs ${filter.projectId ? 'WHERE project_id=?' : ''} ORDER BY created_at`
    ).all(...(filter.projectId ? [filter.projectId] : [])) as any[];
  }

  auditList() {
    return this.db.prepare('SELECT tool,actor,at FROM audit_log ORDER BY at').all() as any[];
  }
}
