import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { sc } from '../services/scicompassClient';
import { useWorkflowController } from './useWorkflowController';
import type { Project } from '../domain/types';

const project: Project = { id: 'p1', spaceId: 'fudan-xtalpi', name: 't', objective: '温和偶联', graphSlug: 'g1' };

// 工作流逐阶段调用真实 sc.*；测试里全部 mock，断言阶段机推进与守卫逻辑。
function mockBackend() {
  vi.spyOn(sc, 'literatureImport').mockResolvedValue({ imported: 1, ids: ['l1'] });
  vi.spyOn(sc, 'literatureSearch').mockResolvedValue({ hits: [{ id: 'l1', title: 'A' }] });
  vi.spyOn(sc, 'graphWrite').mockResolvedValue({ written: { nodes: 2, edges: 1 } });
  vi.spyOn(sc, 'graphAlign').mockResolvedValue({ anchors: [{ anchor: 'x' }], source: 'SciGraph' });
  vi.spyOn(sc, 'graphQuery').mockResolvedValue({ nodes: [{ id: 'ev1', type: 'LiteratureEvidence', label: 'A', detail: '' }], edges: [] });
  vi.spyOn(sc, 'protocolSave').mockResolvedValue({ id: 'pr1', version: 1 });
  vi.spyOn(sc, 'ontologyCheck').mockResolvedValue({ ok: true, violations: [] });
  vi.spyOn(sc, 'runSubmit').mockResolvedValue({ runId: 'run1', status: 'completed' });
  vi.spyOn(sc, 'runStatus').mockResolvedValue({ runId: 'run1', status: 'completed', newEvents: [] });
  vi.spyOn(sc, 'resultList').mockResolvedValue({ results: [] });
  vi.spyOn(sc, 'insightGenerate').mockResolvedValue({ generated: false, text: '', items: [] });
}

afterEach(() => vi.restoreAllMocks());

describe('useWorkflowController（接真实后端）', () => {
  it('逐阶段推进直到 next-suggestion', async () => {
    mockBackend();
    const { result } = renderHook(() => useWorkflowController({ project, literature: [] }));

    expect(result.current.stageState.activeStageId).toBe('literature');
    expect(result.current.artifacts.report).toBeNull();

    await act(async () => { await result.current.runNextAction(); });
    expect(result.current.stageState.activeStageId).toBe('scigraph-analysis');
    expect(result.current.artifacts.analysis?.evidence.length).toBeGreaterThan(0);

    await act(async () => {
      await result.current.runNextAction();
      await result.current.runNextAction();
      await result.current.runNextAction();
      await result.current.runNextAction();
      await result.current.runNextAction();
      await result.current.runNextAction();
    });

    expect(result.current.stageState.activeStageId).toBe('next-suggestion');
    expect(result.current.canAdvance).toBe(false);
    expect(result.current.artifacts.suggestions.length).toBeGreaterThan(0);
  });

  it('运行中忽略重复触发，不跳阶段', async () => {
    mockBackend();
    const { result } = renderHook(() => useWorkflowController({ project, literature: [] }));

    await act(async () => {
      const firstRun = result.current.runNextAction();
      const repeatedRun = result.current.runNextAction();
      await Promise.all([firstRun, repeatedRun]);
    });

    expect(result.current.stageState.activeStageId).toBe('scigraph-analysis');
    expect(result.current.artifacts.report).toBeNull();
    expect(result.current.isRunning).toBe(false);
    expect(result.current.canAdvance).toBe(true);
  });
});
