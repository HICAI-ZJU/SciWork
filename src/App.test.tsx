import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './auth/AuthContext';
import { App } from './App';

const SESSION = {
  account: { username: 'chem.ma', displayName: '麻生明课题组 · 研究员', team: { id: 'team-masm', name: '麻生明课题组' }, space: 'fudan-xtalpi' },
  spaceConfig: { space: 'fudan-xtalpi', displayName: '复旦晶泰自动化工作站', domain: '化学反应', accentColor: '#2F6BFF', devices: [{ id: 'dev-xtalpi', name: '晶泰工作站', kind: 'automated-platform' }] }
};

function renderAuthed() {
  localStorage.setItem('sciwork.auth.v1', JSON.stringify(SESSION));
  return render(<AuthProvider><App /></AuthProvider>);
}

afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });

describe('门控', () => {
  it('匿名时显示登录页', () => {
    render(<AuthProvider><App /></AuthProvider>);
    expect(screen.getByRole('heading', { name: /SciWork 科学发现工作站/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/账号/)).toBeInTheDocument();
  });

  it('已登录时显示对应空间身份与登出，不再显示登录页', async () => {
    renderAuthed();
    expect(await screen.findByRole('button', { name: /登出/ })).toBeInTheDocument();
    expect(screen.getAllByText('复旦晶泰自动化工作站').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByRole('heading', { name: /SciWork 科学发现工作站/ })).not.toBeInTheDocument();
  });
});
