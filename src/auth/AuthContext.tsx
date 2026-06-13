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
  } catch {
    return null;
  }
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
