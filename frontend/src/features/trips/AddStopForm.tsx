import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { listCities } from '@/features/cities/api'
import { ApiError } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import type { Trip } from '@/types/api'

import { createStop } from './api'

/**
 * Adds a city to the itinerary. Dates are clamped to the trip's own range,
 * so a stop cannot fall outside the trip it belongs to.
 */
export function AddStopForm({ trip, onDone }: { trip: Trip; onDone: () => void }) {
  const queryClient = useQueryClient()

  const [cityId, setCityId] = useState('')
  const [startDate, setStartDate] = useState(trip.start_date)
  const [endDate, setEndDate] = useState(trip.start_date)

  const citiesQuery = useQuery({
    queryKey: queryKeys.cities.all,
    queryFn: ({ signal }) => listCities(signal),
    staleTime: 5 * 60_000,
  })

  const mutation = useMutation({
    mutationFn: () =>
      createStop(trip.id, {
        city_id: Number(cityId),
        start_date: startDate,
        end_date: endDate,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.trips.stops(trip.id) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.trips.budget(trip.id) })
      onDone()
    },
  })

  const cityOptions = [
    { value: '', label: 'Choose a city…' },
    ...(citiesQuery.data ?? []).map((city) => ({
      value: String(city.id),
      label: `${city.name}, ${city.country.name}`,
    })),
  ]

  const invalid = !cityId || endDate < startDate

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (!invalid) mutation.mutate()
      }}
    >
      <Select
        label="City"
        value={cityId}
        options={cityOptions}
        onChange={(event) => setCityId(event.target.value)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Arrive"
          type="date"
          min={trip.start_date}
          max={trip.end_date}
          value={startDate}
          onChange={(event) => {
            const value = event.target.value
            setStartDate(value)
            if (endDate < value) setEndDate(value)
          }}
        />
        <Input
          label="Leave"
          type="date"
          min={startDate}
          max={trip.end_date}
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
        />
      </div>

      {mutation.isError && (
        <p role="alert" className="text-sm text-danger">
          {mutation.error instanceof ApiError ? mutation.error.message : 'Could not add the stop.'}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" size="sm" loading={mutation.isPending} disabled={invalid}>
          Add stop
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
