import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { Composer } from './Composer';

type ComposerProps = ComponentProps<typeof Composer>;

function renderComposer(overrides: Partial<ComposerProps> = {}) {
  const props: ComposerProps = {
    activeStageId: 'literature',
    canAdvance: true,
    isRunning: false,
    onRun: vi.fn().mockResolvedValue(undefined),
    workspacePath: 'projects/demo',
    ...overrides
  };
  render(<Composer {...props} />);
  return props;
}

describe('Composer', () => {
  it('loads science skills when the user types a slash', () => {
    renderComposer();

    fireEvent.change(screen.getByRole('textbox', { name: /给 SciWork 发送消息/ }), {
      target: { value: '/' }
    });

    const palette = screen.getByRole('listbox', { name: /科学技能包/ });
    expect(within(palette).getByRole('option', { name: /\/scigraph/i })).toBeInTheDocument();
    expect(within(palette).getByRole('option', { name: /\/report/i })).toBeInTheDocument();
    expect(within(palette).getByRole('option', { name: /\/protocol/i })).toBeInTheDocument();
    expect(within(palette).getByRole('option', { name: /\/labontology/i })).toBeInTheDocument();
    expect(within(palette).getByRole('option', { name: /\/simulate/i })).toBeInTheDocument();
    expect(within(palette).getByRole('option', { name: /\/graph/i })).toBeInTheDocument();
  });

  it('writes the selected slash skill into the composer', () => {
    renderComposer();

    const input = screen.getByRole('textbox', { name: /给 SciWork 发送消息/ });
    fireEvent.change(input, { target: { value: '/' } });
    fireEvent.click(screen.getByRole('option', { name: /\/scigraph/i }));

    expect(input).toHaveValue('/scigraph ');
  });

  it('closes the science skill palette after selecting a slash skill', () => {
    renderComposer();

    const input = screen.getByRole('textbox', { name: /给 SciWork 发送消息/ });
    fireEvent.change(input, { target: { value: '/' } });
    fireEvent.click(screen.getByRole('option', { name: /\/scigraph/i }));

    expect(screen.queryByRole('listbox', { name: /科学技能包/ })).not.toBeInTheDocument();
  });

  it('keeps the science skill palette closed while continuing after a selected command', () => {
    renderComposer();

    const input = screen.getByRole('textbox', { name: /给 SciWork 发送消息/ });
    fireEvent.change(input, { target: { value: '/' } });
    fireEvent.click(screen.getByRole('option', { name: /\/scigraph/i }));
    fireEvent.change(input, { target: { value: '/scigraph analyze literature' } });

    expect(screen.queryByRole('listbox', { name: /科学技能包/ })).not.toBeInTheDocument();
  });

  it('passes the composer text to the workflow run action', () => {
    const { onRun } = renderComposer({ activeStageId: 'report' });

    fireEvent.change(screen.getByRole('textbox', { name: /给 SciWork 发送消息/ }), {
      target: { value: '希望保持温和条件' }
    });
    fireEvent.click(screen.getByRole('button', { name: /设计方案/ }));

    expect(onRun).toHaveBeenCalledWith('希望保持温和条件');
  });

  it('runs the workflow action when Enter is pressed', () => {
    const { onRun } = renderComposer({ activeStageId: 'report' });

    const input = screen.getByRole('textbox', { name: /给 SciWork 发送消息/ });
    fireEvent.change(input, { target: { value: '希望保持温和条件' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onRun).toHaveBeenCalledWith('希望保持温和条件');
  });

  it('does not run from Enter while the skill palette is open', () => {
    const { onRun } = renderComposer();

    const input = screen.getByRole('textbox', { name: /给 SciWork 发送消息/ });
    fireEvent.change(input, { target: { value: '/' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onRun).not.toHaveBeenCalled();
  });

  it('clears the draft after a successful run', async () => {
    renderComposer({ activeStageId: 'report' });

    const input = screen.getByRole('textbox', { name: /给 SciWork 发送消息/ });
    fireEvent.change(input, { target: { value: '希望缩短反应时间' } });
    fireEvent.click(screen.getByRole('button', { name: /设计方案/ }));

    await waitFor(() => expect(input).toHaveValue(''));
  });

  it('selects a model from the toolbar menu', () => {
    renderComposer();

    fireEvent.click(screen.getByRole('button', { name: '模型' }));
    fireEvent.click(screen.getByRole('option', { name: /科学智能体 Lite/ }));

    expect(screen.getByRole('button', { name: '模型' })).toHaveTextContent('科学智能体 Lite');
    expect(screen.queryByRole('listbox', { name: /模型选项/ })).not.toBeInTheDocument();
  });

  it('switches execution authorization from the composer toolbar', () => {
    renderComposer();

    const trigger = screen.getByRole('button', { name: '执行授权' });
    expect(trigger).toHaveTextContent('仅模拟执行');

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('option', { name: /Queue With Approval/ }));

    expect(screen.getByRole('button', { name: '执行授权' })).toHaveTextContent('Queue With Approval');
    expect(screen.queryByRole('listbox', { name: /执行授权选项/ })).not.toBeInTheDocument();
  });

  it('keeps direct physical execution disabled in the demo', () => {
    renderComposer();

    fireEvent.click(screen.getByRole('button', { name: '执行授权' }));
    fireEvent.click(screen.getByRole('option', { name: /直接物理执行/ }));

    expect(screen.getByRole('button', { name: '执行授权' })).toHaveTextContent('仅模拟执行');
    expect(screen.getByRole('listbox', { name: /执行授权选项/ })).toBeInTheDocument();
  });

  it('keeps the run button inert while a workflow action is running', () => {
    const { onRun } = renderComposer({ isRunning: true });

    const button = screen.getByRole('button', { name: /执行中/ });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(onRun).not.toHaveBeenCalled();
  });

  it('prevents duplicate workflow runs while the run action is unresolved', () => {
    let resolveRun: () => void = () => {};
    const onRun = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRun = resolve;
        })
    );
    renderComposer({ onRun });

    const button = screen.getByRole('button', { name: /分析文献/ });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(onRun).toHaveBeenCalledTimes(1);
    resolveRun();
  });
});
