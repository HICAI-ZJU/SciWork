import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { sc } from '../../services/scicompassClient';
import { LiteraturePanel } from './LiteraturePanel';

afterEach(() => vi.restoreAllMocks());
const project = { id: 'p1', spaceId: 's', name: 't', objective: '温和偶联', graphSlug: 'g1' };

it('渲染真实文献列表', async () => {
  vi.spyOn(sc, 'literatureSearch').mockResolvedValue({ hits: [{ id: 'l1', title: 'Allene coupling' }] });
  render(<LiteraturePanel project={project as never} />);
  expect(await screen.findByText('Allene coupling')).toBeInTheDocument();
});

it('导入 BibTeX 调 literature_import 并刷新', async () => {
  vi.spyOn(sc, 'literatureSearch').mockResolvedValue({ hits: [] });
  const imp = vi.spyOn(sc, 'literatureImport').mockResolvedValue({ imported: 1, ids: ['l9'] });
  render(<LiteraturePanel project={project as never} />);
  fireEvent.change(screen.getByLabelText(/BibTeX/), { target: { value: '@article{x, title={Y}}' } });
  fireEvent.click(screen.getByRole('button', { name: /导入/ }));
  await waitFor(() => expect(imp).toHaveBeenCalledWith('p1', '@article{x, title={Y}}'));
});
