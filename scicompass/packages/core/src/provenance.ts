// 溯源 URI 规范：跨图、跨库的引用一律走 URI 指针，永不直接连边。
//   labgraph://<graphSlug>/node/<nodeId>   图谱节点
//   scicompass://<table>/<recordId>        主库记录（runs/results/protocols/artifacts/literature）
export interface ParsedUri {
  scheme: 'labgraph' | 'scicompass';
  host: string;
  kind: 'node' | 'record';
  id: string;
}

export function parseProvenanceUri(uri: string): ParsedUri {
  const m = /^(labgraph|scicompass):\/\/([^/]+)\/(?:(node)\/)?([^/]+)$/.exec(uri);
  if (!m) throw new Error(`unsupported provenance uri: ${uri}`);
  const [, scheme, host, nodeKw, id] = m;
  if (scheme === 'labgraph') {
    if (nodeKw !== 'node') throw new Error(`unsupported provenance uri: ${uri}`);
    return { scheme, host, kind: 'node', id };
  }
  return { scheme: 'scicompass', host, kind: 'record', id };
}

export const makeGraphNodeUri = (graphSlug: string, nodeId: string) =>
  `labgraph://${graphSlug}/node/${nodeId}`;

export const makeRecordUri = (table: string, id: string) =>
  `scicompass://${table}/${id}`;
