import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

import { cn } from '../../lib/utils';

interface FieldMessages {
  hint?: ReactNode;
  error?: string;
}

function FieldMessages({
  id,
  hint,
  error,
}: FieldMessages & {
  id: string;
}) {
  if (error) {
    return (
      <p id={`${id}-error`} role="alert" className="text-xs leading-5 text-red-700">
        {error}
      </p>
    );
  }

  if (hint) {
    return (
      <p id={`${id}-hint`} className="text-xs leading-5 text-stone-500">
        {hint}
      </p>
    );
  }

  return null;
}

function fieldDescribedBy(id: string, hint?: ReactNode, error?: string): string | undefined {
  if (error) {
    return `${id}-error`;
  }

  if (hint) {
    return `${id}-hint`;
  }

  return undefined;
}

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="flex items-center gap-1.5 text-sm font-medium text-ink-900">
      {children}
      {required ? (
        <span className="text-brass-500" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
}

const controlClasses =
  'w-full rounded-sm border border-ink-950/15 bg-ivory-50 px-4 py-3 text-sm text-ink-950 placeholder:text-stone-500/70 transition-colors focus:border-brass-500 focus:ring-2 focus:ring-brass-500/20 focus:outline-none aria-[invalid=true]:border-red-600';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement>, FieldMessages {
  label: string;
}

export function TextField({
  label,
  hint,
  error,
  id: providedId,
  className,
  required,
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;

  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <input
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={fieldDescribedBy(id, hint, error)}
        className={cn(controlClasses, className)}
        {...props}
      />
      <FieldMessages id={id} hint={hint} error={error} />
    </div>
  );
}

interface TextareaFieldProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>, FieldMessages {
  label: string;
}

export function TextareaField({
  label,
  hint,
  error,
  id: providedId,
  className,
  required,
  rows = 4,
  ...props
}: TextareaFieldProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;

  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <textarea
        id={id}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={fieldDescribedBy(id, hint, error)}
        className={cn(controlClasses, 'resize-y', className)}
        {...props}
      />
      <FieldMessages id={id} hint={hint} error={error} />
    </div>
  );
}

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement>, FieldMessages {
  label: string;
  options: SelectOption[];
  placeholder?: string;
}

export function SelectField({
  label,
  hint,
  error,
  id: providedId,
  className,
  required,
  options,
  placeholder,
  ...props
}: SelectFieldProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;

  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <select
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={fieldDescribedBy(id, hint, error)}
        className={cn(controlClasses, 'appearance-none', className)}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldMessages id={id} hint={hint} error={error} />
    </div>
  );
}
