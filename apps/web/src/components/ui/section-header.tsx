import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';

type SectionHeaderTone = 'light' | 'dark';

interface SectionHeaderProps {
  index: string;
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  tone?: SectionHeaderTone;
  className?: string;
}

export function SectionHeader({
  index,
  eyebrow,
  title,
  description,
  tone = 'light',
  className,
}: SectionHeaderProps) {
  const isDark = tone === 'dark';

  return (
    <div
      className={cn(
        'grid gap-8 border-t pt-6 lg:grid-cols-[minmax(0,0.62fr)_minmax(0,1.38fr)] lg:gap-16',
        isDark ? 'border-ivory-50/15' : 'border-ink-950/15',
        className,
      )}
    >
      <div>
        <p
          className={cn(
            'flex items-center gap-3 text-[0.65rem] font-semibold tracking-[0.26em] uppercase',
            isDark ? 'text-ivory-50/65' : 'text-stone-600',
          )}
        >
          <span className={isDark ? 'text-brass-300' : 'text-brass-500'}>{index}</span>
          <span className={cn('h-px w-7', isDark ? 'bg-brass-300/60' : 'bg-brass-500/60')} />
          {eyebrow}
        </p>
      </div>
      <div>
        <h2
          className={cn(
            'max-w-3xl text-4xl leading-[1.02] text-balance sm:text-5xl lg:text-6xl',
            isDark ? 'text-ivory-50' : 'text-ink-950',
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              'mt-6 max-w-2xl text-base leading-7 sm:text-lg sm:leading-8',
              isDark ? 'text-ivory-50/65' : 'text-stone-600',
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
