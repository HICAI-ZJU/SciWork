import type { DeviceProfile } from './schema.js';

export interface TimelineEvent {
  seq: number;
  revealAt: number; // 绝对毫秒时间戳：时间线物化，查询时惰性揭示
  label: string;
  detail: string;
  severity: 'info' | 'warning' | 'success';
  transitionTo?: 'running' | 'completed' | 'failed';
  resultSummary?: Record<string, unknown>;
}

export interface PlanInput {
  runId: string;
  experimentType: string;
  params: Record<string, unknown>;
  startAt: number;
}

// DeviceDriver = SCP/装置 MCP 的本地投影。
// v0.1：MockFoundryDriver；换真 = 同接口的下游装置 MCP client（mcpDriver）。
export interface DeviceDriver {
  validate(profile: DeviceProfile, experimentType: string, params: Record<string, unknown>):
    { ok: boolean; errors: string[] };
  plan(input: PlanInput): TimelineEvent[];
}
