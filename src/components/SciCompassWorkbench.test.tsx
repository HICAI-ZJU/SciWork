import { render, screen } from '@testing-library/react';
import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import { sc } from '../services/scicompassClient';
import { SciCompassWorkbench } from './SciCompassWorkbench';

// jsdom 未实现 scrollIntoView（组件 useEffect 会调用），桩掉以免误报。
beforeAll(() => { Element.prototype.scrollIntoView = vi.fn(); });
afterEach(() => vi.restoreAllMocks());

// 回归：实盘工作台消费的是「空间网关」/health（{spaces,tools}），不是单空间的 {modules}。
// 之前 line 166 读 healthInfo.modules.join 在真实空间网关下 undefined → 崩溃。
it('用空间网关 health 形态渲染不崩溃，显示工具数与空间数', async () => {
  vi.spyOn(sc, 'health').mockResolvedValue({
    ok: true, service: 'scicompass', spaces: ['fudan-xtalpi', 'zju-oasis'], tools: 31
  });
  vi.spyOn(sc, 'deviceList').mockResolvedValue({ devices: [] });
  vi.spyOn(sc, 'projectList').mockResolvedValue({ projects: [] });

  render(<SciCompassWorkbench />);
  const conn = await screen.findByText(/已连接/);
  expect(conn).toHaveTextContent('31 工具');
  expect(conn).toHaveTextContent('2 空间');
});
