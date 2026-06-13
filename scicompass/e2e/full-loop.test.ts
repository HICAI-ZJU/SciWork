import { it, expect } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { buildServer } from '../packages/cli/src/serve.js';

// 全闭环冒烟：文献 -> 证据入图 -> 锚定 -> 协议 -> 模拟运行 -> 回流 -> 蒸馏晋升
it('full discovery loop: literature -> protocol -> simulation -> flowback -> promote', async () => {
  let now = Date.parse('2026-06-12T08:00:00Z');
  const server = buildServer({
    dataHome: mkdtempSync(join(tmpdir(), 'sc-')),
    modules: ['knowledge', 'harness'],
    template: resolve(import.meta.dirname, '../templates/fudan-xtalpi.yaml'),
    clock: () => now
  });
  const [ct, st] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'e2e', version: '0' });
  await Promise.all([client.connect(ct), server.connect(st)]);
  const call = async (name: string, args: unknown) => {
    const r: any = await client.callTool({ name, arguments: args as any });
    if (r.isError) throw new Error(`${name}: ${r.content[0].text}`);
    return JSON.parse(r.content[0].text);
  };

  // 1 项目与文献
  const p = await call('project_create', { name: 'allene-screening', objective: '温和条件联烯偶联' });
  await call('literature_import', {
    via: 'bibtex', projectId: p.id,
    bibtex: '@article{a1, title={Allene coupling mild}, year={2024}, journal={JACS}, abstract={low loading, 60C window} }'
  });
  const hits = await call('literature_search', { projectId: p.id, q: 'allene', limit: 5 });
  expect(hits.hits).toHaveLength(1);

  // 2 图谱：目标 + 证据 + 锚定
  await call('graph_write', {
    graph: p.graphSlug,
    nodes: [
      { id: 'obj', type: 'Objective', label: '联烯偶联条件筛选', detail: '', round: 1, attrs: {}, provenance: [] },
      {
        id: 'ev1', type: 'LiteratureEvidence', label: '60C 窗口证据', detail: '', round: 1, attrs: {},
        provenance: [`scicompass://literature/${hits.hits[0].id}`]
      }
    ],
    edges: [{ id: 'e1', source: 'ev1', target: 'obj', label: 'supports' }]
  });
  const aligned = await call('graph_align_public', { graph: p.graphSlug, nodeIds: ['ev1'] });
  expect(aligned.anchors[0].anchor).toMatch(/^scigraph:\/\//);

  // 3 协议与校验
  const prot = await call('protocol_save', { projectId: p.id, objective: '筛选', payload: { steps: ['mix', 'heat'] } });
  const chk = await call('ontology_check', { reagents: ['pd-catalyst'], params: { temperatureC: 60 } });
  expect(chk.ok).toBe(true);

  // 4 模拟运行（行动引擎，时间线物化 + 惰性推进）
  const sub = await call('run_submit', {
    projectId: p.id, protocolId: prot.id, protocolVersion: prot.version,
    deviceId: 'dev-xtalpi', experimentType: 'reaction-screening',
    mode: 'simulation', params: { temperatureC: 60, timeHours: 2 }
  });
  expect(sub.status).toBe('queued');
  now += 15_000;
  const st2 = await call('run_status', { runId: sub.runId });
  expect(st2.status).toBe('completed');

  // 5 回流
  await call('graph_write', {
    graph: p.graphSlug,
    nodes: [{
      id: 'runN', type: 'Run', label: '模拟运行', detail: '', round: 1, attrs: {},
      provenance: [`scicompass://runs/${sub.runId}`]
    }],
    edges: []
  });
  const results = await call('result_list', { runId: sub.runId });
  expect(results.results).toHaveLength(1);
  const fb = await call('result_flowback', {
    resultId: results.results[0].id, graph: p.graphSlug, runNodeId: 'runN', round: 1
  });

  // 6 蒸馏晋升至组图（人批闸门：confirmedBy）
  const promo = await call('graph_promote', {
    fromGraph: p.graphSlug, toGraph: 'grp-masm', sourceNodeIds: [fb.resultNodeId],
    capsule: {
      headType: 'Lesson', title: '60C 窗口可行',
      summary: '模拟显示 60C/2h 产率良好', supportNodes: [], edges: []
    },
    confirmedBy: '麻老师', sanitizationChecked: false, irreversibleAck: false
  });
  const grp = await call('graph_query', { graph: 'grp-masm', headOnly: true, limit: 10 });
  expect(grp.nodes[0].id).toBe(promo.headNodeId);
  expect(grp.nodes[0].provenance[0]).toContain(p.graphSlug);
});
