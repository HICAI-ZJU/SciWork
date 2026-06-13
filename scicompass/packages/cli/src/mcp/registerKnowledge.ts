import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  GraphWriteInput, GraphQueryInput, PromoteInput, ProjectCreateInput,
  ArtifactSaveInput, ProtocolSaveInput, ResultRegisterInput, LiteratureSearchInput
} from '@scicompass/core';
import type { OntologyService } from '@scicompass/labontology';
import { exportGraphMarkdown, alignPublic, type KagService, type Records } from '@scicompass/labkag';
import type { Library } from '@scicompass/lablibrary';

interface Deps { ontology: OntologyService; kag: KagService; records: Records; library: Library }

const ok = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data) }] });
const fail = (e: unknown) => ({
  isError: true,
  content: [{ type: 'text' as const, text: String((e as Error)?.message ?? e) }]
});
const wrap = (fn: (args: any) => unknown) => async (args: any) => {
  try { return ok(await fn(args)); } catch (e) { return fail(e); }
};

export function registerKnowledge(s: McpServer, d: Deps) {
  const t = (name: string, desc: string, shape: z.ZodRawShape, fn: (a: any) => unknown) =>
    s.tool(name, desc, shape, wrap(fn));

  // —— 项目 ——
  t('project_create', '创建项目（返回项目图 slug）', ProjectCreateInput.shape, (a) => d.records.projectCreate(a));
  t('project_list', '项目列表', {}, () => ({ projects: d.records.projectList() }));
  t('project_get', '项目详情', { id: z.string() }, (a) => d.records.projectGet(a.id));

  // —— 私域文献 ——
  t('literature_import', '导入文献（file/doi/bibtex 三入口）', {
    via: z.enum(['file', 'doi', 'bibtex']), projectId: z.string(),
    path: z.string().optional(), title: z.string().optional(),
    doi: z.string().optional(), bibtex: z.string().optional()
  }, (a) => d.library.import(a));
  t('literature_search', '全文检索（FTS5）', LiteratureSearchInput.shape, (a) => ({ hits: d.library.search(a) }));
  t('literature_get', '文献详情（含原文件路径，原文阅读用工作台文件能力）', { id: z.string() }, (a) => d.library.get(a.id));

  // —— LabGraph（LabKAG 知识引擎）——
  t('graph_write', '写入图谱节点与边（经 LabOntology 校验；溯源必填类型缺溯源即拒绝）',
    GraphWriteInput.shape, (a) => d.kag.write(a));
  t('graph_query', '查询图谱（headOnly=true 仅看胶囊头节点摘要）', GraphQueryInput.shape, (a) => d.kag.query(a));
  t('graph_promote', '蒸馏晋升（项目图→组图→公开图；闸门分级，公开跳需脱敏与不可逆确认）',
    PromoteInput.shape, (a) => d.kag.promote(a));
  t('graph_export', '导出图谱为 markdown', { graph: z.string() },
    (a) => ({ markdown: exportGraphMarkdown(d.kag, a.graph) }));
  t('graph_align_public', '锚定公共星图 SciGraph（v0.1 为确定性 mock，合同与真实现一致）',
    { graph: z.string(), nodeIds: z.array(z.string()) }, (a) => alignPublic(d.kag, a));

  // —— 产物 ——
  t('artifact_save', '保存产物（report/hypothesis/suggestion/analysis/logbook/tool）',
    ArtifactSaveInput.shape, (a) => d.records.artifactSave(a));
  t('artifact_list', '产物列表', { projectId: z.string(), kind: z.string().optional() },
    (a) => ({ artifacts: d.records.artifactList(a.projectId, a.kind) }));
  t('artifact_get', '产物详情', { id: z.string() }, (a) => d.records.artifactGet(a.id));

  // —— 协议 ——
  t('protocol_save', '保存实验协议（版本自增）', ProtocolSaveInput.shape, (a) => d.records.protocolSave(a));
  t('protocol_get', '协议详情', { id: z.string() }, (a) => d.records.protocolGet(a.id));
  t('protocol_validate', '按 LabOntology 校验协议意图（试剂组合 + 参数边界）',
    { reagents: z.array(z.string()).default([]), params: z.record(z.unknown()).default({}) },
    (a) => d.ontology.check(a));

  // —— 结果 ——
  t('result_register', '登记实验结果（两档溯源：device-run 必带 run+协议；manual-instrument 可带 upstreamRunId 补链）', {
    origin: z.enum(['device-run', 'manual-instrument']),
    runId: z.string().optional(), protocolId: z.string().optional(), protocolVersion: z.number().int().optional(),
    deviceId: z.string(), projectId: z.string().optional(),
    summary: z.record(z.unknown()), params: z.record(z.unknown()), at: z.string(),
    filePath: z.string().optional(), upstreamRunId: z.string().optional()
  }, (a) => d.records.resultRegister(ResultRegisterInput.parse(a)));
  t('result_list', '结果列表', { runId: z.string().optional(), projectId: z.string().optional() },
    (a) => ({ results: d.records.resultList(a) }));
  t('result_get', '结果详情（含溯源链）', { id: z.string() }, (a) => d.records.resultGet(a.id));
  t('result_flowback', '结果回流图谱（生成 Result 节点并连 produced 边）',
    { resultId: z.string(), graph: z.string(), runNodeId: z.string(), round: z.number().int().default(1) },
    (a) => d.kag.flowback(d.records, a));

  // —— LabOntology（法度）——
  t('ontology_get', '查看本体词汇、约束与过程规则', {}, () => d.ontology.get());
  t('ontology_check', '预检意图是否合规（事前引导，优于事后被拦）',
    { reagents: z.array(z.string()).default([]), params: z.record(z.unknown()).default({}) },
    (a) => d.ontology.check(a));
}
