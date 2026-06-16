import { demoLiterature } from '../domain/demoData';

export interface HealthInfo {
  ok: boolean;
  service: string;
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

interface ProjectRecord {
  id: string;
  name: string;
  objective: string;
  graphSlug: string;
}

interface GraphNode {
  id: string;
  type: string;
  label: string;
  detail?: string;
  round?: number;
  attrs?: Record<string, unknown>;
  provenance?: string[];
}

interface GraphEdge {
  id?: string;
  source: string;
  target: string;
  label: string;
}

const spaces: SpaceConfig[] = [
  {
    space: 'fudan-xtalpi',
    displayName: '复旦化学系 · 晶泰自动化合成工作站',
    institution: '复旦大学',
    domain: '化学反应发现空间',
    accentColor: '#2F6BFF',
    devices: [
      { id: 'dev-xtalpi', name: '晶泰自动化合成工作站', kind: 'automation-platform' },
      { id: 'inst-hplc', name: 'HPLC 分析仪', kind: 'instrument' }
    ]
  },
  {
    space: 'zju-ichemfoundry',
    displayName: '浙大科创中心 · iChemFoundry',
    institution: '浙江大学',
    domain: 'MOF / 材料设计发现空间',
    accentColor: '#005BAC',
    devices: [
      { id: 'dev-ichemfoundry', name: 'iChemFoundry 材料自动化平台', kind: 'automation-platform' },
      { id: 'inst-xrd', name: '粉末 X 射线衍射仪', kind: 'instrument' }
    ]
  },
  {
    space: 'zju-ibiofoundry',
    displayName: '浙大科创中心 · iBioFoundry',
    institution: '浙江大学',
    domain: '合成生物发现空间',
    accentColor: '#0C8F6A',
    devices: [
      { id: 'dev-ibiofoundry', name: 'iBioFoundry 合成生物自动化平台', kind: 'automation-platform' },
      { id: 'inst-plate-reader', name: '多功能酶标仪', kind: 'instrument' }
    ]
  },
  {
    space: 'zju-oasis',
    displayName: '浙大智慧绿洲 · 绿洲一号',
    institution: '浙江大学',
    domain: '药物发现空间',
    accentColor: '#C9182B',
    devices: [
      { id: 'dev-oasis', name: '绿洲一号药物筛选平台', kind: 'automation-platform' },
      { id: 'inst-lcms', name: '液相色谱-质谱联用仪', kind: 'instrument' }
    ]
  }
];

const accounts: Record<string, { password: string; account: Account; spaceConfig: SpaceConfig }> = {
  'chem.ma': {
    password: 'demo1234',
    account: {
      username: 'chem.ma',
      displayName: '麻生明课题组 · 研究员',
      team: { id: 'team-masm', name: '麻生明课题组' },
      space: 'fudan-xtalpi'
    },
    spaceConfig: spaces[0]
  },
  'zju.demo': {
    password: 'demo1234',
    account: {
      username: 'zju.demo',
      displayName: '浙大科创中心 · 研究员',
      team: { id: 'team-zju-aifs', name: '浙江大学 AI for Science' },
      space: 'zju-ichemfoundry'
    },
    spaceConfig: spaces[1]
  }
};

const projectsBySpace = new Map<string, ProjectRecord[]>([
  ['fudan-xtalpi', [
    {
      id: 'p-mild-coupling',
      name: '温和条件下偶联反应优化',
      objective: '寻找温和、短时、转化稳定且证据链可追溯的偶联反应条件。',
      graphSlug: 'prj-mild-coupling'
    },
    {
      id: 'p-flow-screening',
      name: '连续流筛选与放大验证',
      objective: '比较不同催化体系的连续流转化稳定性。',
      graphSlug: 'prj-flow-screening'
    }
  ]],
  ['zju-ichemfoundry', [
    {
      id: 'p-mof-synthesis',
      name: 'MOF 合成条件探索',
      objective: '围绕配体、温度和溶剂窗口形成可追溯的材料合成方案。',
      graphSlug: 'prj-mof-synthesis'
    }
  ]]
]);

const graphs = new Map<string, { nodes: GraphNode[]; edges: GraphEdge[] }>();
const artifacts: Record<string, any[]> = {};
const results: any[] = [];
let activeSpace: string | null = null;
let projectCounter = 100;
let runCounter = 100;

function currentProjects(): ProjectRecord[] {
  if (!activeSpace) return [];
  if (!projectsBySpace.has(activeSpace)) projectsBySpace.set(activeSpace, []);
  return projectsBySpace.get(activeSpace)!;
}

function ensureGraph(graph: string) {
  if (!graphs.has(graph)) graphs.set(graph, { nodes: [], edges: [] });
  return graphs.get(graph)!;
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 80));
}

export function setActiveSpace(space: string | null): void { activeSpace = space; }
export function getActiveSpace(): string | null { return activeSpace; }

export async function callTool<T = unknown>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const method = (sc as Record<string, unknown>)[toolToMethod(name)];
  if (typeof method !== 'function') throw new Error(`本地 UI 服务未实现工具：${name}`);
  return method(...Object.values(args)) as Promise<T>;
}

function toolToMethod(name: string): string {
  return name.replace(/_([a-z])/g, (_, ch: string) => ch.toUpperCase());
}

export async function health(): Promise<HealthInfo> {
  return delay({ ok: true, service: 'sciwork-local-ui', spaces: spaces.map((s) => s.space), tools: 0 });
}

export async function login(username: string, password: string): Promise<{ account: Account; spaceConfig: SpaceConfig }> {
  const record = accounts[username];
  if (!record || record.password !== password) throw new Error('账号或密码错误');
  return delay({ account: record.account, spaceConfig: record.spaceConfig });
}

