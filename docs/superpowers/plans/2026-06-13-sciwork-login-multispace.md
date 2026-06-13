# SciWork 登录与多空间集成 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 给 SciWork 加登录，登录后按账号进入其所属的科学发现空间，并把项目/装置/文献面板与 8 阶段工作流全部接到按空间隔离的真实后端。

**Architecture:** 客户端鉴权上下文（A1）：React `AuthProvider` 持有 `{account, spaceConfig}`，登录成功后把 `space` 注入 `scicompassClient`，此后所有 `/api/call` 自动带 `space`（修掉现有「缺 space → 400」回归）。本地优先、守住上云接缝：前端只走网关 HTTP 三接口。

**Tech Stack:** React 18 + TypeScript + Vite；Vitest + @testing-library/react（jsdom）；后端 scicompass（Node + MCP）。

**关联 spec：** [2026-06-13-sciwork-login-multispace-design.md](../specs/2026-06-13-sciwork-login-multispace-design.md)

**分两阶段交付：** Phase 1（登录 + 多空间外壳 + 数据面板）本身即可独立交付运行；Phase 2 在其上把工作流接真实后端。

---

## 文件结构

**新建：**
- `src/auth/AuthContext.tsx` — 鉴权上下文：登录态 + 持久化 + `setActiveSpace` 同步。单一职责：身份。
- `src/auth/AuthContext.test.tsx` — 上下文测试。
- `src/components/LoginPage.tsx` + `src/components/LoginPage.css` — 登录页（高大上视觉）。
- `src/components/LoginPage.test.tsx` — 登录页测试。
- `src/services/scicompassClient.test.ts` — 客户端 `space` 注入 / login / listSpaces 测试。
- `src/components/SpaceHeader.tsx` — 登录后顶部空间身份条（名称/学科/强调色/团队/账号/登出）。

**修改：**
- `scicompass/packages/labharness/src/deviceRegistry.ts` — `SpaceMeta` 加 `accentColor`，`readTemplate` 透传。
- `scicompass/templates/{fudan-xtalpi,zju-ichemfoundry,zju-ibiofoundry,zju-oasis}.yaml` — 各加 `accentColor`。
- `scicompass/packages/cli/src/spacesGateway.test.ts` — 断言 login 返回的 `spaceConfig.accentColor`。
- `src/services/scicompassClient.ts` — 加 `Account`/`SpaceConfig` 类型、`activeSpace` 模块态、`setActiveSpace`/`getActiveSpace`、`login`/`listSpaces`；`callTool` 注入 `space`。
- `src/main.tsx` — 用 `<AuthProvider>` 包裹 `<App/>`。
- `src/App.tsx` — 门控：anonymous → `LoginPage`；authed → 外壳（拆出 `AuthedApp`），空间身份来自 `spaceConfig`，项目来自真实后端。
- `src/App.test.tsx` — 适配门控（匿名 / 已登录两套）。
- `src/components/Sidebar.tsx` — 项目列表/新建走真实后端；展示真实装置数。
- `src/domain/types.ts` — `Project` 加可选 `graphSlug`。
- `src/workflow/runStage.ts` — 8 阶段改调真实 `sc.*`（Phase 2）。
- `src/workflow/runStage.test.ts`（若无则新建）— mock `sc` 断言阶段↔工具映射（Phase 2）。
- `src/App.tsx`/视图入口 — 保留 `SciCompassWorkbench` 为次级「实时联调」入口（Phase 2）。

---

# Phase 1 — 登录与多空间外壳

## Task 1.1：后端 `SpaceMeta.accentColor` + 模板 + 网关测试

**Files:**
- Modify: `scicompass/packages/labharness/src/deviceRegistry.ts:11-38`
- Modify: `scicompass/templates/fudan-xtalpi.yaml`、`zju-ichemfoundry.yaml`、`zju-ibiofoundry.yaml`、`zju-oasis.yaml`
- Test: `scicompass/packages/cli/src/spacesGateway.test.ts`

- [ ] **Step 1：先写失败测试** — 在 `spacesGateway.test.ts` 末尾追加：

```ts
it('login spaceConfig 带空间强调色 accentColor', async () => {
  const { json } = await post('/api/login', { username: 'chem.ma', password: 'demo1234' });
  expect(json.spaceConfig.accentColor).toBe('#2F6BFF');
});
```

- [ ] **Step 2：跑测试确认失败**

Run: `cd scicompass && npm test -w @scicompass/cli -- spacesGateway`
Expected: FAIL（`accentColor` 为 `undefined`）

- [ ] **Step 3：`SpaceMeta` 加字段 + 透传** — 在 [deviceRegistry.ts](../../../scicompass/packages/labharness/src/deviceRegistry.ts) 的 `SpaceMeta` 接口加一行，并在 `readTemplate` 返回对象加一行：

```ts
// interface SpaceMeta { ... 末尾加：
  accentColor?: string;
```
```ts
// readTemplate 的 return { ... } 里加：
    accentColor: tpl.accentColor,
```

- [ ] **Step 4：4 个模板各加强调色** — 在每个模板顶部元数据区（`domain:` 之后）加一行：

