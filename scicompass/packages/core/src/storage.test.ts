import { describe, it, expect } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDb } from './storage.js';

describe('openDb', () => {
  it('runs migrations once and is idempotent', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sc-'));
    const migrations = [
      { id: 1, sql: 'CREATE TABLE t(a TEXT);' },
      { id: 2, sql: "INSERT INTO t VALUES('x');" }
    ];
    const db1 = openDb(join(dir, 'a.db'), migrations);
    db1.close();
    const db2 = openDb(join(dir, 'a.db'), migrations);
    expect((db2.prepare('SELECT COUNT(*) c FROM t').get() as any).c).toBe(1);
    expect((db2.prepare('PRAGMA journal_mode').get() as any).journal_mode).toBe('wal');
    db2.close();
  });

  it('creates parent directories', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sc-'));
    const db = openDb(join(dir, 'nested', 'deep', 'b.db'), []);
    expect((db.prepare('PRAGMA journal_mode').get() as any).journal_mode).toBe('wal');
    db.close();
  });
});
