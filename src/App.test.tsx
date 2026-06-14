import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './auth/AuthContext';
import { App } from './App';

const SESSION = {
  account: { username: 'chem.ma', displayName: '麻生明课题组 · 研究员', team: { id: 'team-masm', name: '麻生明课题组' }, space: 'fudan-xtalpi' },
  spaceConfig: { space: 'fudan-xtalpi', displayName: '复旦晶泰自动化工作站', domain: '化学反应', accentColor: '#2F6BFF', devices: [{ id: 'dev-xtalpi', name: '晶泰工作站', kind: 'automated-platform' }] }
};

// 模拟 /api/call：按工具名返回数据。
function mockGateway(byTool: Record<string, unknown> = {}) {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
    const name = init?.body ? JSON.parse(init.body as string).name : '';
    const data = name in byTool ? byTool[name] : {};
    return new Response(JSON.stringify({ ok: true, data }), { status: 200 });
  });
}
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
    mockGateway({ project_list: { projects: [] } });
    renderAuthed();
    expect(await screen.findByRole('button', { name: /登出/ })).toBeInTheDocument();
    expect(screen.getAllByText('复旦晶泰自动化工作站').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByRole('heading', { name: /SciWork 科学发现工作站/ })).not.toBeInTheDocument();
  });
});

describe('数据面板', () => {
  it('登录后从真实后端加载项目列表', async () => {
    mockGateway({ project_list: { projects: [{ id: 'p-real-1', name: '真实联烯项目', objective: 'o', graphSlug: 'g1' }] } });
    renderAuthed();
    expect((await screen.findAllByText('真实联烯项目')).length).toBeGreaterThan(0);
  });
});

describe('工作流接真实后端', () => {
  it('登录后点「分析文献」真实调用后端并显示结果', async () => {
    mockGateway({
      project_list: { projects: [{ id: 'p1', name: '真实项目', objective: 'o', graphSlug: 'g1' }] },
      literature_import: { imported: 2, ids: ['l1', 'l2'] },
      literature_search: { hits: [{ id: 'l1', title: 'A' }] },
      graph_write: { written: { nodes: 2, edges: 1 } },
      graph_align_public: { anchors: [], source: 'SciGraph' }
    });
    renderAuthed();
    fireEvent.click(await screen.findByRole('button', { name: /分析文献/ }));
    expect(await screen.findByText(/已导入 2 篇/)).toBeInTheDocument();
  });
});
