import { it, expect } from 'vitest';
import { MockFoundryDriver } from './mockDriver.js';
import type { DeviceProfile } from './schema.js';

const profile: DeviceProfile = {
  id: 'd', name: 'd', kind: 'automated-platform', physicalAvailable: false,
  capabilities: [{
    experimentType: 'reaction-screening',
    parameterSchema: {
      type: 'object', required: ['temperatureC'],
      properties: { temperatureC: { type: 'number', maximum: 150 } }
    },
    constraints: []
  }],
  safetyRules: [], supportedPolicies: ['queue-with-approval']
};

it('validate rejects schema violations', () => {
  const d = new MockFoundryDriver();
  const bad = d.validate(profile, 'reaction-screening', { temperatureC: 999 });
  expect(bad.ok).toBe(false);
  expect(bad.errors[0]).toMatch(/temperatureC|maximum/);
  expect(d.validate(profile, 'no-such-type', {}).errors[0]).toMatch(/experimentType/);
  expect(d.validate(profile, 'reaction-screening', {}).ok).toBe(false); // 缺必填
});

it('plan returns ordered timeline ending with completed transition and a result event', () => {
  const d = new MockFoundryDriver();
  const t0 = Date.parse('2026-06-12T00:00:00Z');
  const ev = d.plan({ runId: 'r1', experimentType: 'reaction-screening', params: { temperatureC: 60 }, startAt: t0 });
  expect(ev[0].transitionTo).toBe('running');
  expect(ev.at(-1)!.transitionTo).toBe('completed');
  expect(ev.some((e) => e.resultSummary)).toBe(true);
  expect(ev.every((e, i) => i === 0 || e.revealAt >= ev[i - 1].revealAt)).toBe(true);
});
