import { useQuery } from '@tanstack/react-query'
import { addDays, differenceInCalendarDays, format, isSameDay, parseISO } from 'date-fns'
import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Card } from '@/components/ui/Card'
import { ErrorState, LoadingState } from '@/components/ui/states'
import { ApiError } from '@/lib/api'
import { formatMoney, toNumber } from '@/lib/money'
import { queryKeys } from '@/lib/queryKeys'
import type { TripActivity, TripStop } from '@/types/api'

import { getTrip, listStops, listTripActivities } from './api'

/**
 * Day-by-day timeline for the whole trip.
 *
 * Every day in the range gets a row, including empty ones — the gaps are the
 * point, since they are where the plan still needs filling in.
 */

interface Day {
  date: Date
  iso: string
  stop: TripStop | null
  activities: TripActivity[]
}

export function TripCalendarPage() {
  const { tripId } = useParams()
  const id = Number(tripId)

  const tripQuery = useQuery({
    queryKey: queryKeys.trips.detail(id),
    queryFn: ({ signal }) => getTrip(id, signal),
    enabled: Number.isFinite(id),
  })

  const stopsQuery = useQuery({
    queryKey: queryKeys.trips.stops(id),
    queryFn: ({ signal }) => listStops(id, signal),
    enabled: Number.isFinite(id),
  })

  const activitiesQuery = useQuery({
    queryKey: queryKeys.trips.activities(id),
    queryFn: ({ signal }) => listTripActivities(id, signal),
    enabled: Number.isFinite(id),
  })

  const days = useMemo<Day[]>(() => {
    const trip = tripQuery.data
    if (!trip) return []

    const start = parseISO(trip.start_date)
    const total = differenceInCalendarDays(parseISO(trip.end_date), start) + 1
    const stops = stopsQuery.data ?? []
    const activities = activitiesQuery.data ?? []

    return Array.from({ length: Math.max(0, total) }, (_, index) => {
      const date = addDays(start, index)
      const iso = format(date, 'yyyy-MM-dd')

      return {
        date,
        iso,
        stop: stops.find((stop) => iso >= stop.start_date && iso <= stop.end_date) ?? null,
        activities: activities
          .filter((activity) => activity.activity_date === iso)
          .sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? '')),
      }
    })
  }, [tripQuery.data, stopsQuery.data, activitiesQuery.data])

  if (tripQuery.isPending) return <LoadingState label="Loading trip…" />

  if (tripQuery.isError) {
    return (
      <ErrorState
        message={
          tripQuery.error instanceof ApiError ? tripQuery.error.message : 'Could not load the trip.'
        }
        onRetry={() => void tripQuery.refetch()}
      />
    )
  }

  const trip = tripQuery.data
  const today = new Date()

  return (
    <section className="flex flex-col gap-6">
      <nav className="text-sm text-muted">
        <Link to="/trips" className="hover:text-primary">
          My Trips
        </Link>
        <span className="mx-2">/</span>
        <Link to={`/trips/${trip.id}`} className="hover:text-primary">
          {trip.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">Timeline</span>
      </nav>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Timeline</h1>
          <p className="mt-1 text-sm text-muted">
            Every day of {trip.name}, and what is planned on it.
          </p>
        </div>

        <Link to={`/trips/${trip.id}`} className="text-sm font-medium text-primary hover:underline">
          Back to itinerary
        </Link>
      </header>

      <ol className="flex flex-col gap-3">
        {days.map((day, index) => {
          const isToday = isSameDay(day.date, today)
          const dayCost = day.activities.reduce(
            (total, activity) => total + toNumber(activity.estimated_cost),
            0,
          )

          return (
            <li key={day.iso}>
              <Card
                className={`flex flex-col gap-3 p-4 sm:flex-row sm:gap-5 ${
                  isToday ? 'border-primary' : ''
                }`}
              >
                <div className="flex shrink-0 items-baseline gap-3 sm:w-40 sm:flex-col sm:items-start sm:gap-0.5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    Day {index + 1}
                    {isToday && <span className="ml-2 text-primary">Today</span>}
                  </p>
                  <p className="font-display text-lg font-semibold leading-none">
                    {format(day.date, 'EEE d MMM')}
                  </p>
                </div>

                <div className="min-w-0 flex-1">
                  {day.stop ? (
                    <p className="text-sm">
                      <span className="font-medium">{day.stop.city.name}</span>
                      <span className="ml-2 text-muted">{day.stop.city.country.name}</span>
                      {dayCost > 0 && (
                        <span className="ml-2 text-muted">· {formatMoney(dayCost)}</span>
                      )}
                    </p>
                  ) : (
                    <p className="text-sm text-muted">
                      No city set for this day — add a stop covering it.
                    </p>
                  )}

                  {day.activities.length > 0 ? (
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {day.activities.map((activity) => (
                        <li key={activity.id} className="flex justify-between gap-3 text-sm">
                          <span className="min-w-0">
                            {activity.start_time && (
                              <span className="mr-2 tabular-nums text-muted">
                                {activity.start_time.slice(0, 5)}
                              </span>
                            )}
                            {activity.activity.name}
                          </span>
                          <span className="shrink-0 text-muted">
                            {toNumber(activity.estimated_cost) === 0
                              ? 'Free'
                              : formatMoney(activity.estimated_cost)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    day.stop && <p className="mt-2 text-sm text-soft">Nothing planned yet.</p>
                  )}
                </div>
              </Card>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