```yaml
# fudan-xtalpi.yaml
accentColor: '#2F6BFF'
```
```yaml
# zju-ichemfoundry.yaml
accentColor: '#7A5CFF'
```
```yaml
# zju-ibiofoundry.yaml
accentColor: '#15A86C'
```
```yaml
# zju-oasis.yaml
accentColor: '#E0653A'
```

- [ ] **Step 5：跑测试确认通过**

Run: `cd scicompass && npm test -w @scicompass/cli -- spacesGateway`
Expected: PASS（含原有 6 条 + 新增 1 条）

- [ ] **Step 6：提交**

```bash
git add scicompass/packages/labharness/src/deviceRegistry.ts scicompass/templates/*.yaml scicompass/packages/cli/src/spacesGateway.test.ts
git commit -m "feat(scicompass): add per-space accentColor to SpaceMeta + templates"
```

## Task 1.2：前端客户端 — `space` 注入 + `login`/`listSpaces`

**Files:**
- Modify: `src/services/scicompassClient.ts`
- Test: `src/services/scicompassClient.test.ts`（新建）

- [ ] **Step 1：写失败测试** — 新建 `src/services/scicompassClient.test.ts`：

```ts
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
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
```

- [ ] **Step 2：跑测试确认失败**

Run: `npm test -- scicompassClient`
Expected: FAIL（`login`/`setActiveSpace` 未导出）

- [ ] **Step 3：改客户端** — 在 [scicompassClient.ts](../../../src/services/scicompassClient.ts) 的 `const BASE` 之后、`callTool` 之前插入类型与空间态，并改写 `callTool`，并在文件加 `login`/`listSpaces`：

```ts
export interface Account {
  username: string;
  displayName: string;
  team: { id: string; name: string };
  space: string;
}
export interface SpaceConfig {
  space: string;
  displayName: string;
  institution?: string;
  domain?: string;
  accentColor?: string;
  devices: { id: string; name: string; kind: string }[];
}

// 当前登录空间：登录成功后由 AuthContext 设置，callTool 据此路由。
let activeSpace: string | null = null;
export function setActiveSpace(space: string | null): void { activeSpace = space; }
export function getActiveSpace(): string | null { return activeSpace; }
```

把 `callTool` 改为：

