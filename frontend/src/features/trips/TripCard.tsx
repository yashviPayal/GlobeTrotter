import { format, parseISO } from 'date-fns'
import { Link } from 'react-router-dom'

import { Card } from '@/components/ui/Card'
import { formatMoney, sum } from '@/lib/money'
import type { Trip } from '@/types/api'

import { STATUS_LABEL, STATUS_TONE, getTripDays, getTripStatus } from './tripStatus'

function formatRange(trip: Trip): string {
  const start = parseISO(trip.start_date)
  const end = parseISO(trip.end_date)

  // Same month reads better as "3 – 9 Mar 2027" than a repeated month.
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${format(start, 'd')} – ${format(end, 'd MMM yyyy')}`
  }

  return `${format(start, 'd MMM')} – ${format(end, 'd MMM yyyy')}`
}

export function TripCard({ trip }: { trip: Trip }) {
  const status = getTripStatus(trip)
  const days = getTripDays(trip)
  const budget = sum(trip.accommodation_budget, trip.transport_budget, trip.meal_budget)

  return (
    <Card interactive className="flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <Link
          to={`/trips/${trip.id}`}
          className="font-display text-lg font-semibold leading-tight hover:text-primary"
        >
          {trip.name}
        </Link>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_TONE[status]}`}
        >
          {STATUS_LABEL[status]}
        </span>
      </div>

      {trip.description && (
        <p className="line-clamp-2 text-sm text-muted">{trip.description}</p>
      )}

      {/* Flows rather than a rigid 3-column grid, so a long date range keeps
          its own line instead of wrapping inside a narrow cell. */}
      <dl className="mt-auto flex flex-wrap gap-x-6 gap-y-2 border-t border-hairline pt-3 text-sm">
        <div>
          <dt className="text-xs text-muted">Dates</dt>
          <dd className="mt-0.5 font-medium">{formatRange(trip)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Length</dt>
          <dd className="mt-0.5 font-medium">
            {days} {days === 1 ? 'day' : 'days'}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Budget</dt>
          <dd className="mt-0.5 font-medium">{formatMoney(budget)}</dd>
        </div>
      </dl>
    </Card>
  )
}
