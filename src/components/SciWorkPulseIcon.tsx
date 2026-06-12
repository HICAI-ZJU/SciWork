interface SciWorkPulseIconProps {
  className?: string;
  state?: 'idle' | 'active' | 'thinking';
  title?: string;
  tone?: 'dark' | 'light';
}

export function SciWorkPulseIcon({
  className = '',
  state = 'idle',
  title = 'SciWork 外星科研智核',
  tone = 'dark'
}: SciWorkPulseIconProps) {
  const classNames = ['sciwork-pulse-icon', className].filter(Boolean).join(' ');

  return (
    <svg
      aria-label={title}
      className={classNames}
      data-state={state}
      data-tone={tone}
      role="img"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="sciworkAlienBody" cx="45%" cy="36%" r="68%">
          <stop offset="0%" stopColor="#f8fbff" />
          <stop offset="42%" stopColor="#2b8ee8" />
          <stop offset="100%" stopColor="#063a75" />
        </radialGradient>
        <radialGradient id="sciworkAlienCore" cx="50%" cy="44%" r="62%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="48%" stopColor="#6bd8ff" />
          <stop offset="100%" stopColor="#005bac" />
        </radialGradient>
        <linearGradient id="sciworkAlienLine" x1="12" x2="52" y1="12" y2="52">
          <stop stopColor="#cce8ff" />
          <stop offset="0.62" stopColor="#005bac" />
          <stop offset="1" stopColor="#b01f24" />
        </linearGradient>
      </defs>
      <circle className="sciwork-pulse-icon__halo" cx="32" cy="32" r="27" />
      <g className="sciwork-pulse-icon__graph">
        <path d="M17 17 25 11 33 16" />
        <path d="M47 17 39 11 31 16" />
        <path d="M19 18 25 23" />
        <path d="M45 18 39 23" />
        <circle cx="17" cy="17" r="2.4" />
        <circle cx="25" cy="11" r="2.1" />
        <circle cx="39" cy="11" r="2.1" />
        <circle cx="47" cy="17" r="2.4" />
      </g>
      <path className="sciwork-pulse-icon__body" d="M32 15c12.5 0 21 8.8 21 20.5S45.4 54 32 54 11 47.2 11 35.5 19.5 15 32 15Z" />
      <g className="sciwork-pulse-icon__science-orbit">
        <ellipse cx="32" cy="35" rx="15.5" ry="5.8" />
        <ellipse cx="32" cy="35" rx="15.5" ry="5.8" transform="rotate(58 32 35)" />
      </g>
      <circle className="sciwork-pulse-icon__core" cx="32" cy="35" r="7" />
      <g className="sciwork-pulse-icon__face">
        <path d="M23.8 32.5c1.6 1.7 3.3 1.7 4.9 0" />
        <path d="M35.3 32.5c1.6 1.7 3.3 1.7 4.9 0" />
      </g>
      <g className="sciwork-pulse-icon__red-nodes">
        <circle cx="47" cy="17" r="2.4" />
        <circle cx="45" cy="40" r="2" />
      </g>
    </svg>
  );
}
