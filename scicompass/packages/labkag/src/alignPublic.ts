import { createHash } from 'node:crypto';
import type { KagService } from './kag.js';

// v0.1：确定性 mock 锚定。接口与真实 SciGraph MCP client 版完全一致——
// 换真时仅替换本文件内部实现（服务端内嵌 MCP client 调 SciGraph），合同不动。
const MOCK_KGS = ['ReaKE', 'ElementKG', 'Material'];

export function alignPublic(kag: KagService, input: { graph: string; nodeIds: string[] }) {
  const store = kag.open(input.graph);
  const { nodes } = store.query({ limit: 500 });
  const anchors = input.nodeIds.map((id) => {
    const n = nodes.find((x) => x.id === id);
    if (!n) throw new Error(`node not found: ${id}`);
    const h = createHash('sha1').update(n.label).digest('hex');
    const anchor = `scigraph://${MOCK_KGS[h.charCodeAt(0) % MOCK_KGS.length]}/node/${h.slice(0, 10)}`;
    store.write([{ ...n, attrs: { ...n.attrs, scigraph_anchor: anchor } }], []);
    return { nodeId: id, anchor, confidence: 0.8 };
  });
  return { anchors, source: 'mock' as const };
}
