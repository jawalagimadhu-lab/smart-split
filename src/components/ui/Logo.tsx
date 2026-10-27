import clsx from 'clsx';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon';
  light?: boolean;
}

export function Logo({ className, size = 'md', variant = 'full', light = false }: LogoProps) {
  const sizes = {
    sm: { icon: 28, text: 'text-base' },
    md: { icon: 36, text: 'text-xl' },
    lg: { icon: 48, text: 'text-3xl' },
  };
  const s = sizes[size];

  return (
    <div className={clsx('flex items-center gap-2.5', className)}>
      {/* Icon */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <circle cx="24" cy="24" r="24" fill="#8A7AE6" />
        {/* Two diverging paths */}
        <path
          d="M24 10 L24 24"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M24 24 L15 36"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M24 24 L33 36"
          stroke="#C3B4FF"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Clarity dot */}
        <circle cx="24" cy="10" r="3" fill="white" />
        {/* Arrow head on right path */}
        <circle cx="33" cy="36" r="2" fill="#C3B4FF" />
        <circle cx="15" cy="36" r="2" fill="white" />
      </svg>

      {/* Wordmark */}
      {variant === 'full' && (
        <span className={clsx('font-bold tracking-tight', s.text, light ? 'text-white' : 'text-primary-text')}>
          Smart<span className="text-accent">Split</span>
        </span>
      )}
    </div>
  );
}
