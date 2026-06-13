import { z } from 'zod';

export const RUN_STATUSES = [
  'awaiting-approval', 'rejected', 'queued', 'running',
  'paused', 'completed', 'failed', 'aborted'
] as const;

export const RunStatus = z.enum(RUN_STATUSES);

export const RunSubmitInput = z.object({
  projectId: z.string(),
  protocolId: z.string(),
  protocolVersion: z.number().int().positive(),
  deviceId: z.string(),
  experimentType: z.string().default('default'),
  mode: z.enum(['simulation', 'physical']),
  params: z.record(z.unknown()).default({})
});

export const RunControlInput = z.object({
  runId: z.string(),
  action: z.enum(['pause', 'resume', 'abort']),
  actor: z.string().min(1)
});

export const RunApproveInput = z.object({
  runId: z.string(),
  decision: z.enum(['approve', 'reject']),
  confirmedBy: z.string().min(1),
  note: z.string().default('')
});
