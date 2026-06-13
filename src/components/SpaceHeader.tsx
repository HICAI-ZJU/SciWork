import { useAuth } from '../auth/AuthContext';
import './SpaceHeader.css';

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
        <span aria-hidden="true">·</span>
        <span>{account.displayName}</span>
      </div>
      <button type="button" className="space-header__logout" onClick={logout}>登出</button>
    </header>
  );
}
