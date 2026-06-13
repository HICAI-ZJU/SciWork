import { createRequire } from 'node:module';
import type { ErrorObject } from 'ajv';
import type { DeviceDriver, PlanInput, TimelineEvent } from './driver.js';
import type { DeviceProfile } from './schema.js';

// ajv v8 的 default import 在 NodeNext 下类型不可构造（CJS interop）——用 createRequire 取构造器
const Ajv = createRequire(import.meta.url)('ajv') as typeof import('ajv').default;
const ajv = new Ajv({ allErrors: true });

export class MockFoundryDriver implements DeviceDriver {
  validate(profile: DeviceProfile, experimentType: string, params: Record<string, unknown>) {
    const cap = profile.capabilities.find((c) => c.experimentType === experimentType);
    if (!cap) return { ok: false, errors: [`experimentType not supported: ${experimentType}`] };
    const validate = ajv.compile(cap.parameterSchema as object);
    if (validate(params)) return { ok: true, errors: [] };
    return {
      ok: false,
      errors: (validate.errors ?? []).map((e: ErrorObject) => `${e.instancePath || 'params'} ${e.message}`)
    };
  }

  plan({ params, startAt }: PlanInput): TimelineEvent[] {
    const s = (n: number) => startAt + n * 1000;
    return [
      { seq: 1, revealAt: s(1), label: '进入运行', detail: '装置开始执行', severity: 'info', transitionTo: 'running' },
      { seq: 2, revealAt: s(3), label: '加料完成', detail: JSON.stringify(params), severity: 'info' },
      { seq: 3, revealAt: s(6), label: '在线监测', detail: '转化率上升', severity: 'info' },
      {
        seq: 4, revealAt: s(9), label: '运行完成', detail: '产物收集完毕', severity: 'success',
        transitionTo: 'completed',
        resultSummary: { yield: 0.41, conversion: 0.93, executedBy: 'mock-driver' }
      }
    ];
  }
}
