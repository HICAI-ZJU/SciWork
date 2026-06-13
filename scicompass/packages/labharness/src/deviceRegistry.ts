import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { openDb, type Db } from '@scicompass/core';
import type { DeviceProfile } from './schema.js';

const MIG = [{
  id: 30, sql: 'CREATE TABLE devices(id TEXT PRIMARY KEY, profile TEXT NOT NULL, created_at TEXT NOT NULL);'
}];

export interface SpaceTemplate {
  space: string;
  displayName: string;
  groupSlug: string;
  defaultSkills: string[];
}

export class DeviceRegistry {
  db: Db;

  constructor(dataHome: string) {
    this.db = openDb(join(dataHome, 'scicompass.db'), MIG);
  }

  loadTemplate(file: string): SpaceTemplate {
    const tpl = parse(readFileSync(file, 'utf8'));
    const devices: DeviceProfile[] = tpl.devices;
    for (const d of devices) {
      d.members = devices.filter((x) => x.partOf === d.id).map((x) => x.id);
    }
    const ins = this.db.prepare('INSERT OR REPLACE INTO devices VALUES(?,?,?)');
    for (const d of devices) ins.run(d.id, JSON.stringify(d), new Date().toISOString());
    return {
      space: tpl.space, displayName: tpl.displayName,
      groupSlug: tpl.groupSlug, defaultSkills: tpl.defaultSkills
    };
  }

  list(): { id: string; name: string; kind: string }[] {
    return this.db.prepare('SELECT profile FROM devices').all()
      .map((r: any) => {
        const p = JSON.parse(r.profile) as DeviceProfile;
        return { id: p.id, name: p.name, kind: p.kind };
      });
  }

  getProfile(id: string): DeviceProfile {
    const r: any = this.db.prepare('SELECT profile FROM devices WHERE id=?').get(id);
    if (!r) throw new Error(`device not found: ${id}`);
    return JSON.parse(r.profile);
  }
}
