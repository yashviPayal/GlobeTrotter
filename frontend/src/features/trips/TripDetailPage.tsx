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

import { AddStopForm } from './AddStopForm'
import { BudgetBreakdown } from './BudgetBreakdown'
import { ShareControl } from './ShareControl'
import { StopActivityPicker } from './StopActivityPicker'
import {
  deleteStop,
  deleteTripActivity,
  getTrip,
  getTripBudget,
  listStops,
  listTripActivities,
} from './api'
import { STATUS_LABEL, STATUS_TONE, getTripDays, getTripStatus } from './tripStatus'

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

  const [addingStop, setAddingStop] = useState(false)
  const [pickingFor, setPickingFor] = useState<TripStop | null>(null)

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

  const invalidateItinerary = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.trips.stops(id) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.trips.activities(id) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.trips.budget(id) })
  }

  const removeStop = useMutation({
    mutationFn: (stopId: number) => deleteStop(id, stopId),
    onSuccess: invalidateItinerary,
  })

  const removeActivity = useMutation({
    mutationFn: (tripActivityId: number) => deleteTripActivity(id, tripActivityId),
    onSuccess: invalidateItinerary,
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

        <Button variant="secondary" onClick={() => navigate('/trips')}>
          Back to trips
        </Button>
      </header>

      {budgetQuery.data && <BudgetBreakdown budget={budgetQuery.data} />}

      <ShareControl trip={trip} />

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Itinerary</h2>
            <p className="mt-0.5 text-sm text-muted">
              Cities in the order you will visit them, with what you plan to do in each.
            </p>
          </div>

          {!addingStop && <Button onClick={() => setAddingStop(true)}>Add stop</Button>}
        </div>

        {addingStop && (
          <Card className="p-6">
            <h3 className="mb-4 font-medium">Add a stop</h3>
            <AddStopForm trip={trip} onDone={() => setAddingStop(false)} />
          </Card>
        )}

        {stopsQuery.isPending && <LoadingState label="Loading itinerary…" />}

        {stopsQuery.isError && (
          <ErrorState
            message="Could not load the itinerary."
            onRetry={() => void stopsQuery.refetch()}
          />
        )}

        {stopsQuery.isSuccess && stops.length === 0 && !addingStop && (
          <EmptyState
            title="No stops yet"
            description="Add the first city on this trip and its activities will show up underneath it."
            action={<Button onClick={() => setAddingStop(true)}>Add stop</Button>}
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
                  <div className="flex flex-wrap items-start justify-between gap-3">
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

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setPickingFor(pickingFor?.id === stop.id ? null : stop)}
                      >
                        Add activity
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={removeStop.isPending && removeStop.variables === stop.id}
                        onClick={() => removeStop.mutate(stop.id)}
                      >
                        Remove
                      </Button>
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

                          <div className="flex items-center gap-3">
                            <span className="font-medium">
                              {toNumber(activity.estimated_cost) === 0
                                ? 'Free'
                                : formatMoney(activity.estimated_cost)}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeActivity.mutate(activity.id)}
                              className="text-xs text-muted underline-offset-2 hover:text-danger hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {pickingFor?.id === stop.id && (
                    <div className="border-t border-hairline pt-4">
                      <StopActivityPicker
                        tripId={id}
                        stop={stop}
                        onDone={() => setPickingFor(null)}
                      />
                    </div>
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
