import { z } from 'zod';

export const LiteratureImportInput = z.discriminatedUnion('via', [
  z.object({ via: z.literal('file'), projectId: z.string(), path: z.string(), title: z.string().optional() }),
  z.object({ via: z.literal('doi'), projectId: z.string(), doi: z.string() }),
  z.object({ via: z.literal('bibtex'), projectId: z.string(), bibtex: z.string().min(10) })
]);

export const LiteratureSearchInput = z.object({
  projectId: z.string(),
  q: z.string().min(1),
  limit: z.number().int().max(50).default(10)
});
