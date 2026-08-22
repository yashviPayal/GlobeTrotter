import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import type { Money } from '@/types/api'
import { Card } from '@/components/ui/Card'
import {
  ErrorState,
  LoadingState,
} from '@/components/ui/states'
import { ApiError } from '@/lib/api'
import { formatMoney } from '@/lib/money'

import { getTrip, getTripBudget } from './api'

export function BudgetPage() {
  const { tripId } = useParams<{
    tripId: string
  }>()

  const id = Number(tripId)

  const tripQuery = useQuery({
    queryKey: ['trip', id],
    queryFn: ({ signal }) =>
      getTrip(id, signal),
    enabled: Number.isFinite(id) && id > 0,
  })

  const budgetQuery = useQuery({
    queryKey: ['trip', id, 'budget'],
    queryFn: ({ signal }) =>
      getTripBudget(id, signal),
    enabled: Number.isFinite(id) && id > 0,
  })

  if (
    tripQuery.isPending ||
    budgetQuery.isPending
  ) {
    return (
      <LoadingState label="Loading budget…" />
    )
  }

  if (
    tripQuery.isError ||
    budgetQuery.isError ||
    !tripQuery.data ||
    !budgetQuery.data
  ) {
    const error =
      tripQuery.error ??
      budgetQuery.error

    return (
      <ErrorState
        message={
          error instanceof ApiError
            ? error.message
            : 'Could not load the budget.'
        }
        onRetry={() => {
          void tripQuery.refetch()
          void budgetQuery.refetch()
        }}
      />
    )
  }

  const trip = tripQuery.data
  const budget = budgetQuery.data

  const utilization = Math.min(
    100,
    Number(
      budget.utilization_percent,
    ),
  )

  const isOverBudget =
    Number(budget.remaining) < 0

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">
            {trip.start_date} → {trip.end_date}
          </p>

          <h1 className="mt-1 text-3xl font-bold text-ink">
            Trip Budget
          </h1>

          <p className="mt-1 text-sm text-muted">
            {trip.name}
          </p>
        </div>

        <Link to={`/trips/${id}`}>
          <Button variant="ghost">
            ← Back to trip
          </Button>
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BudgetCard
          label="Accommodation"
          value={budget.accommodation.planned}
        />

        <BudgetCard
          label="Transport"
          value={budget.transport.planned}
        />

        <BudgetCard
          label="Meals"
          value={budget.meals.planned}
        />

        <BudgetCard
          label="Activities"
          value={budget.activities.planned}
        />
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted">
              Total allocated
            </p>

            <p className="mt-1 text-3xl font-bold text-ink">
              {formatMoney(
                budget.total_allocated,
              )}
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm text-muted">
              Planned
            </p>

            <p className="mt-1 text-2xl font-bold text-ink">
              {formatMoney(
                budget.total_planned,
              )}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <div className="h-3 overflow-hidden rounded-full bg-primary-tint">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${utilization}%`,
              }}
            />
          </div>

          <div className="mt-2 flex justify-between text-xs text-muted">
            <span>
              {budget.utilization_percent}% used
            </span>

            <span>
              {formatMoney(
                budget.remaining,
              )}{' '}
              remaining
            </span>
          </div>
        </div>

        {isOverBudget && (
          <div className="mt-5 rounded-control border border-danger/30 bg-danger/5 p-4">
            <p className="text-sm font-semibold text-danger">
              ⚠ Budget exceeded
            </p>

            <p className="mt-1 text-xs text-muted">
              Your planned activity costs are higher
              than your allocated trip budget.
            </p>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="text-lg font-semibold text-ink">
          Budget breakdown
        </h2>

        <div className="mt-4 flex flex-col gap-3">
          <BudgetRow
            label="Accommodation"
            amount={budget.accommodation.planned}
          />

          <BudgetRow
            label="Transport"
            amount={budget.transport.planned}
          />

          <BudgetRow
            label="Meals"
            amount={budget.meals.planned}
          />

          <BudgetRow
            label="Activities"
            amount={budget.activities.planned}
          />

          <div className="border-t border-hairline pt-3">
            <BudgetRow
              label="Total planned"
              amount={budget.total_planned}
              strong
            />
          </div>
        </div>
      </Card>
    </section>
  )
}


function BudgetCard({
  label,
  value,
}: {
  label: string
  value: Money
}) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-muted">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-ink">
        {formatMoney(value)}
      </p>
    </Card>
  )
}


function BudgetRow({
  label,
  amount,
  strong = false,
}: {
  label: string
  amount: Money
  strong?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={
          strong
            ? 'text-sm font-semibold text-ink'
            : 'text-sm text-muted'
        }
      >
        {label}
      </span>

      <span
        className={
          strong
            ? 'text-sm font-bold text-ink'
            : 'text-sm font-semibold text-ink'
        }
      >
        {formatMoney(amount)}
      </span>
    </div>
  )
}