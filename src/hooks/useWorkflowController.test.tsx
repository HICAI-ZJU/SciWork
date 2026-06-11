import { act, renderHook } from '@testing-library/react';
import { useWorkflowController } from './useWorkflowController';

describe('useWorkflowController', () => {
  it('advances through the full deterministic demo workflow', async () => {
    const { result } = renderHook(() => useWorkflowController());

    expect(result.current.stageState.activeStageId).toBe('literature');
    expect(result.current.isRunning).toBe(false);
    expect(result.current.canAdvance).toBe(true);
    expect(result.current.artifacts.report).toBeNull();
    expect(result.current.artifacts.experimentalGraph).toBeNull();

    await act(async () => {
      await result.current.runNextAction();
    });
    expect(result.current.stageState.activeStageId).toBe('scigraph-analysis');
    expect(result.current.artifacts.analysis?.entities.length).toBeGreaterThan(0);

    await act(async () => {
      await result.current.runNextAction();
      await result.current.runNextAction('prefer mild conditions and shorter reaction time');
      await result.current.runNextAction();
      await result.current.runNextAction();
      await result.current.runNextAction();
      await result.current.runNextAction();
    });

    expect(result.current.stageState.activeStageId).toBe('next-suggestion');
    expect(result.current.canAdvance).toBe(false);
    expect(result.current.artifacts.experimentalGraph?.nodes.some((node) => node.type === 'NextSuggestion')).toBe(true);
    expect(result.current.artifacts.suggestions.length).toBeGreaterThan(0);
  });

  it('ignores rapid repeated actions while the first stage action is running', async () => {
    const { result } = renderHook(() => useWorkflowController());

    await act(async () => {
      const firstRun = result.current.runNextAction();
      const repeatedRun = result.current.runNextAction();

      await Promise.all([firstRun, repeatedRun]);
    });

    expect(result.current.stageState.activeStageId).toBe('scigraph-analysis');
    expect(result.current.artifacts.analysis?.entities.length).toBeGreaterThan(0);
    expect(result.current.artifacts.report).toBeNull();
    expect(result.current.isRunning).toBe(false);
    expect(result.current.canAdvance).toBe(true);
  });
});
