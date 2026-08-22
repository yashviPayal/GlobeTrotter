import type { ReactNode } from 'react'

/**
 * Shared frame for log in and register, so the two screens are visibly one
 * product rather than two forms that happen to sit next to each other.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-ink p-10 text-white lg:flex">
        <span className="font-display text-xl font-bold">
          Globe<span className="text-primary">Trotter</span>
        </span>

        <div className="max-w-md">
          <p className="font-display text-3xl font-bold leading-snug">
            Plan multi-city trips without losing track of the budget.
          </p>
          <p className="mt-4 text-sm text-white/70">
            Build a day-wise itinerary, discover cities and activities, and watch the cost
            update as the plan changes.
          </p>
        </div>

        <p className="text-xs text-white/50">Odoo x LDCE Hackathon</p>
      </aside>

      <main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>

          <div className="mt-8">{children}</div>

          <div className="mt-6 text-sm text-muted">{footer}</div>
        </div>
      </main>
    </div>
  )
}
