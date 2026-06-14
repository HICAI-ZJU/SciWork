import { it, expect } from 'vitest';
import { generateInsight } from './insightProvider.js';

function fakeClient(nodes: unknown[]) {
  return { callTool: async () => ({ content: [{ text: JSON.stringify({ nodes }) }] }) } as never;
}

it('无 key → generated:false + 确定性摘要', async () => {
  const r = await generateInsight({
    client: fakeClient([{ id: 'obj', type: 'Objective', label: '联烯偶联' }]),
    graph: 'g1',
    kind: 'report',
    env: {}
  });
  expect(r.generated).toBe(false);
  expect(r.text).toMatch(/联烯偶联|图谱/);
});

it('有 key + provider=anthropic 走真实路径（注入 mock 调用器）', async () => {
  const r = await generateInsight({
    client: fakeClient([]),
    graph: 'g1',
    kind: 'suggestion',
    env: { SCICOMPASS_LLM_PROVIDER: 'anthropic', SCICOMPASS_LLM_API_KEY: 'sk-x' },
    callLlm: async () => 'AI 建议文本'
  });
  expect(r.generated).toBe(true);
  expect(r.text).toBe('AI 建议文本');
});
