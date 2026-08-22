import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { LoadingState } from '@/components/ui/states'
import { getCityActivities } from '@/features/cities/api'
import { ApiError } from '@/lib/api'
import { formatMoney, toNumber } from '@/lib/money'
import { queryKeys } from '@/lib/queryKeys'
import type { TripStop } from '@/types/api'

import { createTripActivity } from './api'

/**
 * Picks one of the destination's catalogue activities and schedules it inside
 * the stop's own date range.
 */
export function StopActivityPicker({
  tripId,
  stop,
  onDone,
}: {
  tripId: number
  stop: TripStop
  onDone: () => void
}) {
  const queryClient = useQueryClient()

  const [activityId, setActivityId] = useState('')
  const [date, setDate] = useState(stop.start_date)
  const [startTime, setStartTime] = useState('')

  const activitiesQuery = useQuery({
    queryKey: queryKeys.cities.activities(stop.city_id),
    queryFn: ({ signal }) => getCityActivities(stop.city_id, signal),
  })

  const mutation = useMutation({
    mutationFn: () =>
      createTripActivity(tripId, {
        trip_stop_id: stop.id,
        activity_id: Number(activityId),
        activity_date: date,
        start_time: startTime ? `${startTime}:00` : null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.trips.activities(tripId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.trips.budget(tripId) })
      onDone()
    },
  })

  if (activitiesQuery.isPending) return <LoadingState label="Loading activities…" />

  const activities = activitiesQuery.data ?? []

  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted">
        No activities are listed for {stop.city.name} yet.
      </p>
    )
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (activityId) mutation.mutate()
      }}
    >
      <Select
        label={`Activity in ${stop.city.name}`}
        value={activityId}
        options={[
          { value: '', label: 'Choose an activity…' },
          ...activities.map((activity) => ({
            value: String(activity.id),
            label: `${activity.name} — ${
              toNumber(activity.estimated_cost) === 0
                ? 'Free'
                : formatMoney(activity.estimated_cost)
            }`,
          })),
        ]}
        onChange={(event) => setActivityId(event.target.value)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Day"
          type="date"
          min={stop.start_date}
          max={stop.end_date}
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
        <Input
          label="Start time (optional)"
          type="time"
          value={startTime}
          onChange={(event) => setStartTime(event.target.value)}
        />
      </div>

      {mutation.isError && (
        <p role="alert" className="text-sm text-danger">
          {mutation.error instanceof ApiError
            ? mutation.error.message
            : 'Could not add the activity.'}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" size="sm" loading={mutation.isPending} disabled={!activityId}>
          Add to itinerary
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
