import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { Link, useParams } from 'react-router-dom'

import { Card } from '@/components/ui/Card'
import { ErrorState, LoadingState } from '@/components/ui/states'
import { formatMoney, toNumber } from '@/lib/money'
import type { PublicStop } from '@/types/api'

import { getPublicTrip } from './api'

/**
 * Read-only itinerary at a share code. Deliberately outside the app shell and
 * outside RequireAuth — the whole point is that a signed-out visitor can open
 * it.
 */

function stopRange(stop: PublicStop): string {
  if (stop.start_date === stop.end_date) return format(parseISO(stop.start_date), 'd MMM')
  return `${format(parseISO(stop.start_date), 'd MMM')} – ${format(parseISO(stop.end_date), 'd MMM')}`
}

export function PublicTripPage() {
  const { shareCode } = useParams()

  const { data, isPending, isError } = useQuery({
    queryKey: ['public-trip', shareCode],
    queryFn: ({ signal }) => getPublicTrip(shareCode ?? '', signal),
    enabled: Boolean(shareCode),
    retry: false,
  })

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-hairline bg-surface">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link to="/" className="font-display text-lg font-bold">
            Globe<span className="text-primary">Trotter</span>
          </Link>
          <span className="text-xs text-muted">Shared itinerary</span>
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
        {isPending && <LoadingState label="Loading itinerary…" />}

        {isError && (
          <ErrorState
            title="Itinerary not available"
            message="This link is not valid, or the trip is no longer shared."
          />
        )}

        {data && (
          <>
            <div>
              <h1 className="font-display text-3xl font-bold">{data.name}</h1>
              <p className="mt-1 text-sm text-muted">
                {format(parseISO(data.start_date), 'd MMM yyyy')} –{' '}
                {format(parseISO(data.end_date), 'd MMM yyyy')} · {data.stops.length}{' '}
                {data.stops.length === 1 ? 'stop' : 'stops'}
              </p>
              {data.description && <p className="mt-3 max-w-2xl">{data.description}</p>}
            </div>

            <Card className="grid gap-x-8 gap-y-3 p-5 sm:grid-cols-2">
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-muted">Stay</span>
                <span className="font-medium">{formatMoney(data.budget.accommodation)}</span>
              </div>
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-muted">Transport</span>
                <span className="font-medium">{formatMoney(data.budget.transport)}</span>
              </div>
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-muted">Meals</span>
                <span className="font-medium">{formatMoney(data.budget.meals)}</span>
              </div>
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-muted">Activities</span>
                <span className="font-medium">{formatMoney(data.budget.activities)}</span>
              </div>
            </Card>

            <ol className="flex flex-col gap-4">
              {data.stops.map((stop) => (
                <li key={stop.id}>
                  <Card className="flex flex-col gap-3 p-5">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary">
                        {stop.sequence}
                      </span>
                      <div>
                        <h2 className="font-display text-lg font-semibold leading-tight">
                          {stop.city_name}
                          <span className="ml-2 text-sm font-normal text-muted">
                            {stop.country_name}
                          </span>
                        </h2>
                        <p className="mt-0.5 text-sm text-muted">{stopRange(stop)}</p>
                      </div>
                    </div>

                    {stop.activities.length > 0 && (
                      <ul className="flex flex-col gap-2 border-t border-hairline pt-3">
                        {stop.activities.map((activity) => (
                          <li
                            key={activity.id}
                            className="flex flex-wrap items-center justify-between gap-3 text-sm"
                          >
                            <div>
                              <span className="font-medium">{activity.name}</span>
                              <span className="ml-2 text-muted">
                                {format(parseISO(activity.activity_date), 'd MMM')}
                                {activity.start_time && ` · ${activity.start_time.slice(0, 5)}`}
                                {' · '}
                                {activity.category}
                              </span>
                            </div>
                            <span className="font-medium">
                              {toNumber(activity.estimated_cost) === 0
                                ? 'Free'
                                : formatMoney(activity.estimated_cost)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                </li>
              ))}
            </ol>

            <p className="text-center text-sm text-muted">
              Planned with{' '}
              <Link to="/register" className="font-medium text-primary hover:underline">
                GlobeTrotter
              </Link>
            </p>
          </>
        )}
      </main>
    </div>
  )
}
