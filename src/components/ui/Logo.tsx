import Link from 'next/link';

interface LogoProps {
  variant?: 'default' | 'dark' | 'light';
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
  href?: string;
}

// Speed Limit Sign Component (replaces the O)
function SpeedLimitSign({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dimensions = {
    sm: { width: 24, height: 30, fontSize: 4, numberSize: 14, borderWidth: 2 },
    md: { width: 32, height: 40, fontSize: 5, numberSize: 18, borderWidth: 2.5 },
    lg: { width: 48, height: 60, fontSize: 7, numberSize: 28, borderWidth: 3 },
  };

  const d = dimensions[size];

  return (
    <svg
      width={d.width}
      height={d.height}
      viewBox="0 0 32 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="inline-block"
      style={{ verticalAlign: 'baseline', marginBottom: size === 'sm' ? '-2px' : size === 'md' ? '-4px' : '-6px' }}
    >
      {/* Sign background */}
      <rect
        x="1.5"
        y="1.5"
        width="29"
        height="37"
        rx="2"
        fill="#FFD100"
        stroke="#1A1A1A"
        strokeWidth={d.borderWidth}
      />
      {/* SPEED text */}
      <text
        x="16"
        y="10"
        textAnchor="middle"
        fill="#1A1A1A"
        fontSize="5"
        fontWeight="800"
        fontFamily="Inter, system-ui, sans-serif"
      >
        SPEED
      </text>
      {/* LIMIT text */}
      <text
        x="16"
        y="16"
        textAnchor="middle"
        fill="#1A1A1A"
        fontSize="5"
        fontWeight="800"
        fontFamily="Inter, system-ui, sans-serif"
      >
        LIMIT
      </text>
      {/* 0 number */}
      <text
        x="16"
        y="34"
        textAnchor="middle"
        fill="#1A1A1A"
        fontSize="18"
        fontWeight="800"
        fontFamily="Inter, system-ui, sans-serif"
      >
        0
      </text>
    </svg>
  );
}

export function Logo({ variant = 'default', showTagline = false, size = 'md', href = '/' }: LogoProps) {
  const textColor = variant === 'light' ? 'text-white' : 'text-primary';

  const fontSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  const taglineSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  const content = (
    <div className="inline-flex flex-col">
      <div className={`font-extrabold tracking-tight ${fontSizes[size]} ${textColor} flex items-baseline`}>
        <span>TASKF</span>
        <SpeedLimitSign size={size} />
        <span>RCE</span>
        <span className="ml-1 font-extrabold">TICKETS</span>
      </div>
      {showTagline && (
        <span className={`${taglineSizes[size]} tracking-widest uppercase ${variant === 'light' ? 'text-white/70' : 'text-secondary'} mt-0.5`}>
          Memphis Traffic Defense
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}

// Simplified icon-only version for compact spaces
export function LogoIcon({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dimensions = {
    sm: 32,
    md: 40,
    lg: 56,
  };

  return (
    <div
      className="bg-brand-yellow rounded-lg flex items-center justify-center border-2 border-primary"
      style={{ width: dimensions[size], height: dimensions[size] }}
    >
      <span className="text-primary font-extrabold" style={{ fontSize: dimensions[size] * 0.5 }}>
        0
      </span>
    </div>
  );
}
