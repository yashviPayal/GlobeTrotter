import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states'
import { ApiError } from '@/lib/api'
import { formatMoney, toNumber } from '@/lib/money'
import { queryKeys } from '@/lib/queryKeys'
import type { TripActivity, TripStop } from '@/types/api'

import { BudgetBreakdown } from './BudgetBreakdown'
import { ShareControl } from './ShareControl'
import { deleteTrip, getTrip, getTripBudget, listTripActivities, listTripStops } from './api'
import { STATUS_LABEL, STATUS_TONE, getTripDays, getTripStatus } from './tripStatus'

/**
 * Screen 6 — the itinerary as a finished plan, read-only.
 *
 * Editing lives in the builder at /build, which is screen 5 in the brief and
 * owns drag-reorder and the assistant. Keeping them apart means one place to
 * change the plan and one place to read it, rather than two screens that each
 * half-edit it.
 */

function formatStopRange(stop: TripStop): string {
  const start = parseISO(stop.start_date)
  const end = parseISO(stop.end_date)

  if (stop.start_date === stop.end_date) return format(start, 'd MMM')
  return `${format(start, 'd MMM')} – ${format(end, 'd MMM')}`
}

export function TripDetailPage() {
  const { tripId } = useParams()
  const id = Number(tripId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const tripQuery = useQuery({
    queryKey: queryKeys.trips.detail(id),
    queryFn: ({ signal }) => getTrip(id, signal),
    enabled: Number.isFinite(id),
  })

  const stopsQuery = useQuery({
    queryKey: queryKeys.trips.stops(id),
    queryFn: ({ signal }) => listTripStops(id, signal),
    enabled: Number.isFinite(id),
  })

  const activitiesQuery = useQuery({
    queryKey: queryKeys.trips.activities(id),
    queryFn: ({ signal }) => listTripActivities(id, signal),
    enabled: Number.isFinite(id),
  })

  const budgetQuery = useQuery({
    queryKey: queryKeys.trips.budget(id),
    queryFn: ({ signal }) => getTripBudget(id, signal),
    enabled: Number.isFinite(id),
  })

  // One pass to bucket activities by the stop they belong to, rather than
  // filtering the whole list once per stop.
  const activitiesByStop = useMemo(() => {
    const map = new Map<number, TripActivity[]>()

    for (const activity of activitiesQuery.data ?? []) {
      const list = map.get(activity.trip_stop_id) ?? []
      list.push(activity)
      map.set(activity.trip_stop_id, list)
    }

    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          a.activity_date.localeCompare(b.activity_date) ||
          (a.start_time ?? '').localeCompare(b.start_time ?? ''),
      )
    }

    return map
  }, [activitiesQuery.data])

  const removeTrip = useMutation({
    mutationFn: () => deleteTrip(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.trips.all })
      navigate('/trips', { replace: true })
    },
  })

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
  const status = getTripStatus(trip)
  const stops = stopsQuery.data ?? []

  return (
    <section className="flex flex-col gap-6">
      <nav className="text-sm text-muted">
        <Link to="/trips" className="hover:text-primary">
          My Trips
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{trip.name}</span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-bold">{trip.name}</h1>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_TONE[status]}`}
            >
              {STATUS_LABEL[status]}
            </span>
          </div>

          <p className="mt-1 text-sm text-muted">
            {format(parseISO(trip.start_date), 'd MMM yyyy')} –{' '}
            {format(parseISO(trip.end_date), 'd MMM yyyy')} · {getTripDays(trip)} days ·{' '}
            {stops.length} {stops.length === 1 ? 'stop' : 'stops'}
          </p>

          {trip.description && <p className="mt-2 max-w-2xl text-sm">{trip.description}</p>}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to={`/trips/${trip.id}/build`}>
            <Button>Edit itinerary</Button>
          </Link>
          <Link to={`/trips/${trip.id}/calendar`}>
            <Button variant="secondary">Timeline</Button>
          </Link>
          <Link to={`/trips/${trip.id}/budget`}>
            <Button variant="secondary">Budget</Button>
          </Link>
          {status !== 'completed' && (
            <Button variant="ghost" onClick={() => setConfirmingDelete(true)}>
              Delete
            </Button>
          )}
        </div>
      </header>

      {confirmingDelete && (
        <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <h2 className="font-medium text-danger">Delete this trip?</h2>
            <p className="mt-0.5 text-sm text-muted">
              Its stops and scheduled activities go with it. This cannot be undone.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="danger"
              loading={removeTrip.isPending}
              onClick={() => removeTrip.mutate()}
            >
              Delete trip
            </Button>
            <Button variant="ghost" onClick={() => setConfirmingDelete(false)}>
              Keep it
            </Button>
          </div>
        </Card>
      )}

      {budgetQuery.data && <BudgetBreakdown budget={budgetQuery.data} />}

      <ShareControl trip={trip} />

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Itinerary</h2>

        {stopsQuery.isPending && <LoadingState label="Loading itinerary…" />}

        {stopsQuery.isError && (
          <ErrorState
            message="Could not load the itinerary."
            onRetry={() => void stopsQuery.refetch()}
          />
        )}

        {stopsQuery.isSuccess && stops.length === 0 && (
          <EmptyState
            title="No stops yet"
            description="Add the first city on this trip in the builder and it will show up here."
            action={
              <Link to={`/trips/${trip.id}/build`}>
                <Button>Build the itinerary</Button>
              </Link>
            }
          />
        )}

        <ol className="flex flex-col gap-4">
          {stops.map((stop, index) => {
            const stopActivities = activitiesByStop.get(stop.id) ?? []
            const stopCost = stopActivities.reduce(
              (total, activity) => total + toNumber(activity.estimated_cost),
              0,
            )

            return (
              <li key={stop.id}>
                <Card className="flex flex-col gap-4 p-5">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary">
                      {index + 1}
                    </span>

                    <div className="min-w-0">
                      <h3 className="font-display text-lg font-semibold leading-tight">
                        {stop.city.name}
                        <span className="ml-2 text-sm font-normal text-muted">
                          {stop.city.country.name}
                        </span>
                      </h3>
                      <p className="mt-0.5 text-sm text-muted">
                        {formatStopRange(stop)}
                        {stopActivities.length > 0 && ` · ${formatMoney(stopCost)} of activities`}
                      </p>
                    </div>
                  </div>

                  {stopActivities.length > 0 && (
                    <ul className="flex flex-col gap-2 border-t border-hairline pt-3">
                      {stopActivities.map((activity) => (
                        <li
                          key={activity.id}
                          className="flex flex-wrap items-center justify-between gap-3 text-sm"
                        >
                          <div className="min-w-0">
                            <span className="font-medium">{activity.activity.name}</span>
                            <span className="ml-2 text-muted">
                              {format(parseISO(activity.activity_date), 'd MMM')}
                              {activity.start_time && ` · ${activity.start_time.slice(0, 5)}`}
                              {' · '}
                              {activity.activity.category}
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
            )
          })}
        </ol>
      </div>
    </section>
  )
}
