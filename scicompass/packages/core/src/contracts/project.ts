import { z } from 'zod';

export const ProjectCreateInput = z.object({
  name: z.string().min(1),
  objective: z.string().min(1)
});
