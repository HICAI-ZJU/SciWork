import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RunSubmitInput, RunControlInput, RunApproveInput } from '@scicompass/core';
import type { DeviceRegistry, RunService } from '@scicompass/labharness';

interface Deps { devices: DeviceRegistry; runs: RunService }

const ok = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data) }] });
const fail = (e: unknown) => ({
  isError: true,
  content: [{ type: 'text' as const, text: String((e as Error)?.message ?? e) }]
});
const wrap = (fn: (args: any) => unknown) => async (args: any) => {
  try { return ok(await fn(args)); } catch (e) { return fail(e); }
};

// 特权入口：装置与运行。单独挂载、单独授权——治理不可旁路。
export function registerHarness(s: McpServer, d: Deps) {
  const t = (name: string, desc: string, shape: z.ZodRawShape, fn: (a: any) => unknown) =>
    s.tool(name, desc, shape, wrap(fn));

  t('device_list', '装置与仪器清单（本空间可见集）', {}, () => ({ devices: d.devices.list() }));
  t('device_get_profile', '装置 Profile：能力、参数 schema、安全规则、成员仪器',
    { id: z.string() }, (a) => d.devices.getProfile(a.id));
  t('run_validate', '提交前校验参数（无副作用预检）',
    { deviceId: z.string(), experimentType: z.string(), params: z.record(z.unknown()) },
    (a) => d.runs.validate(a));
  t('run_submit', '提交运行。mode=physical 必停 awaiting-approval 等待人工批准',
    RunSubmitInput.shape, (a) => d.runs.submit(a));
  t('run_status', '查询状态与新事件（时间线惰性推进）', { runId: z.string() }, (a) => d.runs.status(a.runId));
  t('run_list', '运行列表', { projectId: z.string().optional() }, (a) => ({ runs: d.runs.list(a) }));
  t('run_control', '暂停/恢复/中止（写审计）', RunControlInput.shape, (a) => d.runs.control(a));
  t('run_approve', '审批运行——仅限人类明确指令下调用，confirmed_by 必填（写审计）',
    RunApproveInput.shape, (a) => d.runs.approve(a));
}
