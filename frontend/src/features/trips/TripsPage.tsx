import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states'
import { ApiError } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'

import { TripCard } from './TripCard'
import { listTrips } from './api'
import { STATUS_LABEL, STATUS_ORDER, groupByStatus } from './tripStatus'

export function TripsPage() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.trips.all,
    queryFn: ({ signal }) => listTrips(signal),
  })

  const groups = data ? groupByStatus(data) : null

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My Trips</h1>
          <p className="mt-1 text-sm text-muted">
            Everything you have planned, grouped by where it sits in time.
          </p>
        </div>

        <Link to="/trips/new">
          <Button>Plan a trip</Button>
        </Link>
      </header>

      {isPending && <LoadingState label="Loading your trips…" />}

      {isError && (
        <ErrorState
          message={
            error instanceof ApiError ? error.message : 'Could not load your trips.'
          }
          onRetry={() => void refetch()}
        />
      )}

      {groups && data && data.length === 0 && (
        <EmptyState
          title="No trips yet"
          description="Plan your first trip and it will show up here, grouped by status as the dates approach."
          action={
            <Link to="/trips/new">
              <Button>Plan a trip</Button>
            </Link>
          }
        />
      )}

      {groups &&
        STATUS_ORDER.filter((status) => groups[status].length > 0).map((status) => (
          <div key={status} className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              {STATUS_LABEL[status]}
              <span className="ml-2 font-normal normal-case">({groups[status].length})</span>
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {groups[status].map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          </div>
        ))}
    </section>
  )
}