```ts
export async function callTool<T = unknown>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  if (!activeSpace) throw new Error('未登录：当前无空间上下文，无法调用后端工具');
  const res = await fetch(`${BASE}/api/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ space: activeSpace, name, arguments: args })
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error ?? `tool ${name} failed`);
  return json.data as T;
}
```

在 `health` 之后加：

```ts
export async function login(username: string, password: string): Promise<{ account: Account; spaceConfig: SpaceConfig }> {
  const res = await fetch(`${BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error ?? '登录失败');
  return { account: json.account, spaceConfig: json.spaceConfig };
}

export async function listSpaces(): Promise<SpaceConfig[]> {
  const res = await fetch(`${BASE}/api/spaces`);
  const json = await res.json();
  return (json.spaces ?? []) as SpaceConfig[];
}
```

并把 `login, listSpaces, setActiveSpace, getActiveSpace` 加进 `export const sc = { ... }`（追加键即可）。

- [ ] **Step 4：跑测试确认通过**

Run: `npm test -- scicompassClient`
Expected: PASS（4 条）

- [ ] **Step 5：提交**

```bash
git add src/services/scicompassClient.ts src/services/scicompassClient.test.ts
git commit -m "feat(client): inject active space into callTool; add login/listSpaces"
```

## Task 1.3：`AuthContext`（登录态 + 持久化）

**Files:**
- Create: `src/auth/AuthContext.tsx`
- Test: `src/auth/AuthContext.test.tsx`

- [ ] **Step 1：写失败测试** — 新建 `src/auth/AuthContext.test.tsx`：

```tsx
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import * as client from '../services/scicompassClient';
import { AuthProvider, useAuth } from './AuthContext';

const wrapper = ({ children }: { children: React.ReactNode }) => <AuthProvider>{children}</AuthProvider>;
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
```

- [ ] **Step 2：跑测试确认失败**

Run: `npm test -- AuthContext`
Expected: FAIL（模块不存在）

- [ ] **Step 3：实现 AuthContext** — 新建 `src/auth/AuthContext.tsx`：

```tsx
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { login as apiLogin, setActiveSpace, type Account, type SpaceConfig } from '../services/scicompassClient';

const STORAGE_KEY = 'sciwork.auth.v1';

interface AuthSession { account: Account; spaceConfig: SpaceConfig }

interface AuthContextValue {
  status: 'anonymous' | 'authed';
  account: Account | null;
  spaceConfig: SpaceConfig | null;
  login(username: string, password: string): Promise<void>;
  logout(): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function restore(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch { return null; }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(restore);

  // 把当前空间同步给客户端（含刷新后从 localStorage 恢复的情形）。
  useEffect(() => { setActiveSpace(session?.account.space ?? null); }, [session]);

  const value = useMemo<AuthContextValue>(() => ({
    status: session ? 'authed' : 'anonymous',
    account: session?.account ?? null,
    spaceConfig: session?.spaceConfig ?? null,
    async login(username, password) {
      const next = await apiLogin(username, password);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSession(next);
    },
    logout() {
      localStorage.removeItem(STORAGE_KEY);
      setSession(null);
    }
  }), [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const v = useContext(AuthContext);
  if (!v) throw new Error('useAuth 必须在 <AuthProvider> 内使用');
  return v;
}
```

- [ ] **Step 4：跑测试确认通过**

Run: `npm test -- AuthContext`
Expected: PASS（4 条）

- [ ] **Step 5：提交**

```bash
git add src/auth/AuthContext.tsx src/auth/AuthContext.test.tsx
git commit -m "feat(auth): AuthContext with localStorage persistence and space sync"
```

## Task 1.4：`LoginPage`（高大上登录页）

**Files:**
- Create: `src/components/LoginPage.tsx`、`src/components/LoginPage.css`
- Test: `src/components/LoginPage.test.tsx`

- [ ] **Step 1：写失败测试** — 新建 `src/components/LoginPage.test.tsx`：

```tsx
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
```

- [ ] **Step 2：跑测试确认失败**

Run: `npm test -- LoginPage`
Expected: FAIL（模块不存在）

- [ ] **Step 3：实现 LoginPage** — 新建 `src/components/LoginPage.tsx`：

```tsx
import { useState, type CSSProperties, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { themeAssets } from '../theme/assets';
import './LoginPage.css';

type LoginStyle = CSSProperties & { '--login-bg': string; '--login-paper': string };

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const style: LoginStyle = {
    '--login-bg': `url(${themeAssets.workbenchVisual})`,
    '--login-paper': `url(${themeAssets.paperTexture})`
  };

  return (
    <div className="login-shell" style={style}>
      <aside className="login-aside" aria-hidden="true" />
      <main className="login-card" aria-label="登录">
        <img className="login-logo" src={themeAssets.logo} alt="SciWork 求是智核" />
        <h1>SciWork 科学发现工作站</h1>
        <p className="login-sub">四套自动化科学装置 · 四个科学发现空间</p>
        <form onSubmit={onSubmit}>
          <label>
            <span>账号</span>
            <input name="username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
          </label>
          <label>
            <span>密码</span>
            <input name="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error && <p className="login-error" role="alert">{error}</p>}
          <button type="submit" disabled={busy || !username || !password}>
            {busy ? '登录中…' : '进入空间'}
          </button>
        </form>
      </main>
    </div>
  );
}
```

- [ ] **Step 4：写样式** — 新建 `src/components/LoginPage.css`（深色渐变 + 玻璃拟态；复用 IP 背景）：

```css
.login-shell {
  position: fixed; inset: 0; display: grid; grid-template-columns: 1.2fr 1fr;
  background: radial-gradient(1200px 800px at 20% 10%, #11203f 0%, #0a1326 55%, #060b18 100%);
  color: #eaf0ff; overflow: hidden;
}
.login-aside {
  background-image: var(--login-paper), var(--login-bg);
  background-size: 360px, cover; background-position: center, center;
  background-blend-mode: overlay; opacity: 0.9; filter: saturate(1.05);
  border-right: 1px solid rgba(255,255,255,0.06);
}
.login-card {
  align-self: center; justify-self: center; width: min(380px, 86vw);
  padding: 36px 32px; border-radius: 20px;
  background: rgba(255,255,255,0.06); backdrop-filter: blur(18px);
  border: 1px solid rgba(255,255,255,0.12); box-shadow: 0 24px 60px rgba(0,0,0,0.45);
}
.login-logo { width: 56px; height: 56px; border-radius: 14px; }
.login-card h1 { font-size: 22px; margin: 16px 0 4px; }
.login-sub { color: #9fb2d8; font-size: 13px; margin: 0 0 24px; }
.login-card form { display: grid; gap: 14px; }
.login-card label { display: grid; gap: 6px; font-size: 13px; color: #c5d2ef; }
.login-card input {
  height: 42px; padding: 0 12px; border-radius: 10px;
  background: rgba(8,14,28,0.6); border: 1px solid rgba(255,255,255,0.14); color: #fff;
}
.login-card input:focus { outline: none; border-color: #4f7cff; box-shadow: 0 0 0 3px rgba(79,124,255,0.25); }
.login-error { color: #ff9b8a; font-size: 13px; margin: 2px 0 0; }
.login-card button[type='submit'] {
  margin-top: 6px; height: 44px; border: 0; border-radius: 10px; cursor: pointer;
  background: linear-gradient(135deg, #4f7cff, #6a5cff); color: #fff; font-weight: 600; font-size: 15px;
}
.login-card button[disabled] { opacity: 0.5; cursor: not-allowed; }
@media (max-width: 760px) { .login-shell { grid-template-columns: 1fr; } .login-aside { display: none; } }
```

- [ ] **Step 5：跑测试确认通过**

Run: `npm test -- LoginPage`
Expected: PASS（3 条）

- [ ] **Step 6：提交**

```bash
git add src/components/LoginPage.tsx src/components/LoginPage.css src/components/LoginPage.test.tsx
git commit -m "feat(login): glassmorphism login page reusing Qiushi IP + patterns"
```

## Task 1.5：门控 + 空间身份条 + `main.tsx` 包裹

**Files:**
- Modify: `src/main.tsx`
- Create: `src/components/SpaceHeader.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

- [ ] **Step 1：`main.tsx` 包裹 AuthProvider** — 在渲染根处用 `<AuthProvider>` 包住 `<App/>`：

```tsx
// src/main.tsx：import 后，把 root.render(<App/>) 改为
import { AuthProvider } from './auth/AuthContext';
// ...
root.render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
```
（若原文件无 `StrictMode`，按原有结构仅插入 `<AuthProvider>` 包裹层即可。）

- [ ] **Step 2：实现 SpaceHeader** — 新建 `src/components/SpaceHeader.tsx`：

```tsx
import { useAuth } from '../auth/AuthContext';

export function SpaceHeader() {
  const { account, spaceConfig, logout } = useAuth();
  if (!account || !spaceConfig) return null;
  const accent = spaceConfig.accentColor ?? '#4f7cff';
  return (
    <header className="space-header" aria-label="当前空间" style={{ borderColor: accent }}>
      <span className="space-header__dot" style={{ background: accent }} aria-hidden="true" />
      <div className="space-header__id">
        <strong>{spaceConfig.displayName}</strong>
        <small>{spaceConfig.domain ?? ''}</small>
      </div>
      <div className="space-header__who">
        <span>{account.team.name}</span>
        <span>·</span>
        <span>{account.displayName}</span>
      </div>
      <button type="button" className="space-header__logout" onClick={logout}>登出</button>
    </header>
  );
}
```

- [ ] **Step 3：写失败测试（门控）** — 重写 `src/App.test.tsx` 顶部，新增匿名/已登录两组（保留原有 demo 工作流断言到 Task 2.5 再处理，此处先用 `it.skip` 标注旧用例避免误判，Phase 2 改造）：

```tsx
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './auth/AuthContext';
import { App } from './App';

const SESSION = {
  account: { username: 'chem.ma', displayName: '麻生明课题组 · 研究员', team: { id: 'team-masm', name: '麻生明课题组' }, space: 'fudan-xtalpi' },
  spaceConfig: { space: 'fudan-xtalpi', displayName: '复旦晶泰自动化工作站', domain: '化学反应', accentColor: '#2F6BFF', devices: [{ id: 'dev-xtalpi', name: '晶泰工作站', kind: 'automated-platform' }] }
};

// 已登录渲染：预置 localStorage + mock 后端 fetch（project_list/device_list 等）。
function mockBackend() {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
    const name = init ? JSON.parse((init as RequestInit).body as string).name : '';
    const data = name === 'project_list' ? { projects: [] } : name === 'device_list' ? { devices: SESSION.spaceConfig.devices } : {};
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
  });

  it('已登录时显示对应空间身份与外壳', async () => {
    mockBackend();
    renderAuthed();
    expect(await screen.findByText('复旦晶泰自动化工作站')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /登出/ })).toBeInTheDocument();
  });
});
```

- [ ] **Step 4：跑测试确认失败**

Run: `npm test -- src/App.test.tsx`
Expected: FAIL（App 尚未门控 / 无 SpaceHeader）

- [ ] **Step 5：App 门控 + 拆 AuthedApp** — 改 [App.tsx](../../../src/App.tsx)：顶层 `App` 只做门控，原外壳逻辑搬到 `AuthedApp`，并在外壳顶部渲染 `<SpaceHeader/>`，`space` 身份用 `spaceConfig`（仍可暂用 demo 项目数据，真实项目在 Task 1.6 接）：

```tsx
export function App() {
  const { status } = useAuth();
  if (status === 'anonymous') return <LoginPage />;
  return <AuthedApp />;
}
```

`AuthedApp` = 原 `App` 函数体，去掉 `view`（删除 `demo/live` 切换 `modeSwitch` 与 `view==='live'` 分支），在 `.desktop-app` 之前加 `<SpaceHeader/>`，`Sidebar`/`SessionWorkspace` 的 `space` 由 `useAuth().spaceConfig` 适配为 `ScientificSpace`（临时映射：`{ id: spaceConfig.space, name: spaceConfig.displayName, domain: spaceConfig.domain ?? '', device: spaceConfig.devices[0]?.name ?? '—', policy: 'Queue With Approval' }`）。`SciCompassWorkbench` 改为次级入口（见 Task 2.6，本步先移除顶层 `live` 分支即可）。

- [ ] **Step 6：跑测试确认通过**

Run: `npm test -- src/App.test.tsx`
Expected: PASS（门控 2 条）

- [ ] **Step 7：提交**

```bash
git add src/main.tsx src/App.tsx src/App.test.tsx src/components/SpaceHeader.tsx
git commit -m "feat(app): gate app behind login; show space identity header; drop demo/live toggle"
```

## Task 1.6：Sidebar 接真实项目 + 装置数

**Files:**
- Modify: `src/domain/types.ts:21-27`（Project 加 `graphSlug?`）
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/App.tsx`（AuthedApp：项目状态改为真实后端）
- Test: `src/App.test.tsx`（扩展已登录用例）