export async function listSpaces(): Promise<SpaceConfig[]> {
  return delay(spaces);
}

export const sc = {
  baseUrl: 'local-ui-service',
  health,
  login,
  listSpaces,
  setActiveSpace,
  getActiveSpace,
  projectList: () => delay({ projects: currentProjects() }),
  projectCreate: (name: string, objective: string) => {
    const project: ProjectRecord = {
      id: `p-local-${projectCounter++}`,
      name,
      objective,
      graphSlug: `prj-local-${projectCounter}`
    };
    currentProjects().push(project);
    return delay(project);
  },
  deviceList: () => {
    const space = spaces.find((item) => item.space === activeSpace);
    return delay({ devices: space?.devices ?? [] });
  },
  deviceProfile: (id: string) => delay({ id, status: 'available', mode: 'local-demo' }),
  literatureImport: (_projectId: string, _bibtex: string) =>
    delay({ imported: 1, ids: [demoLiterature[0].id] }),
  literatureSearch: (_projectId: string, q: string, limit = 10) => {
    const lower = q.toLowerCase();
    const hits = demoLiterature
      .filter((item) => `${item.title} ${item.abstract} ${item.evidenceTags.join(' ')}`.toLowerCase().includes(lower) || lower.length < 4)
      .slice(0, limit);
    return delay({ hits: hits.length ? hits : demoLiterature.slice(0, limit) });
  },
  graphWrite: (graph: string, nodes: GraphNode[], edges: GraphEdge[] = []) => {
    const target = ensureGraph(graph);
    for (const node of nodes) {
      const existing = target.nodes.findIndex((item) => item.id === node.id);
      if (existing >= 0) target.nodes[existing] = node;
      else target.nodes.push(node);
    }
    target.edges.push(...edges);
    return delay({ written: { nodes: nodes.length, edges: edges.length } });
  },
  graphQuery: (graph: string, opts: Record<string, unknown> = {}) => {
    const target = ensureGraph(graph);
    const limit = Number(opts.limit ?? 50);
    const type = opts.type as string | undefined;
    const nodes = type ? target.nodes.filter((node) => node.type === type) : target.nodes;
    return delay({ nodes: nodes.slice(0, limit), edges: target.edges.slice(0, limit) });
  },
  graphAlign: (_graph: string, nodeIds: string[]) =>
    delay({ anchors: nodeIds.map((id) => ({ nodeId: id, anchor: `scigraph://demo/${id}` })), source: 'SciGraph demo' }),
  graphPromote: (_args: Record<string, unknown>) =>
    delay({ headNodeId: `lesson-${Date.now()}`, provenance: ['local-demo'] }),
  protocolSave: (projectId: string, objective: string, payload: Record<string, unknown>) =>
    delay({ id: `protocol-${projectId}-${Date.now()}`, version: 1, objective, payload }),
  ontologyCheck: (_reagents: string[], params: Record<string, unknown>) => {
    const temperature = Number(params.temperatureC ?? 25);
    const ok = temperature <= 80;
    return delay({ ok, violations: ok ? [] : ['温度超过本地演示安全阈值 80 C'] });
  },
  runValidate: (_deviceId: string, _experimentType: string, _params: Record<string, unknown>) =>
    delay({ ok: true, errors: [] }),
  runSubmit: (_args: Record<string, unknown>) => {
    const runId = `run-local-${runCounter++}`;
    results.push({ id: `result-${runId}`, runId, projectId: _args.projectId, summary: '本地演示结果：转化率稳定，建议收窄温度窗口。' });
    return delay({ runId, status: 'queued' });
  },
  runStatus: (runId: string) =>
    delay({ runId, status: 'completed', newEvents: [{ label: '本地模拟完成', detail: 'UI-only demo run completed.' }] }),
  resultList: (filter: Record<string, unknown> = {}) => {
    const list = results.filter((item) => !filter.runId || item.runId === filter.runId);
    return delay({ results: list });
  },
  resultFlowback: (resultId: string, graph: string, runNodeId: string, round = 1) => {
    const node = { id: `result-node-${resultId}`, type: 'Result', label: '本地演示结果', detail: resultId, round, attrs: {}, provenance: [`local://results/${resultId}`] };
    ensureGraph(graph).nodes.push(node);
    ensureGraph(graph).edges.push({ source: runNodeId, target: node.id, label: 'produces_result' });
    return delay({ resultNodeId: node.id });
  },
  artifactSave: (args: Record<string, unknown>) => {
    const projectId = String(args.projectId ?? 'default');
    const item = { id: `artifact-${Date.now()}`, uri: `local://artifacts/${Date.now()}`, ...args };
    artifacts[projectId] = [...(artifacts[projectId] ?? []), item];
    return delay({ id: item.id, uri: item.uri });
  },
  artifactList: (projectId: string, kind?: string) => {
    const list = (artifacts[projectId] ?? []).filter((item) => !kind || item.kind === kind);
    return delay({ artifacts: list });
  },
  insightGenerate: (kind: 'report' | 'suggestion', _graph: string, constraint?: string) => {
    const report = constraint
      ? `本地 UI 摘要：围绕「${constraint}」整理证据、约束和下一轮实验方向。`
      : '本地 UI 摘要：基于当前演示图谱整理证据、约束和下一轮实验方向。';
    return delay({
      generated: false,
      text: report,
      items: kind === 'report'
        ? ['确认温和温度窗口', '补充仪器表征证据', '保留负结果回流']
        : ['收窄温度窗口', '补充 HPLC 衔接结果', '提交下一轮模拟前复核 ontology 约束']
    });
  }
};
