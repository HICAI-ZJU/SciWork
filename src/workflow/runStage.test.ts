import { afterEach, expect, it, vi } from 'vitest';
import { sc } from '../services/scicompassClient';
import { createEmptyArtifacts, runStage } from './runStage';
import type { Project } from '../domain/types';

const project: Project = { id: 'p1', spaceId: 'fudan-xtalpi', name: '测试', objective: '温和偶联', graphSlug: 'g1' };
const base = { project, literature: [], artifacts: createEmptyArtifacts(), constraint: '' };
afterEach(() => vi.restoreAllMocks());

it('literature 阶段调用 literature_import + search 并产出 analysis', async () => {
  vi.spyOn(sc, 'literatureImport').mockResolvedValue({ imported: 1, ids: ['l1'] });
  vi.spyOn(sc, 'literatureSearch').mockResolvedValue({ hits: [{ id: 'l1', title: 'Allene coupling' }] });
  vi.spyOn(sc, 'graphWrite').mockResolvedValue({ written: { nodes: 2, edges: 1 } });
  vi.spyOn(sc, 'graphAlign').mockResolvedValue({ anchors: [{ anchor: 'rxn://x' }], source: 'SciGraph' });
  const out = await runStage('literature', base);
  expect(sc.literatureImport).toHaveBeenCalled();
  expect(sc.literatureSearch).toHaveBeenCalled();
  expect(out.artifacts.analysis?.evidence.length).toBe(1);
});

it('protocol-design 阶段调用 ontology_check 产出 validation', async () => {
  vi.spyOn(sc, 'ontologyCheck').mockResolvedValue({ ok: true, violations: [] });
  const artifacts = {
    ...createEmptyArtifacts(),
    protocol: { id: 'pr1', objective: 'o', reactionSystem: 'rs', reagents: ['pd'], catalysts: [], solvents: [], device: 'dev', parameters: { version: '1' }, steps: [], safetyNotes: [] }
  };
  const out = await runStage('protocol-design', { ...base, artifacts });
  expect(sc.ontologyCheck).toHaveBeenCalled();
  expect(out.artifacts.validation?.status).toBe('pass');
});

it('工具失败时抛出（由上层标记 warning）', async () => {
  vi.spyOn(sc, 'literatureImport').mockRejectedValue(new Error('后端错误'));
  await expect(runStage('literature', base)).rejects.toThrow(/后端错误/);
});

it('缺 graphSlug 时抛出明确错误', async () => {
  const noGraph = { ...base, project: { ...project, graphSlug: undefined } };
  await expect(runStage('literature', noGraph)).rejects.toThrow(/graphSlug/);
});

it('scigraph-analysis 调 insightGenerate 填充 report', async () => {
  vi.spyOn(sc, 'insightGenerate').mockResolvedValue({ generated: true, text: 'AI 报告', items: ['方向一'] });
  const artifacts = {
    ...createEmptyArtifacts(),
    analysis: { entities: [], evidence: [{ id: 'e1', literatureId: 'l1', quote: '—', claim: 'A', confidence: 0 }], publicKnowledge: [] }
  };
  const out = await runStage('scigraph-analysis', { ...base, artifacts });
  expect(sc.insightGenerate).toHaveBeenCalledWith('report', 'g1', '');
  expect(out.artifacts.report?.designRationale).toBe('AI 报告');
  expect(out.artifacts.report?.candidateDirections).toEqual(['方向一']);
});

it('experimental-graph 调 insightGenerate 生成建议', async () => {
  vi.spyOn(sc, 'insightGenerate').mockResolvedValue({ generated: true, text: 'AI 依据', items: ['加大温度梯度', '换溶剂'] });
  const artifacts = {
    ...createEmptyArtifacts(),
    experimentalGraph: { nodes: [{ id: 'n1', type: 'Observation' as const, label: 'x', detail: '' }], edges: [] }
  };
  const out = await runStage('experimental-graph', { ...base, artifacts });
  expect(sc.insightGenerate).toHaveBeenCalledWith('suggestion', 'g1');
  expect(out.artifacts.suggestions?.map((s) => s.label)).toEqual(['加大温度梯度', '换溶剂']);
  expect(out.artifacts.suggestions?.[0].rationale).toBe('AI 依据');
});
