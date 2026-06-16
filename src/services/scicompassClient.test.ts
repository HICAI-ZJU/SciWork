import { afterEach, expect, it } from 'vitest';
import { callTool, login, sc, setActiveSpace } from './scicompassClient';

afterEach(() => { setActiveSpace(null); });

it('login 成功返回本地演示账号与空间配置', async () => {
  const r = await login('chem.ma', 'demo1234');
  expect(r.account.space).toBe('fudan-xtalpi');
  expect(r.spaceConfig.devices.length).toBeGreaterThan(0);
});

it('login 失败抛出明确错误', async () => {
  await expect(login('chem.ma', 'nope')).rejects.toThrow(/账号或密码错误/);
});

it('projectList 使用当前本地空间上下文', async () => {
  setActiveSpace('fudan-xtalpi');
  const r = await sc.projectList();
  expect(r.projects.length).toBeGreaterThan(0);
  expect(r.projects[0].graphSlug).toMatch(/^prj-/);
});

it('callTool 对未实现工具给出本地服务错误', async () => {
  await expect(callTool('unknown_tool')).rejects.toThrow(/本地 UI 服务未实现/);
});
