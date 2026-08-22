import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { createStop, createTrip, listTrips } from '@/features/trips/api'
import { getTripStatus } from '@/features/trips/tripStatus'
import { ApiError } from '@/lib/api'
import { todayISO } from '@/lib/dates'
import { queryKeys } from '@/lib/queryKeys'
import type { City } from '@/types/api'

/**
 * Two ways into planning from a destination:
 *
 * - add it as a stop on a trip that already exists
 * - start a brand new trip built around it
 *
 * Both land in the itinerary builder, so the user carries straight on
 * planning rather than being dropped back on a list.
 */
export function AddCityToTrip({
  city,
  mode,
  onClose,
}: {
  city: City
  mode: 'add' | 'plan'
  onClose: () => void
}) {
  const navigate = useNavigate()

  const [tripId, setTripId] = useState('')
  const [name, setName] = useState(`${city.name} trip`)
  const [startDate, setStartDate] = useState(todayISO())
  const [endDate, setEndDate] = useState(todayISO())

  const tripsQuery = useQuery({
    queryKey: queryKeys.trips.all,
    queryFn: ({ signal }) => listTrips(signal),
    enabled: mode === 'add',
  })

  // Only trips that have not finished can still be planned into.
  const openTrips = (tripsQuery.data ?? []).filter(
    (trip) => getTripStatus(trip) !== 'completed',
  )

  const addToExisting = useMutation({
    mutationFn: async () => {
      const trip = openTrips.find((item) => String(item.id) === tripId)
      if (!trip) throw new Error('Pick a trip')

      // A new stop defaults to the first day of the trip; the builder is
      // where the exact dates get set.
      await createStop(trip.id, {
        city_id: city.id,
        start_date: trip.start_date,
        end_date: trip.start_date,
      })

      return trip.id
    },
    onSuccess: (id) => navigate(`/trips/${id}/build`),
  })

  const planNew = useMutation({
    mutationFn: async () => {
      const trip = await createTrip({
        name: name.trim(),
        start_date: startDate,
        end_date: endDate,
        description: `A trip built around ${city.name}, ${city.country.name}.`,
      })

      await createStop(trip.id, {
        city_id: city.id,
        start_date: startDate,
        end_date: endDate,
      })

      return trip.id
    },
    onSuccess: (id) => navigate(`/trips/${id}/build`),
  })

  const active = mode === 'add' ? addToExisting : planNew

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-medium">
            {mode === 'add' ? `Add ${city.name} to a trip` : `Plan a trip to ${city.name}`}
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            {mode === 'add'
              ? 'Pick a trip that has not finished yet.'
              : 'This creates the trip with this city as its first stop.'}
          </p>
        </div>

        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>

      {mode === 'add' ? (
        openTrips.length === 0 ? (
          <p className="text-sm text-muted">
            You have no open trips. Use “Plan trip” to start one.
          </p>
        ) : (
          <Select
            label="Trip"
            value={tripId}
            options={[
              { value: '', label: 'Choose a trip…' },
              ...openTrips.map((trip) => ({ value: String(trip.id), label: trip.name })),
            ]}
            onChange={(event) => setTripId(event.target.value)}
          />
        )
      ) : (
        <>
          <Input
            label="Trip name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Start date"
              type="date"
              min={todayISO()}
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value)
                if (endDate < event.target.value) setEndDate(event.target.value)
              }}
            />
            <Input
              label="End date"
              type="date"
              min={startDate}
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>
        </>
      )}

      {active.isError && (
        <p role="alert" className="text-sm text-danger">
          {active.error instanceof ApiError ? active.error.message : 'Could not save that.'}
        </p>
      )}

      <div>
        <Button
          loading={active.isPending}
          disabled={mode === 'add' ? !tripId : name.trim().length < 2}
          onClick={() => active.mutate()}
        >
          {mode === 'add' ? 'Add to trip' : 'Create trip'}
        </Button>
      </div>
    </Card>
  )
}
