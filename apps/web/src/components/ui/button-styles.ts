import { cn } from '../../lib/utils';

export type ButtonVariant = 'primary' | 'outline-light' | 'outline-dark' | 'quiet';
export type ButtonSize = 'md' | 'lg';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brass-400 text-ink-950 hover:bg-brass-300',
  'outline-light':
    'border border-ivory-50/25 text-ivory-50 hover:border-brass-300 hover:text-brass-300',
  'outline-dark':
    'border border-ink-950/20 text-ink-950 hover:border-brass-500 hover:text-brass-500',
  quiet: 'text-ink-950 hover:text-brass-500',
};

const sizeClasses: Record<ButtonSize, string> = {
  md: 'px-6 py-3.5',
  lg: 'px-7 py-4',
};

interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

export function buttonStyles({
  variant = 'primary',
  size = 'md',
  className,
}: ButtonStyleOptions = {}): string {
  return cn(
    'inline-flex items-center justify-center gap-2.5 rounded-full text-[0.68rem] font-semibold tracking-[0.18em] uppercase transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50',
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}
