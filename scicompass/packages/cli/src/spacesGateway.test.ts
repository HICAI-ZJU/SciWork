import { it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { startSpacesGateway, type SpacesGateway } from './spacesGateway.js';

let gw: SpacesGateway;
let base: string;
const templatesDir = resolve(import.meta.dirname, '../../../templates');

beforeEach(async () => {
  const dataRoot = mkdtempSync(join(tmpdir(), 'sc-spaces-'));
  gw = await startSpacesGateway({
    dataRoot,
    templatesDir,
    accountsFile: join(templatesDir, 'accounts.yaml')
  }, 0);
  base = `http://127.0.0.1:${gw.port}`;
});

afterEach(async () => { if (gw) await gw.close(); });

const post = async (path: string, body: unknown) => {
  const r = await fetch(`${base}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  return { status: r.status, json: await r.json() };
};

it('health lists all four spaces', async () => {
  const r = await fetch(`${base}/health`);
  const body = await r.json();
  expect(body.ok).toBe(true);
  expect(body.spaces.sort()).toEqual(['fudan-xtalpi', 'zju-ibiofoundry', 'zju-ichemfoundry', 'zju-oasis']);
  expect(body.tools).toBe(31);
});

it('login succeeds and returns the bound space config', async () => {
  const { status, json } = await post('/api/login', { username: 'chem.ma', password: 'demo1234' });
  expect(status).toBe(200);
  expect(json.ok).toBe(true);
  expect(json.account.space).toBe('fudan-xtalpi');
  expect(json.account.team.id).toBe('team-masm');
  expect(json.spaceConfig.displayName).toMatch(/复旦晶泰/);
  expect(json.spaceConfig.devices.map((d: any) => d.id)).toContain('dev-xtalpi');
  expect(json.account.password).toBeUndefined();
});

it('rejects wrong password', async () => {
  const { status, json } = await post('/api/login', { username: 'chem.ma', password: 'nope' });
  expect(status).toBe(401);
  expect(json.ok).toBe(false);
});

it('routes each account to its own space devices (physical isolation)', async () => {
  const cases: Array<[string, string, string]> = [
    ['mat.zju', 'zju-ichemfoundry', 'dev-ichemfoundry'],
    ['bio.zju', 'zju-ibiofoundry', 'dev-ibiofoundry'],
    ['pharma.oasis', 'zju-oasis', 'dev-oasis-1']
  ];
  for (const [username, space, deviceId] of cases) {
    const login = await post('/api/login', { username, password: 'demo1234' });
    expect(login.json.account.space).toBe(space);
    const dl = await post('/api/call', { space, name: 'device_list', arguments: {} });
    expect(dl.json.ok).toBe(true);
    expect(dl.json.data.devices.map((d: any) => d.id)).toContain(deviceId);
    // 跨空间隔离：该空间看不到晶泰装置
    expect(dl.json.data.devices.map((d: any) => d.id)).not.toContain('dev-xtalpi');
  }
});

it('project created in one space is invisible to another (isolated data dirs)', async () => {
  await post('/api/call', { space: 'fudan-xtalpi', name: 'project_create', arguments: { name: 'iso-test', objective: 'x' } });
  const a = await post('/api/call', { space: 'fudan-xtalpi', name: 'project_list', arguments: {} });
  const b = await post('/api/call', { space: 'zju-oasis', name: 'project_list', arguments: {} });
  expect(a.json.data.projects.some((p: any) => p.name === 'iso-test')).toBe(true);
  expect(b.json.data.projects.some((p: any) => p.name === 'iso-test')).toBe(false);
});

it('rejects calls with unknown or missing space', async () => {
  const { status, json } = await post('/api/call', { space: 'nope', name: 'device_list', arguments: {} });
  expect(status).toBe(400);
  expect(json.ok).toBe(false);
});

it('login spaceConfig 带空间强调色 accentColor', async () => {
  const { json } = await post('/api/login', { username: 'chem.ma', password: 'demo1234' });
  expect(json.spaceConfig.accentColor).toBe('#2F6BFF');
});

it('insight_generate 无 key 走网关回退（generated:false）', async () => {
  await post('/api/call', { space: 'fudan-xtalpi', name: 'project_create', arguments: { name: 'ins', objective: 'o' } });
  const a = await post('/api/call', { space: 'fudan-xtalpi', name: 'project_list', arguments: {} });
  const graph = a.json.data.projects[0].graphSlug;
  const { json } = await post('/api/call', { space: 'fudan-xtalpi', name: 'insight_generate', arguments: { kind: 'report', graph } });
  expect(json.ok).toBe(true);
  expect(json.data.generated).toBe(false);
  expect(typeof json.data.text).toBe('string');
});
