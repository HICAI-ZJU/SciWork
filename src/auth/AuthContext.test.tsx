import { type ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import * as client from '../services/scicompassClient';
import { AuthProvider, useAuth } from './AuthContext';

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;
const ACCOUNT = { username: 'chem.ma', displayName: '麻生明课题组 · 研究员', team: { id: 'team-masm', name: '麻生明课题组' }, space: 'fudan-xtalpi' };
const SPACE = { space: 'fudan-xtalpi', displayName: '复旦晶泰', accentColor: '#2F6BFF', devices: [] };

afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });

it('初始为匿名', () => {
  const { result } = renderHook(() => useAuth(), { wrapper });
  expect(result.current.status).toBe('anonymous');
});

it('login 成功后置为已登录、持久化、并设置 client 空间', async () => {
  vi.spyOn(client, 'login').mockResolvedValue({ account: ACCOUNT, spaceConfig: SPACE });
  const spy = vi.spyOn(client, 'setActiveSpace');
  const { result } = renderHook(() => useAuth(), { wrapper });
  await act(async () => { await result.current.login('chem.ma', 'demo1234'); });
  expect(result.current.status).toBe('authed');
  expect(result.current.account?.space).toBe('fudan-xtalpi');
  expect(spy).toHaveBeenCalledWith('fudan-xtalpi');
  expect(localStorage.getItem('sciwork.auth.v1')).toContain('fudan-xtalpi');
});

it('从 localStorage 恢复登录态并恢复 client 空间', async () => {
  localStorage.setItem('sciwork.auth.v1', JSON.stringify({ account: ACCOUNT, spaceConfig: SPACE }));
  const spy = vi.spyOn(client, 'setActiveSpace');
  const { result } = renderHook(() => useAuth(), { wrapper });
  expect(result.current.status).toBe('authed');
  await waitFor(() => expect(spy).toHaveBeenCalledWith('fudan-xtalpi'));
});

it('logout 清空状态、持久化与 client 空间', async () => {
  localStorage.setItem('sciwork.auth.v1', JSON.stringify({ account: ACCOUNT, spaceConfig: SPACE }));
  const spy = vi.spyOn(client, 'setActiveSpace');
  const { result } = renderHook(() => useAuth(), { wrapper });
  act(() => { result.current.logout(); });
  expect(result.current.status).toBe('anonymous');
  expect(localStorage.getItem('sciwork.auth.v1')).toBeNull();
  expect(spy).toHaveBeenCalledWith(null);
});
