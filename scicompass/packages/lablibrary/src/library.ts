import { join, basename } from 'node:path';
import { copyFileSync, mkdirSync } from 'node:fs';
import { z } from 'zod';
import {
  openDb, type Db, newId,
  LiteratureImportInput, LiteratureSearchInput
} from '@scicompass/core';
import { parseBibtex } from './bibtex.js';

const MIG = [{
  id: 20, sql: `
  CREATE TABLE literature(id TEXT PRIMARY KEY, project_id TEXT, title TEXT, source TEXT, year INTEGER,
    abstract TEXT, file_path TEXT, created_at TEXT);
  CREATE VIRTUAL TABLE literature_fts USING fts5(title, abstract, content=literature, content_rowid=rowid);
  CREATE TRIGGER lit_ai AFTER INSERT ON literature BEGIN
    INSERT INTO literature_fts(rowid, title, abstract) VALUES (new.rowid, new.title, new.abstract);
  END;`
}];

export class Library {
  db: Db;

  constructor(readonly dataHome: string) {
    this.db = openDb(join(dataHome, 'scicompass.db'), MIG);
  }

  import(raw: z.infer<typeof LiteratureImportInput>) {
    const input = LiteratureImportInput.parse(raw);
    const ins = this.db.prepare('INSERT INTO literature VALUES(?,?,?,?,?,?,?,?)');
    const now = new Date().toISOString();
    const ids: string[] = [];
    if (input.via === 'bibtex') {
      for (const e of parseBibtex(input.bibtex)) {
        const id = newId('lit');
        ids.push(id);
        ins.run(id, input.projectId, e.title, e.journal, e.year, e.abstract, null, now);
      }
    } else if (input.via === 'file') {
      // 原文阅读交给工作台的文件能力：库里只登记元数据与落盘路径
      const dir = join(this.dataHome, 'library', input.projectId);
      mkdirSync(dir, { recursive: true });
      const id = newId('lit');
      const dest = join(dir, `${id}-${basename(input.path)}`);
      copyFileSync(input.path, dest);
      ids.push(id);
      ins.run(id, input.projectId, input.title ?? basename(input.path), 'file', 0, '', dest, now);
    } else {
      // DOI：v0.1 mock 元数据，换真时接元数据解析服务
      const id = newId('lit');
      ids.push(id);
      ins.run(id, input.projectId, `DOI ${input.doi}`, 'doi(mock)', 0, '', null, now);
    }
    return { imported: ids.length, ids };
  }

  search(raw: z.infer<typeof LiteratureSearchInput>) {
    const { projectId, q, limit } = LiteratureSearchInput.parse(raw);
    return this.db.prepare(`
      SELECT l.id, l.title, l.year, l.abstract FROM literature_fts f
      JOIN literature l ON l.rowid = f.rowid
      WHERE literature_fts MATCH ? AND l.project_id = ? LIMIT ?`)
      .all(q, projectId, limit) as any[];
  }

  get(id: string) {
    const r = this.db.prepare('SELECT * FROM literature WHERE id=?').get(id);
    if (!r) throw new Error(`literature not found: ${id}`);
    return r as any;
  }
}
