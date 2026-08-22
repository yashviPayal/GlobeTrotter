import { Card } from '@/components/ui/Card'
import { formatMoney, toNumber } from '@/lib/money'
import type { Budget } from '@/types/api'

/**
 * The trip's budget columns are an envelope; scheduled activities draw it
 * down. That is what the API's `remaining` and `utilization_percent` measure —
 * they count activity spend against the total allocation, which is why
 * `total_planned` can equal `total_allocated` while nothing has been used.
 *
 * Per-category `planned` currently mirrors `allocated` for stay, transport and
 * meals, so those are shown as plain amounts rather than as meters that would
 * always read full. Only the overall draw-down gets a meter, because only it
 * is a real ratio against a limit.
 */

const ALLOCATIONS: Array<{ key: 'accommodation' | 'transport' | 'meals'; label: string }> = [
  { key: 'accommodation', label: 'Stay' },
  { key: 'transport', label: 'Transport' },
  { key: 'meals', label: 'Meals' },
]

export function BudgetBreakdown({ budget }: { budget: Budget }) {
  const allocated = toNumber(budget.total_allocated)
  const scheduled = toNumber(budget.activities.planned)
  const remaining = toNumber(budget.remaining)
  const over = remaining < 0

  const used = allocated === 0 ? (scheduled > 0 ? 100 : 0) : (scheduled / allocated) * 100

  return (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Budget</h2>
          <p className="mt-0.5 text-sm text-muted">
            {formatMoney(scheduled)} of activities scheduled against{' '}
            {formatMoney(allocated)} allocated
          </p>
        </div>

        <div className="text-right">
          <p
            className={`font-display text-2xl font-bold leading-none ${
              over ? 'text-danger' : 'text-ink'
            }`}
          >
            {formatMoney(Math.abs(remaining))}
          </p>
          <p className="mt-1 text-xs text-muted">{over ? 'over budget' : 'left to spend'}</p>
        </div>
      </div>

      <div
        className="h-2 overflow-hidden rounded-full bg-canvas"
        role="meter"
        aria-label="Share of the trip budget scheduled"
        aria-valuenow={Math.round(Math.min(100, used))}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full ${over ? 'bg-danger' : 'bg-primary'}`}
          style={{ width: `${Math.min(100, used)}%` }}
        />
      </div>

      <div className="grid gap-x-8 gap-y-3 border-t border-hairline pt-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Allocated</p>
          {ALLOCATIONS.map((row) => (
            <div key={row.key} className="flex justify-between gap-3 text-sm">
              <span className="text-muted">{row.label}</span>
              <span className="font-medium">{formatMoney(budget[row.key].allocated)}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Scheduled</p>
          <div className="flex justify-between gap-3 text-sm">
            <span className="text-muted">Activities</span>
            <span className="font-medium">{formatMoney(scheduled)}</span>
          </div>
          <div className="flex justify-between gap-3 text-sm">
            <span className="text-muted">Total allocated</span>
            <span className="font-medium">{formatMoney(allocated)}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
