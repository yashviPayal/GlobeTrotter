import type { ReactNode } from 'react'

import { Button } from './Button'
import { Card } from './Card'

/**
 * Every list in the app renders one of these three rather than a blank screen.
 */

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 py-12 text-sm text-muted">
      <span
        aria-hidden
        className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
      />
      {label}
    </div>
  )
}

interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="max-w-md text-sm text-muted">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </Card>
  )
}

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <Card className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <h3 className="text-lg font-semibold text-danger">{title}</h3>
      <p className="max-w-md text-sm text-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-2" onClick={onRetry}>
          Try again
        </Button>
      )}
    </Card>
  )
}
