import { it, expect, beforeEach } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Library } from './library.js';

let lib: Library;
let home: string;
beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), 'sc-'));
  lib = new Library(home);
});

it('imports bibtex entries and searches via fts', () => {
  const n = lib.import({
    via: 'bibtex', projectId: 'p1', bibtex: `
@article{ma2024, title={Allene Coupling under Mild Conditions}, author={Ma, S.}, year={2024}, journal={JACS}, abstract={Mild allene coupling with low catalyst loading.} }
@article{x2023, title={MOF water stability}, author={X}, year={2023}, journal={Nat}, abstract={Humidity degrades certain linkers.} }`
  });
  expect(n.imported).toBe(2);
  const hits = lib.search({ projectId: 'p1', q: 'allene coupling', limit: 10 });
  expect(hits).toHaveLength(1);
  expect(hits[0].title).toMatch(/Allene/);
});

it('search is project-scoped', () => {
  lib.import({ via: 'bibtex', projectId: 'p1', bibtex: '@article{a, title={Zeolite frameworks}, year={2020} }' });
  expect(lib.search({ projectId: 'p2', q: 'zeolite', limit: 5 })).toHaveLength(0);
});

it('imports file by copying into library dir', () => {
  const src = join(home, 'paper.pdf');
  writeFileSync(src, 'fake-pdf');
  const r = lib.import({ via: 'file', projectId: 'p1', path: src, title: '某论文' });
  expect(lib.get(r.ids[0]).file_path).toContain(join('library', 'p1'));
});

it('doi import registers mock metadata', () => {
  const r = lib.import({ via: 'doi', projectId: 'p1', doi: '10.1000/xyz' });
  expect(lib.get(r.ids[0]).source).toBe('doi(mock)');
});
