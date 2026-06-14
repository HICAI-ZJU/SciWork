import { useEffect, useState, type FormEvent } from 'react';
import { Lock, UserRound } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { themeAssets } from '../theme/assets';
import './LoginPage.css';

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // 知识图谱背景：随机起始，每 8s 交叉淡入轮换到另一张。
  const backgrounds = themeAssets.loginBackgrounds;
  const [bgIndex, setBgIndex] = useState(() => Math.floor(Math.random() * backgrounds.length));
  useEffect(() => {
    if (backgrounds.length < 2) return;
    const timer = setInterval(() => {
      setBgIndex((current) => {
        let next = current;
        while (next === current) next = Math.floor(Math.random() * backgrounds.length);
        return next;
      });
    }, 8000);
    return () => clearInterval(timer);
  }, [backgrounds.length]);

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

  return (
    <div className="login-shell">
      <div className="login-bg" aria-hidden="true">
        {backgrounds.map((src, i) => (
          <div
            key={src}
            className={i === bgIndex ? 'login-bg__layer is-active' : 'login-bg__layer'}
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
        <div className="login-bg__veil" />
        <div className="login-bg__grid" />
      </div>

      <main className="login-card" aria-label="登录">
        <div className="login-logo-wrap">
          <span className="login-logo-halo" aria-hidden="true" />
          <img className="login-logo" src={themeAssets.logo} alt="SciWork 求是智核" />
        </div>
        <h1>SciWork 科学发现工作站</h1>
        <p className="login-sub">四套自动化科学装置 · 四个科学发现空间</p>

        <form onSubmit={onSubmit}>
          <div className="login-field">
            <UserRound size={16} aria-hidden="true" />
            <input
              name="username"
              aria-label="账号"
              placeholder="账号"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="login-field">
            <Lock size={16} aria-hidden="true" />
            <input
              name="password"
              type="password"
              aria-label="密码"
              placeholder="密码"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="login-error" role="alert">{error}</p>}
          <button type="submit" disabled={busy || !username || !password}>
            <span>{busy ? '登录中…' : '进入空间'}</span>
          </button>
        </form>
      </main>
    </div>
  );
}
