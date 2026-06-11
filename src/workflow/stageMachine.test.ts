import { advanceStage, createInitialStageState, markStage, stageDefinitions } from './stageMachine';

describe('workflow stage machine', () => {
  it('defines the full first-round SciWork workflow in order', () => {
    expect(stageDefinitions.map((stage) => stage.id)).toEqual([
      'literature',
      'scigraph-analysis',
      'report',
      'protocol-design',
      'labontology-check',
      'simulation',
      'experimental-graph',
      'next-suggestion'
    ]);
  });

  it('exports stage definitions as readonly workflow order', () => {
    expect(stageDefinitions).toHaveLength(8);

    if (false) {
      // @ts-expect-error stageDefinitions must not expose mutating array methods
      stageDefinitions.push(stageDefinitions[0]);
    }
  });

  it('starts at literature with every later stage not started', () => {
    const state = createInitialStageState();
    expect(state.activeStageId).toBe('literature');
    expect(state.statusByStage.literature).toBe('in-progress');
    expect(state.statusByStage['next-suggestion']).toBe('not-started');
  });

  it('initializes every stage status', () => {
    const state = createInitialStageState();

    expect(state.statusByStage).toEqual({
      literature: 'in-progress',
      'scigraph-analysis': 'not-started',
      report: 'not-started',
      'protocol-design': 'not-started',
      'labontology-check': 'not-started',
      simulation: 'not-started',
      'experimental-graph': 'not-started',
      'next-suggestion': 'not-started'
    });
  });

  it('advances one stage at a time and marks prior stages complete', () => {
    const state = advanceStage(createInitialStageState());
    expect(state.activeStageId).toBe('scigraph-analysis');
    expect(state.statusByStage.literature).toBe('completed');
    expect(state.statusByStage['scigraph-analysis']).toBe('in-progress');
  });

  it('does not mutate the input state when advancing', () => {
    const initialState = createInitialStageState();
    const initialStatuses = { ...initialState.statusByStage };

    const advancedState = advanceStage(initialState);

    expect(advancedState).not.toBe(initialState);
    expect(advancedState.statusByStage).not.toBe(initialState.statusByStage);
    expect(initialState.activeStageId).toBe('literature');
    expect(initialState.statusByStage).toEqual(initialStatuses);
  });

  it('keeps next suggestion active and marks it complete when advancing from final stage', () => {
    const state = createInitialStageState();
    const finalState = {
      activeStageId: 'next-suggestion' as const,
      statusByStage: {
        ...state.statusByStage,
        literature: 'completed' as const,
        'scigraph-analysis': 'completed' as const,
        report: 'completed' as const,
        'protocol-design': 'completed' as const,
        'labontology-check': 'completed' as const,
        simulation: 'completed' as const,
        'experimental-graph': 'completed' as const,
        'next-suggestion': 'in-progress' as const
      }
    };

    const advancedState = advanceStage(finalState);

    expect(advancedState.activeStageId).toBe('next-suggestion');
    expect(advancedState.statusByStage['next-suggestion']).toBe('completed');
  });

  it('marks only the requested stage and preserves the active stage', () => {
    const state = createInitialStageState();
    const markedState = markStage(state, 'labontology-check', 'warning');

    expect(markedState.activeStageId).toBe('literature');
    expect(markedState.statusByStage).toEqual({
      ...state.statusByStage,
      'labontology-check': 'warning'
    });
    expect(state.statusByStage['labontology-check']).toBe('not-started');
  });
});
