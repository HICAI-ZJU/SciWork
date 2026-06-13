import { it, expect, beforeEach } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { buildServer } from '../serve.js';

let client: Client;
beforeEach(async () => {
  const home = mkdtempSync(join(tmpdir(), 'sc-'));
  const server = buildServer({
    dataHome: home,
    modules: ['knowledge', 'harness'],
    template: resolve(import.meta.dirname, '../../../../templates/fudan-xtalpi.yaml')
  });
  const [ct, st] = InMemoryTransport.createLinkedPair();
  client = new Client({ name: 't', version: '0' });
  await Promise.all([client.connect(ct), server.connect(st)]);
});

const call = async (name: string, args: unknown) => {
  const r: any = await client.callTool({ name, arguments: args as any });
  if (r.isError) throw new Error(r.content[0].text);
  return JSON.parse(r.content[0].text);
};

it('lists 31 tools across both profiles', async () => {
  const tools = await client.listTools();
  expect(tools.tools.length).toBe(31);
});

it('knowledge happy path: project -> graph -> ontology', async () => {
  const p = await call('project_create', { name: 'demo', objective: 'obj' });
  await call('graph_write', {
    graph: p.graphSlug,
    nodes: [{ id: 'n1', type: 'Objective', label: 'g', detail: '', round: 1, attrs: {}, provenance: [] }],
    edges: []
  });
  const q = await call('graph_query', { graph: p.graphSlug, headOnly: false, limit: 10 });
  expect(q.nodes).toHaveLength(1);
  const chk = await call('ontology_check', { reagents: ['water'], params: { temperatureC: 60 } });
  expect(chk.ok).toBe(true);
});

it('harness happy path and gate: physical stops at awaiting-approval', async () => {
  const devs = await call('device_list', {});
  expect(devs.devices.map((d: any) => d.id)).toContain('dev-xtalpi');
  const sub = await call('run_submit', {
    projectId: 'p', protocolId: 'pr', protocolVersion: 1, deviceId: 'dev-xtalpi',
    experimentType: 'reaction-screening', mode: 'physical', params: { temperatureC: 60, timeHours: 1 }
  });
  expect(sub.status).toBe('awaiting-approval');
});

it('error envelope: ontology rejection surfaces as isError', async () => {
  const p = await call('project_create', { name: 'x', objective: 'y' });
  await expect(call('graph_write', {
    graph: p.graphSlug,
    nodes: [{ id: 'n', type: 'Dragon', label: '', detail: '', round: 1, attrs: {}, provenance: [] }],
    edges: []
  })).rejects.toThrow(/unknown node type/i);
});

it('knowledge-only mount hides harness tools', async () => {
  const home = mkdtempSync(join(tmpdir(), 'sc-'));
  const server = buildServer({ dataHome: home, modules: ['knowledge'] });
  const [ct, st] = InMemoryTransport.createLinkedPair();
  const c2 = new Client({ name: 't2', version: '0' });
  await Promise.all([c2.connect(ct), server.connect(st)]);
  const tools = await c2.listTools();
  expect(tools.tools.length).toBe(23);
  expect(tools.tools.map((t) => t.name)).not.toContain('run_submit');
});
