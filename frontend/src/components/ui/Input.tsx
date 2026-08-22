import clsx from 'clsx'
import { forwardRef, useId, useState } from 'react'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Filled pupil — an outline-only eye at this size reads as a smudge. */}
      <circle cx="12" cy="12" r="2.75" fill="currentColor" />
      {crossed && (
        <path
          d="m4 20 16-16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}

/**
 * Ref is forwarded so form libraries can register the underlying element.
 *
 * A password field grows a reveal toggle automatically, so every password
 * input in the app behaves the same without each screen wiring it up.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className, id, type = 'text', ...props },
  ref,
) {
  const generatedId = useId()
  const [revealed, setRevealed] = useState(false)

  const inputId = id ?? generatedId
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
  const isPassword = type === 'password'
  const resolvedType = isPassword && revealed ? 'text' : type

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-ink">
        {label}
      </label>

      <div className="relative">
        <input
          {...props}
          ref={ref}
          id={inputId}
          type={resolvedType}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={clsx(
            'h-10 w-full rounded-control border bg-surface px-3 text-sm text-ink',
            'placeholder:text-soft focus:outline-none focus:ring-2 focus:ring-primary/40',
            isPassword && 'pr-12',
            error ? 'border-danger' : 'border-hairline focus:border-primary',
            className,
          )}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            aria-pressed={revealed}
            // Not a tab stop: keyboard users move label -> field -> next field
            // without an extra hop they did not ask for.
            tabIndex={-1}
            className="absolute inset-y-1 right-1 flex w-9 items-center justify-center rounded-control text-ink/75 transition-colors hover:bg-primary-tint hover:text-primary"
          >
            <EyeIcon crossed={revealed} />
          </button>
        )}
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
})
