import clsx from 'clsx'
import { forwardRef, useId } from 'react'
import type { SelectHTMLAttributes } from 'react'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: SelectOption[]
  /** Hides the visible label but keeps it for screen readers. */
  hideLabel?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, hideLabel = false, className, id, ...props },
  ref,
) {
  const generatedId = useId()
  const selectId = id ?? generatedId

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={selectId}
        className={clsx('text-sm font-medium text-ink', hideLabel && 'sr-only')}
      >
        {label}
      </label>

      <select
        {...props}
        ref={ref}
        id={selectId}
        className={clsx(
          'h-10 rounded-control border border-hairline bg-surface px-3 text-sm text-ink',
          'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40',
          className,
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
})
