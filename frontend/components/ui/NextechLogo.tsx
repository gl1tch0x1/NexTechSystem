'use client';

interface NextechLogoProps {
  className?: string;
  size?: number;
  alt?: string;
  variant?: 'icon' | 'badge';
}

export function NextechLogo({
  className = 'w-6 h-6',
  size = 32,
  alt = 'NexTech Systems',
  variant = 'icon',
}: NextechLogoProps) {
  if (variant === 'badge') {
    return (
      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/60 shadow-lg shadow-blue-500/15 p-2 flex items-center justify-center shrink-0">
        <img
          src="/images/nextech-logo.png"
          alt={alt}
          width={size}
          height={size}
          className="w-full h-full object-contain"
          loading="eager"
        />
      </div>
    );
  }

  return (
    <img
      src="/images/nextech-logo.png"
      alt={alt}
      width={size}
      height={size}
      className={`object-contain shrink-0 ${className}`}
      loading="eager"
    />
  );
}
