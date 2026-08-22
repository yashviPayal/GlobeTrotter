import clsx from 'clsx'
import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
  children: ReactNode
}

export function Card({ interactive = false, className, children, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={clsx(
        'rounded-card border border-hairline bg-surface shadow-card',
        interactive && 'transition-shadow hover:shadow-lifted',
        className,
      )}
    >
      {children}
    </div>
  )
}
