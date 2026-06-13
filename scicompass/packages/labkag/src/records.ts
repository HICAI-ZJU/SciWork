import { join } from 'node:path';
import { z } from 'zod';
import {
  openDb, type Db, newId, slugify, makeRecordUri,
  ProjectCreateInput, ArtifactSaveInput, ProtocolSaveInput, ResultRegisterInput
} from '@scicompass/core';

const MIG = [{
  id: 40, sql: `
  CREATE TABLE projects(id TEXT PRIMARY KEY, name TEXT, objective TEXT, graph_slug TEXT, created_at TEXT);
  CREATE TABLE artifacts(id TEXT PRIMARY KEY, project_id TEXT, kind TEXT, title TEXT, content TEXT,
    payload TEXT, provenance TEXT, created_at TEXT);
  CREATE TABLE protocols(id TEXT PRIMARY KEY, project_id TEXT, version INTEGER, objective TEXT,
    payload TEXT, created_at TEXT);
  CREATE TABLE results(id TEXT PRIMARY KEY, origin TEXT, run_id TEXT, protocol_id TEXT, protocol_version INTEGER,
    device_id TEXT, project_id TEXT, summary TEXT, params TEXT, file_path TEXT, upstream_run_id TEXT,
    at TEXT, provenance TEXT, created_at TEXT);`
}];

export class Records {
  db: Db;

  constructor(dataHome: string) {
    this.db = openDb(join(dataHome, 'scicompass.db'), MIG);
  }

  projectCreate(raw: z.infer<typeof ProjectCreateInput>) {
    const { name, objective } = ProjectCreateInput.parse(raw);
    const id = newId('proj');
    const graphSlug = `prj-${slugify(name)}`;
    this.db.prepare('INSERT INTO projects VALUES(?,?,?,?,?)')
      .run(id, name, objective, graphSlug, new Date().toISOString());
    return { id, name, objective, graphSlug };
  }

  projectList() {
    return this.db.prepare('SELECT id,name,objective,graph_slug as graphSlug FROM projects').all() as any[];
  }

  projectGet(id: string) {
    const p = this.db.prepare('SELECT id,name,objective,graph_slug as graphSlug FROM projects WHERE id=?').get(id);
    if (!p) throw new Error(`project not found: ${id}`);
    return p as any;
  }

  artifactSave(raw: z.infer<typeof ArtifactSaveInput>) {
    const a = ArtifactSaveInput.parse(raw);
    const id = newId('art');
    this.db.prepare('INSERT INTO artifacts VALUES(?,?,?,?,?,?,?,?)')
      .run(id, a.projectId, a.kind, a.title, a.content,
        JSON.stringify(a.payload), JSON.stringify(a.provenance), new Date().toISOString());
    return { id, uri: makeRecordUri('artifacts', id) };
  }

  artifactList(projectId: string, kind?: string) {
    return this.db.prepare(
      `SELECT id,kind,title,created_at FROM artifacts WHERE project_id=? ${kind ? 'AND kind=?' : ''} ORDER BY created_at`
    ).all(...(kind ? [projectId, kind] : [projectId])) as any[];
  }

  artifactGet(id: string) {
    const r: any = this.db.prepare('SELECT * FROM artifacts WHERE id=?').get(id);
    if (!r) throw new Error(`artifact not found: ${id}`);
    return { ...r, payload: JSON.parse(r.payload), provenance: JSON.parse(r.provenance) };
  }

  protocolSave(raw: z.infer<typeof ProtocolSaveInput>) {
    const p = ProtocolSaveInput.parse(raw);
    const v = (this.db.prepare('SELECT MAX(version) m FROM protocols WHERE project_id=?').get(p.projectId) as any).m ?? 0;
    const id = newId('prot');
    this.db.prepare('INSERT INTO protocols VALUES(?,?,?,?,?,?)')
      .run(id, p.projectId, v + 1, p.objective, JSON.stringify(p.payload), new Date().toISOString());
    return { id, version: v + 1 };
  }

  protocolGet(id: string) {
    const r: any = this.db.prepare('SELECT * FROM protocols WHERE id=?').get(id);
    if (!r) throw new Error(`protocol not found: ${id}`);
    return { ...r, payload: JSON.parse(r.payload) };
  }

  resultRegister(raw: z.infer<typeof ResultRegisterInput>) {
    const r = ResultRegisterInput.parse(raw);
    const id = newId('res');
    const provenance = r.origin === 'device-run'
      ? [makeRecordUri('runs', r.runId), makeRecordUri('protocols', r.protocolId)]
      : (r.upstreamRunId ? [makeRecordUri('runs', r.upstreamRunId)] : []);
    this.db.prepare('INSERT INTO results VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(id, r.origin, (r as any).runId ?? null, (r as any).protocolId ?? null, (r as any).protocolVersion ?? null,
        r.deviceId, r.projectId ?? null, JSON.stringify(r.summary), JSON.stringify(r.params),
        r.filePath ?? null, r.upstreamRunId ?? null, r.at, JSON.stringify(provenance), new Date().toISOString());
    return { id, uri: makeRecordUri('results', id) };
  }

  resultGet(id: string) {
    const r: any = this.db.prepare('SELECT * FROM results WHERE id=?').get(id);
    if (!r) throw new Error(`result not found: ${id}`);
    return { ...r, summary: JSON.parse(r.summary), params: JSON.parse(r.params), provenance: JSON.parse(r.provenance) };
  }

  resultList(filter: { runId?: string; projectId?: string } = {}) {
    const cond: string[] = [];
    const args: string[] = [];
    if (filter.runId) { cond.push('run_id=?'); args.push(filter.runId); }
    if (filter.projectId) { cond.push('project_id=?'); args.push(filter.projectId); }
    return this.db.prepare(
      `SELECT id,origin,run_id,device_id,at FROM results ${cond.length ? 'WHERE ' + cond.join(' AND ') : ''} ORDER BY created_at`
    ).all(...args) as any[];
  }
}
