interface SciWorkPulseIconProps {
  className?: string;
  state?: 'idle' | 'active' | 'thinking';
  title?: string;
}

export function SciWorkPulseIcon({
  className = '',
  state = 'idle',
  title = 'SciWork 求是智核'
}: SciWorkPulseIconProps) {
  const classNames = ['sciwork-pulse-icon', className].filter(Boolean).join(' ');

  return (
    <svg
      aria-label={title}
      className={classNames}
      data-state={state}
      role="img"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="sciworkPulseCore" cx="50%" cy="46%" r="62%">
          <stop offset="0%" stopColor="#f4fbff" />
          <stop offset="38%" stopColor="#2b8ee8" />
          <stop offset="100%" stopColor="#063a75" />
        </radialGradient>
        <linearGradient id="sciworkPulseRing" x1="10" x2="54" y1="10" y2="54">
          <stop stopColor="#8fc8ff" />
          <stop offset="0.52" stopColor="#005bac" />
          <stop offset="1" stopColor="#1d8a78" />
        </linearGradient>
      </defs>
      <circle className="sciwork-pulse-icon__halo" cx="32" cy="32" r="25" />
      <g className="sciwork-pulse-icon__orbit">
        <ellipse cx="32" cy="32" rx="25" ry="9" />
        <ellipse cx="32" cy="32" rx="25" ry="9" transform="rotate(60 32 32)" />
        <ellipse cx="32" cy="32" rx="25" ry="9" transform="rotate(120 32 32)" />
      </g>
      <g className="sciwork-pulse-icon__links">
        <path d="M18 32h28" />
        <path d="M32 18v28" />
        <path d="M22 22l20 20" />
        <path d="M42 22L22 42" />
      </g>
      <path className="sciwork-pulse-icon__seal" d="M32 13 47 22v20L32 51 17 42V22Z" />
      <circle className="sciwork-pulse-icon__core" cx="32" cy="32" r="8.2" />
      <g className="sciwork-pulse-icon__nodes">
        <circle cx="32" cy="14" r="2.6" />
        <circle cx="48" cy="24" r="2.4" />
        <circle cx="46" cy="43" r="2.6" />
        <circle cx="32" cy="50" r="2.4" />
        <circle cx="17" cy="43" r="2.4" />
        <circle cx="16" cy="24" r="2.6" />
      </g>
      <g className="sciwork-pulse-icon__red-nodes">
        <circle cx="50" cy="32" r="2.2" />
        <circle cx="22" cy="18" r="1.9" />
      </g>
    </svg>
  );
}
