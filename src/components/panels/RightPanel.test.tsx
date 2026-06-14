import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { sc } from '../../services/scicompassClient';
import { RightPanel } from './RightPanel';

afterEach(() => vi.restoreAllMocks());
const project = { id: 'p1', spaceId: 's', name: 't', objective: 'o', graphSlug: 'g1' } as never;
const ctx = <aside aria-label="任务进度与项目上下文">上下文内容</aside>;

it('默认显示上下文标签，切到文献加载真实文献', async () => {
  vi.spyOn(sc, 'literatureSearch').mockResolvedValue({ hits: [{ id: 'l1', title: '真实文献' }] });
  render(<RightPanel project={project} contextTab={ctx} />);
  expect(screen.getByText('上下文内容')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('tab', { name: '文献' }));
  expect(await screen.findByText('真实文献')).toBeInTheDocument();
});
