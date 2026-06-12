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
      <g aria-hidden="true" className="sciwork-pulse-icon__molecule" data-science-structure="molecule">
        <g className="sciwork-pulse-icon__molecule-bonds">
          <path d="M24.5 31.5 30.5 25.5 38.5 29.5 36.5 38 28.5 38.5Z" />
          <path d="M30.5 25.5 32.5 19.5" />
          <path d="M38.5 29.5 44.5 26.5" />
        </g>
        <g className="sciwork-pulse-icon__molecule-atoms">
          <circle cx="24.5" cy="31.5" r="2.1" />
          <circle cx="30.5" cy="25.5" r="2" />
          <circle cx="38.5" cy="29.5" r="2.2" />
          <circle cx="36.5" cy="38" r="1.9" />
          <circle cx="28.5" cy="38.5" r="2" />
          <circle cx="32.5" cy="19.5" r="1.6" />
          <circle cx="44.5" cy="26.5" r="1.7" />
        </g>
      </g>
      <g className="sciwork-pulse-icon__red-nodes">
        <circle cx="51" cy="23" r="2.3" />
        <circle cx="45" cy="48" r="1.9" />
      </g>
    </svg>
  );
}
