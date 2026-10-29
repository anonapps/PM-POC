import type { ReactNode } from 'react';

/** Retain an error slot even while valid, without adding an announcement. */
export function FieldMessage({ id, error, announce = true, className = 'form-field-error' }: {
  id?: string;
  error?: string;
  announce?: boolean;
  className?: string;
}) {
  return <small id={id} className={className} role={error && announce ? 'alert' : undefined}>{error || '\u00a0'}</small>;
}

/** Label and reserved message composition; controls keep their existing semantics. */
export function FormField({ label, required, className, errorId, error, announceError = true, children }: {
  label: ReactNode;
  required?: boolean;
  className?: string;
  errorId?: string;
  error?: string;
  announceError?: boolean;
  children: ReactNode;
}) {
  return <label className={className}>{label}{required ? ' *' : ''}{children}<FieldMessage id={errorId} error={error} announce={announceError}/></label>;
}
