import { renderHook, waitFor, act } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useProjectResource } from './useProjectResource';

afterEach(() => vi.restoreAllMocks());

it('加载成功返回 data 并结束 loading', async () => {
  const load = vi.fn().mockResolvedValue([{ id: 'a' }]);
  const { result } = renderHook(() => useProjectResource(load, ['p1']));
  expect(result.current.loading).toBe(true);
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.data).toEqual([{ id: 'a' }]);
  expect(result.current.error).toBeNull();
});

it('加载失败置 error', async () => {
  const load = vi.fn().mockRejectedValue(new Error('后端错误'));
  const { result } = renderHook(() => useProjectResource(load, ['p1']));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.error).toMatch(/后端错误/);
});

it('reload 重新拉取', async () => {
  const load = vi.fn().mockResolvedValue('x');
  const { result } = renderHook(() => useProjectResource(load, ['p1']));
  await waitFor(() => expect(result.current.loading).toBe(false));
  act(() => result.current.reload());
  await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
});
