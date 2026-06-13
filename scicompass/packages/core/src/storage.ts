import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createRequire } from 'node:module';

// node:sqlite 是 Node 实验模块，不在打包器（Vite/esbuild）的内置清单中——
// 静态 import 会在转换期被错误解析为裸包 'sqlite' 而失败。
// 改用 createRequire 在运行时加载：转换器只看到 require(字符串)，不触发解析。
const nodeRequire = createRequire(import.meta.url);
const { DatabaseSync } = nodeRequire('node:sqlite') as typeof import('node:sqlite');

// API 与 better-sqlite3 同构：prepare/all/get/run/exec。
export interface Migration { id: number; sql: string }
export type Db = InstanceType<typeof import('node:sqlite').DatabaseSync>;

// node:sqlite 无 transaction 助手，提供最小事务封装
export function tx<T>(db: Db, fn: () => T): T {
  db.exec('BEGIN');
  try {
    const r = fn();
    db.exec('COMMIT');
    return r;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

// 每个 .db 文件自带 _migrations 表；迁移 id 全局分段约定：
//   1 图谱文件内部 / 10 图谱注册表 / 20 文献库 / 30 装置 / 31 运行 / 40 记录
export function openDb(file: string, migrations: Migration[]): Db {
  mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('CREATE TABLE IF NOT EXISTS _migrations(id INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)');
  const done = new Set(db.prepare('SELECT id FROM _migrations').all().map((r: any) => r.id));
  const mark = db.prepare('INSERT INTO _migrations(id, applied_at) VALUES(?, ?)');
  for (const m of [...migrations].sort((a, b) => a.id - b.id)) {
    if (done.has(m.id)) continue;
    tx(db, () => {
      db.exec(m.sql);
      mark.run(m.id, new Date().toISOString());
    });
  }
  return db;
}