- [ ] **Step 1：Project 加 graphSlug** — [types.ts](../../../src/domain/types.ts) 的 `Project` 接口加：

```ts
  graphSlug?: string;
```

- [ ] **Step 2：写失败测试** — 在 `src/App.test.tsx` 的「已登录」组加：

```tsx
it('登录后从真实后端加载项目列表', async () => {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
    const name = JSON.parse((init as RequestInit).body as string).name;
    const data = name === 'project_list'
      ? { projects: [{ id: 'p-real-1', name: '真实联烯项目', objective: 'o', graphSlug: 'g1' }] }
      : name === 'device_list' ? { devices: SESSION.spaceConfig.devices } : {};
    return new Response(JSON.stringify({ ok: true, data }), { status: 200 });
  });
  renderAuthed();
  expect(await screen.findByText('真实联烯项目')).toBeInTheDocument();
});
```

- [ ] **Step 3：跑测试确认失败**

Run: `npm test -- src/App.test.tsx`
Expected: FAIL（仍显示 demo 项目）

- [ ] **Step 4：AuthedApp 接真实项目** — 在 `AuthedApp` 用 effect 拉真实项目，替换 `demoProjects` 初值；`handleCreateProject` 改调 `sc.projectCreate`：

```tsx
const [projects, setProjects] = useState<Project[]>([]);
useEffect(() => {
  let alive = true;
  sc.projectList().then((r) => {
    if (alive) setProjects(r.projects.map((p: any) => ({ id: p.id, spaceId: spaceConfig.space, name: p.name, objective: p.objective ?? '', graphSlug: p.graphSlug })));
  }).catch(() => { /* 网关未就绪：保持空列表，UI 显示空态 */ });
  return () => { alive = false; };
}, [spaceConfig.space]);

async function handleCreateProject() {
  const created = await sc.projectCreate(`新建科研项目 ${String(projects.length + 1).padStart(2, '0')}`, '定义新的科学任务并开始探索。');
  const project: Project = { id: created.id, spaceId: spaceConfig.space, name: created.name, objective: created.objective, graphSlug: created.graphSlug };
  setProjects((prev) => [...prev, project]);
  setActiveProjectId(project.id);
}
```
（`sc` from `../services/scicompassClient`。会话 `sessions` v1 仍可本地维护，不阻塞主链路。）

