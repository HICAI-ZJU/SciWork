import { z } from 'zod';

export const ArtifactSaveInput = z.object({
  projectId: z.string(),
  kind: z.enum(['report', 'hypothesis', 'suggestion', 'analysis', 'logbook', 'tool']),
  title: z.string().min(1),
  content: z.string().min(1),
  payload: z.record(z.unknown()).default({}),
  provenance: z.array(z.string()).default([])
});

export const ProtocolSaveInput = z.object({
  projectId: z.string(),
  objective: z.string().min(1),
  payload: z.record(z.unknown())
});

const resultBase = {
  deviceId: z.string(),
  summary: z.record(z.unknown()),
  params: z.record(z.unknown()),
  at: z.string().min(1),
  filePath: z.string().optional(),
  upstreamRunId: z.string().optional(),
  projectId: z.string().optional()
};

// 两档溯源：装置运行结果必须带 run + 协议；仪器手测结果可免，但装置/参数/时间戳必填
export const ResultRegisterInput = z.discriminatedUnion('origin', [
  z.object({
    origin: z.literal('device-run'),
    runId: z.string(),
    protocolId: z.string(),
    protocolVersion: z.number().int(),
    ...resultBase
  }),
  z.object({
    origin: z.literal('manual-instrument'),
    ...resultBase
  })
]);
