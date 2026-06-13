import { join } from 'node:path';
import { openDb, type Db } from '@scicompass/core';
import { GraphStore } from './graphStore.js';

const MAIN = [{
  id: 10, sql: 'CREATE TABLE graphs(slug TEXT PRIMARY KEY, kind TEXT NOT NULL, file TEXT NOT NULL, created_at TEXT NOT NULL);'
}];

export type GraphKind = 'prj' | 'grp' | 'open' | 'rules';

export class GraphRegistry {
  private db: Db;
  private cache = new Map<string, GraphStore>();

  constructor(readonly dataHome: string) {
    this.db = openDb(join(dataHome, 'scicompass.db'), MAIN);
  }

  open(slug: string, kind: GraphKind): GraphStore {
    const cached = this.cache.get(slug);
    if (cached) return cached;
    const file = join(this.dataHome, 'graphs',
      `${kind === 'rules' ? 'harness-rules-' : 'labgraph-'}${slug}.db`);
    this.db.prepare('INSERT OR IGNORE INTO graphs(slug,kind,file,created_at) VALUES(?,?,?,?)')
      .run(slug, kind, file, new Date().toISOString());
    const store = GraphStore.open(slug, file);
    this.cache.set(slug, store);
    return store;
  }

  list() {
    return this.db.prepare('SELECT slug,kind,file FROM graphs').all() as
      { slug: string; kind: GraphKind; file: string }[];
  }
}