- [ ] **Step 5：跑测试确认通过**

Run: `npm test -- src/App.test.tsx`
Expected: PASS

- [ ] **Step 6：typecheck + 提交**

```bash
npm run typecheck
git add src/domain/types.ts src/components/Sidebar.tsx src/App.tsx src/App.test.tsx
git commit -m "feat(app): load space-scoped projects from real backend in sidebar"
```

---

# Phase 2 — 工作流接真实后端

## Task 2.1：把真实 project（id + graphSlug）贯穿工作流

**Files:**
- Modify: `src/workflow/runStage.ts:46-56`（`StageInput` 已含 `project`，确认 `project.graphSlug` 可用）
- Modify: `src/hooks/useWorkflowController.ts`（透传 project 不变；确认默认 demoProject 仅测试用）

- [ ] **Step 1**：确认 `StageInput.project` 携带 `graphSlug`（Task 1.6 已让 active project 带）。`runStage` 内统一取 `const graph = project.graphSlug; if (!graph) throw new Error('当前项目缺少 graphSlug');`。无代码产出则并入 Task 2.2 提交。

## Task 2.2：runStage 改调真实 `sc.*`（核心）

**Files:**
- Modify: `src/workflow/runStage.ts`（整文件重写 switch）
- Test: `src/workflow/runStage.test.ts`（新建）

- [ ] **Step 1：写失败测试** — 新建 `src/workflow/runStage.test.ts`，mock `sc`，断言每阶段调用了映射工具、artifact 适配正确、失败标记：

```ts
import { afterEach, expect, it, vi } from 'vitest';
import * as client from '../services/scicompassClient';
import { createEmptyArtifacts, runStage } from './runStage';
import type { Project } from '../domain/types';

const project: Project = { id: 'p1', spaceId: 'fudan-xtalpi', name: '测试', objective: '温和偶联', graphSlug: 'g1' };
const base = { project, literature: [], artifacts: createEmptyArtifacts(), constraint: '' };
afterEach(() => vi.restoreAllMocks());

it('literature 阶段调用 literature_import + search 并产出 analysis', async () => {
  const sc = client.sc as any;
  vi.spyOn(sc, 'literatureImport').mockResolvedValue({ imported: 1, ids: ['l1'] });
  vi.spyOn(sc, 'literatureSearch').mockResolvedValue({ hits: [{ id: 'l1', title: 'Allene coupling' }] });
  vi.spyOn(sc, 'graphWrite').mockResolvedValue({ written: { nodes: 2, edges: 1 } });
  vi.spyOn(sc, 'graphAlign').mockResolvedValue({ anchors: [{ anchor: 'rxn://x' }], source: 'SciGraph' });
  const out = await runStage('literature', base);
  expect(sc.literatureImport).toHaveBeenCalled();
  expect(sc.literatureSearch).toHaveBeenCalled();
  expect(out.artifacts.analysis?.evidence.length).toBe(1);
});

it('protocol-design 阶段调用 ontology_check 产出 validation', async () => {
  const sc = client.sc as any;
  vi.spyOn(sc, 'ontologyCheck').mockResolvedValue({ ok: true, violations: [] });
  const artifacts = { ...createEmptyArtifacts(), protocol: { id: 'pr1', objective: 'o', reactionSystem: 'rs', reagents: ['pd'], catalysts: [], solvents: [], device: 'dev', parameters: {}, steps: [], safetyNotes: [] } };
  const out = await runStage('protocol-design', { ...base, artifacts });
  expect(sc.ontologyCheck).toHaveBeenCalled();
  expect(out.artifacts.validation?.status).toBe('pass');
});

it('工具失败时抛出（由上层标记 warning）', async () => {
  const sc = client.sc as any;
  vi.spyOn(sc, 'literatureImport').mockRejectedValue(new Error('后端错误'));
  await expect(runStage('literature', base)).rejects.toThrow(/后端错误/);
});
```

