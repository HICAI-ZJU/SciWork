import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import * as client from '../services/scicompassClient';
import { AuthProvider } from '../auth/AuthContext';
import { LoginPage } from './LoginPage';

const renderLogin = () => render(<AuthProvider><LoginPage /></AuthProvider>);
afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });

it('渲染标题与账号/密码输入', () => {
  renderLogin();
  expect(screen.getByRole('heading', { name: /SciWork 科学发现工作站/ })).toBeInTheDocument();
  expect(screen.getByLabelText(/账号/)).toBeInTheDocument();
  expect(screen.getByLabelText(/密码/)).toBeInTheDocument();
});

it('提交调用 login', async () => {
  const spy = vi.spyOn(client, 'login').mockResolvedValue({
    account: { username: 'chem.ma', displayName: 'x', team: { id: 't', name: 't' }, space: 'fudan-xtalpi' },
    spaceConfig: { space: 'fudan-xtalpi', displayName: '复旦晶泰', devices: [] }
  });
  renderLogin();
  fireEvent.change(screen.getByLabelText(/账号/), { target: { value: 'chem.ma' } });
  fireEvent.change(screen.getByLabelText(/密码/), { target: { value: 'demo1234' } });
  fireEvent.click(screen.getByRole('button', { name: /进入空间/ }));
  await waitFor(() => expect(spy).toHaveBeenCalledWith('chem.ma', 'demo1234'));
});

it('登录失败显示错误', async () => {
  vi.spyOn(client, 'login').mockRejectedValue(new Error('账号或密码错误'));
  renderLogin();
  fireEvent.change(screen.getByLabelText(/账号/), { target: { value: 'chem.ma' } });
  fireEvent.change(screen.getByLabelText(/密码/), { target: { value: 'bad' } });
  fireEvent.click(screen.getByRole('button', { name: /进入空间/ }));
  expect(await screen.findByRole('alert')).toHaveTextContent('账号或密码错误');
});
