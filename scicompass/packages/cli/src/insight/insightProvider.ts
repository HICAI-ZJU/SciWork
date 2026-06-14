import type { Client } from '@modelcontextprotocol/sdk/client/index.js';

export interface InsightResult { generated: boolean; text: string; items?: string[] }
export type InsightKind = 'report' | 'suggestion';

interface GraphSummary { count: number; objectives: string[]; evidence: string[] }

function summarize(nodes: Record<string, unknown>[]): GraphSummary {
  return {
    count: nodes.length,
    objectives: nodes.filter((n) => n.type === 'Objective').map((n) => String(n.label)),
    evidence: nodes.filter((n) => n.type === 'LiteratureEvidence').map((n) => String(n.label))
  };
}

function fallback(kind: InsightKind, s: GraphSummary): InsightResult {
  if (kind === 'report') {
    return {
      generated: false,
      text: `基于 ${s.count} 个图谱节点的确定性摘要：${s.objectives[0] ?? '研究目标'}；文献证据 ${s.evidence.length} 条。`,
      items: s.evidence.slice(0, 3).map((e) => `参考：${e}`)
    };
  }
  return { generated: false, text: `基于真实图谱（${s.count} 节点）的下一轮建议（摘要回退）。`, items: ['收窄条件搜索范围'] };
}

function buildPrompt(kind: InsightKind, s: GraphSummary, constraint?: string): string {
  const head = kind === 'report'
    ? '你是科研助手。基于以下项目知识图谱摘要，给出简洁的研究方向报告（中文，3-5 句 + 2-3 条候选方向，每条一行以"-"开头）。'
    : '你是科研助手。基于以下项目知识图谱摘要，给出下一轮实验的 2-3 条建议（中文，每条一行以"-"开头）。';
  return `${head}\n约束：${constraint ?? '无'}\n图谱：节点 ${s.count}，目标【${s.objectives.join('；')}】，证据【${s.evidence.join('；')}】`;
}

function extractItems(text: string): string[] {
  return text.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('-')).map((l) => l.replace(/^-\s*/, ''));
}

interface LlmConfig { provider: string; baseUrl?: string; model?: string; apiKey?: string }
function readConfig(env: Record<string, string | undefined>): LlmConfig {
  return {
    provider: env.SCICOMPASS_LLM_PROVIDER ?? 'none',
    baseUrl: env.SCICOMPASS_LLM_BASE_URL,
    model: env.SCICOMPASS_LLM_MODEL,
    apiKey: env.SCICOMPASS_LLM_API_KEY
  };
}

// 生产默认调用器：按 provider 选 Anthropic SDK 或 OpenAI 兼容 fetch。测试注入 callLlm 不打真实 API。
async function defaultCallLlm(cfg: LlmConfig, prompt: string): Promise<string> {
  if (cfg.provider === 'anthropic') {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: cfg.apiKey });
    const msg = await client.messages.create({
      model: cfg.model ?? 'claude-opus-4-8',
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      messages: [{ role: 'user', content: prompt }]
    } as never);
    return ((msg as { content: { type: string; text?: string }[] }).content)
      .filter((b) => b.type === 'text')
      .map((b) => b.text ?? '')
      .join('\n');
  }
  // openai-compatible（火山方舟/豆包、ZJU 内网、OpenAI）
  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({ model: cfg.model, messages: [{ role: 'user', content: prompt }] })
  });
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content ?? '';
}

export async function generateInsight(opts: {
  client: Client;
  graph: string;
  kind: InsightKind;
  constraint?: string;
  env?: Record<string, string | undefined>;
  callLlm?: (cfg: LlmConfig, prompt: string) => Promise<string>;
}): Promise<InsightResult> {
  const cfg = readConfig(opts.env ?? process.env);
  // 上下文自取：用空间 MCP client 读真实项目图
  let nodes: Record<string, unknown>[] = [];
  try {
    const gq = await opts.client.callTool({ name: 'graph_query', arguments: { graph: opts.graph, limit: 50 } });
    const text = (gq as { content?: { text?: string }[] }).content?.[0]?.text ?? '{}';
    nodes = (JSON.parse(text).nodes ?? []) as Record<string, unknown>[];
  } catch {
    nodes = [];
  }
  const s = summarize(nodes);

  const hasKey = cfg.provider !== 'none' && !!cfg.apiKey && (cfg.provider === 'anthropic' || !!cfg.baseUrl);
  if (!hasKey) return fallback(opts.kind, s);

  try {
    const call = opts.callLlm ?? defaultCallLlm;
    const text = await call(cfg, buildPrompt(opts.kind, s, opts.constraint));
    if (!text.trim()) return fallback(opts.kind, s);
    return { generated: true, text, items: extractItems(text) };
  } catch {
    return fallback(opts.kind, s); // 失败也回退，不阻塞工作流
  }
}
