// SciWork 前端 → SciCompass HTTP 网关的薄客户端。
// UI 不是 LLM，但消费的是同一套 MCP 工具（网关进程内转发），数据与 Claude/Codex 完全一致。
const BASE: string =
  (import.meta.env.VITE_SCICOMPASS_URL as string | undefined) ?? 'http://127.0.0.1:4517';

export interface HealthInfo {
  ok: boolean;
  service: string;
  modules: string[];
  tools: number;
}

/** 调用任意 SciCompass 工具；失败抛出含后端 error 文本的异常。 */
export async function callTool<T = unknown>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(`${BASE}/api/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, arguments: args })
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error ?? `tool ${name} failed`);
  return json.data as T;
}

export async function health(): Promise<HealthInfo> {
  const res = await fetch(`${BASE}/health`);
  return res.json();
}

// —— 便捷方法（与 31 个工具一一对应的常用子集）——
export const sc = {
  baseUrl: BASE,
  health,
  projectList: () => callTool<{ projects: any[] }>('project_list'),
  projectCreate: (name: string, objective: string) =>
    callTool<{ id: string; name: string; objective: string; graphSlug: string }>('project_create', { name, objective }),
  deviceList: () => callTool<{ devices: any[] }>('device_list'),
  deviceProfile: (id: string) => callTool('device_get_profile', { id }),
  literatureImport: (projectId: string, bibtex: string) =>
    callTool<{ imported: number; ids: string[] }>('literature_import', { via: 'bibtex', projectId, bibtex }),
  literatureSearch: (projectId: string, q: string, limit = 10) =>
    callTool<{ hits: any[] }>('literature_search', { projectId, q, limit }),
  graphWrite: (graph: string, nodes: unknown[], edges: unknown[] = []) =>
    callTool<{ written: { nodes: number; edges: number } }>('graph_write', { graph, nodes, edges }),
  graphQuery: (graph: string, opts: Record<string, unknown> = {}) =>
    callTool<{ nodes: any[]; edges: any[] }>('graph_query', { graph, ...opts }),
  graphAlign: (graph: string, nodeIds: string[]) =>
    callTool<{ anchors: any[]; source: string }>('graph_align_public', { graph, nodeIds }),
  graphPromote: (args: Record<string, unknown>) => callTool<{ headNodeId: string; provenance: string[] }>('graph_promote', args),
  protocolSave: (projectId: string, objective: string, payload: Record<string, unknown>) =>
    callTool<{ id: string; version: number }>('protocol_save', { projectId, objective, payload }),
  ontologyCheck: (reagents: string[], params: Record<string, unknown>) =>
    callTool<{ ok: boolean; violations: string[] }>('ontology_check', { reagents, params }),
  runValidate: (deviceId: string, experimentType: string, params: Record<string, unknown>) =>
    callTool<{ ok: boolean; errors: string[] }>('run_validate', { deviceId, experimentType, params }),
  runSubmit: (args: Record<string, unknown>) => callTool<{ runId: string; status: string }>('run_submit', args),
  runStatus: (runId: string) =>
    callTool<{ runId: string; status: string; newEvents: any[] }>('run_status', { runId }),
  resultList: (filter: Record<string, unknown> = {}) => callTool<{ results: any[] }>('result_list', filter),
  resultFlowback: (resultId: string, graph: string, runNodeId: string, round = 1) =>
    callTool<{ resultNodeId: string }>('result_flowback', { resultId, graph, runNodeId, round }),
  artifactSave: (args: Record<string, unknown>) => callTool<{ id: string; uri: string }>('artifact_save', args),
  artifactList: (projectId: string, kind?: string) => callTool<{ artifacts: any[] }>('artifact_list', { projectId, kind })
};
