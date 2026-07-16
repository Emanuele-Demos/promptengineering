import type { InputHTMLAttributes } from 'react'

interface TermsCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: string
}

export function TermsCheckbox({ error, className = '', ...props }: TermsCheckboxProps) {
  return (
    <div>
      <label className="flex items-start gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'terms-error' : undefined}
          className={`mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 shrink-0 ${className}`}
          {...props}
        />
        <span className="text-sm text-slate-600 leading-snug">
          Accetto i{' '}
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Termini di Servizio
          </a>{' '}
          e l&apos;{' '}
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Informativa sulla Privacy
          </a>
        </span>
      </label>
      {error && (
        <p id="terms-error" className="mt-1.5 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
