interface SciWorkPulseIconProps {
  className?: string;
  state?: 'idle' | 'active' | 'thinking';
  title?: string;
  tone?: 'dark' | 'light';
}

export function SciWorkPulseIcon({
  className = '',
  state = 'idle',
  title = 'SciWork 求是智核',
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
        <radialGradient id="sciworkQiushiShell" cx="42%" cy="34%" r="68%">
          <stop offset="0%" stopColor="#f8fbff" />
          <stop offset="44%" stopColor="#2b8ee8" />
          <stop offset="100%" stopColor="#063a75" />
        </radialGradient>
        <radialGradient id="sciworkQiushiCore" cx="50%" cy="46%" r="62%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="48%" stopColor="#6bd8ff" />
          <stop offset="100%" stopColor="#005bac" />
        </radialGradient>
        <linearGradient id="sciworkQiushiLine" x1="12" x2="52" y1="12" y2="52">
          <stop stopColor="#cce8ff" />
          <stop offset="0.62" stopColor="#005bac" />
          <stop offset="1" stopColor="#b01f24" />
        </linearGradient>
      </defs>
      <circle className="sciwork-pulse-icon__halo" cx="32" cy="32" r="27" />
      <g className="sciwork-pulse-icon__graph">
        <path d="M15 24 24 16 34 19 44 14 51 23" />
        <path d="M16 39 25 45 35 41 45 48" />
        <path d="M24 16 25 45" />
        <circle cx="15" cy="24" r="2.3" />
        <circle cx="24" cy="16" r="2.1" />
        <circle cx="44" cy="14" r="2.1" />
        <circle cx="51" cy="23" r="2.3" />
        <circle cx="45" cy="48" r="2.1" />
      </g>
      <circle className="sciwork-pulse-icon__body" cx="32" cy="32" r="17.5" />
      <g className="sciwork-pulse-icon__science-orbit">
        <ellipse cx="32" cy="32" rx="22" ry="7.2" />
        <ellipse cx="32" cy="32" rx="22" ry="7.2" transform="rotate(62 32 32)" />
        <ellipse cx="32" cy="32" rx="22" ry="7.2" transform="rotate(118 32 32)" />
      </g>
      <circle className="sciwork-pulse-icon__core" cx="32" cy="32" r="7.4" />
      <g className="sciwork-pulse-icon__red-nodes">
        <circle cx="51" cy="23" r="2.3" />
        <circle cx="45" cy="48" r="1.9" />
      </g>
    </svg>
  );
}