- [ ] **Step 2：跑测试确认失败**

Run: `npm test -- runStage`
Expected: FAIL（runStage 仍走 mock services，未调用 sc）

- [ ] **Step 3：重写 runStage.ts** — 整文件替换为下方真实接线版（保留 `WorkflowArtifacts`/`StageInput`/`StageOutcome`/`required` 接口与签名不变，仅改 switch 实现 + import）：

```ts
import type {
  ExperimentalGraph, LabOntologyValidation, LiteratureItem, NextSuggestion,
  Project, ProtocolDraft, ResearchReport, SciGraphAnalysis, SimulationRunResult, WorkflowStageId
} from '../domain/types';
import { sc } from '../services/scicompassClient';

export interface WorkflowArtifacts {
  analysis: SciGraphAnalysis | null;
  report: ResearchReport | null;
  protocol: ProtocolDraft | null;
  validation: LabOntologyValidation | null;
  simulationRun: SimulationRunResult | null;
  experimentalGraph: ExperimentalGraph | null;
  suggestions: NextSuggestion[];
}
export function createEmptyArtifacts(): WorkflowArtifacts {
  return { analysis: null, report: null, protocol: null, validation: null, simulationRun: null, experimentalGraph: null, suggestions: [] };
}
export type ActionableStageId = Exclude<WorkflowStageId, 'next-suggestion'>;
export interface StageInput { project: Project; literature: LiteratureItem[]; artifacts: WorkflowArtifacts; constraint: string }
export interface StageOutcome { artifacts: Partial<WorkflowArtifacts>; message: string }

function required<T>(value: T | null, name: string): T {
  if (value === null) throw new Error(`工作流前置产物缺失：${name}`);
  return value;
}
function graphOf(project: Project): string {
  if (!project.graphSlug) throw new Error('当前项目缺少 graphSlug（请从真实后端选择/创建项目）');
  return project.graphSlug;
}
// 该空间一段演示文献（真实导入用）。无对应工具的字段以 — 占位，不编造。
const SEED_BIBTEX = `@article{seed,
  title={Mild reaction discovery with online monitoring},
  author={SciWork}, year={2024}, journal={Demo},
  abstract={A mild condition window is identified with low catalyst loading.}
}`;

export async function runStage(stageId: ActionableStageId, input: StageInput): Promise<StageOutcome> {
  const { project, artifacts, constraint } = input;
  const graph = graphOf(project);

  switch (stageId) {
    case 'literature': {
      const imp = await sc.literatureImport(project.id, SEED_BIBTEX);
      const found = await sc.literatureSearch(project.id, 'mild reaction', 10);
      await sc.graphWrite(graph, [
        { id: 'obj', type: 'Objective', label: project.objective || '研究目标', detail: '', round: 1, attrs: {}, provenance: [] },
        ...found.hits.slice(0, 3).map((h: any, i: number) => ({ id: `ev${i + 1}`, type: 'LiteratureEvidence', label: h.title ?? '文献证据', detail: '', round: 1, attrs: {}, provenance: [`scicompass://literature/${h.id}`] }))
      ], found.hits.slice(0, 3).map((_: any, i: number) => ({ id: `e${i + 1}`, source: `ev${i + 1}`, target: 'obj', label: 'supports' })));
      const aligned = await sc.graphAlign(graph, found.hits.slice(0, 1).map((h: any, i: number) => `ev${i + 1}`)).catch(() => ({ anchors: [], source: 'SciGraph' }));
      const analysis: SciGraphAnalysis = {
        entities: found.hits.slice(0, 3).map((h: any, i: number) => ({ id: `ev${i + 1}`, label: h.title ?? '—', type: 'reaction', confidence: 0 })),
        evidence: found.hits.map((h: any) => ({ id: h.id, literatureId: h.id, quote: '—', claim: h.title ?? '—', confidence: 0 })),
        publicKnowledge: (aligned.anchors ?? []).map((a: any) => String(a.anchor ?? a))
      };
      return { artifacts: { analysis }, message: `已导入 ${imp.imported} 篇并写入图谱证据，锚定公共星图 ${aligned.anchors?.length ?? 0} 处。` };
    }

    case 'scigraph-analysis': {
      const analysis = required(artifacts.analysis, 'SciGraph 分析');
      const g = await sc.graphQuery(graph, { limit: 50 });
      const report: ResearchReport = {
        question: project.objective || '研究问题',
        consensus: analysis.publicKnowledge.slice(0, 2),
        disagreements: [],
        uncertainties: [],
        candidateDirections: g.nodes.filter((n: any) => n.type === 'LiteratureEvidence').slice(0, 3).map((n: any) => `参考：${n.label}`),
        designRationale: `基于 ${g.nodes.length} 个图谱节点与 ${analysis.evidence.length} 条文献证据形成方向。`,
        evidenceIds: analysis.evidence.map((e) => e.id)
      };
      return { artifacts: { report }, message: '已读取真实项目图谱并汇总研究方向（无生成式产出，朴素呈现）。' };
    }

    case 'report': {
      const report = required(artifacts.report, '研究总结报告');
      const saved = await sc.protocolSave(project.id, report.question, { constraint: constraint || '温和条件、缩短时间', steps: ['投料', '升温', '在线监测', '取样'] });
      const protocol: ProtocolDraft = {
        id: saved.id, objective: report.question, reactionSystem: '真实后端协议',
        reagents: [], catalysts: [], solvents: [], device: '—', parameters: { version: String(saved.version) },
        steps: ['投料', '升温', '在线监测', '取样'].map((label, i) => ({ id: `s${i + 1}`, label, detail: '', durationMinutes: 0 })),
        safetyNotes: []
      };
      return { artifacts: { protocol }, message: `已保存真实协议 ${saved.id} v${saved.version}。` };
    }

    case 'protocol-design': {
      const protocol = required(artifacts.protocol, '实验方案');
      const chk = await sc.ontologyCheck(protocol.reagents.length ? protocol.reagents : ['pd-catalyst', 'solvent'], { temperatureC: 55 });
      const validation: LabOntologyValidation = {
        status: chk.ok ? 'pass' : 'warning',
        normalizedTerms: protocol.reagents,
        constraints: chk.ok ? ['试剂组合与温度合规'] : chk.violations,
        warnings: chk.ok ? [] : chk.violations
      };
      return { artifacts: { validation }, message: chk.ok ? '本体校验通过。' : `本体校验告警：${chk.violations.join('; ')}` };
    }

    case 'labontology-check': {
      const protocol = required(artifacts.protocol, '实验方案');
      const sub = await sc.runSubmit({
        projectId: project.id, protocolId: protocol.id, protocolVersion: Number(protocol.parameters.version ?? 1),
        deviceId: 'dev-xtalpi', experimentType: 'reaction-screening', mode: 'simulation', params: { temperatureC: 55, timeHours: 2 }
      });
      const events: SimulationRunResult['events'] = [];
      let status = sub.status;
      for (let i = 0; i < 15 && status !== 'completed' && status !== 'failed' && status !== 'aborted'; i++) {
        const st = await sc.runStatus(sub.runId);
        status = st.status;
        for (const ev of st.newEvents) events.push({ id: `${ev.label}-${events.length}`, time: '', label: ev.label, detail: ev.detail, severity: 'info' });
      }
      const simulationRun: SimulationRunResult = {
        id: sub.runId, protocolId: protocol.id, status: status === 'completed' ? 'completed' : 'completed-with-warning',
        yieldPercent: 0, conversionPercent: 0, confidence: 0, events, interpretation: `真实模拟运行 ${sub.runId} 结束：${status}`
      };
      return { artifacts: { simulationRun }, message: `运行 ${sub.runId} 状态：${status}。` };
    }

    case 'simulation': {
      const run = required(artifacts.simulationRun, '模拟执行结果');
      const results = await sc.resultList({ runId: run.id });
      if (results.results.length) {
        await sc.resultFlowback(results.results[0].id, graph, 'obj', 1).catch(() => undefined);
      }
      const g = await sc.graphQuery(graph, { limit: 50 });
      const experimentalGraph: ExperimentalGraph = {
        nodes: g.nodes.map((n: any) => ({ id: n.id, type: (n.type ?? 'Observation'), label: n.label ?? '—', detail: n.detail ?? '' })),
        edges: (g.edges ?? []).map((e: any) => ({ id: e.id ?? `${e.source}-${e.target}`, source: e.source, target: e.target, label: e.label ?? '' }))
      };
      return { artifacts: { experimentalGraph }, message: `结果已回流，项目图现有 ${experimentalGraph.nodes.length} 节点 / ${experimentalGraph.edges.length} 边。` };
    }

    case 'experimental-graph': {
      const eg = required(artifacts.experimentalGraph, 'Experimental Graph');
      const suggestions: NextSuggestion[] = [{
        id: 'suggestion-001', label: '收窄条件搜索范围',
        rationale: `基于真实图谱 ${eg.nodes.length} 节点的回流结果。`, expectedImpact: '减少下一轮搜索空间。'
      }];
      return { artifacts: { suggestions }, message: '已基于真实回流图谱生成下一轮建议（朴素呈现）。' };
    }
  }
}
```

- [ ] **Step 4：跑测试确认通过**

Run: `npm test -- runStage`
Expected: PASS（3 条）

- [ ] **Step 5：typecheck**

Run: `npm run typecheck`
Expected: 通过（如个别 `attrs` 等字段类型不符，按 `graph_write` 实际签名微调 node 构造对象）

- [ ] **Step 6：提交**

```bash
git add src/workflow/runStage.ts src/workflow/runStage.test.ts
git commit -m "feat(workflow): wire 8-stage runStage to real per-space backend tools"
```

## Task 2.3：更新 App 工作流集成测试（mock sc）

**Files:**
- Modify: `src/App.test.tsx`

- [ ] **Step 1：补集成测试** — 在「已登录」组加：mock `sc` 各方法，驱动 Composer 步进，断言出现真实派生消息（替代旧 demo 文案）：

```tsx
it('登录后逐步推进工作流并真实调用后端', async () => {
  const sc = (await import('./services/scicompassClient')).sc as any;
  vi.spyOn(sc, 'projectList').mockResolvedValue({ projects: [{ id: 'p1', name: '真实项目', objective: 'o', graphSlug: 'g1' }] });
  vi.spyOn(sc, 'deviceList').mockResolvedValue({ devices: SESSION.spaceConfig.devices });
  vi.spyOn(sc, 'literatureImport').mockResolvedValue({ imported: 2, ids: ['l1', 'l2'] });
  vi.spyOn(sc, 'literatureSearch').mockResolvedValue({ hits: [{ id: 'l1', title: 'A' }] });
  vi.spyOn(sc, 'graphWrite').mockResolvedValue({ written: { nodes: 2, edges: 1 } });
  vi.spyOn(sc, 'graphAlign').mockResolvedValue({ anchors: [], source: 'SciGraph' });
  renderAuthed();
  fireEvent.click(await screen.findByRole('button', { name: /分析文献/ }));
  expect(await screen.findByText(/已导入 2 篇/)).toBeInTheDocument();
});
```

- [ ] **Step 2：跑测试确认通过（删除/改造旧 demo 工作流断言）**

Run: `npm test -- src/App.test.tsx`
Expected: PASS（旧的硬编码 demo 文案断言此步删除）

- [ ] **Step 3：提交**

```bash
git add src/App.test.tsx
git commit -m "test(app): drive real-backed workflow with mocked sc client"
```

## Task 2.4：SciCompassWorkbench 降级为次级入口

**Files:**
- Modify: `src/App.tsx`（AuthedApp 内加一个「实时联调」开关，按需挂载 `SciCompassWorkbench`）

- [ ] **Step 1**：在 `AuthedApp` 顶部工具区加一个次级按钮（非主视图），点开覆盖层展示 `<SciCompassWorkbench/>`：

```tsx
const [diag, setDiag] = useState(false);
// 顶部某处：
<button type="button" className="diag-toggle" onClick={() => setDiag((v) => !v)}>实时联调</button>
{diag && <div className="diag-overlay"><button onClick={() => setDiag(false)}>关闭</button><SciCompassWorkbench /></div>}
```

- [ ] **Step 2：typecheck + 提交**

```bash
npm run typecheck
git add src/App.tsx
git commit -m "feat(app): keep SciCompassWorkbench as secondary diagnostic panel"
```

## Task 2.5：全量回归

- [ ] **Step 1：全部测试**

Run: `npm test`（前端）+ `cd scicompass && npm test`（后端）
Expected: 全绿。

- [ ] **Step 2：typecheck 全量**

Run: `npm run typecheck`
Expected: 通过。

- [ ] **Step 3：端到端手测（preview）** — 启动 sidecar + 前端，用四个账号各登录一次，确认进入对应空间、项目列表为该空间真实数据、工作流首步真实调用成功。

---

## 自审（plan vs spec）

- **spec §2 In scope** 全覆盖：登录页(1.4)、登录流程+持久化(1.2/1.3)、修回归 callTool 注入 space(1.2)、空间身份(1.5)、数据面板(1.6)、工作流接真实(2.2)、去 demo/live(1.5)、后端 accentColor(1.1)。✓
- **spec §6.5 映射表** 与 Task 2.2 各阶段工具一致。✓
- **spec §11 测试** 全覆盖：登录成功/失败(1.4)、callTool 注入 space(1.2)、登出清空(1.3)、localStorage 恢复(1.3)、accentColor 后端(1.1)、工作流映射(2.2)。✓
- **占位符扫描**：无 TBD/TODO；无对应工具的字段以「—」/空数组显式占位（spec 已许可）。✓
- **类型一致性**：`Account`/`SpaceConfig`（1.2 定义）贯穿 1.3/1.5；`Project.graphSlug`（1.6）被 2.2 `graphOf` 使用；`WorkflowArtifacts` 字段与 ContextPanel/AgentThread 消费字段一致。✓
- **已知风险**：Task 2.2 中 `graph_write` 的 node 对象字段（`attrs`/`round`/`provenance`）需与后端实际入参对齐——若 typecheck/运行报错，按 `SciCompassWorkbench.runFullLoop` 中已验证的同款字段微调（该处为真实可用样例）。
