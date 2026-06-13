import { afterEach, expect, it, vi } from 'vitest';
import { callTool, login, setActiveSpace } from './scicompassClient';

function mockFetchOnce(body: unknown, ok = true) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(body), { status: ok ? 200 : 401 })
  );
}
afterEach(() => { vi.restoreAllMocks(); setActiveSpace(null); });

it('callTool 把当前 space 注入 /api/call 请求体', async () => {
  setActiveSpace('fudan-xtalpi');
  const f = mockFetchOnce({ ok: true, data: { projects: [] } });
  await callTool('project_list');
  const body = JSON.parse((f.mock.calls[0][1] as RequestInit).body as string);
  expect(body.space).toBe('fudan-xtalpi');
  expect(body.name).toBe('project_list');
});

it('未设置 space 时 callTool 抛出明确错误（不静默 400）', async () => {
  await expect(callTool('project_list')).rejects.toThrow(/空间/);
});

it('login 成功返回 account 与 spaceConfig', async () => {
  mockFetchOnce({ ok: true, account: { username: 'chem.ma', displayName: '麻生明课题组 · 研究员', team: { id: 'team-masm', name: '麻生明课题组' }, space: 'fudan-xtalpi' }, spaceConfig: { space: 'fudan-xtalpi', displayName: '复旦晶泰', accentColor: '#2F6BFF', devices: [] } });
  const r = await login('chem.ma', 'demo1234');
  expect(r.account.space).toBe('fudan-xtalpi');
  expect(r.spaceConfig.accentColor).toBe('#2F6BFF');
});

it('login 失败抛出后端 error 文本', async () => {
  mockFetchOnce({ ok: false, error: '账号或密码错误' }, false);
  await expect(login('chem.ma', 'nope')).rejects.toThrow(/账号或密码错误/);
});
