import { it, expect } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DeviceRegistry } from './deviceRegistry.js';

const tpl = resolve(import.meta.dirname, '../../../templates/fudan-xtalpi.yaml');

it('loads template, lists devices, gets profile with members', () => {
  const reg = new DeviceRegistry(mkdtempSync(join(tmpdir(), 'sc-')));
  const space = reg.loadTemplate(tpl);
  expect(space.groupSlug).toBe('grp-masm');
  expect(space.defaultSkills).toContain('xtalpi-synthesis');
  const list = reg.list();
  expect(list.map((d) => d.id).sort()).toEqual(['dev-hplc', 'dev-xtalpi']);
  const prof = reg.getProfile('dev-xtalpi');
  expect(prof.members).toContain('dev-hplc');
  expect(prof.capabilities[0].experimentType).toBe('reaction-screening');
  expect(prof.physicalAvailable).toBe(false);
});

it('getProfile throws on unknown device', () => {
  const reg = new DeviceRegistry(mkdtempSync(join(tmpdir(), 'sc-')));
  expect(() => reg.getProfile('ghost')).toThrow(/not found/i);
});
