import { it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { startHttpGateway, type HttpGateway } from './httpGateway.js';

let gw: HttpGateway;
let base: string;

beforeEach(async () => {
  const home = mkdtempSync(join(tmpdir(), 'sc-'));
  gw = await startHttpGateway({
    dataHome: home,
    modules: ['knowledge', 'harness'],
    template: resolve(import.meta.dirname, '../../../templates/fudan-xtalpi.yaml')
  }, 0); // 端口 0 = 系统分配空闲端口
  base = `http://127.0.0.1:${gw.port}`;
});

afterEach(async () => { await gw.close(); });

const call = async (name: string, args: unknown = {}) => {
  const r = await fetch(`${base}/api/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, arguments: args })
  });
  return r.json();
};

it('health reports service and tool count', async () => {
  const r = await fetch(`${base}/health`);
  const body = await r.json();
  expect(body.ok).toBe(true);
  expect(body.tools).toBe(31);
});

it('forwards tool calls and returns parsed data', async () => {
  const p = await call('project_create', { name: 'gw-demo', objective: 'obj' });
  expect(p.ok).toBe(true);
  expect(p.data.graphSlug).toMatch(/^prj-/);
  const list = await call('project_list', {});
  expect(list.data.projects).toHaveLength(1);
});

it('surfaces tool errors as ok:false', async () => {
  const p = await call('project_create', { name: 'x', objective: 'y' });
  const r = await call('graph_write', {
    graph: p.data.graphSlug,
    nodes: [{ id: 'n', type: 'Dragon', label: '', detail: '', round: 1, attrs: {}, provenance: [] }],
    edges: []
  });
  expect(r.ok).toBe(false);
  expect(r.error).toMatch(/unknown node type/i);
});

it('CORS preflight allowed', async () => {
  const r = await fetch(`${base}/api/call`, { method: 'OPTIONS' });
  expect(r.status).toBe(204);
  expect(r.headers.get('access-control-allow-origin')).toBe('*');
});
