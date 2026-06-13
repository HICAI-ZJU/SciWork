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
