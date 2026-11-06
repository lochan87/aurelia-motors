import type { SVGProps } from 'react';

export function BrandMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      <circle cx="24" cy="24" r="22.5" stroke="currentColor" strokeWidth="1" />
      <path d="M15 34 24 13l9 21" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M19 27.5h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
