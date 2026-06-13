import { openDb, tx, type Db } from '@scicompass/core';

const MIGRATIONS = [{
  id: 1, sql: `
  CREATE TABLE nodes(id TEXT PRIMARY KEY, type TEXT NOT NULL, label TEXT NOT NULL,
    detail TEXT NOT NULL DEFAULT '', round INTEGER NOT NULL DEFAULT 1,
    attrs TEXT NOT NULL DEFAULT '{}', provenance TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL);
  CREATE TABLE edges(id TEXT PRIMARY KEY, source TEXT NOT NULL, target TEXT NOT NULL,
    label TEXT NOT NULL, created_at TEXT NOT NULL);
  CREATE INDEX idx_nodes_type ON nodes(type);
  CREATE INDEX idx_nodes_round ON nodes(round);`
}];

const HEAD_TYPES = ['Lesson', 'Method', 'Prior', 'NegativeResult'];

export interface NodeRow {
  id: string; type: string; label: string; detail: string; round: number;
  attrs: Record<string, unknown>; provenance: string[];
}
export interface EdgeRow { id: string; source: string; target: string; label: string }

export class GraphStore {
  constructor(readonly slug: string, private db: Db) {}

  static open(slug: string, file: string) {
    return new GraphStore(slug, openDb(file, MIGRATIONS));
  }

  write(nodes: NodeRow[], edges: EdgeRow[]) {
    const now = new Date().toISOString();
    const insN = this.db.prepare(`INSERT OR REPLACE INTO nodes(id,type,label,detail,round,attrs,provenance,created_at)
      VALUES(@id,@type,@label,@detail,@round,@attrs,@provenance,@created_at)`);
    const insE = this.db.prepare('INSERT OR REPLACE INTO edges(id,source,target,label,created_at) VALUES(?,?,?,?,?)');
    const has = this.db.prepare('SELECT 1 FROM nodes WHERE id=?');
    tx(this.db, () => {
      for (const n of nodes) {
        insN.run({ id: n.id, type: n.type, label: n.label, detail: n.detail, round: n.round,
          attrs: JSON.stringify(n.attrs), provenance: JSON.stringify(n.provenance), created_at: now });
      }
      for (const e of edges) {
        // 容器自包含：边的两端必须存在于本图（已存在或本批写入）
        const ok = (id: string) => has.get(id) || nodes.some((n) => n.id === id);
        if (!ok(e.source) || !ok(e.target)) {
          throw new Error(`edge ${e.id}: endpoint missing in graph ${this.slug}`);
        }
        insE.run(e.id, e.source, e.target, e.label, now);
      }
    });
  }

  query(opts: { type?: string; round?: number; headOnly?: boolean; limit?: number } = {}) {
    const cond: string[] = [];
    const args: (string | number)[] = [];
    if (opts.type) { cond.push('type=?'); args.push(opts.type); }
    if (opts.round) { cond.push('round=?'); args.push(opts.round); }
    if (opts.headOnly) {
      cond.push(`type IN (${HEAD_TYPES.map(() => '?').join(',')})`);
      args.push(...HEAD_TYPES);
    }
    const where = cond.length ? `WHERE ${cond.join(' AND ')}` : '';
    const nodes = this.db.prepare(`SELECT * FROM nodes ${where} ORDER BY created_at, id LIMIT ?`)
      .all(...args, opts.limit ?? 100)
      .map((r: any) => ({ ...r, attrs: JSON.parse(r.attrs), provenance: JSON.parse(r.provenance) })) as NodeRow[];
    const edges = this.db.prepare('SELECT id,source,target,label FROM edges').all() as unknown as EdgeRow[];
    return { nodes, edges };
  }

  nodeIds(): Set<string> {
    return new Set(this.db.prepare('SELECT id FROM nodes').all().map((r: any) => r.id as string));
  }
}
