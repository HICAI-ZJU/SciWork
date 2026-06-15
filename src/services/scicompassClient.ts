// SciWork 前端 → SciCompass HTTP 网关的薄客户端。
// UI 不是 LLM，但消费的是同一套 MCP 工具（网关进程内转发），数据与 Claude/Codex 完全一致。
//
// baseUrl 解析优先级：
//   1. Electron 主进程注入的 ?scicompassBase=（托管 sidecar 的实际端口）
//   2. VITE_SCICOMPASS_URL 环境变量（浏览器 dev 联调）
//   3. 默认 4517（dev:fullstack 约定端口）
function resolveBase(): string {
  try {
    const injected = new URLSearchParams(window.location.search).get('scicompassBase');
    if (injected) return injected;
  } catch { /* 非浏览器环境（测试）忽略 */ }
  return (import.meta.env.VITE_SCICOMPASS_URL as string | undefined) ?? 'http://127.0.0.1:4517';
}

const BASE: string = resolveBase();

export interface HealthInfo {
  ok: boolean;
  service: string;
  // 空间网关 /health 返回的是空间列表（非单空间的 modules）。
  spaces: string[];
  tools: number;
}

export interface Account {
  username: string;
  displayName: string;
  team: { id: string; name: string };
  space: string;
}
export interface SpaceConfig {
  space: string;
  displayName: string;
  institution?: string;
  domain?: string;
  accentColor?: string;
  devices: { id: string; name: string; kind: string }[];
}

// 当前登录空间：登录成功后由 AuthContext 设置，callTool 据此路由到对应空间。
let activeSpace: string | null = null;
export function setActiveSpace(space: string | null): void { activeSpace = space; }
export function getActiveSpace(): string | null { return activeSpace; }

/** 调用任意 SciCompass 工具；失败抛出含后端 error 文本的异常。 */
export async function callTool<T = unknown>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  if (!activeSpace) throw new Error('未登录：当前无空间上下文，无法调用后端工具');
  const res = await fetch(`${BASE}/api/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ space: activeSpace, name, arguments: args })
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error ?? `tool ${name} failed`);
  return json.data as T;
}

export async function health(): Promise<HealthInfo> {
  const res = await fetch(`${BASE}/health`);
  return res.json();
}

export async function login(username: string, password: string): Promise<{ account: Account; spaceConfig: SpaceConfig }> {
  const res = await fetch(`${BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error ?? '登录失败');
  return { account: json.account, spaceConfig: json.spaceConfig };
}

export async function listSpaces(): Promise<SpaceConfig[]> {
  const res = await fetch(`${BASE}/api/spaces`);
  const json = await res.json();
  return (json.spaces ?? []) as SpaceConfig[];
}

// —— 便捷方法（与 31 个工具一一对应的常用子集）——
export const sc = {
  baseUrl: BASE,
  health,
  login,
  listSpaces,
  setActiveSpace,
  getActiveSpace,
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
  artifactList: (projectId: string, kind?: string) => callTool<{ artifacts: any[] }>('artifact_list', { projectId, kind }),
  // 生成式洞见（网关层 LLM 拦截；无 key 时网关回退确定性摘要）。
  insightGenerate: (kind: 'report' | 'suggestion', graph: string, constraint?: string) =>
    callTool<{ generated: boolean; text: string; items?: string[] }>('insight_generate', { kind, graph, constraint })
};
