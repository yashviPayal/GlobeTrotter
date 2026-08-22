import { useMemo, useState } from 'react'
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  Link,
  useParams,
} from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
  ErrorState,
  LoadingState,
} from '@/components/ui/states'
import { ApiError, api } from '@/lib/api'
import { formatMoney } from '@/lib/money'

import {
  createTripActivity,
  createTripStop,
  deleteTripActivity,
  deleteTripStop,
  getTrip,
  getTripAssistant,
  listTripActivities,
  listTripStops,
  optimizeTripDay,
  reorderTripStops,
  restoreAutomaticStopOrder,
  type TripActivity,
  type TripStop,
} from './api'


interface City {
  id: number
  name: string
  country_id: number
  country: {
    id: number
    name: string
    code: string
  }
  region: string | null
  cost_index: number
  popularity: number
  image_url: string | null
}


interface CityActivity {
  id: number
  name: string
  description: string | null
  category: string
  duration_hours: number
  estimated_cost: string
  image_url: string | null
}


export function ItineraryBuilderPage() {
  const { tripId } = useParams<{
    tripId: string
  }>()

  const id = Number(tripId)
  const queryClient = useQueryClient()

  const [showAddStop, setShowAddStop] =
    useState(false)


  const [draggedStopId, setDraggedStopId] =
    useState<number | null>(null)

  const [manualOrder, setManualOrder] =
    useState<TripStop[]>([])

  const [selectedActivityIds, setSelectedActivityIds] =
    useState<Record<number, number | null>>({})


  /* ---------------------------------------------------------------------- */
  /* Trip                                                                   */
  /* ---------------------------------------------------------------------- */

  const tripQuery = useQuery({
    queryKey: ['trip', id],
    queryFn: ({ signal }) =>
      getTrip(id, signal),
    enabled: Number.isFinite(id) && id > 0,
  })


  /* ---------------------------------------------------------------------- */
  /* Stops                                                                  */
  /* ---------------------------------------------------------------------- */

  const stopsQuery = useQuery({
    queryKey: ['trip', id, 'stops'],
    queryFn: ({ signal }) =>
      listTripStops(id, signal),
    enabled: Number.isFinite(id) && id > 0,
  })

  const stops = stopsQuery.data ?? []

  const orderedStops = useMemo(() => {
    if (manualOrder.length > 0) {
      return manualOrder
    }

    return stops
  }, [manualOrder, stops])


  /* ---------------------------------------------------------------------- */
  /* Activities                                                             */
  /* ---------------------------------------------------------------------- */

  const activitiesQuery = useQuery({
    queryKey: ['trip', id, 'activities'],
    queryFn: ({ signal }) =>
      listTripActivities(id, signal),
    enabled: Number.isFinite(id) && id > 0,
  })

  const activities =
    activitiesQuery.data ?? []


  /* ---------------------------------------------------------------------- */
  /* Smart Assistant                                                        */
  /* ---------------------------------------------------------------------- */

  const assistantQuery = useQuery({
    queryKey: ['trip', id, 'assistant'],
    queryFn: ({ signal }) =>
      getTripAssistant(id, signal),
    enabled: Number.isFinite(id) && id > 0,
  })

  const assistant = assistantQuery.data


  /* ---------------------------------------------------------------------- */
  /* Cities                                                                 */
  /* ---------------------------------------------------------------------- */

  const citiesQuery = useQuery({
    queryKey: ['cities'],
    queryFn: ({ signal }) =>
      api.get<City[]>(
        '/cities/',
        signal,
      ),
  })

  const cities =
    citiesQuery.data ?? []


  /* ---------------------------------------------------------------------- */
  /* Create Stop                                                             */
  /* ---------------------------------------------------------------------- */

  const createStopMutation = useMutation({
    mutationFn: (payload: {
      city_id: number
      start_date: string
      end_date: string
    }) =>
      createTripStop(
        id,
        payload,
      ),

    onSuccess: async () => {
      setShowAddStop(false)

      await queryClient.invalidateQueries({
        queryKey: ['trip', id, 'stops'],
      })

      await queryClient.invalidateQueries({
        queryKey: ['trip', id, 'assistant'],
      })
    },
  })


  /* ---------------------------------------------------------------------- */
  /* Delete Stop                                                             */
  /* ---------------------------------------------------------------------- */

  const deleteStopMutation = useMutation({
    mutationFn: (stopId: number) =>
      deleteTripStop(
        id,
        stopId,
      ),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['trip', id, 'stops'],
      })

      await queryClient.invalidateQueries({
        queryKey: ['trip', id, 'activities'],
      })

      await queryClient.invalidateQueries({
        queryKey: ['trip', id, 'assistant'],
      })
    },
  })


  /* ---------------------------------------------------------------------- */
  /* Reorder                                                                 */
  /* ---------------------------------------------------------------------- */

  const reorderMutation = useMutation({
    mutationFn: (stopIds: number[]) =>
      reorderTripStops(
        id,
        stopIds,
      ),

    onSuccess: async (updatedStops) => {
      setManualOrder(updatedStops)

      await queryClient.invalidateQueries({
        queryKey: ['trip', id, 'stops'],
      })
    },
  })


  const automaticOrderMutation =
    useMutation({
      mutationFn: () =>
        restoreAutomaticStopOrder(id),

      onSuccess: async () => {
        setManualOrder([])

        await queryClient.invalidateQueries({
          queryKey: ['trip', id, 'stops'],
        })
      },
    })


  /* ---------------------------------------------------------------------- */
  /* Add Activity                                                            */
  /* ---------------------------------------------------------------------- */

  const addActivityMutation =
    useMutation({
      mutationFn: (payload: {
        trip_stop_id: number
        activity_id: number
      }) =>
        createTripActivity(
          id,
          payload,
        ),

      onSuccess: async () => {
        setSelectedActivityIds({})

        await queryClient.invalidateQueries({
          queryKey: ['trip', id, 'activities'],
        })

        await queryClient.invalidateQueries({
          queryKey: ['trip', id, 'assistant'],
        })
      },
    })


  /* ---------------------------------------------------------------------- */
  /* Delete Activity                                                         */
  /* ---------------------------------------------------------------------- */

  const deleteActivityMutation =
    useMutation({
      mutationFn: (
        tripActivityId: number,
      ) =>
        deleteTripActivity(
          id,
          tripActivityId,
        ),

      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: ['trip', id, 'activities'],
        })

        await queryClient.invalidateQueries({
          queryKey: ['trip', id, 'assistant'],
        })
      },
    })


  /* ---------------------------------------------------------------------- */
  /* Optimize Day                                                           */
  /* ---------------------------------------------------------------------- */

  const optimizeMutation =
    useMutation({
      mutationFn: (date: string) =>
        optimizeTripDay(
          id,
          date,
        ),

      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: ['trip', id, 'activities'],
        })

        await queryClient.invalidateQueries({
          queryKey: ['trip', id, 'assistant'],
        })
      },
    })


  /* ---------------------------------------------------------------------- */
  /* Loading / errors                                                        */
  /* ---------------------------------------------------------------------- */

  if (
    tripQuery.isPending ||
    stopsQuery.isPending ||
    activitiesQuery.isPending
  ) {
    return (
      <LoadingState
        label="Loading itinerary…"
      />
    )
  }

  if (
    tripQuery.isError ||
    stopsQuery.isError ||
    activitiesQuery.isError
  ) {
    return (
      <ErrorState
        message={
          tripQuery.error instanceof ApiError
            ? tripQuery.error.message
            : stopsQuery.error instanceof ApiError
              ? stopsQuery.error.message
              : activitiesQuery.error instanceof ApiError
                ? activitiesQuery.error.message
                : 'Could not load the itinerary.'
        }
        onRetry={() => {
          void tripQuery.refetch()
          void stopsQuery.refetch()
          void activitiesQuery.refetch()
        }}
      />
    )
  }

  if (!tripQuery.data) {
    return null
  }

  const trip = tripQuery.data


  /* ---------------------------------------------------------------------- */
  /* Drag handlers                                                          */
  /* ---------------------------------------------------------------------- */

  function handleDragStart(
    stopId: number,
  ) {
    setDraggedStopId(stopId)
  }


  function handleDrop(
    targetId: number,
  ) {
    if (
      draggedStopId === null ||
      draggedStopId === targetId
    ) {
      return
    }

    const current =
      manualOrder.length > 0
        ? [...manualOrder]
        : [...stops]

    const sourceIndex =
      current.findIndex(
        (stop) =>
          stop.id === draggedStopId,
      )

    const targetIndex =
      current.findIndex(
        (stop) =>
          stop.id === targetId,
      )

    if (
      sourceIndex === -1 ||
      targetIndex === -1
    ) {
      return
    }

    const moved = current[sourceIndex]

    if (!moved) {
      return
    }

    current.splice(sourceIndex, 1)


    current.splice(
      targetIndex,
      0,
      moved,
    )

    setManualOrder(current)
    setDraggedStopId(null)

    void reorderMutation.mutateAsync(
      current.map(
        (stop) => stop.id,
      ),
    )
  }


  return (
    <section className="flex flex-col gap-6">

      {/* ---------------------------------------------------------------- */}
      {/* Header                                                           */}
      {/* ---------------------------------------------------------------- */}

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">
            {trip.start_date} → {trip.end_date}
          </p>

          <h1 className="mt-1 text-3xl font-bold text-ink">
            Build your itinerary
          </h1>

          <p className="mt-1 text-sm text-muted">
            {trip.name}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to={`/trips/${id}`}>
            <Button variant="ghost">
              Back to trip
            </Button>
          </Link>

          <Link
            to={`/trips/${id}/budget`}
          >
            <Button variant="secondary">
              Budget
            </Button>
          </Link>
        </div>
      </header>


      {/* ---------------------------------------------------------------- */}
      {/* Smart Assistant                                                  */}
      {/* ---------------------------------------------------------------- */}

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline p-5">
          <div>
            <p className="text-sm font-semibold text-ink">
              ✨ Smart Assistant
            </p>

            <p className="mt-1 text-sm text-muted">
              Let GlobeTrotter find gaps, optimize days,
              and suggest activities.
            </p>
          </div>

          {assistant && (
            <div className="rounded-card bg-primary-tint px-4 py-3 text-center">
              <p className="text-xs text-muted">
                Trip health
              </p>

              <p className="text-2xl font-bold text-primary">
                {assistant.overall_score}/100
              </p>
            </div>
          )}
        </div>

        {assistant && (
          <div className="grid gap-4 p-5 md:grid-cols-3">

            <div>
              <p className="text-sm text-ink">
                {assistant.summary}
              </p>

              {assistant.priority_warning && (
                <div className="mt-3 rounded-control bg-canvas p-3">
                  <p className="text-xs font-semibold text-ink">
                    ⚠ {assistant.priority_warning}
                  </p>

                  {assistant.priority_suggestion && (
                    <p className="mt-1 text-xs text-muted">
                      {assistant.priority_suggestion}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted">
                Free time
              </p>

              <p className="mt-1 text-2xl font-bold text-ink">
                {assistant.total_free_hours}h
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted">
                Budget used
              </p>

              <p className="mt-1 text-2xl font-bold text-ink">
                {assistant.budget.utilization_percent}%
              </p>
            </div>

          </div>
        )}

        {assistant?.recommendations?.length ? (
          <div className="border-t border-hairline p-5">
            <p className="text-sm font-semibold text-ink">
              Suggested activities
            </p>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {assistant.recommendations.map(
                (item) => (
                  <div
                    key={item.id}
                    className="rounded-card border border-hairline p-4"
                  >
                    <p className="font-semibold text-ink">
                      {item.name}
                    </p>

                    <p className="mt-1 text-xs text-muted">
                      {item.category} ·{' '}
                      {item.duration_hours}h
                    </p>

                    <p className="mt-2 text-sm font-semibold text-primary">
                      {formatMoney(
                        item.estimated_cost,
                      )}
                    </p>

                    <p className="mt-2 text-xs text-muted">
                      {item.reason}
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>
        ) : null}
      </Card>


      {/* ---------------------------------------------------------------- */}
      {/* Add destination                                                  */}
      {/* ---------------------------------------------------------------- */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-ink">
            Destinations
          </h2>

          <p className="mt-1 text-sm text-muted">
            Add cities and GlobeTrotter will automatically
            place them in chronological order.
          </p>
        </div>

        <Button
          onClick={() =>
            setShowAddStop(
              (value) => !value,
            )
          }
        >
          + Add destination
        </Button>
      </div>


      {showAddStop && (
        <AddStopCard
          tripStart={trip.start_date}
          tripEnd={trip.end_date}
          cities={cities}
          loading={
            createStopMutation.isPending
          }
          error={createStopMutation.error}
          onCancel={() =>
            setShowAddStop(false)
          }
          onSubmit={(payload) =>
            createStopMutation.mutate(
              payload,
            )
          }
        />
      )}


      {/* ---------------------------------------------------------------- */}
      {/* Automatic/manual mode                                            */}
      {/* ---------------------------------------------------------------- */}

      {stops.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-hairline bg-surface p-4">
          <div>
            <p className="text-sm font-semibold text-ink">
              Itinerary order
            </p>

            <p className="mt-1 text-xs text-muted">
              Drag destinations to manually customize
              their order, or restore date-based ordering.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            loading={
              automaticOrderMutation.isPending
            }
            onClick={() =>
              automaticOrderMutation.mutate()
            }
          >
            Restore automatic order
          </Button>
        </div>
      )}


      {/* ---------------------------------------------------------------- */}
      {/* Stops                                                             */}
      {/* ---------------------------------------------------------------- */}

      <div className="flex flex-col gap-4">
        {orderedStops.length === 0 && (
          <Card className="border-dashed p-10 text-center">
            <p className="font-semibold text-ink">
              Your itinerary is empty
            </p>

            <p className="mt-1 text-sm text-muted">
              Add your first destination to start planning.
            </p>
          </Card>
        )}

        {orderedStops.map(
          (stop, index) => {
            const stopActivities =
              activities.filter(
                (item) =>
                  item.trip_stop_id === stop.id,
              )

            return (
              <StopBuilderCard
                key={stop.id}
                stop={{
                  ...stop,
                  sequence: index + 1,
                }}
                activities={stopActivities}
                selectedActivityId={
                  selectedActivityIds[
                    stop.id
                  ] ?? null
                }
                dragged={
                  draggedStopId === stop.id
                }
                deleting={
                  deleteStopMutation.isPending &&
                  deleteStopMutation.variables ===
                    stop.id
                }
                onDragStart={() =>
                  handleDragStart(
                    stop.id,
                  )
                }
                onDragOver={(event) =>
                  event.preventDefault()
                }
                onDrop={() =>
                  handleDrop(
                    stop.id,
                  )
                }
                onDelete={() =>
                  deleteStopMutation.mutate(
                    stop.id,
                  )
                }
                onSelectActivity={(
                  activityId,
                ) => {
                  setSelectedActivityIds(
                    (current) => ({
                      ...current,
                      [stop.id]:
                        activityId,
                    }),
                  )
                }}
                onAddActivity={async (
                  activityId,
                ) => {
                  await addActivityMutation.mutateAsync(
                    {
                      trip_stop_id:
                        stop.id,
                      activity_id:
                        activityId,
                    },
                  )
                }}
                onDeleteActivity={(
                  activityId,
                ) =>
                  deleteActivityMutation.mutate(
                    activityId,
                  )
                }
                optimize={() =>
                  optimizeMutation.mutate(
                    stop.start_date,
                  )
                }
                optimizing={
                  optimizeMutation.isPending
                }
              />
            )
          },
        )}
      </div>
    </section>
  )
}


/* ======================================================================== */
/* Add Stop                                                                  */
/* ======================================================================== */

function AddStopCard({
  tripStart,
  tripEnd,
  cities,
  loading,
  error,
  onCancel,
  onSubmit,
}: {
  tripStart: string
  tripEnd: string
  cities: City[]
  loading: boolean
  error: Error | null
  onCancel: () => void
  onSubmit: (payload: {
    city_id: number
    start_date: string
    end_date: string
  }) => void
}) {
  const [cityId, setCityId] =
    useState('')

  const [startDate, setStartDate] =
    useState(tripStart)

  const [endDate, setEndDate] =
    useState(tripStart)


  return (
    <Card className="p-5">
      <div className="grid gap-4 md:grid-cols-4">

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">
            City
          </span>

          <select
            value={cityId}
            onChange={(event) =>
              setCityId(event.target.value)
            }
            className="rounded-control border border-hairline bg-surface px-3 py-2 text-sm"
          >
            <option value="">
              Choose a city
            </option>

            {cities.map(
              (city) => (
                <option
                  key={city.id}
                  value={city.id}
                >
                  {city.name} ·{' '}
                  {city.country.name}
                </option>
              ),
            )}
          </select>
        </label>


        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">
            Start
          </span>

          <input
            type="date"
            min={tripStart}
            max={tripEnd}
            value={startDate}
            onChange={(event) => {
              const next =
                event.target.value

              setStartDate(next)

              if (
                !endDate ||
                endDate < next
              ) {
                setEndDate(next)
              }
            }}
            className="rounded-control border border-hairline bg-surface px-3 py-2 text-sm"
          />
        </label>


        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">
            End
          </span>

          <input
            type="date"
            min={startDate || tripStart}
            max={tripEnd}
            value={endDate}
            onChange={(event) =>
              setEndDate(
                event.target.value,
              )
            }
            className="rounded-control border border-hairline bg-surface px-3 py-2 text-sm"
          />
        </label>


        <div className="flex items-end gap-2">
          <Button
            loading={loading}
            disabled={!cityId}
            onClick={() =>
              onSubmit({
                city_id: Number(cityId),
                start_date: startDate,
                end_date: endDate,
              })
            }
          >
            Add
          </Button>

          <Button
            variant="ghost"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </div>

      {error && (
        <p className="mt-3 text-sm text-danger">
          {error instanceof ApiError
            ? error.message
            : 'Could not add destination.'}
        </p>
      )}
    </Card>
  )
}


/* ======================================================================== */
/* Stop Builder                                                             */
/* ======================================================================== */

function StopBuilderCard({
  stop,
  activities,
  selectedActivityId,
  dragged,
  deleting,
  onDragStart,
  onDragOver,
  onDrop,
  onDelete,
  onSelectActivity,
  onAddActivity,
  onDeleteActivity,
  optimize,
  optimizing,
}: {
  stop: TripStop
  activities: TripActivity[]
  selectedActivityId: number | null
  dragged: boolean
  deleting: boolean
  onDragStart: () => void
  onDragOver: (
    event: React.DragEvent<HTMLDivElement>,
  ) => void
  onDrop: () => void
  onDelete: () => void
  onSelectActivity: (
    activityId: number | null,
  ) => void
  onAddActivity: (
    activityId: number,
  ) => Promise<void>
  onDeleteActivity: (
    activityId: number,
  ) => void
  optimize: () => void
  optimizing: boolean
}) {
  const activityQuery =
    useQuery({
      queryKey: [
        'city',
        stop.city_id,
        'activities',
      ],
      queryFn: ({ signal }) =>
        api.get<CityActivity[]>(
          `/cities/${stop.city_id}/activities`,
          signal,
        ),
    })

  const availableActivities =
    activityQuery.data ?? []

  return (
    <Card
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={[
        'overflow-hidden transition',
        dragged
          ? 'opacity-50 ring-2 ring-primary'
          : '',
      ].join(' ')}
    >

      {/* Stop header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline p-5">

        <div className="flex items-center gap-4">

          <div className="flex h-10 w-10 shrink-0 cursor-grab items-center justify-center rounded-full bg-primary-tint text-sm font-bold text-primary">
            ☰
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Stop {stop.sequence}
            </p>

            <h3 className="text-xl font-bold text-ink">
              {stop.city.name}
            </h3>

            <p className="text-sm text-muted">
              {stop.city.country.name}
            </p>

            <p className="mt-1 text-xs text-muted">
              {stop.start_date} →{' '}
              {stop.end_date}
            </p>
          </div>
        </div>


        <div className="flex flex-wrap gap-2">

          <Button
            size="sm"
            variant="secondary"
            loading={optimizing}
            onClick={optimize}
          >
            ✨ Optimize day
          </Button>

          <Button
            size="sm"
            variant="ghost"
            disabled={deleting}
            onClick={onDelete}
          >
            Remove
          </Button>

        </div>
      </div>


      {/* Activities */}
      <div className="p-5">

        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="font-semibold text-ink">
              Activities
            </h4>

            <p className="text-xs text-muted">
              Activities are automatically scheduled
              when you add them.
            </p>
          </div>
        </div>


        {activities.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {activities
              .sort(
                (a, b) =>
                  (
                    a.start_time ?? ''
                  ).localeCompare(
                    b.start_time ?? '',
                  ),
              )
              .map(
                (item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-hairline p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {item.activity.name}
                      </p>

                      <p className="text-xs text-muted">
                        {item.start_time ??
                          'Time pending'}{' '}
                        ·{' '}
                        {
                          item.activity
                            .duration_hours
                        }h
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-primary">
                        {formatMoney(
                          item.estimated_cost,
                        )}
                      </span>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          onDeleteActivity(
                            item.id,
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ),
              )}
          </div>
        )}


        {/* Add activity */}
        <div className="mt-4 flex flex-wrap items-end gap-2">

          <label className="min-w-56 flex-1">
            <span className="mb-1 block text-xs font-medium text-muted">
              Add activity
            </span>

            <select
              value={
                selectedActivityId ??
                ''
              }
              onChange={(event) =>
                onSelectActivity(
                  event.target.value
                    ? Number(
                        event.target.value,
                      )
                    : null,
                )
              }
              disabled={
                activityQuery.isPending
              }
              className="w-full rounded-control border border-hairline bg-surface px-3 py-2 text-sm"
            >
              <option value="">
                {activityQuery.isPending
                  ? 'Loading activities…'
                  : 'Choose an activity'}
              </option>

              {availableActivities.map(
                (activity) => (
                  <option
                    key={activity.id}
                    value={activity.id}
                  >
                    {activity.name} ·{' '}
                    {formatMoney(
                      activity.estimated_cost,
                    )}
                  </option>
                ),
              )}
            </select>
          </label>

          <Button
            size="sm"
            disabled={
              selectedActivityId === null
            }
            onClick={() => {
              if (
                selectedActivityId !== null
              ) {
                void onAddActivity(
                  selectedActivityId,
                )
              }
            }}
          >
            Add activity
          </Button>
        </div>

      </div>
    </Card>
  )
}